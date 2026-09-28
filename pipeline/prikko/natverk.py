"""Gemensam HTTP-hämtning för kommunhämtarna, med kakburk, packning och arkiv.

VARFÖR MODULEN FINNS
--------------------
Varje `fetch_<kommun>.py` hade sin egen `get()` byggd på
`urllib.request.urlopen`, och `urlopen` använder en öppnare utan kakburk.

Den 11 och 12 september 2026 föll Norrköpings hämtning, och den 12 och 13
kröp Örebros fram till 45-minuterstaket, båda med samma fel:

    HTTP Error 307: The HTTP server returned a redirect error that would
    lead to an infinite loop. The last 30x error message was: Temporary
    Redirect

Båda kommunerna kör Sitevision bakom en F5-lastbalanserare, vilket syns på
kakan `SiteVisionLTM`. Från en svensk bostadsadress svarar samma adress 301
och sedan 200, med eller utan kakor, alltså går felet inte att framkalla
härifrån. Det uppträder bara från GitHubs löpare i Azure.

Mönstret "sätt en kaka och skicka tillbaka till samma adress" är hur en
balanserare ber en klient att bevisa att den behåller kakor, och det är
exakt det som ger urllibs meddelande om en oändlig loop: `HTTPRedirectHandler`
ser samma adress igen och ger upp, eftersom andra varvet går ut utan kakan
och därför får samma svar. Med en kakburk går andra varvet ut MED kakan.

DET HÄR ÄR EN HYPOTES SOM PRÖVAS I DRIFT, inte en belagd orsak. Den är vald
för att den kostar ingenting att ha fel om: en kakburk ändrar inget svar från
en server som inte sätter kakor. Utfallet ska läsas i nattjobbets logg de
närmaste nätterna, och står 307-loopen kvar är hypotesen fel.

Kakburken är per process och lever bara under en körning. Ingenting skrivs
till disk, och inga kakor delas mellan kommuner eftersom varje kommun hämtas
i ett eget jobb.

PACKNINGEN, TILLAGD 2026-09-28
------------------------------
`urllib` begär INTE packade svar av sig självt, alltså har vi dragit hem
okomprimerad text i varje natt hittills. Mätt mot källorna 2026-09-28, samma
adress med och utan `Accept-Encoding: gzip`:

    Örebro, verksamhetssida       88 879 B → 21 498 B    fyra gånger mindre
    Örebro, sökningen            204 718 B → 57 945 B    fyra gånger mindre
    Svenljunga, listsidan        373 616 B → 46 407 B    åtta gånger mindre
    Uppsala, detaljsidan         106 649 B → 106 649 B   servern packar inte
    Stockholm, en rutnätsruta    349 262 B → 349 262 B   servern packar inte

Örebro drar hem 1 233 verksamhetssidor varje natt, och de är jobbets tyngsta
post i byte räknat. Löparen står i Azure westus3 och källorna i Sverige, så
det är överföringen och inte servern som kostar: samma hämtning tar 15 minuter
därifrån och under 3 minuter härifrån.

Packningen sker i transporten och rör ingenting i tolkningen. Anroparen får
samma byte ur `read()` som förut, eftersom uppackningen ligger i en handler
och inte hos anroparen.

ARKIVET, TILLAGT 2026-09-28
---------------------------
Se `Arkiv` längst ned. Kort: en del av det vi hämtar varje natt kan bevisligen
inte ha ändrats sedan i går, och det ska då inte hämtas igen.
"""

from __future__ import annotations

import gzip
import hashlib
import http.cookiejar
import io
import sys
import threading
import urllib.request
import urllib.response
from pathlib import Path
from typing import Optional


class _Uppackare(urllib.request.BaseHandler):
    """Begär packade svar och packar upp dem innan anroparen ser dem.

    `Accept-Encoding` sätts bara när anroparen inte satt något eget, så en
    hämtare som vill ha rådata får det. Bara gzip, eftersom deflate finns i
    två oförenliga tolkningar i verkligheten och ingen av våra källor bjuder
    ut det ensamt.
    """

    def http_request(self, request):
        if not request.has_header("Accept-encoding"):
            request.add_unredirected_header("Accept-Encoding", "gzip")
        return request

    def http_response(self, request, response):
        if (response.headers.get("Content-Encoding") or "").lower() != "gzip":
            return response
        kropp = gzip.decompress(response.read())
        # Huvudena följer med oförändrade utom de två som beskrev packningen.
        # Lämnas de kvar ljuger de om en kropp som redan är uppackad.
        #
        # BÅDA MÅSTE TAS BORT FÖRST. `Message.__setitem__` LÄGGER TILL ett
        # huvud, det byter inte ut, så en ren tilldelning hade gett två
        # Content-Length och `get()` hade svarat med den PACKADE längden.
        huvuden = response.headers
        del huvuden["Content-Encoding"]
        del huvuden["Content-Length"]
        huvuden["Content-Length"] = str(len(kropp))
        uppackat = urllib.response.addinfourl(
            io.BytesIO(kropp), huvuden, response.url, response.status
        )
        uppackat.msg = response.msg
        return uppackat

    https_request = http_request
    https_response = http_response


_BURK = http.cookiejar.CookieJar()
_OPPNARE = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(_BURK), _Uppackare()
)


def oppna(request: urllib.request.Request, timeout: float):
    """Som `urllib.request.urlopen`, men kakor följer med mellan anropen och
    ett packat svar packas upp.

    Returnerar samma svarsobjekt, så anroparen byter ett funktionsnamn och
    ingenting annat.
    """
    return _OPPNARE.open(request, timeout=timeout)


# ---------------------------------------------------------------------------
# Arkivet
# ---------------------------------------------------------------------------


class Arkiv:
    """Ett lager på disk för svar som bevisligen inte kan ha ändrats.

    VARFÖR, MED TALEN SOM MOTIVERAR DET

    En lyckad natt kostade 127 jobbminuter i september 2026, alltså 3 810 i
    månaden mot ett tak på 2 000. Nästan allt gick åt till att hämta om saker
    som stod still. Mätt över tjugo nattliga incheckningar, 4 till 22
    september 2026, ändrade sig så här många verksamheter per natt:

        Kristinehamn    0,0 av 170     0,00 %
        Borgholm        0,0 av 406     0,00 %
        Lomma           0,0 av 153     0,00 %
        Höganäs         0,1 av 316     0,02 %
        Svenljunga      0,1 av 100     0,11 %
        Norrköping      0,3 av 1 022   0,03 %
        Örebro          9,1 av 1 233   0,74 %
        Uppsala        21,3 av 1 836   1,16 %
        Stockholm     155,1 av 8 566   1,81 %

    Den dyraste källan ändrar alltså under två procent av sitt bestånd per
    natt, och de billigaste ingenting alls.

    VAD SOM FÅR LÄGGAS HÄR, OCH INGET ANNAT

    Arkivet har ingen giltighetstid och frågar aldrig servern. Det får därför
    BARA användas för svar som inte kan ändras, och nyckeln måste bära det
    som gör svaret unikt:

    * En publicerad kontrollrapport. Kommunen laddar upp en ny fil med ett
      nytt id i stället för att ändra i en gammal. Svenljungas server säger
      det själv: `Cache-Control: public, max-age=31536000, immutable`.
    * En avslutad kontrolls avvikelsepunkter, hämtade per kontroll-id. Örebro
      håller inne resultatet i 30 dagar medan verksamheten yttrar sig, och
      1,8 procent av beståndets 5 479 kontroller är yngre än 90 dagar. Se
      `FARSKT_FONSTER_DAGAR` i fetch_orebro.py.
    * En detaljsida vars listrad står oförändrad, med hela listraden som
      nyckel. Se fetch_uppsala.py.

    KÄLLANS EGET SVAR OCH INTE ETT TOLKAT RESULTAT, och det är avsiktligt.
    Arkivet lagrar de byte servern skickade, på sin höjd omskrivna utan
    blanktecken när en JSON-kropp måste kontrolleras innan den sparas. Ingen
    rad har gått genom `prikko/sources/`. Rättas en tolkning där slår
    rättelsen igenom nästa natt på HELA beståndet, även på det som lästes ur
    arkivet. Hade vi lagrat tolkningen hade en rättelse bara nått det som
    råkade hämtas om.

    Innehållet packas på väg in. Uppsalas detaljsidor är 106 kB styck
    opackade och omkring 10 kB packade, alltså 18 MB i stället för 195 MB för
    hela beståndet, och arkivet lyfts in och ut ur GitHubs cache varje natt.
    """

    #: Höjs den här när lagringsformatet ändras blir hela arkivet ogiltigt på
    #: en gång, utan att någon behöver minnas att tömma det för hand.
    FORMAT = "1"

    def __init__(self, rot: Optional[Path], namnrymd: str) -> None:
        self.katalog = None if rot is None else Path(rot) / namnrymd
        self.traffar = 0
        self.missar = 0
        self._rorda: set = set()
        # Örebro hämtar med fem arbetare, alltså räknas träffarna och förs
        # listan över rörda filer från flera trådar. Själva skrivningen
        # behöver inget lås: den går via en tillfällig fil och ett namnbyte.
        self._las = threading.Lock()

    def _fil(self, nyckel: str) -> Path:
        # Nyckeln kan vara en URL eller en hel markupsnutt, alltså aldrig
        # något som duger som filnamn. Hashen gör den till ett.
        summa = hashlib.sha256(f"{self.FORMAT}\0{nyckel}".encode("utf-8")).hexdigest()
        assert self.katalog is not None
        return self.katalog / summa[:2] / f"{summa[2:]}.gz"

    def las(self, nyckel: str) -> Optional[bytes]:
        """Kroppen ur arkivet, eller None när den inte finns där."""
        if self.katalog is None:
            with self._las:
                self.missar += 1
            return None
        fil = self._fil(nyckel)
        try:
            kropp = gzip.decompress(fil.read_bytes())
        except (OSError, EOFError, gzip.BadGzipFile):
            # En halvskriven eller trasig post är inte ett fel värt att fälla
            # en natt för. Den räknas som en miss och skrivs över.
            with self._las:
                self._rorda.add(fil)
                self.missar += 1
            return None
        with self._las:
            self._rorda.add(fil)
            self.traffar += 1
        return kropp

    def skriv(self, nyckel: str, kropp: bytes) -> None:
        if self.katalog is None:
            return
        fil = self._fil(nyckel)
        with self._las:
            self._rorda.add(fil)
        fil.parent.mkdir(parents=True, exist_ok=True)
        # Skriv och byt namn, så att en avbruten körning aldrig lämnar en
        # halv fil som nästa natt läser som giltig. Namnet bär trådens id,
        # annars kan två arbetare med samma nyckel skriva över varandras
        # halvfärdiga fil.
        tillfallig = fil.with_suffix(f".{threading.get_ident():x}.del")
        tillfallig.write_bytes(gzip.compress(kropp, 6))
        tillfallig.replace(fil)

    def gallra(self) -> int:
        """Ta bort det som den här körningen varken läste eller skrev.

        Utan gallring växer arkivet med varje rapport kommunen någonsin
        publicerat och varje verksamhet som lagt ned, och det lyfts in och ut
        ur GitHubs cache varje natt. Anropas SIST i en körning, och bara när
        körningen gick igenom: gallrar vi efter en halv hämtning kastar vi
        det vi hade behövt i morgon.
        """
        if self.katalog is None or not self.katalog.exists():
            return 0
        borttagna = 0
        for fil in self.katalog.rglob("*.gz"):
            if fil not in self._rorda:
                fil.unlink()
                borttagna += 1
        # Rester efter en körning som dog mitt i en skrivning. De läses aldrig,
        # men de följer med in i GitHubs cache om ingen tar bort dem.
        for rest in self.katalog.rglob("*.del"):
            rest.unlink()
        for katalog in sorted(self.katalog.rglob("*"), reverse=True):
            if katalog.is_dir() and not any(katalog.iterdir()):
                katalog.rmdir()
        return borttagna

    def sammanfatta(self, vad: str) -> None:
        if self.katalog is None:
            print(f"  arkivet avstängt, alla {self.missar} {vad} hämtades", file=sys.stderr)
            return
        totalt = self.traffar + self.missar
        andel = self.traffar / totalt * 100 if totalt else 0.0
        print(
            f"  arkivet: {self.traffar} av {totalt} {vad} lästes ur arkivet "
            f"({andel:.1f} %), {self.missar} hämtades",
            file=sys.stderr,
        )


def anslut_arkiv(argparser) -> None:
    """Lägg `--arkiv` på en hämtares argumentlista, med samma text överallt."""
    argparser.add_argument(
        "--arkiv",
        type=Path,
        default=None,
        help="katalog för svar som inte kan ha ändrats (tomt = hämta allt)",
    )
