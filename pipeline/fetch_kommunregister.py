#!/usr/bin/env python3
"""Bygg registret över landets kontrollmyndigheter, en rad per mottagare.

    python3 pipeline/fetch_kommunregister.py

Registret är kampanjens karta. Det svarar på tre frågor: vem ska ha ett mejl,
hur mycket täckning ger svaret, och vad vet vi redan om hur de publicerar.

## Varför det byggs och inte skrivs

En handskriven lista över 249 myndigheter blir fel samma dag den skrivs, och
ingen upptäcker det. Därför härleds registret ur två källor som redan är
verifierade och som uppdaterar sig själva:

- **Livsmedelsverkets rapport "Sveriges livsmedelskontroll".** En rad per
  kontrollmyndighet med antal anläggningar. Anläggningarna är hela
  prioriteringsordningen: en begäran till Stockholm ger 9 456 verksamheter,
  en till Bjurholm ger 30.
- **Kolada.** Kommunkoder och invånarantal för hela riket.

Det enda som skrivs för hand är det som inte går att härleda: e-postadressen
till mottagaren, om kommunen publicerar något i dag, och myndighetens riktiga
namn där rapportens tabell huggit av det. Den handskrivna delen ligger i
`data/kommunkontakter.csv` och läggs ovanpå. Varje sådan rad bär datum och
källa, för en adress utan källa är en gissning med bättre självförtroende.

## Statuskolumnen, och de tre grupperna

`status` är hur kommunen publicerar i dag, och den avgör om ett mejl över
huvud taget ska skickas:

| Värde | Betyder | Åtgärd |
|---|---|---|
| `inlast` | Vi har redan datan i `site/src/data/` | Inget mejl |
| `oppen_data` | Publicerar per verksamhet, maskinläsbart, ej inläst än | Bygg adapter, mejla inte |
| `sammanfattning` | Publicerar statistik eller listor, inte per kontroll | Mejla |
| `inget` | Publicerar ingenting per verksamhet | Mejla |
| `okand` | Ingen har kollat | Kolla först, mejla sedan |

`okand` är förvalt och det är meningen. En kommun som ingen tittat på ska se
annorlunda ut än en kommun som någon tittat på och funnit tom.

## Kolumnen andel_anlaggningar

Andelen av rikets anläggningar som myndigheten svarar för, i procent med två
decimaler. Summan av kolumnen för de myndigheter som svarat är kampanjens
täckningsmått, och det är ett ärligare mått än antalet kommuner: tolv
kommuner låter lite, men de tolv bär mer av landets verksamheter än de
hundra minsta tillsammans.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from dataclasses import replace
from pathlib import Path
from typing import Dict, List, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko import myndigheter  # noqa: E402
from prikko.myndigheter import ControlAuthority  # noqa: E402
from prikko.sources import kolada  # noqa: E402
from prikko.sources.livsmedelsverket import LATEST, REPORTS, Report, parse  # noqa: E402

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"

#: Kolumnerna i kontaktfilen, som skrivs för hand.
CONTACT_COLUMNS = (
    "myndighet_kod",
    "myndighet",
    "kommunkoder",
    "anlaggningar",
    "mottagare",
    "mottagartyp",
    "registrator",
    "status",
    "verksamhetssystem",
    "kalla",
    "verifierat",
    "anteckning",
)

#: Kolumnerna i registret, som byggs.
REGISTER_COLUMNS = (
    "myndighet_kod",
    "myndighet",
    "kommuner",
    "kommunkoder",
    "anlaggningar",
    "andel_anlaggningar",
    "invanare",
    "status",
    "mottagare",
    "mottagartyp",
    "registrator",
    "verksamhetssystem",
    "kalla",
    "verifierat",
    "anteckning",
)

STATUSES = ("inlast", "oppen_data", "sammanfattning", "inget", "okand")

RECIPIENT_TYPES = ("funktionsbrevlada", "registrator", "etjanst", "okand", "")


class ContactsBroken(RuntimeError):
    """Kontaktfilen pekar på något som inte finns, eller säger något ogiltigt."""


def fetch(url: str) -> bytes:
    import urllib.request

    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=180) as response:
        return response.read()


def read_contacts(path: Path) -> Dict[str, dict]:
    """Den handskrivna delen, nyckel myndighetskod.

    Filen får saknas. Ett tomt register är ett ärligt register: det säger att
    ingen ännu tagit reda på något.
    """
    if not path.exists():
        return {}

    contacts: Dict[str, dict] = {}
    with path.open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            code = (row.get("myndighet_kod") or "").strip()
            if not code:
                continue
            status = (row.get("status") or "").strip()
            if status and status not in STATUSES:
                raise ContactsBroken(
                    f"{path}: {code} har status {status!r}, tillåtna är "
                    f"{', '.join(STATUSES)}"
                )
            kind = (row.get("mottagartyp") or "").strip()
            if kind not in RECIPIENT_TYPES:
                raise ContactsBroken(
                    f"{path}: {code} har mottagartyp {kind!r}, tillåtna är "
                    f"{', '.join(t for t in RECIPIENT_TYPES if t)}"
                )
            if (row.get("mottagare") or "").strip() and not (
                row.get("verifierat") or ""
            ).strip():
                raise ContactsBroken(
                    f"{path}: {code} har en mottagare men inget datum i "
                    f"verifierat. En adress utan verifieringsdatum är en gissning."
                )
            contacts[code] = row
    return contacts


def apply_contacts(
    built: List[ControlAuthority], contacts: Dict[str, dict], path: Path
) -> List[ControlAuthority]:
    """Låt verifierad medlemskrets gå före rapportens.

    Rapportens tabell hugger av långa myndighetsnamn, och när namnet huggs av
    försvinner en medlemskommun med det. Klippan är det kända fallet: kommunen
    finns i ingen rad. Rättelsen görs genom att skriva myndighetens kommunkoder
    i kontaktfilen, och den handskrivna kretsen vinner då över den lästa.

    Ett verifierat medlemskap tar kommunen från den myndighet rapporten råkade
    lägga den hos. Två handskrivna rader som gör anspråk på samma kommun är
    däremot ett fel någon måste avgöra, inte något som får avgöras av
    radordningen i en fil.
    """
    claimed: Dict[str, str] = {}
    for code, row in sorted(contacts.items()):
        for municipality in (row.get("kommunkoder") or "").replace(" ", "").split(";"):
            if not municipality:
                continue
            if municipality in claimed:
                raise ContactsBroken(
                    f"{path}: kommun {municipality} står på både {claimed[municipality]} "
                    f"och {code}. En kommun har en kontrollmyndighet."
                )
            claimed[municipality] = code

    # Medlemskretsen som den stod i rapporten, sparad innan något trimmas.
    # Jämförelsen mot den avgör om rapportens anläggningstal fortfarande hör
    # till myndigheten, och den frågan går inte att ställa efteråt.
    by_key = {a.key: set(a.municipalities) for a in built}
    result: List[ControlAuthority] = []
    for authority in built:
        keep = tuple(
            code
            for code in authority.municipalities
            if claimed.get(code, authority.key) == authority.key
        )
        if keep:
            result.append(replace(authority, municipalities=keep))

    for code, row in sorted(contacts.items()):
        members = tuple(
            sorted(
                m
                for m in (row.get("kommunkoder") or "").replace(" ", "").split(";")
                if m
            )
        )
        if not members:
            if code not in by_key:
                raise ContactsBroken(
                    f"{path}: {code} finns inte i rapporten. Skriv myndighetens "
                    f"kommunkoder i kolumnen kommunkoder om raden ska skapa en "
                    f"egen myndighet."
                )
            continue
        stated = (row.get("anlaggningar") or "").strip()
        existing = next((a for a in result if a.key == code), None)
        if existing:
            # En ändrad medlemskrets gör rapportens tal fel. Ett kommunalförbund
            # som upplösts lämnar efter sig tre myndigheter, och förbundets
            # anläggningar hör inte till någon av dem ensam. Talet nollställs
            # hellre än att en kommun tillskrivs andras verksamheter.
            changed = by_key.get(code, set(existing.municipalities)) != set(members)
            facilities = int(stated) if stated else (
                None if changed else existing.facilities
            )
            result[result.index(existing)] = replace(
                existing, municipalities=members, facilities=facilities
            )
        else:
            result.append(
                ControlAuthority(
                    key=code,
                    name=(row.get("myndighet") or code),
                    municipalities=members,
                    facilities=int(stated) if stated else None,
                )
            )

    return sorted(result, key=lambda a: a.key)


def loaded_municipalities(data_dir: Path) -> List[str]:
    """Kommunkoderna sajten redan publicerar, ur kommunernas egna filer.

    Samma regel som `fetch_kommunkallor.py`: ingen lista i kod. En ny kommun
    som får en datafil försvinner ur mejlkampanjen utan att något annat ändras.
    """
    codes = []
    for path in sorted(data_dir.glob("*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        municipality = payload.get("municipality")
        if municipality and isinstance(payload.get("establishments"), list):
            codes.append(municipality["code"])
    return codes


def build(
    report: Report,
    data_dir: Path,
    contacts_path: Path,
    local_report: Optional[Path] = None,
) -> tuple:
    document = local_report.read_bytes() if local_report else fetch(report.url)
    authorities = parse(document, report)

    kolada.verify(kolada.POPULATION)
    population = kolada.latest(kolada.POPULATION, report.year + 2)
    payload = kolada._get("municipality", per_page=400)
    codes = {m["title"]: m["id"] for m in payload["values"] if m.get("type") == "K"}
    names = {code: name for name, code in codes.items()}

    built, _ = myndigheter.build(authorities.values(), codes)
    contacts = read_contacts(contacts_path)
    built = apply_contacts(built, contacts, contacts_path)

    covered = {code for a in built for code in a.municipalities}
    unmatched = sorted(set(codes.values()) - covered)

    loaded = set(loaded_municipalities(data_dir))
    total = sum(a.facilities or 0 for a in built)

    rows = []
    for authority in sorted(built, key=lambda a: (-(a.facilities or 0), a.key)):
        contact = contacts.get(authority.key, {})
        status = (contact.get("status") or "").strip() or "okand"
        if set(authority.municipalities) <= loaded:
            status = "inlast"
        share = (
            round(100 * authority.facilities / total, 2)
            if authority.facilities and total
            else ""
        )
        residents = sum(
            round(population.values[code])
            for code in authority.municipalities
            if code in population.values
        )
        rows.append(
            {
                "myndighet_kod": authority.key,
                "myndighet": (contact.get("myndighet") or "").strip() or authority.name,
                "kommuner": ";".join(
                    names[code] for code in authority.municipalities if code in names
                ),
                "kommunkoder": ";".join(authority.municipalities),
                "anlaggningar": authority.facilities if authority.facilities else "",
                "andel_anlaggningar": share,
                "invanare": residents or "",
                "status": status,
                "mottagare": (contact.get("mottagare") or "").strip(),
                "mottagartyp": (contact.get("mottagartyp") or "").strip() or "okand",
                "registrator": (contact.get("registrator") or "").strip(),
                "verksamhetssystem": (contact.get("verksamhetssystem") or "").strip(),
                "kalla": (contact.get("kalla") or "").strip(),
                "verifierat": (contact.get("verifierat") or "").strip(),
                "anteckning": (contact.get("anteckning") or "").strip(),
            }
        )

    return rows, [names.get(code, code) for code in unmatched]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, default=LATEST,
                        help=f"kontrollår, en av {sorted(REPORTS)}")
    parser.add_argument("--data", type=Path, default=Path("site/src/data"),
                        help="katalogen med kommunernas datafiler")
    parser.add_argument("--kontakter", type=Path,
                        default=Path("pipeline/data/kommunkontakter.csv"))
    parser.add_argument("--out", type=Path,
                        default=Path("pipeline/data/kommunregister.csv"))
    parser.add_argument("--rapport", type=Path,
                        help="läs rapporten från en lokal PDF i stället för att "
                             "hämta den, för när registret byggs om ofta")
    args = parser.parse_args()

    if args.year not in REPORTS:
        parser.error(f"ingen rapport för {args.year}, har {sorted(REPORTS)}")

    rows, unmatched = build(REPORTS[args.year], args.data, args.kontakter,
                            args.rapport)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=REGISTER_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)

    counts = {status: 0 for status in STATUSES}
    for row in rows:
        counts[row["status"]] += 1
    summary = ", ".join(f"{counts[s]} {s}" for s in STATUSES if counts[s])
    print(
        f"Skrev {len(rows)} kontrollmyndigheter till {args.out} ({summary}).",
        file=sys.stderr,
    )
    if unmatched:
        print(
            f"Utan myndighet i rapporten: {', '.join(unmatched)}. Raden är "
            f"avhuggen i PDF:en, myndigheten måste hittas för hand och skrivas "
            f"in i {args.kontakter}.",
            file=sys.stderr,
        )


if __name__ == "__main__":
    main()
