#!/usr/bin/env python3
"""Hämta Linköpings livsmedelskontroller och skriv en normaliserad datafil.

Hela beståndet med full historik kommer i ETT anrop, och riskklass,
fastighet, stadsdel och diarienummer i tre till.

    python3 pipeline/fetch_linkoping.py --out site/src/data/linkoping.json

Fram till 2026-08-25 gjordes i stället ett detaljanrop per anläggning, 1 241
stycken. Det behövdes aldrig: `inkluderaInspektioner=true` på listendpointen
ger samma fält. Se rättelsen i prikko/sources/linkoping.py.

Kör snällt: en paus mellan anropen och en tydlig user agent. Vi lever på att
kommunerna fortsätter tycka om oss — och fyra anrop i stället för 1 241 är
den enskilt största artigheten den här pipelinen har att ge.
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

from prikko.grading import Area, Inspection, assess  # noqa: E402
from prikko.sources.linkoping import (  # noqa: E402
    ARCGIS_FACILITIES,
    ARCGIS_INSPECTIONS,
    LIST_URL,
    MUNICIPALITY_CITY,
    MUNICIPALITY_CODE,
    MUNICIPALITY_NAME,
    UnknownSourceValue,
    arcgis_query_url,
    check_arcgis_address,
    enrich,
    merge_duplicate_inspections,
    normalize_establishment,
    normalize_inspection,
    parse_arcgis_facilities,
    parse_arcgis_inspections,
    with_case_numbers,
)

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


def fetch_all() -> list:
    """Hela beståndet med FULL historik, i ett anrop.

    `PageSize=5000` är rikligt tilltaget med flit: beståndet är 1 245 och
    ett tak som råkar hamna under det hade tystat bort verksamheter utan att
    någon märkte det. Kontrollen nedan fäller hämtningen i stället.
    """
    payload = get_json(f"{LIST_URL}&Page=1&PageSize=5000")
    items = payload.get("items") or []
    total = payload.get("totalCount")

    if total is not None and len(items) != total:
        raise SystemExit(
            f"Fick {len(items)} anläggningar men servern säger {total}. "
            "Sidhämtningen räcker inte längre — läs fetch_all() innan du "
            "höjer taket."
        )
    return items


def fetch_arcgis(service: str, expected_label: str) -> list:
    """Hämta ett ArcGIS-lager, med sidhämtning.

    Servern har `maxRecordCount` 2 000 och sätter `exceededTransferLimit` när
    det tagit slut. Tabellen med tillsyner har 2 646 rader och kräver alltså
    två anrop.

    Ett tappat lager får INTE fälla hämtningen. Riskklassen är en förbättring
    ovanpå ett bestånd som fungerade utan den; att låta hela Linköping utebli
    för att en kompletterande karttjänst inte svarade vore fel avvägning.
    """
    payloads: list = []
    offset = 0
    while True:
        try:
            payload = get_json(arcgis_query_url(service, offset))
        except Exception as exc:
            print(f"  ! {expected_label} gick inte att hämta: {exc}", file=sys.stderr)
            return []
        finally:
            time.sleep(POLITE_DELAY_S)

        payloads.append(payload)
        rows = len(payload.get("features") or [])
        offset += rows
        if not payload.get("exceededTransferLimit") or not rows:
            break
        if offset > 50_000:
            # Sidhämtningen ska ta slut. Gör den inte det har servern slutat
            # sätta exceededTransferLimit och vi snurrar mot kommunen.
            raise SystemExit(f"{expected_label}: sidhämtningen tar inte slut")

    print(f"  {expected_label:24s} {offset:5d} rader", file=sys.stderr)
    return payloads


def latest_inspection(raw: dict) -> str:
    """Tidsstämpeln för anläggningens senaste kontroll, eller tom sträng.

    Används BARA för att sortera, och sorteringen finns bara för att sluggen
    ska sitta still. `dedupe_slugs` numrerar kollisioner positionellt, så två
    verksamheter med samma namn byter adress med varandra om källan levererar
    dem i omvänd ordning — se tests/test_slugstabilitet.py, som finns för att
    det verkligen hände i Stockholm.

    Fram till 2026-08-25 kom ordningen ur `medsenastetillsyn`, som bar
    kontrolldatumet som ett eget fält på anläggningen. Ettanropsvarianten gör
    inte det, så samma tal räknas fram ur historiken i stället. Ordningen blir
    därmed densamma som förut, och inga URL:er vandrar.
    """
    return max(
        ((t.get("tillsynsDatumTid") or "") for t in (raw.get("tillsyner") or [])),
        default="",
    )


def build(limit: Optional[int], today: date) -> dict:
    ordered = fetch_all()
    print(f"Bestånd: {len(ordered)} anläggningar", file=sys.stderr)
    time.sleep(POLITE_DELAY_S)

    ordered = sorted(ordered, key=latest_inspection, reverse=True)

    facilities = parse_arcgis_facilities(
        fetch_arcgis(ARCGIS_FACILITIES, "arcgis anläggningar")
    )
    try:
        risk_classes, case_numbers = parse_arcgis_inspections(
            fetch_arcgis(ARCGIS_INSPECTIONS, "arcgis tillsyner")
        )
    except UnknownSourceValue as exc:
        # Riskklassens kodverk har ändrats, eller en anläggning bär två
        # klasser. Vi publicerar hellre utan riskklass än en vi inte vet
        # betydelsen av. Resten av hämtningen är opåverkad.
        print(f"  ! arcgis tillsyner avvisade: {exc}", file=sys.stderr)
        risk_classes, case_numbers = {}, {}

    if limit:
        ordered = ordered[:limit]

    records, skipped, address_conflicts = [], 0, 0

    for index, source in enumerate(ordered, 1):
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

        # Facit på hopparningen. En motsägelse fäller INTE verksamheten —
        # adressen vi publicerar kommer ändå från API:et — men den ska synas,
        # för den betyder att GUID:et pekar på olika saker i de två källorna
        # och då är riskklassen inte att lita på.
        try:
            check_arcgis_address(establishment, facilities)
        except UnknownSourceValue as exc:
            print(f"  ! {exc}", file=sys.stderr)
            address_conflicts += 1
        else:
            establishment = enrich(establishment, facilities, risk_classes)

        inspections = [i for i in inspections if i is not None]
        # Samma tillsynsId kan komma två gånger, se merge_duplicate_inspections.
        inspections = merge_duplicate_inspections(inspections)
        inspections = with_case_numbers(inspections, case_numbers)

        # Gatubild hämtas INTE här. Den hörde hemma här så länge vi bara sparade
        # en URL, men den URL:en var Mapillarys signerade miniatyr och gick ut
        # en tid efter varje körning. Nu laddas bildens bytes ned och lagras hos
        # oss, och det ska ske en gång per verksamhet i stället för en gång per
        # hämtning av kommunen:
        #
        #     python3 pipeline/hamta_gatubilder.py --fil site/src/data/linkoping.json
        #
        # Sidan är byggd för att fungera utan bild, vilket de flesta kommer att
        # göra. Se pipeline/prikko/imagery.py.
        image = None

        result = assess(
            [
                Inspection(
                    id_national=i.id_national,
                    inspected_at=i.inspected_at,
                    assessment=i.assessment,
                    type=i.type,
                    # Sedan modellversion 4: rent administrativa avvikelser
                    # ska inte skärpa bedömningen, så punkterna följer med.
                    areas=tuple(
                        Area(a.code, a.group, a.description, a.status)
                        for a in i.areas
                    ),
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
                "image": image,
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
                # Beslutad riskklass ur ArcGIS-lagret. `postal_code`,
                # `property_designation` och `district` finns också på
                # anläggningen men stannar i pipelinen, se källmodulen.
                "riskClass": establishment.risk_class,
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
                        # Diarienumret besökaren behöver för att begära ut
                        # kontrollrapporten. Ur ArcGIS-lagret.
                        "caseNumber": i.case_number,
                    }
                    for i in sorted(
                        inspections, key=lambda x: x.inspected_at, reverse=True
                    )
                ],
            }
        )

        if index % 200 == 0:
            print(f"  {index}/{len(ordered)}", file=sys.stderr)

    # Utfallet av berikningen, uttryckt i tal. En kolumn som tyst faller till
    # noll är annars omöjlig att upptäcka. Talen vid mätningen 2026-08-25:
    # riskklass 743, diarienummer 2 519, adresskonflikter 0.
    with_risk = sum(1 for r in records if r["riskClass"])
    with_case = sum(1 for r in records for i in r["inspections"] if i["caseNumber"])
    print(
        f"\nRiskklass {with_risk}/{len(records)}, "
        f"diarienummer på {with_case} kontroller, "
        f"{address_conflicts} adresskonflikter",
        file=sys.stderr,
    )

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


def keep_images(out: Path, data: dict) -> None:
    """Bär över gatubilder från den befintliga filen.

    Bilderna hämtas av pipeline/hamta_gatubilder.py och kostar ett anrop mot en
    gratis och delad tjänst styck. En hämtning av kommunen får inte kasta bort
    dem bara för att den skriver om filen.
    """
    if not out.exists():
        return
    try:
        previous = json.loads(out.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return

    images = {
        e["id"]: e["image"]
        for e in previous.get("establishments", [])
        if e.get("image")
    }
    if not images:
        return

    carried = 0
    for record in data["establishments"]:
        image = images.get(record["id"])
        if image:
            record["image"] = image
            carried += 1
    print(f"Bar över {carried} gatubilder från föregående fil.", file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()

    data = build(args.limit, date.today())
    keep_images(args.out, data)

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
