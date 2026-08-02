"""Prikkos betygsmodell.

Det här är produktens kärna och dess juridiska exponering i samma funktion.
Betyget är INTE kommunens bedömning — det är vår, härledd ur kommunens data.
Därför gäller tre regler för den här modulen:

1. Den är en ren funktion. Inga databasanrop, ingen I/O, ingen klocka som
   läses internt (`today` skickas in). Då går den att testa uttömmande.
2. Den är versionerad. `MODEL_VERSION` sparas tillsammans med varje betyg, så
   att vi i efterhand kan säga exakt hur ett publicerat betyg räknades fram.
3. Den vägrar gissa. Otillräckligt eller för gammalt underlag ger inget betyg
   alls — aldrig ett dåligt betyg. Ett gissat E på en restaurang som åtgärdade
   sina brister för fem år sedan är både orättvist och den mest berättigade
   klagomålsgrund någon kan ha mot oss.

Modellen i en mening, som den ska stå på metodiksidan:
    Senaste kontrollen avgör betyget, historiken justerar det ett steg.

Bygger på fältet `assessment` (inspektörens egen sammanvägda bedömning i tre
steg), inte på enskilda kontrollpunkter. Se research/R1_sambruk_datamodell.md
för varför: `assessment` är ovillkorligt obligatoriskt i Sambruk-specen medan
kontrollpunkterna bara publiceras ibland, och att återge myndighetens egen
slutsats står starkare än att göra en egen tolkning av punktkoder.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import List, Optional, Sequence

MODEL_VERSION = 1

# Livsmedelsverkets kontroller sprids normalt över en treårscykel. Är senaste
# kontrollen äldre än så säger den inget om nuläget.
FRESHNESS_WINDOW_DAYS = 3 * 365

# Hur många kontroller som väger in. Tre är Danmarks Smiley-praxis och räcker
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


@dataclass(frozen=True)
class Inspection:
    """En kontroll, normaliserad från Sambruk-formatet."""

    id_national: str
    inspected_at: date
    assessment: int
    type: int = ROUTINE


@dataclass(frozen=True)
class GradeResult:
    """Utfallet. `grade is None` betyder otillräckligt underlag, inte dåligt."""

    grade: Optional[str]
    reason: str
    model_version: int
    based_on: List[str]

    @property
    def publishable(self) -> bool:
        """Styr kvalitetsgrinden: sidor utan betyg no-indexeras."""
        return self.grade is not None


# Skälstexter. Exponeras i API och på sidan — håll dem begripliga för en
# besökare, inte bara för oss.
REASON_NO_INSPECTIONS = "no_inspections"
REASON_STALE = "stale_inspections"
REASON_GRADED = "graded"


def calculate_grade(
    inspections: Sequence[Inspection],
    today: date,
) -> GradeResult:
    """Räkna fram hygienbetyget för en anläggning.

    Trappan, given senaste kontrollens bedömning och om det finns anmärkningar
    tidigare i historiken:

        senaste = inga anmärkningar   + ren historik      -> A
        senaste = inga anmärkningar   + anmärkning förut  -> B
        senaste = mindre anmärkningar + ren historik      -> C
        senaste = mindre anmärkningar + anmärkning förut  -> D
        senaste = allvarliga anmärkningar                 -> E

    En uppföljningskontroll som är ren efter allvarliga brister lyfter alltså
    betyget — men bara till B, aldrig till A, eftersom historiken finns kvar.
    Det är avsiktligt: den som åtgärdat ska belönas, men inte som om inget hänt.

    Allvarliga anmärkningar vid senaste kontrollen ger alltid E. Historiken kan
    inte mildra det, för det är nuläget som är relevant för någon som står
    utanför och funderar på att gå in.
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
        return GradeResult(
            grade=None,
            reason=REASON_STALE if had_any else REASON_NO_INSPECTIONS,
            model_version=MODEL_VERSION,
            based_on=[],
        )

    latest = recent[0]
    history = recent[1:]
    based_on = [i.id_national for i in recent]

    if latest.assessment >= MAJOR_REMARKS:
        grade = "E"
    else:
        blemished_history = any(i.assessment > NO_REMARKS for i in history)
        if latest.assessment == NO_REMARKS:
            grade = "B" if blemished_history else "A"
        else:
            grade = "D" if blemished_history else "C"

    return GradeResult(
        grade=grade,
        reason=REASON_GRADED,
        model_version=MODEL_VERSION,
        based_on=based_on,
    )
