"""SCB:s statistikdatabas via PxWebApi 2.0.

Ett öppet REST-API utan nyckel och utan avtal, med kommunkod som nyckel.
Kommunkoden har vi på varje rad sedan första dagen. Licensen är CC0 1.0
Universal, alltså ingen attributionsplikt alls. SCB rekommenderar ändå
"Källa: SCB", och den rekommendationen följer vi där tal ur databasen visas.

    https://api.scb.se/OV0104/v2beta/api/v2/    /config svarar med villkoren

Taken står i /config och lästes av där 2026-08-06: 150 000 datacceller per
uttag, 30 anrop per tio sekunder och per IP-adress. Våra uttag är ett anrop
per tabell och år, och 312 regioner i svaret. Vi kommer inte i närheten.

## Vad vi hämtar, och varför inte mer

Kartläggningen av statistikdatabasen gav ett tydligt och tråkigt besked:
**arbetsställen per kommun och SNI finns inte i den öppna databasen.**
Företagsdatabasen (NV0101) redovisar företag per näringsgren utan region.
Företagens ekonomi (NV0109) redovisar arbetsställen per LÄN och bara på
SNI-avdelning, alltså I-55-56 med hotellen inbakade. Den täckningsgrad man
gärna vill räkna, vårt register mot SCB:s arbetsställen i SNI 56, går
följaktligen inte att räkna på öppna data.

Det gäller STATISTIKDATABASEN, som är den här modulens källa, och inte SCB
i stort. SCB:s allmänna företagsregister har ett arbetsställeregister med
kommunkod, femsiffrig SNI och besöksadress, avgiftsfritt sedan 26 juni 2025
men bakom certifikat och godkända användarvillkor. Det är en annan tjänst
med en annan dörr, och den är utredd i docs/35_scb_foretagsregistret.md.

Det som DÄRIMOT finns per kommun, för alla 290, årligen och med full
täckning, är sysselsättningen per näringsgren. Den är hämtad ur register och
inte ur en enkät, och den är den enda öppna uppgiften som säger hur stor
restaurangbranschen faktiskt är i en kommun.

- **TAB3204, näringsgren I, hotell och restauranger.** Sysselsatta efter
  ARBETSSTÄLLETS belägenhet, alltså var jobben finns och inte var de som har
  dem bor. Det är den riktningen som hör ihop med ett register över
  serveringsställen i kommunen.

## Vad talet inte är

Mätningen avser november. En kommun vars restauranger lever på sommaren
redovisas alltså i sitt lågläge, och det är hela poängen med att ställa talet
bredvid vårt eget antal serveringsställen: Borgholm har åtta gånger
Stockholms täthet av ställen och ungefär samma sysselsättning per invånare.
Skillnaden är säsong och storlek, inte hygien.

Näringsgren I rymmer också hotellen. Talet är branschens storlek, inte
restaurangernas ensamma, och etiketten på sajten säger därför "hotell och
restaurang" och aldrig bara "restaurang".

## Varför tabellen kontrolleras vid varje körning

Samma skäl som i kolada.py. SCB numrerar om, slår ihop och lägger ner
tabeller, och tabell-id och värdekoder är ogenomskinliga: `000002XH` säger
ingenting om vad det räknar. En kod som pekar på något annat än den gjorde
igår ger tal som ser rimliga ut och betyder fel saker. Därför läses tabellens
rubrik och varje vald värdekods etikett, och de jämförs med det vi skrev av
när vi valde dem. Ändras något stannar körningen.

Rubrikens svans, ". År 2020-2024", byter årtal varje gång tabellen fylls på
och jämförs därför inte. Allt före den jämförs exakt.
"""

from __future__ import annotations

import json
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Dict, Mapping, Optional

BASE = "https://api.scb.se/OV0104/v2beta/api/v2"

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"

#: Källhänvisningen SCB rekommenderar. CC0 kräver ingen, se modulens inledning.
ATTRIBUTION = "Källa: SCB"

#: Licensen som /config anger för hela databasen.
LICENSE = "CC0 1.0 Universal"

#: Rubrikens svans med årsintervallet. Se modulens inledning.
PERIOD_SUFFIX = ". År "


@dataclass(frozen=True)
class Table:
    """En tabell vi valt, med rubriken och urvalet avskrivna vid valet."""

    id: str
    #: Rubriken utan årsintervall, som den stod i SCB när tabellen valdes.
    title: str
    #: Vad vi kallar talet i vår egen data.
    key: str
    #: Dimensionen som bär kommunerna. Den enda som får ha fler än ett värde.
    region: str
    #: Dimensionen som bär åren.
    period: str
    #: Övriga dimensioner, en enda värdekod var, och etiketten vi skrev av.
    #: Nyckel är dimensionens kod, värdet är (värdekod, etikett).
    selection: Mapping[str, tuple]


HOTEL_AND_RESTAURANT_JOBS = Table(
    id="TAB3204",
    title=(
        "Sysselsatta 15–74 år efter region, kön, näringsgren (SNI 2007) och "
        "födelseregion. Årligt register"
    ),
    key="hotelAndRestaurantJobs",
    region="Region",
    period="Tid",
    selection={
        "Kon": ("1+2", "totalt"),
        "SNI2007": ("I", "hotell och restauranger"),
        "Fodelseregion": ("tot", "totalt"),
        "ContentsCode": ("000002XH", "sysselsatta efter arbetsställets belägenhet"),
    },
)

TABLES = (HOTEL_AND_RESTAURANT_JOBS,)


class ScbChanged(RuntimeError):
    """En tabell ser inte ut som när vi valde den."""


def _get(path: str, params: Optional[list] = None) -> dict:
    url = f"{BASE}/{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=120) as response:
        return json.loads(response.read().decode("utf-8"))


def _metadata(table: Table) -> dict:
    return _get(
        f"tables/{table.id}/metadata",
        [("lang", "sv"), ("outputFormat", "json-stat2")],
    )


def _labels(metadata: dict, dimension: str) -> Dict[str, str]:
    try:
        category = metadata["dimension"][dimension]["category"]
    except KeyError:
        raise ScbChanged(
            f"dimensionen {dimension!r} finns inte längre i tabellen"
        ) from None
    labels = category.get("label") or {}
    return {code: labels.get(code, code) for code in category["index"]}


def verify(table: Table) -> dict:
    """Kontrollera att tabellen finns och mäter det vi tror.

    Returnerar tabellens metadata, som `latest` läser åren ur. Två saker
    kontrolleras: rubriken före årsintervallet, och etiketten på varje
    värdekod vi valt. Den andra är den viktiga — ett tabell-id kan överleva en
    omläggning som byter innebörd på en kod.
    """
    metadata = _metadata(table)

    title = str(metadata.get("label") or "")
    stem = title.split(PERIOD_SUFFIX)[0].strip()
    if stem != table.title:
        raise ScbChanged(
            f"tabellen {table.id} heter nu {stem!r}, vi valde den som "
            f"{table.title!r}. Kontrollera att den fortfarande mäter samma sak "
            f"innan raden i TABLES ändras."
        )

    for dimension, (code, label) in table.selection.items():
        labels = _labels(metadata, dimension)
        if code not in labels:
            raise ScbChanged(
                f"tabellen {table.id} har inte längre värdet {code!r} i "
                f"{dimension!r}. Vi valde det som {label!r}."
            )
        if labels[code].strip() != label:
            raise ScbChanged(
                f"tabellen {table.id}: {dimension}={code!r} heter nu "
                f"{labels[code]!r}, vi valde det som {label!r}. Koden pekar "
                f"sannolikt på något annat än när den skrevs av."
            )

    return metadata


@dataclass(frozen=True)
class Series:
    """En tabells senaste värden per kommun, för hela riket."""

    table: Table
    year: int
    #: Kommunkod till värde. Kommuner utan värde saknas helt.
    values: Dict[str, float]


def _years(metadata: dict, table: Table) -> list:
    years = []
    for code in _labels(metadata, table.period):
        try:
            years.append(int(code))
        except ValueError:
            continue
    return sorted(years, reverse=True)


def _municipal_values(payload: dict, table: Table) -> Dict[str, float]:
    """Bara kommuner. Riket ('00') och länen (tvåsiffriga) sorteras bort.

    Alla dimensioner utom regionen måste bära exakt ett värde. Gör de inte
    det ligger flera tal på samma kommun i svaret, och vilket av dem som
    hamnar i utfallet skulle avgöras av hur SCB råkar ordna sin lista.
    """
    sizes = dict(zip(payload["id"], payload["size"]))
    for dimension, size in sizes.items():
        if dimension != table.region and size != 1:
            raise ScbChanged(
                f"tabellen {table.id} lämnade {size} värden i {dimension!r}, "
                f"urvalet ska ge ett"
            )

    index = payload["dimension"][table.region]["category"]["index"]
    values = payload["value"]

    result: Dict[str, float] = {}
    for code, position in index.items():
        if len(code) != 4:
            continue
        value = values[position]
        if value is None:
            continue
        result[code] = float(value)
    return result


def latest(table: Table, metadata: dict, years_back: int = 4) -> Series:
    """Senaste året tabellen har kommunvärden för, med alla kommuners värden.

    Året sätts inte i förväg. Årlig registerstatistik publiceras med ett års
    eftersläpning och i november, så vilket år som är det senaste beror på när
    körningen görs. Åren läses ur metadatan och gås igenom bakifrån tills ett
    år bär värden.
    """
    years = _years(metadata, table)
    if not years:
        raise ScbChanged(f"tabellen {table.id} redovisar inga år")

    for year in years[:years_back + 1]:
        params = [("lang", "sv"), ("outputFormat", "json-stat2")]
        params.append((f"valueCodes[{table.region}]", "*"))
        params.append((f"valueCodes[{table.period}]", str(year)))
        for dimension, (code, _) in table.selection.items():
            params.append((f"valueCodes[{dimension}]", code))

        values = _municipal_values(_get(f"tables/{table.id}/data", params), table)
        if values:
            return Series(table=table, year=year, values=values)

    raise ScbChanged(
        f"tabellen {table.id} har inga kommunvärden för något av åren "
        f"{years[min(years_back, len(years) - 1)]}–{years[0]}"
    )
