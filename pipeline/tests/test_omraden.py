"""Test för stadsdelsgränserna.

Områdessidorna står och faller med att rätt polygon hamnar under rätt namn.
Fyra fel är värda egna test, eftersom alla fyra ger en sida som SER hel ut:

1. Ett distrikt publicerat som en stadsdel. "Linköpings domkyrkodistrikt" är
   en gammal församling, inte ett område någon söker på, och OSM lägger dem på
   admin_level 9 där de är lätta att råka få med.
2. En kontur som inte slöt sig. Overpass lämnar relationens kanter som lösa
   remsor i godtycklig ordning och riktning; syr man ihop dem fel blir ytan
   öppen och punkt-i-polygon svarar godtyckligt.
3. Två områden med samma namn i samma kommun. De kan inte ha samma URL.
4. Ett hål som tappats bort. Djurgårdsbrunnsviken ligger inne i Djurgården och
   ska inte räknas som land.

RegSO tar två prov till, och båda har sin egen klass nedan. Namnprovet skiljer
Vällingby från "Västra Flogsta", och rörprovet hindrar SCB:s Mariatorget från
att äta upp OSM:s Södermalm. Faller något av dem tyst blir följden en sida under
ett namn ingen söker eller ett tal som krympt utan att någon rört sidan.

Körs utan beroenden:  python3 pipeline/tests/test_omraden.py
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from omraden import (  # noqa: E402
    merge,
    regso_name_holds,
    regso_rings,
    ring_area,
    rings_from_relation,
    rings_from_way,
    round_ring,
    slugify,
    touches,
    wanted,
)


def yta(namn, hörn, hål=None, källa="osm"):
    """Ett områdesobjekt av samma form som fetch och fetch_regso lämnar."""
    ring = [list(p) for p in hörn]
    if ring[0] != ring[-1]:
        ring.append(list(ring[0]))
    hålen = []
    for h in hål or []:
        r = [list(p) for p in h]
        if r[0] != r[-1]:
            r.append(list(r[0]))
        hålen.append(r)
    return {
        "name": namn,
        "slug": slugify(namn),
        "source": källa,
        "ref": "",
        "size": ring_area(ring),
        "outer": [ring],
        "inner": hålen,
    }


def way(points, closed=True):
    geometry = [{"lon": x, "lat": y} for x, y in points]
    if closed and points[0] != points[-1]:
        geometry.append({"lon": points[0][0], "lat": points[0][1]})
    return {"type": "way", "id": 1, "geometry": geometry}


def relation(segments, roles=None):
    """Bygger en Overpass-relation av råa remsor, i den ordning de ges."""
    members = []
    for i, seg in enumerate(segments):
        members.append(
            {
                "type": "way",
                "role": (roles[i] if roles else "outer"),
                "geometry": [{"lon": x, "lat": y} for x, y in seg],
            }
        )
    return {"type": "relation", "id": 2, "members": members}


class Urval(unittest.TestCase):
    """Vilka OSM-objekt som får bli en stadsdel."""

    def test_place_suburb_racknas(self):
        self.assertTrue(wanted({"name": "Södermalm", "place": "suburb"}))

    def test_admin_level_10_racknas(self):
        self.assertTrue(
            wanted({"name": "Gamla stan", "boundary": "administrative", "admin_level": "10"})
        )

    def test_admin_level_9_racknas_inte(self):
        """Distrikt är församlingar. Samma fel som RegSO gör, av samma skäl."""
        self.assertFalse(
            wanted({"name": "Slaka", "boundary": "administrative", "admin_level": "9"})
        )

    def test_namn_som_slutar_pa_distrikt_racknas_inte(self):
        """Enstaka distrikt är taggade som place och slipper därmed nivåfiltret."""
        self.assertFalse(wanted({"name": "Kymbo distrikt", "place": "suburb"}))
        self.assertFalse(
            wanted({"name": "Linköpings domkyrkodistrikt", "place": "neighbourhood"})
        )

    def test_utan_namn_racknas_inte(self):
        """Ett namnlöst område kan varken få rubrik eller URL."""
        self.assertFalse(wanted({"place": "suburb"}))

    def test_annan_administrativ_niva_racknas_inte(self):
        self.assertFalse(
            wanted({"name": "Stockholm", "boundary": "administrative", "admin_level": "7"})
        )


class Ringar(unittest.TestCase):
    """Att konturen sluter sig oavsett hur Overpass lämnar ut den."""

    KVADRAT = [(0.0, 0.0), (0.0, 1.0), (1.0, 1.0), (1.0, 0.0)]

    def test_vag_med_sluten_kontur(self):
        outer, inner = rings_from_way(way(self.KVADRAT))
        self.assertEqual(len(outer), 1)
        self.assertEqual(outer[0][0], outer[0][-1])
        self.assertEqual(inner, [])

    def test_vag_som_inte_sluter_sig_avvisas(self):
        öppen = {
            "type": "way",
            "id": 1,
            "geometry": [{"lon": x, "lat": y} for x, y in self.KVADRAT],
        }
        self.assertIsNone(rings_from_way(öppen))

    def test_for_fa_punkter_avvisas(self):
        self.assertIsNone(rings_from_way(way([(0.0, 0.0), (1.0, 1.0)])))

    def test_remsor_i_ordning(self):
        built = rings_from_relation(
            relation([[(0.0, 0.0), (0.0, 1.0)], [(0.0, 1.0), (1.0, 1.0)],
                      [(1.0, 1.0), (1.0, 0.0)], [(1.0, 0.0), (0.0, 0.0)]])
        )
        self.assertIsNotNone(built)
        outer, _ = built
        self.assertEqual(len(outer), 1)
        self.assertEqual(outer[0][0], outer[0][-1])

    def test_remsor_i_omvand_ordning_och_riktning(self):
        """Det verkliga fallet. Overpass lovar ingen ordning och ingen riktning."""
        built = rings_from_relation(
            relation([[(1.0, 0.0), (0.0, 0.0)], [(1.0, 1.0), (1.0, 0.0)],
                      [(0.0, 1.0), (0.0, 0.0)], [(0.0, 1.0), (1.0, 1.0)]])
        )
        self.assertIsNotNone(built)
        outer, _ = built
        self.assertEqual(len(outer), 1, "remsorna skulle sys ihop till EN ring")
        self.assertEqual(outer[0][0], outer[0][-1], "ringen skulle sluta sig")
        # Fyra hörn plus återvändande punkt.
        self.assertEqual(len(outer[0]), 5)

    def test_hal_behalls_som_hal(self):
        built = rings_from_relation(
            relation(
                [
                    [(0.0, 0.0), (0.0, 4.0)], [(0.0, 4.0), (4.0, 4.0)],
                    [(4.0, 4.0), (4.0, 0.0)], [(4.0, 0.0), (0.0, 0.0)],
                    [(1.0, 1.0), (1.0, 2.0)], [(1.0, 2.0), (2.0, 2.0)],
                    [(2.0, 2.0), (2.0, 1.0)], [(2.0, 1.0), (1.0, 1.0)],
                ],
                roles=["outer"] * 4 + ["inner"] * 4,
            )
        )
        self.assertIsNotNone(built)
        outer, inner = built
        self.assertEqual(len(outer), 1)
        self.assertEqual(len(inner), 1, "hålet skulle överleva som egen ring")

    def test_tva_skilda_ytor_blir_tva_ringar(self):
        """En stadsdel kan bestå av två skilda öar, till exempel Essingarna."""
        built = rings_from_relation(
            relation(
                [
                    [(0.0, 0.0), (0.0, 1.0)], [(0.0, 1.0), (1.0, 1.0)],
                    [(1.0, 1.0), (1.0, 0.0)], [(1.0, 0.0), (0.0, 0.0)],
                    [(5.0, 5.0), (5.0, 6.0)], [(5.0, 6.0), (6.0, 6.0)],
                    [(6.0, 6.0), (6.0, 5.0)], [(6.0, 5.0), (5.0, 5.0)],
                ]
            )
        )
        outer, _ = built
        self.assertEqual(len(outer), 2)

    def test_relation_utan_ytterring_avvisas(self):
        self.assertIsNone(rings_from_relation(relation([])))


class Avrundning(unittest.TestCase):
    def test_avrundar_till_meternivå(self):
        ring = round_ring([(18.0766378312, 59.3272059444), (18.08452888, 59.3200783),
                           (18.0, 59.0), (18.0766378312, 59.3272059444)])
        self.assertEqual(ring[0], [18.07664, 59.32721])

    def test_punkter_som_blir_lika_slas_ihop(self):
        """Två hörn en decimeter isär blir samma punkt och får inte dubbleras."""
        ring = round_ring([(18.000001, 59.0), (18.000002, 59.0), (18.001, 59.0),
                           (18.0, 59.001), (18.000001, 59.0)])
        self.assertEqual(len(ring), len({tuple(p) for p in ring}) + 1)
        self.assertEqual(ring[0], ring[-1], "ringen ska fortfarande vara sluten")

    def test_sluter_ringen_om_den_oppnats_av_avrundningen(self):
        ring = round_ring([(18.0, 59.0), (18.1, 59.0), (18.1, 59.1)])
        self.assertEqual(ring[0], ring[-1])


class Slug(unittest.TestCase):
    """Samma regler som prikko/text.py. Glider de isär bryts länkarna."""

    def test_svenska_tecken(self):
        self.assertEqual(slugify("Södermalm"), "sodermalm")
        self.assertEqual(slugify("Ladugårdsgärdet"), "ladugardsgardet")
        self.assertEqual(slugify("Hägerstensåsen"), "hagerstensasen")

    def test_mellanslag_blir_bindestreck(self):
        self.assertEqual(slugify("Gamla stan"), "gamla-stan")
        self.assertEqual(slugify("Norra Djurgården"), "norra-djurgarden")

    def test_inga_dubbla_bindestreck(self):
        self.assertEqual(slugify("Ulvsunda  Industriområde"), "ulvsunda-industriomrade")

    def test_tomt_namn_far_reservslug(self):
        self.assertEqual(slugify("///"), "namnlos")


class RegsoNamn(unittest.TestCase):
    """Namnprovet. Varje rad här är ett namn som faktiskt finns i RegSO 2025."""

    def test_bara_namnet_haller(self):
        for namn, stad in (
            ("Vällingby", "Stockholm"),
            ("Tensta", "Stockholm"),
            ("Råslätt", "Jönköping"),
            ("Gränna", "Jönköping"),
            ("Våxnäs", "Karlstad"),
            ("Ryd", "Linköping"),
            ("Vivalla", "Örebro"),
        ):
            self.assertTrue(regso_name_holds(namn, stad), namn)

    def test_bindestreck_ar_scb_s_hopslagning(self):
        """Ingen säger Rosta-Örnsro. `restauranger rosta örnsro` ger noll förslag."""
        for namn in ("Rosta-Örnsro", "Vasastaden-Hunneberg", "Marieberg-Mosås",
                     "Kvarnberget-Sommarro-Marieberg", "Skäggetorp-Tornby",
                     "Klara-Jacob"):
            self.assertFalse(regso_name_holds(namn, "Örebro"), namn)

    def test_vaderstreck_delar_en_plats_som_ingen_delar(self):
        """Flogsta kompletteras. Västra Flogsta svarar med noll förslag."""
        for namn in ("Västra Flogsta", "Norra Sävja", "Sydöstra Luthagen",
                     "Mellersta Sala backe", "Kronoparken norra"):
            self.assertFalse(regso_name_holds(namn, "Uppsala"), namn)

    def test_administrativa_ord_gor_staden_till_ett_omrade(self):
        self.assertFalse(regso_name_holds("Örebro city", "Örebro"))
        self.assertFalse(regso_name_holds("Huskvarna centrum", "Jönköping"))
        self.assertFalse(regso_name_holds("Valkebo omland", "Linköping"))
        self.assertFalse(regso_name_holds("Bromma kyrka", "Stockholm"))

    def test_kommunens_stad_ar_inte_ett_omrade_i_sig(self):
        """"Uppsala centrum" faller på båda halvorna, och ska göra det."""
        self.assertFalse(regso_name_holds("Uppsala centrum", "Uppsala"))
        self.assertFalse(regso_name_holds("Uppsala västra omland", "Uppsala"))

    def test_stadens_namn_i_ett_annat_ord_racknas_inte(self):
        """Karlstads landsbygd faller på `landsbygd`, inte på genitivformen."""
        self.assertTrue(regso_name_holds("Karlstadsvägen", "Karlstad"))


class RegsoGeometri(unittest.TestCase):
    """GeoJSON till samma ringar som Overpass-grenen lämnar."""

    def test_polygon_med_hal(self):
        outer, inner = regso_rings(
            {
                "type": "Polygon",
                "coordinates": [
                    [[0, 0], [0, 4], [4, 4], [4, 0], [0, 0]],
                    [[1, 1], [1, 2], [2, 2], [2, 1], [1, 1]],
                ],
            }
        )
        self.assertEqual(len(outer), 1)
        self.assertEqual(len(inner), 1)

    def test_multipolygon_ger_flera_ytterringar(self):
        outer, inner = regso_rings(
            {
                "type": "MultiPolygon",
                "coordinates": [
                    [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
                    [[[5, 5], [5, 6], [6, 6], [6, 5], [5, 5]]],
                ],
            }
        )
        self.assertEqual(len(outer), 2)
        self.assertEqual(inner, [])


class Rorprovet(unittest.TestCase):
    """Två källor som ritar samma trakt ritar den olika. Se modulens huvud."""

    RUTA = [(0.0, 0.0), (0.0, 4.0), (4.0, 4.0), (4.0, 0.0)]

    def test_ytor_som_ligger_isar_ror_inte(self):
        self.assertFalse(
            touches(yta("A", self.RUTA), yta("B", [(9.0, 9.0), (9.0, 10.0), (10.0, 10.0), (10.0, 9.0)]))
        )

    def test_yta_helt_inuti_en_annan_ror(self):
        """SCB:s Mariatorget ligger inne i OSM:s Södermalm. Inget hörn korsar."""
        inre = yta("Mariatorget", [(1.0, 1.0), (1.0, 2.0), (2.0, 2.0), (2.0, 1.0)])
        self.assertTrue(touches(inre, yta("Södermalm", self.RUTA)))
        self.assertTrue(touches(yta("Södermalm", self.RUTA), inre))

    def test_ytor_som_overlappar_pa_kanten_ror(self):
        self.assertTrue(
            touches(yta("A", self.RUTA), yta("B", [(3.0, 1.0), (3.0, 2.0), (6.0, 2.0), (6.0, 1.0)]))
        )

    def test_kors_utan_att_ett_enda_horn_hamnar_inuti(self):
        """Två avlånga ytor i kors. Utan kantprovet ser de ut att ligga isär."""
        lodrat = yta("A", [(1.0, -1.0), (1.0, 5.0), (2.0, 5.0), (2.0, -1.0)])
        vagrat = yta("B", [(-1.0, 1.0), (5.0, 1.0), (5.0, 2.0), (-1.0, 2.0)])
        self.assertTrue(touches(lodrat, vagrat))

    def test_yta_i_ett_hal_ror_inte(self):
        """Djurgårdsbrunnsviken är inte land, och något som ligger i den rör inget."""
        med_hal = yta("A", self.RUTA, hål=[[(1.0, 1.0), (1.0, 3.0), (3.0, 3.0), (3.0, 1.0)]])
        i_halet = yta("B", [(1.5, 1.5), (1.5, 2.5), (2.5, 2.5), (2.5, 1.5)])
        self.assertFalse(touches(med_hal, i_halet))


class Sammanslagning(unittest.TestCase):
    """OSM först, RegSO bara där den varken rör en OSM-yta eller tar dess namn."""

    OSM = [yta("Södermalm", [(0.0, 0.0), (0.0, 4.0), (4.0, 4.0), (4.0, 0.0)])]

    def test_regso_som_ror_faller_helt(self):
        blandat = merge(
            self.OSM,
            [yta("Mariatorget", [(1.0, 1.0), (1.0, 2.0), (2.0, 2.0), (2.0, 1.0)], källa="regso")],
        )
        self.assertEqual([a["name"] for a in blandat], ["Södermalm"])

    def test_regso_langre_bort_kommer_med(self):
        blandat = merge(
            self.OSM,
            [yta("Vällingby", [(9.0, 9.0), (9.0, 10.0), (10.0, 10.0), (10.0, 9.0)], källa="regso")],
        )
        self.assertEqual(sorted(a["slug"] for a in blandat), ["sodermalm", "vallingby"])
        self.assertEqual(
            {a["name"]: a["source"] for a in blandat},
            {"Södermalm": "osm", "Vällingby": "regso"},
        )

    def test_samma_namn_kan_inte_ge_tva_urler(self):
        """Ett namn, en URL. OSM-ytan står kvar och RegSO:s namne faller."""
        blandat = merge(
            self.OSM,
            [yta("Södermalm", [(9.0, 9.0), (9.0, 10.0), (10.0, 10.0), (10.0, 9.0)], källa="regso")],
        )
        self.assertEqual(len(blandat), 1)
        self.assertEqual(blandat[0]["source"], "osm")

    def test_utan_osm_kommer_allt_regso_med(self):
        """Uppsala, Örebro och Jönköping har noll OSM-polygoner. Inget att röra."""
        regso = [
            yta("Gränna", [(0.0, 0.0), (0.0, 1.0), (1.0, 1.0), (1.0, 0.0)], källa="regso"),
            yta("Råslätt", [(5.0, 5.0), (5.0, 6.0), (6.0, 6.0), (6.0, 5.0)], källa="regso"),
        ]
        self.assertEqual(len(merge([], regso)), 2)


class Ytstorlek(unittest.TestCase):
    def test_kvadratens_area(self):
        self.assertAlmostEqual(ring_area([[0, 0], [0, 2], [2, 2], [2, 0]]), 4.0)

    def test_riktningen_spelar_ingen_roll(self):
        medsols = ring_area([[0, 0], [2, 0], [2, 2], [0, 2]])
        motsols = ring_area([[0, 0], [0, 2], [2, 2], [2, 0]])
        self.assertAlmostEqual(medsols, motsols)


if __name__ == "__main__":
    unittest.main(verbosity=2)
