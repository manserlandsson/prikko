"""Stadsdelsgränser ur OpenStreetMap.

Områdessidorna behöver veta var ett område SLUTAR. Det är hela problemet, och
det finns fyra tänkbara svar. Alla fyra är mätta innan det här valet gjordes,
och mätningarna står nedan.

VAL AV KÄLLA
------------
Kort version: OSM är den enda källan som ger BÅDE en riktig gräns OCH ett namn
folk söker på.

`establishments.district` var det billigaste svaret och är tomt. Kolumnen finns
i schema.sql märkt "stadsdel, härledd", men ingen kod skriver den: 0 av 15 921
rader har ett värde. Den är alltså inte en källa, den är en avsikt.

SCB:s RegSO är den frestande källan och den ser bäst ut på pappret. Hela landet,
3 363 områden, riktiga polygoner, fri licens, och den täcker varenda kommun vi
har. Den föll på namnen. RegSO delar Södermalm i sju områden och kallar inget av
dem Södermalm: de heter Östra Katarina, Västra Katarina, Mellersta Högalid,
Norra Högalid, Norra Sofia, Södra Sofia och Mariatorget. Gamla stan heter
Storkyrkan. Vasastan heter Gustav Vasa plus Västra och Östra Matteus. Det är
församlingsnamn, och de sitter just på de områden där verksamheterna är som
tätast: av Stockholms sexton största RegSO-områden räknat i verksamheter bär
tretton ett församlingsnamn, med Klara-Jacob (707 verksamheter) högst upp.

Ute i förorterna är RegSO tvärtom utmärkt, Vällingby och Tensta och Rågsved
heter vad de heter. Men en sidtyp som bygger sina största sidor först skulle
alltså publicera sina viktigaste sidor under namn ingen skriver in i ett
sökfält, och då finns det ingen anledning att bygga sidtypen.

RegSO är fortfarande rätt källa den dag vi vill räkna STATISTIK per område. Den
är byggd för det och den kopplar till SCB:s befolkningstal. Den är fel källa för
en URL.

Kommunernas egna stadsdelsindelningar ger de bästa namnen men kostar tolv
integrationer med tolv licenser, och sex av våra tolv kommuner har ingen
stadsdelsindelning alls eftersom de är småstäder.

Kvar står OpenStreetMap, som redan är projektets geokodningskälla. Se
licensresonemanget i prikko/geocode.py: samma ODbL, samma attributionskrav,
ingen ny juridisk yta.

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

Alltså: BARA POLYGONER. Finns ingen polygon finns ingen sida. Sidtypen startar
därmed i Stockholm och växer av sig själv när OSM kartläggs vidare eller när
fler kommuner får koordinater, utan att en rad kod behöver ändras.

VILKA POLYGONER SOM RÄKNAS
--------------------------
`place=suburb|neighbourhood|quarter|borough|city_district` som väg eller
relation, plus `boundary=administrative` med `admin_level=10`.

admin_level 10 är stadsdel i Stockholm (Södermalm, Gamla stan, Djurgården) och
kvarter i Karlstad. admin_level 9 är något helt annat och är UTESLUTET: det är
distrikt, alltså de gamla församlingarna, och de heter "Kymbo distrikt" och
"Linköpings domkyrkodistrikt". Samma fel som RegSO gör, av samma historiska
skäl, och lika osökbart.

Körs med:

    python3 pipeline/omraden.py

Skriver site/src/data/omraden/<kommun>.json. Filerna är små, de versionshanteras,
och bygget läser dem genom site/src/lib/omraden.ts.
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
            "osm": f"{element['type']}/{element['id']}",
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

        print(f"{slug} ({code})", file=sys.stderr)
        areas = fetch(code)
        print(f"  {len(areas)} områden med polygon", file=sys.stderr)

        out = OUT_DIR / f"{slug}.json"
        if not areas:
            # Ingen fil alls hellre än en tom. En tom fil läses som "vi har
            # tittat och det finns inget", vilket är sant i dag och blir en
            # tyst lögn den dag OSM kartlagts vidare men filen ligger kvar.
            if out.exists():
                out.unlink()
            continue

        out.write_text(
            json.dumps(
                {
                    "municipality": {"code": code, "slug": slug},
                    "source": {
                        "name": "OpenStreetMap",
                        "licence": "ODbL 1.0",
                        "attribution": "© OpenStreetMap contributors",
                        "fetchedAt": fetched_at,
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
