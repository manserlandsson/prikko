"""Prov för Stockholms registreringsintyg.

    python3 pipeline/tests/test_stockholmsintyg.py

Ingen HTML nedan är påhittad. Varje utdrag är hämtat med curl 2026-08-25 ur
stadens egen e-tjänst och sedan beskuret till de tre tabellerna, med indraget
och de dubbla mellanslagen orörda, eftersom det är just formen som parsern ska
tåla. Se prikko/stockholmsintyg.py.

DET FALL SOM BÄR ALLA ANDRA är personnumret. Fältet heter
"Person/Organisationsnummer" och innehåller innehavarens personnummer när
verksamheten drivs som enskild firma. 13 av 150 slumpade intyg gjorde det,
mätt samma dag. Ett spår som skriver av fältet rakt av publicerar alltså
personnummer på ungefär var tolfte sida, och det går inte att ta tillbaka när
sidan är indexerad.
"""

import json
import re
import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko import stockholmsintyg as si  # noqa: E402


def intygssida(rader: str) -> str:
    """Sidans skal runt tabellraderna, ordagrant ur svaret."""
    return f"""<!DOCTYPE html><html lang="sv"><body role="document">
    <div id="content" class="container container-sg3x" role="main">
    <div id="mainContent" class="col-xs-12 col-sm-12 col-md-12">
        <div class="page-header"><h1 class="h1-sg3x">Registreringsintyg</h1></div>
        <div class="row" id="registrationTableContent">
        <table class="table table-striped table-bordered table--color-vasastan">
            <caption class="hit__heading hit__heading--transparent">Bolagsinformation</caption>
            <tbody>{rader}</tbody>
        </table>
        </div>
    </div>
    </div>
    </body></html>"""


#: Allegrine, Kammakargatan 22, id 48c4ef0c-ba92-4093-a437-bfe1d85088fe.
#: Hela intyget, beskuret till raderna. Notera att "Inriktning" är TOM och att
#: cellerna bär radbrytningar och indrag.
ALLEGRINE = intygssida("""
                                <tr>
                                    <th class="pull-left" scope="row">Namn p&#229; verksamhet</th>
                                    <td>Allegrine</td>
                                </tr>
                                <tr>
                                    <th class="pull-left" scope="row">Person/Organisationsnummer</th>
                                        <td>559130-2442</td>
                                </tr>
                                <tr>
                                    <th class="pull-left" scope="row">Bes&#246;ksadress</th>
                                    <td>Kammakargatan 22</td>
                                </tr>
                                <tr>
                                    <th class="pull-left" scope="row">Livsmedelsf&#246;retagare</th>
                                    <td>
                                        Restaurang Kammakargatan 22 AB
                                    </td>
                                </tr>
                                <tr>
                                    <th class="pull-left" scope="row">Postadress</th>
                                    <td>Kammakargatan 22</td>
                                </tr>
                                <tr>
                                    <th class="pull-left" scope="row">Postnummer</th>
                                    <td>111 40</td>
                                </tr>
                                <tr>
                                    <th class="pull-left" scope="row">Ort</th>
                                    <td>Stockholm</td>
                                </tr>
                                <tr>
                                    <th class="pull-left" scope="row">Status</th>
                                    <td>Aktiv</td>
                                </tr>
                                <tr>
                                    <th class="pull-left" scope="row">Inriktning</th>
                                    <td>
                                    </td>
                                </tr>
                                <tr>
                                    <th class="pull-left" scope="row">Registreringsdatum</th>
                                    <td>2018-02-09</td>
                                </tr>
                                <tr>
                                    <th class="pull-left" scope="row">Huvudsaklig Inriktning</th>
                                    <td>Sista led</td>
                                </tr>
                                <tr>
                                    <th class="pull-left" scope="row" style="border:none;">Verksamhetstyper och huvudaktiviteter</th>
                                    <td>
                                        Restaurang-, catering- och barverksamhet
                                        <br />
                                        Servering av livsmedel
                                    </td>
                                </tr>
                                <tr>
                                    <th class="pull-left" scope="row" style="border:none;">Alla aktiviteter</th>
                                    <td>
Bakning                                                <br />
Frysf&#246;rvaring av livsmedel                                                <br />
Hantering av of&#246;rpackad r&#229; fisk                                                <br />
                                    </td>
                                </tr>
                                <tr>
                                    <th class="pull-left" scope="row">Omfattning</th>
                                    <td>Mellan</td>
                                </tr>
                                <tr>
                                    <th class="pull-left" scope="row">God efterlevnad</th>
                                    <td>Ja</td>
                                </tr>
                                <tr>
                                    <th class="pull-left" scope="row">Tredjepartscertifiering</th>
                                    <td>Nej</td>
                                </tr>
                                <tr>
                                    <th class="pull-left" scope="row">Beslutsdatum f&#246;r riskklassning</th>
                                    <td>2024-01-01</td>
                                </tr>
                                <tr>
                                    <th class="pull-left" scope="row">Beslutad kontrollfrekvens per 5 &#229;r</th>
                                    <td>5</td>
                                </tr>
""")

#: Pressbyrån 4308139, id c6a477fa-3ad7-4c0b-9935-785b0db8553a. Posten FANNS i
#: vår karta 2026-08-17 och är borta ur kommunens uttag i dag. Intyget svarar
#: fortfarande, och säger själv varför. Det är hela nedlagt-oraklet.
UPPHORD = intygssida("""
                                <tr>
                                    <th class="pull-left" scope="row">Namn p&#229; verksamhet</th>
                                    <td>Pressbyr&#229;n 4308139/ Upph&#246;rd</td>
                                </tr>
                                <tr>
                                    <th class="pull-left" scope="row">Person/Organisationsnummer</th>
                                        <td>556985-7427</td>
                                </tr>
                                    <tr>
                                        <th class="pull-left" scope="row">c/o</th>
                                        <td>Pressbyr&#229;n  Centralen &#214;ver Hallen</td>
                                    </tr>
                                <tr>
                                    <th class="pull-left" scope="row">Postnummer</th>
                                    <td>111 20</td>
                                </tr>
                                <tr>
                                    <th class="pull-left" scope="row">Status</th>
                                    <td>Inaktiv</td>
                                </tr>
                                <tr>
                                    <th class="pull-left" scope="row">Registreringsdatum</th>
                                    <td>2017-06-14</td>
                                </tr>
""")

#: Ett guid staden inte känner igen. Svarar 200, inte 404.
SAKNAS = """<!DOCTYPE html><html lang="sv"><body role="document">
    <div id="mainContent" class="col-xs-12 col-sm-12 col-md-12">
        <div class="page-header"><h1 class="h1-sg3x">Registreringsintyg</h1></div>
        <div class="row" id="registrationTableContent">
            <div class="col-md-12">
                <br />
                <h3>Inget data kunde hittas f&#246;r den h&#228;r anl&#228;ggningen</h3>
                <br />
            </div>
        </div>
    </div>
    </body></html>"""


class Nyckeln(unittest.TestCase):
    """Vårt id ÄR stadens foodplaceid, minus prefixet."""

    def test_prefixet_klipps(self):
        self.assertEqual(
            si.guid("F-0180-48c4ef0c-ba92-4093-a437-bfe1d85088fe"),
            "48c4ef0c-ba92-4093-a437-bfe1d85088fe",
        )

    def test_lanken_bygger_pa_guiden_och_inte_pa_hela_idt(self):
        self.assertEqual(
            si.intygslank("F-0180-48c4ef0c-ba92-4093-a437-bfe1d85088fe"),
            "https://etjanster.stockholm.se/livsmedelsinspektioner/registration"
            "?foodplaceid=48c4ef0c-ba92-4093-a437-bfe1d85088fe",
        )

    def test_annan_kommun_ger_fel_och_inte_ett_trasigt_guid(self):
        """Örebro har också guid som id. Ett tyst felslag hade gett 500."""
        with self.assertRaises(ValueError):
            si.guid("F-1880-d463a4c7-0e9a-4def-bcaa-a89ca91ab001")


class Lasning(unittest.TestCase):
    def setUp(self):
        self.i = si.las(ALLEGRINE, "48c4ef0c-ba92-4093-a437-bfe1d85088fe")

    def test_alla_enkla_falt(self):
        self.assertEqual(self.i.namn, "Allegrine")
        self.assertEqual(self.i.nummer, "559130-2442")
        self.assertEqual(self.i.besoksadress, "Kammakargatan 22")
        self.assertEqual(self.i.livsmedelsforetagare, "Restaurang Kammakargatan 22 AB")
        self.assertEqual(self.i.ort, "Stockholm")
        self.assertEqual(self.i.huvudsaklig_inriktning, "Sista led")
        self.assertEqual(self.i.omfattning, "Mellan")
        self.assertEqual(self.i.kontrollfrekvens, 5)

    def test_postnumret_tappar_mellanslaget(self):
        """"111 40" blir "11140", samma form som Oskarshamns PostNr."""
        self.assertEqual(self.i.postnummer, "11140")

    def test_datum_blir_datum_och_inte_strang(self):
        self.assertEqual(self.i.registreringsdatum, date(2018, 2, 9))
        self.assertEqual(self.i.riskklassbeslut, date(2024, 1, 1))

    def test_ja_och_nej_blir_sant_och_falskt(self):
        self.assertIs(self.i.god_efterlevnad, True)
        self.assertIs(self.i.tredjepartscertifiering, False)
        self.assertIs(self.i.aktiv, True)

    def test_flervarda_celler_delas_pa_radbrytningen(self):
        """En cell med <br /> är en LISTA och inte en sträng med skräp i."""
        self.assertEqual(
            self.i.verksamhetstyper,
            ("Restaurang-, catering- och barverksamhet", "Servering av livsmedel"),
        )
        self.assertEqual(
            self.i.aktiviteter,
            ("Bakning", "Frysförvaring av livsmedel", "Hantering av oförpackad rå fisk"),
        )

    def test_tom_cell_ger_none_och_inte_tom_strang(self):
        """"Inriktning" är tom på alla 150 mätta. Tom sträng hade skrivits ut."""
        self.assertIsNone(self.i.inriktning)

    def test_inga_okanda_etiketter(self):
        self.assertEqual(self.i.okanda_falt, ())


class Upphord(unittest.TestCase):
    """Intyget är ett nedlagt-orakel som gäller 8 520 av 16 047 rader.

    Kommunen säger själv att registreringen upphört, per id och i klartext.
    Det är ett starkare underlag än SCB:s arbetsställeregister, och det kräver
    varken certifikat eller adressmatchning. Se docs/25 och docs/35.
    """

    def setUp(self):
        self.i = si.las(UPPHORD, "c6a477fa-3ad7-4c0b-9935-785b0db8553a")

    def test_status_inaktiv_blir_falskt(self):
        self.assertIs(self.i.aktiv, False)

    def test_intyget_svarar_aven_for_en_post_kommunen_tagit_bort(self):
        """Raden försvann ur kartuttaget mellan 2026-08-17 och 2026-08-25."""
        self.assertEqual(self.i.nummer, "556985-7427")
        self.assertEqual(self.i.registreringsdatum, date(2017, 6, 14))

    def test_dubbla_mellanslag_stads_bort(self):
        """Cellen bär "Pressbyrån  Centralen", två mellanslag, ur källan."""
        self.assertEqual(self.i.co, "Pressbyrån Centralen Över Hallen")


class SaknatIntyg(unittest.TestCase):
    def test_okant_guid_ger_none_och_inte_ett_undantag(self):
        """Sidan svarar 200 med en rubrik. Spåret ska degradera tyst.

        Ett id som blivit fel får inte fälla en körning på 8 520 sidor.
        """
        self.assertIsNone(si.las(SAKNAS, "00000000-0000-0000-0000-000000000000"))


class OkandaVarden(unittest.TestCase):
    """Ett okänt värde i ett fält som styr ett besked stannar körningen.

    Samma hållning som sources.stockholm.UnknownSourceValue. Status avgör om
    vi säger att en verksamhet upphört; "God efterlevnad" är kommunens egen
    bedömning. Ett tyst default är precis det fel som förstör förtroendet.
    """

    def test_okand_status(self):
        html = intygssida(
            '<tr><th scope="row">Namn p&#229; verksamhet</th><td>X</td></tr>'
            '<tr><th scope="row">Status</th><td>Vilande</td></tr>'
        )
        with self.assertRaises(si.OkantVarde):
            si.las(html, "x")

    def test_okand_efterlevnad(self):
        html = intygssida(
            '<tr><th scope="row">Namn p&#229; verksamhet</th><td>X</td></tr>'
            '<tr><th scope="row">God efterlevnad</th><td>Delvis</td></tr>'
        )
        with self.assertRaises(si.OkantVarde):
            si.las(html, "x")

    def test_ny_etikett_stannar_inte_korningen_men_syns(self):
        """En rad staden lägger till är en nyhet, inte ett haveri.

        Skillnaden mot Status: en okänd ETIKETT kan inte få oss att påstå
        något felaktigt, den kan bara få oss att missa något. Då är rätt svar
        att fortsätta och skriva ut den, se pipeline/stockholmsintyg.py.
        """
        html = intygssida(
            '<tr><th scope="row">Namn p&#229; verksamhet</th><td>X</td></tr>'
            '<tr><th scope="row">Kontrollavgift</th><td>4 500 kr</td></tr>'
        )
        i = si.las(html, "x")
        self.assertEqual(i.namn, "X")
        self.assertEqual(i.okanda_falt, ("Kontrollavgift",))


class Personnummer(unittest.TestCase):
    """Regeln: ett organisationsnummer har alltid minst 2 som tredje siffra.

    Ett personnummer bär ÅÅMMDD, och månadens första siffra är 0 eller 1.
    Samordningsnummer lägger 60 till DAGEN och rör inte den tredje siffran.
    """

    def test_riktiga_organisationsnummer_slapps_igenom(self):
        # Alla fyra står i vårt eget underlag eller i docs/12.
        for nummer in (
            "559130-2442",  # Restaurang Kammakargatan 22 AB
            "556985-7427",  # Allc Servicehandel AB
            "212000-0142",  # Stockholms kommun, 28 skol- och förskolekök
            "802000-7046",  # Alberts Cafe och Bar, docs/12 avsnitt A1
        ):
            with self.subTest(nummer=nummer):
                self.assertFalse(si.ar_personnummer(nummer))

    def test_personnummer_falls(self):
        # Skatteverkets egna testnummer, aldrig utdelade till en person.
        for nummer in ("640823-3234", "121212-1212"):
            with self.subTest(nummer=nummer):
                self.assertTrue(si.ar_personnummer(nummer))

    def test_okand_form_behandlas_som_personlig(self):
        """Vet vi inte vad numret är publicerar vi det inte.

        Det försiktiga svaret är asymmetriskt med flit: att missa ett orgnr
        kostar ett tomt fält, att publicera ett personnummer kostar allt.
        """
        # "196408233234" är ett personnummer i tolvsiffrig form. Det faller på
        # längdregeln och inte på månadsregeln, och det är ändå rätt svar:
        # samtliga 150 mätta intyg skriver tio siffror med bindestreck, så en
        # annan längd betyder att formen ändrats och att regeln ska läsas om.
        for nummer in ("", "559130", "5591302442123", "196408233234", "okänt"):
            with self.subTest(nummer=nummer):
                self.assertTrue(si.ar_personnummer(nummer))

    def test_gransen_gar_vid_tvaan(self):
        self.assertTrue(si.ar_personnummer("551930-2442"))
        self.assertFalse(si.ar_personnummer("552930-2442"))


class Foretagsform(unittest.TestCase):
    def test_formen_bars_utan_att_numret_gor_det(self):
        self.assertEqual(si.foretagsform("559130-2442"), "aktiebolag")
        self.assertEqual(si.foretagsform("212000-0142"), "stat_kommun")
        self.assertEqual(si.foretagsform("802000-7046"), "ideell_forening")
        self.assertEqual(si.foretagsform("640823-3234"), "enskild")
        self.assertIsNone(si.foretagsform(None))


class Raden(unittest.TestCase):
    """Raden som får publiceras, och det som aldrig får följa med."""

    def test_organisationsnummer_skrivs_ut(self):
        rad = si.raden(si.las(ALLEGRINE, "x"), date(2026, 8, 25))
        self.assertEqual(rad["orgnr"], "559130-2442")
        self.assertEqual(rad["companyForm"], "aktiebolag")
        self.assertEqual(rad["operator"], "Restaurang Kammakargatan 22 AB")
        self.assertEqual(rad["postalCode"], "11140")
        self.assertEqual(rad["registeredAt"], "2018-02-09")
        self.assertEqual(rad["frequency"], 5)
        self.assertIs(rad["active"], True)
        self.assertEqual(rad["checkedAt"], "2026-08-25")

    def test_personnummer_halls_inne_men_formen_bars(self):
        """13 av 150 slumpade intyg bar ett personnummer i fältet."""
        html = intygssida(
            '<tr><th scope="row">Namn p&#229; verksamhet</th><td>Enskild firma</td></tr>'
            '<tr><th scope="row">Person/Organisationsnummer</th><td>640823-3234</td></tr>'
            '<tr><th scope="row">Livsmedelsf&#246;retagare</th><td>Firma X</td></tr>'
        )
        rad = si.raden(si.las(html, "x"), date(2026, 8, 25))
        self.assertIsNone(rad["orgnr"])
        self.assertEqual(rad["companyForm"], "enskild")
        # Uppgiften som ÄR nyttig följer ändå med.
        self.assertEqual(rad["operator"], "Firma X")

    def test_hela_raden_ar_json_utan_datumobjekt(self):
        """Raden ska gå rakt in i site/src/data utan en egen serialiserare."""
        import json

        rad = si.raden(si.las(ALLEGRINE, "x"), date(2026, 8, 25))
        self.assertEqual(json.loads(json.dumps(rad)), rad)


class IngetPersonnummerILevererad(unittest.TestCase):
    """Sållet prövas mot HELA det incheckade beståndet, inte mot ett urval.

    Proven ovan visar att `raden` gör rätt på de fall som står i den här
    filen. Det här provet visar att ingenting FAKTISKT läckt ut, och det är en
    annan fråga: sållet kan vara riktigt och ändå kringgås av ett spår som
    skriver fältet utan att gå genom `raden`.

    Regeln som prövas är den enda som gäller: tio siffror med 0 eller 1 som
    tredje är ett födelsedatums månad och alltså en fysisk person. Sökningen
    går över varje sträng i varje `registration`, och inte bara över `orgnr`,
    eftersom ett personnummer som hamnat i fel fält är precis lika publicerat.

    Faller provet ska INGENTING rättas i efterhand utan att raderna först tas
    bort ur filen. Ett personnummer som en gång stått i ett bygge går inte att
    ta tillbaka.
    """

    DATA = Path(__file__).resolve().parents[2] / "site" / "src" / "data"

    #: Tio siffror i följd, med eller utan bindestreck, var som helst i en
    #: sträng. Bredare än fältets egen form med flit: provet ska hitta numret
    #: även om det ligger inbakat i ett namn eller en fritext.
    TIOSIFFRIGT = re.compile(r"(?<!\d)(\d{6})[-+]?(\d{4})(?!\d)")

    def _strangar(self, varde):
        """Varje sträng i ett godtyckligt JSON-värde, hur djupt det än ligger."""
        if isinstance(varde, str):
            yield varde
        elif isinstance(varde, dict):
            for v in varde.values():
                yield from self._strangar(v)
        elif isinstance(varde, list):
            for v in varde:
                yield from self._strangar(v)

    def test_ingen_registerrad_bar_ett_personnummer(self):
        filer = sorted(self.DATA.glob("*.json"))
        self.assertTrue(filer, f"hittade inga datafiler i {self.DATA}")

        granskade = 0
        traffar = []
        for path in filer:
            payload = json.loads(path.read_text(encoding="utf-8"))
            for rad in payload.get("establishments", []):
                reg = rad.get("registration")
                if not reg:
                    continue
                granskade += 1
                for text in self._strangar(reg):
                    for match in self.TIOSIFFRIGT.finditer(text):
                        if si.ar_personnummer(match.group(0)):
                            traffar.append((path.name, rad.get("id")))

        self.assertEqual(
            traffar,
            [],
            f"personnummer i {len(traffar)} av {granskade} registerrader: "
            f"{traffar[:5]}",
        )

    def test_numret_halls_inne_pa_varje_enskild_firma(self):
        """Andra sidan av samma mynt: formen bärs, numret gör det inte.

        Utan det här provet skulle en fil utan en enda `registration` klara
        provet ovan, och beviset vore värdelöst. Här prövas att raderna som
        FAKTISKT bär en enskild firma också saknar nummer.
        """
        for path in sorted(self.DATA.glob("*.json")):
            payload = json.loads(path.read_text(encoding="utf-8"))
            for rad in payload.get("establishments", []):
                reg = rad.get("registration") or {}
                if reg.get("companyForm") != "enskild":
                    continue
                with self.subTest(id=rad.get("id")):
                    self.assertIsNone(
                        reg.get("orgnr"),
                        "enskild firma får aldrig bära ett nummer",
                    )


if __name__ == "__main__":
    unittest.main(verbosity=2)
