#!/usr/bin/env python3
"""Redaktionell granskning av användarinnehåll.

    set -a && . ~/.prikko-env && set +a
    python3 pipeline/moderate.py kö
    python3 pipeline/moderate.py visa svar <id>
    python3 pipeline/moderate.py publicera svar <id>
    python3 pipeline/moderate.py avsla omdome <id> "Innehåller personuppgifter"

Det här verktyget ÄR redaktionen i utgivningsbevisets mening.

Mediemyndigheten kräver att databasen inte kan ändras av någon annan än
redaktionen. Den spärren är byggd i två lager:

  1. Ingen inloggad roll har UPDATE på tabellerna i schemat `community`. En rad
     kan alltså inte gå från `pending` till `published` genom webbläsaren, hur
     mycket någon än pillar på klientkoden.
  2. Bara service_role går förbi radsäkerheten, och den nyckeln finns bara här
     och i pipelinen. Den får ALDRIG hamna i klientkod eller i repot.

OREDIGERAT ÄR INTE OMODERERAT. Sidfoten och metodiksidan lovar att
verksamhetens svar publiceras oredigerat. Verktyget har därför två utfall och
inte tre: publicera texten ordagrant, eller avslå den. Det finns ingen
"ändra"-väg, och skulle någon lägga till en så fäller en trigger i databasen
skrivningen (community.freeze_body). Löftet är alltså inte en rutin man kan
glömma, det är ett fel som stoppar kommandot.

Vad som händer vid publicering:

  svar     texten kopieras ordagrant till public.inspections.owner_comment.
           Nästa export_supabase.py tar med den, nästa bygge visar den.
  omdome   raden blir läsbar för anon genom vyn community.published_reviews.
           Omdömen går ALDRIG in i ett bygge; de hämtas i webbläsaren.
  anspråk  personen får rätt att svara på kontroller och ladda upp bilder för
           just den verksamheten. Ange alltid hur du kontrollerade det.
  bild     filen kopieras till den publika bucketen och en rad skrivs i
           public.images med source='owner'. Syns i nästa bygge.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import textwrap
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

#: Schemat med användarinnehåll. Aldrig `public`. Se schema_community.sql.
SCHEMA = "community"

INBOX_BUCKET = "verksamhetsbilder-inkomna"
PUBLIC_BUCKET = "verksamhetsbilder"

#: Svenska kommandonamn mot tabeller. Verktyget körs av ägaren, inte av kod.
#: `anspak` finns som variant utan å, så att kommandot går att skriva från ett
#: terminalfönster med amerikansk tangentbordslayout.
KINDS = {
    "svar": "owner_responses",
    "omdome": "reviews",
    "anspråk": "establishment_claims",
    "anspak": "establishment_claims",
    "bild": "image_uploads",
}


class ModerationError(RuntimeError):
    pass


class Supabase:
    def __init__(self, url: str, key: str) -> None:
        self.url = url.rstrip("/")
        self.key = key

    def _request(self, method: str, path: str, body=None, headers=None) -> bytes:
        merged = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
        }
        merged.update(headers or {})
        data = None
        if body is not None:
            data = json.dumps(body).encode("utf-8")
            merged.setdefault("Content-Type", "application/json")

        request = urllib.request.Request(
            f"{self.url}/{path}", data=data, headers=merged, method=method
        )
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.read()
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")[:600]
            raise ModerationError(f"{method} {path} → {exc.code}: {detail}") from exc

    # -- PostgREST ---------------------------------------------------------

    def community(self, method: str, path: str, body=None, prefer: str = "") -> list:
        """Anrop mot schemat community. Schemat väljs per anrop med profilhuvuden."""
        headers = {"Accept-Profile": SCHEMA}
        if body is not None:
            headers["Content-Profile"] = SCHEMA
        if prefer:
            headers["Prefer"] = prefer
        raw = self._request(method, f"rest/v1/{path}", body, headers)
        return json.loads(raw) if raw else []

    def public(self, method: str, path: str, body=None, prefer: str = "") -> list:
        headers = {"Prefer": prefer} if prefer else {}
        raw = self._request(method, f"rest/v1/{path}", body, headers)
        return json.loads(raw) if raw else []

    # -- Storage -----------------------------------------------------------

    def sign(self, bucket: str, path: str, seconds: int = 3600) -> str:
        raw = self._request(
            "POST", f"storage/v1/object/sign/{bucket}/{path}", {"expiresIn": seconds}
        )
        return self.url + "/storage/v1" + json.loads(raw)["signedURL"]

    def copy_object(self, source: str, destination: str) -> None:
        self._request(
            "POST",
            "storage/v1/object/copy",
            {
                "bucketId": INBOX_BUCKET,
                "sourceKey": source,
                "destinationBucket": PUBLIC_BUCKET,
                "destinationKey": destination,
            },
        )

    def public_url(self, path: str) -> str:
        return f"{self.url}/storage/v1/object/public/{PUBLIC_BUCKET}/{path}"


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def moderator() -> str:
    """Vem som fattade beslutet.

    Sätts av PRIKKO_MODERATOR, annars användarnamnet på maskinen. Fältet är
    inte kosmetiskt: databasen vägrar publicera ett omdöme utan moderator, och
    ett publicerat beslut ska gå att härleda till en människa.
    """
    return os.environ.get("PRIKKO_MODERATOR") or os.environ.get("USER") or "redaktionen"


# ---------------------------------------------------------------------------
# Kommandon
# ---------------------------------------------------------------------------


def cmd_queue(db: Supabase) -> int:
    total = 0
    for label, table, columns in (
        ("Svar från verksamheter", "owner_responses",
         "id,establishment_id,municipality_slug,inspection_id,created_at"),
        ("Omdömen", "reviews", "id,establishment_id,municipality_slug,created_at"),
        ("Anspråk", "establishment_claims",
         "id,establishment_id,establishment_name,claimant_name,claimant_role,"
         "organization_number,contact_email,created_at"),
        ("Bilder", "image_uploads",
         "id,establishment_id,storage_path,caption,byte_size,created_at"),
    ):
        rows = db.community(
            "GET", f"{table}?select={columns}&status=eq.pending&order=created_at.asc"
        )
        total += len(rows)
        print(f"\n{label}: {len(rows)} väntar")
        for row in rows:
            print(f"  {row['id']}  {row.get('establishment_id', '')}"
                  f"  {row.get('created_at', '')[:10]}")

    print(f"\nSammanlagt {total} poster väntar på granskning.")
    if total:
        print("Läs en post med:  python3 pipeline/moderate.py visa <sort> <id>")
    return 0


def cmd_show(db: Supabase, kind: str, row_id: str) -> int:
    table = KINDS[kind]
    rows = db.community("GET", f"{table}?id=eq.{urllib.parse.quote(row_id)}")
    if not rows:
        raise ModerationError(f"Ingen {kind} med id {row_id}")
    row = rows[0]

    for key, value in row.items():
        if key == "body":
            continue
        print(f"{key:20} {value}")

    if row.get("body"):
        print("\n--- text, ordagrant ---")
        print(textwrap.indent(row["body"], "  "))
        print("--- slut ---")

    if table == "image_uploads":
        print("\nBilden (länken gäller en timme):")
        print("  " + db.sign(INBOX_BUCKET, row["storage_path"]))

    if table == "owner_responses":
        insp = db.public(
            "GET",
            f"inspections?select=inspected_at,assessment,owner_comment"
            f"&id=eq.{urllib.parse.quote(row['inspection_id'])}",
        )
        if insp:
            i = insp[0]
            print(f"\nKontrollen svaret gäller: {i['inspected_at']}, "
                  f"bedömning {i['assessment']}")
            if i.get("owner_comment"):
                print("VARNING: kontrollen har redan ett publicerat svar.")
    return 0


def cmd_publish(db: Supabase, kind: str, row_id: str, method: str | None) -> int:
    table = KINDS[kind]
    quoted = urllib.parse.quote(row_id)
    rows = db.community("GET", f"{table}?id=eq.{quoted}")
    if not rows:
        raise ModerationError(f"Ingen {kind} med id {row_id}")
    row = rows[0]
    if row["status"] != "pending":
        raise ModerationError(f"Posten är redan {row['status']}, inte pending.")

    stamp = now()
    who = moderator()

    if table == "establishment_claims":
        if not method:
            raise ModerationError(
                "Ett anspråk måste bära hur det kontrollerades. Ange --metod "
                "register_check eller postal_code. Databasen vägrar annars."
            )
        db.community(
            "PATCH",
            f"establishment_claims?id=eq.{quoted}",
            {
                "status": "published",
                "verification_method": method,
                "verified_at": stamp,
                "verified_by": who,
            },
        )
        print(f"Anspråket godkänt ({method}). {row.get('claimant_name')} kan nu "
              f"svara för {row.get('establishment_name')}.")
        return 0

    if table == "reviews":
        db.community(
            "PATCH",
            f"reviews?id=eq.{quoted}",
            {"status": "published", "moderated_at": stamp, "moderated_by": who},
        )
        print("Omdömet publicerat. Det syns i webbläsaren direkt, aldrig i bygget.")
        return 0

    if table == "owner_responses":
        # Ordagrant. Texten läses ur raden och skrivs oförändrad. Skulle någon
        # försöka ändra den i community-tabellen fäller triggern skrivningen.
        db.public(
            "PATCH",
            f"inspections?id=eq.{urllib.parse.quote(row['inspection_id'])}",
            {"owner_comment": row["body"]},
        )
        db.community(
            "PATCH",
            f"owner_responses?id=eq.{quoted}",
            {
                "status": "published",
                "moderated_at": stamp,
                "moderated_by": who,
                "published_at": stamp,
            },
        )
        print("Svaret skrivet ordagrant till kontrollen.")
        print("Kör export_supabase.py och bygg om för att det ska synas på sajten.")
        return 0

    if table == "image_uploads":
        destination = row["storage_path"].replace("pending/", "", 1)
        db.copy_object(row["storage_path"], destination)
        url = db.public_url(destination)
        db.public(
            "POST",
            "images",
            {
                "establishment_id": row["establishment_id"],
                "url": url,
                "source": "owner",
                "source_id": row["id"],
                "attribution": "Verksamhetens egen bild",
                "position": 0,
            },
            prefer="return=minimal",
        )
        db.community(
            "PATCH",
            f"image_uploads?id=eq.{quoted}",
            {
                "status": "published",
                "moderated_at": stamp,
                "moderated_by": who,
                "published_url": url,
            },
        )
        print(f"Bilden publicerad: {url}")
        print("Originalet ligger kvar i den privata inkorgen som underlag.")
        return 0

    raise ModerationError(f"Okänd sort: {kind}")


def cmd_reject(db: Supabase, kind: str, row_id: str, reason: str) -> int:
    table = KINDS[kind]
    quoted = urllib.parse.quote(row_id)
    stamp = now()
    who = moderator()

    patch = {"status": "rejected", "rejection_reason": reason}
    if table == "establishment_claims":
        patch |= {"verified_by": who}
    else:
        patch |= {"moderated_at": stamp, "moderated_by": who}

    db.community("PATCH", f"{table}?id=eq.{quoted}", patch)
    print(f"Avslaget. Skälet syns för avsändaren på hens kontosida: {reason}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Redaktionell granskning av användarinnehåll.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Sorter: svar, omdome, anspråk, bild",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # `ko` som alias, för terminaler utan svensk tangentbordslayout.
    sub.add_parser("kö", aliases=["ko"], help="Visa allt som väntar")

    show = sub.add_parser("visa", help="Läs en post i sin helhet")
    show.add_argument("kind")
    show.add_argument("id")

    publish = sub.add_parser("publicera", help="Publicera ordagrant")
    publish.add_argument("kind")
    publish.add_argument("id")
    publish.add_argument(
        "--metod",
        choices=["register_check", "postal_code", "domain_email"],
        help="Krävs för anspråk: hur företrädarskapet kontrollerades.",
    )

    reject = sub.add_parser("avsla", help="Avslå med skäl")
    reject.add_argument("kind")
    reject.add_argument("id")
    reject.add_argument("reason")

    args = parser.parse_args()

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        print("SUPABASE_URL och SUPABASE_SERVICE_KEY måste vara satta.", file=sys.stderr)
        print("  set -a && . ~/.prikko-env && set +a", file=sys.stderr)
        return 2

    db = Supabase(url, key)

    try:
        if args.command in ("kö", "ko"):
            return cmd_queue(db)
        if args.kind not in KINDS:
            print(f"Okänd sort: {args.kind}. Välj svar, omdome, anspråk eller bild.",
                  file=sys.stderr)
            return 2
        if args.command == "visa":
            return cmd_show(db, args.kind, args.id)
        if args.command == "publicera":
            return cmd_publish(db, args.kind, args.id, args.metod)
        if args.command == "avsla":
            return cmd_reject(db, args.kind, args.id, args.reason)
    except ModerationError as exc:
        print(f"Fel: {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
