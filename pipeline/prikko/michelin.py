"""Michelinstjärnor ur Wikidata, med slutåret som grind.

Utmärkelsen är Q20824563, "Michelin star", och den sitter som `P166` på
restaurangens eget objekt. Kvalificerarna på påståendet bär hela historiken:
`P580` startår, `P582` slutår, `P1114` antal stjärnor.

## Trattens tal, mätt 2026-08-25 över hela riket

    påståenden om en Michelinstjärna i Sverige                    53
    objekt de sitter på                                           42
    varav med minst ETT gällande påstående, alltså utan P582       30
    varav enbart indragna                                         12

    objekt med en koordinat                                       42 av 42

Hela riket är 42 objekt. Det är litet nog att frågas i ETT anrop utan låda och
utan delning, till skillnad från `wikidatanamn.objects_in_box`, som frågar per
kommun därför att den letar bland 8 711 objekt.

## SLUTÅRET ÄR EN GRIND, OCH DEN GÅR PER PÅSTÅENDE

Ett påstående med `P582` är en INDRAGEN stjärna. Bon Lloc hade sin 1997 till
2005, Coq Blanc 1984 till 1987, Esperanto 2007 till 2018. Att visa någon av dem
som nuvarande är ett falskt påstående om en namngiven verksamhet, och ett
sådant går inte att ta tillbaka när sidan är indexerad.

Grinden får inte gå per OBJEKT, och det är mätt: sex av de 42 bär BÅDE ett
indraget och ett gällande påstående, för Michelin drar in och delar ut igen.

    Operakällaren   1998 till 2009 (1)   och   2014 och framåt (1)
    Aloë            2018 till 2019 (1)   och   2020 och framåt (2)
    Gastrologik     2013 till 2018 (1)   och   2019 och framåt (2)
    Oaxen krog      2014 till 2015 (1)   och   2015 och framåt (2)
    Vollmers        2015 till 2016 (1)   och   2017 och framåt (2)
    Daniel Berlin   2016 till 2017 (1)   och   2018 och framåt (2)

Läses objektet som "har ett påstående med slutår, alltså indragen" försvinner
Operakällaren, som är en av våra nio. Läses det som "har ett påstående, alltså
stjärna" blir Esperanto stjärnkrog i dag. Båda felen är samma fel: att läsa
objektet i stället för påståendet.

ANTALET LÄSES UR DET GÄLLANDE PÅSTÅENDET och aldrig ur det senaste av alla.
Aloë hade en stjärna till 2019 och har två sedan 2020; ett antal hämtat ur
objektet i stort hade blivit en gissning mellan de två.

## Grindarna mot vårt register

Samma hållning som `wikidatanamn.py`, men EN grind är medvetet lösare och en är
ny. Ordningen nedan är kodens.

    1  namnen ska stämma som DELMÄNGD          `namnet_stammer` här
    1b etiketten ska vara ett NAMN             `beskrivande_etikett` här
    2  objektet ska vara ett MATSTÄLLE         `MATSTALLE_KLASSER` här
    4  koordinat: närhet, annars strängt namn  wikidatanamn.MAX_DISTANCE_M
    3  minst ett gällande påstående            `Stjarnobjekt.gallande`

### Grind 1 kräver delmängd och inte likhet, till skillnad från bildspåret

`wikidatanamn.names_agree` kräver LIKHET, för där kan objektet vara en
stadsdel eller ett torg som verksamheten lånar sitt namn av. Här kan det inte
det: objektet har en Michelinstjärna och grind 2 kräver att det är ett
matställe.

Identitetskravet kostade tre riktiga träffar av tolv, mätt 2026-08-25, och alla
tre för att kommunens register skriver ut ett led som Wikidata inte har:

    Restaurant Frantzén    Klara Norra Kyrkogata 26   mot  Frantzén      6 m
    Aira Biskopsudden      Biskopsvägen 9             mot  Aira          5 m
    Krog Agrikultur, K/A   Järngravskajen 15          mot  Agrikultur

Se `namnet_stammer` för varför ett ENSAMT gemensamt ord måste vara långt nog,
och varför `oppettider.names_agree` huvudordsregel inte duger här.

### Grind 1b finns för att en etikett kan vara en beskrivning

Q69871194 heter "restaurang i Stockholm" på Wikidata. Ingen har gett objektet
ett namn, och fältet har fyllts med vad det är i stället. `name_tokens` stryker
"restaurang" och "i" som `_LEGAL`, så ordmängden blir `('stockholm',)`.

Med delmängdsregeln blev objektet kandidat till 150 av våra rader i en enda
körning, från "Willys Stockholm Bromma" till "Chabad Stockholm". Grinden prövas
därför EN GÅNG PER OBJEKT i `Namnregister.__init__` och inte per verksamhet.

Kravet är att det som återstår efter `distinct` ska innehålla minst ett ord som
INTE är en av våra tolv orter.

### Grind 2 är en SNÄVARE lista än ALLOWED_CLASSES, inte samma

`wikidatanamn.ALLOWED_CLASSES` svarar på frågan "kan en bild av det här tinget
föreställa stället?", och släpper därför in skolor, kyrkor och vattentorn. Här
är frågan en annan: objektet ska vara det STÄLLE MAN ÄTER PÅ som fick stjärnan.

Listan är mätt över de 42 och inte gissad. `Q11707` restaurang står på 41 av
dem, `Q41176` byggnad och `Q75762` "Zamenhof-Esperanto-objekt" som andraklasser
på Edsbacka krog respektive Esperanto, och `Q10861387` "sushi-ya" som ENDA
klass på Sushi Sho. Den sista är skälet till att listan inte kan lånas rakt av: Sushi Sho är
en av våra nio och hade fallit på en lista utan den.

### Grind 4 skiljer sig från bildspåret på en punkt

Har objektet en koordinat gäller `wikidatanamn.MAX_DISTANCE_M`, alltså samma
150 meter som allt annat här i huset. Saknas koordinaten finns ingen spärr att
pröva mot, och då skärps namnet i tre steg i stället: HELA ordmängden ska vara
lika, de generiska orden inbegripna, namnet ska bära minst två ord, och
objektets `P131` ska vara vår kommun.

Ingen av de 42 saknar koordinat i dag, så vägen kostar ingenting och har heller
inte kunnat mätas. Den står där för dagen ett nytt objekt läggs in utan
koordinat, vilket är precis den dag ingen tittar.

En avståndsmiss inom samma stad KASTAS INTE. Se `GRANSKNINGSBAND_M`: Wikidatas
koordinat är gammal ibland, och en människa som läser båda adresserna kan se
det en spärr inte kan.

## Utfallet, mätt 2026-08-25 över alla tolv kommunerna

    verksamheter                                              16 047
    namnlika par som prövades mot en grind                        24
    varav passerade allihop                                        9
    varav föll på avståndet inom samma stad, till granskning        4
    varav föll på avståndet mot en annan stad                     10
    varav objektet var uteslutet på etiketten                      1

Alla nio i Stockholm: Celeste, Dashi, Ekstedt, Etoile, Frantzén, Aira, Mathias
Dahlgren, Operakällaren och Sushi Sho. Elva kommuner får noll, och det är rätt:
de övriga 21 gällande objekten ligger i Göteborg, Malmö, Växjö, Tomelilla,
Hylte, Härryda, Varberg och Sollentuna, som vi inte har register för.

FYRA GÄLLANDE STOCKHOLMSOBJEKT SAKNAS UR KOMMUNENS EGET REGISTER och inte ur
vår hopparning: Aloë, Gastrologik, Oaxen krog och Seafood Gastro ger noll träff
på ren delsträngssökning över alla 8 520 rader. Det är en lucka hos källan.

## Vad modulen INTE gör

Den frågar aldrig Michelin. Guiden har ingen öppen tjänst att fråga, och det
Wikidata bär är vad frivilliga skrivit av ur guiden. Uppgiften är därför
daterad i visningen och tillskriven Wikidata, aldrig oss.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

from . import wikidatanamn
from .oppettider import MIN_SOLO_TOKEN, metres, name_tokens

#: Utmärkelsen. En stjärna i Michelinguiden, oavsett antal.
MICHELINSTJARNA = "Q20824563"

#: Sverige. `P17` på restaurangobjektet.
SVERIGE = "Q34"

#: SLAG AV TING SOM FÅR HA FÅTT EN MICHELINSTJÄRNA.
#:
#: TILLÅTELSELISTA, av samma skäl som `wikidatanamn.ALLOWED_CLASSES` är det:
#: en okänd klass betyder ingen stjärna. Listan är SNÄVARE än den, för frågan
#: är en annan. Se modulens docstring.
#:
#: Varje rad förekommer på minst ett av de 42 objekten, utom de fyra sista.
#: De står med därför att en Michelinstjärna kan sitta på ett värdshus eller
#: en krog lika gärna som på en restaurang, och en ny rad i Wikidata ska inte
#: behöva en kodändring hos oss för att synas.
MATSTALLE_KLASSER: Dict[str, str] = {
    "Q11707": "restaurang",
    "Q10861387": "sushirestaurang",
    "Q256020": "krog",
    "Q30022": "kafé",
    "Q212198": "pub",
    "Q622425": "nattklubb",
}

#: Våra tolv orter, gemener och translittererade som `name_tokens` lämnar dem.
#:
#: Används av grind 1b och av ingenting annat. Listan är hårdkodad och inte
#: läst ur datafilerna, eftersom grinden ska gälla lika för alla tolv även när
#: skriptet körs mot en enda fil.
VARA_ORTER = {
    "stockholm", "uppsala", "linkoping", "jonkoping", "orebro", "karlstad",
    "kristinehamn", "oskarshamn", "borgholm", "hoganas", "lomma", "svenljunga",
}


@dataclass(frozen=True)
class Utmarkelse:
    """Ett påstående om en Michelinstjärna, med sina kvalificerare.

    `start` och `slut` är ISO-datum eller None. Wikidata skriver dem som
    årsprecision, alltså "2013-01-01", och det är året som betyder något.
    """

    start: Optional[str]
    slut: Optional[str]
    antal: Optional[int]

    @property
    def gallande(self) -> bool:
        """Saknar påståendet slutår?

        DEN HÄR EGENSKAPEN ÄR HELA GRINDEN. Se modulens docstring.
        """
        return not self.slut

    @property
    def startar(self) -> Optional[int]:
        return int(self.start[:4]) if self.start else None


@dataclass(frozen=True)
class Stjarnobjekt:
    """Ett Wikidata-objekt som någon gång burit en Michelinstjärna."""

    qid: str
    namn: str
    punkter: Tuple[Tuple[float, float], ...]
    klasser: Tuple[str, ...]
    alias: Tuple[str, ...]
    beskrivning: str
    plats: str
    utmarkelser: Tuple[Utmarkelse, ...]

    def gallande(self) -> Tuple[Utmarkelse, ...]:
        """De påståenden som saknar slutår."""
        return tuple(u for u in self.utmarkelser if u.gallande)

    def aktuell(self) -> Optional[Utmarkelse]:
        """Det gällande påståendet som gäller I DAG, eller None.

        Finns flera väljs det med SENAST kända startår, och bland dem det som
        bär ett antal. Daniel Berlin krog bär två gällande påståenden, 2016 och
        2018, och det är det senare som beskriver nuläget.
        """
        gallande = self.gallande()
        if not gallande:
            return None
        return max(
            gallande,
            key=lambda u: (u.startar or 0, 1 if u.antal is not None else 0),
        )

    def antal_stjarnor(self) -> Optional[int]:
        """Antalet stjärnor i det gällande påståendet, eller None.

        None är ett riktigt utfall och inte ett fel. Fem av de 30 gällande
        saknar `P1114`, bland dem Mathias Dahlgren. Att gissa "en" hade varit
        att skriva ett tal Wikidata inte säger.
        """
        aktuell = self.aktuell()
        return aktuell.antal if aktuell else None

    def tillaten_klass(self) -> bool:
        return any(k in MATSTALLE_KLASSER for k in self.klasser)

    def saknar_klass(self) -> bool:
        return not self.klasser

    def beskrivningen_sager_vad_det_ar(self) -> bool:
        """Samma grind som `wikidatanamn`, med samma ordlista."""
        return wikidatanamn.Objekt(
            qid=self.qid,
            namn=self.namn,
            bild="",
            punkter=self.punkter,
            klasser=self.klasser,
            alias=self.alias,
            beskrivning=self.beskrivning,
        ).beskrivningen_sager_vad_det_ar()

    def namnformer(self) -> List[Tuple[str, ...]]:
        return [name_tokens(self.namn)] + [name_tokens(a) for a in self.alias]


# ---------------------------------------------------------------------------
# Frågan
# ---------------------------------------------------------------------------


_STJARNFRAGA = """SELECT ?r ?rLabel ?platsLabel ?start ?slut ?antal
                         ?lat ?lon ?klass ?beskrivning WHERE {
  ?r wdt:P17 wd:%(land)s ; p:P166 ?st .
  ?st ps:P166 wd:%(utmarkelse)s .
  OPTIONAL { ?st pq:P580 ?start }
  OPTIONAL { ?st pq:P582 ?slut }
  OPTIONAL { ?st pq:P1114 ?antal }
  OPTIONAL { ?r wdt:P131 ?plats }
  OPTIONAL {
    ?r p:P625/psv:P625 ?nod .
    ?nod wikibase:geoLatitude ?lat ; wikibase:geoLongitude ?lon .
  }
  OPTIONAL { ?r wdt:P31 ?klass }
  OPTIONAL { ?r schema:description ?beskrivning . FILTER(LANG(?beskrivning) = "sv") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "sv,en". }
}"""

_ALIASFRAGA = """SELECT ?r ?alias WHERE {
  ?r wdt:P17 wd:%(land)s ; p:P166 ?st .
  ?st ps:P166 wd:%(utmarkelse)s .
  ?r skos:altLabel ?alias . FILTER(LANG(?alias) IN ("sv","en"))
}"""


def _varde(rad: dict, nyckel: str) -> Optional[str]:
    return rad[nyckel]["value"] if nyckel in rad else None


def _datum(ravarde: Optional[str]) -> Optional[str]:
    """ISO-datumet ur WDQS tidsvärde, eller None.

    WDQS svarar "2013-01-01T00:00:00Z". Bara datumdelen lagras; klockslaget är
    en artefakt av att Wikidata har en enda tidstyp.
    """
    return ravarde[:10] if ravarde else None


def _antal(ravarde: Optional[str]) -> Optional[int]:
    """`P1114` som heltal, eller None när talet inte går att läsa.

    Ett antal vi inte kan läsa blir INGET antal och aldrig en etta. Se
    `Stjarnobjekt.antal_stjarnor`.
    """
    if not ravarde:
        return None
    match = re.search(r"\d+", ravarde)
    return int(match.group()) if match else None


def hamta_objekt(land: str = SVERIGE) -> List[Stjarnobjekt]:
    """Alla objekt i landet som någon gång burit en Michelinstjärna.

    Två frågor och inte en, av samma skäl som `wikidatanamn.objects_in_box`:
    ett alias multiplicerar raderna, och påståendena är redan flera per objekt.
    """
    params = {"land": land, "utmarkelse": MICHELINSTJARNA}

    samlade: Dict[str, dict] = {}
    for rad in wikidatanamn.fraga(_STJARNFRAGA % params):
        qid = rad["r"]["value"].rsplit("/", 1)[-1]
        post = samlade.setdefault(
            qid,
            {
                "namn": rad["rLabel"]["value"],
                "punkter": set(),
                "klasser": set(),
                "alias": set(),
                "beskrivning": "",
                "plats": "",
                "utmarkelser": set(),
            },
        )
        if "lat" in rad:
            post["punkter"].add(
                (float(rad["lat"]["value"]), float(rad["lon"]["value"]))
            )
        if "klass" in rad:
            post["klasser"].add(rad["klass"]["value"].rsplit("/", 1)[-1])
        if "beskrivning" in rad:
            post["beskrivning"] = rad["beskrivning"]["value"]
        if "platsLabel" in rad:
            post["plats"] = rad["platsLabel"]["value"]
        # PÅSTÅENDET LAGRAS SOM EN MÄNGD. Raderna multipliceras av klass,
        # koordinat och plats, så samma påstående kommer tillbaka flera gånger
        # med identiska kvalificerare. En lista hade räknat Aloës två
        # påståenden som sex.
        post["utmarkelser"].add(
            (
                _datum(_varde(rad, "start")),
                _datum(_varde(rad, "slut")),
                _antal(_varde(rad, "antal")),
            )
        )

    for rad in wikidatanamn.fraga(_ALIASFRAGA % params):
        qid = rad["r"]["value"].rsplit("/", 1)[-1]
        if qid in samlade:
            samlade[qid]["alias"].add(rad["alias"]["value"])

    return [
        Stjarnobjekt(
            qid=qid,
            namn=post["namn"],
            punkter=tuple(sorted(post["punkter"])),
            klasser=tuple(sorted(post["klasser"])),
            alias=tuple(sorted(post["alias"])),
            beskrivning=post["beskrivning"],
            plats=post["plats"],
            utmarkelser=tuple(
                sorted(
                    (Utmarkelse(start=s, slut=e, antal=a) for s, e, a in post["utmarkelser"]),
                    key=lambda u: (u.start or "", u.slut or "", u.antal or 0),
                )
            ),
        )
        for qid, post in samlade.items()
    ]


# ---------------------------------------------------------------------------
# Grindarna
# ---------------------------------------------------------------------------


def namnet_stammer(vart: Sequence[str], deras: Sequence[str]) -> bool:
    """Grind 1. Är det samma namn, räknat på de utpekande orden?

    ══ DELMÄNGD OCH INTE IDENTITET, TILL SKILLNAD FRÅN BILDSPÅRET ════════════

    `wikidatanamn.names_agree` kräver LIKHET, och där är det rätt: objektet
    kan vara en stadsdel, ett torg eller en gata som verksamheten bara lånar
    sitt namn av, och delmängdsregeln gav 250 sådana par.

    Här kan objektet inte vara något av det. Det har en Michelinstjärna, och
    grind 2 kräver dessutom att det är ett matställe. Kvar av delmängdens risk
    blir bara att TVÅ MATSTÄLLEN har snarlika namn på samma kvarter, och mot
    det står avståndsspärren och granskaren.

    Priset för identitetskravet var mätt och stort. Kommunens register skriver
    nästan alltid ut ett led till som Wikidata inte har:

        Restaurant Frantzén      Klara Norra Kyrkogata 26   mot  Frantzén
        Aira Biskopsudden        Biskopsvägen 9             mot  Aira
        Krog Agrikultur, K/A     Järngravskajen 15          mot  Agrikultur

    Alla tre föll på identitetskravet, och alla tre är rätt ställe. Ägaren
    2026-08-25: "du har missat MASSOR som vi har".

    ══ ETT ENSAMT GEMENSAMT ORD MÅSTE VARA LÅNGT NOG ════════════════════════

    Delar namnen bara ETT ord blir ordet hela beviset. `oppettider.names_agree`
    kräver då att ordet är HUVUDORDET i båda namnen, och den regeln duger inte
    här: "Restaurant Frantzén" har "restaurant" som huvudord, eftersom den
    engelska stavningen inte står i `_LEGAL`, och Frantzén hade fallit igen.

    Kravet blir i stället att ordet ska vara minst `MIN_SOLO_TOKEN` tecken.
    Samma tal som öppettiderna använder mot samma sorts fel. Det fäller "Sav"
    i Malmö, som är tre tecken och skulle kunna sitta inuti vilket namn som
    helst, och det släpper igenom "frantzen", "agrikultur" och "aira".

    LIKHET PRÖVAS FÖRE OCH UTAN LÄNGDKRAVET. "Sushi SHO" i vårt register och
    "Sushi Sho" i Wikidata blir båda ordmängden `{sho}` sedan `distinct`
    strukit det generiska "sushi", alltså tre tecken. Det är en LIKHET och inte
    en delmängd, och likheten är den starka formen som bildspåret bygger på.
    """
    vara = set(vart)
    deras_ = set(deras)
    if not vara or not deras_:
        return False
    if vara == deras_:
        return True
    mindre, storre = (vara, deras_) if len(vara) <= len(deras_) else (deras_, vara)
    if not mindre <= storre:
        return False
    if len(mindre) >= 2:
        return True
    ensamt = next(iter(mindre))
    return len(ensamt) >= MIN_SOLO_TOKEN


def beskrivande_etikett(namn: str) -> bool:
    """Grind 1b. Är etiketten en BESKRIVNING i stället för ett namn?

    Q69871194 heter "restaurang i Stockholm". Se modulens docstring för varför
    det är farligt och inte bara fult.
    """
    kvar = set(wikidatanamn.distinct(name_tokens(namn)))
    return not (kvar - VARA_ORTER)


def strangt_namn(vart: Sequence[str], deras: Sequence[str]) -> bool:
    """Namnkravet för objekt UTAN koordinat.

    HELA ordmängden ska vara lika, de generiska orden inbegripna, och den ska
    bära minst två ord. Utan en koordinat finns ingen andra grind alls, och då
    får namnet bära hela beviset.
    """
    vara = set(vart)
    return len(vara) >= 2 and vara == set(deras)


#: Ord som säger vad för slags område det är, inte vilket område.
#:
#: Stryks ur båda sidor innan `platsen_ar_var` jämför. Wikidata skriver
#: "Stockholms kommun", vi skriver "Stockholms stad" och "Stockholm", och de
#: tre är samma plats med tre olika ändelser.
_ADMINORD = {"kommun", "kommunen", "kommuns", "stad", "staden", "stads"}


def _ortstam(text: str) -> set:
    """Ortnamnet utan administrativa ord och utan genitiv-s.

    "Stockholms kommun", "Stockholms stad" och "Stockholm" blir alla
    `{stockholm}`. Utan genitivstrykningen hade jämförelsen fallit på ett
    ensamt s, vilket den också gjorde tills provet fann det.

    Strykningen görs likadant på båda sidor, så att den inte kan skapa en
    falsk träff: "Höganäs" blir "hogana" hos oss och "hogana" hos Wikidata.
    """
    stammar = set()
    for o in name_tokens(text):
        if o in _ADMINORD:
            continue
        stammar.add(o[:-1] if o.endswith("s") and len(o) > 3 else o)
    return stammar


def platsen_ar_var(objekt: Stjarnobjekt, kommunnamn: str, ort: str) -> bool:
    """Säger objektets `P131` att det ligger i vår kommun?

    Bara för objekt utan koordinat, alltså för de fall där avståndsspärren
    inte finns att luta sig mot.
    """
    plats = _ortstam(objekt.plats)
    return bool(plats) and plats <= (_ortstam(kommunnamn) | _ortstam(ort))


# ---------------------------------------------------------------------------
# Hopparningen
# ---------------------------------------------------------------------------


#: Vilken grind en träff passerade. Skrivs in i granskningskön och i rapporten,
#: så att den som godkänner ser vad beviset vilar på.
GRIND_NARHET = "namn + närhet"
GRIND_STRANGT_NAMN = "strängt namn + kommun, objektet saknar koordinat"

#: Varför ett NAMNLIKT objekt ändå inte blev en träff.
#:
#: Bara objekt som redan klarat namngrinden kan få ett skäl här, eftersom
#: namngrinden är uppslaget i `Namnregister`. Listan blir därmed kort och
#: läsbar, och det är hela poängen: en namnlik kandidat som faller ska SYNAS
#: och inte försvinna tyst. Se `Provning`.
SKAL_ETIKETT = "Wikidatas etikett är en beskrivning och inte ett namn"
SKAL_KLASS = "objektet är inte ett matställe"
SKAL_INDRAGEN = "stjärnan är indragen, påståendet bär slutår"
SKAL_VAR_KOORDINAT = "vår rad saknar koordinat att pröva mot"
SKAL_AVSTAND = "objektets koordinat ligger längre bort än spärren"
SKAL_SVAGT_NAMN = "objektet saknar koordinat och namnet räcker inte ensamt"
SKAL_FEL_KOMMUN = "objektet saknar koordinat och P131 pekar på en annan kommun"

#: Hur långt bort en avståndsmiss får ligga och ändå få granskas av en människa.
#:
#: ══ VARFÖR BANDET FINNS ═══════════════════════════════════════════════════
#:
#: Spärren på 150 meter är rätt spärr för en MASKIN. Den säger att Wikidatas
#: koordinat inte går i god för vår rad, och en maskin har inget mer att gå på.
#: En människa har det: hon kan läsa båda adresserna och veta att restaurangen
#: flyttat.
#:
#: Tre av fallen 2026-08-25 är just sådana, och alla tre är restauranger
#: ägaren räknar som våra:
#:
#:     Adam Albin, Regeringsgatan 2      →  Q112960903 på Rådmansgatan  1 469 m
#:     Krog Agrikultur, Järngravskajen   →  Q70679780 på Roslagsgatan   3 334 m
#:     Agrikultur Bar, Skånegatan 79     →  Q70679780 på Roslagsgatan   4 332 m
#:
#: De två sista är samma objekt mot två av VÅRA rader, och högst en av dem kan
#: vara rätt. Det är exakt den frågan en människa kan svara på och en spärr
#: inte kan.
#:
#: ══ VARFÖR JUST FEM KILOMETER ═════════════════════════════════════════════
#:
#: Bandet ska rymma ett flyttat ställe inom samma stad och inte en förväxling
#: mellan städer. Mätt över alla namnlika avståndsmissar 2026-08-25 ligger
#: talen i två högar utan något emellan: tre fall mellan 427 och 4 332 meter,
#: och tio fall mellan 218 och 514 kilometer. Allt mellan 5 och 200 kilometer
#: ger identiskt utfall, och fem kilometer är den nedre kanten av glappet
#: rundad till ett tal en människa kan läsa.
#:
#: Utan bandet hade "Koka Livs" i Kristinehamn, en livsmedelsbutik 218
#: kilometer från stjärnkrogen Koka i Göteborg, legat i granskningskön med en
#: godkännandeknapp bredvid sig. Det är inte en fråga som ska ställas.
#:
#: ══ VAD BANDET INTE ÄR ════════════════════════════════════════════════════
#:
#: Ingen automatik. Ingenting inom bandet skrivs av sig självt, och bandet
#: flyttar inte `wikidatanamn.MAX_DISTANCE_M`. Det avgör bara vilka avvisade
#: som får en knapp i granskningsarket och vilka som bara får läsas.
GRANSKNINGSBAND_M = 5000.0


@dataclass(frozen=True)
class Traff:
    """En verksamhet och det stjärnobjekt vi vågar säga är den."""

    objekt: Stjarnobjekt
    metres: Optional[float]
    grind: str


@dataclass(frozen=True)
class Avvisad:
    """Ett namnlikt objekt som föll, och på vilken grind.

    ══ VARFÖR DE AVVISADE REDOVISAS OCH INTE BARA KASTAS ═════════════════════

    Uppmätt 2026-08-25 föll EN av åtta namnlika: "Adam Albin" på Regeringsgatan
    2 mot Q112960903 "Adam / Albin", vars P625 ligger 1 469 meter bort på
    Rådmansgatan. Restaurangen har flyttat, kommunens register vet det och
    Wikidata gör det inte; objektet bär ingen `P6375` alls, bara den gamla
    punkten.

    Grinden gör rätt. Namnlikhet ensam får inte bära påståendet, och en
    koordinat som säger något annat är inte ett stöd utan en invändning.

    Men att kasta fallet TYST är fel av ett annat skäl: den enda åtgärd som
    hjälper är att någon rättar P625 i Wikidata, och det kan bara ske om felet
    syns. Därför skrivs de avvisade ut med sitt skäl och sitt avstånd, och de
    står i granskningsarket i en egen avdelning UTAN knappar. Ett avvisat fall
    ska gå att läsa, aldrig att godkänna.
    """

    objekt: Stjarnobjekt
    skal: str
    metres: Optional[float]

    def granskningsbar(self) -> bool:
        """Får en människa avgöra det här fallet?

        Bara avståndsmissar inom `GRANSKNINGSBAND_M`, och bara när stjärnan
        gäller. En indragen stjärna är inte en fråga för en granskare: den är
        avgjord av Michelin.
        """
        return (
            self.skal == SKAL_AVSTAND
            and self.metres is not None
            and self.metres <= GRANSKNINGSBAND_M
            and bool(self.objekt.gallande())
        )


@dataclass(frozen=True)
class Provning:
    """Utfallet för en verksamhet: träffen om någon, och de namnlika som föll."""

    traff: Optional[Traff]
    avvisade: Tuple[Avvisad, ...]


class Namnregister:
    """Objekten slagna på varje enskilt ord i sina namn.

    Inget rutnät här, till skillnad från `wikidatanamn.Index`. Hela riket är 42
    objekt, så uppslaget behöver bara vara billigt nog att göra 16 047 gånger.

    NYCKELN ÄR ETT ORD OCH INTE HELA ORDMÄNGDEN. Så länge grind 1 krävde
    likhet dög ordmängden som nyckel, för då VAR uppslaget grinden. Med
    delmängdsregeln räcker det inte: "Restaurant Frantzén" och "Frantzén" är
    olika mängder och ska ändå mötas. En delmängdsrelation mellan två icke-tomma
    mängder kräver att de delar minst ett ord, alltså är ordet rätt nyckel och
    `namnet_stammer` får avgöra resten.
    """

    def __init__(self, objekt: Iterable[Stjarnobjekt]) -> None:
        self._pa_ord: Dict[str, List[Stjarnobjekt]] = {}
        #: Objekt som aldrig kommer in i registret, se nedan.
        self.uteslutna: List[Stjarnobjekt] = []
        for o in objekt:
            # GRIND 1B PRÖVAS HÄR OCH INTE PER VERKSAMHET.
            #
            # Q69871194 heter "restaurang i Stockholm", och det som återstår
            # sedan `distinct` strukit bolagsorden är ortnamnet. Med
            # delmängdsregeln blev objektet kandidat till varenda rad i
            # registret som bär ordet Stockholm: 150 stycken i en enda körning,
            # från "Willys Stockholm Bromma" till "Chabad Stockholm".
            #
            # Alla 150 föll på grinden, men de föll EN OCH EN och fyllde
            # granskningsarket med brus som inte gick att läsa. Ett objekt vars
            # etikett är en beskrivning är fel om vår rad likaväl som om alla
            # andra, alltså hör beslutet hemma en gång per objekt.
            if beskrivande_etikett(o.namn):
                self.uteslutna.append(o)
                continue
            sedda: set = set()
            for form in o.namnformer():
                for ord_ in wikidatanamn.distinct(form):
                    if (ord_, o.qid) in sedda:
                        continue
                    sedda.add((ord_, o.qid))
                    self._pa_ord.setdefault(ord_, []).append(o)

    def namnlika(self, namn: Optional[str]) -> List[Stjarnobjekt]:
        """Objekt som delar minst ett utpekande ord med namnet.

        Kandidater, inte träffar. `para` prövar `namnet_stammer` på varje.
        """
        vara = wikidatanamn.distinct(name_tokens(namn or ""))
        if not vara:
            return []
        funna: Dict[str, Stjarnobjekt] = {}
        for ord_ in vara:
            for o in self._pa_ord.get(ord_, ()):
                funna[o.qid] = o
        return list(funna.values())


def para(
    register: Namnregister,
    namn: Optional[str],
    lat: Optional[float],
    lng: Optional[float],
    kommunnamn: str,
    ort: str,
) -> Provning:
    """Alla fem grindarna. Vilket stjärnobjekt är det här stället, om något?

    Grindarnas ordning är vald så att den billigaste faller först och den som
    kostar ett beslut sist. Ingen av dem gör ett nätanrop.

    Returnerar BÅDE träffen och de namnlika som föll, se `Avvisad` för varför
    de senare inte får kastas tyst.
    """
    vart = name_tokens(namn or "")
    if not vart:
        return Provning(traff=None, avvisade=())

    basta: Optional[Traff] = None
    avvisade: List[Avvisad] = []

    def fall(objekt: Stjarnobjekt, skal: str, meter: Optional[float] = None) -> None:
        avvisade.append(Avvisad(objekt=objekt, skal=skal, metres=meter))

    vart_utpekande = wikidatanamn.distinct(vart)
    for objekt in register.namnlika(namn):
        # Grind 1: namnet, som delmängd. Registret ovan lämnar bara kandidater
        # som delar ett ord, och det är inte samma sak som att namnen stämmer.
        #
        # ETT UTEBLIVET NAMN REDOVISAS INTE bland de avvisade. Att dela ett ord
        # är vanligt och säger ingenting; listan över avvisade ska bära de fall
        # där namnet stämde och något ANNAT fällde, för det är de fallen en
        # människa kan göra något åt.
        if not any(
            namnet_stammer(vart_utpekande, wikidatanamn.distinct(form))
            for form in objekt.namnformer()
        ):
            continue

        # Grind 1b ligger i `Namnregister.__init__`. Ett objekt vars etikett är
        # en beskrivning kommer aldrig hit.

        # Grind 2: objektet ska vara ett matställe. Saknas P31 helt får
        # beskrivningen svara i stället, precis som i wikidatanamn.
        if not objekt.tillaten_klass():
            if not (
                objekt.saknar_klass() and objekt.beskrivningen_sager_vad_det_ar()
            ):
                fall(objekt, SKAL_KLASS)
                continue

        # ORDNINGEN MELLAN GRIND 3 OCH 4 ÄR VALD FÖR RAPPORTENS SKULL.
        #
        # Utfallet är detsamma hur de än står, för båda måste passeras. Men den
        # avvisade får bara ETT skäl, och skälet ska vara det som säger något.
        # Med slutåret först fick "Förskolan Sture" i Stockholm beskedet
        # "stjärnan är indragen" om en krog i Malmö, vilket är sant och
        # samtidigt oanvändbart. Med avståndet först står det att det är fel
        # ställe, och kvar bland de indragna blir bara de som FAKTISKT ligger
        # där stjärnkrogen låg. Det är den enda av de två listorna en människa
        # har något att göra med.

        # Grind 4: närhet när det går, annars ett strängare namn.
        if objekt.punkter:
            if lat is None or lng is None:
                fall(objekt, SKAL_VAR_KOORDINAT)
                continue
            narmast = min(metres(lat, lng, p[0], p[1]) for p in objekt.punkter)
            if narmast > wikidatanamn.MAX_DISTANCE_M:
                fall(objekt, SKAL_AVSTAND, narmast)
                continue
            traff = Traff(objekt=objekt, metres=narmast, grind=GRIND_NARHET)
        else:
            if not strangt_namn(vart, name_tokens(objekt.namn)):
                fall(objekt, SKAL_SVAGT_NAMN)
                continue
            if not platsen_ar_var(objekt, kommunnamn, ort):
                fall(objekt, SKAL_FEL_KOMMUN)
                continue
            traff = Traff(objekt=objekt, metres=None, grind=GRIND_STRANGT_NAMN)

        # Grind 3: minst ett påstående utan slutår. Utan den är Bon Lloc en
        # stjärnkrog. Se kommentaren ovan om varför den står efter avståndet.
        if not objekt.gallande():
            fall(objekt, SKAL_INDRAGEN, traff.metres)
            continue

        if basta is None or (
            traff.metres is not None
            and (basta.metres is None or traff.metres < basta.metres)
        ):
            basta = traff

    return Provning(traff=basta, avvisade=tuple(avvisade))


def raden(objekt: Stjarnobjekt) -> dict:
    """Det som skrivs in i verksamhetens rad i site/src/data/*.json.

    Formen är den samma som `image`: ett litet objekt med källans egen
    identitet, så att sajten kan skriva ut uppgiften utan att slå upp något
    och utan att räkna om något.

    `stars` är None när Wikidata inte säger antalet. Mallen skriver då
    "Michelinstjärna" utan tal, se site/src/components/Michelinstjarna.astro.

    Tar OBJEKTET och inte träffen, eftersom raden också behöver byggas för de
    avvisade som en människa får granska. Se `Avvisad.granskningsbar`.
    """
    aktuell = objekt.aktuell()
    return {
        "qid": objekt.qid,
        "stars": aktuell.antal if aktuell else None,
        "since": aktuell.start[:4] if aktuell and aktuell.start else None,
        "checkedAt": None,  # fylls av skriptet, se pipeline/michelin.py
    }
