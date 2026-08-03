"""Inläsare för Uppsala kommun.

Uppsala driver sin egen Livsmedelskollen direkt på uppsala.se. Listan renderas
inte i sidan utan hämtas av deras egen modul (`uppsala.foodaudit-filter.min.js`)
med ett AJAX-anrop till samma URL plus `ajax=1`. Vi anropar samma sak.

    GET .../livsmedelskollen/?ajax=1&query=&page=N   10 poster per sida
    GET .../livsmedelskollen/Details?id=ID           full historik

Fjärde källan, fjärde formatet — HTML den här gången, inte JSON. Det bekräftar
mönstret: varje kommun kräver en egen adapter.

Datakvaliteten är däremot den bästa hittills. Uppsala har ett eget värde för
"Avvikelse kvarstår", precis som Linköping men till skillnad från Stockholm,
och kontrollområdena är lika detaljerade som Linköpings. De anger dessutom
diarienummer per kontroll.

SAKNAS: koordinater. Uppsala publicerar inga. Adaptern lämnar därför lat/lng
tomma — den ljuger inte ihop en punkt. Kartnålen sätts i ett eget, senare steg
(pipeline/geocode.py) som härleder koordinaten ur adressen och märker den som
härledd. Allt annat — namn, adress, omdöme, historik, kontrollområden — finns.
Att sakna karta är ingen anledning att utelämna en verksamhet.
"""

from __future__ import annotations

import html
import re
from dataclasses import dataclass
from datetime import date
from typing import Optional

from ..grading import COMPLAINT, FOLLOWUP, MAJOR_REMARKS, MINOR_REMARKS, NO_REMARKS, ROUTINE

MUNICIPALITY_CODE = "0380"  # Uppsala, SCB REGINA
MUNICIPALITY_NAME = "Uppsala kommun"
MUNICIPALITY_CITY = "Uppsala"

BASE = (
    "https://www.uppsala.se/foretag-och-naringsliv/tillstand-regler-och-tillsyn"
    "/livsmedelskollen"
)
PER_PAGE = 10

# ---------------------------------------------------------------------------
# Värdeöversättning
#
# Uträknat genom att sampla listsidor, inte gissat.
# ---------------------------------------------------------------------------

ASSESSMENT_MAP = {
    "Utan avvikelse": NO_REMARKS,
    "Avvikelse åtgärdad": NO_REMARKS,      # tidigare brist är avhjälpt
    "Avvikelse": MINOR_REMARKS,
    "Avvikelse kvarstår": MAJOR_REMARKS,   # Uppsala säger det själva
}

REASON_MAP = {
    "Planerad kontroll": ROUTINE,
    "Uppföljning av tidigare avvikelse": FOLLOWUP,
    "Uppföljande kontroll": FOLLOWUP,
    "Händelsestyrd kontroll": COMPLAINT,
    "Klagomål": COMPLAINT,
    "Registrering": ROUTINE,
    "Annan kontroll": ROUTINE,
}


class UnknownSourceValue(Exception):
    """Källan levererade ett värde vi inte känner igen.

    Får aldrig hanteras med ett default. Vi publicerar omdömen om namngivna
    verksamheter; ett okänt värde som tyst tolkas som godkänt förstör
    förtroendet.
    """


@dataclass(frozen=True)
class ControlArea:
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
    areas: list
    uncertain: bool


@dataclass(frozen=True)
class NormalizedEstablishment:
    id_national: str
    municipality_code: str
    id_local: str
    name: str
    street_address: Optional[str]
    types: list
    lat: Optional[float]
    lng: Optional[float]


def _text(fragment: str) -> str:
    """Ta bort taggar och avkoda entiteter."""
    return html.unescape(re.sub(r"<[^>]+>", " ", fragment))


def _clean(value: str) -> str:
    return " ".join(_text(value).split())


def parse_list_page(markup: str) -> list:
    """Plocka ut (id, namn, adress) ur ett listfragment."""
    out = []
    for match in re.finditer(r'<li class="inspection[a-z-]*">(.*?)</li>', markup, re.S):
        body = match.group(1)
        ident = re.search(r"Details\?id=(-?\d+)", body)  # id kan vara negativa
        name = re.search(r"<h3><a[^>]*>(.*?)</a></h3>", body, re.S)
        if not ident or not name:
            continue
        paragraphs = re.findall(r"<p>(.*?)</p>", body, re.S)
        address = _clean(paragraphs[0]) if paragraphs else None
        out.append(
            {
                "id": ident.group(1),
                "name": _clean(name.group(1)),
                "address": address or None,
            }
        )
    return out


def total_hits(markup: str) -> Optional[int]:
    """Antalet verksamheter, som Uppsala själva anger överst i listan."""
    match = re.search(r'<span class="count">(\d+)</span>', markup)
    return int(match.group(1)) if match else None


def normalize_establishment(record: dict, detail: str = "") -> NormalizedEstablishment:
    verksamhet = re.search(r"<dt>Verksamhet:</dt>\s*<dd>(.*?)</dd>", detail, re.S)
    address = re.search(r"<dt>Adress:</dt>\s*<dd>(.*?)</dd>", detail, re.S)

    return NormalizedEstablishment(
        id_national=f"F-{MUNICIPALITY_CODE}-{record['id']}",
        municipality_code=MUNICIPALITY_CODE,
        id_local=record["id"],
        name=record["name"],
        street_address=(_clean(address.group(1)) if address else record.get("address")) or None,
        types=[_clean(verksamhet.group(1))] if verksamhet else [],
        # Uppsala publicerar inga koordinater. Se pipeline/geocode.py.
        lat=None,
        lng=None,
    )


def normalize_inspections(detail: str, establishment_id: str, local_id: str) -> list:
    """Plocka ut hela kontrollhistoriken ur en detaljsida."""
    out = []
    blocks = re.findall(r'<li class="inspection[a-z-]*">(.*?)</li>', detail, re.S)

    for index, block in enumerate(blocks):
        when = re.search(r'<time datetime="(\d{4}-\d{2}-\d{2})"', block)
        verdict = re.search(r'<dt class="review">Omdöme:</dt>\s*<dd>(.*?)</dd>', block, re.S)
        if not when or not verdict:
            continue

        verdict_text = _clean(verdict.group(1))
        if verdict_text not in ASSESSMENT_MAP:
            raise UnknownSourceValue(
                f"Okänt omdöme {verdict_text!r} för {establishment_id}"
            )

        reason = re.search(r"<dt>Anledning till kontroll:</dt>\s*<dd>(.*?)</dd>", block, re.S)
        reason_text = _clean(reason.group(1)) if reason else ""
        if reason_text and reason_text not in REASON_MAP:
            raise UnknownSourceValue(
                f"Okänd anledning {reason_text!r} för {establishment_id}"
            )

        kind = re.search(r"<dt>Typ av kontroll:</dt>\s*<dd>(.*?)</dd>", block, re.S)
        kind_text = _clean(kind.group(1)).lower() if kind else ""

        # Avvikelser listas som "Avvikelser: <område> <beskrivning>".
        # Avvikelser ligger nästlade: lagstiftningsområdet i en länk, de
        # enskilda punkterna i en inre lista under den.
        #   <li class="addPlus"><a>Särskild märkning</a>
        #     <div class="exception-content"><ul><li>Punkt…</li></ul>
        areas = []
        status = "persisting" if "kvarstår" in verdict_text.lower() else "deviation"
        for group_match in re.finditer(
            r'<li class="addPlus">\s*<a[^>]*>(.*?)</a>(.*?)(?=<li class="addPlus"|\Z)',
            block,
            re.S,
        ):
            group_name = _clean(group_match.group(1))
            points = re.findall(r"<li>(.*?)</li>", group_match.group(2), re.S)
            for point in points:
                text = _clean(point)
                if text:
                    areas.append(
                        ControlArea(code="", group=group_name, description=text, status=status)
                    )
            if not points and group_name:
                areas.append(
                    ControlArea(code="", group=group_name, description=group_name, status=status)
                )

        out.append(
            NormalizedInspection(
                id_national=f"I-{MUNICIPALITY_CODE}-{local_id}-{index}",
                establishment_id=establishment_id,
                inspected_at=date.fromisoformat(when.group(1)),
                assessment=ASSESSMENT_MAP[verdict_text],
                type=REASON_MAP.get(reason_text, ROUTINE),
                prenotified=False if kind_text == "oanmäld" else (True if kind_text else None),
                audit=False,
                on_site=True,
                areas=areas,
                uncertain=False,
            )
        )

    return out
