"""Prov för den BREDA vägen till en Wikidata-bild, med lånen som viktigaste fall.

    python3 pipeline/tests/test_wikidatako.py

Inget fall nedan är påhittat. Varje objekt är ett verkligt Wikidata-objekt med
sitt verkliga Q-nummer, sin verkliga P31 och sitt verkliga filnamn, mätt
2026-08-25 över 16 047 verksamheter och 8 716 objekt, och varje par som ska
FALLA är ett par körningen faktiskt lade fram. Se prikko/wikidatanamn.py och
pipeline/wikidatako.py.

DE FEM FALL SOM BÄR ALLA ANDRA är de i `wikidatanamn` grind 1: verksamheter som
lånat en plats namn. De är skälet till att den automatiska vägen kräver LIKHET,
och den breda vägen får inte släppa fram en enda av dem.

    Gränna Chokladfabrik                    →  orten Gränna              98,7 m
    Coop Östra Torget 07-5900               →  torget Östra torget       78,2 m
    Sushi Yama Mitt I City                  →  köpcentret Mitt i city    21,4 m
    Kronans Apotek Karlstad Drottninggatan  →  gatan Drottninggatan      25,8 m
    Max Hamburgerrestaurang Behrn Arena     →  arenan Behrn Arena        65,2 m

Två av dem ligger innanför varje kort avståndsspärr som varit rimlig att sätta,
och det är därför avståndet INTE är den grind som fäller dem. Det gör klassen.
"""

import sys
import unittest
import unittest.mock
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko import wikidatanamn as wn  # noqa: E402
from prikko.oppettider import name_tokens  # noqa: E402

#: Den Gyldene Fredens punkt, samma utgångspunkt som test_wikidatanamn.py.
HAR = (59.323283, 18.071583)

#: Ett grads latitud är 111 320 meter. Talen nedan flyttar en punkt norrut ett
#: bestämt antal meter, så att ett prov kan säga vilket avstånd det menar.
def norrut(meter: float, fran=HAR):
    return (fran[0] + meter / 111_320.0, fran[1])


def objekt(qid="Q5492658", namn="Frantzén", bild="AV4A6287 (25063454437).jpg",
           punkter=(HAR,), klasser=("Q11707",), alias=(), beskrivning="",
           artikel=""):
    return wn.Objekt(
        qid=qid, namn=namn, bild=bild, punkter=tuple(punkter),
        klasser=tuple(klasser), alias=tuple(alias), beskrivning=beskrivning,
        artikel=artikel,
    )


# De fem lånen, med sina riktiga Q-nummer och sina riktiga P31.
GRANNA = objekt(qid="Q194353", namn="Gränna", bild="View of Gränna.jpg",
                klasser=("Q12813115",), beskrivning="tätort i Sverige")
OSTRA_TORGET = objekt(qid="Q27941396", namn="Östra torget",
                      bild="Östra torget Jönköping.jpg", klasser=("Q174782",))
MITT_I_CITY = objekt(qid="Q10586649", namn="Mitt i city",
                     bild="Mitt-i-city, Karlstad.jpg", klasser=("Q11315",))
DROTTNINGGATAN = objekt(qid="Q98557009", namn="Drottninggatan",
                        bild="Drottninggatan 37, Karlstad.JPG", klasser=("Q79007",))
BEHRN_ARENA = objekt(qid="Q814577", namn="Behrn Arena",
                     bild="Behrn Arena 2008.JPG", klasser=("Q1154710",))

LANEN = [
    ("Gränna Chokladfabrik", GRANNA),
    ("Coop Östra Torget 07-5900", OSTRA_TORGET),
    ("Sushi Yama Mitt I City", MITT_I_CITY),
    ("Kronans Apotek Karlstad Drottninggatan", DROTTNINGGATAN),
    ("Max Hamburgerrestaurang Behrn Arena", BEHRN_ARENA),
]


class DeFemLanen(unittest.TestCase):
    """Ingen av de fem får släppas fram, hur nära den än ligger.

    Provet placerar objektet EN METER bort och inte på sitt uppmätta avstånd,
    och det är avsiktligt. Hade avståndet varit det som fällde dem hade provet
    gått igenom av fel skäl, och den dag någon lättar på klassgrinden hade
    provet fortsatt vara grönt.
    """

    def test_namngrinden_ensam_racker_inte(self):
        # Grind 1b SLÄPPER IGENOM alla fem, och det är hela poängen med det
        # här provet: namnet är inte det som skiljer ett lån från en träff.
        for vart, o in LANEN:
            with self.subTest(vart):
                self.assertTrue(
                    wn.rymmer(
                        wn.distinct(name_tokens(vart)),
                        wn.distinct(name_tokens(o.namn)),
                    )
                )

    def test_klassgrinden_faller_alla_fem(self):
        for vart, o in LANEN:
            with self.subTest(vart):
                self.assertFalse(wn.slaget_duger(o, avstand=1.0))

    def test_ingen_av_de_fem_blir_en_bred_traff(self):
        for vart, o in LANEN:
            with self.subTest(vart):
                index = wn.Index([o])
                self.assertIsNone(wn.para_brett(index, vart, *norrut(1.0)))

    def test_beskrivningen_baddar_inte_for_orten(self):
        # Gränna bär beskrivningen "tätort i Sverige", och `BESKRIVNINGSORD`
        # innehåller inte ordet tätort. Vägen förbi klassgrinden är dessutom
        # stängd för objekt som HAR en P31: att sakna klass är en lucka, att ha
        # fel klass är ett besked.
        self.assertFalse(GRANNA.saknar_klass())
        self.assertFalse(GRANNA.beskrivningen_sager_vad_det_ar())


class Rymmer(unittest.TestCase):
    """Grind 1b. Vårt namn får rymma objektets, aldrig tvärtom."""

    def ryms(self, vart, deras):
        return wn.rymmer(
            wn.distinct(name_tokens(vart)), wn.distinct(name_tokens(deras))
        )

    def test_registret_skriver_ut_ett_led_till(self):
        # De fyra fall ägaren och mätningen pekade ut.
        self.assertTrue(self.ryms("Restaurant Frantzén", "Frantzén"))
        self.assertTrue(self.ryms("Aira Biskopsudden", "Aira"))
        self.assertTrue(self.ryms("Biograf Saga", "Saga"))
        # Q10526589 heter "Hotell Malmen" på Wikidata, och det namnet rymmer
        # VÅRT inte: "hotel" och "hotell" är två olika ord. Det som binder
        # ihop dem är aliaset "Scandic Malmen", och `para_brett` prövar alla
        # namnformer just därför.
        self.assertFalse(self.ryms("Scandic Hotel Malmen", "Hotell Malmen"))
        self.assertTrue(self.ryms("Scandic Hotel Malmen", "Scandic Malmen"))

    def test_likhet_ar_inte_en_delmangd(self):
        # Grind 1 har redan svarat på den frågan, och `para_brett` märker
        # träffen med den grind den faktiskt passerade.
        self.assertFalse(self.ryms("Tennstopet", "Tennstopet"))

    def test_deras_namn_far_aldrig_rymma_vart(self):
        # De 128 paren av den sorten 2026-08-25 var genomgående fel.
        self.assertFalse(self.ryms("Café Nikolai", "Sankt Nikolai kyrka"))
        self.assertFalse(self.ryms("Brevens Café", "Brevens kyrka"))
        self.assertFalse(self.ryms("Johannelunds Kiosk", "Johannelunds bibliotek"))

    def test_ett_kort_ensamt_ord_racker_inte(self):
        # Delas bara ETT ord bär ordet hela beviset, och tre bokstäver kan
        # sitta inuti vilket namn som helst. Talet är
        # `oppettider.MIN_SOLO_TOKEN`.
        # Ordmängderna här är redan `distinct`, som i `para_brett`.
        self.assertFalse(wn.rymmer(["ost", "huset"], ["ost"]))

    def test_ett_langt_ensamt_ord_racker(self):
        self.assertTrue(wn.rymmer(["restaurant", "frantzen"], ["frantzen"]))

    def test_generiska_ord_stryks_ur_bada(self):
        # "sushi" och "bar" står i `oppettider._GENERIC` och namnger ingenting.
        self.assertFalse(self.ryms("Sushi Sho", "Sushi SHO"))

    def test_tomt_namn_ar_aldrig_en_traff(self):
        self.assertFalse(wn.rymmer([], ["frantzen"]))
        self.assertFalse(wn.rymmer(["restaurant", "frantzen"], []))


class SlagetDuger(unittest.TestCase):
    """Grind 2, bruten ur `pair` så att båda vägarna frågar samma sak."""

    def test_tillaten_klass_racker(self):
        self.assertTrue(wn.slaget_duger(objekt(klasser=("Q11707",)), avstand=140.0))

    def test_okand_klass_faller_hur_nara_som_helst(self):
        self.assertFalse(wn.slaget_duger(objekt(klasser=("Q2983893",)), avstand=0.5))

    def test_utan_klass_men_inpa_oss(self):
        # Rolfs kök, Q10656465: ingen P31, ingen beskrivning, 0,8 meter bort.
        self.assertTrue(wn.slaget_duger(objekt(klasser=()), avstand=0.8))

    def test_utan_klass_langre_bort_kraver_en_beskrivning(self):
        self.assertFalse(wn.slaget_duger(objekt(klasser=()), avstand=75.4))
        self.assertTrue(
            wn.slaget_duger(
                objekt(klasser=(), beskrivning="skola i Hägerstensåsen, Stockholm"),
                avstand=75.4,
            )
        )


class EttObjektEnVerksamhet(unittest.TestCase):
    """Grind 5. Ett objekt som flera rader tar är ett hus, inte en verksamhet."""

    def test_gallerian_tas_av_atta_rader_och_kastas(self):
        # Asecs, Q10397484, klassat Q41176 byggnad och därför förbi grind 2.
        par = [(f"jkp-{i}", "Q10397484") for i in range(8)]
        self.assertEqual(wn.ett_objekt_en_verksamhet(par), set())

    def test_en_ensam_rad_star_kvar(self):
        self.assertEqual(
            wn.ett_objekt_en_verksamhet([("sthlm-1", "Q5492658")]), {"Q5492658"}
        )

    def test_samma_rad_tva_ganger_ar_fortfarande_en_verksamhet(self):
        par = [("sthlm-1", "Q5492658"), ("sthlm-1", "Q5492658")]
        self.assertEqual(wn.ett_objekt_en_verksamhet(par), {"Q5492658"})

    def test_bara_det_delade_objektet_kastas(self):
        par = [
            ("jkp-1", "Q10397484"),
            ("jkp-2", "Q10397484"),
            ("sthlm-1", "Q5492658"),
        ]
        self.assertEqual(wn.ett_objekt_en_verksamhet(par), {"Q5492658"})


class BredHopparning(unittest.TestCase):
    """`para_brett`: grind 1, 1b och 2 tillsammans."""

    def test_frantzen_slapps_fram_och_marks_med_sin_grind(self):
        traff = wn.para_brett(wn.Index([objekt()]), "Restaurant Frantzén", *norrut(6.5))
        self.assertIsNotNone(traff)
        self.assertEqual(traff.objekt.qid, "Q5492658")
        self.assertEqual(traff.grind, wn.GRIND_DELMANGD)
        self.assertAlmostEqual(traff.metres, 6.5, places=1)

    def test_likhet_marks_som_likhet(self):
        traff = wn.para_brett(wn.Index([objekt(namn="Frantzén")]), "Frantzén", *HAR)
        self.assertEqual(traff.grind, wn.GRIND_LIKA)

    def test_narmast_vinner_nar_tva_passerar(self):
        # "Aira Biskopsudden" paras mot udden Biskopsudden på 64,6 meter och
        # mot restaurangen Aira på 5,3. Udden faller redan på klassen, men
        # provet visar att närheten avgör även när båda duger.
        nara = objekt(qid="Q101654536", namn="Aira", bild="Aira, Stockholm 01.jpg")
        langt = objekt(qid="Q9", namn="Aira Biskopsudden", bild="B.jpg",
                       punkter=(norrut(64.6),), klasser=("Q41176",))
        traff = wn.para_brett(wn.Index([nara, langt]), "Aira Biskopsudden", *norrut(5.3))
        self.assertEqual(traff.objekt.qid, "Q101654536")

    def test_for_langt_bort_faller(self):
        langt = objekt(punkter=(norrut(200.0),))
        self.assertIsNone(
            wn.para_brett(wn.Index([langt]), "Restaurant Frantzén", *HAR)
        )

    def test_utan_namn_ingen_traff(self):
        self.assertIsNone(wn.para_brett(wn.Index([objekt()]), None, *HAR))

    def test_aliaset_far_rymmas_det_ocksa(self):
        o = objekt(qid="Q3", namn="Arsenalsgatan 6", bild="Arsenalsgatan 6.JPG",
                   klasser=("Q41176",), alias=("Bank Hotel",))
        traff = wn.para_brett(wn.Index([o]), "Bank Hotel Stockholm", *HAR)
        self.assertIsNotNone(traff)
        self.assertEqual(traff.grind, wn.GRIND_DELMANGD)


class SmalaVagenAroRord(unittest.TestCase):
    """Den automatiska vägen ska vara exakt som förut.

    Grind 1b och grind 5 lever bara i `para_brett` och i kön. Ändras `pair`
    börjar bilder skrivas i site/src/data utan att någon sett dem, och det är
    det enda felet i den här modulen som inte går att ta tillbaka.
    """

    def test_pair_kraver_fortfarande_likhet(self):
        index = wn.Index([objekt()])
        self.assertIsNone(wn.pair(index, "Restaurant Frantzén", *norrut(6.5)))

    def test_pair_slapper_fortfarande_igenom_likhet(self):
        index = wn.Index([objekt(namn="Frantzén")])
        self.assertIsNotNone(wn.pair(index, "Frantzén", *HAR))


class Artikelbilden(unittest.TestCase):
    """Objekt utan P18 men med en artikel på svenska Wikipedia."""

    def test_titeln_ur_sitelanken(self):
        self.assertEqual(
            wn.artikeltitel("https://sv.wikipedia.org/wiki/Zum%20Franziskaner"),
            "Zum Franziskaner",
        )
        self.assertEqual(
            wn.artikeltitel("https://sv.wikipedia.org/wiki/Sm%C3%A5lands_nation"),
            "Smålands nation",
        )

    def _svar(self, sidor, normalized=()):
        payload = {"query": {"pages": {str(i): s for i, s in enumerate(sidor)}}}
        if normalized:
            payload["query"]["normalized"] = list(normalized)
        return payload

    def _ledbilder(self, payload, titlar):
        class Falsk:
            def __enter__(self_inner):
                return self_inner

            def __exit__(self_inner, *_):
                return False

            def read(self_inner):
                import json

                return json.dumps(payload).encode("utf-8")

        with unittest.mock.patch.object(
            wn.urllib.request, "urlopen", lambda *a, **k: Falsk()
        ), unittest.mock.patch.object(wn, "POLITE_DELAY_S", 0):
            return wn.ledbilder(titlar)

    def test_ledbilden_lases_ur_pageimages(self):
        svar = self._svar([
            {"title": "Zum Franziskaner", "pageimage": "Zum_Franziskaner_1907.jpg"}
        ])
        self.assertEqual(
            self._ledbilder(svar, ["Zum Franziskaner"]),
            {"Zum Franziskaner": "Zum Franziskaner 1907.jpg"},
        )

    def test_artikel_utan_ledbild_svarar_none(self):
        svar = self._svar([{"title": "Något"}])
        self.assertEqual(self._ledbilder(svar, ["Något"]), {"Något": None})

    def test_normaliserad_titel_hittas_av_den_som_fragade(self):
        # MediaWiki svarar på sin egen stavning. Frågade vi på en annan ska
        # svaret ändå gå att slå upp på den vi frågade med.
        svar = self._svar(
            [{"title": "Zum Franziskaner", "pageimage": "A.jpg"}],
            normalized=[{"from": "Zum franziskaner", "to": "Zum Franziskaner"}],
        )
        funna = self._ledbilder(svar, ["Zum franziskaner"])
        self.assertEqual(funna["Zum franziskaner"], "A.jpg")

    def test_okand_titel_saknas_inte_ur_kartan(self):
        # En titel API:et inte svarar om alls ska ge None och inte en KeyError
        # hos den som frågade.
        self.assertEqual(self._ledbilder(self._svar([]), ["Borta"]), {"Borta": None})


class MotivetArEnUpplysning(unittest.TestCase):
    """Grind 4 fäller inte i kön, den skriver ut på kortet.

    Det är hela skälet till att kön finns. Filen ägaren pekade på heter
    "AV4A6287 (25063454437).jpg" och har "AV4A6287" som beskrivning på Commons,
    alltså kan ingen regel se vad den föreställer.
    """

    def test_frantzens_fil_saknar_namnet(self):
        self.assertFalse(
            wn.depicts("Restaurant Frantzén", "AV4A6287 (25063454437).jpg", "AV4A6287")
        )

    def test_en_fil_som_bar_namnet_marks(self):
        self.assertTrue(
            wn.depicts(
                "Livgrenadjärmässen Hotell- Fest- Konferens",
                "Livgrenadjärmässen Hotell-Fest-Konferens.jpg",
                None,
            )
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
