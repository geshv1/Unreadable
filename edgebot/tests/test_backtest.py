import re

import numpy as np
import pandas as pd
import pytest

from edgebot.backtest.engine import Backtester, BacktestSettings
from edgebot.backtest.registry import HoldoutAlreadyUsed, read_variants
from edgebot.backtest.runner import run_backtest
from edgebot.data.base import Dataset
from edgebot.data.prices import PriceIndex
from edgebot.parlays.builder import ParlayParams
from edgebot.staking.risk import RiskParams
from edgebot.strategies import MarketValueStrategy, StrategyParams


def _run(ds, **kw):
    params = StrategyParams()
    settings = BacktestSettings(bankroll=1000.0, parlay=ParlayParams(enabled=True), **kw)
    return Backtester(ds, MarketValueStrategy(params), PriceIndex(ds.odds, params.sharp), settings, RiskParams()).run()


def test_backtest_respects_every_rule(small_sample):
    res = _run(small_sample)
    bets = res.bets
    singles = bets[bets["kind"] == "single"]
    parlays = bets[bets["kind"] == "parlay"]
    assert len(singles) > 20
    # only your own licensed bookmakers
    assert set(bets["bookmaker"]) <= set(StrategyParams().playable)
    # every single passed the threshold at the quoted price
    assert (singles["edge"] >= 0.03).all()
    # one single per match
    assert not singles["match_ids"].duplicated().any()
    # pessimistic fills: 1–2% worse than quoted
    ratio = singles["fill_odds"] / singles["quoted_odds"]
    assert ((ratio <= 0.99 + 1e-9) & (ratio >= 0.98 - 1e-9)).all()
    # per-bet cap: 1.5% of the highest bankroll ever reached
    peak = max(1000.0, res.curve["bankroll"].max())
    assert (singles["stake"] <= 0.015 * peak + 1e-9).all()
    if len(parlays):
        assert (parlays["stake"] <= 0.005 * peak + 1e-9).all()
        assert (parlays["n_legs"] <= 3).all()
    # time for a person to place it: at least 15 minutes before kick-off
    lead = pd.to_datetime(bets["kickoff"], utc=True) - pd.to_datetime(bets["placed_at"], utc=True)
    assert (lead >= pd.Timedelta(minutes=15)).all()
    # every bet settled, CLV measured against a LATER closing price
    assert set(bets["status"]) <= {"won", "lost", "void"}
    assert singles["clv"].notna().mean() > 0.95
    assert singles["clv_informative"].all()
    # audit log explains decisions and refusals happen
    assert {"BET", "SKIP"} <= set(res.audit["action"])
    assert (res.audit["action"] == "REFUSED").any()


def test_daily_exposure_never_exceeds_ten_percent(small_sample):
    res = _run(small_sample)
    bets = res.bets.copy()
    bets["day"] = pd.to_datetime(bets["placed_at"], utc=True).dt.tz_convert("Europe/Sofia").dt.date
    peak = max(1000.0, res.curve["bankroll"].max())
    assert (bets.groupby("day")["stake"].sum() <= 0.10 * peak + 1e-6).all()


def test_clv_at_the_closing_snapshot_is_not_counted(small_sample):
    """With no buffer, bets priced at the closing snapshot itself must be left out of CLV."""
    from edgebot.backtest.metrics import clv_stats

    res = _run(small_sample, min_minutes_before_kickoff=0)
    singles = res.bets[res.bets["kind"] == "single"]
    at_close = singles["hours_before_ko"] < 0.1
    assert at_close.any()
    assert not singles.loc[at_close, "clv_informative"].any()
    stats = clv_stats(singles, 100, np.random.default_rng(0))
    assert stats["excluded"] == int((at_close & singles["clv"].notna()).sum())


def test_same_seed_same_result(small_sample):
    a, b = _run(small_sample), _run(small_sample)
    pd.testing.assert_frame_equal(a.bets.drop(columns=["legs"]), b.bets.drop(columns=["legs"]))


def test_no_edge_means_no_bet(small_sample):
    """Soft books that simply copy the sharp price plus a margin must produce zero bets."""
    o = small_sample.odds
    sharp = o[o["bookmaker"] == "pinnacle"].copy()
    fair = sharp.groupby(["match_id", "market", "captured_at"])["odds"].transform(lambda s: (1 / s).sum())
    soft = sharp.copy()
    soft["odds"] = np.round(sharp["odds"] * fair / 1.06, 3)  # de-vigged multiplicatively, then a 6% margin
    soft["bookmaker"] = "bet365"
    ds = Dataset(small_sample.matches, pd.concat([sharp, soft]), "no-edge", True)
    params = StrategyParams(sharp=("pinnacle",), sharp_weights={"pinnacle": 1.0})
    settings = BacktestSettings(bankroll=1000.0)
    res = Backtester(ds, MarketValueStrategy(params), PriceIndex(ds.odds, params.sharp), settings, RiskParams()).run()
    assert len(res.bets) == 0
    assert (res.audit["action"] == "SKIP").all()


def test_runner_report_holdout_and_variant_log(small_sample, cfg, tmp_path):
    run = run_backtest(cfg, source="sample", dataset=small_sample, data_dir=tmp_path, reports_dir=tmp_path / "r")
    assert "SAMPLE (SYNTHETIC) DATA" in run.report
    assert "VERDICT:" in run.report
    assert "DOES OUR OWN MODEL ADD ANYTHING" in run.report
    assert (run.out_dir / "report.txt").exists() and (run.out_dir / "bets.csv").exists()
    assert len(read_variants(tmp_path / "variants_log.jsonl")) == 1
    # the sealed final test runs once, then refuses
    hold = run_backtest(cfg, source="sample", dataset=small_sample, mode="holdout", data_dir=tmp_path, save=False)
    placed = pd.to_datetime(hold.result.bets["placed_at"], utc=True)
    assert (placed >= hold.periods.holdout_start).all()
    with pytest.raises(HoldoutAlreadyUsed):
        run_backtest(cfg, source="sample", dataset=small_sample, mode="holdout", data_dir=tmp_path, save=False)


def test_strategy_b_runs(small_sample, cfg, tmp_path):
    cfg["strategy"]["name"] = "model_blend"
    run = run_backtest(cfg, source="sample", dataset=small_sample, data_dir=tmp_path, save=False)
    assert run.result.strategy == "model_blend"
    if len(run.result.bets):
        singles = run.result.bets[run.result.bets["kind"] == "single"]
        assert singles["p_model"].notna().all()
        # staking probability is shrunk toward the market
        assert ((singles["p_stake"] - singles["p_final"]).abs() <= (singles["p_final"]).abs()).all()


def test_pick_sheet(small_sample):
    from datetime import timedelta

    from edgebot.picks import make_picks

    params = StrategyParams()
    prices = PriceIndex(small_sample.odds, params.sharp)
    kickoffs = small_sample.matches["kickoff"].sort_values().unique()
    found_bets = False
    for ko in kickoffs[10:40]:
        at = (pd.Timestamp(ko) - pd.Timedelta(hours=24) + pd.Timedelta(minutes=1)).to_pydatetime()
        sheet = make_picks(small_sample, prices, MarketValueStrategy(params), RiskParams(), ParlayParams(), 1000.0, at,
                           horizon_hours=30, max_age_s=600)
        text = sheet.render()
        assert "[PAPER]" in text
        if sheet.picks:
            found_bets = True
            assert "bet" in text and "Place before" in text and "skip it" in text
            assert all(p.stake <= 15 for p in sheet.picks)
            assert all(p.place_before <= p.candidate.kickoff - timedelta(minutes=15) for p in sheet.picks)
            assert all(p.min_odds <= p.candidate.odds for p in sheet.picks)
        else:
            assert "No bets today — no edge found. Bankroll protected." in text
        if sheet.parlay is None:
            assert "No parlay today." in text
        else:
            assert sheet.parlay_stake <= 5
    assert found_bets
