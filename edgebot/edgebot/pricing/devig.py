"""Remove the bookmaker's margin ("vig") from a set of odds.

All functions accept one market (1-D array of decimal odds) or many markets at once
(2-D array, one market per row) and return probabilities that sum to 1 per row.
Rows containing NaN give NaN.
"""
from __future__ import annotations

from typing import Callable

import numpy as np

_ITERS = 80


def _prep(odds) -> tuple[np.ndarray, bool]:
    arr = np.asarray(odds, dtype=float)
    single = arr.ndim == 1
    if single:
        arr = arr.reshape(1, -1)
    if arr.ndim != 2 or arr.shape[1] < 2:
        raise ValueError("odds must be shape (k,) or (n, k) with k >= 2")
    return arr, single


def _out(p: np.ndarray, single: bool) -> np.ndarray:
    return p[0] if single else p


def implied_probs(odds) -> np.ndarray:
    return 1.0 / np.asarray(odds, dtype=float)


def overround(odds) -> np.ndarray | float:
    """Bookmaker margin: sum of implied probabilities minus 1 (0.05 = 5%)."""
    arr, single = _prep(odds)
    r = (1.0 / arr).sum(axis=1) - 1.0
    return float(r[0]) if single else r


def devig_multiplicative(odds) -> np.ndarray:
    arr, single = _prep(odds)
    q = 1.0 / arr
    return _out(q / q.sum(axis=1, keepdims=True), single)


def devig_additive(odds) -> np.ndarray:
    arr, single = _prep(odds)
    q = 1.0 / arr
    k = q.shape[1]
    p = q - (q.sum(axis=1, keepdims=True) - 1.0) / k
    p = np.clip(p, 1e-9, None)
    return _out(p / p.sum(axis=1, keepdims=True), single)


def devig_power(odds) -> np.ndarray:
    """Find k with sum(q_i ** k) = 1. Puts more of the margin on long shots."""
    arr, single = _prep(odds)
    q = 1.0 / arr
    n = q.shape[0]
    lo = np.full(n, 0.05)
    hi = np.full(n, 20.0)
    for _ in range(_ITERS):
        mid = 0.5 * (lo + hi)
        s = (q ** mid[:, None]).sum(axis=1)
        need_bigger = s > 1.0
        lo = np.where(need_bigger, mid, lo)
        hi = np.where(need_bigger, hi, mid)
    k = 0.5 * (lo + hi)
    p = q ** k[:, None]
    return _out(p / p.sum(axis=1, keepdims=True), single)


def devig_shin(odds) -> np.ndarray:
    """Shin (1993): margin explained by a share z of insider money."""
    arr, single = _prep(odds)
    q = 1.0 / arr
    s = q.sum(axis=1)

    def probs(z: np.ndarray) -> np.ndarray:
        zz = z[:, None]
        return (np.sqrt(zz**2 + 4.0 * (1.0 - zz) * q**2 / s[:, None]) - zz) / (2.0 * (1.0 - zz))

    n = q.shape[0]
    lo = np.zeros(n)
    hi = np.full(n, 0.99)
    for _ in range(_ITERS):
        mid = 0.5 * (lo + hi)
        tot = probs(mid).sum(axis=1)
        need_bigger = tot > 1.0
        lo = np.where(need_bigger, mid, lo)
        hi = np.where(need_bigger, hi, mid)
    p = probs(0.5 * (lo + hi))
    p = p / p.sum(axis=1, keepdims=True)
    no_margin = s <= 1.0
    if np.any(no_margin):
        p[no_margin] = q[no_margin] / s[no_margin, None]
    return _out(p, single)


DEVIG_METHODS: dict[str, Callable[[np.ndarray], np.ndarray]] = {
    "multiplicative": devig_multiplicative,
    "additive": devig_additive,
    "power": devig_power,
    "shin": devig_shin,
}


def devig(odds, method: str = "multiplicative") -> np.ndarray:
    try:
        fn = DEVIG_METHODS[method]
    except KeyError as exc:
        raise ValueError(f"unknown de-vig method '{method}'") from exc
    return fn(odds)


def score_probs(p: np.ndarray, outcome_idx: np.ndarray) -> dict[str, float]:
    """Mean log loss and Brier score of probability rows against outcome indices."""
    p = np.asarray(p, dtype=float)
    idx = np.asarray(outcome_idx, dtype=int)
    mask = np.all(np.isfinite(p), axis=1)
    p, idx = p[mask], idx[mask]
    if len(p) == 0:
        return {"n": 0, "log_loss": float("nan"), "brier": float("nan")}
    rows = np.arange(len(p))
    ll = -np.log(np.clip(p[rows, idx], 1e-12, 1.0))
    onehot = np.zeros_like(p)
    onehot[rows, idx] = 1.0
    brier = ((p - onehot) ** 2).sum(axis=1)
    return {"n": int(len(p)), "log_loss": float(ll.mean()), "brier": float(brier.mean())}


def compare_methods(odds_2d: np.ndarray, outcome_idx: np.ndarray) -> dict[str, dict[str, float]]:
    """Score every de-vig method on the same closing odds. Lower log loss = more accurate."""
    return {name: score_probs(fn(odds_2d), outcome_idx) for name, fn in DEVIG_METHODS.items()}
