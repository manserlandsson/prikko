#!/usr/bin/env python3
"""Hämta Örebros livsmedelskontroller.

Dyraste källan hittills: ett anrop för listan, ett per verksamhet för
historiken och ett per kontroll för punkterna — cirka 9 000 totalt.

    python3 pipeline/fetch_orebro.py --out site/src/data/orebro.json

    --arkiv <katalog>   återanvänd punkterna för kontroller äldre än
                        FARSKT_FONSTER_DAGAR, som inte kan ändras längre

Kör snällt. Anropen görs med en handfull parallella arbetare i stället för
alla på en gång, med paus mellan varje och tydlig user agent. Vi lever på att
kommunerna fortsätter tycka om oss, och 9 000 anrop är tillräckligt mycket
för att någon ska märka hur de kom in.

## VAD ARKIVET TAR BORT UR NOTAN

Jobbet kostade 15 av nattens 127 minuter i september 2026, fördelat på 1 233
verksamhetssidor och 5 479 anrop om kontrollpunkter. Punkterna är det stora
antalet, och de hör till kontroller som redan är avslutade och publicerade.

Mätt i beståndet 2026-09-28: noll av 5 479 kontroller är yngre än 30 dagar,
vilket är kommunens egen karenstid, 98 stycken är yngre än 90 dagar och
5 381 är äldre. Arkivet tar alltså bort 98 procent av punktanropen, medan
allt inom det färska fönstret hämtas varje natt.

Verksamhetssidan hämtas ALLTID. Det är den som säger vilka kontroller som
finns, och den svarar dessutom `Cache-Control: no-cache, no-store`. Däremot
begär `prikko/natverk.py` sedan 2026-09-28 packade svar, och sidan krymper
då från 88 879 till 21 498 byte, mätt på samma adress samma dag. Det är
jobbets tyngsta post i byte räknat, och löparen står i Azure medan källan
står i Sverige.
"""

from __future__ import annotations

import argparse
import json
import sys
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko.grading import Area, Inspection, assess  # noqa: E402
from prikko.sources.orebro import (  # noqa: E402
    MUNICIPALITY_CITY,
    MUNICIPALITY_CODE,
    MUNICIPALITY_NAME,
    SEARCH_URL,
    SOURCE_URL,
    UnknownSourceValue,
    facility_url,
    merge_duplicates,
    normalize_establishment,
    normalize_inspection,
    parse_history,
    reports_url,
    under_embargo,
)
from prikko.text import dedupe_slugs, slugify  # noqa: E402
from prikko.natverk import Arkiv, anslut_arkiv, oppna  # noqa: E402  kakburk, se modulen

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"
POLITE_DELAY_S = 0.15
WORKERS = 5
ATTEMPTS = 4

#: En kontrolls punkter hämtas varje natt så länge kontrollen är yngre än så,
#: och läses ur arkivet när den är äldre.
#:
#: Kommunen håller inne resultatet i 30 dagar medan verksamheten yttrar sig,
#: se EMBARGO_DAYS i prikko/sources/orebro.py, alltså är en kontroll vi alls
#: får läsa redan minst en månad gammal. Nittio dagar ger två månader till
#: efter det, vilket räcker för en rättelse som kommunen gör i efterhand.
#:
#: Priset för varje extra dag är mätt: av 5 479 kontroller i beståndet
#: 2026-09-28 är 0 yngre än 30 dagar, 65 yngre än 60, 98 yngre än 90 och 366
#: yngre än 180. Fönstret kan alltså fördubblas för 268 anrop till, och en
#: misstanke om att kommunen ändrar äldre punkter är värd den kostnaden.
FARSKT_FONSTER_DAGAR = 90

_progress = threading.Lock()
_done = 0

#: Så många verksamheter får falla på ett oväntat fel innan hela hämtningen
#: avbryts. Normalläget är NOLL: två lyckade nätter i september 2026 hade noll
#: sådana felrader av 1 231 verksamheter.
#:
#: Talet är satt lika med MAX_MISSING_ROWS i load_supabase.py, och det är hela
#: poängen. Förut fångade collect_facility varje fel och hoppade tyst över
#: verksamheten, så en natt där ett nätverksfel bara bet på en del hade skrivit
#: en fil med de verksamheterna saknade. Laddsteget avpublicerar saknade rader
#: upp till max(10, 5 procent), för Örebro 61 stycken, alltså hade upp till 61
#: namngivna företag kunnat markeras som borta ur registret utan larm. Med
#: samma tal här kan ett hämtningsfel aldrig nå den zonen: vid det elfte felet
#: skrivs ingen fil alls, gårdagens data står kvar, och halsokoll.mjs flaggar
#: kommunen när den inte hämtats på tre dagar.
#:
#: Bakgrunden är 307-loopen den 12 och 13 september 2026, då varje verksamhet
#: föll var för sig och körningen kröp fram till jobbets 45-minuterstak.
MAX_FEL = 10
_fel = 0
_avbryt = threading.Event()


def get(url: str, as_json: bool = True):
    """Hämta med omförsök och exponentiell backoff."""
    for attempt in range(ATTEMPTS):
        try:
            request = urllib.request.Request(url, headers={
                "User-Agent": USER_AGENT,
                "Accept": "application/json, text/html",
            })
            with oppna(request, timeout=90) as response:
                body = response.read().decode("utf-8", "replace")
            return json.loads(body) if as_json else body
        except (urllib.error.URLError, TimeoutError, OSError, ValueError) as exc:
            if attempt == ATTEMPTS - 1:
                raise
            time.sleep(2 ** attempt)
    return None


def punkter(entry, today: date, arkiv: Arkiv):
    """Kontrollens punkter, ur arkivet när kontrollen är färdig för länge sedan.

    Nyckeln är kontrollens eget id, som kommunen aldrig återanvänder.

    Det som lagras är kommunens JSON-dokument OTOLKAT, bara omskrivet utan
    blanktecken. Ingen rad har gått genom normalize_areas eller något annat i
    prikko/sources/orebro.py, alltså slår en rättelse där igenom på hela
    beståndet nästa natt och inte bara på det som råkade hämtas om.
    """
    gammal = entry.inspected_at <= today - timedelta(days=FARSKT_FONSTER_DAGAR)
    nyckel = reports_url(entry.id) if gammal else None

    if nyckel is not None:
        lagrat = arkiv.las(nyckel)
        if lagrat is not None:
            return json.loads(lagrat.decode("utf-8"))

    # get() med as_json behålls, och det är inte en detalj. ValueError står i
    # dess omförsökslista, alltså gör ett avhugget svar att anropet görs om i
    # stället för att fälla verksamheten. Skrivs arkivet från den RÅA kroppen
    # i stället hamnar ett avhugget svar i arkivet och läses som giltigt varje
    # natt därefter. Här är svaret redan tolkat när det skrivs, alltså kan
    # bara ett helt svar lagras.
    reports = get(reports_url(entry.id))
    time.sleep(POLITE_DELAY_S)
    if nyckel is not None:
        arkiv.skriv(
            nyckel,
            json.dumps(reports, ensure_ascii=False, separators=(",", ":")).encode("utf-8"),
        )
    return reports


def collect_facility(raw: dict, today: date, arkiv: Arkiv) -> Optional[dict]:
    """Hämta en verksamhets historik och alla dess kontrollpunkter."""
    global _done, _fel

    if _avbryt.is_set():
        # Gränsen är redan passerad. Ingen fler förfrågan mot kommunen, och
        # ingen räknas som klar, eftersom körningen ändå avbryts i build().
        return None

    try:
        establishment = normalize_establishment(raw)
        html = get(facility_url(establishment.id_local), as_json=False)
        history = parse_history(html)

        inspections = []
        for entry in history:
            if under_embargo(entry, today):
                # Kommunen håller inne resultatet i 30 dagar så verksamheten
                # hinner yttra sig. Vi går inte förbi den spärren.
                continue
            reports = punkter(entry, today, arkiv)
            normalized = normalize_inspection(entry, reports, establishment.id_national)
            if normalized is not None:
                inspections.append(normalized)

        return {"establishment": establishment, "inspections": inspections}
    except UnknownSourceValue as exc:
        print(f"  ! hoppar över: {exc}", file=sys.stderr)
        return None
    except Exception as exc:
        print(f"  ! {raw.get('Objektsnamn')!r}: {type(exc).__name__} {exc}", file=sys.stderr)
        with _progress:
            _fel += 1
            if _fel > MAX_FEL and not _avbryt.is_set():
                _avbryt.set()
                print(f"  ! {_fel} fel, mer än gränsen på {MAX_FEL}. Avbryter.", file=sys.stderr)
        return None
    finally:
        with _progress:
            _done += 1
            if _done % 25 == 0:
                print(f"  {_done} verksamheter", file=sys.stderr)


def build(today: date, limit: Optional[int], arkiv_rot: Optional[Path]) -> dict:
    arkiv = Arkiv(arkiv_rot, "orebro")
    facilities = get(SEARCH_URL)
    raw_count = len(facilities)
    facilities = merge_duplicates(facilities)
    print(
        f"Listan: {raw_count} poster → {len(facilities)} verksamheter"
        f" ({raw_count - len(facilities)} dubbletter sammanslagna)",
        file=sys.stderr,
    )
    if limit:
        facilities = facilities[:limit]

    collected = []
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = [pool.submit(collect_facility, f, today, arkiv) for f in facilities]
        for future in as_completed(futures):
            result = future.result()
            if result is not None:
                collected.append(result)

    if _fel > MAX_FEL:
        # Ingen fil, OCH INGEN GALLRING. Hellre gårdagens fullständiga bestånd
        # än i dag med hål i, se MAX_FEL. Gallrade vi här hade vi dessutom
        # kastat arkivet för de verksamheter som aldrig hann hämtas, och nästa
        # natt hade fått betala för det en gång till.
        raise SystemExit(
            f"Örebro: {_fel} verksamheter gick inte att hämta, mer än gränsen på "
            f"{MAX_FEL}. Ingen fil skrivs, så gårdagens data står kvar."
        )

    arkiv.sammanfatta(f"punkthämtningar äldre än {FARSKT_FONSTER_DAGAR} dagar")
    if not limit:
        borttagna = arkiv.gallra()
        if borttagna:
            print(f"  arkivet gallrades på {borttagna} inaktuella svar", file=sys.stderr)

    skipped = len(facilities) - len(collected)
    records = []

    for item in collected:
        establishment = item["establishment"]
        inspections = sorted(item["inspections"], key=lambda x: x.inspected_at, reverse=True)

        if not establishment.name:
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
                "lat": establishment.lat,
                "lng": establishment.lng,
                "image": None,
                "verdict": result.verdict,
                "distinction": result.distinction,
                "reason": result.reason,
                "modelVersion": result.model_version,
                "uncertain": False,
                # Registreringsdatumet ur `Registrerades`, som kommunen visar
                # själv på verksamhetssidan. Se orebro.registration_date().
                "registeredAt": (
                    establishment.registered_at.isoformat()
                    if establishment.registered_at
                    else None
                ),
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
                    }
                    for i in inspections
                ],
            }
        )

    # Ordningen blir godtycklig av parallellhämtningen. Sortera så filen är
    # jämförbar mellan körningar — annars ger varje hämtning en diff på hela
    # filen utan att något ändrats.
    records.sort(key=lambda r: r["id"])
    dedupe_slugs(records)

    # Täckningen skrivs ut i stället för att kontrolleras med ett kast. Se
    # orebro.registration_date(): ett oläsbart datum får inte fälla en
    # verksamhet, men det får inte heller försvinna tyst. Talet var 1 233 av
    # 1 233 vid mätningen 2026-08-25.
    dated = sum(1 for r in records if r["registeredAt"])
    print(f"  registreringsdatum {dated}/{len(records)}", file=sys.stderr)

    return {
        "municipality": {
            "code": MUNICIPALITY_CODE,
            "name": MUNICIPALITY_NAME,
            "city": MUNICIPALITY_CITY,
            "slug": "orebro",
        },
        "source": {
            "url": SOURCE_URL,
            "fetchedAt": datetime.now().isoformat(timespec="seconds"),
        },
        "skipped": skipped,
        "establishments": records,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--out", type=Path, required=True)
    anslut_arkiv(parser)
    args = parser.parse_args()

    data = build(date.today(), args.limit, args.arkiv)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")

    total = len(data["establishments"])
    assessed = sum(1 for e in data["establishments"] if e["verdict"])
    areas = sum(len(i["areas"]) for e in data["establishments"] for i in e["inspections"])
    print(
        f"\nSkrev {total} anläggningar till {args.out} "
        f"({assessed} med bedömning, {areas} kontrollpunkter, "
        f"{data['skipped']} överhoppade)",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
