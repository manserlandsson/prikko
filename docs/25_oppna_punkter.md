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

Ingen. Kön är tom och allt är pushat, se listan längst ned.

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

---

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
