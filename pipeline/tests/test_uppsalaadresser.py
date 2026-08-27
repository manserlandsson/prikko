"""Tester för Uppsala kommuns adresslager som geokodningskälla.

Svaren är VERKLIGA rader ur tjänsten, hämtade 2026-08-27 med
`?where=Name='Kungsgatan 19'&outSR=4326&f=json`. Koordinaterna är kommunens
egna tal och inte avrundade.

    python3 pipeline/tests/test_uppsalaadresser.py
"""

import sys
import unittest
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.geocode import MATCHED, SOURCE_UPPSALA, parse_address  # noqa: E402
from prikko.uppsalaadresser import (  # noqa: E402
    STATUS_IN_USE,
    build_index,
    page_url,
    parse_features,
)

#: En verklig sida ur tjänsten, förkortad till fem rader. `Kungsgatan 19` är
#: ordagrant kommunens svar; de övriga är verkliga adresser ur samma lager,
#: valda för att täcka landsbygdsadress, bokstavstillägg och en rad som inte
#: går att dela upp.
PAGE = {
    "objectIdFieldName": "OBJECTID",
    "geometryType": "esriGeometryPoint",
    "spatialReference": {"wkid": 4326},
    "features": [
        {
            "attributes": {
                "Name": "Kungsgatan 19",
                "PostCode": 75332,
                "PostCity": "Uppsala",
                "AddressStatus": 1,
            },
            "geometry": {"x": 17.636340408092241, "y": 59.862445561247561},
        },
        {
            # Landsbygdsadress: byns namn står där gatan annars står. Det är
            # just de här OSM saknar, se prikko/uppsalaadresser.py.
            "attributes": {
                "Name": "Klista 109",
                "PostCode": 75591,
                "PostCity": "Uppsala",
                "AddressStatus": 1,
            },
            "geometry": {"x": 17.515565, "y": 59.870536},
        },
        {
            "attributes": {
                "Name": "Gimogatan 15B",
                "PostCode": 75326,
                "PostCity": "Uppsala",
                "AddressStatus": 1,
            },
            "geometry": {"x": 17.610468, "y": 59.867943},
        },
        {
            # Ingen adressplats: saknar husnummer. Ska inte in i indexet.
            "attributes": {
                "Name": "Kungsgatan",
                "PostCode": 75332,
                "PostCity": "Uppsala",
                "AddressStatus": 1,
            },
            "geometry": {"x": 17.6363, "y": 59.8624},
        },
        {
            # Saknar geometri. Pekar inte ut något.
            "attributes": {
                "Name": "Salavägen 12",
                "PostCode": 75591,
                "PostCity": "Uppsala",
                "AddressStatus": 1,
            },
            "geometry": None,
        },
    ],
}


class Sidhamtning(unittest.TestCase):
    def test_sidan_begar_wgs84_och_stabil_ordning(self):
        query = urllib.parse.parse_qs(urllib.parse.urlparse(page_url(2000, 1000)).query)
        self.assertEqual(query["outSR"], ["4326"])
        self.assertEqual(query["resultOffset"], ["2000"])
        self.assertEqual(query["resultRecordCount"], ["1000"])
        # Utan uttalad sortering får ArcGIS byta radordning mellan anrop, och
        # då hoppar resultOffset över rader. Se page_url.
        self.assertEqual(query["orderByFields"], ["OBJECTID"])


class Radlasning(unittest.TestCase):
    def test_hoppar_over_rader_utan_geometri(self):
        namn = [name for name, _, _, _ in parse_features(PAGE)]
        self.assertIn("Kungsgatan 19", namn)
        self.assertNotIn("Salavägen 12", namn)

    def test_koordinatordningen_ar_x_lng_y_lat(self):
        # ArcGIS lägger longitud i x och latitud i y. Kastas de om hamnar
        # varje nål i Somalia, och looks_like_sweden skulle fälla dem alla.
        rows = {name: (lat, lng) for name, lat, lng, _ in parse_features(PAGE)}
        lat, lng = rows["Kungsgatan 19"]
        self.assertAlmostEqual(lat, 59.862445561247561)
        self.assertAlmostEqual(lng, 17.636340408092241)


class Index(unittest.TestCase):
    def setUp(self):
        self.index = build_index(iter([PAGE]))

    def test_bara_verkliga_adressplatser_kommer_med(self):
        # Fem rader in, tre adressplatser ut: en utan husnummer och en utan
        # geometri räknas bort.
        self.assertEqual(self.index.points, 3)

    def test_slar_upp_gatuadress(self):
        result = self.index.lookup(parse_address("Kungsgatan 19"))
        self.assertEqual(result.reason, MATCHED)
        # Träffen avrundas till sex decimaler, drygt en decimeter. Tjänsten
        # lämnar sjutton, vilket är en precision ingen adresspunkt har.
        self.assertAlmostEqual(result.match.lat, 59.862446, places=6)
        self.assertEqual(result.match.source, SOURCE_UPPSALA)

    def test_slar_upp_landsbygdsadress(self):
        # "Klista 109" är en av de adresser OSM saknade helt.
        result = self.index.lookup(parse_address("Klista 109"))
        self.assertEqual(result.reason, MATCHED)
        self.assertAlmostEqual(result.match.lat, 59.870536, places=6)

    def test_slar_upp_bokstavstillagg(self):
        result = self.index.lookup(parse_address("Gimogatan 15B"))
        self.assertEqual(result.reason, MATCHED)
        self.assertAlmostEqual(result.match.lng, 17.610468, places=6)

    def test_kallan_foljer_med_in_i_traffen(self):
        # geoSource i datafilen kommer härifrån. Skulle den säga "osm" hade
        # sidan tillskrivit OpenStreetMap en koordinat de inte lämnat.
        self.assertEqual(self.index.source, SOURCE_UPPSALA)


class Adressstatus(unittest.TestCase):
    def test_adress_som_inte_ar_i_bruk_hoppas_over(self):
        page = {
            "features": [
                {
                    "attributes": {"Name": "Kungsgatan 19", "AddressStatus": 9},
                    "geometry": {"x": 17.6363, "y": 59.8624},
                }
            ]
        }
        self.assertEqual(build_index(iter([page])).points, 0)

    def test_gallande_status_slapps_igenom(self):
        page = {
            "features": [
                {
                    "attributes": {
                        "Name": "Kungsgatan 19",
                        "AddressStatus": STATUS_IN_USE,
                    },
                    "geometry": {"x": 17.6363, "y": 59.8624},
                }
            ]
        }
        self.assertEqual(build_index(iter([page])).points, 1)


class Rimlighet(unittest.TestCase):
    def test_punkt_utanfor_sverige_slapps_aldrig_in(self):
        # Ett fel i tjänsten, eller en kastad koordinatordning, ska ge noll
        # punkter och inte en nål i Guineabukten.
        page = {
            "features": [
                {
                    "attributes": {"Name": "Kungsgatan 19", "AddressStatus": 1},
                    "geometry": {"x": 59.8624, "y": 17.6363},
                }
            ]
        }
        self.assertEqual(build_index(iter([page])).points, 0)


if __name__ == "__main__":
    unittest.main()
