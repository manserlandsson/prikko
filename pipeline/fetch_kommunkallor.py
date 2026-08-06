#!/usr/bin/env python3
"""Hämta hur kommunerna bedriver sin livsmedelskontroll.

Tre källor, alla på kommunnivå och alla med full täckning:

- **Livsmedelsverkets myndighetsrapportering.** Antal anläggningar i
  registret, hur stor andel som kontrollerats, och kontrollerna uppdelade på
  planerade, uppföljande och händelsestyrda. Plus årsarbetskrafter.
- **Kolada.** Invånarantal, och SKR:s Insiktsmätning där företagen betygsätter
  kommunens myndighetsutövning inom livsmedel.
- **SCB:s statistikdatabas.** Sysselsatta inom hotell och restaurang efter
  arbetsställets belägenhet, alltså hur stor branschen är i kommunen. Se
  prikko/sources/scb.py för varför det blev just den uppgiften och varför
  arbetsställen per kommun och SNI inte går att få ur öppna data.

    python3 pipeline/fetch_kommunkallor.py --out site/src/data/riket/kontrollen.json

## Vad datan är till för

Att förklara varför kommunernas tal ser olika ut, inte att rangordna dem.
Andelen verksamheter med kvarstående brister spänner från 0,3 procent i
Jönköping till 23,7 procent i Oskarshamn, och metodiksidan har hittills fått
skriva ut det spannet och sedan be läsaren att inte läsa det som en ranking,
utan att kunna erbjuda något att läsa det som i stället. Kontrollfrekvensen och
antalet anläggningar per årsarbetskraft är det som saknades.

## Den bindande gränsen, byggd in i filen

Kommuner rangordnas aldrig. Ingen sorterad tabell, ingen topplista, ingen
kartfärgning per kommun på ett nyckeltal. Det enda jämförelsetalet är
**medianen som referenslinje**.

Den regeln står inte bara i komponenterna, den står i filens form. Utfallet
bär de kommuner vi redan publicerar och INGA andra, plus en median räknad över
hela riket. Alla 290 kommuners tal finns aldrig samlade i vår data, och därför
finns det ingenting att sortera. En framtida sorterad tabell skulle kräva att
någon medvetet ändrade det här skriptet först, och det är precis så mycket
friktion regeln behöver.

## Vad ägaren måste göra vid en ny årgång

Livsmedelsverkets rapport kommer en gång om året, i maj eller juni, och bär
föregående års kontroll. Ny årgång läggs till i `REPORTS` i
`prikko/sources/livsmedelsverket.py` med URL och de två bilagerubrikerna
avskrivna ur innehållsförteckningen. Ingenting annat behöver ändras.
"""

from __future__ import annotations

import argparse
import json
import statistics
import sys
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko.sources import kolada, scb  # noqa: E402
from prikko.sources.livsmedelsverket import (  # noqa: E402
    LATEST,
    REPORTS,
    Authority,
    Report,
    parse,
)

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"

#: Kontrollmyndigheter vars namn i rapporten inte är kommunens namn. Gemensamma
#: nämnder och förbund heter något eget, och för de kommuner vi publicerar
#: måste kopplingen skrivas för hand. Tom så länge alla tolv kommunerna är
#: egna kontrollmyndigheter. Kommunkod till myndighetsnamn, exakt som det står
#: i rapporten.
AUTHORITY_BY_CODE: Dict[str, str] = {}


class MissingAuthority(RuntimeError):
    """En kommun vi publicerar saknas i rapporten."""


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=180) as response:
        return response.read()


def published_municipalities(data_dir: Path) -> List[dict]:
    """Kommunerna sajten redan har data för, ur deras egna filer.

    Ingen lista i kod, samma regel som i `site/src/lib/db.ts`: en kommun som
    får en datafil får sina nyckeltal utan att något annat ändras.
    """
    found = []
    for path in sorted(data_dir.glob("*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        municipality = payload.get("municipality")
        if municipality and isinstance(payload.get("establishments"), list):
            found.append(municipality)
    return found


def authority_for(municipality: dict, authorities: Dict[str, Authority]) -> Authority:
    """Kommunens rad i rapporten.

    Kontrollmyndigheten heter i regel exakt som orten: "Örebro", inte "Örebro
    kommun". Går den inte att hitta stannar körningen hellre än att lämna ut en
    kommunsida utan siffror, eftersom en kommun som tappat sin rad ser likadan
    ut som en kommun som aldrig hade en.
    """
    code = municipality["code"]
    if code in AUTHORITY_BY_CODE:
        name = AUTHORITY_BY_CODE[code]
        if name not in authorities:
            raise MissingAuthority(
                f"AUTHORITY_BY_CODE pekar {code} på {name!r}, som inte finns i "
                f"rapporten"
            )
        return authorities[name]

    for candidate in (municipality["city"], municipality["name"].rsplit(" ", 1)[0]):
        if candidate in authorities:
            return authorities[candidate]

    raise MissingAuthority(
        f"hittar ingen kontrollmyndighet för {municipality['name']} "
        f"({code}) i rapporten. Kommunen ingår sannolikt i en gemensam nämnd "
        f"eller ett förbund. Skriv in myndighetens namn i AUTHORITY_BY_CODE."
    )


def kolada_municipality_codes() -> Dict[str, str]:
    """Kommunnamn till kommunkod, hela riket. Nyckel för medianerna."""
    payload = kolada._get("municipality", per_page=400)
    return {m["title"]: m["id"] for m in payload["values"] if m.get("type") == "K"}


# ---------------------------------------------------------------------------
# Härledda tal
# ---------------------------------------------------------------------------
#
# Varje härlett tal räknas EN gång, här, och skrivs färdigt till filen. Både
# kommunens värde och medianen kommer ur samma funktion. Alternativet vore att
# skriva råa tal och låta sajten dividera, och då hade kommunens tal och
# medianen kunnat räknas olika utan att någon märkte det.


def share_follow_up(a: Authority) -> Optional[int]:
    """Uppföljande kontroller i procent av alla kontroller.

    Antalet i sig säger ingenting jämfört mellan kommuner, eftersom en stor
    kommun gör fler av allt. Andelen säger något om arbetssättet.
    """
    if not a.controls or a.follow_up is None:
        return None
    return round(100 * a.follow_up / a.controls)


def facilities_per_fte(a: Authority) -> Optional[int]:
    if not a.fte or a.facilities is None:
        return None
    return round(a.facilities / a.fte)


def residents_per_facility(a: Authority, population: Optional[float]) -> Optional[int]:
    if not a.facilities or population is None:
        return None
    return round(population / a.facilities)


def per_10k(count: Optional[float], population: Optional[float]) -> Optional[int]:
    """Ett antal per 10 000 invånare, avrundat.

    Nämnaren är kommunens folkbokförda, inte dess besökare. Det är en
    begränsning och inte ett fel: talet svarar på hur mycket bransch det finns
    per invånare, och en turistkommun får därför ett högt tal. Det är sant.
    """
    if count is None or not population:
        return None
    return round(10000 * count / population)


def median(values: Iterable[Optional[float]]) -> Optional[int]:
    present = [v for v in values if v is not None]
    if len(present) < 100:
        return None
    return round(statistics.median(present))


def build(report: Report, data_dir: Path) -> dict:
    document = fetch(report.url)
    authorities = parse(document, report)

    for kpi in kolada.KPIS:
        kolada.verify(kpi)
    population = kolada.latest(kolada.POPULATION, datetime.now().year)
    rating = kolada.latest(kolada.FOOD_CONTROL_RATING, datetime.now().year)

    jobs_table = scb.HOTEL_AND_RESTAURANT_JOBS
    jobs = scb.latest(jobs_table, scb.verify(jobs_table))

    # Medianen räknas över HELA riket, inte över de kommuner vi publicerar.
    # Tolv kommuners median vore inte "riket i mitten", den vore vårt eget
    # urval speglat tillbaka som om det var landet.
    codes = kolada_municipality_codes()
    nationwide = [
        (a, population.values.get(codes[a.name])) for a in authorities.values()
        if a.name in codes
    ] + [(a, None) for a in authorities.values() if a.name not in codes]

    medians = {
        "shareControlled": median(a.share_controlled for a, _ in nationwide),
        "shareFollowUp": median(share_follow_up(a) for a, _ in nationwide),
        "facilitiesPerFte": median(facilities_per_fte(a) for a, _ in nationwide),
        "residentsPerFacility": median(
            residents_per_facility(a, pop) for a, pop in nationwide
        ),
        "rating": median(rating.values.values()),
        # Räknad över alla 290 kommuner, inte över de tolv vi publicerar. SCB
        # och Kolada har båda full täckning, så nämnaren är hela landet och
        # referenslinjen är en riktig riksmedian.
        "hotelAndRestaurantJobsPer10k": median(
            per_10k(count, population.values.get(code))
            for code, count in jobs.values.items()
        ),
    }

    municipalities: Dict[str, dict] = {}
    for municipality in published_municipalities(data_dir):
        code = municipality["code"]
        a = authority_for(municipality, authorities)
        pop = population.values.get(code)
        score = rating.values.get(code)
        municipalities[code] = {
            "authority": a.name,
            "facilities": a.facilities,
            "shareControlled": a.share_controlled,
            "planned": a.planned,
            "followUp": a.follow_up,
            "eventDriven": a.event_driven,
            "controls": a.controls,
            "shareFollowUp": share_follow_up(a),
            "fte": a.fte,
            "facilitiesPerFte": facilities_per_fte(a),
            "population": None if pop is None else round(pop),
            "residentsPerFacility": residents_per_facility(a, pop),
            "rating": None if score is None else round(score),
            "hotelAndRestaurantJobsPer10k": per_10k(jobs.values.get(code), pop),
        }

    return {
        "fetchedAt": datetime.now().isoformat(timespec="seconds"),
        "report": {
            "year": report.year,
            "series": report.series,
            "title": f"Sveriges livsmedelskontroll {report.year}",
            "url": report.url,
            "publisher": "Livsmedelsverket",
            "authorities": len(authorities),
        },
        "kolada": {
            "attribution": kolada.ATTRIBUTION,
            "population": {
                "kpi": kolada.POPULATION.id,
                "title": kolada.POPULATION.title,
                "year": population.year,
            },
            "rating": {
                "kpi": kolada.FOOD_CONTROL_RATING.id,
                "title": kolada.FOOD_CONTROL_RATING.title,
                "year": rating.year,
            },
        },
        "scb": {
            "attribution": scb.ATTRIBUTION,
            "license": scb.LICENSE,
            "jobs": {
                "table": jobs_table.id,
                "title": jobs_table.title,
                "industry": jobs_table.selection["SNI2007"][1],
                "year": jobs.year,
            },
        },
        "median": medians,
        "municipalities": municipalities,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, default=LATEST,
                        help=f"kontrollår, en av {sorted(REPORTS)}")
    parser.add_argument("--data", type=Path, default=Path("site/src/data"),
                        help="katalogen med kommunernas datafiler")
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()

    if args.year not in REPORTS:
        parser.error(f"ingen rapport för {args.year}, har {sorted(REPORTS)}")

    data = build(REPORTS[args.year], args.data)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")

    print(
        f"Skrev {len(data['municipalities'])} kommuner till {args.out} ur "
        f"{data['report']['title']} ({data['report']['authorities']} "
        f"kontrollmyndigheter lästa), Kolada och SCB "
        f"({data['scb']['jobs']['table']}, {data['scb']['jobs']['year']}).",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
