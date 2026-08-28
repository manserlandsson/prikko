# 41. Kontrasten på två bedömningslägen: ett beslut som är ägarens

**Datum:** 2026-08-28
**Vad det här är:** ett underlag, inte en ändring. Ingen färg är rörd.
**Vad som behövs:** ett ja eller ett nej från ägaren på en av fyra vägar.

---

## 1. Frågan, i en mening

Vitt på vårt gröna och vitt på vårt gula ligger under WCAG 1.4.11:s krav på
3:1, och på kartnålen finns ingen text bredvid som bär betydelsen i stället. Att
laga det kräver att ett av ägarens egna nedskrivna beslut rivs, och därför är
det hans fråga och inte kodens.

## 2. Vad kravet säger, och vad undantaget säger

WCAG 2.2, framgångskriterium **1.4.11 Non-text Contrast**, nivå AA: grafik som
behövs för att förstå innehållet ska ha minst **3:1** mot det som ligger intill.

**Undantaget står i kriteriet självt** och är inte en tolkning: kravet gäller
grafik som behövs för att förstå innehållet. Står betydelsen dessutom i text
intill märket bär grafiken inte betydelsen ensam, och kravet biter inte.

Sajten har byggt på just det undantaget hela tiden. Det står redan skrivet på
tre ställen: vid `--verdict-minor-ink` och `--on-clean` i `tokens.css`, och i
huvudnoten i `site/src/lib/face-klassisk.ts`.

## 3. Mätningen

Vitt mot plattans färg, räknat med WCAG:s egen formel 2026-08-28:

| läge | platta | vitt mot plattan | klarar 3:1 |
|---|---|---:|---|
| inga anmärkningar | `#00B92B` | **2,63:1** | nej |
| mindre brister | `#FECB00` | **1,53:1** | nej |
| brister kvarstår | `#FF0000` | 4,00:1 | ja |
| ingen bedömning | `#6E6E73` | 5,07:1 | ja |

**Var det spelar roll: två ytor av tjugoen.** Märket ritas på 21 ställen på
sajten, alla ur `FACE_MARKUP` och `FACE_PLATE` i `lib/face.ts`. På 19 av dem
står bedömningens text intill märket, och undantaget bär. De två som återstår
är kartnålarna, som bara är en form på en karta:

| yta | `icon-size` | nålens bredd | ansiktets bredd |
|---|---:|---:|---:|
| nålen, ovald | 0,5 | 18,0 px | **13,3 px** |
| nålen, vald | 0,74 | 26,6 px | 19,7 px |

Räknat ur `PIN_W = 72` i `lib/kartnal.ts`, inlagd med `pixelRatio: 2`, alltså 36
CSS-pixlar vid `icon-size` 1. Ansiktet är droppens cirkel med radie 37 i en
100-ruta, alltså 74 procent av nålens bredd.

Ett ansikte på 13,3 pixlar är litet, och just därför bär munnen hela skillnaden
mellan de tre nivåerna för den som inte skiljer färgerna åt. Munnen är vit.

## 4. De fyra vägarna, och vad var och en kostar

### A. Mörkare grönt och mörkare gult

| färg | i dag | förslag | ny kontrast |
|---|---|---|---:|
| grönt | `#00B92B` (2,63) | `#00AC28` | **3,03:1** |
| gult | `#FECB00` (1,53) | `#BE8A00` | **3,08:1** |

**En rättelse på det gröna talet.** `#00AD28` har cirkulerat som svaret och står
i noten i `face-klassisk.ts` med 3,00:1. Räknat på decimalen ger det **2,9965**,
alltså under kravet. Det avrundar till 3,00 men klarar det inte. Första gröna
tonen på samma linje som verkligen går över är `#00AC28`.

**Vad det river.** Den gula. Ägaren har fattat det beslutet två gånger och det
står nedskrivet vid `--verdict-minor-ink`: etiketten ska bära märkets färg, inte
en mörkare släkting. Två mörkare gula är redan provade och underkända,
`#8E7200` för att den läste som guld och `#A4560B` för att den läste som brunt.
`#BE8A00` ligger mellan dem, alltså i samma härad som det som redan sagts nej
till. Att det NU finns ett tillgänglighetsskäl bakom är ett nytt argument, men
det är samma färgfamilj han bedömt.

Grönet är den billiga halvan: `#00B92B` mot `#00AC28` är tretton steg i grönt
och läses knappt som en annan färg.

### B. Mörk symbol i stället för vit

Ögon och mun byter från vitt till plattans mörka ton, alltså tonerna som redan
finns i `face-klassisk.ts` som originalfilernas mörka gradientstopp. Kontrasten
löser sig då för båda lägena utan att en enda platta ändras.

**Vad det river.** Den vita symbolen, som är Måns designbeslut och står
nedskrivet vid `--on-clean` i `tokens.css`. Det ändrar dessutom märket på alla
21 ytor för att laga två, och märket är sajtens varumärke.

### C. Låt färgerna vara och laga bara nålen

Det enda som saknas på de två ytorna är att betydelsen inte står i text intill.
Två sätt att ge nålen det den saknar:

- En hårfin mörk kontur runt ögon och mun, bara i nålens ritning. Då bär munnen
  sin form mot plattan oavsett plattans ljushet, och de 19 andra ytorna är
  orörda. Priset är att en kontur på ett 13-pixlars ansikte lätt blir grums, och
  det måste ses i skärmbild innan det avgörs.
- Bedömningen i text i nålens etikett på kartan. Kostar plats på en yta där
  plats är det som saknas mest.

**Vad det river.** Ingenting nedskrivet. Det är den enda vägen som lämnar båda
ägarbesluten orörda.

### D. Låt det stå, och skriv ned varför

Undantaget i kriteriet är verkligt och sajten har redan lutat sig mot det på 19
ytor. Frågan är om det bär på de två sista, där ingen text står bredvid. Väljs
den här vägen ska den stå som ett medvetet beslut med datum, inte som något som
aldrig blev av.

## 5. Vad som rekommenderas

**A för grönet, C för gulan, och beslutet om gulan tas separat.**

Skälet är att de två halvorna inte kostar lika mycket. Att flytta `#00B92B` till
`#00AC28` river ingenting, syns knappt, och tar bort det ena av två fel. Att
flytta `#FECB00` river ett beslut ägaren fattat två gånger, och det priset ska
inte betalas i förbifarten i en tillgänglighetsrättning.

**Ingenting av det här är byggt.** Talen är räknade, vägarna är beskrivna, och
nästa steg är ett besked.
