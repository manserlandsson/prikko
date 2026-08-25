"""Tester för Jönköpings-adaptern.

Fixturerna är verkliga svar från kommunens ArcGIS-tjänst 2026-08-02, inte
påhittade.  Kör:  python3 pipeline/tests/test_jonkoping.py
"""

import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.grading import (  # noqa: E402
    COMPLAINT,
    FOLLOWUP,
    MINOR_REMARKS,
    NO_REMARKS,
    ROUTINE,
)
from prikko.sources.jonkoping import (  # noqa: E402
    UnknownSourceValue,
    check_deviation_flag,
    local_id,
    normalize_establishment,
    normalize_inspections,
    normalize_ort,
)

# Verklig post ur MapServer/10/query
RAW = {
    "attributes": {
        "OBJECTID": 12,
        "adress": "Elmiavägen 8",
        "fastighetsbeteckning": "Åminne 1",
        "objektsnamn": "Scandic hotell Jönköping",
        "objektstyp": "Livsmedel",
        "ort": "JÖNKÖPING",
        "senaste_kontroller": (
            "2026-04-21 Planerad kontroll <br>Kontrollresultat: Utan avvikelse<br>"
            "2025-11-10 Planerad kontroll <br>Kontrollresultat: Utan avvikelse<br>"
            "2025-08-14 Uppföljande kontroll <br>Kontrollresultat: Utan avvikelse<br>"
        ),
        "status": "Registrerad",
        "typ": "Restaurang",
        "x": "6407764.2",
        "y": "193364.8",
        "har_avvikelse": "0",
        "kategori": "Restaurang och servering",
    },
    "geometry": {"x": 14.229024570283267, "y": 57.78674091446293},
}


def with_attributes(**overrides):
    feature = {
        "attributes": dict(RAW["attributes"], **overrides),
        "geometry": dict(RAW["geometry"]),
    }
    return feature


class Establishment(unittest.TestCase):
    def test_basic_fields(self):
        e = normalize_establishment(RAW, "Restaurang och servering")
        self.assertEqual(e.name, "Scandic hotell Jönköping")
        self.assertEqual(e.municipality_code, "0680")
        self.assertTrue(e.id_national.startswith("F-0680-"))

    def test_central_ort_is_not_repeated_after_the_address(self):
        # Sidan skriver ut kommunens namn efter adressen. Läggs orten till
        # här också blir resultatet "Elmiavägen 8, Jönköping, Jönköping".
        e = normalize_establishment(RAW, "Restaurang och servering")
        self.assertEqual(e.street_address, "Elmiavägen 8")

    def test_other_orter_are_kept_because_they_add_information(self):
        e = normalize_establishment(
            with_attributes(adress="Brahegatan 1", ort="GRÄNNA"), "Restaurang"
        )
        self.assertEqual(e.street_address, "Brahegatan 1, Gränna")

    def test_ort_is_title_cased_not_shouted(self):
        self.assertEqual(normalize_ort("HUSKVARNA"), "Huskvarna")
        self.assertEqual(normalize_ort("  Gränna "), "Gränna")
        self.assertEqual(normalize_ort(None), "")

    def test_misspelled_orter_are_corrected_to_the_sources_own_spelling(self):
        self.assertEqual(normalize_ort("Jönköpnig"), "Jönköping")
        self.assertEqual(normalize_ort("Temhult"), "Tenhult")

    def test_coordinates_come_ready_in_wgs84(self):
        e = normalize_establishment(RAW, "Restaurang och servering")
        # outSR=4326 ger x=longitud, y=latitud — förväxlas de hamnar
        # Jönköping i Indiska oceanen.
        self.assertAlmostEqual(e.lat, 57.786741, places=5)
        self.assertAlmostEqual(e.lng, 14.229025, places=5)

    def test_coordinates_outside_sweden_are_dropped(self):
        feature = with_attributes()
        feature["geometry"] = {"x": 57.78, "y": 14.22}  # ombytta
        e = normalize_establishment(feature, "Restaurang och servering")
        self.assertIsNone(e.lat)
        self.assertIsNone(e.lng)

    def test_types_keep_both_levels_without_duplicates(self):
        e = normalize_establishment(RAW, "Restaurang och servering")
        self.assertEqual(e.types, ["Restaurang", "Restaurang och servering"])

        same = normalize_establishment(
            with_attributes(typ="Restaurang och servering"), "Restaurang och servering"
        )
        self.assertEqual(same.types, ["Restaurang och servering"])

    def test_identity_survives_arcgis_renumbering(self):
        # OBJECTID byter värde vid ompublicering. Gör identiteten det också
        # skapar den nattliga körningen dubbletter i stället för att uppdatera.
        self.assertEqual(local_id(RAW["attributes"]),
                         local_id(with_attributes(OBJECTID=99999)["attributes"]))

    def test_identity_differs_between_establishments(self):
        self.assertNotEqual(local_id(RAW["attributes"]),
                            local_id(with_attributes(adress="Annan gata 1")["attributes"]))


class Inspections(unittest.TestCase):
    def parse(self, feature):
        return normalize_inspections(feature, "F-0680-test")

    def test_history_is_parsed_newest_first(self):
        got = self.parse(RAW)
        self.assertEqual(
            [i.inspected_at for i in got],
            [date(2026, 4, 21), date(2025, 11, 10), date(2025, 8, 14)],
        )
        self.assertTrue(all(i.assessment == NO_REMARKS for i in got))

    def test_deviation_maps_to_minor_not_major(self):
        # Jönköping saknar kvarstår-etikett. Allvarsgraden härleds av
        # grading.py ur mönstret — adaptern får aldrig gissa den.
        got = self.parse(with_attributes(
            senaste_kontroller=(
                "2026-01-05 Planerad kontroll <br>Kontrollresultat: Med avvikelse<br>"
            ),
            har_avvikelse="1",
        ))
        self.assertEqual(got[0].assessment, MINOR_REMARKS)

    def test_reason_keywords_cover_every_observed_value(self):
        # Alla nio värden som förekommer i beståndet 2026-08-02.
        cases = {
            "Planerad kontroll": ROUTINE,
            "Uppföljande kontroll": FOLLOWUP,
            "Händelsestyrd kontroll": COMPLAINT,
            "Planerad, Uppföljande kontroll": FOLLOWUP,
            "Uppföljning avvikelser utan id kontroll": FOLLOWUP,
            "Händelsestyrd, Planerad kontroll": COMPLAINT,
            "Planerad, Uppföljning avvikelser utan id kontroll": FOLLOWUP,
            "Händelsestyrd, Uppföljande kontroll": FOLLOWUP,
            "Händelsestyrd, Planerad, Uppföljande kontroll": FOLLOWUP,
        }
        for reason, expected in cases.items():
            got = self.parse(with_attributes(
                senaste_kontroller=(
                    f"2026-01-05 {reason} <br>Kontrollresultat: Utan avvikelse<br>"
                )
            ))
            self.assertEqual(got[0].type, expected, reason)

    def test_unknown_result_raises_instead_of_defaulting(self):
        with self.assertRaises(UnknownSourceValue):
            self.parse(with_attributes(
                senaste_kontroller=(
                    "2026-01-05 Planerad kontroll <br>Kontrollresultat: Nytt värde<br>"
                )
            ))

    def test_unknown_reason_raises_instead_of_defaulting(self):
        with self.assertRaises(UnknownSourceValue):
            self.parse(with_attributes(
                senaste_kontroller=(
                    "2026-01-05 Rymdkontroll <br>Kontrollresultat: Utan avvikelse<br>"
                )
            ))

    def test_same_day_inspections_merge_to_the_worse_outcome(self):
        got = self.parse(with_attributes(
            senaste_kontroller=(
                "2026-01-05 Planerad kontroll <br>Kontrollresultat: Utan avvikelse<br>"
                "2026-01-05 Uppföljande kontroll <br>Kontrollresultat: Med avvikelse<br>"
            ),
            har_avvikelse="1",
        ))
        self.assertEqual(len(got), 1)
        self.assertEqual(got[0].assessment, MINOR_REMARKS)
        self.assertEqual(got[0].type, FOLLOWUP)

    def test_inspection_ids_are_unique_and_stable(self):
        got = self.parse(RAW)
        self.assertEqual(len({i.id_national for i in got}), len(got))
        # Datumet, inte listpositionen, bär identiteten. Källan rymmer bara
        # tre kontroller, så positionerna förskjuts när en ny tillkommer.
        self.assertEqual(self.parse(RAW)[0].id_national, got[0].id_national)

    def test_no_history_gives_no_inspections(self):
        self.assertEqual(self.parse(with_attributes(senaste_kontroller="")), [])

    def test_areas_are_empty_because_the_source_has_none(self):
        self.assertEqual(self.parse(RAW)[0].areas, [])


class DeviationFlag(unittest.TestCase):
    """Kommunens egen 0/1-flagga är oberoende facit på texttolkningen."""

    def test_agreeing_flag_passes(self):
        check_deviation_flag(RAW, normalize_inspections(RAW, "F-0680-test"))

    def test_contradicting_flag_raises(self):
        feature = with_attributes(har_avvikelse="1")  # men historiken är ren
        with self.assertRaises(UnknownSourceValue):
            check_deviation_flag(feature, normalize_inspections(feature, "F-0680-test"))


class Fastighetsbeteckning(unittest.TestCase):
    """`fastighetsbeteckning` kastades fram till 2026-08-25.

    Den bärs nu in i pipelinen men INTE vidare till sajtens datafil. Se
    modulens inledning: beteckningen är lantmäteriets språk, och värdet
    ligger i att kunna geokoda en rad som saknar gatuadress.
    """

    def test_it_is_read(self):
        self.assertEqual(
            normalize_establishment(RAW, "Restaurang").property_designation,
            "Åminne 1",
        )

    def test_missing_value_is_none_not_empty_string(self):
        got = normalize_establishment(
            with_attributes(fastighetsbeteckning=""), "Restaurang"
        )
        self.assertIsNone(got.property_designation)


class Kallanken(unittest.TestCase):
    def test_source_url_host_exists(self):
        # Den tidigare adressen pekade på kartor.jonkoping.se, ett värdnamn
        # som inte finns i DNS: nslookup ger NXDOMAIN och curl exit 6.
        # Länken har alltså aldrig fungerat för en besökare.
        from prikko.sources.jonkoping import SOURCE_URL

        self.assertNotIn("kartor.jonkoping.se", SOURCE_URL)
        self.assertIn("jonkoping.maps.arcgis.com", SOURCE_URL)
        self.assertIn("036b2657f4eb47238e9872695ef29797", SOURCE_URL)


if __name__ == "__main__":
    unittest.main(verbosity=2)
