#!/usr/bin/env python3
"""Hämta Lommas livsmedelsinspektioner.

Fyra anrop mot kommunens webbplats, ett per verksamhetsgrupp. Hela beståndet
hämtas på sekunder.

    python3 pipeline/fetch_lomma.py --out site/src/data/lomma.json

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

from prikko.grading import Inspection, assess  # noqa: E402
from prikko.sources.lomma import (  # noqa: E402
    MUNICIPALITY_CITY,
    MUNICIPALITY_CODE,
    MUNICIPALITY_NAME,
    PAGES,
    SOURCE_URL,
    UnknownSourceValue,
    check_legend,
    merge_listings,
    normalize_establishment,
    normalize_inspections,
    page_url,
    parse_page,
)
from prikko.text import dedupe_slugs, slugify  # noqa: E402

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"
POLITE_DELAY_S = 1.5
ATTEMPTS = 3


def get(url: str) -> str:
    """Hämta en sida med omförsök."""
    for attempt in range(ATTEMPTS):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=120) as response:
                return response.read().decode("utf-8", "replace")
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            if attempt == ATTEMPTS - 1:
                raise
            wait = 2 ** attempt
            print(f"  ! {type(exc).__name__}, försöker igen om {wait}s", file=sys.stderr)
            time.sleep(wait)
    return ""


def collect() -> list:
    """Hämta alla fyra sidorna och slå ihop dubbletterna.

    Returnerar (listing, typer)-par. En verksamhet kan stå på två sidor — se
    `merge_listings`.
    """
    pairs = []
    for page, page_type in PAGES.items():
        try:
            markup = get(page_url(page))
        except Exception as exc:
            # En tappad sida är en tyst lucka i beståndet. Avbryt hellre.
            raise SystemExit(f"Sidan {page} ({page_type}) gick inte att hämta: {exc}")
        finally:
            time.sleep(POLITE_DELAY_S)

        try:
            # Läsanvisningen kontrolleras FÖRE posterna. Har kommunen ändrat
            # sin färgskala betyder posterna något annat än vi tror, och då
            # ska ingenting publiceras.
            check_legend(markup)
            listings = parse_page(markup)
        except UnknownSourceValue as exc:
            raise SystemExit(f"Sidan {page}: {exc}")

        print(f"  {page_type:22s} {len(listings):4d}", file=sys.stderr)
        pairs += [(l, page_type) for l in listings]

    merged = merge_listings(pairs)
    if len(merged) != len(pairs):
        print(
            f"  {len(pairs) - len(merged)} poster stod på flera sidor och slogs ihop",
            file=sys.stderr,
        )
    return merged


def build(today: date, limit: Optional[int]) -> dict:
    listings = collect()
    if limit:
        listings = listings[:limit]

    records, skipped = [], 0

    for listing, types in listings:
        try:
            establishment = normalize_establishment(listing, types)
            inspections = normalize_inspections(listing, establishment.id_national)
        except UnknownSourceValue as exc:
            print(f"  ! hoppar över: {exc}", file=sys.stderr)
            skipped += 1
            continue

        if not establishment.name:
            skipped += 1
            continue

        result = assess(
            [
                Inspection(
                    id_national=i.id_national,
                    inspected_at=i.inspected_at,
                    assessment=i.assessment,
                    type=i.type,
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
                "uncertain": any(
                    i.uncertain for i in inspections if i.id_national in result.based_on
                ),
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
                    for i in inspections
                ],
            }
        )

    dedupe_slugs(records)

    return {
        "municipality": {
            "code": MUNICIPALITY_CODE,
            "name": MUNICIPALITY_NAME,
            "city": MUNICIPALITY_CITY,
            "slug": "lomma",
        },
        "source": {
            "url": SOURCE_URL,
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
