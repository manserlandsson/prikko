"""Geokodning av svenska adresser mot OpenStreetMap.

Uppsala och Örebro publicerar adress men inga koordinater. Utan koordinat får
verksamheten ingen kartnål och kan aldrig träffas av "använd min plats". Den
här modulen härleder koordinaten ur adressen.

VAL AV KÄLLA
------------
Vi slår INTE upp adress för adress mot en geokodningstjänst. Nominatims
användarvillkor tillåter fyra anrop i minuten för satsvis körning och avråder
uttryckligen från massgeokodning — 2 973 adresser hade tagit över tolv timmar
och legat i kanten av vad villkoren tål. Deras egen rekommendation är att
hämta datan i stället för att fråga tjänsten en gång per rad.

Det är precis vad vi gör: två Overpass-frågor, en per kommun, som hämtar
kommunens samtliga adresspunkter. Matchningen sker sedan lokalt. Två anrop mot
Overpass fair use-tak på 10 000 anrop och 1 GB per dygn är försumbart, och
resultatet blir dessutom reproducerbart — samma extrakt ger samma svar.

LICENS
------
Datan är OpenStreetMap under ODbL. OSMF:s riktlinje för geokodning
(Licence/Community Guidelines/Geocoding) säger att ett enskilt geokodningssvar
är ett oväsentligt utdrag som får lagras tillsammans med annan data utan att
utlösa share-alike. Attribution krävs däremot: sidor som visar en härledd
koordinat ska ange OpenStreetMap som källa.

Vi lagrar bara koordinaten för de verksamheter vi redan har, aldrig kommunens
adressregister i sin helhet. Mellanfilen med adresspunkter är ett arbetsmaterial
och versionshanteras inte.

VERIFIERING
-----------
En geokodare som inte hittar adressen svarar gärna med något närliggande och
fel. Därför: ingen gissning på gatunivå, ingen träff utanför kommunen, och
ingen träff där OSM har samma adress på punkter som ligger långt ifrån
varandra. Hellre ingen koordinat än en som ljuger — samma regel som
looks_like_sweden() i geo.py.
"""

from __future__ import annotations

import math
import re
import unicodedata
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Tuple

from .geo import looks_like_sweden

# Två punkter som OSM påstår är samma adress men som ligger längre isär än så
# är inte samma adress. Vanligast när ett gatunamn återkommer i två orter inom
# kommunen. Då vet vi inte vilken som avses, och då pekar vi inte ut någon.
AMBIGUOUS_SPREAD_M = 250.0

# Saknas husnumret i OSM får närmaste granne på samma sida av gatan duga —
# men bara grannporten. Gränsen är mätt, inte gissad: 200 ungefärliga träffar
# i Uppsala jämfördes med kommunens egen adresspunktstjänst.
#
#   avstånd i husnummer   medianfel   90:e percentilen   värsta
#   2 (grannen)              43 m           150 m         260 m
#   4                       111 m           340 m         646 m
#   6                        97 m           432 m         574 m
#   udda (andra sidan)      116 m           420 m         465 m
#
# Fyra nummer bort hamnar var åttonde nål i fel kvarter. Det är en nål som
# ljuger. Grannporten stannar inom kvarteret och får därför vara kvar.
MAX_NUMBER_GAP_SAME_SIDE = 2

PRECISION_ADDRESS = "address"
PRECISION_APPROXIMATE = "approximate"

SOURCE_OSM = "osm"
# Lantmäteriets belägenhetsadresser. Se prikko/lantmateriet.py för källa,
# licens och villkor.
SOURCE_LANTMATERIET = "lantmateriet"
# Uppsala kommuns egen adresspunktstjänst. Öppen utan nyckel, men licensen
# är INTE klarlagd, så källan väljs aldrig automatiskt. Se
# prikko/uppsalaadresser.py för vad ägaren behöver få svar på först.
SOURCE_UPPSALA = "uppsala"

# Skäl att inte sätta någon koordinat. Redovisas i cachen och i körningens
# sammanfattning: en utebliven träff ska gå att förklara, inte bara räknas.
#
# Namnen säger "in_osm" av historiska skäl och står kvar oförändrade: de
# ligger i geocode_cache.json på tusentals rader, och ett byte hade gjort
# varje gammal post oläsbar utan att förklara något nytt. Skälet betyder
# "fanns inte i den adresskälla körningen använde".
MATCHED = "matched"
MISS_NO_ADDRESS = "no_address_in_source"
MISS_UNPARSEABLE = "unparseable_address"
MISS_NO_STREET = "street_not_in_osm"
MISS_NO_NUMBER = "number_not_in_osm"
MISS_AMBIGUOUS = "ambiguous_in_osm"


@dataclass(frozen=True)
class Municipality:
    """Kommunens mittpunkt och yttre gräns, för rimlighetskontroll."""

    code: str
    lat: float
    lng: float
    radius_km: float


# Mittpunkter från kommunernas centralorter. Radien är satt med marginal över
# kommunens faktiska utsträckning: den ska fånga grova fel, inte trimma bort
# en gård i utkanten. Uppsala kommun sträcker sig cirka fem mil norrut.
#
# Tabellen är en UNDANTAGSLISTA och ska inte växa. En kommun utan post här får
# sin ram ur kommungränsens omslutande rektangel, som kommer i samma
# Overpass-hämtning som adresserna och beskriver kommunens faktiska
# utsträckning i stället för att vara satt på höft. Se build_index i
# pipeline/geocode.py och bounds_from_stac i lantmateriet.py.
#
# De två som står kvar gör det för att deras 1 611 koordinater är satta mot
# just de här ramarna. En ny ram kunde ha släppt in eller kastat träffar som
# redan är publicerade, och en ändring av vilka nålar som finns ska vara ett
# beslut och inte en bieffekt.
MUNICIPALITIES: Dict[str, Municipality] = {
    "0380": Municipality("0380", 59.858, 17.645, 55.0),
    "1880": Municipality("1880", 59.275, 15.213, 45.0),
}


@dataclass(frozen=True)
class Address:
    """Uppdelad svensk adress: gata, nummer, eventuellt bokstavstillägg."""

    street: str
    number: int
    letter: str

    @property
    def key(self) -> str:
        return f"{self.street} {self.number}{self.letter}".strip()


@dataclass(frozen=True)
class Match:
    lat: float
    lng: float
    precision: str
    source: str = SOURCE_OSM


@dataclass(frozen=True)
class Lookup:
    """Utfallet av ett uppslag. `match` är None när vi avstår."""

    match: Optional[Match]
    reason: str


def normalize_street(raw: str) -> str:
    """Gör gatunamn jämförbart mellan kommunens register och OSM.

    Källorna skiljer sig i versalisering ("Torgny segerstedts allé" mot
    "Torgny Segerstedts allé") och i hur helgonnamn skrivs: kommunen skriver
    "S:t Persgatan", OSM "Sankt Persgatan". Utan den översättningen tappar vi
    ett trettiotal adresser i Uppsala innerstad.
    """
    text = unicodedata.normalize("NFC", raw or "").lower()
    text = text.replace(" ", " ").replace("’", "'")
    text = re.sub(r"\bs:ta\b", "sankta", text)
    text = re.sub(r"\bs:t\b", "sankt", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip(" ,")


# Postnummer och postort på slutet: "Kungsgatan 19, 753 21 Uppsala". Orten är
# valfri — en del källor skriver bara postnumret.
_POSTAL_TAIL = re.compile(r"[\s,]+\d{3}\s?\d{2}(?:[\s,]+[^\d]+)?$")

# Lägenhet, uppgång och våning pekar inne i huset, inte på husets plats.
# Adressplatsen är densamma med eller utan dem, så de skalas bort.
_UNIT_TAIL = re.compile(
    r"[\s,]+(?:lgh|lägenhet|uppg|uppgång|vån|våning|bv|nb)\b[\s.:]*[\w-]*$"
)

# "Storgatan 12-14" och "Storgatan 12–14" är en fastighet med en serie
# nummer. Det första numret är den adressplats registret för.
_NUMBER_RANGE = re.compile(r"(\d{1,4})\s*[-–—]\s*\d{1,4}(\s*[a-zåäö]{0,2})$")

# Förkortade efterled. Kommunernas register skriver "Kungsg. 19" och
# "N. Ringv. 3" där Lantmäteriet skriver ut namnet. Bara efterledet i sista
# ordet expanderas här; förledet hanteras av _PREFIX nedan, eftersom "V."
# betyder västra först i namnet och vägen sist.
_SUFFIX = {
    "g": "gatan",
    "ga": "gatan",
    "gat": "gatan",
    "gt": "gatan",
    "v": "vägen",
    "vg": "vägen",
    "väg": "vägen",
    "gata": "gatan",
    "gr": "gränd",
    "pl": "plan",
    "tg": "torget",
    "all": "allén",
    "allé": "allén",
}

_PREFIX = {
    "n": "norra",
    "s": "södra",
    "ö": "östra",
    "v": "västra",
    "st": "stora",
    "l": "lilla",
    "gla": "gamla",
}


def parse_address(raw: Optional[str]) -> Optional[Address]:
    """Dela upp "Kungsgatan 39A" i gata, nummer och bokstav.

    Skalar först bort det som står EFTER adressplatsen och inte pekar ut
    någon annan punkt: postnummer med postort, lägenhetsnummer, uppgång och
    våning. Ett nummerintervall kortas till sitt första nummer.

    Returnerar None för det som inte är en adressplats: tomma fält, och
    poster där numret saknas. Utan nummer finns ingen punkt att peka på —
    det gäller de fyra kommuner vars källa bara publicerar en ort.
    """
    if not raw:
        return None
    text = normalize_street(raw)
    text = _UNIT_TAIL.sub("", text)
    text = _POSTAL_TAIL.sub("", text)
    text = _NUMBER_RANGE.sub(r"\1\2", text)
    match = re.match(r"^(.*?)[\s,]+(\d{1,4})\s*([a-zåäö]{0,2})$", text.strip(" ,"))
    if not match:
        return None
    street = match.group(1).strip(" ,-")
    if not street:
        return None
    return Address(street, int(match.group(2)), match.group(3))


def street_variants(street: str) -> List[str]:
    """Stavningar av samma gatunamn, den skrivna först.

    Kommunernas register förkortar, Lantmäteriets och OSM:s skriver ut. En
    variant är en GISSNING om hur namnet egentligen stavas, aldrig en
    gissning om vilken gata som avses — därför får uppslaget bara följa en
    variant när den och originalet inte pekar åt olika håll. Se lookup().
    """
    variants = [street]

    def push(candidate: str) -> None:
        if candidate and candidate not in variants:
            variants.append(candidate)

    push(_expand(street))

    # Bestämd och obestämd form. "Skolvägen" och "Skolväg" är olika namn i
    # registret men samma gata i talspråk, och kommunerna skriver båda.
    for base in list(variants):
        for definite, indefinite in (("vägen", "väg"), ("gatan", "gata")):
            for written, other in ((definite, indefinite), (indefinite, definite)):
                if base.endswith(written):
                    push(base[: -len(written)] + other)
    return variants


def _expand(street: str) -> str:
    """Skriv ut förkortningarna i ett gatunamn.

    Efterledet förkortas antingen ihopskrivet ("Kungsg.") eller som eget ord
    ("Stora tg"). Förledet bara ihop med punkt: "N." är norra, medan "n"
    utan punkt lika gärna är ett riktigt ord, och vi hittar inte på.
    """
    words = street.split()
    if not words:
        return street
    expanded = list(words)

    last = words[-1]
    bare = last.rstrip(".")
    if bare in _SUFFIX and len(words) > 1:
        expanded[-1] = _SUFFIX[bare]
    elif last.endswith("."):
        for length in (3, 2, 1):
            head, tail = bare[:-length], bare[-length:]
            if head and tail in _SUFFIX:
                expanded[-1] = head + _SUFFIX[tail]
                break

    first = words[0]
    if len(words) > 1 and first.endswith(".") and first.rstrip(".") in _PREFIX:
        expanded[0] = _PREFIX[first.rstrip(".")]

    return " ".join(expanded)


def cache_key(municipality_code: str, raw: str, source: str = SOURCE_OSM) -> str:
    """Nyckel i geocode_cache.json. Kommunen ingår: gatunamn återanvänds.

    OSM-nyckeln har kvar sin ursprungliga form. Cachen är versionshanterad
    och har tusentals rader; att lägga till ett fält i nyckeln hade slängt
    dem alla och tvingat fram en ny hämtning utan att svaret blev bättre.
    En ny källa får ett eget led, så att två källors svar på samma adress
    kan ligga sida vid sida och jämföras.
    """
    normalized = normalize_street(raw)
    if source == SOURCE_OSM:
        return f"{municipality_code}|{normalized}"
    return f"{municipality_code}|{source}|{normalized}"


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = p2 - p1
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _mean(points: List[Tuple[float, float]]) -> Tuple[float, float]:
    return (
        sum(p[0] for p in points) / len(points),
        sum(p[1] for p in points) / len(points),
    )


def _spread_m(points: List[Tuple[float, float]]) -> float:
    if len(points) < 2:
        return 0.0
    lat, lng = _mean(points)
    return max(haversine_m(lat, lng, p[0], p[1]) for p in points)


class AddressIndex:
    """Kommunens adresspunkter, uppslagbara på gata och nummer.

    Källan kan vara OSM (from_overpass) eller Lantmäteriets belägenhets-
    adresser (prikko.lantmateriet.build_index). Formen är densamma, och
    `source` följer med in i varje träff så att datafilen kan säga varifrån
    koordinaten kommer.
    """

    def __init__(self, source: str = SOURCE_OSM) -> None:
        self.source = source
        # (gata, nummer, bokstav) -> punkter, samt gata -> nummer -> punkter.
        self._exact: Dict[Tuple[str, int, str], List[Tuple[float, float]]] = {}
        self._by_street: Dict[str, Dict[int, List[Tuple[float, float]]]] = {}

    @property
    def streets(self) -> int:
        return len(self._by_street)

    @property
    def points(self) -> int:
        return sum(len(v) for v in self._exact.values())

    def add(self, street: str, number: int, letter: str, lat: float, lng: float) -> None:
        street = normalize_street(street)
        letter = letter.lower()
        self._exact.setdefault((street, number, letter), []).append((lat, lng))
        self._by_street.setdefault(street, {}).setdefault(number, []).append((lat, lng))

    @classmethod
    def from_overpass(cls, elements: Iterable[dict]) -> "AddressIndex":
        """Bygg index ur ett Overpass-svar.

        Landsbygdsadresser ("Myrö 912") saknar addr:street och bär gårdsnamnet
        i addr:place i stället. Båda taggarna räknas som gata här — kommunens
        adressfält skiljer inte på dem.
        """
        index = cls()
        for element in elements:
            tags = element.get("tags") or {}
            housenumber = tags.get("addr:housenumber")
            street = tags.get("addr:street") or tags.get("addr:place")
            if not housenumber or not street:
                continue

            lat = element.get("lat")
            lng = element.get("lon")
            if lat is None:
                center = element.get("center") or {}
                lat, lng = center.get("lat"), center.get("lon")
            if lat is None or lng is None:
                continue

            # "12;14" och "12-14" betyder att punkten bär flera adresser.
            for part in re.split(r"[;,]", str(housenumber)):
                found = re.match(r"^\s*(\d{1,4})\s*([A-Za-zÅÄÖåäö]{0,2})\s*$", part)
                if not found:
                    continue
                index.add(street, int(found.group(1)), found.group(2), float(lat), float(lng))
        return index

    def _resolve(self, points: List[Tuple[float, float]], precision: str) -> Lookup:
        if _spread_m(points) > AMBIGUOUS_SPREAD_M:
            return Lookup(None, MISS_AMBIGUOUS)
        lat, lng = _mean(points)
        return Lookup(
            Match(round(lat, 6), round(lng, 6), precision, self.source), MATCHED
        )

    def lookup(self, address: Address, allow_neighbour: bool = True) -> Lookup:
        """Slå upp en adress. Utan träff säger utfallet varför.

        Hittas inte gatunamnet som det står prövas de stavningar
        street_variants() räknar upp. En variant får bara avgöra saken när
        den är ensam om att träffa, eller när alla träffar pekar på samma
        plats — annars vet vi inte vilken gata som avsågs, och då pekar vi
        inte ut någon. Samma regel som spridningen inom en adress.

        `allow_neighbour` styr gissningen på grannporten. Den finns för OSM,
        vars täckning är ojämn. Lantmäteriets register är fullständigt: står
        numret inte där finns adressen inte, och då är grannporten inte ett
        närmevärde utan ett annat hus.
        """
        first = self._lookup_exact(address, allow_neighbour)
        if first.match is not None or first.reason != MISS_NO_STREET:
            return first

        hits = []
        for spelling in street_variants(address.street)[1:]:
            result = self._lookup_exact(
                Address(spelling, address.number, address.letter), allow_neighbour
            )
            if result.match is not None:
                hits.append(result)
        if not hits:
            return first
        points = [(h.match.lat, h.match.lng) for h in hits]
        if _spread_m(points) > AMBIGUOUS_SPREAD_M:
            return Lookup(None, MISS_AMBIGUOUS)
        return hits[0]

    def _lookup_exact(self, address: Address, allow_neighbour: bool) -> Lookup:
        exact = self._exact.get((address.street, address.number, address.letter))
        if exact:
            return self._resolve(exact, PRECISION_ADDRESS)

        # Kommunen skriver "39A", källan ofta bara "39" för hela huset. Numret
        # är rätt, uppgången okänd — det är fortfarande rätt hus.
        plain = self._exact.get((address.street, address.number, ""))
        if plain:
            return self._resolve(plain, PRECISION_ADDRESS)

        numbers = self._by_street.get(address.street)
        if not numbers:
            return Lookup(None, MISS_NO_STREET)

        same_number = numbers.get(address.number)
        if same_number:
            return self._resolve(same_number, PRECISION_ADDRESS)

        # Numret saknas i källan. Grannporten på samma sida av gatan får duga
        # och märks som ungefärlig, så att sidan kan säga det. Längre bort än
        # så avstår vi: se mätningen vid MAX_NUMBER_GAP_SAME_SIDE.
        if allow_neighbour:
            same_side = [n for n in numbers if n % 2 == address.number % 2]
            if same_side:
                best = min(same_side, key=lambda n: abs(n - address.number))
                if abs(best - address.number) <= MAX_NUMBER_GAP_SAME_SIDE:
                    return self._resolve(numbers[best], PRECISION_APPROXIMATE)

        return Lookup(None, MISS_NO_NUMBER)


def verify(match: Match, municipality: Municipality) -> Optional[str]:
    """Returnera skäl att kasta träffen, eller None om den håller.

    Två spärrar. Den grova fångar omkastad latitud och longitud och fel zon;
    den fina fångar att vi hamnat i en helt annan del av landet — det klassiska
    utfallet när en geokodare inte hittar adressen och svarar med något annat.
    """
    if not looks_like_sweden(match.lat, match.lng):
        return "outside_sweden"
    distance_km = haversine_m(match.lat, match.lng, municipality.lat, municipality.lng) / 1000
    if distance_km > municipality.radius_km:
        return "outside_municipality"
    return None
