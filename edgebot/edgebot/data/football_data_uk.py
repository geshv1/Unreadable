"""Free historical results and odds from football-data.co.uk.

Each CSV row has two price snapshots per bookmaker:
- "pre-closing": collected on Tuesday/Friday afternoons before midweek/weekend games
  (we timestamp it at 13:00 UK time on the last Tuesday or Friday at least 2 h before kick-off);
- "closing": collected as close to kick-off as possible (we timestamp it 5 minutes before).
Kick-off times in the files are UK local time.
Pinnacle (PS*/P*) is present up to 2025/26; Betfair Exchange (BFE*) from 2024/25.
"""
from __future__ import annotations

import io
import re
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import pandas as pd

from .base import Dataset

BASE_URL = "https://www.football-data.co.uk/mmz4281/{season}/{league}.csv"
LONDON = ZoneInfo("Europe/London")

# Column prefix -> bookmaker key, for 1X2 columns ({p}H/{p}D/{p}A and closing {p}CH/{p}CD/{p}CA).
BOOKS_1X2 = {
    "B365": "bet365",
    "BW": "bwin",
    "IW": "interwetten",
    "PS": "pinnacle",
    "WH": "williamhill",
    "VC": "betvictor",
    "BV": "betvictor",
    "1XB": "1xbet",
    "BF": "betfair_sportsbook",
    "BFE": "betfair_exchange",
    "BFD": "betfred",
    "BMGM": "betmgm",
    "CL": "coral",
    "LB": "ladbrokes",
    "PP": "paddypower",
    "SKB": "skybet",
}
# Over/Under 2.5 columns ({p}>2.5 / {p}<2.5 and closing {p}C>2.5 / {p}C<2.5).
BOOKS_OU = {"B365": "bet365", "P": "pinnacle", "BFE": "betfair_exchange"}


def season_label(code: str) -> str:
    """'2324' -> '2023/24'."""
    return f"20{code[:2]}/{code[2:]}"


def raw_path(data_dir: Path, league: str, season: str) -> Path:
    return Path(data_dir) / "raw" / "football_data" / season / f"{league}.csv"


def download(leagues: list[str], seasons: list[str], data_dir: Path, force: bool = False, timeout: int = 60) -> list[Path]:
    """Download CSVs (idempotent: existing files are kept unless force=True)."""
    saved = []
    for season in seasons:
        for league in leagues:
            dest = raw_path(data_dir, league, season)
            if dest.exists() and not force:
                saved.append(dest)
                continue
            url = BASE_URL.format(season=season, league=league)
            with urllib.request.urlopen(url, timeout=timeout) as resp:  # noqa: S310 - fixed https host
                content = resp.read()
            if not content.strip():
                raise IOError(f"empty file from {url}")
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(content)
            saved.append(dest)
    return saved


def _read_csv(path: Path) -> pd.DataFrame:
    raw = Path(path).read_bytes()
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw.decode("latin-1")
    df = pd.read_csv(io.StringIO(text), low_memory=False)
    df.columns = [str(c).replace("﻿", "").replace("ï»¿", "").strip() for c in df.columns]
    df = df.dropna(subset=["HomeTeam", "AwayTeam", "Date"])
    return df.loc[:, ~df.columns.str.startswith("Unnamed")]


def _slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(s).lower())[:10]


def early_capture_time(kickoff_utc: datetime) -> datetime:
    """13:00 UK on the last Tuesday or Friday at least 2 hours before kick-off."""
    ko_local = kickoff_utc.astimezone(LONDON)
    day = ko_local.replace(hour=13, minute=0, second=0, microsecond=0)
    for _ in range(10):
        if day.weekday() in (1, 4) and day <= ko_local - timedelta(hours=2):
            return day.astimezone(ZoneInfo("UTC"))
        day = (day - timedelta(days=1)).replace(hour=13, minute=0)
    return (ko_local - timedelta(days=2)).astimezone(ZoneInfo("UTC"))


def parse_csv(path: Path, league: str, season_code: str, result_delay_minutes: int = 135) -> tuple[pd.DataFrame, pd.DataFrame]:
    df = _read_csv(path)
    dates = pd.to_datetime(df["Date"], dayfirst=True, format="mixed")
    times = df["Time"].fillna("15:00") if "Time" in df.columns else pd.Series("15:00", index=df.index)
    local = pd.to_datetime(dates.dt.strftime("%Y-%m-%d") + " " + times.astype(str).str.slice(0, 5), format="%Y-%m-%d %H:%M")
    kickoff = local.dt.tz_localize(LONDON, ambiguous=True, nonexistent="shift_forward").dt.tz_convert("UTC")
    season = season_label(season_code)
    match_id = [
        f"{league}-{k:%Y%m%d}-{_slug(h)}-{_slug(a)}" for k, h, a in zip(kickoff, df["HomeTeam"], df["AwayTeam"])
    ]
    hg = pd.to_numeric(df.get("FTHG"), errors="coerce")
    ag = pd.to_numeric(df.get("FTAG"), errors="coerce")
    matches = pd.DataFrame(
        {
            "match_id": match_id,
            "league": league,
            "season": season,
            "kickoff": kickoff.array,
            "home": df["HomeTeam"].astype(str).values,
            "away": df["AwayTeam"].astype(str).values,
            "home_goals": hg.values,
            "away_goals": ag.values,
        }
    )
    matches["kickoff"] = pd.to_datetime(matches["kickoff"], utc=True)
    matches["result_at"] = matches["kickoff"] + pd.Timedelta(minutes=result_delay_minutes)
    early = pd.to_datetime([early_capture_time(k.to_pydatetime()) for k in matches["kickoff"]], utc=True)
    close = matches["kickoff"] - pd.Timedelta(minutes=5)

    pieces = []
    cols = set(df.columns)

    def add(book: str, market: str, sel_cols: dict[str, str], captured) -> None:
        if not all(c in cols for c in sel_cols.values()):
            return
        for sel, col in sel_cols.items():
            pieces.append(
                pd.DataFrame(
                    {
                        "match_id": match_id,
                        "bookmaker": book,
                        "market": market,
                        "selection": sel,
                        "odds": pd.to_numeric(df[col], errors="coerce").values,
                        "captured_at": captured,
                    }
                )
            )

    for prefix, book in BOOKS_1X2.items():
        add(book, "1X2", {"H": f"{prefix}H", "D": f"{prefix}D", "A": f"{prefix}A"}, early)
        add(book, "1X2", {"H": f"{prefix}CH", "D": f"{prefix}CD", "A": f"{prefix}CA"}, close.array)
    for prefix, book in BOOKS_OU.items():
        add(book, "OU2.5", {"O": f"{prefix}>2.5", "U": f"{prefix}<2.5"}, early)
        add(book, "OU2.5", {"O": f"{prefix}C>2.5", "U": f"{prefix}C<2.5"}, close.array)

    odds = pd.concat(pieces, ignore_index=True) if pieces else pd.DataFrame(
        columns=["match_id", "bookmaker", "market", "selection", "odds", "captured_at"]
    )
    odds = odds[odds["odds"] > 1.0].dropna(subset=["odds"])
    odds["captured_at"] = pd.to_datetime(odds["captured_at"], utc=True)
    # Drop prices "captured" after kick-off (can happen with bad times in the source file).
    ko = odds["match_id"].map(dict(zip(matches["match_id"], matches["kickoff"])))
    odds = odds[odds["captured_at"] < ko]
    return matches, odds


def load(leagues: list[str], seasons: list[str], data_dir: Path, result_delay_minutes: int = 135, auto_download: bool = True) -> Dataset:
    missing = [(lg, s) for s in seasons for lg in leagues if not raw_path(data_dir, lg, s).exists()]
    if missing and auto_download:
        download(sorted({lg for lg, _ in missing}), sorted({s for _, s in missing}), data_dir)
    all_m, all_o = [], []
    for season in seasons:
        for league in leagues:
            path = raw_path(data_dir, league, season)
            if not path.exists():
                continue
            m, o = parse_csv(path, league, season, result_delay_minutes)
            all_m.append(m)
            all_o.append(o)
    if not all_m:
        raise FileNotFoundError("no football-data.co.uk files found; run: python -m edgebot download")
    matches = pd.concat(all_m, ignore_index=True).drop_duplicates("match_id", keep="last")
    odds = pd.concat(all_o, ignore_index=True)
    odds = odds[odds["match_id"].isin(matches["match_id"])]
    ds = Dataset(matches, odds, source="football_data", synthetic=False)
    ds.notes.append(
        "Real past prices from football-data.co.uk. Two snapshots per match: Tue/Fri afternoon and just before kick-off."
    )
    ds.validate()
    return ds
