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

## Varför historiken ger en utmärkelse, inte ett betygssteg

Med tre nivåer hamnar ungefär två tredjedelar av beståndet på den bästa. För
att ändå skilja de genomgående skötsamma används historiken till en separat
utmärkelse — samma idé som Danmarks Elite-Smiley. Historiken påverkar alltså
aldrig hur allvarligt något bedöms, bara om verksamheten förtjänar ett
erkännande. Nuläget avgör bedömningen; historiken avgör utmärkelsen.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import List, Optional, Sequence

MODEL_VERSION = 2

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


@dataclass(frozen=True)
class Inspection:
    """En kontroll, normaliserad från källans format."""

    id_national: str
    inspected_at: date
    assessment: int
    type: int = ROUTINE


@dataclass(frozen=True)
class Assessment:
    """Utfallet. `verdict is None` betyder otillräckligt underlag."""

    verdict: Optional[str]
    #: Genomgående utan anmärkningar vid alla kontroller i fönstret.
    distinction: bool
    reason: str
    model_version: int
    based_on: List[str]

    @property
    def publishable(self) -> bool:
        """Styr kvalitetsgrinden: sidor utan bedömning no-indexeras."""
        return self.verdict is not None


def assess(
    inspections: Sequence[Inspection],
    today: date,
) -> Assessment:
    """Bedöm hygienen för en anläggning.

    Senaste kontrollen avgör nivån:

        inga anmärkningar   -> clean
        mindre anmärkningar -> minor
        allvarliga          -> major

    Utmärkelsen ges när samtliga kontroller i fönstret — minst tre stycken —
    är utan anmärkning. Den kan aldrig höja eller sänka nivån.
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
