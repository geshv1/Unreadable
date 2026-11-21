"""Kelly staking: the bankroll share that maximises long-run growth for a given edge."""
from __future__ import annotations

import math


def kelly_fraction(p: float, odds: float) -> float:
    """Full-Kelly share of bankroll. 0 when there is no edge."""
    b = odds - 1.0
    if b <= 0 or not 0.0 < p < 1.0:
        return 0.0
    return max(0.0, (p * odds - 1.0) / b)


def log_growth(p: float, odds: float, f: float) -> float:
    """Expected log growth per bet of staking share f."""
    if f <= 0:
        return 0.0
    if f >= 1:
        return -math.inf
    return p * math.log1p(f * (odds - 1.0)) + (1.0 - p) * math.log1p(-f)
