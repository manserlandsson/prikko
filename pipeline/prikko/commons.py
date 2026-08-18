"""Bilder ur Wikimedia Commons, utpekade av Wikidata och spärrade på avstånd.

Ägaren har frågat efter bilder flera gånger och fått nej. Nejet var RÄTT för
OSM:s `image`-tagg och FEL för Commons, och skillnaden är hela poängen med den
här modulen.

## Varför `image`-taggen inte bär, och varför det inte är en täckningsfråga

`image` står på 2 av de 3 927 hopparade verksamheterna. Båda är URL:er till
någon annans webbserver, och den ena är dessutom en kartbild. Men antalet är
inte skälet: OSM:s taggar ligger under ODbL, och ODbL gäller DATABASEN, alltså
strängen. Bilden i andra änden ligger på restaurangens egen server under
restaurangens egen upphovsrätt, som förvalt är ensamrätt. Att en URL står i en
fritt licensierad databas ger oss ingen rätt till det den pekar på. Spåret
faller på licensen och hade fallit på licensen även vid tusen träffar.
Se docs/37_osm_taggar.md §5.1.

## Varför Commons bär

`wikidata`-taggen står på 33 hopparade och pekar på ett Wikidata-objekt för
STÄLLET. Objektets P18 är den bild Wikidata utsett att föreställa just det
objektet, och de bilderna ligger på Commons under en fri licens. Mätt
2026-08-18 mot de 27 som passerar spärren nedan:

    CC BY-SA 3.0   11        CC BY-SA 2.0    2
    CC BY-SA 4.0    8        CC BY 2.0       1
    Public domain   4        CC BY 3.0       1

    Icke-fri licens 0

Alla 27 är JPEG. Det finns alltså inget licenshinder, bara ett licensKRAV, och
kravet avgör formen. Se `credit_line` och site/src/components/Commonsbild.astro.

## Spärren, och varför den inte får röras

En `wikidata`-tagg kan peka på kedjan i stället för på stället, och då blir
P18 fel på ett sätt som ser rätt ut hela vägen. Spärren är därför densamma som
hopparningen redan använder: Wikidata-objektets EGEN koordinat (P625) måste
ligga inom MAX_DISTANCE_M av OSM-punkten. Utfallet 2026-08-18:

    hopparade med `wikidata`          33
    varav med en P18-bild             30
    varav inom 150 meter              27
    faller på spärren                  3

De tre som faller är precis de farliga, och det är beviset för att spärren
behövs:

    City Gross                  "Apotek Hjärtat öppnar apotek … City Gross
                                 Norrköping.jpg", alltså ett apotek i en
                                 annan stad. Objektet saknar P625 helt.
    Stadsmissionens Restaurang  "Linköping med domkyrkan, c. 1900.jpg",
                                 alltså en stadsvy från 1900. Saknar P625.
    Stångs Magasin              rätt hus, 177 meter bort.

Saknad P625 fäller alltså lika hårt som ett för långt avstånd, och det är med
avsikt: två av de tre farliga fallen är just de utan koordinat. En bild vi
inte kan pröva är en bild vi inte visar.

## EXIF, och varför nedskalningen är ett VILLKOR här och inte en förbättring

`imagery.prepare` skalar ned med Pillow när Pillow finns och returnerar
ORIGINALBYTESEN oförändrade när det saknas. För gatubilderna är det ett
medvetet val, se dess docstring: en pipeline som kräver ett bildbibliotek för
att alls fungera är en pipeline som står still.

Här duger det inte. Utan nedskalning når originalfilen den publika hinken med
sin EXIF intakt, och Commons originalfiler bär fotografens kameradata och inte
sällan GPS-koordinater. Att flytta någon annans metadata till vår egen hink är
inte vårt att göra. `capture` vägrar därför att lagra när Pillow saknas, i
stället för att lagra originalet. Nedskalningen till WebP skriver om filen helt
och tar med sig hela EXIF-blocket; mätt på "Den Gyldene Freden 2013a.jpg"
2026-08-18: 315 006 byte JPEG in, 189 108 byte WebP ut, noll EXIF-taggar kvar.

Vi hämtar dessutom Commons EGEN miniatyr och inte originalet. Originalet är
upp till 6 720 × 4 480 bildpunkter och flera megabyte; miniatyren är den
MediaWiki redan genererat och den bär noll EXIF-taggar redan när den kommer.
Två spärrar mot samma sak, och den yttre kostar dessutom mindre trafik hos
någon annan.

## Ordningen mellan anropen

En fråga till Wikidata per fyrtio objekt och en fråga till Commons per bild
som klarat spärren. För hela riket blev det 1 + 27 anrop 2026-08-18. Det är
inget som behöver cachas och ingenting som behöver köras ofta.
"""

from __future__ import annotations

import html
import json
import re
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import date
from typing import Dict, Iterable, List, Optional

from .imagery import StoredImage, distance_m, prepare

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se)"

WIKIDATA_API = "https://www.wikidata.org/w/api.php"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"

#: Hur långt Wikidata-objektets egen koordinat får ligga från OSM-punkten.
#:
#: Samma tal som `docs/37` §5.3 mätte spärren på, och det ska stå kvar. Det är
#: vidare än hopparningens 100 meter (`oppettider.RADIUS_M`) av ett skäl: en
#: P625 sitter ofta på byggnadens mittpunkt eller på en kvartersnål, medan
#: OSM-punkten sitter på entrén. Ett Wikidata-objekt för en hel herrgård kan
#: ligga över hundra meter från dörren och ändå vara rätt objekt.
#:
#: Utfallet vid 150 meter är mätt och inte gissat: 27 av 30 passerar, och det
#: längsta som passerar är Villa Godthem på 114 meter. Det längsta som faller
#: är Stångs Magasin på 177. Gränsen ligger alltså i ett glapp och inte mitt i
#: en hög, vilket är det bekvämaste läget en gräns kan ha.
MAX_DISTANCE_M = 150.0

#: Bredden vi lagrar, samma som gatubilderna. Bilden visas i en sidopanel som
#: aldrig är bredare än ett par hundra punkter.
TARGET_WIDTH = 1024

#: FRIA LICENSER, SOM EN TILLÅTELSELISTA OCH ALDRIG SOM ETT FILTER.
#:
#: Nyckeln är Commons EGEN maskinkod ur `extmetadata.License`, inte
#: `LicenseShortName` som är en text för människor och finns i flera
#: stavningar. Värdet är den kod vi lagrar, i SPDX-liknande form.
#:
#: Listan är en TILLÅTELSELISTA med avsikt. Ett okänt licensvärde ska alltid
#: betyda ingen bild, aldrig "förmodligen fri". Commons bär även material
#: under CC BY-NC, fair use och rena upphovsrättsmärkningar, och en
#: förbudslista hade behövt känna till varenda en av dem för att vara sann.
#: Noll av våra 27 ligger utanför den här listan i dag, och det är precis
#: därför listan ska stå kvar: den kostar ingenting nu och fäller den dag
#: någon byter licens på en fil.
FREE_LICENCES: Dict[str, str] = {
    "cc0": "CC0-1.0",
    "pd": "PD",
    "cc-by-2.0": "CC-BY-2.0",
    "cc-by-2.5": "CC-BY-2.5",
    "cc-by-3.0": "CC-BY-3.0",
    "cc-by-4.0": "CC-BY-4.0",
    "cc-by-sa-2.0": "CC-BY-SA-2.0",
    "cc-by-sa-2.5": "CC-BY-SA-2.5",
    "cc-by-sa-3.0": "CC-BY-SA-3.0",
    "cc-by-sa-4.0": "CC-BY-SA-4.0",
}

#: Bildformat vi lagrar. Alla 249 filerna i de 19 Commons-kategorierna är
#: JPEG, och alla 27 vi faktiskt använder är JPEG. SVG och PDF förekommer på
#: Commons och är inte fotografier av ett ställe; TIFF är det ibland men
#: Pillow läser dem inte alltid. Listan står här för att en ny fil av fel
#: sort ska falla på en känd regel i stället för på ett undantag i Pillow.
ACCEPTED_MIME = {"image/jpeg", "image/png", "image/webp"}

#: Första fotografiet togs 1826. Ett fyrsiffrigt tal utanför spannet
#: 1826 till i år är inte ett årtal utan ett filnamn, ett arkivnummer eller
#: en husnummer. "00 5284 Stockholm - Café Sundbergs in Gamla stan.jpg" är
#: fallet som gjorde spärren nödvändig.
_FIRST_PHOTOGRAPH = 1826

#: Stavningar Commons använder när upphovspersonen är okänd. Listan är kort
#: med avsikt: står något annat där skriver vi ut det ordagrant, för det är
#: fotografens namn och namnet är själva kravet.
_UNKNOWN_CREATOR = {
    "okänd",
    "okänd upphovsman",
    "okänd fotograf",
    "unknown",
    "unknown author",
    "unknown photographer",
    "anonym",
    "anonymous",
}

#: Commons svarar med HTML i `Artist`, och den kan bära en DOLD dubblett.
#:
#: "Restaurang Blå porten ca 1915.jpg" svarar ordagrant
#: `Okänd<span style="display: none;">Unknown author</span>`. Stryks taggarna
#: rakt av blir texten "OkändUnknown author", alltså en attribution som är fel
#: på skärmen. Blocket måste därför tas bort MED sitt innehåll innan resten
#: avtaggas, och inte tvärtom.
_HIDDEN = re.compile(
    r"<(\w+)[^>]*style\s*=\s*[\"'][^\"']*display\s*:\s*none[^\"']*[\"'][^>]*>.*?</\1>",
    re.IGNORECASE | re.DOTALL,
)
_TAG = re.compile(r"<[^>]+>")
_WHITESPACE = re.compile(r"\s+")

#: Vi hämtar extmetadata på svenska. Det är inte kosmetik: `Artist` blir
#: "Okänd" i stället för "Unknown author" och hamnar därmed i _UNKNOWN_CREATOR
#: utan att vi behöver översätta någon annans fält. Datumfältet svarar på
#: svenska oavsett ("mellan 1912 och 1920"), och årtalen läses ur siffrorna.
EXTMETADATA_LANGUAGE = "sv"


class CommonsError(RuntimeError):
    pass


# ---------------------------------------------------------------------------
# Wikidata
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class Subject:
    """Ett Wikidata-objekt, reducerat till det spärren behöver.

    `image` är filnamnet ur P18 utan `File:`-prefix, så som Wikidata lagrar
    det. `lat` och `lng` är P625, och de är None när objektet saknar
    koordinat. Att de är None är inget fel utan ett utfall, och det utfallet
    fäller bilden: se `within_reach`.
    """

    qid: str
    image: Optional[str]
    lat: Optional[float]
    lng: Optional[float]


def _get(url: str, timeout: int = 60) -> dict:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def _first_claim(claims: dict, prop: str):
    """Första värdet för en egenskap, eller None.

    Ett objekt kan bära flera P18. Wikidata rangordnar dem med `rank`, men
    ordningen i svaret är redan den rangordnade, och att välja bland flera
    bilder är inte ett val vi kan göra bättre än den som lagt in dem.
    """
    for statement in claims.get(prop) or []:
        value = (statement.get("mainsnak") or {}).get("datavalue", {}).get("value")
        if value:
            return value
    return None


def subjects(qids: Iterable[str], batch: int = 40) -> Dict[str, Subject]:
    """Slå upp P18 och P625 för en mängd objekt.

    Femtio id:n per anrop är Wikidatas gräns för anonyma anrop; fyrtio ligger
    innanför med marginal. Hela riket ryms i ett anrop: 33 objekt.
    """
    ids = sorted({q for q in qids if q})
    found: Dict[str, Subject] = {}
    for start in range(0, len(ids), batch):
        chunk = ids[start : start + batch]
        url = (
            f"{WIKIDATA_API}?action=wbgetentities&format=json&props=claims"
            f"&ids={'|'.join(chunk)}"
        )
        entities = (_get(url).get("entities") or {}).items()
        for qid, entity in entities:
            claims = entity.get("claims") or {}
            image = _first_claim(claims, "P18")
            point = _first_claim(claims, "P625") or {}
            found[qid] = Subject(
                qid=qid,
                image=image if isinstance(image, str) else None,
                lat=point.get("latitude"),
                lng=point.get("longitude"),
            )
    return found


def within_reach(subject: Subject, lat: float, lng: float) -> Optional[float]:
    """Avståndet mellan objektets egen koordinat och OSM-punkten, eller None.

    None betyder att bilden ska utebli, och det gäller BÅDE när objektet
    saknar koordinat och när det ligger för långt bort. De två är samma
    besked: vi kan inte belägga att bilden föreställer det här stället.

    Att gissa i stället, till exempel genom att lita på P18 när P625 saknas,
    hade släppt igenom två av de tre farliga fallen ovan. En felaktig bild är
    värre än ingen bild.
    """
    if subject.lat is None or subject.lng is None:
        return None
    metres = distance_m(lat, lng, float(subject.lat), float(subject.lng))
    return metres if metres <= MAX_DISTANCE_M else None


# ---------------------------------------------------------------------------
# Commons
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class CommonsImage:
    """En fil på Commons, med det licensen kräver att vi bär med oss.

    `fetch_url` är miniatyrens adress och används i samma andetag som den
    hämtas. Samma regel som `imagery.Candidate.fetch_url`: en adress hos
    källan får aldrig lagras. Commons adresser går visserligen inte ut som
    Mapillarys signerade gör, men de ligger hos någon annan, och en bild vi
    visar ska ligga hos oss.
    """

    #: Filnamnet utan `File:`-prefix. Det här är det som LAGRAS som `source_id`
    #: och det som filsidans adress byggs av, både här och i komponenten.
    title: str
    fetch_url: str
    mime: str
    #: Vår kod, ur FREE_LICENCES. Aldrig Commons text för människor.
    licence: str
    #: Fotografens namn som ren text, eller None när Commons säger okänd.
    creator: Optional[str]
    #: Årtalet som det ska SKRIVAS, alltså "2013" eller "1912 till 1920".
    #: En sträng och inte ett tal, för Commons anger ibland ett spann och ett
    #: spann som avrundas till ett år är ett påstående vi inte kan belägga.
    year: Optional[str]
    #: Fullt ISO-datum när Commons har ett, annars None. Kolumnen
    #: `images.captured_at` är en `date` och tar inget halvt datum. Det är
    #: därför årtalet ovan finns separat och inte härleds ur det här.
    captured_at: Optional[str]
    #: Commons eget svar på om licensen kräver attribution. Läses och gissas
    #: inte. Se `credit_line` för varför vi ändå namnger fotografen när svaret
    #: är nej.
    attribution_required: bool
    #: Filens beskrivning på Commons som ren text, eller None.
    #:
    #: Visas ALDRIG. Fältet finns för att `wikidatanamn.depicts` ska kunna
    #: pröva om verksamhetens namn står i den, och det är en grind som annars
    #: hade kostat ett eget anrop per fil. `extmetadata` bär den redan.
    #: Bildtexten byggs fortfarande av `credit_line` och ingenting annat: en
    #: beskrivning på Commons är någon annans mening, ibland på fyra språk,
    #: och den hör inte hemma under en bild i en sidopanel.
    description: Optional[str] = None


def plain_text(raw: Optional[str]) -> Optional[str]:
    """Commons HTML-fält som ren text.

    Ordningen är kravet: dolda block bort FÖRST, sedan taggarna, sedan
    entiteterna, sedan blanktecknen. Se _HIDDEN för vad som går fel annars.
    """
    if not raw:
        return None
    text = _HIDDEN.sub("", raw)
    text = _TAG.sub("", text)
    text = html.unescape(text)
    text = _WHITESPACE.sub(" ", text.replace("\xa0", " ")).strip()
    return text or None


def creator_of(raw: Optional[str]) -> Optional[str]:
    """Fotografens namn, eller None när Commons säger att det är okänt."""
    text = plain_text(raw)
    if not text:
        return None
    return None if text.casefold() in _UNKNOWN_CREATOR else text


def years_in(raw: Optional[str], upper: Optional[int] = None) -> List[int]:
    """Alla årtal i en sträng, i den ordning de står.

    Commons datumfält är fritext och står i minst fem former i vårt eget
    urval: "2013-09-20 14:02:21", "2010", "2007-11", "Taken on 24 July 2014"
    och "mellan 1912 och 1920". Att tolka dem som datum kräver en parser per
    form. Att läsa ut ÅRTALEN kräver en regel, och årtalet är allt bildtexten
    behöver.
    """
    limit = upper if upper is not None else date.today().year
    return [
        int(m)
        for m in re.findall(r"(?<!\d)(\d{4})(?!\d)", raw or "")
        if _FIRST_PHOTOGRAPH <= int(m) <= limit
    ]


def year_text(date_field: Optional[str], title: str, upper: Optional[int] = None) -> Optional[str]:
    """Årtalet som det ska stå i bildtexten.

    ÅRTALET ÄR INGET LICENSKRAV. Det står där av ärlighet: tre av de 27
    bilderna föreställer rätt ställe fel årtionde. "Wirströms, Stora Nygatan
    13, sept 1959", "Restaurang Blå porten ca 1915" och "Rosendals värdshus,
    1966". En bild från 1915 utan årtal är ett påstående om hur det ser ut i
    dag, och det påståendet är falskt.

    Ett spann skrivs ut som ett spann. Commons säger "mellan 1912 och 1920"
    om Blå porten, och att avrunda det till 1912 vore en precision vi inte
    har. Ordet "till" och inte ett streck, av samma skäl som resten av
    projektet undviker det.

    Faller datumfältet bort läses filnamnet, som på Commons ofta bär årtalet
    ("Hamburger börs april 2011.jpg"). Det gäller 1 av de 27, och bara när
    filnamnet bär exakt ETT årtal: två tal i ett filnamn är ett arkivnummer
    lika ofta som ett spann.
    """
    years = years_in(date_field, upper)
    if len(years) == 1:
        return str(years[0])
    if len(years) > 1:
        return f"{min(years)} till {max(years)}"
    from_title = years_in(title, upper)
    return str(from_title[0]) if len(from_title) == 1 else None


_FULL_DATE = re.compile(r"^(\d{4}-\d{2}-\d{2})(?:[ T].*)?$")


def captured_date(date_field: Optional[str]) -> Optional[str]:
    """Fullt ISO-datum ur Commons datumfält, eller None.

    Bara den form som ÄR ett datum godtas. "1959-09" och "2007-11" är
    månadsprecision, och att fylla på dem med en dag hade skrivit ett datum
    som inte står någonstans. Kolumnen tar hellre null.
    """
    match = _FULL_DATE.match((date_field or "").strip())
    return match.group(1) if match else None


def file_page_url(title: str) -> str:
    """Filsidan på Commons. Det är den URL licensen ber om, inte bildens.

    CC BY-SA 4.0 avsnitt 3(a)(1)(A)(v) kräver "a URI or hyperlink to the
    Licensed Material to the extent reasonably practicable". Filsidan är den
    rimliga länken: den bär originalet, licensen, fotografen och filens hela
    historik. Bildfilen i sig bär ingenting av det.
    """
    return "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(
        title.replace(" ", "_"), safe="_(),!"
    )


def lookup(title: str, width: int = TARGET_WIDTH) -> Optional[CommonsImage]:
    """Metadata och hämtadress för en Commons-fil, eller None när den inte duger.

    None betyder alltid samma sak: vi visar ingen bild. Skälen är fyra, och
    alla fyra är hårda. Filen finns inte, den är av fel format, den saknar
    licensuppgift, eller licensen står inte i FREE_LICENCES.
    """
    url = (
        f"{COMMONS_API}?action=query&format=json&prop=imageinfo"
        f"&iiprop=url|mime|size|extmetadata&iiurlwidth={width}"
        f"&iiextmetadatalanguage={EXTMETADATA_LANGUAGE}"
        f"&titles={urllib.parse.quote('File:' + title)}"
    )
    pages = (_get(url).get("query") or {}).get("pages") or {}
    if not pages:
        return None
    page = next(iter(pages.values()))
    info = (page.get("imageinfo") or [None])[0]
    if not info:
        return None

    mime = (info.get("mime") or "").lower()
    if mime not in ACCEPTED_MIME:
        return None

    meta = info.get("extmetadata") or {}

    def field(name: str) -> Optional[str]:
        return (meta.get(name) or {}).get("value")

    licence = FREE_LICENCES.get((field("License") or "").strip().lower())
    if licence is None:
        return None

    # Miniatyren och inte originalet. Se modulens docstring: originalet är upp
    # till 6 720 × 4 480 och bär fotografens EXIF, miniatyren är MediaWikis
    # egen och bär noll. Saknas den är filen inte miniatyrbar och då hämtar vi
    # ingenting alls, hellre än att dra ned några megabyte råfil.
    fetch_url = info.get("thumburl")
    if not fetch_url:
        return None

    # Titeln tas ur SVARET och inte ur P18. Wikidata skriver ibland
    # understreck där Commons har mellanslag, och `source_id` ska vara den
    # form filsidans adress faktiskt byggs av.
    canonical = (page.get("title") or f"File:{title}")
    if canonical.startswith("File:"):
        canonical = canonical[len("File:") :]

    date_field = field("DateTimeOriginal")
    return CommonsImage(
        title=canonical,
        fetch_url=fetch_url,
        mime=mime,
        licence=licence,
        creator=creator_of(field("Artist")),
        year=year_text(date_field, canonical),
        captured_at=captured_date(date_field),
        attribution_required=(field("AttributionRequired") or "").strip().lower() == "true",
        description=plain_text(field("ImageDescription")),
    )


# ---------------------------------------------------------------------------
# Attributionen
# ---------------------------------------------------------------------------


def credit_line(image: CommonsImage) -> str:
    """Raden som står VID bilden. Hela meningen byggs här och inte i mallen.

    ## Vad licensen kräver som minimum

    CC BY-SA 4.0 avsnitt 3(a)(1)(A) kräver att den som delar materialet
    behåller, i den mån upphovspersonen lämnat dem: namnet på upphovspersonen,
    en upphovsrättsnotis, en notis som hänvisar till licensen, en notis som
    hänvisar till garantifriskrivningen, och en URI till materialet "to the
    extent reasonably practicable". 3(a)(1)(B) kräver dessutom att ändringar
    anges. Avsnitt 3(a)(2) tillägger att villkoren får uppfyllas "in any
    reasonable manner based on the medium, means, and context", och nämner
    uttryckligen att en länk till en resurs som innehåller uppgifterna kan
    räcka.

    ## Vad som är vår tolkning, och den är strängare

    Det sista stycket betyder att en (i)-knapp med en länk till filsidan
    formellt SKULLE kunna räcka. Vi gör ändå inte så, och skälet är att
    "reasonable manner" prövas mot mediet: på en webbsida med en enda liten
    bild i en spalt är den vedertagna formen en synlig bildtext, och det är
    också den form Commons själv rekommenderar sina återanvändare. Att gömma
    fotografens namn bakom ett klick när det får plats på raden under bilden
    är att välja den snålaste tolkningen av ett villkor som är till för någon
    annan än oss.

    DET HÄR BRYTER MOT ÄGARENS EGEN REGEL, OCH DET ÄR AVSIKTLIGT. Öppettidens
    och kontaktuppgifternas källa ligger i en (i)-knapp på hans uttryckliga
    begäran: "skriv inte ut openstreetmap, den ska ligga i I-ikonen, HA INGET
    SÅNT där." Den regeln går att följa där, för ODbL kräver att upphovet är
    rimligt synligt och inte att det står som text under uppgiften. Den går
    inte att följa här. CC BY och CC BY-SA är avtal med varje enskild
    fotograf, och 23 av de 27 bilderna bär `AttributionRequired = true`.
    Skillnaden är licensen och ingenting annat.

    ## Varför bara EN form, trots att fyra av bilderna är public domain

    Fyra av 27 är public domain och kräver ingen attribution alls. De får
    ändå samma bildtext, av två skäl som inte är juridiska:

    1. Årtalet är ett ÄRLIGHETSkrav och inte ett licenskrav, och tre av de
       fyra public domain-bilderna är just de historiska: 1915, 1959, 1966.
       Formen måste alltså finnas även där.
    2. Commons vet vem som tog dem (Lennart af Petersens, Ingemar Gram). Att
       stryka en fotograf ur bildtexten för att vi juridiskt får är sämre för
       läsaren och gör de fyra sidorna till de enda utan proveniens.

    En andra form hade alltså kostat kod och en delad läsupplevelse för att
    spara en rad på fyra sidor av 9 995.
    """
    if image.creator:
        head = f"Foto: {image.creator}"
    else:
        head = "Okänd fotograf"
    return f"{head}, {image.year}" if image.year else head


_UNSAFE = re.compile(r"[^A-Za-z0-9._-]+")


def object_key(municipality_slug: str, establishment_id: str, extension: str) -> str:
    """Var i lagringen bilden hamnar.

    Egen mapp och inte `gatubilder/`, av samma skäl som gatubilderna har en
    egen hink från besökarnas bilder: två olika sorters uppgift med två olika
    livslängder. En omkörning här kan byta bild på en verksamhet om Wikidata
    byter P18; gatubilden byts av att någon kör förbi med en kamera. Ligger de
    i samma mapp går de inte att rensa var för sig.

    Deterministisk och utan slumpdel, precis som `imagery.object_key`, så att
    en omkörning skriver över samma objekt i stället för att lägga ett till.
    """
    safe_kommun = _UNSAFE.sub("-", municipality_slug or "okand").strip("-").lower()
    safe_id = _UNSAFE.sub("-", establishment_id).strip("-")
    return f"commons/{safe_kommun}/{safe_id}.{extension}"


def _pillow_available() -> bool:
    try:
        import PIL  # noqa: F401
    except ImportError:
        return False
    return True


def download(image: CommonsImage, timeout: int = 60) -> tuple[bytes, str]:
    """Miniatyrens bytes, plus innehållstyp."""
    request = urllib.request.Request(
        image.fetch_url, headers={"User-Agent": USER_AGENT}
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        data = response.read()
        content_type = response.headers.get("Content-Type") or image.mime
    if not data:
        raise CommonsError(f"tom kropp för {image.title}")
    return data, content_type.split(";")[0].strip()


def capture(
    store,
    municipality_slug: str,
    establishment_id: str,
    subject: Subject,
    lat: float,
    lng: float,
) -> Optional[StoredImage]:
    """Hela kedjan för en verksamhet: spärra, slå upp, hämta, skala, lagra.

    Returnerar None när verksamheten inte ska ha någon bild, vilket är det
    vanliga utfallet och inte ett fel. Fel från lagringen går vidare: en bild
    som inte fanns är ett utfall, en hink som svarar 403 är det inte.
    """
    if subject.image is None:
        return None
    if within_reach(subject, lat, lng) is None:
        return None

    found = lookup(subject.image)
    if found is None:
        return None

    return store_image(store, municipality_slug, establishment_id, found)


def store_image(
    store,
    municipality_slug: str,
    establishment_id: str,
    found: CommonsImage,
) -> StoredImage:
    """Hämta, skala om och lagra en fil som redan klarat alla spärrar.

    Bruten ur `capture` och inte kopierad ur den, för det finns nu två vägar
    till en Commons-fil och bara en väg får finnas till hinken. `capture` är
    OSM-vägen: `wikidata`-taggen pekar ut objektet. `hamta_commonsbilder.py`
    med `--namnspar` är den andra: objektet hittas på namn och koordinat, och
    den vägen har fler spärrar som måste prövas MELLAN uppslaget och
    lagringen, se prikko/wikidatanamn.py. Den kan alltså inte anropa
    `capture`, men den ska lagra på precis samma sätt.
    """
    if not _pillow_available():
        # Se modulens docstring. Utan Pillow lagras originalbytesen med sin
        # EXIF, och det gör vi inte med någon annans fil.
        raise CommonsError(
            "Pillow saknas. Commons-bilder får inte lagras oskalade: "
            "originalets EXIF, inklusive GPS, hade följt med till den publika "
            "hinken. Installera Pillow eller låt bli att köra."
        )

    data, content_type = download(found)
    data, content_type, extension = prepare(data, content_type, TARGET_WIDTH)
    if content_type != "image/webp":
        # `prepare` returnerar originalbytesen oförändrade när Pillow saknas
        # ELLER när bilden inte gick att öppna, och den skiljer inte på de
        # två utåt. Kontrollen ovan fångar bara det första fallet. Den här
        # fångar båda: har filen inte skrivits om till WebP har den inte
        # skrivits om alls, och då bär den fortfarande sin EXIF.
        raise CommonsError(
            f"{found.title} kunde inte skrivas om till WebP och lagras därför "
            f"inte. Oskalade original bär EXIF som inte är vår att sprida."
        )
    key = object_key(municipality_slug, establishment_id, extension)
    url = store.put(key, data, content_type)

    return StoredImage(
        url=url,
        source="wikimedia",
        source_id=found.title,
        captured_at=found.captured_at,
        licence=found.licence,
        attribution=credit_line(found),
    )
