from datetime import datetime, timezone

import pytest

from edgebot.core import Candidate
from edgebot.parlays import ParlayParams, build_best_parlay, make_parlay

T = datetime(2024, 3, 1, 12, tzinfo=timezone.utc)


def cand(mid, edge, odds=2.0, book="bet365", market="1X2", sel="H", ovr=0.05):
    p = (1 + edge) / odds
    return Candidate(
        match_id=mid, league="E0", market=market, selection=sel, bookmaker=book, odds=odds, effective_odds=odds,
        p_market=p, p_model=None, p_final=p, p_stake=p, edge=edge, feature_ts=T, decision_time=T,
        odds_captured_at=T, book_overround=ovr, sharp_sources=("pinnacle",), kickoff=T, home=f"H{mid}", away=f"A{mid}",
    )


def test_compounded_margin_and_payouts():
    legs = (cand("m1", 0.05, 2.0, ovr=0.05), cand("m2", 0.04, 2.5, ovr=0.05))
    p = make_parlay(legs, kelly_mult=0.2, max_stake=0.005)
    assert p.offered_odds == pytest.approx(5.0)
    assert p.compounded_margin == pytest.approx(1 - (1 / 1.05) ** 2)
    assert p.ev == pytest.approx(1.05 * 1.04 - 1)
    assert p.fair_odds == pytest.approx(1 / (1.05 / 2.0 * 1.04 / 2.5))
    assert "Bookmaker margin" in p.describe()


def test_only_value_legs_are_used():
    legs = [cand("m1", 0.06), cand("m2", 0.05), cand("m3", 0.01)]
    p = build_best_parlay(legs, ParlayParams(), kelly_mult=0.2, min_leg_edge=0.03)
    assert p is not None
    assert all(l.edge >= 0.03 for l in p.legs)
    assert "m3" not in p.match_ids


def test_no_same_match_legs_and_one_bookmaker():
    legs = [
        cand("m1", 0.06, sel="H"), cand("m1", 0.07, market="OU2.5", sel="O"), cand("m2", 0.05),
        cand("m3", 0.08, book="betano"), cand("m4", 0.05, book="betano"),
    ]
    p = build_best_parlay(legs, ParlayParams(max_legs=3), kelly_mult=0.2, min_leg_edge=0.03)
    assert p is not None
    assert len(set(p.match_ids)) == p.n_legs
    assert len({l.bookmaker for l in p.legs}) == 1


def test_max_legs_respected():
    legs = [cand(f"m{i}", 0.05 + i / 100) for i in range(8)]
    p = build_best_parlay(legs, ParlayParams(max_legs=3), kelly_mult=0.2, min_leg_edge=0.03)
    assert 2 <= p.n_legs <= 3


def test_no_parlay_today():
    assert build_best_parlay([cand("m1", 0.06)], ParlayParams(), 0.2, 0.03) is None
    assert build_best_parlay([cand("m1", 0.01), cand("m2", 0.02)], ParlayParams(), 0.2, 0.03) is None
    assert build_best_parlay([cand("m1", 0.06), cand("m2", 0.06)], ParlayParams(enabled=False), 0.2, 0.03) is None
