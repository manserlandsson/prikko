"""Test för rörelsen i beståndet.

Modulen avgör vad sajten påstår om att verksamheter tillkommit och försvunnit,
och varje påstående där är ett vi inte kan ta tillbaka. Fyra fel är värda egna
test, eftersom de alla ser ut som en fungerande sida:

1. Första körningen mot en kommun publicerad som tolvtusen nyöppningar.
2. En omläggning av kommunens register publicerad som trehundra nyöppningar.
3. Ett id-byte publicerat som en nedläggning plus en nyöppning.
4. En registerstädning publicerad som nedläggningar. Uppsala tog 2026-08-07
   bort 114 rader på en gång, varav 113 aldrig burit en enda kontroll.

Körs utan beroenden:  python3 pipeline/tests/test_rorelse.py
"""

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.rorelse import (  # noqa: E402
    BULK,
    GONE,
    NEW,
    RENUMBERED,
    SEED,
    SUCCESSION,
    UNCONTROLLED,
    Record,
    Spell,
    bulk_limit,
    events,
    month_label,
    months_covered,
    normalise_address,
    normalise_name,
    pair_renumbered,
    reconcile,
)


def rec(ident, name, address=None, lat=None, lng=None, controlled=True):
    """Kontrollerad som förval: det är det normala fallet i beståndet.

    Testerna som gäller registerstädning sätter `controlled=False` uttryckligen,
    så att kravet syns där det prövas.
    """
    return Record(ident, name, address, lat, lng, controlled)


def kinds(items):
    return sorted(item.kind for item in items)


# ---------------------------------------------------------------------------
# 1. Första körningen
# ---------------------------------------------------------------------------

class ForstaKorningen(unittest.TestCase):
    def test_allt_ar_utgangslage_och_publiceras_inte(self):
        """Mot en kommun vi aldrig sett är varje id nytt. Inget av det är nyheter."""
        delivery = reconcile(
            "0180",
            [],
            [rec(f"F-0180-{n}", f"Ställe {n}") for n in range(300)],
            observed_at="2026-08-07T02:00:00Z",
            first_delivery=True,
        )
        self.assertEqual(delivery.kind, SEED)
        self.assertEqual(len(delivery.appeared), 300)
        self.assertEqual(delivery.publishable_in, [])
        self.assertEqual(delivery.departed, [])

    def test_tomt_foregaende_bestand_behandlas_som_forsta_korningen(self):
        """En tom jämförelse är alltid ett fel hos oss, aldrig en tom kommun.

        Utan regeln publicerar en misslyckad läsning ur databasen hela
        kommunens bestånd som nyöppnat samma natt.
        """
        delivery = reconcile(
            "0180",
            [],
            [rec("F-0180-a", "Dersch")],
            observed_at="2026-08-07T02:00:00Z",
            first_delivery=False,
        )
        self.assertEqual(delivery.kind, SEED)
        self.assertEqual(delivery.publishable_in, [])


# ---------------------------------------------------------------------------
# 2. Omläggning av registret
# ---------------------------------------------------------------------------

class Omlaggning(unittest.TestCase):
    def test_trehundra_nya_pa_en_natt_ar_ingen_nyhet(self):
        previous = [rec(f"F-0180-{n}", f"Ställe {n}") for n in range(500)]
        delivered = previous + [rec(f"F-0180-ny-{n}", f"Nytt {n}") for n in range(300)]

        delivery = reconcile(
            "0180", previous, delivered,
            observed_at="2026-09-01T02:00:00Z", days_since=1.0,
        )
        self.assertEqual(delivery.kind, BULK)
        self.assertEqual(delivery.publishable_in, [])
        self.assertEqual(kinds(delivery.appeared), [BULK] * 300)

    def test_omlaggningen_sparas_anda(self):
        """Raderna kastas inte. De bär sitt datum och räknas, de publiceras bara inte."""
        previous = [rec(f"F-0180-{n}", f"Ställe {n}") for n in range(500)]
        delivered = previous + [rec(f"F-0180-ny-{n}", f"Nytt {n}") for n in range(300)]
        delivery = reconcile(
            "0180", previous, delivered,
            observed_at="2026-09-01T02:00:00Z", days_since=1.0,
        )
        self.assertEqual(len(delivery.appeared), 300)
        self.assertEqual(delivery.new_count, 300)

    def test_en_handfull_nya_i_stockholm_publiceras(self):
        previous = [rec(f"F-0180-{n}", f"Ställe {n}") for n in range(8511)]
        delivered = previous + [rec(f"F-0180-ny-{n}", f"Nytt {n}") for n in range(3)]
        delivery = reconcile(
            "0180", previous, delivered,
            observed_at="2026-09-01T02:00:00Z", days_since=1.0,
        )
        self.assertEqual(delivery.kind, "normal")
        self.assertEqual(len(delivery.publishable_in), 3)

    def test_liten_kommun_har_lagre_grans_an_stor(self):
        """Sex nya i Svenljunga är sex procent av kommunen. I Stockholm är sex sex."""
        self.assertEqual(bulk_limit(99, 1.0), 5)
        self.assertEqual(bulk_limit(8511, 1.0), 25)

    def test_tjugo_nya_i_svenljunga_ar_en_omlaggning(self):
        previous = [rec(f"F-1381-{n}", f"Ställe {n}") for n in range(99)]
        delivered = previous + [rec(f"F-1381-ny-{n}", f"Nytt {n}") for n in range(20)]
        delivery = reconcile(
            "1381", previous, delivered,
            observed_at="2026-09-01T02:00:00Z", days_since=1.0,
        )
        self.assertEqual(delivery.kind, BULK)

    def test_gransen_skalas_med_uppehallet(self):
        """En körning som stått stilla en månad bär en månads registreringar."""
        self.assertEqual(bulk_limit(8511, 1.0), 25)
        self.assertEqual(bulk_limit(8511, 28.0), 100)
        # Taket håller: ett halvårs uppehåll gör inte en migrering till nyheter.
        self.assertEqual(bulk_limit(8511, 365.0), 100)

    def test_kommunens_egen_takt_far_hoja_gransen(self):
        """En kommun som visar sig registrera mer ska inte tystas av vårt antagande."""
        baseline = [20, 22, 18, 21, 19, 20]
        self.assertGreater(bulk_limit(8511, 1.0, baseline), bulk_limit(8511, 1.0))

    def test_kort_baslinje_far_inte_hoja_gransen(self):
        """Under fem utlämningar är medianen ingen takt, den är en slump."""
        self.assertEqual(bulk_limit(8511, 1.0, [200, 200]), 25)


# ---------------------------------------------------------------------------
# 3. Id-byte
# ---------------------------------------------------------------------------

class IdByte(unittest.TestCase):
    def test_samma_namn_och_adress_ar_ett_id_byte(self):
        previous = [rec("F-0180-gammal", "Pizzeria Roma", "Kungsgatan 12")]
        delivered = [rec("F-0180-ny", "Pizzeria Roma", "Kungsgatan 12")]

        delivery = reconcile(
            "0180", previous, delivered,
            observed_at="2026-09-01T02:00:00Z", days_since=1.0,
        )
        self.assertEqual(delivery.publishable_in, [])
        self.assertEqual(delivery.publishable_out, [])
        self.assertEqual(delivery.appeared[0].kind, RENUMBERED)
        self.assertEqual(delivery.appeared[0].counterpart, "F-0180-gammal")
        self.assertEqual(delivery.departed[0].counterpart, "F-0180-ny")

    def test_bolagsform_hindrar_inte_parning(self):
        previous = [rec("F-0180-gammal", "Pizzeria Roma AB", "Kungsgatan 12")]
        delivered = [rec("F-0180-ny", "Pizzeria Roma", "Kungsgatan 12")]
        delivery = reconcile(
            "0180", previous, delivered,
            observed_at="2026-09-01T02:00:00Z", days_since=1.0,
        )
        self.assertEqual(delivery.appeared[0].kind, RENUMBERED)

    def test_namn_och_koordinat_racker_utan_adress(self):
        previous = [rec("F-0180-gammal", "Dersch", None, 59.3341, 18.0632)]
        delivered = [rec("F-0180-ny", "Dersch", None, 59.33412, 18.06322)]
        delivery = reconcile(
            "0180", previous, delivered,
            observed_at="2026-09-01T02:00:00Z", days_since=1.0,
        )
        self.assertEqual(delivery.appeared[0].kind, RENUMBERED)

    def test_samma_adress_annat_namn_publiceras_inte_heller(self):
        """Ett id-byte och en efterträdare i lokalen går inte att skilja åt.

        Den ena betyder att ingenting hänt, den andra att en verksamhet
        ersatts. Att gissa fel åt något håll ger ett felaktigt påstående på
        sidan, så ingen av dem publiceras.
        """
        previous = [rec("F-0180-gammal", "Pizzeria Roma", "Kungsgatan 12")]
        delivered = [rec("F-0180-ny", "Sushi Zen", "Kungsgatan 12")]
        delivery = reconcile(
            "0180", previous, delivered,
            observed_at="2026-09-01T02:00:00Z", days_since=1.0,
        )
        self.assertEqual(delivery.appeared[0].kind, SUCCESSION)
        self.assertEqual(delivery.departed[0].kind, SUCCESSION)
        self.assertEqual(delivery.publishable_in, [])
        self.assertEqual(delivery.publishable_out, [])

    def test_tvetydig_nyckel_paras_inte(self):
        """Två pizzerior med samma namn på samma gata går inte att skilja åt.

        En gissning där flyttar en kontrollhistorik till fel lokal, vilket är
        dyrare än att låta bli att para.
        """
        pairs = pair_renumbered(
            [rec("a", "Pizzeria Roma", "Kungsgatan 12"),
             rec("b", "Pizzeria Roma", "Kungsgatan 12")],
            [rec("c", "Pizzeria Roma", "Kungsgatan 12")],
        )
        self.assertEqual(pairs, [])

    def test_riktig_nedlaggning_paras_inte_bort(self):
        previous = [
            rec("F-0180-kvar", "Dersch", "Kungsgatan 1"),
            rec("F-0180-borta", "Pizzeria Roma", "Kungsgatan 12"),
        ]
        delivered = [rec("F-0180-kvar", "Dersch", "Kungsgatan 1")]
        delivery = reconcile(
            "0180", previous, delivered,
            observed_at="2026-09-01T02:00:00Z", days_since=1.0,
        )
        self.assertEqual([d.id for d in delivery.publishable_out], ["F-0180-borta"])


# ---------------------------------------------------------------------------
# Bortfallsspärren
# ---------------------------------------------------------------------------

class Bortfall(unittest.TestCase):
    def test_stoppat_bortfall_registreras_inte_som_borta(self):
        """Spärren i load_supabase avpublicerar ingenting vid stort bortfall.

        Då får sidan inte heller säga att de är borta. Annars påstår sidan
        precis det pipelinen samma natt bedömde som en trasig hämtning.
        """
        previous = [rec(f"F-0180-{n}", f"Ställe {n}") for n in range(500)]
        delivered = previous[:100]
        delivery = reconcile(
            "0180", previous, delivered,
            observed_at="2026-09-01T02:00:00Z", days_since=1.0,
            missing_suppressed=True,
        )
        self.assertEqual(delivery.publishable_out, [])
        self.assertEqual(len(delivery.departed), 400)

    def test_uppsala_2026_08_07(self):
        """Det verkliga fallet: 114 rader bort, varav 113 utan en enda kontroll.

        Uppsala rensade sitt register. En sida som skrivit "114 verksamheter
        har försvunnit" hade läst som 114 nedlagda restauranger. Bara den enda
        rad som faktiskt burit en kontroll får publiceras.

        Beståndet är 1 815 rader, alltså ligger 114 saknade under
        avpubliceringsspärren på fem procent, och den fångar dem inte. Det är
        just därför det här villkoret behövs vid sidan av den.
        """
        previous = [rec(f"F-0380-{n}", f"Ställe {n}") for n in range(1701)]
        previous += [
            rec(f"F-0380-tom-{n}", f"Tomt {n}", controlled=False) for n in range(113)
        ]
        previous += [rec("F-0380-riktig", "Pizzeria Roma", "Kungsgatan 12")]

        delivered = previous[:1701]

        delivery = reconcile(
            "0380", previous, delivered,
            observed_at="2026-08-07T02:00:00Z", days_since=1.0,
        )

        self.assertEqual(len(delivery.departed), 114)
        self.assertEqual([d.id for d in delivery.publishable_out], ["F-0380-riktig"])
        self.assertEqual(
            sum(1 for d in delivery.departed if d.kind == UNCONTROLLED), 113
        )

    def test_okontrollerad_rad_publiceras_aldrig_som_borta(self):
        previous = [
            rec("F-0380-a", "Dersch"),
            rec("F-0380-b", "Aldrig kontrollerad", controlled=False),
        ]
        delivered = [rec("F-0380-a", "Dersch")]
        delivery = reconcile(
            "0380", previous, delivered,
            observed_at="2026-08-07T02:00:00Z", days_since=1.0,
        )
        self.assertEqual(delivery.departed[0].kind, UNCONTROLLED)
        self.assertEqual(delivery.publishable_out, [])

    def test_kravet_galler_inte_at_andra_hallet(self):
        """En nyregistrerad verksamhet har sällan hunnit få en kontroll.

        Att den dykt upp i registret är hela beskedet, och det färskaste
        sajten har. Kravet på en kontroll gäller bara försvinnanden.
        """
        previous = [rec(f"F-0380-{n}", f"Ställe {n}") for n in range(500)]
        delivered = previous + [rec("F-0380-ny", "Nyöppnad", controlled=False)]
        delivery = reconcile(
            "0380", previous, delivered,
            observed_at="2026-08-07T02:00:00Z", days_since=1.0,
        )
        self.assertEqual([a.id for a in delivery.publishable_in], ["F-0380-ny"])

    def test_omlaggning_stoppar_ocksa_forsvinnandena(self):
        """Byter kommunen id-serie försvinner hela det gamla beståndet på en natt."""
        previous = [rec(f"F-0180-gammal-{n}", f"Ställe {n}") for n in range(200)]
        delivered = [rec(f"F-0180-ny-{n}", f"Annat {n}") for n in range(200)]
        delivery = reconcile(
            "0180", previous, delivered,
            observed_at="2026-09-01T02:00:00Z", days_since=1.0,
        )
        self.assertEqual(delivery.kind, BULK)
        self.assertEqual(delivery.publishable_in, [])
        self.assertEqual(delivery.publishable_out, [])


# ---------------------------------------------------------------------------
# Bekräftelse innan publicering
# ---------------------------------------------------------------------------

class Bekraftelse(unittest.TestCase):
    def test_ett_enda_sikte_publiceras_inte(self):
        """En rad som är borta igen nästa natt var ett hål i föregående hämtning."""
        spell = Spell("F-0180-a", "0180", "2026-09-01T02:00:00Z", NEW,
                      last_seen_at="2026-09-01T02:00:00Z", sightings=1)
        self.assertEqual(events([spell]), [])

    def test_tva_sikten_publiceras(self):
        spell = Spell("F-0180-a", "0180", "2026-09-01T02:00:00Z", NEW,
                      last_seen_at="2026-09-02T02:00:00Z", sightings=2)
        found = events([spell])
        self.assertEqual([e.kind for e in found], ["ny"])
        self.assertEqual(found[0].observed_on, "2026-09-01")

    def test_en_enda_franvaro_publiceras_inte(self):
        spell = Spell("F-0180-a", "0180", "2026-08-01T02:00:00Z", NEW,
                      last_seen_at="2026-09-01T02:00:00Z", sightings=30,
                      gone_at="2026-09-02T02:00:00Z", disappearance=GONE, absences=1)
        self.assertEqual([e.kind for e in events([spell])], ["ny"])

    def test_id_byte_publiceras_aldrig_hur_lange_det_an_star(self):
        spell = Spell("F-0180-a", "0180", "2026-08-01T02:00:00Z", RENUMBERED,
                      last_seen_at="2026-09-01T02:00:00Z", sightings=30)
        self.assertEqual(events([spell]), [])

    def test_utgangslaget_publiceras_aldrig(self):
        spell = Spell("F-0180-a", "0180", "2026-08-01T02:00:00Z", SEED,
                      last_seen_at="2026-09-01T02:00:00Z", sightings=30)
        self.assertEqual(events([spell]), [])

    def test_sorteras_pa_datum_och_ingenting_annat(self):
        spells = [
            Spell("F-0180-b", "0180", "2026-07-01T02:00:00Z", NEW,
                  last_seen_at="2026-09-01T02:00:00Z", sightings=9),
            Spell("F-0180-a", "0180", "2026-09-01T02:00:00Z", NEW,
                  last_seen_at="2026-09-05T02:00:00Z", sightings=4),
        ]
        self.assertEqual(
            [e.observed_on for e in events(spells)], ["2026-09-01", "2026-07-01"]
        )


# ---------------------------------------------------------------------------
# Presentation
# ---------------------------------------------------------------------------

class Manader(unittest.TestCase):
    def test_manader_nyast_forst(self):
        spells = [
            Spell("a", "0180", "2026-07-14T02:00:00Z", NEW,
                  last_seen_at="2026-09-01T02:00:00Z", sightings=9),
            Spell("b", "0180", "2026-09-02T02:00:00Z", NEW,
                  last_seen_at="2026-09-05T02:00:00Z", sightings=4),
        ]
        self.assertEqual(months_covered(spells), ["2026-09", "2026-07"])

    def test_manadsetikett(self):
        self.assertEqual(month_label("2026-08"), "augusti 2026")
        self.assertEqual(month_label("2026-01"), "januari 2026")


class Normalisering(unittest.TestCase):
    def test_diakriter_och_skiljetecken(self):
        self.assertEqual(normalise_name("Kött & Bröd AB"), "kott brod")
        self.assertEqual(normalise_address("Kungsgatan 12,  Stockholm"), "kungsgatan 12 stockholm")

    def test_tomt_varde(self):
        self.assertEqual(normalise_name(None), "")
        self.assertEqual(normalise_address(""), "")


# ---------------------------------------------------------------------------
# 5. Uppskjutna sviter
# ---------------------------------------------------------------------------

class UppskjutnaSviter(unittest.TestCase):
    """Sviten för en NY verksamhet kan inte skrivas när den räknas fram.

    `establishment_spells.establishment_id` pekar med en främmande nyckel på
    `establishments.id`, och den raden finns inte förrän `load_supabase.py`
    har kört. Jämförelsen måste ändå ske före inläsningen, annars jämförs
    utlämningen med sig själv. Nattjobbet föll på den motsättningen i tolv
    nätter: sex av nio kommuner tappades varje natt på 409 23503.

    Testerna nedan prövar delningen, alltså att sviterna verkligen läggs åt
    sidan i stället för att skrivas, och att andra halvan skriver dem och
    städar upp efter sig.
    """

    def setUp(self):
        import importlib.util
        import tempfile

        spec = importlib.util.spec_from_file_location(
            "rorelse_cli", Path(__file__).resolve().parents[1] / "rorelse.py"
        )
        self.cli = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.cli)
        self.tmp = Path(tempfile.mkdtemp())

    def test_sviterna_skrivs_i_hundratal_och_filen_tas_bort(self):
        skrivna = []

        class FalskKlient:
            def select_all(self, table, query):
                return []

            def insert(self, table, rows):
                skrivna.append((table, len(rows)))

        fil = self.tmp / "uppskjutna.json"
        rader = [{"establishment_id": f"F-{i}"} for i in range(250)]
        fil.write_text(json.dumps(rader), encoding="utf-8")

        self.cli.skriv_sviter(fil, FalskKlient())

        self.assertEqual(skrivna, [("establishment_spells", 100)] * 2
                         + [("establishment_spells", 50)])
        # Ligger filen kvar skrivs gårdagens sviter en gång till i natt.
        self.assertFalse(fil.exists())

    def test_en_fil_som_inte_finns_ar_inget_fel(self):
        """Steget körs varje natt, även de nätter ingenting rörde sig."""
        class Exploderar:
            def insert(self, table, rows):
                raise AssertionError("skulle inte ha skrivit något")

        self.cli.skriv_sviter(self.tmp / "finns-inte.json", Exploderar())

    def test_tom_lista_skriver_ingenting_men_stadar(self):
        class Exploderar:
            def select_all(self, table, query):
                return []

            def insert(self, table, rows):
                raise AssertionError("skulle inte ha skrivit något")

        fil = self.tmp / "tom.json"
        fil.write_text("[]", encoding="utf-8")
        self.cli.skriv_sviter(fil, Exploderar())
        self.assertFalse(fil.exists())

    def test_en_redan_oppen_svit_hoppas_over_i_stallet_for_att_falla(self):
        """En omkörning ska inte falla på spärren mot dubbla öppna sviter.

        `establishment_spells_open_idx` tillåter högst en öppen svit per id.
        Går en natt sönder mellan registreringen och skrivningen räknas samma
        rader fram igen nästa gång och stöter på sviten som redan finns.
        Steget föll då på 409 23505 och tog hela nattens data med sig, vilket
        hände 2026-08-15. En svit som redan är öppen ÄR redan registrerad.
        """
        skrivna = []

        class FalskKlient:
            def select_all(self, table, query):
                return [{"establishment_id": "F-1"}]

            def insert(self, table, rows):
                skrivna.extend(rows)

        fil = self.tmp / "delvis.json"
        fil.write_text(
            json.dumps([{"establishment_id": "F-1"}, {"establishment_id": "F-2"}]),
            encoding="utf-8",
        )
        self.cli.skriv_sviter(fil, FalskKlient())

        self.assertEqual(skrivna, [{"establishment_id": "F-2"}])
        self.assertFalse(fil.exists())


if __name__ == "__main__":
    unittest.main()
