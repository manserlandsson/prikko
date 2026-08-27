#!/usr/bin/env python3
"""Steg tre för våra egna fotografier: lägg de godkända i lagringen och skriv raden.

    # prova hela kedjan utan konto, bilderna hamnar i en katalog
    python3 pipeline/egna_fotoko.py tillampa site/src/data/hoganas.json \\
        --godkanda pipeline/data/interim/egna_foton.json \\
        --lokal ~/prikko-egna --bas-url http://localhost:8788/bilder

    # skarpt, mot lagringen och databasen i miljön
    set -a && . ~/.prikko-env && set +a
    python3 pipeline/egna_fotoko.py tillampa site/src/data/*.json \\
        --godkanda pipeline/data/interim/egna_foton.json


═══ TRE STEG, OCH DET MELLERSTA ÄR EN MÄNNISKA ═══════════════════════════════

  1. `node site/scripts/egna-foton.mjs` matchar filnamnen mot registret, gör om
     bilderna till webp och skriver en kö plus ett granskningsark.
  2. En människa öppnar arket och stryker det som är fel.
  3. Det här skriptet lägger bytesen i objektlagringen och skriver raderna.

Samma form som commonsko.py och gatubildsko.py, och av samma skäl: ett foto på
fel verksamhet är ett påstående om en namngiven verksamhet, och varje sida bär
både namnet och bedömningen. Det är den enda sortens fel som inte går att ta
tillbaka när sidan är indexerad.

Skillnaden mot de två andra köerna är att MOTPARTEN INTE ÄR EN MASKIN. Commons
och Mapillary pekas ut av en algoritm som kan ha fel om vilket hus som är
vilket. Här har en människa redan riktat kameran mot rätt ställe, och det som
kan gå fel är i stället filnamnet: ett foto som heter "Holy Smoke" hamnar på
den Holy Smoke som råkar ligga först i kommunens register. Kön finns för det.


═══ BÅDE FILEN OCH DATABASEN, OCH DET ÄR INTE BÄLTE MED HÄNGSLEN ═════════════

Filen är det bygget läser i dag. Databasen är det nattens export_supabase.py
bygger om filen ur, och exporten bygger varje rad FRÅN GRUNDEN: allt utan en
kolumn där försvinner tyst, och ingenting klagar, eftersom en verksamhet utan
bild är fullt publicerbar.

Skrevs bara filen vore bilderna alltså borta inom ett dygn. Det felet har
inträffat fem gånger på fem dygn med andra fält, senast med `contact` som stod
på 3 274 rader. `skriv_raden` i hamta_commonsbilder.py säger samma sak om
Commons-bilderna.


═══ ORDNINGEN SKRIVS SOM `position` OCH GISSAS ALDRIG ════════════════════════

Kön bär ett `ordning` per bild, satt av `sortera` i egna-foton.mjs ur det
bedömda motivfältet: fasaden före byggnaden före tallriken. Det talet skrivs
rakt in i `images.position`, och exporten sorterar på det. Första bilden är den
som visas i listor, på kort och i kartnålens popup, alltså är ordningen ett
påstående om vad stället ÄR och inte en smaksak.


═══ VAD SKRIPTET ALDRIG GÖR ══════════════════════════════════════════════════

Rör aldrig en verksamhet som inte står i den godkända filen. Skriver aldrig en
bild vars webp saknas på disk. Och laddar aldrig upp något alls utan en
lagring: en URL som pekar på ingenting är värre i datafilen än ingen bild, för
sidan får då en trasig bildruta med en söndrig ikon i.
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import sys
from collections import defaultdict
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko import imagestore  # noqa: E402

#: Källbeteckningen för ett foto vi tagit själva.
#:
#: INTE `own` och inte `owner`. De två betyder "verksamhetens egen bild", och
#: StreetPhoto.astro skriver ut precis de orden när attributionen saknas. Att
#: lägga ägarens foto på en krog under den etiketten hade varit ett falskt
#: påstående om vem som tagit bilden. Se check-villkoret i schema.sql.
KALLA = "prikko"

#: Källor som en egen bild får ersätta.
#:
#: Ingen. En bild ur Commons eller Mapillary står i sidopanelen med sin
#: attributionsrad och rörs inte, och en bild verksamheten själv skickat in är
#: släppt fram av redaktionen. Våra egna foton läggs BREDVID dem, och delningen
#: mellan bandet och panelen sker i sidmallen. Se `bandbilder` i
#: site/src/pages/[kommun]/[slug].astro.
#:
#: Det som däremot rensas är våra EGNA tidigare foton på samma verksamhet, se
#: `ersatt_egna`. Annars hade en andra körning lagt tolv bilder till bredvid de
#: tolv som redan fanns.


class SupabaseError(RuntimeError):
    pass


class Supabase:
    """Precis de anrop som behövs, mot PostgREST.

    Klienten bor här och inte i prikko/, av samma skäl som commonsko.py säger:
    hämtaren har redan en, och en påhittad `prikko.supabase` faller på
    ModuleNotFoundError innan kommandot hinner göra något alls.
    """

    def __init__(self, url: str, key: str) -> None:
        self.base = url.rstrip("/") + "/rest/v1"
        self.key = key

    def _request(self, method: str, path: str, body=None, prefer: str = "") -> bytes:
        import urllib.error
        import urllib.request

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

    def ersatt_egna(self, establishment_id: str, rader: list[dict]) -> None:
        """Byt ut verksamhetens EGNA foton mot de här, och rör inga andra.

        Radera först och skriv sedan, i stället för att lägga till. Skriptet är
        avsett att gå om: filnamnen är desamma, objektnycklarna är desamma, och
        en omkörning ska ge samma tolv bilder och inte tjugofyra.

        Filtret på `source` är det som gör raderingen smal. En Commons-bild och
        en bild verksamheten själv skickat in ligger kvar orörda; det är bara
        våra egna som ersätts av våra egna.
        """
        self._request(
            "DELETE",
            f"images?establishment_id=eq.{establishment_id}&source=eq.{KALLA}",
            prefer="return=minimal",
        )
        if rader:
            self._request("POST", "images", rader, prefer="return=minimal")


def build_store(args):
    """Lagringen. Bilderna hamnar ALDRIG i bygget, se prikko/imagestore.py."""
    if args.lokal:
        if not args.bas_url:
            raise SystemExit(
                "--lokal kräver --bas-url, annars vet vi inte vad som ska "
                "skrivas i datafilen."
            )
        katalog = Path(args.lokal).expanduser().resolve()
        if katalog.is_relative_to(Path(__file__).resolve().parents[1] / "site"):
            raise SystemExit(
                "--lokal får inte peka in i site/. Bilderna ligger i "
                "objektlagringen och aldrig i bygget, som fäller vid 19 500 "
                "filer. Se grinden i site/astro.config.mjs."
            )
        return imagestore.LocalStore(directory=katalog, public_base_url=args.bas_url)

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
    return store


def objektnyckel(kommun: str, slug: str, webp: Path) -> str:
    """Deterministisk, så att en omkörning skriver över i stället för att lägga till.

    Samma tanke som `imagery.object_key`. Nyckeln följer KÄLLFILENS namn och
    aldrig bildens plats i bandet, och det är en skillnad som betyder något:
    ändrar någon en motivbedömning byter halva bandet plats, och en
    platsnumrerad nyckel hade då pekat på en annan bild än den gjorde i går,
    medan de gamla objekten låg kvar i hinken under nycklar ingen längre
    använder.

    Filen på disk ligger redan i `<kommun>/<slug>/<källfil>.webp`, se
    `filnyckel` i site/scripts/egna-foton.mjs, så nyckeln är den sökvägen med
    `egna/` framför. Kommun och slug skrivs ut här ur verksamheten i stället
    för att läsas ur sökvägen, så att en flyttad interimskatalog inte tyst
    ändrar var i hinken bilden hamnar.
    """
    return f"egna/{kommun}/{slug}/{webp.name}"


def bildrad(url: str, kalla: str, ordning: int) -> dict:
    """Bilden som datafilen bär den.

    `id` är ursprungsfilens namn. Ett eget foto kräver ingen attribution, men
    det ska ändå gå att spåra: den som ser bilden på sidan ska kunna hitta
    filen den kom ur, och site/src/lib/bildmotiv.data.json pekar ut sina
    bedömningar med exakt den strängen.

    `licence` och `attribution` är null och ska vara det. Ett eget foto har
    ingen tredje part att kreditera, och en påhittad rad under bilden vore en
    upplysning som inte betyder något.
    """
    return {
        "url": url,
        "id": kalla,
        "capturedAt": None,
        "source": KALLA,
        "licence": None,
        "attribution": None,
    }


def tillampa(filer: list[Path], godkanda_fil: Path, store, db: Optional[Supabase]) -> int:
    godkanda = json.loads(godkanda_fil.read_text(encoding="utf-8"))

    # Kön är en platt lista med en rad per bild. Här grupperas den per
    # verksamhet och sorteras på `ordning`, så att skriptet inte behöver lita
    # på att raderna råkade skrivas i rätt följd.
    per_verksamhet: dict[str, list[dict]] = defaultdict(list)
    for rad in godkanda:
        per_verksamhet[rad["id"]].append(rad)
    for rader in per_verksamhet.values():
        rader.sort(key=lambda r: r["ordning"])

    skrivna = 0
    rorda = 0

    for path in filer:
        payload = json.loads(path.read_text(encoding="utf-8"))
        kommun = payload["municipality"]["slug"]
        rort = False

        for e in payload["establishments"]:
            kon = per_verksamhet.get(e["id"])
            if not kon:
                continue

            bilder = []
            dbrader = []
            for plats, rad in enumerate(kon):
                webp = Path(rad["fil"])
                if not webp.exists():
                    print(
                        f"  {e['name']}: {webp} saknas, kör egna-foton.mjs igen",
                        file=sys.stderr,
                    )
                    continue
                nyckel = objektnyckel(kommun, e["slug"], webp)
                typ = mimetypes.guess_type(webp.name)[0] or "image/webp"
                url = store.put(nyckel, webp.read_bytes(), typ)
                bilder.append(bildrad(url, rad["kalla"], plats))
                dbrader.append(
                    {
                        "establishment_id": e["id"],
                        "url": url,
                        "source": KALLA,
                        "source_id": rad["kalla"],
                        "licence": None,
                        "attribution": None,
                        "captured_at": None,
                        # Ordningen ur kön, se modulens docstring.
                        "position": plats,
                    }
                )

            if not bilder:
                continue

            # SAMMA REGEL SOM EXPORTEN, och den måste vara samma.
            #
            # `image` är förstabilden och står alltid. `images` står bara när
            # det finns mer än en, för annars hade 366 rader burit samma bild
            # två gånger och diffen svällt med drygt 2 900 rader utan en enda
            # ny uppgift. Se `bildrad` och `export` i export_supabase.py, och
            # `bildlista` i site/src/lib/db.ts som gör en lista av `image` när
            # `images` saknas.
            e["image"] = bilder[0]
            if len(bilder) > 1:
                e["images"] = bilder
            else:
                e.pop("images", None)

            if db is not None:
                db.ersatt_egna(e["id"], dbrader)

            rort = True
            rorda += 1
            skrivna += len(bilder)
            print(f"  {e['name']}: {len(bilder)} bilder", file=sys.stderr)

        if rort:
            # indent=1 och ensure_ascii=False, samma form som varje annat
            # skript som rör datafilerna. En annan form ger en diff på hela
            # filen i stället för på de rader som ändrats.
            path.write_text(
                json.dumps(payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
            )

    print(f"{skrivna} bilder på {rorda} verksamheter", file=sys.stderr)
    if db is None:
        print(
            "\nINGEN DATABAS. Raderna står bara i filen, och nästa nattkörning\n"
            "bygger om filen ur Supabase och tar bort dem. Kör om med\n"
            "SUPABASE_URL och SUPABASE_SERVICE_KEY satta innan du checkar in.",
            file=sys.stderr,
        )
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("kommando", choices=("tillampa",))
    parser.add_argument("files", nargs="*", type=Path)
    parser.add_argument("--godkanda", type=Path, help="kön ur site/scripts/egna-foton.mjs")
    parser.add_argument("--lokal", help="skriv bilderna till en katalog i stället för lagringen")
    parser.add_argument("--bas-url", dest="bas_url", help="publik bas-URL för --lokal")
    args = parser.parse_args()

    if not args.files:
        raise SystemExit("tillampa kräver datafiler")
    if not args.godkanda:
        raise SystemExit("tillampa kräver --godkanda med kön")

    store = build_store(args)

    db = None
    if not args.lokal:
        import os

        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_KEY")
        if not url or not key:
            raise SystemExit(
                "SUPABASE_URL och SUPABASE_SERVICE_KEY saknas. Utan dem skrivs\n"
                "bilderna bara i filen, och nästa nattkörning tar bort dem.\n"
                "Kör med --lokal och --bas-url om du bara vill prova kedjan."
            )
        db = Supabase(url, key)

    return tillampa(args.files, args.godkanda, store, db)


if __name__ == "__main__":
    raise SystemExit(main())
