"""Command line. Every command is safe to re-run.

  python -m edgebot sample-backtest          # offline demo on made-up data
  python -m edgebot download                 # free past odds from football-data.co.uk
  python -m edgebot backtest                 # real past data (dev period only)
  python -m edgebot backtest --strategy B    # own model + market
  python -m edgebot compare-devig            # which margin-removal method is most accurate
  python -m edgebot timing                   # when the best prices appear, per league/market
  python -m edgebot picks                    # the pick sheet the bot would send (sample data)
  python -m edgebot variants                 # every variant tested so far
  python -m edgebot holdout --confirm        # the ONE-TIME sealed final test
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .config import ConfigError, data_dir, load_config


def _overrides(args) -> dict:
    o: dict = {}
    if getattr(args, "strategy", None):
        o.setdefault("strategy", {})["name"] = args.strategy
    if getattr(args, "threshold", None) is not None:
        o.setdefault("strategy", {})["edge_threshold"] = args.threshold
    if getattr(args, "risk", None):
        o.setdefault("risk", {})["level"] = args.risk
    if getattr(args, "no_parlays", False):
        o.setdefault("parlays", {})["enabled"] = False
    if getattr(args, "leagues", None):
        o.setdefault("backtest", {})["leagues"] = args.leagues.split(",")
    return o


def _add_common(p: argparse.ArgumentParser) -> None:
    p.add_argument("--config", help="path to config.yaml")
    p.add_argument("--strategy", help="A / market_value or B / model_blend")
    p.add_argument("--threshold", type=float, help="minimum edge, e.g. 0.03 for 3%%")
    p.add_argument("--risk", choices=["safe", "balanced", "aggressive"])
    p.add_argument("--leagues", help="comma-separated league codes, e.g. E0,E1,D1")
    p.add_argument("--no-parlays", action="store_true")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="edgebot", description="EdgeBot pricing engine and backtester")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("sample-backtest", help="offline demo on synthetic data")
    _add_common(p)
    p = sub.add_parser("backtest", help="backtest on past data (dev period only)")
    _add_common(p)
    p.add_argument("--source", choices=["sample", "football_data"], default="football_data")
    p = sub.add_parser("download", help="download free past odds from football-data.co.uk")
    p.add_argument("--config")
    p.add_argument("--force", action="store_true", help="re-download files that already exist")
    p = sub.add_parser("compare-devig", help="compare margin-removal methods on past closing prices")
    p.add_argument("--config")
    p.add_argument("--source", choices=["sample", "football_data"], default="football_data")
    p = sub.add_parser("timing", help="when do the best prices appear?")
    _add_common(p)
    p.add_argument("--source", choices=["sample", "football_data"], default="football_data")
    p = sub.add_parser("picks", help="the pick sheet the bot would send at a given moment")
    _add_common(p)
    p.add_argument("--source", choices=["sample", "football_data"], default="sample")
    p.add_argument("--at", help="moment in UTC, e.g. 2025-03-14T12:01 (default: a recent Tue/Fri price snapshot)")
    p.add_argument("--horizon", type=float, default=72.0, help="hours ahead to look (default 72)")
    p = sub.add_parser("variants", help="list every variant tested")
    p = sub.add_parser("holdout", help="run the one-time sealed final test")
    _add_common(p)
    p.add_argument("--source", choices=["sample", "football_data"], default="football_data")
    p.add_argument("--confirm", action="store_true", help="required: you understand this can only be run once")

    args = parser.parse_args(argv)
    try:
        cfg = load_config(getattr(args, "config", None), _overrides(args))
    except ConfigError as exc:
        print(f"Settings problem: {exc}")
        return 2

    from .backtest.runner import choose_devig, compute_periods, load_data, run_backtest

    if args.cmd == "sample-backtest":
        run = run_backtest(cfg, source="sample")
        print(run.report)
        print(f"\nSaved to {run.out_dir}")
        return 0

    if args.cmd == "backtest":
        run = run_backtest(cfg, source=args.source)
        print(run.report)
        print(f"\nSaved to {run.out_dir}")
        return 0

    if args.cmd == "download":
        from .data import football_data_uk

        b = cfg["backtest"]
        paths = football_data_uk.download(list(b["leagues"]), list(b["seasons"]), data_dir(), force=args.force)
        print(f"{len(paths)} files ready in {data_dir() / 'raw' / 'football_data'}")
        return 0

    if args.cmd == "compare-devig":
        ds = load_data(cfg, args.source, data_dir())
        periods = compute_periods(ds, cfg, "dev")
        info = choose_devig(ds, {**cfg, "pricing": {**cfg["pricing"], "devig_method": "auto"}}, periods.end)
        print("Margin-removal methods on closing reference prices (lower log loss = more accurate):")
        for market, res in info["scores"].items():
            print(f"  {market}:")
            for name, r in sorted(res.items(), key=lambda kv: kv[1]["log_loss"]):
                print(f"    {name:<15} log loss {r['log_loss']:.5f}   Brier {r['brier']:.5f}   ({r['n']} prices)")
        print(f"Most accurate overall: {info['method']}")
        return 0

    if args.cmd == "timing":
        run = run_backtest(cfg, source=args.source, save=False, benchmark=False, log=False)
        print("When do the best prices at your bookmakers appear?")
        for (league, market), rec in sorted(run.timing_recs.items()):
            print(f"  {league} · {market}: {rec['text']}")
        print()
        print(run.timing.to_string(index=False))
        return 0

    if args.cmd == "picks":
        from .picks_cli import run_picks

        print(run_picks(cfg, args.source, args.at, args.horizon))
        return 0

    if args.cmd == "variants":
        from .backtest.registry import read_variants

        rows = read_variants(data_dir() / "variants_log.jsonl")
        if not rows:
            print("No variants tested yet.")
        for r in rows:
            roi = r.get("roi")
            clv = r.get("clv")
            print(
                f"{r['at']}  {r['source']:<13} {r['mode']:<7} {r['strategy']:<12} edge≥{r['edge_threshold']:.0%} "
                f"{r['bets']:>5} bets  ROI {roi if roi is None else f'{roi:+.1%}'}  "
                f"CLV {clv if clv is None else f'{clv:+.1%}'}  {r['verdict']}  [{r['fingerprint']}]"
            )
        return 0

    if args.cmd == "holdout":
        if not args.confirm:
            print(
                "The sealed final test can be run only ONCE. Finish experimenting first, then run:\n"
                "  python -m edgebot holdout --confirm"
            )
            return 1
        from .backtest.registry import HoldoutAlreadyUsed

        try:
            run = run_backtest(cfg, source=args.source, mode="holdout")
        except HoldoutAlreadyUsed as exc:
            print(str(exc))
            return 1
        print(run.report)
        print(f"\nSaved to {run.out_dir}")
        return 0

    parser.print_help()
    return 1


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
