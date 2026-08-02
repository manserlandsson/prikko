"""Inläsare för Svenljunga kommun.

Tionde källan, och den första där omdömet bara finns inuti en PDF. Kommunen
publicerar hela kontrollrapporten, inte en sammanfattning: ingen färg, inget
resultatfält, ingen etikett. Utan att läsa rapporterna finns ingenting att
hämta. Se `prikko/pdf.py` för textutvinningen.

    GET .../livsmedelskontroll-och-avgifter/resultat-fran-livsmedelskontrollen
        en sida, 107 verksamheter, 224 rapporter
    GET https://www.svenljunga.se/download/<id>/<tid>/<filnamn>.pdf
        en rapport

Rapportlistan ligger som JSON i sidans egen JavaScript (SiteVisions
`AppRegistry.registerInitialState`), en fildelningsmodul per verksamhet under
en rubrik med verksamhetens namn och ort.

## En femtedel av rapporterna är inskannade papper

Räknat över samtliga 224 rapporter 2026-08-03:

    151  läsbara OCH tolkningsbara
     45  inskannade bilder utan textlager (mest 2020 till 2022)
     17  äldre mallar eller teckensnitt vi inte kan avkoda
     11  läsbara men utan resultatmening eller kontrolldatum

Det finns ingen väg runt det utan OCR, och OCR går inte att köra i en tom
container. Följden är att **47 av 107 verksamheter blir obedömda**: 22 har
ingen läsbar rapport alls, 8 har en oläsbar SENASTE rapport, och 17 har bara
rapporter äldre än treårsfönstret.

De 8 är den viktiga gruppen. När den nyaste rapporten inte går att läsa
publiceras INGET omdöme, trots att en äldre rapport finns och går att tolka.
Att visa den hade varit att påstå ett nuläge som kommunen redan har
kontrollerat om. Se `readable_history`.

## Vad rapporterna säger, och vad vi tar med

Mallen har bytts flera gånger sedan 2016. Resultatmeningen förekommer i sju
formuleringar (uträknade, se CLEAN_RESULTS och DEVIATION_RESULTS) och de
delar beståndet rent: 82 rapporter säger inga avvikelser, 77 säger
avvikelser, och ingen rapport säger båda.

Skalan är alltså **tvågradig**. Kommunen har inget ord för "kvarstår" och
ingen allvarlighetsgrad. Det gör Svenljunga till den femte källan utan
etiketten — men här kan `grading.py` ändå härleda kvarstående brister, för
källan har historik: 42 av de 60 bedömda verksamheterna har två eller flera
läsbara rapporter.

**Avvikelserna specificeras i rapporten men tas inte med.** Rapporttexten
kommer ur PDF:en styckad i korta löpor, ofta mitt i ett ord ("åtgärda t s",
"La gkrav"). Det duger utmärkt för att leta efter kända fraser, och inte alls
för att återge en mening ordagrant på en sida om en namngiven restaurang.
Kontrollområdenas namn skulle kräva en sluten ordlista, och rapporterna
använder minst 40 olika områdesnamn inklusive dricksvattenanläggningarnas
egna. Hellre ingen uppgift än en trasig. Länken till originalrapporten bärs
i stället vidare per kontroll som `reportUrl`.
"""

from __future__ import annotations

import hashlib
import html
import json
import re
from dataclasses import dataclass
from datetime import date
from typing import List, Optional

from ..grading import FOLLOWUP, MINOR_REMARKS, NO_REMARKS, ROUTINE

MUNICIPALITY_CODE = "1465"  # Svenljunga, SCB REGINA
MUNICIPALITY_NAME = "Svenljunga kommun"
# Orten, i grundform. Får ALDRIG härledas ur kommunnamnet.
MUNICIPALITY_CITY = "Svenljunga"

SOURCE_URL = (
    "https://www.svenljunga.se/naringsliv--arbete/tillstand-regler-och-tillsyn"
    "/livsmedel/livsmedelskontroll-och-avgifter/resultat-fran-livsmedelskontrollen"
)

# ---------------------------------------------------------------------------
# Värdeöversättning
#
# Samtliga förekommande värden är uträknade över hela beståndet (224 rapporter,
# 2026-08-03), inte gissade. Antal inom parentes.
#
# Fraserna matchas mot rapporttexten med ALLA BLANKSTEG BORTTAGNA. Skälet står
# i modulens inledning: PDF:en levererar texten styckad i korta löpor, ibland
# mitt i ett ord, så "Rapport efter livsmedelskontroll" kan komma ut som
# "R apport efter livsmedelskontroll". Utan blanksteg spelar styckningen ingen
# roll.
# ---------------------------------------------------------------------------

#: Resultatmeningar som betyder INGA AVVIKELSER.
CLEAN_RESULTS = (
    "Ingaavvikelserkonstateradesviddennakontroll",   # 26
    "Ingaavvikelseruppmärksammandes",                # 37, kommunens egen felstavning
    "Ingaavvikelseruppmärksammades",                 #  7
    "Ingaavvikelserkonstateradesvidkontrollen",      # 12
)

#: Resultatmeningar som betyder AVVIKELSER. Den tredje är rubriken över
#: listan med avvikande kontrollområden och förekommer bara i mallen som
#: också har den första meningen, utom i en rapport där meningen fallit bort.
DEVIATION_RESULTS = (
    "Vidkontrollenkonstateradevienellerfleraavvikelser",  # 44
    "Följandeavvikelseruppmärksammades",                  # 31
    "Kontrolleratmedavvikelser",                          # 41
)

#: Kontrollorsak. Kommunen skriver den i klartext i inledningen.
#:
#: "Det var en planerad kontroll som vi gör regelbundet" (150) är rutin.
#: "Det var en extrakontroll för att följa upp om avvikelserna från förra
#: kontrollen hade åtgärdats" (1) är en uppföljning i Karlstads mening: ett
#: återbesök för att se om åtgärden räckte.
#:
#: Meningen "Vi följde även upp de punkter som hade en avvikelse vid förra
#: kontrollen" (19) räknas MEDVETET INTE som uppföljning. Den beskriver en
#: planerad kontroll som passade på att titta på gamla punkter, inte ett
#: återbesök, och en avvikelse som noteras vid ett sådant tillfälle behöver
#: inte vara den gamla. Källan har dessutom historik, så `grading.py` ser
#: ändå att föregående kontroll hade avvikelser och skärper därifrån. Att
#: också sätta FOLLOWUP hade räknat samma sak två gånger.
FOLLOWUP_MARKER = "Detvarenextrakontrollförattföljaupp"

#: Förhandsbeskedet står i inledningsmeningen ("gjorde vi en oanmäld
#: inspektion på …") eller i nästa mening ("Kontrollen gjordes i form av ett
#: oanmält kontrollbesök").
#:
#: Det får INTE sökas i hela dokumentet. Rapportens standardtext innehåller
#: meningen "Med regelbundna intervall ska oanmälda inspektioner samt
#: föranmälda revisioner genomföras", och den finns i 77 av 176 läsbara
#: rapporter. En rak sökning hade alltså sagt både oanmäld och föranmäld i
#: nästan varannan rapport.
INTRO = re.compile(r"gjordevien(.{0,60}?)på")
PRENOTIFIED_SENTENCE = re.compile(r"formavett(o|för)anmältkontrollbesök")

#: Revision i stället för inspektion (10 rapporter). Ordet står i samma
#: inledningsmening och betyder en genomgång av verksamhetens system i
#: stället för ett kontrollbesök på plats.
AUDIT_WORD = "revision"

#: Månadsnamnen, med de felstavningar som faktiskt förekommer. `jnuari` (1)
#: och `jnauari` (2) är inga tolkningar — bokstäverna är januaris, i fel
#: ordning, och rapporterna är daterade i januari.
_MONTHS = {
    "januari": 1, "jnuari": 1, "jnauari": 1,
    "februari": 2, "mars": 3, "april": 4, "maj": 5, "juni": 6,
    "juli": 7, "augusti": 8, "september": 9, "oktober": 10, "november": 11,
    "december": 12,
}

#: Kontrolldatumet, som kommunen skriver det: "Den 19 mars 2026 gjorde vi en
#: livsmedelskontroll". 24 rapporter utelämnar årtalet ("Den 20 maj"); då tas
#: året ur filnamnets datum, som är rapportens eget datum och alltid ligger
#: inom några dagar. Fyra rapporter skriver datumet på ISO-form.
#:
#: Mönstret är förankrat i "gjorde vi", inte i ordet "Den". Två skäl: en
#: rapport utelämnar "Den" helt ("16 april 2026 gjorde vi en
#: livsmedelskontroll"), och varje rapport bär dessutom sitt eget
#: brevhuvuddatum HÖGRE UPP på sidan. Ett omankrat mönster hade plockat
#: brevhuvudet och daterat kontrollen till den dag rapporten skrevs.
_CONTROL_DATE_LONG = re.compile(
    r"(\d{1,2})(" + "|".join(_MONTHS) + r")(\d{4})?gjordevi", re.I
)
_CONTROL_DATE_ISO = re.compile(r"(\d{4})-(\d{2})-(\d{2})gjordevi")

#: Datumet i filnamnet, till exempel "Caesar Restaurang 2026-03-26.pdf". Det
#: är rapportens datum, inte kontrollens: de sammanföll i 101 av 154 fall och
#: skilde sig med högst en vecka i nästan alla övriga. Det används därför
#: BARA till att fylla i ett saknat årtal och till att avgöra vilken rapport
#: som är den nyaste publicerade — aldrig som kontrolldatum.
FILE_DATE = re.compile(r"(\d{4})-(\d{2})-(\d{2})")

#: Sidans fildelningsmoduler. Portlet-id:t innehåller både siffror och
#: bokstäver, så ett `[\d.]+` missar samtliga.
_FILE_STATE = re.compile(r"registerInitialState\('[\w.]+',(\{\"files\")")

#: Rubrikerna. h2 är kategorin, h3 verksamhetens namn.
_HEADING = re.compile(r"<h([23])[^>]*>(.*?)</h\1>", re.S)


class UnknownSourceValue(Exception):
    """Källan levererade ett värde vi inte känner igen.

    Får aldrig hanteras med ett default. Vi publicerar omdömen om namngivna
    verksamheter; ett okänt värde som tyst tolkas som godkänt är precis den
    sortens fel som förstör förtroendet.
    """


@dataclass(frozen=True)
class ReportFile:
    """En publicerad rapport, innan PDF:en lästs."""

    id: str
    filename: str
    url: str

    @property
    def published_at(self) -> Optional[date]:
        """Rapportens eget datum, ur filnamnet. Se FILE_DATE."""
        found = FILE_DATE.search(self.filename)
        if not found:
            return None
        try:
            return date(*(int(g) for g in found.groups()))
        except ValueError:
            return None


@dataclass(frozen=True)
class Listing:
    """En verksamhet som den står på sidan."""

    name: str
    ort: Optional[str]
    category: str
    files: List[ReportFile]


@dataclass(frozen=True)
class Report:
    """En tolkad kontrollrapport."""

    inspected_at: date
    assessment: int
    type: int
    prenotified: Optional[bool]
    audit: bool
    url: str


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


def squeeze(text: str) -> str:
    """Ta bort alla blanksteg. Se kommentaren över värdetabellerna."""
    return re.sub(r"\s+", "", text or "")


def _json_object(markup: str, start: int) -> dict:
    """Läs ut JSON-objektet som börjar på `start`.

    Objektet ligger inbäddat i ett script och följs av `);</script>`, så det
    går inte att klippa på ett tecken. Klamrarna räknas i stället, med hänsyn
    till strängar och escaper.
    """
    depth, in_string, escaped = 0, False, False
    for index in range(start, len(markup)):
        char = markup[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return json.loads(markup[start:index + 1])
    raise UnknownSourceValue("Fildelningsmodulens JSON är avklippt")


def parse_page(markup: str) -> List[Listing]:
    """Plocka ut verksamheterna och deras rapporter.

    Sidan är en följd av rubriker och fildelningsmoduler i dokumentordning:

        <h2>Restauranger och pizzerior</h2>
        <h3>Caesar Restaurang, Svenljunga</h3>
        …registerInitialState('12.…',{"files":[…]})…

    Åtta verksamheter har TVÅ moduler under samma rubrik: verksamheten och
    dess dricksvattenanläggning (`Backa Loge Café` och `Backa Loge
    Dricksvattenanläggning`). Kommunen grupperar dem själv under ett namn, så
    de blir en verksamhet med rapporterna sammanslagna.
    """
    events = []
    for match in _HEADING.finditer(markup):
        text = " ".join(html.unescape(re.sub(r"<[^>]+>", "", match.group(2))).split())
        events.append((match.start(), "h" + match.group(1), text))
    for match in _FILE_STATE.finditer(markup):
        payload = _json_object(markup, match.start(1))
        events.append((match.start(), "files", payload.get("files") or []))
    events.sort(key=lambda event: event[0])

    listings: List[Listing] = []
    index: dict = {}
    category = heading = None

    for _, kind, value in events:
        if kind == "h2":
            category, heading = value, None
        elif kind == "h3":
            heading = value
        elif kind == "files":
            if not heading or not category:
                # En modul utan rubrik går inte att knyta till en verksamhet.
                # Att gissa på närmaste namn hade kunnat hänga en annan
                # verksamhets kontroller på fel sida.
                raise UnknownSourceValue(
                    "Fildelningsmodul utan föregående rubrik — sidans form "
                    "har ändrats"
                )
            files = [
                ReportFile(id=f["id"], filename=f["name"], url=f["url"])
                for f in value
                if f.get("id") and f.get("name") and f.get("url")
            ]
            name, ort = split_ort(heading)
            key = (name.casefold(), (ort or "").casefold())
            if key in index:
                index[key].files.extend(files)
                continue
            listing = Listing(name=name, ort=ort, category=category, files=list(files))
            index[key] = listing
            listings.append(listing)

    if not listings:
        raise UnknownSourceValue("Sidan innehöll inga fildelningsmoduler")
    return listings


def split_ort(heading: str) -> tuple:
    """Dela "Caesar Restaurang, Svenljunga" i namn och ort.

    29 av 107 rubriker saknar ort. Orten är den enda platsuppgift kommunen
    publicerar — ingen gatuadress finns, och därmed kan `pipeline/geocode.py`
    inte heller sätta någon kartnål.
    """
    parts = [" ".join(part.split()) for part in heading.split(",")]
    parts = [part for part in parts if part]
    if not parts:
        raise UnknownSourceValue(f"Tom rubrik {heading!r}")
    if len(parts) == 1:
        return parts[0], None
    return ", ".join(parts[:-1]), parts[-1]


def local_id(name: str, ort: Optional[str]) -> str:
    """Stabil lokal identitet för en verksamhet.

    Kommunen publicerar inget id. Filens nyckel i SiteVision duger inte —
    den hör till dokumentet och byts vid varje ny rapport, samma fel som
    ArcGIS `OBJECTID` i Jönköping.

    Namn plus ort är det sidan själv grupperar på, och det är verifierat
    unikt: 107 rubriker, 99 distinkta namn, och samtliga åtta upprepningar är
    en verksamhet och dess dricksvattenanläggning under samma rubrik.
    """
    cleaned = " ".join((name or "").split()).casefold()
    if not cleaned:
        raise UnknownSourceValue("Verksamhet utan namn")
    digest = hashlib.sha1(f"{cleaned}|{(ort or '').casefold()}".encode("utf-8"))
    return digest.hexdigest()[:12]


def control_date(squeezed: str, published_at: Optional[date]) -> Optional[date]:
    """Kontrolldatumet som kommunen skriver det i rapporten.

    Returnerar None när det inte går att läsa. Rapportens eget datum används
    ALDRIG i stället: det är datumet rapporten skrevs, inte datumet
    kontrollen gjordes, och skillnaden är upp till nitton dagar. Det enda det
    får bidra med är årtalet, när kommunen skrivit "Den 20 maj" utan år.
    """
    found = _CONTROL_DATE_ISO.search(squeezed)
    if found:
        try:
            return date(*(int(g) for g in found.groups()))
        except ValueError:
            return None

    found = _CONTROL_DATE_LONG.search(squeezed)
    if not found:
        return None
    year = found.group(3)
    if not year:
        if published_at is None:
            return None
        year = published_at.year
    try:
        return date(int(year), _MONTHS[found.group(2).casefold()], int(found.group(1)))
    except ValueError:
        return None


def assessment_of(squeezed: str) -> Optional[int]:
    """Läs resultatet ur rapporten.

    Den FÖRSTA resultatmeningen i dokumentet gäller. Ordningen spelar roll:
    standardtexten längre ned innehåller meningar som "Inga avvikelser kunde
    konstateras" i ett helt annat sammanhang — en av rapporterna talar där om
    rökförbudet, inte om livsmedel.

    Returnerar None när ingen resultatmening finns. Rapporten är då antingen
    en gammal mall eller en inskannad bild, och utan resultat finns inget att
    publicera.
    """
    hits = []
    for phrase in CLEAN_RESULTS:
        position = squeezed.find(phrase)
        if position >= 0:
            hits.append((position, NO_REMARKS))
    for phrase in DEVIATION_RESULTS:
        position = squeezed.find(phrase)
        if position >= 0:
            hits.append((position, MINOR_REMARKS))
    if not hits:
        return None
    return min(hits)[1]


def parse_report(text: str, file: ReportFile) -> Report:
    """Tolka en kontrollrapport. Kastar när rapporten inte går att läsa."""
    squeezed = squeeze(text)
    if not squeezed:
        raise UnknownSourceValue(
            f"{file.filename}: rapporten saknar textlager, sannolikt inskannad"
        )

    assessment = assessment_of(squeezed)
    if assessment is None:
        raise UnknownSourceValue(
            f"{file.filename}: ingen resultatmening — okänd eller för gammal mall"
        )

    when = control_date(squeezed, file.published_at)
    if when is None:
        raise UnknownSourceValue(f"{file.filename}: inget läsbart kontrolldatum")

    intro = INTRO.search(squeezed)
    descriptor = (intro.group(1) if intro else "").casefold()

    prenotified: Optional[bool] = None
    if "oanmäl" in descriptor:
        prenotified = False
    elif "föranmäl" in descriptor:
        prenotified = True
    else:
        sentence = PRENOTIFIED_SENTENCE.search(squeezed)
        if sentence:
            prenotified = sentence.group(1) == "för"

    return Report(
        inspected_at=when,
        assessment=assessment,
        type=FOLLOWUP if FOLLOWUP_MARKER in squeezed else ROUTINE,
        prenotified=prenotified,
        audit=AUDIT_WORD in descriptor,
        url=file.url,
    )


def readable_history(listing: Listing, reports: List[Report]) -> List[Report]:
    """Kontrollerna vi får publicera för en verksamhet.

    Är den NYASTE publicerade rapporten oläsbar publiceras ingenting alls,
    trots att äldre rapporter kan vara tolkade. Ett omdöme ska beskriva
    nuläget, och nuläget är den kontroll kommunen senast redovisat. Att i
    stället visa den näst senaste vore att påstå ett läge som kommunen redan
    har kontrollerat om, utan att säga det.

    Gäller åtta verksamheter i dag. Sju av deras oläsbara rapporter är
    inskannade papper.
    """
    if not reports:
        return []

    published = [f.published_at for f in listing.files if f.published_at]
    if published:
        newest_published = max(published)
        newest_read = max(r.inspected_at for r in reports)
        # Rapportens datum ligger dagar efter kontrollens, aldrig veckor.
        # Marginalen skiljer "rapporten om den senaste kontrollen" från "en
        # nyare kontroll vi inte kunde läsa".
        if (newest_published - newest_read).days > 30:
            return []

    return sorted(reports, key=lambda r: r.inspected_at, reverse=True)


def normalize_establishment(listing: Listing) -> NormalizedEstablishment:
    id_local = local_id(listing.name, listing.ort)
    return NormalizedEstablishment(
        id_national=f"F-{MUNICIPALITY_CODE}-{id_local}",
        municipality_code=MUNICIPALITY_CODE,
        id_local=id_local,
        name=listing.name,
        # Ingen gatuadress publiceras. Orten är ändå värd att visa när den
        # tillför något: 38 av 107 verksamheter ligger utanför centralorten.
        # Ett "Svenljunga" här hade bara upprepat kommunnamnet, som sidan
        # redan skriver ut efter adressen.
        street_address=(
            listing.ort
            if listing.ort
            and listing.ort.casefold() != MUNICIPALITY_CITY.casefold()
            else None
        ),
        types=[listing.category],
        # Kommunen publicerar inga koordinater, och utan gatuadress kan
        # pipeline/geocode.py inte härleda någon heller.
        lat=None,
        lng=None,
    )


def normalize_inspections(
    listing: Listing, reports: List[Report], establishment_id: str
) -> List[NormalizedInspection]:
    """Översätt de läsbara rapporterna till kontroller, nyast först.

    Två rapporter från samma dag slås ihop med det sämre resultatet som
    utfall — samma regel som i Linköping och Jönköping. Det förekommer när en
    verksamhet och dess dricksvattenanläggning kontrolleras samma dag, till
    exempel `Backa Loge Café` och `Påarps gård` 2025.
    """
    id_local = local_id(listing.name, listing.ort)

    merged: dict = {}
    for report in readable_history(listing, reports):
        current = merged.get(report.inspected_at)
        if current is None or report.assessment > current.assessment:
            merged[report.inspected_at] = report

    return [
        NormalizedInspection(
            id_national=f"I-{MUNICIPALITY_CODE}-{id_local}-{when.isoformat()}",
            establishment_id=establishment_id,
            inspected_at=when,
            assessment=report.assessment,
            type=report.type,
            prenotified=report.prenotified,
            audit=report.audit,
            # En revision är en genomgång av verksamhetens system, men den
            # görs på plats precis som en inspektion.
            on_site=True,
            # Se modulens inledning: kontrollområdena finns i rapporten men
            # kan inte återges ordagrant ur den styckade PDF-texten.
            areas=[],
            uncertain=False,
            report_url=report.url,
        )
        for when, report in sorted(merged.items(), reverse=True)
    ]
