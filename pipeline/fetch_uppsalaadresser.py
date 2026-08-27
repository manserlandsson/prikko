#!/usr/bin/env python3
"""Hämta Uppsala kommuns adresspunkter till pipeline/data/interim/.

    python3 pipeline/fetch_uppsalaadresser.py

Uttaget används sedan av geokodningen, men BARA när källan begärs
uttryckligen:

    python3 pipeline/geocode.py --kalla uppsala --torrkor site/src/data/uppsala.json

Läs prikko/uppsalaadresser.py innan du kör skarpt. Tjänsten är öppen, men
lagret är inte publicerat som öppna data och bär ingen licensuppgift. Att
hämta uttaget och mäta vad det skulle ge är en sak; att publicera
koordinater ur det är en annan, och den kräver ett besked från kommunen.

Tjänsten är kommunens egen och tål 57 anrop. Uttaget cachas ändå, för att
hämtningen ska vara reproducerbar och för att en mätning inte ska kosta
kommunen något andra gången.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import List

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko.uppsalaadresser import (  # noqa: E402
    PAGE_SIZE,
    SERVICE,
    extract_path,
    page_url,
)

ROOT = Path(__file__).resolve().parent
EXTRACT_DIR = ROOT / "data" / "interim"

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"

#: Paus mellan sidorna. Kommunens karttjänst är inte byggd för att tömmas.
DELAY_S = 0.2


def get(url: str) -> dict:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=120) as response:
        return json.loads(response.read())


def layer_info() -> dict:
    return get(f"{SERVICE}?f=json")


def count() -> int:
    payload = get(f"{SERVICE}/query?where=1%3D1&returnCountOnly=true&f=json")
    return int(payload["count"])


def fetch_pages(total: int, page_size: int) -> List[dict]:
    """Hämta hela lagret, sida för sida.

    Stannar när en sida kommer tom eller när alla rader är hämtade. Att bara
    lita på `exceededTransferLimit` räcker inte: fältet saknas i sista svaret
    och en slinga som bara läser det snurrar ett varv för mycket.
    """
    pages: List[dict] = []
    fetched = 0
    offset = 0
    while offset < total:
        payload = get(page_url(offset, page_size))
        rows = len(payload.get("features") or [])
        if rows == 0:
            print(f"  tom sida vid offset {offset}, avbryter", file=sys.stderr)
            break
        pages.append(payload)
        fetched += rows
        offset += page_size
        print(f"  {fetched}/{total}", file=sys.stderr)
        time.sleep(DELAY_S)
    return pages


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--force", action="store_true", help="hämta om även när uttaget finns"
    )
    args = parser.parse_args()

    EXTRACT_DIR.mkdir(parents=True, exist_ok=True)
    path = extract_path(EXTRACT_DIR)
    if path.exists() and not args.force:
        print(f"{path} finns redan. Kör med --force för att hämta om.", file=sys.stderr)
        return

    info = layer_info()
    page_size = int(info.get("maxRecordCount") or PAGE_SIZE)
    total = count()
    print(f"{total} adresspunkter, {page_size} per sida", file=sys.stderr)

    pages = fetch_pages(total, page_size)
    rows = sum(len(p.get("features") or []) for p in pages)

    path.write_text(
        json.dumps(
            {
                "note": (
                    "Uttag ur Uppsala kommuns adresslager, arbetsmaterial. "
                    "Versionshanteras inte och går att hämta igen. LÄS "
                    "prikko/uppsalaadresser.py om licensen innan uttaget "
                    "används för att publicera något."
                ),
                "service": SERVICE,
                "copyrightText": info.get("copyrightText"),
                "licence": "okänd — inte angiven av kommunen",
                "expected": total,
                "rows": rows,
                "fetchedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "pages": pages,
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    print(f"Skrev {rows} rader till {path}", file=sys.stderr)
    if rows != total:
        print(
            f"OBS: {rows} rader hämtade men tjänsten uppgav {total}.",
            file=sys.stderr,
        )


if __name__ == "__main__":
    main()
