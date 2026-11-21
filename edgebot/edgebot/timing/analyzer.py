"""When do the best prices appear? Measured per league and market.

For every playable price we ask: how good was it compared with the final fair price
(de-vigged sharp closing line)? value = odds × p_close − 1. Averaging by "hours before
kick-off" shows whether a league's value tends to appear early or late.
"""
from __future__ import annotations

from datetime import datetime
from typing import Iterable, Mapping

import numpy as np
import pandas as pd

from ..core import MARKETS, league_name
from ..data.prices import PriceIndex

DEFAULT_EDGES = (72.0, 24.0, 6.0, 1.0)
_NAMED = {
    (72.0, 24.0, 6.0, 1.0): ["3+ days before", "1–3 days before", "6–24 h before", "1–6 h before", "last hour"],
}


def bucket_labels(edges: Iterable[float] = DEFAULT_EDGES) -> list[str]:
    e = tuple(float(x) for x in sorted(edges, reverse=True))
    if e in _NAMED:
        return _NAMED[e]
    labels = [f"{e[0]:g}+ h before"]
    labels += [f"{e[i + 1]:g}–{e[i]:g} h before" for i in range(len(e) - 1)]
    labels.append(f"last {e[-1]:g} h")
    return labels


def bucket_for(hours_before: float, edges: Iterable[float] = DEFAULT_EDGES) -> str:
    e = sorted((float(x) for x in edges), reverse=True)
    labels = bucket_labels(e)
    for i, edge in enumerate(e):
        if hours_before >= edge:
            return labels[i]
    return labels[-1]


def closing_fair_table(dataset_matches: pd.DataFrame, prices: PriceIndex, weights: Mapping[str, float], markets: Iterable[str]) -> pd.DataFrame:
    rows = []
    for r in dataset_matches.itertuples(index=False):
        for market in markets:
            p, used, _ = prices.closing_fair(r.match_id, market, r.kickoff.to_pydatetime(), weights)
            if p is None:
                continue
            for sel, prob in zip(MARKETS[market], p):
                rows.append((r.match_id, market, sel, float(prob)))
    return pd.DataFrame(rows, columns=["match_id", "market", "selection", "p_close"])


def price_value_table(
    matches: pd.DataFrame,
    odds: pd.DataFrame,
    close: pd.DataFrame,
    playable: Iterable[str],
    commission: Mapping[str, float],
    edges: Iterable[float] = DEFAULT_EDGES,
) -> pd.DataFrame:
    o = odds[odds["bookmaker"].isin(list(playable))].merge(
        matches[["match_id", "league", "kickoff"]], on="match_id"
    )
    o = o[o["captured_at"] < o["kickoff"]]
    o = o.merge(close, on=["match_id", "market", "selection"])
    if o.empty:
        return o
    comm = o["bookmaker"].map(lambda b: float(commission.get(b, 0.0)))
    eff = 1.0 + (o["odds"] - 1.0) * (1.0 - comm)
    o["value"] = eff * o["p_close"] - 1.0
    o["hours_before"] = (o["kickoff"] - o["captured_at"]).dt.total_seconds() / 3600.0
    edge_list = list(edges)
    o["bucket"] = [bucket_for(h, edge_list) for h in o["hours_before"]]
    return o


def timing_summary(values: pd.DataFrame, edges: Iterable[float] = DEFAULT_EDGES) -> pd.DataFrame:
    """Average value of the available price by league × market × time bucket, plus where the best price appeared."""
    if values.empty:
        return pd.DataFrame(columns=["league", "market", "bucket", "n", "avg_value", "share_best"])
    agg = values.groupby(["league", "market", "bucket"]).agg(n=("value", "size"), avg_value=("value", "mean")).reset_index()
    key = ["match_id", "bookmaker", "market", "selection"]
    best_idx = values.groupby(key)["odds"].idxmax()
    best = values.loc[best_idx, ["league", "market", "bucket"]]
    share = best.groupby(["league", "market", "bucket"]).size().rename("best_count").reset_index()
    tot = best.groupby(["league", "market"]).size().rename("total").reset_index()
    share = share.merge(tot, on=["league", "market"])
    share["share_best"] = share["best_count"] / share["total"]
    out = agg.merge(share[["league", "market", "bucket", "share_best"]], on=["league", "market", "bucket"], how="left")
    order = {b: i for i, b in enumerate(bucket_labels(edges))}
    out["order"] = out["bucket"].map(order)
    return out.sort_values(["league", "market", "order"]).drop(columns="order").reset_index(drop=True)


def recommend_windows(summary: pd.DataFrame, min_n: int = 200, min_gap: float = 0.005) -> dict[tuple[str, str], dict]:
    """Per league/market: the window whose prices are best, compared with betting just before kick-off."""
    recs: dict[tuple[str, str], dict] = {}
    labels = None
    for (league, market), g in summary.groupby(["league", "market"]):
        g = g[g["n"] >= min_n]
        if len(g) < 2:
            recs[(league, market)] = {"window": None, "text": "not enough data to say when to bet"}
            continue
        if labels is None:
            labels = list(summary["bucket"].drop_duplicates())
        order = {b: i for i, b in enumerate(labels)}
        g = g.assign(order=g["bucket"].map(order)).sort_values("order")
        late = g.iloc[-1]  # closest to kick-off
        top = g.sort_values("avg_value", ascending=False).iloc[0]
        gap = float(top["avg_value"] - late["avg_value"])
        if top["bucket"] == late["bucket"]:
            other = g.iloc[:-1].sort_values("avg_value", ascending=False).iloc[0]
            gap = float(late["avg_value"] - other["avg_value"])
            if gap < min_gap:
                text = "no clear pattern — prices are about as good early as late"
                recs[(league, market)] = {"window": None, "text": text, "gap": gap}
            else:
                text = f"best prices usually appear {late['bucket']} ({gap:.1%} better than {other['bucket']}) — wait"
                recs[(league, market)] = {"window": str(late["bucket"]), "text": text, "gap": gap}
            continue
        if gap < min_gap:
            text = "no clear pattern — prices are about as good early as late"
            recs[(league, market)] = {"window": None, "text": text, "gap": gap}
        else:
            text = f"best prices usually appear {top['bucket']} ({gap:.1%} better than {late['bucket']}) — bet early"
            recs[(league, market)] = {"window": str(top["bucket"]), "text": text, "gap": gap}
    return recs


def describe_timing(summary: pd.DataFrame, recs: dict[tuple[str, str], dict]) -> list[str]:
    lines = []
    for (league, market), rec in sorted(recs.items()):
        lines.append(f"{league_name(league)} · {market}: {rec['text']}")
    return lines
