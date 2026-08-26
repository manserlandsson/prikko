#!/usr/bin/env python3
"""Granskningskö för gatubilder, byggd ur Mapillarys VEKTORRUTOR.

    python3 pipeline/gatubildsko.py hamta site/src/data/*.json
    python3 pipeline/gatubildsko.py ark --tak 300
    python3 pipeline/gatubildsko.py tillampa site/src/data/*.json --godkanda FIL

Tre steg, och det mellersta är en människa. Skriptet publicerar ingenting av
sig självt. Samma form som `commonsko.py`, av samma skäl.


═══ VARFÖR DEN HÄR VÄGEN FINNS VID SIDAN AV hamta_gatubilder.py ══════════════

`hamta_gatubilder.py` frågar graph-API:t om EN punkt i taget. Det är rätt form
för påfyllning: efter första körningen är det några dussin nya verksamheter per
natt. Det är fel form för frågan "vilka av alla våra verksamheter HAR en
gatubild", eftersom den frågan då kostar ett anrop per rad.

UPPMÄTT PÅ VÅRA EGNA KOORDINATER 2026-08-26, inte antaget:

    verksamheter totalt                        16 047
    med koordinat                              13 616
    z14-rutor alla koordinater ligger i           815
    z14-rutor med 30 meters kantmarginal          860

    publikvända med koordinat, alltså målgruppen 8 830
    rutor den gruppen krävde med marginal         640

640 anrop mot 8 830, alltså 13,8 rader per anrop och en trettondel av
kostnaden. Rutan bär samma fält som graph-API:t svarar med per punkt: bild-id,
koordinat, kompassvinkel, fångsttid och panoramaflagga. Grindarna i `imagery`
går därför att köra oförändrade mot den, och det är precis vad `valj_ur_rutan`
gör nedan.


═══ VAD DEN FÖRSTA HELA KÖRNINGEN GAV ════════════════════════════════════════

Kört mot hela beståndet 2026-08-26, 640 rutor, noll fel och noll rutor utan
täckning. Det här är alltså inte ett urval utan en RÄKNING av varenda rad:

    kommun          med gatubild inom 30 m      andel
    ──────────────  ──────────────────────      ─────
    stockholm            4 350 / 5 771          75,4 %
    orebro                 232 /   437          53,1 %
    uppsala                269 /   580          46,4 %
    linkoping              285 /   673          42,3 %
    oskarshamn              26 /   117          22,2 %
    jonkoping              113 /   726          15,6 %
    kristinehamn             7 /    79           8,9 %
    karlstad                16 /   447           3,6 %
    ──────────────  ──────────────────────      ─────
    hela beståndet       5 298 / 8 830          60,0 %

DET HÄR TALET SKA JÄMFÖRAS MED 49,2 PROCENT I docs/28_gatubilder.md, som är
samma sak mätt på ett stratifierat urval om 60 rader per kommun. Skillnaden
sitter nästan helt i Stockholm, som är 65 procent av beståndet och där urvalet
gav 58,3 procent mot räkningens 75,4. Med n = 60 är det 95-procentiga
intervallet kring 58,3 ungefär 46 till 71 procent, alltså är räkningens tal
strax utanför. Urvalet var inte fel, det var litet, och Stockholm bär hela
rikssiffran på sina axlar.

Fyra kommuner saknas ur tabellen: Borgholm, Höganäs, Lomma och Svenljunga har
noll koordinater och därmed ingen fråga att ställa. Det är geokodning och inte
Mapillary som fattas dem.


═══ ATT RUTVÄGEN SVARAR SOM PUNKTVÄGEN ÄR PRÖVAT, INTE ANTAGET ═══════════════

En billigare metod som svarar något ANNAT är ingen besparing. 80 slumpade
verksamheter i Stockholm, Linköping, Örebro och Karlstad ställdes därför till
båda: `valj_ur_rutan` mot 48 hämtade rutor, och `imagery.find_mapillary` mot
graph-API:t, punkt för punkt.

    samma bild vald                      73
    olika bild, båda hittade en           5
    bara rutan hittade en                 2
    BARA GRAPH HITTADE EN                 0

Sista raden är den som betyder något. Rutan missar aldrig något graph hittar,
alltså är den en övermängd och inte ett närmevärde. De sju där de skiljer sig
går åt samma håll: rutan ser bilder graph inte returnerade. Skälet står redan
i `imagery.SEARCH_LIMIT` — graph sorterar inte svaret efter avstånd utan
returnerar en godtycklig delmängd av rutan, och den gränsen finns inte i en
vektorruta, som bär allt.

Det är också förklaringen till att räkningen ovan ligger över urvalets tal, och
den delen av skillnaden är alltså inte urvalsbrus utan en verklig vinst.

Se pipeline/prikko/vektorrutor.py för formatet och för sökvägen som är
`/maps/vtp/` och inte `/maps/vector/`.


═══ VARFÖR EN KÖ OCH INTE AUTOMATIK ══════════════════════════════════════════

Ett foto på fel verksamhet är ett PÅSTÅENDE om en namngiven verksamhet, och
varje kort på sajten bär både namn och bedömning. Det är den enda sortens fel
vi inte kan ta tillbaka när sidan är indexerad. Samma skäl som gör
`commonsko.py` till en kö gäller här, och det är hårdare här: Commons-bilden är
utpekad av en människa på Commons, medan gatubilden bara är den närmaste
punkten på en gata som råkar ligga inom trettio meter.

Grindarna i `imagery` är bra men de är geometri, inte igenkänning. De vet att
kameran pekade mot punkten. De vet inte om det är rätt port.


═══ VAD SKRIPTET ALDRIG GÖR ══════════════════════════════════════════════════

Skriver aldrig i `site/src/data/*.json` utan ett godkännandebeslut. `hamta` rör
bara sin egen fil i data/interim, och `ark` bara sin egen HTML.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from html import escape
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko import imagery, imagestore, vektorrutor  # noqa: E402

ROOT = Path(__file__).resolve().parent
KOFIL = ROOT / "data" / "interim" / "gatubilds_ko.json"
ARKFIL = ROOT.parent / "brand" / "_granska-gatubilder.html"

GRAPH = "https://graph.mapillary.com"
USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se)"

#: Paus mellan rutanrop. Rutorna är stora och tjänsten är gratis.
PAUS_S = 0.15

#: Samma filter som `hamta_gatubilder.PUBLIC_FACING` och mätskriptets. Skola,
#: förskola, vård, huvudkontor och matmäklare ska inte ha ett fasadfoto.
PUBLIKVANDA = (
    "restaurang", "café", "cafe", "servering", "pizzeria",
    "snabbmat", "bageri", "butik", "handel",
)


def publikvand(types) -> bool:
    return any(ord_ in " ".join(types or []).lower() for ord_ in PUBLIKVANDA)


def token() -> str:
    """Mapillary-token ur miljön, annars ur site/.env.

    Samma väg in som `hamta_gatubilder.mapillary_token`, och av samma skäl:
    tokenens lodstreck sönderdelas av skalet när `~/.prikko-env` läses utan
    citattecken runt värdet, och utfallet blir en tom variabel utan felmeddelande.
    """
    varde = os.environ.get("MAPILLARY_TOKEN", "").strip()
    if varde:
        return varde
    env = ROOT.parent / "site" / ".env"
    if env.exists():
        for rad in env.read_text(encoding="utf-8").splitlines():
            if rad.startswith("MAPILLARY_TOKEN="):
                return rad.split("=", 1)[1].strip()
    return ""


# ---------------------------------------------------------------------------
# Steg ett: rutorna
# ---------------------------------------------------------------------------


def valj_ur_rutan(lat: float, lng: float, bilder) -> Optional[imagery.Candidate]:
    """Bästa kandidaten bland rutans bilder, med `imagery`s egna grindar.

    Fyra grindar och ett val, ordagrant samma som `imagery.find_mapillary`:
    inom trettio meter, kameran mot verksamheten inom 45 grader, ingen
    360-utvikning, tagen i dagsljus. Bland dem som passerar väljer
    `imagery._pick` på närhet, komposition och färskhet i den ordningen.

    ATT REGLERNA ÄR IMPORTERADE OCH INTE KOPIERADE ÄR HELA POÄNGEN. Två
    uppsättningar grindar som ska föreställa samma sak glider isär, och glappet
    syns inte i något test: utfallet blir bara att kön visar en annan bild än
    den nattkörningen skulle ha valt.

    `fetch_url` lämnas tom. Rutan bär inget miniatyr-URL, och det är rätt: en
    URL från Mapillary är en HÄMTNINGSADRESS med utgångstid och aldrig ett
    lagringsvärde. Den hämtas när den ska användas, i `ark` och i `tillampa`.
    """
    kandidater: list[imagery.Candidate] = []
    for bild in bilder:
        if bild.panorama:
            continue
        avstand = imagery.distance_m(lat, lng, bild.lat, bild.lng)
        if avstand >= imagery.MAX_DISTANCE_M:
            continue
        avvikelse = imagery.bearing_off(bild.lat, bild.lng, bild.kompass, lat, lng)
        if avvikelse is None or avvikelse > imagery.MAX_BEARING_OFF_DEG:
            continue
        if not imagery.taken_in_daylight(imagery._moment_from_epoch_ms(bild.fangad_ms)):
            continue
        kandidater.append(
            imagery.Candidate(
                source="mapillary",
                source_id=bild.id,
                fetch_url="",
                captured_at=imagery._iso_date_from_epoch_ms(bild.fangad_ms),
                compass=bild.kompass,
                lat=bild.lat,
                lng=bild.lng,
                distance_m=avstand,
                bearing_off_deg=avvikelse,
                creator=None,
                licence=imagery.MAPILLARY_LICENCE,
            )
        )
    return imagery._pick(kandidater)


def rader_ur_filerna(filer: list[Path], bara_utan_bild: bool) -> list[dict]:
    rader: list[dict] = []
    for path in filer:
        payload = json.loads(path.read_text(encoding="utf-8"))
        kommun = (payload.get("municipality") or {}).get("slug") or path.stem
        for e in payload.get("establishments", []):
            if e.get("lat") is None or e.get("lng") is None:
                continue
            if not publikvand(e.get("types")):
                continue
            if bara_utan_bild and e.get("image"):
                continue
            rader.append({
                "id": e["id"],
                "namn": e.get("name") or "",
                "adress": e.get("address") or "",
                "kommun": kommun,
                "lat": float(e["lat"]),
                "lng": float(e["lng"]),
            })
    return rader


def hamta(filer: list[Path], tak: Optional[int], alla_rader: bool) -> int:
    """Steg ett: en fråga per RUTA, och en kandidat per verksamhet.

    Rader grupperas på ruta i stället för tvärtom. Varje ruta hämtas EN gång
    och matas till alla verksamheter som kan ha en bild i den, alltså alla vars
    trettiometersskiva skär rutan. Det är skillnaden mot ett anrop per rad, och
    det är den enda anledningen till att steget går att köra på hela beståndet.
    """
    tok = token()
    if not tok:
        raise SystemExit(
            "MAPILLARY_TOKEN saknas. Gratis konto på mapillary.com → Settings →\n"
            "Developers. Sätt citattecken runt värdet i ~/.prikko-env: tokenen\n"
            "innehåller lodstreck och sönderdelas annars av skalet."
        )

    rader = rader_ur_filerna(filer, bara_utan_bild=not alla_rader)
    if tak:
        rader = rader[:tak]
    if not rader:
        raise SystemExit("Inga rader att fråga om.")

    # Ruta → de rader som kan ha en bild i den. Marginalen är avståndskravet,
    # så att en verksamhet nära en rutgräns får med grannrutans bilder.
    per_ruta: dict[tuple[int, int], list[int]] = defaultdict(list)
    for i, rad in enumerate(rader):
        for ruta in vektorrutor.rutor_for(
            [(rad["lat"], rad["lng"])], radie_m=imagery.MAX_DISTANCE_M
        ):
            per_ruta[ruta].append(i)

    print(
        f"{len(rader)} verksamheter, {len(per_ruta)} rutor på z{vektorrutor.ZOOM}. "
        f"Kvot {len(rader) / len(per_ruta):.1f} rader per anrop.",
        file=sys.stderr,
    )

    kandidater: list[list] = [[] for _ in rader]
    tomma = 0
    fel = 0
    for n, (ruta, index) in enumerate(sorted(per_ruta.items()), 1):
        x, y = ruta
        try:
            rå = vektorrutor.hamta_ruta(vektorrutor.ZOOM, x, y, tok)
        except Exception as exc:  # noqa: BLE001
            fel += 1
            print(f"  ! ruta {x}/{y}: {exc}", file=sys.stderr)
            time.sleep(2)
            continue
        if not rå:
            tomma += 1
            continue
        bilder = vektorrutor.avkoda(rå, vektorrutor.ZOOM, x, y)
        for i in index:
            rad = rader[i]
            kandidater[i].extend(
                b for b in bilder
                if imagery.distance_m(rad["lat"], rad["lng"], b.lat, b.lng)
                < imagery.MAX_DISTANCE_M
            )
        if n % 50 == 0:
            print(f"  ... {n}/{len(per_ruta)} rutor", file=sys.stderr)
        time.sleep(PAUS_S)

    ko: list[dict] = []
    per_kommun: dict[str, list[int]] = defaultdict(lambda: [0, 0])
    for rad, bilder in zip(rader, kandidater):
        per_kommun[rad["kommun"]][1] += 1
        vald = valj_ur_rutan(rad["lat"], rad["lng"], bilder)
        if vald is None:
            continue
        per_kommun[rad["kommun"]][0] += 1
        ko.append({
            **rad,
            "bild_id": vald.source_id,
            "avstand_m": round(vald.distance_m, 1),
            "avvikelse_grader": round(vald.bearing_off_deg, 1),
            "fangad": vald.captured_at,
        })

    KOFIL.parent.mkdir(parents=True, exist_ok=True)
    KOFIL.write_text(json.dumps(ko, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"\nRutor: {len(per_ruta)}, varav {tomma} utan täckning, {fel} fel.", file=sys.stderr)
    print(f"{len(ko)} kandidater av {len(rader)} rader "
          f"({100 * len(ko) / len(rader):.1f} %) skrivna till {KOFIL}", file=sys.stderr)
    print("\nPer kommun:", file=sys.stderr)
    for kommun, (traff, av) in sorted(per_kommun.items(), key=lambda p: -p[1][1]):
        print(f"  {kommun:14s} {traff:5d}/{av:<5d} {100 * traff / av:5.1f} %", file=sys.stderr)
    return 0


# ---------------------------------------------------------------------------
# Steg två: granskningsarket
# ---------------------------------------------------------------------------


def _graph(bild_id: str, tok: str) -> dict:
    url = f"{GRAPH}/{urllib.parse.quote(bild_id)}?" + urllib.parse.urlencode(
        {"access_token": tok, "fields": "thumb_1024_url,creator,captured_at"}
    )
    begaran = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(begaran, timeout=30) as svar:
        return json.loads(svar.read().decode("utf-8"))


def ark(tak: Optional[int]) -> int:
    """Steg två: en fil att öppna i webbläsaren, inte en vy i sajten.

    Miniatyr-URL:erna hämtas HÄR och inte i steg ett, ett anrop per kandidat
    som faktiskt ska granskas. De är signerade och går ut, så de duger till ett
    ark man tittar på i dag och till ingenting annat. Ett ark på trehundra
    kandidater kostar alltså trehundra anrop, och det är rätt pris: det är
    besluten som är flaskhalsen, inte anropen.

    Besluten ligger i localStorage när den går att röra. Arket öppnas oftast
    genom att dubbelklicka på filen, alltså på file://, och Safari kastar
    SecurityError redan på att LÄSA localStorage där. Spärren nedan är hämtad
    ordagrant ur commonsko.py, där felet en gång gjorde hela arket dött.
    """
    if not KOFIL.exists():
        raise SystemExit(f"Ingen kö att granska. Kör `hamta` först. Väntade {KOFIL}")

    tok = token()
    if not tok:
        raise SystemExit("MAPILLARY_TOKEN saknas, och miniatyrerna hämtas därifrån.")

    ko = json.loads(KOFIL.read_text(encoding="utf-8"))
    if tak:
        ko = ko[:tak]

    kort = []
    hoppade = 0
    for k in ko:
        try:
            svar = _graph(k["bild_id"], tok)
        except Exception as exc:  # noqa: BLE001
            hoppade += 1
            print(f"  ! {k['namn']}: {exc}", file=sys.stderr)
            continue
        miniatyr = svar.get("thumb_1024_url")
        if not miniatyr:
            hoppade += 1
            continue
        fotograf = (svar.get("creator") or {}).get("username") or "okänd"
        bildsida = f"https://www.mapillary.com/app/?pKey={k['bild_id']}&focus=photo"
        kort.append(f"""
    <article class="k" data-id="{escape(k['id'])}" data-bild="{escape(k['bild_id'])}">
      <img src="{escape(miniatyr)}" alt="" loading="lazy" />
      <div class="t">
        <h2>{escape(k['namn'])}</h2>
        <p class="m">{escape(k['adress'])} · {escape(k['kommun'])}</p>
        <p class="m">{k['avstand_m']} m · {k['avvikelse_grader']}° från mitten ·
           {escape(k['fangad'] or 'okänt datum')} · {escape(fotograf)}</p>
        <p class="f"><a href="{escape(bildsida)}" target="_blank" rel="noopener">Se på Mapillary</a></p>
        <div class="v">
          <button type="button" data-ja>Ja, det är stället</button>
          <button type="button" data-nej>Nej</button>
        </div>
      </div>
    </article>""")
        time.sleep(0.1)

    html = f"""<!doctype html>
<html lang="sv">
<meta charset="utf-8" />
<title>Granska gatubilder</title>
<style>
  body {{ font: 15px/1.5 system-ui, sans-serif; margin: 0; padding: 24px; background: #fafafa; }}
  h1 {{ font-size: 20px; }}
  .rad {{ position: sticky; top: 0; background: #fafafa; padding: 12px 0; border-bottom: 1px solid #ddd; }}
  .k {{ display: grid; grid-template-columns: 360px 1fr; gap: 20px; align-items: start;
        background: #fff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 16px; margin: 16px 0; }}
  .k[data-beslut="ja"] {{ border-color: #00b92b; }}
  .k[data-beslut="nej"] {{ opacity: .45; }}
  .k img {{ width: 360px; height: 240px; object-fit: cover; border-radius: 8px; background: #eee; }}
  h2 {{ font-size: 17px; margin: 0 0 4px; }}
  .m {{ color: #6e6e73; margin: 2px 0; font-size: 13px; }}
  .f {{ margin: 8px 0; font-size: 13px; }}
  .v {{ margin-top: 12px; display: flex; gap: 8px; }}
  button {{ font: inherit; padding: 8px 14px; border-radius: 8px; border: 1px solid #ccc;
            background: #fff; cursor: pointer; }}
  #ut {{ width: 100%; height: 180px; font: 12px/1.4 ui-monospace, monospace; }}
</style>

<h1>Granska gatubilder</h1>
<p class="m">
  {len(kort)} kandidater, valda ur Mapillarys vektorrutor och redan silade på
  avstånd, kamerariktning, dagsljus och 360-form. Frågan är BARA: är det här
  stället? Miniatyrerna är signerade och går ut, så granska arket i dag.
  Besluten sparas i webbläsaren.
</p>

<div class="rad">
  <b><span id="ja">0</span> ja</b> · <span id="nej">0</span> nej ·
  <span id="kvar">{len(kort)}</span> kvar
  <button type="button" id="skriv">Skriv godkända</button>
</div>

{''.join(kort)}

<h2>Godkända</h2>
<p class="m">Spara i en fil och kör
  <code>python3 pipeline/gatubildsko.py tillampa site/src/data/*.json --godkanda FIL</code></p>
<textarea id="ut" readonly></textarea>

<script>
  const NYCKEL = 'prikko-gatubilds-ko';
  const lager = (() => {{
    try {{
      localStorage.setItem(NYCKEL + ':prov', '1');
      localStorage.removeItem(NYCKEL + ':prov');
      return localStorage;
    }} catch (e) {{
      const m = new Map();
      return {{ getItem: (k) => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, v) }};
    }}
  }})();

  const beslut = JSON.parse(lager.getItem(NYCKEL) || '{{}}');

  function rakna() {{
    const v = Object.values(beslut);
    document.getElementById('ja').textContent = v.filter(x => x === 'ja').length;
    document.getElementById('nej').textContent = v.filter(x => x === 'nej').length;
    document.getElementById('kvar').textContent =
      document.querySelectorAll('.k').length - v.length;
  }}

  for (const kort of document.querySelectorAll('.k')) {{
    const id = kort.dataset.id;
    if (beslut[id]) kort.dataset.beslut = beslut[id];
    for (const [val, knapp] of [['ja', '[data-ja]'], ['nej', '[data-nej]']]) {{
      kort.querySelector(knapp).addEventListener('click', () => {{
        beslut[id] = val;
        kort.dataset.beslut = val;
        lager.setItem(NYCKEL, JSON.stringify(beslut));
        rakna();
      }});
    }}
  }}

  document.getElementById('skriv').addEventListener('click', () => {{
    const ut = [...document.querySelectorAll('.k')]
      .filter(k => beslut[k.dataset.id] === 'ja')
      .map(k => ({{ id: k.dataset.id, bild_id: k.dataset.bild }}));
    document.getElementById('ut').value = JSON.stringify(ut, null, 1);
  }});

  rakna();
</script>
</html>
"""
    ARKFIL.write_text(html, encoding="utf-8")
    print(f"{len(kort)} kandidater skrivna till {ARKFIL}, {hoppade} hoppade.", file=sys.stderr)
    return 0


# ---------------------------------------------------------------------------
# Steg tre: tillämpa
# ---------------------------------------------------------------------------


def tillampa(filer: list[Path], godkanda_fil: Path, store) -> int:
    """Steg tre: hämta bytesen, lagra dem hos oss och skriv in raden.

    Miniatyr-URL:en hämtas på nytt här. Den i arket är timmar gammal och
    signerad, och att spara den vore precis den bugg `imagery` är skriven för
    att inte upprepa: en efemär käll-URL i `public.images.url` ger bilder som
    slutar visas en tid efter varje bygge utan att något klagar.
    """
    tok = token()
    if not tok:
        raise SystemExit("MAPILLARY_TOKEN saknas.")

    godkanda = {
        rad["id"]: rad["bild_id"]
        for rad in json.loads(godkanda_fil.read_text(encoding="utf-8"))
    }
    skrivna = 0

    for path in filer:
        payload = json.loads(path.read_text(encoding="utf-8"))
        kommun = payload["municipality"]["slug"]
        rort = False
        for e in payload["establishments"]:
            bild_id = godkanda.get(e["id"])
            if bild_id is None:
                continue
            svar = _graph(bild_id, tok)
            miniatyr = svar.get("thumb_1024_url")
            if not miniatyr:
                print(f"  {e['name']}: {bild_id} har ingen miniatyr längre", file=sys.stderr)
                continue
            kandidat = imagery.Candidate(
                source="mapillary",
                source_id=bild_id,
                fetch_url=miniatyr,
                captured_at=imagery._iso_date_from_epoch_ms(svar.get("captured_at")),
                compass=None,
                lat=float(e["lat"]),
                lng=float(e["lng"]),
                distance_m=0.0,
                bearing_off_deg=0.0,
                creator=((svar.get("creator") or {}).get("username") or None),
                licence=imagery.MAPILLARY_LICENCE,
            )
            data, innehallstyp = imagery.download(kandidat)
            bytes_, innehallstyp, andelse = imagery.prepare(data, innehallstyp)
            nyckel = imagery.object_key(kommun, e["id"], andelse)
            url = store.put(nyckel, bytes_, innehallstyp)
            e["image"] = {
                "url": url,
                "id": bild_id,
                "capturedAt": kandidat.captured_at,
                "source": "mapillary",
                "licence": imagery.MAPILLARY_LICENCE,
                "attribution": imagery.attribution_text(kandidat),
            }
            rort = True
            skrivna += 1
            time.sleep(PAUS_S)
        if rort:
            path.write_text(
                json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8"
            )

    print(f"{skrivna} bilder skrivna", file=sys.stderr)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("kommando", choices=("hamta", "ark", "tillampa"))
    parser.add_argument("files", nargs="*", type=Path)
    parser.add_argument("--tak", type=int, help="ta bara så här många rader")
    parser.add_argument("--alla", action="store_true",
                        help="ta med rader som redan har en bild, för mätning")
    parser.add_argument("--godkanda", type=Path, help="JSON ur granskningsarket")
    parser.add_argument("--lokal", help="skriv bilderna till en katalog i stället för lagringen")
    parser.add_argument("--bas-url", dest="bas_url", help="publik bas-URL för --lokal")
    args = parser.parse_args()

    if args.kommando == "hamta":
        if not args.files:
            raise SystemExit("hamta kräver datafiler")
        return hamta(args.files, args.tak, args.alla)

    if args.kommando == "ark":
        return ark(args.tak)

    if not args.files or not args.godkanda:
        raise SystemExit("tillampa kräver datafiler och --godkanda")
    if args.lokal:
        if not args.bas_url:
            raise SystemExit("--lokal kräver --bas-url.")
        store = imagestore.LocalStore(
            directory=Path(args.lokal).expanduser().resolve(),
            public_base_url=args.bas_url,
        )
    else:
        store = imagestore.from_env()
        if store is None:
            raise SystemExit(
                "Ingen lagring i miljön. Sätt SUPABASE_URL och SUPABASE_SERVICE_KEY,\n"
                "eller R2-variablerna, eller kör med --lokal och --bas-url."
            )
    return tillampa(args.files, args.godkanda, store)


if __name__ == "__main__":
    raise SystemExit(main())
