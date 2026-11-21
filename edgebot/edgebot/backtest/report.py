"""Plain-language backtest report. Honest by construction: it shows ranges, sample sizes,
how many variants were tried, and says so plainly when there is no edge."""
from __future__ import annotations

import math
from typing import TYPE_CHECKING

import pandas as pd

from ..config import RISK_LEVELS
from ..core import book_name, league_name
from .metrics import verdict

if TYPE_CHECKING:  # pragma: no cover
    from .runner import BacktestRun


def pct(x: float, signed: bool = True) -> str:
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return "n/a"
    return f"{x:+.1%}" if signed else f"{x:.1%}"


def rng(ci) -> str:
    lo, hi = ci
    if lo is None or hi is None or math.isnan(lo) or math.isnan(hi):
        return "range n/a"
    return f"95% range {lo:+.1%} to {hi:+.1%}"


def eur(x: float) -> str:
    return f"€{x:,.0f}" if x >= 0 else f"-€{abs(x):,.0f}"


def _table(df: pd.DataFrame, min_bets: int, label: str) -> list[str]:
    if df is None or len(df) == 0:
        return []
    lines = [label]
    for r in df.sort_values("bets", ascending=False).itertuples(index=False):
        group = r.group
        if isinstance(group, str) and " · " in group:
            lg, mk = group.split(" · ", 1)
            group = f"{league_name(lg)} · {mk}"
        elif isinstance(group, str) and group in ("bet365", "betano", "efbet", "winbet"):
            group = book_name(group)
        note = "" if r.bets >= min_bets else "  (not enough data)"
        lines.append(
            f"  {str(group):<34} {r.bets:>5} bets   ROI {pct(r.roi):>7}   CLV {pct(r.clv):>7}{note}"
        )
    return lines


def render_report(run: "BacktestRun", cfg: dict, source: str, fp: str) -> str:
    s = run.summary
    sg = s["singles"]
    pr = s["parlays"]
    min_bets = int(cfg["backtest"]["min_bets_for_verdict"])
    p = run.periods
    ds = run.dataset
    lines: list[str] = []
    title = "EDGEBOT BACKTEST"
    if ds.synthetic:
        title += " — SAMPLE (SYNTHETIC) DATA"
    elif p.mode == "holdout":
        title += " — SEALED FINAL TEST (one-time)"
    lines += [title, "=" * len(title)]
    if ds.synthetic:
        lines.append("Made-up data. This only shows the machinery works. It is NOT evidence of a real edge.")
    lines.append(f"Data: {ds.summary()}")
    period_end = f"{p.end:%d %b %Y}" if p.end else "latest data"
    lines.append(f"Bets simulated: {p.start:%d %b %Y} → {period_end}. Learning-only warm-up before that.")
    if p.mode == "dev":
        lines.append(f"Sealed for the one-time final test: everything from {p.holdout_start:%d %b %Y}.")
    strat = cfg["strategy"]
    risk = RISK_LEVELS[cfg["risk"]["level"]]
    lines.append(
        f"Strategy: {'A · market value' if strat['name'] == 'market_value' else 'B · own model + market'} · "
        f"edge ≥ {strat['edge_threshold']:.0%} · odds {strat['min_odds']:.2f}–{strat['max_odds']:.2f} · "
        f"risk {cfg['risk']['level']} (Kelly × {risk['kelly_fraction']:.2f}, max {risk['max_bet_pct']:.1%} per bet)"
    )
    present = set(ds.bookmakers)
    playable_here = [book_name(b) for b in cfg["bookmakers"]["playable"] if b in present]
    missing = [book_name(b) for b in cfg["bookmakers"]["playable"] if b not in present]
    refs = [book_name(b) for b in cfg["bookmakers"]["sharp"] if b in present]
    lines.append(f"Bookmakers you could bet at in this data: {', '.join(playable_here) or 'none'}"
                 + (f" ({', '.join(missing)} not in this data)" if missing else ""))
    lines.append(f"Fair-price reference: {', '.join(refs) or 'none'} · margin removal: {run.devig['method']} ({run.devig['chosen_by']})")
    b = cfg["backtest"]
    lim = b["account_limits"]
    lines.append(
        f"Pessimistic on purpose: {b['slippage'][0]:.0%}–{b['slippage'][1]:.0%} worse odds than quoted, "
        f"{b['rejection_rate']:.0%} of bets refused, stakes cut to €{lim['limited_max_stake_eur']:.0f} "
        f"after {lim['limit_after_bets']} bets at a bookmaker."
    )
    lines.append("")

    # --- singles ---
    lines.append("SINGLE BETS")
    if sg["n"] == 0:
        lines.append("  No bets. With these settings no price beat the fair price by enough. Bankroll protected.")
    else:
        lines.append(
            f"  {sg['n']} bets · staked {eur(sg['staked'])} · profit {eur(sg['pnl'])} · "
            f"ROI {pct(sg['roi'])} ({rng(sg['roi_ci'])})"
        )
        lines.append(
            f"  Beat the closing price (CLV, after margin): {pct(sg.get('clv_clv'))} ({rng(sg.get('clv_clv_ci', (math.nan, math.nan)))}); "
            f"{pct(sg.get('clv_beat_close'), signed=False)} of bets beat it"
        )
        lines.append(f"  Before removing the margin (gross CLV): {pct(sg.get('clv_clv_gross'))} — shown only for comparison")
        if sg.get("clv_excluded"):
            lines.append(f"  ({sg['clv_excluded']} bets were priced at the closing snapshot itself, so they are left out of CLV)")
        lines.append(f"  Hit rate {pct(sg['hit_rate'], signed=False)}")
        if s.get("limited_bets"):
            lines.append(
                f"  Account limits: {s['limited_bets']} bets placed while limited; asked {eur(s['requested_stake'])}, "
                f"accepted {eur(s['accepted_stake'])}"
            )
    lines.append(
        f"  Bankroll {eur(s['start_bankroll'])} → {eur(s['end_bankroll'])} · worst fall from a peak: {pct(-s['max_drawdown'])}"
        + (f" · auto-paused {s['pauses']}×" if s["pauses"] else "")
    )
    if s["pauses"]:
        lines.append(
            f"  (The auto-pause stops NEW bets at a {cfg['risk']['drawdown_pause']:.0%} fall; bets already placed still settle. "
            f"The backtest resumes after {cfg['backtest']['drawdown_pause_days']} days as if you had reviewed and continued.)"
        )
    short, text = verdict(sg, min_bets)
    lines += ["", f"VERDICT: {short}", f"  {text}", ""]

    # --- parlays ---
    lines.append("PARLAYS (every leg had value on its own)")
    if not cfg["parlays"]["enabled"]:
        lines.append("  Switched off in settings.")
    elif pr["n"] == 0:
        lines.append("  None built: there were never enough value legs at one bookmaker at the same time.")
    else:
        pshort, ptext = verdict(pr, min_bets)
        lines.append(
            f"  {pr['n']} parlays · avg {pr.get('avg_legs', 0):.1f} legs · staked {eur(pr['staked'])} · "
            f"profit {eur(pr['pnl'])} · ROI {pct(pr['roi'])} ({rng(pr['roi_ci'])})"
        )
        lines.append(
            f"  Avg payout offered {pr.get('avg_offered_odds', math.nan):.2f} vs fair {pr.get('avg_fair_odds', math.nan):.2f}; "
            f"bookmaker margin built in across legs {pct(pr.get('avg_compounded_margin'), signed=False)}"
        )
        lines.append(f"  CLV {pct(pr.get('clv_clv'))} · hit rate {pct(pr['hit_rate'], signed=False)} · verdict: {pshort}")
        lines.append("  Parlays swing much more than singles: long losing runs are normal even with an edge.")
    lines.append("")

    # --- breakdowns ---
    lines += _table(s.get("by_edge"), min_bets, "BY EDGE SIZE (does a bigger edge really mean more value?)")
    lines += _table(s.get("by_league_market"), min_bets, "BY LEAGUE AND MARKET")
    lines += _table(s.get("by_timing"), min_bets, "BY WHEN THE BET WAS PLACED")
    lines.append("")

    # --- timing ---
    lines.append("TIMING — when do the best prices at your bookmakers appear?")
    snaps = run.extra.get("snapshots_per_match", 0)
    if snaps and snaps <= 2:
        lines.append(
            f"  Note: this data has only {snaps:.0f} price snapshots per match (Tue/Fri afternoon + kick-off), so "
            "timing advice is coarse. Live odds in paper trading will measure it hour by hour."
        )
    if not run.timing_recs:
        lines.append("  Not enough data.")
    for (league, market), rec in sorted(run.timing_recs.items()):
        lines.append(f"  {league_name(league)} · {market}: {rec['text']}")
    t = run.timing
    if len(t):
        lines.append("  Average value of the available price vs the final fair price:")
        for (league, market), g in t.groupby(["league", "market"], sort=True):
            cells = ", ".join(f"{r.bucket} {pct(r.avg_value)}" for r in g.itertuples(index=False))
            lines.append(f"    {league_name(league)} · {market}: {cells}")
    lines.append("")

    # --- model check ---
    lines.append("DOES OUR OWN MODEL ADD ANYTHING? (out-of-sample, same matches, lower log loss = better)")
    if not run.benchmark:
        lines.append("  Not run.")
    for market, r in run.benchmark.items():
        if not r.get("n"):
            lines.append(f"  {market}: not enough data")
            continue
        lines.append(
            f"  {market} ({r['n']} matches): market {r['log_loss_market']:.4f} · model {r['log_loss_model']:.4f} · "
            f"blend {r['log_loss_blend']:.4f} · closing price {r['log_loss_close']:.4f}"
        )
        if r["model_adds_value"]:
            lines.append("    → The blend beat the market with a 95% range above zero. Strategy B may be worth paper-testing.")
        else:
            lines.append("    → The model does not beat the market. Use Strategy A (market value) for this market.")
    lines.append("")

    # --- honesty footer ---
    lines.append("HOW TO READ THIS")
    lines.append(f"  Variants tested so far on this data: {run.variants_tested}. The more you try, the more likely the best one is luck.")
    lines.append("  CLV (beating the closing price) is the most reliable early sign of an edge; profit needs far more bets to prove.")
    lines.append("  A backtest is not proof. Real money stays off until paper trading passes every go-live gate.")
    lines.append(f"  Variant ID: {fp}")
    return "\n".join(lines)
