"""Mät gatubildstäckning mot Prikkos faktiska bestånd.

Underlag till docs/13_bilder_och_verksamhetsdata.md. Rapporten kunde inte
besvara den viktigaste frågan i den, nämligen hur stor andel av våra
verksamheter som har en Mapillary-bild nära nog att visa, eftersom
MAPILLARY_TOKEN i site/.env var tom.

Så här svarar du på den:

  1. Gratis konto på mapillary.com → Settings → Developers → skapa token.
  2. Klistra in den efter MAPILLARY_TOKEN= i site/.env.
  3. python3 pipeline/matt_bildtackning.py

Skriptet läser de exporterade kommunfilerna i site/src/data, tar ett slumpat
urval bland verksamheter som både har koordinat och en publikvänd typ, och
frågar Mapillary och Panoramax en punkt i taget. Ut kommer en täckningskurva
per maxavstånd och en fördelning per kommun.

Panoramax kräver ingen token och mäts alltid. Mapillary hoppas över utan token.

Tolkning av utfallet för Mapillary, inom 30 meter:

  över 40 %   bygg gatubildsvägen färdig, bästa affären i rapporten
  15 till 40  bygg den för storstäderna, planera sidan för att sakna bild
  under 15 %  lägg ned spåret, gå direkt på besökaruppladdning

Tar takten lugnt med avsikt. Båda tjänsterna är gratis och delade.
"""

from __future__ import annotations

import json
import math
import os
import random
import sys
import time
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "site" / "src" / "data"
ENV = ROOT / "site" / ".env"

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se)"

MAPILLARY = "https://graph.mapillary.com/images"
PANORAMAX = "https://api.panoramax.xyz/api/search"

#: Sökrutans halva sida i grader. 0.0014° ≈ 155 m i nord-sydlig led, alltså
#: vidare än vi någonsin skulle visa. Vi vill se hela kurvan, inte bara
#: träffarna innanför den gräns vi råkar ha valt i dag.
PAD = 0.0014

BUCKETS = (20, 30, 40, 60, 100, 150)

#: Typer där en fasadbild är önskvärd. Ett skolkök, ett huvudkontor eller en
#: matmäklare ska inte ha en bild och ska därför inte dra ner täckningen.
PUBLIK = (
    "restaurang", "café", "cafe", "servering", "pizzeria",
    "snabbmat", "bageri", "butik", "handel",
)


def token() -> str | None:
    """Mapillary-token från miljön, annars från site/.env."""
    value = os.environ.get("MAPILLARY_TOKEN")
    if value:
        return value.strip() or None
    if not ENV.exists():
        return None
    for line in ENV.read_text(encoding="utf-8").splitlines():
        if line.startswith("MAPILLARY_TOKEN="):
            return line.split("=", 1)[1].strip() or None
    return None


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


def fetch(url: str, timeout: int = 45) -> dict:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def urval(limit: int) -> list[dict]:
    """Slumpat urval bland publikvända verksamheter med koordinat."""
    rows: list[dict] = []
    for path in sorted(DATA.glob("*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        kommun = payload.get("municipality", {}).get("slug") or path.stem
        for e in payload.get("establishments", []):
            if e.get("lat") is None or e.get("lng") is None:
                continue
            types = " ".join(e.get("types") or []).lower()
            if not any(word in types for word in PUBLIK):
                continue
            rows.append({
                "kommun": kommun,
                "namn": e.get("name"),
                "lat": float(e["lat"]),
                "lng": float(e["lng"]),
            })
    random.Random(20260803).shuffle(rows)
    return rows[:limit]


def urval_per_kommun(per_kommun: int) -> list[dict]:
    """Lika många per kommun, i stället för proportionellt mot beståndet.

    Det vanliga urvalet är proportionellt, och Stockholm är 65 procent av de
    publikvända verksamheterna med koordinat. Ett urval om 400 ger därför fem
    rader i Oskarshamn och noll säkerhet om dem. Frågan "räcker Mapillary i
    en mindre ort" går alltså inte att besvara med det urvalet, och det är
    precis den frågan som avgör om en andra källa behövs.

    Här tas i stället högst `per_kommun` rader ur varje kommun. Talen per
    kommun blir jämförbara med varandra, och rikssiffran räknas om mot
    beståndet efteråt i stället för att läsas rakt av. Se `vikter`.
    """
    alla = urval(10**9)
    per: dict[str, list[dict]] = defaultdict(list)
    for rad in alla:
        per[rad["kommun"]].append(rad)
    ut: list[dict] = []
    for kommun in sorted(per):
        ut.extend(per[kommun][:per_kommun])
    return ut


def vikter() -> dict[str, int]:
    """Hur många publikvända verksamheter med koordinat varje kommun har.

    Används för att räkna om ett stratifierat urval till en rikssiffra: varje
    kommuns uppmätta andel vägs med sin verkliga storlek. Utan det blir
    Svenljunga lika tungt som Stockholm.
    """
    return Counter(rad["kommun"] for rad in urval(10**9))


def narmaste_mapillary(rad: dict, access_token: str) -> float | None:
    params = urllib.parse.urlencode({
        "access_token": access_token,
        "fields": "id,thumb_1024_url,captured_at,geometry",
        "bbox": ",".join(str(round(v, 6)) for v in (
            rad["lng"] - PAD, rad["lat"] - PAD, rad["lng"] + PAD, rad["lat"] + PAD,
        )),
        "limit": 50,
    })
    payload = fetch(f"{MAPILLARY}?{params}")
    best = None
    for item in payload.get("data", []):
        coords = (item.get("geometry") or {}).get("coordinates")
        if not coords or not item.get("thumb_1024_url"):
            continue
        d = distance_m(rad["lat"], rad["lng"], coords[1], coords[0])
        if best is None or d < best:
            best = d
    return best


def narmaste_panoramax(rad: dict) -> float | None:
    bbox = (rad["lng"] - PAD, rad["lat"] - PAD, rad["lng"] + PAD, rad["lat"] + PAD)
    url = f"{PANORAMAX}?bbox={','.join(f'{v:.6f}' for v in bbox)}&limit=50"
    payload = fetch(url)
    best = None
    for feature in payload.get("features", []):
        coords = feature["geometry"]["coordinates"]
        d = distance_m(rad["lat"], rad["lng"], coords[1], coords[0])
        if best is None or d < best:
            best = d
    return best


def rapportera(namn: str, total: int, traffar: Counter,
               per_kommun: dict, fel: int) -> None:
    print(f"\n=== {namn} ===")
    print(f"urval {total} verksamheter, fel {fel}")
    for gräns in BUCKETS:
        andel = 100 * traffar[gräns] / total if total else 0
        print(f"  bild inom {gräns:3d} m: {traffar[gräns]:5d}  {andel:5.1f} %")
    print("  per kommun, inom 60 m:")
    for kommun, (hit, n) in sorted(per_kommun.items(), key=lambda x: -x[1][1]):
        print(f"    {kommun:16s} {hit:4d}/{n:<4d} {100*hit/n:5.1f} %")


def mat(namn: str, rader: list[dict], narmaste, paus: float) -> None:
    traffar: Counter = Counter()
    per_kommun: dict = defaultdict(lambda: [0, 0])
    fel = 0

    for i, rad in enumerate(rader, 1):
        per_kommun[rad["kommun"]][1] += 1
        try:
            d = narmaste(rad)
        except Exception as exc:
            fel += 1
            print(f"  fel vid {rad['namn']}: {exc}", file=sys.stderr)
            time.sleep(2)
            continue
        if d is not None:
            for gräns in BUCKETS:
                if d <= gräns:
                    traffar[gräns] += 1
            if d <= 60:
                per_kommun[rad["kommun"]][0] += 1
        if i % 50 == 0:
            print(f"  ... {i}/{len(rader)}", file=sys.stderr)
        time.sleep(paus)

    rapportera(namn, len(rader), traffar, per_kommun, fel)


def main() -> int:
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 400
    rader = urval(limit)
    if not rader:
        print("Inga rader. Kör export_supabase.py först.", file=sys.stderr)
        return 1
    print(f"Urval: {len(rader)} publikvända verksamheter med koordinat.")

    access_token = token()
    if access_token:
        mat("Mapillary", rader, lambda r: narmaste_mapillary(r, access_token), 0.15)
    else:
        print("\n=== Mapillary ===")
        print("HOPPAS ÖVER: MAPILLARY_TOKEN saknas eller är tom i site/.env.")
        print("Gratis konto på mapillary.com → Settings → Developers.")

    mat("Panoramax", rader, narmaste_panoramax, 0.2)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
