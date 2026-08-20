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
    FILBLOCK,
    FILFALT,
    behall_block,
    coordinate_collapse,
    count_coordinates,
    export,
    filblock,
    filradering,
)


def fil(dir: Path, verksamheter: list) -> Path:
    path = dir / "orebro.json"
    path.write_text(
        json.dumps({"establishments": verksamheter}, ensure_ascii=False),
        encoding="utf-8",
    )
    return path


class Filradering(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())

    def test_raden_ur_filen_lases_pa_sitt_id(self):
        path = fil(self.dir, [{"id": "F-1", "lat": 59.27, "lng": 15.21}])
        self.assertEqual(filradering(path)["F-1"]["lat"], 59.27)

    def test_oppettiden_foljer_med(self):
        """Databasen har ingen kolumn för dem, så filen är enda hemvisten."""
        path = fil(self.dir, [{"id": "F-1", "hours": {"raw": "Mo-Su 09:00-18:00"}}])
        self.assertEqual(filradering(path)["F-1"]["hours"]["raw"], "Mo-Su 09:00-18:00")

    def test_rad_utan_id_utelamnas(self):
        """Utan id finns ingen att para tillbaka mot."""
        path = fil(self.dir, [{"lat": 59.27, "lng": 15.21}])
        self.assertEqual(filradering(path), {})

    def test_ingen_fil_ger_tom_karta(self):
        """Första exporten mot en ny kommun har ingenting att läsa."""
        self.assertEqual(filradering(self.dir / "finns-inte.json"), {})

    def test_trasig_fil_ger_tom_karta_i_stallet_for_krasch(self):
        """En halvskriven fil får inte fälla hela exporten."""
        path = self.dir / "orebro.json"
        path.write_text('{"establishments": [', encoding="utf-8")
        self.assertEqual(filradering(path), {})

    def test_nollon_ar_en_giltig_koordinat(self):
        """Noll är en plats i Guineabukten, inte ett saknat värde.

        Provet finns eftersom `if not lat` hade kastat den, och den sortens
        fel syns först när någon råkar ligga på nollmeridianen.
        """
        path = fil(self.dir, [{"id": "F-1", "lat": 0, "lng": 0}])
        self.assertEqual(filradering(path)["F-1"]["lat"], 0)


class Licensblocket(unittest.TestCase):
    """ODbL-attributionen försvann i samma körning som öppettiderna.

    Att tappa tiderna är en saknad funktion. Att tappa attributionen medan
    tiderna ligger kvar vore ett licensbrott, så blocket måste följa med
    filen och inte räknas fram på nytt.
    """

    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())

    def test_blocken_lases_ur_filen(self):
        path = self.dir / "orebro.json"
        path.write_text(
            json.dumps(
                {
                    "openstreetmap": {"licence": "ODbL 1.0", "covers": ["hours"]},
                    "narhet": {"licence": "ODbL 1.0", "covers": ["stop"]},
                    "establishments": [],
                }
            ),
            encoding="utf-8",
        )
        self.assertEqual(
            filblock(path),
            {
                "narhet": {"licence": "ODbL 1.0", "covers": ["stop"]},
                "openstreetmap": {"licence": "ODbL 1.0", "covers": ["hours"]},
            },
        )

    def test_blocken_kommer_i_filbloc_ordning(self):
        """Ordningen är den de incheckade filerna har. Kastas den om skriver
        varje nattkörning om tre rader i åtta filer utan att något ändrats."""
        path = self.dir / "orebro.json"
        path.write_text(
            json.dumps(
                {
                    "geocoding": {"licence": "ODbL 1.0"},
                    "openstreetmap": {"licence": "ODbL 1.0"},
                    "narhet": {"licence": "ODbL 1.0"},
                    "establishments": [],
                }
            ),
            encoding="utf-8",
        )
        self.assertEqual(list(filblock(path)), list(FILBLOCK))

    def test_fil_utan_block_ger_tomt(self):
        path = fil(self.dir, [{"id": "F-1"}])
        self.assertEqual(filblock(path), {})

    def test_ingen_fil_ger_tomt(self):
        self.assertEqual(filblock(self.dir / "finns-inte.json"), {})

    def test_block_behalls_bara_nar_filen_bar_uppgiften(self):
        """En ODbL-klausul i en fil utan en enda rad av det slaget är ett
        påstående om data som inte finns."""
        narhet = {"licence": "ODbL 1.0", "covers": ["stop", "parking"]}
        self.assertTrue(behall_block(narhet, {"stop": 12870, "parking": 0}, 0))
        self.assertFalse(behall_block(narhet, {"stop": 0, "parking": 0}, 0))

    def test_geocoding_hanger_pa_de_harledda_nalarna(self):
        """Blocket saknar `covers` och räknas därför på nålarna."""
        geo = {"licence": "ODbL 1.0"}
        self.assertTrue(behall_block(geo, {}, 1611))
        self.assertFalse(behall_block(geo, {}, 0))


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


class FalskSupabase:
    """Databasen som exporten läser, med precis de rader ett prov behöver.

    Databasen känner inte till härledda koordinater: nio rader av 130 000 har
    ett geo_source. Den här stubben speglar det, och lämnar lat och lng tomma
    så att provet gäller just det som gick sönder.
    """

    def __init__(self, verksamheter: list) -> None:
        self.tabeller = {
            "municipalities": [
                {
                    "code": "1880",
                    "name": "Örebro kommun",
                    "city": "Örebro",
                    "slug": "orebro",
                    "source_type": "reverse_engineered",
                    "source_url": "https://example.invalid",
                    "last_fetched_at": "2026-08-18",
                }
            ],
            "establishments": verksamheter,
            "assessments": [],
            "inspections": [],
            "control_areas": [],
            "images": [],
        }

    def all_rows(self, table: str, select: str = "*", order: str = "id") -> list:
        return self.tabeller[table]


def rad(id: str, **extra) -> dict:
    return {
        "id": id,
        "municipality_code": "1880",
        "slug": id.lower(),
        "name": id,
        "street_address": "Kungsgatan 1",
        "types": [],
        "lat": None,
        "lng": None,
        **extra,
    }


class Ursprunget(unittest.TestCase):
    """Koordinatens ursprung ska överleva exporten, inte bara dess tal.

    `geoSource` är det enda som skiljer en härledd koordinat från en kommunen
    själv publicerat, och sajten fattar tre beslut på fältet:
    Platskarta.astro skriver ut OpenStreetMaps attribution, [slug].astro
    utelämnar schema.org-fältet `geo` för härledda koordinater, och
    kartrutor.ts märker rutan som härledd. `geoPrecision` styr om
    pipeline/oppettider.py får lita på nålen.

    Exporten tog bara lat och lng. Uppmätt 2026-08-18 stod därför 1 610
    härledda koordinater kvar på sajten utan sitt ursprung, 644 i Örebro och
    966 i Uppsala, och ODbL-attributionen försvann från varje karta som visade
    dem.
    """

    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())
        self.path = self.dir / "orebro.json"

    def skriv_gardagens(self, verksamheter: list, geocoding=True) -> None:
        payload = {
            "municipality": {"code": "1880", "name": "Örebro kommun",
                             "city": "Örebro", "slug": "orebro"},
            "source": {"url": "", "fetchedAt": ""},
            "establishments": verksamheter,
        }
        if geocoding:
            payload["geocoding"] = {
                "method": "derived",
                "source": "OpenStreetMap via Overpass API",
                "licence": "ODbL 1.0",
                "attribution": "© OpenStreetMap contributors",
            }
        self.path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")

    def exportera(self, verksamheter: list) -> dict:
        export(FalskSupabase(verksamheter), self.dir)
        return json.loads(self.path.read_text(encoding="utf-8"))

    def test_geosource_och_geoprecision_foljer_med_koordinaten(self):
        self.skriv_gardagens(
            [{"id": "F-1", "lat": 59.27, "lng": 15.21,
              "geoSource": "osm", "geoPrecision": "approximate"}]
        )
        ny = self.exportera([rad("F-1")])["establishments"][0]
        self.assertEqual(ny["lat"], 59.27)
        self.assertEqual(ny["geoSource"], "osm")
        self.assertEqual(ny["geoPrecision"], "approximate")

    def test_ursprunget_star_direkt_efter_lng(self):
        """Samma plats som pipeline/geocode.py ger dem.

        Nyckelordningen ligger i filen. Hamnar fälten någon annanstans skriver
        de två vägarna olika filer, och varje bytt väg ger en diff utan en
        enda faktisk ändring.
        """
        self.skriv_gardagens(
            [{"id": "F-1", "lat": 59.27, "lng": 15.21, "geoSource": "osm",
              "geoPrecision": "address"}]
        )
        nycklar = list(self.exportera([rad("F-1")])["establishments"][0])
        self.assertEqual(
            nycklar[nycklar.index("lng"): nycklar.index("lng") + 3],
            ["lng", "geoSource", "geoPrecision"],
        )

    def test_kommunens_egen_koordinat_far_inget_ursprung(self):
        """Börjar kommunen publicera egna koordinater vinner de alltid.

        En koordinat ur databasen är kommunens och ska aldrig bära ett
        geoSource från en gammal gissning.
        """
        self.skriv_gardagens(
            [{"id": "F-1", "lat": 59.27, "lng": 15.21, "geoSource": "osm",
              "geoPrecision": "approximate"}]
        )
        ny = self.exportera([rad("F-1", lat=59.5, lng=15.5)])["establishments"][0]
        self.assertEqual(ny["lat"], 59.5)
        self.assertNotIn("geoSource", ny)
        self.assertNotIn("geoPrecision", ny)

    def test_licensblocket_foljer_med(self):
        """ODbL kräver attribution där koordinaten visas."""
        self.skriv_gardagens([{"id": "F-1", "lat": 59.27, "lng": 15.21,
                               "geoSource": "osm", "geoPrecision": "address"}])
        payload = self.exportera([rad("F-1")])
        self.assertEqual(payload["geocoding"]["licence"], "ODbL 1.0")
        self.assertEqual(list(payload)[:3], ["municipality", "source", "geocoding"])

    def test_licensblocket_utelamnas_utan_harledda_nalar(self):
        """En licensklausul utan en enda härledd nål påstår något som inte finns."""
        self.skriv_gardagens([{"id": "F-1", "lat": 59.27, "lng": 15.21,
                               "geoSource": "osm"}])
        payload = self.exportera([rad("F-1", lat=59.5, lng=15.5)])
        self.assertNotIn("geocoding", payload)

    def test_koordinat_utan_ursprung_ger_inga_tomma_falt(self):
        """Kommunens egen koordinat som råkat hamna i filen har inget ursprung.

        Ett `"geoSource": null` på varje rad hade lagt tusentals rader i varje
        diff utan att säga något.
        """
        self.skriv_gardagens([{"id": "F-1", "lat": 59.27, "lng": 15.21}],
                             geocoding=False)
        ny = self.exportera([rad("F-1")])["establishments"][0]
        self.assertEqual(ny["lat"], 59.27)
        self.assertNotIn("geoSource", ny)

    def test_filblock_klarar_fil_som_saknar_blocket(self):
        self.skriv_gardagens([{"id": "F-1", "lat": 59.27, "lng": 15.21}],
                             geocoding=False)
        self.assertEqual(filblock(self.path), {})
        self.assertEqual(filblock(self.dir / "finns-inte.json"), {})


#: Nycklar exporten själv bygger på varje verksamhetsrad, ur databasen.
#: Allt ANNAT som står i de incheckade filerna bor bara där och måste stå i
#: FILFALT för att överleva nästa nattkörning.
EXPORTENS_EGNA = {
    "id",
    "slug",
    "name",
    "address",
    "types",
    "lat",
    "lng",
    "geoSource",
    "geoPrecision",
    "image",
    "verdict",
    "distinction",
    "reason",
    "modelVersion",
    "uncertain",
    "inspections",
}

#: Nycklar exporten själv bygger på filens toppnivå.
EXPORTENS_EGNA_BLOCK = {"municipality", "source", "establishments"}


class Filfalten(unittest.TestCase):
    """Det som bara bor i filen måste räknas upp i exporten.

    Fyra gånger på fyra dygn har ett sådant fält raderats av nästa
    nattkörning: kontrollpunkterna, koordinaterna, öppettiderna och contact.
    Exporten bygger varje post ur databasen, så allt utan kolumn där
    försvinner tyst.

    Den femte gången gällde toppnivån i stället för raderna, och slank därför
    förbi det här provet i sin gamla form: 2026-08-18 bytte `openingHours`
    namn till `openstreetmap` och `narhet` tillkom, utan att exporten rördes.
    Nästa lyckade nattkörning hade tagit bort båda blocken ur de åtta filer
    som bär dem, alltså ODbL-attributionen för 2 747 öppettider, 3 274
    kontaktuppgifter, 12 870 hållplatser och 10 606 parkeringar.

    Provet ställer därför exporten mot de INCHECKADE filerna i stället för mot
    en avskriven lista. Lägger någon till ett fält eller ett block i pipelinen
    utan att lägga till det här, faller det här provet nästa gång filerna
    checkas in.
    """

    DATA = Path(__file__).resolve().parents[2] / "site" / "src" / "data"

    def _filer(self):
        filer = sorted(self.DATA.glob("*.json"))
        self.assertTrue(filer, f"hittade inga datafiler i {self.DATA}")
        return filer

    def test_varje_falt_i_filerna_ar_kant(self):
        kanda = EXPORTENS_EGNA | set(FILFALT)
        okanda = {}
        for path in self._filer():
            payload = json.loads(path.read_text(encoding="utf-8"))
            for rad in payload["establishments"]:
                for namn in rad.keys() - kanda:
                    okanda.setdefault(namn, path.name)
        self.assertEqual(
            okanda,
            {},
            f"fält utan plats i FILFALT, de raderas av nästa nattkörning: {okanda}",
        )

    def test_varje_toppnivablock_i_filerna_ar_kant(self):
        kanda = EXPORTENS_EGNA_BLOCK | set(FILBLOCK)
        okanda = {}
        for path in self._filer():
            payload = json.loads(path.read_text(encoding="utf-8"))
            for namn in payload.keys() - kanda:
                okanda.setdefault(namn, path.name)
        self.assertEqual(
            okanda,
            {},
            f"block utan plats i FILBLOCK, de raderas av nästa nattkörning: {okanda}",
        )

    def test_blockordningen_ar_filernas(self):
        """FILBLOCK måste stå i samma ordning som de incheckade filerna, annars
        kastar varje nattkörning om raderna utan att något ändrats."""
        for path in self._filer():
            payload = json.loads(path.read_text(encoding="utf-8"))
            iFilen = [namn for namn in payload if namn in FILBLOCK]
            self.assertEqual(
                iFilen,
                [namn for namn in FILBLOCK if namn in iFilen],
                f"{path.name} bär blocken i en annan ordning än FILBLOCK",
            )


if __name__ == "__main__":
    unittest.main()
