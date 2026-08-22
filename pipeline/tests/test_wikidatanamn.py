"""Prov för namnspåret: de fyra grindarna, var och en med sitt riktiga fel.

    python3 pipeline/tests/test_wikidatanamn.py

Inget fall nedan är påhittat. Varje par är ett verkligt utfall ur körningen
2026-08-19 mot 16 047 verksamheter och 8 711 Wikidata-objekt, och de som ska
FALLA är de som faktiskt gjorde fel innan grinden fanns. Se
prikko/wikidatanamn.py och docs/39_fler_bilder.md.
"""

import sys
import unittest
import unittest.mock
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko import wikidatanamn as wn  # noqa: E402
from prikko.oppettider import name_tokens  # noqa: E402


def objekt(namn="Den gyldene freden", bild="Den Gyldene Freden 2013a.jpg",
           punkter=((59.323283, 18.071583),), klasser=("Q11707",), alias=(),
           beskrivning=""):
    return wn.Objekt(
        qid="Q1145843", namn=namn, bild=bild,
        punkter=tuple(punkter), klasser=tuple(klasser), alias=tuple(alias),
        beskrivning=beskrivning,
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


class Beskrivningen(unittest.TestCase):
    """Substitutet för P31 när Wikidata inte sagt vad tinget är.

    Mätt 2026-08-22: av 15 namnlika par utan P31 inom en kilometer bär sex en
    svensk beskrivning, och bara ett av dem ligger bortom fyrtio meter.
    """

    def sager(self, text):
        return objekt(klasser=(), beskrivning=text).beskrivningen_sager_vad_det_ar()

    def test_restaurang_racker(self):
        self.assertTrue(self.sager("restaurang i Stockholm"))

    def test_pluralis_racker(self):
        # Restaurang Pelikans objekt står faktiskt i pluralis på Wikidata.
        self.assertTrue(self.sager("restauranger i Stockholm"))

    def test_cafe_med_accent_racker(self):
        # Sundbergs står som "café", inte som "kafé".
        self.assertTrue(self.sager("traditionsrikt café i Stockholm"))

    def test_skolan_racker(self):
        self.assertTrue(self.sager("skola i Hägerstensåsen, Stockholm"))

    def test_stadsdelen_faller(self):
        # Gamla Östberga Bageri AB mot stadsdelen Gamla Östberga, 321 meter.
        self.assertFalse(self.sager("stadsdel i Stockholms kommun"))

    def test_bindeordet_racker_inte(self):
        # Orden "i" och "av" står med avsikt inte i listan: annars hade varje
        # svensk beskrivning som helst passerat.
        self.assertFalse(self.sager("plats i Stockholm"))

    def test_utan_beskrivning_faller(self):
        # Långpannan Pizzeria mot platsen Långpannan, 520 meter. Objektet har
        # ingen beskrivning alls.
        self.assertFalse(self.sager(""))

    def test_utomhusbadet_faller(self):
        # Tinnerbäcksbadet, 184 meter. Ordet står inte i listan, alltså ingen
        # bild. En okänd sorts ting betyder ingen bild, precis som en okänd
        # klass gör.
        self.assertFalse(self.sager("kommunalt utomhusbad i Linköping"))


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


class Delningen(unittest.TestCase):
    """Klipper WDQS strömmen delas lådan i fyra.

    Uppmätt 2026-08-22: Stockholms låda gav 917 504 bytes, alltså jämnt 896
    KiB, med sista strängen oavslutad, medan Uppsala gav 940 965 bytes helt.
    Ingen storleksgräns alltså, utan en ström som klipps när tjänsten slår i
    sin egen tidsgräns mitt i utskicket. De fem inbyggda omförsöken föll på
    exakt samma teckenposition, för frågan tar lika lång tid varje gång.
    """

    def _svar(self, item, lat, lon, klass=None):
        rad = {
            "item": {"value": f"http://www.wikidata.org/entity/{item}"},
            "itemLabel": {"value": item},
            "img": {"value": "http://commons.wikimedia.org/wiki/Special:FilePath/A.jpg"},
            "lat": {"value": str(lat)},
            "lon": {"value": str(lon)},
        }
        if klass:
            rad["klass"] = {"value": f"http://www.wikidata.org/entity/{klass}"}
        return rad

    def test_hela_ladan_fragas_i_fyra_delar_nar_strommen_klipps(self):
        fragade = []

        def falsk_ask(sparql, **_):
            # Den odelade lådan spänner 59.0 till 60.0. Kvadranterna möts i
            # 59.5, så mittvärdet i frågan skiljer dem åt.
            bred = '"Point(18.0 59.0)"' in sparql and '"Point(19.0 60.0)"' in sparql
            fragade.append("hel" if bred else "del")
            if bred:
                raise wn.AvhuggetSvar("klippt vid 916120")
            if "alias" in sparql.lower():
                return []
            return [self._svar(f"Q{len(fragade)}", 59.25, 18.25)]

        with unittest.mock.patch.object(wn, "_ask", falsk_ask), \
                unittest.mock.patch.object(wn, "POLITE_DELAY_S", 0):
            objekt_ut = wn.objects_in_box((59.0, 18.0, 60.0, 19.0))

        self.assertEqual(fragade.count("hel"), 1)
        # Fyra kvadranter, var och en med objektfrågan och aliasfrågan.
        self.assertEqual(fragade.count("del"), 8)
        self.assertEqual(len(objekt_ut), 4)

    def test_samma_objekt_i_tva_kvadranter_slas_ihop(self):
        # Ett objekt kan bära flera koordinater och därmed dyka upp i två
        # rutor. Sammanslagningen är på qid och unionerar punkterna.
        def falsk_ask(sparql, **_):
            if '"Point(18.0 59.0)"' in sparql and '"Point(19.0 60.0)"' in sparql:
                raise wn.AvhuggetSvar("klippt")
            if "alias" in sparql.lower():
                return []
            if '"Point(18.5 59.5)"' in sparql:  # nordöstra rutan
                return [self._svar("Q7", 59.75, 18.75, klass="Q11707")]
            return [self._svar("Q7", 59.25, 18.25)]

        with unittest.mock.patch.object(wn, "_ask", falsk_ask), \
                unittest.mock.patch.object(wn, "POLITE_DELAY_S", 0):
            objekt_ut = wn.objects_in_box((59.0, 18.0, 60.0, 19.0))

        self.assertEqual(len(objekt_ut), 1)
        self.assertEqual(len(objekt_ut[0].punkter), 2)
        self.assertEqual(objekt_ut[0].klasser, ("Q11707",))

    def test_delningen_ger_upp_i_stallet_for_att_dela_i_evighet(self):
        def falsk_ask(sparql, **_):
            raise wn.AvhuggetSvar("klippt")

        with unittest.mock.patch.object(wn, "_ask", falsk_ask), \
                unittest.mock.patch.object(wn, "POLITE_DELAY_S", 0):
            with self.assertRaises(wn.AvhuggetSvar):
                wn.objects_in_box((59.0, 18.0, 60.0, 19.0))


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

    def test_utan_p31_men_inpa_oss_slapps_igenom(self):
        # Rolfs kök, Q10656465, 0,8 meter. Objektet har varken P31 eller
        # beskrivning, och avståndet är det enda belägget som finns.
        nara = (59.323290, 18.071583)
        index = wn.Index([objekt(namn="Rolfs kök", klasser=(), punkter=(nara,))])
        self.assertIsNotNone(wn.pair(index, "Rolfs Kök", *self.FREDEN))

    def test_utan_p31_och_utan_beskrivning_faller_bortom_fyrtio_meter(self):
        # Bällsta gård, 97 meter. Ingen klass, ingen beskrivning, för långt.
        langt = (59.324160, 18.071583)
        index = wn.Index([objekt(namn="Bällsta gård", klasser=(), punkter=(langt,))])
        self.assertIsNone(wn.pair(index, "Bällsta gård", *self.FREDEN))

    def test_beskrivningen_bar_avstandet_bortom_fyrtio_meter(self):
        # Hägerstensåsens skola, 75 meter, "skola i Hägerstensåsen, Stockholm".
        # Enda paret av femton som den här grinden vinner.
        langt = (59.323961, 18.071583)
        index = wn.Index([
            objekt(
                namn="Hägerstensåsens skola", klasser=(), punkter=(langt,),
                beskrivning="skola i Hägerstensåsen, Stockholm",
            )
        ])
        self.assertIsNotNone(wn.pair(index, "Hägerstensåsens Skola", *self.FREDEN))

    def test_beskrivningen_baddar_inte_fel_klass(self):
        # En P31 som INTE står i tillåtelselistan är ett besked och inte en
        # lucka, och då hjälper ingen beskrivning i världen.
        index = wn.Index([
            objekt(
                namn="Gamla stan", klasser=("Q2983893",), punkter=(self.FREDEN,),
                beskrivning="restaurang i Stockholm",
            )
        ])
        self.assertIsNone(wn.pair(index, "Gamla stan", *self.FREDEN))

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
