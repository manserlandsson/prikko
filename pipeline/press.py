#!/usr/bin/env python3
"""Skriv ett pressunderlag per kommun, byggt på rörelsen i registret.

    python3 pipeline/press.py utskick --epost mans@prikko.se
    python3 pipeline/press.py utskick --kommun stockholm --epost ...
    python3 pipeline/press.py granska        # formkontrollen, utan att skriva
    python3 pipeline/press.py status         # vilka kommuner som har material

**Skriptet skickar ingenting, och det kan inte skicka någonting.** Det
importerar inget nätverksbibliotek, det slår inte upp någon adress, och det
har ingen mottagarlista. Det skriver textfiler till `data/press/`, ett
utskick per fil, plus `00-las-mig.txt` som säger vad ägaren ska göra med dem.
Att skicka är ägarens beslut, ett mejl i taget, från ägarens egen adress.
Samma ordning som `begaran.py`, och av samma skäl: ett skript som både
formulerar och skickar är ett massutskick oavsett vad det heter.

Till-raden lämnas därför medvetet ofylld. Ingen redaktionsadress hämtas
automatiskt, varken ur en fil eller från nätet. Vem som är rätt mottagare står
i `00-las-mig.txt` och i `docs/59_gtm.md` §14, som en beskrivning av vilken
FUNKTION på en redaktion som tar emot den här sortens underlag, aldrig som en
adressbok.

## Varför rörelsen och inte kontrollresultaten

`docs/59_gtm.md` §7.3 mätte att Boolis pressmaskin bar dem i tretton år utan
en enda annons, och att den bar därför att den skickade återkommande
statistik ur data ingen annan hade. Den skickade inte anklagelser. Vårt
motsvarande material är rörelsen: 112 verksamheter tillkom i kommunernas
register och sju försvann på 28 dagar, räknat 2026-09-05. Det är den enda
uppgift vi har som är ny varje månad, lokal, och helt fri från omdöme.

En granskning går att göra en gång och bara genom att peka ut någon. Rörelsen
går att skicka varje månad utan att peka ut någon alls. Det är hela
skillnaden, och det är skälet till att `docs/26` §4.6 lämnade matsnusklistan
där den ligger, som en PR-tillgång vi inte skickar.

## Fyra regler i formen, och de är villkor och inte önskemål

Reglerna står i `docs/59_gtm.md` §10.2 och i `docs/45_entreprenorslistan.md`
B5. Här är de byggda in i koden, så att de inte kan glömmas bort i en
framtida omskrivning:

1. **Aldrig en rangordning av kommuner.** Ett utskick bär bara sin egen
   kommuns tal. `granska()` fäller ett utskick som nämner en annan kommun.
   Att bara skicka till de kommuner som ser dåliga ut vore samma fel i
   förklädnad, så urvalet är mekaniskt och kan inte handplockas: ett utskick
   skrivs för varje kommun som har en publicerad rörelsesida, alltså samma
   villkor som `MIN_MOVEMENT_PAGE` i `site/src/lib/rorelse.ts` sätter för
   sajten, och för ingen annan.
2. **Aldrig en lista över de sämsta, och aldrig en namngiven verksamhet.**
   `granska()` fäller ett utskick som innehåller namnet på någon av
   kommunens verksamheter, och en ordlista fäller "sämst", "värst",
   "topplista" och deras släktingar.
3. **Aldrig en verksamhet i rubriken.** Ämnesraden byggs av en mall som bara
   känner ortnamnet, perioden och ett tal, och samma namnkontroll körs på
   den.
4. **Varje tal ska gå att slå upp på sajten, med länk.** Talen bor i en lista
   av `Fakta`, och både brödtexten och avsnittet "Så kontrollerar ni varje
   tal" renderas ur samma lista. Ett tal utan adress går alltså inte att
   skriva, och `granska()` letar dessutom upp varje siffergrupp i brödtexten
   och kräver att den finns bland fakta. En redaktion som inte kan verifiera
   oss citerar oss inte två gånger.

## Talen kommer ur sajtens egna filer, inte ur en egen räkning

Allt läses ur `site/src/data/`, alltså exakt de filer sajten byggs av. Det är
inte en bekvämlighet utan hela grunden för regel fyra: räknade vi själva ur
databasen skulle utskicket och sajten kunna säga olika saker samma dag, och
då är länken i utskicket värdelös. Följden är att sajten måste vara byggd och
utlagd på samma data innan ett utskick går i väg, och det står som steg noll i
`00-las-mig.txt`.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import textwrap
import unicodedata
from dataclasses import dataclass, field
from datetime import date, datetime
from pathlib import Path
from typing import Dict, List, Optional, Sequence

DATA = Path("site/src/data")
MOVEMENT = DATA / "rorelse"
OUT = Path("pipeline/data/press")
README = "00-las-mig.txt"

SITE = "https://prikko.se"

#: Avsändaren. Samma uppgifter som i `begaran.py`, och av samma skäl: ett
#: utskick utan namn och organisation är ett anonymt tips, och ett anonymt
#: tips publiceras inte.
SENDER_NAME = "Måns Erlandsson"
SENDER_COMPANY = "Magoed AB"
SENDER_ORG_NR = "559386-1015"
#: Fylls i av ägaren, precis som i begaran.py. En prikko.se-adress och inte en
#: privat: mottagaren ska kunna se att avsändaren är den sajt underlaget
#: hänvisar till. Tom adress är också den yttersta spärren mot att ett utskick
#: skrivs färdigt av misstag.
SENDER_EMAIL = ""

#: Minsta antal händelser för att kommunen ska få ett utskick.
#:
#: Samma tal som MIN_MOVEMENT_PAGE i site/src/lib/rorelse.ts, och det är inget
#: sammanträffande: under gränsen finns ingen rörelsesida, och utan sida finns
#: ingen adress där redaktionen kan slå upp talen. Regel fyra sätter alltså
#: urvalet, inte en bedömning av hur kommunen ser ut. Ändras talet i rorelse.ts
#: ska det ändras här samma dag.
MIN_MOVEMENT_PAGE = 12

#: Radbredd. Samma som breven i begaran.py: mejl läses lika ofta i en smal
#: ruta som i ett fönster.
WIDTH = 72

MONTHS = (
    "januari", "februari", "mars", "april", "maj", "juni",
    "juli", "augusti", "september", "oktober", "november", "december",
)

#: Räkneord upp till tjugo. Ett litet tal skrivet med siffror mitt i en mening
#: ser ut som ett formulärfält, och utskicket ska se skrivet ut. Samma lista
#: som begaran.py bär.
NUMERALS = (
    "noll", "en", "två", "tre", "fyra", "fem", "sex", "sju", "åtta", "nio",
    "tio", "elva", "tolv", "tretton", "fjorton", "femton", "sexton",
    "sjutton", "arton", "nitton", "tjugo",
)

#: Ord som gör underlaget till en skamlista. Listan är kort med flit: den ska
#: fånga den glidning som faktiskt hotar, inte censurera texten. Träffas ett
#: ord är svaret att skriva om meningen, aldrig att stryka ordet ur listan.
#:
#: "nyöppnat" och "stängt" står med av ett annat skäl än de övriga. De är inte
#: nedsättande, de är osanna: vi har observerat att ett anläggnings-id dök upp
#: eller slutade lämnas ut, ingenting mer. Se huvudet på lib/rorelse.ts.
FORBIDDEN = (
    "sämst", "värst", "bäst i", "bättre än", "sämre än", "topplista",
    "rangordn", "skamlist", "värsting", "matsnusk", "svarta lista",
    "nyöppnad", "nyöppnat", "nyöppnade", "stängde", "stängt ner", "lagt ner",
    "nedlagd", "gick i konkurs",
)


class Missing(RuntimeError):
    """Något som måste vara ifyllt är det inte."""


class FormError(RuntimeError):
    """Utskicket bryter mot en av de fyra formreglerna."""


# ---------------------------------------------------------------------------
# Läsning
# ---------------------------------------------------------------------------


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def swedish_date(iso: str) -> str:
    """2026-08-08 blir "8 augusti". Utan år: perioden ligger i samma år."""
    d = datetime.strptime(iso[:10], "%Y-%m-%d").date()
    return f"{d.day} {MONTHS[d.month - 1]}"


def swedish_date_full(iso: str) -> str:
    d = datetime.strptime(iso[:10], "%Y-%m-%d").date()
    return f"{d.day} {MONTHS[d.month - 1]} {d.year}"


def thousands(value: int) -> str:
    """5418 blir 5 418. Svenskt tusentalsmellanrum, inte komma."""
    return f"{value:,}".replace(",", " ")


def numeral(value: int) -> str:
    return NUMERALS[value] if 0 <= value < len(NUMERALS) else thousands(value)


def fold(text: str) -> str:
    """Gemener utan diakriter, för jämförelser som inte ska fastna på Ö."""
    plain = unicodedata.normalize("NFKD", text.lower())
    return "".join(c for c in plain if not unicodedata.combining(c))


# ---------------------------------------------------------------------------
# Talen
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class Fakta:
    """Ett tal, dess betydelse och adressen där det går att slå upp.

    Regel fyra bor i den här klassen. Brödtexten läser `value`, avsnittet
    "Så kontrollerar ni varje tal" läser alla tre, och det finns ingen väg att
    skriva ett tal i utskicket utan att samtidigt ange var det står.
    """

    label: str
    value: int
    url: str
    #: Var på sidan talet står, för den som inte vill leta.
    where: str = ""

    @property
    def text(self) -> str:
        return thousands(self.value)


@dataclass
class Underlag:
    """Allt ett utskick behöver veta om en kommun."""

    slug: str
    city: str
    authority: str
    frm: str
    to: str
    deliveries: int
    arrived: int
    departed: int
    fetched: Optional[str]
    facts: List[Fakta] = field(default_factory=list)
    #: Verksamhetsnamn i kommunen. Bara till för namnkontrollen i granska().
    names: List[str] = field(default_factory=list)

    @property
    def events(self) -> int:
        return self.arrived + self.departed

    def fact(self, label: str) -> Fakta:
        for f in self.facts:
            if f.label == label:
                return f
        raise KeyError(label)


def underlag(slug: str) -> Optional[Underlag]:
    """Bygg underlaget för en kommun, eller None när rörelsen är för liten.

    Talen räknas ur samma filer som sajten byggs av, se modulens huvud.
    """
    movement_file = MOVEMENT / f"{slug}.json"
    kommun_file = DATA / f"{slug}.json"
    if not movement_file.exists() or not kommun_file.exists():
        return None

    move = read_json(movement_file)
    events = move.get("events") or []
    if len(events) < MIN_MOVEMENT_PAGE:
        return None
    if not move.get("observedFrom") or not move.get("observedTo"):
        return None

    kommun = read_json(kommun_file)
    city = move["municipality"]["city"]
    establishments = kommun["establishments"]
    frm = move["observedFrom"][:10]
    to = move["observedTo"][:10]

    arrived = sum(1 for e in events if e["kind"] == "ny")
    departed = len(events) - arrived

    # Fördelningen, exakt de fyra posterna kommunsidans rad visar och med
    # kommunsidans egna etiketter. Räknas på `verdict` och ingenting annat,
    # för det är fältet raden läser.
    verdicts: Dict[Optional[str], int] = {"clean": 0, "minor": 0, "major": 0, None: 0}
    for e in establishments:
        verdicts[e["verdict"]] = verdicts.get(e["verdict"], 0) + 1

    # Kontrollerna i perioden, räknade som VERKSAMHETER vars senaste kontroll
    # ligger i fönstret. Inte som antal kontroller, och skillnaden är inte
    # kosmetisk: ett ställe som kontrollerats två gånger på fyra veckor ska
    # räknas en gång, och det är dessutom den enda formen som går att slå upp.
    # Kommunens listsida visar varje rad med kontrolldatum och utfall, och
    # /api/v1/kommun/<kommun>.json bär samma två fält som `latest`.
    checked = {0: 0, 1: 0, 2: 0}
    for e in establishments:
        inspections = e.get("inspections") or []
        if not inspections:
            continue
        latest = max(inspections, key=lambda i: i["date"])
        if frm <= latest["date"] <= to:
            checked[latest["assessment"]] = checked.get(latest["assessment"], 0) + 1

    kommun_url = f"{SITE}/{slug}/"
    api_url = f"{SITE}/api/v1/kommun/{slug}.json"
    movement_url = f"{SITE}/{slug}/nytt-och-borta/"

    facts = [
        Fakta("Tillkomna i perioden", arrived, movement_url,
              "svarsmeningen överst, och varje rad med namn, adress och datum"),
        Fakta("Försvunna i perioden", departed, movement_url,
              "samma mening, och raderna under Försvunna"),
        Fakta("Verksamheter i registret", len(establishments), kommun_url,
              "meningen under rubriken"),
        Fakta("Utan anmärkningar", verdicts["clean"], kommun_url,
              "raden Fördelning i kommunen"),
        Fakta("Med brister", verdicts["minor"], kommun_url, "samma rad"),
        Fakta("Med brister som kvarstår", verdicts["major"], kommun_url, "samma rad"),
        Fakta("Utan bedömning", verdicts[None], kommun_url, "samma rad"),
        Fakta("Kontrollerade i perioden", sum(checked.values()), api_url,
              "raderna där latest.date ligger i perioden"),
        Fakta("Därav utan anmärkningar", checked[0], api_url,
              "samma rader, latest.assessment = 0"),
        Fakta("Därav med anmärkningar", checked[1], api_url,
              "samma rader, latest.assessment = 1"),
        Fakta("Därav med kvarstående anmärkningar", checked[2], api_url,
              "samma rader, latest.assessment = 2"),
        Fakta("Avlästa utlämningar i perioden", move.get("deliveries") or 0,
              f"{SITE}/kallor/", "kommunens rad, med källa och hämtdatum"),
    ]

    return Underlag(
        slug=slug,
        city=city,
        authority=kommun["municipality"]["name"],
        frm=frm,
        to=to,
        deliveries=move.get("deliveries") or 0,
        arrived=arrived,
        departed=departed,
        fetched=(kommun.get("source") or {}).get("fetchedAt"),
        facts=facts,
        names=[e["name"] for e in establishments]
        + [e["name"] for e in events],
    )


def alla_underlag() -> List[Underlag]:
    """Varje kommun med en publicerad rörelsesida, i bokstavsordning.

    Ordningen är ortnamnets, alltså samma som `municipalities()` ger på
    sajten. Sorterad på antal händelser hade katalogen blivit en rangordning
    så snart någon läste filnamnen i ordning.
    """
    found = []
    for path in sorted(MOVEMENT.glob("*.json")):
        u = underlag(path.stem)
        if u is not None:
            found.append(u)
    return sorted(found, key=lambda u: fold(u.city))


# ---------------------------------------------------------------------------
# Utskicket
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class Utskick:
    to: str
    subject: str
    body: str

    def render(self) -> str:
        return f"Till: {self.to}\nÄmne: {self.subject}\n\n{self.body}"


def paragraphs(*blocks: Optional[str]) -> str:
    """Stycken radbrutna på WIDTH och åtskilda av tomrad.

    Rader som börjar med "1. " eller "- " får hängande indrag så att
    uppräkningen håller ihop. `None` hoppas över, vilket gör att ett villkorat
    stycke kan skrivas som ett uttryck i stället för som en if-sats mitt i
    texten. Samma funktion som begaran.py, och den ska förbli samma.
    """
    written = []
    for block in blocks:
        if block is None:
            continue
        stripped = " ".join(block.split())
        if re.match(r"^\d+\. ", stripped):
            indent = "   "
        elif stripped.startswith("- "):
            indent = "  "
        else:
            indent = ""
        written.append(
            textwrap.fill(
                stripped,
                width=WIDTH,
                subsequent_indent=indent,
                break_long_words=False,
                break_on_hyphens=False,
            )
        )
    return "\n\n".join(written)


def heading(text: str) -> str:
    """Avsnittsrubrik. Versaler och en tomrad, ingen dekor.

    Ett mejl som ska läsas av någon med tjugo olästa behöver kunna skummas.
    Understreck av bindestreck hade brutits av mottagarens klient.
    """
    return text.upper()


def signature() -> str:
    if not SENDER_EMAIL:
        raise Missing(
            "SENDER_EMAIL är tom i pipeline/press.py. Ett utskick utan "
            "svarsadress går inte att följa upp, och en redaktion som inte "
            "kan fråga oss något publicerar inte. Ange --epost, eller skriv "
            "in prikko.se-adressen i filen."
        )
    return (
        "Vänliga hälsningar\n"
        f"{SENDER_NAME}\n"
        f"{SENDER_COMPANY}, org.nr {SENDER_ORG_NR}\n"
        f"{SENDER_EMAIL} · {SITE}"
    )


def subject_line(u: Underlag) -> str:
    """Ämnesraden.

    Formen är "så ser kontrollen ut i din kommun" och aldrig "här är stället
    du ska undvika", `docs/45` B5. Mallen känner bara ortnamnet, perioden och
    ett tal, alltså finns det ingen väg för ett verksamhetsnamn att hamna
    här. Tillkomna leder när det finns några: det är den större delen av
    rörelsen i varje kommun vi har mätt, och en rubrik som leder med det som
    försvunnit läser som en nedläggningsnotis även när talet är sju.
    """
    when = swedish_date(u.frm)
    if u.arrived:
        return (
            f"Så ser livsmedelskontrollen ut i {u.city}: "
            f"{u.arrived} verksamheter har tillkommit sedan {when}"
        )
    return (
        f"Så ser livsmedelskontrollen ut i {u.city}: "
        f"{u.events} förändringar i registret sedan {when}"
    )


def fact_lines(u: Underlag) -> str:
    """Talen med sin adress, ett per rad.

    Renderas ur samma `Fakta`-lista som brödtexten läser, se klassens huvud.
    Raden bryts för hand och inte av textwrap: en URL som bryts mitt itu blir
    en URL som inte går att klicka på.
    """
    lines = []
    for f in u.facts:
        lines.append(f"  {f.label}: {f.text}")
        lines.append(f"    {f.url}")
        if f.where:
            lines.append(f"    ({f.where})")
    return "\n".join(lines)


def utskick(u: Underlag) -> Utskick:
    period = f"{swedish_date(u.frm)} och den {swedish_date(u.to)}"
    # "noll försvann" är inte svenska, och "0 hade kvarstående anmärkningar"
    # läser som ett formulärfält. Nollan skrivs som ord, resten som siffror:
    # talen är underlagets poäng och ska gå att kopiera.
    departed_word = "ingen" if u.departed == 0 else numeral(u.departed)
    arrived_word = thousands(u.arrived)
    checked = u.fact("Kontrollerade i perioden")
    clean = u.fact("Därav utan anmärkningar")
    minor = u.fact("Därav med anmärkningar")
    major = u.fact("Därav med kvarstående anmärkningar")

    body = "\n\n".join(part for part in [
        paragraphs(
            "Hej,",
            f"jag driver Prikko, en sajt som läser kommunernas egna "
            f"livsmedelskontroller och visar hur varje verksamhet klarade sin "
            f"senaste. Det här är ett underlag om {u.city}, och det innehåller "
            f"bara {u.city}s egna uppgifter. Ni får använda talen fritt med "
            f"Prikko som källa.",
        ),
        heading("Rörelsen i registret"),
        paragraphs(
            f"Mellan den {period} tillkom {arrived_word} livsmedelsverksamheter "
            f"i {u.city}s register och {departed_word} försvann ur det. "
            f"Underlaget är {u.authority}s egen utlämning, som vi läser varje "
            f"natt, och perioden bygger på {numeral(u.deliveries)} avlästa "
            f"utlämningar.",
            "Reservationen hör till uppgiften och inte till en fotnot. Vi vet "
            "inte när en verksamhet startade eller upphörde, och ingen källa "
            "säger det. Det vi har observerat är smalare: ett anläggnings-id "
            "dök upp i kommunens utlämning, eller slutade lämnas ut.",
            "Att en rad tillkommit betyder alltså inte med säkerhet att en ny "
            "lokal slagit upp dörrarna, och att en rad försvunnit betyder inte "
            "med säkerhet att någon upphört. Det kan lika gärna vara ett byte "
            "av anläggnings-id eller att kommunen lagt om sitt register. "
            "Sådant filtrerar vi bort så långt det går, men orden i uppgiften "
            "är tillkommit och försvunnit av just det skälet, och de håller "
            "även när filtret missar något.",
            f"Varje rad ligger uppe med namn, adress och datum: "
            f"{u.fact('Tillkomna i perioden').url}",
        ),
        heading("Kontrollbilden i kommunen"),
        paragraphs(
            f"Under samma period fick {checked.text} verksamheter i {u.city} en "
            f"kontroll som nu är den senaste i registret. {clean.text} av dem "
            f"hade inga anmärkningar, {minor.text} hade anmärkningar och "
            f"{'inga' if major.value == 0 else major.text} hade kvarstående "
            f"anmärkningar. Utfallet är kommunens egen bedömning av kontrollen "
            f"och inte vår.",
            f"Räknat på hela registret har {u.city} "
            f"{u.fact('Verksamheter i registret').text} verksamheter: "
            f"{u.fact('Utan anmärkningar').text} utan anmärkningar vid sin "
            f"senaste kontroll, {u.fact('Med brister').text} med brister, "
            f"{u.fact('Med brister som kvarstår').text} med brister som "
            f"kvarstår och {u.fact('Utan bedömning').text} utan bedömning, "
            f"antingen för att ingen kontroll är publicerad eller för att den "
            f"senaste är för gammal för att säga något om läget i dag.",
        ),
        heading("Så kontrollerar ni varje tal"),
        paragraphs(
            "Talen står på sajten och uppdateras varje natt, så ett tal här "
            "kan vara någon dag äldre än samma tal på adressen. Är de olika är "
            "sajten den som gäller.",
        ),
        fact_lines(u),
        heading("Vad det här inte är"),
        paragraphs(
            "Fyra saker jag inte skickar, och det är avsiktligt.",
            "1. Ingen ordning mellan kommuner. Kommunerna kontrollerar olika "
            "ofta, följer upp olika ofta och formulerar sina anmärkningar "
            "olika, så ett tal från en kommun går inte att ställa mot ett "
            f"annat. Skälet står utskrivet: {SITE}/metodik/",
            "2. Ingen lista sorterad på utfall, och ingen verksamhet utpekad "
            "som något att undvika.",
            "3. Ingen verksamhet nämnd vid namn i utskicket, inte heller som "
            "gott exempel. Nästa fråga blir annars vilka de andra är.",
            "4. Inget tal utan en adress där ni kan slå upp det själva.",
            "Det betyder också att jag inte väljer ut kommuner efter hur talen "
            "ser ut. Ett utskick skrivs för varje kommun där rörelsen är stor "
            "nog att ha en egen sida på sajten, och för ingen annan.",
        ),
        heading("Om ni vill gå vidare"),
        paragraphs(
            f"Varje verksamhet får svara på sin kontroll, och svaret publiceras "
            f"oredigerat intill den. Är en uppgift fel rättar vi den så snart "
            f"den påtalas: {SITE}/ratta/",
            f"Uppgifterna går att hämta maskinellt, och det finns ett flöde per "
            f"kommun med de senaste kontrollerna: {SITE}/api/",
            f"Källa och hämtdatum för varje kommun: {SITE}/kallor/",
            "Hör av er om något behöver kontrolleras, eller om ni vill ha "
            "samma underlag för en annan kommun. Det tar mig fem minuter.",
        ),
        signature(),
        "",
    ] if part is not None)

    return Utskick(
        # Ofylld med flit. Se modulens huvud: ingen adress hämtas automatiskt,
        # och en tom rad tvingar ägaren att välja mottagare med öppna ögon.
        # Vilken sorts redaktion som är rätt står i 00-las-mig.txt, alltså på
        # ett ställe och inte upprepat i varje fil.
        to=f"[fyll i själv: nyhetsdesken i {u.city}, se {README}]",
        subject=subject_line(u),
        body=body,
    )


# ---------------------------------------------------------------------------
# Formkontrollen
# ---------------------------------------------------------------------------


#: Namn kortare än så, eller namn utan mellanslag eller siffra, kontrolleras
#: inte. Skälet är falska träffar: "Kungsholmen", "Centralen" och "Grill" är
#: verksamhetsnamn i beståndet OCH vanliga ord. Ett namn som "Selene Pizza &
#: Pasta" är däremot ingens slump. Gränsen är satt för att fånga det som
#: faktiskt hotar och inte för att vara heltäckande, och den ersätter inte att
#: den som skickar läser texten.
NAME_MIN = 8


def granska(u: Underlag, text: str) -> List[str]:
    """Pröva ett färdigt utskick mot de fyra formreglerna.

    Returnerar en lista med fel. Tom lista betyder att formen håller, inte
    att texten är bra: den som skickar läser den ändå, `docs/59` §10.2 punkt
    fyra.
    """
    problems: List[str] = []
    folded = fold(text)

    # Regel 1: ingen annan kommun i utskicket.
    #
    # Både ortnamnet och myndighetens namn prövas, eftersom "Uppsala" och
    # "Uppsala kommun" är två olika strängar i filerna och bara den ena skulle
    # fastna på en ordgräns.
    for path in sorted(DATA.glob("*.json")):
        other = read_json(path)["municipality"]
        if other["slug"] == u.slug:
            continue
        for word in (other["city"], other["name"]):
            if re.search(rf"\b{re.escape(fold(word))}\b", folded):
                problems.append(
                    f"nämner {word}, alltså en annan kommun än {u.city}. Ett "
                    f"utskick med två kommuner i är en jämförelse."
                )

    # Regel 2: ingen verksamhet vid namn, och inget skamord.
    for name in u.names:
        if len(name) < NAME_MIN:
            continue
        if " " not in name and not any(c.isdigit() for c in name):
            continue
        if fold(name) in folded:
            problems.append(
                f"nämner verksamheten {name!r}. Ingen verksamhet får stå med "
                f"namn i ett utskick, inte ens som gott exempel."
            )
    for word in FORBIDDEN:
        # Ordgräns före och inte fri delsträng. Utan den fastnade "värst" i
        # "kvarstår" och "kvarstående", alltså i precis den formulering som
        # kommunens egen bedömning använder. Ingen gräns EFTER ordet, så att
        # böjningar och sammansättningar fortfarande fastnar.
        if re.search(rf"\b{re.escape(fold(word))}", folded):
            problems.append(
                f"innehåller {word!r}. Skriv om meningen, stryk inte ordet ur "
                f"FORBIDDEN."
            )

    # Regel 3: ingen verksamhet i rubriken. Kontrollen ovan täcker hela
    # texten inklusive ämnesraden, så här prövas bara att rubriken finns och
    # har den form mallen lovar.
    subject = next(
        (line[len("Ämne: "):] for line in text.splitlines() if line.startswith("Ämne: ")),
        "",
    )
    if not subject.startswith(f"Så ser livsmedelskontrollen ut i {u.city}"):
        problems.append(
            "har en ämnesrad som inte följer mallen. Formen är 'så ser "
            "kontrollen ut i din kommun' och ingenting annat."
        )

    # Regel 4: varje siffergrupp i texten ska finnas bland fakta.
    #
    # Datum, årtal och paragrafhänvisningar räknas inte som tal: de pekar inte
    # på något att slå upp i beståndet. Allt annat ska gå att hitta.
    def flat(value: str) -> str:
        """Ett tal med ett vanligt blanksteg mellan siffergrupperna.

        `thousands()` skriver hårt mellanslag, U+00A0, så att textwrap inte
        bryter "8 567" över två rader. Jämförelsen ska inte se skillnad på det
        och på det radbrott som ändå kan ligga där, alltså normaliseras båda
        sidor till samma tecken.
        """
        return re.sub(r"(?<=\d)\s(?=\d)", " ", value)

    known = {flat(f.text) for f in u.facts} | {str(f.value) for f in u.facts}
    known |= {str(n) for n in range(1, 5)}          # uppräkningarna 1. till 4.
    known |= {u.frm[:4], u.to[:4], str(date.today().year)}
    known |= {str(datetime.strptime(u.frm, "%Y-%m-%d").day),
              str(datetime.strptime(u.to, "%Y-%m-%d").day)}

    # URL-rader, Till-raden och organisationsnumret räknas inte. En adress,
    # en ofylld mottagarrad och ett registreringsnummer är inte tal om
    # beståndet, och Till-raden skriver ägaren ändå om för hand.
    body_only = "\n".join(
        line for line in text.splitlines()
        if "http" not in line and not line.startswith("Till: ")
    ).replace(SENDER_ORG_NR, "")
    body_only = flat(body_only)
    for token in re.findall(r"\d+(?: \d{3})*", body_only):
        if token in known:
            continue
        problems.append(
            f"innehåller talet {token!r} som inte står bland fakta. Varje "
            f"tal ska gå att slå upp på sajten, med länk."
        )

    return problems


# ---------------------------------------------------------------------------
# Filerna
# ---------------------------------------------------------------------------


def slugify(text: str) -> str:
    plain = fold(text).replace("å", "a").replace("ä", "a").replace("ö", "o")
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", plain)).strip("-")


def readme(rows: Sequence[Underlag], names: Sequence[str]) -> str:
    today = date.today().isoformat()
    lines = [
        f"PRESSUNDERLAG, skrivna {today}",
        "",
        f"{len(rows)} utskick ligger i den här katalogen, ett per kommun.",
        "Inget av dem är skickat, och skriptet kan inte skicka dem: det har",
        "ingen mejlkod och ingen mottagarlista. Du skickar dem själv, ett i",
        "taget, från din egen adress.",
        "",
        "SÅ HÄR GÖR DU",
        "",
        "0. Bygg och lägg ut sajten FÖRST, på samma data som de här filerna",
        "   är skrivna ur. Varje tal i utskicket bär en adress där mottagaren",
        "   ska kunna slå upp det, och en redaktion som klickar och får ett",
        "   annat tal hör aldrig av sig igen. Skriv om utskicken efter bygget",
        "   om det gått dagar emellan.",
        "1. Läs hela texten innan du skickar den. Formkontrollen har prövat de",
        "   fyra reglerna maskinellt, men den kan inte se om en mening är",
        "   otydlig. Ingen del av utskicket är maskinskriven prosa som inte",
        "   någon läst.",
        "2. Välj mottagare för hand. Till-raden är tom med flit, och det finns",
        "   ingen adressbok i repot. Vem mottagaren är som FUNKTION står",
        "   nedan, och hela underlaget i docs/59_gtm.md §14. Slå upp adressen",
        "   själv på redaktionens egen tipssida.",
        "3. Skicka till EN kommun först, inte till alla. docs/59 §13 steg 5:",
        "   det första utskicket går till lokalredaktionerna i en enda kommun,",
        "   så att formen kan rättas innan den nått tretton redaktioner.",
        "4. Skicka aldrig ett urval efter hur talen ser ut. Antingen alla",
        "   kommuner som har en fil här, eller en i taget i tur och ordning.",
        "   Att bara skicka till de kommuner som ser dåliga ut är en",
        "   rangordning även när inget utskick innehåller en.",
        "5. Får du svar: verksamheternas egna svar och rättelser går via",
        "   sajten, och en redaktion som vill ha mer data ska hänvisas till",
        "   /api/ och inte få en fil i ett mejl.",
        "",
        "TRE SAKER SOM INTE SKA GÖRAS",
        "",
        "- Lägg aldrig ihop två kommuner i ett utskick, och skicka aldrig en",
        "  tabell med flera kommuner bredvid varandra. Kommunerna bedömer",
        "  olika, så en jämförelse mellan dem vore inte en jämförelse utan en",
        "  osanning. Se docs/44 §3.8.",
        "- Nämn aldrig en verksamhet vid namn, inte heller på en följdfråga.",
        "  Frågar en redaktion vilka de dåliga är är svaret att listan finns",
        "  öppet på sajten och att vi inte pekar ut någon åt dem.",
        "- Skriv aldrig nyöppnat eller stängt. Vi har observerat att ett",
        "  anläggnings-id dök upp eller slutade lämnas ut, ingenting mer.",
        "  Skriver redaktionen fel efter att ha läst oss är det vårt fel.",
        "",
        "VEM MOTTAGAREN ÄR",
        "",
        "Kort version, hela underlaget med källor i docs/59_gtm.md §14.",
        "",
        "- Det är TVÅ olika desker på samma tidning, och kontrollmaterialet",
        "  hör till den första. Hygienkontroller ligger på NYHETSDESKEN, hos",
        "  den som bevakar kommunen och begär ut handlingar. Öppningar och",
        "  nedläggningar ligger på näringslivs- eller företagsdesken, som ofta",
        "  redan har ett veckoformat för nya bolag ur Bolagsverket.",
        "- Praktiskt tar NYHETSCHEFEN eller redaktionens TIPSFUNKTION emot",
        "  ett underlag som det här, och lägger sedan ut jobbet. Skriv till en",
        "  funktion och inte till en person: en namngiven reporter som är",
        "  ledig läser inte mejlet på tre veckor.",
        "- Lokaltidningarnas nyhetsredaktioner är förstahandsvalet. De gör",
        "  redan återkommande serier på det här materialet och begär ut",
        "  förelägganden för hand, alltså är tidsserien den dyra delen för",
        "  dem och den billiga delen för oss.",
        "- SVT:s regionala redaktioner gör samma material men som jämförelse",
        "  mellan kommuner. Det är precis den formen vi inte levererar, så",
        "  räkna med att de vill ha mer än vi ger dem. Skicka gärna, men",
        "  säg nej till att ta fram en jämförelse.",
        "- Branschmedia är fel mottagare för ett utskick per kommun: de är",
        "  nationella och har ingen lokal krok.",
        "",
        "UTSKICKEN",
        "",
    ]
    lines.extend(names)
    lines.append("")
    return "\n".join(lines)


def write(rows: Sequence[Underlag], out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    listing: List[str] = []
    failures: List[str] = []

    for order, u in enumerate(rows, start=1):
        text = utskick(u).render()
        problems = granska(u, text)
        if problems:
            failures.extend(f"{u.city}: {p}" for p in problems)
            continue
        name = f"{order:02d}-{slugify(u.city)}.txt"
        (out / name).write_text(text + "\n", encoding="utf-8")
        # Ingen tabell med tal, inte ens i ägarens egen innehållsförteckning.
        # Tre kommuner med varsitt tal under varandra ÄR en jämförelse, och
        # den enda anledningen att den skulle vara ofarlig här är att ingen
        # utomstående ser filen. Det är ett svagt skäl och det ska inte behöva
        # hålla: talen står i utskicken, ett per fil, precis som på sajten.
        listing.append(
            f"  {name}  {u.city}, {swedish_date_full(u.frm)} till "
            f"{swedish_date_full(u.to)}"
        )
        print(f"{out / name}  {u.city}  {u.events} händelser")

    if failures:
        # Ett utskick som bryter mot formen skrivs inte, och de andra skrivs
        # inte heller. En halv omgång i katalogen är sämre än ingen: nästa
        # gång någon öppnar den syns inte att en fil saknas.
        raise FormError(
            "Formkontrollen fäller:\n  " + "\n  ".join(failures)
        )

    (out / README).write_text(readme(rows, listing), encoding="utf-8")
    print(
        f"\n{len(rows)} utskick skrivna till {out}. Ingenting är skickat.\n"
        f"Läs {out / README} innan du rör dem.",
        file=sys.stderr,
    )


# ---------------------------------------------------------------------------
# Kommandon
# ---------------------------------------------------------------------------


def command_status(rows: Sequence[Underlag]) -> None:
    print(f"Rörelsesidor med underlag för ett utskick: {len(rows)}")
    for u in rows:
        print(
            f"  {u.city:14} {u.arrived:4} tillkomna  {u.departed:3} försvunna  "
            f"{swedish_date_full(u.frm)} till {swedish_date_full(u.to)}"
        )
    skipped = []
    for path in sorted(MOVEMENT.glob("*.json")):
        if any(u.slug == path.stem for u in rows):
            continue
        data = read_json(path)
        skipped.append((data["municipality"]["city"], len(data.get("events") or [])))
    if skipped:
        print(
            f"\nUnder gränsen på {MIN_MOVEMENT_PAGE} händelser, alltså utan "
            f"rörelsesida och utan utskick:"
        )
        for city, n in skipped:
            print(f"  {city:14} {n:4} händelser")


def command_granska(rows: Sequence[Underlag]) -> int:
    failures = 0
    for u in rows:
        try:
            text = utskick(u).render()
        except Missing as stop:
            print(f"{u.city}: {stop}", file=sys.stderr)
            return 1
        problems = granska(u, text)
        if problems:
            failures += 1
            print(f"{u.city}:")
            for p in problems:
                print(f"  {p}")
        else:
            print(f"{u.city}: formen håller, {len(u.facts)} tal med adress.")
    return 1 if failures else 0


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--ut", type=Path, default=OUT)
    parser.add_argument("--kommun", help="bara den här kommunen, som slug")
    parser.add_argument("--epost", help="avsändarens e-postadress, om den inte "
                                        "står i SENDER_EMAIL")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("utskick", help="skriv ett utskick per kommun med rörelsesida")
    sub.add_parser("granska", help="pröva formen utan att skriva någon fil")
    sub.add_parser("status", help="vilka kommuner som har underlag i dag")

    args = parser.parse_args()

    global SENDER_EMAIL
    if args.epost:
        SENDER_EMAIL = args.epost

    if not MOVEMENT.exists():
        parser.error(
            f"{MOVEMENT} saknas. Rörelseloggen börjar den natt "
            f"pipeline/rorelse.py körs första gången."
        )

    rows = alla_underlag()
    if args.kommun:
        rows = [u for u in rows if u.slug == args.kommun]
        if not rows:
            parser.error(
                f"{args.kommun} har ingen rörelsesida, alltså färre än "
                f"{MIN_MOVEMENT_PAGE} händelser i loggen. Utan sida finns "
                f"ingen adress där redaktionen kan slå upp talen."
            )

    if not rows:
        print(
            "Ingen kommun har tillräckligt med rörelse för ett utskick än. "
            "Loggen fyller på sig varje natt.",
            file=sys.stderr,
        )
        return

    if args.command == "status":
        command_status(rows)
        return
    if args.command == "granska":
        raise SystemExit(command_granska(rows))

    write(rows, args.ut)


if __name__ == "__main__":
    try:
        main()
    except (Missing, FormError) as stop:
        # Alltid något ägaren ska rätta, aldrig en bugg. En stackspårning
        # skulle dölja meningen som säger vad som fattas.
        print(stop, file=sys.stderr)
        raise SystemExit(1)
