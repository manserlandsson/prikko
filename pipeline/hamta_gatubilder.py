#!/usr/bin/env python3
"""Hämta gatubilder till verksamheterna, en gång per verksamhet.

    # torrkörning mot en datafil, ingen lagring, inga skrivningar
    python3 pipeline/hamta_gatubilder.py --fil site/src/data/linkoping.json --antal 20 --torr

    # mot en lokal katalog, för att se hela kedjan utan R2-konto
    python3 pipeline/hamta_gatubilder.py --fil site/src/data/linkoping.json \
        --antal 20 --lokal ~/prikko-bilder --bas-url http://localhost:8788/bilder

    # skarpt, mot Supabase
    set -a && . ~/.prikko-env && set +a
    python3 pipeline/hamta_gatubilder.py --kommun 0580 --antal 500

    # Raden ovan sätter INTE MAPILLARY_TOKEN: värdet innehåller lodstreck och
    # sönderdelas av skalet. Skriptet läser därför site/.env som reserv, se
    # mapillary_token(). Sätt citattecken runt värdet i ~/.prikko-env så
    # försvinner även varningarna om "command not found".

    # saknas R2-variablerna i miljön mellanlagras bilderna i ~/prikko-bilder
    # och URL:erna skrivs mot https://bilder.prikko.se — sätt upp bucketen
    # enligt bannern som skrivs ut och ladda sedan upp i efterhand:
    python3 pipeline/hamta_gatubilder.py --ladda-upp

FORMEN ÄR HELA POÄNGEN: ett anrop per verksamhet, aldrig ett per bygge och
aldrig ett per sidvisning. Skriptet hoppar över alla som redan har en bild, så
första körningen kostar några tusen anrop utspridda över en natt och varje
körning därefter kostar några dussin. Se docs/13_bilder_och_verksamhetsdata.md
del D.

Bilden lagras hos oss, i Cloudflare R2. Det som skrivs till public.images.url
är alltså vår egen adress och inte källans. Källans URL:er är efemära — det var
just den saken som var trasig — och de får aldrig ta sig in i databasen. Se
pipeline/prikko/imagery.py.

Alla 15 916 verksamheter ska inte ha en bild. Skola, förskola, vård och omsorg
ska inte ha ett foto på sitt kök, och ett huvudkontor eller en matmäklare har
ingen fasad att fotografera. Filtret nedan är samma som mätskriptets.
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
from pathlib import Path
from typing import Iterable, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko import imagestore  # noqa: E402
from prikko.imagery import capture  # noqa: E402

#: Typer där en fasadbild hör hemma. Matchas som delsträng mot `types`, som
#: inte är normaliserade mellan kommunerna: "1. Restaurang", "Restaurang och
#: servering" och "Restaurang" är tre stavningar av samma sak.
PUBLIC_FACING = (
    "restaurang", "café", "cafe", "servering", "pizzeria",
    "snabbmat", "bageri", "butik", "handel",
)

#: Paus mellan anrop. Båda bildkällorna är gratis och delade, och vi lever på
#: att de fortsätter tycka om oss.
POLITE_DELAY_S = 0.3

#: Mellanlagret när R2 ännu inte är uppsatt: bilderna landar här och URL:erna
#: skrivs mot den publika adress bucketen SKA få. Nycklarna är deterministiska
#: (se imagery.object_key), så katalogen kan laddas upp rakt av när bucketen
#: finns och varje redan skriven URL blir sann i samma stund.
STAGING_DIR = Path.home() / "prikko-bilder"
STAGING_BASE_URL = "https://bilder.prikko.se"

STAGING_BANNER = f"""\
--------------------------------------------------------------------------------
Varken R2 eller Supabase är konfigurerat i ~/.prikko-env, så bilderna
mellanlagras lokalt:

    filer:            {STAGING_DIR}
    URL som lagras:   {STAGING_BASE_URL}/gatubilder/...

URL:erna blir sanna först när bucketen finns och katalogen är uppladdad.
Så här, en gång:

  1. dash.cloudflare.com -> R2 Object Storage -> Create bucket.
     Namn: prikko-bilder. Location: Automatic.
  2. Bucketen -> Settings -> Public access -> Custom domains -> Connect domain:
     bilder.prikko.se. (Inte r2.dev-adressen: den är hastighetsbegränsad och
     går inte att byta lagring bakom senare.)
  3. R2 Object Storage -> API -> Manage API tokens -> Create Account API token.
     Permissions: Object Read & Write. Specify bucket: prikko-bilder.
     Access Key ID och Secret Access Key visas EN gång.
  4. Klistra in i ~/.prikko-env (Account ID står i R2-översiktens högerspalt):

         export R2_ACCOUNT_ID=...
         export R2_BUCKET=prikko-bilder
         export R2_ACCESS_KEY_ID=...
         export R2_SECRET_ACCESS_KEY=...
         export R2_PUBLIC_BASE_URL={STAGING_BASE_URL}

  5. Ladda upp det mellanlagrade:  set -a && . ~/.prikko-env && set +a
     python3 pipeline/hamta_gatubilder.py --ladda-upp

Nästa körning med variablerna satta skriver direkt till R2.
--------------------------------------------------------------------------------"""


def public_facing(types: Iterable[str]) -> bool:
    joined = " ".join(types or []).lower()
    return any(word in joined for word in PUBLIC_FACING)


#: site/.env, reservkällan för Mapillary-token. Se mapillary_token.
ENV_FILE = Path(__file__).resolve().parent.parent / "site" / ".env"


def mapillary_token() -> str:
    """Token ur miljön, annars ur site/.env.

    DEN TYSTA BUGGEN DET HÄR FINNS FÖR:

    Docstringen överst säger `set -a && . ~/.prikko-env && set +a`, och den
    raden fungerar inte för just den här variabeln. Mapillarys token har formen
    `MLY|<id>|<hemlighet>`, och lodstrecken är rörtecken för skalet. Utan
    citattecken runt värdet delar zsh raden i tre kommandon, skriver
    "command not found" om två av dem och sätter variabeln till ingenting.

    Utfallet var värre än ett fel: skriptet fortsatte, föll tillbaka på enbart
    Panoramax, och hämtade alltså bilder för de få procent av verksamheterna som
    Panoramax täcker inom trettio meter i stället för de 49,2 procent Mapillary
    täcker. Mätt 2026-08-13 på fyrtio verksamheter i Linköping: noll bilder med
    den sönderdelade tokenen, tjugo med den hela.

    Att läsa site/.env som reserv gör felet ofarligt oavsett hur miljön är
    satt. Samma väg in som matt_bildtackning.py redan använder.
    """
    value = os.environ.get("MAPILLARY_TOKEN", "").strip()
    if value:
        return value
    if not ENV_FILE.exists():
        return ""
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        if line.startswith("MAPILLARY_TOKEN="):
            return line.split("=", 1)[1].strip()
    return ""


# ---------------------------------------------------------------------------
# Supabase
# ---------------------------------------------------------------------------


class SupabaseError(RuntimeError):
    pass


class Supabase:
    """Minimal PostgREST-klient. Service-nyckeln går förbi radsäkerheten och
    bor bara i ~/.prikko-env — aldrig i klientkod och aldrig i repot."""

    PAGE = 1000

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

    def rows(self, table: str, query: str) -> list[dict]:
        out: list[dict] = []
        offset = 0
        while True:
            raw = self._request(
                "GET", f"{table}?{query}&order=id&limit={self.PAGE}&offset={offset}"
            )
            page = json.loads(raw) if raw else []
            out.extend(page)
            if len(page) < self.PAGE:
                return out
            offset += self.PAGE

    def insert_image(self, row: dict) -> None:
        self._request("POST", "images", [row], prefer="return=minimal")


# ---------------------------------------------------------------------------
# De två lägena
# ---------------------------------------------------------------------------


def from_file(path: Path) -> tuple[dict, str, list[dict]]:
    """Datafilen, kommunens slug och de rader som behöver en bild."""
    payload = json.loads(path.read_text(encoding="utf-8"))
    slug = (payload.get("municipality") or {}).get("slug") or path.stem
    wanted = [
        e
        for e in payload.get("establishments", [])
        if e.get("lat") is not None
        and e.get("lng") is not None
        and not e.get("image")
        and public_facing(e.get("types"))
    ]
    return payload, slug, wanted


def from_supabase(db: Supabase, municipality_code: Optional[str]) -> list[dict]:
    slugs = {
        m["code"]: m["slug"]
        for m in db.rows("municipalities", "select=code,slug&order=code")
    }
    query = "select=id,municipality_code,name,lat,lng,types&lat=not.is.null&lng=not.is.null"
    if municipality_code:
        query += f"&municipality_code=eq.{urllib.parse.quote(municipality_code)}"
    rows = db.rows("establishments", query)

    have = {img["establishment_id"] for img in db.rows("images", "select=establishment_id")}

    return [
        {**e, "municipality_slug": slugs.get(e["municipality_code"], "okand")}
        for e in rows
        if e["id"] not in have and public_facing(e.get("types"))
    ]


# ---------------------------------------------------------------------------


def build_store(args) -> tuple[Optional[object], bool]:
    """Lagringen, och om den bara är mellanlagrad.

    Andra värdet är sant när bilderna ligger på disk mot en adress som ännu
    inte svarar. Anroparen måste veta det: en URL som pekar på ingenting är
    värre i databasen än ingen URL alls.
    """
    if args.torr:
        return None, False
    if args.lokal:
        if not args.bas_url:
            raise SystemExit("--lokal kräver --bas-url, annars vet vi inte vad som ska sparas i databasen.")
        directory = Path(args.lokal).expanduser().resolve()
        if directory.is_relative_to(Path(__file__).resolve().parents[1] / "site"):
            raise SystemExit(
                "--lokal får inte peka in i site/. Bygget har 3 534 filers marginal "
                "mot Cloudflare Pages tak och bilderna ska ligga utanför det."
            )
        return imagestore.LocalStore(directory=directory, public_base_url=args.bas_url), False

    store = imagestore.from_env()
    if store is None:
        # Inte ett fel utan ett läge: ingen lagring alls är konfigurerad.
        # Hämtningen ska inte behöva vänta på det, så vi mellanlagrar lokalt
        # mot den adress bucketen ska få. Se STAGING_BANNER.
        print(STAGING_BANNER, file=sys.stderr)
        return imagestore.LocalStore(
            directory=STAGING_DIR, public_base_url=STAGING_BASE_URL
        ), True

    # Vilken lagring som valdes är inte en detalj: URL:en hamnar i databasen
    # och i datafilerna, och den som kör ska veta vilken adress bilderna får
    # innan några tusen rader skrivs. Se imagestore.from_env för ordningen.
    if isinstance(store, imagestore.SupabaseStore):
        print(
            "Lagring: Supabase Storage, hinken "
            f"{store.bucket}. R2 saknas i miljön ("
            + ", ".join(imagestore.missing_settings())
            + ").\nR2 är fortfarande målet, se pipeline/prikko/imagestore.py. "
            "Flytten dit är en\nkopiering plus en SQL-sats, eftersom nycklarna "
            "är desamma i båda lagringarna.",
            file=sys.stderr,
        )
    return store, False


_CONTENT_TYPES = {".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png"}


def upload_staged() -> int:
    """Ladda upp allt mellanlagrat till R2, med samma nycklar som lokalt.

    Körs en gång när bucketen väl finns. Nycklarna är deterministiska, så en
    omkörning skriver över samma objekt och katalogen kan ligga kvar som
    reservkopia.
    """
    store = imagestore.from_env()
    if store is None:
        missing = ", ".join(imagestore.missing_settings())
        raise SystemExit(
            "--ladda-upp kräver en konfigurerad lagring i miljön. Antingen "
            "SUPABASE_URL och\nSUPABASE_SERVICE_KEY, eller R2, där dessa "
            f"saknas: {missing}."
        )
    files = sorted(p for p in STAGING_DIR.rglob("*") if p.is_file())
    if not files:
        print(f"Ingenting att ladda upp i {STAGING_DIR}.", file=sys.stderr)
        return 0
    for i, path in enumerate(files, 1):
        key = path.relative_to(STAGING_DIR).as_posix()
        content_type = _CONTENT_TYPES.get(path.suffix.lower(), "image/jpeg")
        store.put(key, path.read_bytes(), content_type)
        if i % 100 == 0:
            print(f"  ... {i}/{len(files)}", file=sys.stderr)
    print(f"Laddade upp {len(files)} filer till R2.", file=sys.stderr)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fil", type=Path, help="datafil i site/src/data i stället för Supabase")
    parser.add_argument("--kommun", help="kommunkod, bara i Supabase-läge")
    parser.add_argument("--antal", type=int, default=0, help="ta högst så här många (0 = alla)")
    parser.add_argument("--torr", action="store_true", help="hämta ingenting, visa bara vad som skulle göras")
    parser.add_argument("--lokal", help="skriv till en katalog i stället för till R2")
    parser.add_argument("--bas-url", dest="bas_url", help="publik bas-URL för --lokal")
    parser.add_argument("--paus", type=float, default=POLITE_DELAY_S)
    parser.add_argument(
        "--mellanlagra",
        action="store_true",
        help="skriv URL:er som ännu inte svarar, för uppladdning direkt efteråt",
    )
    parser.add_argument(
        "--ladda-upp",
        dest="ladda_upp",
        action="store_true",
        help="ladda upp det lokalt mellanlagrade till R2 och avsluta",
    )
    args = parser.parse_args()

    if args.ladda_upp:
        return upload_staged()

    store, staged = build_store(args)

    # En URL som pekar på ingenting är värre än ingen bild alls: sidan får en
    # trasig bildruta med en söndrig ikon i, och det är precis det intryck vi
    # inte vill ge. Så länge bilderna bara ligger mellanlagrade på disk får de
    # alltså inte skrivas till något som bygger sajten, varken databasen eller
    # en datafil. Vill man ändå det, för att ladda upp direkt efteråt och
    # aldrig bygga däremellan, får man säga det rakt ut. Kontrollen står först
    # av allt: den ska kosta noll anrop att gå på.
    if staged and not args.mellanlagra:
        raise SystemExit(
            "Bilderna skulle mellanlagras lokalt mot " + STAGING_BASE_URL + ",\n"
            "som inte svarar förrän R2-hinken finns. Att skriva de URL:erna nu ger\n"
            "trasiga bildrutor på varje sida som får en bild.\n\n"
            "Sätt upp R2 enligt bannern ovan, eller kör --lokal med --bas-url för\n"
            "att prova hela kedjan utan att röra det som publiceras. Vet du vad du\n"
            "gör och tänker ladda upp direkt efteråt: lägg till --mellanlagra."
        )

    token = mapillary_token()
    if not token:
        print(
            "MAPILLARY_TOKEN saknas — bara Panoramax används, och den är mätt till\n"
            "9,8 procent inom 60 m, koncentrerad till Uppsala. Mapillary bär\n"
            "funktionen; token finns i site/.env och skapas annars gratis på\n"
            "mapillary.com → Settings → Developers.",
            file=sys.stderr,
        )

    db: Optional[Supabase] = None
    payload = None
    if args.fil:
        payload, slug, rows = from_file(args.fil)
        for row in rows:
            row["municipality_slug"] = slug
    else:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_KEY")
        if not url or not key:
            raise SystemExit("Sätt SUPABASE_URL och SUPABASE_SERVICE_KEY, eller kör med --fil.")
        db = Supabase(url, key)
        rows = from_supabase(db, args.kommun)

    if args.antal:
        rows = rows[: args.antal]

    print(f"{len(rows)} verksamheter utan bild, med koordinat och publikvänd typ.", file=sys.stderr)
    if args.torr:
        for row in rows[:20]:
            print(f"  {row['id']}  {row.get('name', '')}")
        print("Torrkörning: ingenting hämtades och ingenting skrevs.", file=sys.stderr)
        return 0

    found = 0
    failed = 0
    for i, row in enumerate(rows, 1):
        try:
            stored = capture(
                store,
                row["municipality_slug"],
                row["id"],
                float(row["lat"]),
                float(row["lng"]),
                token or None,
            )
        except Exception as exc:
            failed += 1
            print(f"  ! {row['id']}: {exc}", file=sys.stderr)
            time.sleep(2)
            continue

        if stored is not None:
            found += 1
            record = {
                "url": stored.url,
                "id": stored.source_id,
                "capturedAt": stored.captured_at,
                "source": stored.source,
                "licence": stored.licence,
                "attribution": stored.attribution,
            }
            if payload is not None:
                row["image"] = record
            if db is not None:
                db.insert_image(
                    {
                        "establishment_id": row["id"],
                        "url": stored.url,
                        "source": stored.source,
                        "source_id": stored.source_id,
                        "licence": stored.licence,
                        "attribution": stored.attribution,
                        "captured_at": stored.captured_at,
                        "position": 0,
                    }
                )

        if i % 50 == 0:
            print(f"  ... {i}/{len(rows)}, {found} bilder", file=sys.stderr)
        time.sleep(args.paus)

    if payload is not None and args.fil:
        # indent=1 är samma form som fetch_*.py skriver, så diffen mot
        # föregående version blir de rader som faktiskt ändrats.
        args.fil.write_text(
            json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8"
        )
        print(f"Skrev {args.fil}", file=sys.stderr)

    print(f"Klart: {found} bilder av {len(rows)} möjliga, {failed} fel.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
