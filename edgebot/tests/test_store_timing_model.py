import numpy as np
import pandas as pd
import pytest

from edgebot.data.store import get_engine, load_dataset, save_dataset
from edgebot.models.dixon_coles import DCParams, DixonColes
from edgebot.timing import bucket_for, recommend_windows


def test_sqlite_round_trip(small_sample, tmp_path):
    engine = get_engine(tmp_path / "edgebot.db")
    save_dataset(engine, small_sample)
    save_dataset(engine, small_sample)  # idempotent: replaces, never duplicates
    back = load_dataset(engine, "sample")
    assert len(back.matches) == len(small_sample.matches)
    assert len(back.odds) == len(small_sample.odds)
    assert back.odds["captured_at"].dt.tz is not None


def test_timing_buckets():
    assert bucket_for(80) == "3+ days before"
    assert bucket_for(30) == "1–3 days before"
    assert bucket_for(10) == "6–24 h before"
    assert bucket_for(2) == "1–6 h before"
    assert bucket_for(0.1) == "last hour"


def _summary(early, late, n=500):
    return pd.DataFrame(
        {
            "league": ["E0", "E0"],
            "market": ["1X2", "1X2"],
            "bucket": ["1–3 days before", "last hour"],
            "n": [n, n],
            "avg_value": [early, late],
            "share_best": [0.5, 0.5],
        }
    )


def test_timing_recommendations():
    assert recommend_windows(_summary(-0.04, -0.05))[("E0", "1X2")]["window"] == "1–3 days before"
    assert recommend_windows(_summary(-0.05, -0.04))[("E0", "1X2")]["window"] == "last hour"
    assert recommend_windows(_summary(-0.045, -0.046))[("E0", "1X2")]["window"] is None
    assert recommend_windows(_summary(-0.04, -0.05, n=10))[("E0", "1X2")]["window"] is None


def test_dixon_coles_learns_team_strength():
    rng = np.random.default_rng(0)
    teams = ["Strong", "Mid1", "Mid2", "Weak"]
    att = {"Strong": 0.5, "Mid1": 0.0, "Mid2": 0.0, "Weak": -0.5}
    rows = []
    t0 = pd.Timestamp("2023-01-01", tz="UTC")
    for k in range(60):
        for h in teams:
            for a in teams:
                if h == a:
                    continue
                rows.append(
                    {"home": h, "away": a, "home_goals": rng.poisson(np.exp(0.2 + att[h] - att[a] * 0.5)),
                     "away_goals": rng.poisson(np.exp(0.0 + att[a] - att[h] * 0.5)), "kickoff": t0 + pd.Timedelta(days=k)}
                )
    df = pd.DataFrame(rows)
    model = DixonColes(DCParams()).fit(df, (t0 + pd.Timedelta(days=61)).to_pydatetime())
    p = model.predict("Strong", "Weak")
    assert p["1X2"].sum() == pytest.approx(1.0)
    assert p["OU2.5"].sum() == pytest.approx(1.0)
    assert p["1X2"][0] > 0.6
    assert model.predict("Weak", "Strong")["1X2"][2] > model.predict("Weak", "Strong")["1X2"][0]
    unseen = model.predict("Promoted FC", "Mid1")["1X2"]
    assert unseen[0] < model.predict("Mid2", "Mid1")["1X2"][0]
