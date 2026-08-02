"""Inläsare för Linköpings kommun.

Linköping har Sveriges enda öppna livsmedels-API — men det följer INTE
Sambruk/NSÖD-specen. Fälten är svenska och bedömningen är fritext i stället
för den numeriska skala specen föreskriver. Verifierat mot live-API 2026-08-02.

Det är därför varje källa får en egen adapter som översätter till Prikkos
kanoniska modell. Antagandet att "alla kommuner följer specen" håller inte,
och pipelinen får aldrig bygga på det.

API: https://livsmedelsdata.linkoping.se/swagger/index.html

    GET /api/v1/Anlaggningar/medsenastetillsyn   alla + senaste kontrollen
    GET /api/v1/Anlaggningar/{id}                en anläggning med FULL historik

Viktigt: listendpointen /Anlaggningar returnerar alltid tom `tillsyner`.
Full kontrollhistorik finns bara per anläggning, alltså ett anrop per objekt
(1 241 st i Linköping). Sveptet görs därför mot medsenastetillsyn, och
detaljhämtning sker inkrementellt.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional

from ..geo import SWEREF99_1500, looks_like_sweden, sweref99_to_wgs84
from ..grading import COMPLAINT, FOLLOWUP, MAJOR_REMARKS, MINOR_REMARKS, NO_REMARKS, ROUTINE

MUNICIPALITY_CODE = "0580"  # Linköping, SCB REGINA
MUNICIPALITY_NAME = "Linköpings kommun"

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

ASSESSMENT_MAP = {
    "Utan Avvikelse": NO_REMARKS,      # 545 — inga anmärkningar
    "Åtgärdad": NO_REMARKS,            # 284 — tidigare avvikelse är avhjälpt
    "Godtagbar": MINOR_REMARKS,        #  75 — se osäkerhetsnot nedan
    "Avvikelse": MINOR_REMARKS,        #  72 — avvikelse konstaterad
    "Kvarstår": MAJOR_REMARKS,         #   4 — avvikelsen kvarstår vid uppföljning
    "Ej godtagbar": MAJOR_REMARKS,     #   3 — underkänd
}

# OSÄKERT: "Godtagbar" tolkas här som mindre anmärkning, eftersom kommunen
# har ett separat och vanligare värde ("Utan Avvikelse") för helt rent
# resultat — ett eget värde bör betyda något annat. Tolkningen påverkar 75
# anläggningar och bör bekräftas mot Linköpings egen dokumentation innan
# betygen publiceras.
UNCERTAIN_ASSESSMENTS = {"Godtagbar"}

TYPE_MAP = {
    "Planerad": ROUTINE,                        # 653
    "Uppföljande": FOLLOWUP,                    # 304
    "Uppföljande tidigare avvikelse": FOLLOWUP,  #   6
    "Händelsestyrd": COMPLAINT,                 #  20
}

ASSESSMENT_FIELD = "helhetsbedomning av tillsynen"  # ja, med mellanslag


class UnknownSourceValue(Exception):
    """Källan har levererat ett värde vi inte känner igen.

    Detta får ALDRIG hanteras genom att gissa eller falla tillbaka på ett
    default. Vi publicerar omdömen om namngivna verksamheter; ett okänt värde
    som tyst tolkas som "inga anmärkningar" är precis den sortens fel som
    förstör förtroendet. Anläggningen hoppas över och felet larmas.
    """


@dataclass(frozen=True)
class NormalizedInspection:
    id_national: str
    establishment_id: str
    inspected_at: date
    assessment: int
    type: int
    prenotified: Optional[bool]
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

    return NormalizedInspection(
        id_national=f"I-{MUNICIPALITY_CODE}-{raw['tillsynsId']}",
        establishment_id=establishment_id,
        inspected_at=_parse_date(raw["tillsynsDatumTid"]),
        assessment=ASSESSMENT_MAP[assessment_raw],
        type=TYPE_MAP.get(reason_raw, ROUTINE),
        prenotified=prenotified,
        uncertain=assessment_raw in UNCERTAIN_ASSESSMENTS,
    )
