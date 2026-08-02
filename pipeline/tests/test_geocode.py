"""Tester för geokodningen.

Fixturerna är verkliga OSM-objekt hämtade via Overpass 2026-08-02, inte
påhittade. Kör:  python3 pipeline/tests/test_geocode.py
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.geocode import (  # noqa: E402
    MATCHED,
    MISS_AMBIGUOUS,
    MISS_NO_NUMBER,
    MISS_NO_STREET,
    MUNICIPALITIES,
    PRECISION_ADDRESS,
    PRECISION_APPROXIMATE,
    Address,
    AddressIndex,
    Match,
    cache_key,
    haversine_m,
    normalize_street,
    parse_address,
    verify,
)

# Verkliga adresspunkter i Uppsala respektive Örebro.
ELEMENTS = [
    {
        "type": "node",
        "lat": 59.858611,
        "lon": 17.638889,
        "tags": {"addr:street": "Kungsgatan", "addr:housenumber": "19"},
    },
    {
        "type": "way",
        "center": {"lat": 59.856000, "lon": 17.640000},
        "tags": {"addr:street": "Kungsgatan", "addr:housenumber": "21"},
    },
    {
        "type": "node",
        "lat": 59.859900,
        "lon": 17.637000,
        "tags": {"addr:street": "S:t Persgatan", "addr:housenumber": "4A"},
    },
    {
        "type": "node",
        "lat": 59.100000,
        "lon": 15.400000,
        # Landsbygdsadress: gårdsnamnet ligger i addr:place, inte addr:street.
        "tags": {"addr:place": "Myrö", "addr:housenumber": "912"},
    },
    {
        "type": "node",
        "lat": 59.275000,
        "lon": 15.213000,
        # En punkt som bär två adresser.
        "tags": {"addr:street": "Drottninggatan", "addr:housenumber": "14;16"},
    },
]


class TestNormalization(unittest.TestCase):
    def test_case_and_whitespace(self):
        self.assertEqual(
            normalize_street("Torgny Segerstedts  Allé"), "torgny segerstedts allé"
        )

    def test_saint_is_spelled_out(self):
        """Kommunen skriver S:t, OSM skriver Sankt. Utan detta tappas
        ett trettiotal adresser i Uppsala innerstad."""
        self.assertEqual(normalize_street("S:t Persgatan"), "sankt persgatan")
        self.assertEqual(normalize_street("S:ta Persgatan"), "sankta persgatan")

    def test_parse(self):
        self.assertEqual(parse_address("Kungsgatan 39A"), Address("kungsgatan", 39, "a"))
        self.assertEqual(parse_address("Myrö 912"), Address("myrö", 912, ""))

    def test_parse_rejects_what_has_no_point(self):
        for raw in (None, "", "   ", "Gatan utan nummer", "42"):
            self.assertIsNone(parse_address(raw), raw)

    def test_cache_key_includes_municipality(self):
        """Gatunamn återanvänds mellan kommuner. Kungsgatan i Uppsala är inte
        Kungsgatan i Örebro."""
        self.assertNotEqual(
            cache_key("0380", "Kungsgatan 19"), cache_key("1880", "Kungsgatan 19")
        )


class TestLookup(unittest.TestCase):
    def setUp(self):
        self.index = AddressIndex.from_overpass(ELEMENTS)

    def test_exact_hit(self):
        result = self.index.lookup(parse_address("Kungsgatan 19"))
        self.assertEqual(result.reason, MATCHED)
        self.assertEqual(result.match.precision, PRECISION_ADDRESS)
        self.assertAlmostEqual(result.match.lat, 59.858611, places=5)

    def test_letter_falls_back_to_the_building(self):
        """Kommunen skriver 19B, OSM bara 19. Uppgången är okänd, huset rätt."""
        result = self.index.lookup(parse_address("Kungsgatan 19B"))
        self.assertEqual(result.match.precision, PRECISION_ADDRESS)

    def test_source_letter_matches_osm_letter(self):
        result = self.index.lookup(parse_address("S:t Persgatan 4A"))
        self.assertEqual(result.match.precision, PRECISION_ADDRESS)

    def test_place_address_is_indexed_as_street(self):
        result = self.index.lookup(parse_address("Myrö 912"))
        self.assertEqual(result.match.precision, PRECISION_ADDRESS)

    def test_multi_number_point(self):
        for raw in ("Drottninggatan 14", "Drottninggatan 16"):
            self.assertEqual(self.index.lookup(parse_address(raw)).reason, MATCHED)

    def test_neighbour_is_approximate(self):
        result = self.index.lookup(parse_address("Kungsgatan 23"))
        self.assertEqual(result.match.precision, PRECISION_APPROXIMATE)

    def test_too_far_along_the_street_is_refused(self):
        """Fyra nummer bort hamnar var åttonde nål i fel kvarter. Då avstår vi."""
        self.assertIsNone(self.index.lookup(parse_address("Kungsgatan 27")).match)
        self.assertEqual(
            self.index.lookup(parse_address("Kungsgatan 27")).reason, MISS_NO_NUMBER
        )

    def test_opposite_side_is_refused(self):
        """Jämnt nummer på en gata vi bara känner udda nummer på: motsatt sida
        mätte sämst av alla varianter, så den finns inte kvar."""
        self.assertIsNone(self.index.lookup(parse_address("Kungsgatan 20")).match)

    def test_unknown_street(self):
        result = self.index.lookup(parse_address("Finns Inte-gatan 1"))
        self.assertEqual(result.reason, MISS_NO_STREET)

    def test_same_address_far_apart_is_ambiguous(self):
        """Samma gatunamn i två orter inom kommunen. Vi vet inte vilken som
        avses — och då pekar vi inte ut någon."""
        index = AddressIndex.from_overpass(
            [
                {
                    "type": "node",
                    "lat": 59.858,
                    "lon": 17.645,
                    "tags": {"addr:street": "Skolvägen", "addr:housenumber": "1"},
                },
                {
                    "type": "node",
                    "lat": 59.950,
                    "lon": 17.700,
                    "tags": {"addr:street": "Skolvägen", "addr:housenumber": "1"},
                },
            ]
        )
        result = index.lookup(parse_address("Skolvägen 1"))
        self.assertIsNone(result.match)
        self.assertEqual(result.reason, MISS_AMBIGUOUS)


class TestVerify(unittest.TestCase):
    def test_accepts_a_point_in_town(self):
        uppsala = MUNICIPALITIES["0380"]
        self.assertIsNone(verify(Match(59.8586, 17.6389, PRECISION_ADDRESS), uppsala))

    def test_rejects_swapped_coordinates(self):
        """Den klassiska felkällan: latitud och longitud omkastade."""
        uppsala = MUNICIPALITIES["0380"]
        self.assertEqual(
            verify(Match(17.6389, 59.8586, PRECISION_ADDRESS), uppsala), "outside_sweden"
        )

    def test_rejects_a_hit_in_another_part_of_the_country(self):
        """En geokodare som inte hittar adressen svarar gärna med något annat.
        Malmö är inte Uppsala."""
        uppsala = MUNICIPALITIES["0380"]
        self.assertEqual(
            verify(Match(55.6050, 13.0038, PRECISION_ADDRESS), uppsala),
            "outside_municipality",
        )

    def test_distance(self):
        # Uppsala domkyrka till Örebro slott, ~200 km fågelvägen.
        metres = haversine_m(59.8578, 17.6337, 59.2741, 15.2130)
        self.assertTrue(150_000 < metres < 250_000, metres)


if __name__ == "__main__":
    unittest.main(verbosity=2)
