"""Anti-overfitting bookkeeping.

- Every backtest variant is appended to a log (the more variants you try, the more likely
  the best-looking one is luck — the report always shows how many were tried).
- The final holdout period is sealed and may be opened exactly once per data source.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path


def fingerprint(obj) -> str:
    blob = json.dumps(obj, sort_keys=True, default=str).encode()
    return hashlib.sha1(blob).hexdigest()[:12]


def variant_settings(cfg: dict) -> dict:
    """The settings that define a strategy variant (not paths or cosmetic options)."""
    keys = ("strategy", "risk", "parlays", "pricing", "bookmakers", "football", "model")
    sub = {k: cfg.get(k) for k in keys}
    b = cfg.get("backtest", {})
    sub["backtest"] = {k: b.get(k) for k in ("slippage", "rejection_rate", "leagues", "seasons", "warmup_seasons", "account_limits")}
    return sub


def log_variant(path: Path, record: dict) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(record, default=str) + "\n")


def read_variants(path: Path) -> list[dict]:
    path = Path(path)
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def count_variants(path: Path, source: str) -> int:
    return len({r.get("fingerprint") for r in read_variants(path) if r.get("source") == source and r.get("mode") == "dev"})


class HoldoutAlreadyUsed(RuntimeError):
    pass


class HoldoutGuard:
    def __init__(self, path: Path, source: str):
        self.path = Path(path)
        self.source = source

    def _all(self) -> dict:
        if not self.path.exists():
            return {}
        return json.loads(self.path.read_text(encoding="utf-8"))

    def used(self) -> dict | None:
        return self._all().get(self.source)

    def assert_unused(self) -> None:
        info = self.used()
        if info:
            raise HoldoutAlreadyUsed(
                f"The sealed final test for '{self.source}' was already run on {info.get('at')} "
                f"(variant {info.get('fingerprint')}). Running it again would turn it into one more "
                "tuning set and its result would no longer be trustworthy."
            )

    def mark_used(self, info: dict) -> None:
        data = self._all()
        data[self.source] = {**info, "at": datetime.now(timezone.utc).isoformat(timespec="seconds")}
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(data, indent=2, default=str), encoding="utf-8")
