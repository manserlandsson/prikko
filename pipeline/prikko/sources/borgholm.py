"""Inläsare för Borgholms kommun.

Tolfte källan, och den enda som publicerar hela beståndet som en TABELL i en
PDF. Två anrop räcker: ett för sidan, som bär länken, och ett för filen.

    https://www.borgholm.se/resultat-livsmedelskontroller/
    https://www.borgholm.se/wp-content/uploads/2025/07/Kontrollresultat2025_v42.pdf

Filnamnet är versionerat (`_v42`) och ligger under `/wp-content/uploads/
ÅÅÅÅ/MM/`. Adressen byts vid varje uppdatering, så länken måste skrapas ur
sidan och får aldrig hårdkodas.

## En tabell utan tabellstruktur

En PDF vet inget om tabeller. Kolumnerna finns bara som x-positioner, raderna
bara som y-positioner, och celler som spänner över flera rader skrivs en enda
gång. Adaptern bygger därför tillbaka tabellen ur `pdf.extract_blocks`:

    x ≈  64  Ort              x ≈ 317  Datum
    x ≈ 137  Typ              x ≈ 395  Kontrollorsak
    x ≈ 200  Namn             x ≈ 458  Avvikelse

En rad börjar där Datum-kolumnen har ett värde. Ort, Typ och Namn skrivs bara
när de ändras och bärs vidare nedåt — en verksamhet med tre kontroller står
med sitt namn en gång och sina tre datum under varandra.

Räknat 2026-08-03: 531 rader, 406 verksamheter, 422 rader med kontrolldatum
och 108 med `EA`.

## EA betyder att ingen kontroll utförts

Kommunens egen läsanvisning på sidan: *"EA står för 'ej aktuell' och innebär
att ingen kontroll har utförts det senaste året."* Avvikelsekolumnen står
ändå på `0` för de raderna, men en nolla utan kontroll är inte ett
godkännande. 101 av 406 verksamheter har bara EA-rader och blir obedömda.

## Avvikelserna är kodade enligt Livsmedelsverket

Unikt bland de nya källorna: avvikelsen anges som `J03 – Hygien före, under
och efter processen`, alltså samma bokstavskodning som sajtens
`LEGISLATION_AREAS` redan använder. Tio distinkta värden förekommer, `0`
inräknat.

En cell kan innehålla flera poster staplade under varandra. Är den SISTA
posten `0` är det senast kända läget utan avvikelser, och de koder som står
före är åtgärdade — samma tolkning som Uppsalas "Avvikelse åtgärdad", som
också ger `NO_REMARKS`. Är den sista posten en kod står avvikelsen kvar.
"""

from __future__ import annotations

import hashlib
import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import date
from typing import List, Optional

from ..grading import COMPLAINT, FOLLOWUP, MINOR_REMARKS, NO_REMARKS, ROUTINE
from ..pdf import Block, join_wrapped

MUNICIPALITY_CODE = "0885"  # Borgholm, SCB REGINA
MUNICIPALITY_NAME = "Borgholms kommun"
# Orten, i grundform. Får ALDRIG härledas ur kommunnamnet.
MUNICIPALITY_CITY = "Borgholm"

SOURCE_URL = "https://www.borgholm.se/resultat-livsmedelskontroller/"

#: Länken till tabellen. Filnamnet är versionerat och byts vid varje
#: uppdatering, så den måste skrapas ur sidan.
PDF_LINK = re.compile(
    r'href="(https://www\.borgholm\.se/wp-content/uploads/[^"]+\.pdf)"', re.I
)

# ---------------------------------------------------------------------------
# Tabellens form
#
# Kolumnernas x-lägen är uppmätta i filen, inte antagna. Toleransen är satt
# efter den faktiska spridningen: samma kolumn varierar med någon punkt
# mellan rader (200.3 och 199.2 för Namn), medan närmaste grannkolumn ligger
# 60 punkter bort.
# ---------------------------------------------------------------------------

COLUMNS = (
    (64.0, "ort"),
    (137.0, "typ"),
    (200.0, "namn"),
    (317.0, "datum"),
    (395.0, "orsak"),
    (458.0, "avvikelse"),
)
COLUMN_TOLERANCE = 13.0

# ---------------------------------------------------------------------------
# Värdeöversättning
#
# Samtliga förekommande värden är uträknade över hela tabellen (531 rader,
# 2026-08-03), inte gissade. Antal inom parentes.
# ---------------------------------------------------------------------------

#: Kontrollorsak. Kommunens egen läsanvisning står på sidan:
#:
#:     Planerad kontroll är mer omfattande och utförs enligt riskklassning av
#:     verksamhet.
#:     Uppföljning av kontroll innebär att tidigare brister kontrolleras.
#:     Händelsestyrd kontroll sker om det kommit in klagomål eller larm
#:     (RASFF) som måste följas upp.
#:
#: Kolumnen kan bära flera orsaker för samma rad, ibland kommaseparerade och
#: ibland staplade utan avskiljare (`PlaneradUppföljning avvikelser utan id`).
#: Därför nyckelord med rangordning i stället för en tabell, precis som i
#: Jönköping: en rad som bland annat är en uppföljning ÄR en uppföljning, och
#: det är just uppföljningen modellen läser allvarsgrad ur.
REASON_KEYWORDS = (
    ("uppfölj", FOLLOWUP),       # "Uppföljande" och "Uppföljning avvikelser utan id"
    ("händelsestyrd", COMPLAINT),
    ("planerad", ROUTINE),
)

#: `EA` i orsakskolumnen betyder att ingen kontroll utförts. Det står i
#: kommunens läsanvisning och sammanfaller undantagslöst med `EA` i
#: datumkolumnen: 108 rader har båda, noll rader har bara den ena.
NOT_INSPECTED = "EA"

#: Avvikelsekolumnens poster. `0` betyder inga avvikelser, allt annat börjar
#: med Livsmedelsverkets kod. Mönstret används för att dela en cell med flera
#: staplade poster — utan det klistras `J02 – …utrustning` ihop med nästa
#: posts `0` till en enda sträng.
DEVIATION_ENTRY = re.compile(r"^\s*(?:0\s*$|[A-ZÅÄÖ]\d{2}\s*[–-])")

#: Koden och områdesnamnet. Tio distinkta poster förekommer: `0` (508),
#: `J03` (24), `J08` (20), `J02` (12), `B02` (11), `J05` (3), `J06` (2),
#: `J09` (1), `N23` (1), `H09` (1).
DEVIATION_CODE = re.compile(r"^([A-ZÅÄÖ]\d{2})\s*[–-]\s*(.+)$")

NO_DEVIATIONS = "0"

#: Kontrollområdets läge. Samma ordval som i Linköping och Örebro.
AREA_DEVIATION = "deviation"
AREA_FIXED = "fixed"

#: Ortkolumnens värden. `(tom)` är inte ett ortnamn utan kommunens sätt att
#: skriva att orten saknas — 14 rader. Den enda andra egenheten är `KALMAR`
#: i versaler, en verksamhet registrerad utanför kommunen.
EMPTY_ORT = "(tom)"

ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class UnknownSourceValue(Exception):
    """Källan levererade ett värde vi inte känner igen.

    Får aldrig hanteras med ett default. Vi publicerar omdömen om namngivna
    verksamheter; ett okänt värde som tyst tolkas som godkänt är precis den
    sortens fel som förstör förtroendet.
    """


@dataclass(frozen=True)
class ControlArea:
    code: str
    group: str
    description: str
    status: str


@dataclass(frozen=True)
class Row:
    """En rad i tabellen, med tomma celler ifyllda uppifrån."""

    ort: Optional[str]
    typ: str
    namn: str
    datum: str
    orsak: str
    #: Avvikelsekolumnens poster, uppifrån och ned.
    avvikelser: List[str]


@dataclass(frozen=True)
class NormalizedInspection:
    id_national: str
    establishment_id: str
    inspected_at: date
    assessment: int
    type: int
    prenotified: Optional[bool]
    audit: bool
    on_site: bool
    areas: list
    uncertain: bool


@dataclass(frozen=True)
class NormalizedEstablishment:
    id_national: str
    municipality_code: str
    id_local: str
    name: str
    street_address: Optional[str]
    types: list
    lat: Optional[float]
    lng: Optional[float]


def find_pdf_url(markup: str) -> str:
    """Plocka länken till tabellen ur sidan."""
    found = PDF_LINK.search(markup)
    if not found:
        raise UnknownSourceValue(
            "Sidan innehåller ingen länk till en PDF under wp-content/uploads — "
            "kommunen har flyttat eller tagit bort tabellen."
        )
    return found.group(1)


def _column(x: float) -> Optional[str]:
    best = min(COLUMNS, key=lambda column: abs(column[0] - x))
    return best[1] if abs(best[0] - x) < COLUMN_TOLERANCE else None


def _entries(parts: List[str]) -> List[str]:
    """Dela avvikelsekolumnens löpor i poster.

    En post börjar med `0` eller med en kod. Allt däremellan är radbrytningar
    inom samma post och slås ihop med `join_wrapped`, som vet att en cell som
    bryts mitt i ett ord slutar utan blanksteg.
    """
    entries: List[str] = []
    current: List[str] = []
    for part in parts:
        if DEVIATION_ENTRY.match(part) and current:
            entries.append(join_wrapped(current))
            current = [part]
        else:
            current.append(part)
    if current:
        entries.append(join_wrapped(current))
    return [e for e in entries if e]


def parse_table(blocks: List[Block]) -> List[Row]:
    """Bygg tillbaka tabellen ur textlöpornas positioner.

    Raderna avgränsas av Datum-kolumnen: där den har ett värde börjar en ny
    rad, och allt som står lägre ned till nästa sådant värde hör till samma
    rad. Ort, Typ och Namn bärs vidare nedåt eftersom kommunen bara skriver
    dem när de ändras.
    """
    in_table = [b for b in blocks if _column(b.x)]
    if not in_table:
        raise UnknownSourceValue(
            "Ingen text hittades i tabellens kolumner — filens layout har ändrats."
        )

    by_page: dict = defaultdict(list)
    for block in in_table:
        by_page[block.page].append(block)

    rows: List[Row] = []
    ort = typ = namn = ""

    for page in sorted(by_page):
        blocks_on_page = sorted(by_page[page], key=lambda b: (-b.y, b.x))
        starts = sorted(
            {b.y for b in blocks_on_page if _column(b.x) == "datum"}, reverse=True
        )
        for index, top in enumerate(starts):
            bottom = starts[index + 1] if index + 1 < len(starts) else float("-inf")
            cells: dict = defaultdict(list)
            for block in blocks_on_page:
                if bottom < block.y <= top:
                    cells[_column(block.x)].append(block)

            def cell(name: str) -> List[str]:
                return [b.text for b in sorted(cells[name], key=lambda b: -b.y)]

            datum = join_wrapped(cell("datum"))
            if datum == "Datum":
                # Rubrikraden. Upprepas inte per sida, men finns en gång.
                continue

            ort = join_wrapped(cell("ort")) or ort
            typ = join_wrapped(cell("typ")) or typ
            namn = join_wrapped(cell("namn")) or namn

            rows.append(
                Row(
                    ort=None if ort in ("", EMPTY_ORT) else ort,
                    typ=typ,
                    namn=namn,
                    datum=datum,
                    orsak=join_wrapped(cell("orsak")),
                    avvikelser=_entries(cell("avvikelse")),
                )
            )

    if not rows:
        raise UnknownSourceValue("Tabellen innehöll inga rader")
    return rows


def local_id(name: str, ort: Optional[str]) -> str:
    """Stabil lokal identitet för en verksamhet.

    Kommunen publicerar varken id eller gatuadress. Namn plus ort är allt som
    finns, och det är samma nyckel tabellen själv grupperar på: en verksamhet
    med flera kontroller står med sitt namn en gång och sina datum under
    varandra.
    """
    cleaned = " ".join((name or "").split()).casefold()
    if not cleaned:
        raise UnknownSourceValue("Rad utan verksamhetsnamn")
    return hashlib.sha1(
        f"{cleaned}|{(ort or '').casefold()}".encode("utf-8")
    ).hexdigest()[:12]


def group_rows(rows: List[Row]) -> List[tuple]:
    """Samla raderna per verksamhet, i den ordning de står i tabellen."""
    order: list = []
    grouped: dict = {}
    for row in rows:
        key = local_id(row.namn, row.ort)
        if key not in grouped:
            order.append(key)
            grouped[key] = []
        grouped[key].append(row)
    return [(grouped[key][0], grouped[key]) for key in order]


def partition_rows(rows: List[Row]) -> tuple:
    """Dela en verksamhets rader i läsbara och oläsbara.

    En enda felskriven rad ska inte kosta hela verksamheten. `Arnolds
    Delikatesser` har tre rader, varav en har fått datumet utskrivet som
    kalkylbladstalet `45474`. De två andra går att läsa, och verksamheten ska
    bedömas på dem — men den trasiga raden ska räknas och skrivas ut, inte
    tigas ihjäl.

    Rader utan kontroll (`EA`) räknas som läsbara: de betyder att ingen
    kontroll utförts, vilket är en uppgift och inte ett fel.
    """
    readable, broken = [], []
    for row in rows:
        if row.orsak == NOT_INSPECTED or row.datum == NOT_INSPECTED:
            readable.append(row)
        elif ISO_DATE.match(row.datum):
            readable.append(row)
        else:
            broken.append(row)
    return readable, broken


def parse_areas(entries: List[str]) -> List[ControlArea]:
    """Översätt avvikelseposterna till kontrollområden.

    Är den SISTA posten `0` är det senast kända läget utan avvikelser, och de
    koder som står före har åtgärdats. Är den sista posten en kod står
    avvikelsen kvar.
    """
    if not entries:
        return []

    status = AREA_FIXED if entries[-1] == NO_DEVIATIONS else AREA_DEVIATION
    areas = []
    for entry in entries:
        if entry == NO_DEVIATIONS:
            continue
        found = DEVIATION_CODE.match(entry)
        if not found:
            raise UnknownSourceValue(f"Okänd avvikelsepost {entry!r}")
        name = " ".join(found.group(2).split())
        areas.append(
            ControlArea(
                code=found.group(1),
                group=name,
                description=name,
                status=status,
            )
        )
    return areas


def assessment_of(entries: List[str]) -> int:
    """Radens utfall.

    Den sista posten i avvikelsekolumnen är det senast kända läget. En rad
    som slutar på `0` beskriver en verksamhet där avvikelserna åtgärdats,
    vilket är samma sak som Uppsalas "Avvikelse åtgärdad" och ger samma
    utfall.
    """
    if not entries:
        raise UnknownSourceValue("Rad utan avvikelsekolumn")
    return NO_REMARKS if entries[-1] == NO_DEVIATIONS else MINOR_REMARKS


def _reason_to_type(orsak: str) -> int:
    lowered = orsak.casefold()
    for keyword, value in REASON_KEYWORDS:
        if keyword in lowered:
            return value
    raise UnknownSourceValue(f"Okänd kontrollorsak {orsak!r}")


def normalize_establishment(row: Row) -> NormalizedEstablishment:
    id_local = local_id(row.namn, row.ort)
    return NormalizedEstablishment(
        id_national=f"F-{MUNICIPALITY_CODE}-{id_local}",
        municipality_code=MUNICIPALITY_CODE,
        id_local=id_local,
        name=row.namn,
        # Ingen gatuadress publiceras. Orten är ändå värd att visa när den
        # tillför något: 221 av 531 rader ligger utanför centralorten. Ett
        # "Borgholm" här hade bara upprepat kommunnamnet, som sidan redan
        # skriver ut efter adressen.
        street_address=(
            row.ort
            if row.ort and row.ort.casefold() != MUNICIPALITY_CITY.casefold()
            else None
        ),
        types=[row.typ] if row.typ else [],
        # Kommunen publicerar inga koordinater, och utan gatuadress kan
        # pipeline/geocode.py inte härleda någon heller.
        lat=None,
        lng=None,
    )


def normalize_inspections(rows: List[Row], establishment_id: str) -> list:
    """Översätt verksamhetens rader till kontroller, nyast först.

    En rad utan kontrolldatum ger ingen kontroll. Det gäller `EA`, som betyder
    att ingen kontroll utförts, och en enda rad där datumet läckt ut som ett
    kalkylbladstal (`45474`) — ett datum vi inte tänker räkna fram.
    """
    id_local = establishment_id.rsplit("-", 1)[-1]

    merged: dict = {}
    for row in rows:
        if row.orsak == NOT_INSPECTED or row.datum == NOT_INSPECTED:
            continue
        if not ISO_DATE.match(row.datum):
            raise UnknownSourceValue(
                f"Oläsbart kontrolldatum {row.datum!r} för {row.namn!r}"
            )
        when = date.fromisoformat(row.datum)
        assessment = assessment_of(row.avvikelser)
        candidate = (assessment, _reason_to_type(row.orsak), parse_areas(row.avvikelser))

        current = merged.get(when)
        if current is None or candidate[0] > current[0]:
            # Två rader samma dag är samma kontroll redovisad två gånger.
            # Sämsta utfallet vinner, samma regel som i Linköping.
            merged[when] = candidate

    return [
        NormalizedInspection(
            id_national=f"I-{MUNICIPALITY_CODE}-{id_local}-{when.isoformat()}",
            establishment_id=establishment_id,
            inspected_at=when,
            assessment=assessment,
            type=type_,
            # Kommunen redovisar varken förhandsbesked eller revision.
            prenotified=None,
            audit=False,
            on_site=True,
            areas=areas,
            uncertain=False,
        )
        for when, (assessment, type_, areas) in sorted(merged.items(), reverse=True)
    ]
