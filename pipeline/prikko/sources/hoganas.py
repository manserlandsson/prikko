"""Inläsare för Höganäs kommun.

Nionde källan, och den billigaste per verksamhet efter Jönköping: **hela
beståndet i tre anrop**, och ingen PDF behöver öppnas. Kommunen lägger hela
resultatet i filnamnet.

    livsmedelskontroller.html?folder=<mapp>&sv.url=12.33c1739617a7615ad6625ea9

    19.33c1739617a7615ad6625e1a  Butiker, restauranger, serveringar och övrigt  228
    19.33c1739617a7615ad6625e8a  Livsmedelstillverkare/livsmedelsgrossister      25
    19.33c1739617a7615ad6625e93  Barnomsorg, skolkök, vård och omsorg            80

333 PDF-filer, räknade 2026-08-03. Filnamnet ser ut så här:

    Adams kök & bar, Höganäs, 2026-03-30, gul.pdf
    <namn>, <ort>, <ÅÅÅÅ-MM-DD>, <färg>.pdf

## Rapporterna läses inte, och det är ett medvetet val

Färgen, datumet, namnet och orten står i filnamnet. Att dessutom hämta och
tolka 333 PDF:er hade gett kontrollområdena — men det är 333 anrop mot en
kommunwebbplats varje natt för en detalj sidan klarar sig utan. Avvikelserna
specificeras därför inte i Höganäs. Länken till rapporten bärs vidare i
JSON-utdatan som `reportUrl` per kontroll, så att en besökare kan läsa
originalet och så att en senare PDF-tolkning har adressen kvar.

## Källan har historik, tvärtemot vad kartläggningen antog

R6 skrev "en fil per verksamhet". Det stämmer inte: 19 av 310 verksamheter
har fler än en rapport (18 med två, `Rewi AB` med tre). Mönstret är entydigt
— 15 av de 19 är en **gul rapport följd av en grön** 7 till 55 dagar senare,
alltså återbesöket. Kommunen publicerar uppföljningen, inte bara den
planerade kontrollen.

Det gör Höganäs till en av få tunna källor där `grading.py` faktiskt kan
härleda att en brist kvarstår: `Rewi AB` har gul 2025-12-12, gul 2026-01-21
och gul 2026-02-27, och tre gula i rad är en brist som överlevt två besök.
Kontrolltypen står däremot ingenstans, så uppföljningen kan bara läsas ur
mönstret, aldrig ur en etikett. Vi gissar inte fram den.

## Ingen adress, och en ort som inte går att lita på

Kommunen publicerar ingen gatuadress, så `pipeline/geocode.py` har inget att
gå på och Höganäs får inga kartnålar. Orten finns däremot, och 153 av 310
verksamheter ligger i en annan ort än centralorten — Viken, Nyhamnsläge,
Mölle, Jonstorp, Mjöhult, Lerberget, Arild, Farhult, Strandbaden, Skäret,
Väsby, Ingelsträde. Den uppgiften är värd att visa.

Den är däremot inte värd att bygga identiteten på. `Jonstorpsskolans kök` har
tre rapporter med tre olika orter och `Ingelsträde Gård` två — se `local_id`.
"""

from __future__ import annotations

import hashlib
import html
import re
from dataclasses import dataclass
from datetime import date
from typing import Optional

from ..grading import MAJOR_REMARKS, MINOR_REMARKS, NO_REMARKS, ROUTINE

MUNICIPALITY_CODE = "1284"  # Höganäs, SCB REGINA
MUNICIPALITY_NAME = "Höganäs kommun"
# Orten, i grundform. Får ALDRIG härledas ur kommunnamnet.
MUNICIPALITY_CITY = "Höganäs"

ORIGIN = "https://www.hoganas.se"
SOURCE_URL = (
    f"{ORIGIN}/boende-trafik--miljo/boendemiljo/livsmedel/livsmedelskontroller.html"
)
#: Filarkivets portlet-id. Utan den svarar sidan med mappöversikten i stället
#: för med filerna.
PORTLET = "12.33c1739617a7615ad6625ea9"

#: Mapparna, med kommunens egna rubriker. Antalen är räknade över hela
#: beståndet 2026-08-03, inte uppskattade.
FOLDERS = {
    "19.33c1739617a7615ad6625e1a": "Butik, restaurang och servering",  # 228
    "19.33c1739617a7615ad6625e8a": "Tillverkare eller grossist",       #  25
    "19.33c1739617a7615ad6625e93": "Skola och omsorg",                 #  80
}

# ---------------------------------------------------------------------------
# Värdeöversättning
#
# Samtliga förekommande värden är uträknade över hela beståndet (333 filer,
# 2026-08-03), inte gissade. Antal inom parentes.
# ---------------------------------------------------------------------------

#: Färg → vår skala. Kommunens egen läsanvisning står på sidan:
#:
#:     Grön betyder Godkänd inspektion
#:     Gul  betyder Inspektion med avvikelse
#:     Röd  betyder Inspektion som kräver återbesök
#:
#: Grön är alltså ett uttryckligt godkännande, till skillnad från Lommas
#: gröna prick som betyder "inga ELLER ett fåtal avvikelser". Ingen
#: avvikelsetext finns i filnamnet som kunde säga något annat.
#:
#: Röd är MAJOR trots att ordalydelsen ("kräver återbesök") liknar Lommas
#: GULA nivå ("leder till en extra kontroll"). Tre skäl, inget av dem hämtat
#: ur ordet i sig:
#:
#:   1. Röd är toppen av kommunens EGNA tregradiga skala, och steget under
#:      den ("inspektion med avvikelse") täcker redan varje noterad
#:      avvikelse. Lommas gula ligger i mitten av en skala vars topp är
#:      myndighetsåtgärd. Positionen, inte formuleringen, är det som går att
#:      jämföra mellan kommuner.
#:   2. Frekvensen säger samma sak. Gul är 44 av 333 (13 %), vilket ligger på
#:      Jönköpings "Med avvikelse" (14 %) och Karlstads "avvikelser: ja"
#:      (21 %) — alltså mindre anmärkning. Röd är 0 av 333, vilket ligger på
#:      Linköpings verkligt allvarliga nivå (4 av 1 241) och inte i närheten
#:      av Oskarshamns felaktigt stränga ord (27 %).
#:   3. Gula rapporter får redan återbesök i praktiken: 14 av 18 verksamheter
#:      med flera rapporter har en gul följd av en grön inom fem veckor. Röd
#:      måste alltså betyda något utöver "vi kommer tillbaka".
#:
#: Röd förekommer inte i dagens bestånd. Mappningen är därför den enda i
#: modulen som inte kunnat prövas mot verklig data, och det ska stå kvar som
#: en känd svaghet: dyker en röd rapport upp bör en av dem läsas innan
#: omdömet publiceras vidare.
COLOUR_ASSESSMENT = {
    "grön": NO_REMARKS,     # 277 filer
    "gul": MINOR_REMARKS,   #  44 filer
    "röd": MAJOR_REMARKS,   #   0 filer
}

#: Läsanvisningen står på varje sida i filarkivet, ordagrant. Färgen är hela
#: omdömet i Höganäs, och det här är det enda som binder färgen till en
#: betydelse. Ändras den ska inläsningen stoppa i stället för att fortsätta
#: publicera efter en skala som inte gäller längre. Samma spärr som Lommas
#: `check_legend`.
LEGEND_PHRASES = (
    "grön betyder godkänd inspektion",
    "gul betyder inspektion med avvikelse",
    "röd betyder inspektion som kräver återbesök",
)

#: Felstavade ortnamn i filnamnen. Rättningen har den korrekta stavningen
#: belagd i SAMMA datamängd — vi hittar inte på en stavning, vi väljer den
#: kommunen själv använder för samma ort på 168 andra rader.
#:
#: Notera att rättningen bara gäller STAVNINGEN. Den enda förekomsten står i
#: `Jonstorpsskolans kök, Högnäs`, och den skolan ligger i Jonstorp — orten
#: är alltså fel i sak också. Det är kommunens uppgift, inte vår att laga,
#: och det är skälet till att orten aldrig ingår i identiteten.
ORT_CORRECTIONS = {
    "högnäs": "Höganäs",  # 1
}

#: Kommunens eget diarienummer, som en gång hamnat där orten skulle stå
#: (`Väsbyhemmet, MIL-2026-196, 2026-02-18, grön.pdf`). Det är varken namn
#: eller ort och ska inte visas för en besökare.
CASE_NUMBER = re.compile(r"^[A-ZÅÄÖ]{2,5}-\d{4}-\d+$")

#: Filerna i arkivets HTML. `rel="external"` sitter bara på filerna, inte på
#: mapplänkarna ("Föregående"), så listan blir inte förorenad av navigering.
FILE_LINK = re.compile(
    r'<a href="(/download/[^"]+)"[^>]*rel="external">(.*?)<svg', re.S
)

#: Färgordet, med ordgräns. Utan gränsen matchar "röd" inne i
#: `Heljarödsgården` och `LSS Långarödsvägen 42`, och två av 333 filer hade
#: fått fel omdöme.
COLOUR_WORD = re.compile(r"\b(grön|gul|röd)\b", re.I)

#: Datumet. Punkt godtas som avskiljare: en fil skriver `2025-11.10`. Året
#: står först, så läsningen är entydig — det är en felskrivning med bara en
#: möjlig tolkning, inte en gissning.
DATE_IN_NAME = re.compile(r"\d{4}-\d{2}[-.]\d{2}")


class UnknownSourceValue(Exception):
    """Källan levererade ett värde vi inte känner igen.

    Får aldrig hanteras med ett default. Vi publicerar omdömen om namngivna
    verksamheter; ett okänt värde som tyst tolkas som godkänt är precis den
    sortens fel som förstör förtroendet.
    """


@dataclass(frozen=True)
class Report:
    """En publicerad rapport, som den står i filnamnet."""

    name: str
    ort: Optional[str]
    colour: str
    inspected_at: date
    url: str
    filename: str


@dataclass(frozen=True)
class NormalizedInspection:
    id_national: str
    establishment_id: str
    inspected_at: date
    assessment: int
    type: int
    prenotified: Optional[bool]
    audit: bool
    on_site: bool
    areas: list
    uncertain: bool
    #: Länk till kommunens egen PDF-rapport. Se modulens inledning.
    report_url: str


@dataclass(frozen=True)
class NormalizedEstablishment:
    id_national: str
    municipality_code: str
    id_local: str
    name: str
    street_address: Optional[str]
    types: list
    lat: Optional[float]
    lng: Optional[float]


def folder_url(folder: str) -> str:
    return f"{SOURCE_URL}?folder={folder}&sv.url={PORTLET}"


def check_legend(markup: str) -> None:
    """Stäm av att kommunens läsanvisning fortfarande säger det vi tror."""
    text = html.unescape(re.sub(r"<[^>]+>", "", markup))
    text = " ".join(text.split()).casefold()
    missing = [p for p in LEGEND_PHRASES if p not in text]
    if missing:
        raise UnknownSourceValue(
            "Läsanvisningen har ändrats, saknar: " + "; ".join(missing)
        )


def parse_listing(markup: str) -> list:
    """Plocka ut (url, filnamn) för varje rapport i en mapp."""
    out = []
    for href, label in FILE_LINK.findall(markup):
        filename = " ".join(html.unescape(label).split())
        if not filename.lower().endswith(".pdf"):
            continue
        out.append((ORIGIN + html.unescape(href), filename))
    return out


def _split_outside_parentheses(text: str) -> list:
    """Dela på kommatecken, men inte på dem som står inne i en parentes.

    Fyra filnamn har kommatecken inuti namnet:

        Jonstorpsskolan övriga verksamheter (hemkunskap,café), Jonstorp, …
        Nyhamnsskolan (hemkunskap, fritids), Nyhamnsläge, …

    En rak split hade huggit av namnet mitt itu och gjort "café)" till ort.
    """
    parts, buffer, depth = [], "", 0
    for char in text:
        if char == "(":
            depth += 1
        elif char == ")":
            depth = max(0, depth - 1)
        if char == "," and depth == 0:
            parts.append(buffer)
            buffer = ""
        else:
            buffer += char
    parts.append(buffer)
    return [" ".join(p.split()) for p in parts if p.strip()]


def parse_report(url: str, filename: str) -> Report:
    """Läs ut namn, ort, datum och färg ur ett filnamn.

    Fältordningen är INTE pålitlig. 12 av 333 filnamn avviker: färgen står
    före datumet, ortnamnet sitter ihop med datumet, kommatecknet saknas
    mellan datum och färg, orten är utelämnad, eller ett extra led står
    mellan namn och ort (`City Food, mobil, Höganäs`). Därför plockas datum
    och färg ut på mönster och resten läses positionellt — inte tvärtom.
    """
    if not filename.lower().endswith(".pdf"):
        raise UnknownSourceValue(f"Filen {filename!r} är ingen rapport")
    stem = filename[:-4]

    colours = {c.casefold() for c in COLOUR_WORD.findall(stem)}
    if len(colours) != 1:
        # Noll färger, eller två som motsäger varandra. Färgen ÄR omdömet i
        # Höganäs, så utan exakt en finns inget att publicera.
        raise UnknownSourceValue(f"Ingen entydig färg i filnamnet {filename!r}")
    colour = colours.pop()
    if colour not in COLOUR_ASSESSMENT:
        raise UnknownSourceValue(f"Okänd färg {colour!r} i {filename!r}")

    dates = DATE_IN_NAME.findall(stem)
    if len(dates) != 1:
        # `cReal Food, Höganäs, 14 nov 20204, grön.pdf` har årtalet 20204 och
        # ett månadsnamn i stället för siffror. Att gissa 2024 eller 2020 vore
        # att hitta på ett kontrolldatum, och datumet avgör om omdömet ens får
        # publiceras (treårsfönstret).
        raise UnknownSourceValue(f"Inget läsbart datum i filnamnet {filename!r}")
    try:
        inspected_at = date.fromisoformat(dates[0].replace(".", "-"))
    except ValueError:
        # `Cake & Bake, Höganäs, 2024-00-05, grön.pdf` — månad 00 finns inte.
        raise UnknownSourceValue(f"Ogiltigt datum {dates[0]!r} i {filename!r}")

    rest = COLOUR_WORD.sub("", DATE_IN_NAME.sub("", stem))
    parts = [p for p in _split_outside_parentheses(rest) if not CASE_NUMBER.match(p)]
    if not parts:
        raise UnknownSourceValue(f"Filnamnet {filename!r} innehåller inget namn")

    if len(parts) >= 2:
        # Sista ledet är orten, mellanleden hör till namnet: `City Food,
        # mobil` och `Cecilias Fromageri, Vikens Ost & Delikatess` beskriver
        # vilket kontrollobjekt det gäller och får inte kastas.
        name = ", ".join(parts[:-1])
        ort = normalize_ort(parts[-1])
    else:
        # Tre filer saknar ortled. Hellre ingen ort än en påhittad.
        name, ort = parts[0], None

    return Report(
        name=name,
        ort=ort,
        colour=colour,
        inspected_at=inspected_at,
        url=url,
        filename=filename,
    )


def normalize_ort(raw: str) -> Optional[str]:
    ort = " ".join((raw or "").split())
    if not ort:
        return None
    return ORT_CORRECTIONS.get(ort.casefold(), ort)


def local_id(report: Report) -> str:
    """Stabil lokal identitet för en verksamhet.

    Kommunen publicerar inget id — filnamnet är allt vi har, och filens egen
    nyckel i SiteVision (`/download/18.acb99cb…`) duger inte: den hör till
    DOKUMENTET, inte till verksamheten, och byts när kommunen laddar upp en
    ny rapport. Ett id som byter värde vid varje inspektion hade fått
    inläsaren att skapa en ny sida i stället för att uppdatera den gamla —
    samma fel som ArcGIS `OBJECTID` i Jönköping, av samma skäl.

    Namnet ensamt bär identiteten. **Orten får inte ingå**, trots att det
    hade känts säkrare: fältet är bevisat opålitligt. `Jonstorpsskolans kök`
    har tre rapporter med tre olika orter (`Höganäs`, `Jonstorp`, `Högnäs`)
    och `Ingelsträde Gård` två (`Höganäs`, `Ingelsträde`). Med orten i
    nyckeln blev en skolmatsal tre verksamheter med tre olika omdömen — två
    av dem publicerade under samma namn.

    Namnet räcker: 310 distinkta namn på 332 läsbara rapporter, och samtliga
    20 namn som återkommer är verkligen samma verksamhet. Mappen får inte
    heller ingå — `Cake & Bake` och `Kullabygdens fruktträdgårdar` byter mapp
    mellan sina rapporter.
    """
    name = " ".join((report.name or "").split()).casefold()
    if not name:
        raise UnknownSourceValue("Rapport utan verksamhetsnamn")
    return hashlib.sha1(name.encode("utf-8")).hexdigest()[:12]


def group_reports(pairs: list) -> list:
    """Samla rapporterna per verksamhet.

    Tar (report, kategori)-par och ger (rapporter, kategorier)-par i samma
    ordning som första förekomsten. Rapporterna sorteras nyast först.

    19 verksamheter har mer än en rapport. Till skillnad från Lomma, där två
    poster med samma namn var samma post publicerad två gånger, är det här
    verkliga kontrolltillfällen med skilda datum — kommunen publicerar
    återbesöket. De ska alltså bli en historik, inte slås ihop till en.
    """
    order: list = []
    grouped: dict = {}

    for report, category in pairs:
        key = local_id(report)
        if key not in grouped:
            order.append(key)
            grouped[key] = ([], [])
        reports, categories = grouped[key]
        reports.append(report)
        if category not in categories:
            categories.append(category)

    out = []
    for key in order:
        reports, categories = grouped[key]
        out.append(
            (sorted(reports, key=lambda r: r.inspected_at, reverse=True), categories)
        )
    return out


def normalize_establishment(report: Report, categories: list) -> NormalizedEstablishment:
    """Bygg verksamheten ur den senaste rapporten."""
    return NormalizedEstablishment(
        id_national=f"F-{MUNICIPALITY_CODE}-{local_id(report)}",
        municipality_code=MUNICIPALITY_CODE,
        id_local=local_id(report),
        name=" ".join(report.name.split()),
        # Ingen gatuadress publiceras. Orten är ändå värd att visa när den
        # tillför något: 145 av 313 verksamheter ligger i en annan ort än
        # centralorten. Ett "Höganäs" här hade bara upprepat kommunnamnet,
        # som sidan redan skriver ut efter adressen.
        street_address=(
            report.ort
            if report.ort and report.ort.casefold() != MUNICIPALITY_CITY.casefold()
            else None
        ),
        types=list(categories),
        # Kommunen publicerar inga koordinater, och utan gatuadress kan
        # pipeline/geocode.py inte härleda någon heller.
        lat=None,
        lng=None,
    )


def normalize_inspections(reports: list, establishment_id: str) -> list:
    """Översätt verksamhetens rapporter till kontroller, nyast först.

    Två rapporter från samma dag är samma kontroll publicerad två gånger, och
    slås ihop med det sämre resultatet som utfall — samma regel som i
    Linköping och Jönköping. Det förekommer: `Jonstorpsskolans kök` ligger med
    2026-03-24 två gånger, en gång med orten `Höganäs` och en gång med
    `Jonstorp`.
    """
    merged: dict = {}
    for report in sorted(reports, key=lambda r: r.inspected_at, reverse=True):
        if report.colour not in COLOUR_ASSESSMENT:
            raise UnknownSourceValue(
                f"Okänd färg {report.colour!r} för {establishment_id}"
            )
        current = merged.get(report.inspected_at)
        if current is None or (
            COLOUR_ASSESSMENT[report.colour] > COLOUR_ASSESSMENT[current.colour]
        ):
            merged[report.inspected_at] = report

    out = []
    for _, report in sorted(merged.items(), reverse=True):
        out.append(
            NormalizedInspection(
                id_national=(
                    f"I-{MUNICIPALITY_CODE}-{local_id(report)}"
                    f"-{report.inspected_at.isoformat()}"
                ),
                establishment_id=establishment_id,
                inspected_at=report.inspected_at,
                assessment=COLOUR_ASSESSMENT[report.colour],
                # Kontrollorsaken står ingenstans. Att 14 av 18 flerrapports-
                # verksamheter har en grön rapport en till fem veckor efter en
                # gul ser ut som återbesök, men "ser ut som" är inte ett
                # källvärde. Rutin är det enda vi kan påstå, och `grading.py`
                # läser aldrig upp allvarsgraden ur den — bara ner.
                type=ROUTINE,
                # Sidan säger att "nästan alla" inspektioner är oanmälda. Det
                # är en beskrivning av arbetssättet, inte en uppgift om den
                # enskilda kontrollen, och duger därför inte som värde.
                prenotified=None,
                audit=False,
                on_site=True,
                # Kontrollområdena finns bara inne i PDF:en, som vi medvetet
                # inte hämtar. Tom lista är sanningen här.
                areas=[],
                uncertain=False,
                report_url=report.url,
            )
        )
    return out
