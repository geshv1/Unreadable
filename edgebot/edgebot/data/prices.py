"""Fast point-in-time lookup of odds: "what prices could I see at time t?"."""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from typing import Iterable, Mapping

import numpy as np
import pandas as pd

from ..core import MARKETS
from ..pricing.consensus import sharp_consensus
from ..pricing.devig import devig


@dataclass(frozen=True)
class QuoteRow:
    bookmaker: str
    market: str
    captured_at: datetime
    odds: tuple[float, ...]          # in MARKETS[market] order
    fair: tuple[float, ...] | None   # de-vigged probabilities (reference books only)
    overround: float


class PriceIndex:
    def __init__(self, odds: pd.DataFrame, sharp_books: Iterable[str], devig_method: str = "multiplicative"):
        self.sharp_books = frozenset(sharp_books)
        self.devig_method = devig_method
        snaps: dict[str, dict[datetime, dict[tuple[str, str], QuoteRow]]] = defaultdict(lambda: defaultdict(dict))
        for market, sels in MARKETS.items():
            sub = odds[odds["market"] == market]
            if sub.empty:
                continue
            wide = sub.pivot_table(
                index=["match_id", "bookmaker", "captured_at"], columns="selection", values="odds", aggfunc="last"
            )
            if any(s not in wide.columns for s in sels):
                continue
            wide = wide[list(sels)].dropna()
            arr = wide.to_numpy(dtype=float)
            ok = (arr > 1.0).all(axis=1)
            wide, arr = wide[ok], arr[ok]
            if len(arr) == 0:
                continue
            ovr = (1.0 / arr).sum(axis=1) - 1.0
            books = wide.index.get_level_values("bookmaker").to_numpy()
            is_sharp = np.isin(books, list(self.sharp_books))
            fair = np.full_like(arr, np.nan)
            if is_sharp.any():
                fair[is_sharp] = devig(arr[is_sharp], devig_method)
            mids = wide.index.get_level_values("match_id").to_numpy()
            times = [t.to_pydatetime() for t in wide.index.get_level_values("captured_at")]
            for i in range(len(arr)):
                f = tuple(fair[i]) if is_sharp[i] else None
                snaps[mids[i]][times[i]][(books[i], market)] = QuoteRow(
                    books[i], market, times[i], tuple(arr[i]), f, float(ovr[i])
                )
        self._snaps = {mid: dict(v) for mid, v in snaps.items()}
        self._times = {mid: sorted(v) for mid, v in self._snaps.items()}

    def match_ids(self) -> list[str]:
        return list(self._snaps)

    def snapshot_times(self, match_id: str) -> list[datetime]:
        return self._times.get(match_id, [])

    def quotes_asof(self, match_id: str, t: datetime, max_age_s: float | None) -> dict[tuple[str, str], QuoteRow]:
        """Latest quote per (bookmaker, market) captured strictly before t and not older than max_age_s."""
        out: dict[tuple[str, str], QuoteRow] = {}
        snaps = self._snaps.get(match_id)
        if not snaps:
            return out
        for ts in reversed(self._times[match_id]):
            if ts >= t:
                continue
            if max_age_s is not None and (t - ts).total_seconds() > max_age_s:
                break
            for key, q in snaps[ts].items():
                out.setdefault(key, q)
        return out

    def _sharp_at(self, match_id: str, market: str, pick_latest: bool, before: datetime | None) -> dict[str, QuoteRow]:
        snaps = self._snaps.get(match_id)
        found: dict[str, QuoteRow] = {}
        if not snaps:
            return found
        times = self._times[match_id]
        order = reversed(times) if pick_latest else iter(times)
        for ts in order:
            if before is not None and ts > before:
                continue
            for (book, m), q in snaps[ts].items():
                if m == market and q.fair is not None and book not in found:
                    found[book] = q
            if found and not pick_latest:
                break
        return found

    def closing_snapshot(self, match_id: str, market: str, kickoff: datetime, weights: Mapping[str, float]):
        """De-vigged sharp consensus from the last reference prices at or before kick-off (for CLV).

        Returns (probabilities, books used, raw odds per book, time of the oldest closing price used).
        """
        found = self._sharp_at(match_id, market, pick_latest=True, before=kickoff)
        p, used = sharp_consensus({b: np.array(q.fair) for b, q in found.items()}, weights)
        raw = {b: q.odds for b, q in found.items()}
        ts = min((found[b].captured_at for b in used), default=None)
        return p, used, raw, ts

    def closing_fair(self, match_id: str, market: str, kickoff: datetime, weights: Mapping[str, float]):
        p, used, raw, _ = self.closing_snapshot(match_id, market, kickoff, weights)
        return p, used, raw

    def opening_fair(self, match_id: str, market: str, weights: Mapping[str, float]):
        """De-vigged sharp consensus from the earliest snapshot that has a reference price."""
        found = self._sharp_at(match_id, market, pick_latest=False, before=None)
        if not found:
            return None, (), None
        p, used = sharp_consensus({b: np.array(q.fair) for b, q in found.items()}, weights)
        ts = max(q.captured_at for q in found.values())
        return p, used, ts
