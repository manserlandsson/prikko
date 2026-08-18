"""Prov för namnspåret: de fyra grindarna, var och en med sitt riktiga fel.

    python3 pipeline/tests/test_wikidatanamn.py

Inget fall nedan är påhittat. Varje par är ett verkligt utfall ur körningen
2026-08-19 mot 16 047 verksamheter och 8 711 Wikidata-objekt, och de som ska
FALLA är de som faktiskt gjorde fel innan grinden fanns. Se
prikko/wikidatanamn.py och docs/39_fler_bilder.md.
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko import wikidatanamn as wn  # noqa: E402
from prikko.oppettider import name_tokens  # noqa: E402


def objekt(namn="Den gyldene freden", bild="Den Gyldene Freden 2013a.jpg",
           punkter=((59.323283, 18.071583),), klasser=("Q11707",), alias=()):
    return wn.Objekt(
        qid="Q1145843", namn=namn, bild=bild,
        punkter=tuple(punkter), klasser=tuple(klasser), alias=tuple(alias),
    )


class Namnlikhet(unittest.TestCase):
    """Grind 1. Delmängd duger inte, för då lånar verksamheten platsens namn."""

    def agrees(self, ours, theirs):
        return wn.names_agree(name_tokens(ours), name_tokens(theirs))

    def test_samma_namn(self):
        self.assertTrue(self.agrees("Tennstopet", "Tennstopet"))

    def test_bolagsform_stryks_som_vanligt(self):
        # `name_tokens` gör redan det, och det ska fortsätta gälla här.
        self.assertTrue(self.agrees("Gamla Rådhuset Jönköping AB", "Gamla rådhuset, Jönköping"))

    def test_generiska_ord_stryks_ur_bada(self):
        # "Restaurang" är en bolagsform i vår mening, "café" ett generiskt ord.
        self.assertTrue(self.agrees("Restaurang Cassi", "Cassi"))
        self.assertTrue(self.agrees("Fåfängan Restaurang & Cafe", "Fåfängan"))

    def test_ortnamnet_som_lanats_faller(self):
        # "View of Gränna.jpg" på en chokladfabrik. Delmängdsregeln i
        # oppettider.names_agree släppte igenom det här.
        self.assertFalse(self.agrees("Gränna Chokladfabrik", "Gränna"))

    def test_torget_som_lanats_faller(self):
        self.assertFalse(self.agrees("Coop Östra Torget 07-5900", "Östra torget"))

    def test_gallerian_som_lanats_faller(self):
        self.assertFalse(self.agrees("Sushi Yama Mitt I City", "Mitt i city"))

    def test_arenan_som_lanats_faller(self):
        self.assertFalse(self.agrees("Max Hamburgerrestaurang Behrn Arena", "Behrn Arena"))

    def test_tomt_namn_ar_aldrig_en_traff(self):
        self.assertFalse(self.agrees("", "Gränna"))
        self.assertFalse(self.agrees("Gränna", ""))

    def test_bara_generiska_ord_ar_aldrig_en_traff(self):
        # "Pizzeria" mot "Pizzeria" är ingen identitet, det är ett yrke.
        self.assertFalse(self.agrees("Pizzeria", "Pizzeria"))


class Klassen(unittest.TestCase):
    """Grind 2. Tillåtelselista, precis som commons.FREE_LICENCES."""

    def test_hus_slapps_igenom(self):
        self.assertTrue(objekt(klasser=("Q41176",)).tillaten_klass())

    def test_stadsdel_faller(self):
        # Rinkeby Livs mot stadsdelen Rinkeby, flygbild från 1988.
        self.assertFalse(objekt(klasser=("Q2983893",)).tillaten_klass())

    def test_sparvagnshallplats_faller(self):
        # Gröna sushi mot hållplatsen Gröndal, en bild på en spårvagn.
        self.assertFalse(objekt(klasser=("Q2175765",)).tillaten_klass())

    def test_gata_faller(self):
        self.assertFalse(objekt(klasser=("Q79007",)).tillaten_klass())

    def test_utan_klass_faller(self):
        # Elva objekt saknar P31 helt, bland dem Wedholms Fisk. Samma besked
        # som när P625 saknas: en bild vi inte kan pröva visar vi inte.
        self.assertFalse(objekt(klasser=()).tillaten_klass())

    def test_okand_klass_faller(self):
        self.assertFalse(objekt(klasser=("Q99999999",)).tillaten_klass())

    def test_en_tillaten_klass_av_flera_racker(self):
        self.assertTrue(objekt(klasser=("Q2983893", "Q41176")).tillaten_klass())


class Avstandet(unittest.TestCase):
    """Samma spärr som commons.within_reach, mot vår egen koordinat."""

    FREDEN = (59.323283, 18.071583)

    def test_samma_plats(self):
        self.assertIsNotNone(wn.within_reach(objekt(punkter=(self.FREDEN,)), *self.FREDEN))

    def test_for_langt_bort_faller(self):
        # Stångs Magasin, 177 meter, samma fall som fällde spärren i commons.
        langt = (58.409060, 15.628860)
        self.assertIsNone(wn.within_reach(objekt(punkter=(langt,)), 58.410500, 15.630600))

    def test_narmaste_av_flera_koordinater_galler(self):
        # Ett hus med både en ingång och en mittpunkt ska prövas på den
        # närmaste av dem, inte på den första i svaret.
        langt = (59.330000, 18.071583)
        traff = objekt(punkter=(langt, self.FREDEN))
        self.assertLess(wn.within_reach(traff, *self.FREDEN), 1.0)

    def test_utan_koordinat_faller(self):
        self.assertIsNone(wn.within_reach(objekt(punkter=()), *self.FREDEN))


class Motivet(unittest.TestCase):
    """Grind 4. Namnet ska stå i filnamnet eller i beskrivningen."""

    def test_filnamnet_racker(self):
        self.assertTrue(wn.depicts("Tennstopet", "Tennstopet Stockholm.jpg", None))

    def test_filandelsen_raknas_inte_som_ett_ord(self):
        self.assertFalse(wn.depicts("Jpg", "Tennstopet Stockholm.jpg", None))

    def test_file_prefixet_stors_inte(self):
        self.assertTrue(wn.depicts("Tennstopet", "File:Tennstopet Stockholm.jpg", None))

    def test_beskrivningen_racker_nar_filnamnet_inte_gor_det(self):
        # Djurgårdsskolan ligger i en villa, och filen heter efter villan.
        # Beskrivningen säger vilken skola det är, alltså är motivet belagt.
        self.assertTrue(
            wn.depicts(
                "Djurgårdsskolan",
                "Djurgården villa 2007.jpg",
                '"Djurgårdsskolan" vid Djurgårdsvägen på Södra Djurgården',
            )
        )

    def test_kyrkan_intill_faller(self):
        self.assertFalse(
            wn.depicts(
                "Kristinagården",
                "Kristine kyrka från luften.jpg",
                "The Kristine church from the air",
            )
        )

    def test_gallerian_omkring_faller(self):
        self.assertFalse(
            wn.depicts("Sturehof", "Sturegallerian.jpg", "Sturegallerian, Östermalm, Stockholm")
        )

    def test_generiska_ord_raknas_med_har(self):
        # SKILLNADEN MOT GRIND 1, och den fäller två fel: kaféet Karla och
        # pizzerian Tellus har båda lånat sitt namn av en biograf intill, och
        # det är just orden café och pizza som skiljer dem åt.
        self.assertFalse(wn.depicts("Karla Cafe", "Karla-biografen.jpg", "Karla-biografen"))
        self.assertFalse(
            wn.depicts("Tellus Pizza", "Biografen Tellus.jpg", '"Biografen Tellus" i Midsommarkransen')
        )

    def test_lopnummer_klistrat_pa_namnet_delar_inte_ordet(self):
        # Nio riktiga träffar föll på just det här innan _ord_i fanns.
        self.assertTrue(wn.depicts("Vikenkyrkan", "Vikenkyrkan3.JPG", None))
        self.assertTrue(wn.depicts("Eriksdalsskolan", "Eriksdalsskolan2010c.jpg", None))

    def test_siffran_ensam_ar_inte_ett_namn(self):
        # "Pizzeria 2" och "Pizzeria 4" är olika ställen på samma gata, alltså
        # får siffran aldrig strykas ur VÅRT namn.
        self.assertFalse(wn.depicts("Pizzeria 2", "Pizzeria 4, Stockholm.jpg", None))

    def test_tomt_namn_ar_aldrig_belagt(self):
        self.assertFalse(wn.depicts("", "Tennstopet Stockholm.jpg", None))


class Ladan(unittest.TestCase):
    def test_utan_koordinater_finns_ingen_lada(self):
        # Borgholm, Höganäs, Lomma och Svenljunga: 974 rader utan koordinat.
        self.assertIsNone(wn.bounding_box([(None, None), (None, None)]))

    def test_marginalen_laggs_till_at_bada_hallen(self):
        syd, vast, nord, ost = wn.bounding_box([(59.3, 18.0), (59.4, 18.1)], margin=0.01)
        self.assertAlmostEqual(syd, 59.29)
        self.assertAlmostEqual(vast, 17.99)
        self.assertAlmostEqual(nord, 59.41)
        self.assertAlmostEqual(ost, 18.11)

    def test_halva_koordinaten_raknas_inte(self):
        self.assertIsNone(wn.bounding_box([(59.3, None)]))


class Filnamnet(unittest.TestCase):
    """WDQS lämnar P18 som en URL, inte som ett filnamn."""

    def test_url_blir_filnamn(self):
        self.assertEqual(
            wn._filnamn(
                "http://commons.wikimedia.org/wiki/Special:FilePath/"
                "Den%20Gyldene%20Freden%202013a.jpg"
            ),
            "Den Gyldene Freden 2013a.jpg",
        )

    def test_understreck_blir_mellanslag(self):
        # Wikidata skriver ibland understreck där Commons har mellanslag.
        self.assertEqual(
            wn._filnamn("http://commons.wikimedia.org/wiki/Special:FilePath/Riche_Stockholm_02.jpg"),
            "Riche Stockholm 02.jpg",
        )


class Hopparningen(unittest.TestCase):
    FREDEN = (59.323283, 18.071583)

    def test_alla_grindar_ihop(self):
        index = wn.Index([objekt(punkter=(self.FREDEN,))])
        traff = wn.pair(index, "Den Gyldene Freden", *self.FREDEN)
        self.assertIsNotNone(traff)
        self.assertEqual(traff.objekt.qid, "Q1145843")

    def test_fel_klass_far_ingen_traff_hur_nara_den_an_ligger(self):
        index = wn.Index([objekt(namn="Gamla stan", klasser=("Q2983893",), punkter=(self.FREDEN,))])
        self.assertIsNone(wn.pair(index, "Gamla stan", *self.FREDEN))

    def test_narmaste_vinner_nar_tva_passerar(self):
        nara = objekt(punkter=(self.FREDEN,))
        langre = wn.Objekt(
            qid="Q2", namn="Den gyldene freden", bild="annan.jpg",
            punkter=((59.323900, 18.071583),), klasser=("Q41176",),
        )
        index = wn.Index([langre, nara])
        self.assertEqual(wn.pair(index, "Den Gyldene Freden", *self.FREDEN).objekt.qid, "Q1145843")

    def test_utan_namn_ingen_traff(self):
        index = wn.Index([objekt(punkter=(self.FREDEN,))])
        self.assertIsNone(wn.pair(index, None, *self.FREDEN))

    def test_alias_duger_som_namn(self):
        # "Bank Hotel" ligger i huset Arsenalsgatan 6, och det är aliaset som
        # binder ihop dem.
        o = wn.Objekt(
            qid="Q3", namn="Arsenalsgatan 6", bild="Arsenalsgatan 6.JPG",
            punkter=(self.FREDEN,), klasser=("Q41176",), alias=("Bank Hotel",),
        )
        self.assertIsNotNone(wn.pair(wn.Index([o]), "Bank Hotel", *self.FREDEN))


if __name__ == "__main__":
    unittest.main(verbosity=2)
