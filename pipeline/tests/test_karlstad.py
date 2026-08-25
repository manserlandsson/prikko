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
    ADDRESS_FIELDS,
    UnknownSourceValue,
    address_query_url,
    normalize_address,
    normalize_establishment,
    normalize_inspections,
    parse_addresses,
    query_url,
    unambiguous_names,
    with_address,
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
        # De fyra aktuella lagren bär ingen adress. None betyder "finns
        # inte"; tom sträng skulle renderas som en tom rad på sidan.
        # Adressen sätts i ett andra steg, se klassen Adresslagret nedan.
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

    def test_case_number_is_carried(self):
        # Kommunens FAQ pekar ut ärendenumret som nyckeln för att begära ut
        # rapporten via Kontaktcenter. Det fanns i råsvaret hela tiden och
        # kastades fram till 2026-08-25.
        self.assertEqual(self.parse(RAW)[0].case_number, "MN-2025-2318")

    def test_missing_case_number_is_none_not_empty_string(self):
        # 94 av 695 poster saknar ärendenummer, och exakt de posterna saknar
        # även kontrolldatum. None betyder "finns inte"; tom sträng skulle
        # renderas som en rubrik utan värde.
        got = self.parse(with_properties(arendenummer=None))
        self.assertIsNone(got[0].case_number)


# Verkliga poster ur det avställda lagret. Adressfälten är utfyllda med
# blanksteg till 200 tecken i källan, precis som här.
ADDRESS_PAYLOAD = {
    "type": "FeatureCollection",
    "features": [
        {
            "properties": {
                "namn": "Skutbergets Motionscentral" + " " * 20,
                "adress": "VÅXNÄSGATAN 10" + " " * 30,
            }
        },
        {
            "properties": {
                "namn": "Bingopalatset City",
                "adress": "Drottninggatan 31",
            }
        },
    ],
}


class Adresslagret(unittest.TestCase):
    """Adresserna hämtas ur ett AVSTÄLLT lager, och bara adresserna.

    Lagret bär också kontrollresultat från 2019 till 2024 och länkar till en
    nedmonterad sida. De får aldrig följa med, och testerna här är spärren
    mot att de gör det.
    """

    def test_query_asks_for_two_fields_only(self):
        # Första spärren sitter i anropet: servern skickar aldrig
        # `resultat`, `anmarkningar` eller `url`.
        url = address_query_url()
        self.assertIn("propertyName=namn,adress", url)
        self.assertEqual(ADDRESS_FIELDS, ("namn", "adress"))
        for forbidden in ("resultat", "anmarkningar", "uppfoljning", "url="):
            self.assertNotIn(forbidden, url)

    def test_query_uses_the_retired_layer_not_a_current_one(self):
        url = address_query_url()
        self.assertIn("vy_mi_miljo_livsmedelskontroller", url)
        self.assertNotIn("livsmedelskontroller_restaurang", url)

    def test_extra_field_raises_instead_of_being_ignored(self):
        # Andra spärren sitter i tolkningen. Slutar propertyName verka ska
        # hämtningen stanna, inte tyst ta emot fyra år gamla omdömen.
        payload = {
            "features": [
                {"properties": {"namn": "X", "adress": "Y", "resultat": "Med avvikelse"}}
            ]
        }
        with self.assertRaises(UnknownSourceValue):
            parse_addresses(payload)

    def test_addresses_are_keyed_by_folded_name(self):
        got = parse_addresses(ADDRESS_PAYLOAD)
        self.assertEqual(got["bingopalatset city"], "Drottninggatan 31")

    def test_padding_is_stripped(self):
        got = parse_addresses(ADDRESS_PAYLOAD)
        self.assertEqual(got["skutbergets motionscentral"], "Våxnäsgatan 10")

    def test_all_caps_addresses_are_normalised(self):
        # 557 av 691 adresser står i versaler. Utan städning ser sidan ut
        # att skrika åt besökaren.
        self.assertEqual(normalize_address("ÄLVGATAN 3"), "Älvgatan 3")
        self.assertEqual(normalize_address("SVEAGATAN 10A"), "Sveagatan 10A")

    def test_mixed_case_addresses_are_left_alone(self):
        # Kommunens egen skrivning blir inte bättre av en titelregel.
        self.assertEqual(
            normalize_address("Väse Prästgård 610"), "Väse Prästgård 610"
        )

    def test_a_name_with_two_addresses_is_dropped(self):
        # Två poster med samma skylt är två verksamheter. Att välja den ena
        # vore att gissa vilken.
        payload = {
            "features": [
                {"properties": {"namn": "Kiosken", "adress": "Storgatan 1"}},
                {"properties": {"namn": "Kiosken", "adress": "Lillgatan 2"}},
            ]
        }
        self.assertEqual(parse_addresses(payload), {})

    def test_rows_without_address_are_skipped(self):
        payload = {"features": [{"properties": {"namn": "Utan", "adress": "   "}}]}
        self.assertEqual(parse_addresses(payload), {})


class Hopparning(unittest.TestCase):
    def establishment(self, name):
        return normalize_establishment(with_properties(namn=name), "Restaurang")

    def test_address_is_applied_on_a_unique_name(self):
        e = self.establishment("Bingopalatset City")
        got = with_address(e, parse_addresses(ADDRESS_PAYLOAD), unambiguous_names([e]))
        self.assertEqual(got.street_address, "Drottninggatan 31")

    def test_duplicate_name_in_our_own_stock_gets_no_address(self):
        # 12 av 696 verksamheter delar namn med en annan. Ett namn som står
        # på två verksamheter kan inte peka ut vilken adressen gäller.
        first = self.establishment("Bingopalatset City")
        second = normalize_establishment(
            with_properties(namn="Bingopalatset City", id="ANNAT-ID"), "Café"
        )
        unique = unambiguous_names([first, second])
        for e in (first, second):
            got = with_address(e, parse_addresses(ADDRESS_PAYLOAD), unique)
            self.assertIsNone(got.street_address)

    def test_unknown_name_is_left_without_address(self):
        e = self.establishment("Finns Inte I Gamla Lagret")
        got = with_address(e, parse_addresses(ADDRESS_PAYLOAD), unambiguous_names([e]))
        self.assertIsNone(got.street_address)

    def test_an_existing_address_is_never_overwritten(self):
        # Den dagen kommunen börjar publicera adresser i de aktuella lagren
        # ska den färska uppgiften vinna över den avställda.
        from dataclasses import replace as _replace

        e = _replace(self.establishment("Bingopalatset City"), street_address="Ny 1")
        got = with_address(e, parse_addresses(ADDRESS_PAYLOAD), unambiguous_names([e]))
        self.assertEqual(got.street_address, "Ny 1")


class Kallanken(unittest.TestCase):
    def test_source_url_is_the_target_not_the_redirect(self):
        # Den tidigare adressen svarade 301 hit. Vi följer omdirigeringen i
        # förväg i stället för att skicka besökaren genom den.
        from prikko.sources.karlstad import SOURCE_URL

        self.assertIn("mat-miljo-och-halsoskydd", SOURCE_URL)
        self.assertNotIn("saker-och-trygg-mat", SOURCE_URL)


if __name__ == "__main__":
    unittest.main(verbosity=2)
