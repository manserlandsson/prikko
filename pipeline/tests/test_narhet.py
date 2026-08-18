"""Prov för närheten: hållplatser, parkeringar, rutnät och avrundning.

    python3 pipeline/tests/test_narhet.py

Taggmängderna är inte påhittade. De är verkliga kombinationer ur våra egna
Overpass-uttag, och det som prövas hårdast är NÄR VI SKA AVSTÅ: en rad som
säger busshållplats om en taxificka är osynlig för läsaren, precis som en
fellagd öppettid är det.
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from prikko.narhet import (  # noqa: E402
    PARKING_RADIUS_M,
    STOP_RADIUS_M,
    Grid,
    Parking,
    Stop,
    nearest_stop,
    pack_parking,
    pack_stop,
    parkings_from_overpass,
    parkings_near,
    round_metres,
    stop_mode,
    stops_from_overpass,
)


def node(osm_id, lat, lon, **tags):
    return {"type": "node", "id": osm_id, "lat": lat, "lon": lon, "tags": tags}


def way(osm_id, lat, lon, **tags):
    """En yta med centrum, alltså formen `out center` ger."""
    return {"type": "way", "id": osm_id, "center": {"lat": lat, "lon": lon}, "tags": tags}


class Trafikslag(unittest.TestCase):
    def test_busshallplats(self):
        self.assertEqual(stop_mode({"highway": "bus_stop"}), "bus")

    def test_tunnelbana_slar_tag(self):
        """`railway=station` PLUS `station=subway` är en tunnelbanestation.

        Prövas `railway` först blir varje tunnelbanestation i Stockholm ett
        tåg, och "Tågstation Medborgarplatsen" är fel på ett sätt läsaren
        skulle skratta åt.
        """
        self.assertEqual(
            stop_mode({"railway": "station", "station": "subway", "name": "Slussen"}),
            "subway",
        )

    def test_tunnelbana_utan_station_taggen(self):
        self.assertEqual(stop_mode({"railway": "station", "subway": "yes"}), "subway")

    def test_tagstation(self):
        self.assertEqual(stop_mode({"railway": "station", "train": "yes"}), "train")

    def test_sparvagn(self):
        self.assertEqual(stop_mode({"railway": "tram_stop"}), "tram")

    def test_farjelage(self):
        self.assertEqual(stop_mode({"amenity": "ferry_terminal"}), "ferry")

    def test_plattform_med_trafikslag(self):
        self.assertEqual(stop_mode({"public_transport": "platform", "bus": "yes"}), "bus")

    def test_plattform_utan_trafikslag_ar_ingen_hallplats(self):
        """Det viktigaste provet i klassen.

        En bar `public_transport=platform` kan vara en taxificka eller en
        plattform till något vi inte visar. Att gissa "buss" hade gett en rad
        som ser exakt ut som en riktig och inte går att avslöja.
        """
        self.assertIsNone(stop_mode({"public_transport": "platform"}))
        self.assertIsNone(stop_mode({"public_transport": "platform", "name": "Läge C"}))

    def test_parkering_ar_ingen_hallplats(self):
        self.assertIsNone(stop_mode({"amenity": "parking"}))


class Uttaget(unittest.TestCase):
    def test_plockar_bada_sorterna_ur_samma_svar(self):
        elements = [
            node(1, 59.33, 18.06, highway="bus_stop", name="Stadshuset"),
            node(2, 59.33, 18.06, amenity="parking"),
            node(3, 59.33, 18.06, public_transport="platform"),
        ]
        self.assertEqual(len(stops_from_overpass(elements)), 1)
        self.assertEqual(len(parkings_from_overpass(elements)), 1)

    def test_yta_anvander_centrum(self):
        stops = stops_from_overpass([way(9, 59.4, 18.1, railway="station", train="yes")])
        self.assertEqual((stops[0].lat, stops[0].lng), (59.4, 18.1))
        self.assertEqual(stops[0].ref, "way/9")

    def test_namnlos_hallplats_behalls(self):
        """Avståndet till en namnlös hållplats är lika sant som till en namngiven.

        86 av 180 objekt i Kristinehamns uttag saknar namn, nästan alla
        plattformar till namngivna stolpar. Att kasta dem hade halverat
        skörden utan att göra något tal sannare.
        """
        stops = stops_from_overpass([node(1, 59.3, 18.0, highway="bus_stop")])
        self.assertEqual(len(stops), 1)
        self.assertIsNone(stops[0].name)

    def test_stangd_parkering_raknas_inte(self):
        """En parkering bakom en bom är ingen parkering för den som läser sidan."""
        for access in ("private", "no", "permit", "military", "employees"):
            with self.subTest(access=access):
                self.assertEqual(
                    parkings_from_overpass([node(1, 59.3, 18.0, amenity="parking", access=access)]),
                    [],
                )

    def test_oppen_och_otaggad_parkering_raknas(self):
        """134 av 174 parkeringar i Kristinehamns uttag saknar `access` helt.

        Att kräva ett uttryckligt `access=yes` hade kastat tre fjärdedelar av
        beståndet på en tagg som mappare sällan sätter.
        """
        for access in (None, "yes", "customers", "permissive", "destination"):
            with self.subTest(access=access):
                tags = {"amenity": "parking"}
                if access:
                    tags["access"] = access
                self.assertEqual(len(parkings_from_overpass([node(1, 59.3, 18.0, **tags)])), 1)


class Avrundning(unittest.TestCase):
    def test_hela_tiotal(self):
        self.assertEqual(round_metres(83.4), 80)
        self.assertEqual(round_metres(85.0), 80)
        self.assertEqual(round_metres(86.0), 90)

    def test_aldrig_noll(self):
        """Noll är inget avstånd utan ett påstående om att man står inuti den."""
        self.assertEqual(round_metres(0.0), 10)
        self.assertEqual(round_metres(3.2), 10)


class Rutnatet(unittest.TestCase):
    """Indexet får ALDRIG missa en punkt inom radien.

    En bortmissad punkt ser ut som en täckningslucka och är en bugg, och det
    är precis den sortens fel som ingen upptäcker. PoiIndex i oppettider.py
    har ett fast svep på två rutor, vilket räcker för dess 250 meter men inte
    för de 1 200 meter mätläget frågar om: rutan är bara cirka 287 m i
    öst-väst på 59 graders latitud.
    """

    def test_sveper_langre_an_en_ruta_i_ostvast(self):
        mitt = (59.33, 18.06)
        # Ungefär 900 meter rakt österut på den latituden.
        oster = (59.33, 18.06 + 900 / (111320 * 0.5150))
        grid = Grid([Parking("node", 1, *oster)])
        self.assertEqual(len(grid.near(*mitt, 1000)), 1)
        self.assertEqual(len(grid.near(*mitt, 800)), 0)

    def test_narmast_forst(self):
        grid = Grid(
            [
                Parking("node", 1, 59.3320, 18.06),
                Parking("node", 2, 59.3301, 18.06),
            ]
        )
        found = grid.near(59.33, 18.06, 500)
        self.assertEqual([p.osm_id for p, _ in found], [2, 1])


class NarmasteHallplats(unittest.TestCase):
    def test_utanfor_radien_ger_ingenting(self):
        """Bortom radien svarar talet inte längre på frågan.

        "Närmaste hållplats: 3,2 km" säger bara att det finns bussar i
        kommunen, vilket det alltid gör.
        """
        langt_bort = 59.33 + (STOP_RADIUS_M + 200) / 111320
        grid = Grid([Stop("node", 1, langt_bort, 18.06, "Fjärran", "bus")])
        self.assertIsNone(nearest_stop(grid, 59.33, 18.06))

    def test_lanar_namnet_av_sin_tvilling(self):
        """Samma hållplats kartlagd två gånger: stolpen har namnet, plattformen inte.

        Plattformen ligger några meter närmare. Utan namnlånet hade raden
        blivit "Busshållplats, 80 m" fast OSM vet att den heter Stadshuset.
        """
        plattform = Stop("way", 1, 59.3300, 18.06, None, "bus")
        stolpe = Stop("node", 2, 59.33012, 18.06, "Stadshuset", "bus")
        stop, _ = nearest_stop(Grid([plattform, stolpe]), 59.3299, 18.06)
        self.assertEqual(stop.name, "Stadshuset")

    def test_lanar_inte_over_hela_kvarteret(self):
        """Namnlånet gäller 25 meter och inte mer.

        En namngiven hållplats tvåhundra meter bort är en ANNAN hållplats, och
        att sätta dess namn på den närmaste hade varit en ren felskyltning.
        """
        nara = Stop("node", 1, 59.3300, 18.06, None, "bus")
        fjarran = Stop("node", 2, 59.3300 + 200 / 111320, 18.06, "Torget", "bus")
        stop, _ = nearest_stop(Grid([nara, fjarran]), 59.3300, 18.06)
        self.assertIsNone(stop.name)


class Parkeringar(unittest.TestCase):
    def test_raknar_inom_radien_och_inte_utanfor(self):
        inne = [
            Parking("node", i, 59.33 + (50 * i) / 111320, 18.06)
            for i in range(1, 4)  # 50, 100 och 150 meter
        ]
        ute = Parking("node", 9, 59.33 + (PARKING_RADIUS_M + 100) / 111320, 18.06)
        count, narmast = parkings_near(Grid(inne + [ute]), 59.33, 18.06)
        self.assertEqual(count, 3)
        self.assertEqual(narmast, 50)

    def test_ingen_parkering_ger_none_och_inte_noll(self):
        """Noll skrivs ALDRIG ut.

        "0 parkeringar inom 200 m" är ett påstående om att det inte finns
        några. Det vi vet är bara att OpenStreetMap inte kartlagt några.
        """
        self.assertIsNone(parkings_near(Grid([]), 59.33, 18.06))


class Packningen(unittest.TestCase):
    def test_hallplats(self):
        self.assertEqual(
            pack_stop(Stop("node", 1, 59.3, 18.0, "Stadshuset", "bus"), 80),
            "Stadshuset|bus|80",
        )

    def test_namnlos_hallplats_lamnar_faltet_tomt(self):
        self.assertEqual(pack_stop(Stop("node", 1, 59.3, 18.0, None, "bus"), 80), "|bus|80")

    def test_lodstreck_i_namnet_kan_inte_bryta_formen(self):
        """Namnet är någon annans fritext och får aldrig kunna dela fältet.

        Inget svenskt hållplatsnamn bär lodstreck i dag, men formen ska tåla
        att ett gör det i morgon utan att raden blir oläsbar.
        """
        packad = pack_stop(Stop("node", 1, 59.3, 18.0, "A|B", "bus"), 80)
        self.assertEqual(len(packad.split("|")), 3)

    def test_parkering(self):
        self.assertEqual(pack_parking(3, 40), "3|40")


if __name__ == "__main__":
    unittest.main(verbosity=2)
