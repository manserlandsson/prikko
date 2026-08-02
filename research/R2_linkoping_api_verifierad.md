# Linköpings livsmedels-API — verifierad mot live-data

**Verifierat 2026-08-02** genom faktiska anrop mot
`https://livsmedelsdata.linkoping.se`. Alla siffror nedan är uträknade över
hela beståndet, inte uppskattade.

## Huvudfyndet: specen och verkligheten går isär

Linköping är den enda svenska kommunen med ett öppet livsmedels-API — och det
**följer inte Sambruk/NSÖD-specen**. Fälten är svenska, bedömningen är fritext
i stället för specens numeriska skala, och koordinaterna ligger i en lokal
SWEREF-zon i stället för i det GeoJSON-liknande format specen föreskriver.

| | Sambruk-specen | Linköping i verkligheten |
|---|---|---|
| Anläggning | `facility.name` | `objektsnamn` |
| Bedömning | `assessment` 0/1/2 | `helhetsbedomning av tillsynen`, fritext |
| Kontrollorsak | `type` 0/1/2 | `orsak`, fritext |
| Koppling till anläggning | **saknas i specen** | `anlaggningsId` på varje tillsyn |
| Koordinater | WGS84 | SWEREF 99 15 00 (lokal zon) |
| Kontrollpunkter | `inspectionPoints.passed/remark` | `kontrollomraden[]` med `nr`, `beskrivning`, `anmarkning` |

**Konsekvens för arkitekturen:** varje källa får en egen adapter som översätter
till Prikkos kanoniska modell. Antagandet att kommunerna följer en gemensam spec
håller inte, och pipelinen får aldrig byggas på det. Det gör också
täckningsarbetet dyrare än bibeln antog — varje ny kommun är en adapter, inte
en konfigurationsrad.

Positivt: kopplingen inspektion → anläggning, som **saknas helt i Sambruk-specen**
(se R1, fynd 2), finns här explicit som `anlaggningsId`. Den öppna frågan är
alltså löst för Linköping, men kvarstår för framtida Sambruk-källor.

## Endpoints

```
GET /api/v1/Anlaggningar                    1 241 objekt — men tillsyner är ALLTID tom
GET /api/v1/Anlaggningar/medsenastetillsyn  1 241 objekt med senaste kontrollen
GET /api/v1/Anlaggningar/{id}               en anläggning med FULL historik
GET /api/v1/Verksamheter                    verksamhetstyper att filtrera på
```

Full kontrollhistorik och kontrollområden finns **bara** per anläggning. Sveptet
görs därför mot `medsenastetillsyn` (ett anrop), och detaljhämtning sker
inkrementellt — 1 241 anrop för full historik, vilket kräver throttling och
cache men är fullt hanterbart i ett nattligt jobb.

## Faktiska värden i beståndet

`helhetsbedomning av tillsynen` (n = 1 241):

| Värde | Antal | Tolkning |
|---|---|---|
| Utan Avvikelse | 545 | inga anmärkningar |
| Åtgärdad | 284 | tidigare avvikelse avhjälpt |
| *saknas* | 258 | ingen kontroll utförd |
| Godtagbar | 75 | **osäker** — se nedan |
| Avvikelse | 72 | avvikelse konstaterad |
| Kvarstår | 4 | avvikelsen kvarstår vid uppföljning |
| Ej godtagbar | 3 | underkänd |

`orsak`: Planerad 653 · Uppföljande 304 · *saknas* 258 · Händelsestyrd 20 ·
Uppföljande tidigare avvikelse 6

Datumspann: **2021-02-08 → 2026-07-22.** Datan är alltså färsk — senaste
kontrollen är elva dagar gammal. Det är direkt relevant för AEO, där färskhet
är en dokumenterad citeringsfaktor.

Koordinater saknas för **noll** anläggningar.

### Öppen fråga: "Godtagbar"

Tolkas i adaptern som *mindre anmärkning*, eftersom kommunen har ett separat och
betydligt vanligare värde för helt rent resultat ("Utan Avvikelse") — ett eget
värde bör betyda något annat. Tolkningen avgör betyget för **75 anläggningar**
och bör bekräftas mot Linköpings egen dokumentation innan publicering. Adaptern
flaggar dessa som `uncertain=True` så de går att filtrera.

## Koordinater — verifierad transform

Linköping levererar `geoPositionNorr` / `geoPositionOst` i **SWEREF 99 15 00**,
inte i rikszonen SWEREF 99 TM.

Kontroll mot Platensgatan 6A (N 6477340.923, E 186265.704):

| Zon | Resultat | Rimligt |
|---|---|---|
| SWEREF 99 TM | 58.32450, 9.64024 | nej — Nordsjön |
| **SWEREF 99 15 00** | **58.41202, 15.62044** | ja — centrala Linköping |

Transformen är implementerad i `pipeline/prikko/geo.py` med Lantmäteriets
formler och utan tredjepartsberoende, så pipelinen kan köras i en tom
CI-container.

## Utfall när hela kedjan körs

1 241 anläggningar genom adapter → geo → betygsmodell. Noll okända värden, noll
förkastade koordinater.

| Betyg | Antal | Andel |
|---|---|---|
| A | 829 | 66,8 % |
| C | 107 | 8,6 % |
| E | 5 | 0,4 % |
| Inget betyg | 300 | 24,2 % |

B och D saknas i körningen eftersom `medsenastetillsyn` bara ger senaste
kontrollen — de stegen kräver historik, alltså detaljhämtningen.

De 300 utan betyg fördelar sig på 258 aldrig kontrollerade och 42 vars senaste
kontroll är äldre än tre år. **En fjärdedel av beståndet får alltså ingen
betygssatt sida.** Det är inte ett fel utan modellen som fungerar — men det
påverkar sidantalet direkt och bör räknas in i trafikmodellen.

## Kvarstår att utreda

- Bekräfta tolkningen av "Godtagbar" mot kommunen.
- Licens för datamängden (CC0 antaget, **ej verifierat**).
- Kodtabell för `kontrollomraden.nr` (B01 osv.) — behövs för breakdownen.
- Om `medsenastetillsyn` går att använda för inkrementell uppdatering, eller om
  hela beståndet måste svepas varje gång.
