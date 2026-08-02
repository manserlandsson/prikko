"""Koordinattransform: SWEREF 99 → WGS84.

Svenska kommuner publicerar koordinater i SWEREF 99, ofta i en *lokal* zon,
medan kartor och schema.org vill ha WGS84. Utan den här transformen hamnar
varje restaurang på fel plats — och en karta som ljuger är värre än ingen karta.

Implementerar Gauss–Krügers inversa projektion enligt Lantmäteriets formler
på GRS80-ellipsoiden. Ingen tredjepartsberoende: pipelinen ska kunna köras i
en tom GitHub Actions-container utan att bygga geospatiala C-bibliotek.

Fallgrop värd att känna till: Sambruk-specen kallar sitt koordinatfält GeoJSON
men anger latitud först, tvärtemot GeoJSON-standarden. Därför returnerar den
här modulen alltid ett namngivet par, aldrig en tvetydig array.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Tuple

# GRS80
_A = 6378137.0
_F = 1 / 298.257222101


@dataclass(frozen=True)
class Projection:
    """Parametrar för en svensk SWEREF 99-zon."""

    name: str
    central_meridian: float
    scale: float = 1.0
    false_easting: float = 150000.0
    false_northing: float = 0.0


# Rikstäckande zon. Används av de flesta nationella datamängder.
SWEREF99_TM = Projection(
    name="SWEREF 99 TM",
    central_meridian=15.0,
    scale=0.9996,
    false_easting=500000.0,
)

# Lokala zoner. Kommuner som levererar egna koordinatsystem använder dessa;
# skillnaden mot TM är skalfaktor och false easting, inte ellipsoid.
SWEREF99_1500 = Projection(name="SWEREF 99 15 00", central_meridian=15.0)
SWEREF99_1330 = Projection(name="SWEREF 99 13 30", central_meridian=13.5)
SWEREF99_1200 = Projection(name="SWEREF 99 12 00", central_meridian=12.0)
SWEREF99_1800 = Projection(name="SWEREF 99 18 00", central_meridian=18.0)


def sweref99_to_wgs84(
    northing: float,
    easting: float,
    projection: Projection = SWEREF99_TM,
) -> Tuple[float, float]:
    """Konvertera SWEREF 99 (N, E) till WGS84 och returnera (lat, lng)."""
    e2 = _F * (2 - _F)
    n = _F / (2 - _F)
    a_hat = _A / (1 + n) * (1 + n**2 / 4 + n**4 / 64)

    d1 = n / 2 - 2 * n**2 / 3 + 37 * n**3 / 96 - n**4 / 360
    d2 = n**2 / 48 + n**3 / 15 - 437 * n**4 / 1440
    d3 = 17 * n**3 / 480 - 37 * n**4 / 840
    d4 = 4397 * n**4 / 161280

    a_star = e2 + e2**2 + e2**3 + e2**4
    b_star = -(7 * e2**2 + 17 * e2**3 + 30 * e2**4) / 6
    c_star = (224 * e2**3 + 889 * e2**4) / 120
    d_star = -(4279 * e2**4) / 1260

    xi = (northing - projection.false_northing) / (projection.scale * a_hat)
    eta = (easting - projection.false_easting) / (projection.scale * a_hat)

    xi_prim = (
        xi
        - d1 * math.sin(2 * xi) * math.cosh(2 * eta)
        - d2 * math.sin(4 * xi) * math.cosh(4 * eta)
        - d3 * math.sin(6 * xi) * math.cosh(6 * eta)
        - d4 * math.sin(8 * xi) * math.cosh(8 * eta)
    )
    eta_prim = (
        eta
        - d1 * math.cos(2 * xi) * math.sinh(2 * eta)
        - d2 * math.cos(4 * xi) * math.sinh(4 * eta)
        - d3 * math.cos(6 * xi) * math.sinh(6 * eta)
        - d4 * math.cos(8 * xi) * math.sinh(8 * eta)
    )

    phi_star = math.asin(math.sin(xi_prim) / math.cosh(eta_prim))
    delta_lambda = math.atan(math.sinh(eta_prim) / math.cos(xi_prim))

    lng = math.degrees(math.radians(projection.central_meridian) + delta_lambda)
    lat = math.degrees(
        phi_star
        + math.sin(phi_star)
        * math.cos(phi_star)
        * (
            a_star
            + b_star * math.sin(phi_star) ** 2
            + c_star * math.sin(phi_star) ** 4
            + d_star * math.sin(phi_star) ** 6
        )
    )

    return lat, lng


def looks_like_sweden(lat: float, lng: float) -> bool:
    """Grov rimlighetskontroll.

    Fångar den klassiska felkällan att latitud och longitud kastats om, eller
    att fel zon använts. En restaurang utanför den här rutan är ett datafel,
    inte en restaurang — och ska aldrig publiceras.
    """
    return 55.0 <= lat <= 69.5 and 10.0 <= lng <= 24.5
