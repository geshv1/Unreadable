"""Risk manager: fractional Kelly plus every hard cap and protection.

- stake = Kelly × risk-level fraction, capped per bet, by daily exposure, rounded down
- one bet per match (no stacking correlated bets)
- daily / weekly / monthly loss limits
- auto-pause at a 20% drawdown from the peak; one-tap cool-off
- stakes are sized from the CURRENT bankroll minus money already at risk, so stakes never
  grow to chase losses
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime
from zoneinfo import ZoneInfo

from ..config import RISK_LEVELS
from .kelly import kelly_fraction


@dataclass(frozen=True)
class RiskParams:
    kelly_fraction: float = 0.20
    max_bet_pct: float = 0.015
    max_daily_exposure: float = 0.10
    one_bet_per_match: bool = True
    daily_loss_limit: float = 0.05
    weekly_loss_limit: float = 0.10
    monthly_loss_limit: float = 0.15
    drawdown_pause: float = 0.20
    min_stake: float = 1.0
    stake_rounding: float = 1.0
    parlay_max_stake: float = 0.005
    timezone: str = "Europe/Sofia"

    @classmethod
    def from_config(cls, cfg: dict) -> "RiskParams":
        r = cfg["risk"]
        level = RISK_LEVELS[r["level"]]
        return cls(
            kelly_fraction=level["kelly_fraction"],
            max_bet_pct=level["max_bet_pct"],
            max_daily_exposure=float(r["max_daily_exposure"]),
            one_bet_per_match=bool(r["one_bet_per_match"]),
            daily_loss_limit=float(r["daily_loss_limit"]),
            weekly_loss_limit=float(r["weekly_loss_limit"]),
            monthly_loss_limit=float(r["monthly_loss_limit"]),
            drawdown_pause=float(r["drawdown_pause"]),
            min_stake=float(r["min_stake_eur"]),
            stake_rounding=float(r["stake_rounding_eur"]),
            parlay_max_stake=float(cfg["parlays"]["max_stake"]),
        )


class RiskManager:
    def __init__(self, params: RiskParams, bankroll: float):
        self.p = params
        self.tz = ZoneInfo(params.timezone)
        self.bankroll = float(bankroll)
        self.peak = float(bankroll)
        self.open_exposure = 0.0
        self.paused_since: datetime | None = None
        self.pause_reason: str | None = None
        self.cooloff_until: datetime | None = None
        self.matches_with_bets: set[str] = set()
        self._period_keys: dict[str, tuple] = {}
        self._period_start: dict[str, float] = {}
        self._period_pnl: dict[str, float] = {}
        self._day_staked = 0.0

    # ---- periods -------------------------------------------------------------------------
    def _keys(self, now: datetime) -> dict[str, tuple]:
        local = now.astimezone(self.tz)
        iso = local.isocalendar()
        return {"day": (local.date(),), "week": (iso.year, iso.week), "month": (local.year, local.month)}

    def _roll(self, now: datetime) -> None:
        for name, key in self._keys(now).items():
            if self._period_keys.get(name) != key:
                self._period_keys[name] = key
                self._period_start[name] = self.bankroll
                self._period_pnl[name] = 0.0
                if name == "day":
                    self._day_staked = 0.0

    # ---- blocks --------------------------------------------------------------------------
    @property
    def paused(self) -> bool:
        return self.paused_since is not None

    def block_reason(self, now: datetime) -> str | None:
        self._roll(now)
        if self.paused:
            return f"auto-paused: {self.pause_reason}"
        if self.cooloff_until is not None and now < self.cooloff_until:
            return "cool-off active"
        limits = {
            "day": ("daily", self.p.daily_loss_limit),
            "week": ("weekly", self.p.weekly_loss_limit),
            "month": ("monthly", self.p.monthly_loss_limit),
        }
        for name, (label, lim) in limits.items():
            start = self._period_start.get(name, self.bankroll)
            if start > 0 and self._period_pnl.get(name, 0.0) <= -lim * start:
                return f"{label} loss limit of {lim:.0%} reached"
        return None

    def remaining_daily_exposure(self, now: datetime) -> float:
        self._roll(now)
        start = self._period_start.get("day", self.bankroll)
        return max(0.0, self.p.max_daily_exposure * start - self._day_staked)

    def _round(self, stake: float) -> float:
        step = self.p.stake_rounding
        return math.floor(stake / step + 1e-9) * step if step > 0 else stake

    # ---- sizing --------------------------------------------------------------------------
    def size_single(self, p_stake: float, odds: float, match_id: str, now: datetime) -> tuple[float, str]:
        why = self.block_reason(now)
        if why:
            return 0.0, why
        if self.p.one_bet_per_match and match_id in self.matches_with_bets:
            return 0.0, "already have a bet on this match"
        f = kelly_fraction(p_stake, odds) * self.p.kelly_fraction
        if f <= 0:
            return 0.0, "no edge left after shrinking toward the market"
        available = max(0.0, self.bankroll - self.open_exposure)
        stake = min(f, self.p.max_bet_pct) * available
        stake = min(stake, self.remaining_daily_exposure(now))
        stake = self._round(stake)
        if stake < self.p.min_stake:
            return 0.0, "daily exposure limit reached" if self.remaining_daily_exposure(now) < self.p.min_stake else "stake too small"
        return stake, "ok"

    def size_parlay(self, p_stake: float, odds: float, now: datetime) -> tuple[float, str]:
        why = self.block_reason(now)
        if why:
            return 0.0, why
        f = kelly_fraction(p_stake, odds) * self.p.kelly_fraction
        if f <= 0:
            return 0.0, "no edge left after shrinking toward the market"
        available = max(0.0, self.bankroll - self.open_exposure)
        stake = min(f, self.p.parlay_max_stake) * available
        stake = self._round(min(stake, self.remaining_daily_exposure(now)))
        if stake < self.p.min_stake:
            return 0.0, "parlay stake too small"
        return stake, "ok"

    # ---- bookkeeping ---------------------------------------------------------------------
    def register_bet(self, stake: float, match_ids: tuple[str, ...], now: datetime, single: bool = True) -> None:
        self._roll(now)
        self._day_staked += stake
        self.open_exposure += stake
        if single:
            self.matches_with_bets.update(match_ids)

    def settle(self, stake: float, pnl: float, now: datetime) -> None:
        self._roll(now)
        self.open_exposure = max(0.0, self.open_exposure - stake)
        self.bankroll += pnl
        for name in ("day", "week", "month"):
            self._period_pnl[name] = self._period_pnl.get(name, 0.0) + pnl
        self.peak = max(self.peak, self.bankroll)
        dd = self.drawdown
        if not self.paused and dd >= self.p.drawdown_pause:
            self.paused_since = now
            self.pause_reason = f"bankroll is {dd:.0%} below its peak"

    @property
    def drawdown(self) -> float:
        return 0.0 if self.peak <= 0 else 1.0 - self.bankroll / self.peak

    def resume(self, now: datetime) -> None:
        """Manual resume after a pause. The peak resets so the next pause needs a fresh 20% fall."""
        self.paused_since = None
        self.pause_reason = None
        self.peak = self.bankroll

    def cool_off(self, until: datetime) -> None:
        self.cooloff_until = until
