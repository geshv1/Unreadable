"""Find the match someone means from free text: a bookmaker link, a screenshot's team names, "arsenal v chelsea".

Handles different spellings ("Man City" / "Manchester City"), accents and Bulgarian Cyrillic.
Never guesses: below a similarity threshold it reports "not found" with the closest options.
"""
from __future__ import annotations

import difflib
import re
import unicodedata
from dataclasses import dataclass
from urllib.parse import unquote, urlparse

import pandas as pd

_CYRILLIC = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ж": "zh", "з": "z", "и": "i", "й": "y",
    "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "h", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sht", "ъ": "a", "ь": "y", "ю": "yu", "я": "ya",
    "ё": "yo", "ы": "y", "э": "e", "є": "ye", "і": "i", "ї": "yi",
}

FILLER = {"fc", "cf", "afc", "sc", "ac", "as", "club", "cd", "fk", "sv", "vfl", "vfb", "tsg", "1", "de", "the", "bk", "if", "ssc", "us"}

# football-data.co.uk name -> other common spellings (Latin and Bulgarian).
ALIASES: dict[str, list[str]] = {
    "Man City": ["manchester city", "манчестър сити", "ман сити"],
    "Man United": ["manchester united", "man utd", "manchester utd", "манчестър юнайтед", "ман юнайтед"],
    "Nott'm Forest": ["nottingham forest", "nottingham", "нотингам форест", "нотингам"],
    "Tottenham": ["tottenham hotspur", "spurs", "тотнъм"],
    "Wolves": ["wolverhampton", "wolverhampton wanderers", "уулвърхямптън"],
    "Newcastle": ["newcastle united", "newcastle utd", "нюкасъл"],
    "West Ham": ["west ham united", "уест хям"],
    "Brighton": ["brighton hove albion", "brighton and hove albion", "брайтън"],
    "Arsenal": ["арсенал"],
    "Chelsea": ["челси"],
    "Liverpool": ["ливърпул"],
    "Everton": ["евертън"],
    "Aston Villa": ["астън вила"],
    "Crystal Palace": ["кристъл палас"],
    "Fulham": ["фулъм"],
    "Brentford": ["брентфорд"],
    "Bournemouth": ["afc bournemouth", "борнемут"],
    "Leeds": ["leeds united", "лийдс"],
    "Sunderland": ["съндърланд"],
    "Leicester": ["leicester city", "лестър"],
    "Sheffield United": ["sheffield utd", "sheff utd", "шефилд юнайтед"],
    "Sheffield Weds": ["sheffield wednesday", "шефилд уензди"],
    "West Brom": ["west bromwich albion", "west bromwich", "уест бромич"],
    "QPR": ["queens park rangers", "куинс парк рейнджърс"],
    "Ipswich": ["ipswich town", "ипсуич"],
    "Coventry": ["coventry city", "ковънтри"],
    "Hull": ["hull city", "хъл"],
    "Bayern Munich": ["bayern munchen", "fc bayern", "bayern", "байерн мюнхен", "байерн"],
    "Dortmund": ["borussia dortmund", "bvb", "борусия дортмунд", "дортмунд"],
    "M'gladbach": ["borussia monchengladbach", "monchengladbach", "gladbach", "борусия мьонхенгладбах"],
    "Ein Frankfurt": ["eintracht frankfurt", "frankfurt", "айнтрахт франкфурт"],
    "Leverkusen": ["bayer leverkusen", "байер леверкузен", "леверкузен"],
    "RB Leipzig": ["leipzig", "рб лайпциг", "лайпциг"],
    "FC Koln": ["koln", "cologne", "кьолн"],
    "Mainz": ["mainz 05", "майнц"],
    "Union Berlin": ["1 fc union berlin", "унион берлин"],
    "Stuttgart": ["vfb stuttgart", "щутгарт"],
    "Werder Bremen": ["bremen", "вердер бремен"],
    "Wolfsburg": ["vfl wolfsburg", "волфсбург"],
    "Freiburg": ["sc freiburg", "фрайбург"],
    "Hoffenheim": ["tsg hoffenheim", "хофенхайм"],
    "Augsburg": ["fc augsburg", "аугсбург"],
    "Ath Madrid": ["atletico madrid", "atletico de madrid", "atl madrid", "атлетико мадрид", "атлетико"],
    "Ath Bilbao": ["athletic bilbao", "athletic club", "атлетик билбао"],
    "Real Madrid": ["реал мадрид"],
    "Barcelona": ["fc barcelona", "barca", "барселона"],
    "Betis": ["real betis", "бетис"],
    "Sociedad": ["real sociedad", "реал сосиедад"],
    "Celta": ["celta vigo", "селта"],
    "Sevilla": ["севиля"],
    "Valencia": ["валенсия"],
    "Villarreal": ["виляреал"],
    "Inter": ["inter milan", "internazionale", "интер"],
    "Milan": ["ac milan", "милан"],
    "Roma": ["as roma", "рома"],
    "Juventus": ["juve", "ювентус"],
    "Napoli": ["ssc napoli", "наполи"],
    "Lazio": ["лацио"],
    "Atalanta": ["аталанта"],
    "Fiorentina": ["фиорентина"],
    "Paris SG": ["psg", "paris saint germain", "пари сен жермен", "псж"],
    "Marseille": ["olympique marseille", "марсилия"],
    "Lyon": ["olympique lyonnais", "лион"],
    "Monaco": ["as monaco", "монако"],
    "Lille": ["лил"],
    "St Etienne": ["saint etienne", "сент етиен"],
    "PSV Eindhoven": ["psv", "псв айндховен"],
    "Ajax": ["ajax amsterdam", "аякс"],
    "Feyenoord": ["фейенорд"],
    "Sp Lisbon": ["sporting", "sporting cp", "sporting lisbon", "спортинг"],
    "Benfica": ["бенфика"],
    "Porto": ["fc porto", "порто"],
    "Club Brugge": ["club brugge kv", "брюж"],
    "Celtic": ["селтик"],
    "Rangers": ["glasgow rangers", "рейнджърс"],
}


def normalize(text: str) -> str:
    s = str(text).lower()
    s = "".join(_CYRILLIC.get(ch, ch) for ch in s)
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = s.replace("&", " ").replace("'", "").replace("’", "")
    s = re.sub(r"[^a-z0-9]+", " ", s)
    s = re.sub(r"\butd\b", "united", s)
    return " ".join(t for t in s.split() if t not in FILLER)


def query_from_link(text: str) -> str:
    """Turn a bookmaker link into plain words ('.../odds/arsenal-chelsea/123/' -> 'arsenal chelsea')."""
    t = text.strip()
    if not re.match(r"^(https?://|www\.)", t):
        return t
    path = unquote(urlparse(t if "://" in t else "https://" + t).path)
    skip = {"odds", "live", "sport", "sports", "football", "futbol", "soccer", "event", "events", "match", "bg", "en"}
    segments = [seg for seg in path.split("/") if seg and not seg.isdigit() and seg.lower() not in skip]
    slugs = [seg for seg in segments if "-" in seg]
    best = max(slugs or segments or [""], key=len)
    return re.sub(r"[-_]+", " ", best)


def _variants(team: str) -> list[str]:
    out = {normalize(team)}
    for alias in ALIASES.get(team, []):
        out.add(normalize(alias))
    return [v for v in out if v]


def _team_score(team: str, tokens: list[str]) -> tuple[float, int]:
    """Best similarity of the team name to any run of words in the query, and where it was found."""
    best, pos = 0.0, -1
    for v in _variants(team):
        k = len(v.split())
        for w in {max(1, k - 1), k, k + 1}:
            for i in range(0, max(1, len(tokens) - w + 1)):
                window = " ".join(tokens[i : i + w])
                r = difflib.SequenceMatcher(None, v, window).ratio()
                if r > best:
                    best, pos = r, i
    return best, pos


@dataclass
class MatchHit:
    match_id: str
    home: str
    away: str
    league: str
    kickoff: pd.Timestamp
    score: float


def find_match(text: str, matches: pd.DataFrame, min_score: float = 0.78) -> tuple[MatchHit | None, list[MatchHit]]:
    """Return (best match or None, closest alternatives)."""
    tokens = normalize(query_from_link(text)).split()
    if not tokens:
        return None, []
    hits = []
    for r in matches.itertuples(index=False):
        hs, hp = _team_score(r.home, tokens)
        aws, ap = _team_score(r.away, tokens)
        score = (hs + aws) / 2 - (0.0 if min(hs, aws) >= min_score else 0.25)
        if hp >= 0 and ap >= 0 and hp > ap:
            score -= 0.02  # names given in reverse order: tiny penalty, still allowed
        hits.append(MatchHit(r.match_id, r.home, r.away, r.league, r.kickoff, score))
    hits.sort(key=lambda h: (h.score, -h.kickoff.value), reverse=True)
    best = hits[0] if hits and hits[0].score >= min_score else None
    return best, hits[:3]
