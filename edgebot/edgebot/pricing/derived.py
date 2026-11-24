"""Fair prices for goals markets the free data doesn't price directly.

The market's fair 1X2 and Over/Under 2.5 probabilities are turned into expected goals for each team
(a Poisson goals model with a small low-score correction, fitted to the market). Every other
goals market — double chance, draw no bet, other totals, both teams to score, team totals,
first half, correct score — follows from that. These are ESTIMATES, so they get a bigger edge threshold.
The same maths runs in the phone app (JavaScript), so both agree.
"""
from __future__ import annotations

import math
import re

import numpy as np

RHO = -0.05
FIRST_HALF_SHARE = 0.45
MAX_GOALS = 10


def score_matrix(lam: float, mu: float, rho: float = RHO) -> np.ndarray:
    g = np.arange(MAX_GOALS + 1)
    fact = np.array([math.factorial(int(k)) for k in g], dtype=float)
    ph = np.exp(-lam) * lam**g / fact
    pa = np.exp(-mu) * mu**g / fact
    m = np.outer(ph, pa)
    m[0, 0] *= 1 - lam * mu * rho
    m[0, 1] *= 1 + lam * rho
    m[1, 0] *= 1 + mu * rho
    m[1, 1] *= 1 - rho
    m = np.clip(m, 0, None)
    return m / m.sum()


def _features(m: np.ndarray) -> np.ndarray:
    i, j = np.indices(m.shape)
    return np.array([m[i > j].sum(), m[i == j].sum(), m[i < j].sum(), m[(i + j) > 2.5].sum()])


def fit_goals(p1x2, p_over25: float | None = None) -> tuple[float, float]:
    """Expected goals (home, away) whose prices best match the market's fair probabilities."""
    target = np.array(list(p1x2) + ([p_over25] if p_over25 is not None else []), dtype=float)
    n = len(target)

    def loss(lam, mu):
        f = _features(score_matrix(lam, mu))[:n]
        return float(((f - target) ** 2).sum())

    best = (1.4, 1.1)
    best_l = loss(*best)
    for lam in np.arange(0.2, 4.01, 0.1):
        for mu in np.arange(0.2, 4.01, 0.1):
            l = loss(lam, mu)
            if l < best_l:
                best, best_l = (lam, mu), l
    step = 0.05
    while step > 0.002:
        lam0, mu0 = best
        for dl in (-step, 0, step):
            for dm in (-step, 0, step):
                lam, mu = max(0.05, lam0 + dl), max(0.05, mu0 + dm)
                l = loss(lam, mu)
                if l < best_l:
                    best, best_l = (lam, mu), l
        if best == (lam0, mu0):
            step /= 2
    return float(best[0]), float(best[1])


_OU = re.compile(r"^(H|A|HT)?OU(\d+(?:\.\d+)?)$")


def market_prob(market: str, sel: str, lam: float, mu: float, p1x2=None) -> float | None:
    """Probability that `sel` wins in `market` (None for a market this can't price).

    For draw no bet the value is the chance of the stake coming back as a win, given no draw."""
    if p1x2 is not None:
        ph, pd, pa = p1x2
    else:
        ph, pd, pa = _features(score_matrix(lam, mu))[:3]
    if market == "1X2":
        return {"H": ph, "D": pd, "A": pa}.get(sel)
    if market == "DC":
        return {"1X": ph + pd, "12": ph + pa, "X2": pd + pa}.get(sel)
    if market == "DNB":
        return {"H": ph / (ph + pa), "A": pa / (ph + pa)}.get(sel)
    k = _OU.match(market)
    if k:
        who, line = k.group(1), float(k.group(2))
        if who == "HT":
            m = score_matrix(lam * FIRST_HALF_SHARE, mu * FIRST_HALF_SHARE)
        else:
            m = score_matrix(lam, mu)
        i, j = np.indices(m.shape)
        goals = i if who == "H" else j if who == "A" else i + j
        over = float(m[goals > line].sum())
        return {"O": over, "U": 1.0 - over}.get(sel)
    m = score_matrix(lam, mu)
    if market == "BTTS":
        yes = float(m[1:, 1:].sum())
        return {"Y": yes, "N": 1.0 - yes}.get(sel)
    if market == "CS":
        try:
            h, a = (int(x) for x in sel.split("-"))
        except ValueError:
            return None
        return float(m[h, a]) if h <= MAX_GOALS and a <= MAX_GOALS else None
    return None


def expected_value(market: str, sel: str, odds: float, p: float, p_draw: float | None = None) -> float:
    """Expected profit per 1 staked. Draw no bet refunds the stake on a draw."""
    if market == "DNB" and p_draw is not None:
        return (1.0 - p_draw) * (p * odds - 1.0)
    return p * odds - 1.0
