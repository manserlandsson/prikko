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

Körs med:

    python3 pipeline/omraden.py

Skriver site/src/data/omraden/<kommun>.json. Filerna versionshanteras och bygget
läser dem genom site/src/lib/omraden.ts.
"""

from __future__ import annotations

import json
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


def kommun_area(code: str) -> int:
    """Overpass områdes-id för kommunen. Slås upp på SCB-kod, aldrig på namn."""
    payload = overpass(
        f'[out:json][timeout:180];relation["ref:scb"="{code}"]["admin_level"="7"];out ids;'
    )
    relations = payload.get("elements") or []
    if len(relations) != 1:
        raise SystemExit(f"Hittade {len(relations)} kommungränser för {code}, väntade en.")
    return 3600000000 + relations[0]["id"]


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


def fetch(code: str) -> list:
    area = kommun_area(code)
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


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    fetched_at = datetime.now(timezone.utc).isoformat(timespec="seconds")

    for path in sorted(DATA_DIR.glob("*.json")):
        dataset = json.loads(path.read_text(encoding="utf-8"))
        municipality = dataset.get("municipality")
        if not municipality:
            continue
        code = municipality["code"]
        slug = municipality["slug"]
        city = municipality["city"]

        print(f"{slug} ({code})", file=sys.stderr)
        osm_areas = fetch(code)
        regso_areas = fetch_regso(code, city)
        areas = merge(osm_areas, regso_areas)
        print(
            f"  {len(osm_areas)} ur OSM, {len(regso_areas)} RegSO klarade namnprovet, "
            f"{len(areas) - len(osm_areas)} av dem klarade rörprovet",
            file=sys.stderr,
        )

        out = OUT_DIR / f"{slug}.json"
        if not areas:
            # Ingen fil alls hellre än en tom. En tom fil läses som "vi har
            # tittat och det finns inget", vilket är sant i dag och blir en
            # tyst lögn den dag källorna växt men filen ligger kvar.
            if out.exists():
                out.unlink()
            continue

        used = sorted({a["source"] for a in areas})
        out.write_text(
            json.dumps(
                {
                    "municipality": {"code": code, "slug": slug},
                    "sources": {
                        key: {**SOURCES[key], "fetchedAt": fetched_at} for key in used
                    },
                    "areas": areas,
                },
                ensure_ascii=False,
                separators=(",", ":"),
            )
            + "\n",
            encoding="utf-8",
        )
        time.sleep(5)


if __name__ == "__main__":
    main()
