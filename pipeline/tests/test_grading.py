"""Golden tests för hygienbedömningen.

Modellen publicerar omdömen om namngivna verksamheter. Varje regel ska därför
ha ett test som går att peka på — både för vår egen skull och för att kunna
visa exakt hur en bedömning räknades fram om någon ifrågasätter den.

Körs utan beroenden:  python3 pipeline/tests/test_grading.py
"""

import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.grading import (  # noqa: E402
    CLEAN,
    COMPLAINT,
    FOLLOWUP,
    MAJOR,
    MAJOR_REMARKS,
    MINOR,
    MINOR_REMARKS,
    MODEL_VERSION,
    NO_REMARKS,
    REASON_NO_INSPECTIONS,
    REASON_STALE,
    ROUTINE,
    Area,
    Inspection,
    assess,
)

TODAY = date(2026, 8, 2)


def insp(
    days_ago: int,
    assessment: int,
    type_: int = ROUTINE,
    ident: str = None,
    areas: tuple = (),
):
    """Kontroll för N dagar sedan, räknat från TODAY."""
    return Inspection(
        id_national=ident or f"I-0580-{days_ago}",
        inspected_at=date.fromordinal(TODAY.toordinal() - days_ago),
        assessment=assessment,
        type=type_,
        areas=areas,
    )


def dev(code: str = "", group: str = "", status: str = "deviation") -> Area:
    """Kontrollpunkt, som brist om inget annat sägs."""
    return Area(code=code, group=group, description="", status=status)


class Levels(unittest.TestCase):
    """Nivån speglar källans tre steg ett till ett."""

    def test_no_remarks_gives_clean(self):
        self.assertEqual(assess([insp(30, NO_REMARKS)], TODAY).verdict, CLEAN)

    def test_minor_remarks_gives_minor(self):
        self.assertEqual(assess([insp(30, MINOR_REMARKS)], TODAY).verdict, MINOR)

    def test_major_remarks_gives_major(self):
        self.assertEqual(assess([insp(30, MAJOR_REMARKS)], TODAY).verdict, MAJOR)


class LatestDecides(unittest.TestCase):
    """Nuläget avgör — historiken får aldrig ändra allvarlighetsgraden."""

    def test_spotless_history_cannot_soften_major(self):
        result = assess(
            [insp(10, MAJOR_REMARKS), insp(300, NO_REMARKS), insp(600, NO_REMARKS)],
            TODAY,
        )
        self.assertEqual(result.verdict, MAJOR)

    def test_bad_history_cannot_worsen_a_clean_inspection(self):
        result = assess(
            [insp(10, NO_REMARKS), insp(300, MAJOR_REMARKS)], TODAY
        )
        self.assertEqual(result.verdict, CLEAN)

    def test_input_order_does_not_matter(self):
        recent, old = insp(10, NO_REMARKS, ident="I-ny"), insp(500, MAJOR_REMARKS)
        self.assertEqual(
            assess([recent, old], TODAY).verdict,
            assess([old, recent], TODAY).verdict,
        )
        self.assertEqual(assess([old, recent], TODAY).based_on[0], "I-ny")

    def test_clean_followup_after_major_reads_as_clean(self):
        """Åtgärdat ska synas som åtgärdat — historiken visas separat."""
        result = assess(
            [insp(20, NO_REMARKS, type_=FOLLOWUP), insp(60, MAJOR_REMARKS)], TODAY
        )
        self.assertEqual(result.verdict, CLEAN)
        self.assertFalse(result.distinction)


class PersistingDeviations(unittest.TestCase):
    """Allvarsgraden härleds ur mönstret, inte ur kommunens ordval.

    Stockholm saknar helt ett värde för "kvarstår" — deras skala slutar vid
    "med avvikelser". Utan den här härledningen kan ingen verksamhet i
    Stockholm någonsin hamna på allvarligaste nivån, medan en i Linköping kan.
    Då går städerna inte att jämföra, och jämförbarheten är hela produkten.
    """

    def test_single_minor_remark_stays_minor(self):
        """En engångsavvikelse är inte allvarlig."""
        self.assertEqual(assess([insp(30, MINOR_REMARKS)], TODAY).verdict, MINOR)

    def test_deviation_found_at_followup_becomes_major(self):
        """Kommunen kom tillbaka för att kontrollera åtgärden. Den räckte inte."""
        result = assess([insp(20, MINOR_REMARKS, type_=FOLLOWUP)], TODAY)
        self.assertEqual(result.verdict, MAJOR)

    def test_repeated_deviation_becomes_major(self):
        """Samma problem två kontroller i rad."""
        result = assess(
            [insp(30, MINOR_REMARKS), insp(300, MINOR_REMARKS)], TODAY
        )
        self.assertEqual(result.verdict, MAJOR)

    def test_deviation_after_clean_history_stays_minor(self):
        """Nytt problem hos en tidigare skötsam verksamhet skärps inte."""
        result = assess(
            [insp(30, MINOR_REMARKS), insp(300, NO_REMARKS), insp(600, NO_REMARKS)],
            TODAY,
        )
        self.assertEqual(result.verdict, MINOR)

    def test_clean_followup_is_not_escalated(self):
        """Ett återbesök UTAN avvikelse betyder att problemet är löst."""
        result = assess(
            [insp(20, NO_REMARKS, type_=FOLLOWUP), insp(60, MINOR_REMARKS)], TODAY
        )
        self.assertEqual(result.verdict, CLEAN)

    def test_explicit_major_is_unaffected(self):
        """Källor som själva säger 'allvarlig' ska inte påverkas av härledningen."""
        self.assertEqual(assess([insp(30, MAJOR_REMARKS)], TODAY).verdict, MAJOR)


class AdministrativeWeighting(unittest.TestCase):
    """Version 4: rent administrativa avvikelser skärps aldrig.

    Viktningen kan bara mildra vår egen härledda skärpning. Den rör aldrig
    kommunens egen bedömning, och den mildrar aldrig när underlaget är okänt.
    """

    def test_admin_only_followup_stays_minor(self):
        """Journalföringen brast även vid återbesöket — fortfarande 'Brister'."""
        result = assess(
            [insp(20, MINOR_REMARKS, type_=FOLLOWUP, areas=(dev(code="A01"),))],
            TODAY,
        )
        self.assertEqual(result.verdict, MINOR)

    def test_admin_only_repetition_stays_minor(self):
        """Upprepad spårbarhetsbrist skärps inte."""
        result = assess(
            [
                insp(30, MINOR_REMARKS, areas=(dev(code="H03"),)),
                insp(300, MINOR_REMARKS),
            ],
            TODAY,
        )
        self.assertEqual(result.verdict, MINOR)

    def test_mixed_areas_still_escalate(self):
        """En enda hygienbrist bland de administrativa räcker för skärpning."""
        result = assess(
            [
                insp(30, MINOR_REMARKS, areas=(dev(code="A01"), dev(code="J03"))),
                insp(300, MINOR_REMARKS),
            ],
            TODAY,
        )
        self.assertEqual(result.verdict, MAJOR)

    def test_no_area_rows_still_escalates(self):
        """Utan redovisade kontrollpunkter bedöms mönstret som i version 3."""
        result = assess(
            [insp(30, MINOR_REMARKS), insp(300, MINOR_REMARKS)], TODAY
        )
        self.assertEqual(result.verdict, MAJOR)

    def test_unknown_area_still_escalates(self):
        """En rad vars område inte går att avgöra får aldrig mildra."""
        result = assess(
            [
                insp(30, MINOR_REMARKS, areas=(dev(group="Något nytt påhitt"),)),
                insp(300, MINOR_REMARKS),
            ],
            TODAY,
        )
        self.assertEqual(result.verdict, MAJOR)

    def test_group_name_without_code_classifies(self):
        """Uppsala och Lomma lämnar ingen kod — namnet avgör i stället."""
        result = assess(
            [
                insp(30, MINOR_REMARKS, areas=(dev(group="Spårbarhet"),)),
                insp(300, MINOR_REMARKS),
            ],
            TODAY,
        )
        self.assertEqual(result.verdict, MINOR)

    def test_labelling_is_not_administrative(self):
        """B omfattar allergeninformation och väger därför aldrig lättare."""
        result = assess(
            [
                insp(30, MINOR_REMARKS, areas=(dev(code="B05"),)),
                insp(300, MINOR_REMARKS),
            ],
            TODAY,
        )
        self.assertEqual(result.verdict, MAJOR)

    def test_fixed_rows_do_not_count_as_remarks(self):
        """Åtgärdade punkter är inte avvikelser: kvar finns bara admin-raden."""
        result = assess(
            [
                insp(
                    30,
                    MINOR_REMARKS,
                    areas=(dev(code="A01"), dev(code="J03", status="fixed")),
                ),
                insp(300, MINOR_REMARKS),
            ],
            TODAY,
        )
        self.assertEqual(result.verdict, MINOR)

    def test_municipal_major_is_never_softened(self):
        """Kommunens egen tvåa står, även när allt som avviker är administrativt."""
        result = assess(
            [insp(30, MAJOR_REMARKS, areas=(dev(code="A01"),))], TODAY
        )
        self.assertEqual(result.verdict, MAJOR)


class Distinction(unittest.TestCase):
    """Utmärkelsen ersätter de betygssteg vi inte kan belägga."""

    def test_three_clean_inspections_earn_distinction(self):
        result = assess(
            [insp(10, NO_REMARKS), insp(300, NO_REMARKS), insp(600, NO_REMARKS)],
            TODAY,
        )
        self.assertEqual(result.verdict, CLEAN)
        self.assertTrue(result.distinction)

    def test_one_blemish_in_window_denies_distinction(self):
        result = assess(
            [insp(10, NO_REMARKS), insp(300, MINOR_REMARKS), insp(600, NO_REMARKS)],
            TODAY,
        )
        self.assertTrue(result.verdict == CLEAN)
        self.assertFalse(result.distinction)

    def test_too_few_inspections_denies_distinction(self):
        """Två rena kontroller är inte ett mönster."""
        result = assess([insp(10, NO_REMARKS), insp(300, NO_REMARKS)], TODAY)
        self.assertEqual(result.verdict, CLEAN)
        self.assertFalse(result.distinction)

    def test_distinction_never_accompanies_remarks(self):
        result = assess(
            [insp(10, MINOR_REMARKS), insp(300, NO_REMARKS), insp(600, NO_REMARKS)],
            TODAY,
        )
        self.assertFalse(result.distinction)


class InsufficientEvidence(unittest.TestCase):
    """Vi vägrar gissa. Ingen bedömning är ett giltigt utfall."""

    def test_no_inspections_at_all(self):
        result = assess([], TODAY)
        self.assertIsNone(result.verdict)
        self.assertEqual(result.reason, REASON_NO_INSPECTIONS)
        self.assertFalse(result.publishable)

    def test_inspections_older_than_three_years_do_not_assess(self):
        result = assess([insp(1200, MAJOR_REMARKS)], TODAY)
        self.assertIsNone(result.verdict)
        self.assertEqual(result.reason, REASON_STALE)

    def test_stale_is_distinguished_from_never_inspected(self):
        """Besökaren har rätt att veta vilket av fallen det är."""
        self.assertNotEqual(
            assess([insp(1200, NO_REMARKS)], TODAY).reason,
            assess([], TODAY).reason,
        )

    def test_single_recent_inspection_is_enough_to_assess(self):
        self.assertEqual(assess([insp(30, NO_REMARKS)], TODAY).verdict, CLEAN)

    def test_future_dated_inspection_is_ignored(self):
        """Skräpdata får aldrig sätta en bedömning."""
        future = Inspection("I-fel", date(2027, 1, 1), MAJOR_REMARKS)
        result = assess([future, insp(30, NO_REMARKS)], TODAY)
        self.assertEqual(result.verdict, CLEAN)
        self.assertNotIn("I-fel", result.based_on)


class Traceability(unittest.TestCase):
    """Varje publicerad bedömning ska gå att härleda i efterhand."""

    def test_records_model_version(self):
        self.assertEqual(assess([insp(30, NO_REMARKS)], TODAY).model_version, MODEL_VERSION)

    def test_lists_inspections_used_newest_first(self):
        result = assess(
            [
                insp(10, NO_REMARKS, ident="I-a"),
                insp(100, NO_REMARKS, ident="I-b"),
                insp(200, NO_REMARKS, ident="I-c"),
            ],
            TODAY,
        )
        self.assertEqual(result.based_on, ["I-a", "I-b", "I-c"])

    def test_only_three_most_recent_are_used(self):
        result = assess(
            [
                insp(10, NO_REMARKS),
                insp(200, NO_REMARKS),
                insp(400, NO_REMARKS),
                insp(600, MAJOR_REMARKS),
            ],
            TODAY,
        )
        self.assertEqual(len(result.based_on), 3)
        self.assertTrue(result.distinction)

    def test_complaint_inspection_counts_like_any_other(self):
        """En händelsestyrd kontroll är lika giltig som en rutinkontroll."""
        self.assertEqual(
            assess([insp(15, MAJOR_REMARKS, type_=COMPLAINT)], TODAY).verdict, MAJOR
        )


if __name__ == "__main__":
    unittest.main()
