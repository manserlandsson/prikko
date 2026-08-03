"""Gatubilder från Mapillary, med Panoramax som andrahandskälla.

Varför inte Google Street View eller Google Places Photos:

Frågan är utredd och stängd, och det är inte en prisfråga. Tre av varandra
oberoende spärrar i Googles villkor: bilderna får inte lagras eller cachas
(3.2.3(a) och (b)), Places-foton är inte en tillåten användning för en
katalogtjänst med faktureringsadress i EES (Places API Permitted Uses (EEA)),
och Street View-innehåll får inte visas bredvid en karta (EES Service Specific
Terms 22.1) — och vår verksamhetssida visar just den här bilden ovanför
LocationMap. Se docs/13_bilder_och_verksamhetsdata.md del A1. Bygg ingenting
mot Google här.

Mapillarys och Panoramax bilder är CC BY-SA. Vi får hämta dem en gång, lagra
dem, skala om dem och servera dem själva. Kravet är attribution, och för
Mapillary uttryckligen deras logotyp och en länk, inte bara en textrad.

DEN BUGG DEN HÄR MODULEN FINNS FÖR ATT INTE UPPREPA:

Tidigare returnerades Mapillarys `thumb_1024_url` och den skrevs rakt in i
`public.images.url`, som sajten renderade som `<img src>`. Den URL:en är
signerad och har en utgångstid. Konstruktionen gick alltså sönder av sig själv
en tid efter varje bygge, utan att något i bygget klagade, och det märktes
aldrig bara för att `public.images` hade noll rader.

Regeln som följer: en URL från en bildkälla är ett hämtningsadress och aldrig
ett lagringsvärde. Modulen skiljer därför på `Candidate.fetch_url`, som är
efemär och används i samma andetag som den hämtas, och `StoredImage.url`, som
pekar på vår egen kopia i vår egen lagring och är det enda som får sparas.

Mapillary kräver en token: gratis konto på mapillary.com → Settings →
Developers, sätts som MAPILLARY_TOKEN i miljön. Panoramax kräver ingen.
"""

from __future__ import annotations

import json
import math
import os
import re
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

MAPILLARY_API = "https://graph.mapillary.com/images"
PANORAMAX_API = "https://api.panoramax.xyz/api/search"
USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se)"

#: Hur nära verksamheten en bild måste vara för att duga. 60 m är ungefär
#: "samma kvarter". Gränsen är generös med avsikt så länge täckningen är omätt;
#: mätskriptet pipeline/matt_bildtackning.py redovisar kurvan per avstånd, och
#: 30 m är den siffra rapporten låter beslutet hänga på. Sänk den här när
#: mätningen finns, inte innan.
MAX_DISTANCE_M = 60

#: Ungefärlig gradstorlek för sökrutan. 0.0007° ≈ 78 m i nord-sydlig led.
_BBOX_PAD = 0.0007

#: Bredd vi lagrar. Bilden visas i en sidopanel som aldrig är bredare än ett par
#: hundra punkter, så 1024 räcker även för en skärm med dubbel pixeltäthet.
TARGET_WIDTH = 1024

LICENCE = "CC-BY-SA-4.0"

#: Kameratyper vi väljer bort. Ett 360-foto är en ekvirektangulär utvikning, och
#: beskuret av `object-fit: cover` visar det bilens tak och en remsa himmel i
#: stället för en fasad. Mätt på tolv verkliga Panoramax-träffar i Stockholm var
#: tre av dem sådana, och alla tre var oanvändbara som igenkänningsbild.
#:
#: Det RÄTTA vore att beskära utvikningen mot bäringen från kameran till
#: verksamheten, alltså plocka ut den sektor som faktiskt pekar mot huset. Det
#: kräver att man vet vad `view:azimuth` respektive `compass_angle` är räknad
#: mot i bildens mittlinje, och den konventionen har jag inte kunnat belägga.
#: Att gissa den ger en bild av fel hus, vilket är exakt det den här modulen är
#: skriven för att undvika. Tills konventionen är verifierad väljs de bort.
SPHERICAL = {"spherical", "equirectangular"}

#: Förhållandet bredd genom höjd för en ekvirektangulär utvikning, med marginal.
_PANORAMA_RATIO = 1.9

#: Vad som hamnar i public.images.attribution. Läses av sajten som text intill
#: bilden. Logotypkravet uppfylls av komponenten, som känner igen `source`.
ATTRIBUTION = {
    "mapillary": "Mapillary, CC BY-SA 4.0",
    "panoramax": "Panoramax, CC BY-SA 4.0",
}


@dataclass(frozen=True)
class Candidate:
    """En bild vi HITTAT men ännu inte äger.

    `fetch_url` är efemär. Mapillarys miniatyr-URL:er är signerade och går ut,
    och Panoramax egna är visserligen stabila men ligger hos någon annan.
    Fältet får användas för att hämta bytesen och sedan aldrig mer. Skriv det
    inte till databasen, inte till en datafil och inte till en logg som någon
    kan råka läsa som ett resultat.
    """

    source: str
    source_id: str
    fetch_url: str
    #: ISO-datum, YYYY-MM-DD, eller None. Aldrig epoktid: kolumnen är `date`.
    captured_at: Optional[str]
    #: Riktning kameran pekade, för att senare kunna välja bild mot fasaden.
    compass: Optional[float]
    lat: float
    lng: float
    distance_m: float


@dataclass(frozen=True)
class StoredImage:
    """En bild vi äger en kopia av. Det här, och bara det här, får sparas."""

    url: str
    source: str
    source_id: str
    captured_at: Optional[str]
    licence: str
    attribution: str


# ---------------------------------------------------------------------------
# Sökning
# ---------------------------------------------------------------------------


def distance_m(a_lat: float, a_lng: float, b_lat: float, b_lng: float) -> float:
    R = 6371000
    d_lat = math.radians(b_lat - a_lat)
    d_lng = math.radians(b_lng - a_lng)
    h = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(a_lat)) * math.cos(math.radians(b_lat))
        * math.sin(d_lng / 2) ** 2
    )
    return 2 * R * math.asin(math.sqrt(h))


def _bbox(lat: float, lng: float, pad: float = _BBOX_PAD) -> tuple[float, ...]:
    return (lng - pad, lat - pad, lng + pad, lat + pad)


def _get(url: str, timeout: int = 30) -> dict:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def _iso_date_from_epoch_ms(value) -> Optional[str]:
    """Mapillary svarar med millisekunder sedan epok. Kolumnen är ett datum."""
    try:
        ms = int(value)
    except (TypeError, ValueError):
        return None
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).date().isoformat()


def _iso_date_from_timestamp(value) -> Optional[str]:
    """Panoramax svarar med ISO-tid. Vi behåller datumdelen."""
    if not isinstance(value, str) or len(value) < 10:
        return None
    head = value[:10]
    return head if re.fullmatch(r"\d{4}-\d{2}-\d{2}", head) else None


def find_mapillary(
    lat: float,
    lng: float,
    token: Optional[str] = None,
    max_distance: float = MAX_DISTANCE_M,
) -> Optional[Candidate]:
    """Närmaste Mapillary-bild, eller None.

    Returnerar hellre None än en bild från fel kvarter. En bild som visar
    grannhuset är sämre än ingen bild alls — hela poängen är att besökaren ska
    känna igen stället.
    """
    token = token or os.environ.get("MAPILLARY_TOKEN")
    if not token:
        return None

    params = urllib.parse.urlencode(
        {
            "access_token": token,
            "fields": "id,thumb_1024_url,captured_at,compass_angle,camera_type,geometry",
            "bbox": ",".join(str(round(v, 6)) for v in _bbox(lat, lng)),
            "limit": 25,
        }
    )
    try:
        payload = _get(f"{MAPILLARY_API}?{params}")
    except Exception:
        # Bilder är en bonus, aldrig ett krav. Pipelinen får inte falla för att
        # en bildtjänst är nere.
        return None

    best: Optional[Candidate] = None
    for item in payload.get("data", []):
        coords = (item.get("geometry") or {}).get("coordinates")
        url = item.get("thumb_1024_url")
        if not coords or not url:
            continue
        if str(item.get("camera_type") or "").lower() in SPHERICAL:
            continue
        d = distance_m(lat, lng, coords[1], coords[0])
        if d >= max_distance or (best is not None and d >= best.distance_m):
            continue
        best = Candidate(
            source="mapillary",
            source_id=str(item["id"]),
            fetch_url=url,
            captured_at=_iso_date_from_epoch_ms(item.get("captured_at")),
            compass=item.get("compass_angle"),
            lat=coords[1],
            lng=coords[0],
            distance_m=d,
        )
    return best


def find_panoramax(
    lat: float,
    lng: float,
    max_distance: float = MAX_DISTANCE_M,
    prefer_large: bool = True,
) -> Optional[Candidate]:
    """Närmaste Panoramax-bild, eller None.

    Panoramax är den öppna, federerade motsvarigheten till Mapillary, driven av
    bland andra IGN och OpenStreetMap France. Ingen token krävs. Täckningen mot
    vårt bestånd är mätt till 11,5 procent inom 60 meter och koncentrerad till
    fyra kommuner, så den bär inte funktionen ensam. Den kostar däremot
    ingenting att ha som andrahandskälla.
    """
    bbox = ",".join(f"{v:.6f}" for v in _bbox(lat, lng))
    try:
        payload = _get(f"{PANORAMAX_API}?bbox={bbox}&limit=50")
    except Exception:
        return None

    best: Optional[Candidate] = None
    for feature in payload.get("features", []):
        coords = (feature.get("geometry") or {}).get("coordinates")
        if not coords:
            continue
        d = distance_m(lat, lng, coords[1], coords[0])
        if d >= max_distance or (best is not None and d >= best.distance_m):
            continue

        properties = feature.get("properties") or {}
        if _sensor_is_spherical(properties):
            continue

        assets = feature.get("assets") or {}
        # `sd` är 2048 px bred och skalas ned här hemma. Kan vi inte skala ned
        # tar vi `thumb` på 500 px i stället för att lagra fyra gånger så många
        # bytes som vi någonsin visar.
        order = ("sd", "hd", "thumb") if prefer_large else ("thumb", "sd", "hd")
        href = next(
            (assets[name]["href"] for name in order if (assets.get(name) or {}).get("href")),
            None,
        )
        if not href:
            continue

        best = Candidate(
            source="panoramax",
            source_id=str(feature.get("id") or ""),
            fetch_url=href,
            captured_at=_iso_date_from_timestamp(properties.get("datetime")),
            compass=properties.get("view:azimuth"),
            lat=coords[1],
            lng=coords[0],
            distance_m=d,
        )
    return best


def find_candidate(
    lat: float,
    lng: float,
    token: Optional[str] = None,
    max_distance: float = MAX_DISTANCE_M,
) -> Optional[Candidate]:
    """Bästa gatubild för en punkt, Mapillary först och Panoramax sedan.

    Ordningen är inte godtycklig. Mapillary har mest kod bakom sig och grundades
    i Malmö, så den svenska täckningen väntas vara högre. Panoramax står efter
    som komplement eftersom den är gratis, tokenfri och mätt.
    """
    return find_mapillary(lat, lng, token, max_distance) or find_panoramax(
        lat, lng, max_distance, prefer_large=_can_resize()
    )


# ---------------------------------------------------------------------------
# Hämtning och nedskalning
# ---------------------------------------------------------------------------


def _sensor_is_spherical(properties: dict) -> bool:
    """Panoramax anger sensorns mått i STAC-utökningen `pers`.

    Är den dubbelt så bred som hög är bilden en ekvirektangulär utvikning, och
    då slipper vi hämta den över huvud taget. Saknas uppgiften faller vi
    tillbaka på att titta på bildens egna mått efter hämtningen.
    """
    dimensions = (properties.get("pers:interior_orientation") or {}).get(
        "sensor_array_dimensions"
    )
    if not dimensions or len(dimensions) != 2:
        return False
    try:
        width, height = float(dimensions[0]), float(dimensions[1])
    except (TypeError, ValueError):
        return False
    return height > 0 and width / height >= _PANORAMA_RATIO


def is_spherical(data: bytes) -> bool:
    """Är de här bytesen en 360-utvikning?

    Returnerar False när frågan inte går att besvara, alltså när Pillow saknas
    eller bilden inte går att öppna. Att hellre släppa igenom än att kasta en
    bild som kanske är bra är rätt håll: det värsta utfallet är en ful bild på
    några få sidor, inte en tom sida på alla.
    """
    try:
        import io

        from PIL import Image
    except ImportError:
        return False
    try:
        with Image.open(io.BytesIO(data)) as image:
            width, height = image.size
    except Exception:
        return False
    return height > 0 and width / height >= _PANORAMA_RATIO


def _can_resize() -> bool:
    try:
        import PIL  # noqa: F401
    except ImportError:
        return False
    return True


def download(candidate: Candidate, timeout: int = 60) -> tuple[bytes, str]:
    """Bildens bytes, plus innehållstyp. Det är hit hela rättningen syftar."""
    request = urllib.request.Request(
        candidate.fetch_url, headers={"User-Agent": USER_AGENT}
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        data = response.read()
        content_type = response.headers.get("Content-Type") or "image/jpeg"
    if not data:
        raise ValueError("tom kropp från bildkällan")
    return data, content_type.split(";")[0].strip()


def prepare(data: bytes, content_type: str, width: int = TARGET_WIDTH) -> tuple[bytes, str, str]:
    """Skala ned till `width` och lägg om till WebP. Returnerar bytes, typ, ändelse.

    Nedskalningen är frivillig med avsikt: finns inte Pillow lagras originalet
    som det är. Kontrollbygget installerar inga paket, och en pipeline som
    kräver ett bildbibliotek för att alls fungera är en pipeline som står still.

    Att skala om en CC BY-SA-bild gör den nedskalade filen till ett bearbetat
    verk, som därmed själv ska bära CC BY-SA. Det är ingen börda: licensen står
    ändå i bildtexten. (`object-fit: cover` i CSS är däremot ingen bearbetning,
    det är ett visningsval.)
    """
    try:
        import io

        from PIL import Image
    except ImportError:
        return data, content_type, _extension(content_type)

    try:
        image = Image.open(io.BytesIO(data))
        image.load()
    except Exception:
        return data, content_type, _extension(content_type)

    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")
    if image.width > width:
        height = max(1, round(image.height * width / image.width))
        image = image.resize((width, height), Image.LANCZOS)

    buffer = io.BytesIO()
    image.save(buffer, format="WEBP", quality=80, method=4)
    return buffer.getvalue(), "image/webp", "webp"


def _extension(content_type: str) -> str:
    return {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    }.get(content_type, "jpg")


_UNSAFE = re.compile(r"[^A-Za-z0-9._-]+")


def object_key(municipality_slug: str, establishment_id: str, extension: str) -> str:
    """Var i lagringen bilden hamnar.

    Deterministisk och utan slumpdel, så att en omkörning skriver över samma
    objekt i stället för att lägga ett till. En pipeline som kan köras om utan
    att växa är en pipeline man vågar köra om.
    """
    safe_kommun = _UNSAFE.sub("-", municipality_slug or "okand").strip("-").lower()
    safe_id = _UNSAFE.sub("-", establishment_id).strip("-")
    return f"gatubilder/{safe_kommun}/{safe_id}.{extension}"


def capture(
    store,
    municipality_slug: str,
    establishment_id: str,
    lat: float,
    lng: float,
    token: Optional[str] = None,
    max_distance: float = MAX_DISTANCE_M,
) -> Optional[StoredImage]:
    """Hela kedjan för en verksamhet: hitta, hämta, skala, lagra, beskriv.

    Returnerar None när ingen bild finns nära nog, och låter fel från lagringen
    gå vidare — en bild som inte gick att hitta är ett normalt utfall, en
    lagring som svarar 403 är det inte.
    """
    candidate = find_candidate(lat, lng, token, max_distance)
    if candidate is None:
        return None

    data, content_type = download(candidate)
    if is_spherical(data):
        # 360-utvikning. Se kommentaren vid SPHERICAL: beskuren av `object-fit:
        # cover` visar den bilens tak, inte husets fasad.
        return None

    data, content_type, extension = prepare(data, content_type)
    key = object_key(municipality_slug, establishment_id, extension)
    url = store.put(key, data, content_type)

    return StoredImage(
        url=url,
        source=candidate.source,
        source_id=candidate.source_id,
        captured_at=candidate.captured_at,
        licence=LICENCE,
        attribution=ATTRIBUTION[candidate.source],
    )
