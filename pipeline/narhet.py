#!/usr/bin/env python3
"""Sätt närmaste hållplats och antalet parkeringar på verksamheterna.

    python3 pipeline/narhet.py --matt site/src/data/*.json   # mäter, skriver inget
    python3 pipeline/narhet.py site/src/data/*.json          # skriver stop och parking
    python3 pipeline/narhet.py --refresh site/src/data/*.json  # hämtar OSM på nytt

FRÅGAN SOM BESVARAS
-------------------
"Hur tar jag mig dit." Ägaren skickade Ednias "Beräkna restid" som förlaga.
Deras knapp RÄKNAR INGENTING: uppmätt 2026-08-18 är den ett rent
`<a href="https://maps.google.com/?daddr=LAT,LNG" target="_blank">`, och det
är Google som räknar när man kommit fram. Vår `geo:`-länk i Platskarta.astro
gör redan samma sak. Alltså finns det ingen restid att bygga, och det som
FAKTISKT går att lägga till är tal vi kan räkna själva i förväg: avståndet
till närmaste hållplats och antalet parkeringar omkring. Se
docs/38_ta_mig_hit.md §3 för de tre vägarna och varför de andra två föll.

FÅGELVÄGEN, OCH DET SKA STÅ
---------------------------
Vi räknar inte gångavstånd. Talen är fågelvägen, och ordet måste stå där de
visas. Se modulkommentaren i prikko/narhet.py.

KÄLLAN
------
OpenStreetMap via Overpass API, ODbL 1.0, © OpenStreetMap contributors.
Attributionen ligger i i-knappen intill raden och aldrig som utskriven text,
se docs/38 §6.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import List

sys.path.insert(0, str(Path(__file__).resolve().parent))

# Overpass-klienten lånas ur oppettider.py och skrivs INTE av. Den kan två
# saker som kostat oss en körning att lära oss: den växlar mellan två speglar
# och backar av vid 504, och den vet att ett tomt svar är ett fel. En andra
# kopia hade glidit isär från den första första gången någon lagar en bugg i
# den ena.
import oppettider as _oppettider  # noqa: E402
from prikko.narhet import (  # noqa: E402
    PARKING_RADIUS_M,
    STOP_RADIUS_M,
    Grid,
    nearest_stop,
    pack_parking,
    pack_stop,
    parkings_from_overpass,
    parkings_near,
    stops_from_overpass,
)

ROOT = Path(__file__).resolve().parent
EXTRACT_DIR = ROOT / "data" / "interim"

PROVENANCE = {
    "method": "derived",
    "source": "OpenStreetMap via Overpass API",
    "licence": "ODbL 1.0",
    "attribution": "© OpenStreetMap contributors",
}

#: Hållplatser OCH parkeringar i EN fråga per kommun. Två frågor hade varit
#: tjugofyra anrop mot en tjänst som svarade 504 på sju av tolv kommuner
#: senast. `stop_position` hämtas inte, se prikko/narhet.py.
STOP_PARTS = (
    'node["highway"="bus_stop"](area:{a});'
    'node["railway"~"^(station|halt|tram_stop)$"](area:{a});'
    'way["railway"~"^(station|halt)$"](area:{a});'
    'node["amenity"="ferry_terminal"](area:{a});'
    'way["amenity"="ferry_terminal"](area:{a});'
    'node["public_transport"="platform"](area:{a});'
    'way["public_transport"="platform"](area:{a});'
)

PARKING_PARTS = (
    'node["amenity"="parking"](area:{a});'
    'way["amenity"="parking"](area:{a});'
    'relation["amenity"="parking"](area:{a});'
)


def overpass_query(area: int, timeout: int = 600) -> str:
    return (
        f"[out:json][timeout:{timeout}];("
        + (STOP_PARTS + PARKING_PARTS).format(a=area)
        + ");out center tags;"
    )


def fetch_extract(code: str, refresh: bool) -> List[dict]:
    """Kommunens hållplatser och parkeringar. En fråga, sedan en fil på disk.

    Uttaget ligger i data/interim/ utanför versionshanteringen, precis som
    matpunkterna i oppettider.py och adresserna i geocode.py.
    """
    EXTRACT_DIR.mkdir(parents=True, exist_ok=True)
    path = EXTRACT_DIR / f"osm_narhet_{code}.json"
    if path.exists() and not refresh:
        return json.loads(path.read_text(encoding="utf-8"))["elements"]

    print(f"  hämtar hållplatser och parkeringar för kommun {code}", file=sys.stderr)
    # Kommungränsen slås upp på SCB-koden och inte på namnet, samma val som i
    # oppettider.py och geocode.py: namn ändras, koden gör det inte.
    boundary = _oppettider.overpass(
        f'[out:json][timeout:180];relation["ref:scb"="{code}"]["admin_level"="7"];out ids;'
    )
    relations = boundary.get("elements") or []
    if len(relations) != 1:
        raise SystemExit(f"Hittade {len(relations)} kommungränser för {code}, väntade en.")

    payload = _oppettider.overpass(overpass_query(3600000000 + relations[0]["id"]))
    elements = payload.get("elements") or []
    # NOLL OBJEKT ÄR INTE ETT UTFALL, DET ÄR ETT FEL.
    # Samma dom som matpunkterna fick i oppettider.py, och av samma skäl:
    # Overpass svarar 200 med en TOM lista när områdesuppslaget inte gått
    # fram, och Örebro drabbades av just det 2026-08-17. Ingen svensk kommun
    # saknar både hållplatser och parkeringar; Svenljunga, den minsta vi har,
    # ger dryga hundra. Skrevs den tomma listan till disk hade nästa körning
    # läst den ur cachen och tyst tagit bort uppgiften i hela kommunen.
    if not elements:
        raise SystemExit(
            f"Overpass gav noll hållplatser och parkeringar för kommun {code}. "
            f"Det är ett fel och inte ett utfall: områdesuppslaget gick sannolikt "
            f"inte fram. Kör om kommunen ensam."
        )
    path.write_text(json.dumps(payload), encoding="utf-8")
    return elements


def process(path: Path, refresh: bool, write: bool, matt: bool) -> Counter:
    payload = json.loads(path.read_text(encoding="utf-8"))
    code = payload["municipality"]["code"]
    name = payload["municipality"]["name"]
    establishments = payload["establishments"]

    elements = fetch_extract(code, refresh)
    stops = stops_from_overpass(elements)
    parkings = parkings_from_overpass(elements)
    stop_grid, parking_grid = Grid(stops), Grid(parkings)

    print(
        f"{name}: {len(establishments)} verksamheter, "
        f"{len(stops)} hållplatser och {len(parkings)} öppna parkeringar i OSM",
        file=sys.stderr,
    )

    stats: Counter = Counter()
    avstand: List[int] = []

    for establishment in establishments:
        lat, lng = establishment.get("lat"), establishment.get("lng")
        if lat is None or lng is None:
            stats["no_coordinate"] += 1
            if write:
                establishment.pop("stop", None)
                establishment.pop("parking", None)
            continue

        # `approximate` betyder grannporten, se prikko/narhet.py. Ett avstånd
        # på tiotals meter räknat från en sådan punkt är en uppfinning.
        if establishment.get("geoPrecision") == "approximate":
            stats["approximate"] += 1
            if write:
                establishment.pop("stop", None)
                establishment.pop("parking", None)
            continue

        stats["with_coordinate"] += 1

        found = nearest_stop(stop_grid, lat, lng)
        if found is None:
            stats["no_stop_nearby"] += 1
            if write:
                establishment.pop("stop", None)
        else:
            stop, distance = found
            stats["stop"] += 1
            stats[f"mode_{stop.mode}"] += 1
            stats["stop_named" if stop.name else "stop_unnamed"] += 1
            avstand.append(distance)
            if write:
                establishment["stop"] = pack_stop(stop, distance)

        near = parkings_near(parking_grid, lat, lng)
        if near is None:
            stats["no_parking_nearby"] += 1
            if write:
                establishment.pop("parking", None)
        else:
            count, nearest = near
            stats["parking"] += 1
            stats["parking_total"] += count
            if write:
                establishment["parking"] = pack_parking(count, nearest)

        if matt:
            # Mätläget svarar på VILKEN radie som är rätt, inte bara på hur
            # många den valda radien fångar. Utan de här raderna hade 500 och
            # 200 meter varit gissningar.
            for radie in (100, 200, 300, 500, 800, 1200):
                if stop_grid.near(lat, lng, radie):
                    stats[f"stop_inom_{radie}"] += 1
                if parking_grid.near(lat, lng, radie):
                    stats[f"park_inom_{radie}"] += 1

    if write:
        if stats["stop"] or stats["parking"]:
            covers = []
            if stats["stop"]:
                covers.append("stop")
            if stats["parking"]:
                covers.append("parking")
            payload = _oppettider.insert_after(
                payload,
                "source",
                "narhet",
                {
                    **PROVENANCE,
                    "covers": covers,
                    # Datumet står EN gång per fil och inte på varje
                    # verksamhet. Det är samma datum för hela uttaget, och nio
                    # tusen kopior av det är nio tusen rader utan innehåll.
                    "checkedAt": datetime.now(timezone.utc).date().isoformat(),
                    "stopRadius": int(STOP_RADIUS_M),
                    "parkingRadius": int(PARKING_RADIUS_M),
                },
            )
        else:
            payload.pop("narhet", None)
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")

    # NÄMNAREN ÄR VERKSAMHETER MED EN ANVÄNDBAR KOORDINAT, inte alla rader.
    # 2 431 verksamheter saknar koordinat helt och 237 har en som bara är
    # gatunivå; ingen av dem kan få ett avstånd av något skäl som har med
    # hållplatser att göra, och att räkna dem i nämnaren mäter geokodningen
    # och inte det här.
    denominator = stats["with_coordinate"]
    if denominator:
        print(
            f"  {stats['stop']} av {denominator} med koordinat fick hållplats "
            f"({stats['stop'] / denominator:.1%}), "
            f"{stats['parking']} fick parkering ({stats['parking'] / denominator:.1%})",
            file=sys.stderr,
        )
        if avstand:
            avstand.sort()
            print(
                f"    avstånd till hållplats: median {avstand[len(avstand) // 2]} m, "
                f"p90 {avstand[int(0.9 * len(avstand))]} m",
                file=sys.stderr,
            )
        if matt:
            for radie in (100, 200, 300, 500, 800, 1200):
                s, p = stats[f"stop_inom_{radie}"], stats[f"park_inom_{radie}"]
                print(
                    f"    inom {radie:4d} m: hållplats {s:5d} ({s / denominator:5.1%})"
                    f"   parkering {p:5d} ({p / denominator:5.1%})",
                    file=sys.stderr,
                )

    stats["denominator"] = denominator
    stats["total"] = len(establishments)
    return stats


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("files", nargs="+", type=Path)
    parser.add_argument("--matt", action="store_true", help="mät bara, skriv ingenting")
    parser.add_argument("--refresh", action="store_true", help="hämta OSM-uttaget på nytt")
    args = parser.parse_args()

    total: Counter = Counter()
    for path in args.files:
        total.update(process(path, args.refresh, write=not args.matt, matt=args.matt))

    denominator = total["denominator"]
    if not denominator:
        return
    print(
        f"\nSAMMANLAGT: {total['stop']} av {denominator} med koordinat "
        f"({total['stop'] / denominator:.1%}) fick närmaste hållplats inom "
        f"{int(STOP_RADIUS_M)} m, och {total['parking']} ({total['parking'] / denominator:.1%}) "
        f"fick minst en parkering inom {int(PARKING_RADIUS_M)} m. "
        f"{total['total']} rader totalt, varav {total['no_coordinate']} utan koordinat "
        f"och {total['approximate']} med koordinat på gatunivå.",
        file=sys.stderr,
    )
    for key in sorted(k for k in total if k.startswith("mode_")):
        print(f"  {key:16s} {total[key]:5d}", file=sys.stderr)
    print(
        f"  namngiven hållplats {total['stop_named']}, namnlös {total['stop_unnamed']}",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
