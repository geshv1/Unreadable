"""Glue for `python -m edgebot picks`: build a pick sheet using only information available at that moment."""
from __future__ import annotations

from datetime import timedelta

import pandas as pd

from .backtest.runner import apply_stand_in, choose_devig, load_data
from .config import data_dir
from .data.prices import PriceIndex
from .models.dixon_coles import DCParams, walk_forward_predictions
from .parlays.builder import ParlayParams
from .picks import make_picks
from .staking.risk import RiskParams
from .strategies import MarketValueStrategy, ModelBlendStrategy, StrategyParams
from .timing.analyzer import closing_fair_table, price_value_table, recommend_windows, timing_summary


def default_moment(ds, cfg) -> pd.Timestamp:
    """A recent early price snapshot before the sealed period (+1 minute to react)."""
    target = pd.Timestamp(cfg["holdout"]["start"], tz="UTC") - pd.Timedelta(days=7)
    o = ds.odds.merge(ds.matches[["match_id", "kickoff"]], on="match_id")
    early = o[(o["kickoff"] - o["captured_at"] >= pd.Timedelta(hours=12)) & (o["captured_at"] <= target)]
    return early["captured_at"].max() + pd.Timedelta(minutes=1)


def run_picks(cfg: dict, source: str, at: str | None, horizon: float) -> str:
    ds = load_data(cfg, source, data_dir())
    cfg, stand_in = apply_stand_in(cfg, ds)
    if at:
        ts = pd.Timestamp(at)
        ts = ts.tz_localize("UTC") if ts.tzinfo is None else ts.tz_convert("UTC")
    else:
        ts = default_moment(ds, cfg)
    when = ts.to_pydatetime()
    devig = choose_devig(ds, cfg, when - timedelta(days=1))
    sp = StrategyParams.from_config(cfg)
    books = set(sp.playable) | set(sp.sharp)
    prices = PriceIndex(ds.odds[ds.odds["bookmaker"].isin(books)], sp.sharp, devig["method"])
    # Timing advice learned only from matches finished before this moment.
    past = ds.matches[ds.matches["result_at"] < when]
    close = closing_fair_table(past, prices, sp.sharp_weights, sp.markets)
    edges = tuple(float(x) for x in cfg["timing"]["bucket_edges_hours"])
    recs = recommend_windows(timing_summary(price_value_table(past, ds.odds, close, sp.playable, sp.commission, edges), edges))
    if cfg["strategy"]["name"] == "model_blend":
        upcoming = ds.matches[(ds.matches["kickoff"] > when) & (ds.matches["kickoff"] <= when + timedelta(hours=horizon))]
        anchors = {m: when for m in upcoming["match_id"]}
        history = ds.matches[(ds.matches["kickoff"] <= when) | ds.matches["match_id"].isin(anchors)]
        preds = walk_forward_predictions(history, anchors, DCParams.from_config(cfg))
        preds = {k: v for k, v in preds.items() if k in anchors}
        strategy = ModelBlendStrategy(sp, preds)
    else:
        strategy = MarketValueStrategy(sp)
    sheet = make_picks(
        ds, prices, strategy, RiskParams.from_config(cfg), ParlayParams.from_config(cfg), float(cfg["bankroll_eur"]),
        when, horizon_hours=horizon, max_age_s=6 * 3600,
        min_minutes_before_kickoff=float(cfg["strategy"]["min_minutes_before_kickoff"]),
        timing_recs=recs, timing_edges=edges, mode=cfg["mode"],
    )
    header = "SAMPLE (made-up) DATA — for a look at the format only.\n" if ds.synthetic else "Past data replay.\n"
    if stand_in:
        header += f"Your bookmaker isn't in this past data; showing {', '.join(stand_in)} as a stand-in.\n"
    return header + sheet.render()
