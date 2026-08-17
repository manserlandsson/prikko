#!/usr/bin/env python3
"""Ladda normaliserad kommundata till Supabase.

Tar en fil skriven av valfri fetch_*.py och skriver in den. Ingenting här är
kommunspecifikt — filens `municipality`-block styr allt.

    export SUPABASE_URL=https://xxxx.supabase.co
    export SUPABASE_SERVICE_KEY=eyJ...
    python3 pipeline/load_supabase.py site/src/data/stockholm.json

Skriver via PostgREST med service_role-nyckeln, som går förbi radsäkerheten.
Den nyckeln får ALDRIG hamna i klientkod eller i repot — den ger full
skrivåtkomst till hela databasen.

Upsert, inte insert: körningen är idempotent och kan göras om utan att
duplicera. Inspektioner och kontrollområden ersätts per anläggning, så att
borttagna poster hos kommunen också försvinner hos oss.

Två regler avgör vad som händer med en anläggning mellan två nätter, och båda
finns för att sluggen är sidans publicerade adress:

* En slug byter aldrig verksamhet. Ett id som redan står i databasen behåller
  sin slug oavsett vad utlämningen föreslår. Se reconcile_slugs.
* En anläggning som slutat lämnas ut avpubliceras med `active = 0`, aldrig
  genom radering, och håller sin slug reserverad. Se deactivate_missing.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import traceback
import urllib.error
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path
from typing import Iterable

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko.dates import clamp_future_inspections, log_clamped  # noqa: E402

BATCH = 500

#: Så stor andel av kommunens publicerade bestånd får saknas i en utlämning
#: innan bortfallet bedöms som ett hämtningsfel i stället för verkliga
#: nedläggningar. Fem procent av Stockholm är 425 verksamheter på en natt.
#: Så mycket stänger inte en stad, men så mycket tappar en hämtning som
#: missar några rutor i rutnätet, och den skillnaden får inte avpubliceras
#: i tysthet.
MAX_MISSING_SHARE = 0.05

#: Golv i antal, så att en liten kommun inte fastnar i spärren. Fem procent
#: av Svenljungas 99 verksamheter är fyra rader, och fyra nedlagda kaféer i
#: en kommun är fullt möjligt, särskilt efter ett uppehåll mellan körningar.
MAX_MISSING_ROWS = 10


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

    def has_column(self, table: str, column: str) -> bool:
        """Finns kolumnen? PostgREST svarar 400 när den inte gör det.

        Schemat lever i schema.sql och körs för hand i Supabase SQL Editor.
        Pipelinen ska därför inte krascha mot en databas som ännu inte fått
        senaste migreringen — den ska skriva det den kan och säga vad som
        saknas.
        """
        try:
            self._request("GET", f"{table}?select={column}&limit=1")
            return True
        except SupabaseError:
            return False

    def upsert(self, table: str, rows: list, on_conflict: str) -> None:
        """Upsert i portionsvis storlek. Tomma listor hoppas över.

        Rader med samma konfliktnyckel slås ihop innan de skickas, med den
        SISTA av dem som vinnare. Postgres vägrar nämligen `ON CONFLICT DO
        UPDATE` när samma rad skulle träffas två gånger i ETT kommando:

            21000: ON CONFLICT DO UPDATE command cannot affect row a second time

        Det är precis vad som fällde den nattliga körningen 2026-08-03.
        Linköpings API returnerar samma tillsynsId två gånger för en del
        anläggningar, och adaptern skickade båda vidare.

        Felet är lömskt för att det är INTERMITTENT. Hamnar de två raderna i
        olika portioner går det igenom, och det hade det gjort i veckor. Det
        smäller först den natt de råkar landa i samma portion.

        Sammanslagningen här ersätter inte att adaptern ska lämna rena data.
        Den finns för att en enda kommuns trasiga id aldrig ska stoppa
        inläsningen av de elva andra.

        ## RADER UTAN KONFLIKTNYCKEL SLÅS ALDRIG IHOP

        En rad som inte bär nyckeln kan omöjligt krocka med en annan: databasen
        sätter nyckeln vid inläggningen. control_areas har `id bigserial` och
        skickas utan id, alltså saknade VARJE rad nyckeln, och den första
        versionen av sammanslagningen här läste `row.get("id")` till None för
        allihop och lade dem i samma fack. Kvar blev en enda rad per kommun och
        körning.

        Så försvann 103 000 kontrollområden natten till 2026-08-07: Örebros
        33 498 punkter blev 1, Linköpings 52 571 blev 1, Stockholms 16 312 blev
        1. Kontrollområdena är det som svarar på vad en anmärkning gällde, och
        sajten stod utan dem i ett dygn utan att något larmade. Kaskaden från
        `delete_where_in("inspections", ...)` hade redan tömt tabellen, så
        gårdagens rader fanns inte kvar att falla tillbaka på.
        """
        if not rows:
            return

        keys = [k.strip() for k in on_conflict.split(",")]
        keyed, unkeyed = [], []
        for row in rows:
            (keyed if all(row.get(k) is not None for k in keys) else unkeyed).append(row)

        merged: dict = {}
        for row in keyed:
            merged[tuple(row[k] for k in keys)] = row
        if len(merged) != len(keyed):
            print(
                f"  ! {len(keyed) - len(merged)} rader i {table} delade "
                f"konfliktnyckel ({on_conflict}) och slogs ihop",
                file=sys.stderr,
            )
        rows = list(merged.values()) + unkeyed

        query = urllib.parse.urlencode({"on_conflict": on_conflict})
        for start in range(0, len(rows), BATCH):
            chunk = rows[start : start + BATCH]
            self._request(
                "POST",
                f"{table}?{query}",
                chunk,
                prefer="resolution=merge-duplicates,return=minimal",
            )

    def select_all(self, table: str, query: str) -> list:
        """Hämta samtliga rader för en fråga, sidvis.

        PostgREST returnerar högst 1 000 rader per svar. Utan sidbrytning
        hade en namnjämförelse i Stockholm tyst tappat 7 500 av 8 511
        anläggningar och därmed missat exakt de byten den finns för.
        """
        rows: list = []
        page = 1000
        while True:
            start = len(rows)
            data = self._request(
                "GET",
                f"{table}?{query}&limit={page}&offset={start}",
            )
            chunk = json.loads(data.decode("utf-8"))
            rows.extend(chunk)
            if len(chunk) < page:
                return rows

    def delete_where_in(self, table: str, column: str, values: Iterable[str]) -> None:
        """Rensa rader vars förälder vi är på väg att skriva om."""
        values = list(values)
        for start in range(0, len(values), 100):
            chunk = values[start : start + 100]
            quoted = ",".join(f'"{v}"' for v in chunk)
            query = urllib.parse.urlencode({column: f"in.({quoted})"})
            self._request("DELETE", f"{table}?{query}", prefer="return=minimal")

    def update_where_in(
        self, table: str, column: str, values: Iterable[str], patch: dict
    ) -> None:
        """Sätt samma fält på en känd mängd rader.

        Skilt från upsert med avsikt: här ändras enstaka kolumner på rader vi
        INTE har någon färsk utlämning för. En upsert hade behövt hitta på
        värden för allt det andra.
        """
        values = list(values)
        for start in range(0, len(values), 100):
            chunk = values[start : start + 100]
            quoted = ",".join(f'"{v}"' for v in chunk)
            query = urllib.parse.urlencode({column: f"in.({quoted})"})
            self._request("PATCH", f"{table}?{query}", patch, prefer="return=minimal")


def reconcile_slugs(
    client: Supabase,
    municipality_code: str,
    establishments: list,
) -> list:
    """Lås varje anläggning vid den slug den redan är publicerad på.

    Sluggen sätts av fetch_*.py med `dedupe_slugs`, som numrerar kollisioner i
    den ordning källan råkar leverera dem. Ordningen är inte stabil. Stockholm
    hämtas i ett rutnät och två likanämnda verksamheter kan byta plats mellan
    två nätter, och då byter också "namnet" och "namnet-2" ägare.

    Det gav den nattliga körningen två fel på en gång.

    Det synliga: upserten går på `id` medan unikheten gäller
    (municipality_code, slug). Byter två rader slug med varandra försöker den
    ena skriva en slug som den andra fortfarande håller, och Postgres svarar
    23505. Stockholm föll på det tre nätter i rad, och eftersom load() reste
    felet vidare stannade även de kommuner som låg efter i filordningen.

    Det allvarligare: sluggen ÄR sidans adress. Flyttas den från en verksamhet
    till en annan pekar varje bokmärke, varje inlänk och varje notismejl
    plötsligt på fel lokal. En gammal slug som leder till 404 är ett känt och
    accepterat utfall, se community.notices i schema_community.sql. En gammal
    slug som leder till någon ANNAN verksamhet är det inte.

    Regeln här är därför enkel: ett id som redan finns i databasen behåller
    sin slug, för alltid. Nya id får sin naturliga slug, ledig både mot
    databasen och mot varandra. Ingen slug byter någonsin ägare.

    Att sluggen då kan bära ett namn lokalen inte längre använder är avsiktligt
    och följer projektets linje: kontrollhistoriken hänger på lokalen och inte
    på företaget, alltså är sidan lokalens sida även när skylten byts. Sidan
    visar det aktuella namnet; adressen står stilla.

    Måste anropas FÖRE upserten av establishments. Ändrar listan på plats och
    returnerar de flyttförsök som stoppades, som (id, önskad slug, behållen).
    """
    known = {
        row["id"]: row["slug"]
        for row in client.select_all(
            "establishments",
            f"select=id,slug&municipality_code=eq.{urllib.parse.quote(municipality_code)}",
        )
    }

    # Varje slug kommunen någonsin fått är upptagen, även de som hör till
    # rader som inte längre lämnas ut. Frigörs en slug kan nästa körning ge
    # den till en annan verksamhet, vilket är precis det vi bygger bort.
    taken = set(known.values())

    blocked = []
    for e in establishments:
        published = known.get(e["id"])
        if published is None:
            continue
        if published != e["slug"]:
            blocked.append((e["id"], e["slug"], published))
        e["slug"] = published

    for e in establishments:
        if e["id"] in known:
            continue
        base = e["slug"]
        candidate = base
        suffix = 1
        # Samma uppräkning som dedupe_slugs, men mot hela kommunens bestånd
        # och inte bara mot den här utlämningen.
        while candidate in taken:
            suffix += 1
            candidate = f"{base}-{suffix}"
        taken.add(candidate)
        e["slug"] = candidate

    if blocked:
        print(
            f"  {len(blocked)} slug(ar) ville byta verksamhet och behölls där de\n"
            "  redan är publicerade:",
            file=sys.stderr,
        )
        for eid, wanted, kept in blocked[:20]:
            print(f"    {eid}: {wanted!r} avvisad, behåller {kept!r}", file=sys.stderr)
        if len(blocked) > 20:
            print(f"    ... och {len(blocked) - 20} till", file=sys.stderr)

    return blocked


def deactivate_missing(
    client: Supabase,
    municipality_code: str,
    establishments: list,
) -> list:
    """Avpublicera de anläggningar kommunen slutat lämna ut.

    Tidigare skrevs `active = 2` på allt som kom in och ingenting satte någonsin
    något annat. En verksamhet som kommunen tagit bort ur sitt register låg
    därför kvar som publicerad i all evighet, med en kontrollhistorik som
    aldrig mer uppdaterades och inget som sade det.

    Rader tas INTE bort. Radering hade kaskaderat ner i inspektioner,
    kontrollområden och företagsytans kopplingar, och dessutom frigjort
    sluggen så att nästa körning kunde ge den till någon annan. `active = 0`
    lyfter raden ur `publishable_establishments`, behåller historiken och
    håller adressen reserverad. Dyker verksamheten upp igen skriver nästa
    upsert tillbaka `active = 2` av sig själv.

    Spärren finns för att bortfall nästan alltid är vårt fel och inte
    kommunens. Stockholms hämtning hoppar tyst över en ruta i rutnätet som
    svarar med fel, och ett sådant hål får aldrig avpublicera hundratals
    verksamheter i tysthet. Slår spärren till avpubliceras ingenting alls och
    körningen säger varför.

    Anropas EFTER upserten, så att allt i utlämningen redan står som aktivt.
    Returnerar de id som avpublicerades.
    """
    # NULL räknas som publicerad, precis som vyn publishable_establishments
    # gör med sin coalesce(active, 2). Filtret sitter därför här och inte i
    # frågan: `active=neq.0` i PostgREST hade tappat NULL-raderna och lämnat
    # dem publicerade för alltid.
    live = {
        row["id"]
        for row in client.select_all(
            "establishments",
            f"select=id,active&municipality_code=eq.{urllib.parse.quote(municipality_code)}",
        )
        if row.get("active") != 0
    }

    delivered = {e["id"] for e in establishments}
    missing = sorted(live - delivered)
    if not missing:
        return []

    limit = max(MAX_MISSING_ROWS, int(len(live) * MAX_MISSING_SHARE))
    if len(missing) > limit:
        print(
            f"  VARNING: {len(missing)} av {len(live)} publicerade anläggningar\n"
            f"  saknas i utlämningen, mer än spärren på {limit}. Ingen avpubliceras.\n"
            "  Ett bortfall den storleken är nästan alltid en trasig hämtning,\n"
            "  inte lika många nedlagda verksamheter. Kontrollera källan.",
            file=sys.stderr,
        )
        if os.environ.get("GITHUB_ACTIONS"):
            print(
                f"::warning title=Stort bortfall::{len(missing)} av {len(live)} "
                f"anläggningar i {municipality_code} saknas i utlämningen. "
                "Ingen avpublicerades."
            )
        return []

    client.update_where_in("establishments", "id", missing, {"active": 0})
    print(
        f"  {len(missing)} anläggning(ar) saknas i utlämningen och avpubliceras\n"
        "  (raden och historiken ligger kvar, sluggen förblir reserverad):",
        file=sys.stderr,
    )
    for eid in missing[:20]:
        print(f"    {eid}", file=sys.stderr)
    if len(missing) > 20:
        print(f"    ... och {len(missing) - 20} till", file=sys.stderr)

    return missing


def record_names(
    client: Supabase,
    municipality_code: str,
    establishments: list,
    fetched_at: str | None,
) -> tuple[list, list]:
    """Hitta namnbyten och förbered namnhistoriken. Skriver den INTE.

    Kommunernas kontroller hänger på ANLÄGGNINGEN, alltså lokalen, inte på
    företaget. Tar en ny restaurang över en adress ärver den föregångarens hela
    kontrollhistorik, och ingen av källorna säger att bytet skett. Stockholms
    `date` är null och det finns inget fält för verksamhetens start.

    Ett byte går ändå att se över tid, eftersom vi kör mot samma anläggnings-id
    varje natt: byter NAMNET på ett id har verksamheten sannolikt bytt.

    ## Varför funktionen inte skriver, trots namnet

    Två krav drar åt var sitt håll och de går inte att uppfylla i samma steg.

    Jämförelsen måste ske FÖRE upserten av `establishments`. Efteråt är det
    gamla namnet överskrivet och bytet osynligt.

    Men `establishment_names.establishment_id` pekar med en främmande nyckel på
    `establishments.id`, och en NY anläggning har ingen sådan rad förrän
    upserten har körts. Skrivningen föll därför på `409 23503, Key
    (establishment_id) is not present in table "establishments"`, och sex av
    tio kommuner tappades i varje körning. Felet var maskerat i tolv nätter
    bakom rörelsesteget, som föll på exakt samma sätt en tabell tidigare och
    dödade körningen innan den hann hit.

    Funktionen räknar alltså fram raderna och lämnar tillbaka dem. Anroparen
    skriver dem efter upserten. Samma delning som `rorelse.py` gör för
    `establishment_spells`, av samma skäl.

    Returnerar (byten, namnrader). Byten är (id, gammalt namn, nytt namn).
    """
    known = {
        row["id"]: row["name"]
        for row in client.select_all(
            "establishments",
            f"select=id,name&municipality_code=eq.{urllib.parse.quote(municipality_code)}",
        )
    }

    changes = []
    for e in establishments:
        previous = known.get(e["id"])
        # Okänt id = ny anläggning hos kommunen, inte ett byte. Att larma på
        # den hade dränkt de verkliga bytena i brus.
        if previous is not None and previous != e["name"]:
            changes.append((e["id"], previous, e["name"]))

    # Loggen skrivs oavsett om något bytts: `last_seen_at` ska betyda "senast
    # sedd", och `first_seen_at` sätts av kolumnens default bara vid insert.
    # Skickas first_seen_at med i nyttolasten skriver PostgREST över den vid
    # varje körning och hela poängen med tabellen går förlorad.
    namnrader = [
        {
            "establishment_id": e["id"],
            "name": e["name"],
            "last_seen_at": fetched_at,
        }
        for e in establishments
    ]

    if changes:
        print(
            f"  NAMNBYTE på {len(changes)} anläggning(ar). Kontrollhistoriken på\n"
            "  dessa id:n spänner sannolikt över mer än en verksamhet:",
            file=sys.stderr,
        )
        for eid, before, after in changes[:20]:
            print(f"    {eid}: {before!r} -> {after!r}", file=sys.stderr)
        if len(changes) > 20:
            print(f"    ... och {len(changes) - 20} till", file=sys.stderr)
        if os.environ.get("GITHUB_ACTIONS"):
            print(
                f"::warning title=Namnbyte upptäckt::{len(changes)} anläggningar "
                f"i {municipality_code} har bytt namn sedan förra körningen."
            )

    return changes, namnrader


def load(path: Path, client: Supabase, geo_only: bool = False) -> None:
    payload = json.loads(path.read_text(encoding="utf-8"))
    municipality = payload["municipality"]
    source = payload.get("source", {})
    establishments = payload["establishments"]

    print(f"{municipality['name']}: {len(establishments)} anläggningar", file=sys.stderr)

    # FÖRE allt annat: ett kontrolldatum i framtiden får inte nå databasen, och
    # därmed inte sajtens ögonblicksbild eller sitemapens lastmod. Det här är
    # den enda inläsning alla tolv kommuner passerar, så regeln behöver bara
    # stå på ett ställe. Motiveringen bor i prikko/dates.py.
    log_clamped(clamp_future_inspections(establishments, date.today()))

    client.upsert(
        "municipalities",
        [
            {
                "code": municipality["code"],
                "name": municipality["name"],
                "city": municipality["city"],
                "slug": municipality["slug"],
                "source_type": municipality.get("sourceType", "reverse_engineered"),
                "source_url": source.get("url"),
                "adapter": municipality.get("adapter", municipality["slug"]),
                "last_fetched_at": source.get("fetchedAt"),
            }
        ],
        on_conflict="code",
    )

    # Härledda koordinater bär sitt ursprung med sig. Kolumnerna kom till i en
    # senare migrering; mot en databas utan dem skriver vi resten ändå.
    geo_marked = client.has_column("establishments", "geo_source")
    if not geo_marked and any(e.get("geoSource") for e in establishments):
        print(
            "  VARNING: establishments saknar geo_source/geo_precision.\n"
            "  Kör om pipeline/schema.sql i Supabase SQL Editor, annars kan sidan\n"
            "  inte skilja en härledd koordinat från kommunens egen.",
            file=sys.stderr,
        )

    # FÖRE upserten: sluggen ska vara den redan publicerade, inte den källans
    # ordning råkade ge i natt. Se reconcile_slugs för varför.
    reconcile_slugs(client, municipality["code"], establishments)

    establishment_rows = []
    for e in establishments:
        row = {
            "id": e["id"],
            "municipality_code": municipality["code"],
            "id_local": e["id"].rsplit("-", 1)[-1],
            "name": e["name"],
            "types": e.get("types") or [],
            "street_address": e.get("address"),
            "locality": municipality["city"],
            "lat": e.get("lat"),
            "lng": e.get("lng"),
            "slug": e["slug"],
            "active": 2,
            "fetched_at": source.get("fetchedAt"),
        }
        if geo_marked:
            row["geo_source"] = e.get("geoSource")
            row["geo_precision"] = e.get("geoPrecision")
        establishment_rows.append(row)

    # JÄMFÖRELSEN före upserten, SKRIVNINGEN efter. Se record_names för varför
    # de två inte kan ske i samma steg: gamla namnet är borta efter upserten,
    # men den främmande nyckeln kräver att anläggningen finns före skrivningen.
    # Tabellen kom till i en senare migrering, så en databas som inte fått den
    # ska varna och ladda vidare i stället för att fälla hela nattkörningen.
    namnrader: list = []
    if client.has_column("establishment_names", "name"):
        _, namnrader = record_names(
            client, municipality["code"], establishments, source.get("fetchedAt")
        )
    else:
        print(
            "  VARNING: tabellen establishment_names saknas. Namnbyten kan inte\n"
            "  upptäckas, och kontrollhistorik från en tidigare verksamhet i samma\n"
            "  lokal går därför inte att skilja ut. Kör om pipeline/schema.sql.",
            file=sys.stderr,
        )

    client.upsert("establishments", establishment_rows, on_conflict="id")
    print(f"  anläggningar skrivna", file=sys.stderr)

    # Namnhistoriken, nu när raderna den pekar på finns.
    if namnrader:
        client.upsert(
            "establishment_names", namnrader, on_conflict="establishment_id,name"
        )

    # EFTER upserten: allt i utlämningen står nu som aktivt, och det som inte
    # står där är det som kommunen slutat lämna ut.
    deactivate_missing(client, municipality["code"], establishments)

    if geo_only:
        placed = sum(1 for e in establishments if e.get("lat") is not None)
        print(f"  {placed} koordinater skrivna; hoppar över kontrollhistoriken", file=sys.stderr)
        return

    # Inspektioner ersätts helt per körning: en kontroll som kommunen tagit
    # bort ska försvinna även hos oss. Kontrollområden städas av kaskaden.
    ids = [e["id"] for e in establishments]
    client.delete_where_in("inspections", "establishment_id", ids)

    inspection_rows, area_rows = [], []
    for e in establishments:
        for i in e.get("inspections") or []:
            inspection_rows.append(
                {
                    "id": i["id"],
                    "establishment_id": e["id"],
                    "inspected_at": i["date"],
                    "type": i["type"],
                    "assessment": i["assessment"],
                    "prenotified": i.get("prenotified"),
                    "audit": i.get("audit", False),
                    "on_site": i.get("onSite", True),
                    "fetched_at": source.get("fetchedAt"),
                }
            )
            for a in i.get("areas") or []:
                area_rows.append(
                    {
                        "inspection_id": i["id"],
                        "code": a.get("code") or None,
                        "area_group": a.get("group") or None,
                        "description": a.get("description") or None,
                        "status": a["status"],
                    }
                )

    client.upsert("inspections", inspection_rows, on_conflict="id")
    print(f"  {len(inspection_rows)} inspektioner skrivna", file=sys.stderr)

    if area_rows:
        client.upsert("control_areas", area_rows, on_conflict="id")
        print(f"  {len(area_rows)} kontrollområden skrivna", file=sys.stderr)

    # Osäkerhetsflaggan skickas bara när kolumnen finns. Schemat körs för hand
    # i SQL Editor, och PostgREST svarar 400 på en okänd kolumn: hela portionen
    # på 1 000 bedömningar hade fallit, inte bara det fält som saknar plats.
    # Samma skäl som geo_source ovan.
    flaggar_osakerhet = client.has_column("assessments", "uncertain")
    osakra = sum(1 for e in establishments if e.get("uncertain"))
    if not flaggar_osakerhet and osakra:
        print(
            f"  VARNING: assessments saknar kolumnen uncertain. {osakra} bedömningar\n"
            "  vilar på en ofullständig områdeslista och skrivs ändå som om de vore\n"
            "  fullständiga. Kör om pipeline/schema.sql i Supabase SQL Editor.",
            file=sys.stderr,
        )

    assessment_rows = [
        {
            "establishment_id": e["id"],
            "verdict": e.get("verdict"),
            "distinction": e.get("distinction", False),
            "reason": e.get("reason", "no_inspections"),
            "model_version": e.get("modelVersion", 2),
            # Saknas fältet i filen är underlaget läst utan rest. Det är ett
            # påstående vi vågar göra: adaptrarna sätter flaggan när de INTE
            # kan läsa, inte när de kan.
            **({"uncertain": e.get("uncertain", False)} if flaggar_osakerhet else {}),
        }
        for e in establishments
    ]
    client.upsert("assessments", assessment_rows, on_conflict="establishment_id")
    print(f"  bedömningar skrivna", file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("files", nargs="+", type=Path)
    parser.add_argument(
        "--geo-only",
        action="store_true",
        help="skriv bara anläggningarna (koordinater), rör inte kontrollhistoriken",
    )
    args = parser.parse_args()

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        sys.exit(
            "Saknar SUPABASE_URL eller SUPABASE_SERVICE_KEY.\n"
            "service_role-nyckeln ger full skrivåtkomst — håll den utanför repot."
        )

    client = Supabase(url, key)

    # En kommun som fallerar får inte stoppa de elva andra. Filerna laddas i
    # den ordning skalet råkar expandera dem, och när Stockholm reste ett fel
    # laddades Svenljunga och Uppsala inte alls: de ligger efter i bokstavs-
    # ordningen. Deras data stod stilla i fyra dygn utan att någon signal sade
    # att det var DE som stod stilla. Felet syns fortfarande, både i loggen
    # och i slutkoden, men först när alla fått sin chans.
    failed = []
    for path in args.files:
        try:
            load(path, client, geo_only=args.geo_only)
        except Exception:
            failed.append(path)
            print(f"\nFEL vid inläsning av {path}:", file=sys.stderr)
            traceback.print_exc()
            if os.environ.get("GITHUB_ACTIONS"):
                print(f"::error title=Inläsning misslyckades::{path}")

    if failed:
        names = ", ".join(str(p) for p in failed)
        sys.exit(f"\n{len(failed)} av {len(args.files)} filer misslyckades: {names}")

    print("\nKlart.", file=sys.stderr)


if __name__ == "__main__":
    main()
