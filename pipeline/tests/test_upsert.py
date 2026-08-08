"""Test för laddarens sammanslagning på konfliktnyckel.

Sammanslagningen finns för att en kommun som skickar samma id två gånger inte
ska fälla hela nattkörningen med

    21000: ON CONFLICT DO UPDATE command cannot affect row a second time

Den får däremot ALDRIG röra rader som inte bär nyckeln. control_areas har
`id bigserial` och skickas utan id, och en sammanslagning som läser id till
None för varje rad lägger hela kommunens kontrollområden i samma fack. Det
hände natten till 2026-08-07: 103 000 kontrollområden blev tolv rader, en per
kommun, och sajten stod utan svaret på vad anmärkningarna gällde.

Körs utan beroenden:  python3 pipeline/tests/test_upsert.py
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from load_supabase import Supabase  # noqa: E402


class FakeSupabase(Supabase):
    """Klient som samlar det som skulle skickats i stället för att skicka."""

    def __init__(self):
        super().__init__("https://exempel.supabase.co", "nyckel")
        self.sent = []

    def _request(self, method, path, body=None, prefer=""):
        self.sent.append((method, path, body))
        return b""

    @property
    def rows(self):
        return [row for _, _, body in self.sent for row in (body or [])]


def omrade(inspection_id, code, status="deviation"):
    """En rad ur control_areas. Notera att den saknar id: det sätter databasen."""
    return {"inspection_id": inspection_id, "code": code, "status": status}


class Sammanslagning(unittest.TestCase):
    def test_rader_utan_nyckel_gar_igenom_allihop(self):
        """Kärnan i regressionen. Utan id kan raderna inte krocka."""
        client = FakeSupabase()
        rows = [omrade("I-1", "J03"), omrade("I-1", "J08"), omrade("I-2", "H01")]
        client.upsert("control_areas", rows, on_conflict="id")
        self.assertEqual(len(client.rows), 3)
        self.assertEqual(
            [r["code"] for r in client.rows], ["J03", "J08", "H01"]
        )

    def test_hel_kommun_kontrollomraden_overlever(self):
        """Skalan som fällde 2026-08-07: inget får tappas."""
        client = FakeSupabase()
        rows = [omrade(f"I-{n // 6}", "J03") for n in range(3000)]
        client.upsert("control_areas", rows, on_conflict="id")
        self.assertEqual(len(client.rows), 3000)

    def test_delad_nyckel_slas_ihop_med_den_sista_som_vinnare(self):
        """Det sammanslagningen faktiskt finns för."""
        client = FakeSupabase()
        rows = [
            {"id": "I-1", "assessment": 0},
            {"id": "I-1", "assessment": 2},
            {"id": "I-2", "assessment": 1},
        ]
        client.upsert("inspections", rows, on_conflict="id")
        self.assertEqual(len(client.rows), 2)
        self.assertEqual(
            {r["id"]: r["assessment"] for r in client.rows}, {"I-1": 2, "I-2": 1}
        )

    def test_nyckel_med_flera_kolumner(self):
        client = FakeSupabase()
        rows = [
            {"establishment_id": "F-1", "captured_at": "2026-01-01", "url": "a"},
            {"establishment_id": "F-1", "captured_at": "2026-01-01", "url": "b"},
            {"establishment_id": "F-1", "captured_at": "2026-02-01", "url": "c"},
        ]
        client.upsert("images", rows, on_conflict="establishment_id,captured_at")
        self.assertEqual([r["url"] for r in client.rows], ["b", "c"])

    def test_delvis_nyckel_raknas_som_utan_nyckel(self):
        """Halva nyckeln är ingen nyckel: raden kan inte pekas ut i databasen."""
        client = FakeSupabase()
        rows = [
            {"establishment_id": "F-1", "captured_at": None, "url": "a"},
            {"establishment_id": "F-1", "captured_at": None, "url": "b"},
        ]
        client.upsert("images", rows, on_conflict="establishment_id,captured_at")
        self.assertEqual(len(client.rows), 2)

    def test_tom_lista_skickar_ingenting(self):
        client = FakeSupabase()
        client.upsert("control_areas", [], on_conflict="id")
        self.assertEqual(client.sent, [])


if __name__ == "__main__":
    unittest.main()
