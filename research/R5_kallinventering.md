# Källinventering — svenska kommuners livsmedelskontroll

**Verifierat 2026-08-02** genom faktiska anrop, inte genom att läsa vad
kommunerna säger att de publicerar.

Huvudslutsats: **inget gemensamt format finns.** Sambruk/NSÖD-specen existerar
men följs inte av någon av de källor vi hittills mött. Varje kommun kräver en
egen adapter. Det är dyrt — och det är precis därför ingen byggt det här förut.

## Inlästa

| Kommun | Verksamheter | Åtkomst | Format | Koordinater | Kvarstår-etikett |
|---|---:|---|---|---|---|
| Linköping | 1 241 | Öppet API | JSON, egen modell | SWEREF 99 15 00 | Ja |
| Stockholm | 8 511 | E-tjänstens gränssnitt | JSON, egen modell | SWEREF 99 18 00 | **Nej** |
| Uppsala | 1 843 | E-tjänstens gränssnitt | **HTML** | **Saknas** | Ja |

Stockholms avsaknad av "kvarstår" är skälet till att bedömningsmodellen härleder
allvarsgraden ur mönstret i stället för ur etiketten (se `grading.py`).

## Kartlagd, ej inläst

### Örebro — 1 234 verksamheter, NÄSTA ATT BYGGA
```
GET /rest-api/foodreport/search          hela listan, utan parametrar
    → [{Registrerades, Objektsnamn, Typ, AnlaggningId, Adress}]
Resultat per verksamhet:
    https://www.orebro.se/foretag--naringsliv/driva-foretag/livsmedelsverksamhet
    /resultat-fran-livsmedelskontroller/resu…?facility=<AnlaggningId>
```
Listan är ren JSON och kräver inga parametrar. Kontrollresultaten renderas på
en separat sida per verksamhet, alltså ett anrop per objekt som i Linköping
och Uppsala. Adress finns; koordinater inte kontrollerade.

### Göteborg — 4 786 verksamheter, MEN INGA RESULTAT
```
GET https://catalog.goteborg.se/rowstore/dataset/3bf3fca5-617d-4687-ac8d-c3ab5b17a4b6
    → {namn, adress, postnummer, ort, typ, lat, lon, x/y_sweref991200}
```
Öppen data, uppdateras varje dygn, **och har färdiga WGS84-koordinater**. Men
datamängden innehåller **enbart registret** — inga kontrolldatum, inga
omdömen, inga avvikelser.

Att lägga in Göteborg nu vore 4 786 sidor där varenda en säger "ingen
bedömning": exakt den tunna massproduktion Google straffar och som vår egen
kvalitetsgrind finns för att stoppa. Bibelns §13 hade alltså rätt — Göteborgs
resultat kräver offentlighetsprincipen.

Datamängden är däremot värdefull senare: som ryggrad när resultaten kommit in,
och som koordinatkälla.

### Karlstad — pausad
Kommunens karta är avstängd under ett systembyte. Deras egen sida hänvisar
till telefon för att begära rapporter. Kontrolleras om längre fram.

### Malmö, Jönköping, Helsingborg — publicerar, format ej kartlagt
- **Jönköping** har en webbkarta med resultat för restauranger, butiker,
  skolor och äldreomsorg.
- **Malmö** publicerar godkänd/underkänd för en delmängd (kaféer, mindre
  restauranger, skolor).
- **Helsingborg** publicerar listor över verksamheter **utan** anmärkning —
  alltså motsatt urval, vilket gör att en frånvaro i listan inte säkert
  betyder brist. Kräver eftertanke innan publicering.

## Vad inventeringen säger om planen

Tre kommuner inlästa täcker ungefär 11 600 verksamheter. De återstående
webbpublicerande ger kanske 10 000 till. Därefter tar de lätta källorna slut
och resten av landets 290 kommuner kräver framställan enligt
offentlighetsprincipen.

Arbetet per kommun ligger på några timmar: hitta gränssnittet, räkna ut de
faktiska värdena, skriva adapter, verifiera. Det låter mycket, men det är
själva moaten — varje adapter är arbete en konkurrent också måste göra.
