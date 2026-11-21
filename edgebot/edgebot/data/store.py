"""SQLite storage (Postgres-ready via SQLAlchemy). Every row carries its own timestamp."""
from __future__ import annotations

from pathlib import Path

import pandas as pd
from sqlalchemy import Column, DateTime, Float, Integer, MetaData, String, Table, create_engine, delete, select
from sqlalchemy.engine import Engine

from .base import Dataset

metadata = MetaData()

matches_t = Table(
    "matches",
    metadata,
    Column("match_id", String, primary_key=True),
    Column("league", String, index=True),
    Column("season", String),
    Column("kickoff", DateTime(timezone=True), index=True),
    Column("home", String),
    Column("away", String),
    Column("home_goals", Integer, nullable=True),
    Column("away_goals", Integer, nullable=True),
    Column("result_at", DateTime(timezone=True), nullable=True),
    Column("source", String),
)

odds_t = Table(
    "odds_snapshots",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("match_id", String, index=True),
    Column("bookmaker", String),
    Column("market", String),
    Column("selection", String),
    Column("odds", Float),
    Column("captured_at", DateTime(timezone=True), index=True),
    Column("source", String),
)


def get_engine(url_or_path: str | Path) -> Engine:
    url = str(url_or_path)
    if "://" not in url:
        Path(url).parent.mkdir(parents=True, exist_ok=True)
        url = f"sqlite:///{url}"
    engine = create_engine(url)
    metadata.create_all(engine)
    return engine


def save_dataset(engine: Engine, ds: Dataset) -> None:
    """Replace everything stored for this source (idempotent)."""
    m = ds.matches.copy()
    m["source"] = ds.source
    o = ds.odds.copy()
    o["source"] = ds.source
    with engine.begin() as conn:
        conn.execute(delete(odds_t).where(odds_t.c.source == ds.source))
        conn.execute(delete(matches_t).where(matches_t.c.source == ds.source))
    m.to_sql("matches", engine, if_exists="append", index=False, chunksize=5000)
    o.to_sql("odds_snapshots", engine, if_exists="append", index=False, chunksize=20000)


def load_dataset(engine: Engine, source: str) -> Dataset:
    with engine.connect() as conn:
        m = pd.read_sql(select(matches_t).where(matches_t.c.source == source), conn)
        o = pd.read_sql(select(odds_t).where(odds_t.c.source == source), conn)
    for col in ("kickoff", "result_at"):
        m[col] = pd.to_datetime(m[col], utc=True)
    o["captured_at"] = pd.to_datetime(o["captured_at"], utc=True)
    return Dataset(m, o, source=source, synthetic=(source == "sample"))
