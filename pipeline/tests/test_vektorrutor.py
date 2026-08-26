"""Tester för Mapillarys vektorrutor: rutmatematiken och avkodaren.

Fixturen byggs av en KODARE i testet i stället för att en riktig ruta läggs i
repot. Skälet är storleken: en z14-ruta över Linköpings centrum väger 566 kB
och över Stockholm mer än så, och en binär fil i den storleken i git för att
kontrollera fyra fält är fel pris. Kodaren nedan skriver samma trådformat som
Mapillary skickar, så avkodaren prövas mot bytes den inte själv har skrivit.

Kör:  python3 -m pytest pipeline/tests/test_vektorrutor.py -q
"""

import struct
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko import vektorrutor  # noqa: E402


# ---------------------------------------------------------------------------
# En minimal MVT-kodare, bara för fixturen
# ---------------------------------------------------------------------------


def _varint(n: int) -> bytes:
    ut = bytearray()
    while True:
        byte = n & 0x7F
        n >>= 7
        if n:
            ut.append(byte | 0x80)
        else:
            ut.append(byte)
            return bytes(ut)


def _falt(nummer: int, trad: int) -> bytes:
    return _varint(nummer << 3 | trad)


def _langd(nummer: int, kropp: bytes) -> bytes:
    return _falt(nummer, 2) + _varint(len(kropp)) + kropp


def _sicksack(n: int) -> int:
    return (n << 1) ^ (n >> 31)


def _varde(v) -> bytes:
    """Vector-tile-specens Value, en av sju typer."""
    if isinstance(v, bool):
        return _langd(4, _falt(7, 0) + _varint(int(v)))
    if isinstance(v, str):
        return _langd(4, _langd(1, v.encode("utf-8")))
    if isinstance(v, float):
        return _langd(4, _falt(3, 1) + struct.pack("<d", v))
    return _langd(4, _falt(5, 0) + _varint(v))


def bygg_ruta(lager: str, punkter: list[tuple[int, int, dict]], extent: int = 4096) -> bytes:
    """En vektorruta med ett lager och några punktdrag."""
    nycklar: list[str] = []
    varden: list = []
    drag = b""

    for px, py, attribut in punkter:
        taggar = b""
        for nyckel, varde in attribut.items():
            if nyckel not in nycklar:
                nycklar.append(nyckel)
            if varde not in varden:
                varden.append(varde)
            taggar += _varint(nycklar.index(nyckel)) + _varint(varden.index(varde))
        geometri = _varint(1 << 3 | 1) + _varint(_sicksack(px)) + _varint(_sicksack(py))
        kropp = (
            _langd(2, taggar)
            + _falt(3, 0) + _varint(1)          # GeomType.POINT
            + _langd(4, geometri)
        )
        drag += _langd(2, kropp)

    lagerkropp = (
        _falt(15, 0) + _varint(2)               # version
        + _langd(1, lager.encode("utf-8"))
        + drag
        + b"".join(_langd(3, n.encode("utf-8")) for n in nycklar)
        + b"".join(_varde(v) for v in varden)
        + _falt(5, 0) + _varint(extent)
    )
    return _langd(3, lagerkropp)


# ---------------------------------------------------------------------------


class Rutmatematik(unittest.TestCase):
    def test_ruta_for_kant_stampeln(self):
        """Storgatan i Linköping ligger i den ruta Mapillary faktiskt svarade på."""
        self.assertEqual(vektorrutor.ruta_for(58.411056, 15.626088), (8903, 4899))

    def test_rutbredd_krymper_mot_polen(self):
        vid_stockholm = vektorrutor.rutbredd_m(59.33)
        vid_malmo = vektorrutor.rutbredd_m(55.6)
        self.assertLess(vid_stockholm, vid_malmo)
        # Talet som står i modulhuvudet, och som hela kostnadsargumentet vilar på.
        self.assertAlmostEqual(vid_stockholm, 1248, delta=2)

    def test_utan_marginal_blir_det_en_ruta(self):
        self.assertEqual(
            len(vektorrutor.rutor_for([(59.3293, 18.0686)], radie_m=0)), 1
        )

    def test_marginalen_tar_med_grannrutan_vid_en_kant(self):
        """En punkt strax innanför en rutgräns måste hämta grannen.

        DET HÄR ÄR DEN TYSTA BUGGEN MODULEN FINNS FÖR ATT INTE FÅ. Utan
        marginal svarar registret "ingen bild" för en verksamhet vars närmaste
        bilder ligger på andra sidan gränsen, och felet ser ut som glesare
        täckning i stället för som ett fel.
        """
        # Rutans västra kant: den longitud där heltalsdelen växer.
        x, y = vektorrutor.ruta_for(59.3293, 18.0686)
        n = 2 ** vektorrutor.ZOOM
        kantlangd = (x / n) * 360.0 - 180.0
        strax_innanfor = kantlangd + 0.00005      # några meter in i rutan

        utan = vektorrutor.rutor_for([(59.3293, strax_innanfor)], radie_m=0)
        med = vektorrutor.rutor_for([(59.3293, strax_innanfor)], radie_m=30)
        self.assertEqual(len(utan), 1)
        self.assertIn((x - 1, y), med)
        self.assertIn((x, y), med)

    def test_punkt_i_ruta_ar_omvandningen_av_ruta_flyttal(self):
        lat, lng = 58.411056, 15.626088
        z = vektorrutor.ZOOM
        fx, fy = vektorrutor.ruta_flyttal(lat, lng, z)
        x, y = int(fx), int(fy)
        tillbaka = vektorrutor.punkt_i_ruta(
            z, x, y, (fx - x) * 4096, (fy - y) * 4096, 4096
        )
        self.assertAlmostEqual(tillbaka[0], lat, places=5)
        self.assertAlmostEqual(tillbaka[1], lng, places=5)


class Avkodaren(unittest.TestCase):
    def test_laser_falten_urvalet_behover(self):
        rå = bygg_ruta("image", [(2048, 2048, {
            "id": 283833250063349,
            "compass_angle": 147.02985067132,
            "captured_at": 1435739391910,
            "is_pano": False,
            "sequence_id": "IchOIPWExvUroc7tFxu-mA",
        })])
        bilder = vektorrutor.avkoda(rå, 14, 8903, 4899)
        self.assertEqual(len(bilder), 1)
        bild = bilder[0]
        self.assertEqual(bild.id, "283833250063349")
        self.assertAlmostEqual(bild.kompass, 147.02985067132, places=6)
        self.assertEqual(bild.fangad_ms, 1435739391910)
        self.assertFalse(bild.panorama)
        self.assertEqual(bild.sekvens, "IchOIPWExvUroc7tFxu-mA")

    def test_punkten_hamnar_inne_i_sin_egen_ruta(self):
        """Rutans mittpunkt ska avkodas till rutans mittpunkt, inte till grannens."""
        z, x, y = 14, 8903, 4899
        rå = bygg_ruta("image", [(2048, 2048, {"id": 1, "is_pano": False})])
        bild = vektorrutor.avkoda(rå, z, x, y)[0]
        self.assertEqual(vektorrutor.ruta_for(bild.lat, bild.lng, z), (x, y))

    def test_andra_lager_lamnas_darhan(self):
        """`sequence` bär linjer och `overview` sammanfattningar. Vi vill ha bilder."""
        rå = bygg_ruta("sequence", [(2048, 2048, {"id": 1})])
        self.assertEqual(vektorrutor.avkoda(rå, 14, 8903, 4899), [])

    def test_panoramaflaggan_overlever(self):
        """360-bilder gallras av urvalet, så flaggan måste komma hela vägen fram."""
        rå = bygg_ruta("image", [(1000, 1000, {"id": 7, "is_pano": True})])
        self.assertTrue(vektorrutor.avkoda(rå, 14, 8903, 4899)[0].panorama)

    def test_bild_utan_kompass_far_none_och_inte_noll(self):
        """Noll grader är norrut. En saknad kompass är något annat.

        `imagery.bearing_off` svarar None på en saknad kompass och grinden
        kastar bilden. Skulle avkodaren skriva 0.0 i stället skulle var
        tjugonde bild i tysthet påstå att kameran pekade rakt norrut.
        """
        rå = bygg_ruta("image", [(1000, 1000, {"id": 9, "is_pano": False})])
        self.assertIsNone(vektorrutor.avkoda(rå, 14, 8903, 4899)[0].kompass)

    def test_flera_drag_i_samma_ruta(self):
        rå = bygg_ruta("image", [
            (500, 500, {"id": 1, "is_pano": False}),
            (1500, 900, {"id": 2, "is_pano": False}),
            (3000, 3000, {"id": 3, "is_pano": False}),
        ])
        bilder = vektorrutor.avkoda(rå, 14, 8903, 4899)
        self.assertEqual([b.id for b in bilder], ["1", "2", "3"])

    def test_tom_ruta_ger_tom_lista(self):
        self.assertEqual(vektorrutor.avkoda(b"", 14, 8903, 4899), [])


if __name__ == "__main__":
    unittest.main()


class Urvalet(unittest.TestCase):
    """Grindarna i kön ska vara `imagery`s egna och inte en andra uppsättning.

    Två uppsättningar regler som ska föreställa samma sak glider isär, och
    glappet syns inte: utfallet blir bara att granskningskön visar en annan
    bild än den nattkörningen skulle ha valt. Testerna nedan prövar därför att
    `valj_ur_rutan` svarar som `imagery` skulle ha gjort, inte att den svarar
    som någon tycker att den borde.
    """

    def setUp(self):
        sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
        from gatubildsko import valj_ur_rutan  # noqa: PLC0415

        self.valj = valj_ur_rutan
        self.lat, self.lng = 58.4110, 15.6260

    def _bild(self, **fält):
        """En bild strax söder om punkten, med kameran vänd norrut mot den."""
        grund = dict(
            id="1",
            lat=self.lat - 0.00018,   # ca 20 m söder om
            lng=self.lng,
            kompass=0.0,              # rakt norrut, alltså mot verksamheten
            fangad_ms=1435739391910,  # 2015-07-01, mitt på dagen
            panorama=False,
            sekvens=None,
        )
        grund.update(fält)
        return vektorrutor.Rutbild(**grund)

    def test_en_giltig_bild_valjs(self):
        vald = self.valj(self.lat, self.lng, [self._bild()])
        self.assertIsNotNone(vald)
        self.assertEqual(vald.source_id, "1")
        self.assertEqual(vald.source, "mapillary")
        # Käll-URL:en är efemär och får aldrig fyllas i här. Se imagery.py.
        self.assertEqual(vald.fetch_url, "")

    def test_panorama_gallras(self):
        self.assertIsNone(self.valj(self.lat, self.lng, [self._bild(panorama=True)]))

    def test_for_langt_bort_gallras(self):
        # 90 m söder om, alltså långt utanför trettiometersgränsen.
        self.assertIsNone(
            self.valj(self.lat, self.lng, [self._bild(lat=self.lat - 0.0008)])
        )

    def test_kameran_bortvand_gallras(self):
        # Bilden ligger söder om punkten och kameran pekar söderut, alltså bort.
        self.assertIsNone(self.valj(self.lat, self.lng, [self._bild(kompass=180.0)]))

    def test_utan_kompass_gallras(self):
        """Hellre ingen bild än en gissning om vart kameran pekade."""
        self.assertIsNone(self.valj(self.lat, self.lng, [self._bild(kompass=None)]))

    def test_natten_gallras(self):
        # 2015-03-01 kl. 02 svensk tid. Provkörningen mot Linköping valde
        # annars en beckmörk vindrutebild med skarp kompass och rätt avstånd.
        self.assertIsNone(
            self.valj(self.lat, self.lng, [self._bild(fangad_ms=1425171600000)])
        )

    def test_tom_lista_ger_none(self):
        self.assertIsNone(self.valj(self.lat, self.lng, []))
