"""Sveriges landkontur, för rikskartans skugga.

"Skugga ut hela kartan som inte är sverige obviously, som booli." Rikskartan
öppnar på hela landet och allt utanför gränsen ska dämpas. Maskineriet finns
redan: kartan målar en världspolygon med valda ytor som hål, se OMRÅDESSKUGGAN
i Karta.astro, och Sveriges kontur är samma sorts hål, bara större.

VARFÖR KONTUREN INTE KOMMER UR ADMIN_LEVEL 2
--------------------------------------------
Sverige ligger i OSM som relation 52822 med `boundary=administrative` och
`admin_level=2`. Det är kontrollerat, och det är också en återvändsgränd.

Den relationen är SJÖGRÄNSEN och inte kusten. Mätt i augusti 2026: två
ytterringar, 14 601 punkter, och ytterringens hörn ligger ute i Bottenhavet.
Att skugga med den ger halva Bottenviken och halva Östersjön i färg, alltså
inte en igenkännlig Sverigesiluett. Provet som avslöjar det är just det
ägaren bad om: Öland och Orust kan inte bli egna ringar i den, för de ligger
INNANFÖR Sveriges territorialvatten tillsammans med fastlandet. Bara Gotland
blir en egen ring, och bara för att den ligger nio mil ut.

Kusten då. `natural=coastline` innanför samma relation är 79 149 vägar och
3 129 171 noder. Det är ett fyrtiotal gånger allt annat den här pipelinen
hämtar tillsammans, och det vore varken artigt mot Overpass eller möjligt att
kedja ihop i rimlig tid.

VAD KONTUREN KOMMER UR I STÄLLET
--------------------------------
OSM publicerar sin egen kustlinje färdigt generaliserad för låga zoomsteg, som
"simplified land polygons" på osmdata.openstreetmap.de. Samma data, samma
upphovsmän, samma ODbL, samma attribution: det är OSM:s kustlinje körd genom
OSM:s egen generalisering, inte en annan källa. 68 052 polygoner för hela
världen, 24 MB zippat, hämtas en gång och ligger sedan i pipeline/data/raw.

Landytorna vet däremot ingenting om landsgränser: Skandinavien och Asien är EN
polygon på 180 313 punkter. Sverige klipps därför ut med OSM:s egen
administrativa gräns, alltså relation 52822, som duger utmärkt till det även
om den inte duger som kontur. Två OSM-källor, ett svar.

KLIPPNINGEN, STEG FÖR STEG
--------------------------
1. ÖARNA. En landring vars ALLA hörn ligger innanför sjögränsen är svensk.
   Mätt utfall: 9 343 landringar i rutan, varav 2 735 helt innanför, från
   Gotland till skär på ett par hundra meter. Tre ringar ligger DELVIS
   innanför: kontinenten, och två holmar i Torne älv där gränsen går mitt i
   strömmen. Holmarna faller, och det är rätt.

2. FASTLANDET. Kontinentringens hörn prövas i tur och ordning mot sjögränsen.
   Det ger exakt TVÅ övergångar och därmed en enda sammanhängande löpa på
   13 625 punkter, från Haparanda i norr till Svinesund i väster. Det är
   Sveriges kust.

3. STÄNGNINGEN. Löpan är öppen och saknar landsgränsen mot Norge och Finland.
   Den hämtas ur samma relation: OSM märker de gränsvägar som går i sjön med
   `maritime=yes`, och de 76 som saknar märket kedjar ihop sig till EN linje på
   12 730 punkter mellan precis samma två ändar. Ändarna möts på femtio meter,
   och ringen sluter sig.

FÖRENKLINGEN
------------
Konturen ritas på zoom 5 till 8 och ska vara grövre än kommunernas tio meter.
Två rattar, och båda är mätta:

    tolerans 600 m      Douglas-Peucker, se simplify_ring i omraden.py.
                        Vid zoom 8 är en bildpunkt drygt 300 meter på våra
                        breddgrader, alltså två bildpunkter. Vid zoom 5 är det
                        en tredjedels bildpunkt.
    minsta ö 2 km²      En ö på 2 km² är 1,4 km tvärs över, alltså fyra
                        bildpunkter vid zoom 8 och en halv vid zoom 5. Under
                        det ritas ingenting som går att se, och 2 510 av
                        2 735 öar faller på den gränsen utan att kosta
                        siluetten en enda igenkännlig del.

Koordinaterna avrundas till TRE decimaler, alltså drygt hundra meter, till
skillnad från kommunernas fem. Steget är en tredjedels bildpunkt vid zoom 8 och
försvinner i toleransen ovanför, men det är en fjärdedel av filens vikt.

Utfallet, mätt: 2 736 ringar och 1 015 062 byte oförenklat blir 226 ringar och
86 677 byte, 26 064 byte gzippat på disk. Konturen flyttar sig som mest 600
meter och den summerade arealen blir 446 241 km², mot Sveriges verkliga
447 425 inklusive insjöar. Gotland, Öland och Orust står kvar som egna ringar,
och det är ett prov och inte en förhoppning, se nyckeloar_finns.

KONTUREN SKUGGAR, DEN FILTRERAR ALDRIG
--------------------------------------
98,63 procent av beståndets koordinater ligger innanför konturen. De 187 som
inte gör det är kajlägen i Stockholm och Oskarshamn som 600-metersförenklingen
lagt i vattnet. Det är oskadligt för en skugga och skulle vara förödande för
ett filter. Ytan får därför aldrig användas för att avgöra vad som RÄKNAS,
till skillnad från kommunernas och stadsdelarnas ytor.

Körs med:

    python3 pipeline/riket.py

Skriver site/src/data/riket/sverige.json.
"""

from __future__ import annotations

import json
import math
import struct
import sys
import time
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from omraden import (
    METER_PER_GRAD,
    SOURCES,
    USER_AGENT,
    overpass,
    simplify_ring,
)

ROOT = Path(__file__).resolve().parent
OUT_DIR = ROOT.parent / "site" / "src" / "data" / "riket"
RAW_DIR = ROOT / "data" / "raw"

#: OSM:s egen generalisering av sin egen kustlinje. ODbL, © OpenStreetMap
#: contributors, alltså samma källblock som allt annat OSM-ritat här.
LAND_URL = (
    "https://osmdata.openstreetmap.de/download/"
    "simplified-land-polygons-complete-3857.zip"
)
LAND_SHP = "simplified-land-polygons-complete-3857/simplified_land_polygons.shp"

#: Rutan som landytorna läses ur. Rymligt tilltagen runt Sverige; allt utanför
#: den kan ändå inte hamna innanför sjögränsen.
LAND_BBOX = (10.0, 54.0, 25.0, 70.0)

#: Douglas-Peucker-tolerans, i meter. Se FÖRENKLINGEN i modulens huvud.
SVERIGE_TOLERANS_M = 600.0

#: Minsta ö som ritas, i kvadratkilometer.
SVERIGE_MINSTA_O_KM2 = 2.0

#: Decimaler i koordinaterna. Tre är drygt hundra meter.
SVERIGE_PRECISION = 3

#: Andelen av beståndets koordinater som måste ligga innanför konturen. Mätt
#: utfall 0,9863; spärren står lägre eftersom kajlägen hamnar i vattnet av
#: förenklingen och det är oskadligt för en skugga. Se sista stycket i huvudet.
SVERIGE_TACKNING = 0.95

#: Sveriges yta inklusive insjöar är 447 425 km². Spärren är vid, för
#: förenklingen både äter vikar och rundar av uddar, men den fångar det fel som
#: verkligen kan hända: en klippning som tagit hela Skandinavien eller bara en
#: flik av Skåne.
SVERIGE_AREAL_KM2 = (380_000.0, 520_000.0)

#: Tre öar som MÅSTE överleva klippningen och förenklingen som egna ringar.
#: Namn, ruta de ska rymmas i, och minsta bredd i grader. En naiv förenkling
#: raderar dem eller klistrar ihop dem med fastlandet, och då är siluetten fel
#: på ett sätt varenda svensk ser direkt.
NYCKELOAR = (
    ("Gotland", (18.0, 56.8, 19.2, 58.0), 0.5),
    ("Öland", (16.3, 56.1, 17.2, 57.4), 0.3),
    ("Orust", (11.3, 58.0, 11.9, 58.4), 0.2),
)

#: Ekvatorradien. Krävs av EPSG:3857, som landytorna ligger i: projektionen är
#: definierad på en klotjord med exakt den radien och en annan siffra flyttar
#: varje koordinat.
JORDRADIE_M = 6378137.0

#: Radien för ett klot med samma YTA som jordellipsoiden. En annan siffra än
#: ovan, och det är avsiktligt: ekvatorradien ger 0,7 procent för stor area,
#: vilket är tre tusen kvadratkilometer på Sverige.
JORDRADIE_AREA_M = 6371007.2


# ---------------------------------------------------------------------------
# Shapefile: bara polygondelen, och bara det som rör Sverige
# ---------------------------------------------------------------------------


def _x2lon(x: float) -> float:
    return x / JORDRADIE_M * 180.0 / math.pi


def _y2lat(y: float) -> float:
    return (2 * math.atan(math.exp(y / JORDRADIE_M)) - math.pi / 2) * 180.0 / math.pi


def _lon2x(lon: float) -> float:
    return math.radians(lon) * JORDRADIE_M


def _lat2y(lat: float) -> float:
    return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)) * JORDRADIE_M


def las_landytor(data: bytes, bbox: tuple) -> list:
    """Ringarna ur en shapefil med polygoner, i longitud och latitud.

    Formatet är publicerat och litet: ett huvud på hundra byte, sedan poster
    med ett eget litet huvud var. En polygonpost bär sin egen omslutande ruta
    FÖRE sina hörn, och det är hela skälet till att den här läsaren är billig:
    68 052 polygoner täcker världen, rutan avfärdar alla utom Nordeuropas utan
    att en enda koordinat packas upp.

    Bara typ 5, alltså Polygon. Filen innehåller ingenting annat, och en post
    av annat slag ska hoppas över och inte gissas på.
    """
    väst, syd, öst, nord = bbox
    w, s = _lon2x(väst), _lat2y(syd)
    e, n = _lon2x(öst), _lat2y(nord)

    slut = struct.unpack(">i", data[24:28])[0] * 2
    pos = 100
    ringar: list = []
    while pos < slut:
        _nummer, längd = struct.unpack(">ii", data[pos : pos + 8])
        innehåll = pos + 8
        pos = innehåll + längd * 2
        if struct.unpack("<i", data[innehåll : innehåll + 4])[0] != 5:
            continue
        rutan = struct.unpack("<4d", data[innehåll + 4 : innehåll + 36])
        if rutan[2] < w or rutan[0] > e or rutan[3] < s or rutan[1] > n:
            continue
        antal_delar, antal_punkter = struct.unpack("<ii", data[innehåll + 36 : innehåll + 44])
        p0 = innehåll + 44
        delar = struct.unpack(f"<{antal_delar}i", data[p0 : p0 + 4 * antal_delar])
        pp = p0 + 4 * antal_delar
        koord = struct.unpack(f"<{2 * antal_punkter}d", data[pp : pp + 16 * antal_punkter])
        for i, start in enumerate(delar):
            stopp = delar[i + 1] if i + 1 < antal_delar else antal_punkter
            ringar.append(
                [
                    [_x2lon(koord[2 * j]), _y2lat(koord[2 * j + 1])]
                    for j in range(start, stopp)
                ]
            )
    return ringar


def hamta_landytor() -> bytes:
    """Landytorna, hämtade en gång och sedan lästa ur pipeline/data/raw."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    zipp = RAW_DIR / LAND_URL.rsplit("/", 1)[-1]
    if not zipp.exists():
        print(f"  hämtar {LAND_URL}", file=sys.stderr)
        request = urllib.request.Request(LAND_URL, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(request, timeout=900) as svar:
            zipp.write_bytes(svar.read())
        print(f"  {zipp.stat().st_size} byte", file=sys.stderr)
    with zipfile.ZipFile(zipp) as arkiv:
        return arkiv.read(LAND_SHP)


# ---------------------------------------------------------------------------
# Punkt i polygon, med kanterna sorterade i latitudfack
# ---------------------------------------------------------------------------


class Innanfor:
    """Strålmetoden med ett register över kanterna.

    Samma svar som in_ring i omraden.py och inRing i lib/omraden.ts, men här
    ska 180 313 hörn prövas mot en gräns med 14 601 kanter. Rakt av är det två
    och en halv miljard jämförelser. Kanterna läggs därför i fack efter
    latitud, och en punkt behöver bara pröva sitt eget fack: bara kanter som
    spänner över punktens latitud kan korsas av en stråle rakt österut.
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
# Mått
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


def avstand_m(a: list, b: list) -> float:
    """Grovt avstånd mellan två punkter. Bara för att pröva att ändar möts."""
    lat0 = math.radians((a[1] + b[1]) / 2)
    return math.hypot(
        (a[0] - b[0]) * math.cos(lat0) * METER_PER_GRAD,
        (a[1] - b[1]) * METER_PER_GRAD,
    )


# ---------------------------------------------------------------------------
# Klippningen
# ---------------------------------------------------------------------------


def kedja(segment: list) -> list:
    """Syr ihop lösa remsor till så långa linjer som möjligt.

    Samma problem som rings_from_relation i omraden.py löser, men utan kravet
    att linjen ska sluta sig: landsgränsen mot Norge och Finland är en öppen
    linje och ska förbli det.
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


def langsta_lopan(ring: list, inne: Innanfor) -> tuple[list, int]:
    """Den längsta sammanhängande löpan av hörn som ligger innanför gränsen.

    Lämnar också antalet löpor. Fastlandet ska ge exakt EN: kontinentringen
    korsar Sveriges sjögräns två gånger, vid Svinesund och vid Haparanda. Fler
    löpor betyder att klippningen fått fatt i något annat än Sveriges kust, och
    det ska synas i utskriften i stället för att tyst bli en trasig siluett.
    """
    flaggor = [inne(x, y) for x, y in ring]
    löpor = []
    i, n = 0, len(ring)
    while i < n:
        if flaggor[i]:
            j = i
            while j < n and flaggor[j]:
                j += 1
            löpor.append((i, j))
            i = j
        else:
            i += 1
    if not löpor:
        return [], 0
    a, b = max(löpor, key=lambda t: t[1] - t[0])
    return [list(p) for p in ring[a:b]], len(löpor)


# ---------------------------------------------------------------------------
# Gränsen ur Overpass
# ---------------------------------------------------------------------------


def hamta_gransen() -> tuple[dict, list]:
    """Sveriges gränsrelation och dess vägar, i ETT anrop.

    Relationen slås upp på ISO-koden och inte på ett id skrivet i kod: ett
    relations-id kan bytas ut den dag någon delar upp objektet, och då ska
    frågan fortfarande hitta rätt eller inte hitta något alls.

    Vägarna kommer med sina TAGGAR, och det är hela poängen: `maritime=yes`
    skiljer sjögränsen från landsgränsen mot Norge och Finland, och det är den
    skillnaden som stänger konturen. Två utskrifter i samma fråga, alltså en
    fråga och inte två.
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
    """Sjögränsens ringar, alltså hela relationen sydd till slutna ringar."""
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


def landgransen(vagar: list) -> list:
    """Landsgränsen mot Norge och Finland, som en enda öppen linje.

    OSM märker de gränsvägar som går i sjön med `maritime=yes`. De 76 som
    saknar märket är landsgränsen, och de kedjar ihop sig till en linje mellan
    Haparanda och Svinesund. Kortare kedjor är holmar i Torne älv och en
    gränssten i Öresund; den längsta är den vi vill ha.
    """
    remsor = [
        [(round(p["lon"], 5), round(p["lat"], 5)) for p in w["geometry"]]
        for w in vagar
        if w.get("geometry") and (w.get("tags") or {}).get("maritime") != "yes"
    ]
    linjer = kedja(remsor)
    return [list(p) for p in linjer[0]] if linjer else []


# ---------------------------------------------------------------------------
# Konturen
# ---------------------------------------------------------------------------


def bygg_kontur(landringar: list, sjoringar: list, gransen: list) -> tuple[list, dict]:
    """Sveriges landkontur som ringar, plus mätvärdena för rapporten."""
    inne = Innanfor(sjoringar)

    öar = []
    kontinenten = None
    delvis = 0
    for ring in landringar:
        antal = sum(1 for x, y in ring if inne(x, y))
        if antal == len(ring):
            öar.append(ring)
        elif antal:
            delvis += 1
            if kontinenten is None or len(ring) > len(kontinenten):
                kontinenten = ring

    if kontinenten is None:
        raise SystemExit("Ingen landring korsar sjögränsen; klippningen hittade inget fastland.")

    kust, antal_lopor = langsta_lopan(kontinenten, inne)
    if len(kust) < 1000:
        raise SystemExit(f"Kustlöpan blev {len(kust)} punkter, väntade tiotusen.")

    # Löpan går från Haparanda till Svinesund. Landsgränsen går åt samma håll
    # och vänds därför, så att ringen sluter sig i stället för att vika dubbelt.
    vänd = gransen[::-1]
    if avstand_m(kust[-1], vänd[0]) > avstand_m(kust[-1], gransen[0]):
        vänd = list(gransen)
    glapp = (avstand_m(kust[-1], vänd[0]), avstand_m(vänd[-1], kust[0]))
    if max(glapp) > 5000:
        raise SystemExit(
            f"Kust och landsgräns möts inte: glapp {glapp[0]:.0f} och {glapp[1]:.0f} m."
        )

    # Allt avrundas till fem decimaler INNAN något mäts, alltså till samma
    # meterprecision som kommunkonturerna. Annars jämförs en förenklad kontur
    # med källans råa flyttal och "före" blir en siffra om talformat i stället
    # för om geometri.
    fastland = runda(kust + vänd, 5)
    råa = [fastland] + sorted((runda(r, 5) for r in öar), key=areal_km2, reverse=True)

    behållna = [r for r in råa if r is fastland or areal_km2(r) >= SVERIGE_MINSTA_O_KM2]
    ut = []
    värst = 0.0
    for ring in behållna:
        förenklad, avvikelse = simplify_ring(ring, SVERIGE_TOLERANS_M)
        värst = max(värst, avvikelse)
        förenklad = runda(förenklad, SVERIGE_PRECISION)
        if len(förenklad) >= 4:
            ut.append(förenklad)

    mått = {
        "ringar_fore": len(råa),
        "ringar_efter": len(ut),
        "punkter_fore": sum(len(r) for r in råa),
        "punkter_efter": sum(len(r) for r in ut),
        "byte_fore": len(json.dumps(råa, separators=(",", ":"))),
        "byte_efter": len(json.dumps(ut, separators=(",", ":"))),
        "flyttad_m": värst,
        "areal_km2": sum(areal_km2(r) for r in ut),
        "delvis_innanfor": delvis,
        "lopor": antal_lopor,
        "kustpunkter": len(kust),
        "gransglapp_m": max(glapp),
    }
    return ut, mått


def nyckeloar_finns(ringar: list) -> list:
    """Vilka av Gotland, Öland och Orust som saknas. Tom lista är utfallet."""
    saknas = []
    for namn, (w, s, e, n), bredd in NYCKELOAR:
        träff = False
        for ring in ringar:
            xs = [p[0] for p in ring]
            ys = [p[1] for p in ring]
            if min(xs) >= w and min(ys) >= s and max(xs) <= e and max(ys) <= n:
                if max(xs) - min(xs) >= bredd:
                    träff = True
                    break
        if not träff:
            saknas.append(namn)
    return saknas


def main() -> None:
    from omraden import las_kommuner

    print("Sveriges kontur", file=sys.stderr)
    relation, vagar = hamta_gransen()
    if not gransen_haller(relation):
        raise SystemExit("Gränsrelationen höll inte namn- eller nivåprovet.")
    print(
        f"  relation/{relation['id']}: {len(vagar)} vägar, "
        f"{sum(1 for w in vagar if (w.get('tags') or {}).get('maritime') != 'yes')} i land",
        file=sys.stderr,
    )
    time.sleep(5)

    sjö = gransringar(vagar)
    gräns = landgransen(vagar)
    print(f"  sjögräns {len(sjö)} ringar, landsgräns {len(gräns)} punkter", file=sys.stderr)

    land = las_landytor(hamta_landytor(), LAND_BBOX)
    print(f"  {len(land)} landringar i rutan", file=sys.stderr)

    ringar, mått = bygg_kontur(land, sjö, gräns)
    print(
        f"  {mått['ringar_fore']} ringar och {mått['byte_fore']} byte blev "
        f"{mått['ringar_efter']} och {mått['byte_efter']}, flyttad högst "
        f"{mått['flyttad_m']:.0f} m, areal {mått['areal_km2']:.0f} km²",
        file=sys.stderr,
    )

    saknas = nyckeloar_finns(ringar)
    if saknas:
        raise SystemExit(f"Konturen saknar {', '.join(saknas)}. Förenklingen är för hård.")

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
