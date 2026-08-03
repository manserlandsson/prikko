"""Tester för Borgholms-adaptern.

Fixturerna är verkliga textlöpor ur kommunens tabell
`Kontrollresultat2025_v42.pdf`, utvunna 2026-08-03 med `prikko.pdf`. Sida, x
och y är oförändrade, och att en cell bryts mitt i ett ord ("uppfylland" plus
"e av ") är källans radbrytning, inte vår.

Kör:  python3 pipeline/tests/test_borgholm.py
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
    REASON_NO_INSPECTIONS,
    REASON_STALE,
    ROUTINE,
    Inspection,
    assess,
)
from prikko.pdf import Block  # noqa: E402
from prikko.sources.borgholm import (  # noqa: E402
    Row,
    UnknownSourceValue,
    assessment_of,
    find_pdf_url,
    group_rows,
    local_id,
    normalize_establishment,
    normalize_inspections,
    parse_areas,
    parse_table,
    partition_rows,
)

TODAY = date(2026, 8, 3)

# Verkliga textlöpor ur tabellens första sida: rubrikraden, en rad vars namn
# bryts över två löpor, en rad utan Ort och Typ (kommunen skriver dem bara när
# de ändras) och en EA-rad.
HEADER_AND_ROWS = [
    Block(0, 52.9, 479.3, "Ort"),
    Block(0, 126.3, 479.3, "Typ"),
    Block(0, 189.1, 479.3, "Namn"),
    Block(0, 306.8, 479.2, "Datum"),
    Block(0, 384.2, 479.2, "Kontrollorsak"),
    Block(0, 458.4, 479.2, "Avvikelse"),
    Block(0, 64.1, 450.2, "Borgholm"),
    Block(0, 137.4, 450.2, "B & B"),
    Block(0, 200.3, 450.2, "Gamla Televerket "),
    Block(0, 317.9, 450.2, "2024-08-06"),
    Block(0, 395.4, 450.2, "Planerad"),
    Block(0, 458.4, 450.2, "0"),
    Block(0, 200.3, 435.6, "B&B"),
    Block(0, 199.2, 421.1, "Gård Halltorps Hage"),
    Block(0, 316.9, 421.1, "2024-07-10"),
    Block(0, 394.3, 421.1, "Planerad"),
    Block(0, 458.4, 421.1, "0"),
    Block(0, 200.3, 406.6, "Segelfartyget Libelle"),
    Block(0, 317.9, 406.6, "EA"),
    Block(0, 395.4, 406.6, "EA"),
    Block(0, 458.4, 406.6, "0"),
]

# Verkliga löpor: en avvikelsekod som bryts över åtta rader inuti cellen.
WRAPPED_DEVIATION = [
    Block(0, 64.1, 217.0, "Borgholm"),
    Block(0, 137.4, 217.0, "Butik"),
    Block(0, 200.3, 217.0, "Arnolds Delikatesser"),
    Block(0, 317.9, 217.0, "2024-07-01"),
    Block(0, 395.4, 217.0, "Planerad"),
    Block(0, 458.4, 217.0, "J08 – "),
    Block(0, 458.4, 203.3, "Upprätthåll"),
    Block(0, 458.4, 188.8, "ande av "),
    Block(0, 458.4, 174.2, "kylkedjan "),
    Block(0, 458.4, 159.7, "och "),
    Block(0, 458.4, 145.2, "uppfylland"),
    Block(0, 458.4, 130.7, "e av "),
    Block(0, 458.4, 116.2, "temperatur"),
    Block(0, 458.4, 101.6, "kriterier"),
]

# Verklig rad där kontrollorsak och avvikelse bär två poster staplade: en
# planerad kontroll som fann J02, och en uppföljning som inte fann något.
STACKED = [
    Block(3, 64.1, 776.1, "Borgholm"),
    Block(3, 137.4, 776.1, "Servering "),
    Block(3, 200.3, 776.1, "Borgholms Elevbistro"),
    Block(3, 317.9, 776.1, "2024-03-14"),
    Block(3, 395.4, 776.1, "Planerad"),
    Block(3, 458.4, 776.1, "J02 – "),
    Block(3, 458.4, 761.6, "Utformning "),
    Block(3, 458.4, 747.1, "och "),
    Block(3, 458.4, 732.6, "underhåll "),
    Block(3, 458.4, 718.1, "av lokaler "),
    Block(3, 458.4, 703.5, "och "),
    Block(3, 458.4, 689.0, "utrustning"),
    Block(3, 395.4, 674.5, "Uppföljning "),
    Block(3, 458.4, 674.5, "0"),
    Block(3, 395.4, 660.0, "avvikelser "),
    Block(3, 395.4, 645.4, "utan id"),
]

PAGE = (
    '<div class="entry-content"><p>Tabell över utförda livsmedelskontroller</p>'
    '<a href="https://www.borgholm.se/wp-content/uploads/2025/07/'
    'Kontrollresultat2025_v42.pdf">Kontrollresultat 2025</a></div>'
)


def row(namn="Testet", ort="Borgholm", typ="Servering", datum="2025-05-05",
        orsak="Planerad", avvikelser=("0",)):
    return Row(ort=ort, typ=typ, namn=namn, datum=datum, orsak=orsak,
               avvikelser=list(avvikelser))


class PdfLink(unittest.TestCase):
    def test_the_versioned_link_is_scraped_from_the_page(self):
        # Filnamnet bär ett versionsnummer och ligger under ÅÅÅÅ/MM. Adressen
        # byts vid varje uppdatering och får aldrig hårdkodas.
        self.assertTrue(find_pdf_url(PAGE).endswith("Kontrollresultat2025_v42.pdf"))

    def test_a_page_without_the_table_stops_the_run(self):
        with self.assertRaises(UnknownSourceValue):
            find_pdf_url("<p>Sidan är under uppdatering</p>")


class ParseTable(unittest.TestCase):
    def test_the_columns_are_read_from_the_x_positions(self):
        rows = parse_table(HEADER_AND_ROWS)
        self.assertEqual(rows[0].namn, "Gamla Televerket B&B")
        self.assertEqual(rows[0].typ, "B & B")
        self.assertEqual(rows[0].datum, "2024-08-06")
        self.assertEqual(rows[0].avvikelser, ["0"])

    def test_the_header_row_is_not_data(self):
        self.assertEqual(len(parse_table(HEADER_AND_ROWS)), 3)

    def test_a_cell_broken_mid_word_is_joined_without_a_space(self):
        # "Gamla Televerket " slutar med blanksteg, "B&B" börjar utan. Regeln
        # är källans egen, inte en gissning.
        self.assertEqual(parse_table(HEADER_AND_ROWS)[0].namn, "Gamla Televerket B&B")
        self.assertEqual(
            parse_table(WRAPPED_DEVIATION)[0].avvikelser,
            ["J08 – Upprätthållande av kylkedjan och uppfyllande av "
             "temperaturkriterier"],
        )

    def test_ort_and_typ_are_carried_down_because_the_source_only_writes_changes(self):
        rows = parse_table(HEADER_AND_ROWS)
        self.assertEqual([r.ort for r in rows], ["Borgholm"] * 3)
        self.assertEqual([r.typ for r in rows], ["B & B"] * 3)

    def test_two_stacked_entries_in_one_row_are_kept_apart(self):
        rows = parse_table(STACKED)
        self.assertEqual(len(rows), 1)
        self.assertEqual(
            rows[0].avvikelser,
            ["J02 – Utformning och underhåll av lokaler och utrustning", "0"],
        )
        self.assertIn("Uppföljning", rows[0].orsak)

    def test_a_document_without_the_table_stops_the_run(self):
        with self.assertRaises(UnknownSourceValue):
            parse_table([Block(0, 900.0, 500.0, "Något helt annat")])


class Result(unittest.TestCase):
    def test_a_zero_means_no_deviations(self):
        self.assertEqual(assessment_of(["0"]), NO_REMARKS)

    def test_a_code_means_a_remark(self):
        self.assertEqual(assessment_of(["J03 – Hygien före, under och efter processen"]),
                         MINOR_REMARKS)

    def test_the_last_entry_is_the_latest_known_state(self):
        # Planerad kontroll fann J02, uppföljningen fann inget. Samma sak som
        # Uppsalas "Avvikelse åtgärdad", och samma utfall.
        entries = ["J02 – Utformning och underhåll av lokaler och utrustning", "0"]
        self.assertEqual(assessment_of(entries), NO_REMARKS)
        self.assertEqual([a.status for a in parse_areas(entries)], ["fixed"])

    def test_several_codes_in_one_control_are_all_deviations(self):
        entries = [
            "B02 – Obligatorisk livsmedelsinformation, innehåll och presentation",
            "J03 – Hygien före, under och efter processen",
        ]
        self.assertEqual(assessment_of(entries), MINOR_REMARKS)
        areas = parse_areas(entries)
        self.assertEqual([a.code for a in areas], ["B02", "J03"])
        self.assertEqual({a.status for a in areas}, {"deviation"})

    def test_the_livsmedelsverket_code_is_kept_apart_from_the_area_name(self):
        # Koden är samma bokstavsindelning som sajtens LEGISLATION_AREAS.
        area = parse_areas(["J08 – Upprätthållande av kylkedjan och uppfyllande "
                            "av temperaturkriterier"])[0]
        self.assertEqual(area.code, "J08")
        self.assertEqual(area.group, "Upprätthållande av kylkedjan och uppfyllande "
                                     "av temperaturkriterier")

    def test_an_unknown_entry_raises_instead_of_being_dropped(self):
        with self.assertRaises(UnknownSourceValue):
            parse_areas(["Allvarlig brist"])

    def test_an_empty_column_raises(self):
        with self.assertRaises(UnknownSourceValue):
            assessment_of([])


class Rows(unittest.TestCase):
    def test_ea_means_no_control_was_performed_not_a_clean_one(self):
        # Kommunens läsanvisning: "EA står för 'ej aktuell' och innebär att
        # ingen kontroll har utförts det senaste året." Avvikelsekolumnen står
        # ändå på 0, men en nolla utan kontroll är inget godkännande.
        got = normalize_inspections([row(datum="EA", orsak="EA")], "F-0885-t")
        self.assertEqual(got, [])

    def test_a_planned_control_is_routine(self):
        self.assertEqual(normalize_inspections([row()], "F-0885-t")[0].type, ROUTINE)

    def test_a_row_that_mentions_a_follow_up_is_a_follow_up(self):
        # Kolumnen bär flera orsaker, ibland utan avskiljare.
        for orsak in ("Uppföljande", "PlaneradUppföljning avvikelser utan id",
                      "Planerad, Uppföljande"):
            self.assertEqual(
                normalize_inspections([row(orsak=orsak)], "F-0885-t")[0].type,
                FOLLOWUP,
                orsak,
            )

    def test_a_complaint_driven_control_is_read(self):
        self.assertEqual(
            normalize_inspections([row(orsak="Händelsestyrd")], "F-0885-t")[0].type,
            COMPLAINT,
        )

    def test_an_unknown_reason_raises(self):
        with self.assertRaises(UnknownSourceValue):
            normalize_inspections([row(orsak="Revision")], "F-0885-t")

    def test_a_broken_date_costs_the_row_and_not_the_establishment(self):
        # "Arnolds Delikatesser" har tre rader, varav en fått datumet utskrivet
        # som kalkylbladstalet 45474.
        rows = [row(datum="2024-07-01"), row(datum="45474"), row(datum="2025-02-13")]
        readable, broken = partition_rows(rows)
        self.assertEqual(len(readable), 2)
        self.assertEqual([r.datum for r in broken], ["45474"])

    def test_ea_rows_count_as_readable_because_they_carry_information(self):
        readable, broken = partition_rows([row(datum="EA", orsak="EA")])
        self.assertEqual((len(readable), len(broken)), (1, 0))

    def test_two_rows_from_the_same_day_become_one_inspection(self):
        got = normalize_inspections(
            [row(datum="2025-05-05", avvikelser=("0",)),
             row(datum="2025-05-05",
                 avvikelser=("J03 – Hygien före, under och efter processen",))],
            "F-0885-t",
        )
        self.assertEqual(len(got), 1)
        # Sämsta utfallet vinner, samma regel som i Linköping.
        self.assertEqual(got[0].assessment, MINOR_REMARKS)


class Identity(unittest.TestCase):
    def test_rows_for_the_same_establishment_become_one_record(self):
        # 94 verksamheter har mer än en kontroll. Tabellen skriver namnet en
        # gång och datumen under varandra.
        grouped = group_rows([row(datum="2024-07-01"), row(datum="2025-02-13"),
                              row(namn="Annan")])
        self.assertEqual(len(grouped), 2)
        self.assertEqual(len(grouped[0][1]), 2)

    def test_the_same_name_in_two_orter_stays_apart(self):
        self.assertNotEqual(local_id("Kiosken", "Borgholm"), local_id("Kiosken", "Böda"))

    def test_a_nameless_row_raises(self):
        with self.assertRaises(UnknownSourceValue):
            local_id("  ", "Borgholm")


class Establishment(unittest.TestCase):
    def test_the_central_ort_is_not_repeated_after_the_name(self):
        self.assertIsNone(normalize_establishment(row()).street_address)

    def test_other_orter_are_kept_because_they_add_information(self):
        self.assertEqual(normalize_establishment(row(ort="Byxelkrok")).street_address,
                         "Byxelkrok")

    def test_the_source_marker_for_a_missing_ort_is_not_shown_as_a_place(self):
        # 14 rader har ortkolumnen ifylld med texten "(tom)".
        rows = parse_table([
            Block(0, 64.1, 450.2, "(tom)"),
            Block(0, 137.4, 450.2, "Servering"),
            Block(0, 200.3, 450.2, "Okänd plats"),
            Block(0, 317.9, 450.2, "2025-05-05"),
            Block(0, 395.4, 450.2, "Planerad"),
            Block(0, 458.4, 450.2, "0"),
        ])
        self.assertIsNone(rows[0].ort)
        self.assertIsNone(normalize_establishment(rows[0]).street_address)

    def test_no_coordinates_are_invented(self):
        e = normalize_establishment(row())
        self.assertIsNone(e.lat)
        self.assertIsNone(e.lng)


class EndToEnd(unittest.TestCase):
    """Adaptern plus modellen, så att mappningen bedöms på sitt utfall."""

    def verdict(self, rows):
        inspections = normalize_inspections(rows, "F-0885-t")
        return assess(
            [
                Inspection(i.id_national, i.inspected_at, i.assessment, i.type)
                for i in inspections
            ],
            TODAY,
        )

    def test_a_clean_row_becomes_clean(self):
        self.assertEqual(self.verdict([row()]).verdict, "clean")

    def test_a_deviation_becomes_minor(self):
        got = self.verdict([row(avvikelser=("J03 – Hygien före, under och efter "
                                            "processen",))])
        self.assertEqual(got.verdict, "minor")

    def test_a_follow_up_that_still_finds_a_deviation_becomes_major(self):
        # Kommunen anger uppföljning som egen kontrollorsak. En uppföljning
        # som ändå slutar på en kod beskriver en brist som överlevt
        # återbesöket.
        got = self.verdict([row(orsak="Planerad, Uppföljande",
                                avvikelser=("J02 – Utformning och underhåll av "
                                            "lokaler och utrustning",
                                            "J03 – Hygien före, under och efter "
                                            "processen"))])
        self.assertEqual(got.verdict, "major")

    def test_a_follow_up_that_finds_nothing_becomes_clean(self):
        got = self.verdict([row(orsak="PlaneradUppföljning avvikelser utan id",
                                avvikelser=("J02 – Utformning och underhåll av "
                                            "lokaler och utrustning", "0"))])
        self.assertEqual(got.verdict, "clean")

    def test_an_establishment_with_only_ea_rows_gets_no_verdict(self):
        # 101 av 406 verksamheter står bara med EA.
        result = self.verdict([row(datum="EA", orsak="EA")])
        self.assertIsNone(result.verdict)
        self.assertEqual(result.reason, REASON_NO_INSPECTIONS)
        self.assertFalse(result.publishable)

    def test_an_inspection_older_than_the_window_gives_no_verdict(self):
        result = self.verdict([row(datum="2021-05-05")])
        self.assertIsNone(result.verdict)
        self.assertEqual(result.reason, REASON_STALE)

    def test_the_distinction_needs_three_clean_controls(self):
        result = self.verdict([row(datum="2024-01-12"), row(datum="2024-09-01"),
                               row(datum="2025-05-05")])
        self.assertTrue(result.distinction)


if __name__ == "__main__":
    unittest.main(verbosity=2)
