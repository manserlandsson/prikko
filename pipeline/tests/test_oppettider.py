"""Tester för hopparningen mot OSM och tolkningen av opening_hours.

    python3 pipeline/tests/test_oppettider.py

Fallen är inte påhittade. Namnparen är verkliga par ur Stockholm och Uppsala,
och uttrycken är verkliga `opening_hours`-strängar ur våra egna uttag. Det
som prövas hårdast är NÄR VI SKA AVSTÅ: en fellagd öppettid är osynlig för
läsaren och gör att någon står utanför en låst dörr.
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.oppettider import (  # noqa: E402
    MATCHED,
    MISS_AMBIGUOUS,
    MISS_NO_CANDIDATE,
    MISS_NO_COORDINATE,
    MISS_NO_HOURS,
    Poi,
    PoiIndex,
    compile_hours,
    email_of,
    facts_of,
    metres,
    name_tokens,
    names_agree,
    pair,
    parse_opening_hours,
    phone_of,
    pois_from_overpass,
    website_of,
    wikidata_of,
)


def poi(name, lat, lng, hours=None, osm_id=1):
    return Poi("node", osm_id, name, lat, lng, hours)


class Namn(unittest.TestCase):
    def test_bolagsform_stryks(self):
        self.assertEqual(name_tokens("Pizzeria Rossi AB"), ("pizzeria", "rossi"))
        self.assertEqual(name_tokens("Sushi Yama Sverige AB"), ("sushi", "yama"))

    def test_verksamhetsord_behalls_i_namnet(self):
        # Verksamhetsordet skiljer inte ställen åt, men det försvagar heller
        # ingenting att ha kvar det. Det som styr är names_agree.
        self.assertEqual(name_tokens("Pizzeria"), ("pizzeria",))
        self.assertEqual(name_tokens("Pizzeria Milano"), ("pizzeria", "milano"))

    def test_siffror_behalls(self):
        # "Pizzeria 2" och "Pizzeria 4" är olika ställen på samma gata.
        self.assertEqual(name_tokens("Pizzeria 2"), ("pizzeria", "2"))
        self.assertNotEqual(name_tokens("Pizzeria 2"), name_tokens("Pizzeria 4"))

    def test_ensamt_verksamhetsord_parar_aldrig(self):
        # "Pizzeria" inuti "Pizzeria Milano" är formen, inte stället.
        self.assertFalse(names_agree(name_tokens("Pizzeria"), name_tokens("Pizzeria Milano")))

    def test_ensamt_egennamn_far_para(self):
        self.assertTrue(names_agree(name_tokens("Rossi"), name_tokens("Pizzeria Rossi")))

    def test_ensamt_kort_ord_parar_aldrig(self):
        self.assertFalse(names_agree(("ost",), ("ost", "boden")))

    def test_ensamt_ord_maste_vara_huvudordet_i_bada(self):
        # Verkliga fel ur Stockholm. Ordet är ett ortnamn respektive ett
        # gatunamn som båda namnen bär för att de ligger på samma plats, och
        # det är inte det som namnger stället.
        self.assertFalse(names_agree(name_tokens("Livs Södermalm"), name_tokens("ICA Kvantum Södermalm")))
        self.assertFalse(
            names_agree(name_tokens("United Spaces Götgatsbacken"), name_tokens("Götgatsbacken"))
        )

    def test_verksamhetsordet_hoppas_over_nar_huvudordet_soks(self):
        # "Café Gateau" heter Gateau. Ordet "café" står först och säger inget.
        self.assertTrue(names_agree(name_tokens("Café Gateau"), name_tokens("Gateau")))

    def test_kedja_med_butiksnummer_parar_pa_kedjenamnet(self):
        # Kommunens register skriver "Pressbyrån 4450170", skylten "Pressbyrån".
        # Adressen är det som skiljer butikerna åt, och radien bär den.
        self.assertTrue(names_agree(name_tokens("Pressbyrån 4450170"), name_tokens("Pressbyrån")))

    def test_svenska_tecken_far_samma_form(self):
        self.assertEqual(name_tokens("Kött & Bröd"), name_tokens("Kott och Brod"))

    def test_lika_mangder_gar_ihop(self):
        self.assertTrue(names_agree(name_tokens("Café Rosa"), name_tokens("Cafe Rosa")))

    def test_delmangd_pa_tva_ord_gar_ihop(self):
        self.assertTrue(
            names_agree(name_tokens("Sushi Yama Gallerian"), name_tokens("Sushi Yama"))
        )

    def test_olika_namn_gar_aldrig_ihop(self):
        self.assertFalse(names_agree(name_tokens("Pizzeria Rossi"), name_tokens("Pizzeria Milano")))

    def test_tomt_namn_parar_aldrig(self):
        self.assertFalse(names_agree((), ("rossi",)))


class Hopparning(unittest.TestCase):
    def setUp(self):
        self.index = PoiIndex(
            [
                poi("Café Rosa", 59.3300, 18.0600, "Mo-Fr 08:00-18:00", 1),
                poi("Pizzeria Milano", 59.3301, 18.0601, "Mo-Su 11:00-22:00", 2),
                poi("Namnlöst kök", 59.3302, 18.0602, None, 3),
            ]
        )

    def test_traffar_pa_namn_och_narhet(self):
        result = pair(self.index, "Café Rosa AB", 59.3300, 18.0600)
        self.assertEqual(result.reason, MATCHED)
        self.assertEqual(result.poi.osm_id, 1)

    def test_utan_koordinat_ingen_traff(self):
        self.assertEqual(pair(self.index, "Café Rosa", None, None).reason, MISS_NO_COORDINATE)

    def test_narhet_ensam_racker_inte(self):
        # Tio meter från Café Rosa, men heter något annat. Det är exakt det
        # fall som gör ett kvarter på Södermalm obrukbart för avståndsmatchning.
        result = pair(self.index, "Bageriet Vete", 59.3300, 18.0600)
        self.assertEqual(result.reason, MISS_NO_CANDIDATE)

    def test_ratt_namn_men_langt_bort_ger_ingen_traff(self):
        # Drygt två kilometer bort. Samma kedja, annat ställe.
        result = pair(self.index, "Café Rosa", 59.3500, 18.0600)
        self.assertEqual(result.reason, MISS_NO_CANDIDATE)

    def test_traff_utan_oppettid_redovisas_som_egen_orsak(self):
        result = pair(self.index, "Namnlöst kök", 59.3302, 18.0602)
        self.assertEqual(result.reason, MISS_NO_HOURS)

    def test_tva_med_samma_namn_och_olika_tider_faller_bada(self):
        index = PoiIndex(
            [
                poi("Espresso House", 59.3300, 18.0600, "Mo-Fr 07:00-19:00", 10),
                poi("Espresso House", 59.3303, 18.0604, "Mo-Fr 08:00-20:00", 11),
            ]
        )
        self.assertEqual(pair(index, "Espresso House", 59.3301, 18.0601).reason, MISS_AMBIGUOUS)

    def test_tva_med_samma_namn_och_samma_tider_gar_bra(self):
        # Samma ställe kartlagt både som nod och som yta. Vilken vi tar spelar
        # ingen roll: uppgiften är densamma.
        index = PoiIndex(
            [
                poi("Bröd & Salt", 59.3300, 18.0600, "Mo-Fr 07:00-18:00", 20),
                poi("Bröd & Salt", 59.3301, 18.0601, "Mo-Fr 07:00-18:00", 21),
            ]
        )
        self.assertEqual(pair(index, "Bröd & Salt", 59.3300, 18.0600).reason, MATCHED)

    def test_vidare_radie_nar_koordinaten_bara_ar_gatuniva(self):
        # 150 meter: utanför 100 men inom 250. Uppsala och Örebro har
        # geokodade koordinater som kan ligga hos grannporten.
        index = PoiIndex([poi("Café Rosa", 59.3313, 18.0600, "Mo-Fr 08:00-18:00")])
        self.assertEqual(pair(index, "Café Rosa", 59.3300, 18.0600).reason, MISS_NO_CANDIDATE)
        self.assertEqual(
            pair(index, "Café Rosa", 59.3300, 18.0600, approximate=True).reason, MATCHED
        )

    def test_avstand_stammer_pa_hundra_meter(self):
        self.assertAlmostEqual(metres(59.33, 18.06, 59.3309, 18.06), 100, delta=2)

    def test_namnlosa_osm_objekt_kastas(self):
        elements = [
            {"type": "node", "id": 1, "lat": 59.33, "lon": 18.06, "tags": {"amenity": "cafe"}},
            {
                "type": "node",
                "id": 2,
                "lat": 59.33,
                "lon": 18.06,
                "tags": {"amenity": "cafe", "name": "Rosa"},
            },
        ]
        self.assertEqual([p.osm_id for p in pois_from_overpass(elements)], [2])

    def test_ytor_laser_sitt_centrum(self):
        elements = [
            {
                "type": "way",
                "id": 7,
                "center": {"lat": 59.33, "lon": 18.06},
                "tags": {"shop": "bakery", "name": "Vete"},
            }
        ]
        self.assertEqual(pois_from_overpass(elements)[0].lat, 59.33)


class Tolkning(unittest.TestCase):
    def test_enkelt_veckoschema(self):
        h = compile_hours("Mo-Fr 11:00-22:00")
        self.assertEqual(h["week"][0], "660-1320")
        self.assertEqual(h["week"][5], "")  # lördag stängd

    def test_tva_pass_pa_samma_dag(self):
        h = compile_hours("Mo-Fr 11:00-14:00,17:00-22:00")
        self.assertEqual(h["week"][0], "660-840,1020-1320")

    def test_over_midnatt_passerar_1440(self):
        h = compile_hours("Fr-Sa 18:00-02:00")
        self.assertEqual(h["week"][4], "1080-1560")

    def test_dygnet_runt(self):
        h = compile_hours("24/7")
        self.assertEqual(h["week"][3], "0-1440")

    def test_senare_regel_skriver_over_tidigare(self):
        # opening_hours egen semantik: onsdagen blir kortare, inte två pass.
        h = compile_hours("Mo-Su 11:00-22:00; We 11:00-15:00")
        self.assertEqual(h["week"][2], "660-900")
        self.assertEqual(h["week"][1], "660-1320")

    def test_stangd_dag(self):
        h = compile_hours("Mo-Sa 10:00-18:00; Su off")
        self.assertEqual(h["week"][6], "")

    def test_veckoskiftet_viker_runt(self):
        h = compile_hours("Fr-Mo 12:00-20:00")
        self.assertEqual(h["week"][4], "720-1200")  # fredag
        self.assertEqual(h["week"][6], "720-1200")  # söndag
        self.assertEqual(h["week"][0], "720-1200")  # måndag
        self.assertEqual(h["week"][1], "")  # tisdag

    def test_helgdag_stangd(self):
        h = compile_hours("Mo-Su 11:00-22:00; PH off")
        self.assertEqual(h["ph"], "")

    def test_helgdag_med_egen_tid(self):
        h = compile_hours("Mo-Su 11:00-22:00; PH 12:00-16:00")
        self.assertEqual(h["ph"], "720-960")

    def test_komma_som_regelavskiljare(self):
        # 758 av våra 3 913 uttryck skriver reglerna med komma i stället för
        # semikolon. Utan den här formen faller 19,4 procent av datan bort.
        h = compile_hours("Mo-Fr 11:00-21:00, Sa-Su 12:00-21:00")
        self.assertEqual(h["week"][0], "660-1260")
        self.assertEqual(h["week"][5], "720-1260")

    def test_dagslista_med_komma(self):
        h = compile_hours("Mo-Fr 11:00-21:00; Sa,Su 12:00-21:00")
        self.assertEqual(h["week"][5], "720-1260")
        self.assertEqual(h["week"][6], "720-1260")

    def test_helgdag_ihop_med_veckodagar(self):
        h = compile_hours("Mo-Fr 08:00-17:00; Sa-Su,PH off")
        self.assertEqual(h["week"][5], "")
        self.assertEqual(h["ph"], "")

    def test_utan_dagdel_gäller_alla_dagar(self):
        # 76 uttryck skriver bara ett spann. Det betyder varje dag.
        h = compile_hours("07:00-22:00")
        self.assertEqual(h["week"][0], "420-1320")
        self.assertEqual(h["week"][6], "420-1320")

    def test_timmar_over_24_ar_natten_efter(self):
        # "16:00-25:00" står i vår data och betyder klockan ett på natten.
        h = compile_hours("Fr 16:00-25:00")
        self.assertEqual(h["week"][4], "960-1500")

    def test_utan_helgdagsregel_ar_ph_none(self):
        self.assertIsNone(compile_hours("Mo-Fr 09:00-17:00")["ph"])


class UtanforDelmangden(unittest.TestCase):
    """Allt här SKA ge None. En halvtolkad öppettid är värre än ingen."""

    def test_veckonummer(self):
        self.assertIsNone(parse_opening_hours("week 1-20 Mo-Fr 10:00-18:00"))

    def test_datumintervall(self):
        self.assertIsNone(parse_opening_hours("Apr-Sep Mo-Su 10:00-20:00"))

    def test_soluppgang(self):
        self.assertIsNone(parse_opening_hours("Mo-Su sunrise-sunset"))

    def test_ordningstal_pa_veckodag(self):
        self.assertIsNone(parse_opening_hours("Mo[1] 10:00-12:00"))

    def test_oppet_slut(self):
        # "17:00+" säger när det öppnar men inte när det stänger. En sådan
        # rad går inte att svara "öppet nu" med.
        self.assertIsNone(parse_opening_hours("Tu-Sa 17:00+"))

    def test_sasong(self):
        self.assertIsNone(parse_opening_hours("May 13-Sep 06"))

    def test_kommentar(self):
        self.assertIsNone(parse_opening_hours('Mo-Fr 10:00-18:00; Sa "efter överenskommelse"'))

    def test_tomt(self):
        self.assertIsNone(parse_opening_hours(""))

    def test_dag_utan_tid(self):
        self.assertIsNone(parse_opening_hours("Mo-Fr"))

    def test_okand_dag(self):
        self.assertIsNone(parse_opening_hours("Mån-Fre 10:00-18:00"))


class Telefon(unittest.TestCase):
    """Alla värden nedan står ordagrant i våra egna uttag."""

    def test_bada_nycklarna_lases(self):
        # 948 hopparade bär `phone`, 1 055 bär `contact:phone`. Att läsa bara
        # den ena hade kastat ungefär halva skörden.
        self.assertEqual(phone_of({"phone": "+46841005909"}), "+46841005909")
        self.assertEqual(phone_of({"contact:phone": "+46841005909"}), "+46841005909")

    def test_mellanslag_stryks(self):
        # "+46 8 551 228 12" och "+468551228 12" är samma nummer. Lagras de
        # olika blir `tel:`-länken olika för samma abonnent.
        self.assertEqual(phone_of({"phone": "+46 8 551 228 12"}), "+46855122812")
        self.assertEqual(phone_of({"phone": "+46 70 849 11 81"}), "+46708491181")

    def test_forsta_numret_i_en_lista(self):
        self.assertEqual(phone_of({"phone": "+46812345;+46812346"}), "+46812345")

    def test_url_i_telefonfaltet_kastas(self):
        # Står så på en punkt i Stockholm. En `tel:`-länk till en webbadress
        # ringer ingen alls.
        self.assertIsNone(phone_of({"phone": "https://91matbar.se/"}))

    def test_nummer_utan_landskod_kastas(self):
        # Hellre inget nummer än ett vi gissat landskoden till.
        self.assertIsNone(phone_of({"phone": "08-123 45 67"}))
        self.assertIsNone(phone_of({"phone": "+4712345678"}))


class Webbplats(unittest.TestCase):
    def test_bada_nycklarna_lases(self):
        self.assertEqual(website_of({"website": "https://a.se"}), "https://a.se")
        self.assertEqual(website_of({"contact:website": "https://a.se"}), "https://a.se")

    def test_http_behalls(self):
        # 232 av 2 374 är http. De fungerar, och att skriva om dem till https
        # vore en gissning om vad värden svarar på.
        self.assertEqual(website_of({"website": "http://www.7-eleven.se/"}), "http://www.7-eleven.se/")

    def test_trasiga_adresser_kastas(self):
        # Fyra verkliga fall av 2 374.
        self.assertIsNone(website_of({"website": "www.subway.se"}))
        self.assertIsNone(website_of({"website": "Japanskatorget.com"}))
        self.assertIsNone(website_of({"website": "htttp://heylucie.se"}))


class Epost(unittest.TestCase):
    def test_gemener(self):
        self.assertEqual(email_of({"email": "Info@Allegrine.se"}), "info@allegrine.se")

    def test_bada_nycklarna(self):
        self.assertEqual(email_of({"contact:email": "a@b.se"}), "a@b.se")

    def test_fritext_kastas(self):
        self.assertIsNone(email_of({"email": "se hemsidan"}))
        self.assertIsNone(email_of({"email": "https://a.se"}))


class Egenskaper(unittest.TestCase):
    def test_nej_ar_ett_besked(self):
        # 200 av 883 uteserveringar är `no`. "Ingen uteservering" är en
        # uppgift läsaren kan använda, inte en lucka.
        self.assertEqual(facts_of({"outdoor_seating": "no"})["outdoor"], "no")

    def test_limited_och_only_avrundas_inte(self):
        # "Delvis tillgänglig" är inte ja, och "endast avhämtning" är inte
        # samma sak som att avhämtning finns.
        self.assertEqual(facts_of({"wheelchair": "limited"})["wheelchair"], "limited")
        self.assertEqual(facts_of({"takeaway": "only"})["takeaway"], "only")

    def test_oversatta_varden_kastas(self):
        # 22 av 883 uteserveringar bär `sidewalk`, `rooftop` eller `terrace`,
        # och en `smoking` bär "Nein". En oöversatt kod i gränssnittet är
        # sämre än ingen rad alls.
        self.assertNotIn("outdoor", facts_of({"outdoor_seating": "rooftop"}))
        self.assertNotIn("smoking", facts_of({"smoking": "Nein"}))

    def test_kok_blir_uppraikning(self):
        self.assertEqual(facts_of({"cuisine": "kebab;pizza"})["cuisine"], "kebab,pizza")

    def test_kosthallning_bara_det_som_erbjuds(self):
        facts = facts_of({"diet:vegan": "yes", "diet:meat": "yes", "diet:gluten_free": "no"})
        self.assertEqual(facts["diet"], "vegan")

    def test_korten_slas_ihop(self):
        # OSM delar upp korten i sex nycklar; för den som står i dörren är
        # det ett enda besked.
        facts = facts_of({"payment:visa": "yes", "payment:mastercard": "yes"})
        self.assertEqual(facts["payment"], "cards")

    def test_kontanter_nekas_uttryckligen(self):
        self.assertEqual(facts_of({"payment:cash": "no"})["payment"], "nocash")

    def test_tomma_taggar_ger_inga_egenskaper(self):
        self.assertEqual(facts_of({"name": "Rossi", "amenity": "restaurant"}), {})


class Wikidataid(unittest.TestCase):
    """Det farligaste provet i filen, för felet ser rätt ut.

    `brand:wikidata` står på 762 av de 3 927 hopparade och `wikidata` på 33.
    Läses den förra får 762 verksamheter kedjans bild i stället för sin egen,
    och ingenting i kedjan därefter kan upptäcka det: id:t finns, objektet
    finns, bilden finns. Se docs/37_osm_taggar.md §5.3.
    """

    def test_stallets_id_lases(self):
        self.assertEqual(wikidata_of({"wikidata": "Q1145843"}), "Q1145843")

    def test_kedjans_id_lases_aldrig(self):
        self.assertIsNone(wikidata_of({"brand:wikidata": "Q177054"}))

    def test_kedjans_id_bredvid_stallets_stor_inte(self):
        tags = {"wikidata": "Q1145843", "brand:wikidata": "Q177054"}
        self.assertEqual(wikidata_of(tags), "Q1145843")

    def test_fel_form_kastas(self):
        # Ett värde som inte är ett objekt-id ska aldrig skickas till
        # Wikidata. Svaret blir antingen tomt eller ett annat objekt.
        for value in ("Q0", "P18", "1145843", "q1145843", "Q1145843;Q2", ""):
            self.assertIsNone(wikidata_of({"wikidata": value}), value)

    def test_utan_tagg(self):
        self.assertIsNone(wikidata_of({"name": "Riche"}))


class Uttag(unittest.TestCase):
    def test_taggarna_foljer_med_ur_overpass(self):
        # Overpass-frågan hämtade HELA taggmängden redan innan, se
        # `overpass_query`. Fälten kostar alltså inga nya anrop.
        [poi] = pois_from_overpass(
            [
                {
                    "type": "node",
                    "id": 7,
                    "lat": 59.3,
                    "lon": 18.07,
                    "tags": {
                        "name": "Allegrine",
                        "contact:phone": "+46841005909",
                        "contact:website": "https://allegrine.se",
                        "email": "info@allegrine.se",
                        "opening_hours": "Mo-Th 11:30-23:00",
                        "outdoor_seating": "yes",
                        "wikidata": "Q1145843",
                        "brand:wikidata": "Q177054",
                    },
                }
            ]
        )
        self.assertEqual(poi.phone, "+46841005909")
        self.assertEqual(poi.website, "https://allegrine.se")
        self.assertEqual(poi.email, "info@allegrine.se")
        self.assertEqual(poi.facts["outdoor"], "yes")
        self.assertEqual(poi.wikidata, "Q1145843")


if __name__ == "__main__":
    unittest.main(verbosity=2)
