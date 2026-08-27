"""Gatunamnet ur adressen, och vilka gator som är värda att söka på.

Ägaren, om kartans sökfält: "najs om man skriva kungsgatan liksom, så står det
kungsgatan, stockholm, typ." Gatan ska alltså bli en femte söktyp vid sidan av
Kommun, Stadsdel, Område och Verksamhet.

Modulen gör EN sak: den härleder gatunamnet ur `address`. Urvalet, lådan och
filen byggs i `site/src/lib/gatunamn.ts`, som är en ordagrann portning av
reglerna här nere. Den här filen är källan; ändras den ska den där följa.
`tests/test_gatunamn.py` läser båda och fäller om tabellerna glider isär.

## Vad källorna faktiskt lämnar

Uppmätt över hela beståndet 2026-08-27, 16 047 rader i tolv kommuner:

    14 273 rader bär en adress
     1 774 rader bär ingen alls

De 1 774 tomma är inte ett tolkningsfel utan frånvaro vid källan, och två
kommuner står för nästan hälften: Karlstad 696 och Lomma 153, alltså varje rad
de har. Se rapporten och `sources/lomma.py`; Lomma publicerar ingen adress på
någon av sina fyra listsidor, och Karlstads adresser hämtas sedan 2026-08-25
ur ett avställt kartlager men hade ännu inte nått den incheckade
ögonblicksbilden när det här skrevs.

Formerna vi FAKTISKT möter, med antal:

    Kungsgatan 12                       13 251   gata plus nummer
    Kungsgatan 12, Huskvarna               504   gata, nummer, postort
    Räpplinge                              413   ORT, varken gata eller nummer
    Länssjukhuset Ryhov                     89   byggnad eller anläggning
    Kompanigatan                            31   gata utan nummer
    Mobil anläggning (Påsgatan 10)           3   gatan står i parentesen
    Sjöåkravägen18                           3   nummer utan mellanslag
    Mobil anläggning                         2   mobil verksamhet utan plats
    Ravelsmark 13:20, Gränna                 1   fastighetsbeteckning

De fyra sista grupperna, 505 rader, är de som HAR en adress men ingen gata.
Fördelningen per kommun: Borgholm 251, Höganäs 156, Jönköping 61, Svenljunga
32, Oskarshamn 3, Kristinehamn 2. Ingen annan kommun bidrar med en enda rad,
och det är läsvärt i sig: de stora städernas adressfält är rena.

`Box 1234` och `Väg 226` nämndes i uppdraget men förekommer inte i någon av de
tolv kommunerna; de får därför ingen regel. En regel utan rader är en regel som
aldrig prövas.

## De två sätt en sträng får kvala som gata

En rad kvalar om ETT av två stämmer, och ordningen dem emellan spelar ingen
roll:

    A. ETT HUSNUMMER SATT SIST och togs bort. Då är strängen en adress, och
       det som står kvar är adressområdet. Det gäller `Kungsgatan 12` lika
       väl som `Västanå 4`, alltså också de byadresser där "gatan" är en by.
       Lantmäteriets belägenhetsadresser är byggda på samma sätt och Prikko
       har ingen anledning att vara strängare än registret.

    B. RESTEN SLUTAR PÅ EN GATUÄNDELSE ur `SUFFIX`. Det är regeln som räddar
       de 31 rader där Jönköping skrivit gatan utan nummer.

`Räpplinge` klarar ingetdera och blir ingen gata, och det är hela poängen med
att kräva något alls. Borgholm, Höganäs och Svenljunga skriver ORTEN i
adressfältet på 413 rader, och Jönköping skriver ett hus eller en anläggning
på 46. Hade de blivit gator hade sökfältet svarat "Byxelkrok, Borgholm — Gata"
på en fråga vars sanna svar är en ort, och "Jönköpings flygplats — Gata" på en
flygplats. Ett fält som ljuger om vad en träff ÄR är sämre än ett fält som
saknar träffen.

## Ändelselistan är kort med flit

Bara ändelser som inte kan vara något annat än en gata. Uppmätt vad varje
ändelse faktiskt bär i regel B, alltså rader utan nummer:

    gatan 6, vägen 5, torget 4, leden 2, plan 2, stigen 1, väg 1, ringen 1

Fyra ändelser prövades och FÖLL, och de föll på verkliga rader:

    plats    `Jönköpings flygplats`, `Furuviks Idrottsplats` — en flygplats
             är ingen gata, och `Lundströms plats 2` fångas ändå av regel A.
    hamnen   `Hamnen, Visingsö` är en hamn.
    porten   `Juneporten` är ett hus i Jönköping.
    lund, strand, parken, bron
             matchar ortnamn oftare än gatunamn i vårt bestånd.

Listan är alltså inte "alla svenska gatuändelser" utan de som betalar sig här.
Växer beståndet med en kommun som skriver gator utan nummer ska listan mätas
om, inte fyllas på från minnet.

## Skrivningen slås ihop, och den vanligaste vinner

217 av 3 926 gator skrivs på mer än ett sätt i samma kommun, alltid samma
skillnad: `Västra Storgatan` mot `Västra storgatan`, `S:t Larsgatan` mot
`S:t larsgatan`. Jämförelsen sker därför skiftlägesokänsligt, och den form som
visas är den vanligaste. Vid lika många väljs den med flest stora begynnelse-
bokstäver, vilket är Lantmäteriets skrivning, och först därefter bokstavs-
ordning. Regeln måste vara total: två byggen i rad ska ge samma sträng.
"""

from __future__ import annotations

import re
import unicodedata
from collections import Counter
from typing import Iterable, Optional

#: Ändelser som ensamma får en sträng utan husnummer att kvala som gata.
#:
#: Ordagrant samma lista som `SUFFIX` i site/src/lib/gatunamn.ts. Se modulens
#: inledning för vad varje ändelse bär och vilka fyra som prövades och föll.
SUFFIX = (
    "allé",
    "allén",
    "backen",
    "brinken",
    "esplanaden",
    "gata",
    "gatan",
    "gränd",
    "gränden",
    "gången",
    "kajen",
    "kroken",
    "leden",
    "liden",
    "plan",
    "promenaden",
    "ringen",
    "slingan",
    "spången",
    "stigen",
    "terrassen",
    "torg",
    "torget",
    "tunet",
    "vreten",
    "väg",
    "vägen",
)

#: Husnumret sist i strängen, och allt som brukar hänga på det.
#:
#: Täcker `12`, `12 A`, `12A`, `66AB`, `5-7` och `5 A-7 B`. Bokstäverna är
#: högst tre, för `Kungsgatan 66AB` finns men `Kungsgatan 12 Bottenvåningen`
#: ska inte tolkas som ett husnummer med efterled.
HOUSE_NUMBER = re.compile(
    r"\s+\d+\s*[A-Za-zÅÄÖåäö]{0,3}"
    r"(\s*[-–/]\s*\d*\s*[A-Za-zÅÄÖåäö]{0,3})?$"
)

#: Husnumret UTAN mellanslag före: `Sjöåkravägen18`, `Centrumplan15`,
#: `Torpleden102`. Tre rader i Jönköping.
#:
#: Regeln är avsiktligt trängre än den ovan: den kräver att det som blir kvar
#: slutar på en gatuändelse. Utan det villkoret hade `A6` blivit `A` och
#: `Ravelsmark 13:20` hade fått en behandling den inte tål.
GLUED_NUMBER = re.compile(r"(?<=[A-Za-zÅÄÖåäö])\d+[A-Za-zÅÄÖåäö]{0,2}$")


def _segments(address: str) -> list:
    """Delarna av en adress, i den ordning de ska prövas.

    Tre saker delar en adress i vårt bestånd, och alla tre förekommer:

        komma        `Kungsgatan 12, Huskvarna` — postorten sist, alltid.
        snedstreck   `Mobil verksamhet/ Norra Stigamovägen 12`
        parentes     `Mobil anläggning (Påsgatan 10)`

    Postorten klipps bort en gång för alla, för den står aldrig först. De två
    andra kan bära gatan i vilken halva som helst, alltså PRÖVAS BÅDA i stället
    för att en av dem väljs. Utanför parentesen först, för `Lindallévägen 2
    (Lindgården)` är den vanligare formen och ska ge Lindallévägen.
    """
    address = " ".join((address or "").split())
    if not address:
        return []

    # Postorten. Allt efter första kommat, alltid.
    head = address.split(",")[0].strip()
    if not head:
        return []

    inside = re.findall(r"\(([^)]*)\)", head)
    outside = re.sub(r"\([^)]*\)", " ", head)

    parts = []
    for chunk in [outside, *inside]:
        for piece in chunk.split("/"):
            piece = " ".join(piece.split())
            if piece:
                parts.append(piece)
    return parts


def _street_of_segment(segment: str) -> Optional[str]:
    """Gatan i EN del, eller None om delen inte är en adress.

    Se "De två sätt en sträng får kvala som gata" i modulens inledning.
    """
    stripped = HOUSE_NUMBER.sub("", segment).strip()
    if stripped and stripped != segment:
        return stripped

    if segment.lower().endswith(SUFFIX):
        return segment

    glued = GLUED_NUMBER.sub("", segment).strip()
    if glued and glued != segment and glued.lower().endswith(SUFFIX):
        return glued

    return None


def gatunamn(address: Optional[str]) -> Optional[str]:
    """Gatunamnet ur en adress, eller None när raden inte bär någon gata.

    None är ett svar och inte ett fel. 1 774 rader saknar adress och 503 bär
    en ort, ett hus eller en fastighet i stället för en gata; alla 2 277 ska
    ge None hellre än en gissning som hamnar i sökfältet.
    """
    for segment in _segments(address or ""):
        street = _street_of_segment(segment)
        if street:
            return street
    return None


def _capitals(name: str) -> int:
    """Antal ord med stor begynnelsebokstav. Skiljer lika vanliga skrivningar."""
    return sum(1 for word in name.split() if word[:1].isupper())


def kanonisk(forms: Counter) -> str:
    """Den skrivning som ska visas, given alla skrivningar och deras antal.

    Total och deterministisk: antal, sedan stora begynnelsebokstäver, sedan
    bokstavsordning. Se "Skrivningen slås ihop" i modulens inledning.
    """
    return sorted(forms.items(), key=lambda kv: (-kv[1], -_capitals(kv[0]), kv[0]))[0][0]


def nyckel(name: str) -> str:
    """Jämförelsenyckeln för två skrivningar av samma gata.

    Skiftlägesokänslig och normaliserad över Unicode, så att ett `å` skrivet
    som `a` plus ring slås ihop med ett skrivet som ett tecken. Kommunernas
    HTML bär båda formerna.
    """
    return unicodedata.normalize("NFC", " ".join(name.split())).casefold()


def rakna(rader: Iterable) -> dict:
    """Gatorna i ett bestånd: nyckel → (visningsnamn, antal).

    `rader` är adresser som strängar. Används av testerna och av mätläget
    nedan; bygget räknar i site/src/lib/gatunamn.ts mot samma regler.
    """
    forms: dict = {}
    for address in rader:
        street = gatunamn(address)
        if not street:
            continue
        forms.setdefault(nyckel(street), Counter())[street] += 1
    return {key: (kanonisk(f), sum(f.values())) for key, f in forms.items()}


#: Minsta antal verksamheter för att en gata ska erbjudas i sökfältet.
#:
#: "En gata med en enda verksamhet är inte en sökträff, den är verksamheten
#: själv och hittas på sitt namn." Talet är alltså 2, och fördelningen ger
#: inget skäl att gå högre: av 3 926 gator har 1 957 exakt en verksamhet,
#: 674 har två, 373 har tre, 245 har fyra, och därefter faller kurvan jämnt
#: utan knä. Den enda gräns som betyder något är den mellan en och flera.
#:
#: Vid 2 står 1 969 gator kvar och de täcker 11 811 av 13 768 verksamheter
#: med en gata. Vid 3 blir det 1 295 gator och 10 463 verksamheter, alltså
#: 674 färre gator för 1 348 verksamheter — och just de gatorna, med exakt
#: två verksamheter var, är de som en sökande minst kan hitta på annat sätt.
TROSKEL = 2


def _matning() -> None:
    """`python3 -m prikko.gatunamn` — räkna om talen i inledningen.

    Läser den incheckade ögonblicksbilden. Finns den inte säger den det i
    stället för att räkna på ingenting.
    """
    import json
    import sys
    from pathlib import Path

    data = Path(__file__).resolve().parents[2] / "site" / "src" / "data"
    files = sorted(data.glob("*.json"))
    if not files:
        print(f"Ingen data i {data}", file=sys.stderr)
        raise SystemExit(1)

    total = tomma = otolkade = 0
    gator = 0
    over = 0
    for path in files:
        payload = json.loads(path.read_text(encoding="utf-8"))
        slug = payload["municipality"]["slug"]
        adresser = []
        for row in payload["establishments"]:
            total += 1
            address = " ".join((row.get("address") or "").split())
            if not address:
                tomma += 1
                continue
            adresser.append(address)
            if gatunamn(address) is None:
                otolkade += 1
        raknade = rakna(adresser)
        kvar = [v for v in raknade.values() if v[1] >= TROSKEL]
        gator += len(raknade)
        over += len(kvar)
        print(f"{slug:14s} {len(payload['establishments']):5d} rader "
              f"{len(raknade):5d} gator {len(kvar):5d} över tröskeln")
    print(f"{'RIKET':14s} {total:5d} rader {gator:5d} gator {over:5d} över tröskeln")
    print(f"{'':14s} {tomma:5d} utan adress, {otolkade} med adress men utan gata")


if __name__ == "__main__":  # pragma: no cover
    _matning()
