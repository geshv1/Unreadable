"""Today's picks: the pick sheet the bot will send (singles, best parlay, timing advice).

Works at any moment on any data source. In Phase 3 the same function runs on live odds.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from .core import Candidate, MARKET_NAMES, book_name, league_name
from .data.base import Dataset
from .data.prices import PriceIndex
from .parlays.builder import Parlay, ParlayParams, build_best_parlay
from .staking.risk import RiskManager, RiskParams
from .strategies.base import DecisionContext, Strategy
from .timing.analyzer import bucket_for, bucket_labels

SOFIA = ZoneInfo("Europe/Sofia")


@dataclass
class Pick:
    candidate: Candidate
    stake: float
    place_before: datetime
    timing_advice: str
    min_odds: float  # below this price the edge falls under the threshold: skip


@dataclass
class PickSheet:
    at: datetime
    mode: str
    picks: list[Pick] = field(default_factory=list)
    parlay: Parlay | None = None
    parlay_stake: float = 0.0
    skipped: list[tuple[str, str]] = field(default_factory=list)
    matches_checked: int = 0

    def render(self) -> str:
        tag = self.mode.upper()
        when = self.at.astimezone(SOFIA)
        lines = [f"[{tag}] Picks for {when:%a %d %b %Y, %H:%M} (Sofia time) — {self.matches_checked} matches checked"]
        if not self.picks:
            lines.append("No bets today — no edge found. Bankroll protected.")
        else:
            n = len(self.picks)
            lines.append(f"{n} bet{'s' if n != 1 else ''} today")
        for i, p in enumerate(self.picks, 1):
            c = p.candidate
            ko = c.kickoff.astimezone(SOFIA)
            lines += [
                "",
                f"{i}. [{tag}] {c.home} v {c.away} · {league_name(c.league)} · {ko:%a %d %b %H:%M}",
                f"   {MARKET_NAMES[c.market]}: {c.label}",
                f"   Best odds: {c.odds:.2f} at {book_name(c.bookmaker)} · Stake: €{p.stake:.0f} · "
                f"Edge: {c.edge:+.1%} · Confidence: {c.confidence}",
                f"   Fair odds {c.fair_odds:.2f} · if your app shows less than {p.min_odds:.2f}, skip it",
                f"   Place before: {p.place_before.astimezone(SOFIA):%a %d %b %H:%M} · Timing: {p.timing_advice}",
                f"   Why: {c.explain()}",
            ]
        lines.append("")
        if self.parlay is None:
            lines.append("No parlay today.")
        else:
            pl = self.parlay
            lines.append(f"[{tag}] Best parlay · stake €{self.parlay_stake:.0f}")
            lines.append(f"   {pl.describe()}")
        return "\n".join(lines)


def _timing_advice(c: Candidate, at: datetime, recs: dict, edges) -> str:
    """Plain advice. The price already has value now, so the question is only: now, or wait?"""
    rec = (recs or {}).get((c.league, c.market))
    if not rec or not rec.get("window"):
        return "no clear timing pattern in this league yet; this price has value now, so place it now"
    labels = bucket_labels(edges)
    now_bucket = bucket_for((c.kickoff - at).total_seconds() / 3600.0, edges)
    best = rec["window"]
    if labels.index(best) <= labels.index(now_bucket):
        return f"place now: in this league prices usually only get worse from here ({rec['text']})"
    return (
        f"place now or wait: prices here are often better {best}, but this one already has value "
        "and the edge can disappear"
    )


def make_picks(
    ds: Dataset,
    prices: PriceIndex,
    strategy: Strategy,
    risk_params: RiskParams,
    parlay_params: ParlayParams,
    bankroll: float,
    at: datetime,
    horizon_hours: float = 72.0,
    max_age_s: float | None = None,
    min_minutes_before_kickoff: float = 15.0,
    timing_recs: dict | None = None,
    timing_edges=(72.0, 24.0, 6.0, 1.0),
    mode: str = "paper",
) -> PickSheet:
    sheet = PickSheet(at=at, mode=mode)
    risk = RiskManager(risk_params, bankroll)
    upcoming = ds.matches[
        (ds.matches["kickoff"] > at + timedelta(minutes=min_minutes_before_kickoff))
        & (ds.matches["kickoff"] <= at + timedelta(hours=horizon_hours))
    ]
    best: list[Candidate] = []
    pool: list[Candidate] = []
    for r in upcoming.itertuples(index=False):
        quotes = prices.quotes_asof(r.match_id, at, max_age_s)
        if not quotes:
            continue
        sheet.matches_checked += 1
        cands, notes = strategy.evaluate(DecisionContext(ds.match_info(r.match_id), at, quotes))
        ok = [c for c in cands if strategy.qualifies(c)[0]]
        if not ok:
            top = max(cands, key=lambda c: c.edge, default=None)
            sheet.skipped.append((f"{r.home} v {r.away}", f"best edge {top.edge:+.1%}" if top else "; ".join(notes)))
            continue
        pool.extend(ok)
        best.append(max(ok, key=lambda c: c.edge))
    for c in sorted(best, key=lambda c: c.edge, reverse=True):
        stake, why = risk.size_single(c.p_stake, c.effective_odds, c.match_id, at)
        if stake <= 0:
            sheet.skipped.append((f"{c.home} v {c.away}", why))
            continue
        risk.register_bet(stake, (c.match_id,), at)
        place_before = c.kickoff - timedelta(minutes=min_minutes_before_kickoff)
        min_odds = (1.0 + strategy.params.edge_threshold) / c.p_final
        sheet.picks.append(Pick(c, stake, place_before, _timing_advice(c, at, timing_recs, timing_edges), min_odds))
    parlay = build_best_parlay(pool, parlay_params, risk_params.kelly_fraction, strategy.params.edge_threshold)
    if parlay is not None:
        stake, _ = risk.size_parlay(parlay.p_stake, parlay.offered_odds, at)
        if stake > 0:
            sheet.parlay, sheet.parlay_stake = parlay, stake
    return sheet
