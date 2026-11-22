from datetime import datetime, timedelta, timezone

import pytest

from edgebot.config import load_config
from edgebot.staking import RiskManager, RiskParams, kelly_fraction, log_growth

NOW = datetime(2024, 3, 2, 12, tzinfo=timezone.utc)


def test_kelly_formula():
    assert kelly_fraction(0.5, 2.0) == pytest.approx(0.0)
    assert kelly_fraction(0.55, 2.0) == pytest.approx(0.10)
    assert kelly_fraction(0.40, 2.0) == 0.0
    assert kelly_fraction(0.5, 1.0) == 0.0
    assert log_growth(0.55, 2.0, 0.05) > 0
    assert log_growth(0.45, 2.0, 0.05) < 0


@pytest.mark.parametrize(
    "level,frac,cap", [("safe", 0.10, 0.010), ("balanced", 0.20, 0.015), ("aggressive", 0.25, 0.020)]
)
def test_risk_levels(level, frac, cap):
    rp = RiskParams.from_config(load_config(overrides={"risk": {"level": level}}))
    assert rp.kelly_fraction == frac
    assert rp.max_bet_pct == cap


def test_stake_is_fractional_kelly_rounded_down():
    rm = RiskManager(RiskParams(stake_rounding=1.0), 1000)
    stake, why = rm.size_single(0.55, 2.0, "m1", NOW)  # full Kelly 10% -> 0.2 * 10% = 2% -> capped 1.5%
    assert why == "ok"
    assert stake == 15.0
    small, _ = rm.size_single(0.51, 2.0, "m2", NOW)  # full Kelly 2% -> 0.4% -> €4
    assert small == 4.0


def test_one_bet_per_match():
    rm = RiskManager(RiskParams(), 1000)
    s, _ = rm.size_single(0.55, 2.0, "m1", NOW)
    rm.register_bet(s, ("m1",), NOW)
    s2, why = rm.size_single(0.55, 2.0, "m1", NOW)
    assert s2 == 0 and "already" in why


def test_daily_exposure_cap():
    rm = RiskManager(RiskParams(max_bet_pct=0.05, max_daily_exposure=0.10), 1000)
    total = 0.0
    for i in range(10):
        s, _ = rm.size_single(0.6, 2.0, f"m{i}", NOW)
        if s:
            rm.register_bet(s, (f"m{i}",), NOW)
            total += s
    assert total <= 100.0 + 1e-9
    s, why = rm.size_single(0.6, 2.0, "next", NOW)
    assert s == 0 and "exposure" in why
    tomorrow = NOW + timedelta(days=1)
    assert rm.size_single(0.6, 2.0, "next", tomorrow)[0] > 0


def test_daily_loss_limit_blocks_until_tomorrow():
    rm = RiskManager(RiskParams(daily_loss_limit=0.05), 1000)
    rm.register_bet(60, ("a",), NOW)
    rm.settle(60, -60, NOW)
    s, why = rm.size_single(0.55, 2.0, "b", NOW + timedelta(hours=1))
    assert s == 0 and "daily loss limit" in why
    assert rm.size_single(0.55, 2.0, "b", NOW + timedelta(days=1))[0] > 0 or "week" in rm.block_reason(NOW + timedelta(days=1))


def test_drawdown_auto_pause_and_resume():
    rm = RiskManager(RiskParams(daily_loss_limit=1, weekly_loss_limit=1, monthly_loss_limit=1), 1000)
    rm.settle(0, -210, NOW)
    assert rm.paused
    s, why = rm.size_single(0.6, 2.0, "x", NOW)
    assert s == 0 and "paused" in why
    rm.resume(NOW)
    assert not rm.paused
    assert rm.peak == rm.bankroll


def test_never_bigger_stakes_after_a_loss():
    rm = RiskManager(RiskParams(daily_loss_limit=1, weekly_loss_limit=1, monthly_loss_limit=1), 1000)
    before, _ = rm.size_single(0.55, 2.2, "a", NOW)
    rm.register_bet(before, ("a",), NOW)
    rm.settle(before, -before, NOW)
    after, _ = rm.size_single(0.55, 2.2, "b", NOW + timedelta(days=2))
    assert after <= before


def test_open_bets_reduce_available_bankroll():
    rm = RiskManager(RiskParams(max_daily_exposure=1.0), 1000)
    first, _ = rm.size_single(0.55, 2.0, "a", NOW)
    rm.register_bet(500, ("z",), NOW)
    second, _ = rm.size_single(0.55, 2.0, "b", NOW)
    assert second < first


def test_parlay_stake_capped_at_half_percent():
    rm = RiskManager(RiskParams(parlay_max_stake=0.005), 1000)
    s, why = rm.size_parlay(0.3, 5.0, NOW)  # huge edge
    assert why == "ok"
    assert s <= 5.0


def test_cool_off():
    rm = RiskManager(RiskParams(), 1000)
    rm.cool_off(NOW + timedelta(hours=24))
    assert rm.size_single(0.6, 2.0, "a", NOW)[1] == "cool-off active"
    assert rm.size_single(0.6, 2.0, "a", NOW + timedelta(hours=25))[0] > 0
