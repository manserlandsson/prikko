"""Wikidata-objekt som hittas på NAMN och KOORDINAT i stället för på OSM-taggen.

`commons.py` hittar Wikidata-objektet genom att OSM-punkten bär taggen
`wikidata`. Den taggen står på 33 av 3 927 hopparade, och därför blev skörden
27 bilder av 16 047 verksamheter. Objekten finns ändå: Wikidata har 8 711
objekt med både en P18-bild och en koordinat innanför våra tolv kommuners
omslutande lådor, mätt 2026-08-19. De allra flesta av dem är aldrig omnämnda i
någon OSM-punkt vi kan para ihop.

Den här modulen letar upp dem själv. Priset är att OSM:s människa försvinner ur
kedjan: ingen har intygat att objektet ÄR stället, så beviset måste byggas här.
Hela modulen är de grindar som ersätter det intyget.

## Trattens tal, mätt 2026-08-19 över alla tolv kommunerna

    verksamheter                                              16 047
    varav med en koordinat                                    13 616
    Wikidata-objekt med P18 och P625 i våra lådor              8 711

    par som `oppettider.names_agree` skulle godta                531
    varav namnen är LIKA ordmängder (grind 1)                    281
    varav objektets klass står i ALLOWED_CLASSES (grind 2)       252
    varav filen är fri och av rätt format (grind 3)               247
    varav namnet står i filnamnet eller beskrivningen (grind 4)  193

Fyra grindar och inte en, för varje grind fäller ett eget slags fel. Nedan står
vilket, med det fall som gjorde grinden nödvändig.

## Grind 1: namnen ska vara LIKA, inte överlappa

`oppettider.names_agree` godtar att den ena ordmängden är en delmängd av den
andra, åt båda håll. Det duger mot OSM, där båda namnen är namn på en
verksamhet. Det duger inte här, för Wikidata-objektet kan vara en stadsdel, ett
torg eller en gata som verksamheten bara LÅNAR sitt namn av. Delmängdsregeln
gav 531 par, och de 250 som föll bort när kravet skärptes till likhet var
genomgående av den sorten:

    Gränna Chokladfabrik        →  Gränna              "View of Gränna.jpg"
    Coop Östra Torget 07-5900   →  Östra torget        torgbilden
    Sushi Yama Mitt I City      →  Mitt i city         köpcentrets fasad
    Kronans Apotek Drottningg…  →  Drottninggatan      gatubilden
    Max Hamburgerrest. Behrn A… →  Behrn Arena         arenan utifrån

Likhet prövas efter att `oppettider._GENERIC` strukits ur BÅDA namnen, för
annars faller "Restaurang Cassi" mot "Restaurang Cassi" på ordet restaurang och
"Fåfängan Restaurang & Cafe" mot "Fåfängan" på ordet café. `_LEGAL` är redan
struket av `name_tokens`.

## Grind 2: objektet ska vara ett SLAGS TING vi godtar

Likhetskravet räcker inte, för verksamheten heter ibland precis vad platsen
heter. Dessa fem passerade grind 1 och är alla fel:

    Rinkeby Livs                →  Rinkeby (stadsdel)      flygbild 1988
    Hagis Handel                →  Hagsätra (stadsdel)     stadsdelsbilden
    Gröndal Sushi Kök           →  Gröndal (spårvagns-     en spårvagn
                                   hållplats)
    Restaurang Trekanten        →  Trekanten (hållplats)   hållplatsen
    Restaurang Lövholmen        →  Lövholmen (gata)        gatan

ALLOWED_CLASSES är en TILLÅTELSELISTA av samma skäl som `commons.FREE_LICENCES`
är det: en förbudslista hade behövt känna till varenda klass Wikidata har, och
en okänd klass ska betyda ingen bild, aldrig "förmodligen ett hus". Priset är
mätt och det är elva objekt som saknar P31 helt, bland dem Wedholms Fisk och
Restaurang Pelikan.

Att SAKNA P31 och att ha FEL P31 visade sig vara två olika saker, och de
elva fick sedan två vägar förbi grinden: `UTAN_P31_MAX_M` när objektet ligger
inpå oss, `BESKRIVNINGSORD` när dess svenska beskrivning säger vad tinget är.
Ett objekt med en P31 som inte står i listan har fortfarande ingen väg alls,
för där har någon redan sagt vad det är.

## Grind 3: licensen och formatet

Oförändrat `commons.lookup`, alltså Commons egen maskinkod och samma
tillåtelselista. Fyra av 252 föll här 2026-08-19, och det är precis vad en
tillåtelselista ska göra med en licens den inte känner igen.

## Grind 4: namnet ska stå i filnamnet eller i beskrivningen

P18 är Wikidatas eget val av bild, men Wikidata har fel ibland, och felet syns
inte i namnet på objektet. Fem fall av 247:

    Kristinagården  →  "Kristine kyrka från luften.jpg"     kyrkan intill
    Sturehof        →  "Sturegallerian.jpg"                 gallerian omkring
    Filmstaden Ser… →  "Hotorget 2008a.jpg"                 torget utanför
    Dalahöjdens Äl… →  "Grötlunken 2.JPG"                   kvarteret
    Continental Bar →  "…ritning 1912…tif"                  en ritning

Grinden kostar ingenting i anrop: beskrivningen ligger i samma `extmetadata`
som licensen redan hämtas ur.

DE GENERISKA ORDEN RÄKNAS MED HÄR, till skillnad från i grind 1, och det är
avsiktligt. Utan dem stod två fel kvar:

    Karla Cafe      →  "Karla-biografen.jpg"      biografen Karla, inte kaféet
    Tellus Pizza    →  "Biografen Tellus.jpg"     biografen Tellus, inte pizzan

Båda är ställen som lånat sitt namn av en biograf intill, och i båda fallen är
det ordet café respektive pizza som skiljer dem åt. Priset är åtta riktiga
träffar som faller med dem, bland andra "Cafe Östasiatiska museet" och
"Bonniers Konsthall cafe". Åtta saknade mot två felaktiga är rätt håll att fela
åt, och det är samma avvägning som `oppettider.names_agree` redan gjort en
gång.

## Vad som INTE prövas, och varför

`brand:wikidata` läses aldrig, lika lite som i `commons.py`. Den står på 762
OSM-punkter och pekar på KEDJANS objekt, alltså på McDonald's som företag och
inte på den här McDonald's. Se `oppettider.WIKIDATA_KEY`.

Verksamheter vars koordinat är `approximate` hoppas över. Den koordinaten är
härledd till gatunivå och kan ligga hos grannporten, och 150-metersspärren
betyder då ingenting. Det gäller 237 av 16 047, och två av de 252 som annars
passerat.
"""

from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass, field, replace
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

from .oppettider import _GENERIC, metres, name_tokens

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se)"

WDQS = "https://query.wikidata.org/sparql"

#: Samma spärr som `commons.MAX_DISTANCE_M`, och det ska vara samma tal.
#: Objektets P625 sitter på husets mittpunkt medan vår koordinat sitter på
#: adressen, och 150 meter är det glapp `docs/37` §5.3 redan mätt fram.
MAX_DISTANCE_M = 150.0

#: Hur mycket lådan vidgas innan den skickas till Wikidata. En verksamhet vid
#: kommungränsen ska kunna paras mot ett objekt strax utanför den, och 0,01
#: grader är drygt en kilometer, alltså med god marginal över spärren ovan.
BOX_MARGIN_DEG = 0.01

#: Paus mellan frågor till Wikidatas SPARQL-tjänst. Tjänsten svarar 429 på
#: anrop i tät följd, och den drivs av en stiftelse vi lever på att få fråga.
#: Tolv kommuner blir 24 frågor, så talet kostar oss under en minut.
POLITE_DELAY_S = 5.0

#: SLAG AV TING SOM FÅR VARA EN VERKSAMHET ELLER HUSET DEN LIGGER I.
#:
#: TILLÅTELSELISTA, av samma skäl som `commons.FREE_LICENCES`: en okänd klass
#: betyder ingen bild. Listan är mätt och inte gissad. Varje rad förekom bland
#: de 281 par som klarade namnkravet 2026-08-19, och de klasser som INTE står
#: här är de som fällde ett fel: stadsdel, stadsdelsområde, tätort, småort,
#: ort, brunnsort, geografiskt objekt, torg, gata, spårvagnshållplats,
#: tunnelbanestation, park, stadspark, utsiktsplats, bro och sluss.
#:
#: Gränsen går vid om bilden av tinget rimligen visar STÄLLET. Ett vattentorn
#: och en väderkvarn står med, för Svampen i Örebro och Restaurang Skanskvarn
#: ÄR tornet och kvarnen. En park står inte med, för en bild av en park är en
#: bild av gräs och inte av kaféet i den.
ALLOWED_CLASSES: Dict[str, str] = {
    # Hus och husgrupper
    "Q41176": "byggnad",
    "Q811979": "byggnadsverk",
    "Q1497375": "samling av byggnader",
    "Q1244442": "skolbyggnad",
    "Q24699794": "museibyggnad",
    "Q635719": "arkivbyggnad",
    "Q1137809": "domstolsbyggnad",
    "Q18142": "höghus",
    "Q3950": "villa",
    "Q42948": "mur",
    # Gårdar, herrgårdar och slott
    "Q879050": "herrgårdshus",
    "Q1802963": "herrgård",
    "Q489357": "mangårdsbyggnad",
    "Q3020403": "malmgård",
    "Q751876": "slott",
    "Q1507736": "torp",
    # Tekniska byggnadsverk som ÄR stället
    "Q274153": "vattentorn",
    "Q1534870": "väderkvarn",
    # Scener och salonger
    "Q1060829": "konserthus",
    "Q8719053": "konsertlokal",
    "Q24354": "teaterhus",
    "Q41253": "biograf",
    "Q1153108": "biografkomplex",
    "Q57305": "handelsmässa",
    "Q1378975": "konferensanläggning",
    # Kyrkor
    "Q16970": "kyrka",
    "Q317557": "församlingskyrka",
    "Q615980": "församling",
    # Ställen man äter och sover på
    "Q27686": "hotell",
    "Q11707": "restaurang",
    "Q256020": "krog",
    "Q30022": "kafé",
    "Q47505416": "konditori",
    "Q212198": "pub",
    "Q622425": "nattklubb",
    "Q1684522": "jazzklubb",
    "Q13107184": "apotek",
    # Museer
    "Q33506": "museum",
    "Q207694": "konstmuseum",
    "Q10571947": "länsmuseum",
    "Q756102": "friluftsmuseum",
    "Q10416961": "arbetslivsmuseum",
    # Skolor
    "Q3914": "skola",
    "Q9842": "grundskola",
    "Q10509148": "grundskola i Sverige",
    "Q10511371": "gymnasieskola",
    "Q10511378": "gymnasium",
    "Q10572388": "läroverk",
    "Q667471": "realskola",
    "Q136148413": "fackskola",
    "Q88965416": "skolenhet",
    "Q170087": "folkhögskola",
    "Q1076052": "förskola",
    "Q14551995": "waldorfskola",
    "Q3591588": "fransk utlandsskola",
    "Q106915632": "fransk avtalsskola",
    "Q597897": "studentnation",
    # Vård och omsorg
    "Q16917": "sjukhus",
    "Q22908": "äldreboende",
    # Anläggningar
    "Q1076486": "sportanläggning",
    "Q483110": "stadion",
    "Q626687": "boulebana",
    "Q43501": "djurpark",
    "Q194195": "nöjespark",
    # Institutioner och organisationer med en egen adress
    "Q31855": "forskningsinstitut",
    "Q414147": "vetenskapsakademi",
    "Q1310653": "lärt samfund",
    "Q1966910": "nationell akademi",
    "Q163740": "ideell organisation",
    "Q2319498": "landmärke",
}


#: Hur nära ett objekt UTAN P31 måste ligga för att ändå duga.
#:
#: ══ VARFÖR UNDANTAGET FINNS ═══════════════════════════════════════════════
#:
#: Klassgrinden avvisade allt utan P31, och det kostade riktiga träffar.
#: Ägaren pekade 2026-08-22 på Rolfs kök: Wikidata-objektet Q10656465 heter
#: "Rolfs kök", bär bilden "Rolfs kök.JPG" och en koordinat 0,8 meter från vår
#: rad, men har `P31: []`. Ingen har skrivit vad för slags sak det är, och
#: grinden läste det som "fel sorts sak".
#:
#: Att sakna P31 och att ha fel P31 är två olika saker. Det andra är ett
#: besked, det första är en lucka i Wikidata.
#:
#: ══ VARFÖR JUST 40 METER ══════════════════════════════════════════════════
#:
#: Uppmätt 2026-08-22 över 11 577 rader i Stockholm, Linköping, Jönköping och
#: Karlstad. Av 7 459 objekt i lådorna saknar 238 P31. Namnlika par utan P31
#: inom 150 meter: tolv, samtliga i Stockholm.
#:
#: FYRA AV DE TOLV HAR REDAN EN BILD VIA OSM-VÄGEN, och regeln pekar på exakt
#: samma fil i alla fyra: Sundbergs Konditori 0,6 m, Restaurang Kvarnen 0,9,
#: Restaurang Pelikan 1,1, Wedholms Fisk 4,2. Två oberoende människor, en i
#: OSM och en i Wikidata, har alltså pekat på samma bild. Det är den starkaste
#: valideringen mätningen ger.
#:
#: Talet ligger i ett GLAPP och inte mitt i en hög, precis som
#: `commons.MAX_DISTANCE_M`: träffarna slutar vid 27,1 meter och nästa ligger
#: på 75,4. Allt mellan 28 och 75 ger identiskt utfall.
#:
#: De fyra OSM-validerade sitter på 0,6 till 4,2 meter, och det säger vad ett
#: riktigt "objektet ÄR verksamheten" ser ut som. Ligger objektet längre bort
#: är det oftast HUSET eller GÅRDEN, och då är namnlikheten ett svagare belägg.
#:
#: ══ VARFÖR INTE VIDARE ════════════════════════════════════════════════════
#:
#: Avståndet skyddar inte mot stadsdelsfelet. Mätt vid en kilometer dyker de
#: upp: "Gamla Östberga Bageri AB" paras med stadsdelen Gamla Östberga på 321
#: meter, "Långpannan Pizzeria" med platsen Långpannan på 520. Att bageriet
#: hamnade på 321 är en slump; hade det legat mitt i stadsdelen hade
#: centroiden legat femtio meter bort och sluppit igenom vilken spärr som
#: helst under 150.
#:
#: Vinsten vid 40 meter är fem rader av 11 577, och de tre kommunerna utanför
#: Stockholm gav noll. Det är litet, och det är ärligt: Wikidata har bara
#: stockholmskrogar som objekt utan P31.
#:
#: Det avståndet gäller de objekt som inte säger något om sig själva alls. Ett
#: objekt vars svenska beskrivning säger vad tinget är prövas mot den vanliga
#: spärren i stället. Se `BESKRIVNINGSORD`.
UTAN_P31_MAX_M = 40.0


#: ORD I DEN SVENSKA BESKRIVNINGEN SOM SÄGER VAD FÖR SLAGS TING DET ÄR.
#:
#: ══ VARFÖR GRINDEN FINNS ══════════════════════════════════════════════════
#:
#: `UTAN_P31_MAX_M` låter avståndet ensamt gå i god för ett objekt Wikidata
#: inte sagt vad det är, och fyrtio meter är kort just därför att avståndet är
#: ett svagt belägg. Beskrivningen är ett STARKARE belägg: står det
#: "restaurang i Stockholm" i klartext så vet vi vad tinget är, om än inte av
#: en P31.
#:
#: Det här är ett SUBSTITUT för klassen och inte ett ombud för den. Orden är
#: `ALLOWED_CLASSES` egna svenska etiketter lästa som ord i stället för som
#: Q-nummer, med bindeorden strukna: "i", "av", "Sverige", "fransk", "ideell",
#: "nationell" och "lärt" står inte här, för "stadsdel i Stockholm" hade
#: passerat på ordet i. Böjningarna är mätta och inte gissade: Restaurang
#: Pelikans objekt står som "restauranger i Stockholm" i pluralis och
#: Sundbergs som "traditionsrikt café", inte "kafé".
#:
#: ══ VAD GRINDEN GÖR, MÄTT 2026-08-22 ══════════════════════════════════════
#:
#: Över alla tolv kommunerna finns 15 namnlika par utan P31 inom en kilometer.
#: Bara sex av dem bär en svensk beskrivning alls, och alla sex passerar
#: grinden. De nio utan beskrivning fälls.
#:
#: Bortom fyrtio meter passerar EXAKT ETT par, och det blir en riktig bild:
#:
#:     Hägerstensåsens Skola  →  Q31866510  75,4 m
#:                               "skola i Hägerstensåsen, Stockholm"
#:                               "Hägerstensåsens skola, 2016b.jpg"
#:
#: Nästa par som passerar grinden ligger bortom en kilometer, alltså är det
#: inte grinden som sätter gränsen utan modulens vanliga `MAX_DISTANCE_M`.
#: Allt mellan 76 och 1 000 meter ger identiskt utfall, och 150 valdes för att
#: det är den spärr som redan gäller allt annat här.
#:
#: Hela namnspåret mätt över tolv kommuner före och efter, samma dag: 264 par
#: blev 265, och nya bilder gick från 5 till 6. Elva av de tolv kommunerna är
#: oförändrade.
#:
#: DE TVÅ KÄNDA FÄLLORNA FALLER, båda på att de saknar en svensk beskrivning:
#:
#:     Gamla Östberga Bageri AB  →  Q5520237   321 m  sv saknas
#:                                  (en: "area of Stockholm, Sweden")
#:     Långpannan Pizzeria       →  Q10572633  520 m  ingen beskrivning alls
#:
#: ══ VARFÖR FYRTIOMETERSREGELN STÅR KVAR BREDVID ═══════════════════════════
#:
#: Grinden får ALDRIG ersätta `UTAN_P31_MAX_M`, bara stå bredvid den. Rolfs
#: kök, fallet som gjorde undantaget, har ingen beskrivning heller: Q10656465
#: bär varken P31 eller `schema:description`. Fyra av de tio paren inom fyrtio
#: meter är av den sorten, bland dem Restaurang Kvarnen och Skärholmens gård.
#: En beskrivningsgrind i stället för avståndsregeln hade alltså kostat tre av
#: dagens fem nya bilder.
BESKRIVNINGSORD = {
    # Hus och gårdar
    "byggnad", "byggnaden", "byggnader", "byggnadsverk", "hus", "huset",
    "skolbyggnad", "museibyggnad", "arkivbyggnad", "domstolsbyggnad",
    "höghus", "villa", "mur", "herrgård", "herrgårdshus", "malmgård",
    "mangårdsbyggnad", "slott", "torp", "vattentorn", "väderkvarn",
    # Ställen man äter, dricker och sover på
    "restaurang", "restaurangen", "restauranger", "krog", "krogen",
    "kafé", "kaféet", "café", "caféet", "cafe", "kafe", "konditori",
    "bageri", "bageriet", "bar", "baren", "pub", "puben", "ölhall",
    "nattklubb", "jazzklubb", "pizzeria", "matsal",
    "hotell", "hotellet", "värdshus", "värdshuset", "gästgiveri",
    "gästgivargård", "pensionat",
    # Scener, salonger och mässor
    "konserthus", "konsertlokal", "teaterhus", "teater", "teatern",
    "biograf", "biografen", "biografkomplex", "handelsmässa",
    "konferensanläggning",
    # Kyrkor
    "kyrka", "kyrkan", "kyrkobyggnad", "församlingskyrka", "församling",
    # Skolor
    "skola", "skolan", "grundskola", "gymnasieskola", "gymnasium",
    "läroverk", "realskola", "fackskola", "skolenhet", "folkhögskola",
    "förskola", "waldorfskola", "utlandsskola", "avtalsskola",
    "studentnation",
    # Museer
    "museum", "museet", "konstmuseum", "länsmuseum", "friluftsmuseum",
    "arbetslivsmuseum",
    # Vård och omsorg
    "sjukhus", "äldreboende", "apotek",
    # Anläggningar
    "sportanläggning", "stadion", "boulebana", "djurpark", "nöjespark",
    # Institutioner
    "forskningsinstitut", "vetenskapsakademi", "akademi", "samfund",
    "organisation", "landmärke",
}

_ICKE_ORD = re.compile(r"[^\wåäöéèüáà]+", re.UNICODE)


def _orden(text: str) -> set:
    """Orden i en text, gemener, utan skiljetecken.

    `name_tokens` duger inte här. Den stryker bolagsformerna, och i en
    beskrivning är "restaurang" inte en bolagsform utan hela beskedet.
    """
    return {o for o in _ICKE_ORD.split((text or "").lower()) if o}


class WikidataError(RuntimeError):
    pass


class AvhuggetSvar(WikidataError):
    """WDQS började skicka och slutade mitt i.

    Uppmätt 2026-08-22: Stockholms låda gav 917 504 bytes, alltså jämnt 896
    KiB, och sista strängen var oavslutad. Uppsala gav 940 965 bytes helt, så
    det är ingen storleksgräns. Tjänsten strömmar resultatet och slår i sin
    egen tidsgräns mitt i utskicket, varpå förbindelsen stängs på en jämn
    buffertkant. Stockholm är den täta lådan och därmed den långsamma frågan.

    Att vänta och försöka igen hjälper inte, för frågan tar lika lång tid
    nästa gång: fem försök i rad föll på exakt samma teckenposition. Det som
    hjälper är att fråga om mindre yta, se `objects_in_box`.
    """


@dataclass(frozen=True)
class Objekt:
    """Ett Wikidata-objekt så som lådfrågan lämnar det.

    `punkter` är alla P625 objektet bär. De är fler än ett ibland, och då är
    det närmaste som får avgöra: ett objekt med två koordinater är oftast ett
    hus som fått både en ingång och en mittpunkt.
    """

    qid: str
    namn: str
    bild: str
    punkter: Tuple[Tuple[float, float], ...]
    klasser: Tuple[str, ...]
    alias: Tuple[str, ...] = field(default=())
    beskrivning: str = ""

    def tillaten_klass(self) -> bool:
        """Står något av objektets slag i tillåtelselistan?

        Objekt utan P31 svarar nej HÄR, men kan ändå passera. Se
        `UTAN_P31_MAX_M` och `pair`.
        """
        return any(k in ALLOWED_CLASSES for k in self.klasser)

    def saknar_klass(self) -> bool:
        """Har objektet ingen P31 alls?

        Skilj det från "har en P31 som inte står i listan". Det första är att
        Wikidata inte VET vad tinget är, det andra är att någon sagt att det är
        en sak vi inte vill ha. Bara det första får en andra chans.
        """
        return not self.klasser

    def beskrivningen_sager_vad_det_ar(self) -> bool:
        """Står det i den svenska beskrivningen vad för slags ting det är?

        Ett SUBSTITUT för P31 och inte ett ombud för det. Se
        `BESKRIVNINGSORD` och `UTAN_P31_MAX_M`.
        """
        return bool(_orden(self.beskrivning) & BESKRIVNINGSORD)

    def namnformer(self) -> List[Tuple[str, ...]]:
        """Namnet och alla alias som ordmängder."""
        return [name_tokens(self.namn)] + [name_tokens(a) for a in self.alias]


# ---------------------------------------------------------------------------
# Lådan och frågan
# ---------------------------------------------------------------------------


def bounding_box(
    points: Iterable[Tuple[float, float]], margin: float = BOX_MARGIN_DEG
) -> Optional[Tuple[float, float, float, float]]:
    """Minsta lådan runt en mängd punkter, som (syd, väst, nord, öst).

    None när ingen punkt har en koordinat. Det är utfallet för Borgholm,
    Höganäs, Lomma och Svenljunga, som saknar koordinat helt: 2 431 av
    16 047 verksamheter kan inte prövas mot ett avstånd alls.
    """
    lats = []
    lngs = []
    for lat, lng in points:
        if lat is None or lng is None:
            continue
        lats.append(float(lat))
        lngs.append(float(lng))
    if not lats:
        return None
    return (
        min(lats) - margin,
        min(lngs) - margin,
        max(lats) + margin,
        max(lngs) + margin,
    )


_OBJEKT_QUERY = """SELECT ?item ?itemLabel ?lat ?lon ?img ?klass ?beskrivning WHERE {
  SERVICE wikibase:box {
    ?item wdt:P625 ?coord .
    bd:serviceParam wikibase:cornerWest "Point(%(vast)s %(syd)s)"^^geo:wktLiteral .
    bd:serviceParam wikibase:cornerEast "Point(%(ost)s %(nord)s)"^^geo:wktLiteral .
  }
  ?item wdt:P18 ?img .
  ?item p:P625/psv:P625 ?node .
  ?node wikibase:geoLatitude ?lat ; wikibase:geoLongitude ?lon .
  OPTIONAL { ?item wdt:P31 ?klass . }
  OPTIONAL { ?item schema:description ?beskrivning . FILTER(LANG(?beskrivning) = "sv") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "sv,en". }
}"""

_ALIAS_QUERY = """SELECT ?item ?alias WHERE {
  SERVICE wikibase:box {
    ?item wdt:P625 ?coord .
    bd:serviceParam wikibase:cornerWest "Point(%(vast)s %(syd)s)"^^geo:wktLiteral .
    bd:serviceParam wikibase:cornerEast "Point(%(ost)s %(nord)s)"^^geo:wktLiteral .
  }
  ?item wdt:P18 ?img .
  ?item skos:altLabel ?alias . FILTER(LANG(?alias) IN ("sv","en"))
}"""


MAX_DELNINGAR = 3
"""Hur många gånger en låda får halveras innan vi ger upp.

Tre delningar är 64 rutor av ursprungslådan. Stockholm klarar sig på en, och
en låda som inte går igenom på 64 delar har något annat fel än storlek.
"""


def _ask(sparql: str, timeout: int = 300, tries: int = 5) -> List[dict]:
    """En fråga till WDQS, med väntan när tjänsten säger ifrån.

    Tjänsten svarar 429 och emellanåt 502 på anrop i tät följd. Att ge upp vid
    första felet hade betytt en kommun utan bilder utan att någon märkte det,
    alltså väntar vi i stället, allt längre.
    """
    url = WDQS + "?" + urllib.parse.urlencode({"query": sparql})
    headers = {"User-Agent": USER_AGENT, "Accept": "application/sparql-results+json"}
    for attempt in range(tries):
        try:
            request = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return json.loads(response.read().decode("utf-8"))["results"]["bindings"]
        except json.JSONDecodeError as exc:
            raise AvhuggetSvar(
                f"WDQS klippte strömmen efter {exc.pos} tecken"
            ) from exc
        except Exception as exc:  # noqa: BLE001
            if attempt == tries - 1:
                raise WikidataError(f"WDQS svarade inte: {exc}") from exc
            time.sleep(POLITE_DELAY_S * (attempt + 2))
    return []


def _qid(value: str) -> str:
    return value.rsplit("/", 1)[-1]


def _filnamn(url: str) -> str:
    """Commons-filnamnet ur den URL WDQS lämnar P18 som.

    WDQS svarar med `http://commons.wikimedia.org/wiki/Special:FilePath/Den%20Gyldene%20Freden%202013a.jpg`.
    Det som ska lagras och slås upp är filens namn med mellanslag, alltså det
    `commons.lookup` tar emot.
    """
    return urllib.parse.unquote(url.rsplit("/", 1)[-1]).replace("_", " ")


def objects_in_box(
    box: Tuple[float, float, float, float], djup: int = 0
) -> List[Objekt]:
    """Alla Wikidata-objekt med P18 och koordinat i lådan.

    Två frågor och inte en. Aliasen ligger i en egen fråga eftersom en
    sammanslagning multiplicerar raderna: ett objekt med fyra alias och två
    koordinater hade gett åtta rader av samma sak, och Stockholms låda ger
    redan 7 943 rader utan dem.

    Klipper WDQS strömmen delas lådan i fyra och varje kvadrant frågas för
    sig, se `AvhuggetSvar`. `djup` räknar delningarna så att en låda som ändå
    inte går igenom får falla i stället för att dela sig i evighet.
    """
    syd, vast, nord, ost = box
    params = {"syd": syd, "vast": vast, "nord": nord, "ost": ost}

    try:
        rader = _ask(_OBJEKT_QUERY % params)
    except AvhuggetSvar:
        if djup >= MAX_DELNINGAR:
            raise
        # Fyra kvadranter, var och en med en fjärdedel av ytan och därmed en
        # bråkdel av arbetet. Delningen är på MITTEN och inte på täthet, för
        # tätheten är just det vi inte vet innan vi frågat.
        #
        # Kvadranterna ÖVERLAPPAR inte, men objekt med flera koordinater kan
        # ändå dyka upp i två av dem. Sammanslagningen nedan är därför på qid
        # och unionerar punkter, klasser och alias, precis som slingan gör
        # inom en enda fråga.
        mitt_ns = (syd + nord) / 2
        mitt_ov = (vast + ost) / 2
        delar = (
            (syd, vast, mitt_ns, mitt_ov),
            (syd, mitt_ov, mitt_ns, ost),
            (mitt_ns, vast, nord, mitt_ov),
            (mitt_ns, mitt_ov, nord, ost),
        )
        hopslaget: Dict[str, Objekt] = {}
        for del_ in delar:
            time.sleep(POLITE_DELAY_S)
            for objekt in objects_in_box(del_, djup=djup + 1):
                tidigare = hopslaget.get(objekt.qid)
                if tidigare is None:
                    hopslaget[objekt.qid] = objekt
                    continue
                hopslaget[objekt.qid] = replace(
                    tidigare,
                    punkter=tuple(sorted(set(tidigare.punkter) | set(objekt.punkter))),
                    klasser=tuple(sorted(set(tidigare.klasser) | set(objekt.klasser))),
                    alias=tuple(sorted(set(tidigare.alias) | set(objekt.alias))),
                    beskrivning=tidigare.beskrivning or objekt.beskrivning,
                )
        return list(hopslaget.values())

    samlade: Dict[str, dict] = {}
    for row in rader:
        qid = _qid(row["item"]["value"])
        post = samlade.setdefault(
            qid,
            {
                "namn": row["itemLabel"]["value"],
                "bild": _filnamn(row["img"]["value"]),
                "punkter": set(),
                "klasser": set(),
                "alias": set(),
                "beskrivning": "",
            },
        )
        post["punkter"].add((float(row["lat"]["value"]), float(row["lon"]["value"])))
        if "klass" in row:
            post["klasser"].add(_qid(row["klass"]["value"]))
        if "beskrivning" in row:
            # Ett objekt har högst en svensk beskrivning, så raderna
            # multipliceras inte av att den ligger i samma fråga som klassen.
            post["beskrivning"] = row["beskrivning"]["value"]

    time.sleep(POLITE_DELAY_S)
    for row in _ask(_ALIAS_QUERY % params):
        qid = _qid(row["item"]["value"])
        if qid in samlade:
            samlade[qid]["alias"].add(row["alias"]["value"])

    return [
        Objekt(
            qid=qid,
            namn=post["namn"],
            bild=post["bild"],
            punkter=tuple(sorted(post["punkter"])),
            klasser=tuple(sorted(post["klasser"])),
            alias=tuple(sorted(post["alias"])),
            beskrivning=post["beskrivning"],
        )
        for qid, post in samlade.items()
    ]


# ---------------------------------------------------------------------------
# Grindarna
# ---------------------------------------------------------------------------


def distinct(tokens: Sequence[str]) -> List[str]:
    """Orden som pekar ut STÄLLET, alltså allt utom de generiska.

    `name_tokens` har redan strukit bolagsformerna. Kvar att stryka är orden
    som beskriver verksamhetsformen: pizzeria, café, bar, kiosk och de andra i
    `oppettider._GENERIC`. "Restaurang Cassi" och "Cassi" ska vara samma
    ordmängd, annars faller varannan riktig träff på ett ord som inte namnger
    någonting.
    """
    return [t for t in tokens if t not in _GENERIC]


def names_agree(ours: Sequence[str], theirs: Sequence[str]) -> bool:
    """Grind 1. Är det samma namn, och inte bara ett namn som rymmer det andra?

    LIKHET och inte delmängd. Se modulens docstring för de fem fall som gjorde
    kravet nödvändigt; alla fem är verksamheter som lånat en plats namn.
    """
    vara = set(distinct(ours))
    deras = set(distinct(theirs))
    return bool(vara) and vara == deras


def within_reach(objekt: Objekt, lat: float, lng: float) -> Optional[float]:
    """Avståndet till närmaste av objektets koordinater, eller None.

    Samma besked som `commons.within_reach`: None betyder att bilden ska
    utebli. Här kan objektet inte SAKNA koordinat, för lådfrågan hittade det
    på just sin koordinat, men det kan ligga för långt bort.
    """
    if not objekt.punkter:
        return None
    narmast = min(metres(lat, lng, p[0], p[1]) for p in objekt.punkter)
    return narmast if narmast <= MAX_DISTANCE_M else None


_BOKSTAVSDEL = re.compile(r"^([a-z]+)\d")


def _ord_i(text: str) -> set:
    """Orden i en text, plus bokstavsdelen av de ord som slutar i ett löpnummer.

    Commons klistrar löpnumret direkt på namnet oftare än man tror:
    "Vikenkyrkan3.JPG", "Eriksdalsskolan2010c.jpg", "Molkomsfolkhögskola1.JPG".
    `fold` delar bara på skiljetecken, så "vikenkyrkan3" blir ETT ord och
    "vikenkyrkan" står inte i mängden. Nio riktiga träffar föll på just det
    2026-08-19, och alla nio var av samma sort.

    Bara bokstavsdelen läggs till, aldrig siffrorna. "Pizzeria 2" och
    "Pizzeria 4" är olika ställen på samma gata, och det är samma skäl som
    `oppettider.name_tokens` behåller siffror av.
    """
    ord_ = set(name_tokens(text))
    for token in list(ord_):
        match = _BOKSTAVSDEL.match(token)
        if match:
            ord_.add(match.group(1))
    return ord_


def depicts(namn: str, title: str, description: Optional[str]) -> bool:
    """Grind 4. Står verksamhetens namn i filnamnet eller i beskrivningen?

    HELA namnet, de generiska orden inbegripna. Det är skillnaden mot grind 1
    och den skillnaden fäller "Karla Cafe" mot filen "Karla-biografen.jpg":
    ordet café står inte där, och det är just det ordet som skiljer kaféet från
    biografen det ligger intill.

    Filändelsen stryks först. Annars hade "jpg" räknats som ett ord i
    filnamnet, vilket är ofarligt, och "Restaurang Png" hade blivit en träff
    på vad som helst, vilket inte är det.
    """
    vara = set(name_tokens(namn))
    if not vara:
        return False
    stam = title[5:] if title.startswith("File:") else title
    if "." in stam:
        stam = stam.rsplit(".", 1)[0]
    if vara <= _ord_i(stam):
        return True
    return bool(description) and vara <= _ord_i(description)


# ---------------------------------------------------------------------------
# Hopparningen
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class Traff:
    """En verksamhet och det Wikidata-objekt vi vågar säga är den."""

    objekt: Objekt
    metres: float


class Index:
    """Objekten i ett rutnät, så att varje verksamhet bara jämförs med grannar.

    Samma form som `oppettider.PoiIndex` och av samma skäl: Stockholms låda
    ger 5 715 objekt, och 8 520 verksamheter gånger 5 715 objekt är 48
    miljoner jämförelser att göra om för varje kommun.
    """

    #: Rutans sida i grader latitud. 0,003 grader är omkring 330 meter, alltså
    #: drygt spärren, så att en granne aldrig kan ligga mer än en ruta bort.
    CELL = 0.003

    def __init__(self, objekt: Iterable[Objekt]) -> None:
        self._rutor: Dict[Tuple[int, int], List[Tuple[float, float, Objekt]]] = {}
        for o in objekt:
            for lat, lng in o.punkter:
                self._rutor.setdefault(self._cell(lat, lng), []).append((lat, lng, o))

    def _cell(self, lat: float, lng: float) -> Tuple[int, int]:
        return (int(lat / self.CELL), int(lng / (self.CELL * 2)))

    def near(self, lat: float, lng: float) -> List[Objekt]:
        ci, cj = self._cell(lat, lng)
        sedda: Dict[str, Objekt] = {}
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                for _, _, o in self._rutor.get((ci + di, cj + dj), ()):
                    sedda[o.qid] = o
        return list(sedda.values())


def pair(index: Index, namn: Optional[str], lat: float, lng: float) -> Optional[Traff]:
    """Grind 1 och 2 tillsammans: vilket objekt är det här stället, om något?

    Närmast vinner när flera passerar. Att välja på namnlikhet i stället hade
    inte gett mer att gå på: båda namnen är då redan lika ordmängder.
    """
    ours = name_tokens(namn or "")
    if not ours:
        return None
    basta: Optional[Traff] = None
    for objekt in index.near(lat, lng):
        klasslos = objekt.saknar_klass()
        if not objekt.tillaten_klass() and not klasslos:
            continue
        if not any(form and names_agree(ours, form) for form in objekt.namnformer()):
            continue
        avstand = within_reach(objekt, lat, lng)
        if avstand is None:
            continue
        if (
            klasslos
            and avstand > UTAN_P31_MAX_M
            and not objekt.beskrivningen_sager_vad_det_ar()
        ):
            # Utan P31 duger fyrtio meter, med en beskrivning som säger vad
            # tinget är duger `MAX_DISTANCE_M` som för alla andra. Se
            # `BESKRIVNINGSORD`: vinsten är Hägerstensåsens skola på 75 meter,
            # och de två stadsdelsfällorna faller ändå.
            continue
        if basta is None or avstand < basta.metres:
            basta = Traff(objekt=objekt, metres=avstand)
    return basta
