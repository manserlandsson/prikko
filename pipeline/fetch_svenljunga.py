#!/usr/bin/env python3
"""Hämta Svenljungas livsmedelskontroller.

Ett anrop för listan och ett per kontrollrapport, alltså cirka 225 stycken.
Omdömet finns bara inuti PDF:erna, så till skillnad från Höganäs går det inte
att hoppa över dem.

    python3 pipeline/fetch_svenljunga.py --out site/src/data/svenljunga.json

    --cache <katalog>   spara hämtade PDF:er och läs dem därifrån nästa gång

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
from dataclasses import replace
from datetime import date, datetime
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko.dates import resolve_control_date  # noqa: E402
from prikko.grading import Inspection, assess  # noqa: E402
from prikko.pdf import extract_text  # noqa: E402
from prikko.sources.svenljunga import (  # noqa: E402
    MUNICIPALITY_CITY,
    MUNICIPALITY_CODE,
    MUNICIPALITY_NAME,
    SOURCE_URL,
    UnknownSourceValue,
    normalize_establishment,
    normalize_inspections,
    parse_page,
    parse_report,
)
from prikko.text import dedupe_slugs, slugify  # noqa: E402

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"
POLITE_DELAY_S = 1.2
ATTEMPTS = 3


def get(url: str) -> bytes:
    """Hämta med omförsök."""
    for attempt in range(ATTEMPTS):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=120) as response:
                return response.read()
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            if attempt == ATTEMPTS - 1:
                raise
            wait = 2 ** attempt
            print(f"  ! {type(exc).__name__}, försöker igen om {wait}s", file=sys.stderr)
            time.sleep(wait)
    return b""


def report_bytes(url: str, key: str, cache: Optional[Path]) -> bytes:
    """Rapporten, ur cachen om den finns där.

    En publicerad rapport ändras aldrig — kommunen laddar upp en ny fil med
    ett nytt id i stället. Cachen är därför säker, och den gör det möjligt att
    köra om inläsningen utan att belasta kommunen med 225 anrop till.
    """
    if cache is not None:
        stored = cache / f"{key}.pdf"
        if stored.exists():
            return stored.read_bytes()

    raw = get(url)
    time.sleep(POLITE_DELAY_S)
    if cache is not None:
        cache.mkdir(parents=True, exist_ok=True)
        (cache / f"{key}.pdf").write_bytes(raw)
    return raw


def build(today: date, limit: Optional[int], cache: Optional[Path]) -> dict:
    try:
        markup = get(SOURCE_URL).decode("utf-8", "replace")
    except Exception as exc:
        raise SystemExit(f"Listsidan gick inte att hämta: {exc}")

    try:
        listings = parse_page(markup)
    except UnknownSourceValue as exc:
        raise SystemExit(f"Listsidan: {exc}")

    print(
        f"  {len(listings)} verksamheter, "
        f"{sum(len(l.files) for l in listings)} rapporter",
        file=sys.stderr,
    )
    if limit:
        listings = listings[:limit]

    records, unreadable = [], 0

    for listing in listings:
        reports = []
        for file in listing.files:
            try:
                raw = report_bytes(file.url, file.id, cache)
            except Exception as exc:
                print(f"  ! {file.filename} gick inte att hämta: {exc}", file=sys.stderr)
                unreadable += 1
                continue
            try:
                report = parse_report(extract_text(raw), file)
            except UnknownSourceValue as exc:
                print(f"  ! {exc}", file=sys.stderr)
                unreadable += 1
                continue

            # Kontrolldatumet enligt ordningen i prikko/dates.py: brödtexten
            # först, rapportens eget datum när brödtexten säger något som inte
            # kan ha hänt än, dagens datum som sista utväg. Det görs HÄR och
            # inte i parse_report, som ska förbli en ren tolkning av det
            # rapporten säger, utan klocka och utan utskrifter.
            resolved = resolve_control_date(report.inspected_at, file.published_at, today)
            if resolved.rejected is not None:
                print(
                    f"  ! {file.filename}: kontrolldatumet {resolved.rejected} ligger i "
                    f"framtiden, använder {resolved.value} ur {resolved.source}",
                    file=sys.stderr,
                )
                report = replace(report, inspected_at=resolved.value)

            reports.append(report)

        establishment = normalize_establishment(listing)
        inspections = normalize_inspections(listing, reports, establishment.id_national)

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
                        "areas": [],
                        # Länken till kommunens egen rapport. Databasen har
                        # ingen kolumn för den ännu, men rapporten är det enda
                        # stället där avvikelserna står. Se källmodulen.
                        "reportUrl": i.report_url,
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
            "slug": "svenljunga",
        },
        "source": {
            "url": SOURCE_URL,
            "fetchedAt": datetime.now().isoformat(timespec="seconds"),
        },
        "skipped": unreadable,
        "establishments": records,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--cache", type=Path, default=None)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()

    data = build(date.today(), args.limit, args.cache)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")

    total = len(data["establishments"])
    assessed = sum(1 for e in data["establishments"] if e["verdict"])
    print(
        f"\nSkrev {total} anläggningar till {args.out} "
        f"({assessed} med bedömning, {data['skipped']} olästa rapporter)",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
