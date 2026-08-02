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
                    "lat": e.get("lat"),
                    "lng": e.get("lng"),
                    "image": (
                        {
                            "url": image["url"],
                            "id": image.get("source_id") or "",
                            "capturedAt": image.get("captured_at"),
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
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"  {path}  {len(records)} verksamheter", file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path, default=Path("site/src/data"))
    args = parser.parse_args()

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
    if not url or not key:
        sys.exit("Saknar SUPABASE_URL och nyckel.")

    export(Supabase(url, key), args.out)
    print("\nKlart.", file=sys.stderr)


if __name__ == "__main__":
    main()
