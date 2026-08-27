"""Tester för adressutvinningen ur kommunens kontrollrapporter.

Texterna är VERKLIGA. Var och en är hämtad ur en publicerad rapport på
hoganas.se 2026-08-27 och körd genom prikko.pdf.extract_blocks, med samma
styckning och samma stavfel som PDF:en levererar. Påhittade texter hade
provat mönstret mot sig självt.

    python3 pipeline/tests/test_rapportadress.py
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.rapportadress import (  # noqa: E402
    find_anchor,
    parse_premises,
)

# Rapportens sidfot, som står först i innehållsströmmen på varje sida och
# alltså alltid ligger före den mening vi läser. Bär kommunens EGEN
# besöksadress, som aldrig får bli en verksamhets adress.
FOOTER = (
    "A dress: Telefon: E - post: Webb: Samhällsbyggnadsförvaltningen , "
    "Miljöavdelningen, Höganäs Kommun 042 - 33 71 00 "
    "miljoavdelningen@hoganas.se www.hoganas.se Besöksadress: Stadshuset, "
    "Centralgatan 20, 263 38 Höganäs Sida 1 ( 4 ) Livsmedelsk ontroll "
)

TAIL = (
    " Besöket var en planerad kontroll för att se om verksamheten producerar "
    "och tillhandahåller säkra livsmedel samt uppfyller kraven på spårbarhet "
    "och redlighet. Kontrollen var oanmäld."
)


def report(middle: str) -> str:
    """En rapporttext med sidfot före och brödtext efter, som i verkligheten."""
    return FOOTER + middle + TAIL


class Ankare(unittest.TestCase):
    def test_hittar_ankaret_trots_styckning(self):
        # PDF:en delar ordet: 'kontrollera' + 't' + 'er verksamhet'. Mellan
        # löporna sätter flatten in ett blanksteg, så ankaret finns bara i
        # texten om det söks blankstegsfritt.
        text = report(
            "Vi på miljöavdelningen har 2025 - 09 - 25 kontrollera t "
            "er verksamhet Shakespeare restaurang , Väsbygatan 2A , "
            "26336 Höganäs , KRINGLAN 7 ."
        )
        self.assertIsNotNone(find_anchor(text))

    def test_gammal_mall_saknar_ankare(self):
        # Rapporter före oktober 2024 skriver "utfört kontroll på er
        # livsmedelsanläggning" och bär bara mottagarens postadress.
        text = report(
            "Fyrskepp 17 AB Hamnplanen 9 26361 Viken VIKEN 52:10 Il Faro "
            "Vi på miljö avdelningen har 2024 - 07 - 03 utfört kontroll på "
            "er livsmedelsanläggning."
        )
        self.assertIsNone(find_anchor(text))
        self.assertIsNone(parse_premises(text))


class Adresser(unittest.TestCase):
    def test_laser_adress_postnummer_och_fastighet(self):
        premises = parse_premises(
            report(
                "har 2025 - 09 - 25 kontrollera t er verksamhet "
                "Shakespeare restaurang , Väsbygatan 2A , 26336 Höganäs , "
                "KRINGLAN 7 ."
            )
        )
        self.assertIsNotNone(premises)
        self.assertEqual(premises.street_address, "Väsbygatan 2A")
        self.assertEqual(premises.postal_code, "26336")
        self.assertEqual(premises.locality, "Höganäs")
        self.assertEqual(premises.property_designation, "KRINGLAN 7")
        self.assertEqual(premises.name, "Shakespeare restaurang")

    def test_postnummer_med_blanksteg(self):
        premises = parse_premises(
            report(
                "kontrollerat er verksamhet Galleri Plume , Bygatan 21C , "
                "263 61 Viken , EKEN 16 ."
            )
        )
        self.assertEqual(premises.street_address, "Bygatan 21C")
        self.assertEqual(premises.postal_code, "26361")
        self.assertEqual(premises.locality, "Viken")

    def test_nummerintervall_behalls_ordagrant(self):
        # "Banckagatan 19 - 21" är en fastighet med en nummerserie.
        # parse_address kortar den till sitt första nummer vid uppslaget;
        # här bevaras kommunens ordalydelse.
        premises = parse_premises(
            report(
                "kontrollerat er verksamhet Tempo i Viken , "
                "Banckagatan 19 - 21 , 263 61 Viken , VIKEN 120:1 ."
            )
        )
        self.assertEqual(premises.street_address, "Banckagatan 19 - 21")

    def test_fastighet_med_bindestreck(self):
        premises = parse_premises(
            report(
                "kontrollerat er verksamhet Nyhamnsgården avdelningskök på "
                "Skonarevägen 6 , 263 76 Nyhamnsläge , BRUNNBY - BRÄCKE 2:82 ."
            )
        )
        self.assertEqual(premises.property_designation, "BRUNNBY - BRÄCKE 2:82")

    def test_namn_och_adress_hopskrivna_med_pa(self):
        # Verklig form: verksamhetsnamnet och adressen skiljs inte med
        # kommatecken utan med "på". Utan regeln blir hela strängen
        # adresskandidat och en verklig adress går förlorad.
        premises = parse_premises(
            report(
                "kontrollerat er verksamhet Nyhamnsgården avdelningskök på "
                "Skonarevägen 6 , 263 76 Nyhamnsläge , BRUNNBY - BRÄCKE 2:82 ."
            )
        )
        self.assertEqual(premises.street_address, "Skonarevägen 6")
        self.assertEqual(premises.name, "Nyhamnsgården avdelningskök")

    def test_extra_kommatecken_i_namnet(self):
        premises = parse_premises(
            report(
                "kontrollerat er verksamhet Gläntan Öppen Förskola, "
                "Höganäs Kommun , Stinsens Trädgårdsgata 19 , 263 38 "
                "H öganäs , LINDEN 1 ."
            )
        )
        self.assertEqual(premises.street_address, "Stinsens Trädgårdsgata 19")
        self.assertEqual(premises.property_designation, "LINDEN 1")


class Avstar(unittest.TestCase):
    """Fallen där modulen ska säga nej. En nål som ljuger är värre än ingen."""

    def test_adress_utan_husnummer_ger_ingen_traff(self):
        # "Stationstorget" utan nummer pekar inte ut ett hus. Samma regel som
        # parse_address följer för kommunernas ortnamn.
        self.assertIsNone(
            parse_premises(
                report(
                    "kontrollerat er verksamhet Stationsplatsen , "
                    "Stationstorget , 263 58 Strandbaden , VÄSBY 23:1 ."
                )
            )
        )

    def test_gatunamn_utan_nummer_ger_ingen_traff(self):
        self.assertIsNone(
            parse_premises(
                report(
                    "kontrollerat er verksamhet Nyhamnsskolan,Övriga "
                    "Verksamheter (Fritids och hemkunskap ) , "
                    "Eleshultsvägen , 263 75 Nyhamnsläge , ELESHULT 6:1 ."
                )
            )
        )

    def test_utan_postnummer_finns_inget_att_halla_i(self):
        self.assertIsNone(
            parse_premises(
                report("kontrollerat er verksamhet Något Ställe , Storgatan 1 .")
            )
        )

    def test_kommunens_egen_besoksadress_slapps_aldrig_igenom(self):
        # Skulle ankaret och sidfoten någon gång hamna intill varandra får
        # kommunens eget stadshus inte bli en verksamhets adress.
        self.assertIsNone(
            parse_premises(
                "kontrollerat er verksamhet Miljöavdelningen , "
                "Centralgatan 20 , 263 38 Höganäs ."
            )
        )

    def test_sidfoten_ensam_ger_ingen_adress(self):
        # Utan ankare ska sidfotens "Centralgatan 20, 263 38 Höganäs"
        # aldrig plockas upp, hur mycket den än ser ut som en adress.
        self.assertIsNone(parse_premises(FOOTER))


class Ordning(unittest.TestCase):
    """Ledet före postnumret är adressen, oavsett hur många kommatecken som
    står före det."""

    def test_valjer_ledet_narmast_postnumret(self):
        premises = parse_premises(
            report(
                "kontrollerat er verksamhet Cecilias Fromageri , Vikens Ost "
                "& Delikatess , Storgatan 24A , 26337 Höganäs , STJÄRNAN 10 ."
            )
        )
        self.assertEqual(premises.street_address, "Storgatan 24A")
        self.assertEqual(premises.name, "Cecilias Fromageri, Vikens Ost & Delikatess")


if __name__ == "__main__":
    unittest.main()
