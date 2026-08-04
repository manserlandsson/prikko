"""Tester för läsningen av Livsmedelsverkets myndighetsrapportering.

Blocken nedan är verkliga x- och y-positioner ur "Sveriges livsmedelskontroll
2024" (L 2025 nr 13), sidan 136 och 122, avskrivna med `extract_blocks`. De
läggs som Block-objekt i stället för att en 7 MB PDF versionshanteras.

Fyra fall som alla har kostat en felläsning en gång, och som därför har varje
sitt test: sidfoten, kolumnrubriken, ett myndighetsnamn som brutits över tre
rader, och en cell som är tom i rapporten.

Kör:  python3 pipeline/tests/test_livsmedelsverket.py
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.pdf import Block  # noqa: E402
from prikko.sources.livsmedelsverket import (  # noqa: E402
    _CONDITIONS_COLUMNS,
    _CONTROLS_COLUMNS,
    _body,
    _rows,
)

PAGE = 136


def blocks(*rows) -> list:
    """Rader på formen (y, [(x, text), ...])."""
    return [
        Block(page=PAGE, x=x, y=y, text=text)
        for y, cells in rows
        for x, text in cells
    ]


# Kolumnrubriken, som står högst upp på varje sida i tabellen och sträcker sig
# över fyra radhöjder. Ingen av dem bär ett tal.
CONTROLS_HEADER = (
    (511.5, [(74.0, "Myndighet"), (201.4, "Antal "), (273.1, "Andel "),
             (350.2, "Antal "), (416.7, "Antal "), (488.5, "Antal "),
             (560.2, "Totalt antal "), (632.0, "Antal "), (703.8, "Andel ")]),
    (498.0, [(201.4, "verksam"), (273.1, "kontrollerade"), (350.2, "planerade "),
             (416.7, "uppföljande "), (488.5, "händelse"), (560.2, "kontroller"),
             (632.0, "kontroller "), (703.8, "kontroller ")]),
    (485.0, [(201.4, "heter"), (273.1, "verksamheter"), (350.2, "kontroller"),
             (416.7, "kontroller"), (488.5, "styrda "), (632.0, "med "),
             (703.8, "med ")]),
    (471.0, [(488.5, "kontroller"), (632.0, "avvikelse"), (703.8, "avvikelse")]),
)

# Sidfoten. Sidnumret står i myndighetskolumnen och resten mitt på sidan, så
# utan att foten skiljs bort hamnar båda i sidans understa tabellrad.
CONTROLS_FOOTER = (
    (44.5, [(70.9, "137"), (332.6, "LIVSMEDELSVERKETS "),
            (429.5, "RAPPORTSERIE "), (498.9, "–"), (506.8, "L 20"),
            (525.1, "25"), (538.9, "NR "), (554.4, "13")]),
)


class BilagaKontroller(unittest.TestCase):
    def rows(self, *body):
        page = blocks(*CONTROLS_HEADER, *body, *CONTROLS_FOOTER)
        return _rows(_body(page, _CONTROLS_COLUMNS), _CONTROLS_COLUMNS, "facilities")

    def test_en_enkel_rad_lases_kolumn_for_kolumn(self):
        rows = self.rows(
            (453.0, [(74.0, "Borås"), (225.5, "931"), (297.3, "53"), (311.3, "%"),
                     (371.7, "481"), (440.9, "197"), (512.6, "207"),
                     (584.4, "885"), (656.1, "221"), (725.3, "25 %")]),
        )
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["authority"], "Borås")
        self.assertEqual(rows[0]["facilities"], "931")
        self.assertEqual(rows[0]["share_controlled"], "53%")
        self.assertEqual(rows[0]["follow_up"], "197")
        self.assertEqual(rows[0]["share_with_deviation"], "25 %")

    def test_kolumnrubriken_hamnar_inte_i_forsta_raden(self):
        # Rubriken står ovanför den översta tabellraden och ligger närmast
        # dess tal. Fångades genom att första myndigheten på varje sida hette
        # "MyndighetUppsala" och att timtaxan bar sin egen rubriktext.
        rows = self.rows(
            (453.0, [(74.0, "Borås"), (225.5, "931"), (297.3, "53"), (311.3, "%"),
                     (371.7, "481"), (440.9, "197"), (512.6, "207"),
                     (584.4, "885"), (656.1, "221"), (725.3, "25 %")]),
        )
        self.assertEqual(rows[0]["authority"], "Borås")

    def test_sidfoten_hamnar_inte_i_understa_raden(self):
        # Fångades genom att Jönköping hette "Jönköping138" och att dess
        # totalsumma blev "119713", alltså 1 197 med sidhuvudets 13 påklistrat.
        rows = self.rows(
            (85.8, [(74.0, "Jönköping"), (221.4, "1 347"), (297.3, "55"),
                    (311.3, "%"), (371.7, "753"), (440.9, "287"),
                    (512.6, "157"), (581.5, "1197"), (656.1, "296"),
                    (725.3, "25 %")]),
        )
        self.assertEqual(rows[0]["authority"], "Jönköping")
        self.assertEqual(rows[0]["controls"], "1197")

    def test_ett_brutet_myndighetsnamn_stannar_hos_sin_egen_rad(self):
        # Dalslands namn står på tre rader centrerade kring sitt eget tal, och
        # den översta av dem ligger närmare Båstads tal än sitt eget. Utan att
        # namnet placeras som en helhet blir Båstad "BåstadDalslands miljö-".
        rows = self.rows(
            (350.0, [(74.0, "Båstad"), (225.5, "220"), (297.3, "50"), (311.3, "%"),
                     (371.7, "105"), (443.8, "17"), (515.6, "19"),
                     (584.4, "141"), (659.1, "40"), (725.3, "28 %")]),
            (332.0, [(74.0, "Dalslands miljö"), (152.3, "-"), (158.2, "och ")]),
            (319.0, [(74.0, "energiförbund "), (225.5, "386"), (297.3, "31"),
                     (311.3, "%"), (371.7, "127"), (443.8, "29"), (518.5, "5"),
                     (584.4, "161"), (659.1, "32"), (725.3, "20 %")]),
            (306.0, [(74.0, "Bengtsfors Dals-Ed ")]),
        )
        by_name = {r["authority"]: r for r in rows}
        self.assertIn("Båstad", by_name)
        self.assertEqual(by_name["Båstad"]["facilities"], "220")
        self.assertEqual(
            "Dalslands miljö-och energiförbund Bengtsfors Dals-Ed",
            next(n for n in by_name if n.startswith("Dalslands")),
        )

    def test_en_tom_cell_ger_ingen_nyckel(self):
        # En kommun utan utförd kontroll får ingen andel med avvikelse, för
        # andelen saknar nämnare. Cellen är tom i rapporten och ska förbli det
        # hos oss, inte bli en nolla.
        rows = self.rows(
            (453.0, [(74.0, "Arjeplog"), (228.5, "74"), (300.3, "0"), (311.3, "%"),
                     (377.7, "0"), (446.8, "0"), (518.5, "0"), (587.4, "0"),
                     (662.0, "0")]),
        )
        self.assertNotIn("share_with_deviation", rows[0])
        self.assertEqual(rows[0]["facilities"], "74")


CONDITIONS_HEADER = (
    (512.5, [(76.6, "Myndighet"), (244.6, "Årsarbetskrafter "),
             (347.2, "Resursbehov "), (453.2, "Timtaxa vid "),
             (553.1, "Timtaxa vid kontroll "), (656.7, "Fakturerade avgifter ")]),
    (500.0, [(244.6, "livsmedel"), (347.2, "årsarbetskrafter "),
             (453.2, "planerad kontroll "), (553.1, "av bristande "),
             (656.7, "(kronor)")]),
)


class BilagaForutsattningar(unittest.TestCase):
    def test_tusental_med_blanksteg_lases_som_ett_tal(self):
        page = blocks(
            *CONDITIONS_HEADER,
            (470.0, [(76.6, "Stockholm"), (281.1, "54"), (388.0, "54"),
                     (486.1, "1 720"), (587.7, "1 720"), (683.4, "43 691 000")]),
        )
        rows = _rows(_body(page, _CONDITIONS_COLUMNS), _CONDITIONS_COLUMNS, "fte")
        self.assertEqual(rows[0]["authority"], "Stockholm")
        self.assertEqual(rows[0]["fte"], "54")
        self.assertEqual(rows[0]["fees_invoiced"], "43 691 000")

    def test_decimaler_skrivs_med_komma(self):
        page = blocks(
            *CONDITIONS_HEADER,
            (470.0, [(76.6, "Jönköping"), (281.1, "9,17"), (385.4, "10,8"),
                     (486.1, "1 586"), (587.7, "1 586"), (683.4, "4 144 845")]),
        )
        rows = _rows(_body(page, _CONDITIONS_COLUMNS), _CONDITIONS_COLUMNS, "fte")
        self.assertEqual(rows[0]["fte"], "9,17")


if __name__ == "__main__":
    unittest.main(verbosity=2)
