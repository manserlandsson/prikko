#!/usr/bin/env python3
"""Sätt koordinater på verksamheter vars kommun inte publicerar några.

    python3 pipeline/geocode.py site/src/data/uppsala.json site/src/data/orebro.json

Skriver lat/lng samt geoSource/geoPrecision i datafilen och sparar varje
uppslag i pipeline/geocode_cache.json. Nästa körning läser cachen och rör
inte nätet — adresser ändras sällan, och att fråga om samma sak varje natt är
varken snabbt eller artigt.

    --refresh   hämta om kommunens adresspunkter från Overpass

Källa och villkor är beskrivna i prikko/geocode.py. Kort: OpenStreetMap under
ODbL, hämtat med två Overpass-frågor i stället för tusentals uppslag mot en
geokodningstjänst, och attribution krävs där koordinaten visas.
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

from prikko.geocode import (  # noqa: E402
    MATCHED,
    MISS_NO_ADDRESS,
    MISS_UNPARSEABLE,
    MUNICIPALITIES,
    AddressIndex,
    Lookup,
    Match,
    cache_key,
    parse_address,
    verify,
)

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"

# Två speglar. Overpass svarar 504 när servern är hårt lastad; det är normalt
# och ska inte stoppa körningen.
ENDPOINTS = (
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
)

ROOT = Path(__file__).resolve().parent
CACHE_FILE = ROOT / "geocode_cache.json"
# Mellanfil, inte källdata. Ligger utanför versionshanteringen: den är stor,
# den är ett ODbL-utdrag, och den går att hämta igen.
EXTRACT_DIR = ROOT / "data" / "interim"

CACHE_NOTE = (
    "Härledda koordinater. Källa: OpenStreetMap (ODbL), hämtat via Overpass. "
    "Nyckel: <kommunkod>|<normaliserad adress>. Poster utan lat/lng är "
    "medvetet tomma — se reason. Regenereras med pipeline/geocode.py."
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


def fetch_extract(code: str) -> list:
    """Hämta kommunens adresspunkter. En fråga, inte en per adress."""
    EXTRACT_DIR.mkdir(parents=True, exist_ok=True)
    path = EXTRACT_DIR / f"osm_addresses_{code}.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))["elements"]

    print(f"  hämtar adresspunkter för kommun {code} från Overpass", file=sys.stderr)
    # Kommungränsen slås upp på SCB-koden i stället för på namnet: namn ändras,
    # koden gör det inte. admin_level 7 är kommun i Sverige.
    boundary = overpass(
        f'[out:json][timeout:180];relation["ref:scb"="{code}"]["admin_level"="7"];out ids;'
    )
    relations = boundary.get("elements") or []
    if len(relations) != 1:
        raise SystemExit(f"Hittade {len(relations)} kommungränser för {code}, väntade en.")
    area = 3600000000 + relations[0]["id"]

    payload = overpass(
        f'[out:json][timeout:600];'
        f'(node["addr:housenumber"](area:{area});way["addr:housenumber"](area:{area}););'
        f"out center tags;"
    )
    path.write_text(json.dumps(payload), encoding="utf-8")
    return payload["elements"]


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


def resolve(index: AddressIndex, raw: Optional[str], municipality) -> tuple[Optional[Match], str]:
    """Slå upp en adress och verifiera träffen innan den får finnas."""
    if not raw or not raw.strip():
        return None, MISS_NO_ADDRESS
    address = parse_address(raw)
    if address is None:
        return None, MISS_UNPARSEABLE

    result: Lookup = index.lookup(address)
    if result.match is None:
        return None, result.reason

    rejected = verify(result.match, municipality)
    if rejected:
        return None, rejected
    return result.match, MATCHED


def process(path: Path, entries: dict, refresh: bool) -> Counter:
    payload = json.loads(path.read_text(encoding="utf-8"))
    code = payload["municipality"]["code"]
    name = payload["municipality"]["name"]
    establishments = payload["establishments"]

    municipality = MUNICIPALITIES.get(code)
    if municipality is None:
        raise SystemExit(f"Ingen mittpunkt definierad för kommun {code}; se prikko/geocode.py")

    print(f"{name}: {len(establishments)} verksamheter", file=sys.stderr)

    if refresh:
        stale = EXTRACT_DIR / f"osm_addresses_{code}.json"
        if stale.exists():
            stale.unlink()

    unknown = {
        cache_key(code, e["address"])
        for e in establishments
        if e.get("address") and cache_key(code, e["address"]) not in entries
    }

    index: Optional[AddressIndex] = None
    if unknown or refresh:
        index = AddressIndex.from_overpass(fetch_extract(code))
        print(
            f"  OSM: {index.points} adresspunkter på {index.streets} gator",
            file=sys.stderr,
        )
    else:
        print("  alla adresser fanns i cachen — inga nätanrop", file=sys.stderr)

    stats: Counter = Counter()
    now = datetime.now(timezone.utc).date().isoformat()

    for establishment in establishments:
        raw = establishment.get("address")
        if not raw or not raw.strip():
            stats[MISS_NO_ADDRESS] += 1
            forget(establishment)
            continue

        key = cache_key(code, raw)
        cached = entries.get(key)
        if cached is None:
            assert index is not None
            match, reason = resolve(index, raw, municipality)
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

    payload = insert_after(
        payload,
        "source",
        "geocoding",
        {
            "method": "derived",
            "source": "OpenStreetMap via Overpass API",
            "licence": "ODbL 1.0",
            "attribution": "© OpenStreetMap contributors",
            "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        },
    )
    # indent=1 och ingen avslutande radbrytning — samma form som fetch_*.py
    # skriver, så att diffen visar koordinaterna och inget annat.
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    return stats


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("files", nargs="+", type=Path)
    parser.add_argument(
        "--refresh", action="store_true", help="hämta om adresspunkterna från Overpass"
    )
    args = parser.parse_args()

    entries = load_cache()
    for path in args.files:
        stats = process(path, entries, args.refresh)
        total = sum(v for k, v in stats.items() if not k.startswith("precision:"))
        placed = stats[MATCHED]
        print(f"  {placed} av {total} fick koordinat", file=sys.stderr)
        for reason, count in sorted(stats.items()):
            print(f"    {reason}: {count}", file=sys.stderr)
        save_cache(entries)

    print(f"Cache: {len(entries)} adresser i {CACHE_FILE}", file=sys.stderr)


if __name__ == "__main__":
    main()
