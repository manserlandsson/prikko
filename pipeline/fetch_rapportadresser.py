#!/usr/bin/env python3
"""Läs ut gatuadresserna ur Höganäs kommuns kontrollrapporter.

    python3 pipeline/fetch_rapportadresser.py

Skriver pipeline/rapportadresser.json, som pipeline/geocode.py sedan läser
för de verksamheter vars egen adressrad saknar husnummer:

    python3 pipeline/geocode.py site/src/data/hoganas.json

VARFÖR STEGET FINNS
-------------------
Höganäs listsida bär namn, ort, datum och färg i filnamnet, men ingen
gatuadress. Alla 316 verksamheter stod därför utan kartnål. Adressen finns
ändå: den står inuti rapporten, och kommunen skriver ut den som en utsaga om
var den kontrollerade verksamheten ligger. Se prikko/rapportadress.py för
vilken av rapportens två adresser som får läsas och varför bara den ena.

Det här är ett SIDOSPÅR till prikko/sources/hoganas.py, inte en ändring av
den. Inläsaren fortsätter läsa listsidan och bara den, och `address` i
site/src/data/hoganas.json fortsätter bära orten. Den här filen tillför en
adress att GEOKODA mot, och rör inte vad sidan skriver ut.

KOSTNADEN, OCH VARFÖR DEN BARA TAS EN GÅNG
------------------------------------------
343 rapporter, omkring 280 kB var. Att hämta dem varje natt vore oförskämt
mot en kommunwebbplats för en uppgift som aldrig ändras: en publicerad
rapport skrivs inte om. Därför cachas varje PDF på sin URL under
pipeline/data/interim/, som ligger utanför versionshanteringen, och en körning
hämtar bara rapporter den inte sett förut. Resultatfilen är liten och
versionshanteras, så ett bygge behöver aldrig röra kommunens webbplats.

IDENTITETEN KOMMER UR FILNAMNET, ALDRIG UR RAPPORTEN
----------------------------------------------------
Rapportens egen namnrad skiljer sig från filnamnets: `Shakespeare` i
filnamnet är `Shakespeare restaurang` inne i rapporten, och
`Peter Lunds förskola` är `Peter Lundhs förskola kök`. Verksamhetens id
räknas därför fram med sources/hoganas.local_id ur FILNAMNET, precis som
inläsaren gör. Då kan de två aldrig glida isär, och adressen hamnar på rätt
verksamhet för att den räknats fram på samma sätt, inte för att två strängar
råkade likna varandra.

FLERA RAPPORTER PER VERKSAMHET
------------------------------
19 verksamheter har mer än en rapport. Den NYASTE som bär en adress vinner:
en verksamhet kan ha flyttat, och den äldre adressen är då fel. Bär flera
rapporter olika adresser noteras det i utdatan som `conflicting`, så att en
tyst omflyttning går att upptäcka i stället för att bara skrivas över.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko.rapportadress import read_premises  # noqa: E402
from prikko.sources import hoganas  # noqa: E402
from prikko.sources.hoganas import UnknownSourceValue  # noqa: E402

ROOT = Path(__file__).resolve().parent
CACHE_DIR = ROOT / "data" / "interim" / "hoganas_rapporter"
OUTPUT = ROOT / "rapportadresser.json"

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"

#: Paus mellan två hämtningar från kommunens webbplats. Vi hämtar hundratals
#: filer från en server som inte är byggd för det, och en halv sekund kostar
#: oss tre minuter en enda gång.
DELAY_S = 0.5

NOTE = (
    "Gatuadresser utlästa ur Höganäs kommuns egna kontrollrapporter, för de "
    "verksamheter vars listrad saknar adress. Läses av pipeline/geocode.py "
    "och används BARA för att slå upp en koordinat, aldrig som text på "
    "sidan. Nyckel: verksamhetens id. Regenereras med "
    "pipeline/fetch_rapportadresser.py."
)

PROVENANCE = {
    "source": "Höganäs kommun, kontrollrapporter (PDF)",
    "sourceUrl": hoganas.SOURCE_URL,
    "attribution": "Höganäs kommun",
    "note": (
        "Kontrollrapporterna är allmänna handlingar som kommunen själv "
        "publicerar öppet. Adressen är kommunens egen uppgift om var den "
        "kontrollerade verksamheten ligger."
    ),
}


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=120) as response:
        return response.read()


def cached_report(url: str) -> Optional[bytes]:
    """Rapportens PDF, från disk när den redan hämtats.

    Cachefilen döps efter URL:ens hash och inte efter rapportens namn:
    filnamnen bär kommatecken, snedstreck och citattecken, och en av dem
    heter `Chicken Joe´s, Mölle, 2023-06-29, grön.pdf`.
    """
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path = CACHE_DIR / f"{hashlib.sha1(url.encode('utf-8')).hexdigest()[:16]}.pdf"
    if path.exists():
        return path.read_bytes()
    try:
        payload = fetch(url)
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
        print(f"  kunde inte hämta {url}: {exc}", file=sys.stderr)
        return None
    path.write_bytes(payload)
    time.sleep(DELAY_S)
    return payload


def listing() -> list:
    """Alla (url, filnamn, kategori) ur kommunens tre mappar."""
    out = []
    for folder, category in hoganas.FOLDERS.items():
        markup = fetch(hoganas.folder_url(folder)).decode("utf-8", "replace")
        # Samma spärr som inläsaren: ändras läsanvisningen har sidan gjorts
        # om, och då ska vi stanna i stället för att tolka en ny form.
        hoganas.check_legend(markup)
        for url, filename in hoganas.parse_listing(markup):
            out.append((url, filename, category))
    return out


def collect(limit: Optional[int]) -> tuple:
    """Bygg {verksamhets-id: adressuppgift} ur rapporterna."""
    reports = listing()
    if limit:
        reports = reports[:limit]
    print(f"{len(reports)} rapporter i kommunens tre mappar", file=sys.stderr)

    entries: Dict[str, dict] = {}
    stats: Counter = Counter()

    for index, (url, filename, _) in enumerate(reports, 1):
        if index % 25 == 0:
            print(f"  {index}/{len(reports)}", file=sys.stderr)
        try:
            report = hoganas.parse_report(url, filename)
        except UnknownSourceValue:
            # Filnamnet går inte att tolka. Inläsaren hoppar över samma
            # rapport, så verksamheten finns inte i datafilen heller.
            stats["filnamn_olasbart"] += 1
            continue

        document = cached_report(url)
        if document is None:
            stats["hamtning_misslyckades"] += 1
            continue

        premises = read_premises(document)
        if premises is None:
            stats["ingen_adress_i_rapporten"] += 1
            continue
        stats["adress_utlast"] += 1

        key = f"F-{hoganas.MUNICIPALITY_CODE}-{hoganas.local_id(report)}"
        current = entries.get(key)
        record = {
            "address": premises.street_address,
            "postalCode": premises.postal_code,
            "locality": premises.locality,
            "property": premises.property_designation,
            "reportUrl": url,
            "reportDate": report.inspected_at.isoformat(),
        }
        if current is None:
            entries[key] = record
            continue

        # Nyast vinner. Se modulens inledning.
        conflict = current["address"].casefold() != record["address"].casefold()
        if record["reportDate"] > current["reportDate"]:
            record["conflicting"] = current["address"] if conflict else None
            entries[key] = record
        elif conflict:
            current["conflicting"] = record["address"]
        if conflict:
            stats["olika_adress_i_tva_rapporter"] += 1

    for key in entries:
        if entries[key].get("conflicting") is None:
            entries[key].pop("conflicting", None)
    return entries, stats


def write(entries: Dict[str, dict]) -> None:
    payload = {
        "note": NOTE,
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "municipalities": {
            hoganas.MUNICIPALITY_CODE: {
                **PROVENANCE,
                "entries": dict(sorted(entries.items())),
            }
        },
    }
    OUTPUT.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--limit", type=int, help="läs bara de N första rapporterna, för prov"
    )
    args = parser.parse_args()

    entries, stats = collect(args.limit)
    write(entries)

    print(f"\n{len(entries)} verksamheter fick en adress", file=sys.stderr)
    for reason, count in sorted(stats.items()):
        print(f"  {reason}: {count}", file=sys.stderr)
    print(f"Skrev {OUTPUT}", file=sys.stderr)


if __name__ == "__main__":
    main()
