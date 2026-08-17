#!/usr/bin/env python3
"""Exportera från Supabase till sajtens datafiler.

Databasen är sanningen. Den här filen drar ut en ögonblicksbild som bygget
läser.

Varför inte låta Astro hämta direkt vid bygget: 130 000 rader över HTTP vid
varje bygge gör bygget nätverksberoende, långsamt och svårt att reproducera i
CI. En exporterad snapshot ger samma innehåll, byggtiden förblir 30 sekunder,
och ett bygge kan köras utan nät. Dynamiska funktioner — omdömen, bevakning,
appen — läser däremot databasen i realtid, där den hör hemma.

    export SUPABASE_URL=...
    export SUPABASE_SERVICE_KEY=...      # eller anon, läsning räcker
    python3 pipeline/export_supabase.py --out site/src/data

Skriver en fil per kommun, samma format som fetch_*.py producerar.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path

PAGE = 1000

#: Decimaler att behålla i koordinaterna. Sex ger ungefär elva centimeters
#: upplösning — långt mer än en kartnål behöver.
#:
#: Varför avrundning alls: databasrundturen ger tillbaka flyttal med en
#: decimal mindre än de skrevs (58.39034461245975 blir 58.3903446124597).
#: Förflyttningen är noll millimeter, men textrepresentationen skiljer sig,
#: så en fil skriven av fetch_*.py och samma fil skriven av den här exporten
#: blev olika. Eftersom snapshotarna checkas in gav det en diff på en halv
#: miljon rader utan en enda faktisk ändring, varje gång pipelinen bytte väg.
#: Med avrundningen är de två vägarna bitidentiska (verifierat: 0 av 1 120
#: koordinater skilde för Jönköping). Verklig förändring ska synas i diffen;
#: brus ska inte dränka den.
#:
#: Fjorton signifikanta siffror var dessutom falsk precision till att börja
#: med — ingen kommun mäter sin verksamhet på nanometern.
COORDINATE_DECIMALS = 6


def _round(value):
    return round(value, COORDINATE_DECIMALS) if isinstance(value, (int, float)) else value


class Supabase:
    def __init__(self, url: str, key: str) -> None:
        self.base = url.rstrip("/") + "/rest/v1"
        self.headers = {"apikey": key, "Authorization": f"Bearer {key}"}

    def _get(self, url: str, attempts: int = 4) -> list:
        """Hämta med omförsök. Exporten drar 130 000 rader i 130 anrop; att
        en enda TLS-anslutning bryts på vägen är väntat, inte exceptionellt."""
        for attempt in range(attempts):
            try:
                request = urllib.request.Request(url, headers=self.headers)
                with urllib.request.urlopen(request, timeout=120) as response:
                    return json.loads(response.read().decode("utf-8"))
            except Exception as exc:
                if attempt == attempts - 1:
                    raise
                wait = 2 ** attempt
                print(f"\n  ! {type(exc).__name__}, försöker igen om {wait}s", file=sys.stderr)
                time.sleep(wait)
        return []

    def all_rows(self, table: str, select: str = "*", order: str = "id") -> list:
        """Hämta alla rader. PostgREST sidindelar vid 1 000.

        Sorteringen MÅSTE ske på en unik kolumn. Med offset-paginering på en
        icke-unik kolumn — som `inspected_at`, där tusentals rader delar datum —
        är radordningen odefinierad mellan sidorna, så rader kan dyka upp två
        gånger eller hoppas över. Det gav elva felplacerade kontroller innan
        det upptäcktes.
        """
        rows, offset = [], 0
        while True:
            params = {"select": select, "limit": PAGE, "offset": offset}
            if order:
                params["order"] = order
            url = f"{self.base}/{table}?{urllib.parse.urlencode(params)}"
            batch = self._get(url)
            rows += batch
            if len(batch) < PAGE:
                return rows
            offset += PAGE
            print(f"    {table}: {len(rows)}…", file=sys.stderr, end="\r")


def export(client: Supabase, out_dir: Path) -> None:
    print("Hämtar från Supabase", file=sys.stderr)

    municipalities = client.all_rows("municipalities", order="code")
    establishments = client.all_rows("establishments", order="id")
    assessments = client.all_rows("assessments", order="establishment_id")
    inspections = client.all_rows("inspections", order="id")
    areas = client.all_rows("control_areas", order="id")
    images = client.all_rows("images", order="id")

    # `active = 0` betyder att kommunen slutat lämna ut verksamheten, se
    # deactivate_missing i load_supabase.py. Raden ligger kvar i databasen med
    # sin historik och sin slug reserverad, men den ska inte byggas till en
    # sida. Filtret måste stå här och inte bara i vyn
    # publishable_establishments: exporten läser tabellen direkt, och utan
    # det här hade avpubliceringen inte synts på sajten alls.
    #
    # NULL räknas som publicerad, precis som vyns coalesce(active, 2).
    retired = sum(1 for e in establishments if e.get("active") == 0)
    if retired:
        establishments = [e for e in establishments if e.get("active") != 0]
        print(f"  {retired} avpublicerade verksamheter utelämnas", file=sys.stderr)

    print(
        f"  {len(municipalities)} kommuner · {len(establishments)} verksamheter · "
        f"{len(inspections)} kontroller · {len(areas)} områden",
        file=sys.stderr,
    )

    by_assessment = {a["establishment_id"]: a for a in assessments}
    by_inspection = defaultdict(list)
    for i in inspections:
        by_inspection[i["establishment_id"]].append(i)
    # Hämtordningen är id-baserad för att paginering ska vara stabil.
    # Sajten vill ha nyast först, så sorteringen görs här i stället.
    for group in by_inspection.values():
        group.sort(key=lambda x: x["inspected_at"], reverse=True)
    by_area = defaultdict(list)
    for a in areas:
        by_area[a["inspection_id"]].append(a)
    by_image = defaultdict(list)
    for img in images:
        by_image[img["establishment_id"]].append(img)

    by_municipality = defaultdict(list)
    for e in establishments:
        by_municipality[e["municipality_code"]].append(e)

    out_dir.mkdir(parents=True, exist_ok=True)
    rasade: list = []

    for m in municipalities:
        records = []
        for e in by_municipality.get(m["code"], []):
            assessment = by_assessment.get(e["id"], {})
            image = (by_image.get(e["id"]) or [None])[0]

            records.append(
                {
                    "id": e["id"],
                    "slug": e["slug"],
                    "name": e["name"],
                    "address": e.get("street_address"),
                    "types": e.get("types") or [],
                    "lat": _round(e.get("lat")),
                    "lng": _round(e.get("lng")),
                    # `url` pekar på VÅR kopia, aldrig på källans adress.
                    # Mapillarys miniatyr-URL:er är signerade och går ut; en
                    # sådan i databasen är en bild som slutar visas utan att
                    # något bygge klagar. Se pipeline/prikko/imagery.py.
                    # `source` följer med eftersom attributionskravet skiljer
                    # sig åt: Mapillary kräver sin logotyp, inte bara en länk.
                    "image": (
                        {
                            "url": image["url"],
                            "id": image.get("source_id") or "",
                            "capturedAt": image.get("captured_at"),
                            "source": image.get("source") or "own",
                            "licence": image.get("licence"),
                            "attribution": image.get("attribution"),
                        }
                        if image
                        else None
                    ),
                    "verdict": assessment.get("verdict"),
                    "distinction": assessment.get("distinction", False),
                    "reason": assessment.get("reason", "no_inspections"),
                    "modelVersion": assessment.get("model_version", 3),
                    "uncertain": False,
                    "inspections": [
                        {
                            "id": i["id"],
                            "date": i["inspected_at"],
                            "assessment": i["assessment"],
                            "type": i["type"],
                            "prenotified": i.get("prenotified"),
                            "audit": i.get("audit", False),
                            "onSite": i.get("on_site", True),
                            # Verksamhetens svar. Följer med ordagrant, och
                            # utelämnas helt när det inte finns, så att inte
                            # varje kontroll utan svar får ett tomt fält i
                            # snapshoten. Se pipeline/moderate.py för hur ett
                            # svar tar sig hit.
                            **(
                                {"ownerComment": i["owner_comment"]}
                                if i.get("owner_comment")
                                else {}
                            ),
                            "areas": [
                                {
                                    "code": a.get("code") or "",
                                    "group": a.get("area_group") or "",
                                    "description": a.get("description") or "",
                                    "status": a["status"],
                                }
                                for a in by_area.get(i["id"], [])
                            ],
                        }
                        for i in by_inspection.get(e["id"], [])
                    ],
                }
            )

        payload = {
            "municipality": {
                "code": m["code"],
                "name": m["name"],
                "city": m["city"],
                "slug": m["slug"],
                "sourceType": m.get("source_type"),
            },
            "source": {
                "url": m.get("source_url") or "",
                "fetchedAt": m.get("last_fetched_at") or "",
            },
            "establishments": records,
        }

        path = out_dir / f"{m['slug']}.json"

        # Provet FÖRE skrivningen, och det är rättelsen. Skrevs filen först
        # låg den rasade utgåvan på disken, och enda sättet att skydda den var
        # att stoppa hela exporten. Nu behålls gårdagens fil för just den
        # kommunen och de övriga elva går vidare.
        if collapse(path, records):
            rasade.append(m["slug"])
            print(
                f"  {path.name} LÄMNAS ORÖRD, gårdagens utgåva behålls",
                file=sys.stderr,
            )
            continue

        path.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"  {path}  {len(records)} verksamheter", file=sys.stderr)

    if rasade:
        report_collapse(rasade, out_dir)


#: Filen som talar om för nattjobbet att något rasade. Skrivs av
#: `report_collapse` och läses av ett sista steg i arbetsflödet, EFTER
#: incheckningen.
RAS_MARKOR = "rasade-kommuner.txt"


def report_collapse(rasade: list, out_dir: Path) -> None:
    """En rasad kommun ska stoppa sin egen fil, inte hela nattens data.

    ## Varför exporten inte längre avbryter

    Grinden avbröt förr hela körningen. Skälet var riktigt: en kommun vars
    kontrollpunkter försvinner beror långt oftare på ett fel uppströms än på
    att kommunen slutat publicera, och att checka in det raderar sidans
    egentliga innehåll.

    Men priset var för högt. 2026-08-17 bytte Lomma sidformat, hämtaren läste
    noll av sextio poster, och grinden höll därmed ELVA friska kommuners
    färska data borta från sajten. Beståndet stod på tolv dagar gammal data
    för att en kommun av tolv var trasig.

    Nu behålls gårdagens fil för den rasade kommunen och de övriga skrivs som
    vanligt. Kommunen fryser alltså på sin senaste hela utgåva i stället för
    att raderas, vilket är precis det grinden fanns för.

    ## Varför körningen ändå ska bli röd

    En kommun som fryser tyst fryser för alltid. Kommentaren vid
    MIN_POINTS_KEPT säger det redan om ett annat tal: ingen läser en rad som
    ser likadan ut varje natt. Därför skrivs en markörfil som ett sista steg i
    arbetsflödet läser EFTER incheckningen. Datan kommer fram, körningen blir
    röd, och mejlet kommer.
    """
    lista = ", ".join(rasade)
    print(
        f"\nVARNING: {len(rasade)} kommuner tappade nästan hela sin\n"
        f"kontrollhistorik: {lista}.\n"
        "Deras filer är OFÖRÄNDRADE, alltså gårdagens utgåva. Övriga kommuner\n"
        "är skrivna som vanligt och checkas in.\n"
        "Ett fel uppströms är långt troligare än att en kommun slutat\n"
        "publicera. Börja i kommunens hämtare, den upptäcker oftast själv att\n"
        "sidformatet ändrats. Är fallet verkligt: kör om med --tillat-ras.",
        file=sys.stderr,
    )
    if os.environ.get("GITHUB_ACTIONS"):
        print(f"::warning title=Kommun frusen::{lista} behöll gårdagens data.")
    (out_dir.parent / RAS_MARKOR).write_text(lista + "\n", encoding="utf-8")


def count_points(records: list) -> int:
    return sum(len(i["areas"]) for e in records for i in e["inspections"])


#: Så stor andel av gårdagens kontrollpunkter måste finnas kvar i dagens
#: export. Kontrollpunkterna är det som svarar på VAD en anmärkning gällde,
#: alltså sidans egentliga innehåll, och de rör sig långsamt: en kommun lämnar
#: ut sin historik varje natt, inte bara det som är nytt.
#:
#: Natten till 2026-08-07 skrevs 103 000 punkter över med tolv. Exporten sa
#: "12 kommuner · 15 900 verksamheter · 69 000 kontroller · 12 områden" och
#: checkade in resultatet, och ingenting stannade upp. Talet stod där hela
#: tiden. Ingen läser en rad som ser likadan ut varje natt.
MIN_POINTS_KEPT = 0.5

ALLOW_COLLAPSE = False


def collapse(path: Path, records: list) -> int:
    """Har kommunen tappat nästan alla sina kontrollpunkter sedan i går?

    Jämförelsen sker mot filen som redan ligger på disken, alltså föregående
    exports ögonblicksbild, för det är den nattkörningen ersätter.
    """
    if ALLOW_COLLAPSE or not path.exists():
        return 0
    try:
        before = count_points(json.loads(path.read_text("utf-8"))["establishments"])
    except (ValueError, KeyError):
        return 0
    after = count_points(records)
    if before and after < before * MIN_POINTS_KEPT:
        print(
            f"  ! {path.name}: {before} kontrollpunkter blev {after}",
            file=sys.stderr,
        )
        return 1
    return 0


def main() -> None:
    global ALLOW_COLLAPSE
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path, default=Path("site/src/data"))
    parser.add_argument(
        "--tillat-ras",
        action="store_true",
        help="Skriv även när en kommuns kontrollpunkter nästan försvunnit.",
    )
    args = parser.parse_args()
    ALLOW_COLLAPSE = args.tillat_ras

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
    if not url or not key:
        sys.exit("Saknar SUPABASE_URL och nyckel.")

    export(Supabase(url, key), args.out)
    print("\nKlart.", file=sys.stderr)


if __name__ == "__main__":
    main()
