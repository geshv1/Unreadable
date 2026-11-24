"""Build the data file the phone app reads: every upcoming covered match with its fair prices,
our own model's second opinion, and the free match facts (form, goals, xG, head-to-head, rest days).

Everything comes from free football-data.co.uk files. No player data exists there, so none is invented.
"""
from __future__ import annotations

import json
import math
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import pandas as pd

from .config import load_config
from .core import LEAGUE_NAMES, MARKETS
from .data import football_data_uk as fd
from .data.prices import PriceIndex
from .matching import ALIASES
from .models.dixon_coles import DCParams, DixonColes
from .pricing.consensus import sharp_consensus

HISTORY_SEASONS = ("2425", "2526", "2627")
CURRENT_SEASON = "2627"


def _history(league: str, data_dir: Path) -> pd.DataFrame:
    """Finished matches of a league over the last seasons, with optional xG and shots."""
    frames = []
    for season in HISTORY_SEASONS:
        path = fd.raw_path(data_dir, league, season)
        stale = season == CURRENT_SEASON and (not path.exists() or time.time() - path.stat().st_mtime > 6 * 3600)
        if not path.exists() or stale:
            try:
                fd.download([league], [season], data_dir, force=True)
            except Exception:  # noqa: BLE001 - a missing season is fine
                continue
        try:
            df = fd._read_csv(path)
        except Exception:  # noqa: BLE001
            continue
        dates = pd.to_datetime(df["Date"], dayfirst=True, format="mixed")
        out = pd.DataFrame({
            "date": dates.values, "home": df["HomeTeam"].astype(str).values, "away": df["AwayTeam"].astype(str).values,
            "hg": pd.to_numeric(df.get("FTHG"), errors="coerce").values,
            "ag": pd.to_numeric(df.get("FTAG"), errors="coerce").values,
        })
        for col, name in (("HxG", "hxg"), ("AxG", "axg"), ("HST", "hst"), ("AST", "ast")):
            out[name] = pd.to_numeric(df[col], errors="coerce").values if col in df.columns else np.nan
        frames.append(out)
    if not frames:
        return pd.DataFrame(columns=["date", "home", "away", "hg", "ag", "hxg", "axg", "hst", "ast"])
    h = pd.concat(frames, ignore_index=True).dropna(subset=["hg", "ag"])
    h["date"] = pd.to_datetime(h["date"]).dt.tz_localize("UTC")
    return h.sort_values("date").reset_index(drop=True)


def _team_facts(h: pd.DataFrame, team: str, before: pd.Timestamp) -> dict:
    games = h[((h["home"] == team) | (h["away"] == team)) & (h["date"] < before)].tail(10)
    if games.empty:
        return {"form": "", "played": 0}
    form, gf, ga, xgf, xga = [], [], [], [], []
    for r in games.itertuples(index=False):
        home = r.home == team
        f, a = (r.hg, r.ag) if home else (r.ag, r.hg)
        gf.append(f)
        ga.append(a)
        form.append("W" if f > a else "L" if f < a else "D")
        xf, xa = (r.hxg, r.axg) if home else (r.axg, r.hxg)
        if not (pd.isna(xf) or pd.isna(xa)):
            xgf.append(xf)
            xga.append(xa)
    last = games.iloc[-1]
    rest = (before - last["date"]).days
    out = {
        "form": "".join(form[-5:]),
        "played": int(len(games)),
        "goals_for": round(float(np.mean(gf)), 2),
        "goals_against": round(float(np.mean(ga)), 2),
        "rest_days": int(rest),
    }
    if len(xgf) >= 3:
        out["xg_for"] = round(float(np.mean(xgf[-5:])), 2)
        out["xg_against"] = round(float(np.mean(xga[-5:])), 2)
    return out


def _h2h(h: pd.DataFrame, a: str, b: str, before: pd.Timestamp) -> list[dict]:
    m = h[(((h["home"] == a) & (h["away"] == b)) | ((h["home"] == b) & (h["away"] == a))) & (h["date"] < before)].tail(5)
    return [{"date": r.date.strftime("%Y-%m-%d"), "home": r.home, "away": r.away, "score": f"{int(r.hg)}-{int(r.ag)}"}
            for r in m.itertuples(index=False)]


def _model(h: pd.DataFrame, now: pd.Timestamp, params: DCParams):
    train = h[(h["date"] < now) & (h["date"] >= now - pd.Timedelta(days=params.lookback_days))]
    if len(train) < params.min_train_matches:
        return None
    df = train.rename(columns={"hg": "home_goals", "ag": "away_goals", "date": "kickoff"})
    return DixonColes(params).fit(df[["home", "away", "home_goals", "away_goals", "kickoff"]], now.to_pydatetime())


def build(data_dir: Path, cfg: dict | None = None, now: datetime | None = None, timing: dict | None = None) -> dict:
    cfg = cfg or load_config()
    now_ts = pd.Timestamp(now or datetime.now(timezone.utc))
    ds, published = fd.load_fixtures(data_dir, max_age_hours=1.0)
    sharp = tuple(cfg["bookmakers"]["sharp"])
    weights = cfg["bookmakers"]["sharp_weights"]
    prices = PriceIndex(ds.odds, sharp, "multiplicative")
    upcoming = ds.matches[ds.matches["kickoff"] > now_ts].sort_values("kickoff")
    params = DCParams.from_config(cfg)
    hist_cache: dict[str, pd.DataFrame] = {}
    model_cache: dict[str, object] = {}
    matches = []
    for r in upcoming.itertuples(index=False):
        quotes = prices.quotes_asof(r.match_id, now_ts.to_pydatetime(), None)
        fair, refs, ref_time = {}, set(), None
        for market in MARKETS:
            found = {b: np.array(q.fair) for (b, m), q in quotes.items() if m == market and q.fair is not None}
            p, used = sharp_consensus(found, weights)
            if p is not None:
                fair[market] = [round(float(x), 5) for x in p]
                refs.update(used)
                ts = min(quotes[(b, market)].captured_at for b in used)
                ref_time = ts if ref_time is None else min(ref_time, ts)
        if not fair:
            continue
        if r.league not in hist_cache:
            hist_cache[r.league] = _history(r.league, data_dir)
            model_cache[r.league] = _model(hist_cache[r.league], now_ts, params)
        h = hist_cache[r.league]
        model = model_cache[r.league]
        entry = {
            "id": r.match_id, "league": r.league, "kickoff": r.kickoff.isoformat(), "home": r.home, "away": r.away,
            "fair": fair, "refs": sorted(refs), "ref_time": ref_time.isoformat() if ref_time else None,
            "home_facts": _team_facts(h, r.home, r.kickoff), "away_facts": _team_facts(h, r.away, r.kickoff),
            "h2h": _h2h(h, r.home, r.away, r.kickoff),
        }
        if model is not None:
            probs = model.predict(r.home, r.away)
            lam, mu = model.expected_goals(r.home, r.away)
            entry["model"] = {m: [round(float(x), 4) for x in probs[m]] for m in MARKETS}
            entry["model"]["expected_goals"] = [round(lam, 2), round(mu, 2)]
        matches.append(entry)
    s = cfg["strategy"]
    return {
        "generated": now_ts.isoformat(),
        "published": published.isoformat(),
        "leagues": {k: v for k, v in LEAGUE_NAMES.items() if not k.startswith("S")},
        "core_leagues": list(cfg["football"]["leagues"]),
        "rules": {
            "edge_threshold": s["edge_threshold"], "max_edge": s["max_edge"], "min_odds": s["min_odds"],
            "max_odds": s["max_odds"], "min_minutes": s["min_minutes_before_kickoff"],
            "stale_warn_hours": 12, "stale_refuse_hours": 120, "moved_pp": 0.03,
        },
        "aliases": ALIASES,
        "timing": {f"{k[0]}|{k[1]}": v.get("text") for k, v in (timing or {}).items()},
        "matches": matches,
    }


def write(path: Path, data: dict) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":"), default=str), encoding="utf-8")
    return path
