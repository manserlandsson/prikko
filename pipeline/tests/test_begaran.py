"""Tester för begäransverktyget.

Fyra av testerna finns för att skydda mot samma sorts fel: att ett brev går
i väg med något som inte är verifierat. Ett brev till fel adress, ett brev
som gissar verksamhetssystem, ett brev utan svarsadress och ett brev till en
myndighet vars uppgifter vi redan har är alla varianter av att skicka först
och kontrollera sedan.

Kör:  python3 pipeline/tests/test_begaran.py
"""

import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import begaran  # noqa: E402
from begaran import Missing, eligible, request_letter, years  # noqa: E402


def flat(text: str) -> str:
    """Brevet utan radbrytningar, för att leta efter en mening i det."""
    return " ".join(text.split())


def row(**changes) -> dict:
    base = {
        "myndighet_kod": "1480",
        "myndighet": "Miljöförvaltningen, Göteborgs Stad",
        "kommuner": "Göteborg",
        "kommunkoder": "1480",
        "anlaggningar": "5418",
        "andel_anlaggningar": "5.77",
        "status": "inget",
        "mottagare": "miljoforvaltningen@miljo.goteborg.se",
        "mottagartyp": "funktionsbrevlada",
        "registrator": "",
        "verksamhetssystem": "",
    }
    base.update(changes)
    return base


class TestLetter(unittest.TestCase):
    def setUp(self):
        begaran.SENDER_EMAIL = "mans@prikko.se"

    def tearDown(self):
        begaran.SENDER_EMAIL = ""

    def test_gemensam_namnd_far_alla_sina_kommuner_uppraknade(self):
        letter = request_letter(
            row(kommuner="Olofström;Karlshamn;Sölvesborg", status="inget"),
            today=date(2026, 8, 5),
        )
        self.assertIn("Olofström, Karlshamn och Sölvesborg", flat(letter.body))

    def test_anlaggningstalet_skrivs_med_tusentalsmellanrum(self):
        letter = request_letter(row(), today=date(2026, 8, 5))
        self.assertIn("5 418 anläggningar", letter.body)

    def test_verksamhetssystem_namns_bara_nar_det_ar_verifierat(self):
        without = request_letter(row(), today=date(2026, 8, 5))
        self.assertNotIn("Ni rapporterar med", flat(without.body))
        with_system = request_letter(row(verksamhetssystem="Ecos"),
                                     today=date(2026, 8, 5))
        self.assertIn("Ni rapporterar med Ecos", flat(with_system.body))

    def test_avgift_och_format_star_alltid_i_brevet(self):
        letter = request_letter(row(), today=date(2026, 8, 5))
        self.assertIn("meddela beloppet innan uttaget görs", flat(letter.body))
        self.assertIn("maskinläsbart format", flat(letter.body))
        self.assertIn("(2022:818)", flat(letter.body))
        self.assertIn("tryckfrihetsförordningen", flat(letter.body))

    def test_avsandaren_gar_att_identifiera(self):
        letter = request_letter(row(), today=date(2026, 8, 5))
        self.assertIn("Magoed AB, org.nr 559386-1015", flat(letter.body))
        self.assertIn("https://prikko.se", flat(letter.body))

    def test_ingen_rad_ar_bredare_an_brevbredden(self):
        letter = request_letter(row(kommuner="Olofström;Karlshamn;Sölvesborg"),
                                today=date(2026, 8, 5))
        for line in letter.body.splitlines():
            self.assertLessEqual(len(line), begaran.WIDTH, line)

    def test_den_som_redan_publicerar_far_veta_att_vi_last_det(self):
        letter = request_letter(row(status="sammanfattning"), today=date(2026, 8, 5))
        self.assertIn("Jag har läst det ni publicerar i dag", flat(letter.body))
        letter = request_letter(row(status="inget"), today=date(2026, 8, 5))
        self.assertNotIn("Jag har läst det ni publicerar i dag", flat(letter.body))


class TestRefusals(unittest.TestCase):
    def setUp(self):
        begaran.SENDER_EMAIL = "mans@prikko.se"

    def tearDown(self):
        begaran.SENDER_EMAIL = ""

    def test_inget_brev_till_den_vars_data_vi_redan_har(self):
        with self.assertRaises(Missing):
            request_letter(row(status="inlast"))

    def test_inget_brev_om_vi_kan_hamta_sjalva(self):
        with self.assertRaises(Missing):
            request_letter(row(status="oppen_data"))

    def test_inget_brev_utan_verifierad_mottagare(self):
        with self.assertRaises(Missing):
            request_letter(row(mottagare=""))

    def test_inget_brev_utan_avsandaradress(self):
        begaran.SENDER_EMAIL = ""
        with self.assertRaises(Missing):
            request_letter(row())


class TestYears(unittest.TestCase):
    def test_i_januari_ar_forra_arets_rapportering_inte_inne(self):
        """Deadline är 31 januari, så i januari är förrförra året det säkra."""
        self.assertEqual(years(date(2027, 1, 15))[0], 2025)

    def test_i_februari_finns_forra_aret(self):
        self.assertEqual(years(date(2027, 2, 1))[0], 2026)

    def test_tre_argangar(self):
        self.assertEqual(years(date(2026, 8, 5)), [2025, 2024, 2023])


class TestEligible(unittest.TestCase):
    def test_skickade_kommer_inte_tillbaka(self):
        register = [row(), row(myndighet_kod="1280", anlaggningar="3150")]
        tracking = {"1480": {"skickat": "2026-08-01"}}
        self.assertEqual(
            [r["myndighet_kod"] for r in eligible(register, tracking)], ["1280"]
        )

    def test_storst_forst(self):
        register = [
            row(myndighet_kod="0885", anlaggningar="353"),
            row(myndighet_kod="1480", anlaggningar="5418"),
        ]
        self.assertEqual(
            [r["myndighet_kod"] for r in eligible(register, {})], ["1480", "0885"]
        )

    def test_utan_mottagare_star_over(self):
        register = [row(mottagare="")]
        self.assertEqual(eligible(register, {}), [])


if __name__ == "__main__":
    unittest.main()
