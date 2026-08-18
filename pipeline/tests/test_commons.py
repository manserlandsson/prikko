"""Prov för Commons-bilderna: spärren, licensen och bildtexten.

    python3 pipeline/tests/test_commons.py

Fallen är inte påhittade. Varje sträng nedan är ett verkligt svar ur Wikidata
eller Commons `extmetadata`, hämtat 2026-08-18 för de 33 verksamheter som bär
en `wikidata`-tagg. De tre som spärren fäller är med, och de är de viktigaste
proven i filen: alla tre ser rätt ut ända fram till spärren.
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko import commons  # noqa: E402

#: Den Gyldene Freden. OSM-punkten och Wikidata-objektets P625 ligger en meter
#: isär, alltså det normala fallet.
FREDEN_LAT, FREDEN_LNG = 59.323283, 18.071583


def subject(qid="Q1145843", image="Den Gyldene Freden 2013a.jpg", lat=None, lng=None):
    return commons.Subject(qid=qid, image=image, lat=lat, lng=lng)


def commons_image(**overrides):
    base = dict(
        title="Den Gyldene Freden 2013a.jpg",
        fetch_url="https://upload.wikimedia.org/…/1280px-Den_Gyldene_Freden_2013a.jpg",
        mime="image/jpeg",
        licence="CC-BY-SA-3.0",
        creator="Holger.Ellgaard",
        year="2013",
        captured_at="2013-09-20",
        attribution_required=True,
    )
    base.update(overrides)
    return commons.CommonsImage(**base)


class Sparren(unittest.TestCase):
    """150-metersspärren, och de tre verkliga fallen den fäller.

    Spärren är hela skillnaden mellan en bild av rätt ställe och en bild som
    ser rätt ut. Se docs/37_osm_taggar.md §5.3.
    """

    def test_samma_plats_slapps_igenom(self):
        near = subject(lat=FREDEN_LAT, lng=FREDEN_LNG)
        self.assertIsNotNone(commons.within_reach(near, FREDEN_LAT, FREDEN_LNG))

    def test_villa_godthem_pa_114_meter_slapps_igenom(self):
        # Det längsta avstånd som faktiskt passerar i vårt bestånd. Gränsen
        # ligger i ett glapp mellan 114 och 177 meter, inte mitt i en hög.
        far = subject(lat=FREDEN_LAT + 114 / 111320.0, lng=FREDEN_LNG)
        metres = commons.within_reach(far, FREDEN_LAT, FREDEN_LNG)
        self.assertIsNotNone(metres)
        self.assertAlmostEqual(metres, 114, delta=1)

    def test_stangs_magasin_pa_177_meter_faller(self):
        # Rätt hus, fel avstånd. Den enda av de tre som HAR en koordinat.
        far = subject(lat=FREDEN_LAT + 177 / 111320.0, lng=FREDEN_LNG)
        self.assertIsNone(commons.within_reach(far, FREDEN_LAT, FREDEN_LNG))

    def test_utan_koordinat_faller(self):
        # City Gross ärvde "Apotek Hjärtat … City Gross Norrköping.jpg" och
        # Stadsmissionens Restaurang en stadsvy från 1900. BÅDA saknar P625,
        # alltså är det just det här provet som håller dem borta. Att lita på
        # P18 när P625 saknas hade släppt igenom två av tre farliga fall.
        self.assertIsNone(commons.within_reach(subject(), FREDEN_LAT, FREDEN_LNG))

    def test_halva_koordinaten_ar_ingen_koordinat(self):
        self.assertIsNone(
            commons.within_reach(subject(lat=FREDEN_LAT), FREDEN_LAT, FREDEN_LNG)
        )


class Licenser(unittest.TestCase):
    """Tillåtelselistan. Ett okänt värde betyder ingen bild, aldrig fri."""

    def test_alla_sex_licenserna_i_bestandet_kanns_igen(self):
        # De sex koder Commons faktiskt svarade med för våra 27 bilder.
        for code, expected in (
            ("cc-by-sa-4.0", "CC-BY-SA-4.0"),
            ("cc-by-sa-3.0", "CC-BY-SA-3.0"),
            ("cc-by-sa-2.0", "CC-BY-SA-2.0"),
            ("cc-by-3.0", "CC-BY-3.0"),
            ("cc-by-2.0", "CC-BY-2.0"),
            ("pd", "PD"),
        ):
            self.assertEqual(commons.FREE_LICENCES.get(code), expected)

    def test_icke_fria_licenser_star_inte_i_listan(self):
        # Commons bär även det här, och en förbudslista hade behövt känna
        # till varenda variant för att vara sann. Listan är därför en
        # tillåtelselista.
        for code in (
            "cc-by-nc-2.0",
            "cc-by-nc-sa-4.0",
            "cc-by-nd-4.0",
            "fairuse",
            "attribution",
            "",
        ):
            self.assertIsNone(commons.FREE_LICENCES.get(code))


class Upphovsperson(unittest.TestCase):
    def test_lank_blir_namn(self):
        raw = (
            '<a href="//commons.wikimedia.org/wiki/User:Holger.Ellgaard" '
            'title="User:Holger.Ellgaard">Holger.Ellgaard</a>'
        )
        self.assertEqual(commons.creator_of(raw), "Holger.Ellgaard")

    def test_dold_dubblett_tas_bort_med_sitt_innehall(self):
        # Ordagrant Commons svar för "Restaurang Blå porten ca 1915.jpg" med
        # svensk extmetadata. Stryks taggarna rakt av blir texten
        # "OkändUnknown author" och står så under bilden.
        raw = 'Okänd<span style="display: none;">Unknown author</span>'
        self.assertEqual(commons.plain_text(raw), "Okänd")
        self.assertIsNone(commons.creator_of(raw))

    def test_okand_pa_engelska_ocksa(self):
        raw = 'Unknown author<span style="display: none;">Unknown author</span>'
        self.assertIsNone(commons.creator_of(raw))

    def test_namn_utan_markup_behalls(self):
        # Public domain-bilderna ur Digitala stadsmuseet står som ren text.
        self.assertEqual(commons.creator_of("Lennart af Petersens"), "Lennart af Petersens")
        self.assertEqual(commons.creator_of("Ingemar Gram"), "Ingemar Gram")

    def test_extern_lank_blir_namn(self):
        raw = (
            '<a rel="nofollow" class="external text" '
            'href="https://www.flickr.com/people/89060048@N03">City Foodsters</a>'
        )
        self.assertEqual(commons.creator_of(raw), "City Foodsters")

    def test_entiteter_och_hardmellanslag(self):
        self.assertEqual(commons.plain_text("Erik&nbsp;&amp;&nbsp;Co"), "Erik & Co")

    def test_tomt(self):
        self.assertIsNone(commons.creator_of(None))
        self.assertIsNone(commons.creator_of("   "))


class Artal(unittest.TestCase):
    """Årtalet är ett ärlighetskrav, inte ett licenskrav."""

    def test_fullt_datum(self):
        self.assertEqual(commons.year_text("2013-09-20 14:02:21", "vad som helst.jpg"), "2013")

    def test_bara_artal(self):
        self.assertEqual(commons.year_text("2010", "Den gröne Jägaren 2010.jpg"), "2010")

    def test_manad_och_ar(self):
        self.assertEqual(commons.year_text("1959-09", "Wirströms … 1959.jpg"), "1959")

    def test_engelsk_fritext(self):
        self.assertEqual(
            commons.year_text("Taken on\xa024 July 2014", "panoramio (61).jpg"), "2014"
        )

    def test_spann_avrundas_aldrig(self):
        # Commons säger "mellan 1912 och 1920" om Blå porten. Att skriva 1912
        # vore en precision vi inte har, och 1915 vore en gissning.
        self.assertEqual(
            commons.year_text("mellan 1912 och 1920", "Restaurang Blå porten ca 1915.jpg"),
            "1912 till 1920",
        )

    def test_filnamnet_ar_reserv(self):
        # "Hamburger börs april 2011.jpg" saknar DateTimeOriginal helt.
        self.assertEqual(commons.year_text(None, "Hamburger börs april 2011.jpg"), "2011")

    def test_arkivnummer_i_filnamnet_ar_inget_artal(self):
        # "00 5284 Stockholm - Café Sundbergs in Gamla stan.jpg". 5284 ligger
        # utanför 1826 till i år, och skulle det inte göra det är det ändå
        # två tal i namnet.
        self.assertIsNone(
            commons.year_text(None, "00 5284 Stockholm - Café Sundbergs in Gamla stan.jpg")
        )

    def test_utan_uppgift_star_inget_artal(self):
        self.assertIsNone(commons.year_text(None, "Rydsherrgard.jpg"))
        self.assertIsNone(commons.year_text(None, "RestaurangPelikan.JPG"))

    def test_framtida_artal_ar_inget_artal(self):
        self.assertIsNone(commons.year_text(None, "hus 2400.jpg", upper=2026))


class Fangstdatum(unittest.TestCase):
    """`images.captured_at` är en `date` och tar inget halvt datum."""

    def test_fullt_datum_med_klockslag(self):
        self.assertEqual(commons.captured_date("2013-09-20 14:02:21"), "2013-09-20")

    def test_fullt_datum_utan_klockslag(self):
        self.assertEqual(commons.captured_date("2005-08-02"), "2005-08-02")

    def test_manadsprecision_ar_inget_datum(self):
        self.assertIsNone(commons.captured_date("1959-09"))
        self.assertIsNone(commons.captured_date("2007-11"))

    def test_artal_ar_inget_datum(self):
        self.assertIsNone(commons.captured_date("2009"))

    def test_fritext_ar_inget_datum(self):
        self.assertIsNone(commons.captured_date("mellan 1912 och 1920"))
        self.assertIsNone(commons.captured_date(None))


class Bildtext(unittest.TestCase):
    """Attributionen är ett licensvillkor och byggs i pipelinen, inte i mallen."""

    def test_fotograf_och_ar(self):
        self.assertEqual(commons.credit_line(commons_image()), "Foto: Holger.Ellgaard, 2013")

    def test_fotograf_utan_ar(self):
        self.assertEqual(
            commons.credit_line(commons_image(creator="Ankara", year=None)), "Foto: Ankara"
        )

    def test_okand_fotograf_med_ar(self):
        self.assertEqual(
            commons.credit_line(
                commons_image(creator=None, year="1912 till 1920", licence="PD")
            ),
            "Okänd fotograf, 1912 till 1920",
        )

    def test_public_domain_far_samma_form(self):
        # Fyra av 27 kräver ingen attribution alls. De får den ändå: årtalet
        # är ett ärlighetskrav, och tre av de fyra är de historiska.
        self.assertEqual(
            commons.credit_line(
                commons_image(
                    creator="Lennart af Petersens",
                    year="1959",
                    licence="PD",
                    attribution_required=False,
                )
            ),
            "Foto: Lennart af Petersens, 1959",
        )

    def test_varken_fotograf_eller_ar(self):
        self.assertEqual(
            commons.credit_line(commons_image(creator=None, year=None)), "Okänd fotograf"
        )


class Filsidan(unittest.TestCase):
    """URI:n till materialet, som CC BY-SA 4.0 3(a)(1)(A)(v) ber om."""

    def test_mellanslag_blir_understreck(self):
        self.assertEqual(
            commons.file_page_url("Den Gyldene Freden 2013a.jpg"),
            "https://commons.wikimedia.org/wiki/File:Den_Gyldene_Freden_2013a.jpg",
        )

    def test_svenska_tecken_kodas(self):
        self.assertEqual(
            commons.file_page_url("Operakällaren 2009w.jpg"),
            "https://commons.wikimedia.org/wiki/File:Operak%C3%A4llaren_2009w.jpg",
        )

    def test_parenteser_behalls_lasbara(self):
        self.assertIn(
            "panoramio_(61)",
            commons.file_page_url("Djurgården, Östermalm, Stockholm, Sweden - panoramio (61).jpg"),
        )


class Objektnyckel(unittest.TestCase):
    def test_egen_mapp_och_deterministisk(self):
        key = commons.object_key("stockholm", "F-0180-ABC123", "webp")
        self.assertEqual(key, "commons/stockholm/F-0180-ABC123.webp")
        self.assertEqual(key, commons.object_key("stockholm", "F-0180-ABC123", "webp"))

    def test_ligger_inte_bland_gatubilderna(self):
        # Två sorters uppgift med två olika livslängder. Ligger de i samma
        # mapp går de inte att rensa var för sig.
        self.assertFalse(commons.object_key("s", "id", "webp").startswith("gatubilder/"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
