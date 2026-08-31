"""Inläsare för Ecos egen XML-export.

Trettonde källan, och den första som INTE är skriven för en kommun.

Ecos är Sokigos ärendesystem för miljö- och hälsoskydd, och `ecos.xml` är
systemets egen utdragsform: en platt lista med ett `<insp>`-element per
kontrolltillfälle, kontrollpunkterna nästlade under. Formen kommer ur
systemet och inte ur kommunens webbredaktion, så samma läsare bör passa varje
kommun som kör Ecos och exporterar på samma sätt.

Det är hela skälet att modulen heter `ecos` och inte `norrkoping`. Enligt
`docs/43_kommunmaskinen.md` §6 kör kommunerna tre ärendesystem, Ecos, EDP
Vision och Castor, och Ecos är det största av dem. Vilka kommuner som kör
vilket system är i dag OKÄNT för samtliga 290: fältet `verksamhetssystem` står
tomt i både `kommuner.json` och `kommunregister.csv`, eftersom leverantörerna
inte publicerar sina kundlistor. Talet 68 som cirkulerat är alltså inte mätt av
oss och används inte här. Kartan kommer med svaret på genväg A, begäran till
Livsmedelsverket. Den dagen den kommer är det här den modul som ska ta emot,
och en ny kommun är då en post i `MUNICIPALITIES` och ingen ny fil.

Att generalisera på FÖRSTA källan är ovanligt i den här pipelinen och gjordes
med öppna ögon: `norrkoping` är i dag den enda posten i tabellen, och tills en
andra kommun bekräftar formen är återanvändbarheten en hypotes och inte ett
mätt faktum. Den kostar ingenting att bära, och skillnaden mot att skriva om
en `norrkoping.py` i efterhand är att kommunspecifika antaganden aldrig hinner
växa in i koden.

## Vad utdraget innehåller, räknat över hela filen 2026-08-31

    4 451  kontrolltillfällen, alla med exakt samma åtta fält
    1 022  verksamheter (namn och besöksadress, gemener)
   25 083  kontrollpunkter, varav 2 309 med avvikelse
       12  kontrollområden, alla med Livsmedelsverkets egna namn
        4  kontrollpunkter med TOM status, se `normalize_inspection`
       22  verksamheter utan besöksadress
        0  saknade värden i något annat fält

Bedömningen är tvågradig, `Godtagbar` 3 289 och `Ej godtagbar` 1 162, och
kontrollpunktens status likaså, `Utan avvikelse` och `Avvikelse`.

## Vad utdraget INTE innehåller

**Ingen verksamhetstyp.** Filen säger inte om stället är en restaurang, en
förskola eller ett vattenverk. `types` blir därför tom, och kategorifiltren
finns inte i en Ecos-kommun förrän källan börjar bära typen. Att härleda typen
ur namnet är uttryckligen inte ett alternativ: se mätningen i
`docs/45_entreprenorslistan.md`, där namnet underkändes som kategorikälla.

**Inga koordinater och inget organisationsnummer.** Besöksadressen finns och
bär husnummer, så `pipeline/geocode.py` kan sätta nålar i efterhand på samma
sätt som för Örebro och Uppsala. Det är ett eget steg och inte en del av
hämtningen.

**Ingen kontrollorsak.** Filen skiljer inte planerad kontroll från återbesök.
Varje kontroll läses därför som `ROUTINE`, vilket får en följd som är värd att
förstå: `grading.py` kan bara härleda en kvarstående brist ur att FÖREGÅENDE
kontroll också hade avvikelser, aldrig ur att kommunen kom tillbaka. Samma
läge som Stockholm, och det är avsiktligt att vi inte gissar oss till en
kontrolltyp ur diarienumret.

## Bedömningen är tvågradig, och den skärps inte här

`Ej godtagbar` blir `MINOR_REMARKS` och aldrig `MAJOR_REMARKS`. Kommunens skala
har två steg, precis som Stockholms, och att läsa det översta som "allvarliga
brister" vore att uppfinna en nivå källan inte har. Den allvarligaste nivån
härleds i stället ur mönstret i `grading.py`, av exakt de skäl modulens
inledning skriver ut.

## Åldern

Filen ändrades senast 2024-03-17 och den senaste kontrollen är daterad
2024-01-03. Det gör Ecos-utdraget till vårt äldsta bestånd med god marginal,
och det får INTE hanteras genom att tumma på färskhetsfönstret. Det hanteras av
att fönstret får verka: med `FRESHNESS_WINDOW_DAYS` på tre år bär 272 av 1 022
verksamheter en bedömning, och de övriga 750 får `stale_inspections`,
no-indexeras och räknas som "Ingen bedömning" på kommunsidan. Det är rätt
utfall, och det är sajtens egen befintliga mekanik som ger det.

`SOURCE_MODIFIED` bärs vidare till datafilen just därför. Hämtdatumet säger när
VI läste filen, inte när KOMMUNEN skrev den, och på ett bestånd som ligger
stilla är skillnaden hela sanningen.

## Licens

Ingen licensuppgift finns på filen eller på någon sida som pekar på den.
Bedömningen som ligger till grund för att vi ändå publicerar står ordagrant i
`docs/20_kommunexpansion.md` §9. Den är inte gjord här, och den ska inte
läsas ur koden.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from datetime import date
from typing import Dict, List, Optional
from xml.etree import ElementTree

from ..grading import MINOR_REMARKS, NO_REMARKS, ROUTINE


class UnknownSourceValue(Exception):
    """Källan levererade ett värde vi inte känner igen.

    Får aldrig hanteras med ett default. Vi publicerar omdömen om namngivna
    verksamheter; ett okänt värde som tyst tolkas som godkänt är precis den
    sortens fel som förstör förtroendet.
    """


@dataclass(frozen=True)
class EcosMunicipality:
    """En kommun som publicerar ett Ecos-utdrag."""

    #: SCB REGINA, fyra siffror.
    code: str
    #: Formellt namn: "Norrköpings kommun".
    name: str
    #: Orten i grundform. Får ALDRIG härledas ur kommunnamnet.
    city: str
    slug: str
    #: Filen själv.
    data_url: str
    #: Sidan en människa ska hänvisas till. Se kommentaren i tabellen.
    source_url: str
    #: `Last-Modified` på filen, ISO. Källans egen ålder, se modulens
    #: inledning. Verifieras vid varje hämtning, se `check_modified`.
    source_modified: str


#: Kommunerna vi läser Ecos-utdrag ur.
#:
#: Norrköping är den enda i dag. `source_url` pekar på filen och inte på en
#: sida om livsmedelskontrollen, av ett skäl som är mätt i
#: `docs/42_oppna_data_sveptet.md` §6: söksidan är nedmonterad sedan minst
#: 2026-08-03 och det finns ingen levande sida hos kommunen som beskriver
#: beståndet. Att peka på en sida som svarar 404 vore sämre än att peka på
#: filen, som svarar 200.
MUNICIPALITIES: Dict[str, EcosMunicipality] = {
    "norrkoping": EcosMunicipality(
        code="0581",
        name="Norrköpings kommun",
        city="Norrköping",
        slug="norrkoping",
        data_url=(
            "https://norrkoping.se/download/18.5ff942e1184b3f255e22527f"
            "/1710704675524/ecos.xml"
        ),
        source_url=(
            "https://norrkoping.se/download/18.5ff942e1184b3f255e22527f"
            "/1710704675524/ecos.xml"
        ),
        source_modified="2024-03-17",
    ),
}

#: Förhandsbeskedet. Två värden i hela filen.
PRENOTIFIED = {"Anmäld": True, "Oanmäld": False}

#: Kommunens samlade bedömning per kontrolltillfälle. Två värden i hela filen.
#:
#: `Ej godtagbar` blir MINOR och aldrig MAJOR. Se modulens inledning.
ASSESSMENTS = {"Godtagbar": NO_REMARKS, "Ej godtagbar": MINOR_REMARKS}

#: Kontrollpunktens status. Två värden, plus tomt, se `normalize_inspection`.
#:
#: `fixed` och `persisting` förekommer inte: utdraget säger aldrig att en
#: avvikelse åtgärdats eller kvarstår, bara om den fanns vid tillfället.
AREA_STATUSES = {"Utan avvikelse": "ok", "Avvikelse": "deviation"}

#: Fälten varje `<insp>` måste bära. Alla 4 451 gör det i dagens fil, och en
#: fil där de inte gör det har bytt form och ska inte läsas tyst.
REQUIRED = ("inspid", "dnr", "namn", "hdatum", "anmald", "bedomning")


@dataclass(frozen=True)
class NormalizedArea:
    code: str
    group: str
    description: str
    status: str


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
    areas: List[NormalizedArea]
    uncertain: bool
    #: Diarienumret besökaren behöver för att begära ut kontrollrapporten.
    case_number: str


@dataclass(frozen=True)
class NormalizedEstablishment:
    id_national: str
    municipality_code: str
    id_local: str
    name: str
    street_address: Optional[str]
    types: List[str]
    lat: Optional[float]
    lng: Optional[float]


def squeeze(text: Optional[str]) -> str:
    """Ett värde ur filen, med blanksteg normaliserade."""
    return re.sub(r"\s+", " ", text or "").strip()


def local_id(name: str, address: str) -> str:
    """Stabil lokal identitet för en verksamhet.

    Utdraget har inget verksamhets-id. `inspid` är ett GUID per KONTROLL, inte
    per verksamhet, och `dnr` är ett ärendenummer som byter mellan år. Kvar
    finns namn och besöksadress, och den nyckeln är verifierad över hela filen:
    1 022 distinkta par på 4 451 kontroller, med gemener och normaliserade
    blanksteg.

    Gemener är nödvändigt och inte kosmetiskt. Utan casefold blir talet 1 023,
    eftersom en verksamhet står med två stavningar av samma namn. Samma sak
    som Kristinehamns `local_id` gör, och av samma skäl.

    Tjugotvå verksamheter saknar besöksadress. De får en tom sträng i nyckeln,
    vilket är rätt: två olika ställen utan adress som HETER samma sak är en
    krock vi hellre upptäcker än gissar oss förbi, och den finns inte i dagens
    fil.
    """
    if not name:
        raise UnknownSourceValue("Kontroll utan verksamhetsnamn")
    key = f"{name.casefold()}|{address.casefold()}"
    return hashlib.sha1(key.encode("utf-8")).hexdigest()[:12]


def parse(xml: bytes) -> List[ElementTree.Element]:
    """Läs filen och ge kontrolltillfällena i filens egen ordning.

    Rotelementet kontrolleras med flit. En Sitevision-nod som slutat leverera
    XML svarar gärna med HTML och HTTP 200, och då ska hämtningen falla här
    och inte tyst skriva en tom kommun.
    """
    root = ElementTree.fromstring(xml)
    if root.tag != "insps":
        raise UnknownSourceValue(
            f"Rotelementet heter {root.tag!r} och inte 'insps'. "
            "Filen är inte ett Ecos-utdrag längre."
        )
    inspections = [e for e in root if e.tag == "insp"]
    if not inspections:
        raise UnknownSourceValue("Utdraget innehåller noll kontrolltillfällen")
    return inspections


def check_modified(header: Optional[str], expected: str) -> Optional[str]:
    """Jämför filens `Last-Modified` med den vi har antecknat.

    Ett NYARE datum är goda nyheter och ska inte fälla hämtningen, men det ska
    synas: det betyder att kommunen kört exporten igen, vilket är precis det
    begäranbrevet ber om. Returnerar en text att skriva ut, eller None när
    datumet är det väntade.

    Saknas huvudet helt får hämtningen fortsätta. Filens ålder står ändå i
    datafilen, ur `source_modified`, och en mellanliggande cache som strippar
    huvudet är inte ett skäl att utebli med hela kommunen.
    """
    if not header:
        return "saknar Last-Modified, går vidare på antecknat datum"
    try:
        from email.utils import parsedate_to_datetime

        found = parsedate_to_datetime(header).date().isoformat()
    except (TypeError, ValueError):
        return f"oläsbart Last-Modified: {header!r}"
    if found == expected:
        return None
    return f"filen är daterad {found}, inte {expected} som vi antecknat"


def group_by_establishment(inspections: List[ElementTree.Element]) -> List[tuple]:
    """Gruppera kontrolltillfällena per verksamhet.

    Ger `(id_local, namn, besadr, [element])` sorterat på namn, adress och
    identitet. Ordningen är alfabetisk och inte kronologisk med flit:
    `dedupe_slugs` numrerar krockar positionellt, så två ställen med samma namn
    byter URL med varandra så fort ordningen rör sig. En ordning som bygger på
    kontrolldatum rör sig varje gång kommunen kontrollerar något. En som bygger
    på namn och adress gör det aldrig. Se tests/test_slugstabilitet.py.

    Namnet som visas är det som står på den SENASTE kontrollen. Stavningar
    varierar över åren, och den färskaste är den kommunen använder nu.
    """
    grouped: Dict[str, list] = {}
    for element in inspections:
        for field in REQUIRED:
            if not squeeze(element.findtext(field)):
                raise UnknownSourceValue(
                    f"Kontroll utan {field}: {squeeze(element.findtext('inspid'))!r}"
                )
        name = squeeze(element.findtext("namn"))
        address = squeeze(element.findtext("besadr"))
        key = local_id(name, address)
        grouped.setdefault(key, []).append(element)

    out = []
    for key, elements in grouped.items():
        newest = max(elements, key=lambda e: squeeze(e.findtext("hdatum")))
        out.append(
            (
                key,
                squeeze(newest.findtext("namn")),
                squeeze(newest.findtext("besadr")),
                elements,
            )
        )
    return sorted(out, key=lambda row: (row[1].casefold(), row[2].casefold(), row[0]))


def normalize_establishment(
    municipality: EcosMunicipality, id_local: str, name: str, address: str
) -> NormalizedEstablishment:
    return NormalizedEstablishment(
        id_national=f"F-{municipality.code}-{id_local}",
        municipality_code=municipality.code,
        id_local=id_local,
        name=name,
        # Tjugotvå verksamheter saknar adress. Fältet lämnas tomt i stället för
        # att fyllas med något som ser ut som en uppgift vi har.
        street_address=address or None,
        # Utdraget bär ingen verksamhetstyp. Se modulens inledning.
        types=[],
        lat=None,
        lng=None,
    )


def normalize_areas(element: ElementTree.Element) -> tuple:
    """Kontrollpunkterna, och beskedet om någon var oläsbar.

    Ger `(punkter, oläsbara)`. Fyra av 25 083 punkter har TOM status, alltså
    ett fält kommunen aldrig fyllde i. De fyra sitter på var sin kontroll, i
    Vrinnevisjukhuset, Gustav Adolf Skolan, Söderköpings Bageri och Scandic
    Norrköping Nord.

    En tom status får aldrig läsas som `ok`. Det är precis det fel
    `UnknownSourceValue` finns för att förhindra. Men att kasta hela
    kontrolltillfället vore att kasta kommunens EGEN bedömning, som står i
    `bedomning` och inte i punkterna, och den är det bärande i posten.

    Anroparen får därför beskedet och släcker hela punktlistan för den
    kontrollen, se `normalize_inspection`.
    """
    areas, unreadable = [], 0
    for control in element.iter("kontroll"):
        status = squeeze(control.findtext("status"))
        if not status:
            unreadable += 1
            continue
        if status not in AREA_STATUSES:
            raise UnknownSourceValue(f"Okänd kontrollpunktsstatus {status!r}")
        areas.append(
            NormalizedArea(
                # Utdraget bär inget rapporteringspunktsnummer. Området går
                # ändå att avgöra: `chklistrubrik_text` är Livsmedelsverkets
                # egna områdesnamn, och alla tolv som förekommer står i
                # AREA_LETTER_BY_NAME i grading.py. Se `area_letter`.
                code="",
                group=squeeze(control.findtext("chklistrubrik_text")),
                description=squeeze(control.findtext("kontrollpunkt")),
                status=AREA_STATUSES[status],
            )
        )
    return areas, unreadable


def normalize_inspection(
    municipality: EcosMunicipality,
    element: ElementTree.Element,
    establishment_id: str,
) -> NormalizedInspection:
    """Ett kontrolltillfälle."""
    assessment = squeeze(element.findtext("bedomning"))
    if assessment not in ASSESSMENTS:
        raise UnknownSourceValue(f"Okänd bedömning {assessment!r}")

    announced = squeeze(element.findtext("anmald"))
    if announced not in PRENOTIFIED:
        raise UnknownSourceValue(f"Okänt förhandsbesked {announced!r}")

    raw_date = squeeze(element.findtext("hdatum"))
    try:
        inspected_at = date.fromisoformat(raw_date)
    except ValueError as exc:
        raise UnknownSourceValue(f"Oläsbart kontrolldatum {raw_date!r}") from exc

    areas, unreadable = normalize_areas(element)
    if unreadable:
        # HELA punktlistan släcks, inte bara den oläsbara raden.
        #
        # Skälet står i grading.py version 4: viktningen av rent
        # administrativa avvikelser får bara MILDRA, och bara när hela
        # underlaget är synligt. Med en punkt bortplockad vet vi inte om den
        # bar en avvikelse i ett konsumentnära område, och en halv lista kunde
        # då mildra en bedömning som skulle stått kvar. En tom lista bedöms som
        # i version 3, vilket är det säkra utfallet.
        #
        # Kommunens egen bedömning står kvar oförändrad. Den kommer ur
        # `bedomning` och inte ur punkterna.
        areas = []

    return NormalizedInspection(
        # Ecos eget GUID per kontrolltillfälle. Verifierat unikt över hela
        # filen, 4 451 av 4 451, och stabilt mellan körningar.
        id_national=f"I-{municipality.code}-{squeeze(element.findtext('inspid'))}",
        establishment_id=establishment_id,
        inspected_at=inspected_at,
        assessment=ASSESSMENTS[assessment],
        # Utdraget skiljer inte planerad kontroll från återbesök. Se modulens
        # inledning för vad det kostar i bedömningen.
        type=ROUTINE,
        prenotified=PRENOTIFIED[announced],
        # Kommunen redovisar aldrig en revision, och varje post är ett besök.
        audit=False,
        on_site=True,
        areas=areas,
        uncertain=bool(unreadable),
        case_number=squeeze(element.findtext("dnr")),
    )


def normalize_inspections(
    municipality: EcosMunicipality,
    elements: List[ElementTree.Element],
    establishment_id: str,
) -> List[NormalizedInspection]:
    """Verksamhetens kontroller, nyast först.

    Två kontroller samma dag slås ihop med det SÄMRE resultatet som utfall,
    samma regel som i Linköping, Jönköping och Kristinehamn. Punktlistorna
    läggs ihop, eftersom de beskriver olika delar av samma dags kontroll.
    """
    merged: Dict[date, NormalizedInspection] = {}
    for element in elements:
        inspection = normalize_inspection(municipality, element, establishment_id)
        current = merged.get(inspection.inspected_at)
        if current is None:
            merged[inspection.inspected_at] = inspection
            continue
        merged[inspection.inspected_at] = NormalizedInspection(
            # Det sämre utfallet vinner, och dess id följer med, så att
            # `based_on` i bedömningen pekar på en kontroll som finns.
            id_national=(
                inspection.id_national
                if inspection.assessment > current.assessment
                else current.id_national
            ),
            establishment_id=establishment_id,
            inspected_at=inspection.inspected_at,
            assessment=max(current.assessment, inspection.assessment),
            type=ROUTINE,
            # Anmäld och oanmäld samma dag: uppgiften är inte längre entydig.
            prenotified=(
                current.prenotified
                if current.prenotified == inspection.prenotified
                else None
            ),
            audit=False,
            on_site=True,
            # Samma regel som i `normalize_inspection`: är någon av de två
            # ofullständig släcks listan helt, så att en halv lista aldrig kan
            # mildra en bedömning.
            areas=(
                []
                if (current.uncertain or inspection.uncertain)
                else current.areas + inspection.areas
            ),
            uncertain=current.uncertain or inspection.uncertain,
            case_number=current.case_number or inspection.case_number,
        )

    return sorted(merged.values(), key=lambda i: i.inspected_at, reverse=True)
