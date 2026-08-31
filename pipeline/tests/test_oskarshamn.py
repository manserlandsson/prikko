"""Tester för Oskarshamns-adaptern.

Fixturerna är verkliga svar från kommunens ArcGIS-tjänst 2026-08-02, inte
påhittade.  Kör:  python3 pipeline/tests/test_oskarshamn.py
"""

import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.grading import (  # noqa: E402
    MAJOR_REMARKS,
    MINOR_REMARKS,
    NO_REMARKS,
    REASON_NO_INSPECTIONS,
    REASON_STALE,
    ROUTINE,
    Inspection,
    assess,
)
from prikko.sources.oskarshamn import (  # noqa: E402
    ASSESSMENT_MAP,
    UnknownSourceValue,
    check_deviation_count,
    local_id,
    merge_layers,
    normalize_establishment,
    normalize_inspections,
    registration_date,
)

TODAY = date(2026, 8, 2)

# Verklig post ur MapServer/0/query. Kontrollerad, ren.
CLEAN = {
    "attributes": {
        "RadId": 270,
        "AnlaggningId": "{7BD05BCD-AD60-4B8E-A8DD-0B7C5B79AF33}",
        "Objektsnamn": "The Corner",
        "AnlaggningsNamn": "Mat i Söder AB",
        "Inriktning": "Restaurang, Transportör, Utleverans av mat",
        "Adress": "Knartorp Smerum ",
        "PostNr": "57291",
        "PostOrt": "Oskarshamn",
        "Fastighet": "Biet 16",
        "StartDatum": "2024-06-15",
        "AntalKvarstAvvikelser": 0,
        "AvvikelseAnteckningar": None,
        "TillsynsDatum": "2025-06-09",
        "Bedomning": "Inga avvikelser",
        "ESRI_OID": 1,
    },
    "geometry": {"x": 146870.09999999963, "y": 6349550.800000001},
}

# Verklig post ur MapServer/4/query. Fyra öppna avvikelser.
DEVIATIONS = {
    "attributes": {
        "RadId": 2900,
        "AnlaggningId": "{3BE1B030-1483-4D85-9727-7E83E5B28819}",
        "Objektsnamn": "Coop Flanaden",
        "AnlaggningsNamn": "coop Flanaden",
        "Inriktning": "Manuell hantering - Fisk, Manuell hantering - Chark, Butik med egen beredning",
        "Adress": "Flanaden 13",
        "PostNr": "57230",
        "PostOrt": "Oskarshamn",
        "Fastighet": "Lejonet 17",
        "StartDatum": "2025-04-01",
        "AntalKvarstAvvikelser": 4,
        "AvvikelseAnteckningar": None,
        "TillsynsDatum": "2026-01-22",
        "Bedomning": "Kvarstående avvikelser",
        "ESRI_OID": 21,
    },
    "geometry": {"x": 146747.60300000012, "y": 6349380.612},
}

# Verklig post ur MapServer/6/query. Gamla kontrollmodellens "Godtagbar",
# och en annan tätort än centralorten.
OLD_MODEL = {
    "attributes": {
        "RadId": 873,
        "AnlaggningId": "{1C6F7539-5F8A-402A-9B00-247F40F97E00}",
        "Objektsnamn": "Figeholms Bryggeri",
        "AnlaggningsNamn": "Figeholms Bryggeri",
        "Inriktning": "Egen tillverkning",
        "Adress": "Skepparegatan 14D",
        "PostNr": "57275",
        "PostOrt": "Figeholm",
        "Fastighet": "Skeppsvarvet 4",
        "StartDatum": "2017-01-19",
        "AntalKvarstAvvikelser": 0,
        "AvvikelseAnteckningar": None,
        "TillsynsDatum": "2023-08-25",
        "Bedomning": "Godtagbar",
        "ESRI_OID": 12,
    },
    "geometry": {"x": 153363, "y": 6361729},
}

# Verklig post ur MapServer/0/query. Aldrig kontrollerad.
NEVER_INSPECTED = {
    "attributes": {
        "RadId": 2384,
        "AnlaggningId": "{6DC5B162-5889-4AF4-B2FA-673890A872B6}",
        "Objektsnamn": "Pastaköket",
        "AnlaggningsNamn": "Pasta köket",
        "Inriktning": "Restaurang",
        "Adress": "Kolmilevägen 8",
        "PostNr": "57236",
        "PostOrt": "Oskarshamn",
        "Fastighet": "Bromsen 3",
        "StartDatum": "2026-05-05",
        "AntalKvarstAvvikelser": 0,
        "AvvikelseAnteckningar": None,
        "TillsynsDatum": None,
        "Bedomning": None,
        "ESRI_OID": 23,
    },
    "geometry": {"x": 146305.63609999977, "y": 6347841.9497},
}

# Verklig post ur MapServer/6/query. Någon har skrivit WGS84-grader i
# SWEREF-fältet.
BROKEN_GEOMETRY = {
    "attributes": {
        "RadId": 2686,
        "AnlaggningId": "{B5D5A784-4CA9-4BAA-AAA4-75244E8FC222}",
        "Objektsnamn": "Klintemåla vattenverk",
        "AnlaggningsNamn": "Klintemåla vattenverk",
        "Inriktning": None,
        "Adress": None,
        "PostNr": None,
        "PostOrt": None,
        "Fastighet": "Hökhult 2:3",
        "StartDatum": "2025-11-03",
        "AntalKvarstAvvikelser": 0,
        "AvvikelseAnteckningar": None,
        "TillsynsDatum": "2026-04-21",
        "Bedomning": "Inga avvikelser",
        "ESRI_OID": 46,
    },
    "geometry": {"x": 16, "y": 57},
}

# Samma anläggning, verkligen publicerad i två lager (0 och 2). Notera att
# ESRI_OID skiljer sig mellan lagren medan AnlaggningId och RadId inte gör det.
IN_TWO_LAYERS = (
    {
        "attributes": {
            "RadId": 2528,
            "AnlaggningId": "{51E56D90-91E7-4455-A0C9-6E41DCBE9287}",
            "Objektsnamn": "Oskarshamns sjukhus café",
            "AnlaggningsNamn": "Café och restaurang Sjöjungfru",
            "Inriktning": "Skola/Vård - Mottagning av färdig mat, Café, Restaurang",
            "Adress": "Rösvägen 1",
            "PostNr": "57251",
            "PostOrt": "Oskarshamn",
            "Fastighet": "Lasarettet 1",
            "StartDatum": "1970-01-01",
            "AntalKvarstAvvikelser": 0,
            "AvvikelseAnteckningar": None,
            "TillsynsDatum": "2025-01-15",
            "Bedomning": "Inga avvikelser",
            "ESRI_OID": 25,
        },
        "geometry": {"x": 145335, "y": 6349241},
    },
    {
        "attributes": {
            "RadId": 2528,
            "AnlaggningId": "{51E56D90-91E7-4455-A0C9-6E41DCBE9287}",
            "Objektsnamn": "Oskarshamns sjukhus café",
            "AnlaggningsNamn": "Café och restaurang Sjöjungfru",
            "Inriktning": "Skola/Vård - Mottagning av färdig mat, Café, Restaurang",
            "Adress": "Rösvägen 1",
            "PostNr": "57251",
            "PostOrt": "Oskarshamn",
            "Fastighet": "Lasarettet 1",
            "StartDatum": "1970-01-01",
            "AntalKvarstAvvikelser": 0,
            "AvvikelseAnteckningar": None,
            "TillsynsDatum": "2025-01-15",
            "Bedomning": "Inga avvikelser",
            "ESRI_OID": 5,
        },
        "geometry": {"x": 145335, "y": 6349241},
    },
)


def variant(base=CLEAN, geometry=None, **overrides):
    return {
        "attributes": dict(base["attributes"], **overrides),
        "geometry": dict(geometry or base["geometry"]),
    }


class Establishment(unittest.TestCase):
    def test_the_outward_name_is_used_not_the_legal_person(self):
        e = normalize_establishment(CLEAN, ["Restaurang"])
        # Skylten säger "The Corner"; "Mat i Söder AB" står bara i registret.
        self.assertEqual(e.name, "The Corner")
        self.assertEqual(e.municipality_code, "0882")
        self.assertEqual(e.id_national, "F-0882-7BD05BCD-AD60-4B8E-A8DD-0B7C5B79AF33")

    def test_identity_is_the_sources_own_guid_stripped_of_braces(self):
        self.assertEqual(local_id(CLEAN["attributes"]),
                         "7BD05BCD-AD60-4B8E-A8DD-0B7C5B79AF33")

    def test_identity_survives_arcgis_renumbering(self):
        # ESRI_OID är unikt per lager, inte över tjänsten, och numreras om vid
        # ompublicering. Bär det identiteten skapar den nattliga körningen
        # dubbletter i stället för att uppdatera.
        self.assertEqual(local_id(CLEAN["attributes"]),
                         local_id(variant(ESRI_OID=99999)["attributes"]))

    def test_two_establishments_at_the_same_address_stay_apart(self):
        # "Ik Oskarshamn" ligger två gånger på Döderhultsvägen 5A med skilda
        # AnlaggningId. En hash av namn+adress, som i Jönköping, hade slagit
        # ihop dem till en verksamhet.
        one = variant(AnlaggningId="{FE8C8A48-0AEA-4CEC-B80E-4FF202589166}",
                      Objektsnamn="Ik Oskarshamn ", Adress="Döderhultsvägen 5A")
        two = variant(AnlaggningId="{592F8C6B-A80F-4796-A9D8-99783D65E342}",
                      Objektsnamn="Ik Oskarshamn ", Adress="Döderhultsvägen 5A")
        self.assertNotEqual(local_id(one["attributes"]), local_id(two["attributes"]))

    def test_missing_guid_raises_instead_of_producing_a_nameless_id(self):
        with self.assertRaises(UnknownSourceValue):
            local_id(variant(AnlaggningId=None)["attributes"])

    def test_coordinates_use_the_local_zone_16_30(self):
        e = normalize_establishment(CLEAN, ["Restaurang"])
        # Facit är serverns egen omprojicering av samma punkt: hämtar man
        # lagret med outSR=4326 svarar den 57.26611998611168,
        # 16.44812698837961. Med rikszonen TM hamnar punkten i stället
        # utanför Danmarks kust.
        self.assertAlmostEqual(e.lat, 57.266120, places=5)
        self.assertAlmostEqual(e.lng, 16.448127, places=5)

    def test_coordinates_outside_sweden_are_dropped(self):
        e = normalize_establishment(BROKEN_GEOMETRY, ["Övrigt"])
        self.assertIsNone(e.lat)
        self.assertIsNone(e.lng)
        # Verksamheten finns kvar — bara kartnålen faller bort.
        self.assertEqual(e.name, "Klintemåla vattenverk")

    def test_inriktning_is_split_into_separate_types(self):
        e = normalize_establishment(CLEAN, ["Restaurang"])
        # Lagrets rubrik "Restaurang" upprepar Inriktningens första värde och
        # ska inte visas två gånger.
        self.assertEqual(
            e.types, ["Restaurang", "Transportör", "Utleverans av mat"]
        )

    def test_empty_inriktning_falls_back_to_the_layer(self):
        e = normalize_establishment(BROKEN_GEOMETRY, ["Övrigt"])
        self.assertEqual(e.types, ["Övrigt"])

    def test_central_ort_is_not_repeated_after_the_address(self):
        # Sidan skriver ut kommunens namn efter adressen. Läggs orten till
        # här också blir resultatet "Flanaden 13, Oskarshamn, Oskarshamn".
        e = normalize_establishment(DEVIATIONS, ["Butik"])
        self.assertEqual(e.street_address, "Flanaden 13")

    def test_other_orter_are_kept_because_they_add_information(self):
        e = normalize_establishment(OLD_MODEL, ["Övrigt"])
        self.assertEqual(e.street_address, "Skepparegatan 14D, Figeholm")

    def test_missing_address_is_none_not_an_empty_string(self):
        e = normalize_establishment(BROKEN_GEOMETRY, ["Övrigt"])
        self.assertIsNone(e.street_address)

    def test_stray_whitespace_in_the_source_is_cleaned(self):
        e = normalize_establishment(CLEAN, ["Restaurang"])
        # Källan skriver "Knartorp Smerum " med avslutande blanksteg.
        self.assertEqual(e.street_address, "Knartorp Smerum")


class MergeLayers(unittest.TestCase):
    """En anläggning kan publiceras i två lager. Den ska bli en, inte två."""

    def test_the_same_guid_in_two_layers_becomes_one_record(self):
        merged = merge_layers(
            [(IN_TWO_LAYERS[0], "Restaurang"), (IN_TWO_LAYERS[1], "Café och bageri")]
        )
        self.assertEqual(len(merged), 1)

    def test_both_categories_are_kept(self):
        merged = merge_layers(
            [(IN_TWO_LAYERS[0], "Restaurang"), (IN_TWO_LAYERS[1], "Café och bageri")]
        )
        feature, categories = merged[0]
        self.assertEqual(categories, ["Restaurang", "Café och bageri"])
        e = normalize_establishment(feature, categories)
        # Inriktningens tre värden först, sedan lagrens rubriker — utan att
        # "Café" och "Restaurang" upprepas.
        self.assertEqual(
            e.types,
            [
                "Skola/Vård - Mottagning av färdig mat",
                "Café",
                "Restaurang",
                "Café och bageri",
            ],
        )

    def test_distinct_establishments_are_left_alone(self):
        merged = merge_layers([(CLEAN, "Restaurang"), (DEVIATIONS, "Butik")])
        self.assertEqual(len(merged), 2)
        self.assertEqual([c for _, c in merged], [["Restaurang"], ["Butik"]])


class Inspections(unittest.TestCase):
    def parse(self, feature):
        return normalize_inspections(feature, "F-0882-test")

    def test_no_remarks_maps_to_clean(self):
        got = self.parse(CLEAN)
        self.assertEqual(len(got), 1)
        self.assertEqual(got[0].assessment, NO_REMARKS)
        self.assertEqual(got[0].inspected_at, date(2025, 6, 9))
        self.assertEqual(got[0].type, ROUTINE)

    def test_godtagbar_means_approved_not_a_remark(self):
        # Samma betydelse som i Linköping: motsatsen till "Ej godtagbar".
        # Belagt tre gånger om — lagrets renderer grupperar "Godtagbar" med
        # "Inga avvikelser", kommunen beskriver båda som blå symbol, och alla
        # sju förekomster har AntalKvarstAvvikelser = 0.
        got = self.parse(OLD_MODEL)
        self.assertEqual(got[0].assessment, NO_REMARKS)

    def test_kvarstaende_maps_to_minor_not_major(self):
        # Ordet "kvarstående" betyder här "öppen avvikelse", inte Linköpings
        # "överlevde en uppföljning". Skulle adaptern sätta MAJOR fick
        # Oskarshamn 27 % allvarliga mot Linköpings 1 %, och jämförbarheten
        # föll. Allvarsgraden härleds av grading.py ur mönstret — aldrig här.
        got = self.parse(DEVIATIONS)
        self.assertEqual(got[0].assessment, MINOR_REMARKS)

    def test_the_old_models_failing_grade_maps_to_major(self):
        # Förekommer inte i dagens data men finns i lagrets renderer, och
        # betyder samma sak som Linköpings "Ej godtagbar": underkänd.
        self.assertEqual(ASSESSMENT_MAP["Ej godtagbar"], MAJOR_REMARKS)

    def test_missing_assessment_is_never_treated_as_approved(self):
        # 25 av 241 rader har Bedomning = null och saknar TillsynsDatum. De är
        # ALDRIG KONTROLLERADE. Tolkas de som gröna publicerar vi ett
        # godkännande ingen myndighet har utfärdat.
        self.assertEqual(self.parse(NEVER_INSPECTED), [])

    def test_a_date_without_an_assessment_also_gives_nothing(self):
        self.assertEqual(self.parse(variant(Bedomning=None)), [])
        self.assertEqual(self.parse(variant(Bedomning="Ej bedömd")), [])

    def test_unknown_assessment_raises_instead_of_defaulting(self):
        with self.assertRaises(UnknownSourceValue):
            self.parse(variant(Bedomning="Delvis godtagbar"))

    def test_the_numeric_deviation_count_is_carried_through(self):
        # Enda källan hittills som säger HUR MÅNGA avvikelser som är öppna.
        # Måttet får inte tappas bara för att databasen saknar kolumn.
        self.assertEqual(self.parse(DEVIATIONS)[0].open_deviations, 4)
        self.assertEqual(self.parse(CLEAN)[0].open_deviations, 0)

    def test_areas_are_empty_because_the_source_has_none(self):
        # AvvikelseAnteckningar är null i samtliga 241 rader.
        self.assertEqual(self.parse(DEVIATIONS)[0].areas, [])

    def test_inspection_id_is_stable_and_carries_the_date(self):
        got = self.parse(CLEAN)[0]
        self.assertEqual(
            got.id_national,
            "I-0882-7BD05BCD-AD60-4B8E-A8DD-0B7C5B79AF33-2025-06-09",
        )
        self.assertEqual(self.parse(variant(ESRI_OID=4711))[0].id_national,
                         got.id_national)


class DeviationCount(unittest.TestCase):
    """Kommunens egen räknare är oberoende facit på etiketten."""

    def test_agreeing_count_passes(self):
        for feature in (CLEAN, DEVIATIONS, OLD_MODEL):
            check_deviation_count(feature, normalize_inspections(feature, "F-0882-t"))

    def test_remarks_without_any_counted_deviation_raises(self):
        feature = variant(DEVIATIONS, AntalKvarstAvvikelser=0)
        with self.assertRaises(UnknownSourceValue):
            check_deviation_count(feature, normalize_inspections(feature, "F-0882-t"))

    def test_clean_verdict_with_counted_deviations_raises(self):
        feature = variant(CLEAN, AntalKvarstAvvikelser=2)
        with self.assertRaises(UnknownSourceValue):
            check_deviation_count(feature, normalize_inspections(feature, "F-0882-t"))

    def test_uninspected_rows_have_nothing_to_check(self):
        # "Mäster palm enhet 2" har 2 kvarstående avvikelser men varken datum
        # eller bedömning. Utan kontrolltillfälle finns inget facit att bryta.
        feature = variant(NEVER_INSPECTED, AntalKvarstAvvikelser=2)
        check_deviation_count(feature, normalize_inspections(feature, "F-0882-t"))


class EndToEnd(unittest.TestCase):
    """Adaptern plus modellen, så att mappningen bedöms på sitt utfall."""

    def verdict(self, feature):
        inspections = normalize_inspections(feature, "F-0882-t")
        return assess(
            [
                Inspection(i.id_national, i.inspected_at, i.assessment, i.type)
                for i in inspections
            ],
            TODAY,
        )

    def test_clean_row_becomes_clean(self):
        self.assertEqual(self.verdict(CLEAN).verdict, "clean")

    def test_deviations_become_minor_because_nothing_shows_persistence(self):
        # Källan har varken föregående kontroll eller kontrolltyp, så
        # grading.py kan aldrig skärpa till "major" i Oskarshamn. Det är en
        # verklig asymmetri mot Linköping och hör hemma på metodiksidan.
        result = self.verdict(DEVIATIONS)
        self.assertEqual(result.verdict, "minor")

    def test_never_inspected_gives_no_verdict_at_all(self):
        result = self.verdict(NEVER_INSPECTED)
        self.assertIsNone(result.verdict)
        self.assertEqual(result.reason, REASON_NO_INSPECTIONS)
        self.assertFalse(result.publishable)

    def test_an_inspection_older_than_the_window_gives_no_verdict(self):
        # Kontrollen är från 2019 och faller ur färskhetsfönstret oavsett om
        # det står på tre år eller fem. Den ska bli obedömd, inte grön.
        result = self.verdict(variant(OLD_MODEL, TillsynsDatum="2019-07-17"))
        self.assertIsNone(result.verdict)
        self.assertEqual(result.reason, REASON_STALE)

    def test_the_distinction_can_never_be_earned_here(self):
        # Källan publicerar en enda kontroll per verksamhet, och utmärkelsen
        # kräver tre rena i rad.
        self.assertFalse(self.verdict(CLEAN).distinction)


class KastadeFalt(unittest.TestCase):
    """Fyra fält låg i råsvaret och kastades fram till 2026-08-25.

    Två bärs vidare till sajtens datafil (registreringsdatum och
    verksamhetsutövare) och två stannar i pipelinen (postnummer och
    fastighetsbeteckning). Se modulens inledning för avvägningen.
    """

    def test_registration_date_is_read(self):
        self.assertEqual(registration_date(CLEAN["attributes"]), date(2024, 6, 15))
        self.assertEqual(
            normalize_establishment(CLEAN, ["Restaurang"]).registered_at,
            date(2024, 6, 15),
        )

    def test_missing_registration_date_is_none(self):
        self.assertIsNone(registration_date({"StartDatum": ""}))
        self.assertIsNone(registration_date({}))

    def test_unreadable_registration_date_gives_none_instead_of_raising(self):
        # Samma avvägning som i orebro.py: strikthetsregeln skyddar värden
        # som bedömningen vilar på, och ett registreringsdatum gör inte det.
        self.assertIsNone(registration_date({"StartDatum": "vt 2024"}))

    def test_operator_is_the_legal_person_not_the_sign(self):
        # Besökaren söker på skylten, så `name` är "The Corner". Vem som
        # DRIVER stället är en egen uppgift, och den enda vi har som närmar
        # sig ett orgnr i den här kommunen.
        e = normalize_establishment(CLEAN, ["Restaurang"])
        self.assertEqual(e.name, "The Corner")
        self.assertEqual(e.operator, "Mat i Söder AB")

    def test_operator_that_only_repeats_the_sign_is_dropped(self):
        # 152 av 229 ifyllda `AnlaggningsNamn` är identiska med
        # `Objektsnamn`. Samma sträng under två rubriker ser ut som två
        # uppgifter men är en.
        self.assertIsNone(
            normalize_establishment(OLD_MODEL, ["Övrigt"]).operator
        )

    def test_operator_comparison_ignores_case(self):
        # "Coop Flanaden" och "coop Flanaden" är samma namn.
        self.assertIsNone(
            normalize_establishment(DEVIATIONS, ["Butik"]).operator
        )

    def test_postal_code_and_property_stay_on_the_dataclass(self):
        e = normalize_establishment(CLEAN, ["Restaurang"])
        self.assertEqual(e.postal_code, "57291")
        self.assertEqual(e.property_designation, "Biet 16")

    def test_missing_postal_code_and_property_are_none(self):
        e = normalize_establishment(
            variant(PostNr="", Fastighet=None), ["Restaurang"]
        )
        self.assertIsNone(e.postal_code)
        self.assertIsNone(e.property_designation)


if __name__ == "__main__":
    unittest.main(verbosity=2)
