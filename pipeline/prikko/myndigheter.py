"""Landets kontrollmyndigheter för livsmedel, härledda ur rapporten.

Kampanjen för att begära ut kontroller adresseras till **myndigheter**, inte
till kommuner. Sverige har 290 kommuner men färre kontrollmyndigheter,
eftersom ett antal kommuner lagt kontrollen i en gemensam nämnd eller ett
kommunalförbund. Att mejla Arboga och Kungsör var för sig är två mejl till
samma handläggare, och den handläggaren blir med rätta irriterad.

Listan över myndigheter finns redan i huset. Bilagan i "Sveriges
livsmedelskontroll" har en rad per kontrollmyndighet, och den raden bär både
namnet och antalet anläggningar i registret. `sources/livsmedelsverket.py`
läser den redan åt kommunsidorna. Den här modulen gör två saker till med
samma rader: den lagar det som PDF-tabellen förvanskar, och den binder varje
myndighet till kommunkoder så att registret går att foga ihop med resten av
pipelinen.

## Det PDF-tabellen förvanskar

Ett långt myndighetsnamn bryts över flera rader i tabellen, och de två
bilagorna bryter det inte på samma ställe. Följden är att samma myndighet kan
komma ut ur läsningen som två poster med var sin halva av fälten:

    "Mariestad Töreboda Gullspång"                          anläggningar 403
    "Miljö-och byggnadsnämnden Mariestad Töreboda Gullspång" årsarbetskrafter 4,0

`merge_fragments` fogar ihop dem. Regeln är kommunuppsättningen: två poster
som pekar på samma kommuner ÄR samma myndighet. Namnet som behålls är det
längsta, eftersom det är det minst avhuggna, och talen tas från den post som
har dem. En post kan alltså bära ett namn som fortfarande är stympat
("byggnadsnämnd Norberg Fagersta Avesta"). Det är avsiktligt: att gissa fram
det riktiga namnet vore att hitta på en myndighet. Namnet ersätts när det
verifierats för hand, i kontaktfilen.

## Hur kommunerna hittas i namnet

Gemensamma nämnder skriver ut sina medlemskommuner i rapporten, vilket är
turen som gör hela kopplingen möjlig. Matchningen sker på hela ord och inte på
delsträngar, annars skulle "Bergslagen" räknas som kommunen Berg. Genitiv-s
tillåts på sista ordet, eftersom rapporten skriver "Härjedalens" när kommunen
heter Härjedalen. Bindestreck läses som ordmellanrum, så att "Malå-Norsjö"
hittar båda kommunerna, och "Dals-Ed" hittas ändå eftersom kommunnamnen
provas i fallande längd.

Metoden binder 289 av 290 kommuner. Den som blir över är Klippan, och orsaken
är inte metoden utan tabellen: raden är avhuggen i PDF:en. Sådant ska synas i
utfallet i stället för att lagas med en gissning, och därför lämnar
`unmatched` ut de kommuner som ingen myndighet tar hand om.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, replace
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

from .sources.livsmedelsverket import Authority

#: Rader i rapporten som inte är en kommunal kontrollmyndighet. Livsmedelsverket
#: rapporterar sin egen kontroll i samma bilaga.
NOT_MUNICIPAL = ("Livsmedelsverket",)

_WORD = re.compile(r"[^\W\d_]+", re.UNICODE)


def _words(text: str) -> List[str]:
    """Namnet som gemena ord. Bindestreck och snedstreck är ordmellanrum."""
    return [w.lower() for w in _WORD.findall(text.replace("-", " ").replace("/", " "))]


def municipalities_in(name: str, codes: Dict[str, str]) -> List[str]:
    """Kommunkoderna som nämns i ett myndighetsnamn, i kodordning.

    `codes` är kommunnamn till kommunkod, hela riket. Kommunnamnen provas i
    fallande antal ord, och orden som gått åt kan inte gå åt en gång till. Det
    är därför "Dals-Ed" inte också blir "Ed": kommunnamnet med flest ord tar
    orden först.
    """
    haystack = _words(name)
    taken = set()
    found = set()
    order = sorted(codes, key=lambda n: (len(_words(n)), len(n)), reverse=True)
    for municipality in order:
        needle = _words(municipality)
        for start in range(len(haystack) - len(needle) + 1):
            span = range(start, start + len(needle))
            if any(index in taken for index in span):
                continue
            window = haystack[start : start + len(needle)]
            genitive = window[:-1] == needle[:-1] and window[-1] == needle[-1] + "s"
            if window == needle or genitive:
                found.add(codes[municipality])
                taken.update(span)
                break
    return sorted(found)


@dataclass(frozen=True)
class ControlAuthority:
    """En kontrollmyndighet, med kommunerna den ansvarar för."""

    #: Lägsta kommunkoden bland medlemmarna. Stabil nyckel mot kontaktfilen:
    #: en myndighet kan byta namn i rapporten mellan årgångar, och gör det,
    #: men den lägsta kommunkoden ändras bara om medlemskretsen ändras. En
    #: handskriven rad i kontaktfilen behåller sin kod även då, så att ett
    #: pågående ärende inte byter identitet mitt i.
    key: str
    #: Namnet som det står i rapporten, eventuellt avhugget.
    name: str
    #: Kommunkoderna, i kodordning.
    municipalities: Tuple[str, ...]
    #: Anläggningar i myndighetens register, ur rapporten.
    facilities: Optional[int] = None
    #: Utförda kontroller under året.
    controls: Optional[int] = None
    #: Årsarbetskrafter.
    fte: Optional[float] = None

    @property
    def joint(self) -> bool:
        """Sant för gemensam nämnd eller kommunalförbund."""
        return len(self.municipalities) > 1


def _pick(*values):
    for value in values:
        if value is not None:
            return value
    return None


def merge_fragments(authorities: Sequence[ControlAuthority]) -> List[ControlAuthority]:
    """Foga ihop poster som är samma myndighet bruten på två ställen.

    Två poster hör ihop när den ena posten saknar anläggningar och dess
    kommunuppsättning överlappar den andras. Kommunerna blir unionen, eftersom
    ett avhugget namn kan ha tappat en medlemskommun ("Simris-hamn" blir inte
    Simrishamn), och talen blir det som finns.
    """
    merged: List[ControlAuthority] = []
    for authority in sorted(authorities, key=lambda a: (a.facilities is None, a.key)):
        for index, existing in enumerate(merged):
            overlaps = set(existing.municipalities) & set(authority.municipalities)
            incomplete = existing.facilities is None or authority.facilities is None
            if overlaps and incomplete:
                names = sorted((existing.name, authority.name), key=len)
                codes = tuple(
                    sorted(set(existing.municipalities) | set(authority.municipalities))
                )
                merged[index] = replace(
                    existing,
                    key=codes[0],
                    name=names[-1],
                    municipalities=codes,
                    facilities=_pick(existing.facilities, authority.facilities),
                    controls=_pick(existing.controls, authority.controls),
                    fte=_pick(existing.fte, authority.fte),
                )
                break
        else:
            merged.append(authority)
    return sorted(merged, key=lambda a: a.key)


def build(
    authorities: Iterable[Authority], codes: Dict[str, str]
) -> Tuple[List[ControlAuthority], List[str]]:
    """Myndigheterna ur rapporten, och kommunerna ingen av dem tog hand om.

    Kommuner utan myndighet är inte ett fel att svälja. De ska stå kvar i
    utfallet som ett hål att fylla för hand, för alternativet är att en kommun
    tyst aldrig får något mejl.
    """
    built: List[ControlAuthority] = []
    for authority in authorities:
        if authority.name in NOT_MUNICIPAL:
            continue
        if authority.name in codes:
            members = [codes[authority.name]]
        else:
            members = municipalities_in(authority.name, codes)
        if not members:
            continue
        built.append(
            ControlAuthority(
                key=members[0],
                name=authority.name,
                municipalities=tuple(members),
                facilities=authority.facilities,
                controls=authority.controls,
                fte=authority.fte,
            )
        )

    result = merge_fragments(built)
    covered = {code for a in result for code in a.municipalities}
    unmatched = sorted(set(codes.values()) - covered)
    return result, unmatched
