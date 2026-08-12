"""Test för kontrolldatum som källan lämnat i framtiden.

Bakgrunden står i prikko/dates.py: en kommun skrev fel årtal i brödtexten på
en kontrollrapport, sitemapens `lastmod` hamnade fyra månader in i framtiden,
och ett `lastmod` Google inte tror på slutar Google läsa för hela sajten.

Testet vaktar ordningen (brödtext, rapportens eget datum, i dag) och de tre
egenskaper regeln måste ha för att inte göra mer skada än nytta: den rör bara
datum som ligger EFTER i dag, den lämnar kontrollens id orört, och den säger
varifrån datumet till slut togs.

Körs utan beroenden:  python3 pipeline/tests/test_datum.py
"""

import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.dates import (  # noqa: E402
    SOURCE_BODY,
    SOURCE_REPORT,
    SOURCE_TODAY,
    clamp_future_inspections,
    report_date_from_url,
    resolve_control_date,
)

TODAY = date(2026, 8, 12)

#: Rapporten som utlöste hela regeln.
TORGET_URL = (
    "https://www.svenljunga.se/download/18.222bbcaf19a950f11a424dc/1767607095728/"
    "Torget%20pizzeria%20och%20restaurang%202025-12-09.pdf"
)


def establishment(*inspections):
    return {
        "id": "F-1465-abc",
        "name": "Torget pizzeria och restaurang",
        "inspections": [
            {"id": f"I-1465-abc-{d}", "date": d, "assessment": 1, **extra}
            for d, extra in inspections
        ],
    }


class ResolveControlDate(unittest.TestCase):
    def test_brodtexten_galler_nar_den_ar_rimlig(self):
        resolved = resolve_control_date(date(2026, 5, 22), date(2026, 5, 30), TODAY)
        self.assertEqual(resolved.value, date(2026, 5, 22))
        self.assertEqual(resolved.source, SOURCE_BODY)
        self.assertIsNone(resolved.rejected)

    def test_dagens_datum_ar_rimligt(self):
        """Gränsen går vid i dag, som är ett fullt giltigt kontrolldatum."""
        resolved = resolve_control_date(TODAY, None, TODAY)
        self.assertEqual(resolved.value, TODAY)
        self.assertEqual(resolved.source, SOURCE_BODY)

    def test_framtida_brodtext_ger_rapportens_datum(self):
        """Torgets fall: brödtexten säger 2026, rapporten är från 2025."""
        resolved = resolve_control_date(date(2026, 12, 9), date(2025, 12, 9), TODAY)
        self.assertEqual(resolved.value, date(2025, 12, 9))
        self.assertEqual(resolved.source, SOURCE_REPORT)
        self.assertEqual(resolved.rejected, date(2026, 12, 9))

    def test_utan_rapportdatum_aterstar_i_dag(self):
        resolved = resolve_control_date(date(2026, 12, 9), None, TODAY)
        self.assertEqual(resolved.value, TODAY)
        self.assertEqual(resolved.source, SOURCE_TODAY)

    def test_framtida_rapportdatum_duger_inte_heller(self):
        """Ett fallback som självt ligger i framtiden löser ingenting."""
        resolved = resolve_control_date(date(2026, 12, 9), date(2026, 12, 18), TODAY)
        self.assertEqual(resolved.value, TODAY)
        self.assertEqual(resolved.source, SOURCE_TODAY)


class ReportDateFromUrl(unittest.TestCase):
    def test_datum_ur_rapportens_url(self):
        self.assertEqual(report_date_from_url(TORGET_URL), date(2025, 12, 9))

    def test_utan_datum(self):
        self.assertIsNone(report_date_from_url("https://exempel.se/rapport.pdf"))
        self.assertIsNone(report_date_from_url(None))

    def test_omojligt_datum(self):
        self.assertIsNone(report_date_from_url("rapport 2025-13-45.pdf"))


class ClampFutureInspections(unittest.TestCase):
    def test_rapportens_datum_anvands_nar_det_finns(self):
        e = establishment(("2026-12-09", {"reportUrl": TORGET_URL}))
        clamped = clamp_future_inspections([e], TODAY)

        self.assertEqual(e["inspections"][0]["date"], "2025-12-09")
        self.assertEqual(len(clamped), 1)
        self.assertEqual(clamped[0].source_date, "2026-12-09")
        self.assertEqual(clamped[0].chosen_date, "2025-12-09")
        self.assertEqual(clamped[0].source, SOURCE_REPORT)
        self.assertEqual(clamped[0].establishment, "Torget pizzeria och restaurang")

    def test_utan_rapporturl_blir_det_dagens(self):
        e = establishment(("2026-12-09", {}))
        clamped = clamp_future_inspections([e], TODAY)

        self.assertEqual(e["inspections"][0]["date"], "2026-08-12")
        self.assertEqual(clamped[0].source, SOURCE_TODAY)

    def test_gamla_datum_rors_inte(self):
        e = establishment(("2024-09-19", {}), ("2026-08-11", {"reportUrl": TORGET_URL}))
        self.assertEqual(clamp_future_inspections([e], TODAY), [])
        self.assertEqual(
            [i["date"] for i in e["inspections"]], ["2024-09-19", "2026-08-11"]
        )

    def test_id_behaller_kallans_datum(self):
        """Id:t är spåret tillbaka till kommunens rapport och skrivs aldrig om.

        Skrevs det om skulle raden dessutom bli en NY kontroll vid nästa
        inläsning i stället för samma, och verksamheten skulle se ut att ha
        kontrollerats två gånger.
        """
        e = establishment(("2026-12-09", {"reportUrl": TORGET_URL}))
        clamp_future_inspections([e], TODAY)
        self.assertEqual(e["inspections"][0]["id"], "I-1465-abc-2026-12-09")

    def test_olasbart_datum_lamnas_at_sitt_eget_fel(self):
        e = establishment(("inte ett datum", {}))
        self.assertEqual(clamp_future_inspections([e], TODAY), [])
        self.assertEqual(e["inspections"][0]["date"], "inte ett datum")

    def test_verksamhet_utan_kontroller(self):
        self.assertEqual(
            clamp_future_inspections([{"id": "F-1", "name": "X"}], TODAY), []
        )


if __name__ == "__main__":
    unittest.main()
