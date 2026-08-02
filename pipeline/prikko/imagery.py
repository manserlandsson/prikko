"""Gatubilder från Mapillary.

Varför Mapillary och inte Google Street View:

Googles villkor förbjuder att lagra eller cacha bilderna ("Content
pre-fetching, indexing, storing, or caching is generally prohibited, except
for place IDs and panorama IDs"). Vi skulle alltså behöva anropa Google vid
varje sidvisning — vilket kostar per anrop, gör sidan långsammare och binder
oss till deras prissättning.

Mapillarys bilder är CC-BY-SA. Vi får hämta dem en gång, lagra dem och
servera dem själva. Kostnaden blir noll per sidvisning, bilden ligger i vår
egen HTML och laddar direkt. Kravet är attribution, vilket vi ändå vill ha.

Token: gratis konto på mapillary.com → Settings → Developers.
Sätts som MAPILLARY_TOKEN i miljön.
"""

from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Optional

API = "https://graph.mapillary.com/images"
USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se)"

#: Hur nära verksamheten en bild måste vara för att duga. 60 m är ungefär
#: "samma kvarter" — längre bort och man ser inte längre rätt hus, vilket är
#: värre än ingen bild alls.
MAX_DISTANCE_M = 60

#: Ungefärlig gradstorlek för sökrutan. 0.0007° ≈ 78 m i nord-sydlig led.
_BBOX_PAD = 0.0007


@dataclass(frozen=True)
class StreetImage:
    id: str
    url: str
    captured_at: Optional[str]
    #: Riktning kameran pekade, för att kunna välja bild mot fasaden.
    compass: Optional[float]
    lat: float
    lng: float


def _distance_m(a_lat: float, a_lng: float, b_lat: float, b_lng: float) -> float:
    import math

    R = 6371000
    d_lat = math.radians(b_lat - a_lat)
    d_lng = math.radians(b_lng - a_lng)
    h = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(a_lat)) * math.cos(math.radians(b_lat))
        * math.sin(d_lng / 2) ** 2
    )
    return 2 * R * math.asin(math.sqrt(h))


def find_street_image(
    lat: float,
    lng: float,
    token: Optional[str] = None,
) -> Optional[StreetImage]:
    """Närmaste gatubild till en punkt, eller None om ingen finns nära nog.

    Returnerar hellre None än en bild från fel kvarter. En bild som visar
    grannhuset är sämre än ingen bild — hela poängen är att besökaren ska
    känna igen stället.
    """
    token = token or os.environ.get("MAPILLARY_TOKEN")
    if not token:
        return None

    params = urllib.parse.urlencode(
        {
            "access_token": token,
            "fields": "id,thumb_1024_url,captured_at,compass_angle,geometry",
            "bbox": ",".join(
                str(round(v, 6))
                for v in (lng - _BBOX_PAD, lat - _BBOX_PAD, lng + _BBOX_PAD, lat + _BBOX_PAD)
            ),
            "limit": 25,
        }
    )

    request = urllib.request.Request(f"{API}?{params}", headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception:
        # Bilder är en bonus, aldrig ett krav. Pipelinen får inte falla för
        # att en bildtjänst är nere.
        return None

    best: Optional[StreetImage] = None
    best_distance = MAX_DISTANCE_M

    for item in payload.get("data", []):
        coords = (item.get("geometry") or {}).get("coordinates")
        url = item.get("thumb_1024_url")
        if not coords or not url:
            continue

        img_lng, img_lat = coords[0], coords[1]
        distance = _distance_m(lat, lng, img_lat, img_lng)
        if distance >= best_distance:
            continue

        best_distance = distance
        best = StreetImage(
            id=item["id"],
            url=url,
            captured_at=item.get("captured_at"),
            compass=item.get("compass_angle"),
            lat=img_lat,
            lng=img_lng,
        )

    return best
