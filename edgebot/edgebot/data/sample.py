"""Synthetic sample data so everything runs without paid APIs or internet.

How the fake world works (so results here are understood correctly):
- Each team has hidden attack/defence strengths that drift over time; goals are Poisson.
- The sharp book (Pinnacle-like) and the exchange see the true probability with noise that
  shrinks as kick-off approaches (the closing line is the most accurate price).
- Soft books (bet365, Betano, efbet, Winbet) copy the sharp line with a delay, add their own
  noise, shade long shots, and charge a 5.5-8% margin. That lag is where value can appear.

Results on this data only show that the machinery works. They are NOT evidence of a real edge.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd
from scipy.stats import poisson

from .base import Dataset

LONDON = ZoneInfo("Europe/London")
SNAPSHOT_HOURS = (72.0, 48.0, 24.0, 6.0, 1.0, 5.0 / 60.0)
SOFT_BOOKS = {"bet365": 0.055, "betano": 0.065, "efbet": 0.075, "winbet": 0.080}
TEAM_NAMES = [
    "Ashford", "Bramley", "Carrow", "Dunmore", "Eastwick", "Fenwick", "Glenford", "Hallam", "Ironbridge",
    "Kelso", "Langley", "Marston", "Northgate", "Oakham", "Penrith", "Queensbury", "Redhill", "Stanmore",
    "Thornbury", "Upton", "Valemont", "Westbury", "Yarmouth", "Zennor",
]


def _round_robin(teams: list[int], rng: np.random.Generator) -> list[list[tuple[int, int]]]:
    """Double round robin with the circle method; second half mirrors the first."""
    t = list(teams)
    rng.shuffle(t)
    n = len(t)
    rounds = []
    for r in range(n - 1):
        pairs = []
        for i in range(n // 2):
            a, b = t[i], t[n - 1 - i]
            pairs.append((a, b) if (r + i) % 2 == 0 else (b, a))
        rounds.append(pairs)
        t = [t[0]] + [t[-1]] + t[1:-1]
    return rounds + [[(b, a) for a, b in rnd] for rnd in rounds]


def _score_matrix(lam: float, mu: float, rho: float = -0.06, max_goals: int = 10) -> np.ndarray:
    g = np.arange(max_goals + 1)
    m = np.outer(poisson.pmf(g, lam), poisson.pmf(g, mu))
    m[0, 0] *= 1 - lam * mu * rho
    m[0, 1] *= 1 + lam * rho
    m[1, 0] *= 1 + mu * rho
    m[1, 1] *= 1 - rho
    return m / m.sum()


def _market_probs(m: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    p1x2 = np.array([np.tril(m, -1).sum(), np.trace(m), np.triu(m, 1).sum()])
    under = m[0, 0] + m[0, 1] + m[1, 0] + m[0, 2] + m[2, 0] + m[1, 1]
    return p1x2, np.array([1.0 - under, under])


def _softmax_shift(p: np.ndarray, noise: np.ndarray) -> np.ndarray:
    x = np.log(p) + noise
    e = np.exp(x - x.max())
    return e / e.sum()


def _price(p: np.ndarray, margin: float, longshot_bias: float = 1.0) -> np.ndarray:
    """Turn probabilities into bookmaker odds with a margin; bias < 1 shortens long shots."""
    q = p ** longshot_bias
    q = q / q.sum() * (1.0 + margin)
    odds = 1.0 / q
    return np.where(odds < 3.0, np.round(odds, 2), np.round(odds * 20) / 20)


def _season_dates(year: int) -> list[datetime]:
    """38 rounds: Saturdays 15:00 UK, every fourth round on a Tuesday 19:45."""
    d = datetime(year, 8, 1)
    while d.weekday() != 5:
        d += timedelta(days=1)
    dates = []
    sat = d
    for r in range(38):
        if r > 0 and r % 4 == 0:
            tue = sat + timedelta(days=3)
            dates.append(tue.replace(hour=19, minute=45, tzinfo=LONDON))
            sat = sat + timedelta(days=7)
        else:
            if r > 0:
                sat = sat + timedelta(days=7)
            dates.append(sat.replace(hour=15, minute=0, tzinfo=LONDON))
    return [x.astimezone(ZoneInfo("UTC")) for x in dates]


def generate_sample(
    seed: int = 7,
    leagues: tuple[str, ...] = ("S1", "S2", "S3"),
    n_teams: int = 20,
    first_season: int = 2021,
    n_seasons: int = 5,
    result_delay_minutes: int = 135,
) -> Dataset:
    rng = np.random.default_rng(seed)
    match_rows: list[dict] = []
    odds_rows: list[tuple] = []
    for li, league in enumerate(leagues):
        names = TEAM_NAMES[:n_teams]
        names = [f"{n} {['FC', 'United', 'Town'][li % 3]}" for n in names]
        att = rng.normal(0.0, 0.22, n_teams)
        dfn = rng.normal(0.0, 0.22, n_teams)
        base, home_adv = 0.12, 0.22
        for s in range(n_seasons):
            year = first_season + s
            season = f"{year}/{str(year + 1)[-2:]}"
            att = 0.8 * att + rng.normal(0, 0.08, n_teams)
            dfn = 0.8 * dfn + rng.normal(0, 0.08, n_teams)
            for kickoff, pairs in zip(_season_dates(year), _round_robin(list(range(n_teams)), rng)):
                att += rng.normal(0, 0.01, n_teams)
                dfn += rng.normal(0, 0.01, n_teams)
                for h, a in pairs:
                    lam = np.exp(base + att[h] + dfn[a] + home_adv)
                    mu = np.exp(base + att[a] + dfn[h])
                    sm = _score_matrix(lam, mu)
                    flat = rng.choice(sm.size, p=sm.ravel())
                    hg, ag = divmod(int(flat), sm.shape[1])
                    mid = f"{league}-{kickoff:%Y%m%d}-{names[h][:4].lower()}-{names[a][:4].lower()}"
                    match_rows.append(
                        dict(
                            match_id=mid, league=league, season=season, kickoff=kickoff, home=names[h],
                            away=names[a], home_goals=hg, away_goals=ag,
                            result_at=kickoff + timedelta(minutes=result_delay_minutes),
                        )
                    )
                    for market, p_true in zip(("1X2", "OU2.5"), _market_probs(sm)):
                        sels = ("H", "D", "A") if market == "1X2" else ("O", "U")
                        k = len(sels)
                        # Sharp view: accurate at the close, noisier further out (random walk backwards).
                        noise = rng.normal(0, 0.03, k)
                        sharp_views = []
                        for _ in SNAPSHOT_HOURS[::-1]:
                            sharp_views.append(_softmax_shift(p_true, noise))
                            noise = noise + rng.normal(0, 0.043, k)
                        sharp_views = sharp_views[::-1]  # aligned with SNAPSHOT_HOURS
                        prev_view = _softmax_shift(p_true, rng.normal(0, 0.12, k))
                        for si, hours in enumerate(SNAPSHOT_HOURS):
                            ts = kickoff - timedelta(hours=hours)
                            view = sharp_views[si]
                            prices = {
                                "pinnacle": _price(view, 0.025 if market == "1X2" else 0.03),
                                "betfair_exchange": _price(_softmax_shift(view, rng.normal(0, 0.015, k)), 0.012),
                            }
                            for book, margin in SOFT_BOOKS.items():
                                lagged = prev_view if rng.random() < 0.4 else view
                                soft = _softmax_shift(lagged, rng.normal(0, 0.035, k))
                                prices[book] = _price(soft, margin, longshot_bias=0.93)
                            prev_view = view
                            for book, odds in prices.items():
                                for sel, o in zip(sels, odds):
                                    odds_rows.append((mid, book, market, sel, float(max(o, 1.01)), ts))
    matches = pd.DataFrame(match_rows)
    odds = pd.DataFrame(odds_rows, columns=["match_id", "bookmaker", "market", "selection", "odds", "captured_at"])
    ds = Dataset(matches, odds, source="sample", synthetic=True)
    ds.notes.append("SYNTHETIC sample data: results show the machinery works, not that a real edge exists.")
    ds.validate()
    return ds
