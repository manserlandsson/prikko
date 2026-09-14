#!/usr/bin/env python3
"""Hämta ett Ecos-utdrag och skriv en normaliserad datafil.

    python3 pipeline/fetch_ecos.py --kommun norrkoping --out site/src/data/norrkoping.json

ETT anrop. Hela beståndet, hela historiken och varje kontrollpunkt ligger i en
enda XML-fil på 7,4 MB. Det är den billigaste hämtningen i pipelinen, mätt i
belastning på kommunen.

Skriptet är skrivet för FORMATET och inte för kommunen. `--kommun` slår upp
posten i `prikko/sources/ecos.py`, och en ny Ecos-kommun är en rad i den
tabellen och ingen ny fil här. Se den modulens inledning för varför.

    --kommun    slug ur MUNICIPALITIES. Obligatorisk.
    --fil       läs en redan nedladdad XML i stället för att gå mot nätet
    --limit     begränsa antalet verksamheter, för en snabb provkörning
    --out       vart datafilen skrivs

Kör snällt: en tydlig user agent och ett enda anrop. Vi lever på att
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

from prikko.grading import Area, Inspection, assess  # noqa: E402
from prikko.sources.ecos import (  # noqa: E402
    MUNICIPALITIES,
    EcosMunicipality,
    UnknownSourceValue,
    check_modified,
    group_by_establishment,
    normalize_establishment,
    normalize_inspections,
    parse,
)
from prikko.text import dedupe_slugs, slugify  # noqa: E402
from prikko.natverk import oppna  # noqa: E402  kakburk, se modulen

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"
ATTEMPTS = 3


def fetch(municipality: EcosMunicipality) -> tuple:
    """Hämta utdraget. Ger `(bytes, Last-Modified eller None)`."""
    for attempt in range(ATTEMPTS):
        try:
            request = urllib.request.Request(
                municipality.data_url, headers={"User-Agent": USER_AGENT}
            )
            with oppna(request, timeout=180) as response:
                return response.read(), response.headers.get("Last-Modified")
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            if attempt == ATTEMPTS - 1:
                raise SystemExit(
                    f"{municipality.city}: utdraget gick inte att hämta: {exc}"
                )
            wait = 2**attempt
            print(f"  ! {type(exc).__name__}, försöker igen om {wait}s", file=sys.stderr)
            time.sleep(wait)
    return b"", None


def build(
    municipality: EcosMunicipality,
    xml: bytes,
    modified: Optional[str],
    today: date,
    limit: Optional[int],
) -> dict:
    note = check_modified(modified, municipality.source_modified)
    if note:
        # Aldrig ett avbrott. Ett nyare datum betyder att kommunen kört
        # exporten igen, alltså precis det vi bett om, och ett saknat huvud
        # är en cache och inte ett fel. Men det ska synas i loggen.
        print(f"  ! {municipality.city}: {note}", file=sys.stderr)

    inspections = parse(xml)
    print(
        f"Utdrag: {len(inspections)} kontrolltillfällen", file=sys.stderr
    )

    groups = group_by_establishment(inspections)
    print(f"Bestånd: {len(groups)} verksamheter", file=sys.stderr)
    if limit:
        groups = groups[:limit]

    records, skipped, unreadable_points = [], 0, 0

    for id_local, name, address, elements in groups:
        try:
            establishment = normalize_establishment(
                municipality, id_local, name, address
            )
            history = normalize_inspections(
                municipality, elements, establishment.id_national
            )
        except UnknownSourceValue as exc:
            # Ett okänt värde fäller verksamheten, inte hela kommunen. Talet
            # skrivs ut nedan, så en källa som börjat leverera nya värden syns
            # som ett hopp och inte som en tyst lucka.
            print(f"  ! hoppar över {name!r}: {exc}", file=sys.stderr)
            skipped += 1
            continue

        unreadable_points += sum(1 for i in history if i.uncertain)

        result = assess(
            [
                Inspection(
                    id_national=i.id_national,
                    inspected_at=i.inspected_at,
                    assessment=i.assessment,
                    type=i.type,
                    areas=tuple(
                        Area(a.code, a.group, a.description, a.status) for a in i.areas
                    ),
                )
                for i in history
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
                # Bara osäker om någon av de kontroller bedömningen FAKTISKT
                # vilar på är osäker. Se kommentaren i fetch_linkoping.py.
                "uncertain": any(
                    i.uncertain for i in history if i.id_national in result.based_on
                ),
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
                        "caseNumber": i.case_number,
                    }
                    for i in history
                ],
            }
        )

    dedupe_slugs(records)

    return {
        "municipality": {
            "code": municipality.code,
            "name": municipality.name,
            "city": municipality.city,
            "slug": municipality.slug,
            # Kommunen publicerar filen själv, utan gränssnitt och utan att vi
            # härmar någon egen tjänst. Det är öppna data i den meningen
            # `SourceType` avser, oavsett att ingen licens är angiven.
            "sourceType": "open_data",
        },
        "source": {
            "url": municipality.source_url,
            "fetchedAt": datetime.now().isoformat(timespec="seconds"),
            # KÄLLANS egen ålder, och inte vår.
            #
            # `fetchedAt` säger när vi läste filen. På ett bestånd som ligger
            # stilla säger det ingenting om hur gammalt materialet är, och det
            # är hela frågan i Norrköping: filen skrevs 2024-03-17 och den
            # senaste kontrollen gjordes 2024-01-03. Fältet finns för att
            # besökaren ska kunna se det utan att klicka. Se
            # site/src/components/KommunHub.astro.
            "modifiedAt": municipality.source_modified,
        },
        # `skipped` skrivs INTE till filen, till skillnad från i flera äldre
        # hämtare. Det är ett körningstal och inte en uppgift om kommunen, det
        # har ingen kolumn i Supabase, och exporten bygger varje fil ur
        # databasen: nästa nattkörning hade raderat nyckeln. Talet står i
        # utskriften i stället. Se FILBLOCK i pipeline/export_supabase.py och
        # provet i tests/test_export_koordinater.py.
        "establishments": records,
    }, skipped


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--kommun", required=True, choices=sorted(MUNICIPALITIES))
    parser.add_argument("--fil", type=Path, default=None)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()

    municipality = MUNICIPALITIES[args.kommun]

    if args.fil:
        xml, modified = args.fil.read_bytes(), None
        print(f"Läser {args.fil}", file=sys.stderr)
    else:
        xml, modified = fetch(municipality)

    try:
        data, skipped = build(municipality, xml, modified, date.today(), args.limit)
    except UnknownSourceValue as exc:
        # Formfel i filen fäller hela hämtningen. En halv kommun är värre än
        # ingen kommun: de saknade verksamheterna syns inte för någon.
        raise SystemExit(f"{municipality.city}: {exc}")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")

    total = len(data["establishments"])
    assessed = sum(1 for e in data["establishments"] if e["verdict"])
    stale = sum(1 for e in data["establishments"] if e["reason"] == "stale_inspections")
    controls = sum(len(e["inspections"]) for e in data["establishments"])
    print(
        f"\nSkrev {total} verksamheter och {controls} kontroller till {args.out}\n"
        f"  {assessed} med bedömning, {stale} utanför färskhetsfönstret, "
        f"{skipped} överhoppade",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
