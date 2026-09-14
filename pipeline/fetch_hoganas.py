#!/usr/bin/env python3
"""Hämta Höganäs livsmedelskontroller.

Tre anrop mot kommunens filarkiv, ett per mapp. Ingen PDF öppnas: hela
resultatet står i filnamnet.

    python3 pipeline/fetch_hoganas.py --out site/src/data/hoganas.json

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
from prikko.sources.hoganas import (  # noqa: E402
    FOLDERS,
    MUNICIPALITY_CITY,
    MUNICIPALITY_CODE,
    MUNICIPALITY_NAME,
    SOURCE_URL,
    UnknownSourceValue,
    check_legend,
    folder_url,
    group_reports,
    normalize_establishment,
    normalize_inspections,
    parse_listing,
    parse_report,
)
from prikko.text import dedupe_slugs, slugify  # noqa: E402
from prikko.natverk import oppna  # noqa: E402  kakburk, se modulen

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"
POLITE_DELAY_S = 1.5
ATTEMPTS = 3


def get(url: str) -> str:
    """Hämta en sida med omförsök."""
    for attempt in range(ATTEMPTS):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with oppna(request, timeout=120) as response:
                return response.read().decode("utf-8", "replace")
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            if attempt == ATTEMPTS - 1:
                raise
            wait = 2 ** attempt
            print(f"  ! {type(exc).__name__}, försöker igen om {wait}s", file=sys.stderr)
            time.sleep(wait)
    return ""


def collect() -> tuple:
    """Hämta de tre mapparna och gruppera rapporterna per verksamhet.

    Returnerar (grupper, antal olästa filnamn). Ett filnamn som inte går att
    läsa hoppas över för sig — en verksamhet med flera rapporter ska inte
    försvinna för att en av dem är felskriven.
    """
    pairs, unreadable = [], 0

    for folder, category in FOLDERS.items():
        try:
            markup = get(folder_url(folder))
        except Exception as exc:
            # En tappad mapp är en tyst lucka i beståndet. Avbryt hellre.
            raise SystemExit(f"Mappen {category!r} gick inte att hämta: {exc}")
        finally:
            time.sleep(POLITE_DELAY_S)

        try:
            # Läsanvisningen kontrolleras FÖRE filerna. Har kommunen ändrat
            # sin färgskala betyder filnamnen något annat än vi tror.
            check_legend(markup)
        except UnknownSourceValue as exc:
            raise SystemExit(f"Mappen {category!r}: {exc}")

        listing = parse_listing(markup)
        if not listing:
            raise SystemExit(
                f"Mappen {category!r} innehöll inga rapporter — filarkivet har "
                "bytt form eller adress."
            )

        for url, filename in listing:
            try:
                pairs.append((parse_report(url, filename), category))
            except UnknownSourceValue as exc:
                print(f"  ! {exc}", file=sys.stderr)
                unreadable += 1

        print(f"  {category:34s} {len(listing):4d}", file=sys.stderr)

    grouped = group_reports(pairs)
    extra = len(pairs) - len(grouped)
    if extra:
        print(
            f"  {extra} rapporter är återbesök eller äldre kontroller på "
            "verksamheter som redan fanns",
            file=sys.stderr,
        )
    return grouped, unreadable


def build(today: date, limit: Optional[int]) -> dict:
    grouped, skipped = collect()
    if limit:
        grouped = grouped[:limit]

    records = []

    for reports, categories in grouped:
        try:
            # Senaste rapporten bär namn, ort och kategori. Äldre rapporter kan
            # stava namnet annorlunda; den färskaste är den vi visar.
            establishment = normalize_establishment(reports[0], categories)
            inspections = normalize_inspections(reports, establishment.id_national)
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
                        # ingen kolumn för den ännu, men att tappa den i
                        # hämtningen vore att slänga bort det enda stället där
                        # avvikelserna faktiskt står. Se källmodulen.
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
            "slug": "hoganas",
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
