"""Strategy interface. A strategy prices every selection it can see at one moment.

It must only use DecisionContext, which holds prices captured before decision_time.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime

import numpy as np

from ..core import MARKETS, Candidate, MatchInfo
from ..data.prices import QuoteRow
from ..pricing.consensus import sharp_consensus


@dataclass(frozen=True)
class StrategyParams:
    markets: tuple[str, ...] = ("1X2", "OU2.5")
    edge_threshold: float = 0.03
    max_edge: float = 0.20
    min_odds: float = 1.25
    max_odds: float = 8.0
    model_weight: float = 0.25
    stake_shrink: float = 0.5
    playable: tuple[str, ...] = ("bet365", "betano", "efbet", "winbet")
    sharp: tuple[str, ...] = ("pinnacle", "betfair_exchange")
    sharp_weights: dict = field(default_factory=lambda: {"pinnacle": 0.6, "betfair_exchange": 0.4})
    commission: dict = field(default_factory=lambda: {"betfair_exchange": 0.05})

    @classmethod
    def from_config(cls, cfg: dict) -> "StrategyParams":
        s, b = cfg["strategy"], cfg["bookmakers"]
        return cls(
            markets=tuple(cfg["football"]["markets"]),
            edge_threshold=float(s["edge_threshold"]),
            max_edge=float(s["max_edge"]),
            min_odds=float(s["min_odds"]),
            max_odds=float(s["max_odds"]),
            model_weight=float(s["model_weight"]),
            stake_shrink=float(s["stake_shrink"]),
            playable=tuple(b["playable"]),
            sharp=tuple(b["sharp"]),
            sharp_weights=dict(b["sharp_weights"]),
            commission=dict(b.get("commission", {})),
        )


@dataclass
class DecisionContext:
    match: MatchInfo
    decision_time: datetime
    quotes: dict[tuple[str, str], QuoteRow]


@dataclass
class SharpView:
    probs: np.ndarray
    sources: tuple[str, ...]
    newest: datetime
    spread: np.ndarray  # max - min across reference books, per selection (0 if one book)


class Strategy(ABC):
    name = "base"
    label = "Base"

    def __init__(self, params: StrategyParams):
        self.params = params

    @abstractmethod
    def evaluate(self, ctx: DecisionContext) -> tuple[list[Candidate], list[str]]:
        """Return every priced selection (qualifying or not) plus notes on what could not be priced."""

    def sharp_view(self, ctx: DecisionContext, market: str) -> SharpView | None:
        fair = {
            book: np.array(q.fair)
            for (book, m), q in ctx.quotes.items()
            if m == market and book in self.params.sharp and q.fair is not None
        }
        probs, used = sharp_consensus(fair, self.params.sharp_weights)
        if probs is None:
            return None
        newest = max(ctx.quotes[(b, market)].captured_at for b in used)
        stacked = np.vstack([fair[b] for b in used])
        return SharpView(probs, used, newest, stacked.max(axis=0) - stacked.min(axis=0))

    def qualifies(self, c: Candidate) -> tuple[bool, str]:
        p = self.params
        if c.edge < p.edge_threshold:
            return False, f"edge {c.edge:+.1%} is below the {p.edge_threshold:.0%} threshold"
        if c.edge > p.max_edge:
            return False, f"edge {c.edge:+.1%} is implausibly large — probably a stale or wrong price"
        if not p.min_odds <= c.odds <= p.max_odds:
            return False, f"odds {c.odds:.2f} are outside {p.min_odds:.2f}–{p.max_odds:.2f}"
        return True, "ok"

    @staticmethod
    def confidence(edge: float, n_sources: int, spread: float) -> str:
        if edge >= 0.12:
            return "low"  # very large edges are more often data problems than gifts
        if n_sources >= 2 and spread <= 0.015:
            return "high" if edge >= 0.05 else "medium"
        if n_sources >= 2 and spread > 0.03:
            return "low"
        return "medium"

    def selections(self, market: str) -> tuple[str, ...]:
        return MARKETS[market]
