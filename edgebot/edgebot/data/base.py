"""The common data format every provider produces.

matches: one row per match
    match_id, league, season, kickoff (UTC), home, away, home_goals, away_goals, result_at (UTC)
odds: one row per price, long format
    match_id, bookmaker, market, selection, odds, captured_at (UTC)

result_at is when the final score became known. Nothing may use a result before that moment.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import pandas as pd

from ..core import MARKETS, MatchInfo, to_utc

MATCH_COLUMNS = ["match_id", "league", "season", "kickoff", "home", "away", "home_goals", "away_goals", "result_at"]
ODDS_COLUMNS = ["match_id", "bookmaker", "market", "selection", "odds", "captured_at"]


class DataError(ValueError):
    pass


@dataclass
class Dataset:
    matches: pd.DataFrame
    odds: pd.DataFrame
    source: str
    synthetic: bool = False
    notes: list[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.matches = self.matches[MATCH_COLUMNS].copy()
        self.odds = self.odds[ODDS_COLUMNS].copy()
        for col in ("kickoff", "result_at"):
            self.matches[col] = pd.to_datetime(self.matches[col], utc=True)
        self.odds["captured_at"] = pd.to_datetime(self.odds["captured_at"], utc=True)
        self.matches = self.matches.sort_values(["kickoff", "match_id"]).reset_index(drop=True)
        self._info: dict[str, MatchInfo] | None = None

    def validate(self) -> None:
        if self.matches["match_id"].duplicated().any():
            raise DataError("duplicate match_id values")
        unknown = set(self.odds["match_id"]) - set(self.matches["match_id"])
        if unknown:
            raise DataError(f"{len(unknown)} odds rows point to unknown matches")
        if (self.odds["odds"] <= 1.0).any():
            raise DataError("decimal odds must be above 1.0")
        bad_market = set(self.odds["market"]) - set(MARKETS)
        if bad_market:
            raise DataError(f"unknown markets: {bad_market}")
        finished = self.matches["home_goals"].notna()
        early = self.matches.loc[finished, "result_at"] <= self.matches.loc[finished, "kickoff"]
        if early.any():
            raise DataError("a result cannot be known before kick-off")

    def match_info(self, match_id: str) -> MatchInfo:
        if self._info is None:
            self._info = {
                r.match_id: MatchInfo(r.match_id, r.league, r.season, to_utc(r.kickoff), r.home, r.away)
                for r in self.matches.itertuples(index=False)
            }
        return self._info[match_id]

    def filter(self, leagues: list[str] | None = None, books: set[str] | None = None) -> "Dataset":
        matches = self.matches
        odds = self.odds
        if leagues:
            matches = matches[matches["league"].isin(leagues)]
            odds = odds[odds["match_id"].isin(matches["match_id"])]
        if books is not None:
            odds = odds[odds["bookmaker"].isin(books)]
        return Dataset(matches, odds, self.source, self.synthetic, list(self.notes))

    @property
    def bookmakers(self) -> list[str]:
        return sorted(self.odds["bookmaker"].unique())

    def summary(self) -> str:
        m = self.matches
        span = f"{m['kickoff'].min():%d %b %Y} → {m['kickoff'].max():%d %b %Y}" if len(m) else "empty"
        return (
            f"{len(m):,} matches in {m['league'].nunique()} leagues ({span}); "
            f"{len(self.odds):,} prices from {len(self.bookmakers)} bookmakers"
        )
