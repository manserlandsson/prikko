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
gör INTE layoutanalys: den vet inget om kolumner, tabeller eller var på sidan
en rad står. Det räcker för rapporter med löpande text och rubriker, och det
räcker inte för en PDF vars innehåll bara går att förstå ur sin placering.

Tre begränsningar som är värda att känna till innan modulen återanvänds:

1. **Bara Flate-komprimerade strömmar.** LZW, RunLength och okomprimerade
   strömmar hoppas över. Samtliga 224 rapporter från Svenljunga är Flate.
2. **Bara enkelbyte-teckenkodning.** Text i Type0/CID-teckensnitt kommer ut
   som skräp, eftersom byten då är glyfnummer och kräver rapportens egen
   ToUnicode-tabell. I Svenljungas rapporter används CID-teckensnittet bara
   till symboler i marginalen, inte till brödtext.
3. **Ingen kryptering.** En lösenordsskyddad eller krypterad PDF ger tom text.

Var och en av begränsningarna ger TOM eller TRASIG text, aldrig felaktig text
som ser rimlig ut. Det är den viktiga egenskapen: anroparen kan kontrollera
att rapporten innehåller de rubriker den ska innehålla och vägra tolka den
annars, i stället för att tyst få ett halvt resultat.
"""

from __future__ import annotations

import re
import zlib
from typing import Iterator, List

#: Objektets ordlista står mellan "N 0 obj" och "stream". Den behövs för att
#: skilja innehållsströmmar från teckensnittsfiler och bilder.
_OBJECT = re.compile(rb"\d+\s+\d+\s+obj\b(.{0,2000}?)\bstream\r?\n", re.S)

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

#: Innehållsströmmens tokens: en sträng, ett tal, eller en textoperator.
_TOKEN = re.compile(
    rb"(\((?:\\.|[^()\\])*\))|(-?\d+(?:\.\d+)?)|(BT|ET|TJ|Tj|TD|Td|T\*|Tm|'|\")",
    re.S,
)

_OCTAL = re.compile(rb"\\([0-7]{1,3})")

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


def content_streams(document: bytes) -> Iterator[bytes]:
    """Ge de uppackade strömmar som ser ut att vara sidinnehåll."""
    for match in _OBJECT.finditer(document):
        if any(marker in match.group(1) for marker in _NOT_CONTENT):
            continue
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
        if b"BT" in data and (b"Tj" in data or b"TJ" in data):
            yield data


def extract_lines(document: bytes) -> List[str]:
    """Läs ut rapportens textrader, i den ordning de står i filen.

    Varje rad är normaliserad på blanksteg. Tomma rader utelämnas: de bär
    ingen information och gör bara mönstren i anroparen skörare.
    """
    lines: List[str] = []
    for data in content_streams(document):
        current = ""
        for match in _TOKEN.finditer(data):
            text, number, operator = match.groups()
            if text is not None:
                current += _unescape(text)
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


def extract_text(document: bytes) -> str:
    """Hela rapporten som en sträng, med radbrytningar mellan raderna."""
    return "\n".join(extract_lines(document))
