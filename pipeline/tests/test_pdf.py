"""Tester för PDF-textutvinningen.

Innehållsströmmen är verkliga operatorbyten, kopierade ur Svenljunga kommuns
kontrollrapport för Caesar Restaurang 2026-03-26. Den läggs i en minimal
PDF-behållare i stället för att en 300 kB-fil versionshanteras.

Kör:  python3 pipeline/tests/test_pdf.py
"""

import sys
import unittest
import zlib
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.pdf import (  # noqa: E402
    content_streams,
    extract_lines,
    extract_text,
    tounicode,
)

# Verkliga byten ur rapportens första sida. Notera tre saker som är hela
# skälet till att modulen ser ut som den gör: texten kommer i småbitar
# ([(M)-5.995 (e)-3.01 (d)15 (de)…]TJ), bokstäverna med accent skrivs oktalt
# (\366 = ö), och varje bit står i ett eget BT…ET-block.
REAL_CONTENT = (
    b"/Artifact <</Attached [/Top ]/Subtype /Header /Type /Pagination >>BDC  q "
    b"42.48 726.58 282.43 87.024 re W* n BT /GS0 gs /TT0 8.04 Tf 133.1 731.02 Td "
    b"( )Tj ET Q q 324.91 726.58 228.02 87.024 re W* n BT /TT0 8.04 Tf 510.82 "
    b"805.92 Td [(M)-5.995 (e)-3.01 (d)15 (de)-3.993 (l)7.002 (and)15.995 (e)]TJ "
    b"ET Q q BT /TT0 10.0 Tf 42.48 700.00 Td [(D)-2 (\\366)5 (b)3 (eln)2 "
    b"(sg)-1 (a)4 (tan 1)2 (4)]TJ ET Q q BT /TT0 10.0 Tf 42.48 680.00 Td "
    b"[(Resultat av kontrollen)]TJ ET Q"
)

# Ett teckensnittsprogram packar upp lika bra som en innehållsström och
# innehåller byten som ser ut som text. Utan filtret hamnar hela glyftabeller
# mitt i rapporten.
FONT_PROGRAM = b"BT (E:\\261 -, E\\260%Ead\\260PQXED!!Y-,) Tj ET"


# Verklig ToUnicode-tabell ur Kristinehamns kontrollrapport för Stora Coop
# 2024-11-18, förkortad. Koderna är glyfnummer i ett subsatt teckensnitt och
# säger ingenting utan tabellen: utan den blir "Dnr" till "'QU".
REAL_CMAP = (
    b"/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n"
    b"/CMapName /DEVEXP def\n/CMapType 2 def\n"
    b"1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n"
    b"6 beginbfchar\n<0027> <0044>\n<0051> <006E>\n<0055> <0072>\n"
    b"<0010> <002D>\n<007C> <00F6>\n<0044> <0061>\nendbfchar\nendcmap\n"
)

# Verkliga operatorbyten ur samma rapport: hexsträngar i stället för
# parenteser, eftersom texten skrivs med ett Type0-teckensnitt.
HEX_CONTENT = b"BT /FNT0 10 Tf 42 700 Td [ <0027005100550010007C0044> ] TJ ET"


def pdf(*objects) -> bytes:
    """Sätt ihop en minimal PDF av (ordlista, ström)-par."""
    out = b"%PDF-1.6\n"
    for number, (header, payload) in enumerate(objects, start=1):
        packed = zlib.compress(payload)
        out += (
            b"%d 0 obj\n<<%s/Filter/FlateDecode/Length %d>>\nstream\n"
            % (number, header, len(packed))
        )
        out += packed + b"\nendstream\nendobj\n"
    return out + b"%%EOF\n"


class ContentStreams(unittest.TestCase):
    def test_a_page_stream_is_read(self):
        self.assertEqual(len(list(content_streams(pdf((b"", REAL_CONTENT))))), 1)

    def test_an_embedded_font_is_not_read_as_text(self):
        # /Length1 anger teckensnittsprogrammets längd och finns bara på
        # teckensnittsfiler.
        document = pdf((b"/Length1 6144", FONT_PROGRAM), (b"", REAL_CONTENT))
        self.assertEqual(len(list(content_streams(document))), 1)

    def test_an_image_is_not_read_as_text(self):
        document = pdf((b"/Subtype/Image", FONT_PROGRAM), (b"", REAL_CONTENT))
        self.assertEqual(len(list(content_streams(document))), 1)

    def test_a_stream_that_is_not_flate_is_skipped_rather_than_guessed(self):
        # 45 av Svenljungas 224 rapporter är inskannade bilder utan textlager.
        # De ska ge TOM text, aldrig slumpbyten som ser ut som en rapport.
        broken = b"%PDF-1.6\n1 0 obj\n<</Length 9>>\nstream\nBT(x)TjET\nendstream\n"
        self.assertEqual(extract_text(broken), "")


class Lines(unittest.TestCase):
    def test_octal_escapes_become_swedish_letters(self):
        # \366 är ö i WinAnsi. Utan avkodningen blir "Döbelnsgatan" till
        # "D?belnsgatan" och varje fras med å, ä eller ö slutar matcha.
        self.assertIn("Döbelnsgatan 14", extract_lines(pdf((b"", REAL_CONTENT))))

    def test_text_split_across_kerning_pieces_is_joined(self):
        # Källan skriver ordet en bokstav i taget:
        # [(M)-5.995 (e)-3.01 (d)15 (de)-3.993 (l)7.002 (and)15.995 (e)]TJ
        self.assertIn("Meddelande", extract_lines(pdf((b"", REAL_CONTENT))))

    def test_each_text_block_becomes_its_own_line(self):
        lines = extract_lines(pdf((b"", REAL_CONTENT)))
        self.assertEqual(
            lines, ["Meddelande", "Döbelnsgatan 14", "Resultat av kontrollen"]
        )

    def test_empty_strings_do_not_become_lines(self):
        # Rapporten är full av ( )Tj som bara flyttar markören.
        self.assertNotIn("", extract_lines(pdf((b"", REAL_CONTENT))))

    def test_a_document_without_text_gives_nothing_not_an_error(self):
        self.assertEqual(extract_lines(b"%PDF-1.6\n%%EOF\n"), [])


class ToUnicode(unittest.TestCase):
    """Kristinehamns rapporter skriver all text som glyfnummer."""

    def test_the_table_is_read_from_the_cmap_stream(self):
        mapping = tounicode(pdf((b"", REAL_CMAP), (b"", HEX_CONTENT)))
        self.assertEqual(mapping[0x0027], "D")
        self.assertEqual(mapping[0x007C], "ö")

    def test_hex_strings_are_decoded_through_the_table(self):
        self.assertEqual(
            extract_lines(pdf((b"", REAL_CMAP), (b"", HEX_CONTENT))), ["Dnr-öa"]
        )

    def test_a_conflicting_table_is_discarded_whole_rather_than_guessed(self):
        # Två subsatta teckensnitt som ger samma kod olika betydelse är
        # genvägens enda verkliga risk. Sju av Kristinehamns 354 bilagor gör
        # det, och de blir tomma i stället för halvrätt lästa.
        other = REAL_CMAP.replace(b"<0027> <0044>", b"<0027> <0041>")
        self.assertEqual(tounicode(pdf((b"", REAL_CMAP), (b"", other))), {})

    def test_a_hex_string_without_a_table_is_read_as_plain_bytes(self):
        self.assertEqual(extract_lines(pdf((b"", b"BT (x) Tj <41427A> Tj ET"))),
                         ["xABz"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
