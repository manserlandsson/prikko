"""Inläsare för Lomma kommun.

Åttonde källan, och den första som är helt handredigerad HTML. Fyra sidor i
kommunens SiteVision, en per verksamhetsgrupp, och **hela beståndet i fyra
anrop**:

    .../livsmedelsinspektioner/restaurangerochcafeer.1220.html            60
    .../livsmedelsinspektioner/butiker.1219.html                          19
    .../livsmedelsinspektioner/skolorforskolorochannanomsorg.1221.html    40
    .../livsmedelsinspektioner/ovrigaverksamheter.1222.html               38

Räknat 2026-08-02: 157 poster, 154 distinkta namn. (R6 räknade 156 i juli.
Sidorna redigeras för hand och beståndet rör sig; siffrorna här är
uträknade, inte hämtade ur en tidigare rapport.)

Posterna ligger som brödtext under EN rubrik per sida, och färgen står sist i
namnraden:

    <h2>Lista restauranger och caféer</h2>
    <p><strong>Bayside (grön prick)</strong></p>
    <p>Senaste inspektion: 2026-06-01</p>
    <p>Avvikelser: svårstädad lokal, temperatur</p>

Fram till augusti 2026 grupperade kommunen i stället posterna under en rubrik
per färg (`<h2>Grön prick vid senaste inspektion</h2>`) och lät namnraden bära
bara namnet. Omläggningen syns första gången i nattkörningen 2026-08-11, och
inläsaren vägrade rätt: räkningen mot antalet "Senaste inspektion" i
innehållet fångade att 60 poster fanns men 0 kunde läsas. Beståndet är
oförändrat över bytet: 157 poster, 143 gröna, 12 gula, 2 röda, samma tre
odaterade poster och samma trasiga datum. Det är sidans form som ändrats, inte
kommunens kontroller.

Namnet måste befrias från färgparentesen innan `local_id` hashar det.
Behåller vi "(grön prick)" i namnet byter samtliga 153 verksamheter både id
och slug nästa natt, alla sidor byter URL, och historiken i databasen tappar
sin ägare.

## Vad källan är, och inte är

En post per verksamhet med den SENASTE kontrollen. Ingen historik, ingen
kontrollorsak, **ingen adress** och inga koordinater — samma tunna läge som
Karlstad, med samma konsekvenser: utmärkelsen (tre rena i rad) kan aldrig nås
i Lomma, och `grading.py` kan aldrig härleda kvarstående brister eftersom
varken föregående kontroll eller kontrolltyp finns.

Adressen saknas helt, så `pipeline/geocode.py` har inget att gå på heller.
Lomma får därför inga kartnålar. Det är ingen anledning att utelämna
verksamheterna: namn, datum, omdöme och avvikelseområden finns.

Frågan om adressen finns hos kommunen men missas av oss ställdes och
besvarades 2026-08-18: samtliga fyra listsidor hämtades om och genomsöktes.
De 157 posterna står som `<p class="normal">` med namn och färg i fetstil,
följt av "Senaste inspektion: <datum>" och "Avvikelser: <fritext>". Det finns
ingen adressrad, ingen detaljsida att följa och inget attribut med en adress
i. Den enda gatuadressen på någon av sidorna är kommunens egen besöksadress
Järnvägsgatan 7 i sidfoten, som står på varje sida på lomma.se. Inläsaren
missar alltså ingenting, och Lomma får kartnålar först den dag kommunen
börjar publicera adressen. Se docs/33_oppettider.md §10.

## Färgen är omdömet, texten är detaljen

Kommunens egen läsanvisning står överst på varje sida:

    Grön prick: inga eller ett fåtal avvikelser som inte leder till en extra
                kontroll
    Gul prick:  en eller ett fåtal avvikelser som leder till en extra kontroll
    Röd prick:  en eller flera allvarliga avvikelser som kräver
                myndighetsåtgärder, till exempel föreläggande eller förbud

Notera att **grön inte betyder felfri**. 67 av 143 gröna poster har
avvikelser uppräknade i texten. Grön betyder att avvikelserna inte krävde en
extra kontroll. Därför avgörs `NO_REMARKS` mot `MINOR_REMARKS` inom grönt av
avvikelsetexten, inte av färgen. Se ASSESSMENT nedan.

## Avvikelserna är fritext, och texten är handskriven

34 distinkta kontrollområden i 28 distinkta textformer, med stavfel som
`tempratur`, `persolig hygien`, `utforming av lokal` och tre olika stavningar
av `separering allergener`. Normaliseringstabellen AREA_MAP nedan är räknad
över samtliga 157 poster, inte gissad. Källans egen ordalydelse bärs vidare
som `description` så att normaliseringen är synlig och inte förstörande.
"""

from __future__ import annotations

import hashlib
import html
import re
from dataclasses import dataclass
from datetime import date
from typing import Optional

from ..grading import MAJOR_REMARKS, MINOR_REMARKS, NO_REMARKS, ROUTINE

MUNICIPALITY_CODE = "1262"  # Lomma, SCB REGINA
MUNICIPALITY_NAME = "Lomma kommun"
# Orten, i grundform. Får ALDRIG härledas ur kommunnamnet.
MUNICIPALITY_CITY = "Lomma"

BASE = (
    "https://lomma.se/jobbochforetagande/tillstandreglerochtillsyn"
    "/livsmedel/livsmedelsinspektioner"
)
SOURCE_URL = f"{BASE}.1218.html"

#: Sidorna, med den verksamhetstyp de beskriver. Antalen är räknade över
#: beståndet 2026-08-02, inte uppskattade.
#:
#: Kommunen döper sidorna i plural ("Butiker"). Här visas värdet som typ för
#: en enskild verksamhet, och då läser sig singular bättre.
PAGES = {
    "restaurangerochcafeer.1220.html": "Restaurang och café",       # 60
    "butiker.1219.html": "Butik",                                   # 19
    "skolorforskolorochannanomsorg.1221.html": "Skola och omsorg",  # 40
    "ovrigaverksamheter.1222.html": "Övrigt",                       # 38
}

# ---------------------------------------------------------------------------
# Värdeöversättning
#
# Samtliga förekommande värden är uträknade över hela beståndet (157 poster,
# 2026-08-02), inte gissade. Antal inom parentes.
# ---------------------------------------------------------------------------

#: Färgord → vår skala. Färgen står i namnraden som "(grön prick)"; ordet
#: plockas ut och slås upp här.
#:
#: Grönt är BASNIVÅN, inte ett löfte om noll avvikelser: kommunens egen
#: definition är "inga eller ett fåtal avvikelser som inte leder till en extra
#: kontroll". En grön post med uppräknade avvikelser skärps därför till
#: MINOR_REMARKS i `normalize_inspections` — annars hade sidan sagt "inga
#: anmärkningar" ovanför en lista med anmärkningar, och Lomma hade sett
#: renare ut än Jönköping och Karlstad, där varje noterad avvikelse ger
#: MINOR. Jämförbarheten mellan kommuner är hela produktlöftet.
#:
#: Gult är "avvikelser som leder till en extra kontroll" — alltså avvikelser
#: som ska följas upp, inte avvikelser som ÖVERLEVT en uppföljning. Det är
#: MINDRE anmärkning. Att kalla det allvarligt vore samma fel som
#: Oskarshamns "Kvarstående avvikelser": ett ord som ser strängt ut men
#: beskriver ett tidigare skede.
#:
#: Rött är det enda värdet kommunen själv beskriver som allvarligt, och
#: dessutom med myndighetsåtgärd (föreläggande eller förbud) som villkor.
#: Det är en strängare definition än de flesta andra källors högsta nivå.
COLOUR_ASSESSMENT = {
    "grön": NO_REMARKS,     # 143 poster
    "gul": MINOR_REMARKS,   #  12 poster
    "röd": MAJOR_REMARKS,   #   2 poster
}

#: Läsanvisningen står på varje sida och är det enda som binder färgen till en
#: betydelse. Ändrar kommunen sin skala utan att vi märker det publicerar vi
#: omdömen efter en definition som inte gäller längre. Fraserna nedan är
#: hämtade ur sidorna ordagrant och medvetet korta. Meningarna är dessutom
#: styckade av fetstil mitt i ordet på en av sidorna
#: (`<strong>Grön prick: i</strong>nga eller ett fåtal`), så en kontroll som
#: spänner över hela meningen vore skörare än den ser ut.
LEGEND_PHRASES = (
    "inte leder till en extra kontroll",   # grön
    "leder till en extra kontroll",        # gul
    "allvarliga avvikelser",               # röd
    "myndighetsåtgärd",                    # röd, villkoret
)

#: Texter som betyder ATT INGA AVVIKELSER NOTERATS. Samtliga förekommande
#: former, räknade: "inga avvikelser" (65), "inga" (3), tom text (4), och en
#: förekomst vardera av "ingen avvikelse", "ingea avvikelser", "inga
#: avvikesler", "inga avviklser", "inga avviksler".
#:
#: Stavfelen är inte en tolkning — varje form börjar på "inga"/"ingen" och
#: kan inte betyda något annat på svenska. De räknas ändå upp en och en i
#: stället för att fångas med en regel som `text.startswith("ing")`, så att
#: en ny form tvingar fram ett beslut i stället för att glida igenom.
NO_DEVIATION_TEXTS = {
    "",
    "inga",
    "inga avvikelser",
    "inga avvikesler",
    "inga avviklser",
    "inga avviksler",
    "ingea avvikelser",
    "ingen avvikelse",
}

#: Avvikelsetext → kontrollområde. Nycklarna är samtliga 20 former som
#: förekommer, värdena den stavning kommunen själv använder oftast. Antalen
#: är förekomster över hela beståndet.
#:
#: Ingen nyckel är påhittad, och ingen rättning väljer en stavning som inte
#: står i samma datamängd: "tempratur" rättas till "temperatur" eftersom
#: kommunen skriver "temperatur" på 24 andra rader.
AREA_MAP = {
    "rengöring": "Rengöring",                            # 27
    "temperatur": "Temperatur",                          # 24
    "tempratur": "Temperatur",                           #  1
    "svårstädad lokal": "Svårstädad lokal",              # 18
    "förvaring": "Förvaring",                            #  9
    "livsmedelsinformation": "Livsmedelsinformation",    #  9
    "personlig hygien": "Personlig hygien",              #  9
    "persolig hygien": "Personlig hygien",               #  1
    "personlig hygie": "Personlig hygien",               #  1
    "kontaktmaterial": "Kontaktmaterial",                #  8
    "märkning": "Märkning",                              #  5
    "skadedjurssäkring": "Skadedjurssäkring",            #  3
    "faroanalys": "Faroanalys",                          #  2
    "städutrustning": "Städutrustning",                  #  2
    "separering allergener": "Separering allergener",    #  1
    "separering alergener": "Separering allergener",     #  1
    "separering allergerner": "Separering allergener",   #  1
    "spårbarhet": "Spårbarhet",                          #  1
    "utformning av lokal": "Utformning av lokal",        #  1
    "utforming av lokal": "Utformning av lokal",         #  1
}

#: Färgen sist i namnraden: "Alnarp 9 (grön prick)". Ordet "prick" krävs för
#: att parentesen inte ska förväxlas med en del av firmanamnet, och slutankaret
#: för att den ska sitta där kommunen sätter den. Räknat 2026-08-17 står den
#: sist i samtliga 157 poster, utan ett tecken efter.
NAME_COLOUR = re.compile(r"\(\s*(grön|gul|röd)\s+prick\s*\)\s*$", re.I)

#: Posternas tre rader. Kommunen skriver oftast "Senaste inspektion:" men en
#: post har "Senaste inspektionen:" utan mellanslag efter kolon.
DATE_LINE = re.compile(r"^senaste\s+inspektion(?:en)?\s*:\s*(.*)$", re.I)
DEVIATION_LINE = re.compile(r"^avvikelser\s*:\s*(.*)$", re.I)
ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class UnknownSourceValue(Exception):
    """Källan levererade ett värde vi inte känner igen.

    Får aldrig hanteras med ett default. Vi publicerar omdömen om namngivna
    verksamheter; ett okänt värde som tyst tolkas som godkänt är precis den
    sortens fel som förstör förtroendet.
    """


@dataclass(frozen=True)
class ControlArea:
    code: str
    group: str
    description: str
    status: str


@dataclass(frozen=True)
class Listing:
    """En post som den står på sidan, innan den tolkats."""

    name: str
    colour: str
    #: Rå text efter "Senaste inspektion:". Tom sträng när kommunen utelämnat
    #: datumet, vilket tre poster gör.
    inspected_at: str
    #: Rå text efter "Avvikelser:".
    deviations: str


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


def page_url(page: str) -> str:
    return f"{BASE}/{page}"


def _lines(fragment: str) -> list:
    """Gör ett HTML-fragment till textrader.

    Posterna avgränsas av `<br>` och `</p>`, inte av en struktur. Samma
    stycke kan bära slutet på en post och början på nästa:

        <p>Avvikelser: rengöring<br><br><strong>Cocos Hut</strong></p>

    Därför blir båda till radbrytningar, och posterna plockas ut ur
    radströmmen i stället för ur taggarna.
    """
    text = re.sub(r"<br\s*/?>", "\n", fragment, flags=re.I)
    text = re.sub(r"</p\s*>|</div\s*>|</h\d\s*>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text).replace("\xa0", " ")
    return [" ".join(line.split()) for line in text.split("\n")]


def _content(markup: str) -> str:
    """Klipp ut den del av sidan som bär posterna.

    Innehållet börjar vid läsanvisningen och slutar vid sidfotens
    "Sidans innehåll". Utan avgränsningen drar menyer och sidfot in text som
    ser ut som poster.
    """
    start = markup.find("Symbolernas betydelse")
    if start < 0:
        raise UnknownSourceValue("Sidan saknar rubriken 'Symbolernas betydelse'")
    end = markup.find("Sidans innehåll", start)
    return markup[start:end if end > 0 else len(markup)]


def check_legend(markup: str) -> None:
    """Stäm av att kommunens läsanvisning fortfarande säger det vi tror.

    Färgen är hela omdömet i Lomma, och den enda kopplingen mellan färgen och
    en betydelse är den här texten. Byter kommunen skala — eller lägger till
    en fjärde färg — ska inläsningen stoppa, inte fortsätta publicera omdömen
    efter en definition som inte gäller längre.

    Samma slags spärr som Jönköpings `har_avvikelse` och Oskarshamns
    `AntalKvarstAvvikelser`, fast mot en sida i stället för mot ett fält. En
    handredigerad HTML-källa behöver den mer, inte mindre.
    """
    legend = " ".join(_lines(_content(markup))).casefold()
    missing = [p for p in LEGEND_PHRASES if p.casefold() not in legend]
    if missing:
        raise UnknownSourceValue(
            "Läsanvisningen har ändrats, saknar: " + ", ".join(missing)
        )


def parse_page(markup: str) -> list:
    """Plocka ut alla poster på en sida.

    Posten ligger i tre på varandra följande rader och namnraden bär färgen.
    Antalet poster stäms av mot antalet "Senaste inspektion" i innehållet:
    faller en post ur läsningen ska den räknas, inte tappas tyst. Det var den
    räkningen som fångade formatbytet i augusti 2026 i stället för att låta 60
    restauranger publiceras utan omdöme.
    """
    content = _content(markup)
    expected = len(re.findall(r"Senaste inspektion", content))

    listings = _parse_listings(content)
    if len(listings) != expected:
        raise UnknownSourceValue(
            f"Sidan har {expected} poster men {len(listings)} kunde läsas — "
            "formatet har ändrats"
        )
    return listings


def _parse_listings(fragment: str) -> list:
    lines = _lines(fragment)
    listings = []

    for index, line in enumerate(lines):
        when = DATE_LINE.match(line)
        if not when:
            continue

        # Namnet är den senaste icke-tomma raden före datumet. Att leta efter
        # <strong> i stället hade varit skörare: kommunen låter taggen svälja
        # radbrytningar ("<strong>Centralens café<br><br></strong>Senaste…")
        # och ibland börja på raden före ("<strong><br>Alnarp 9</strong>").
        back = index - 1
        while back >= 0 and not lines[back]:
            back -= 1
        name = lines[back] if back >= 0 else ""

        # Färgen ÄR omdömet i Lomma. Saknas parentesen vet vi inte vad posten
        # säger, och då ska ingenting publiceras om den. Spärren fångar också
        # det motsatta felet: hittar bakåtsökningen sidans rubrik i stället för
        # ett namn bär den ingen färg, och posten smiter inte igenom som en
        # verksamhet vid namn "Lista restauranger och caféer".
        marked = NAME_COLOUR.search(name)
        if not marked:
            raise UnknownSourceValue(f"Posten {name!r} saknar färg i namnraden")
        colour = marked.group(1).casefold()
        name = name[: marked.start()].strip()

        deviations = ""
        forward = index + 1
        while forward < len(lines) and not lines[forward]:
            forward += 1
        if forward < len(lines):
            found = DEVIATION_LINE.match(lines[forward])
            if found:
                deviations = found.group(1).strip()

        listings.append(
            Listing(
                name=name,
                colour=colour,
                inspected_at=when.group(1).strip(),
                deviations=deviations,
            )
        )
    return listings


def local_id(name: str) -> str:
    """Stabil lokal identitet för en verksamhet.

    Kommunen publicerar varken id eller adress — namnet är allt vi har.
    Jönköpings hash av namn+adress går alltså inte att använda, och sidans
    rubrik duger inte som del av nyckeln: flyttar kommunen en verksamhet från
    "Övriga" till "Butiker" ska sidan behålla sin URL och sin historik i
    databasen, inte bli en ny verksamhet.

    Namnet är verifierat unikt nog: 154 distinkta namn på 157 poster, och
    samtliga tre dubbletter är samma verksamhet publicerad på två sidor. Se
    `merge_listings`.
    """
    cleaned = " ".join((name or "").split()).casefold()
    if not cleaned:
        raise UnknownSourceValue("Post utan namn")
    return hashlib.sha1(cleaned.encode("utf-8")).hexdigest()[:12]


def merge_listings(pairs: list) -> list:
    """Slå ihop poster som är samma verksamhet på flera sidor.

    Tre namn förekommer två gånger vardera (2026-08-02):

        Bergagården            restauranger + skolor, IDENTISKA rader
        Pilängens sportcenter  restauranger + övriga, IDENTISKA rader
        Borgeby Fågel & Vilt   butiker 2026-05-22, övriga 2025-02-19

    De två första är uppenbart samma verksamhet, publicerad under två
    rubriker. Den tredje kan vara antingen samma verksamhet med en gammal
    rad kvar på en av sidorna, eller två registrerade objekt på samma gård.
    Det går inte att avgöra ur källan.

    Att låta dem passera hade gett två sidor för samma namn — dubblettinnehåll
    som både läser illa och straffas i sök. Att slå ihop dem till en HISTORIK
    hade varit värre: `grading.py` läser föregående kontroll som tecken på att
    en brist kvarstår, och då hade en påhittad historik kunnat skärpa ett
    omdöme. Lomma publicerar dessutom uttryckligen bara "senaste inspektion"
    per post — en historik finns inte i källan att återge.

    Därför: en verksamhet, den SENAST daterade posten avgör omdömet, och alla
    sidors verksamhetstyper behålls. En odaterad post förlorar mot en daterad.

    Tar (listing, typ)-par och ger (listing, typer)-par i samma ordning som
    första förekomsten.
    """
    order: list = []
    merged: dict = {}

    for listing, page_type in pairs:
        key = local_id(listing.name)
        if key not in merged:
            order.append(key)
            merged[key] = (listing, [page_type])
            continue

        current, types = merged[key]
        if page_type not in types:
            types.append(page_type)
        # Senast daterad vinner. Tom sträng sorterar före varje ISO-datum,
        # vilket är precis rätt: en post utan datum ska aldrig slå ut en med.
        if listing.inspected_at > current.inspected_at:
            merged[key] = (listing, types)
        else:
            merged[key] = (current, types)

    return [merged[key] for key in order]


def parse_deviations(text: str) -> tuple:
    """Dela avvikelsetexten i kontrollområden.

    Returnerar (områden, oläsbara). Kommunen separerar med kommatecken och
    ibland med " och " ("Rengöring och svårstädad lokal").

    Oläsbara delar kastas inte här. Anropen ovan avgör vad de betyder, och det
    beror på färgen: inom grönt bär texten omdömet, inom gult och rött är den
    bara detalj. Se `normalize_inspections`.
    """
    normalized = " ".join((text or "").split()).casefold()
    if normalized in NO_DEVIATION_TEXTS:
        return [], []

    areas, unreadable = [], []
    for raw in re.split(r",|\soch\s", text):
        token = " ".join(raw.split())
        key = token.casefold()
        if not key or key in NO_DEVIATION_TEXTS:
            continue
        if key in AREA_MAP:
            areas.append(
                ControlArea(
                    code="",
                    group=AREA_MAP[key],
                    # Kommunens egen ordalydelse bevaras. Normaliseringen ska
                    # gå att granska, inte radera källan.
                    description=token,
                    status="deviation",
                )
            )
        else:
            unreadable.append(token)
    return areas, unreadable


def normalize_establishment(listing: Listing, types: list) -> NormalizedEstablishment:
    name = " ".join(listing.name.split())
    id_local = local_id(name)
    return NormalizedEstablishment(
        id_national=f"F-{MUNICIPALITY_CODE}-{id_local}",
        municipality_code=MUNICIPALITY_CODE,
        id_local=id_local,
        name=name,
        # Kommunen publicerar ingen adress. Fältet lämnas tomt i stället för
        # att fyllas med kommunnamnet, som hade sett ut som en uppgift vi har.
        # Utan gatuadress kan pipeline/geocode.py inte heller sätta någon nål.
        street_address=None,
        types=list(types),
        lat=None,
        lng=None,
    )


def normalize_inspections(listing: Listing, establishment_id: str) -> list:
    """Översätt den enda publicerade kontrollen.

    Returnerar en lista trots att det aldrig kan bli mer än en post — hela
    pipelinen räknar med en historik, och en verksamhet utan publicerad
    kontroll ska ge en tom lista, inte ett specialfall.
    """
    when = listing.inspected_at.strip()
    if not when:
        # Tre poster (Kraftkällan, KRAN Vinhandel, Skogmarks produkter från
        # skog och mark) står under en färgrubrik men saknar datum. Ett omdöme
        # utan datum går inte att åldersbedöma, och `grading.py` vägrar
        # bedöma just därför. Tom lista ger en obedömd, no-indexerad sida —
        # vilket är sanningen.
        return []

    if not ISO_DATE.match(when):
        # En post har "2025-11-?" — dagen är inte skriven. Att avrunda till
        # månadens första eller sista dag vore att hitta på ett kontrolldatum,
        # och datumet avgör om omdömet ens får publiceras (färskhetsfönstret).
        raise UnknownSourceValue(
            f"Oläsbart kontrolldatum {when!r} för {establishment_id}"
        )

    areas, unreadable = parse_deviations(listing.deviations)
    assessment = COLOUR_ASSESSMENT[listing.colour]

    if assessment == NO_REMARKS:
        if areas:
            # Grönt betyder "inga ELLER ett fåtal avvikelser". 67 av 143 gröna
            # poster räknar upp avvikelser, och de är anmärkningar även om de
            # inte krävde en extra kontroll.
            assessment = MINOR_REMARKS
        elif unreadable:
            # Texten är varken en känd "inga avvikelser"-form eller något vi
            # kan läsa som ett kontrollområde. Då vet vi inte om posten är ren,
            # och det är just den frågan färgen inte svarar på inom grönt.
            raise UnknownSourceValue(
                f"Oläsbar avvikelsetext {listing.deviations!r} för "
                f"{establishment_id}"
            )
    elif not areas and not unreadable:
        # Gult och rött förutsätter enligt kommunens egen läsanvisning att det
        # finns avvikelser. Står det "inga avvikelser" under en sådan rubrik
        # motsäger sidan sig själv, och då är den handredigerade texten inte
        # att lita på. Samma spärr som Sjöbos alt/src-konflikt borde ha haft.
        raise UnknownSourceValue(
            f"{listing.colour} prick men texten säger "
            f"{listing.deviations!r} för {establishment_id}"
        )

    id_local = local_id(listing.name)
    return [
        NormalizedInspection(
            id_national=f"I-{MUNICIPALITY_CODE}-{id_local}-{when}",
            establishment_id=establishment_id,
            inspected_at=date.fromisoformat(when),
            assessment=assessment,
            # Kommunen redovisar ingen kontrollorsak. Rutin är det enda vi kan
            # påstå, och `grading.py` läser aldrig upp allvarsgraden ur den —
            # bara ner, vilket är rätt riktning att fela åt.
            type=ROUTINE,
            # Varken förhandsbesked eller revision redovisas.
            prenotified=None,
            audit=False,
            on_site=True,
            areas=areas,
            # En oläsbar del i texten under gult eller rött ändrar inte
            # omdömet, men den betyder att listan över områden är
            # ofullständig. Ett fall i dag: "Bjärreds krog" har
            # "inga avvikelserseparering avfall, svårstädad lokal, förvaring",
            # alltså en kvarglömd fras hopskriven med nästa område.
            uncertain=bool(unreadable),
        )
    ]
