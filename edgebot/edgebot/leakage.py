"""Guards against using information from the future (data leakage).

Rule: every input used to make a decision must be timestamped strictly before the bet time.
"""
from __future__ import annotations

from datetime import datetime

import pandas as pd


class LeakageError(AssertionError):
    """A feature, price or model used information that was not yet available at bet time."""


def assert_no_leakage(feature_ts: datetime | None, bet_ts: datetime, what: str = "decision") -> None:
    if feature_ts is None:
        raise LeakageError(f"{what}: input has no timestamp, cannot prove it is from the past")
    if pd.Timestamp(feature_ts) >= pd.Timestamp(bet_ts):
        raise LeakageError(f"{what}: uses information from {feature_ts} at bet time {bet_ts}")


def check_frame(df: pd.DataFrame, feature_col: str = "feature_ts", bet_col: str = "bet_ts") -> None:
    """Raise if any row has a feature timestamp at or after its bet timestamp."""
    if df.empty:
        return
    missing = df[feature_col].isna()
    if missing.any():
        raise LeakageError(f"{int(missing.sum())} rows have no feature timestamp")
    bad = df[pd.to_datetime(df[feature_col], utc=True) >= pd.to_datetime(df[bet_col], utc=True)]
    if len(bad):
        first = bad.iloc[0]
        raise LeakageError(
            f"{len(bad)} rows leak future data, e.g. feature {first[feature_col]} >= bet {first[bet_col]}"
        )
