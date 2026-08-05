"""Prikkos hygienbedömning.

Det här är produktens kärna och dess juridiska exponering i samma funktion.
Bedömningen är INTE kommunens — den är vår, härledd ur kommunens data. Därför
gäller tre regler för den här modulen:

1. Den är en ren funktion. Inga databasanrop, ingen I/O, ingen klocka som läses
   internt (`today` skickas in). Då går den att testa uttömmande.
2. Den är versionerad. `MODEL_VERSION` sparas med varje bedömning, så att ett
   publicerat omdöme går att härleda i efterhand.
3. Den vägrar gissa. Otillräckligt eller för gammalt underlag ger ingen
   bedömning alls — aldrig en dålig. Ett påstått "allvarliga brister" på en
   restaurang som åtgärdade allt för fem år sedan är både orättvist och den
   mest berättigade klagomålsgrund någon kan ha mot oss.

## Varför tre nivåer och inte en bokstavsskala

Källdatan har tre nivåer. Sambruk/NSÖD-specens `assessment` är 0 = inga
anmärkningar, 1 = mindre, 2 = allvarliga, och Linköpings faktiska värden
faller i samma tre grader av allvar. En femgradig bokstavsskala hade krävt att
vi uppfann precision som datan inte innehåller — svagt redaktionellt, och
svagare juridiskt, eftersom varje steg bort från myndighetens egen formulering
är ett påstående vi själva måste försvara.

En bokstavsskala vore dessutom direkt vilseledande i Sverige: skolbetygen är
A–F där E är det lägsta *godkända* betyget. Ett "E" för allvarliga brister
läses som "godkänt, nätt och jämnt".

Norge kom till tre nivåer av samma skäl. Danmark har fyra för att deras egen
kontrollskala har fyra utfall — inte för att fyra är bättre.

## Varför allvarsgraden härleds ur mönstret, inte ur etiketten

Kommunerna använder olika ord för samma verklighet. Linköping har ett eget
värde för "Kvarstår" när en avvikelse inte åtgärdats vid uppföljning.
Stockholm har inget sådant värde alls — deras skala slutar vid "Med
avvikelser", vilket i praktiken gör den tvågradig.

Läser vi bara etiketten blir följden orimlig: ingen verksamhet i Stockholm
kan någonsin hamna på den allvarligaste nivån, hur illa det än är, medan en
verksamhet i Linköping kan det. Då går städerna inte att jämföra, och
jämförbarheten är hela produktlöftet.

Lösningen är att bedöma vad som faktiskt hände i stället för vad kommunen
råkade kalla det. En avvikelse som ÖVERLEVT ett återbesök, eller som
upprepas från föregående kontroll, är en kvarstående avvikelse oavsett
kommun. Mönstret finns i alla källor; etiketterna kommer aldrig att stämma
överens.

Uppmätt effekt (2026-08-02): Stockholm gick från 0 till 187 kvarstående av
776 avvikelser. Linköping från 8 till 12 av 100 — alltså de explicit märkta
plus fyra som etiketten missade.

**Kalibrering krävs.** Stockholm hamnar på 24 % kvarstående och Linköping på
12 %. Det kan spegla verklig skillnad i hygien, men lika gärna att Stockholm
gör fler återbesök. Skillnaden ska följas när fler kommuner tillkommer — vi
får inte råka återinföra just det likvärdighetsproblem vi finns till för att
lösa.

## Varför historiken ger ett erkännande, inte ett betygssteg

Med tre nivåer hamnar ungefär två tredjedelar av beståndet på den bästa. För
att ändå skilja de genomgående skötsamma används historiken till ett separat
erkännande, samma idé som Danmarks Elite-Smiley. Historiken påverkar alltså
aldrig hur allvarligt något bedöms, bara om verksamheten förtjänar ett
erkännande. Nuläget avgör bedömningen; historiken avgör erkännandet.

## `distinction` är MÄRKNINGEN, inte utmärkelsen

Fältet heter `distinction` men bär den lägre av två ribbor, och de två blandades
ihop i text fram till augusti 2026:

    REN HISTORIK   Det här fältet. HISTORY_DEPTH kontroller inom
                   FRESHNESS_WINDOW_DAYS, samtliga utan anmärkning. Visas som en
                   märkning på verksamhetens sida och räknas om vid varje
                   hämtning. Den försvinner samma dag kommunen noterar en
                   avvikelse.

    UTMÄRKELSEN    Årsutgåvan och märket med årtal. Fem kontroller I RAD utan
                   anmärkning, utan tidsfönster, hos en verksamhet som har en
                   bedömning. Räknas INTE här utan i site/scripts/utmarkelser.mjs
                   och fryses en gång om året.

Fältnamnet står kvar för att det går genom tolv hämtmoduler, databasschemat och
sajtens datafiler. Namnet i koden är ett annat problem än namnet i texten, och
det var bara det senare läsaren mötte.

Utmärkelsens ribba får aldrig flyttas hit. Den skulle då bli omöjlig att nå i
åtta av tolv kommuner, eftersom deras register inte är fem kontroller djupa, och
verksamhetssidan skulle tappa sin enda positiva signal i större delen av landet.
Att de två ribborna skiljer sig är avsikten, inte en glidning.

## Version 4: rent administrativa avvikelser skärps aldrig

En saknad registrering är inte smuts i beredningen, men till och med version 3
behandlade dem lika: en administrativ anmärkning som noterades vid ett
återbesök, eller som upprepades, skärptes till "Brister som kvarstår" precis
som en hygienbrist. Det är inte vad en besökare menar med kvarstående brister.

Grunden är Livsmedelsverkets egen indelning. Varje kontrollpunkt hör till ett
LAGSTIFTNINGSOMRÅDE, betecknat med bokstaven i rapporteringspunkten (J03 hör
till J), enligt Kontrollwiki:
https://kontrollwiki.livsmedelsverket.se/artikel/236/lagstiftningsomraden

Sex områden räknas som rent administrativa: A Administrativa krav
(registrering och godkännande), D Skyddade beteckningar, E Handelsnormer,
F Varustandarder, H Spårbarhet (journalföring av leverantörer) och M Handel
inom EU, import och export. Regeln: när SAMTLIGA avvikelser vid den senaste
kontrollen ligger i de områdena utlöser mönstret ingen skärpning — nivån
stannar på "Brister". Ingenting döljs: avvikelserna visas som förut, och
kommunens egen bedömning står alltid. Skärps gör bara det vi själva härleder.

Tre områden är MED AVSIKT inte administrativa, fast de kan låta så:

- B Allmän livsmedelsinformation. Märkning låter som pappersarbete, men
  B omfattar allergeninformation, och fel där skadar människor.
- C Särskild märkning. Omfattar bland annat glutenfritt — samma skäl.
- K HACCP-baserade förfaranden. Egenkontrollens pappersdel bor här, men det
  gör också mikrobiologiska kriterier, och vi kan inte skilja en oskriven
  faroanalys från ett provsvar med fynd.

I tveksamma fall väger vi alltså INTE ner. En rad utan känt område räknas som
konsumentnära, och en kontroll helt utan redovisade kontrollpunkter (sex av
tolv kommuner lämnar inga) bedöms som i version 3. Viktningen kan därför bara
mildra en bedömning, aldrig försämra en — det är avsiktligt och ska förbli så.

Viktningen läser bara den SENASTE kontrollens rader. Att kräva att även den
föregående kontrollens avvikelser var konsumentnära vore ett starkare
påstående om vad som "upprepats" än datan bär: samma område betyder inte samma
brist, och olika områden betyder inte olika.

Uppmätt effekt (2026-08-04, hela beståndet): 8 verksamheter mildras från
"Brister som kvarstår" till "Brister" — 6 i Stockholm, 2 i Örebro. Ingen
verksamhet får en sämre bedömning. Metodiksidan beskriver samma regel utåt
och måste ändras i samma commit som det här talet.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import List, Optional, Sequence, Tuple

MODEL_VERSION = 4

# Livsmedelsverkets kontroller sprids normalt över en treårscykel. Är senaste
# kontrollen äldre än så säger den inget om nuläget.
FRESHNESS_WINDOW_DAYS = 3 * 365

# Hur många kontroller som vägs in. Tre är Danmarks Smiley-praxis och räcker
# för att skilja engångsmiss från mönster.
HISTORY_DEPTH = 3

# assessment enligt Sambruk-specen
NO_REMARKS = 0
MINOR_REMARKS = 1
MAJOR_REMARKS = 2

# type enligt Sambruk-specen
ROUTINE = 0
FOLLOWUP = 1
COMPLAINT = 2

# Bedömningsnivåer. Speglar källans tre steg ett till ett.
CLEAN = "clean"
MINOR = "minor"
MAJOR = "major"

_VERDICT_BY_ASSESSMENT = {
    NO_REMARKS: CLEAN,
    MINOR_REMARKS: MINOR,
    MAJOR_REMARKS: MAJOR,
}

# Skälstexter. Exponeras i API och på sidan — håll dem begripliga för en
# besökare, inte bara för oss.
REASON_NO_INSPECTIONS = "no_inspections"
REASON_STALE = "stale_inspections"
REASON_ASSESSED = "assessed"

# Kontrollpunktens status, normaliserad i källmodulerna. Bara de två första
# är en brist; "fixed" och "ok" är motsatsen.
AREA_REMARK_STATUSES = frozenset({"deviation", "persisting"})

#: Lagstiftningsområden som är rent administrativa, per bokstaven i
#: Livsmedelsverkets rapporteringspunkt. Se modulens inledning för varför
#: just de här sex, och varför B, C och K uttryckligen INTE ingår.
ADMINISTRATIVE_AREAS = frozenset("ADEFHM")

#: Områdesnamn -> bokstav, för källor som inte lämnar någon kod. Uppsala
#: skriver Livsmedelsverkets egna områdesnamn, Lomma och Stockholm sina egna
#: ord. Nyckeln är gemener. Ett namn som inte står här klassas som
#: konsumentnära — okänt får aldrig mildra en bedömning.
AREA_LETTER_BY_NAME = {
    "administrativa krav": "A",
    "administration": "A",
    "allmän livsmedelsinformation": "B",
    "information om livsmedel": "B",
    "livsmedelsinformation": "B",
    "märkning": "B",
    "särskild märkning och information": "C",
    "specialinformation": "C",
    "skyddade beteckningar": "D",
    "handelsnormer": "E",
    "varustandarder": "F",
    "livsmedel för särskilda grupper": "G",
    "spårbarhet": "H",
    "särskilda ingredienser och processhjälpmedel": "I",
    "grundförutsättningar, hygien": "J",
    "hygien": "J",
    "haccp-baserade förfaranden": "K",
    "riskhantering": "K",
    "faroanalys": "K",
    "handel inom eu, import och export": "M",
    "internationell handel": "M",
    "dricksvattenanläggningar": "N",
    "övrigt": "O",
    "operativa mål": "P",
    "kontaktmaterial": "Q",
    "kontaktmaterial - tillverkning, förädling och distribution": "Q",
}


@dataclass(frozen=True)
class Area:
    """En kontrollpunkt inom en kontroll, normaliserad från källans format."""

    #: Livsmedelsverkets rapporteringspunkt, t.ex. "J03". Tom när källan
    #: inte lämnar någon (Uppsala, Lomma).
    code: str
    group: str
    description: str
    #: "ok", "fixed", "deviation" eller "persisting".
    status: str


def area_letter(area: Area) -> Optional[str]:
    """Lagstiftningsområdets bokstav, eller None när den inte går att avgöra.

    Koden är sanningen när den finns. Utan kod slås gruppnamnet och därefter
    beskrivningen upp — Uppsala och Lomma lämnar bara namn.
    """
    code = area.code.strip()
    if code and code[0].isalpha():
        return code[0].upper()
    for name in (area.group, area.description):
        letter = AREA_LETTER_BY_NAME.get(name.strip().lower())
        if letter:
            return letter
    return None


@dataclass(frozen=True)
class Inspection:
    """En kontroll, normaliserad från källans format."""

    id_national: str
    inspected_at: date
    assessment: int
    type: int = ROUTINE
    #: Kontrollpunkterna, när källan redovisar dem. Tom betyder okänt, inte
    #: felfritt — sex av tolv kommuner lämnar inga alls.
    areas: Tuple[Area, ...] = ()


@dataclass(frozen=True)
class Assessment:
    """Utfallet. `verdict is None` betyder otillräckligt underlag."""

    verdict: Optional[str]
    #: Märkningen "ren historik": utan anmärkning vid alla kontroller i
    #: fönstret, minst HISTORY_DEPTH stycken. Inte årsutgåvans utmärkelse,
    #: se modulens inledning.
    distinction: bool
    reason: str
    model_version: int
    based_on: List[str]

    @property
    def publishable(self) -> bool:
        """Styr kvalitetsgrinden: sidor utan bedömning no-indexeras."""
        return self.verdict is not None


def _is_persisting(recent: Sequence[Inspection]) -> bool:
    """Har avvikelsen överlevt en uppföljning?

    Två oberoende tecken, båda hämtade ur källdata som alla kommuner har:

    1. Den senaste kontrollen ÄR ett återbesök och hittade ändå avvikelser.
       Kommunen kom tillbaka för att kontrollera åtgärden, och den räckte inte.
    2. Föregående kontroll hade också avvikelser. Problemet upprepas.
    """
    latest = recent[0]
    if latest.type == FOLLOWUP:
        return True
    return len(recent) > 1 and recent[1].assessment > NO_REMARKS


def _purely_administrative(latest: Inspection) -> bool:
    """Är varenda avvikelse vid kontrollen rent administrativ?

    Falskt så fort något är okänt: en kontroll utan redovisade kontrollpunkter,
    eller en rad vars lagstiftningsområde inte går att avgöra, ska bedömas som
    i version 3. Viktningen får bara mildra när hela underlaget är synligt.
    """
    remarks = [a for a in latest.areas if a.status in AREA_REMARK_STATUSES]
    if not remarks:
        return False
    return all(area_letter(a) in ADMINISTRATIVE_AREAS for a in remarks)


def assess(
    inspections: Sequence[Inspection],
    today: date,
) -> Assessment:
    """Bedöm hygienen för en anläggning.

    Senaste kontrollen avgör nivån:

        inga anmärkningar   -> clean
        mindre anmärkningar -> minor
        allvarliga          -> major

    En mindre anmärkning skärps till allvarlig när den visat sig kvarstå:
    antingen hittades den vid ett återbesök, eller så fanns den redan vid
    föregående kontroll. Skärpningen uteblir när samtliga avvikelser vid den
    senaste kontrollen ligger i rent administrativa lagstiftningsområden —
    se modulens inledning om version 4.

    Märkningen "ren historik" ges när samtliga kontroller i fönstret, minst
    HISTORY_DEPTH stycken, är utan anmärkning. Den kan aldrig höja eller sänka
    nivån. Årsutgåvans utmärkelse har en högre ribba och räknas inte här; se
    modulens inledning.
    """
    window_start = date.fromordinal(today.toordinal() - FRESHNESS_WINDOW_DAYS)

    recent = sorted(
        (i for i in inspections if window_start <= i.inspected_at <= today),
        key=lambda i: i.inspected_at,
        reverse=True,
    )[:HISTORY_DEPTH]

    if not recent:
        # Skilj på "aldrig kontrollerad" och "kontrollerad men för länge sedan".
        # Besökaren har rätt att veta vilket det är.
        had_any = any(i.inspected_at <= today for i in inspections)
        return Assessment(
            verdict=None,
            distinction=False,
            reason=REASON_STALE if had_any else REASON_NO_INSPECTIONS,
            model_version=MODEL_VERSION,
            based_on=[],
        )

    latest = recent[0]
    verdict = _VERDICT_BY_ASSESSMENT[latest.assessment]

    # Härledd allvarsgrad. En avvikelse som överlevt ett återbesök, eller som
    # upprepas från föregående kontroll, räknas som kvarstående — även när
    # kommunen saknar ord för det. Men bara när något av det som avviker är
    # konsumentnära: rent administrativa avvikelser skärps aldrig, och
    # kommunens egen tvåa rörs inte alls av det här blocket. Se inledningen.
    if verdict == MINOR and _is_persisting(recent) and not _purely_administrative(latest):
        verdict = MAJOR

    distinction = (
        len(recent) >= HISTORY_DEPTH
        and all(i.assessment == NO_REMARKS for i in recent)
    )

    return Assessment(
        verdict=verdict,
        distinction=distinction,
        reason=REASON_ASSESSED,
        model_version=MODEL_VERSION,
        based_on=[i.id_national for i in recent],
    )
