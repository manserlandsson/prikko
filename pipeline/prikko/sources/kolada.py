"""Kolada, Rådet för främjande av kommunala analyser.

Ett öppet REST-API utan nyckel och utan avtal, med kommunkod som nyckel.
Kommunkoden har vi på varje rad sedan första dagen. Kommersiell användning är
uttryckligen tillåten, och villkoret är en attribution: "Källa: Kolada".

    https://api.kolada.se/v3/    Swagger på /v3/docs

## Vad vi hämtar, och varför inte mer

Kolada har tusentals nyckeltal per kommun. Två av dem hör hemma på en
hygienkontrollsajt:

- **N01951, invånare totalt.** Nämnaren. Ett register med 9 456 anläggningar
  betyder olika saker i en kommun med 500 000 invånare och i en med 5 000.
- **U07455, Företagsklimat Insikt, livsmedelskontroll.** SKR:s enkät där
  företagen själva betygsätter kommunens myndighetsutövning inom just
  livsmedel, 0 till 100. Det är den enda öppna källan som säger något om HUR
  kontrollen upplevs av dem som kontrolleras, och den är inte vår bedömning
  utan SKR:s mätning.

Resten är frestande och irrelevant. Kostnad per invånare för miljö- och
hälsoskydd, ekologiska livsmedel i kommunens kök och medborgarnas närhet till
livsmedelsaffär säger ingenting om kontrollen av en restaurang.

## Varför nyckeltalen kontrolleras vid varje körning

Kolada skriver själva att nyckeltal kan ändras eller tas bort utan förvarning.
Ett id som pekar på något annat än det gjorde igår ger tal som ser rimliga ut
och betyder fel saker. Därför hämtas varje nyckeltals rubrik och jämförs med
den vi skrev av när vi valde det. Ändras rubriken stannar körningen.
"""

from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Dict, List, Optional

BASE = "https://api.kolada.se/v3"

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"

#: Attributionen Kolada kräver för obearbetade uppgifter.
ATTRIBUTION = "Källa: Kolada"


@dataclass(frozen=True)
class Kpi:
    """Ett nyckeltal vi valt, med rubriken avskriven vid valet."""

    id: str
    #: Rubriken som stod i Kolada när nyckeltalet valdes. Jämförs vid varje
    #: körning, se modulens inledning.
    title: str
    #: Vad vi kallar det i vår egen data.
    key: str


POPULATION = Kpi(
    id="N01951",
    title="Invånare totalt, antal",
    key="population",
)

FOOD_CONTROL_RATING = Kpi(
    id="U07455",
    title="Företagsklimat Insikt - Livsmedelskontroll - Index",
    key="rating",
)

KPIS = (POPULATION, FOOD_CONTROL_RATING)


class KoladaChanged(RuntimeError):
    """Ett nyckeltal ser inte ut som när vi valde det."""


def _get(path: str, **params) -> dict:
    url = f"{BASE}/{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def verify(kpi: Kpi) -> str:
    """Kontrollera att nyckeltalet finns och heter det vi tror.

    Returnerar Koladas beskrivning, som bär SKR:s förbehåll om Insikt och hör
    hemma i vår egen dokumentation av källan.
    """
    payload = _get(f"kpi/{kpi.id}")
    values = payload.get("values") or []
    if not values:
        raise KoladaChanged(f"nyckeltalet {kpi.id} finns inte längre i Kolada")

    title = values[0].get("title", "")
    if title.strip() != kpi.title:
        raise KoladaChanged(
            f"nyckeltalet {kpi.id} heter nu {title!r}, vi valde det som "
            f"{kpi.title!r}. Kontrollera att det fortfarande mäter samma sak "
            f"innan raden i KPIS ändras."
        )
    return values[0].get("description", "")


def _municipal_rows(payload: dict) -> List[dict]:
    """Bara kommuner. Riket ('0000') och regioner sorteras bort."""
    rows = []
    for row in payload.get("values") or []:
        code = str(row.get("municipality") or "")
        if len(code) != 4 or code == "0000":
            continue
        rows.append(row)
    return rows


def _value(row: dict) -> Optional[float]:
    for value in row.get("values") or []:
        if value.get("gender") == "T" and value.get("value") is not None:
            return float(value["value"])
    return None


@dataclass(frozen=True)
class Series:
    """Ett nyckeltals senaste värde per kommun, för hela riket."""

    kpi: Kpi
    year: int
    #: Kommunkod till värde. Kommuner utan värde saknas helt.
    values: Dict[str, float]


def latest(kpi: Kpi, newest_year: int, years_back: int = 4) -> Series:
    """Senaste året nyckeltalet har värden för, med alla kommuners värden.

    Året sätts inte i förväg. Befolkningen publiceras i februari och Insikt i
    april, så vilket år som är det senaste beror på när körningen görs och på
    vilket nyckeltal det gäller. Vi går bakåt tills ett år bär värden.
    """
    for year in range(newest_year, newest_year - years_back - 1, -1):
        payload = _get(f"data/kpi/{kpi.id}/year/{year}", per_page=5000)
        values = {
            row["municipality"]: value
            for row in _municipal_rows(payload)
            if (value := _value(row)) is not None
        }
        if values:
            return Series(kpi=kpi, year=year, values=values)

    raise KoladaChanged(
        f"nyckeltalet {kpi.id} har inga kommunvärden för något av åren "
        f"{newest_year - years_back}–{newest_year}"
    )
