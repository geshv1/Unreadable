"""Check one match on demand: from a link, a screenshot's team names and odds, or plain text.

Tells you, in plain words:
- the fair price of every outcome and the minimum Betano odds that would be worth betting
- with Betano's odds: which bet (if any) has value, the stake, and the edge
- timing: place-before time and what history says about early vs late prices in that league
- a parlay, but only from value bets on different matches checked today
It never guesses: an unknown match or a missing fair price is said plainly.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from .core import MARKET_NAMES, MARKETS, Candidate, book_name, league_name, selection_label, to_utc
from .data.base import Dataset
from .data.prices import PriceIndex
from .matching import MatchHit, find_match
from .parlays.builder import Parlay, ParlayParams, build_best_parlay
from .pricing.consensus import effective_odds
from .staking.risk import RiskManager, RiskParams
from .strategies.base import DecisionContext, StrategyParams
from .strategies.market_value import MarketValueStrategy

SOFIA = ZoneInfo("Europe/Sofia")
STALE_WARN_HOURS = 12.0
STALE_REFUSE_HOURS = 120.0
MOVED_PP = 0.03  # with an old fair price, a 3-point gap to the bookmaker's own view means the market moved
_ODDS_KEYS = {
    "1": ("1X2", "H"), "h": ("1X2", "H"), "home": ("1X2", "H"),
    "x": ("1X2", "D"), "d": ("1X2", "D"), "draw": ("1X2", "D"),
    "2": ("1X2", "A"), "a": ("1X2", "A"), "away": ("1X2", "A"),
    "o": ("OU2.5", "O"), "over": ("OU2.5", "O"), "o2.5": ("OU2.5", "O"), "over2.5": ("OU2.5", "O"),
    "u": ("OU2.5", "U"), "under": ("OU2.5", "U"), "u2.5": ("OU2.5", "U"), "under2.5": ("OU2.5", "U"),
}


def parse_odds(text: str | None) -> dict[tuple[str, str], float]:
    """'1=2.25 X=3.4 2=3.1 O=1.9 U=1.95' (also H/D/A, home/draw/away, over/under; ',' or '.' decimals)."""
    out: dict[tuple[str, str], float] = {}
    if not text:
        return out
    for key, val in re.findall(r"([A-Za-z0-9.]+)\s*[=:]\s*(\d+(?:[.,]\d+)?)", text):
        k = key.lower()
        if k in _ODDS_KEYS:
            o = float(val.replace(",", "."))
            if o > 1.0:
                out[_ODDS_KEYS[k]] = o
    return out


@dataclass
class Line:
    market: str
    selection: str
    label: str
    p_fair: float
    fair_odds: float
    min_odds: float
    offered: float | None = None
    edge: float | None = None
    verdict: str = ""


@dataclass
class CheckResult:
    query: str
    at: datetime
    mode: str
    hit: MatchHit | None = None
    alternatives: list[MatchHit] = field(default_factory=list)
    bookmaker: str = "betano"
    lines: list[Line] = field(default_factory=list)
    refs: tuple[str, ...] = ()
    ref_time: datetime | None = None
    best: Candidate | None = None
    stake: float = 0.0
    other_value: list[Candidate] = field(default_factory=list)
    timing: list[str] = field(default_factory=list)
    parlay: Parlay | None = None
    parlay_stake: float = 0.0
    parlay_note: str = ""
    warnings: list[str] = field(default_factory=list)
    problem: str = ""
    have_odds: bool = False

    @property
    def ref_age_hours(self) -> float | None:
        return None if self.ref_time is None else (self.at - self.ref_time).total_seconds() / 3600.0

    def render(self) -> str:
        tag = f"[{self.mode.upper()}]"
        if self.hit is None:
            out = [f"{tag} I couldn't find that match in my free data, so I won't guess."]
            if self.alternatives:
                out.append("Closest matches I have: " + "; ".join(
                    f"{a.home} v {a.away} ({league_name(a.league)}, {a.kickoff.tz_convert(SOFIA):%a %d %b %H:%M})"
                    for a in self.alternatives))
            out.append("I cover 22 European leagues (England, Scotland, Germany, Spain, Italy, France, Netherlands, "
                       "Belgium, Portugal, Turkey, Greece). Send the team names exactly as on the ticket if it's one of those.")
            return "\n".join(out)
        h = self.hit
        ko = h.kickoff.tz_convert(SOFIA)
        book = book_name(self.bookmaker)
        out = [f"{tag} {h.home} v {h.away} · {league_name(h.league)} · {ko:%a %d %b, %H:%M} (Sofia time)"]
        if self.problem:
            out.append(self.problem)
            return "\n".join(out)
        age = self.ref_age_hours
        when = self.ref_time.astimezone(SOFIA) if self.ref_time else None
        out.append(
            f"Fair prices from {', '.join(book_name(r) for r in self.refs)} (margin removed), "
            f"published {when:%a %d %b %H:%M}" + (f" — {age:.0f} h old" if age is not None else "")
        )
        for market in MARKETS:
            rows = [l for l in self.lines if l.market == market]
            if not rows:
                continue
            out.append(f"\n{MARKET_NAMES[market]}")
            for l in rows:
                s = f"  {l.label:<22} fair {l.fair_odds:5.2f} · worth it at {book} from {l.min_odds:5.2f}"
                if l.offered is not None:
                    s += f" · {book} {l.offered:.2f} {l.verdict}"
                out.append(s)
        out.append("")
        if not self.have_odds:
            out.append(
                f"Send me {book}'s odds for this match (a screenshot or e.g. '1=2.10 X=3.40 2=3.60 O=1.90 U=1.95') "
                f"and I'll tell you if one is worth it. Rule of thumb: only bet if {book} pays at least the 'worth it from' price."
            )
        elif self.best is None:
            out.append(f"❌ No value at these {book} odds. Skip this match. Bankroll protected.")
        else:
            c = self.best
            place_before = (c.kickoff - timedelta(minutes=15)).astimezone(SOFIA)
            out.append(
                f"✅ BET: {c.label} @ {c.odds:.2f} at {book} · stake €{self.stake:.0f} · edge {c.edge:+.1%} · "
                f"confidence {c.confidence}"
            )
            out.append(f"   Place before {place_before:%a %d %b %H:%M}. If the odds drop below "
                       f"{next(l.min_odds for l in self.lines if l.market == c.market and l.selection == c.selection):.2f}, skip it.")
            out.append(f"   Why: {c.explain()}")
            if self.other_value:
                others = ", ".join(f"{o.label} ({o.edge:+.1%})" for o in self.other_value)
                out.append(f"   Also value: {others} — but take only ONE bet per match: two bets on the same game double your risk on it.")
        if self.timing:
            out.append("")
            out += [f"Timing: {t}" if i == 0 else f"        {t}" for i, t in enumerate(self.timing)]
        out.append("")
        if self.parlay is not None:
            out.append(f"Parlay (stake €{self.parlay_stake:.0f}): {self.parlay.describe()}")
        else:
            out.append(f"Parlay: {self.parlay_note}")
        for w in self.warnings:
            out.append(f"⚠ {w}")
        out.append(f"{tag} Nothing is bet for you. You decide and place it yourself.")
        return "\n".join(out)


# ---- parlay memory: value bets found by checks today -------------------------------------
def _ledger_path(data_dir: Path, at: datetime) -> Path:
    return Path(data_dir) / "checks" / f"{at.astimezone(SOFIA):%Y-%m-%d}.json"


def _save_leg(data_dir: Path, at: datetime, c: Candidate) -> None:
    path = _ledger_path(data_dir, at)
    path.parent.mkdir(parents=True, exist_ok=True)
    legs = json.loads(path.read_text()) if path.exists() else []
    legs = [l for l in legs if l["match_id"] != c.match_id]
    legs.append({k: (v.isoformat() if isinstance(v, datetime) else list(v) if isinstance(v, tuple) else v)
                 for k, v in c.__dict__.items()})
    path.write_text(json.dumps(legs, indent=1))


def _load_legs(data_dir: Path, at: datetime) -> list[Candidate]:
    path = _ledger_path(data_dir, at)
    if not path.exists():
        return []
    out = []
    for d in json.loads(path.read_text()):
        for k in ("feature_ts", "decision_time", "odds_captured_at", "kickoff"):
            d[k] = datetime.fromisoformat(d[k])
        d["sharp_sources"] = tuple(d["sharp_sources"])
        out.append(Candidate(**d))
    return out


# ---- the check ---------------------------------------------------------------------------
def check_match(
    query: str,
    ds: Dataset,
    cfg: dict,
    at: datetime,
    offered: dict[tuple[str, str], float] | None = None,
    bookmaker: str | None = None,
    data_dir: Path | None = None,
    timing_recs: dict | None = None,
    remember: bool = True,
    extra_legs: list[Candidate] | None = None,
) -> CheckResult:
    sp = StrategyParams.from_config(cfg)
    book = bookmaker or sp.playable[0]
    res = CheckResult(query=query, at=at, mode=cfg["mode"], bookmaker=book, have_odds=bool(offered))
    hit, alts = find_match(query, ds.matches)
    res.hit, res.alternatives = hit, alts
    if hit is None:
        return res
    kickoff = to_utc(hit.kickoff)
    if kickoff <= at + timedelta(minutes=float(cfg["strategy"]["min_minutes_before_kickoff"])):
        res.problem = "This match has started or starts in less than 15 minutes — too late to check it safely."
        return res

    prices = PriceIndex(ds.odds[ds.odds["match_id"] == hit.match_id], sp.sharp, "multiplicative")
    quotes = prices.quotes_asof(hit.match_id, at, None)
    strategy = MarketValueStrategy(sp)
    ctx = DecisionContext(ds.match_info(hit.match_id), at, quotes)
    views = {m: strategy.sharp_view(ctx, m) for m in sp.markets}
    views = {m: v for m, v in views.items() if v is not None}
    if not views:
        res.problem = "No sharp reference price for this match in my free data yet, so I can't judge it. I won't guess."
        return res
    res.refs = tuple(sorted({b for v in views.values() for b in v.sources}))
    res.ref_time = min(v.newest for v in views.values())
    age = res.ref_age_hours or 0.0
    if age > STALE_REFUSE_HOURS:
        res.problem = f"My free fair price for this match is {age:.0f} hours old — too old to trust. I won't guess."
        return res

    thr = sp.edge_threshold
    offered = offered or {}
    cands: list[Candidate] = []
    for market, view in views.items():
        sels = MARKETS[market]
        given = [offered.get((market, s)) for s in sels]
        complete = all(g is not None for g in given)
        ovr = sum(1.0 / g for g in given) - 1.0 if complete else 0.06
        moved = None
        if complete and age > STALE_WARN_HOURS:
            q = [1.0 / g for g in given]
            book_view = [x / sum(q) for x in q]
            gaps = [book_view[i] - float(view.probs[i]) for i in range(len(sels))]
            j = max(range(len(sels)), key=lambda i: abs(gaps[i]))
            if abs(gaps[j]) > MOVED_PP:
                moved = (selection_label(market, sels[j], hit.home, hit.away), gaps[j])
                res.warnings.append(
                    f"{MARKET_NAMES[market]}: {book_name(book)}'s prices differ a lot from the {age:.0f}-hour-old fair price "
                    f"({moved[0]} is {abs(gaps[j]):.0%} {'more' if gaps[j] > 0 else 'less'} likely by {book_name(book)}'s odds). "
                    "The market has probably moved on news since then, so any 'edge' here isn't reliable."
                )
        for i, sel in enumerate(sels):
            p = float(view.probs[i])
            line = Line(market, sel, selection_label(market, sel, hit.home, hit.away), p, 1.0 / p, (1.0 + thr) / p)
            o = given[i]
            if o is not None:
                eff = effective_odds(o, float(sp.commission.get(book, 0.0)))
                e = p * eff - 1.0
                line.offered, line.edge = o, e
                c = Candidate(
                    match_id=hit.match_id, league=hit.league, market=market, selection=sel, bookmaker=book, odds=o,
                    effective_odds=eff, p_market=p, p_model=None, p_final=p, p_stake=p, edge=e,
                    feature_ts=max(view.newest, at - timedelta(seconds=1)), decision_time=at,
                    odds_captured_at=at - timedelta(seconds=1), book_overround=ovr, sharp_sources=view.sources,
                    kickoff=kickoff, home=hit.home, away=hit.away,
                    confidence="low" if age > STALE_WARN_HOURS else strategy.confidence(e, len(view.sources), float(view.spread[i])),
                    strategy="check",
                )
                ok, why = strategy.qualifies(c)
                if ok and moved is not None:
                    ok, why = False, "fair price out of date: the market moved"
                line.verdict = f"✅ {e:+.1%}" if ok else (f"❌ {e:+.1%}" if e < thr else f"⚠ {e:+.1%} ({why})")
                if ok:
                    cands.append(c)
            res.lines.append(line)

    risk = RiskManager(RiskParams.from_config(cfg), float(cfg["bankroll_eur"]))
    if cands:
        cands.sort(key=lambda c: c.edge, reverse=True)
        res.best = cands[0]
        res.other_value = cands[1:]
        res.stake, _ = risk.size_single(res.best.p_stake, res.best.effective_odds, hit.match_id, at)
        if age > STALE_WARN_HOURS and res.stake > 0:
            half = max(risk.p.min_stake, risk._round(res.stake / 2))
            if half < res.stake:
                res.stake = half
                res.warnings.append("Stake halved because the fair price is old.")
        risk.register_bet(res.stake, (hit.match_id,), at)
        if data_dir is not None and remember:
            _save_leg(data_dir, at, res.best)

    # timing
    hours = (kickoff - at).total_seconds() / 3600.0
    res.timing.append(f"kick-off in {hours:.0f} h; place before {(kickoff - timedelta(minutes=15)).astimezone(SOFIA):%a %H:%M}.")
    rec = (timing_recs or {}).get((hit.league, res.best.market if res.best else "1X2"))
    if rec:
        src = f" ({rec['measured_on']} prices)" if rec.get("measured_on") else ""
        res.timing.append(f"history{src} in {league_name(hit.league)}: {rec['text']}.")
    if res.best is not None:
        res.timing.append("This price has value now; odds can move either way, so don't wait for a better one.")
    else:
        res.timing.append("Free fair prices are refreshed around Tuesday and Friday; a later check can give a different answer.")

    # parlay from today's value bets on different matches
    pp = ParlayParams.from_config(cfg)
    if not pp.enabled:
        res.parlay_note = "switched off in settings."
    else:
        legs = _load_legs(data_dir, at) if data_dir is not None else []
        for leg in extra_legs or []:
            if all(l.match_id != leg.match_id for l in legs) and (res.best is None or leg.match_id != res.best.match_id):
                legs.append(leg)
        if res.best is not None and all(l.match_id != res.best.match_id for l in legs):
            legs.append(res.best)
        cutoff = at + timedelta(minutes=15)
        legs = [l for l in legs if l.kickoff > cutoff and l.bookmaker == book]
        parlay = build_best_parlay(legs, pp, risk.p.kelly_fraction, thr) if len({l.match_id for l in legs}) >= 2 else None
        if parlay is not None and (res.best is None or res.best.match_id in parlay.match_ids):
            stake, _ = risk.size_parlay(parlay.p_stake, parlay.offered_odds, at)
            if stake > 0:
                res.parlay, res.parlay_stake = parlay, stake
        if res.parlay is None:
            n = len({l.match_id for l in legs})
            res.parlay_note = (
                "No parlay today. A parlay needs value bets on at least 2 different matches — "
                f"I have {n} so far today. Send me more matches and I'll combine the ones with value."
            )

    # warnings
    if age > STALE_WARN_HOURS:
        res.warnings.append(
            f"The free fair price is {age:.0f} h old. If there was news since (injuries, line-ups, weather), "
            "it may be out of date — that's why confidence is low."
        )
    if hit.league not in cfg["football"]["leagues"]:
        res.warnings.append(
            f"{league_name(hit.league)} is outside your main leagues. Past tests found no reliable edge in smaller leagues."
        )
    if offered and len(offered) < 5:
        res.warnings.append("I only had some of the odds; send all five (1, X, 2, Over, Under) for a full check.")
    return res
