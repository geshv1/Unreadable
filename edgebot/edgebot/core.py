"""Shared types and small helpers used across the engine."""
from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timezone

import pandas as pd

# Markets and their selections, always in this order.
MARKETS: dict[str, tuple[str, ...]] = {
    "1X2": ("H", "D", "A"),
    "OU2.5": ("O", "U"),
}

LEAGUE_NAMES: dict[str, str] = {
    "E0": "Premier League",
    "E1": "Championship",
    "E2": "League One",
    "E3": "League Two",
    "SC0": "Scottish Premiership",
    "D1": "Bundesliga",
    "D2": "2. Bundesliga",
    "SP1": "La Liga",
    "SP2": "La Liga 2",
    "I1": "Serie A",
    "I2": "Serie B",
    "F1": "Ligue 1",
    "F2": "Ligue 2",
    "N1": "Eredivisie",
    "B1": "Belgian Pro League",
    "P1": "Primeira Liga",
    "T1": "Süper Lig",
    "G1": "Greek Super League",
    "S1": "Sample League North",
    "S2": "Sample League South",
    "S3": "Sample League East",
}

BOOK_NAMES: dict[str, str] = {
    "bet365": "bet365",
    "betano": "Betano",
    "efbet": "efbet",
    "winbet": "Winbet",
    "palmsbet": "Palms Bet",
    "inbet": "Inbet",
    "pinnacle": "Pinnacle",
    "betfair_exchange": "Betfair Exchange",
}

MARKET_NAMES = {"1X2": "Match result", "OU2.5": "Over/Under 2.5 goals", "DC": "Double chance", "DNB": "Draw no bet",
                "BTTS": "Both teams to score", "CS": "Correct score"}


def league_name(code: str) -> str:
    return LEAGUE_NAMES.get(code, code)


def book_name(key: str) -> str:
    return BOOK_NAMES.get(key, key)


def selection_label(market: str, selection: str, home: str = "Home", away: str = "Away") -> str:
    if market == "1X2":
        return {"H": f"{home} to win", "D": "Draw", "A": f"{away} to win"}[selection]
    if market == "OU2.5":
        return {"O": "Over 2.5 goals", "U": "Under 2.5 goals"}[selection]
    raise ValueError(f"unknown market {market}")


def selection_won(market: str, selection: str, home_goals: int, away_goals: int) -> bool | None:
    """True / False, or None when the stake is refunded (draw no bet on a draw)."""
    h, a = home_goals, away_goals
    if market == "1X2":
        if h > a:
            return selection == "H"
        if h < a:
            return selection == "A"
        return selection == "D"
    if market == "DC":
        res = "1" if h > a else "2" if h < a else "X"
        return res in selection
    if market == "DNB":
        if h == a:
            return None
        return (h > a) == (selection == "H")
    if market == "BTTS":
        yes = h > 0 and a > 0
        return yes if selection == "Y" else not yes
    if market == "CS":
        return selection == f"{h}-{a}"
    m = re.match(r"^(H|A)?OU(\d+(?:\.\d+)?)$", market)
    if m:
        goals = h if m.group(1) == "H" else a if m.group(1) == "A" else h + a
        over = goals > float(m.group(2))
        return over if selection == "O" else not over
    raise ValueError(f"unknown market {market}")


def outcome_index(market: str, home_goals: int, away_goals: int) -> int:
    for i, sel in enumerate(MARKETS[market]):
        if selection_won(market, sel, home_goals, away_goals):
            return i
    raise ValueError("no winning selection")


def to_utc(value) -> datetime:
    """Return a timezone-aware UTC python datetime."""
    ts = pd.Timestamp(value)
    if ts.tzinfo is None:
        ts = ts.tz_localize("UTC")
    return ts.tz_convert("UTC").to_pydatetime()


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass(frozen=True)
class MatchInfo:
    match_id: str
    league: str
    season: str
    kickoff: datetime
    home: str
    away: str


@dataclass
class Candidate:
    """One priced selection at one bookmaker at one moment. Every field is known at decision_time."""

    match_id: str
    league: str
    market: str
    selection: str
    bookmaker: str
    odds: float              # quoted decimal odds
    effective_odds: float    # after exchange commission (same as odds at normal bookmakers)
    p_market: float          # de-vigged sharp fair probability
    p_model: float | None    # own-model probability (strategy B only)
    p_final: float           # probability used to measure the edge
    p_stake: float           # probability used for staking (shrunk toward the market)
    edge: float              # p_final * effective_odds - 1
    feature_ts: datetime     # newest timestamp of any input used
    decision_time: datetime
    odds_captured_at: datetime
    book_overround: float    # the bookmaker's margin on this market
    sharp_sources: tuple[str, ...]
    kickoff: datetime
    home: str
    away: str
    confidence: str = "medium"
    strategy: str = ""

    @property
    def fair_odds(self) -> float:
        return 1.0 / self.p_final

    @property
    def label(self) -> str:
        return selection_label(self.market, self.selection, self.home, self.away)

    def explain(self) -> str:
        """One plain-language reason."""
        src = " + ".join(book_name(s) for s in self.sharp_sources) or "the sharp market"
        book = book_name(self.bookmaker)
        if self.p_model is None:
            return (
                f"{book} pays {self.odds:.2f} for {self.label}. The sharp market ({src}) puts the fair "
                f"price at {self.fair_odds:.2f} once its margin is removed, so this is {self.edge:.1%} better than fair."
            )
        return (
            f"{book} pays {self.odds:.2f} for {self.label}. Our model ({self.p_model:.0%}) blended with the "
            f"sharp market ({self.p_market:.0%}) puts the fair price at {self.fair_odds:.2f}: {self.edge:.1%} better than fair."
        )
