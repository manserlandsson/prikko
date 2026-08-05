"""Tester för kopplingen myndighet till kommun.

Fallen nedan är verkliga rader ur "Sveriges livsmedelskontroll 2024", och
varje test är en felläsning som annars hade skickat ett mejl till fel
myndighet eller inget mejl alls.

Kör:  python3 pipeline/tests/test_myndigheter.py
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.myndigheter import (  # noqa: E402
    ControlAuthority,
    build,
    merge_fragments,
    municipalities_in,
)
from prikko.sources.livsmedelsverket import Authority  # noqa: E402

#: Ett urval kommuner, med riktiga koder ur SCB:s indelning.
CODES = {
    "Stockholm": "0180",
    "Berg": "0331",
    "Härjedalen": "2361",
    "Hällefors": "1863",
    "Ljusnarsberg": "1864",
    "Lindesberg": "1885",
    "Nora": "1884",
    "Malå": "2418",
    "Norsjö": "2417",
    "Dals-Ed": "1438",
    "Ed": "9999",
    "Mariestad": "1493",
    "Töreboda": "1473",
    "Gullspång": "1447",
    "Simrishamn": "1291",
    "Tomelilla": "1270",
    "Ystad": "1286",
    "Upplands-Bro": "0139",
}


class TestMunicipalitiesIn(unittest.TestCase):
    def test_gemensam_namnd_raknar_upp_sina_kommuner(self):
        name = "Ystad-Österlenregionens Miljöförbund Simrishamn Tomelilla Ystad"
        self.assertEqual(
            municipalities_in(name, CODES), sorted(["1291", "1270", "1286"])
        )

    def test_bergslagen_ar_inte_kommunen_berg(self):
        """Delsträngsmatchning hade gett Berg fyra gånger om."""
        name = "Samhällsbyggnadsnämnden Bergslagen Hällefors Ljusnarsberg Nora Lindesberg"
        self.assertEqual(
            municipalities_in(name, CODES),
            sorted(["1863", "1864", "1884", "1885"]),
        )

    def test_genitiv_s_pa_sista_ordet(self):
        """Rapporten skriver Härjedalens, kommunen heter Härjedalen."""
        name = "Berg och Härjedalens miljö-och byggnämnd"
        self.assertEqual(municipalities_in(name, CODES), sorted(["0331", "2361"]))

    def test_bindestreck_ar_ordmellanrum(self):
        self.assertEqual(
            municipalities_in("Malå-Norsjö miljö-och byggnämnd", CODES),
            sorted(["2418", "2417"]),
        )

    def test_langsta_kommunnamnet_vinner(self):
        """Dals-Ed får inte bli Ed."""
        name = "Dalslands miljö-och energiförbund Dals-Ed"
        self.assertEqual(municipalities_in(name, CODES), ["1438"])

    def test_mellanslag_dar_kommunen_har_bindestreck(self):
        self.assertEqual(municipalities_in("Upplands Bro", CODES), ["0139"])


class TestMergeFragments(unittest.TestCase):
    def test_samma_myndighet_bruten_pa_tva_stallen(self):
        """Bilagorna bryter långa namn olika, och varje halva bär sina fält."""
        parts = [
            ControlAuthority(
                key="1447",
                name="Mariestad Töreboda Gullspång",
                municipalities=("1447", "1473", "1493"),
                facilities=403,
            ),
            ControlAuthority(
                key="1447",
                name="Miljö-och byggnadsnämnden Mariestad Töreboda Gullspång",
                municipalities=("1447", "1473", "1493"),
                fte=4.0,
            ),
        ]
        merged = merge_fragments(parts)
        self.assertEqual(len(merged), 1)
        self.assertEqual(merged[0].facilities, 403)
        self.assertEqual(merged[0].fte, 4.0)
        self.assertTrue(merged[0].name.startswith("Miljö-och byggnadsnämnden"))

    def test_avhugget_namn_tappade_en_kommun(self):
        """Simris-hamn i den ena halvan, Simrishamn i den andra."""
        parts = [
            ControlAuthority(
                key="1270",
                name="Ystad-Österlenregionens Miljöförbund Simris-hamn Tomelilla Ystad",
                municipalities=("1270", "1286"),
                facilities=785,
            ),
            ControlAuthority(
                key="1270",
                name="Ystad-Österlenregionens Miljöförbund Simrishamn Tomelilla Ystad",
                municipalities=("1270", "1286", "1291"),
            ),
        ]
        merged = merge_fragments(parts)
        self.assertEqual(len(merged), 1)
        self.assertEqual(merged[0].municipalities, ("1270", "1286", "1291"))
        self.assertEqual(merged[0].facilities, 785)

    def test_tva_riktiga_myndigheter_slas_inte_ihop(self):
        parts = [
            ControlAuthority(key="0180", name="Stockholm",
                             municipalities=("0180",), facilities=9456),
            ControlAuthority(key="0331", name="Berg", municipalities=("0331",),
                             facilities=120),
        ]
        self.assertEqual(len(merge_fragments(parts)), 2)


class TestBuild(unittest.TestCase):
    def test_livsmedelsverket_ar_inte_en_kommunal_myndighet(self):
        rows = [Authority(name="Livsmedelsverket", facilities=1760),
                Authority(name="Stockholm", facilities=9456)]
        built, _ = build(rows, CODES)
        self.assertEqual([a.name for a in built], ["Stockholm"])

    def test_kommun_utan_myndighet_lamnas_ut(self):
        """Klippan finns i ingen rad, och det ska synas i stället för att tystna."""
        built, unmatched = build([Authority(name="Stockholm", facilities=1)], CODES)
        self.assertIn(CODES["Berg"], unmatched)
        self.assertEqual(len(built), 1)


if __name__ == "__main__":
    unittest.main()
