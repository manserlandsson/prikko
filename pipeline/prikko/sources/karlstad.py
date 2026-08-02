"""Inläsare för Karlstads kommun.

Karlstad kör **Origo**, ett öppet svenskt kartramverk. Kartkonfigurationen
ligger på `https://gi.karlstad.se/origo/index_ssl.json` och pekar ut en
GeoServer som talar WFS. Datat hämtas därifrån, fyra anrop:

    https://gi.karlstad.se/geoserver/ows
      ?service=WFS&version=1.1.0&request=GetFeature
      &typeName=webbkartan:livsmedelskontroller_<lager>
      &outputFormat=application/json

Femte källan, femte formatet — men den första som bygger på ett ramverk
flera kommuner delar. Lyckas mönstret här är det värt att pröva mot fler
Origo-kommuner innan fler enskilda adaptrar skrivs.

Två fallgropar, båda uppmätta:

1. **Begär inte `srsName=EPSG:4326`.** Servern avrundar då till två
   decimaler — ungefär en kilometers fel, vilket räcker för att lägga en
   restaurang i fel stadsdel. I inhemsk projektion (EPSG:3008 =
   SWEREF 99 13 30) kommer full precision, och `geo.py` klarar zonen.

2. **Konfigurationsfilen går inte att JSON-parsa.** Den är handredigerad och
   innehåller `//`-kommentarer, utkommenterade block och avslutande
   kommatecken. Lagernamnen står därför här som konstanter i stället för att
   läsas ur filen vid varje körning.

Den stora begränsningen: **Karlstad publicerar bara den senaste kontrollen**,
och bara kontroller gjorda efter 1 januari 2024. Ingen historik, inga
specificerade avvikelser. Konsekvenser för bedömningen:

- Utmärkelsen (tre rena kontroller i rad) kan aldrig nås i Karlstad. Det är
  en verklig asymmetri mot Linköping och ska framgå av metodiksidan, inte
  döljas.
- Kvarstående brister kan bara härledas ur att den enda publicerade
  kontrollen är en extrakontroll som ändå fann avvikelser. Det är en
  strängare grund än i andra kommuner — men den är kommunens egen: "När
  verksamheten har fått en eller fler avvikelser som behöver följas upp kan
  det behövas extra kontrollbesök" (karlstad.se). En extrakontroll som
  fortfarande finner avvikelser beskriver alltså per kommunens definition
  brister som inte åtgärdats.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Optional

from ..geo import SWEREF99_1330, looks_like_sweden, sweref99_to_wgs84
from ..grading import FOLLOWUP, MINOR_REMARKS, NO_REMARKS, ROUTINE

MUNICIPALITY_CODE = "1780"  # Karlstad, SCB REGINA
MUNICIPALITY_NAME = "Karlstads kommun"
MUNICIPALITY_CITY = "Karlstad"

ENDPOINT = "https://gi.karlstad.se/geoserver/ows"
SOURCE_URL = (
    "https://karlstad.se/bygga-bo-och-leva-hallbart/mat-miljo-och-halsa"
    "/saker-och-trygg-mat/livsmedelskollen"
)

#: WFS-lagren med livsmedelsverksamheter, med kommunens egna rubriker.
#: Antalen är räknade över hela beståndet 2026-08-02, inte uppskattade.
LAYERS = {
    "webbkartan:livsmedelskontroller_restaurang": "Restaurang och servering",  # 338
    "webbkartan:livsmedelskontroller_skolaomsorg": "Skola och omsorg",         # 150
    "webbkartan:livsmedelskontroller_butikhandel": "Butik och handel",         # 109
    "webbkartan:livsmedelskontroller_ovrigt": "Övriga verksamheter",           #  97
}

#: Kommunen projicerar i den lokala zonen 13 30, inte i rikszonen TM.
PROJECTION = SWEREF99_1330

#: Kontrolltyp → vår typ. Uträknade värden över hela beståndet:
#: `Ordinarie kontroll` (380), `Extra kontroll` (221), tomt (93).
#:
#: Att extrakontrollen räknas som uppföljning är inte vår tolkning utan
#: kommunens: den görs när avvikelser behöver följas upp. Det spelar roll,
#: för det är just uppföljningen modellen läser kvarstående brister ur.
CONTROL_MAP = {
    "Ordinarie kontroll": ROUTINE,
    "Extra kontroll": FOLLOWUP,
}

#: Avvikelseflagga → vår skala. Uträknade värden: `Nej` (474), `Ja` (127),
#: tomt (93). Ingen tredje nivå finns, precis som i Stockholm och Jönköping.
DEVIATION_MAP = {
    "Nej": NO_REMARKS,
    "Ja": MINOR_REMARKS,
}


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


def query_url(typename: str) -> str:
    """WFS-anropet för ett lager.

    `srsName` utelämnas med flit — se modulens dokumentation. Utan den
    levererar servern inhemsk EPSG:3008 med full precision.
    """
    return (
        f"{ENDPOINT}?service=WFS&version=1.1.0&request=GetFeature"
        f"&typeName={typename}&outputFormat=application%2Fjson"
    )


def normalize_establishment(feature: dict, category: str) -> NormalizedEstablishment:
    properties = feature["properties"]

    # Kommunen sätter ett GUID per verksamhet. Till skillnad från Jönköpings
    # OBJECTID är det en riktig identitet som överlever ompublicering.
    id_local = (properties.get("id") or "").strip()
    if not id_local:
        raise UnknownSourceValue("Verksamhet utan id")

    lat = lng = None
    geometry = feature.get("geometry") or {}
    coordinates = geometry.get("coordinates") or []
    if len(coordinates) == 2:
        east, north = coordinates
        lat, lng = sweref99_to_wgs84(north, east, PROJECTION)
        if not looks_like_sweden(lat, lng):
            # Hellre ingen position än en position som ljuger.
            lat = lng = None
        else:
            lat, lng = round(lat, 6), round(lng, 6)

    # `kategori` är den specifika typen (Café, Förskolekök), `inriktning` en
    # närmare beskrivning, och lagrets rubrik den grövre indelningen. Alla tre
    # är meningsfulla för besökaren; dubbletter tas bort.
    types = []
    for value in (properties.get("kategori"), properties.get("inriktning"), category):
        value = (value or "").strip()
        if value and value not in types:
            types.append(value)

    return NormalizedEstablishment(
        id_national=f"F-{MUNICIPALITY_CODE}-{id_local}",
        municipality_code=MUNICIPALITY_CODE,
        id_local=id_local,
        name=(properties.get("namn") or "").strip(),
        # Kommunen publicerar ingen adress alls — bara namn och position.
        # None är sanningen här, inte en lucka vi glömt fylla.
        street_address=None,
        types=types,
        lat=lat,
        lng=lng,
    )


def normalize_inspections(feature: dict, establishment_id: str) -> list:
    """Översätt den enda publicerade kontrollen.

    Returnerar en lista trots att det aldrig kan bli mer än en post — hela
    pipelinen räknar med en historik, och en verksamhet utan publicerad
    kontroll ska ge en tom lista, inte ett specialfall.
    """
    properties = feature["properties"]

    when = (properties.get("senaste_tillsyn_datum") or "").strip()
    control = (properties.get("kontroll") or "").strip()
    deviation = (properties.get("avvikelser") or "").strip()

    if not when:
        # Nyregistrerad, eller inte kontrollerad efter 1 januari 2024 — det
        # är kommunens egen förklaring till tomma fält.
        return []

    if control not in CONTROL_MAP:
        raise UnknownSourceValue(
            f"Okänd kontrolltyp {control!r} för {establishment_id}"
        )
    if deviation not in DEVIATION_MAP:
        raise UnknownSourceValue(
            f"Okänt avvikelsevärde {deviation!r} för {establishment_id}"
        )

    id_local = (properties.get("id") or "").strip()

    return [
        NormalizedInspection(
            id_national=f"I-{MUNICIPALITY_CODE}-{id_local}-{when[:10]}",
            establishment_id=establishment_id,
            inspected_at=date.fromisoformat(when[:10]),
            assessment=DEVIATION_MAP[deviation],
            type=CONTROL_MAP[control],
            # Kommunen redovisar varken förhandsbesked eller revision.
            prenotified=None,
            audit=False,
            on_site=True,
            # Avvikelserna specificeras inte i källan. Tom lista är sanningen
            # här — inte ett tecken på att vi tappat bort något.
            areas=[],
            uncertain=False,
        )
    ]
