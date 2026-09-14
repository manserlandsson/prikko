"""Gemensam HTTP-hämtning för kommunhämtarna, med kakburk.

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
"""

from __future__ import annotations

import http.cookiejar
import urllib.request

_BURK = http.cookiejar.CookieJar()
_OPPNARE = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(_BURK))


def oppna(request: urllib.request.Request, timeout: float):
    """Som `urllib.request.urlopen`, men kakor följer med mellan anropen.

    Returnerar samma svarsobjekt, så anroparen byter ett funktionsnamn och
    ingenting annat.
    """
    return _OPPNARE.open(request, timeout=timeout)
