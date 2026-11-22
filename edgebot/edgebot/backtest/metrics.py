"""Honest statistics: ROI and CLV with bootstrapped 95% ranges, drawdown, breakdowns."""
from __future__ import annotations

import math

import numpy as np
import pandas as pd

EDGE_BUCKETS = [(0.0, 0.03, "under 3%"), (0.03, 0.05, "3–5%"), (0.05, 0.08, "5–8%"), (0.08, 10.0, "8%+")]


def bootstrap_ci(values: np.ndarray, stat, n_boot: int, rng: np.random.Generator, alpha: float = 0.05) -> tuple[float, float]:
    values = np.asarray(values)
    n = len(values)
    if n < 2:
        return (math.nan, math.nan)
    idx = rng.integers(0, n, size=(n_boot, n))
    stats = stat(values[idx])
    return float(np.quantile(stats, alpha / 2)), float(np.quantile(stats, 1 - alpha / 2))


def roi_stats(bets: pd.DataFrame, n_boot: int, rng: np.random.Generator) -> dict:
    settled = bets[bets["status"].isin(["won", "lost"])] if len(bets) else bets
    n = len(settled)
    if n == 0:
        return {"n": 0, "staked": 0.0, "pnl": 0.0, "roi": math.nan, "roi_ci": (math.nan, math.nan), "hit_rate": math.nan}
    stake = settled["stake"].to_numpy(float)
    pnl = settled["pnl"].to_numpy(float)
    pairs = np.stack([pnl, stake], axis=1)
    lo, hi = bootstrap_ci(pairs, lambda s: s[..., 0].sum(axis=-1) / s[..., 1].sum(axis=-1), n_boot, rng)
    return {
        "n": n,
        "staked": float(stake.sum()),
        "pnl": float(pnl.sum()),
        "roi": float(pnl.sum() / stake.sum()),
        "roi_ci": (lo, hi),
        "hit_rate": float((settled["status"] == "won").mean()),
    }


def clv_stats(bets: pd.DataFrame, n_boot: int, rng: np.random.Generator) -> dict:
    """CLV vs the de-vigged sharp closing price, only for bets priced BEFORE that closing price."""
    empty = {"n": 0, "clv": math.nan, "clv_ci": (math.nan, math.nan), "clv_gross": math.nan, "beat_close": math.nan, "excluded": 0}
    if len(bets) == 0 or "clv" not in bets:
        return empty
    has = bets["clv"].notna()
    usable = has & bets["clv_informative"].fillna(False).astype(bool) if "clv_informative" in bets else has
    excluded = int((has & ~usable).sum())
    clv = bets.loc[usable, "clv"].to_numpy(float)
    if len(clv) == 0:
        return {**empty, "excluded": excluded}
    lo, hi = bootstrap_ci(clv, lambda s: s.mean(axis=-1), n_boot, rng)
    return {
        "n": int(len(clv)),
        "clv": float(clv.mean()),
        "clv_ci": (lo, hi),
        "clv_gross": float(bets.loc[usable, "clv_gross"].mean()),
        "beat_close": float((clv > 0).mean()),
        "excluded": excluded,
    }


def max_drawdown(curve: pd.DataFrame, start_bankroll: float) -> float:
    if curve is None or curve.empty:
        return 0.0
    values = np.concatenate([[start_bankroll], curve["bankroll"].to_numpy(float)])
    peaks = np.maximum.accumulate(values)
    return float(np.max(1.0 - values / peaks))


def breakdown(bets: pd.DataFrame, by: str | list[str], n_boot: int, rng: np.random.Generator, min_n: int = 1) -> pd.DataFrame:
    rows = []
    if len(bets) == 0:
        return pd.DataFrame()
    for key, g in bets.groupby(by):
        r = roi_stats(g, n_boot, rng)
        c = clv_stats(g, n_boot, rng)
        if r["n"] < min_n:
            continue
        rows.append(
            {
                "group": key if isinstance(key, str) else " · ".join(map(str, key)) if isinstance(key, tuple) else key,
                "bets": r["n"], "staked": r["staked"], "profit": r["pnl"], "roi": r["roi"],
                "roi_lo": r["roi_ci"][0], "roi_hi": r["roi_ci"][1], "clv": c["clv"],
                "clv_lo": c["clv_ci"][0], "clv_hi": c["clv_ci"][1], "hit_rate": r["hit_rate"],
            }
        )
    return pd.DataFrame(rows)


def edge_bucket(edge: float) -> str:
    for lo, hi, label in EDGE_BUCKETS:
        if lo <= edge < hi:
            return label
    return EDGE_BUCKETS[-1][2]


def summarize(result, n_boot: int = 2000, seed: int = 0, min_bets: int = 300) -> dict:
    rng = np.random.default_rng(seed)
    bets = result.bets
    singles = bets[bets["kind"] == "single"] if len(bets) else bets
    parlays = bets[bets["kind"] == "parlay"] if len(bets) else bets
    out = {
        "strategy": result.strategy,
        "start_bankroll": result.start_bankroll,
        "end_bankroll": result.end_bankroll,
        "decisions": result.decisions,
        "max_drawdown": max_drawdown(result.curve, result.start_bankroll),
        "pauses": len(result.pauses),
        "singles": {**roi_stats(singles, n_boot, rng), **{"clv_" + k: v for k, v in clv_stats(singles, n_boot, rng).items()}},
        "parlays": {**roi_stats(parlays, n_boot, rng), **{"clv_" + k: v for k, v in clv_stats(parlays, n_boot, rng).items()}},
        "min_bets": min_bets,
    }
    if len(parlays):
        out["parlays"]["avg_legs"] = float(parlays["n_legs"].mean())
        out["parlays"]["avg_compounded_margin"] = float(parlays["compounded_margin"].mean())
        out["parlays"]["avg_offered_odds"] = float(parlays["quoted_odds"].mean())
        out["parlays"]["avg_fair_odds"] = float(parlays["fair_odds"].mean())
    if len(singles):
        s = singles.copy()
        s["edge_bucket"] = s["edge"].map(edge_bucket)
        out["by_edge"] = breakdown(s, "edge_bucket", n_boot, rng)
        out["by_league_market"] = breakdown(s, ["league", "market"], n_boot, rng)
        out["by_timing"] = breakdown(s, "timing_bucket", n_boot, rng)
        out["by_bookmaker"] = breakdown(s, "bookmaker", n_boot, rng)
        out["requested_stake"] = float(s["requested_stake"].sum())
        out["accepted_stake"] = float(s["stake"].sum())
        out["limited_bets"] = int(s["account_limited"].sum())
    return out


def verdict(stats: dict, min_bets: int) -> tuple[str, str]:
    """(short verdict, plain-language explanation) — never claims more than the numbers show."""
    n = stats["n"]
    if n < min_bets:
        return "NOT ENOUGH DATA", f"Only {n} settled bets; at least {min_bets} are needed before judging anything."
    roi_lo, roi_hi = stats["roi_ci"]
    clv_lo, clv_hi = stats.get("clv_clv_ci", (math.nan, math.nan))
    if clv_hi < 0 or roi_hi < 0:
        return "NO EDGE", "The bets lost value against the closing price and/or lost money. Do not bet this setup."
    if clv_lo > 0 and roi_lo > 0:
        return "PROMISING", (
            "Beat the closing price and made money, both with 95% ranges above zero. "
            "A backtest alone is not proof — it still has to pass paper trading."
        )
    if clv_lo > 0:
        return "BEATS THE CLOSE, PROFIT NOT PROVEN", (
            "Prices taken were consistently better than the final fair price (a good sign), "
            "but profit is still within luck's range at this sample size."
        )
    return "NO CLEAR EDGE", "Results are within what luck alone could produce. Not a reason to bet."
