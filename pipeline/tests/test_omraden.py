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

Körs utan beroenden:  python3 pipeline/tests/test_omraden.py
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from omraden import (  # noqa: E402
    ring_area,
    rings_from_relation,
    rings_from_way,
    round_ring,
    slugify,
    wanted,
)


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


class Ytstorlek(unittest.TestCase):
    def test_kvadratens_area(self):
        self.assertAlmostEqual(ring_area([[0, 0], [0, 2], [2, 2], [2, 0]]), 4.0)

    def test_riktningen_spelar_ingen_roll(self):
        medsols = ring_area([[0, 0], [2, 0], [2, 2], [0, 2]])
        motsols = ring_area([[0, 0], [0, 2], [2, 2], [2, 0]])
        self.assertAlmostEqual(medsols, motsols)


if __name__ == "__main__":
    unittest.main(verbosity=2)
