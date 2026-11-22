"""Strategy A — market value: a soft bookmaker's price against the sharp market's fair price."""
from __future__ import annotations

from ..core import Candidate
from ..pricing.consensus import effective_odds
from .base import DecisionContext, Strategy


class MarketValueStrategy(Strategy):
    name = "market_value"
    label = "A · Market value (soft book vs sharp fair price)"

    def evaluate(self, ctx: DecisionContext) -> tuple[list[Candidate], list[str]]:
        cands: list[Candidate] = []
        notes: list[str] = []
        m = ctx.match
        for market in self.params.markets:
            view = self.sharp_view(ctx, market)
            if view is None:
                notes.append(f"{market}: no fresh sharp reference price")
                continue
            for (book, mk), q in ctx.quotes.items():
                if mk != market or book not in self.params.playable:
                    continue
                comm = float(self.params.commission.get(book, 0.0))
                for i, sel in enumerate(self.selections(market)):
                    o = q.odds[i]
                    eff = effective_odds(o, comm)
                    p = float(view.probs[i])
                    e = p * eff - 1.0
                    cands.append(
                        Candidate(
                            match_id=m.match_id, league=m.league, market=market, selection=sel, bookmaker=book,
                            odds=o, effective_odds=eff, p_market=p, p_model=None, p_final=p, p_stake=p, edge=e,
                            feature_ts=max(view.newest, q.captured_at), decision_time=ctx.decision_time,
                            odds_captured_at=q.captured_at, book_overround=q.overround, sharp_sources=view.sources,
                            kickoff=m.kickoff, home=m.home, away=m.away,
                            confidence=self.confidence(e, len(view.sources), float(view.spread[i])),
                            strategy=self.name,
                        )
                    )
        return cands, notes
