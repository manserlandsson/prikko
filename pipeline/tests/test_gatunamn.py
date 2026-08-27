"""Tester för gatunamnet ur adressen.

    python3 pipeline/tests/test_gatunamn.py

Fallen är inte påhittade. Varje adress i den här filen står ordagrant i minst
en av de tolv kommunernas datafiler, och de svåra fallen är de vi FAKTISKT
möter: orten i adressfältet i Borgholm, gatan utan nummer i Jönköping, gatan
inuti en parentes, och husnumret som klistrats fast vid gatan.

Det som prövas hårdast är NÄR VI SKA AVSTÅ. En ort som blir en gata lägger
"Byxelkrok" som gatuförslag i ett sökfält som redan erbjuder Byxelkrok som
område, och två rader som säger emot varandra är värre än en rad som saknas.

Sist ligger en snubbeltråd som läser site/src/lib/gatunamn.ts och jämför dess
`SUFFIX` med vår. De två filerna är en portning av varandra, och en ändelse
som läggs till på ena sidan ska aldrig kunna bli kvar där.
"""

import re
import sys
import unittest
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.gatunamn import (  # noqa: E402
    SUFFIX,
    TROSKEL,
    gatunamn,
    kanonisk,
    nyckel,
    rakna,
)

TS = (
    Path(__file__).resolve().parents[2]
    / "site" / "src" / "lib" / "gatunamn.ts"
)


class Vanliga(unittest.TestCase):
    """Formen 13 251 av 14 273 adresser har."""

    def test_gata_och_nummer(self):
        self.assertEqual(gatunamn("Kungsgatan 12"), "Kungsgatan")
        self.assertEqual(gatunamn("Sjukhusbacken 24"), "Sjukhusbacken")
        self.assertEqual(gatunamn("Ågesta Broväg 91"), "Ågesta Broväg")

    def test_bokstav_efter_numret(self):
        self.assertEqual(gatunamn("Hantverksgatan 17A"), "Hantverksgatan")
        self.assertEqual(gatunamn("Döbelnsgatan 2C"), "Döbelnsgatan")
        self.assertEqual(gatunamn("Postgatan 2 A"), "Postgatan")
        # Uppsala skriver två portar som en bokstavsföljd.
        self.assertEqual(gatunamn("Kungsgatan 66AB"), "Kungsgatan")

    def test_nummerintervall(self):
        self.assertEqual(gatunamn("Årstagatan 5-7"), "Årstagatan")

    def test_postorten_klipps(self):
        self.assertEqual(gatunamn("Odengatan 8A, Huskvarna"), "Odengatan")
        self.assertEqual(gatunamn("Blå pojkens väg 3, Påskallavik"), "Blå pojkens väg")

    def test_byadress_ar_en_adress(self):
        """`Västanå 4` är en belägenhetsadress, inte ett ortnamn.

        Numret är skillnaden. Lantmäteriets register är byggt likadant, och
        att kräva en gatuändelse hade tömt landsbygden på adresser.
        """
        self.assertEqual(gatunamn("Västanå 4, Gränna"), "Västanå")
        self.assertEqual(gatunamn("Agutarem 5, Bottnaryd"), "Agutarem")
        self.assertEqual(gatunamn("Myrö 912"), "Myrö")


class UtanNummer(unittest.TestCase):
    """De 31 rader där kommunen skrivit gatan utan husnummer."""

    def test_gatuandelse_racker(self):
        self.assertEqual(gatunamn("Västra Holmgatan"), "Västra Holmgatan")
        self.assertEqual(gatunamn("Rekrytvägen"), "Rekrytvägen")
        self.assertEqual(gatunamn("Kompanigatan"), "Kompanigatan")
        self.assertEqual(gatunamn("Ekhagsringen"), "Ekhagsringen")
        self.assertEqual(gatunamn("Hovrättstorget"), "Hovrättstorget")
        self.assertEqual(gatunamn("Ullstigen, Taberg"), "Ullstigen")


class Avstar(unittest.TestCase):
    """Raderna som INTE bär en gata. Alla står i beståndet."""

    def test_tomt(self):
        self.assertIsNone(gatunamn(None))
        self.assertIsNone(gatunamn(""))
        self.assertIsNone(gatunamn("   "))

    def test_orten_ar_ingen_gata(self):
        """439 rader i Borgholm, Höganäs och Svenljunga."""
        for ort in ("Räpplinge", "Byxelkrok", "Viken", "Kalv", "Färjestaden"):
            self.assertIsNone(gatunamn(ort), ort)
        self.assertIsNone(gatunamn("Bunn, Gränna"))
        self.assertIsNone(gatunamn("Hakarps Kyrkby, Huskvarna"))

    def test_byggnad_ar_ingen_gata(self):
        for hus in (
            "Länssjukhuset Ryhov",
            "Juneporten",
            "A6 Center",
            "Rosenlundsbadet",
            "Hamnen, Visingsö",
            "Jönköpings flygplats",
            "Furuviks Idrottsplats, Bankeryd",
        ):
            self.assertIsNone(gatunamn(hus), hus)

    def test_fastighetsbeteckning(self):
        self.assertIsNone(gatunamn("Ravelsmark 13:20, Gränna"))

    def test_mobil_utan_adress(self):
        self.assertIsNone(gatunamn("Mobil anläggning"))
        self.assertIsNone(gatunamn("marknadsförsäljning"))


class Delade(unittest.TestCase):
    """Adresser där gatan står i en av flera delar."""

    def test_parentesen_ar_en_upplysning(self):
        self.assertEqual(gatunamn("Lindallévägen 2 (Lindgården)"), "Lindallévägen")
        self.assertEqual(gatunamn("Havsörnsgatan 123 (mobil anläggning)"), "Havsörnsgatan")

    def test_parentesen_bar_gatan(self):
        """Utanför parentesen står ingen gata, alltså prövas insidan."""
        self.assertEqual(gatunamn("Mobil anläggning (Påsgatan 10)"), "Påsgatan")
        self.assertEqual(gatunamn("Mobil anläggning (Lundströms plats 2)"), "Lundströms plats")

    def test_snedstreck(self):
        self.assertEqual(
            gatunamn("Norra strandgatan 1/ Järnvägsövergången"), "Norra strandgatan"
        )
        self.assertEqual(
            gatunamn("Slakthusgatan/ Södra Munksjön (gångstråket)"), "Slakthusgatan"
        )
        self.assertEqual(
            gatunamn("Mobil verksamhet/ Norra Stigamovägen 12"), "Norra Stigamovägen"
        )


class KlistratNummer(unittest.TestCase):
    """Husnumret utan mellanslag före. Tre rader i Jönköping."""

    def test_klistrat(self):
        self.assertEqual(gatunamn("Sjöåkravägen18, Bankeryd"), "Sjöåkravägen")
        self.assertEqual(gatunamn("Centrumplan15, Taberg"), "Centrumplan")
        self.assertEqual(gatunamn("Torpleden102, Bankeryd"), "Torpleden")

    def test_kraver_gatuandelse(self):
        """Regeln får inte slita siffror ur något som inte är en gata."""
        self.assertIsNone(gatunamn("A6"))
        self.assertIsNone(gatunamn("Hus B4"))


class Skrivningen(unittest.TestCase):
    """Samma gata, olika skiftläge. 217 gator i beståndet."""

    def test_nyckeln_slar_ihop(self):
        self.assertEqual(nyckel("Västra Storgatan"), nyckel("Västra storgatan"))
        self.assertEqual(nyckel("S:t Larsgatan"), nyckel("S:T Larsgatan"))

    def test_vanligaste_vinner(self):
        self.assertEqual(
            kanonisk(Counter({"Västra Storgatan": 14, "Västra storgatan": 4})),
            "Västra Storgatan",
        )
        self.assertEqual(
            kanonisk(Counter({"Norra svedengatan": 9, "Norra Svedengatan": 4})),
            "Norra svedengatan",
        )

    def test_lika_manga_ger_flest_versaler(self):
        """Lantmäteriets skrivning vinner oavgjort, och regeln är total."""
        self.assertEqual(
            kanonisk(Counter({"Södra strandgatan": 4, "Södra Strandgatan": 4})),
            "Södra Strandgatan",
        )
        self.assertEqual(
            kanonisk(Counter({"Stora torget": 9, "Stora Torget": 9})),
            "Stora Torget",
        )

    def test_raknar_ihop_over_skrivningar(self):
        gator = rakna(
            [
                "Västra Storgatan 1",
                "Västra storgatan 2",
                "Västra Storgatan 3",
                "Räpplinge",
            ]
        )
        self.assertEqual(gator, {"västra storgatan": ("Västra Storgatan", 3)})


class Troskeln(unittest.TestCase):
    def test_en_ensam_verksamhet_ar_ingen_gata(self):
        """Talet är 2 och ska förbli motiverat, inte bara satt."""
        self.assertEqual(TROSKEL, 2)
        gator = rakna(["Kungsgatan 1", "Kungsgatan 2", "Ensamvägen 1"])
        over = {k: v for k, v in gator.items() if v[1] >= TROSKEL}
        self.assertEqual(list(over), ["kungsgatan"])


class Portningen(unittest.TestCase):
    """site/src/lib/gatunamn.ts är en portning och ska förbli det.

    Bara ändelselistan jämförs mekaniskt. Den är den enda tabellen som växer
    av sig själv när en ny kommun kommer in, alltså den enda som glider isär i
    praktiken; reglerna omkring den ändras med ett beslut och en läsning.
    """

    def test_samma_andelser(self):
        self.assertTrue(TS.exists(), f"saknar {TS}")
        text = TS.read_text(encoding="utf-8")
        block = re.search(r"export const SUFFIX = \[(.*?)\];", text, re.S)
        self.assertIsNotNone(block, "hittade ingen SUFFIX-lista i gatunamn.ts")
        ts_suffix = tuple(re.findall(r"'([^']+)'", block.group(1)))
        self.assertEqual(ts_suffix, SUFFIX)

    def test_samma_troskel(self):
        text = TS.read_text(encoding="utf-8")
        match = re.search(r"export const TROSKEL = (\d+);", text)
        self.assertIsNotNone(match, "hittade ingen TROSKEL i gatunamn.ts")
        self.assertEqual(int(match.group(1)), TROSKEL)


if __name__ == "__main__":
    unittest.main()
