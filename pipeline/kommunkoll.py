#!/usr/bin/env python3
"""Fullständighetskontroll per kommun.

En kommun är inte klar för att adaptern kör utan fel. Den är klar när
sidorna faktiskt bär det en besökare kommer för. Det här skriptet svarar på
frågan "vad saknas i den här kommunen" i stället för att någon ska upptäcka
det på en enskild sida långt senare.

    python3 pipeline/kommunkoll.py
    python3 pipeline/kommunkoll.py lomma hoganas

Bakgrunden: Lomma lästes in med noll adresser på samtliga 153 verksamheter
och Höganäs med 153 av 310, där flera av dem är ortnamn som "Mölle" i
stället för gatuadresser. Ingen av dem gick därför att geokoda, och deras
sidor visar namn och bedömning men varken adress eller karta. Det upptäcktes
av en besökare, inte av oss.

Kontrollen är avsiktligt icke-dömande om KÄLLANS begränsningar. Att Karlstad
saknar historik är inget fel vi kan rätta. Men vi ska veta om det, och det
ska stå på sidan i stället för att se ut som ett tomrum.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "site" / "src" / "data"

#: Under den här andelen är fältet så tunt att sidorna påverkas på riktigt.
THIN = 0.5


def andel(n: int, av: int) -> float:
    return n / av if av else 0.0


def granska(path: Path) -> dict:
    d = json.loads(path.read_text(encoding="utf-8"))
    es = d["establishments"]
    n = len(es)

    inspections = [i for e in es for i in e["inspections"]]
    areas = [a for i in inspections for a in i["areas"]]
    bedomda = [e for e in es if e["verdict"]]

    djup = [len(e["inspections"]) for e in es if e["inspections"]]

    return {
        "kommun": d["municipality"]["city"],
        "slug": d["municipality"]["slug"],
        "antal": n,
        "adress": andel(sum(1 for e in es if (e.get("address") or "").strip()), n),
        "koordinat": andel(sum(1 for e in es if e.get("lat") is not None), n),
        "bedomd": andel(len(bedomda), n),
        "typ": andel(sum(1 for e in es if e.get("types")), n),
        "kontroller": len(inspections),
        "omraden": len(areas),
        # Detaljnivå: har källan sagt VAD som brast, inte bara att något gjorde det?
        "omraden_per_kontroll": (len(areas) / len(inspections)) if inspections else 0.0,
        # Historikdjup avgör om utmärkelsen är möjlig att nå överhuvudtaget.
        "max_djup": max(djup) if djup else 0,
        "utmarkelser": sum(1 for e in es if e.get("distinction")),
        "kvarstar": sum(1 for e in bedomda if e["verdict"] == "major"),
    }


def skriv(r: dict) -> list:
    """Returnerar listan med brister. Tom lista betyder klar."""
    brister = []

    print(f"\n{r['kommun']}  ({r['antal']:,} verksamheter)".replace(",", " "))
    print(f"  bedömda            {r['bedomd']:6.0%}")

    for nyckel, etikett, konsekvens in (
        ("adress", "adress", "sidan visar ingen adress och kan inte geokodas"),
        ("koordinat", "koordinat", "ingen karta på verksamhetssidan"),
        ("typ", "verksamhetstyp", "kan inte filtreras på kategori"),
    ):
        varde = r[nyckel]
        flagga = "  SAKNAS" if varde == 0 else ("  TUNT" if varde < THIN else "")
        print(f"  {etikett:<18} {varde:6.0%}{flagga}")
        if varde < THIN:
            brister.append(f"{etikett}: {varde:.0%} — {konsekvens}")

    print(f"  kontroller         {r['kontroller']:,}".replace(",", " "))
    print(f"  områden/kontroll   {r['omraden_per_kontroll']:6.1f}", end="")
    if r["omraden"] == 0:
        print("  SAKNAS")
        brister.append(
            "avvikelser specificeras inte — sidan kan visa ATT något brast, inte VAD"
        )
    else:
        print()

    print(f"  längsta historik   {r['max_djup']:6d}", end="")
    if r["max_djup"] < 3:
        print("  KORT")
        brister.append(
            f"historiken är högst {r['max_djup']} kontroller djup — "
            "utmärkelsen kräver tre och kan aldrig nås"
        )
    else:
        print()

    if r["bedomd"] > 0 and r["kvarstar"] == 0:
        print("  kvarstående        ingen — kontrollera om källan kan uttrycka det")

    return brister


def main() -> None:
    valda = sys.argv[1:]
    filer = sorted(DATA.glob("*.json"))
    if valda:
        filer = [f for f in filer if f.stem in valda]
        if not filer:
            sys.exit(f"Hittade ingen datafil för: {', '.join(valda)}")

    problem = {}
    for f in filer:
        r = granska(f)
        brister = skriv(r)
        if brister:
            problem[r["kommun"]] = brister

    print("\n" + "=" * 66)
    if not problem:
        print("Alla granskade kommuner bär det en verksamhetssida behöver.")
        return

    print("KOMMUNER MED LUCKOR\n")
    for kommun, brister in problem.items():
        print(f"  {kommun}")
        for b in brister:
            print(f"    - {b}")
    print(
        "\nEn lucka är inte alltid ett fel vi kan rätta. Källan kanske inte\n"
        "publicerar uppgiften. Men den ska stå på sidan i klartext i stället\n"
        "för att se ut som ett tomrum."
    )


if __name__ == "__main__":
    main()
