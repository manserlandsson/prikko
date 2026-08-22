#!/usr/bin/env python3
"""Granskningskö för Commons-bilder som hittas på FILNAMN.

    python3 pipeline/commonsko.py hamta site/src/data/*.json
    python3 pipeline/commonsko.py ark
    python3 pipeline/commonsko.py tillampa site/src/data/*.json

Tre steg, och det mellersta är en människa. Skriptet publicerar ingenting av
sig självt.


═══ VARFÖR DEN HÄR VÄGEN FINNS ═══════════════════════════════════════════════

`hamta_commonsbilder.py` har redan två spår, och båda kräver ett WIKIDATA-objekt:

    OSM-spåret       matpunktens `wikidata`-tagg pekar ut objektet, P18 ger bilden
    namnspåret       objektet hittas på vårt namn och vår koordinat, spärr 150 m

Bägge hittar bara bilder som är P18 på ett objekt. Ägaren pekade 2026-08-22 på
två fall som inte är det:

    Restaurant Frantzén      har ingen OSM-träff alls, och alltså ingen kedja
    Max Hammarby Sjöstad     filen "Max Hammarby sjöstad 2012.jpg" finns på
                             Commons, men den är inte P18 på något objekt. Den
                             ligger på KEDJANS artikel, Max Hamburgerrestauranger

Det tredje spåret söker därför på FILNAMN i stället, och det är också skälet
till att utfallet måste granskas för hand.


═══ VARFÖR EN KÖ OCH INTE AUTOMATIK ══════════════════════════════════════════

Mätt 2026-08-22 på bildlösa konsumentvända verksamheter i Stockholm:

    regel                                          utfall
    ─────────────────────────────────────────────  ─────────────────────────
    namnlikhet (names_agree)                       10 av 50, SJU fel ställe
    alla våra namnord måste finnas i filnamnet     Bank Hotel och Siam Square
                                                   överlever ändå
    ovanstående + tre ord eller sv.wikipedia       5 av 70, 10 korrekt
                                                   avvisade, cirka två av fem
                                                   ÄNDÅ fel

De fel som avvisas är av rätt sort: Bernolsheim, Oxford, Grivegnée, Bangkok, en
Burger King-kampanj för Windows 7. De som slipper igenom är svårare: "Stora
Salen" gav en bild från Stadionmässan, som är fel Stora Salen.

Sju procent fler bilder till tjugo till fyrtio procents felrisk är ingen bra
affär. Ett fel foto på en NAMNGIVEN verksamhet är dessutom den enda sortens fel
vi inte kan ta tillbaka när sidan väl är indexerad. Därför en kö.

Geosökning provades och duger inte: Max-filen har inga koordinater alls.
`globalusage` duger inte som ensam bekräftelse heller, av samma skäl som ovan.


═══ VAD SKRIPTET ALDRIG GÖR ══════════════════════════════════════════════════

Skriver aldrig i `site/src/data/*.json` utan ett godkännandebeslut. `hamta`
rör bara sin egen fil i data/interim, och `ark` bara sin egen HTML.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from collections import Counter
from html import escape
from pathlib import Path
from typing import Dict, List, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko import commons  # noqa: E402
from prikko.oppettider import name_tokens  # noqa: E402

ROOT = Path(__file__).resolve().parent
KOFIL = ROOT / "data" / "interim" / "commons_ko.json"
ARKFIL = ROOT.parent / "brand" / "_granska-commons.html"

COMMONS_API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"

#: Sekunder mellan anrop. Commons ber om det och vi frågar tusentals gånger.
PAUS_S = 0.2

#: Verksamhetstyper som är värda att leta bild på. Samma tanke som
#: KONSUMENT i oppettider.py: ett förskolekök har ingen fasad att fotografera
#: som säger något om maten, och namnspåret i hamta_commonsbilder.py täcker
#: redan skolor och kyrkor via Wikidata.
KONSUMENTTYPER = {
    "Restaurang",
    "Restaurang och servering",
    "Café",
    "Kafé",
    "Snabbmatsrestaurang",
    "Bageri",
    "Pizzeria",
    "Butik",
    "Livsmedelsbutik med hantering",
    "Kiosk",
}

#: Minsta antal namnord för att ett namn ska duga utan sv.wikipedia-stöd.
#:
#: TVÅ ORD RÄCKER INTE, och det är mätt. "Bank Hotel", "Siam Square", "Bonne
#: Femme" och "Il Caffe" är alla två ord som förekommer ordagrant i filnamn på
#: helt andra ställen i världen. Tre ord innehåller nästan alltid ett egennamn
#: eller en plats, och det är det som binder filen till just vårt ställe:
#: "Max Hammarby Sjöstad" bär stadsdelen, "Krogen Stora Gungan" bär krogen.
MINSTA_ORD_UTAN_STOD = 3


def api(params: dict) -> dict:
    url = f"{COMMONS_API}?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def filnamnets_ord(titel: str) -> set:
    """Namnorden i en filtitel, utan `File:`-prefix och utan filändelse."""
    return set(name_tokens(re.sub(r"^File:|\.\w+$", "", titel)))


def anvands_pa_svwp(titel: str) -> bool:
    """Används filen på svenska Wikipedia?

    Det är en SVAG bekräftelse och används bara för att släppa igenom namn på
    två ord. En fil på sv.wikipedia handlar om något svenskt, vilket räcker
    för att stänga ute Bangkok och Edinburgh, men inte för att bevisa att det
    är rätt svenska ställe. Därför är den här funktionen aldrig ensam grund:
    filnamnet måste redan bära alla våra namnord.
    """
    try:
        svar = api(
            {
                "action": "query",
                "titles": titel,
                "prop": "globalusage",
                "guprop": "url",
                "gulimit": 30,
                "format": "json",
            }
        )
    except Exception:  # noqa: BLE001
        return False
    sida = next(iter(svar.get("query", {}).get("pages", {}).values()), {})
    return any(g.get("wiki") == "sv.wikipedia.org" for g in sida.get("globalusage", []))


def sok_kandidat(namn: str) -> List[str]:
    """Filtitlar på Commons vars titel innehåller verksamhetens namn."""
    try:
        svar = api(
            {
                "action": "query",
                "list": "search",
                "srsearch": f'intitle:"{namn}"',
                "srnamespace": 6,
                "srlimit": 5,
                "format": "json",
            }
        )
    except Exception:  # noqa: BLE001
        return []
    return [t["title"] for t in svar.get("query", {}).get("search", [])]


def hamta(filer: List[Path], tak: Optional[int]) -> int:
    """Steg ett: leta kandidater och skriv kön. Publicerar ingenting."""
    ko: List[dict] = []
    provade = 0

    ko = rensa(ko)

    KOFIL.parent.mkdir(parents=True, exist_ok=True)

    def spara() -> None:
        KOFIL.write_text(json.dumps(ko, ensure_ascii=False, indent=1), encoding="utf-8")

    for path in filer:
        payload = json.loads(path.read_text(encoding="utf-8"))
        kommun = payload["municipality"]
        for e in payload["establishments"]:
            if tak is not None and provade >= tak:
                break
            # Har den redan en bild är frågan besvarad, oavsett av vilket spår.
            if e.get("image"):
                continue
            if not any(t in KONSUMENTTYPER for t in (e.get("types") or [])):
                continue

            vara_ord = set(name_tokens(e.get("name") or ""))
            if len(vara_ord) < 2:
                # Ett ord är inget att söka på. "Max" ensamt träffar varje Max
                # i världen, och "Kvarnen" varje kvarn.
                continue

            provade += 1
            for titel in sok_kandidat(e["name"]):
                time.sleep(PAUS_S)
                if not vara_ord <= filnamnets_ord(titel):
                    continue

                stod = False
                if len(vara_ord) < MINSTA_ORD_UTAN_STOD:
                    stod = anvands_pa_svwp(titel)
                    time.sleep(PAUS_S)
                    if not stod:
                        continue

                # LICENSEN PRÖVAS HÄR OCH INTE I ARKET. `commons.lookup`
                # returnerar None när filen saknar licensuppgift eller bär en
                # licens utanför FREE_LICENCES, och en bild vi ändå aldrig får
                # visa hör inte hemma i en granskningskö: den kostar bara ett
                # beslut som inte spelar roll.
                #
                # Nätfelet fångas HÄR och inte i `commons.lookup`. Modulen
                # ska fälla högt när OSM-spåret slår upp sina 27 filer: går
                # ett av dem fel vill vi veta det. Den här kön gör tusentals
                # anrop i en följd, och ett avbrutet anrop mitt i är då ett
                # utfall och inte ett haveri. Att låta det kasta hade kostat
                # hela skörden för en fils skull.
                try:
                    funnen = commons.lookup(titel[len("File:") :])
                except Exception as fel:  # noqa: BLE001
                    print(f"  {titel}: {fel}", file=sys.stderr)
                    funnen = None
                time.sleep(PAUS_S)
                if funnen is None:
                    continue

                ko.append(
                    {
                        "id": e["id"],
                        "namn": e["name"],
                        "adress": e.get("address"),
                        "kommun": kommun["slug"],
                        "ort": kommun["city"],
                        "fil": funnen.title,
                        "licens": funnen.licence,
                        "attribution": commons.credit_line(funnen),
                        "capturedAt": funnen.captured_at,
                        "forhandsvisning": funnen.fetch_url,
                        "filsida": commons.file_page_url(funnen.title),
                        "namnord": len(vara_ord),
                        "svwp": stod,
                    }
                )
                break

        spara()
        print(
            f"{kommun['slug']}: {provade} prövade totalt, {len(ko)} kandidater",
            file=sys.stderr,
            flush=True,
        )

    spara()
    print(f"{provade} verksamheter prövade, {len(ko)} kandidater i {KOFIL}", file=sys.stderr)
    return 0


def rensa(ko: List[dict]) -> List[dict]:
    """Två automatiska gallringar innan människan får se kön.

    Båda tar bort fel som en granskare INTE kan se på bilden, alltså precis
    de fel en granskningskö annars släpper igenom.

    ══ EN FIL, EN VERKSAMHET ═══════════════════════════════════════════════

    Delas samma fil av flera rader är det en KEDJA, och då är bilden fel på
    alla utom möjligen en. Mätt över de 205 första kandidaterna: 13 filer
    delades av 41 rader. "Bastard Burgers, Rehnsgatan.jpg" föreslogs för nio
    adresser i fem städer, och bilden på Rehnsgatan i Stockholm är inte
    Bastard Burgers i Linköping.

    Det här är samma fel som `brand:wikidata` redan är förbjuden för i
    docs/37: taggen pekar på kedjan och inte på stället. Här kommer felet in
    genom filnamnet i stället, men det ÄR samma fel.

    Alla raderna kastas, inte alla utom en. Vi kan inte veta vilken adress
    fotografiet togs på, och en gissning som ser rätt ut är värre än ett
    tomrum.

    ══ INGA LOGOTYPER ══════════════════════════════════════════════════════

    En varumärkeslogotyp är inte ett fotografi av ett ställe. `Small flying
    tiger copenhagen Tall Black RGB.png` föreslogs för åtta adresser och är
    en vektoriserad logotyp. PNG och SVG bär nästan alltid grafik och nästan
    aldrig ett foto, och ordet "logo" i filnamnet räcker för resten.
    """
    delade = Counter(k["fil"] for k in ko)

    #: Våra egna orter. En bild från Jönköping på en verksamhet i Linköping är
    #: lika fel som en från Malmö, och ANDRA_ORTER räknar bara upp orter vi
    #: INTE har. Utan den här mängden slank "ELITE STORA HOTELLET, JÖNKÖPING"
    #: igenom till en verksamhet i Linköping.
    vara_orter = {k["ort"].lower() for k in ko}

    kvar = []
    kedja = grafik = brittisk = felort = sent = 0
    for k in ko:
        namn = k["fil"].lower()
        if namn.endswith((".png", ".svg")) or "logo" in namn:
            grafik += 1
            continue
        if delade[k["fil"]] > 1:
            kedja += 1
            continue
        if "geograph.org.uk" in namn:
            brittisk += 1
            continue
        if fel_ort(k, vara_orter):
            felort += 1
            continue
        if not borjar_med_namnet(k):
            sent += 1
            continue
        kvar.append(k)

    print(
        f"  gallrat: {kedja} delade fil med en annan verksamhet, "
        f"{grafik} logotyp eller vektorgrafik, {brittisk} brittiska, "
        f"{felort} nämnde en annan ort, {sent} bar namnet för sent i filnamnet",
        file=sys.stderr,
    )
    return kvar


#: Svenska orter vi INTE har i registret, men som ofta står i ett filnamn.
#:
#: Listan behöver inte vara fullständig. Den fångar de vanligaste, och varje
#: namn den fångar är ett fel som ögat inte kan se: en granskare som tittar på
#: ett foto av ett apotek kan omöjligt veta att apoteket ligger i Malmö.
ANDRA_ORTER = {
    "göteborg", "goteborg", "malmö", "malmo", "lund", "helsingborg", "umeå",
    "umea", "luleå", "lulea", "gävle", "gavle", "västerås", "vasteras",
    "norrköping", "norrkoping", "borås", "boras", "eskilstuna", "halmstad",
    "växjö", "vaxjo", "sundsvall", "kalmar", "falun", "visby", "kiruna",
    "skokloster", "sigtuna", "trollhättan", "trollhattan",
}


def borjar_med_namnet(kandidat: dict, tak: int = 2) -> bool:
    """Står verksamhetens namn TIDIGT i filnamnet?

    Grinden ovanför kräver bara att alla våra namnord FINNS någonstans i
    titeln, och det räcker inte. En lång bildtext kan råka innehålla dem:

        "2013 WSDC Sochi - Jan Szymanski.JPG"
        "Flor em um café do Parque da Cidade.jpg"
        "Comic History of Rome p 039 Mrs Sextus consoles herself with ..."

    En fil som verkligen FÖRESTÄLLER ett ställe brukar heta efter stället, och
    då står namnet först eller näst intill: "Sommarro Värdshus.jpg", "Stångs
    magasin 4.JPG", "Hotell Scandic Karlstad City.JPG".

    Två ord får stå före, för det räcker till "Hotell", "Restaurang" och
    "Ekar vid". Mätt över 149 kandidater: 21 föll, och samtliga 21 var
    uppenbart fel ställe. Noll riktiga träffar förlorades.
    """
    fil = re.sub(r"^File:|\.\w+$", "", kandidat["fil"])
    i_filen = name_tokens(fil)
    vara = name_tokens(kandidat["namn"])
    if not vara:
        return False
    try:
        start = i_filen.index(vara[0])
    except ValueError:
        return False
    return start <= tak


def fel_ort(kandidat: dict, vara_orter: set) -> bool:
    """Nämner filnamnet en ANNAN ort än verksamhetens?

    Mätt över de 161 kandidater som återstod efter kedje- och logotypgallringen:
    nio filnamn bar en annan svensk ort, och åtta av nio var uppenbart fel
    ställe. "Apoteket Lejonet" i Oskarshamn föreslogs bilden av Apoteket
    Lejonet vid Stortorget i Malmö.

    UNDANTAGET ÄR NÖDVÄNDIGT. Den nionde var "Kalmar nation" i Uppsala, som
    föreslogs "Kalmar Nation 1a hus Kuratorsrummet.jpg". Kalmar nation LIGGER i
    Uppsala; ordet hör till nationens namn och inte till en plats. Ett ortnamn
    som redan står i verksamhetens eget namn säger därför ingenting om var
    bilden är tagen.
    """
    i_filen = set(re.findall(r"[a-zåäöéèü]+", kandidat["fil"].lower()))
    i_namnet = set(re.findall(r"[a-zåäöéèü]+", kandidat["namn"].lower()))
    var_ort = kandidat["ort"].lower()
    misstankta = (ANDRA_ORTER | vara_orter) - {var_ort}
    return bool((i_filen & misstankta) - i_namnet)


def ark() -> int:
    """Steg två: granskningsarket.

    En fil att öppna i webbläsaren, inte en vy i sajten. Skälet är att det här
    är en ENGÅNGSSKÖRD och inte en löpande funktion: sajtens granskningsvy
    finns för besökarnas uppladdningar och lever i Supabase, medan det här är
    ett par hundra beslut som ska tas en gång och sedan aldrig mer.

    Besluten ligger i localStorage så att arket tål en omladdning, och knappen
    längst ned skriver ut de godkända som JSON att klistra in i en fil.
    """
    if not KOFIL.exists():
        raise SystemExit(f"Ingen kö att granska. Kör `hamta` först. Väntade {KOFIL}")

    ko = json.loads(KOFIL.read_text(encoding="utf-8"))

    kort = []
    for i, k in enumerate(ko):
        stod = "sv.wikipedia" if k["svwp"] else f"{k['namnord']} namnord"
        kort.append(
            f"""
    <article class="k" data-i="{i}" data-id="{escape(k['id'])}" data-fil="{escape(k['fil'])}">
      <img src="{escape(k['forhandsvisning'])}" alt="" loading="lazy" />
      <div class="t">
        <h2>{escape(k['namn'])}</h2>
        <p class="m">{escape(k.get('adress') or '')} · {escape(k['ort'])}</p>
        <p class="f"><a href="{escape(k['filsida'])}" target="_blank" rel="noopener">{escape(k['fil'])}</a></p>
        <p class="m">{escape(k['licens'])} · {escape(k.get('attribution') or 'okänd')} · grund: {stod}</p>
        <div class="v">
          <button type="button" data-ja>Ja, det är stället</button>
          <button type="button" data-nej>Nej</button>
        </div>
      </div>
    </article>"""
        )

    html = f"""<!doctype html>
<html lang="sv">
<meta charset="utf-8" />
<title>Granska Commons-kandidater</title>
<style>
  body {{ font: 15px/1.5 system-ui, sans-serif; margin: 0; padding: 24px; background: #fafafa; }}
  h1 {{ font-size: 20px; }}
  .rad {{ position: sticky; top: 0; background: #fafafa; padding: 12px 0; border-bottom: 1px solid #ddd; }}
  .k {{ display: grid; grid-template-columns: 320px 1fr; gap: 20px; align-items: start;
        background: #fff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 16px; margin: 16px 0; }}
  .k[data-beslut="ja"] {{ border-color: #00b92b; }}
  .k[data-beslut="nej"] {{ opacity: .45; }}
  .k img {{ width: 320px; height: 214px; object-fit: cover; border-radius: 8px; background: #eee; }}
  h2 {{ font-size: 17px; margin: 0 0 4px; }}
  .m {{ color: #6e6e73; margin: 2px 0; font-size: 13px; }}
  .f {{ margin: 8px 0; font-size: 13px; }}
  .v {{ margin-top: 12px; display: flex; gap: 8px; }}
  button {{ font: inherit; padding: 8px 14px; border-radius: 8px; border: 1px solid #ccc;
            background: #fff; cursor: pointer; }}
  #ut {{ width: 100%; height: 180px; font: 12px/1.4 ui-monospace, monospace; }}
</style>

<h1>Granska Commons-kandidater</h1>
<p class="m">
  {len(ko)} kandidater. Frågan är BARA: föreställer bilden det här stället?
  Licensen är redan prövad, så en bild som står här får vi visa.
  Besluten sparas i webbläsaren.
</p>

<div class="rad">
  <b><span id="ja">0</span> ja</b> · <span id="nej">0</span> nej ·
  <span id="kvar">{len(ko)}</span> kvar
  <button type="button" id="skriv">Skriv godkända</button>
</div>

{''.join(kort)}

<h2>Godkända</h2>
<p class="m">Spara i en fil och kör
  <code>python3 pipeline/commonsko.py tillampa site/src/data/*.json --godkanda FIL</code></p>
<textarea id="ut" readonly></textarea>

<script>
  const NYCKEL = 'prikko-commons-ko';
  const beslut = JSON.parse(localStorage.getItem(NYCKEL) || '{{}}');

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
        localStorage.setItem(NYCKEL, JSON.stringify(beslut));
        rakna();
      }});
    }}
  }}

  document.getElementById('skriv').addEventListener('click', () => {{
    const ut = [...document.querySelectorAll('.k')]
      .filter(k => beslut[k.dataset.id] === 'ja')
      .map(k => ({{ id: k.dataset.id, fil: k.dataset.fil }}));
    document.getElementById('ut').value = JSON.stringify(ut, null, 1);
  }});

  rakna();
</script>
</html>
"""

    ARKFIL.write_text(html, encoding="utf-8")
    print(f"{len(ko)} kandidater skrivna till {ARKFIL}", file=sys.stderr)
    return 0


def tillampa(filer: List[Path], godkanda_fil: Path, store, db) -> int:
    """Steg tre: hämta, lagra och skriv in de godkända.

    Samma lagringsväg som `hamta_commonsbilder.py`, alltså `commons.lookup`
    plus `commons.store_image`. Bilden ska ligga hos oss och aldrig
    varmlänkas, och raden ska skrivas både i filen och i databasen: annars är
    bilden borta vid nästa nattkörning, precis som öppettiderna en gång blev.
    """
    from hamta_commonsbilder import skriv_raden  # noqa: PLC0415

    godkanda: Dict[str, str] = {
        rad["id"]: rad["fil"] for rad in json.loads(godkanda_fil.read_text(encoding="utf-8"))
    }
    skrivna = 0

    for path in filer:
        payload = json.loads(path.read_text(encoding="utf-8"))
        kommun = payload["municipality"]["slug"]
        rort = False
        for e in payload["establishments"]:
            titel = godkanda.get(e["id"])
            if titel is None:
                continue
            funnen = commons.lookup(titel)
            if funnen is None:
                print(f"  {e['name']}: {titel} duger inte längre, hoppas över", file=sys.stderr)
                continue
            lagrad = commons.store_image(store, kommun, e["id"], funnen)
            skriv_raden(e, lagrad, db)
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
    parser.add_argument("--tak", type=int, help="prova bara så här många verksamheter")
    parser.add_argument("--godkanda", type=Path, help="JSON ur granskningsarket")
    parser.add_argument("--lokal", help="skriv bilderna till en katalog i stället för lagringen")
    parser.add_argument("--bas-url", dest="bas_url", help="publik bas-URL för --lokal")
    args = parser.parse_args()

    if args.kommando == "hamta":
        if not args.files:
            raise SystemExit("hamta kräver datafiler")
        return hamta(args.files, args.tak)

    if args.kommando == "ark":
        return ark()

    if not args.files:
        raise SystemExit("tillampa kräver datafiler")
    if not args.godkanda:
        raise SystemExit("tillampa kräver --godkanda med JSON ur granskningsarket")

    # Klienten bor i hamta_commonsbilder.py och INTE i prikko/. Första
    # versionen importerade `prikko.supabase`, en modul jag hittade på i
    # stället för att läsa hur den befintliga hämtaren gör, och kommandot föll
    # på ModuleNotFoundError innan det hann göra något alls.
    from hamta_commonsbilder import Supabase, build_store  # noqa: PLC0415

    store = build_store(args)

    db = None
    if not args.lokal:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_KEY")
        if url and key:
            db = Supabase(url, key)
        else:
            # Samma besked som hamta_commonsbilder ger, och av samma skäl:
            # skrivs bilden bara i datafilen bygger nattens export om filen ur
            # databasen och tar bort den igen.
            raise SystemExit(
                "SUPABASE_URL och SUPABASE_SERVICE_KEY saknas.\n\n"
                "Utan dem skrivs bilderna bara i datafilen, och nattens\n"
                "export_supabase.py bygger om filen ur databasen och tar då bort\n"
                "dem igen. Nycklarna bor i ~/.prikko-env:\n\n"
                "    set -a; source ~/.prikko-env; set +a\n"
            )

    return tillampa(args.files, args.godkanda, store, db)


if __name__ == "__main__":
    raise SystemExit(main())
