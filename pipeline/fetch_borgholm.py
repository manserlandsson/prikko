#!/usr/bin/env python3
"""Hämta Borgholms livsmedelskontroller.

Två anrop: sidan, som bär länken, och PDF-tabellen. Hela beståndet ligger i
den enda filen.

    python3 pipeline/fetch_borgholm.py --out site/src/data/borgholm.json

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
from prikko.pdf import extract_blocks  # noqa: E402
from prikko.sources.borgholm import (  # noqa: E402
    MUNICIPALITY_CITY,
    MUNICIPALITY_CODE,
    MUNICIPALITY_NAME,
    SOURCE_URL,
    UnknownSourceValue,
    find_pdf_url,
    group_rows,
    normalize_establishment,
    normalize_inspections,
    parse_table,
    partition_rows,
)
from prikko.text import dedupe_slugs, slugify  # noqa: E402

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"
POLITE_DELAY_S = 1.5
ATTEMPTS = 3


def get(url: str) -> bytes:
    """Hämta med omförsök."""
    for attempt in range(ATTEMPTS):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=180) as response:
                return response.read()
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            if attempt == ATTEMPTS - 1:
                raise
            wait = 2 ** attempt
            print(f"  ! {type(exc).__name__}, försöker igen om {wait}s", file=sys.stderr)
            time.sleep(wait)
    return b""


def collect(source: Optional[Path]) -> list:
    """Hämta tabellen och bygg tillbaka raderna."""
    if source is not None:
        document = source.read_bytes()
    else:
        try:
            markup = get(SOURCE_URL).decode("utf-8", "replace")
        except Exception as exc:
            raise SystemExit(f"Sidan gick inte att hämta: {exc}")
        time.sleep(POLITE_DELAY_S)

        try:
            url = find_pdf_url(markup)
        except UnknownSourceValue as exc:
            raise SystemExit(str(exc))

        print(f"  tabell: {url}", file=sys.stderr)
        try:
            document = get(url)
        except Exception as exc:
            raise SystemExit(f"Tabellen gick inte att hämta: {exc}")

    try:
        rows = parse_table(extract_blocks(document))
    except UnknownSourceValue as exc:
        raise SystemExit(f"Tabellen: {exc}")

    groups = group_rows(rows)
    print(
        f"  {len(rows)} rader, {len(groups)} verksamheter",
        file=sys.stderr,
    )
    return groups


def build(today: date, limit: Optional[int], source: Optional[Path]) -> dict:
    groups = collect(source)
    if limit:
        groups = groups[:limit]

    records, skipped = [], 0

    for first, rows in groups:
        readable, broken = partition_rows(rows)
        for row in broken:
            # En felskriven rad kostar inte hela verksamheten, men den ska
            # räknas och skrivas ut.
            print(
                f"  ! {first.namn}: oläsbart kontrolldatum {row.datum!r}",
                file=sys.stderr,
            )
            skipped += 1

        try:
            establishment = normalize_establishment(first)
            inspections = normalize_inspections(readable, establishment.id_national)
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
            "slug": "borgholm",
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
    parser.add_argument("--pdf", type=Path, default=None,
                        help="läs en redan hämtad tabell i stället för att hämta")
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()

    data = build(date.today(), args.limit, args.pdf)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")

    total = len(data["establishments"])
    assessed = sum(1 for e in data["establishments"] if e["verdict"])
    print(
        f"\nSkrev {total} anläggningar till {args.out} "
        f"({assessed} med bedömning, {data['skipped']} olästa rader)",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
