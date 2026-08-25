"""Tester för Uppsala-adaptern.

Fixturerna är verkliga fragment ur kommunens Livsmedelskollen 2026-08-25,
hämtade från `Details?id=477819949`, inte påhittade.

Kör:  python3 pipeline/tests/test_uppsala.py
"""

import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.grading import (  # noqa: E402
    FOLLOWUP,
    MINOR_REMARKS,
    NO_REMARKS,
    ROUTINE,
)
from prikko.sources.uppsala import (  # noqa: E402
    UnknownSourceValue,
    normalize_establishment,
    normalize_inspections,
    parse_list_page,
    total_hits,
)

# Verkligt kontrollblock. Uppföljning, oanmäld, med diarienummer.
FOLLOW_UP = """
<li class="inspection">
  <div class="item-header closed">
    <h2><a href="#">Kontrolldatum: <time datetime="2026-08-24">2026-08-24</time></a></h2>
  </div>
  <div class="item-content">
    <dl>
      <dt>Anledning till kontroll:</dt>
      <dd>Uppf&#246;ljning av tidigare avvikelse</dd>
      <dt>Typ av kontroll:</dt>
      <dd>Oanm&#228;ld</dd>
      <dt>Diarienummer:</dt>
      <dd>MHN-2026-5095</dd>
      <dt class="review">Omdöme:</dt>
      <dd>Avvikelse &#229;tg&#228;rdad</dd>
    </dl>
    <div class="exceptions"></div>
  </div>
</li>
"""

# Verkligt kontrollblock med en avvikelse och ett kontrollområde.
DEVIATION = """
<li class="inspection">
  <div class="item-header closed">
    <h2><a href="#">Kontrolldatum: <time datetime="2026-06-16">2026-06-16</time></a></h2>
  </div>
  <div class="item-content">
    <dl>
      <dt>Anledning till kontroll:</dt>
      <dd>Planerad kontroll</dd>
      <dt>Typ av kontroll:</dt>
      <dd>Oanm&#228;ld</dd>
      <dt>Diarienummer:</dt>
      <dd>MHN-2026-5095</dd>
      <dt class="review">Omdöme:</dt>
      <dd>Avvikelse</dd>
    </dl>
    <div class="exceptions">
      <p>Avvikelser:</p>
      <ul class="inner-acc">
        <li class="addPlus">
          <a href="#">Grundf&#246;ruts&#228;ttningar, hygien</a>
          <div class="exception-content">
            <ul><li>Utformning och underh&#229;ll av lokaler</li></ul>
          </div>
        </li>
      </ul>
    </div>
  </div>
</li>
"""

LIST_PAGE = """
<span class="count">1850</span>
<ul>
  <li class="inspection">
    <h3><a href="/livsmedelskollen/Details?id=477819949">Restaurang Ulva</a></h3>
    <p>Ulva Kvarnv&#228;g 1</p>
  </li>
</ul>
"""


class Listan(unittest.TestCase):
    def test_a_row_is_parsed(self):
        got = parse_list_page(LIST_PAGE)
        self.assertEqual(len(got), 1)
        self.assertEqual(got[0]["id"], "477819949")
        self.assertEqual(got[0]["name"], "Restaurang Ulva")
        self.assertEqual(got[0]["address"], "Ulva Kvarnväg 1")

    def test_total_is_read_from_the_municipality_itself(self):
        self.assertEqual(total_hits(LIST_PAGE), 1850)

    def test_establishment_id_is_namespaced(self):
        record = parse_list_page(LIST_PAGE)[0]
        e = normalize_establishment(record)
        self.assertEqual(e.id_national, "F-0380-477819949")
        self.assertEqual(e.municipality_code, "0380")

    def test_no_coordinates_are_invented(self):
        # Uppsala publicerar inga. Nålen härleds i pipeline/geocode.py och
        # märks då som härledd.
        e = normalize_establishment(parse_list_page(LIST_PAGE)[0])
        self.assertIsNone(e.lat)
        self.assertIsNone(e.lng)


class Kontroller(unittest.TestCase):
    def parse(self, markup):
        return normalize_inspections(markup, "F-0380-test", "477819949")

    def test_follow_up_is_read(self):
        got = self.parse(FOLLOW_UP)
        self.assertEqual(len(got), 1)
        self.assertEqual(got[0].inspected_at, date(2026, 8, 24))
        self.assertEqual(got[0].type, FOLLOWUP)
        # "Avvikelse åtgärdad" är en brist som ÄR ur världen.
        self.assertEqual(got[0].assessment, NO_REMARKS)

    def test_unannounced_visit_sets_prenotified_false(self):
        self.assertIs(self.parse(FOLLOW_UP)[0].prenotified, False)

    def test_deviation_is_read_with_its_area(self):
        got = self.parse(DEVIATION)
        self.assertEqual(got[0].assessment, MINOR_REMARKS)
        self.assertEqual(got[0].type, ROUTINE)
        self.assertEqual(len(got[0].areas), 1)
        self.assertEqual(got[0].areas[0].group, "Grundförutsättningar, hygien")
        self.assertEqual(got[0].areas[0].status, "deviation")

    def test_unknown_verdict_raises_instead_of_defaulting(self):
        broken = FOLLOW_UP.replace("Avvikelse &#229;tg&#228;rdad", "Ganska bra")
        with self.assertRaises(UnknownSourceValue):
            self.parse(broken)


class Diarienummer(unittest.TestCase):
    """Diarienumret låg i råsvaret och kastades fram till 2026-08-25.

    Uppsala publicerar det själva i kontrollens faktaruta. Kontrollrapporten
    i sin helhet finns inte publicerad någonstans, men den är en allmän
    handling, och numret är det som gör en begäran om utlämnande möjlig att
    besvara.
    """

    def parse(self, markup):
        return normalize_inspections(markup, "F-0380-test", "477819949")

    def test_case_number_is_carried(self):
        self.assertEqual(self.parse(FOLLOW_UP)[0].case_number, "MHN-2026-5095")

    def test_it_is_read_per_inspection_not_per_establishment(self):
        # Fältet står i varje kontrollblock, inte i sidhuvudet. Två
        # kontroller kan alltså bära två olika nummer, och tolkningen får
        # inte låta det första spilla över på det andra.
        both = self.parse(FOLLOW_UP + DEVIATION.replace("MHN-2026-5095", "MHN-2025-1"))
        self.assertEqual(
            [i.case_number for i in both], ["MHN-2026-5095", "MHN-2025-1"]
        )

    def test_missing_case_number_is_none_not_empty_string(self):
        without = FOLLOW_UP.replace(
            "<dt>Diarienummer:</dt>\n      <dd>MHN-2026-5095</dd>", ""
        )
        self.assertIsNone(self.parse(without)[0].case_number)

    def test_a_missing_case_number_never_blocks_the_inspection(self):
        # Diarienumret är en bonus. En kontroll utan det ska publiceras som
        # vanligt, bara utan raden.
        without = FOLLOW_UP.replace(
            "<dt>Diarienummer:</dt>\n      <dd>MHN-2026-5095</dd>", ""
        )
        self.assertEqual(len(self.parse(without)), 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
