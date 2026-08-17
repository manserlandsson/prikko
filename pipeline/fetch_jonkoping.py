#!/usr/bin/env python3
"""Hämta Jönköpings livsmedelskontroller.

Fem anrop, ett per underlager i kommunens ArcGIS-tjänst. Ingen detaljsida per
verksamhet, till skillnad från Linköping, Uppsala och Örebro — hela körningen
tar sekunder i stället för timmar.

    python3 pipeline/fetch_jonkoping.py --out site/src/data/jonkoping.json

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
from prikko.sources.jonkoping import (  # noqa: E402
    LAYERS,
    MUNICIPALITY_CITY,
    MUNICIPALITY_CODE,
    MUNICIPALITY_NAME,
    SOURCE_URL,
    UnknownSourceValue,
    check_deviation_flag,
    normalize_establishment,
    normalize_inspections,
    query_url,
)
from prikko.text import dedupe_slugs, slugify  # noqa: E402

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"
POLITE_DELAY_S = 0.6
ATTEMPTS = 3
#: Väntan mellan omförsöken. Längre än POLITE_DELAY_S med avsikt: en tjänst som
#: just svarat "Unable to complete operation" ska få mer än sex tiondelar på
#: sig, och 5 + 15 sekunder är försumbart mot stegets 45 minuter.
RETRY_WAITS_S = (5, 15)


class ServiceUnavailable(Exception):
    """ArcGIS svarade, men med ett fel i stället för med lagret."""


def get(url: str) -> dict:
    """Hämta ett lager med omförsök.

    Tjänsten svarar sporadiskt HTTP 200 med en felkropp i stället för poster:

        {'code': 400, 'extendedCode': -2147467261,
         'message': 'Unable to complete operation.', 'details': []}

    Uppmätt över nattkörningarna 2026-08-10 till 2026-08-17 föll den tre
    nätter av åtta (08-11, 08-16 och 08-17), varje gång på lager 10 som är det
    största med 525 poster, och varje gång inom två sekunder från stegets
    start. Samma fråga svarar 200 med alla 525 poster på under 0,4 sekunder när
    den ställs om för hand, och de fem övriga nätterna gick igenom orört.

    Felet är alltså kommunens och övergående. Det som gör det värt kod är att
    det inte är sällsynt: 37 procent av nätterna fällde hela incheckningen av
    tolv kommuners data på ett lager som svarar korrekt en sekund senare. Ett
    omförsök är rätt svar, en tyst lucka i beståndet är det inte.
    """
    for attempt in range(ATTEMPTS):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=120) as response:
                payload = json.loads(response.read().decode("utf-8"))
            if "error" in payload:
                raise ServiceUnavailable(payload["error"])
            return payload
        except (urllib.error.URLError, TimeoutError, OSError,
                ServiceUnavailable) as exc:
            if attempt == ATTEMPTS - 1:
                raise
            wait = RETRY_WAITS_S[attempt]
            print(f"  ! {type(exc).__name__}, försöker igen om {wait}s", file=sys.stderr)
            time.sleep(wait)
    return {}


def collect() -> list:
    """Hämta alla fem lagren. Returnerar (feature, kategori)-par."""
    out = []
    for layer, category in LAYERS.items():
        try:
            payload = get(query_url(layer))
        except (urllib.error.URLError, TimeoutError, OSError,
                ServiceUnavailable) as exc:
            # Ett tappat lager är en tyst lucka i beståndet. Avbryt hellre.
            raise SystemExit(f"Lager {layer} ({category}) gick inte att hämta: {exc}")
        finally:
            time.sleep(POLITE_DELAY_S)

        features = payload.get("features") or []
        if payload.get("exceededTransferLimit"):
            # Servern kapade svaret. Fortsätter vi nu publicerar vi ett
            # ofullständigt bestånd utan att någon märker det.
            raise SystemExit(
                f"Lager {layer} nådde ArcGIS överföringstak vid {len(features)} "
                "poster — hämtningen måste delas upp."
            )

        print(f"  lager {layer:2d} {category:22s} {len(features):4d}", file=sys.stderr)
        out += [(f, category) for f in features]

    return out


def build(today: date, limit: Optional[int]) -> dict:
    features = collect()
    if limit:
        features = features[:limit]

    records, skipped = [], 0

    for feature, category in features:
        try:
            establishment = normalize_establishment(feature, category)
            inspections = normalize_inspections(feature, establishment.id_national)
            check_deviation_flag(feature, inspections)
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
            "slug": "jonkoping",
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
