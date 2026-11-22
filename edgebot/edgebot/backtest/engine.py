"""Event-driven, chronological backtester.

Time only moves forward. At each moment where new prices arrived (+ a short reaction delay):
  1. bets whose results are now known are settled (results are never seen earlier);
  2. the strategy prices every match using only prices captured before this moment;
  3. the best qualifying selection per match is staked (best edges first, within risk caps);
  4. a parlay is considered from legs that each qualified on their own;
  5. execution is pessimistic: worse odds, random refusals, account limits.
Every decision (bet, skip, refusal) goes to the audit log with a reason.
"""
from __future__ import annotations

import heapq
import itertools
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd

from ..core import MARKETS, Candidate, book_name, selection_won, to_utc
from ..data.base import Dataset
from ..data.prices import PriceIndex
from ..leakage import assert_no_leakage
from ..parlays.builder import Parlay, ParlayParams, build_best_parlay
from ..staking.risk import RiskManager, RiskParams
from ..strategies.base import DecisionContext, Strategy
from ..timing.analyzer import DEFAULT_EDGES, bucket_for
from .execution_sim import ExecutionParams, ExecutionSimulator

SOFIA = ZoneInfo("Europe/Sofia")


@dataclass
class BacktestSettings:
    bankroll: float = 1000.0
    start: datetime | None = None
    end: datetime | None = None
    max_odds_age_s: float = 300.0
    latency_s: float = 60.0
    seed: int = 42
    drawdown_pause_days: int = 14
    parlay: ParlayParams = field(default_factory=ParlayParams)
    execution: ExecutionParams = field(default_factory=ExecutionParams)
    timing_edges: tuple[float, ...] = DEFAULT_EDGES
    min_minutes_before_kickoff: float = 15.0

    @classmethod
    def from_config(cls, cfg: dict, start: datetime | None, end: datetime | None) -> "BacktestSettings":
        b = cfg["backtest"]
        return cls(
            bankroll=float(cfg["bankroll_eur"]),
            start=start,
            end=end,
            max_odds_age_s=float(cfg["pricing"]["max_odds_age_seconds"]),
            latency_s=float(b["decision_latency_seconds"]),
            seed=int(b["seed"]),
            drawdown_pause_days=int(b["drawdown_pause_days"]),
            parlay=ParlayParams.from_config(cfg),
            execution=ExecutionParams.from_config(cfg),
            timing_edges=tuple(float(x) for x in cfg["timing"]["bucket_edges_hours"]),
            min_minutes_before_kickoff=float(cfg["strategy"]["min_minutes_before_kickoff"]),
        )


@dataclass
class _Match:
    match_id: str
    league: str
    kickoff: datetime
    home: str
    away: str
    home_goals: float
    away_goals: float
    result_at: datetime | None


@dataclass
class BacktestResult:
    bets: pd.DataFrame
    audit: pd.DataFrame
    curve: pd.DataFrame
    pauses: list[dict]
    settings: BacktestSettings
    strategy: str
    start_bankroll: float
    end_bankroll: float
    decisions: int


class Backtester:
    def __init__(
        self,
        dataset: Dataset,
        strategy: Strategy,
        prices: PriceIndex,
        settings: BacktestSettings,
        risk_params: RiskParams,
    ):
        self.ds = dataset
        self.strategy = strategy
        self.prices = prices
        self.s = settings
        self.risk_params = risk_params
        self.weights = strategy.params.sharp_weights

    # ------------------------------------------------------------------------------------
    def _matches(self) -> dict[str, _Match]:
        out = {}
        for r in self.ds.matches.itertuples(index=False):
            ra = None if pd.isna(r.result_at) or pd.isna(r.home_goals) else to_utc(r.result_at)
            out[r.match_id] = _Match(r.match_id, r.league, to_utc(r.kickoff), r.home, r.away, r.home_goals, r.away_goals, ra)
        return out

    def _decision_schedule(self, matches: dict[str, _Match]) -> dict[datetime, list[str]]:
        lat = timedelta(seconds=self.s.latency_s)
        buffer = timedelta(minutes=self.s.min_minutes_before_kickoff)
        sched: dict[datetime, list[str]] = defaultdict(list)
        for mid, m in matches.items():
            for ts in self.prices.snapshot_times(mid):
                t = ts + lat
                if t >= m.kickoff or t > m.kickoff - buffer:
                    continue  # too late for a person to place the bet
                if self.s.start is not None and t < self.s.start:
                    continue
                if self.s.end is not None and t >= self.s.end:
                    continue
                sched[t].append(mid)
        return sched

    # ------------------------------------------------------------------------------------
    def run(self) -> BacktestResult:
        rng = np.random.default_rng(self.s.seed)
        sim = ExecutionSimulator(self.s.execution, rng)
        risk = RiskManager(self.risk_params, self.s.bankroll)
        matches = self._matches()
        schedule = self._decision_schedule(matches)

        bets: dict[int, dict] = {}
        audit: list[dict] = []
        curve: list[tuple[datetime, float]] = []
        pauses: list[dict] = []
        heap: list[tuple[datetime, int]] = []
        bet_ids = itertools.count(1)
        parlays_per_day: dict = defaultdict(int)
        decisions = 0

        def settle_until(t: datetime | None) -> None:
            while heap and (t is None or heap[0][0] <= t):
                when, bid = heapq.heappop(heap)
                self._settle(bets[bid], matches, risk, when)
                curve.append((when, risk.bankroll))
                if risk.paused and not any(p.get("end") is None for p in pauses):
                    pauses.append({"start": when, "end": None, "reason": risk.pause_reason, "bankroll": risk.bankroll})

        def log(t, m: _Match, action: str, reason: str, c: Candidate | None = None, stake: float = 0.0) -> None:
            audit.append(
                {
                    "time": t, "match_id": m.match_id, "league": m.league, "match": f"{m.home} v {m.away}",
                    "action": action, "market": c.market if c else None, "selection": c.selection if c else None,
                    "bookmaker": c.bookmaker if c else None, "odds": c.odds if c else None,
                    "edge": c.edge if c else None, "stake": stake, "reason": reason,
                }
            )

        for t in sorted(schedule):
            settle_until(t)
            if risk.paused and risk.paused_since is not None:
                if t - risk.paused_since >= timedelta(days=self.s.drawdown_pause_days):
                    risk.resume(t)
                    for p in pauses:
                        if p["end"] is None:
                            p["end"] = t
            best_per_match: list[tuple[Candidate, _Match]] = []
            parlay_pool: list[Candidate] = []
            for mid in schedule[t]:
                m = matches[mid]
                if self.risk_params.one_bet_per_match and mid in risk.matches_with_bets:
                    continue
                quotes = self.prices.quotes_asof(mid, t, self.s.max_odds_age_s)
                if not quotes:
                    continue
                decisions += 1
                ctx = DecisionContext(self.ds.match_info(mid), t, quotes)
                cands, notes = self.strategy.evaluate(ctx)
                qualified: list[Candidate] = []
                best_rejected: tuple[Candidate, str] | None = None
                for c in cands:
                    assert_no_leakage(c.feature_ts, t, f"{mid} {c.market}/{c.selection}@{c.bookmaker}")
                    ok, why = self.strategy.qualifies(c)
                    if ok:
                        qualified.append(c)
                    elif best_rejected is None or c.edge > best_rejected[0].edge:
                        best_rejected = (c, why)
                if not qualified:
                    if best_rejected is not None:
                        log(t, m, "SKIP", f"no value: best was {best_rejected[0].label} — {best_rejected[1]}", best_rejected[0])
                    else:
                        log(t, m, "SKIP", "; ".join(notes) or "no playable prices")
                    continue
                parlay_pool.extend(qualified)
                best_per_match.append((max(qualified, key=lambda c: c.edge), m))

            # Best edges get first claim on the day's exposure.
            for c, m in sorted(best_per_match, key=lambda x: x[0].edge, reverse=True):
                stake, why = risk.size_single(c.p_stake, c.effective_odds, m.match_id, t)
                if stake <= 0:
                    log(t, m, "SKIP", f"risk rule: {why}", c)
                    continue
                fill = sim.fill(c.bookmaker, c.odds, stake)
                if not fill.accepted:
                    log(t, m, "REFUSED", fill.note, c, stake)
                    continue
                bid = next(bet_ids)
                bets[bid] = self._single_record(bid, c, m, t, fill)
                risk.register_bet(fill.accepted_stake, (m.match_id,), t, single=True)
                if m.result_at is not None:
                    heapq.heappush(heap, (m.result_at, bid))
                log(t, m, "BET", c.explain() + (f" ({fill.note})" if fill.note != "accepted" else ""), c, fill.accepted_stake)

            if self.s.parlay.enabled and parlay_pool:
                day = t.astimezone(SOFIA).date()
                if parlays_per_day[day] < self.s.parlay.max_per_day:
                    parlay = build_best_parlay(
                        parlay_pool, self.s.parlay, self.risk_params.kelly_fraction,
                        min_leg_edge=self.strategy.params.edge_threshold,
                    )
                    if parlay is not None:
                        placed = self._place_parlay(parlay, t, risk, sim, matches, bets, heap, bet_ids, audit)
                        if placed:
                            parlays_per_day[day] += 1

        settle_until(None)
        bets_df = pd.DataFrame(list(bets.values()))
        audit_df = pd.DataFrame(audit)
        curve_df = pd.DataFrame(curve, columns=["time", "bankroll"])
        return BacktestResult(
            bets=bets_df, audit=audit_df, curve=curve_df, pauses=pauses, settings=self.s,
            strategy=self.strategy.name, start_bankroll=self.s.bankroll, end_bankroll=risk.bankroll,
            decisions=decisions,
        )

    # ------------------------------------------------------------------------------------
    def _single_record(self, bid: int, c: Candidate, m: _Match, t: datetime, fill) -> dict:
        hours = (m.kickoff - t).total_seconds() / 3600.0
        return {
            "bet_id": bid, "kind": "single", "placed_at": t, "feature_ts": c.feature_ts, "kickoff": m.kickoff,
            "match_ids": (m.match_id,), "match": f"{m.home} v {m.away}", "league": m.league, "market": c.market,
            "selection": c.selection, "label": c.label, "bookmaker": c.bookmaker, "quoted_odds": c.odds,
            "fill_odds": fill.fill_odds, "requested_stake": fill.requested_stake, "stake": fill.accepted_stake,
            "account_limited": fill.limited, "edge": c.edge, "p_final": c.p_final, "p_stake": c.p_stake,
            "p_model": c.p_model, "confidence": c.confidence, "book_margin": c.book_overround,
            "hours_before_ko": hours, "timing_bucket": bucket_for(hours, self.s.timing_edges),
            "reason": c.explain(), "status": "open", "pnl": 0.0, "settled_at": None, "clv": np.nan,
            "clv_gross": np.nan, "n_legs": 1, "legs": [(m.match_id, c.market, c.selection, fill.fill_odds, c.odds_captured_at)],
            "odds_captured_at": c.odds_captured_at, "clv_informative": False,
            "compounded_margin": c.book_overround, "fair_odds": c.fair_odds,
        }

    def _place_parlay(self, parlay: Parlay, t, risk, sim, matches, bets, heap, bet_ids, audit) -> bool:
        first = matches[parlay.legs[0].match_id]
        stake, why = risk.size_parlay(parlay.p_stake, parlay.offered_odds, t)
        base = {
            "time": t, "match_id": ",".join(parlay.match_ids), "league": first.league,
            "match": " + ".join(f"{l.home} v {l.away}" for l in parlay.legs), "market": "PARLAY",
            "selection": None, "bookmaker": parlay.bookmaker, "odds": parlay.offered_odds, "edge": parlay.ev,
        }
        if stake <= 0:
            audit.append({**base, "action": "SKIP", "stake": 0.0, "reason": f"parlay: {why}"})
            return False
        fill = sim.fill(parlay.bookmaker, parlay.offered_odds, stake, n_legs=parlay.n_legs)
        if not fill.accepted:
            audit.append({**base, "action": "REFUSED", "stake": stake, "reason": f"parlay: {fill.note}"})
            return False
        bid = next(bet_ids)
        legs = []
        result_times = []
        ratio = fill.fill_odds / parlay.offered_odds
        per_leg = ratio ** (1.0 / parlay.n_legs)
        for l in parlay.legs:
            legs.append((l.match_id, l.market, l.selection, l.odds * per_leg, l.odds_captured_at))
            ra = matches[l.match_id].result_at
            result_times.append(ra)
        hours = min((matches[l.match_id].kickoff - t).total_seconds() / 3600.0 for l in parlay.legs)
        bets[bid] = {
            "bet_id": bid, "kind": "parlay", "placed_at": t,
            "feature_ts": max(l.feature_ts for l in parlay.legs), "kickoff": min(matches[l.match_id].kickoff for l in parlay.legs),
            "match_ids": parlay.match_ids, "match": base["match"], "league": first.league, "market": "PARLAY",
            "selection": "+".join(f"{l.market}:{l.selection}" for l in parlay.legs),
            "label": " + ".join(l.label for l in parlay.legs), "bookmaker": parlay.bookmaker,
            "quoted_odds": parlay.offered_odds, "fill_odds": fill.fill_odds, "requested_stake": fill.requested_stake,
            "stake": fill.accepted_stake, "account_limited": fill.limited, "edge": parlay.ev, "p_final": parlay.p_true,
            "p_stake": parlay.p_stake, "p_model": None, "confidence": min((l.confidence for l in parlay.legs), key=["low", "medium", "high"].index),
            "book_margin": parlay.compounded_margin, "hours_before_ko": hours,
            "timing_bucket": bucket_for(hours, self.s.timing_edges), "reason": parlay.describe(), "status": "open",
            "pnl": 0.0, "settled_at": None, "clv": np.nan, "clv_gross": np.nan, "n_legs": parlay.n_legs, "legs": legs,
            "compounded_margin": parlay.compounded_margin, "fair_odds": parlay.fair_odds,
            "odds_captured_at": max(l.odds_captured_at for l in parlay.legs), "clv_informative": False,
        }
        risk.register_bet(fill.accepted_stake, parlay.match_ids, t, single=False)
        if all(rt is not None for rt in result_times):
            heapq.heappush(heap, (max(result_times), bid))
        audit.append({**base, "action": "BET", "stake": fill.accepted_stake, "reason": parlay.describe()})
        return True

    def _settle(self, bet: dict, matches: dict[str, _Match], risk: RiskManager, when: datetime) -> None:
        won = True
        void = False
        p_close_prod = 1.0
        raw_close_prod = 1.0
        clv_ok = True
        informative = True
        for mid, market, sel, leg_odds, priced_at in bet["legs"]:
            m = matches[mid]
            if m.result_at is None or pd.isna(m.home_goals):
                void = True
                break
            won = won and selection_won(market, sel, int(m.home_goals), int(m.away_goals))
            p, used, raw, close_ts = self.prices.closing_snapshot(mid, market, m.kickoff, self.weights)
            if p is None:
                clv_ok = False
                continue
            # CLV only means something if the closing price came AFTER the price we bet at.
            informative = informative and close_ts is not None and priced_at < close_ts
            i = MARKETS[market].index(sel)
            p_close_prod *= float(p[i])
            ref = max(raw, key=lambda b: self.weights.get(b, 0.0)) if raw else None
            raw_close_prod *= raw[ref][i] if ref else np.nan
        stake = bet["stake"]
        if void:
            bet["status"], bet["pnl"] = "void", 0.0
        else:
            bet["status"] = "won" if won else "lost"
            bet["pnl"] = stake * (bet["fill_odds"] - 1.0) if won else -stake
        bet["settled_at"] = when
        if clv_ok and not void:
            bet["clv"] = bet["fill_odds"] * p_close_prod - 1.0
            bet["clv_gross"] = bet["fill_odds"] / raw_close_prod - 1.0
            bet["clv_informative"] = informative
        risk.settle(stake, bet["pnl"], when)
