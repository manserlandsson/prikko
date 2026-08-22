#!/usr/bin/env python3
"""Sätt öppettider på verksamheter genom att para dem mot OpenStreetMap.

    python3 pipeline/oppettider.py site/src/data/*.json
    python3 pipeline/oppettider.py --matt site/src/data/*.json

`--matt` mäter och skriver ingenting. Utan flaggan skrivs `hours` i
datafilen på de verksamheter som fick en belagd hopparning, och filens
`openingHours` bär källa, licens och hämtningsdatum.

NÄMNAREN
--------
Öppettider mäts ALDRIG mot hela beståndet. Av 15 983 rader är 9 961
konsumentvända, alltså restaurang, café eller butik enligt
site/src/lib/categories.ts. Resten är förskolekök, äldreboenden, matmäklare,
grossister och dricksvattenposter. En öppettid betyder ingenting för ett
förskolekök, och OSM kartlägger dem inte heller. Körningen skriver ut
nämnaren varje gång, och den nämnaren är den konsumentvända.

KÄLLAN
------
OpenStreetMap via Overpass API, ODbL 1.0, © OpenStreetMap contributors.
Attributionen måste stå där öppettiden visas. En öppettid i OSM kan vara
flera år gammal, och det ska sidan säga rakt ut.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import List

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko.oppettider import (  # noqa: E402
    MATCHED,
    MISS_AMBIGUOUS,
    MISS_NO_CANDIDATE,
    MISS_NO_COORDINATE,
    MISS_NO_HOURS,
    MISS_NO_NAME,
    PoiIndex,
    compile_hours,
    overpass_query,
    pair,
    pois_from_overpass,
)

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"

ENDPOINTS = (
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
)

ROOT = Path(__file__).resolve().parent
EXTRACT_DIR = ROOT / "data" / "interim"

#: Verksamheter i de här toppkategorierna är konsumentvända. Speglar
#: site/src/lib/categories.ts, och den listan är sanningen. Ändras den där
#: ska den ändras här.
KONSUMENT = {"restaurang", "cafe", "butik"}

PROVENANCE = {
    "method": "derived",
    "source": "OpenStreetMap via Overpass API",
    "licence": "ODbL 1.0",
    "attribution": "© OpenStreetMap contributors",
}


def overpass(query: str, tries: int = 6) -> dict:
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


def fetch_pois(code: str, refresh: bool) -> List[dict]:
    """Kommunens matpunkter. En fråga per kommun, sedan en fil på disk.

    Uttaget ligger i data/interim/ utanför versionshanteringen, precis som
    adressuttagen i geocode.py: det är stort, det är någon annans datamängd,
    och det går att hämta igen.
    """
    EXTRACT_DIR.mkdir(parents=True, exist_ok=True)
    path = EXTRACT_DIR / f"osm_poi_{code}.json"
    if path.exists() and not refresh:
        return json.loads(path.read_text(encoding="utf-8"))["elements"]

    print(f"  hämtar matpunkter för kommun {code} från Overpass", file=sys.stderr)
    # Kommungränsen slås upp på SCB-koden, inte på namnet. Samma val som i
    # geocode.py: namn ändras, koden gör det inte.
    boundary = overpass(
        f'[out:json][timeout:180];relation["ref:scb"="{code}"]["admin_level"="7"];out ids;'
    )
    relations = boundary.get("elements") or []
    if len(relations) != 1:
        raise SystemExit(f"Hittade {len(relations)} kommungränser för {code}, väntade en.")
    area = 3600000000 + relations[0]["id"]

    payload = overpass(overpass_query(area))
    elements = payload.get("elements") or []
    # NOLL MATPUNKTER ÄR INTE ETT UTFALL, DET ÄR ETT FEL.
    # Ingen svensk kommun saknar restauranger och butiker i OSM; Svenljunga,
    # den minsta vi har, ger dryga trettio. Ett tomt svar betyder att
    # områdesuppslaget inte gick fram, och Overpass svarar då 200 med en tom
    # lista i stället för ett fel. Skrev vi den till disk hade nästa körning
    # läst den ur cachen och tyst tagit bort öppettiderna i hela kommunen.
    if not elements:
        raise SystemExit(
            f"Overpass gav noll matpunkter för kommun {code}. Det är ett fel och "
            f"inte ett utfall: områdesuppslaget gick sannolikt inte fram. "
            f"Kör om kommunen ensam."
        )
    path.write_text(json.dumps(payload), encoding="utf-8")
    return elements


def classify_via_node(pairs: List[tuple]) -> List[List[str]]:
    """Kategorisera (kommun, typer) med sajtens egen tabell.

    Anropar node med site/src/lib/categories.ts. Alternativet, att skriva av
    228 råvärden till Python, hade blivit en andra sanning som tyst glider
    isär från den första.
    """
    import subprocess

    site_lib = (ROOT.parent / "site" / "src" / "lib" / "categories.ts").resolve()
    script = (
        "const { classify } = await import(process.argv[1]);\n"
        "let raw = '';\n"
        "for await (const chunk of process.stdin) raw += chunk;\n"
        "const input = JSON.parse(raw);\n"
        "process.stdout.write(JSON.stringify(input.map(([m, t]) => {\n"
        "  const c = classify(m, t);\n"
        "  return c.status === 'spanning' ? ['restaurang', 'cafe', 'butik'] : c.categories;\n"
        "})));\n"
    )
    result = subprocess.run(
        ["node", "--input-type=module", "-e", script, str(site_lib)],
        input=json.dumps(pairs),
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise SystemExit(f"Kunde inte köra categories.ts:\n{result.stderr}")
    return json.loads(result.stdout)


def process(path: Path, refresh: bool, write: bool) -> Counter:
    payload = json.loads(path.read_text(encoding="utf-8"))
    code = payload["municipality"]["code"]
    slug = payload["municipality"]["slug"]
    name = payload["municipality"]["name"]
    establishments = payload["establishments"]

    categories = classify_via_node([(slug, e.get("types") or []) for e in establishments])
    consumer = [
        e
        for e, cats in zip(establishments, categories)
        if any(c in KONSUMENT for c in cats)
    ]

    print(
        f"{name}: {len(establishments)} verksamheter, "
        f"{len(consumer)} konsumentvända ({len(consumer) / len(establishments):.1%})",
        file=sys.stderr,
    )

    index = PoiIndex(pois_from_overpass(fetch_pois(code, refresh)))
    with_hours = sum(1 for p in index.pois if p.opening_hours)
    print(
        f"  OSM: {len(index.pois)} namngivna matpunkter, "
        f"{with_hours} med opening_hours ({with_hours / len(index.pois):.1%})"
        if index.pois
        else "  OSM: inga matpunkter",
        file=sys.stderr,
    )

    stats: Counter = Counter()
    today = datetime.now(timezone.utc).date().isoformat()
    consumer_ids = {id(e) for e in consumer}

    for establishment in establishments:
        # Öppettiden skrivs BARA på konsumentvända. Ett förskolekök som råkar
        # ligga tio meter från ett café ska aldrig ärva caféets öppettid.
        if id(establishment) not in consumer_ids:
            establishment.pop("hours", None)
            establishment.pop("contact", None)
            continue

        result = pair(
            index,
            establishment.get("name"),
            establishment.get("lat"),
            establishment.get("lng"),
            approximate=establishment.get("geoPrecision") == "approximate",
        )
        stats[result.reason] += 1

        # KONTAKTUPPGIFTERNA HÄNGER PÅ HOPPARNINGEN, INTE PÅ ÖPPETTIDEN.
        # `matched_without_hours` betyder att vi VET vilket OSM-objekt det är
        # men att objektet saknar `opening_hours`. Det är 1 097 verksamheter
        # utöver de 2 830 med tider, och deras telefonnummer är precis lika
        # belagda. Skrev vi kontakten bara på MATCHED hade en fjärdedel av
        # skörden fallit bort av ett skäl som inte har med telefon att göra.
        if result.poi is not None and result.reason in (MATCHED, MISS_NO_HOURS):
            contact = {}
            for key, value in (
                ("phone", result.poi.phone),
                ("website", result.poi.website),
                ("email", result.poi.email),
            ):
                if value:
                    contact[key] = value
                    stats[f"contact_{key}"] += 1
            contact.update(result.poi.facts)
            for key in result.poi.facts:
                stats[f"fact_{key}"] += 1
            if contact:
                stats["contact"] += 1
                if write:
                    # `osm` och `checkedAt` kostar två rader per verksamhet,
                    # alltså dryga 6 500 i alla tolv filerna. De betalar sig:
                    # utan objektets id finns ingen "Rätta"-länk, och då är
                    # den enda vägen för den som ser ett fel att mejla oss om
                    # en uppgift vi inte äger.
                    establishment["contact"] = {
                        **contact,
                        "osm": result.poi.ref,
                        "checkedAt": today,
                    }
            elif write:
                establishment.pop("contact", None)
        elif write:
            establishment.pop("contact", None)

        if result.reason != MATCHED or result.poi is None:
            establishment.pop("hours", None)
            continue

        compiled = compile_hours(result.poi.opening_hours or "")
        if compiled is None:
            # Uttrycket ligger utanför vår delmängd. Hellre ingen öppettid än
            # en halvtolkad.
            stats["unsupported_syntax"] += 1
            stats[MATCHED] -= 1
            establishment.pop("hours", None)
            continue

        stats["written"] += 1
        if write:
            establishment["hours"] = {
                "raw": result.poi.opening_hours,
                "week": compiled["week"],
                "ph": compiled["ph"],
                "osm": result.poi.ref,
                "checkedAt": today,
            }

    if write:
        # Licensblocket skrivs bara när filen faktiskt bär en uppgift ur OSM.
        # En ODbL-klausul i en fil utan en enda sådan uppgift är ett påstående
        # om data som inte finns, och i fyra av tolv kommuner är det just
        # läget: de saknar koordinater helt och kan därför inte paras alls.
        #
        # Blocket hette `openingHours` när öppettiden var det enda vi tog ur
        # OSM. Nu bär filen även telefon och webbplats ur samma uttag och
        # under samma licens, så det heter `openstreetmap` och räknar upp vad
        # det täcker. Ingen kod läser blocket, det är ett licensspår i filen.
        if stats["written"] or stats["contact"]:
            covers = []
            if stats["written"]:
                covers.append("hours")
            if stats["contact"]:
                covers.append("contact")
            payload = insert_after(
                payload,
                "source",
                "openstreetmap",
                {
                    **PROVENANCE,
                    "covers": covers,
                    "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                },
            )
        else:
            payload.pop("openstreetmap", None)
        payload.pop("openingHours", None)
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")

    denominator = len(consumer)
    written = stats["written"]
    share = f" ({written / denominator:.1%})" if denominator else ""
    print(
        f"  {written} av {denominator} konsumentvända fick öppettid{share}",
        file=sys.stderr,
    )
    for reason in (
        MATCHED,
        MISS_NO_HOURS,
        MISS_NO_CANDIDATE,
        MISS_AMBIGUOUS,
        MISS_NO_COORDINATE,
        MISS_NO_NAME,
        "unsupported_syntax",
    ):
        if stats[reason]:
            print(f"    {reason}: {stats[reason]}", file=sys.stderr)

    # Kontaktuppgifterna har en ANNAN nämnare än öppettiderna, och den är
    # större: de hänger på hopparningen och inte på att OSM råkar ha en
    # öppettid. Skrivs de ut mot samma nämnare ser de sämre ut än de är.
    if stats["contact"]:
        print(
            f"  {stats['contact']} av {denominator} fick kontaktuppgift "
            f"({stats['contact'] / denominator:.1%})",
            file=sys.stderr,
        )
        for key in sorted(k for k in stats if k.startswith(("contact_", "fact_"))):
            print(f"    {key}: {stats[key]}", file=sys.stderr)

    stats["consumer"] = denominator
    stats["total"] = len(establishments)
    return stats


def insert_after(mapping: dict, after: str, key: str, value) -> dict:
    """Kopia där `key` ligger direkt efter `after`. Samma skäl som i
    geocode.py: nya fält sist gör diffen svårläst.

    FINNS NYCKELN REDAN LIGGER DEN KVAR DÄR DEN LIGGER, och det är inte
    kosmetika. Blockens ordning på filens toppnivå är ett prov:
    test_export_koordinater.py::test_blockordningen_ar_filernas läser FILBLOCK
    ur export_supabase.py och kräver att filerna bär blocken i samma ordning.

    Nattjobbet kör oppettider.py FÖRE narhet.py, så `narhet` hamnar efter
    `openstreetmap` och FILBLOCK står i den ordningen. Kördes den här filen
    ensam i efterhand flyttades `openstreetmap` upp direkt efter `source`,
    ordningen kastades om, och provet föll. Det hände 2026-08-21.
    """
    if key in mapping:
        return {existing: (value if existing == key else current)
                for existing, current in mapping.items()}

    rebuilt: dict = {}
    for existing, current in mapping.items():
        rebuilt[existing] = current
        if existing == after:
            rebuilt[key] = value
    if key not in rebuilt:
        rebuilt[key] = value
    return rebuilt


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("files", nargs="+", type=Path)
    parser.add_argument("--matt", action="store_true", help="mät bara, skriv ingenting")
    parser.add_argument("--refresh", action="store_true", help="hämta OSM-uttaget på nytt")
    args = parser.parse_args()

    total: Counter = Counter()
    for path in args.files:
        stats = process(path, args.refresh, write=not args.matt)
        total.update(stats)

    consumer = total["consumer"]
    print(
        f"\nSAMMANLAGT: {total['written']} av {consumer} konsumentvända "
        f"({total['written'] / consumer:.1%}) fick öppettid, "
        f"av {total['total']} rader totalt.",
        file=sys.stderr,
    )
    print(
        f"{total['contact']} av {consumer} ({total['contact'] / consumer:.1%}) "
        f"fick minst en kontaktuppgift eller egenskap:",
        file=sys.stderr,
    )
    for key in sorted(k for k in total if k.startswith(("contact_", "fact_"))):
        print(f"  {key:22s} {total[key]:5d}  {total[key] / consumer:6.1%}", file=sys.stderr)


if __name__ == "__main__":
    main()
