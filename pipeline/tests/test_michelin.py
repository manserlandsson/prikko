"""Prov för Michelinspåret, med slutåret som det viktigaste fallet.

    python3 pipeline/tests/test_michelin.py

Inget fall nedan är påhittat. Varje objekt är ett verkligt Wikidata-objekt med
sina verkliga kvalificerare, mätt 2026-08-25, och varje par som ska FALLA är
ett par som körningen mot alla tolv kommunerna faktiskt lade fram. Se
prikko/michelin.py.

DET FALL SOM BÄR ALLA ANDRA är Operakällaren: en indragen stjärna 1998 till
2009 och en gällande sedan 2014, på samma objekt. Ett spår som läser objektet i
stället för påståendet blir fel åt ett av två håll, och båda felen står nedan.
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko import michelin as mi  # noqa: E402
from prikko import wikidatanamn as wn  # noqa: E402
from prikko.oppettider import name_tokens  # noqa: E402


def utm(start=None, slut=None, antal=None):
    return mi.Utmarkelse(start=start, slut=slut, antal=antal)


def objekt(
    qid="Q69319048",
    namn="Ekstedt",
    punkter=((59.336944, 18.075278),),
    klasser=("Q11707",),
    alias=(),
    beskrivning="restaurang i Sverige",
    plats="Stockholms kommun",
    utmarkelser=(utm("2013-01-01", None, 1),),
):
    return mi.Stjarnobjekt(
        qid=qid,
        namn=namn,
        punkter=tuple(punkter),
        klasser=tuple(klasser),
        alias=tuple(alias),
        beskrivning=beskrivning,
        plats=plats,
        utmarkelser=tuple(utmarkelser),
    )


# Objekten som återkommer nedan, med sina riktiga tal.
BON_LLOC = objekt(
    qid="Q70679289",
    namn="Bon Lloc",
    beskrivning="förra restaurang i Stockholm",
    utmarkelser=(utm("1997-01-01", "2005-01-01", 1),),
)
OPERAKALLAREN = objekt(
    qid="Q10610464",
    namn="Operakällaren",
    punkter=((59.329722, 18.072222),),
    beskrivning="restaurang vid Operan i Stockholm",
    utmarkelser=(
        utm("1998-01-01", "2009-01-01", 1),
        utm("2014-01-01", None, 1),
    ),
)
ALOE = objekt(
    qid="Q86368023",
    namn="Aloë",
    beskrivning="restaurang i Sverige",
    utmarkelser=(
        utm("2018-01-01", "2019-01-01", 1),
        utm("2020-01-01", None, 2),
    ),
)
MATHIAS_DAHLGREN = objekt(
    qid="Q10578328",
    namn="Mathias Dahlgren",
    punkter=((59.329167, 18.078611),),
    beskrivning="restaurang i Grand Hôtel, Stockholm",
    utmarkelser=(utm("2009-01-01", None, None),),
)
SUSHI_SHO = objekt(
    qid="Q78190159",
    namn="Sushi Sho",
    punkter=((59.343056, 18.043333),),
    klasser=("Q10861387",),
    beskrivning="restaurang i Stockholm",
    utmarkelser=(utm("2016-01-01", None, 1),),
)


class Slutaret(unittest.TestCase):
    """Grind 3, och den viktigaste av dem alla.

    Ett falskt påstående om en namngiven verksamhet går inte att ta tillbaka
    när sidan är indexerad.
    """

    def test_indragen_stjarna_ar_inte_gallande(self):
        self.assertEqual(BON_LLOC.gallande(), ())
        self.assertIsNone(BON_LLOC.aktuell())

    def test_gallande_stjarna_utan_slutar(self):
        self.assertEqual(len(objekt().gallande()), 1)

    def test_indragen_OCH_gallande_pa_samma_objekt_ar_gallande(self):
        """Operakällaren. Grinden går per påstående och aldrig per objekt."""
        self.assertEqual(len(OPERAKALLAREN.utmarkelser), 2)
        self.assertEqual(len(OPERAKALLAREN.gallande()), 1)
        self.assertEqual(OPERAKALLAREN.aktuell().start, "2014-01-01")

    def test_antalet_lases_ur_det_gallande_pastaendet(self):
        """Aloë hade en stjärna till 2019 och har två sedan 2020."""
        self.assertEqual(ALOE.antal_stjarnor(), 2)

    def test_senast_startade_gallande_vinner(self):
        """Daniel Berlin krog bär två gällande påståenden, 2016 och 2018."""
        tva = objekt(
            utmarkelser=(utm("2016-01-01", None, 1), utm("2018-01-01", None, 2))
        )
        self.assertEqual(tva.aktuell().start, "2018-01-01")
        self.assertEqual(tva.antal_stjarnor(), 2)

    def test_antal_som_saknas_blir_inte_en_etta(self):
        """Mathias Dahlgrens påstående bär ingen P1114. Vi gissar aldrig."""
        self.assertIsNone(MATHIAS_DAHLGREN.antal_stjarnor())
        self.assertIsNotNone(MATHIAS_DAHLGREN.aktuell())


class Delmangd(unittest.TestCase):
    """Grind 1. Delmängd räcker, till skillnad från bildspåret.

    Fallen är de tre som föll på identitetskravet i körningen 2026-08-25 och
    som ägaren pekade ut som våra.
    """

    def stammer(self, vart, deras):
        return mi.namnet_stammer(
            wn.distinct(name_tokens(vart)), wn.distinct(name_tokens(deras))
        )

    def test_vart_register_skriver_ut_ett_led_till(self):
        """Restaurant Frantzén mot Frantzén. Engelska "restaurant" är inte
        en bolagsform i `_LEGAL` och stryks alltså inte."""
        self.assertTrue(self.stammer("Restaurant Frantzén", "Frantzén"))

    def test_platsnamn_i_vart_led(self):
        self.assertTrue(self.stammer("Aira Biskopsudden", "Aira"))

    def test_krogordet_i_vart_led(self):
        self.assertTrue(self.stammer("Krog Agrikultur, K/A", "Agrikultur"))

    def test_likhet_racker_aven_under_langdkravet(self):
        """Sushi SHO mot Sushi Sho. Kvar efter `distinct` är "sho", tre
        tecken, och det duger just för att det är en LIKHET."""
        self.assertTrue(self.stammer("Sushi SHO", "Sushi Sho"))

    def test_kort_ensamt_ord_racker_inte_som_delmangd(self):
        """"Sav" i Malmö är tre tecken och kan sitta inuti vilket namn som
        helst."""
        self.assertFalse(self.stammer("Sav Hantverk & Design", "Sav"))

    def test_helt_olika_namn_faller(self):
        self.assertFalse(self.stammer("Tennstopet", "Ekstedt"))

    def test_tomt_namn_faller(self):
        self.assertFalse(self.stammer("", "Ekstedt"))


class Registret(unittest.TestCase):
    """Grind 1b prövas en gång per objekt, inte en gång per verksamhet."""

    def test_beskrivande_etikett_kommer_aldrig_in(self):
        skrap = objekt(qid="Q69871194", namn="restaurang i Stockholm")
        register = mi.Namnregister([skrap, objekt()])
        self.assertEqual([o.qid for o in register.uteslutna], ["Q69871194"])
        self.assertEqual(register.namnlika("Stockholm Pizza"), [])

    def test_namnlika_ger_kandidater_som_delar_ett_ord(self):
        register = mi.Namnregister([objekt()])
        self.assertEqual(len(register.namnlika("Restaurang Ekstedt")), 1)
        self.assertEqual(register.namnlika("Tennstopet"), [])


class Klassen(unittest.TestCase):
    """Grind 2. Objektet ska vara ett MATSTÄLLE, inte vilket ting som helst."""

    def test_restaurang_slapps_igenom(self):
        self.assertTrue(objekt(klasser=("Q11707",)).tillaten_klass())

    def test_sushirestaurang_slapps_igenom(self):
        """Sushi Shos enda klass är Q10861387, som saknas i ALLOWED_CLASSES."""
        self.assertTrue(SUSHI_SHO.tillaten_klass())

    def test_byggnad_ensam_faller(self):
        """Ett hus är inte ett matställe, hur nära det än ligger."""
        self.assertFalse(objekt(klasser=("Q41176",)).tillaten_klass())

    def test_skola_faller(self):
        """Den bredare listan i wikidatanamn släpper in skolor. Inte den här."""
        self.assertFalse(objekt(klasser=("Q3914",)).tillaten_klass())

    def test_en_tillaten_klass_av_flera_racker(self):
        self.assertTrue(objekt(klasser=("Q41176", "Q11707")).tillaten_klass())

    def test_utan_klass_svarar_nej_men_far_en_andra_chans(self):
        utan = objekt(klasser=(), beskrivning="restaurang i Stockholm")
        self.assertFalse(utan.tillaten_klass())
        self.assertTrue(utan.saknar_klass())
        self.assertTrue(utan.beskrivningen_sager_vad_det_ar())


class BeskrivandeEtikett(unittest.TestCase):
    """Grind 1b. Q69871194 heter "restaurang i Stockholm" på Wikidata.

    `name_tokens` stryker både "restaurang" och "i" som bolagsord, så det som
    återstår är ortnamnet, och "Stockholm Pizza" på Scheelegatan 15 blev en
    lika ordmängd i körningen 2026-08-25.
    """

    def test_etikett_som_bara_ar_ort_faller(self):
        self.assertTrue(mi.beskrivande_etikett("restaurang i Stockholm"))

    def test_riktigt_namn_passerar(self):
        self.assertFalse(mi.beskrivande_etikett("Ekstedt"))

    def test_namn_som_innehaller_orten_passerar(self):
        self.assertFalse(mi.beskrivande_etikett("Hotell Stockholm"))

    def test_tomt_namn_faller(self):
        self.assertTrue(mi.beskrivande_etikett(""))


class Avstandet(unittest.TestCase):
    """Grind 4. Namnlikhet ensam räcker aldrig när det finns en koordinat."""

    def para(self, namn, lat, lng, objekten):
        return mi.para(
            mi.Namnregister(objekten), namn, lat, lng, "Stockholms stad", "Stockholm"
        )

    def test_samma_stalle_blir_en_traff(self):
        provning = self.para("Ekstedt", 59.336944, 18.075278, [objekt()])
        self.assertIsNotNone(provning.traff)
        self.assertEqual(provning.traff.grind, mi.GRIND_NARHET)
        self.assertLess(provning.traff.metres, 1)

    def test_livsbutik_i_annan_kommun_faller_pa_avstandet(self):
        """Koka Livs i Kristinehamn mot Koka i Göteborg, 218 kilometer.

        "livs" är en bolagsform i `_LEGAL`, så ordmängderna ÄR lika. Bara
        avståndet skiljer en livsmedelsbutik från en stjärnkrog.
        """
        koka = objekt(qid="Q19521115", namn="Koka", punkter=((57.696, 11.978),))
        provning = self.para("Koka Livs", 59.3097, 14.1093, [koka])
        self.assertIsNone(provning.traff)
        self.assertEqual(len(provning.avvisade), 1)
        self.assertEqual(provning.avvisade[0].skal, mi.SKAL_AVSTAND)

    def test_flyttad_restaurang_faller_och_redovisas(self):
        """Adam Albin på Regeringsgatan 2 mot Q112960903 på Rådmansgatan.

        Restaurangen har flyttat. Kommunens register vet det, Wikidata inte.
        Grinden fäller, och fallet ska SYNAS så att Wikidata kan rättas.
        """
        adam = objekt(
            qid="Q112960903", namn="Adam / Albin", punkter=((59.343, 18.066139),)
        )
        provning = self.para("Adam Albin", 59.329855, 18.068767, [adam])
        self.assertIsNone(provning.traff)
        self.assertEqual(provning.avvisade[0].skal, mi.SKAL_AVSTAND)
        self.assertGreater(provning.avvisade[0].metres, 1400)

    def test_indragen_stjarna_paras_aldrig(self):
        """Bon Lloc ligger på Långholmsgatan. Namn och avstånd stämmer."""
        bon = mi.Stjarnobjekt(
            qid=BON_LLOC.qid,
            namn=BON_LLOC.namn,
            punkter=((59.317, 18.033),),
            klasser=BON_LLOC.klasser,
            alias=(),
            beskrivning=BON_LLOC.beskrivning,
            plats="Stockholms kommun",
            utmarkelser=BON_LLOC.utmarkelser,
        )
        provning = self.para("Bon Lloc", 59.317, 18.033, [bon])
        self.assertIsNone(provning.traff)
        self.assertEqual(provning.avvisade[0].skal, mi.SKAL_INDRAGEN)

    def test_var_rad_utan_koordinat_faller(self):
        """Borgholm, Höganäs, Lomma och Svenljunga saknar koordinater helt."""
        provning = self.para("Ekstedt", None, None, [objekt()])
        self.assertIsNone(provning.traff)
        self.assertEqual(provning.avvisade[0].skal, mi.SKAL_VAR_KOORDINAT)


class UtanKoordinat(unittest.TestCase):
    """Grind 4:s andra gren. Saknas objektets koordinat skärps namnet.

    Ingen av de 42 saknar koordinat i dag, så grenen är oprövad i skarp drift.
    Proven nedan är därför den enda mätning som finns av den.
    """

    def para(self, namn, objekten):
        return mi.para(
            mi.Namnregister(objekten), namn, 59.33, 18.07, "Stockholms stad", "Stockholm"
        )

    def test_tva_ord_och_ratt_kommun_passerar(self):
        o = objekt(namn="Mathias Dahlgren", punkter=(), plats="Stockholms kommun")
        provning = self.para("Mathias Dahlgren", [o])
        self.assertIsNotNone(provning.traff)
        self.assertEqual(provning.traff.grind, mi.GRIND_STRANGT_NAMN)
        self.assertIsNone(provning.traff.metres)

    def test_ett_ord_racker_inte(self):
        o = objekt(namn="Ekstedt", punkter=(), plats="Stockholms kommun")
        provning = self.para("Ekstedt", [o])
        self.assertIsNone(provning.traff)
        self.assertEqual(provning.avvisade[0].skal, mi.SKAL_SVAGT_NAMN)

    def test_annan_kommun_faller(self):
        o = objekt(namn="Mathias Dahlgren", punkter=(), plats="Göteborgs kommun")
        provning = self.para("Mathias Dahlgren", [o])
        self.assertIsNone(provning.traff)
        self.assertEqual(provning.avvisade[0].skal, mi.SKAL_FEL_KOMMUN)

    def test_generiskt_ord_raknas_med_i_det_stranga_namnet(self):
        """`strangt_namn` jämför HELA ordmängden, de generiska inbegripna.

        "Dashi Bar" och "Dashi" är samma ordmängd efter `distinct` och olika
        före. Utan koordinat är den skillnaden allt vi har.
        """
        self.assertFalse(
            mi.strangt_namn(name_tokens("Dashi Bar"), name_tokens("Dashi Kök"))
        )
        self.assertTrue(
            mi.strangt_namn(name_tokens("Dashi Bar"), name_tokens("Dashi bar"))
        )


class Raden(unittest.TestCase):
    """Det som skrivs i datafilen."""

    def test_raden_bar_det_gallande_pastaendet(self):
        rad = mi.raden(OPERAKALLAREN)
        self.assertEqual(rad["qid"], "Q10610464")
        self.assertEqual(rad["stars"], 1)
        # 2014 och inte 1998: det indragna påståendet får aldrig sätta årtalet.
        self.assertEqual(rad["since"], "2014")

    def test_saknat_antal_blir_none_i_filen(self):
        rad = mi.raden(MATHIAS_DAHLGREN)
        self.assertIsNone(rad["stars"])
        self.assertEqual(rad["since"], "2009")


class Antalet(unittest.TestCase):
    """`P1114` läses som ett tal och gissas aldrig."""

    def test_heltal(self):
        self.assertEqual(mi._antal("2"), 2)

    def test_saknat_varde(self):
        self.assertIsNone(mi._antal(None))

    def test_olasbart_varde_blir_inget_antal(self):
        self.assertIsNone(mi._antal("okänt"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
