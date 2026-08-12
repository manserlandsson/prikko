# Video med Higgsfield: tre förslag och ett manus

Bakgrund: Prikko samlar kommunernas offentliga livsmedelskontroller för
cirka 15 900 verksamheter i 12 kommuner (se `docs/23_rikskartan.md` och
`site/src/lib/site.ts`). Videon är kommunikation om tjänsten, inte
produktyta, så den bärande regeln i `docs/24_maskotprogram.md` gäller
fortfarande: grävlingen får aldrig stå bredvid en bedömd, namngiven
verksamhet, aldrig bära en bedömningsfärg, och han pratar aldrig i jag-form.
Ingen text i videon hittar på en siffra som inte redan står i `docs/` eller
på sajten.

---

## 1. Tre förslag, i den ordning jag rekommenderar dem

### 1. Han ser efter (rekommenderas)

Grävlingen står i sin sökande hållning, precis den han redan har i
e-postens huvud, tittar sig nyfiket omkring och blinkar en gång. Han ger
ett litet, bekräftande nick som att han hittat det han letade efter.
Kameran drar sakta ut, ordmärket tonar in bredvid honom, och startsidans
egen rubrik "Hur rent är det där du äter?" läggs på som text. Videon
slutar på ett stillbildskort med logotyp och prikko.se. Den använder
enbart rörelser som redan är godkända i maskotprogrammet (blink, nick,
spetsade öron), vilket gör den både varumärkesriktig och enkel för en
AI-videomodell att animera trovärdigt utan att figuren tappar formen.

### 2. Gräver fram sanningen

Samma sökande grävling som i förslag 1, men mellantexten byts mot en rad
om namnets ursprung: att "gräva" är svenskans ord för granskning och att
grävlingen bevisligen håller sitt eget gryt rent. Grävlingen gör bara en
spetsad öron-rörelse i bild, ingen bokstavlig grävrörelse, eftersom det
vore svårt för en bildbaserad AI-modell att animera trovärdigt utan att
tappa figurens form. Ordmärket tonar in på samma sätt som i förslag 1.
Fördelen är att den förklarar varför figuren är en grävling, nackdelen är
en extra textrad att läsa, vilket gör den någon sekund tyngre.

### 3. Ren avsändarpresentation

Grävlingen står helt stilla i sitt neutrala läge, blinkar en gång, och
ordmärket tonar in bredvid honom utan ytterligare rörelse eller text. Det
är den säkraste varianten rent tekniskt: den ber AI-modellen om nästan
ingen rörelse alls och har därmed lägst risk för konstiga artefakt i
genereringen. Den är samtidigt den minst minnesvärda av de tre, mer en
logotyp-sting än en berättelse. Bra som snabb reserv om förslag 1 eller 2
inte blir bra i generering.

---

## 2. Manus för förslag 1: "Han ser efter"

Fyra scener, cirka 20 till 25 sekunder totalt.

**Scen 1 (cirka 5 s)**
Vad man ser: grävlingen ensam mot en enkel, ljus blå bakgrund, ingen
byggnad, inget landmärke, ingen text ännu.
Vad grävlingen gör: står i sin sökande hållning, blinkar en gång, vrider
blicken lugnt åt sidan som att han spanar efter något.
Text på bild: ingen.

**Scen 2 (cirka 4 s)**
Vad man ser: samma figur, samma bakgrund, kameran fortfarande stilla.
Vad grävlingen gör: öronen spetsas lätt, han gör ett litet, bekräftande
nick, som att han just hittat det han letade efter.
Text på bild: "Hur rent är det där du äter?" tonar in längst ned i bild
(sajtens egen rubrik, ordagrant ur `site/src/pages/index.astro`).

**Scen 3 (cirka 6 s)**
Vad man ser: kameran drar sakta ut, figuren hamnar till vänster i bild,
tomt utrymme öppnas till höger.
Vad grävlingen gör: står lugnt kvar, en mycket lätt andningsrörelse, inget
annat.
Text på bild: den tidigare raden tonas ut, en ny rad tonas in: "Vi samlar
kommunernas livsmedelskontroller." (kort version av `SITE.description` i
`site/src/lib/site.ts`).

**Scen 4 (cirka 4 s), slutkort**
Vad man ser: samma bildutsnitt som scen 3, ordmärket ("Prikko") tonar in i
det tomma utrymmet till höger om figuren.
Vad grävlingen gör: står stilla, en sista mjuk blinkning, ingen annan
rörelse.
Text på bild: "prikko.se" under ordmärket.

**Notera:** låt själva texten och ordmärket läggas på i efterhand i ett
enkelt redigeringsverktyg (till exempel CapCut eller Canva), inte
genereras av Higgsfield. Att be en videomodell rendera skarp typografi är
opålitligt och riskerar att förvanska logotypen. Higgsfield ska bara
animera figuren mot en tom bakgrund; texten och ordmärket läggs som lager
ovanpå den färdiga klippen.

---

## 3. Higgsfield-prompter, en per scen

Ladda upp grävlingen som karaktärsreferens EN gång och återanvänd samma
uppladdade bild i alla fyra scener, i stället för att byta bild mellan
scenerna. Det håller figuren konsekvent genom hela klippet. Ordmärket
laddas inte upp som videoreferens alls, se noten i manuset ovan, det läggs
på efteråt.

**Scen 1**

```
Animate the uploaded badger character exactly as shown in the reference
image. Do not redesign, restyle, or reinterpret the character in any way;
keep the flat vector illustration style, exact colors, and proportions
unchanged throughout. Subtle idle motion only: one soft, natural eye
blink, then a slow, gentle head turn to the side as if looking around
curiously. No walking, no full body movement, no camera motion, no
digging, nothing held in the paws. Plain, soft light blue background,
completely empty, no text, no logos, no landmarks, no buildings, no other
characters, no extra objects in frame. Calm, observant, quiet mood.
Duration around 5 seconds.
```

**Scen 2**

```
Continue animating the exact same uploaded badger character from the
reference image, unchanged design, same plain soft light blue empty
background as the previous shot. Small, subtle motion only: ears perking
up slightly, followed by one light, brief forward nod, as if the
character just noticed something. Keep the rest of the pose still, no
walking, no paws moving or holding anything, no camera motion. No text,
no logos, no landmarks, no other characters baked into the frame.
Duration around 4 seconds.
```

**Scen 3**

```
Same uploaded badger character, exact same design, unchanged. Slow,
smooth camera zoom out only; the character stays mostly still with just a
very light idle breathing motion, positioned toward the left side of the
frame. Leave the right side of the frame completely empty and unobstructed
for a logo to be added afterwards in editing. Plain soft light blue
background, no text, no logo, no landmarks, no other characters, no extra
graphics generated in the shot. Duration around 6 seconds.
```

**Scen 4**

```
Same uploaded badger character, exact same design, unchanged, standing
calm and still in the same left-side framing as the previous shot. One
final soft, natural blink, otherwise no motion at all. Keep the right
side of the frame completely empty for a logo and web address to be added
afterwards in editing. Plain soft light blue background, no text, no
logo, no landmarks, no other characters generated in the shot. Duration
around 4 seconds.
```

---

## 4. Vilka filer han ska ladda upp, och i vilken ordning

Ordning: bara grävlingen laddas upp till Higgsfield, som karaktärsreferens
för alla fyra scener. Ordmärket laddas INTE upp som videomaterial, det
läggs på som ett stillbildslager i efterredigeringen enligt noten i
manuset.

1. **Grävlingen, helfigur, sökande hållning.**
   Vektorkälla: `site/public/maskot/mejl.svg` (samma figur som redan
   ligger i bevakningsmejlets huvud).
   Färdig rastrerad PNG av exakt samma figur finns redan:
   `site/public/maskot-mejl.png`, men den är bara 144 × 144 px och
   troligen för liten för en AI-videomodell.
   **Behöver exporteras:** ja. Exportera `site/public/maskot/mejl.svg`
   till en ny PNG på minst 1024 × 1024 px, transparent bakgrund, innan
   uppladdning till Higgsfield.

2. **Ordmärket ("Prikko"), för efterredigeringen, inte för Higgsfield.**
   Källa: `brand/prikko-wordmark.svg` (159 × 59 px vektor, den logotyp som
   `site/src/components/Wordmark.astro` pekar ut som originalet).
   En liten rastrerad variant finns redan: `site/public/prikko-wordmark-
   email.png` (228 × 85 px), troligen för lågupplöst för en 1920-bred
   video.
   **Behöver exporteras:** ja, om videon ska bli i vanlig HD-bredd.
   Exportera `brand/prikko-wordmark.svg` till PNG i minst 1600 × 594 px
   (samma bildförhållande, 159:59), transparent bakgrund, för att lägga
   ovanpå klippet i efterredigeringen.

**Filer som medvetet INTE används:** `site/public/maskot/appikon.svg` är
bara ansiktet i en rundad kvadrat, alltså märkeslogiken från
`docs/24_maskotprogram.md`, inte helfiguren. `site/public/maskot/gang.svg`
är en gångcykel monterad som åtta rutor i en enda bildfil (en
spritesheet) och därför fel format för en enskild referensbild.
