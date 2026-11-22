"""Strategy B — own Dixon–Coles model blended with the sharp market.

Same interface as Strategy A. The model gets only a minority weight, and staking uses a
probability shrunk back toward the market, because beating a sharp market is hard.
"""
from __future__ import annotations

from ..core import Candidate
from ..models.dixon_coles import Prediction
from ..pricing.consensus import effective_odds, log_pool
from .base import DecisionContext, Strategy, StrategyParams


class ModelBlendStrategy(Strategy):
    name = "model_blend"
    label = "B · Own model blended with the sharp market"

    def __init__(self, params: StrategyParams, predictions: dict[str, Prediction]):
        super().__init__(params)
        self.predictions = predictions

    def evaluate(self, ctx: DecisionContext) -> tuple[list[Candidate], list[str]]:
        cands: list[Candidate] = []
        notes: list[str] = []
        m = ctx.match
        pred = self.predictions.get(m.match_id)
        if pred is None or pred.fitted_at > ctx.decision_time or pred.trained_until >= ctx.decision_time:
            return cands, ["model not ready for this match (not enough past results yet)"]
        w = self.params.model_weight
        shrink = self.params.stake_shrink
        for market in self.params.markets:
            view = self.sharp_view(ctx, market)
            if view is None:
                notes.append(f"{market}: no fresh sharp reference price")
                continue
            p_model = pred.probs[market]
            p_blend = log_pool(p_model, view.probs, w)
            for (book, mk), q in ctx.quotes.items():
                if mk != market or book not in self.params.playable:
                    continue
                comm = float(self.params.commission.get(book, 0.0))
                for i, sel in enumerate(self.selections(market)):
                    o = q.odds[i]
                    eff = effective_odds(o, comm)
                    pf = float(p_blend[i])
                    pm = float(view.probs[i])
                    e = pf * eff - 1.0
                    cands.append(
                        Candidate(
                            match_id=m.match_id, league=m.league, market=market, selection=sel, bookmaker=book,
                            odds=o, effective_odds=eff, p_market=pm, p_model=float(p_model[i]), p_final=pf,
                            p_stake=pm + shrink * (pf - pm), edge=e,
                            feature_ts=max(view.newest, q.captured_at, pred.trained_until),
                            decision_time=ctx.decision_time, odds_captured_at=q.captured_at,
                            book_overround=q.overround, sharp_sources=view.sources, kickoff=m.kickoff,
                            home=m.home, away=m.away,
                            confidence=self.confidence(e, len(view.sources), float(view.spread[i])),
                            strategy=self.name,
                        )
                    )
        return cands, notes
