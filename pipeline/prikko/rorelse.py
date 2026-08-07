"""Rörelsen i beståndet: vad som dykt upp och vad som försvunnit.

Vi vet inte när en verksamhet öppnade eller stängde. `active` säger bara om
raden lämnas ut just nu, `source_created_at` och `source_modified_at` är oftast
null, och kommunerna fyller dem olika. Det finns ingen kolumn någonstans som
svarar på frågan.

Det som DÄREMOT går att observera är något smalare och sant: ett
anläggnings-id dök upp i en utlämning som inte innehöll det förut, och ett
anläggnings-id slutade lämnas ut. Den observationen finns inte lagrad i dag
heller, för varje körning skriver över den förra. Den här modulen räknar fram
den, och pipeline/rorelse.py sparar den så att den byggs på över tid.

## Fyra sätt att ta fel, och vad som görs åt dem

**1. Första körningen är inte tolvtusen öppningar.** Mot en kommun vi aldrig
sett förut är varje id nytt. Den utlämningen märks `seed` och publiceras
aldrig som nyheter. Historiken börjar med andra körningen.

**2. En omläggning av registret är inte trehundra nyöppnade restauranger.**
Byter kommunen verksamhetssystem, eller lägger om sin id-serie, kommer en stor
del av beståndet in som nya id på en natt. Utlämningar där tillskottet
överstiger vad kommunen rimligen kan registrera märks `bulk`. Raderna sparas
med sitt datum, de räknas i statistiken, och de publiceras inte. Se
`bulk_limit` för var gränsen går och varför.

**3. Att försvinna ur en utlämning är inte nedlagt.** Ett id kan bytas ut mot
ett annat för samma lokal, vilket är precis den buggen som fäller
nattkörningen: sluggarna byter plats när källan numrerar om. Försvinnanden
paras därför alltid först mot samma utlämnings nytillkomna, på namn och adress.
Ett par är ett id-byte och ingen av de två publiceras.

**4. En rad utan en enda kontroll är registerstädning, inte en nedläggning.**
Den 7 augusti 2026 tog Uppsala bort 114 verksamheter ur sin utlämning på en
gång. 113 av dem hade aldrig burit en enda kontroll. Det var kommunen som
rensade sitt register, och en sida som skrivit "113 verksamheter har
försvunnit" hade läst som 113 nedlagda restauranger.

Regeln som följer går åt ETT håll. Ett försvinnande publiceras bara när
verksamheten burit minst en publicerad kontroll. Har den aldrig gjort det har
vi heller aldrig påstått något om stället: dess sida har aldrig fått indexeras,
se `isIndexable` i site/src/lib/data.ts, så att raden lämnar registret ändrar
ingenting en läsare kunnat se. Uppsala hade med regeln gett en enda rad i
stället för 114.

Åt andra hållet gäller den inte. En nyregistrerad verksamhet har sällan hunnit
få en kontroll, och att den dykt upp i registret är då hela beskedet, och det
färskaste sajten har. Asymmetrin är avsiktlig. En tillkomst påstår "den står nu
i registret", vilket är precis vad vi observerat. Ett försvinnande riskerar att
läsas som "stället har lagt ned", och det påståendet måste bäras av att det
fanns något att lägga ned.

Utöver allt detta publiceras ingenting på en enda observation. Ett id som
saknas en natt och är tillbaka nästa var ett hål i hämtningen, inte en
nedläggning.

## Ren funktion

Ingen I/O, ingen klocka som läses internt, inga databasanrop. Allt kommer in
som argument och allt går ut som returvärde, av samma skäl som grading.py:
det som avgör vad som publiceras ska gå att testa uttömmande.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field
from datetime import date, datetime, timezone

# ---------------------------------------------------------------------------
# Gränser
# ---------------------------------------------------------------------------

#: Under så här många rader är ett tillskott aldrig en omläggning. Utan golvet
#: hade två nya kaféer i Svenljunga (99 verksamheter, två procent) räknats som
#: en systemmigrering.
BULK_MIN_ROWS = 5

#: Tak i antal rader. Stockholm har 8 511 verksamheter, och fem procent av dem
#: är 426 på en natt — långt mer än staden registrerar. Sverige har i
#: storleksordningen några tusen nya livsmedelsverksamheter om året, alltså
#: ligger Stockholms verkliga takt kring en om dagen. Tjugofem på en natt är
#: nästan en månads registreringar och behandlas som en omläggning.
BULK_ROWS = 25

#: Tak i andel av det publicerade beståndet, för kommuner som är små nog att
#: BULK_ROWS aldrig skulle slå till. Sex nya i Svenljunga är sex procent av
#: kommunen på en natt.
BULK_SHARE = 0.05

#: Gränsen skalas med hur lång tid utlämningen täcker. Står nattkörningen
#: stilla en månad kommer en månads registreringar på en gång, och det är inte
#: en omläggning. Taket finns för att ett halvårs uppehåll ändå inte gör en
#: migrering till nyheter.
SPAN_DAYS = 7.0
SPAN_MAX = 4.0

#: Så många utlämningar i rad måste ett nytt id ha synts innan det publiceras.
#: En rad som är borta igen nästa natt var ett hål i hämtningen.
CONFIRM_SIGHTINGS = 2

#: Detsamma åt andra hållet: så många utlämningar i rad måste ett id ha saknats,
#: och så många dygn måste ha gått, innan frånvaron publiceras.
CONFIRM_ABSENCES = 2
CONFIRM_DAYS = 14

#: Antal tidigare normala utlämningar innan kommunens egen takt får höja
#: gränsen. Under så många är medianen inte ett mått, den är en slump.
BASELINE_MIN = 5

#: Hur många gånger kommunens egen mediantakt som får passera. Fem gånger en
#: normal natt är fortfarande en avvikelse värd att stanna för.
BASELINE_FACTOR = 5

#: Koordinatdecimaler vid parning av id-byte. Fyra är ungefär elva meter, alltså
#: samma port.
PAIR_DECIMALS = 4


# ---------------------------------------------------------------------------
# Hur en rad kom in och hur den gick ut
# ---------------------------------------------------------------------------

#: Tillkomst
SEED = "seed"            # första körningen mot kommunen, inget att jämföra mot
BULK = "bulk"            # en omläggning av registret, inte nyheter
NEW = "new"              # ett id kommunen inte lämnat ut förut
RETURNED = "returned"    # ett id som varit borta och kommit tillbaka
RENUMBERED = "renumbered"  # samma lokal, nytt id
SUCCESSION = "succession"  # samma adress, annat namn, samma natt

#: Avgång
GONE = "gone"            # slutade lämnas ut, inget som förklarar det
UNCONTROLLED = "uncontrolled"  # raden bar aldrig en kontroll: registerstädning

#: Bara de här två publiceras. Allt annat sparas men syns inte.
PUBLISHABLE_IN = {NEW}
PUBLISHABLE_OUT = {GONE}


@dataclass(frozen=True)
class Record:
    """En rad ur en utlämning, i det skick jämförelsen behöver den."""

    id: str
    name: str
    address: str | None = None
    lat: float | None = None
    lng: float | None = None
    #: Har raden burit minst en publicerad kontroll? Avgör om ett försvinnande
    #: får publiceras. Se punkt 4 i modulens inledning, och Uppsala 2026-08-07.
    controlled: bool = False


@dataclass(frozen=True)
class Appearance:
    id: str
    kind: str
    counterpart: str | None = None

    @property
    def publishable(self) -> bool:
        return self.kind in PUBLISHABLE_IN


@dataclass(frozen=True)
class Departure:
    id: str
    kind: str
    counterpart: str | None = None

    @property
    def publishable(self) -> bool:
        return self.kind in PUBLISHABLE_OUT


@dataclass
class Delivery:
    """Vad en utlämning gjorde med beståndet."""

    municipality_code: str
    observed_at: str
    #: 'seed' | 'bulk' | 'normal'. Beskriver utlämningen, inte raderna.
    kind: str = "normal"
    delivered: int = 0
    live_before: int = 0
    appeared: list[Appearance] = field(default_factory=list)
    departed: list[Departure] = field(default_factory=list)
    #: Dygn sedan förra utlämningen, eller None vid den första.
    days_since: float | None = None
    #: Gränsen som räknades fram, för att beslutet ska gå att läsa i efterhand.
    limit: int = 0

    @property
    def new_count(self) -> int:
        """Nytillkomna id, oavsett om de publiceras. Driver medianen."""
        return sum(1 for a in self.appeared if a.kind in (NEW, BULK))

    @property
    def publishable_in(self) -> list[Appearance]:
        return [a for a in self.appeared if a.publishable]

    @property
    def publishable_out(self) -> list[Departure]:
        return [d for d in self.departed if d.publishable]


# ---------------------------------------------------------------------------
# Normalisering för parning
# ---------------------------------------------------------------------------

_SWEDISH = {"å": "a", "ä": "a", "ö": "o", "é": "e", "è": "e", "ü": "u", "ø": "o", "æ": "a"}

#: Bolagsformer och gatuordsförkortningar som inte får avgöra om två rader är
#: samma lokal. "Pizzeria Roma AB" och "Pizzeria Roma" är samma ställe.
_NOISE = re.compile(r"\b(ab|hb|kb|handelsbolag|aktiebolag|ekonomisk forening|ek for)\b")


def _fold(value: str | None) -> str:
    """Gemener, utan diakriter, utan skiljetecken, ett mellanslag mellan ord."""
    if not value:
        return ""
    lowered = value.lower()
    for char, replacement in _SWEDISH.items():
        lowered = lowered.replace(char, replacement)
    ascii_only = (
        unicodedata.normalize("NFKD", lowered).encode("ascii", "ignore").decode("ascii")
    )
    cleaned = re.sub(r"[^a-z0-9]+", " ", ascii_only)
    return re.sub(r"\s{2,}", " ", cleaned).strip()


def normalise_name(value: str | None) -> str:
    folded = _fold(value)
    folded = _NOISE.sub(" ", folded)
    return re.sub(r"\s{2,}", " ", folded).strip()


def normalise_address(value: str | None) -> str:
    return _fold(value)


def _point(record: Record) -> str | None:
    if record.lat is None or record.lng is None:
        return None
    return f"{round(record.lat, PAIR_DECIMALS)},{round(record.lng, PAIR_DECIMALS)}"


def _unique(pairs: list[tuple[str, str]]) -> dict[str, str]:
    """Nyckel till id, men bara för nycklar EN rad bär.

    En nyckel som två rader delar duger inte till parning: två pizzerior med
    samma namn på samma gata går inte att skilja åt, och en gissning där
    flyttar en kontrollhistorik till fel lokal. Tvetydiga nycklar tas bort helt.
    """
    seen: dict[str, str | None] = {}
    for key, ident in pairs:
        if not key:
            continue
        seen[key] = None if key in seen else ident
    return {k: v for k, v in seen.items() if v is not None}


def pair_renumbered(
    gone: list[Record],
    arrived: list[Record],
) -> list[tuple[str, str, str]]:
    """Para försvunna id mot nytillkomna som beskriver samma lokal.

    Att ett id försvinner betyder inte att verksamheten är nedlagd. Källorna
    numrerar om: Linköpings API har lämnat samma tillsynsId två gånger, och
    Stockholms rutnätshämtning kan ge två likanämnda rader i olika ordning
    mellan två nätter. Kommer ett nytt id in i SAMMA utlämning som ett gammalt
    går ut, och de två beskriver samma namn på samma adress, är det ett byte av
    id och ingenting annat.

    Tre nycklar, i fallande styrka. Varje nyckel används bara när exakt en rad
    på varje sida bär den, se `_unique`.

    1. Namn och adress. Samma skylt på samma adress är samma lokal.
    2. Namn och koordinat inom elva meter. För källor utan adressfält.
    3. Adress utan namnlikhet. Då är det inte säkert ett id-byte utan kan vara
       en efterträdare i lokalen, och de två utfallen går inte att skilja åt
       utifrån. De märks `succession` och publiceras inte heller: vi kan inte
       säga att den gamla lade ned, och inte att den nya öppnade.

    Returnerar (gammalt id, nytt id, sort).
    """
    pairs: list[tuple[str, str, str]] = []
    left = {r.id: r for r in gone}
    right = {r.id: r for r in arrived}

    def match(key_of, kind: str) -> None:
        out = _unique([(key_of(r), r.id) for r in left.values()])
        into = _unique([(key_of(r), r.id) for r in right.values()])
        for key, old in sorted(out.items()):
            new = into.get(key)
            if new is None:
                continue
            pairs.append((old, new, kind))
            left.pop(old, None)
            right.pop(new, None)

    match(lambda r: f"{normalise_name(r.name)}|{normalise_address(r.address)}"
          if normalise_name(r.name) and normalise_address(r.address) else "",
          RENUMBERED)
    match(lambda r: f"{normalise_name(r.name)}|{_point(r)}"
          if normalise_name(r.name) and _point(r) else "",
          RENUMBERED)
    match(lambda r: normalise_address(r.address), SUCCESSION)

    return pairs


# ---------------------------------------------------------------------------
# Gränsen för en omläggning
# ---------------------------------------------------------------------------

def _median(values: list[int]) -> float:
    ordered = sorted(values)
    if not ordered:
        return 0.0
    middle = len(ordered) // 2
    if len(ordered) % 2:
        return float(ordered[middle])
    return (ordered[middle - 1] + ordered[middle]) / 2


def bulk_limit(
    live: int,
    days_since: float | None,
    baseline: list[int] | None = None,
) -> int:
    """Så många nya id får en utlämning bära utan att räknas som omläggning.

    Två fasta tak, och det LÄGRE av dem gäller. BULK_ROWS håller stora kommuner
    i schack, BULK_SHARE håller små. Stockholm hamnar på 25, Svenljunga på 5.
    Hade det högre gällt skulle tjugo nya rader i Svenljunga, en femtedel av
    kommunen på en natt, passerat som nyheter.

    Gränsen skalas sedan med hur lång tid utlämningen täcker, och höjs av
    kommunens egen uppmätta takt när vi sett tillräckligt många normala
    utlämningar för att medianen ska betyda något. Det gör att gränsen växer
    om en kommun visar sig registrera mer än vi antog, i stället för att ett
    antagande fattat i dag tystar ner en kommun för alltid.
    """
    hard = min(BULK_ROWS, live * BULK_SHARE)
    limit = max(float(BULK_MIN_ROWS), hard)

    if days_since is not None and days_since > SPAN_DAYS:
        limit *= min(SPAN_MAX, days_since / SPAN_DAYS)

    normal = baseline or []
    if len(normal) >= BASELINE_MIN:
        limit = max(limit, BASELINE_FACTOR * _median(normal))

    return int(round(limit))


# ---------------------------------------------------------------------------
# Jämförelsen
# ---------------------------------------------------------------------------

def reconcile(
    municipality_code: str,
    previous: list[Record],
    delivered: list[Record],
    *,
    observed_at: str,
    days_since: float | None = None,
    baseline: list[int] | None = None,
    first_delivery: bool = False,
    missing_suppressed: bool = False,
) -> Delivery:
    """Ställ en utlämning mot den förra och klassa skillnaden.

    `previous` är de id som stod som publicerade före körningen, `delivered`
    är utlämningen. `first_delivery` sätts när vi aldrig sett kommunen förut,
    och den skiljer sig från en tom `previous` som kan bero på ett fel.

    `missing_suppressed` speglar spärren i load_supabase.deactivate_missing:
    slår den till avpubliceras ingenting, och då får inget försvinnande
    registreras heller. Annars hade sidan sagt att fyrahundra verksamheter är
    borta samma natt som pipelinen bedömde att de fyrahundra var en trasig
    hämtning.
    """
    delivery = Delivery(
        municipality_code=municipality_code,
        observed_at=observed_at,
        delivered=len(delivered),
        live_before=len(previous),
        days_since=days_since,
    )

    delivered_by_id = {r.id: r for r in delivered}
    previous_by_id = {r.id: r for r in previous}

    arrived = [r for r in delivered if r.id not in previous_by_id]
    gone = [r for r in previous if r.id not in delivered_by_id]

    # Första körningen mot kommunen. Ingenting av det här är nyheter, och
    # ingenting kan ha försvunnit ur en jämförelse som inte finns.
    if first_delivery or not previous:
        delivery.kind = SEED
        delivery.appeared = [Appearance(r.id, SEED) for r in arrived]
        return delivery

    # Först id-byten, sedan resten. Ordningen är avgörande: ett par som räknas
    # som ett försvinnande OCH en nyhet blir två felaktiga rader på sidan i
    # stället för noll.
    paired = pair_renumbered(gone, arrived)
    partner_out = {old: (new, kind) for old, new, kind in paired}
    partner_in = {new: (old, kind) for old, new, kind in paired}

    unpaired_in = [r for r in arrived if r.id not in partner_in]
    unpaired_out = [r for r in gone if r.id not in partner_out]

    delivery.limit = bulk_limit(len(previous), days_since, baseline)
    is_bulk = len(unpaired_in) > delivery.limit and len(unpaired_in) >= BULK_MIN_ROWS
    if is_bulk:
        delivery.kind = BULK

    for record in arrived:
        partner = partner_in.get(record.id)
        if partner:
            delivery.appeared.append(Appearance(record.id, partner[1], partner[0]))
        else:
            delivery.appeared.append(Appearance(record.id, BULK if is_bulk else NEW))

    # Ett försvinnande som spärren stoppat är ingen observation, det är ett
    # hål. Samma sak när utlämningen som helhet är en omläggning: byter
    # kommunen id-serie försvinner hela det gamla beståndet på en natt.
    out_kind = BULK if (is_bulk or missing_suppressed) else GONE
    for record in gone:
        partner = partner_out.get(record.id)
        if partner:
            delivery.departed.append(Departure(record.id, partner[1], partner[0]))
        else:
            # En rad som aldrig burit en kontroll lämnar registret utan att
            # något en läsare sett förändras. Uppsalas 113 av 114.
            kind = out_kind if record.controlled else UNCONTROLLED
            delivery.departed.append(Departure(record.id, kind))

    return delivery


# ---------------------------------------------------------------------------
# Från observation till publicerbar händelse
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Spell:
    """En sammanhängande svit där ett id lämnades ut.

    `gone_at` är den utlämning där id:t först saknades, inte den sista det
    syntes. Det är den enda tidpunkt vi faktiskt observerat.
    """

    establishment_id: str
    municipality_code: str
    appeared_at: str
    appearance: str
    last_seen_at: str
    sightings: int = 1
    gone_at: str | None = None
    disappearance: str | None = None
    absences: int = 0
    counterpart_id: str | None = None


def _parse(value: str) -> datetime:
    text = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(text)
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _days(a: str, b: str) -> float:
    return abs((_parse(a) - _parse(b)).total_seconds()) / 86400.0


@dataclass(frozen=True)
class Event:
    """En rad sidan får visa."""

    establishment_id: str
    municipality_code: str
    #: 'ny' eller 'borta'
    kind: str
    #: ISO-datum. För 'ny' den utlämning id:t först syntes i, för 'borta' den
    #: utlämning det först saknades i.
    observed_on: str

    @property
    def month(self) -> str:
        return self.observed_on[:7]


def events(spells: list[Spell], *, now: str | None = None) -> list[Event]:
    """Vilka svit som blivit tillräckligt bekräftade för att visas.

    Bekräftelsen är hela skillnaden mellan en observation och ett påstående.
    En rad som synts en enda natt kan vara ett hål i föregående hämtning, och
    en rad som saknas en enda natt kan vara ett hål i den här. Först när
    mönstret hållit i sig över flera utlämningar säger vi något.

    Ett försvinnande kräver dessutom kalendertid och inte bara antal körningar,
    eftersom två körningar kan ligga tio minuter isär vid en omkörning.

    Sorterat på datum och ingenting annat.
    """
    del now  # gränsen ligger i sviterna själva, inte i klockan

    found: list[Event] = []
    for spell in spells:
        if spell.appearance in PUBLISHABLE_IN and spell.sightings >= CONFIRM_SIGHTINGS:
            found.append(
                Event(spell.establishment_id, spell.municipality_code, "ny", spell.appeared_at[:10])
            )

        if (
            spell.gone_at
            and spell.disappearance in PUBLISHABLE_OUT
            and spell.absences >= CONFIRM_ABSENCES
            and _days(spell.gone_at, spell.last_seen_at) >= 0
        ):
            found.append(
                Event(spell.establishment_id, spell.municipality_code, "borta", spell.gone_at[:10])
            )

    found.sort(key=lambda e: (e.observed_on, e.establishment_id), reverse=True)
    return found


def confirmed_absence(spell: Spell, latest_delivery_at: str) -> bool:
    """Har frånvaron pågått länge nog att publiceras?

    Två villkor, båda nödvändiga. Antalet utlämningar skyddar mot ett hål i
    hämtningen. Kalendertiden skyddar mot att flera omkörningar samma natt
    räknas som flera nätter.
    """
    if not spell.gone_at or spell.disappearance not in PUBLISHABLE_OUT:
        return False
    if spell.absences < CONFIRM_ABSENCES:
        return False
    return _days(latest_delivery_at, spell.gone_at) >= CONFIRM_DAYS


def months_covered(spells: list[Spell]) -> list[str]:
    """Månader någon publicerbar händelse landat i, nyast först."""
    seen = {event.month for event in events(spells)}
    return sorted(seen, reverse=True)


def month_label(month: str) -> str:
    """'2026-08' till 'augusti 2026'."""
    names = [
        "januari", "februari", "mars", "april", "maj", "juni",
        "juli", "augusti", "september", "oktober", "november", "december",
    ]
    year, _, number = month.partition("-")
    return f"{names[int(number) - 1]} {year}"


def today() -> str:
    return date.today().isoformat()
