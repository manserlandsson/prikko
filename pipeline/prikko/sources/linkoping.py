"""Inläsare för Linköpings kommun.

Linköping har Sveriges enda öppna livsmedels-API — men det följer INTE
Sambruk/NSÖD-specen. Fälten är svenska och bedömningen är fritext i stället
för den numeriska skala specen föreskriver. Verifierat mot live-API 2026-08-02.

Det är därför varje källa får en egen adapter som översätter till Prikkos
kanoniska modell. Antagandet att "alla kommuner följer specen" håller inte,
och pipelinen får aldrig bygga på det.

API: https://livsmedelsdata.linkoping.se/swagger/index.html

    GET /api/v1/Anlaggningar?inkluderaInspektioner=true&inkluderaVerksamheter=true
        → HELA beståndet med FULL historik, i ett enda anrop

## Rättelse: hela beståndet ryms i ett anrop

Fram till 2026-08-25 stod här att listendpointen "alltid" returnerar tom
`tillsyner`, och hämtningen gjorde därför ett anrop per anläggning: 1 241
stycken med 0,25 sekunders paus, alltså över fem minuter.

Påståendet var sant men ofullständigt. Listan är tom när
`inkluderaInspektioner` UTELÄMNAS. Med flaggan kommer allt. Uppmätt
2026-08-25:

    ?Page=1&PageSize=1                        → totalCount 1245, 0 tillsyner
    ?inkluderaInspektioner=true&PageSize=2000 → 1 245 anläggningar,
                                                 9 288 tillsyner,
                                                53 111 kontrollområden
                                                16 764 849 byte, 4,0 sekunder

Fälten är identiska med dem detaljanropet gav. 1 241 anrop mot kommunens
server har alltså blivit ett. Det ger besökaren ingenting, och det är just
därför det är värt att göra: vi lever på att kommunerna fortsätter tycka om
oss.

`medsenastetillsyn` används inte längre.

## ArcGIS-lagren bär riskklass, som API:et saknar

Kommunens publika Livsmedelskollen är en ArcGIS Dashboard, och den vilar på
tre öppna Feature Services (ingen token, `access: public`). Två av dem bär
fält JSON-API:et inte har alls:

    Livsmedelkoll_anlaggningar   792 punkter   Fastighet, PostNr, PostOrt,
                                               Plats (stadsdel), Status
    LIVSMEDELKOLL_TILLSYNER    2 646 rader     R2024RiskklassBeslutad,
                                               ArendeNummer (diarienummer)

`AnlaggningId` där är exakt samma GUID som API:ets `anlaggningsId`, så
hopparningen är en nyckelslagning och inte en namnmatchning. Uppmätt mot
vårt eget bestånd 2026-08-25:

    riskklass          743 av 1 246 verksamheter
    fastighet m.m.     792 av 1 246 verksamheter
    diarienummer     2 492 av 9 131 kontroller

Lagren täcker bara riskklassmodellen från 2024 och framåt. De **ersätter
inte** API:et, de kompletterar det, och en verksamhet som saknas där ska
sakna riskklass, inte hoppas över.

En gratis kontroll följer med: punktlagrets `Adress` stämde med vår i 773
fall av 773 vid mätningen. Se `check_arcgis_address()`.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, replace
from datetime import date, datetime
from typing import Optional

from ..geo import SWEREF99_1500, looks_like_sweden, sweref99_to_wgs84
from ..grading import COMPLAINT, FOLLOWUP, MAJOR_REMARKS, MINOR_REMARKS, NO_REMARKS, ROUTINE

MUNICIPALITY_CODE = "0580"  # Linköping, SCB REGINA
MUNICIPALITY_NAME = "Linköpings kommun"
# Orten, i grundform. Får ALDRIG härledas ur kommunnamnet — "Linköpings
# kommun" minus " kommun" ger genitivformen "Linköpings".
MUNICIPALITY_CITY = "Linköping"

# Linköping projicerar i den lokala zonen, inte i rikszonen SWEREF 99 TM.
# Verifierat: Platensgatan 6A ger 58.41202, 15.62044 med SWEREF 99 15 00,
# men hamnar i Nordsjön med TM.
PROJECTION = SWEREF99_1500

# ---------------------------------------------------------------------------
# Värdeöversättning
#
# Samtliga förekommande värden är uträknade över hela beståndet (1 241
# anläggningar, 2026-08-02), inte gissade. Antal inom parentes.
# ---------------------------------------------------------------------------

# Linköpings egen läsanvisning (Livsmedelskollen) definierar utfallen:
#   Utan avvikelse  — inga avvikelser, verksamheten uppfyller kraven
#   Med avvikelse   — avvikelser som kräver en extra kontroll
#   Kvarstår        — tidigare avvikelser är inte åtgärdade vid uppföljning
ASSESSMENT_MAP = {
    "Utan Avvikelse": NO_REMARKS,      # 545 — uppfyller kraven
    "Åtgärdad": NO_REMARKS,            # 284 — tidigare avvikelse är avhjälpt
    "Godtagbar": NO_REMARKS,           #  75 — godtagbar, motsatsen till "Ej godtagbar"
    "Avvikelse": MINOR_REMARKS,        #  72 — avvikelse som kräver extra kontroll
    "Kvarstår": MAJOR_REMARKS,         #   4 — inte åtgärdad vid uppföljning
    "Ej godtagbar": MAJOR_REMARKS,     #   3 — underkänd
}

# Inga tolkningar är längre osäkra. "Godtagbar" lästes tidigare som en mindre
# anmärkning; den läsningen var fel. Värdet är motsatsen till "Ej godtagbar"
# och betyder att verksamheten är godtagbar.
UNCERTAIN_ASSESSMENTS: set = set()

TYPE_MAP = {
    "Planerad": ROUTINE,                        # 653
    "Uppföljande": FOLLOWUP,                    # 304
    "Uppföljande tidigare avvikelse": FOLLOWUP,  #   6
    "Händelsestyrd": COMPLAINT,                 #  20
}

ASSESSMENT_FIELD = "helhetsbedomning av tillsynen"  # ja, med mellanslag

# ---------------------------------------------------------------------------
# ArcGIS-lagren. Se modulens inledning.
# ---------------------------------------------------------------------------

API_BASE = "https://livsmedelsdata.linkoping.se/api/v1"

#: Hela beståndet med full historik. Se rättelsen i modulens inledning.
LIST_URL = (
    f"{API_BASE}/Anlaggningar"
    "?inkluderaInspektioner=true&inkluderaVerksamheter=true"
)

ARCGIS_BASE = "https://kartor.linkoping.se/arcgis/rest/services/ecos"
ARCGIS_FACILITIES = f"{ARCGIS_BASE}/Livsmedelkoll_anlaggningar/FeatureServer/0"
ARCGIS_INSPECTIONS = f"{ARCGIS_BASE}/LIVSMEDELKOLL_TILLSYNER/FeatureServer/0"

#: Serverns eget tak per svar. Tabellen med tillsyner har 2 646 rader och
#: kräver därför två anrop; punktlagret ryms i ett.
ARCGIS_PAGE = 2000

#: Riskklassen, i kommunens fyra serier. Uträknade värden över hela tabellen
#: 2026-08-25: HK1, HK3, KM1, KM2, SL1–SL7, TL1–TL4. HK2 förekommer inte i
#: dag men hör till serien och godtas.
#:
#: Bokstäverna är Livsmedelsverkets: HK = huvudkontor, SL = sista led,
#: TL = tidigare led, KM = kött och mjölk. Siffran är den beslutade
#: riskklassen, där ett är den högsta kontrollfrekvensen.
#:
#: Mönstret är en spärr och inte en städning. Ett värde utanför serierna
#: betyder att kommunen bytt kodverk, och då ska vi få veta det i stället för
#: att publicera en klass vi inte vet vad den betyder.
RISK_CLASS = re.compile(r"^(HK[1-3]|SL[1-7]|TL[1-4]|KM[1-2])$")


class UnknownSourceValue(Exception):
    """Källan har levererat ett värde vi inte känner igen.

    Detta får ALDRIG hanteras genom att gissa eller falla tillbaka på ett
    default. Vi publicerar omdömen om namngivna verksamheter; ett okänt värde
    som tyst tolkas som "inga anmärkningar" är precis den sortens fel som
    förstör förtroendet. Anläggningen hoppas över och felet larmas.
    """


# Utfall per kontrollområde. Fyra distinkta lägen — "Åtgärdad" och "Kvarstår"
# är egen information och får inte plattas ihop med godkänt respektive brist.
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

#: Områden som räknas som brist i Brister/Godkänt-uppdelningen.
AREA_IS_REMARK = {AREA_DEVIATION, AREA_PERSISTING}


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
class NormalizedInspection:
    id_national: str
    establishment_id: str
    inspected_at: date
    assessment: int
    type: int
    prenotified: Optional[bool]
    #: Revision enligt kommunens fält, inte en ordinarie kontroll.
    audit: bool
    #: Om kontrollen innefattade platsbesök.
    on_site: bool
    areas: list
    uncertain: bool
    #: Kommunens diarienummer, t.ex. "MK-2026-2285". Kommer ur ArcGIS-lagret
    #: och inte ur JSON-API:et. Se `with_case_numbers()`.
    case_number: Optional[str] = None


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
    #: Beslutad riskklass enligt 2024 års modell, t.ex. "SL4". Ur
    #: ArcGIS-lagret; API:et saknar fältet helt. Se `RISK_CLASS`.
    risk_class: Optional[str] = None
    #: Postnummer, fastighetsbeteckning och stadsdel ur ArcGIS-punktlagret.
    #: Stannar i pipelinen, se modulens inledning.
    postal_code: Optional[str] = None
    property_designation: Optional[str] = None
    district: Optional[str] = None


def _parse_date(value: str) -> date:
    """Plocka ut kalenderdatumet ur källans tidsstämpel.

    Vi parsar avsiktligt bara de tio första tecknen i stället för att tolka
    hela ISO-strängen. Källan levererar bland annat "2023-12-20T10:45:27.07",
    där två decimaler i sekunden får Pythons ISO-parser att kasta undantag.
    Klockslaget saknar ändå betydelse för oss — en kontroll hör till ett
    datum, inte till en sekund.
    """
    return date.fromisoformat(value[:10])


def normalize_establishment(raw: dict) -> NormalizedEstablishment:
    """Översätt ett anläggningsobjekt till Prikkos modell."""
    id_local = raw["anlaggningsId"]

    lat = lng = None
    north, east = raw.get("geoPositionNorr"), raw.get("geoPositionOst")
    if north and east:
        lat, lng = sweref99_to_wgs84(north, east, PROJECTION)
        if not looks_like_sweden(lat, lng):
            # Hellre ingen position än fel position — en karta som ljuger är
            # värre än ingen karta.
            lat = lng = None

    types = raw.get("verksamhet") or []
    if raw.get("allaInriktningar"):
        types = types + [raw["allaInriktningar"]]

    return NormalizedEstablishment(
        id_national=f"F-{MUNICIPALITY_CODE}-{id_local}",
        municipality_code=MUNICIPALITY_CODE,
        id_local=id_local,
        name=(raw.get("objektsnamn") or "").strip(),
        street_address=(raw.get("adress") or "").strip() or None,
        types=types,
        lat=lat,
        lng=lng,
    )


def normalize_inspection(raw: dict, establishment_id: str) -> Optional[NormalizedInspection]:
    """Översätt en tillsyn. Returnerar None när kontroll saknas.

    258 av Linköpings 1 241 anläggningar saknar helt kontrolltillfälle — de
    ska sluta som "otillräckligt underlag", inte som ett dåligt betyg.
    """
    assessment_raw = raw.get(ASSESSMENT_FIELD)
    if assessment_raw is None or not raw.get("tillsynsDatumTid"):
        return None

    if assessment_raw not in ASSESSMENT_MAP:
        raise UnknownSourceValue(
            f"Okänd helhetsbedömning {assessment_raw!r} för {establishment_id}"
        )

    reason_raw = raw.get("orsak")
    if reason_raw is not None and reason_raw not in TYPE_MAP:
        raise UnknownSourceValue(
            f"Okänd orsak {reason_raw!r} för {establishment_id}"
        )

    prenotified = None
    if raw.get("anmald") in ("Föranmäld", "Anmäld"):
        prenotified = True
    elif raw.get("anmald") == "Oanmäld":
        prenotified = False

    areas = []
    for area in raw.get("kontrollomraden") or []:
        outcome = area.get("anmarkning")
        if not outcome:
            # Området finns med men saknar utfall. Att gissa "godkänt" vore
            # fel — ett okontrollerat område är inte ett godkänt område.
            continue
        status = AREA_STATUS_MAP.get(outcome)
        if status is None:
            raise UnknownSourceValue(
                f"Okänt områdesutfall {outcome!r} för {establishment_id}"
            )
        areas.append(
            ControlArea(
                code=(area.get("nr") or "").strip(),
                group=(area.get("Kontrollomrade") or "").strip(),
                description=(area.get("beskrivning") or "").strip(),
                status=status,
            )
        )

    return NormalizedInspection(
        # Scopat till anläggningen: Linköping kopplar samma tillsynsId till
        # flera anläggningar (olika lokaler, samma kontrolltillfälle), så id:t
        # måste innehålla båda för att vara unikt.
        id_national=f"I-{MUNICIPALITY_CODE}-{raw.get('anlaggningsId', '')}-{raw['tillsynsId']}",
        establishment_id=establishment_id,
        inspected_at=_parse_date(raw["tillsynsDatumTid"]),
        assessment=ASSESSMENT_MAP[assessment_raw],
        type=TYPE_MAP.get(reason_raw, ROUTINE),
        prenotified=prenotified,
        audit=raw.get("revision") == "Ja",
        on_site=raw.get("platsbesok") != "Nej",
        areas=areas,
        uncertain=assessment_raw in UNCERTAIN_ASSESSMENTS,
    )


def merge_duplicate_inspections(inspections: list) -> list:
    """Slå ihop kontroller som delar id_national.

    Linköpings API returnerar samma `tillsynsId` två gånger för en del
    anläggningar: 148 av 9 249 kontroller i hämtningen 2026-08-03. Posterna
    har samma datum och samma helhetsbedömning men olika `orsak` och olika
    kontrollområden. Det ser ut som att kommunen registrerar en planerad och
    en uppföljande del av samma besök under ett och samma ärendenummer.

    Utan sammanslagning skickas två rader med samma primärnyckel till
    databasen, och Postgres vägrar:

        21000: ON CONFLICT DO UPDATE command cannot affect row a second time

    Felet är intermittent. Hamnar raderna i olika portioner går det igenom,
    vilket det gjorde i veckor innan den nattliga körningen föll 2026-08-03.

    Sammanslagningen:
      * sämsta bedömningen vinner, så en avvikelse aldrig kan försvinna
      * FOLLOWUP vinner över ROUTINE, eftersom det är uppföljningen
        `grading.py` läser kvarstående brister ur
      * kontrollområdena förenas, eftersom de två posterna beskriver olika
        delar av samma besök och båda är sanna
    """
    merged: dict = {}
    for inspection in inspections:
        existing = merged.get(inspection.id_national)
        if existing is None:
            merged[inspection.id_national] = inspection
            continue

        seen = {(a.code, a.description, a.status) for a in existing.areas}
        areas = existing.areas + [
            a for a in inspection.areas
            if (a.code, a.description, a.status) not in seen
        ]

        merged[inspection.id_national] = replace(
            existing,
            assessment=max(existing.assessment, inspection.assessment),
            type=FOLLOWUP if FOLLOWUP in (existing.type, inspection.type) else existing.type,
            areas=areas,
            uncertain=existing.uncertain or inspection.uncertain,
        )

    return list(merged.values())


def arcgis_query_url(service: str, offset: int = 0) -> str:
    """Ett sidhämtande anrop mot ett av ArcGIS-lagren.

    `outSR=4326` begär WGS84. Här, till skillnad från i karlstad.py och
    oskarshamn.py, är det rätt val: vi läser ingen geometri ur lagret alls
    (koordinaterna kommer ur JSON-API:et som förut), så det finns ingen
    avrundning att bli lurad av. `returnGeometry=false` säger det uttryckligen.
    """
    return (
        f"{service}/query?where=1%3D1&outFields=*&returnGeometry=false"
        f"&resultOffset={offset}&resultRecordCount={ARCGIS_PAGE}&f=json"
    )


def _attributes(payload: dict) -> list:
    return [f.get("attributes") or {} for f in payload.get("features") or []]


def parse_arcgis_facilities(payloads: list) -> dict:
    """Bygg AnlaggningId → fastighet, postnummer, postort, stadsdel, adress.

    Nyckeln är GUID:et, alltså samma identitet som API:et använder. Ingen
    namnmatchning behövs, och därför finns ingen tvetydighet att hantera —
    till skillnad från Karlstad, där hopparningen sker på skylten.
    """
    out: dict = {}
    for payload in payloads:
        for row in _attributes(payload):
            key = (row.get("AnlaggningId") or "").strip().upper()
            if not key:
                continue
            out[key] = {
                "property_designation": (row.get("Fastighet") or "").strip() or None,
                "postal_code": (row.get("PostNr") or "").strip() or None,
                "postal_town": (row.get("PostOrt") or "").strip() or None,
                "district": (row.get("Plats") or "").strip() or None,
                "address": (row.get("Adress") or "").strip() or None,
            }
    return out


def parse_arcgis_inspections(payloads: list) -> tuple:
    """Bygg riskklasser per anläggning och diarienummer per kontroll.

    Returnerar `(riskklasser, diarienummer)`, där riskklasserna slås upp på
    `AnlaggningId` och diarienumren på `(AnlaggningId, TillsynsId)` — samma
    par som vårt `id_national` för en kontroll byggs av.

    Två spärrar:

    * En riskklass utanför `RISK_CLASS` kastar. Se konstanten.
    * Två OLIKA riskklasser för samma anläggning kastar. Tabellen har en rad
      per kontroll, så klassen upprepas många gånger per anläggning, och
      motsägelser var noll av 546 anläggningar vid mätningen. Skulle de
      börja förekomma vet vi inte vilken som gäller, och då är rätt svar att
      stanna.
    """
    risk_classes: dict = {}
    case_numbers: dict = {}

    for payload in payloads:
        for row in _attributes(payload):
            facility = (row.get("AnlaggningId") or "").strip().upper()
            if not facility:
                continue

            risk = (row.get("R2024RiskklassBeslutad") or "").strip()
            if risk:
                if not RISK_CLASS.match(risk):
                    raise UnknownSourceValue(
                        f"Okänd riskklass {risk!r} för {facility}"
                    )
                previous = risk_classes.get(facility)
                if previous is not None and previous != risk:
                    raise UnknownSourceValue(
                        f"Två riskklasser för {facility}: {previous!r} och {risk!r}"
                    )
                risk_classes[facility] = risk

            inspection = (row.get("TillsynsId") or "").strip().upper()
            case = (row.get("ArendeNummer") or "").strip()
            if inspection and case:
                case_numbers[(facility, inspection)] = case

    return risk_classes, case_numbers


def check_arcgis_address(
    establishment: NormalizedEstablishment, facilities: dict
) -> None:
    """Stäm av API:ets adress mot ArcGIS-lagrets.

    De två källorna är oberoende uttag ur samma ärendesystem, och de stämde i
    773 fall av 773 vid mätningen 2026-08-25. Kontrollen är alltså gratis
    facit på att vi parat ihop rätt anläggning: ett GUID som pekar på en
    annan adress betyder att någon av källorna bytt betydelse, och då ska vi
    få veta det innan riskklassen publiceras på fel verksamhet.

    Bara olikhet larmar. Att ArcGIS saknar en adress vi har, eller tvärtom,
    är väntat och betyder ingenting.
    """
    row = facilities.get(establishment.id_local.upper())
    if not row:
        return
    theirs, ours = row.get("address"), establishment.street_address
    if not theirs or not ours:
        return
    if " ".join(theirs.split()).casefold() != " ".join(ours.split()).casefold():
        raise UnknownSourceValue(
            f"ArcGIS säger {theirs!r} men API:et {ours!r} för "
            f"{establishment.id_national}"
        )


def enrich(
    establishment: NormalizedEstablishment,
    facilities: dict,
    risk_classes: dict,
) -> NormalizedEstablishment:
    """Lägg ArcGIS-uppgifterna på en anläggning.

    En anläggning som saknas i lagren lämnas orörd. Lagren täcker 792 av
    1 246 verksamheter, och de övriga 454 ska sakna riskklass — inte hoppas
    över, och inte få en gissad.
    """
    key = establishment.id_local.upper()
    row = facilities.get(key) or {}
    risk = risk_classes.get(key)
    if not row and not risk:
        return establishment

    return replace(
        establishment,
        risk_class=risk,
        postal_code=row.get("postal_code"),
        property_designation=row.get("property_designation"),
        district=row.get("district"),
    )


def with_case_numbers(inspections: list, case_numbers: dict) -> list:
    """Sätt diarienumret på de kontroller ArcGIS känner igen.

    Nyckeln är `(anläggning, tillsyn)`. 2 492 av våra 9 131 kontroller fick
    ett nummer vid mätningen; resten är äldre än riskklassmodellen 2024 och
    finns inte i tabellen.
    """
    out = []
    for inspection in inspections:
        # id_national är "I-0580-<anläggning>-<tillsyn>", båda GUID.
        rest = inspection.id_national[len(f"I-{MUNICIPALITY_CODE}-"):]
        key = (rest[:36].upper(), rest[37:].upper())
        case = case_numbers.get(key)
        out.append(replace(inspection, case_number=case) if case else inspection)
    return out
