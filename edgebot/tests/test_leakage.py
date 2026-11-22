"""The leakage tests: nothing may use information from at or after the bet time."""
from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd
import pytest

from edgebot.backtest.engine import Backtester, BacktestSettings
from edgebot.data.base import Dataset
from edgebot.data.prices import PriceIndex
from edgebot.leakage import LeakageError, assert_no_leakage, check_frame
from edgebot.models.dixon_coles import DCParams, walk_forward_predictions
from edgebot.parlays.builder import ParlayParams
from edgebot.staking.risk import RiskParams
from edgebot.strategies import MarketValueStrategy, ModelBlendStrategy, StrategyParams
from edgebot.backtest.runner import run_backtest

T0 = datetime(2024, 1, 1, 12, tzinfo=timezone.utc)


def _settings(**kw):
    base = dict(bankroll=1000.0, parlay=ParlayParams(enabled=True))
    base.update(kw)
    return BacktestSettings(**base)


def _prices(ds):
    params = StrategyParams()
    return params, PriceIndex(ds.odds, params.sharp, "multiplicative")


def test_guard_rejects_feature_at_or_after_bet_time():
    assert_no_leakage(T0 - timedelta(seconds=1), T0)
    with pytest.raises(LeakageError):
        assert_no_leakage(T0, T0)
    with pytest.raises(LeakageError):
        assert_no_leakage(T0 + timedelta(minutes=5), T0)
    with pytest.raises(LeakageError):
        assert_no_leakage(None, T0)


def test_check_frame_finds_a_planted_leak():
    ok = pd.DataFrame({"feature_ts": [T0 - timedelta(hours=1)], "bet_ts": [T0]})
    check_frame(ok)
    bad = pd.DataFrame({"feature_ts": [T0 - timedelta(hours=1), T0 + timedelta(hours=1)], "bet_ts": [T0, T0]})
    with pytest.raises(LeakageError):
        check_frame(bad)


def test_quotes_are_strictly_from_the_past(small_sample):
    _, prices = _prices(small_sample)
    mid = prices.match_ids()[0]
    for ts in prices.snapshot_times(mid):
        quotes = prices.quotes_asof(mid, ts, max_age_s=None)
        assert all(q.captured_at < ts for q in quotes.values())
        later = prices.quotes_asof(mid, ts + timedelta(seconds=1), max_age_s=None)
        assert later and all(q.captured_at <= ts for q in later.values())


def test_stale_prices_are_ignored(small_sample):
    _, prices = _prices(small_sample)
    mid = prices.match_ids()[0]
    ts = prices.snapshot_times(mid)[0]
    assert prices.quotes_asof(mid, ts + timedelta(seconds=60), max_age_s=300)
    assert not prices.quotes_asof(mid, ts + timedelta(seconds=301), max_age_s=300)


def test_every_backtest_bet_uses_only_past_information(small_sample):
    params, prices = _prices(small_sample)
    res = Backtester(small_sample, MarketValueStrategy(params), prices, _settings(), RiskParams()).run()
    assert len(res.bets) > 0
    check_frame(res.bets.rename(columns={"placed_at": "bet_ts"}))
    assert (pd.to_datetime(res.bets["placed_at"], utc=True) < pd.to_datetime(res.bets["kickoff"], utc=True)).all()


def test_results_are_only_used_after_they_are_known(small_sample):
    params, prices = _prices(small_sample)
    res = Backtester(small_sample, MarketValueStrategy(params), prices, _settings(), RiskParams()).run()
    result_at = small_sample.matches.set_index("match_id")["result_at"]
    for r in res.bets.itertuples(index=False):
        latest_result = max(result_at[m] for m in r.match_ids)
        assert pd.Timestamp(r.settled_at) >= latest_result


def test_model_is_only_trained_on_earlier_results(small_sample):
    params, prices = _prices(small_sample)
    anchors = {m: prices.snapshot_times(m)[0] + timedelta(seconds=60) for m in prices.match_ids()}
    preds = walk_forward_predictions(small_sample.matches, anchors, DCParams(min_train_matches=60))
    assert preds
    for mid, p in preds.items():
        assert p.trained_until < p.fitted_at <= anchors[mid]
    res = Backtester(small_sample, ModelBlendStrategy(params, preds), prices, _settings(), RiskParams()).run()
    if len(res.bets):
        check_frame(res.bets.rename(columns={"placed_at": "bet_ts"}))


def _scramble_future(ds: Dataset, cutoff: pd.Timestamp, seed: int = 1) -> Dataset:
    """Rewrite every result and price from `cutoff` onward with nonsense."""
    rng = np.random.default_rng(seed)
    m = ds.matches.copy()
    fut = m["kickoff"] >= cutoff
    m.loc[fut, "home_goals"] = rng.integers(0, 6, fut.sum())
    m.loc[fut, "away_goals"] = rng.integers(0, 6, fut.sum())
    o = ds.odds.copy()
    fo = o["captured_at"] >= cutoff - pd.Timedelta(days=4)
    o.loc[fo, "odds"] = np.round(rng.uniform(1.05, 15.0, fo.sum()), 2)
    return Dataset(m, o, ds.source, ds.synthetic)


def test_time_travel_predictions_do_not_change_when_the_future_changes(small_sample):
    cutoff = pd.Timestamp("2025-01-15", tz="UTC")
    _, prices = _prices(small_sample)
    anchors = {m: prices.snapshot_times(m)[0] for m in prices.match_ids()}
    before = walk_forward_predictions(small_sample.matches, anchors, DCParams(min_train_matches=60))
    altered = _scramble_future(small_sample, cutoff)
    after = walk_forward_predictions(altered.matches, anchors, DCParams(min_train_matches=60))
    checked = 0
    for mid, p in before.items():
        if anchors[mid] < cutoff - pd.Timedelta(days=5):
            checked += 1
            for market in p.probs:
                assert np.allclose(p.probs[market], after[mid].probs[market])
    assert checked > 50


def test_time_travel_bets_do_not_change_when_the_future_changes(small_sample):
    cutoff = pd.Timestamp("2025-01-15", tz="UTC")
    params = StrategyParams()
    altered = _scramble_future(small_sample, cutoff)
    settings = _settings(end=(cutoff - pd.Timedelta(days=5)).to_pydatetime(), parlay=ParlayParams(enabled=False))
    a = Backtester(small_sample, MarketValueStrategy(params), PriceIndex(small_sample.odds, params.sharp), settings, RiskParams()).run()
    b = Backtester(altered, MarketValueStrategy(params), PriceIndex(altered.odds, params.sharp), settings, RiskParams()).run()
    cols = ["placed_at", "match", "market", "selection", "bookmaker", "quoted_odds", "edge"]
    early = lambda df: df[pd.to_datetime(df["placed_at"], utc=True) < cutoff - pd.Timedelta(days=10)][cols].reset_index(drop=True)
    # Stakes can differ (bankroll depends on later settlements) but which bets are chosen must not.
    pd.testing.assert_frame_equal(early(a.bets), early(b.bets))
    assert len(early(a.bets)) > 10


class _PeekingStrategy(MarketValueStrategy):
    """Cheats by claiming to use the closing price at decision time."""

    def evaluate(self, ctx):
        cands, notes = super().evaluate(ctx)
        for c in cands:
            c.feature_ts = ctx.match.kickoff
        return cands, notes


def test_engine_stops_a_strategy_that_peeks(small_sample):
    params, prices = _prices(small_sample)
    with pytest.raises(LeakageError):
        Backtester(small_sample, _PeekingStrategy(params), prices, _settings(), RiskParams()).run()


def test_full_runner_respects_periods_and_sealed_holdout(small_sample, cfg):
    run = run_backtest(cfg, source="sample", dataset=small_sample, save=False, benchmark=True)
    bets = run.result.bets
    placed = pd.to_datetime(bets["placed_at"], utc=True)
    assert (placed >= run.periods.start).all()
    assert (placed < run.periods.holdout_start).all()
