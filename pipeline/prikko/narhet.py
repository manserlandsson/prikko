"""Närhet: avstånd till närmaste hållplats och antal parkeringar omkring.

Modulen är ren på samma sätt som prikko/oppettider.py: den känner till
taggar, koordinater och avstånd, inte var datan kommer ifrån och inte var den
ska skrivas. Nätet och filerna ligger i pipeline/narhet.py.

VAD TALEN BETYDER, OCH VAD DE INTE BETYDER
------------------------------------------
Avståndet här är FÅGELVÄGEN och ingenting annat. Åttio meter fågelvägen kan
vara fyrahundra runt ett kvarter, över en järnväg eller längs en kaj. Vi
räknar inte gångavstånd, och skälet är att gångavstånd kräver en ruttmotor
över hela Sverige som körs vid varje bygge; se docs/38_ta_mig_hit.md §3 för
vad det hade kostat och varför det inte gick. Alltså MÅSTE ordet fågelvägen
stå där talet visas. Ett tal utan det ordet är ett påstående vi inte kan
stå för.

Två följder av samma princip:

1. AVSTÅNDET AVRUNDAS TILL NÄRMASTE TIOTAL METER. Vår egen koordinat är i
   1 394 fall härledd ur adressen och ligger på fastigheten snarare än i
   dörren, och OSM:s hållplatsnod är stolpen och inte plattformskanten.
   "83 m" påstår en skärpa som ingen av de två sidorna har.
2. VERKSAMHETER MED `geoPrecision: approximate` FÅR INGET TAL ALLS. Den
   koordinaten kan ligga hos grannporten, vilket är just varför hopparningen
   i docs/33 §4 vidgar sin radie till 250 meter för dem. Ett avstånd på
   tiotals meter räknat från en punkt med hundratals meters fel är en
   uppfinning. Det gäller 237 verksamheter, 158 i Uppsala och 79 i Örebro.

PARKERINGEN RÄKNAS, PLATSERNA RÄKNAS INTE
-----------------------------------------
`capacity` finns på 9,2 procent av parkeringarna i Kristinehamns uttag. Att
summera platser över de parkeringar som råkar bära ett tal ger en siffra som
ser fullständig ut och inte är det: "142 platser" när nio av tio parkeringar
inte är räknade alls. Vi skriver antalet PARKERINGAR och avståndet till den
närmaste, två tal vi kan stå för var för sig.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

from .oppettider import metres

# ---------------------------------------------------------------------------
# Vilka OSM-objekt som är hållplatser
# ---------------------------------------------------------------------------
#
# OSM kartlägger en och samma hållplats på flera sätt samtidigt: stolpen som
# `highway=bus_stop`, plattformen som `public_transport=platform`, och punkten
# på spåret som `public_transport=stop_position`. I Kristinehamns uttag är 90
# noder bus_stop och 101 plattformar, av 180 objekt sammanlagt, alltså är
# överlappet stort.
#
# `stop_position` hämtas AVSIKTLIGT INTE. Den ligger mitt i vägbanan eller på
# spåret, alltså på en punkt ingen människa står på, och den skulle systematiskt
# ge kortare avstånd än plattformen man faktiskt går till.
#
# Dubbelkartläggningen behöver inte städas bort, och det är värt att säga
# varför: vi RÄKNAR aldrig hållplatser, vi tar den närmaste. Två objekt som är
# samma hållplats ger samma svar, och vilket av dem som vinner spelar ingen
# roll. Hade vi skrivit "4 hållplatser inom 300 m" hade dubbletterna gjort det
# talet falskt, och det är ett av skälen till att den raden inte finns.


@dataclass(frozen=True)
class Stop:
    """En hållplats ur OSM."""

    kind: str
    osm_id: int
    lat: float
    lng: float
    #: Kan vara None. En namnlös hållplats är fortfarande en hållplats, och
    #: avståndet till den är lika sant. 86 av 180 objekt i Kristinehamns
    #: uttag saknar namn, nästan alla plattformar till namngivna stolpar.
    name: Optional[str]
    #: bus, tram, train, subway eller ferry. Aldrig tomt: ett objekt som inte
    #: går att slå fast trafikslag för blir aldrig en Stop, se `stops_from_overpass`.
    mode: str

    @property
    def ref(self) -> str:
        return f"{self.kind}/{self.osm_id}"


def stop_mode(tags: Dict[str, str]) -> Optional[str]:
    """Trafikslaget, eller None om objektet inte är en hållplats.

    `public_transport=platform` är den nyare, trafikslagslösa formen, och den
    godtas BARA när något ANNAT på objektet säger vilket trafikslag det är:
    `bus=yes`, `tram=yes`, `railway=*` och de andra nedan. En namnlös
    plattform utan trafikslag kan vara vad som helst, till exempel en
    taxificka, och en "hållplats" som inte är en hållplats är värre än ingen
    rad alls. En av Kristinehamns 180 kandidater föll på det kravet.

    Ordningen är inte godtycklig. Tunnelbana och spårväg prövas före tåg,
    eftersom en tunnelbanestation i OSM är `railway=station` PLUS
    `station=subway`: prövas `railway` först blir varje tunnelbanestation
    ett tåg.
    """
    if (tags.get("station") or "").strip() == "subway":
        return "subway"
    if tags.get("railway") == "tram_stop" or tags.get("tram") == "yes":
        return "tram"
    if tags.get("railway") in ("station", "halt"):
        # `subway=yes` utan `station=subway` förekommer också.
        return "subway" if tags.get("subway") == "yes" else "train"
    if tags.get("amenity") == "ferry_terminal" or tags.get("ferry") == "yes":
        return "ferry"
    if tags.get("highway") == "bus_stop" or tags.get("bus") == "yes":
        return "bus"
    if tags.get("train") == "yes":
        return "train"
    if tags.get("light_rail") == "yes":
        return "tram"
    if tags.get("trolleybus") == "yes":
        return "bus"
    return None


def stops_from_overpass(elements: Iterable[dict]) -> List[Stop]:
    """Plocka hållplatserna ur Overpass-svaret.

    Ett objekt utan slagbart trafikslag kastas. Det är avsiktligt strängare än
    att gissa "buss": en rad som säger busshållplats om en taxificka är ett
    fel läsaren inte har någon möjlighet att upptäcka.
    """
    out: List[Stop] = []
    for element in elements:
        tags = element.get("tags") or {}
        if tags.get("amenity") == "parking":
            continue
        mode = stop_mode(tags)
        if mode is None:
            continue
        centre = element.get("center") or element
        lat, lng = centre.get("lat"), centre.get("lon")
        if lat is None or lng is None:
            continue
        name = (tags.get("name") or "").strip() or None
        out.append(
            Stop(
                kind=element.get("type", "node"),
                osm_id=int(element["id"]),
                lat=float(lat),
                lng=float(lng),
                name=name,
                mode=mode,
            )
        )
    return out


# ---------------------------------------------------------------------------
# Vilka parkeringar som räknas
# ---------------------------------------------------------------------------

#: `access`-värden som betyder att den som kommer utifrån INTE får ställa sig
#: där. En parkering bakom en bom är ingen parkering för den som läser sidan,
#: och att räkna med den gör talet större utan att göra det sannare.
PARKING_ACCESS_STANGD = {"private", "no", "permit", "military", "employees"}


@dataclass(frozen=True)
class Parking:
    """En parkering ur OSM."""

    kind: str
    osm_id: int
    lat: float
    lng: float

    @property
    def ref(self) -> str:
        return f"{self.kind}/{self.osm_id}"


def parkings_from_overpass(elements: Iterable[dict]) -> List[Parking]:
    """Plocka parkeringarna ur Overpass-svaret.

    `capacity`, `fee` och `parking` läses AVSIKTLIGT INTE in. Mätt i
    Kristinehamns uttag bär 16 av 174 parkeringar `capacity`, 22 bär `fee` och
    62 bär `parking`. Alla tre är för glesa för att säga något om mängden, och
    ett fält vi lagrar men inte vågar visa är bara rader i en datafil.
    """
    out: List[Parking] = []
    for element in elements:
        tags = element.get("tags") or {}
        if tags.get("amenity") != "parking":
            continue
        if (tags.get("access") or "").strip().lower() in PARKING_ACCESS_STANGD:
            continue
        centre = element.get("center") or element
        lat, lng = centre.get("lat"), centre.get("lon")
        if lat is None or lng is None:
            continue
        out.append(
            Parking(
                kind=element.get("type", "node"),
                osm_id=int(element["id"]),
                lat=float(lat),
                lng=float(lng),
            )
        )
    return out


# ---------------------------------------------------------------------------
# Rutnätsindex
# ---------------------------------------------------------------------------


class Grid:
    """Rutnätsindex över punkter med lat och lng.

    Samma skäl som PoiIndex i oppettider.py: ett svep över alla punkter per
    verksamhet hade blivit 8 520 × 4 000 i Stockholm.

    SVEPET RÄKNAS UT UR RADIEN och står inte som en konstant. PoiIndex har en
    fast `span = 2`, vilket räcker där eftersom den bara frågar om 100 och 250
    meter. Här frågar mätläget om upp till 1 200 meter, och en fast ruta hade
    då tyst svarat med FÖR FÅ träffar: rutan är cirka 557 m i nord-syd men
    bara 287 m i öst-väst på 59 graders latitud, alltså hade tre rutor åt
    varje håll räckt till 861 meter österut och inte längre. Ett index som
    missar punkter ger ett mätvärde som ser ut som en täckningslucka men är
    en bugg, och det är precis den sortens fel som inte syns.
    """

    CELL_DEG = 0.005
    #: Meter per grad latitud. Longitudgraden krymper med cos(lat).
    METRES_PER_DEG = 111320.0

    def __init__(self, points: Sequence) -> None:
        self.points = list(points)
        self.cells: Dict[Tuple[int, int], List] = {}
        for point in self.points:
            self.cells.setdefault(self._cell(point.lat, point.lng), []).append(point)

    def _cell(self, lat: float, lng: float) -> Tuple[int, int]:
        return (int(lat / self.CELL_DEG), int(lng / self.CELL_DEG))

    def near(self, lat: float, lng: float, radius: float) -> List[Tuple[object, float]]:
        """Punkterna inom radien, närmast först."""
        row, col = self._cell(lat, lng)
        cell_ns = self.CELL_DEG * self.METRES_PER_DEG
        cell_ew = max(cell_ns * math.cos(math.radians(lat)), 1.0)
        span_rows = int(math.ceil(radius / cell_ns))
        span_cols = int(math.ceil(radius / cell_ew))
        found: List[Tuple[object, float]] = []
        for dr in range(-span_rows, span_rows + 1):
            for dc in range(-span_cols, span_cols + 1):
                for point in self.cells.get((row + dr, col + dc), ()):
                    d = metres(lat, lng, point.lat, point.lng)
                    if d <= radius:
                        found.append((point, d))
        found.sort(key=lambda pair: pair[1])
        return found


# ---------------------------------------------------------------------------
# Radierna
# ---------------------------------------------------------------------------

#: Så långt bort en hållplats får ligga och ändå vara "närmaste hållplats".
#: 500 meter fågelvägen är runt 600 till 800 meter att gå, alltså en kvart för
#: den som inte skyndar sig. Bortom det svarar talet inte längre på frågan
#: "kan jag åka kollektivt hit", det svarar "det finns en hållplats i
#: kommunen", och det gör det alltid.
STOP_RADIUS_M = 500.0

#: Så långt bort en parkering får ligga och ändå räknas. 200 meter är en
#: gångväg på ett par minuter även när kvarteret tvingar en runt.
PARKING_RADIUS_M = 200.0

#: Ett objekt kan ligga närmare i sig men bära ett sämre namn än sin egen
#: tvilling; se dubbelkartläggningen ovan. Är den närmaste hållplatsen
#: NAMNLÖS får en namngiven inom det här avståndet ta över, för på 25 meters
#: håll är det samma hållplats och inte en annan.
STOP_NAME_SLACK_M = 25.0

#: Avståndet avrundas hit. Se modulkommentaren: varken vår koordinat eller
#: OSM:s nod är skarpare än så.
ROUND_TO_M = 10


def round_metres(value: float) -> int:
    """Avstånd i hela tiotal meter, alltid minst tio.

    Noll är inget avstånd utan ett påstående om att man står inuti
    hållplatsen. Tio är det minsta vi skriver.
    """
    return max(ROUND_TO_M, int(round(value / ROUND_TO_M)) * ROUND_TO_M)


def nearest_stop(grid: Grid, lat: float, lng: float) -> Optional[Tuple[Stop, int]]:
    """Närmaste hållplats och dess avstånd i hela tiotal meter, eller None."""
    found = grid.near(lat, lng, STOP_RADIUS_M)
    if not found:
        return None
    stop, distance = found[0]  # type: ignore[assignment]
    if stop.name is None:
        # Låna namnet av tvillingen. Se STOP_NAME_SLACK_M.
        for other, other_distance in found:
            if other.name and other_distance <= distance + STOP_NAME_SLACK_M:
                stop, distance = other, other_distance
                break
    return stop, round_metres(distance)


def parkings_near(grid: Grid, lat: float, lng: float) -> Optional[Tuple[int, int]]:
    """Antal parkeringar inom radien och avståndet till den närmaste.

    None när det inte finns någon. Noll parkeringar skrivs ALDRIG ut som en
    nolla: "0 parkeringar inom 200 m" är ett påstående om att det inte finns
    några, och det vi vet är bara att OSM inte har kartlagt några.
    """
    found = grid.near(lat, lng, PARKING_RADIUS_M)
    if not found:
        return None
    return len(found), round_metres(found[0][1])


# ---------------------------------------------------------------------------
# Formen i datafilen
# ---------------------------------------------------------------------------
#
# Två strängar och inte två objekt, och det är ett mätt val. Datafilerna
# skrivs med indent=1, alltså kostar varje nyckel en RAD per verksamhet. Ett
# nästlat `narhet`-objekt med namn, slag, avstånd, antal och datum hade blivit
# sju rader gånger nio tusen verksamheter, alltså över 60 000 rader, och gjort
# varje framtida diff oläsbar. Samma dom som veckoschemat fick i docs/33 §8.
#
# Datumet står INTE här utan en gång per fil, i `openstreetmap`-blocket. Det är
# samma datum för hela uttaget, och nio tusen kopior av det är nio tusen rader
# som inte säger något nytt.
#
#   "stop": "Stadshuset|bus|80"
#   "parking": "3|40"
#
# Uppackningen är en `split` i site/src/lib/narhet.ts.

#: Namn kan innehålla komma ("Centralstationen, läge B") men aldrig lodstreck.
FALT = "|"


def pack_stop(stop: Stop, distance: int) -> str:
    name = (stop.name or "").replace(FALT, " ").strip()
    return FALT.join((name, stop.mode, str(distance)))


def pack_parking(count: int, nearest: int) -> str:
    return FALT.join((str(count), str(nearest)))
