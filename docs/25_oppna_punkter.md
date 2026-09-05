# Öppna punkter

Ett ställe för allt som är sagt men inte klart. Uppdateras löpande. En punkt
stryks inte förrän den är verifierad i den byggda sajten, inte när koden är
skriven.

Senast genomgången: 2026-08-31.

---

## Väntar på dig

Fyra av dem är kontoärenden och tar tillsammans under en timme. De blockerar
mer än allt annat på listan.

Betalningsspärren på GitHub Actions stod här till 2026-09-05 och är borta. Den
står nu under "Nyligen stängt" med hur det mättes.

| Punkt | Vad som behövs | Vad den låser upp |
|---|---|---|
| **Cloudflare Pages till Workers Paid** | 5 dollar i månaden, ett klick. Taket går från 20 000 filer till 100 000, samma tal för båda plattformarna, se `46_filtaket.md`. | 17 066 färdigbyggda API-filer som ligger avstängda bakom en konstant, plus varje kommun efter den fjortonde |
| **Search Console** | Koppla domänen. | Ersätter hela uppskattningen i `49_indexeringen.md` med ett facit. Skillnaden mellan "Crawled, currently not indexed" och "Discovered" avgör om vi ska vänta eller bygga |
| **Släck `prikko.pages.dev`** | I Cloudflares kontrollpanel. Adressen serverar hela sajten en andra gång med `Allow: /`. Mätt om 2026-09-05: den svarar fortfarande 200 med `Allow: /`, alltså står punkten kvar. Hälsokollen påminner om den varje morgon tills den är gjord. | Halverar antalet adresser vi erbjuder Google, från 28 520 till 14 260 |
| **Skicka de tjugo breven** | Ligger färdiga i `pipeline/data/begaran/`, ett per fil, i sändordning. Steg noll är att kontrollera att `mans@prikko.se` tar emot post. | 25 117 anläggningar, 27 kommuner. Täckningen går från 20,2 till 47,3 procent |
| **Brevet till Stockholm** | Färdig lydelse i `52_stockholmslagret.md` §8.3.1. Ber om tre saker: att tillsynslagret börjar uppdateras igen, att `AnlaggningId` följer med, och att en trasig katalogslänk rättas. | 114 rapporteringspunkter i klartext i stället för 15 bokstäver, på alla 8 520 stockholmsrader |
| **Brevet till Norrköping** | Färdig lydelse i `20_kommunexpansion.md` §9.5. | En färsk fil. Den vi läser är från 17 mars 2024 och är en föräldralös rest, ingen sida länkar den |
| **Utgivningsbeviset** | 4 000 kronor, inte 3 000. Ansökan är färdigskriven i `47_utgivningsbevis.md`. | Grundlagsskydd. Se dock EU-domstolens avgörande C-199/24 från 9 juli 2026: beviset undantar inte från dataskyddsförordningen, de journalistiska kriterierna måste uppfyllas ändå |
| Geotorget | `GEOTORGET_USERNAME=maga0001` plus lösenord i `~/.prikko-env`. | Örebros 588 saknade nålar |
| R2-nycklar | I `~/.prikko-env`. | Gatubilderna, som är parkerade |
| Resend-nyckel | Som GitHub-hemlighet. Notiserna skrivs varje natt utan den. | Bara mejlet |
| Migadu | Mejlen är inte färdigflyttad. | |
| Bolagsordningen | Magoed AB:s registrerade verksamhetsföremål handlar om underkläder och modekonsulting. Publicistisk databasverksamhet ryms inte i den. | Stoppar inte ansökan, men bör städas hos Bolagsverket |

---

## Avgjort i dag, och vad som ändrades

**Färskhetsfönstret är fem år.** 15 365 av 17 066 bedömda i stället för
13 764, alltså 90 procent i stället för 80,7. Modellversion 5. Trettiosex
filer bar en text som sa "tre år", inklusive sex artiklar.

**Norrköping är kommun nummer tretton**, via en Ecos-adapter skriven för
formatet och inte för kommunen. 622 av 1 022 fick koordinat genom geokodning
på adress.

**Filtaket var fel i fyra dokument.** 100 000 och inte 20 000, på betalplanen.

**Bibelns affärsmodell är förbjuden.** En självbetjänad betald yta där kunden
ändrar sidan kostar utgivningsbeviset. Första betalda produkten blir
kedjebevakning. Se `54_affarsmodellen.md`.

**Indexeringen är mätt för första gången:** ungefär en sida av tio. Både
klickdjupet och sidindelningen är frikända, se `51_klickdjupet.md`. Kvar som
förklaring står innehållet och åldern.

**LIVES-formatet är prövat och avvisat.** 237 av 247 jurisdiktioner i Yelps
register levereras av en kommersiell part.

---

## Kvar att ta tag i, ingen på det än

- **Korta verksamhetssidan.** `53_egen_text_per_sida.md` mätte att taket för
  egen text är omkring 1 240 tecken på en sida som bär 6 600, alltså räcker
  det inte att skriva mer. Kedjesidan når 43,2 procent eget innehåll på 731
  ord medan verksamhetssidan ligger på 24,4 på 1 093. Nämnaren är halva
  skillnaden. Största posten som går att ta bort är omdömesrutan, 776 tecken,
  och den kräver att 1 100 rader skript skrivs om.
- **Utmärkelserna kan inte frysas om.** Klockvakten fäller på tolv dagars
  glapp mot gränsen sju. Antingen hämta om datan eller höj `CLOCK_DRIFT_DAYS`
  medvetet. En torrkörning visar 13 nya vinnare och noll borttagna, alla i
  Norrköping. Sedan 2026-09-05 flyttas Norrköpings `fetchedAt` fram varje natt
  som alla andras, alltså slutar den filen dra isär glappet. Om det räcker för
  att stänga punkten är inte mätt.
- **`pipeline/begaran.py` ber om tre årgångar.** Motiveringen var kopplad till
  treårsfönstret och är omskriven, men antalet är orört eftersom det ändrar
  brev som går till myndigheter.
- **Kontroller per år som linje.** Aldrig besvarad.
- **Företagsverifiering.** Nedprioriterad av dig.
- **Bevakningslistan på kontot** ska bära bedömning och datum.
- **Sidindelning av `/artiklar/`** vid ungefär trettio artiklar.
- **1 079 tankstreck** i 150 filer.
- **Mejlkampanjen till resten av kommunerna** efter de tjugo första.

---

## Nyligen stängt

- GitHub Actions kör igen. Mätt 2026-09-05: `Kontroll` gick igenom på HEAD
  09:43 UTC, och sajtens `llms.txt` säger att datan är noll dagar gammal, alltså
  har nattjobbet kört i natt. Spärren låg på en betalning och höll nattjobbet
  stilla från 18 augusti och byggrinden från 27 augusti. Utrullningen var aldrig
  berörd, Cloudflare Pages bygger direkt ur repot.
- Norrköping hämtas av nattjobbet. Kommunen kopplades in 31 augusti och stod
  utanför `hamta`-matrisen i fem dygn, alltså var den den enda av tretton som
  aldrig uppdaterades. Matrisen tål nu en kommun vars hämtare heter något annat
  än kommunen, och exporten är körd mot en kopia först: 622 koordinater och
  4 398 diarienummer överlever, hela filens diff är två rader. Se
  `20_kommunexpansion.md` §14.
- Noten om nedlagda verksamheter, med hela ytan. Avgjord och mätt i
  `35_scb_foretagsregistret.md` §9. Kommunen svarar `Inaktiv` på 27 rader och
  `Upphörd/Skrotad` på 3, hämtat om 2026-08-31 mot stadens levande intyg. Noten
  säger vad kommunen säger och aldrig att stället stängt, de två statusvärdena
  säger samma sak åt läsaren, och samma märke står i listor, sök, på kortet och
  på kartan. Sidorna ligger kvar i sitemapen, eftersom sidan är det enda stället
  noten kan läsas, och nålen står kvar dämpad i stället för att tas bort.
  SCB-spåret i samma rapport är orört och gäller de tolv kommuner som inte
  lämnar någon registeruppgift.
- Prickrutan på kommunsidan. Ägaren: "bara prickar men går ej att klicka, samt
  att det är kraftigt överlapp med vår riktiga robusta kartvy." Rutan ritar nu
  samma arkiv, samma nålar och samma klusterdelning som kartvyn, ett klick på en
  nål går till verksamheten, och den som har dålig uppkoppling får en
  platshållare med en knapp i stället för en punktbild som ser ut som data.
- Rikskartan, `/karta/`. Steg 3 till 6 i `23_rikskartan.md` är gjorda: den nya
  sidan, adressen som bär utsnitt och filter, landningssidorna som pekar in i
  kartan, och sökningen som leder till den delade vyn. Klusterdelningen finns
  på båda kartorna och mobilarket är mätt mot Booli om.
- Kartan i produktion. Arkivet heter `.bin`, eftersom ändelsen avgör om
  Cloudflare cachar det vid kanten, och utan kantcache ignoreras `Range`.
  Svarar nu 206 med träff i cachen. Verksamhetssidans karta ritar också.
- Emblemet. En sida, `/utmarkelser/emblem/`, med verksamheten vald på plats.
  Ingen sida per verksamhet, eftersom en sådan konkurrerar med verksamhetens
  egen sida om samma sökning.
- Artiklarna i sidfoten. En rad, `Artiklar`, i Prikkokolumnen bredvid Rapporter.
- Verktygstipset rullade, eftersom webbläsarens egen regel för `[popover]`
  sätter `overflow: auto`.
- Rutan om lokalen mot företaget har tappat sin ram och är en fotnot igen.
- Grävlingen i artikelfoten är 112 i stället för 72 och spanar när han
  scrollas in i vyn.
- Riggen och rörelsekatalogen är sparade, och `brand/_prov-rorelse.html` spelar
  upp dem.

---

## Hälsokollen körs av ett schema, och larmet är ett ärende

*Avgjort 2026-09-05.*

`site/scripts/halsokoll.mjs` skrevs 31 augusti och kördes fram till 5 september
av ingenting. Skriptet frågar den PUBLICERADE sajten om den är RÄTT och inte om
den är uppe, och varje kontroll i det motsvarar ett fel som faktiskt har
inträffat. Att det inte kördes var samma tystnad en gång till: de två fel som
fick det skrivet, ett nattjobb som stått stilla sedan 18 augusti och en byggrind
sedan 27 augusti, hade båda legat tysta i veckor bakom en sajt som svarade 200
hela tiden.

Det körs nu av `.github/workflows/halsokoll.yml`. Tre frågor fick avgöras.

**Efter utrullning, på schema, eller båda? På schema, och det är prövat.** Kollen
mäter den publicerade sajten, alltså kan den inte köras före en deploy. Att köra
den efter går inte, för Actions ser inte utrullningen. Cloudflare Pages bygger
direkt ur repot och inte genom ett steg här. `on: deployment_status` är
uteslutet: repots deployments-API svarar med noll deployments, alltså skapar
integrationen inget att lyssna på. `on: check_run` skulle fungera formellt,
Cloudflare rapporterar som en check run vid namn "Cloudflare Pages", men den
checken har samma `started_at` som `completed_at` och säger därför ingenting om
när sajten är ute i kanten, och den skapas dessutom för varje förhandsutrullning
på varje gren. En hälsokoll mot prikko.se efter ett grenbygge mäter fel sajt.

Kvar står ett schema lagt efter både nattjobbet och Cloudflares bygge: 06:17
UTC, alltså 08:17 svensk sommartid. Nattjobbet startar 03:17 UTC och tar omkring
50 minuter, så marginalen är över en timme även när GitHubs köer drar ut på
starten. En gång om dygnet räcker, för ingen kontroll i skriptet gäller ett
ögonblick: färskhetsgrinden mäter i dygn, tre för varning och tio för fel, och
de andra sex frågar om ett tillstånd som består tills någon ändrar det.

**Fäller ett fel körningen? Ja, och en varning gör det inte.** Skriptet avslutar
med 1 vid FEL och 0 vid VARNING, och den skillnaden är skriven med mening: ett
FEL är trasigt för besökaren eller för Google just nu, en VARNING är något vi
redan vet om och lever med tills vidare. Slutkoden får därför avgöra rakt av.
Varningarna lyfts som annoteringar på körningens sida så att de syns utan att
larma.

**Hur får ägaren veta? Ett ärende i repot, tilldelat honom.** Ett rött kryss är
ingen övervakning, och GitHubs mejl om ett fallerat schemalagt arbetsflöde går
genom samma kanal som redan tystnade i tolv dagar i augusti. Mejl genom Resend
vore den rätta vägen, `pipeline/notify.py` kan det redan, men RESEND_API_KEY
ligger inte som GitHub-hemlighet, alltså hade larmet varit dött just den dag det
behövdes först. Ett ärende kräver varken hemlighet eller en ändring i kontots
inställningar, det försvinner inte när loggarna gallras, och en tilldelning
mejlar oavsett hur bevakningen av repot står inställd.

Det är ETT ärende och inte ett per natt. Larmet bär ett avtryck, en hash av
FEL-raderna: står samma fel kvar händer ingenting, medan ett nytt fel skriver en
kommentar och mejlar igen. Och det stängs av sig självt när kollen går igenom,
eftersom ett ärende som står öppet efter att felet är lagat lär ägaren att inte
lita på nästa.

**Varningen om `prikko.pages.dev` står kvar.** Skriptet släcker den av sig självt
den dag adressen slutar svara. Mätt 2026-09-05 svarar den fortfarande 200 med
`Allow: /`, alltså är varningen sann och punkten i listan ovan öppen. Kollen mot
den skarpa sajten gav samma dag 0 fel och 1 varning, och den varningen är den.

**Vad som INTE är löst.** En trasig utrullning mitt på dagen upptäcks först nästa
morgon. Knappen är en andra cron-rad, och den ska vridas den dag det visar sig
behövas och inte innan. Mejlvägen är den andra: den dag RESEND_API_KEY ligger som
hemlighet kostar den ett steg till i arbetsflödet, och då blir ärendet en kopia
i stället för hela larmet.

## Ednia är ednia.se, inte Eniro

Två agenter drog olika slutsats om samma referens och byggde på var sin, så det
skrivs ned här en gång.

`ednia.se` svarar och är en svensk tjänst för gymnasium och universitet, alltså
en katalogtjänst med samma grundproblem som vår: många poster, tunn data per
post, och sökningen som huvudingång. Det är den ägaren pekat på genom hela
projektet, både för menyn och för statistiken.

`ednia.com` finns inte. En agent som slog på den adressen fick inget svar,
läste sedan en rad i `21_foretagsyta_och_verifiering.md` som påstod att Ednia
var ägarens namn på Eniro, och mätte eniro.se i stället. Den raden var fel och
är borttagen. Eniro är fortfarande en relevant jämförelse för företagsytan, men
den är inte Ednia.
