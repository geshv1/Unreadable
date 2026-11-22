"""Pessimistic execution: worse prices than quoted, refused bets, and account limits."""
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class ExecutionParams:
    slippage_min: float = 0.01
    slippage_max: float = 0.02
    rejection_rate: float = 0.10
    max_stake: float = 500.0
    limit_after_bets: int | None = 200
    limited_max_stake: float = 5.0
    min_stake: float = 1.0

    @classmethod
    def from_config(cls, cfg: dict) -> "ExecutionParams":
        b = cfg["backtest"]
        lim = b.get("account_limits", {}) or {}
        return cls(
            slippage_min=float(b["slippage"][0]),
            slippage_max=float(b["slippage"][1]),
            rejection_rate=float(b["rejection_rate"]),
            max_stake=float(lim.get("max_stake_eur", 500.0)),
            limit_after_bets=lim.get("limit_after_bets"),
            limited_max_stake=float(lim.get("limited_max_stake_eur", 5.0)),
            min_stake=float(cfg["risk"]["min_stake_eur"]),
        )


@dataclass(frozen=True)
class Fill:
    accepted: bool
    fill_odds: float
    requested_stake: float
    accepted_stake: float
    note: str
    limited: bool = False


class ExecutionSimulator:
    def __init__(self, params: ExecutionParams, rng: np.random.Generator):
        self.p = params
        self.rng = rng
        self.bets_per_book: Counter[str] = Counter()

    def is_limited(self, bookmaker: str) -> bool:
        return self.p.limit_after_bets is not None and self.bets_per_book[bookmaker] >= int(self.p.limit_after_bets)

    def max_stake(self, bookmaker: str) -> float:
        return self.p.limited_max_stake if self.is_limited(bookmaker) else self.p.max_stake

    def fill(self, bookmaker: str, odds: float, stake: float, n_legs: int = 1) -> Fill:
        """n_legs > 1: odds is the product of legs; slippage is applied once per leg."""
        if self.rng.random() < self.p.rejection_rate:
            return Fill(False, odds, stake, 0.0, "refused by bookmaker / price moved before placing")
        limited = self.is_limited(bookmaker)
        cap = self.max_stake(bookmaker)
        accepted = min(stake, cap)
        if accepted < self.p.min_stake:
            return Fill(False, odds, stake, 0.0, "account limited: bookmaker will not take a meaningful stake", limited)
        fill_odds = odds
        for _ in range(n_legs):
            fill_odds *= 1.0 - self.rng.uniform(self.p.slippage_min, self.p.slippage_max)
        fill_odds = max(1.01, fill_odds)
        self.bets_per_book[bookmaker] += 1
        note = "accepted" if accepted >= stake else f"stake cut from €{stake:.0f} to €{accepted:.0f} (account limit)"
        return Fill(True, fill_odds, stake, accepted, note, limited)
