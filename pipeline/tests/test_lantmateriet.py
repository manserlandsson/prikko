"""Tester för Lantmäteriets belägenhetsadresser som geokodningskälla.

    python3 pipeline/tests/test_lantmateriet.py

Talen i TestProjection är Lantmäteriets EGNA, hämtade ur STAC-posterna för
Borgholm och Luleå 2026-08-05. Varje post bär samma rektangel två gånger, en
i SWEREF 99 TM och en i WGS84, vilket gör den till ett facit för transformen
som inte är skrivet av oss.

GeoPackage-fixturen byggs här i testet i stället för att checkas in. En riktig
kommunfil är tiotals megabyte, den är ett utdrag ur ett register med
personuppgifter, och den hör inte hemma i ett repo.
"""

import sqlite3
import struct
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.geo import SWEREF99_TM, sweref99_to_wgs84  # noqa: E402
from prikko.geocode import (  # noqa: E402
    MATCHED,
    MISS_AMBIGUOUS,
    MISS_NO_NUMBER,
    MISS_NO_STREET,
    PRECISION_ADDRESS,
    PRECISION_APPROXIMATE,
    SOURCE_LANTMATERIET,
    Address,
    AddressIndex,
    parse_address,
    street_variants,
)
from prikko.lantmateriet import (  # noqa: E402
    EPSG_SWEREF99_TM,
    Row,
    _decode_point,
    bounds_from_stac,
    build_index,
    read_geopackage,
)

# STAC-posterna för kommun 0885 (Borgholm) och 2580 (Luleå), fält proj:bbox
# och bbox. Ordning: (kommunkod, SWEREF-rektangel, WGS84-rektangel).
STAC_BBOXES = [
    (
        "0885",
        [593352.0, 6281908.309, 627516.4547606185, 6360137.512],
        [16.523405238804035, 56.671962408006976, 17.120178288866235, 57.36619549589869],
    ),
    (
        "2580",
        [792995.813, 7263496.49, 859946.757, 7367755.932],
        [21.306970062396772, 65.3621682491147, 23.018002459423823, 66.22202790298512],
    ),
]


def gpkg_point(northing: float, easting: float) -> bytes:
    """Koda en punkt som GeoPackage Binary, enligt OGC:s specifikation.

    Byggd för hand ur specen så att avkodaren prövas mot formatet och inte
    mot sig själv:

        b"GP"            magi
        0x00             version
        0x01             flaggor: little endian, ingen omslutande rektangel
        int32            srs_id
        0x01             WKB: little endian
        uint32 = 1       WKB: Point
        double, double   x (easting), y (northing)
    """
    header = b"GP" + bytes([0x00, 0x01]) + struct.pack("<i", EPSG_SWEREF99_TM)
    return header + struct.pack("<BIdd", 1, 1, easting, northing)


def write_geopackage(path: Path, rows) -> None:
    """Skriv en GeoPackage med det skikt produkten levererar.

    Bara de tabeller inläsaren faktiskt läser: gpkg_contents, som pekar ut
    skiktet, och gpkg_geometry_columns, som pekar ut geometrikolumnen.
    """
    connection = sqlite3.connect(path)
    connection.executescript(
        """
        CREATE TABLE gpkg_contents (
            table_name TEXT PRIMARY KEY, data_type TEXT, srs_id INTEGER);
        CREATE TABLE gpkg_geometry_columns (
            table_name TEXT, column_name TEXT, srs_id INTEGER);
        CREATE TABLE belagenhetsadress (
            fid INTEGER PRIMARY KEY,
            adressomrade_faststalltnamn TEXT,
            gardsadressomrade_faststalltnamn TEXT,
            adressplatsnummer TEXT,
            bokstavstillagg TEXT,
            statusforbelagenhetsadress TEXT,
            geom BLOB);
        INSERT INTO gpkg_contents VALUES ('belagenhetsadress', 'features', 3006);
        INSERT INTO gpkg_geometry_columns VALUES ('belagenhetsadress', 'geom', 3006);
        """
    )
    connection.executemany(
        "INSERT INTO belagenhetsadress (adressomrade_faststalltnamn, "
        "gardsadressomrade_faststalltnamn, adressplatsnummer, bokstavstillagg, "
        "statusforbelagenhetsadress, geom) VALUES (?, ?, ?, ?, ?, ?)",
        rows,
    )
    connection.commit()
    connection.close()


# Adresser i Uppsala, med koordinater i SWEREF 99 TM.
FIXTURE = [
    ("Kungsgatan", None, "19", "", "Gällande", gpkg_point(6638500.0, 647500.0)),
    ("Kungsgatan", None, "21", "", "Gällande", gpkg_point(6638540.0, 647510.0)),
    ("S:t Persgatan", None, "4", "A", "Gällande", gpkg_point(6638700.0, 647400.0)),
    # Byadress: adressområdet är byns namn, precis som en gata.
    ("Myrö", None, "912", "", "Gällande", gpkg_point(6570000.0, 515000.0)),
    # Gårdsadress inom ett byadressområde. Båda namnen ska gå att slå upp.
    ("Vreta", "Norrgården", "3", "", "Gällande", gpkg_point(6640000.0, 650000.0)),
    # Beslutad men inte ibruktagen: hör inte hemma i indexet.
    ("Reservgatan", None, "1", "", "Reserverad", gpkg_point(6638000.0, 647000.0)),
    # Anläggning utan adressplatsnummer: ingen adressplats att peka på.
    ("Bryggan", None, None, "", "Gällande", gpkg_point(6638100.0, 647100.0)),
]


class TestProjection(unittest.TestCase):
    """SWEREF 99 TM till WGS84, prövad mot Lantmäteriets egna tal."""

    def test_matches_lantmateriets_own_wgs84(self):
        for code, sweref, wgs84 in STAC_BBOXES:
            west, south, east, north = wgs84
            for northing, easting, expected_lat, expected_lng in (
                (sweref[1], sweref[0], south, west),
                (sweref[3], sweref[2], north, east),
            ):
                lat, lng = sweref99_to_wgs84(northing, easting, SWEREF99_TM)
                # En tiondels mikrograd är någon centimeter. Att kräva mer av
                # två oberoende implementationer vore att mäta avrundning.
                self.assertAlmostEqual(lat, expected_lat, places=7, msg=code)
                self.assertAlmostEqual(lng, expected_lng, places=7, msg=code)


class TestGeometry(unittest.TestCase):
    def test_decodes_a_point(self):
        self.assertEqual(_decode_point(gpkg_point(6638500.0, 647500.0)),
                         (6638500.0, 647500.0))

    def test_skips_the_envelope(self):
        """Flaggbyten kan säga att en omslutande rektangel ligger inbakad.
        Läses den inte över hamnar WKB-tolkningen mitt i rektangeln."""
        flags = 0x01 | (1 << 1)  # little endian, rektangel om 32 byte
        blob = (
            b"GP"
            + bytes([0x00, flags])
            + struct.pack("<i", EPSG_SWEREF99_TM)
            + struct.pack("<4d", 0.0, 1.0, 2.0, 3.0)
            + struct.pack("<BIdd", 1, 1, 647500.0, 6638500.0)
        )
        self.assertEqual(_decode_point(blob), (6638500.0, 647500.0))

    def test_refuses_another_coordinate_system(self):
        """En fil i fel system ska stoppa körningen. Tolkad med SWEREF-
        formlerna hamnar varje adress i havet, och tyst."""
        blob = b"GP" + bytes([0x00, 0x01]) + struct.pack("<i", 4326)
        blob += struct.pack("<BIdd", 1, 1, 17.6, 59.8)
        with self.assertRaises(ValueError):
            _decode_point(blob)

    def test_rejects_what_is_not_a_geopackage_point(self):
        self.assertIsNone(_decode_point(b""))
        self.assertIsNone(_decode_point(b"XX\x00\x01"))


class TestGeoPackage(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.path = Path(self.directory.name) / "belagenhetsadresser_kn0380.gpkg"
        write_geopackage(self.path, FIXTURE)

    def tearDown(self):
        self.directory.cleanup()

    def test_reads_the_addresses(self):
        rows = list(read_geopackage(self.path))
        self.assertIn(Row("Kungsgatan", 19, "", 6638500.0, 647500.0), rows)

    def test_reserved_addresses_are_left_out(self):
        """En reserverad adress är beslutad men inte ibruktagen. Ingen
        verksamhet kan ligga på den."""
        self.assertNotIn("Reservgatan", {row.street for row in read_geopackage(self.path)})

    def test_rows_without_a_number_are_left_out(self):
        self.assertNotIn("Bryggan", {row.street for row in read_geopackage(self.path)})

    def test_farm_address_is_indexed_under_both_names(self):
        """Kommunernas adressfält skiljer inte på by och gård, så båda
        namnen måste gå att slå upp."""
        streets = {row.street for row in read_geopackage(self.path)}
        self.assertIn("Vreta", streets)
        self.assertIn("Norrgården", streets)

    def test_index_carries_the_source(self):
        index = build_index(self.path)
        self.assertEqual(index.source, SOURCE_LANTMATERIET)
        result = index.lookup(parse_address("Kungsgatan 19"))
        self.assertEqual(result.reason, MATCHED)
        self.assertEqual(result.match.source, SOURCE_LANTMATERIET)
        self.assertEqual(result.match.precision, PRECISION_ADDRESS)
        # Uppsala ligger kring 59.86 N, 17.64 O.
        self.assertAlmostEqual(result.match.lat, 59.86, places=1)
        self.assertAlmostEqual(result.match.lng, 17.64, places=1)

    def test_saint_is_spelled_out_on_both_sides(self):
        index = build_index(self.path)
        self.assertEqual(index.lookup(parse_address("Sankt Persgatan 4A")).reason, MATCHED)

    def test_the_register_gets_no_neighbour_guess(self):
        """Lantmäteriets register är fullständigt. Saknas numret finns
        adressen inte, och grannporten är ett annat hus."""
        index = build_index(self.path)
        result = index.lookup(parse_address("Kungsgatan 23"), allow_neighbour=False)
        self.assertIsNone(result.match)
        self.assertEqual(result.reason, MISS_NO_NUMBER)
        # OSM får däremot fortsätta gissa på grannporten.
        loose = index.lookup(parse_address("Kungsgatan 23"), allow_neighbour=True)
        self.assertEqual(loose.match.precision, PRECISION_APPROXIMATE)


class TestNormalisation(unittest.TestCase):
    """Adressnormaliseringen. Kommunerna skriver adressen som det faller sig;
    registret skriver den som den heter."""

    def test_postal_code_and_town_are_stripped(self):
        self.assertEqual(
            parse_address("Kungsgatan 19, 753 21 Uppsala"), Address("kungsgatan", 19, "")
        )
        self.assertEqual(
            parse_address("Kungsgatan 19, 75321"), Address("kungsgatan", 19, "")
        )

    def test_flat_and_entrance_are_stripped(self):
        """Lägenhetsnumret pekar inne i huset. Huset står still."""
        for raw in ("Kungsgatan 19 lgh 1102", "Kungsgatan 19, uppg B", "Kungsgatan 19 vån 3"):
            self.assertEqual(parse_address(raw), Address("kungsgatan", 19, ""), raw)

    def test_number_range_keeps_the_first(self):
        self.assertEqual(parse_address("Storgatan 12-14"), Address("storgatan", 12, ""))
        self.assertEqual(parse_address("Storgatan 12–14"), Address("storgatan", 12, ""))

    def test_letter_with_and_without_space(self):
        for raw in ("Kungsgatan 39A", "Kungsgatan 39 A", "kungsgatan 39a"):
            self.assertEqual(parse_address(raw), Address("kungsgatan", 39, "a"), raw)

    def test_still_refuses_what_has_no_number(self):
        """De fyra kommuner som saknar koordinater publicerar en ORT, inte en
        adress. "Byxelkrok" pekar inte ut någon adressplats, och ska inte
        låtsas göra det heller."""
        for raw in ("Byxelkrok", "Mölle", "Holsljunga", "753 21 Uppsala"):
            self.assertIsNone(parse_address(raw), raw)

    def test_abbreviated_suffix_is_expanded(self):
        self.assertIn("kungsgatan", street_variants("kungsg."))
        self.assertIn("skolvägen", street_variants("skolv."))
        self.assertIn("stora torget", street_variants("stora tg"))

    def test_abbreviated_prefix_is_expanded(self):
        """Med punkt betyder V. västra först i namnet och vägen sist."""
        self.assertIn("norra ringvägen", street_variants("n. ringv."))
        self.assertIn("västra ågatan", street_variants("v. ågatan"))

    def test_prefix_without_a_full_stop_is_left_alone(self):
        """"N" utan punkt är lika gärna ett riktigt ord. Vi hittar inte på."""
        self.assertNotIn("norra ringvägen", street_variants("n ringvägen"))

    def test_definite_and_indefinite_form(self):
        self.assertIn("skolväg", street_variants("skolvägen"))
        self.assertIn("skolvägen", street_variants("skolväg"))

    def test_the_written_spelling_comes_first(self):
        """Varianterna är gissningar och får aldrig gå före det som står."""
        self.assertEqual(street_variants("kungsgatan")[0], "kungsgatan")


class TestVariantLookup(unittest.TestCase):
    def index(self, points):
        index = AddressIndex(source=SOURCE_LANTMATERIET)
        for street, number, lat, lng in points:
            index.add(street, number, "", lat, lng)
        return index

    def test_variant_finds_the_street(self):
        index = self.index([("Kungsgatan", 19, 59.8586, 17.6389)])
        result = index.lookup(parse_address("Kungsg. 19"), allow_neighbour=False)
        self.assertEqual(result.reason, MATCHED)
        self.assertEqual(result.match.precision, PRECISION_ADDRESS)

    def test_two_variants_far_apart_decide_nothing(self):
        """Både Skolväg och Skolvägen finns, i var sin del av kommunen. Då
        vet vi inte vilken som avsågs, och pekar inte ut någon."""
        index = self.index(
            [("Skolväg", 1, 59.8586, 17.6389), ("Skolvägen", 1, 59.9500, 17.7000)]
        )
        result = index.lookup(Address("skolgata", 1, ""), allow_neighbour=False)
        self.assertEqual(result.reason, MISS_NO_STREET)

        result = index.lookup(Address("skolväg", 1, ""), allow_neighbour=False)
        # Skrivningen finns: den vinner över varianten, ingen tvekan.
        self.assertEqual(result.reason, MATCHED)
        self.assertAlmostEqual(result.match.lat, 59.8586, places=4)

    def test_variants_that_disagree_are_ambiguous(self):
        index = self.index(
            [("Skolväg", 1, 59.8586, 17.6389), ("Skolvägen", 1, 59.9500, 17.7000)]
        )
        result = index.lookup(Address("skolv.", 1, ""), allow_neighbour=False)
        self.assertIsNone(result.match)
        self.assertEqual(result.reason, MISS_AMBIGUOUS)

    def test_unknown_street_stays_unknown(self):
        index = self.index([("Kungsgatan", 19, 59.8586, 17.6389)])
        result = index.lookup(parse_address("Finns Inte-gatan 1"), allow_neighbour=False)
        self.assertEqual(result.reason, MISS_NO_STREET)


class TestBounds(unittest.TestCase):
    def test_bounds_cover_the_municipality(self):
        """Rimlighetsramen kommer ur uttaget, inte ur en handskriven radie."""
        code, _, wgs84 = STAC_BBOXES[0]
        bounds = bounds_from_stac(code, wgs84)
        self.assertEqual(bounds.code, "0885")
        # Borgholms kommun är knappt åtta mil lång. Halva diagonalen plus
        # marginal ska rymma den, och inte hela Sverige.
        self.assertTrue(30 < bounds.radius_km < 60, bounds.radius_km)
        self.assertAlmostEqual(bounds.lat, 57.02, places=1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
