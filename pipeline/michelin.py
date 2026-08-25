#!/usr/bin/env python3
"""Granskningskö för Michelinstjärnor ur Wikidata.

    python3 pipeline/michelin.py hamta site/src/data/*.json
    python3 pipeline/michelin.py ark
    python3 pipeline/michelin.py tillampa site/src/data/*.json --godkanda FIL

Tre steg, och det mellersta är en människa. Skriptet publicerar ingenting av
sig självt, precis som `commonsko.py`.


═══ VARFÖR EN KÖ NÄR GRINDARNA ÄR SÅ HÅRDA ═══════════════════════════════════

Bildkön finns därför att en maskin inte kan se vad ett fotografi föreställer.
Här är skälet ett annat, och det är ANTALET.

Hela riket ger 42 objekt, varav 30 med en gällande stjärna. Nio av dem
passerar alla grindar mot vårt register och fyra till faller på avståndet inom
samma stad. Tretton är få nog att läsa med ögonen, och påståendet är av den
sorten som inte går att ta tillbaka: "Operakällaren har en Michelinstjärna" står
kvar i Googles index långt efter att vi rättat filen.

Grindarna i `prikko/michelin.py` fäller det en maskin KAN fälla: fel namn, fel
avstånd, fel slags ting, indragen stjärna. Kvar står frågan bara en människa kan
svara på, och det är om Wikidata-objektet och raden i kommunens register är
samma verksamhet. Två krogar kan heta samma sak i samma kvarter.

Granskaren ser hela stjärnhistoriken i arket, de indragna påståendena
inbegripna, så att en felaktig gällande-markering i Wikidata går att upptäcka.


═══ VAD SKRIPTET ALDRIG GÖR ══════════════════════════════════════════════════

Skriver aldrig i `site/src/data/*.json` utan ett godkännandebeslut. `hamta` rör
bara sin egen fil i data/interim, och `ark` bara sin egen HTML.


═══ VARFÖR UPPGIFTEN INTE GÅR TILL SUPABASE ══════════════════════════════════

`michelin` står i `export_supabase.FILFALT`, alltså bland de fält som BARA bor
i filen och bärs över orört av varje nattkörning. Samma väg som `hours`,
`contact`, `stop` och `parking`. Bilderna går den andra vägen, genom tabellen
`images`, och det är för att de har en tabell att gå till.

Att lägga till en kolumn för tio rader hade kostat en migrering, en
exportgren och en läsare i `export_supabase.export`, och FILFALT finns just
för det fallet. Raden i listan är obligatorisk: utan den raderar nästa lyckade
nattkörning uppgiften tyst, vilket redan hänt fyra gånger på fyra dygn med
andra fält.
"""

from __future__ import annotations

import argparse
import datetime
import json
import sys
from html import escape
from pathlib import Path
from typing import Dict, List, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko import michelin as stjarnor  # noqa: E402

ROOT = Path(__file__).resolve().parent
KOFIL = ROOT / "data" / "interim" / "michelin_ko.json"
ARKFIL = ROOT.parent / "brand" / "_granska-michelin.html"

WIKIDATA = "https://www.wikidata.org/wiki/"


def _stjarnhistorik(objekt: stjarnor.Stjarnobjekt) -> List[dict]:
    """Alla påståenden, gällande som indragna, i läsbar form.

    DE INDRAGNA STÅR MED MED AVSIKT. Granskaren ska se att Operakällaren hade
    en stjärna 1998 till 2009 OCH har en sedan 2014, för det är just den
    formen som skiljer en riktig gällande stjärna från en Wikidata-rad där
    någon glömt skriva slutåret.
    """
    return [
        {
            "start": u.start,
            "slut": u.slut,
            "antal": u.antal,
            "gallande": u.gallande,
        }
        for u in objekt.utmarkelser
    ]


def _post(
    e: dict,
    kommun: dict,
    objekt: stjarnor.Stjarnobjekt,
    idag: str,
    grind: Optional[str] = None,
    skal: Optional[str] = None,
    meter: Optional[float] = None,
    granskningsbar: bool = False,
) -> dict:
    """En rad i kön, och SAMMA form för en träff som för en avvisad.

    Granskaren ställer samma fråga i båda fallen, alltså ska kortet visa samma
    saker: vår rad, Wikidatas objekt, hela stjärnhistoriken och avståndet.
    Skillnaden ligger i `grind` mot `skal` och i om kortet har knappar.

    `michelin` byggs även för de avvisade. Godkänns en av dem är det den raden
    som ska skrivas, och att bygga den här i stället för i `tillampa` gör att
    det som granskas är exakt det som skrivs.
    """
    aktuell = objekt.aktuell()
    rad = stjarnor.raden(objekt)
    rad["checkedAt"] = idag
    return {
        "id": e["id"],
        "namn": e["name"],
        "adress": e.get("address"),
        "typer": e.get("types") or [],
        "kommun": kommun["slug"],
        "ort": kommun["city"],
        "qid": objekt.qid,
        "wikidatanamn": objekt.namn,
        "beskrivning": objekt.beskrivning,
        "plats": objekt.plats,
        "klasser": list(objekt.klasser),
        "grind": grind,
        "skal": skal,
        "meter": round(meter, 1) if meter is not None else None,
        "granskningsbar": granskningsbar,
        "stjarnor": aktuell.antal if aktuell else None,
        "sedan": aktuell.start[:4] if aktuell and aktuell.start else None,
        "historik": _stjarnhistorik(objekt),
        "michelin": rad,
    }


def hamta(filer: List[Path]) -> int:
    """Steg ett: fråga Wikidata, para mot registret, skriv kön.

    EN fråga för hela riket och inte en per kommun. Objekten är 42 stycken och
    ligger i samma svar oavsett vilken kommun vi jämför dem med, till skillnad
    från bildspåret som frågar per låda därför att lådan är urvalet.
    """
    objekt = stjarnor.hamta_objekt()
    gallande = [o for o in objekt if o.gallande()]
    print(
        f"Wikidata: {len(objekt)} objekt med en Michelinstjärna i Sverige, "
        f"{len(gallande)} med minst ett gällande påstående, "
        f"{len(objekt) - len(gallande)} enbart indragna",
        file=sys.stderr,
    )

    register = stjarnor.Namnregister(objekt)
    for u in register.uteslutna:
        print(
            f"  utesluts helt: {u.qid} har etiketten {u.namn!r}, "
            "som är en beskrivning och inte ett namn",
            file=sys.stderr,
        )
    idag = datetime.date.today().isoformat()

    ko: List[dict] = []
    avvisade: List[dict] = []
    for path in filer:
        payload = json.loads(path.read_text(encoding="utf-8"))
        kommun = payload["municipality"]
        funna = 0
        fallna = 0
        utan_koordinat = 0
        for e in payload["establishments"]:
            if e.get("lat") is None or e.get("lng") is None:
                utan_koordinat += 1
            provning = stjarnor.para(
                register,
                e.get("name"),
                e.get("lat"),
                e.get("lng"),
                kommun["name"],
                kommun["city"],
            )
            for a in provning.avvisade:
                fallna += 1
                avvisade.append(
                    _post(e, kommun, a.objekt, idag, skal=a.skal, meter=a.metres,
                          granskningsbar=a.granskningsbar())
                )
            traff = provning.traff
            if traff is None:
                continue
            ko.append(
                _post(e, kommun, traff.objekt, idag, grind=traff.grind,
                      meter=traff.metres, granskningsbar=True)
            )
            funna += 1

        print(
            f"{kommun['slug']}: {funna} kandidater, {fallna} namnlika som föll, "
            f"av {len(payload['establishments'])} verksamheter "
            f"({utan_koordinat} utan koordinat)",
            file=sys.stderr,
            flush=True,
        )

    for a in avvisade:
        meter = f"{a['meter']:.0f} m" if a["meter"] is not None else "inget avstånd"
        print(
            f"  föll: {a['namn']} ({a['ort']}) → {a['wikidatanamn']} "
            f"{a['qid']} · {a['skal']} · {meter}",
            file=sys.stderr,
        )

    KOFIL.parent.mkdir(parents=True, exist_ok=True)
    KOFIL.write_text(
        json.dumps(
            {"hamtad": idag, "kandidater": ko, "avvisade": avvisade},
            ensure_ascii=False,
            indent=1,
        ),
        encoding="utf-8",
    )
    print(
        f"{len(ko)} kandidater och {len(avvisade)} avvisade i {KOFIL}",
        file=sys.stderr,
    )
    return 0


def _stjarnord(antal: Optional[int]) -> str:
    """"1 stjärna" och inte "1 stjärnor". Arket läses av en människa."""
    if antal is None:
        return "antal saknas"
    return f"{antal} stjärna" if antal == 1 else f"{antal} stjärnor"


def _historikrad(h: dict) -> str:
    antal = _stjarnord(h["antal"])
    # Ett påstående utan P580 är vanligt: fem av de 30 gällande saknar startår.
    # "? och framåt" läser som ett fel i arket; "utan startår" är vad det är.
    start = h["start"][:4] + " och framåt" if h["start"] else "utan startår"
    if h["gallande"]:
        return f"<b>{escape(start)}</b> · {escape(antal)} · GÄLLER"
    slut = h["slut"][:4] if h["slut"] else "?"
    borjan = h["start"][:4] if h["start"] else "?"
    return f"{escape(borjan)} till {escape(slut)} · {escape(antal)} · indragen"


def _kort(k: dict) -> str:
    """Ett granskningskort. Samma form för en träff som för en avståndsmiss.

    Skillnaden är EN rad, den som säger varför kortet står där, och den står i
    fetstil på avståndsmissarna. Granskaren ska inte behöva hålla två sorters
    kort i huvudet; hon ska se avståndet och läsa adresserna.
    """
    avstand = f"{k['meter']:.0f} m" if k["meter"] is not None else "ingen koordinat"
    antal = (
        _stjarnord(k["stjarnor"]) if k["stjarnor"] else "Michelinstjärna, antal saknas"
    )
    historik = "".join(f"<li>{_historikrad(h)}</li>" for h in k["historik"])
    if k["grind"]:
        grundrad = f"Grind: {escape(k['grind'])} · {escape(avstand)}"
    else:
        grundrad = (
            f"<b class=\"varn\">Föll på spärren: {escape(k['skal'])}, "
            f"{escape(avstand)}</b>"
        )
    return f"""
    <article class="k" data-id="{escape(k['id'])}" data-qid="{escape(k['qid'])}">
      <div class="v">
        <h2>{escape(k['namn'])}</h2>
        <p class="m">{escape(k.get('adress') or 'adress saknas')} · {escape(k['ort'])}</p>
        <p class="m">{escape(' · '.join(k['typer']) or 'typ saknas')}</p>
      </div>
      <div class="h">
        <h2><a href="{WIKIDATA}{escape(k['qid'])}" target="_blank" rel="noopener">{escape(k['wikidatanamn'])}</a></h2>
        <p class="m">{escape(k['beskrivning'] or 'ingen svensk beskrivning')}</p>
        <p class="m">{escape(k['plats'] or 'ingen P131')} · {escape(', '.join(k['klasser']) or 'ingen P31')}</p>
        <ul class="hist">{historik}</ul>
        <p class="m">{grundrad} · <b>{escape(antal)}</b>{
            f" sedan {escape(k['sedan'])}" if k['sedan'] else ""
        }</p>
      </div>
      <div class="b">
        <button type="button" data-ja>Ja, samma verksamhet</button>
        <button type="button" data-nej>Nej</button>
      </div>
    </article>"""


def _lasrad(k: dict) -> str:
    """En avvisad som bara får läsas. Ingen knapp, ingen data-id."""
    avstand = f"{k['meter']:.0f} m" if k["meter"] is not None else "inget avstånd"
    return f"""
    <article class="f">
      <div>
        <b>{escape(k['namn'])}</b>
        <p class="m">{escape(k.get('adress') or 'adress saknas')} · {escape(k['ort'])}</p>
      </div>
      <div>
        <a href="{WIKIDATA}{escape(k['qid'])}" target="_blank" rel="noopener">{escape(k['wikidatanamn'])} · {escape(k['qid'])}</a>
        <p class="m">{escape(k['skal'])} · {escape(avstand)}</p>
      </div>
    </article>"""


def ark() -> int:
    """Steg två: granskningsarket.

    Samma form som `commonsko.ark`: en fil att öppna i webbläsaren, beslut i
    localStorage, en knapp som skriver ut de godkända som JSON. Skälet är
    detsamma, att det här är ett par tiotal beslut som ska tas en gång och inte
    en löpande funktion som förtjänar en vy i sajten.

    ARKET VISAR INGEN BILD, till skillnad från bildkön, för här är frågan en
    annan. Granskaren jämför två TEXTPOSTER: kommunens rad och Wikidatas
    objekt. Därför står adressen, verksamhetstypen, avståndet, Wikidatas
    beskrivning och hela stjärnhistoriken på kortet, och Q-numret är en länk.

    ══ TRE AVDELNINGAR, OCH BARA TVÅ HAR KNAPPAR ═════════════════════════════

    1. PASSERADE ALLA GRINDAR. Frågan är bara om det är samma verksamhet.

    2. FÖLL PÅ AVSTÅNDET MEN LIGGER I SAMMA STAD. Här är frågan en annan och
       svårare: Wikidatas koordinat säger att det är fel ställe, och granskaren
       ska avgöra om koordinaten är gammal. Adam Albin flyttade från
       Rådmansgatan till Regeringsgatan och Wikidata vet det inte. Se
       `michelin.GRANSKNINGSBAND_M`.

       ATT DE KAN GODKÄNNAS ÄR INTE ATT SPÄRREN GÅR ATT KLICKA FÖRBI. Spärren
       gäller maskinen, som bara har koordinaten att gå på. Granskaren har
       adresserna, och det är ett annat och bättre bevis.

    3. FÖLL PÅ NÅGOT ANNAT. Läses, godkänns aldrig. En indragen stjärna är
       avgjord av Michelin, och en krog femhundra kilometer bort är ett
       namnsammanträffande. Avdelningen finns för att ett fel i Wikidata ska gå
       att upptäcka och rätta DÄR.
    """
    if not KOFIL.exists():
        raise SystemExit(f"Ingen kö att granska. Kör `hamta` först. Väntade {KOFIL}")

    fil = json.loads(KOFIL.read_text(encoding="utf-8"))
    ko = fil["kandidater"]
    granska = [a for a in fil["avvisade"] if a["granskningsbar"]]
    las = [a for a in fil["avvisade"] if not a["granskningsbar"]]

    beslutbara = len(ko) + len(granska)
    kort = "".join(_kort(k) for k in ko)
    tveksamma = "".join(_kort(k) for k in granska)
    lasbara = "".join(_lasrad(k) for k in las)

    html = f"""<!doctype html>
<html lang="sv">
<meta charset="utf-8" />
<title>Granska Michelinstjärnor</title>
<style>
  body {{ font: 15px/1.5 system-ui, sans-serif; margin: 0; padding: 24px; background: #fafafa; }}
  h1 {{ font-size: 20px; }}
  h2.avd {{ font-size: 17px; margin: 32px 0 4px; }}
  .rad {{ position: sticky; top: 0; background: #fafafa; padding: 12px 0; border-bottom: 1px solid #ddd; }}
  .k {{ display: grid; grid-template-columns: 1fr 1fr auto; gap: 24px; align-items: start;
        background: #fff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 16px; margin: 16px 0; }}
  .k[data-beslut="ja"] {{ border-color: #00b92b; }}
  .k[data-beslut="nej"] {{ opacity: .45; }}
  h2 {{ font-size: 17px; margin: 0 0 4px; }}
  .m {{ color: #6e6e73; margin: 2px 0; font-size: 13px; }}
  .varn {{ color: #c00; }}
  .hist {{ margin: 8px 0; padding-left: 18px; font-size: 13px; }}
  .b {{ display: flex; flex-direction: column; gap: 8px; }}
  .f {{ display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 12px 16px;
        border-left: 3px solid #ddd; margin: 8px 0; }}
  button {{ font: inherit; padding: 8px 14px; border-radius: 8px; border: 1px solid #ccc;
            background: #fff; cursor: pointer; white-space: nowrap; }}
  #ut {{ width: 100%; height: 180px; font: 12px/1.4 ui-monospace, monospace; }}
</style>

<h1>Granska Michelinstjärnor</h1>
<p class="m">
  {beslutbara} beslut. Frågan är BARA: är kommunens rad till vänster och
  Wikidatas objekt till höger samma verksamhet?
  Slutåret är redan prövat, så varje kort här har minst ett gällande påstående.
  Historiken står ändå ut, för en gällande rad utan slutår kan vara en rad
  någon glömt avsluta. Besluten sparas i webbläsaren.
</p>

<div class="rad">
  <b><span id="ja">0</span> ja</b> · <span id="nej">0</span> nej ·
  <span id="kvar">{beslutbara}</span> kvar
  <button type="button" id="skriv">Skriv godkända</button>
</div>

<h2 class="avd">Passerade alla grindar ({len(ko)})</h2>
{kort or '<p class="m">Inga.</p>'}

<h2 class="avd">Föll på avståndet men ligger i samma stad ({len(granska)})</h2>
<p class="m">
  Wikidatas koordinat säger att det är fel ställe. Läs BÅDA adresserna innan du
  svarar: den vanliga orsaken är att restaurangen flyttat och att Wikidata står
  kvar på den gamla punkten. Står samma Q-nummer på två av våra rader kan högst
  en av dem vara rätt, och skriptet vägrar skriva båda.
</p>
{tveksamma or '<p class="m">Inga.</p>'}

<h2 class="avd">Föll på något annat ({len(las)})</h2>
<p class="m">
  Går inte att godkänna, och det är avsikten. De står här för att ett fel i
  Wikidata ska gå att upptäcka och rättas där.
</p>
{lasbara or '<p class="m">Inga.</p>'}

<h2 class="avd">Godkända</h2>
<p class="m">Spara i en fil och kör
  <code>python3 pipeline/michelin.py tillampa site/src/data/*.json --godkanda FIL</code></p>
<textarea id="ut" readonly></textarea>

<script>
  const NYCKEL = 'prikko-michelin-ko';
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

  // NYCKELN ÄR ID PLUS Q-NUMMER och inte bara id. Samma verksamhet kan stå på
  // två kort med olika Wikidata-objekt, och ett beslut om det ena är inte ett
  // beslut om det andra.
  for (const kort of document.querySelectorAll('.k')) {{
    const nyckel = kort.dataset.id + '|' + kort.dataset.qid;
    if (beslut[nyckel]) kort.dataset.beslut = beslut[nyckel];
    for (const [val, knapp] of [['ja', '[data-ja]'], ['nej', '[data-nej]']]) {{
      kort.querySelector(knapp).addEventListener('click', () => {{
        beslut[nyckel] = val;
        kort.dataset.beslut = val;
        lager.setItem(NYCKEL, JSON.stringify(beslut));
        rakna();
      }});
    }}
  }}

  document.getElementById('skriv').addEventListener('click', () => {{
    const ut = [...document.querySelectorAll('.k')]
      .filter(k => beslut[k.dataset.id + '|' + k.dataset.qid] === 'ja')
      .map(k => ({{ id: k.dataset.id, qid: k.dataset.qid }}));
    document.getElementById('ut').value = JSON.stringify(ut, null, 1);
  }});

  rakna();
</script>
</html>
"""

    ARKFIL.write_text(html, encoding="utf-8")
    print(
        f"{len(ko)} kandidater, {len(granska)} att bedöma och {len(las)} att läsa "
        f"skrivna till {ARKFIL}",
        file=sys.stderr,
    )
    return 0


def tillampa(filer: List[Path], godkanda_fil: Path) -> int:
    """Steg tre: skriv de godkända i datafilerna.

    Q-NUMRET PRÖVAS OM. Godkännandet gäller ett beslut om att kommunens rad och
    ett visst Wikidata-objekt är samma verksamhet. Faller inte samma qid ut ur
    kön skrivs raden inte, för då har något ändrats mellan granskningen och
    skrivningen.

    ETT Q-NUMMER FÅR STÅ PÅ HÖGST EN RAD, och skriptet stannar om det står på
    två. Samma tanke som `commonsko.rensa` har om en Commons-fil som delas av
    flera verksamheter: en restaurang är ett ställe, och två av våra rader kan
    inte båda vara det. Agrikultur är fallet som gör spärren nödvändig, med
    "Agrikultur Bar" på Skånegatan och "Krog Agrikultur, K/A" på
    Järngravskajen. Att skriva båda hade gett två sidor som var för sig påstår
    att just den bär stjärnan.

    Skriptet STANNAR i stället för att välja. Ett val mellan två rader är
    granskarens och inte skriptets, och ett fel som stoppar körningen är
    ofarligare än ett fel som publicerar sig.

    INGET SKRIVS OM STJÄRNAN DRAGITS IN. Kön bär bara gällande påståenden, men
    en omkörning av `hamta` kan ha gjort kön äldre än Wikidata. Därför skrivs
    `michelin` bort ur raden när den finns där och inte längre är godkänd: en
    stjärna som försvunnit ska försvinna, och en fil som behåller den är exakt
    det fel hela modulen är byggd mot.
    """
    if not KOFIL.exists():
        raise SystemExit(f"Ingen kö att tillämpa. Kör `hamta` först. Väntade {KOFIL}")

    fil = json.loads(KOFIL.read_text(encoding="utf-8"))
    # Båda grupperna, för granskaren får godkänna en avståndsmiss inom bandet.
    # De som INTE är granskningsbara finns inte här och kan alltså inte
    # godkännas ens av en handskriven fil.
    kon = {
        (k["id"], k["qid"]): k
        for k in fil["kandidater"] + [a for a in fil["avvisade"] if a["granskningsbar"]]
    }

    godkanda = [
        (rad["id"], rad["qid"])
        for rad in json.loads(godkanda_fil.read_text(encoding="utf-8"))
    ]

    okanda = [n for n in godkanda if n not in kon]
    if okanda:
        raise SystemExit(
            "Godkännanden som inte finns i kön, eller som inte får godkännas:\n"
            + "\n".join(f"  {i} → {q}" for i, q in okanda)
        )

    per_qid: Dict[str, List[str]] = {}
    for i, q in godkanda:
        per_qid.setdefault(q, []).append(i)
    delade = {q: ids for q, ids in per_qid.items() if len(ids) > 1}
    if delade:
        rader = []
        for q, ids in delade.items():
            for i in ids:
                rader.append(f"  {q} → {kon[(i, q)]['namn']} ({kon[(i, q)]['adress']})")
        raise SystemExit(
            "Samma Wikidata-objekt godkänt på flera verksamheter. Högst en kan "
            "vara rätt:\n" + "\n".join(rader)
        )

    skrivna = borttagna = 0
    per_id = {i: q for i, q in godkanda}
    for path in filer:
        payload = json.loads(path.read_text(encoding="utf-8"))
        rort = False
        for e in payload["establishments"]:
            qid = per_id.get(e["id"])
            if qid is not None:
                ny_rad = dict(kon[(e["id"], qid)]["michelin"])
                if e.get("michelin") != ny_rad:
                    e["michelin"] = ny_rad
                    rort = True
                    skrivna += 1
            elif e.get("michelin") is not None:
                # Se docstringen: en stjärna som inte längre är godkänd tas
                # bort, den lämnas aldrig kvar.
                del e["michelin"]
                rort = True
                borttagna += 1

        if rort:
            path.write_text(
                json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8"
            )
            print(f"  skrev {path}", file=sys.stderr)

    print(f"{skrivna} stjärnor skrivna, {borttagna} borttagna", file=sys.stderr)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("kommando", choices=("hamta", "ark", "tillampa"))
    parser.add_argument("files", nargs="*", type=Path)
    parser.add_argument("--godkanda", type=Path, help="JSON ur granskningsarket")
    args = parser.parse_args()

    if args.kommando == "hamta":
        if not args.files:
            raise SystemExit("hamta kräver datafiler")
        return hamta(args.files)

    if args.kommando == "ark":
        return ark()

    if not args.files:
        raise SystemExit("tillampa kräver datafiler")
    if not args.godkanda:
        raise SystemExit("tillampa kräver --godkanda med JSON ur granskningsarket")
    return tillampa(args.files, args.godkanda)


if __name__ == "__main__":
    raise SystemExit(main())
