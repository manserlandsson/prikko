#!/usr/bin/env python3
"""Hämta Karlstads livsmedelskontroller.

Fyra anrop mot kommunens GeoServer, ett per WFS-lager.

    python3 pipeline/fetch_karlstad.py --out site/src/data/karlstad.json

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
from prikko.sources.karlstad import (  # noqa: E402
    LAYERS,
    MUNICIPALITY_CITY,
    MUNICIPALITY_CODE,
    MUNICIPALITY_NAME,
    SOURCE_URL,
    UnknownSourceValue,
    address_query_url,
    normalize_establishment,
    normalize_inspections,
    parse_addresses,
    query_url,
    unambiguous_names,
    with_address,
)
from prikko.text import dedupe_slugs, slugify  # noqa: E402
from prikko.natverk import oppna  # noqa: E402  kakburk, se modulen

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"
POLITE_DELAY_S = 0.6
ATTEMPTS = 3


def get(url: str) -> dict:
    """Hämta med omförsök.

    GeoServern bröt TLS-anslutningen sporadiskt under kartläggningen. Det är
    övergående — certifikatet validerar normalt — så rätt svar är att försöka
    igen, inte att stänga av verifieringen.
    """
    for attempt in range(ATTEMPTS):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with oppna(request, timeout=120) as response:
                return json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            if attempt == ATTEMPTS - 1:
                raise
            wait = 2 ** attempt
            print(f"  ! {type(exc).__name__}, försöker igen om {wait}s", file=sys.stderr)
            time.sleep(wait)
    return {}


def collect() -> list:
    """Hämta alla lager. Returnerar (feature, kategori)-par."""
    out = []
    for typename, category in LAYERS.items():
        try:
            payload = get(query_url(typename))
        except Exception as exc:
            # Ett tappat lager är en tyst lucka i beståndet. Avbryt hellre.
            raise SystemExit(f"Lagret {typename} gick inte att hämta: {exc}")
        finally:
            time.sleep(POLITE_DELAY_S)

        features = payload.get("features") or []
        print(f"  {category:24s} {len(features):4d}", file=sys.stderr)
        out += [(f, category) for f in features]

    return out


def collect_addresses() -> dict:
    """Adresslagret, ett anrop. Se karlstad.parse_addresses().

    Ett tappat adresslager får INTE fälla hämtningen. Adressen är en
    förbättring ovanpå ett bestånd som fungerade utan den i månader, och att
    låta hela Karlstad utebli för att ett avställt lager inte svarade vore
    fel avvägning. Tom tabell betyder att verksamheterna står kvar utan
    adress, precis som förut.
    """
    try:
        payload = get(address_query_url())
    except Exception as exc:
        print(f"  ! adresslagret gick inte att hämta: {exc}", file=sys.stderr)
        return {}
    finally:
        time.sleep(POLITE_DELAY_S)

    try:
        addresses = parse_addresses(payload)
    except UnknownSourceValue as exc:
        # Spärren har löst ut: svaret bar mer än namn och adress. Då
        # använder vi ingenting därifrån.
        print(f"  ! adresslagret avvisat: {exc}", file=sys.stderr)
        return {}

    print(f"  {'adresser (avställt lager)':24s} {len(addresses):4d}", file=sys.stderr)
    return addresses


def build(today: date, limit: Optional[int]) -> dict:
    features = collect()
    if limit:
        features = features[:limit]

    addresses = collect_addresses()

    records, skipped = [], 0
    normalized = []

    for feature, category in features:
        try:
            establishment = normalize_establishment(feature, category)
            inspections = normalize_inspections(feature, establishment.id_national)
        except UnknownSourceValue as exc:
            print(f"  ! hoppar över: {exc}", file=sys.stderr)
            skipped += 1
            continue

        if not establishment.name:
            skipped += 1
            continue

        normalized.append((establishment, inspections))

    # Hopparningen kräver att namnet är entydigt i BÅDA bestånden, så den kan
    # inte göras förrän hela vårt eget är känt.
    unique = unambiguous_names([e for e, _ in normalized])
    normalized = [
        (with_address(establishment, addresses, unique), inspections)
        for establishment, inspections in normalized
    ]
    with_street = sum(1 for e, _ in normalized if e.street_address)
    print(f"\n{with_street} av {len(normalized)} fick en adress", file=sys.stderr)

    for establishment, inspections in normalized:

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
                        # Diarienumret besökaren behöver för att begära ut
                        # rapporten hos Kontaktcenter. Se karlstad.py.
                        "caseNumber": i.case_number,
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
            "slug": "karlstad",
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
