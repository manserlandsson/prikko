"""Test för att osäkerhetsflaggan överlever vägen genom databasen.

Adaptrarna räknar fram `uncertain` på riktigt. Lomma sätter den när en
avvikelsetext bär en fras som inte går att para ihop med ett kontrollområde:
"Bjärreds krog" står som gul med texten "inga avvikelserseparering avfall,
svårstädad lokal, förvaring", alltså är områdeslistan bevisligen ofullständig
medan färgen är entydig. Omdömet står, men underlaget är inte helt.

Ändå kom flaggan aldrig fram. Laddaren skrev den inte, tabellen hade ingen
plats för den, och exporten hårdkodade `"uncertain": False` för varenda
verksamhet. Nattkörningen skrev alltså över hämtarens sanna värde med ett
påhittat, och site/src/data/lomma.json gick ut med false för 1 av 15 983
verksamheter som vi vet bättre om.

Ett fall låter som lite. Det är precis därför det behöver ett test: en flagga
som bara slår till någon gång i månaden märks inte när den slutar fungera.

Körs utan beroenden:  python3 pipeline/tests/test_osakerhet.py
"""

import io
import json
import sys
import tempfile
import unittest
from contextlib import redirect_stderr
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import export_supabase  # noqa: E402
import load_supabase  # noqa: E402

KOMMUN = {"code": "1262", "name": "Lomma kommun", "city": "Lomma", "slug": "lomma"}

BJARREDS_KROG = {
    "id": "E-1262-bjarreds-krog",
    "slug": "bjarreds-krog",
    "name": "Bjärreds krog",
    "address": "Norra Västkustvägen 1",
    "types": ["Restaurang"],
    "lat": 55.7195,
    "lng": 13.0269,
    "image": None,
    "verdict": "minor",
    "distinction": False,
    "reason": "assessed",
    "modelVersion": 4,
    "uncertain": True,
    "inspections": [
        {
            "id": "I-1262-bjarreds-krog-2026-05-12",
            "date": "2026-05-12",
            "assessment": 1,
            "type": 0,
            "prenotified": None,
            "audit": False,
            "onSite": True,
            "areas": [
                {
                    "code": "",
                    "group": "Svårstädad lokal",
                    "description": "",
                    "status": "deviation",
                }
            ],
        }
    ],
}

GRANNEN = dict(
    BJARREDS_KROG,
    id="E-1262-grannen",
    slug="grannen",
    name="Grannen",
    verdict="clean",
    uncertain=False,
    inspections=[],
)


def utlamning(*verksamheter) -> dict:
    return {
        "municipality": KOMMUN,
        "source": {"url": "https://lomma.se/", "fetchedAt": "2026-08-18T02:00:00Z"},
        "establishments": list(verksamheter),
    }


class FalskDatabas(load_supabase.Supabase):
    """Tar emot laddarens skrivningar och behåller dem i minnet.

    Räcker för att spela upp hela rundturen: exportklienten nedan läser ur
    samma lager, så testet mäter vad som faktiskt kommer ut i filen och inte
    vad laddaren tänkte skriva.
    """

    def __init__(self, kolumner_som_saknas=()):
        super().__init__("https://exempel.supabase.co", "nyckel")
        self.tabeller: dict = {}
        self.kolumner_som_saknas = set(kolumner_som_saknas)

    def _request(self, method, path, body=None, prefer=""):
        tabell = path.split("?")[0]
        falt = path.split("select=")[-1].split("&")[0] if "select=" in path else ""
        if method == "GET" and (tabell, falt) in self.kolumner_som_saknas:
            raise load_supabase.SupabaseError(f"GET {path} → 400: column does not exist")
        if method == "POST":
            self.tabeller.setdefault(tabell, []).extend(body or [])
        return b"[]"


class Exportklient(export_supabase.Supabase):
    """Läser tillbaka det FalskDatabas tog emot."""

    def __init__(self, tabeller: dict):
        super().__init__("https://exempel.supabase.co", "nyckel")
        self.tabeller = tabeller

    def all_rows(self, table: str, select: str = "*", order: str = "id") -> list:
        return self.tabeller.get(table, [])


def rundtur(payload: dict, kolumner_som_saknas=()) -> tuple:
    """Kör filen genom laddaren och tillbaka ut genom exporten.

    Returnerar den exporterade kommunfilen och allt som skrevs till stderr.
    """
    logg = io.StringIO()
    with tempfile.TemporaryDirectory() as katalog:
        katalog = Path(katalog)
        infil = katalog / "in.json"
        infil.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")

        databas = FalskDatabas(kolumner_som_saknas)
        ut = katalog / "ut"
        with redirect_stderr(logg):
            load_supabase.load(infil, databas)
            export_supabase.export(Exportklient(databas.tabeller), ut)

        return json.loads((ut / "lomma.json").read_text(encoding="utf-8")), logg.getvalue()


class Rundturen(unittest.TestCase):
    def test_flaggan_overlever_hela_vagen(self):
        """Regressionen. Hämtaren sa True, filen sa False."""
        fil, _ = rundtur(utlamning(BJARREDS_KROG))
        verksamhet = fil["establishments"][0]
        self.assertEqual(verksamhet["name"], "Bjärreds krog")
        self.assertTrue(verksamhet["uncertain"])

    def test_de_som_lastes_utan_rest_star_kvar_som_sakra(self):
        """Flaggan får inte smitta grannen. Elva av tolv kommuner sätter den
        aldrig, och en flagga som ropar varg tappar sin verkan."""
        fil, _ = rundtur(utlamning(BJARREDS_KROG, GRANNEN))
        efter_namn = {e["name"]: e["uncertain"] for e in fil["establishments"]}
        self.assertEqual(efter_namn, {"Bjärreds krog": True, "Grannen": False})

    def test_kontrollen_foljer_med_som_forut(self):
        """Rundturen ska bara ha ändrat flaggan, inget annat."""
        fil, _ = rundtur(utlamning(BJARREDS_KROG))
        kontroll = fil["establishments"][0]["inspections"][0]
        self.assertEqual(kontroll["date"], "2026-05-12")
        self.assertEqual(kontroll["assessment"], 1)
        self.assertEqual([a["group"] for a in kontroll["areas"]], ["Svårstädad lokal"])


class UtanMigrering(unittest.TestCase):
    """Schemat körs för hand i SQL Editor. Databasen kan alltså ligga steget
    efter koden, och då ska nattkörningen skriva det den kan och säga vad som
    saknas. Att fälla portionen på 1 000 bedömningar vore värre än att tappa
    en flagga."""

    SAKNAS = (("assessments", "uncertain"),)

    def test_bedomningarna_skrivs_anda(self):
        fil, _ = rundtur(utlamning(BJARREDS_KROG), self.SAKNAS)
        self.assertEqual(fil["establishments"][0]["verdict"], "minor")

    def test_raden_skickas_utan_kolumnen(self):
        databas = FalskDatabas(self.SAKNAS)
        with tempfile.TemporaryDirectory() as katalog:
            infil = Path(katalog) / "in.json"
            infil.write_text(
                json.dumps(utlamning(BJARREDS_KROG), ensure_ascii=False), encoding="utf-8"
            )
            with redirect_stderr(io.StringIO()):
                load_supabase.load(infil, databas)
        self.assertNotIn("uncertain", databas.tabeller["assessments"][0])

    def test_tystnaden_larmas(self):
        """Utan varningen ser en databas som tappar flaggan ut som en som
        aldrig fick något att tappa."""
        _, logg = rundtur(utlamning(BJARREDS_KROG), self.SAKNAS)
        self.assertIn("uncertain", logg)
        self.assertIn("schema.sql", logg)


if __name__ == "__main__":
    unittest.main()
