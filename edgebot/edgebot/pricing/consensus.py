"""Combine several sharp references into one fair price, and measure edges against it."""
from __future__ import annotations

from typing import Mapping

import numpy as np


def sharp_consensus(fair_by_book: Mapping[str, np.ndarray | None], weights: Mapping[str, float]) -> tuple[np.ndarray | None, tuple[str, ...]]:
    """Weighted average of de-vigged probabilities. Missing books are skipped and weights re-normalised."""
    acc = None
    total = 0.0
    used: list[str] = []
    for book, p in fair_by_book.items():
        if p is None:
            continue
        arr = np.asarray(p, dtype=float)
        if not np.all(np.isfinite(arr)):
            continue
        w = float(weights.get(book, 1.0))
        if w <= 0:
            continue
        acc = arr * w if acc is None else acc + arr * w
        total += w
        used.append(book)
    if acc is None or total <= 0:
        return None, ()
    p = acc / total
    return p / p.sum(), tuple(used)


def effective_odds(odds: float, commission: float = 0.0) -> float:
    """Odds after exchange commission on winnings."""
    return 1.0 + (odds - 1.0) * (1.0 - commission)


def fair_odds(p: float) -> float:
    return 1.0 / p


def edge(p: float, eff_odds: float) -> float:
    """Expected profit per 1 staked: 0.05 = 5% better than fair."""
    return p * eff_odds - 1.0


def log_pool(p_model: np.ndarray, p_market: np.ndarray, model_weight: float) -> np.ndarray:
    """Blend two probability vectors in log space (geometric pooling), renormalised."""
    pm = np.clip(np.asarray(p_model, dtype=float), 1e-9, 1.0)
    pk = np.clip(np.asarray(p_market, dtype=float), 1e-9, 1.0)
    w = float(model_weight)
    out = np.exp(w * np.log(pm) + (1.0 - w) * np.log(pk))
    return out / out.sum()
