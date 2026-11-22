from datetime import datetime, timedelta, timezone

import pandas as pd
import pytest

from edgebot.check import check_match, parse_odds
from edgebot.config import load_config
from edgebot.data.base import Dataset
from edgebot.matching import find_match, normalize, query_from_link

PUB = datetime(2026, 11, 20, 10, 0, tzinfo=timezone.utc)
NOW = datetime(2026, 11, 20, 12, 0, tzinfo=timezone.utc)


def _fixtures(published=PUB):
    rows = [
        ("E0-a", "E0", "Liverpool", "Man United", datetime(2026, 11, 22, 16, 30, tzinfo=timezone.utc), (1.81, 4.4, 4.4), (1.52, 2.88)),
        ("E0-b", "E0", "Brentford", "Everton", datetime(2026, 11, 23, 20, 0, tzinfo=timezone.utc), (2.24, 3.6, 3.5), (1.83, 2.12)),
        ("D1-c", "D1", "Bayern Munich", "Dortmund", datetime(2026, 11, 22, 17, 30, tzinfo=timezone.utc), (1.50, 4.8, 6.0), (1.40, 3.20)),
        ("B1-d", "B1", "Genk", "Antwerp", datetime(2026, 11, 22, 15, 0, tzinfo=timezone.utc), (1.90, 3.7, 4.2), (1.70, 2.25)),
    ]
    m, o = [], []
    for mid, lg, h, a, ko, x12, ou in rows:
        m.append(dict(match_id=mid, league=lg, season="2026/27", kickoff=ko, home=h, away=a, home_goals=None,
                      away_goals=None, result_at=ko + timedelta(hours=2)))
        for sel, odd in zip("HDA", x12):
            o.append((mid, "betfair_exchange", "1X2", sel, odd, published))
        for sel, odd in zip("OU", ou):
            o.append((mid, "betfair_exchange", "OU2.5", sel, odd, published))
    return Dataset(pd.DataFrame(m), pd.DataFrame(o, columns=["match_id", "bookmaker", "market", "selection", "odds", "captured_at"]), "fixtures")


@pytest.fixture
def cfg():
    return load_config(overrides={"bookmakers": {"playable": ["betano"]}})


@pytest.mark.parametrize(
    "query,expected",
    [
        ("https://www.betano.bg/odds/liverpool-manchester-united/58231001/", "E0-a"),
        ("Ливърпул - Манчестър Юнайтед", "E0-a"),
        ("liverpool v man utd", "E0-a"),
        ("Bayern München vs Borussia Dortmund", "D1-c"),
        ("brentford everton", "E0-b"),
    ],
)
def test_find_match(query, expected):
    hit, _ = find_match(query, _fixtures().matches)
    assert hit is not None and hit.match_id == expected


def test_unknown_match_is_not_guessed():
    hit, alts = find_match("Levski Sofia v CSKA Sofia", _fixtures().matches)
    assert hit is None and alts


def test_link_and_text_helpers():
    assert query_from_link("https://www.betano.bg/live/arsenal-chelsea/123456/?bt=1") == "arsenal chelsea"
    assert query_from_link("arsenal chelsea") == "arsenal chelsea"
    assert normalize("FC Köln") == "koln"
    assert parse_odds("1=2,10 X=3.4 2=3.6 over=1.9 U:1.95") == {
        ("1X2", "H"): 2.10, ("1X2", "D"): 3.4, ("1X2", "A"): 3.6, ("OU2.5", "O"): 1.9, ("OU2.5", "U"): 1.95
    }


def test_check_without_odds_gives_minimum_prices(cfg, tmp_path):
    res = check_match("liverpool man united", _fixtures(), cfg, NOW, data_dir=tmp_path)
    text = res.render()
    assert res.best is None and not res.have_odds
    assert "worth it at Betano from" in text and "Send me Betano's odds" in text
    for line in res.lines:
        assert line.min_odds == pytest.approx(1.03 / line.p_fair)


def test_check_finds_value_and_one_bet_per_match(cfg, tmp_path):
    res = check_match("liverpool man united", _fixtures(), cfg, NOW, parse_odds("1=1.80 X=4.10 2=4.60 O=1.62 U=2.30"), data_dir=tmp_path)
    assert res.best is not None and res.best.market == "OU2.5" and res.best.selection == "O"
    assert [c.label for c in res.other_value] == ["Man United to win"]
    assert 1 <= res.stake <= 15
    text = res.render()
    assert "✅ BET" in text and "Place before" in text and "[PAPER]" in text


def test_no_value_says_so(cfg, tmp_path):
    res = check_match("liverpool man united", _fixtures(), cfg, NOW, parse_odds("1=1.70 X=4.0 2=4.0 O=1.45 U=2.6"), data_dir=tmp_path)
    assert res.best is None
    assert "No value at these Betano odds" in res.render()


def test_stale_reference_lowers_confidence_and_stake(cfg, tmp_path):
    odds = parse_odds("1=1.80 X=4.10 2=4.60 O=1.62 U=2.30")
    fresh = check_match("liverpool man united", _fixtures(), cfg, NOW, odds, data_dir=tmp_path, remember=False)
    old = check_match("liverpool man united", _fixtures(), cfg, PUB + timedelta(hours=40), odds, data_dir=tmp_path, remember=False)
    assert fresh.best.confidence != "low" and old.best.confidence == "low"
    assert old.stake < fresh.stake
    assert any("old" in w for w in old.warnings)
    too_old = check_match("brentford everton", _fixtures(PUB - timedelta(days=6)), cfg, NOW, odds, data_dir=tmp_path)
    assert too_old.best is None and "too old to trust" in too_old.render()


def test_started_match_is_refused(cfg, tmp_path):
    res = check_match("genk antwerp", _fixtures(), cfg, datetime(2026, 11, 22, 14, 50, tzinfo=timezone.utc), data_dir=tmp_path)
    assert "too late" in res.render()


def test_parlay_from_two_checked_matches(cfg, tmp_path):
    check_match("liverpool man united", _fixtures(), cfg, NOW, parse_odds("1=1.80 X=4.1 2=4.6 O=1.62 U=2.3"), data_dir=tmp_path)
    res = check_match("bayern dortmund", _fixtures(), cfg, NOW + timedelta(minutes=5),
                      parse_odds("1=1.62 X=4.6 2=5.5 O=1.40 U=3.0"), data_dir=tmp_path)
    assert res.best is not None
    assert res.parlay is not None and set(res.parlay.match_ids) == {"E0-a", "D1-c"}
    assert res.parlay_stake <= 5
    assert "Bookmaker margin across legs" in res.render()


def test_small_league_warning(cfg, tmp_path):
    res = check_match("genk antwerp", _fixtures(), cfg, NOW, parse_odds("1=2.05 X=3.7 2=4.2 O=1.7 U=2.25"), data_dir=tmp_path)
    assert any("outside your main leagues" in w for w in res.warnings)


def test_market_moved_since_old_fair_price_is_not_value(cfg, tmp_path):
    """Brentford 2.24 / 3.6 / 3.5 fair on Friday; on Sunday the bookmaker has Everton much shorter."""
    later = PUB + timedelta(hours=48)
    res = check_match("brentford everton", _fixtures(), cfg, later, parse_odds("1=2.35 X=3.50 2=2.95"), data_dir=tmp_path)
    assert res.best is None
    assert any("market has probably moved" in w for w in res.warnings)
    assert "No value" in res.render()
    # the same prices with a FRESH fair price are judged normally
    fresh = check_match("brentford everton", _fixtures(), cfg, PUB + timedelta(hours=2),
                        parse_odds("1=2.35 X=3.50 2=2.95"), data_dir=tmp_path, remember=False)
    assert fresh.best is not None and fresh.best.selection == "H"
