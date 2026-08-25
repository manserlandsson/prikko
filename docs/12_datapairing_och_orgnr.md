# 12. Ihopparning av Prikkos data: organisationsnumret som lås, och registren bakom det

Datum: 2026-08-03. Alla siffror om vårt eget bestånd är körda mot databasen samma
dag, inte gissade. Alla externa källor är verifierade med anrop eller sidhämtning,
och där jag inte kunnat verifiera skriver jag ut det.

---

## RÄTTELSE 2026-08-25: för Stockholm räcker ett GET

Rapporten nedan är skriven innan Stockholms **registreringsintyg** var känt. Tre
av dess påståenden gäller inte längre för Stockholm, alltså för 8 520 av 16 047
rader, 53 procent av beståndet. De står kvar oförändrade nedan, med en hänvisning
hit, eftersom en rapport som skrivs om i efterhand inte går att lita på.

Intyget är serverrenderad HTML, kräver ingen inloggning och tar ingen annan
parameter än anläggningens id, som ÄR vårt eget id med prefixet `F-0180-`
avklippt:

    GET https://etjanster.stockholm.se/livsmedelsinspektioner/registration
        ?foodplaceid=<guid>

**Vad som mättes, och när.** 150 slumpade anläggningar ur `site/src/data/stockholm.json`,
hämtade 2026-08-25 med fyra trådar på 39 sekunder, frö 23. 150 av 150 svarade,
noll fel, noll okända etiketter. Fältutfall:

| Fält | Ifyllt |
|---|---|
| Person/Organisationsnummer | 150 av 150 |
| Postnummer och ort | 150 av 150 |
| Livsmedelsföretagare, juridisk person | 150 av 150 |
| Status, Aktiv eller Inaktiv | 150 av 150 |
| Registreringsdatum | 150 av 150 |
| Huvudsaklig inriktning | 150 av 150 |
| Omfattning, storleksklass | 150 av 150 |
| God efterlevnad | 150 av 150 |
| Tredjepartscertifiering | 150 av 150 |
| Beslutad kontrollfrekvens per 5 år | 149 av 150 |
| Beslutsdatum för riskklassning | 145 av 150 |
| Verksamhetstyper enligt Livsmedelsverkets modell | 149 av 150 |
| Aktivitetslista | 139 av 150 |

Fördelningar ur samma 150: aktiebolag 113, kommun eller stat 15, enskild firma 13,
ideell förening 5, ekonomisk förening 2, handelsbolag 2. Omfattning Liten 73,
Mikro 55, Mellan 17, Stor 5. God efterlevnad nej 76, ja 74. Kontrollfrekvens per
fem år 1:45, 2:41, 5:32, 4:22, 10:7, 15:2. 119 unika organisationsnummer på 150
verksamheter, alltså bär koncerner och kedjor flera rader var, och det går att
bilda på numret i stället för på namnlikhet som `site/src/lib/kedjor.ts` gör i dag.

**De tre påståendena som faller:**

1. *Punkt 1 och avsnitt A1: orgnr kräver en binärsökning på ungefär 60 anrop per
   verksamhet.* Nej. Ett GET ger numret i klartext. Prefixnedstigningen i
   sökfiltret `FoodPlaceOrgNr` fungerar fortfarande och är fortfarande sann som
   beskrivning, men den är onödig.

2. *Punkt 3 och avsnitt A3: gissa ur Bolagsverkets bulkfil och bekräfta med ett
   anrop.* Ingen bulkfil, ingen namnmatchning och ingen gissning behövs för
   Stockholm. Kommunens egen registerkoppling är svaret direkt, alltså är
   felmarginalen borta i stället för nedtryckt. Bulkfilen behövs fortfarande för
   de andra elva kommunerna.

3. *Avsnitt A och A2: postnummer är tomt i samtliga rader och är den starkaste
   särskiljaren vi saknar.* Postnumret står i intyget, 150 av 150. Det gör
   adressmatchningen mot företagsregistret starkare för hela Stockholm, för de
   fall där den ändå behövs.

**Personnumret är rapportens blinda fläck.** Fältet heter
"Person/Organisationsnummer" och bär innehavarens personnummer när verksamheten
drivs som enskild firma: 13 av 150, alltså ungefär var tolfte sida. Rapporten
nedan resonerar genomgående om "orgnr" som om alla nummer vore ett bolags. Det
är de inte. `prikko/stockholmsintyg.py` sållar dem på regeln att ett svenskt
organisationsnummer alltid har minst 2 som tredje siffra, medan ett personnummers
tredje siffra är månadens första och alltså 0 eller 1. Numret hålls inne;
upplysningen att verksamheten drivs som enskild firma bärs av `companyForm`.

**Intyget är dessutom ett nedlagt-orakel.** Status svarar Aktiv eller Inaktiv per
id, se `25_oppna_punkter.md`.

Kod: `pipeline/prikko/stockholmsintyg.py` och `pipeline/stockholmsintyg.py`.
Länken till formulären som samma id öppnar: `site/src/components/Anmal.astro`.

---

## Kort sammanfattning

Organisationsnumret är låset. Utan det är Prikko en ö. Med det öppnas i princip
hela det svenska företagsregisterlandskapet, och det viktigaste av dessa register
blev avgiftsfritt så sent som den 3 februari 2025.

Det finns tre nyheter i den här rapporten som ändrar bilden:

1. **Stockholms egen sökruta läcker organisationsnumret.**
   *Överspelad, se rättelsen ovan: ett GET mot registreringsintyget ger numret
   direkt.* Vi kastar inte bort
   orgnr i adaptern, källan returnerar det inte. Men samma kartgränssnitt vi redan
   anropar tar emot orgnr som sökfilter och matchar det som delsträng, kombinerat
   med anläggnings-id som ett OCH-villkor. Det gör gränssnittet till ett booleskt
   orakel som kan bekräfta ett orgnr för en namngiven verksamhet. Jag har bevisat
   det: för Alberts Cafe och Bar i Bromma föll numret ut som 802000-7046, giltigt
   Luhn-kontrollerat, på 60 anrop. Stockholm är 8 511 av 15 916 rader, alltså
   53 procent av hela beståndet.

2. **Bolagsverkets och SCB:s värdefulla datamängder är gratis, utan avtal, sedan
   3 februari 2025.** Uppslag på orgnr ger namn, adress, juridisk form, SNI och
   inlämnade årsredovisningar. Det finns dessutom en nedladdningsbar bulkfil över
   hela registret. Bulkfilen är det som gör namn plus adress-matchning möjlig helt
   offline, utan att betala per anrop.

3. *Gäller de elva andra kommunerna, inte Stockholm, se rättelsen ovan.*
   Kombinationen av de två gör matchningen både billig och trovärdig: matcha namn
   plus adress mot bulkfilen för att gissa ett orgnr, bekräfta sedan gissningen med
   ETT Stockholmsanrop i stället för sextio. Staden själv säger ja eller nej. Då är
   felmarginalen inte längre vår gissning utan kommunens egen registerkoppling.

Resten av rapporten bygger ut detta, tar kommunnivån (Kolada och Livsmedelsverkets
myndighetsrapportering), och landar i juridiken, där den strategiskt viktigaste
rekommendationen är utgivningsbevis för 3 000 kronor.

---

## Del A. Orgnr-problemet, som allt annat hänger på

Läget i dag, verifierat: `organization_number` är ifyllt i 0 av 15 916 rader.
`street_address` finns på 14 160 (89 procent), `locality` på alla 15 916, men
`postal_code` är tomt i samtliga rader och `district` och `region` likaså. Vi har
alltså gatunamn och ort men inget postnummer. Det försvagar adressmatchning, för
postnumret är den starkaste särskiljaren. Vi har däremot koordinat på 13 544 rader,
vilket är en annan och ofta bättre nyckel än postadressen (se A3).

> **Rättat 2026-08-25.** Postnumret är tomt i FILERNA, inte i verkligheten.
> Stockholms registreringsintyg lämnar ut det på 150 av 150 mätta, alltså går det
> att fylla för 8 520 av dagens 16 047 rader. Se rättelsen överst.

### A1. Levererar någon källa orgnr i råformat, som vi tappar i adaptern?

Jag läste alla tolv adaptrarna och sökte igenom deras råa svar. Svaret är nej med
ett viktigt undantag.

- **Linköping** (öppet API, 0580): listan `medsenastetillsyn` och detaljen per
  anläggning har fälten `anlaggningsId, objektsnamn, verksamhet, adress,
  geoPosition...` och tillsynshistorik. Inget orgnr, inget personnummer. Verifierat
  mot live-API i dag.
- **Uppsala, Örebro, Jönköping, Karlstad, Västerås, Oskarshamn, Lomma, Höganäs,
  Svenljunga, Kristinehamn, Borgholm**: ingen av adaptrarna refererar orgnr, och
  källorna (Livsmedelskollen-varianter, PDF, tabeller) bär det inte. Här kastar vi
  alltså inget, det finns inte att hämta.
- **Stockholm** (0180): svaret innehåller inte orgnr i klartext. MEN sökkontraktet
  `SearchFacilitiesMap`, som vi redan anropar, har ett fält `FoodPlaceOrgNr`.

Det sista är fyndet. Undersökningen av det:

Kontraktet tar `Ids` (lista med anläggnings-id) och `FoodPlaceOrgNr` (sträng)
samtidigt, och behandlar dem som ett OCH-filter. Orgnr matchas som delsträng, inte
exakt. Testat i dag:

- `FoodPlaceOrgNr:"556"` utan Ids ger takgränsens 1 500 träffar. Delsträngsmatchning
  bekräftad.
- `Ids:[id för Alberts Cafe]` plus `FoodPlaceOrgNr:"556"` ger 0 träffar.
- Samma Ids plus `FoodPlaceOrgNr:"16"` ger 1 träff.

Alltså: gränssnittet svarar sant eller falskt på frågan "börjar den här
anläggningens orgnr med den här strängen". Med en prefixnedstigning, en siffra i
taget, faller hela numret ut. Bevis, kört i dag mot deras produktionsgränssnitt:

    c42f58b1-... (Alberts Cafe och Bar) -> 16 802000-7046, 60 anrop, Luhn giltigt

Detta är alltså **allmän uppgift som staden själv gör sökbar**. Ingen inloggning
kringgås, ingen skyddad resurs berörs, exakt samma gränssnitt som stadens egen
karta använder. Men det är inte gratis i relationskapital: en naiv tömning av alla
8 511 Stockholmsverksamheter à ~50 anrop är omkring 425 000 anrop mot stadens
e-tjänst, precis när vi ska mejla 275 kommuner och be om välvilja. Det ser ut som
skrapning även när det är lagligt. Slutsatsen är inte att låta bli, utan att inte
använda oraklet som extraktor. Använd det som **verifierare**, se A3.

### A2. Går namn plus adress att matcha mot ett företagsregister?

Ja, men träffsäkerheten står och faller med en sak som är specifik för
restaurangbranschen: **den registrerade adressen är sällan restaurangens adress.**
Ett aktiebolag som driver en lunchservering registrerar ofta sin postadress hos
redovisningsbyrån eller ägarens hemadress. Att matcha vårt `street_address` plus
`locality` mot företagsregistrets postadress ger därför fler missar än man tror,
och vi saknar dessutom postnummer helt, vilket är den starkaste särskiljaren.
(Gäller inte Stockholm sedan 2026-08-25, se rättelsen överst.)

Två saker räddar matchningen:

- **Arbetsställe, inte juridisk person.** SCB:s företagsregister har utöver den
  juridiska personen ett arbetsställeregister med CFAR-nummer och besöksadress per
  fysiskt driftställe. Besöksadressen till ett arbetsställe ligger mycket närmare
  restaurangens verkliga adress än bolagets postadress. Arbetsställeregistrets fulla
  uppgifter är dock inte fritt öppna på samma sätt som de värdefulla datamängderna
  (ej verifierat i detalj, se osäkerheter nedan). Detta är en tråd att dra i, inte
  ett löst problem.
  **Tråden är dragen 2026-08-18, se `35_scb_foretagsregistret.md`.**
  Arbetsställeregistret är avgiftsfritt sedan 26 juni 2025 och bär
  `BesöksAdress`, kommunkod,
  femsiffrig SNI och en statusvariabel med värdet `9 Är ej längre verksam`. Det
  ligger dock INTE i de värdefulla datamängderna, vilkas lista är helt på
  organisationsnivå, utan bakom certifikat som kräver godkända användarvillkor.
- **Koordinaten.** Vi har lat/lng på 13 544 rader. En kandidat från registret kan
  rangordnas på geografiskt avstånd, inte bara på stränglikhet i adressen.

Felmarginalens kostnad är asymmetrisk och det är hela poängen. Ett felaktigt orgnr
betyder att vi kopplar en namngiven verksamhets hygienbrister till FEL företags
skulder, konkurs eller ägare. Det är inte ett stavfel, det är en potentiell
förtalssituation och exakt den sortens fel som raderar förtroendet metodiksidan är
byggd för att skydda. Slutsatsen: **publicera aldrig ett matchat orgnr som inte är
bekräftat.** En sannolik matchning är bra nog för intern analys och för att gissa,
aldrig bra nog för att visa på verksamhetssidan.

### A3. Den billiga och trovärdiga vägen: matcha offline, bekräfta med oraklet

> **Överspelad för Stockholm 2026-08-25.** Registreringsintyget ger numret på ett
> GET, alltså behövs varken bulkfil, kandidatgenerering eller verifierare för de
> 8 520 stockholmsraderna. Stegen nedan gäller de elva andra kommunerna, där
> inget orakel finns. Se rättelsen överst.

Sätt ihop A1 och A2:

1. Ladda ned Bolagsverkets och SCB:s bulkfil (gratis, se B1). Bygg ett lokalt index
   över namn, adress och SNI för alla svenska företag.
2. För varje Stockholmsverksamhet, generera en handfull kandidatorgnr genom att
   matcha namn plus ort plus SNI-sannolikhet (restaurang, café, butik) mot indexet.
3. Bekräfta varje kandidat med ETT Stockholmsanrop: `Ids:[anläggning]` plus
   `FoodPlaceOrgNr:"<fullt kandidatnummer>"`. Staden svarar 1 eller 0.

Det förvandlar 50 anrop per verksamhet till 1 till 3, och viktigare: det gör
kommunens egen registerkoppling till facit. En bekräftad träff är inte vår
gissning, det är stadens ja. För de andra elva kommunerna finns inget orakel, så
där stannar vi vid sannolik matchning som inte publiceras individuellt utan bara
används i aggregat.

Arbetsinsats: bulkfil plus fuzzy-index är en helg. Orakelverifieraren mot Stockholm
är byggd ovanpå den adapter som redan finns, ytterligare någon dag plus tålmodig
körning med snäll takt. Detta är den enskilt högsta värde-genom-insats-posten i
rapporten och ger orgnr på halva beståndet.

---

## Del B. Register att slå upp gratis på orgnr, verifierade

När vi väl har orgnr, vad kan vi hämta utan att betala?

### B1. Bolagsverket och SCB, värdefulla datamängder

- Myndighet och tjänst: Bolagsverket tillsammans med SCB, "API för värdefulla
  datamängder" och tillhörande nedladdningsbara filer (bland annat `scb_bulkfil`).
- Endpoint: REST-API, plus filnedladdning. Konsol och dokumentation bakom
  bolagsverket.se/apierochoppnadata. (Själva API-sidorna är CAPTCHA-skyddade mot
  automathämtning, så exakta fältnamn kunde jag inte läsa av, se osäkerheter.)
- Vad returneras på orgnr: namn, adress, juridisk form, SNI-koder och digitalt
  inlämnade årsredovisningar. För juridiska personer inleds numret med 16.
- Licens och kostnad: avgiftsfritt och kräver inget avtal. Detta är EU:s
  öppna data-direktivs kategori värdefulla datamängder, som medlemsstaterna är
  skyldiga att tillhandahålla gratis. Lanserades 3 februari 2025.
- Uppdatering: löpande register, ej verifierad exakt frekvens.

Detta är grundplåten. Både uppslag (när vi har orgnr) och matchningskorpus (för att
härleda orgnr) i en och samma gratis källa.

### B2. Skatteverket, F-skatt och moms

- Myndighet och tjänst: Skatteverket, "Hämta företagsinformation". Visar om ett
  företag är godkänt för F-skatt, momsregistrerat och registrerat som arbetsgivare.
- Form: gratis, men den publika tjänsten levererar svaret via e-post efter att man
  fyllt i orgnr. Det är inte ett bulk-API. Det finns en "Beskattningsengagemang
  API" men den ligger i partner-/testläge, produktionsläge senare (ej verifierat
  när).
- Nyckel: orgnr.
- Vad det möjliggör: en trovärdighetsmarkör. "Godkänd för F-skatt, momsregistrerad"
  bredvid hygienbetyget signalerar en seriös verksamhet. En verksamhet som SAKNAR
  F-skatt men serverar mat är intressant, men här är vi genast inne på känsligt
  territorium, se juridiken.
- Kostnad: gratis. Arbetsinsats: låg per uppslag, men e-postformen gör massuppslag
  opraktiskt tills partner-API:et finns i produktion.

### B3. SCB, företagsregistret

- SCB är medutgivare av de värdefulla datamängderna (B1), och driver dessutom
  företagsdatabasen med arbetsställen och CFAR-nummer. De öppna delarna sammanfaller
  med B1.
- **Utrett 2026-08-06, och svaret är nej.** Arbetsställen per kommun och SNI finns
  inte i den öppna statistikdatabasen. Företagsdatabasen (NV0101) redovisar företag
  per näringsgren ned till femsiffrig SNI men helt utan region. Företagens ekonomi
  (NV0109) redovisar arbetsställen med region, men bara per LÄN och bara på
  SNI-avdelning, alltså `I-55-56` med hotellen inbakade. Den enda kommunvisa
  tabellen med arbetsställen är `TAB5854`, som räknar arbetsställen inom
  verksamhetsområden vart femte år och senast avser 2020.
- Konsekvens för produkten: **täckningsgrad går inte att räkna ur
  statistikdatabasen.** Vårt register mot SCB:s arbetsställen i SNI 56, per
  kommun, kräver uppgifter som bara finns i Företagsregistrets uttagstjänst. Ett
  tal räknat mot läns- eller riksnivå vore inte täckning, det vore en gissning
  med decimaler.
- **Rättelse 2026-08-18: uttagstjänsten är inte längre en betaltjänst.**
  Förordningsändringen som trädde i kraft 26 juni 2025 tog bort avgiften, och
  arbetsställe-API:et bär kommunkod och femsiffrig SNI. Täckningsgraden går
  alltså att räkna den dagen certifikatet finns. Villkoren, den saknade
  nyckeln och tidplanen står i `35_scb_foretagsregistret.md`.
- Det som DÄRIMOT finns per kommun för alla 290, årligen och gratis, är
  sysselsättningen per näringsgren, se D3.

### B4. Lantmäteriet, resten av Geotorget

Utrett 2026-08-06. Belägenhetsadress använder vi redan som geokodningskälla, se
`pipeline/prikko/lantmateriet.py`. Frågan här var om något ANNAT i katalogen gör
konkret nytta för en sajt om restauranghygien. Svaret är i huvudsak nej.

- **Katalogens form.** 89 produkter i produktlistan, varav 51 avgiftsfria: 21 med
  CC0, 17 "värdefulla datamängder" med CC BY 4.0, resten med egna villkor. Båda
  villkorsdokumenten tillåter uttryckligen kommersiell användning. Den tunga
  varianten, "Användningsvillkor för värdefulla datamängder som innehåller
  personuppgifter", binder användningen till det ändamål Lantmäteriet godkänt i
  beslutet. Byter vi affärsmodell krävs ny prövning.
- **Byggnad Nedladdning vektor.** Avgiftsfri, CC BY 4.0, personuppgiftsvillkor och
  juridisk prövning, STAC i GeoPackage. **Byggnadens ändamål duger inte.** BAL har
  sju ändamålsvärden, och för `Verksamhet` är kolumnen Detaljerat ändamål tom.
  Restaurang, kontor, butik, hotell och bensinstation får samma värde. Byggår och
  area saknas helt, de ligger i Taxering, som kostar pengar.
- **Det enda byggnadsdatat ändå kan ge** är geometrin. Matchas en verksamhets
  belägenhetsadress mot byggnadspolygonen syns dels ändamålet Bostad mot
  Verksamhet, dels polygonens storlek och hur många adresser som delar den. Det
  skiljer en restaurang i en galleria från en i bottenplan på ett bostadshus. Det
  är en grov signal till priset av en ansökan och ett beslut, och den ska inte
  byggas förrän vi vet vad den skulle användas till.
- **Fastighetsindelning** är avgiftsfri men gränserna är inte juridiskt gällande.
  **Fastighet och samfällighet Direkt** kostar pengar. Ingen av dem svarar på
  någon fråga vi har.
- **Ortofoto Nedladdning** är avgiftsfri och CC BY 4.0 och får användas
  kommersiellt, men kräver GDPR-prövning och levererar COG-filer, inte en
  tile-tjänst. Ortofoto som tjänst kostar pengar. Höjddata och laserdata gör noll
  nytta här.
- **Bakgrundskarta:** den enda kontolösa endpointen är WMTS för topografisk
  webbkarta översiktlig, CC0, och den **utgår 2026-12-31**. Den är dessutom
  anpassad för skalor grövre än 1:30 000, alltså oanvändbar på gatunivå. Det finns
  inget gratis gatunivåalternativ hos Lantmäteriet efter årsskiftet, så
  OpenStreetMap står kvar som kartkälla.
- **Utan prövning och utan avgift, och faktiskt användbara:** Ortnamn och Kommun,
  Län och Rike. Kommunfilter och ortsnamnssökning, inget mer.
- **Tätort finns inte hos Lantmäteriet.** Tätorter och Småorter är SCB:s produkter,
  öppna data via dataportal.se.

---

## Del C. Ihopparningar på verksamhetsnivå, prioriterat

Format per förslag: källa, nyckel, vad det möjliggör, betalare, juridisk risk,
insats. Rangordnat efter värde genom insats.

### C1. Orgnr på Stockholm via bulkfil plus orakel (se A3)

- Källa: Bolagsverket/SCB bulkfil (gratis) plus Stockholms `SearchFacilitiesMap`.
- Nyckel: namn plus ort plus SNI för gissning, anläggnings-id plus orgnr för
  bekräftelse. Båda har vi.
- Möjliggör: bekräftat orgnr på ~53 procent av beståndet, vilket i sin tur låser
  upp allt i del B.
- Betalare: ingen extern kostnad. Detta är infrastruktur, inte en intäkt i sig.
- Juridisk risk: låg för själva hämtningen (allmän uppgift, offentlighetsprincip,
  öppna data-lagen 2022:818). Relationsrisk mot Stockholm om anropen inte stryps.
  Kör med låg takt.
- Insats: medel, någon dag ovanpå befintlig adapter plus tålmodig körning.

### C2. Företagsstatus bredvid hygienbetyget (F-skatt, moms, juridisk form, ålder)

- Källa: B1 och B2, på orgnr.
- Nyckel: orgnr (kräver C1 först).
- Möjliggör: en "seriositetsrad" på verksamhetssidan. Registrerat sedan, juridisk
  form, godkänd för F-skatt, momsregistrerad. Det är faktauppgifter som höjer
  sidans SEO-tyngd och trovärdighet utan att döma.
- Betalare: gratis att hämta. Intäkten är indirekt, mer trafik och trovärdighet.
- Juridisk risk: låg för aktiebolag. För enskild firma är orgnr en personuppgift,
  se del E. Att visa F-skattestatus är okänsligt, att antyda något om skötsamhet är
  det inte.
- Insats: låg när orgnr finns.

### C3. Konkurs- och statussignal, defensivt

- Källa: Bolagsverket, status på orgnr (konkurs, likvidation, avregistrerad).
- Nyckel: orgnr.
- Möjliggör: att INTE visa hygienbetyg för nedlagda verksamheter som en aktuell
  varning, och att märka sidor som historik. Det är en kvalitetsfunktion, inte en
  värstinglista.
- Betalare: gratis. Värdet är att sajten inte pekar ut ett stängt ställe som om det
  vore öppet.
- Juridisk risk: låg om det används för att tona ned, hög om det används för att
  peka ut. Bygg det defensivt.
- Insats: låg.

### C4. Kedjeigenkänning via orgnr

- Källa: B1, orgnr plus namn.
- Nyckel: orgnr, och för kedjor samma orgnr på flera anläggningar.
- Möjliggör: att gruppera "7 Eleven", "Espresso House" och liknande under en
  ägarenhet och visa hygienmönster per kedja i stället för per adress. Kedjor är
  aktiebolag, alltså utan enskild firma-känsligheten. Detta är en berättelse
  konsumentpress gillar och som inte rangordnar kommuner.
- Betalare: redaktionellt värde, PR, trafik. Möjlig licensiering till
  branschmedia.
- Juridisk risk: låg, juridiska personer.
- Insats: medel, kräver orgnr på fler än en kommun för att bli intressant.

---

## Del D. Ihopparningar på kommunnivå

Här gäller den bindande gränsen: kommuner får inte rangordnas på andel kvarstående
brister, för spannet 0,3 procent i Jönköping till 23,7 procent i Oskarshamn speglar
arbetssätt, inte hygien. Men förslag som FÖRKLARAR skillnaden i arbetssätt är
tillåtna och intressanta. Det är precis vad de två kommunkällorna kan bära.

### D1. Kolada, för att kontextualisera kontrollen

- Myndighet och tjänst: RKA, Rådet för främjande av kommunala analyser, databasen
  Kolada.
- Endpoint: `https://api.kolada.se/v3/`, Swagger på `/v3/docs`. Version 3 släpptes
  2025-04-04.
- Licens och kostnad: avgiftsfritt, kräver inget avtal, kommersiell användning
  uttryckligen tillåten. Attribut "Källa: Kolada" för obearbetad data, ingen
  attribution om vi bearbetar själva. Levereras i befintligt skick.
- Nyckel: kommunkod. Den har vi på varje rad (`municipality_code`).
- Uppdatering: löpande, nyckeltal kan ändras eller tas bort utan förvarning.
- Vad det möjliggör: att sätta kontrollen i ett sammanhang som inte är en
  rangordning. Antal invånare, antal restauranger per capita, kommunens kostnad för
  miljö- och hälsoskydd, personaltäthet i tillsynen. Berättelsen blir "så här ser
  kontrollens förutsättningar ut här", inte "den här kommunen är sämst". Det ger
  kommunsidorna unikt redaktionellt innehåll och SEO-djup som ingen konkurrent har.
- Betalare: indirekt, trafik och trovärdighet. Möjlig licensiering av
  kommunprofiler.
- Juridisk risk: ingen, aggregerad myndighetsstatistik.
- Insats: låg, ett rent REST-API utan nyckel.

### D2. Livsmedelsverkets myndighetsrapportering, kontrollens utövande

- Myndighet och tjänst: Livsmedelsverket, den årliga myndighetsrapporteringen.
  Varje kontrollmyndighet laddar upp en XML senast 31 januari för föregående års
  kontroll. Uttag sker via Livsmedelsverkets Uttagswebb, sökbart per år och
  kontrollmyndighet: antal anläggningar, antal kontroller och kontrollresultat.
- Nyckel: kommun/kontrollmyndighet plus år. Den har vi.
- Vad det möjliggör: det underlag vi i dag SAKNAR för att förklara skillnaden i
  arbetssätt. Om Oskarshamn har 23,7 procent kvarstående och Jönköping 0,3 procent,
  kan myndighetsrapporteringen visa att den ena gör många uppföljande kontroller och
  den andra få, att kontrollfrekvensen skiljer sig, att bemanningen skiljer sig.
  Det förvandlar en förbjuden rangordning till en tillåten förklaring, och det är
  guld för metodiksidans trovärdighet.
- Betalare: redaktionellt värde. Detta är ryggraden i en "så fungerar svensk
  livsmedelskontroll"-berättelse.
- Juridisk risk: ingen, myndighetsstatistik.
- Insats: medel. Exakt uttagsform och maskinläsbarhet är inte fullt verifierad, se
  osäkerheter. XML-uppladdningsformatet finns dokumenterat i Kontrollwiki.
- Ej verifierat: om Uttagswebben har ett öppet API eller bara ett webbgränssnitt.

### D3. SCB:s statistikdatabas, branschens storlek på orten

- Myndighet och tjänst: SCB, statistikdatabasen via PxWebApi 2.0,
  `https://api.scb.se/OV0104/v2beta/api/v2/`. Ingen nyckel, inget avtal.
- Licens och kostnad: avgiftsfritt, **CC0 1.0 Universal**, alltså ingen
  attributionsplikt alls. SCB rekommenderar "Källa: SCB" och vi skriver ut den där
  ett tal ur databasen visas. Taken står i `/config`: 150 000 datacceller per uttag
  och 30 anrop per tio sekunder per IP.
- Nyckel: kommunkod. Den har vi på varje rad.
- Uppdatering: årlig. Registerstatistiken över sysselsatta publiceras i november och
  avser föregående år.
- Vad vi hämtar: `TAB3204`, sysselsatta 15–74 år efter arbetsställets belägenhet,
  näringsgren `I` hotell och restauranger, per kommun. Alla 290 kommuner, full
  täckning, hämtat ur register och inte ur en enkät.
- Vad det möjliggör: **restaurangtätheten på kommunsidan.** Vårt eget antal
  restauranger och caféer per 10 000 invånare, med SCB:s sysselsättningstal bredvid
  och en riktig riksmedian över alla 290 kommuner som referenslinje. De två talen
  läses mot varandra: Borgholm har omkring åtta gånger Stockholms täthet av ställen
  och ungefär samma sysselsättning per invånare, alltså många små säsongsöppna
  ställen mot färre och större.
- Det här är sajtens första jämförelsetal som INTE är ett kontrollresultat, och
  därför det första som skulle få rangordnas. Se `pipeline/prikko/sources/scb.py`.
- Juridisk risk: ingen, aggregerad myndighetsstatistik utan personuppgifter.
- Insats: låg, ett rent REST-API utan nyckel.

### D4. Avrått: hygien mot inkomst eller utbildningsnivå på DeSO-nivå

SCB publicerar inkomst och utbildningsnivå per DeSO, och verksamheterna har
koordinater, så kopplingen är tekniskt trivial. Den ska ändå inte byggas, och skälet
är inte försiktighet utan att talet skulle bli falskt.

Vår hygienbedömning är inte jämförbar mellan kommuner. Andelen verksamheter med
kvarstående brister spänner från 0,3 procent i Jönköping till 23,7 i Oskarshamn, och
det spannet speglar hur kommunerna publicerar och följer upp, inte hur rent det är.
Stockholm läser utfallet ur återbesökets bedömning, Linköping och Örebro ur
kommunens egen uppmärkning. En korrelation räknad över det underlaget mäter
publiceringspraxis, och eftersom kommunerna skiljer sig också i inkomstprofil skulle
den korrelationen se stark och kausal ut.

Inom EN kommun faller det metodfelet bort, men då är underlaget några hundra
verksamheter fördelade på DeSO-områden med tvåsiffriga tal, och utfallet är brus.

Och vore talet både sant och starkt vore rubriken "fattiga områden har smutsigare
restauranger". Den publicerar en namngiven verksamhets omgivning som förklaring till
dess betyg, vilket är det enda vi konsekvent vägrar göra på verksamhetsnivå.

---

## Del E. Juridiken, som avgör vad som får byggas

### E1. Grunden: öppna data-lagen och PSI

Öppna data-lagen (2022:818) och PSI-direktivet tillåter uttryckligen kommersiellt
vidareutnyttjande av det vi hämtar via offentlighetsprincipen. Det är grunden. Allt
i den här rapporten som hämtas från kommun eller myndighet vilar på den.

### E2. Skiljelinjen: enskild firma är en fysisk person

En stor del av restaurangbranschen drivs som enskild firma. Där ÄR
organisationsnumret en personuppgift, eftersom det är knutet till en fysisk person.
Att para ihop en näringsidkares hygienbrister med den personens skulder,
betalningsanmärkningar eller konkurs skapar en profil av en fysisk person. Gränsen
går ungefär så här:

- Faktauppgift om verksamheten, som juridisk form, F-skatt, registreringsår: låg
  risk även för enskild firma.
- Uppgift om betalningsförmåga, skulder, anmärkningar kopplat till en enskild
  firma: hög risk, och dessutom tillståndspliktigt, se E3.

Praktisk regel för produkten: aktiebolag och andra juridiska personer kan vi para
ihop friare. Enskilda firmor bör behandlas försiktigare, och den enklaste säkra
linjen är att aldrig visa ekonomiska svårigheter individuellt för en enskild firma.

### E3. Kreditupplysningslagen

Spridning av uppgifter om betalningsförmåga är tillståndspliktig verksamhet under
IMY. Att bygga en funktion som visar skulder eller kreditvärdighet bredvid
hygienbetyget vore att bli en kreditupplysningsföretag, med allt vad det innebär.
Rekommendation: håll oss borta från betalningsförmåga helt, åtminstone tills
utgivningsbevis finns på plats (E4), som är den väg branschen använder för att
hantera just detta.

### E4. Utgivningsbevis, rapportens viktigaste strategiska rekommendation

- Myndighet: Mediemyndigheten (tidigare Myndigheten för press, radio och tv).
- Kostnad: 3 000 kronor, giltigt i tio år.
- Vad det ger: frivilligt grundlagsskydd enligt yttrandefrihetsgrundlagen, och
  därmed undantag från stora delar av GDPR när dataskyddet skulle krocka med den
  grundlagsskyddade yttrandefriheten. Det är exakt den väg ratsit, allabolag och
  hitta.se använder för att över huvud taget kunna publicera personkopplad
  företagsinformation i skala.
- Skyldigheter: en ansvarig utgivare måste utses, och verksamheten måste uppfylla
  formkraven för en databas med utgivningsbevis. Det innebär ett verkligt ansvar,
  inte en formalitet.
- Varför det är strategiskt: utan utgivningsbevis är enskild firma-frågan i E2 en
  ständig broms på vad vi får visa. Med utgivningsbevis flyttas Prikko in i samma
  rättsliga rum som de etablerade datasajterna, och det som annars vore
  GDPR-känsligt blir publicerbart. För 3 000 kronor och en utsedd utgivare är detta
  den billigaste hävstången i hela rapporten.
- Att väga in: grundlagsskyddet är en sköld men också ett åtagande, och det
  fritar oss inte från att vara varsamma. Metodikens löften och de bindande
  gränserna gäller oavsett.

### E5. Relationsrisken mot kommunerna

Vi står i begrepp att mejla omkring 275 kommuner och begära ut data enligt
offentlighetsprincipen. Två saker att väga in:

- Att sälja tillbaka en kommuns egen data TILL kommunen kan vara juridiskt
  oproblematiskt och ändå förstöra kampanjen. En kommun som just fått en
  utlämnandebegäran och sedan ett säljmejl om sin egen statistik känner sig lurad.
  Håll insamlingskampanjen och varje kommunriktad affär strikt åtskilda i tid och
  ton.
- Stockholms-oraklet i A1 är lagligt men ser ut som skrapning. 425 000 anrop mot
  stadens e-tjänst mitt under en förtroendekampanj är en onödig risk. Strypt takt
  och verifierarmetoden i A3 håller nere anropen och därmed risken.

---

## Osäkerheter jag inte kunnat verifiera

- Bolagsverkets exakta fältnamn och API-schema. Sidorna är CAPTCHA-skyddade mot
  automathämtning. Att datamängderna är gratis och utan avtal, och vad de i stort
  innehåller, är däremot bekräftat via nyhets- och sammanfattningskällor.
- SCB:s arbetsställeregister (CFAR, besöksadress) och exakt hur öppet det är. Det är
  den bättre matchningsnyckeln för fysiska restauranger och bör utredas separat.
- Skatteverkets Beskattningsengagemang-API:s produktionsdatum och villkor.
- Om Livsmedelsverkets Uttagswebb har ett maskinläsbart API eller bara ett
  webbgränssnitt.
- Priset för Bolagsverkets AVGIFTSBELAGDA Näringslivsregister-API (det som INTE är
  värdefulla datamängder). Eftersom de värdefulla datamängderna täcker vårt behov
  gratis lade jag inte mer tid på det.

---

## Rekommendation: de tre första sakerna, i ordning

Rankat efter kvot mellan värde och insats, för en ensam utvecklare.

**1. Ansök om utgivningsbevis. 3 000 kronor, en utsedd utgivare, någon timmes
arbete.** Det är den billigaste hävstången som finns och den avgör vad allt annat
får bli. Utan det är enskild firma-frågan en permanent broms, med det står Prikko i
samma rättsliga rum som hitta.se och allabolag. Det tar dessutom tid att handlägga,
så det ska startas först även om koden byggs parallellt.

**2. Bygg orgnr-bryggan: Bolagsverkets gratis bulkfil plus Stockholms-oraklet som
verifierare (A3).** Detta ger bekräftat organisationsnummer på 53 procent av
beståndet, till noll extern kostnad, och det är förutsättningen för i princip varje
intäktsidé längre fram. Matcha offline, bekräfta med ett anrop, publicera bara
bekräftade nummer. En helg för indexet, någon dag för verifieraren, tålmodig
körning med snäll takt.

**3. Koppla på Kolada och Livsmedelsverkets myndighetsrapportering på kommunnivå
(D1 och D2).** Gratis, laglig, kräver bara kommunkod som vi redan har, och den ger
kommun- och metodiksidorna unikt innehåll som förklarar skillnaden i arbetssätt utan
att rangordna kommuner. Det är den tillåtna versionen av den berättelse vi annars
inte får berätta, och den stärker exakt det förtroende hela produkten vilar på.

Det som medvetet INTE ligger i topp tre: allt som rör betalningsförmåga och skulder.
Det är tillståndspliktigt (E3), känsligt för enskilda firmor (E2), och bör vänta
tills utgivningsbeviset finns och tills det finns en tydlig betalare. Ambitionen får
komma efter grunden.
