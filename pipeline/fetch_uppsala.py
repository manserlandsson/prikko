#!/usr/bin/env python3
"""Hämta Uppsalas livsmedelskontroller.

Två steg: bläddra listan (10 per sida) för att få alla verksamheter, hämta
sedan varje detaljsida för full kontrollhistorik.

    python3 pipeline/fetch_uppsala.py --out site/src/data/uppsala.json

    --arkiv <katalog>   återanvänd detaljsidor vars listrad står oförändrad

Kör snällt: paus mellan anropen och tydlig user agent.

## VARFÖR ARKIVET FINNS, OCH VAD LISTRADEN DUGER TILL

Uppsala var nattjobbets dyraste post: 32 av 127 jobbminuter, alltså 960 av
3 810 i månaden mot ett tak på 2 000. Kostnaden är 1 836 detaljsidor à 106 kB
plus 187 listsidor, och den ligger i antalet anrop och i antalet byte.

Tre vägar mättes 2026-09-28, och två av dem föll:

* VILLKORADE ANROP. Detaljsidan svarar `Cache-Control: private` och sätter
  varken `ETag` eller `Last-Modified`. Det finns alltså inget villkor att
  skicka, och servern kan inte svara 304.
* PACKNING. Samma sida är 106 649 B både med och utan `Accept-Encoding:
  gzip`. Servern packar inte.
* PARALLELLITET. Servern når ett tak vid omkring 3 svar i sekunden oavsett
  hur många arbetare som frågar: 25 sidor tog 13,6 s seriellt, 9,7 s med tre
  arbetare, 8,4 s med fem och 9,5 s med åtta. Fem arbetare ger alltså 1,6
  gånger och inte fem.

Den fjärde vägen bär, och den kostar inga extra anrop alls: LISTRADEN SÄGER
REDAN VAD SOM HÄNT. Varje `<li>` i listan bär verksamhetens namn, dess adress,
`Senaste omdöme` och `Senaste kontroll` med datum. Står hela raden oförändrad
sedan i går har ingen ny kontroll tillkommit, omdömet är detsamma och namnet
likaså. Då läses gårdagens detaljsida ur arkivet i stället för att hämtas om.

Nyckeln är HELA listraden och inte det vi råkar tolka ur den. Ändras något
alls i markupen, även något vi i dag inte läser, räknas raden som ny och
sidan hämtas. Hittas ingen listrad för ett id hämtas sidan också. Arkivet kan
alltså bara göra hämtningen billigare, aldrig datan äldre än listan medger.

Uppmätt takt över tjugo nattliga incheckningar 4 till 22 september 2026: 21,3
av 1 836 verksamheter ändrade sig per natt, alltså 1,16 procent, plus 12,4 nya.

## GOLVET, FÖR DET LISTRADEN INTE VISAR

Listraden visar den SENASTE kontrollen. En rättelse i en äldre kontrolls
avvikelsepunkter, eller ett diarienummer som fylls i i efterhand, syns därför
inte i den. För att ingen verksamhet ska kunna stå kvar hur länge som helst
på en gammal detaljsida hämtas dessutom en sjundedel av beståndet varje natt,
valt på verksamhetens eget id så att var och en kommer i tur exakt en gång på
GOLV_DAGAR nätter. Ingen detaljsida kan alltså bli äldre än en vecka, oavsett
vad listan säger.

Nattens nota blir då 187 listsidor plus omkring 300 detaljsidor i stället för
2 023 anrop, alltså under en fjärdedel så många.

## LISTAN ÄR INTE FULLSTÄNDIG NÄR MAN BARA BLÄDDRAR DEN

Uppmätt 2026-09-28. Kommunen skriver själv ut antalet överst i listan,
`<span class="count">1868</span>`, och sidorna levererar exakt 1 868 rader på
187 sidor. Bara 1 781 av dem är olika. Två genomgångar i följd gav 1 781 och
1 741 unika verksamheter, med 1 682 gemensamma.

Orsaken står att läsa i raderna. Sida 1 slutar på ett id som sida 2 börjar
med, sida 3 slutar på två id som dyker upp mitt på sida 4, och så vidare:
FÖNSTREN ÖVERLAPPAR, alltså flyttar sig ordningen mellan två sidhämtningar.
Listan sorteras på senaste kontrolldatum, och 641 av verksamheterna har ingen
kontroll alls och därmed inget sorteringsvärde. Det är där det mesta går
förlorat: 103 av tappet ligger på sidorna 121 och framåt, som är just de
odaterade. Samma fel, fast i vår egen databas, står beskrivet i
`prikko/sidbrytning.py`, och det är samma slutsats: en sidhämtning utan unik
ordning lämnar tyst ifrån sig en ofullständig lista.

Fyra vägar mättes samma dag mot kommunens gränssnitt:

* FLER RADER PER SIDA. Sexton olika parameternamn prövades, från `pagesize`
  till `itemsPerPage`. Alla ignoreras, sidan ger tio rader.
* STABIL SORTERING. `sort`, `sortBy`, `orderBy`, `order` och `sortorder`
  ignoreras likaså. Gränssnittet har ingen sorteringskontroll.
* LÄSA OM TILLS TVÅ LÄSNINGAR STÄMMER. Konvergerar inte. Sex genomgångar i
  följd av samma snitt gav exakt samma 118 av 129, gång på gång, eftersom
  ordningen är densamma så länge man frågar likadant. Att bläddra förbi sista
  sidan ger tomma svar: svansen går inte att nå.
* DELA UPP LISTAN. Filtren `selectedTypes` (fyra värden) och `selectedResults`
  (tre) är exakta uppdelningar, 1 868 i båda fallen och 1 868 i korstabellen.
  Varje snitt är en egen fråga med en egen ordning och ett eget tapp, så
  unionen växer: fyra typsnitt gav 548 av de 641 odaterade, plus hela snittet
  627, plus fyra typpar 640. Unionen av allt som mättes den dagen blev exakt
  1 868, alltså stämmer kommunens eget antal. Men det tog 385 anrop och stannade
  på 1 864 på en enskild runda. Uppdelning ensam räcker alltså inte.

## VAD SOM BÄR: KOMMUNENS EGET ANTAL SOM FACIT OCH EN NAMNKONTROLL

Tre steg, och det dyra steget körs bara när de billigare inte räckt.

1. BLÄDDRA LISTAN som förut, 187 sidor, och jämför med kommunens eget antal.
   Stämmer de är listan bevisligen fullständig och resten hoppas över.
2. NAMNKONTROLLERA DET SOM SAKNAS. En egen liggare i arkivet bär gårdagens
   verifierade lista med namn och adress. Varje id i liggaren som inte kom med
   i bläddringen slås upp med `?query=<namn>`, ett anrop. Trettio uppslag av
   trettio hittade rätt verksamhet, tjugoåtta som enda träff, och två
   skräpsökningar gav noll träffar. Listraden ur sökningen är dessutom byte
   för byte samma rad som ur listan, kontrollerat på tolv verksamheter, så
   arkivnyckeln håller.
   Det som inte går att återfinna på vare sig namn eller adress är borta på
   riktigt, och det är den enda väg en verksamhet får försvinna den här vägen.
3. LÄS FLER SNITT om antalet fortfarande inte stämmer. Det som återstår då är
   verksamheter som är nya sedan i går OCH föll bort i bläddringen, alltså
   omkring en halv per natt. Snitten läses i tur och ordning tills antalet
   stämmer, aldrig fler än de fyra i EXTRA_SNITT, och läsningen slutar så
   snart ett snitt inte gav något nytt.

En verksamhet som liggaren känner kan alltså inte längre försvinna av ett
bläddringsfel, och en ny som missas kommer med nästa natt. Kvar står att
kommunens antal kan ändras mitt under körningen; då stämmer det inte, och
skriptet skriver ut hur många som saknas i stället för att jaga vidare.

Försvinner `<span class="count">` ur markupen faller hämtningen med ett fel i
stället för att lämna en halv lista. Antalet är facit för hela steget, och
utan facit går det varken att räkna sidor eller att veta om listan blev hel.

Notan: 187 sidor som förut, plus ett uppslag per saknat känt id. Mätt över tre
körningar i följd 2026-09-28 blev det 187 plus 82, 187 plus 66 och 187 plus 70
anrop, och alla tre gav samma 1 868 verksamheter.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko.grading import Area, Inspection, assess  # noqa: E402
from prikko.natverk import Arkiv, anslut_arkiv  # noqa: E402
from prikko.sources.uppsala import (  # noqa: E402
    BASE,
    MUNICIPALITY_CITY,
    MUNICIPALITY_CODE,
    MUNICIPALITY_NAME,
    PER_PAGE,
    UnknownSourceValue,
    normalize_establishment,
    normalize_inspections,
    parse_list_page,
    total_hits,
)
from prikko.text import dedupe_slugs, slugify  # noqa: E402

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"
POLITE_DELAY_S = 0.3

#: Så ofta hämtas en detaljsida om även när listraden står stilla. En sjundedel
#: av 1 836 verksamheter är 262 sidor per natt, alltså under en tiondel av
#: dagens 2 020 anrop, och ingen sida kan bli mer än sex dygn gammal.
GOLV_DAGAR = 7

#: Listans `<li>`-block, ett per verksamhet. REGELN ÄR MEDVETET DEN SAMMA SOM
#: i prikko/sources/uppsala.py, men den används till något annat: här delas
#: markupen i bitar som ska HASHAS, inte tolkas. Slutar de två följas åt hittas
#: ingen rad för ett id, och då hämtas sidan, vilket är dagens beteende.
LISTRAD = re.compile(r'<li class="inspection[a-z-]*">.*?</li>', re.S)
LISTRAD_ID = re.compile(r"Details\?id=(-?\d+)")

#: Liggaren över gårdagens verifierade lista, id → namn och adress. Den ligger
#: i arkivets rot och inte i `uppsala/`, eftersom `Arkiv.gallra()` tar bort
#: allt i namnrymden som körningen inte rört. Den bärs mellan nätterna av
#: samma actions/cache som arkivet.
LIGGARE = "uppsala-lista.json"

#: Så många sidor av en namnsökning läses innan uppslaget ges upp. Ett namn ger
#: nästan alltid en enda träff, men en kedja delar namn med sina egna filialer.
SOK_SIDOR = 3

#: Extra snitt av listan, lästa i tur och ordning när bläddringen och
#: namnkontrollen inte räckt fram till kommunens eget antal. Varje snitt är en
#: EGEN fråga hos kommunen och därför en egen ordning med ett eget tapp, och
#: det är just därför unionen växer. Ordningen är billigast först, mätt
#: 2026-09-28: 65 sidor för de odaterade, 13 till 26 för typcellerna.
EXTRA_SNITT = (
    ("&selectedResults=2", "utan kontroll"),
    ("&selectedTypes=1&selectedResults=2", "skola och omsorg, utan kontroll"),
    ("&selectedTypes=3&selectedResults=2", "övriga, utan kontroll"),
    ("&selectedTypes=0&selectedResults=2", "restaurang, utan kontroll"),
)

#: Fler snitt än de fyra läses aldrig, och läsningen slutar så snart ett snitt
#: inte gav något nytt. Stämmer antalet ändå inte är de som saknas nya sedan
#: i går, och då är det rätt att skriva ut hur många det är i stället för att
#: fortsätta fråga kommunen.


def get(url: str) -> str:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "X-Requested-With": "XMLHttpRequest"},
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        return response.read().decode("utf-8", "replace")


def listrader(markup: str) -> dict:
    """id → verksamhetens hela listrad, rå."""
    ut = {}
    for block in LISTRAD.findall(markup):
        ident = LISTRAD_ID.search(block)
        if ident:
            ut[ident.group(1)] = block
    return ut


def las_sida(sida: int, snitt: str = "", term: str = "") -> str:
    return get(f"{BASE}/?ajax=1&query={urllib.parse.quote(term)}&page={sida}{snitt}")


def las_snitt(snitt: str) -> tuple:
    """Bläddra igenom ett snitt av listan. Returnerar (kommunens antal, id → rad)."""
    forsta = las_sida(1, snitt)
    antal = total_hits(forsta) or 0
    sidor = max(1, -(-antal // PER_PAGE))
    rader = listrader(forsta)
    for sida in range(2, sidor + 1):
        time.sleep(POLITE_DELAY_S)
        try:
            rader.update(listrader(las_sida(sida, snitt)))
        except (urllib.error.URLError, TimeoutError) as exc:
            print(f"  ! sida {sida}: {exc}", file=sys.stderr)
        if sidor >= 50 and sida % 25 == 0:
            print(f"  sida {sida}/{sidor} · {len(rader)} olika", file=sys.stderr)
    return antal, rader, sidor


def sla_upp(term: str, sokt_id: str) -> tuple:
    """Sök på ett namn eller en adress. Returnerar (id → listrad, uttömt).

    Sökningen är ett eget snitt av listan, alltså en egen ordning, och den är
    liten nog att rymmas på en sida i nästan alla fall: trettio uppslag gav 28
    en enda träff och ingen mer än tre. Läsningen slutar så snart det sökta
    id:t hittats, och efter SOK_SIDOR sidor oavsett.

    `uttömt` säger om alla träffar hann läsas. Ett nej där betyder att ett
    uteblivet id INTE är ett bevis för att verksamheten är borta, och då ska
    den inte tas bort på den grunden.
    """
    funna: dict = {}
    for sida in range(1, SOK_SIDOR + 1):
        if sida > 1:
            time.sleep(POLITE_DELAY_S)
        try:
            markup = las_sida(sida, "", term)
        except (urllib.error.URLError, TimeoutError) as exc:
            print(f"  ! sökning {term!r}: {exc}", file=sys.stderr)
            return funna, False
        funna.update(listrader(markup))
        if sokt_id in funna:
            return funna, True
        if (total_hits(markup) or 0) <= sida * PER_PAGE:
            return funna, True
    return funna, False


def collect_list(liggare: dict) -> tuple:
    """Hela listan, verifierad mot kommunens eget antal.

    Returnerar (poster, listrad per id, kommunens antal). Se modulens
    inledning för varför bläddringen ensam inte räcker och vad de tre stegen
    gör.
    """
    antal, rader, sidor = las_snitt("")
    if not antal:
        # Antalet är facit för hela den här hämtningen, och utan det vet vi
        # varken hur många sidor som finns eller om listan blev hel. Då är en
        # tyst halv utlämning värre än ingen alls: gårdagens data står kvar.
        raise SystemExit(
            "Uppsala: hittade inget antal i listan (<span class=\"count\">). "
            "Kommunen har lagt om markupen, och hämtningen kan inte "
            "kontrollera sig själv förrän den lästs om."
        )
    print(
        f"Uppsala: kommunen säger {antal} verksamheter, {sidor} sidor gav "
        f"{len(rader)} olika",
        file=sys.stderr,
    )

    # Steg 2. Varje känt id som bläddringen tappade slås upp på namn, och på
    # adress om namnet ändrats. Det som inte går att återfinna är nedlagt.
    aterfunna, nedlagda, uppslag = 0, 0, 0
    if len(rader) < antal:
        saknade = [i for i in liggare if i not in rader]
        for ident in saknade:
            post = liggare[ident]
            uttomt = False
            for term in (post.get("namn"), post.get("adress")):
                if not term:
                    continue
                time.sleep(POLITE_DELAY_S)
                uppslag += 1
                funna, uttomt = sla_upp(term, ident)
                rader.update(funna)
                if ident in rader:
                    break
            if ident in rader:
                aterfunna += 1
            else:
                nedlagda += 1
                if not uttomt:
                    # Sökningen hann inte igenom alla träffar, alltså vet vi
                    # inte att verksamheten är borta. Den försvinner ändå ur
                    # den här utlämningen, för utan en färsk listrad finns
                    # ingen post att lämna. Namnet skrivs ut så att ett
                    # mönster går att se i loggen.
                    print(
                        f"  ! {post.get('namn')!r} hittades inte, och sökningen "
                        "hann inte igenom alla träffar",
                        file=sys.stderr,
                    )
        if saknade:
            print(
                f"  namnkontroll: {len(saknade)} kända id saknades i bläddringen, "
                f"{aterfunna} återfanns i listan och {nedlagda} finns inte kvar "
                f"({uppslag} uppslag)",
                file=sys.stderr,
            )

    # Steg 3. Det som återstår är nytt sedan i går OCH tappat i bläddringen.
    for snitt, vad in EXTRA_SNITT:
        if len(rader) >= antal:
            break
        time.sleep(POLITE_DELAY_S)
        _, extra, extra_sidor = las_snitt(snitt)
        nya = len(set(extra) - set(rader))
        rader.update(extra)
        print(
            f"  snittet {vad}: {extra_sidor} sidor gav {nya} som bläddringen "
            f"inte hade, {len(rader)} av {antal}",
            file=sys.stderr,
        )
        # Gav snittet ingenting nytt går de som saknas inte att nå den vägen,
        # och de följande snitten läser delmängder av samma block. Mätt
        # 2026-09-28: på en varm körning gav det första snittet 1 ny och de
        # tre följande 0, 0 och 0, alltså 58 sidor utan utbyte.
        if not nya:
            break

    if len(rader) < antal:
        kant = "Varje id som fanns i går är prövat" if liggare else "Liggaren var tom"
        print(
            f"  VARNING: {antal - len(rader)} av {antal} verksamheter gick inte "
            f"att nå. {kant}, alltså kommer de med\n"
            "  nästa natt. Utlämningen är kortare än kommunens register.",
            file=sys.stderr,
        )

    # ORDNINGEN ÄR PÅ ID OCH INTE PÅ DET LISTAN RÅKADE GE. `dedupe_slugs`
    # numrerar krockar positionellt, så en ordning som kastas om mellan två
    # körningar flyttar sluggen mellan två likanämnda verksamheter. Listans
    # egen ordning är just en sådan: den sorterar på senaste kontrolldatum och
    # skiftar mellan två hämtningar. Id:t gör filen densamma varje gång.
    ordnade = sorted(rader, key=lambda i: (int(i) if _ar_tal(i) else 0, i))
    return parse_list_page("".join(rader[i] for i in ordnade)), rader, antal


def _ar_tal(varde: str) -> bool:
    try:
        int(varde)
    except ValueError:
        return False
    return True


def las_liggare(arkiv_rot: Optional[Path]) -> dict:
    """Gårdagens verifierade lista, id → namn och adress."""
    if arkiv_rot is None:
        return {}
    fil = Path(arkiv_rot) / LIGGARE
    try:
        innehall = json.loads(fil.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    return innehall.get("verksamheter") or {}


def skriv_liggare(arkiv_rot: Optional[Path], records: list) -> None:
    if arkiv_rot is None:
        return
    rot = Path(arkiv_rot)
    rot.mkdir(parents=True, exist_ok=True)
    (rot / LIGGARE).write_text(
        json.dumps(
            {
                "skriven": datetime.now().isoformat(timespec="seconds"),
                "verksamheter": {
                    r["id"]: {"namn": r["name"], "adress": r.get("address")}
                    for r in records
                },
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )


def i_tur(record_id: str, today: date) -> bool:
    """Är den här verksamheten på tur för nattens golvhämtning?

    Rest på id mot rest på dagnumret, alltså en fast sjundedel per natt och
    varje verksamhet exakt en gång per GOLV_DAGAR nätter. Att välja på id och
    inte slumpmässigt gör natten förutsägbar och gör att två körningar samma
    dygn hämtar samma sidor.
    """
    try:
        tal = int(record_id)
    except ValueError:
        # Ett id som inte är ett tal har vi aldrig sett. Hämta hellre än att
        # gissa vilken sjundedel det tillhör.
        return True
    return tal % GOLV_DAGAR == today.toordinal() % GOLV_DAGAR


def build(limit: Optional[int], today: date, arkiv_rot: Optional[Path]) -> dict:
    listing, rader, listat = collect_list(las_liggare(arkiv_rot))
    if limit:
        listing = listing[:limit]
    levererade = []

    arkiv = Arkiv(arkiv_rot, "uppsala")
    records, skipped = [], 0
    golvade = 0

    for index, record in enumerate(listing, 1):
        # Nyckeln är verksamhetens HELA listrad, alltså allt kommunen visar om
        # den i listan: namn, adress, senaste omdöme och senaste kontrolldatum.
        # Saknas raden finns ingen nyckel, och då hämtas sidan.
        rad = rader.get(record["id"])
        nyckel = None if rad is None else f"{record['id']}\0{rad}"

        # Golvet går FÖRE arkivet: den här natten hämtas sidan även om raden
        # står stilla. Se GOLV_DAGAR.
        golv = i_tur(record["id"], today)

        detail = None
        if nyckel is not None and not golv:
            lagrat = arkiv.las(nyckel)
            if lagrat is not None:
                detail = lagrat.decode("utf-8", "replace")

        if detail is None:
            if golv:
                golvade += 1
            try:
                detail = get(f"{BASE}/Details?id={record['id']}")
            except (urllib.error.URLError, TimeoutError) as exc:
                print(f"  ! {record['id']}: {exc}", file=sys.stderr)
                skipped += 1
                continue
            finally:
                time.sleep(POLITE_DELAY_S)
            # Skrivs ÄVEN på en golvnatt. Annars vore sidan hämtad men inte
            # sparad, och i morgon hade den hämtats en gång till.
            if nyckel is not None:
                arkiv.skriv(nyckel, detail.encode("utf-8"))

        try:
            establishment = normalize_establishment(record, detail)
            inspections = normalize_inspections(
                detail, establishment.id_national, record["id"]
            )
        except UnknownSourceValue as exc:
            print(f"  ! hoppar över: {exc}", file=sys.stderr)
            skipped += 1
            continue

        result = assess(
            [
                Inspection(
                    id_national=i.id_national,
                    inspected_at=i.inspected_at,
                    assessment=i.assessment,
                    type=i.type,
                    # Sedan modellversion 4: rent administrativa avvikelser
                    # ska inte skärpa bedömningen, så punkterna följer med.
                    areas=tuple(
                        Area(a.code, a.group, a.description, a.status)
                        for a in i.areas
                    ),
                )
                for i in inspections
            ],
            today,
        )

        levererade.append(record)
        records.append(
            {
                "id": establishment.id_national,
                "slug": slugify(establishment.name),
                "name": establishment.name,
                "address": establishment.street_address,
                "types": establishment.types,
                "lat": None,
                "lng": None,
                "image": None,
                "verdict": result.verdict,
                "distinction": result.distinction,
                "reason": result.reason,
                "modelVersion": result.model_version,
                "uncertain": False,
                "inspections": [
                    {
                        "id": i.id_national,
                        "date": i.inspected_at.isoformat(),
                        "assessment": i.assessment,
                        "type": i.type,
                        "prenotified": i.prenotified,
                        "audit": i.audit,
                        "onSite": i.on_site,
                        "areas": [
                            {
                                "code": a.code,
                                "group": a.group,
                                "description": a.description,
                                "status": a.status,
                            }
                            for a in i.areas
                        ],
                        # Diarienumret besökaren behöver för att begära ut
                        # kontrollrapporten. Se uppsala.py.
                        "caseNumber": i.case_number,
                    }
                    for i in sorted(inspections, key=lambda x: x.inspected_at, reverse=True)
                ],
            }
        )

        if index % 100 == 0:
            print(f"  {index}/{len(listing)}", file=sys.stderr)

    dedupe_slugs(records)

    hamtade = arkiv.missar + golvade
    print(
        f"  detaljsidor: {arkiv.traffar} ur arkivet, {hamtade} hämtade "
        f"({golvade} på golvet var {GOLV_DAGAR}:e natt, "
        f"{arkiv.missar} för att listraden ändrats eller saknats)",
        file=sys.stderr,
    )
    # SIST och bara när HELA beståndet gåtts igenom. En körning med --limit
    # har sett en bråkdel av listan, och gallrade den hade den kastat resten
    # av arkivet på en handkörning.
    if not limit:
        borttagna = arkiv.gallra()
        if borttagna:
            print(f"  arkivet gallrades på {borttagna} inaktuella sidor", file=sys.stderr)
        # Liggaren för i morgon, och bara efter en hel körning. Den bär de
        # verksamheter som faktiskt levereras, alltså inte det som hoppades
        # över: en rad vi inte kunde tolka ska prövas på nytt nästa natt och
        # inte slås upp som saknad.
        skriv_liggare(arkiv_rot, levererade)

    return {
        "municipality": {
            "code": MUNICIPALITY_CODE,
            "name": MUNICIPALITY_NAME,
            "city": MUNICIPALITY_CITY,
            "slug": "uppsala",
            "sourceType": "reverse_engineered",
            "adapter": "uppsala",
        },
        "source": {"url": BASE, "fetchedAt": datetime.now().isoformat(timespec="seconds")},
        "skipped": skipped,
        # Kommunens eget antal överst i listan, och om vi nådde det. Ett nej
        # här betyder att utlämningen är kortare än registret, och då är ett
        # bortfall i inläsningen ett hämtningsfel och inte en nedläggning.
        "listedCount": listat,
        "listComplete": len(rader) >= listat,
        "establishments": records,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--out", type=Path, required=True)
    anslut_arkiv(parser)
    args = parser.parse_args()

    data = build(args.limit, date.today(), args.arkiv)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")

    total = len(data["establishments"])
    assessed = sum(1 for e in data["establishments"] if e["verdict"])
    print(
        f"\nSkrev {total} anläggningar till {args.out} "
        f"({assessed} med bedömning, {data['skipped']} överhoppade)",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
