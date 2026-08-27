"""Stockholms registreringsintyg: ett GET som ger nio fält vi saknar helt.

Staden publicerar ett registreringsintyg per anläggning, serverrenderat, utan
inloggning och utan annan parameter än anläggningens id:

    GET https://etjanster.stockholm.se/livsmedelsinspektioner/registration
        ?foodplaceid=<guid>

Guiden ÄR vårt eget id med prefixet ``F-0180-`` avklippt. Vi behöver alltså
inte slå upp någonting: varje rad i site/src/data/stockholm.json bär redan
nyckeln till sitt eget intyg. Samma sida driver också de två
anmälningsformulären, se site/src/components/Anmal.astro.

## Vad intyget lämnar ut, mätt på HELA Stockholm 2026-08-27

Talen nedan är den skarpa körningen och inte längre urvalet på 150. 8 520
anläggningar, fyra trådar, 39 minuter. 8 514 svarade med ett intyg, 6 svarade
"Inget data kunde hittas", noll fel efter att tre nya statusvärden och ett
namnuppslag hämtats om. Nämnaren är de 8 514.

    Registreringsdatum                  8 514 av 8 514
    Status, Aktiv eller Inaktiv         8 514 av 8 514
    Huvudsaklig inriktning              8 514 av 8 514
    God efterlevnad                     8 514 av 8 514
    Tredjepartscertifiering             8 514 av 8 514
    Omfattning, storleksklass           8 513 av 8 514
    Verksamhetstyper                    8 511 av 8 514
    Beslutad kontrollfrekvens per 5 år  8 507 av 8 514
    Livsmedelsföretagare                8 488 av 8 514
    Postnummer och ort                  8 486 av 8 514
    Organisationsnummer, publicerbart   8 016 av 8 514
    Beslutsdatum för riskklassning      7 904 av 8 514
    Alla aktiviteter                    7 645 av 8 514

Vi hade NOLL av dessa på samtliga 16 047 rader innan körningen. Postnumret
ensamt fyller ett fält som docs/12 räknade som tomt i alla 15 916 rader det
mättes på.

Fördelningar ur samma 8 514: aktiebolag 6 415, kommun eller stat 842, enskild
firma 491, handelsbolag 427, ideell förening 212, ekonomisk förening 119, samt
8 utan läsbar form. 5 666 unika organisationsnummer på 8 016 rader, alltså bär
koncerner och kedjor flera rader var. 30 rader är inte längre aktiva.

## VARFÖR DET HÄR ERSÄTTER BINÄRSÖKNINGEN I docs/12

docs/12 beskriver hur ett organisationsnummer går att pressa ur sökfiltret
``FoodPlaceOrgNr`` med en prefixnedstigning på ungefär 60 anrop per
verksamhet, och rekommenderar därför att först gissa ur Bolagsverkets bulkfil
och sedan bekräfta med ett anrop. Intyget lämnar ut numret direkt. Ett anrop i
stället för sextio, ingen bulkfil, ingen namnmatchning, ingen gissning som
kan bli fel företag. Se docs/12 avsnitt A1.

## PERSONNUMMER SKRIVS ALDRIG NED

Fältet heter "Person/Organisationsnummer", och det är ingen slarvig rubrik. En
enskild firma har inget organisationsnummer; där står innehavarens
personnummer. Att staden lämnar ut det i en allmän handling gör det inte till
något vi får återpublicera på en sida om en namngiven verksamhet, och ett
personnummer som en gång stått i Googles index går inte att ta tillbaka.

`ar_personnummer` skiljer dem åt på den regel som gäller: ett svenskt
organisationsnummer har alltid minst 2 som tredje siffra, medan ett
personnummers tredje siffra är månadens första och alltså 0 eller 1.
`raden` släpper igenom organisationsnummer och sätter numret till None när det
är ett personnummer. Uppgiften "det finns ingen juridisk person bakom" bärs i
stället av `foretagsform`, som säger `enskild` utan att röja vem.

Uppmätt över hela beståndet 2026-08-27: 498 av 8 514 rader bar ett nummer som
hölls inne, varav 491 är personnummer i tiosiffrig form och 7 är rader där
staden skrivit "Enskild firma. Se övrigt." i sifferfältet. Noll personnummer
finns i site/src/data, prövat med `IngetPersonnummerILevererad` i
pipeline/tests/test_stockholmsintyg.py, som söker igenom varje sträng i varje
sparad rad och inte bara `orgnr`.

NAMNET ÄR OCKSÅ EN PERSONUPPGIFT. Fältet "Livsmedelsföretagare" bär
innehavarens namn i klartext på samma rader, uppmätt på 451 av dem: "Pierre
Oanes", "Åsa Johansson Ef Niddes Café". Numret hålls inne här i pipelinen,
namnet hålls inne på sidan, se `registerrader` i site/src/lib/registrering.ts.
Att hålla inne det ena och skriva ut det andra vore att hålla inne halva
uppgiften.

## VAD MODULEN INTE GÖR

Ingen nätverkstrafik utom `hamta`, och ingen skrivning i site/src/data. Att
läsa sidan och att bestämma sig för att publicera den är två olika beslut, och
det andra fattas i pipeline/stockholmsintyg.py.
"""

from __future__ import annotations

import re
import urllib.error
import urllib.request

from dataclasses import dataclass
from datetime import date
from html.parser import HTMLParser
from typing import Optional, Tuple

MUNICIPALITY_CODE = "0180"
ID_PREFIX = f"F-{MUNICIPALITY_CODE}-"

INTYG_URL = (
    "https://etjanster.stockholm.se/livsmedelsinspektioner/registration"
    "?foodplaceid={guid}"
)
#: Samma intyg som PDF. Endast GET; POST svarar 411. Två sidor, dryga 80 kB.
PDF_URL = (
    "https://etjanster.stockholm.se/Livsmedelsinspektioner/Registration/GetPdf"
    "?foodplaceid={guid}"
)

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"

#: Sidan svarar 200 med den här rubriken när guiden inte finns. Alltså
#: degraderar ett felaktigt id tyst och säkert, och en tom sida är ett svar
#: och inte ett fel. Skräpvärde som inte alls är ett guid ger 500.
SAKNAS = "Inget data kunde hittas"


class OkantVarde(Exception):
    """Intyget bar ett värde vi inte känner igen i ett fält som styr ett besked.

    Samma hållning som `sources.stockholm.UnknownSourceValue`: Status avgör om
    vi säger att en verksamhet upphört, och "God efterlevnad" är kommunens
    egen efterlevnadsbedömning. Ett okänt värde som tyst tolkas som det
    vanligaste är precis den sortens fel som förstör förtroendet.
    """


def guid(id_national: str) -> str:
    """Vårt id till stadens foodplaceid.

    `F-0180-48c4ef0c-...` blir `48c4ef0c-...`. Bekräftat 2026-08-25 mot
    stadens egen sökning: 25 slumpade verksamheter sökta på namn i
    /Matforgiftning/Place/SearchFoodPlace gav 25 av 25 exakt vårt guid
    tillbaka. Registren är samma register.
    """
    if not id_national.startswith(ID_PREFIX):
        raise ValueError(f"{id_national!r} är inte ett stockholmsid")
    return id_national[len(ID_PREFIX):]


def intygslank(id_national: str) -> str:
    return INTYG_URL.format(guid=guid(id_national))


def pdflank(id_national: str) -> str:
    return PDF_URL.format(guid=guid(id_national))


# ---------------------------------------------------------------------------
# Värdeöversättning
# ---------------------------------------------------------------------------

#: Status. Se docstringen: "Inaktiv" är kommunens eget besked om att den egna
#: registreringen upphört, alltså ett starkare underlag än SCB:s
#: arbetsställeregister och utan certifikat. Se docs/25 och docs/35.
#:
#: TRE VÄRDEN OCH INTE TVÅ. "Upphörd/Skrotad" fanns inte i urvalet på 150 och
#: fälldes därför av `OkantVarde` på 3 av 8 520 i den skarpa körningen
#: 2026-08-27, precis som undantaget är byggt för. Larmet gjorde sitt jobb och
#: värdet är läst av en människa innan det skrevs in här: alla tre bär ordet
#: "Upphörd" redan i verksamhetens NAMN, alltså är det stadens eget besked om
#: att registreringen tagits ur bruk. Det betyder samma sak som "Inaktiv" och
#: översätts därför likadant.
#:
#: LÄGG ALDRIG TILL ETT VÄRDE HÄR UTAN ATT HA SETT SIDAN. Poängen med
#: `OkantVarde` är att ett nytt ord ska stanna körningen och inte tolkas som
#: det vanligaste, se undantagets docstring.
STATUS = {"Aktiv": True, "Inaktiv": False, "Upphörd/Skrotad": False}

JA_NEJ = {"Ja": True, "Nej": False}

#: Etiketterna i intygets tre tabeller, ordagrant. Nyckeln är etiketten,
#: värdet vårt fältnamn. Ett fält som INTE står här hamnar i `okanda_falt` och
#: skrivs ut av hämtaren; det är hur vi får veta att staden lagt till en rad.
FALT = {
    "Namn på verksamhet": "namn",
    "Person/Organisationsnummer": "nummer",
    "Besöksadress": "besoksadress",
    "Livsmedelsföretagare": "livsmedelsforetagare",
    "c/o": "co",
    "Postadress": "postadress",
    "Postnummer": "postnummer",
    "Ort": "ort",
    "Status": "status",
    "Inriktning": "inriktning",
    "Registreringsdatum": "registreringsdatum",
    "Huvudsaklig Inriktning": "huvudsaklig_inriktning",
    "Verksamhetstyper och huvudaktiviteter": "verksamhetstyper",
    "Alla aktiviteter": "aktiviteter",
    "Omfattning": "omfattning",
    "God efterlevnad": "god_efterlevnad",
    "Tredjepartscertifiering": "tredjepartscertifiering",
    "Beslutsdatum för riskklassning": "riskklassbeslut",
    "Beslutad kontrollfrekvens per 5 år": "kontrollfrekvens",
}

#: Rader i intyget som inte är fält utan löptext till läsaren. De hamnar inte
#: i `okanda_falt`, alltså larmar hämtaren inte om dem.
#:
#: Ett larm som ljuder vid varje körning utan att någonsin betyda något lär
#: den som läser loggen att bläddra förbi larmen, och då tystas också det som
#: faktiskt är en nyhet. "Övrigt"-raden stod på 7 av 8 510 i den skarpa
#: körningen 2026-08-27 och säger ordagrant åt läsaren att kontakta
#: Bolagsverket. Den bär ingen uppgift om verksamheten.
#:
#: Matchningen sker på inledningen och inte på hela strängen: cellen bär hela
#: meningen efter etiketten, och den meningen kan staden skriva om utan att
#: raden blir en annan rad.
IGNORERADE = ("Övrigt",)

_SIFFROR = re.compile(r"\D")
_DATUM = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_MELLANRUM = re.compile(r"\s+")


def _stad(text: str) -> str:
    """Ett mellanslag mellan orden och inget i kanterna.

    Intyget är genererad HTML med indrag i cellerna, och en c/o-rad kom
    tillbaka som "Pressbyrån  Centralen Över Hallen" med dubbelt mellanslag.
    """
    return _MELLANRUM.sub(" ", text).strip()


def ar_personnummer(nummer: str) -> bool:
    """Är numret en fysisk persons och inte ett bolags?

    Regeln är den som gäller för svenska identitetsnummer: ett
    organisationsnummer har alltid minst 2 som TREDJE siffra, eftersom
    gruppsiffran därefter skiljer bolagsformerna åt. Ett personnummer bär
    födelsedatum i formen ÅÅMMDD, och månadens första siffra är 0 eller 1.
    Samordningsnummer lägger 60 till dagen och rör inte den tredje siffran.

    Tio siffror krävs. Ett kortare eller längre värde är inte något vi känner
    igen, och då behandlas det som personligt: det försiktiga svaret när vi
    inte vet är att INTE publicera.
    """
    siffror = _SIFFROR.sub("", nummer or "")
    if len(siffror) != 10:
        return True
    return siffror[2] in "01"


def _datum(text: str) -> Optional[date]:
    text = _stad(text)
    if not _DATUM.match(text):
        return None
    return date.fromisoformat(text)


def _heltal(text: str) -> Optional[int]:
    text = _stad(text)
    return int(text) if text.isdigit() else None


def _postnummer(text: str) -> Optional[str]:
    """"111 40" blir "11140". Samma form som Oskarshamns PostNr."""
    siffror = _SIFFROR.sub("", text or "")
    return siffror if len(siffror) == 5 else None


# ---------------------------------------------------------------------------
# Läsning
# ---------------------------------------------------------------------------


class _Tabellasare(HTMLParser):
    """Plockar ut varje ``<tr>`` som etikett plus rader ur intygets tabeller.

    Sidan är genererad av ett ärendesystem med samma mall för alla tre
    tabellerna: rubrikcellen bär etiketten, värdecellen texten, och flervärda
    celler skiljer sina rader med ``<br />``. Det räcker att följa th och td.

    Ingen tredjepartsparser, samma regel som `prikko.pdf`: pipelinen ska kunna
    köras i en tom container. `convert_charrefs` är på som standard, så
    ``&#229;`` är redan ett å när `handle_data` får texten.
    """

    def __init__(self) -> None:
        super().__init__()
        self.rader: list[Tuple[str, list[str]]] = []
        self.saknas = False
        self._etikett: Optional[str] = None
        self._varden: list[str] = []
        self._buffert: list[str] = []
        self._i_th = False
        self._i_td = False
        self._i_h3 = False

    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self._etikett = None
            self._varden = []
        elif tag == "th":
            self._i_th = True
            self._buffert = []
        elif tag == "td":
            self._i_td = True
            self._buffert = []
        elif tag == "br" and self._i_td:
            self._varden.append(_stad("".join(self._buffert)))
            self._buffert = []
        elif tag == "h3":
            self._i_h3 = True
            self._buffert = []

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        if tag == "th" and self._i_th:
            self._i_th = False
            self._etikett = _stad("".join(self._buffert))
            self._buffert = []
        elif tag == "td" and self._i_td:
            self._i_td = False
            self._varden.append(_stad("".join(self._buffert)))
            self._buffert = []
        elif tag == "tr":
            if self._etikett:
                self.rader.append(
                    (self._etikett, [v for v in self._varden if v])
                )
            self._etikett = None
            self._varden = []
        elif tag == "h3" and self._i_h3:
            self._i_h3 = False
            if SAKNAS in "".join(self._buffert):
                self.saknas = True
            self._buffert = []

    def handle_data(self, data):
        if self._i_th or self._i_td or self._i_h3:
            self._buffert.append(data)


@dataclass(frozen=True)
class Intyg:
    """Ett registreringsintyg, läst men inte bedömt."""

    guid: str
    namn: str
    #: Person- ELLER organisationsnummer, ordagrant som staden skriver det.
    #: Får aldrig gå vidare orört, se `raden` och `ar_personnummer`.
    nummer: Optional[str]
    besoksadress: Optional[str]
    livsmedelsforetagare: Optional[str]
    co: Optional[str]
    postadress: Optional[str]
    postnummer: Optional[str]
    ort: Optional[str]
    #: True för "Aktiv", False för "Inaktiv". Se `STATUS`.
    aktiv: Optional[bool]
    inriktning: Optional[str]
    registreringsdatum: Optional[date]
    huvudsaklig_inriktning: Optional[str]
    verksamhetstyper: Tuple[str, ...]
    aktiviteter: Tuple[str, ...]
    omfattning: Optional[str]
    god_efterlevnad: Optional[bool]
    tredjepartscertifiering: Optional[bool]
    riskklassbeslut: Optional[date]
    kontrollfrekvens: Optional[int]
    #: Etiketter i intyget som inte står i `FALT`. Tomt i alla 150 mätta, och
    #: hämtaren skriver ut dem, för en ny rad hos staden är en nyhet.
    okanda_falt: Tuple[str, ...] = ()


def las(html: str, guid_: str) -> Optional[Intyg]:
    """Läs ett intyg. None när staden inte känner igen guiden.

    NONE ÄR ETT SVAR OCH INTE ETT FEL. Ett påhittat guid ger 200 med rubriken
    "Inget data kunde hittas för den här anläggningen", alltså degraderar
    spåret tyst och säkert när ett id blivit fel. Uppmätt 2026-08-25 på
    00000000-0000-0000-0000-000000000000.
    """
    lasare = _Tabellasare()
    lasare.feed(html)

    if lasare.saknas or not lasare.rader:
        return None

    varden: dict[str, list[str]] = {}
    okanda: list[str] = []
    for etikett, rader in lasare.rader:
        falt = FALT.get(etikett)
        if falt is None:
            if etikett.startswith(IGNORERADE):
                continue
            if etikett not in okanda:
                okanda.append(etikett)
            continue
        varden[falt] = rader

    def en(falt: str) -> Optional[str]:
        rader = varden.get(falt) or []
        return rader[0] if rader else None

    def flagga(falt: str) -> Optional[bool]:
        text = en(falt)
        if text is None:
            return None
        if text not in JA_NEJ:
            raise OkantVarde(f"Okänt {falt} {text!r} för {guid_}")
        return JA_NEJ[text]

    status = en("status")
    if status is not None and status not in STATUS:
        raise OkantVarde(f"Okänd Status {status!r} för {guid_}")

    return Intyg(
        guid=guid_,
        namn=en("namn") or "",
        nummer=en("nummer"),
        besoksadress=en("besoksadress"),
        livsmedelsforetagare=en("livsmedelsforetagare"),
        co=en("co"),
        postadress=en("postadress"),
        postnummer=_postnummer(en("postnummer") or ""),
        ort=en("ort"),
        aktiv=STATUS[status] if status else None,
        inriktning=en("inriktning"),
        registreringsdatum=_datum(en("registreringsdatum") or ""),
        huvudsaklig_inriktning=en("huvudsaklig_inriktning"),
        verksamhetstyper=tuple(varden.get("verksamhetstyper") or ()),
        aktiviteter=tuple(varden.get("aktiviteter") or ()),
        omfattning=en("omfattning"),
        god_efterlevnad=flagga("god_efterlevnad"),
        tredjepartscertifiering=flagga("tredjepartscertifiering"),
        riskklassbeslut=_datum(en("riskklassbeslut") or ""),
        kontrollfrekvens=_heltal(en("kontrollfrekvens") or ""),
        okanda_falt=tuple(okanda),
    )


# ---------------------------------------------------------------------------
# Raden som får publiceras
# ---------------------------------------------------------------------------

#: Företagsform härledd ur numrets gruppsiffra. Bara de former som faktiskt
#: driver livsmedelsverksamhet står med; resten blir None och skrivs inte ut.
#: Poängen är att kunna säga "enskild firma" utan att skriva personnumret.
FORETAGSFORM = {
    "2": "stat_kommun",
    "5": "aktiebolag",
    "7": "ekonomisk_forening",
    "8": "ideell_forening",
    "9": "handelsbolag",
}


def foretagsform(nummer: Optional[str]) -> Optional[str]:
    if not nummer:
        return None
    siffror = _SIFFROR.sub("", nummer)
    if len(siffror) != 10:
        return None
    if ar_personnummer(nummer):
        return "enskild"
    return FORETAGSFORM.get(siffror[0])


def raden(intyg: Intyg, kontrollerad: date) -> dict:
    """Intyget i den form en verksamhetsrad kan bära.

    ORGANISATIONSNUMRET SKRIVS BARA NÄR DET ÄR ETT BOLAGS. Se modulens
    docstring. `foretagsform` bär ändå upplysningen att verksamheten drivs som
    enskild firma, vilket är det läsaren har nytta av, utan att numret följer
    med.

    `checkedAt` av samma skäl som i `hours` och `contact`: uppgiften är hämtad
    vid en tidpunkt och kan ha ändrats sedan dess, och en rad utan det datumet
    går inte att åldras.
    """
    return {
        "orgnr": None if ar_personnummer(intyg.nummer or "") else intyg.nummer,
        "companyForm": foretagsform(intyg.nummer),
        "operator": intyg.livsmedelsforetagare,
        "postalCode": intyg.postnummer,
        "city": intyg.ort,
        "active": intyg.aktiv,
        "registeredAt": (
            intyg.registreringsdatum.isoformat() if intyg.registreringsdatum else None
        ),
        "focus": intyg.huvudsaklig_inriktning,
        "businessTypes": list(intyg.verksamhetstyper),
        "activities": list(intyg.aktiviteter),
        "scope": intyg.omfattning,
        "compliance": intyg.god_efterlevnad,
        "certified": intyg.tredjepartscertifiering,
        "riskDecidedAt": (
            intyg.riskklassbeslut.isoformat() if intyg.riskklassbeslut else None
        ),
        "frequency": intyg.kontrollfrekvens,
        "checkedAt": kontrollerad.isoformat(),
    }


# ---------------------------------------------------------------------------
# Hämtning
# ---------------------------------------------------------------------------


def hamta(guid_: str, timeout: int = 60) -> Optional[Intyg]:
    """Ett GET, ett intyg. None när staden inte känner igen guiden.

    Skalmätning 2026-08-25: 300 slumpade anläggningar, fyra trådar, 58
    sekunder, noll fel. Hela Stockholm är 8 520 anrop och alltså dryga
    halvtimmen. FLER ÄN FYRA TRÅDAR ANVÄNDS INTE. Vi lever på att kommunerna
    fortsätter tycka om oss, se pipeline/fetch_stockholm.py.
    """
    request = urllib.request.Request(
        INTYG_URL.format(guid=guid_),
        headers={"User-Agent": USER_AGENT},
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        html = response.read().decode("utf-8", "replace")
    return las(html, guid_)
