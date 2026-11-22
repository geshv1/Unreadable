"""Glue for `python -m edgebot check`: free upcoming prices + timing history + the check itself."""
from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from .backtest.runner import apply_stand_in
from .check import check_match, parse_odds
from .config import data_dir as default_data_dir
from .data import football_data_uk
from .data.prices import PriceIndex
from .matching import find_match
from .strategies.base import StrategyParams
from .timing.analyzer import closing_fair_table, price_value_table, recommend_windows, timing_summary


def league_timing(cfg: dict, league: str, data_dir: Path, max_age_days: float = 7.0) -> dict:
    """When the best prices appeared in past seasons of this league (cached for a week)."""
    cache = Path(data_dir) / "timing" / f"{league}.json"
    if cache.exists() and time.time() - cache.stat().st_mtime < max_age_days * 86400:
        raw = json.loads(cache.read_text())
        return {tuple(k.split("|")): v for k, v in raw.items()}
    try:
        hist = football_data_uk.load([league], list(cfg["backtest"]["seasons"]), data_dir, int(cfg["backtest"]["result_delay_minutes"]))
    except Exception:  # noqa: BLE001 - timing is a nice-to-have; the check still works without it
        return {}
    cfg2, stand_in = apply_stand_in(cfg, hist)
    sp = StrategyParams.from_config(cfg2)
    edges = tuple(float(x) for x in cfg["timing"]["bucket_edges_hours"])
    prices = PriceIndex(hist.odds[hist.odds["bookmaker"].isin(set(sp.playable) | set(sp.sharp))], sp.sharp)
    close = closing_fair_table(hist.matches, prices, sp.sharp_weights, sp.markets)
    recs = recommend_windows(timing_summary(price_value_table(hist.matches, hist.odds, close, sp.playable, sp.commission, edges), edges))
    for r in recs.values():
        if stand_in:
            r["measured_on"] = ", ".join(stand_in)
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps({f"{k[0]}|{k[1]}": v for k, v in recs.items()}))
    return recs


def run_check(
    cfg: dict, query: str, odds_text: str | None, at: str | None = None, bookmaker: str | None = None,
    ledger_path: str | None = None, record: bool = True,
) -> str:
    from . import paper

    ddir = default_data_dir()
    lpath = Path(ledger_path) if ledger_path else ddir / "paper_ledger.json"
    ledger = paper.load_ledger(lpath)
    ds, _published = football_data_uk.load_fixtures(ddir)
    if at:
        ts = pd.Timestamp(at)
        now = (ts.tz_localize("UTC") if ts.tzinfo is None else ts.tz_convert("UTC")).to_pydatetime()
    else:
        now = datetime.now(timezone.utc)
    hit, _ = find_match(query, ds.matches)
    recs = league_timing(cfg, hit.league, ddir) if hit is not None else {}
    book = bookmaker or cfg["bookmakers"]["playable"][0]
    res = check_match(query, ds, cfg, now, parse_odds(odds_text), book, ddir, recs,
                      extra_legs=paper.open_legs(ledger, now, book))
    text = res.render()
    if record and res.best is not None and res.stake > 0:
        entry = paper.single_from_candidate(res.best, res.stake, now, res.ref_time, float(cfg["strategy"]["edge_threshold"]))
        ledger, action = paper.upsert(ledger, entry)
        paper.save_ledger(lpath, ledger)
        text += f"\n[PAPER] Paper bet {action}: {entry['doc_id']}"
    return text
