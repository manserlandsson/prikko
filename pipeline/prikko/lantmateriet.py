"""Lantmäteriets belägenhetsadresser som geokodningskälla.

Uppsala och Örebro publicerar adress men ingen koordinat. Fram till nu har
`geocode.py` härlett punkten ur OpenStreetMap, som är ojämn: den saknar hus
och gissar därför ibland på grannporten. Belägenhetsadressregistret är
Sveriges officiella adressregister och saknar de luckorna.

PRODUKTEN
---------
Belägenhetsadress Nedladdning, vektor (produktnummer 50700601), version
2025.02, i Geotorget. Verifierat på geotorget.lantmateriet.se 2026-08-05:

    Avgift        Nej
    Villkor       Användningsvillkor för värdefulla datamängder som
                  innehåller personuppgifter
    Juridisk prövning  Ja
    Åtkomst       STAC-API, https://api.lantmateriet.se/stac-vektor/v1
    Format        GeoPackage, en zip-fil per kommun
    Filnamn       belagenhetsadresser_kn<kommunkod>.gpkg
    Urval         kommun
    Koordinater   SWEREF 99 TM (EPSG 3006), höjd i RH 2000

STAC-katalogen anger licensen som CC-BY-4.0 på kollektionen
`belagenhetsadresser`, och katalogens egen beskrivning tillägger att
användningen prövas juridiskt enligt fastighetsregisterlagen och GDPR och
att särskilda användningsvillkor då måste godkännas. Registret innehåller
personuppgifter: en belägenhetsadress är någons bostad.

DÄRFÖR LAGRAR VI INTE REGISTRET
-------------------------------
Vi sparar bara koordinaten för de verksamheter vi redan publicerar, aldrig
kommunens adressregister i sin helhet. GeoPackage-filen är arbetsmaterial
och ligger i data/interim/, utanför versionshanteringen — samma hantering
som OSM-extrakten. Attributionen hör hemma på kallor.astro: "© Lantmäteriet"
med länk till CC BY 4.0.

KOORDINATSYSTEM
---------------
EPSG 3006 är SWEREF 99 TM, och prikko/geo.py räknar redan om den. Att den
duger är inte antaget utan kontrollerat mot Lantmäteriets egna tal: varje
STAC-post bär både `proj:bbox` i SWEREF och `bbox` i WGS84, och vår transform
återger deras WGS84-hörn på tionde decimalen. Testet ligger i
tests/test_lantmateriet.py och använder Borgholms och Luleås faktiska
värden. Alltså inget behov av pyproj, som hade dragit in ett C-bibliotek i
en pipeline som annars kör i en tom container.

VAD VI LÄSER UR FILEN
---------------------
Skiktet `belagenhetsadress` med punktgeometri. Adressen sätts samman av
`adressomrade_faststalltnamn` (gatan, eller byns namn utanför tätort),
`adressplatsnummer` och `bokstavstillagg`. Ett gårdsadressområde har
dessutom `gardsadressomrade_faststalltnamn`, och båda namnen indexeras:
kommunernas adressfält skiljer inte på gata, by och gård.

Adresser med `statusforbelagenhetsadress = Reserverad` hoppas över. En
reserverad adress är beslutad men ännu inte i bruk, och en verksamhet kan
inte ligga på den.
"""

from __future__ import annotations

import json
import sqlite3
import struct
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterator, List, Optional, Tuple

from .geo import SWEREF99_TM, looks_like_sweden, sweref99_to_wgs84
from .geocode import SOURCE_LANTMATERIET, AddressIndex, Municipality

#: STAC-katalogen. Öppen att läsa utan inloggning; nedladdningen bakom
#: assets href kräver behörighet. Se fetch_belagenhetsadresser.py.
STAC_ROOT = "https://api.lantmateriet.se/stac-vektor/v1"
STAC_COLLECTION = "belagenhetsadresser"

#: SWEREF 99 TM. Ligger som `proj:epsg` på varje STAC-post och kontrolleras
#: vid inläsning: en fil i något annat system ska stoppa körningen, inte
#: tolkas med fel formler.
EPSG_SWEREF99_TM = 3006

#: Beslutad men ännu inte ibruktagen adress.
STATUS_RESERVED = "reserverad"

#: Marginal på kommunens egen utsträckning innan en träff underkänns.
#: Kommungränsen i STAC-posten är adressernas omslutande rektangel, alltså
#: redan snäv. Marginalen finns för avrundning, inte för att vara generös.
BOUNDS_MARGIN_KM = 2.0


@dataclass(frozen=True)
class Row:
    """En belägenhetsadress som den står i GeoPackage-filen."""

    street: str
    number: int
    letter: str
    north: float
    east: float


def _decode_point(blob: bytes) -> Optional[Tuple[float, float]]:
    """Plocka (northing, easting) ur en GeoPackage-geometri.

    Formatet är OGC:s GeoPackage Binary: magin "GP", en flaggbyte som säger
    hur stor omslutande rektangel som ligger inbakad, och därefter vanlig
    WKB. Vi läser bara punkter; allt annat returnerar None och räknas som en
    rad utan läge i stället för att tolkas fel.

    Att koda upp blobben själv är billigare än att dra in ett geospatialt
    beroende för fyra rader struct — samma skäl som geo.py anger för att
    implementera projektionen i stället för att kräva pyproj.
    """
    if not blob or len(blob) < 8 or blob[0:2] != b"GP":
        return None
    flags = blob[3]
    header_order = "<" if flags & 0x01 else ">"
    envelope = (flags >> 1) & 0x07
    sizes = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}
    if envelope not in sizes:
        return None
    if flags & 0x10:  # tom geometri
        return None
    srs_id = struct.unpack_from(header_order + "i", blob, 4)[0]
    if srs_id not in (EPSG_SWEREF99_TM, 0, -1):
        raise ValueError(f"Geometrin ligger i SRS {srs_id}, väntade {EPSG_SWEREF99_TM}")

    offset = 8 + sizes[envelope]
    if len(blob) < offset + 21:
        return None
    wkb_order = "<" if blob[offset] == 1 else ">"
    geometry_type = struct.unpack_from(wkb_order + "I", blob, offset + 1)[0]
    # 1 = Point. De högre bitarna bär Z, M och SRID enligt WKB-varianterna.
    if geometry_type & 0xFF != 1:
        return None
    easting, northing = struct.unpack_from(wkb_order + "dd", blob, offset + 5)
    return northing, easting


def _feature_table(connection: sqlite3.Connection) -> Tuple[str, str]:
    """Hitta skiktet och dess geometrikolumn ur GeoPackage-metadatan.

    Namnen står i produktens dokumentation, men de läses ur filen ändå.
    Dokumentationen beskriver version 2025.02, och en fil vi själva döpt fel
    ska ge ett tydligt fel i stället för noll träffar.
    """
    rows = connection.execute(
        "SELECT table_name FROM gpkg_contents WHERE data_type = 'features'"
    ).fetchall()
    if len(rows) != 1:
        found = ", ".join(r[0] for r in rows) or "inga"
        raise ValueError(f"Väntade ett skikt med geometri, hittade: {found}")
    table = rows[0][0]
    column = connection.execute(
        "SELECT column_name FROM gpkg_geometry_columns WHERE table_name = ?", (table,)
    ).fetchone()
    if column is None:
        raise ValueError(f"Skiktet {table} saknar geometrikolumn")
    return table, column[0]


def read_geopackage(path: Path) -> Iterator[Row]:
    """Läs belägenhetsadresserna ur en GeoPackage-fil.

    Hoppar över rader som inte pekar ut en adressplats: reserverade adresser,
    rader utan nummer (en anläggning kan sakna adressplatsnummer) och rader
    vars geometri inte är en punkt.
    """
    connection = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
    try:
        table, geometry = _feature_table(connection)
        available = {
            row[1] for row in connection.execute(f'PRAGMA table_info("{table}")')
        }
        required = {"adressomrade_faststalltnamn", "adressplatsnummer"}
        missing = required - available
        if missing:
            raise ValueError(f"Skiktet {table} saknar kolumnerna {sorted(missing)}")

        optional = [
            c
            for c in ("bokstavstillagg", "statusforbelagenhetsadress",
                      "gardsadressomrade_faststalltnamn")
            if c in available
        ]
        columns = ["adressomrade_faststalltnamn", "adressplatsnummer", *optional]
        select = ", ".join(f'"{c}"' for c in [*columns, geometry])
        for record in connection.execute(f'SELECT {select} FROM "{table}"'):
            values = dict(zip(columns, record))
            status = (values.get("statusforbelagenhetsadress") or "").strip().lower()
            if status == STATUS_RESERVED:
                continue

            number = _as_number(values.get("adressplatsnummer"))
            if number is None:
                continue
            letter = (values.get("bokstavstillagg") or "").strip()

            point = _decode_point(record[-1])
            if point is None:
                continue
            north, east = point

            for name in (
                values.get("adressomrade_faststalltnamn"),
                values.get("gardsadressomrade_faststalltnamn"),
            ):
                if name and str(name).strip():
                    yield Row(str(name).strip(), number, letter, north, east)
    finally:
        connection.close()


def _as_number(raw) -> Optional[int]:
    """Adressplatsnumret är text i registret men alltid ett tal i praktiken."""
    if raw is None:
        return None
    text = str(raw).strip()
    if not text.isdigit():
        return None
    return int(text)


def build_index(path: Path) -> AddressIndex:
    """Bygg ett uppslagbart index ur en GeoPackage-fil.

    Punkterna räknas om till WGS84 här, en gång per adress, i stället för
    vid varje uppslag. En punkt utanför Sverige är ett fel i filen eller i
    transformen och släpps inte in i indexet.
    """
    index = AddressIndex(source=SOURCE_LANTMATERIET)
    for row in read_geopackage(path):
        lat, lng = sweref99_to_wgs84(row.north, row.east, SWEREF99_TM)
        if not looks_like_sweden(lat, lng):
            continue
        index.add(row.street, row.number, row.letter, lat, lng)
    return index


def bounds_from_stac(code: str, bbox: List[float]) -> Municipality:
    """Gör om STAC-postens omslutande rektangel till en rimlighetskontroll.

    Rektangeln kommer ur samma fil som adresserna och beskriver kommunens
    faktiska utsträckning. Den slår de handskrivna mittpunkterna i
    geocode.MUNICIPALITIES, som är satta på höft med generös radie.
    """
    from .geocode import haversine_m

    west, south, east, north = bbox
    lat = (south + north) / 2
    lng = (west + east) / 2
    radius_km = haversine_m(lat, lng, north, east) / 1000 + BOUNDS_MARGIN_KM
    return Municipality(code, round(lat, 6), round(lng, 6), round(radius_km, 1))


def extract_dir_paths(directory: Path, code: str) -> Tuple[Path, Path]:
    """Filerna en hämtning lägger på plats: GeoPackage och dess metadata."""
    return (
        directory / f"belagenhetsadresser_kn{code}.gpkg",
        directory / f"belagenhetsadresser_kn{code}.json",
    )


def unpack(archive: Path, target: Path) -> Path:
    """Packa upp den nedladdade zip-filens GeoPackage till `target`.

    Leveransen är en zip med en .gpkg i. Vi plockar ut just den filen och
    struntar i vad zip-posten heter internt: namnet har bytt form mellan
    versioner, innehållet inte.
    """
    with zipfile.ZipFile(archive) as bundle:
        names = [n for n in bundle.namelist() if n.lower().endswith(".gpkg")]
        if len(names) != 1:
            raise ValueError(f"Väntade en .gpkg i {archive.name}, hittade {names}")
        target.parent.mkdir(parents=True, exist_ok=True)
        with bundle.open(names[0]) as source, target.open("wb") as sink:
            while chunk := source.read(1 << 20):
                sink.write(chunk)
    return target


def load_metadata(path: Path) -> Dict:
    return json.loads(path.read_text(encoding="utf-8"))
