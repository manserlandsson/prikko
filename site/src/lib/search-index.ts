/**
 * Sökregistrets innehåll och dess innehållsbaserade adress.
 *
 * Registret serverades tidigare från /sok-index.json med max-age=3600. Det gav
 * ett fel som en besökare faktiskt drabbades av: pipelinen körde på natten och
 * la in en ny kommun, men en webbläsare med en timme gammal kopia sökte vidare
 * i det gamla registret och hittade inte verksamheten. Filen såg färsk ut, den
 * var det inte.
 *
 * Ett innehållsbaserat namn löser båda halvorna av problemet på en gång. Så
 * länge datan är oförändrad är adressen oförändrad och kopian i cachen är per
 * definition rätt. Ändras datan ändras adressen, och webbläsaren har ingen
 * kopia att återanvända. Filen kan därmed cachas för alltid i stället för i en
 * timme, och en rättelse syns vid nästa sidladdning i stället för nästa timme.
 *
 * Hashen räknas på exakt den byte-sekvens som skickas ut, inte på datan
 * bakom. Två byggen av samma data ger samma sträng, samma adress och därmed
 * samma cacheträff.
 *
 * Modulen importeras av tre ställen: rutten som skriver filen och de två
 * konsumenterna (sökfältet i sidhuvudet och /sok). Alla tre läser samma
 * `SEARCH_INDEX_URL`, så en ny hash kan inte hamna på ett ställe men inte på
 * de andra.
 */
import { createHash } from 'node:crypto';
import { establishments, municipalities } from './data';
import { utsnitt } from './kartrutor';

/** Ordningen speglar VERDICTS. -1 = ingen bedömning. */
const VERDICTS = ['clean', 'minor', 'major'];

/**
 * Registret som en enda JSON-sträng.
 *
 * Formatet är arrayer, inte objekt. Med 14 500 poster kostar nyckelnamnen i
 * ett objektformat mer än datan de beskriver.
 *
 * Den normaliserade söksträngen skickas INTE med. Den var en kopia av namn,
 * adress och ort i gemener och stod för ungefär halva filen. Klienten bygger
 * den själv en gång när registret laddats.
 *
 * Byggs en gång per byggprocess. Modulen importeras av sidhuvudet, som ligger
 * på 14 711 sidor, och att serialisera om registret per sida vore orimligt.
 */
function build(): string {
  const kommuner = municipalities();
  const kommunIndex = new Map(kommuner.map((m, i) => [m.slug, i]));
  const verdictIndex = new Map(VERDICTS.map((v, i) => [v, i]));

  const rows = establishments().map((e) => [
    e.name,
    e.address ?? '',
    e.slug,
    kommunIndex.get(e.municipality.slug) ?? 0,
    e.verdict ? (verdictIndex.get(e.verdict) ?? -1) : -1,
  ]);

  return JSON.stringify({
    /*
     * Slug, ort och en etta för de kommuner som har en kartsida.
     *
     * Trean finns för att ägaren bad om det: "söker man på en kommun tex i sök
     * ska man komma till split screen på karta och lista". Kommunraden i
     * panelen pekar därför på `/<kommun>/karta/` när den finns, och på hubben
     * för de fyra som inte lämnar en enda koordinat. Villkoret är samma anrop
     * som kartsidans getStaticPaths gör, alltså inte en andra bedömning av
     * samma sak.
     *
     * En etta och inte ett booleskt värde: `true` är fyra tecken per rad i
     * JSON och `1` är ett, och registret ligger på varje sidvisning.
     */
    k: kommuner.map((m) =>
      utsnitt(m.slug) ? [m.slug, m.city, 1] : [m.slug, m.city],
    ),
    v: VERDICTS,
    e: rows,
  });
}

export const SEARCH_INDEX_BODY = build();

/**
 * 12 hexadecimala tecken ur SHA-256. Kortare än så och slumpen börjar spela
 * roll, längre och det är bara brus i URL:en. Filnamn, inte kryptografi.
 */
export const SEARCH_INDEX_HASH = createHash('sha256')
  .update(SEARCH_INDEX_BODY)
  .digest('hex')
  .slice(0, 12);

/** Adressen konsumenterna ska hämta. Byts i samma stund datan byts. */
export const SEARCH_INDEX_URL = `/sok-index/${SEARCH_INDEX_HASH}.json`;

/**
 * Den gamla adressen, som ligger kvar avsiktligt.
 *
 * Ett dokument i besökarens cache kan peka på en hash som inte längre finns
 * på servern. Utan reserv blir sökningen då helt död i stället för bara
 * inaktuell, alltså ett värre fel än det vi rättar. Konsumenterna faller
 * tillbaka hit när den hashade hämtningen misslyckas. Den här filen får
 * däremot INTE cachas länge, eftersom den är just den föränderliga adress vi
 * gick ifrån.
 */
export const SEARCH_INDEX_FALLBACK_URL = '/sok-index.json';

/**
 * Ett år, oföränderligt. Rimligt först nu: adressen är innehållet, så en fil
 * på den här adressen kan aldrig bli inaktuell.
 */
export const SEARCH_INDEX_CACHE_CONTROL = 'public, max-age=31536000, immutable';

/**
 * Reservens cachetid. Fem minuter räcker för att fånga en handfull hämtningar
 * från samma trasiga sidladdning utan att någon fastnar i gammal data.
 */
export const SEARCH_INDEX_FALLBACK_CACHE_CONTROL = 'public, max-age=300';
