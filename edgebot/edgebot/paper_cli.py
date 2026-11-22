"""Glue for `python -m edgebot paper ...`."""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from . import paper
from .config import data_dir as default_data_dir
from .parlays.builder import ParlayParams, build_best_parlay
from .staking.risk import RiskManager, RiskParams


def _now(at: str | None) -> datetime:
    if not at:
        return datetime.now(timezone.utc)
    ts = pd.Timestamp(at)
    return (ts.tz_localize("UTC") if ts.tzinfo is None else ts.tz_convert("UTC")).to_pydatetime()


def run_paper(cfg: dict, args) -> str:
    ddir = default_data_dir()
    lpath = Path(args.ledger) if args.ledger else ddir / "paper_ledger.json"
    ledger = paper.load_ledger(lpath)
    now = _now(getattr(args, "at", None))
    if args.action == "grade":
        ledger, n = paper.grade(ledger, ddir, now, cfg["bookmakers"]["sharp_weights"], tuple(cfg["bookmakers"]["sharp"]))
        paper.save_ledger(lpath, ledger)
        waiting = sum(1 for e in ledger if e["status"] == "open")
        return f"Settled {n} paper bet(s); {waiting} still open.\n\n" + paper.render_report(paper.report(ledger, cfg), cfg, ledger)
    if args.action == "report":
        return paper.render_report(paper.report(ledger, cfg), cfg, ledger)
    if args.action == "summary":
        import json

        doc = paper.summary_doc(paper.report(ledger, cfg), now)
        if args.out:
            Path(args.out).parent.mkdir(parents=True, exist_ok=True)
            Path(args.out).write_text(json.dumps(doc, indent=1))
            return f"Summary written to {args.out}"
        return json.dumps(doc, indent=1)
    if args.action == "import":
        import json

        versions = json.loads(args.versions) if args.versions else None
        n = paper.import_docs(Path(args.src or (ddir / "tracker_docs")), lpath, versions)
        return f"Imported {n} paper bet(s) into {lpath}"
    if args.action == "export":
        import json

        writes = paper.export_docs(paper.load_ledger(lpath), Path(args.out or (ddir / "tracker_export")))
        return json.dumps(writes, indent=1)
    if args.action == "mark":
        if not args.bet_id or args.placed is None:
            return "Usage: python -m edgebot paper mark <bet id> --placed yes|no [--odds 2.05]"
        e = paper.mark(ledger, args.bet_id, args.placed == "yes", args.odds)
        paper.save_ledger(lpath, ledger)
        return f"Marked {e['label']} ({e['home']} v {e['away']}): {'placed' if e['placed'] else 'skipped'}" + (
            f" at {e['placed_odds']:.2f}" if e.get("placed_odds") else "")
    if args.action == "parlay":
        book = cfg["bookmakers"]["playable"][0]
        legs = paper.open_legs(ledger, now, book)
        rp = RiskParams.from_config(cfg)
        parlay = build_best_parlay(legs, ParlayParams.from_config(cfg), rp.kelly_fraction, float(cfg["strategy"]["edge_threshold"]))
        if parlay is None:
            return "No parlay today: it needs open value bets on at least 2 different matches."
        stake, why = RiskManager(rp, float(cfg["bankroll_eur"])).size_parlay(parlay.p_stake, parlay.offered_odds, now)
        if stake <= 0:
            return f"No parlay: {why}."
        ledger, action = paper.upsert(ledger, paper.parlay_entry(parlay, stake, now))
        paper.save_ledger(lpath, ledger)
        return f"[PAPER] Parlay {action} (stake €{stake:.0f}): {parlay.describe()}"
    return "unknown action"
