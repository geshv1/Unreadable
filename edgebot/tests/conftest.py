from __future__ import annotations

import pytest

from edgebot.config import load_config
from edgebot.data.sample import generate_sample


@pytest.fixture(autouse=True)
def _isolated_dirs(tmp_path, monkeypatch):
    monkeypatch.setenv("EDGEBOT_DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setenv("EDGEBOT_REPORTS_DIR", str(tmp_path / "reports"))


@pytest.fixture(scope="session")
def small_sample():
    """Two small leagues, three seasons (2023/24–2025/26): fast, includes a holdout season."""
    return generate_sample(seed=3, leagues=("S1", "S2"), n_teams=10, first_season=2023, n_seasons=3)


@pytest.fixture
def cfg():
    return load_config(
        overrides={
            "backtest": {"bootstrap_samples": 200, "min_bets_for_verdict": 50},
            "model": {"min_train_matches": 60},
        }
    )
