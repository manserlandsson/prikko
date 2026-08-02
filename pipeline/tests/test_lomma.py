"""Tester för Lomma-adaptern.

Fixturerna är verklig markup från lomma.se 2026-08-02, klippt ur de fyra
sidorna utan att städas.  Kör:  python3 pipeline/tests/test_lomma.py
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
    REASON_NO_INSPECTIONS,
    REASON_STALE,
    ROUTINE,
    Inspection,
    assess,
)
from prikko.sources.lomma import (  # noqa: E402
    COLOUR_ASSESSMENT,
    Listing,
    UnknownSourceValue,
    check_legend,
    local_id,
    merge_listings,
    normalize_establishment,
    normalize_inspections,
    parse_deviations,
    parse_page,
)

TODAY = date(2026, 8, 2)

# Läsanvisningen, ordagrant från sidan "Övriga verksamheter". Notera att
# fetstilen delar ordet "inga" mitt itu — det är kommunens egen markup.
LEGEND = (
    '<div class="sv-text-portlet-content">'
    '<h2 class="subheading" id="h-Symbolernasbetydelse">Symbolernas betydelse</h2>'
    '<p class="normal"><strong>Grön prick: i</strong>nga eller ett fåtal avvikelser '
    "som inte leder till en extra kontroll</p>"
    '<p class="normal"><strong>Gul prick:</strong> en eller ett fåtal avvikelser '
    "som leder till en extra kontroll</p>"
    '<p class="normal"><strong>Röd prick:</strong> en eller flera allvarliga '
    "avvikelser som kräver myndighetsåtgärder, till exempel föreläggande eller "
    "förbud</p>"
)

# Verklig markup ur restaurangerochcafeer.1220.html. Innehåller de tre
# formerna posterna faktiskt förekommer i: ett <strong> som börjar med en
# radbrytning, ett som sväljer radbrytningarna efter namnet, och ett stycke
# som bär både slutet på en post och början på nästa.
GREEN_SECTION = (
    '<h2 class="subheading" id="h-Gronprickvidsenasteinspektion">Grön prick vid '
    "senaste inspektion</h2>"
    '<p class="normal"><strong><br>Alnarp 9</strong></p>'
    '<p class="normal">Senaste inspektion: 2026-02-18</p>'
    '<p class="normal">Avvikelser: svårstädad lokal, livsmedelsinformation, '
    "tempratur<br><br><strong>Alnarps agroecology farm</strong></p>"
    '<p class="normal">Senaste inspektion: 2026-05-21</p>'
    '<p class="normal">Avvikelser: Inga avvikelser<br></p>'
    '<p class="normal"><strong>Centralens café<br><br></strong>Senaste inspektion: '
    "2023-09-21</p>"
    '<p class="normal">Avvikelser: inga avvikelser<br><br><strong>Cocos Hut</strong></p>'
    '<p class="normal">Senaste inspektion: 2025-02-20</p>'
    '<p class="normal">Avvikelser: rengöring, personlig hygien</p>'
)

# Verklig markup ur samma sida. Första posten bär kommunens hopskrivna
# avvikelsetext.
YELLOW_SECTION = (
    '<h2 class="subheading" id="h-Gulprickvidsenasteinspektion">Gul prick vid '
    "senaste inspektion</h2>"
    '<p class="normal"><strong>Bjärreds krog </strong></p>'
    '<p class="normal">Senaste inspektion: 2025-12-09</p>'
    '<p class="normal">Avvikelser: inga avvikelserseparering avfall, svårstädad '
    "lokal, förvaring</p>"
    '<p class="normal"><strong>Nyströms på Örestads Golfklubb</strong></p>'
    '<p class="normal">Senaste inspektion: 2025-10-28</p>'
    '<p class="normal">Avvikelser: Rengöring och svårstädad lokal</p>'
)

# Verklig markup ur ovrigaverksamheter.1222.html.
RED_SECTION = (
    '<h2 class="subheading" id="h-Rodprickvidsenasteinspektion">Röd prick vid '
    "senaste inspektion</h2>"
    '<p class="normal"><strong>Oriental Fresh</strong></p>'
    '<p class="normal">Senaste inspektion: 2025-09-03</p>'
    '<p class="normal">Avvikelser: märkning</p>'
)

# Verklig markup ur ovrigaverksamheter.1222.html: två poster i rad som står
# under en färgrubrik men saknar både datum och avvikelsetext.
UNDATED_SECTION = (
    '<h2 class="subheading" id="h-Gronprickvidsenasteinspektion">Grön prick vid '
    "senaste inspektion</h2>"
    '<p class="normal"><br><strong>Kraftkällan</strong></p>'
    '<p class="normal">Senaste inspektion:</p>'
    '<p class="normal">Avvikelser: <br><br><strong>KRAN Vinhandel</strong></p>'
    '<p class="normal">Senaste inspektion:</p>'
    '<p class="normal">Avvikelser: <br><br><strong>Kronans apotek (Bjärred)</strong></p>'
    '<p class="normal">Senaste inspektion: 2025-12-10</p>'
    '<p class="normal">Avvikelser: inga</p>'
)

# Verklig markup ur butiker.1219.html: dagen är inte utskriven.
BROKEN_DATE_SECTION = (
    '<h2 class="subheading" id="h-Gronprickvidsenasteinspektion">Grön prick vid '
    "senaste inspektion</h2>"
    '<p class="normal"><strong>Italianissimo</strong></p>'
    '<p class="normal">Senaste inspektion: 2025-11-?</p>'
    '<p class="normal">Avvikelser: personlig hygien, temperatur<br><br>'
    "<strong>Italianissimo (webbutik)</strong></p>"
    '<p class="normal">Senaste inspektion: 2021-04-08</p>'
    '<p class="normal">Avvikelser: personlig hygie, livsmedelsinformation</p>'
)

FOOTER = '<h2 class="subheading">Sidans innehåll</h2><p>Senaste inspektion: 1999-01-01</p>'


def page(*sections):
    return "<main>" + LEGEND + "".join(sections) + FOOTER + "</main>"


def listing(name="Bayside", colour="grön", when="2026-06-01", deviations="rengöring"):
    return Listing(name=name, colour=colour, inspected_at=when, deviations=deviations)


class Legend(unittest.TestCase):
    """Färgen ÄR omdömet i Lomma. Ändras dess betydelse ska allt stoppa."""

    def test_the_published_legend_passes(self):
        check_legend(page(GREEN_SECTION))

    def test_bolding_in_the_middle_of_a_phrase_does_not_break_it(self):
        # Kommunen delar ord mitt itu med fetstil, som i
        # "<strong>Grön prick: i</strong>nga". Taggen ska tas bort utan att
        # ett mellanslag skjuts in, annars läses meningen som "i nga" och
        # läsanvisningen skulle se ändrad ut varje gång någon fetar en rubrik.
        split = page(GREEN_SECTION).replace(
            "leder till en extra kontroll", "leder till en <em>extra</em> kontroll"
        )
        check_legend(split)

    def test_a_rewritten_scale_stops_the_run(self):
        broken = page(GREEN_SECTION).replace("allvarliga avvikelser", "grova brister")
        with self.assertRaises(UnknownSourceValue):
            check_legend(broken)

    def test_a_page_without_the_legend_stops_the_run(self):
        with self.assertRaises(UnknownSourceValue):
            check_legend("<main><p>Underhåll pågår</p></main>")


class ParsePage(unittest.TestCase):
    def test_all_three_colours_are_read(self):
        found = parse_page(page(GREEN_SECTION, YELLOW_SECTION, RED_SECTION))
        self.assertEqual([l.colour for l in found],
                         ["grön"] * 4 + ["gul"] * 2 + ["röd"])

    def test_names_survive_the_hand_written_markup(self):
        found = parse_page(page(GREEN_SECTION))
        self.assertEqual(
            [l.name for l in found],
            ["Alnarp 9", "Alnarps agroecology farm", "Centralens café", "Cocos Hut"],
        )

    def test_a_paragraph_carrying_two_posts_is_split(self):
        # "Avvikelser: … <br><br><strong>Cocos Hut</strong>" bär slutet på en
        # post och början på nästa i samma stycke.
        found = parse_page(page(GREEN_SECTION))
        self.assertEqual(found[0].deviations,
                         "svårstädad lokal, livsmedelsinformation, tempratur")
        self.assertEqual(found[3].name, "Cocos Hut")

    def test_the_footer_is_outside_the_content(self):
        # Sidans högerspalt innehåller texten "Senaste inspektion" i annan
        # form. Läses den med blir beståndet fel utan att någon märker det.
        self.assertEqual(len(parse_page(page(RED_SECTION))), 1)

    def test_a_post_outside_a_colour_heading_stops_the_run(self):
        # Tappas färgrubriken finns inget omdöme att hämta, och en tyst
        # bortfallen post är precis vad kontrollräkningen ska fånga.
        stray = page(GREEN_SECTION).replace(
            "Grön prick vid senaste inspektion", "Senast kontrollerade"
        )
        with self.assertRaises(UnknownSourceValue):
            parse_page(stray)


class Identity(unittest.TestCase):
    def test_identity_comes_from_the_name_because_nothing_else_is_published(self):
        self.assertEqual(local_id("Bayside"), local_id(" bayside "))

    def test_identity_does_not_depend_on_which_page_the_post_stands_on(self):
        # Flyttar kommunen en verksamhet mellan sidorna ska URL och historik
        # följa med, inte ersättas av en ny verksamhet.
        one = normalize_establishment(listing(), ["Butik"])
        two = normalize_establishment(listing(), ["Övrigt"])
        self.assertEqual(one.id_national, two.id_national)

    def test_a_nameless_post_raises(self):
        with self.assertRaises(UnknownSourceValue):
            local_id("   ")

    def test_no_address_is_published_so_the_field_stays_empty(self):
        # Kommunen publicerar bara namn. Ett ifyllt "Lomma" hade sett ut som
        # en uppgift vi har, och geocode.py hade inte kunnat göra något med
        # den ändå.
        e = normalize_establishment(listing(), ["Butik"])
        self.assertIsNone(e.street_address)
        self.assertIsNone(e.lat)
        self.assertIsNone(e.lng)


class MergeListings(unittest.TestCase):
    """Tre namn står på två sidor var. De ska bli en verksamhet, inte två."""

    def test_the_same_name_on_two_pages_becomes_one_record(self):
        # "Bergagården" står med identiska rader under både restauranger och
        # skolor.
        row = listing(name="Bergagården", when="2023-10-24",
                      deviations="temperatur, kontaktmaterial")
        merged = merge_listings([(row, "Restaurang och café"), (row, "Skola och omsorg")])
        self.assertEqual(len(merged), 1)
        self.assertEqual(merged[0][1], ["Restaurang och café", "Skola och omsorg"])

    def test_the_most_recent_post_decides_and_no_history_is_invented(self):
        # "Borgeby Fågel & Vilt" står som butik 2026-05-22 och som övrig
        # verksamhet 2025-02-19. Källan publicerar bara "senaste inspektion"
        # per post, så de två raderna är inte en historik — och en påhittad
        # historik hade kunnat få grading.py att skärpa ett omdöme.
        newer = listing(name="Borgeby Fågel & Vilt", when="2026-05-22",
                        deviations="Märkning")
        older = listing(name="Borgeby Fågel & Vilt", when="2025-02-19",
                        deviations="inga avvikelser")
        merged = merge_listings([(newer, "Butik"), (older, "Övrigt")])
        self.assertEqual(len(merged), 1)
        self.assertEqual(merged[0][0].inspected_at, "2026-05-22")
        self.assertEqual(len(normalize_inspections(merged[0][0], "F-1262-t")), 1)

    def test_an_undated_post_never_beats_a_dated_one(self):
        dated = listing(name="Samma", when="2024-01-02", deviations="rengöring")
        undated = listing(name="Samma", when="", deviations="")
        for order in ((dated, undated), (undated, dated)):
            merged = merge_listings([(order[0], "Butik"), (order[1], "Övrigt")])
            self.assertEqual(merged[0][0].inspected_at, "2024-01-02")

    def test_distinct_names_are_left_alone(self):
        merged = merge_listings(
            [(listing(name="Bayside"), "Butik"), (listing(name="Bistro L"), "Övrigt")]
        )
        self.assertEqual(len(merged), 2)


class Deviations(unittest.TestCase):
    def test_every_spelling_of_no_deviations_is_recognised(self):
        # Samtliga former som förekommer, räknade över alla 157 poster.
        for text in ("inga avvikelser", "Inga avvikelser", "Inga", "inga",
                     "ingen avvikelse", "ingea avvikelser", "inga avvikesler",
                     "inga avviklser", "inga avviksler", "", "   "):
            areas, unreadable = parse_deviations(text)
            self.assertEqual((areas, unreadable), ([], []), text)

    def test_misspellings_are_normalised_to_the_spelling_the_source_uses_elsewhere(self):
        areas, _ = parse_deviations("tempratur, persolig hygien, utforming av lokal")
        self.assertEqual([a.group for a in areas],
                         ["Temperatur", "Personlig hygien", "Utformning av lokal"])

    def test_the_sources_own_wording_is_kept_alongside_the_normalised_name(self):
        # Normaliseringen ska gå att granska, inte radera källan.
        areas, _ = parse_deviations("tempratur")
        self.assertEqual(areas[0].description, "tempratur")
        self.assertEqual(areas[0].status, "deviation")

    def test_och_separates_areas_just_like_a_comma(self):
        areas, _ = parse_deviations("Rengöring och svårstädad lokal")
        self.assertEqual([a.group for a in areas], ["Rengöring", "Svårstädad lokal"])

    def test_unknown_text_is_reported_not_silently_dropped(self):
        areas, unreadable = parse_deviations("rengöring, kylkedjan")
        self.assertEqual([a.group for a in areas], ["Rengöring"])
        self.assertEqual(unreadable, ["kylkedjan"])


class Inspections(unittest.TestCase):
    def parse(self, row):
        return normalize_inspections(row, "F-1262-t")

    def test_green_without_deviations_is_clean(self):
        got = self.parse(listing(deviations="inga avvikelser"))
        self.assertEqual(len(got), 1)
        self.assertEqual(got[0].assessment, NO_REMARKS)
        self.assertEqual(got[0].inspected_at, date(2026, 6, 1))
        self.assertEqual(got[0].type, ROUTINE)

    def test_green_with_deviations_is_a_minor_remark_not_a_clean_bill(self):
        # 67 av 143 gröna poster räknar upp avvikelser. Grönt betyder enligt
        # kommunen "inga ELLER ett fåtal". Kallar vi dem utan anmärkning
        # skriver sidan "inga anmärkningar" ovanför en lista med
        # anmärkningar, och Lomma ser renare ut än Jönköping och Karlstad,
        # där varje noterad avvikelse ger MINOR.
        got = self.parse(listing(deviations="rengöring, personlig hygien"))
        self.assertEqual(got[0].assessment, MINOR_REMARKS)
        self.assertEqual([a.group for a in got[0].areas],
                         ["Rengöring", "Personlig hygien"])

    def test_yellow_is_minor_because_it_describes_a_coming_follow_up(self):
        # "Avvikelser som leder till en extra kontroll" är inte avvikelser som
        # ÖVERLEVT en uppföljning. Samma fälla som Oskarshamns "Kvarstående
        # avvikelser": ett strängt ord om ett tidigt skede.
        self.assertEqual(COLOUR_ASSESSMENT["gul"], MINOR_REMARKS)
        got = self.parse(listing(colour="gul", deviations="svårstädad lokal"))
        self.assertEqual(got[0].assessment, MINOR_REMARKS)

    def test_red_is_major_because_the_municipality_requires_enforcement(self):
        got = self.parse(listing(colour="röd", deviations="märkning"))
        self.assertEqual(got[0].assessment, MAJOR_REMARKS)

    def test_a_missing_date_gives_no_inspection_at_all(self):
        # Tre poster står under en färgrubrik utan datum. Ett omdöme utan
        # datum går inte att åldersbedöma, och då avstår vi.
        self.assertEqual(self.parse(listing(when="", deviations="")), [])

    def test_an_unreadable_date_raises_instead_of_being_rounded(self):
        with self.assertRaises(UnknownSourceValue):
            self.parse(listing(when="2025-11-?", deviations="personlig hygien"))

    def test_unreadable_text_under_green_raises_because_it_decides_the_verdict(self):
        # Inom grönt är det texten, inte färgen, som skiljer ren från
        # anmärkt. Går texten inte att läsa vet vi inte vilket det är.
        with self.assertRaises(UnknownSourceValue):
            self.parse(listing(deviations="kylkedjan"))

    def test_unreadable_text_under_yellow_keeps_the_verdict_but_flags_it(self):
        # "Bjärreds krog": kommunen har lämnat kvar frasen "inga avvikelser"
        # hopskriven med nästa område. Färgen är ändå entydig, så omdömet
        # står — men listan över områden är ofullständig och ska märkas.
        got = self.parse(listing(
            colour="gul",
            deviations="inga avvikelserseparering avfall, svårstädad lokal, förvaring",
        ))
        self.assertEqual(got[0].assessment, MINOR_REMARKS)
        self.assertTrue(got[0].uncertain)
        self.assertEqual([a.group for a in got[0].areas],
                         ["Svårstädad lokal", "Förvaring"])

    def test_yellow_claiming_no_deviations_raises(self):
        # Sidan motsäger då sig själv, och en handredigerad sida som gör det
        # ska inte publiceras vidare. Jämför Sjöbo, där alt-text och filnamn
        # bråkar i 19 procent av posterna.
        with self.assertRaises(UnknownSourceValue):
            self.parse(listing(colour="gul", deviations="inga avvikelser"))

    def test_inspection_id_is_stable_and_carries_the_date(self):
        got = self.parse(listing(name="Bayside"))[0]
        self.assertEqual(got.id_national, f"I-1262-{local_id('Bayside')}-2026-06-01")


class EndToEnd(unittest.TestCase):
    """Adaptern plus modellen, så att mappningen bedöms på sitt utfall."""

    def verdict(self, row):
        inspections = normalize_inspections(row, "F-1262-t")
        return assess(
            [
                Inspection(i.id_national, i.inspected_at, i.assessment, i.type)
                for i in inspections
            ],
            TODAY,
        )

    def test_a_clean_green_post_becomes_clean(self):
        self.assertEqual(self.verdict(listing(deviations="inga avvikelser")).verdict,
                         "clean")

    def test_yellow_stays_minor_because_nothing_shows_persistence(self):
        # Källan har varken föregående kontroll eller kontrolltyp, så
        # grading.py kan aldrig skärpa till "major" ur ett gult. Samma
        # asymmetri som Karlstad och Oskarshamn, och den hör hemma på
        # metodiksidan.
        self.assertEqual(self.verdict(listing(colour="gul")).verdict, "minor")

    def test_red_becomes_major(self):
        self.assertEqual(self.verdict(listing(colour="röd")).verdict, "major")

    def test_an_undated_post_gives_no_verdict_at_all(self):
        result = self.verdict(listing(when="", deviations=""))
        self.assertIsNone(result.verdict)
        self.assertEqual(result.reason, REASON_NO_INSPECTIONS)
        self.assertFalse(result.publishable)

    def test_an_inspection_older_than_the_window_gives_no_verdict(self):
        # 22 av 153 poster ligger före 2023-08-03. De ska bli obedömda, inte
        # gröna: äldst i beståndet är 2021-03-09.
        result = self.verdict(listing(when="2021-03-09", deviations="inga avvikelser"))
        self.assertIsNone(result.verdict)
        self.assertEqual(result.reason, REASON_STALE)

    def test_the_distinction_can_never_be_earned_here(self):
        # Källan publicerar en enda kontroll per verksamhet, och utmärkelsen
        # kräver tre rena i rad.
        self.assertFalse(self.verdict(listing(deviations="inga avvikelser")).distinction)


if __name__ == "__main__":
    unittest.main(verbosity=2)
