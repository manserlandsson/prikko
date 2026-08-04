#!/usr/bin/env python3
"""Räkna om bedömningarna i befintliga datafiler.

Används när betygsmodellen ändras. Hämtar inget — kontrollerna ligger redan
i filerna, det är bara vår slutsats om dem som ska uppdateras.

    python3 pipeline/recompute.py site/src/data/*.json

Skriver alltid ut hur fördelningen förändrades. En modelländring flyttar
publicerade omdömen om namngivna verksamheter, och den förflyttningen ska
synas innan den går live — inte upptäckas efteråt.
"""

from __future__ import annotations

import argparse
import collections
import json
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko.grading import Area, Inspection, assess  # noqa: E402

LABELS = {
    "clean": "utan anmärkningar",
    "minor": "mindre brister",
    "major": "allvarliga brister",
    None: "ingen bedömning",
}


def recompute(path: Path, today: date) -> None:
    payload = json.loads(path.read_text(encoding="utf-8"))
    establishments = payload["establishments"]

    before = collections.Counter(e.get("verdict") for e in establishments)
    changed = 0

    for e in establishments:
        inspections = [
            Inspection(
                id_national=i["id"],
                inspected_at=date.fromisoformat(i["date"]),
                assessment=i["assessment"],
                type=i["type"],
                # Kontrollpunkterna följer med sedan modellversion 4: rent
                # administrativa avvikelser ska inte skärpa bedömningen.
                areas=tuple(
                    Area(
                        code=a.get("code") or "",
                        group=a.get("group") or "",
                        description=a.get("description") or "",
                        status=a.get("status") or "",
                    )
                    for a in i.get("areas") or []
                ),
            )
            for i in e.get("inspections") or []
        ]
        result = assess(inspections, today)

        if e.get("verdict") != result.verdict:
            changed += 1

        e["verdict"] = result.verdict
        e["distinction"] = result.distinction
        e["reason"] = result.reason
        e["modelVersion"] = result.model_version

    after = collections.Counter(e["verdict"] for e in establishments)

    name = payload["municipality"]["name"]
    print(f"{name}: {changed} av {len(establishments)} ändrade", file=sys.stderr)
    for key in ["clean", "minor", "major", None]:
        b, a = before.get(key, 0), after.get(key, 0)
        arrow = "" if b == a else f"  ({a - b:+d})"
        print(f"  {LABELS[key]:22} {b:6} → {a:6}{arrow}", file=sys.stderr)

    path.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("files", nargs="+", type=Path)
    args = parser.parse_args()

    for path in args.files:
        recompute(path, date.today())
        print(file=sys.stderr)


if __name__ == "__main__":
    main()
