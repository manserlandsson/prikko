#!/usr/bin/env python3
"""Granskning av företagsytan: uppgifter som en företrädare skickat in.

Skild fil från moderate.py, inte skild logik. Supabase-klienten, tidsstämpeln
och moderatornamnet importeras därifrån, så att det bara finns en definition
av vad ett beslut är och vem som fattade det. Skälet att kommandot inte ligger
i moderate.py är att den filen skrivs om samtidigt av besökarbilderna.

Slås ihop med moderate.py när det är lugnt i den filen. Formen är avsiktligt
samma: samma verb, samma ordning, samma utskrifter.

Körs så här, med samma miljö som moderate.py:

    set -a && . ~/.prikko-env && set +a
    python3 pipeline/moderera_foretagsyta.py kö
    python3 pipeline/moderera_foretagsyta.py visa <id>
    python3 pipeline/moderera_foretagsyta.py publicera <id>
    python3 pipeline/moderera_foretagsyta.py avsla <id> "skäl"

VAD SOM GRANSKAS: att uppgifterna är rimliga, lagliga och handlar om
verksamheten. Inte att de är sanna. En felaktig öppettid är företagets fel.

VAD SOM ALDRIG GRANSKAS HÄR: bedömningen, kontrollhistoriken och utmärkelsen.
Företagsytan når dem inte, och det här verktyget har ingen väg dit heller.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from urllib.parse import quote

from moderate import ModerationError, Supabase, moderator, now

TABLE = "business_profiles"

# Fälten i den ordning en människa vill se dem.
FIELDS = ("presentation", "opening_hours", "phone", "website", "booking_url")

DAY_NAMES = {
    "mon": "Måndag",
    "tue": "Tisdag",
    "wed": "Onsdag",
    "thu": "Torsdag",
    "fri": "Fredag",
    "sat": "Lördag",
    "sun": "Söndag",
}

DAY_ORDER = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")


def fetch(db: Supabase, row_id: str) -> dict:
    rows = db.community("GET", f"{TABLE}?id=eq.{quote(row_id)}&limit=1")
    if not rows:
        raise ModerationError(f"Ingen insändning med id {row_id}.")
    return rows[0]


def show_hours(hours: dict | None) -> None:
    if not hours:
        return
    print("  öppettider:")
    for day in DAY_ORDER:
        value = hours.get(day)
        if value is None:
            continue
        if value.get("closed"):
            print(f"    {DAY_NAMES[day]:<9} stängt")
        else:
            print(f"    {DAY_NAMES[day]:<9} {value.get('from')} till {value.get('to')}")


def cmd_queue(db: Supabase) -> int:
    rows = db.community(
        "GET",
        f"{TABLE}?status=eq.pending&select=id,establishment_id,municipality_slug,created_at"
        "&order=created_at.asc",
    )
    if not rows:
        print("Inga uppgifter väntar på granskning.")
        return 0

    print(f"{len(rows)} insändning(ar) väntar:\n")
    for row in rows:
        print(f"  {row['id']}  {row['establishment_id']}  ({row['municipality_slug']})")
        print(f"      inkom {row['created_at']}")
    print('\nVisa en med:  python3 pipeline/moderera_foretagsyta.py visa <id>')
    return 0


def cmd_show(db: Supabase, row_id: str) -> int:
    row = fetch(db, row_id)

    print(f"Verksamhet:  {row['establishment_id']} ({row['municipality_slug']})")
    print(f"Status:      {row['status']}")
    print(f"Inkom:       {row['created_at']}")

    # Vem som skickat in, och på vilken nivå anspråket ligger. Nivån avgör vad
    # företaget får fylla i, och en insändning som bär mer än nivån tillåter
    # är i sig ett skäl att titta noga.
    claims = db.community(
        "GET",
        f"establishment_claims?user_id=eq.{quote(row['user_id'])}"
        f"&establishment_id=eq.{quote(row['establishment_id'])}"
        "&select=claimant_name,claimant_role,tier,status,verification_method&limit=1",
    )
    if claims:
        claim = claims[0]
        print(
            f"Företrädare: {claim['claimant_name']} ({claim['claimant_role']}), "
            f"anspråk {claim['status']} via {claim.get('verification_method')}, "
            f"nivå {claim.get('tier')}"
        )
    else:
        print("Företrädare: INGET ANSPRÅK HITTAT. Publicera inte.")

    print("\nUppgifter:")
    for field in FIELDS:
        value = row.get(field)
        if value is None:
            continue
        if field == "opening_hours":
            show_hours(value)
        else:
            print(f"  {field}: {value}")

    if row["status"] == "rejected" and row.get("rejection_reason"):
        print(f"\nAvslogs med skäl: {row['rejection_reason']}")
    return 0


def cmd_publish(db: Supabase, row_id: str) -> int:
    row = fetch(db, row_id)
    if row["status"] != "pending":
        raise ModerationError(
            f"Insändningen har redan status {row['status']}. Bara väntande går att publicera."
        )

    # Spärren sitter i radsäkerheten också, men service_role går förbi den.
    # Ett anspråk som dragits tillbaka efter insändningen ska inte kunna
    # publiceras av att någon råkar köra kommandot i fel ordning.
    claims = db.community(
        "GET",
        f"establishment_claims?user_id=eq.{quote(row['user_id'])}"
        f"&establishment_id=eq.{quote(row['establishment_id'])}"
        "&status=eq.published&select=id&limit=1",
    )
    if not claims:
        raise ModerationError(
            "Den som skickade in har inget godkänt anspråk på verksamheten. Publicera inte."
        )

    stamp = now()
    db.community(
        "PATCH",
        f"{TABLE}?id=eq.{quote(row_id)}",
        {
            "status": "published",
            "moderated_at": stamp,
            "moderated_by": moderator(),
            "published_at": stamp,
        },
    )
    print("Publicerat. Uppgifterna gäller från och med nu och ersätter tidigare.")
    return 0


def cmd_reject(db: Supabase, row_id: str, reason: str) -> int:
    row = fetch(db, row_id)
    if row["status"] == "rejected":
        print("Redan avslagen.")
        return 0

    db.community(
        "PATCH",
        f"{TABLE}?id=eq.{quote(row_id)}",
        {
            "status": "rejected",
            "moderated_at": now(),
            "moderated_by": moderator(),
            "rejection_reason": reason,
        },
    )
    print("Avslaget. Skälet visas för företrädaren på verksamhetens sida.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Granska uppgifter som en företrädare skickat in.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("kö", aliases=["ko"], help="Visa väntande insändningar.")

    show = sub.add_parser("visa", help="Visa en insändning i sin helhet.")
    show.add_argument("id")

    publish = sub.add_parser("publicera", help="Släpp fram uppgifterna.")
    publish.add_argument("id")

    reject = sub.add_parser("avsla", help="Avslå med ett skäl.")
    reject.add_argument("id")
    reject.add_argument("reason")

    args = parser.parse_args()

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        print(
            "SUPABASE_URL och SUPABASE_SERVICE_KEY måste vara satta.\n"
            "  set -a && . ~/.prikko-env && set +a",
            file=sys.stderr,
        )
        return 2

    db = Supabase(url, key)
    try:
        if args.command in ("kö", "ko"):
            return cmd_queue(db)
        if args.command == "visa":
            return cmd_show(db, args.id)
        if args.command == "publicera":
            return cmd_publish(db, args.id)
        if args.command == "avsla":
            return cmd_reject(db, args.id, args.reason)
    except ModerationError as exc:
        print(f"Fel: {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
