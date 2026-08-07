"""Test för att granskningen i webbläsaren inte kan bli en genväg.

Bakgrunden är att sajten är statiskt genererad. Anon-nyckeln ligger öppet i
varje byggd sida, det finns ingen server hos oss, och alltså finns det ingen
plats i klientkoden där en behörighet kan bo. Granskningssidan
/konto/granska/ är därför byggd så att den bara VISAR något som databasen
redan bestämt, och det här testet är snubbeltråden som håller den ordningen.

Fem regler prövas, alla sådana som annars bara stod som en kommentar:

  1. Ingen e-postadress som villkor i klientkoden. Rollen bor i
     community.admins och ingen annanstans.
  2. Varje beslutsfunktion börjar med require_admin(). En definer-funktion
     utan den raden är en publik knapp.
  3. Varje definer-funktion pinnar sin search_path. Utan det kan anroparen
     styra vilka namn funktionen träffar.
  4. Ingen inloggad roll får UPDATE på en modererad tabell. Det är raden som
     gör att pending inte kan bli published utan att gå genom en funktion.
  5. Granskningen skriver aldrig i schemat public. Hygienbedömningen,
     kontrollhistoriken och utmärkelsen kommer från kommunernas kontroller
     och ska inte kunna röras av någon, inte ens av redaktionen.

Körs utan beroenden:  python3 pipeline/tests/test_granskning.py
"""

import re
import unittest
from pathlib import Path

ROT = Path(__file__).resolve().parents[2]
SCHEMAT = ROT / "pipeline" / "schema_admin.sql"
GEMENSAMT = ROT / "pipeline" / "schema_community.sql"
KLIENTEN = ROT / "site" / "src" / "lib" / "granska.ts"
SIDAN = ROT / "site" / "src" / "pages" / "konto" / "granska.astro"

#: Funktionerna som får flytta en rad från pending till published.
BESLUT = (
    "community.moderate_review",
    "community.moderate_image",
    "community.moderate_owner_response",
    "community.moderate_claim",
    "community.admin_signals",
)

#: Tabellerna vars status bara får ändras genom en beslutsfunktion.
MODERERADE = (
    "community.reviews",
    "community.image_uploads",
    "community.owner_responses",
    "community.establishment_claims",
)


def utan_kommentarer(sql: str) -> str:
    """Filen utan sina kommentarrader.

    Varje påstående nedan gäller vad databasen GÖR, inte vad filen berättar.
    Utan den här raden hade en kommentar som nämner public.inspections fällt
    testet, och ett testet man lär sig att kringgå med formuleringar är värre
    än inget test.
    """
    return "\n".join(r for r in sql.split("\n") if not r.strip().startswith("--"))


def kroppar(sql: str) -> dict[str, str]:
    """Varje funktionskropp i filen, slagen på funktionsnamn."""
    ut = {}
    for traff in re.finditer(
        r"create or replace function (community\.\w+)\s*\((.*?)\)(.*?)\n\$\$;",
        sql,
        re.S,
    ):
        ut[traff.group(1)] = traff.group(3)
    return ut


class Behorigheten(unittest.TestCase):
    def setUp(self):
        self.sql = utan_kommentarer(SCHEMAT.read_text(encoding="utf-8"))
        self.funktioner = kroppar(self.sql)

    def test_rollen_ar_en_tabell_bara_service_role_skriver(self):
        self.assertIn("create table if not exists community.admins", self.sql)
        self.assertIn("alter table community.admins enable row level security", self.sql)
        self.assertIn("revoke all on community.admins from anon, authenticated", self.sql)
        # Ingen policy på tabellen: radsäkerhet utan policy släpper ingen rad
        # till någon roll utom service_role, som går förbi den helt.
        self.assertNotRegex(
            self.sql,
            r"create policy \w+ on community\.admins",
            "En policy på community.admins gör behörighetslistan läsbar. Den ska "
            "bara vara det för service_role.",
        )

    def test_varje_beslut_provar_behorigheten_forst(self):
        for namn in BESLUT:
            self.assertIn(namn, self.funktioner, f"{namn} saknas i {SCHEMAT.name}")
            kropp = self.funktioner[namn]
            self.assertIn(
                "perform community.require_admin();",
                kropp,
                f"{namn} prövar inte behörigheten. En security definer-funktion "
                "utan den raden är en knapp vem som helst kan trycka på.",
            )
            # Och den ska stå FÖRST i kroppen, före varje select och update.
            efter_begin = kropp.split("begin", 1)[-1]
            forsta = efter_begin.strip().split("\n", 1)[0].strip()
            self.assertEqual(
                forsta,
                "perform community.require_admin();",
                f"{namn} gör något innan behörigheten prövats.",
            )

    def test_varje_definer_funktion_pinnar_sokvagen(self):
        for traff in re.finditer(
            r"create or replace function (community\.\w+)\s*\(.*?\)(.*?)\n\$\$;",
            self.sql,
            re.S,
        ):
            huvud = traff.group(2).split("as $$", 1)[0]
            if "security definer" not in huvud:
                continue
            self.assertIn(
                "set search_path = ''",
                huvud,
                f"{traff.group(1)} är security definer utan pinnad search_path. "
                "Anroparen kan då styra vilka namn funktionen träffar.",
            )

    def test_ingen_inloggad_roll_far_update(self):
        for tabell in MODERERADE:
            self.assertRegex(
                self.sql,
                r"revoke update on " + re.escape(tabell) + r"\s+from anon, authenticated;",
                f"UPDATE är inte återkallad på {tabell}. Det är den raden som gör "
                "att pending inte kan bli published utom genom en beslutsfunktion.",
            )
        self.assertNotRegex(
            self.sql,
            r"grant[^;]*update[^;]*on community\.\w+[^;]*to authenticated",
            "Någon har gett authenticated UPDATE på en tabell i community. Då är "
            "beslutsfunktionerna inte längre den enda vägen.",
        )

    def test_granskningen_ror_aldrig_kontrolldatan(self):
        # Hygienbedömningen, kontrollhistoriken och utmärkelsen ligger i schemat
        # public. Ingen funktion som en webbläsare kan anropa får skriva där.
        for otillatet in ("public.inspections", "public.establishments", "public.awards"):
            self.assertNotIn(
                otillatet,
                self.sql,
                f"{SCHEMAT.name} rör {otillatet}. Kontrolldatan skrivs bara av "
                "pipelinen med service_role, och det gäller även redaktionen.",
            )


class Klienten(unittest.TestCase):
    def setUp(self):
        self.ts = KLIENTEN.read_text(encoding="utf-8")
        self.astro = SIDAN.read_text(encoding="utf-8")

    def test_ingen_adress_som_villkor(self):
        # En hårdkodad adress i klientkoden ser ut som en spärr och är en
        # gardin: filen laddas ned av vem som helst och kan ändras i en
        # webbläsare på tio sekunder.
        adress = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")
        for namn, kod in (("granska.ts", self.ts), ("granska.astro", self.astro)):
            self.assertIsNone(
                adress.search(kod),
                f"{namn} innehåller en e-postadress. Rollen bor i community.admins "
                "och får aldrig stå som villkor i klientkoden.",
            )

    def test_behorigheten_hamtas_ur_databasen(self):
        self.assertIn("rpc/is_admin", self.ts)

    def test_besluten_gar_genom_funktionerna(self):
        for fn in ("moderate_review", "moderate_image", "moderate_owner_response", "moderate_claim"):
            self.assertIn(
                fn,
                self.ts,
                f"Klienten anropar inte {fn}. Ett beslut som skrivs på annat sätt "
                "går förbi behörighetsprövningen.",
            )
        # Ingen PATCH mot en modererad tabell. Skulle rättigheten en dag råka
        # finnas ska klienten ändå inte ha en väg dit.
        self.assertNotRegex(
            self.ts,
            r"rest\(\s*'PATCH'",
            "granska.ts skriver med PATCH. Besluten ska gå genom "
            "community.moderate_*(), som prövar behörigheten och sätter "
            "moderated_by till den inloggade.",
        )


class Kvoterna(unittest.TestCase):
    """Kvoterna gäller inte den som ska granska dem.

    Fem bilder per dygn, tre per verksamhet och tio öppna finns för att en
    ensam människa ska hinna läsa allt som kommer in. Den människan är
    redaktionen, och en granskare som blockeras av sin egen kö är en spärr som
    skyddar mot fel person.
    """

    def setUp(self):
        self.sql = utan_kommentarer(GEMENSAMT.read_text(encoding="utf-8"))
        self.funktioner = kroppar(self.sql)

    def test_undantaget_finns_och_star_pa_egna_ben(self):
        kropp = self.funktioner.get("community.quota_exempt")
        self.assertIsNotNone(kropp, "community.quota_exempt() saknas.")
        self.assertIn("community.is_admin()", kropp)
        # Filen ska gå att köra på en tom databas, i vilken ordning som helst.
        # schema_admin.sql kommer efter, och ett anrop på en funktion som ännu
        # inte finns får inte fälla varje uppladdning.
        self.assertIn(
            "exception when undefined_function then",
            kropp,
            "quota_exempt() faller om schema_admin.sql inte körts än. Då kan "
            "ingen ladda upp en bild förrän båda filerna körts, i rätt ordning.",
        )

    def test_bara_kvoterna_ar_undantagna(self):
        kropp = self.funktioner["community.set_image_status"]
        # Sökvägskontrollen är ett samband och ingen kvot: utan den kan en rad
        # peka på någon annans fil, och storage-policyn släpper då in en
        # skrivning där. Den ska ligga UTANFÖR undantaget.
        fore = kropp.split("if not fri then", 1)[0]
        self.assertIn(
            "Bildens sökväg hör inte till kontot.",
            fore,
            "Sökvägskontrollen har hamnat innanför kvotundantaget. Den gäller "
            "alla, även redaktionen.",
        )

    def test_statusen_sätts_fortfarande_av_databasen(self):
        # Undantaget får inte ha råkat flytta status-raderna. En admin som
        # laddar upp en bild ska fortfarande få den granskad, inte publicerad.
        kropp = self.funktioner["community.set_image_status"]
        self.assertIn("new.status := 'pending';", kropp)


if __name__ == "__main__":
    unittest.main()
