"""Vad kostar det i täckning att kräva att bilden visar RÄTT hus?

matt_bildtackning.py svarar på en enklare fråga: finns det över huvud taget en
bild i närheten. Den frågan är besvarad (Mapillary 42,0 procent inom 60 m,
65,2 inom 100) och den avgjorde att spåret var värt att bygga.

Den här mäter det som avgör om bilden är värd att VISA. En bild 60 meter bort
är en bild på grannens fasad, och en bild där kameran pekar bort från porten är
en bild på vägbanan. Ägarens syfte är "så man liksom vet aha det är den
restaurangen", och mot det syftet är en ungefärlig bild inte en halv bild utan
ett fel: besökaren tror att hen sett stället.

Skriptet gör ETT anrop per verksamhet med en vid sökruta och räknar sedan hem
hela kurvan lokalt, alla trösklar och alla grindkombinationer ur samma svar.
Grindarna importeras från prikko.imagery, aldrig kopierade hit, så det som mäts
är det pipelinen faktiskt gör.

    python3 pipeline/matt_troskel.py            # 400 verksamheter
    python3 pipeline/matt_troskel.py 150        # snabbare, grövre

Kräver MAPILLARY_TOKEN i miljön eller i site/.env.
"""

from __future__ import annotations

import json
import math
import statistics
import sys
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from matt_bildtackning import (  # noqa: E402
    USER_AGENT,
    token,
    urval,
    urval_per_kommun,
    vikter,
)
from prikko.imagery import (  # noqa: E402
    MAX_BEARING_OFF_DEG,
    MAX_DISTANCE_M,
    SEARCH_LIMIT,
    SPHERICAL,
    _moment_from_epoch_ms,
    bearing_deg,
    distance_m,
    taken_in_daylight,
)

MAPILLARY = "https://graph.mapillary.com/images"

#: Trösklar vi vill se kurvan över, i meter.
TROSKLAR = (20, 25, 30, 40, 50, 60, 80, 100)

#: Riktningskrav vi vill se kurvan över, i grader avvikelse. 180 betyder inget
#: krav alls, alltså "vilken bild som helst som ligger nära nog".
RIKTNINGAR = (30, 45, 60, 90, 180)

#: Sökrutan. Måste täcka den största tröskeln åt alla håll, även öst-västligt
#: där longitudgraden är kortare. Samma rättning som i imagery._bbox.
_M_PER_DEG_LAT = 111320.0


def _bbox(lat: float, lng: float, meter: float) -> tuple[float, ...]:
    pad_lat = meter * 1.25 / _M_PER_DEG_LAT
    pad_lng = pad_lat / max(math.cos(math.radians(lat)), 0.01)
    return (lng - pad_lng, lat - pad_lat, lng + pad_lng, lat + pad_lat)


def _angle_diff(a: float, b: float) -> float:
    return abs((a - b + 180) % 360 - 180)


def kandidater(rad: dict) -> list[dict]:
    """Alla Mapillary-bilder runt punkten, med det vi behöver för att döma.

    En bild per svar blir en rad här: avstånd, hur långt kameran pekar fel,
    om den är en 360-utvikning och om den är tagen i dagsljus. Sedan kan varje
    tröskel och varje grindkombination räknas ur samma hämtning.
    """
    params = urllib.parse.urlencode({
        "access_token": rad["_token"],
        "fields": "id,thumb_1024_url,captured_at,compass_angle,camera_type,geometry",
        "bbox": ",".join(str(round(v, 6)) for v in _bbox(rad["lat"], rad["lng"], max(TROSKLAR))),
        "limit": SEARCH_LIMIT,
    })
    request = urllib.request.Request(
        f"{MAPILLARY}?{params}", headers={"User-Agent": USER_AGENT}
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        payload = json.loads(response.read().decode("utf-8"))

    ut: list[dict] = []
    for item in payload.get("data", []):
        coords = (item.get("geometry") or {}).get("coordinates")
        if not coords or not item.get("thumb_1024_url"):
            continue
        cam_lat, cam_lng = coords[1], coords[0]
        compass = item.get("compass_angle")
        # Bild utan kompassvärde kan aldrig klara riktningskravet. Den får
        # avvikelsen 180 så att den bara räknas i "inget riktningskrav".
        try:
            fel = _angle_diff(
                float(compass), bearing_deg(cam_lat, cam_lng, rad["lat"], rad["lng"])
            )
        except (TypeError, ValueError):
            fel = 180.0
        ut.append({
            "d": distance_m(rad["lat"], rad["lng"], cam_lat, cam_lng),
            "riktningsfel": fel,
            "sfarisk": str(item.get("camera_type") or "").lower() in SPHERICAL,
            "dagsljus": taken_in_daylight(_moment_from_epoch_ms(item.get("captured_at"))),
        })
    return ut


def main() -> int:
    argument = [a for a in sys.argv[1:] if not a.startswith("--")]
    flaggor = {a for a in sys.argv[1:] if a.startswith("--")}
    antal = int(argument[0]) if argument else 400
    access_token = token()
    if not access_token:
        print("MAPILLARY_TOKEN saknas. Ligger i site/.env.", file=sys.stderr)
        return 1

    # Med --per-kommun betyder talet hur många rader varje kommun bidrar med,
    # inte hur många rader urvalet har totalt. Se urval_per_kommun.
    stratifierat = "--per-kommun" in flaggor
    rader = urval_per_kommun(antal) if stratifierat else urval(antal)
    if not rader:
        print("Inga rader. Kör export_supabase.py först.", file=sys.stderr)
        return 1
    if stratifierat:
        print(f"Urval: {len(rader)} rader, högst {antal} per kommun.")
        print("Rikssiffran vägs mot beståndet, se sista tabellen.\n")
    else:
        print(f"Urval: {len(rader)} publikvända verksamheter med koordinat.\n")

    # traff[(troskel, riktning)] = antal verksamheter med minst en bild som
    # klarar båda kraven plus dagsljus och icke-360.
    traff: dict[tuple[int, int], int] = defaultdict(int)
    # Samma sak men utan dagsljuskravet, för att kunna prissätta det ensamt.
    utan_dagsljus: dict[tuple[int, int], int] = defaultdict(int)
    per_kommun: dict[str, list[int]] = defaultdict(lambda: [0, 0])
    avstand_vald: list[float] = []
    fel = 0

    for i, rad in enumerate(rader, 1):
        rad["_token"] = access_token
        per_kommun[rad["kommun"]][1] += 1
        try:
            bilder = kandidater(rad)
        except Exception as exc:
            fel += 1
            print(f"  fel vid {rad['namn']}: {exc}", file=sys.stderr)
            time.sleep(2)
            continue

        brukbara = [b for b in bilder if not b["sfarisk"]]
        for troskel in TROSKLAR:
            for riktning in RIKTNINGAR:
                passande = [
                    b for b in brukbara
                    if b["d"] < troskel and b["riktningsfel"] <= riktning
                ]
                if passande:
                    utan_dagsljus[(troskel, riktning)] += 1
                if any(b["dagsljus"] for b in passande):
                    traff[(troskel, riktning)] += 1

        # Det urval pipelinen faktiskt gör, för avståndsstatistiken och
        # kommunfördelningen. Gränserna läses ur imagery och skrivs aldrig av
        # hit: en mätning som mäter något annat än det som körs är värre än
        # ingen mätning, för den ser ut att gälla.
        valda = [
            b for b in brukbara
            if b["d"] < MAX_DISTANCE_M
            and b["riktningsfel"] <= MAX_BEARING_OFF_DEG
            and b["dagsljus"]
        ]
        if valda:
            per_kommun[rad["kommun"]][0] += 1
            avstand_vald.append(min(b["d"] for b in valda))

        if i % 50 == 0:
            print(f"  ... {i}/{len(rader)}", file=sys.stderr)
        time.sleep(0.15)

    total = len(rader) - fel
    if total <= 0:
        print("Alla anrop misslyckades.", file=sys.stderr)
        return 1

    def andel(n: int) -> str:
        return f"{100 * n / total:5.1f} %"

    print(f"\n=== Täckning, {total} mätta verksamheter, {fel} fel ===")
    print("Rader: hur nära bilden måste vara. Kolumner: hur mycket kameran får")
    print("peka fel. Alla tal har dessutom dagsljuskravet och bort med 360.\n")
    header = "  m/grad " + "".join(f"{r:>9}°" for r in RIKTNINGAR)
    print(header.replace("180°", "  fritt"))
    for troskel in TROSKLAR:
        rad_ut = f"  {troskel:5d} "
        for riktning in RIKTNINGAR:
            rad_ut += f"{andel(traff[(troskel, riktning)]):>10}"
        print(rad_ut)

    print(f"\n=== Vad dagsljuskravet ensamt kostar, vid ±{MAX_BEARING_OFF_DEG}° ===")
    for troskel in TROSKLAR:
        med = traff[(troskel, MAX_BEARING_OFF_DEG)]
        utan = utan_dagsljus[(troskel, MAX_BEARING_OFF_DEG)]
        tapp = 100 * (utan - med) / total
        print(f"  {troskel:3d} m: {andel(utan)} utan krav, {andel(med)} med, "
              f"skillnad {tapp:4.1f} procentenheter")

    if avstand_vald:
        print(f"\n=== Vald bilds avstånd vid {MAX_DISTANCE_M} m och ±{MAX_BEARING_OFF_DEG}°, "
              f"{len(avstand_vald)} bilder ===")
        print(f"  median {statistics.median(avstand_vald):5.1f} m, "
              f"medel {statistics.fmean(avstand_vald):5.1f} m, "
              f"störst {max(avstand_vald):5.1f} m")

    print(f"\n=== Per kommun vid {MAX_DISTANCE_M} m och ±{MAX_BEARING_OFF_DEG}°, alltså skarpt läge ===")
    storlek = vikter()
    for kommun, (hit, n) in sorted(per_kommun.items(), key=lambda x: -x[1][1]):
        if n:
            print(f"  {kommun:16s} {hit:4d}/{n:<4d} {100 * hit / n:5.1f} %"
                  f"   bestånd {storlek.get(kommun, 0):5d}")

    # Ett stratifierat urval ger inte rikssiffran rakt av: Svenljunga och
    # Stockholm väger lika tungt i det, men inte i beståndet. Varje kommuns
    # uppmätta andel skalas därför med sin verkliga storlek. Kommuner utan
    # koordinat har noll i beståndet och faller ur summan av sig själva.
    vagt = sum(storlek.get(k, 0) * hit / n for k, (hit, n) in per_kommun.items() if n)
    bas = sum(storlek.get(k, 0) for k, (_, n) in per_kommun.items() if n)
    if bas:
        print(f"\n=== Viktad rikssiffra vid {MAX_DISTANCE_M} m och ±{MAX_BEARING_OFF_DEG}° ===")
        print(f"  {100 * vagt / bas:.1f} % av {bas} publikvända verksamheter med koordinat")
        print(f"  alltså ungefär {round(vagt)} sidor som får en gatubild")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
