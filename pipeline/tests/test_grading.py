"""Golden tests för betygsmodellen.

Modellen publicerar omdömen om namngivna verksamheter. Varje regel i trappan
ska därför ha ett test som går att peka på — både för vår egen skull och för
att kunna visa exakt hur ett betyg räknades fram om någon ifrågasätter det.

Körs utan beroenden:  python3 -m unittest discover pipeline/tests
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
    MODEL_VERSION,
    NO_REMARKS,
    REASON_NO_INSPECTIONS,
    REASON_STALE,
    ROUTINE,
    Inspection,
    calculate_grade,
)

TODAY = date(2026, 8, 2)


def insp(days_ago: int, assessment: int, type_: int = ROUTINE, ident: str = None):
    """Kontroll för N dagar sedan, räknat från TODAY."""
    d = date.fromordinal(TODAY.toordinal() - days_ago)
    return Inspection(
        id_national=ident or f"I-1280-{days_ago}",
        inspected_at=d,
        assessment=assessment,
        type=type_,
    )


class GradeLadder(unittest.TestCase):
    """De fem stegen i trappan."""

    def test_clean_latest_and_clean_history_gives_a(self):
        result = calculate_grade(
            [insp(30, NO_REMARKS), insp(400, NO_REMARKS)], TODAY
        )
        self.assertEqual(result.grade, "A")

    def test_clean_latest_but_blemished_history_gives_b(self):
        result = calculate_grade(
            [insp(30, NO_REMARKS), insp(400, MINOR_REMARKS)], TODAY
        )
        self.assertEqual(result.grade, "B")

    def test_minor_remarks_with_clean_history_gives_c(self):
        result = calculate_grade(
            [insp(30, MINOR_REMARKS), insp(400, NO_REMARKS)], TODAY
        )
        self.assertEqual(result.grade, "C")

    def test_minor_remarks_with_blemished_history_gives_d(self):
        result = calculate_grade(
            [insp(30, MINOR_REMARKS), insp(400, MINOR_REMARKS)], TODAY
        )
        self.assertEqual(result.grade, "D")

    def test_major_remarks_always_gives_e(self):
        result = calculate_grade(
            [insp(30, MAJOR_REMARKS), insp(400, NO_REMARKS)], TODAY
        )
        self.assertEqual(result.grade, "E")

    def test_major_remarks_cannot_be_softened_by_spotless_history(self):
        """Nuläget är det relevanta för någon som står utanför dörren."""
        result = calculate_grade(
            [
                insp(10, MAJOR_REMARKS),
                insp(300, NO_REMARKS),
                insp(600, NO_REMARKS),
            ],
            TODAY,
        )
        self.assertEqual(result.grade, "E")


class Recency(unittest.TestCase):
    """Senaste kontrollen avgör — inte den värsta, inte den senast inlagda."""

    def test_latest_inspection_decides_regardless_of_input_order(self):
        clean_recent = insp(10, NO_REMARKS, ident="I-ny")
        bad_old = insp(500, MAJOR_REMARKS, ident="I-gammal")

        forwards = calculate_grade([clean_recent, bad_old], TODAY)
        backwards = calculate_grade([bad_old, clean_recent], TODAY)

        self.assertEqual(forwards.grade, backwards.grade)
        self.assertEqual(forwards.grade, "B")
        self.assertEqual(forwards.based_on[0], "I-ny")

    def test_clean_followup_after_major_lifts_to_b_not_a(self):
        """Åtgärdat ska belönas — men inte som om inget hänt."""
        result = calculate_grade(
            [
                insp(20, NO_REMARKS, type_=FOLLOWUP),
                insp(60, MAJOR_REMARKS),
            ],
            TODAY,
        )
        self.assertEqual(result.grade, "B")

    def test_only_three_most_recent_count(self):
        """En fjärde, äldre anmärkning ska inte längre dra ner betyget."""
        result = calculate_grade(
            [
                insp(10, NO_REMARKS),
                insp(200, NO_REMARKS),
                insp(400, NO_REMARKS),
                insp(600, MAJOR_REMARKS),
            ],
            TODAY,
        )
        self.assertEqual(result.grade, "A")
        self.assertEqual(len(result.based_on), 3)


class InsufficientEvidence(unittest.TestCase):
    """Vi vägrar gissa. Inget betyg är ett giltigt utfall."""

    def test_no_inspections_at_all(self):
        result = calculate_grade([], TODAY)
        self.assertIsNone(result.grade)
        self.assertEqual(result.reason, REASON_NO_INSPECTIONS)
        self.assertFalse(result.publishable)

    def test_inspections_older_than_three_years_do_not_grade(self):
        result = calculate_grade([insp(1200, MAJOR_REMARKS)], TODAY)
        self.assertIsNone(result.grade)
        self.assertEqual(result.reason, REASON_STALE)

    def test_stale_is_distinguished_from_never_inspected(self):
        """Besökaren har rätt att veta vilket av fallen det är."""
        stale = calculate_grade([insp(1200, NO_REMARKS)], TODAY)
        never = calculate_grade([], TODAY)
        self.assertNotEqual(stale.reason, never.reason)

    def test_single_recent_inspection_is_enough_to_grade(self):
        result = calculate_grade([insp(30, NO_REMARKS)], TODAY)
        self.assertEqual(result.grade, "A")

    def test_future_dated_inspection_is_ignored(self):
        """Skräpdata får aldrig sätta betyg."""
        future = Inspection("I-fel", date(2027, 1, 1), MAJOR_REMARKS)
        result = calculate_grade([future, insp(30, NO_REMARKS)], TODAY)
        self.assertEqual(result.grade, "A")
        self.assertNotIn("I-fel", result.based_on)


class Traceability(unittest.TestCase):
    """Varje publicerat betyg ska gå att härleda i efterhand."""

    def test_result_records_model_version(self):
        result = calculate_grade([insp(30, NO_REMARKS)], TODAY)
        self.assertEqual(result.model_version, MODEL_VERSION)

    def test_result_lists_inspections_it_used_newest_first(self):
        result = calculate_grade(
            [
                insp(10, NO_REMARKS, ident="I-a"),
                insp(100, NO_REMARKS, ident="I-b"),
                insp(200, NO_REMARKS, ident="I-c"),
            ],
            TODAY,
        )
        self.assertEqual(result.based_on, ["I-a", "I-b", "I-c"])

    def test_complaint_inspection_counts_like_any_other(self):
        """En händelsestyrd kontroll är lika giltig som en rutinkontroll."""
        result = calculate_grade([insp(15, MAJOR_REMARKS, type_=COMPLAINT)], TODAY)
        self.assertEqual(result.grade, "E")


if __name__ == "__main__":
    unittest.main()
