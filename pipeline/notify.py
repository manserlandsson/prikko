#!/usr/bin/env python3
"""Notiser till den som bevakar en verksamhet.

Jämför gårdagens ögonblicksbild med dagens, hittar de bevakade verksamheter
där kommunen registrerat en ny kontroll med anmärkningar, och mejlar dem som
tryckt Följ.

    set -a && . ~/.prikko-env && set +a
    python3 pipeline/notify.py                     # torrkörning, skickar inget
    python3 pipeline/notify.py --skicka            # på riktigt
    python3 pipeline/notify.py --jamfor-med HEAD~5 # mot en äldre ögonblicksbild

TORRKÖRNING ÄR FÖRVALET. Ett skript som mejlar riktiga människor ska inte göra
det för att någon råkade köra det. `--skicka` är det enda som släpper iväg
något, och nattjobbet skriver ut flaggan uttryckligen.

---------------------------------------------------------------------------
TVÅ UTFALL, INTE ETT
---------------------------------------------------------------------------
Körningen lämnar två spår, och de är olika saker:

  community.notices        notisen i gränssnittet, alltså klockan på kontot.
                           Skrivs FÖRE utskicket och oberoende av det.
  community.notifications  kvittot på att ett mejl faktiskt gått iväg. Skrivs
                           EFTER varje lyckat utskick, och är det som håller
                           Resend-kvoten och dubblettspärren.

Ordningen och åtskillnaden är avsiktlig. En notis i webbläsaren kostar
ingenting, så den ska inte utebli för att mejltaket är fullt eller för att
adressen är obekräftad. Se write_notices() och kommentaren över
community.notices i pipeline/schema_community.sql.

---------------------------------------------------------------------------
VAD MAN FÅR MEJL OM, OCH VARFÖR DET INTE GÅR ATT STÄLLA IN
---------------------------------------------------------------------------
Ett mejl går ut när en bevakad verksamhet fått en NY kontroll med
anmärkningar. Inget annat. Inte när en kontroll gick bra, inte när en
utmärkelse kommit eller försvunnit, inte när namnet bytts.

Det är ett förval och inte en inställning, och det är ett beslut:

  * Prikko besöks två gånger om året. En kryssruteruta på kontosidan är en
    fråga ställd till någon som inte är här. Ett förval som är rätt slår en
    inställning ingen hinner sätta.
  * Den enda inställning som vore meningsfull är "berätta också när det gick
    bra". Ungefär två tredjedelar av beståndet är utan anmärkningar, så det
    läget hade tredubblat volymen — mot ett tak på 100 mejl per dygn — för att
    berätta att ingenting hänt.
  * Avregistreringslänken i varje mejl ÄR inställningen. Den är binär, den
    finns i handen på den som just blev störd, och den kräver ingen inloggning.

Byggs en inställning någon gång hör den hemma på /konto/ och ska vara ETT läge
till, inte fyra kryssrutor.

---------------------------------------------------------------------------
VARFÖR JÄMFÖRELSEN GÖRS MOT GIT OCH INTE MOT DATABASEN
---------------------------------------------------------------------------
load_supabase.py ersätter en anläggnings kontroller vid varje körning. Efter
inläsningen finns gårdagen inte kvar någonstans i databasen.

Ögonblicksbilderna i site/src/data checkas däremot in varje natt. `git show
HEAD:site/src/data/<kommun>.json` är alltså gårdagens bestånd, exakt som det
såg ut, versionerat och granskbart. Steget körs efter exporten och före
commiten, då arbetskopian är dagens och HEAD är gårdagens.

Att det är sant även när commiten uteblir sköts av notisloggen, inte av
antaganden: `community.notifications` är unik på (user_id, inspection_id), och
en kontroll som redan mejlats hoppas över hur många gånger jobbet än körs om.

---------------------------------------------------------------------------
GRÄNSER SOM ÄR INBYGGDA
---------------------------------------------------------------------------
  * Vi skickar bara till den som själv tryckt Följ. Adresslistan ÄR
    community.follows; det finns ingen annan väg in i utskicket.
  * Ett mejl handlar bara om mottagarens egna bevakningar. Ingen rangordning,
    ingen jämförelse med andra verksamheter. En värstinglista i miniatyr är
    fortfarande en värstinglista.
  * Resends gratisnivå ger 100 mejl per dygn och 3 000 per månad. Taken räknas
    mot notisloggen före varje körning, och det som inte får plats loggas
    högljutt. Tyst bortfall är det enda oacceptabla utfallet.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

#: Schemat med användarinnehåll. Aldrig `public`. Se schema_community.sql.
SCHEMA = "community"

SITE_URL = "https://prikko.se"

#: Resends gratisnivå. Räknas mot community.notifications, inte mot en räknare
#: i minnet, så att en omkörning samma dygn inte kan spränga taket.
DAILY_CAP = 100
MONTHLY_CAP = 3000

#: Resend släpper igenom två anrop i sekunden på gratisnivån.
SEND_INTERVAL = 0.6

TEMPLATE = Path(__file__).resolve().parent / "notify_email.html"

#: Kontrollnivåer enligt Sambruk-specen. Se pipeline/prikko/grading.py.
NO_REMARKS = 0

#: Etiketterna är sajtens egna, ordagrant ur site/src/lib/site.ts. Mejlet och
#: sidan måste säga samma sak om samma verksamhet, annars är det ena fel.
VERDICT_LABEL = {
    "minor": "Brister",
    "major": "Brister som kvarstår",
}
VERDICT_COLOR = {
    "minor": "#8E7200",
    "major": "#EB0000",
}

MONTHS = (
    "januari", "februari", "mars", "april", "maj", "juni",
    "juli", "augusti", "september", "oktober", "november", "december",
)


class NotifyError(RuntimeError):
    pass


# ---------------------------------------------------------------------------
# Ögonblicksbilder
# ---------------------------------------------------------------------------


def read_snapshot(path: Path) -> dict | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def read_previous(slug: str, source: str, out_dir: Path) -> dict | None:
    """Gårdagens ögonblicksbild för en kommun.

    `source` är antingen en katalog eller en git-referens. Katalogen finns för
    att kunna prova hela kedjan mot två utdrag på disk utan att röra
    historiken.
    """
    if os.path.isdir(source):
        return read_snapshot(Path(source) / f"{slug}.json")

    # Git vill ha en sökväg relativ arbetsträdet. En absolut sökväg efter
    # kolonet ger "fatal: path ... is outside repository", vilket hade sett ut
    # som "ingen jämförelse möjlig" och tyst stängt av notiserna.
    relative = out_dir if not out_dir.is_absolute() else Path(os.path.relpath(out_dir))
    target = f"{source}:{(relative / f'{slug}.json').as_posix()}"
    try:
        raw = subprocess.run(
            ["git", "show", target],
            capture_output=True,
            check=True,
        ).stdout
    except (subprocess.CalledProcessError, FileNotFoundError):
        # Kommunen fanns inte i förra ögonblicksbilden. Då finns ingen
        # jämförelse att göra, och en ny kommun ska inte mejla ut hela sitt
        # bestånd första natten.
        return None
    try:
        return json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError:
        return None


def worsened(before: dict, after: dict) -> dict[str, dict]:
    """Bevakningsvärda förändringar, per anläggnings-id.

    Villkoren, alla fyra:

      1. Anläggningen fanns i BÅDA ögonblicksbilderna. En verksamhet som är ny
         hos kommunen har ingen förändring att rapportera — vi har inget att
         jämföra med, och dess historik kan vara flera år gammal.
      2. Det finns en kontroll vars id inte fanns förut.
      3. Den kontrollen har anmärkningar (`assessment` över noll). En godkänd
         kontroll är bra nyheter och inget man vill bli störd för.
      4. Den kontrollen är anläggningens SENASTE. Kommunerna efterregistrerar
         ibland gamla kontroller i klump; en kontroll från 2021 som dyker upp i
         dag säger ingenting om nuläget, och utan det här villkoret hade en
         enda sådan städning mejlat ut hela bevakningslistan.

    Bedömningen som följer med är verksamhetens NUVARANDE, alltså den sajten
    visar. Det är där "kvarstående brist vid återbesök" kommer ifrån: modellen
    i grading.py skärper en anmärkning till `major` när den överlevt en
    uppföljning, och mejlet ärver den bedömningen i stället för att göra en
    egen.
    """
    old_inspections = {
        e["id"]: {i["id"] for i in e.get("inspections") or []}
        for e in before.get("establishments", [])
    }

    changes: dict[str, dict] = {}
    for e in after.get("establishments", []):
        known = old_inspections.get(e["id"])
        if known is None:
            continue

        inspections = [i for i in (e.get("inspections") or []) if i.get("date")]
        if not inspections:
            continue

        latest = max(inspections, key=lambda i: i["date"])
        if latest["id"] in known:
            continue
        if (latest.get("assessment") or 0) <= NO_REMARKS:
            continue

        verdict = e.get("verdict")
        if verdict not in VERDICT_LABEL:
            # Ingen bedömning att stå för, alltså ingenting att påstå i ett
            # mejl. Modellen vägrar gissa och det gör inte vi heller.
            continue

        changes[e["id"]] = {
            "slug": e["slug"],
            "name": e["name"],
            "inspection_id": latest["id"],
            "date": latest["date"],
            "verdict": verdict,
        }
    return changes


# ---------------------------------------------------------------------------
# Supabase
# ---------------------------------------------------------------------------


class Supabase:
    """service_role mot PostgREST och GoTrues admin-API.

    Nyckeln går förbi radsäkerheten och får aldrig hamna i klientkod eller i
    repot. Samma mönster som pipeline/moderate.py.
    """

    def __init__(self, url: str, key: str) -> None:
        self.url = url.rstrip("/")
        self.key = key

    def _open(self, method: str, path: str, body=None, headers=None):
        merged = {"apikey": self.key, "Authorization": f"Bearer {self.key}"}
        merged.update(headers or {})
        data = None
        if body is not None:
            data = json.dumps(body).encode("utf-8")
            merged.setdefault("Content-Type", "application/json")

        request = urllib.request.Request(
            f"{self.url}/{path}", data=data, headers=merged, method=method
        )
        try:
            return urllib.request.urlopen(request, timeout=60)
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")[:600]
            raise NotifyError(f"{method} {path} → {exc.code}: {detail}") from exc

    def community(self, method: str, path: str, body=None, prefer: str = "") -> list:
        """Anrop mot schemat community. Schemat väljs med profilhuvuden."""
        headers = {"Accept-Profile": SCHEMA}
        if body is not None:
            headers["Content-Profile"] = SCHEMA
        if prefer:
            headers["Prefer"] = prefer
        with self._open(method, f"rest/v1/{path}", body, headers) as response:
            raw = response.read()
        return json.loads(raw) if raw else []

    def count(self, path: str) -> int:
        """Antal rader för en fråga, utan att hämta dem.

        PostgREST svarar högst 1 000 rader, så en längd på en lista hade
        tystnat vid tusen och gjort månadstaket obrukbart. `count=exact` ger
        det riktiga talet i Content-Range.
        """
        headers = {"Accept-Profile": SCHEMA, "Prefer": "count=exact"}
        with self._open("GET", f"rest/v1/{path}&limit=1", None, headers) as response:
            content_range = response.headers.get("Content-Range", "")
            response.read()
        total = content_range.rsplit("/", 1)[-1]
        return int(total) if total.isdigit() else 0

    def email_for(self, user_id: str) -> str | None:
        """Mottagarens adress ur auth.users.

        Adressen lagras ALDRIG i schemat community — se kommentaren över
        profiles i schema_community.sql. Den hämtas här, används en gång och
        skrivs inte ner. Konton utan bekräftad adress hoppas över: en obekräftad
        adress är någon annans tills motsatsen bevisats.
        """
        try:
            with self._open("GET", f"auth/v1/admin/users/{urllib.parse.quote(user_id)}") as r:
                user = json.loads(r.read())
        except NotifyError:
            return None
        if not user.get("email") or not user.get("email_confirmed_at"):
            return None
        if user.get("banned_until"):
            return None
        return user["email"]


# ---------------------------------------------------------------------------
# Resend
# ---------------------------------------------------------------------------


class Resend:
    ENDPOINT = "https://api.resend.com/emails"

    def __init__(self, key: str, sender: str) -> None:
        self.key = key
        self.sender = sender

    def send(self, to: str, subject: str, body: str, unsubscribe: str) -> str:
        payload = {
            "from": self.sender,
            "to": [to],
            "subject": subject,
            "html": body,
            # Låter Gmail och Outlook visa sin egen avregistreringsknapp
            # bredvid avsändaren. Samma adress som länken i brödtexten.
            # Ingen List-Unsubscribe-Post: engångsklick enligt RFC 8058 kräver
            # en endpoint som tar emot POST med formulärdata, och vi har ingen
            # server. Att utlova det utan att kunna hålla det vore värre än att
            # låta bli.
            "headers": {"List-Unsubscribe": f"<{unsubscribe}>"},
        }
        data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            self.ENDPOINT,
            data=data,
            headers={
                "Authorization": f"Bearer {self.key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.loads(response.read()).get("id", "")
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")[:400]
            raise NotifyError(f"Resend svarade {exc.code}: {detail}") from exc


# ---------------------------------------------------------------------------
# Mejlet
# ---------------------------------------------------------------------------

_COMMENT = re.compile(r"<!--.*?-->", re.DOTALL)


def templates() -> tuple[str, str]:
    """Skalet och radmallen, båda utan kommentarer.

    Kommentarerna i filen är till för den som ändrar mallen och har ingenting i
    en inkorg att göra. De är dessutom längre än mejlet: Gmail klipper brev
    över 102 kB och visar "visa hela meddelandet", vilket är precis det man
    inte vill i en notis.
    """
    text = TEMPLATE.read_text(encoding="utf-8")
    if "<!--RAD-->" not in text:
        raise NotifyError(f"{TEMPLATE} saknar RAD-markörerna.")
    shell = _COMMENT.sub("", text.split("<!--RAD-->")[0]).strip()
    row = _COMMENT.sub("", text.split("<!--RAD-->")[1].split("<!--/RAD-->")[0]).strip()
    return shell, row


def swedish_date(iso: str) -> str:
    try:
        d = datetime.strptime(iso[:10], "%Y-%m-%d").date()
    except ValueError:
        return iso[:10]
    return f"{d.day} {MONTHS[d.month - 1]} {d.year}"


def build_email(items: list[dict], unsubscribe_url: str, unsubscribe_label: str) -> str:
    shell, row_template = templates()

    rows = []
    for item in items:
        rows.append(
            row_template
            .replace("{{NAME}}", html.escape(item["name"]))
            .replace("{{CITY}}", html.escape(item["city"]))
            .replace("{{COLOR}}", VERDICT_COLOR[item["verdict"]])
            .replace("{{VERDICT}}", html.escape(VERDICT_LABEL[item["verdict"]]))
            .replace("{{DATE}}", swedish_date(item["date"]))
            .replace("{{URL}}", html.escape(item["url"], quote=True))
        )

    many = len(items) > 1
    heading = (
        f"{len(items)} verksamheter du bevakar har fått nya kontroller"
        if many
        else "En verksamhet du bevakar har fått en ny kontroll"
    )
    preheader = (
        f"Kommunen hittade anmärkningar hos {len(items)} av dina bevakade verksamheter."
        if many
        else f"Kommunen hittade anmärkningar hos {items[0]['name']}."
    )
    lead = (
        ("Kommunen har registrerat kontrollerna " if many else "Kommunen har registrerat kontrollen ")
        + "sedan förra gången vi tittade. Du hör bara av oss när något blivit "
          "sämre, aldrig när en kontroll gått bra."
    )

    return (
        shell
        .replace("{{PREHEADER}}", html.escape(preheader))
        .replace("{{HEADING}}", html.escape(heading))
        .replace("{{LEAD}}", lead)
        .replace("{{ROWS}}", "\n".join(rows))
        .replace("{{UNSUBSCRIBE_URL}}", html.escape(unsubscribe_url, quote=True))
        .replace("{{UNSUBSCRIBE_LABEL}}", html.escape(unsubscribe_label))
    )


def subject_for(items: list[dict]) -> str:
    if len(items) == 1:
        return f"Ny kontroll hos {items[0]['name']}"
    return f"Nya kontroller hos {len(items)} verksamheter du bevakar"


def unsubscribe_for(items: list[dict]) -> tuple[str, str]:
    """Adress och etikett för avregistreringslänken.

    Ett mejl om EN verksamhet erbjuder att sluta bevaka just den. Ett mejl om
    flera erbjuder att sluta bevaka alla, för ett val mellan tre namn i en
    länk är inget val. Sidan har båda knapparna oavsett vilken variant länken
    kom in på, så ingen målas in i ett hörn.
    """
    token = items[0]["token"]
    if len(items) == 1:
        return (
            f"{SITE_URL}/sluta-bevaka/?t={urllib.parse.quote(token)}",
            f"Sluta bevaka {items[0]['name']}",
        )
    return (
        f"{SITE_URL}/sluta-bevaka/?t={urllib.parse.quote(token)}&allt=1",
        "Sluta bevaka alla verksamheter",
    )


# ---------------------------------------------------------------------------
# Körningen
# ---------------------------------------------------------------------------


def stamp(moment: datetime) -> str:
    """Tidpunkt som tål att stå i en frågesträng.

    `isoformat()` skriver zonen som `+00:00`, och ett plustecken i en
    frågesträng betyder MELLANSLAG. Filtret hade alltså jämfört mot en
    halvtrasig sträng. `Z` säger samma sak utan tecknet.
    """
    return moment.strftime("%Y-%m-%dT%H:%M:%SZ")


def budget(db: Supabase) -> int:
    """Hur många mejl som får skickas nu.

    Räknas mot loggen och inte mot en räknare i minnet, så att två körningar
    samma dygn delar på samma tak.
    """
    now = datetime.now(timezone.utc)
    day = db.count(f"notifications?select=id&sent_at=gte.{stamp(now - timedelta(days=1))}")
    month = db.count(f"notifications?select=id&sent_at=gte.{stamp(now - timedelta(days=30))}")

    left = min(DAILY_CAP - day, MONTHLY_CAP - month)
    print(
        f"Kvot: {day}/{DAILY_CAP} senaste dygnet, {month}/{MONTHLY_CAP} senaste "
        f"30 dagarna. {max(left, 0)} mejl kvar.",
        file=sys.stderr,
    )
    return max(left, 0)


def collect(db: Supabase, out_dir: Path, compare_with: str) -> dict[str, list[dict]]:
    """Vad varje mottagare ska få veta, grupperat per användare.

    Grupperingen är inte kosmetisk. Ett mejl per förändring hade förbrukat
    dygnstaket tre gånger snabbare för någon som bevakar tre ställen i samma
    kommun, och tre brev i rad läses dessutom som utskick.
    """
    try:
        follows = db.community(
            "GET",
            "follows?select=user_id,establishment_id,municipality_slug,unsubscribe_token",
        )
    except NotifyError as exc:
        # Schemat körs för hand i Supabase SQL Editor, precis som schema.sql.
        # En databas som inte fått migreringen ska få veta det på klarspråk och
        # inte genom ett PostgREST-fel i loggen. Samma hållning som
        # has_column() i load_supabase.py.
        if "unsubscribe_token" in str(exc) or "notifications" in str(exc):
            print(
                "Databasen saknar notisdelen av schemat. Inga mejl kan skickas.\n"
                "  Kör om pipeline/schema_community.sql i Supabase SQL Editor.\n"
                f"  ({exc})",
                file=sys.stderr,
            )
            return {}
        raise

    if not follows:
        print("Ingen bevakar någon verksamhet. Inget att göra.", file=sys.stderr)
        return {}

    slugs = sorted({f["municipality_slug"] for f in follows})
    print(f"{len(follows)} bevakningar i {len(slugs)} kommun(er).", file=sys.stderr)

    # Bara de kommuner någon faktiskt bevakar jämförs. Att diffa 290 kommuner
    # för att tre personer bevakar två ställen är arbete utan mottagare.
    changes: dict[str, dict] = {}
    cities: dict[str, str] = {}
    for slug in slugs:
        current = read_snapshot(out_dir / f"{slug}.json")
        previous = read_previous(slug, compare_with, out_dir)
        if current is None or previous is None:
            print(f"  {slug}: ingen jämförelse möjlig, hoppar över.", file=sys.stderr)
            continue
        found = worsened(previous, current)
        for eid, change in found.items():
            change["municipality_slug"] = slug
            changes[eid] = change
        cities[slug] = current.get("municipality", {}).get("city", slug)
        if found:
            print(f"  {slug}: {len(found)} verksamhet(er) med ny anmärkning.", file=sys.stderr)

    if not changes:
        print("Inga nya anmärkningar på något bevakat ställe.", file=sys.stderr)
        return {}

    # Redan skickat? Loggen är sanningen, inte git-historiken.
    #
    # Frågan filtrerar på just de kontroller vi funderar på att mejla om, inte
    # på ett tidsfönster. PostgREST svarar högst 1 000 rader, och en
    # tidsfönsterfråga hade tystnat vid tusen utan att säga till — alltså
    # dubbletter till just de mottagare som fått flest notiser. Portionerna om
    # hundra håller URL:en kort.
    wanted = sorted({c["inspection_id"] for c in changes.values()})
    already: set[tuple[str, str]] = set()
    for start in range(0, len(wanted), 100):
        quoted = ",".join(f'"{i}"' for i in wanted[start : start + 100])
        already.update(
            (row["user_id"], row["inspection_id"])
            for row in db.community(
                "GET",
                "notifications?select=user_id,inspection_id&"
                + urllib.parse.urlencode({"inspection_id": f"in.({quoted})"}),
            )
        )

    per_user: dict[str, list[dict]] = {}
    for follow in follows:
        change = changes.get(follow["establishment_id"])
        if change is None:
            continue
        if (follow["user_id"], change["inspection_id"]) in already:
            continue
        slug = change["municipality_slug"]
        per_user.setdefault(follow["user_id"], []).append(
            {
                "establishment_id": follow["establishment_id"],
                "token": follow["unsubscribe_token"],
                "name": change["name"],
                "city": cities.get(slug, slug),
                "date": change["date"],
                "verdict": change["verdict"],
                "inspection_id": change["inspection_id"],
                "url": f"{SITE_URL}/{slug}/{change['slug']}/",
                # Bara till notisraden i databasen, aldrig till mejlet. Mallen
                # får sin länk färdigbyggd i "url" ovan.
                "municipality_slug": slug,
                "place_slug": change["slug"],
            }
        )

    for items in per_user.values():
        items.sort(key=lambda i: (i["date"], i["name"]), reverse=True)
    return per_user


def write_notices(db: Supabase, per_user: dict[str, list[dict]]) -> None:
    """Notiserna till klockan på kontot.

    SKRIVS FÖRE UTSKICKET OCH OBEROENDE AV DET. Det är hela skillnaden mot
    community.notifications, som är ett kvitto på skickade mejl och därför
    saknar rad när Resend-kvoten tagit slut eller när adressen är obekräftad.
    En notis i gränssnittet kostar ingenting och ska inte ransoneras av ett
    mejltak.

    Ett fel här får inte fälla utskicket. Har ägaren inte kört om
    schema_community.sql finns tabellen inte, och då är rätt utfall att
    mejlen går som förut och att bristen syns i loggen på klarspråk. Samma
    hållning som collect() har mot unsubscribe_token.
    """
    rows = [
        {
            "user_id": user_id,
            "establishment_id": item["establishment_id"],
            "municipality_slug": item["municipality_slug"],
            "establishment_name": item["name"],
            "establishment_slug": item["place_slug"],
            "inspection_id": item["inspection_id"],
            "inspected_at": item["date"][:10],
            "verdict": item["verdict"],
        }
        for user_id, items in per_user.items()
        for item in items
    ]
    if not rows:
        return

    try:
        # `on_conflict` av samma skäl som i notisloggen: utan den löser
        # PostgREST konflikten mot primärnyckeln, som är en färsk uuid varje
        # gång, och dubblettspärren på (user_id, inspection_id) hade fällt hela
        # skrivningen med 409 i stället för att hoppa över raden.
        db.community(
            "POST",
            "notices?on_conflict=user_id,inspection_id",
            rows,
            prefer="return=minimal,resolution=ignore-duplicates",
        )
    except NotifyError as exc:
        print(
            f"VARNING: notiserna kunde inte skrivas ({len(rows)} rader). Mejlen "
            "går ut ändå, men klockan på kontot står stilla.\n"
            "  Kör om pipeline/schema_community.sql i Supabase SQL Editor.\n"
            f"  ({exc})",
            file=sys.stderr,
        )
        if os.environ.get("GITHUB_ACTIONS"):
            print("::warning title=Notiser i gränssnittet::Tabellen community.notices svarade inte.")
        return

    print(f"{len(rows)} notis(er) skrivna till kontot.", file=sys.stderr)


def run(db: Supabase, out_dir: Path, compare_with: str, send: bool) -> int:
    per_user = collect(db, out_dir, compare_with)
    if not per_user:
        return 0

    # Torrkörningen skriver ingenting alls, inte heller notiser. `--skicka` är
    # den enda flaggan som får röra vare sig inkorgar eller databasen.
    if send:
        write_notices(db, per_user)

    left = budget(db) if send else len(per_user)
    if send and left <= 0:
        # Till stdout, inte stderr: GitHub Actions läser bara stdout efter
        # sina arbetsflödeskommandon. Samma sak som load_supabase.py gör.
        print(
            "::error title=Notiser stoppade::Resend-kvoten är förbrukad. "
            f"{len(per_user)} mottagare fick inget mejl i natt."
        )
        return 1

    mailer = None
    if send:
        key = os.environ.get("RESEND_API_KEY")
        if not key:
            raise NotifyError(
                "RESEND_API_KEY saknas. Nyckeln läses ur miljön, aldrig ur repot.\n"
                "  set -a && . ~/.prikko-env && set +a"
            )
        mailer = Resend(key, os.environ.get("PRIKKO_MAIL_FROM") or "Prikko <notiser@prikko.se>")

    sent = skipped = 0
    for user_id, items in per_user.items():
        if sent >= left:
            skipped += 1
            continue

        url, label = unsubscribe_for(items)
        subject = subject_for(items)
        body = build_email(items, url, label)

        if not send:
            print(f"\n[torrt] {user_id}: {subject}")
            for item in items:
                print(f"         {item['name']} · {item['city']} · "
                      f"{VERDICT_LABEL[item['verdict']]} {item['date']} · {item['url']}")
            print(f"         avregistrering: {url}")
            sent += 1
            continue

        address = db.email_for(user_id)
        if address is None:
            # Konto borttaget eller adress obekräftad. Ingen notis, ingen
            # loggrad — händer det igen i morgon är det fortfarande sant.
            print(f"  {user_id}: ingen användbar adress, hoppar över.", file=sys.stderr)
            continue

        mailer.send(address, subject, body, url)
        # `on_conflict` MÅSTE stå med. Utan den löser PostgREST konflikten mot
        # primärnyckeln, som är en färsk uuid varje gång, och dubblettspärren
        # på (user_id, inspection_id) hade fällt hela skrivningen med 409 i
        # stället för att hoppa över raden.
        db.community(
            "POST",
            "notifications?on_conflict=user_id,inspection_id",
            [
                {
                    "user_id": user_id,
                    "establishment_id": item["establishment_id"],
                    "inspection_id": item["inspection_id"],
                }
                for item in items
            ],
            prefer="return=minimal,resolution=ignore-duplicates",
        )
        sent += 1
        print(f"  skickat till {user_id} ({len(items)} verksamhet(er))", file=sys.stderr)
        time.sleep(SEND_INTERVAL)

    if skipped:
        # Högljutt, inte tyst. Ett bortfall som ingen ser är värre än inget
        # utskick alls, för då tror ägaren att bevakningen fungerar.
        message = (
            f"{skipped} mottagare fick inget mejl: Resend-kvoten tog slut "
            f"({DAILY_CAP} per dygn, {MONTHLY_CAP} per månad). De ligger kvar och "
            "skickas nästa körning, eftersom notisloggen bara får en rad när ett "
            "mejl faktiskt gått iväg."
        )
        print(f"VARNING: {message}", file=sys.stderr)
        if os.environ.get("GITHUB_ACTIONS"):
            print(f"::warning title=Notiskvoten slut::{message}")

    verb = "skulle skickats" if not send else "skickade"
    print(f"\n{sent} mejl {verb}.", file=sys.stderr)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Notiser till den som bevakar en verksamhet.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Utan --skicka görs en torrkörning som bara skriver ut vad som "
               "skulle gått iväg.",
    )
    parser.add_argument("--data", type=Path, default=Path("site/src/data"),
                        help="katalogen med dagens ögonblicksbilder")
    parser.add_argument("--jamfor-med", default="HEAD",
                        help="git-referens eller katalog med gårdagens ögonblicksbilder")
    parser.add_argument("--skicka", action="store_true",
                        help="skicka på riktigt; utan flaggan skickas ingenting")
    args = parser.parse_args()

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        print("SUPABASE_URL och SUPABASE_SERVICE_KEY måste vara satta.", file=sys.stderr)
        print("  set -a && . ~/.prikko-env && set +a", file=sys.stderr)
        return 2

    try:
        return run(Supabase(url, key), args.data, args.jamfor_med, args.skicka)
    except NotifyError as exc:
        print(f"Fel: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
