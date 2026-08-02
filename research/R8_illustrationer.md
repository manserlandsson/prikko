# Illustrationer — vad som ska ritas och varför

Underlag för Måns eget ritande. Skrivet 2026-08-02.

Utgångspunkt: illustrationer ska bära information eller lösa ett tomrum. En
illustration som bara fyller yta gör sidan långsammare och mer generisk, inte
mindre. Därför är listan kort och varje post har ett skäl.

## Stilen — det som håller ihop allt

Måns smiley är redan sajtens starkaste grafiska tecken: geometrisk, tjocka
former, inga detaljer, inga skuggor. Illustrationerna ska kännas som att de
kommer från samma hand.

| Egenskap | Regel |
|---|---|
| Linje | En enda tjocklek genomgående. Ansiktets munstreck är 7,87 px på 100-rutnätet — skala proportionellt. |
| Färg | Svart plus **en** färg per bild, hämtad ur betygspaletten (`#2cb700`, `#ffcb2c`, `#FF0000`) eller grått. Aldrig fler. |
| Ytor | Platta. Inga gradienter, ingen skuggning, ingen 3D. |
| Rundningar | Runda ändar på linjer, samma som `stroke-linecap: round` i ikonerna. |
| Format | SVG, ritad på ett kvadratiskt rutnät (200 eller 400). Inga rasterbilder. |
| Perspektiv | Rakt framifrån eller platt ovanifrån. Ingen perspektivförkortning. |

**Undvik det som gör illustrationer generiska:** människor med överdrivet
långa lemmar, isometriska kontorsscener, flytande kort med skuggor, gradienter
i lila och blått. Det är signaturen på massproducerad stockillustration och
läser omedelbart som ai-genererat.

JobbSafari fungerar för att deras djurfigurer är egensinniga och konsekventa.
Kopierar vi formatet utan en egen figur blir det tomt. Vår figur finns redan —
det är ansiktet.

## Prioritet 1 — tomma tillstånd

Här gör illustrationer mest nytta, för alternativet är en tom sida som ser
trasig ut.

### 1. Ingen kontroll gjord än
**Var:** verksamhetssidor utan bedömning. **Volym: 2 060 sidor** — 1 234 i
Stockholm, 524 i Uppsala, 129 i Örebro, 93 i Karlstad, 78 i Linköping, 2 i
Jönköping. Det är den enskilt vanligaste sidvarianten efter "inga anmärkningar".

**Ska föreställa:** väntan, inte problem. Förslag: det grå ansiktet med neutral
min, med en tunn streckad ring runt sig — som ett tomt fack som ännu inte
fyllts. Absolut inget varningstecken, ingen frågetecken i rött.

**Varför det spelar roll:** en besökare som ser en tom sida drar slutsatsen att
något är fel med verksamheten. Bilden ska säga "vi vet inte än", inte "något är
skumt".

### 2. Inga träffar
**Var:** söket. **Ska föreställa:** ett förstoringsglas där linsen är tom, i
grått. Kort och sakligt.

### 3. Sidan finns inte (404)
**Var:** 404-sidan. **Ska föreställa:** ansiktet med den raka munnen, lite på
sniskan. Får vara det enda stället där figuren tillåts vara lekfull.

## Prioritet 2 — startsidans funktionskort

Mönstret från JobbSafari: färgad platta, illustration, rubrik, pil. Fyra kort.

Storlek: rita i 400×400, används runt 180 px. Motivet ska tåla att bli litet —
inga tunna detaljer.

| Kort | Illustration | Plattans färg |
|---|---|---|
| Så räknar vi ut bedömningen | Tre ansikten i rad, grönt/gult/rött, det gröna störst | Ljus grå |
| Hitta nära dig | En kartnål formad som ansiktets kontur | Ljus grön |
| Vad kontrolleras | En stapel av de tre vanligaste kontrollområdenas ikoner (hygien, HACCP, spårbarhet) staplade | Ljus gul |
| Rätta en uppgift | En penna som stryker under en rad text | Ljus grå |

**Notera:** korten ska bara byggas för sidor som faktiskt finns. "Hitta nära
dig" förutsätter att platsväljaren är klar.

## Prioritet 3 — kommun utan foto

290 kommuner ska in i registret. De allra flesta kommer sakna stadsfoto länge,
och fallbacken syns därför oftare än fotona.

**Ska föreställa:** inte en illustration av en stad. En platt yta i kommunens
gradientfärg med kommunnamnet — samma layout som fotokorten så raden inte
spricker. Om något grafiskt behövs: ett mycket svagt, förstorat utsnitt av
ansiktets kontur som mönster. Aldrig ett generiskt stadssiluett-kliché.

## Vad som INTE ska illustreras

**Enskilda verksamheter.** Aldrig en illustration eller ett stockfoto som
huvudbild på en namngiven restaurangs sida. En bild av ett rent kök bredvid
"brister som kvarstår" påstår något om just den verksamheten som inte är sant.
Det är samma skäl som Street View togs bort. Bild på en verksamhet ska vara av
den verksamheten, eller ingen bild alls.

**Kontrollområdena A–Q.** De har redan egna ikoner, ritade på 24-rutnätet, i
`site/src/components/AreaIcon.astro`. De ska inte ritas om.

**Bedömningsnivåerna.** Ansiktet är redan tecknet. Att lägga en illustration
bredvid det försvagar det.

## Om foton och licenser

Ladda ner direkt från **Pexels** eller **Unsplash**, inte via Canva. Canvas
licens är knuten till användning inom Canvas egna designer och blir grumlig när
materialet läggs på en egen kommersiell sajt. Pexels och Unsplash egna licenser
är raka: fri kommersiell användning, ingen attribution krävd, men materialet får
inte säljas vidare som det är.

Kommunvapen får aldrig användas — se `R4_juridik_utgivningsbevis.md`.

För stadsfoton: håll samma bildspråk. Dagens fem är blandade — Stockholm
flygfoto, Uppsala förhöjd stadsvy, Örebro landmärke i marknivå, Karlstad
vidvinkel med mycket himmel. En genomgående ton över alla foton jämnar ut
mycket, men samma perspektiv jämnar ut mer.
