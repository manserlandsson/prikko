"""Tester för Örebro-adaptern.

Fixturerna är verkliga svar från kommunens gränssnitt 2026-08-02, inte
påhittade.  Kör:  python3 pipeline/tests/test_orebro.py
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
from prikko.sources.orebro import (  # noqa: E402
    AREA_DEVIATION,
    AREA_FIXED,
    AREA_OK,
    AREA_PERSISTING,
    RawInspection,
    UnknownSourceValue,
    assessment_from_areas,
    merge_duplicates,
    normalize_areas,
    normalize_establishment,
    normalize_inspection,
    parse_history,
    registration_date,
    under_embargo,
)

# Verklig post ur /rest-api/foodreport/search
RAW_FACILITY = {
    "Registrerades": "2009-01-19",
    "Objektsnamn": "1 Rum Och Kök",
    "Typ": "Restaurang",
    "AnlaggningId": "d463a4c7-0e9a-4def-bcaa-a89ca91ab001",
    "Adress": "Stortorget 16",
}

# Verkligt utdrag ur verksamhetssidans inbäddade skript
HISTORY_HTML = """
<script>
// Samtliga kontroller som gjorts
const INSPECTIONS = [{
    id: 'be7bdb75-1430-4e0b-95d5-2328b49788ed',
    reason: 'Planerad kontroll',
    date: '2026-06-10',
    recent: false,
},{
    id: '6df9202f-94ee-45fe-b200-9edb3f60f663',
    reason: 'Uppföljning, planerad kontroll',
    date: '2024-05-24',
    recent: true,
}];
</script>
"""

# Verkligt svar från /rest-api/foodreport/reports/<id>
REPORTS = [
    {
        "Nr": "J09",
        "Anmarkning": "Utan avvikelse",
        "Beskrivning": "Material i kontakt med livsmedel (FCM)",
        "TillsynsDatum": "2026-06-10",
        "Kontrollomrade": "Grundförutsättningar, hygien",
        "Anmald-oanmald": "Oanmäld",
    },
    {
        "Nr": "J03",
        "Anmarkning": "Avvikelse",
        "Beskrivning": "Hygien före, under och efter processen",
        "TillsynsDatum": "2026-06-10",
        "Kontrollomrade": "Grundförutsättningar, hygien",
        "Anmald-oanmald": "Oanmäld",
    },
]

ROUTINE_ENTRY = RawInspection(
    id="be7bdb75-1430-4e0b-95d5-2328b49788ed",
    reason="Planerad kontroll",
    inspected_at=date(2026, 6, 10),
    recent=False,
)


def report(**overrides):
    return dict(REPORTS[0], **overrides)


class Establishment(unittest.TestCase):
    def test_basic_fields(self):
        e = normalize_establishment(RAW_FACILITY)
        self.assertEqual(e.name, "1 Rum Och Kök")
        self.assertEqual(e.street_address, "Stortorget 16")
        self.assertEqual(e.municipality_code, "1880")
        self.assertEqual(e.types, ["Restaurang"])

    def test_missing_coordinates_are_none(self):
        # Örebro publicerar inga koordinater alls.
        e = normalize_establishment(RAW_FACILITY)
        self.assertIsNone(e.lat)
        self.assertIsNone(e.lng)

    def test_facility_without_id_raises(self):
        with self.assertRaises(UnknownSourceValue):
            normalize_establishment(dict(RAW_FACILITY, AnlaggningId=""))


class Duplicates(unittest.TestCase):
    """Källan listar samma verksamhet en gång per registrerad typ.

    Verkligt fall: "Tant Gredelin" på Kungsgatan 48A förekommer två gånger
    med identiskt AnlaggningId — en gång som Café, en gång som Butik.
    """

    PAIR = [
        dict(RAW_FACILITY, Objektsnamn="Tant Gredelin", Typ="Café",
             AnlaggningId="2109884c-3642-44dd-8089-4dcc548c03e4"),
        dict(RAW_FACILITY, Objektsnamn="Tant Gredelin", Typ="Butik",
             AnlaggningId="2109884c-3642-44dd-8089-4dcc548c03e4"),
    ]

    def test_same_id_becomes_one_establishment(self):
        self.assertEqual(len(merge_duplicates(self.PAIR)), 1)

    def test_types_are_unioned_rather_than_dropped(self):
        # Verksamheten ÄR både café och butik. Att kasta den ena vore att
        # tappa information källan faktiskt ger.
        merged = merge_duplicates(self.PAIR)
        e = normalize_establishment(merged[0])
        self.assertEqual(e.types, ["Café", "Butik"])

    def test_distinct_facilities_are_left_alone(self):
        self.assertEqual(len(merge_duplicates([RAW_FACILITY, self.PAIR[0]])), 2)

    def test_single_facility_still_gets_its_type(self):
        e = normalize_establishment(merge_duplicates([RAW_FACILITY])[0])
        self.assertEqual(e.types, ["Restaurang"])


class History(unittest.TestCase):
    def test_embedded_javascript_history_is_parsed(self):
        got = parse_history(HISTORY_HTML)
        self.assertEqual(len(got), 2)
        self.assertEqual(got[0].id, "be7bdb75-1430-4e0b-95d5-2328b49788ed")
        self.assertEqual(got[0].inspected_at, date(2026, 6, 10))
        self.assertFalse(got[0].recent)
        self.assertTrue(got[1].recent)

    def test_unparseable_page_gives_nothing_rather_than_half(self):
        # Ändrar kommunen formatet vill vi ha noll träffar, som syns i
        # statistiken — inte halva historiken, som inte syns alls.
        self.assertEqual(parse_history("<script>const INSPECTIONS = [];</script>"), [])


class Embargo(unittest.TestCase):
    """Kommunen håller inne resultatet i 30 dagar så verksamheten hinner
    yttra sig. Går vi förbi den spärren publicerar vi anklagelser innan den
    berörda fått svara — hela skälet till att fördröjningen finns."""

    TODAY = date(2026, 8, 2)

    def test_recent_flag_from_the_source_is_honoured(self):
        entry = RawInspection("x", "Planerad kontroll", date(2020, 1, 1), recent=True)
        self.assertTrue(under_embargo(entry, self.TODAY))

    def test_inspection_within_thirty_days_is_held_back(self):
        entry = RawInspection("x", "Planerad kontroll", date(2026, 7, 20), recent=False)
        self.assertTrue(under_embargo(entry, self.TODAY))

    def test_older_inspection_is_published(self):
        entry = RawInspection("x", "Planerad kontroll", date(2026, 6, 10), recent=False)
        self.assertFalse(under_embargo(entry, self.TODAY))

    def test_boundary_is_exactly_thirty_days(self):
        self.assertFalse(
            under_embargo(
                RawInspection("x", "Planerad kontroll", date(2026, 7, 3), recent=False),
                self.TODAY,
            )
        )
        self.assertTrue(
            under_embargo(
                RawInspection("x", "Planerad kontroll", date(2026, 7, 4), recent=False),
                self.TODAY,
            )
        )


class Areas(unittest.TestCase):
    def test_every_documented_remark_maps(self):
        cases = {
            "Utan avvikelse": AREA_OK,
            "Åtgärdad": AREA_FIXED,
            "Avskriven": AREA_FIXED,
            "Avvikelse": AREA_DEVIATION,
            "Kvarstår": AREA_PERSISTING,
        }
        for remark, expected in cases.items():
            got = normalize_areas([report(Anmarkning=remark)], "F-1880-test")
            self.assertEqual(got[0].status, expected, remark)

    def test_unknown_remark_raises_instead_of_defaulting(self):
        with self.assertRaises(UnknownSourceValue):
            normalize_areas([report(Anmarkning="Nytt värde")], "F-1880-test")

    def test_code_and_group_are_kept(self):
        got = normalize_areas(REPORTS, "F-1880-test")
        self.assertEqual(got[0].code, "J09")
        self.assertEqual(got[0].group, "Grundförutsättningar, hygien")
        self.assertEqual(got[0].description, "Material i kontakt med livsmedel (FCM)")


class Assessment(unittest.TestCase):
    """Örebro publicerar inget helhetsomdöme per kontroll — det härleds."""

    def derive(self, *remarks):
        areas = normalize_areas([report(Anmarkning=r) for r in remarks], "F-1880-test")
        return assessment_from_areas(areas)

    def test_all_clean_gives_no_remarks(self):
        self.assertEqual(self.derive("Utan avvikelse", "Utan avvikelse"), NO_REMARKS)

    def test_deviation_gives_minor(self):
        self.assertEqual(self.derive("Utan avvikelse", "Avvikelse"), MINOR_REMARKS)

    def test_persisting_gives_major_and_outranks_deviation(self):
        self.assertEqual(self.derive("Avvikelse", "Kvarstår"), MAJOR_REMARKS)

    def test_fixed_deviations_do_not_count_as_remarks(self):
        # Att räkna "Åtgärdad" som brist vore att straffa en verksamhet för
        # att den rättat till något.
        self.assertEqual(self.derive("Åtgärdad", "Avskriven"), NO_REMARKS)


class Inspections(unittest.TestCase):
    def test_reason_keywords_cover_the_combined_strings(self):
        cases = {
            "Planerad kontroll": ROUTINE,
            "Uppföljning": FOLLOWUP,
            "Uppföljning, planerad kontroll": FOLLOWUP,
            "Händelsestyrd kontroll": COMPLAINT,
        }
        for reason, expected in cases.items():
            entry = RawInspection("x", reason, date(2026, 6, 10), recent=False)
            got = normalize_inspection(entry, REPORTS, "F-1880-test")
            self.assertEqual(got.type, expected, reason)

    def test_unknown_reason_raises_instead_of_defaulting(self):
        entry = RawInspection("x", "Rymdkontroll", date(2026, 6, 10), recent=False)
        with self.assertRaises(UnknownSourceValue):
            normalize_inspection(entry, REPORTS, "F-1880-test")

    def test_inspection_without_points_is_dropped_not_assumed_clean(self):
        # Utan punkter finns inget utfall att redovisa. Att anta "inga
        # anmärkningar" vore att hitta på ett godkännande kommunen inte gett.
        self.assertIsNone(normalize_inspection(ROUTINE_ENTRY, [], "F-1880-test"))

    def test_prenotified_is_read_from_the_source(self):
        got = normalize_inspection(ROUTINE_ENTRY, REPORTS, "F-1880-test")
        self.assertIs(got.prenotified, False)

        announced = [report(**{"Anmald-oanmald": "Föranmäld"})]
        self.assertIs(
            normalize_inspection(ROUTINE_ENTRY, announced, "F-1880-test").prenotified, True
        )

        unknown = [report(**{"Anmald-oanmald": ""})]
        self.assertIsNone(
            normalize_inspection(ROUTINE_ENTRY, unknown, "F-1880-test").prenotified
        )

    def test_inspection_id_uses_the_sources_own_guid(self):
        got = normalize_inspection(ROUTINE_ENTRY, REPORTS, "F-1880-test")
        self.assertEqual(got.id_national, "I-1880-be7bdb75-1430-4e0b-95d5-2328b49788ed")

    def test_both_clean_and_deviating_points_are_kept(self):
        # Till skillnad från Stockholm redovisar Örebro hela den granskade
        # ytan. Att filtrera bort de godkända punkterna vore att kasta det
        # som gör källan bättre än de andra.
        got = normalize_inspection(ROUTINE_ENTRY, REPORTS, "F-1880-test")
        self.assertEqual(len(got.areas), 2)
        self.assertEqual({a.status for a in got.areas}, {AREA_OK, AREA_DEVIATION})


class Registreringsdatum(unittest.TestCase):
    """`Registrerades` låg i råsvaret och kastades fram till 2026-08-25.

    Ifyllt i 1 233 av 1 233 poster, och kommunen visar det själv på
    verksamhetssidan. Noll extra anrop.
    """

    def test_date_is_read_from_the_search_response(self):
        self.assertEqual(registration_date(RAW_FACILITY), date(2009, 1, 19))

    def test_it_reaches_the_establishment(self):
        e = normalize_establishment(RAW_FACILITY)
        self.assertEqual(e.registered_at, date(2009, 1, 19))

    def test_missing_value_is_none(self):
        self.assertIsNone(registration_date({"Registrerades": ""}))
        self.assertIsNone(registration_date({}))

    def test_unreadable_value_gives_none_instead_of_raising(self):
        # Strikthetsregeln skyddar värden som BEDÖMNINGEN vilar på. Ett
        # registreringsdatum gör inte det, och att fälla en verksamhet ur
        # beståndet för en datumsträng vore en dyrare rättelse än felet.
        # Täckningen räknas i stället av fetch_orebro.py.
        self.assertIsNone(registration_date({"Registrerades": "januari 2009"}))

    def test_timestamp_is_truncated_to_the_day(self):
        got = registration_date({"Registrerades": "2009-01-19T08:30:00"})
        self.assertEqual(got, date(2009, 1, 19))

    def test_merge_keeps_the_date(self):
        # Sammanslagningen av dubbletter får inte tappa fältet.
        merged = merge_duplicates([dict(RAW_FACILITY), dict(RAW_FACILITY)])
        self.assertEqual(
            normalize_establishment(merged[0]).registered_at, date(2009, 1, 19)
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
