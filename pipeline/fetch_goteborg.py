#!/usr/bin/env python3
"""Hämta Göteborgs anläggningslista som UNDERLAG.

    python3 pipeline/fetch_goteborg.py --out pipeline/data/underlag/goteborg.json

ETT anrop. 5 076 verksamheter, koordinater, adresser och verksamhetstyp under
CC0 1.0, uppdaterad dagligen.

## Läs det här innan du pekar --out mot site/src/data/

Filen innehåller **noll kontrollresultat**. Ingen bedömning, inget
kontrolldatum, ingen avvikelse. Skrivs den till `site/src/data/` upptäcker
`site/src/lib/db.ts` kommunen automatiskt och bygger 5 062 verksamhetssidor
som alla säger "ingen bedömning", plus en kommunhubb och en sidserie på 51
sidor som indexeras utan att kunna svara på den enda fråga besökaren kom med.

Beslutet att inte göra det, och de tal det vilar på, står i
`docs/20_kommunexpansion.md` §10. Skriptet hindrar ingenting: `--out` är
`--out`, och den dag Göteborg lämnar ut kontrollresultat är publicering en
katalog och inte en omskrivning. Men det förvalda är underlag, och det är ett
val och inte en glömska.

Utskriften är i övrigt formen på en sajtdatafil, med `municipality`, `source`
och `establishments`, av samma skäl.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko.sources.goteborg import (  # noqa: E402
    ATTRIBUTION,
    DATA_URL,
    LICENCE,
    LICENCE_URL,
    MUNICIPALITY_CITY,
    MUNICIPALITY_CODE,
    MUNICIPALITY_NAME,
    MUNICIPALITY_SLUG,
    SOURCE_URL,
    UnknownSourceValue,
    check_coordinates,
    merge_rows,
    normalize_establishment,
    parse,
)
from prikko.grading import MODEL_VERSION  # noqa: E402
from prikko.text import dedupe_slugs, slugify  # noqa: E402

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"
ATTEMPTS = 3


def fetch() -> tuple:
    """Hämta CSV:n. Ger `(text, Last-Modified eller None)`."""
    for attempt in range(ATTEMPTS):
        try:
            request = urllib.request.Request(DATA_URL, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=120) as response:
                raw = response.read()
                return raw.decode("utf-8-sig"), response.headers.get("Last-Modified")
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            if attempt == ATTEMPTS - 1:
                raise SystemExit(f"Göteborg: listan gick inte att hämta: {exc}")
            wait = 2**attempt
            print(f"  ! {type(exc).__name__}, försöker igen om {wait}s", file=sys.stderr)
            time.sleep(wait)
    return "", None


def modified_date(header: Optional[str]) -> Optional[str]:
    """`Last-Modified` som ISO-datum, eller None.

    Källan uppdateras dagligen och headern är därför en riktig uppgift och
    inte en formalitet: den säger hur färsk listan är, till skillnad från
    Norrköpings Ecos-fil som legat stilla sedan 2024.
    """
    if not header:
        return None
    try:
        from email.utils import parsedate_to_datetime

        return parsedate_to_datetime(header).date().isoformat()
    except (TypeError, ValueError):
        return None


def build(text: str, modified: Optional[str], limit: Optional[int]) -> dict:
    rows = parse(text)
    print(f"Lista: {len(rows)} rader", file=sys.stderr)

    compared, worst = check_coordinates(rows)
    print(
        f"Koordinater: {compared} rader jämförda mot SWEREF 99 12 00, "
        f"största avvikelse {worst:.3g} grader",
        file=sys.stderr,
    )

    groups = merge_rows(rows)
    if len(groups) != len(rows):
        print(
            f"  {len(rows) - len(groups)} rader var samma verksamhet under "
            "flera typer och slogs ihop",
            file=sys.stderr,
        )
    if limit:
        groups = groups[:limit]

    records, skipped = [], 0

    for id_local, row, types in groups:
        try:
            establishment = normalize_establishment(id_local, row, types)
        except UnknownSourceValue as exc:
            print(f"  ! hoppar över en rad: {exc}", file=sys.stderr)
            skipped += 1
            continue

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
                # Ingen kontroll finns, alltså ingen bedömning. Fälten står
                # ändå ut i sajtens egen form, se modulens inledning.
                "verdict": None,
                "distinction": False,
                "reason": "no_inspections",
                # Läses ur grading.py och skrivs inte för hand. Talet stod som
                # en fyra och blev fel i samma stund modellen gick till fem.
                "modelVersion": MODEL_VERSION,
                "uncertain": False,
                "inspections": [],
                # Två uppgifter sajtens verksamhetsrad inte har något fält
                # för, och som därför inte skrivs som `registration`: det
                # fältet är kommunens REGISTERINTYG i Stockholm och betyder
                # något annat. De står här som egna nycklar, för underlaget
                # är just adress-, koordinat- och typunderlag.
                "postalCode": establishment.postal_code,
                "locality": establishment.locality,
            }
        )

    dedupe_slugs(records)

    with_point = sum(1 for r in records if r["lat"] is not None)
    with_type = sum(1 for r in records if r["types"])
    with_postal = sum(1 for r in records if r["postalCode"])

    return {
        "municipality": {
            "code": MUNICIPALITY_CODE,
            "name": MUNICIPALITY_NAME,
            "city": MUNICIPALITY_CITY,
            "slug": MUNICIPALITY_SLUG,
            "sourceType": "open_data",
        },
        "source": {
            "url": SOURCE_URL,
            "fetchedAt": datetime.now().isoformat(timespec="seconds"),
            "modifiedAt": modified,
            "licence": LICENCE,
            "licenceUrl": LICENCE_URL,
            "attribution": ATTRIBUTION,
        },
        # Beslutet, i filen och inte bara i ett dokument. Den som hittar
        # filen om ett halvår ska se varför den ligger i pipeline/data och
        # inte i site/src/data.
        "coverage": {
            "inspections": False,
            "reason": (
                "Källan är en anläggningslista utan kontrollresultat. Läses in "
                "som adress-, koordinat- och typunderlag och blir inga "
                "verksamhetssidor. Se docs/20_kommunexpansion.md §10."
            ),
        },
        "counts": {
            "establishments": len(records),
            "withCoordinates": with_point,
            "withType": with_type,
            "withPostalCode": with_postal,
        },
        "skipped": skipped,
        "establishments": records,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fil", type=Path, default=None)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()

    if args.fil:
        text, modified = args.fil.read_text(encoding="utf-8-sig"), None
        print(f"Läser {args.fil}", file=sys.stderr)
    else:
        text, modified = fetch()

    try:
        data = build(text, modified_date(modified), args.limit)
    except UnknownSourceValue as exc:
        raise SystemExit(f"Göteborg: {exc}")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")

    counts = data["counts"]
    print(
        f"\nSkrev {counts['establishments']} verksamheter till {args.out}\n"
        f"  {counts['withCoordinates']} med koordinat, "
        f"{counts['withType']} med verksamhetstyp, "
        f"{counts['withPostalCode']} med postnummer, "
        f"{data['skipped']} överhoppade\n"
        f"  0 kontrollresultat. Filen är underlag och inga sidor, "
        f"se docs/20_kommunexpansion.md §10.",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
