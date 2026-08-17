"""Hopparning av våra verksamheter mot OpenStreetMaps matpunkter, och
normalisering av `opening_hours`.

Modulen är ren: den känner till namn, koordinater och taggar, inte var datan
kommer ifrån och inte var den ska skrivas. Nätet och filerna ligger i
pipeline/oppettider.py.

VARFÖR HOPPARNINGEN ÄR SÅ STRÄNG
--------------------------------
En öppettid som står på fel ställe är värre än ingen öppettid alls. Läsaren
har inget sätt att upptäcka felet, och en fellagd öppettid gör att någon står
utanför en låst dörr. Därför:

1. NÄRHET ENSAM RÄCKER ALDRIG. Södermalm har 607 restauranger på en
   kvadratkilometer. Närmaste OSM-punkt inom hundra meter är i det kvarteret
   en gissning och ingenting annat.
2. NAMNET MÅSTE BÄRA. Vi kräver att de normaliserade namnen är lika, eller
   att det ena är en hel delmängd av det andra räknat i ord. "Pizzeria Rossi"
   mot "Rossi" godtas, "Pizzeria Rossi" mot "Pizzeria Milano" gör det inte.
3. TVETYDIGHET FÄLLER BÅDA. Ligger två OSM-punkter med samma normaliserade
   namn inom radien vet vi inte vilken det är, och då blir det ingen träff.
   Det är exakt fallet för kedjorna, som är de vi oftast skulle träffa fel på.
"""

from __future__ import annotations

import math
import re
import unicodedata
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

# ---------------------------------------------------------------------------
# Vilka OSM-objekt som är matpunkter
# ---------------------------------------------------------------------------

#: amenity-värden som motsvarar en plats där man äter eller dricker.
#: `food_court` och `biergarten` tas med, `vending_machine` inte: en automat
#: har inga öppettider som betyder något och matchar aldrig ett namn ändå.
AMENITIES = (
    "restaurant",
    "cafe",
    "fast_food",
    "bar",
    "pub",
    "ice_cream",
    "biergarten",
    "food_court",
)

#: shop-värden som motsvarar en butik man handlar mat i. Listan följer vår
#: egen butikskategori i site/src/lib/categories.ts: livsmedelsbutik, kiosk,
#: hälsokost och apotek.
SHOPS = (
    "supermarket",
    "convenience",
    "bakery",
    "butcher",
    "greengrocer",
    "deli",
    "confectionery",
    "pastry",
    "seafood",
    "cheese",
    "alcohol",
    "beverages",
    "kiosk",
    "health_food",
    "chemist",
    "farm",
    "food",
    "frozen_food",
    "coffee",
    "tea",
    "spices",
    "wholesale",
)

#: Också matpunkter, men taggade på annat sätt.
EXTRA_FILTERS = (
    '["shop"="pharmacy"]',
    '["amenity"="pharmacy"]',
)


def overpass_query(area: int, timeout: int = 600) -> str:
    """En enda fråga per kommun. Noder, ytor och relationer, med centrum."""
    amenity = "|".join(AMENITIES)
    shop = "|".join(SHOPS)
    parts = []
    for kind in ("node", "way", "relation"):
        parts.append(f'{kind}["amenity"~"^({amenity})$"](area:{area});')
        parts.append(f'{kind}["shop"~"^({shop})$"](area:{area});')
        for extra in EXTRA_FILTERS:
            parts.append(f"{kind}{extra}(area:{area});")
    return f"[out:json][timeout:{timeout}];(" + "".join(parts) + ");out center tags;"


# ---------------------------------------------------------------------------
# Namnnormalisering
# ---------------------------------------------------------------------------

_TRANSLIT = {"å": "a", "ä": "a", "ö": "o", "é": "e", "è": "e", "ü": "u", "ø": "o", "æ": "a"}

#: Bolagsformer och registerord som står i kommunens register men aldrig i
#: OSM. "Pizzeria Rossi AB" i vårt register är "Pizzeria Rossi" på skylten.
_LEGAL = {
    "ab",
    "aktiebolag",
    "hb",
    "handelsbolag",
    "kb",
    "kommanditbolag",
    "ekonomisk",
    "forening",
    "ek",
    "for",
    "publ",
    "i",
    "sverige",
    "sweden",
    "nordic",
    "scandinavia",
    "holding",
    "group",
    "gruppen",
    "restauranger",
    "restaurang",
    "restauranten",
    "livs",
    "handel",
    "franchise",
    "of",
    "the",
    "and",
    "och",
    "&",
}

#: Ord som beskriver verksamhetsformen snarare än stället. De STRYKS ALDRIG ur
#: namnet — "Pizzeria Rossi" och "Pizzeria Milano" skiljs åt av det andra
#: ordet, och stryker vi det första blir jämförelsen bara svagare. Listan
#: används i stället för att avgöra om ett ensamt gemensamt ord räcker som
#: belägg, se `names_agree`.
_GENERIC = {
    "pizzeria",
    "pizza",
    "cafe",
    "kafe",
    "caféet",
    "konditori",
    "bageri",
    "bar",
    "pub",
    "kiosk",
    "gatukok",
    "butik",
    "livsmedel",
    "mataffar",
    "kok",
    "catering",
    "bistro",
    "grill",
    "sushi",
    "kebab",
}


def fold(raw: str) -> str:
    """Gemener, svenska tecken translittererade, skiljetecken bort."""
    lowered = unicodedata.normalize("NFC", raw or "").lower()
    for char, replacement in _TRANSLIT.items():
        lowered = lowered.replace(char, replacement)
    ascii_only = (
        unicodedata.normalize("NFKD", lowered).encode("ascii", "ignore").decode("ascii")
    )
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", ascii_only)).strip()


def name_tokens(raw: str) -> Tuple[str, ...]:
    """Ordmängden ett namn jämförs på.

    Bolagsformer stryks: "Pizzeria Rossi AB" i kommunens register är
    "Pizzeria Rossi" på skylten. Allt annat behålls, siffror inbegripna, för
    "Pizzeria 2" och "Pizzeria 4" är olika ställen på samma gata.
    """
    seen = []
    for word in fold(raw).split():
        if word and word not in _LEGAL and word not in seen:
            seen.append(word)
    return tuple(seen)


# ---------------------------------------------------------------------------
# Avstånd
# ---------------------------------------------------------------------------


def metres(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Avstånd i meter. Plan approximation, fullt tillräcklig på kvartersnivå."""
    lat = math.radians((lat1 + lat2) / 2)
    dx = math.radians(lng2 - lng1) * math.cos(lat) * 6371000
    dy = math.radians(lat2 - lat1) * 6371000
    return math.hypot(dx, dy)


# ---------------------------------------------------------------------------
# Hopparning
# ---------------------------------------------------------------------------

#: Hur långt ifrån vår koordinat en OSM-punkt får ligga och ändå vara samma
#: ställe. Vår koordinat är ofta härledd ur adressen (geocode.py), och en
#: adresspunkt ligger på fastigheten medan OSM-punkten ligger på entrén eller
#: mitt i huskroppen. Hundra meter täcker det utan att nå nästa kvarter.
RADIUS_M = 100.0

#: Samma sak när vår koordinat bara är gatunivå (`geoPrecision: approximate`).
#: Den kan ligga hos grannporten, så radien är vidare. Namnkravet är det som
#: bär hopparningen, inte radien.
RADIUS_APPROXIMATE_M = 250.0

MATCHED = "matched"
MISS_NO_COORDINATE = "no_coordinate"
MISS_NO_NAME = "no_name"
MISS_NO_CANDIDATE = "no_osm_nearby"
MISS_AMBIGUOUS = "ambiguous_name_nearby"
MISS_NO_HOURS = "matched_without_hours"


@dataclass(frozen=True)
class Poi:
    """En matpunkt ur OSM."""

    kind: str  # node, way eller relation
    osm_id: int
    name: str
    lat: float
    lng: float
    opening_hours: Optional[str]

    @property
    def ref(self) -> str:
        return f"{self.kind}/{self.osm_id}"


def pois_from_overpass(elements: Iterable[dict]) -> List[Poi]:
    """Plocka namn, läge och öppettid ur Overpass-svaret.

    Namnlösa objekt kastas direkt: de kan aldrig paras på namn, och att bära
    dem vidare skulle bara göra tvetydighetsprövningen dyrare.
    """
    out: List[Poi] = []
    for element in elements:
        tags = element.get("tags") or {}
        name = tags.get("name")
        if not name:
            continue
        centre = element.get("center") or element
        lat, lng = centre.get("lat"), centre.get("lon")
        if lat is None or lng is None:
            continue
        out.append(
            Poi(
                kind=element.get("type", "node"),
                osm_id=int(element["id"]),
                name=name,
                lat=float(lat),
                lng=float(lng),
                opening_hours=tags.get("opening_hours") or None,
            )
        )
    return out


class PoiIndex:
    """Rutnätsindex över kommunens matpunkter.

    Ett svep över alla punkter per verksamhet hade blivit 5 595 × 4 500 i
    Stockholm. Rutorna är cirka 500 meter, alltså större än den vidaste
    radien, så en träff kan aldrig ligga utanför de nio rutorna vi tittar i.
    """

    CELL_DEG = 0.005  # ~555 m i nord-syd, ~280 m i öst-väst på 59 grader

    def __init__(self, pois: Sequence[Poi]) -> None:
        self.pois = list(pois)
        self.cells: Dict[Tuple[int, int], List[Poi]] = {}
        for poi in self.pois:
            self.cells.setdefault(self._cell(poi.lat, poi.lng), []).append(poi)

    def _cell(self, lat: float, lng: float) -> Tuple[int, int]:
        return (int(lat / self.CELL_DEG), int(lng / self.CELL_DEG))

    def near(self, lat: float, lng: float, radius: float) -> List[Tuple[Poi, float]]:
        row, col = self._cell(lat, lng)
        # Radien kan vara vidare än en ruta i öst-väst. Två rutor åt varje
        # håll räcker för 250 m på svensk latitud, och kostar ingenting.
        span = 2
        found: List[Tuple[Poi, float]] = []
        for dr in range(-span, span + 1):
            for dc in range(-span, span + 1):
                for poi in self.cells.get((row + dr, col + dc), ()):
                    d = metres(lat, lng, poi.lat, poi.lng)
                    if d <= radius:
                        found.append((poi, d))
        found.sort(key=lambda pair: pair[1])
        return found


#: Kortaste ensamma ord som får bära en hopparning på egen hand. Tre bokstäver
#: eller färre är i praktiken alltid ett allmänord: "ost", "bar", "kok", "vin".
MIN_SOLO_TOKEN = 4


def names_agree(ours: Tuple[str, ...], theirs: Tuple[str, ...]) -> bool:
    """Är det här samma ställe, räknat på namnet?

    Lika ordmängd, eller den ena en hel delmängd av den andra. Delmängden
    behövs åt båda håll: kommunens register skriver ofta ut mer än skylten
    ("Sushi Yama Gallerian" mot "Sushi Yama"), och ibland mindre ("Rossi" mot
    "Pizzeria Rossi").

    Ett ENSAMT gemensamt ord räcker bara när ordet självt bär något. "Rossi"
    inuti "Pizzeria Rossi" är stället; "Pizzeria" inuti "Pizzeria Milano" är
    verksamhetsformen och parar ihop halva gatan.
    """
    if not ours or not theirs:
        return False
    a, b = set(ours), set(theirs)
    if a == b:
        return True
    smaller, larger = (a, b) if len(a) <= len(b) else (b, a)
    if not smaller <= larger:
        return False
    if len(smaller) >= 2:
        return True
    word = next(iter(smaller))
    return word not in _GENERIC and len(word) >= MIN_SOLO_TOKEN


@dataclass(frozen=True)
class Pairing:
    """Utfallet av en hopparning. `poi` är None när vi avstår."""

    poi: Optional[Poi]
    reason: str
    distance_m: Optional[float] = None


def pair(
    index: PoiIndex,
    name: Optional[str],
    lat: Optional[float],
    lng: Optional[float],
    approximate: bool = False,
) -> Pairing:
    """Para en av våra verksamheter mot en OSM-matpunkt, eller avstå."""
    if lat is None or lng is None:
        return Pairing(None, MISS_NO_COORDINATE)
    ours = name_tokens(name or "")
    if not ours:
        return Pairing(None, MISS_NO_NAME)

    radius = RADIUS_APPROXIMATE_M if approximate else RADIUS_M
    hits = [
        (poi, d)
        for poi, d in index.near(lat, lng, radius)
        if names_agree(ours, name_tokens(poi.name))
    ]
    if not hits:
        return Pairing(None, MISS_NO_CANDIDATE)

    # Flera OSM-punkter med samma namn inom radien är en kedja med två
    # ställen i samma kvarter, eller samma ställe kartlagt två gånger med
    # olika öppettider. Vi kan inte veta vilken, alltså blir det ingen träff.
    best, distance = hits[0]
    if len(hits) > 1:
        rivals = {poi.ref for poi, _ in hits}
        hours = {poi.opening_hours for poi, _ in hits}
        if len(rivals) > 1 and len(hours) > 1:
            return Pairing(None, MISS_AMBIGUOUS)

    if not best.opening_hours:
        return Pairing(best, MISS_NO_HOURS, distance)
    return Pairing(best, MATCHED, distance)


# ---------------------------------------------------------------------------
# opening_hours: vilken delmängd vi stöder
# ---------------------------------------------------------------------------

#: `opening_hours` är ett eget litet språk med regler för helgdagar,
#: veckonummer, månadsintervall, soluppgång och kommentarer. Vi stöder den
#: delmängd som faktiskt förekommer i vår data, och INGENTING annat: ett
#: uttryck vi inte förstår helt kastas, och verksamheten får ingen öppettid.
#:
#: Delmängden, i BNF-liknande form:
#:
#:     uttryck   := regel (";" regel)*
#:     regel     := "24/7" | "off" | "closed"
#:                | dagar? tider ("off" | "closed")?
#:     dagar     := dagspec ("," dagspec)*
#:     dagspec   := dag | dag "-" dag | "PH"
#:     dag       := Mo Tu We Th Fr Sa Su
#:     tider     := tid "-" tid ("," tid "-" tid)*
#:     tid       := HH:MM
#:
#: Allt annat, alltså veckonummer, datumintervall, "sunrise", "Mo[1]",
#: kommentarer inom citattecken och "open"/"unknown", faller utanför.

_DAYS = ("Mo", "Tu", "We", "Th", "Fr", "Sa", "Su")
_DAY_INDEX = {d: i for i, d in enumerate(_DAYS)}

_TIME = re.compile(r"^([01]?\d|2[0-4]):([0-5]\d)$")


def _parse_days(spec: str) -> Optional[List[int]]:
    days: List[int] = []
    for part in spec.split(","):
        part = part.strip()
        if not part:
            return None
        if "-" in part:
            a, _, b = part.partition("-")
            a, b = a.strip(), b.strip()
            if a not in _DAY_INDEX or b not in _DAY_INDEX:
                return None
            start, end = _DAY_INDEX[a], _DAY_INDEX[b]
            # Mo-Su går framåt, Fr-Mo viker runt veckoskiftet.
            i = start
            while True:
                days.append(i)
                if i == end:
                    break
                i = (i + 1) % 7
        else:
            if part not in _DAY_INDEX:
                return None
            days.append(_DAY_INDEX[part])
    return sorted(set(days))


def _parse_times(spec: str) -> Optional[List[Tuple[int, int]]]:
    """Minuter från midnatt. Slut före start betyder över midnatt och skrivs
    som ett spann som passerar 1440, vilket utvärderaren i webbläsaren delar."""
    spans: List[Tuple[int, int]] = []
    for part in spec.split(","):
        part = part.strip()
        a, _, b = part.partition("-")
        ma, mb = _TIME.match(a.strip()), _TIME.match(b.strip())
        if not ma or not mb:
            return None
        start = int(ma.group(1)) * 60 + int(ma.group(2))
        end = int(mb.group(1)) * 60 + int(mb.group(2))
        if end <= start:
            end += 24 * 60  # över midnatt
        if end - start > 24 * 60:
            return None
        spans.append((start, end))
    return spans


@dataclass(frozen=True)
class Rule:
    """En regel: vilka veckodagar, vilka tidsspann, och om den stänger."""

    days: Tuple[int, ...]  # tom tuple = alla dagar
    spans: Tuple[Tuple[int, int], ...]
    closed: bool
    public_holiday: bool


def parse_opening_hours(raw: str) -> Optional[List[Rule]]:
    """Tolka ett `opening_hours`-uttryck, eller returnera None.

    None betyder "utanför vår delmängd". Den som anropar ska då kasta
    uppgiften, inte visa en halv tolkning: en halvtolkad öppettid är precis
    den sortens fel som gör att någon står utanför en låst dörr.
    """
    text = (raw or "").strip()
    if not text or '"' in text:
        return None

    rules: List[Rule] = []
    for chunk in text.split(";"):
        chunk = chunk.strip()
        if not chunk:
            continue
        lowered = chunk.lower()
        if lowered == "24/7":
            rules.append(Rule((), ((0, 24 * 60),), False, False))
            continue
        if lowered in ("off", "closed"):
            rules.append(Rule((), (), True, False))
            continue

        closed = False
        for suffix in (" off", " closed"):
            if lowered.endswith(suffix):
                closed = True
                chunk = chunk[: -len(suffix)].strip()
                break

        # Dagdelen är allt fram till första tecknet som ser ut som en tid.
        match = re.search(r"\d{1,2}:\d{2}", chunk)
        if match:
            day_spec = chunk[: match.start()].strip()
            time_spec = chunk[match.start() :].strip()
        else:
            day_spec, time_spec = chunk.strip(), ""

        public_holiday = False
        if day_spec:
            # PH står ensamt eller först. Vi stöder "PH off" och "PH 12:00-16:00".
            tokens = day_spec.replace(",", " ").split()
            if tokens and tokens[0] == "PH":
                public_holiday = True
                day_spec = " ".join(tokens[1:]).strip().strip(",")

        days: List[int] = []
        if day_spec:
            parsed = _parse_days(day_spec)
            if parsed is None:
                return None
            days = parsed

        if closed and not time_spec:
            rules.append(Rule(tuple(days), (), True, public_holiday))
            continue

        if not time_spec:
            return None
        spans = _parse_times(time_spec)
        if spans is None:
            return None
        rules.append(Rule(tuple(days), tuple(spans), closed, public_holiday))

    return rules or None


def compile_hours(raw: str) -> Optional[dict]:
    """Den form sajten läser: veckoschema plus helgdagsregel.

    `week` har sju poster, måndag först, var och en en lista av spann i
    minuter från midnatt. Ett spann som går över midnatt slutar efter 1440.
    `ph` är None när uttrycket inte säger något om helgdagar.
    """
    rules = parse_opening_hours(raw)
    if rules is None:
        return None

    week: List[List[List[int]]] = [[] for _ in range(7)]
    ph: Optional[List[List[int]]] = None

    for rule in rules:
        if rule.public_holiday:
            ph = [] if rule.closed else [[a, b] for a, b in rule.spans]
            continue
        days = rule.days if rule.days else tuple(range(7))
        for day in days:
            # Senare regel skriver över tidigare för samma dag. Det är
            # opening_hours egen semantik: "Mo-Su 11:00-22:00; We 11:00-15:00"
            # betyder att onsdagen är kortare, inte att den har två pass.
            week[day] = [] if rule.closed else [[a, b] for a, b in rule.spans]

    if all(not day for day in week) and ph is None:
        return None
    return {"week": week, "ph": ph}
