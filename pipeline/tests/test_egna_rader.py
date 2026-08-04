"""Test för att klientens "egna rader"-frågor alltid bär ägarfiltret.

Bakgrunden är en användarblandning i produktion: tabellen community.reviews
har två läspolicyer som läggs ihop med eller, egna rader och allas
publicerade rader. En fråga utan eget filter fick därför tillbaka andras
publicerade omdömen, och kontosidan målade dem som ens egna. Den som loggade
in med ett nytt konto stod som avsändare av omdömen skrivna från ett annat.

Rättelsen är ownRows() i site/src/lib/community.ts, som skriver ut
user_id=eq.<eget id> på varje läsning av egna rader. Det här testet är
snubbeltråden: det läser källfilen och fäller bygget om någon GET mot en
tabell med användarrader går förbi ownRows(). Regeln gäller även tabeller
vars radsäkerhet i dag bara släpper ut egna rader, för en bredare policy i
morgon ska inte kunna öppna en tyst läcka.

Körs utan beroenden:  python3 pipeline/tests/test_egna_rader.py
"""

import re
import unittest
from pathlib import Path

KLIENTEN = Path(__file__).resolve().parents[2] / "site" / "src" / "lib" / "community.ts"

# Tabeller i schemat community där varje rad hör till en användare. En GET dit
# är en fråga om egna rader och ska gå genom ownRows(). published_reviews står
# inte här: vyn är den publika listan och läses med avsikt utan filter.
EGNA_TABELLER = (
    "follows",
    "reviews",
    "establishment_claims",
    "owner_responses",
    "image_uploads",
    "notifications",
    "profiles",
)

# De tabeller klienten faktiskt läser i dag. Håller motsatta riktningen i
# test_lasningarna_finns_kvar_filtrerade nedan från att bli tom.
LASTA_TABELLER = (
    "follows",
    "reviews",
    "establishment_claims",
    "owner_responses",
    "image_uploads",
)


class EgnaRader(unittest.TestCase):
    def setUp(self):
        self.kod = KLIENTEN.read_text(encoding="utf-8")

    def test_hjalpfunktionen_finns(self):
        self.assertIn("async function ownRows(", self.kod)
        self.assertIn("user_id=eq.", self.kod)

    def test_ingen_get_gar_forbi_agarfiltret(self):
        # Varje rest('GET', ...) vars sökväg börjar med en egna rader-tabell
        # ska ha `await ownRows(` som första led i argumentet.
        traffar = list(re.finditer(
            r"rest\(\s*'GET',\s*(await ownRows\(\s*)?[`'\"]([a-z_]+)\?",
            self.kod,
        ))
        self.assertTrue(traffar, "Hittade inga GET-anrop alls; har filen bytt form?")

        for traff in traffar:
            filtrerad = traff.group(1) is not None
            tabell = traff.group(2)
            if tabell in EGNA_TABELLER:
                self.assertTrue(
                    filtrerad,
                    f"GET mot '{tabell}' utan ownRows(). Radsäkerheten är inte "
                    "ett filter: en inloggad kan få tillbaka andras publicerade "
                    "rader och visa dem som sina egna.",
                )

    def test_lasningarna_finns_kvar_filtrerade(self):
        # Motsatt riktning, så att testet ovan inte blir tomt av en omdöpning
        # eller av att någon slutar använda rest() för de här frågorna.
        for tabell in LASTA_TABELLER:
            self.assertRegex(
                self.kod,
                r"ownRows\(\s*[`'\"]" + tabell + r"\?",
                f"Ingen filtrerad läsning av '{tabell}' hittades.",
            )


if __name__ == "__main__":
    unittest.main()
