"""Tester för Karlstads-adaptern.

Fixturerna är verkliga svar från kommunens GeoServer 2026-08-02, inte
påhittade.  Kör:  python3 pipeline/tests/test_karlstad.py
"""

import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.grading import (  # noqa: E402
    FOLLOWUP,
    MINOR_REMARKS,
    NO_REMARKS,
    ROUTINE,
)
from prikko.sources.karlstad import (  # noqa: E402
    UnknownSourceValue,
    normalize_establishment,
    normalize_inspections,
    query_url,
)

# Verklig post ur webbkartan:livsmedelskontroller_restaurang
RAW = {
    "type": "Feature",
    "id": "livsmedelskontroller_restaurang.F019F091-57B2-4EFB-B807-C98E389ED04A",
    "geometry": {"type": "Point", "coordinates": [152585.32, 6585420.16]},
    "geometry_name": "geom",
    "properties": {
        "id": "F019F091-57B2-4EFB-B807-C98E389ED04A",
        "kategori": "Café",
        "verksamhet": "restaurang",
        "namn": "Skutbergets Motionscentral",
        "inriktning": "Café",
        "senaste_tillsyn_datum": "2025-06-27",
        "kontroll": "Extra kontroll",
        "avvikelser": "Nej",
        "itssearch": "Skutbergets Motionscentral",
        "arendenummer": "MN-2025-2318",
    },
}


def with_properties(**overrides):
    return {
        "geometry": dict(RAW["geometry"]),
        "properties": dict(RAW["properties"], **overrides),
    }


class Request(unittest.TestCase):
    def test_srs_is_not_requested(self):
        # Med srsName=EPSG:4326 avrundar servern till två decimaler, alltså
        # ungefär en kilometers fel. Utan den kommer full precision i
        # EPSG:3008. Regressionen vore tyst och skulle flytta restauranger
        # till fel stadsdel.
        url = query_url("webbkartan:livsmedelskontroller_restaurang")
        self.assertNotIn("srsName", url)
        self.assertIn("outputFormat=application%2Fjson", url)


class Establishment(unittest.TestCase):
    def test_basic_fields(self):
        e = normalize_establishment(RAW, "Restaurang och servering")
        self.assertEqual(e.name, "Skutbergets Motionscentral")
        self.assertEqual(e.municipality_code, "1780")
        self.assertEqual(
            e.id_national, "F-1780-F019F091-57B2-4EFB-B807-C98E389ED04A"
        )

    def test_coordinates_are_transformed_from_the_local_zone(self):
        # Facit från pyproj mot EPSG:3008 — vår egen transform gav exakt
        # samma värde, 0,000 m skillnad. Med rikszonen TM i stället för
        # 13 30 hamnar punkten flera mil fel.
        #
        # (Punkten motsvarar inte det verkliga Skutberget, som ligger väster
        # om centrum. Det är kommunens egen felregistrering — beståndet i
        # övrigt ligger rätt, med 209 verksamheter inom en kilometer från
        # Stora torget. Vi återger källan, vi rättar den inte.)
        e = normalize_establishment(RAW, "Restaurang och servering")
        self.assertAlmostEqual(e.lat, 59.383759, places=5)
        self.assertAlmostEqual(e.lng, 13.545489, places=5)

    def test_coordinates_outside_sweden_are_dropped(self):
        feature = with_properties()
        feature["geometry"] = {"coordinates": [0, 0]}
        e = normalize_establishment(feature, "Restaurang")
        self.assertIsNone(e.lat)
        self.assertIsNone(e.lng)

    def test_missing_address_is_none_not_empty_string(self):
        # Karlstad publicerar ingen adress alls. None betyder "finns inte";
        # tom sträng skulle renderas som en tom rad på sidan.
        self.assertIsNone(normalize_establishment(RAW, "Restaurang").street_address)

    def test_types_combine_all_three_levels_without_duplicates(self):
        e = normalize_establishment(RAW, "Restaurang och servering")
        # kategori och inriktning är båda "Café" här — ska inte dubbleras.
        self.assertEqual(e.types, ["Café", "Restaurang och servering"])

    def test_establishment_without_id_raises(self):
        with self.assertRaises(UnknownSourceValue):
            normalize_establishment(with_properties(id=""), "Restaurang")


class Inspections(unittest.TestCase):
    def parse(self, feature):
        return normalize_inspections(feature, "F-1780-test")

    def test_single_inspection_is_parsed(self):
        got = self.parse(RAW)
        self.assertEqual(len(got), 1)
        self.assertEqual(got[0].inspected_at, date(2025, 6, 27))
        self.assertEqual(got[0].assessment, NO_REMARKS)
        self.assertEqual(got[0].type, FOLLOWUP)

    def test_extra_kontroll_counts_as_a_follow_up(self):
        # Kommunens egen definition: extrakontroll görs när avvikelser
        # behöver följas upp. Det är den mappningen modellen läser
        # kvarstående brister ur, så den får inte tyst ändras.
        self.assertEqual(self.parse(RAW)[0].type, FOLLOWUP)
        self.assertEqual(
            self.parse(with_properties(kontroll="Ordinarie kontroll"))[0].type, ROUTINE
        )

    def test_deviation_maps_to_minor_not_major(self):
        # Karlstad saknar kvarstår-etikett. Allvarsgraden härleds av
        # grading.py ur mönstret — adaptern får aldrig gissa den.
        got = self.parse(with_properties(avvikelser="Ja"))
        self.assertEqual(got[0].assessment, MINOR_REMARKS)

    def test_no_date_gives_no_inspections(self):
        # Nyregistrerad, eller inte kontrollerad efter 1 januari 2024.
        self.assertEqual(
            self.parse(with_properties(senaste_tillsyn_datum="", kontroll="", avvikelser="")),
            [],
        )

    def test_unknown_control_type_raises_instead_of_defaulting(self):
        with self.assertRaises(UnknownSourceValue):
            self.parse(with_properties(kontroll="Rymdkontroll"))

    def test_unknown_deviation_value_raises_instead_of_defaulting(self):
        with self.assertRaises(UnknownSourceValue):
            self.parse(with_properties(avvikelser="Kanske"))

    def test_missing_control_type_with_a_date_raises(self):
        # Datum men tom kontrolltyp är en kombination som inte förekommer.
        # Dyker den upp har formatet ändrats och vi ska få veta det.
        with self.assertRaises(UnknownSourceValue):
            self.parse(with_properties(kontroll=""))

    def test_areas_are_empty_because_the_source_has_none(self):
        self.assertEqual(self.parse(RAW)[0].areas, [])

    def test_inspection_id_is_derived_from_date_not_position(self):
        self.assertEqual(
            self.parse(RAW)[0].id_national,
            "I-1780-F019F091-57B2-4EFB-B807-C98E389ED04A-2025-06-27",
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
