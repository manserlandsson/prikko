"""Sveriges gräns, för rikskartans skugga.

"Skugga ut hela kartan som inte är sverige obviously, som booli." Rikskartan
öppnar på hela landet och allt utanför gränsen ska dämpas. Maskineriet finns
redan: kartan målar en världspolygon med valda ytor som hål, se OMRÅDESSKUGGAN
i Karta.astro, och Sveriges gräns är samma sorts hål, bara större.

GRÄNSEN ÄR SJÖGRÄNSEN OCH INTE KUSTEN
-------------------------------------
Sverige ligger i OSM som relation 52822, `boundary=administrative` och
`admin_level=2`. Den relationen följer inte stranden: mot Östersjön löper den
ute i vattnet, och dess hörn ligger i Bottenhavet.

Det är inte en defekt utan precis den yta vi vill ha. Ägaren 2026-08-27, efter
att ha mätt Booli: "boolis linje till öst, dvs mot östersjön går inte exakt mot
landet, för det kanske blir för bökigt, dom kör den liksom ute i vattnet."
Booli skuggar alltså med sjögränsen, och Gotland och Öland ligger inne i det
ljusa fältet tillsammans med havet runt dem.

Här låg tidigare en kustlinje byggd ur OSM:s generaliserade landpolygoner,
klippt mot samma relation: 24 MB nedladdning, 2 736 ringar ned till 226, en
kedjad landsgräns och ett glapp som måste mätas. Allt det är borta. Gränsen
hämtas som den är och behöver varken klippas, kedjas eller lappas.

DET LÖSER OCKSÅ EN RENDERINGSBUGG
---------------------------------
226 ringar som hål i EN världspolygon gav grå band tvärs över kartan. Orsaken
mättes 2026-08-27: 600-metersförenklingen av kustlinjen hade skapat 50
korsningar, dels ringar som korsade sig själva, dels öar som korsade
fastlandet. En sådan yta går inte att triangulera och MapLibre ritar band i
stället för en utsparad kontur. Med två ringar som varken korsar sig själva
eller varandra finns hela den felklassen inte längre.

Vindningen skrivs ändå ut med flit, se medsols(). Ett hål måste gå åt motsatt
håll mot världsringen; går de åt samma håll blir resultatet samma sorts band.

RINGARNA
--------
Två stycken, och det är ett prov och ingen förhoppning, se ringarna_haller():

    13 991 punkter    fastlandets sjögräns, 513 662 km². Öland, Orust och hela
                      skärgården ligger innanför den och behöver inga egna
                      ringar.
       611 punkter    Gotlands sjögräns, 15 196 km². Egen ring eftersom ön
                      ligger nio mil ut, alltså längre än två territorialhav.

Summan 528 858 km² är Sveriges yta inklusive insjöar, 447 425 km², plus
territorialhavet.

FÖRENKLINGEN
------------
Gränsen ritas på zoom 5 till 8. Douglas-Peucker med 600 meters tolerans, se
simplify_ring i omraden.py, och tre decimaler i koordinaterna. Vid zoom 8 är en
bildpunkt drygt 300 meter på våra breddgrader.

Mätt 2026-08-27: 14 601 punkter och 288 758 byte blir 434 punkter och 6 854
byte, 2 322 byte gzippat. Gränsen flyttar sig som mest 598 meter, och den
rörelsen sker ute i vattnet där ingen linje ritas. Den gamla kustkonturen vägde
86 921 byte, alltså är filen en tolftedel av vad den var.

Finare toleranser är mätta och förkastade som onödiga: 200 m ger 13 536 byte
och 400 m ger 9 358 byte, utan att någon av dem ändrar något som syns på de
zoomsteg ytan ritas på.

YTAN FÅR NUMERA FILTRERA OCKSÅ
------------------------------
Den gamla kustkonturen bar en reservation: 187 kajlägen i Stockholm och
Oskarshamn hamnade i vattnet av förenklingen, alltså fick ytan skugga men
aldrig avgöra vad som RÄKNADES.

Reservationen faller. Mätt 2026-08-27 ligger alla 13 692 av beståndets
koordinater innanför sjögränsen, vid 200, 400 och 600 meters tolerans. En
kajplats ligger innanför territorialhavet av samma skäl som en badbrygga gör
det. Spärren står därför på 1,0 och inte på 0,95.

Körs med:

    python3 pipeline/riket.py

Skriver site/src/data/riket/sverige.json.
"""

from __future__ import annotations

import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

from omraden import (
    SOURCES,
    overpass,
    simplify_ring,
)

ROOT = Path(__file__).resolve().parent
OUT_DIR = ROOT.parent / "site" / "src" / "data" / "riket"

#: Douglas-Peucker-tolerans, i meter. Se FÖRENKLINGEN i modulens huvud.
SVERIGE_TOLERANS_M = 600.0

#: Decimaler i koordinaterna. Tre är drygt hundra meter.
SVERIGE_PRECISION = 3

#: Antalet ringar sjögränsen ska ge: fastlandets och Gotlands.
SVERIGE_RINGAR = 2

#: Andelen av beståndets koordinater som måste ligga innanför gränsen. Mätt
#: utfall 1,0, och spärren står på samma tal: en verksamhet utanför Sveriges
#: sjögräns är ett fel i datan och inte en avrundning i geometrin.
SVERIGE_TACKNING = 1.0

#: Summan av ringarnas areal, i kvadratkilometer. Sverige med insjöar är
#: 447 425 km² och territorialhavet lägger till drygt åttio tusen. Spärren är
#: vid, men den fångar det fel som verkligen kan hända: en relation som blivit
#: ett län, eller en ring som bara är territorialhavet utan landet i sig.
SVERIGE_AREAL_KM2 = (490_000.0, 570_000.0)

#: Gotlands sjögräns: rutan den ska rymmas i, och minsta bredd i grader. Mätt
#: utfall lon 17,587 till 19,726 och lat 56,701 till 58,598, alltså 2,14 grader
#: bred. Provet finns för att den mindre ringen ska vara just Gotland och inte
#: en holme i Torne älv som råkat sluta sig.
GOTLANDSRUTAN = (17.0, 56.3, 20.3, 59.0)
GOTLANDSBREDD = 1.5

#: Två punkter som MÅSTE ligga innanför den större ringen. Kiruna och Malmö,
#: alltså landets nordligaste och sydligaste ände. En ring som bara är
#: territorialhavet, eller bara ett län, missar minst en av dem.
FASTLANDSPROV = ((20.225, 67.855), (13.003, 55.605))

#: Radien för ett klot med samma YTA som jordellipsoiden. Ekvatorradien ger
#: 0,7 procent för stor area, vilket är tre tusen kvadratkilometer på Sverige.
JORDRADIE_AREA_M = 6371007.2


# ---------------------------------------------------------------------------
# Kedjan
# ---------------------------------------------------------------------------


def kedja(segment: list) -> list:
    """Syr ihop lösa remsor till så långa linjer som möjligt.

    Relationens 178 vägar kommer i godtycklig ordning och riktning. Samma
    problem som rings_from_relation i omraden.py löser, men utan kravet att
    linjen ska sluta sig: en remsa som INTE går ihop ska synas som en öppen
    linje och kastas i gransringar(), inte tvingas till en ring som viker
    dubbelt.
    """
    kvar = [list(s) for s in segment]
    linjer = []
    while kvar:
        nu = kvar.pop(0)
        ändrad = True
        while ändrad:
            ändrad = False
            for i, s in enumerate(kvar):
                if s[0] == nu[-1]:
                    nu = nu + s[1:]
                elif s[-1] == nu[-1]:
                    nu = nu + s[::-1][1:]
                elif s[-1] == nu[0]:
                    nu = s[:-1] + nu
                elif s[0] == nu[0]:
                    nu = s[::-1][:-1] + nu
                else:
                    continue
                kvar.pop(i)
                ändrad = True
                break
        linjer.append(nu)
    linjer.sort(key=len, reverse=True)
    return linjer


# ---------------------------------------------------------------------------
# Punkt i polygon, med kanterna sorterade i latitudfack
# ---------------------------------------------------------------------------


class Innanfor:
    """Strålmetoden med ett register över kanterna.

    Samma svar som in_ring i omraden.py och inRing i lib/omraden.ts, men här
    ska beståndets 13 692 koordinater prövas mot en gräns med 14 601 kanter.
    Rakt av är det tvåhundra miljoner jämförelser. Kanterna läggs därför i fack
    efter latitud, och en punkt behöver bara pröva sitt eget fack: bara kanter
    som spänner över punktens latitud kan korsas av en stråle rakt österut.
    """

    #: Fackets höjd i grader. Två hundradelar ger ett tiotal kanter per fack
    #: för en landsgräns och några få för en kommun.
    STEG = 0.02

    def __init__(self, ringar: list) -> None:
        punkter = [p for r in ringar for p in r]
        self.väst = min(p[0] for p in punkter)
        self.öst = max(p[0] for p in punkter)
        self.syd = min(p[1] for p in punkter)
        self.nord = max(p[1] for p in punkter)
        self.fack: dict = {}
        for ring in ringar:
            for i in range(len(ring) - 1):
                a, b = ring[i], ring[i + 1]
                lo, hi = (a[1], b[1]) if a[1] < b[1] else (b[1], a[1])
                # math.floor och inte int: int trunkerar mot noll och lägger
                # en kant på sydliga halvklotet i fel fack. Sverige ligger inte
                # där, men en klass som svarar fel utanför sitt hemmaplan är en
                # fälla för nästa användning och inte ett antagande värt att ha.
                for k in range(math.floor(lo / self.STEG), math.floor(hi / self.STEG) + 1):
                    self.fack.setdefault(k, []).append((a, b))

    def __call__(self, x: float, y: float) -> bool:
        if x < self.väst or x > self.öst or y < self.syd or y > self.nord:
            return False
        inne = False
        for a, b in self.fack.get(math.floor(y / self.STEG), ()):
            xi, yi = a
            xj, yj = b
            if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
                inne = not inne
        return inne


# ---------------------------------------------------------------------------
# Mått och form
# ---------------------------------------------------------------------------


def areal_km2(ring: list) -> float:
    """Ringens area på jordklotet, i kvadratkilometer.

    Sfäriskt och inte plant. Sverige sträcker sig från 55 till 69 grader nord
    och en kvadratgrad är nästan dubbelt så stor i Skåne som i Kiruna; ett
    plant mått hade gjort arealspärren nedan meningslös.
    """
    total = 0.0
    for i in range(len(ring) - 1):
        x1, y1 = ring[i]
        x2, y2 = ring[i + 1]
        total += math.radians(x2 - x1) * (
            2 + math.sin(math.radians(y1)) + math.sin(math.radians(y2))
        )
    return abs(total) * JORDRADIE_AREA_M * JORDRADIE_AREA_M / 2 / 1e6


def runda(ring: list, decimaler: int) -> list:
    """Avrundar och tar bort punkter som blivit identiska. Sluter ringen."""
    ut: list = []
    for lon, lat in ring:
        punkt = [round(lon, decimaler), round(lat, decimaler)]
        if not ut or ut[-1] != punkt:
            ut.append(punkt)
    if len(ut) >= 2 and ut[0] != ut[-1]:
        ut.append(list(ut[0]))
    return ut


def medsols(ring: list) -> list:
    """Ringen vänd medsols, alltså med negativ ytformel.

    HÅLETS VINDNING ÄR INTE EN SMAKFRÅGA. Masken är en världspolygon med
    gränsen som hål, se maskAv i Karta.astro. Världsringen går moturs, och ett
    hål måste gå åt MOTSATT håll. Går de åt samma håll triangulerar MapLibre
    ytan fel, och det som ritas är grå band tvärs över kartan i stället för en
    utsparad kontur.

    OSM lovar ingen riktning på en gränsrelation. Riktningen skrivs därför ut
    här i stället för att antas, och den skrivs ut i FILEN och inte i kartan:
    en fil som bär rätt vindning kan inte ritas fel av en annan läsare.
    """
    yta = 0.0
    for i in range(len(ring) - 1):
        yta += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
    return ring if yta <= 0 else ring[::-1]


# ---------------------------------------------------------------------------
# Gränsen ur Overpass
# ---------------------------------------------------------------------------


def hamta_gransen() -> tuple[dict, list]:
    """Sveriges gränsrelation och dess vägar, i ETT anrop.

    Relationen slås upp på ISO-koden och inte på ett id skrivet i kod: ett
    relations-id kan bytas ut den dag någon delar upp objektet, och då ska
    frågan fortfarande hitta rätt eller inte hitta något alls.
    """
    payload = overpass(
        "[out:json][timeout:900];"
        'relation["ISO3166-1"="SE"]["boundary"="administrative"]->.se;'
        ".se out tags;"
        "way(r.se);"
        "out geom;"
    )
    element = payload.get("elements") or []
    relationer = [e for e in element if e["type"] == "relation"]
    if len(relationer) != 1:
        raise SystemExit(f"Hittade {len(relationer)} relationer för ISO-koden SE, väntade en.")
    return relationer[0], [e for e in element if e["type"] == "way"]


def gransen_haller(relation: dict) -> bool:
    """Är det verkligen landet Sverige vi fått, och inte något i närheten?"""
    taggar = relation.get("tags") or {}
    if taggar.get("boundary") != "administrative":
        print(f"  boundary={taggar.get('boundary')}, väntade administrative", file=sys.stderr)
        return False
    if taggar.get("admin_level") != "2":
        print(f"  admin_level={taggar.get('admin_level')}, väntade 2", file=sys.stderr)
        return False
    if (taggar.get("name") or "").strip().lower() != "sverige":
        print(f"  name={taggar.get('name')!r}, väntade 'Sverige'", file=sys.stderr)
        return False
    return True


def gransringar(vagar: list) -> list:
    """Sjögränsens ringar, alltså hela relationen sydd till slutna ringar.

    Bara det som SLUTER SIG kommer med. En kedja som lämnats öppen är en
    relation med ett hål i, och en öppen kedja som ändå ritades hade blivit en
    rak linje tvärs över havet där hålet satt.
    """
    remsor = [
        [(round(p["lon"], 5), round(p["lat"], 5)) for p in w["geometry"]]
        for w in vagar
        if w.get("geometry")
    ]
    return [
        [list(p) for p in linje]
        for linje in kedja(remsor)
        if len(linje) >= 4 and linje[0] == linje[-1]
    ]


def ringarna_haller(ringar: list) -> str:
    """Tomt om ringarna är fastlandets och Gotlands. Annars skälet, i klartext.

    Provet ersätter den gamla kustkonturens nyckeloar_finns. Där behövdes tre
    öar letas fram vid namn eftersom förenklingen kunde radera dem; här kan
    bara två saker gå fel, och båda ska sägas rakt ut i stället för att bli en
    tyst felaktig siluett.
    """
    if len(ringar) != SVERIGE_RINGAR:
        return f"{len(ringar)} ringar, väntade {SVERIGE_RINGAR}"

    stor, liten = sorted(ringar, key=areal_km2, reverse=True)

    inne = Innanfor([stor])
    for lon, lat in FASTLANDSPROV:
        if not inne(lon, lat):
            return f"den större ringen rymmer inte punkten {lon}, {lat}"

    väst, syd, öst, nord = GOTLANDSRUTAN
    xs = [p[0] for p in liten]
    ys = [p[1] for p in liten]
    if not (min(xs) >= väst and min(ys) >= syd and max(xs) <= öst and max(ys) <= nord):
        return "den mindre ringen ligger inte där Gotlands sjögräns ligger"
    if max(xs) - min(xs) < GOTLANDSBREDD:
        return (
            f"den mindre ringen är {max(xs) - min(xs):.2f} grader bred, "
            f"väntade minst {GOTLANDSBREDD}"
        )
    return ""


# ---------------------------------------------------------------------------
# Konturen
# ---------------------------------------------------------------------------


def bygg_kontur(sjoringar: list) -> tuple[list, dict]:
    """Sjögränsen förenklad och vänd rätt, plus mätvärdena för rapporten."""
    # Allt avrundas till fem decimaler INNAN något mäts. Annars jämförs en
    # förenklad ring med källans råa flyttal och "före" blir en siffra om
    # talformat i stället för om geometri.
    råa = [runda(r, 5) for r in sjoringar]

    ut = []
    värst = 0.0
    for ring in råa:
        förenklad, avvikelse = simplify_ring(ring, SVERIGE_TOLERANS_M)
        värst = max(värst, avvikelse)
        ut.append(medsols(runda(förenklad, SVERIGE_PRECISION)))

    mått = {
        "ringar": len(ut),
        "punkter_fore": sum(len(r) for r in råa),
        "punkter_efter": sum(len(r) for r in ut),
        "byte_fore": len(json.dumps(råa, separators=(",", ":"))),
        "byte_efter": len(json.dumps(ut, separators=(",", ":"))),
        "flyttad_m": värst,
        "areal_km2": sum(areal_km2(r) for r in ut),
    }
    return ut, mått


def main() -> None:
    from omraden import las_kommuner

    print("Sveriges sjögräns", file=sys.stderr)
    relation, vagar = hamta_gransen()
    if not gransen_haller(relation):
        raise SystemExit("Gränsrelationen höll inte namn- eller nivåprovet.")
    print(f"  relation/{relation['id']}: {len(vagar)} vägar", file=sys.stderr)

    sjö = gransringar(vagar)
    print(f"  {len(sjö)} slutna ringar, {sum(len(r) for r in sjö)} punkter", file=sys.stderr)

    ringar, mått = bygg_kontur(sjö)
    print(
        f"  {mått['punkter_fore']} punkter och {mått['byte_fore']} byte blev "
        f"{mått['punkter_efter']} och {mått['byte_efter']}, flyttad högst "
        f"{mått['flyttad_m']:.0f} m, areal {mått['areal_km2']:.0f} km²",
        file=sys.stderr,
    )

    skäl = ringarna_haller(ringar)
    if skäl:
        raise SystemExit(f"Ringarna höll inte: {skäl}.")

    lägsta, högsta = SVERIGE_AREAL_KM2
    if not lägsta <= mått["areal_km2"] <= högsta:
        raise SystemExit(
            f"Arealen {mått['areal_km2']:.0f} km² ligger utanför {lägsta:.0f} till {högsta:.0f}."
        )

    inne = Innanfor(ringar)
    punkter = [p for _m, pts in las_kommuner() for p in pts]
    andel = sum(1 for x, y in punkter if inne(x, y)) / len(punkter)
    print(f"  {andel:.4f} av beståndets koordinater ligger innanför", file=sys.stderr)
    if andel < SVERIGE_TACKNING:
        raise SystemExit(f"Bara {andel:.4f} innanför, kräver {SVERIGE_TACKNING}.")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "sverige.json").write_text(
        json.dumps(
            {
                "name": "Sverige",
                "slug": "sverige",
                "source": "osm",
                "ref": f"relation/{relation['id']}",
                "sources": {
                    "osm": {
                        **SOURCES["osm"],
                        "fetchedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                    }
                },
                "outer": ringar,
                "inner": [],
            },
            ensure_ascii=False,
            separators=(",", ":"),
        )
        + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
