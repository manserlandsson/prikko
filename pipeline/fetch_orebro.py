#!/usr/bin/env python3
"""Hämta Örebros livsmedelskontroller.

Dyraste källan hittills: ett anrop för listan, ett per verksamhet för
historiken och ett per kontroll för punkterna — cirka 9 000 totalt.

    python3 pipeline/fetch_orebro.py --out site/src/data/orebro.json

Kör snällt. Anropen görs med en handfull parallella arbetare i stället för
alla på en gång, med paus mellan varje och tydlig user agent. Vi lever på att
kommunerna fortsätter tycka om oss, och 9 000 anrop är tillräckligt mycket
för att någon ska märka hur de kom in.
"""

from __future__ import annotations

import argparse
import json
import sys
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko.grading import Inspection, assess  # noqa: E402
from prikko.sources.orebro import (  # noqa: E402
    MUNICIPALITY_CITY,
    MUNICIPALITY_CODE,
    MUNICIPALITY_NAME,
    SEARCH_URL,
    SOURCE_URL,
    UnknownSourceValue,
    facility_url,
    normalize_establishment,
    normalize_inspection,
    parse_history,
    reports_url,
    under_embargo,
)
from prikko.text import dedupe_slugs, slugify  # noqa: E402

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"
POLITE_DELAY_S = 0.15
WORKERS = 5
ATTEMPTS = 4

_progress = threading.Lock()
_done = 0


def get(url: str, as_json: bool = True):
    """Hämta med omförsök och exponentiell backoff."""
    for attempt in range(ATTEMPTS):
        try:
            request = urllib.request.Request(url, headers={
                "User-Agent": USER_AGENT,
                "Accept": "application/json, text/html",
            })
            with urllib.request.urlopen(request, timeout=90) as response:
                body = response.read().decode("utf-8", "replace")
            return json.loads(body) if as_json else body
        except (urllib.error.URLError, TimeoutError, OSError, ValueError) as exc:
            if attempt == ATTEMPTS - 1:
                raise
            time.sleep(2 ** attempt)
    return None


def collect_facility(raw: dict, today: date) -> Optional[dict]:
    """Hämta en verksamhets historik och alla dess kontrollpunkter."""
    global _done

    try:
        establishment = normalize_establishment(raw)
        html = get(facility_url(establishment.id_local), as_json=False)
        history = parse_history(html)

        inspections = []
        for entry in history:
            if under_embargo(entry, today):
                # Kommunen håller inne resultatet i 30 dagar så verksamheten
                # hinner yttra sig. Vi går inte förbi den spärren.
                continue
            reports = get(reports_url(entry.id))
            time.sleep(POLITE_DELAY_S)
            normalized = normalize_inspection(entry, reports, establishment.id_national)
            if normalized is not None:
                inspections.append(normalized)

        return {"establishment": establishment, "inspections": inspections}
    except UnknownSourceValue as exc:
        print(f"  ! hoppar över: {exc}", file=sys.stderr)
        return None
    except Exception as exc:
        print(f"  ! {raw.get('Objektsnamn')!r}: {type(exc).__name__} {exc}", file=sys.stderr)
        return None
    finally:
        with _progress:
            _done += 1
            if _done % 25 == 0:
                print(f"  {_done} verksamheter", file=sys.stderr)


def build(today: date, limit: Optional[int]) -> dict:
    facilities = get(SEARCH_URL)
    print(f"Listan: {len(facilities)} verksamheter", file=sys.stderr)
    if limit:
        facilities = facilities[:limit]

    collected = []
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = [pool.submit(collect_facility, f, today) for f in facilities]
        for future in as_completed(futures):
            result = future.result()
            if result is not None:
                collected.append(result)

    skipped = len(facilities) - len(collected)
    records = []

    for item in collected:
        establishment = item["establishment"]
        inspections = sorted(item["inspections"], key=lambda x: x.inspected_at, reverse=True)

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

    # Ordningen blir godtycklig av parallellhämtningen. Sortera så filen är
    # jämförbar mellan körningar — annars ger varje hämtning en diff på hela
    # filen utan att något ändrats.
    records.sort(key=lambda r: r["id"])
    dedupe_slugs(records)

    return {
        "municipality": {
            "code": MUNICIPALITY_CODE,
            "name": MUNICIPALITY_NAME,
            "city": MUNICIPALITY_CITY,
            "slug": "orebro",
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
    areas = sum(len(i["areas"]) for e in data["establishments"] for i in e["inspections"])
    print(
        f"\nSkrev {total} anläggningar till {args.out} "
        f"({assessed} med bedömning, {areas} kontrollpunkter, "
        f"{data['skipped']} överhoppade)",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
