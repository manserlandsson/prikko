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


def head(tokens: Tuple[str, ...]) -> Optional[str]:
    """Det första ordet som inte är en verksamhetsform.

    "Café Gateau" har huvudordet "gateau" och inte "cafe". Verksamhetsordet
    står först i hälften av alla svenska restaurangnamn och säger ingenting om
    vilket ställe det är.
    """
    for token in tokens:
        if token not in _GENERIC:
            return token
    return tokens[0] if tokens else None


def names_agree(ours: Tuple[str, ...], theirs: Tuple[str, ...]) -> bool:
    """Är det här samma ställe, räknat på namnet?

    Lika ordmängd, eller den ena en hel delmängd av den andra. Delmängden
    behövs åt båda håll: kommunens register skriver ofta ut mer än skylten
    ("Sushi Yama Gallerian" mot "Sushi Yama"), och ibland mindre ("Café
    Gateau" mot "Gateau").

    ETT ENSAMT GEMENSAMT ORD ÄR DET SVAGASTE BELÄGG VI GODTAR, och det
    godtas bara när ordet är HUVUDORDET i båda namnen. Kravet kom ur en
    granskning av de 465 hopparningar som vilade på ett enda ord: de som var
    fel vilade genomgående på ett ORTNAMN eller ett GATUNAMN som båda namnen
    råkade bära för att de ligger på samma plats. "Livs Södermalm" parades med
    "ICA Kvantum Södermalm" 62 meter bort, och "United Spaces Götgatsbacken"
    med "Götgatsbacken" 85 meter bort. I båda fallen är ordet sist i det ena
    namnet och alltså inte det som namnger stället.

    Priset är känt: några riktiga par faller också, till exempel "Dramaten
    Restaurangen/ Frippe" mot "Frippe". Det är rätt riktning att fela åt.
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
    if word in _GENERIC or len(word) < MIN_SOLO_TOKEN:
        return False
    return head(ours) == word and head(theirs) == word


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

#: `opening_hours` är ett eget litet språk. Vi stöder den delmängd som faktiskt
#: förekommer i vår data, och INGENTING annat: ett uttryck vi inte förstår
#: HELT kastas, och verksamheten får ingen öppettid alls.
#:
#: Delmängden, i BNF-liknande form:
#:
#:     uttryck   := block (";" block)*
#:     block     := "24/7" | "off" | "closed" | del ("," del)*
#:     del       := dagar | dagar? tider | dagar? ("off" | "closed")
#:     dagar     := dagspec ("-" dagspec)?  ("PH" räknas som dagspec)
#:     dag       := Mo | Tu | We | Th | Fr | Sa | Su
#:     tider     := tid "-" tid
#:     tid       := H+:MM, där timmen får gå till 47 (se _TIME)
#:
#: KOMMATECKNET BETYDER TRE SAKER, och alla tre förekommer i vår data:
#:
#:     Sa,Su 12:00-21:00                  en dagslista
#:     Mo-Fr 11:00-14:00,17:00-22:00      två pass samma dag
#:     Mo-Fr 11:00-21:00, Sa-Su 12:00-21:00   två regler
#:
#: Mätt över de 3 913 uttryck vi hämtat 2026-08-18: 758 av dem, alltså 19,4
#: procent, använder kommatecknet som regelavskiljare. En tolkare som bara
#: delar på semikolon lämnar 399 uttryck (10,2 procent) utanför delmängden;
#: med kommatecknet och de bara tidsspannen inräknade är det 121 (3,1 procent),
#: och de som återstår är öppna slut, säsonger och kommentarer som inte GÅR
#: att stödja utan att gissa.
#:
#: Delarna klassas därför på vad de INNEHÅLLER och inte på vilket tecken som
#: står före: en del med dagar och tider börjar en ny regel, en del med bara
#: dagar samlas till nästa regel, och en del med bara tider är ännu ett pass i
#: den föregående.
#:
#: Allt annat faller utanför: veckonummer ("week 28-32"), datumintervall
#: ("Apr-Sep", "Jun 06-Aug 20"), öppet slut ("17:00+"), soluppgång, "Mo[1]",
#: kommentarer inom citattecken, och "open"/"unknown".

_DAYS = ("Mo", "Tu", "We", "Th", "Fr", "Sa", "Su")
_DAY_INDEX = {d: i for i, d in enumerate(_DAYS)}

#: Timmen får gå till 47. `16:00-24:00` och `16:00-25:00` står båda i vår data
#: och betyder midnatt respektive klockan ett på natten. Att stanna vid 24
#: hade kastat de senare utan att vinna något.
_TIME = re.compile(r"^(\d{1,2}):([0-5]\d)$")
_MAX_HOUR = 47

#: En tidsdel, alltså "11:00-22:00". Ankrad: "17:00+" och "17:00" ensamt är
#: öppna slut och ska falla utanför.
_TIME_SPAN = re.compile(r"^\d{1,2}:[0-5]\d\s*-\s*\d{1,2}:[0-5]\d$")

#: En dagdel, alltså "Mo", "Mo-Fr" eller "PH".
_DAY_SPEC = re.compile(r"^(?:PH|Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*-\s*(?:Mo|Tu|We|Th|Fr|Sa|Su))?$")


def _parse_day_spec(spec: str) -> Optional[Tuple[List[int], bool]]:
    """Veckodagarna i en dagdel, plus om den gäller helgdagar."""
    spec = spec.strip()
    if not _DAY_SPEC.match(spec):
        return None
    if spec == "PH":
        return [], True
    if "-" in spec:
        a, _, b = spec.partition("-")
        start, end = _DAY_INDEX[a.strip()], _DAY_INDEX[b.strip()]
        days = []
        i = start
        # Mo-Su går rakt fram, Fr-Mo viker runt veckoskiftet.
        while True:
            days.append(i)
            if i == end:
                break
            i = (i + 1) % 7
        return days, False
    return [_DAY_INDEX[spec]], False


def _parse_time_span(spec: str) -> Optional[Tuple[int, int]]:
    """Ett spann i minuter från midnatt.

    Slut före eller lika med start betyder över midnatt, och spannet skrivs då
    som ett tal som passerar 1440. Utvärderaren i webbläsaren delar den formen
    och behöver därför inte känna till regeln.
    """
    a, _, b = spec.partition("-")
    ma, mb = _TIME.match(a.strip()), _TIME.match(b.strip())
    if not ma or not mb:
        return None
    if int(ma.group(1)) > _MAX_HOUR or int(mb.group(1)) > _MAX_HOUR:
        return None
    start = int(ma.group(1)) * 60 + int(ma.group(2))
    end = int(mb.group(1)) * 60 + int(mb.group(2))
    if end <= start:
        end += 24 * 60
    if end - start > 24 * 60 or start >= 24 * 60:
        return None
    return start, end


@dataclass(frozen=True)
class Rule:
    """En regel: vilka veckodagar, vilka tidsspann, och om den stänger.

    Tom `days` OCH `public_holiday` falskt betyder alla veckodagar. `days` och
    `public_holiday` kan gälla samtidigt: "Sa-Su,PH off" stänger lördag,
    söndag och röda dagar i en och samma regel.
    """

    days: Tuple[int, ...]
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

    for block in text.split(";"):
        block = block.strip()
        if not block:
            continue
        lowered = block.lower()
        if lowered == "24/7":
            rules.append(Rule((), ((0, 24 * 60),), False, False))
            continue
        if lowered in ("off", "closed"):
            rules.append(Rule((), (), True, False))
            continue

        # Dagar som setts men ännu inte fått någon tid. "Sa,Su 12:00-21:00"
        # lämnar Sa här tills Su kommer med sitt spann.
        pending_days: List[int] = []
        pending_ph = False
        # Vilken regel ett ensamt tidsspann ska läggas till.
        last: Optional[int] = None

        for part in block.split(","):
            part = part.strip()
            if not part:
                return None

            closed = False
            for suffix in (" off", " closed"):
                if part.lower().endswith(suffix):
                    closed = True
                    part = part[: -len(suffix)].strip()
                    break
            if not closed and part.lower() in ("off", "closed"):
                closed = True
                part = ""

            # Dela i dagdel och tidsdel vid första klockslaget.
            hit = re.search(r"\d{1,2}:\d{2}", part)
            if hit:
                day_spec = part[: hit.start()].strip()
                time_spec = part[hit.start():].strip()
            else:
                day_spec, time_spec = part, ""

            days: List[int] = []
            ph = False
            if day_spec:
                parsed = _parse_day_spec(day_spec)
                if parsed is None:
                    return None
                days, ph = parsed

            # Bara dagar, ingen tid och ingen stängning: samla till nästa del.
            if day_spec and not time_spec and not closed:
                pending_days.extend(days)
                pending_ph = pending_ph or ph
                continue

            # Bara en tid, ingen dagdel: ännu ett pass i föregående regel.
            # Står den FÖRST i blocket finns ingen föregående, och då är det
            # ett uttryck utan dagdel alls: "07:00-22:00" betyder alla dagar.
            # Formen står på 76 av våra 3 913 uttryck.
            if not day_spec and time_spec and not closed and last is not None:
                if not _TIME_SPAN.match(time_spec):
                    return None
                span = _parse_time_span(time_spec)
                if span is None:
                    return None
                previous = rules[last]
                rules[last] = Rule(
                    previous.days,
                    previous.spans + (span,),
                    previous.closed,
                    previous.public_holiday,
                )
                continue

            all_days = sorted(set(pending_days + days))
            all_ph = pending_ph or ph
            pending_days, pending_ph = [], False

            if closed:
                rules.append(Rule(tuple(all_days), (), True, all_ph))
                last = len(rules) - 1
                continue

            if not time_spec or not _TIME_SPAN.match(time_spec):
                return None
            span = _parse_time_span(time_spec)
            if span is None:
                return None
            rules.append(Rule(tuple(all_days), (span,), False, all_ph))
            last = len(rules) - 1

        # Dagar utan tid sist i ett block är ett halvt uttryck.
        if pending_days or pending_ph:
            return None

    return rules or None


def _spans_text(spans: List[List[int]]) -> str:
    """Spann som en rad: "540-1320" eller "660-840,1020-1320"."""
    return ",".join(f"{a}-{b}" for a, b in spans)


def compile_hours(raw: str) -> Optional[dict]:
    """Den form sajten läser: veckoschema plus helgdagsregel.

    `week` har sju poster, måndag först. Varje post är en RAD och inte en
    lista av listor: "540-1320", eller "660-840,1020-1320" för två pass, eller
    tom sträng för stängt. Talen är minuter från midnatt, och ett spann som går
    över midnatt slutar efter 1440.

    Formen är vald för filen och inte för koden. Med indent=1, som resten av
    datafilerna skrivs med, blev ett veckoschema av nästlade listor 50 rader
    per verksamhet: 2 788 verksamheter hade lagt drygt 100 000 rader i
    site/src/data och gjort varje framtida diff oläsbar. Som rader blir det
    nio. Uppackningen är en split i lib/oppettider.ts.

    `ph` är None när uttrycket inte säger något om helgdagar, och tom sträng
    när det säger stängt.
    """
    rules = parse_opening_hours(raw)
    if rules is None:
        return None

    week: List[List[List[int]]] = [[] for _ in range(7)]
    ph: Optional[List[List[int]]] = None

    for rule in rules:
        spans = [] if rule.closed else [[a, b] for a, b in rule.spans]
        if rule.public_holiday:
            ph = spans
        # En regel utan veckodagar OCH utan PH gäller hela veckan. En regel med
        # PH och inga veckodagar gäller bara helgdagar.
        if rule.days:
            days = rule.days
        elif rule.public_holiday:
            days = ()
        else:
            days = tuple(range(7))
        for day in days:
            # Senare regel skriver över tidigare för samma dag. Det är
            # opening_hours egen semantik: "Mo-Su 11:00-22:00; We 11:00-15:00"
            # betyder att onsdagen är kortare, inte att den har två pass.
            week[day] = list(spans)

    if all(not day for day in week) and ph is None:
        return None
    return {
        "week": [_spans_text(day) for day in week],
        "ph": None if ph is None else _spans_text(ph),
    }
