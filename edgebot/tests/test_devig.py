import numpy as np
import pytest

from edgebot.pricing import compare_methods, devig, log_pool, overround, sharp_consensus
from edgebot.pricing.consensus import edge, effective_odds
from edgebot.pricing.devig import DEVIG_METHODS, devig_additive, devig_multiplicative, devig_power, devig_shin

ODDS = np.array([1.60, 4.00, 6.00])


@pytest.mark.parametrize("method", list(DEVIG_METHODS))
def test_probabilities_sum_to_one(method):
    p = devig(ODDS, method)
    assert p.shape == (3,)
    assert p.sum() == pytest.approx(1.0, abs=1e-9)
    assert np.all(p > 0)
    many = devig(np.vstack([ODDS, [2.1, 3.3, 3.6], [1.9, 1.9, 99.0]]), method)
    assert many.shape == (3, 3)
    assert np.allclose(many.sum(axis=1), 1.0)


@pytest.mark.parametrize("method", list(DEVIG_METHODS))
def test_fair_book_is_unchanged(method):
    fair = np.array([0.5, 0.3, 0.2])
    assert np.allclose(devig(1 / fair, method), fair, atol=1e-6)


def test_overround():
    assert overround([2.0, 2.0]) == pytest.approx(0.0)
    assert overround([1.9, 1.9]) == pytest.approx(2 / 1.9 - 1)


def test_multiplicative_round_trip():
    p = np.array([0.55, 0.27, 0.18])
    assert np.allclose(devig_multiplicative(1 / (p * 1.06)), p)


def test_power_round_trip():
    p = np.array([0.55, 0.27, 0.18])
    k = 1.08
    q = p ** (1 / k)  # bookmaker inflates long shots more
    assert np.allclose(devig_power(1 / q), p, atol=1e-6)


def test_shin_round_trip():
    p = np.array([0.6, 0.25, 0.15])
    z = 0.03
    root = np.sqrt(z * p + (1 - z) * p**2)
    q = root * root.sum()  # Shin (1993) bookmaker prices
    assert np.allclose(devig_shin(1 / q), p, atol=1e-6)


def test_additive_formula():
    q = 1 / ODDS
    expected = q - (q.sum() - 1) / 3
    assert np.allclose(devig_additive(ODDS), expected / expected.sum())


def test_shin_and_power_shift_margin_to_long_shots():
    mult = devig_multiplicative(ODDS)
    for fn in (devig_shin, devig_power):
        p = fn(ODDS)
        assert p[0] > mult[0]  # favourite gets more probability
        assert p[2] < mult[2]  # long shot gets less


def test_nan_rows_give_nan():
    out = devig(np.array([[2.0, 3.0, np.nan], [2.0, 3.5, 4.0]]), "shin")
    assert np.all(np.isnan(out[0]))
    assert np.isfinite(out[1]).all()


def test_compare_methods_scores_every_method():
    rng = np.random.default_rng(0)
    p = rng.dirichlet([5, 3, 2], size=400)
    y = np.array([rng.choice(3, p=row) for row in p])
    res = compare_methods(1 / (p * 1.05), y)
    assert set(res) == set(DEVIG_METHODS)
    assert all(np.isfinite(r["log_loss"]) for r in res.values())


def test_consensus_reweights_missing_books():
    a, b = np.array([0.5, 0.3, 0.2]), np.array([0.4, 0.4, 0.2])
    p, used = sharp_consensus({"pinnacle": a, "betfair_exchange": b}, {"pinnacle": 0.75, "betfair_exchange": 0.25})
    assert np.allclose(p, 0.75 * a + 0.25 * b)
    p2, used2 = sharp_consensus({"pinnacle": None, "betfair_exchange": b}, {"pinnacle": 0.75, "betfair_exchange": 0.25})
    assert used2 == ("betfair_exchange",)
    assert np.allclose(p2, b)
    assert sharp_consensus({}, {})[0] is None


def test_edge_after_commission():
    assert effective_odds(3.0, 0.05) == pytest.approx(2.9)
    assert edge(0.5, 2.0) == pytest.approx(0.0)
    assert edge(0.5, 2.2) == pytest.approx(0.1)


def test_log_pool_bounds():
    m = np.array([0.5, 0.3, 0.2])
    k = np.array([0.4, 0.3, 0.3])
    assert np.allclose(log_pool(m, k, 0.0), k)
    assert np.allclose(log_pool(m, k, 1.0), m)
    assert log_pool(m, k, 0.25).sum() == pytest.approx(1.0)
