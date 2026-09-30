"""Uppsalas lista ska bli fullständig även när kommunens sidbrytning tappar.

Uppmätt 2026-09-28: kommunen säger 1 868 verksamheter och levererar 1 868
rader på 187 sidor, men bara 1 741 till 1 781 av dem är olika. Fönstren överlappar, alltså
flyttar sig ordningen mellan två sidhämtningar, och svansen går inte att nå.
Se `LISTAN ÄR INTE FULLSTÄNDIG NÄR MAN BARA BLÄDDRAR DEN` i fetch_uppsala.py.

Testerna här kör mot en påhittad kommun som tappar på precis det sättet, så att
kravet prövas utan att någon behöver fråga Uppsala 300 gånger.
"""

from __future__ import annotations

import importlib.util
import tempfile
import unittest
import urllib.parse
from pathlib import Path


def _ladda():
    sok = Path(__file__).resolve().parents[1] / "fetch_uppsala.py"
    spec = importlib.util.spec_from_file_location("fetch_uppsala_lista", sok)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _rad(ident: str, namn: str, adress: str = "") -> str:
    return (
        '<li class="inspection-ok">'
        f'<h3><a href="/x/Details?id={ident}">{namn}</a></h3>'
        f"<p>{adress}</p><p>Senaste omdöme: Utan avvikelse</p>"
        '<p>Senaste kontroll: <time datetime="2026-09-25">2026-09-25</time></p>'
        "</li>"
    )


class Kommun:
    """En kommun vars sidbrytning tappar `tapp` rader ur svansen.

    Sidorna överlappar likadant som Uppsalas: varje sida efter den första
    börjar om några rader för tidigt, så antalet sidor räcker inte fram till
    slutet av listan. Sökningen är exakt, precis som Uppsalas är.
    """

    def __init__(self, verksamheter, tapp=0, anrop=None):
        self.verksamheter = list(verksamheter)  # (id, namn, adress)
        self.tapp = tapp
        self.anrop = anrop if anrop is not None else []

    def get(self, url: str) -> str:
        self.anrop.append(url)
        fraga = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)
        sida = int(fraga.get("page", ["1"])[0])
        term = (fraga.get("query") or [""])[0]

        if term:
            traffar = [v for v in self.verksamheter if term.lower() in (v[1] + " " + v[2]).lower()]
            return self._svar(len(traffar), traffar[(sida - 1) * 10 : sida * 10])

        antal = len(self.verksamheter)
        sidor = max(1, -(-antal // 10))
        if sida > sidor:
            return self._svar(antal, [])
        # Överlappet: fönstret flyttar sig långsammare än tio rader per sida,
        # alltså nås aldrig de sista `tapp` raderna.
        glid = 0 if sidor < 2 else round(self.tapp * (sida - 1) / (sidor - 1))
        start = max(0, (sida - 1) * 10 - glid)
        return self._svar(antal, self.verksamheter[start : start + 10])

    @staticmethod
    def _svar(antal: int, rader) -> str:
        kropp = "".join(_rad(*v) for v in rader)
        return f'<span class="count">{antal}</span><ul>{kropp}</ul>'


def _bestand(n: int):
    return [(str(1000 + i), f"Verksamhet {i}", f"Gatan {i}") for i in range(n)]


class ListanBlirFullstandigTest(unittest.TestCase):
    def setUp(self):
        self.mod = _ladda()
        self.mod.POLITE_DELAY_S = 0

    def _kor(self, kommun, liggare):
        self.mod.get = kommun.get
        return self.mod.collect_list(liggare)

    def test_bladdringen_ensam_tappar_svansen(self):
        kommun = Kommun(_bestand(200), tapp=17)
        listing, rader, antal = self._kor(kommun, {})
        self.assertEqual(antal, 200)
        self.assertLess(len(rader), 200)

    def test_liggaren_hamtar_tillbaka_det_bladdringen_tappade(self):
        bestand = _bestand(200)
        kommun = Kommun(bestand, tapp=17)
        liggare = {i: {"namn": n, "adress": a} for i, n, a in bestand}
        listing, rader, antal = self._kor(kommun, liggare)
        self.assertEqual(len(rader), 200)
        self.assertEqual({r["id"] for r in listing}, {i for i, _, _ in bestand})

    def test_en_verksamhet_som_verkligen_ar_borta_foljer_inte_med(self):
        kvar = _bestand(200)
        nedlagd = ("9999", "Nedlagt Kafé", "Torget 1")
        kommun = Kommun(kvar, tapp=17)
        liggare = {i: {"namn": n, "adress": a} for i, n, a in kvar + [nedlagd]}
        listing, rader, antal = self._kor(kommun, liggare)
        self.assertNotIn("9999", rader)
        self.assertEqual(len(rader), 200)

    def test_ett_nytt_namn_hittas_pa_adressen_i_stallet(self):
        bestand = _bestand(200)
        bytt = ("1005", "Helt Nytt Namn", "Gatan 5")
        bestand[5] = bytt
        kommun = Kommun(bestand, tapp=17)
        # Liggaren bär gårdagens namn, som inte längre finns i listan.
        liggare = {i: {"namn": n, "adress": a} for i, n, a in _bestand(200)}
        listing, rader, antal = self._kor(kommun, liggare)
        self.assertIn("1005", rader)
        self.assertEqual(len(rader), 200)

    def test_ordningen_ar_pa_id_och_inte_pa_det_listan_gav(self):
        bestand = _bestand(60)
        framlanges = Kommun(bestand)
        baklanges = Kommun(list(reversed(bestand)))
        liggare = {i: {"namn": n, "adress": a} for i, n, a in bestand}
        ett, _, _ = self._kor(framlanges, liggare)
        tva, _, _ = self._kor(baklanges, liggare)
        self.assertEqual([r["id"] for r in ett], [r["id"] for r in tva])

    def test_stammer_antalet_efter_bladdringen_gors_inga_uppslag(self):
        bestand = _bestand(60)
        kommun = Kommun(bestand)
        liggare = {i: {"namn": n, "adress": a} for i, n, a in bestand}
        self._kor(kommun, liggare)
        uppslag = [
            u
            for u in kommun.anrop
            if urllib.parse.parse_qs(urllib.parse.urlparse(u).query).get("query", [""])[0]
        ]
        self.assertEqual(uppslag, [], "en fullständig bläddring ska inte kosta ett uppslag")

    def test_liggaren_skrivs_och_lases_tillbaka(self):
        with tempfile.TemporaryDirectory() as katalog:
            rot = Path(katalog)
            self.mod.skriv_liggare(
                rot, [{"id": "17", "name": "Kaféet", "address": "Gatan 1"}]
            )
            self.assertEqual(
                self.mod.las_liggare(rot),
                {"17": {"namn": "Kaféet", "adress": "Gatan 1"}},
            )

    def test_en_saknad_eller_trasig_liggare_stoppar_ingenting(self):
        with tempfile.TemporaryDirectory() as katalog:
            rot = Path(katalog)
            self.assertEqual(self.mod.las_liggare(rot), {})
            (rot / self.mod.LIGGARE).write_text("{ inte json", encoding="utf-8")
            self.assertEqual(self.mod.las_liggare(rot), {})
        self.assertEqual(self.mod.las_liggare(None), {})

    def test_ett_uppslag_gar_igenom_hogst_sok_sidor(self):
        # Hundra verksamheter med samma ord i namnet, och den vi söker sist.
        bestand = [(str(i), f"Kedjan {i}", "") for i in range(100)]
        kommun = Kommun(bestand)
        self.mod.get = kommun.get
        funna, uttomt = self.mod.sla_upp("Kedjan", "99")
        self.assertLessEqual(len(kommun.anrop), self.mod.SOK_SIDOR)
        self.assertNotIn("99", funna)
        self.assertFalse(uttomt, "en avhuggen sökning får inte se ut som ett svar")

    def test_utan_kommunens_antal_faller_hamtningen(self):
        # Antalet är facit. Försvinner det ur markupen kan hämtningen inte
        # längre kontrollera sig själv, och en tyst halv utlämning är värre
        # än att natten står över.
        class UtanAntal(Kommun):
            @staticmethod
            def _svar(antal, rader):
                return "<ul>" + "".join(_rad(*v) for v in rader) + "</ul>"

        self.mod.get = UtanAntal(_bestand(40)).get
        with self.assertRaises(SystemExit):
            self.mod.collect_list({})


if __name__ == "__main__":
    unittest.main()
