"""Gatuadressen ur kommunens egen kontrollrapport.

Fyra kommuner publicerar ingen gatuadress i sin LISTNING: Borgholm, Höganäs,
Lomma och Svenljunga. Utan gatuadress har `pipeline/geocode.py` inget att
härleda ur, och deras 974 verksamheter står helt utan kartnål.

För Höganäs är det inte hela sanningen. Kommunen publicerar adressen, men
inuti PDF-rapporten i stället för i filnamnet. Den här modulen läser ut den.

VILKEN ADRESS SOM RÄKNAS
------------------------
En rapport bär upp till TVÅ adresser, och bara den ena får bli en nål.

    1. MOTTAGARADRESSEN i brevhuvudet. Det är verksamhetsutövarens
       postadress, alltså lika gärna ägarens hem eller ett huvudkontor i en
       annan kommun. Rapporten påstår ingenting om att den är densamma som
       den kontrollerade lokalen.

    2. KONTROLLSTÄLLET i rapportens inledande mening. Den är uttrycklig:

           "Vi på miljöavdelningen har 2025-09-25 kontrollerat er verksamhet
            Shakespeare restaurang, Väsbygatan 2A, 26336 Höganäs, KRINGLAN 7."

       Kommunen SÄGER att det är där den kontrollerade verksamheten ligger.

Bara den andra läses. Skillnaden är hela poängen med modulen: en nål på
ägarens villaadress är värre än ingen nål, och de två går inte att skilja åt
i efterhand. `Il Faro` i Viken har till exempel `Fyrskepp 17 AB` som
verksamhetsutövare, och att bolagets postadress råkar vara restaurangens är
inget rapporten går i god för.

TVÅ MALLAR, OCH BARA DEN ENA GÅR ATT LITA PÅ
--------------------------------------------
Höganäs bytte rapportmall omkring oktober 2024.

    Ny mall (2024-10 och senare)   Har den inledande meningen ovan. LÄSES.
    Gammal mall (till 2024-10)     Har bara brevhuvudet, och ibland inte ens
                                   en gatuadress där utan enbart en
                                   fastighetsbeteckning
                                   ("Surfers Paradise SVANEBÄCK 1:137").
                                   LÄSES INTE.

Uppmätt över hela beståndet, se `fetch_rapportadresser.py`. Att den gamla
mallen inte läses är ett val och inte ett förbiseende: den enda adress den
bär är mottagarens, och den frågan är avgjord ovan.

FASTIGHETSBETECKNINGEN LÄSES, MEN BLIR INGEN NÅL
------------------------------------------------
Meningen slutar med en fastighetsbeteckning ("KRINGLAN 7", "VIKEN 120:1").
Den bärs vidare i utdatan därför att den är ett exakt och kontrollerbart
läge, men den går inte att slå upp mot vare sig OSM eller Lantmäteriets
belägenhetsadresser. Den som senare får tillgång till Lantmäteriets
fastighetsindelning kan använda den; till dess är den dokumentation, inte
en koordinat.

TEXTEN KOMMER STYCKAD
---------------------
`prikko/pdf.py` lämnar ut textlöpor i innehållsströmmens ordning, och
ordmellanrum finns inte alltid som tecken. Samma mening kan komma som
`'kontrollera'`, `'t'`, `'er verksamhet '`. Därför söks ankaret i en version
av texten där ALLA blanksteg är borttagna, med en indexkarta tillbaka till
den mellanrumsförsedda texten. Ett mönster som gissar var mellanslagen
hamnade hade fallit på första rapport som styckats på ett nytt ställe.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List, Optional, Tuple

from .geocode import parse_address
from .pdf import extract_blocks

#: Textlöpor som bara är språkmärkning i PDF:en, aldrig innehåll. Samma
#: skräp som prikko/sources/livsmedelsverket.py rensar bort.
_NOISE = ("sv-SE", "en-US")

#: Ankaret, utan blanksteg. Meningen inleder varje rapport i den nya mallen
#: och är kommunens egen utsaga om VAR verksamheten ligger. Formen
#: "kontrollerat" varierar inte; det är bara styckningen som gör det, och
#: den är redan bortnormaliserad när ankaret söks.
_ANCHOR = "kontrolleraterverksamhet"

#: Så långt efter ankaret adressen någonsin står. Meningen är kort, och
#: taket hindrar att nästa sidas brevhuvud eller sidfot dras in i tolkningen
#: om ankaret skulle stå sist på en sida.
_TAIL_CHARS = 260

#: Svenskt postnummer, med eller utan blanksteg. `26336 Höganäs` och
#: `263 36 Höganäs` förekommer båda i beståndet. Postnumret är det som
#: håller ihop tolkningen: gatuadressen står i ledet FÖRE det, postorten
#: efter. Kommatecknens antal varierar, postnumrets plats gör det inte.
_POSTAL = re.compile(r"(?<!\d)(\d{3})\s?(\d{2})(?!\d)")

#: Fastighetsbeteckningen sist i meningen: "KRINGLAN 7", "VIKEN 120:1",
#: "BRUNNBY - BRÄCKE 2:82". Versaler genomgående, vilket skiljer den från
#: den löpande text som följer efter punkten.
_PROPERTY = re.compile(
    r"^\s*,\s*([A-ZÅÄÖ][A-ZÅÄÖ\s:\-]*\d+(?::\d+)?)\s*\."
)

#: Verksamhetsnamn och adress skrivs ihop med "på" i stället för att skiljas
#: med kommatecken i en del rapporter:
#:
#:     "er verksamhet Nyhamnsgården avdelningskök på Skonarevägen 6, 263 76 …"
#:
#: Utan den här regeln blir hela strängen adresskandidat, parse_address
#: fäller den, och en verklig adress går förlorad. Regeln flyttar bara
#: startpunkten i en sträng kommunen själv skrivit; den hittar inte på något.
_ON_PREMISES = re.compile(r"\bpå\s+(?=\S)")

#: Kommunens EGNA adresser, som står i sidfoten och i brevhuvudet på varje
#: sida. De ska aldrig kunna bli en verksamhets adress. Spärren är ett
#: bälte utöver ankaret och teckentaket ovan, inte i stället för dem.
_MUNICIPAL_ADDRESSES = (
    "centralgatan 20",
    "stadshuset",
)


@dataclass(frozen=True)
class Premises:
    """Det kontrollstället rapporten pekar ut."""

    #: Verksamhetens namn så som rapporten skriver det. Används INTE som
    #: identitet: identiteten kommer ur filnamnet, se sources/hoganas.py.
    name: str
    #: Gatuadress med husnummer, ordagrant ur rapporten.
    street_address: str
    #: Postnummer, fem siffror utan blanksteg.
    postal_code: str
    #: Postort.
    locality: str
    #: Fastighetsbeteckning, när meningen bär en. Se modulens inledning.
    property_designation: Optional[str]


def flatten(document: bytes) -> str:
    """Rapportens text som en rad, med enkla mellanrum.

    Löporna sätts ihop med ETT blanksteg emellan, aldrig utan. Att sätta ihop
    dem utan mellanrum hade svetsat samman ord som verkligen står isär
    ("Storgatan" + "24A" -> "Storgatan24A"), och det felet går inte att se i
    efterhand. Ett extra mellanrum inne i ett ord går däremot att hantera:
    ankaret söks blankstegsfritt, och adressen valideras mot parse_address.
    """
    parts = []
    for block in extract_blocks(document):
        text = " ".join(block.text.split())
        if text and text not in _NOISE:
            parts.append(text)
    return " ".join(parts)


def _despace(text: str) -> Tuple[str, List[int]]:
    """Texten utan blanksteg, plus varje tecknets plats i originalet."""
    stripped: List[str] = []
    positions: List[int] = []
    for index, char in enumerate(text):
        if not char.isspace():
            stripped.append(char)
            positions.append(index)
    return "".join(stripped), positions


def find_anchor(text: str) -> Optional[int]:
    """Var i `text` meningen om det kontrollerade stället slutar.

    Returnerar indexet EFTER ankaret, alltså där namn och adress börjar.
    None när rapporten saknar meningen, vilket är den gamla mallen.
    """
    stripped, positions = _despace(text.casefold())
    found = stripped.find(_ANCHOR)
    if found < 0:
        return None
    last = positions[found + len(_ANCHOR) - 1]
    return last + 1


def parse_premises(text: str) -> Optional[Premises]:
    """Tolka namn, gatuadress, postnummer och postort ur rapportens text.

    Returnerar None så snart något av det som krävs saknas. Det är det
    normala utfallet i tre lägen, och alla tre är korrekta:

        * gammal mall, alltså inget ankare
        * adressen saknar husnummer ("Stationsplatsen, Stationstorget,
          263 58 Strandbaden") — utan nummer finns ingen punkt att peka på,
          samma regel som parse_address följer överallt annars
        * inget postnummer, alltså inget som håller ihop tolkningen
    """
    start = find_anchor(text)
    if start is None:
        return None

    tail = text[start : start + _TAIL_CHARS]
    postal = _POSTAL.search(tail)
    if postal is None:
        return None

    head = tail[: postal.start()]
    # Postorten står mellan postnumret och nästa kommatecken eller punkt.
    rest = tail[postal.end() :]
    locality = re.split(r"[,.]", rest, maxsplit=1)[0].strip()
    if not locality or any(c.isdigit() for c in locality):
        return None

    parts = [p.strip() for p in head.split(",") if p.strip()]
    if not parts:
        return None

    # Ledet närmast postnumret är gatuadressen; allt före är namnet.
    candidate = parts[-1]
    name = ", ".join(parts[:-1]).strip() or candidate

    # "… avdelningskök på Skonarevägen 6" — se _ON_PREMISES.
    #
    # Villkoret är att SVANSEN efter "på" är en adressplats, inte att hela
    # strängen misslyckas. parse_address är med flit tillåtande om vad ett
    # gatunamn får heta, så "Nyhamnsgården avdelningskök på Skonarevägen 6"
    # tolkas glatt som gatan "nyhamnsgården avdelningskök på skonarevägen"
    # nummer 6, och den gatan finns inte.
    #
    # Risken åt andra hållet är en verklig gata med "på" i namnet, som då
    # skulle kortas. Den felar åt rätt håll: den korta formen hittas inte i
    # adresskällan och ger ingen nål alls, i stället för en nål som ljuger.
    split = list(_ON_PREMISES.finditer(candidate))
    if split:
        after = candidate[split[-1].end() :].strip()
        if parse_address(after) is not None:
            if name == candidate:
                name = candidate[: split[-1].start()].strip() or candidate
            candidate = after

    candidate = " ".join(candidate.split())
    if parse_address(candidate) is None:
        return None
    if any(known in candidate.casefold() for known in _MUNICIPAL_ADDRESSES):
        return None

    # Fastighetsbeteckningen står efter postorten. Offseten räknas från där
    # postorten FAKTISKT börjar: `rest` inleds med det blanksteg som skilde
    # postnumret från orten, och att bara hoppa över len(locality) tecken
    # hade lämnat kvar ett tecken och fällt mönstret.
    after_locality = rest[rest.index(locality) + len(locality) :]
    designation = _PROPERTY.match(after_locality)
    return Premises(
        name=" ".join(name.split()),
        street_address=candidate,
        postal_code=postal.group(1) + postal.group(2),
        locality=locality,
        property_designation=(
            " ".join(designation.group(1).split()) if designation else None
        ),
    )


def read_premises(document: bytes) -> Optional[Premises]:
    """Kontrollstället ur en rapport-PDF, eller None när det inte står där."""
    return parse_premises(flatten(document))
