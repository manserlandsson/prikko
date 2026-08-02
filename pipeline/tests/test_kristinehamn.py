"""Tester för Kristinehamns-adaptern.

Fixturerna är verkliga: attributen kommer ur kommunens ArcGIS-lager och
rapporttexterna är utvunna ur kommunens egna PDF-bilagor 2026-08-03 med
`prikko.pdf`. Att texten kommer ord för ord på egen rad är källans form,
inte vår.

Kör:  python3 pipeline/tests/test_kristinehamn.py
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
from prikko.sources.kristinehamn import (  # noqa: E402
    Attachment,
    UnknownSourceValue,
    assessment_of,
    control_date,
    is_active,
    local_id,
    merge_features,
    normalize_establishment,
    normalize_inspections,
    parse_attachments,
    parse_report,
    readable_history,
    squeeze,
)

TODAY = date(2026, 8, 3)

# Verklig rad ur MapServer/14/query.
COOP = {
    "attributes": {
        "OBJECTID": 1,
        "EcosOBJID": 2115,
        "Namn": "Stora Coop Kristinehamn",
        "Adress": "Albinvägen 2",
        "Verksamhetstyp": 2,
        "Aktiv": 1,
    },
    "geometry": {"x": 184282.6615000004, "y": 6577687.687899999},
}

# Verklig rad: avregistrerad verksamhet med sex bilagor.
CLOSED = {
    "attributes": {
        "OBJECTID": 37364,
        "EcosOBJID": None,
        "Namn": "Restaurang Himla gott",
        "Adress": None,
        "Verksamhetstyp": 7,
        "Aktiv": 0,
    },
    "geometry": {"x": 184000.0, "y": 6577000.0},
}

# Verklig rad: kommunen har inte fyllt i namnet.
NAMELESS = {
    "attributes": {
        "OBJECTID": 16557,
        "EcosOBJID": 5257,
        "Namn": None,
        "Adress": "Tegelslagaregatan 28",
        "Verksamhetstyp": 2,
        "Aktiv": 1,
    },
    "geometry": {"x": 184000.0, "y": 6577000.0},
}

# Verklig text ur "Sannabadet 2023-09-12.pdf": ren kontroll, ISO-datum.
CLEAN_REPORT = (
    "utförde\n2023\n-\n09\n-\n12\nen\nlivsmedelskontroll\nhos\nSannabadet,\n"
    "Arenavägen\n3.\nDet\nvar\nen\nordinarie\nkontroll,\nsom\nmyndigheten\n"
    "gör\nregelbundet.\nKontrollen\ngjordes\ni\nform\nav\nen\noanmäld\n"
    "inspektion.\nNärvarande\nvid\nkontrollen\nvar\npersonal\nfrån\n"
    "verksamheten\nsamt\nIda\nLindbäck\nfrån\nmiljö\n-\noch\n"
    "stadsbyggnadsförvaltningen.\nResultat\nav\nkontrollen:\nUtan\navvikelse\n"
    "Inga\navvikelser\nkonstaterades\nvid\ndenna\nkontroll."
)

# Verklig text ur "Coop, 2024-11-18.pdf": avvikelser, datum i klartext.
DEVIATION_REPORT = (
    "utförde\nden\n6\nnovember\n2024\nen\nlivsmedelskontroll\nhos\nStora\n"
    "Coop\nKristinehamn,\nAlbinvägen\n2.\nDet\nvar\nen\nordinarie\nkontroll,\n"
    "som\nmyndigheten\ngör\nregelbundet.\nKontrollen\ngjordes\ni\nform\nav\n"
    "en\noanmäld\ninspektion.\nNärvarande\nvid\nkontrollen\nvar\npersonal\n"
    "från\nverksamheten\nsamt\nHanna\nKarlsson\nfrån\nmiljö\n-\noch\n"
    "stadsbyggnadsförvaltningen.\nResultat\nav\nkontrollen\n:\nEn\neller\n"
    "flera\navvikelser\nkonstaterades\nVid\nkontrollen\nkonstaterades\nen\n"
    "eller\nflera\navvikelser\nfrån\nlagstiftningen\n."
)

# Verklig text ur "Coop, 2024-12-03.pdf": återbesöket, som fortfarande finner
# avvikelser.
FOLLOWUP_REPORT = (
    "utförde\nden\n28\nnovember\n2024\nen\nlivsmedelskontroll\nhos\nStora\n"
    "Coop\nKristinehamn,\nAlbinvägen\n2.\nDet\nvar\nen\nextra\nkontroll\nför\n"
    "att\nfölja\nupp\nom\navvikelser\nfrån\nlivsmedelslagstiftningen\n"
    "åtgärdats.\nKontrollen\ngjordes\ni\nform\nav\nen\noanmäld\ninspektion.\n"
    "Resultat\nav\nkontrollen\n:\nEn\neller\nflera\navvikelser\nkonstaterades"
)

# Verklig standardtext som står i 164 av 258 rapporter, långt efter
# resultatet. Den innehåller ordet "extrakontroll" utan att kontrollen var en.
BOILERPLATE = (
    "\nUppföljning\nAvvikelsen\nkommer\natt\nfölja"
    "s\nupp\nvid\nen\nextrakontroll.\nNämnden\nkan\nkomma\natt\nbesluta\nom\n"
    "krav\npå\559åtgärder."
)

# Verkligt svar från queryAttachments.
ATTACHMENT_PAYLOAD = {
    "attachmentGroups": [
        {
            "parentObjectId": 1,
            "attachmentInfos": [
                {
                    "id": 125635,
                    "name": "Coop, 2024-11-18.pdf",
                    "contentType": "application/pdf",
                    "size": 422641,
                },
                {
                    "id": 126031,
                    "name": "Coop, 2024-12-03.pdf",
                    "contentType": "application/pdf",
                    "size": 406122,
                },
                {
                    "id": 125649,
                    "name": "Stora Coop 13 augusti 2025.pdf",
                    "contentType": "application/pdf",
                    "size": 1474340,
                },
            ],
        }
    ]
}


def attachment(name="Coop, 2024-11-18.pdf", ident=125635, parent=1):
    return Attachment(id=ident, parent=parent, filename=name)


class Attachments(unittest.TestCase):
    def test_the_listing_is_read(self):
        found = parse_attachments(ATTACHMENT_PAYLOAD)
        self.assertEqual([a.id for a in found], [125635, 126031, 125649])
        self.assertEqual(found[0].parent, 1)

    def test_the_url_points_at_the_layer_and_the_attachment(self):
        self.assertTrue(
            parse_attachments(ATTACHMENT_PAYLOAD)[0].url.endswith(
                "/MapServer/14/1/attachments/125635"
            )
        )

    def test_every_date_form_in_the_filenames_is_read(self):
        # Fyra former förekommer. 350 av 354 filnamn bär ett läsbart datum.
        self.assertEqual(attachment("Coop, 2024-11-18.pdf").published_at,
                         date(2024, 11, 18))
        self.assertEqual(attachment("Björkhallen 20180221 uppföljande kontroll.pdf")
                         .published_at, date(2018, 2, 21))
        self.assertEqual(attachment("Stora Coop 13 augusti 2025.pdf").published_at,
                         date(2025, 8, 13))
        self.assertEqual(attachment("Park Hotel 2024 04 25.pdf").published_at,
                         date(2024, 4, 25))

    def test_a_filename_typo_gives_no_date_rather_than_a_wrong_one(self):
        # "Valentino Skrivelse 20024-10-31.pdf" — året har fem siffror.
        self.assertIsNone(attachment("Valentino Skrivelse 20024-10-31.pdf").published_at)

    def test_a_decision_is_recognised_by_its_filename(self):
        # Behövs utöver textmarkören: ett inskannat föreläggande har ingen
        # text att läsa markören ur, och skulle annars spärra omdömet som en
        # oläsbar senaste rapport.
        self.assertTrue(attachment("Föreläggande lidl 2025-06-12.pdf").is_decision)
        # Kommunens egen felstavning.
        self.assertTrue(attachment("Förleäggande Pekås 2025-06-12.pdf").is_decision)
        self.assertFalse(attachment("Coop, 2024-11-18.pdf").is_decision)


class Establishment(unittest.TestCase):
    def test_the_coordinates_land_in_kristinehamn(self):
        e = normalize_establishment(COOP)
        # Kristinehamns centrum ligger på ungefär 59.31 N, 14.11 Ö. Med
        # rikszonen TM hade punkten hamnat långt västerut.
        self.assertAlmostEqual(e.lat, 59.312966, places=5)
        self.assertAlmostEqual(e.lng, 14.101953, places=5)

    def test_the_business_type_code_is_translated(self):
        self.assertEqual(normalize_establishment(COOP).types, ["Butik med beredning"])

    def test_an_unknown_business_type_raises_instead_of_being_dropped(self):
        row = {"attributes": dict(COOP["attributes"], Verksamhetstyp=99),
               "geometry": dict(COOP["geometry"])}
        with self.assertRaises(UnknownSourceValue):
            normalize_establishment(row)

    def test_a_missing_address_is_none_not_an_empty_string(self):
        row = {"attributes": dict(COOP["attributes"], Adress=None),
               "geometry": dict(COOP["geometry"])}
        self.assertIsNone(normalize_establishment(row).street_address)

    def test_a_nameless_row_raises_rather_than_being_published(self):
        with self.assertRaises(UnknownSourceValue):
            normalize_establishment(NAMELESS)

    def test_a_deregistered_business_is_not_published(self):
        # Att publicera ett hygienomdöme om en restaurang som har lagt ned är
        # fel oavsett vad rapporten säger.
        self.assertFalse(is_active(CLOSED["attributes"]))
        # Ett tomt Aktiv betyder att fältet inte fyllts i, inte att
        # verksamheten är borta: 21 rader ser ut så och flera har färska
        # rapporter.
        self.assertTrue(is_active(dict(COOP["attributes"], Aktiv=None)))


class Identity(unittest.TestCase):
    def test_identity_survives_arcgis_renumbering(self):
        # OBJECTID numreras om vid ompublicering, vilket är precis hur
        # tjänsten uppdateras. EcosOBJID vore rätt nyckel men är null i 108
        # av 180 rader.
        one = local_id(COOP["attributes"])
        two = local_id(dict(COOP["attributes"], OBJECTID=99999, EcosOBJID=None))
        self.assertEqual(one, two)

    def test_two_names_at_different_addresses_stay_apart(self):
        self.assertNotEqual(
            local_id(dict(COOP["attributes"], Adress="Albinvägen 2")),
            local_id(dict(COOP["attributes"], Adress="Hamnvägen 4")),
        )

    def test_a_nameless_row_raises(self):
        with self.assertRaises(UnknownSourceValue):
            local_id(NAMELESS["attributes"])


class MergeFeatures(unittest.TestCase):
    """`Nock` ligger två gånger i registret, båda utan adress."""

    def test_the_same_name_and_address_becomes_one_establishment(self):
        rows = [
            {"attributes": {"OBJECTID": 34161, "EcosOBJID": None, "Namn": "Nock",
                            "Adress": None, "Verksamhetstyp": 10, "Aktiv": None},
             "geometry": {"x": 184000.0, "y": 6577000.0}},
            {"attributes": {"OBJECTID": 37771, "EcosOBJID": None, "Namn": "Nock",
                            "Adress": None, "Verksamhetstyp": 8, "Aktiv": None},
             "geometry": {"x": 184000.0, "y": 6577000.0}},
        ]
        merged = merge_features(rows)
        self.assertEqual(len(merged), 1)
        # Bilagorna hämtas för BÅDA raderna, annars tappas tre rapporter.
        self.assertEqual(merged[0][1], [34161, 37771])

    def test_distinct_establishments_are_left_alone(self):
        merged = merge_features([COOP, {"attributes": dict(COOP["attributes"],
                                                           OBJECTID=2, Namn="Lidl"),
                                        "geometry": dict(COOP["geometry"])}])
        self.assertEqual(len(merged), 2)


class Result(unittest.TestCase):
    def test_no_deviations_is_read(self):
        self.assertEqual(assessment_of(squeeze(CLEAN_REPORT)), NO_REMARKS)

    def test_deviations_are_read(self):
        self.assertEqual(assessment_of(squeeze(DEVIATION_REPORT)), MINOR_REMARKS)

    def test_a_space_before_the_colon_does_not_hide_the_result(self):
        # Kommunen skriver "Resultat av kontrollen :" i rapporterna med
        # avvikelser. Utan blankstegsborttagning missas hela meningen.
        self.assertIn("Resultatavkontrollen:", squeeze(DEVIATION_REPORT))

    def test_an_unknown_template_gives_nothing(self):
        self.assertIsNone(assessment_of(squeeze("KONTROLLRAPPORT\nDatum\n2020")))


class ControlDate(unittest.TestCase):
    def test_the_iso_form_is_read(self):
        self.assertEqual(control_date(squeeze(CLEAN_REPORT)), date(2023, 9, 12))

    def test_the_written_form_is_read(self):
        self.assertEqual(control_date(squeeze(DEVIATION_REPORT)), date(2024, 11, 6))

    def test_a_doubled_den_is_tolerated(self):
        # "utförde den den 16 oktober 2025" står i nio rapporter.
        text = "utförde\nden\nden\n16\noktober\n2025\nen\nlivsmedelskontroll\nhos\nX"
        self.assertEqual(control_date(squeeze(text)), date(2025, 10, 16))

    def test_the_letterhead_date_is_never_mistaken_for_the_control_date(self):
        # Rapporten är daterad 2023-09-14 högst upp; kontrollen gjordes
        # 2023-09-12. Ett omankrat mönster hade tagit brevhuvudet.
        header = "KONTROLLRAPPORT\nDatum\n2023\n-\n09\n-\n14\nDnr\nLIV.2023.997\n"
        self.assertEqual(control_date(squeeze(header + CLEAN_REPORT)),
                         date(2023, 9, 12))


class ParseReport(unittest.TestCase):
    def test_a_clean_report_is_parsed_whole(self):
        report = parse_report(CLEAN_REPORT, attachment("Sannabadet 2023-09-12.pdf"))
        self.assertEqual(report.assessment, NO_REMARKS)
        self.assertEqual(report.inspected_at, date(2023, 9, 12))
        self.assertEqual(report.type, ROUTINE)
        self.assertFalse(report.prenotified)

    def test_an_extra_control_is_a_follow_up(self):
        # 54 rapporter säger "Det var en extra kontroll för att följa upp om
        # avvikelser från livsmedelslagstiftningen åtgärdats". Det är
        # kommunens egen definition av ett återbesök.
        report = parse_report(FOLLOWUP_REPORT, attachment("Coop, 2024-12-03.pdf"))
        self.assertEqual(report.type, FOLLOWUP)

    def test_the_boilerplate_does_not_turn_a_routine_control_into_a_follow_up(self):
        # "Avvikelsen kommer att följas upp vid en extrakontroll" står i 164
        # av 258 rapporter, som standardtext efter varje avvikelse.
        report = parse_report(DEVIATION_REPORT + BOILERPLATE,
                              attachment("Coop, 2024-11-18.pdf"))
        self.assertEqual(report.type, ROUTINE)

    def test_a_prenotified_visit_is_read(self):
        text = CLEAN_REPORT.replace("en\noanmäld\ninspektion", "en\nföranmäld\ninspektion")
        self.assertTrue(parse_report(text, attachment()).prenotified)

    def test_a_scanned_report_raises_instead_of_being_read_as_clean(self):
        # 78 av 354 bilagor saknar textlager. Tolkas de som "inga avvikelser"
        # publicerar vi ett godkännande ingen myndighet har utfärdat.
        with self.assertRaises(UnknownSourceValue):
            parse_report("", attachment("Tapiren 2024-04-04.pdf"))

    def test_a_delegation_decision_is_not_an_inspection(self):
        # Nio bilagor är förelägganden. Kontrollen som ledde fram till
        # beslutet publiceras som en egen rapport, så uppgiften tappas inte.
        with self.assertRaises(UnknownSourceValue):
            parse_report("DELEGATIONSBESLUT\nSida\n1\n(\n3\n)\nDatum\n2025\n-\n06\n-\n12",
                         attachment("Föreläggande lidl 2025-06-12.pdf"))


class History(unittest.TestCase):
    def rows(self, *pairs):
        return [parse_report(text, a) for text, a in pairs]

    def test_reports_become_a_history_newest_first(self):
        files = [attachment("Coop, 2024-11-18.pdf", 125635),
                 attachment("Coop, 2024-12-03.pdf", 126031)]
        reports = self.rows((DEVIATION_REPORT, files[0]), (FOLLOWUP_REPORT, files[1]))
        got = normalize_inspections(files, reports, "F-1781-abc123abc123")
        self.assertEqual([i.inspected_at for i in got],
                         [date(2024, 11, 28), date(2024, 11, 6)])

    def test_an_unreadable_newest_report_blocks_the_whole_verdict(self):
        files = [attachment("Coop, 2023-09-12.pdf", 1),
                 attachment("Coop, 2026-05-19.pdf", 2)]
        reports = self.rows((CLEAN_REPORT, files[0]))
        self.assertEqual(readable_history(files, reports), [])

    def test_a_decision_never_blocks_the_verdict(self):
        # Ett föreläggande är inget kontrolltillfälle och får inte se ut som
        # en nyare kontroll vi inte kunde läsa.
        files = [attachment("Sannabadet 2023-09-12.pdf", 1),
                 attachment("Föreläggande Sannabadet 2026-06-05.pdf", 2)]
        reports = self.rows((CLEAN_REPORT, files[0]))
        self.assertEqual(len(readable_history(files, reports)), 1)

    def test_two_reports_from_the_same_day_become_one_inspection(self):
        files = [attachment("A 2023-09-14.pdf", 1), attachment("B 2023-09-14.pdf", 2)]
        reports = self.rows(
            (CLEAN_REPORT, files[0]),
            (CLEAN_REPORT.replace(
                "Resultat\nav\nkontrollen:\nUtan\navvikelse\nInga\navvikelser\n"
                "konstaterades\nvid\ndenna\nkontroll.",
                "Resultat\nav\nkontrollen\n:\nEn\neller\nflera\navvikelser\n"
                "konstaterades"), files[1]),
        )
        got = normalize_inspections(files, reports, "F-1781-abc123abc123")
        self.assertEqual(len(got), 1)
        # Det sämre utfallet vinner, samma regel som i Linköping.
        self.assertEqual(got[0].assessment, MINOR_REMARKS)


class EndToEnd(unittest.TestCase):
    """Adaptern plus modellen, så att mappningen bedöms på sitt utfall."""

    def verdict(self, *pairs):
        files = [a for _, a in pairs]
        reports = [parse_report(t, a) for t, a in pairs]
        inspections = normalize_inspections(files, reports, "F-1781-abc123abc123")
        return assess(
            [
                Inspection(i.id_national, i.inspected_at, i.assessment, i.type)
                for i in inspections
            ],
            TODAY,
        )

    def test_a_clean_report_becomes_clean(self):
        fresh = CLEAN_REPORT.replace("2023\n-\n09\n-\n12", "2026\n-\n05\n-\n12")
        self.assertEqual(
            self.verdict((fresh, attachment("Sannabadet 2026-05-14.pdf"))).verdict,
            "clean",
        )

    def test_a_single_deviation_report_stays_minor(self):
        self.assertEqual(
            self.verdict((DEVIATION_REPORT, attachment("Coop, 2024-11-18.pdf"))).verdict,
            "minor",
        )

    def test_a_follow_up_that_still_finds_deviations_becomes_major(self):
        # Kommunens egen definition: extrakontrollen görs för att se om
        # avvikelserna åtgärdats. Hittar den ändå avvikelser har bristen
        # överlevt återbesöket. Det är samma grund som i Karlstad, och det
        # är därför Kristinehamn är den bästa av de fem nya källorna.
        result = self.verdict(
            (DEVIATION_REPORT, attachment("Coop, 2024-11-18.pdf", 1)),
            (FOLLOWUP_REPORT, attachment("Coop, 2024-12-03.pdf", 2)),
        )
        self.assertEqual(result.verdict, "major")

    def test_an_establishment_without_readable_reports_gets_no_verdict(self):
        result = assess([], TODAY)
        self.assertIsNone(result.verdict)
        self.assertEqual(result.reason, REASON_NO_INSPECTIONS)
        self.assertFalse(result.publishable)

    def test_an_inspection_older_than_the_window_gives_no_verdict(self):
        # 31 av 171 verksamheter har bara kontroller före 2023-08-04.
        old = CLEAN_REPORT.replace("2023\n-\n09\n-\n12", "2020\n-\n09\n-\n12")
        result = self.verdict((old, attachment("Sannabadet 2020-09-14.pdf")))
        self.assertIsNone(result.verdict)
        self.assertEqual(result.reason, REASON_STALE)


if __name__ == "__main__":
    unittest.main(verbosity=2)
