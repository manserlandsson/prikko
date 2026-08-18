"""Test för att exporten inte raderar de koordinater vi räknat fram själva.

Kommunerna publicerar inte alla koordinater. Örebro publicerar inga alls och
Uppsala nästan inga, så `pipeline/geocode.py` räknar fram dem ur adressen och
märker var och en med `geoSource`. De 1 611 sådana koordinaterna ligger bara i
de incheckade filerna, inte i Supabase, där nio rader har ett `geo_source`.

Exporten läser databasen. Nattkörningen 2026-08-17 skrev därför tillbaka
filerna utan koordinater och tog Örebro från 645 till 0 och Uppsala från 966
till 6. Ingenting klagade, eftersom en verksamhet utan koordinat är fullt
publicerbar: den saknar bara kartnål.

Testerna nedan finns för att det aldrig ska hända igen, och för att den
ordning ansökan till Lantmäteriet bygger på ska vara provad och inte bara
beskriven. Se docs/34_ny_ansokan_lantmateriet.md.

Körs utan beroenden:  python3 pipeline/tests/test_export_koordinater.py
"""

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from export_supabase import harledda  # noqa: E402


def fil(dir: Path, verksamheter: list) -> Path:
    path = dir / "orebro.json"
    path.write_text(
        json.dumps({"establishments": verksamheter}, ensure_ascii=False),
        encoding="utf-8",
    )
    return path


class Harledda(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())

    def test_koordinater_ur_filen_lases(self):
        path = fil(self.dir, [{"id": "F-1", "lat": 59.27, "lng": 15.21}])
        self.assertEqual(harledda(path), {"F-1": (59.27, 15.21)})

    def test_rader_utan_koordinat_utelamnas(self):
        """En rad utan koordinat har ingenting att bevara."""
        path = fil(self.dir, [{"id": "F-1", "lat": None, "lng": None}])
        self.assertEqual(harledda(path), {})

    def test_halv_koordinat_utelamnas(self):
        """En nål behöver båda talen. Ett ensamt lat är ingen plats."""
        path = fil(self.dir, [{"id": "F-1", "lat": 59.27, "lng": None}])
        self.assertEqual(harledda(path), {})

    def test_ingen_fil_ger_tom_karta(self):
        """Första exporten mot en ny kommun har ingenting att läsa."""
        self.assertEqual(harledda(self.dir / "finns-inte.json"), {})

    def test_trasig_fil_ger_tom_karta_i_stallet_for_krasch(self):
        """En halvskriven fil får inte fälla hela exporten."""
        path = self.dir / "orebro.json"
        path.write_text('{"establishments": [', encoding="utf-8")
        self.assertEqual(harledda(path), {})

    def test_nollon_ar_en_giltig_koordinat(self):
        """Noll är en plats i Guineabukten, inte ett saknat värde.

        Provet finns eftersom `if not lat` hade kastat den, och den sortens
        fel syns först när någon råkar ligga på nollmeridianen.
        """
        path = fil(self.dir, [{"id": "F-1", "lat": 0, "lng": 0}])
        self.assertEqual(harledda(path), {"F-1": (0, 0)})


if __name__ == "__main__":
    unittest.main()
