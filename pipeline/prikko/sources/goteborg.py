"""Inläsare för Göteborgs Stads anläggningslista.

Fjortonde källan, och den enda som INTE blir verksamhetssidor. Läs
`docs/20_kommunexpansion.md` §10 innan du pekar den här hämtaren mot
`site/src/data/`.

## Vad källan är

En CSV ur Miljöförvaltningens verksamhetssystem Miljöreda, publicerad i
stadens egen datakatalog under **CC0 1.0** och uppdaterad dagligen. Nio
kolumner:

    namn;adress;postnummer;ort;typ;y_sweref991200;x_sweref991200;lat;lon

Mätt över hela filen 2026-08-31:

    5 076  rader
    5 062  verksamheter efter sammanslagning, se `merge_rows`
    4 873  distinkta namn
    4 892  rader med koordinat, 184 utan
       47  värden i `typ`, varav 291 rader har det tomt
        5  ogiltiga postnummer, se `postal_code`
        0  kontrollresultat

Och efter normaliseringen, räknat på de 5 062:

    4 878  med koordinat
    4 775  med verksamhetstyp
    4 960  med postnummer

## Det som avgör allt annat: noll kontrollresultat

Filen är ett REGISTER och inte en kontrollredovisning. Det finns ingen
kolumn med bedömning, inget datum för en kontroll, ingen avvikelse och ingen
inspektion. Varje post normaliseras därför till en verksamhet med tom
historik, `verdict: null` och `reason: no_inspections`.

Det är hela skälet att den här modulen finns i pipelinen men inte i sajten.
Utfallet av att lägga filen i `site/src/data/` vore 5 062 verksamhetssidor
som alla säger "ingen bedömning", plus en kommunhubb och en sidserie som
indexeras och inte kan svara på den enda fråga besökaren kom med. Motiveringen
i sin helhet, med de tal den vilar på, står i `docs/20` §10.

Formen på det den skriver är ändå EXAKT en sajtdatafil, med `municipality`,
`source` och `establishments`. Det är avsiktligt: den dag Göteborg lämnar ut
kontrollresultat är skillnaden mellan underlag och publicering vilken katalog
`--out` pekar på, inte en omskrivning.

## Koordinaterna är verifierade mot varandra

Filen bär samma punkt i två system, WGS84 och SWEREF 99 12 00. Alla 4 892
rader med koordinat räknades om från SWEREF med `prikko.geo` och jämfördes
med filens egna lat/lon: största avvikelse 2,4e-11 grader, alltså under en
hundradels millimeter, och noll punkter utanför Sverige. De två kolumnerna
beskriver samma punkt, och filens `lat`/`lon` går att lita på som de står.

Kontrollen görs om vid varje hämtning, se `check_coordinates`. Skulle
kommunen någon gång byta projektion i ena kolumnen utan att säga det faller
hämtningen i stället för att flytta femtusen nålar.

## Adresserna står i versaler

5 075 av 5 076 adresser är skrivna helt i versaler, `SKÅNEGATAN 20`, och
2 924 av orterna likaså. Det är källans skrivsätt och inte en uppgift, så det
normaliseras till gemener med stor begynnelsebokstav. Namnen rörs INTE: bara
74 av 5 076 är versala, och där är versalerna oftare varumärket än slarvet.
"""

from __future__ import annotations

import csv
import hashlib
import io
import re
from dataclasses import dataclass
from typing import Dict, List, Optional

from ..geo import SWEREF99_1200, looks_like_sweden, sweref99_to_wgs84

MUNICIPALITY_CODE = "1480"  # Göteborg, SCB REGINA
MUNICIPALITY_NAME = "Göteborgs Stad"
# Orten, i grundform. Får ALDRIG härledas ur kommunnamnet.
MUNICIPALITY_CITY = "Göteborg"
MUNICIPALITY_SLUG = "goteborg"

#: Filen. CSV och inte rowstore-JSON: JSON-varianten svarade `resultCount`
#: 4 786 mot CSV:ns 5 076 vid mätningen 2026-08-30, och skillnaden är inte
#: utredd. Den färskare av de två vinner tills någon vet varför de skiljer sig.
DATA_URL = "https://catalog.goteborg.se/store/6/resource/57478"

#: Datamängdens sida, dit en människa ska hänvisas.
SOURCE_URL = "https://catalog.goteborg.se/store/6/resource/35"

#: Licensen, uppmätt i datamängdens DCAT 2026-08-30. Otvetydig och kräver
#: ingen attribution, men vi anger källan ändå.
LICENCE = "CC0-1.0"
LICENCE_URL = "http://creativecommons.org/publicdomain/zero/1.0/"
ATTRIBUTION = "Göteborgs Stad, miljöförvaltningen"

#: Kolumnerna filen måste ha. En kolumn som byter namn ska fälla hämtningen,
#: inte tyst ge tomma fält på femtusen rader.
COLUMNS = (
    "namn",
    "adress",
    "postnummer",
    "ort",
    "typ",
    "y_sweref991200",
    "x_sweref991200",
    "lat",
    "lon",
)

#: Hur långt filens två koordinatsystem får skilja sig innan hämtningen
#: faller, i grader. Uppmätt största avvikelse är 2,4e-11; taket är satt
#: fyra tiopotenser över den, vilket fortfarande är under en meter.
MAX_COORDINATE_DRIFT_DEG = 1e-6


class UnknownSourceValue(Exception):
    """Källan levererade något vi inte känner igen."""


@dataclass(frozen=True)
class NormalizedEstablishment:
    id_national: str
    municipality_code: str
    id_local: str
    name: str
    street_address: Optional[str]
    postal_code: Optional[str]
    locality: Optional[str]
    types: List[str]
    lat: Optional[float]
    lng: Optional[float]


def squeeze(text: Optional[str]) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def title_case(text: str) -> str:
    """Gör om källans versaler till normal skrivning.

    Bara HELT versala ord rörs. Ett ord som redan är blandat är någons val och
    lämnas i fred, och ett ord utan bokstäver (husnumret) likaså. Bindestreck
    och snedstreck räknas som ordgränser, så `HISINGS-BACKA` blir
    `Hisings-Backa`.

    Husnumrets bokstav följer med numret och blir versal: `5C` förblir `5C`
    och inte `5c`, eftersom det är så en svensk adress skrivs.
    """
    def ord_om(word: str) -> str:
        if not any(c.isalpha() for c in word):
            return word
        if word != word.upper():
            return word
        if word[0].isdigit():
            # Husnummer med bokstav: 5C, 12 B. Versalen är rätt.
            return word
        return word[0] + word[1:].lower()

    return re.sub(r"[^\s/-]+", lambda m: ord_om(m.group(0)), text)


def postal_code(raw: str) -> Optional[str]:
    """Postnumret som fem siffror, eller None.

    Källan skriver det både som `40229` och `402 29`. Fem rader av 5 076 bär
    något annat: tre sexsiffriga, två fyrsiffriga och en där gatuadressen
    hamnat i postnummerkolumnen (`lomstergatan 11,`). De får None. Ett
    postnummer som inte är fem siffror är inte ett postnummer, och att skriva
    fram ett näraliggande vore att uppfinna en uppgift.
    """
    digits = re.sub(r"\D", "", raw or "")
    return digits if len(digits) == 5 else None


def local_id(name: str, address: str) -> str:
    """Stabil lokal identitet.

    Källan har ingen id-kolumn. Namn och adress ger 5 062 distinkta par av
    5 076 rader, med gemener och normaliserade blanksteg; de fjorton
    upprepningarna är samma verksamhet registrerad under flera typer, och de
    slås ihop i `merge_rows`.
    """
    if not name:
        raise UnknownSourceValue("Rad utan namn")
    return hashlib.sha1(
        f"{name.casefold()}|{address.casefold()}".encode("utf-8")
    ).hexdigest()[:12]


def parse(text: str) -> List[dict]:
    """Läs CSV:n. Kastar när kolumnerna inte är de vi känner igen."""
    reader = csv.DictReader(io.StringIO(text), delimiter=";")
    header = tuple(reader.fieldnames or ())
    if header != COLUMNS:
        raise UnknownSourceValue(
            f"Kolumnerna är {header!r} och inte {COLUMNS!r}. Källan har lagt om."
        )
    rows = list(reader)
    if not rows:
        raise UnknownSourceValue("Filen innehåller noll rader")
    return rows


def coordinates(row: dict) -> tuple:
    """Punkten som `(lat, lng)`, eller `(None, None)`.

    Filens egna WGS84-kolumner används. SWEREF-kolumnerna är facit, se
    `check_coordinates`, inte källa.
    """
    raw_lat, raw_lng = squeeze(row.get("lat")), squeeze(row.get("lon"))
    if not raw_lat or not raw_lng:
        return None, None
    try:
        lat, lng = float(raw_lat), float(raw_lng)
    except ValueError as exc:
        raise UnknownSourceValue(f"Oläsbar koordinat {raw_lat!r}, {raw_lng!r}") from exc
    if not looks_like_sweden(lat, lng):
        # Hellre ingen position än en position som ljuger.
        return None, None
    return round(lat, 6), round(lng, 6)


def check_coordinates(rows: List[dict]) -> tuple:
    """Räkna om SWEREF-kolumnen och jämför med filens egen WGS84.

    Ger `(jämförda, största avvikelse)`. Kastar när avvikelsen passerar
    MAX_COORDINATE_DRIFT_DEG, alltså när de två kolumnerna slutat beskriva
    samma punkt. Se modulens inledning.
    """
    compared, worst = 0, 0.0
    for row in rows:
        raw_lat, raw_lng = squeeze(row.get("lat")), squeeze(row.get("lon"))
        north, east = squeeze(row.get("y_sweref991200")), squeeze(row.get("x_sweref991200"))
        if not (raw_lat and raw_lng and north and east):
            continue
        try:
            lat, lng = sweref99_to_wgs84(float(north), float(east), SWEREF99_1200)
            drift = max(abs(lat - float(raw_lat)), abs(lng - float(raw_lng)))
        except ValueError:
            continue
        compared += 1
        worst = max(worst, drift)

    if worst > MAX_COORDINATE_DRIFT_DEG:
        raise UnknownSourceValue(
            f"WGS84 och SWEREF 99 12 00 skiljer sig med {worst:.3g} grader "
            f"på {compared} rader. Kommunen har bytt projektion i en av "
            "kolumnerna, och nålarna får inte flyttas på gissning."
        )
    return compared, worst


def merge_rows(rows: List[dict]) -> List[tuple]:
    """Slå ihop rader som är samma verksamhet, och sortera stabilt.

    Fjorton rader av 5 076 är samma namn och adress registrerade under flera
    typer. Utan sammanslagning får de samma identitet, och två poster med
    samma id är ett fel att upptäcka och inte att publicera. Typerna läggs
    ihop i stället, så ingen uppgift går förlorad.

    Ordningen är alfabetisk på namn och adress. Samma skäl som i
    `sources/ecos.py`: `dedupe_slugs` numrerar krockar positionellt, och en
    ordning som rör sig när källan uppdateras flyttar URL:er.
    """
    merged: Dict[str, dict] = {}
    types: Dict[str, list] = {}
    for row in rows:
        name = squeeze(row.get("namn"))
        address = squeeze(row.get("adress"))
        key = local_id(name, address)
        merged.setdefault(key, row)
        kind = squeeze(row.get("typ"))
        if kind and kind not in types.setdefault(key, []):
            types[key].append(kind)

    out = [(key, row, types.get(key, [])) for key, row in merged.items()]
    return sorted(
        out,
        key=lambda r: (
            squeeze(r[1].get("namn")).casefold(),
            squeeze(r[1].get("adress")).casefold(),
            r[0],
        ),
    )


def normalize_establishment(
    id_local: str, row: dict, types: List[str]
) -> NormalizedEstablishment:
    """En verksamhet ur en rad.

    `types` bärs vidare RÅA, i källans versaler. Kategorimappningen i
    `site/src/lib/categories.ts` är en tabell över källans egna strängar, och
    en normalisering här hade gjort tabellen omöjlig att skriva mot filen.
    Ingen av de 47 strängarna står i den tabellen i dag, se `docs/20` §10.
    """
    lat, lng = coordinates(row)
    address = title_case(squeeze(row.get("adress")))
    locality = title_case(squeeze(row.get("ort")))

    return NormalizedEstablishment(
        id_national=f"F-{MUNICIPALITY_CODE}-{id_local}",
        municipality_code=MUNICIPALITY_CODE,
        id_local=id_local,
        name=squeeze(row.get("namn")),
        street_address=address or None,
        postal_code=postal_code(squeeze(row.get("postnummer"))),
        locality=locality or None,
        types=types,
        lat=lat,
        lng=lng,
    )
