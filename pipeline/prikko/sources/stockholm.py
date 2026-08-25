"""Inläsare för Stockholms stad.

Stockholm publicerar ingen öppen datamängd, men driver e-tjänsten
Livsmedelskollen som hämtar sitt innehåll från ett JSON-gränssnitt. Vi anropar
samma gränssnitt som deras egen karta gör — inga inloggningar kringgås, ingen
skyddad resurs berörs, och uppgifterna är allmänna handlingar som staden
själv publicerar öppet.

    POST /Livsmedelsinspektioner/Livsmedelsinspektioner/SearchFacilitiesMap

Kroppen är sökkontraktet från stadens egen kartkod. Tomt namn plus alla
filterflaggor false betyder "allt".

VIKTIGT: svaret är taggat vid **1 500 poster**. Stockholm har fler
verksamheter än så, alltså måste beståndet hämtas i geografiska rutor.
Kontraktet stödjer punkt plus radie, vilket vi använder som rutnät.

Format skiljer sig helt från både Sambruk-specen och Linköping — tredje
källan, tredje formatet. Det är den bekräftade verkligheten: varje kommun
kräver en egen adapter.

## FÄLT I SVARET SOM VI MEDVETET INTE BÄR MED

Svaret har fyra fält till som handlar om anmälningar:

    PoisoningLink   färdig URL till /matforgiftning/sallskap
    Poisoning       "Rapportera misstänkt matförgiftning"
    ComplainLink    färdig URL till /brister/brister
    Complain        "Lämna klagomål"

Länkarna ser ut att vara gratis att skriva av. DE ÄR TRASIGA FÖR DE 113 RADER
SOM SAKNAR ADRESS. Båda formulären kräver att id, namn och adress alla är
icke-tomma; är adressen tom släpper deras parameterbindning hela blocket, så
att även namnet försvinner. Sidan svarar ändå 200 och laddar oifylld, alltså
en tyst förlust. Stadens egen karta bygger `address=` tomt i de fallen och
länkar därmed fel till sig själv. Kontrollerat 2026-08-25 på M/s Ballerina,
id 00b1cf0a-aa70-4533-bbe0-2e19cb88a9a7, och på Linje 80, SL,
Rederiaktiebolaget Ballerina.

Länkarna byggs därför på sajten, av id, namn och adress som redan står i
raden, med ett mellanslag där adressen saknas. Se
site/src/components/Anmal.astro. Att lägga två färdiga URL:er per rad hade
dessutom vuxit stockholm.json med ett par megabyte för något som är härlett.

Tre fält till läses inte, och skälen är andra:

    ReviewLabel   "Utan avvikelser". Vi mappar Judgement själva.
    SummaryText   full mening; vi läser den bara för äldre kontroller, se
                  `normalize_inspections`.
    ReadMore      innehåller "Diarie-/ärendenummer: <x>". MÄTT: 613 poster i
                  innerstan, 613 av 613 hade TOMT diarienummer. Värdelöst.

## UPPGIFTER SOM INTE FINNS I DET HÄR SVARET ALLS

Organisationsnummer, postnummer, juridisk person, registreringsdatum och hela
riskklassningen ligger i stadens registreringsintyg, ett GET per anläggning
med samma guid som nyckel. Se prikko/stockholmsintyg.py. Intyget svarar också
Aktiv eller Inaktiv, alltså vet kommunen själv vilka rader som upphört.
"""

from __future__ import annotations

import re

from dataclasses import dataclass
from datetime import date
from typing import Optional

from ..geo import SWEREF99_1800, looks_like_sweden, sweref99_to_wgs84
from ..grading import COMPLAINT, FOLLOWUP, MAJOR_REMARKS, MINOR_REMARKS, NO_REMARKS, ROUTINE

MUNICIPALITY_CODE = "0180"  # Stockholm, SCB REGINA
MUNICIPALITY_NAME = "Stockholms stad"
MUNICIPALITY_CITY = "Stockholm"

ENDPOINT = (
    "https://etjanster.stockholm.se/Livsmedelsinspektioner"
    "/Livsmedelsinspektioner/SearchFacilitiesMap"
)
REFERER = "https://etjanster.stockholm.se/livsmedelsinspektioner/"

# Stockholm projicerar i den lokala zonen 18 00, inte i rikszonen TM.
PROJECTION = SWEREF99_1800

#: Stadens egen kartutbredning, ur sidans konfiguration (stockholmExtent).
#: [minEast, minNorth, maxEast, maxNorth] i SWEREF 99 18 00.
EXTENT = (136231, 6567833, 161641, 6591944)

#: Serverns takgräns per svar. Överskrids den saknas poster tyst.
RESULT_CAP = 1500

# ---------------------------------------------------------------------------
# Värdeöversättning
#
# `Judgement` är stadens egen numeriska bedömning. Etiketterna kommer ur
# fältet ReviewLabel i samma svar.
# ---------------------------------------------------------------------------

JUDGEMENT_MAP = {
    0: NO_REMARKS,      # "Utan avvikelser"
    1: MINOR_REMARKS,   # "Med avvikelser"
    2: MAJOR_REMARKS,   # återbesök krävs — stadens tredje nivå
    3: MAJOR_REMARKS,
}

#: Verksamheten är registrerad men ännu inte kontrollerad. Ger ingen bedömning.
JUDGEMENT_NOT_INSPECTED = 4

#: Anledning till kontroll → vår typ. Samtliga värden är uträknade över hela
#: beståndet (5 402 inspektioner, 2026-08-02), inte gissade. Antal inom parentes.
REASON_MAP = {
    "Ordinarie kontroll": ROUTINE,        # 3 905
    "Uppföljande kontroll": FOLLOWUP,     # 1 091
    "Händelsestyrd kontroll": COMPLAINT,  #   231
    "Annan anledning": ROUTINE,           #   175 — ospecificerad, räknas som ordinarie
    "": ROUTINE,
}

#: Sammanfattningstexter som förekommer. "Omdöme saknas" ger ingen bedömning.
SUMMARY_CLEAN = "inga avvikelser"
SUMMARY_DEVIATION = "konstaterades avvikelser"
SUMMARY_MISSING = "omdöme saknas"


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


def search_body(
    east: Optional[float] = None,
    north: Optional[float] = None,
    radius: Optional[float] = None,
) -> dict:
    """Sökkontraktet, exakt som stadens egen kartkod bygger det."""
    return {
        "FoodPlaceName": None,
        "FoodPlaceAddress": None,
        "FoodPlaceOrgNr": None,
        # Alla tre false betyder ofiltrerat i stadens egen logik.
        "NoDeficiency": False,
        "MinorDeficiency": False,
        "Revisit": False,
        "FacilityTypeGroups": [],
        "EastCoordinate": east,
        "NorthCoordinate": north,
        "MaxDistanceAllowedFromPoint": radius,
        "Ids": None,
    }



_TYPE_PREFIX = re.compile(r"^\d+\.\s*")


def _clean_type(value: str) -> str:
    """Stockholms verksamhetstyper bär ett sorteringsnummer: "1. Restaurang".

    Numret är kommunens interna ordning i deras egen lista, inte en del av
    namnet, och det syns rakt igenom till besökaren på verksamhetssidan
    ("1. Restaurang - Kammakargatan 22"). Ingen annan av de tolv kommunerna
    har prefixet, så det bryter dessutom kategoriseringen mellan kommuner.
    """
    return _TYPE_PREFIX.sub("", value.strip()).strip()


def normalize_establishment(raw: dict) -> NormalizedEstablishment:
    id_local = raw["Id"]

    lat = lng = None
    east = raw.get("SweRefCoordinateEasting")
    north = raw.get("SweRefCoordinateNorthing")
    if east and north:
        lat, lng = sweref99_to_wgs84(north, east, PROJECTION)
        if not looks_like_sweden(lat, lng):
            # Hellre ingen position än en position som ljuger.
            lat = lng = None

    types = [_clean_type(t) for t in (raw.get("Business") or "").split(",")]
    other = (raw.get("AllOtherBusinessTypes") or "").strip()
    if other:
        types += [_clean_type(t) for t in other.split(",")]
    types = [t for t in types if t]

    return NormalizedEstablishment(
        id_national=f"F-{MUNICIPALITY_CODE}-{id_local}",
        municipality_code=MUNICIPALITY_CODE,
        id_local=id_local,
        name=(raw.get("Name") or "").strip(),
        street_address=(raw.get("Address") or "").strip() or None,
        types=types,
        lat=lat,
        lng=lng,
    )


def normalize_inspections(raw: dict, establishment_id: str) -> list:
    """Översätt hela inspektionslistan för en verksamhet.

    Stockholm levererar historiken inline, till skillnad från Linköping där
    den kräver ett anrop per anläggning.
    """
    judgement = raw.get("Judgement")
    if judgement == JUDGEMENT_NOT_INSPECTED:
        return []
    if judgement is not None and judgement not in JUDGEMENT_MAP:
        raise UnknownSourceValue(
            f"Okänd Judgement {judgement!r} för {establishment_id}"
        )

    out = []
    for index, item in enumerate(raw.get("InspectionList") or []):
        when = item.get("InspectionDate")
        if not when:
            continue

        reason = (item.get("ReasonText") or "").strip()
        if reason and reason not in REASON_MAP:
            raise UnknownSourceValue(
                f"Okänd ReasonText {reason!r} för {establishment_id}"
            )

        # Stadens Judgement gäller den SENASTE kontrollen. För äldre poster
        # härleds utfallet ur sammanfattningstexten, som är stadens egen.
        summary = (item.get("SummaryText") or "").lower()
        if SUMMARY_MISSING in summary:
            # Staden har själv inget omdöme. Då har inte vi det heller.
            continue
        if index == 0 and judgement in JUDGEMENT_MAP:
            assessment = JUDGEMENT_MAP[judgement]
        elif SUMMARY_CLEAN in summary:
            assessment = NO_REMARKS
        elif SUMMARY_DEVIATION in summary:
            assessment = MINOR_REMARKS
        else:
            # Text vi inte känner igen: hoppa över posten hellre än att gissa.
            continue

        type_text = (item.get("TypeText") or "").strip().lower()

        out.append(
            NormalizedInspection(
                id_national=f"I-{MUNICIPALITY_CODE}-{raw['Id']}-{index}",
                establishment_id=establishment_id,
                inspected_at=date.fromisoformat(when[:10]),
                assessment=assessment,
                type=REASON_MAP.get(reason, ROUTINE),
                prenotified=False if type_text == "oanmäld" else (True if type_text else None),
                audit=False,
                on_site=True,
                areas=[
                    # Stockholms fältnamn: Number, Group, Title, Link.
                    # Listan innehåller endast punkter MED avvikelse — därav
                    # status hårdkodad. Godkända områden redovisas inte.
                    ControlArea(
                        code=(a.get("Number") or "").strip(),
                        group=(a.get("Group") or "").strip(),
                        description=(a.get("Title") or "").strip(),
                        status="deviation",
                    )
                    for a in (item.get("ControlAreaList") or [])
                ],
                uncertain=False,
            )
        )

    return out
