# 45. Entreprenörslistan

Ägaren gav 2026-08-30 full auktoritet att själv avgöra vad som saknas, rangordna
det och beta av det utan att fråga. Det här är listan. Den är avsiktligt
ambitiös. Den är inte en önskelista, den är en arbetsordning, och den ska
kunna arbetas i veckor utan nya beslut från ägaren.

Listan uppdateras löpande. En punkt stryks först när den är verifierad i den
byggda sajten, inte när koden är skriven. Samma regel som `25_oppna_punkter.md`.

---

## 1. Slutsatsen först

**Prikko är en färdig produkt på fyra procent av marknaden, utan spridning och
utan intäkt.** Sajten är bättre byggd än allt vi jämfört den med. Den täcker
12 kommuner av 290 och 16 047 verksamheter av uppskattningsvis 90 000. Ingen
utanför projektet vet att den finns, och ingen krona har någonsin bytt ägare.

Det betyder att nästan allt arbete på ytan har avtagande avkastning just nu,
och att tre maskiner saknas helt:

| Maskin | Vad den gör | Läge i dag |
|---|---|---|
| **Täckningsmaskinen** | Förvandlar 290 kommuner till data utan att en människa gör något per kommun | Finns inte. Varje kommun har byggts för hand. |
| **Spridningsmaskinen** | Får datan att lämna sajten: märken, flöden, API, press, dekaler | Finns inte. Sajten är en återvändsgränd, allt pekar in och inget pekar ut. |
| **Intäktsmaskinen** | Gör täckning och trafik till pengar | Finns inte. Ingen prislista, ingen betalväg, ingen såld rad. |

Rangordningen nedan följer av det. Allt som bygger en av de tre maskinerna går
före allt som förbättrar en yta som redan fungerar.

**Den enda punkt som är viktigare än alla andra tillsammans:** att koppla in de
kommuner som redan publicerar sina kontroller som öppna data. Det kräver
ingens tillstånd, ingen väntan och inget mejl. Vi har helt enkelt aldrig gjort
svepet.

---

## 2. Diagnosen i tal

| Mått | I dag | Vad som är möjligt |
|---|---|---|
| Kommuner | 12 | 290 |
| Verksamheter | 16 047 | omkring 90 000 (SNI 56 plus butik, skola, vård) |
| Sidor | ~16 766 | begränsat av Pages tak på 20 000 filer, se `prikko-infrastruktur` |
| Publika gränssnitt ut ur sajten | 0 | API, flöden, märken, dekaler, presspaket |
| Intäktsströmmar | 0 | fem utredda i projektbibeln avsnitt 10 |
| Verksamheter som vet att de finns hos oss | 0 | alla, via dekal och profil |

Talet 20 000 är den hårda gränsen. **Täckning och sidor är därför inte samma
sak längre.** Att gå från 12 till 100 kommuner går inte som "en sida per
verksamhet" med nuvarande hosting. Det är ett arkitekturbeslut som måste tas
innan täckningsmaskinen körs skarpt, inte efter. Se punkt A0.

---

## 3. Listan

Varje punkt har: vad den är, varför den är värd något, vad den kostar, och vad
som blockerar den. Bokstaven är pelaren, siffran är ordningen inom pelaren.
Rangordningen mellan pelarna står i avsnitt 4.

### A. Täckning, alltså vallgraven

**A0. Filtaket, avgjort före allt annat.**
Pages tar 20 000 filer och vi ligger på 15 500. Hundra kommuner är
matematiskt omöjligt på nuvarande form. Tre vägar finns: flytta till en värd
utan filtak, gå över till en hybrid där verksamhetssidor renderas vid kanten,
eller stycka sajten i flera utplaceringar per region. Detta ska utredas och
avgöras med mätta tal, inte antas. **Blockerar A1 till A7 i skarp körning.**

**A1. Öppna data-svepet.** Kartlägg varje svensk kommun som redan publicerar
livsmedelskontroller som öppna data, verifiera licens och format, koppla in
alla som går. Nationella specifikationen NSÖD finns och flera kommuner följer
den. *Värde: kan ensam flerdubbla täckningen. Kostnad: en adapter per format,
inte per kommun. Blockerare: inga.* **Under arbete.**

**A2. Kommunmaskinen.** Ett register över alla 290 kommuner med kontaktväg,
system och förbundstillhörighet, plus en färdig lydelse för begäran enligt
offentlighetsprincipen och ett sätt att spåra vad som skickats, vad som
kommit tillbaka och vad som behöver påminnas. *Värde: den enda vägen till full
täckning, och den är seg, vilket är precis därför den är en vallgrav.
Blockerare: ägaren måste trycka på skicka, men allt annat kan vara klart.*
**Under arbete.**

**A3. Förbundsspåret.** Kommunalförbund för miljö och hälsoskydd betyder att en
begäran ger flera kommuner. Södertörns förbund ensamt är tio kommuner. Dessa
ska plockas först. *Värde: högst avkastning per skickat mejl.*

**A4. Adapter per ärendesystem.** Ecos, EDP Vision och Castor. Bygg tre robusta
inläsare i stället för trettio kommunspecifika. *Värde: gör kommun nummer
femtio till en timmes arbete i stället för en dags.*

**A5. Riksryggraden.** Alla svenska livsmedelsföretag ur Bolagsverkets fria
data, även de vi saknar kontroll på. Projektbibeln avsnitt 3 kallar detta
ryggraden och det är aldrig byggt. *Värde: gör oss till registret och inte
bara till urvalet. Risk: tunna sidor, måste hanteras med omsorg.*

**A6. Färskhetslarm per källa.** Om en kommuns hämtning tystnar ska det synas
för oss innan det syns för besökaren. *Värde: en tyst källa är värre än ingen
källa, för sajten fortsätter påstå saker.*

**A7. Papperskommunerna.** De som bara lämnar PDF. Ett generiskt spår med
inläsning och kontrollräkning. *Värde: den sista tredjedelen av landet.*

**A8. Öppettider ur OpenStreetMap.** Bäst belagda och dyraste förslaget i
`31_vad_far_folk_att_valja_oss.md` avsnitt 6.3. Sju av sju konkurrenter har
det, vi har det inte. *Värde: den vanligaste frågan en besökare har om ett
matställe.*

**A9. Adresser för de kommuner som saknar dem.** Uppsala och Örebro, 537 plus
588 nålar. Delvis blockerat på Geotorget och på två mejl som väntar på ägaren.
OSM som reservväg ska prövas och mätas.

**A10. Kedjeregistret nationellt.** I dag byggt på tolv kommuner. Med
täckning blir kedjesidan en av de starkaste sidtyperna vi har.

**A11. Publicerad normalisering.** Kommunerna bedömer olika. Projektbibeln
avsnitt 11 säger att motdraget är en transparent och publicerad normalisering.
Den finns i huvudet men inte på sajten.

### B. Spridning, alltså att datan lämnar sajten

**B1. Publikt API och öppna data från oss.** Storbritanniens FHRS gör detta och
det är därför alla citerar dem. Vi publicerar hela vårt normaliserade material
under en fri licens med tydlig attribution. *Värde: backlänkar, citeringar,
och att vi blir källan i stället för en av flera speglar. Kostnad: låg, vi har
redan JSON-rutter. Risk: någon bygger en konkurrent på vår data. Motdrag:
täckningen och varumärket är vallgraven, inte hemlighållandet.*

**B2. Inbäddningsbart märke.** DELVIS BYGGT. Emblemet finns för utgåvans 254
vinnare, se `lib/emblem.ts`, med färdig kodsnutt och nedladdning. Det som
saknas är vägen dit för en verksamhet som inte är vinnare, och mätningen av
hur många som faktiskt satt upp det. En SVG per verksamhet på egen adress, plus en
sida där ägaren kopierar en kodsnutt. Varje inbäddning är en backlänk och en
gratis annons. Projektbibeln avsnitt 7b räknar upp detta och det är aldrig
byggt.

**B3. Fönsterdekalen.** Tryckfärdig fil och en sida där en verksamhet beställer
en. Offline-distribution, billigast tänkbara marknadsföring, och den är i
praktiken hur brittiska FHRS blev allmänt känt.

**B4. Certifikatet.** Ett utskrivbart diplom, finare än dekalen. Ägarens egen
idé i projektbibeln.

**B5. Presspaketet.** SVT gör matsnuskgranskningar för hand. Vi kan ge
redaktionerna ett färdigt underlag per kommun, kvartalsvis, med rätt
reservationer. **Aldrig en lista på de sämsta, och aldrig en rangordning av
kommuner.** Formen måste därför vara "så ser kontrollen ut hos er" och inte
"här är skammen". *Värde: den billigaste nationella räckvidd som finns.*

**B6. Flöden.** RSS och Atom per kommun och per område. Nya kontroller, nya
verksamheter. *Värde: färskhetssignal till sökmotorer och en riktig
prenumerationsväg utan konto.*

**B7. Nyhetsbrevet.** Veckans kontroller i din stad. Bygger på bevakningen som
redan finns.

**B8. MCP-server och maskinläsbarhet för AI.** `llms.txt` finns. Nästa steg är
att en assistent kan fråga Prikko direkt. Projektbibeln avsnitt 6b handlar om
att bli citerad av AI-svar, och detta är den bokstavliga formen av det.

**B9. Wikidata och Wikipedia.** Vi har redan matchat verksamheter mot Wikidata.
Att lägga tillbaka en identifierare och en källänk är rätt väg, gjort
varsamt och enligt deras regler.

**B10. Delningsbilder.** En bild per verksamhet och per kommun som ser rätt ut
när någon delar länken. Punkt 8 i `17_produktfunktioner.md`.

**B11. Indexeringsspåret.** IndexNow, Search Console, Bing, och en mätning av
hur många av våra sidor som faktiskt är indexerade. Vi har byggt 16 766 sidor
och aldrig mätt hur många Google tagit in.

**B12. Kommunlänkarna.** En kommun länkar gärna till en tjänst som visar deras
egen data snyggt. Tolv mejl, tolv backlänkar med hög tyngd.

### C. Intäkt

**C1. Verksamhetsprofilen.** Ta över din sida, svara på kontroller, se
statistik, få aviseringar. Verifiering finns redan halvvägs via Stockholms
registreringsintyg. **Regeln är absolut: vi säljer verktyg och synlighet,
aldrig ett bättre betyg.**

**C2. Prislistan.** Grundad i vad hitta.se, allabolag.se och Eniro faktiskt tar
för en företagsprofil. Ska mätas, inte gissas.

**C3. Kedjebevakning.** En kedja med hundra enheter har i dag inget sätt att se
sina egna kontroller samlade. Detta är B2B och det är återkommande.

**C4. Datalicensen.** Det normaliserade nationella materialet till
försäkringsbolag, matleverans och media. Dansk smileydata används redan så.
Kräver täckning först, alltså pelare A.

**C5. Annonsplatsen.** Sist, och bara i en form som inte skadar förtroendet.

### D. Produkt

**D1. Sök på område och kategori samtidigt.** Ägaren frågade uttryckligen: kan
man skriva "östermalm" och sedan "kebab". I dag går det inte.

**D2. Noten om nedlagda verksamheter.** Underlaget finns för Stockholm sedan
27 augusti, 30 rader är inte längre aktiva. Kvar är ytan i lista, sök och
karta.

**D3. Anmälningsroboten.** Länkar finns för tolv kommuner. Den sömlösa
inskickningen finns inte.

**D4. Bevaka ett område.** `31_vad_far_folk_att_valja_oss.md` avsnitt 6.4.

**D5. Bevakningsraden på kontot** ska bära bedömning och datum. Punkt 7 i
rapport 17.

**D6. Öppet nu på kartan.** Följer av A8.

**D7. Recensioner igång på riktigt.** Formen finns byggd. Den är tom.

**D8. Sidindelning av artiklarna.** Vid trettio artiklar krävs den.

**D9. Menyer och prisnivå.** Utreds. Kan vara den funktion som gör oss till en
plats man går till före måltiden och inte efter matförgiftningen.

**D10. Tillgänglighet ur OSM.** Rullstol, toalett, entré. Ingen konkurrent har
det och datat är gratis.

### E. Förtroende och juridik

**E1. Utgivningsbeviset.** 3 000 kronor och ett grundlagsskydd för att
publicera namngivna verksamheter. Ägaren har skjutit upp det. Ansökan ska
ligga färdig så att den är en underskrift bort. **Detta är den enskilt största
juridiska risken i projektet och den är billig att stänga.**

**E2. Rätt att svara, synlig och enkel.** Finns som komponent. Vägen dit för en
ägare som inte har konto finns inte.

**E3. Rättelseflödet.** `/ratta` finns. Vad som händer efter att någon tryckt
finns inte beskrivet.

**E4. Datakvalitetssidan per kommun.** Vad vi har, hur färskt det är, vad som
saknas. Ärlighet som funktion.

**E5. Driftövervakning.** Vi vet inte i dag om sajten ligger nere.

### F. Plattformen, alltså den stora satsningen

**F1. Nästa vertikal, utredd med tal.** Kandidater: äldreomsorg och vård via
IVO, skolinspektionen, djurskyddskontroller, alkoholtillstånd,
brandskyddstillsyn, bilbesiktning. Frågan som avgör: finns samma tre
egenskaper som gjorde livsmedel rätt, alltså offentlig data, spridd över
många huvudmän, och en konsument som vill veta.

**F2. Motorn ska gå att lyfta.** Vilken del av kodbasen är Prikko och vilken
del är "förtroendelager på svensk offentlig data". Om vertikal två tar en
månad i stället för sex är det en plattform. Annars är det en sajt.

### G. Hantverk

**G1. Prestanda mätt i fält**, inte i labb.
**G2. Tillgänglighetsgranskning** mot WCAG, hela sajten.
**G3. De 1 079 tankstrecken** i 150 filer.
**G4. Tester för pipelinen.** En trasig hämtare ska falla i ett test och inte
på sajten.

---

## 4. Rangordningen

Ordningen är vald efter tre frågor: multiplicerar punkten allt annat, kan den
göras utan ägarens medverkan, och blir den värdelös om den görs för sent.

**Våg 1, går att göra nu och kräver ingens tillstånd**

| # | Punkt | Skäl |
|---|---|---|
| 1 | A1 Öppna data-svepet | Enda punkten som kan flerdubbla hela projektet på en vecka |
| 2 | A0 Filtaket | Blockerar våg 1 punkt 1 från att gå i produktion |
| 3 | B1 Publikt API och öppna data | Billigt, gör oss till källan, öppnar B2, B8 och C4 |
| 4 | B2 Inbäddningsbart märke | Backlänkar och on-ramp till C1 |
| 5 | B6 Flöden | En eftermiddag, permanent färskhetssignal |
| 6 | D1 Område plus kategori i söket | Ägaren har bett om den |
| 7 | D2 Noten om nedlagda | Underlaget ligger färdigt och outnyttjat |
| 8 | E1 Utgivningsbevisets ansökan | Största risken, minsta kostnaden |
| 9 | B11 Indexeringsmätningen | Vi vet inte om sexton tusen sidor ens finns i Google |
| 10 | E5 Driftövervakning | Vi vet inte om sajten står upp |

**Våg 2, kräver våg 1 eller ett kort besked**

A2 kommunmaskinen, A3 förbunden, A4 adaptrarna, B3 dekalen, B4 certifikatet,
B5 presspaketet, C1 verksamhetsprofilen, C2 prislistan, A11 normaliseringen,
E4 datakvalitetssidan.

**Våg 3, kräver täckning först**

A5 riksryggraden, A8 öppettiderna, A10 kedjeregistret, C3 kedjebevakningen,
C4 datalicensen, B7 nyhetsbrevet, D9 menyerna, D10 tillgängligheten.

**Våg 4, den stora satsningen**

F1 nästa vertikal, F2 motorn, C5 annonsplatsen.

**Löpande, mellan de andra**

G1 till G4, D3 till D8, B9, B10, B12, E2, E3, A6, A7, A9.

---

## 5. Vad som inte ska göras, och varför

- **Ingen app.** Wedgen är webben och sökningen. En app är den fälla
  Livsmedelskollen redan gått i, och deras 2,6 av 5 är beviset.
- **Ingen rangordning av kommuner, aldrig en lista på de sämsta, aldrig en
  namngiven kedja utpekad som något att undvika.** Detta gäller även
  presspaketet i B5, och det gäller även när det skulle ge mest räckvidd.
- **Ingen betalning för bättre betyg,** i någon form, någonsin. Det förstör
  det enda vi har.
- **Ingen ny sidtyp bara för att en funktion behöver en plats.** Ägarens
  princip: sidor köps för sökning, aldrig för funktioner.
- **Ingen AI-genererad text eller bild som innehåll.** Kvalitetsgrinden i
  projektbibeln avsnitt 6 gäller.
