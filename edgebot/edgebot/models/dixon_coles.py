"""Strategy B's own model: a time-weighted Dixon–Coles goals model.

Each team gets an attack and a defence rating (ridge-shrunk toward average, so small samples
don't produce wild numbers). Older matches count less (half-life). The Dixon–Coles correction
fixes the known under-count of 0-0 / 1-1 draws in plain Poisson models.

Walk-forward only: the model is refitted weekly using results known before the refit moment.
"""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
from scipy.stats import poisson
from sklearn.linear_model import PoissonRegressor


@dataclass
class DCParams:
    half_life_days: float = 365.0
    lookback_days: int = 730
    l2: float = 0.002
    min_train_matches: int = 150
    new_team_penalty: float = 0.15
    max_goals: int = 10

    @classmethod
    def from_config(cls, cfg: dict) -> "DCParams":
        m = cfg.get("model", {})
        return cls(
            half_life_days=float(m.get("half_life_days", 365)),
            lookback_days=int(m.get("lookback_days", 730)),
            l2=float(m.get("l2", 0.002)),
            min_train_matches=int(m.get("min_train_matches", 150)),
            new_team_penalty=float(m.get("new_team_penalty", 0.15)),
        )


@dataclass(frozen=True)
class Prediction:
    match_id: str
    probs: dict[str, np.ndarray]   # market -> probabilities in MARKETS order
    trained_until: datetime        # newest result used in training
    fitted_at: datetime            # the refit moment (model "exists" from here)


def _tau_rho(hg: np.ndarray, ag: np.ndarray, lam: np.ndarray, mu: np.ndarray, rho: float) -> np.ndarray:
    tau = np.ones_like(lam)
    tau = np.where((hg == 0) & (ag == 0), 1 - lam * mu * rho, tau)
    tau = np.where((hg == 0) & (ag == 1), 1 + lam * rho, tau)
    tau = np.where((hg == 1) & (ag == 0), 1 + mu * rho, tau)
    tau = np.where((hg == 1) & (ag == 1), 1 - rho, tau)
    return tau


class DixonColes:
    def __init__(self, params: DCParams | None = None):
        self.params = params or DCParams()
        self.team_index: dict[str, int] = {}
        self.intercept = 0.0
        self.attack = np.zeros(0)
        self.defence = np.zeros(0)
        self.home_adv = 0.0
        self.rho = 0.0

    def fit(self, df: pd.DataFrame, ref_time: datetime) -> "DixonColes":
        teams = sorted(set(df["home"]) | set(df["away"]))
        self.team_index = {t: i for i, t in enumerate(teams)}
        n, T = len(df), len(teams)
        hi = df["home"].map(self.team_index).to_numpy()
        ai = df["away"].map(self.team_index).to_numpy()
        hg = df["home_goals"].to_numpy(dtype=float)
        ag = df["away_goals"].to_numpy(dtype=float)
        rows = np.arange(n)
        X = np.zeros((2 * n, 2 * T + 1))
        X[rows, hi] = 1.0
        X[rows, T + ai] = 1.0
        X[rows, 2 * T] = 1.0
        X[n + rows, ai] = 1.0
        X[n + rows, T + hi] = 1.0
        y = np.concatenate([hg, ag])
        ref = pd.Timestamp(ref_time)
        age_days = (ref - pd.to_datetime(df["kickoff"], utc=True)).dt.total_seconds().to_numpy() / 86400.0
        w = 0.5 ** (np.clip(age_days, 0, None) / self.params.half_life_days)
        reg = PoissonRegressor(alpha=self.params.l2, max_iter=1000)
        reg.fit(X, y, sample_weight=np.concatenate([w, w]))
        coef = reg.coef_
        self.intercept = float(reg.intercept_)
        self.attack = coef[:T]
        self.defence = coef[T : 2 * T]
        self.home_adv = float(coef[2 * T])
        lam = np.exp(self.intercept + self.attack[hi] + self.defence[ai] + self.home_adv)
        mu = np.exp(self.intercept + self.attack[ai] + self.defence[hi])
        best, best_ll = 0.0, -np.inf
        for rho in np.linspace(-0.2, 0.2, 41):
            tau = _tau_rho(hg, ag, lam, mu, rho)
            if np.any(tau <= 0):
                continue
            ll = float((w * np.log(tau)).sum())
            if ll > best_ll:
                best, best_ll = float(rho), ll
        self.rho = best
        return self

    def _ratings(self, team: str) -> tuple[float, float]:
        i = self.team_index.get(team)
        if i is None:  # newly promoted / unseen team: assume below average
            return -self.params.new_team_penalty, self.params.new_team_penalty
        return float(self.attack[i]), float(self.defence[i])

    def expected_goals(self, home: str, away: str) -> tuple[float, float]:
        ah, dh = self._ratings(home)
        aa, da = self._ratings(away)
        lam = float(np.exp(self.intercept + ah + da + self.home_adv))
        mu = float(np.exp(self.intercept + aa + dh))
        return lam, mu

    def predict(self, home: str, away: str) -> dict[str, np.ndarray]:
        lam, mu = self.expected_goals(home, away)
        g = np.arange(self.params.max_goals + 1)
        m = np.outer(poisson.pmf(g, lam), poisson.pmf(g, mu))
        r = self.rho
        m[0, 0] *= 1 - lam * mu * r
        m[0, 1] *= 1 + lam * r
        m[1, 0] *= 1 + mu * r
        m[1, 1] *= 1 - r
        m = np.clip(m, 0, None)
        m /= m.sum()
        p1x2 = np.array([np.tril(m, -1).sum(), np.trace(m), np.triu(m, 1).sum()])
        under = m[0, 0] + m[0, 1] + m[1, 0] + m[0, 2] + m[2, 0] + m[1, 1]
        return {"1X2": p1x2 / p1x2.sum(), "OU2.5": np.array([1.0 - under, under])}


def weekly_refit_time(t: datetime) -> datetime:
    """Monday 00:00 UTC at or before t."""
    ts = pd.Timestamp(t).tz_convert("UTC")
    monday = (ts - pd.Timedelta(days=ts.weekday())).normalize()
    return monday.to_pydatetime()


def walk_forward_predictions(
    matches: pd.DataFrame, anchors: dict[str, datetime], params: DCParams | None = None
) -> dict[str, Prediction]:
    """Predict each match with a model refitted weekly on results known before the refit.

    anchors: match_id -> earliest moment a decision could be made for that match.
    """
    params = params or DCParams()
    preds: dict[str, Prediction] = {}
    finished = matches[matches["home_goals"].notna()]
    for league, lg_all in matches.groupby("league"):
        lg_done = finished[finished["league"] == league]
        groups: dict[datetime, list] = defaultdict(list)
        for row in lg_all.itertuples(index=False):
            anchor = anchors.get(row.match_id)
            if anchor is None:
                anchor = (pd.Timestamp(row.kickoff) - pd.Timedelta(days=3)).to_pydatetime()
            groups[weekly_refit_time(anchor)].append(row)
        for refit, rows in sorted(groups.items()):
            refit_ts = pd.Timestamp(refit)
            train = lg_done[
                (lg_done["result_at"] < refit_ts)
                & (lg_done["kickoff"] >= refit_ts - pd.Timedelta(days=params.lookback_days))
            ]
            if len(train) < params.min_train_matches:
                continue
            model = DixonColes(params).fit(train, refit)
            trained_until = train["result_at"].max().to_pydatetime()
            for row in rows:
                preds[row.match_id] = Prediction(row.match_id, model.predict(row.home, row.away), trained_until, refit)
    return preds
