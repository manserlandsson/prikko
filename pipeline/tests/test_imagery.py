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
            # ~19 m norr om punkten nedan; bäring kamera → punkt är 180° och
            # kompassen 204,5° avviker 24,5°, alltså innanför riktningskravet.
            "compass_angle": 204.5,
            "creator": {"username": "andreas_p", "id": "107249234840764"},
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
                # Kameran står nordost om punkten; bäringen dit är ~199° och
                # 204° avviker bara ~5°, alltså innanför riktningskravet.
                "view:azimuth": 204,
                "geovisio:producer": "serenedeluge",
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

    def test_panoramax_tar_over_nar_mapillary_saknas(self):
        """Panoramax är andrahandskällan, beslutat efter mätningen 2026-08-04.

        Mapillary bär funktionen, men Panoramax vinner lokalt (Uppsala 26,9
        procent inom 60 m), kostar ingenting och kräver ingen token. Utan
        Mapillary-token ska urvalet alltså falla vidare till Panoramax i
        stället för att ge upp.
        """

        def fake(url, timeout=30):
            return MAPILLARY_PAYLOAD if "mapillary" in url else PANORAMAX_PAYLOAD

        imagery._get = fake
        found = imagery.find_candidate(LAT, LNG, token="")
        self.assertIsNotNone(found)
        self.assertEqual(found.source, "panoramax")

    def test_kamera_som_pekar_bort_valjs_bort(self):
        """Närmaste bild kan vara tagen med ryggen mot huset. En bild av
        vägen bort från restaurangen är inte en bild av restaurangen."""
        item = {**MAPILLARY_PAYLOAD["data"][0], "compass_angle": 24.5}
        imagery._get = lambda url, timeout=30: {"data": [item]}
        self.assertIsNone(imagery.find_mapillary(LAT, LNG, token="prov"))

    def test_kompass_saknas_ger_ingen_bild(self):
        """Utan kompassvärde går det inte att veta vad bilden visar, och då
        är rätt svar ingen bild — inte en gissning."""
        item = {**MAPILLARY_PAYLOAD["data"][0]}
        del item["compass_angle"]
        imagery._get = lambda url, timeout=30: {"data": [item]}
        self.assertIsNone(imagery.find_mapillary(LAT, LNG, token="prov"))

    def test_nattbild_valjs_bort(self):
        """Rätt avstånd och rätt riktning hjälper inte en beckmörk
        vindrutebild. Provkörningen mot Linköping valde en sådan, från en
        marsnatt, innan dagsljusgrinden fanns."""
        # 2021-03-10 21:30 UTC = 22:30 svensk tid, långt efter mörkrets inbrott
        item = {**MAPILLARY_PAYLOAD["data"][0], "captured_at": 1615411800000}
        imagery._get = lambda url, timeout=30: {"data": [item]}
        self.assertIsNone(imagery.find_mapillary(LAT, LNG, token="prov"))

    def test_nyare_bild_vinner_inom_samma_avstandsband(self):
        """Två bilder på 19 och 27 m är i praktiken lika nära, och då ska den
        nya vinna: en elva år gammal bild av rätt hus känns ändå inte igen om
        skylten bytts. Mellan banden vinner fortfarande närheten."""
        old_near = MAPILLARY_PAYLOAD["data"][0]  # ~19 m, 2024-08-12
        newer_far = {
            **old_near,
            "id": "222222222222222",
            "captured_at": 1751367600000,  # 2025-07-01 11:00 UTC
            # ~27 m norr om punkten, samma band om 15 m som 19 m-bilden
            "geometry": {"type": "Point", "coordinates": [17.638889, 59.858855]},
        }
        imagery._get = lambda url, timeout=30: {"data": [old_near, newer_far]}
        found = imagery.find_mapillary(LAT, LNG, token="prov")
        self.assertEqual(found.source_id, "222222222222222")

    def test_panoramax_fel_licens_valjs_bort(self):
        """Federationen tillåter CC-BY-SA 4.0 och franska LO 2.0 per bild.
        Vi tar bara CC-BY-SA, så att sajtens licensrad alltid är sann."""
        feature = dict(PANORAMAX_PAYLOAD["features"][0])
        feature["properties"] = {**feature["properties"], "license": "etalab-2.0"}
        imagery._get = lambda url, timeout=30: {"features": [feature]}
        self.assertIsNone(imagery.find_panoramax(LAT, LNG))


class TestValetMellanKandidater(unittest.TestCase):
    """Vilken av de godkända bilderna som faktiskt visas.

    Grindarna avgör vad som FÅR visas. De här testerna handlar om vad som
    BÖR visas bland dem, och ordningen är avstånd, komposition, färskhet.
    """

    def _kandidat(self, **kwargs):
        grund = dict(
            source="mapillary",
            source_id="x",
            fetch_url="u",
            captured_at="2020-06-01",
            compass=0.0,
            lat=59.0,
            lng=17.0,
            distance_m=20.0,
            bearing_off_deg=10.0,
        )
        return imagery.Candidate(**{**grund, **kwargs})

    def test_narmare_band_slar_battre_komposition(self):
        nara = self._kandidat(source_id="nara", distance_m=10.0, bearing_off_deg=40.0)
        mittiruta = self._kandidat(source_id="mitt", distance_m=38.0, bearing_off_deg=1.0)
        self.assertEqual(imagery._pick([mittiruta, nara]).source_id, "nara")

    def test_inom_samma_avstandsband_vinner_bilden_med_motivet_mitt_i(self):
        """Buggen det här testet finns för: bäringen var bara en grind, så en
        bild med verksamheten ute i hörnet kunde vinna över en med fasaden mitt
        i rutan bara för att den var någon meter närmare."""
        kanten = self._kandidat(source_id="kanten", distance_m=21.0, bearing_off_deg=44.0)
        mitten = self._kandidat(source_id="mitten", distance_m=29.0, bearing_off_deg=3.0)
        self.assertEqual(imagery._pick([kanten, mitten]).source_id, "mitten")

    def test_inom_samma_riktningsband_vinner_den_nyaste(self):
        gammal = self._kandidat(
            source_id="gammal", bearing_off_deg=2.0, captured_at="2015-05-01"
        )
        ny = self._kandidat(source_id="ny", bearing_off_deg=12.0, captured_at="2024-05-01")
        self.assertEqual(imagery._pick([gammal, ny]).source_id, "ny")


class TestSokruta(unittest.TestCase):
    """Rutan vi frågar inom ska täcka avståndskravet lika långt åt alla håll.

    Buggen den här klassen finns för: rutan hade en fast sida i GRADER, och en
    longitudgrad är kortare än en latitudgrad, mer ju längre norrut man kommer.
    I Uppsala blev rutan 78 meter hög och 39 meter bred, medan avståndskravet
    var 40 meter. En bild rakt öster om porten föll alltså utanför frågan innan
    något avståndsvillkor hunnit se den, och verksamheter vid en öst-västlig
    gata fick systematiskt färre kandidater.
    """

    def _sidor_i_meter(self, lat: float, meter: float) -> tuple[float, float]:
        import math

        min_lng, min_lat, max_lng, max_lat = imagery._bbox(lat, 17.6, meter)
        halv_lat = (max_lat - min_lat) / 2 * 111320
        halv_lng = (max_lng - min_lng) / 2 * 111320 * math.cos(math.radians(lat))
        return halv_lat, halv_lng

    def test_rutan_ar_lika_bred_som_hog_i_meter(self):
        for lat in (55.4, 59.33, 59.86, 67.85):
            with self.subTest(lat=lat):
                halv_lat, halv_lng = self._sidor_i_meter(lat, 40)
                self.assertAlmostEqual(halv_lat, halv_lng, delta=0.5)

    def test_rutan_racker_till_avstandskravet(self):
        for meter in (20, 40, 60, 100):
            with self.subTest(meter=meter):
                halv_lat, halv_lng = self._sidor_i_meter(59.86, meter)
                self.assertGreater(halv_lat, meter)
                self.assertGreater(halv_lng, meter)

    def test_rutan_haller_sig_under_mapillarys_tak(self):
        """Mapillary avvisar sökrutor som är 0,01 grader eller större."""
        min_lng, min_lat, max_lng, max_lat = imagery._bbox(67.85, 20.2, 100)
        self.assertLess(max_lat - min_lat, 0.01)
        self.assertLess(max_lng - min_lng, 0.01)


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
        self.assertIsNone(imagestore.r2_from_env({"R2_BUCKET": "prikko-bilder"}))
        self.assertIn("R2_ACCOUNT_ID", imagestore.missing_settings({"R2_BUCKET": "b"}))
        self.assertEqual(
            imagestore.missing_settings(
                {name: "x" for name in imagestore.REQUIRED}
            ),
            [],
        )

    def test_r2_valjs_fore_supabase_nar_bada_finns(self):
        """Ordningen är en rangordning och inte en slump.

        Supabase finns för att kunna köra innan R2 är uppsatt. Den dagen
        ägaren skapar R2-nycklarna ska nästa körning byta lagring av sig
        själv, utan att någon behöver komma ihåg en flagga. Faller det här
        testet fortsätter bilderna tyst att skrivas till den trängre
        lagringen med trafiktak.
        """
        bada = {
            **{name: "x" for name in imagestore.REQUIRED},
            "SUPABASE_URL": "https://p.supabase.co",
            "SUPABASE_SERVICE_KEY": "hemlig",
        }
        self.assertIsInstance(imagestore.from_env(bada), imagestore.R2Store)

    def test_supabase_valjs_nar_r2_saknas(self):
        env = {"SUPABASE_URL": "https://p.supabase.co/", "SUPABASE_SERVICE_KEY": "hemlig"}
        store = imagestore.from_env(env)
        self.assertIsInstance(store, imagestore.SupabaseStore)
        self.assertEqual(store.bucket, imagestore.SUPABASE_BUCKET)
        self.assertEqual(
            store.public_base_url,
            "https://p.supabase.co/storage/v1/object/public/prikko-bilder",
        )

    def test_supabase_utan_nyckel_ar_none(self):
        self.assertIsNone(
            imagestore.supabase_from_env({"SUPABASE_URL": "https://p.supabase.co"})
        )
        self.assertIsNone(
            imagestore.supabase_from_env({"SUPABASE_SERVICE_KEY": "hemlig"})
        )

    def test_supabase_skriver_med_upsert_och_ger_publik_url(self):
        """En omkörning ska skriva över samma objekt, inte svara 409.

        Nyckeln är deterministisk (se object_key), så utan `x-upsert` hade
        varje körning efter den första fallit på varje bild som redan fanns.
        """
        sedda: dict = {}

        class FalskSvar:
            def read(self):
                return b""

            def __enter__(self):
                return self

            def __exit__(self, *_):
                return False

        def falsk_urlopen(request, timeout=60):
            sedda["url"] = request.full_url
            sedda["method"] = request.get_method()
            sedda["headers"] = {k.lower(): v for k, v in request.header_items()}
            sedda["data"] = request.data
            return FalskSvar()

        riktig = imagestore.urllib.request.urlopen
        imagestore.urllib.request.urlopen = falsk_urlopen
        try:
            store = imagestore.SupabaseStore(
                url="https://p.supabase.co", service_key="hemlig", bucket="gatubilder"
            )
            url = store.put("gatubilder/linkoping/a b.webp", b"bytes", "image/webp")
        finally:
            imagestore.urllib.request.urlopen = riktig

        self.assertEqual(sedda["method"], "POST")
        self.assertEqual(
            sedda["url"],
            "https://p.supabase.co/storage/v1/object/gatubilder/"
            "gatubilder/linkoping/a%20b.webp",
        )
        self.assertEqual(sedda["headers"]["x-upsert"], "true")
        # `apikey` är det huvud Storage faktiskt läser. Med bara Authorization
        # svarar tjänsten 400 "Invalid Compact JWS", eftersom projektets nyckel
        # är av den nya sorten och inte en JWT. Se kommentaren i put().
        self.assertEqual(sedda["headers"]["apikey"], "hemlig")
        self.assertEqual(sedda["headers"]["authorization"], "Bearer hemlig")
        self.assertEqual(sedda["data"], b"bytes")
        self.assertEqual(
            url,
            "https://p.supabase.co/storage/v1/object/public/gatubilder/"
            "gatubilder/linkoping/a%20b.webp",
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
        # Utan versionsnummer, med avsikt. Mapillarys villkor säger "Creative
        # Commons Share Alike (CC BY-SA)" och nämner ingen version; 4.0 står
        # bara i en hjälpartikel som svarar 403 på maskinella anrop och alltså
        # inte gick att belägga. En licensrad vi inte kan belägga skriver vi
        # inte. Se MAPILLARY_LICENCE i imagery.py.
        self.assertEqual(stored.licence, "CC-BY-SA")
        # CC BY-SA kräver att upphovspersonen namnges, inte bara plattformen.
        self.assertEqual(stored.attribution, "andreas_p / Mapillary, CC BY-SA")

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

    def test_panoramax_licens_lases_per_bild_och_gissas_aldrig(self):
        """Federationen tillåter två licenser och anger dem per bild.

        Att skriva Mapillarys licenskonstant på en Panoramax-bild vore fel även
        de gånger den råkar stämma, så licensen ska komma ur svaret.
        """
        imagery._get = lambda url, timeout=30: PANORAMAX_PAYLOAD
        candidate = imagery.find_panoramax(LAT, LNG)

        self.assertIsNotNone(candidate)
        self.assertEqual(candidate.licence, "CC-BY-SA-4.0")
        self.assertEqual(
            imagery.attribution_text(candidate),
            "serenedeluge / Panoramax, CC BY-SA 4.0",
        )

    def test_panoramax_med_annan_licens_valjs_bort(self):
        """etalab-2.0 förekommer i federationen. Vi tar bara CC BY-SA, så att
        sajtens licensrad är en enda och alltid sann."""
        feature = dict(PANORAMAX_PAYLOAD["features"][0])
        feature["properties"] = {**feature["properties"], "license": "etalab-2.0"}
        imagery._get = lambda url, timeout=30: {"features": [feature]}

        self.assertIsNone(imagery.find_panoramax(LAT, LNG))

    def test_fotografen_lases_ur_providers_nar_den_finns(self):
        """`providers` är STAC-standardens form, `geovisio:producer` en
        dubblett. Standardformen ska vinna."""
        feature = dict(PANORAMAX_PAYLOAD["features"][0])
        feature["providers"] = [
            {"name": "instansen", "roles": ["host"]},
            {"name": "ratt-fotograf", "roles": ["producer"]},
        ]
        imagery._get = lambda url, timeout=30: {"features": [feature]}

        candidate = imagery.find_panoramax(LAT, LNG)
        self.assertEqual(candidate.creator, "ratt-fotograf")

    def test_ingen_bild_nara_nog_ger_none_och_ingen_skrivning(self):
        store = FakeStore()
        imagery._get = lambda url, timeout=30: {"data": [], "features": []}
        self.assertIsNone(imagery.capture(store, "linkoping", "SE-1", LAT, LNG, token="prov"))
        self.assertEqual(store.written, [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
