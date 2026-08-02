# Verifierad datamodell — Sambruk/NSÖD livsmedelskontroller

**Verifierat 2026-08-02** mot primärkällan: `github.com/Sambruk/livsmedel`,
filen `assets/Livsmedelsinspektioner - Teknisk specifikation v2.xlsx` samt
JSON-exemplet i `_posts/2020-10-21-exempel-json.md`. Specen är framtagen av
NSÖD och ÖDIS och vidareutvecklar Sambruk/SKL:s original från 2016.

Det här är inte referat av bibeln — det är avläst ur specen.

## Toppnivå

```
lang            "sv"                    obligatoriskt
generator       "Ecos 2.0" / "Castor"   valbart — avslöjar vilket av de tre
                                        verksamhetssystemen kommunen kör
inspecOrg       { name, id, sweref99local }
facilities[]    anläggningar
inspections[]   inspektioner
```

`inspecOrg.id` är kommunkoden enligt SCB REGINA (Malmö = "1280"). Den blir vår
naturliga nyckel för kommun.

## facility

| Fält | Krav | Not |
|---|---|---|
| `idNational` | obligatoriskt | `"F-1280-14"` = F + kommunkod + idLocal. **Vår primärnyckel.** |
| `idLocal` | obligatoriskt | id i kommunens system |
| `name` | obligatoriskt | |
| `organizationNumber` | rekommenderat | Se varning nedan |
| `type[]` | 1–4 nivåer | Livsmedelsverkets rapportanvisning |
| `expClass` | rekommenderat | A, B eller C (erfarenhetsklass) |
| `riskClass` | valbart | "Riskklass 1"–"Riskklass 8", annars "övrig" |
| `inspecTime` | valbart | tilldelad kontrolltid i timmar |
| `active` | valbart | **0 = inaktiv, 1 = väntande, 2 = aktiv** |
| `address.*` | rekommenderat | streetAddress, postalCode, locality, region, country |
| `location.wgs84.coordinates` | obligatoriskt | Se fallgrop nedan |
| `created` / `modified` | valbart | ISO 8601 |

## inspection

| Fält | Krav | Not |
|---|---|---|
| `idNational` | obligatoriskt | `"I-1280-1"` = I + kommunkod + idLocal |
| `date` | obligatoriskt | ISO 8601, kontrolldatum |
| `type` | obligatoriskt | **0 = rutin, 1 = uppföljning, 2 = händelse** |
| `assessment` | obligatoriskt | **0 = inga anmärkningar, 1 = mindre anmärkning(ar), 2 = allvarliga anmärkning(ar)** |
| `prenotified` | obligatoriskt | om verksamheten var föranmäld |
| `inspectionPoints.passed[]` | villkorat | koder, t.ex. "A01", "J02" |
| `inspectionPoints.remark[]` | villkorat | koder som fick anmärkning |
| `ownerComment` | valbart | verksamhetens replikrätt |
| `modified` | valbart | |

## Tre fynd som ändrar bygget

### 1. `assessment` är guldet — inte kontrollpunkterna

Bibeln (§4) föreslog Norges "sämsta kontrollpunkten avgör" som modell. Men
`inspectionPoints` är bara **villkorat obligatoriskt** ("om de publiceras"),
medan `assessment` är **ovillkorligt obligatoriskt** och redan är inspektörens
egen sammanvägda bedömning i tre steg.

Att bygga betyget på `assessment` ger därför både bättre täckning och en
starkare juridisk position: vi återger myndighetens egen slutsats i stället för
att göra en egen tolkning av enskilda punktkoder. Kontrollpunkterna används till
Yuka-breakdownen ("Brister / Godkänt"), inte till betygssättningen.

### 2. Specen saknar koppling mellan inspektion och anläggning

`inspections[]` har `idLocal` och `idNational` — men **inget fält som pekar på
vilken facility inspektionen gäller**. `idNational` för inspektionen ("I-1280-1")
kodar bara kommunkod och inspektionens eget löpnummer.

I exemplet finns exakt en anläggning och en inspektion, så strukturen är
tvetydig. Antingen nästlar kommunerna i praktiken `inspections` inuti varje
facility-objekt, eller så finns ett odokumenterat fält.

**Detta måste avgöras mot en riktig fil innan pipelinen skrivs.** Det är den
enskilt viktigaste öppna frågan i datamodellen — utan koppling finns ingen
produkt. Status: **EJ VERIFIERAT**.

### 3. `organizationNumber` duger inte som join-nyckel

Specen säger uttryckligen: för enskild firma *är* organisationsnumret ägarens
personnummer, och de fyra sista siffrorna **bör maskeras** med hänsyn till GDPR
("921115XXXX").

Två följder:
- Bibelns plan (§3) att bygga ryggraden genom att joina SCB/Bolagsverket på
  org.nr fungerar inte för just de småföretag som oftast är enskild firma.
  Matchning måste ske på namn + adress + koordinat, med org.nr som förstärkning
  när det är komplett.
- Det bekräftar den juridiska analysen: vi hanterar personuppgifter i skala.
  Utgivningsbeviset är alltså inte en formalitet utan förutsättningen.

## Fallgropar att koda runt

**Koordinatordningen.** Specen kallar fältet GeoJSON men föreskriver
`"latituden och longituden tillsammans"` — exempel `[55.606160, 13.000366]`.
GeoJSON-standarden är motsatt ordning (longitud först). Matas värdet rakt in i
ett kartbibliotek som följer standarden hamnar varje svensk restaurang utanför
Somalias kust. Pipelinen ska normalisera till explicita `lat`/`lng`-kolumner och
aldrig skicka runt en tvetydig array.

**Dricksvattenanläggningar får inte publiceras.** Specen undantar uttryckligen
vattenverk och annat som bedöms vara känslig information. Filtreras bort vid
inläsning.

**Inspektioner sprids över en treårscykel.** Alla kontrollpunkter granskas inte
vid varje besök. Frånvaro av en punkt betyder inte godkänt — det betyder
okontrollerat. Får aldrig renderas som godkänt.

**`active`.** Endast `2` (aktiv) publiceras. Väntande anläggningar saknar
kontroll och inaktiva är nedlagda.

## Öppet, ej verifierat

- Kopplingen inspektion → anläggning (se ovan). Kräver en riktig fil.
- Vilka kommuner som faktiskt publicerar enligt specen idag, och under vilken
  licens. Bibeln §13 påstår att endast Linköping har öppet API — obekräftat här.
- Kodtabellen för `inspectionPoints` (Livsmedelsverkets rapporteringspunkter).
  Behövs för breakdownen, inte för betyget.
