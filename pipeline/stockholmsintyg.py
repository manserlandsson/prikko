#!/usr/bin/env python3
"""Stockholms registreringsintyg: hämta, se efter, tillämpa.

    python3 pipeline/stockholmsintyg.py prov site/src/data/stockholm.json
    python3 pipeline/stockholmsintyg.py hamta site/src/data/stockholm.json --antal 300
    python3 pipeline/stockholmsintyg.py hamta site/src/data/stockholm.json --alla
    python3 pipeline/stockholmsintyg.py tillampa site/src/data/stockholm.json

Tre steg, och mellansteget är en människa, precis som i pipeline/wikidatako.py.
Skillnaden är vad människan tittar på. Där är frågan om bilden föreställer det
här stället; här är frågan om vi över huvud taget vill publicera de här nio
fälten om 8 520 namngivna företag. `prov` finns för att den frågan ska gå att
besvara på tjugo rader i stället för på hela beståndet.

Läsningen av sidan bor i prikko/stockholmsintyg.py. Här bor bara ordningen:
vilka som hämtas, hur snällt, vart det skrivs och vad som får publiceras.


═══ VARFÖR `hamta` VÄGRAR TA HELA BESTÅNDET UTAN `--alla` ════════════════════

8 520 GET mot en kommuns e-tjänst är dryga halvtimmen och fullt görbart, mätt
på 300 sidor à 58 sekunder med fyra trådar. Det är ändå ingenting som ska
kunna hända av misstag medan någon provar ett kommando. Utan `--antal` eller
`--alla` hämtas därför 20 stycken.

FYRA TRÅDAR, INTE FLER. Samma hållning som pausen i fetch_stockholm.py: vi
lever på att kommunerna fortsätter tycka om oss, och vi ska mejla 275 av dem.


═══ VARFÖR `tillampa` INTE GÅR ATT KÖRA I DAG, OCH VAD SOM SAKNAS ════════════

Exporten i pipeline/export_supabase.py bygger varje verksamhetsrad från
grunden ur databasen. Ett fält som står i filen men inte i `FILFALT` raderas
alltså tyst i nästa nattkörning, och det har hänt fem gånger på fem dygn. Ett
nytt fält som ingen märker att det försvann är värre än inget fält alls.

Dessutom läser pipeline/tests/test_export_koordinater.py FILFALT ur källan och
ställer den mot vad de incheckade filerna faktiskt bär. Skriver vi
`registration` utan att FILFALT bär den faller det provet, vilket är precis
vad det provet är byggt för.

`tillampa` kontrollerar därför FILFALT innan den skriver, och stannar med ett
besked om vad som ska läggas till. Kontrollen ersätter inte regeln, den gör
regeln omöjlig att glömma. Se `krav_pa_export`.


═══ PERSONNUMMER OCH PERSONNAMN ══════════════════════════════════════════════

Fältet heter "Person/Organisationsnummer" och bär innehavarens personnummer
när verksamheten drivs som enskild firma. Sådana nummer skrivs aldrig till
site/src/data. `prikko.stockholmsintyg.raden` sållar dem, och `prov` skriver
ut hur många i urvalet som fastnade i sållet, för det talet är en del av
beslutsunderlaget.

SAMMA SÅLL GÄLLER NAMNET SEDAN 2026-08-31. Fältet "Livsmedelsföretagare" bär
innehavarens namn på precis de rader där numret hålls inne, och `operator`
sållas därför på samma villkor. Se `utan_personuppgifter` i modulen och
mätningen i dess docstring för varför regeln inte försöker gissa vilka namn
som är personers.

Sållet sitter på TVÅ ställen med avsikt. `raden` städar det som skrivs till
cachen, och `tillampa` städar en gång till det som skrivs till site/src/data.
Det andra steget är inte överflödigt: cachen i data/interim skrevs 2026-08-27,
alltså innan regeln fanns, och den bar 498 namn. Ett spår som bara städade
läsningen hade krävt 8 520 nya anrop mot stadens e-tjänst för att städa en fil
vi redan har.
"""

from __future__ import annotations

import argparse
import datetime
import json
import random
import sys
import time
import urllib.error
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import List, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from prikko import stockholmsintyg as intyg  # noqa: E402

ROOT = Path(__file__).resolve().parent
CACHEFIL = ROOT / "data" / "interim" / "stockholmsintyg.json"

#: Fältet på verksamhetsraden. Måste stå i export_supabase.FILFALT, se
#: modulens docstring.
FALTNAMN = "registration"

#: Fyra och inte fler. Uppmätt: 300 sidor på 58 sekunder, noll fel.
TRADAR = 4
#: Paus per tråd mellan två anrop. Fyra trådar à 0,25 s är fyra anrop i
#: sekunden, alltså ungefär vad stadens egen karta gör när någon zoomar.
PAUS_S = 0.25

#: Väggtid per sida med fyra trådar, alltså pausen PLUS stadens svarstid.
#: Uppmätt 2026-08-25: 150 sidor på 39 sekunder, noll fel. Talet står här för
#: att `hamta` ska kunna säga hur länge en körning tar innan den startar; hela
#: beståndet blir 8 520 gånger 0,26, alltså dryga 37 minuter.
SEKUNDER_PER_SIDA = 0.26

#: Utan uttryckligt antal hämtas så här många. Se docstringen.
STANDARDANTAL = 20


def _rader(path: Path) -> List[dict]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if payload.get("municipality", {}).get("code") != intyg.MUNICIPALITY_CODE:
        raise SystemExit(f"{path} är inte Stockholm")
    return payload["establishments"]


def _urval(rader: List[dict], antal: Optional[int], fro: int) -> List[dict]:
    """Slumpat urval med ett frö, så att en körning går att göra om.

    Slumpat och inte de första: filen ligger i den ordning rutnätet råkade
    hitta verksamheterna, alltså geografiskt, och de första tvåhundra är en
    stadsdel och inte ett tvärsnitt.
    """
    if antal is None or antal >= len(rader):
        return list(rader)
    return random.Random(fro).sample(rader, antal)


def _hamta_manga(rader: List[dict]) -> tuple:
    """Hämta intygen för raderna. Returnerar (per id, saknade, fel)."""
    funna: dict = {}
    saknade: List[str] = []
    fel: List[tuple] = []
    klara = 0

    def en(rad: dict):
        try:
            resultat = intyg.hamta(intyg.guid(rad["id"]))
        except (urllib.error.URLError, TimeoutError, ValueError) as exc:
            return rad, None, repr(exc)
        except intyg.OkantVarde as exc:
            return rad, None, str(exc)
        finally:
            time.sleep(PAUS_S)
        return rad, resultat, None

    with ThreadPoolExecutor(max_workers=TRADAR) as pool:
        for rad, resultat, skal in pool.map(en, rader):
            klara += 1
            if skal is not None:
                fel.append((rad["id"], rad["name"], skal))
            elif resultat is None:
                saknade.append(rad["id"])
            else:
                funna[rad["id"]] = resultat
            if klara % 50 == 0:
                print(f"  {klara}/{len(rader)}", file=sys.stderr, flush=True)

    return funna, saknade, fel


def _skriv_okanda(funna: dict) -> None:
    """En etikett staden lagt till är en nyhet och ska synas i loggen."""
    okanda = Counter()
    for i in funna.values():
        okanda.update(i.okanda_falt)
    for etikett, antal in okanda.most_common():
        print(
            f"  ! okänd rad i intyget: {etikett!r} på {antal} av {len(funna)}. "
            "Lägg till den i prikko.stockholmsintyg.FALT.",
            file=sys.stderr,
        )


def prov(path: Path, antal: int, fro: int) -> int:
    """Steg ett: ett litet urval, utskrivet så att en människa kan läsa det.

    Skriver ingen fil. Hela poängen är att beslutet att hämta 8 520 sidor ska
    fattas efter att någon sett vad en sida innehåller om ett namngivet
    företag, inte före.
    """
    rader = _urval(_rader(path), antal, fro)
    print(f"Hämtar {len(rader)} intyg med {TRADAR} trådar", file=sys.stderr)
    funna, saknade, fel = _hamta_manga(rader)

    idag = datetime.date.today()
    personnummer = 0
    namn = 0
    for rad in rader:
        i = funna.get(rad["id"])
        if i is None:
            continue
        publicerbar = intyg.raden(i, idag)
        if publicerbar["orgnr"] is None and i.nummer:
            personnummer += 1
        if publicerbar["operator"] is None and i.livsmedelsforetagare:
            namn += 1
        print(f"\n{rad['name']}  ·  {rad.get('address') or 'ingen adress'}")
        print(f"  {intyg.intygslank(rad['id'])}")
        for etikett, varde in (
            ("status", "Aktiv" if i.aktiv else "Inaktiv"),
            ("orgnr", publicerbar["orgnr"] or "hålls inne"),
            ("företagsform", publicerbar["companyForm"]),
            # Vad raden BLIR och inte vad sidan sade. Den som ska besluta om
            # publicering ska se det som skulle publicerats.
            ("företagare", publicerbar["operator"] or "hålls inne"),
            ("postnummer", f"{i.postnummer} {i.ort}"),
            ("registrerad", i.registreringsdatum),
            ("omfattning", i.omfattning),
            ("god efterlevnad", i.god_efterlevnad),
            ("kontroller per 5 år", i.kontrollfrekvens),
            ("verksamhetstyper", " | ".join(i.verksamhetstyper)),
            ("aktiviteter", f"{len(i.aktiviteter)} st: "
                            f"{' | '.join(i.aktiviteter[:4])}"),
        ):
            print(f"  {etikett:<19} {varde}")

    _skriv_okanda(funna)
    print(
        f"\n{len(funna)} intyg av {len(rader)}, "
        f"{sum(1 for i in funna.values() if not i.aktiv)} inaktiva, "
        f"{personnummer} med personnummer som hålls inne, "
        f"{namn} med företagarnamn som hålls inne, "
        f"{len(saknade)} utan intyg, {len(fel)} fel",
        file=sys.stderr,
    )
    for id_, namn, skal in fel:
        print(f"  ! {namn} ({id_}): {skal}", file=sys.stderr)
    return 0


def hamta(path: Path, antal: Optional[int], fro: int) -> int:
    """Steg två: hämta och lägg i data/interim, utanför versionshanteringen.

    Samma plats och samma skäl som Overpass-uttagen i oppettider.py: det är
    stort, det är någon annans datamängd, och det går att hämta igen.
    """
    rader = _urval(_rader(path), antal, fro)
    print(
        f"Hämtar {len(rader)} intyg med {TRADAR} trådar. "
        f"Räkna med {len(rader) * SEKUNDER_PER_SIDA / 60:.0f} minuter.",
        file=sys.stderr,
    )
    funna, saknade, fel = _hamta_manga(rader)
    _skriv_okanda(funna)

    idag = datetime.date.today()
    # Cachen bär den PUBLICERBARA raden och inte allt sidan sade. Ett
    # personnummer som aldrig skrivs till disk kan heller inte läcka därifrån.
    payload = {
        "hamtad": idag.isoformat(),
        "intyg": {id_: intyg.raden(i, idag) for id_, i in funna.items()},
        "utanIntyg": saknade,
    }
    CACHEFIL.parent.mkdir(parents=True, exist_ok=True)
    CACHEFIL.write_text(
        json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8"
    )

    inaktiva = sum(1 for i in funna.values() if not i.aktiv)
    utan_orgnr = sum(1 for r in payload["intyg"].values() if r["orgnr"] is None)
    utan_namn = sum(
        1
        for id_, r in payload["intyg"].items()
        if r["operator"] is None and funna[id_].livsmedelsforetagare
    )
    print(
        f"{len(funna)} intyg skrivna till {CACHEFIL}. "
        f"{inaktiva} inaktiva, {utan_orgnr} utan publicerbart orgnr, "
        f"{utan_namn} med företagarnamn som hålls inne, "
        f"{len(saknade)} utan intyg, {len(fel)} fel.",
        file=sys.stderr,
    )
    for id_, namn, skal in fel:
        print(f"  ! {namn} ({id_}): {skal}", file=sys.stderr)
    return 0


def krav_pa_export() -> Optional[str]:
    """Bär exporten fältet? Returnerar ett besked om den inte gör det.

    Se modulens docstring: ett fält utanför FILFALT raderas tyst av nästa
    nattkörning, och test_export_koordinater faller på det med detsamma.
    """
    from export_supabase import FILFALT  # importeras här, inte vid modulstart

    if FALTNAMN in FILFALT:
        return None
    return (
        f"{FALTNAMN!r} står inte i export_supabase.FILFALT.\n\n"
        f"Skrivs fältet ändå raderar nästa nattkörning det tyst, och\n"
        f"pipeline/tests/test_export_koordinater.py faller direkt, eftersom\n"
        f"det provet läser FILFALT ur källan och ställer den mot filerna.\n\n"
        f"Lägg till {FALTNAMN!r} i FILFALT i pipeline/export_supabase.py och\n"
        f"i uppräkningen i dess docstring, sedan går det här kommandot igenom."
    )


def tillampa(path: Path) -> int:
    """Steg tre: skriv intygen i datafilen.

    RADER UTAN INTYG I CACHEN LÄMNAS ORÖRDA. Påståendet är en registeruppgift,
    och att cachen råkar vara ett urval är ingen upplysning om verksamheten.
    Ett intyg som faktiskt försvunnit ska tas bort av en hämtning över hela
    beståndet, inte av ett urval på tjugo.
    """
    if not CACHEFIL.exists():
        raise SystemExit(f"Ingen cache att tillämpa. Kör `hamta` först. Väntade {CACHEFIL}")

    hinder = krav_pa_export()
    if hinder:
        raise SystemExit(hinder)

    kladd = json.loads(CACHEFIL.read_text(encoding="utf-8"))
    cache = {
        id_: intyg.utan_personuppgifter(rad) for id_, rad in kladd["intyg"].items()
    }
    payload = json.loads(path.read_text(encoding="utf-8"))

    # SÅLLET GÅR FÖRE SKRIVNINGEN, OCH ÖVER CACHEN OCKSÅ. Cachen skrevs
    # 2026-08-27, alltså innan `operator` sållades, och bar då 498 namn på
    # innehavare av enskild firma. Att städa den här i stället för att hämta om
    # 8 520 sidor är samma beslut som `hamta` tog när den valde att lägga den
    # PUBLICERBARA raden i cachen och inte allt sidan sade: det som aldrig
    # skrivs till disk kan inte läcka därifrån.
    stadade = sum(
        1
        for id_, rad in cache.items()
        if rad != kladd["intyg"][id_]
    )
    if stadade:
        kladd["intyg"] = cache
        CACHEFIL.write_text(
            json.dumps(kladd, ensure_ascii=False, indent=1), encoding="utf-8"
        )
        print(f"{stadade} rader städades i {CACHEFIL}", file=sys.stderr)

    skrivna = 0
    for e in payload["establishments"]:
        rad = cache.get(e["id"])
        if rad is not None and e.get(FALTNAMN) != rad:
            e[FALTNAMN] = rad
            skrivna += 1

    if skrivna:
        path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8"
        )

    kvar = sum(
        1
        for e in payload["establishments"]
        if (e.get(FALTNAMN) or {}).get("operator")
        and not (e.get(FALTNAMN) or {}).get("orgnr")
    )
    print(
        f"{skrivna} rader fick {FALTNAMN} i {path}. "
        f"{kvar} rader bär ett namn utan organisationsnummer.",
        file=sys.stderr,
    )
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("kommando", choices=("prov", "hamta", "tillampa"))
    parser.add_argument("fil", type=Path)
    parser.add_argument(
        "--antal",
        type=int,
        default=None,
        help=f"antal verksamheter i urvalet (standard {STANDARDANTAL})",
    )
    parser.add_argument(
        "--alla",
        action="store_true",
        help="hela beståndet, 8 520 anrop och dryga halvtimmen",
    )
    parser.add_argument("--fro", type=int, default=7, help="slumpfrö för urvalet")
    args = parser.parse_args()

    if args.alla and args.antal is not None:
        raise SystemExit("--alla och --antal går inte ihop")
    antal = None if args.alla else (args.antal or STANDARDANTAL)

    if args.kommando == "prov":
        # `prov` skriver ut varje intyg för att läsas av en människa. Hela
        # beståndet vore 8 520 stycken i terminalen, alltså inte ett urval.
        if args.alla:
            raise SystemExit("prov är ett urval. Använd --antal, eller `hamta --alla`.")
        return prov(args.fil, antal or STANDARDANTAL, args.fro)
    if args.kommando == "hamta":
        return hamta(args.fil, antal, args.fro)
    return tillampa(args.fil)


if __name__ == "__main__":
    raise SystemExit(main())
