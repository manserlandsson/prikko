# 55. Det publika API:et och flödena

**Datum:** 2026-08-31
**Beställning:** `docs/45_entreprenorslistan.md` B1 (publikt API och öppna data),
B6 (flöden) och H2 (LIVES som färdigt schema).
**Vad som byggdes:** ett statiskt JSON-API på `/api/v1/`, Atom-flöden på
`/flode/`, och dokumentationssidan `/api/`. Ingen server, inga nya beroenden.

---

## 1. Slutsatsen först

**Eget format med den svenska specifikationens ordförråd, inte LIVES.**
LIVES bygger på ett poängtal vi inte har, saknar identitet per kontroll, och
är till sin form en zip med fem CSV-filer, alltså precis den massnedladdning
vi inte publicerar.

**Levererat i två steg, och skillnaden är ett konto och inte en rad kod.**

| Vad | Adress | Steg | Filer |
|---|---|---|---:|
| Index, täckning och kodlista | `/api/v1/index.json` | **ett, på** | 1 |
| Nuläget i en kommun | `/api/v1/kommun/{kommun}.json` | **ett, på** | 13 |
| Nya kontroller | `/flode/{kommun}.xml` och `/flode/riket.xml` | **ett, på** | 14 |
| Dokumentationen | `/api/` | **ett, på** | 1 |
| En verksamhet med historik | `/api/v1/verksamhet/{kommun}/{slug}.json` | två, av | 17 066 |

**Steg ett kostar 29 filer och utgåvan hamnar på 18 084 av gratisplanens
20 000.** Det är den delen som ger backlänkar, citeringar och
färskhetssignalen, alltså hela poängen med B1 och B6.

**Steg två är skrivet, byggt och verifierat, men avstängt.** Det kostar 17 066
filer och tar utgåvan till 35 150, vilket ryms på Workers Paid men inte på
gratisplanen. Avstängningen är konstanten `PER_VERKSAMHET` i `lib/api.ts`, se
avsnitt 5.2.

**Varför den inte bara rullas ut ändå: felet är tyst.** `filtaksgrind()`
varnar mellan 19 000 och 90 000 men fäller först vid 98 000. Ett bygge på
35 150 filer är alltså grönt hos oss medan Cloudflare avvisar utgåvan, och
sajten står kvar på gårdagens bygge utan att något säger ifrån.

**Licensen i tre meningar.** Kommunernas underlag bär varken upphovsrätt eller
katalogskydd, eftersom 9 § upphovsrättslagen undantar yttranden av svenska
myndigheter och 49 § tredje stycket låter det undantaget gälla även för en
sammanställning. Ingen av de tretton kommunerna har skrivit ett enda villkor
för vidareutnyttjande, så det finns inget villkor att bryta mot och ingen
kommun som måste hanteras särskilt. Vårt eget arbete, alltså normaliseringen,
identifierarna och bedömningen, erbjuds under CC BY 4.0, medan bilderna och
OSM-fälten står under andras villkor och därför inte ingår i API:et alls.

---

## 2. Formatvalet: LIVES prövades på riktigt

`docs/45` H2 rekommenderade LIVES med ett argument som är rätt i sak: ett
etablerat format som andra redan kan läsa är värt mer än ett eget som är en
aning bättre. Frågan prövades därför mot den faktiska specifikationen och mot
de flöden som är i drift i dag, och inte mot minnet av den.

### 2.1 Vad LIVES faktiskt är

Specifikationen ligger på `yelp.com/healthscores` och har ingen annan
kanonisk plats. Det finns inget arkiv hos Yelp, ingen ändringslogg och ingen
validator; onboarding sker genom att man mejlar in en zip. Sidans egen sista
rad säger att det här är version 2.0 och att den senast uppdaterades den
10 augusti 2015.

Fem filer, varav tre obligatoriska:

| Fil | Krav | Fält |
|---|---|---|
| `businesses.csv` | ja | `business_id`, `name`, `address`, `city`, `state`, `postal_code`, `latitude`, `longitude`, `phone_number` |
| `inspections.csv` | ja | `business_id`, `date`, `score`, `result`, `description`, `type` |
| `feed_info.csv` | ja | `feed_date`, `feed_version`, `municipality_name`, `municipality_url`, `contact_email` |
| `violations.csv` | nej | `business_id`, `date`, `description`, `code`, `critical` |
| `legend.csv` | nej | `minimum_score`, `maximum_score`, `description` |

### 2.2 Fyra skäl att inte använda det

**1. Poängtalet finns inte i svensk kontroll.** `score` är ett tal mellan noll
och hundra där hundra är bäst. Svenska kommuner sätter inget sådant tal.
Alternativfältet `result` rymmer **fyra tecken**, alltså varken "Brister"
eller "Brister som kvarstår". Vi hade tvingats antingen lämna fältet tomt,
vilket bryter mot specifikationen, eller räkna om vår bedömning till ett
poängtal. Det senare vore värre än att avstå: `verdict` är **Prikkos** slutsats
och inte kommunens betyg, och ett fält som heter `score` i ett flöde som heter
efter en kommun läses av alla som myndighetens tal.

Att fältet dessutom är opålitligt i praktiken är belagt. Boulder Countys
levande flöde har poäng mellan **0 och 115**, med noll som vanligaste värde
(419 av 1 270 rader). Det är uppenbart en anmärkningspoängskala där lågt är
bra, alltså tvärtemot vad specifikationen säger, och de skickar ingen
`legend.csv` som avslöjar det. Ett format där halva innebörden ligger i en
valfri fil är inget skydd mot missförstånd.

**2. LIVES har ingen identitet per kontroll.** Det finns inget
`inspection_id` någonstans i specifikationen. En avvikelse i `violations.csv`
kopplas till en verksamhet och ett datum, inte till kontrollen den gäller. I
Wake Countys levande flöde bär **267 av 56 087** kombinationer av verksamhet
och datum mer än en kontroll, och för dem går avvikelserna inte att härleda
till rätt kontroll alls.

Det är dyrt just för oss. Vår `Inspection.id` binder ihop kontrollen, dess
kontrollpunkter och flödesposten, och hela bedömningsmodellen vilar på att en
uppföljning går att skilja från kontrollen den följer på. LIVES kan inte
uttrycka den kopplingen.

**3. Formen ÄR en massnedladdning.** LIVES är en zip med hela jurisdiktionens
verksamheter, kontroller och avvikelser. Att publicera i LIVES är alltså per
definition att publicera det avsnitt 4 säger att vi inte publicerar. De två
besluten går inte att ha samtidigt.

**4. Ekosystemet är inte levande.** Yelps egen registersida listar 247
jurisdiktioner, och **237 av dem levereras av en kommersiell part**, Ecolabs
Health Department Intelligence, tidigare Hazel Analytics. Bara tio kommuner
publicerar fortfarande ett eget flöde, och av dem svarade fem vid mätningen
den 31 augusti 2026: Wake County, San Bernardino, Contra Costa, Williamson
och Boulder. Marin County svarade 403, och fyra hade slutat svara helt.
**Endast Contra Costa deklarerar version 2.0**; övriga skickar `1.0`, `1`
eller `0.4.1`.

Båda de kommuner som en gång tog fram formatet, San Francisco och New York,
ligger i dag i Ecolab-gruppen. San Franciscos egen datamängd heter numera
"[Historical] Restaurant Inspection Scores (2016-2019)" och uppdaterades
senast 2021.

Även Montreal, som `docs/45` H2 pekar ut, är svagare än den såg ut. De står
inte på Yelps lista, publicerar ingen zip, och **saknar `inspections.csv`
helt**, alltså en av de tre obligatoriska filerna. Deras `violations.csv` är i
sak en lista över domar och inte över kontrollavvikelser. Licensen CC BY 4.0
stämmer, resten är LIVES-inspirerat snarare än LIVES.

Kvar av argumentet står alltså inte "andra kan redan läsa det" utan "en
kommersiell aktör kan läsa det", och just den aktören driver enligt `docs/45`
§6.4 nästan 700 000 Yelp-sidor på samma affär som vår. Att lämna vår data i
deras format och sedan konkurrera med dem är en dålig affär.

### 2.3 Vad vi valde i stället, och vad vi lånar

**Fältnamnen kommer ur den svenska nationella specifikationen**,
*Livsmedelskontroller som öppna data v2.0*, framtagen av NSÖD och ÖDIS ovanpå
Sambruks och SKL:s arbete. `docs/42` §4 har hela JSON-exemplet. Den bär exakt
det svensk kontroll innehåller: `assessment`, `type`, `prenotified`,
`inspectionPoints` med godkända och anmärkta punkter var för sig,
`ownerComment`, `organizationNumber` och koordinater.

Att våra fält redan heter så är ingen tillfällighet: `db.ts` byggdes mot
samma vokabulär. Valet här är alltså att inte överge den till förmån för
LIVES, och det ska sägas rakt ut vad valet är värt.

**Vi lånar formen och går inte med i något.** Noll svenska kommuner publicerar
i specifikationen, vilket `docs/42` §1 och §3.2 mätte. Vi ansluter oss alltså
inte till ett ekosystem, vi lånar ett ordförråd som är genomtänkt och svenskt.
Skillnaden är värd att hålla i minnet: den dagen ett svar på ett begäranbrev
kommer i NSÖD-format är det läsaren som ska byggas först, och då talar vi
redan samma språk.

**Dokumentformen är däremot vår egen.** NSÖD:s exempel är ett dokument per
kontrollmyndighet med `facilities[]` och `inspections[]` bredvid varandra,
alltså också en dumpform. Vår enhet är en verksamhet per dokument, av skälen i
avsnitt 4.

---

## 3. Adresserna

Ett API är ett löfte, och versionen står i adressen för att löftet ska gå att
hålla utan att frysa formen för alltid.

    /api/v1/index.json                        på
    /api/v1/kommun/{kommun}.json              på
    /flode/{kommun}.xml                       på
    /flode/riket.xml                          på
    /api/                                     på, dokumentationen som HTML
    /api/v1/verksamhet/{kommun}/{slug}.json   AV, väntar på uppgraderingen

**ADRESSEN FÖR STEG TVÅ ÄR BESTÄMD HÄR OCH NU, OCH FÅR INTE ÄNDRAS.** Det är
skälet till att den står utskriven ovan trots att den ännu inte svarar. Ett
API är ett löfte, och löftet börjar gälla den dag adressen publiceras i det
här dokumentet och inte den dag den börjar svara. Den som läser detta och
bygger mot den formen ska ha rätt.

**Sidan `/api/` dokumenterar den däremot INTE**, och de två är inte i konflikt.
Ett API som beskriver en adress som svarar 404 för sin läsare är sämre än ett
som beskriver mindre. Här står den som ett åtagande inför oss själva, där
skulle den stått som ett erbjudande till någon annan. Avsnittet tänds av sig
självt när flaggan slås om; se `PER_VERKSAMHET` i `pages/api/index.astro`.

**Regeln för v1:** ett fält får läggas till när som helst, eftersom en läsare
som inte känner till det ignorerar det. Ett fält som ska bort eller byta
betydelse kräver `/api/v2/` vid sidan om, och v1 står kvar.

**Verksamhetens adress är sidans adress med ett prefix och en ändelse.**
`/stockholm/vesuvio/` blir `/api/v1/verksamhet/stockholm/vesuvio.json`. Den
som har en länk kan alltså räkna fram dokumentet utan att slå upp något, och
`ADR 0003` gör slugen permanent, så de två följs åt.

**Flödena ligger utanför `/api/` med flit.** En flödesadress hamnar i någons
läsare och ska överleva en `v2`. Atom är dessutom bakåtkompatibelt av
konstruktion.

**`/api/` är sidan och `/api/v1/` är datan, och den nivån är inte kosmetisk.**
`_headers` sätter `Content-Type: application/json` på ett mönster, och ett
mönster på `/api/*` hade träffat dokumentationssidan också och fått
webbläsaren att ladda ner den. Under `/api/` ligger dessutom sedan tidigare
två Pages Functions, `functions/api/marke.ts` och `functions/api/ratta.ts`,
vilket är ett andra skäl att hålla mönstret smalt.

---

## 4. Vad som publiceras, och vad som medvetet inte gör det

### 4.1 Regeln

**API:et säger om en verksamhet exakt det verksamhetens egen sida säger,
varken mer eller mindre.**

Hela gränsdragningen följer ur den meningen. Ett API som säger mindre än
HTML:en på samma adress skyddar ingenting, eftersom den som vill ha uppgiften
läser sidan i stället. Ett API som säger mer är en ny publicering som ingen
granskat: `compliance` och `frequency` i `Registration` visas med flit inte på
sajten, och de står därför inte heller i ett svar.

### 4.2 Ingen massnedladdning

`docs/11` §10 och `docs/45` C4 räknar det normaliserade nationella materialet
som en intäktsström. En dumpfil är hela den produkten i en förfrågan.

Gränsen är därför: **kommunfilen bär nuläget, historiken finns bara per
verksamhet, och det finns ingen fil som bär hela beståndet.** Det är samma
gräns sajten själv har, eftersom ingen sida visar allt på en gång.

**I dag är gränsen strängare än så, och det är en följd och inte ett beslut.**
Med `PER_VERKSAMHET` avstängd publiceras kontrollhistoriken inte alls, bara
nuläget. Det är alltså filtaket och inte affärsmodellen som håller igen just
nu, och den dag flaggan slås om är gränsen den som står i stycket ovan.

**Var ärlig om vad gränsen är värd när den väl gäller.** Den som vill bygga en
spegel kan hämta 17 066 filer och sätta ihop en. Friktionen är 17 066
förfrågningar mot en, och det är en tröskel och inte ett lås. Det som faktiskt
inte går att få gratis är tidsserien över hela riket i ett svep, alltså den
enda delen C4 säljer. Om gränsen någon gång ska ersättas av ett riktigt lås är
svaret inte att publicera mindre, utan att sälja mer.

### 4.3 Bilderna och OSM-fälten, som är en annan sorts nej

De två föregående nejen är våra egna beslut och kan ändras. De här kan de
inte, eftersom de är tredje mans villkor.

**Bilderna** kommer från Mapillary, Panoramax och Wikimedia Commons, och
villkoren gäller per bild: en kräver logotyp och länk, en annan fotografens
namn, licensnamnet och en länk till filsidan. Ett JSON-fält kan bära en URL
men inte tvinga mottagaren att rita attributionen, och en bild som visas utan
sin attribution är ett brutet villkor hos oss. Se `StreetImage` i `db.ts`.

**Öppettider, kontaktuppgifter, hållplats och parkering** kommer alla ur
OpenStreetMap under ODbL 1.0, som är share-alike. Att lägga dem i ett svar vi
märker CC BY vore att sätta villkor vi inte har rätt att sätta.

---

## 5. Filkostnaden, räknad

### 5.1 Steg ett, som är på

| Post | Filer |
|---|---:|
| En per kommun | 13 |
| Flöden, tretton kommuner plus riket | 14 |
| Index | 1 |
| Dokumentationssidan | 1 |
| **Summa** | **29** |

Utgåvan går från 18 055 till **18 084** filer, mätt i bygget. Det är 1 916
kvar till gratisplanens tak på 20 000 och 916 under `GRATIS_VARNING` på
19 000, alltså går ingen byggvarning igång: loggen skriver bara
`18084 filer i utgåvan, 79916 kvar till taket`.

Kommunfilerna väger 8,2 MB på disk och flödena 544 kB. Stockholm är 5,0 MB av
de 8,2 och 646 kB gzippad; se 9.3 för varför den är stor och varför det är
rätt ändå.

### 5.2 Steg två, som är avstängt

En fil per verksamhet är **17 066 filer**, och utgåvan blir då 35 150.

**Talet 15 365 i beställningen är antalet BEDÖMDA verksamheter, inte antalet
verksamheter.** 15 492 har minst en kontroll och 17 066 finns i beståndet.
Rutten bygger alla 17 066, eftersom kommunfilen räknar upp dem och en 404 på
en verksamhet som står i kommunfilen hade varit ett API som säger emot sig
självt. De 1 574 utan bedömning bär `verdict: null` och ett `reason`.

**Avstängningen är en konstant och inte en bortkommenterad fil.**
`PER_VERKSAMHET` i `site/src/lib/api.ts`, i dag `false`. Fyra ställen läser
den, och alla fyra följer med av sig själva när den slås om:

| Läsare | Vad som händer när flaggan är falsk |
|---|---|
| `pages/api/v1/verksamhet/[kommun]/[slug].json.ts` | `getStaticPaths()` ger tom lista, noll filer |
| `nulage()` i `lib/api.ts` | fältet `api` utelämnas ur kommunfilens rader |
| `apiIndex()` | `endpoints.establishment` utelämnas |
| `pages/api/index.astro` | adressraden och härledningsexemplet utelämnas |

Konstanten valdes framför en gren vid sidan om, med flit. Rutten byggs och
typkontrolleras vid varje körning, och `verksamhetDokument()` är oförändrad
sedan bygget som producerade samtliga 17 066 dokument. En gren hade ruttnat i
tysthet; en flagga kan inte.

**Villkoret för att slå på den:** kontot uppgraderat till Workers Paid, alltså
steg ett i `docs/46` §6. Fem dollar i månaden och ett klick, och det är
ägarens beslut.

### 5.3 Varför gränsen inte fick passeras med en varning

Grinden i `astro.config.mjs` fäller vid 98 000 och Cloudflare Pages tar
100 000 på Workers Paid. 35 150 ryms alltså där med god marginal.

**Men kontot ligger på gratisplanen, vars tak är 20 000, och det felet är
tyst.** `filtaksgrind()` varnar mellan `GRATIS_VARNING` 19 000 och
`FILTAK_VARNING` 90 000 men fäller inte. Ett bygge på 35 150 filer hade alltså
varit grönt hos oss, GitHub Actions hade rapporterat en varning bland andra
varningar, och Cloudflare hade avvisat utgåvan medan sajten stod kvar på
gårdagens. Att gå in med en varning som enda skydd är samma fel som höll ett
nattjobb nere i tretton dagar utan att någon märkte det.

Marginalen var dessutom knapp redan innan: kommentaren i `astro.config.mjs`
noterar 18 048 filer den 31 augusti och det här bygget mätte 18 055 utan
API:et, alltså under tvåtusen kvar hur man än räknar.

### 5.4 Riket och API:et ryms inte båda

`docs/46` §3.2 räknar hela riket till omkring 97 400 filer utan API. **Med en
fil per verksamhet blir hela riket ungefär det dubbla, alltså över taket på
100 000.** Det är en verklig begränsning och den ska stå skriven här innan
någon planerar riksutbyggnaden. Se 5.5 för vägen förbi.

### 5.5 Om filtaket blir bindande även efter uppgraderingen

`site/functions/api/` finns redan och kör två Pages Functions. Samma svar går
att sätta ihop där vid begäran och kostar då **noll filer** i bygget.
Beställningen sa statiska filer och ingen server, alltså är det inte byggt,
men vägen är öppen och den kostar ingen adressändring: `_headers` och
adresserna ser likadana ut åt en anropare oavsett vilken av de två som
svarar. Det är samma resonemang `functions/api/marke.ts` redan för om 34 386
dekalfiler.

---

## 6. Flödena: Atom, och varför

**Google tar emot ett flöde som sitemap.** RSS 2.0 och Atom 1.0 är båda
dokumenterade sitemapformat, och det är skälet flödena står högt just nu:
`docs/49` mätte att omkring **1 400 av 14 260 sidor** är i Google, alltså
omkring tio procent. Ett flöde per kommun som anmäls vid sidan av
XML-sitemapen är en andra väg in för precis de sidor som ändrats, och det
kostar fjorton filer.

**Atom framför RSS**, av tre skäl i fallande ordning:

1. `<id>` är obligatorisk i Atom och `<guid>` valfri i RSS. Vår
   `Inspection.id` är redan beständig, så kravet kostar oss ingenting och ger
   läsaren garantin att en post inte dyker upp som ny igen när en verksamhet
   byter slug. Posten identifieras med en `tag:`-URI enligt RFC 4151 och
   aldrig med sin URL: en URL säger var något ligger, inte vad det är.
2. Atom daterar i RFC 3339, samma form som `lastmod` i sitemapen redan
   använder. En glidning mindre på den signal som betyder mest för oss.
3. Atom är RFC 4287 och läses av allt som läser RSS. RSS 2.0 är ingen
   standard i den meningen.

**Femtio poster per kommun, 150 för riket.** Riksflödet blandar tretton
kommuner och behöver fler poster för samma räckvidd i tid.

**Ordningen är total och inte bara sorterad på datum.** Källorna har
dagsupplösning, alltså delar ett femtiotal kontroller samma datum. Utan andra
och tredje sorteringsled hade två byggen på samma data kunnat ge olika flöden,
och varje prenumerant hade sett gamla poster som nya. Verksamhetens id och
kontrollens id avgör resten.

**Flödets `<updated>` är den färskaste postens datum, aldrig byggtiden.**
Samma skäl som `lastmodIndex()` i `astro.config.mjs`: en tidsstämpel som
ändras vid varje bygge är per definition inte trovärdig och ignoreras då i sin
helhet.

**Ingen post länkar till en `noindex`-sida.** Flödet filtrerar med
`isIndexable()`. Att be en läsare gå till en sida vi själva sagt inte ska
hittas är motsägelsefullt.

**XML:en skrivs för hand.** `@astrojs/rss` finns inte i `package.json` och
läggs inte till: paketet skriver RSS, och en beroendekedja för tolv rader XML
är dyrare än raderna.

---

## 7. Licensbedömningen

### 7.1 De två lagren

**Underlaget är fritt, och inte tack vare oss.** Ett kontrollresultat är ett
yttrande av en svensk myndighet. 9 § upphovsrättslagen (1960:729):

> "Upphovsrätt gäller inte till 1. författningar, 2. beslut av myndigheter,
> 3. yttranden av svenska myndigheter [...]"

Katalogskyddet i 49 § är den verkliga frågan för en tabell, men dess tredje
stycke räknar upp 9 § bland de bestämmelser som gäller även för ett sådant
arbete. Sammanställningen skyddas alltså inte heller. Hela kedjan står
utskriven med lagtext i `docs/20` §9.3, där den prövades för Norrköping, och
den generaliserar eftersom materialet är av samma slag i varje kommun:
kontrollrapporter från en kommunal nämnd.

**Vårt eget arbete är normaliseringen, identifierarna och bedömningen**, och
det erbjuds under **CC BY 4.0**. Attributionsraden står i `LICENCE` i
`lib/api.ts` och följer med i varje enskilt svar, inte bara i indexet: ett
dokument som kopieras vidare tappar sin kontext, och då är licensen det första
som försvinner.

**Inte CC0.** `kallor.astro` bar en gång CC0 i sitt Dataset-schema medan den
synliga texten sa något annat, och en CC0-märkning är oåterkallelig för den
som hunnit förlita sig på den. Att avsäga sig rätten till bedömningen är
dessutom ett affärsbeslut och inte ett tekniskt.

### 7.2 Kommunerna, en efter en

Frågan är ställd som `docs/prikko-licens-lasas-som-den-star` kräver: villkoren
läses som de står, och aldrig i den snålaste tolkningen.

**Ingen av de tretton kommunerna har skrivit ett enda villkor**, varken en
licensmärkning eller ett förbud, och det står i varje svar som
`"licence": "unstated"` per kommun. Fältet finns för att den som bygger vidare
ska kunna se det själv i stället för att lita på ett medelvärde vi räknat åt
hen, och för att en kommun som framöver ställer ett villkor ska synas i datan
innan den syns i en text.

**Så långt påståendet är belagt, och var det inte är det.** `docs/42` gick
igenom dataportal.se systematiskt med trettiosju sökningar och fann ingen
livsmedelsdatamängd med licens utanför Göteborg, Stockholm och Norrköping.
`docs/20` §9.3 prövade Norrköping särskilt och ordagrant. För de elva
kommuner vi läser genom deras egna gränssnitt vilar påståendet på vår egen
källpost, som inte bär något licensfält, och deras sidor är inte omlästa för
det här dokumentet. Det är en öppen punkt, se avsnitt 10, och den ändrar inte
slutsatsen: grunden är lagtexten i 7.1 och inte frånvaron av en märkning.

**Tystnaden bär inte slutsatsen.** Att ingen licens är angiven är varken ett
förbud eller ett tillstånd. Grunden är lagtexten i 7.1. Hade slutsatsen behövt
tystnaden hade den inte hållit.

**Ingen kommun måste hanteras särskilt, och det är ett resultat och inte en
lucka.** Beställningen förutsåg att någon kommuns villkor kunde hindra
vidarelicensiering. Ingen gör det, eftersom ingen har ställt något villkor och
ingen kan ställa ett i efterhand som gäller retroaktivt: 2 kap. 5 § lagen
(2022:818) kräver att ett villkor är objektivt och icke-diskriminerande, och
ett outtalat villkor kan omöjligt vara det.

Två saker som gränsar till frågan men inte avgörs här:

- **Stockholms ArcGIS-lager är CC0**, men vi läser inte det. Vi läser deras
  e-tjänst. Se `docs/52`, som rekommenderar att lagret inte hämtas.
- **Norrköpings utdrag är inaktuellt**, senaste kontroll 2024-01-03 och filen
  skriven 2024-03-17. Det är en färskhetsfråga och inte en licensfråga, och
  den syns i svaret som `modifiedAt` vid sidan av `fetchedAt`.

### 7.3 Ett argument att spara till kommunbreven

Hazel Analytics, alltså den part som i dag levererar 237 av Yelps 247
LIVES-flöden, skriver själva att deras insamlingsmetoder är billigare och
snabbare för myndigheterna än de utlämnandebegäranden som annars hade krävts.
Det är exakt vårt argument mot en kommun som tvekar inför H1 och B12, och det
kommer från någon som byggt affären på det.

---

## 8. Huvudena, och varför de inte står i rutterna

`public/_headers` förklarar utförligt att ett `Response`-huvud i en Astro-rutt
KASTAS i ett statiskt bygge, och att det kostade en trasig karta i produktion.
Rutterna här sätter ändå sina huvuden, som avsiktsförklaring och av samma skäl
som `sok-index/[hash].json.ts` gör det, men det som gäller står i `_headers`:

    /api/v1/*      application/json, max-age=3600, Access-Control-Allow-Origin: *
    /flode/*       application/atom+xml, max-age=3600, Access-Control-Allow-Origin: *

Tre saker är värda att veta.

**CORS finns bara där och kan bara finnas där.** Utan
`Access-Control-Allow-Origin: *` kan ingen webbsida någon annan bygger läsa ett
av våra svar. Ett API vars hela poäng är att andra bygger på det, och som ingen
kan anropa, är ett API som inte finns.

**Mönstret heter `/api/v1/*` och inte `/api/*`**, se avsnitt 3.

**`.json` och `.xml` cachas inte på Cloudflares kant.** Mätningen står högst
upp i `_headers`: `/sok-index/*.json` svarade DYNAMIC trots `max-age=31536000,
immutable`, eftersom kanten cachar ur en fast lista av filändelser som `.json`
inte står på. `Cache-Control` styr alltså webbläsarens cache och inte kantens,
och varje anrop går till origin. Det är acceptabelt här och var det inte för
kartan, som gick sönder eftersom PMTiles läser med `Range`. Ett API-anrop
hämtar hela dokumentet ändå, så det som kostar är svarstid och inte funktion.
Att byta ändelse för kantens skull är inget alternativ: `.json` är en del av
adressen, och adressen är löftet.

---

## 9. Verifieringen

Två byggen i ett eget arbetsträd med `--outDir dist-api`, med huvudkopians
`node_modules` länkad och länken borttagen efteråt. Det första med
`PER_VERKSAMHET = true`, för att mäta steg två och bevisa att koden fungerar.
Det andra med flaggan i sitt levererade läge, `false`.

### 9.1 Bygget med steg två på, alltså mätningen av det avstängda

Gick igenom med samtliga grindar gröna, byggtid 2 min 52 s.

| Katalog | Filer | På disk |
|---|---:|---:|
| `api/v1/verksamhet/` | 17 066 | 95 MB |
| `api/v1/kommun/` | 13 | 9,5 MB |
| `api/v1/index.json` | 1 | 9,2 kB |
| `flode/` | 14 | 544 kB |
| `api/index.html` | 1 | |
| **Summa nytt** | **17 095** | |

Utgåvan landade på **35 150** filer. Talen stämmer på filen: 35 150 minus
17 095 är 18 055, alltså exakt vad utgåvan låg på före arbetet.

Det är den mätningen som gör `PER_VERKSAMHET` till en avstängning och inte
till ett löfte: koden har producerat samtliga 17 066 dokument, och
`verksamhetDokument()` är oförändrad sedan dess.

### 9.2 Bygget som levereras, alltså steg ett

Byggtid 3 min 13 s, 17 806 sidor, **18 084 filer**. Filantalet står i 5.1.

**Ingen byggvarning gick igång**, vilket var hela villkoret: `filtak` skrev
`18084 filer i utgåvan, 79916 kvar till taket` och ingenting mer. Talet ligger
916 under `GRATIS_VARNING`.

**Grindarna sa vad de skulle.** `sitemap-guard` räknade 16 097 URL:er utan en
enda motsägelse mot `noindex`. Sitemapen gick från 16 096 adresser till
16 097, alltså exakt en ny, och den är dokumentationssidan. Gruppen `start`
står på **tretton**, alltså elva namngivna toppsidor plus roten plus den nya
`/api/`: sidan är klassificerad i `sidtyp()` och ingenting hamnade i
restgruppen `sitemap-pages-0.xml`, vars blotta existens hade fällt bygget.
`lankgrind` hittade inga döda interna länkar, alltså håller länken från
webbkartan och länken från källsidan.

**Datarutterna når aldrig sitemapen**, vilket var antagandet bakom att bara
sidan står i `sidtyp()`. Gruppen `verksamheter` står på 15 365, alltså
HTML-sidorna, medan `api/v1/kommun/` och `flode/` inte syns i sitemapen alls.
De två räknar olika mängder och det är rätt: endpoints är inte sidor.

**Flödena parsar.** Samtliga fjorton lästes med en XML-parser utan fel.
Riksflödet bär 150 poster, kommunflödena 50.

**Ingenting dokumenteras som svarar 404.** `/api/v1/index.json` saknar
`endpoints.establishment`, kommunfilernas rader saknar fältet `api`, och
`/api/` räknar varken upp adressen eller härledningsexemplet. Det är samma
konstant som styr alla fyra.

### 9.3 Storleken över tråden, mätt

| Fil | Rå | gzip -9 |
|---|---:|---:|
| `kommun/stockholm.json` | 5,03 MB | **646 kB** |
| `kommun/linkoping.json` | 778 kB | 105 kB |
| `index.json` | 9,1 kB | 2,3 kB |
| En verksamhet, typisk (steg två) | 4,5 kB | |

Stockholmsfilen gzippas till 646 kB i steg ett mot 694 kB i mätningen med
steg två på. Skillnaden är fältet `api` på 8 520 rader, alltså den länk som
utelämnas när rutten inte byggs.

**Svaren är läsbart formaterade och det kostar 2,5 procent.** Samma
Stockholmsfil utan indrag är 4,06 MB rå och 677 kB gzippad, alltså 17 kB
mindre. Att spara det genom att göra varje svar oläsbart i en webbläsare är en
dålig affär: den som öppnar en adress för att se efter vad som finns är exakt
den läsare API:et ska vinna.

Stockholm är den enda filen som är stor, och den är stor för att kommunen är
det: 8 520 verksamheter av 17 066. Jämför `kartlista/stockholm.json`, som är
265 kB gzippad med samma antal rader men bara sex fält per rad.

---

## 10. Öppna punkter

1. **Uppgradera Cloudflare-kontot till Workers Paid, och sätt sedan
   `PER_VERKSAMHET` till `true`.** `docs/46` §6 steg ett. Det är den enda
   åtgärd som skiljer steg två från att vara i drift, och konstanten ligger i
   `site/src/lib/api.ts` med hela villkoret utskrivet vid sig.
2. **Anmäl flödena som sitemaps i Search Console** när de är i drift. Det är
   hela poängen med dem, se `docs/49`.
3. **Riksutbyggnaden och API:et ryms inte båda som statiska filer.** Se 5.4.
   Beslutet ska tas medvetet och inte upptäckas vid en byggvarning.
4. **`/api/` bör länkas från fler ställen än webbkartan.** Källsidan gör det nu.
   Sidfoten och `/llms.txt` är nästa steg, och `llms.txt` är den billigaste:
   en AI som läser den filen är exakt den läsare API:et finns för.
5. **Läs om de elva kommunernas egna sidor och notera villkorstexten där den
   finns.** Se 7.2. Slutsatsen hänger inte på det, men fältet
   `"licence": "unstated"` ska vara en avläsning och inte ett förvalt värde.
6. **Ingen historik per kommun är ett beslut som kan ompröva sig självt.**
   Visar det sig att C4 aldrig blir en affär är dumpfilen gratis att lägga
   till, och `docs/45` C4 säger uttryckligen att den kräver täckning först.
