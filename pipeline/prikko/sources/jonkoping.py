"""Inläsare för Jönköpings kommun.

Jönköping publicerar kontrollerna som fem lager i sin ArcGIS-tjänst
Kommunatlas. Det gör källan till den billigaste vi mött: **hela beståndet
hämtas med fem anrop**, mot 1 241 för Linköping och 1 843 för Uppsala.
Koordinaterna kommer dessutom färdiga i WGS84 när `outSR=4326` anges, så
ingen SWEREF-transform behövs.

    MapServer/{10,11,12,13,14}/query?where=1=1&outFields=*&outSR=4326&f=json

Fjärde källan, fjärde formatet. Historiken ligger som fritext i ett enda
fält:

    2026-04-21 Planerad kontroll <br>Kontrollresultat: Utan avvikelse<br>
    2025-11-10 Planerad kontroll <br>Kontrollresultat: Utan avvikelse<br>

Två begränsningar som är värda att känna till, båda verifierade mot hela
beståndet 2026-08-02:

1. **Fältet rymmer högst tre kontroller.** Äldre historik finns inte att
   hämta. Det råkar sammanfalla med modellens HISTORY_DEPTH, så bedömningen
   påverkas inte — men "ingen historik före detta" är inte samma sak som
   "inga kontroller före detta", och sidan får inte påstå det senare.

2. **Avvikelserna specificeras inte.** Fältet `har_avvikelse` är 0/1 och det
   finns ingen uppdelning per kontrollområde. Verksamhetens sida kan alltså
   visa ATT en avvikelse noterats men inte VAD den gällde — sämre detaljnivå
   än Linköping, Stockholm och Uppsala.

## Vad som finns i lagren och inte används

Fältdefinitionen har fjorton fält. Tre av dem läser vi inte, och skälen är
olika:

* `objektstyp` och `status` är konstanta (`Livsmedel` respektive
  `Registrerad`) i samtliga 1 119 rader. `status` är ändå värd att
  **övervaka**: börjar kommunen någon gång sätta ett annat värde är det vår
  enda signal om avregistrerade verksamheter, precis som `Aktiv` är i
  Kristinehamn.
* `fastighetsbeteckning` bär däremot verklig information, och den läses nu
  in som `property_designation`. Den skrivs INTE till sajtens datafil.
  Beteckningen är lantmäteriets språk, inte allmänhetens, och en besökare
  som redan ser gatuadressen blir inte klokare av "Västra Folkskolan 1".
  Värdet ligger i pipelinen: det är det enda vi har att geokoda en rad med
  när gatuadressen fattas.

Liksom Stockholm saknar Jönköping en "kvarstår"-etikett: resultaten är bara
`Utan avvikelse` och `Med avvikelse`. Det är skälet till att `grading.py`
härleder allvarsgraden ur mönstret i stället för ur etiketten. Utan den
regeln hade ingen verksamhet i Jönköping någonsin kunnat nå den allvarligaste
nivån medan Linköpings kunnat det, och jämförbarheten mellan kommuner — hela
poängen med Prikko — hade fallit.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from datetime import date
from typing import Optional

from ..geo import looks_like_sweden
from ..grading import COMPLAINT, FOLLOWUP, MINOR_REMARKS, NO_REMARKS, ROUTINE

MUNICIPALITY_CODE = "0680"  # Jönköping, SCB REGINA
MUNICIPALITY_NAME = "Jönköpings kommun"
MUNICIPALITY_CITY = "Jönköping"

SERVICE = (
    "https://gis.jonkoping.se/arcgis/rest/services/kommunatlas"
    "/Kommunatlas_Naringsliv_och_Arbete/MapServer"
)
#: Kommunens egen länk till kartan, med länktexten "Kommunkarta - genomförda
#: livsmedelskontroller" på jonkoping.se.
#:
#: Fram till 2026-08-25 stod här `https://kartor.jonkoping.se/kommunatlas/`.
#: Det värdnamnet FINNS INTE: `nslookup` ger NXDOMAIN och curl faller på
#: exit 6, kunde inte slå upp värden. Länken har alltså aldrig fungerat för
#: en besökare, och den syntes inte i något bygge eftersom källänken pekar
#: utanför sajten och inte kontrolleras av länkgranskningen.
SOURCE_URL = (
    "https://jonkoping.maps.arcgis.com/apps/webappviewer/index.html"
    "?id=036b2657f4eb47238e9872695ef29797"
)

#: Underlagren med livsmedelsverksamheter, med kommunens egna namn.
#: Antalen är räknade över hela beståndet 2026-08-02, inte uppskattade.
LAYERS = {
    10: "Restaurang och servering",  # 526
    11: "Butik och handel",          # 198
    12: "Skola och omsorg",          # 308
    13: "Tillverkare",               #  40
    14: "Övrigt",                    #  48
}

#: Felstavade ortnamn i källan. Varje rättning har den korrekta stavningen
#: belagd i SAMMA datamängd — vi hittar alltså inte på en stavning, vi väljer
#: den kommunen själv använder för samma ort på andra rader. Antalen är de
#: felstavade förekomsterna 2026-08-02.
ORT_CORRECTIONS = {
    "jönköpnig": "Jönköping",  # 3
    "jönköpng": "Jönköping",   # 1
    "jönkping": "Jönköping",   # 1
    "temhult": "Tenhult",      # 1
}

#: En rad i historikfältet. Orsaken står mellan datumet och `<br>`, resultatet
#: efter "Kontrollresultat:". Mellanrummet före `<br>` är kommunens eget.
HISTORY_ROW = re.compile(
    r"(\d{4}-\d{2}-\d{2})\s+(.*?)\s*<br>\s*Kontrollresultat:\s*([^<]*)"
)

#: Kontrollresultat → vår skala. Uträknade värden över hela beståndet:
#: `Utan avvikelse` (1 726), `Med avvikelse` (286). Inget tredje värde finns.
RESULT_MAP = {
    "Utan avvikelse": NO_REMARKS,
    "Med avvikelse": MINOR_REMARKS,
}

#: Orsaken är ingen enkel uppräkning — kommunen slår ihop flera skäl till en
#: sträng, till exempel `Händelsestyrd, Planerad, Uppföljande kontroll`. Nio
#: skilda värden förekommer. Därför nyckelord med rangordning i stället för
#: en tabell: en kontroll som bland annat är uppföljande ÄR en uppföljning,
#: och det är just uppföljningen modellen läser allvarsgrad ur.
REASON_KEYWORDS = (
    ("uppfölj", FOLLOWUP),      # "Uppföljande" och "Uppföljning avvikelser…"
    ("händelsestyrd", COMPLAINT),
    ("planerad", ROUTINE),
)


class UnknownSourceValue(Exception):
    """Källan levererade ett värde vi inte känner igen.

    Får aldrig hanteras med ett default. Vi publicerar omdömen om namngivna
    verksamheter; ett okänt värde som tyst tolkas som godkänt är precis den
    sortens fel som förstör förtroendet.
    """


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
    #: Fastighetsbeteckning ur `fastighetsbeteckning`, t.ex. "Åminne 1".
    #: Ifylld genomgående. Bärs INTE vidare till sajtens datafil — se
    #: modulens inledning.
    property_designation: Optional[str] = None


def query_url(layer: int) -> str:
    return (
        f"{SERVICE}/{layer}/query"
        "?where=1%3D1&outFields=*&outSR=4326&returnGeometry=true&f=json"
    )


def local_id(attributes: dict) -> str:
    """Stabil lokal identitet för en verksamhet.

    Kommunen publicerar inget verksamhets-id — bara ArcGIS eget `OBJECTID`.
    Det är unikt i stunden (verifierat: noll krockar över de fem lagren) men
    ArcGIS numrerar om vid ompublicering, vilket är precis hur den här
    tjänsten uppdateras. Ett id som byter värde varje natt skulle få
    inläsaren att skapa dubbletter i stället för att uppdatera befintliga
    rader.

    Namn plus adress är däremot semantiskt stabilt och verifierat unikt över
    alla 1 120 verksamheter. Det hashas för att ge ett id av rimlig längd som
    tål att adressen innehåller vad som helst.
    """
    name = (attributes.get("objektsnamn") or "").strip().casefold()
    address = (attributes.get("adress") or "").strip().casefold()
    digest = hashlib.sha1(f"{name}|{address}".encode("utf-8")).hexdigest()
    return digest[:12]


def normalize_ort(raw: Optional[str]) -> str:
    """Städa ortnamnet.

    Kommunen blandar versaler och gemener för samma ort — `JÖNKÖPING` och
    `Jönköping`, `HUSKVARNA` och `Huskvarna`. Utan normalisering får
    besökaren adresser som ser ut att skrikas.
    """
    ort = " ".join((raw or "").split())
    if not ort:
        return ""
    return ORT_CORRECTIONS.get(ort.casefold(), ort.title())


def _reason_to_type(reason: str) -> int:
    lowered = reason.casefold()
    for keyword, value in REASON_KEYWORDS:
        if keyword in lowered:
            return value
    raise UnknownSourceValue(f"Okänd kontrollorsak {reason!r}")


def normalize_establishment(feature: dict, category: str) -> NormalizedEstablishment:
    attributes = feature["attributes"]
    id_local = local_id(attributes)

    lat = lng = None
    geometry = feature.get("geometry") or {}
    # outSR=4326 ger x=longitud, y=latitud. Namnen är ArcGIS, inte våra.
    x, y = geometry.get("x"), geometry.get("y")
    if x is not None and y is not None and looks_like_sweden(y, x):
        # Hellre ingen position än en position som ljuger.
        lat, lng = round(y, 6), round(x, 6)

    # `typ` är den specifika verksamhetstypen (Pizzeria, Mottagningskök),
    # `kategori` den grövre indelning kartan grupperar på. Båda är
    # meningsfulla för besökaren; dubbletter tas bort.
    types = []
    for value in (attributes.get("typ"), attributes.get("kategori") or category):
        value = (value or "").strip()
        if value and value not in types:
            types.append(value)

    address = (attributes.get("adress") or "").strip()
    ort = normalize_ort(attributes.get("ort"))
    if address and ort and ort.casefold() != MUNICIPALITY_CITY.casefold():
        # 449 av 1 120 verksamheter ligger i en annan tätort än centralorten —
        # Huskvarna, Gränna, Visingsö. Den uppgiften är värd att behålla.
        #
        # Men bara när den tillför något: sidan skriver ut kommunens namn
        # efter adressen, så ett "Jönköping" här skulle ge "Jönköping,
        # Jönköping".
        address = f"{address}, {ort}"

    return NormalizedEstablishment(
        id_national=f"F-{MUNICIPALITY_CODE}-{id_local}",
        municipality_code=MUNICIPALITY_CODE,
        id_local=id_local,
        name=(attributes.get("objektsnamn") or "").strip(),
        street_address=address or None,
        types=types,
        lat=lat,
        lng=lng,
        property_designation=(
            " ".join((attributes.get("fastighetsbeteckning") or "").split()) or None
        ),
    )


def normalize_inspections(feature: dict, establishment_id: str) -> list:
    """Tolka historikfältet till kontroller, nyast först.

    Två kontroller samma dag för samma verksamhet slås ihop, med det sämre
    resultatet som utfall — samma regel som i Linköping, där 148 dubbletter
    upptäcktes. Här förekommer det inte i dagens data, men fältet är fritext
    och regeln ska finnas innan den behövs, inte efteråt.
    """
    attributes = feature["attributes"]
    text = attributes.get("senaste_kontroller") or ""

    merged: dict = {}
    for when, reason, result in HISTORY_ROW.findall(text):
        result = result.strip()
        if result not in RESULT_MAP:
            raise UnknownSourceValue(
                f"Okänt kontrollresultat {result!r} för {establishment_id}"
            )

        inspected_at = date.fromisoformat(when)
        assessment = RESULT_MAP[result]
        type_ = _reason_to_type(reason)

        existing = merged.get(inspected_at)
        if existing is None:
            merged[inspected_at] = (assessment, type_)
        else:
            # Sämsta utfallet vinner; en uppföljning väger tyngre än en
            # planerad kontroll eftersom modellen läser allvarsgrad ur den.
            merged[inspected_at] = (
                max(existing[0], assessment),
                FOLLOWUP if FOLLOWUP in (existing[1], type_) else existing[1],
            )

    return [
        NormalizedInspection(
            id_national=f"I-{MUNICIPALITY_CODE}-{local_id(attributes)}-{when.isoformat()}",
            establishment_id=establishment_id,
            inspected_at=when,
            assessment=assessment,
            type=type_,
            # Kommunen redovisar varken förhandsbesked eller revision.
            prenotified=None,
            audit=False,
            on_site=True,
            # Avvikelserna specificeras inte i källan. Tom lista är sanningen
            # här — inte ett tecken på att vi tappat bort något.
            areas=[],
            uncertain=False,
        )
        for when, (assessment, type_) in sorted(merged.items(), reverse=True)
    ]


def check_deviation_flag(feature: dict, inspections: list) -> None:
    """Stäm av vår tolkning mot kommunens egen flagga.

    `har_avvikelse` säger 0/1 om den SENASTE kontrollen. Den är alltså en
    oberoende facit på att texttolkningen ovan läst rätt rad och rätt
    resultat. Stämde i 1 120 fall av 1 120 vid kartläggningen; om den slutar
    stämma har formatet ändrats och vi ska få veta det, inte publicera vidare.
    """
    flag = (feature["attributes"].get("har_avvikelse") or "").strip()
    if flag not in ("0", "1") or not inspections:
        return
    if (inspections[0].assessment > NO_REMARKS) != (flag == "1"):
        raise UnknownSourceValue(
            f"har_avvikelse={flag} motsäger tolkad historik för "
            f"{inspections[0].establishment_id}"
        )
