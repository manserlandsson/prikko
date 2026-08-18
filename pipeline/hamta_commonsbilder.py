#!/usr/bin/env python3
"""Hämta fritt licensierade bilder ur Wikimedia Commons till verksamheterna.

    # mäter, hämtar ingenting, skriver ingenting
    python3 pipeline/hamta_commonsbilder.py --matt site/src/data/*.json

    # mot en lokal katalog, för att se hela kedjan utan konto
    python3 pipeline/hamta_commonsbilder.py site/src/data/stockholm.json \
        --lokal ~/prikko-commons --bas-url http://localhost:8788/bilder

    # skarpt, mot lagringen i miljön (Supabase Storage i dag, R2 när det finns)
    set -a && . ~/.prikko-env && set +a
    python3 pipeline/hamta_commonsbilder.py site/src/data/*.json

URVALET ÄR HELT BESTÄMT AV REGLER SOM REDAN FINNS I KODEN, och det är hela
poängen: ingen lista att underhålla, ingen kuratering per verksamhet.

  1. Verksamheten paras mot OSM som vanligt, prikko/oppettider.py.
  2. `wikidata` läses ur OSM-taggarna. ALDRIG `brand:wikidata`, som står på
     762 och är kedjans objekt.
  3. P18 och P625 hämtas ur Wikidata.
  4. Bilden kastas om P625 ligger mer än 150 meter från OSM-punkten, eller
     saknas. Spärren fäller tre av trettio, och de tre är de farliga.
  5. Licens och upphovsman läses ur Commons `extmetadata`.

Utfall mätt 2026-08-18 över alla tolv kommunerna:

    konsumentvända                                9 995
    hopparade med ett OSM-objekt                  3 927
    varav med en `wikidata`-tagg                     33
    varav med en P18-bild                            30
    varav inom 150 meter, alltså med bild            27

26 av de 27 ligger i Stockholm, den tjugosjunde är Ryds Herrgård i Linköping.
Det är genomgående de gamla krogarna: Den Gyldene Freden, Operakällaren,
Riche, Ekstedt, Sturehof, Pelikan, Mäster Anders.

VAD DET KOSTAR I FILER: noll. Bilderna ligger i objektlagringen, aldrig i
bygget. Grinden i site/astro.config.mjs fäller vid 19 500 filer och bygget låg
på 16 937 den 2026-08-18. Det talet är oförändrat efter den här körningen, och
det ska det vara: 27 bilder i site/ hade varit 27 filer vi inte behöver lägga
där. Se prikko/imagestore.py.

Skriptet är IDEMPOTENT. Objektnyckeln är deterministisk, så en omkörning
skriver över samma objekt i stället för att lägga ett till, och verksamheter
som redan har en bild hoppas över om man inte säger `--skriv-over`.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from oppettider import KONSUMENT, classify_via_node, fetch_pois  # noqa: E402
from prikko import commons, imagestore, wikidatanamn  # noqa: E402
from prikko.oppettider import (  # noqa: E402
    MATCHED,
    MISS_NO_HOURS,
    PoiIndex,
    pair,
    pois_from_overpass,
)

#: Paus mellan anrop. Wikidata och Commons är gratis och drivs av en stiftelse,
#: och vi lever på att de fortsätter tycka om oss. Talet spelar knappt någon
#: roll här: hela riket är 27 hämtningar.
POLITE_DELAY_S = 0.5

#: Bildkällor en Commons-bild får ersätta.
#:
#: En gatubild är vald av GEOMETRI: närmaste bild inom trettio meter med
#: kameran ungefär mot huset. En Commons-bild är vald av en MÄNNISKA som lagt
#: in den som objektets bild på Wikidata, och därefter spärrad på avstånd. Den
#: andra är bättre för de 27 det gäller, alltså får den gå före.
#:
#: `owner` står med avsikt INTE i listan. Den bilden är inskickad av
#: verksamheten och släppt fram av redaktionen, alltså har en människa hos oss
#: sagt ja till just den. Ett skript ersätter aldrig det.
REPLACEABLE = {"mapillary", "panoramax", "own", "wikimedia"}


class SupabaseError(RuntimeError):
    pass


class Supabase:
    """Minimal PostgREST-klient, samma form som hamta_gatubilder.py använder.

    Service-nyckeln går förbi radsäkerheten och bor bara i ~/.prikko-env.
    """

    def __init__(self, url: str, key: str) -> None:
        self.base = url.rstrip("/") + "/rest/v1"
        self.key = key

    def _request(self, method: str, path: str, body=None, prefer: str = "") -> bytes:
        headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer
        data = json.dumps(body).encode("utf-8") if body is not None else None
        request = urllib.request.Request(
            f"{self.base}/{path}", data=data, headers=headers, method=method
        )
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                return response.read()
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")[:400]
            raise SupabaseError(f"{method} {path} → {exc.code}: {detail}") from exc

    def replace_image(self, establishment_id: str, row: dict) -> None:
        """Ersätt verksamhetens rad i `images` med den här.

        Radera först och skriv sedan, i stället för att lägga till. Exporten
        i export_supabase.py tar FÖRSTA raden per verksamhet, sorterad på id,
        alltså den äldsta. En ny rad bredvid en gammal hade därför inte synts
        på sajten alls, och en omkörning hade lagt en tredje.

        Bara de källor som får ersättas rensas. En `owner`-bild är inskickad
        av verksamheten och släppt fram av redaktionen, och den rör vi inte.
        """
        sources = ",".join(f'"{s}"' for s in sorted(REPLACEABLE))
        self._request(
            "DELETE",
            f"images?establishment_id=eq.{establishment_id}&source=in.({sources})",
            prefer="return=minimal",
        )
        self._request("POST", "images", [row], prefer="return=minimal")


def build_store(args):
    """Lagringen. Bilderna hamnar ALDRIG i bygget, se modulens docstring."""
    if args.lokal:
        if not args.bas_url:
            raise SystemExit(
                "--lokal kräver --bas-url, annars vet vi inte vad som ska "
                "skrivas i datafilen."
            )
        directory = Path(args.lokal).expanduser().resolve()
        if directory.is_relative_to(Path(__file__).resolve().parents[1] / "site"):
            raise SystemExit(
                "--lokal får inte peka in i site/. Bilderna ligger i "
                "objektlagringen och aldrig i bygget, som har 2 563 filers "
                "marginal till grinden vid 19 500."
            )
        return imagestore.LocalStore(directory=directory, public_base_url=args.bas_url)

    store = imagestore.from_env()
    if store is None:
        raise SystemExit(
            "Ingen lagring konfigurerad. Sätt SUPABASE_URL och "
            "SUPABASE_SERVICE_KEY, eller R2 enligt\n"
            "pipeline/prikko/imagestore.py, eller kör --lokal med --bas-url "
            "för att prova kedjan.\n\n"
            "En URL som pekar på ingenting är värre i datafilen än ingen bild "
            "alls: sidan får\nen trasig bildruta med en söndrig ikon i."
        )
    if isinstance(store, imagestore.SupabaseStore):
        print(
            f"Lagring: Supabase Storage, hinken {store.bucket}. R2 saknas i "
            "miljön (" + ", ".join(imagestore.missing_settings()) + ").",
            file=sys.stderr,
        )
    return store


def candidates(path: Path, refresh: bool) -> tuple[dict, str, list, dict]:
    """Datafilen, kommunens slug, de konsumentvända raderna och deras qid:n.

    Nämnaren är densamma som öppettidernas och kontaktens: de konsumentvända,
    alltså restaurang, café och butik enligt site/src/lib/categories.ts. Ett
    tillagningskök på ett äldreboende ska inte ha en bild på en krog, och OSM
    kartlägger dem inte heller.
    """
    payload = json.loads(path.read_text(encoding="utf-8"))
    code = payload["municipality"]["code"]
    slug = payload["municipality"]["slug"]
    establishments = payload["establishments"]

    categories = classify_via_node(
        [(slug, e.get("types") or []) for e in establishments]
    )
    consumer = [
        e
        for e, cats in zip(establishments, categories)
        if any(c in KONSUMENT for c in cats)
    ]

    index = PoiIndex(pois_from_overpass(fetch_pois(code, refresh)))

    qid_by_row: dict = {}
    for establishment in consumer:
        result = pair(
            index,
            establishment.get("name"),
            establishment.get("lat"),
            establishment.get("lng"),
            approximate=establishment.get("geoPrecision") == "approximate",
        )
        # Samma villkor som kontaktuppgifterna: bilden hänger på HOPPARNINGEN
        # och inte på att OSM råkar ha en öppettid. `matched_without_hours`
        # betyder att vi vet exakt vilket OSM-objekt det är.
        if result.poi is None or result.reason not in (MATCHED, MISS_NO_HOURS):
            continue
        if result.poi.wikidata:
            qid_by_row[establishment["id"]] = (result.poi.wikidata, result.poi)

    return payload, slug, consumer, qid_by_row


def namnkandidater(path: Path) -> tuple[dict, str, list]:
    """Namnspårets kandidater: verksamheten och det objekt den ÄR.

    NÄMNAREN ÄR EN ANNAN ÄN OVAN, och det är ett medvetet val. `candidates`
    räknar bara de konsumentvända, för OSM kartlägger inte ett tillagningskök
    på en skola och en matpunkt som inte finns i OSM kan inte paras. Wikidata
    har däremot skolan, kyrkan och äldreboendet, och en bild av skolhuset på
    skolköketssidan är en riktig bild av det stället. Mätt 2026-08-19 är 101
    av de 193 träffarna på den här vägen skolor, förskolor, kyrkor och
    omsorgsboenden, alltså mer än hälften av vinsten.

    Ingen Overpass-fråga alls här. Objektet hittas på VÅR koordinat och VÅRT
    namn, så OSM behövs inte, och de kommuner där hopparningen är mager
    behandlas likadant som Stockholm.
    """
    payload = json.loads(path.read_text(encoding="utf-8"))
    slug = payload["municipality"]["slug"]
    establishments = payload["establishments"]

    box = wikidatanamn.bounding_box(
        (e.get("lat"), e.get("lng")) for e in establishments
    )
    if box is None:
        # Borgholm, Höganäs, Lomma och Svenljunga: 974 verksamheter utan en
        # enda koordinat. Utan koordinat finns ingen spärr att pröva mot, och
        # en bild vi inte kan pröva är en bild vi inte visar.
        return payload, slug, []

    index = wikidatanamn.Index(wikidatanamn.objects_in_box(box))

    par = []
    for establishment in establishments:
        lat, lng = establishment.get("lat"), establishment.get("lng")
        if lat is None or lng is None:
            continue
        if establishment.get("geoPrecision") == "approximate":
            # Gatunivå. Koordinaten kan ligga hos grannporten, och då säger
            # 150-metersspärren ingenting. 237 av 16 047 rader.
            continue
        traff = wikidatanamn.pair(index, establishment.get("name"), lat, lng)
        if traff is not None:
            par.append((establishment, traff))
    return payload, slug, par


def skriv_raden(establishment: dict, stored, db: Optional[Supabase]) -> None:
    """Bilden i datafilens rad OCH i databasen.

    BÅDA, och det är inte ett bälte med hängslen. Filen är det bygget läser i
    dag. Databasen är det nattens export_supabase.py bygger om filen ur, och
    den känner bara till `image` genom tabellen `images`. Skrevs bara filen
    vore bilderna borta vid nästa nattkörning, precis som öppettiderna en gång
    blev.
    """
    establishment["image"] = {
        "url": stored.url,
        "id": stored.source_id,
        "capturedAt": stored.captured_at,
        "source": stored.source,
        "licence": stored.licence,
        "attribution": stored.attribution,
    }
    if db is not None:
        db.replace_image(
            establishment["id"],
            {
                "establishment_id": establishment["id"],
                "url": stored.url,
                "source": stored.source,
                "source_id": stored.source_id,
                "licence": stored.licence,
                "attribution": stored.attribution,
                "captured_at": stored.captured_at,
                "position": 0,
            },
        )


def process_namnspar(path: Path, args, store, db: Optional[Supabase]) -> dict:
    """Namnspåret: fyra grindar, se prikko/wikidatanamn.py.

    Grind 1 och 2, namnlikheten och objektets slag, ligger i `pair` ovan.
    Grind 3 och 4, licensen och motivet, kan bara prövas när filen är uppslagen
    och görs därför här. Ordningen är inte fri: `commons.lookup` är anropet som
    kostar, och det ska ske en gång per kandidat och aldrig en gång per grind.
    """
    payload, slug, par = namnkandidater(path)
    name = payload["municipality"]["name"]

    tally = {
        "consumer": len(payload["establishments"]),
        "wikidata": len(par),
        "p18": 0,
        "inom": 0,
        "skrivna": 0,
        "hoppade": 0,
        "fel": 0,
    }

    changed = False
    for establishment, traff in sorted(par, key=lambda p: p[0]["id"]):
        existing = establishment.get("image") or {}
        if existing and existing.get("source") not in REPLACEABLE:
            tally["hoppade"] += 1
            continue
        if existing.get("source") == "wikimedia" and not args.skriv_over:
            # OSM-vägens bild står kvar. Den är utpekad av en människa i OSM
            # OCH av en människa i Wikidata, alltså belagd två gånger, medan
            # den här bara är belagd på namnet.
            tally["hoppade"] += 1
            continue

        try:
            found = commons.lookup(traff.objekt.bild)
        except Exception as exc:  # noqa: BLE001
            tally["fel"] += 1
            print(f"  ! {establishment['name']}: {exc}", file=sys.stderr)
            time.sleep(2)
            continue

        if found is None:
            # Grind 3: filen finns inte, är av fel format, eller bär en licens
            # som inte står i commons.FREE_LICENCES.
            print(
                f"    licens eller format: {establishment['name']} → "
                f"{traff.objekt.bild}",
                file=sys.stderr,
            )
            continue
        tally["p18"] += 1

        if not wikidatanamn.depicts(
            establishment["name"], found.title, found.description
        ):
            # Grind 4. Objektet heter rätt men BILDEN föreställer något annat:
            # kyrkan intill, torget utanför, gallerian omkring.
            print(
                f"    motivet: {establishment['name']} → {found.title}",
                file=sys.stderr,
            )
            continue
        tally["inom"] += 1

        if args.matt:
            print(
                f"    {establishment['name']} → {found.title} "
                f"({traff.metres:.0f} m, {traff.objekt.qid})",
                file=sys.stderr,
            )
            continue

        try:
            stored = commons.store_image(store, slug, establishment["id"], found)
        except Exception as exc:  # noqa: BLE001
            tally["fel"] += 1
            print(f"  ! {establishment['name']}: {exc}", file=sys.stderr)
            time.sleep(2)
            continue

        skriv_raden(establishment, stored, db)
        changed = True
        tally["skrivna"] += 1
        print(
            f"    {establishment['name']} · {stored.attribution} · {stored.licence}",
            file=sys.stderr,
        )
        time.sleep(args.paus)

    if changed and not args.matt:
        path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8"
        )
        print(f"  skrev {path}", file=sys.stderr)

    print(
        f"{name}: {tally['wikidata']} objekt på namn och avstånd, "
        f"{tally['p18']} med en fri fil, {tally['inom']} där motivet är stället, "
        f"{tally['skrivna']} bilder, av {tally['consumer']} verksamheter",
        file=sys.stderr,
    )
    return tally


def process(path: Path, args, store, db: Optional[Supabase]) -> dict:
    payload, slug, consumer, qid_by_row = candidates(path, args.refresh)
    name = payload["municipality"]["name"]
    by_id = {e["id"]: e for e in consumer}

    tally = {
        "consumer": len(consumer),
        "wikidata": len(qid_by_row),
        "p18": 0,
        "inom": 0,
        "skrivna": 0,
        "hoppade": 0,
        "fel": 0,
    }

    if not qid_by_row:
        print(f"{name}: 0 av {len(consumer)} konsumentvända bär wikidata", file=sys.stderr)
        return tally

    found = commons.subjects(q for q, _ in qid_by_row.values())

    changed = False
    for establishment_id, (qid, poi) in sorted(qid_by_row.items()):
        establishment = by_id[establishment_id]
        subject = found.get(qid)
        if subject is None or subject.image is None:
            continue
        tally["p18"] += 1

        metres = commons.within_reach(subject, poi.lat, poi.lng)
        if metres is None:
            # Spärren. Skriv ut den som föll och varför: det är den enda
            # gången någon får se att den gör sitt jobb.
            print(
                f"    spärrad: {establishment['name']} → {subject.image} "
                f"({'ingen koordinat' if subject.lat is None else 'för långt bort'})",
                file=sys.stderr,
            )
            continue
        tally["inom"] += 1

        existing = establishment.get("image") or {}
        if existing and existing.get("source") not in REPLACEABLE:
            tally["hoppade"] += 1
            continue
        if existing.get("source") == "wikimedia" and not args.skriv_over:
            tally["hoppade"] += 1
            continue

        if args.matt:
            print(
                f"    {establishment['name']} → {subject.image} ({metres:.0f} m)",
                file=sys.stderr,
            )
            continue

        try:
            stored = commons.capture(
                store, slug, establishment_id, subject, poi.lat, poi.lng
            )
        except Exception as exc:  # noqa: BLE001
            tally["fel"] += 1
            print(f"  ! {establishment['name']}: {exc}", file=sys.stderr)
            time.sleep(2)
            continue

        if stored is None:
            continue

        establishment["image"] = {
            "url": stored.url,
            "id": stored.source_id,
            "capturedAt": stored.captured_at,
            "source": stored.source,
            "licence": stored.licence,
            "attribution": stored.attribution,
        }
        changed = True
        tally["skrivna"] += 1
        print(
            f"    {establishment['name']} · {stored.attribution} · {stored.licence}",
            file=sys.stderr,
        )

        if db is not None:
            # BÅDE filen och databasen, och det är inte ett bälte med
            # hängslen. Filen är det bygget läser i dag. Databasen är det
            # nattens export_supabase.py bygger om filen ur, och den känner
            # bara till `image` genom tabellen `images`. Skrev vi bara filen
            # vore bilderna borta vid nästa nattkörning, precis som
            # öppettiderna en gång blev.
            db.replace_image(
                establishment_id,
                {
                    "establishment_id": establishment_id,
                    "url": stored.url,
                    "source": stored.source,
                    "source_id": stored.source_id,
                    "licence": stored.licence,
                    "attribution": stored.attribution,
                    "captured_at": stored.captured_at,
                    "position": 0,
                },
            )

        time.sleep(args.paus)

    if changed and not args.matt:
        # indent=1, samma form som resten av pipelinen skriver, så att diffen
        # blir de rader som faktiskt ändrats.
        path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8"
        )
        print(f"  skrev {path}", file=sys.stderr)

    print(
        f"{name}: {tally['wikidata']} med wikidata, {tally['p18']} med P18, "
        f"{tally['inom']} inom {commons.MAX_DISTANCE_M:.0f} m, "
        f"{tally['skrivna']} bilder, av {tally['consumer']} konsumentvända",
        file=sys.stderr,
    )
    return tally


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("files", nargs="+", type=Path)
    parser.add_argument("--matt", action="store_true", help="mät bara, hämta och skriv ingenting")
    parser.add_argument("--refresh", action="store_true", help="hämta OSM-uttaget på nytt")
    parser.add_argument("--lokal", help="skriv till en katalog i stället för till lagringen")
    parser.add_argument("--bas-url", dest="bas_url", help="publik bas-URL för --lokal")
    parser.add_argument(
        "--namnspar",
        action="store_true",
        help=(
            "leta objektet på namn och koordinat i Wikidata i stället för via "
            "OSM-taggen. Se prikko/wikidatanamn.py"
        ),
    )
    parser.add_argument(
        "--skriv-over",
        dest="skriv_over",
        action="store_true",
        help="hämta om bilder som redan är hämtade ur Commons",
    )
    parser.add_argument("--paus", type=float, default=POLITE_DELAY_S)
    args = parser.parse_args()

    store = None if args.matt else build_store(args)

    db: Optional[Supabase] = None
    if not args.matt and not args.lokal:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_KEY")
        if url and key:
            db = Supabase(url, key)
        else:
            print(
                "SUPABASE_URL och SUPABASE_SERVICE_KEY saknas: bilderna skrivs bara i\n"
                "datafilen. Nattens export bygger om filen ur databasen och tar då bort\n"
                "dem igen. Kör om med nycklarna satta.",
                file=sys.stderr,
            )

    kor = process_namnspar if args.namnspar else process
    total = {k: 0 for k in ("consumer", "wikidata", "p18", "inom", "skrivna", "hoppade", "fel")}
    for path in args.files:
        for key, value in kor(path, args, store, db).items():
            total[key] += value

    if args.namnspar:
        print(
            f"\nSAMMANLAGT av {total['consumer']} verksamheter: "
            f"{total['wikidata']} har ett Wikidata-objekt med samma namn inom "
            f"{wikidatanamn.MAX_DISTANCE_M:.0f} meter,\n{total['p18']} av dem bär en "
            f"fritt licensierad fil, och {total['inom']} av dem föreställer stället.\n"
            f"{total['skrivna']} bilder hämtade, {total['hoppade']} redan på plats, "
            f"{total['fel']} fel.",
            file=sys.stderr,
        )
    else:
        print(
            f"\nSAMMANLAGT av {total['consumer']} konsumentvända: "
            f"{total['wikidata']} bär wikidata, {total['p18']} har en P18, "
            f"{total['inom']} klarar spärren på {commons.MAX_DISTANCE_M:.0f} meter.\n"
            f"{total['skrivna']} bilder hämtade, {total['hoppade']} redan på plats, "
            f"{total['fel']} fel.",
            file=sys.stderr,
        )
    return 1 if total["fel"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
