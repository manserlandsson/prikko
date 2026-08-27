"""Uppsala kommuns egen adresspunktstjänst som geokodningskälla.

Uppsala publicerar adress men ingen koordinat, och OpenStreetMap räcker inte
till: av 1 525 adressrader får 986 en nål, och de 458 distinkta adresser som
fattas är till stor del landsbygdsadresser ("Hagby 304", "Klista 109") som
OSM aldrig haft. Lantmäteriets belägenhetsadresser skulle täcka dem, men
kräver ett avtal ägaren måste teckna, se fetch_belagenhetsadresser.py.

Kommunen kör samtidigt en egen adresstjänst med samma uppgifter, öppen utan
nyckel.

TJÄNSTEN
--------
Verifierat med direkta anrop 2026-08-27:

    https://kartportal.uppsala.se/mapping/rest/services
        /aGenerell/Adresser/FeatureServer/0

    Antal        56 150 punkter (?where=1=1&returnCountOnly=true)
    Geometri     esriGeometryPoint
    Fält         OBJECTID, Name ("Kungsgatan 19"), PostCode, PostCity,
                 AddressStatus, GID
    Utdata       outSR=4326 ger WGS84 direkt
    Sidstorlek   maxRecordCount 1000, resultOffset fungerar
    Nyckel       ingen; tjänsten svarar anonymt

Träffgraden mot just våra luckor är uppmätt, inte gissad: 49 av 50 slumpvis
valda adresser som OSM saknade fanns i tjänsten, 98 %.

────────────────────────────────────────────────────────────────────────────
LICENSEN ÄR INTE KLARLAGD, OCH DÄRFÖR ÄR KÄLLAN AVSTÄNGD SOM FÖRVAL
────────────────────────────────────────────────────────────────────────────
Lagret svarar öppet, men det är inte samma sak som att det är öppna data:

  * `copyrightText` är TOMT på både MapServer och FeatureServer.
  * Lagret finns INTE i kommunens öppna data-katalog (opendata.uppsala.se,
    34 datamängder, ingen av dem adresser).
  * Uppsala kommun finns inte bland utgivarna av adressdatamängder på
    dataportal.se.
  * Kommunens PSI-sida säger att deras information får spridas, göras om och
    byggas vidare på, men namnger ingen licens och nämner inte lagret.

Att en tjänst går att anropa säger ingenting om vad svaret får användas
till. Vi publicerar koordinater om namngivna verksamheter på en kommersiell
sajt, och det ska vila på ett besked och inte på en tolkning.

DÄRFÖR: källan väljs aldrig av `auto`. Den måste begäras uttryckligen med
`--kalla uppsala`, och den ska inte skrivas till site/src/data förrän ägaren
fått skriftligt svar från opendata@uppsala.se på två frågor:

    1. Får adresslagret i aGenerell/Adresser återanvändas, och under vilken
       licens?
    2. Vilken attributionstext vill kommunen se?

Svaret fyller i PROVENANCE nedan. Tills dess står `licence` som okänd, och
geocode.py vägrar skriva ett licensblock som påstår något vi inte vet.
"""

from __future__ import annotations

import json
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Dict, Iterator, List, Optional

from .geo import looks_like_sweden
from .geocode import SOURCE_UPPSALA, AddressIndex, Municipality, parse_address

SERVICE = (
    "https://kartportal.uppsala.se/mapping/rest/services"
    "/aGenerell/Adresser/FeatureServer/0"
)

#: Tjänstens eget tak per svar. Står som maxRecordCount i lagrets metadata
#: och läses därifrån vid hämtning; värdet här är bara reserven.
PAGE_SIZE = 1000

#: Adressplatser som inte är i bruk. `AddressStatus` är 1 för gällande
#: adresser i hela det uttag vi mätt. Ett annat värde betyder att kommunen
#: markerat adressen på något sätt, och då vet vi inte vad den betyder.
#: Hellre hoppa över den än sätta en nål på en adress som kanske är
#: planerad, indragen eller ersatt — samma linje som Lantmäteriets
#: "Reserverad", se lantmateriet.py.
STATUS_IN_USE = 1

#: Uppsala kommuns utsträckning, som rimlighetsram. Samma ram som
#: geocode.MUNICIPALITIES redan använder för kommunen, och den står kvar
#: oförändrad med flit: de 986 koordinater som redan är publicerade är satta
#: mot just den, och en ny ram kunde ha kastat eller släppt in träffar som en
#: bieffekt i stället för som ett beslut.
MUNICIPALITY_CODE = "0380"


def page_url(offset: int, page_size: int) -> str:
    """En sida ur lagret, som GeoJSON i WGS84.

    `orderByFields=OBJECTID` är inte kosmetik. Utan en uttalad sortering får
    ArcGIS lämna raderna i vilken ordning som helst mellan två anrop, och då
    kan `resultOffset` både hoppa över och upprepa rader. Sorterat blir
    sidindelningen stabil och hämtningen reproducerbar.
    """
    query = urllib.parse.urlencode(
        {
            "where": "1=1",
            "outFields": "Name,PostCode,PostCity,AddressStatus",
            "returnGeometry": "true",
            "outSR": "4326",
            "orderByFields": "OBJECTID",
            "resultOffset": offset,
            "resultRecordCount": page_size,
            "f": "json",
        }
    )
    return f"{SERVICE}/query?{query}"


def parse_features(payload: dict) -> Iterator[tuple]:
    """Plocka (adress, lat, lng, status) ur ett ArcGIS-svar.

    Rader utan geometri eller utan `Name` hoppas över. De pekar inte ut något
    och ska inte tolkas till något.
    """
    for feature in payload.get("features") or []:
        attributes = feature.get("attributes") or {}
        geometry = feature.get("geometry") or {}
        name = (attributes.get("Name") or "").strip()
        lat, lng = geometry.get("y"), geometry.get("x")
        if not name or lat is None or lng is None:
            continue
        yield name, float(lat), float(lng), attributes.get("AddressStatus")


def build_index(pages: Iterator[dict]) -> AddressIndex:
    """Bygg ett uppslagbart index ur tjänstens sidor.

    `Name` bär gata och nummer ihopskrivet ("Kungsgatan 19", "Hagby 304").
    Uppdelningen görs med samma parse_address som kommunernas adressrader
    läses med, så att båda sidor av uppslaget delas upp likadant. Går raden
    inte att dela upp är den ingen adressplats och ska inte in i indexet.

    En punkt utanför Sverige är ett fel i tjänsten eller i vår tolkning av
    dess koordinatordning, och släpps aldrig in. Samma spärr som
    lantmateriet.build_index.
    """
    index = AddressIndex(source=SOURCE_UPPSALA)
    for payload in pages:
        for name, lat, lng, status in parse_features(payload):
            if status is not None and status != STATUS_IN_USE:
                continue
            address = parse_address(name)
            if address is None:
                continue
            if not looks_like_sweden(lat, lng):
                continue
            index.add(address.street, address.number, address.letter, lat, lng)
    return index


def read_extract(path: Path) -> Iterator[dict]:
    """Läs det sparade uttaget, en sida i taget."""
    stored = json.loads(path.read_text(encoding="utf-8"))
    for page in stored.get("pages") or []:
        yield page


def extract_path(directory: Path) -> Path:
    return directory / f"uppsala_adresser_{MUNICIPALITY_CODE}.json"


def load_metadata(path: Path) -> Dict:
    stored = json.loads(path.read_text(encoding="utf-8"))
    return {k: v for k, v in stored.items() if k != "pages"}
