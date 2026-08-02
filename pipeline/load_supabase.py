#!/usr/bin/env python3
"""Ladda normaliserad kommundata till Supabase.

Tar en fil skriven av valfri fetch_*.py och skriver in den. Ingenting här är
kommunspecifikt — filens `municipality`-block styr allt.

    export SUPABASE_URL=https://xxxx.supabase.co
    export SUPABASE_SERVICE_KEY=eyJ...
    python3 pipeline/load_supabase.py site/src/data/stockholm.json

Skriver via PostgREST med service_role-nyckeln, som går förbi radsäkerheten.
Den nyckeln får ALDRIG hamna i klientkod eller i repot — den ger full
skrivåtkomst till hela databasen.

Upsert, inte insert: körningen är idempotent och kan göras om utan att
duplicera. Inspektioner och kontrollområden ersätts per anläggning, så att
borttagna poster hos kommunen också försvinner hos oss.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Iterable

BATCH = 500


class SupabaseError(RuntimeError):
    pass


class Supabase:
    def __init__(self, url: str, key: str) -> None:
        self.base = url.rstrip("/") + "/rest/v1"
        self.key = key

    def _request(self, method: str, path: str, body=None, prefer: str = "") -> bytes:
        headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer

        data = json.dumps(body).encode("utf-8") if body is not None else None
        request = urllib.request.Request(
            f"{self.base}/{path}", data=data, headers=headers, method=method
        )
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                return response.read()
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")[:500]
            raise SupabaseError(f"{method} {path} → {exc.code}: {detail}") from exc

    def upsert(self, table: str, rows: list, on_conflict: str) -> None:
        """Upsert i portionsvis storlek. Tomma listor hoppas över."""
        if not rows:
            return
        query = urllib.parse.urlencode({"on_conflict": on_conflict})
        for start in range(0, len(rows), BATCH):
            chunk = rows[start : start + BATCH]
            self._request(
                "POST",
                f"{table}?{query}",
                chunk,
                prefer="resolution=merge-duplicates,return=minimal",
            )

    def delete_where_in(self, table: str, column: str, values: Iterable[str]) -> None:
        """Rensa rader vars förälder vi är på väg att skriva om."""
        values = list(values)
        for start in range(0, len(values), 100):
            chunk = values[start : start + 100]
            quoted = ",".join(f'"{v}"' for v in chunk)
            query = urllib.parse.urlencode({column: f"in.({quoted})"})
            self._request("DELETE", f"{table}?{query}", prefer="return=minimal")


def load(path: Path, client: Supabase) -> None:
    payload = json.loads(path.read_text(encoding="utf-8"))
    municipality = payload["municipality"]
    source = payload.get("source", {})
    establishments = payload["establishments"]

    print(f"{municipality['name']}: {len(establishments)} anläggningar", file=sys.stderr)

    client.upsert(
        "municipalities",
        [
            {
                "code": municipality["code"],
                "name": municipality["name"],
                "city": municipality["city"],
                "slug": municipality["slug"],
                "source_type": municipality.get("sourceType", "reverse_engineered"),
                "source_url": source.get("url"),
                "adapter": municipality.get("adapter", municipality["slug"]),
                "last_fetched_at": source.get("fetchedAt"),
            }
        ],
        on_conflict="code",
    )

    establishment_rows = [
        {
            "id": e["id"],
            "municipality_code": municipality["code"],
            "id_local": e["id"].rsplit("-", 1)[-1],
            "name": e["name"],
            "types": e.get("types") or [],
            "street_address": e.get("address"),
            "locality": municipality["city"],
            "lat": e.get("lat"),
            "lng": e.get("lng"),
            "slug": e["slug"],
            "active": 2,
            "fetched_at": source.get("fetchedAt"),
        }
        for e in establishments
    ]
    client.upsert("establishments", establishment_rows, on_conflict="id")
    print(f"  anläggningar skrivna", file=sys.stderr)

    # Inspektioner ersätts helt per körning: en kontroll som kommunen tagit
    # bort ska försvinna även hos oss. Kontrollområden städas av kaskaden.
    ids = [e["id"] for e in establishments]
    client.delete_where_in("inspections", "establishment_id", ids)

    inspection_rows, area_rows = [], []
    for e in establishments:
        for i in e.get("inspections") or []:
            inspection_rows.append(
                {
                    "id": i["id"],
                    "establishment_id": e["id"],
                    "inspected_at": i["date"],
                    "type": i["type"],
                    "assessment": i["assessment"],
                    "prenotified": i.get("prenotified"),
                    "audit": i.get("audit", False),
                    "on_site": i.get("onSite", True),
                    "fetched_at": source.get("fetchedAt"),
                }
            )
            for a in i.get("areas") or []:
                area_rows.append(
                    {
                        "inspection_id": i["id"],
                        "code": a.get("code") or None,
                        "area_group": a.get("group") or None,
                        "description": a.get("description") or None,
                        "status": a["status"],
                    }
                )

    client.upsert("inspections", inspection_rows, on_conflict="id")
    print(f"  {len(inspection_rows)} inspektioner skrivna", file=sys.stderr)

    if area_rows:
        client.upsert("control_areas", area_rows, on_conflict="id")
        print(f"  {len(area_rows)} kontrollområden skrivna", file=sys.stderr)

    assessment_rows = [
        {
            "establishment_id": e["id"],
            "verdict": e.get("verdict"),
            "distinction": e.get("distinction", False),
            "reason": e.get("reason", "no_inspections"),
            "model_version": e.get("modelVersion", 2),
        }
        for e in establishments
    ]
    client.upsert("assessments", assessment_rows, on_conflict="establishment_id")
    print(f"  bedömningar skrivna", file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("files", nargs="+", type=Path)
    args = parser.parse_args()

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        sys.exit(
            "Saknar SUPABASE_URL eller SUPABASE_SERVICE_KEY.\n"
            "service_role-nyckeln ger full skrivåtkomst — håll den utanför repot."
        )

    client = Supabase(url, key)
    for path in args.files:
        load(path, client)

    print("\nKlart.", file=sys.stderr)


if __name__ == "__main__":
    main()
