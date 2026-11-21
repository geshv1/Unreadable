"""One call that runs a full, honest backtest from the settings file."""
from __future__ import annotations

import json
import math
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import pandas as pd

from ..config import data_dir as default_data_dir
from ..config import reports_dir as default_reports_dir
from ..core import MARKETS, outcome_index
from ..data import football_data_uk
from ..data.base import Dataset
from ..data.prices import PriceIndex
from ..data.sample import generate_sample
from ..models.dixon_coles import DCParams, walk_forward_predictions
from ..pricing.devig import compare_methods
from ..staking.risk import RiskParams
from ..strategies import MarketValueStrategy, ModelBlendStrategy, StrategyParams
from ..timing.analyzer import closing_fair_table, price_value_table, recommend_windows, timing_summary
from .benchmark import model_benchmark
from .engine import Backtester, BacktestResult, BacktestSettings
from .metrics import summarize, verdict
from .registry import HoldoutGuard, count_variants, fingerprint, log_variant, variant_settings
from .report import render_report


@dataclass
class Periods:
    warmup_end: datetime
    holdout_start: datetime
    start: datetime
    end: datetime | None
    mode: str


@dataclass
class BacktestRun:
    result: BacktestResult
    summary: dict
    benchmark: dict
    devig: dict
    timing: pd.DataFrame
    timing_recs: dict
    periods: Periods
    dataset: Dataset
    report: str
    out_dir: Path | None = None
    variants_tested: int = 0
    extra: dict = field(default_factory=dict)


def load_data(cfg: dict, source: str, data_dir: Path) -> Dataset:
    b = cfg["backtest"]
    if source == "sample":
        return generate_sample(seed=7, result_delay_minutes=int(b["result_delay_minutes"]))
    if source == "football_data":
        return football_data_uk.load(list(b["leagues"]), list(b["seasons"]), data_dir, int(b["result_delay_minutes"]))
    raise ValueError(f"unknown data source '{source}' (use sample or football_data)")


def compute_periods(ds: Dataset, cfg: dict, mode: str) -> Periods:
    seasons = ds.matches.groupby("season")["kickoff"].min().sort_values()
    warm = int(cfg["backtest"]["warmup_seasons"])
    if len(seasons) <= warm:
        raise ValueError("not enough seasons: need more seasons than warm-up seasons")
    warmup_end = (seasons.iloc[warm] - pd.Timedelta(days=7)).to_pydatetime()
    holdout_start = pd.Timestamp(cfg["holdout"]["start"], tz="UTC").to_pydatetime()
    if mode == "holdout":
        return Periods(warmup_end, holdout_start, holdout_start, None, mode)
    return Periods(warmup_end, holdout_start, warmup_end, holdout_start, mode)


def closing_reference_odds(ds: Dataset, sharp: list[str], market: str, before: datetime) -> tuple[np.ndarray, np.ndarray]:
    """Raw closing odds of reference books + outcomes, for matches before `before` (warm-up only)."""
    m = ds.matches[(ds.matches["kickoff"] < before) & ds.matches["home_goals"].notna()]
    o = ds.odds[(ds.odds["market"] == market) & ds.odds["bookmaker"].isin(sharp) & ds.odds["match_id"].isin(m["match_id"])]
    if o.empty:
        return np.empty((0, len(MARKETS[market]))), np.empty(0, dtype=int)
    last = o.groupby(["match_id", "bookmaker"])["captured_at"].transform("max")
    o = o[o["captured_at"] == last]
    wide = o.pivot_table(index=["match_id", "bookmaker"], columns="selection", values="odds", aggfunc="last")
    wide = wide[list(MARKETS[market])].dropna()
    goals = m.set_index("match_id")[["home_goals", "away_goals"]]
    mids = wide.index.get_level_values("match_id")
    y = np.array([outcome_index(market, int(goals.at[mid, "home_goals"]), int(goals.at[mid, "away_goals"])) for mid in mids])
    return wide.to_numpy(float), y


def choose_devig(ds: Dataset, cfg: dict, before: datetime) -> dict:
    method = cfg["pricing"]["devig_method"]
    scores: dict[str, dict] = {}
    for market in cfg["football"]["markets"]:
        X, y = closing_reference_odds(ds, list(cfg["bookmakers"]["sharp"]), market, before)
        if len(X) >= 100:
            scores[market] = compare_methods(X, y)
    if method != "auto":
        return {"method": method, "chosen_by": "settings", "scores": scores}
    if not scores:
        return {"method": "multiplicative", "chosen_by": "default (not enough warm-up data)", "scores": scores}
    totals: dict[str, float] = {}
    for market, res in scores.items():
        for name, r in res.items():
            totals[name] = totals.get(name, 0.0) + r["log_loss"] * r["n"]
    best = min(totals, key=totals.get)
    return {"method": best, "chosen_by": "lowest log loss on warm-up closing prices", "scores": scores}


def run_backtest(
    cfg: dict,
    source: str | None = None,
    mode: str = "dev",
    data_dir: Path | None = None,
    reports_dir: Path | None = None,
    dataset: Dataset | None = None,
    save: bool = True,
    benchmark: bool = True,
    log: bool = True,
) -> BacktestRun:
    source = source or cfg["backtest"]["source"]
    data_dir = Path(data_dir or default_data_dir())
    guard = HoldoutGuard(data_dir / "holdout_used.json", source)
    if mode == "holdout":
        guard.assert_unused()
    ds = dataset or load_data(cfg, source, data_dir)
    periods = compute_periods(ds, cfg, mode)
    devig_info = choose_devig(ds, cfg, periods.warmup_end)

    sparams = StrategyParams.from_config(cfg)
    books = set(sparams.playable) | set(sparams.sharp)
    prices = PriceIndex(ds.odds[ds.odds["bookmaker"].isin(books)], sparams.sharp, devig_info["method"])

    lat = timedelta(seconds=float(cfg["backtest"]["decision_latency_seconds"]))
    anchors = {}
    for mid in prices.match_ids():
        times = prices.snapshot_times(mid)
        if times:
            anchors[mid] = times[0] + lat
    need_model = benchmark or cfg["strategy"]["name"] == "model_blend"
    predictions = walk_forward_predictions(ds.matches, anchors, DCParams.from_config(cfg)) if need_model else {}

    if cfg["strategy"]["name"] == "model_blend":
        strategy = ModelBlendStrategy(sparams, predictions)
    else:
        strategy = MarketValueStrategy(sparams)

    settings = BacktestSettings.from_config(cfg, periods.start, periods.end)
    result = Backtester(ds, strategy, prices, settings, RiskParams.from_config(cfg)).run()

    b = cfg["backtest"]
    summary = summarize(result, int(b["bootstrap_samples"]), int(b["seed"]), int(b["min_bets_for_verdict"]))
    bench = (
        model_benchmark(ds.matches, prices, predictions, sparams.sharp_weights, sparams.model_weight,
                        periods.start, periods.end, int(b["bootstrap_samples"]), int(b["seed"]))
        if benchmark else {}
    )

    mask = ds.matches["kickoff"] >= periods.start
    if periods.end is not None:
        mask &= ds.matches["kickoff"] < periods.end
    in_period = ds.matches[mask]
    close = closing_fair_table(in_period, prices, sparams.sharp_weights, sparams.markets)
    values = price_value_table(in_period, ds.odds, close, sparams.playable, sparams.commission, settings.timing_edges)
    timing = timing_summary(values, settings.timing_edges)
    recs = recommend_windows(timing)

    fp = fingerprint(variant_settings(cfg))
    vlog = data_dir / "variants_log.jsonl"
    v_short, v_text = verdict({**summary["singles"]}, int(b["min_bets_for_verdict"]))
    if log:
        s = summary["singles"]
        log_variant(
            vlog,
            {
                "at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "fingerprint": fp, "source": source,
                "mode": mode, "strategy": cfg["strategy"]["name"], "devig": devig_info["method"],
                "edge_threshold": cfg["strategy"]["edge_threshold"], "risk": cfg["risk"]["level"],
                "bets": s["n"], "roi": s["roi"], "roi_ci": s["roi_ci"], "clv": s.get("clv_clv"),
                "clv_ci": s.get("clv_clv_ci"), "verdict": v_short,
            },
        )
    n_variants = count_variants(vlog, source)
    run = BacktestRun(result, summary, bench, devig_info, timing, recs, periods, ds, "", None, n_variants)
    run.extra["snapshots_per_match"] = float(ds.odds.groupby("match_id")["captured_at"].nunique().median())
    run.report = render_report(run, cfg, source, fp)
    if mode == "holdout":
        guard.mark_used({"fingerprint": fp, "verdict": v_short, "bets": summary["singles"]["n"]})
    if save:
        run.out_dir = save_outputs(run, cfg, source, mode, Path(reports_dir or default_reports_dir()))
    return run


def _json_safe(obj):
    if isinstance(obj, dict):
        return {str(k): _json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_json_safe(v) for v in obj]
    if isinstance(obj, pd.DataFrame):
        return obj.to_dict(orient="records")
    if isinstance(obj, (np.floating, float)):
        return None if math.isnan(float(obj)) else float(obj)
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, (datetime, pd.Timestamp)):
        return obj.isoformat()
    return obj


def save_outputs(run: BacktestRun, cfg: dict, source: str, mode: str, reports_dir: Path) -> Path:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    out = reports_dir / f"backtest-{source}-{cfg['strategy']['name']}-{mode}-{stamp}"
    out.mkdir(parents=True, exist_ok=True)
    (out / "report.txt").write_text(run.report, encoding="utf-8")
    (out / "summary.json").write_text(
        json.dumps(_json_safe({"summary": run.summary, "benchmark": run.benchmark, "devig": run.devig,
                               "timing_recommendations": {f"{k[0]}|{k[1]}": v for k, v in run.timing_recs.items()}}),
                   indent=2),
        encoding="utf-8",
    )
    if len(run.result.bets):
        run.result.bets.drop(columns=["legs"]).to_csv(out / "bets.csv", index=False)
    if len(run.result.audit):
        run.result.audit.to_csv(out / "audit_log.csv", index=False)
    run.timing.to_csv(out / "timing.csv", index=False)
    return out
