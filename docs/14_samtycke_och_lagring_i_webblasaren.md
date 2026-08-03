# 14. Samtycke, kakor och lagring i webbläsaren

Datum: 2026-08-03. Allt under **Mätt** är kört mot den LIVE-publicerade sajten
och mot de riktiga endpointsen samma dag, med `curl` och mot den byggda
JavaScript-koden som faktiskt ligger på prikko.se. Ingenting i den delen är
gissat eller läst ur en kommentar i koden.

Allt under **Bedömning** är just en bedömning. Jag är inte jurist och det här är
inte juridisk rådgivning. De ställningstaganden som behöver en advokat står
samlade sist.

---

## Kort svar

**Ingen samtyckesruta byggs.** Ingenting icke-nödvändigt lagras hos besökaren.
Det finns fortfarande noll webbanalys, noll spårpixlar, noll annonsnätverk och
noll Google Fonts.

Men utredningen hittade ett större problem än det den skickades ut för att
lösa: **de två sidor som redan beskriver läget är osanna sedan inloggningen
byggdes.** `/cookies` påstår "Vi lagrar ingenting i din webbläsare" och
"Ingen inloggning". `/integritetspolicy` påstår "Det finns inget konto att
skapa, inget formulär att skicka och ingenting som sparas om dig mellan
besöken". Sajten har sedan dess konto, sessionslagring, omdömen,
bilduppladdning, bevakning med notismejl och en tredjepartskaka från
Cloudflare framför Supabase.

En falsk redovisning skadar förtroendet exakt lika mycket som en ruta som
frågar om något vi inte gör. Det är det som är åtgärdat.

---

## Vad som faktiskt lagras och skickas

| Vad | Var | Varför | Sätts när | Samtycke? |
|---|---|---|---|---|
| `prikko.session` | localStorage, vår egen origin | Access token, refresh token, utgångstid, användar-id och e-postadress för en inloggning besökaren själv begärt | Först efter att en engångskod växlats in mot en session | **Nej.** Strikt nödvändig för en tjänst användaren uttryckligen begärt |
| `prikko.next` | sessionStorage, vår egen origin | Vilken sida man ska tillbaka till efter OAuth-omdirigering | Bara när en OAuth-knapp trycks. OAuth är avstängt i dag, listan `PUBLIC_OAUTH_PROVIDERS` är tom | **Nej.** Samma undantag, och den försvinner när fliken stängs |
| `__cf_bm` | Kaka på domänen `supabase.co`, alltså tredjepart | Cloudflares botdetektering framför Supabase API | **Vid sidladdning på varje verksamhetssida**, före all interaktion, eftersom omdömeslistan hämtas direkt | **Bedömning: nej**, säkerhetsundantaget. Men det är den enda posten i tabellen som förtjänar en diskussion. Se nedan |
| NEL och `Report-To` | Rapportpolicy i webbläsaren, vår egen origin | Cloudflare ber webbläsaren rapportera nätverksfel till `a.nel.cloudflare.com` | Varje svar från prikko.se, `max_age` 604800, `success_fraction` 0.0 så bara misslyckade anrop rapporteras | **Bedömning: nej.** Ingen kaka, ingen identifierare, och ingen omställbar knapp på Cloudflares gratisplan |
| Kartbild från `api.mapbox.com` | Ingenting lagras | Statisk kartbild i sidopanelen | Vid sidladdning på verksamhetssidor med koordinat | **Nej.** Mätt: Mapbox skickar ingen `Set-Cookie` alls. Kvar är att IP-adressen syns för Mapbox, vilket är en utlämning och inte en lagring |
| Typsnittet Instrument Sans | Vår egen origin | Sajtens typografi | Varje sidladdning | **Nej.** Två `.woff2` i `dist/_astro/`, inga Google Fonts |
| Sökregistret | Vår egen origin | Sökningen körs i webbläsaren | När sökfältet används | **Nej.** Relativ adress, ingen tredjepart, ingenting lagras |
| Platstjänsten | Ingenting lagras | Räknar ut närmaste kommun | Bara när platsknappen trycks | **Nej.** Webbläsarens egen behörighet, positionen lämnar aldrig enheten |
| Cloudflare Pages på prikko.se | Ingen kaka | Värdtjänst och proxy | Varje anrop | **Nej.** Mätt: ingen `Set-Cookie` på HTML, på en asset, på POST eller med bot-lik user agent |
| Webbanalys | Finns inte | | | Ingen att fråga om |

Uttömmande om lagring hos besökaren, mätt mot den byggda koden på prikko.se:
inga `document.cookie`-skrivningar, ingen IndexedDB, ingen service worker,
ingen Cache API. De enda nycklarna är `prikko.session` och `prikko.next`.

---

## Så mättes det

Vår egen domän, fyra varianter av anrop, ingen kaka i något av dem:

```
curl -sSI https://prikko.se/                      → HTTP/2 200, ingen Set-Cookie
curl -sSI -A "curl-test-bot" https://prikko.se/   → ingen Set-Cookie
curl -sSI https://prikko.se/favicon.svg           → ingen Set-Cookie
curl -sS -X POST https://prikko.se/               → HTTP/2 405, ingen Set-Cookie
```

Svaret bär däremot `report-to` och `nel` från Cloudflare, med
`success_fraction: 0.0`.

Mapbox, med den riktiga token och exakt den adress `LocationMap.astro` bygger:

```
HTTP/2 200
content-type: image/png
x-cache: Miss from cloudfront
```

Ingen `Set-Cookie`. Därmed är fråga **C1** i `cookies.astro` besvarad med en
mätning i stället för en brasklapp: Mapbox Static Images API lagrar ingenting i
besökarens utrustning.

Supabase, både förhandsanropet och det riktiga anropet som sidan gör:

```
OPTIONS /rest/v1/published_reviews          → set-cookie: __cf_bm=...; HttpOnly;
GET /rest/v1/published_reviews?select=...   → set-cookie: __cf_bm=...; HttpOnly;
                                               SameSite=None; Secure; Path=/;
                                               Domain=supabase.co
```

Att produktionsbygget verkligen är konfigurerat mot Supabase är mätt i den
utlevererade koden, inte antaget: `/_astro/community.*.js` på prikko.se
innehåller projektets URL och anon-nyckeln, alltså är `configured` sann och
`publishedReviews()` körs.

Supabase-projektets databas ligger på AWS `eu-north-1`, Stockholm. Härlett ur
att `db.<projekt>.supabase.co` slår upp till `2a05:d016:2b6:b301::/…`, som
ligger i prefixet `2a05:d016::/36` i Amazons egen `ip-ranges.json`, region
`eu-north-1`.

---

## Den enda posten värd en diskussion: `__cf_bm`

**Mätt.** Varje besökare på en verksamhetssida får en kaka satt från
`supabase.co` innan hen rört sig. Orsaken är att `Reviews.astro` hämtar
publicerade omdömen direkt i `start()`, utan att vänta på någon handling.
Kakan är Cloudflares, inte vår. Vi kan inte stänga av den och vi kan inte läsa
den: den är `HttpOnly` och satt på en annan domän.

**Cloudflares egen beskrivning.** Botdetektering och botpoäng, upphör efter
30 minuters sammanhängande inaktivitet. Cloudflare klassar den, liksom alla
kakor i sin lista, som strikt nödvändig. De skriver också att kakdata som
förval kan behandlas i deras datacenter i USA.

**Bedömning.** 9 kap. 28 § lagen (2022:482) om elektronisk kommunikation
kräver samtycke innan uppgifter lagras i eller hämtas från terminalutrustning,
med undantag för det som är absolut nödvändigt för en tjänst användaren
uttryckligen begärt. En kaka som enbart skiljer människa från bot framför det
API som levererar sidans innehåll ligger inom det undantaget så som det
normalt tolkas. Jag är inte jurist, och det här är den punkt där jag är minst
säker på min egen slutsats.

**Vad som ändå borde göras, oavsett hur juridiken landar.** Sidan behöver inte
prata med någon tredjepart förrän läsaren visat intresse. Att skjuta upp
`publishedReviews()` till första interaktionen, eller till att
omdömesavsnittet rullas in i vyn, tar bort tredjepartskontakten helt för den
som bara läser en bedömning och går vidare. Det är billigare än varje juridisk
diskussion om saken och det gör påståendet på `/cookies` starkare.

`Reviews.astro` är låst för den här sessionen, en annan agent arbetar där.
Ändringen är alltså föreslagen, inte gjord.

---

## Varför ingen ruta

Tre skäl, i den ordning de väger:

1. **Det finns ingenting att fråga om.** Ingen analys, ingen spårning, ingen
   annonsering, ingen kaka från oss. Det enda som lagras är en session
   besökaren själv bad om och en returadress i sessionStorage.
2. **En ruta som frågar om något vi inte gör är ett påstående om att vi gör
   det.** På en sajt vars hela poäng är att vara redlig om andras
   verksamheter är det ett självmål.
3. **En ruta som ändå ska klickas bort tränar bort läsningen.** Den dag något
   faktiskt kräver samtycke är rutan då redan brus.

Villkoret för att det här ska fortsätta stämma står som en underhållsregel
längst ned på `/cookies`: läggs webbanalys, inbäddad video, delningsknappar,
kartor från tredjepart som sätter kakor eller något annat tredjepartsskript
till, är sidan osann samma dag, och då ska rutan byggas först. Rutan ska då
ligga som ett eget block i `site/src/layouts/Base.astro`, med neka lika lätt
tillgängligt som godta.

---

## Det som var fel på sajten, och som nu är rättat

`site/src/pages/cookies.astro`, tidigare påståenden som mätningen motsäger:

| Stod på sidan | Faktiskt läge |
|---|---|
| "Vi lagrar ingenting i din webbläsare" | `prikko.session` i localStorage efter inloggning |
| "Inget sparat i webbläsarens lokala lagring" | Samma |
| "Inga kakor, varken egna eller andras" | `__cf_bm` från `supabase.co` vid varje verksamhetssida |
| "Vi känner inte igen dig mellan besöken" | Sessionen ligger kvar tills man loggar ut |
| Kommentaren "Ingen kod i site/src sätter document.cookie, localStorage eller sessionStorage" | Osann sedan `community.ts` byggdes |
| Öppen fråga C1 om Mapbox sätter kaka | Mätt: nej |

`site/src/pages/integritetspolicy.astro`, tidigare påståenden som mätningen
motsäger:

| Stod på sidan | Faktiskt läge |
|---|---|
| "Vi har ingen inloggning, inga konton och ingen spårning" | Konto med e-postkod finns |
| "Vi sätter inga kakor" | Se ovan |
| "Sajten är statisk. Det finns inget konto att skapa, inget formulär att skicka och ingenting som sparas om dig mellan besöken" | Omdömen, bevakningar, anspråk, bilduppladdning och notismejl finns |
| Kommentaren "Ingen inloggning, inga konton, ingen formulärinlämning, ingen databas mot besökaren" | Osann |
| Ingenting alls om vad som sparas om en inloggad person | Se listan nedan |

Uppgifter som lagras hos oss om den som skapar konto, hämtat ur
`pipeline/schema_community.sql`:

- E-postadress och användar-id i Supabase Auth.
- Bevakningar: verksamhet, kommun, tidpunkt och en avregistreringstoken.
- Omdömen: text, frivilligt betyg, frivillig besöksmånad, status och skäl vid
  avslag. Publiceras utan namn, kolumnen `author_name` fylls aldrig av
  klienten.
- Uppladdade bilder i en privat inkorg, med filtyp, storlek och bildtext.
- Anspråk på att företräda en verksamhet: namn, roll, organisationsnummer,
  e-post och telefon. Den här posten är den känsligaste av dem alla och stod
  inte med i policyn med ett ord.
- Notiser: vilken kontroll ett mejl gällde, för att samma mejl inte ska gå ut
  två gånger.

---

## Kvar för ägaren och för advokaten

1. **`dataskydd@prikko.se` fungerar inte än.** Adressen står nu på två sidor
   och GDPR-begäranden har en månadsfrist. Se `docs/13_epost_pa_prikko_se.md`.
   Sidorna bör inte marknadsföras innan brevlådan finns.
2. **Bot Fight Mode på prikko.se.** Slås den på i Cloudflare-panelen börjar
   `__cf_bm` sättas på vår EGEN domän också. Då måste `/cookies` skrivas om
   samma dag.
3. **Mapbox och Data Privacy Framework.** Policyn påstår att Mapbox är
   anslutet. Påståendet stöds av Mapbox eget certifieringsmeddelande och av
   registerposten, men jag har inte kunnat läsa den officiella posten i
   `dataprivacyframework.gov` i sin helhet. Kontrollera innan publicering, och
   kontrollera samtidigt att certifieringen är förnyad.
4. **Cloudflare och USA.** Cloudflare skriver själva att kakdata som förval
   kan behandlas i deras amerikanska datacenter. Det gäller `__cf_bm` från
   `supabase.co` och trafiken genom vår egen proxy. Är det en överföring som
   ska beskrivas som en egen punkt i policyn?
5. **Säkerhetsundantaget för `__cf_bm`.** Se bedömningen ovan. Advokaten bör
   ta ställning, och helst bör anropet ändå skjutas upp till första
   interaktionen så att frågan blir hypotetisk.
6. **`site/src/pages/villkor.astro`** inleder med "Prikko är gratis att använda
   och kräver inget konto". Det är sant för den som läser och falskt för den
   som vill skriva ett omdöme. Rörs inte här, men bör skrivas om.
7. **Personuppgiftsbiträden.** Policyn räknar nu upp värdtjänst, databas och
   e-post i klartext. Biträdesavtal med Cloudflare, Supabase och Resend måste
   finnas på papper innan sajten marknadsförs.
8. **Anon-nyckeln och Mapbox-token ligger publikt i den utlevererade koden.**
   Det är avsiktligt och rätt: det är radsäkerheten som skyddar datan. Men
   Mapbox-token bör domänbegränsas till prikko.se i Mapbox-panelen nu när
   domänen finns.

---

## Källor

- Cloudflare, "Cloudflare Cookies",
  `developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/`.
  Läst 2026-08-03. Därifrån kommer beskrivningen av `__cf_bm`, livslängden på
  30 minuters inaktivitet, klassningen som strikt nödvändig och noteringen om
  behandling i USA.
- Amazon, `ip-ranges.amazonaws.com/ip-ranges.json`, hämtad 2026-08-03. Källa
  för att Supabase-projektet ligger i `eu-north-1`.
- Mapbox, "Notice of Certification Under the Data Privacy Framework",
  `mapbox.com/legal/notice-of-certification`. Se punkt 3 ovan om vad som
  återstår att kontrollera.
- 9 kap. 28 § lagen (2022:482) om elektronisk kommunikation. Paragrafnumret är
  belagt via PTS tillsynsdokumentation, inte läst i författningstexten i
  original. Advokaten ska verifiera lydelsen mot SFS.
- Egna mätningar med `curl` mot prikko.se, `api.mapbox.com` och
  Supabase-projektet, 2026-08-03. Kommandona står under **Så mättes det**.
