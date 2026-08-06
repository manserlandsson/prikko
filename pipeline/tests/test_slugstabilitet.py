"""Test för att en publicerad slug aldrig byter verksamhet.

Bakgrunden är den nattliga körningen 2026-08-06, som föll med

    23505: Key (municipality_code, slug)=(0180, masens-forskola) already exists

Stockholm har två förskolor som heter "Måsens förskola", på
Blommensbergsvägen 163 och 180. Ingen av dem hade bytt id, och båda fanns kvar
i källan. Det som hade hänt var att källan levererade dem i omvänd ordning mot
förra körningen, och `dedupe_slugs` numrerar kollisioner positionellt. Därmed
bytte "masens-forskola" och "masens-forskola-2" ägare mellan de två raderna.

Två fel följde. Upserten går på `id` medan unikheten gäller
(municipality_code, slug), så bytet krockade med en rad som fortfarande höll
sluggen. Och sluggen ÄR sidans adress: hade bytet gått igenom hade varje
bokmärke och varje notismejl till /stockholm/masens-forskola tyst börjat peka
på grannförskolan.

Testet är snubbeltråden för båda. Går det sönder kan URL:er börja vandra
mellan verksamheter igen, och det är den sortens fel ingen upptäcker förrän
någon läser fel kontrollhistorik om fel lokal.

Körs utan beroenden:  python3 pipeline/tests/test_slugstabilitet.py
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from load_supabase import (  # noqa: E402
    MAX_MISSING_ROWS,
    deactivate_missing,
    reconcile_slugs,
)


class FakeClient:
    """Supabase-klient som svarar ur minnet och sparar vad den skrivit."""

    def __init__(self, existing):
        # id -> {"slug": ..., "active": ...}, som det står i databasen innan
        # körningen.
        self.existing = {
            ident: dict(row) if isinstance(row, dict) else {"slug": row, "active": 2}
            for ident, row in existing.items()
        }
        self.queries = []
        self.updates = []

    def select_all(self, table, query):
        self.queries.append((table, query))
        return [
            {"id": ident, "slug": row["slug"], "active": row.get("active", 2)}
            for ident, row in self.existing.items()
        ]

    def update_where_in(self, table, column, values, patch):
        self.updates.append((table, column, sorted(values), patch))


def est(ident, slug):
    return {"id": ident, "slug": slug}


MASEN_180 = "F-0180-786dc9fb-8e25-4d16-a78a-8eb316272a36"
MASEN_163 = "F-0180-5bc9c37b-11ce-4967-96d5-c7b23bcfcee7"


class Slugstabilitet(unittest.TestCase):
    def test_kallans_ordning_far_inte_flytta_en_publicerad_slug(self):
        """Precis fallet som fällde nattkörningen 2026-08-06.

        Källan levererar de två Måsens förskola i omvänd ordning mot förra
        gången, så `dedupe_slugs` ger dem varandras slugar. Båda ska behålla
        den de redan är publicerade på.
        """
        client = FakeClient(
            {MASEN_180: "masens-forskola", MASEN_163: "masens-forskola-2"}
        )
        payload = [
            est(MASEN_163, "masens-forskola"),
            est(MASEN_180, "masens-forskola-2"),
        ]

        blocked = reconcile_slugs(client, "0180", payload)

        self.assertEqual(payload[0]["slug"], "masens-forskola-2")
        self.assertEqual(payload[1]["slug"], "masens-forskola")
        self.assertEqual(
            sorted(blocked),
            sorted(
                [
                    (MASEN_163, "masens-forskola", "masens-forskola-2"),
                    (MASEN_180, "masens-forskola-2", "masens-forskola"),
                ]
            ),
        )

    def test_nytt_id_pa_samma_slug_far_inte_ta_over(self):
        """Byter kommunen id på en verksamhet är den ändå en NY rad för oss.

        Den gamla raden ligger kvar och håller sin adress. Den nya får en egen,
        i stället för att krocka med den gamla i databasen.
        """
        client = FakeClient({MASEN_180: "masens-forskola"})
        payload = [est("F-0180-helt-nytt-id", "masens-forskola")]

        reconcile_slugs(client, "0180", payload)

        self.assertEqual(payload[0]["slug"], "masens-forskola-2")

    def test_befintligt_id_behaller_sin_slug_aven_vid_namnbyte(self):
        """Namnbytet syns på sidan, inte i adressen.

        Kontrollhistoriken hänger på lokalen och inte på företaget, så sidan är
        lokalens sida även när skylten byts. Att flytta adressen hade brutit
        varje inlänk utan att ge läsaren något.
        """
        client = FakeClient({"F-0180-abc": "pizzeria-roma"})
        payload = [est("F-0180-abc", "dersch")]

        blocked = reconcile_slugs(client, "0180", payload)

        self.assertEqual(payload[0]["slug"], "pizzeria-roma")
        self.assertEqual(blocked, [("F-0180-abc", "dersch", "pizzeria-roma")])

    def test_slug_fran_bortfallen_rad_forblir_reserverad(self):
        """En verksamhet som slutat lämnas ut håller kvar sin adress.

        Frigavs den kunde nästa körning ge samma URL till en annan lokal, och
        då pekar gamla länkar på fel verksamhet i stället för på ingenting.
        """
        client = FakeClient({"F-0180-borta": "kafe-hornet"})
        payload = [est("F-0180-ny", "kafe-hornet")]

        reconcile_slugs(client, "0180", payload)

        self.assertEqual(payload[0]["slug"], "kafe-hornet-2")

    def test_tva_nya_med_samma_slug_skiljs_at(self):
        client = FakeClient({})
        payload = [est("F-0180-a", "espresso-house"), est("F-0180-b", "espresso-house")]

        reconcile_slugs(client, "0180", payload)

        self.assertEqual(
            [e["slug"] for e in payload], ["espresso-house", "espresso-house-2"]
        )

    def test_forsta_korningen_ror_ingenting(self):
        """Mot en tom kommun är fetch-adapterns slugar redan de rätta."""
        client = FakeClient({})
        payload = [est("F-1465-a", "kafeet"), est("F-1465-b", "baren")]

        self.assertEqual(reconcile_slugs(client, "1465", payload), [])
        self.assertEqual([e["slug"] for e in payload], ["kafeet", "baren"])

    def test_oforandrad_korning_ger_inga_flyttforsok(self):
        client = FakeClient({"F-0180-abc": "dersch"})
        payload = [est("F-0180-abc", "dersch")]

        self.assertEqual(reconcile_slugs(client, "0180", payload), [])

    def test_lasningen_filtreras_pa_kommun(self):
        """Utan filtret jämförs Stockholms 8 511 mot hela rikets bestånd."""
        client = FakeClient({})
        reconcile_slugs(client, "0180", [])
        self.assertIn("municipality_code=eq.0180", client.queries[0][1])


class Bortfall(unittest.TestCase):
    def test_saknad_anlaggning_avpubliceras(self):
        client = FakeClient({"F-0180-kvar": "kvar", "F-0180-borta": "borta"})

        gone = deactivate_missing(client, "0180", [est("F-0180-kvar", "kvar")])

        self.assertEqual(gone, ["F-0180-borta"])
        self.assertEqual(
            client.updates,
            [("establishments", "id", ["F-0180-borta"], {"active": 0})],
        )

    def test_raden_raderas_aldrig(self):
        """Radering hade kaskaderat bort historiken och frigjort sluggen."""
        client = FakeClient({"F-0180-borta": "borta"})
        deactivate_missing(client, "0180", [])
        for table, column, values, patch in client.updates:
            self.assertEqual(patch, {"active": 0})
        self.assertFalse(hasattr(client, "deletes"))

    def test_fullstandig_utlamning_ror_ingenting(self):
        client = FakeClient({"F-0180-a": "a", "F-0180-b": "b"})

        self.assertEqual(
            deactivate_missing(
                client, "0180", [est("F-0180-a", "a"), est("F-0180-b", "b")]
            ),
            [],
        )
        self.assertEqual(client.updates, [])

    def test_stort_bortfall_avpublicerar_ingenting(self):
        """En hämtning som missar rutor får inte tömma en kommun i tysthet.

        Stockholms fetch hoppar tyst över en rutnätsruta som svarar med fel.
        Bortfallet ser då ut som hundratals nedlagda verksamheter, och är det
        aldrig.
        """
        client = FakeClient({f"F-0180-{i}": f"s{i}" for i in range(1000)})
        payload = [est(f"F-0180-{i}", f"s{i}") for i in range(400)]

        self.assertEqual(deactivate_missing(client, "0180", payload), [])
        self.assertEqual(client.updates, [])

    def test_golvet_slapper_igenom_i_en_liten_kommun(self):
        """Fem procent av Svenljungas 99 rader är fyra, och fyra nedlagda
        kaféer i en liten kommun är fullt möjligt."""
        client = FakeClient({f"F-1465-{i}": f"s{i}" for i in range(99)})
        borta = MAX_MISSING_ROWS
        payload = [est(f"F-1465-{i}", f"s{i}") for i in range(borta, 99)]

        self.assertEqual(len(deactivate_missing(client, "1465", payload)), borta)

    def test_active_null_raknas_som_publicerad(self):
        """Vyn publishable_establishments gör coalesce(active, 2), alltså är
        NULL publicerat. Missas det ligger raden kvar synlig för alltid."""
        client = FakeClient({"F-0180-gammal": {"slug": "gammal", "active": None}})

        self.assertEqual(deactivate_missing(client, "0180", []), ["F-0180-gammal"])

    def test_redan_avpublicerad_rad_raknas_inte_igen(self):
        """Annars skrivs samma rader om varje natt och spärren fylls av dem."""
        client = FakeClient(
            {
                "F-0180-kvar": {"slug": "kvar", "active": 2},
                "F-0180-sedan-lange-borta": {"slug": "borta", "active": 0},
            }
        )

        self.assertEqual(
            deactivate_missing(client, "0180", [est("F-0180-kvar", "kvar")]), []
        )
        self.assertEqual(client.updates, [])


if __name__ == "__main__":
    unittest.main()
