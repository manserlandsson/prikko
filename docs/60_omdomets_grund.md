# 60. Grunden bakom "Brister som kvarstår"

**Datum:** 2026-09-05
**Beställning:** sajten påstod att kommunen gjort en uppföljning som aldrig
skett, om namngivna företag, under vårt hårdaste omdöme.
**Vad som ändrades:** den förklarande meningen, som nu är en funktion av
grunden. Ingen omgradering. Etiketten "Brister som kvarstår" står orörd,
`grading.py` har inte fått en enda tröskel ändrad och `MODEL_VERSION` är kvar
på 5.

---

## 1. Felet

`site/src/lib/site.ts` gav omdömet `major` en fast mening: **"har brister som
inte åtgärdats vid kommunens uppföljning"**. Verksamhetssidan limmade på
senaste kontrollens datum och skrev ut den i `<meta name="description">`, i
JSON-LD och i sidans egen text.

`pipeline/prikko/grading.py` sätter `major` på tre grunder, och bara en av dem
är en uppföljning. `_is_persisting()` har två grenar och gren 2 är ren
upprepning: föregående kontroll hade också avvikelser. Där finns inget
återbesök alls.

Riche i Stockholm sade tre saker som inte gick ihop på samma skärm:

| Var på sidan | Vad det stod |
|---|---|
| Överst | brister som inte åtgärdats vid kommunens uppföljning den 17 februari 2026 |
| Vad uppföljningen visade | den enda uppföljningen skedde 28 november 2019, inga anmärkningar |
| Kontrollhistoriken | 17 februari 2026 var en planerad kontroll, oanmäld |

## 2. Talen

Räknat över `site/src/data/*.json` 2026-09-05, med femårsfönstret och
`HISTORY_DEPTH = 3` ur `grading.py`. **403 verksamheter har `major`.**

Två uppdelningar av samma 403, beroende på vilken gren som prövas först:

| Grund | Om kommunens tvåa prövas först | Om återbesöket prövas först |
|---|---:|---:|
| Återbesök som senaste kontroll | 198 (49,1 %) | **268 (66,5 %)** |
| Kommunens egen tvåa | 75 (18,6 %) | **5 (1,2 %)** |
| Härledd upprepning, ingen uppföljning | 130 (32,3 %) | **130 (32,3 %)** |

Skillnaden är att 70 sidor är **både** ett återbesök och en tvåa: Örebro 52,
Uppsala 11, Linköping 7. Koden prövar återbesöket först, eftersom det är den
starkare bevisade grenen och gör meningen sann. Upprepningsgruppen är densamma
i båda uppdelningarna; den är resten.

Upprepningarna per kommun: Stockholm 90, Svenljunga 16, Örebro 13,
Norrköping 6, Linköping 4, Höganäs 1.

**På 130 av 403 sidor, alltså 32,3 procent, påstod vi alltså ett besök som
inte finns i datan.**

## 3. Vad tvåan betyder i varje kommun

Frågan i beställningen var om `assessment == 2` betyder samma sak överallt.
Det gör den inte. Genomgång av `pipeline/prikko/sources/`, alla kommuner där
värdet över huvud taget kan uppstå:

| Kommun | Var tvåan kommer ifrån | Är det en uppföljning? |
|---|---|---|
| Linköping | `"Kvarstår"`, kommunens eget värde | **Ja**, kommunens egen definition är "inte åtgärdad vid uppföljning" |
| Linköping | `"Ej godtagbar"`, alltså underkänd | **Nej**, en bedömning av kontrollen själv |
| Uppsala | `"Avvikelse kvarstår"` | **Ja**, kommunen säger det själv |
| Örebro | härledd av oss ur kontrollpunkter märkta `"Kvarstår"` | **Ja i praktiken**, men omdömet är vårt, se fällan nedan |
| Lomma | röd prick | **Nej**, kommunens läsanvisning definierar rött som avvikelser med myndighetsåtgärd, föreläggande eller förbud |
| Stockholm | `Judgement` 2 och 3, "återbesök krävs" | **Nej**, ett krav på uppföljning är inte en genomförd uppföljning |
| Höganäs | röd färg i filnamnet | ingen post har den, 0 filer |
| Oskarshamn | `"Ej godtagbar"`, gamla modellens underkänt | ingen post har den, 0 rader |

Två saker faller ut av tabellen.

**Talet 130 ska inte upp.** De enda tvåor som inte är återbesök i beståndet är
fem sidor: Linköping 3 med `"Ej godtagbar"` och Lomma 2 med röd prick. Båda är
kommunens EGEN högsta nivå, satt vid en kontroll som inte är ett återbesök,
och meningen för den grenen säger precis det och ingenting mer. De 3
Linköpingssidorna är kontrollerade en och en: ingen kontrollpunkt är märkt
`"Kvarstår"`, alltså är de `"Ej godtagbar"` och inte `"Kvarstår"`. Stockholms
tvåa finns inte i beståndet alls; deras `major` kommer helt från mönstret.

**Fällan som ska bevakas.** Örebro publicerar inget helhetsomdöme per kontroll.
Deras tvåa räknas fram av oss i `assessment_from_areas()`. Alla 52 är i dag
återbesök och hamnar därför i den grenen. Dyker en `"Kvarstår"`-punkt upp på en
PLANERAD Örebrokontroll hamnar sidan i grenen `stated`, och meningen skulle
tillskriva Örebro ett omdöme kommunen inte gett. Uppmätt är det noll sidor.
Blir talet större än noll ska grenen delas, inte formuleringen tänjas. Står i
`lib/omdome.ts` intill koden.

## 4. De tre meningarna

Ordagrant, som de står i `MAJOR_SENTENCE` i `site/src/lib/omdome.ts`. Var och
en tar ett datumled efter sig, `den <datum>`, precis som de övriga i `VERDICT`.

| Grund | Meningen | Sidor |
|---|---|---:|
| `followup` | fick anmärkningar vid kommunens återbesök | 268 |
| `stated` | fick kommunens allvarligaste omdöme vid hygienkontrollen | 5 |
| `repeat` | fick anmärkningar igen vid hygienkontrollen | 130 |

Utskrivna, en ur varje grupp, lästa ur bygget:

> Monster Chicken, Birger Jarlsgatan fick anmärkningar vid kommunens återbesök
> den 11 augusti 2026.

> Augusta glass fick kommunens allvarligaste omdöme vid hygienkontrollen den
> 14 augusti 2025.

> Riche fick anmärkningar igen vid hygienkontrollen den 17 februari 2026.

Tre saker ingen av dem gör, och som den gamla gjorde: påstår ett besök som
inte finns i datan, tillskriver kommunen en bedömning den inte gjort, eller
låter hårdare än vad grunden bär.

Ordvalen är mätta mot datan, inte smak:

- **"återbesök"** är kommunens egen uppmärkning på kontrollen, samma ord som
  `INSPECTION_TYPE_LABEL[1]` och samma ord som står på raden i
  kontrollhistoriken längre ned på sidan. Meningen säger ingenting om
  kontrollen FÖRE, eftersom den inte alltid finns hos oss: Karlstads 219
  återbesök är den äldsta raden i registret.
- **"igen"** är hela påståendet i upprepningsgrenen, och det är exakt vad gren
  2 i `_is_persisting()` bevisar. En räknad variant, "för andra kontrollen i
  rad", förkastades: streckens längd bland de 130 är 2 hos 98, 3 hos 23, 4 hos
  5, 5 hos 1 och 6 hos 2, så en fast ordningsföljd hade varit fel på 31 sidor,
  och att skriva ut hela streckens längd hade varit ett hårdare påstående än
  modellen gör, eftersom `grading.py` bara läser en kontroll bakåt.

**Etiketten är oförändrad.** "Brister som kvarstår" är sann på alla tre
grunderna och sitter i märket, kartan, listorna, API:t och delningsbilderna.

## 5. Grunden härleds på sajten, ingen ny pipelinekörning

Grunden går att läsa exakt ur `inspections`, som redan följer med i
datafilerna. Alltså inget nytt fält i `Assessment`, ingen kolumn i databasen
och ingen nattlig körning, och därmed heller ingen beröring med `FILFALT` och
`KONTROLLFALT` i `pipeline/export_supabase.py`.

Kontrollerat: för samtliga 403 sidor är `inspections[0]` samma kontroll som
`recent[0]` i `grading.py`, eftersom en bedömning kräver en kontroll inom
femårsfönstret och exporten sorterar nyast först.

Kontrollerat att resten verkligen är en upprepning: 129 av de 130 bär
avvikelser redan vid kontrollen närmast före. Den enda som inte gör det, Lilla
Pralinen i Linköping, har två kontrollrader på samma datum 2023-04-14 där den
ena bär en tvåa och den andra en nolla. Upprepningen finns, men ett steg
längre in i historiken, inom `HISTORY_DEPTH = 3`.

## 6. Var samma påstående stod på fler ställen

| Fil | Vad som stod | Vad det blev |
|---|---|---|
| `lib/site.ts` | `VERDICT.major.sentence`, den fasta meningen | reservtext, den riktiga väljs per sida |
| `lib/site.ts` | kommentaren som motiverar etiketten: "kommunen påpekade något, kom tillbaka, och det var inte åtgärdat" | beskriver nu alla tre grunderna |
| `pages/[kommun]/[slug].astro` | citerade den gamla meningen i en kommentar | citerar en av de tre, märkt som exempel |
| `lib/api.ts` | kodlistan: "Brister som inte åtgärdats vid kommunens uppföljning." | räknar upp alla tre grunderna |
| `components/RemarkHub.astro` | "varav N där bristerna kvarstår efter uppföljning" | "varav N med brister som kvarstår" |
| `components/RemarkHub.astro` | länken till matsnusk: "där bristerna kvarstod efter uppföljning" | "där bristerna kvarstår" |
| `pages/[kommun]/matsnusk.astro` | svarsmeningen: "inte var åtgärdade vid kommunens uppföljning" | bär etiketten, grunden lämnas till raden |
| `pages/[kommun]/matsnusk.astro` | modulhuvudet och kommentaren som själv noterade att den upprepade site.ts | rättade |
| `lib/matsnusk.ts` | modulhuvudet: "kommunen påpekade brister, kom tillbaka" | rättat |
| `lib/matsnusk.ts` | krav 1 i "De fyra kraven", som räknade två av tre grunder | räknar tre |
| `styles/maskot-rorelse.css` | kommentar: "brister som kvarstår efter kommunens uppföljning" | rättad |
| `docs/24_maskotprogram.md` | "listar ställen där brister kvarstod efter kommunens uppföljning" | rättad |

Matsnusklistan var värst efter verksamhetssidan: **51 av Stockholms 64 rader
och 9 av Örebros 92 vilar på upprepning**, alltså utan något återbesök.
`groundText()` har skiljt på de tre grunderna sedan den skrevs; det var
sammanfattningarna ovanför raderna som drog alla tre över en kam. En av de tre
radtexterna behövde ändå lagas, se avsnitt 6b.

**Friat efter kontroll.** Delningsbilden bär ingen bedömning alls, med skrivet
skäl. Dekalen ritar bara etiketten. Atom-flödena skriver källans egen
`assessment` med Sambruks ord ("Kvarstående avvikelse") och påstår ingen
uppföljning. Metodiksidans nivåbeskrivning räknade redan upp alla tre
grunderna. Artiklarna beskriver modellen generellt och gör det korrekt.
`punktstatistik.ts` och `kommunprofil.ts` talar om kontrollpunkter märkta
"Kvarstår", vilket är kommunens eget ord på en punkt, inte vårt omdöme.

## 6b. Matsnusklistans radtext för kommunens tvåa

Fanns kvar efter första rundan och rättades 2026-09-05 i samma vända som
`grading.py`:s docstring, se avsnitt 6c.

Raden sade **"Kommunens bedömning av kontrollen är kvarstående avvikelse"**
för grunden `stated`. Det är fel för Örebro, som publicerar **inget
helhetsomdöme per kontroll**. Deras tvåa räknas fram av oss i
`assessment_from_areas()`, ur kontrollpunkter märkta "Kvarstår". Meningen
tillskrev alltså kommunen ett omdöme den aldrig gett, vilket är exakt samma
familj av fel som den fasta meningen om en uppföljning.

Vilka kommuner som kan hamna i grenen, av beståndets 182 matsnuskrader:

| Kommun | Rader med `stated` | Varifrån tvåan kommer | Renderas i dag |
|---|---:|---|---|
| Örebro | 43 | punkter märkta "Kvarstår", tvåan härledd av oss | ja, sidan finns |
| Uppsala | 11 | "Avvikelse kvarstår", kommunens eget omdöme | nej, under gränsen |
| Linköping | 6 | "Kvarstår", kommunens eget omdöme | nej, under gränsen |
| Stockholm | 0 | deras skala saknar en tvåa helt | sidan finns |
| **Summa** | **60** | | **43 syns** |

Bara Örebro och Stockholm når `MIN_MATSNUSK_PAGE` = 25, så 43 av de 60
renderas. Uppsalas 11 och Linköpings 6 väntar på att sin kommun ska nå
gränsen, och texten måste hålla den dagen den gör det.

**Samtliga 60 bär minst en kontrollpunkt märkt "Kvarstår."** Därför säger
grenen numera just det, alltså kommunens egen uppmärkning på raden i stället
för ett omdöme om kontrollen:

> Vid kontrollen har Örebro kommun märkt 2 avvikelser som kvarstående.

Ordet står dessutom i avvikelselistan direkt under meningen, som
`AREA_STATUS_LABEL.persisting`, så läsaren kan pricka av påståendet mot
raderna. Utfallet i bygget: 31 rader med 1 avvikelse, 9 med 2, 2 med 3 och 1
med 5, alltså 43.

**Ett andra fall är skrivet fast det är tomt i dag.** Kommunens egen högsta
nivå UTAN någon kvarstående punkt är Linköpings "Ej godtagbar" och Lommas
röda prick. Noll rader, eftersom Lommas två kontroller ligger 2 respektive 22
dagar utanför `MATSNUSK_WINDOW_DAYS`, alltså strax utanför. Fallet får en egen
mening, för den som passar Örebro passar inte där:

> Lomma kommuns egen bedömning av kontrollen är den allvarligaste nivån.

## 6c. `_is_persisting()` kallade sig själv en uppföljning

Samma missvisande ord, en nivå ned. Docstringen lydde **"Har avvikelsen
överlevt en uppföljning?"** och beskrev sedan två grenar där gren 2 inte
innehåller någon uppföljning alls. Det är den formuleringen som läckte ut på
sajten till att börja med, och nästa läsare hade trott att båda grenarna
bevisar ett återbesök.

Rättat till **"Är avvikelsen mer än en engångsnotering?"**, med gren 1 märkt
ÅTERBESÖK och gren 2 märkt UPPREPNING och en utskriven mening om att ingen
uppföljning finns i datan där. Modulhuvudets stycke om varför allvarsgraden
härleds ur mönstret har fått samma påpekande, med hänvisning hit.

**Ingen tröskel rörd, `MODEL_VERSION` kvar på 5.** Diffen mot `grading.py`
innehåller inte en enda kodrad, bara docstring.

## 7. "Vad uppföljningen visade" och dess ålder

Blocket är oförändrat i sak. Den långa motiveringen i `FollowUp.astro` står
kvar, och tystnaden fylls fortfarande inte.

Det som saknades var bandet till kontrollen omdömet vilar på. På Riche stod
ett block om 2019 rakt under ett omdöme om 2026 utan att något sade att de
handlar om olika tillfällen.

Uppmätt över 4 866 sidor som ritar blocket:

| | Sidor | Andel |
|---|---:|---:|
| Senare kontroll finns över huvud taget | 2 777 | 57,1 % |
| Mer än 180 dagar senare | 2 428 | 49,9 % |
| **Mer än 365 dagar senare** | **1 879** | **38,6 %** |
| Mer än 730 dagar senare | 1 226 | 25,2 % |

Median 176 dagar, största avstånd 3 090 dagar. Riche ligger på 2 273.

**Tröskeln är ett år**, inte 180 som `FOLLOW_UP_DAYS`. De två talen svarar på
olika frågor: `FOLLOW_UP_DAYS` avgör om två kontroller hör ihop, det här talet
om läsaren riskerar att läsa blocket som ett besked om nuläget. Under ett år
ligger uppföljningen inom ett ordinarie kontrollintervall, medianen mellan två
kontroller i beståndet är 267 dagar. Vid 180 dagar hade tillägget stått på
varannan sida, och en brasklapp som står på varannan sida slutar läsas.

Tillägget står i blockets egen text, inte som en ny yta, och påstår ingenting
om utfallet:

> Kommunen har kontrollerat verksamheten senare än så, senast den 17 februari
> 2026. Det som står överst på sidan gäller den kontrollen.

Räknat i bygget: 1 879 sidor bär tillägget, exakt vad mätningen gav.

## 8. "0 dagar senare"

Blocket skrev "kom tillbaka 0 dagar senare" på **488** av de 3 907 sidor som
ritar den härledda formen, och "1 dag senare" på **186**.

Noll dagar betyder att kommunen registrerat båda kontrollerna på samma datum,
och då är "kom tillbaka" dessutom mer än datan bär: vi vet att registret har
två rader, inte att någon gick ut och in igen.

| Fall | Vad det står nu | Sidor |
|---|---|---:|
| 0 dagar | Stockholms stad registrerade ett återbesök samma dag och … | 488 |
| 1 dag | Stockholms stad kom tillbaka dagen efter, den 18 februari 2026, och … | 186 |

Räknat i bygget: 488 respektive 186, exakt vad mätningen gav.

## 9. Verifiering

Bygge ur egen worktree med `--outDir dist-omdome`, 17 892 sidor, 18 172 filer.
Sökt igenom hela bygget: **noll förekomster** av "brister som inte åtgärdats
vid kommunens uppföljning", "kvarstår efter uppföljning", "kom tillbaka 0
dagar" och "kom tillbaka 1 dagar".

En sida ur varje grupp öppnad i byggd form och läst mot sidans egen historik:
Riche (upprepning), Monster Chicken Birger Jarlsgatan (återbesök), Augusta
glass i Lomma och Havana Förenings Cafe i Linköping (kommunens tvåa).
