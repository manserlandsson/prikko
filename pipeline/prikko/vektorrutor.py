"""Mapillarys vektorrutor: en fråga per KVARTER i stället för en per verksamhet.

═══ FRÅGAN DEN HÄR MODULEN FINNS FÖR ═════════════════════════════════════════

`imagery.find_mapillary` frågar graph-API:t om EN punkt åt gången. Det är rätt
form för att fylla på med några dussin nya verksamheter per natt, och det är
den form `hamta_gatubilder.py` använder. Men frågan "vilka av våra
verksamheter HAR över huvud taget en gatubild" kostar då ett anrop per rad, och
beståndet är 16 047 rader varav 13 616 har koordinat.

Mapillary serverar samma bestånd som vektorrutor. En ruta på zoomnivå 14 är
omkring 1 250 meter bred på svensk latitud och bär VARJE bild i rutan med
koordinat, kompassvinkel, fångsttid, panoramaflagga och bild-id. Alltså precis
de fält `find_mapillary` ber graph-API:t om, i ett svar som täcker ett helt
kvarter i stället för en adress.

Uppmätt mot site/src/data 2026-08-26:

    13 616 koordinater ligger i          815 rutor på z14
    med 30 meters kantmarginal           860 rutor
    med 60 meters kantmarginal           916 rutor

860 anrop i stället för 13 616, alltså en sextondel. Det är skälet till att
modulen finns, och talet är räknat på våra egna koordinater och inte antaget.

Kantmarginalen är inte en detalj: en verksamhet 5 meter från en rutgräns har
bilder på andra sidan gränsen, och de ligger i grannrutan. Se `rutor_for`.


═══ SÖKVÄGEN SOM KOSTADE EN HALVTIMME ════════════════════════════════════════

Ändpunkten är `/maps/vtp/`, inte `/maps/vector/`. Den senare svarar 404 på
varje ruta, med tom kropp och utan felmeddelande, alltså exakt likadant som en
ruta utan täckning skulle svara om den svarade 404. Skriv aldrig om den till
`vector` igen.


═══ VARFÖR EN EGEN AVKODARE ══════════════════════════════════════════════════

Rutorna är Mapbox Vector Tiles, alltså protobuf. `mapbox_vector_tile` finns
inte i miljön och pipelinen har noll tredjepartsberoenden i övrigt. Formatet är
litet nog att läsa själv: fyra fälttyper i protobufs trådformat och tre
geometrikommandon. Vi läser bara PUNKTER, eftersom `image`-lagret bara
innehåller punkter, och hoppar över allt annat i stället för att implementera
linjer och ytor vi inte har någon användning för.

Specen: https://github.com/mapbox/vector-tile-spec/tree/master/2.1
"""

from __future__ import annotations

import gzip
import math
import struct
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Iterable, Iterator, Optional

#: Vektorrutorna. `vtp` och inte `vector`, se modulens huvud.
TILE_URL = "https://tiles.mapillary.com/maps/vtp/mly1_public/2/{z}/{x}/{y}"

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se)"

#: Zoomnivån där `image`-lagret finns. Mapillary levererar enskilda bilder
#: bara på z14; lägre nivåer bär `sequence` och `overview`, alltså linjer och
#: sammanfattningar, och de svarar inte på frågan om en enskild adress.
ZOOM = 14

#: Jordens omkrets vid ekvatorn, i meter. Rutbredden är den delad med 2^z och
#: multiplicerad med cosinus för latituden.
_EKVATOR_M = 40075016.686


# ---------------------------------------------------------------------------
# Rutmatematik
# ---------------------------------------------------------------------------


def ruta_flyttal(lat: float, lng: float, z: int = ZOOM) -> tuple[float, float]:
    """Rutkoordinat som flyttal, alltså med positionen inne i rutan kvar."""
    n = 2 ** z
    x = (lng + 180.0) / 360.0 * n
    lat_rad = math.radians(lat)
    y = (1.0 - math.log(math.tan(lat_rad) + 1.0 / math.cos(lat_rad)) / math.pi) / 2.0 * n
    return x, y


def ruta_for(lat: float, lng: float, z: int = ZOOM) -> tuple[int, int]:
    """Rutan en punkt ligger i."""
    x, y = ruta_flyttal(lat, lng, z)
    return int(x), int(y)


def rutbredd_m(lat: float, z: int = ZOOM) -> float:
    """Rutans bredd i meter på den latituden."""
    return _EKVATOR_M * math.cos(math.radians(lat)) / 2 ** z


def rutor_for(
    punkter: Iterable[tuple[float, float]],
    z: int = ZOOM,
    radie_m: float = 0.0,
) -> set[tuple[int, int]]:
    """Rutorna som behövs för att kunna svara om varje punkt, med marginal.

    MARGINALEN ÄR INTE VALFRI. En verksamhet fem meter från en rutgräns har
    sina närmaste bilder på andra sidan gränsen, och de ligger i grannrutan.
    Utan marginal svarar registret "ingen bild" för dem, och felet är tyst:
    utfallet ser ut som glesare täckning i stället för som en bugg.

    Andelen som berörs är räknebar och inte försumbar. En z14-ruta är omkring
    1 250 m bred på svensk latitud, så en 30-metersradie når utanför för
    2·30/1250 av punkterna i vardera led, alltså ungefär nio procent av dem.

    Kostnaden är liten eftersom rutorna delas: mätt på våra 13 616 koordinater
    växer 815 rutor till 860 med 30 meters marginal.
    """
    ut: set[tuple[int, int]] = set()
    for lat, lng in punkter:
        fx, fy = ruta_flyttal(lat, lng, z)
        if radie_m <= 0:
            ut.add((int(fx), int(fy)))
            continue
        marginal = radie_m / rutbredd_m(lat, z)
        for dx in (-marginal, 0.0, marginal):
            for dy in (-marginal, 0.0, marginal):
                ut.add((int(fx + dx), int(fy + dy)))
    return ut


def punkt_i_ruta(z: int, x: int, y: int, px: float, py: float, extent: int) -> tuple[float, float]:
    """Lokal rutkoordinat till latitud och longitud."""
    n = 2 ** z
    lng = (x + px / extent) / n * 360.0 - 180.0
    lat = math.degrees(math.atan(math.sinh(math.pi * (1.0 - 2.0 * (y + py / extent) / n))))
    return lat, lng


# ---------------------------------------------------------------------------
# Protobuf, bara så mycket som en vektorruta behöver
# ---------------------------------------------------------------------------


def _varint(data: bytes, i: int) -> tuple[int, int]:
    resultat = 0
    skift = 0
    while True:
        byte = data[i]
        i += 1
        resultat |= (byte & 0x7F) << skift
        if not byte & 0x80:
            return resultat, i
        skift += 7


def _falt(data: bytes) -> Iterator[tuple[int, int, object]]:
    """Protobufs trådformat: (fältnummer, trådtyp, värde)."""
    i = 0
    slut = len(data)
    while i < slut:
        nyckel, i = _varint(data, i)
        nummer, trad = nyckel >> 3, nyckel & 7
        if trad == 0:
            varde, i = _varint(data, i)
            yield nummer, trad, varde
        elif trad == 2:
            langd, i = _varint(data, i)
            yield nummer, trad, data[i:i + langd]
            i += langd
        elif trad == 5:
            yield nummer, trad, data[i:i + 4]
            i += 4
        elif trad == 1:
            yield nummer, trad, data[i:i + 8]
            i += 8
        else:
            raise ValueError(f"okänd trådtyp {trad}")


def _sicksack(n: int) -> int:
    return (n >> 1) ^ -(n & 1)


def _varde(rå: bytes):
    """Vector-tile-specens Value: en av sju typer, en per fältnummer."""
    for nummer, _trad, v in _falt(rå):
        if nummer == 1:
            return v.decode("utf-8", "replace")
        if nummer == 2:
            return struct.unpack("<f", v)[0]
        if nummer == 3:
            return struct.unpack("<d", v)[0]
        if nummer in (4, 5):
            return v
        if nummer == 6:
            return _sicksack(v)
        if nummer == 7:
            return bool(v)
    return None


def _punkter(kommandon: list[int]) -> list[tuple[int, int]]:
    """Punktgeometri ur kommandoströmmen.

    Bara MoveTo läses. LineTo hoppas över och ClosePath tar inga argument.
    `image`-lagret bär bara punkter, så resten skulle ändå bli tomt.
    """
    ut: list[tuple[int, int]] = []
    i = 0
    x = y = 0
    while i < len(kommandon):
        kommando = kommandon[i]
        i += 1
        id_, antal = kommando & 7, kommando >> 3
        if id_ == 1:  # MoveTo
            for _ in range(antal):
                x += _sicksack(kommandon[i])
                y += _sicksack(kommandon[i + 1])
                i += 2
                ut.append((x, y))
        elif id_ == 2:  # LineTo
            i += antal * 2
    return ut


@dataclass(frozen=True)
class Rutbild:
    """En bild ur `image`-lagret, med de fält urvalet behöver."""

    id: str
    lat: float
    lng: float
    kompass: Optional[float]
    fangad_ms: Optional[int]
    panorama: bool
    sekvens: Optional[str]


def avkoda(rå: bytes, z: int, x: int, y: int, lager: str = "image") -> list[Rutbild]:
    """Bilderna i en vektorruta.

    Fälten är samma som `imagery.find_mapillary` hämtar ur graph-API:t, med ett
    undantag: rutan bär `is_pano` som boolean där graph bär `camera_type` som
    sträng. Grinden mot 360-bilder blir därför enklare här, inte svagare.

    Rutan bär `creator_id` men inte fotografens NAMN, och namnet är ett
    licenskrav. Det hämtas därför per vald bild i steget som faktiskt lagrar
    något, alltså för några tusen bilder och inte för alla miljoner i rutorna.
    """
    ut: list[Rutbild] = []
    for nummer, _trad, kropp in _falt(rå):
        if nummer != 3:
            continue
        namn = None
        extent = 4096
        nycklar: list[str] = []
        varden: list[object] = []
        drag: list[bytes] = []
        for lf, _lt, lv in _falt(kropp):
            if lf == 1:
                namn = lv.decode("utf-8", "replace")
            elif lf == 2:
                drag.append(lv)
            elif lf == 3:
                nycklar.append(lv.decode("utf-8", "replace"))
            elif lf == 4:
                varden.append(_varde(lv))
            elif lf == 5:
                extent = lv
        if namn != lager:
            continue
        for rått_drag in drag:
            taggar: list[int] = []
            geometri: list[int] = []
            typ = 0
            for df, _dt, dv in _falt(rått_drag):
                if df == 2:
                    j = 0
                    while j < len(dv):
                        n, j = _varint(dv, j)
                        taggar.append(n)
                elif df == 3:
                    typ = dv
                elif df == 4:
                    j = 0
                    while j < len(dv):
                        n, j = _varint(dv, j)
                        geometri.append(n)
            if typ != 1 or not geometri:
                continue
            attribut = {
                nycklar[taggar[i]]: varden[taggar[i + 1]]
                for i in range(0, len(taggar) - 1, 2)
                if taggar[i] < len(nycklar) and taggar[i + 1] < len(varden)
            }
            for px, py in _punkter(geometri):
                lat, lng = punkt_i_ruta(z, x, y, px, py, extent)
                fangad = attribut.get("captured_at")
                kompass = attribut.get("compass_angle")
                ut.append(
                    Rutbild(
                        id=str(attribut.get("id") or ""),
                        lat=lat,
                        lng=lng,
                        kompass=float(kompass) if isinstance(kompass, (int, float)) else None,
                        fangad_ms=int(fangad) if isinstance(fangad, (int, float)) else None,
                        panorama=bool(attribut.get("is_pano")),
                        sekvens=attribut.get("sequence_id") or None,
                    )
                )
    return ut


# ---------------------------------------------------------------------------
# Hämtning
# ---------------------------------------------------------------------------


def hamta_ruta(z: int, x: int, y: int, token: str, timeout: int = 60) -> bytes:
    """Rå vektorruta. Tom bytes när rutan saknar täckning.

    Mapillary svarar 404 med tom kropp på rutor utan bilder, och det är ett
    normalt utfall och inte ett fel: fyra av våra kommuner ligger i sådana
    rutor. Anroparen ska inte behöva skilja "inga bilder" från "gick sönder",
    så tomheten är svaret.
    """
    url = TILE_URL.format(z=z, x=x, y=y) + "?" + urllib.parse.urlencode(
        {"access_token": token}
    )
    begaran = urllib.request.Request(
        url, headers={"User-Agent": USER_AGENT, "Accept-Encoding": "gzip"}
    )
    try:
        with urllib.request.urlopen(begaran, timeout=timeout) as svar:
            data = svar.read()
            if svar.headers.get("Content-Encoding") == "gzip" or data[:2] == b"\x1f\x8b":
                data = gzip.decompress(data)
            return data
    except urllib.error.HTTPError as fel:
        if fel.code == 404:
            return b""
        raise
