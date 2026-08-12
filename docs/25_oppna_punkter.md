# Öppna punkter

Ett ställe för allt som är sagt men inte klart. Uppdateras löpande. En punkt
stryks inte förrän den är verifierad i den byggda sajten, inte när koden är
skriven.

Senast genomgången: 2026-08-12.

---

## Väntar på dig

| Punkt | Vad som behövs | Läge |
|---|---|---|
| Heron på startsidan | Vektorvarianten med mat är din beställning från 7 augusti. Fotovarianten finns kvar och är en prop bort. Säg vilken. | Ditt val |
| Grön nyans på grävlingen | Fem platta steg ligger i `brand/_prov-gront.html`, steg 3 är dagens. | Ditt val |
| Ordmärket | Variant C sätter ansiktet före ordet och är enda vägen till centralitet. Variant A lämnar formen orörd. `brand/ordmarke-forslag.html`. | Ditt val |
| R2-nycklar | Behövs för gatubilderna. Läggs i `~/.prikko-env`. | Din åtgärd |
| Geotorget | `GEOTORGET_USERNAME=maga0001` plus lösenord i `~/.prikko-env` när den juridiska granskningen landat. | Din åtgärd |
| Utgivningsbevis | 3 000 kr. Skjuts upp tills vidare. | Uppskjuten |
| GitHub Actions | Pushar startar fortfarande inga körningar. Kolla fliken. | Din åtgärd |
| Migadu | Mejlen är inte färdigflyttad. | Din åtgärd |

---

## Agenter arbetar just nu

**Hamburgarmenyn.** Fyra saker i samma vända: ikonerna på rättelse och jämför
hör inte ihop med resten och ska antingen bort eller ersättas ur en enda
uppsättning; avsnitten ska ligga bredvid varandra i stället för staplade så att
panelen slutar bli hög; kartvyn ska in som egen ruta efter sök, kedjor och
kommuner; och måtten ska sättas efter att ednia, airbnb och booli faktiskt
öppnats och mätts.

**Artiklarna.** Diagrammen ligger indragna mot brödtexten, eftersom `Stapel`
renderar en `ul` och artikellayouten ger alla listor `padding-left`. Samma regel
ger dem för lite luft, alltså det hoptryckta intrycket. Därtill: bara en
diagramform används trots att tre finns, etiketten är osynlig så diagrammen
saknar rubrik, flera artiklar delar bild, och fler artiklar ska skrivas på
sökordsanalys. Två nya foton ligger i `brand/`, `storkok-personal.jpg` till
skolmatsartikeln och `konditori-disk.jpg`.

**Grävlingen som ritning.** Den förenklade figuren lever kvar på flera ställen
och ska bort överallt. Den röda ska ha nära platta ögonbryn, munnen ensam ska
skilja alla tre lägen, och på rent bågar munnen just nu in i nosen.

**Rörelserna.** Av nitton håller en, spaningen. Skillnaden är mätbar: spaningen
har håll i bildrutorna, liten amplitud och en kurva utan överslag, medan hoppet
och ögonpoppen har squash och stretch och kurvor som skjuter förbi målet med
åttio till nittio procent. Agenten gör om resten och ska säga rakt ut vilka som
borde strykas helt.

**Kommunsidans statistik.** Två ytor som båda ser undermåliga ut. Avsnittet
"i siffror" har gråa nästan osynliga staplar, tal långt från sin etikett, två
olika stapelspråk på samma yta och en källrad som säger SCB två gånger på sex
ord. Kommunsidans topp har en oläslig teckenförklaring och ikoner ur olika
uppsättningar.

---

## Kvar att ta tag i, ingen på det än

- **Områdeskartan är sista andra datavägen.** `OmradeKarta.astro` läser
  fortfarande `map-data.ts` för sin byggtidsbild och sin GeoJSON-källa. Först
  när den bytt till rutarkivet kan `map-data.ts`, `pages/kartdata/`, propen
  `data` på KartaPuff och `mapDataset`-anropet i `KommunHub.astro` tas bort.
  Steg 7 i `23_rikskartan.md`.
- **Kontroller per år.** En linje över tid saknas som form. Statistikagenten
  frågade om den ska byggas och fick aldrig svar.
- **Företagsverifiering.** Du nedprioriterade den uttryckligen: att allt
  fungerar och ser ut som Booli går före.
- **Bevakningslistan.** Vad en bevakning faktiskt gör är fortfarande obestämt.
- **Mejlkampanjen till 275 kommuner** enligt offentlighetsprincipen.

---

## Nyligen stängt

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
