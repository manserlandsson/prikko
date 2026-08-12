"""Kontrolldatum som källan lämnat i framtiden.

## Varför modulen finns

Sitemapindexet påstod 2026-12-09 som sitt `lastmod`, alltså fyra månader in i
framtiden, medan sajten byggdes i augusti. Källan var EN kontroll: Torget
pizzeria och restaurang i Svenljunga.

Felet är kommunens och inte vår tolkning. Rapporten ligger publicerad som
"Torget pizzeria och restaurang 2025-12-09.pdf", brevhuvudet är daterat
18 december 2025 och diarienumret är SBF-2025-1435, men brödtexten inleds
"Den 9 december 2026 gjorde vi en livsmedelskontroll". Kommunen har skrivit
fel årtal i löptexten, och läsaren i `sources/svenljunga.py` läser rätt: den
tar kontrolldatumet ur den meningen med avsikt, eftersom rapportens eget datum
ligger upp till nitton dagar efter kontrollen.

## Varför ett framtida datum kostar mer än det ser ut att göra

`lastmod` är den enda signal vi har som talar om VILKA sidor som ändrats, och
Google använder den bara så länge den är trovärdig. En sitemap som daterar sig
själv i framtiden är per definition inte det, och priset är inte den enda
felaktiga raden utan att fältet slutar läsas för hela sajten. Färskhet är
dessutom en uttalad AEO-signal (bibeln §6b), alltså precis den kant vi hade
kastat bort.

Ett framtida kontrolldatum ljuger dessutom på verksamhetens egen sida, och
bedömningen i `grading.py` räknar redan bort det: fönstret är
`window_start <= inspected_at <= today`, så kontrollen fanns i datan, syntes i
texten och påverkade ingenting. Torget stod som "utan anmärkningar" trots att
rapporten säger "en eller flera avvikelser", enbart för att datumet låg fel.

## Ordningen, och varför den ser ut så här

    1  KONTROLLDATUMET UR BRÖDTEXTEN, när det är rimligt.
       Det är kommunens egen mening om när kontrollen skedde, och det enda
       datum som beskriver kontrollen i stället för pappersarbetet runt den.
       Rimligt betyder här: inte efter i dag. En kontroll som ännu inte har
       skett kan inte redovisas.

    2  RAPPORTENS EGET DATUM, när brödtextens är orimligt.
       Det ligger dagar efter kontrollen, aldrig veckor, och är alltså nära
       nog för allt vi gör med datumet. Filnamnets datum får användas som
       källa till det, men BARA här. Som förstahandskälla vore det fel i
       53 av Svenljungas 154 rapporter, där rapportens datum och kontrollens
       skiljer sig med upp till nitton dagar.

    3  DAGENS DATUM, som sista utväg.
       Sant men trubbigt: vi vet att kontrollen skett och att den inte skett i
       framtiden. Det används bara när inget bättre finns, och att veta hur
       ofta det händer är hela skälet till att källan loggas.

Att i stället kasta kontrollen vore värst av allt: det hade dolt en publicerad
avvikelse om en namngiven verksamhet.

## Loggning

Varje gång brödtextens datum inte används loggas verksamheten, kontrollen,
datumet källan lämnade och vilken nivå i ordningen som fick bära. En ensam
felskrivning i en kommun är en felskrivning, men samma sak i tre kommuner är
ett mönster i hur vi läser, och att filnamnet börjar bära bördan ska synas i
nattloggen innan det syns i Search Console.

Kontrollens `id` rörs ALDRIG. Det bär källans eget datum och är spåret tillbaka
till kommunens rapport. Skrevs det om skulle raden dessutom bli en ny kontroll
vid nästa inläsning i stället för samma.
"""

from __future__ import annotations

import re
import sys
from datetime import date
from typing import Iterable, List, NamedTuple, Optional, TextIO

#: Nivåerna i ordningen ovan, som de skrivs i loggen.
SOURCE_BODY = "rapportens brödtext"
SOURCE_REPORT = "rapportens eget datum"
SOURCE_TODAY = "dagens datum"

#: Ett ISO-datum i en rapport-URL eller ett filnamn, till exempel
#: ".../Torget%20pizzeria%20och%20restaurang%202025-12-09.pdf". Används bara i
#: fallbackläget, se ordningen ovan.
_URL_DATE = re.compile(r"(\d{4})-(\d{2})-(\d{2})")


class ResolvedDate(NamedTuple):
    """Vilket datum som gäller, och varifrån det kom."""

    value: date
    source: str
    #: Datumet källan lämnade, när det förkastades. None när brödtexten dög.
    rejected: Optional[date] = None


class ClampedDate(NamedTuple):
    """En rättad kontroll, tillräckligt beskriven för att gå att slå upp."""

    establishment: str
    inspection_id: str
    source_date: str
    chosen_date: str
    source: str


def report_date_from_url(url: Optional[str]) -> Optional[date]:
    """Rapportens eget datum, ur dess URL eller filnamn.

    Bara till fallbacken. Se ordningen i modulens dokumentation.
    """
    if not url:
        return None
    found = _URL_DATE.search(url)
    if not found:
        return None
    try:
        return date(*(int(g) for g in found.groups()))
    except ValueError:
        return None


def resolve_control_date(
    control_date: date, report_date: Optional[date], today: date
) -> ResolvedDate:
    """Kontrolldatumet enligt ordningen: brödtext, rapportdatum, i dag."""
    if control_date <= today:
        return ResolvedDate(control_date, SOURCE_BODY)

    if report_date is not None and report_date <= today:
        return ResolvedDate(report_date, SOURCE_REPORT, rejected=control_date)

    return ResolvedDate(today, SOURCE_TODAY, rejected=control_date)


def clamp_future_inspections(
    establishments: Iterable[dict], today: date
) -> List[ClampedDate]:
    """Sista nätet: rätta framtida kontrolldatum i en färdig datafil.

    Källmodulerna gör samma bedömning vid inläsningen, där rapporten och dess
    datum finns att tillgå. Det här är nätet under dem, och det enda ställe
    alla tolv kommuner passerar. Finns `reportUrl` kvar på kontrollen används
    dess datum, annars återstår dagens.

    Ändrar posterna på plats och returnerar det som ändrades, så att anroparen
    kan logga det. Ett datum som inte går att tolka lämnas orört: det är ett
    annat fel än det här, och en tyst rättning av det hade dolt det.
    """
    clamped: List[ClampedDate] = []

    for e in establishments:
        for i in e.get("inspections") or []:
            raw = i.get("date")
            if not isinstance(raw, str):
                continue
            try:
                parsed = date.fromisoformat(raw)
            except ValueError:
                continue

            resolved = resolve_control_date(
                parsed, report_date_from_url(i.get("reportUrl")), today
            )
            if resolved.value == parsed:
                continue

            i["date"] = resolved.value.isoformat()
            clamped.append(
                ClampedDate(
                    establishment=e.get("name") or e.get("id") or "?",
                    inspection_id=i.get("id") or "?",
                    source_date=raw,
                    chosen_date=resolved.value.isoformat(),
                    source=resolved.source,
                )
            )

    return clamped


def log_clamped(clamped: List[ClampedDate], stream: Optional[TextIO] = None) -> None:
    """Skriv ut vad som rättades och varifrån datumet togs. Tyst när inget gjordes."""
    if not clamped:
        return

    out = stream or sys.stderr
    print(
        f"  VARNING: {len(clamped)} kontrolldatum låg i framtiden och rättades. "
        "Källan har skrivit fel, eller så har vår läsning av den börjat kasta "
        "om dag och månad. Se prikko/dates.py.",
        file=out,
    )
    for c in clamped:
        print(
            f"    {c.establishment}: {c.source_date} → {c.chosen_date} "
            f"ur {c.source}  ({c.inspection_id})",
            file=out,
        )
