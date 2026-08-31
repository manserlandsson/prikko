#!/usr/bin/env python3
"""Skriv begäran om utlämnande, en åt gången, till en myndighet i taget.

    python3 pipeline/begaran.py omgang --antal 10     # nästa omgång
    python3 pipeline/begaran.py skriv 1480 1280       # bestämda myndigheter
    python3 pipeline/begaran.py paminnelse 1480       # uppföljning i samma tråd
    python3 pipeline/begaran.py livsmedelsverket      # de två genvägsbreven
    python3 pipeline/begaran.py status                # vad väntar, vad brådskar

**Skriptet skickar ingenting.** Det skriver textfiler till `data/begaran/`,
ett brev per fil med mottagare och ämnesrad överst, plus `00-las-mig.txt` som
säger vad ägaren ska göra med dem.
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


#: Räkneord upp till tjugo. Ett litet tal skrivet med siffror mitt i en mening
#: ser ut som ett formulärfält, och brevet ska se skrivet ut.
NUMERALS = (
    "noll", "en", "två", "tre", "fyra", "fem", "sex", "sju", "åtta", "nio",
    "tio", "elva", "tolv", "tretton", "fjorton", "femton", "sexton",
    "sjutton", "arton", "nitton", "tjugo",
)


def numeral(value: int) -> str:
    return NUMERALS[value] if 0 <= value < len(NUMERALS) else thousands(str(value))


def loaded_count(register: Iterable[dict]) -> int:
    """Antalet kommuner vi redan läst in, räknat ur registret.

    Talet stod tidigare utskrivet i brevtexten. En hårdkodad siffra i ett brev
    är en siffra som blir fel, och den blev det: den sa tolv sedan den
    trettonde kommunen lästes in. Kommuner räknas, inte myndigheter, eftersom
    det är kommuner mottagaren känner igen.
    """
    return len({
        name
        for row in register
        if (row.get("status") or "") == "inlast"
        for name in (row.get("kommuner") or "").split(";")
        if name
    })


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
    inlämnat.

    Tre årgångar, inte fem, trots att färskhetsfönstret i `prikko/grading.py`
    är fem år sedan version 5. Talet följer inte fönstret utan handläggarens
    arbete: årsuttaget ur verksamhetssystemet är en fil per rapporteringsår,
    och tre filer är en begäran någon hinner besvara på en eftermiddag. Brevet
    ber dessutom uttryckligen om hela beståndet när det är enklare än att
    filtrera på datum, så en myndighet som vill ge mer hindras inte. Vi
    publicerar allt vi får som ryms i fönstret; vi ber bara inte om det.
    """
    latest = today.year - 1 if today.month > 1 else today.year - 2
    return [latest, latest - 1, latest - 2]


def request_letter(row: dict, loaded: int, today: Optional[date] = None) -> Letter:
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
        f"konsumenter och har hittills läst in {numeral(loaded)} kommuner: "
        f"{SENDER_SITE}.",
        # Papperspärren står här och inte längre ned. JO dnr 1922-2024:
        # Skinnskatteberg lämnade ut drygt 15 000 sidor för omkring 30 000
        # kronor utan att varna först. Det är den enda posten i kalkylen som
        # kan bli fyrsiffrig, och den avväpnas bara om spärren står så tidigt
        # att den läses innan någon går till skrivaren.
        "Allt vi ber om finns digitalt, och vi vill inte ha papperskopior. "
        "Skulle uttaget bli en stor utskrift, hör av er först så avgränsar vi "
        "begäran i stället. Helst tar vi emot XML, CSV, Excel eller JSON, men "
        "en PDF-fil går också bra eftersom vi läser sådana redan.",
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
        # HFD 2025 not. 20: att räkna fram ett värde ur uppgifter som redan
        # finns är inte en rutinbetonad åtgärd, och då är sammanställningen
        # inte en allmän handling. Vi ber alltså om råposter och räknar själva.
        "Jag ber inte om några sammanställda eller uträknade tal, bara om "
        "uppgifterna som de står. Är det enklare att exportera hela beståndet "
        "än att filtrera på datum, gör gärna det. Vi sorterar själva.",
        "Vi behöver inte organisationsnummer, och inga personuppgifter utöver "
        "det företagsnamn och den besöksadress som redan är offentliga. "
        "Dricksvattenanläggningar kan lämnas utanför.",
        "Tar ni ut en avgift ber jag er meddela beloppet innan uttaget görs, så "
        "tar jag ställning först. Kan någon del inte lämnas ut ber jag om ett "
        "skriftligt beslut med besvärshänvisning.",
        "Uppgifterna publiceras på prikko.se med kommunen som källa och med "
        "kontrolldatum. Hela bedömningsmetoden är publik, varje verksamhet kan "
        "publicera ett eget svar intill sin kontroll, och vi rättar fel så "
        "snart de påtalas.",
        "Rättslig grund: 2 kap. tryckfrihetsförordningen. Begäran görs också "
        "som en begäran om tillgängliggörande av data för vidareutnyttjande "
        "enligt lagen (2022:818) om den offentliga sektorns tillgängliggörande "
        "av data.",
        "Vill ni hellre publicera uppgifterna som öppna data än att skicka dem "
        "till mig går det lika bra. Sambruk och NSÖD har tagit fram en "
        "nationell specifikation för just livsmedelsinspektioner."
        if status == "sammanfattning" else None,
        "Hör gärna av er om något är oklart eller om uttaget blir omfattande, "
        "så avgränsar vi det tillsammans.",
    )
    parts = [body, "", signature(), ""]

    span = f"{reported[2]} till {reported[0]}"
    to = (row.get("mottagare") or "").strip()
    registrar = (row.get("registrator") or "").strip()
    return Letter(
        to=to,
        cc=registrar if registrar and registrar != to else "",
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

    to = (row.get("mottagare") or "").strip()
    registrar = (row.get("registrator") or "").strip()
    return Letter(
        to=to,
        cc=registrar if registrar and registrar != to else "",
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
            "är en begäran om tillgängliggörande av data för vidareutnyttjande.",
            "",
            "Vi vill inte ha papperskopior. Skulle uttaget bli en stor utskrift,",
            "hör av er först så avgränsar vi begäran i stället.",
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


#: Filen som ligger överst i katalogen och säger vad ägaren ska göra. Den
#: skrivs om vid varje omgång, eftersom en instruktion som beskriver förra
#: omgången är sämre än ingen instruktion alls.
README = "00-las-mig.txt"


def batch_readme(rows: Sequence[dict], tracking_path: Path,
                 coverage: float, names: Sequence[str]) -> str:
    """Följesedeln till omgången: vad som ligger här och vad som ska göras."""
    lines = [
        f"Omgång skriven {date.today().isoformat()}",
        "",
        f"{len(rows)} brev, "
        f"{thousands(str(sum(int(r.get('anlaggningar') or 0) for r in rows)))} "
        f"anläggningar, {coverage:.1f} procent av landets bestånd.",
        "",
        "SÅ HÄR GÖR DU",
        "",
        "0. Kontrollera först att brevlådan i signaturen tar emot post. Skicka",
        f"   ett testmejl till {SENDER_EMAIL or 'mans@prikko.se'} och se att det",
        "   kommer fram, se docs/13. Ett brev med en svarsadress som studsar är",
        "   värre än inget brev: myndigheten svarar, svaret försvinner, och vi",
        "   tror att de tigit.",
        "1. Öppna filerna i nummerordning. Numret är prioriteringen: störst",
        "   först, räknat i anläggningar. Hoppa gärna över en om du vill, men",
        "   börja uppifrån.",
        "2. Varje fil har Till, eventuell Kopia och Ämne på de första raderna.",
        "   Klistra in dem i mejlet och brödtexten under. Skicka från din egen",
        f"   adress, {SENDER_EMAIL or 'mans@prikko.se'}, ett mejl i taget.",
        "3. Skicka inte allt på en dag. Fem till åtta om dagen räcker: kommer",
        "   svaren utspritt hinner du läsa dem, och en handläggare som ringer",
        "   en kollega i grannkommunen ska inte höra att alla fick samma mejl",
        "   samma förmiddag.",
        f"4. Fyll i datum i kolumnen skickat i {tracking_path}",
        "   direkt när mejlet gått, och sätt utfall till vantar. Kommer det",
        "   ett diarienummer i svaret, skriv in det också. Utan skickat-datum",
        "   kan ingenting följas upp, för då vet skriptet inte när tystnaden",
        "   började.",
        "5. Kör  python3 pipeline/begaran.py status  ungefär varannan dag. Den",
        "   säger vem som behöver en påminnelse och vilken sorts påminnelse.",
        "",
        "TRE SAKER SOM INTE SKA GÖRAS",
        "",
        "- Fyll aldrig i en kommuns e-tjänst maskinellt. Anvisar de en e-tjänst",
        "  klistrar du in texten där för hand, eller mejlar ändå: ingen är",
        "  skyldig att använda en e-tjänst för att begära ut en allmän handling.",
        "- Betala aldrig för en pappersutskrift. Brevet ber uttryckligen om att",
        "  bli varnad först, så kommer det ett prisbesked är svaret att vi tar",
        "  filen i stället.",
        "- Svara aldrig på frågan vem du är som villkor för utlämnandet. Att",
        "  frivilligt berätta är bra och står redan i brevet. Att kräva det är",
        "  förbjudet enligt 2 kap. 18 § tryckfrihetsförordningen.",
        "",
        "BREVEN",
        "",
    ]
    lines.extend(names)
    lines.append("")
    return "\n".join(lines)


def write_letters(rows: Sequence[dict], out: Path, tracking_path: Path,
                  loaded: int) -> None:
    out.mkdir(parents=True, exist_ok=True)
    tracking = {r["myndighet_kod"]: r for r in read_rows(tracking_path)}

    coverage = 0.0
    listing: List[str] = []
    for order, row in enumerate(rows, start=1):
        letter = request_letter(row, loaded)
        # Filnamnet bär kommunen och inte myndighetens namn, eftersom ägaren
        # letar efter Göteborg och inte efter Miljöförvaltningen. En gemensam
        # nämnd är undantaget: där är förbundets namn det han känner igen, och
        # "essunga" för Miljösamverkan östra Skaraborg hade bara varit den
        # kommun som råkade stå först i registret. Numret först gör att
        # katalogen sorterar sig i den ordning breven ska gå.
        names = [n for n in (row.get("kommuner") or "").split(";") if n]
        first = names[0] if len(names) == 1 else row.get("myndighet", "")
        name = f"{order:02d}-{row['myndighet_kod']}-{slug(first)}.txt"
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
        listing.append(
            f"  {name}  {row['myndighet']}, "
            f"{thousands(row.get('anlaggningar') or '')} anläggningar"
        )
        print(f"{out / name}  {row['myndighet']}  {row.get('anlaggningar')} anläggningar")

    (out / README).write_text(
        batch_readme(rows, tracking_path, coverage, listing), encoding="utf-8"
    )
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
        args.ut.mkdir(parents=True, exist_ok=True)
        path = args.ut / f"{args.kod}-paminnelse-{args.steg}.txt"
        path.write_text(letter.render(), encoding="utf-8")
        print(path)
        if args.steg == 45:
            # Steg 45 i schemat är ett beslut och inte ett brev. Texten är
            # med avsikt densamma som steg 30, så att den som ändå vill
            # skicka en sista gång slipper skriva om den. Skickar man den
            # två gånger blir det ett upprepat mejl, och det är sämre än
            # tystnad.
            print("Steg 45 är beslutspunkten: överklaga eller lägg åt sidan. "
                  "Brevet är samma text som steg 30, så skicka det bara om "
                  "steg 30 aldrig gick i väg.", file=sys.stderr)
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

    write_letters(rows, args.ut, args.sparning, loaded_count(register))


if __name__ == "__main__":
    try:
        main()
    except Missing as stop:
        # Det här är alltid något ägaren ska rätta, aldrig en bugg. En
        # stackspårning skulle dölja meningen som säger vad som fattas.
        print(stop, file=sys.stderr)
        raise SystemExit(1)
