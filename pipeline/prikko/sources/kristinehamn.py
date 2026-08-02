"""Inläsare för Kristinehamns kommun.

Elfte källan. Verksamhetsregistret ligger i ett ArcGIS-lager och
kontrollrapporterna som PDF-BILAGOR på samma lager, alltså en kombination vi
inte mött tidigare:

    MapServer/14/query?where=1=1&outFields=*&outSR=3008&f=json          180 rader
    MapServer/14/queryAttachments?objectIds=1,2,3,…                     354 bilagor
    MapServer/14/<objectid>/attachments/<attachmentid>                  en rapport

Registret kostar ett anrop, bilagsförteckningen fyra, och därefter ett anrop
per rapport. Attributen innehåller INGET resultatfält: bedömningen finns bara
inuti rapporten. Se `prikko/pdf.py`.

## Rapporterna kräver teckensnittens ToUnicode-tabeller

Till skillnad från Svenljungas rapporter skriver Kristinehamns ärendesystem
all text med Type0-teckensnitt och hexsträngar. Byten är glyfnummer, inte
bokstäver, och utan teckensnittets egen ToUnicode-tabell blir texten
förskjuten: "Dnr LIV" kommer ut som "'QU/,9". Stödet för det byggdes i
`pdf.py` för den här källans skull.

Sju rapporter faller ändå bort, eftersom deras teckensnitt ger samma kod två
olika betydelser och tabellen då kasseras i sin helhet. Det är avsiktligt:
tom text är hanterbar, halvrätt text är det inte.

## Vad som går att läsa, räknat över alla 354 bilagor 2026-08-03

    258  kontrollrapporter vi kan tolka (181 utan avvikelser, 77 med)
     78  inskannade bilder utan textlager
      9  delegationsbeslut, alltså förelägganden och inte kontrollrapporter
      9  läsbara men i en mall vi inte känner igen, eller utan ToUnicode

Förelägganden är inte kontroller och blir därför inga kontrolltillfällen. Den
kontroll som ledde fram till beslutet publiceras som en egen rapport, så
uppgiften går inte förlorad.

## Källan har både historik och kontrolltyp

Det gör Kristinehamn till den bästa av de fem nya källorna. 54 rapporter
säger uttryckligen "Det var en extrakontroll för att följa upp om avvikelser
från livsmedelslagstiftningen åtgärdats" — ett verkligt återbesök, inte en
planerad kontroll som passade på. En sådan kontroll som ändå finner
avvikelser beskriver per kommunens egen definition en brist som inte
åtgärdats, och `grading.py` läser den som kvarstående.

Kommunen anger dessutom om besöket var oanmält (145) eller föranmält (73).
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from datetime import date
from typing import List, Optional

from ..geo import SWEREF99_1330, looks_like_sweden, sweref99_to_wgs84
from ..grading import FOLLOWUP, MINOR_REMARKS, NO_REMARKS, ROUTINE

MUNICIPALITY_CODE = "1781"  # Kristinehamn, SCB REGINA
MUNICIPALITY_NAME = "Kristinehamns kommun"
# Orten, i grundform. Får ALDRIG härledas ur kommunnamnet.
MUNICIPALITY_CITY = "Kristinehamn"

SERVICE = (
    "https://portal.kristinehamn.se/arcgis/rest/services/Portal"
    "/Livsmedelsprotokoll/MapServer/14"
)
SOURCE_URL = (
    "https://www.kristinehamn.se/naringsliv-och-arbete/livsmedel/livsmedelsrapporter/"
)

#: Kommunen projicerar i den lokala zonen 13 30 (EPSG:3008), samma som
#: Karlstad. Lagret anger det själv i `spatialReference.wkid`.
PROJECTION = SWEREF99_1330

#: `Verksamhetstyp` är kodad, och koderna står i lagrets egen domän
#: `Livs_Verksamhetstyp`. Namnen skrivs där med versaler; här visas de som
#: verksamhetstyp för en enskild verksamhet och skrivs därför normalt.
#: Antalen är räknade över alla 180 rader 2026-08-03.
BUSINESS_TYPES = {
    1: "Bagerivarutillverkning",          #  4
    2: "Butik med beredning",             # 15
    3: "Butik utan beredning",            # 21
    4: "Gatukök",                         # 11
    5: "Kafé",                            # 27
    6: "Mindre beredning",                # 10
    7: "Pizzeria",                        # 11
    8: "Restaurang",                      # 32
    9: "Kommunal livsmedelsverksamhet",   # 25
    10: "Övrigt",                         # 24
}

# ---------------------------------------------------------------------------
# Värdeöversättning
#
# Samtliga förekommande värden är uträknade över hela beståndet (354 bilagor,
# 2026-08-03), inte gissade. Antal inom parentes.
#
# Fraserna matchas med ALLA BLANKSTEG BORTTAGNA, av samma skäl som i
# Svenljunga: PDF:en levererar texten styckad i korta löpor, ibland mitt i
# ett ord.
# ---------------------------------------------------------------------------

#: Resultatmeningar som betyder INGA AVVIKELSER.
CLEAN_RESULTS = (
    "Resultatavkontrollen:Utanavvikelse",             # 160
    "Ingaavvikelserkonstateradesviddennakontroll",    # 160, samma mall
    "Ingaavvikelserkonstateradesvidkontrollen",       #  21, äldre mall
    "Ingaavvikelseruppmärksammades",                  #   1
)

#: Resultatmeningar som betyder AVVIKELSER.
DEVIATION_RESULTS = (
    "Resultatavkontrollen:Enellerfleraavvikelserkonstaterades",  # 49
    "Vidkontrollenkonstateradesenellerfleraavvikelser",          # 70
    "Vidkontrollenuppmärksammadesföljandeavvikelser",            # 22, äldre mall
    "Kontrolleratmedavvikelse",                                  # 35
)

#: Ett delegationsbeslut är inget kontrolltillfälle. Nio bilagor är
#: förelägganden, och rubriken står överst i dokumentet.
DECISION_MARKER = "DELEGATIONSBESLUT"

#: Filnamn som säger att bilagan är ett beslut och inte en rapport. Behövs
#: utöver textmarkören: en inskannad bilaga har ingen text att läsa
#: markören ur, och skulle då spärra verksamhetens omdöme som en "oläsbar
#: senaste rapport". Kommunens egen felstavning `Förleäggande` ingår.
DECISION_WORDS = ("föreläggande", "förleäggande", "skrivelse")

#: Kontrollorsaken står i klartext efter inledningen.
#:
#: "Det var en ordinarie kontroll, som myndigheten gör regelbundet" (176) och
#: "Det var en planerad kontroll" (1) är rutin. "Det var en extrakontroll för
#: att följa upp om avvikelser från livsmedelslagstiftningen åtgärdats" (54)
#: är ett verkligt återbesök — kommunens egen formulering säger att syftet är
#: att se om åtgärden räckte. Det är samma grund som i Karlstad, och det är
#: den som låter `grading.py` läsa en kvarstående brist.
#:
#: Frasen måste vara förankrad i "Det var en". Orden "extrakontroll" och
#: "uppföljande kontroll" står också i rapportens standardtext ("Avvikelsen
#: kommer att följas upp vid en extrakontroll"), i 164 av 258 rapporter.
FOLLOWUP_MARKER = "Detvarenextrakontroll"

#: Förhandsbeskedet, i fyra former: "i form av en oanmäld inspektion" (121),
#: "ett oanmält kontrollbesök" (24), "en föranmäld inspektion" (69), "ett
#: föranmält kontrollbesök" (4).
PRENOTIFIED = re.compile(r"formav(?:en|ett)(o|för)anmäl[dt]")

_MONTHS = {
    "januari": 1, "februari": 2, "mars": 3, "april": 4, "maj": 5, "juni": 6,
    "juli": 7, "augusti": 8, "september": 9, "oktober": 10, "november": 11,
    "december": 12,
}

#: Kontrolldatumet står efter "utförde" och före "en livsmedelskontroll":
#: "utförde 2023-09-12 en livsmedelskontroll hos Sannabadet" eller "utförde
#: den 6 november 2024 en livsmedelskontroll hos Stora Coop". Ordet "den"
#: står ibland dubbelt ("utförde den den 16 oktober 2025").
#:
#: Förankringen är nödvändig: varje rapport bär sitt eget brevhuvuddatum
#: högst upp på sidan, alltså den dag rapporten skrevs, som i regel ligger
#: några dagar efter kontrollen.
_CONTROL_DATE = re.compile(
    r"utförde(?:den)*(?:(\d{4})-(\d{2})-(\d{2})"
    r"|(\d{1,2})(" + "|".join(_MONTHS) + r")(\d{4}))en(?:livsmedels)?kontroll",
    re.I,
)

#: Datumet i bilagans filnamn, i de fyra former kommunen använder:
#: `Coop, 2024-11-18.pdf`, `Björkhallen 20180221 uppföljande kontroll.pdf`,
#: `Stora Coop 13 augusti 2025.pdf`, `Park Hotel 2024 04 25.pdf`.
#:
#: Det är UPPLADDNINGENS datum, inte kontrollens, och används bara för att
#: avgöra vilken rapport som är den senast publicerade. Aldrig som
#: kontrolldatum. 350 av 354 filnamn bär ett läsbart datum.
_FILE_DATE_ISO = re.compile(r"(20\d{2})[-\s](\d{2})[-\s](\d{2})")
_FILE_DATE_COMPACT = re.compile(r"\b(20\d{2})(\d{2})(\d{2})\b")
_FILE_DATE_LONG = re.compile(
    r"(\d{1,2})\s+(" + "|".join(_MONTHS) + r")\s+(20\d{2})", re.I
)


class UnknownSourceValue(Exception):
    """Källan levererade ett värde vi inte känner igen.

    Får aldrig hanteras med ett default. Vi publicerar omdömen om namngivna
    verksamheter; ett okänt värde som tyst tolkas som godkänt är precis den
    sortens fel som förstör förtroendet.
    """


@dataclass(frozen=True)
class Attachment:
    """En bilaga på lagret, innan PDF:en lästs."""

    id: int
    parent: int
    filename: str

    @property
    def url(self) -> str:
        return f"{SERVICE}/{self.parent}/attachments/{self.id}"

    @property
    def is_decision(self) -> bool:
        """Är bilagan ett föreläggande i stället för en kontrollrapport?"""
        lowered = self.filename.casefold()
        return any(word in lowered for word in DECISION_WORDS)

    @property
    def published_at(self) -> Optional[date]:
        """Bilagans eget datum, ur filnamnet. Se _FILE_DATE_ISO."""
        for pattern in (_FILE_DATE_ISO, _FILE_DATE_COMPACT):
            found = pattern.search(self.filename)
            if found:
                try:
                    return date(*(int(g) for g in found.groups()))
                except ValueError:
                    return None
        found = _FILE_DATE_LONG.search(self.filename)
        if found:
            try:
                return date(
                    int(found.group(3)),
                    _MONTHS[found.group(2).casefold()],
                    int(found.group(1)),
                )
            except ValueError:
                return None
        return None


@dataclass(frozen=True)
class Report:
    """En tolkad kontrollrapport."""

    inspected_at: date
    assessment: int
    type: int
    prenotified: Optional[bool]
    url: str


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
    #: Länk till kommunens egen PDF-rapport.
    report_url: str


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


def query_url() -> str:
    """Registret. `outSR=3008` begär inhemsk projektion, samma regel som för
    Karlstad och Oskarshamn: hämta i källans eget system och transformera
    här, så att en server som byter avrundningsbeteende inte tyst flyttar
    restauranger."""
    return (
        f"{SERVICE}/query"
        "?where=1%3D1&outFields=*&outSR=3008&returnGeometry=true&f=json"
    )


def attachments_url(object_ids: List[int]) -> str:
    """Bilagsförteckningen för en klump verksamheter."""
    joined = ",".join(str(i) for i in object_ids)
    return f"{SERVICE}/queryAttachments?objectIds={joined}&f=json"


def parse_attachments(payload: dict) -> List[Attachment]:
    out = []
    for group in payload.get("attachmentGroups") or []:
        parent = group.get("parentObjectId")
        for info in group.get("attachmentInfos") or []:
            if (info.get("contentType") or "").lower() != "application/pdf":
                continue
            out.append(
                Attachment(
                    id=int(info["id"]),
                    parent=int(parent),
                    filename=" ".join((info.get("name") or "").split()),
                )
            )
    return out


def squeeze(text: str) -> str:
    """Ta bort alla blanksteg. Se kommentaren över värdetabellerna."""
    return re.sub(r"\s+", "", text or "")


def is_active(attributes: dict) -> bool:
    """Är verksamheten kvar?

    `Aktiv` är 1 för 156 rader, `null` för 21 och 0 för 3. Nollorna är
    avregistrerade verksamheter, och en av dem har sex bilagor. Att publicera
    ett hygienomdöme om en restaurang som har lagt ned är fel oavsett vad
    rapporten säger.

    `null` betyder att kommunen inte fyllt i fältet, inte att verksamheten är
    borta — de raderna ligger kvar i kartan och flera har färska rapporter.
    """
    return attributes.get("Aktiv") != 0


def local_id(attributes: dict) -> str:
    """Stabil lokal identitet för en verksamhet.

    Kommunen har ett riktigt verksamhets-id i ärendesystemet, `EcosOBJID` —
    men det är `null` i 108 av 180 rader och duger därför inte. ArcGIS
    `OBJECTID` duger inte heller: det numreras om vid ompublicering, vilket
    är precis hur tjänsten uppdateras. Se resonemanget i jonkoping.py.

    Namn plus adress är semantiskt stabilt och verifierat unikt över
    beståndet: 175 distinkta av 180, och de fem upprepningarna är rader utan
    namn (som ändå inte kan publiceras) samt `Nock`, som ligger två gånger
    utan adress och är samma verksamhet registrerad under två typer.
    """
    name = " ".join((attributes.get("Namn") or "").split()).casefold()
    if not name:
        raise UnknownSourceValue("Verksamhet utan namn")
    address = " ".join((attributes.get("Adress") or "").split()).casefold()
    return hashlib.sha1(f"{name}|{address}".encode("utf-8")).hexdigest()[:12]


def merge_features(features: List[dict]) -> List[tuple]:
    """Slå ihop rader som är samma verksamhet.

    `Nock` ligger två gånger i registret, båda utan adress, en gång som
    Restaurang och en gång som Övrigt. Samma verksamhet registrerad under två
    typer. Utan sammanslagning får de samma identitet och inläsningen bryter
    mot databasens primärnyckel — vilket är rätt sätt att upptäcka det, men
    fel sätt att hantera det.

    Tar features och ger (feature, OBJECTID-lista)-par i samma ordning som
    första förekomsten. Bilagorna hämtas för samtliga OBJECTID, så ingen
    rapport tappas.
    """
    order: list = []
    merged: dict = {}
    for feature in features:
        key = local_id(feature["attributes"])
        if key not in merged:
            order.append(key)
            merged[key] = (feature, [])
        merged[key][1].append(feature["attributes"]["OBJECTID"])
    return [merged[key] for key in order]


def control_date(squeezed: str) -> Optional[date]:
    """Kontrolldatumet som kommunen skriver det i rapporten."""
    found = _CONTROL_DATE.search(squeezed)
    if not found:
        return None
    if found.group(1):
        parts = (int(found.group(1)), int(found.group(2)), int(found.group(3)))
    else:
        parts = (
            int(found.group(6)),
            _MONTHS[found.group(5).casefold()],
            int(found.group(4)),
        )
    try:
        return date(*parts)
    except ValueError:
        return None


def assessment_of(squeezed: str) -> Optional[int]:
    """Läs resultatet ur rapporten.

    Den FÖRSTA resultatmeningen i dokumentet gäller, av samma skäl som i
    Svenljunga: rubriken "Kontrollerat med avvikelse" står längre ned och
    beskriver listan, inte utfallet.
    """
    hits = []
    for phrase in CLEAN_RESULTS:
        position = squeezed.find(phrase)
        if position >= 0:
            hits.append((position, NO_REMARKS))
    for phrase in DEVIATION_RESULTS:
        position = squeezed.find(phrase)
        if position >= 0:
            hits.append((position, MINOR_REMARKS))
    if not hits:
        return None
    return min(hits)[1]


def parse_report(text: str, attachment: Attachment) -> Report:
    """Tolka en kontrollrapport. Kastar när bilagan inte är en läsbar rapport."""
    squeezed = squeeze(text)
    if not squeezed:
        raise UnknownSourceValue(
            f"{attachment.filename}: ingen text — inskannad eller utan "
            "användbar teckentabell"
        )
    if DECISION_MARKER in squeezed:
        raise UnknownSourceValue(
            f"{attachment.filename}: delegationsbeslut, inte kontrollrapport"
        )

    assessment = assessment_of(squeezed)
    if assessment is None:
        raise UnknownSourceValue(
            f"{attachment.filename}: ingen resultatmening — okänd mall"
        )

    when = control_date(squeezed)
    if when is None:
        raise UnknownSourceValue(f"{attachment.filename}: inget läsbart kontrolldatum")

    prenotified = PRENOTIFIED.search(squeezed)
    return Report(
        inspected_at=when,
        assessment=assessment,
        type=FOLLOWUP if FOLLOWUP_MARKER in squeezed else ROUTINE,
        prenotified=prenotified.group(1) == "för" if prenotified else None,
        url=attachment.url,
    )


def readable_history(
    attachments: List[Attachment], reports: List[Report]
) -> List[Report]:
    """Kontrollerna vi får publicera för en verksamhet.

    Är den SENAST publicerade rapporten oläsbar publiceras ingenting alls,
    trots att äldre rapporter kan vara tolkade. Ett omdöme ska beskriva
    nuläget, och nuläget är den kontroll kommunen senast redovisat. Att i
    stället visa den näst senaste vore att påstå ett läge kommunen redan har
    kontrollerat om, utan att säga det. Samma regel som i Svenljunga.

    Förelägganden räknas inte in: de är beslut om en kontroll som redan
    redovisats i en egen rapport, och skulle annars spärra omdömet för de
    verksamheter som fått ett.
    """
    if not reports:
        return []

    published = [
        a.published_at for a in attachments if not a.is_decision and a.published_at
    ]
    if published:
        newest_read = max(r.inspected_at for r in reports)
        # Bilagans datum ligger dagar efter kontrollens, aldrig veckor.
        # Marginalen skiljer "rapporten om den senaste kontrollen" från "en
        # nyare kontroll vi inte kunde läsa".
        if (max(published) - newest_read).days > 30:
            return []

    return sorted(reports, key=lambda r: r.inspected_at, reverse=True)


def normalize_establishment(feature: dict) -> NormalizedEstablishment:
    attributes = feature["attributes"]
    id_local = local_id(attributes)

    lat = lng = None
    geometry = feature.get("geometry") or {}
    east, north = geometry.get("x"), geometry.get("y")
    if east is not None and north is not None:
        lat, lng = sweref99_to_wgs84(north, east, PROJECTION)
        if not looks_like_sweden(lat, lng):
            # Hellre ingen position än en position som ljuger.
            lat = lng = None
        else:
            lat, lng = round(lat, 6), round(lng, 6)

    kind = attributes.get("Verksamhetstyp")
    if kind is not None and kind not in BUSINESS_TYPES:
        raise UnknownSourceValue(f"Okänd verksamhetstyp {kind!r}")

    return NormalizedEstablishment(
        id_national=f"F-{MUNICIPALITY_CODE}-{id_local}",
        municipality_code=MUNICIPALITY_CODE,
        id_local=id_local,
        name=" ".join((attributes.get("Namn") or "").split()),
        # 76 av 180 rader saknar adress. Fältet lämnas tomt i stället för att
        # fyllas med något som ser ut som en uppgift vi har.
        street_address=" ".join((attributes.get("Adress") or "").split()) or None,
        types=[BUSINESS_TYPES[kind]] if kind in BUSINESS_TYPES else [],
        lat=lat,
        lng=lng,
    )


def normalize_inspections(
    attachments: List[Attachment], reports: List[Report], establishment_id: str
) -> List[NormalizedInspection]:
    """Översätt de läsbara rapporterna till kontroller, nyast först.

    Två rapporter från samma dag slås ihop med det sämre resultatet som
    utfall — samma regel som i Linköping och Jönköping.
    """
    id_local = establishment_id.rsplit("-", 1)[-1]

    merged: dict = {}
    for report in readable_history(attachments, reports):
        current = merged.get(report.inspected_at)
        if current is None or report.assessment > current.assessment:
            merged[report.inspected_at] = report

    return [
        NormalizedInspection(
            id_national=f"I-{MUNICIPALITY_CODE}-{id_local}-{when.isoformat()}",
            establishment_id=establishment_id,
            inspected_at=when,
            assessment=report.assessment,
            type=report.type,
            prenotified=report.prenotified,
            # Kommunen skiljer på inspektion och kontrollbesök men redovisar
            # aldrig en revision.
            audit=False,
            on_site=True,
            # Rapporten räknar upp kontrollområdena, både de utan och de med
            # avvikelse, men texten kommer ur PDF:en styckad i korta löpor
            # och områdesnamnen skulle kräva en sluten ordlista källan inte
            # håller sig till. Hellre ingen uppgift än en trasig. Se
            # svenljunga.py, som gjorde samma val av samma skäl.
            areas=[],
            uncertain=False,
            report_url=report.url,
        )
        for when, report in sorted(merged.items(), reverse=True)
    ]
