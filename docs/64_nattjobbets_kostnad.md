# 64. Nattjobbets kostnad: 127 minuter per natt blir 50

**Datum:** 2026-09-28
**Vad det här är:** en mätning, ett val och en ändring som är gjord.
**Vad som behövs:** ingenting av ägaren, utom ett beslut han kan ta i lugn
och ro. Se sista avsnittet.

---

## 1. Vad som hände

Repot är privat, alltså dras varje körning från kontots 2 000 inkluderade
GitHub Actions-minuter i månaden. Minuterna räknas **per jobb** och rundas upp
till hel minut per jobb, så tretton jobb på en halv minut var kostar tretton
minuter och inte sju. Att köra jobben parallellt sänker ingenting.

Den 23 september tog minuterna slut. Från och med då dog varje körning av både
`uppdatera-data.yml` och `halsokoll.yml` efter sju sekunder, med noll steg och
ingen logg. Datan står still sedan 22 september.

## 2. Mätningen före

Talen är lästa ur GitHubs eget API för den sista lyckade natten, körning
`35705199227` den 22 september 2026, och inte uppskattade. "Hämtsteget" är
bara `python3 pipeline/fetch_*.py`, "jobbet" är hela jobbet med utcheckning
och artefakt, "debiterat" är jobbet uppåtrundat till hel minut.

| jobb | hämtsteget | jobbet | debiterat |
|---|---:|---:|---:|
| Hämta uppsala | 1 879 s | 31,32 min | **32** |
| Hämta svenljunga | 1 383 s | 23,05 min | **24** |
| Hämta stockholm | 976 s | 16,27 min | **17** |
| Hämta kristinehamn | 898 s | 14,97 min | **16** |
| Hämta orebro | 853 s | 14,22 min | **15** |
| Ladda och exportera | | 14,28 min | **15** |
| Hämta linkoping | 19 s | 0,32 min | **1** |
| Hämta norrkoping | 13 s | 0,22 min | **1** |
| Hämta oskarshamn | 12 s | 0,20 min | **1** |
| Hämta jonkoping | 11 s | 0,18 min | **1** |
| Hämta lomma | 9 s | 0,15 min | **1** |
| Hämta hoganas | 9 s | 0,15 min | **1** |
| Hämta karlstad | 8 s | 0,13 min | **1** |
| Hämta borgholm | 8 s | 0,13 min | **1** |
| | | | **127** |

**127 jobbminuter per natt, alltså 3 810 i månaden mot ett tak på 2 000.**

Två tal ur tabellen styr allt som följer:

* **De åtta billiga hämtningarna tog 89 sekunder tillsammans och kostade åtta
  minuter.** Nästan hela notan för dem var uppåtrundningen.
* **Jobbets egen omkostnad är omkring tio sekunder**, mätt steg för steg:
  "Set up job" 1 s, utcheckning 6 s, `setup-python` 0 s, artefakt 1 till 2 s.

## 3. Varför de fem dyra tar tid

Hypotesen var att de kryper per verksamhet eller per PDF med en artighetspaus
medan de åtta billiga hämtar en enda fil. **Den stämmer, men pausen är inte
huvudsaken.** Antalet anrop är det, och bytena över en långsam länk.

Löparen står i Azure westus3 och källorna i Sverige. Samma hämtning tar därför
fyra till femton gånger längre därifrån än härifrån, och det är den skillnaden
som gör antalet anrop dyrt.

| kommun | anrop per natt | paus | pausen av tiden | vad resten är |
|---|---:|---:|---:|---|
| Uppsala | 187 listsidor + 1 836 detaljsidor | 0,3 s | 10 av 31 min | 1 836 sidor à 106 kB |
| Svenljunga | 1 listsida + 227 PDF | 1,2 s | 4,5 av 23 min | PDF:er på 170 till 700 kB |
| Kristinehamn | 5 register + ~360 PDF | 1,0 s | 6 av 15 min | samma sak |
| Örebro | 1 + 1 233 sidor + 5 479 punktanrop | 0,15 s | 2,7 av 14 min | 1 233 sidor à 89 kB |
| Stockholm | 324 rutnätsanrop | 0,6 s | 3,2 av 16 min | svar på upp till 349 kB |

PDF-tolkningen misstänktes men friades: mätt på åtta rapporter tar
`extract_text` **0,02 sekunder** per rapport, alltså 0,1 minut för hela
Svenljunga. Nedladdningen är 0,28 s härifrån och omkring 5 s från löparen.

## 4. Hur ofta datan faktiskt ändras

Det här talet avgör hela valet, och det gick att mäta utan att fråga någon
kommun: tjugo nattliga incheckningar av `site/src/data/` mellan 4 och 22
september 2026, verksamhet för verksamhet, på de fält en hämtare skriver
(namn, adress, typer, omdöme och hela kontrollhistoriken).

| kommun | verksamheter | ändrade per natt | andel | nya | borta |
|---|---:|---:|---:|---:|---:|
| Stockholm | 8 566 | 155,1 | 1,81 % | 4,7 | 4,4 |
| Uppsala | 1 836 | 21,3 | 1,16 % | 12,4 | 13,9 |
| Örebro | 1 233 | 9,1 | 0,74 % | 0,7 | 0,5 |
| Linköping | 1 247 | 4,1 | 0,33 % | 0,3 | 0,3 |
| Jönköping | 1 143 | 3,3 | 0,29 % | 0,9 | 0,4 |
| Karlstad | 696 | 3,2 | 0,45 % | 0,1 | 0,2 |
| Oskarshamn | 242 | 0,8 | 0,32 % | 0,2 | 0,0 |
| Norrköping | 1 022 | 0,3 | 0,03 % | 0,0 | 0,0 |
| Svenljunga | 100 | 0,1 | 0,11 % | 0,0 | 0,0 |
| Höganäs | 316 | 0,1 | 0,02 % | 0,0 | 0,0 |
| Kristinehamn | 170 | **0,0** | 0,00 % | 0,0 | 0,0 |
| Borgholm | 406 | **0,0** | 0,00 % | 0,0 | 0,0 |
| Lomma | 153 | **0,0** | 0,00 % | 0,0 | 0,0 |

**Den mest rörliga källan ändrar under två procent av sitt bestånd per natt,
och tre kommuner ändrade ingenting alls på tjugo nätter.** Uppsala är dessutom
skovis: nätterna i ordning gav 0, 0, 0, 54, 26, 13, 10, 71, 11, 0, 11, 69, 27,
3, 20, 3, 0, 65 ändrade verksamheter.

## 5. Vad som prövades mot källorna, och vad som bar

Prövat 2026-09-28 genom att fråga källorna direkt.

### Villkorade anrop, `If-Modified-Since` och `ETag`

| källa | ETag | Last-Modified | svarar 304 |
|---|---|---|---|
| Svenljunga, PDF | nej | **ja** | **ja**, och `Cache-Control: public, max-age=31536000, immutable` |
| Uppsala, detaljsidan | nej | nej | nej, `Cache-Control: private` |
| Örebro, verksamhetssidan | nej | nej | nej, `Cache-Control: no-cache, no-store` |
| Örebro, punkterna | nej | nej | nej |

Villkorade anrop biter alltså bara där resursen ändå är oföränderlig, och där
räcker en lagrad kopia. **Ett villkorat anrop är dessutom fortfarande ett
anrop**, och för Uppsala är det antalet anrop som kostar, inte bytena.

### Packning

`urllib` begär inte packade svar av sig självt. Samma adress, med och utan
`Accept-Encoding: gzip`:

| källa | opackat | packat |
|---|---:|---:|
| Svenljunga, listsidan | 373 616 B | **46 407 B** |
| Örebro, verksamhetssidan | 88 879 B | **21 498 B** |
| Örebro, sökningen | 204 718 B | **57 945 B** |
| Uppsala, detaljsidan | 106 649 B | 106 649 B |
| Stockholm, en rutnätsruta | 349 262 B | 349 262 B |

### Parallellitet mot Uppsala

25 detaljsidor, samma artighetspaus på 0,3 s, olika antal arbetare:

| arbetare | tid | per sida | takt |
|---:|---:|---:|---:|
| 1 | 13,6 s | 0,543 s | 1,84/s |
| 3 | 9,7 s | 0,388 s | 2,58/s |
| 5 | 8,4 s | 0,335 s | 2,98/s |
| 8 | 9,5 s | 0,382 s | 2,62/s |

**Servern når ett tak vid ungefär tre svar i sekunden.** Fem arbetare ger 1,6
gånger och inte fem, och åtta ger mindre än fem. Parallellitet är alltså ingen
väg ur Uppsalas kostnad.

### Det som bar: listraden

Uppsalas listsida bär redan allt som behövs för att veta om en detaljsida är
värd att hämta:

```html
<li class="inspection-ok">
  <h3><a href=".../Details?id=-1922505589">Göteborgs nation</a></h3>
  <p></p>
  <p>Senaste omdöme: Utan avvikelse</p>
  <p>Senaste kontroll: <time datetime="2026-09-25">2026-09-25</time></p>
</li>
```

Namn, adress, senaste omdöme och senaste kontrolldatum, i en markup som mättes
identisk vid två hämtningar av samma sida. **Står hela raden oförändrad sedan i
går har ingenting hänt som detaljsidan kan berätta.**

## 6. Valet

Tre ändringar, ingen av dem med färre hämtningar per kommun.

**1. Ett arkiv på disk för svar som bevisligen inte kan ha ändrats**, buret
mellan nätterna av `actions/cache`. Reglerna står i `Arkiv` i
`pipeline/prikko/natverk.py`, och det korta är: arkivet frågar aldrig servern,
alltså får bara oföränderliga svar ligga där, och nyckeln måste bära det som
gör svaret unikt.

* **Svenljunga och Kristinehamn** hade redan var sitt `--cache`, byggt för
  handkörningar. Det som saknades var att bära katalogen mellan nätter. En
  publicerad rapport ändras aldrig; kommunen laddar upp en ny fil med nytt id.
* **Örebro** lägger punkterna för varje avslutad kontroll i arkivet, nycklade
  på kontrollens id. Fönstret är 90 dagar: en kontroll yngre än så hämtas varje
  natt. Av beståndets 5 479 kontroller är 0 yngre än 30 dagar, 98 yngre än 90
  och 5 381 äldre, alltså tar arkivet 98 procent av punktanropen.
* **Uppsala** lägger hela detaljsidan i arkivet med HELA LISTRADEN som nyckel.
  Ändras något alls i raden, även något vi i dag inte läser, räknas den som ny
  och sidan hämtas.

Det som lagras är serverns **råa byte**, aldrig ett tolkat resultat. Rättas en
tolkning i `prikko/sources/` slår rättelsen igenom på hela beståndet nästa
natt, och inte bara på det som råkade hämtas om.

**2. Packade svar.** `prikko/natverk.py` begär gzip och packar upp innan
anroparen ser något. Ingen hämtare ändras, och de två källor som inte packar
svarar precis som förut.

**3. Färre jobb.** Fjorton jobb blir sex. Grupperingen är räknad: en kommun
vars hämtning tar sekunder delar jobb med andra sådana, eftersom minuten ändå
debiteras hel, medan en kommun vars hämtning tar en kvart har ett eget,
eftersom summan av två sådana närmar sig jobbets tidsgräns på en kall natt.

### Rotation prövades och valdes bort

Att hämta tunga kommuner var tredje natt hade sparat minuter genom att göra
datan äldre. Mätningen i avsnitt 4 säger varför det är fel väg: **de kommuner
som ändrar sig minst är också de som blev billigast av arkivet.** Kristinehamn
ändrade noll verksamheter av 170 under tjugo nätter, kostade 16 minuter och
kostar nu under en. Rotation där hade bytt färskhet mot ingenting.

Och de kommuner som faktiskt rör sig, Stockholm och Uppsala, är just de man
minst vill rotera.

## 7. Mätningen efter

Körningen kunde **inte** provas i GitHub, eftersom minuterna är slut. Den är
i stället mätt på den här datorn, med hela bestånd och inte med stickprov, och
sedan räknad om till löparen med löparens egen uppmätta takt.

### Kall mot varm, hela bestånd, 2026-09-28

| kommun | kall | varm | faktor | data |
|---|---:|---:|---:|---|
| Örebro, 1 232 verksamheter, 33 776 kontrollpunkter | 441,9 s | **131,1 s** | 3,4× | **identisk, 0 av 1 232 skiljer** |
| Uppsala, 1 753 verksamheter | 1 021,3 s | **259,5 s** | 3,9× | **identisk, 0 av 1 657 skiljer** |
| Svenljunga, 25 verksamheter | 86,3 s | **1,7 s** | 50× | **identisk** |
| Kristinehamn, 25 verksamheter | 115,7 s | **9,2 s** | 13× | **identisk** |

"Identisk" betyder att filerna jämförts verksamhet för verksamhet och att
ingen enda skiljer, med hämttidsstämpeln undantagen. Det är hela poängen: en
billigare hämtning som ger en annan fil är ingen besparing utan en regression.
Örebros arkiv träffade på 5 367 av 5 367 punkthämtningar, Uppsalas på 1 425 av
1 752 detaljsidor, och Uppsalas resterande 327 var 241 golvhämtningar plus 86
listrader som faktiskt ändrats.

### Ett fynd på köpet, som INTE är orsakat av ändringen

Uppsalas två fullkörningar gav 1 753 respektive 1 752 verksamheter, men bara
1 657 av dem var samma. **96 verksamheter fanns bara i den ena körningen och
95 bara i den andra, utan ett enda gemensamt namn.** De två körningarna ligger
sjutton minuter isär.

Det är inte arkivet. Verksamhetslistan hämtas i sin helhet båda gångerna, och
de 1 657 som fanns i båda var byte för byte lika. Det är `collect_list` som
bläddrar 187 sidor i följd medan kommunens lista sorterar om sig under tiden,
alltså faller några poster mellan sidorna och några räknas två gånger. Samma
sak syntes redan i en tidigare mätning, där ordningen skilde från plats 32.

**Talet är obekvämt just för att det ligger nära spärren.** MAX_MISSING_SHARE
i `load_supabase.py` går vid max(10, 5 %), för Uppsala 87 rader, och 96 är mer
än så. Spärren har alltså med all sannolikhet löst ut och skrivit sin varning
en hel del nätter, vilket är precis vad den ska göra, och det förklarar varför
den exporterade filen bara visar omkring 14 försvunna per natt.

Det här är ett eget fel i Uppsalas sidbrytning, det fanns före den här
ändringen, och det ska lagas för sig.

**EFTERSKRIFT samma dag: det är utrett och lagat, se docs/65.** Kort: kommunen
säger själv 1 868 verksamheter och levererar 1 868 rader på 187 sidor, men
bara omkring 1 760 av dem är olika, eftersom sidfönstren överlappar och
svansen aldrig nås. Spärren löste ut elva av de tolv nätter Uppsala laddades,
men den tolfte, den 21 september, kröp bortfallet under den och 82
verksamheter avpublicerades utan att ha lagt ned. Hämtaren jämför nu mot
kommunens eget antal och slår upp det som saknas på namn, och tre körningar i
följd ger samma 1 868. Nattens nota för Uppsala stiger med omkring 105 anrop,
alltså under två minuter av jobbets nio.

Arkivens storlek, verkligt innehåll: Uppsala 21,8 MB på 1 753 filer, Örebro
2,0 MB på 5 367 filer. De två PDF-cacharna ligger på ett par hundra megabyte
tillsammans och växer bara med nytillkomna rapporter.

### Räknat om till nattens nota

Löparens egen takt är mätt ur körning `35705199227`: Uppsala gjorde 1 940
anrop på 1 879 sekunder, alltså **0,97 sekunder per anrop** mot samma
slutpunkt. Uppsalas nya nota räknas därför rakt ur antalet anrop, som är mätt
och inte gissat: den varma fullkörningen gjorde 187 listsidor plus 327
detaljsidor, alltså 514 anrop, vilket ger 498 s plus tio sekunders omkostnad.

Örebro, Svenljunga och Kristinehamn räknas om med den kall/varm-faktor som
mätts här, vilket är försiktigt: packningen hjälper löparen mer än den hjälper
en svensk uppkoppling, eftersom det är den långa länken som kostar.

| jobb | före | efter | vad som tog bort det |
|---|---:|---:|---|
| Hämta uppsala | 32 | **9** | listraden som nyckel, 1 940 anrop blir 514 |
| Hämta stockholm | 17 | **17** | ingenting, se avsnitt 9 |
| Hämta orebro | 15 | **5** | arkiv på punkterna, 5 367 av 5 367, plus packning |
| Hämta rapporter (svenljunga + kristinehamn) | 24 + 16 = 40 | **2** | PDF-cachen buren mellan nätterna |
| Hämta enkla (åtta kommuner) | 8 | **2** | ett jobb i stället för åtta uppåtrundningar |
| Ladda och exportera | 15 | **15** | ingenting, se avsnitt 9 |
| **per natt** | **127** | **50** | |
| **per månad** | **3 810** | **1 500** | |

Hälsokollen kostar en minut om dygnet, alltså 30 i månaden, och den är orörd.
**Hela kontots nota blir därmed omkring 1 530 av 2 000.** Byggrinden
`kontroll.yml` räknas inte in: den utlöses inte av nattens incheckning,
eftersom GitHub med flit inte startar arbetsflöden från en push som gjorts med
`GITHUB_TOKEN`. Det är kontrollerat i körningslistan.

**En KALL natt, alltså den då GitHubs cache är tom, kostar 120 minuter**: 32
för Uppsala, 17 för Stockholm, 15 för Örebro, 39 för rapporterna, 2 för de
enkla och 15 för laddningen. Det är en natt, inte trettio, och varje jobb
ryms ändå inom sin tidsgräns: den tyngsta gruppen är rapporterna med 38,3
minuter mot taket 45.

**Marginalen till taket blir omkring en fjärdedel.** Den räcker för
ytterligare någon kommun av Örebros storlek utan att notan spränger taket, och
det är med flit: kommunexpansionen i docs/20 är inte klar.

## 8. Vad som händer med färskheten

**Ingenting, för varje kommun hämtas fortfarande varje natt.** Det är
mätningens viktigaste utfall och det var inte givet.

| kommun | hämttakt före | hämttakt efter |
|---|---|---|
| alla tretton | varje natt | varje natt |

Därför står `halsokoll.mjs` kvar på varning vid tre dygn och fel vid tio.
Trösklarna är däremot inte längre två lösa tal: de räknas ur en hämttakt per
kommun i `HAMTTAKT_UNDANTAG`, som i dag är tom. Skulle någon en dag rotera en
kommun är det en rad i den tabellen, och tröskeln följer med av sig själv. Utan
den kopplingen hade en rotation gett en varning varje natt, någon hade höjt
tröskeln för hand, och då hade ingenting varnat den dag kommunen verkligen frös.

### Det enda som faktiskt kan bli äldre, och hur det är hägnat in

Uppsalas **enskilda detaljsida** kan bli upp till sex dygn gammal, och bara
när verksamhetens hela listrad står oförändrad hela tiden. Listraden bär namn,
adress, senaste omdöme och senaste kontrolldatum, så en ny kontroll, ett nytt
omdöme, ett nytt namn eller en ny adress syns samma natt. Det som kan dröja är
en rättelse i en ÄLDRE kontrolls avvikelsepunkter.

Taket på sex dygn är inte en förhoppning. En sjundedel av beståndet hämtas om
varje natt oavsett vad listan säger, valt på verksamhetens eget id så att var
och en kommer i tur exakt en gång per sju nätter. Att det stämmer är testat i
`pipeline/tests/test_natverk.py`, över tusen id och alla sju nätter.

Örebros punkter för en kontroll **yngre än 90 dagar** hämtas varje natt. Äldre
än så läses de ur arkivet. Av 5 479 kontroller i beståndet är 0 yngre än 30
dagar, vilket är kommunens egen karenstid, och 98 yngre än 90.

### Att spärrarna inte kan luras

* **`MAX_MISSING_SHARE` i `load_supabase.py`** slår när mer än max(10, 5 %) av
  en kommuns publicerade bestånd saknas i utlämningen. Arkivet kan inte utlösa
  den: listan över verksamheter hämtas i sin helhet varje natt precis som förr,
  och arkivet avgör bara om DETALJEN hämtas. En verksamhet som förr tappades
  på ett nätverksfel finns nu i stället kvar. Arkivet gör alltså bortfallet
  mindre, aldrig större. Att Uppsalas sidbrytning på egen hand kan ge ett
  bortfall nära spärren är ett annat fel, se avsnitt 7.
* **En kommun utan fil rör inte databasen alls.** `load_supabase.py` och
  `rorelse.py` arbetar per fil och per kommunkod. Faller en hämtning
  avpubliceras ingenting, ingen händelse skrivs, och kommunens
  `last_fetched_at` står kvar på gårdagens, vilket är precis vad hälsokollen
  behöver för att se den bli gammal.
* **`MAX_FEL` i `fetch_orebro.py`** är orörd på 10. Arkivet minskar antalet
  anrop som kan fallera från 6 601 till omkring 1 330, alltså är det svårare
  att nå gränsen, inte lättare.
* **Ingen tolkning är rörd.** Arkivet lagrar källans eget svar, aldrig ett
  tolkat resultat, så en rättelse i `prikko/sources/` slår igenom på hela
  beståndet nästa natt och inte bara på det som råkade hämtas om.

## 9. Vad som inte gjordes, och vad som inte gick

**Stockholm står kvar på 17 minuter.** Källan svarar varken på villkorade
anrop eller med packning, och rutnätssökningen har ingen oföränderlig del att
arkivera: varje ruta returnerar hela beståndet i sitt område. Det som återstår
är att fråga rutorna med ett par arbetare i stället för en, och det är ett
beslut om hur hårt vi får trycka på staden, inte en rättelse. Uppmätt
utrymme: 324 anrop à 3,0 sekunder varav 0,6 är artighetspaus.

**Ladda och exportera står kvar på 15 minuter.** Stegen mäter 359 s för
Supabase, 112 s för exporten och 363 s för IndexNow. **Sex av de femton
minuterna är alltså en löpare som sover** medan Cloudflare Pages rullar ut
bygget, se väntan i `pipeline/indexnow.py`. Det är nattens största kvarvarande
slöseri i minuter räknat, och det ligger i en fil som inte rörts här.

**Uppsala kunde inte lösas med villkorade anrop eller med parallellitet.** Se
mätningarna i avsnitt 5. Servern varken stöder 304 eller packar, och den når
ett tak vid omkring tre svar i sekunden.

**Arkivet i GitHub är den enda del som inte kunnat provas skarpt.** Fetcharna
är körda i full skala här, men `actions/cache` går inte att prova utan
minuter. Två saker är därför byggda så att ett fel blir dyrt och inte farligt:
en tom eller trasig arkivpost räknas som en miss och hämtas om, och ett tomt
arkiv sparas aldrig, eftersom en tom post under prefixet hade blivit den nyaste
och nästa natt hade återställt tomhet.

**Ett jobb som dör tar nu åtta kommuner med sig i stället för en.** Det gäller
bara `enkla`, och bara om själva löparen fallerar: en kommun som fallerar
hoppas över och de andra sju hämtas ändå. Fönstret är 89 sekunder långt.
Priset för det är sex minuter per natt, alltså 180 i månaden, och det är värt
det.

**Uppsalas sidbrytning är inte lagad.** Felet i avsnitt 7 hittades av den här
mätningen men hör inte hit: att laga det är att ändra HUR beståndet läses, och
uppdraget var när och hur ofta. Det ligger som ett eget ärende.

## 10. Beslutet som är ägarens

Repot kan göras publikt, och då är Actions gratis utan tak. **Besparingen är
byggd ändå**, och det är inte trots beslutet utan oberoende av det: 3 810
minuter i månaden för att hämta text är slöseri oavsett vem som betalar, och
de flesta av de minuterna gick åt till att hämta om saker som mätbart stod
still.

Det som är kvar att väga:

**Besparingen är 77 minuter per natt, alltså 2 310 i månaden, eller 61
procent av notan.** Blir repot publikt är det inga kronor, men det är
fortfarande färre anrop mot tretton kommuners webbplatser varje natt, och vi
lever på att de fortsätter tycka om oss:

| kommun | anrop per natt före | efter |
|---|---:|---:|
| Uppsala | 1 940 | **514** |
| Örebro | 6 601 | **omkring 1 330** |
| Svenljunga | 228 | **1** |
| Kristinehamn | omkring 365 | **5** |

Det är omkring 7 280 färre förfrågningar mot fyra kommuners webbplatser varje
dygn,
och det är ett värde i sig oavsett vad Actions kostar.

**Det som talar för att göra repot publikt ändå** är att taket då inte kan
stoppa nattjobbet igen. Den 23 september gjorde det just det, och ingenting
larmade förrän hälsokollen också var död, vilket den blev av samma orsak.

**Det som talar emot** ligger inte i det här dokumentet.
