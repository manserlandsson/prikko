"""Tester för Höganäs-adaptern.

Filnamnen är verkliga, hämtade ur kommunens filarkiv 2026-08-03, och
markupfixturerna är klippta ur samma sidor utan att städas.
Kör:  python3 pipeline/tests/test_hoganas.py
"""

import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.grading import (  # noqa: E402
    MAJOR_REMARKS,
    MINOR_REMARKS,
    NO_REMARKS,
    REASON_STALE,
    ROUTINE,
    Inspection,
    assess,
)
from prikko.sources.hoganas import (  # noqa: E402
    COLOUR_ASSESSMENT,
    UnknownSourceValue,
    check_legend,
    group_reports,
    local_id,
    normalize_establishment,
    normalize_inspections,
    parse_listing,
    parse_report,
)

TODAY = date(2026, 8, 3)

# Läsanvisningen, ordagrant från filarkivets sidor.
LEGEND = (
    '<div class="sv-text-portlet-content">'
    '<ul class=" sol-bullet-list font-normal">'
    "<li><strong>Grön</strong> betyder Godkänd inspektion</li>"
    "<li><strong>Gul</strong> betyder Inspektion med avvikelse</li>"
    "<li><strong>Röd</strong> betyder Inspektion som kräver återbesök</li>"
    "</ul></div>"
)

# Verklig markup ur mappen "Butiker, restauranger, serveringar och övrigt":
# först mapplänken "Föregående", sedan två rapporter.
LISTING = (
    '<div class="sv-file-portlet"><ul><li>'
    '<div class="sv-file-portlet-file"><a href="/boende-trafik--miljo/boendemiljo'
    "/livsmedel/livsmedelskontroller.html?folder=19.33c1739617a7615ad6625de3&amp;"
    'sv.url=12.33c1739617a7615ad6625ea9" class="font-normal">Föregående</a></div>'
    "</li><li>"
    '<div class="sv-file-portlet-file"><a href="/download/18.225efd491900fd860717a94'
    "/1719303098421/2020%20Baguetteria,%20M%C3%B6lle,%202024-06-19,%20gr%C3%B6n.pdf"
    '" class="font-normal" rel="external">2020 Baguetteria, Mölle, 2024-06-19, '
    'grön.pdf<svg class="env-link-icon" aria-hidden="true"><use href="/sitevision'
    '/link-icons.svg#link-tab"></use></svg><span class="env-assistive-text"> Pdf, '
    "249.1 kB, öppnas i nytt fönster.</span></a></div>"
    "</li><li>"
    '<div class="sv-file-portlet-file"><a href="/download/18.acb99cb19d24f21c66e4f7'
    "/1775571815978/Adams%20k%C3%B6k%20&amp;%20bar,%20H%C3%B6gan%C3%A4s,%20"
    '2026-03-30,%20gul.pdf" class="font-normal" rel="external">Adams kök &amp; bar, '
    'Höganäs, 2026-03-30, gul.pdf<svg class="env-link-icon"></svg></a></div>'
    "</li></ul></div>"
)


def report(filename, url="https://www.hoganas.se/download/x.pdf"):
    return parse_report(url, filename)


class Legend(unittest.TestCase):
    """Färgen ÄR omdömet i Höganäs. Ändras dess betydelse ska allt stoppa."""

    def test_the_published_legend_passes(self):
        check_legend(LEGEND)

    def test_a_rewritten_scale_stops_the_run(self):
        broken = LEGEND.replace("Godkänd inspektion", "Inspektion utan anmärkning")
        with self.assertRaises(UnknownSourceValue):
            check_legend(broken)

    def test_a_page_without_the_legend_stops_the_run(self):
        with self.assertRaises(UnknownSourceValue):
            check_legend("<main><p>Underhåll pågår</p></main>")


class Listing(unittest.TestCase):
    def test_only_the_pdf_links_are_read(self):
        # Mapplänken "Föregående" saknar rel="external" och ska inte följa med.
        found = parse_listing(LISTING)
        self.assertEqual(len(found), 2)

    def test_the_link_is_absolute_and_the_filename_decoded(self):
        url, filename = parse_listing(LISTING)[1]
        self.assertTrue(url.startswith("https://www.hoganas.se/download/"))
        self.assertEqual(filename, "Adams kök & bar, Höganäs, 2026-03-30, gul.pdf")


class ParseReport(unittest.TestCase):
    def test_the_ordinary_form_is_read(self):
        r = report("Adams kök & bar, Höganäs, 2026-03-30, gul.pdf")
        self.assertEqual(r.name, "Adams kök & bar")
        self.assertEqual(r.ort, "Höganäs")
        self.assertEqual(r.inspected_at, date(2026, 3, 30))
        self.assertEqual(r.colour, "gul")

    def test_the_colour_is_matched_on_word_boundary(self):
        # Utan ordgräns matchar "röd" inne i Heljarödsgården och
        # Långarödsvägen, och två av 333 filer hade fått fel omdöme.
        self.assertEqual(report("Heljarödsgården, Farhult, 2024-09-03, grön.pdf").colour,
                         "grön")
        self.assertEqual(
            report("LSS Långarödsvägen 42, Höganäs, 2025-09-04, grön.pdf").colour,
            "grön",
        )

    def test_the_field_order_is_not_trusted(self):
        # Färgen står före datumet i ett filnamn.
        r = report("Apoteket Midgårdsgatan, Höganäs, grön, 2022-11-10.pdf")
        self.assertEqual(r.name, "Apoteket Midgårdsgatan")
        self.assertEqual(r.ort, "Höganäs")
        self.assertEqual(r.inspected_at, date(2022, 11, 10))

    def test_a_missing_comma_between_ort_and_date_is_tolerated(self):
        r = report("Höganäs Bowling, Höganäs 2023-05-12, grön.pdf")
        self.assertEqual(r.name, "Höganäs Bowling")
        self.assertEqual(r.ort, "Höganäs")

    def test_a_missing_comma_between_date_and_colour_is_tolerated(self):
        r = report("Nordic Wellness, Höganäs, 2024-11-18 grön.pdf")
        self.assertEqual(r.name, "Nordic Wellness")
        self.assertEqual(r.colour, "grön")

    def test_a_dot_in_the_date_is_read_because_the_year_comes_first(self):
        # "2025-11.10" har alla siffror på plats i ISO-ordning. Det är en
        # felskrivning med bara en möjlig tolkning, inte en gissning.
        r = report("Sockenstugan i Jonstorp, Jonstorp, 2025-11.10, grön.pdf")
        self.assertEqual(r.inspected_at, date(2025, 11, 10))

    def test_a_missing_ort_gives_none_not_a_guess(self):
        r = report("Poe´s Höganäs, 2026-06-03, grön.pdf")
        self.assertEqual(r.name, "Poe´s Höganäs")
        self.assertIsNone(r.ort)

    def test_a_middle_field_belongs_to_the_name_because_it_names_the_object(self):
        # "mobil" och "dricksvatten" säger VILKET kontrollobjekt det gäller
        # och får inte kastas.
        self.assertEqual(report("City Food, mobil, Höganäs, 2025-06-09, gul.pdf").name,
                         "City Food, mobil")
        r = report("Bananpannkakan, dricksvatten, Viken 2023-08-17, gul.pdf")
        self.assertEqual((r.name, r.ort), ("Bananpannkakan, dricksvatten", "Viken"))

    def test_a_comma_inside_parentheses_does_not_split_the_name(self):
        r = report("Nyhamnsskolan (hemkunskap, fritids), Nyhamnsläge, 2024-11-26, gul.pdf")
        self.assertEqual(r.name, "Nyhamnsskolan (hemkunskap, fritids)")
        self.assertEqual(r.ort, "Nyhamnsläge")

    def test_the_case_number_is_not_shown_as_an_ort(self):
        r = report("Väsbyhemmet, MIL-2026-196, 2026-02-18, grön.pdf")
        self.assertEqual(r.name, "Väsbyhemmet")
        self.assertIsNone(r.ort)

    def test_a_misspelt_ort_is_corrected_to_the_spelling_the_source_uses(self):
        r = report("Jonstorpsskolans kök, Högnäs, 2026-03-25, grön.pdf")
        self.assertEqual(r.ort, "Höganäs")

    def test_an_unreadable_date_raises_instead_of_being_guessed(self):
        # "14 nov 20204" kan vara 2024 eller 2020. Att välja vore att hitta på
        # ett kontrolldatum, och datumet avgör om omdömet får publiceras.
        with self.assertRaises(UnknownSourceValue):
            report("cReal Food, Höganäs, 14 nov 20204, grön.pdf")

    def test_an_impossible_date_raises(self):
        with self.assertRaises(UnknownSourceValue):
            report("Cake & Bake, Höganäs, 2024-00-05, grön.pdf")

    def test_a_filename_without_a_colour_raises(self):
        with self.assertRaises(UnknownSourceValue):
            report("Bara Ett Namn, Höganäs, 2024-05-05.pdf")


class Identity(unittest.TestCase):
    def test_the_ort_is_never_part_of_the_identity(self):
        # "Jonstorpsskolans kök" har tre rapporter med tre olika orter. Med
        # orten i nyckeln blev en skolmatsal tre verksamheter med tre olika
        # omdömen, två av dem publicerade under samma namn.
        one = report("Jonstorpsskolans kök, Höganäs, 2026-03-24, gul.pdf")
        two = report("Jonstorpsskolans kök, Jonstorp, 2026-03-24, gul.pdf")
        three = report("Jonstorpsskolans kök, Högnäs, 2026-03-25, grön.pdf")
        self.assertEqual({local_id(one), local_id(two), local_id(three)},
                         {local_id(one)})

    def test_identity_survives_a_new_report_being_uploaded(self):
        # Filens egen nyckel i SiteVision hör till dokumentet och byts vid
        # varje uppladdning. Bär den identiteten skapar körningen en ny sida
        # i stället för att uppdatera den gamla.
        old = report("Sugoi, Höganäs, 2026-02-26, gul.pdf", "https://x/download/18.aaa")
        new = report("Sugoi, Höganäs, 2026-04-10, grön.pdf", "https://x/download/18.bbb")
        self.assertEqual(local_id(old), local_id(new))

    def test_identity_does_not_depend_on_the_folder(self):
        # "Cake & Bake" och "Kullabygdens Fruktträdgårdar" byter mapp mellan
        # sina rapporter.
        r = report("Kullabygdens Fruktträdgårdar, Viken, 2025-10-21, gul.pdf")
        one = normalize_establishment(r, ["Butik, restaurang och servering"])
        two = normalize_establishment(r, ["Tillverkare eller grossist"])
        self.assertEqual(one.id_national, two.id_national)


class Establishment(unittest.TestCase):
    def test_the_central_ort_is_not_repeated_after_the_name(self):
        # Sidan skriver ut kommunens namn efter adressen, så ett "Höganäs"
        # här hade gett "Höganäs, Höganäs kommun".
        e = normalize_establishment(
            report("Adams kök & bar, Höganäs, 2026-03-30, gul.pdf"), ["Butik"]
        )
        self.assertIsNone(e.street_address)

    def test_other_orter_are_kept_because_they_add_information(self):
        # 153 av 310 verksamheter ligger utanför centralorten.
        e = normalize_establishment(
            report("2020 Baguetteria, Mölle, 2024-06-19, grön.pdf"), ["Butik"]
        )
        self.assertEqual(e.street_address, "Mölle")

    def test_no_coordinates_are_invented(self):
        e = normalize_establishment(
            report("2020 Baguetteria, Mölle, 2024-06-19, grön.pdf"), ["Butik"]
        )
        self.assertIsNone(e.lat)
        self.assertIsNone(e.lng)


class Grouping(unittest.TestCase):
    def test_several_reports_become_a_history_not_several_establishments(self):
        reports = [
            report("Sugoi, Höganäs, 2026-02-26, gul.pdf"),
            report("Sugoi, Höganäs, 2026-04-10, grön.pdf"),
        ]
        grouped = group_reports([(r, "Butik") for r in reports])
        self.assertEqual(len(grouped), 1)
        rows, categories = grouped[0]
        # Nyast först, så att den senaste kontrollen bär omdömet.
        self.assertEqual([r.inspected_at for r in rows],
                         [date(2026, 4, 10), date(2026, 2, 26)])
        self.assertEqual(categories, ["Butik"])

    def test_two_reports_from_the_same_day_are_one_inspection(self):
        # "Jonstorpsskolans kök" ligger med 2026-03-24 två gånger, en gång med
        # orten "Höganäs" och en gång med "Jonstorp".
        rows = [
            report("Jonstorpsskolans kök, Höganäs, 2026-03-24, gul.pdf"),
            report("Jonstorpsskolans kök, Jonstorp, 2026-03-24, gul.pdf"),
        ]
        got = normalize_inspections(rows, "F-1284-t")
        self.assertEqual(len(got), 1)

    def test_the_worse_of_two_same_day_reports_wins(self):
        rows = [
            report("Testet, Höganäs, 2026-03-24, grön.pdf"),
            report("Testet, Höganäs, 2026-03-24, gul.pdf"),
        ]
        self.assertEqual(normalize_inspections(rows, "F-1284-t")[0].assessment,
                         MINOR_REMARKS)


class Inspections(unittest.TestCase):
    def test_green_means_approved(self):
        got = normalize_inspections(
            [report("2020 Baguetteria, Mölle, 2024-06-19, grön.pdf")], "F-1284-t"
        )
        self.assertEqual(got[0].assessment, NO_REMARKS)
        self.assertEqual(got[0].type, ROUTINE)
        self.assertEqual(got[0].inspected_at, date(2024, 6, 19))

    def test_yellow_is_a_minor_remark(self):
        got = normalize_inspections(
            [report("Adams kök & bar, Höganäs, 2026-03-30, gul.pdf")], "F-1284-t"
        )
        self.assertEqual(got[0].assessment, MINOR_REMARKS)

    def test_red_is_the_top_of_the_municipalitys_own_scale(self):
        # Förekommer inte i beståndet (0 av 333). Mappningen vilar på att röd
        # är tredje steget i en tregradig skala vars andra steg redan täcker
        # varje noterad avvikelse, och på att gul ligger på 13 procent medan
        # röd ligger på noll.
        self.assertEqual(COLOUR_ASSESSMENT["röd"], MAJOR_REMARKS)

    def test_the_report_link_is_carried_through(self):
        got = normalize_inspections(
            [report("Sugoi, Höganäs, 2026-04-10, grön.pdf", "https://x/download/18.a")],
            "F-1284-t",
        )
        self.assertEqual(got[0].report_url, "https://x/download/18.a")

    def test_areas_are_empty_because_they_only_exist_inside_the_pdf(self):
        got = normalize_inspections(
            [report("Sugoi, Höganäs, 2026-04-10, grön.pdf")], "F-1284-t"
        )
        self.assertEqual(got[0].areas, [])

    def test_prenotified_is_unknown_not_false(self):
        # Sidan säger att "nästan alla" inspektioner är oanmälda. Det är en
        # beskrivning av arbetssättet, inte en uppgift om den enskilda
        # kontrollen.
        got = normalize_inspections(
            [report("Sugoi, Höganäs, 2026-04-10, grön.pdf")], "F-1284-t"
        )
        self.assertIsNone(got[0].prenotified)


class EndToEnd(unittest.TestCase):
    """Adaptern plus modellen, så att mappningen bedöms på sitt utfall."""

    def verdict(self, filenames):
        rows = [report(f) for f in filenames]
        inspections = normalize_inspections(rows, "F-1284-t")
        return assess(
            [
                Inspection(i.id_national, i.inspected_at, i.assessment, i.type)
                for i in inspections
            ],
            TODAY,
        )

    def test_a_green_report_becomes_clean(self):
        self.assertEqual(
            self.verdict(["Sugoi, Höganäs, 2026-04-10, grön.pdf"]).verdict, "clean"
        )

    def test_a_yellow_followed_by_a_green_becomes_clean(self):
        # 15 av 19 verksamheter med historik ser ut så här: avvikelsen
        # åtgärdades och återbesöket blev grönt. Nuläget avgör bedömningen.
        self.assertEqual(
            self.verdict(
                [
                    "Sugoi, Höganäs, 2026-02-26, gul.pdf",
                    "Sugoi, Höganäs, 2026-04-10, grön.pdf",
                ]
            ).verdict,
            "clean",
        )

    def test_three_yellows_in_a_row_become_major_without_any_label_saying_so(self):
        # "Rewi AB" är hela poängen med att härleda allvarsgraden ur mönstret
        # i stället för ur etiketten: Höganäs har inget ord för "kvarstår",
        # men tre gula i rad ÄR en brist som överlevt två besök.
        result = self.verdict(
            [
                "Rewi AB, Höganäs, 2025-12-12, gul.pdf",
                "Rewi AB, Höganäs, 2026-01-21, gul.pdf",
                "Rewi AB, Höganäs, 2026-02-27, gul.pdf",
            ]
        )
        self.assertEqual(result.verdict, "major")

    def test_a_single_yellow_stays_minor(self):
        self.assertEqual(
            self.verdict(["Adams kök & bar, Höganäs, 2026-03-30, gul.pdf"]).verdict,
            "minor",
        )

    def test_an_inspection_older_than_the_window_gives_no_verdict(self):
        # 20 av 310 verksamheter har bara rapporter före 2023-08-04. De ska
        # bli obedömda, inte gröna: äldst i beståndet är 2021-06-09.
        result = self.verdict(["Testet, Höganäs, 2021-06-09, grön.pdf"])
        self.assertIsNone(result.verdict)
        self.assertEqual(result.reason, REASON_STALE)

    def test_the_distinction_needs_three_clean_reports(self):
        # Källan publicerar sällan tre rapporter, så utmärkelsen är i
        # praktiken utom räckhåll även här — men regeln är densamma.
        one = self.verdict(["Testet, Höganäs, 2026-04-10, grön.pdf"])
        self.assertFalse(one.distinction)
        three = self.verdict(
            [
                "Testet, Höganäs, 2024-04-10, grön.pdf",
                "Testet, Höganäs, 2025-04-10, grön.pdf",
                "Testet, Höganäs, 2026-04-10, grön.pdf",
            ]
        )
        self.assertTrue(three.distinction)


if __name__ == "__main__":
    unittest.main(verbosity=2)
