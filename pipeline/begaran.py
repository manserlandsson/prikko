#!/usr/bin/env python3
"""Skriv begäran om utlämnande, en åt gången, till en myndighet i taget.

    python3 pipeline/begaran.py omgang --antal 10     # nästa omgång
    python3 pipeline/begaran.py skriv 1480 1280       # bestämda myndigheter
    python3 pipeline/begaran.py paminnelse 1480       # uppföljning i samma tråd
    python3 pipeline/begaran.py livsmedelsverket      # de två genvägsbreven
    python3 pipeline/begaran.py status                # vad väntar, vad brådskar

**Skriptet skickar ingenting.** Det skriver textfiler till `data/begaran/`.
Att skicka är ägarens beslut, ett mejl i taget, från ägarens egen adress. Ett
skript som både formulerar och skickar 249 myndighetsframställningar är ett
massutskick oavsett vad det heter, och ett massutskick är precis vad den här
kampanjen inte får vara.

Skriptet fyller heller aldrig i någon kommuns e-tjänst. Villkoren för de
tjänsterna förbjuder oftast maskinell åtkomst, flera har CAPTCHA, och
relationen till myndigheterna är värd mer än tiden det skulle spara. Där
kommunen anvisar en e-tjänst skrivs brevet ändå, med e-tjänstens adress i
Till-raden, så att ägaren kan klistra in texten där för hand.

## Vad som gör breven till brev och inte till en mall

Ett massutskick känns igen på att det inte vet vem det talar med. Varje brev
här bär därför uppgifter som bara gäller mottagaren, och alla kommer ur
registret:

- Myndighetens namn, och för en gemensam nämnd namnen på alla kommuner den
  är kontrollmyndighet för. Att skriva "Tyresö, Haninge och Nynäshamn" är
  skillnaden mellan att veta och att gissa.
- Antalet anläggningar de själva rapporterat till Livsmedelsverket, så att
  handläggaren direkt ser vilken storleksordning uttaget har.
- Verksamhetssystemet, men bara när det är verifierat. Att gissa fel på
  systemet är sämre än att inte nämna det.
- Vad de publicerar i dag. Den som redan publicerar en sammanställning ska
  inte få ett brev som låtsas att de inte publicerar något.

Det som INTE varieras är juridiken och beskrivningen av vad datan ska
användas till. Den ska vara ordagrant densamma varje gång, eftersom den är
prövad och eftersom myndigheter i samma län läser varandras handlingar.

## Ordningen breven skrivs i

`omgang` tar de största först, räknat i anläggningar. Skälen är två. Volym:
Göteborg ensamt är 5 418 verksamheter, medan de sextio minsta myndigheterna
tillsammans är färre. Och kompetens: en stor förvaltning har rutin för
utlämnanden och ofta en egen jurist, vilket gör svaret snabbare och mer
förutsägbart än i en kommun där frågan är ny.

Myndigheter vi redan har data för hoppas över, och likaså de som publicerar
öppna data vi kan hämta själva. Att begära ut det man kan ladda ner är att
be en handläggare göra ett jobb i onödan.
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
import textwrap
import unicodedata
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence

REGISTER = Path("pipeline/data/kommunregister.csv")
TRACKING = Path("pipeline/data/utlamnanden.csv")
LETTERS = Path("pipeline/data/begaran")

#: Avsändaren. Utan namn och adress går begäran inte att besvara, och en
#: anonym begäran tvingar dessutom fram en sekretessprövning myndigheten
#: saknar underlag att säga ja till. Se R11 avsnitt 1.7.
SENDER_NAME = "Måns Erlandsson"
SENDER_COMPANY = "Magoed AB"
SENDER_ORG_NR = "559386-1015"
SENDER_SITE = "https://prikko.se"
#: Fylls i av ägaren. En prikko.se-adress, inte en privat, eftersom mottagaren
#: ska kunna se att avsändaren är den sajt brevet hänvisar till.
SENDER_EMAIL = ""
SENDER_PHONE = ""

#: Statusvärden som ska ha ett brev. `oppen_data` och `inlast` ska inte:
#: det vore att be någon skicka det vi redan kan hämta.
WRITEABLE = ("sammanfattning", "inget", "okand")

#: Uppföljningsschemat, dagar efter skickat. Se R11 avsnitt C.
FOLLOW_UP = {
    7: "vänlig påminnelse i samma tråd",
    21: "påminnelse med fyraveckorsfristen i 5 kap. 1 § öppna data-lagen",
    30: "begär skriftligt beslut enligt 5 kap. 2 § och myndighetens prövning",
    45: "avgör om det ska överklagas, annars lägg åt sidan",
}

TRACKING_COLUMNS = (
    "myndighet_kod",
    "myndighet",
    "kommuner",
    "kommunkoder",
    "anlaggningar",
    "verksamhetssystem",
    "mottagare",
    "mottagartyp",
    "skickat",
    "diarienummer",
    "paminnelse_1",
    "paminnelse_2",
    "svar",
    "utfall",
    "format",
    "omfattning",
    "period_fran",
    "period_till",
    "avgift_kr",
    "avgift_status",
    "fil",
    "villkor",
    "overklagat",
    "anteckning",
)

#: Utfall, i den ordning ett ärende rör sig genom dem.
OUTCOMES = (
    "utkast",      # brevet är skrivet, inte skickat
    "vantar",      # skickat, inget svar
    "dialog",      # de har hört av sig och frågar något
    "avgiftskrav", # de vill ha betalt innan de lämnar ut
    "delvis",      # något kom, inte allt
    "komplett",    # allt kom
    "avslag",      # nej, med eller utan beslut
    "hanvisad",    # de pekar vidare, till exempel till Livsmedelsverket
)


class Missing(RuntimeError):
    """Något som måste vara verifierat är det inte."""


# ---------------------------------------------------------------------------
# Register och spårning
# ---------------------------------------------------------------------------


def read_rows(path: Path) -> List[dict]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def write_tracking(path: Path, rows: Sequence[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=TRACKING_COLUMNS)
        writer.writeheader()
        for row in sorted(rows, key=lambda r: r["myndighet_kod"]):
            writer.writerow({c: row.get(c, "") for c in TRACKING_COLUMNS})


def slug(text: str) -> str:
    plain = unicodedata.normalize("NFKD", text.lower())
    plain = plain.replace("å", "a").replace("ä", "a").replace("ö", "o")
    plain = "".join(c for c in plain if not unicodedata.combining(c))
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", plain)).strip("-")


def municipality_list(row: dict) -> str:
    """Kommunerna som en läsbar uppräkning, med och före den sista."""
    names = [n for n in (row.get("kommuner") or "").split(";") if n]
    if len(names) <= 1:
        return names[0] if names else ""
    return ", ".join(names[:-1]) + " och " + names[-1]


def thousands(value: str) -> str:
    """5418 blir 5 418. Svenskt tusentalsmellanrum, inte komma."""
    try:
        return f"{int(value):,}".replace(",", " ")
    except (TypeError, ValueError):
        return value


# ---------------------------------------------------------------------------
# Brevet
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class Letter:
    to: str
    cc: str
    subject: str
    body: str

    def render(self) -> str:
        head = [f"Till: {self.to}"]
        if self.cc:
            head.append(f"Kopia: {self.cc}")
        head.append(f"Ämne: {self.subject}")
        return "\n".join(head) + "\n\n" + self.body


#: Radbredd. Mejl läses lika ofta i en smal ruta som i ett fönster, och en
#: rad som bryts av mottagarens klient mitt i en mening ser slarvig ut.
WIDTH = 72


def paragraphs(*blocks: Optional[str]) -> str:
    """Stycken till brevtext, radbrutna på WIDTH och åtskilda av tomrad.

    Ett stycke som börjar med "1. " eller "2. " får hängande indrag, så att
    uppräkningen håller ihop visuellt. `None` hoppas över, vilket gör att ett
    villkorat stycke kan skrivas som ett uttryck i stället för som en if-sats
    mitt i texten.
    """
    written = []
    for block in blocks:
        if block is None:
            continue
        indent = "   " if re.match(r"^\d+\. ", block) else ""
        written.append(
            textwrap.fill(
                " ".join(block.split()),
                width=WIDTH,
                subsequent_indent=indent,
                break_long_words=False,
                break_on_hyphens=False,
            )
        )
    return "\n\n".join(written)


def signature() -> str:
    if not SENDER_EMAIL:
        raise Missing(
            "SENDER_EMAIL är tom i pipeline/begaran.py. En begäran utan "
            "svarsadress går inte att besvara. Skriv in prikko.se-adressen "
            "eller ange --epost."
        )
    contact = [SENDER_EMAIL, SENDER_SITE]
    if SENDER_PHONE:
        contact.insert(0, SENDER_PHONE)
    return (
        "Vänliga hälsningar\n"
        f"{SENDER_NAME}\n"
        f"{SENDER_COMPANY}, org.nr {SENDER_ORG_NR}\n" + " · ".join(contact)
    )


def years(today: date) -> List[int]:
    """De tre rapporteringsår som finns att be om.

    Rapporteringen för ett kontrollår ska vara inne senast 31 januari året
    efter. Före februari är alltså förrförra året det senaste som säkert är
    inlämnat. Färskhetsfönstret på sajten är tre år, så tre årgångar räcker.
    """
    latest = today.year - 1 if today.month > 1 else today.year - 2
    return [latest, latest - 1, latest - 2]


def request_letter(row: dict, today: Optional[date] = None) -> Letter:
    today = today or date.today()
    reported = years(today)
    where = municipality_list(row) or row.get("myndighet", "")
    system = (row.get("verksamhetssystem") or "").strip()
    facilities = (row.get("anlaggningar") or "").strip()
    status = (row.get("status") or "okand").strip()

    if status not in WRITEABLE:
        raise Missing(
            f"{row['myndighet_kod']} har status {status!r}. Det finns inget "
            f"att begära ut från en myndighet vars uppgifter vi redan har "
            f"eller kan hämta själva."
        )
    if not (row.get("mottagare") or "").strip():
        raise Missing(
            f"{row['myndighet_kod']} ({row.get('myndighet')}) saknar verifierad "
            f"mottagare. Skriv in adressen i pipeline/data/kommunkontakter.csv "
            f"med datum och källa, och bygg om registret."
        )

    body = paragraphs(
        "Hej,",
        f"jag begär ut uppgifter om livsmedelskontrollen i {where}. Vi samlar "
        f"kommunernas offentliga kontrollresultat till en jämförbar sajt för "
        f"konsumenter och har hittills läst in tolv kommuner: {SENDER_SITE}.",
        "Två saker behövs:",
        f"1. Kontrollerna. Enklast för er är sannolikt samma XML-fil som ni "
        f"laddade upp till Livsmedelsverkets myndighetsrapportering för "
        f"{reported[0]}, gärna även {reported[1]} och {reported[2]}. Den tas "
        f"normalt ut ur verksamhetssystemet och innehåller allt vi behöver om "
        f"själva kontrollerna."
        + (f" Ni rapporterar med {system}, så uttaget kan finnas kvar sedan i "
           f"januari." if system else ""),
        "2. Verksamheterna. En lista med verksamhets-id, objekts-id om de "
        "skiljer sig åt, namn, besöksadress och om verksamheten är aktiv eller "
        "upphörd. Rapporteringen till Livsmedelsverket innehåller inte namn "
        "och adress.",
        "Jag har läst det ni publicerar i dag och hittar kontrollresultaten per "
        "verksamhet först efter en begäran. Det är dem det gäller."
        if status == "sammanfattning" else None,
        f"Ni rapporterade {thousands(facilities)} anläggningar i registret till "
        f"Livsmedelsverket, så uttaget är av den storleksordningen."
        if facilities else None,
        "Är det enklare att exportera hela beståndet än att filtrera på datum, "
        "gör gärna det. Vi sorterar själva.",
        "Vi ber i första hand om ett maskinläsbart format: XML, CSV, Excel "
        "eller JSON. Går det inte tar vi emot PDF, vi läser sådana redan.",
        "Vi behöver inte organisationsnummer, och inga personuppgifter utöver "
        "det företagsnamn och den besöksadress som redan är offentliga. "
        "Dricksvattenanläggningar kan lämnas utanför.",
        "Tar ni ut en avgift ber jag er meddela beloppet innan uttaget görs, så "
        "tar jag ställning först.",
        "Uppgifterna publiceras på prikko.se med kommunen som källa och med "
        "kontrolldatum. Hela bedömningsmetoden är publik, varje verksamhet kan "
        "publicera ett eget svar intill sin kontroll, och vi rättar fel så "
        "snart de påtalas.",
        "Rättslig grund: 2 kap. tryckfrihetsförordningen. Begäran görs också "
        "som en begäran om tillgängliggörande av data för vidareutnyttjande "
        "enligt lagen (2022:818) om den offentliga sektorns tillgängliggörande "
        "av data, och jag ber därför att uppgifterna lämnas i befintligt "
        "digitalt format.",
        "Vill ni hellre publicera uppgifterna som öppna data än att skicka dem "
        "till mig går det lika bra. Sambruk och NSÖD har tagit fram en "
        "nationell specifikation för just livsmedelsinspektioner."
        if status == "sammanfattning" else None,
        "Hör gärna av er om något är oklart eller om uttaget blir omfattande, "
        "så avgränsar vi det tillsammans.",
    )
    parts = [body, "", signature(), ""]

    span = f"{reported[2]} till {reported[0]}"
    return Letter(
        to=(row.get("mottagare") or "").strip(),
        cc=(row.get("registrator") or "").strip(),
        subject=f"Begäran om utlämnande av allmän handling: livsmedelskontroller {span}",
        body="\n".join(parts),
    )


def reminder_letter(row: dict, stage: int, today: Optional[date] = None) -> Letter:
    """Uppföljning, i samma tråd som den ursprungliga begäran.

    Tonen skärps ett steg i taget, och paragraferna kommer först när tystnaden
    varat längre än lagen tillåter. Ett första mejl som redan hotar med
    överklagande får ett svar som är skrivet av en jurist i stället för av
    den som har filen.
    """
    today = today or date.today()
    sent = (row.get("skickat") or "").strip()
    reference = f" (ert diarienummer {row['diarienummer']})" if row.get("diarienummer") else ""

    if stage == 7:
        text = paragraphs(
            "Hej,",
            f"jag följer upp min begäran från {sent}{reference}. Hör gärna av "
            f"er om något behöver förtydligas eller avgränsas.",
        )
    elif stage == 21:
        text = paragraphs(
            "Hej,",
            f"jag har ännu inte fått besked om min begäran från "
            f"{sent}{reference}. Begäran gjordes som en begäran om "
            f"tillgängliggörande av data för vidareutnyttjande, och enligt "
            f"5 kap. 1 § lagen (2022:818) ska ett sådant ärende avgöras inom "
            f"fyra veckor. Behöver ni längre tid går det bra, säg bara till.",
        )
    else:
        text = paragraphs(
            "Hej,",
            f"min begäran från {sent}{reference} är fortfarande obesvarad. Jag "
            f"ber därför om ett skriftligt och motiverat beslut enligt "
            f"5 kap. 2 § lagen (2022:818), och om begäran avslås helt eller "
            f"delvis ber jag om myndighetens prövning enligt 6 kap. 3 § "
            f"offentlighets- och sekretesslagen, med besvärshänvisning.",
        )

    return Letter(
        to=(row.get("mottagare") or "").strip(),
        cc=(row.get("registrator") or "").strip(),
        subject=f"Påminnelse: begäran om utlämnande{reference}",
        body="\n".join([text, "", signature(), ""]),
    )


def shortcut_letters(recipient: str, today: Optional[date] = None) -> List[Letter]:
    """De två breven till Livsmedelsverket, som ska skickas före kampanjen.

    Genväg A ger systemkartan: vilket verksamhetssystem varje kontrollmyndighet
    i landet rapporterar med. Den avgör vilken variant varje kommun ska få, och
    är den billigaste åtgärden i hela planen.

    Genväg B ger kontrolldatan för hela riket i ett svep. Lyckas den vänds
    kampanjen: då behöver kommunerna bara skicka namn- och adresslistan.
    Breven skickas var för sig, så att ett nej på det ena inte drar med sig
    det andra.
    """
    today = today or date.today()
    reported = years(today)
    a = Letter(
        to=recipient,
        cc="",
        subject="Begäran om utlämnande: verksamhetssystem per kontrollmyndighet",
        body="\n".join([
            paragraphs(
                "Hej,",
                "jag begär ut en förteckning över vilket verksamhetssystem och "
                "vilken version varje kommunal kontrollmyndighet uppgett i "
                "myndighetsrapporteringen, senaste rapporteringsomgången. "
                "Uppgifterna fylls i under Information om myndigheten.",
                f"Vi läser kommunernas offentliga livsmedelskontroller till en "
                f"jämförbar sajt för konsumenter, {SENDER_SITE}, och "
                f"förteckningen avgör hur vi formulerar frågan till varje "
                f"kommun.",
                "Ett maskinläsbart format vore bäst, gärna CSV eller Excel.",
                "Rättslig grund: 2 kap. tryckfrihetsförordningen, samt lagen "
                "(2022:818) om den offentliga sektorns tillgängliggörande av "
                "data, eftersom detta är en begäran om tillgängliggörande av "
                "data för vidareutnyttjande.",
                "Tar ni ut en avgift ber jag er meddela beloppet innan uttaget "
                "görs.",
            ),
            "",
            signature(),
            "",
        ]),
    )
    b = Letter(
        to=recipient,
        cc="",
        subject="Begäran om utlämnande: inrapporterade kontrolluppgifter från kommunerna",
        body="\n".join([
            "Hej,",
            "",
            "jag begär ut de uppgifter om utförd livsmedelskontroll som kommunala",
            f"kontrollmyndigheter rapporterat in för {reported[2]}, {reported[1]} "
            f"och {reported[0]}.",
            "",
            "I första hand ber jag om filerna som de kom in, en per myndighet och år,",
            "eftersom de då är inkomna handlingar och inte kräver att någon gör en",
            "sammanställning. Är det enklare för er med ett samlat uttag ur",
            "insamlingen går det förstås lika bra.",
            "",
            "Vi läser kommunernas offentliga livsmedelskontroller till en jämförbar",
            f"sajt för konsumenter, {SENDER_SITE}. Uppgifterna publiceras med",
            "kommunen som källa, bedömningsmetoden är publik, och verksamheter kan",
            "publicera ett eget svar intill sin kontroll.",
            "",
            "Vi behöver inga personuppgifter. Rapporteringen innehåller såvitt jag",
            "förstår varken namn eller adress, vilket är helt tillräckligt för oss.",
            "",
            "Rättslig grund: 2 kap. tryckfrihetsförordningen, samt lagen (2022:818)",
            "om den offentliga sektorns tillgängliggörande av data, eftersom detta",
            "är en begäran om tillgängliggörande av data för vidareutnyttjande. Jag",
            "ber därför att uppgifterna lämnas i befintligt digitalt format.",
            "",
            "Blir uttaget omfattande hör gärna av er, så avgränsar vi det",
            "tillsammans. Tar ni ut en avgift ber jag er meddela beloppet innan",
            "uttaget görs.",
            "",
            signature(),
            "",
        ]),
    )
    return [a, b]


# ---------------------------------------------------------------------------
# Kommandon
# ---------------------------------------------------------------------------


def eligible(register: Iterable[dict], tracking: Dict[str, dict]) -> List[dict]:
    """Myndigheter som ska ha ett brev, störst först."""
    rows = [
        row
        for row in register
        if row.get("status") in WRITEABLE
        and (row.get("mottagare") or "").strip()
        and not (tracking.get(row["myndighet_kod"], {}).get("skickat") or "").strip()
    ]
    return sorted(rows, key=lambda r: -int(r.get("anlaggningar") or 0))


def write_letters(rows: Sequence[dict], out: Path, tracking_path: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    tracking = {r["myndighet_kod"]: r for r in read_rows(tracking_path)}

    coverage = 0.0
    for row in rows:
        letter = request_letter(row)
        # Filnamnet bär första kommunen och inte myndighetens namn, eftersom
        # ägaren letar efter Göteborg och inte efter Miljöförvaltningen.
        first = (row.get("kommuner") or row.get("myndighet", "")).split(";")[0]
        name = f"{row['myndighet_kod']}-{slug(first)}.txt"
        (out / name).write_text(letter.render(), encoding="utf-8")
        entry = tracking.setdefault(row["myndighet_kod"], {"myndighet_kod": row["myndighet_kod"]})
        entry.update({
            "myndighet": row.get("myndighet", ""),
            "kommuner": row.get("kommuner", ""),
            "kommunkoder": row.get("kommunkoder", ""),
            "anlaggningar": row.get("anlaggningar", ""),
            "verksamhetssystem": row.get("verksamhetssystem", ""),
            "mottagare": row.get("mottagare", ""),
            "mottagartyp": row.get("mottagartyp", ""),
        })
        entry.setdefault("utfall", "utkast")
        coverage += float(row.get("andel_anlaggningar") or 0)
        print(f"{out / name}  {row['myndighet']}  {row.get('anlaggningar')} anläggningar")

    write_tracking(tracking_path, list(tracking.values()))
    print(
        f"\n{len(rows)} brev skrivna. Skickade och besvarade ger de "
        f"{coverage:.1f} procent av landets anläggningar.\n"
        f"Skicka ett i taget, från din egen adress. Fyll i skickat och "
        f"diarienummer i {tracking_path}.",
        file=sys.stderr,
    )


def command_status(register: Sequence[dict], tracking: Sequence[dict], today: date) -> None:
    by_code = {r["myndighet_kod"]: r for r in register}
    share = {r["myndighet_kod"]: float(r.get("andel_anlaggningar") or 0) for r in register}

    have = sum(share[r["myndighet_kod"]] for r in register if r.get("status") == "inlast")
    fetchable = sum(
        share[r["myndighet_kod"]] for r in register if r.get("status") == "oppen_data"
    )
    print(f"Täckning i dag: {have:.1f} procent av anläggningarna är inlästa.")
    if fetchable:
        print(f"Ytterligare {fetchable:.1f} procent går att hämta utan att fråga.")

    counts: Dict[str, int] = {}
    won = 0.0
    for row in tracking:
        outcome = row.get("utfall") or "utkast"
        counts[outcome] = counts.get(outcome, 0) + 1
        if outcome in ("komplett", "delvis"):
            won += share.get(row["myndighet_kod"], 0)
    if counts:
        print("\nÄrenden: " + ", ".join(f"{n} {k}" for k, n in sorted(counts.items())))
    if won:
        print(f"Utlämnat hittills: {won:.1f} procent av anläggningarna.")

    due = []
    for row in tracking:
        sent = (row.get("skickat") or "").strip()
        if not sent or row.get("utfall") in ("komplett", "avslag", "hanvisad"):
            continue
        days = (today - datetime.strptime(sent, "%Y-%m-%d").date()).days
        stage = max((d for d in FOLLOW_UP if days >= d), default=None)
        if stage is None:
            continue
        answered = (row.get("svar") or "").strip()
        reminded = (row.get("paminnelse_2") or row.get("paminnelse_1") or "").strip()
        if answered and stage < 30:
            continue
        if reminded:
            since = (today - datetime.strptime(reminded, "%Y-%m-%d").date()).days
            if since < 7:
                continue
        due.append((days, row, stage))

    if due:
        print("\nBehöver följas upp:")
        for days, row, stage in sorted(due, reverse=True):
            name = by_code.get(row["myndighet_kod"], row).get("myndighet", row["myndighet_kod"])
            print(f"  {days:3d} dagar  {name}: {FOLLOW_UP[stage]}")
    else:
        print("\nInget att följa upp i dag.")

    waiting = [r for r in tracking if (r.get("utfall") or "") == "utkast"]
    if waiting:
        print(f"\n{len(waiting)} brev är skrivna men inte skickade.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--register", type=Path, default=REGISTER)
    parser.add_argument("--sparning", type=Path, default=TRACKING)
    parser.add_argument("--ut", type=Path, default=LETTERS)
    parser.add_argument("--epost", help="avsändarens e-postadress, om den inte "
                                        "står i SENDER_EMAIL")
    parser.add_argument("--telefon")
    sub = parser.add_subparsers(dest="command", required=True)

    batch = sub.add_parser("omgang", help="skriv nästa omgång brev, störst först")
    batch.add_argument("--antal", type=int, default=10)

    write = sub.add_parser("skriv", help="skriv brev till angivna myndighetskoder")
    write.add_argument("koder", nargs="+")

    remind = sub.add_parser("paminnelse", help="skriv uppföljning för en myndighet")
    remind.add_argument("kod")
    remind.add_argument("--steg", type=int, choices=sorted(FOLLOW_UP), default=7)

    shortcut = sub.add_parser("livsmedelsverket", help="de två genvägsbreven")
    shortcut.add_argument("--mottagare", required=True,
                          help="Livsmedelsverkets registratoradress, verifierad")

    sub.add_parser("status", help="täckning, väntande ärenden och uppföljning")

    args = parser.parse_args()

    global SENDER_EMAIL, SENDER_PHONE
    if args.epost:
        SENDER_EMAIL = args.epost
    if args.telefon:
        SENDER_PHONE = args.telefon

    register = read_rows(args.register)
    if not register and args.command != "livsmedelsverket":
        parser.error(
            f"{args.register} saknas. Bygg registret först: "
            f"python3 pipeline/fetch_kommunregister.py"
        )
    tracking = read_rows(args.sparning)

    if args.command == "status":
        command_status(register, tracking, date.today())
        return

    if args.command == "livsmedelsverket":
        args.ut.mkdir(parents=True, exist_ok=True)
        for index, letter in enumerate(shortcut_letters(args.mottagare), start=1):
            path = args.ut / f"livsmedelsverket-genvag-{'ab'[index - 1]}.txt"
            path.write_text(letter.render(), encoding="utf-8")
            print(path)
        print("\nSkicka dem var för sig, med några dagar emellan.", file=sys.stderr)
        return

    if args.command == "paminnelse":
        row = next((r for r in tracking if r["myndighet_kod"] == args.kod), None)
        if row is None:
            parser.error(f"{args.kod} finns inte i {args.sparning}")
        if not (row.get("skickat") or "").strip():
            parser.error(f"{args.kod} har inget skickat-datum, det finns inget att påminna om")
        letter = reminder_letter(row, args.steg)
        path = args.ut / f"{args.kod}-paminnelse-{args.steg}.txt"
        path.write_text(letter.render(), encoding="utf-8")
        print(path)
        return

    by_code = {r["myndighet_kod"]: r for r in register}
    if args.command == "skriv":
        unknown = [k for k in args.koder if k not in by_code]
        if unknown:
            parser.error(f"okända myndighetskoder: {', '.join(unknown)}")
        rows = [by_code[k] for k in args.koder]
    else:
        rows = eligible(register, {r["myndighet_kod"]: r for r in tracking})[: args.antal]
        if not rows:
            print("Ingen myndighet är redo att få ett brev. Antingen saknas "
                  "verifierade mottagare i kontaktfilen, eller så är alla "
                  "redan skickade.", file=sys.stderr)
            return

    write_letters(rows, args.ut, args.sparning)


if __name__ == "__main__":
    main()
