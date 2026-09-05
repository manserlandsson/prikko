#!/usr/bin/env python3
"""Anmäl de adresser som faktiskt ändrats till IndexNow.

    # i nattjobbet, EFTER exporten men FÖRE commiten
    python3 pipeline/indexnow.py andrade --ut data/indexnow-urler.txt

    # i nattjobbet, EFTER push och efter att utrullningen är live
    python3 pipeline/indexnow.py anmal data/indexnow-urler.txt

## Varför protokollet finns här

Stickprovet 2026-08-31 gav ungefär 1 400 av 14 260 sidor i Google, alltså tio
procent (docs/49_indexeringen.md). Domänen skapades 2026-08-03 och är alltså
33 dagar gammal, inte de två månader dokument 49 skriver, och 1,74 procent av
nypublicerade sidor når topp tio inom ett år (docs/59_gtm.md §8). Sökkanalen är
med andra ord omogen och inte trasig, och den här filen forcerar ingenting.

Det den gör är att ta bort en onödig fördröjning. En sökmotor som får veta att
en adress ändrats behöver inte gissa när den ska komma tillbaka, och IndexNow
är den enda kanal vi äger som verkar på timmar i stället för på månader. Bing,
Yandex, Seznam, Naver, Yep och Amazon tar emot den, den kostar ingenting, och
en anmälan till EN slutpunkt delas till alla deltagare (indexnow.org/faq).
**Google deltar inte**, så Google berörs varken till det bättre eller det
sämre av den här filen.

## Vad som anmäls, och varför inte allt

Sajten har 16 140 adresser i sitemapen. Att anmäla dem varje natt vore både
tekniskt tillåtet och praktiskt taget spam: protokollets egen FAQ säger rakt ut
"avoid submitting the same URL many times a day unless there are meaningful
content changes", och 429 Too Many Requests är svaret man får när man ändå gör
det.

Anmälan bygger därför på samma datum som sitemapens `lastmod` bygger på, alltså
på det som faktiskt gör en sida till en annan sida:

  Verksamhetssida   `inspections[0].date`, exakt vad `latestInspectionDate()`
                    i site/src/lib/data.ts läser och vad `lastmodFor()` i
                    astro.config.mjs skriver till sitemapen. Ändras datumet har
                    sidan ett nytt innehåll; ändras det inte har den inte det.
  Ny verksamhet     Adressen fanns inte i går. Den är alltid värd en anmälan.
  Borttagen         Adressen finns inte längre. IndexNow tar emot borttagna
                    adresser med flit, och det är billigare att säga att en
                    sida är borta än att låta en robot upptäcka en 404.
  Kommunens sidor   Kommunens hubb, anmärkningssidan och nytt-och-borta, men
                    BARA för de kommuner där något av ovanstående hände.

Och sist prövas varje adress mot den utrullade sitemapen, se
`sitemapens_adresser()`. Ligger den inte där byggdes sidan inte, och då anmäls
den inte. Undantaget är de borttagna, som ska anmälas just för att de är borta.

DET SISTA ÄR DEN VIKTIGA AVGRÄNSNINGEN, och den vilar på en mätning.
Kommunens sidor ärver sitt `lastmod` från `source.fetchedAt`, och den flyttas
fram av själva hämtningen oavsett om ett enda tecken i datan ändrades. 725 av
sitemapens 16 140 adresser ärver ett sådant datum, alltså 4,5 procent, och över
de fyra nätterna 1 till 5 september flyttades 39 kommundatum varav 19, alltså
49 procent, utan att en enda rad i kommunens fil skiljde sig från gårdagens.

Därför anmäls kommunens ingångar bara när något faktiskt hände i kommunen, och
sidindelningen, kategorierna och områdena anmäls inte alls. Att skicka dem varje
natt hade lärt Bing att våra anmälningar inte betyder något, och det är precis
vad protokollets FAQ varnar för.

## Ordningen mot utrullningen är inte valfri

En anmälan säger "hämta den här adressen nu". Nattjobbet checkar in datan, och
Cloudflare Pages bygger och rullar ut FÖRST DÄREFTER. Anmäls adresserna före
utrullningen hämtar roboten gårdagens sida, och för en ny verksamhet hämtar den
en 404. `anmal` väntar därför tills sitemapen på prikko.se säger att den nya
datan är ute, se `vanta_pa_utrullning()`.

## Nyckeln är publik med flit

Nyckelfilen ligger i site/public/ och serveras från roten. Så ser protokollet
ut: nyckeln bevisar bara att den som anmäler råder över domänen, den skyddar
ingenting, och att gömma den i GitHubs hemligheter hade varit att låtsas att
den är något den inte är. Den ligger därför i repot, och `NYCKEL` nedan och
filen kan inte glida isär eftersom skriptet kontrollerar dem mot varandra.

## Protokollets gränser, som de står i specifikationen

  Nyckelns tecken     a-z, A-Z, 0-9 och bindestreck, 8 till 128 tecken.
                      SPECIFIKATIONEN SÄGER TVÅ SAKER PÅ SAMMA RAD: den räknar
                      upp de tecknen och kallar samtidigt längden "8 till 128
                      hexadecimala tecken". Vår nyckel är därför 32 rena
                      hexadecimala tecken, alltså inom båda läsningarna, och
                      `kontrollera_nyckeln()` prövar mot den vidare regeln.
  Adresser per POST   högst 10 000. Vi ligger normalt på 60 till 90.
  Kropp               `host`, `key` och `urlList` krävs, `keyLocation` är
                      valfri och skickas ändå: den säger var filen ligger och
                      gör ett 403 läsbart.
  Slutpunkt           en räcker. Anmälan delas till samtliga deltagare, i dag
                      Bing, Yandex, Seznam, Naver, Yep och Amazon.
  Svarskoder          200 OK, 202 mottaget med nyckelkontrollen kvar, 400 fel
                      format, 403 nyckeln godtas inte eller filen saknas,
                      422 adressen hör inte till värden, 429 för många
                      anmälningar.
  Frekvens            minst fem minuter mellan två anmälningar av samma
                      adress, och "avoid submitting the same URL many times a
                      day unless there are meaningful content changes".
                      Inget dagligt tak är publicerat; varje motor sätter sitt
                      eget. Det är hela skälet till att den här filen räknar
                      fram vad som ändrats i stället för att skicka alla
                      16 140.

Källa: indexnow.org/documentation och indexnow.org/faq, lästa 2026-09-05.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

# Nyckeln, och filen som bevisar att vi råder över domänen. De två MÅSTE vara
# samma sträng: filen heter efter nyckeln och innehåller nyckeln. Skriptet
# vägrar köra om de skiljer sig åt, för ett 403 från slutpunkten säger inte
# vilket av de tre ställena som är fel.
NYCKEL = "a3b8db5e2407459987cb7d4802c0645e"
NYCKELFIL = Path("site/public") / f"{NYCKEL}.txt"

VARD = "prikko.se"
BAS = f"https://{VARD}"

# Egen user-agent, och den är inte artighet utan ett krav.
#
# Cloudflare framför prikko.se svarar 403 på `Python-urllib/3.12`, alltså på
# den sträng urllib sätter när ingen anges. Mätt 2026-09-05: samma adress,
# `https://prikko.se/sitemap-start-0.xml`, gav 403 utan huvudet och 200 med
# det. Utan raden hade `vanta_pa_utrullning()` aldrig sett en utrullning och
# steget hade fallit mjukt varje natt utan att anmäla någonting, vilket är
# precis den sortens tysta fel som är dyrast att hitta.
UA = "prikko-indexnow/1.0 (+https://prikko.se/)"

# En slutpunkt räcker. api.indexnow.org vidarebefordrar till samtliga
# deltagande motorer, vilket är hela poängen med att protokollet är gemensamt.
# Att skicka samma lista till fyra slutpunkter hade gett fyra gånger så många
# anrop och exakt samma utfall.
SLUTPUNKT = "https://api.indexnow.org/indexnow"

# Specifikationens tak. En normal natt är 60 till 90 adresser, alltså drygt två
# tiopotenser under, men styckningen finns för den natt en kommun lägger om hela
# sitt register.
ADRESSER_PER_POST = 10_000

# Spärr av samma slag som MAX_MISSING_ROWS i load_supabase.py. En natt då tio
# procent av sajten påstås ha ändrats är nästan alltid en trasig hämtning eller
# ett fältbyte i källan, inte tvåtusen nya kontroller. Då ska ingenting anmälas
# förrän en människa tittat: en felaktig anmälan går inte att ta tillbaka, och
# 429 gäller domänen och inte det enskilda anropet.
TAK = 2_000

# Hur länge `anmal` väntar på att utrullningen ska bli synlig. Ett fullt bygge
# tar 4 till 10 minuter för 16 600 sidor lokalt, och Cloudflare Pages lägger
# till kö och utrullning ovanpå det.
#
# TALET ÄR BUNDET TILL NATTJOBBETS `timeout-minutes` och får inte höjas ensamt.
# `ladda`-jobbet i .github/workflows/uppdatera-data.yml har 60 minuter, och
# stegen före det här tar normalt en kvart. Väntar vi längre än så dör jobbet
# mitt i väntan i stället för att falla mjukt, och då syns inte skälet i
# loggen. Faller väntan ut anmäls ingenting, och adresserna kommer med i
# morgondagens körning eftersom de fortfarande skiljer sig från gårdagens
# incheckning då.
VANTETID_SEKUNDER = 25 * 60
POLLNING_SEKUNDER = 60


# ---------------------------------------------------------------------------
# Vad som ändrats
# ---------------------------------------------------------------------------

def _stig(*segment: str) -> str:
    """Rotrelativ sökväg med avslutande snedstreck, som `path()` i lib/urls.ts.

    Formen är inte kosmetik. Utan snedstreck svarar Cloudflare Pages 308 till
    formen med, och en anmäld adress som omdirigerar är en anmälan som kostar
    två hämtningar i stället för en.
    """
    delar = [d.strip("/") for d in segment if d and d.strip("/")]
    return "/" + "/".join(delar) + "/" if delar else "/"


def _indexerbar(e: dict) -> bool:
    """Samma grind som `isIndexable()` i site/src/lib/data.ts.

    En verksamhet utan bedömning eller utan kontroller får en sida som bär
    noindex och som aldrig ligger i sitemapen. Den får inte heller anmälas:
    kvalitetsgrinden gäller, och en sida som inte förtjänar att indexeras ska
    inte bjudas ut till index.

    Reglerna är skrivna två gånger, en gång i TypeScript och en gång här, och
    det är en risk. Den mäts därför bort i stället för att antas: predikatet
    ovan gav 15 402 indexerbara verksamheter av 17 146 i beståndet 2026-09-05,
    och sitemap-verksamheter-0.xml på prikko.se hade samma dag exakt 15 402
    adresser. Glider de isär syns det som en avvikelse i det talet.

    Och skulle de ändå glida isär fångas det innan något anmäls:
    `sitemapens_adresser()` prövar varje adress mot den utrullade sitemapen, och
    en verksamhet som predikatet här släpper igenom men bygget håller utanför
    stryks där. Predikatet är alltså en billig förfiltrering och inte den grind
    som avgör.
    """
    return e.get("verdict") is not None and bool(e.get("inspections"))


def _senaste_kontroll(e: dict) -> str | None:
    """`latestInspectionDate()`: första kontrollens datum, listan är sorterad."""
    kontroller = e.get("inspections") or []
    return kontroller[0].get("date") if kontroller else None


def _las_gammal(sokvag: Path, ref: str) -> dict | None:
    """Gårdagens version av en datafil, ur git.

    Nattjobbet kör det här steget FÖRE commiten, alltså är HEAD gårdagens
    incheckade ögonblicksbild och arbetskopian är nattens. Körs steget efter
    commiten jämförs filen med sig själv och svaret blir noll ändrade varje
    natt, tyst. Samma fälla som `rorelse.py registrera` har, och den fångas
    här av att `andrade` skriver ut hur många adresser den hittade: en rad som
    säger noll varje natt är felet som syns.
    """
    resultat = subprocess.run(
        ["git", "show", f"{ref}:{sokvag.as_posix()}"],
        capture_output=True,
    )
    if resultat.returncode != 0:
        return None
    return json.loads(resultat.stdout.decode("utf-8"))


def andrade_adresser(datakatalog: Path, ref: str) -> tuple[list[str], str | None, list[str]]:
    """Adresserna vars innehåll ändrats sedan `ref`, plus datans datum.

    Returnerar (adresser, datadatum, anteckningar). Datadatumet är den
    färskaste hämtningen över alla källor, alltså exakt samma tal som
    `dataUpdated()` ger sitemapens `lastmod` för startsidan, och det är det
    `anmal` väntar på ska bli synligt på prikko.se.
    """
    adresser: list[str] = []
    anteckningar: list[str] = []
    datadatum = ""

    for fil in sorted(datakatalog.glob("*.json")):
        ny = json.loads(fil.read_text(encoding="utf-8"))
        kommun = ny["municipality"]["slug"]

        hamtad = (ny.get("source") or {}).get("fetchedAt")
        if hamtad and hamtad[:10] > datadatum:
            datadatum = hamtad[:10]

        gammal = _las_gammal(fil, ref)
        if gammal is None:
            # Ny kommun i beståndet. Hela kommunen är ny och skulle ensam kunna
            # fylla anmälan; den lämnas därför åt sitemapen och åt vanlig
            # genomsökning, och bara ingångarna anmäls.
            anteckningar.append(f"{kommun}: ingen tidigare version i {ref}, bara ingångarna anmäls")
            adresser.extend(_kommunsidor(kommun))
            continue

        fore = {
            e["slug"]: _senaste_kontroll(e)
            for e in gammal["establishments"]
            if _indexerbar(e)
        }
        efter = {
            e["slug"]: _senaste_kontroll(e)
            for e in ny["establishments"]
            if _indexerbar(e)
        }

        nya = [s for s in efter if s not in fore]
        borta = [s for s in fore if s not in efter]
        rorda = [s for s in efter if s in fore and efter[s] != fore[s]]

        # De borta märks med ett minus, och det är inte bokföring.
        # `anmal` prövar varje anmäld adress mot den utrullade sitemapen och
        # kastar det som inte ligger där. En borttagen adress ligger per
        # definition inte i sitemapen, och den ska ändå anmälas: det är
        # billigare att tala om att en sida är borta än att låta en robot
        # upptäcka en 404 på egen hand.
        for slug in sorted(nya + rorda):
            adresser.append(_stig(kommun, slug))
        for slug in sorted(borta):
            adresser.append("-" + _stig(kommun, slug))

        if nya or borta or rorda:
            adresser.extend(_kommunsidor(kommun))
            anteckningar.append(
                f"{kommun}: {len(nya)} nya, {len(borta)} borta, {len(rorda)} med ny kontroll"
            )

    return sorted(set(adresser)), (datadatum or None), anteckningar


def _kommunsidor(kommun: str) -> list[str]:
    """Kommunens ingångar, och bara de.

    Hubben, anmärkningssidan och nytt-och-borta är de tre sidor som ändras när
    kommunens bestånd gör det, och de tre som länkar vidare till resten.

    DEN TREDJE FINNS INTE ALLTID, och det är skälet till att `anmal` prövar
    varje adress mot den utrullade sitemapen i stället för att lita på den här
    listan. `/[kommun]/nytt-och-borta/` byggs bara för kommuner över
    `MIN_MOVEMENT_PAGE = 12` i site/src/lib/rorelse.ts. Mätt mot prikko.se
    2026-09-05: tre av tretton kommuner svarar 200 och tio svarar 404. Att
    räkna upp villkoret här hade betytt att tröskeln står på två ställen och
    glider isär den dag den ändras; sitemapen vet redan svaret.

    Sidindelningen, kategorierna och områdena står med flit utanför. De ärver
    kommunens `lastmod` och är omkring 600 adresser tillsammans, alltså skulle
    de dominera varje natts anmälan utan att en enda av dem behöver hämtas om:
    en ny verksamhet i Stockholm ändrar en av 85 sidindelade sidor, inte alla
    85, och vilken av dem är inte känt här. Roboten som hämtar hubben hittar
    dem ändå, och sitemapen räknar upp dem varje dygn.
    """
    return [_stig(kommun), _stig(kommun, "anmarkningar"), _stig(kommun, "nytt-och-borta")]


# ---------------------------------------------------------------------------
# Anmälan
# ---------------------------------------------------------------------------

def _hamta(url: str) -> str:
    """Hämta en textfil från sajten, med vår egen user-agent. Se UA ovan."""
    begaran = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(begaran, timeout=60) as svar:
        return svar.read().decode("utf-8")


def sitemapens_adresser() -> set[str]:
    """Varje sökväg som ligger i den utrullade sitemapen.

    ## Varför anmälan prövas mot sitemapen och inte mot en egen regel

    Skriptet räknar fram adresserna ur datafilerna, alltså ur samma källa som
    bygget läser, men det BYGGER inte sajten. Två saker avgörs därför någon
    annanstans: `isIndexable()` i site/src/lib/data.ts, som håller 1 744 av
    17 146 verksamheter utanför sitemapen, och de trösklar som avgör om en
    listsida över huvud taget byggs, till exempel `MIN_MOVEMENT_PAGE`.

    Att skriva om de reglerna här vore att ha dem på två ställen. Sitemapen är
    i stället bygget självt, sett utifrån: ligger adressen där finns sidan och
    får indexeras, ligger den inte där ska den inte anmälas. Det gör grinden
    till en mätning i stället för ett antagande, och det är samma hållning som
    `sitemapGuard` i site/astro.config.mjs redan har mot sig själv.

    Elva filer och 16 140 adresser 2026-09-05, varav 1,72 MB i den största.
    Hämtningen tar under en sekund och görs en gång per körning.
    """
    index = _hamta(f"{BAS}/sitemap-index.xml")
    stigar: set[str] = set()
    for fil in re.findall(r"<loc>([^<]+)</loc>", index):
        for loc in re.findall(r"<loc>([^<]+)</loc>", _hamta(fil)):
            if loc.startswith(BAS):
                stigar.add(loc[len(BAS) :] or "/")
    return stigar


def kontrollera_nyckeln() -> None:
    """Nyckeln, filnamnet och filinnehållet måste vara samma sträng.

    Slutpunkten svarar 403 när nyckeln inte godtas, och den koden skiljer inte
    på "fel nyckel i anropet", "filen saknas i roten" och "filen innehåller
    något annat än nyckeln". Att pröva de tre här i stället gör felet läsbart
    innan anropet ens görs.
    """
    if not re.fullmatch(r"[A-Za-z0-9-]{8,128}", NYCKEL):
        sys.exit(
            f"NYCKEL='{NYCKEL}' bryter mot protokollet: 8 till 128 tecken ur "
            "a-z, A-Z, 0-9 och bindestreck."
        )
    if not NYCKELFIL.exists():
        sys.exit(
            f"{NYCKELFIL} saknas. Nyckelfilen måste ligga i site/public/ så att "
            f"den serveras från {BAS}/{NYCKEL}.txt, annars svarar slutpunkten 403."
        )
    innehall = NYCKELFIL.read_text(encoding="utf-8").strip()
    if innehall != NYCKEL:
        sys.exit(
            f"{NYCKELFIL} innehåller '{innehall[:40]}' men NYCKEL är '{NYCKEL}'. "
            "Filens namn, filens innehåll och konstanten ska vara samma sträng."
        )


def vanta_pa_utrullning(datadatum: str) -> bool:
    """Vänta tills prikko.se serverar den nya datan.

    Kontrollen läser `sitemap-start-0.xml`, som är 1,1 kB och bär startsidans
    `lastmod`. Startsidans `lastmod` är `dataUpdated()`, alltså den färskaste
    hämtningen över alla källor, alltså exakt det datum `andrade` just räknade
    fram ur samma filer. Är de två lika är nattens bygge ute.

    Filen och inte sidan, av två skäl: den är tusen gånger mindre än
    verksamhetssitemapen, och `.xml` ligger utanför Cloudflares cachade
    filändelser (se site/public/_headers), så svaret kommer från origin och kan
    inte vara en gammal kantkopia.
    """
    slut = time.time() + VANTETID_SEKUNDER
    sett = None
    while time.time() < slut:
        try:
            xml = _hamta(f"{BAS}/sitemap-start-0.xml")
            trave = re.search(
                rf"<url><loc>{re.escape(BAS)}/</loc><lastmod>(\d{{4}}-\d{{2}}-\d{{2}})",
                xml,
            )
            sett = trave.group(1) if trave else None
            if sett and sett >= datadatum:
                print(f"Utrullningen är ute: startsidans lastmod är {sett}.", file=sys.stderr)
                return True
        except (urllib.error.URLError, TimeoutError) as fel:
            print(f"  sitemapen svarade inte ({fel}), försöker igen", file=sys.stderr)
        print(
            f"  väntar på utrullning, sitemapen säger {sett or 'inget'}, vi vill ha {datadatum}",
            file=sys.stderr,
        )
        time.sleep(POLLNING_SEKUNDER)

    print(
        f"Utrullningen syntes inte inom {VANTETID_SEKUNDER // 60} minuter "
        f"(sitemapen säger {sett or 'inget'}, vi väntade på {datadatum}).\n"
        "Ingenting anmäls. Adresserna anmäls i morgon i stället, eftersom de\n"
        "fortfarande skiljer sig från gårdagens incheckning då.",
        file=sys.stderr,
    )
    return False


def anmal(adresser: list[str]) -> int:
    """POSTa adresserna och skriv ut vad svarskoden betyder.

    Returnerar antalet stycken som gick igenom.
    """
    BETYDELSE = {
        200: "OK, adresserna är mottagna.",
        202: "Mottaget, nyckeln kontrolleras. Det är ett normalt svar och inget fel.",
        400: "Fel format i anropet. Läs JSON-kroppen nedan.",
        403: "Nyckeln godtas inte. Ligger nyckelfilen i roten och innehåller den nyckeln?",
        422: "Adresserna hör inte till värden, eller nyckeln matchar inte schemat.",
        429: "För många anmälningar. Domänen är tillfälligt bromsad.",
    }

    lyckade = 0
    for start in range(0, len(adresser), ADRESSER_PER_POST):
        stycke = adresser[start : start + ADRESSER_PER_POST]
        kropp = json.dumps(
            {
                "host": VARD,
                "key": NYCKEL,
                "keyLocation": f"{BAS}/{NYCKEL}.txt",
                "urlList": [f"{BAS}{a}" for a in stycke],
            },
            ensure_ascii=False,
        ).encode("utf-8")

        begaran = urllib.request.Request(
            SLUTPUNKT,
            data=kropp,
            headers={"Content-Type": "application/json; charset=utf-8"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(begaran, timeout=60) as svar:
                kod, text = svar.status, svar.read().decode("utf-8", "replace")[:300]
        except urllib.error.HTTPError as fel:
            kod, text = fel.code, fel.read().decode("utf-8", "replace")[:300]
        except urllib.error.URLError as fel:
            print(f"  slutpunkten svarade inte: {fel}", file=sys.stderr)
            continue

        forklaring = BETYDELSE.get(kod, "okänd kod, se indexnow.org/documentation")
        print(f"  {len(stycke)} adresser → HTTP {kod}: {forklaring}", file=sys.stderr)
        if text.strip():
            print(f"    svarskropp: {text.strip()}", file=sys.stderr)

        if kod in (200, 202):
            lyckade += len(stycke)
        elif os.environ.get("GITHUB_ACTIONS"):
            print(f"::warning title=IndexNow {kod}::{forklaring}")

    return lyckade


# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="kommando", required=True)

    a = sub.add_parser("andrade", help="räkna fram adresserna som ändrats")
    a.add_argument("--data", type=Path, default=Path("site/src/data"))
    a.add_argument(
        "--fore",
        default="HEAD",
        help="git-referensen att jämföra mot. HEAD i nattjobbet, där steget "
        "körs före commiten och HEAD därför är gårdagens ögonblicksbild.",
    )
    a.add_argument("--ut", type=Path, default=Path("data/indexnow-urler.txt"))

    n = sub.add_parser("anmal", help="anmäl adresserna till IndexNow")
    n.add_argument("fil", type=Path)
    n.add_argument(
        "--hoppa-over-vantan",
        action="store_true",
        help="anmäl utan att först vänta på att utrullningen syns. Bara för "
        "manuell körning mot en sajt som redan är ute.",
    )
    n.add_argument("--torrkor", action="store_true", help="skriv ut, skicka inte")
    n.add_argument(
        "--tvinga",
        action="store_true",
        help=f"anmäl även fler än {TAK} adresser. Se TAK i filen för varför "
        "spärren finns.",
    )

    args = parser.parse_args()
    kontrollera_nyckeln()

    if args.kommando == "andrade":
        adresser, datadatum, anteckningar = andrade_adresser(args.data, args.fore)
        for rad in anteckningar:
            print(f"  {rad}", file=sys.stderr)
        args.ut.parent.mkdir(parents=True, exist_ok=True)
        # Datadatumet står först, som en rad med #, så att `anmal` vet vilken
        # utrullning den ska vänta på utan att räkna om något.
        args.ut.write_text(
            f"# datadatum {datadatum or 'okant'}\n" + "\n".join(adresser) + "\n",
            encoding="utf-8",
        )
        print(
            f"\n{len(adresser)} adresser ändrade sedan {args.fore}, skrivna till {args.ut}.",
            file=sys.stderr,
        )
        return

    if not args.fil.exists():
        sys.exit(f"{args.fil} finns inte. Kör 'indexnow.py andrade' först.")

    rader = args.fil.read_text(encoding="utf-8").splitlines()
    datadatum = None
    adresser = []
    borttagna = set()
    for rad in rader:
        rad = rad.strip()
        if rad.startswith("# datadatum "):
            datadatum = rad.split()[-1]
        elif rad.startswith("-/"):
            borttagna.add(rad[1:])
            adresser.append(rad[1:])
        elif rad:
            adresser.append(rad)

    if not adresser:
        print("Inga ändrade adresser. Ingenting anmäls, och det är rätt.", file=sys.stderr)
        return

    if len(adresser) > TAK and not args.tvinga:
        sys.exit(
            f"{len(adresser)} adresser ändrade, spärren går vid {TAK}.\n"
            "Så mycket ändras inte på en natt. Kontrollera om en källa bytt\n"
            "format eller om en kommun lagt om sin id-serie, och kör om med\n"
            "--tvinga när talet är förklarat."
        )

    if not args.torrkor and not args.hoppa_over_vantan:
        if not datadatum or datadatum == "okant":
            sys.exit(
                f"{args.fil} saknar raden '# datadatum'. Utan den går det inte att\n"
                "veta vilken utrullning som ska vara ute innan adresserna anmäls."
            )
        if not vanta_pa_utrullning(datadatum):
            return

    # Grinden mot den utrullade sitemapen. Se `sitemapens_adresser()` för
    # varför den ligger här och inte i en egen regel, och `_kommunsidor()` för
    # det fel som gjorde den nödvändig: tio av tretton `nytt-och-borta`-sidor
    # byggs inte och svarade 404 när det mättes 2026-09-05.
    i_sitemapen = sitemapens_adresser()
    kvar = [a for a in adresser if a in i_sitemapen or a in borttagna]
    if len(kvar) < len(adresser):
        strukna = [a for a in adresser if a not in kvar]
        print(
            f"{len(strukna)} adresser ligger inte i sitemapen och anmäls inte: "
            f"{', '.join(strukna[:5])}{' ...' if len(strukna) > 5 else ''}",
            file=sys.stderr,
        )
    adresser = kvar
    if not adresser:
        print("Inget kvar att anmäla efter grinden mot sitemapen.", file=sys.stderr)
        return

    if args.torrkor:
        print(
            f"Torrkörning: {len(adresser)} adresser hade anmälts, varav "
            f"{len([a for a in adresser if a in borttagna])} borttagna. Grinden är\n"
            "körd mot den sitemap som ligger ute NU, alltså mot gårdagens bygge\n"
            "om torrkörningen görs före utrullningen.",
            file=sys.stderr,
        )
        for a in adresser[:20]:
            print(f"  {BAS}{a}", file=sys.stderr)
        if len(adresser) > 20:
            print(f"  ... och {len(adresser) - 20} till", file=sys.stderr)
        return

    print(
        f"Anmäler {len(adresser)} adresser till {SLUTPUNKT}, varav "
        f"{len([a for a in adresser if a in borttagna])} borttagna.",
        file=sys.stderr,
    )
    lyckade = anmal(adresser)
    print(f"\n{lyckade} av {len(adresser)} adresser mottagna.", file=sys.stderr)
    if lyckade == 0:
        sys.exit("Ingen adress togs emot.")


if __name__ == "__main__":
    main()
