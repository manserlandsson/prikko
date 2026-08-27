"""Test för Sveriges landkontur.

Rikskartans skugga står och faller med att konturen är just Sverige. Fem fel
skulle annars ge en karta som SER hel ut:

1. En klippning som tagit hela Skandinavien, eller bara en flik av Skåne.
   Arealprovet i main fångar det, och areal_km2 måste därför vara sfärisk: en
   kvadratgrad är nästan dubbelt så stor i Skåne som i Kiruna.
2. En förenkling som raderat Gotland, Öland eller Orust, eller klistrat ihop
   dem med fastlandet. Det är det fel varenda svensk ser direkt och som ingen
   automatisk mätning fångar utom den som letar efter dem vid namn.
3. En kustlöpa som brutits i bitar. Kontinentringen ska korsa sjögränsen exakt
   två gånger; fler löpor betyder att klippningen fått fatt i något annat.
4. En landsgräns som inte kedjats ihop, så att ringen viker dubbelt i stället
   för att sluta sig.
5. Fel relation ur OSM. Sverige ligger på admin_level 2; länen ligger på 4 och
   ritar en åttondel av landet med samma sorts taggar.

Körs utan beroenden:  python3 pipeline/tests/test_riket.py
"""

import math
import struct
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from riket import (  # noqa: E402
    Innanfor,
    areal_km2,
    avstand_m,
    gransen_haller,
    kedja,
    langsta_lopan,
    las_landytor,
    nyckeloar_finns,
    runda,
    _lat2y,
    _lon2x,
)


def shapefil(polygoner):
    """En giltig shapefil av typ Polygon, byggd ur ringar i longitud/latitud."""
    poster = b""
    for nummer, ringar in enumerate(polygoner, start=1):
        punkter = [(_lon2x(x), _lat2y(y)) for ring in ringar for x, y in ring]
        delar = []
        n = 0
        for ring in ringar:
            delar.append(n)
            n += len(ring)
        innehåll = struct.pack("<i", 5)
        innehåll += struct.pack(
            "<4d",
            min(p[0] for p in punkter), min(p[1] for p in punkter),
            max(p[0] for p in punkter), max(p[1] for p in punkter),
        )
        innehåll += struct.pack("<ii", len(delar), len(punkter))
        innehåll += struct.pack(f"<{len(delar)}i", *delar)
        for x, y in punkter:
            innehåll += struct.pack("<2d", x, y)
        poster += struct.pack(">ii", nummer, len(innehåll) // 2) + innehåll

    huvud = struct.pack(">i", 9994) + b"\0" * 20
    huvud += struct.pack(">i", (100 + len(poster)) // 2)
    huvud += struct.pack("<ii", 1000, 5)
    huvud += struct.pack("<8d", -180, -85, 180, 85, 0, 0, 0, 0)
    return huvud + poster


def ruta(w, s, e, n):
    return [[w, s], [w, n], [e, n], [e, s], [w, s]]


class Shapefilen(unittest.TestCase):
    """Läsaren. Formatet är publicerat och får inte gissas på."""

    def test_en_polygon_blir_en_ring(self):
        ringar = las_landytor(shapefil([[ruta(13.0, 59.0, 14.0, 60.0)]]), (10.0, 54.0, 25.0, 70.0))
        self.assertEqual(len(ringar), 1)
        self.assertEqual(len(ringar[0]), 5)
        self.assertAlmostEqual(ringar[0][0][0], 13.0, places=5)
        self.assertAlmostEqual(ringar[0][0][1], 59.0, places=5)

    def test_flera_delar_blir_flera_ringar(self):
        """En ö med ett hål, eller två öar i samma post, ger två ringar."""
        ringar = las_landytor(
            shapefil([[ruta(13.0, 59.0, 14.0, 60.0), ruta(13.2, 59.2, 13.4, 59.4)]]),
            (10.0, 54.0, 25.0, 70.0),
        )
        self.assertEqual(len(ringar), 2)

    def test_polygon_utanfor_rutan_packas_inte_upp(self):
        """Rutan i postens eget huvud är hela skälet till att läsaren är billig."""
        data = shapefil([[ruta(13.0, 59.0, 14.0, 60.0)], [ruta(-70.0, 43.0, -69.0, 44.0)]])
        ringar = las_landytor(data, (10.0, 54.0, 25.0, 70.0))
        self.assertEqual(len(ringar), 1)

    def test_ingen_polygon_alls(self):
        self.assertEqual(las_landytor(shapefil([]), (10.0, 54.0, 25.0, 70.0)), [])


class PunktIPolygon(unittest.TestCase):
    """Samma svar som in_ring i omraden.py, men med kanterna i latitudfack."""

    RUTAN = [ruta(13.0, 59.0, 14.0, 60.0)]

    def setUp(self):
        self.inne = Innanfor(self.RUTAN)

    def test_punkt_innanfor(self):
        self.assertTrue(self.inne(13.5, 59.5))

    def test_punkt_utanfor_men_i_samma_fack(self):
        self.assertFalse(self.inne(12.5, 59.5))
        self.assertFalse(self.inne(14.5, 59.5))

    def test_punkt_utanfor_omslutande_rutan(self):
        self.assertFalse(self.inne(20.0, 65.0))

    def test_facken_taecker_hela_hojden(self):
        """En kant får inte hamna i ett fack som punkten aldrig frågar efter."""
        for i in range(1, 100):
            y = 59.0 + i / 100.0
            self.assertTrue(self.inne(13.5, y), y)

    def test_tva_ringar_ar_bada_innanfor(self):
        inne = Innanfor([ruta(13.0, 59.0, 14.0, 60.0), ruta(20.0, 64.0, 21.0, 65.0)])
        self.assertTrue(inne(13.5, 59.5))
        self.assertTrue(inne(20.5, 64.5))
        self.assertFalse(inne(17.0, 62.0))


class Areal(unittest.TestCase):
    """Sfäriskt, inte plant. Se punkt 1 i modulens huvud."""

    def test_en_kvadratgrad_vid_ekvatorn(self):
        km2 = areal_km2(ruta(0.0, 0.0, 1.0, 1.0))
        self.assertAlmostEqual(km2, 12363.0, delta=20.0)

    def test_samma_ruta_krymper_norrut(self):
        """Vid 60 grader nord är en kvadratgrad ungefär halva ytan."""
        vid_60 = areal_km2(ruta(0.0, 60.0, 1.0, 61.0))
        vid_0 = areal_km2(ruta(0.0, 0.0, 1.0, 1.0))
        self.assertAlmostEqual(vid_60 / vid_0, 0.5, delta=0.03)

    def test_riktningen_spelar_ingen_roll(self):
        medsols = areal_km2([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]])
        motsols = areal_km2([[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]])
        self.assertAlmostEqual(medsols, motsols, places=6)


class Avrundning(unittest.TestCase):
    def test_tre_decimaler(self):
        ring = runda([[13.123456, 59.987654], [13.2, 59.2], [13.3, 59.3]], 3)
        self.assertEqual(ring[0], [13.123, 59.988])

    def test_punkter_som_blir_lika_slas_ihop(self):
        ring = runda([[13.0001, 59.0], [13.0002, 59.0], [13.5, 59.0], [13.0, 59.5]], 3)
        self.assertEqual(ring[0], [13.0, 59.0])
        self.assertEqual(len(ring), 4, "de två första blev samma punkt")

    def test_ringen_sluts(self):
        ring = runda([[13.0, 59.0], [14.0, 59.0], [14.0, 60.0]], 3)
        self.assertEqual(ring[0], ring[-1])


class Kedjan(unittest.TestCase):
    """Landsgränsen kommer som lösa remsor i godtycklig ordning och riktning."""

    def test_remsor_i_omvand_ordning_och_riktning(self):
        linjer = kedja([[(2, 0), (3, 0)], [(1, 0), (0, 0)], [(2, 0), (1, 0)]])
        self.assertEqual(len(linjer), 1)
        self.assertEqual(len(linjer[0]), 4)
        self.assertEqual({linjer[0][0], linjer[0][-1]}, {(0, 0), (3, 0)})

    def test_oppen_linje_forblir_oppen(self):
        """Landsgränsen mot Norge och Finland är en linje och ingen ring."""
        linjer = kedja([[(0, 0), (1, 0)], [(1, 0), (2, 1)]])
        self.assertNotEqual(linjer[0][0], linjer[0][-1])

    def test_sluten_ring_blir_sluten(self):
        linjer = kedja([[(0, 0), (1, 0)], [(1, 0), (1, 1)], [(1, 1), (0, 0)]])
        self.assertEqual(linjer[0][0], linjer[0][-1])

    def test_skilda_kedjor_haller_isar_och_langsta_forst(self):
        linjer = kedja([[(0, 0), (1, 0)], [(9, 9), (9, 8)], [(1, 0), (2, 0)]])
        self.assertEqual(len(linjer), 2)
        self.assertEqual(len(linjer[0]), 3)


class Lopor(unittest.TestCase):
    """Kontinentringen ska korsa sjögränsen exakt två gånger. Punkt 3 ovan."""

    INNE = Innanfor([ruta(13.0, 59.0, 14.0, 60.0)])

    def test_en_lopa_over_gransen(self):
        ring = [[12.0, 59.5], [13.2, 59.5], [13.4, 59.5], [13.6, 59.5], [15.0, 59.5]]
        löpa, antal = langsta_lopan(ring, self.INNE)
        self.assertEqual(antal, 1)
        self.assertEqual(len(löpa), 3)

    def test_flera_lopor_raknas(self):
        ring = [[13.2, 59.5], [15.0, 59.5], [13.4, 59.5], [13.5, 59.5], [13.6, 59.5]]
        löpa, antal = langsta_lopan(ring, self.INNE)
        self.assertEqual(antal, 2)
        self.assertEqual(len(löpa), 3, "den längsta löpan vinner")

    def test_ingen_punkt_innanfor(self):
        löpa, antal = langsta_lopan([[20.0, 65.0], [21.0, 65.0]], self.INNE)
        self.assertEqual((löpa, antal), ([], 0))


class Gransprovet(unittest.TestCase):
    """Punkt 5 ovan. Länen bär samma taggar och ritar en åttondel av landet."""

    SVERIGE = {
        "tags": {
            "name": "Sverige",
            "boundary": "administrative",
            "admin_level": "2",
            "ISO3166-1": "SE",
        }
    }

    def test_sverige_haller(self):
        self.assertTrue(gransen_haller(self.SVERIGE))

    def test_ett_lan_haller_inte(self):
        taggar = {**self.SVERIGE["tags"], "name": "Norrbottens län", "admin_level": "4"}
        self.assertFalse(gransen_haller({"tags": taggar}))

    def test_ratt_niva_men_fel_namn_haller_inte(self):
        self.assertFalse(gransen_haller({"tags": {**self.SVERIGE["tags"], "name": "Norge"}}))

    def test_fel_slags_grans_haller_inte(self):
        self.assertFalse(
            gransen_haller({"tags": {**self.SVERIGE["tags"], "boundary": "maritime"}})
        )

    def test_utan_taggar_haller_inte(self):
        self.assertFalse(gransen_haller({}))


class Nyckeloarna(unittest.TestCase):
    """Punkt 2 ovan. Gotland, Öland och Orust ska överleva förenklingen."""

    GOTLAND = ruta(18.1, 56.9, 19.1, 57.9)
    OLAND = ruta(16.4, 56.2, 17.1, 57.3)
    ORUST = ruta(11.4, 58.1, 11.8, 58.3)

    def test_alla_tre_finns(self):
        self.assertEqual(nyckeloar_finns([self.GOTLAND, self.OLAND, self.ORUST]), [])

    def test_en_som_saknas_namnges(self):
        self.assertEqual(nyckeloar_finns([self.GOTLAND, self.ORUST]), ["Öland"])

    def test_en_o_som_klistrats_ihop_med_fastlandet_raknas_inte(self):
        """Ringen rymmer inte längre i öns ruta, alltså är den inte längre ön."""
        hopklistrad = ruta(16.4, 56.2, 22.0, 57.3)
        self.assertIn("Öland", nyckeloar_finns([self.GOTLAND, hopklistrad, self.ORUST]))

    def test_en_o_som_krympt_till_en_prick_raknas_inte(self):
        prick = ruta(18.5, 57.3, 18.55, 57.35)
        self.assertIn("Gotland", nyckeloar_finns([prick, self.OLAND, self.ORUST]))


class Avstand(unittest.TestCase):
    """Provet att kust och landsgräns möts. Punkt 4 ovan."""

    def test_samma_punkt_ar_noll(self):
        self.assertAlmostEqual(avstand_m([13.0, 59.0], [13.0, 59.0]), 0.0)

    def test_en_hundradels_grad_norrut(self):
        self.assertAlmostEqual(avstand_m([13.0, 59.0], [13.0, 59.01]), 1113.2, delta=1.0)

    def test_longituden_krymper_norrut(self):
        söder = avstand_m([13.0, 55.0], [13.01, 55.0])
        norr = avstand_m([13.0, 68.0], [13.01, 68.0])
        self.assertLess(norr, söder * 0.7)


if __name__ == "__main__":
    unittest.main(verbosity=2)
