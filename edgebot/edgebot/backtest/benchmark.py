"""Does our own model add anything over the market? Out-of-sample log loss and Brier.

Compared on the same matches, at the same moment (first available reference price):
  market   = de-vigged sharp price at that time
  model    = walk-forward Dixon–Coles prediction (refitted before that time)
  blend    = model blended with the market (Strategy B's probability)
  close    = de-vigged sharp closing price (shown for reference; usually the best)
If the blend does not beat the market with a 95% range above zero, the model adds nothing
and the bot should use Strategy A only.
"""
from __future__ import annotations

import math
from datetime import datetime
from typing import Mapping

import numpy as np
import pandas as pd

from ..core import MARKETS, outcome_index
from ..data.prices import PriceIndex
from ..models.dixon_coles import Prediction
from ..pricing.consensus import log_pool
from .metrics import bootstrap_ci


def model_benchmark(
    matches: pd.DataFrame,
    prices: PriceIndex,
    predictions: Mapping[str, Prediction],
    weights: Mapping[str, float],
    model_weight: float,
    start: datetime | None,
    end: datetime | None,
    n_boot: int = 2000,
    seed: int = 0,
) -> dict[str, dict]:
    rng = np.random.default_rng(seed)
    out: dict[str, dict] = {}
    done = matches[matches["home_goals"].notna()]
    for market in MARKETS:
        rows = []
        for r in done.itertuples(index=False):
            ko = r.kickoff.to_pydatetime()
            if start is not None and ko < start or end is not None and ko >= end:
                continue
            pred = predictions.get(r.match_id)
            if pred is None:
                continue
            p_open, _, ts = prices.opening_fair(r.match_id, market, weights)
            if p_open is None or pred.fitted_at > ts or pred.trained_until >= ts:
                continue
            p_close, _, _ = prices.closing_fair(r.match_id, market, ko, weights)
            if p_close is None:
                continue
            y = outcome_index(market, int(r.home_goals), int(r.away_goals))
            p_model = pred.probs[market]
            p_blend = log_pool(p_model, p_open, model_weight)
            rows.append([-math.log(max(p[y], 1e-12)) for p in (p_open, p_model, p_blend, p_close)])
        if not rows:
            out[market] = {"n": 0}
            continue
        ll = np.array(rows)
        diff_blend = ll[:, 0] - ll[:, 2]  # > 0 means blend better than market
        diff_model = ll[:, 0] - ll[:, 1]
        lo, hi = bootstrap_ci(diff_blend, lambda s: s.mean(axis=-1), n_boot, rng)
        mlo, mhi = bootstrap_ci(diff_model, lambda s: s.mean(axis=-1), n_boot, rng)
        adds_value = lo > 0
        out[market] = {
            "n": int(len(ll)),
            "log_loss_market": float(ll[:, 0].mean()),
            "log_loss_model": float(ll[:, 1].mean()),
            "log_loss_blend": float(ll[:, 2].mean()),
            "log_loss_close": float(ll[:, 3].mean()),
            "blend_gain": float(diff_blend.mean()),
            "blend_gain_ci": (lo, hi),
            "model_gain": float(diff_model.mean()),
            "model_gain_ci": (mlo, mhi),
            "model_adds_value": bool(adds_value),
        }
    return out
