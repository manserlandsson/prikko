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

from export_supabase import (  # noqa: E402
    MIN_COORDINATES_KEPT,
    MIN_COORDINATES_LOST,
    coordinate_collapse,
    count_coordinates,
    harledda,
)


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


def grindfil(dir: Path, med_koordinat: int, utan: int = 0) -> Path:
    """En ögonblicksbild med ett givet antal kartnålar."""
    poster = [
        {"id": f"F-{i}", "lat": 59.27, "lng": 15.21} for i in range(med_koordinat)
    ] + [
        {"id": f"U-{i}", "lat": None, "lng": None} for i in range(utan)
    ]
    return fil(dir, poster)


def nalar(antal: int) -> list:
    return [{"id": f"F-{i}", "lat": 59.27, "lng": 15.21} for i in range(antal)]


class Kartnalsgrinden(unittest.TestCase):
    """Grinden som fattades natten till 2026-08-17.

    Kontrollpunkterna hade sin grind sedan 103 000 punkter skrevs över med
    tolv. Koordinaterna hade ingen, så Örebro gick från 645 nålar till 0 och
    Uppsala från 966 till 6 utan att något stannade upp.
    """

    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())

    def test_orebro_natten_till_17_augusti(self):
        """Det verkliga fallet: 645 nålar blev 0."""
        path = grindfil(self.dir, 645)
        orsak = coordinate_collapse(path, nalar(0))
        self.assertEqual(orsak, "645 kartnålar blev 0")

    def test_uppsala_natten_till_17_augusti(self):
        """Det andra verkliga fallet: 966 nålar blev 6, kvot 0,006."""
        path = grindfil(self.dir, 966)
        self.assertEqual(coordinate_collapse(path, nalar(6)), "966 kartnålar blev 6")

    def test_normal_natt_slapps_igenom(self):
        """Sämsta uppmätta normala natten: Jönköping 1 123 nålar blev 1 119."""
        path = grindfil(self.dir, 1123)
        self.assertIsNone(coordinate_collapse(path, nalar(1119)))

    def test_stockholms_storsta_normala_tapp_slapps_igenom(self):
        """Största normala tappet i absoluta tal: tolv nålar, kvot 0,999."""
        path = grindfil(self.dir, 8511)
        self.assertIsNone(coordinate_collapse(path, nalar(8499)))

    def test_liten_kommun_far_tappa_ett_par_nalar(self):
        """Golvet i praktiken: Svenljungas 25 nålar blir 22.

        Kvoten är 0,88 och alltså under tröskeln, men tre nedlagda
        verksamheter är normalt och ska inte fälla nattens körning.
        """
        path = grindfil(self.dir, 25)
        self.assertIsNone(coordinate_collapse(path, nalar(22)))

    def test_liten_kommun_som_verkligen_rasar_falls(self):
        """Samma kommun, men nålarna försvinner: 25 blir 0."""
        path = grindfil(self.dir, 25)
        self.assertEqual(coordinate_collapse(path, nalar(0)), "25 kartnålar blev 0")

    def test_golvet_ligger_pa_tio_nalar(self):
        """Nio förlorade nålar passerar, tio fäller. Kvoten är under 0,9 i båda."""
        path = grindfil(self.dir, 30)
        self.assertIsNone(coordinate_collapse(path, nalar(21)))
        self.assertEqual(coordinate_collapse(path, nalar(20)), "30 kartnålar blev 20")

    def test_kommun_utan_nalar_i_gar_faller_aldrig(self):
        """Borgholm, Höganäs, Lomma och Svenljunga har noll nålar.

        De ska inte fälla varenda nattkörning fram till att de geokodats.
        """
        path = grindfil(self.dir, 0, utan=406)
        self.assertIsNone(coordinate_collapse(path, []))

    def test_fler_nalar_falls_aldrig(self):
        """Geokodningen lägger till nålar. Det är aldrig ett ras."""
        path = grindfil(self.dir, 0, utan=99)
        self.assertIsNone(coordinate_collapse(path, nalar(78)))

    def test_ingen_fil_ger_ingen_jamforelse(self):
        """Första exporten mot en ny kommun har inget att jämföra med."""
        self.assertIsNone(coordinate_collapse(self.dir / "finns-inte.json", []))

    def test_trasig_fil_ger_ingen_jamforelse(self):
        """En halvskriven fil får inte fälla kommunen på egen hand."""
        path = self.dir / "orebro.json"
        path.write_text('{"establishments": [', encoding="utf-8")
        self.assertIsNone(coordinate_collapse(path, []))

    def test_halv_koordinat_raknas_inte_som_nal(self):
        """Sajten ritar ingen nål för ett ensamt lat."""
        self.assertEqual(count_coordinates([{"lat": 59.27, "lng": None}]), 0)

    def test_nollon_raknas_som_nal(self):
        """Noll är en plats i Guineabukten, inte ett saknat värde."""
        self.assertEqual(count_coordinates([{"lat": 0, "lng": 0}]), 1)

    def test_troskeln_ligger_dar_mattningen_sager(self):
        """Talen i kommentaren och talen i koden ska vara samma tal.

        Uppmätt spann för normal rörelse är 0,996 till 1,003, och de tre
        verkliga rasen låg på 0,000, 0,006 och 0,048. Kvoten måste ligga
        mellan dem, annars fäller grinden antingen på brus eller inte alls.

        Golvet har sina egna gränser. Under fyra nålar är rörelsen det
        normala bortfallet, och över 25 kan Svenljunga aldrig fälla ens när
        hela dess bestånd av nålar försvinner.
        """
        self.assertGreater(MIN_COORDINATES_KEPT, 0.048)
        self.assertLess(MIN_COORDINATES_KEPT, 0.996)
        self.assertGreater(MIN_COORDINATES_LOST, 3)
        self.assertLessEqual(MIN_COORDINATES_LOST, 25)


if __name__ == "__main__":
    unittest.main()
