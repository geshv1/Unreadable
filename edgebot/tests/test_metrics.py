import math

import numpy as np
import pandas as pd

from edgebot.backtest.metrics import bootstrap_ci, clv_stats, edge_bucket, max_drawdown, roi_stats, verdict


def _bets(pnl, stake, clv=None):
    n = len(pnl)
    return pd.DataFrame(
        {
            "pnl": pnl,
            "stake": stake,
            "status": ["won" if p > 0 else "lost" for p in pnl],
            "clv": clv if clv is not None else [np.nan] * n,
            "clv_gross": clv if clv is not None else [np.nan] * n,
        }
    )


def test_bootstrap_ci_brackets_the_mean():
    rng = np.random.default_rng(0)
    x = rng.normal(0.02, 0.1, 2000)
    lo, hi = bootstrap_ci(x, lambda s: s.mean(axis=-1), 500, rng)
    assert lo < x.mean() < hi
    assert hi - lo < 0.02


def test_roi_and_ci():
    b = _bets([10, -10, 10, -10, 5], [10, 10, 10, 10, 5])
    r = roi_stats(b, 300, np.random.default_rng(1))
    assert r["roi"] == 5 / 45
    assert r["roi_ci"][0] < r["roi"] < r["roi_ci"][1]
    assert r["hit_rate"] == 0.6


def test_clv_stats():
    b = _bets([1, -1, 1], [1, 1, 1], clv=[0.02, 0.01, 0.03])
    c = clv_stats(b, 200, np.random.default_rng(2))
    assert math.isclose(c["clv"], 0.02)
    assert c["beat_close"] == 1.0


def test_max_drawdown():
    curve = pd.DataFrame({"bankroll": [1100, 880, 990, 1200]})
    assert math.isclose(max_drawdown(curve, 1000), 0.2)


def test_verdicts_are_honest():
    small = {"n": 10, "roi_ci": (0.1, 0.2), "clv_clv_ci": (0.01, 0.02)}
    assert verdict(small, 300)[0] == "NOT ENOUGH DATA"
    bad = {"n": 500, "roi_ci": (-0.1, -0.01), "clv_clv_ci": (-0.02, 0.01)}
    assert verdict(bad, 300)[0] == "NO EDGE"
    luck = {"n": 500, "roi_ci": (-0.05, 0.08), "clv_clv_ci": (-0.01, 0.01)}
    assert verdict(luck, 300)[0] == "NO CLEAR EDGE"
    clv = {"n": 500, "roi_ci": (-0.05, 0.08), "clv_clv_ci": (0.005, 0.02)}
    assert verdict(clv, 300)[0] == "BEATS THE CLOSE, PROFIT NOT PROVEN"
    good = {"n": 500, "roi_ci": (0.01, 0.08), "clv_clv_ci": (0.005, 0.02)}
    short, text = verdict(good, 300)
    assert short == "PROMISING" and "not proof" in text


def test_edge_buckets():
    assert edge_bucket(0.035) == "3–5%"
    assert edge_bucket(0.06) == "5–8%"
    assert edge_bucket(0.2) == "8%+"
