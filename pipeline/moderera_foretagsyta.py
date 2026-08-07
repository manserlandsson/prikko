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

Samma fyra verb gäller bilderna, med --bilder efter kommandot:

    python3 pipeline/moderera_foretagsyta.py kö --bilder
    python3 pipeline/moderera_foretagsyta.py visa <id> --bilder
    python3 pipeline/moderera_foretagsyta.py publicera <id> --bilder
    python3 pipeline/moderera_foretagsyta.py avsla <id> "skäl" --bilder

En flagga och inte fyra nya kommandon: en bild och en öppettid granskas i samma
kö av samma person, och två uppsättningar verb hade betytt två uppsättningar
vanor att komma ihåg.

VAD SOM GRANSKAS: att uppgifterna är rimliga, lagliga och handlar om
verksamheten. Inte att de är sanna. En felaktig öppettid är företagets fel.

För en bild tillkommer en fråga: föreställer den verksamheten. En bild av något
annat är inte en bild av stället, hur vacker den än är.

VAD SOM ALDRIG GRANSKAS HÄR: bedömningen, kontrollhistoriken och utmärkelsen.
Företagsytan når dem inte, och det här verktyget har ingen väg dit heller. En
bild kan inte heller vara ett svar på en kontroll: den vägen går genom
community.owner_responses och moderate.py.
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from urllib.parse import quote

from moderate import (
    INBOX_BUCKET,
    NEEDS_CONVERSION,
    PUBLIC_BUCKET,
    ModerationError,
    Supabase,
    heic_to_jpeg,
    moderator,
    now,
)

TABLE = "business_profiles"
IMAGE_TABLE = "business_images"

# Fälten i den ordning en människa vill se dem.
FIELDS = (
    "presentation",
    "opening_hours",
    "opening_hours_exceptions",
    "phone",
    "website",
    "booking_url",
)

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


def fetch(db: Supabase, row_id: str, table: str = TABLE) -> dict:
    rows = db.community("GET", f"{table}?id=eq.{quote(row_id)}&limit=1")
    if not rows:
        raise ModerationError(f"Ingen insändning med id {row_id}.")
    return rows[0]


def claim_ok(db: Supabase, row: dict) -> bool:
    """Har den som skickade in fortfarande ett godkänt anspråk?

    Spärren sitter i radsäkerheten också, men service_role går förbi den. Ett
    anspråk som dragits tillbaka efter insändningen ska inte kunna publiceras av
    att någon råkar köra kommandot i fel ordning.
    """
    claims = db.community(
        "GET",
        f"establishment_claims?user_id=eq.{quote(row['user_id'])}"
        f"&establishment_id=eq.{quote(row['establishment_id'])}"
        "&status=eq.published&select=id&limit=1",
    )
    return bool(claims)


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


def show_exceptions(dates: dict | None) -> None:
    """Avvikande datum, i datumordning."""
    if not dates:
        return
    print("  avvikande datum:")
    for datum in sorted(dates):
        value = dates[datum]
        namn = value.get("label")
        tid = "stängt" if value.get("closed") else f"{value.get('from')} till {value.get('to')}"
        print(f"    {datum}  {tid}" + (f"  ({namn})" if namn else ""))


def cmd_queue(db: Supabase, table: str = TABLE) -> int:
    bilder = table == IMAGE_TABLE
    rows = db.community(
        "GET",
        f"{table}?status=eq.pending&select=id,establishment_id,municipality_slug,created_at"
        "&order=created_at.asc",
    )
    if not rows:
        print("Inga bilder väntar på granskning." if bilder else "Inga uppgifter väntar på granskning.")
        return 0

    print(f"{len(rows)} {'bild(er)' if bilder else 'insändning(ar)'} väntar:\n")
    for row in rows:
        print(f"  {row['id']}  {row['establishment_id']}  ({row['municipality_slug']})")
        print(f"      inkom {row['created_at']}")
    flagga = " --bilder" if bilder else ""
    print(f"\nVisa en med:  python3 pipeline/moderera_foretagsyta.py visa <id>{flagga}")
    return 0


def cmd_show_image(db: Supabase, row_id: str) -> int:
    row = fetch(db, row_id, IMAGE_TABLE)

    print(f"Verksamhet:  {row['establishment_id']} ({row['municipality_slug']})")
    print(f"Status:      {row['status']}")
    print(f"Inkom:       {row['created_at']}")
    print(f"Bildtext:    {row.get('caption') or '(ingen)'}")
    print(f"Filen:       {row['content_type']}, {row['byte_size']} byte")
    print(f"Ordning:     {row.get('sort_order')}")
    print(f"Rättigheter: {'bekräftade' if row.get('rights_confirmed') else 'EJ BEKRÄFTADE'}")

    if not claim_ok(db, row):
        print("Företrädare: INGET GODKÄNT ANSPRÅK. Publicera inte.")

    # En signerad länk med kort livslängd. Bilden ligger i en stängd bucket och
    # ska inte gå att nå med en gissad URL medan den väntar på granskning.
    print("\nSe bilden (giltig en timme):")
    print("  " + db.sign(INBOX_BUCKET, row["storage_path"]))

    # HEIC öppnas av Förhandsvisning och Safari men inte av Chrome, som laddar
    # ned filen i stället för att visa den. Det ser ut som ett fel och är det
    # inte, alltså står det här i stället för att bli en fråga.
    if row.get("content_type") in NEEDS_CONVERSION:
        print("  Formatet är HEIC. Öppna länken i Safari eller ladda ned och")
        print("  öppna i Förhandsvisning. Chrome kan inte visa det.")
        print("  Vid publicering konverteras bilden till JPEG.")

    if row["status"] == "published" and row.get("published_url"):
        print(f"\nPublicerad på: {row['published_url']}")
    if row["status"] == "rejected" and row.get("rejection_reason"):
        print(f"\nAvslogs med skäl: {row['rejection_reason']}")
    return 0


def cmd_publish_image(db: Supabase, row_id: str) -> int:
    row = fetch(db, row_id, IMAGE_TABLE)
    if row["status"] != "pending":
        raise ModerationError(
            f"Bilden har redan status {row['status']}. Bara väntande går att publicera."
        )
    if not claim_ok(db, row):
        raise ModerationError(
            "Den som skickade in har inget godkänt anspråk på verksamheten. Publicera inte."
        )

    # Samma nyckel i båda bucketarna. Besökarbilderna byter sökväg när de
    # publiceras, eftersom deras inkorgsmapp heter 'pending/'; företagsbilderna
    # ligger under 'foretag/<user_id>/' redan i inkorgen, och den sökvägen är
    # lika giltig i den publika bucketen.
    destination = row["storage_path"]

    # HEIC får aldrig nå den publika hinken. Chrome och Firefox kan inte avkoda
    # formatet, så en publicerad HEIC hade varit osynlig för de flesta
    # besökare. Konverteringen vrider också bilden rätt efter EXIF innan taggen
    # försvinner; se _finish_jpeg i moderate.py för varför den ordningen är
    # hela poängen.
    if row.get("content_type") in NEEDS_CONVERSION:
        print("Konverterar från HEIC till JPEG.")
        jpeg = heic_to_jpeg(db.download_object(INBOX_BUCKET, row["storage_path"]))
        destination = re.sub(r"\.[^./]+$", ".jpg", destination)
        db.upload_object(PUBLIC_BUCKET, destination, jpeg, "image/jpeg")
    else:
        # Serverkopia. Ingenting behöver hem till den här maskinen när filen
        # redan har rätt format.
        db.copy_object(row["storage_path"], destination)

    stamp = now()
    db.community(
        "PATCH",
        f"{IMAGE_TABLE}?id=eq.{quote(row_id)}",
        {
            "status": "published",
            "moderated_at": stamp,
            "moderated_by": moderator(),
            "published_url": db.public_url(destination),
        },
    )
    print("Publicerat. Bilden syns på verksamhetens sida.")
    print("Originalet ligger kvar i den privata inkorgen som underlag.")
    return 0


def cmd_reject_image(db: Supabase, row_id: str, reason: str) -> int:
    row = fetch(db, row_id, IMAGE_TABLE)
    if row["status"] == "rejected":
        print("Redan avslagen.")
        return 0

    # Statusen först, filen sedan. Faller raderingen ligger en fil kvar som
    # ingen rad pekar på, och det syns i lagringen. Faller det i andra
    # ordningen ligger en avslagen bild kvar publikt, och det syns inte alls.
    db.community(
        "PATCH",
        f"{IMAGE_TABLE}?id=eq.{quote(row_id)}",
        {
            "status": "rejected",
            "moderated_at": now(),
            "moderated_by": moderator(),
            "rejection_reason": reason,
        },
    )

    städa = [(INBOX_BUCKET, row["storage_path"])]

    # Sökvägen i den publika hinken räknas ur published_url och GISSAS INTE ur
    # storage_path. En HEIC byter ändelse när den konverteras vid publicering,
    # alltså heter filen där något annat än originalet, och en gissning hade
    # letat efter en .heic som aldrig funnits och lämnat kvar den .jpg som
    # faktiskt ligger på en publik URL.
    if row.get("published_url"):
        marker = f"/public/{PUBLIC_BUCKET}/"
        url = row["published_url"]
        if marker in url:
            städa.append((PUBLIC_BUCKET, url.split(marker, 1)[1]))
        else:
            print(f"Varning: kunde inte läsa ut sökvägen ur {url}. Ta bort filen för hand.")

    for bucket, path in städa:
        try:
            db.remove_object(bucket, path)
        except Exception as exc:  # noqa: BLE001
            print(f"Varning: filen {path} i {bucket} gick inte att ta bort: {exc}", file=sys.stderr)

    print("Avslaget. Skälet visas för företrädaren, och filen är borttagen.")
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
        elif field == "opening_hours_exceptions":
            show_exceptions(value)
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

    if not claim_ok(db, row):
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

    def bildflagga(p: argparse.ArgumentParser) -> None:
        p.add_argument(
            "--bilder",
            action="store_true",
            help="Gäller verksamhetens egna bilder i stället för uppgifterna.",
        )

    kö = sub.add_parser("kö", aliases=["ko"], help="Visa väntande insändningar.")
    bildflagga(kö)

    show = sub.add_parser("visa", help="Visa en insändning i sin helhet.")
    show.add_argument("id")
    bildflagga(show)

    publish = sub.add_parser("publicera", help="Släpp fram uppgifterna.")
    publish.add_argument("id")
    bildflagga(publish)

    reject = sub.add_parser("avsla", help="Avslå med ett skäl.")
    reject.add_argument("id")
    reject.add_argument("reason")
    bildflagga(reject)

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
    bilder = getattr(args, "bilder", False)
    try:
        if args.command in ("kö", "ko"):
            return cmd_queue(db, IMAGE_TABLE if bilder else TABLE)
        if args.command == "visa":
            return cmd_show_image(db, args.id) if bilder else cmd_show(db, args.id)
        if args.command == "publicera":
            return cmd_publish_image(db, args.id) if bilder else cmd_publish(db, args.id)
        if args.command == "avsla":
            return (
                cmd_reject_image(db, args.id, args.reason)
                if bilder
                else cmd_reject(db, args.id, args.reason)
            )
    except ModerationError as exc:
        print(f"Fel: {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
