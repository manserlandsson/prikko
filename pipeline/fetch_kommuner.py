#!/usr/bin/env python3
"""Bygg grunddatat för kommunmaskinen, en rad per kommun i riket.

    python3 pipeline/fetch_kommuner.py              # bygg allt
    python3 pipeline/fetch_kommuner.py --ingen-krypning   # hoppa över webbläsningen

Resultatet är `pipeline/data/kommuner.json`, 290 poster. Filen är maskinens
adresslista: vem som ska ha en framställan enligt offentlighetsprincipen, vad
svaret är värt, och vilken myndighet som svarar för flera kommuner samtidigt.

## Skillnaden mot kommunregister.csv

`kommunregister.csv` har en rad per KONTROLLMYNDIGHET, 250 stycken. Det är rätt
enhet när brev ska skrivas, för ett brev går till en myndighet. Den här filen
har en rad per KOMMUN, 290 stycken. Det är rätt enhet när täckningen ska mätas
och när en besökare frågar om sin egen kommun. De två filerna beskriver samma
verklighet ur var sitt håll och registret är källan till kopplingen mellan dem.

## Källorna, och vad var och en får bestämma

| Fält | Källa | Varför just den |
|---|---|---|
| Vilka 290 kommuner som finns | Kolada `/v3/municipality` | Grinden. Antalet måste bli 290, annars stannar körningen |
| Invånare | Kolada N01951, som i sin tur är SCB | Samma nyckeltal som resten av projektet redan använder |
| Län | Kommunkodens två första siffror | SCB:s egen konstruktion. Kontrolleras mot Wikidata, se nedan |
| Webbplats | Wikidata P856, annars handlingar.se | Två oberoende källor som går att jämföra |
| Kontrollmyndighet och förbund | `kommunregister.csv` | Härlett ur Livsmedelsverkets rapport |
| E-post | Kommunens egen webbplats, läst vid körningen | Den enda källa som är kommunen själv |

Länskoden härleds ur kommunkoden i stället för att hämtas, men den härledningen
kontrolleras: varje tvåsiffrigt prefix jämförs mot länsnamnen i Wikidata, och
körningen stannar om ett prefix pekar på fler än ett län. Vid bygget gav de 290
kommunkoderna exakt 21 län utan en enda konflikt.

## Varför e-postadresserna krypas och inte gissas

Nästan varje svensk kommun kan nås på `kommun@<namn>.se`. Det mönstret stämmer
ofta och det är ändå oanvändbart, för de gånger det inte stämmer syns inte, och
ett brev till en död adress ser för avsändaren likadant ut som ett brev som
ingen svarat på än. Därför läses varje adress ur kommunens egen webbplats, och
varje adress bär den URL den lästes ur och datumet. Hittades ingen adress står
fältet tomt. Tomt är ett ärligt svar, en gissning är det inte.

Krypningen är avsiktligt trubbig. Den hämtar startsidan, följer länkar som ser
ut att leda till kontaktuppgifter eller till miljö- och livsmedelssidor, och
plockar ut e-postadresser på kommunens egen domän. Den läser inte formulär, den
fyller inte i något, och den rör inga e-tjänster. Adressen klassas sedan som
`miljo` eller `allman` efter vad som står före snabel-a. En `miljo`-adress går
rakt till den nämnd som äger livsmedelskontrollen. En `allman` adress går till
registrator, som är en fullgod mottagare enligt tryckfrihetsförordningen men
kostar ett internt steg.

Ingenting i den här filen skickar ett mejl. Den bygger bara adresslistan.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from prikko.sources import kolada  # noqa: E402

DATA = ROOT / "data"
CACHE = DATA / "interim" / "kommunkrypning"
REGISTER = DATA / "kommunregister.csv"
UT = DATA / "kommuner.json"

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"

WIKIDATA = "https://query.wikidata.org/sparql"
HANDLINGAR = "https://handlingar.se/body/all-authorities.csv"

#: Kommunkodens två första siffror är länskoden. Namnen kontrolleras mot
#: Wikidata vid varje körning, tabellen får aldrig tystna om den blir fel.
LAN = {
    "01": "Stockholms län",
    "03": "Uppsala län",
    "04": "Södermanlands län",
    "05": "Östergötlands län",
    "06": "Jönköpings län",
    "07": "Kronobergs län",
    "08": "Kalmar län",
    "09": "Gotlands län",
    "10": "Blekinge län",
    "12": "Skåne län",
    "13": "Hallands län",
    "14": "Västra Götalands län",
    "17": "Värmlands län",
    "18": "Örebro län",
    "19": "Västmanlands län",
    "20": "Dalarnas län",
    "21": "Gävleborgs län",
    "22": "Västernorrlands län",
    "23": "Jämtlands län",
    "24": "Västerbottens län",
    "25": "Norrbottens län",
}

#: Ord före snabel-a som gör adressen till miljöförvaltningens och inte
#: kommunens allmänna. Ordningen är prioritetsordningen.
MILJOORD = (
    "livsmedel",
    "miljokontoret",
    "miljoforvaltningen",
    "miljoochhalsoskydd",
    "miljo-och-halsoskydd",
    "miljohalsa",
    "miljoenheten",
    "miljonamnden",
    "miljoavdelningen",
    "miljo",
    "byggochmiljo",
    "bygg-och-miljo",
    "byggmiljo",
    "samhallsbyggnad",
    "samhallsbyggnadsforvaltningen",
    "samhallsbyggnadskontoret",
    "sbf",
    "tillsyn",
)

#: Ord som gör adressen till en trolig registrator eller kontaktcentral.
ALLMANORD = (
    "registrator",
    "diarium",
    "diarie",
    "kommunstyrelsen",
    "kommunledning",
    "kanslienheten",
    "kansli",
    "kommun",
    "kontaktcenter",
    "kontaktcentret",
    "kundcenter",
    "kundtjanst",
    "servicecenter",
    "servicecentret",
    "kontaktcentrum",
    "medborgarkontoret",
    "medborgarservice",
    "kontakt",
    "info",
    "kundservice",
    "stadshuset",
    "stadshus",
    "kommunhuset",
    "kommunkontoret",
    "post",
    "kommunen",
)

#: Adresser vi aldrig vill ha. Vaktmästeri, jobbansökningar, skolor.
SKRAP = re.compile(
    r"(webmaster|webbredaktion|webbmaster|press|jobb|rekryter|skola|forskola|"
    r"bibliotek|turism|fritid|kultur|no-?reply|noreply|exempel|example|test@|"
    r"faktura|leverantor|@example|support|itsupport|larm|felanmalan)",
    re.I,
)

#: Platshållare som ser ut som adresser men aldrig går fram. Kommunerna skriver
#: ut dem för att förklara sitt eget adressmönster.
PLATSHALLARE = re.compile(
    r"^(f[oö]?rnamn|fornamn|namn|efternamn|rnamn|anv[aä]ndarnamn)[._-]", re.I
)

#: En lokaldel som ser ut som en persons namn, till exempel `anna.svensson`.
#: Sådana adresser plockas bort helt. En framställan ska gå till en funktion och
#: inte till en enskild handläggare: personen kan vara sjuk, ha slutat eller
#: sitta på fel avdelning, och adressen är dessutom en personuppgift som vi inte
#: har någon anledning att spara.
PERSONNAMN = re.compile(r"^[a-zåäöéü]{2,}[._-][a-zåäöéü]{2,}(?:[._-][a-zåäöéü]+)?$")

EPOST = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")

#: Gemensamma myndigheters egna adresser, lästa för hand på förbundets egen
#: webbplats. De kan inte krypas fram som kommunernas, eftersom ett förbund har
#: en egen domän som ingen medlemskommuns webbplats behöver nämna. Nyckeln är
#: myndighetskoden i `kommunregister.csv`. Varje rad bär den URL adressen lästes
#: på och datumet den lästes, precis som `kommunkontakter.csv`.
FORBUNDSKONTAKT = {
    "1446": ("info@miljoskaraborg.se", "https://www.miljoskaraborg.se/", "2026-08-30"),
    "1214": ("info@smfo.se", "http://www.smfo.se/", "2026-08-30"),
    "1438": ("kansli@dalsland.se", "https://www.dalsland.se/", "2026-08-30"),
    "1270": ("exp@ystadosterlenmiljo.se", "https://www.ystadosterlenmiljo.se/", "2026-08-30"),
    "1060": ("miljokontoret@miljovast.se", "https://www.miljovast.se/", "2026-08-30"),
    "2101": ("vgs@sandviken.se", "https://www.sandviken.se/vgs", "2026-08-30"),
    "1960": ("arboga.kommun@arboga.se", "https://www.vmmf.se/", "2026-08-30"),
}

#: Sidor som bär kommunens allmänna adress och registrator.
KONTAKTSIDA = re.compile(
    r"(kontakt|kontakta-oss|kontakta_oss|kontaktaoss|allman-handling|"
    r"allmanna-handlingar|allm%C3%A4n|diarium|diarie|registrator|"
    r"kommun-och-politik|kommunochpolitik)",
    re.I,
)

#: Sidor som bär miljöförvaltningens egen adress. Det är den vi helst vill ha,
#: för den går till nämnden som äger livsmedelskontrollen.
MILJOSIDA = re.compile(
    r"(livsmedel|milj[o%]|milj%C3%B6|h[a%]lsoskydd|h%C3%A4lsoskydd|"
    r"bygg-och-miljo|byggochmiljo|samhallsbyggnad|samh%C3%A4llsbyggnad|"
    r"miljokontoret|miljoforvaltning|tillsyn|restaurang|hygien)",
    re.I,
)


# ---------------------------------------------------------------------------
# Hämtning
# ---------------------------------------------------------------------------


def hamta(url: str, timeout: int = 25) -> Optional[bytes]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return response.read(2_000_000)
    except Exception:
        return None


def cachad(namn: str, url: str, timeout: int = 25) -> Optional[bytes]:
    """Hämta en gång och spara. En omkörning ska inte belasta kommunerna igen."""
    CACHE.mkdir(parents=True, exist_ok=True)
    fil = CACHE / namn
    if fil.exists():
        return fil.read_bytes() or None
    data = hamta(url, timeout)
    fil.write_bytes(data or b"")
    return data


# ---------------------------------------------------------------------------
# Källa: Kolada
# ---------------------------------------------------------------------------


def kommuner_ur_kolada() -> Dict[str, str]:
    payload = kolada._get("municipality", page_size=400)
    rader = {
        rad["id"]: rad["title"]
        for rad in payload.get("values") or []
        if rad.get("type") == "K"
    }
    if len(rader) != 290:
        raise SystemExit(
            f"Kolada gav {len(rader)} kommuner, inte 290. Bygget stannar, för "
            f"en lista som inte är hela riket är värre än ingen lista."
        )
    return rader


# ---------------------------------------------------------------------------
# Källa: Wikidata
# ---------------------------------------------------------------------------

SPARQL = """
SELECT ?kod ?namn ?lan ?webb WHERE {
  ?k wdt:P31 wd:Q127448 .
  ?k wdt:P525 ?kod .
  ?k rdfs:label ?namn FILTER(lang(?namn)="sv")
  OPTIONAL { ?k wdt:P131 ?l . ?l wdt:P31 wd:Q200547 .
             ?l rdfs:label ?lan FILTER(lang(?lan)="sv") }
  OPTIONAL { ?k wdt:P856 ?webb }
}
"""


def wikidata(koder: Set[str]) -> Tuple[Dict[str, str], Dict[str, Set[str]]]:
    """Webbplats per kommunkod, och länsnamn per länsprefix att kontrollera mot.

    Wikidata bär även historiska kommunkoder, till exempel Skövdes gamla 1683
    vid sidan av dagens 1496. Därför filtreras allt mot Koladas 290 koder.
    """
    url = WIKIDATA + "?" + urllib.parse.urlencode({"query": SPARQL})
    CACHE.mkdir(parents=True, exist_ok=True)
    fil = CACHE / "wikidata.json"
    # Wikidatas SPARQL-ändpunkt stryper den som frågar om igen. Svaret ändras
    # ändå bara när en kommun byter webbplats, så det sparas och återanvänds.
    if fil.exists() and fil.stat().st_size:
        payload = json.loads(fil.read_text(encoding="utf-8"))
    else:
        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "application/sparql-results+json",
            },
        )
        with urllib.request.urlopen(request, timeout=120) as response:
            rå = response.read().decode("utf-8")
        fil.write_text(rå, encoding="utf-8")
        payload = json.loads(rå)

    webb: Dict[str, str] = {}
    lan: Dict[str, Set[str]] = defaultdict(set)
    for rad in payload["results"]["bindings"]:
        kod = rad["kod"]["value"]
        if kod not in koder:
            continue
        if "webb" in rad and kod not in webb:
            webb[kod] = rad["webb"]["value"].rstrip("/")
        if "lan" in rad:
            lan[kod[:2]].add(rad["lan"]["value"])
    return webb, lan


def kontrollera_lan(lan: Dict[str, Set[str]]) -> None:
    """Härledningen får bara stå kvar om den stämmer mot en oberoende källa."""
    for prefix, namn in sorted(lan.items()):
        if len(namn) > 1:
            raise SystemExit(
                f"länsprefixet {prefix} pekar på flera län i Wikidata: {sorted(namn)}. "
                f"Härledningen ur kommunkoden håller inte längre."
            )
        vart = LAN.get(prefix)
        deras = next(iter(namn))
        if vart and vart != deras:
            raise SystemExit(
                f"länsprefixet {prefix} heter {deras!r} i Wikidata men {vart!r} "
                f"i vår tabell. Rätta tabellen, gissa inte."
            )
    saknas = set(LAN) - set(lan)
    if saknas:
        print(f"  varning: inget wikidatastöd för länsprefix {sorted(saknas)}")


# ---------------------------------------------------------------------------
# Källa: handlingar.se
# ---------------------------------------------------------------------------


def handlingar() -> Dict[str, dict]:
    """Kommunnamn till post på handlingar.se, den svenska Alaveteli-instansen.

    Sidan bär inte myndigheternas e-postadresser publikt, så den kan inte ge oss
    mottagare. Den ger två andra saker: en andra källa till webbplatsen, och en
    färdig lista över kommunalförbund med taggen `miljoforbund`.
    """
    data = cachad("handlingar.csv", HANDLINGAR, timeout=90)
    if not data:
        return {}
    rader = csv.DictReader(data.decode("utf-8").splitlines())
    ut: Dict[str, dict] = {}
    for rad in rader:
        namn = (rad.get("Name") or "").strip()
        if not namn.endswith(" kommun") and namn not in ("Gotlands kommun",):
            continue
        kort = namn[: -len(" kommun")].strip()
        ut[kort] = {
            "webbplats": (rad.get("Home page") or "").strip().rstrip("/"),
            "url": f"https://handlingar.se/body/{rad.get('URL name')}",
        }
    return ut


# ---------------------------------------------------------------------------
# Källa: kommunernas egna webbplatser
# ---------------------------------------------------------------------------


class Lankar(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.href: List[str] = []

    def handle_starttag(self, tag, attrs):
        if tag != "a":
            return
        for namn, varde in attrs:
            if namn == "href" and varde:
                self.href.append(varde)


#: Rester av kodning som klistrar sig fast framför adressen när den står inne i
#: JSON eller HTML på sidan. `>` är ett större-än-tecken som aldrig
#: avkodades, och utan det här steget blir adressen `u003ekommun@ort.se`.
KODREST = re.compile(r"^(u00[0-9a-f]{2}|x[0-9a-f]{2}|amp|quot|gt|lt|nbsp|39|34)+", re.I)


def _normalisera(adress: str) -> str:
    adress = adress.strip().strip(".,;:()<>\"'").lower()
    return KODREST.sub("", adress)


def _plattad(adress: str) -> str:
    return adress.split("@", 1)[0].replace(".", "").replace("-", "").replace("_", "")


def _translitterera(text: str) -> str:
    """å och ä blir a, ö blir o, precis som i kommunernas egna domännamn.

    Utan det här steget känner vi inte igen `malmostad@malmo.se` som Malmös
    egen adress, eftersom kommunen heter Malmö med ö och domänen skrivs utan.
    """
    for från, till in (("å", "a"), ("ä", "a"), ("ö", "o"), ("é", "e"), ("ü", "u")):
        text = text.replace(från, till)
    return text


def _kommunord(kommun: str) -> Set[str]:
    """Kommunens namn som det kan tänkas stå i en adress, hela och sista ledet.

    Upplands Väsby når man på `vasbydirekt@upplandsvasby.se`. Adressen bär
    alltså sista ledet i namnet och inte hela, så bägge formerna behövs.
    """
    platt = _translitterera(kommun.lower())
    delar = [d for d in re.split(r"[\s\-]+", platt) if len(d) > 3]
    ord_ = {platt.replace(" ", "").replace("-", "")}
    if delar:
        ord_.add(delar[-1])
    return ord_


def duger(adress: str, domän: str, kommun: str) -> bool:
    """Är adressen en funktionsadress hos kommunen, och inte en person?"""
    if not adress.endswith(domän) or SKRAP.search(adress):
        return False
    lokal = adress.split("@", 1)[0]
    if PLATSHALLARE.match(lokal):
        return False
    platt = _plattad(adress)
    känt = any(platt.startswith(o.replace("-", "")) for o in MILJOORD + ALLMANORD)
    känt = känt or any(o in platt for o in _kommunord(kommun))
    if PERSONNAMN.match(lokal) and not känt:
        return False
    return True


def _rang(adress: str, kommun: str) -> Tuple[int, int, int]:
    platt = _plattad(adress)
    for i, ord_ in enumerate(MILJOORD):
        if platt.startswith(ord_.replace("-", "")):
            return (0, i, len(adress))
    for i, ord_ in enumerate(ALLMANORD):
        if platt.startswith(ord_):
            return (1, i, len(adress))
    if any(o in platt for o in _kommunord(kommun)):
        return (2, 0, len(adress))
    return (3, 0, len(adress))


def klassa(adress: str, kommun: str) -> str:
    rang = _rang(adress, kommun)[0]
    return {0: "miljo", 1: "allman", 2: "allman"}.get(rang, "ovrig")


def _cachenamn(url: str) -> str:
    """Cachen nycklas på URL:en och inte på ordningen sidorna hämtades i.

    Första versionen numrerade filerna per kommun. När urvalet av sidor sedan
    ändrades pekade varje nummer på en annan sida, och hela krypningen fick
    göras om mot kommunernas servrar för en ändring i vår egen sortering.
    """
    return hashlib.sha1(url.encode("utf-8")).hexdigest()[:20] + ".html"


def krypa(kod: str, kommun: str, webbplats: str, per_slag: int = 4) -> dict:
    """Läs kommunens webbplats och plocka ut funktionsadresser på egen domän.

    Två sorters sidor hämtas, och budgeten är delad mellan dem. Kontaktsidan
    bär registrator, som alltid är en giltig mottagare. Livsmedels- och
    miljösidan bär förvaltningens egen adress, som är den vi helst vill ha.
    Med en gemensam budget vann kontaktsidorna alltid, eftersom en kommun har
    fler av dem, och miljöadressen hittades nästan aldrig.

    Returnerar adresserna med den sida var och en lästes på. Utan käll-URL
    ingen adress.
    """
    if not webbplats:
        return {"adresser": [], "sidor": []}

    värd = urllib.parse.urlparse(webbplats).netloc
    domän = ".".join(värd.split(".")[-2:]) if värd else ""
    if not domän:
        return {"adresser": [], "sidor": []}

    besökta: List[str] = []
    fynd: Dict[str, str] = {}

    def skörda(html: str, url: str) -> None:
        for rå in EPOST.findall(html):
            adress = _normalisera(rå)
            if duger(adress, domän, kommun):
                fynd.setdefault(adress, url)

    start = cachad(_cachenamn(webbplats), webbplats)
    if not start:
        return {"adresser": [], "sidor": [], "fel": "startsidan svarade inte"}
    besökta.append(webbplats)
    text = start.decode("utf-8", "replace")
    skörda(text, webbplats)

    parser = Lankar()
    try:
        parser.feed(text)
    except Exception:
        pass

    kontakt: List[str] = []
    miljö: List[str] = []
    sedda: Set[str] = set()
    for href in parser.href:
        full = urllib.parse.urljoin(webbplats, href.split("#")[0])
        if urllib.parse.urlparse(full).netloc != värd or full in sedda:
            continue
        if MILJOSIDA.search(full):
            sedda.add(full)
            miljö.append(full)
        elif KONTAKTSIDA.search(full):
            sedda.add(full)
            kontakt.append(full)

    miljö.sort(key=lambda u: (0 if "livsmedel" in u.lower() else 1, len(u)))
    kontakt.sort(key=len)

    for url in miljö[:per_slag] + kontakt[:per_slag]:
        sida = cachad(_cachenamn(url), url)
        if not sida:
            continue
        besökta.append(url)
        skörda(sida.decode("utf-8", "replace"), url)

    adresser = sorted(fynd, key=lambda a: _rang(a, kommun))
    return {
        "adresser": [
            {"epost": a, "typ": klassa(a, kommun), "kalla": fynd[a]}
            for a in adresser[:8]
        ],
        "sidor": besökta,
    }


# ---------------------------------------------------------------------------
# Källa: vårt eget myndighetsregister
# ---------------------------------------------------------------------------


def register() -> Dict[str, dict]:
    """Kommunkod till kontrollmyndighet, ur `kommunregister.csv`."""
    if not REGISTER.exists():
        return {}
    ut: Dict[str, dict] = {}
    for rad in csv.DictReader(REGISTER.open(encoding="utf-8")):
        koder = [k for k in (rad.get("kommunkoder") or "").split(";") if k]
        namn = [n for n in (rad.get("kommuner") or "").split(";") if n]
        for kod in koder:
            ut[kod] = {
                "myndighet_kod": rad.get("myndighet_kod") or "",
                "myndighet": rad.get("myndighet") or "",
                "medlemskommuner": namn,
                "medlemskoder": koder,
                "anlaggningar": int(rad["anlaggningar"]) if rad.get("anlaggningar") else None,
                "status": rad.get("status") or "okand",
                "mottagare": rad.get("mottagare") or "",
                "registrator": rad.get("registrator") or "",
                "verksamhetssystem": rad.get("verksamhetssystem") or "",
                "kalla": rad.get("kalla") or "",
                "verifierat": rad.get("verifierat") or "",
                "anteckning": rad.get("anteckning") or "",
            }
    return ut


# ---------------------------------------------------------------------------
# Bygget
# ---------------------------------------------------------------------------


def bygg(krypning: bool = True) -> dict:
    idag = date.today().isoformat()

    print("Kolada: kommunlistan")
    namn = kommuner_ur_kolada()
    koder = set(namn)
    print(f"  {len(koder)} kommuner")

    print("Kolada: invånare")
    kolada.verify(kolada.POPULATION)
    folk = kolada.latest(kolada.POPULATION, date.today().year)
    print(f"  nyckeltal {folk.kpi.id}, år {folk.year}")

    print("Wikidata: webbplatser och länskontroll")
    webb, lan = wikidata(koder)
    kontrollera_lan(lan)
    print(f"  {len(webb)} webbplatser, {len(lan)} länsprefix utan konflikt")

    print("handlingar.se: andra källa till webbplatsen")
    hand = handlingar()
    print(f"  {len(hand)} kommuner")

    print("kommunregister.csv: kontrollmyndighet och förbund")
    reg = register()
    print(f"  {len(reg)} kommuner bundna till en myndighet")

    poster = []
    for kod in sorted(koder):
        kortnamn = namn[kod].replace(" kommun", "").strip()
        h = hand.get(kortnamn, {})
        plats = webb.get(kod) or h.get("webbplats") or ""
        plats_kalla = (
            "wikidata:P856"
            if webb.get(kod)
            else ("handlingar.se" if h.get("webbplats") else "")
        )
        r = reg.get(kod, {})
        medlemmar = r.get("medlemskoder") or [kod]
        förbund = FORBUNDSKONTAKT.get(r.get("myndighet_kod") or "")
        poster.append(
            {
                "kommunkod": kod,
                "kommun": kortnamn,
                "lan": LAN[kod[:2]],
                "lanskod": kod[:2],
                "invanare": int(folk.values[kod]) if kod in folk.values else None,
                "webbplats": plats,
                "epost": [],
                "kontrollmyndighet": r.get("myndighet") or "",
                "myndighet_kod": r.get("myndighet_kod") or "",
                "gemensam_myndighet": len(medlemmar) > 1,
                "medlemskommuner": r.get("medlemskommuner") or [kortnamn],
                "forbund_epost": förbund[0] if förbund else "",
                "anlaggningar_myndighet": r.get("anlaggningar"),
                "publiceringsstatus": r.get("status") or "okand",
                "verksamhetssystem": r.get("verksamhetssystem") or "",
                "verifierad_mottagare": r.get("mottagare") or "",
                "anteckning": r.get("anteckning") or "",
                "kallor": {
                    "kommunkod": "Kolada /v3/municipality",
                    "kommun": "Kolada /v3/municipality",
                    "lan": "härledd ur kommunkodens två första siffror, kontrollerad mot Wikidata P131",
                    "invanare": f"Kolada {folk.kpi.id} år {folk.year} (SCB)",
                    "webbplats": plats_kalla,
                    "kontrollmyndighet": "Livsmedelsverket, Sveriges livsmedelskontroll 2024 (L 2025 nr 13), via pipeline/data/kommunregister.csv",
                    "verifierad_mottagare": r.get("kalla") or "",
                    "verifierad_mottagare_datum": r.get("verifierat") or "",
                    "forbund_epost": förbund[1] if förbund else "",
                    "forbund_epost_datum": förbund[2] if förbund else "",
                    "epost": "",
                },
            }
        )

    if krypning:
        print(f"Kryper {len(poster)} kommunwebbplatser")
        with ThreadPoolExecutor(max_workers=12) as pool:
            resultat = list(
                pool.map(lambda p: krypa(p["kommunkod"], p["kommun"], p["webbplats"]), poster)
            )
        träff = 0
        for post, res in zip(poster, resultat):
            adresser = list(res["adresser"])

            # Två adresser som redan är verifierade för hand går före allt som
            # krypts fram: förbundets egen, och den mottagare någon läst fram
            # och skrivit in i kommunkontakter.csv. Krypningen är bra på att
            # hitta en adress, den är sämre på att veta vilken som är rätt.
            for adress, typ in (
                (post.get("forbund_epost"), "forbund"),
                (post.get("verifierad_mottagare"), "verifierad"),
            ):
                if not adress:
                    continue
                adresser = [a for a in adresser if a["epost"] != adress]
                källa = post["kallor"][
                    "forbund_epost" if typ == "forbund" else "verifierad_mottagare"
                ]
                adresser.insert(0, {"epost": adress, "typ": typ, "kalla": källa})

            post["epost"] = adresser
            if adresser:
                träff += 1
                post["kallor"]["epost"] = (
                    f"läst på kommunens eller förbundets egen webbplats, "
                    f"käll-URL och typ per adress. Krypningen kördes {idag}"
                )
        print(f"  adress funnen för {träff} av {len(poster)} kommuner")

    return {
        "byggt": idag,
        "antal": len(poster),
        "kallor": {
            "kommunlista": "Kolada https://api.kolada.se/v3/municipality",
            "invanare": f"Kolada {folk.kpi.id} {folk.year}, ursprung SCB",
            "webbplats": "Wikidata P856, reserv handlingar.se",
            "lan": "kommunkodens länsprefix, kontrollerat mot Wikidata",
            "kontrollmyndighet": "pipeline/data/kommunregister.csv",
            "epost": "kommunernas egna webbplatser, lästa vid bygget",
        },
        "kommuner": poster,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ingen-krypning", action="store_true")
    parser.add_argument("--ut", type=Path, default=UT)
    args = parser.parse_args()

    payload = bygg(krypning=not args.ingen_krypning)
    args.ut.parent.mkdir(parents=True, exist_ok=True)
    args.ut.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Skrev {args.ut} med {payload['antal']} kommuner")


if __name__ == "__main__":
    main()
