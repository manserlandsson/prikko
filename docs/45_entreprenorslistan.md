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

**B1. Publikt API och öppna data från oss. STEG ETT BYGGT 2026-08-31, se
`55_publikt_api.md`.** `/api/v1/` med nuläget per
kommun, dokumenterat på `/api/`, vårt eget arbete under CC BY 4.0. Två
avvikelser från lydelsen nedan: **hela** materialet publiceras inte, eftersom
C4 räknar det som en intäktsström, och LIVES valdes bort av skäl som står i
`55` §2.

**Levererat i två steg.** Steg ett är index, kommunrutterna, båda flödena och
dokumentationssidan, alltså 29 filer, och det går in nu. Steg två är
uppslagningen per verksamhet, 17 066 filer, som är skriven och verifierad men
avstängd med konstanten `PER_VERKSAMHET` tills kontot går till Workers Paid.
Skälet är att gratisplanens tak på 20 000 avvisar utgåvan TYST: vår egen grind
varnar men fäller inte förrän vid 98 000.

Ursprunglig lydelse: Storbritanniens FHRS gör detta och
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

**B6. Flöden. BYGGT 2026-08-31, se `55_publikt_api.md` §6.** Atom per kommun
plus ett för riket, `/flode/{kommun}.xml`. Atom och inte RSS, och per kommun
och inte per område: en flödesadress är en prenumeration och 148 områdesflöden
hade varit 148 filer som ingen ännu bett om. Nya verksamheter står inte i
flödet, bara nya kontroller. *Värde: färskhetssignal till sökmotorer och en riktig
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

**B11. Indexeringsspåret. MÄTT 2026-08-31, se `49_indexeringen.md`.**
Ungefär **1 400 av 14 260 sidor** är i Google, alltså omkring tio procent.
Verksamhetssidorna, som är 13 546 av 16 766, ligger på 1 av 12 i stickprovet.
Kedjesidorna är 4 av 4. Åtta av nio sidindelade adresser saknas.

Slutsatsen ändrar prioriteringen: **bygg inte fler sidor förrän de vi har är
inne.**

**Orsaken var inte den jag först skrev.** Klickdjupet är mätt i
`51_klickdjupet.md` och frikänner både navigationen och sidindelningen: median
3 klick, max 5, noll onåbara sidor, median 8 inlänkar, och mer intern länkning
än hitta.se och booli.se har. Slutsatsen om sidindelningen i `49` var ett
urvalsfel i min egen mätning och är rättad där.

Kvar som förklaring står innehållet: **61 procent av brödtexten på en
verksamhetssida står ordagrant på minst nio av tio andra**, och verksamheterna
har lägst andel eget innehåll av alla åtta sidtyper. Plus åldern, två månader
utan inlänkar utifrån.

Två åtgärder följer, och båda kräver ägaren: **släck `prikko.pages.dev`**, som
serverar hela sajten en andra gång med `Allow: /`, och **koppla Search
Console**, eftersom skillnaden mellan "Crawled, currently not indexed" och
"Discovered, currently not indexed" avgör om vi ska vänta eller bygga.

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

### H. Det som den internationella genomgången tillförde

**RÄTTAD KÄLLHÄNVISNING 2026-08-31.** Här stod att fyndet står i
`docs/44_marknaden_2026.md`. Det gör det inte: den filen innehåller ingenting
om Tyskland, noll träffar på Topf Secret, foodwatch eller ens ordet. Materialet
kom ur en separat internationell genomgång vars rapport aldrig blev en egen
fil. Den verifierade versionen finns nu i `docs/50_begar_ut_kontrollen.md` med
källa per påstående, och den ska läsas i stället för avsnittet nedan där de
skiljer sig.

Fyra av punkterna är nya för
projektet och en av dem hör hemma i den översta vågen.

**H1. Begär ut kontrollen, som funktion på sajten. NY OCH STOR.**

Tyskland har en plattform som heter Topf Secret, driven av foodwatch och
FragDenStaat sedan januari 2019. Den gör en enda sak: den låter en besökare
med två klick begära ut kontrollrapporten för ett namngivet ställe, enligt
konsumentinformationslagen VIG. Volymen är **över 56 000 framställningar fram
till 2022**, hanterade av omkring 400 myndigheter, och Bundesverwaltungsgericht
slog 29 augusti 2019 fast i mål 7 C 29.17 att det inte är rättsmissbruk att
vidarebefordra det man fått ut till en organisation.

Det är samma maskin som vår A2, fast driven av efterfrågan i stället för av
oss, och den är gratis.

**Och den svenska varianten är starkare än den tyska.** Tyskarna fick slåss i
domstol för en rätt vi haft sedan 1766. Offentlighetsprincipen kräver ingen
motivering, tillåter anonymitet och kräver att myndigheten svarar skyndsamt.
Det Topf Secret behövde ett rättsfall för är i Sverige utgångsläget.

Formen: på en verksamhetssida där vår senaste kontroll är gammal, eller där vi
inte har någon alls, står en knapp som skriver begäran åt besökaren. Den
skickas i besökarens eget namn eller i vårt, och svaret göder registret.

Vad det ger på en gång:
- **Täckning som växer där efterfrågan finns**, alltså precis där den är värd
  mest, i stället för i den ordning vi råkar orka.
- **Ett skäl att komma tillbaka.** Ett svar som dyker upp är ett mejl vi får
  skicka utan att sälja något.
- **Spridning.** Den som begärt ut något berättar det.
- **Ett svar på 2 501 verksamheter utan kontroll nyare än två år**, som i dag
  bara är en tystnad på sidan.

Vad som måste utredas innan den byggs: spärr mot missbruk, hur kommunerna
faktiskt reagerar på volym, och om vi ska skicka i vårt namn eller besökarens.
Bibelns avsnitt 7b nämner redan goodwill mot myndigheter som ett värde, och en
maskin som pumpar tusen begäranden i veckan kan förbruka den.

**H2. LIVES, ett färdigt öppet schema för exakt vår datamodell. PRÖVAT OCH
AVVISAT 2026-08-31, se `55_publikt_api.md` §2.** Formatet bygger på ett
poängtal svensk kontroll inte har, saknar identitet per kontroll, och är till
sin form en zip med fem CSV-filer. Ekosystemet är dessutom inte levande: 237
av de 247 flöden Yelp listar levereras av Ecolab, och båda kommunerna som tog
fram formatet finns i den gruppen. Fältnamnen är i stället lånade ur den
svenska NSÖD-specifikationen. Ursprunglig lydelse nedan.

**H2 som den skrevs.**
Yelp tog fram det 2012 tillsammans med San Francisco och New York. Montreal
publicerar i det i dag, under CC BY 4.0, med filerna `feed_info.csv`,
`businesses.csv` och `violations.csv`. Standarden har inte uppdaterats sedan
2015, men den finns, den är etablerad och vem som helst får ansluta.

Det gör två saker för oss. Vår egen normalisering får en genomtänkt
fältuppsättning gratis i stället för en påhittad, och B1 blir billigare: att
publicera i ett format andra redan kan läsa är värt mer än att publicera i ett
eget.

**H3. Identitetsnyckeln, belagd av Frankrike.**
Alim'confiance är ett statligt API med 73 278 poster, daglig extraktion, och
verksamheten identifierad med **SIRET**, alltså organisationsnumret, plus
färdiga koordinater. Det är hela skillnaden mot att para ihop på namn och
adress som vi tvingas göra. Det bekräftar att arbetet i
`12_datapairing_och_orgnr.md` är rätt investering och inte en utvikning.

**H4. Hur länge en dålig kontroll ska synas.**
Irland avpublicerar differentierat efter åtgärdstyp: stängningsbeslut och
förbättringsförelägganden ligger kvar tre månader efter att de hävts,
förbudsbeslut en månad. Tyskland har dessutom ett författningsdomstolsavgörande
på att publicering utan tidsgräns strider mot näringsfriheten,
BVerfG 21 mars 2018 i mål 1 BvF 1/13.

Vi har ingen uttalad regel alls. Historiken ligger kvar så länge källan har
den. Det är förmodligen rätt, eftersom vi speglar allmänna handlingar och inte
utfärdar sanktioner, men det ska vara ett skrivet beslut och inte en
underlåtenhet. Hör ihop med E1.

**H5. En riskvarning, och den är svagare än vad som först stod här.**

**RÄTTAD 2026-08-31.** Här stod att Verwaltungsgericht Berlin i februari 2026
förbjöd stadsdelen Pankow att publicera sin smileylista, och att domstolen fann
att varken den egna lagen eller artikel 11.3 i EU:s kontrollförordning
2017/625 bar publiceringen. **Någon sådan dom går inte att belägga**, se
`docs/50` §2 och §10.

Det som faktiskt hände är två skilda saker. Berlins transparenslag upphävdes,
kungjort i delstatens författningssamling 16 februari 2026. Och VG Berlin
avgjorde ett mål om smileylistan 16 december 2024, i mål VG 14 L 228/24, alltså
mer än ett år tidigare och inte i februari 2026.

Slutsatsen står ändå kvar, fast med mindre kraft: grunden för att en MYNDIGHET
ska publicera är inte självklar ens i ett land som lagstiftat om den. Det säger
mindre om en privat aktör som återpublicerar redan utlämnade handlingar, vilket
är en annan sak juridiskt. Skickas vidare till E1.

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
| 11 | H1 Begär ut kontrollen | Täckningsmaskin driven av efterfrågan, och Sverige har bättre lagstöd än Tyskland |

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

---

## 6. Omprövning 2026-08-30, kväll: tre rapporter som flyttar listan

Fyra spår återkom samma dag: `42_oppna_data_sveptet.md`, `43_kommunmaskinen.md`,
`44_marknaden_2026.md` och kartläggningen av ärendesystemen. Tillsammans ändrar
de rangordningen på ett sätt jag inte hade förutsett i morse.

### 6.1 Staten föreslår att kommunerna slutar med livsmedelskontroll

**SOU 2025:64, "En ny kontrollorganisation i livsmedelskedjan", överlämnad
4 juni 2025.** Utredningen vill flytta hela livsmedelskontrollen från 270
myndigheter till två, med ikraftträdande **1 januari 2028**. Ordagrant ur
sammanfattningen: "Den största omställningen kommer ske för kommunerna, som
inte längre ska utföra livsmedelskontroll."

**TIDSPLANEN ÄR INTE LÄNGRE 2028, och det ändrar följdbesluten nedan.**
Regeringen tillsatte 15 maj 2026 en ny utredning som redovisar 5 januari 2027,
alltså är datumet 1 januari 2028 i praktiken övergivet och någon ny
ikraftträdandedag finns inte. Se `docs/50_begar_ut_kontrollen.md`. Reformen är
inte avblåst, men den är senare och osäkrare än vad som stod här, **vilket gör
A2 mer värd och inte mindre**: fönstret där utspridd data är en vallgrav är
längre än ett och ett halvt år.

Remissens status är i övrigt inte belagd och SKR:s remissvar gick inte att
lokalisera. Men förslaget finns, och det är den enda rörelsen i den här frågan
i Sverige på tjugo år.

**Vad det gör med projektet, ärligt läst.**

Det underminerar vallgraven vi tänkt bygga. Hela poängen med
offentlighetsmaskinen i A2 är att datan är utspridd på 290 håll och att det är
segt att samla ihop, alltså att segheten är skyddet. En nationell myndighet med
ett register tar bort både segheten och skyddet, och den kommer med all
sannolikhet att publicera själv.

Men det dödar inte Prikko. Det **flyttar** vallgraven, från åtkomst till
varumärke, produkt och spridning. Frankrike har haft ett nationellt statligt
API med 73 278 poster i flera år, och där finns ändå tredjepartskartor,
en tävling om att bygga på datan, och nitton registrerade återanvändningar.
Myndigheten publicerar en fil. Någon annan bygger det folk faktiskt använder.

**Alltså tre följdbeslut, och de gäller från i dag.**

1. **Bygg täckning billigt, inte uttömmande.** Förbunden och de största
   kommunerna, alltså punkt A3 och de två nya källorna nedan. Ett program för
   att beta av 290 kommuner för hand skulle bli klart ungefär när det slutat
   behövas. A2 byggs som verktyg och lydelse, inte som ett tvåårigt fälttåg.
2. **Höj pelare B och C.** Spridning och intäkt var punkt tre och framåt i
   morse. De är nu det enda som är hållbart oavsett vad utredningen leder till.
3. **Var den som står först när filen kommer.** Om 2028 ger ett nationellt
   register vinner den som redan har varumärket, sidorna, sökordet och
   besökarna. Det är ett argument för att flytta fram tidsplanen, inte skjuta
   upp den.

### 6.2 Öppna data-svepet gav nästan ingenting, och det är ett svar

**Noll svenska kommuner publicerar i NSÖD-formatet.** Beviset är starkare än
frånvaron av datamängder: specifikationens egen uppföljningsfil har en enda
kommunflik, Lund, med noll klara och tretton ej påbörjade punkter. Verktyget
har aldrig fyllts i av någon.

Punkt A1 var listans etta i morse med motiveringen att den kunde flerdubbla
projektet på en vecka. Den motiveringen höll inte. Två källor finns ändå:

| Kommun | Vad | Tal | Haken |
|---|---|---|---|
| Norrköping | `ecos.xml`, 7,4 MB | 1 022 verksamheter, 4 451 kontroller, 25 083 kontrollpunkter, avvikelser i klartext | Ingen licens angiven, senaste kontrollen 3 januari 2024 |
| Göteborg | CSV, CC0 1.0, ändrad i går | 5 076 verksamheter, koordinater på 4 892 | Noll kontrollresultat |

Bägge ger 22 142 verksamheter mot dagens 16 044, alltså 38 procent fler.
Norrköpings fil hittades inte via söksidan, som är död, utan i kommunens
filarkiv genom deras egen sitemap. **Metodlärdomen är att leta efter filen och
inte efter sidan**, och den ska gälla för resten av landet.

### 6.3 Kommunmaskinen är kartlagd, och två spärrar är belagda

**23 kommunalförbund täcker 63 kommuner**, alltså 40 brev vi slipper skriva,
9 479 anläggningar och 8,8 procent av befolkningen. Registret ligger i
`pipeline/data/kommuner.json` med källa per fält, och 269 av 290 har en
funktionsadress.

**154 kommuner är dessutom kopplade till sitt ärendesystem**, mätt ur
kommunernas egna platsannonser via Arbetsförmedlingens API, vilket är en bättre
källa än leverantörernas tystnad: 68 Ecos, 62 EDP Vision, 35 Castor. Det är en
golvsiffra och inte en marknadsandel.

Två spärrar är nu belagda och ändrar brevet:

- **Formatkravet är dött.** Vi kan inte kräva digitalt format. Högsta
  domstolen sa nej i NJA 2023 s. 498, regeringen bekräftade tolkningen i
  prop. 2023/24:73, och det finns ingen väg att överklaga en formatvägran.
- **Risken är papper, inte avgifter.** Ett elektroniskt uttag kostar sannolikt
  ingenting, men Skinnskatteberg lämnade 2025 ut 15 000 sidor för omkring
  30 000 kronor. Papperspärren hör därför hemma i brevets första stycke.

Ett hoppfullt tal på andra sidan: Jens Nylander har redan fått ut strukturerad
data ur 271 kommuner, med nio av tio utan problem. Planeringssiffran 60 procent
i `20_kommunexpansion.md` är förmodligen för pessimistisk.

### 6.4 Affärsmodellen i bibeln är bakvänd

Ingen av de fyra privata sajterna på brittisk hygiendata tar betalt för en
företagsprofil. De säljer **efterlevnadsverktyg och utbildning**, och de riktar
sig mot verksamheter med **låga** betyg. En av dem skriver rakt ut på sin
prissida att tjänsten är gratis tills kunden når högsta betyg.

Och exakt vår affär är redan byggd och såld. Hazel Analytics skördade
amerikanska hälsomyndigheters kontrolldata, Ecolab köpte bolaget 2023, och
samma data driver i dag nästan 700 000 Yelp-sidor, där de räknar fram ett eget
betyg när myndigheten saknar ett och märker det som uppskattat. Det är ett
prejudikat för vår svåraste fråga, alltså normaliseringen mellan kommuner som
bedömer olika.

Prisunderlaget i Sverige: 250 till 750 kronor i månaden för en företagsprofil.
Det som säljs är **placering i sökresultatet**, vilket är den enda intäktsform
vi aldrig kan ta. C1 och C2 måste därför byggas om i huvudet: vi säljer verktyg
och synlighet utanför sökresultatet, aldrig ordningen i det.

### 6.5 Danmark strök belöningen och byggde en kanal i stället

Elitesmileyn är avskaffad, beslut 2020 och genomfört 2022 och 2023. Det de
satsade på i stället är distribution, och det är exakt pelare B:

- Verksamheten **måste** länka till sin smileysida från all digital
  marknadsföring.
- Entrémärket bär en **QR-kod**.

Auckland har samma grepp i sin föreskrift från 2020: skyltkravet gäller även
verksamhetens egna digitala kanaler. Två länder oberoende av varandra har
alltså kommit fram till att märket ska leda tillbaka till källan.

Vi kan inte ålägga någon något. Men vi kan göra märket värt att sätta upp, och
QR-koden är en rad kod. **B2, B3 och B4 flyttas upp**, och de får en QR-kod.

Danmarks fil bär dessutom CVR-nummer på 98,2 procent av raderna, alltså precis
den organisationskoppling `12_datapairing_och_orgnr.md` finns till för att vi
saknar. Frankrike har samma sak med SIRET. Två av två.

### 6.6 Tre rättelser till bibeln

- **FHRS har ingen schema.org.** Noll ld+json, noll itemprop, noll og-taggar
  på verksamhetssidan. `11_master_projektbibel.md` avsnitt 5 påstår motsatsen.
  Vi har redan mer strukturerad data än förlagan.
- **Rätten att svara används nästan aldrig.** 8 ifyllda av 36 273
  verksamheter i sexton brittiska myndigheters filer. E2 är alltså inte en
  funktion besökare efterfrågar, den är ett skydd vi behöver ha.
- **Livsmedelskollen är sämre än vi trott.** 2,0 av 5 i 82 recensioner på
  Google Play, inte bara 2,6 i 17 hos Apple, och klagomålen handlar om att
  sökningen inte fungerar.

### 6.7 Den nya vågen 1

| # | Punkt | Ändring |
|---|---|---|
| 1 | Norrköping och Göteborg in | Konkret, +38 procent, ingen väntar på oss |
| 2 | A0 Filtaket | Oförändrat, blockerar allt ovan |
| 3 | B2 till B4 med QR-kod | Upp från plats fyra. Två länder har oberoende valt samma grepp |
| 4 | B1 Publikt API, i LIVES-format | Upp. Formatet finns, Montreal använder det |
| 5 | H1 Begär ut kontrollen | Upp från plats elva. Enda täckningsvägen som skalar utan oss |
| 6 | E1 Utgivningsbeviset | Oförändrat |
| 7 | C1 och C2 omtänkta | Verktyg och utbildning, inte placering |
| 8 | B6 Flöden, B11 Indexering, E5 Drift | Oförändrat |
| 9 | SOU 2025:64 följas | Ny. Remissvar och riksdagsbehandling avgör tidsplanen |
| ~ | A2 som fälttåg | NED. Byggs som verktyg och lydelse, inte som tvåårigt projekt |
