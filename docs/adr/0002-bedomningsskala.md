# ADR 0002 — Bedömningsskala: tre nivåer i klarspråk

**Status:** Beslutad · **Datum:** 2026-08-02 · **Ersätter:** bokstavsskalan A–E i bibeln §4 och §14

## Kontext

Första utkastet använde en femgradig bokstavsskala A–E. Två invändningar visade
sig hålla, och den andra är den allvarliga.

**E läses som godkänt i Sverige.** Skolbetygen är A–F där E är det lägsta
*godkända* betyget och F är underkänt. En svensk läser vårt E — avsett för
allvarliga brister — som "godkänt, nätt och jämnt". Fel signal på produktens
viktigaste punkt.

**Datan har tre nivåer, inte fem.** Sambruk/NSÖD-specens `assessment` är
0 = inga anmärkningar, 1 = mindre, 2 = allvarliga. Linköpings faktiska värden
faller i samma tre grader. De fem stegen skapades genom att väga in historik,
alltså genom att uppfinna precision källan inte innehåller. Varje steg bort
från myndighetens egen formulering är ett påstående vi själva måste försvara.

## Beslut

Tre nivåer i klarspråk, som speglar källan ett till ett:

| Nivå | Etikett | Källa |
|---|---|---|
| `clean` | Inga anmärkningar | assessment 0 |
| `minor` | Mindre brister | assessment 1 |
| `major` | Allvarliga brister | assessment 2 |
| `null` | Ingen kontroll / Ingen aktuell kontroll | saknas eller äldre än tre år |

Norge landade på tre ansikten av samma skäl. Danmark har fyra för att deras
egen kontrollskala har fyra utfall — inte för att fyra är bättre.

### Historiken ger en utmärkelse, inte ett betygssteg

Med tre nivåer hamnar ungefär två tredjedelar av beståndet på den bästa
(verifierat i Linköping: 66,8 %). För att ändå skilja de genomgående skötsamma
finns en separat utmärkelse när samtliga tre senaste kontroller är utan
anmärkning — samma idé som Danmarks Elite-Smiley och den morot bibeln §4
efterlyste.

Historiken påverkar därmed aldrig hur allvarligt något bedöms, bara om
verksamheten förtjänar ett erkännande. **Nuläget avgör bedömningen, historiken
avgör utmärkelsen.** Kontrollhistoriken visas dessutom alltid separat på sidan.

## Följder

- Bokstavschipet ur bibeln §14 utgår. Det kompakta märket bär i stället en
  symbol (✓ / ! / ✕ / –), vilket är språkoberoende och fungerar lika bra i
  kartnål, fönsterdekal och inbäddad badge.
- Formuleringarna är skrivna som självbärande meningar för att kunna citeras
  rakt av i AI-svar: "… fick inga anmärkningar vid den senaste hygienkontrollen."
- Juridiskt står vi närmare myndighetens egen slutsats, vilket är hela poängen.
- `MODEL_VERSION` höjd till 2. Publicerade bedömningar bär sin version.
