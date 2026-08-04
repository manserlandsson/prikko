#!/usr/bin/env python3
"""Hämta Stockholms livsmedelskontroller.

Stadens gränssnitt taggar svaret vid 1 500 poster, och Stockholm har fler
verksamheter än så. Beståndet hämtas därför i ett geografiskt rutnät över
stadens egen kartutbredning, med överlappande radier så inga luckor uppstår,
och dedupliceras på verksamhetens id.

    python3 pipeline/fetch_stockholm.py --out site/src/data/stockholm.json

Kör snällt: paus mellan anropen och tydlig user agent. Vi lever på att
kommunerna fortsätter tycka om oss.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from datetime import date, datetime
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko.grading import Area, Inspection, assess  # noqa: E402
from prikko.sources.stockholm import (  # noqa: E402
    ENDPOINT,
    EXTENT,
    MUNICIPALITY_CITY,
    MUNICIPALITY_CODE,
    MUNICIPALITY_NAME,
    REFERER,
    RESULT_CAP,
    UnknownSourceValue,
    normalize_establishment,
    normalize_inspections,
    search_body,
)
from prikko.text import dedupe_slugs, slugify  # noqa: E402

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"
POLITE_DELAY_S = 0.6

#: Avstånd mellan rutnätspunkter i meter.
GRID_STEP = 1500
#: Sökradie per punkt. Något mer än halva diagonalen (1 061 m) så rutorna
#: överlappar och inget faller mellan dem.
GRID_RADIUS = 1150


def post(body: dict) -> list:
    request = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": REFERER,
            "User-Agent": USER_AGENT,
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        return json.loads(response.read().decode("utf-8"))


def grid_points():
    min_e, min_n, max_e, max_n = EXTENT
    east = min_e
    while east <= max_e + GRID_STEP:
        north = min_n
        while north <= max_n + GRID_STEP:
            yield east, north
            north += GRID_STEP
        east += GRID_STEP


def collect() -> dict:
    """Hämta hela beståndet via rutnätet. Returnerar id → råpost."""
    points = list(grid_points())
    print(f"Rutnät: {len(points)} punkter à {GRID_RADIUS} m", file=sys.stderr)

    found: dict = {}
    capped = 0

    for index, (east, north) in enumerate(points, 1):
        try:
            batch = post(search_body(east=east, north=north, radius=GRID_RADIUS))
        except (urllib.error.URLError, TimeoutError) as exc:
            print(f"  ! ruta {index}: {exc}", file=sys.stderr)
            continue
        finally:
            time.sleep(POLITE_DELAY_S)

        if len(batch) >= RESULT_CAP:
            # Rutan var för tät. Loggas så vi vet att täckningen kan ha luckor.
            capped += 1
            print(f"  ! ruta {index} nådde taket ({len(batch)})", file=sys.stderr)

        for item in batch:
            found.setdefault(item["Id"], item)

        if index % 25 == 0:
            print(f"  {index}/{len(points)} · {len(found)} unika", file=sys.stderr)

    if capped:
        print(f"VARNING: {capped} rutor nådde taket — minska GRID_STEP", file=sys.stderr)

    return found


def build(today: date, limit: Optional[int]) -> dict:
    raw = collect()
    items = list(raw.values())
    if limit:
        items = items[:limit]

    records, skipped = [], 0

    for item in items:
        try:
            establishment = normalize_establishment(item)
            inspections = normalize_inspections(item, establishment.id_national)
        except UnknownSourceValue as exc:
            print(f"  ! hoppar över: {exc}", file=sys.stderr)
            skipped += 1
            continue

        result = assess(
            [
                Inspection(
                    id_national=i.id_national,
                    inspected_at=i.inspected_at,
                    assessment=i.assessment,
                    type=i.type,
                    # Sedan modellversion 4: rent administrativa avvikelser
                    # ska inte skärpa bedömningen, så punkterna följer med.
                    areas=tuple(
                        Area(a.code, a.group, a.description, a.status)
                        for a in i.areas
                    ),
                )
                for i in inspections
            ],
            today,
        )

        records.append(
            {
                "id": establishment.id_national,
                "slug": slugify(establishment.name),
                "name": establishment.name,
                "address": establishment.street_address,
                "types": establishment.types,
                "lat": establishment.lat,
                "lng": establishment.lng,
                "image": None,
                "verdict": result.verdict,
                "distinction": result.distinction,
                "reason": result.reason,
                "modelVersion": result.model_version,
                "uncertain": False,
                "inspections": [
                    {
                        "id": i.id_national,
                        "date": i.inspected_at.isoformat(),
                        "assessment": i.assessment,
                        "type": i.type,
                        "prenotified": i.prenotified,
                        "audit": i.audit,
                        "onSite": i.on_site,
                        "areas": [
                            {
                                "code": a.code,
                                "group": a.group,
                                "description": a.description,
                                "status": a.status,
                            }
                            for a in i.areas
                        ],
                    }
                    for i in sorted(inspections, key=lambda x: x.inspected_at, reverse=True)
                ],
            }
        )

    dedupe_slugs(records)

    return {
        "municipality": {
            "code": MUNICIPALITY_CODE,
            "name": MUNICIPALITY_NAME,
            "city": MUNICIPALITY_CITY,
            "slug": "stockholm",
        },
        "source": {
            "url": "https://etjanster.stockholm.se/livsmedelsinspektioner/",
            "fetchedAt": datetime.now().isoformat(timespec="seconds"),
        },
        "skipped": skipped,
        "establishments": records,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()

    data = build(date.today(), args.limit)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")

    total = len(data["establishments"])
    assessed = sum(1 for e in data["establishments"] if e["verdict"])
    print(
        f"\nSkrev {total} anläggningar till {args.out} "
        f"({assessed} med bedömning, {data['skipped']} överhoppade)",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
