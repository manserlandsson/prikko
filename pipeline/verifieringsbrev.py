#!/usr/bin/env python3
"""Brevkod till verksamhetens adress: mint en kod, skriv ut brevet.

Verksamhetsställets adress är den enda kontaktväg vi har till ett företag. Vi
lagrar varken telefon, e-post eller webbplats. Ett brev bevisar att någon
hämtar posten på adressen, vilket är samma sak som Googles vykod bevisar.

Kommandon:

    set -a && . ~/.prikko-env && set +a
    python3 pipeline/verifieringsbrev.py kö
    python3 pipeline/verifieringsbrev.py skriv <anspråks-id> [--dagar 30]

`skriv` gör tre saker: skapar en kod, sparar BARA sha256 av den, och skriver
ut brevet på skärmen. Koden finns i klartext exakt en gång, i den utskriften.
Tappar du bort den finns ingen väg tillbaka, och det är avsikten: kan vi läsa
ut koden ur databasen kan den som får tag i databasen ta över en verksamhet.

VAD SKRIPTET INTE GÖR: skickar brevet. Det steget kräver ett konto hos en
brevtjänst, se docs/21. Ekopost tar 15,60 kr ex moms per brev, har REST-API,
ingen bindningstid och en gratis testmiljö. Fram till dess klipper man ut
texten nedan och postar den för hand, vilket går utmärkt för de första.

Företrädaren löser in koden på /konto/verksamhet/. Inlösen sker med
community.redeem_letter_code(), som är den enda vägen ett anspråk kan bli
godkänt utan att en människa i redaktionen rör det.
"""

from __future__ import annotations

import argparse
import os
import secrets
import sys
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from urllib.parse import quote

from moderate import ModerationError, Supabase

# Utan 0, O, 1, I och L. Den som läser en kod ur ett brev ska inte behöva
# gissa vilket tecken som är vilket.
ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
CODE_LENGTH = 6


def mint() -> str:
    return "".join(secrets.choice(ALPHABET) for _ in range(CODE_LENGTH))


def digest(code: str) -> str:
    return sha256(code.strip().upper().encode("utf-8")).hexdigest()


def cmd_queue(db: Supabase) -> int:
    """Väntande ansökningar, med markering för dem som redan fått brev."""
    claims = db.community(
        "GET",
        "establishment_claims?status=eq.pending"
        "&select=id,establishment_id,establishment_name,municipality_slug,"
        "claimant_name,claimant_role,organization_number,created_at"
        "&order=created_at.asc",
    )
    if not claims:
        print("Inga ansökningar väntar.")
        return 0

    sent = db.community(
        "GET", "verification_letters?select=claim_id,sent_at,expires_at,redeemed_at"
    )
    by_claim: dict[str, dict] = {}
    for letter in sent:
        by_claim.setdefault(letter["claim_id"], letter)

    print(f"{len(claims)} ansökning(ar) väntar:\n")
    for claim in claims:
        letter = by_claim.get(claim["id"])
        mark = "brev skickat" if letter else "inget brev"
        print(f"  {claim['id']}  {mark}")
        print(
            f"      {claim['establishment_name']} ({claim['municipality_slug']}), "
            f"org.nr {claim.get('organization_number')}"
        )
        print(f"      söker: {claim['claimant_name']}, {claim['claimant_role']}")
    print("\nSkriv ett brev med:  python3 pipeline/verifieringsbrev.py skriv <id>")
    return 0


def address_for(db: Supabase, establishment_id: str) -> tuple[str, str]:
    """Namn och postadress ur den redaktionella databasen."""
    rows = db.public(
        "GET",
        f"establishments?id=eq.{quote(establishment_id)}"
        "&select=name,street_address,postal_code,locality&limit=1",
    )
    if not rows:
        raise ModerationError(f"Ingen verksamhet med id {establishment_id}.")

    row = rows[0]
    if not row.get("street_address"):
        raise ModerationError(
            "Verksamheten saknar gatuadress i datan. Brev går inte att skicka; "
            "gör en registerkontroll i stället."
        )

    postal = " ".join(
        part for part in (row.get("postal_code"), row.get("locality")) if part
    )
    return row["name"], f"{row['street_address']}\n{postal}".strip()


def cmd_write(db: Supabase, claim_id: str, days: int) -> int:
    claims = db.community(
        "GET",
        f"establishment_claims?id=eq.{quote(claim_id)}"
        "&select=id,establishment_id,establishment_name,claimant_name,status&limit=1",
    )
    if not claims:
        raise ModerationError(f"Ingen ansökan med id {claim_id}.")

    claim = claims[0]
    if claim["status"] != "pending":
        raise ModerationError(
            f"Ansökan har status {claim['status']}. Bara väntande ska få brev."
        )

    name, postal_address = address_for(db, claim["establishment_id"])

    # Ett obrukat brev åt gången. Två koder i omlopp betyder att den som får
    # det andra brevet inte kan lösa in det, och att ingen förstår varför.
    existing = db.community(
        "GET",
        f"verification_letters?claim_id=eq.{quote(claim_id)}"
        "&redeemed_at=is.null&select=id,expires_at",
    )
    if existing:
        raise ModerationError(
            f"Det finns redan ett obrukat brev för ansökan, giltigt till "
            f"{existing[0]['expires_at']}. Ta bort det först om du vill skriva ett nytt."
        )

    code = mint()
    expires = datetime.now(timezone.utc) + timedelta(days=days)

    db.community(
        "POST",
        "verification_letters",
        {
            "claim_id": claim_id,
            "code_hash": digest(code),
            "sent_to": postal_address,
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": expires.isoformat(),
        },
    )

    line = "-" * 62
    print(line)
    print(f"{name}")
    print(postal_address)
    print()
    print("Någon har ansökt om att företräda er verksamhet på Prikko.")
    print()
    print(f"    Koden är:  {code}")
    print()
    print("Logga in på prikko.se, gå till er verksamhet och välj")
    print('"Driver du verksamheten?". Skriv in koden där.')
    print()
    print(f"Koden gäller till {expires.strftime('%-d %B %Y')}.")
    print()
    print("Var det inte ni som ansökte behöver ni inte göra någonting.")
    print("Utan koden händer ingenting.")
    print()
    print("Prikko")
    print(line)
    print()
    print("Koden är sparad som sha256 och går inte att läsa ut ur databasen.")
    print("Skickar du inte brevet nu, anteckna koden eller ta bort raden.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Brevkod till verksamhetens adress.")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("kö", aliases=["ko"], help="Väntande ansökningar.")

    write = sub.add_parser("skriv", help="Skapa en kod och skriv ut brevet.")
    write.add_argument("id")
    write.add_argument("--dagar", type=int, default=30, help="Giltighetstid, förval 30.")

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
        if args.command == "skriv":
            return cmd_write(db, args.id, args.dagar)
    except ModerationError as exc:
        print(f"Fel: {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
