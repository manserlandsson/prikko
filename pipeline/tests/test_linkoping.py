"""Tester för Linköpings-adaptern.

Fixturerna är verkliga svar från live-API:et 2026-08-02, inte påhittade.
Kör:  python3 pipeline/tests/test_linkoping.py
"""

import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.grading import (  # noqa: E402
    COMPLAINT,
    FOLLOWUP,
    MAJOR_REMARKS,
    MINOR_REMARKS,
    NO_REMARKS,
    ROUTINE,
)
from prikko.sources.linkoping import (  # noqa: E402
    UnknownSourceValue,
    normalize_establishment,
    normalize_inspection,
)

# Verkligt objekt ur /api/v1/Anlaggningar/{id}
RAW_ESTABLISHMENT = {
    "anlaggningsId": "975A4347-8927-4230-98E6-AAED2975562E",
    "objektsnamn": "247 PUNKTEN*",
    "verksamhet": ["Butik"],
    "allaInriktningar": "Livsmedelsbutik ej hantering",
    "adress": "Platensgatan 6A",
    "geoPositionNorr": 6477340.923,
    "geoPositionOst": 186265.704,
}

RAW_INSPECTION = {
    "tillsynsId": "E7998230-47F1-41B8-9342-1B7E5DFB255D",
    "helhetsbedomning av tillsynen": "Åtgärdad",
    "tillsynsDatumTid": "2025-01-24T00:00:00",
    "orsak": "Uppföljande",
    "anmald": "Oanmäld",
}


class Establishments(unittest.TestCase):
    def test_coordinates_land_in_linkoping(self):
        """Fel SWEREF-zon placerar Platensgatan i Nordsjön."""
        e = normalize_establishment(RAW_ESTABLISHMENT)
        self.assertAlmostEqual(e.lat, 58.41202, places=4)
        self.assertAlmostEqual(e.lng, 15.62044, places=4)

    def test_national_id_is_namespaced_by_municipality(self):
        e = normalize_establishment(RAW_ESTABLISHMENT)
        self.assertTrue(e.id_national.startswith("F-0580-"))

    def test_implausible_coordinates_are_dropped_not_published(self):
        """Hellre ingen position än en position som ljuger."""
        raw = dict(RAW_ESTABLISHMENT, geoPositionNorr=1000.0, geoPositionOst=1000.0)
        self.assertIsNone(normalize_establishment(raw).lat)

    def test_missing_coordinates_are_tolerated(self):
        raw = dict(RAW_ESTABLISHMENT)
        del raw["geoPositionNorr"]
        del raw["geoPositionOst"]
        self.assertIsNone(normalize_establishment(raw).lng)


class Inspections(unittest.TestCase):
    def test_maps_swedish_verdict_to_assessment(self):
        i = normalize_inspection(RAW_INSPECTION, "F-0580-x")
        self.assertEqual(i.assessment, NO_REMARKS)  # "Åtgärdad"
        self.assertEqual(i.type, FOLLOWUP)          # "Uppföljande"
        self.assertEqual(i.inspected_at, date(2025, 1, 24))
        self.assertFalse(i.prenotified)             # "Oanmäld"

    def test_all_observed_verdicts_are_mapped(self):
        """Samtliga värden som faktiskt förekommer i beståndet."""
        expected = {
            "Utan Avvikelse": NO_REMARKS,
            "Åtgärdad": NO_REMARKS,
            "Godtagbar": MINOR_REMARKS,
            "Avvikelse": MINOR_REMARKS,
            "Kvarstår": MAJOR_REMARKS,
            "Ej godtagbar": MAJOR_REMARKS,
        }
        for verdict, assessment in expected.items():
            raw = dict(RAW_INSPECTION)
            raw["helhetsbedomning av tillsynen"] = verdict
            self.assertEqual(
                normalize_inspection(raw, "F-0580-x").assessment,
                assessment,
                f"felaktig mappning för {verdict!r}",
            )

    def test_all_observed_reasons_are_mapped(self):
        expected = {
            "Planerad": ROUTINE,
            "Uppföljande": FOLLOWUP,
            "Uppföljande tidigare avvikelse": FOLLOWUP,
            "Händelsestyrd": COMPLAINT,
        }
        for reason, type_ in expected.items():
            raw = dict(RAW_INSPECTION, orsak=reason)
            self.assertEqual(normalize_inspection(raw, "F-0580-x").type, type_)

    def test_godtagbar_is_flagged_as_uncertain(self):
        """75 anläggningar hänger på den tolkningen — den ska synas."""
        raw = dict(RAW_INSPECTION)
        raw["helhetsbedomning av tillsynen"] = "Godtagbar"
        self.assertTrue(normalize_inspection(raw, "F-0580-x").uncertain)
        self.assertFalse(normalize_inspection(RAW_INSPECTION, "F-0580-x").uncertain)

    def test_facility_without_inspection_returns_none(self):
        """258 av 1 241 saknar kontroll — de ska sakna betyg, inte få ett dåligt."""
        raw = dict(RAW_INSPECTION)
        raw["helhetsbedomning av tillsynen"] = None
        self.assertIsNone(normalize_inspection(raw, "F-0580-x"))

    def test_unknown_verdict_raises_instead_of_guessing(self):
        """Ett nytt värde får aldrig tyst tolkas som godkänt."""
        raw = dict(RAW_INSPECTION)
        raw["helhetsbedomning av tillsynen"] = "Något helt nytt"
        with self.assertRaises(UnknownSourceValue):
            normalize_inspection(raw, "F-0580-x")

    def test_handles_two_digit_fractional_seconds(self):
        """Källan levererar '...27.07', vilket Pythons ISO-parser vägrar."""
        raw = dict(RAW_INSPECTION, tillsynsDatumTid="2023-12-20T10:45:27.07")
        self.assertEqual(
            normalize_inspection(raw, "F-0580-x").inspected_at, date(2023, 12, 20)
        )


if __name__ == "__main__":
    unittest.main()
