# Juridisk kartläggning — utgivningsbevis, GDPR, förtal, öppna data, varumärke

**Research, inte juridisk rådgivning.** Undertecknad är inte jurist. Allt nedan är
avläst ur primärkällor och ska verifieras av ombud innan bindande beslut (särskilt
avsnitt 1 och 2, som ändrar förutsättningarna i bibeln §8).

**Sammanställd 2026-08-02.** Rättsläget rörde sig så sent som 9 juli 2026 — tre
veckor före detta datum. Rapporten har kort hållbarhet.

---

## 0. Röda flaggor / go–no-go

### 🔴 RÖD FLAGGA 1 — Bibelns bärande juridiska antagande är överspelat

Bibeln §8 säger: *"Utgivningsbevis (som Ratsit/Hitta) → grundlagsskydd vid
publicering av namngivna verksamheter."* R1 skärper det: *"Utgivningsbeviset är
alltså inte en formalitet utan förutsättningen."*

**Det stämmer inte längre.** EU-domstolen slog fast i mål **C-199/24** (dom
**9 juli 2026**, "Lexbase-målet") att **ett utgivningsbevis inte är tillräckligt
för att undanta en verksamhet från GDPR**. För att det journalistiska undantaget
ska gälla krävs enligt domstolen att materialet

1. är föremål för redigering eller bearbetning före publicering,
2. publiceras enligt pressetiska/journalistiska yrkesetiska regler, eller
   åtminstone enligt en redaktionell linje, och
3. att påståenden om fakta granskas före publicering.

Domstolen slog också fast att det **inte är förenligt med EU-rätten att kräva att
den registrerade inleder en förtalsprocess** för att skydda sina personuppgifter.
Det var precis den svenska konstruktionen.

**Vad det betyder för Prikko:** utgivningsbeviset är fortfarande värt att skaffa
— men som skydd mot *förtalsanspråk och censur*, inte som GDPR-sköld. Planera
för att GDPR gäller parallellt, från dag ett.

### 🟡 Men Prikko står ovanligt bra i just den prövningen

Domstolens tre kriterier är nästan en beskrivning av det bygge som redan pågår:

| Domstolens krav | Prikkos motsvarighet |
|---|---|
| Redigering/bearbetning | Normaliserad betygsmodell ovanpå `assessment`, inte råutdrag |
| Redaktionell linje | Publicerad, öppen metodik (bibeln §4) |
| Faktakontroll före publicering | Källa + kontrolldatum per post, 2 v fördröjning, `ownerComment` |

Lexbase föll på att man sålde **obearbetade domar** utan redaktionell linje.
Prikko gör motsatsen. Det är inte en garanti, men det är den bästa position en
svensk databasaktör kan ha efter C-199/24 — och den bör dokumenteras aktivt
(metodiksida, redaktionell policy, rättelserutin) eftersom den är själva
försvaret.

### 🔴 RÖD FLAGGA 2 — Enskild firma är hela GDPR-exponeringen, koncentrerad

GDPR skyddar bara fysiska personer. Aktiebolagens kontrollresultat är i praktiken
utanför. Men R1:s fynd står fast: **för enskild firma ÄR organisationsnumret
ägarens personnummer**, verksamhetsnamnet är ofta personens namn, och adressen kan
vara hemadress. För den gruppen publicerar Prikko personuppgifter om att en
namngiven fysisk person fått "allvarliga anmärkningar".

Det är inte art. 10-uppgifter (förvaltningsrättslig kontroll är inte
lagöverträdelse/brott), vilket sänker risken markant jämfört med Lexbase/Mrkoll.
Men det är personuppgifter med negativ laddning, i skala, sökbara på namn.

**Detta är riskkoncentrationen. Bygg motdragen i pipelinen, inte i efterhand:**
- Publicera **aldrig** fullständigt org.nr för enskild firma (specen rekommenderar
  redan maskering — gör det obligatoriskt i normaliseringen, inte valfritt).
- Publicera aldrig folkbokföringsadress. Bara verksamhetsställets adress.
- Bygg sidan runt **anläggningen** (`idNational`, F-kod) som entitet — inte runt
  näringsidkaren. Rubriken ska vara serveringsstället, inte personen.
- Ha en fungerande, snabb rutin för radering/invändning/rättelse med publik
  kontaktväg. Efter C-199/24 räcker det inte att hänvisa till ansvarig utgivare.
- Överväg `noindex` på namnsökningar som råkar matcha personnamn.

### 🟢 GRÖN — grundlagsinskränkningen är uppskjuten, inte nära

Söktjänstutredningen (**SOU 2024:75**) föreslog att grundlagsskyddet skulle kunna
inskränkas från 1 januari 2027. **Regeringen meddelade 24 november 2025 att man
inte går vidare med grundlagsändringen.** Grundlagsändring kräver två riksdagsbeslut
med val emellan — i praktiken skjuts frågan minst fyra år. En ny utredning om
åtgärder i *vanlig lag* ska redovisas **11 mars 2027**.

Så: hotet mot affärsmodellen kommer inte från grundlagen. Det kommer från
EU-rätten och IMY, och det har redan kommit.

### 🟡 Förtal: låg men inte noll — och risken sitter i rubrikerna, inte i datan

Att återge en myndighets egen bedömning, korrekt, med källa och datum, är den
starkaste tänkbara positionen. Risken uppstår tre ställen:
1. **Felmatchning** — fel restaurang får fel betyg. Detta är den enskilt största
   praktiska rättsrisken i hela projektet, och den är *teknisk*, inte juridisk.
   (R1 visar att join-nyckeln är svag.)
2. **Inaktualitet** — en gammal anmärkning presenterad som aktuell.
3. **Egen tolkning** — "matsnuskligan", TikTok-vinkeln, leaderboards med
   värdeladdade rubriker. Där lämnar du myndighetens bedömning och gör ett eget
   påstående. Det är där ansvarsfrihetsregeln blir svårare.

### Go / no-go

**GO — med villkor.** Affärsmodellen är hållbar, men den juridiska grunden är en
annan än bibeln antar:

| Bibelns antagande | Faktiskt läge |
|---|---|
| Utgivningsbevis = grundlagsskydd, GDPR ur vägen | Utgivningsbevis ≠ GDPR-undantag (C-199/24) |
| Skyddet kan tas bort av lagstiftaren | Grundlagsspåret pausat; EU-rätten är det som biter |
| Juridik löses med ett papper för 4 000 kr | Juridik löses med redaktionell praktik som kan bevisas |

Villkoren: (a) sök utgivningsbevis ändå, (b) bygg GDPR-efterlevnad parallellt,
(c) publicera metodiken innan första sidan går live, (d) håll enskilda firmor
maskerade, (e) håll leaderboard-retoriken faktabaserad.

**Vad som skulle vända detta till NO-GO:** om IMY:s pågående tillsyner eller en
kommande svensk dom slår fast att även *bearbetade* databaser med utgivningsbevis
måste radera på begäran utan intresseavvägning. Då försvinner täckningen för
enskilda firmor — cirka den grupp som är vanligast bland små restauranger.
Bevaka IMY:s beslut i de fyra pågående ärendena.

---

## 1. Utgivningsbevis — vad det faktiskt är, kostar och kräver

**Myndigheten heter numera Mediemyndigheten.** `mprt.se` 301-redirectar till
`mediemyndigheten.se`. Bibeln och äldre research säger MPRT — uppdatera.

### Vad det skyddar

Med utgivningsbevis omfattas databasen av **yttrandefrihetsgrundlagen (YGL)**.
Konkret innebär det:

- **Ensamansvar.** Ansvarig utgivare bär hela det straffrättsliga ansvaret för
  publiceringen. Ingen annan i organisationen kan åtalas för innehållet.
- **Exklusiv brottskatalog.** Endast gärningar uppräknade i YGL kan straffas
  (bl.a. förtal). Andra lagars förbud slår inte igenom mot innehållet.
- **JK som ensam åklagare** och tryckfrihetsjury — en väsentligt högre tröskel än
  ett vanligt brottmål eller tvistemål.
- **Censurförbud, meddelarfrihet, efterforskningsförbud, källskydd.**

**Vad det inte längre säkert skyddar:** GDPR-anspråk. Se avsnitt 2.

### Krav på databasen (Mediemyndighetens egna kriterier)

- "Den är tillgänglig för allmänheten."
- "Den tillhandahålls på särskild begäran, det vill säga att besökaren aktivt
  söker upp den."
- "Den är väl avgränsad och framstår som en sammanhållen produkt, exempelvis genom
  enhetlig formgivning."
- "Den kan inte ändras av någon annan än redaktionen."
- "Den har ett namn som innehåller ett domännamn eller motsvarande."
- Anknytning till Sverige, bl.a. genom att redaktionen finns här.
- Namnet får inte förväxlas med redan registrerad databas.
- Ansvarig utgivare måste finnas.

**Kraven är formella.** KU konstaterar i betänkande 2025/26:KU18 (15 januari 2026)
att kraven är "av formell karaktär" och att "det går alltså att få grundlagsskydd
även för databaser som inte har någon massmedial karaktär". Prikko kvalificerar
utan problem.

### Fallgrop som träffar Prikkos produktplan direkt

**Diskussionsforum och kommentarer som inte är förhandsmodererade måste avskiljas
från övriga webbplatsen.** Bibeln §7b planerar förstapartsrecensioner. De faller
under användargenererat innehåll och måste antingen förhandsmodereras eller ligga
tekniskt avskilt från den grundlagsskyddade databasen. Samma sak gäller
`ownerComment` om verksamheten får skriva direkt — går den in oredigerad genom ett
formulär kan hela avgränsningen ifrågasättas. **Lös detta i arkitekturen: alla
externa bidrag passerar redaktionell granskning innan publicering.** Det stärker
dessutom C-199/24-positionen.

### Kostnad (verifierat mot förordning)

Reglerat i **förordning (2024:1170)** om avgifter i ärenden om utgivningsbevis,
i kraft 1 januari 2025:

| Åtgärd | Avgift |
|---|---|
| Ansökan om eller förnyelse av utgivningsbevis | **4 000 kr** |
| Ändring av databasens namn, ort eller teknisk beskrivning | 2 000 kr |
| Ändring av vem som bedriver verksamheten / är utgivare eller ställföreträdande utgivare | 1 000 kr |

Betalas till bankgiro **787-6949**, märkt med domänadressen. Avgiften måste vara
betald innan ärendet handläggs. (Notera: äldre källor på nätet anger 2 000 kr för
ansökan — det är den gamla taxan. 4 000 kr är den aktuella.)

**Praktisk konsekvens:** namnet kostar 2 000 kr att ändra i efterhand. Lås "Prikko"
och prikko.se *innan* ansökan.

### Giltighet och löpande skyldigheter

- Beviset gäller **10 år**, kan förnyas.
- Verksamheten måste ha **påbörjats inom sex månader** från att beviset utfärdades.
- Databasens **namn, leverantör och utgivare ska anges** på alla ytor beviset
  gäller (webbplats, app, push).
- **Innehållet ska dokumenteras och bevaras i sex månader.** För en sajt vars
  hela innehåll är genererad data betyder det versionerade snapshots av
  publicerade sidor — inte bara databasdumpar. Bygg in det i CI från början; det
  är billigt nu och dyrt att rekonstruera senare.
- Villkoren måste vara uppfyllda löpande. Beviset kan **återkallas** om de inte är
  det (Mediemyndigheten har återkallat bevis, bl.a. 2022).

### Ansvarig utgivare

- Ska alltid finnas, ska vara utsedd och anmäld.
- Bär ensam det straffrättsliga ansvaret för yttrandefrihetsbrott.
- **Måns själv kan vara ansvarig utgivare.** Det är vanligt i enmansprojekt, och
  det är gratis. Men det innebär personligt straffrättsligt ansvar för varje
  publicerad sida — inklusive de som genereras automatiskt från kommunal data.
  Det är ett reellt argument för kvalitetsgrind och rättelserutin, inte bara
  ett SEO-argument.

### Handläggningstid

**EJ VERIFIERAT.** Mediemyndigheten publicerar ingen handläggningstid för
databasärenden på webben. Ansökan sker via e-tjänst i 11 steg. Rekommendation:
mejla myndigheten och fråga innan Fas 0 tidsätts — det är enda sättet att få
siffran.

**Källor:**
- https://mediemyndigheten.se/ansokan-och-registrering/utgivningsbevis-och-databaser/
- https://mediemyndigheten.se/ansokan-och-registrering/medier-pa-natet/
- https://mediemyndigheten.se/ansokan-och-registrering/regelverk/ansvarig-utgivare/
- https://e-tjanst.mediemyndigheten.se/EServiceStart.aspx?id=92946360-d90d-4255-8f2e-c400f1a8d17b
- https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/forordning-20241170-om-avgifter-i-arenden-om_sfs-2024-1170/
- https://www.riksdagen.se/sv/dokument-och-lagar/dokument/betankande/tryck-och-yttrandefrihet-massmediefragor_hd01ku18/
- https://mediemyndigheten.se/nyhetsrum/nyhetslista/2022/mprt-aterkallar-utgivningsbevis/

---

## 2. Existentiell risk: utgivningsbevis vs GDPR — status 2025–2026

Kort version: **grundlagsspåret har stannat, men EU-rättsspåret har gått i mål.
Skyddet är redan inskränkt — genom domstol, inte genom lagstiftare.**

### Tidslinje (verifierad)

| Datum | Händelse |
|---|---|
| 14 maj 2024 | **IMY:s rättsliga ställningstagande:** myndigheten är behörig att inleda tillsyn mot söktjänster med utgivningsbevis efter enskildas klagomål. Praxisomsvängning. |
| Nov 2024 | **SOU 2024:75 "Personuppgifter och mediegrundlagarna"** — föreslår att undantaget i TF/YGL utvidgas från känsliga personuppgifter till *alla* personuppgifter, och att det ska gälla när publicering medför särskilda risker för otillbörligt integritetsintrång. Ikraftträdande föreslogs 1 jan 2027. |
| 10 mars 2025 | Remisstiden går ut. |
| Feb 2025 | **HD, två beslut:** den svenska ordningen där personuppgifter om lagöverträdelser lämnas ut i stor omfattning utan att GDPR tillämpas är **inte förenlig med GDPR**. GDPR blir fristående måttstock vid sekretessprövning; uppgifter kan lämnas ut med förbehåll som förbjuder tillgängliggörande för allmänheten och sökbarhet. |
| 2025 | IMY inleder tillsyn mot Upplysning.se (Upplysning Checknode AB) och Mrkoll.se (Nusvar AB) om rätten till radering. Sammanlagt **fyra pågående tillsyner** mot söktjänster med utgivningsbevis. IMY utreder inte enskilda klagomål medan den samlade granskningen pågår. |
| **24 nov 2025** | **Regeringen backar.** Debattartikel i Dagens industri av justitieminister Gunnar Strömmer (M), civilminister Erik Slottner (KD) och Martin Melin (L): *"Att göra ändringar i grundlag innan rättsläget är klart är inte aktuellt."* Man avvaktar EU-domstolen och tillsätter i stället en utredning om åtgärder i vanlig lag (bl.a. sekretesslagstiftning). **Ska redovisas 11 mars 2027.** |
| 15 jan 2026 | **KU-betänkande 2025/26:KU18** avslår motionsyrkanden om söktjänster; utskottet bedömer att det är välavvägt att invänta EU-domstolen. |
| **9 juli 2026** | **EU-domstolen, mål C-199/24** (Lexbase-målet; begäran om förhandsavgörande från Attunda tingsrätt). Se nedan. |
| Juli 2026 | IMY: *"Vi välkomnar att vi nu har en dom från EU-domstolen som klargör hur EU-rätten förhåller sig till svensk grundlag i de här fallen"* (David Törngren, rättschef). IMY analyserar domen mot sina fyra pågående tillsyner. |

### Vad C-199/24 faktiskt säger

- **Ett utgivningsbevis är inte tillräckligt för att undanta en verksamhet från
  GDPR.** Nationell lagstiftning får inte innebära att GDPR generellt sätts åt
  sidan med hänvisning till yttrande- och informationsfriheten.
- Det journalistiska undantaget kräver **redigering/bearbetning, redaktionell
  linje eller pressetiska regler, och faktakontroll före publicering**.
- Att enbart tillhandahålla allmänheten offentliga handlingar mot betalning, utan
  redigering, redaktionell linje eller faktakontroll, är inte journalistisk
  verksamhet.
- Att kräva att den registrerade **inleder en förtalsprocess** för att skydda sina
  personuppgifter är inte förenligt med EU-rätten.

Attunda tingsrätt ska nu tillämpa detta i sakfrågan.

### Rak bedömning för Prikko

**Affärsmodellen överlever, men premissen ändras.**

Prikko är inte en söktjänst över privatpersoner. Den publicerar
livsmedelskontroller per verksamhetsställe, där merparten av verksamheterna är
juridiska personer utanför GDPR:s tillämpningsområde. Den bearbetar data, har
publicerad metodik och replikrätt. Den är, till skillnad från Lexbase, inte en
betalvägg framför råa myndighetshandlingar.

**Men:** utgivningsbeviset kan inte längre användas som argumentet "GDPR gäller
inte oss". Det argumentet är dött sedan 9 juli 2026. Det som återstår är att
faktiskt uppfylla det journalistiska undantaget — vilket är en *arbetsinsats*, inte
en registrering. Och för enskilda firmor behöver Prikko ändå kunna hantera
raderings- och invändningsbegäranden på ett trovärdigt sätt.

**Vad som fortfarande är osäkert (EJ VERIFIERAT):**
- Om IMY kommer att anse att kommersiellt aggregerad myndighetsdata om
  näringsverksamhet, med redaktionell bearbetning, uppfyller det journalistiska
  undantaget. Det är den avgörande frågan för Prikko och den är obesvarad.
- Vad den nya utredningen (redovisning 11 mars 2027) föreslår om
  sekretesslagstiftning — om kommunal livsmedelskontrolldata skulle
  sekretessbeläggas vore det ett direkt hot mot datatillgången. Inget tyder på
  att det övervägs (utredningen riktar in sig på bakgrundskontroller och
  brottsuppgifter), men det bör bevakas.
- Om Mediemyndigheten skärper sin prövning av utgivningsbevis efter domen.
  Ingen indikation, men logiskt tänkbart.

**Källor:**
- https://www.imy.se/nyheter/dom-fran-eu-domstolen-om-soktjanst-med-utgivningsbevis
- https://www.delphi.se/sv/tech-blog/utgivningsbevis-skyddar-inte-fran-gdpr-eu-domstolens-dom-i-lexbase-malet/
- https://www.cederquist.se/sv/artiklar/eu-domstolens-dom-i-lexbase-malet-cG9zdDoxNjA3Nw==/
- https://www.dagensjuridik.se/nyheter/eu-domstolen-lexbase-inte-journalistisk-verksamhet/
- https://www.svt.se/kultur/nu-kommer-eu-dom-om-lexbase
- https://www.imy.se/nyheter/imy-har-behorighet-att-granska-soktjanster-med-utgivningsbevis
- https://www.imy.se/nyheter/imy-granskar-ytterligare-tva-soktjanster-med-utgivningsbevis/
- https://www.imy.se/privatperson/dataskydd/imy-utreder-inte-klagomal-om-soktjanster-medan-samlad-granskning-pagar/
- https://www.regeringen.se/rattsliga-dokument/statens-offentliga-utredningar/2024/11/sou-202475/
- https://www.regeringen.se/pressmeddelanden/2024/11/utredning-foreslar-starkt-skydd-for-personuppgifter-som-offentliggors-i-soktjanster/
- https://www.news55.se/samhalle/stoppar-inte-kritiserade-soktjanster-verktyg-for-kriminella/
- https://www.cederquist.se/sv/artiklar/vagledning-fran-hogsta-domstolen-rorande-gdprs-relation-till-svenska-mediegrundlagar-cG9zdDoxMTg3OA==/

---

## 3. Att publicera namngivna verksamheters kontrollresultat

### 3.1 Förtal skyddar bara fysiska personer

**BrB 5 kap. 1 §** förutsätter att någon utpekas som brottslig eller klandervärd i
sitt levnadssätt, eller att uppgiften är ägnad att utsätta denne för andras
missaktning. Skyddsobjektet är den **fysiska personens** ära.

**Juridiska personer saknar förtalsskydd.** Positionen är över hundra år gammal
(NJA 1904 s. 483). Så kallat "ekonomiskt förtal" — nedsättande uppgifter som
skadar ett företag ekonomiskt utan att angripa någons personliga heder — är
**inte kriminaliserat i Sverige**. Motioner om att kriminalisera det har avslagits
(bl.a. 1971 och 1972).

**Konsekvens:** ett aktiebolag som driver en restaurang kan i praktiken inte
förtalas av Prikko. Det är en betydande strukturell fördel.

### 3.2 Men enskild firma bryter igenom skyddet

Två vägar in:

1. **Direkt.** Enskild firma är ingen juridisk person. Näringsidkaren *är* den
   fysiska personen. En uppgift om "allvarliga anmärkningar" hos "Anna Svenssons
   Gatukök" är en uppgift om Anna Svensson.
2. **Indirekt, även för bolag.** **NJA 1950 s. 250:** ett nedsättande uttalande om
   ett aktiebolag ansågs utgöra förtal av en fysisk person, eftersom personens namn
   ingick i firman och kopplingen därmed var tillräckligt stark. Åklagarmyndighetens
   rättsliga vägledning (RättsPM 2022:2) bekräftar att 5:1 kan omfatta uttalanden
   där en fysisk person inte utpekas direkt men uppgiften rör t.ex. ohederliga
   affärsmetoder eller vanskötsel av ett företag.

Detta är samma riskgrupp som R1 identifierade av helt andra skäl (org.nr =
personnummer). **Enskild firma är den enda verkligt exponerade kategorin i
Prikkos datamängd — juridiskt, dataskyddsrättsligt och tekniskt.** Det motiverar
en särskild kodväg för dem i pipelinen.

### 3.3 Att uppgiften är sann räcker inte

Ansvarsfrihetsregeln i **BrB 5 kap. 1 § andra stycket** är kumulativ, inte
alternativ. Två villkor måste båda vara uppfyllda:

1. Man var **skyldig** att uttala sig, **eller** det var annars med hänsyn till
   omständigheterna **försvarligt** att lämna uppgiften, **och**
2. uppgiften var **sann** eller man hade **skälig grund** för den.

Det är en vanlig missuppfattning att sanning i sig är en försvarsgrund. Den är
det inte. Försvarlighetsprövningen görs separat och väger allmänintresset mot
intrånget.

**Prikkos försvarlighetsargument är ovanligt starkt:**
- Uppgiften är myndighetens egen bedömning ur allmän handling.
- Allmänintresset (livsmedelssäkerhet, konsumentskydd) är evident och erkänt —
  det är hela grunden för att kommunerna publicerar datan.
- Publiceringen är saklig, daterad, källhänvisad och försedd med replikrätt.
- Kombinerat med utgivningsbevis: ensamansvar, JK som ensam åklagare, jury.

**Där argumentet försvagas:**
- Vid felmatchning eller inaktualitet är uppgiften inte sann om just den
  verksamheten. Då faller villkor 2.
- Vid egen tolkning som går längre än myndighetens bedömning ("landets sämsta
  kök", "matsnusk") gör Prikko ett eget påstående. Då prövas *det* påståendets
  sanning och försvarlighet — inte kommunens.

**Konkret rekommendation för leaderboardsidorna (bibeln §6, §9):** håll rubriken
mätbar och härledbar. "Flest anmärkningar vid livsmedelskontroll i Stockholm
2026" är ett faktapåstående som kan beläggas. "Stockholms äckligaste restauranger"
är ett värdeomdöme som Prikko själv får försvara. PR-värdet i det senare är
mindre än den juridiska kostnaden.

### 3.4 Marknadsföringsrättslig exponering

**Marknadsföringslagen (2008:486)** träffar näringsidkares *marknadsföring*.
Redaktionellt innehåll är i princip inte marknadsföring, och innehåll under YGL
har dessutom grundlagsskydd som MFL inte slår igenom mot.

**Men två relevanta figurer finns:**
- **Misskreditering:** att i sin marknadsföring beskriva andra företag på ett
  kränkande eller nedsättande sätt. Härleds ur generalklausulen i MFL 5 §
  (god marknadsföringssed).
- **Renommésnyltning:** att otillbörligt anknyta till annans verksamhet,
  produkter eller kännetecken. Inte lagfäst uttryckligen; utvecklad i praxis från
  Marknadsdomstolen ur MFL 5 §.

**Var Prikko blir exponerat:** när den redaktionella publiceringen och den
kommersiella verksamheten blandas. Bibeln §10 planerar SaaS till samma
restauranger som betygsätts, plus inbäddningsbara badges med restaurangens namn
och logotyp-kontext. Kombinationen "vi publicerar ditt låga betyg" + "köp vår
tjänst" är den känsligaste ytan i hela affärsmodellen — juridiskt *och*
förtroendemässigt.

Bibeln har redan rätt etisk regel ("aldrig förbättringstjänster till lågt
betygsatta"). Skärp den till en strukturell: **ingen säljkommunikation får
utlösas av eller referera till ett lågt betyg.** Skilj redaktion och försäljning
även tekniskt.

**EJ VERIFIERAT:** ingen svensk praxis funnen där MFL tillämpats på en
databas/aggregator som publicerar myndighetsdata om namngivna företag. Frågan
förefaller oprövad.

### 3.5 Har företag stämt Ratsit / Hitta / Merinfo?

**Ingen sådan praxis har kunnat hittas. EJ VERIFIERAT — och sannolikt för att den
inte finns.**

Vad som faktiskt existerar:
- **Tillsyn, inte tvistemål.** Datainspektionen (nu IMY) mot Ratsit och Merinfo
  2013: sajterna lämnade ut ekonomisk information om **privatpersoner** i strid med
  **kreditupplysningslagen (1973:1173)**. Föreläggande att sluta publicera.
- **Enskilda personer** som processar om radering och kränkning — det är det spår
  som lett fram till C-199/24.
- **IMY:s pågående tillsyner** mot Upplysning.se och Mrkoll.se.

Mönstret är entydigt: **konflikten om svenska aggregatorer har hela tiden handlat
om fysiska personers integritet, aldrig om företags anseende.** Det är exakt varför
Prikkos inriktning på verksamheter är strukturellt tryggare än Ratsits — och exakt
varför enskild firma är den enda punkt där Prikko hamnar i samma juridiska
landskap som dem.

**Kreditupplysningslagen är inte tillämplig på Prikko** (hygienbetyg är inte
kreditupplysning, och lagen träffar uppgifter om kreditvärdighet). Men den är
värd att känna till: den är exemplet på hur *vanlig lag* kan begränsa en
grundlagsskyddad databas när ändamålet är ett annat än publicering.

**Källor:**
- https://www.aklagare.se/globalassets/dokument/rattsliga-vagledningar/rav-202202-fortal-och-forolampning-.pdf
- https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/brottsbalk-1962700_sfs-1962-700/
- https://www.diva-portal.org/smash/get/diva2:1201471/FULLTEXT02 (Förtal mot juridisk person)
- https://www.diva-portal.org/smash/get/diva2:1185726/FULLTEXT01.pdf (Ekonomiskt förtal)
- https://www.imy.se/om-oss/arkiv/nyhetsarkiv/ratsit-och-merinfo-bryter-mot-lagen/
- https://www.imy.se/globalassets/dokument/beslut/2013-/2013-09-18-merinfo.pdf
- https://www.jpinfonet.se/kunskap/kunskapsbank/marknadsforingslagen/

---

## 4. Kommunala öppna data som återpubliceras kommersiellt

### Rättslig ram

**Lagen (2022:818) om den offentliga sektorns tillgängliggörande av data**
("öppna data-lagen"), i kraft 1 augusti 2022, genomför EU:s öppna data-direktiv
(2019/1024) och ersätter PSI-lagen. Utgångspunkten är att data ska få
vidareutnyttjas fritt, även **kommersiellt**, och att eventuella villkor "aldrig
i onödan [ska] begränsa möjligheterna till vidareutnyttjande".

### Upphovsrätt

Faktauppgifter i myndighetsbeslut är i regel inte upphovsrättsligt skyddade.
Digg rekommenderar **CC0 eller PDM** för information och databaser som skapas hos
myndighet inom myndighetsutövning. Lantmäteriet har gått över till CC0 och
**tagit bort** sitt tidigare krav på källhänvisning — ett tydligt riktmärke för
vart svensk praxis rör sig.

### Vad gäller för livsmedelsinspektioner specifikt

Sambruk/NSÖD-specen anger i sin DCAT-AP-SE-beskrivning:

> "Licens – Creative Commons (rekommenderas) CC-0 licens"

Rekommendationen upprepas för både JSON- och CSV-distributionen.

**Under CC0 krävs ingen attribution rättsligt.**

### Men — och detta är den praktiska varningen

**Licensen bestäms av varje kommun, inte av specen.** Specen *rekommenderar*
CC0; den binder ingen. En kommun som väljer **CC-BY 4.0** gör källangivelse till
ett faktiskt licensvillkor. Livsmedelsverket använder t.ex. CC-BY 4.0 för sina
öppna data, medan Konsumentverket använder CC0 — samma sektor, olika val.

**Linköpings faktiska licensvillkor: EJ VERIFIERAT.** Varken
`linkoping.se/open`, `linkoping.se/open/vad-ar-oppna-data/` eller
`livsmedelsdata.linkoping.se/swagger/index.html` anger licens eller
användarvillkor på ett sätt som gått att läsa av. Eftersom detta är projektets
enda live-datakälla i dag bör det redas ut — antingen via datamängdens post på
dataportal.se eller genom en fråga till kommunen.

### Rekommendation

1. **Registrera licens per kommun som ett fält i pipelinen**, hämtat från
   datamängdens DCAT-metadata. Behandla okänd licens som "attribution krävs" tills
   motsatsen är belagd.
2. **Attribuera alltid ändå**, även under CC0. Tre skäl: E-E-A-T och AEO (bibeln
   §6, §6b bygger på källhänvisning per sida), förtroende, och relationen till de
   ~270 kommuner du behöver samarbeta med för massutlämnandena. Att vara den
   aktör som citerar kommunen korrekt är billig goodwill i en process som annars
   är seg.
3. **Observera att öppna data-lagen inte trumfar GDPR.** Att en kommun publicerat
   personuppgifter under CC0 gör dem inte fria att behandla hur som helst. Licensen
   reglerar immaterialrätt, inte dataskydd. Det är en vanlig och farlig
   sammanblandning.

**Källor:**
- https://sambruk.github.io/livsmedel/misc/DCAT-AP-SE.html
- https://www.digg.se/kunskap-och-stod/oppna-och-delade-data/rekommendation-om-oppna-licenser-och-immaterialratt
- https://www.digg.se/kunskap-och-stod/regler-och-rekommendationer/regler-och-rekommendationer/oppna-upp-och-dela-data-via-sveriges-dataportal
- https://skr.se/digitaliseringivalfarden/datadrivenutveckling/oppnadatadatalagenochstod.8407.html
- https://www.linkoping.se/open/

---

## 5. Varumärke: "Prikko" och ansiktsmärket

### Namnet

Sökning i **TMview** (EUIPO:s samlade databas, 141 917 158 varumärken, omfattar
bl.a. SE, EM (EU), WO, DK, NO, FI, DE), sökkriterium "Contains" = `prikko`:

**3 träffar totalt, ingen relevant:**

| Märke | Ansökt | Klasser | Status | Myndighet | Innehavare |
|---|---|---|---|---|---|
| PRIKKOLO | 1985-10-29 | 5, 32, 33 | Ended | Österrike (OPA) | Henkell & Co. |
| Prikkolo | 1953-01-02 | 32, 33 | Expired (2023-01-31) | Tyskland (DPMA) | Henkell & Co. Sektkellerei |
| Prikkolo | 1964-01-31 | 32, 33 | Registered (t.o.m. 2034) | WIPO | Henkell & Co. Sektkellerei |

- **Inget exakt "PRIKKO" existerar** i någon deltagande myndighets register.
  TMviews autocomplete föreslår enbart "Prikkolo".
- **Ingen svensk (SE) eller EU (EM) registrering** innehåller strängen.
- **Ingen träff i klass 9, 35 eller 42.**

**Bedömning: låg konfliktrisk.** Prikkolo är registrerat för mousserande vin och
läskedrycker (klass 32/33) — varuslagslikhet med databastjänster (9/42) och
annons-/företagstjänster (35) saknas i praktiken. Den enda kvarvarande
registreringen är dessutom en gammal WIPO-registrering hos en tysk
vinproducent, utan svensk designering som framgått av sökningen.

**EJ VERIFIERAT:**
- Professionell förväxlingsbedömning (Prikko/Prikkolo skiljs av en stavelse; en
  varumärkesjurist bör bekräfta att varuslagsolikheten räcker).
- Om Prikkolo-WIPO-registreringen designerar Sverige.
- **Företagsnamn hos Bolagsverket** och firmarättsligt skydd — separat register,
  inte kontrollerat här.
- Oregistrerade rättigheter genom inarbetning.

### Ansiktsmärket — verklig risk, hanterbar

Bibeln §7b låser "fristående ansiktsmärke (två prickar + leende)". Det är en
smiley, och det är den enda designbeslut i projektet med reell
immaterialrättslig exponering.

**Vad som är belagt:**
- The Smiley Company (London) gör anspråk på rättigheter till smiley-ansiktet i
  **över 100 länder**, har en egen "Brand Protection"-avdelning och en lång
  historia av att aggressivt skydda sin IP. Bolaget har omfattande TTAB-historik i
  USA och registrerade SMILEY-märken hos EUIPO.
- Smiley-former **kan vara inneboende särskiljande.** Tribunalen har slagit fast
  att en smiley-form i sig är särskiljande och uppfattas som ursprungsangivelse
  (McCain/Agrarfrost).
- Invändningar mot smiley-figurmärken förekommer och prövas i Tribunalen
  (t.ex. T-491/22, Zitro — figurmärke föreställande en smiley med hög hatt).

**Bibeln har redan rätt instinkt** ("Inte Smiley", §8). Men beslutet i §7b —
två prickar plus leende — går tillbaka mot samma formspråk. Dessutom noterar
bibeln själv att Danmark och Norge använder smiley-ansikten officiellt; att likna
dem är en *separat* risk (associationen till ett offentligt system Prikko inte
är del av).

**Rekommendationer, i ordning:**
1. **Undvik den klassiska konfigurationen**: gul cirkel, svarta prickar, svart
   kurvbåge. Det är den kombination Smiley Company byggt sitt anspråk på.
2. Bibelns egna designval hjälper redan: **squircle i betygsfärg** (inte gul
   cirkel), färg som bär betydelse, bokstav/siffra i märket. Behåll det.
3. Gör munnen till ett **datamärke** — en linje vars form är en direkt funktion
   av betyget (rak = neutral, nedåt = anmärkning). Då är den informationsbärande,
   inte dekorativ, och likheten blir funktionell snarare än estetisk.
4. **Kör en figurmärkessökning på Wienklassificering** (2.9.1 ansikten /
   26.1 cirklar) i TMview innan logotypen låses. Inte gjord här — bara
   ordmärkessökning.
5. Ta beslutet om ansiktsmärket i samma jurist-genomgång som namnet. Det är en
   timme som sparar en ombudsstrid.

**Källor:**
- https://www.tmdn.org/tmview/ (sökning utförd 2026-08-02)
- https://search.prv.se/#/trademark (PRV:s nationella databas — TMview omfattar SE)
- https://thesmileycompany.com/legal-services/
- https://en.wikipedia.org/wiki/The_Smiley_Company
- https://ttabvue.uspto.gov/ttabvue/v?corr=THE+SMILEY+COMPANY
- https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX%3A62022TJ0491

---

## 6. Sammanställd åtgärdslista

**Före första publicering (blockerande):**
1. Publicera metodiksidan. Den är inte marknadsföring — den är det juridiska
   försvaret enligt C-199/24-kriterierna.
2. Skriv en kort redaktionell policy (urval, faktakontroll, rättelse, replikrätt).
   Publicera den.
3. Bygg maskering av org.nr för enskild firma som obligatorisk i pipelinen.
4. Bygg rättelse- och raderingsrutin med publik kontaktväg.
5. Bygg sexmånaders-arkivering av publicerade sidor i CI.
6. Håll alla användarbidrag (recensioner, `ownerComment`) förhandsmodererade eller
   tekniskt avskilda.

**Före ansökan om utgivningsbevis:**
7. Lås namn och domän (namnändring kostar 2 000 kr i efterhand).
8. Utse ansvarig utgivare.
9. Mejla Mediemyndigheten om handläggningstid.
10. Betala 4 000 kr till bg 787-6949, märkt med domänadressen.

**Före namnlåsning:**
11. Varumärkesjurist: Prikko vs Prikkolo, figurmärkessökning, Bolagsverket.

**Löpande bevakning:**
12. IMY:s beslut i de fyra tillsynerna mot söktjänster med utgivningsbevis.
13. Attunda tingsrätts avgörande i Lexbase-målet efter C-199/24.
14. Utredningen om åtgärder i vanlig lag — redovisas 11 mars 2027.
15. Licens per kommun, registrerad som fält i datamodellen.

---

## 7. Vad som är EJ VERIFIERAT

| Fråga | Status |
|---|---|
| Handläggningstid för utgivningsbevis för databas | Publiceras inte av Mediemyndigheten |
| Om IMY anser att bearbetad myndighetsdata om näringsverksamhet omfattas av journalistiska undantaget | Obesvarad — avgörande för Prikko |
| Linköpings faktiska licensvillkor för livsmedelsdata-API:t | Anges inte på kommunens sidor eller i Swagger |
| Svensk praxis där ett företag stämt en aggregator för publicerade uppgifter | Ingen funnen; sannolikt existerar den inte |
| MFL tillämpad på databas som publicerar myndighetsdata om namngivna företag | Ingen praxis funnen; frågan oprövad |
| Om Prikkolo-WIPO-registreringen designerar Sverige | Ej kontrollerat |
| Företagsnamnsskydd hos Bolagsverket för "Prikko" | Ej kontrollerat |
| Figurmärkeskonflikt för ansiktsmärket (Wienklassificering) | Ej sökt — endast ordmärkessökning gjord |
| Exakt målnummer/ECLI och domskälens fulltext i C-199/24 | Målnumret C-199/24 och datum 9 juli 2026 belagt via två oberoende advokatbyråkällor och IMY; domstexten inte läst i original |
| HD:s två beslut feb 2025 — målnummer | Refererade av Cederquist, målnummer ej angivna |

---

*Research sammanställd 2026-08-02 mot primärkällor (Mediemyndigheten, riksdagen.se,
regeringen.se, IMY, EUIPO/TMview, Sambruk, Digg) kompletterade med
advokatbyråkommentarer där primärkällan inte varit tillgänglig. Detta är inte
juridisk rådgivning. Punkterna 1–3 bör gås igenom med ombud innan sajten
publiceras.*
