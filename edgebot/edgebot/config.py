"""Settings: one YAML file merged over safe defaults. Secrets come only from environment variables."""
from __future__ import annotations

import copy
import os
from pathlib import Path
from typing import Any

import yaml

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CONFIG_PATH = PROJECT_ROOT / "config.yaml"
DEFAULT_DATA_DIR = PROJECT_ROOT / "data"
DEFAULT_REPORTS_DIR = PROJECT_ROOT / "reports"

RISK_LEVELS: dict[str, dict[str, float]] = {
    "safe": {"kelly_fraction": 0.10, "max_bet_pct": 0.010},
    "balanced": {"kelly_fraction": 0.20, "max_bet_pct": 0.015},
    "aggressive": {"kelly_fraction": 0.25, "max_bet_pct": 0.020},
}

STRATEGY_ALIASES = {"a": "market_value", "b": "model_blend"}
STRATEGIES = ("market_value", "model_blend")
DEVIG_CHOICES = ("auto", "multiplicative", "power", "shin", "additive")

DEFAULTS: dict[str, Any] = {
    "mode": "paper",
    "bankroll_eur": 1000.0,
    "football": {"leagues": ["E0", "E1", "D1"], "markets": ["1X2", "OU2.5"]},
    "bookmakers": {
        "playable": ["bet365", "betano", "efbet", "winbet"],
        "sharp": ["pinnacle", "betfair_exchange"],
        "sharp_weights": {"pinnacle": 0.6, "betfair_exchange": 0.4},
        "commission": {"betfair_exchange": 0.05},
    },
    "pricing": {"devig_method": "auto", "max_odds_age_seconds": 300},
    "strategy": {
        "name": "market_value",
        "edge_threshold": 0.03,
        "max_edge": 0.20,
        "min_odds": 1.25,
        "max_odds": 8.0,
        "min_minutes_before_kickoff": 15,
        "model_weight": 0.25,
        "stake_shrink": 0.5,
    },
    "risk": {
        "level": "balanced",
        "max_daily_exposure": 0.10,
        "one_bet_per_match": True,
        "daily_loss_limit": 0.05,
        "weekly_loss_limit": 0.10,
        "monthly_loss_limit": 0.15,
        "drawdown_pause": 0.20,
        "min_stake_eur": 1.0,
        "stake_rounding_eur": 1.0,
    },
    "parlays": {"enabled": True, "min_legs": 2, "max_legs": 3, "max_stake": 0.005, "max_per_day": 1},
    "timing": {"bucket_edges_hours": [72, 24, 6, 1]},
    "model": {
        "half_life_days": 365.0,
        "lookback_days": 730,
        "l2": 0.002,
        "min_train_matches": 150,
        "new_team_penalty": 0.15,
    },
    "backtest": {
        "source": "sample",
        "leagues": ["E0", "E1", "D1"],
        "seasons": ["1920", "2021", "2122", "2223", "2324", "2425", "2526"],
        "warmup_seasons": 1,
        "slippage": [0.01, 0.02],
        "rejection_rate": 0.10,
        "decision_latency_seconds": 60,
        "result_delay_minutes": 135,
        "drawdown_pause_days": 14,
        "account_limits": {"max_stake_eur": 500.0, "limit_after_bets": 200, "limited_max_stake_eur": 5.0},
        "seed": 42,
        "bootstrap_samples": 2000,
        "min_bets_for_verdict": 300,
    },
    "holdout": {"start": "2025-08-01"},
    "go_live_gates": {
        "min_paper_bets": 1000,
        "min_avg_clv": 0.02,
        "require_clv_ci_above_zero": True,
        "require_positive_roi": True,
        "max_drawdown": 0.20,
        "manual_confirmation": True,
    },
    "execution": {"real_money_enabled": False},
}


class ConfigError(ValueError):
    """Raised when settings are invalid. Messages are written for a non-programmer."""


def deep_merge(base: dict, override: dict | None) -> dict:
    out = copy.deepcopy(base)
    for key, value in (override or {}).items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = deep_merge(out[key], value)
        else:
            out[key] = copy.deepcopy(value)
    return out


def load_config(path: str | Path | None = None, overrides: dict | None = None) -> dict:
    """Load config.yaml (or EDGEBOT_CONFIG), merge over defaults, apply overrides, validate."""
    cfg_path = Path(path or os.environ.get("EDGEBOT_CONFIG") or DEFAULT_CONFIG_PATH)
    user: dict = {}
    if cfg_path.exists():
        user = yaml.safe_load(cfg_path.read_text(encoding="utf-8")) or {}
    cfg = deep_merge(DEFAULTS, user)
    if overrides:
        cfg = deep_merge(cfg, overrides)
    cfg["strategy"]["name"] = normalize_strategy(cfg["strategy"]["name"])
    validate(cfg)
    return cfg


def normalize_strategy(name: str) -> str:
    key = str(name).strip().lower()
    return STRATEGY_ALIASES.get(key, key)


def validate(cfg: dict) -> None:
    if cfg["execution"].get("real_money_enabled"):
        raise ConfigError(
            "Real-money execution is switched off in this project phase. "
            "Set execution.real_money_enabled back to false."
        )
    if cfg["mode"] not in ("paper", "real"):
        raise ConfigError("mode must be 'paper' or 'real'.")
    if cfg["mode"] == "real":
        raise ConfigError("Real mode stays off until every go-live gate passes in paper trading.")
    level = cfg["risk"]["level"]
    if level not in RISK_LEVELS:
        raise ConfigError(f"risk.level must be one of {', '.join(RISK_LEVELS)} (got '{level}').")
    if cfg["strategy"]["name"] not in STRATEGIES:
        raise ConfigError(f"strategy.name must be market_value (A) or model_blend (B), got '{cfg['strategy']['name']}'.")
    if cfg["pricing"]["devig_method"] not in DEVIG_CHOICES:
        raise ConfigError(f"pricing.devig_method must be one of {', '.join(DEVIG_CHOICES)}.")
    thr = float(cfg["strategy"]["edge_threshold"])
    if not 0.0 < thr < float(cfg["strategy"]["max_edge"]):
        raise ConfigError("strategy.edge_threshold must be above 0 and below strategy.max_edge.")
    p = cfg["parlays"]
    if not 2 <= int(p["min_legs"]) <= int(p["max_legs"]) <= 6:
        raise ConfigError("parlays: need 2 <= min_legs <= max_legs <= 6.")
    if float(p["max_stake"]) > 0.005 + 1e-12:
        raise ConfigError("parlays.max_stake cannot be above 0.005 (0.5% of bankroll).")
    lo, hi = cfg["backtest"]["slippage"]
    if not 0 <= float(lo) <= float(hi) < 0.5:
        raise ConfigError("backtest.slippage must be [low, high] between 0 and 0.5.")
    overlap = set(cfg["bookmakers"]["playable"]) & set(cfg["bookmakers"]["sharp"])
    if overlap:
        raise ConfigError(f"{', '.join(sorted(overlap))} cannot be both a reference and a place to bet.")


def risk_level_params(cfg: dict) -> dict[str, float]:
    return dict(RISK_LEVELS[cfg["risk"]["level"]])


def data_dir(cfg: dict | None = None) -> Path:
    path = Path(os.environ.get("EDGEBOT_DATA_DIR") or DEFAULT_DATA_DIR)
    path.mkdir(parents=True, exist_ok=True)
    return path


def reports_dir() -> Path:
    path = Path(os.environ.get("EDGEBOT_REPORTS_DIR") or DEFAULT_REPORTS_DIR)
    path.mkdir(parents=True, exist_ok=True)
    return path
