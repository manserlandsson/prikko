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

## Adresserna kommer ur ett avställt lager, och BARA adresserna

De fyra lagren ovan bär ingen gatuadress. Ett femte lager på samma
GeoServer gör det:

    webbkartan:vy_mi_miljo_livsmedelskontroller     705 poster

Det lagret är **avställt bestånd 2019 till 2024**, alltså föregångaren till
de fyra vi läser. Det bär också `resultat`, `anmarkningar` (antal
avvikelser), `uppfoljning` och `url` — och de fälten får ALDRIG användas:

* Kontrollresultaten är fyra till sju år gamla och beskriver ett annat
  kontrollsystem än det kommunen kör i dag.
* `url` pekar på `gi.karlstad.se/livsmedelskontroller/avvikelser.php`, som
  är nedmonterad. Uppmätt: HTTP 404 på varje objekt som provats.

Därför hämtas lagret med `propertyName=namn,adress`, så att servern inte
ens skickar resten, och `parse_addresses()` kastar om ett fält utanför
`ADDRESS_FIELDS` ändå dyker upp. Se `address_query_url()`.

Hopparningen sker på namn och kräver att namnet är entydigt i BÅDA
bestånden. Uppmätt 2026-08-25: 691 av 693 namn i adresslagret är entydiga,
och 514 av våra 696 verksamheter får en adress. Resten står kvar utan, för
en adress på fel verksamhet är sämre än ingen adress.

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
- Ärendenumret (`arendenummer`, 601 av 695 poster) är däremot kommunens
  egen väg runt begränsningen. FAQ:n på Livsmedelskollen säger ordagrant:
  "Alla livsmedelsrapporter kan begäras ut via Kontaktcenter. Ring
  054-540 00 00 och ange ärendenummer så hjälper de dig." Numret bärs
  därför vidare per kontroll, så att besökaren kan hämta ut det vi inte
  får publicera.
- Kvarstående brister kan bara härledas ur att den enda publicerade
  kontrollen är en extrakontroll som ändå fann avvikelser. Det är en
  strängare grund än i andra kommuner — men den är kommunens egen: "När
  verksamheten har fått en eller fler avvikelser som behöver följas upp kan
  det behövas extra kontrollbesök" (karlstad.se). En extrakontroll som
  fortfarande finner avvikelser beskriver alltså per kommunens definition
  brister som inte åtgärdats.
"""

from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import date
from typing import Optional

from ..geo import SWEREF99_1330, looks_like_sweden, sweref99_to_wgs84
from ..grading import FOLLOWUP, MINOR_REMARKS, NO_REMARKS, ROUTINE

MUNICIPALITY_CODE = "1780"  # Karlstad, SCB REGINA
MUNICIPALITY_NAME = "Karlstads kommun"
MUNICIPALITY_CITY = "Karlstad"

ENDPOINT = "https://gi.karlstad.se/geoserver/ows"
#: Kommunens egen Livsmedelskollen-sida. Den tidigare adressen
#: (`/mat-miljo-och-halsa/saker-och-trygg-mat/livsmedelskollen`) svarar 301
#: hit; uppmätt 2026-08-25. Vi följer omdirigeringen i förväg i stället för
#: att skicka besökaren genom den.
SOURCE_URL = (
    "https://karlstad.se/bygga-bo-och-leva-hallbart/mat-miljo-och-halsoskydd"
    "/livsmedelskollen"
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

# ---------------------------------------------------------------------------
# Adresslagret
#
# Se avsnittet "Adresserna kommer ur ett avställt lager" i modulens inledning.
# Allt här inne finns för att göra det OMÖJLIGT att av misstag ta med mer än
# adressen.
# ---------------------------------------------------------------------------

#: Det avställda lagret. 705 poster, bestånd 2019 till 2024.
ADDRESS_LAYER = "webbkartan:vy_mi_miljo_livsmedelskontroller"

#: De ENDA fält vi får läsa ur lagret. Namnet behövs för att para ihop,
#: adressen är uppgiften vi hämtar. Inget annat.
#:
#: Listan skickas som `propertyName` i anropet, så servern levererar aldrig
#: resten, och kontrolleras sedan en gång till i `parse_addresses()`. Två
#: spärrar för samma sak är avsiktligt: den första kan tas bort av någon som
#: felsöker ett anrop, den andra sitter i tolkningen.
ADDRESS_FIELDS = ("namn", "adress")

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
    #: Kommunens diarienummer för kontrollen, ur `arendenummer`. Se
    #: modulens inledning: det är nyckeln besökaren behöver för att begära
    #: ut rapporten.
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


def query_url(typename: str) -> str:
    """WFS-anropet för ett lager.

    `srsName` utelämnas med flit — se modulens dokumentation. Utan den
    levererar servern inhemsk EPSG:3008 med full precision.
    """
    return (
        f"{ENDPOINT}?service=WFS&version=1.1.0&request=GetFeature"
        f"&typeName={typename}&outputFormat=application%2Fjson"
    )


def address_query_url() -> str:
    """WFS-anropet för adresslagret.

    `propertyName` begränsar svaret till namn och adress. Det är ingen
    kosmetisk optimering utan spärren: servern skickar aldrig `resultat`,
    `anmarkningar` eller `url`, och den som skulle vilja använda dem måste
    ändra listan här ovanför och läsa varför den finns.

    Uppmätt 2026-08-25: svaret blir 383 824 byte i stället för 640 kB, och
    `geometry` kommer tillbaka som `null`.
    """
    fields = ",".join(ADDRESS_FIELDS)
    return (
        f"{ENDPOINT}?service=WFS&version=1.1.0&request=GetFeature"
        f"&typeName={ADDRESS_LAYER}&outputFormat=application%2Fjson"
        f"&propertyName={fields}"
    )


def normalize_address(raw: str) -> str:
    """Städa en adress ur adresslagret.

    557 av 691 adresser står helt i versaler (`ÄLVGATAN 3`), resten normalt
    (`Västra Torggatan 16`). Utan städning får besökaren adresser som ser ut
    att skrikas — samma fel som ortnamnen i Jönköping, och samma rättelse.

    Bara strängar UTAN gemener rättas. En blandad skrivning är kommunens
    egen och ska stå kvar; `Väse Prästgård 610` blir inte bättre av att
    köras genom en titelregel. Husnumret klarar sig: `SVEAGATAN 10A` blir
    `Sveagatan 10A`, inte `10a`.
    """
    address = " ".join((raw or "").split())
    if not address or any(char.islower() for char in address):
        return address
    return address.title()


def parse_addresses(payload: dict) -> dict:
    """Bygg namn → adress ur adresslagret.

    Två spärrar och en tvetydighetsregel:

    1. Ett fält utanför `ADDRESS_FIELDS` i svaret är ett fel, inte något att
       hoppa över. Kommer det tillbaka betyder det att `propertyName` slutat
       verka, och då ska hämtningen stanna medan någon läser efter varför,
       inte fortsätta med ett svar som bär kontrollresultat från 2019.

    2. Ett namn som bär två olika adresser i lagret utelämnas. Två poster med
       samma skylt är två verksamheter, och att välja den ena vore att gissa
       vilken. 2 av 693 namn var tvetydiga 2026-08-25.

    Fälten är utfyllda med blanksteg till 200 tecken i källan, så allt
    normaliseras.
    """
    seen: dict = {}
    for feature in payload.get("features") or []:
        properties = feature.get("properties") or {}

        extra = sorted(set(properties) - set(ADDRESS_FIELDS))
        if extra:
            raise UnknownSourceValue(
                "Adresslagret levererade fält utanför adressen: "
                + ", ".join(extra)
            )

        name = " ".join((properties.get("namn") or "").split())
        address = normalize_address(properties.get("adress") or "")
        if not name or not address:
            continue
        seen.setdefault(name.casefold(), set()).add(address)

    return {name: next(iter(v)) for name, v in seen.items() if len(v) == 1}


def unambiguous_names(establishments: list) -> set:
    """Namn som förekommer EN gång i vårt eget bestånd.

    Hopparningen sker på namn, och ett namn som står på två verksamheter hos
    oss kan inte peka ut vilken av dem adressen gäller. 12 av 696
    verksamheter delade namn med en annan 2026-08-25; de får ingen adress
    hellre än fel adress.
    """
    counts: dict = {}
    for establishment in establishments:
        key = " ".join(establishment.name.split()).casefold()
        counts[key] = counts.get(key, 0) + 1
    return {name for name, count in counts.items() if count == 1}


def with_address(
    establishment: NormalizedEstablishment, addresses: dict, unique: set
) -> NormalizedEstablishment:
    """Sätt adressen från adresslagret, när den går att peka ut entydigt.

    Rör aldrig en verksamhet som redan har en adress. I dag har ingen i
    Karlstad det, men den dagen kommunen börjar publicera adresser i de fyra
    aktuella lagren ska den färska uppgiften vinna över den avställda.
    """
    if establishment.street_address:
        return establishment
    key = " ".join(establishment.name.split()).casefold()
    if key not in unique:
        return establishment
    address = addresses.get(key)
    if not address:
        return establishment
    return replace(establishment, street_address=address)


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
        # De fyra aktuella lagren bär ingen adress, bara namn och position.
        # None är sanningen om DEN här posten. Adressen sätts i ett andra
        # steg ur det avställda lagret, se `with_address()`.
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
            case_number=(properties.get("arendenummer") or "").strip() or None,
        )
    ]
