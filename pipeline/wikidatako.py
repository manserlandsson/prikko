#!/usr/bin/env python3
"""Granskningskö för Commons-bilder som hittas på Wikidata-objektets NAMN.

    python3 pipeline/wikidatako.py hamta site/src/data/*.json
    python3 pipeline/wikidatako.py ark
    python3 pipeline/wikidatako.py tillampa site/src/data/*.json --godkanda FIL

Tre steg, och det mellersta är en människa. Skriptet publicerar ingenting av
sig självt, precis som `commonsko.py` och `michelin.py`.


═══ VARFÖR DEN HÄR VÄGEN FINNS ═══════════════════════════════════════════════

Ägaren pekade 2026-08-25 på att Frantzén har en bild på Wikipedia som vi inte
visar. Orsaken är uppmätt och exakt: Wikidata-objektet Q5492658 heter
"Frantzén", vår rad heter "Restaurant Frantzén" och ligger 6,5 meter bort, och
`wikidatanamn.names_agree` kräver att ordmängderna är LIKA.

Likhetskravet är rätt för den automatiska vägen och står kvar där. Se
`wikidatanamn` grind 1: delmängdsregeln gav 250 par där verksamheten bara lånat
en plats namn, från "Gränna Chokladfabrik" mot orten Gränna till "Kronans
Apotek Drottninggatan" mot gatan.

Den här kön går den lösare vägen och lägger en människa sist i stället. Två
grindar bär skillnaden, och båda är mätta:

  * GRIND 1B tillåter att VÅRT namn rymmer objektets, aldrig tvärtom.
  * GRIND 5 kastar varje objekt som blir närmaste träff för mer än en av våra
    rader. Ett sådant objekt är ett hus eller en galleria, inte en verksamhet:
    Asecs togs av åtta rader, Fältöversten av sju, Krämaren av fyra.

Alla fem lånen i `wikidatanamn` grind 1 faller fortfarande, och de faller på
grind 2: orten Gränna, torget Östra torget, köpcentret Mitt i city, gatan
Drottninggatan och arenan Behrn Arena står ingen av dem i ALLOWED_CLASSES.

AVSTÅNDET FÄLLER DEM INTE, och det prövades. Sushi Yama Mitt I City ligger 21,4
meter från köpcentret och Kronans Apotek Drottninggatan 25,8 meter från gatan,
alltså innanför varje kort spärr som annars hade varit rimlig.


═══ VARFÖR EN KÖ OCH INTE AUTOMATIK ══════════════════════════════════════════

Samma skäl som bildkön i `commonsko.py`: ett foto på fel verksamhet är ett
påstående om en namngiven verksamhet, och det går inte att ta tillbaka när
sidan är indexerad.

Den automatiska vägens fjärde grind, `wikidatanamn.depicts`, kräver att
verksamhetens hela namn står i filnamnet eller i beskrivningen. Den grinden
släpper igenom 3 av 138 delmängdspar, OCH DEN FÄLLER FRANTZÉN: filen heter
"AV4A6287 (25063454437).jpg" och beskrivningen är "AV4A6287". Att lätta på den
grinden i stället hade varit att gissa på motivet, och just den frågan är den
enda en människa svarar bättre på än en regel.

Kön innehåller därför både det grind 4 fäller och det den släpper igenom, och
frågan på varje kort är densamma: föreställer bilden det här stället?


═══ TVÅ KÄLLOR TILL EN FIL ═══════════════════════════════════════════════════

    P18        objektets egen bild på Wikidata
    ARTIKEL    ledbilden i objektets artikel på svenska Wikipedia, för objekt
               som saknar P18 helt. Se `wikidatanamn.artikelobjekt_i_box`.

Den andra källan mättes innan den byggdes: 3 705 objekt i våra lådor saknar
P18 och har en svensk artikel, 43 av dem paras mot en av våra rader, 39 står
kvar efter grind 5, 25 har en ledbild alls och 20 hamnar i kön. Bland dem
Mathias Dahlgren, Zum Franziskaner, Stallet Café, Örebro Waldorfskola och fyra
uppsalanationer.

Belägget är svagare än P18:s och står utskrivet på varje kort. En ledbild är
vald till en TEXT om objektet, inte till objektet, och två av de 25 visar
huset intill i stället: `Life Ikanohuset` fick "Ikea Kungen 2009.jpg" och
`Klosterbacken Vårdboende` fick "Norra sjukhemmet Örebro.jpg".


═══ UTFALLET, MÄTT 2026-08-25 ÖVER ALLA TOLV KOMMUNERNA ══════════════════════

    par genom grind 1, 1b och 2                                      445
      varav från en P18                                              403
      varav från en artikels ledbild                                  42
    varav kvar efter grind 5, som kastar 80 rader på 31 objekt       365
    varav raden inte redan har en Commons-bild                       146
    varav artikeln faktiskt HAR en ledbild                           132
    varav filen är fri och av rätt format (grind 3)                  127
    ─────────────────────────────────────────────────────────────────────
    kandidater i kön                                                 127

      varav namnen är LIKA                                            51
      varav genom grind 1b, alltså nya med den här mätningen          76
      varav filen kommer från en P18                                 107
      varav från en artikels ledbild                                  20

    Stockholm 90, Linköping 12, Jönköping 8, Uppsala 8, Örebro 6,
    Karlstad 2, Kristinehamn 1. Fem kommuner får noll.

DE 51 SOM ÄR NAMNLIKA ÄR INTE ETT FEL. De har passerat den automatiska vägens
alla grindar utom den fjärde, motivet, och att de står här är just vad kön är
till för. Bland dem både riktiga bilder den grinden kostat, som Vete-Katten och
Hotel Rival, och de fel den fällt med rätta: Kristinagården fick kyrkan intill
och "Bank Hotel" fick husets fasad på Arsenalsgatan 6.

Tio av de 127 bär verksamhetens namn i filnamnet och hade alltså gått igenom
automatiskt. De står ändå i kön, för den här vägen skriver ingenting själv.


═══ VAD SKRIPTET ALDRIG GÖR ══════════════════════════════════════════════════

Skriver aldrig i `site/src/data/*.json` utan ett godkännandebeslut. `hamta` rör
bara sin egen fil i data/interim, och `ark` bara sin egen HTML.

Rör aldrig `wikidatanamn.pair`, alltså den automatiska vägen. Grind 1b och
grind 5 lever i `para_brett` och här. Se `test_wikidatako.SmalaVagenAroRord`.
"""

from __future__ import annotations

import argparse
import datetime
import json
import os
import sys
import time
from html import escape
from pathlib import Path
from typing import Dict, List, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko import commons, wikidatanamn as wn  # noqa: E402

ROOT = Path(__file__).resolve().parent
KOFIL = ROOT / "data" / "interim" / "wikidata_ko.json"
ARKFIL = ROOT.parent / "brand" / "_granska-wikidatabilder.html"

WIKIDATA = "https://www.wikidata.org/wiki/"

#: Var filen kom ifrån. Står på kortet, för de två är olika starka belägg.
KALLA_P18 = "P18 på objektet"
KALLA_ARTIKEL = "ledbilden i svenska Wikipedias artikel"

#: Bildkällor en godkänd Commons-bild får ersätta. Samma lista och samma skäl
#: som `hamta_commonsbilder.REPLACEABLE`: en `owner`-bild är inskickad av
#: verksamheten och släppt fram av redaktionen, och den rör vi inte.
ERSATTBARA = {"mapillary", "panoramax", "own", "wikimedia"}

#: Sekunder mellan anrop mot Commons. Tjänsten är gratis och drivs av en
#: stiftelse vi lever på att få fråga.
PAUS_S = 0.25


def _kandidater(payload: dict, index: wn.Index, kalla: str) -> List[dict]:
    """Verksamheterna i en kommunfil som paras mot ett objekt i indexet.

    NÄMNAREN ÄR ALLA RADER och inte de konsumentvända, precis som i
    `hamta_commonsbilder.namnkandidater`: Wikidata har skolan, kyrkan och
    äldreboendet som OSM inte kartlägger som matpunkter, och ett foto av
    skolhuset på skolkökets sida är en riktig bild av det stället.
    """
    kommun = payload["municipality"]
    funna = []
    for e in payload["establishments"]:
        lat, lng = e.get("lat"), e.get("lng")
        if lat is None or lng is None:
            continue
        if e.get("geoPrecision") == "approximate":
            # Gatunivå. Koordinaten kan ligga hos grannporten, och då säger
            # avståndsspärren ingenting. 237 av 16 047 rader.
            continue
        traff = wn.para_brett(index, e.get("name"), lat, lng)
        if traff is None:
            continue
        funna.append(
            {
                "id": e["id"],
                "namn": e["name"],
                "adress": e.get("address"),
                "typer": e.get("types") or [],
                "kommun": kommun["slug"],
                "ort": kommun["city"],
                "qid": traff.objekt.qid,
                "wikidatanamn": traff.objekt.namn,
                "beskrivning": traff.objekt.beskrivning,
                "klasser": list(traff.objekt.klasser),
                "grind": traff.grind,
                "kalla": kalla,
                "artikel": traff.objekt.artikel,
                "bild": traff.objekt.bild,
                "meter": round(traff.metres, 1),
                "har_bild": bool(e.get("image")),
                "bildkalla": (e.get("image") or {}).get("source"),
            }
        )
    return funna


def _fyll_ledbilder(kandidater: List[dict]) -> None:
    """Sätt `bild` på artikelspårets kandidater, i efterhand och på plats.

    EFTER hopparningen och inte före. 3 705 objekt saknar P18 och har en
    artikel; 39 av dem paras mot en rad. Att slå upp ledbilden för alla hade
    varit 185 anrop i stället för två, och svaret hade varit detsamma.
    """
    utan = [k for k in kandidater if k["kalla"] == KALLA_ARTIKEL]
    if not utan:
        return
    titlar = [wn.artikeltitel(k["artikel"]) for k in utan]
    karta = wn.ledbilder(titlar)
    for k, titel in zip(utan, titlar):
        k["bild"] = karta.get(titel) or ""


def hamta(filer: List[Path]) -> int:
    """Steg ett: fråga Wikidata, para mot registret, pröva licensen, skriv kön.

    ORDNINGEN ÄR VALD AV KOSTNAD. Grind 1, 1b och 2 är rena jämförelser i
    minnet och går först. Grind 5 kräver hela rikets kandidater och går därför
    efter alla kommuner. Grind 3, licensen, är ett anrop per fil och går sist.

    Grind 4 prövas men fäller ingenting här: den skriver bara ut på kortet om
    filen bär verksamhetens namn, som en upplysning till granskaren.
    """
    idag = datetime.date.today().isoformat()
    alla: List[dict] = []

    for path in filer:
        payload = json.loads(path.read_text(encoding="utf-8"))
        kommun = payload["municipality"]
        box = wn.bounding_box(
            (e.get("lat"), e.get("lng")) for e in payload["establishments"]
        )
        if box is None:
            # Borgholm, Höganäs, Lomma och Svenljunga: 2 431 rader utan en enda
            # koordinat. Utan koordinat finns ingen spärr att pröva mot.
            print(f"{kommun['slug']}: ingen koordinat alls, hoppas över", file=sys.stderr)
            continue

        p18 = _kandidater(payload, wn.Index(wn.objects_in_box(box)), KALLA_P18)
        time.sleep(wn.POLITE_DELAY_S)
        artikel = _kandidater(
            payload, wn.Index(wn.artikelobjekt_i_box(box)), KALLA_ARTIKEL
        )

        # EN RAD FÅR BARA EN KANDIDAT, och P18 vinner. Objektet med en P18 är
        # utpekat som objektets bild; ledbilden är vald till en text om det.
        med_p18 = {k["id"] for k in p18}
        alla.extend(p18)
        alla.extend(k for k in artikel if k["id"] not in med_p18)

        print(
            f"{kommun['slug']}: {len(p18)} par på P18, "
            f"{sum(1 for k in artikel if k['id'] not in med_p18)} på en artikel, "
            f"av {len(payload['establishments'])} verksamheter",
            file=sys.stderr,
            flush=True,
        )
        time.sleep(wn.POLITE_DELAY_S)

    # GRIND 5 ÖVER HELA RIKET, se `wikidatanamn.ett_objekt_en_verksamhet`.
    ensamma = wn.ett_objekt_en_verksamhet([(k["id"], k["qid"]) for k in alla])
    delade = [k for k in alla if k["qid"] not in ensamma]
    alla = [k for k in alla if k["qid"] in ensamma]
    print(
        f"grind 5: {len(delade)} rader kastade, för {len({k['qid'] for k in delade})} "
        "objekt togs av mer än en verksamhet",
        file=sys.stderr,
    )

    _fyll_ledbilder(alla)

    ko: List[dict] = []
    utan_licens = 0
    for k in sorted(alla, key=lambda k: (k["kommun"], k["id"])):
        if k["har_bild"] and k["bildkalla"] not in ERSATTBARA:
            # En `owner`-bild är släppt fram av redaktionen. Att ställa frågan
            # igen är att be någon ta tillbaka ett beslut som redan är taget.
            continue
        if k["bildkalla"] == "wikimedia":
            # Redan en Commons-bild, och den kom genom den SMALA vägen: samma
            # namn, tillåten klass, fri licens OCH namnet i filen. Det är ett
            # starkare belägg än något kort här kan visa, och att lägga fram
            # det igen är att be granskaren riva upp en riktig bild.
            continue
        if not k["bild"]:
            continue
        # GRIND 3. `commons.lookup` svarar None när filen saknas, är av fel
        # format eller bär en licens utanför FREE_LICENCES. En bild vi ändå
        # aldrig får visa hör inte hemma i en kö: den kostar bara ett beslut
        # som inte spelar roll.
        #
        # Nätfelet fångas HÄR och inte i `commons.lookup`, av samma skäl som i
        # `commonsko.hamta`: modulen ska fälla högt när OSM-spåret slår upp
        # sina 27 filer, medan ett avbrutet anrop i en körning på hundratals
        # filer är ett utfall och inte ett haveri.
        try:
            funnen = commons.lookup(k["bild"])
        except Exception as fel:  # noqa: BLE001
            print(f"  {k['namn']}: {k['bild']}: {fel}", file=sys.stderr)
            funnen = None
        time.sleep(PAUS_S)
        if funnen is None:
            utan_licens += 1
            continue
        ko.append(
            {
                **k,
                "fil": funnen.title,
                "licens": funnen.licence,
                "attribution": commons.credit_line(funnen),
                "capturedAt": funnen.captured_at,
                "forhandsvisning": funnen.fetch_url,
                "filsida": commons.file_page_url(funnen.title),
                # Grind 4 som UPPLYSNING och inte som spärr. Står namnet i
                # filen är belägget starkare, och granskaren ska se det.
                "namnet_i_filen": wn.depicts(
                    k["namn"], funnen.title, funnen.description
                ),
            }
        )

    KOFIL.parent.mkdir(parents=True, exist_ok=True)
    KOFIL.write_text(
        json.dumps({"hamtad": idag, "kandidater": ko}, ensure_ascii=False, indent=1),
        encoding="utf-8",
    )
    print(
        f"{len(ko)} kandidater i {KOFIL}. "
        f"{utan_licens} föll på licensen eller formatet.",
        file=sys.stderr,
    )
    return 0


def _kort(i: int, k: dict) -> str:
    """Ett granskningskort.

    Bilden är stor och står först, för frågan är vad den föreställer. Allt
    annat på kortet finns för att kunna svara nej på rätt grund: adressen och
    avståndet säger om det är samma plats, Wikidatas beskrivning och klass
    säger vad objektet är, och grindraden säger vad beviset vilar på.
    """
    grund = [escape(k["grind"]), escape(k["kalla"]), f"{k['meter']:.0f} m"]
    if k["namnet_i_filen"]:
        grund.append("namnet står i filen")
    if k["har_bild"]:
        grund.append(f"ersätter en {escape(k['bildkalla'] or 'okänd')}-bild")
    kalla_lank = (
        f'<a href="{escape(k["artikel"])}" target="_blank" rel="noopener">artikeln</a>'
        if k["kalla"] == KALLA_ARTIKEL and k["artikel"]
        else ""
    )
    return f"""
    <article class="k" data-i="{i}" data-id="{escape(k['id'])}" data-fil="{escape(k['fil'])}">
      <img src="{escape(k['forhandsvisning'])}" alt="" loading="lazy" />
      <div class="t">
        <h2>{escape(k['namn'])}</h2>
        <p class="m">{escape(k.get('adress') or 'adress saknas')} · {escape(k['ort'])}</p>
        <p class="m">{escape(' · '.join(k['typer']) or 'typ saknas')}</p>
        <p class="f">
          <a href="{WIKIDATA}{escape(k['qid'])}" target="_blank" rel="noopener">{escape(k['wikidatanamn'])} · {escape(k['qid'])}</a>
          {kalla_lank}
        </p>
        <p class="m">{escape(k['beskrivning'] or 'ingen svensk beskrivning')} · {escape(', '.join(k['klasser']) or 'ingen P31')}</p>
        <p class="f"><a href="{escape(k['filsida'])}" target="_blank" rel="noopener">{escape(k['fil'])}</a></p>
        <p class="m">{escape(k['licens'])} · {escape(k.get('attribution') or 'okänd')}</p>
        <p class="m">Grund: {' · '.join(grund)}</p>
        <div class="v">
          <button type="button" data-ja>Ja, det är stället</button>
          <button type="button" data-nej>Nej</button>
        </div>
      </div>
    </article>"""


def ark() -> int:
    """Steg två: granskningsarket.

    Samma form som `commonsko.ark` och `michelin.ark`: en fil att öppna i
    webbläsaren, beslut i localStorage, en knapp som skriver ut de godkända som
    JSON. Skälet är detsamma, att det här är ett hundratal beslut som ska tas
    en gång och inte en löpande funktion som förtjänar en vy i sajten.

    EN AVDELNING OCH INTE TVÅ, till skillnad från michelinarket. Där skiljer
    granskaren mellan träffar och avståndsmissar, för där är frågan om två
    textposter är samma verksamhet. Här är frågan densamma på varje kort och
    kräver bara ögat: föreställer bilden det här stället? Att sortera korten
    efter vilken grind de kom in genom hade bara sagt granskaren vad hon borde
    tycka innan hon tittat.
    """
    if not KOFIL.exists():
        raise SystemExit(f"Ingen kö att granska. Kör `hamta` först. Väntade {KOFIL}")

    ko = json.loads(KOFIL.read_text(encoding="utf-8"))["kandidater"]
    kort = "".join(_kort(i, k) for i, k in enumerate(ko))
    p18 = sum(1 for k in ko if k["kalla"] == KALLA_P18)

    html = f"""<!doctype html>
<html lang="sv">
<meta charset="utf-8" />
<title>Granska Wikidata-bilder</title>
<style>
  body {{ font: 15px/1.5 system-ui, sans-serif; margin: 0; padding: 24px; background: #fafafa; }}
  h1 {{ font-size: 20px; }}
  .rad {{ position: sticky; top: 0; background: #fafafa; padding: 12px 0; border-bottom: 1px solid #ddd; }}
  .k {{ display: grid; grid-template-columns: 380px 1fr; gap: 20px; align-items: start;
        background: #fff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 16px; margin: 16px 0; }}
  .k[data-beslut="ja"] {{ border-color: #00b92b; }}
  .k[data-beslut="nej"] {{ opacity: .45; }}
  .k img {{ width: 380px; height: 254px; object-fit: cover; border-radius: 8px; background: #eee; }}
  h2 {{ font-size: 17px; margin: 0 0 4px; }}
  .m {{ color: #6e6e73; margin: 2px 0; font-size: 13px; }}
  .f {{ margin: 8px 0; font-size: 13px; }}
  .v {{ margin-top: 12px; display: flex; gap: 8px; }}
  button {{ font: inherit; padding: 8px 14px; border-radius: 8px; border: 1px solid #ccc;
            background: #fff; cursor: pointer; }}
  #ut {{ width: 100%; height: 180px; font: 12px/1.4 ui-monospace, monospace; }}
</style>

<h1>Granska Wikidata-bilder</h1>
<p class="m">
  {len(ko)} kandidater, {p18} från objektets P18 och {len(ko) - p18} från
  ledbilden i en artikel. Frågan är BARA: föreställer bilden det här stället?
  Licensen är redan prövad, så en bild som står här får vi visa.
  Besluten sparas i webbläsaren.
</p>

<div class="rad">
  <b><span id="ja">0</span> ja</b> · <span id="nej">0</span> nej ·
  <span id="kvar">{len(ko)}</span> kvar
  <button type="button" id="skriv">Skriv godkända</button>
</div>

{kort or '<p class="m">Inga kandidater.</p>'}

<h2>Godkända</h2>
<p class="m">Spara i en fil och kör
  <code>python3 pipeline/wikidatako.py tillampa site/src/data/*.json --godkanda FIL</code></p>
<textarea id="ut" readonly></textarea>

<script>
  const NYCKEL = 'prikko-wikidata-ko';
  /*
   * localStorage bakom en spärr, och det är inte en artighet.
   *
   * Ägaren 2026-08-25: "det funkar ej, knapparna funkar ej." Arket öppnas
   * genom att dubbelklicka på filen, alltså på file://, och Safari behandlar
   * file:// som ett ogenomskinligt ursprung: BARA ATT LÄSA localStorage
   * kastar SecurityError där. Kastet skedde på skriptets första rad, alltså
   * innan en enda knapp hade fått sin lyssnare, och kvar blev ett ark som såg
   * färdigt ut och inte svarade på något.
   *
   * Minnet är en bekvämlighet, inte arkets uppgift. Utan det tål arket ingen
   * omladdning, men knapparna fungerar, och det är den ordning felet visade
   * att vi hade fel på.
   */
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

    Samma lagringsväg som `commonsko.tillampa`, alltså `commons.lookup` plus
    `commons.store_image` plus `hamta_commonsbilder.skriv_raden`. Bilden ska
    ligga hos oss och aldrig varmlänkas, och raden ska skrivas både i filen och
    i databasen: annars är bilden borta vid nästa nattkörning, precis som
    öppettiderna en gång blev.
    """
    from hamta_commonsbilder import skriv_raden  # noqa: PLC0415

    godkanda: Dict[str, str] = {
        rad["id"]: rad["fil"]
        for rad in json.loads(godkanda_fil.read_text(encoding="utf-8"))
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
                print(
                    f"  {e['name']}: {titel} duger inte längre, hoppas över",
                    file=sys.stderr,
                )
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


def ar_kommunfiler(paths):
    """Släpp igenom kommunfiler, tyst förbi allt annat i samma mapp.

    Samma grind och samma skäl som `hamta_commonsbilder.ar_kommunfiler`:
    anropen skrivs som ett glob, och globet fångar allt som ligger i mappen.
    """
    for path in paths:
        try:
            payload = json.loads(Path(path).read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as fel:
            print(f"Hoppar {path}: går inte att läsa som JSON ({fel}).", file=sys.stderr)
            continue
        if not isinstance(payload, dict) or "municipality" not in payload:
            print(f"Hoppar {path}: ingen kommunfil.", file=sys.stderr)
            continue
        yield Path(path)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("kommando", choices=("hamta", "ark", "tillampa"))
    parser.add_argument("files", nargs="*", type=Path)
    parser.add_argument("--godkanda", type=Path, help="JSON ur granskningsarket")
    parser.add_argument("--lokal", help="skriv bilderna till en katalog i stället för lagringen")
    parser.add_argument("--bas-url", dest="bas_url", help="publik bas-URL för --lokal")
    args = parser.parse_args()

    if args.kommando == "hamta":
        if not args.files:
            raise SystemExit("hamta kräver datafiler")
        return hamta(list(ar_kommunfiler(args.files)))

    if args.kommando == "ark":
        return ark()

    if not args.files:
        raise SystemExit("tillampa kräver datafiler")
    if not args.godkanda:
        raise SystemExit("tillampa kräver --godkanda med JSON ur granskningsarket")

    # Klienten och lagringen bor i hamta_commonsbilder.py, inte i prikko/.
    # Samma import och samma skäl som commonsko.py: det finns en väg till
    # hinken och den ska gå genom den modul som redan äger den.
    from hamta_commonsbilder import Supabase, build_store  # noqa: PLC0415

    store = build_store(args)

    db = None
    if not args.lokal:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_KEY")
        if url and key:
            db = Supabase(url, key)
        else:
            raise SystemExit(
                "SUPABASE_URL och SUPABASE_SERVICE_KEY saknas.\n\n"
                "Utan dem skrivs bilderna bara i datafilen, och nattens\n"
                "export_supabase.py bygger om filen ur databasen och tar då bort\n"
                "dem igen. Nycklarna bor i ~/.prikko-env:\n\n"
                "    set -a; source ~/.prikko-env; set +a\n"
            )

    return tillampa(list(ar_kommunfiler(args.files)), args.godkanda, store, db)


if __name__ == "__main__":
    raise SystemExit(main())
