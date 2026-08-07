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
FORETAGSYTAN = Path(__file__).resolve().parents[2] / "site" / "src" / "lib" / "foretag.ts"
SCHEMAT = Path(__file__).resolve().parents[1] / "schema_community.sql"

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
    "notices",
    "notice_reads",
    "profiles",
    "business_profiles",
    "business_images",
)

# De tabeller klienten faktiskt läser i dag. Håller motsatta riktningen i
# test_lasningarna_finns_kvar_filtrerade nedan från att bli tom.
LASTA_TABELLER = (
    "follows",
    "reviews",
    "establishment_claims",
    "owner_responses",
    "image_uploads",
    "notices",
    "notice_reads",
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


class ForetagsytanOckso(EgnaRader):
    """Samma regel, andra filen.

    Företagsytan ligger i site/src/lib/foretag.ts och har en egen ownRows(),
    eftersom community.ts skrevs om samtidigt. En egen kopia är precis den
    sortens plats där regeln annars tappas bort, så testet läser den filen med
    samma ögon som originalet.

    community.business_profiles har två läspolicyer som läggs ihop med ELLER,
    egna rader och allas publicerade. En läsning utan eget filter hade gett
    tillbaka andra företags publicerade uppgifter och målat dem som ens egna
    insändningar, med status och allt.
    """

    def setUp(self):
        self.kod = FORETAGSYTAN.read_text(encoding="utf-8")

    def test_lasningarna_finns_kvar_filtrerade(self):
        for tabell in ("business_profiles", "establishment_claims", "business_images"):
            self.assertRegex(
                self.kod,
                r"ownRows\(\s*[`'\"]" + tabell + r"\?",
                f"Ingen filtrerad läsning av '{tabell}' hittades.",
            )

    def test_raderingen_bar_agarfiltret(self):
        # Ångra-knappen raderar en egen insändning. Policyn släpper bara egna
        # väntande rader, men en bredare policy i morgon ska inte kunna göra
        # den här raden till en radering av någon annans uppgifter.
        self.assertRegex(
            self.kod,
            r"rest\(\s*\n?\s*'DELETE',\s*\n?\s*await ownRows\(",
            "DELETE mot business_profiles utan ownRows().",
        )


class RaknarenIDatabasen(unittest.TestCase):
    """Samma regel, andra sidan av nätet.

    Klockan i sidhuvudet räknar med community.unread_notices() i stället för
    med tre frågor från webbläsaren. Funktionen kringgår därför testet ovan,
    som bara läser klientkoden, och det är precis den sortens genväg som gör
    att en rättad bugg kommer tillbaka någon annanstans.

    Funktionen läser community.reviews, tabellen med två läspolicyer som läggs
    ihop med ELLER. Utan ett eget filter räknar den in allas publicerade
    omdömen, och en ny användare hade fått en prick för främlingars rader.
    """

    def setUp(self):
        self.sql = SCHEMAT.read_text(encoding="utf-8")
        start = self.sql.index("create or replace function community.unread_notices()")
        self.kropp = self.sql[start : self.sql.index("$$;", start)]

    def test_funktionen_finns(self):
        self.assertIn("create or replace function community.unread_notices()", self.sql)

    def test_ingen_gren_saknar_agarfiltret(self):
        # En gren per källa: notices och reviews. Båda ska bära filtret.
        self.assertEqual(
            self.kropp.count("user_id = auth.uid()"),
            3,
            "unread_notices() ska filtrera på auth.uid() i läsmarkeringen och i "
            "båda källorna. Radsäkerheten är inte ett filter: reviews släpper ut "
            "allas publicerade rader till vem som helst som frågar.",
        )

    def test_inte_security_definer(self):
        # En definer-funktion går förbi radsäkerheten helt, och då är det egna
        # filtret det enda som står mellan en användare och allas rader.
        self.assertNotIn("security definer", self.kropp)


if __name__ == "__main__":
    unittest.main()
