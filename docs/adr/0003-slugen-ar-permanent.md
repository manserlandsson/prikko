# ADR 0003: Sluggen är permanent, och bortfall avpubliceras

**Status:** Beslutad · **Datum:** 2026-08-07

## Kontext

Sluggen sattes av varje fetch-adapter med `dedupe_slugs` i
`pipeline/prikko/text.py`. Den funktionen numrerar kollisioner **positionellt**:
den första verksamheten med ett visst namn får `namnet`, nästa får `namnet-2`.
Ordningen kommer ur källan. För Stockholm kommer den ur i vilken ordning
rutnätshämtningen råkar stöta på verksamheterna, vilket inte är stabilt mellan
två nätter.

Det gav den nattliga körningen 2026-08-06 följande fel:

```
23505: Key (municipality_code, slug)=(0180, masens-forskola) already exists
```

Stockholm har två förskolor som heter Måsens förskola, på Blommensbergsvägen
163 och 180. Ingen av dem hade bytt id, och båda fanns kvar i källan. Källan
levererade dem i omvänd ordning mot förra körningen, så `masens-forskola` och
`masens-forskola-2` bytte ägare. Upserten går på `id` medan unikheten gäller
`(municipality_code, slug)`, alltså försökte den ena raden skriva en slug som
den andra fortfarande höll.

Kraschen var det minst allvarliga av två fel.

**Sluggen är sidans publicerade adress.** Hade bytet gått igenom hade
`/stockholm/masens-forskola` tyst börjat visa grannförskolan. Varje bokmärke,
varje inlänk och varje notismejl hade pekat på fel lokal, med rätt utseende och
utan felmeddelande. `schema_community.sql` resonerar redan kring att en gammal
slug kan leda till en 404 och accepterar det utfallet. En gammal slug som leder
till någon *annan* verksamhet är inte samma sak, och är inte acceptabelt.

Kraschen kostade också mer än en natt. `load()` reste felet vidare och `main()`
avbröt hela inläsningen, så de kommuner som låg efter Stockholm i filordningen
laddades inte alls. Uppsala stod stilla från 2026-08-02 och Svenljunga från
2026-08-03, utan att någon signal sade att det var just de som stod stilla.

En besläktad lucka fanns bredvid: laddaren skrev `active = 2` på allt som kom
in och ingenting satte någonsin något annat. En verksamhet som kommunen slutat
lämna ut låg kvar som publicerad för alltid, med en kontrollhistorik som aldrig
mer uppdaterades och ingenting som sade det.

## Beslut

### 1. En slug byter aldrig verksamhet

`reconcile_slugs()` i `pipeline/load_supabase.py` körs före upserten och läser
kommunens befintliga `(id, slug)` ur databasen.

* Ett id som redan står i databasen **behåller sin slug**, oavsett vad
  utlämningen föreslår.
* Ett nytt id får sin naturliga slug, uppräknad tills den är ledig mot **hela**
  kommunens bestånd, inte bara mot nattens utlämning.
* Slugar som hör till rader vi inte längre får utlämning för förblir upptagna.

Databasen är sanningen, och sluggen i den exporterade ögonblicksbilden kommer
från databasen. Adapterns slug är därmed ett förslag som gäller första gången
en verksamhet ses, och aldrig därefter.

### 2. Sluggen följer med lokalen även när skylten byts

Byter en anläggning namn behåller den sin slug. Adressen kan alltså bära ett
namn verksamheten inte längre använder.

Det är avsiktligt och drar åt samma håll som beslutet i `b647fa3`: kommunernas
kontroller är registrerade på anläggningen och inte på företaget, och sidan
säger det ovillkorligt. Sidan är lokalens sida, och den fortsätter vara det när
en ny restaurang tar över adressen. Sidan visar det aktuella namnet. Adressen
står stilla.

Alternativet, att flytta URL:en vid varje namnbyte, bryter varje inlänk och ger
läsaren ingenting i utbyte. `docs/14_seo_efter_lansering.md` räknar dessutom
slugar som ändras bland källorna till mjuka 404:or.

### 3. Bortfall avpubliceras, det raderas inte

`deactivate_missing()` sätter `active = 0` på de rader kommunen slutat lämna ut.
Raden ligger kvar med sin historik, lyfts ur `publishable_establishments` och
håller sin slug reserverad. Dyker verksamheten upp igen skriver nästa upsert
tillbaka `active = 2` av sig själv.

Radering var aldrig ett alternativ: den hade kaskaderat ner i inspektioner,
kontrollområden och företagsytans kopplingar, och frigjort sluggen så att nästa
körning kunde ge samma adress till någon annan.

`export_supabase.py` filtrerar bort `active = 0` innan ögonblicksbilden skrivs.
Filtret måste stå där och inte bara i vyn `publishable_establishments`, för
exporten läser tabellen direkt. Utan det hade avpubliceringen bara gällt
sajtens dynamiska delar och inte de byggda sidorna, alltså inte synts alls.

**Spärr.** Saknas mer än fem procent av kommunens publicerade bestånd, dock
lägst tio rader, avpubliceras ingenting alls och körningen säger varför.
Bortfall av den storleken är nästan alltid vårt fel. Stockholms hämtning hoppar
tyst över en rutnätsruta som svarar med fel, och ett sådant hål får inte
avpublicera hundratals verksamheter i tysthet. Golvet finns för att fem procent
av Svenljungas 99 rader är fyra, och fyra nedlagda kaféer i en liten kommun är
fullt möjligt.

### 4. En kommun som fallerar stoppar inte de andra

`main()` fångar felet per fil, laddar resten och avslutar med felkod först när
alla fått sin chans. Det är samma princip som `fail-fast: false` i matrisen i
`uppdatera-data.yml`, och samma princip som sammanslagningen i `upsert()` redan
skrevs för.

## Konsekvenser

* Sluggen kan över tid bära ett namn som inte står på dörren. Priset betalas
  medvetet för att adressen ska vara pålitlig.
* `dedupe_slugs` i adaptrarna behövs fortfarande, men är inte längre det som
  avgör. Laddaren är sista ordet, vilket också skyddar mot att en adapter med
  svagare uppräkning (`fetch_linkoping.py` har en egen) fäller nattkörningen.
* Ska en URL någon gång behöva flyttas kräver det ett omdirigeringsregister.
  Det finns inte i dag och byggs inte förrän det behövs.
