"""Tester för SCB:s statistikdatabas.

Inget nät. Svaren nedan är avskrivna ur riktiga anrop mot
api.scb.se/OV0104/v2beta 2026-08-06, nedbantade till några regioner. Det som
testas är det som kan gå sönder tyst:

- att tabellens rubrik och varje vald värdekods etikett kontrolleras, för ett
  tabell-id kan överleva en omläggning som byter innebörd på en kod,
- att rubrikens årsintervall INTE jämförs, för det byter årtal varje gång
  tabellen fylls på,
- att riket och länen sorteras bort ur svaret,
- att ett urval som lämnat mer än ett värde per kommun stoppar körningen i
  stället för att plocka det första talet.

Kör:  python3 pipeline/tests/test_scb.py
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.sources import scb  # noqa: E402
from prikko.sources.scb import ScbChanged, Table  # noqa: E402

TABLE = scb.HOTEL_AND_RESTAURANT_JOBS


def metadata(**overrides) -> dict:
    """Metadatan som /tables/TAB3204/metadata svarar, i miniatyr."""
    payload = {
        "label": (
            "Sysselsatta 15–74 år efter region, kön, näringsgren (SNI 2007) "
            "och födelseregion. Årligt register. År 2020-2024"
        ),
        "dimension": {
            "Region": {"category": {"index": {"00": 0, "01": 1, "0180": 2}}},
            "Kon": {
                "category": {
                    "index": {"1": 0, "2": 1, "1+2": 2},
                    "label": {"1": "män", "2": "kvinnor", "1+2": "totalt"},
                }
            },
            "SNI2007": {
                "category": {
                    "index": {"H": 0, "I": 1},
                    "label": {
                        "H": "transport- och magasineringsföretag",
                        "I": "hotell och restauranger",
                    },
                }
            },
            "Fodelseregion": {
                "category": {"index": {"tot": 0}, "label": {"tot": "totalt"}}
            },
            "ContentsCode": {
                "category": {
                    "index": {"000002XH": 0, "000002XI": 1},
                    "label": {
                        "000002XH": "sysselsatta efter arbetsställets belägenhet",
                        "000002XI": "sysselsatta efter bostadens belägenhet",
                    },
                }
            },
            "Tid": {
                "category": {
                    "index": {"2020": 0, "2021": 1, "2022": 2, "2023": 3, "2024": 4}
                }
            },
        },
    }
    payload.update(overrides)
    return payload


def data(values, index=None, size=None) -> dict:
    """Ett datasvar i json-stat2, med riket, ett län och tre kommuner."""
    return {
        "id": ["Region", "Kon", "SNI2007", "Fodelseregion", "ContentsCode", "Tid"],
        "size": size or [len(index or {}), 1, 1, 1, 1, 1],
        "dimension": {
            "Region": {
                "category": {
                    "index": index
                    if index is not None
                    else {"00": 0, "01": 1, "0180": 2, "0885": 3, "1465": 4}
                }
            }
        },
        "value": values,
    }


class Rubriken(unittest.TestCase):
    def test_arsintervallet_ar_inte_en_del_av_jamforelsen(self):
        """Tabellen fylls på med ett år varje november. Det är inte en ändring."""
        payload = metadata(
            label=(
                "Sysselsatta 15–74 år efter region, kön, näringsgren (SNI 2007) "
                "och födelseregion. Årligt register. År 2020-2030"
            )
        )
        self.assertIsNotNone(self._verify(payload))

    def test_annan_rubrik_stoppar(self):
        payload = metadata(
            label="Sysselsatta 15–74 år efter region och kön. År 2020-2024"
        )
        with self.assertRaises(ScbChanged) as caught:
            self._verify(payload)
        self.assertIn("TAB3204", str(caught.exception))

    def _verify(self, payload: dict):
        original = scb._metadata
        scb._metadata = lambda table: payload
        try:
            return scb.verify(TABLE)
        finally:
            scb._metadata = original


class Vardekoderna(unittest.TestCase):
    """Det viktigaste testet i filen. Se modulens inledning i scb.py."""

    def _verify(self, payload: dict):
        original = scb._metadata
        scb._metadata = lambda table: payload
        try:
            return scb.verify(TABLE)
        finally:
            scb._metadata = original

    def test_kod_som_bytt_betydelse_stoppar(self):
        payload = metadata()
        payload["dimension"]["SNI2007"]["category"]["label"]["I"] = (
            "informations- och kommunikationsföretag"
        )
        with self.assertRaises(ScbChanged) as caught:
            self._verify(payload)
        self.assertIn("hotell och restauranger", str(caught.exception))

    def test_borttagen_kod_stoppar(self):
        payload = metadata()
        del payload["dimension"]["ContentsCode"]["category"]["index"]["000002XH"]
        with self.assertRaises(ScbChanged):
            self._verify(payload)

    def test_borttagen_dimension_stoppar(self):
        payload = metadata()
        del payload["dimension"]["Fodelseregion"]
        with self.assertRaises(ScbChanged):
            self._verify(payload)

    def test_oforandrad_tabell_slapper_igenom(self):
        self.assertIn("dimension", self._verify(metadata()))


class Kommunerna(unittest.TestCase):
    def test_riket_och_lanen_sorteras_bort(self):
        values = scb._municipal_values(
            data([500000.0, 90000.0, 38472.0, 402.0, 47.0]), TABLE
        )
        self.assertEqual(
            values, {"0180": 38472.0, "0885": 402.0, "1465": 47.0}
        )

    def test_kommun_utan_varde_saknas_helt(self):
        """Null är inte noll. En kommun utan tal ska inte få en nolla."""
        values = scb._municipal_values(
            data([500000.0, 90000.0, 38472.0, None, 47.0]), TABLE
        )
        self.assertNotIn("0885", values)
        self.assertEqual(len(values), 2)

    def test_flera_varden_per_kommun_stoppar(self):
        """Ett urval som glidit isär får inte tolkas, det ska fälla körningen."""
        payload = data(
            [1.0, 2.0], index={"0180": 0}, size=[1, 2, 1, 1, 1, 1]
        )
        with self.assertRaises(ScbChanged) as caught:
            scb._municipal_values(payload, TABLE)
        self.assertIn("Kon", str(caught.exception))


class Aret(unittest.TestCase):
    def setUp(self):
        self.calls = []

    def _latest(self, by_year: dict, years_back: int = 4):
        def fake_get(path, params=None):
            year = dict(params)["valueCodes[Tid]"]
            self.calls.append(year)
            return data(by_year.get(year, [None] * 5))

        original = scb._get
        scb._get = fake_get
        try:
            return scb.latest(TABLE, metadata(), years_back=years_back)
        finally:
            scb._get = original

    def test_tar_senaste_aret_med_varden(self):
        series = self._latest({"2024": [1.0, 2.0, 38472.0, 402.0, 47.0]})
        self.assertEqual(series.year, 2024)
        self.assertEqual(self.calls, ["2024"])

    def test_gar_bakat_nar_senaste_aret_ar_tomt(self):
        """Ett år som lagts till men ännu inte fyllts ska inte ge en tom sida."""
        series = self._latest({"2022": [1.0, 2.0, 30000.0, 300.0, 40.0]})
        self.assertEqual(series.year, 2022)
        self.assertEqual(self.calls, ["2024", "2023", "2022"])

    def test_inga_ar_med_varden_stoppar(self):
        with self.assertRaises(ScbChanged):
            self._latest({})


class Urvalet(unittest.TestCase):
    def test_tabellen_beskriver_sitt_eget_urval(self):
        """Varje vald dimension måste bära både kod och avskriven etikett."""
        for table in scb.TABLES:
            self.assertIsInstance(table, Table)
            self.assertTrue(table.selection)
            for dimension, pair in table.selection.items():
                self.assertEqual(len(pair), 2, dimension)
                self.assertTrue(all(pair), dimension)

    def test_rubriken_bar_inget_arsintervall(self):
        """Skrivs årsintervallet av i TABLES går verify sönder varje november."""
        for table in scb.TABLES:
            self.assertNotIn(scb.PERIOD_SUFFIX, table.title)


if __name__ == "__main__":
    unittest.main(verbosity=2)
