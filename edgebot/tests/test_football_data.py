from datetime import datetime, timezone

import pandas as pd

from edgebot.data.football_data_uk import early_capture_time, parse_csv

CSV = """Div,Date,Time,HomeTeam,AwayTeam,FTHG,FTAG,FTR,B365H,B365D,B365A,PSH,PSD,PSA,MaxH,MaxD,MaxA,B365>2.5,B365<2.5,P>2.5,P<2.5,B365CH,B365CD,B365CA,PSCH,PSCD,PSCA,B365C>2.5,B365C<2.5,PC>2.5,PC<2.5
E0,12/08/2023,15:00,Arsenal,Forest,2,1,H,1.20,7.0,15.0,1.19,7.9,15.7,1.25,8.5,17.5,1.44,2.75,1.42,2.93,1.18,7.0,15.0,1.19,8.0,16.0,1.50,2.63,1.49,2.65
E0,15/08/2023,19:45,Chelsea,Spurs,0,0,D,2.10,3.40,3.50,2.15,3.55,3.60,2.2,3.6,3.7,1.80,2.00,1.85,2.05,2.05,3.40,3.60,2.12,3.50,3.70,1.83,1.98,1.88,2.02
"""


def test_parse_real_format(tmp_path):
    path = tmp_path / "E0.csv"
    path.write_text("﻿" + CSV, encoding="utf-8")
    matches, odds = parse_csv(path, "E0", "2324")
    assert len(matches) == 2
    m = matches.iloc[0]
    # 15:00 UK summer time = 14:00 UTC
    assert m["kickoff"] == pd.Timestamp("2023-08-12 14:00", tz="UTC")
    assert m["season"] == "2023/24"
    assert m["result_at"] > m["kickoff"]
    # bet365 + Pinnacle, early + close, 1X2 (3) + O/U (2): 2 books x 2 snapshots x 5 = 20 per match
    assert len(odds) == 40
    assert set(odds["bookmaker"]) == {"bet365", "pinnacle"}  # Max/Avg are not bookmakers
    ko = odds["match_id"].map(dict(zip(matches["match_id"], matches["kickoff"])))
    assert (odds["captured_at"] < ko).all()
    close = odds[(odds["bookmaker"] == "pinnacle") & (odds["market"] == "1X2") & (odds["selection"] == "H")]
    assert sorted(close["odds"].round(2))[:2] == [1.19, 1.19]


def _utc(s):
    return datetime.fromisoformat(s).replace(tzinfo=timezone.utc)


def test_early_capture_times():
    # Saturday 15:00 UK (14:00 UTC in summer) -> Friday 13:00 UK
    assert early_capture_time(_utc("2023-08-12T14:00")) == _utc("2023-08-11T12:00")
    # Tuesday evening -> same Tuesday 13:00 UK
    assert early_capture_time(_utc("2023-08-15T18:45")) == _utc("2023-08-15T12:00")
    # Monday night -> previous Friday
    assert early_capture_time(_utc("2023-08-14T19:00")) == _utc("2023-08-11T12:00")
    # Friday 13:30 kick-off is too close -> previous Tuesday
    assert early_capture_time(_utc("2023-08-18T12:30")) == _utc("2023-08-15T12:00")
