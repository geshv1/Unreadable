import re
from pathlib import Path

import pytest

from edgebot.config import ConfigError, load_config
from edgebot.execution import REAL_MONEY_EXECUTION_ENABLED, RealMoneyDisabledError, get_executor

ROOT = Path(__file__).resolve().parent.parent


def test_defaults_load():
    cfg = load_config()
    assert cfg["mode"] == "paper"
    assert cfg["strategy"]["edge_threshold"] == 0.03
    assert cfg["risk"]["max_daily_exposure"] == 0.10


@pytest.mark.parametrize(
    "override",
    [
        {"execution": {"real_money_enabled": True}},
        {"mode": "real"},
        {"risk": {"level": "yolo"}},
        {"parlays": {"max_stake": 0.02}},
        {"bookmakers": {"playable": ["pinnacle"], "sharp": ["pinnacle"]}},
        {"strategy": {"edge_threshold": 0}},
    ],
)
def test_unsafe_settings_are_refused(override):
    with pytest.raises(ConfigError):
        load_config(overrides=override)


def test_strategy_aliases():
    assert load_config(overrides={"strategy": {"name": "A"}})["strategy"]["name"] == "market_value"
    assert load_config(overrides={"strategy": {"name": "b"}})["strategy"]["name"] == "model_blend"


def test_real_money_execution_is_hard_disabled():
    assert REAL_MONEY_EXECUTION_ENABLED is False
    with pytest.raises(RealMoneyDisabledError):
        get_executor({"execution": {"real_money_enabled": True}}).place_bet("bet365", "m", "1X2", "H", 2.0, 10)


BANNED = re.compile(r"\b(lock|locks|locked|guaranteed?|sure[\s-]+win|sure[\s-]+thing)\b", re.IGNORECASE)


def test_product_never_uses_hype_words():
    files = [p for p in ROOT.rglob("*") if p.suffix in {".py", ".yaml", ".md", ".txt"}]
    files = [p for p in files if "tests" not in p.parts and ".venv" not in p.parts and "data" not in p.parts[-3:-1]]
    offenders = []
    for p in files:
        for i, line in enumerate(p.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
            if BANNED.search(line):
                offenders.append(f"{p.relative_to(ROOT)}:{i}: {line.strip()}")
    assert not offenders, "\n".join(offenders)


def test_no_secrets_in_config():
    text = (ROOT / "config.yaml").read_text()
    assert not re.search(r"(api[_-]?key|token|password)\s*:\s*\S+", text, re.IGNORECASE)
