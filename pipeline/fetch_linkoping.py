#!/usr/bin/env python3
"""Hämta Linköpings livsmedelskontroller och skriv en normaliserad datafil.

Sveper `medsenastetillsyn` för hela beståndet i ett anrop, och hämtar sedan
full kontrollhistorik per anläggning. Historiken finns bara på detaljendpointen
— listendpointen returnerar alltid tom `tillsyner`.

    python3 pipeline/fetch_linkoping.py --limit 80 --out site/src/data/linkoping.json

Utan --limit hämtas hela beståndet (1 241 anläggningar, ett anrop styck).
Kör snällt: en paus mellan anropen och en tydlig user agent. Vi lever på att
kommunerna fortsätter tycka om oss.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from datetime import date, datetime
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko.grading import Inspection, assess  # noqa: E402
from prikko.sources.linkoping import (  # noqa: E402
    MUNICIPALITY_CITY,
    MUNICIPALITY_CODE,
    MUNICIPALITY_NAME,
    UnknownSourceValue,
    normalize_establishment,
    normalize_inspection,
)

BASE = "https://livsmedelsdata.linkoping.se/api/v1"
USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"
POLITE_DELAY_S = 0.25

_SWEDISH = {"å": "a", "ä": "a", "ö": "o", "é": "e", "ü": "u"}


def slugify(name: str) -> str:
    """URL-segment ur ett verksamhetsnamn.

    Translittererar svenska tecken explicit i stället för att låta Unicode-
    normalisering stryka dem — "Kött" ska bli "kott", inte "ktt". Rena
    ASCII-slugar håller URL:erna läsbara i sökresultat och delningar.
    """
    lowered = name.lower()
    for char, replacement in _SWEDISH.items():
        lowered = lowered.replace(char, replacement)
    ascii_only = (
        unicodedata.normalize("NFKD", lowered)
        .encode("ascii", "ignore")
        .decode("ascii")
    )
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_only).strip("-")
    return re.sub(r"-{2,}", "-", slug) or "namnlos"


def get_json(url: str) -> dict:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_sweep() -> list:
    """Hela beståndet med senaste kontrollen, i ett anrop."""
    payload = get_json(f"{BASE}/Anlaggningar/medsenastetillsyn?pageSize=2000&page=1")
    return payload["items"]


def fetch_detail(establishment_id: str) -> Optional[dict]:
    try:
        return get_json(f"{BASE}/Anlaggningar/{establishment_id}")
    except urllib.error.HTTPError as exc:
        print(f"  ! {establishment_id}: HTTP {exc.code}", file=sys.stderr)
        return None


def build(limit: Optional[int], today: date) -> dict:
    sweep = fetch_sweep()
    print(f"Svep: {len(sweep)} anläggningar", file=sys.stderr)

    # Prioritera anläggningar som faktiskt har en kontroll — de utan underlag
    # ger ändå ingen bedömning, och vi vill inte bränna anrop på dem först.
    ordered = sorted(
        sweep,
        key=lambda r: (r.get("tillsynsDatumTid") or ""),
        reverse=True,
    )
    if limit:
        ordered = ordered[:limit]

    records, skipped = [], 0

    for index, raw_sweep in enumerate(ordered, 1):
        local_id = raw_sweep["anlaggningsId"]
        detail = fetch_detail(local_id)
        time.sleep(POLITE_DELAY_S)

        source = detail or raw_sweep
        try:
            establishment = normalize_establishment(source)
            inspections = [
                normalize_inspection(t, establishment.id_national)
                for t in (source.get("tillsyner") or [])
            ]
        except UnknownSourceValue as exc:
            print(f"  ! hoppar över: {exc}", file=sys.stderr)
            skipped += 1
            continue

        inspections = [i for i in inspections if i is not None]

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
                "verdict": result.verdict,
                "distinction": result.distinction,
                "reason": result.reason,
                "modelVersion": result.model_version,
                # Bara osäker om någon av de kontroller bedömningen FAKTISKT
                # vilar på är osäker. Räknat över hela historiken skulle
                # varningen dyka upp på sidor där tolkningen inte påverkat
                # något — och en varning som ropar varg tappar sin verkan.
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
                    }
                    for i in sorted(
                        inspections, key=lambda x: x.inspected_at, reverse=True
                    )
                ],
            }
        )

        if index % 20 == 0:
            print(f"  {index}/{len(ordered)}", file=sys.stderr)

    # Slugkollisioner: två verksamheter kan heta likadant. Suffixa med löpnummer
    # så URL:en förblir stabil och unik.
    seen = {}
    for record in records:
        base_slug = record["slug"]
        seen[base_slug] = seen.get(base_slug, 0) + 1
        if seen[base_slug] > 1:
            record["slug"] = f"{base_slug}-{seen[base_slug]}"

    return {
        "municipality": {
            "code": MUNICIPALITY_CODE,
            "name": MUNICIPALITY_NAME,
            "city": MUNICIPALITY_CITY,
            "slug": "linkoping",
        },
        "source": {
            "url": "https://livsmedelsdata.linkoping.se/swagger/index.html",
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

    data = build(args.limit, date.today())

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(
        json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8"
    )

    total = len(data["establishments"])
    assessed = sum(1 for e in data["establishments"] if e["verdict"])
    print(
        f"\nSkrev {total} anläggningar till {args.out} "
        f"({assessed} med bedömning, {data['skipped']} överhoppade)",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
