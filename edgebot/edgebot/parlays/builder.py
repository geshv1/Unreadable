"""Guarded parlays (accumulators).

Rules:
- every leg must pass the edge threshold on its own (no "filler" legs)
- one leg per match (same-match legs are correlated and not modelled), all at one bookmaker
- 2–3 legs by default
- shows the compounded bookmaker margin and the true vs offered payout
- "best" = highest expected long-run growth at the capped stake, not the biggest payout
"""
from __future__ import annotations

import itertools
import math
from dataclasses import dataclass

from ..core import Candidate, book_name
from ..staking.kelly import kelly_fraction, log_growth


@dataclass(frozen=True)
class ParlayParams:
    enabled: bool = True
    min_legs: int = 2
    max_legs: int = 3
    max_stake: float = 0.005
    max_per_day: int = 1
    pool_size: int = 12

    @classmethod
    def from_config(cls, cfg: dict) -> "ParlayParams":
        p = cfg["parlays"]
        return cls(
            enabled=bool(p["enabled"]),
            min_legs=int(p["min_legs"]),
            max_legs=int(p["max_legs"]),
            max_stake=float(p["max_stake"]),
            max_per_day=int(p["max_per_day"]),
        )


@dataclass(frozen=True)
class Parlay:
    legs: tuple[Candidate, ...]
    bookmaker: str
    offered_odds: float       # what the bookmaker pays: product of leg odds
    fair_odds: float          # what it would pay with zero margin and our fair probabilities
    p_true: float             # chance all legs win (independent matches)
    p_stake: float
    ev: float                 # expected profit per 1 staked
    compounded_margin: float  # bookmaker's built-in hold across all legs
    growth: float

    @property
    def n_legs(self) -> int:
        return len(self.legs)

    @property
    def match_ids(self) -> tuple[str, ...]:
        return tuple(l.match_id for l in self.legs)

    def describe(self) -> str:
        legs = "; ".join(f"{l.home}–{l.away}: {l.label} @ {l.odds:.2f}" for l in self.legs)
        return (
            f"{self.n_legs}-leg parlay at {book_name(self.bookmaker)}: {legs}. Pays {self.offered_odds:.2f} "
            f"(fair {self.fair_odds:.2f}, so {self.ev:+.1%} expected). Bookmaker margin across legs: "
            f"{self.compounded_margin:.1%}. Chance all legs win: {self.p_true:.0%}."
        )


def make_parlay(legs: tuple[Candidate, ...], kelly_mult: float, max_stake: float) -> Parlay:
    offered = math.prod(l.effective_odds for l in legs)
    p_true = math.prod(l.p_final for l in legs)
    p_stake = math.prod(l.p_stake for l in legs)
    margin = 1.0 - math.prod(1.0 / (1.0 + l.book_overround) for l in legs)
    f = min(kelly_fraction(p_stake, offered) * kelly_mult, max_stake)
    return Parlay(
        legs=legs,
        bookmaker=legs[0].bookmaker,
        offered_odds=offered,
        fair_odds=1.0 / p_true,
        p_true=p_true,
        p_stake=p_stake,
        ev=p_true * offered - 1.0,
        compounded_margin=margin,
        growth=log_growth(p_stake, offered, f),
    )


def build_best_parlay(
    qualified: list[Candidate], params: ParlayParams, kelly_mult: float, min_leg_edge: float = 0.0
) -> Parlay | None:
    """Best parlay from legs that each qualify on their own. None means "No parlay today"."""
    if not params.enabled:
        return None
    best: Parlay | None = None
    by_book: dict[str, dict[str, Candidate]] = {}
    for c in qualified:
        if c.edge < min_leg_edge or c.edge <= 0:
            continue
        per_match = by_book.setdefault(c.bookmaker, {})
        cur = per_match.get(c.match_id)
        if cur is None or c.edge > cur.edge:
            per_match[c.match_id] = c
    for book, per_match in by_book.items():
        pool = sorted(per_match.values(), key=lambda c: c.edge, reverse=True)[: params.pool_size]
        for n in range(params.min_legs, params.max_legs + 1):
            for combo in itertools.combinations(pool, n):
                if len({c.match_id for c in combo}) < n:
                    continue
                parlay = make_parlay(combo, kelly_mult, params.max_stake)
                if parlay.growth <= 0:
                    continue
                if best is None or parlay.growth > best.growth:
                    best = parlay
    return best
