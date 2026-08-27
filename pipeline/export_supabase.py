#!/usr/bin/env python3
"""Exportera från Supabase till sajtens datafiler.

Databasen är sanningen. Den här filen drar ut en ögonblicksbild som bygget
läser.

Varför inte låta Astro hämta direkt vid bygget: 130 000 rader över HTTP vid
varje bygge gör bygget nätverksberoende, långsamt och svårt att reproducera i
CI. En exporterad snapshot ger samma innehåll, byggtiden förblir 30 sekunder,
och ett bygge kan köras utan nät. Dynamiska funktioner — omdömen, bevakning,
appen — läser däremot databasen i realtid, där den hör hemma.

    export SUPABASE_URL=...
    export SUPABASE_SERVICE_KEY=...      # eller anon, läsning räcker
    python3 pipeline/export_supabase.py --out site/src/data

Skriver en fil per kommun, samma format som fetch_*.py producerar.

FÄLT SOM BOR I FILEN OCH INTE I DATABASEN
-----------------------------------------
"Databasen är sanningen" gäller allt kommunen lämnar ut. Det gäller INTE det
vi räknar fram själva ur någon annans licensierade data. Sådant har ingen
kolumn i Supabase, och en del av det får aldrig få en: Lantmäteriet avslog
2026-08-17 vår begäran enbart på grunden att lagringen sker där. Se
`filradering` och docs/34_ny_ansokan_lantmateriet.md.

Exporten bygger varje post från grunden. Ett fält den inte uttryckligen bär
över raderas alltså tyst nästa natt, och det har hänt fem gånger på fem dygn.
Här är hela listan på det som bara finns i filen:

På raderna, se `FILFALT`:

    lat, lng                    härledda ur adressen, pipeline/geocode.py
    geoSource, geoPrecision     koordinatens ursprung och noggrannhet
    hours                       veckoschema, pipeline/oppettider.py
    contact                     telefon och webbplats, samma uttag
    stop, parking               närmaste hållplats och parkering,
                                pipeline/narhet.py

På filens toppnivå, se `FILBLOCK`, ett licensblock per källa:

    narhet                      täcker stop och parking
    openstreetmap               täcker hours och contact
    geocoding                   täcker de härledda kartnålarna

Allt detta bärs över i dag, och kartnålarna har dessutom en grind, se
`coordinate_collapse`. Någon grind per fält byggs inte: raderingen är alltid
samma fel, och grinden fångar bara det fält som råkar ha en.

Provet som gäller framåt är i stället en regel. Skriver ett skript i
site/src/data ett fält eller ett block som inte har en kolumn i Supabase, så
måste det läggas till här i samma ändring. Tre skript gör det:
pipeline/geocode.py, pipeline/oppettider.py och pipeline/narhet.py. Ett
fjärde som gör det utan att röra den här filen raderar sitt eget arbete inom
ett dygn, och ingenting klagar, eftersom en verksamhet utan de här fälten är
fullt publicerbar.

Regeln räcker inte av sig själv, för den har brutits fyra gånger. Den senaste
var 2026-08-18, då `openingHours` bytte namn till `openstreetmap` och `narhet`
tillkom utan att den här filen rördes. Provet i
pipeline/tests/test_export_koordinater.py läser därför FILFALT och FILBLOCK
ur källan och ställer dem mot vad de incheckade filerna faktiskt bär.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path
from typing import Optional

PAGE = 1000

#: Decimaler att behålla i koordinaterna. Sex ger ungefär elva centimeters
#: upplösning — långt mer än en kartnål behöver.
#:
#: Varför avrundning alls: databasrundturen ger tillbaka flyttal med en
#: decimal mindre än de skrevs (58.39034461245975 blir 58.3903446124597).
#: Förflyttningen är noll millimeter, men textrepresentationen skiljer sig,
#: så en fil skriven av fetch_*.py och samma fil skriven av den här exporten
#: blev olika. Eftersom snapshotarna checkas in gav det en diff på en halv
#: miljon rader utan en enda faktisk ändring, varje gång pipelinen bytte väg.
#: Med avrundningen är de två vägarna bitidentiska (verifierat: 0 av 1 120
#: koordinater skilde för Jönköping). Verklig förändring ska synas i diffen;
#: brus ska inte dränka den.
#:
#: Fjorton signifikanta siffror var dessutom falsk precision till att börja
#: med — ingen kommun mäter sin verksamhet på nanometern.
COORDINATE_DECIMALS = 6


def _round(value):
    return round(value, COORDINATE_DECIMALS) if isinstance(value, (int, float)) else value


class Supabase:
    def __init__(self, url: str, key: str) -> None:
        self.base = url.rstrip("/") + "/rest/v1"
        self.headers = {"apikey": key, "Authorization": f"Bearer {key}"}

    def _get(self, url: str, attempts: int = 4) -> list:
        """Hämta med omförsök. Exporten drar 130 000 rader i 130 anrop; att
        en enda TLS-anslutning bryts på vägen är väntat, inte exceptionellt."""
        for attempt in range(attempts):
            try:
                request = urllib.request.Request(url, headers=self.headers)
                with urllib.request.urlopen(request, timeout=120) as response:
                    return json.loads(response.read().decode("utf-8"))
            except Exception as exc:
                if attempt == attempts - 1:
                    raise
                wait = 2 ** attempt
                print(f"\n  ! {type(exc).__name__}, försöker igen om {wait}s", file=sys.stderr)
                time.sleep(wait)
        return []

    def all_rows(self, table: str, select: str = "*", order: str = "id") -> list:
        """Hämta alla rader. PostgREST sidindelar vid 1 000.

        Sorteringen MÅSTE ske på en unik kolumn. Med offset-paginering på en
        icke-unik kolumn — som `inspected_at`, där tusentals rader delar datum —
        är radordningen odefinierad mellan sidorna, så rader kan dyka upp två
        gånger eller hoppas över. Det gav elva felplacerade kontroller innan
        det upptäcktes.
        """
        rows, offset = [], 0
        while True:
            params = {"select": select, "limit": PAGE, "offset": offset}
            if order:
                params["order"] = order
            url = f"{self.base}/{table}?{urllib.parse.urlencode(params)}"
            batch = self._get(url)
            rows += batch
            if len(batch) < PAGE:
                return rows
            offset += PAGE
            print(f"    {table}: {len(rows)}…", file=sys.stderr, end="\r")


def filradering(path: Path) -> dict:
    """Föregående exports rader, per id.

    Två uppgifter bor i FILEN och inte i databasen, och båda raderades av
    exporten innan det här fanns.

    ## Varför de bor i filen och inte i databasen

    Kommunerna publicerar inte alla koordinater. Örebro publicerar inga alls
    och Uppsala nästan inga, så `pipeline/geocode.py` räknar fram dem ur
    adressen och märker var och en med `geoSource`. Uppmätt 2026-08-18: 1 611
    sådana finns, alla i Uppsala och Örebro.

    De ligger bara i de incheckade filerna. I Supabase har nio rader ett
    `geo_source`, alltså inte de 1 611. Exporten läser databasen, och skrev
    därför tillbaka filerna utan koordinater: nattkörningen 2026-08-17 tog
    Örebro från 645 till 0 och Uppsala från 966 till 6. Kartnålarna försvann
    från sajten utan att något bygge klagade, eftersom en verksamhet utan
    koordinat är fullt publicerbar.

    Att i stället skriva in dem i Supabase vore den uppenbara lösningen och
    den är fel. Lantmäteriet avslog 2026-08-17 vår begäran om
    belägenhetsadresser enbart på grunden att lagringen sker hos Supabase, som
    inte omfattas av adekvansbeslutet. Byter vi geokodningskälla till
    Lantmäteriet ska härledda koordinater ALDRIG nå den databasen. Filen som
    hemvist är alltså inte en nödlösning, det är den ordning ansökan bygger
    på. Se docs/34_ny_ansokan_lantmateriet.md.

    ÖPPETTIDERNA är det andra fallet, och det gick sönder på samma dag.
    `pipeline/oppettider.py` parar ihop våra verksamheter med OpenStreetMap och
    skriver ett veckoschema per rad. 2 748 rader fick en 2026-08-18, och
    nattkörningen samma dygn skrev bort samtliga. Databasen har ingen kolumn
    för dem, och det ska den inte ha heller: uppgiften är ODbL-licensierad och
    hör till filen, precis som koordinaterna.

    Bara rader där databasen saknar koordinat får sin gamla tillbaka. Har
    kommunen börjat publicera en egen vinner den alltid, så en riktig
    uppdatering kan aldrig blockeras av en gammal gissning. Öppettiden har
    ingen motpart i databasen alls och följer därför alltid med.
    """
    if not path.exists():
        return {}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except ValueError:
        return {}
    return {e["id"]: e for e in payload.get("establishments", []) if e.get("id")}


#: Licensblock på filens toppnivå som INTE har någon motsvarighet i Supabase,
#: i den ordning de incheckade filerna faktiskt bär dem.
#:
#: Ordningen är mätt och inte vald. Blocken skrivs med `insert_after(payload,
#: "source", ...)`, alltså hamnar det SIST inskjutna närmast `source`, och
#: skripten körs geocode, oppettider, narhet. Skriver exporten dem i någon
#: annan ordning kastar varje nattkörning om tre rader i åtta filer utan att
#: något ändrats.
#:
#:     narhet          stop och parking, pipeline/narhet.py
#:     openstreetmap   hours och contact, pipeline/oppettider.py
#:     geocoding       de härledda kartnålarna, pipeline/geocode.py
#:
#: LISTAN MÅSTE VÄXA NÄR ETT NYTT BLOCK TILLKOMMER, precis som FILFALT nedan.
#: Blocket `openstreetmap` hette `openingHours` fram till 2026-08-18, då
#: filen började bära telefon och webbplats ur samma uttag. Exporten läste
#: kvar på det gamla namnet och kände inte till `narhet` alls, så nästa
#: lyckade nattkörning hade tagit bort båda blocken ur alla åtta filer som
#: bär dem: jonkoping, karlstad, kristinehamn, linkoping, orebro, oskarshamn,
#: stockholm och uppsala. Raderna hade behållit sina 2 747 öppettider, 3 274
#: kontaktuppgifter, 12 870 hållplatser och 10 606 parkeringar, men utan den
#: ODbL-attribution som är villkoret för att få visa dem. Det är ett
#: licensbrott och inte en saknad rad.
FILBLOCK = ("narhet", "openstreetmap", "geocoding")

#: Fält på verksamhetsraderna som bara bor i FILEN.
#:
#: LISTAN MÅSTE VÄXA NÄR ETT NYTT SÅDANT FÄLT TILLKOMMER, och det är ingen
#: artighet. Samma fel har inträffat fyra gånger på fyra dygn:
#: kontrollpunkterna, koordinaterna, öppettiderna och senast contact, som
#: fanns på 3 274 rader och hade raderats i nästa nattkörning. Exporten bygger
#: varje post från grunden ur databasen, så allt utan kolumn där försvinner
#: tyst, och ingenting klagar eftersom en rad utan telefonnummer är fullt
#: publicerbar.
#:
#: Uppmätt 2026-08-20: stop 12 870, parking 10 606, contact 3 274, hours
#: 2 747. Inget av dem har en motpart i Supabase.
#:
#: Fem fält tillkom 2026-08-25 ur kommunernas egna svar, alltså uppgifter vi
#: redan hämtade och kastade bort:
#:
#:     registration    Stockholms registreringsintyg: organisationsnummer,
#:                     postnummer, livsmedelsföretagare, registreringsdatum,
#:                     omfattning och beslutad kontrollfrekvens. Se
#:                     pipeline/stockholmsintyg.py.
#:     registeredAt    datum då verksamheten registrerades hos kommunen
#:     operator        den juridiska person som driver stället
#:     riskClass       kommunens beslutade riskklass, Linköping i dag
#:     decisions       delegationsbeslut som PDF, Kristinehamn i dag
#:
#: De står här av EXAKT samma skäl som de fyra första: exporten bygger varje
#: rad från grunden ur databasen, ingen av dem har en kolumn där, och en rad
#: utan organisationsnummer är fullt publicerbar. Alltså skulle de försvinna
#: tyst i nästa nattkörning och ingenting skulle klaga. Det felet har redan
#: inträffat fem gånger på fem dygn och listan finns för att det inte ska ske
#: en sjätte.
FILFALT = (
    "hours",
    "contact",
    "stop",
    "parking",
    "registration",
    "registeredAt",
    "operator",
    "riskClass",
    "decisions",
)


def filblock(path: Path) -> dict:
    """Licensblocken ur föregående export.

    Blocken säger vilken källa uppgifterna är hämtade ur, med licens och
    attribution. Både OpenStreetMap (ODbL) och Lantmäteriet (CC BY 4.0) kräver
    den där uppgiften visas, så ett block är ett villkor för att få rita nålen
    eller skriva ut öppettiden, inte en upplysning vid sidan av.
    """
    if not path.exists():
        return {}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except ValueError:
        return {}
    return {namn: payload[namn] for namn in FILBLOCK if payload.get(namn)}


def behall_block(block: dict, bevarade: dict, antal_harledda: int) -> bool:
    """Bär filen fortfarande den data blocket handlar om?

    Samma regel som pipeline/narhet.py och pipeline/oppettider.py skriver
    blocken efter: en licensklausul i en fil utan en enda rad av det slaget är
    ett påstående om data som inte finns.

    Blocken säger själva vad de täcker i `covers`, så villkoret behöver inte
    kunna deras namn. Ett block utan `covers` är `geocoding`, som hänger på de
    härledda kartnålarna i stället för på ett fält.
    """
    tacker = block.get("covers")
    if tacker is None:
        return bool(antal_harledda)
    return any(bevarade.get(falt) for falt in tacker)


def export(client: Supabase, out_dir: Path) -> None:
    print("Hämtar från Supabase", file=sys.stderr)

    municipalities = client.all_rows("municipalities", order="code")
    establishments = client.all_rows("establishments", order="id")
    assessments = client.all_rows("assessments", order="establishment_id")
    inspections = client.all_rows("inspections", order="id")
    areas = client.all_rows("control_areas", order="id")
    images = client.all_rows("images", order="id")

    # `active = 0` betyder att kommunen slutat lämna ut verksamheten, se
    # deactivate_missing i load_supabase.py. Raden ligger kvar i databasen med
    # sin historik och sin slug reserverad, men den ska inte byggas till en
    # sida. Filtret måste stå här och inte bara i vyn
    # publishable_establishments: exporten läser tabellen direkt, och utan
    # det här hade avpubliceringen inte synts på sajten alls.
    #
    # NULL räknas som publicerad, precis som vyns coalesce(active, 2).
    retired = sum(1 for e in establishments if e.get("active") == 0)
    if retired:
        establishments = [e for e in establishments if e.get("active") != 0]
        print(f"  {retired} avpublicerade verksamheter utelämnas", file=sys.stderr)

    print(
        f"  {len(municipalities)} kommuner · {len(establishments)} verksamheter · "
        f"{len(inspections)} kontroller · {len(areas)} områden",
        file=sys.stderr,
    )

    by_assessment = {a["establishment_id"]: a for a in assessments}
    by_inspection = defaultdict(list)
    for i in inspections:
        by_inspection[i["establishment_id"]].append(i)
    # Hämtordningen är id-baserad för att paginering ska vara stabil.
    # Sajten vill ha nyast först, så sorteringen görs här i stället.
    for group in by_inspection.values():
        group.sort(key=lambda x: x["inspected_at"], reverse=True)
    by_area = defaultdict(list)
    for a in areas:
        by_area[a["inspection_id"]].append(a)
    by_image = defaultdict(list)
    for img in images:
        by_image[img["establishment_id"]].append(img)

    by_municipality = defaultdict(list)
    for e in establishments:
        by_municipality[e["municipality_code"]].append(e)

    out_dir.mkdir(parents=True, exist_ok=True)
    rasade: list = []

    for m in municipalities:
        records = []
        # Koordinater och öppettider bor i FILEN, inte i databasen. Se
        # `filradering` för varför, och varför det inte är en nödlösning.
        sokvag = out_dir / f"{m['slug']}.json"
        tidigare = filradering(sokvag)
        forra_block = filblock(sokvag)
        antal_harledda = 0

        for e in by_municipality.get(m["code"], []):
            assessment = by_assessment.get(e["id"], {})
            image = (by_image.get(e["id"]) or [None])[0]

            forra = tidigare.get(e["id"], {})

            # Ursprunget hör ihop med koordinaten och återställs bara när
            # koordinaten gör det. Har kommunen börjat publicera en egen ska
            # den aldrig bära ett geoSource från en gammal gissning.
            harlett = {}
            lat, lng = e.get("lat"), e.get("lng")
            if lat is None and lng is None:
                lat, lng = forra.get("lat"), forra.get("lng")
                if lat is not None and lng is not None:
                    harlett = {
                        nyckel: forra[nyckel]
                        for nyckel in ("geoSource", "geoPrecision")
                        if forra.get(nyckel) is not None
                    }
                    antal_harledda += 1
            elif e.get("geo_source"):
                # De allra flesta härledda nålarna bor bara i filen, men SJU
                # rader bär ett `geo_source` i Supabase, sex av dem i Uppsala.
                # För dem har databasen både koordinaten och dess ursprung, och
                # då ska ursprunget läsas därifrån. Utan den här grenen skrev
                # exporten ut nålen men tappade märkningen om att den är
                # framräknad, alltså precis det `geoSource` finns för att säga.
                harlett = {
                    "geoSource": e["geo_source"],
                    **(
                        {"geoPrecision": e["geo_precision"]}
                        if e.get("geo_precision")
                        else {}
                    ),
                }
                antal_harledda += 1

            records.append(
                {
                    "id": e["id"],
                    "slug": e["slug"],
                    "name": e["name"],
                    "address": e.get("street_address"),
                    "types": e.get("types") or [],
                    "lat": _round(lat),
                    "lng": _round(lng),
                    # Direkt efter lng, samma plats som pipeline/geocode.py
                    # ger dem, så att de två vägarna skriver samma fil.
                    **harlett,
                    # `url` pekar på VÅR kopia, aldrig på källans adress.
                    # Mapillarys miniatyr-URL:er är signerade och går ut; en
                    # sådan i databasen är en bild som slutar visas utan att
                    # något bygge klagar. Se pipeline/prikko/imagery.py.
                    # `source` följer med eftersom attributionskravet skiljer
                    # sig åt: Mapillary kräver sin logotyp, inte bara en länk.
                    "image": (
                        {
                            "url": image["url"],
                            "id": image.get("source_id") or "",
                            "capturedAt": image.get("captured_at"),
                            "source": image.get("source") or "own",
                            "licence": image.get("licence"),
                            "attribution": image.get("attribution"),
                        }
                        if image
                        else None
                    ),
                    "verdict": assessment.get("verdict"),
                    "distinction": assessment.get("distinction", False),
                    "reason": assessment.get("reason", "no_inspections"),
                    "modelVersion": assessment.get("model_version", 3),
                    "uncertain": False,
                    "inspections": [
                        {
                            "id": i["id"],
                            "date": i["inspected_at"],
                            "assessment": i["assessment"],
                            "type": i["type"],
                            "prenotified": i.get("prenotified"),
                            "audit": i.get("audit", False),
                            "onSite": i.get("on_site", True),
                            # Verksamhetens svar. Följer med ordagrant, och
                            # utelämnas helt när det inte finns, så att inte
                            # varje kontroll utan svar får ett tomt fält i
                            # snapshoten. Se pipeline/moderate.py för hur ett
                            # svar tar sig hit.
                            **(
                                {"ownerComment": i["owner_comment"]}
                                if i.get("owner_comment")
                                else {}
                            ),
                            "areas": [
                                {
                                    "code": a.get("code") or "",
                                    "group": a.get("area_group") or "",
                                    "description": a.get("description") or "",
                                    "status": a["status"],
                                }
                                for a in by_area.get(i["id"], [])
                            ],
                        }
                        for i in by_inspection.get(e["id"], [])
                    ],
                }
            )

        # Fälten som bara bor i FILEN hakas på efter att posterna är byggda,
        # och inte som fält i literalen ovan, eftersom de flesta rader saknar
        # dem: ett `"hours": None` på 13 000 rader hade lagt 13 000 rader i
        # varje diff. Se FILFALT.
        bevarade = {namn: 0 for namn in FILFALT}
        for rad in records:
            forra = tidigare.get(rad["id"], {})
            for namn in FILFALT:
                if forra.get(namn):
                    rad[namn] = forra[namn]
                    bevarade[namn] += 1

        # Licensblocken följer med när, och bara när, filen faktiskt bär den
        # data de handlar om. De står EFTER `source` och i FILBLOCK:s ordning,
        # som är den ordning de incheckade filerna har.
        block = {
            namn: forra_block[namn]
            for namn in FILBLOCK
            if namn in forra_block
            and behall_block(forra_block[namn], bevarade, antal_harledda)
        }

        payload = {
            "municipality": {
                "code": m["code"],
                "name": m["name"],
                "city": m["city"],
                "slug": m["slug"],
                "sourceType": m.get("source_type"),
            },
            "source": {
                "url": m.get("source_url") or "",
                "fetchedAt": m.get("last_fetched_at") or "",
            },
            **block,
            "establishments": records,
        }

        path = sokvag

        # Provet FÖRE skrivningen, och det är rättelsen. Skrevs filen först
        # låg den rasade utgåvan på disken, och enda sättet att skydda den var
        # att stoppa hela exporten. Nu behålls gårdagens fil för just den
        # kommunen och de övriga elva går vidare.
        #
        # Två grindar, samma verkan. Kontrollpunkterna är vad en anmärkning
        # gällde, koordinaterna är kartnålen. Båda kan försvinna tyst, och en
        # kommun vars fil rasar i endera avseendet ska behålla gårdagens.
        orsak = collapse(path, records) or coordinate_collapse(path, records)
        if orsak:
            rasade.append((m["slug"], orsak))
            print(
                f"  {path.name} LÄMNAS ORÖRD, gårdagens utgåva behålls",
                file=sys.stderr,
            )
            continue

        path.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"  {path}  {len(records)} verksamheter", file=sys.stderr)

    if rasade:
        report_collapse(rasade, out_dir)


#: Filen som talar om för nattjobbet att något rasade. Skrivs av
#: `report_collapse` och läses av ett sista steg i arbetsflödet, EFTER
#: incheckningen.
RAS_MARKOR = "rasade-kommuner.txt"


def report_collapse(rasade: list, out_dir: Path) -> None:
    """En rasad kommun ska stoppa sin egen fil, inte hela nattens data.

    `rasade` är par av kommunens slug och skälet grinden gav.

    ## Varför exporten inte längre avbryter

    Grinden avbröt förr hela körningen. Skälet var riktigt: en kommun vars
    kontrollpunkter försvinner beror långt oftare på ett fel uppströms än på
    att kommunen slutat publicera, och att checka in det raderar sidans
    egentliga innehåll.

    Men priset var för högt. 2026-08-17 bytte Lomma sidformat, hämtaren läste
    noll av sextio poster, och grinden höll därmed ELVA friska kommuners
    färska data borta från sajten. Beståndet stod på tolv dagar gammal data
    för att en kommun av tolv var trasig.

    Nu behålls gårdagens fil för den rasade kommunen och de övriga skrivs som
    vanligt. Kommunen fryser alltså på sin senaste hela utgåva i stället för
    att raderas, vilket är precis det grinden fanns för.

    ## Varför körningen ändå ska bli röd

    En kommun som fryser tyst fryser för alltid. Kommentaren vid
    MIN_POINTS_KEPT säger det redan om ett annat tal: ingen läser en rad som
    ser likadan ut varje natt. Därför skrivs en markörfil som ett sista steg i
    arbetsflödet läser EFTER incheckningen. Datan kommer fram, körningen blir
    röd, och mejlet kommer.
    """
    lista = ", ".join(slug for slug, _ in rasade)
    print(
        f"\nVARNING: {len(rasade)} kommuner rasade:\n"
        + "".join(f"  {slug}: {orsak}\n" for slug, orsak in rasade)
        + "Deras filer är OFÖRÄNDRADE, alltså gårdagens utgåva. Övriga kommuner\n"
        "är skrivna som vanligt och checkas in.\n"
        "Ett fel uppströms är långt troligare än att en kommun slutat\n"
        "publicera. Börja i kommunens hämtare, den upptäcker oftast själv att\n"
        "sidformatet ändrats. Gäller det kartnålarna: börja i stället i\n"
        "`harledda` här i filen och i pipeline/geocode.py.\n"
        "Är fallet verkligt: kör om med --tillat-ras.",
        file=sys.stderr,
    )
    if os.environ.get("GITHUB_ACTIONS"):
        print(f"::warning title=Kommun frusen::{lista} behöll gårdagens data.")
    (out_dir.parent / RAS_MARKOR).write_text(
        "".join(f"{slug}: {orsak}\n" for slug, orsak in rasade), encoding="utf-8"
    )


def count_points(records: list) -> int:
    """Kontrollpunkterna i en ögonblicksbild.

    Fälten hämtas med `.get`, för den ena av de två anropsplatserna är en fil
    på disken som kan vara halvskriven. Ett saknat fält ska ge noll punkter
    och därmed ingen jämförelse, inte en KeyError som fäller hela exporten.
    """
    return sum(
        len(i.get("areas") or [])
        for e in records
        for i in (e.get("inspections") or [])
    )


def count_coordinates(records: list) -> int:
    """Hur många verksamheter som har en kartnål.

    Båda talen krävs. Ett ensamt lat är ingen plats, och sajten ritar ingen
    nål för det.
    """
    return sum(
        1 for e in records if e.get("lat") is not None and e.get("lng") is not None
    )


def _tidigare(path: Path) -> Optional[list]:
    """Föregående exports ögonblicksbild, eller None när den inte går att läsa.

    Grindarna jämför mot filen som redan ligger på disken, för det är den
    nattkörningen ersätter.
    """
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text("utf-8"))["establishments"]
    except (ValueError, KeyError):
        return None


#: Så stor andel av gårdagens kontrollpunkter måste finnas kvar i dagens
#: export. Kontrollpunkterna är det som svarar på VAD en anmärkning gällde,
#: alltså sidans egentliga innehåll, och de rör sig långsamt: en kommun lämnar
#: ut sin historik varje natt, inte bara det som är nytt.
#:
#: Natten till 2026-08-07 skrevs 103 000 punkter över med tolv. Exporten sa
#: "12 kommuner · 15 900 verksamheter · 69 000 kontroller · 12 områden" och
#: checkade in resultatet, och ingenting stannade upp. Talet stod där hela
#: tiden. Ingen läser en rad som ser likadan ut varje natt.
MIN_POINTS_KEPT = 0.5

#: Så stor andel av gårdagens kartnålar måste finnas kvar, OCH hur många nålar
#: som minst måste ha försvunnit för att grinden ska bry sig. Båda villkoren
#: krävs, och de gör olika arbete: kvoten fångar de stora kommunerna, golvet
#: hindrar de små från att fälla körningen på vanligt bortfall.
#:
#: ## Varför koordinaterna behöver en egen grind
#:
#: En verksamhet utan koordinat är fullt publicerbar hos oss. Den saknar bara
#: sin kartnål, så ingenting i bygget klagar. Nattkörningen 2026-08-17 tog
#: Örebro från 645 nålar till 0 och Uppsala från 966 till 6, och det checkades
#: in utan att något stannade upp. Se `harledda` för orsaken.
#:
#: ## Varför just 0,9 och 10
#:
#: Uppmätt ur de nattliga exporterna i git-historiken, varje kommun som hade
#: koordinater, kvoten dagens nålar genom gårdagens:
#:
#:   normal rörelse   0,996 till 1,003   sämsta natten Jönköping 1 123 → 1 119
#:   verkliga ras     0,000, 0,006 och 0,048
#:
#: Mellan 0,048 och 0,996 finns ingenting alls, så tröskeln kan läggas var som
#: helst däremellan. 0,9 väljs för att den ligger tjugofem gånger utanför det
#: brus som faktiskt mätts och ändå fäller ett tapp på en tiondel. Att ta
#: kontrollpunkternas 0,5 hade betytt att Uppsala tyst får tappa 483 nålar.
#:
#: Golvet finns för de små kommunerna. Svenljunga får omkring 25 nålar, och
#: där ger tre nedlagda verksamheter kvoten 0,88, alltså under tröskeln utan
#: att något är fel. Största normala tapp som mätts i absoluta tal är tolv
#: nålar (Stockholm 8 511 → 8 499, kvot 0,999), och det skyddas redan av
#: kvoten. Tio räcker därför som golv: under det talet är rörelsen alltid det
#: normala bortfallet, ett par nålar för nedlagda verksamheter.
MIN_COORDINATES_KEPT = 0.9
MIN_COORDINATES_LOST = 10

ALLOW_COLLAPSE = False


def collapse(path: Path, records: list) -> Optional[str]:
    """Har kommunen tappat nästan alla sina kontrollpunkter sedan i går?"""
    if ALLOW_COLLAPSE:
        return None
    before_records = _tidigare(path)
    if before_records is None:
        return None
    before = count_points(before_records)
    after = count_points(records)
    if before and after < before * MIN_POINTS_KEPT:
        orsak = f"{before} kontrollpunkter blev {after}"
        print(f"  ! {path.name}: {orsak}", file=sys.stderr)
        return orsak
    return None


def coordinate_collapse(path: Path, records: list) -> Optional[str]:
    """Har kommunen tappat sina kartnålar sedan i går?

    Samma form och samma återhållsamhet som `collapse`: jämförelsen sker mot
    filen på disken, och små rörelser får passera. Se MIN_COORDINATES_KEPT
    för de mätta talen bakom tröskeln.

    En kommun som aldrig haft några nålar kan inte tappa några, så noll i går
    fäller aldrig. Det är avsiktligt: de fyra kommuner som saknar koordinater
    helt ska inte fälla varenda natt fram till att de blivit geokodade.
    """
    if ALLOW_COLLAPSE:
        return None
    before_records = _tidigare(path)
    if before_records is None:
        return None
    before = count_coordinates(before_records)
    after = count_coordinates(records)
    if before - after < MIN_COORDINATES_LOST:
        return None
    if after < before * MIN_COORDINATES_KEPT:
        orsak = f"{before} kartnålar blev {after}"
        print(f"  ! {path.name}: {orsak}", file=sys.stderr)
        return orsak
    return None


def main() -> None:
    global ALLOW_COLLAPSE
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path, default=Path("site/src/data"))
    parser.add_argument(
        "--tillat-ras",
        action="store_true",
        help="Skriv även när en kommuns kontrollpunkter nästan försvunnit.",
    )
    args = parser.parse_args()
    ALLOW_COLLAPSE = args.tillat_ras

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
    if not url or not key:
        sys.exit("Saknar SUPABASE_URL och nyckel.")

    export(Supabase(url, key), args.out)
    print("\nKlart.", file=sys.stderr)


if __name__ == "__main__":
    main()
