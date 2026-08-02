"""Test för upptäckt av namnbyte per anläggning.

Kommunernas kontroller är registrerade på ANLÄGGNINGEN, alltså lokalen, och
inte på företaget. Tar en ny restaurang över en adress ärver den föregångarens
hela kontrollhistorik, och ingen av de nio källorna säger att bytet skett.

Det enda vi kan se är att NAMNET på ett anläggnings-id ändras mellan två
nattkörningar. Går den upptäckten sönder växer problemet vidare obemärkt, och
det är precis den sortens fel som ingen märker förrän en verksamhet hör av sig.

Körs utan beroenden:  python3 pipeline/tests/test_namnhistorik.py
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from load_supabase import record_names  # noqa: E402


class FakeClient:
    """Supabase-klient som svarar ur minnet och sparar vad den skrivit."""

    def __init__(self, existing):
        # id -> namn, som det står i databasen innan körningen
        self.existing = dict(existing)
        self.upserts = []
        self.queries = []

    def select_all(self, table, query):
        self.queries.append((table, query))
        return [{"id": i, "name": n} for i, n in self.existing.items()]

    def upsert(self, table, rows, on_conflict):
        self.upserts.append((table, rows, on_conflict))


def est(ident, name):
    return {"id": ident, "name": name}


class Namnbyte(unittest.TestCase):
    def test_bytt_namn_upptacks(self):
        """Samma id, nytt namn: lokalen har sannolikt bytt verksamhet."""
        client = FakeClient({"F-0180-abc": "Pizzeria Roma"})
        changes = record_names(
            client, "0180", [est("F-0180-abc", "Dersch")], "2026-08-03T03:17:00Z"
        )
        self.assertEqual(changes, [("F-0180-abc", "Pizzeria Roma", "Dersch")])

    def test_oforandrat_namn_ar_inget_byte(self):
        client = FakeClient({"F-0180-abc": "Dersch"})
        self.assertEqual(
            record_names(client, "0180", [est("F-0180-abc", "Dersch")], None), []
        )

    def test_okant_id_ar_ny_anlaggning_inte_ett_byte(self):
        """En anläggning kommunen just registrerat får inte larma.

        Vid första körningen mot en ny kommun är VARJE id okänt. Larmade vi på
        dem skulle de verkliga bytena drunkna i tusentals falska.
        """
        client = FakeClient({})
        self.assertEqual(
            record_names(client, "0180", [est("F-0180-ny", "Nyöppnat")], None), []
        )

    def test_loggen_skrivs_aven_utan_byte(self):
        """`last_seen_at` ska betyda senast sedd, alltså skrivas varje natt."""
        client = FakeClient({"F-0180-abc": "Dersch"})
        record_names(client, "0180", [est("F-0180-abc", "Dersch")], "2026-08-03T03:17:00Z")

        table, rows, on_conflict = client.upserts[0]
        self.assertEqual(table, "establishment_names")
        self.assertEqual(on_conflict, "establishment_id,name")
        self.assertEqual(
            rows,
            [
                {
                    "establishment_id": "F-0180-abc",
                    "name": "Dersch",
                    "last_seen_at": "2026-08-03T03:17:00Z",
                }
            ],
        )

    def test_first_seen_at_skickas_aldrig_med(self):
        """Skickas den med skriver upserten över den vid varje körning.

        Då blir varje namn "först sett i natt" och tabellen kan aldrig svara på
        frågan den finns för: sedan när har lokalen burit det här namnet.
        """
        client = FakeClient({})
        record_names(client, "0180", [est("F-0180-abc", "Dersch")], None)
        for row in client.upserts[0][1]:
            self.assertNotIn("first_seen_at", row)

    def test_lasningen_filtreras_pa_kommun(self):
        """Utan filtret jämförs Stockholms 8 511 mot hela rikets bestånd."""
        client = FakeClient({})
        record_names(client, "0180", [], None)
        self.assertIn("municipality_code=eq.0180", client.queries[0][1])


if __name__ == "__main__":
    unittest.main()
