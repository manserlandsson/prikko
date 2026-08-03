"""Tester för bildkedjan: hitta, hämta, lagra.

Fixturerna är verkliga svar, förkortade: Mapillary-svaret är formen deras
graph-API returnerar, Panoramax-objektet är hämtat från api.panoramax.xyz
2026-08-03 och är en riktig bild i Uppsala.

Den viktigaste kontrollen här är den sista: att ingen efemär käll-URL kan ta
sig in i det vi sparar. Det var precis den buggen som gjorde att bilderna hade
slutat visas i drift utan att bygget klagade.

Kör:  python3 pipeline/tests/test_imagery.py
"""

import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path
from tempfile import TemporaryDirectory

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko import imagery, imagestore  # noqa: E402

# Signerad miniatyr-URL, formen Mapillary svarar med. Den har en utgångstid och
# får aldrig lagras. Testerna nedan letar efter just den här strängen.
SIGNED = (
    "https://scontent-arn2-1.xx.fbcdn.net/m1/v/z/AAA.jpg"
    "?stp=s1024x768&ccb=10-5&oh=00_AfDEADBEEF&oe=68ABCDEF&_nc_sid=201bca"
)

MAPILLARY_PAYLOAD = {
    "data": [
        {
            "id": "498763468214164",
            "thumb_1024_url": SIGNED,
            "captured_at": 1723438554000,
            "compass_angle": 204.5,
            # ~19 m från punkten nedan
            "geometry": {"type": "Point", "coordinates": [17.638889, 59.858782]},
        },
        {
            "id": "111111111111111",
            "thumb_1024_url": SIGNED,
            "captured_at": 1600000000000,
            "compass_angle": 12.0,
            # ~150 m bort, ska aldrig väljas
            "geometry": {"type": "Point", "coordinates": [17.638889, 59.860200]},
        },
    ]
}

PANORAMAX_PAYLOAD = {
    "features": [
        {
            "id": "ec771bb4-5fa5-49a5-864f-a5a8b7af8259",
            "geometry": {"type": "Point", "coordinates": [17.638950, 59.858700]},
            "assets": {
                "hd": {"href": "https://example.invalid/permanent/ec.jpg"},
                "sd": {"href": "https://example.invalid/derivatives/ec/sd.jpg"},
                "thumb": {"href": "https://example.invalid/derivatives/ec/thumb.jpg"},
            },
            "properties": {
                "datetime": "2024-08-12T04:55:54+00:00",
                "license": "CC-BY-SA-4.0",
                "view:azimuth": 204,
            },
        }
    ]
}

LAT, LNG = 59.858611, 17.638889


class FakeStore:
    """Lagring som bara minns. Kedjan ska gå att prova utan konto."""

    def __init__(self) -> None:
        self.written: list[tuple[str, bytes, str]] = []

    def put(self, key: str, data: bytes, content_type: str) -> str:
        self.written.append((key, data, content_type))
        return f"https://bilder.prikko.se/{key}"


class TestSokning(unittest.TestCase):
    def setUp(self) -> None:
        self._get = imagery._get

    def tearDown(self) -> None:
        imagery._get = self._get

    def test_mapillary_valjer_narmaste(self):
        imagery._get = lambda url, timeout=30: MAPILLARY_PAYLOAD
        found = imagery.find_mapillary(LAT, LNG, token="prov")
        self.assertIsNotNone(found)
        self.assertEqual(found.source_id, "498763468214164")
        self.assertEqual(found.source, "mapillary")
        self.assertLess(found.distance_m, 30)

    def test_mapillary_utan_token_ger_none(self):
        called = []
        imagery._get = lambda url, timeout=30: called.append(url) or MAPILLARY_PAYLOAD
        self.assertIsNone(imagery.find_mapillary(LAT, LNG, token=""))
        self.assertEqual(called, [], "utan token ska inget anrop göras")

    def test_epoktid_blir_isodatum(self):
        """Kolumnen captured_at är ett `date`. Mapillary svarar med epok-ms.

        Tidigare skrevs epoktiden rakt in och sajten läste den som ett tal,
        vilket är två oförenliga former för samma fält.
        """
        imagery._get = lambda url, timeout=30: MAPILLARY_PAYLOAD
        found = imagery.find_mapillary(LAT, LNG, token="prov")
        self.assertEqual(found.captured_at, "2024-08-12")

    def test_for_langt_bort_ger_none(self):
        imagery._get = lambda url, timeout=30: MAPILLARY_PAYLOAD
        self.assertIsNone(imagery.find_mapillary(LAT, LNG, token="prov", max_distance=5))

    def test_panoramax_utan_token(self):
        imagery._get = lambda url, timeout=30: PANORAMAX_PAYLOAD
        found = imagery.find_panoramax(LAT, LNG)
        self.assertIsNotNone(found)
        self.assertEqual(found.source, "panoramax")
        self.assertEqual(found.captured_at, "2024-08-12")
        self.assertTrue(found.fetch_url.endswith("/sd.jpg"))

    def test_panoramax_tar_thumb_nar_vi_inte_kan_skala(self):
        imagery._get = lambda url, timeout=30: PANORAMAX_PAYLOAD
        found = imagery.find_panoramax(LAT, LNG, prefer_large=False)
        self.assertTrue(found.fetch_url.endswith("/thumb.jpg"))

    def test_panoramax_tar_over_nar_mapillary_ar_tom(self):
        def fake(url, timeout=30):
            return MAPILLARY_PAYLOAD if "mapillary" in url else PANORAMAX_PAYLOAD

        imagery._get = fake
        # Utan token hoppas Mapillary över helt.
        found = imagery.find_candidate(LAT, LNG, token="")
        self.assertEqual(found.source, "panoramax")


class TestLagring(unittest.TestCase):
    def test_nyckeln_ar_deterministisk_och_saker(self):
        key = imagery.object_key("linkoping", "SE/0580/Café Ö & Co", "webp")
        self.assertEqual(key, "gatubilder/linkoping/SE-0580-Caf-Co.webp")
        self.assertEqual(key, imagery.object_key("linkoping", "SE/0580/Café Ö & Co", "webp"))

    def test_lokal_lagring_skriver_filen(self):
        with TemporaryDirectory() as tmp:
            store = imagestore.LocalStore(
                directory=Path(tmp), public_base_url="https://bilder.prikko.se/"
            )
            url = store.put("gatubilder/a/b.webp", b"bytes", "image/webp")
            self.assertEqual(url, "https://bilder.prikko.se/gatubilder/a/b.webp")
            self.assertEqual((Path(tmp) / "gatubilder/a/b.webp").read_bytes(), b"bytes")

    def test_okonfigurerad_lagring_ar_none_inte_halvfardig(self):
        self.assertIsNone(imagestore.from_env({"R2_BUCKET": "prikko-bilder"}))
        self.assertIn("R2_ACCOUNT_ID", imagestore.missing_settings({"R2_BUCKET": "b"}))
        self.assertEqual(
            imagestore.missing_settings(
                {name: "x" for name in imagestore.REQUIRED}
            ),
            [],
        )


class TestSignering(unittest.TestCase):
    """SigV4 mot R2. Ett felplacerat radbryt ger en giltig men värdelös
    signatur, och felet syns först som 403 långt senare."""

    def test_kanonisk_begaran_har_ratt_form(self):
        request, signed = imagestore.canonical_request(
            "PUT",
            "/prikko-bilder/gatubilder/linkoping/1.webp",
            {"Host": "acc.r2.cloudflarestorage.com", "Content-Type": "image/webp"},
            "abc123",
        )
        self.assertEqual(signed, "content-type;host")
        self.assertEqual(
            request,
            "PUT\n"
            "/prikko-bilder/gatubilder/linkoping/1.webp\n"
            "\n"
            "content-type:image/webp\n"
            "host:acc.r2.cloudflarestorage.com\n"
            "\n"
            "content-type;host\n"
            "abc123",
        )

    def test_mot_aws_egen_testvektor(self):
        """AWS publicerade exempel "PUT Object" för Signature Version 4.

        Nyckel, hemlighet, tid och förväntad signatur kommer ur AWS egen
        dokumentation. Det är den enda kontroll som visar att implementationen
        är RÄTT och inte bara konsekvent med sig själv. Faller det här testet
        svarar R2 med 403 och inget annat.
        """
        headers = imagestore.authorization_header(
            method="PUT",
            host="examplebucket.s3.amazonaws.com",
            path="/test%24file.text",
            payload=b"Welcome to Amazon S3.",
            content_type=None,
            access_key="AKIAIOSFODNN7EXAMPLE",
            secret_key="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
            now=datetime(2013, 5, 24, tzinfo=timezone.utc),
            extra_headers={
                "date": "Fri, 24 May 2013 00:00:00 GMT",
                "x-amz-storage-class": "REDUCED_REDUNDANCY",
            },
            region="us-east-1",
        )
        self.assertEqual(
            headers["x-amz-content-sha256"],
            "44ce7dd67c959e0d3524ffac1771dfbba87d2b6b4b4e99e42034a8b803f8b072",
        )
        self.assertIn(
            "SignedHeaders=date;host;x-amz-content-sha256;x-amz-date;x-amz-storage-class",
            headers["Authorization"],
        )
        self.assertIn(
            "Signature=98ad721746da40c64f1a55b78f14c238"
            "d841ea1380cd77a1b5971af0ece108bd",
            headers["Authorization"],
        )

    def test_r2_signerar_i_auto_och_s3(self):
        headers = imagestore.authorization_header(
            method="PUT",
            host="abc123.r2.cloudflarestorage.com",
            path="/prikko-bilder/gatubilder/linkoping/1.webp",
            payload=b"prikko",
            content_type="image/webp",
            access_key="AKIAPROV",
            secret_key="hemlighet",
            now=datetime(2026, 8, 3, 12, 0, 0, tzinfo=timezone.utc),
        )
        self.assertEqual(headers["x-amz-date"], "20260803T120000Z")
        self.assertIn(
            "Credential=AKIAPROV/20260803/auto/s3/aws4_request",
            headers["Authorization"],
        )
        self.assertIn(
            "SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date",
            headers["Authorization"],
        )

    def test_nyckeln_uri_kodas_men_snedstrecken_star_kvar(self):
        self.assertEqual(
            imagestore._quote_key("gatubilder/linkoping/a b.webp"),
            "gatubilder/linkoping/a%20b.webp",
        )


class TestHelaKedjan(unittest.TestCase):
    def setUp(self) -> None:
        self._get = imagery._get
        self._download = imagery.download
        imagery._get = lambda url, timeout=30: MAPILLARY_PAYLOAD
        imagery.download = lambda candidate, timeout=60: (b"\xff\xd8jpegbytes", "image/jpeg")

    def tearDown(self) -> None:
        imagery._get = self._get
        imagery.download = self._download

    def test_capture_sparar_var_egen_url_aldrig_kallans(self):
        store = FakeStore()
        stored = imagery.capture(store, "linkoping", "SE-1", LAT, LNG, token="prov")

        self.assertIsNotNone(stored)
        self.assertEqual(len(store.written), 1, "bytesen ska ha laddats ned och lagrats")
        self.assertEqual(stored.url, "https://bilder.prikko.se/gatubilder/linkoping/SE-1.jpg")
        self.assertEqual(stored.source, "mapillary")
        self.assertEqual(stored.source_id, "498763468214164")
        self.assertEqual(stored.licence, "CC-BY-SA-4.0")
        self.assertEqual(stored.attribution, "Mapillary, CC BY-SA 4.0")

    def test_ingen_signerad_url_lacker_ut_i_det_vi_sparar(self):
        """Regressionen. Det här var buggen: en signerad URL med utgångstid
        skrevs till public.images.url och renderades som `<img src>`."""
        store = FakeStore()
        stored = imagery.capture(store, "linkoping", "SE-1", LAT, LNG, token="prov")

        for value in (stored.url, stored.source_id, stored.attribution, stored.licence):
            self.assertNotIn("fbcdn", str(value))
            self.assertNotIn("oe=", str(value))
            self.assertNotEqual(value, SIGNED)

    def test_360_utvikning_lagras_inte(self):
        """Mätt på tolv verkliga Panoramax-träffar: tre var 360-bilder, och alla
        tre visade bilens tak i stället för en fasad."""
        try:
            import io

            from PIL import Image
        except ImportError:
            self.skipTest("Pillow saknas, då går formen inte att avgöra")

        buffer = io.BytesIO()
        Image.new("RGB", (1024, 512)).save(buffer, format="JPEG")
        imagery.download = lambda candidate, timeout=60: (buffer.getvalue(), "image/jpeg")

        store = FakeStore()
        self.assertIsNone(imagery.capture(store, "linkoping", "SE-1", LAT, LNG, token="prov"))
        self.assertEqual(store.written, [])

    def test_mapillary_hoppar_over_sfariska_utan_att_hamta(self):
        imagery._get = lambda url, timeout=30: {
            "data": [
                {
                    **MAPILLARY_PAYLOAD["data"][0],
                    "camera_type": "spherical",
                }
            ]
        }
        self.assertIsNone(imagery.find_mapillary(LAT, LNG, token="prov"))

    def test_panoramax_hoppar_over_sfariska_utan_att_hamta(self):
        feature = dict(PANORAMAX_PAYLOAD["features"][0])
        feature["properties"] = {
            **feature["properties"],
            "pers:interior_orientation": {"sensor_array_dimensions": [5760, 2880]},
        }
        imagery._get = lambda url, timeout=30: {"features": [feature]}
        self.assertIsNone(imagery.find_panoramax(LAT, LNG))

    def test_ingen_bild_nara_nog_ger_none_och_ingen_skrivning(self):
        store = FakeStore()
        imagery._get = lambda url, timeout=30: {"data": [], "features": []}
        self.assertIsNone(imagery.capture(store, "linkoping", "SE-1", LAT, LNG, token="prov"))
        self.assertEqual(store.written, [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
