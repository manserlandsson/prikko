#!/usr/bin/env python3
"""Registrera och exportera rörelsen i beståndet.

    # varje natt, FÖRE load_supabase.py
    python3 pipeline/rorelse.py registrera site/src/data/*.json

    # när sajten ska byggas
    python3 pipeline/rorelse.py exportera --out site/src/data/rorelse

## Varför den måste köras före inläsningen

Observationen finns bara i ögonblicket mellan två tillstånd. `load_supabase.py`
skriver över namnen, sätter `active = 0` på det som saknas och flyttar fram
`last_fetched_at`. Efter den körningen är gårdagens bestånd borta och
jämförelsen har ingenting att jämföra mot.

Skriptet vägrar därför att registrera en utlämning vars hämttidpunkt redan står
som kommunens `last_fetched_at`. Då har inläsningen redan gjorts och det som
skulle bli en jämförelse hade blivit en rad tomma nätter.

## Vad som INTE går att göra i efterhand

Det här är en logg och inte en vy. Historiken börjar den natt tabellerna sätts
upp. Frågan "vad öppnade i Stockholm i juni" har inget svar för juni om loggen
började i augusti, och den kan inte räknas fram ur något vi redan har:
`source_created_at` är null i de flesta källorna, och de checkade-in
ögonblicksbilderna i git är fyra dagars utvecklingsarbete och inte fyra dagars
utlämningar. Första körningen märks `seed` och publicerar ingenting.

Se pipeline/prikko/rorelse.py för klassningen och pipeline/schema_rorelse.sql
för tabellerna.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko.rorelse import (  # noqa: E402
    BULK,
    CONFIRM_ABSENCES,
    CONFIRM_DAYS,
    CONFIRM_SIGHTINGS,
    NEW,
    RENUMBERED,
    RETURNED,
    SEED,
    Record,
    _days,
    reconcile,
)
from prikko.sidbrytning import med_unik_ordning  # noqa: E402

# Spärren mot att avpublicera ett stort bortfall bor i load_supabase. Rörelsen
# måste dra samma gräns, annars säger sidan att fyrahundra verksamheter är
# borta samma natt som inläsningen bedömde att de fyrahundra var en trasig
# hämtning. Importen håller de två i takt; faller den läser vi hellre
# konservativt än tyst fel.
try:
    from load_supabase import MAX_MISSING_ROWS, MAX_MISSING_SHARE  # noqa: E402
except Exception:  # pragma: no cover
    MAX_MISSING_SHARE = 0.05
    MAX_MISSING_ROWS = 10

PAGE = 1000


class SupabaseError(RuntimeError):
    pass


class Supabase:
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
            detail = exc.read().decode("utf-8", "replace")[:500]
            raise SupabaseError(f"{method} {path} → {exc.code}: {detail}") from exc

    def select_all(self, table: str, query: str, unik: str = "id") -> list:
        """Hämta samtliga rader, sidvis. PostgREST stannar vid 1 000.

        Sorteringen på en unik nyckel gör sidbrytningen entydig. Utan den är
        radordningen odefinierad mellan anropen och listan blir tyst
        ofullständig, vilket fällde inläsningen 2026-08-19. Se
        pipeline/prikko/sidbrytning.py.

        Flera anropare sorterar redan på `observed_at`, där tusentals rader
        delar värde. Den ordningen behålls och får den unika nyckeln lagd
        sist, som avgörare inom grupperna.
        """
        rows: list = []
        query = med_unik_ordning(query, unik)
        while True:
            data = self._request("GET", f"{table}?{query}&limit={PAGE}&offset={len(rows)}")
            chunk = json.loads(data.decode("utf-8"))
            rows.extend(chunk)
            if len(chunk) < PAGE:
                return rows

    def insert(self, table: str, rows: list) -> None:
        for start in range(0, len(rows), 500):
            self._request(
                "POST", table, rows[start : start + 500], prefer="return=minimal"
            )

    def patch(self, table: str, query: str, patch: dict) -> None:
        self._request("PATCH", f"{table}?{query}", patch, prefer="return=minimal")


# ---------------------------------------------------------------------------
# Registrering
# ---------------------------------------------------------------------------

def register(path: Path, client: Supabase, deferred: Optional[list] = None) -> None:
    """Jämför en utlämning mot förra körningen och logga rörelsen.

    ## Varför `deferred` finns

    Registreringen MÅSTE köras före `load_supabase.py`, annars jämförs
    utlämningen med sig själv och svaret blir noll nya i all evighet. Det står
    utskrivet nedan och skriptet vägrar om ordningen kastas om.

    Men `establishment_spells.establishment_id` pekar med en främmande nyckel
    på `establishments.id`, och en verksamhet som är NY har ingen rad där
    förrän inläsningen har körts. Sviten för en ny verksamhet går alltså inte
    att skriva vid den tidpunkt den räknas fram. Nattjobbet föll på just det
    varje natt i tolv nätter: `POST establishment_spells → 409 23503, Key
    (establishment_id)=(...) is not present in table`.

    De två kraven går inte att uppfylla i samma steg, och därför delas skrivet.
    Får funktionen en lista i `deferred` samlas sviterna där i stället för att
    skrivas, och `skriv_sviter()` lägger in dem efter inläsningen. Allt annat
    skrivs som förut: avslutade sviter pekar på rader som redan finns, och
    utlämningsraden har ingen sådan koppling alls.
    """
    payload = json.loads(path.read_text(encoding="utf-8"))
    municipality = payload["municipality"]
    code = municipality["code"]
    observed_at = (payload.get("source") or {}).get("fetchedAt")

    if not observed_at:
        print(f"{municipality['name']}: utlämningen saknar fetchedAt, hoppas över", file=sys.stderr)
        return

    print(f"{municipality['name']}: {len(payload['establishments'])} anläggningar", file=sys.stderr)

    quoted = urllib.parse.quote(code)

    # Redan registrerad? Då är det en omkörning mot samma utlämning, och den
    # ska inte räknas som en natt till. Kravet på antal utlämningar innan en
    # frånvaro bekräftas hade annars gått att uppfylla med tre omkörningar av
    # samma fil på en förmiddag.
    seen = client.select_all(
        "roster_deliveries",
        f"select=observed_at&municipality_code=eq.{quoted}&order=observed_at.desc",
    )
    if any(row["observed_at"] == observed_at for row in seen):
        print("  utlämningen är redan registrerad, ingenting görs", file=sys.stderr)
        return

    # Har inläsningen redan körts mot den här filen står jämförelsen mot sig
    # själv. Det ger noll nya och noll borta i all evighet, tyst.
    loaded = client.select_all(
        "municipalities", f"select=last_fetched_at&code=eq.{quoted}", unik="code"
    )
    if loaded and loaded[0].get("last_fetched_at") == observed_at:
        sys.exit(
            f"  {code}: load_supabase.py har redan läst in {observed_at}.\n"
            "  Rörelsen måste registreras FÖRE inläsningen, annars jämförs\n"
            "  utlämningen med sig själv. Den här natten går inte att rädda;\n"
            "  ändra ordningen i körningen så att nästa blir rätt."
        )

    previous_rows = [
        row
        for row in client.select_all(
            "establishments",
            f"select=id,name,street_address,lat,lng,active&municipality_code=eq.{quoted}",
        )
        # Samma filter som deactivate_missing gör: `active=neq.0` i PostgREST
        # hade tappat raderna där kolumnen är NULL.
        if row.get("active") != 0
    ]

    # Vilka rader som ALDRIG burit en kontroll.
    #
    # Läses ur bedömningarna och inte ur inspektionstabellen: `assessments` har
    # en rad per anläggning och `reason = 'no_inspections'` betyder precis det
    # vi frågar efter, medan en räkning över inspections hade dragit 68 000
    # rader för att svara på samma sak.
    uncontrolled = {
        row["establishment_id"]
        for row in client.select_all(
            "assessments",
            "select=establishment_id,reason&reason=eq.no_inspections",
            unik="establishment_id",
        )
    }

    previous = [
        Record(
            r["id"],
            r["name"],
            r.get("street_address"),
            r.get("lat"),
            r.get("lng"),
            controlled=r["id"] not in uncontrolled,
        )
        for r in previous_rows
    ]
    delivered = [
        Record(
            e["id"],
            e["name"],
            e.get("address"),
            e.get("lat"),
            e.get("lng"),
            controlled=bool(e.get("inspections")),
        )
        for e in payload["establishments"]
    ]

    days_since = _days(observed_at, seen[0]["observed_at"]) if seen else None
    baseline = [
        row["appeared"]
        for row in client.select_all(
            "roster_deliveries",
            f"select=appeared,kind&municipality_code=eq.{quoted}"
            "&kind=eq.normal&order=observed_at.desc",
        )
    ][:20]

    delivered_ids = {r.id for r in delivered}
    missing = [r for r in previous if r.id not in delivered_ids]
    limit = max(MAX_MISSING_ROWS, int(len(previous) * MAX_MISSING_SHARE))
    missing_suppressed = len(missing) > limit

    delivery = reconcile(
        code,
        previous,
        delivered,
        observed_at=observed_at,
        days_since=days_since,
        baseline=baseline,
        first_delivery=not seen,
        missing_suppressed=missing_suppressed,
    )

    # En rad som varit borta och kommit tillbaka är inte ny. Den pure modulen
    # ser bara gårdagen; att skilja "aldrig setts" från "setts förut" kräver
    # hela loggen, och den frågan ställs här.
    arrived_ids = [a.id for a in delivery.appeared]
    known = set()
    for start in range(0, len(arrived_ids), 100):
        chunk = arrived_ids[start : start + 100]
        if not chunk:
            continue
        joined = ",".join(f'"{i}"' for i in chunk)
        known.update(
            row["establishment_id"]
            for row in client.select_all(
                "establishment_spells",
                f"select=establishment_id&establishment_id=in.({joined})",
            )
        )

    spells = []
    renumbered = 0
    for appearance in delivery.appeared:
        kind = appearance.kind
        if kind in (RENUMBERED, "succession"):
            renumbered += 1
        elif kind == NEW and appearance.id in known:
            kind = RETURNED
        spells.append(
            {
                "establishment_id": appearance.id,
                "municipality_code": code,
                "appeared_at": observed_at,
                "appearance": kind,
                "counterpart_id": appearance.counterpart,
            }
        )

    if spells:
        if deferred is None:
            client.insert("establishment_spells", spells)
        else:
            deferred.extend(spells)

    closed = 0
    for departure in delivery.departed:
        ident = urllib.parse.quote(departure.id)
        client.patch(
            "establishment_spells",
            f"establishment_id=eq.{ident}&gone_at=is.null",
            {
                "gone_at": observed_at,
                "disappearance": departure.kind,
                "counterpart_id": departure.counterpart,
            },
        )
        closed += 1

    client.insert(
        "roster_deliveries",
        [
            {
                "municipality_code": code,
                "observed_at": observed_at,
                "kind": delivery.kind,
                "delivered": delivery.delivered,
                "live_before": delivery.live_before,
                "appeared": delivery.new_count,
                "departed": len(delivery.publishable_out),
                "renumbered": renumbered,
                "days_since": round(days_since, 3) if days_since is not None else None,
                "bulk_limit": delivery.limit,
            }
        ],
    )

    if delivery.kind == SEED:
        print(
            f"  första utlämningen: {len(spells)} anläggningar loggade som utgångsläge.\n"
            "  Ingenting av det publiceras. Rörelsen räknas från nästa körning.",
            file=sys.stderr,
        )
        return

    if delivery.kind == BULK:
        print(
            f"  OMLÄGGNING: {delivery.new_count} nya id, gränsen gick vid {delivery.limit}.\n"
            "  Så många registrerar kommunen inte på en natt. Raderna sparas med\n"
            "  sitt datum men publiceras inte som nya. Kontrollera om kommunen\n"
            "  bytt verksamhetssystem eller lagt om sin id-serie.",
            file=sys.stderr,
        )
        if os.environ.get("GITHUB_ACTIONS"):
            print(
                f"::warning title=Omläggning::{delivery.new_count} nya id i {code} "
                f"på en utlämning, gränsen gick vid {delivery.limit}."
            )

    if missing_suppressed:
        print(
            f"  {len(missing)} saknade rader ligger över avpubliceringsspärren och\n"
            "  registreras inte som borta.",
            file=sys.stderr,
        )

    print(
        f"  {len(delivery.publishable_in)} nya, {len(delivery.publishable_out)} borta, "
        f"{renumbered} id-byten, {closed} sviter avslutade",
        file=sys.stderr,
    )


def skriv_sviter(path: Path, client: Supabase) -> None:
    """Lägg in de uppskjutna sviterna, efter att inläsningen har körts.

    Andra halvan av delningen som `register()` förklarar. Filen skrivs av
    `registrera --sviter-till` och läses här; den innehåller färdiga rader och
    ingen logik, så ingenting räknas om och ingenting kan glida isär mellan de
    två stegen.

    Filen tas bort när raderna är inne. Ligger den kvar betyder det att steget
    inte kom fram, och nästa körning ska inte skriva gårdagens sviter en gång
    till.
    """
    if not path.exists():
        print(f"{path} finns inte, inga uppskjutna sviter att skriva.", file=sys.stderr)
        return

    spells = json.loads(path.read_text(encoding="utf-8"))
    if not spells:
        print("Inga uppskjutna sviter.", file=sys.stderr)
        path.unlink()
        return

    """
    Rader som redan har en pågående svit hoppas över.

    `establishment_spells_open_idx` tillåter högst en öppen svit per id, och
    schemat förklarar varför: utan spärren kan en avbruten körning lägga en
    andra öppen svit på samma rad och dubblera verksamheten på sidan.

    Men samma spärr gör att en OMKÖRNING faller. Går en natt sönder mellan
    registreringen och den här skrivningen, som hände 2026-08-14, så räknas
    samma rader fram igen nästa gång och stöter på sviten som redan finns.
    Steget föll då på 409 23505 och tog hela nattens data med sig.

    En svit som redan är öppen ÄR redan registrerad. Att skriva den igen är
    ingenting att göra, inte ett fel. Filtret gör steget idempotent, vilket det
    måste vara eftersom det per konstruktion kan köras om.
    """
    öppna = set()
    ids = [rad["establishment_id"] for rad in spells]
    for start in range(0, len(ids), 100):
        chunk = ids[start : start + 100]
        joined = ",".join(f'"{i}"' for i in chunk)
        öppna.update(
            rad["establishment_id"]
            for rad in client.select_all(
                "establishment_spells",
                f"select=establishment_id&gone_at=is.null&establishment_id=in.({joined})",
            )
        )

    nya = [rad for rad in spells if rad["establishment_id"] not in öppna]
    if len(nya) < len(spells):
        print(
            f"{len(spells) - len(nya)} sviter fanns redan öppna och hoppas över.",
            file=sys.stderr,
        )

    # Hundra åt gången, samma styckning som registreringen använder för sina
    # frågor. PostgREST tar större poster, men ett fel på rad 4 000 av 9 000
    # säger mindre än ett fel på rad 40 av 100.
    for start in range(0, len(nya), 100):
        client.insert("establishment_spells", nya[start : start + 100])

    print(f"{len(nya)} uppskjutna sviter skrivna.", file=sys.stderr)
    path.unlink()


# ---------------------------------------------------------------------------
# Export till sajten
# ---------------------------------------------------------------------------

def export(client: Supabase, out_dir: Path) -> None:
    """Skriv en fil per kommun med de händelser sidan får visa.

    Namn och adress följer med i filen i stället för att slås upp i kommunens
    egen datafil. En borttagen verksamhet har `active = 0` och finns därför
    inte i exporten sajten bygger på: utan namnet här hade sidan som säger att
    den är borta inte kunnat nämna den vid namn.
    """
    # roster_events är en VY och har ingen primärnyckel. Den blir entydig
    # först på de tre kolumnerna tillsammans.
    events = client.select_all(
        "roster_events",
        "select=*&order=observed_on.desc",
        unik="establishment_id,kind,observed_on",
    )
    deliveries = client.select_all(
        "roster_deliveries", "select=municipality_code,observed_at,kind&order=observed_at"
    )
    municipalities = client.select_all(
        "municipalities", "select=code,slug,name,city&order=code", unik="code"
    )

    runs = defaultdict(list)
    for row in deliveries:
        runs[row["municipality_code"]].append(row)

    by_slug = defaultdict(list)
    for row in events:
        by_slug[row["municipality_slug"]].append(row)

    out_dir.mkdir(parents=True, exist_ok=True)
    written = 0

    for municipality in municipalities:
        slug = municipality["slug"]
        history = runs.get(municipality["code"], [])
        rows = by_slug.get(slug, [])

        payload = {
            "municipality": {"slug": slug, "city": municipality["city"]},
            # Sedan när loggen alls har något att säga. Sidan visar aldrig en
            # period vi inte observerat.
            "observedFrom": history[0]["observed_at"] if history else None,
            "observedTo": history[-1]["observed_at"] if history else None,
            "deliveries": len(history),
            "confirm": {
                "sightings": CONFIRM_SIGHTINGS,
                "absences": CONFIRM_ABSENCES,
                "days": CONFIRM_DAYS,
            },
            "events": [
                {
                    "kind": row["kind"],
                    "on": row["observed_on"],
                    "slug": row["slug"],
                    "name": row["name"],
                    "address": row.get("street_address"),
                }
                for row in rows
            ],
        }

        path = out_dir / f"{slug}.json"
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
        written += 1
        print(f"  {path}  {len(rows)} händelser ur {len(history)} utlämningar", file=sys.stderr)

    print(f"\n{written} filer skrivna.", file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    reg = sub.add_parser("registrera", help="jämför en utlämning mot förra körningen")
    reg.add_argument("files", nargs="+", type=Path)
    reg.add_argument(
        "--sviter-till",
        type=Path,
        metavar="FIL",
        help=(
            "skriv inte de nya sviterna nu, lägg dem i FIL. Kör "
            "'rorelse.py sviter FIL' efter load_supabase.py. Krävs i nattjobbet: "
            "en ny verksamhet har ingen rad i establishments förrän inläsningen "
            "har körts, och den främmande nyckeln fäller skrivningen."
        ),
    )

    sv = sub.add_parser("sviter", help="skriv de uppskjutna sviterna efter inläsningen")
    sv.add_argument("file", type=Path)

    exp = sub.add_parser("exportera", help="skriv sajtens datafiler")
    exp.add_argument("--out", type=Path, default=Path("site/src/data/rorelse"))

    args = parser.parse_args()

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        sys.exit(
            "Saknar SUPABASE_URL eller SUPABASE_SERVICE_KEY.\n"
            "service_role-nyckeln ger full skrivåtkomst — håll den utanför repot."
        )

    client = Supabase(url, key)

    if args.command == "registrera":
        deferred: Optional[list] = [] if args.sviter_till else None
        failed = []
        for path in args.files:
            try:
                register(path, client, deferred)
            except SystemExit:
                raise
            except Exception as exc:
                failed.append(path)
                print(f"\nFEL vid {path}: {exc}", file=sys.stderr)

        # Skrivs ÄVEN om någon fil fallerade. De kommuner som gick igenom har
        # fått sin utlämningsrad, och deras sviter hör ihop med den. Att kasta
        # dem för att en annan kommuns webbplats låg nere vore att förlora
        # rörelse vi faktiskt har observerat.
        if deferred is not None:
            args.sviter_till.parent.mkdir(parents=True, exist_ok=True)
            args.sviter_till.write_text(
                json.dumps(deferred, ensure_ascii=False), encoding="utf-8"
            )
            print(
                f"\n{len(deferred)} sviter uppskjutna till {args.sviter_till}.\n"
                f"Kör 'rorelse.py sviter {args.sviter_till}' EFTER load_supabase.py.",
                file=sys.stderr,
            )

        if failed:
            sys.exit(f"\n{len(failed)} av {len(args.files)} filer misslyckades.")
    elif args.command == "sviter":
        skriv_sviter(args.file, client)
    else:
        export(client, args.out)

    print("\nKlart.", file=sys.stderr)


if __name__ == "__main__":
    main()
