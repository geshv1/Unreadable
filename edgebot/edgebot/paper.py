"""Paper trading: every recommended bet is recorded with pretend money, then graded automatically.

- Recording: each ✅ bet from a match check becomes one paper bet (one per match; a later check of
  the same match before kick-off updates it). Parlays are recorded when asked.
- Your actions: placed / skipped / got different odds (the odds you really got are used for grading).
- Grading: free results and closing prices from football-data.co.uk (current-season files).
  CLV is measured against the de-vigged Betfair Exchange closing price.
- Report: profit, ROI and CLV with 95% ranges, drawdown, and progress on every go-live gate.

The ledger is a plain list of dicts (JSON), so it can live anywhere: a file, a database, a web page.
"""
from __future__ import annotations

import json
import math
import time
from dataclasses import asdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import pandas as pd

from .core import MARKETS, Candidate, book_name, league_name, selection_won
from .data import football_data_uk
from .data.prices import PriceIndex
from .backtest.metrics import bootstrap_ci

RESULT_REFRESH_HOURS = 6.0


def _iso(v):
    return v.isoformat() if isinstance(v, datetime) else v


def bet_id(c: Candidate) -> str:
    return f"{c.match_id}|{c.market}|{c.selection}"


def doc_id(entry_id: str) -> str:
    """A storage-safe id (letters, digits and _ - . ~ : @ + only)."""
    return entry_id.replace("|", "~").replace(",", ".")


def single_from_candidate(c: Candidate, stake: float, created_at: datetime, ref_time: datetime | None,
                          edge_threshold: float = 0.03) -> dict:
    return {
        "id": bet_id(c), "doc_id": doc_id(bet_id(c)), "kind": "single", "mode": "paper", "created_at": _iso(created_at),
        "match_id": c.match_id, "league": c.league, "league_name": league_name(c.league), "home": c.home,
        "away": c.away, "kickoff": _iso(c.kickoff), "min_odds": round((1.0 + edge_threshold) / c.p_final, 3),
        "market": c.market, "selection": c.selection, "label": c.label, "bookmaker": c.bookmaker,
        "odds": round(c.odds, 3), "fair_odds": round(c.fair_odds, 3), "p_fair": round(c.p_final, 5),
        "edge": round(c.edge, 5), "stake": float(stake), "confidence": c.confidence,
        "ref_time": _iso(ref_time), "reason": c.explain(),
        "legs": [{"match_id": c.match_id, "league": c.league, "home": c.home, "away": c.away, "kickoff": _iso(c.kickoff),
                  "market": c.market, "selection": c.selection, "odds": round(c.odds, 3)}],
        "placed": None, "placed_odds": None, "status": "open", "pnl": None, "clv": None,
        "closing_fair_odds": None, "score": None, "settled_at": None,
    }


def parlay_entry(parlay, stake: float, created_at: datetime) -> dict:
    legs = [{"match_id": l.match_id, "league": l.league, "home": l.home, "away": l.away, "kickoff": _iso(l.kickoff),
             "market": l.market, "selection": l.selection, "odds": round(l.odds, 3)} for l in parlay.legs]
    pid = "PARLAY|" + "+".join(f"{l['match_id']}:{l['market']}:{l['selection']}" for l in legs)
    return {
        "id": pid, "doc_id": doc_id(pid), "kind": "parlay", "league_name": "Parlay", "min_odds": None, "mode": "paper", "created_at": _iso(created_at), "match_id": ",".join(parlay.match_ids),
        "league": parlay.legs[0].league, "home": parlay.legs[0].home, "away": parlay.legs[0].away,
        "kickoff": _iso(min(l.kickoff for l in parlay.legs)), "market": "PARLAY", "selection": None,
        "label": " + ".join(f"{l.home}–{l.away}: {l.label}" for l in parlay.legs), "bookmaker": parlay.bookmaker,
        "odds": round(parlay.offered_odds, 3), "fair_odds": round(parlay.fair_odds, 3), "p_fair": round(parlay.p_true, 6),
        "edge": round(parlay.ev, 5), "stake": float(stake), "confidence": "low", "ref_time": None,
        "reason": parlay.describe(), "legs": legs, "placed": None, "placed_odds": None, "status": "open",
        "pnl": None, "clv": None, "closing_fair_odds": None, "score": None, "settled_at": None,
    }


def upsert(ledger: list[dict], entry: dict) -> tuple[list[dict], str]:
    """Add a paper bet. One open single per match: a newer check before kick-off replaces it (unless already placed)."""
    out = []
    action = "added"
    for e in ledger:
        same_match_single = entry["kind"] == "single" and e["kind"] == "single" and e["match_id"] == entry["match_id"]
        if (same_match_single or e["id"] == entry["id"]) and e["status"] == "open":
            if e.get("placed"):
                return ledger, "kept (already placed)"
            action = "updated"
            continue
        out.append(e)
    out.append(entry)
    return out, action


def mark(ledger: list[dict], bid: str, placed: bool, odds: float | None = None) -> dict:
    for e in ledger:
        if bid in (e["id"], e.get("doc_id")):
            e["placed"] = bool(placed)
            if odds:
                e["placed_odds"] = float(odds)
            return e
    raise KeyError(f"no paper bet with id {bid}")


def open_legs(ledger: list[dict], at: datetime, bookmaker: str) -> list[Candidate]:
    """Open singles that kick off later, rebuilt as candidates, for building parlays."""
    out = []
    for e in ledger:
        if e["kind"] != "single" or e["status"] != "open" or e["bookmaker"] != bookmaker or e.get("placed") is False:
            continue
        ko = datetime.fromisoformat(e["kickoff"])
        if ko <= at + timedelta(minutes=15):
            continue
        odds = float(e.get("placed_odds") or e["odds"])
        p = float(e["p_fair"])
        t = datetime.fromisoformat(e["created_at"])
        out.append(Candidate(
            match_id=e["match_id"], league=e["league"], market=e["market"], selection=e["selection"],
            bookmaker=e["bookmaker"], odds=odds, effective_odds=odds, p_market=p, p_model=None, p_final=p, p_stake=p,
            edge=p * odds - 1.0, feature_ts=t, decision_time=t, odds_captured_at=t, book_overround=0.06,
            sharp_sources=("betfair_exchange",), kickoff=ko, home=e["home"], away=e["away"], confidence=e["confidence"],
        ))
    return out


# ---- grading -----------------------------------------------------------------------------------
def season_code(kickoff: datetime) -> str:
    y = kickoff.year if kickoff.month >= 7 else kickoff.year - 1
    return f"{y % 100:02d}{(y + 1) % 100:02d}"


def _results_for(league: str, season: str, data_dir: Path, refresh: bool = True):
    path = football_data_uk.raw_path(data_dir, league, season)
    stale = not path.exists() or (time.time() - path.stat().st_mtime) > RESULT_REFRESH_HOURS * 3600
    if refresh and stale:
        try:
            football_data_uk.download([league], [season], data_dir, force=True)
        except Exception:  # noqa: BLE001 - no internet: grade what we can
            if not path.exists():
                return None, None
    if not path.exists():
        return None, None
    return football_data_uk.parse_csv(path, league, season)


def _find(matches: pd.DataFrame, leg: dict) -> pd.Series | None:
    hit = matches[matches["match_id"] == leg["match_id"]]
    if len(hit):
        return hit.iloc[0]
    ko = pd.Timestamp(leg["kickoff"])
    near = matches[(matches["home"] == leg["home"]) & (matches["away"] == leg["away"])
                   & ((matches["kickoff"] - ko).abs() <= pd.Timedelta(days=7))]
    return near.iloc[0] if len(near) else None


def grade(ledger: list[dict], data_dir: Path, now: datetime, weights: dict | None = None,
          sharp: tuple[str, ...] = ("pinnacle", "betfair_exchange"), refresh: bool = True,
          results: dict | None = None) -> tuple[list[dict], int]:
    """Settle every open paper bet whose result is published. Returns (ledger, number settled).

    results: optional {(league, season): (matches, odds)} to grade offline (tests)."""
    weights = weights or {"pinnacle": 0.6, "betfair_exchange": 0.4}
    cache: dict = dict(results or {})
    settled = 0
    for e in ledger:
        if e["status"] != "open" or e.get("placed") is False:
            continue
        if datetime.fromisoformat(e["kickoff"]) > now - timedelta(hours=2):
            continue
        won, void, p_close, scores = True, False, 1.0, []
        pending = False
        for leg in e["legs"]:
            key = (leg["league"], season_code(datetime.fromisoformat(leg["kickoff"])))
            if key not in cache:
                cache[key] = _results_for(key[0], key[1], data_dir, refresh)
            m, o = cache[key]
            row = None if m is None else _find(m, leg)
            if row is None or pd.isna(row["home_goals"]):
                pending = True
                break
            hg, ag = int(row["home_goals"]), int(row["away_goals"])
            scores.append(f"{hg}-{ag}")
            won = won and selection_won(leg["market"], leg["selection"], hg, ag)
            prices = PriceIndex(o[o["match_id"] == row["match_id"]], sharp, "multiplicative")
            p, used, _ = prices.closing_fair(row["match_id"], leg["market"], row["kickoff"].to_pydatetime(), weights)
            if p is None:
                p_close = math.nan
            else:
                p_close *= float(p[MARKETS[leg["market"]].index(leg["selection"])])
        if pending:
            continue
        odds = float(e.get("placed_odds") or e["odds"])
        stake = float(e["stake"])
        e["status"] = "won" if won else "lost"
        e["pnl"] = round(stake * (odds - 1.0), 2) if won else -stake
        e["score"] = ", ".join(scores)
        e["settled_at"] = now.isoformat()
        if not math.isnan(p_close) and p_close > 0:
            e["closing_fair_odds"] = round(1.0 / p_close, 3)
            e["clv"] = round(odds * p_close - 1.0, 5)
        settled += 1
    return ledger, settled


# ---- report ------------------------------------------------------------------------------------
def report(ledger: list[dict], cfg: dict, seed: int = 0) -> dict:
    rng = np.random.default_rng(seed)
    gates = cfg["go_live_gates"]
    n_boot = int(cfg["backtest"]["bootstrap_samples"])
    counted = [e for e in ledger if e.get("placed") is not False]
    done = sorted((e for e in counted if e["status"] in ("won", "lost")), key=lambda e: e["settled_at"])
    open_ = [e for e in counted if e["status"] == "open"]
    skipped = [e for e in ledger if e.get("placed") is False]
    out: dict = {"bets": len(done), "open": len(open_), "skipped": len(skipped), "placed": sum(1 for e in done if e.get("placed"))}
    if done:
        stake = np.array([float(e["stake"]) for e in done])
        pnl = np.array([float(e["pnl"]) for e in done])
        pairs = np.stack([pnl, stake], axis=1)
        out.update(staked=float(stake.sum()), profit=float(pnl.sum()), roi=float(pnl.sum() / stake.sum()),
                   roi_ci=bootstrap_ci(pairs, lambda s: s[..., 0].sum(-1) / s[..., 1].sum(-1), n_boot, rng),
                   wins=int(sum(e["status"] == "won" for e in done)))
        bank = float(cfg["bankroll_eur"]) + np.cumsum(pnl)
        values = np.concatenate([[float(cfg["bankroll_eur"])], bank])
        out["max_drawdown"] = float(np.max(1 - values / np.maximum.accumulate(values)))
        clv = np.array([e["clv"] for e in done if e.get("clv") is not None], dtype=float)
        if len(clv):
            out.update(clv=float(clv.mean()), clv_ci=bootstrap_ci(clv, lambda s: s.mean(-1), n_boot, rng), clv_n=int(len(clv)))
    g = []
    n = out["bets"]
    g.append((f"At least {gates['min_paper_bets']:,} paper bets", n >= gates["min_paper_bets"], f"{n} so far"))
    clv_ok = out.get("clv") is not None and out["clv"] >= gates["min_avg_clv"]
    g.append((f"Average CLV ≥ {gates['min_avg_clv']:.0%}", clv_ok, f"{out['clv']:+.1%}" if out.get("clv") is not None else "no data"))
    ci_ok = out.get("clv_ci") is not None and out["clv_ci"][0] > 0
    g.append(("CLV 95% range above zero", ci_ok,
              f"{out['clv_ci'][0]:+.1%} to {out['clv_ci'][1]:+.1%}" if out.get("clv_ci") and not math.isnan(out["clv_ci"][0]) else "no data"))
    g.append(("Positive profit", out.get("profit", 0) > 0, f"€{out.get('profit', 0):+.0f}"))
    dd = out.get("max_drawdown", 0.0)
    g.append((f"Worst drop ≤ {gates['max_drawdown']:.0%}", dd <= gates["max_drawdown"], f"{dd:.0%}"))
    g.append(("Your confirmation", False, "last step"))
    out["gates"] = g
    out["all_pass"] = all(ok for _, ok, _ in g)
    return out


def render_report(rep: dict, cfg: dict, ledger: list[dict]) -> str:
    min_n = int(cfg["backtest"]["min_bets_for_verdict"])
    lines = ["[PAPER] Paper-trading report — pretend money, real matches"]
    lines.append(f"Settled bets: {rep['bets']} · open: {rep['open']} · skipped by you: {rep['skipped']}")
    if rep["bets"]:
        lines.append(f"Profit: €{rep['profit']:+.2f} on €{rep['staked']:.0f} staked · ROI {rep['roi']:+.1%} "
                     f"(95% range {rep['roi_ci'][0]:+.1%} to {rep['roi_ci'][1]:+.1%}) · won {rep['wins']}/{rep['bets']}")
        if rep.get("clv") is not None:
            lines.append(f"Beat the closing price (CLV): {rep['clv']:+.1%} (95% range {rep['clv_ci'][0]:+.1%} to {rep['clv_ci'][1]:+.1%})")
        lines.append(f"Worst drop from a peak: {rep['max_drawdown']:.0%}")
        if rep["bets"] < min_n:
            lines.append(f"Not enough data yet to judge anything ({rep['bets']} of {min_n} bets). Keep going.")
    else:
        lines.append("No settled paper bets yet.")
    lines.append("")
    lines.append("Go-live gates (real money stays OFF until all pass):")
    for name, ok, detail in rep["gates"]:
        lines.append(f"  {'✅' if ok else '⬜'} {name} — {detail}")
    recent = [e for e in ledger if e["status"] in ("won", "lost")][-5:]
    if recent:
        lines.append("")
        lines.append("Latest results:")
        for e in recent:
            mark_ = "✅" if e["status"] == "won" else "❌"
            clv = f" · CLV {e['clv']:+.1%}" if e.get("clv") is not None else ""
            lines.append(f"  {mark_} {e['home']} v {e['away']} ({e['score']}): {e['label']} @ {float(e.get('placed_odds') or e['odds']):.2f} "
                         f"· €{e['pnl']:+.2f}{clv}")
    return "\n".join(lines)


def summary_doc(rep: dict, now: datetime) -> dict:
    """The report as plain JSON for the tracker page."""
    def clean(v):
        if isinstance(v, float) and math.isnan(v):
            return None
        if isinstance(v, tuple):
            return [clean(x) for x in v]
        return v
    out = {k: clean(v) for k, v in rep.items() if k != "gates"}
    out["gates"] = [{"name": n, "ok": bool(ok), "detail": d} for n, ok, d in rep["gates"]]
    out["updated_at"] = now.isoformat()
    return out


def import_docs(src: Path, ledger_path: Path, versions: dict[str, int] | None = None) -> int:
    """Build the ledger from tracker documents saved as JSON files (any nesting under src).

    Accepts a bare entry or a stored document {"id", "data", "version"}; the version is kept as
    `_version` so changes can be written back safely."""
    entries = []
    for f in sorted(Path(src).rglob("*.json")):
        obj = json.loads(f.read_text(encoding="utf-8"))
        if isinstance(obj, dict) and isinstance(obj.get("data"), dict):
            entry = dict(obj["data"])
            if obj.get("version") is not None:
                entry["_version"] = obj["version"]
        else:
            entry = dict(obj)
        if versions and f.stem in versions:
            entry["_version"] = int(versions[f.stem])
        if "id" in entry and "kind" in entry:
            entries.append(entry)
    save_ledger(ledger_path, entries)
    return len(entries)


def export_docs(ledger: list[dict], out: Path) -> list[dict]:
    """Write one JSON file per entry and return a ready `batch` writes list (with if_version where known)."""
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    writes = []
    for e in ledger:
        body = {k: v for k, v in e.items() if k != "_version"}
        did = body.get("doc_id") or doc_id(body["id"])
        path = out / f"{did}.json"
        path.write_text(json.dumps(body, default=str), encoding="utf-8")
        w = {"op": "set", "collection": "bets", "doc_id": did, "file_path": str(path)}
        if e.get("_version") is not None:
            w["if_version"] = int(e["_version"])
        writes.append(w)
    return writes


def load_ledger(path: Path) -> list[dict]:
    path = Path(path)
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else []


def save_ledger(path: Path, ledger: list[dict]) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(ledger, indent=1, default=str), encoding="utf-8")
