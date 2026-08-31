"""Tester för Ecos-adaptern.

Fixturerna är verkliga. XML:en nedan är klippt ordagrant ur Norrköpings
`ecos.xml`, hämtad 2026-08-31, inklusive den tomma statusraden på
Vrinnevisjukhuset som är en av fyra i hela filen.

Kör:  python3 pipeline/tests/test_ecos.py
"""

import sys
import unittest
from datetime import date
from pathlib import Path
from xml.etree import ElementTree

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.grading import (  # noqa: E402
    MINOR_REMARKS,
    NO_REMARKS,
    REASON_ASSESSED,
    REASON_STALE,
    ROUTINE,
    Area,
    Inspection,
    area_letter,
    assess,
)
from prikko.sources.ecos import (  # noqa: E402
    MUNICIPALITIES,
    UnknownSourceValue,
    check_modified,
    group_by_establishment,
    local_id,
    normalize_establishment,
    normalize_inspection,
    normalize_inspections,
    parse,
)

NORRKOPING = MUNICIPALITIES["norrkoping"]

# Två kontroller på samma verksamhet, en ren och en med avvikelse, plus ett
# ställe med tom status. Ordagrant ur filen.
XML = """<?xml version="1.0" encoding="UTF-8"?>
<insps>
  <insp>
    <inspid>ecfa75cb-fe3d-4a6e-9d8a-52fb0ce5075b</inspid>
    <dnr>2023-6194</dnr>
    <namn>Valhallavägen 1a Äldreboende</namn>
    <besadr>Valhallavägen 1A</besadr>
    <hdatum>2024-01-03</hdatum>
    <anmald>Oanmäld</anmald>
    <bedomning>Godtagbar</bedomning>
    <kontroller>
      <kontroll>
        <status>Utan avvikelse</status>
        <chklistrubrik_text>Grundförutsättningar, hygien</chklistrubrik_text>
        <kontrollpunkt>Upprätthållande av kylkedjan</kontrollpunkt>
      </kontroll>
    </kontroller>
  </insp>
  <insp>
    <inspid>90fe8628-b2c4-403b-b6d4-458963dc8a57</inspid>
    <dnr>2023-6348</dnr>
    <namn>Haddadsson Livs</namn>
    <besadr>Hospitalsgatan 15</besadr>
    <hdatum>2023-12-29</hdatum>
    <anmald>Oanmäld</anmald>
    <bedomning>Ej godtagbar</bedomning>
    <kontroller>
      <kontroll>
        <status>Avvikelse</status>
        <chklistrubrik_text>Spårbarhet</chklistrubrik_text>
        <kontrollpunkt>Allmänna bestämmelser om spårbarhet</kontrollpunkt>
      </kontroll>
      <kontroll>
        <status>Avvikelse</status>
        <chklistrubrik_text>Grundförutsättningar, hygien</chklistrubrik_text>
        <kontrollpunkt>Allmänna krav på livsmedelssäkerhet</kontrollpunkt>
      </kontroll>
    </kontroller>
  </insp>
  <insp>
    <inspid>3c9a1a11-0000-4000-8000-000000000001</inspid>
    <dnr>2022-1111</dnr>
    <namn>HADDADSSON LIVS</namn>
    <besadr>Hospitalsgatan 15</besadr>
    <hdatum>2022-05-11</hdatum>
    <anmald>Anmäld</anmald>
    <bedomning>Ej godtagbar</bedomning>
    <kontroller>
      <kontroll>
        <status>Avvikelse</status>
        <chklistrubrik_text>Grundförutsättningar, hygien</chklistrubrik_text>
        <kontrollpunkt>Personlig hygien</kontrollpunkt>
      </kontroll>
    </kontroller>
  </insp>
  <insp>
    <inspid>e4992d60-fa56-419e-96cd-9f35f30135af</inspid>
    <dnr>2023-2222</dnr>
    <namn>Vrinnevisjukhuset, Avd 28 Beroendeklin.</namn>
    <besadr>Gamla Övägen 25</besadr>
    <hdatum>2023-11-02</hdatum>
    <anmald>Anmäld</anmald>
    <bedomning>Godtagbar</bedomning>
    <kontroller>
      <kontroll>
        <status>
        </status>
        <chklistrubrik_text>Grundförutsättningar, hygien</chklistrubrik_text>
        <kontrollpunkt>Personlig hygien</kontrollpunkt>
      </kontroll>
      <kontroll>
        <status>Utan avvikelse</status>
        <chklistrubrik_text>Administrativa krav</chklistrubrik_text>
        <kontrollpunkt>Registrering</kontrollpunkt>
      </kontroll>
    </kontroller>
  </insp>
</insps>
"""


def element(xml: str) -> ElementTree.Element:
    return ElementTree.fromstring(xml)


class TestParse(unittest.TestCase):
    def test_laser_alla_kontrolltillfallen(self):
        self.assertEqual(len(parse(XML.encode("utf-8"))), 4)

    def test_avvisar_annat_rotelement(self):
        # En Sitevision-nod som slutat leverera XML svarar med HTML och 200.
        with self.assertRaises(UnknownSourceValue):
            parse(b"<html><body>Sidan finns inte</body></html>")

    def test_avvisar_tomt_utdrag(self):
        with self.assertRaises(UnknownSourceValue):
            parse(b"<insps></insps>")


class TestIdentitet(unittest.TestCase):
    def test_versaler_ar_samma_verksamhet(self):
        # Utan casefold blir Norrköpings bestånd 1 023 i stället för 1 022.
        self.assertEqual(
            local_id("Haddadsson Livs", "Hospitalsgatan 15"),
            local_id("HADDADSSON LIVS", "Hospitalsgatan 15"),
        )

    def test_samma_namn_pa_olika_adress_ar_olika(self):
        self.assertNotEqual(
            local_id("Pressbyrån", "Drottninggatan 1"),
            local_id("Pressbyrån", "Drottninggatan 2"),
        )

    def test_utan_namn_kastar(self):
        with self.assertRaises(UnknownSourceValue):
            local_id("", "Hospitalsgatan 15")


class TestGruppering(unittest.TestCase):
    def setUp(self):
        self.groups = group_by_establishment(parse(XML.encode("utf-8")))

    def test_tre_verksamheter_av_fyra_kontroller(self):
        self.assertEqual(len(self.groups), 3)

    def test_ordningen_ar_alfabetisk_och_inte_kronologisk(self):
        # Slugstabiliteten hänger på det, se tests/test_slugstabilitet.py.
        self.assertEqual(
            [row[1] for row in self.groups],
            [
                "Haddadsson Livs",
                "Valhallavägen 1a Äldreboende",
                "Vrinnevisjukhuset, Avd 28 Beroendeklin.",
            ],
        )

    def test_namnet_kommer_fran_senaste_kontrollen(self):
        # De två raderna heter "Haddadsson Livs" (2023) och "HADDADSSON LIVS"
        # (2022). Kommunens färskaste stavning vinner.
        haddadsson = self.groups[0]
        self.assertEqual(haddadsson[1], "Haddadsson Livs")
        self.assertEqual(len(haddadsson[3]), 2)

    def test_saknat_falt_fäller(self):
        trasig = XML.replace("<bedomning>Godtagbar</bedomning>", "<bedomning></bedomning>")
        with self.assertRaises(UnknownSourceValue):
            group_by_establishment(parse(trasig.encode("utf-8")))


class TestKontroll(unittest.TestCase):
    def normalize(self, index: int):
        elements = parse(XML.encode("utf-8"))
        return normalize_inspection(NORRKOPING, elements[index], "F-0581-test")

    def test_godtagbar_ar_utan_anmarkning(self):
        self.assertEqual(self.normalize(0).assessment, NO_REMARKS)

    def test_ej_godtagbar_stannar_pa_mindre(self):
        # Kommunens skala har två steg. Den allvarligaste nivån härleds ur
        # mönstret i grading.py och uppfinns aldrig här.
        self.assertEqual(self.normalize(1).assessment, MINOR_REMARKS)

    def test_oanmald_och_anmald(self):
        self.assertIs(self.normalize(0).prenotified, False)
        self.assertIs(self.normalize(2).prenotified, True)

    def test_alltid_rutinkontroll(self):
        # Utdraget skiljer inte planerad kontroll från återbesök.
        self.assertEqual(self.normalize(0).type, ROUTINE)

    def test_diarienumret_bars_vidare(self):
        self.assertEqual(self.normalize(1).case_number, "2023-6348")

    def test_id_ar_kallans_guid(self):
        self.assertEqual(
            self.normalize(0).id_national,
            "I-0581-ecfa75cb-fe3d-4a6e-9d8a-52fb0ce5075b",
        )

    def test_tom_status_slacker_hela_punktlistan(self):
        # Den ena punkten är läsbar och den andra inte. Halv lista får inte
        # publiceras: den kunde mildra en bedömning i grading.py version 4.
        vrinnevi = self.normalize(3)
        self.assertEqual(vrinnevi.areas, [])
        self.assertTrue(vrinnevi.uncertain)
        # Kommunens EGEN bedömning står kvar. Den kommer ur `bedomning`.
        self.assertEqual(vrinnevi.assessment, NO_REMARKS)

    def test_okand_status_kastar(self):
        trasig = XML.replace("<status>Avvikelse</status>", "<status>Kanske</status>")
        with self.assertRaises(UnknownSourceValue):
            normalize_inspection(
                NORRKOPING, parse(trasig.encode("utf-8"))[1], "F-0581-test"
            )

    def test_okand_bedomning_kastar(self):
        trasig = XML.replace(
            "<bedomning>Godtagbar</bedomning>", "<bedomning>Utmärkt</bedomning>"
        )
        with self.assertRaises(UnknownSourceValue):
            normalize_inspection(
                NORRKOPING, parse(trasig.encode("utf-8"))[0], "F-0581-test"
            )


class TestOmradeskoder(unittest.TestCase):
    def test_alla_rubriker_i_filen_gar_att_slaa_upp(self):
        """Utdraget lämnar ingen kod, men rubrikerna ÄR Livsmedelsverkets egna.

        Alla tolv som förekommer i Norrköpings fil står i AREA_LETTER_BY_NAME.
        Håller det inte kan grading.py inte skilja en administrativ avvikelse
        från en hygienisk, och version 4:s viktning blir verkningslös.
        """
        rubriker = {
            "Grundförutsättningar, hygien": "J",
            "Administrativa krav": "A",
            "Allmän livsmedelsinformation": "B",
            "Spårbarhet": "H",
            "HACCP-baserade förfaranden": "K",
            "Dricksvattenanläggningar": "N",
            "Operativa mål": "P",
            "Särskild märkning och information": "C",
            "Skyddade beteckningar": "D",
            "Särskilda ingredienser och processhjälpmedel": "I",
            "Övrigt": "O",
            "Livsmedel för särskilda grupper": "G",
        }
        for group, letter in rubriker.items():
            with self.subTest(group=group):
                self.assertEqual(
                    area_letter(Area("", group, "punkt", "deviation")), letter
                )


class TestHistorik(unittest.TestCase):
    def test_nyast_forst(self):
        groups = group_by_establishment(parse(XML.encode("utf-8")))
        _, _, _, elements = groups[0]
        history = normalize_inspections(NORRKOPING, elements, "F-0581-test")
        self.assertEqual(
            [i.inspected_at for i in history],
            [date(2023, 12, 29), date(2022, 5, 11)],
        )

    def test_samma_dag_slas_ihop_med_samre_utfall(self):
        dubbel = XML.replace("<hdatum>2022-05-11</hdatum>", "<hdatum>2023-12-29</hdatum>")
        groups = group_by_establishment(parse(dubbel.encode("utf-8")))
        _, _, _, elements = groups[0]
        history = normalize_inspections(NORRKOPING, elements, "F-0581-test")
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0].assessment, MINOR_REMARKS)
        # Anmäld och oanmäld samma dag: uppgiften är inte längre entydig.
        self.assertIsNone(history[0].prenotified)


class TestVerksamhet(unittest.TestCase):
    def test_utan_besoksadress_blir_none_och_inte_tom_strang(self):
        e = normalize_establishment(NORRKOPING, "abc123", "Soja Sushi", "")
        self.assertIsNone(e.street_address)

    def test_ingen_verksamhetstyp(self):
        # Utdraget bär ingen. Att härleda den ur namnet är uttryckligen
        # underkänt, se docs/45.
        e = normalize_establishment(NORRKOPING, "abc123", "Paus Kök Och Café", "X 1")
        self.assertEqual(e.types, [])

    def test_id_bar_kommunkoden(self):
        e = normalize_establishment(NORRKOPING, "abc123", "Avenyn", "Trädgårdsgatan 3")
        self.assertEqual(e.id_national, "F-0581-abc123")


class TestFarskhet(unittest.TestCase):
    """Åldern hanteras av att färskhetsfönstret får verka, inte av undantag."""

    def test_kontroll_inom_fonstret_ger_bedomning(self):
        result = assess(
            [Inspection("I-1", date(2024, 1, 3), NO_REMARKS)], date(2026, 8, 31)
        )
        self.assertEqual(result.verdict, "clean")
        self.assertEqual(result.reason, REASON_ASSESSED)

    def test_kontroll_utanfor_fonstret_ger_ingen(self):
        result = assess(
            [Inspection("I-1", date(2022, 5, 11), NO_REMARKS)], date(2026, 8, 31)
        )
        self.assertIsNone(result.verdict)
        self.assertEqual(result.reason, REASON_STALE)


class TestKallansAlder(unittest.TestCase):
    def test_vantat_datum_ger_ingen_anmarkning(self):
        self.assertIsNone(
            check_modified("Sun, 17 Mar 2024 19:44:35 GMT", "2024-03-17")
        )

    def test_nyare_fil_ar_en_notering_och_inte_ett_fel(self):
        note = check_modified("Mon, 01 Jun 2026 10:00:00 GMT", "2024-03-17")
        self.assertIn("2026-06-01", note)

    def test_saknat_huvud_stoppar_inte_hamtningen(self):
        self.assertIn("saknar Last-Modified", check_modified(None, "2024-03-17"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
