"""Gatubilder från Mapillary, med Panoramax som andrahandskälla.

Beslutat av ägaren 2026-08-04 efter täckningsmätningen med egen token:
Mapillary bär funktionen, Panoramax kompletterar där den vinner (främst
Uppsala). Se pipeline/matt_bildtackning.py och rapportens del A2 och A3.

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
from datetime import date, datetime, timedelta, timezone
from typing import Optional

try:
    from zoneinfo import ZoneInfo

    _TZ_STOCKHOLM = ZoneInfo("Europe/Stockholm")
except Exception:  # pragma: no cover - reserv när tidszonsdata saknas
    _TZ_STOCKHOLM = timezone(timedelta(hours=1))

MAPILLARY_API = "https://graph.mapillary.com/images"
PANORAMAX_API = "https://api.panoramax.xyz/api/search"
USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se)"

#: Hur nära verksamheten en bild måste vara för att duga.
#:
#: Mätt med pipeline/matt_troskel.py 2026-08-05, 200 verksamheter, samma
#: grindar som körs skarpt. Täckning vid ±45°, dagsljus och utan 360:
#:
#:     20 m  50,5 %      50 m  75,0 %
#:     25 m  56,0 %      60 m  79,0 %
#:     30 m  63,0 %      80 m  84,0 %
#:     40 m  71,5 %     100 m  87,5 %
#:
#: Talen är mångdubbelt högre än de som stod här tidigare, och det beror inte
#: på att något blivit bättre utan på att frågan var trasig. Se SEARCH_LIMIT:
#: vi bad om 25 bilder ur en osorterad mängd på flera hundra, så det mesta föll
#: bort innan något villkor hunnit titta på det.
#:
#: Med den rättade frågan är utbudet gott, och då ska gränsen sättas av vad som
#: visar rätt hus och inte av vad vi råkar hitta. Steget från 40 till 30 meter
#: kostar 8,5 procentenheter, alltså ungefär var åttonde bild, och köper att
#: INGEN publicerad bild är tagen längre bort än trettio meter. På trettio
#: meter är man på andra sidan gatan och ser fasaden; på fyrtio är man snett
#: nedför kvarteret och ser lika mycket av grannen.
#:
#: Taket binder sällan: den bild som faktiskt väljs ligger på 15,9 meters
#: median. Det är just därför skärpningen är billig. Den tar bort de fall där
#: ingenting närmare fanns, alltså precis de bilder som var svagast.
#:
#: Syftet är "aha, det är DEN restaurangen". Mot det syftet är en ungefärlig
#: bild inte en halv bild utan ett fel, för besökaren tror att hen sett stället.
MAX_DISTANCE_M = 30

#: Hur mycket kamerariktningen får avvika från bäringen kamera → verksamhet.
#:
#: En gatubild tas ur ett fordon som fotograferar längs gatan åt båda hållen.
#: Utan det här kravet blir bilden lika ofta vägbanan bort från huset som
#: huset: vid 30 m lyfter ett fritt riktningsval täckningen från 63,0 till
#: 72,5 procent, och de nio och en halv procentenheterna är till stor del
#: bilder där verksamheten ligger bakom kameran.
#:
#: Gränsen är satt av optiken och inte av en avvägning. De kameror Mapillary
#: vanligen har täcker 90 till 100 grader horisontellt, alltså 45 till 50
#: grader åt vardera hållet från mitten. Ett motiv som ligger mer än 45 grader
#: från kamerans riktning är därmed utanför bildkanten på den smalaste av dem.
#: Här stod tidigare 60 grader med motiveringen att det höll motivet innanför
#: kanten, och den räkningen gick inte ihop: 60 är större än halva 90.
#:
#: Snävare än 45 lönar sig inte. Steget 45 till 30 kostar 7 procentenheter,
#: och det skyddar mot ingenting: kompassvärdet bär flera graders fel i sig, så
#: en hårdare gräns kastar sanna träffar utan att fånga fler falska. Bilder
#: utan kompassvärde väljs bort helt, hellre ingen bild än en gissning.
#: Kompositionen sköts i stället av _pick, som väljer den bäst centrerade av
#: dem som klarat grinden.
MAX_BEARING_OFF_DEG = 45

#: Dagsljusfönster per månad, lokal svensk tid [från, till). Provkörningen mot
#: Linköping valde annars en beckmörk vindrutebild från en marsnatt, med skarp
#: kompass, rätt avstånd och noll igenkänning. Mapillary har inget
#: kvalitetsfält, men klockslaget är en billig och ärlig proxy: utanför
#: dagsljus är bilden aldrig den bästa tillgängliga. Fönstren är satta efter
#: svenska soltider med marginal, inte astronomiskt beräknade.
#:
#: Kravet är mätt till att kosta 3,0 procentenheter vid 30 meter, alltså en
#: bild av tjugo. Billigt för att slippa publicera ett svart foto under
#: rubriken "så här ser stället ut".
_DAYLIGHT_HOURS = {
    1: (9, 15), 2: (9, 16), 3: (8, 17), 4: (7, 19), 5: (6, 20), 6: (6, 20),
    7: (6, 20), 8: (6, 19), 9: (7, 18), 10: (8, 17), 11: (9, 15), 12: (9, 14),
}

#: Avståndsband för valet, i meter. Två bilder i samma band räknas som lika
#: nära. Mellan banden vinner fortfarande närheten.
_DISTANCE_BAND_M = 15

#: Riktningsband inom ett avståndsband, i grader. Bäringen är inte bara en
#: grind utan också ett mått på hur bilden är komponerad: ett motiv 5 grader
#: från kamerans mitt står mitt i bilden, ett motiv 44 grader bort ligger
#: klistrat mot kanten med vägbanan i mitten. Provkörningen mot Oskarshamn
#: visade just det. Bilderna med störst avvikelse var vidvinklade
#: instrumentbrädesbilder där verksamheten låg ute i hörnet, medan de med liten
#: avvikelse hade fasaden mitt i rutan.
#:
#: Bandet är 15 grader och inte en rak sortering på bäring, för då hade en bild
#: från 2015 med 2 graders avvikelse slagit en från 2024 med 4. Inom bandet
#: bestämmer alltså färskheten fortfarande.
_BEARING_BAND_DEG = 15

#: Marginal på sökrutan utöver avståndskravet. Kandidaternas koordinater bär
#: GPS-brus, och en bild som ligger precis på gränsen ska hinna komma med och
#: sedan väljas bort av avståndskravet, inte försvinna redan i frågan. Snålt
#: satt: rutans area växer med kvadraten, och varje bild i rutan tar en plats
#: i svaret som är hårt begränsat. Se SEARCH_LIMIT.
_BBOX_MARGIN = 1.1

#: Hur många bilder vi ber källan om per punkt.
#:
#: Det här talet var 25, och det var en tyst och allvarlig bugg. Mapillary
#: sorterar inte svaret efter avstånd, utan returnerar en godtycklig delmängd
#: av det som ligger i rutan. På en innerstadsgata finns hundratals bilder inom
#: hundra meter, från flera års körningar, och med 25 platser i svaret var det
#: rena slumpen om den närmaste kom med.
#:
#: Mätt på sex verkliga adresser i Stockholm 2026-08-05, samma ruta, bara
#: gränsen ändrad:
#:
#:     limit=25   gav 0 bilder    limit=500 gav 66 bilder, närmaste  1,2 m
#:     limit=25   gav 0 bilder    limit=500 gav 90 bilder, närmaste  6,6 m
#:     limit=25   gav 1 bild      limit=500 gav 64 bilder, närmaste 10,3 m
#:
#: Alltså: verksamheter mitt i stan, med en gatubild tagen ett par meter från
#: porten, fick ingen bild alls. Precis de sidor där bilden är som mest värd
#: att ha. En kontroll av var svaret slutar växa gav 65 bilder vid 100, 143 vid
#: 500 och 423 vid 1000, och 460 vid 2000, alltså mättnad först en bit över
#: tusen.
#:
#: Kostnaden är bara svarets storlek, inte fler anrop: vi frågar en gång per
#: verksamhet oavsett. Fälten är få och varje post är liten.
SEARCH_LIMIT = 2000

#: Meter per grad latitud. Longitudgraden är kortare, och krymper mot polerna.
_M_PER_DEG_LAT = 111320.0

#: Bredd vi lagrar. Bilden visas i en sidopanel som aldrig är bredare än ett par
#: hundra punkter, så 1024 räcker även för en skärm med dubbel pixeltäthet.
TARGET_WIDTH = 1024

#: Licensen vi skriver för en Mapillary-bild, och varför den saknar versionsnummer.
#:
#: Villkoren på mapillary.com/terms, avsnitt 3, säger ordagrant "subject to the
#: Creative Commons Share Alike (CC BY-SA) license". Någon version står inte
#: där, varken 4.0 eller 3.0. Mapillarys hjälpartikel uppges säga 4.0, men
#: help.mapillary.com svarar 403 på maskinella anrop och kunde alltså inte
#: läsas som primärkälla vid kontrollen 2026-08-05.
#:
#: Att skriva "CC BY-SA 4.0" vore därför ett påstående vi inte kan belägga, och
#: en licensrad som är fel är värre än en som är kortfattad. Vi skriver det
#: villkoren faktiskt säger. Är versionen bekräftad i en riktig webbläsare kan
#: den läggas till här, på ett ställe.
MAPILLARY_LICENCE = "CC-BY-SA"

#: Panoramax anger licensen per bild i API-svaret och behöver ingen konstant.
#: Federationen tillåter två: CC-BY-SA-4.0 och franska etalab-2.0.
PANORAMAX_LICENCE = "CC-BY-SA-4.0"

#: DEN RISK SOM INTE ÄR UTREDD, och som ägaren måste känna till:
#:
#: Samma mening i avsnitt 3 fortsätter "unless we indicate otherwise", och ger
#: som exempel att somliga datamängder ligger under CC BY-NC-SA, alltså med
#: förbud mot kommersiell användning. Prikko är en kommersiell sajt. Någon
#: licensuppgift per bild finns inte i Mapillarys API, så det går inte att
#: skilja de bilderna från de andra maskinellt, och något dokumenterat sätt att
#: göra det hittades inte.
#:
#: Bedömningen som ligger bakom att vi ändå hämtar: undantaget är formulerat om
#: särskilt tillhandahållna datamängder, inte om enskilda bilder ur det vanliga
#: bild-API:t, som villkorens avsnitt 11 uttryckligen förutser att man laddar
#: ned och serverar själv. Det är en bedömning och inte ett belägg.
LICENCE = MAPILLARY_LICENCE

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

#: Källnamn som de skrivs i attributionen.
_SOURCE_LABEL = {"mapillary": "Mapillary", "panoramax": "Panoramax"}

#: Licenskoden som den skrivs för en människa. Koden är maskinens form och
#: hamnar i public.images.licence; det här är formen som står under bilden.
_LICENCE_LABEL = {
    "CC-BY-SA": "CC BY-SA",
    "CC-BY-SA-4.0": "CC BY-SA 4.0",
    "etalab-2.0": "Licence Ouverte 2.0",
}

#: Panoramax-federationen tillåter två licenser per bild: CC-BY-SA 4.0 och
#: franska LO 2.0 (etalab). Vi tar bara CC-BY-SA, samma licens som Mapillary,
#: så att sajtens licensrad alltid är sann och en enda. `license` läses per
#: bild ur API-svaret, aldrig antaget.
_ACCEPTED_LICENCES = {"CC-BY-SA-4.0"}


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
    #: Riktning kameran pekade, som källan angav den.
    compass: Optional[float]
    lat: float
    lng: float
    distance_m: float
    #: Hur långt från bildens mitt verksamheten ligger, i grader. Sätts av
    #: sökfunktionerna och används av _pick för att välja den bäst komponerade
    #: bilden bland dem som klarat grindarna. Förvalet är gränsvärdet, alltså
    #: det sämsta en bild kan ha och ändå släppas igenom.
    bearing_off_deg: float = float(MAX_BEARING_OFF_DEG)
    #: Fotografens användarnamn hos källan, för attributionen. CC BY-SA kräver
    #: att upphovspersonen namnges; plattformens namn räcker inte.
    creator: Optional[str] = None
    #: Licensen för just den här bilden, SPDX-liknande. Panoramax anger den per
    #: bild i svaret och den läses därifrån; Mapillary anger den bara i sina
    #: villkor och får konstanten. Fältet finns för att licensraden ska följa
    #: bilden i stället för att gissas av den som visar den.
    licence: str = MAPILLARY_LICENCE


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


def bearing_deg(a_lat: float, a_lng: float, b_lat: float, b_lng: float) -> float:
    """Bäring från punkt a till punkt b i grader, norr = 0, medurs."""
    p1, p2 = math.radians(a_lat), math.radians(b_lat)
    d_lng = math.radians(b_lng - a_lng)
    y = math.sin(d_lng) * math.cos(p2)
    x = math.cos(p1) * math.sin(p2) - math.sin(p1) * math.cos(p2) * math.cos(d_lng)
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def _angle_diff(a: float, b: float) -> float:
    """Minsta vinkelskillnad mellan två bäringar, 0-180."""
    return abs((a - b + 180) % 360 - 180)


def bearing_off(
    cam_lat: float, cam_lng: float, compass, target_lat: float, target_lng: float
) -> Optional[float]:
    """Hur många grader från bildens mitt verksamheten ligger, eller None.

    None betyder att frågan inte går att besvara, alltså att kompassvärde
    saknas eller är oläsbart. Talet används både som grind och som mått på
    kompositionen: noll betyder mitt i rutan, MAX_BEARING_OFF_DEG betyder ute
    vid kanten.
    """
    if compass is None:
        return None
    try:
        heading = float(compass)
    except (TypeError, ValueError):
        return None
    return _angle_diff(heading, bearing_deg(cam_lat, cam_lng, target_lat, target_lng))


def points_at(
    cam_lat: float, cam_lng: float, compass, target_lat: float, target_lng: float
) -> bool:
    """Pekar kameran mot verksamheten?

    Utan det här kravet är en gatubild lika ofta vägen bort från huset som
    huset: bilen fotograferar längs gatan åt båda hållen, och närmaste bild
    kan lika gärna vara den som just passerat porten med ryggen mot den.
    Saknas kompassvärde svarar vi False, hellre ingen bild än en gissning.
    Hela modulen finns för att inte visa fel hus.
    """
    off = bearing_off(cam_lat, cam_lng, compass, target_lat, target_lng)
    return off is not None and off <= MAX_BEARING_OFF_DEG


def _bbox(lat: float, lng: float, max_distance: float = MAX_DISTANCE_M) -> tuple[float, ...]:
    """Sökrutan runt en punkt, härledd ur avståndskravet.

    Longitudgraden krymper mot polerna, och det var en tyst bugg här. Rutan
    hade en fast sida i grader åt båda hållen, vilket i Uppsala blev 78 meter
    i nord-sydlig led men bara 39 i öst-västlig. Avståndskravet var 40 meter,
    så en bild rakt öster om porten föll utanför frågan innan något
    avståndsvillkor hunnit titta på den. Rutan var alltså inte en cirkel utan
    en liggande ellips, och verksamheter vid en öst-västlig gata, alltså de
    flesta, fick färre kandidater än de skulle.

    Nu skalas longitudsidan med 1/cos(latitud), så att rutan täcker
    avståndskravet lika långt åt alla håll oavsett var i landet punkten
    ligger.
    """
    pad_lat = max_distance * _BBOX_MARGIN / _M_PER_DEG_LAT
    # cos(lat) går mot noll vid polerna. Golvet gör funktionen definierad där
    # också; Sverige ligger långt därifrån och når det aldrig.
    pad_lng = pad_lat / max(math.cos(math.radians(lat)), 0.01)
    return (lng - pad_lng, lat - pad_lat, lng + pad_lng, lat + pad_lat)


def _get(url: str, timeout: int = 30) -> dict:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def _moment_from_epoch_ms(value) -> Optional[datetime]:
    """Mapillary svarar med millisekunder sedan epok, i UTC."""
    try:
        ms = int(value)
    except (TypeError, ValueError):
        return None
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc)


def _moment_from_iso(value) -> Optional[datetime]:
    """Panoramax svarar med ISO-tid, med tidszon."""
    if not isinstance(value, str):
        return None
    try:
        moment = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=timezone.utc)
    return moment


def _iso_date_from_epoch_ms(value) -> Optional[str]:
    """Mapillary svarar med millisekunder sedan epok. Kolumnen är ett datum."""
    moment = _moment_from_epoch_ms(value)
    return moment.date().isoformat() if moment else None


def _iso_date_from_timestamp(value) -> Optional[str]:
    """Panoramax svarar med ISO-tid. Vi behåller datumdelen."""
    if not isinstance(value, str) or len(value) < 10:
        return None
    head = value[:10]
    return head if re.fullmatch(r"\d{4}-\d{2}-\d{2}", head) else None


def taken_in_daylight(moment: Optional[datetime]) -> bool:
    """Är bilden tagen i dagsljus, svensk lokal tid?

    Provkörningen mot Linköping valde annars en beckmörk vindrutebild från en
    marsnatt: rätt avstånd, rätt riktning, noll igenkänning. Saknas tidsstämpel
    svarar vi False, av samma skäl som kompassgrinden: hellre ingen bild än en
    gissning.
    """
    if moment is None:
        return False
    local = moment.astimezone(_TZ_STOCKHOLM)
    start, end = _DAYLIGHT_HOURS[local.month]
    return start <= local.hour < end


def _recency_key(captured_at: Optional[str]) -> int:
    """Dagnummer för fångstdatumet, 0 när det saknas eller är oläsbart."""
    if not captured_at:
        return 0
    try:
        return date.fromisoformat(captured_at).toordinal()
    except ValueError:
        return 0


def _pick(candidates: list[Candidate]) -> Optional[Candidate]:
    """Bästa kandidaten: närhet, sedan komposition, sedan färskhet.

    Tre mått i fallande ordning, vart och ett bandat så att små skillnader inte
    slår ut ett viktigare mått:

    1. Avstånd i band om 15 m. Närmare är bättre, men 21 och 29 meter är i
       praktiken samma sak.
    2. Riktningsavvikelse i band om 15°. Det här ledet tillkom efter
       provkörningen mot Oskarshamn, där bäringen bara var en grind och valet
       därför lika gärna kunde falla på en bild med verksamheten ute i hörnet
       som på en med fasaden mitt i rutan. Grinden avgör om bilden får visas,
       det här avgör vilken av de tillåtna som faktiskt visas.
    3. Färskhet. Ett rent närmast-val gav en bild från 2015 av en butik som
       mycket väl kan ha bytt både skylt och namn sedan dess.
    """
    if not candidates:
        return None
    return min(
        candidates,
        key=lambda c: (
            int(c.distance_m // _DISTANCE_BAND_M),
            int(c.bearing_off_deg // _BEARING_BAND_DEG),
            -_recency_key(c.captured_at),
            c.distance_m,
        ),
    )


def find_mapillary(
    lat: float,
    lng: float,
    token: Optional[str] = None,
    max_distance: float = MAX_DISTANCE_M,
) -> Optional[Candidate]:
    """Bästa Mapillary-bild för punkten, eller None.

    Fyra grindar och ett val: inom avståndet, kameran mot verksamheten, ingen
    360-utvikning, tagen i dagsljus — och bland dem som passerar vinner den
    närmaste, där nyare slår äldre inom samma avståndsband. Returnerar hellre
    None än en bild från fel kvarter eller åt fel håll: hela poängen är att
    besökaren ska känna igen stället.
    """
    token = token or os.environ.get("MAPILLARY_TOKEN")
    if not token:
        return None

    params = urllib.parse.urlencode(
        {
            "access_token": token,
            "fields": "id,thumb_1024_url,captured_at,compass_angle,camera_type,"
                      "geometry,creator",
            "bbox": ",".join(str(round(v, 6)) for v in _bbox(lat, lng, max_distance)),
            "limit": SEARCH_LIMIT,
        }
    )
    try:
        payload = _get(f"{MAPILLARY_API}?{params}")
    except Exception:
        # Bilder är en bonus, aldrig ett krav. Pipelinen får inte falla för att
        # en bildtjänst är nere.
        return None

    candidates: list[Candidate] = []
    for item in payload.get("data", []):
        coords = (item.get("geometry") or {}).get("coordinates")
        url = item.get("thumb_1024_url")
        if not coords or not url:
            continue
        if str(item.get("camera_type") or "").lower() in SPHERICAL:
            continue
        d = distance_m(lat, lng, coords[1], coords[0])
        if d >= max_distance:
            continue
        off = bearing_off(coords[1], coords[0], item.get("compass_angle"), lat, lng)
        if off is None or off > MAX_BEARING_OFF_DEG:
            continue
        if not taken_in_daylight(_moment_from_epoch_ms(item.get("captured_at"))):
            continue
        candidates.append(
            Candidate(
                source="mapillary",
                source_id=str(item["id"]),
                fetch_url=url,
                captured_at=_iso_date_from_epoch_ms(item.get("captured_at")),
                compass=item.get("compass_angle"),
                lat=coords[1],
                lng=coords[0],
                distance_m=d,
                bearing_off_deg=off,
                creator=((item.get("creator") or {}).get("username") or None),
                licence=MAPILLARY_LICENCE,
            )
        )
    return _pick(candidates)


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
    bbox = ",".join(f"{v:.6f}" for v in _bbox(lat, lng, max_distance))
    try:
        payload = _get(f"{PANORAMAX_API}?bbox={bbox}&limit={SEARCH_LIMIT}")
    except Exception:
        return None

    candidates: list[Candidate] = []
    for feature in payload.get("features", []):
        coords = (feature.get("geometry") or {}).get("coordinates")
        if not coords:
            continue
        d = distance_m(lat, lng, coords[1], coords[0])
        if d >= max_distance:
            continue

        properties = feature.get("properties") or {}
        if _sensor_is_spherical(properties):
            continue
        # Licensen står per bild, inte per tjänst: federationen tillåter både
        # CC-BY-SA 4.0 och franska LO 2.0. Vi tar bara den förra, samma licens
        # som Mapillary, så att sajtens licensrad alltid är sann.
        if str(properties.get("license") or "") not in _ACCEPTED_LICENCES:
            continue
        off = bearing_off(coords[1], coords[0], properties.get("view:azimuth"), lat, lng)
        if off is None or off > MAX_BEARING_OFF_DEG:
            continue
        if not taken_in_daylight(_moment_from_iso(properties.get("datetime"))):
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

        candidates.append(
            Candidate(
                source="panoramax",
                source_id=str(feature.get("id") or ""),
                fetch_url=href,
                captured_at=_iso_date_from_timestamp(properties.get("datetime")),
                compass=properties.get("view:azimuth"),
                lat=coords[1],
                lng=coords[0],
                distance_m=d,
                bearing_off_deg=off,
                creator=_panoramax_producer(feature, properties),
                licence=str(properties["license"]),
            )
        )
    return _pick(candidates)


def _panoramax_producer(feature: dict, properties: dict) -> Optional[str]:
    """Fotografen bakom en Panoramax-bild, för attributionen.

    Namnet står på två ställen i svaret. `providers` är STAC-standardens form,
    en lista där den vi vill ha har rollen "producer"; `geovisio:producer` är
    en bekvämlighetsdubblett. Vi läser standardformen först och faller tillbaka
    på dubbletten, så att attributionen inte tappas om den ena utgår.
    """
    for provider in feature.get("providers") or []:
        roles = provider.get("roles") or []
        if "producer" in roles and provider.get("name"):
            return str(provider["name"])
    return properties.get("geovisio:producer") or None


def find_candidate(
    lat: float,
    lng: float,
    token: Optional[str] = None,
    max_distance: float = MAX_DISTANCE_M,
) -> Optional[Candidate]:
    """Bästa gatubild för en punkt: Mapillary först, Panoramax som reserv.

    Ordningen är beslutad av ägaren efter mätningen med egen token 2026-08-04.
    Mapillary bär funktionen (42 procent inom 60 m mot urvalet, jämnt över
    kommunerna). Panoramax är marginell totalt men vinner lokalt — Uppsala låg
    på 26,9 procent inom 60 m — och den kostar ingenting och kräver ingen
    token. Den tillfrågas därför bara när Mapillary inte gav något.

    Båda källorna går genom samma grindar: avstånd, kamerariktning mot
    verksamheten, ingen 360-utvikning, och för Panoramax dessutom licensen
    per bild.
    """
    found = find_mapillary(lat, lng, token, max_distance)
    if found is not None:
        return found
    return find_panoramax(lat, lng, max_distance)


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


def attribution_text(candidate: Candidate) -> str:
    """Attributionsraden som lagras och visas intill bilden.

    CC BY-SA kräver att upphovspersonen namnges. Formen är
    "fotograf / Källa, CC BY-SA", där komponenten läser allt före första
    kommatecknet som länktext och resten som licens. Saknar källan ett namn
    faller vi tillbaka på enbart källans namn.

    Licensen kommer från kandidaten och aldrig från en konstant här: Panoramax
    anger den per bild, och en licensrad som inte är bildens egen är fel även
    när den råkar stämma.
    """
    label = _SOURCE_LABEL.get(candidate.source, candidate.source)
    licence = _LICENCE_LABEL.get(candidate.licence, candidate.licence)
    if candidate.creator:
        return f"{candidate.creator} / {label}, {licence}"
    return f"{label}, {licence}"


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
        licence=candidate.licence,
        attribution=attribution_text(candidate),
    )
