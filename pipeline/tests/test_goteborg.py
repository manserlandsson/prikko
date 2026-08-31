"""Tester för Göteborgs anläggningslista.

Raderna är verkliga, klippta ordagrant ur `Livsmedelsverksamheter.csv`
hämtad 2026-08-31, inklusive de trasiga postnumren.

Kör:  python3 pipeline/tests/test_goteborg.py
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.sources.goteborg import (  # noqa: E402
    UnknownSourceValue,
    check_coordinates,
    local_id,
    merge_rows,
    normalize_establishment,
    parse,
    postal_code,
    title_case,
)

HEADER = "namn;adress;postnummer;ort;typ;y_sweref991200;x_sweref991200;lat;lon"

CSV = "\n".join(
    [
        HEADER,
        "& Bageri;SKÅNEGATAN 20;40229;Göteborg;BAGERI;6397896.16600002;149193.536;"
        "57.70023267569368;11.986474673789111",
        "150G Burgers;LÅNGSTRÖMSGATAN 5C;41870;Göteborg;RESTAURANG;6400550.65800002;"
        "144149.18;57.72402968364344;11.901810622733096",
        # Samma verksamhet, två typer. Slås ihop.
        "150G Burgers;LÅNGSTRÖMSGATAN 5C;41870;Göteborg;KAFÉ;6400550.65800002;"
        "144149.18;57.72402968364344;11.901810622733096",
        # Utan koordinat och utan typ.
        "Ambulerande Korv;;;GÖTEBORG;;;;;",
        # Trasigt postnummer: gatuadressen har hamnat i kolumnen.
        "Brothers Group Food AB;BLOMSTERGATAN 11;lomstergatan 11,;GÖTEBORG;GROSSIST;"
        "6400348.00500002;149978.513;57.72224814981727;11.999639419595152",
    ]
)


class TestParse(unittest.TestCase):
    def test_laser_alla_rader(self):
        self.assertEqual(len(parse(CSV)), 5)

    def test_bytt_kolumn_faller(self):
        # En tyst omdöpt kolumn ger annars tomma fält på femtusen rader.
        trasig = CSV.replace("namn;adress", "benamning;adress")
        with self.assertRaises(UnknownSourceValue):
            parse(trasig)

    def test_tom_fil_faller(self):
        with self.assertRaises(UnknownSourceValue):
            parse(HEADER)


class TestKoordinater(unittest.TestCase):
    def test_sweref_och_wgs84_beskriver_samma_punkt(self):
        compared, worst = check_coordinates(parse(CSV))
        self.assertEqual(compared, 4)
        self.assertLess(worst, 1e-6)

    def test_bytt_projektion_faller(self):
        # Kolumnerna skulle då säga olika saker, och femtusen nålar får inte
        # flyttas på gissning.
        trasig = CSV.replace("149193.536", "649193.536")
        with self.assertRaises(UnknownSourceValue):
            check_coordinates(parse(trasig))

    def test_utan_koordinat_blir_none(self):
        groups = merge_rows(parse(CSV))
        korv = next(g for g in groups if g[1]["namn"] == "Ambulerande Korv")
        e = normalize_establishment(korv[0], korv[1], korv[2])
        self.assertIsNone(e.lat)
        self.assertIsNone(e.lng)


class TestSammanslagning(unittest.TestCase):
    def test_samma_namn_och_adress_blir_en_post_med_bada_typerna(self):
        groups = merge_rows(parse(CSV))
        self.assertEqual(len(groups), 4)
        burgers = next(g for g in groups if g[1]["namn"] == "150G Burgers")
        self.assertEqual(burgers[2], ["RESTAURANG", "KAFÉ"])

    def test_ordningen_ar_alfabetisk(self):
        # dedupe_slugs numrerar krockar positionellt: rör sig ordningen
        # vandrar URL:er vid nästa hämtning.
        self.assertEqual(
            [g[1]["namn"] for g in merge_rows(parse(CSV))],
            ["& Bageri", "150G Burgers", "Ambulerande Korv", "Brothers Group Food AB"],
        )

    def test_rad_utan_namn_kastar(self):
        with self.assertRaises(UnknownSourceValue):
            local_id("", "SKÅNEGATAN 20")


class TestPostnummer(unittest.TestCase):
    def test_bada_skrivsatten(self):
        self.assertEqual(postal_code("40229"), "40229")
        self.assertEqual(postal_code("402 29"), "40229")

    def test_annat_an_fem_siffror_blir_none(self):
        # Ett näraliggande postnummer vore en uppfunnen uppgift.
        for trasigt in ("lomstergatan 11,", "411105", "4363", "", "  "):
            with self.subTest(varde=trasigt):
                self.assertIsNone(postal_code(trasigt))


class TestVersaler(unittest.TestCase):
    def test_kallans_versaler_blir_normal_skrivning(self):
        self.assertEqual(title_case("SKÅNEGATAN 20"), "Skånegatan 20")
        self.assertEqual(title_case("HISINGS BACKA"), "Hisings Backa")
        self.assertEqual(title_case("VÄSTRA FRÖLUNDA"), "Västra Frölunda")

    def test_husnumrets_bokstav_forblir_versal(self):
        self.assertEqual(title_case("LÅNGSTRÖMSGATAN 5C"), "Långströmsgatan 5C")

    def test_blandad_skrivning_lamnas_i_fred(self):
        self.assertEqual(title_case("Hisings Backa"), "Hisings Backa")


class TestVerksamhet(unittest.TestCase):
    def setUp(self):
        groups = merge_rows(parse(CSV))
        self.bageri = normalize_establishment(*groups[0])

    def test_id_bar_kommunkoden(self):
        self.assertTrue(self.bageri.id_national.startswith("F-1480-"))

    def test_adress_och_ort_normaliseras(self):
        self.assertEqual(self.bageri.street_address, "Skånegatan 20")
        self.assertEqual(self.bageri.locality, "Göteborg")

    def test_typen_bars_vidare_ra(self):
        # Kategoritabellen i site/src/lib/categories.ts skrivs mot källans
        # egna strängar. En normalisering här hade gjort den omöjlig.
        self.assertEqual(self.bageri.types, ["BAGERI"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
