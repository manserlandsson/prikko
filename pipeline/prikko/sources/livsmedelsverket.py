"""Livsmedelsverkets myndighetsrapportering, per kontrollmyndighet.

Varje kontrollmyndighet lämnar en XML till Livsmedelsverket senast 31 januari
med föregående års kontroll: antal anläggningar, planerade och utförda
kontroller, avgifter och personal. Uttag ur den insamlingen görs i
Livsmedelsverkets Uttagswebb, som ligger bakom Livstecknet och kräver
inloggning som kontrollmyndighet. Den vägen är alltså stängd för oss.

Men samma uppgifter publiceras öppet. Livsmedelsverkets årliga rapport
"Sveriges livsmedelskontroll" har bilagor med en rad per kontrollmyndighet,
och de raderna ÄR myndighetsrapporteringen. Ingen inloggning, ingen begäran,
ingen väntetid. Den här modulen läser dem ur PDF:en.

## Vad som läses

Två bilagor per rapport:

- **Förutsättningar.** Årsarbetskrafter, resursbehov, timtaxa och fakturerade
  avgifter. Härifrån kommer nämnaren "anläggningar per årsarbetskraft".
- **Kontrollerade verksamheter.** Antal verksamheter i registret, andel som
  kontrollerats, och kontrollerna uppdelade på planerade, uppföljande och
  händelsestyrda. Härifrån kommer kontrollfrekvensen.

Bilagornas NUMMER ändras mellan årgångar, och rubrikerna med dem. 2023 års
rapport kallade dem "Tillverkning, distribution och försäljning", 2024 års
"Livsmedelskontrollen i leden efter primärproduktionen". Därför står varje
årgångs rubriker i `REPORTS` i stället för i koden, och en ny årgång läggs
till genom att skriva en rad där.

## Varför tabellerna läses ur geometrin och inte ur texten

Raderna ser ut som `Örebro 1 302 55 % 750 483 120 1353 650 48 %`. Tusental
skrivs med blanksteg i vissa kolumner och utan i andra, myndighetsnamn kan
brytas över tre rader, och tomma celler förekommer. Att tolka det med ett
mönster mot textsträngen är att gissa. `extract_blocks` lämnar däremot ut
varje textlöpas x och y, och tabellens kolumner ligger i stabila x-band. En
cell hamnar därför i rätt kolumn för att den STÅR där, inte för att strängen
råkade se ut på ett visst sätt.

Se `prikko/pdf.py` för läsaren och varför den inte använder pypdf.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

from ..pdf import Block, extract_blocks

#: Kolumnernas x-band i PDF-punkter, (namn, från, till). Banden är breda med
#: flit: talen är högerställda, så en cells x beror på hur många siffror den
#: har. Gränserna ligger i tomrummet mellan kolumnerna.
_CONDITIONS_COLUMNS: Sequence[Tuple[str, float, float]] = (
    ("authority", 0.0, 235.0),
    ("fte", 235.0, 335.0),
    ("fte_needed", 335.0, 440.0),
    ("hourly_rate", 440.0, 540.0),
    ("hourly_rate_noncompliance", 540.0, 640.0),
    ("fees_invoiced", 640.0, 900.0),
)

_CONTROLS_COLUMNS: Sequence[Tuple[str, float, float]] = (
    ("authority", 0.0, 195.0),
    ("facilities", 195.0, 265.0),
    ("share_controlled", 265.0, 335.0),
    ("planned", 335.0, 405.0),
    ("follow_up", 405.0, 475.0),
    ("event_driven", 475.0, 545.0),
    ("controls", 545.0, 620.0),
    ("with_deviation", 620.0, 695.0),
    ("share_with_deviation", 695.0, 900.0),
)

#: Textlöpor som bara är språkmärkning i PDF:en, aldrig innehåll.
_NOISE = ("sv-SE", "en-US")

#: Rader som är rubrik eller sidhuvud och inte en myndighet.
_NOT_AUTHORITY = re.compile(
    r"^(Myndighet|Totalt|LIVSMEDELSVERKETS|Bilaga|Tabellen)", re.IGNORECASE
)

#: Sidfoten, som står på varje sida i tabellen. Utan att den skiljs bort
#: hamnar "LIVSMEDELSVERKETS RAPPORTSERIE – L 2025 NR 13" och sidnumret i
#: sidans understa tabellrad, eftersom de står närmast dess ankare.
_FOOTER = re.compile(r"LIVSMEDELSVERKET|RAPPORTSERIE")

#: Hur nära i höjdled två textlöpor ska stå för att räknas till samma rad.
_LINE_TOLERANCE = 2.0


@dataclass(frozen=True)
class Report:
    """En årgång av "Sveriges livsmedelskontroll"."""

    #: Kontrollåret rapporten beskriver, inte utgivningsåret.
    year: int
    #: Livsmedelsverkets beteckning, t.ex. "L 2025 nr 13".
    series: str
    url: str
    #: Rubrik på bilagan med årsarbetskrafter, taxa och avgifter.
    conditions_heading: str
    #: Rubrik på bilagan med anläggningar och kontroller.
    controls_heading: str


#: Årgångar vi kan läsa. En ny rapport läggs till här, med rubrikerna
#: avskrivna ur innehållsförteckningen. Rubrikerna matchas efter att alla
#: blanksteg pressats ihop, så radbrytningar i PDF:en spelar ingen roll.
REPORTS: Dict[int, Report] = {
    2024: Report(
        year=2024,
        series="L 2025 nr 13",
        url=(
            "https://www.livsmedelsverket.se/4ab379/globalassets/"
            "publikationsdatabas/rapporter/2025/"
            "l-2025-nr-13---sveriges-livsmedelskontroll_2024_.pdf"
        ),
        conditions_heading=(
            "Livsmedelskontrollen i leden efter primärproduktionen "
            "– förutsättningar"
        ),
        controls_heading=(
            "Livsmedelskontrollen i leden efter primärproduktionen "
            "– kontrollerade verksamheter"
        ),
    ),
}

LATEST = max(REPORTS)


class ReportFormatChanged(RuntimeError):
    """Rapporten ser inte ut som vi tror.

    Kastas hellre än att lämna ut ett halvt resultat. En bilaga som bytt
    rubrik eller en tabell som bytt kolumner ska stoppa körningen, inte tyst
    ge tolv kommuner utan siffror.
    """


@dataclass
class Authority:
    """En kontrollmyndighets rad i rapporten.

    Fälten är None när cellen är tom i rapporten. Det förekommer: en kommun
    som inte utfört någon kontroll får ingen andel med avvikelse, eftersom
    andelen då saknar nämnare.
    """

    name: str
    fte: Optional[float] = None
    fte_needed: Optional[float] = None
    hourly_rate: Optional[int] = None
    hourly_rate_noncompliance: Optional[int] = None
    fees_invoiced: Optional[int] = None
    facilities: Optional[int] = None
    share_controlled: Optional[int] = None
    planned: Optional[int] = None
    follow_up: Optional[int] = None
    event_driven: Optional[int] = None
    controls: Optional[int] = None
    with_deviation: Optional[int] = None
    share_with_deviation: Optional[int] = None


# ---------------------------------------------------------------------------
# Tabelläsning
# ---------------------------------------------------------------------------


def _squash(text: str) -> str:
    return " ".join(text.split())


def _clean(blocks: Iterable[Block]) -> List[Block]:
    return [b for b in blocks if _squash(b.text) not in _NOISE and b.text.strip()]


def _column(x: float, columns: Sequence[Tuple[str, float, float]]) -> Optional[str]:
    for name, lo, hi in columns:
        if lo <= x < hi:
            return name
    return None


def _number(raw: str) -> Optional[float]:
    """Läs ett tal ur en cell, eller None när cellen inte bär något.

    Tusental skrivs med blanksteg och decimaler med komma, båda enligt svensk
    standard. Procenttecknet är en etikett och inte en del av talet.
    """
    text = _squash(raw).replace(" ", " ").replace("%", "").strip()
    text = text.replace(" ", "").replace(",", ".")
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def _pages_with(blocks: Sequence[Block], heading: str) -> List[int]:
    needle = _squash(heading)
    pages: Dict[int, List[str]] = {}
    for b in blocks:
        pages.setdefault(b.page, []).append(b.text)
    return [p for p, parts in pages.items() if needle in _squash(" ".join(parts))]


def _table_pages(blocks: Sequence[Block], heading: str) -> List[int]:
    """Sidorna en bilaga sträcker sig över.

    Bilagan börjar på sidan där rubriken står och slutar när nästa bilaga
    börjar. Rubriken upprepas inte, men sidhuvudet gör det, så slutet hittas
    på nästa "Bilaga N." i stället för på rubrikens frånvaro.
    """
    starts = _pages_with(blocks, heading)
    if not starts:
        raise ReportFormatChanged(f"hittar ingen bilaga med rubriken {heading!r}")
    start = starts[0]

    following = sorted(
        p
        for p in {b.page for b in blocks}
        if p > start and _pages_with([b for b in blocks if b.page == p], "Bilaga ")
    )
    end = following[0] if following else max(b.page for b in blocks) + 1
    return list(range(start, end))


def _lines(blocks: Sequence[Block]) -> List[List[Block]]:
    """Textlöporna grupperade till rader, uppifrån och ner."""
    lines: List[List[Block]] = []
    for b in sorted(blocks, key=lambda b: (-b.y, b.x)):
        if lines and abs(lines[-1][0].y - b.y) <= _LINE_TOLERANCE:
            lines[-1].append(b)
        else:
            lines.append([b])
    return lines


#: Största höjdavstånd mellan två textlöpor som ändå tillhör samma cell. Ett
#: radbrott inne i en cell är omkring 13 punkter, avståndet mellan två
#: tabellrader minst 18.
_WRAP_GAP = 15.0


def _groups(blocks: Sequence[Block]) -> List[List[Block]]:
    """Löpor i en och samma kolumn, grupperade till celler."""
    groups: List[List[Block]] = []
    for line in _lines(blocks):
        if groups and abs(groups[-1][-1].y - line[0].y) <= _WRAP_GAP:
            groups[-1].extend(line)
        else:
            groups.append(list(line))
    return groups


def _body(
    blocks: Sequence[Block],
    columns: Sequence[Tuple[str, float, float]],
) -> List[Block]:
    """Sidans tabellrader, utan kolumnrubrik och sidfot.

    Båda skulle annars dras in i närmaste tabellrad, eftersom raderna binds
    ihop av närhet i höjdled och inte av linjer i dokumentet. Sidfoten känns
    igen på sin text. Kolumnrubriken går inte att känna igen på sin text utan
    att skriva av varje rubrikord för varje årgång, men den har en egenskap
    ingen tabellrad har: den innehåller inga tal. Rubriken är alltså sidans
    inledande rader fram till den första raden som bär ett tal.
    """
    footer = max(
        (b.y for b in blocks if _FOOTER.search(b.text)),
        default=float("-inf"),
    )
    above_footer = [b for b in blocks if b.y > footer + _LINE_TOLERANCE]

    numeric = {name for name, _, _ in columns if name != "authority"}
    lines = _lines(above_footer)
    for index, line in enumerate(lines):
        if any(
            _column(b.x, columns) in numeric and _number(b.text) is not None
            for b in line
        ):
            return [b for rest in lines[index:] for b in rest]
    return []


def _rows(
    blocks: Sequence[Block],
    columns: Sequence[Tuple[str, float, float]],
    anchor: str,
) -> List[Dict[str, str]]:
    """Gruppera en sidas textlöpor till tabellrader.

    Ankaret är den första talkolumnen, som varje myndighet har ett värde i.
    Varje ankarcell öppnar en rad, och övriga celler hamnar i den rad vars
    ankare står NÄRMAST i höjdled. Det är det som gör att ett myndighetsnamn
    som brutits över tre rader ändå hittar sina tal: namnets löpor ligger på
    egna y-värden, men närmast sitt eget ankare.
    """
    anchors: List[float] = sorted(
        (b.y for b in blocks if _column(b.x, columns) == anchor and _number(b.text) is not None),
        reverse=True,
    )
    if not anchors:
        return []

    cells: Dict[float, Dict[str, List[Block]]] = {y: {} for y in anchors}

    def place(column: str, parts: List[Block], y: float) -> None:
        nearest = min(anchors, key=lambda a: abs(a - y))
        cells[nearest].setdefault(column, []).extend(parts)

    for b in blocks:
        column = _column(b.x, columns)
        if column is None or column == "authority":
            continue
        place(column, [b], b.y)

    # Myndighetsnamnet placeras som HELHET och inte löpa för löpa. Ett namn som
    # brutits över tre rader står centrerat kring sitt eget tal, alltså med en
    # löpa ovanför talet och en under. Placeras de var för sig hamnar den
    # översta hos raden ovanför när radavståndet är knappt, och "Båstad" blir
    # "BåstadDalslands miljö- och". Löpor som står tätare än ett radavstånd hör
    # till samma namn, och gruppen som helhet hör till närmaste tal.
    for group in _groups([b for b in blocks if _column(b.x, columns) == "authority"]):
        middle = (max(b.y for b in group) + min(b.y for b in group)) / 2
        place("authority", group, middle)

    rows: List[Dict[str, str]] = []
    for y in anchors:
        row: Dict[str, str] = {}
        for column, parts in cells[y].items():
            # Namnkolumnen läses uppifrån och ner, talkolumnerna vänster till
            # höger. Ett namn som brutits står på flera y, ett tal aldrig.
            ordered = sorted(parts, key=lambda b: (-b.y, b.x))
            row[column] = _squash("".join(p.text for p in ordered))
        rows.append(row)
    return rows


def _read_table(
    blocks: Sequence[Block],
    heading: str,
    columns: Sequence[Tuple[str, float, float]],
    anchor: str,
) -> Dict[str, Dict[str, float]]:
    values: Dict[str, Dict[str, float]] = {}
    for page in _table_pages(blocks, heading):
        page_blocks = _body(_clean([b for b in blocks if b.page == page]), columns)
        for row in _rows(page_blocks, columns, anchor):
            name = row.get("authority", "").strip()
            if not name or _NOT_AUTHORITY.match(name):
                continue
            parsed = {
                column: _number(row[column])
                for column, _, _ in columns
                if column != "authority" and column in row
            }
            values[name] = {k: v for k, v in parsed.items() if v is not None}
    return values


def parse(document: bytes, report: Report) -> Dict[str, Authority]:
    """Läs en rapports två bilagor till en rad per kontrollmyndighet."""
    blocks = extract_blocks(document)
    if not blocks:
        raise ReportFormatChanged("PDF:en gav ingen text alls")

    conditions = _read_table(
        blocks, report.conditions_heading, _CONDITIONS_COLUMNS, "fte"
    )
    controls = _read_table(
        blocks, report.controls_heading, _CONTROLS_COLUMNS, "facilities"
    )

    # Rapporten har omkring 250 kontrollmyndigheter: 290 kommuner varav en del
    # gått samman i förbund och gemensamma nämnder. Ett utfall långt under det
    # betyder att tabellen inte lästs, inte att myndigheterna blivit färre.
    if len(controls) < 200 or len(conditions) < 200:
        raise ReportFormatChanged(
            f"läste {len(conditions)} myndigheter i förutsättningstabellen och "
            f"{len(controls)} i kontrolltabellen, väntade minst 200 i vardera"
        )

    out: Dict[str, Authority] = {}
    for name in sorted(set(conditions) | set(controls)):
        row = {**conditions.get(name, {}), **controls.get(name, {})}
        out[name] = Authority(
            name=name,
            fte=row.get("fte"),
            fte_needed=row.get("fte_needed"),
            hourly_rate=_as_int(row.get("hourly_rate")),
            hourly_rate_noncompliance=_as_int(row.get("hourly_rate_noncompliance")),
            fees_invoiced=_as_int(row.get("fees_invoiced")),
            facilities=_as_int(row.get("facilities")),
            share_controlled=_as_int(row.get("share_controlled")),
            planned=_as_int(row.get("planned")),
            follow_up=_as_int(row.get("follow_up")),
            event_driven=_as_int(row.get("event_driven")),
            controls=_as_int(row.get("controls")),
            with_deviation=_as_int(row.get("with_deviation")),
            share_with_deviation=_as_int(row.get("share_with_deviation")),
        )
    return out


def _as_int(value: Optional[float]) -> Optional[int]:
    return None if value is None else int(round(value))
