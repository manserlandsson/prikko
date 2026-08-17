# Ny ansökan till Lantmäteriet efter avslaget i LM2026/110331

Status: utkast. Ingenting här är inskickat. Måns läser, rättar och skickar
själv.

## 1. Vad beslutet faktiskt säger

Lantmäteriet avslog 2026-08-17 vår begäran om Belägenhetsadress Nedladdning,
vektor. Beslutet är två prövningar, och bara den ena gick emot oss.

**Ändamålet är godkänt.** Ordagrant ur beslutet: "Lantmäteriet bedömer att den
av sökanden beskrivna behandlingen utgör ett tillåtet ändamål enligt 2 § FRL."
Att översätta en gatuadress till en koordinat så att en kontrollerad
verksamhet kan visas på rätt plats på en karta är alltså prövat och tillåtet.
Den prövningen behöver inte göras om, och beskrivningen av ändamålet ska
därför inte skrivas om i sak.

**Avslaget gäller enbart lagringen.** Skälen, i beslutets ordning:

1. Lagringsaktören Supabase har sitt ägande i USA.
2. För molntjänstleverantörer under amerikansk jurisdiktion går det inte att
   utesluta extraterritoriell tillämpning av amerikansk lagstiftning, oavsett
   var servrarna står.
3. Supabase omfattas inte av EU-US Data Privacy Framework och därmed inte av
   kommissionens adekvansbeslut. Överföring kan inte ske med stöd av artikel
   45 GDPR.
4. Därför avslag med stöd av 6 § FRL.

Hela avslaget hänger alltså på ett enda led i vår kedja: att koordinaten
lagras hos Supabase. Faller det ledet bort faller invändningen bort.

## 2. Är den tekniska vägen farbar? Ja.

Hypotesen var att koordinaterna aldrig behöver röra Supabase. Den håller, och
ombyggnaden är mindre än väntat. Här är vad genomgången av koden visade.

### 2.1 Så ser kedjan ut i dag

En koordinat kan komma in i beståndet på två sätt, och det är avgörande att
hålla isär dem.

**Kommunens egen koordinat.** Sex av tolv kommuner publicerar koordinater
själva i sina öppna data: Jönköping, Karlstad, Kristinehamn, Linköping,
Oskarshamn och Stockholm. `pipeline/fetch_<kommun>.py` läser dem ur källan och
skriver dem till `data/<kommun>.json`. De har ingenting med något
adressregister att göra.

**Härledd koordinat.** Sex kommuner publicerar ingen koordinat. Två av dem,
Uppsala och Örebro, har fått en framräknad koordinat: `pipeline/geocode.py`
slår upp gatuadressen mot ett adressregister, i dag OpenStreetMap och i
framtiden Lantmäteriet. De fyra övriga, Borgholm, Höganäs, Lomma och
Svenljunga, saknar koordinater helt och är just de som väntar på det här
ärendet.

De två går att skilja åt mekaniskt, och det är hela lösningen.
`pipeline/geocode.py` sätter fältet `geoSource` på varje koordinat den
härleder (rad 357) och tar bort fältet när den nollar en koordinat (`forget`,
rad 208 till 218). En koordinat med `geoSource` är härledd. En koordinat utan
`geoSource` kommer ur kommunens egen publicering.

Uppmätt i dagens datafiler:

| Fil | Med koordinat | Därav härledda (`geoSource`) |
|---|---:|---:|
| stockholm | 8 499 | 0 |
| linkoping | 1 243 | 0 |
| jonkoping | 1 123 | 0 |
| uppsala | 966 | 966 (alla `osm`) |
| karlstad | 693 | 0 |
| orebro | 645 | 645 (alla `osm`) |
| oskarshamn | 238 | 0 |
| kristinehamn | 170 | 0 |

Ingen Lantmäterihärledd koordinat finns någonstans i dag, eftersom vi inte
fått tillgång till registret. De 1 611 härledda koordinaterna kommer alla ur
OpenStreetMap.

Vidare, och det här är den springande punkten: `geocode.py` kan bara härleda
en koordinat ur en adress. Saknas adressen nollas raden (rad 326 till 330).
En rad utan adress kan alltså aldrig bära en härledd koordinat.

### 2.2 Vad som faktiskt ligger i Supabase

Kontrollerat direkt mot databasen 2026-08-17:

    select municipality_code, count(*), count(lat), count(geo_source)
    from establishments group by municipality_code;

Resultatet: 16 096 rader, 12 047 med koordinat, **9 med `geo_source` satt**
(åtta i Uppsala, en i Örebro, alla `osm`). Uppsalas och Örebros 1 611 härledda
koordinater ligger alltså inte i databasen alls, utan bara i de incheckade
filerna i `site/src/data/`. Databasen bär i praktiken redan nästan uteslutande
kommunernas egna koordinater.

### 2.3 Haken i `pipeline/rorelse.py`, och varför den inte är en hake

`register()` läser `select=id,name,street_address,lat,lng,active` ur
`establishments` (rad 189 till 198) för att jämföra gårdagens bestånd mot
nattens utlämning. Koordinaten används på exakt ett ställe:
`pair_renumbered()` i `pipeline/prikko/rorelse.py`, nyckel 2 av 3, "namn och
koordinat inom elva meter", som fångar de källor som saknar adressfält
(rad 308).

Hur mycket beror på den nyckeln? Räknat i datafilerna finns 906 verksamheter
som har koordinat men saknar adress, och för dem är nyckel 2 den enda som kan
fungera:

| Fil | Utan adress men med koordinat |
|---|---:|
| karlstad | 693 |
| stockholm | 113 |
| kristinehamn | 67 |
| linkoping | 22 |
| oskarshamn | 11 |

Karlstad saknar adressfält helt. Att ta bort nyckel 2 skulle alltså göra hela
Karlstad omöjlig att para vid ett id-byte, och en kontrollhistorik som tappas
går inte att räkna fram i efterhand.

Men alla 906 är kommunernas egna koordinater, och det är inte en tillfällighet
utan följer av 2.1: en rad utan adress kan inte få en härledd koordinat.
`rorelse.py` behöver därför **inte** byggas om. Den koordinat den läser ur
Supabase kommer under den nya ordningen alltid att vara kommunens egen.

För att garantin ska vara mekanisk och inte en fråga om disciplin uppströms
bör den ändå läsa `geo_source` och kasta koordinaten om fältet är satt. Det är
fem rader.

### 2.4 Övriga ställen som rör koordinater mot Supabase

**`pipeline/load_supabase.py`** skriver `lat`, `lng`, `geo_source` och
`geo_precision` (rad 513 till 532, upserten på rad 552). Det här är det enda
stället som skriver, och det är här ändringen hör hemma.

**`pipeline/export_supabase.py`** läser hela raden med `select=*` (rad 104) och
skriver `site/src/data/<kommun>.json` (rad 164 till 165). Det är den här
rundturen som gör att en härledd koordinat i dag måste passera databasen för
att överleva till sajten. Att exporten skriver över filerna varje natt är
också anledningen till att Uppsalas och Örebros koordinater i dag är sköra:
de ligger i filen men inte i databasen, och nästa export skulle radera dem.
Problemet finns alltså redan och ska lösas oavsett.

**`pipeline/hamta_gatubilder.py`** läser `lat` och `lng` ur Supabase
(rad 232). Filen har redan ett filläge, `--fil site/src/data/<kommun>.json`
(rad 212 och 329), som inte rör databasen. Ingen kodändring behövs, bara att
det läget alltid används.

**Sajten** läser inga koordinater ur Supabase i drift. `site/src/lib/db.ts`
rad 136 läser `site/src/data/*.json` vid byggtid, och kartorna,
kartrutorna och JSON-LD:n hänger alla på den. Verifierat: inget anrop mot
PostgREST i `site/` begär `lat`, `lng` eller `street_address`.

### 2.5 Vad som måste byggas

Fyra ändringar, uppskattningsvis under hundra rader sammanlagt.

1. **`load_supabase.py` slutar skicka härledda koordinater.** Släpp
   `geo_source` och `geo_precision` ur payloaden helt, och nolla `lat`/`lng`
   för varje rad som bär `geoSource`. Cirka tio rader.

2. **`rorelse.py` slutar lita på uppströms.** Läs `geo_source` i selecten och
   sätt `lat`/`lng` till `None` när fältet är satt. Cirka fem rader.

3. **De härledda koordinaterna måste överleva exporten utan att gå via
   databasen.** Rekommendationen är ett `--bara-cache`-läge i `geocode.py`
   som slår upp adresserna i den incheckade `pipeline/geocode_cache.json` och
   aldrig bygger något index eller rör nätet. Nattjobbet kör det direkt efter
   `export_supabase.py`. Uppslagningsnyckeln innehåller adressen, så en
   verksamhet som bytt adress tappar sin gamla koordinat i stället för att
   släpa den med sig. Cirka fyrtio rader plus ett steg i
   `.github/workflows/uppdatera-data.yml`.

   Alternativet, att exporten bär fram gårdagens koordinat ur filen den håller
   på att skriva över, är kortare men fel: en ändrad adress skulle behålla sin
   gamla koordinat.

4. **En spärr i databasen.** Töm de nio raderna och lägg ett villkor som gör
   det omöjligt att lagra en härledd koordinat:

       update establishments
          set lat = null, lng = null, geo_source = null, geo_precision = null
        where geo_source is not null;

       alter table establishments
         add constraint establishments_ingen_harledd_geo
         check (geo_source is null);

   Villkoret är det som gör påståendet i ansökan kontrollerbart i stället för
   bara utlovat, och det är värt att citera i ansökan.

Dessutom, utan kodändring: `hamta_gatubilder.py` körs alltid med `--fil`.

### 2.6 Ett led vi inte kan tiga om: GitHub

Ansökan måste beskriva kedjan sanningsenligt, och då kan vi inte hoppa över
att projektets git-förråd ligger hos GitHub, Inc.
(`https://github.com/manserlandsson/prikko.git`). De härledda koordinaterna
lagras i `site/src/data/*.json` och i `pipeline/geocode_cache.json`, och båda
är incheckade filer. Nattjobbet körs dessutom av GitHub Actions, och vår egen
arbetsflödesfil noterar att löparen står i Azure westus3, alltså i USA.

Vi kan alltså **inte** upprepa förra ansökans mening "ingen lagring eller
bearbetning sker utanför EU/EES". Den var förmodligen inte korrekt redan då.

Det avgörande är att GitHub klarar precis det test Lantmäteriet tillämpade på
Supabase. Enligt sökning är både **Cloudflare, Inc.** och **GitHub, Inc.**
aktiva deltagare i EU-US Data Privacy Framework med den brittiska och
schweiziska utvidgningen, medan Supabase inte är det och i stället stödjer sig
på standardavtalsklausuler. GitHub har enligt uppgift en egen certifiering
skild från Microsofts.

**Okontrollerat av mig:** jag har inte kunnat läsa de officiella
deltagarposterna direkt, eftersom dataprivacyframework.gov renderar sin
söksida med skript som inte går att hämta som text. Sökningen pekade på
`/participant/5666` för Cloudflare och `/participant/6474` för GitHub, men
posternas innehåll och status är inte verifierade av mig. Måns måste slå upp
båda i den officiella deltagarsökningen och spara utskrifter som bilagor. Se
kryssrutan i avsnitt 3.

Vill vi ta bort ledet helt i stället för att luta oss mot adekvansbeslutet
finns två vägar, båda större: flytta förrådet till en europeisk värd, eller
köra nattjobbet på en egen löpare i Sverige. Ingen av dem är nödvändig för att
bemöta det här avslaget, men de är de enda sätten att kunna skriva "ingen
bearbetning utanför EU/EES" och mena det.

## 3. Kryssruta: vad som måste vara sant innan ansökan skickas

Ansökan får bara påstå saker som är sanna om koden när den skickas. Gå igenom
listan och bocka av. Varje rad ska gå att verifiera.

- [ ] `pipeline/load_supabase.py` skickar varken `geo_source`,
      `geo_precision` eller en `lat`/`lng` som bär `geoSource`. Committat.
- [ ] `pipeline/rorelse.py` kastar koordinaten när `geo_source` är satt.
      Committat.
- [ ] Härledda koordinater överlever nattjobbet utan att passera Supabase
      (`geocode.py --bara-cache` efter exporten, eller motsvarande).
      Committat.
- [ ] `.github/workflows/uppdatera-data.yml` kör det nya steget, och
      `hamta_gatubilder.py` anropas aldrig utan `--fil`. Committat.
- [ ] Databasen är städad och spärrad. Kontrollfrågan
      `select count(*) from establishments where geo_source is not null;`
      ger 0, och villkoret `establishments_ingen_harledd_geo` finns.
- [ ] Nattjobbet har gått igenom minst en gång efter ändringarna, och
      Uppsalas och Örebros koordinater ligger kvar i `site/src/data/` efteråt.
- [ ] Verifierat i den officiella deltagarsökningen på
      dataprivacyframework.gov, samma vecka som ansökan skickas, att
      Cloudflare, Inc. och GitHub, Inc. står som aktiva under EU-US DPF.
      Utskrifter sparade med datum, som bilaga.
- [ ] Kontrollerat att beskrivningen "egen utrustning i Sverige" stämmer med
      var geokodningen faktiskt körs.
- [ ] Kontrollerat att `pipeline/data/interim/` fortfarande är undantagen i
      `.gitignore`, så att själva GeoPackage-filen aldrig checkas in.

## 4. Utkast till ny ansökan

Allt mellan strecken är avsett att kopieras. Ändamålsbeskrivningen är
ordagrant densamma som i LM2026/110331, eftersom den redan är prövad och
godkänd. Det som är nytt är beskrivningen av lagringen och bemötandet.

---

**Ansökan om tillgång till information ur fastighetsregistret**

Sökande: Magoed AB, org.nr 559386-1015
Kontakt: Måns Erlandsson, mans.erlandsson1@gmail.com
Avser: geodataprodukten Belägenhetsadress Nedladdning, vektor

**Tidigare ärende**

Denna ansökan ersätter Magoed AB:s ansökan av den 8 augusti 2026, som
avslogs genom Lantmäteriets beslut den 17 augusti 2026 i ärende
LM2026/110331.

Lantmäteriet bedömde i det beslutet att den beskrivna behandlingen utgör ett
tillåtet ändamål enligt 2 § FRL. Ändamålet är oförändrat och återges nedan
ordagrant. Avslaget grundades uteslutande på prövningen av lagring hos extern
aktör, närmare bestämt på att lagringsaktören Supabase inte omfattas av
EU-kommissionens adekvansbeslut om EU-US Data Privacy Framework.

Magoed AB har därefter byggt om sin behandlingskedja så att inga uppgifter
som härletts ur fastighetsregistret lagras hos Supabase. Ansökan avser samma
ändamål som tidigare, med en ändrad lagrings- och bearbetningskedja som
beskrivs i detalj nedan.

**Ändamål (oförändrat)**

Magoed AB driver konsumenttjänsten prikko.se, som samlar svenska kommuners
offentliga livsmedelskontroller och visar dem samlat för allmänheten.
Verksamheterna publiceras av kommunerna med gatuadress men utan koordinat.
Belägenhetsadresserna används uteslutande för att översätta en gatuadress till
en koordinat, så att en kontrollerad verksamhet kan visas på rätt plats på en
karta. Ingen annan uppgift ur registret används, och ingen uppgift om
fastighetsägare, taxering eller enskild person efterfrågas eller behandlas.

Ingen adressinformation sprids vidare. Den enda uppgift som når allmänheten är
en koordinat för en näringsverksamhet som kommunen redan publicerat med
adress. Bearbetningen är en uppslagning: verksamhetens gatuadress matchas mot
adressregistret och koordinaten sparas på verksamheten. Ingen samkörning sker
mot andra personuppgiftskällor. Attribution till Lantmäteriet visas där
koordinaten publiceras.

**Lagring och bearbetning, steg för steg**

*Steg 1, nedladdning.* Adressfilerna hämtas ur Geotorget till Magoed AB:s egen
utrustning i Sverige. Filerna läggs i katalogen `pipeline/data/interim/`, som
är uttryckligen undantagen från projektets versionshantering. GeoPackage-filen
laddas alltså aldrig upp till någon tjänst, hos någon leverantör, i något land.
Den finns bara på den egna utrustningen och kan raderas när uttaget är
förbrukat.

*Steg 2, bearbetning.* Uppslagningen körs på samma egna utrustning. Ett
adressindex byggs i arbetsminnet ur GeoPackage-filen, varje verksamhets
gatuadress slås upp mot indexet, och träffen prövas mot kommunens
utsträckning innan den får användas. Ingen del av det här steget sker hos
någon molntjänst.

*Steg 3, vad resultatet är.* Resultatet är, per verksamhet, ett breddgrads-
och längdgradsvärde samt en notering om att koordinaten är härledd och ur
vilken källa. Uppslagningen sparas dessutom i en lokal uppslagningsfil så att
samma adress inte behöver slås upp på nytt.

*Steg 4, var resultatet lagras.* Koordinaterna lagras i textfiler i projektets
källkodsförråd, som ligger hos GitHub, Inc., och publiceras som statiska filer
via Cloudflare, Inc. Båda dessa är aktiva deltagare i EU-US Data Privacy
Framework, inklusive den brittiska och den schweiziska utvidgningen, och
omfattas därmed av kommissionens adekvansbeslut. Underlag bifogas.

*Steg 5, vad som inte lagras var.* Ingen uppgift som härletts ur
fastighetsregistret lagras i Magoed AB:s databas hos Supabase. Databasen bär
kommunernas egna uppgifter om sina livsmedelskontroller, och i förekommande
fall den koordinat som kommunen själv publicerat i sina öppna data, men
aldrig en koordinat som räknats fram ur belägenhetsadresserna.

Detta är inte enbart en rutin utan en spärr i databasens schema. Kolumnen som
anger en koordinats ursprung är belagd med villkoret att den ska vara tom,
vilket gör det tekniskt omöjligt att lagra en härledd koordinat i databasen.
Motsvarande spärr finns i det program som skriver till databasen, vilket
utelämnar varje koordinat som bär en ursprungsmarkering.

**Bemötande av avslagsskälet i LM2026/110331**

Avslaget grundades på att Supabase har sitt ägande i USA, att extraterritoriell
tillämpning av amerikansk lagstiftning inte kan uteslutas, och att Supabase
inte omfattas av EU-US Data Privacy Framework och därmed inte av
adekvansbeslutet enligt artikel 45 GDPR.

Magoed AB har inte försökt bemöta den bedömningen utan har i stället tagit
bort det led den avser. Ingen uppgift ur eller härledd ur fastighetsregistret
når Supabase. Frågan om huruvida en överföring till Supabase har stöd i
artikel 45 GDPR uppkommer därför inte längre i detta ärende.

De två aktörer som lagrar respektive publicerar koordinaterna, GitHub, Inc.
och Cloudflare, Inc., prövas mot samma måttstock som Lantmäteriet tillämpade
och klarar den: båda är aktiva deltagare i EU-US Data Privacy Framework och
omfattas av kommissionens adekvansbeslut. Överföring till dem har stöd i
artikel 45 GDPR.

Magoed AB gör inte gällande att någon bearbetning sker uteslutande inom
EU/EES. Härledningen av koordinater sker på egen utrustning i Sverige, men
det underhållsjobb som dagligen uppdaterar kontrolluppgifterna körs hos
GitHub, Inc. och kan köras på utrustning i USA. Detta redovisas öppet just
därför att det omfattas av adekvansbeslutet på samma grund som lagringen.

**Övrigt**

Magoed AB är personuppgiftsansvarig enligt GDPR med kompletterande svensk
lagstiftning för behandlingen av de personuppgifter som Lantmäteriet lämnar
ut.

Attribution till Lantmäteriet visas där koordinaten publiceras, i enlighet
med CC BY 4.0.

**Bilagor**

1. Utdrag ur deltagarförteckningen på dataprivacyframework.gov för
   Cloudflare, Inc., hämtat [datum].
2. Utdrag ur deltagarförteckningen på dataprivacyframework.gov för
   GitHub, Inc., hämtat [datum].

---

## 5. Överklagandespåret som alternativ

Överklagandet är ett alternativ till en ny ansökan, inte en ersättning för
den. Det går att göra båda.

**Tidsfrist.** Tre veckor från den dag Magoed AB fick del av beslutet.
Beslutsdatum är 2026-08-17, så fristen löper ut omkring 2026-09-07. Räkna
från delgivningsdagen och inte från beslutsdatumet.

**Var.** Skriftligen till Lantmäteriet, 801 82 Gävle, som lämnar det vidare
till Förvaltningsrätten i Falun om det kommit in i rätt tid.

**Vad det ska innehålla,** enligt bilaga 1 i beslutet: klagandens namn och
organisationsnummer, postadress, telefonnummer, eventuellt ombuds uppgifter,
uppgift om vilket beslut som överklagas med ärendenummer och beslutsdatum,
uppgift om hur beslutet ska ändras och varför, samt de handlingar som åberopas
som bevis och vad varje bevis ska styrka.

**En observation om vad beslutet prövar.** Beslutet resonerar om artikel 45
GDPR, alltså om adekvansbeslutet, och konstaterar att Supabase inte omfattas
av EU-US Data Privacy Framework. Artikel 46 GDPR, standardavtalsklausuler, är
en egen och självständig laglig grund för överföring till tredjeland, och den
nämns inte i beslutet. Supabase uppger själva att de stödjer sina överföringar
på standardavtalsklausuler med brittiskt tillägg. Beslutet prövar alltså inte
den grunden.

Samtidigt avslår Lantmäteriet med stöd av 6 § FRL, som ger dem ett eget
utrymme att ställa villkor utöver vad som följer av GDPR för att undvika
otillbörligt intrång eller risker från säkerhetssynpunkt. Att en överföring
skulle vara tillåten enligt GDPR innebär alltså inte automatiskt att
Lantmäteriet måste lämna ut uppgifterna.

Detta är en observation om vad beslutet prövar och inte prövar. Det är inte
ett juridiskt råd. Varken Måns eller den som skrivit det här är jurist. Ska
överklagandespåret drivas bör en jurist läsa beslutet först.

**Rekommendation.** Den nya ansökan är den snabbare och säkrare vägen, och den
kräver inte att någon får rätt mot Lantmäteriet. Överklagandet är värt att
lämna in bara om ombyggnaden av kedjan visar sig kosta mer än väntat, eller om
en jurist bedömer att 6 §-tillämpningen är för sträng. Fristen är kort, så
beslutet om att överklaga eller inte bör fattas i god tid före den 7 september
2026.
