from datetime import datetime, timedelta, timezone

import pytest

from edgebot import paper
from edgebot.check import check_match, parse_odds
from edgebot.config import load_config
from edgebot.data.football_data_uk import parse_csv
from tests.test_check import NOW, _fixtures

RESULTS_CSV = """Div,Date,Time,HomeTeam,AwayTeam,FTHG,FTAG,FTR,B365H,B365D,B365A,BFEH,BFED,BFEA,BFE>2.5,BFE<2.5,B365CH,B365CD,B365CA,BFECH,BFECD,BFECA,BFEC>2.5,BFEC<2.5
E0,22/11/2026,16:30,Liverpool,Man United,3,1,H,1.70,4.2,4.33,1.81,4.4,4.4,1.52,2.88,1.66,4.33,4.6,1.75,4.6,4.7,1.50,2.95
D1,22/11/2026,17:30,Bayern Munich,Dortmund,1,1,D,1.45,4.6,5.75,1.50,4.8,6.0,1.40,3.20,1.45,4.6,5.75,1.52,4.7,5.9,1.45,3.0
"""


@pytest.fixture
def cfg():
    return load_config(overrides={"bookmakers": {"playable": ["betano"]}, "backtest": {"bootstrap_samples": 200}})


@pytest.fixture
def results(tmp_path):
    path = tmp_path / "res.csv"
    path.write_text(RESULTS_CSV)
    out = {}
    for league in ("E0", "D1"):
        m, o = parse_csv(path, league, "2627")
        keep = m["home"].isin(["Liverpool"] if league == "E0" else ["Bayern Munich"])
        m = m[keep]
        out[(league, "2627")] = (m, o[o["match_id"].isin(m["match_id"])])
    return out


def _record(cfg, tmp_path, query, odds, ledger, at=NOW):
    res = check_match(query, _fixtures(), cfg, at, parse_odds(odds), data_dir=tmp_path, remember=False,
                      extra_legs=paper.open_legs(ledger, at, "betano"))
    entry = paper.single_from_candidate(res.best, res.stake, at, res.ref_time)
    return paper.upsert(ledger, entry), res


def test_record_one_bet_per_match_and_update(cfg, tmp_path):
    (ledger, action), _ = _record(cfg, tmp_path, "liverpool man united", "1=1.80 X=4.1 2=4.6 O=1.62 U=2.3", [])
    assert action == "added" and len(ledger) == 1 and ledger[0]["selection"] == "O"
    (ledger, action), _ = _record(cfg, tmp_path, "liverpool man united", "1=1.80 X=4.1 2=4.9 O=1.55 U=2.3", ledger)
    assert action == "updated" and len(ledger) == 1 and ledger[0]["selection"] == "A"
    paper.mark(ledger, ledger[0]["id"], True, 4.8)
    (ledger, action), _ = _record(cfg, tmp_path, "liverpool man united", "1=1.80 X=4.1 2=4.6 O=1.70 U=2.3", ledger)
    assert action == "kept (already placed)" and ledger[0]["placed_odds"] == 4.8


def test_grade_uses_results_and_betfair_close(cfg, tmp_path, results):
    (ledger, _), _ = _record(cfg, tmp_path, "liverpool man united", "1=1.80 X=4.1 2=4.6 O=1.62 U=2.3", [])
    (ledger, _), _ = _record(cfg, tmp_path, "bayern dortmund", "1=1.62 X=4.6 2=5.5 O=1.40 U=3.0", ledger)
    before_ko = datetime(2026, 11, 22, 12, tzinfo=timezone.utc)
    ledger, n = paper.grade(ledger, tmp_path, before_ko, results=results, refresh=False)
    assert n == 0  # nothing settles before the matches are over
    after = datetime(2026, 11, 23, 9, tzinfo=timezone.utc)
    ledger, n = paper.grade(ledger, tmp_path, after, results=results, refresh=False)
    assert n == 2
    liv = next(e for e in ledger if e["home"] == "Liverpool")
    assert liv["status"] == "won" and liv["score"] == "3-1"  # Over 2.5 with 4 goals
    assert liv["pnl"] == pytest.approx(liv["stake"] * 0.62, abs=0.01)
    # CLV against the de-vigged Betfair closing price 1.50/2.95
    p_close = (1 / 1.50) / (1 / 1.50 + 1 / 2.95)
    assert liv["clv"] == pytest.approx(1.62 * p_close - 1, abs=1e-4)
    bay = next(e for e in ledger if e["home"] == "Bayern Munich")
    assert bay["status"] == "lost" and bay["pnl"] == -bay["stake"]


def test_skipped_bets_are_not_counted(cfg, tmp_path, results):
    (ledger, _), _ = _record(cfg, tmp_path, "liverpool man united", "1=1.80 X=4.1 2=4.6 O=1.62 U=2.3", [])
    paper.mark(ledger, ledger[0]["id"], False)
    ledger, n = paper.grade(ledger, tmp_path, datetime(2026, 11, 23, 9, tzinfo=timezone.utc), results=results, refresh=False)
    assert n == 0
    rep = paper.report(ledger, cfg)
    assert rep["skipped"] == 1 and rep["bets"] == 0


def test_report_and_gates(cfg, tmp_path, results):
    (ledger, _), _ = _record(cfg, tmp_path, "liverpool man united", "1=1.80 X=4.1 2=4.6 O=1.62 U=2.3", [])
    ledger, _ = paper.grade(ledger, tmp_path, datetime(2026, 11, 23, 9, tzinfo=timezone.utc), results=results, refresh=False)
    rep = paper.report(ledger, cfg)
    assert rep["bets"] == 1 and rep["profit"] > 0
    assert not rep["all_pass"]  # 1 bet is nowhere near 1,000 — and the user must confirm
    text = paper.render_report(rep, cfg, ledger)
    assert "Not enough data" in text and "Go-live gates" in text and "1 so far" in text


def test_parlay_from_ledger_legs(cfg, tmp_path):
    (ledger, _), _ = _record(cfg, tmp_path, "liverpool man united", "1=1.80 X=4.1 2=4.6 O=1.62 U=2.3", [])
    (ledger, _), res = _record(cfg, tmp_path, "bayern dortmund", "1=1.62 X=4.6 2=5.5 O=1.40 U=3.0", ledger,
                               at=NOW + timedelta(minutes=3))
    assert res.parlay is not None and set(res.parlay.match_ids) == {"E0-a", "D1-c"}
    entry = paper.parlay_entry(res.parlay, res.parlay_stake, NOW)
    ledger, action = paper.upsert(ledger, entry)
    assert action == "added" and sum(e["kind"] == "parlay" for e in ledger) == 1


def test_import_export_round_trip(cfg, tmp_path):
    (ledger, _), _ = _record(cfg, tmp_path, "liverpool man united", "1=1.80 X=4.1 2=4.6 O=1.62 U=2.3", [])
    src = tmp_path / "docs" / "bets"
    src.mkdir(parents=True)
    import json
    (src / "x.json").write_text(json.dumps({"id": ledger[0]["doc_id"], "data": ledger[0], "version": 7}))
    n = paper.import_docs(tmp_path / "docs", tmp_path / "ledger.json")
    back = paper.load_ledger(tmp_path / "ledger.json")
    assert n == 1 and back[0]["_version"] == 7 and back[0]["id"] == ledger[0]["id"]
    writes = paper.export_docs(back, tmp_path / "out")
    assert writes[0]["if_version"] == 7 and writes[0]["doc_id"] == ledger[0]["doc_id"]
    body = json.loads(open(writes[0]["file_path"]).read())
    assert "_version" not in body and body["selection"] == "O"
