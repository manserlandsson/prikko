"""Tester för begäransverktyget.

Fyra av testerna finns för att skydda mot samma sorts fel: att ett brev går
i väg med något som inte är verifierat. Ett brev till fel adress, ett brev
som gissar verksamhetssystem, ett brev utan svarsadress och ett brev till en
myndighet vars uppgifter vi redan har är alla varianter av att skicka först
och kontrollera sedan.

`TestSparrar` skyddar mot en femte variant: att brevet påstår något om
rättsläget som inte går att belägga. De två spärrarna är belagda i
`docs/43_kommunmaskinen.md` avsnitt 5.2 och 5.4, och båda har redan varit
brutna en gång i den här filen.

Kör:  python3 pipeline/tests/test_begaran.py
"""

import csv
import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import begaran  # noqa: E402
from begaran import (  # noqa: E402
    Missing, eligible, loaded_count, request_letter, years,
)


#: Antalet inlästa kommuner som breven i testerna påstår sig ha. Ett fast tal
#: här, så att en ny inläst kommun inte välter testerna. Att talet stämmer med
#: registret är `loaded_count` sak, och den har ett eget test.
LOADED = 13


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
            LOADED,
            today=date(2026, 8, 5),
        )
        self.assertIn("Olofström, Karlshamn och Sölvesborg", flat(letter.body))

    def test_anlaggningstalet_skrivs_med_tusentalsmellanrum(self):
        letter = request_letter(row(), LOADED, today=date(2026, 8, 5))
        self.assertIn("5 418 anläggningar", letter.body)

    def test_verksamhetssystem_namns_bara_nar_det_ar_verifierat(self):
        without = request_letter(row(), LOADED, today=date(2026, 8, 5))
        self.assertNotIn("Ni rapporterar med", flat(without.body))
        with_system = request_letter(row(verksamhetssystem="Ecos"), LOADED,
                                     today=date(2026, 8, 5))
        self.assertIn("Ni rapporterar med Ecos", flat(with_system.body))

    def test_avgift_och_rattslig_grund_star_alltid_i_brevet(self):
        letter = request_letter(row(), LOADED, today=date(2026, 8, 5))
        text = flat(letter.body)
        self.assertIn("meddela beloppet innan uttaget görs", text)
        self.assertIn("skriftligt beslut med besvärshänvisning", text)
        self.assertIn("(2022:818)", text)
        self.assertIn("tryckfrihetsförordningen", text)

    def test_antalet_kommuner_kommer_ur_registret(self):
        letter = request_letter(row(), 3, today=date(2026, 8, 5))
        self.assertIn("hittills läst in tre kommuner", flat(letter.body))

    def test_registrator_upprepas_inte_som_kopia(self):
        same = request_letter(
            row(registrator="miljoforvaltningen@miljo.goteborg.se"), LOADED,
            today=date(2026, 8, 5),
        )
        self.assertEqual(same.cc, "")
        other = request_letter(row(registrator="registrator@goteborg.se"),
                               LOADED, today=date(2026, 8, 5))
        self.assertEqual(other.cc, "registrator@goteborg.se")

    def test_avsandaren_gar_att_identifiera(self):
        letter = request_letter(row(), LOADED, today=date(2026, 8, 5))
        self.assertIn("Magoed AB, org.nr 559386-1015", flat(letter.body))
        self.assertIn("https://prikko.se", flat(letter.body))

    def test_ingen_rad_ar_bredare_an_brevbredden(self):
        letter = request_letter(row(kommuner="Olofström;Karlshamn;Sölvesborg"), LOADED,
                                today=date(2026, 8, 5))
        for line in letter.body.splitlines():
            self.assertLessEqual(len(line), begaran.WIDTH, line)

    def test_den_som_redan_publicerar_far_veta_att_vi_last_det(self):
        letter = request_letter(row(status="sammanfattning"), LOADED, today=date(2026, 8, 5))
        self.assertIn("Jag har läst det ni publicerar i dag", flat(letter.body))
        letter = request_letter(row(status="inget"), LOADED, today=date(2026, 8, 5))
        self.assertNotIn("Jag har läst det ni publicerar i dag", flat(letter.body))


class TestSparrar(unittest.TestCase):
    """De två spärrar som är belagda i docs/43, och en tredje som följer av
    HFD 2025 not. 20.

    Alla tre har formen av något brevet inte får säga, och sådant smyger sig
    tillbaka in när någon skriver om en mening. Därför står de som tester och
    inte bara som kommentarer i koden.
    """

    def setUp(self):
        begaran.SENDER_EMAIL = "mans@prikko.se"

    def tearDown(self):
        begaran.SENDER_EMAIL = ""

    def test_brevet_kraver_inget_digitalt_format(self):
        """NJA 2023 s. 498 och prop. 2023/24:73: rätten finns inte.

        Öppna data-meningen ska stå kvar för fristen, beslutsplikten och
        avgiftstaket, men den får inte bära ett formatkrav.
        """
        text = flat(request_letter(row(), LOADED, today=date(2026, 8, 5)).body)
        self.assertIn("(2022:818)", text)
        for claim in ("befintligt digitalt format", "har rätt att få",
                      "är skyldiga att lämna"):
            self.assertNotIn(claim, text)

    def test_papperssparren_star_hogt_upp(self):
        """JO dnr 1922-2024: 15 000 sidor för omkring 30 000 kronor.

        Spärren ska läsas innan mottagaren bestämmer sig för hur uttaget ska
        levereras, alltså före listan över vad vi ber om.
        """
        body = request_letter(row(), LOADED, today=date(2026, 8, 5)).body
        self.assertIn("vill inte ha papperskopior", flat(body))
        blocks = [flat(b) for b in body.split("\n\n")]
        bar = next(i for i, b in enumerate(blocks) if "papperskopior" in b)
        asks = next(i for i, b in enumerate(blocks) if b.startswith("Två saker"))
        self.assertLess(bar, asks)

    def test_brevet_ber_inte_om_uträknade_tal(self):
        """HFD 2025 not. 20: en beräkning är inte en rutinbetonad åtgärd."""
        text = flat(request_letter(row(), LOADED, today=date(2026, 8, 5)).body)
        self.assertIn("inte om några sammanställda eller uträknade tal", text)
        for asked in ("antal kontroller per", "andel avvikelser",
                      "genomsnitt", "statistik över"):
            self.assertNotIn(asked, text)


class TestLoadedCount(unittest.TestCase):
    def test_raknar_kommuner_och_inte_myndigheter(self):
        register = [
            {"status": "inlast", "kommuner": "Täby;Vaxholm"},
            {"status": "inlast", "kommuner": "Göteborg"},
            {"status": "inget", "kommuner": "Malmö"},
        ]
        self.assertEqual(loaded_count(register), 3)

    def test_registret_pa_disk_stammer_med_brevet(self):
        """Talet i brevet ska komma ur registret och inte ur någons minne."""
        path = Path(__file__).resolve().parents[1] / "data" / "kommunregister.csv"
        if not path.exists():
            self.skipTest("registret är inte byggt")
        with path.open(encoding="utf-8", newline="") as handle:
            self.assertGreater(loaded_count(csv.DictReader(handle)), 0)


class TestRefusals(unittest.TestCase):
    def setUp(self):
        begaran.SENDER_EMAIL = "mans@prikko.se"

    def tearDown(self):
        begaran.SENDER_EMAIL = ""

    def test_inget_brev_till_den_vars_data_vi_redan_har(self):
        with self.assertRaises(Missing):
            request_letter(row(status="inlast"), LOADED)

    def test_inget_brev_om_vi_kan_hamta_sjalva(self):
        with self.assertRaises(Missing):
            request_letter(row(status="oppen_data"), LOADED)

    def test_inget_brev_utan_verifierad_mottagare(self):
        with self.assertRaises(Missing):
            request_letter(row(mottagare=""), LOADED)

    def test_inget_brev_utan_avsandaradress(self):
        begaran.SENDER_EMAIL = ""
        with self.assertRaises(Missing):
            request_letter(row(), LOADED)


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
