#!/usr/bin/env python3
"""Hämta Lantmäteriets belägenhetsadresser för våra kommuner.

    set -a && . ~/.prikko-env && set +a
    python3 pipeline/fetch_belagenhetsadresser.py 0380 1880

Utan argument hämtas alla kommuner som har en datafil i site/src/data/.
Resultatet läggs i pipeline/data/interim/ och används sedan av

    python3 pipeline/geocode.py --kalla lantmateriet site/src/data/uppsala.json

Källa, licens och villkor står i prikko/lantmateriet.py. Kort: produkten är
avgiftsfri, licensen CC BY 4.0, men registret innehåller personuppgifter och
användningen prövas juridiskt innan behörigheten ges.

────────────────────────────────────────────────────────────────────────────
DETTA MÅSTE DU GÖRA SJÄLV, EN GÅNG
────────────────────────────────────────────────────────────────────────────
Nedladdningen kräver ett systemkonto och en beviljad behörighet. Ingetdera
går att skapa åt dig: behörigheten förutsätter att du godkänner särskilda
användningsvillkor i ditt eget namn, och den prövas av Lantmäteriet.

  1. geotorget.lantmateriet.se -> logga in -> Mitt konto -> Behörigheter ->
     fliken Systemkonton -> Skapa systemkonto. Välj produktionsmiljö.
     Användarnamnet och lösenordet visas i det steget. Lösenordet visas EN
     gång.

  2. Geodataprodukter -> sök "Belägenhetsadress Nedladdning, vektor" ->
     fliken Beställning. Välj systemkontot från steg 1. Produkten är
     avgiftsfri; du får godkänna "Användningsvillkor för värdefulla
     datamängder som innehåller personuppgifter". Skicka beställningen.

  3. Vänta på den juridiska prövningen. Utfallet kommer som ett ärende under
     Mitt konto -> Ärenden och som mejl. Behörigheten syns sedan under
     Behörigheter, på systemkontot.

  4. Klistra in i ~/.prikko-env:

         export GEOTORGET_USERNAME=...      # systemkontots användarnamn
         export GEOTORGET_PASSWORD=...      # systemkontots lösenord

     Uppgifterna hör hemma DÄR och ingen annanstans. De ska aldrig i repot.

Har du redan hämtat en zip-fil för hand ur Geotorget går den att mata in
direkt, utan uppgifterna ovan:

    python3 pipeline/fetch_belagenhetsadresser.py 0380 \\
        --fil ~/Hämtade\\ filer/belagenhetsadresser_kn0380.zip
────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko.lantmateriet import (  # noqa: E402
    EPSG_SWEREF99_TM,
    STAC_COLLECTION,
    STAC_ROOT,
    extract_dir_paths,
    unpack,
)

ROOT = Path(__file__).resolve().parent
EXTRACT_DIR = ROOT / "data" / "interim"
DATA_DIR = ROOT.parent / "site" / "src" / "data"

USER_AGENT = "PrikkoBot/0.1 (+https://prikko.se; kontakt via prikko.se)"

MISSING_CREDENTIALS = """\
--------------------------------------------------------------------------------
GEOTORGET_USERNAME och GEOTORGET_PASSWORD är inte satta, så nedladdningen kan
inte köras. Uppgifterna är systemkontots i Geotorget, och de skapas för hand.
Stegen står överst i den här filen:

    python3 -c "import pipeline.fetch_belagenhetsadresser as m; print(m.__doc__)"

Har du redan en nedladdad zip-fil tar skriptet den i stället:

    python3 pipeline/fetch_belagenhetsadresser.py <kommunkod> --fil <sökväg>
--------------------------------------------------------------------------------"""


def credentials() -> Optional[str]:
    """Basic-huvudet, eller None när uppgifterna saknas.

    Geotorget erbjuder Basic och OAuth2. OAuth2 kräver en klient registrerad
    i API-portalen och finns bara för organisationskunder; Basic finns för
    båda och räcker för en nattlig hämtning av sex filer.
    """
    user = os.environ.get("GEOTORGET_USERNAME", "").strip()
    password = os.environ.get("GEOTORGET_PASSWORD", "").strip()
    if not user or not password:
        return None
    token = base64.b64encode(f"{user}:{password}".encode("utf-8")).decode("ascii")
    return f"Basic {token}"


def get(url: str, auth: Optional[str] = None) -> bytes:
    headers = {"User-Agent": USER_AGENT}
    if auth:
        headers["Authorization"] = auth
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=600) as response:
        return response.read()


def stac_item(code: str) -> Dict:
    """STAC-posten för en kommun. Postens id ÄR kommunkoden, med nolla."""
    url = f"{STAC_ROOT}/collections/{STAC_COLLECTION}/items/{code}"
    try:
        return json.loads(get(url))
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            raise SystemExit(f"Kommun {code} finns inte i {STAC_COLLECTION}.")
        raise


def municipality_codes() -> List[str]:
    """Kommunkoderna vi publicerar, lästa ur datafilerna."""
    codes = []
    for path in sorted(DATA_DIR.glob("*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        code = (payload.get("municipality") or {}).get("code")
        if code:
            codes.append(code)
    return codes


def download(code: str, auth: Optional[str], given: Optional[Path]) -> None:
    item = stac_item(code)
    properties = item.get("properties") or {}
    epsg = properties.get("proj:epsg")
    if epsg != EPSG_SWEREF99_TM:
        raise SystemExit(
            f"Kommun {code} levereras i EPSG {epsg}, inte {EPSG_SWEREF99_TM}. "
            "Transformen i prikko/geo.py gäller SWEREF 99 TM och skulle "
            "placera varje adress fel."
        )

    asset = (item.get("assets") or {}).get("data") or {}
    href = asset.get("href")
    if not href:
        raise SystemExit(f"STAC-posten för {code} saknar nedladdningslänk.")

    gpkg, metadata = extract_dir_paths(EXTRACT_DIR, code)
    EXTRACT_DIR.mkdir(parents=True, exist_ok=True)

    archive = given
    if archive is None:
        size = asset.get("file:size")
        print(
            f"  hämtar {href.rsplit('/', 1)[-1]}"
            + (f" ({size / 1_000_000:.1f} MB)" if size else ""),
            file=sys.stderr,
        )
        try:
            payload = get(href, auth)
        except urllib.error.HTTPError as exc:
            if exc.code in (401, 403):
                raise SystemExit(
                    f"Lantmäteriet svarade {exc.code} för kommun {code}. Antingen "
                    "är uppgifterna fel, eller så har systemkontot ännu ingen "
                    "beviljad behörighet till Belägenhetsadress Nedladdning, "
                    "vektor. Se stegen överst i den här filen."
                )
            raise
        archive = EXTRACT_DIR / f"belagenhetsadresser_kn{code}.zip"
        archive.write_bytes(payload)

    unpack(archive, gpkg)
    if given is None:
        archive.unlink()

    metadata.write_text(
        json.dumps(
            {
                "note": (
                    "Metadata för ett arbetsmaterial. GeoPackage-filen bredvid "
                    "är inte versionshanterad och går att hämta igen."
                ),
                "municipality": code,
                "title": properties.get("title"),
                "source": "Lantmäteriet, Belägenhetsadress Nedladdning, vektor",
                "licence": "CC BY 4.0 — attribution krävs",
                "attribution": "© Lantmäteriet",
                "terms": (
                    "Användningsvillkor för värdefulla datamängder som "
                    "innehåller personuppgifter"
                ),
                "epsg": epsg,
                "bbox": item.get("bbox"),
                "updated": properties.get("updated"),
                "fetchedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"  {gpkg.relative_to(ROOT)} ({gpkg.stat().st_size / 1_000_000:.1f} MB)",
          file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("codes", nargs="*", help="kommunkoder, fyra siffror")
    parser.add_argument(
        "--fil",
        type=Path,
        help="en zip-fil hämtad för hand ur Geotorget, i stället för nedladdning",
    )
    args = parser.parse_args()

    codes = args.codes or municipality_codes()
    if args.fil and len(codes) != 1:
        raise SystemExit("--fil gäller en kommun i taget; ange dess kommunkod.")

    auth = credentials()
    if auth is None and args.fil is None:
        print(MISSING_CREDENTIALS, file=sys.stderr)
        raise SystemExit(1)

    for code in codes:
        print(f"Kommun {code}", file=sys.stderr)
        download(code, auth, args.fil)


if __name__ == "__main__":
    main()
