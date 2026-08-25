#!/usr/bin/env python3
"""Hämta Oskarshamns livsmedelskontroller.

Sex anrop mot kommunens ArcGIS-tjänst, ett per underlager. Hela beståndet
hämtas på sekunder.

    python3 pipeline/fetch_oskarshamn.py --out site/src/data/oskarshamn.json

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
from prikko.sources.oskarshamn import (  # noqa: E402
    LAYERS,
    MUNICIPALITY_CITY,
    MUNICIPALITY_CODE,
    MUNICIPALITY_NAME,
    SOURCE_URL,
    UnknownSourceValue,
    check_deviation_count,
    merge_layers,
    normalize_establishment,
    normalize_inspections,
    query_url,
)
from prikko.text import dedupe_slugs, slugify  # noqa: E402

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"
POLITE_DELAY_S = 1.0
ATTEMPTS = 3


def get(url: str) -> dict:
    """Hämta med omförsök.

    Kommunen kör ArcGIS Enterprise på egen hårdvara, inte i molnet. En
    tillfällig hicka ska ge ett nytt försök, inte ett tappat lager.
    """
    for attempt in range(ATTEMPTS):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=120) as response:
                return json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            if attempt == ATTEMPTS - 1:
                raise
            wait = 2 ** attempt
            print(f"  ! {type(exc).__name__}, försöker igen om {wait}s", file=sys.stderr)
            time.sleep(wait)
    return {}


def collect() -> list:
    """Hämta alla sex lagren och slå ihop dubbletterna.

    Returnerar (feature, kategorier)-par. En anläggning kan ligga i två lager
    — se `merge_layers`.
    """
    pairs = []
    for layer, category in LAYERS.items():
        try:
            payload = get(query_url(layer))
        except Exception as exc:
            # Ett tappat lager är en tyst lucka i beståndet. Avbryt hellre.
            raise SystemExit(f"Lager {layer} ({category}) gick inte att hämta: {exc}")
        finally:
            time.sleep(POLITE_DELAY_S)

        if "error" in payload:
            # Bland annat "Token Required", som den felaktiga tjänsten
            # Livsmedelskontroller2 svarar.
            raise SystemExit(f"Lager {layer}: {payload['error']}")

        features = payload.get("features") or []
        if payload.get("exceededTransferLimit"):
            # Servern kapade svaret. Fortsätter vi nu publicerar vi ett
            # ofullständigt bestånd utan att någon märker det.
            raise SystemExit(
                f"Lager {layer} nådde ArcGIS överföringstak vid {len(features)} "
                "poster — hämtningen måste delas upp."
            )

        print(f"  lager {layer} {category:18s} {len(features):4d}", file=sys.stderr)
        pairs += [(f, category) for f in features]

    merged = merge_layers(pairs)
    if len(merged) != len(pairs):
        print(
            f"  {len(pairs) - len(merged)} rader fanns i flera lager och slogs ihop",
            file=sys.stderr,
        )
    return merged


def build(today: date, limit: Optional[int]) -> dict:
    features = collect()
    if limit:
        features = features[:limit]

    records, skipped = [], 0

    for feature, categories in features:
        try:
            establishment = normalize_establishment(feature, categories)
            inspections = normalize_inspections(feature, establishment.id_national)
            check_deviation_count(feature, inspections)
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
                # Uppgifter OM verksamheten, ur samma svar. `postal_code` och
                # `property_designation` finns också men stannar i pipelinen,
                # se källmodulens inledning.
                "registeredAt": (
                    establishment.registered_at.isoformat()
                    if establishment.registered_at
                    else None
                ),
                "operator": establishment.operator,
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
                        # Unikt för Oskarshamn: hur många avvikelser som är
                        # öppna. Databasen har ingen kolumn för det ännu, men
                        # att tappa måttet i hämtningen vore att slänga det
                        # enda numeriska underlag vi har. Se källmodulen.
                        "openDeviations": i.open_deviations,
                    }
                    for i in inspections
                ],
            }
        )

    dedupe_slugs(records)

    # Täckningen skrivs ut i stället för att kontrolleras med ett kast. Se
    # oskarshamn.registration_date(): ett oläsbart datum får inte fälla en
    # verksamhet, men det får inte heller försvinna tyst.
    dated = sum(1 for r in records if r["registeredAt"])
    operators = sum(1 for r in records if r["operator"])
    print(
        f"  registreringsdatum {dated}/{len(records)}, "
        f"verksamhetsutövare {operators}/{len(records)}",
        file=sys.stderr,
    )

    return {
        "municipality": {
            "code": MUNICIPALITY_CODE,
            "name": MUNICIPALITY_NAME,
            "city": MUNICIPALITY_CITY,
            "slug": "oskarshamn",
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
