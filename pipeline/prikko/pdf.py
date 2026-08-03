"""Textutvinning ur PDF, utan tredjepartsberoenden.

Svenljunga publicerar hela kontrollrapporten som PDF och ingenting annat —
varken färg, sammanfattning eller resultatfält finns i HTML. Utan att läsa
rapporten går det alltså inte att bygga adaptern alls.

Samma regel gäller här som för `geo.py`: pipelinen ska kunna köras i en tom
GitHub Actions-container. Det utesluter pypdf, pdfminer och pdfplumber, som
alla hade krävt ett installationssteg i arbetsflödet. `zlib` finns i
standardbiblioteket, och de rapporter vi läser är genererade av ett
ärendesystem, inte inskannade.

## Vad modulen gör, och inte gör

Den plockar ut TEXT, i den ordning strängarna står i innehållsströmmen. Den
gör INTE layoutanalys: den tolkar inte kolumner och slår inte ihop celler.
Det räcker för rapporter med löpande text och rubriker, och det räcker inte
för en PDF vars innehåll bara går att förstå ur sin placering.

För det senare finns `extract_blocks`, som lämnar ut varje textlöpas SIDA, X
och Y tillsammans med texten. Tolkningen av vad en x-position betyder hör
hemma hos den som känner dokumentet — Borgholms tabell vet vilka sex
kolumner den har, modulen kan omöjligt veta det.

Tre begränsningar som är värda att känna till innan modulen återanvänds:

1. **Bara Flate-komprimerade strömmar.** LZW, RunLength och okomprimerade
   strömmar hoppas över. Samtliga 224 rapporter från Svenljunga är Flate.
2. **Teckensnittens ToUnicode-tabeller slås ihop till EN tabell per
   dokument.** Rätt väg vore att slå upp vilket teckensnitt varje textlöpa
   använder och avkoda mot just dess tabell, men det kräver att indirekta
   referenser och sidans resursordlista löses upp — en riktig PDF-läsare.
   Genvägen håller så länge dokumentets subsetade teckensnitt inte ger olika
   betydelse åt samma kod. Det kontrolleras vid inläsningen: krockar en kod
   används ingen tabell alls, och texten blir tom i stället för fel.
3. **Ingen kryptering.** En lösenordsskyddad eller krypterad PDF ger tom text.

Var och en av begränsningarna ger TOM eller TRASIG text, aldrig felaktig text
som ser rimlig ut. Det är den viktiga egenskapen: anroparen kan kontrollera
att rapporten innehåller de rubriker den ska innehålla och vägra tolka den
annars, i stället för att tyst få ett halvt resultat.
"""

from __future__ import annotations

import re
import zlib
from dataclasses import dataclass
from typing import Dict, Iterator, List

#: Strömmens början. Ordlistan som beskriver den står strax före, mellan
#: objektets `obj` och `stream`, och plockas ut genom att söka bakåt — se
#: `_streams`. Att i stället matcha framåt från `obj` går inte: ett objekt
#: utan ström (dokumentets katalog, till exempel) fångas då tillsammans med
#: nästa objekts ström, och katalogens `/Metadata` får hela sidan att se ut
#: som något annat än sidinnehåll.
_STREAM = re.compile(rb"stream\r?\n")

#: Så långt bakåt vi letar efter objektets ordlista. En sidordlista med
#: teckensnitt och XObject blir sällan mer än ett par kilobyte.
_HEADER_WINDOW = 3000

#: Strömmar som inte är sidinnehåll. Ett inbäddat teckensnitt dekomprimeras
#: utan problem och innehåller byten som ser ut som text — utan det här
#: filtret hamnar hela glyftabeller mitt i rapporten.
_NOT_CONTENT = (
    b"/Image",
    b"/FontFile",
    b"/Length1",   # teckensnittsprogram
    b"/ObjStm",
    b"/XRef",
    b"/Metadata",
)

#: Innehållsströmmens tokens: en sträng inom parenteser, en hexsträng, ett
#: tal, eller en textoperator.
#:
#: Hexsträngen kräver minst en hexsiffra direkt efter `<`, så mönstret kan
#: aldrig råka fånga en ordlista (`<</Filter…>>`).
_TOKEN = re.compile(
    rb"(\((?:\\.|[^()\\])*\))"
    rb"|<([0-9A-Fa-f][0-9A-Fa-f\s]*)>"
    rb"|(-?\d+(?:\.\d+)?)"
    rb"|(BT|ET|TJ|Tj|TD|Td|T\*|Tm|'|\")",
    re.S,
)

_OCTAL = re.compile(rb"\\([0-7]{1,3})")

#: ToUnicode-tabellernas två former. `bfchar` mappar en kod i taget,
#: `bfrange` ett intervall.
_CMAP_BFCHAR = re.compile(rb"beginbfchar(.*?)endbfchar", re.S)
_CMAP_BFRANGE = re.compile(rb"beginbfrange(.*?)endbfrange", re.S)
_CMAP_PAIR = re.compile(rb"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]*)>")
_CMAP_TRIPLE = re.compile(rb"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>")

#: Operatorer som flyttar textmarkören till en ny rad eller avslutar ett
#: textblock. De blir radbrytningar; utan dem klistras rubriker ihop med
#: brödtexten och rapporten går inte att läsa styckvis.
_BREAKS = (b"Td", b"TD", b"T*", b"Tm", b"ET", b"'", b'"')

#: Kerning i en TJ-array anges i tusendels teckenbredd, negativt för
#: mellanrum. Under det här värdet är glappet ett mellanslag och inte bara
#: knipning mellan två bokstäver. Gränsen är satt mot Svenljungas rapporter:
#: vid -120 hålls "Caesar Restaurang" isär utan att "avvikelser" blir
#: "avvi kelser".
_SPACE_KERN = -120.0


def _unescape(raw: bytes) -> str:
    """Avkoda en PDF-sträng till text.

    Escaperna följer PDF-specen: oktala byten, samt de fem tecken som måste
    skrivas med omvänt snedstreck. Byten tolkas som cp1252, vilket är
    WinAnsiEncoding — den kodning svenska ärendesystem skriver.
    """
    body = raw[1:-1]
    body = _OCTAL.sub(lambda m: bytes([int(m.group(1), 8) & 0xFF]), body)
    body = body.replace(b"\\(", b"(").replace(b"\\)", b")")
    body = body.replace(b"\\n", b"\n").replace(b"\\r", b"").replace(b"\\t", b"\t")
    body = body.replace(b"\\\\", b"\\")
    return body.decode("cp1252", "replace")


def _streams(document: bytes) -> Iterator[tuple]:
    """Ge (ordlista, uppackad ström) för varje Flate-packad ström."""
    for match in _STREAM.finditer(document):
        window = document[max(0, match.start() - _HEADER_WINDOW):match.start()]
        cut = window.rfind(b"obj")
        header = window[cut:] if cut >= 0 else window

        start = match.end()
        end = document.find(b"endstream", start)
        if end < 0:
            continue
        try:
            data = zlib.decompress(document[start:end])
        except zlib.error:
            # Okomprimerad, LZW-kodad eller trasig. Hellre ingen text än
            # slumpbyten som ser ut som text.
            continue
        yield header, data


def tounicode(document: bytes) -> Dict[int, str]:
    """Slå ihop dokumentets ToUnicode-tabeller till en.

    Returnerar en tom tabell när dokumentet saknar sådana, och ÄVEN när två
    teckensnitt ger samma kod olika betydelse. Det senare är genvägens enda
    verkliga risk, och en tom tabell betyder tom text — inte fel text.
    """
    mapping: Dict[int, str] = {}
    for _, data in _streams(document):
        if b"begincmap" not in data:
            continue
        for block in _CMAP_BFCHAR.findall(data):
            for source, target in _CMAP_PAIR.findall(block):
                code = int(source, 16)
                text = "".join(
                    chr(int(target[i:i + 4], 16)) for i in range(0, len(target), 4)
                )
                if mapping.setdefault(code, text) != text:
                    return {}
        for block in _CMAP_BFRANGE.findall(data):
            for low, high, target in _CMAP_TRIPLE.findall(block):
                base = int(target, 16)
                for step, code in enumerate(range(int(low, 16), int(high, 16) + 1)):
                    text = chr(base + step)
                    if mapping.setdefault(code, text) != text:
                        return {}
    return mapping


def _from_hex(raw: bytes, mapping: Dict[int, str]) -> str:
    """Avkoda en hexsträng.

    Med en ToUnicode-tabell läses byten parvis som teckenkoder, vilket är vad
    ett Type0-teckensnitt skriver. Utan tabell läses de som enkla byten.
    Okända koder blir tomma i stället för ersättningstecken: en lucka syns
    inte i en fras vi letar efter, men ett tecken vi hittat på kan förstöra
    den.
    """
    digits = re.sub(rb"\s", b"", raw)
    if len(digits) % 2:
        digits += b"0"
    data = bytes.fromhex(digits.decode("ascii"))
    if not mapping:
        return data.decode("cp1252", "replace")
    return "".join(
        mapping.get(int.from_bytes(data[i:i + 2], "big"), "")
        for i in range(0, len(data) - 1, 2)
    )


def content_streams(document: bytes) -> Iterator[bytes]:
    """Ge de uppackade strömmar som ser ut att vara sidinnehåll."""
    for header, data in _streams(document):
        if any(marker in header for marker in _NOT_CONTENT):
            continue
        if b"BT" in data and (b"Tj" in data or b"TJ" in data):
            yield data


@dataclass(frozen=True)
class Block:
    """En textlöpa med sin plats på sidan.

    `text` är RÅ: inledande och avslutande blanksteg är kvar. De bär
    information i en tabell — en cell som bryts mitt i ett ord slutar utan
    blanksteg, en som bryts mellan två ord slutar med. Utan den skillnaden
    blir "Bageri/ko" plus "nditori" antingen "Bageri/ko nditori" eller
    "Äppelträdets Bed &Breakfast", och båda är fel.
    """

    page: int
    #: Textlöpans vänsterkant och baslinje i PDF-punkter. Y ökar UPPÅT, så en
    #: rad längre ned på sidan har ett lägre värde.
    x: float
    y: float
    text: str


def extract_blocks(document: bytes) -> List[Block]:
    """Läs ut varje textlöpa med sida, x, y och rå text.

    Positionen kommer ur textmatrisen (`Tm`) och de relativa förflyttningarna
    (`Td`, `TD`). Modulen tolkar inte vad positionen betyder — se modulens
    inledning.
    """
    mapping = tounicode(document)
    blocks: List[Block] = []

    for page, data in enumerate(content_streams(document)):
        numbers: List[float] = []
        current = ""
        x = y = 0.0

        def flush() -> None:
            nonlocal current
            if current.strip():
                blocks.append(Block(page=page, x=round(x, 1), y=round(y, 1),
                                    text=current))
            current = ""

        for match in _TOKEN.finditer(data):
            text, hexed, number, operator = match.groups()
            if text is not None:
                current += _unescape(text)
                continue
            if hexed is not None:
                current += _from_hex(hexed, mapping)
                continue
            if number is not None:
                numbers.append(float(number))
                continue

            if operator == b"Tm" and len(numbers) >= 6:
                flush()
                x, y = numbers[-2], numbers[-1]
            elif operator in (b"Td", b"TD") and len(numbers) >= 2:
                flush()
                x += numbers[-2]
                y += numbers[-1]
            elif operator in _BREAKS:
                flush()
            elif operator in (b"TJ", b"Tj"):
                # Kerningtalen inne i en TJ-array är inte förflyttningar.
                pass
            numbers = []

        flush()

    return blocks


def extract_lines(document: bytes) -> List[str]:
    """Läs ut rapportens textrader, i den ordning de står i filen.

    Varje rad är normaliserad på blanksteg. Tomma rader utelämnas: de bär
    ingen information och gör bara mönstren i anroparen skörare.
    """
    mapping = tounicode(document)
    lines: List[str] = []
    for data in content_streams(document):
        current = ""
        for match in _TOKEN.finditer(data):
            text, hexed, number, operator = match.groups()
            if text is not None:
                current += _unescape(text)
            elif hexed is not None:
                current += _from_hex(hexed, mapping)
            elif number is not None:
                if current and float(number) < _SPACE_KERN:
                    current += " "
            elif operator in _BREAKS:
                collapsed = " ".join(current.split())
                if collapsed:
                    lines.append(collapsed)
                current = ""
        collapsed = " ".join(current.split())
        if collapsed:
            lines.append(collapsed)
    return lines


def join_wrapped(parts: List[str]) -> str:
    """Slå ihop en cells radbrutna löpor till en text.

    En cell som bryts mellan två ord slutar med blanksteg, en som bryts mitt
    i ett ord gör det inte. Regeln är alltså inte en gissning utan källans
    egen: `"Bageri/ko" + "nditori"` blir `Bageri/konditori`, medan
    `"Äppelträdets Bed & " + "Breakfast"` blir `Äppelträdets Bed & Breakfast`.
    """
    return " ".join("".join(parts).split())


def extract_text(document: bytes) -> str:
    """Hela rapporten som en sträng, med radbrytningar mellan raderna."""
    return "\n".join(extract_lines(document))
