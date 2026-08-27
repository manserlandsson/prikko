"""Test för Sveriges sjögräns.

Rikskartans skugga står och faller med att ytan är just Sverige. Fem fel skulle
annars ge en karta som SER hel ut:

1. Fel relation ur OSM. Sverige ligger på admin_level 2; länen ligger på 4 och
   ritar en åttondel av landet med samma sorts taggar.
2. En relation som inte gått ihop till slutna ringar. En öppen kedja som ändå
   ritades blir en rak linje tvärs över havet där hålet satt.
3. Fel antal ringar, eller en mindre ring som inte är Gotlands sjögräns utan
   en holme i Torne älv som råkat sluta sig.
4. En ring vänd åt fel håll. Masken är en världspolygon med gränsen som HÅL,
   och ett hål måste gå åt motsatt håll mot världsringen. Går de åt samma håll
   ritar MapLibre grå band tvärs över kartan.
5. En areal som spårat ur. Arealprovet i main fångar det, och areal_km2 måste
   därför vara sfärisk: en kvadratgrad är nästan dubbelt så stor i Skåne som i
   Kiruna.

Körs utan beroenden:  python3 pipeline/tests/test_riket.py
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from riket import (  # noqa: E402
    Innanfor,
    areal_km2,
    bygg_kontur,
    gransen_haller,
    gransringar,
    kedja,
    medsols,
    ringarna_haller,
    runda,
)


def ruta(w, s, e, n):
    return [[w, s], [w, n], [e, n], [e, s], [w, s]]


def vag(punkter):
    """En väg i Overpass form, alltså med geometry som lon/lat-objekt."""
    return {"geometry": [{"lon": x, "lat": y} for x, y in punkter]}


def ytformel(ring):
    """Dubbla den plana ytan med tecken. Negativ betyder medsols."""
    return sum(
        ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1] for i in range(len(ring) - 1)
    )


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
    """Sfäriskt, inte plant. Se punkt 5 i modulens huvud."""

    def test_en_kvadratgrad_vid_ekvatorn(self):
        km2 = areal_km2(ruta(0.0, 0.0, 1.0, 1.0))
        self.assertAlmostEqual(km2, 12363.0, delta=20.0)

    def test_samma_ruta_krymper_norrut(self):
        """Vid 60 grader nord är en kvadratgrad ungefär halva ytan."""
        vid_60 = areal_km2(ruta(0.0, 60.0, 1.0, 61.0))
        vid_0 = areal_km2(ruta(0.0, 0.0, 1.0, 1.0))
        self.assertAlmostEqual(vid_60 / vid_0, 0.5, delta=0.03)

    def test_riktningen_spelar_ingen_roll(self):
        medsols_ = areal_km2([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]])
        motsols = areal_km2([[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]])
        self.assertAlmostEqual(medsols_, motsols, places=6)


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
    """Relationens 178 vägar kommer i godtycklig ordning och riktning."""

    def test_remsor_i_omvand_ordning_och_riktning(self):
        linjer = kedja([[(2, 0), (3, 0)], [(1, 0), (0, 0)], [(2, 0), (1, 0)]])
        self.assertEqual(len(linjer), 1)
        self.assertEqual(len(linjer[0]), 4)
        self.assertEqual({linjer[0][0], linjer[0][-1]}, {(0, 0), (3, 0)})

    def test_oppen_linje_forblir_oppen(self):
        """En kedja som inte går ihop ska SYNAS, inte tvingas till en ring."""
        linjer = kedja([[(0, 0), (1, 0)], [(1, 0), (2, 1)]])
        self.assertNotEqual(linjer[0][0], linjer[0][-1])

    def test_sluten_ring_blir_sluten(self):
        linjer = kedja([[(0, 0), (1, 0)], [(1, 0), (1, 1)], [(1, 1), (0, 0)]])
        self.assertEqual(linjer[0][0], linjer[0][-1])

    def test_skilda_kedjor_haller_isar_och_langsta_forst(self):
        linjer = kedja([[(0, 0), (1, 0)], [(9, 9), (9, 8)], [(1, 0), (2, 0)]])
        self.assertEqual(len(linjer), 2)
        self.assertEqual(len(linjer[0]), 3)


class Gransprovet(unittest.TestCase):
    """Punkt 1 ovan. Länen bär samma taggar och ritar en åttondel av landet."""

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


class Sjogransringar(unittest.TestCase):
    """Punkt 2 ovan. Bara det som sluter sig får bli en ring."""

    def test_remsor_i_godtycklig_ordning_blir_en_sluten_ring(self):
        vagar = [
            vag([(14.0, 60.0), (13.0, 60.0)]),
            vag([(13.0, 59.0), (14.0, 59.0)]),
            vag([(13.0, 60.0), (13.0, 59.0)]),
            vag([(14.0, 59.0), (14.0, 60.0)]),
        ]
        ringar = gransringar(vagar)
        self.assertEqual(len(ringar), 1)
        self.assertEqual(ringar[0][0], ringar[0][-1])

    def test_en_oppen_kedja_kastas(self):
        vagar = [vag([(13.0, 59.0), (14.0, 59.0)]), vag([(14.0, 59.0), (14.0, 60.0)])]
        self.assertEqual(gransringar(vagar), [])

    def test_en_kedja_under_fyra_punkter_kastas(self):
        """En triangel som slutit sig på tre hörn är en linje fram och åter."""
        vagar = [vag([(13.0, 59.0), (14.0, 59.0)]), vag([(14.0, 59.0), (13.0, 59.0)])]
        self.assertEqual(gransringar(vagar), [])

    def test_koordinaterna_rundas_till_fem_decimaler(self):
        vagar = [
            vag([(13.0000004, 59.0), (14.0, 59.0)]),
            vag([(14.0, 59.0), (14.0, 60.0)]),
            vag([(14.0, 60.0), (13.0000004, 59.0)]),
        ]
        ringar = gransringar(vagar)
        self.assertEqual(ringar[0][0], [13.0, 59.0])

    def test_vagar_utan_geometri_hoppas_over(self):
        vagar = [{"id": 1}, vag([(13.0, 59.0), (14.0, 59.0)])]
        self.assertEqual(gransringar(vagar), [])


class Vindningen(unittest.TestCase):
    """Punkt 4 ovan. Ett hål måste gå åt motsatt håll mot världsringen."""

    def test_en_motsols_ring_vands(self):
        motsols = [[13.0, 59.0], [14.0, 59.0], [14.0, 60.0], [13.0, 59.0]]
        self.assertGreater(ytformel(motsols), 0, "provets egen ring gick åt fel håll")
        self.assertLess(ytformel(medsols(motsols)), 0)

    def test_en_medsols_ring_lamnas_som_den_ar(self):
        ring = [[13.0, 59.0], [14.0, 60.0], [14.0, 59.0], [13.0, 59.0]]
        self.assertIs(medsols(ring), ring)


class Konturen(unittest.TestCase):
    """Förenklingen och vändningen, alltså bygg_kontur."""

    #: En ring med en överflödig punkt mitt på varje sida. Douglas-Peucker med
    #: 600 meters tolerans ska ta bort alla fyra.
    STOR = [
        [13.0, 59.0], [13.5, 59.0], [14.0, 59.0], [14.0, 59.5],
        [14.0, 60.0], [13.5, 60.0], [13.0, 60.0], [13.0, 59.5], [13.0, 59.0],
    ]
    LITEN = [
        [18.0, 57.0], [18.5, 57.0], [19.0, 57.0], [19.0, 57.5],
        [19.0, 58.0], [18.5, 58.0], [18.0, 58.0], [18.0, 57.5], [18.0, 57.0],
    ]

    def test_tva_ringar_in_ger_tva_slutna_ringar_ut(self):
        ringar, _ = bygg_kontur([self.STOR, self.LITEN])
        self.assertEqual(len(ringar), 2)
        for ring in ringar:
            self.assertEqual(ring[0], ring[-1])

    def test_forenklingen_tar_bort_punkter_och_mattet_redovisar_det(self):
        ringar, mått = bygg_kontur([self.STOR, self.LITEN])
        self.assertEqual(mått["punkter_fore"], 18)
        self.assertEqual(mått["punkter_efter"], sum(len(r) for r in ringar))
        self.assertLess(mått["punkter_efter"], mått["punkter_fore"])

    def test_bada_ringarna_kommer_tillbaka_medsols(self):
        ringar, _ = bygg_kontur([self.STOR[::-1], self.LITEN])
        for ring in ringar:
            self.assertLess(ytformel(ring), 0)


class Ringprovet(unittest.TestCase):
    """Punkt 3 ovan. Två ringar, och den mindre ska vara Gotlands."""

    FASTLANDET = ruta(11.0, 55.0, 24.0, 69.0)
    GOTLAND = ruta(17.5, 56.7, 19.7, 58.6)

    def test_tva_ratta_ringar_haller(self):
        self.assertEqual(ringarna_haller([self.FASTLANDET, self.GOTLAND]), "")

    def test_fel_antal_ringar_namnges(self):
        self.assertIn("1 ringar", ringarna_haller([self.FASTLANDET]))

    def test_den_mindre_ringen_pa_fel_plats_namnges(self):
        holme = ruta(12.0, 56.0, 14.2, 57.9)
        self.assertIn("Gotlands sjögräns", ringarna_haller([self.FASTLANDET, holme]))

    def test_den_storre_ringen_utan_fastlandet_namnges(self):
        """En ring som slutar vid Dalälven rymmer inte Kiruna."""
        halva = ruta(11.0, 55.0, 24.0, 60.0)
        self.assertIn("rymmer inte punkten", ringarna_haller([halva, self.GOTLAND]))


if __name__ == "__main__":
    unittest.main(verbosity=2)
