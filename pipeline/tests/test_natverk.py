"""Tester för arkivet och för Uppsalas listradsnyckel.

Arkivet är den kod i pipelinen som kan göra datan FEL utan att något faller:
lämnar det ut gårdagens svar för en resurs som ändrats publicerar vi ett
inaktuellt hygienomdöme om en namngiven verksamhet, och ingenting larmar.
Testerna här handlar därför nästan bara om det: att en ändrad nyckel aldrig
kan träffa en gammal post, och att en post som inte längre hör till beståndet
gallras bort.

Ingenting går över nätet.

Kör:  python3 -m pytest pipeline/tests/test_natverk.py
"""

import gzip
import io
import sys
import tempfile
import unittest
import urllib.request
import urllib.response
from datetime import date
from email.message import Message
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.natverk import Arkiv, _Uppackare  # noqa: E402


class ArkivTest(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.rot = Path(self._tmp.name)

    def tearDown(self):
        self._tmp.cleanup()

    def arkiv(self, namnrymd="prov"):
        return Arkiv(self.rot, namnrymd)

    def test_kall_lasning_ger_ingenting(self):
        a = self.arkiv()
        self.assertIsNone(a.las("adress"))
        self.assertEqual((a.traffar, a.missar), (0, 1))

    def test_skriven_post_lases_tillbaka_av_nasta_korning(self):
        self.arkiv().skriv("adress", b"kroppen")
        b = self.arkiv()
        self.assertEqual(b.las("adress"), b"kroppen")
        self.assertEqual((b.traffar, b.missar), (1, 0))

    def test_en_andrad_nyckel_traffar_aldrig_den_gamla_posten(self):
        """Hela poängen med Uppsalas listradsnyckel.

        Ändras raden ska svaret hämtas, inte läsas ur arkivet.
        """
        self.arkiv().skriv("id\0Senaste kontroll: 2026-09-01", b"gammal sida")
        b = self.arkiv()
        self.assertIsNone(b.las("id\0Senaste kontroll: 2026-09-25"))

    def test_namnrymder_delar_inte_poster(self):
        self.arkiv("uppsala").skriv("samma", b"uppsalas")
        self.assertIsNone(self.arkiv("orebro").las("samma"))

    def test_formatversionen_ingar_i_nyckeln(self):
        """Höjs FORMAT ska hela arkivet bli ogiltigt utan att någon tömmer det."""
        a = self.arkiv()
        a.skriv("adress", b"kroppen")
        fil = a._fil("adress")
        self.assertTrue(fil.exists())

        class Nytt(Arkiv):
            FORMAT = "2"

        self.assertIsNone(Nytt(self.rot, "prov").las("adress"))

    def test_trasig_post_raknas_som_miss_och_fäller_inte(self):
        a = self.arkiv()
        a.skriv("adress", b"kroppen")
        a._fil("adress").write_bytes(b"inte gzip alls")
        b = self.arkiv()
        self.assertIsNone(b.las("adress"))
        self.assertEqual(b.missar, 1)

    def test_gallring_tar_det_orörda_och_behåller_det_lästa(self):
        a = self.arkiv()
        a.skriv("kvar", b"x")
        a.skriv("bort", b"y")

        b = self.arkiv()
        b.las("kvar")               # rörd, ska stå kvar
        self.assertEqual(b.gallra(), 1)

        c = self.arkiv()
        self.assertEqual(c.las("kvar"), b"x")
        self.assertIsNone(c.las("bort"))

    def test_gallring_stadar_bort_rester_efter_en_avbruten_skrivning(self):
        a = self.arkiv()
        a.skriv("kvar", b"x")
        rest = a._fil("kvar").with_suffix(".abc.del")
        rest.write_bytes(b"halv")
        b = self.arkiv()
        b.las("kvar")
        b.gallra()
        self.assertFalse(rest.exists())

    def test_utan_katalog_är_arkivet_avstängt(self):
        a = Arkiv(None, "prov")
        a.skriv("adress", b"kroppen")
        self.assertIsNone(a.las("adress"))
        self.assertEqual(a.gallra(), 0)

    def test_innehallet_lagras_packat(self):
        a = self.arkiv()
        kropp = b"en detaljsida " * 5000
        a.skriv("adress", kropp)
        pa_disk = a._fil("adress").stat().st_size
        self.assertLess(pa_disk, len(kropp) / 10)
        self.assertEqual(gzip.decompress(a._fil("adress").read_bytes()), kropp)


class UppackareTest(unittest.TestCase):
    """Packningen får ändra transporten och ingenting annat."""

    def svar(self, kropp, encoding=None):
        huvuden = Message()
        if encoding:
            huvuden["Content-Encoding"] = encoding
        huvuden["Content-Length"] = str(len(kropp))
        svar = urllib.response.addinfourl(
            io.BytesIO(kropp), huvuden, "https://exempel.se", 200
        )
        svar.msg = "OK"
        return svar

    def test_gzip_packas_upp(self):
        rak = "Senaste omdöme: Utan avvikelse".encode("utf-8")
        ut = _Uppackare().http_response(None, self.svar(gzip.compress(rak), "gzip"))
        self.assertEqual(ut.read(), rak)
        self.assertIsNone(ut.headers.get("Content-Encoding"))
        self.assertEqual(ut.headers.get("Content-Length"), str(len(rak)))
        self.assertEqual(ut.status, 200)

    def test_opackat_svar_rörs_inte(self):
        rak = b"rakt igenom"
        svar = self.svar(rak)
        self.assertIs(_Uppackare().http_response(None, svar), svar)

    def test_accept_encoding_sätts_men_skriver_inte_över_anroparens(self):
        u = _Uppackare()
        r1 = urllib.request.Request("https://exempel.se")
        u.http_request(r1)
        self.assertEqual(r1.get_header("Accept-encoding"), "gzip")

        r2 = urllib.request.Request(
            "https://exempel.se", headers={"Accept-Encoding": "identity"}
        )
        u.http_request(r2)
        self.assertEqual(r2.get_header("Accept-encoding"), "identity")


class UppsalaGolvTest(unittest.TestCase):
    """Golvet ska täcka HELA beståndet på GOLV_DAGAR nätter, inte nästan.

    Utan den garantin kan en verksamhet vars listrad aldrig ändras stå kvar på
    en gammal detaljsida hur länge som helst, och det är precis den tysta
    åldrandet arkivet inte får införa.
    """

    def setUp(self):
        import importlib.util

        sok = Path(__file__).resolve().parents[1] / "fetch_uppsala.py"
        spec = importlib.util.spec_from_file_location("fetch_uppsala", sok)
        self.mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.mod)

    def test_varje_verksamhet_kommer_i_tur_exakt_en_gang_per_period(self):
        ider = [str(n) for n in range(-500, 500)]
        start = date(2026, 9, 28)
        for ident in ider:
            turer = sum(
                1
                for d in range(self.mod.GOLV_DAGAR)
                if self.mod.i_tur(ident, date.fromordinal(start.toordinal() + d))
            )
            self.assertEqual(turer, 1, f"{ident} kom i tur {turer} gånger")

    def test_ett_id_som_inte_ar_ett_tal_hamtas_alltid(self):
        self.assertTrue(self.mod.i_tur("F-0380-abc", date(2026, 9, 28)))

    def test_golvet_tar_ungefar_en_sjundedel_per_natt(self):
        ider = [str(n) for n in range(0, 1836)]
        dag = date(2026, 9, 28)
        andel = sum(1 for i in ider if self.mod.i_tur(i, dag)) / len(ider)
        self.assertAlmostEqual(andel, 1 / self.mod.GOLV_DAGAR, places=2)

    def test_listraden_plockas_ut_per_id_och_bar_omdome_och_datum(self):
        markup = (
            '<ul><li class="inspection-ok">'
            '<h3><a href="/x/Details?id=-19225">Göteborgs nation</a></h3>'
            "<p>Gatan 1</p><p>Senaste omdöme: Utan avvikelse</p>"
            '<p>Senaste kontroll: <time datetime="2026-09-25">2026-09-25</time></p>'
            "</li>"
            '<li class="inspection-deviation">'
            '<h3><a href="/x/Details?id=407642840">Kvarnen</a></h3>'
            "<p>Gatan 2</p><p>Senaste omdöme: Avvikelse</p>"
            '<p>Senaste kontroll: <time datetime="2026-08-01">2026-08-01</time></p>'
            "</li></ul>"
        )
        rader = self.mod.listrader(markup)
        self.assertEqual(sorted(rader), ["-19225", "407642840"])
        self.assertIn("Senaste kontroll", rader["-19225"])
        self.assertIn("Utan avvikelse", rader["-19225"])
        self.assertNotIn("Kvarnen", rader["-19225"])

    def test_ett_nytt_kontrolldatum_ger_en_ny_nyckel(self):
        mall = (
            '<li class="inspection-ok">'
            '<h3><a href="/x/Details?id=1">Café</a></h3>'
            "<p>Gatan 1</p><p>Senaste omdöme: Utan avvikelse</p>"
            "<p>Senaste kontroll: {d}</p></li>"
        )
        i_gar = self.mod.listrader(mall.format(d="2026-09-01"))["1"]
        i_dag = self.mod.listrader(mall.format(d="2026-09-25"))["1"]
        self.assertNotEqual(i_gar, i_dag)

    def test_ett_nytt_omdome_ger_en_ny_nyckel(self):
        mall = (
            '<li class="inspection-{k}">'
            '<h3><a href="/x/Details?id=1">Café</a></h3>'
            "<p>Gatan 1</p><p>Senaste omdöme: {o}</p>"
            "<p>Senaste kontroll: 2026-09-25</p></li>"
        )
        rent = self.mod.listrader(mall.format(k="ok", o="Utan avvikelse"))["1"]
        brist = self.mod.listrader(mall.format(k="deviation", o="Avvikelse"))["1"]
        self.assertNotEqual(rent, brist)

    def test_en_verksamhet_utan_listrad_far_ingen_nyckel(self):
        self.assertEqual(self.mod.listrader("<ul></ul>"), {})


if __name__ == "__main__":
    unittest.main()
