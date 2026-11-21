"""Real-money execution: interface only. Hard-disabled in this project phase.

EdgeBot recommends bets; you place them yourself in your own licensed bookmaker apps.
There is intentionally no code here that can log in to a bookmaker or place a bet.
"""
from __future__ import annotations

from typing import Final, Protocol

REAL_MONEY_EXECUTION_ENABLED: Final[bool] = False


class RealMoneyDisabledError(RuntimeError):
    pass


class BetExecutor(Protocol):
    def place_bet(self, bookmaker: str, match_id: str, market: str, selection: str, odds: float, stake: float) -> dict:
        ...


class DisabledExecutor:
    def place_bet(self, bookmaker: str, match_id: str, market: str, selection: str, odds: float, stake: float) -> dict:
        raise RealMoneyDisabledError(
            "Real-money betting is switched off. EdgeBot only recommends; you place bets yourself."
        )


def get_executor(cfg: dict | None = None) -> BetExecutor:
    """Always returns the disabled executor, whatever the settings say."""
    return DisabledExecutor()
