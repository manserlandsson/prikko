"""Stadsdelsgränser ur OpenStreetMap, med SCB:s RegSO som påfyllning.

Områdessidorna behöver veta var ett område SLUTAR. Det är hela problemet, och
det finns fyra tänkbara svar. Alla fyra är mätta innan det här valet gjordes,
och mätningarna står nedan.

VAL AV KÄLLA
------------
Kort version: OSM ger den bästa gränsen där den finns, RegSO fyller på där OSM
är tom, och båda måste passera samma namnprov.

`establishments.district` var det billigaste svaret och är tomt. Kolumnen finns
i schema.sql märkt "stadsdel, härledd", men ingen kod skriver den: 0 av 15 921
rader har ett värde. Den är alltså inte en källa, den är en avsikt.

Kommunernas egna stadsdelsindelningar ger de bästa namnen men kostar tolv
integrationer med tolv licenser, och sex av våra tolv kommuner har ingen
stadsdelsindelning alls eftersom de är småstäder.

Kvar står OpenStreetMap, som redan är projektets geokodningskälla (se
licensresonemanget i prikko/geocode.py: samma ODbL, samma attributionskrav,
ingen ny juridisk yta), och SCB:s RegSO, som är CC0.

VAD SOM FAKTISKT FINNS I OSM
----------------------------
Mätt över alla tolv kommuner i augusti 2026. Namnen finns överallt, men nästan
alltid som PUNKTER: Stockholm har 166 noder med place=suburb, Uppsala 41,
Jönköping 60, Karlstad 53. Södermalm, Gamla stan, Luthagen och Haga finns alla
som noder.

Polygoner är en annan sak, och där är utfallet ojämnt:

    Stockholm      56 polygoner, och det är rätt namn hela vägen
    Linköping       2 användbara
    Karlstad        3
    Uppsala         0
    Örebro          0
    Jönköping       0
    Kristinehamn    0
    Oskarshamn      0

En punkt kan inte avgöra var ett område slutar. Att lägga en Voronoi-cell runt
noden och kalla det Södermalm vore att rita en gräns vi hittat på och sedan
publicera den som ett faktum, och det är precis vad huset inte gör: se
regeln om osäker hopkoppling i docs/15, och att verksamhetssidan hellre utelämnar
`geo` i JSON-LD än publicerar en geokodad koordinat som om den vore källans.

Alltså: BARA POLYGONER. Finns ingen polygon finns ingen sida.

VILKA OSM-POLYGONER SOM RÄKNAS
------------------------------
`place=suburb|neighbourhood|quarter|borough|city_district` som väg eller
relation, plus `boundary=administrative` med `admin_level=10`.

admin_level 10 är stadsdel i Stockholm (Södermalm, Gamla stan, Djurgården) och
kvarter i Karlstad. admin_level 9 är något helt annat och är UTESLUTET: det är
distrikt, alltså de gamla församlingarna, och de heter "Kymbo distrikt" och
"Linköpings domkyrkodistrikt". Samma fel som RegSO gör på sina håll, av samma
historiska skäl, och lika osökbart.

REGSO, OCH VARFÖR DEN FÖRST AVFÄRDADES
--------------------------------------
RegSO täcker hela landet med riktiga polygoner, 3 363 områden, och varenda
kommun vi har. Den avfärdades ändå i första versionen av den här filen, och
skälet var namnen: RegSO delar Södermalm i sju områden och kallar inget av dem
Södermalm. De heter Östra Katarina, Västra Katarina, Mellersta Högalid, Norra
Högalid, Norra Sofia, Södra Sofia och Mariatorget. Gamla stan heter Storkyrkan,
Vasastan heter Gustav Vasa plus Västra och Östra Matteus, och Klara-Jacob med
707 verksamheter är det största området i landet räknat på vårt bestånd.

Samma anteckning påstod också att RegSO "ute i förorterna är tvärtom utmärkt".
Det prövades i augusti 2026 mot de arton stadsdelsnamn utanför Stockholm som
har belagd efterfrågan, och påståendet höll bara till hälften. Utfallet står i
docs/30 §11. Kort: 9 av 18 namn finns som RegSO-område med rätt namn, och bara
4 av de 9 bär de 25 verksamheter en sida kräver. Resten är hopslagna
(Rosta-Örnsro, Vasastaden-Hunneberg, Marieberg-Mosås) eller sönderdelade
(fem Luthagen, fyra Gottsunda, tre Kronoparken).

Mätningen som avgör: de hopslagna och kvalificerade namnen kompletteras i
**1 av 18** prövade fraser hos Googles förslagsslutpunkt, och nio av dem svarar
med noll förslag över huvud taget. De rena komponentnamnen bakom dem
kompletteras i **15 av 20**. Efterfrågan sitter alltså på det bara namnet, och
RegSO lämnar inte ut det bara namnet där verksamheterna är som tätast. Det är
samma fel som i innerstaden, bara med geografiska hopslagningar i stället för
församlingsnamn.

Slutsatsen är därför inte att RegSO duger eller inte duger, utan att den duger
NAMN FÖR NAMN. Två prov, båda mekaniska, båda skrivna:

1. NAMNPROVET. Namnet får inte innehålla bindestreck, inte innehålla något ord
   ur REGSO_KVALIFICERARE, och inte innehålla kommunens stad. Bindestrecket är
   SCB:s hopslagningstecken och ingen säger "Kvarnberget-Sommarro-Marieberg".
   Kvalificerarna är väderstrecken och de administrativa orden, alltså precis
   det som skiljer "Västra Flogsta" från Flogsta. Ett namn som faller ersätts
   inte av sin egen komponent: att skära "Rosta" ur "Rosta-Örnsro" och rita
   RegSO:s yta under det namnet vore att publicera en gräns för Rosta som SCB
   aldrig påstått, alltså samma sorts påhitt som en Voronoi-cell.

2. RÖRPROVET. Ett RegSO-område tas bara in om det inte rör vid någon
   OSM-polygon i kommunen. Två källor som ritar samma trakt ritar den olika, och
   där ytorna korsar varandra hamnar en punkt i båda och ägaren avgörs av vilken
   yta som råkar vara minst. Där de inte rör varandra kan de inte vara oense.
   Provet gör också att innerstaden fortsätter komma ur OSM utan en enda
   handplockad rad: samtliga femtionio församlingsnamn i Stockholms RegSO faller
   på det, för det är just där OSM har full täckning.

Efter båda proven och tröskeln i omraden.ts återstår 34 områden, 21 i Stockholm
och 13 i de fem kommuner som inte hade något. Deras namn mättes i sin helhet, ett
för ett, och 32 av 34 kompletteras. De två som inte gör det står namngivna i
docs/30 §11.

RegSO är dessutom fortfarande rätt källa den dag vi vill räkna STATISTIK per
område. Den är byggd för det och den kopplar till SCB:s befolkningstal.

KOMMUNEN ÄR OCKSÅ ETT OMRÅDE
----------------------------
"Om man söker på jönköping, så är väl det hela staden, den ska väl skuggas in
som ett filter då." Ägaren har rätt. Kartan skuggar allt utanför ett valt
område och listan filtreras på samma polygon; en kommun i söket flyttade förut
bara kameran, med motiveringen att en kommun saknar polygon. Motiveringen var
sann om VÅR DATA och inte om världen.

Svenska kommuner ligger i OSM som relationer med `boundary=administrative` och
`admin_level=7`. Det är kontrollerat och inte gissat: samtliga tolv kommuner
slogs upp på `ref:scb` utan nivåfilter i augusti 2026, och alla tolv svarade med
exakt EN relation, alla med `boundary=administrative`, `type=boundary` och
`admin_level=7`. Ingen kommun har någon annan nivå med samma SCB-kod.

Relationen hämtas i samma anrop som förut bara slog upp områdes-id:t åt
stadsdelsfrågan, alltså utan ett enda extra anrop per kommun.

TRE GRINDAR, OCH DE ÄR VIKTIGARE ÄN HÄMTNINGEN
----------------------------------------------
En kommungräns som är fel skuggar bort halva landet, och de två felen drar åt
var sitt håll: en yta kan vara för LITEN eller på fel plats, och den kan vara
för STOR. En för stor yta ser bedrägligt riktig ut, eftersom den rymmer varenda
verksamhet med god marginal.

1. NAMNPROVET. Relationens namn måste stämma mot kommunens eget namn, inte
   innehålla det. Ett innehållsprov hade släppt igenom "Stockholms län" och
   "Norra Stockholm". Jämförelsen görs på grundnamnet, alltså namnet utan
   efterledet och utan genitiv-s, eftersom OSM skriver "Stockholms kommun" där
   vi skriver "Stockholms stad". Grundnamnet måste vara IDENTISKT med vårt.

2. TÄCKNINGSPROVET, mot en yta som är för liten. Andelen av kommunens
   verksamheter med koordinat som ligger innanför ytan måste nå
   KOMMUN_TACKNING. Mätt i augusti 2026 ligger samtliga åtta kommuner som har
   koordinater på 1,0000, alltså varenda verksamhet innanför. Spärren står
   ändå lägre än så: en enstaka verksamhet kan ha geokodats en meter fel, och
   Stockholm har en verksamhet som ligger EN METER från gränsen.

3. GRANNPROVET, mot en yta som är för stor. Ingen verksamhet från någon ANNAN
   av våra kommuner får ligga innanför. Provet finns för att täckningsprovet är
   blint åt det hållet: hade Karlstad fått Värmlands läns yta hade den rymt
   varenda Karlstadsverksamhet och passerat. Nu faller den i stället på
   Kristinehamns verksamheter, och Kalmar län faller på Oskarshamns. Mätt
   utfall: noll främmande verksamheter i alla tolv ytor.

En kommun utan godkänd yta får INGEN yta. Det är ett fullgott utfall och ingen
sämre yta söks upp i stället.

FÖRENKLINGEN
------------
En kommungräns är hundra gånger större än en stadsdel. Rått väger de tolv
konturerna 550 kilobyte, och Jönköping ensam 127. Konturen ritas på zoom 5 till
14 och behöver inte vara metersann, så den förenklas med Douglas-Peucker i ett
metermått, se simplify_ring.

Toleransen är KOMMUN_TOLERANS_M och sattes av en mätning, inte av en smak: vid
30 meter faller Stockholm ur täckningsprovet, eftersom en verksamhet ligger en
meter från gränsen. Tio meter är två bildpunkter vid zoom 14 på våra breddgrader
och lämnar konturerna på 30 procent av råvikten.

Skärgårdskommuner är den svåra sorten, och en naiv förenkling raderar små öar
eller slår ihop dem med fastlandet. Två saker hindrar det. Ringarna förenklas
var för sig, så två ringar kan aldrig smälta ihop. Och en ring som skulle
krympa under fyra punkter behålls OFÖRENKLAD i stället för att kastas: en ö som
väger tvåhundra byte är inte värd att förlora. Antalet ytterringar är därför
detsamma före och efter i alla tolv kommuner, från Höganäs enda till Uppsalas
tio.

Körs med:

    python3 pipeline/omraden.py

Skriver site/src/data/omraden/<kommun>.json. Filerna versionshanteras och bygget
läser dem genom site/src/lib/omraden.ts.
"""

from __future__ import annotations

import json
import math
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT.parent / "site" / "src" / "data"
OUT_DIR = DATA_DIR / "omraden"

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"

ENDPOINTS = (
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
)

#: SCB:s öppna geodata. CC0, alltså inget attributionskrav, men källan skrivs ut
#: ändå: ett tal utan namngiven källa finns inte på den här sajten.
REGSO_WFS = "https://geodata.scb.se/geoserver/stat/wfs"
REGSO_LAYER = "stat:RegSO_2025"

#: Källorna som får rita en gräns, med det som måste stå där gränsen visas.
SOURCES = {
    "osm": {
        "name": "OpenStreetMap",
        "licence": "ODbL 1.0",
        "attribution": "© OpenStreetMap contributors",
    },
    "regso": {
        "name": "SCB, regionala statistikområden (RegSO) 2025",
        "licence": "CC0 1.0",
        "attribution": "Källa: Statistiska centralbyrån",
    },
}

#: Ytor vi accepterar. Se modulens huvud för varför admin_level 9 inte står här.
PLACE_KINDS = "^(suburb|neighbourhood|quarter|borough|city_district)$"

#: Koordinaterna avrundas till hundratusendels grad, alltså ungefär en meter.
#: Samma precision som kartans punkter i site/src/lib/map-data.ts. En stadsdel
#: behöver inte mätas noggrannare än en verksamhet placeras.
PRECISION = 5

#: Hur långt kommunkonturen får flytta sig när den förenklas, i meter.
#:
#: Satt av en mätning och inte av en smak. Vid 30 meter faller Stockholm ur
#: täckningsprovet, eftersom en verksamhet ligger en meter från kommungränsen.
#: Vid 10 meter ligger alla åtta kommuner med koordinater kvar på full täckning
#: och de tolv konturerna väger tillsammans 30 procent av råvikten.
#:
#: Tio meter är ungefär två bildpunkter vid zoom 14 på våra breddgrader, alltså
#: osynligt vid det djupaste zoomsteg konturen ritas i.
KOMMUN_TOLERANS_M = 10.0

#: Andelen av kommunens verksamheter med koordinat som måste ligga innanför
#: kommunytan för att ytan ska få publiceras.
#:
#: Mätt utfall i augusti 2026: 1,0000 i alla åtta kommuner som har koordinater,
#: alltså varenda verksamhet innanför. Spärren står lägre än det mätta för att
#: en enstaka verksamhet kan vara geokodad någon meter fel, och högre än vad
#: någon FELAKTIG yta kan nå: en grannkommuns yta rymmer nästan ingenting av
#: våra punkter och landar nära noll, inte nära ett.
KOMMUN_TACKNING = 0.995

#: Efterled som skiljer kommunens namn från ortens. OSM skriver "Stockholms
#: kommun" där vi skriver "Stockholms stad", och båda menar samma sak.
KOMMUN_EFTERLED = frozenset({"kommun", "stad"})

#: Namn som avslöjar att objektet är ett distrikt och inte en stadsdel. OSM har
#: enstaka distrikt taggade som place i stället för som admin_level 9, och de
#: ska bort på samma grund som resten av dem.
#:
#: Ändelsen räcker och mellanslaget före får inte krävas. Linköping skriver
#: "Linköpings domkyrkodistrikt" i ett ord, alltså slank den igenom ett filter
#: som letade efter " distrikt".
NAME_BLOCKLIST = ("distrikt",)

#: Ord som avslöjar att SCB har namngett en STATISTIKENHET och inte en plats.
#:
#: Två sorter, och båda faller på samma mätning. Väderstrecken och lägesorden
#: delar en plats i bitar som ingen ber om: `restauranger västra flogsta`,
#: `restauranger norra sävja` och `restauranger sydöstra luthagen` svarar alla
#: med noll förslag, medan Flogsta, Sävja och Luthagen var för sig
#: kompletteras. De administrativa orden gör tvärtom en hel stad till ett
#: område: "Örebro city", "Jönköping centrum Väster", "Valkebo omland".
#:
#: Listan är ett prov och ingen redigering. Ett namn som fastnar här får ingen
#: sida alls; det byts aldrig mot ett kortare namn, eftersom ytan då skulle
#: bära ett namn källan inte satt på den.
REGSO_KVALIFICERARE = frozenset(
    """
    norra södra östra västra mellersta främre bortre inre yttre nedre övre
    nordvästra nordöstra sydvästra sydöstra norr söder väster öster
    gamla nya centrum centrala city omland landsbygd landsbygder
    industriområde distrikt kyrka församling
    """.split()
)


def overpass(query: str, tries: int = 6) -> dict:
    """Ett anrop mot Overpass, med spegel och väntan. Samma form som geocode.py."""
    body = urllib.parse.urlencode({"data": query}).encode("utf-8")
    last = "okänt fel"
    for attempt in range(tries):
        url = ENDPOINTS[attempt % len(ENDPOINTS)]
        request = urllib.request.Request(url, data=body, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(request, timeout=900) as response:
                raw = response.read().decode("utf-8", "replace")
            if raw.lstrip().startswith("{"):
                return json.loads(raw)
            last = raw.strip()[:200]
        except urllib.error.HTTPError as exc:
            last = f"HTTP {exc.code}"
        except Exception as exc:  # noqa: BLE001
            last = repr(exc)
        wait = 10 * (attempt + 1)
        print(f"  Overpass svarade inte ({last}); väntar {wait} s", file=sys.stderr)
        time.sleep(wait)
    raise SystemExit(f"Overpass gav inget svar: {last}")


SWEDISH = {"å": "a", "ä": "a", "ö": "o", "é": "e", "è": "e", "ü": "u", "ø": "o", "æ": "a"}


def slugify(name: str) -> str:
    """URL-segment ur ett namn. Ordagrant samma regler som prikko/text.py."""
    lowered = name.lower()
    for char, replacement in SWEDISH.items():
        lowered = lowered.replace(char, replacement)
    ascii_only = unicodedata.normalize("NFKD", lowered).encode("ascii", "ignore").decode()
    out = []
    for char in ascii_only:
        out.append(char if char.isalnum() else "-")
    slug = "".join(out)
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-") or "namnlos"


def kommun_relation(code: str) -> dict:
    """Kommunens gränsrelation MED geometri. Slås upp på SCB-kod, aldrig på namn.

    Ett anrop, två användningar. Relationens id blir Overpass områdes-id åt
    stadsdelsfrågan, precis som förut, och dess geometri blir kommunens egen
    yta. Att hämta den två gånger hade gett två sanningar om samma gräns, och
    Overpass ska inte betala för vår bokföring.

    Nivån filtreras INTE i frågan. Vi vill se vad som faktiskt ligger under
    SCB-koden och inte bara det vi hoppades hitta; nivån prövas nedan i stället,
    och ett oväntat svar ska stanna körningen i stället för att tyst försvinna.
    """
    payload = overpass(
        f'[out:json][timeout:600];relation["ref:scb"="{code}"];out geom;'
    )
    relations = payload.get("elements") or []
    if len(relations) != 1:
        raise SystemExit(f"Hittade {len(relations)} kommungränser för {code}, väntade en.")
    return relations[0]


def kommun_area(relation: dict) -> int:
    """Overpass områdes-id ur relationens id."""
    return 3600000000 + relation["id"]


def rings_from_way(element: dict) -> tuple[list, list] | None:
    geometry = element.get("geometry") or []
    if len(geometry) < 4:
        return None
    ring = [(p["lon"], p["lat"]) for p in geometry]
    if ring[0] != ring[-1]:
        return None
    return ([ring], [])


def rings_from_relation(element: dict) -> tuple[list, list] | None:
    """Syr ihop relationens medlemsvägar till slutna ringar.

    En multipolygonrelation lämnar ut sina kanter som lösa remsor i godtycklig
    ordning och godtycklig riktning. Remsorna måste kedjas ihop ände mot ände
    tills ringen sluter sig; en remsa som inte går att foga in hör till en annan
    ring i samma relation.
    """
    outer: list = []
    inner: list = []
    for role, bucket in (("outer", outer), ("inner", inner)):
        segments = []
        for member in element.get("members", []):
            if member.get("type") != "way" or not member.get("geometry"):
                continue
            if (member.get("role") or "outer") != role:
                continue
            segments.append([(p["lon"], p["lat"]) for p in member["geometry"]])

        while segments:
            current = segments.pop(0)
            joined = True
            while joined and current[0] != current[-1]:
                joined = False
                for i, segment in enumerate(segments):
                    if segment[0] == current[-1]:
                        current = current + segment[1:]
                    elif segment[-1] == current[-1]:
                        current = current + segment[::-1][1:]
                    elif segment[-1] == current[0]:
                        current = segment[:-1] + current
                    elif segment[0] == current[0]:
                        current = segment[::-1][:-1] + current
                    else:
                        continue
                    segments.pop(i)
                    joined = True
                    break
            if current[0] == current[-1] and len(current) >= 4:
                bucket.append(current)

    return (outer, inner) if outer else None


def round_ring(ring: Iterable[tuple[float, float]]) -> list:
    """Avrundar och tar bort punkter som blivit identiska på vägen."""
    out: list = []
    for lon, lat in ring:
        point = [round(lon, PRECISION), round(lat, PRECISION)]
        if not out or out[-1] != point:
            out.append(point)
    if len(out) >= 2 and out[0] != out[-1]:
        out.append(list(out[0]))
    return out


def ring_area(ring: list) -> float:
    """Skolexemplets area. Bara för att rangordna storlek, aldrig för att mäta."""
    total = 0.0
    for i in range(len(ring)):
        x1, y1 = ring[i]
        x2, y2 = ring[(i + 1) % len(ring)]
        total += x1 * y2 - x2 * y1
    return abs(total) / 2


def wanted(tags: dict) -> bool:
    name = tags.get("name")
    if not name:
        return False
    if any(name.endswith(bad) for bad in NAME_BLOCKLIST):
        return False
    if tags.get("place"):
        return True
    return tags.get("boundary") == "administrative" and tags.get("admin_level") == "10"


def fetch(area: int) -> list:
    payload = overpass(
        f"[out:json][timeout:600];"
        f'(way["place"~"{PLACE_KINDS}"](area:{area});'
        f'relation["place"~"{PLACE_KINDS}"](area:{area});'
        f'relation["boundary"="administrative"]["admin_level"="10"](area:{area}););'
        f"out geom;"
    )

    areas = []
    seen: dict[str, dict] = {}
    for element in payload.get("elements", []):
        tags = element.get("tags") or {}
        if not wanted(tags):
            continue
        built = (
            rings_from_way(element)
            if element["type"] == "way"
            else rings_from_relation(element)
        )
        if not built:
            continue
        outer = [round_ring(r) for r in built[0]]
        inner = [round_ring(r) for r in built[1]]
        outer = [r for r in outer if len(r) >= 4]
        if not outer:
            continue

        name = tags["name"]
        slug = slugify(name)
        record = {
            "name": name,
            "slug": slug,
            "source": "osm",
            "ref": f"{element['type']}/{element['id']}",
            "size": sum(ring_area(r) for r in outer),
            "outer": outer,
            "inner": [r for r in inner if len(r) >= 4],
        }

        # Samma namn två gånger i en kommun kan inte ge två URL:er. OSM har
        # dubbletter där både en väg och en relation bär samma stadsdel. Den
        # med flest punkter i sin kontur är den mest detaljerade och vinner.
        previous = seen.get(slug)
        if previous is not None:
            if sum(len(r) for r in record["outer"]) <= sum(len(r) for r in previous["outer"]):
                continue
            areas.remove(previous)
        seen[slug] = record
        areas.append(record)

    areas.sort(key=lambda a: a["slug"])
    return areas


# ---------------------------------------------------------------------------
# RegSO, och de två proven den måste passera
# ---------------------------------------------------------------------------


def regso_name_holds(name: str, city: str) -> bool:
    """Är det här ett platsnamn eller en statistikenhet? Se modulens huvud."""
    if "-" in name:
        return False
    words = [w.lower() for w in name.split() if w]
    if not words:
        return False
    if any(w in REGSO_KVALIFICERARE for w in words):
        return False
    return city.lower() not in words


def in_ring(x: float, y: float, ring: list) -> bool:
    """Strålmetoden. Samma test som inRing i site/src/lib/omraden.ts."""
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def in_area(area: dict, x: float, y: float) -> bool:
    if not any(in_ring(x, y, r) for r in area["outer"]):
        return False
    return not any(in_ring(x, y, r) for r in area["inner"])


def bbox(area: dict) -> tuple[float, float, float, float]:
    xs = [p[0] for r in area["outer"] for p in r]
    ys = [p[1] for r in area["outer"] for p in r]
    return (min(xs), min(ys), max(xs), max(ys))


def _crosses(p1: list, p2: list, p3: list, p4: list) -> bool:
    def side(a: list, b: list, c: list) -> float:
        return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])

    d1, d2 = side(p3, p4, p1), side(p3, p4, p2)
    d3, d4 = side(p1, p2, p3), side(p1, p2, p4)
    return (d1 > 0) != (d2 > 0) and (d3 > 0) != (d4 > 0)


def touches(a: dict, b: dict) -> bool:
    """Rör ytorna varandra? Rörprovet i modulens huvud står och faller med det.

    Tre frågor i stigande kostnad: ligger omslutande rutorna isär, ligger något
    hörn inne i den andra ytan, korsar någon kant någon annan kant. Den sista
    behövs för att två ytor kan skära varandra utan att ett enda hörn hamnar
    inuti, och den är billig nog: Stockholm har 3 400 OSM-hörn mot 6 700 hos
    RegSO och rutgallret sållar bort nästan alla par.
    """
    aw, as_, ae, an = bbox(a)
    bw, bs, be, bn = bbox(b)
    if ae < bw or be < aw or an < bs or bn < as_:
        return False

    for ring in a["outer"] + a["inner"]:
        for x, y in ring:
            if in_area(b, x, y):
                return True
    for ring in b["outer"] + b["inner"]:
        for x, y in ring:
            if in_area(a, x, y):
                return True

    for ra in a["outer"] + a["inner"]:
        for i in range(len(ra) - 1):
            p1, p2 = ra[i], ra[i + 1]
            lo_x, hi_x = min(p1[0], p2[0]), max(p1[0], p2[0])
            lo_y, hi_y = min(p1[1], p2[1]), max(p1[1], p2[1])
            for rb in b["outer"] + b["inner"]:
                for j in range(len(rb) - 1):
                    p3, p4 = rb[j], rb[j + 1]
                    if max(p3[0], p4[0]) < lo_x or min(p3[0], p4[0]) > hi_x:
                        continue
                    if max(p3[1], p4[1]) < lo_y or min(p3[1], p4[1]) > hi_y:
                        continue
                    if _crosses(p1, p2, p3, p4):
                        return True
    return False


def regso_rings(geometry: dict) -> tuple[list, list]:
    """GeoJSON-geometrin till samma ringar som OSM-grenen lämnar."""
    if geometry["type"] == "Polygon":
        polygons = [geometry["coordinates"]]
    else:
        polygons = geometry["coordinates"]
    outer: list = []
    inner: list = []
    for rings in polygons:
        for i, ring in enumerate(rings):
            (outer if i == 0 else inner).append(round_ring(ring))
    return ([r for r in outer if len(r) >= 4], [r for r in inner if len(r) >= 4])


def fetch_regso(code: str, city: str) -> list:
    """Kommunens RegSO-områden som passerar namnprovet, ofiltrerade av läge."""
    query = urllib.parse.urlencode(
        {
            "service": "WFS",
            "version": "2.0.0",
            "request": "GetFeature",
            "typeNames": REGSO_LAYER,
            "outputFormat": "application/json",
            "srsName": "EPSG:4326",
            "CQL_FILTER": f"kommunkod='{code}'",
        }
    )
    request = urllib.request.Request(
        f"{REGSO_WFS}?{query}", headers={"User-Agent": USER_AGENT}
    )
    with urllib.request.urlopen(request, timeout=300) as response:
        payload = json.loads(response.read().decode("utf-8", "replace"))

    areas = []
    for feature in payload.get("features", []):
        props = feature.get("properties") or {}
        name = props.get("regsonamn")
        if not name or not regso_name_holds(name, city):
            continue
        outer, inner = regso_rings(feature["geometry"])
        if not outer:
            continue
        areas.append(
            {
                "name": name,
                "slug": slugify(name),
                "source": "regso",
                "ref": props.get("regsokod", ""),
                "size": sum(ring_area(r) for r in outer),
                "outer": outer,
                "inner": inner,
            }
        )
    return areas


def merge(osm_areas: list, regso_areas: list) -> list:
    """OSM först, RegSO bara där den varken rör en OSM-yta eller tar dess namn."""
    taken = {a["slug"] for a in osm_areas}
    out = list(osm_areas)
    for candidate in regso_areas:
        if candidate["slug"] in taken:
            continue
        if any(touches(candidate, other) for other in osm_areas):
            continue
        taken.add(candidate["slug"])
        out.append(candidate)
    out.sort(key=lambda a: a["slug"])
    return out


# ---------------------------------------------------------------------------
# Kommunen som område: förenklingen och de tre grindarna
# ---------------------------------------------------------------------------


#: Meter per grad latitud. Jordens omkrets delad med 360, avrundad. Räcker gott
#: för att mäta hur långt en förenklad kontur flyttat sig; det här är ett
#: felmått och ingen kartprojektion.
METER_PER_GRAD = 111320.0


def _meter(ring: list, lat0: float) -> list:
    """Ringen i ett plant metermått runt sin egen medelbredd.

    Longituderna krymper med cosinus för breddgraden, annars vore en grad
    öst-väst dubbelt så lång som en grad nord-syd på våra breddgrader och
    förenklingen hade ätit mer av nord-sydliga kanter än av öst-västliga.
    """
    k = math.cos(math.radians(lat0)) * METER_PER_GRAD
    return [(p[0] * k, p[1] * METER_PER_GRAD) for p in ring]


def _avstand_till_segment(p: tuple, a: tuple, b: tuple) -> float:
    """Punktens avstånd till STRÄCKAN ab, inte till linjen genom a och b."""
    dx, dy = b[0] - a[0], b[1] - a[1]
    if dx == 0.0 and dy == 0.0:
        return math.hypot(p[0] - a[0], p[1] - a[1])
    t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    return math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))


def simplify_ring(ring: list, tolerance_m: float) -> tuple[list, float]:
    """Douglas-Peucker på en SLUTEN ring. Lämnar ringen och största avvikelsen.

    Tre saker skiljer den här från lärobokens variant, och alla tre finns för
    att en kommungräns inte är en linje utan en ring:

    1. TVÅ ANKARE. Lärobokens DP ankrar i kedjans två ändar, och i en ring är
       de samma punkt. Då blir hela ringen ett enda segment av längd noll och
       varje annan punkt ligger "för långt bort", vilket ger ett godtyckligt
       resultat. Ringen delas därför i två kedjor vid den punkt som ligger
       längst från startpunkten.

    2. INGEN REKURSION. Jönköpings ytterring har 6 400 punkter och en
       obalanserad delning hade nått Pythons rekursionstak. Stacken är egen.

    3. INGEN RING GÅR FÖRLORAD. Skulle förenklingen krympa ringen under fyra
       punkter lämnas den OFÖRENKLAD tillbaka. En ö som väger tvåhundra byte
       är inte värd att förlora, och det är just småöarna som en naiv
       förenkling raderar.
    """
    if len(ring) < 5:
        return list(ring), 0.0

    lat0 = sum(p[1] for p in ring) / len(ring)
    pts = _meter(ring, lat0)
    sist = len(ring) - 1

    # Ankare två: punkten längst från startpunkten. Se punkt 1 ovan.
    far = max(
        range(1, sist),
        key=lambda i: math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]),
    )

    keep = [False] * len(ring)
    keep[0] = keep[far] = keep[sist] = True

    avvikelse = 0.0
    stack = [(0, far), (far, sist)]
    while stack:
        lo, hi = stack.pop()
        if hi <= lo + 1:
            continue
        a, b = pts[lo], pts[hi]
        varst, vid = -1.0, -1
        for i in range(lo + 1, hi):
            d = _avstand_till_segment(pts[i], a, b)
            if d > varst:
                varst, vid = d, i
        if varst > tolerance_m:
            keep[vid] = True
            stack.append((lo, vid))
            stack.append((vid, hi))
        elif varst > avvikelse:
            avvikelse = varst

    kvar = [ring[i] for i in range(len(ring)) if keep[i]]
    if len(kvar) < 4:
        return list(ring), 0.0
    return kvar, avvikelse


def simplify_rings(rings: list, tolerance_m: float) -> tuple[list, float]:
    """Varje ring för sig, så att två ringar aldrig kan smälta ihop."""
    ut = []
    varst = 0.0
    for ring in rings:
        förenklad, avvikelse = simplify_ring(ring, tolerance_m)
        varst = max(varst, avvikelse)
        förenklad = round_ring(förenklad)
        if len(förenklad) >= 4:
            ut.append(förenklad)
    return ut, varst


def kommun_grundnamn(name: str) -> str:
    """Namnet utan efterled och utan genitiv-s, gement.

    "Stockholms kommun", "Stockholms stad" och "Stockholm" ger alla "stockholm".
    "Stockholms län" ger "stockholms län" och kan därmed aldrig råka bli lika
    med någon av dem.
    """
    words = [w for w in name.lower().replace("\u00a0", " ").split() if w]
    while words and words[-1] in KOMMUN_EFTERLED:
        words.pop()
    if not words:
        return ""
    if len(words[-1]) > 1 and words[-1].endswith("s"):
        words[-1] = words[-1][:-1]
    return " ".join(words)


def kommun_namn_haller(osm_name: str, name: str, city: str) -> bool:
    """Grind 1. Namnet måste STÄMMA mot kommunens, inte innehålla det.

    Ett innehållsprov hade släppt igenom "Stockholms län" och "Norra
    Stockholm", och båda ytorna skuggar bort halva landet.
    """
    grund = kommun_grundnamn(osm_name or "")
    if not grund:
        return False
    return grund in {kommun_grundnamn(name), kommun_grundnamn(city)}


def tackning(area: dict, points: list) -> float | None:
    """Grind 2. Andelen verksamheter innanför ytan, None utan koordinater.

    None är inte ett underkännande. Borgholm, Höganäs, Lomma och Svenljunga
    lämnar inte ut en enda koordinat, se bounding_box i prikko/wikidatanamn.py.
    Det säger något om kommunens källa och ingenting om kommunens gräns, så
    provet är tomt där i stället för fällande.
    """
    if not points:
        return None
    return sum(1 for x, y in points if in_area(area, x, y)) / len(points)


def frammande_innanfor(area: dict, others: dict) -> list:
    """Grind 3. Andra kommuners verksamheter som ligger innanför ytan.

    Provet mot en yta som är för STOR, alltså det fel täckningsprovet är blint
    för: ett län rymmer varenda verksamhet i sin egen kommun och passerar
    därmed grind 2 med glans. Det faller här i stället, på grannkommunen.
    """
    träffar = []
    for slug, points in others.items():
        antal = sum(1 for x, y in points if in_area(area, x, y))
        if antal:
            träffar.append((slug, antal))
    return sorted(träffar)


def kommunyta(relation: dict, municipality: dict, points: list, others: dict) -> dict | None:
    """Kommunens yta, förenklad och prövad. None när något prov faller.

    Skriver varje utfall till stderr, godkänt som fällt. En yta som försvinner
    tyst är samma sak som en gräns ingen kan felsöka.
    """
    slug = municipality["slug"]
    tags = relation.get("tags") or {}
    ref = f"relation/{relation['id']}"

    nivå = tags.get("admin_level")
    if tags.get("boundary") != "administrative" or nivå != "7":
        print(
            f"  ingen kommunyta: {ref} är boundary={tags.get('boundary')} "
            f"admin_level={nivå}, väntade administrative/7",
            file=sys.stderr,
        )
        return None

    if not kommun_namn_haller(tags.get("name", ""), municipality["name"], municipality["city"]):
        print(
            f"  ingen kommunyta: {ref} heter {tags.get('name')!r} och inte "
            f"{municipality['name']!r}",
            file=sys.stderr,
        )
        return None

    built = rings_from_relation(relation)
    if not built:
        print(f"  ingen kommunyta: {ref} sluter ingen ytterring", file=sys.stderr)
        return None

    rå_outer = [r for r in (round_ring(x) for x in built[0]) if len(r) >= 4]
    rå_inner = [r for r in (round_ring(x) for x in built[1]) if len(r) >= 4]
    if not rå_outer:
        print(f"  ingen kommunyta: {ref} har ingen ytterring med fyra punkter", file=sys.stderr)
        return None

    outer, av_outer = simplify_rings(rå_outer, KOMMUN_TOLERANS_M)
    inner, av_inner = simplify_rings(rå_inner, KOMMUN_TOLERANS_M)
    if len(outer) != len(rå_outer) or len(inner) != len(rå_inner):
        # Kan inte hända så länge simplify_ring lämnar korta ringar oförenklade,
        # men en ring som tappas bort är precis det fel som inte får ske tyst.
        print(
            f"  ingen kommunyta: förenklingen tappade ringar, "
            f"{len(rå_outer)}/{len(rå_inner)} blev {len(outer)}/{len(inner)}",
            file=sys.stderr,
        )
        return None

    area = {"outer": outer, "inner": inner}

    andel = tackning(area, points)
    if andel is not None and andel < KOMMUN_TACKNING:
        print(
            f"  ingen kommunyta: bara {andel:.4f} av verksamheterna ligger innanför "
            f"{ref}, kräver {KOMMUN_TACKNING}",
            file=sys.stderr,
        )
        return None

    främmande = frammande_innanfor(area, others)
    if främmande:
        visas = ", ".join(f"{s}: {n}" for s, n in främmande)
        print(f"  ingen kommunyta: {ref} rymmer andra kommuners verksamheter ({visas})", file=sys.stderr)
        return None

    print(
        f"  kommunyta {ref}: {len(outer)} ytterringar, {len(inner)} hål, "
        f"täckning {'utan koordinater' if andel is None else format(andel, '.4f')}, "
        f"flyttad högst {max(av_outer, av_inner):.1f} m",
        file=sys.stderr,
    )

    # Namnet tas ur VÅR data och inte ur OSM, till skillnad från stadsdelarnas.
    # Skälet är att sajten redan har ett namn på kommunen och säger "Stockholms
    # stad" där OSM säger "Stockholms kommun". Namnprovet ovan har just visat
    # att de två menar samma sak, så valet är inte en redigering av källan utan
    # ett val mellan två namn som båda är riktiga.
    return {
        "name": municipality["name"],
        "slug": slug,
        "source": "osm",
        "ref": ref,
        "size": sum(ring_area(r) for r in outer),
        "outer": outer,
        "inner": inner,
    }


def las_kommuner() -> list[tuple[dict, list]]:
    """Kommunerna ur site/src/data, med verksamheternas koordinater.

    Läses i sin helhet FÖRE första Overpass-anropet. Grannprovet behöver alla
    tolv kommuners punkter för att kunna pröva den första kommunens yta.
    """
    ut = []
    for path in sorted(DATA_DIR.glob("*.json")):
        dataset = json.loads(path.read_text(encoding="utf-8"))
        municipality = dataset.get("municipality")
        if not municipality:
            continue
        points = [
            (e["lng"], e["lat"])
            for e in dataset.get("establishments", [])
            if e.get("lat") is not None and e.get("lng") is not None
        ]
        ut.append((municipality, points))
    return ut


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    fetched_at = datetime.now(timezone.utc).isoformat(timespec="seconds")

    kommuner = las_kommuner()
    punkter = {m["slug"]: pts for m, pts in kommuner}

    for municipality, points in kommuner:
        code = municipality["code"]
        slug = municipality["slug"]
        city = municipality["city"]

        print(f"{slug} ({code})", file=sys.stderr)

        # Ett anrop, två användningar: områdes-id åt stadsdelsfrågan och
        # geometri åt kommunens egen yta. Se kommun_relation.
        relation = kommun_relation(code)
        time.sleep(5)

        kommun = kommunyta(
            relation,
            municipality,
            points,
            {s: p for s, p in punkter.items() if s != slug and p},
        )

        osm_areas = fetch(kommun_area(relation))
        regso_areas = fetch_regso(code, city)
        areas = merge(osm_areas, regso_areas)
        print(
            f"  {len(osm_areas)} ur OSM, {len(regso_areas)} RegSO klarade namnprovet, "
            f"{len(areas) - len(osm_areas)} av dem klarade rörprovet",
            file=sys.stderr,
        )

        out = OUT_DIR / f"{slug}.json"
        if not areas and not kommun:
            # Ingen fil alls hellre än en tom. En tom fil läses som "vi har
            # tittat och det finns inget", vilket är sant i dag och blir en
            # tyst lögn den dag källorna växt men filen ligger kvar.
            if out.exists():
                out.unlink()
            time.sleep(5)
            continue

        used = sorted({a["source"] for a in areas} | ({kommun["source"]} if kommun else set()))
        fil = {
            "municipality": {"code": code, "slug": slug},
            "sources": {key: {**SOURCES[key], "fetchedAt": fetched_at} for key in used},
            "areas": areas,
        }
        if kommun:
            # Kommunen ligger bredvid stadsdelarna och inte bland dem. Den är
            # inget utsnitt av kommunen, den ÄR kommunen, och en yta i `areas`
            # hade blivit en områdessida som täcker hela sin egen kommun.
            fil["municipalityArea"] = kommun

        out.write_text(
            json.dumps(fil, ensure_ascii=False, separators=(",", ":")) + "\n",
            encoding="utf-8",
        )
        time.sleep(5)


if __name__ == "__main__":
    main()
