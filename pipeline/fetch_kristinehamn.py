#!/usr/bin/env python3
"""Hämta Kristinehamns livsmedelskontroller.

Ett anrop för registret, fyra för bilagsförteckningen och ett per
kontrollrapport, alltså cirka 360 stycken. Bedömningen finns bara inuti
rapporterna.

    python3 pipeline/fetch_kristinehamn.py --out site/src/data/kristinehamn.json

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
from prikko.sources.kristinehamn import (  # noqa: E402
    MUNICIPALITY_CITY,
    MUNICIPALITY_CODE,
    MUNICIPALITY_NAME,
    SOURCE_URL,
    UnknownSourceValue,
    attachments_url,
    is_active,
    merge_features,
    normalize_establishment,
    normalize_inspections,
    parse_attachments,
    parse_report,
    query_url,
)
from prikko.text import dedupe_slugs, slugify  # noqa: E402

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"
POLITE_DELAY_S = 1.0
ATTEMPTS = 3
#: Bilagsförteckningen tas i klumpar. 50 objectIds per anrop håller URL:en
#: kort och hela beståndet inom fyra anrop.
CHUNK = 50


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


def get_json(url: str) -> dict:
    payload = json.loads(get(url).decode("utf-8"))
    if "error" in payload:
        raise SystemExit(f"Tjänsten svarade: {payload['error']}")
    return payload


def collect() -> tuple:
    """Hämta registret och bilagsförteckningen.

    Returnerar (features, bilagor per OBJECTID).
    """
    payload = get_json(query_url())
    features = payload.get("features") or []
    if payload.get("exceededTransferLimit"):
        # Servern kapade svaret. Fortsätter vi nu publicerar vi ett
        # ofullständigt bestånd utan att någon märker det.
        raise SystemExit(
            f"Registret nådde ArcGIS överföringstak vid {len(features)} rader — "
            "hämtningen måste delas upp."
        )
    print(f"  {len(features)} verksamheter i registret", file=sys.stderr)
    time.sleep(POLITE_DELAY_S)

    ids = [f["attributes"]["OBJECTID"] for f in features]
    by_parent: dict = {}
    for start in range(0, len(ids), CHUNK):
        chunk = ids[start:start + CHUNK]
        for attachment in parse_attachments(get_json(attachments_url(chunk))):
            by_parent.setdefault(attachment.parent, []).append(attachment)
        time.sleep(POLITE_DELAY_S)

    print(
        f"  {sum(len(v) for v in by_parent.values())} bilagor på "
        f"{len(by_parent)} verksamheter",
        file=sys.stderr,
    )
    return features, by_parent


def report_bytes(url: str, key: int, cache: Optional[Path]) -> bytes:
    """Rapporten, ur cachen om den finns där.

    En publicerad bilaga ändras aldrig — kommunen laddar upp en ny med ett
    nytt id i stället. Cachen är därför säker, och den gör det möjligt att
    köra om inläsningen utan att belasta kommunen med 350 anrop till.
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
    features, by_parent = collect()

    # Namnlösa rader måste bort före sammanslagningen: de saknar identitet och
    # kan varken publiceras eller slås ihop.
    named, skipped, unreadable = [], 0, 0
    for feature in features:
        if not (feature["attributes"].get("Namn") or "").strip():
            print("  ! hoppar över: verksamhet utan namn", file=sys.stderr)
            skipped += 1
            continue
        if not is_active(feature["attributes"]):
            # Avregistrerad verksamhet. Ett hygienomdöme om en restaurang som
            # har lagt ned är fel oavsett vad rapporten säger.
            skipped += 1
            continue
        named.append(feature)

    groups = merge_features(named)
    if len(groups) != len(named):
        print(
            f"  {len(named) - len(groups)} rader var samma verksamhet och slogs ihop",
            file=sys.stderr,
        )
    if limit:
        groups = groups[:limit]

    records = []

    for feature, object_ids in groups:
        try:
            establishment = normalize_establishment(feature)
        except UnknownSourceValue as exc:
            print(f"  ! hoppar över: {exc}", file=sys.stderr)
            skipped += 1
            continue

        attachments = [a for oid in object_ids for a in by_parent.get(oid) or []]
        reports = []
        for attachment in attachments:
            if attachment.is_decision:
                # Ett föreläggande är inget kontrolltillfälle. Kontrollen som
                # ledde fram till beslutet publiceras som en egen rapport.
                continue
            try:
                raw = report_bytes(attachment.url, attachment.id, cache)
            except Exception as exc:
                print(
                    f"  ! {attachment.filename} gick inte att hämta: {exc}",
                    file=sys.stderr,
                )
                unreadable += 1
                continue
            try:
                report = parse_report(extract_text(raw), attachment)
            except UnknownSourceValue as exc:
                print(f"  ! {exc}", file=sys.stderr)
                unreadable += 1
                continue

            # Samma ordning som i Svenljunga, av samma skäl: kommunen kan ha
            # skrivit fel årtal i brödtexten. Se prikko/dates.py. Bilagans eget
            # datum är fallbacken, aldrig förstahandskällan.
            resolved = resolve_control_date(
                report.inspected_at, attachment.published_at, today
            )
            if resolved.rejected is not None:
                print(
                    f"  ! {attachment.filename}: kontrolldatumet {resolved.rejected} "
                    f"ligger i framtiden, använder {resolved.value} ur {resolved.source}",
                    file=sys.stderr,
                )
                report = replace(report, inspected_at=resolved.value)

            reports.append(report)

        inspections = normalize_inspections(
            attachments, reports, establishment.id_national
        )

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
            "slug": "kristinehamn",
        },
        "source": {
            "url": SOURCE_URL,
            "fetchedAt": datetime.now().isoformat(timespec="seconds"),
        },
        "skipped": skipped,
        # Rapporter som inte gick att läsa. Räknas för sig: en verksamhet kan
        # ha flera, och antalet säger något helt annat än hur många
        # verksamheter vi hoppat över.
        "unreadableReports": unreadable,
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
        f"({assessed} med bedömning, {data['skipped']} överhoppade, "
        f"{data['unreadableReports']} olästa rapporter)",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
