#!/usr/bin/env python3
"""Sätt koordinater på verksamheter vars kommun inte publicerar några.

    python3 pipeline/geocode.py site/src/data/uppsala.json site/src/data/orebro.json

Skriver lat/lng samt geoSource/geoPrecision i datafilen och sparar varje
uppslag i pipeline/geocode_cache.json. Nästa körning läser cachen och rör
inte nätet — adresser ändras sällan, och att fråga om samma sak varje natt är
varken snabbt eller artigt.

    --kalla     auto (förvalt), lantmateriet eller osm
    --refresh   räkna om uppslagen även för adresser som finns i cachen

TVÅ ADRESSKÄLLOR
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

Båda kräver attribution där koordinaten visas, och sidan ska kunna säga
vilken av dem en enskild nål kommer ur. Därför bär varje verksamhet sitt
`geoSource`, och datafilens `geocoding` bär källans licens och attribution.
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

from prikko import lantmateriet  # noqa: E402
from prikko.geocode import (  # noqa: E402
    MATCHED,
    MISS_NO_ADDRESS,
    MISS_UNPARSEABLE,
    MUNICIPALITIES,
    SOURCE_LANTMATERIET,
    SOURCE_OSM,
    AddressIndex,
    Lookup,
    Match,
    cache_key,
    parse_address,
    verify,
)

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
    return SOURCE_LANTMATERIET if gpkg.exists() else SOURCE_OSM


def build_index(code: str, source: str, refresh: bool):
    """Bygg adressindexet och den rimlighetsram träffarna prövas mot."""
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


def process(path: Path, entries: dict, refresh: bool, requested: str) -> Counter:
    payload = json.loads(path.read_text(encoding="utf-8"))
    code = payload["municipality"]["code"]
    name = payload["municipality"]["name"]
    establishments = payload["establishments"]

    source = choose_source(code, requested)
    print(f"{name}: {len(establishments)} verksamheter, källa {source}", file=sys.stderr)

    unknown = {
        cache_key(code, e["address"], source)
        for e in establishments
        if e.get("address") and cache_key(code, e["address"], source) not in entries
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
        raw = establishment.get("address")
        if not raw or not raw.strip():
            stats[MISS_NO_ADDRESS] += 1
            forget(establishment)
            continue

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
    # inte finns, och i fyra av tolv kommuner är det just läget: Borgholm,
    # Höganäs, Lomma och Svenljunga publicerar ingen gatuadress, så noll av
    # deras 439 adressrader går att slå upp. Samma regel som
    # pipeline/oppettider.py skriver sitt block efter.
    if stats[MATCHED]:
        payload = insert_after(
            payload,
            "source",
            "geocoding",
            {
                **PROVENANCE[source],
                "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            },
        )
    else:
        payload.pop("geocoding", None)
    # indent=1 och ingen avslutande radbrytning — samma form som fetch_*.py
    # skriver, så att diffen visar koordinaterna och inget annat.
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    return stats


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("files", nargs="+", type=Path)
    parser.add_argument(
        "--kalla",
        choices=("auto", SOURCE_LANTMATERIET, SOURCE_OSM),
        default="auto",
        help="adresskälla; auto tar Lantmäteriet när uttaget finns",
    )
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="räkna om uppslagen även för adresser som redan finns i cachen",
    )
    args = parser.parse_args()

    entries = load_cache()
    for path in args.files:
        stats = process(path, entries, args.refresh, args.kalla)
        total = sum(v for k, v in stats.items() if not k.startswith("precision:"))
        placed = stats[MATCHED]
        share = f" ({placed / total:.0%})" if total else ""
        print(f"  {placed} av {total} fick koordinat{share}", file=sys.stderr)
        for reason, count in sorted(stats.items()):
            print(f"    {reason}: {count}", file=sys.stderr)
        save_cache(entries)

    print(f"Cache: {len(entries)} adresser i {CACHE_FILE}", file=sys.stderr)


if __name__ == "__main__":
    main()
