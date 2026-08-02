"""Inläsare för Oskarshamns kommun.

Sjätte källan. ArcGIS REST igen, men en MapServer i kommunens egen
ArcGIS Enterprise i stället för i molnet, och med sex underlager:

    MapServer/{0,2,3,4,5,6}/query?where=1=1&outFields=*&outSR=3010&f=json

**Hela beståndet i sex anrop** — 241 rader, billigare än Jönköpings fem
lager om 2 012 rader räknat per verksamhet. Lager-id 1 finns inte; luckan är
kommunens egen och ska inte "lagas".

Varning: kommunens webbkarta pekar även på en tjänst `Livsmedelskontroller2`
som svarar `{"error":{"code":499,"message":"Token Required"}}`. Rätt tjänst är
`Livsmedelskontroller_2024`, som trots årtalet i namnet innehåller kontroller
in i juli 2026.

## Vad källan är, och inte är

En rad per anläggning med den SENASTE kontrollen. Ingen historik — samma
begränsning som Karlstad, med samma två konsekvenser:

- Utmärkelsen (tre rena kontroller i rad) kan aldrig nås i Oskarshamn.
- `grading.py` kan aldrig härleda kvarstående brister, eftersom både
  föregående kontroll och kontrolltypen saknas. Se ASSESSMENT_MAP nedan.

Avvikelserna specificeras inte: fältet `AvvikelseAnteckningar` finns i schemat
men är `null` i **samtliga 241** rader (räknat 2026-08-02). Sidan kan alltså
visa ATT en avvikelse noterats, men inte VAD den gällde.

## Två skalor i samma fält

Kommunen bytte kontrollmodell 1 januari 2024, och `Bedomning` bär båda
skalorna. Deras egen läsanvisning i kartan säger det rakt ut:

    Kontroller före 2024 ges en sammantagen bedömning på Godtagbar (visas i
    blått) eller Ej Godtagbar (visas i lila). Den nya kontrollmodellen från
    2024 gör inte längre en samlad bedömning som Godtagbar eller Ej
    godtagbar. […] Färgerna representerar då istället om det finns en
    kvarstående avvikelse (visas i lila) eller inte finns några avvikelser
    (visas i blått).

Uppdelningen syns i datan utan undantag: alla 7 `Godtagbar` har
`TillsynsDatum` före 2024-01-01, och alla 209 `Inga avvikelser` /
`Kvarstående avvikelser` ligger efter.

## Ett numeriskt mått vi inte sett tidigare

`AntalKvarstAvvikelser` säger HUR MÅNGA avvikelser som är öppna, inte bara
att någon finns. Fördelningen över hela beståndet 2026-08-02:

    0 → 183    1 → 38    2 → 12    3 → 5    4 → 2    5 → 1

Datamodellen har i dag ingen kolumn för det. Fältet bärs därför vidare i
JSON-utdatan som `openDeviations` per kontroll — lossless och gratis — och
används dessutom som oberoende facit på tolkningen (`check_deviation_count`).
Förslaget till modellen är en nullbar `open_deviations integer` på
`inspections`; det hör hemma på kontrollen, inte på anläggningen, eftersom
det beskriver utfallet av ett bestämt kontrolltillfälle. Ändringen är medvetet
inte gjord här: den berör `schema.sql` och `load_supabase.py`, alltså alla
kommuner, och ska tas som ett eget beslut när en andra källa levererar samma
mått och vi vet vad kolumnen ska betyda tvärs över källor.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Optional

from ..geo import SWEREF99_1630, looks_like_sweden, sweref99_to_wgs84
from ..grading import MAJOR_REMARKS, MINOR_REMARKS, NO_REMARKS, ROUTINE

MUNICIPALITY_CODE = "0882"  # Oskarshamn, SCB REGINA
MUNICIPALITY_NAME = "Oskarshamns kommun"
# Orten, i grundform. Får ALDRIG härledas ur kommunnamnet — "Oskarshamns
# kommun" minus " kommun" ger genitivformen "Oskarshamns".
MUNICIPALITY_CITY = "Oskarshamn"

SERVICE = (
    "https://gisrest.oskarshamn.se/server/rest/services/Externt"
    "/Livsmedelskontroller_2024/MapServer"
)
SOURCE_URL = (
    "https://experience.arcgis.com/experience"
    "/27414acd729747caa686c53857427b74/page/Livsmedelskontroller/"
)

#: Underlagren, med kommunens egna namn i singular. Antalen är räknade över
#: hela beståndet 2026-08-02, inte uppskattade.
#:
#: Kommunen döper lagren i plural ("Restauranger"). Här visas de som
#: verksamhetstyp bredvid `Inriktning`, och då blir plural fel på två sätt:
#: det läser sig illa om en enskild verksamhet, och "Restauranger" bredvid
#: Inriktningens "Restaurang" ser ut som två olika typer.
LAYERS = {
    0: "Restaurang",       # 62
    2: "Café och bageri",  # 16
    3: "Kiosk",            # 10
    4: "Butik",            # 41
    5: "Skolkök",          # 21
    6: "Övrigt",           # 91
}

#: Kommunen projicerar i den lokala zonen 16 30 (EPSG:3010), inte i rikszonen
#: TM. Verifierat mot serverns egen omprojicering: begär man samma lager med
#: `outSR=4326` skiljer transformen här på nionde decimalen, ungefär en
#: tiondels millimeter. Med TM hamnar Oskarshamn i stället utanför Hirtshals.
PROJECTION = SWEREF99_1630

# ---------------------------------------------------------------------------
# Värdeöversättning
#
# Samtliga förekommande värden är uträknade över hela beståndet (241 rader,
# 2026-08-02), inte gissade. Antal inom parentes.
# ---------------------------------------------------------------------------

#: `Bedomning` → vår skala.
#:
#: "Godtagbar" betyder här samma sak som i Linköping: motsatsen till "Ej
#: godtagbar", alltså att verksamheten ÄR godtagbar. Tre oberoende belägg,
#: alla räknade och inte antagna:
#:
#:   1. Lagrets egen renderer grupperar `Godtagbar` och `Inga avvikelser` i
#:      SAMMA klass, med etiketten "Inga avvikelser | Godtagbar".
#:   2. Kommunens läsanvisning: "Godtagbar (visas i blått)", och blått är
#:      enligt oskarshamn.se "Företaget är godtagbart eller eventuella
#:      brister är inte allvarliga".
#:   3. Alla 7 `Godtagbar` har `AntalKvarstAvvikelser = 0`. Noll undantag.
#:
#: "Kvarstående avvikelser" är MINDRE anmärkning, inte allvarlig, trots ordet
#: "kvarstående". Det är inte Linköpings "Kvarstår" (en avvikelse som ÖVERLEVT
#: en uppföljning), utan helt enkelt "det finns öppna avvikelser". Belägg:
#:
#:   * Kommunens läsanvisning ställer "kvarstående avvikelse" mot "inte finns
#:     några avvikelser" som ett tvåvärt val — de två värdena delar hela den
#:     kontrollerade populationen (152 + 57 = 209 av 209). Fanns ett tredje
#:     tillstånd "har avvikelser men är inte uppföljd än" skulle det synas.
#:   * oskarshamn.se beskriver lila som en avvikelse som "kräver uppföljning",
#:     alltså före uppföljningen, inte efter.
#:   * Andelen talar samma språk: 57 av 209 = 27 %. Kommuner som verkligen
#:     mäter kvarstående efter uppföljning landar på under en procent
#:     (Linköping: 4 av 1 241). 27 % är däremot precis nivån för "har
#:     avvikelser" (Karlstad 21 %, Jönköping 14 %).
#:
#: Följden är att ingen verksamhet i Oskarshamn kan nå `major` i dag: källan
#: saknar både föregående kontroll och kontrolltyp, så `grading.py` har inget
#: att härleda allvarsgraden ur. Det är en verklig asymmetri mot Linköping och
#: Stockholm och ska stå på metodiksidan, inte döljas. Adaptern får ändå inte
#: laga den genom att kalla en mindre anmärkning allvarlig — då hade Oskarshamn
#: fått 27 % `major` mot Linköpings 1 %, och jämförbarheten, som är hela
#: produktlöftet, hade fallit åt andra hållet.
ASSESSMENT_MAP = {
    "Inga avvikelser": NO_REMARKS,           # 152 — nya modellen, inga öppna avvikelser
    "Godtagbar": NO_REMARKS,                 #   7 — gamla modellen, godkänd
    "Kvarstående avvikelser": MINOR_REMARKS,  #  57 — nya modellen, öppna avvikelser
    "Ej godtagbar": MAJOR_REMARKS,           #   0 — gamla modellens underkänt
}

#: Värden som betyder ATT BEDÖMNING SAKNAS, inte att allt är bra. `None` är
#: det enda som faktiskt förekommer (25 rader, samtliga utan `TillsynsDatum`).
#: `"Ej bedömd"` finns i lagrets renderer men inte i datan; den står här för
#: att ett känt värde aldrig ska sluta som `UnknownSourceValue`.
NOT_ASSESSED = {None, "", "Ej bedömd"}


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
    #: Antal öppna avvikelser enligt `AntalKvarstAvvikelser`. Unikt för den
    #: här källan; se modulens inledning.
    open_deviations: Optional[int]


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


def query_url(layer: int) -> str:
    """Anropet för ett lager.

    `outSR=3010` begär inhemsk projektion. Servern kan visserligen leverera
    4326 själv — och gör det korrekt, se PROJECTION — men samma regel gäller
    som för Karlstad: hämta i källans eget system och transformera här, så att
    en server som byter avrundningsbeteende inte tyst flyttar restauranger.
    """
    return (
        f"{SERVICE}/{layer}/query"
        "?where=1%3D1&outFields=*&outSR=3010&returnGeometry=true&f=json"
    )


def local_id(attributes: dict) -> str:
    """Stabil lokal identitet för en verksamhet.

    Kommunen publicerar ett riktigt verksamhets-id: `AnlaggningId`, ett GUID
    ur ärendesystemet som överlever ompublicering. Det är alltså inte samma
    läge som i Jönköping, där bara ArcGIS eget `OBJECTID` fanns och identiteten
    därför måste hashas ur namn och adress.

    Här vore den hashen dessutom direkt fel. `Ik Oskarshamn` förekommer två
    gånger på Döderhultsvägen 5A med två skilda `AnlaggningId` — två
    registrerade anläggningar på samma adress. Namn+adress hade slagit ihop
    dem till en.

    ArcGIS radnummer duger inte heller: `ESRI_OID` är unikt per lager, inte
    över tjänsten, och ger bara 91 distinkta värden för 241 rader.

    Klamrarna i GUID:et strippas och versaler behålls, samma form som
    Karlstad använder, så att id:t går att klistra tillbaka in i källan.
    """
    raw = (attributes.get("AnlaggningId") or "").strip()
    if not raw:
        raise UnknownSourceValue("Verksamhet utan AnlaggningId")
    return raw.strip("{}").upper()


def merge_layers(pairs: list) -> list:
    """Slå ihop rader som är samma anläggning i flera lager.

    Två av 241 rader är dubbletter: `Oskarshamns sjukhus café` ligger i både
    Restauranger och Caféer, `Ica Maxi Stormarknad` i både Caféer och Butiker.
    Samma `AnlaggningId`, samma `RadId`, identiska fält i övrigt — kommunen
    har helt enkelt låtit dem synas under båda rubrikerna.

    Rätt hantering är att slå ihop dem och behålla båda kategorierna, inte att
    kasta den ena. Att kasta hade tappat information; att låta dem passera hade
    gett två sidor för samma restaurang med varsin slug.

    Tar (feature, kategori)-par och ger (feature, kategorier)-par i samma
    ordning som första förekomsten.
    """
    order: list = []
    merged: dict = {}
    for feature, category in pairs:
        key = local_id(feature["attributes"])
        if key not in merged:
            order.append(key)
            merged[key] = (feature, [category])
        elif category not in merged[key][1]:
            merged[key][1].append(category)
    return [merged[key] for key in order]


def _types(attributes: dict, categories: list) -> list:
    """Verksamhetstyper, specifikt först och grövre sist.

    `Inriktning` är kommunens egen finindelning och kan bära flera värden i
    ett fält, kommaseparerade: `Bageri, Manuell hantering - Chark, Butik med
    egen beredning`. 64 av 241 rader har fältet tomt, och då är lagrets
    rubrik det enda vi har.
    """
    values = []
    for part in (attributes.get("Inriktning") or "").split(","):
        part = part.strip()
        if part:
            values.append(part)
    values += list(categories)

    types, seen = [], set()
    for value in values:
        if value.casefold() not in seen:
            seen.add(value.casefold())
            types.append(value)
    return types


def normalize_establishment(feature: dict, categories: list) -> NormalizedEstablishment:
    attributes = feature["attributes"]
    id_local = local_id(attributes)

    lat = lng = None
    geometry = feature.get("geometry") or {}
    east, north = geometry.get("x"), geometry.get("y")
    if east is not None and north is not None:
        lat, lng = sweref99_to_wgs84(north, east, PROJECTION)
        if not looks_like_sweden(lat, lng):
            # Hellre ingen position än en position som ljuger. Behövs: en rad
            # (Klintemåla vattenverk) har x=16, y=57 — någon har skrivit
            # WGS84-grader i ett SWEREF-fält, och transformen lägger punkten
            # utanför Afrikas västkust.
            lat = lng = None
        else:
            lat, lng = round(lat, 6), round(lng, 6)

    # Två namnfält: `Objektsnamn` är det utåtriktade namnet ("The Corner"),
    # `AnlaggningsNamn` den juridiska personen ("Mat i Söder AB"). Besökaren
    # söker på skylten, inte på bolaget.
    name = " ".join((attributes.get("Objektsnamn") or "").split())

    address = " ".join((attributes.get("Adress") or "").split())
    ort = " ".join((attributes.get("PostOrt") or "").split())
    if address and ort and ort.casefold() != MUNICIPALITY_CITY.casefold():
        # 53 av 241 verksamheter ligger i en annan tätort än centralorten —
        # Kristdala, Figeholm, Påskallavik, Fårbo, Bockara, Blankaholm. Den
        # uppgiften är värd att behålla.
        #
        # Men bara när den tillför något: sidan skriver ut kommunens namn
        # efter adressen, så ett "Oskarshamn" här skulle ge "Oskarshamn,
        # Oskarshamn".
        address = f"{address}, {ort}"

    return NormalizedEstablishment(
        id_national=f"F-{MUNICIPALITY_CODE}-{id_local}",
        municipality_code=MUNICIPALITY_CODE,
        id_local=id_local,
        name=name,
        street_address=address or None,
        types=_types(attributes, categories),
        lat=lat,
        lng=lng,
    )


def normalize_inspections(feature: dict, establishment_id: str) -> list:
    """Översätt den enda publicerade kontrollen.

    Returnerar en lista trots att det aldrig kan bli mer än en post — hela
    pipelinen räknar med en historik, och en verksamhet utan publicerad
    kontroll ska ge en tom lista, inte ett specialfall.
    """
    attributes = feature["attributes"]
    when = (attributes.get("TillsynsDatum") or "").strip()
    assessment_raw = attributes.get("Bedomning")
    if isinstance(assessment_raw, str):
        assessment_raw = assessment_raw.strip()

    if not when:
        # 25 av 241 rader saknar `TillsynsDatum`, och exakt samma 25 har
        # `Bedomning = null`. De är ALDRIG KONTROLLERADE — nyregistrerade
        # eller vilande — inte godkända. Tom lista ger `verdict = None` och
        # en no-indexerad sida, vilket är sanningen.
        return []

    if assessment_raw in NOT_ASSESSED:
        # Förekommer inte i dag (noll rader har datum utan bedömning). Skulle
        # det börja göra det saknar vi grund för ett omdöme, och då är
        # frånvaro av omdöme rätt svar — inte ett gissat.
        return []

    if assessment_raw not in ASSESSMENT_MAP:
        raise UnknownSourceValue(
            f"Okänd bedömning {assessment_raw!r} för {establishment_id}"
        )

    id_local = local_id(attributes)
    open_deviations = attributes.get("AntalKvarstAvvikelser")

    return [
        NormalizedInspection(
            id_national=f"I-{MUNICIPALITY_CODE}-{id_local}-{when[:10]}",
            establishment_id=establishment_id,
            inspected_at=date.fromisoformat(when[:10]),
            assessment=ASSESSMENT_MAP[assessment_raw],
            # Kommunen redovisar ingen kontrollorsak. Rutin är det enda vi
            # kan påstå, och `grading.py` läser aldrig upp allvarsgraden ur
            # den — bara ner, vilket är rätt riktning att fela åt.
            type=ROUTINE,
            # Varken förhandsbesked eller revision redovisas.
            prenotified=None,
            audit=False,
            on_site=True,
            # Avvikelserna specificeras inte i källan: `AvvikelseAnteckningar`
            # är null i samtliga 241 rader. Tom lista är sanningen här — inte
            # ett tecken på att vi tappat bort något.
            areas=[],
            uncertain=False,
            open_deviations=open_deviations,
        )
    ]


def check_deviation_count(feature: dict, inspections: list) -> None:
    """Stäm av vår tolkning mot kommunens egen räknare.

    `AntalKvarstAvvikelser` är oberoende av `Bedomning` i schemat, men inte i
    datan. Sambandet gällde i 241 fall av 241 vid kartläggningen 2026-08-02:

        Inga avvikelser / Godtagbar  →  alltid 0   (159 rader)
        Kvarstående avvikelser       →  alltid ≥ 1 ( 57 rader: 38/11/5/2/1)

    Räknaren är alltså ett facit på att etiketten lästs rätt, på samma sätt
    som Jönköpings `har_avvikelse`. Slutar det stämma har källan ändrat
    betydelse och vi ska få veta det, inte publicera vidare.

    Ett undantag är känt och hanterat av att kontrollistan är tom: `Mäster
    palm enhet 2` har 2 kvarstående avvikelser men varken `TillsynsDatum`
    eller `Bedomning`. Utan kontrolltillfälle finns inget att stämma av mot,
    och verksamheten blir obedömd.
    """
    if not inspections:
        return

    count = feature["attributes"].get("AntalKvarstAvvikelser")
    if count is None:
        return

    latest = inspections[0]
    if (latest.assessment > NO_REMARKS) != (count > 0):
        raise UnknownSourceValue(
            f"AntalKvarstAvvikelser={count} motsäger bedömningen för "
            f"{latest.establishment_id}"
        )
