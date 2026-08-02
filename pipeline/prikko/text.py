"""Textnormalisering som delas mellan källor."""

from __future__ import annotations

import re
import unicodedata

# Translittereras explicit. Låter man Unicode-normalisering stryka dem blir
# "Kött" till "ktt" i stället för "kott".
_SWEDISH = {"å": "a", "ä": "a", "ö": "o", "é": "e", "è": "e", "ü": "u", "ø": "o", "æ": "a"}


def slugify(name: str) -> str:
    """URL-segment ur ett verksamhetsnamn.

    Rena ASCII-slugar håller URL:erna läsbara i sökresultat och delningar.
    """
    lowered = name.lower()
    for char, replacement in _SWEDISH.items():
        lowered = lowered.replace(char, replacement)
    ascii_only = (
        unicodedata.normalize("NFKD", lowered)
        .encode("ascii", "ignore")
        .decode("ascii")
    )
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_only).strip("-")
    return re.sub(r"-{2,}", "-", slug) or "namnlos"


def dedupe_slugs(records: list, key: str = "slug") -> None:
    """Suffixa kollisioner på plats, så varje URL blir unik och stabil.

    Två verksamheter kan heta likadant, och gör det ofta — kedjor med flera
    adresser i samma kommun.
    """
    taken: set = set()
    for record in records:
        base = record[key]
        candidate = base
        suffix = 1
        # Räkna upp tills sluggen är ledig. Att bara suffixa efter antal
        # räcker inte: en verksamhet kan HETA "Joe The Juice 2", vilket ger
        # den naturliga sluggen "joe-the-juice-2" och krockar med den
        # numrerade dubbletten av "Joe The Juice".
        while candidate in taken:
            suffix += 1
            candidate = f"{base}-{suffix}"
        taken.add(candidate)
        record[key] = candidate
