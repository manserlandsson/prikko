#!/usr/bin/env python3
"""Hämta Uppsalas livsmedelskontroller.

Två steg: bläddra listan (10 per sida) för att få alla verksamheter, hämta
sedan varje detaljsida för full kontrollhistorik.

    python3 pipeline/fetch_uppsala.py --out site/src/data/uppsala.json

    --arkiv <katalog>   återanvänd detaljsidor vars listrad står oförändrad

Kör snällt: paus mellan anropen och tydlig user agent.

## VARFÖR ARKIVET FINNS, OCH VAD LISTRADEN DUGER TILL

Uppsala var nattjobbets dyraste post: 32 av 127 jobbminuter, alltså 960 av
3 810 i månaden mot ett tak på 2 000. Kostnaden är 1 836 detaljsidor à 106 kB
plus 187 listsidor, och den ligger i antalet anrop och i antalet byte.

Tre vägar mättes 2026-09-28, och två av dem föll:

* VILLKORADE ANROP. Detaljsidan svarar `Cache-Control: private` och sätter
  varken `ETag` eller `Last-Modified`. Det finns alltså inget villkor att
  skicka, och servern kan inte svara 304.
* PACKNING. Samma sida är 106 649 B både med och utan `Accept-Encoding:
  gzip`. Servern packar inte.
* PARALLELLITET. Servern når ett tak vid omkring 3 svar i sekunden oavsett
  hur många arbetare som frågar: 25 sidor tog 13,6 s seriellt, 9,7 s med tre
  arbetare, 8,4 s med fem och 9,5 s med åtta. Fem arbetare ger alltså 1,6
  gånger och inte fem.

Den fjärde vägen bär, och den kostar inga extra anrop alls: LISTRADEN SÄGER
REDAN VAD SOM HÄNT. Varje `<li>` i listan bär verksamhetens namn, dess adress,
`Senaste omdöme` och `Senaste kontroll` med datum. Står hela raden oförändrad
sedan i går har ingen ny kontroll tillkommit, omdömet är detsamma och namnet
likaså. Då läses gårdagens detaljsida ur arkivet i stället för att hämtas om.

Nyckeln är HELA listraden och inte det vi råkar tolka ur den. Ändras något
alls i markupen, även något vi i dag inte läser, räknas raden som ny och
sidan hämtas. Hittas ingen listrad för ett id hämtas sidan också. Arkivet kan
alltså bara göra hämtningen billigare, aldrig datan äldre än listan medger.

Uppmätt takt över tjugo nattliga incheckningar 4 till 22 september 2026: 21,3
av 1 836 verksamheter ändrade sig per natt, alltså 1,16 procent, plus 12,4 nya.

## GOLVET, FÖR DET LISTRADEN INTE VISAR

Listraden visar den SENASTE kontrollen. En rättelse i en äldre kontrolls
avvikelsepunkter, eller ett diarienummer som fylls i i efterhand, syns därför
inte i den. För att ingen verksamhet ska kunna stå kvar hur länge som helst
på en gammal detaljsida hämtas dessutom en sjundedel av beståndet varje natt,
valt på verksamhetens eget id så att var och en kommer i tur exakt en gång på
GOLV_DAGAR nätter. Ingen detaljsida kan alltså bli äldre än en vecka, oavsett
vad listan säger.

Nattens nota blir då 187 listsidor plus omkring 300 detaljsidor i stället för
2 023 anrop, alltså under en fjärdedel så många.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import date, datetime
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko.grading import Area, Inspection, assess  # noqa: E402
from prikko.natverk import Arkiv, anslut_arkiv  # noqa: E402
from prikko.sources.uppsala import (  # noqa: E402
    BASE,
    MUNICIPALITY_CITY,
    MUNICIPALITY_CODE,
    MUNICIPALITY_NAME,
    PER_PAGE,
    UnknownSourceValue,
    normalize_establishment,
    normalize_inspections,
    parse_list_page,
    total_hits,
)
from prikko.text import dedupe_slugs, slugify  # noqa: E402

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"
POLITE_DELAY_S = 0.3

#: Så ofta hämtas en detaljsida om även när listraden står stilla. En sjundedel
#: av 1 836 verksamheter är 262 sidor per natt, alltså under en tiondel av
#: dagens 2 020 anrop, och ingen sida kan bli mer än sex dygn gammal.
GOLV_DAGAR = 7

#: Listans `<li>`-block, ett per verksamhet. REGELN ÄR MEDVETET DEN SAMMA SOM
#: i prikko/sources/uppsala.py, men den används till något annat: här delas
#: markupen i bitar som ska HASHAS, inte tolkas. Slutar de två följas åt hittas
#: ingen rad för ett id, och då hämtas sidan, vilket är dagens beteende.
LISTRAD = re.compile(r'<li class="inspection[a-z-]*">.*?</li>', re.S)
LISTRAD_ID = re.compile(r"Details\?id=(-?\d+)")


def get(url: str) -> str:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "X-Requested-With": "XMLHttpRequest"},
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        return response.read().decode("utf-8", "replace")


def listrader(markup: str) -> dict:
    """id → verksamhetens hela listrad, rå."""
    ut = {}
    for block in LISTRAD.findall(markup):
        ident = LISTRAD_ID.search(block)
        if ident:
            ut[ident.group(1)] = block
    return ut


def collect_list() -> tuple:
    """Bläddra igenom hela listan. Returnerar (poster, listrad per id)."""
    first = get(f"{BASE}/?ajax=1&query=&page=1")
    total = total_hits(first) or 0
    pages = max(1, -(-total // PER_PAGE))
    print(f"Uppsala: {total} verksamheter på {pages} sidor", file=sys.stderr)

    records = parse_list_page(first)
    rader = listrader(first)
    for page in range(2, pages + 1):
        try:
            markup = get(f"{BASE}/?ajax=1&query=&page={page}")
        except (urllib.error.URLError, TimeoutError) as exc:
            print(f"  ! sida {page}: {exc}", file=sys.stderr)
        else:
            records += parse_list_page(markup)
            rader.update(listrader(markup))
        time.sleep(POLITE_DELAY_S)
        if page % 25 == 0:
            print(f"  sida {page}/{pages} · {len(records)} poster", file=sys.stderr)

    # Samma verksamhet kan dyka upp på flera sidor om listan ändras under tiden.
    seen, unique = set(), []
    for r in records:
        if r["id"] not in seen:
            seen.add(r["id"])
            unique.append(r)
    return unique, rader


def i_tur(record_id: str, today: date) -> bool:
    """Är den här verksamheten på tur för nattens golvhämtning?

    Rest på id mot rest på dagnumret, alltså en fast sjundedel per natt och
    varje verksamhet exakt en gång per GOLV_DAGAR nätter. Att välja på id och
    inte slumpmässigt gör natten förutsägbar och gör att två körningar samma
    dygn hämtar samma sidor.
    """
    try:
        tal = int(record_id)
    except ValueError:
        # Ett id som inte är ett tal har vi aldrig sett. Hämta hellre än att
        # gissa vilken sjundedel det tillhör.
        return True
    return tal % GOLV_DAGAR == today.toordinal() % GOLV_DAGAR


def build(limit: Optional[int], today: date, arkiv_rot: Optional[Path]) -> dict:
    listing, rader = collect_list()
    if limit:
        listing = listing[:limit]

    arkiv = Arkiv(arkiv_rot, "uppsala")
    records, skipped = [], 0
    golvade = 0

    for index, record in enumerate(listing, 1):
        # Nyckeln är verksamhetens HELA listrad, alltså allt kommunen visar om
        # den i listan: namn, adress, senaste omdöme och senaste kontrolldatum.
        # Saknas raden finns ingen nyckel, och då hämtas sidan.
        rad = rader.get(record["id"])
        nyckel = None if rad is None else f"{record['id']}\0{rad}"

        # Golvet går FÖRE arkivet: den här natten hämtas sidan även om raden
        # står stilla. Se GOLV_DAGAR.
        golv = i_tur(record["id"], today)

        detail = None
        if nyckel is not None and not golv:
            lagrat = arkiv.las(nyckel)
            if lagrat is not None:
                detail = lagrat.decode("utf-8", "replace")

        if detail is None:
            if golv:
                golvade += 1
            try:
                detail = get(f"{BASE}/Details?id={record['id']}")
            except (urllib.error.URLError, TimeoutError) as exc:
                print(f"  ! {record['id']}: {exc}", file=sys.stderr)
                skipped += 1
                continue
            finally:
                time.sleep(POLITE_DELAY_S)
            # Skrivs ÄVEN på en golvnatt. Annars vore sidan hämtad men inte
            # sparad, och i morgon hade den hämtats en gång till.
            if nyckel is not None:
                arkiv.skriv(nyckel, detail.encode("utf-8"))

        try:
            establishment = normalize_establishment(record, detail)
            inspections = normalize_inspections(
                detail, establishment.id_national, record["id"]
            )
        except UnknownSourceValue as exc:
            print(f"  ! hoppar över: {exc}", file=sys.stderr)
            skipped += 1
            continue

        result = assess(
            [
                Inspection(
                    id_national=i.id_national,
                    inspected_at=i.inspected_at,
                    assessment=i.assessment,
                    type=i.type,
                    # Sedan modellversion 4: rent administrativa avvikelser
                    # ska inte skärpa bedömningen, så punkterna följer med.
                    areas=tuple(
                        Area(a.code, a.group, a.description, a.status)
                        for a in i.areas
                    ),
                )
                for i in inspections
            ],
            today,
        )

        records.append(
            {
                "id": establishment.id_national,
                "slug": slugify(establishment.name),
                "name": establishment.name,
                "address": establishment.street_address,
                "types": establishment.types,
                "lat": None,
                "lng": None,
                "image": None,
                "verdict": result.verdict,
                "distinction": result.distinction,
                "reason": result.reason,
                "modelVersion": result.model_version,
                "uncertain": False,
                "inspections": [
                    {
                        "id": i.id_national,
                        "date": i.inspected_at.isoformat(),
                        "assessment": i.assessment,
                        "type": i.type,
                        "prenotified": i.prenotified,
                        "audit": i.audit,
                        "onSite": i.on_site,
                        "areas": [
                            {
                                "code": a.code,
                                "group": a.group,
                                "description": a.description,
                                "status": a.status,
                            }
                            for a in i.areas
                        ],
                        # Diarienumret besökaren behöver för att begära ut
                        # kontrollrapporten. Se uppsala.py.
                        "caseNumber": i.case_number,
                    }
                    for i in sorted(inspections, key=lambda x: x.inspected_at, reverse=True)
                ],
            }
        )

        if index % 100 == 0:
            print(f"  {index}/{len(listing)}", file=sys.stderr)

    dedupe_slugs(records)

    hamtade = arkiv.missar + golvade
    print(
        f"  detaljsidor: {arkiv.traffar} ur arkivet, {hamtade} hämtade "
        f"({golvade} på golvet var {GOLV_DAGAR}:e natt, "
        f"{arkiv.missar} för att listraden ändrats eller saknats)",
        file=sys.stderr,
    )
    # SIST och bara när HELA beståndet gåtts igenom. En körning med --limit
    # har sett en bråkdel av listan, och gallrade den hade den kastat resten
    # av arkivet på en handkörning.
    if not limit:
        borttagna = arkiv.gallra()
        if borttagna:
            print(f"  arkivet gallrades på {borttagna} inaktuella sidor", file=sys.stderr)

    return {
        "municipality": {
            "code": MUNICIPALITY_CODE,
            "name": MUNICIPALITY_NAME,
            "city": MUNICIPALITY_CITY,
            "slug": "uppsala",
            "sourceType": "reverse_engineered",
            "adapter": "uppsala",
        },
        "source": {"url": BASE, "fetchedAt": datetime.now().isoformat(timespec="seconds")},
        "skipped": skipped,
        "establishments": records,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--out", type=Path, required=True)
    anslut_arkiv(parser)
    args = parser.parse_args()

    data = build(args.limit, date.today(), args.arkiv)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")

    total = len(data["establishments"])
    assessed = sum(1 for e in data["establishments"] if e["verdict"])
    print(
        f"\nSkrev {total} anläggningar till {args.out} "
        f"({assessed} med bedömning, {data['skipped']} överhoppade)",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
