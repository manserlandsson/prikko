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
    AREA_IS_REMARK,
    AREA_OK,
    AREA_PERSISTING,
    ARCGIS_FACILITIES,
    ARCGIS_INSPECTIONS,
    LIST_URL,
    UnknownSourceValue,
    arcgis_query_url,
    check_arcgis_address,
    enrich,
    normalize_establishment,
    normalize_inspection,
    parse_arcgis_facilities,
    parse_arcgis_inspections,
    with_case_numbers,
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
            "Godtagbar": NO_REMARKS,
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

    def test_godtagbar_means_acceptable(self):
        """Motsatsen till "Ej godtagbar" — inte en mindre anmärkning.

        Lästes först fel. Linköpings egen läsanvisning har bara tre utfall
        (utan avvikelse, med avvikelse, kvarstår), och "Godtagbar" hör till
        den godkända sidan.
        """
        raw = dict(RAW_INSPECTION)
        raw["helhetsbedomning av tillsynen"] = "Godtagbar"
        result = normalize_inspection(raw, "F-0580-x")
        self.assertEqual(result.assessment, NO_REMARKS)
        self.assertFalse(result.uncertain)

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

    def test_control_areas_are_normalized(self):
        """Kontrollområdena bär breakdownen — utan dem finns ingen sida."""
        raw = dict(
            RAW_INSPECTION,
            kontrollomraden=[
                {
                    "Kontrollomrade": "Grundförutsättningar, hygien",
                    "nr": "J03",
                    "beskrivning": "Hygien före, under och efter processen",
                    "anmarkning": "Kvarstår",
                },
                {
                    "Kontrollomrade": "HACCP",
                    "nr": "K01",
                    "beskrivning": "Faroanalys",
                    "anmarkning": "Utan avvikelse",
                },
            ],
        )
        areas = normalize_inspection(raw, "F-0580-x").areas
        self.assertEqual([a.code for a in areas], ["J03", "K01"])
        self.assertEqual(areas[0].status, AREA_PERSISTING)
        self.assertEqual(areas[1].status, AREA_OK)
        self.assertIn(areas[0].status, AREA_IS_REMARK)
        self.assertNotIn(areas[1].status, AREA_IS_REMARK)

    def test_unknown_area_outcome_raises(self):
        raw = dict(
            RAW_INSPECTION,
            kontrollomraden=[{"nr": "J03", "anmarkning": "Något nytt"}],
        )
        with self.assertRaises(UnknownSourceValue):
            normalize_inspection(raw, "F-0580-x")

    def test_audit_and_on_site_flags_are_captured(self):
        raw = dict(RAW_INSPECTION, revision="Ja", platsbesok="Nej")
        result = normalize_inspection(raw, "F-0580-x")
        self.assertTrue(result.audit)
        self.assertFalse(result.on_site)

    def test_handles_two_digit_fractional_seconds(self):
        """Källan levererar '...27.07', vilket Pythons ISO-parser vägrar."""
        raw = dict(RAW_INSPECTION, tillsynsDatumTid="2023-12-20T10:45:27.07")
        self.assertEqual(
            normalize_inspection(raw, "F-0580-x").inspected_at, date(2023, 12, 20)
        )


# Verklig rad ur Livsmedelkoll_anlaggningar/FeatureServer/0
ARCGIS_FACILITY = {
    "features": [
        {
            "attributes": {
                "OBJECTID": 1,
                "AnlaggningId": "975A4347-8927-4230-98E6-AAED2975562E",
                "Objektsnamn": "247 PUNKTEN*",
                "Fastighet": "Absalon 22",
                "Adress": "Platensgatan 6A",
                "PostNr": "58220",
                "PostOrt": "Linköping",
                "Plats": "Innerstaden",
                "Status": "Aktiv",
                "FME_DATUM": "2026-08-24",
            }
        }
    ]
}

# Verklig rad ur LIVSMEDELKOLL_TILLSYNER/FeatureServer/0
ARCGIS_INSPECTION = {
    "features": [
        {
            "attributes": {
                "AnlaggningId": "975A4347-8927-4230-98E6-AAED2975562E",
                "Objektsnamn": "247 PUNKTEN*",
                "R2024RiskklassBeslutad": "SL1",
                "AnlaggningStatus": "Aktiv",
                "ArendeNummer": "MK-2024-5051",
                "TillsynsId": "E7998230-47F1-41B8-9342-1B7E5DFB255D",
                "TillsynsDatum": "2025-01-24",
                "Kontrollorsak": "Uppföljande",
                "KontrollTyp": "Oanmäld",
                "Helhetsbedomning2024": "Utan Avvikelse",
            }
        }
    ]
}

FULL_INSPECTION = dict(
    RAW_INSPECTION, anlaggningsId="975A4347-8927-4230-98E6-AAED2975562E"
)


class Ettanropshamtningen(unittest.TestCase):
    """Hela beståndet med full historik ryms i ett anrop.

    Fram till 2026-08-25 gjordes 1 241 detaljanrop i stället. Påståendet att
    listendpointen "alltid" ger tom `tillsyner` var sant bara när
    `inkluderaInspektioner` utelämnades.
    """

    def test_the_list_url_asks_for_the_history(self):
        self.assertIn("inkluderaInspektioner=true", LIST_URL)
        self.assertIn("inkluderaVerksamheter=true", LIST_URL)

    def test_the_list_url_is_not_the_old_sweep(self):
        self.assertNotIn("medsenastetillsyn", LIST_URL)


class ArcGisAnrop(unittest.TestCase):
    def test_geometry_is_not_requested(self):
        # Koordinaterna kommer ur JSON-API:et som förut. Att inte begära
        # geometri här betyder att det inte finns någon avrundning att bli
        # lurad av, till skillnad från i karlstad.py och oskarshamn.py.
        url = arcgis_query_url(ARCGIS_FACILITIES)
        self.assertIn("returnGeometry=false", url)

    def test_paging_is_expressed_as_an_offset(self):
        # Tabellen har 2 646 rader och serverns tak är 2 000.
        self.assertIn("resultOffset=2000", arcgis_query_url(ARCGIS_INSPECTIONS, 2000))


class Riskklass(unittest.TestCase):
    def test_risk_class_reaches_the_establishment(self):
        risk, _ = parse_arcgis_inspections([ARCGIS_INSPECTION])
        e = enrich(
            normalize_establishment(RAW_ESTABLISHMENT),
            parse_arcgis_facilities([ARCGIS_FACILITY]),
            risk,
        )
        self.assertEqual(e.risk_class, "SL1")

    def test_property_postal_code_and_district_come_along(self):
        e = enrich(
            normalize_establishment(RAW_ESTABLISHMENT),
            parse_arcgis_facilities([ARCGIS_FACILITY]),
            {},
        )
        self.assertEqual(e.property_designation, "Absalon 22")
        self.assertEqual(e.postal_code, "58220")
        self.assertEqual(e.district, "Innerstaden")

    def test_an_establishment_missing_from_the_layers_is_left_alone(self):
        # Lagren täcker 792 av 1 246. De övriga ska SAKNA riskklass, inte
        # hoppas över och inte få en gissad.
        e = enrich(normalize_establishment(RAW_ESTABLISHMENT), {}, {})
        self.assertIsNone(e.risk_class)
        self.assertIsNone(e.property_designation)

    def test_an_unknown_risk_class_raises_instead_of_being_published(self):
        # Ett värde utanför HK/SL/TL/KM betyder att kommunen bytt kodverk.
        # Att publicera en klass vi inte vet betydelsen av vore värre än
        # att sakna den.
        broken = {"features": [{"attributes": {
            "AnlaggningId": "A", "R2024RiskklassBeslutad": "ZZ9"}}]}
        with self.assertRaises(UnknownSourceValue):
            parse_arcgis_inspections([broken])

    def test_two_risk_classes_for_one_establishment_raise(self):
        # Tabellen har en rad per kontroll, så klassen upprepas. Motsägelser
        # var noll av 546 anläggningar vid mätningen.
        broken = {"features": [
            {"attributes": {"AnlaggningId": "A", "R2024RiskklassBeslutad": "SL4"}},
            {"attributes": {"AnlaggningId": "A", "R2024RiskklassBeslutad": "SL5"}},
        ]}
        with self.assertRaises(UnknownSourceValue):
            parse_arcgis_inspections([broken])

    def test_a_repeated_identical_risk_class_is_fine(self):
        ok = {"features": [
            {"attributes": {"AnlaggningId": "A", "R2024RiskklassBeslutad": "SL4"}},
            {"attributes": {"AnlaggningId": "A", "R2024RiskklassBeslutad": "SL4"}},
        ]}
        risk, _ = parse_arcgis_inspections([ok])
        self.assertEqual(risk["A"], "SL4")


class Diarienummer(unittest.TestCase):
    def test_case_number_is_matched_on_establishment_and_inspection(self):
        _, cases = parse_arcgis_inspections([ARCGIS_INSPECTION])
        got = with_case_numbers(
            [normalize_inspection(FULL_INSPECTION, "F-0580-test")], cases
        )
        self.assertEqual(got[0].case_number, "MK-2024-5051")

    def test_an_inspection_the_layer_does_not_know_keeps_none(self):
        # 2 492 av 9 131 kontroller fick ett nummer. Resten är äldre än
        # riskklassmodellen 2024 och finns inte i tabellen.
        got = with_case_numbers(
            [normalize_inspection(FULL_INSPECTION, "F-0580-test")], {}
        )
        self.assertIsNone(got[0].case_number)


class AdressFacit(unittest.TestCase):
    """Punktlagrets adress stämde med API:ets i 773 fall av 773.

    Kontrollen är gratis facit på att GUID:et pekar på samma verksamhet i
    båda källorna. Gör den inte det är riskklassen inte att lita på.
    """

    def test_agreeing_addresses_pass(self):
        check_arcgis_address(
            normalize_establishment(RAW_ESTABLISHMENT),
            parse_arcgis_facilities([ARCGIS_FACILITY]),
        )

    def test_contradicting_addresses_raise(self):
        payload = {"features": [{"attributes": dict(
            ARCGIS_FACILITY["features"][0]["attributes"],
            Adress="Helt Annan Gata 9")}]}
        with self.assertRaises(UnknownSourceValue):
            check_arcgis_address(
                normalize_establishment(RAW_ESTABLISHMENT),
                parse_arcgis_facilities([payload]),
            )

    def test_a_missing_address_on_either_side_is_not_a_conflict(self):
        # Att den ena källan saknar adress är väntat och betyder ingenting.
        payload = {"features": [{"attributes": dict(
            ARCGIS_FACILITY["features"][0]["attributes"], Adress="")}]}
        check_arcgis_address(
            normalize_establishment(RAW_ESTABLISHMENT),
            parse_arcgis_facilities([payload]),
        )

    def test_an_establishment_outside_the_layer_is_not_a_conflict(self):
        check_arcgis_address(normalize_establishment(RAW_ESTABLISHMENT), {})


if __name__ == "__main__":
    unittest.main()
