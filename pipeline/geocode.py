#!/usr/bin/env python3
"""Sätt koordinater på verksamheter vars kommun inte publicerar några.

    python3 pipeline/geocode.py site/src/data/uppsala.json site/src/data/orebro.json

Skriver lat/lng samt geoSource/geoPrecision i datafilen och sparar varje
uppslag i pipeline/geocode_cache.json. Nästa körning läser cachen och rör
inte nätet — adresser ändras sällan, och att fråga om samma sak varje natt är
varken snabbt eller artigt.

    --kalla     auto (förvalt), lantmateriet, osm eller uppsala
    --refresh   räkna om uppslagen även för adresser som finns i cachen
    --torrkor   räkna ut täckningen men skriv varken datafil eller cache

TRE ADRESSKÄLLOR
----------------
`auto` väljer Lantmäteriets belägenhetsadresser när kommunens GeoPackage-fil
ligger i data/interim/, annars OpenStreetMap. Registret är Sveriges
officiella adressregister och är fullständigt där OSM är ojämn, så ordningen
är inte förhandlingsbar: OSM är reserven, inte förstahandsvalet.

    OpenStreetMap    ODbL 1.0, © OpenStreetMap contributors.
                     Hämtas med två Overpass-frågor i stället för tusentals
                     uppslag mot en geokodningstjänst. Se prikko/geocode.py.

    Lantmäteriet     CC BY 4.0, © Lantmäteriet. Kräver behörighet i
                     Geotorget. Se prikko/lantmateriet.py och
                     fetch_belagenhetsadresser.py.

    Uppsala kommun   LICENS INTE KLARLAGD. Öppen tjänst med 56 150
                     adresspunkter som skulle ta Uppsala från 986 till
                     1 523 nålar, men lagret bär ingen licensuppgift och
                     ligger inte i kommunens öppna data-katalog. Väljs
                     ALDRIG av `auto`, och main() vägrar skriva dess
                     koordinater till en datafil så länge licensen är
                     okänd. Se prikko/uppsalaadresser.py för vad ägaren
                     behöver få svar på, och kör med --torrkor så länge.

Alla kräver attribution där koordinaten visas, och sidan ska kunna säga
vilken av dem en enskild nål kommer ur. Därför bär varje verksamhet sitt
`geoSource`, och datafilens `geocoding` bär källans licens och attribution.

VILKA KOMMUNER SOM GÅR ATT GEOKODA
----------------------------------
Bara de som publicerar en GATUADRESS. Uppmätt 2026-08-27 över samtliga
adressrader i site/src/data, kolumnen "med husnummer" räknad med
parse_address:

    kommun       verksamheter   med husnummer   nål   varav ur rapport
    Örebro           1 233          1 233        645          0
    Uppsala          1 854          1 525        986          0
    Borgholm           406              0          0          0
    Höganäs            316            243         79         79
    Svenljunga          99              0          0          0
    Lomma              153              0          0          0

Höganäs 243 kommer inte ur listsidan, som bär noll gatuadresser, utan ur
kommunens rapport-PDF:er. Se avsnittet längre ned.

Borgholm, Höganäs och Svenljunga publicerar en ORT och inget mer: 22, 13 och
11 distinkta ortnamn på 439 rader, och inte en enda av de 439 innehåller så
mycket som en siffra. Lomma publicerar varken ort eller adress; kommunens
fyra listsidor lästes om 2026-08-18 och bär namn, färg, datum och avvikelser,
inget annat. Den enda gatuadressen på sidorna är kommunens egen
besöksadress i sidfoten.

En ortmittpunkt vore inte ett närmevärde utan en gissning. Färjestaden och
Byxelkrok är kilometer breda, och en nål i ortens mitt är fel adress för
nästan varje verksamhet. Samma linje som saknat husnummer följer, se
parse_address: utan nummer finns ingen punkt att peka på.

ADRESSER UR KOMMUNENS EGNA RAPPORTER
------------------------------------
Tabellen ovan mäter LISTSIDAN, och för Höganäs är listsidan inte allt
kommunen publicerar. Rapport-PDF:en bär gatuadressen, och den läses numera
ut av pipeline/fetch_rapportadresser.py till rapportadresser.json. Saknar en
verksamhets egen adressrad husnummer slås den adressen upp i stället. Se
prikko/rapportadress.py för vilken av rapportens två adresser som får läsas.

Uppslaget använder alltså kommunens uppgift om VAR verksamheten ligger, och
koordinaten kommer fortfarande ur OSM eller Lantmäteriet. `geoSource` bär
därför koordinatens källa som förut, medan rapportadresser.json bär vilken
rapport adressen kom ur. Tillsammans svarar de på var punkten kommer ifrån.

För Borgholm, Lomma och Svenljunga hjälper ingen adresskälla i världen: en
post som bara säger "Böda" pekar inte ut något hus. Där måste kommunen börja
lämna ut adressen. För Svenljunga gäller dessutom att OSM inte har en enda
adresspunkt i hela kommunen (uppmätt via Overpass 2026-08-18: noll noder och
noll vägar med addr:housenumber), så även med adresser hade Lantmäteriet
krävts.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko import lantmateriet, uppsalaadresser  # noqa: E402
from prikko.geocode import (  # noqa: E402
    MATCHED,
    MISS_NO_ADDRESS,
    MISS_UNPARSEABLE,
    MUNICIPALITIES,
    SOURCE_LANTMATERIET,
    SOURCE_OSM,
    SOURCE_UPPSALA,
    AddressIndex,
    Lookup,
    Match,
    cache_key,
    parse_address,
    verify,
)

#: Varifrån adressen som slogs upp kom. Inte samma sak som `geoSource`, som
#: säger var KOORDINATEN kom ifrån. En verksamhet i Höganäs har adressen ur
#: kommunens rapport och koordinaten ur OSM, och båda leden ska gå att läsa.
ADDRESS_FROM_LISTING = "listing"
ADDRESS_FROM_REPORT = "report"

#: Räknare som beskriver körningen i stället för utfallet för en verksamhet.
#: Prefixet håller dem UTANFÖR summan "N av M fick koordinat": varje
#: verksamhet bidrar med exakt ett utfallsskäl, och en upplysning som
#: räknades med i nämnaren gjorde 316 verksamheter till 559.
INFO_FROM_REPORT = "info:address_from_report"

#: Vad datafilens `geocoding` ska säga om respektive källa. Licensen och
#: attributionen står här och ingen annanstans, så att en fil aldrig kan bära
#: fel villkor för sina koordinater.
PROVENANCE = {
    SOURCE_OSM: {
        "method": "derived",
        "source": "OpenStreetMap via Overpass API",
        "licence": "ODbL 1.0",
        "attribution": "© OpenStreetMap contributors",
    },
    SOURCE_LANTMATERIET: {
        "method": "derived",
        "source": "Lantmäteriet, Belägenhetsadress Nedladdning, vektor",
        "licence": "CC BY 4.0",
        "attribution": "© Lantmäteriet",
    },
    # Licensen är INTE klarlagd, se prikko/uppsalaadresser.py. Posten står
    # här med okänd licens och inte med en gissad, och main() vägrar skriva
    # den till en datafil. Fyll i den när kommunen svarat, inte innan.
    SOURCE_UPPSALA: {
        "method": "derived",
        "source": "Uppsala kommun, adresslager (kartportal.uppsala.se)",
        "licence": None,
        "attribution": "Uppsala kommun",
    },
}

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"

# Två speglar. Overpass svarar 504 när servern är hårt lastad; det är normalt
# och ska inte stoppa körningen.
ENDPOINTS = (
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
)

ROOT = Path(__file__).resolve().parent
CACHE_FILE = ROOT / "geocode_cache.json"
#: Adresser utlästa ur kommunernas egna rapporter, för de verksamheter vars
#: listrad saknar husnummer. Skrivs av fetch_rapportadresser.py.
OVERLAY_FILE = ROOT / "rapportadresser.json"
# Mellanfiler, inte källdata. Ligger utanför versionshanteringen: de är stora,
# de är utdrag ur någon annans datamängd, och de går att hämta igen.
EXTRACT_DIR = ROOT / "data" / "interim"

CACHE_NOTE = (
    "Härledda koordinater. Källor: OpenStreetMap (ODbL) via Overpass och "
    "Lantmäteriets belägenhetsadresser (CC BY 4.0). Nyckel: "
    "<kommunkod>|<normaliserad adress> för OSM, <kommunkod>|<källa>|"
    "<normaliserad adress> för övriga. Poster utan lat/lng är medvetet "
    "tomma — se reason. Regenereras med pipeline/geocode.py."
)


def overpass(query: str, tries: int = 6) -> dict:
    body = urllib.parse.urlencode({"data": query}).encode("utf-8")
    last = "okänt fel"
    for attempt in range(tries):
        url = ENDPOINTS[attempt % len(ENDPOINTS)]
        request = urllib.request.Request(url, data=body, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(request, timeout=900) as response:
                raw = response.read().decode("utf-8", "replace")
            if raw.lstrip().startswith("{"):
                return json.loads(raw)
            last = raw.strip()[:200]
        except urllib.error.HTTPError as exc:
            last = f"HTTP {exc.code}"
        except Exception as exc:  # noqa: BLE001
            last = repr(exc)
        wait = 10 * (attempt + 1)
        print(f"  Overpass svarade inte ({last}); väntar {wait} s", file=sys.stderr)
        time.sleep(wait)
    raise SystemExit(f"Overpass gav inget svar: {last}")


def fetch_extract(code: str) -> tuple:
    """Hämta kommunens adresspunkter och dess omslutande rektangel.

    En fråga, inte en per adress. Rektangeln följer med i samma hämtning
    eftersom kommungränsen ändå slås upp för att avgränsa adressfrågan, och
    den blir kommunens rimlighetsram. Se `build_index`.

    Uttag hämtade före rektangeln fanns saknar den i filen. Då returneras
    None, och ramen får komma från MUNICIPALITIES i stället. Att kasta de
    cachade uttagen hade tvingat fram två hämtningar av 5,5 MB utan att en
    enda koordinat blivit bättre.
    """
    EXTRACT_DIR.mkdir(parents=True, exist_ok=True)
    path = EXTRACT_DIR / f"osm_addresses_{code}.json"
    if path.exists():
        stored = json.loads(path.read_text(encoding="utf-8"))
        return stored["elements"], stored.get("bbox")

    print(f"  hämtar adresspunkter för kommun {code} från Overpass", file=sys.stderr)
    # Kommungränsen slås upp på SCB-koden i stället för på namnet: namn ändras,
    # koden gör det inte. admin_level 7 är kommun i Sverige.
    boundary = overpass(
        f'[out:json][timeout:180];relation["ref:scb"="{code}"]["admin_level"="7"];out ids bb;'
    )
    relations = boundary.get("elements") or []
    if len(relations) != 1:
        raise SystemExit(f"Hittade {len(relations)} kommungränser för {code}, väntade en.")
    area = 3600000000 + relations[0]["id"]
    edges = relations[0].get("bounds") or {}
    bbox = (
        [edges["minlon"], edges["minlat"], edges["maxlon"], edges["maxlat"]]
        if edges
        else None
    )

    payload = overpass(
        f'[out:json][timeout:600];'
        f'(node["addr:housenumber"](area:{area});way["addr:housenumber"](area:{area}););'
        f"out center tags;"
    )
    payload["bbox"] = bbox
    path.write_text(json.dumps(payload), encoding="utf-8")
    return payload["elements"], bbox


def load_cache() -> dict:
    if not CACHE_FILE.exists():
        return {}
    stored = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    return stored.get("entries", {})


def save_cache(entries: dict) -> None:
    CACHE_FILE.write_text(
        json.dumps(
            {
                "note": CACHE_NOTE,
                "source": "OpenStreetMap via Overpass API",
                "licence": "ODbL 1.0 — attribution krävs",
                "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "entries": dict(sorted(entries.items())),
            },
            ensure_ascii=False,
            indent=2,
            sort_keys=False,
        )
        + "\n",
        encoding="utf-8",
    )


def insert_after(mapping: dict, after: str, key: str, value) -> dict:
    """Returnera en kopia där `key` ligger direkt efter `after`.

    JSON bevarar nyckelordningen i filen. Nya fält som hamnar sist i posten
    gör diffen svårläst; koordinatens ursprung hör hemma bredvid koordinaten.
    """
    rebuilt = {}
    for existing, current in mapping.items():
        if existing == key:
            continue
        rebuilt[existing] = current
        if existing == after:
            rebuilt[key] = value
    if key not in rebuilt:
        rebuilt[key] = value
    return rebuilt


def set_after(mapping: dict, after: str, key: str, value) -> None:
    """Som insert_after, men på plats."""
    rebuilt = insert_after(mapping, after, key, value)
    mapping.clear()
    mapping.update(rebuilt)


def forget(establishment: dict) -> None:
    """Nolla koordinaten helt.

    Körningen ska vara bestämd av cachen och ingenting annat. Skärps en regel
    måste en koordinat som satts av en tidigare, slappare regel försvinna —
    annars blir filen ett lager av gamla beslut som ingen kan härleda.
    """
    establishment["lat"] = None
    establishment["lng"] = None
    establishment.pop("geoSource", None)
    establishment.pop("geoPrecision", None)


def resolve(
    index: AddressIndex,
    raw: Optional[str],
    municipality,
    allow_neighbour: bool = True,
) -> tuple[Optional[Match], str]:
    """Slå upp en adress och verifiera träffen innan den får finnas."""
    if not raw or not raw.strip():
        return None, MISS_NO_ADDRESS
    address = parse_address(raw)
    if address is None:
        return None, MISS_UNPARSEABLE

    result: Lookup = index.lookup(address, allow_neighbour=allow_neighbour)
    if result.match is None:
        return None, result.reason

    rejected = verify(result.match, municipality)
    if rejected:
        return None, rejected
    return result.match, MATCHED


def uppsala_index(refresh: bool):
    """Index och ram ur Uppsala kommuns eget adresslager."""
    path = uppsalaadresser.extract_path(EXTRACT_DIR)
    if not path.exists():
        raise SystemExit(
            f"Saknar {path}. Hämta uttaget först:\n"
            f"    python3 pipeline/fetch_uppsalaadresser.py"
        )
    metadata = uppsalaadresser.load_metadata(path)
    index = uppsalaadresser.build_index(uppsalaadresser.read_extract(path))
    print(
        f"  Uppsala: {index.points} adresspunkter på {index.streets} gator "
        f"(uttag {metadata.get('fetchedAt')})",
        file=sys.stderr,
    )
    return index, MUNICIPALITIES[uppsalaadresser.MUNICIPALITY_CODE]


def choose_source(code: str, requested: str) -> str:
    """Vilken adresskälla körningen ska använda för kommunen.

    `auto` tar Lantmäteriet när filen finns. Ber någon uttryckligen om
    Lantmäteriet och filen saknas ska körningen STANNA, inte tyst falla
    tillbaka på OSM: skillnaden syns i datafilen som en annan licens och en
    annan attribution, och den ska aldrig bytas bakom ryggen på den som körde.
    """
    gpkg, _ = lantmateriet.extract_dir_paths(EXTRACT_DIR, code)
    if requested == SOURCE_LANTMATERIET:
        if not gpkg.exists():
            raise SystemExit(
                f"Saknar {gpkg}. Hämta den först:\n"
                f"    python3 pipeline/fetch_belagenhetsadresser.py {code}"
            )
        return SOURCE_LANTMATERIET
    if requested == SOURCE_OSM:
        return SOURCE_OSM
    if requested == SOURCE_UPPSALA:
        if code != uppsalaadresser.MUNICIPALITY_CODE:
            raise SystemExit(
                f"--kalla uppsala gäller bara Uppsala kommun "
                f"({uppsalaadresser.MUNICIPALITY_CODE}), inte {code}."
            )
        return SOURCE_UPPSALA
    # `auto` väljer ALDRIG Uppsalas lager. Se prikko/uppsalaadresser.py:
    # tjänsten är öppen men licensen är inte klarlagd, och en källa vars
    # villkor vi inte känner ska inte kunna smyga in i ett nattligt bygge.
    return SOURCE_LANTMATERIET if gpkg.exists() else SOURCE_OSM


def build_index(code: str, source: str, refresh: bool):
    """Bygg adressindexet och den rimlighetsram träffarna prövas mot."""
    if source == SOURCE_UPPSALA:
        return uppsala_index(refresh)

    if source == SOURCE_LANTMATERIET:
        gpkg, metadata_path = lantmateriet.extract_dir_paths(EXTRACT_DIR, code)
        metadata = lantmateriet.load_metadata(metadata_path)
        index = lantmateriet.build_index(gpkg)
        print(
            f"  Lantmäteriet: {index.points} adresspunkter på {index.streets} "
            f"adressområden (uttag {metadata.get('updated')})",
            file=sys.stderr,
        )
        # Kommunens egen utsträckning ur uttaget slår en handskriven radie.
        return index, lantmateriet.bounds_from_stac(code, metadata["bbox"])

    if refresh:
        stale = EXTRACT_DIR / f"osm_addresses_{code}.json"
        if stale.exists():
            stale.unlink()
    elements, bbox = fetch_extract(code)
    index = AddressIndex.from_overpass(elements)

    # Ramen som träffarna prövas mot. Kommungränsens omslutande rektangel
    # kommer ur samma hämtning som adresserna och beskriver kommunens
    # faktiska utsträckning, så den slår en handskriven mittpunkt med radie
    # satt på höft. Samma resonemang som lantmateriet.bounds_from_stac, och
    # samma funktion gör arbetet.
    #
    # MUNICIPALITIES går före när den har kommunen. Uppsalas och Örebros
    # 1 611 koordinater är satta mot just de ramarna, och en ny ram hade
    # kunnat släppa in eller kasta träffar som redan är publicerade. En
    # ändring av vilka nålar som finns ska vara ett beslut, inte en bieffekt
    # av att uttaget hämtats om.
    municipality = MUNICIPALITIES.get(code)
    if municipality is None:
        if bbox is None:
            raise SystemExit(
                f"Kommun {code} har varken en mittpunkt i prikko/geocode.py eller en\n"
                f"kommungräns i uttaget. Hämta om uttaget:\n"
                f"    rm {EXTRACT_DIR / f'osm_addresses_{code}.json'}"
            )
        municipality = lantmateriet.bounds_from_stac(code, bbox)
        print(
            f"  ram ur kommungränsen: {municipality.radius_km} km från "
            f"{municipality.lat}, {municipality.lng}",
            file=sys.stderr,
        )

    print(
        f"  OSM: {index.points} adresspunkter på {index.streets} gator",
        file=sys.stderr,
    )
    return index, municipality


def load_overlay(code: str) -> dict:
    """Adresser ur kommunens egna rapporter, för en kommun.

    Tom ordbok när filen saknas. Steget är frivilligt: en pipeline som aldrig
    kört fetch_rapportadresser.py ska geokoda precis som förut, inte stanna.
    """
    if not OVERLAY_FILE.exists():
        return {}
    stored = json.loads(OVERLAY_FILE.read_text(encoding="utf-8"))
    municipality = (stored.get("municipalities") or {}).get(code) or {}
    return municipality.get("entries") or {}


def effective_address(establishment: dict, overlay: dict) -> tuple:
    """Adressen som ska slås upp, och varifrån den kom.

    Verksamhetens EGEN adressrad går alltid först. Rapportadressen träder in
    bara när den raden inte pekar ut en adressplats, alltså när den saknas
    eller saknar husnummer ("Viken"). Ordningen är inte förhandlingsbar:
    listsidan är kommunens aktuella uppgift, rapporten är ett ögonblick i
    det förflutna, och en verksamhet som flyttat ska följa listsidan.
    """
    raw = establishment.get("address")
    if parse_address(raw) is not None:
        return raw, ADDRESS_FROM_LISTING
    extra = overlay.get(establishment.get("id")) or {}
    candidate = extra.get("address")
    if candidate and parse_address(candidate) is not None:
        return candidate, ADDRESS_FROM_REPORT
    return raw, ADDRESS_FROM_LISTING


def process(
    path: Path, entries: dict, refresh: bool, requested: str, dry_run: bool = False
) -> Counter:
    payload = json.loads(path.read_text(encoding="utf-8"))
    code = payload["municipality"]["code"]
    name = payload["municipality"]["name"]
    establishments = payload["establishments"]

    source = choose_source(code, requested)
    overlay = load_overlay(code)
    print(f"{name}: {len(establishments)} verksamheter, källa {source}", file=sys.stderr)
    if overlay:
        print(f"  {len(overlay)} adresser ur kommunens rapporter", file=sys.stderr)

    unknown = {
        cache_key(code, address, source)
        for address, _ in (effective_address(e, overlay) for e in establishments)
        if address and cache_key(code, address, source) not in entries
    }

    index: Optional[AddressIndex] = None
    municipality = None
    if unknown or refresh:
        index, municipality = build_index(code, source, refresh)
    else:
        print("  alla adresser fanns i cachen — inga nätanrop", file=sys.stderr)

    # Lantmäteriets register är fullständigt. Saknas numret finns adressen
    # inte, och grannporten är då inte ett närmevärde utan ett annat hus.
    allow_neighbour = source == SOURCE_OSM

    stats: Counter = Counter()
    now = datetime.now(timezone.utc).date().isoformat()

    for establishment in establishments:
        raw, origin = effective_address(establishment, overlay)
        if not raw or not raw.strip():
            stats[MISS_NO_ADDRESS] += 1
            forget(establishment)
            continue
        if origin == ADDRESS_FROM_REPORT:
            stats[INFO_FROM_REPORT] += 1

        key = cache_key(code, raw, source)
        cached = entries.get(key)
        if cached is None or refresh:
            assert index is not None
            match, reason = resolve(index, raw, municipality, allow_neighbour)
            cached = {
                "lat": match.lat if match else None,
                "lng": match.lng if match else None,
                "precision": match.precision if match else None,
                "source": match.source if match else None,
                "reason": reason,
                "resolvedAt": now,
            }
            entries[key] = cached

        stats[cached["reason"]] += 1
        if cached["lat"] is None:
            forget(establishment)
            continue

        establishment["lat"] = cached["lat"]
        establishment["lng"] = cached["lng"]
        # Koordinaten är HÄRLEDD ur adressen, inte publicerad av kommunen.
        # Sidan ska kunna säga det, och en senare körning ska aldrig kunna
        # förväxla den med en koordinat vi fått i källan.
        set_after(establishment, "lng", "geoSource", cached["source"])
        set_after(establishment, "geoSource", "geoPrecision", cached["precision"])
        stats[f"precision:{cached['precision']}"] += 1

    # Licensblocket skrivs bara när filen faktiskt bär en härledd koordinat.
    # En ODbL-klausul i en fil utan en enda nål är ett påstående om data som
    # inte finns, och i tre av tolv kommuner är det just läget: Borgholm,
    # Lomma och Svenljunga publicerar ingen gatuadress någonstans, så noll av
    # deras adressrader går att slå upp. Samma regel som
    # pipeline/oppettider.py skriver sitt block efter.
    if stats[MATCHED]:
        block = {
            **PROVENANCE[source],
            "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        }
        # Kom någon adress ur en rapport ska filen säga det. Blocket beskriver
        # annars bara var KOORDINATEN kommer ifrån, och för Höganäs vore det
        # halva svaret: punkten är OSM:s, men adressen som pekade ut den är
        # kommunens egen uppgift ur kontrollrapporten.
        if stats[INFO_FROM_REPORT]:
            block["addressSource"] = (
                f"{stats[INFO_FROM_REPORT]} adresser utlästa ur kommunens "
                "kontrollrapporter, se pipeline/rapportadresser.json"
            )
        payload = insert_after(payload, "source", "geocoding", block)
    else:
        payload.pop("geocoding", None)
    if dry_run:
        print("  torrkörning — datafilen rördes inte", file=sys.stderr)
        return stats

    # En källa utan känd licens får aldrig bli en publicerad koordinat. Det
    # här är den sista spärren, efter att `auto` redan vägrat välja den:
    # den som skriver --kalla uppsala ska mötas av ett besked och inte av en
    # datafil som tyst börjat bära någon annans data.
    if stats[MATCHED] and PROVENANCE[source].get("licence") is None:
        raise SystemExit(
            f"Källan {source!r} har ingen klarlagd licens, så koordinaterna ur "
            f"den får inte skrivas till {path.name}.\n"
            "Kör med --torrkor för att mäta vad den skulle ge, och se\n"
            "prikko/uppsalaadresser.py för vad ägaren behöver få svar på."
        )

    # indent=1 och ingen avslutande radbrytning — samma form som fetch_*.py
    # skriver, så att diffen visar koordinaterna och inget annat.
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    return stats


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("files", nargs="+", type=Path)
    parser.add_argument(
        "--kalla",
        choices=("auto", SOURCE_LANTMATERIET, SOURCE_OSM, SOURCE_UPPSALA),
        default="auto",
        help="adresskälla; auto tar Lantmäteriet när uttaget finns",
    )
    parser.add_argument(
        "--torrkor",
        action="store_true",
        help="räkna ut täckningen men skriv varken datafil eller cache",
    )
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="räkna om uppslagen även för adresser som redan finns i cachen",
    )
    args = parser.parse_args()

    entries = load_cache()
    for path in args.files:
        stats = process(path, entries, args.refresh, args.kalla, args.torrkor)
        total = sum(
            v
            for k, v in stats.items()
            if not k.startswith(("precision:", "info:"))
        )
        placed = stats[MATCHED]
        share = f" ({placed / total:.0%})" if total else ""
        print(f"  {placed} av {total} fick koordinat{share}", file=sys.stderr)
        for reason, count in sorted(stats.items()):
            print(f"    {reason}: {count}", file=sys.stderr)
        # Cachen sparas inte vid torrkörning. En mätning ska kunna göras mot
        # en källa vi kanske inte får använda utan att dess svar blir kvar i
        # en versionshanterad fil.
        if not args.torrkor:
            save_cache(entries)

    print(f"Cache: {len(entries)} adresser i {CACHE_FILE}", file=sys.stderr)


if __name__ == "__main__":
    main()
