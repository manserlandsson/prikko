/**
 * Senaste utgåvans innehavare, som data.
 *
 * ---------------------------------------------------------------------------
 * VARFÖR FILEN FINNS
 * ---------------------------------------------------------------------------
 * `functions/api/marke.ts` bygger dekaler och certifikat vid begäran, och den
 * måste kunna svara på två frågor som bara utgåvan känner till: står den här
 * verksamheten i listan, och vad heter den? Ett certifikat med ett namn på är
 * ett påstående, och ett påstående får aldrig byggas ur en frågesträng någon
 * skrivit själv.
 *
 * Funktionen bundlas av Cloudflare Pages för sig och kan inte importera
 * `lib/utmarkelser.ts`, som läser utgåvorna med Vites `import.meta.glob`.
 * Alltså hämtar den den här filen från sitt eget ursprung i stället. Det är
 * samma mönster som `/sok-index.json`: bygget skriver en fil, en konsument
 * läser den, och de kan inte glida isär eftersom det bara finns en.
 *
 * ---------------------------------------------------------------------------
 * VARFÖR ADRESSEN INTE BÄR ETT ÅRTAL
 * ---------------------------------------------------------------------------
 * Det hade varit naturligare att lägga den som
 * `/utmarkelser/2026/innehavare.json` bredvid märket. Den vägen går inte:
 * funktionen måste veta vilket årtal som är det senaste INNAN den kan bygga
 * adressen, och det är just det den frågar om. En adress utan årtal löser
 * hönan och ägget, och årtalet står i svaret.
 *
 * ---------------------------------------------------------------------------
 * VAD SOM INTE STÅR I FILEN
 * ---------------------------------------------------------------------------
 * Ingen bedömning, ingen kontrollhistorik och inga adresser. Filen är en lista
 * över vilka som får hämta ett certifikat, och ingenting annat. De 16 812
 * verksamheter som INTE står här ska inte gå att räkna fram ur den: den som
 * saknas i en lista över utmärkta har inte fått något påstående om sig, och
 * det är hela skälet till att hänvisningsmärket inte kräver ett uppslag här.
 * Se docs/48 avsnitt 5.
 *
 * Storleken är 20 358 byte för 254 rader, uppmätt i bygget, alltså en fil i ett
 * bygge som ligger på 18 050 av 100 000. Se docs/46_filtaket.md.
 */
import type { APIRoute } from 'astro';
import { formatDate } from '../../lib/data';
import { latestEdition, standings } from '../../lib/utmarkelser';

export const prerender = true;

interface Holder {
  /** Verksamhetens namn, som det står i utgåvan. */
  n: string;
  /** Kommunens namn i bestämd form: "Stockholms kommun". */
  k: string;
}

function build(): string {
  const edition = latestEdition();
  if (!edition) {
    throw new Error('Ingen utgåva finns. Kör scripts/utmarkelser.mjs.');
  }

  const holders: Record<string, Holder> = {};
  for (const m of standings(edition.year)) {
    for (const q of m.qualified) {
      holders[`${m.slug}/${q.slug}`] = { n: q.name, k: m.name };
    }
  }

  return JSON.stringify({
    year: edition.year,
    asOf: edition.asOf,
    /* Färdigformaterat, så att funktionen inte behöver en egen datumhjälpare. */
    asOfText: formatDate(edition.asOf),
    holders,
  });
}

const BODY = build();

export const GET: APIRoute = () =>
  new Response(BODY, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      /*
       * En timme. Adressen byter innehåll utan att byta namn, precis som
       * sökregistrets reservadress, och av samma skäl kan den inte cachas
       * länge. En ny utgåva ska synas samma dag, inte nästa år.
       */
      'Cache-Control': 'public, max-age=3600',
    },
  });
