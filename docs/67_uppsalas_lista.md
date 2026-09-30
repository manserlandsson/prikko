# 65. Uppsalas lista var aldrig hel

**Datum:** 2026-09-28
**Vad det här är:** ett fel som är belagt, mätt och lagat, plus det som felet
hann ställa till med i databasen.
**Vad som behövs:** ingenting av ägaren. En sak är värd att veta om, och den
står i avsnitt 8.

Felet hittades som en bieffekt av kostnadsarbetet i docs/64, avsnitt 7. Där
räckte det till en notering. Det här dokumentet är själva mätningen.

---

## 1. Kort sagt

Uppsalas Livsmedelskollen skriver själv ut hur många verksamheter den har,
`<span class="count">1868</span>` överst i listan, och bläddrar man igenom alla
187 sidor får man exakt 1 868 rader. **Bara 1 741 till 1 781 av dem är olika**,
mätt över sex genomgångar. Resten är dubbletter, och lika många verksamheter
kommer aldrig med.

Vilka som faller bort växlar från gång till gång. Två genomgångar sjutton
minuter isär gav 1 781 respektive 1 741 unika, med 1 682 gemensamma.

Bortfallet har legat på i genomsnitt **128 verksamheter per natt sedan 4
september**, alltså 6,9 procent av Uppsalas bestånd, och det har utlöst
spärren i `load_supabase.py` **elva av de tolv nätter Uppsala laddades**. Den
tolfte natten föll bortfallet strax under spärren, och då avpublicerades 82
verksamheter som aldrig hade lagt ned.

## 2. Vad som faktiskt går sönder

Läs raderna i tur och ordning, så syns det. Sidorna nedan är ur ett litet
snitt av listan, 76 verksamheter på 8 sidor, hämtade två gånger var med
identiskt svar båda gångerna:

    sida 1  … 1598151094, -2090090650
    sida 2  -2090090650, -1506727322 …
    sida 3  … 2024780737, -2084940625
    sida 4  -1903852155, -1350703362, 2024780737, -2084940625 …
    sida 7  … -1466931134, -964107762, 1826596424
    sida 8  -1466931134, -964107762, 1826596424, -176602624 …

**Fönstren överlappar.** Sida 2 börjar på den rad sida 1 slutade med, sida 4
bär två rader som redan stod på sida 3. Ordningen ligger alltså inte still
mellan två sidhämtningar, och eftersom antalet sidor räknas ur antalet
verksamheter når bläddringen aldrig fram till slutet. Svansen går inte att nå:
sida 9 och framåt svarar tomt.

Varför ordningen glider syns i sorteringen. Listan sorteras på senaste
kontrolldatum, och **641 av de 1 868 verksamheterna har ingen kontroll alls**
och därmed inget sorteringsvärde. De ligger sist, och det är där det mesta
försvinner. Av de 87 respektive 127 dubbletterna i två fulla genomgångar låg
83 och 123 på sidorna 121 och framåt, alltså precis i det odaterade blocket.

Att det är sorteringen och inte tiden syns på att en enskild sida står helt
still: samma sida hämtad tre gånger i rad ger samma tio rader, och en
cachebrytare i adressen ändrar ingenting. Det är först när man jämför två
OLIKA sidnummer som ordningen visar sig ha flyttat på sig.

Det är samma fel som `pipeline/prikko/sidbrytning.py` beskriver för våra egna
läsningar ur Supabase, och slutsatsen är densamma: **en sidhämtning utan unik
ordning lämnar tyst ifrån sig en ofullständig lista.** Skillnaden är att där
kunde vi lägga till en unik sorteringsnyckel. Uppsalas gränssnitt tar inte
emot någon.

## 3. Vad som prövades mot kommunens gränssnitt

Allt mätt 2026-09-28, med samma artighetspaus på 0,3 sekunder och en tråd, och
alltså utan att trycka hårdare på kommunen än hämtaren redan gör.

| väg | utfall |
|---|---|
| **Fler rader per sida.** `pagesize`, `pageSize`, `PageSize`, `size`, `take`, `perPage`, `per_page`, `count`, `pageCount`, `itemsPerPage`, `limit`, `rows`, `hitsPerPage`, `top`, `n` | Alla ignoreras. Sidan ger tio rader, varje gång. |
| **Stabil sortering.** `sort`, `sortBy`, `orderBy`, `order`, `sortorder` | Ignoreras likaså. Formuläret har ingen sorteringskontroll att härma. |
| **Läsa om tills två läsningar stämmer.** | Konvergerar inte. Sex genomgångar i följd av samma snitt gav exakt samma 118 av 129, och samma 208 av 251. Samma fråga ger samma ordning, alltså samma tapp. |
| **Bläddra förbi sista sidan.** | Tomma svar från sida 9 av 8, sida 14 av 13. Svansen finns inte att hämta. |
| **Dela upp listan i snitt.** | Bär, men inte ensam. Se nedan. |

Filtren `selectedTypes` (fyra värden) och `selectedResults` (tre) är exakta
uppdelningar: 718 + 551 + 247 + 352 = 1 868, och 1 175 + 52 + 641 = 1 868, och
korstabellen med tolv celler summerar också till 1 868. Varje snitt är en egen
fråga hos kommunen, alltså en egen ordning med ett eget tapp, så unionen av
flera snitt växer. Men den stannar:

| snitt över de 641 odaterade | unionen | anrop hittills |
|---|---:|---:|
| fyra typsnitt | 548 | 66 |
| plus hela snittet `selectedResults=2` | 627 | 131 |
| plus typparen 0+1 och 2+3 | 635 | 196 |
| plus typparen 0+2 och 1+3 | 640 | 261 |

Med de daterade inräknade blev en runda om 385 anrop 1 864 av 1 868. Unionen
av allt som lästes den dagen, över ungefär en timme, blev **exakt 1 868**, och
det är beviset för att kommunens eget antal stämmer och att alla 1 868 finns.

## 4. Vad som valdes

Tre steg, och det dyra körs bara när de billigare inte räckt. Koden ligger i
`collect_list` i `pipeline/fetch_uppsala.py`.

**1. Bläddra listan som förut, 187 sidor, och jämför med kommunens eget antal.**
Stämmer de är listan bevisligen fullständig och resten hoppas över. Kommunens
antal är facit, och det är den enda nya sanningskällan i hela lösningen.

**2. Namnkontrollera det som saknas.** En liggare i arkivet bär gårdagens
verifierade lista med namn och adress. Varje id i liggaren som inte kom med i
bläddringen slås upp med `?query=<namn>`, ett anrop. Hittas det inte på namnet
prövas adressen, för namnet kan ha bytts. Det som inte går att återfinna på
någotdera är borta på riktigt, och **det är den enda vägen en verksamhet får
försvinna ur hämtningen.**

Sökningen mättes innan den fick bära något: trettio uppslag av trettio hittade
rätt verksamhet, tjugoåtta av dem som enda träff, och två skräpsökningar gav
noll träffar. Listraden ur en sökning är dessutom byte för byte samma rad som
ur listan, kontrollerad på tolv verksamheter, vilket betyder att arkivnyckeln i
fetch_uppsala.py fortsätter hålla för de rader som kommer in den vägen.

**3. Läs fler snitt om antalet fortfarande inte stämmer.** Det som återstår då
är verksamheter som är nya sedan i går OCH föll bort i bläddringen. Snitten
läses i tur och ordning tills antalet stämmer, aldrig fler än fyra, och
läsningen slutar så snart ett snitt inte gav något nytt.

Hela lösningen hänger på att `<span class="count">` finns kvar. Försvinner det
faller hämtningen med ett fel i stället för att lämna en halv lista, och
Uppsala står över natten med gårdagens data. Utan facit går det varken att
räkna sidor eller att veta om listan blev hel, och en tyst halv utlämning är
precis det som skapade det här dokumentet.

**Ordningen i utfilen sorteras nu på id.** `dedupe_slugs` numrerar
namnkrockar positionellt, så en filordning som kastas om mellan två körningar
flyttar sluggen mellan två likanämnda verksamheter. Listans egen ordning är
just en sådan. Uppsala har gott om krockar av den sorten: natten till den 21
september loggade inläsningen sexton par där `reconcile_slugs` fick avvisa den
slug hämtaren föreslog, bland dem `uppsala-bazar` mot `uppsala-bazar-2` i båda
riktningarna samma natt.

### Vad som INTE gjordes

**`MAX_MISSING_SHARE` är orörd.** Spärren har gjort exakt det den ska göra
elva nätter i rad, och den är det enda som hindrat felet från att synas för
besökaren. Att höja den för att slippa varningen hade varit att ta bort
brandvarnaren.

**Ingen extra parallellitet, ingen kortare paus.** Notan steg med ett uppslag
per saknat id, alltså omkring 105 anrop per natt, och de går ett i taget med
samma 0,3 sekunder emellan som förut.

## 5. Beviset: tre körningar i följd ger samma mängd

Liggaren börjar tom, alltså är första körningen den sämsta. Den behöver den
inte vara mer än en gång.

| körning | bläddringen gav | namnkontroll | extra snitt | resultat |
|---|---:|---|---|---:|
| 1, tom liggare | 1 754 av 1 868 | ingen liggare att fråga | fyra snitt, 123 sidor | **1 857** |
| 2 | 1 764 av 1 868 | 103 saknade, 102 återfanns, 1 var borta | fyra snitt | **1 867** |
| 3 | 1 762 av 1 868 | 105 saknade, 105 återfanns | ett snitt | **1 868** |
| 4 | 1 763 av 1 868 | 105 saknade, 105 återfanns | inget behövdes | **1 868** |

**Körning 3 och 4 gav samma 1 868 verksamheter, id för id, och båda mängderna
är identiska med de 1 868 som en timmes mätning hade grävt fram oberoende.**
Körning 4 kostade 187 sidor plus 106 uppslag och tog 140 sekunder.

Jämför med hur det såg ut innan: två körningar i följd med den gamla koden gav
1 781 och 1 741, med 1 682 gemensamma, alltså 99 respektive 59 verksamheter
som bara fanns i den ena.

## 6. Har någon annan kommun samma fel?

Alla hämtare som hämtar sitt bestånd i flera steg kördes två gånger i följd
och jämfördes på id. **Talen för de friska står med, för det är den jämförelsen
som visar att felet är Uppsalas och inte allas.**

| kommun | hur beståndet hämtas | körning a | körning b | skiljer |
|---|---|---:|---:|---:|
| **Uppsala, före** | 187 listsidor i följd | 1 781 | 1 741 | **99 och 59** |
| **Uppsala, efter** | listan, liggaren, snitt | 1 868 | 1 868 | **0 och 0** |
| **Stockholm** | 324 rutnätsrutor, id-deduplicerade | 8 545 | 8 545 | **7 och 7** |
| Örebro | ett listanrop, sedan en sida per verksamhet | 1 232 | 1 232 | 0 |
| Linköping | ett listanrop plus fyra ArcGIS-sidor | 1 247 | 1 247 | 0 |
| Norrköping | en Ecos-fil | 1 022 | 1 022 | 0 |
| Jönköping | fem ArcGIS-lager | 1 148 | 1 148 | 0 |
| Karlstad | fyra WFS-lager | 697 | 697 | 0 |
| Borgholm | en PDF-tabell | 406 | 406 | 0 |
| Höganäs | tre filarkivmappar | 316 | 316 | 0 |
| Oskarshamn | ett lager | 244 | 244 | 0 |
| Lomma | fyra gruppsidor | 153 | 153 | 0 |

Linköpings ArcGIS-hämtning använder `resultOffset` utan `orderByFields`, vilket
är samma sorts sidhämtning som kan glida. Den gör det inte: två körningar gav
identiska loggrader, 790 anläggningsrader och 2 744 tillsynsrader båda
gångerna, och identiska id-mängder.

**Stockholm har en liten variant av samma sjuka, och den är inte Uppsalas.**
Sju av 8 545 skilde åt båda hållen, alltså 0,08 procent mot Uppsalas 5,3. Sex
av de sju som bara fanns i den ena körningen ligger på Kungsgatan,
Strandvägen, Storgatan, Kungsträdgårdsgatan, Mäster Samuelsgatan och
Klarabergsgatan, alltså inne i den enda rutnätsruta som båda körningarna
rapporterade som full: `ruta 225 nådde taket (1500)`. Hämtaren varnar redan
själv om det och säger vad som ska göras, `minska GRID_STEP`. Det är en egen
sak att laga, och den ligger inte i den här ändringen.

## 7. Vad felet hann ställa till med

### Spärren, natt för natt

Varningen står i `deactivate_missing` i `pipeline/load_supabase.py` och lyder
`Stort bortfall`. Läst ur körningsloggarna med `gh run view --job <id> --log`,
för varje natt Uppsala faktiskt laddades:

| natt | saknade av publicerade | spärren |
|---|---:|---|
| 4 sep | 147 av 1 863 | löste ut |
| 5 sep | 153 av 1 863 | löste ut |
| 9 sep | 169 av 1 869 | löste ut |
| 10 sep | 97 av 1 869 | löste ut |
| 14 sep | 95 av 1 854 | löste ut |
| 16 sep | 109 av 1 834 | löste ut |
| 17 sep | 157 av 1 851 | löste ut |
| 18 sep | 128 av 1 851 | löste ut |
| 19 sep | 116 av 1 853 | löste ut |
| 20 sep | 119 av 1 855 | löste ut |
| **21 sep** | **82** | **under spärren, 82 avpublicerades** |
| 22 sep | 115 av 1 836 | löste ut |

**Elva av tolv nätter.** Genomsnittet över de elva är 128 verksamheter, alltså
6,9 procent. Spärren går vid `max(10, 5 %)`, för Uppsala omkring 92.

Slutsatsen som skulle prövas var att spärren löst ut varje natt och att ingen
verksamhet någonsin avpublicerats i Uppsala. **Den första halvan stämmer nästan,
den andra inte.** Den 21 september kröp bortfallet under spärren och 82
verksamheter avpublicerades, varav 19 fortfarande ligger dolda trots att
kommunen listar dem. Det är precis det spärren inte kan skydda mot: **ett litet
bortfall är farligare än ett stort, för det släpps igenom.**

### Läget i databasen mot kommunens verkliga lista på 1 868

Läst 2026-09-28 på kvällen, alltså med den gamla hämtaren som senaste
inläsning.

| | antal |
|---|---:|
| publicerade Uppsala-verksamheter i databasen | 1 836 |
| avpublicerade rader som ligger kvar | 40 |
| **publicerade men finns inte i kommunens lista** | **2** |
| **i kommunens lista men avpublicerade hos oss** | **19** |
| **i kommunens lista men saknas helt hos oss** | **15** |

Sajten visar alltså två verksamheter kommunen slutat lämna ut, och saknar 34
som kommunen listar. De 19 kommer tillbaka av sig själva vid nästa lyckade
inläsning, eftersom upserten skriver `active` på nytt.

### Nytt och borta

Rörelseloggen började den 14 augusti och har 30 utlämningar för Uppsala.

| kommun | publicerade | perioder som försvann | verksamheter som försvann | per 1 000 publicerade |
|---|---:|---:|---:|---:|
| **Uppsala** | 1 836 | **146** | **133** | **72** |
| Stockholm | 8 536 | 53 | 29 | 3,4 |
| Jönköping | 1 143 | 1 | 1 | 0,9 |
| alla övriga | | 0 | 0 | 0 |

**Uppsala har tjugoen gånger Stockholms försvinnanderytm per publicerad
verksamhet**, och Stockholm är den kommun som faktiskt har omsättning. Talen
är fantomer, inte nedläggningar.

Att ingenting av det syntes på sajten, `borta` står på noll för Uppsala, är
inte spärrens förtjänst. Spärren skyddar `active`-flaggan, inte loggen.
Observationerna ligger kvar i `establishment_spells` och kan inte skrivas om i
efterhand, det är hela poängen med en logg. Tre andra saker råkade hålla:

* **`CONFIRM_ABSENCES`.** Ett försvinnande måste synas i två utlämningar i rad
  innan det får publiceras. Fantomerna växlar från natt till natt, alltså
  missar samma verksamhet sällan två nätter i följd.
* **Klassningen `uncontrolled`.** 124 av Uppsalas försvinnanden gäller rader
  som aldrig burit en kontroll, och ett sådant försvinnande publiceras aldrig.
  Det är just de odaterade, alltså exakt de rader sidbrytningen tappar mest av.
* **Fjorton dagars fördröjning** innan ett försvinnande får visas.

Tre spärrar som var och en byggdes för något annat. Ingen av dem var ett skydd
mot det här felet, och den 21 september räckte de inte.

## 8. Vad som händer när spärren slutar lösa ut

Frågan var om månaders uppdämda nedläggningar skulle avpubliceras på en gång
den natt hämtningen börjar fungera. **Det blir två.**

Räknat genom att ställa databasens 1 836 publicerade Uppsala-rader mot de 1 868
kommunen faktiskt listar: två rader är publicerade utan att finnas kvar i
listan, `Pizza Hut` och `Panda grill & livs`. Ingen uppdämning alltså, och
inget som behöver hanteras särskilt. Skälet är att avpubliceringen aldrig var
den flaskhals som höll igen: kommunen tar inte bort särskilt mycket, och de 133
som loggen tror har försvunnit var aldrig borta.

Första natten efter ändringen kommer i stället att göra tvärtom: 19
verksamheter publiceras på nytt och 15 tillkommer. De 34 hamnar inte på
`Nytt och borta`, och det är med flit. `rorelse.py` klassar ett tillskott över
`BULK_ROWS`, alltså 25 rader på en natt, som en omläggning av registret och
inte som nyheter, och en omläggning publiceras aldrig. Den natten kommer
alltså att synas i loggen som `bulk` och inte på sajten, vilket är rätt: det
är vår hämtning som blivit hel, inte Uppsala som fått 34 nya restauranger.

## 9. Vad som återstår

* **Stockholms rutnätsruta 225** går i taket på 1 500 poster och tappar en
  handfull om natten. Hämtaren säger det själv i loggen. Lagas genom att
  minska `GRID_STEP`, vilket kostar fler rutor och alltså fler anrop, och det
  är ett eget beslut om vad natten får kosta.
* **Kommunens eget antal ligger nu i utfilen** som `listedCount` och
  `listComplete`. Ingenting läser fälten ännu. Den dag `load_supabase.py`
  gör det kan en kortare utlämning än registret vägra avpublicera oavsett hur
  liten skillnaden är, och då försvinner även hålet den 21 september föll
  igenom.
* **Liggaren ligger i arkivet** och bärs mellan nätterna av samma
  `actions/cache` som detaljsidorna. Går cachen förlorad börjar första natten
  om på 1 857 av 1 868 och är hel igen natten därpå, vilket körning 1 till 3
  ovan visar.
