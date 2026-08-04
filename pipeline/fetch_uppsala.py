#!/usr/bin/env python3
"""Hämta Uppsalas livsmedelskontroller.

Två steg: bläddra listan (10 per sida) för att få alla verksamheter, hämta
sedan varje detaljsida för full kontrollhistorik.

    python3 pipeline/fetch_uppsala.py --out site/src/data/uppsala.json

Kör snällt: paus mellan anropen och tydlig user agent.
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
from prikko.sources.uppsala import (  # noqa: E402
    BASE,
    MUNICIPALITY_CITY,
    MUNICIPALITY_CODE,
    MUNICIPALITY_NAME,
    PER_PAGE,
    UnknownSourceValue,
    normalize_establishment,
    normalize_inspections,
    parse_list_page,
    total_hits,
)
from prikko.text import dedupe_slugs, slugify  # noqa: E402

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"
POLITE_DELAY_S = 0.3


def get(url: str) -> str:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "X-Requested-With": "XMLHttpRequest"},
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        return response.read().decode("utf-8", "replace")


def collect_list() -> list:
    """Bläddra igenom hela listan."""
    first = get(f"{BASE}/?ajax=1&query=&page=1")
    total = total_hits(first) or 0
    pages = max(1, -(-total // PER_PAGE))
    print(f"Uppsala: {total} verksamheter på {pages} sidor", file=sys.stderr)

    records = parse_list_page(first)
    for page in range(2, pages + 1):
        try:
            records += parse_list_page(get(f"{BASE}/?ajax=1&query=&page={page}"))
        except (urllib.error.URLError, TimeoutError) as exc:
            print(f"  ! sida {page}: {exc}", file=sys.stderr)
        time.sleep(POLITE_DELAY_S)
        if page % 25 == 0:
            print(f"  sida {page}/{pages} · {len(records)} poster", file=sys.stderr)

    # Samma verksamhet kan dyka upp på flera sidor om listan ändras under tiden.
    seen, unique = set(), []
    for r in records:
        if r["id"] not in seen:
            seen.add(r["id"])
            unique.append(r)
    return unique


def build(limit: Optional[int], today: date) -> dict:
    listing = collect_list()
    if limit:
        listing = listing[:limit]

    records, skipped = [], 0

    for index, record in enumerate(listing, 1):
        try:
            detail = get(f"{BASE}/Details?id={record['id']}")
        except (urllib.error.URLError, TimeoutError) as exc:
            print(f"  ! {record['id']}: {exc}", file=sys.stderr)
            skipped += 1
            continue
        finally:
            time.sleep(POLITE_DELAY_S)

        try:
            establishment = normalize_establishment(record, detail)
            inspections = normalize_inspections(
                detail, establishment.id_national, record["id"]
            )
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
                "lat": None,
                "lng": None,
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

        if index % 100 == 0:
            print(f"  {index}/{len(listing)}", file=sys.stderr)

    dedupe_slugs(records)

    return {
        "municipality": {
            "code": MUNICIPALITY_CODE,
            "name": MUNICIPALITY_NAME,
            "city": MUNICIPALITY_CITY,
            "slug": "uppsala",
            "sourceType": "reverse_engineered",
            "adapter": "uppsala",
        },
        "source": {"url": BASE, "fetchedAt": datetime.now().isoformat(timespec="seconds")},
        "skipped": skipped,
        "establishments": records,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()

    data = build(args.limit, date.today())

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
