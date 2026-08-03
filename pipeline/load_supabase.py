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

    def has_column(self, table: str, column: str) -> bool:
        """Finns kolumnen? PostgREST svarar 400 när den inte gör det.

        Schemat lever i schema.sql och körs för hand i Supabase SQL Editor.
        Pipelinen ska därför inte krascha mot en databas som ännu inte fått
        senaste migreringen — den ska skriva det den kan och säga vad som
        saknas.
        """
        try:
            self._request("GET", f"{table}?select={column}&limit=1")
            return True
        except SupabaseError:
            return False

    def upsert(self, table: str, rows: list, on_conflict: str) -> None:
        """Upsert i portionsvis storlek. Tomma listor hoppas över.

        Rader med samma konfliktnyckel slås ihop innan de skickas, med den
        SISTA av dem som vinnare. Postgres vägrar nämligen `ON CONFLICT DO
        UPDATE` när samma rad skulle träffas två gånger i ETT kommando:

            21000: ON CONFLICT DO UPDATE command cannot affect row a second time

        Det är precis vad som fällde den nattliga körningen 2026-08-03.
        Linköpings API returnerar samma tillsynsId två gånger för en del
        anläggningar, och adaptern skickade båda vidare.

        Felet är lömskt för att det är INTERMITTENT. Hamnar de två raderna i
        olika portioner går det igenom, och det hade det gjort i veckor. Det
        smäller först den natt de råkar landa i samma portion.

        Sammanslagningen här ersätter inte att adaptern ska lämna rena data.
        Den finns för att en enda kommuns trasiga id aldrig ska stoppa
        inläsningen av de elva andra.
        """
        if not rows:
            return

        keys = [k.strip() for k in on_conflict.split(",")]
        merged: dict = {}
        for row in rows:
            merged[tuple(row.get(k) for k in keys)] = row
        if len(merged) != len(rows):
            print(
                f"  ! {len(rows) - len(merged)} rader i {table} delade "
                f"konfliktnyckel ({on_conflict}) och slogs ihop",
                file=sys.stderr,
            )
        rows = list(merged.values())

        query = urllib.parse.urlencode({"on_conflict": on_conflict})
        for start in range(0, len(rows), BATCH):
            chunk = rows[start : start + BATCH]
            self._request(
                "POST",
                f"{table}?{query}",
                chunk,
                prefer="resolution=merge-duplicates,return=minimal",
            )

    def select_all(self, table: str, query: str) -> list:
        """Hämta samtliga rader för en fråga, sidvis.

        PostgREST returnerar högst 1 000 rader per svar. Utan sidbrytning
        hade en namnjämförelse i Stockholm tyst tappat 7 500 av 8 511
        anläggningar och därmed missat exakt de byten den finns för.
        """
        rows: list = []
        page = 1000
        while True:
            start = len(rows)
            data = self._request(
                "GET",
                f"{table}?{query}&limit={page}&offset={start}",
            )
            chunk = json.loads(data.decode("utf-8"))
            rows.extend(chunk)
            if len(chunk) < page:
                return rows

    def delete_where_in(self, table: str, column: str, values: Iterable[str]) -> None:
        """Rensa rader vars förälder vi är på väg att skriva om."""
        values = list(values)
        for start in range(0, len(values), 100):
            chunk = values[start : start + 100]
            quoted = ",".join(f'"{v}"' for v in chunk)
            query = urllib.parse.urlencode({column: f"in.({quoted})"})
            self._request("DELETE", f"{table}?{query}", prefer="return=minimal")


def record_names(
    client: Supabase,
    municipality_code: str,
    establishments: list,
    fetched_at: str | None,
) -> list:
    """Skriv namnhistorik per anläggning och larma när ett namn bytts.

    Kommunernas kontroller hänger på ANLÄGGNINGEN, alltså lokalen, inte på
    företaget. Tar en ny restaurang över en adress ärver den föregångarens hela
    kontrollhistorik, och ingen av källorna säger att bytet skett. Stockholms
    `date` är null och det finns inget fält för verksamhetens start.

    Ett byte går ändå att se över tid, eftersom vi kör mot samma anläggnings-id
    varje natt: byter NAMNET på ett id har verksamheten sannolikt bytt.

    Måste anropas FÖRE upserten av establishments. Efteråt är det gamla namnet
    överskrivet och jämförelsen har inget att jämföra mot.

    Returnerar de upptäckta bytena som (id, gammalt namn, nytt namn).
    """
    known = {
        row["id"]: row["name"]
        for row in client.select_all(
            "establishments",
            f"select=id,name&municipality_code=eq.{urllib.parse.quote(municipality_code)}",
        )
    }

    changes = []
    for e in establishments:
        previous = known.get(e["id"])
        # Okänt id = ny anläggning hos kommunen, inte ett byte. Att larma på
        # den hade dränkt de verkliga bytena i brus.
        if previous is not None and previous != e["name"]:
            changes.append((e["id"], previous, e["name"]))

    # Loggen skrivs oavsett om något bytts: `last_seen_at` ska betyda "senast
    # sedd", och `first_seen_at` sätts av kolumnens default bara vid insert.
    # Skickas first_seen_at med i nyttolasten skriver PostgREST över den vid
    # varje körning och hela poängen med tabellen går förlorad.
    client.upsert(
        "establishment_names",
        [
            {
                "establishment_id": e["id"],
                "name": e["name"],
                "last_seen_at": fetched_at,
            }
            for e in establishments
        ],
        on_conflict="establishment_id,name",
    )

    if changes:
        print(
            f"  NAMNBYTE på {len(changes)} anläggning(ar). Kontrollhistoriken på\n"
            "  dessa id:n spänner sannolikt över mer än en verksamhet:",
            file=sys.stderr,
        )
        for eid, before, after in changes[:20]:
            print(f"    {eid}: {before!r} -> {after!r}", file=sys.stderr)
        if len(changes) > 20:
            print(f"    ... och {len(changes) - 20} till", file=sys.stderr)
        if os.environ.get("GITHUB_ACTIONS"):
            print(
                f"::warning title=Namnbyte upptäckt::{len(changes)} anläggningar "
                f"i {municipality_code} har bytt namn sedan förra körningen."
            )

    return changes


def load(path: Path, client: Supabase, geo_only: bool = False) -> None:
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

    # Härledda koordinater bär sitt ursprung med sig. Kolumnerna kom till i en
    # senare migrering; mot en databas utan dem skriver vi resten ändå.
    geo_marked = client.has_column("establishments", "geo_source")
    if not geo_marked and any(e.get("geoSource") for e in establishments):
        print(
            "  VARNING: establishments saknar geo_source/geo_precision.\n"
            "  Kör om pipeline/schema.sql i Supabase SQL Editor, annars kan sidan\n"
            "  inte skilja en härledd koordinat från kommunens egen.",
            file=sys.stderr,
        )

    establishment_rows = []
    for e in establishments:
        row = {
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
        if geo_marked:
            row["geo_source"] = e.get("geoSource")
            row["geo_precision"] = e.get("geoPrecision")
        establishment_rows.append(row)

    # FÖRE upserten: efteråt är det gamla namnet borta och bytet osynligt.
    # Tabellen kom till i en senare migrering, så en databas som inte fått den
    # ska varna och ladda vidare i stället för att fälla hela nattkörningen.
    if client.has_column("establishment_names", "name"):
        record_names(client, municipality["code"], establishments, source.get("fetchedAt"))
    else:
        print(
            "  VARNING: tabellen establishment_names saknas. Namnbyten kan inte\n"
            "  upptäckas, och kontrollhistorik från en tidigare verksamhet i samma\n"
            "  lokal går därför inte att skilja ut. Kör om pipeline/schema.sql.",
            file=sys.stderr,
        )

    client.upsert("establishments", establishment_rows, on_conflict="id")
    print(f"  anläggningar skrivna", file=sys.stderr)

    if geo_only:
        placed = sum(1 for e in establishments if e.get("lat") is not None)
        print(f"  {placed} koordinater skrivna; hoppar över kontrollhistoriken", file=sys.stderr)
        return

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
    parser.add_argument(
        "--geo-only",
        action="store_true",
        help="skriv bara anläggningarna (koordinater), rör inte kontrollhistoriken",
    )
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
        load(path, client, geo_only=args.geo_only)

    print("\nKlart.", file=sys.stderr)


if __name__ == "__main__":
    main()
