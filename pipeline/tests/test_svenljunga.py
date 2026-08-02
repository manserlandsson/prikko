"""Tester för Svenljunga-adaptern.

Rapporttexterna är verkliga: de är utvunna ur kommunens egna PDF:er
2026-08-03 med `prikko.pdf`, och klippta där de slutar vara intressanta.
Styckningen mitt i ord ("R\\napport", "kontrol\\nl") är källans, inte vår.

Kör:  python3 pipeline/tests/test_svenljunga.py
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
    REASON_NO_INSPECTIONS,
    REASON_STALE,
    ROUTINE,
    Inspection,
    assess,
)
from prikko.sources.svenljunga import (  # noqa: E402
    Listing,
    ReportFile,
    UnknownSourceValue,
    assessment_of,
    control_date,
    local_id,
    normalize_establishment,
    normalize_inspections,
    parse_page,
    parse_report,
    readable_history,
    split_ort,
    squeeze,
)

TODAY = date(2026, 8, 3)

# Verklig text ur "Naturbruksskolan Svenljunga 2024-08-29.pdf". Notera
# kommunens egen felstavning "uppmärksammandes", som står i 37 rapporter.
CLEAN_REPORT = (
    "Meddelande\n1\n(\n3\n)\nNaturbruksskolan Svenljunga\n"
    "hakan.robertsson@vgregion.se\n30 augusti 2024\nDiarienummer:\nSBF\n-\n2024\n"
    "-\n760\nR\napport efter livsmedelskontroll\nDen\n29\naugusti 2024\n"
    "gjorde vi en\noanmäld\nlivsmedelskontroll\npå\nNaturbruksskolan\n"
    "Svenljunga\n.\nDet var en\nplanerad\nkontroll som\nvi\ngör regelbundet.\n"
    "Vi följde även upp\nde punkter som hade en avvikelse vid förra kontrollen.\n"
    "Inga avvikelser uppmärksammandes\nFöljande kontrollerades\n"
    "Godkännande och registrering av anläggningar och verksamheter"
)

# Verklig text ur "The Charline`s 2026-05-22.pdf". Kontrolldatumet saknar
# årtal, och kontrollbesöket var föranmält.
DEVIATION_REPORT = (
    "Meddelande\n1\n(\n4\n)\nC&S Suhr Sverige AB\nTorggatan 7\n515250\n"
    "SVENLJUNGA\n22 maj 2026\nDiarienummer:\nSBF\n-\n2026\n-\n569\nR\n"
    "apport efter livsmedelskontrol\nl\nDen 20 maj\ngjorde vi en\n"
    "livsmedelskontroll\npå\ner verksamhet\nThe Charline`s\n.\nDet\n"
    "var en planerad kontroll som vi gör regelbundet.\nKontrollen gjordes i\n"
    "form av ett\nföranmält kontrollbesök.\nResultat av kontrollen\n"
    "Vid kontrollen konstaterade vi en eller flera avvikelser från\n"
    "lagstiftningen. I de fall"
)

# Verklig text ur "Thai Sushi 2024-03-13.pdf". Äldre mall: datumet på
# ISO-form, och avvikelserna under en annan rubrik.
OLD_TEMPLATE = (
    "Meddelande\n1\n(\n4\n)\nThai Sushi AB\nTorggatan 3\n51250\nSVENLJUNGA\n"
    "27 mars 2024\nDiarienummer:\nSBF\n-\n2024\n-\n245\nR\n"
    "apport efter livsmedelskontroll\nDen\n2024\n-\n03\n-\n13\ngjorde vi en\n"
    "oanmäld\ninspektion\npå\nThai Sushi\n.\nDet var en\nplanerad\nkontroll\n"
    "som\nvi\ngör regelbundet.\nVi följde även upp de punkter som hade en\n"
    "avvikelse vid förra kontrollen.\nFöljande avvikelser uppmärksammades\n"
    "1.\nHygien före,\nunder och efter processen"
)

# Verklig text ur "Sexdrega Pizzeria 2026-04-20.pdf". Ordet "Den" saknas före
# datumet, och rapporten är den enda som säger att det var en extrakontroll.
FOLLOWUP_REPORT = (
    "Meddelande\n1\n(\n5\n)\nSexdrega nya Pizzeria AB\nSvenljungavägen 15\n"
    "512 77\nSexdrega\n20 april 2026\nDiarienummer:\nSBF\n-\n2026\n-\n471\nR\n"
    "apport efter livsmedelskontrol\nl\n16\napril 2026\ngjorde vi en\n"
    "livsmedelskontroll\npå\ner verksamhet\nSexdrega Pizzeria\n.\n"
    "Det var en planerad kontroll som vi gör regelbundet. Det var en\n"
    "extrakontroll för att följa upp om avvikelserna från förra kontrollen\n"
    "hade åtgärdats.\nResultat av kontrollen\n"
    "Vid kontrollen konstaterade vi en eller flera avvikelser från"
)

# Verklig standardtext som står i 77 av 176 läsbara rapporter, långt efter
# resultatet. Den innehåller BÅDE "oanmälda" och "föranmälda".
BOILERPLATE = (
    "\nSvenljunga kommun\nMeddelande\nMed regelbundna intervall ska\n"
    "oanmälda inspektioner samt föranmälda revisioner genomföras.\n"
    "Inga avvikelser kunde konstateras."
)

# Verklig markup ur listsidan: rubrik, fildelningsmodul, rubrik, modul.
PAGE = (
    '<h2 class="subheading2">Restauranger och pizzerior</h2>'
    '<h3 class="subheading3" id="h-CaesarRestaurangSvenljunga">Caesar Restaurang, '
    "Svenljunga</h3>"
    "<script>AppRegistry.registerInitialState('12.2f6b985b19bd97f4582cb4',"
    '{"files":[{"id":"18.4371a3de19cf9e0080e2262","name":"Caesar Restaurang '
    '2026-03-26.pdf","uri":"/download/18.4371a3de19cf9e0080e2262/1776142985408/x",'
    '"url":"https://www.svenljunga.se/download/18.4371a3de19cf9e0080e2262/'
    '1776142985408/Caesar%20Restaurang%202026-03-26.pdf","fileSize":"212 kB"}],'
    '"folderId":"19.337c7f78176e17b020528b"});</script>'
    '<h2 class="subheading2">Caféer och gatukök</h2>'
    '<h3 class="subheading3">Backa Loge Café, Kalv</h3>'
    "<script>AppRegistry.registerInitialState('12.2f6b985b19bd97f4582bb1',"
    '{"files":[{"id":"18.5630b12719783c7c83725ec","name":"Backa Loge Café '
    '2025-07-01.pdf","uri":"/a","url":"https://www.svenljunga.se/a.pdf"}]});</script>'
    "<script>AppRegistry.registerInitialState('12.2f6b985b19bd97f4582baf',"
    '{"files":[{"id":"18.5630b12719783c7c83725fc","name":"Backa Loge '
    'Dricksvattenanläggning 2025-07-01.pdf","uri":"/b",'
    '"url":"https://www.svenljunga.se/b.pdf"}]});</script>'
)


def file(name="Caesar Restaurang 2026-03-26.pdf", ident="18.a", url="https://x/a.pdf"):
    return ReportFile(id=ident, filename=name, url=url)


def listing(name="Caesar Restaurang", ort="Svenljunga", files=None):
    return Listing(
        name=name,
        ort=ort,
        category="Restauranger och pizzerior",
        files=files if files is not None else [file()],
    )


class Page(unittest.TestCase):
    def test_every_establishment_and_report_is_found(self):
        found = parse_page(PAGE)
        self.assertEqual([l.name for l in found], ["Caesar Restaurang", "Backa Loge Café"])
        self.assertEqual([l.category for l in found],
                         ["Restauranger och pizzerior", "Caféer och gatukök"])

    def test_the_ort_is_split_off_the_heading(self):
        self.assertEqual(split_ort("Caesar Restaurang, Svenljunga"),
                         ("Caesar Restaurang", "Svenljunga"))
        # 29 av 107 rubriker saknar ort.
        self.assertEqual(split_ort("IL Pastore Kök och Butik AB"),
                         ("IL Pastore Kök och Butik AB", None))

    def test_two_modules_under_one_heading_become_one_establishment(self):
        # Åtta verksamheter har en modul för verksamheten och en för dess
        # dricksvattenanläggning. Kommunen grupperar dem själv under ett namn.
        found = parse_page(PAGE)
        self.assertEqual(len(found), 2)
        self.assertEqual(
            [f.filename for f in found[1].files],
            ["Backa Loge Café 2025-07-01.pdf",
             "Backa Loge Dricksvattenanläggning 2025-07-01.pdf"],
        )

    def test_a_module_without_a_heading_stops_the_run(self):
        stray = PAGE.replace('<h3 class="subheading3" id="h-CaesarRestaurangSvenljunga">'
                             "Caesar Restaurang, Svenljunga</h3>", "")
        with self.assertRaises(UnknownSourceValue):
            parse_page(stray)

    def test_a_page_without_modules_stops_the_run(self):
        with self.assertRaises(UnknownSourceValue):
            parse_page("<h2>Restauranger</h2><p>Underhåll pågår</p>")


class Squeeze(unittest.TestCase):
    """PDF:en styckar texten mitt i ord. Fraser matchas utan blanksteg."""

    def test_a_word_split_by_the_pdf_is_matched_anyway(self):
        # Rapporttiteln kommer ut som "R\napport efter livsmedelskontroll".
        self.assertIn("Rapportefterlivsmedelskontroll", squeeze(CLEAN_REPORT))


class Result(unittest.TestCase):
    def test_no_deviations_is_read(self):
        self.assertEqual(assessment_of(squeeze(CLEAN_REPORT)), NO_REMARKS)

    def test_deviations_are_read(self):
        self.assertEqual(assessment_of(squeeze(DEVIATION_REPORT)), MINOR_REMARKS)

    def test_the_older_template_is_read(self):
        self.assertEqual(assessment_of(squeeze(OLD_TEMPLATE)), MINOR_REMARKS)

    def test_the_first_result_sentence_wins_over_the_boilerplate(self):
        # Standardtexten längre ned säger "Inga avvikelser kunde konstateras"
        # om något helt annat. Läses den som resultatet blir en rapport med
        # avvikelser plötsligt ren.
        self.assertEqual(
            assessment_of(squeeze(DEVIATION_REPORT + BOILERPLATE)), MINOR_REMARKS
        )

    def test_a_report_without_a_result_sentence_gives_nothing(self):
        self.assertIsNone(assessment_of(squeeze("Meddelande\nAvgift\nMed vänlig hälsning")))


class ControlDate(unittest.TestCase):
    def test_the_written_date_is_read(self):
        self.assertEqual(control_date(squeeze(CLEAN_REPORT), date(2024, 8, 29)),
                         date(2024, 8, 29))

    def test_the_iso_form_is_read(self):
        self.assertEqual(control_date(squeeze(OLD_TEMPLATE), date(2024, 3, 13)),
                         date(2024, 3, 13))

    def test_a_missing_year_is_taken_from_the_report_date(self):
        # "Den 20 maj" utan årtal. Rapportens eget datum är 2026-05-22.
        self.assertEqual(control_date(squeeze(DEVIATION_REPORT), date(2026, 5, 22)),
                         date(2026, 5, 20))

    def test_the_letterhead_date_is_never_mistaken_for_the_control_date(self):
        # Brevhuvudet står HÖGRE UPP på sidan än kontrollmeningen: rapporten
        # skrevs 22 maj, kontrollen gjordes 20 maj. Ett omankrat mönster hade
        # tagit den 22:a.
        self.assertEqual(control_date(squeeze(DEVIATION_REPORT), date(2026, 5, 22)).day,
                         20)

    def test_a_date_without_the_word_den_is_read(self):
        self.assertEqual(control_date(squeeze(FOLLOWUP_REPORT), date(2026, 4, 20)),
                         date(2026, 4, 16))

    def test_an_unreadable_date_gives_none_instead_of_the_report_date(self):
        # "Mellan november 2021 och oktober 2024 gjorde vi en
        # livsmedelskontroll" är en period, inte ett kontrolldatum.
        text = "Mellan november 2021 och oktober 2024 gjorde vi en livsmedelskontroll"
        self.assertIsNone(control_date(squeeze(text), date(2024, 10, 22)))


class ParseReport(unittest.TestCase):
    def test_a_clean_report_is_parsed_whole(self):
        report = parse_report(CLEAN_REPORT, file("Naturbruksskolan 2024-08-30.pdf"))
        self.assertEqual(report.assessment, NO_REMARKS)
        self.assertEqual(report.inspected_at, date(2024, 8, 29))
        self.assertEqual(report.type, ROUTINE)
        self.assertFalse(report.prenotified)
        self.assertFalse(report.audit)

    def test_a_prenotified_visit_is_read_from_the_next_sentence(self):
        # 74 rapporter säger inget om anmälan i inledningsmeningen utan i
        # nästa: "Kontrollen gjordes i form av ett föranmält kontrollbesök."
        report = parse_report(DEVIATION_REPORT, file("The Charlines 2026-05-22.pdf"))
        self.assertTrue(report.prenotified)

    def test_the_boilerplate_does_not_decide_whether_a_visit_was_prenotified(self):
        # Standardtexten nämner både oanmälda inspektioner och föranmälda
        # revisioner, i 77 av 176 rapporter.
        report = parse_report(CLEAN_REPORT + BOILERPLATE,
                              file("Naturbruksskolan 2024-08-30.pdf"))
        self.assertFalse(report.prenotified)

    def test_an_extra_control_is_a_follow_up(self):
        report = parse_report(FOLLOWUP_REPORT, file("Sexdrega Pizzeria 2026-04-20.pdf"))
        self.assertEqual(report.type, FOLLOWUP)

    def test_following_up_old_points_during_a_planned_control_is_not_a_follow_up(self):
        # 19 rapporter säger "Vi följde även upp de punkter som hade en
        # avvikelse vid förra kontrollen". Det är en planerad kontroll som
        # passade på, inte ett återbesök — och källan har historik, så
        # grading.py ser ändå att föregående kontroll hade avvikelser.
        report = parse_report(OLD_TEMPLATE, file("Thai Sushi 2024-03-13.pdf"))
        self.assertEqual(report.type, ROUTINE)

    def test_a_scanned_report_raises_instead_of_being_read_as_clean(self):
        # 45 av 224 rapporter är inskannade papper utan textlager. Tolkas de
        # som "inga avvikelser" publicerar vi ett godkännande ingen utfärdat.
        with self.assertRaises(UnknownSourceValue):
            parse_report("", file("Moi Marknad 2022-09-23.pdf"))

    def test_an_unknown_template_raises(self):
        with self.assertRaises(UnknownSourceValue):
            parse_report("Meddelande\nAvgift\nMed vänlig hälsning\n2016-08-26",
                         file("Mandys Inn 2016-08-24.pdf"))

    def test_a_report_without_a_control_date_raises(self):
        text = CLEAN_REPORT.replace("Den\n29\naugusti 2024\ngjorde vi en", "gjorde vi en")
        with self.assertRaises(UnknownSourceValue):
            parse_report(text, file("Utan datum.pdf"))


class Identity(unittest.TestCase):
    def test_identity_survives_a_new_report_being_published(self):
        # Filens nyckel i SiteVision hör till dokumentet och byts vid varje
        # uppladdning. Bär den identiteten skapar körningen en ny sida i
        # stället för att uppdatera den gamla.
        self.assertEqual(local_id("Caesar Restaurang", "Svenljunga"),
                         local_id(" caesar restaurang ", "svenljunga"))

    def test_the_same_name_in_two_orter_stays_apart(self):
        self.assertNotEqual(local_id("Café Solvik", "Kalv"),
                            local_id("Café Solvik", "Mjöbäck"))

    def test_a_nameless_heading_raises(self):
        with self.assertRaises(UnknownSourceValue):
            local_id("  ", "Svenljunga")


class Establishment(unittest.TestCase):
    def test_the_central_ort_is_not_repeated_after_the_name(self):
        self.assertIsNone(normalize_establishment(listing()).street_address)

    def test_other_orter_are_kept_because_they_add_information(self):
        e = normalize_establishment(listing(ort="Holsljunga"))
        self.assertEqual(e.street_address, "Holsljunga")

    def test_no_coordinates_are_invented(self):
        e = normalize_establishment(listing())
        self.assertIsNone(e.lat)
        self.assertIsNone(e.lng)


class History(unittest.TestCase):
    def parse(self, *pairs):
        return [parse_report(text, f) for text, f in pairs]

    def test_reports_become_a_history_newest_first(self):
        rows = self.parse(
            (CLEAN_REPORT, file("Naturbruksskolan 2024-08-30.pdf")),
            (DEVIATION_REPORT, file("Naturbruksskolan 2026-05-22.pdf")),
        )
        got = normalize_inspections(
            listing(files=[file(n) for n in ("Naturbruksskolan 2024-08-30.pdf",
                                             "Naturbruksskolan 2026-05-22.pdf")]),
            rows,
            "F-1465-t",
        )
        self.assertEqual([i.inspected_at for i in got],
                         [date(2026, 5, 20), date(2024, 8, 29)])

    def test_an_unreadable_newest_report_blocks_the_whole_verdict(self):
        # Åtta verksamheter har en oläsbar SENASTE rapport. Att då visa den
        # näst senaste vore att påstå ett nuläge kommunen redan har
        # kontrollerat om, utan att säga det.
        rows = self.parse((CLEAN_REPORT, file("Joarsbo Gård 2017-04-12.pdf")))
        files = [file("Joarsbo Gård 2017-04-12.pdf"),
                 file("Joarsbo Gård 2025-09-25.pdf", ident="18.b")]
        self.assertEqual(readable_history(listing(files=files), rows), [])

    def test_an_unreadable_older_report_only_shortens_the_history(self):
        rows = self.parse((DEVIATION_REPORT, file("X 2026-05-22.pdf")))
        files = [file("X 2026-05-22.pdf"), file("X 2020-01-02.pdf", ident="18.b")]
        self.assertEqual(len(readable_history(listing(files=files), rows)), 1)

    def test_two_reports_from_the_same_day_become_one_inspection(self):
        # Verksamheten och dess dricksvattenanläggning kontrolleras samma dag,
        # till exempel Backa Loge Café och Påarps gård 2025.
        rows = self.parse(
            (CLEAN_REPORT, file("Backa Loge Café 2024-08-30.pdf")),
            (CLEAN_REPORT.replace("Inga avvikelser uppmärksammandes",
                                  "Följande avvikelser uppmärksammades"),
             file("Backa Loge Dricksvatten 2024-08-30.pdf")),
        )
        got = normalize_inspections(
            listing(files=[file("Backa Loge Café 2024-08-30.pdf")]), rows, "F-1465-t"
        )
        self.assertEqual(len(got), 1)
        # Det sämre utfallet vinner, samma regel som i Linköping.
        self.assertEqual(got[0].assessment, MINOR_REMARKS)


class EndToEnd(unittest.TestCase):
    """Adaptern plus modellen, så att mappningen bedöms på sitt utfall."""

    def verdict(self, inspections):
        return assess(
            [
                Inspection(i.id_national, i.inspected_at, i.assessment, i.type)
                for i in inspections
            ],
            TODAY,
        )

    def build(self, *pairs):
        rows = [parse_report(text, f) for text, f in pairs]
        return normalize_inspections(
            listing(files=[f for _, f in pairs]), rows, "F-1465-t"
        )

    def test_a_clean_report_becomes_clean(self):
        got = self.build((DEVIATION_REPORT.replace(
            "Vid kontrollen konstaterade vi en eller flera avvikelser från\n"
            "lagstiftningen. I de fall",
            "Inga avvikelser konstaterades vid denna kontroll."),
            file("X 2026-05-22.pdf")))
        self.assertEqual(self.verdict(got).verdict, "clean")

    def test_a_single_deviation_report_stays_minor(self):
        got = self.build((DEVIATION_REPORT, file("X 2026-05-22.pdf")))
        self.assertEqual(self.verdict(got).verdict, "minor")

    def test_two_deviation_reports_in_a_row_become_major(self):
        # Svenljunga har inget ord för "kvarstår" — skalan är tvågradig. Att
        # källan ändå har historik är hela skälet till att den är värd att
        # läsa: 11 verksamheter når allvarlig nivå på mönstret.
        got = self.build(
            (OLD_TEMPLATE, file("X 2024-03-27.pdf")),
            (DEVIATION_REPORT, file("X 2026-05-22.pdf")),
        )
        self.assertEqual(self.verdict(got).verdict, "major")

    def test_an_establishment_without_readable_reports_gets_no_verdict(self):
        result = self.verdict([])
        self.assertIsNone(result.verdict)
        self.assertEqual(result.reason, REASON_NO_INSPECTIONS)
        self.assertFalse(result.publishable)

    def test_an_inspection_older_than_the_window_gives_no_verdict(self):
        got = self.build((OLD_TEMPLATE.replace("2024\n-\n03\n-\n13", "2018\n-\n03\n-\n13"),
                          file("X 2018-03-27.pdf")))
        result = self.verdict(got)
        self.assertIsNone(result.verdict)
        self.assertEqual(result.reason, REASON_STALE)


if __name__ == "__main__":
    unittest.main(verbosity=2)
