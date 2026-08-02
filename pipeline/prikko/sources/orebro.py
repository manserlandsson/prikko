"""Inläsare för Örebro kommun.

Sjätte källan, sjätte formatet — men den mest detaljerade efter Linköping.
Örebro kräver tre steg, alla verifierade genom anrop 2026-08-02:

    1) GET /rest-api/foodreport/search
         → [{Registrerades, Objektsnamn, Typ, AnlaggningId, Adress}]  1 234 st

    2) GET …/resultat-fran-livsmedelskontroller---verksamhet.html?facility=<id>
         → HTML där historiken ligger inbäddad som
           `const INSPECTIONS = [{id, reason, date, recent}]`

    3) GET /rest-api/foodreport/reports/<inspectionId>
         → [{Nr, Beskrivning, Kontrollomrade, Anmarkning,
             TillsynsDatum, "Anmald-oanmald"}]

**Steg 3 är inte gissad.** Sökvägen står i kommunens egen
`food-report-page.js`. Det spelar roll, för sökvägen
`/rest-api/foodreport/inspection/<id>` finns OCKSÅ, svarar HTTP 200 och
returnerar alltid en tom lista. Den ser ut att fungera och gör det inte —
52 kontroller testades mot den utan att ge något innan felet upptäcktes. Ett
gränssnitt som svarar 200 med tom kropp är farligare än ett som felar.

Varför källan är värd de dyra anropen: Örebro redovisar **både godkända och
brustna kontrollpunkter**, med Livsmedelsverkets rapporteringspunkt (J03,
A01) och kontrollområde. Stockholm listar bara avvikelser. Här går det
alltså att visa vad som faktiskt granskats, inte bara vad som brast.

Örebro saknar däremot ett helhetsomdöme per kontroll. Bedömningen härleds ur
punkterna — se `assessment_from_areas()`.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Optional

from ..grading import COMPLAINT, FOLLOWUP, MAJOR_REMARKS, MINOR_REMARKS, NO_REMARKS, ROUTINE

MUNICIPALITY_CODE = "1880"  # Örebro, SCB REGINA
MUNICIPALITY_NAME = "Örebro kommun"
MUNICIPALITY_CITY = "Örebro"

ORIGIN = "https://www.orebro.se"
SEARCH_URL = f"{ORIGIN}/rest-api/foodreport/search"
FACILITY_URL = (
    f"{ORIGIN}/foretag--naringsliv/driva-foretag/livsmedelsverksamhet"
    "/resultat-fran-livsmedelskontroller"
    "/resultat-fran-livsmedelskontroller---verksamhet.html"
)
REPORTS_URL = f"{ORIGIN}/rest-api/foodreport/reports"
SOURCE_URL = (
    f"{ORIGIN}/foretag--naringsliv/driva-foretag/livsmedelsverksamhet"
    "/resultat-fran-livsmedelskontroller.html"
)

#: Historiken som kommunens sida bäddar in i en `<script>`-tagg.
INSPECTION_ROW = re.compile(
    r"id:\s*'([0-9a-fA-F-]{36})'\s*,\s*"
    r"reason:\s*'([^']*)'\s*,\s*"
    r"date:\s*'(\d{4}-\d{2}-\d{2})'\s*,\s*"
    r"recent:\s*(true|false)"
)

#: Kontroller nyare än så här döljs av kommunen med texten "Handläggning
#: pågår". Fördröjningen finns för att verksamheten ska hinna få rapporten
#: och yttra sig innan resultatet publiceras. Vi måste hålla samma spärr —
#: att publicera tidigare vore att kringgå verksamhetens svarsrätt, vilket är
#: precis den sortens genväg som gör en sådan här sajt oförsvarbar.
#:
#: Talet är kommunens eget, hämtat ur food-report-page.js.
EMBARGO_DAYS = 30

#: Anledning till kontroll → vår typ. Kommunen slår ihop flera skäl till en
#: sträng ("Uppföljning, planerad kontroll"), så nyckelord med rangordning i
#: stället för en tabell: en kontroll som bland annat är uppföljande ÄR en
#: uppföljning, och det är uppföljningen modellen läser allvarsgrad ur.
REASON_KEYWORDS = (
    ("uppföljning", FOLLOWUP),
    ("uppföljande", FOLLOWUP),
    ("händelsestyrd", COMPLAINT),
    ("planerad", ROUTINE),
)

# Utfall per kontrollområde. Samma fyra lägen och samma ordval som Linköping —
# "Åtgärdad" och "Kvarstår" är egen information och får inte plattas ihop med
# godkänt respektive brist.
AREA_OK = "ok"
AREA_FIXED = "fixed"
AREA_DEVIATION = "deviation"
AREA_PERSISTING = "persisting"

AREA_STATUS_MAP = {
    "Utan avvikelse": AREA_OK,
    "Åtgärdad": AREA_FIXED,
    "Avskriven": AREA_FIXED,      # avvikelsen är avskriven, alltså inte längre öppen
    "Avvikelse": AREA_DEVIATION,
    "Kvarstår": AREA_PERSISTING,
}


class UnknownSourceValue(Exception):
    """Källan levererade ett värde vi inte känner igen.

    Får aldrig hanteras med ett default. Vi publicerar omdömen om namngivna
    verksamheter; ett okänt värde som tyst tolkas som godkänt är precis den
    sortens fel som förstör förtroendet.
    """


@dataclass(frozen=True)
class ControlArea:
    """Ett granskat kontrollområde inom en kontroll.

    `code` är Livsmedelsverkets rapporteringspunkt (t.ex. "J03"), där
    bokstaven anger lagstiftningsområde — J = hygien, K = HACCP och så vidare.
    """

    code: str
    group: str
    description: str
    status: str


@dataclass(frozen=True)
class RawInspection:
    """En rad ur den inbäddade historiken, innan punkterna hämtats."""

    id: str
    reason: str
    inspected_at: date
    recent: bool


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


def facility_url(facility_id: str) -> str:
    return f"{FACILITY_URL}?facility={facility_id}"


def reports_url(inspection_id: str) -> str:
    return f"{REPORTS_URL}/{inspection_id}"


def merge_duplicates(facilities: list) -> list:
    """Slå ihop verksamheter som delar AnlaggningId.

    Källan listar samma verksamhet en gång per registrerad typ. "Tant
    Gredelin" på Kungsgatan 48A förekommer två gånger med identiskt id —
    en gång som Café, en gång som Butik.

    Utan sammanslagning blir det två sidor för samma ställe, och eftersom
    inläsningen skriver på id skulle den ena tyst skriva över den andra.
    Typerna förenas i stället, vilket är sannare: verksamheten ÄR både café
    och butik.
    """
    merged: dict = {}
    for raw in facilities:
        key = (raw.get("AnlaggningId") or "").strip()
        existing = merged.get(key)
        if existing is None:
            merged[key] = dict(raw, _types=[t for t in [(raw.get("Typ") or "").strip()] if t])
            continue
        kind = (raw.get("Typ") or "").strip()
        if kind and kind not in existing["_types"]:
            existing["_types"].append(kind)
    return list(merged.values())


def normalize_establishment(raw: dict) -> NormalizedEstablishment:
    id_local = (raw.get("AnlaggningId") or "").strip()
    if not id_local:
        raise UnknownSourceValue("Verksamhet utan AnlaggningId")

    # `_types` sätts av merge_duplicates(); enskilda poster har bara `Typ`.
    types = []
    for value in raw.get("_types") or [raw.get("Typ")]:
        value = (value or "").strip()
        if value and value not in types:
            types.append(value)

    return NormalizedEstablishment(
        id_national=f"F-{MUNICIPALITY_CODE}-{id_local}",
        municipality_code=MUNICIPALITY_CODE,
        id_local=id_local,
        name=(raw.get("Objektsnamn") or "").strip(),
        street_address=(raw.get("Adress") or "").strip() or None,
        types=types,
        # Kommunen publicerar inga koordinater. None är sanningen här, inte
        # en lucka vi glömt fylla.
        lat=None,
        lng=None,
    )


def parse_history(html: str) -> list:
    """Plocka ut den inbäddade `const INSPECTIONS`-listan ur sidan.

    Historiken renderas inte som HTML utan som ett JavaScript-uttryck, så
    den måste läsas ur skripttaggen. Regexen kräver alla fyra fälten i
    ordning; ändrar kommunen formatet får vi noll träffar i stället för
    halva historiken, vilket syns i statistiken.
    """
    out = []
    for identifier, reason, when, recent in INSPECTION_ROW.findall(html):
        out.append(
            RawInspection(
                id=identifier,
                reason=reason.strip(),
                inspected_at=date.fromisoformat(when),
                recent=recent == "true",
            )
        )
    return out


def _reason_to_type(reason: str) -> int:
    lowered = reason.casefold()
    for keyword, value in REASON_KEYWORDS:
        if keyword in lowered:
            return value
    raise UnknownSourceValue(f"Okänd kontrollorsak {reason!r}")


def under_embargo(inspection: RawInspection, today: date) -> bool:
    """Är resultatet ännu inte publicerat?

    Två villkor, båda kommunens egna: serverns `recent`-flagga, och en
    kontroll av att datumet ligger mer än 30 dagar bakåt. Sidan tillämpar
    båda, så vi gör det också.
    """
    return inspection.recent or inspection.inspected_at > today - timedelta(days=EMBARGO_DAYS)


def normalize_areas(reports: list, establishment_id: str) -> list:
    areas = []
    for row in reports:
        remark = (row.get("Anmarkning") or "").strip()
        if remark not in AREA_STATUS_MAP:
            raise UnknownSourceValue(
                f"Okänd anmärkning {remark!r} för {establishment_id}"
            )
        areas.append(
            ControlArea(
                code=(row.get("Nr") or "").strip(),
                group=(row.get("Kontrollomrade") or "").strip(),
                description=(row.get("Beskrivning") or "").strip(),
                status=AREA_STATUS_MAP[remark],
            )
        )
    return areas


def assessment_from_areas(areas: list) -> int:
    """Härled kontrollens helhetsomdöme ur punkterna.

    Örebro publicerar inget helhetsomdöme per kontroll, till skillnad från
    Linköping. Det måste därför räknas fram, och rangordningen är densamma
    som Linköpings egen:

        Kvarstår  → allvarlig brist (tidigare avvikelse inte åtgärdad)
        Avvikelse → brist
        övrigt    → inga anmärkningar

    Att "Åtgärdad" och "Avskriven" landar i inga anmärkningar är avsiktligt:
    de beskriver en avvikelse som ÄR ur världen. Att räkna dem som brist vore
    att straffa en verksamhet för att den rättat till något.
    """
    statuses = {a.status for a in areas}
    if AREA_PERSISTING in statuses:
        return MAJOR_REMARKS
    if AREA_DEVIATION in statuses:
        return MINOR_REMARKS
    return NO_REMARKS


def normalize_inspection(
    raw: RawInspection, reports: list, establishment_id: str
) -> Optional[NormalizedInspection]:
    """Bygg en kontroll av historikraden plus dess punkter.

    Returnerar None när kontrollen saknar publicerade punkter. Utan punkter
    finns inget utfall att redovisa, och att anta "inga anmärkningar" vore
    att hitta på ett godkännande kommunen inte gett.
    """
    if not reports:
        return None

    areas = normalize_areas(reports, establishment_id)
    prenotified = None
    announced = (reports[0].get("Anmald-oanmald") or "").strip().casefold()
    if announced == "oanmäld":
        prenotified = False
    elif announced == "föranmäld":
        prenotified = True

    return NormalizedInspection(
        id_national=f"I-{MUNICIPALITY_CODE}-{raw.id}",
        establishment_id=establishment_id,
        inspected_at=raw.inspected_at,
        assessment=assessment_from_areas(areas),
        type=_reason_to_type(raw.reason),
        prenotified=prenotified,
        audit=False,
        on_site=True,
        areas=areas,
        uncertain=False,
    )
