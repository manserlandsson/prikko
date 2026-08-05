/**
 * Sidindelning.
 *
 * Kommunhubben renderade tidigare hela kommunen i ett dokument. Stockholm
 * blev 11 MB. Googlebot hämtar de första 15 MB av ett HTML-svar och slutar
 * läsa; på mobil är 11 MB tiotals sekunder innan något syns. Lösningen är
 * riktiga sidor med riktiga URL:er, inte oändlig scroll: Googlebot scrollar
 * inte, och innehåll bakom en scroll-händelse indexeras ofta inte alls.
 *
 * Sida 1 ligger på /stockholm, aldrig på /stockholm/sida/1. Två URL:er med
 * samma innehåll är dubblettinnehåll, och den kanoniska formen ska vara den
 * kortaste.
 */
import { path } from './urls';

/**
 * Rader per sida.
 *
 * En listrad väger ~300 byte nu när ansiktsmärket kommer ur en sprite i
 * stället för att inlinas per rad. 100 rader ger ~30 kB lista och en färdig
 * sida runt 60 kB — långt under 1 MB, och långt under de 100 kB där mobil
 * börjar kännas trög. Fler rader per sida är dessutom bättre för sökningen
 * än fler sidor: Stockholm blir 86 sidor i stället för 171, och en grund
 * serie crawlas hellre än en djup.
 */
export const PER_PAGE = 100;

/**
 * Minsta antal rader en sista sida får ha innan den slås ihop med den näst
 * sista.
 *
 * Utan den här regeln bestäms sista sidans innehåll av en rest. Uppsalas
 * skolor och omsorg landade på 501 verksamheter, alltså fem fulla sidor och en
 * sjätte med EN rad. Den sidan hade 382 tecken innehåll, egen titel, egen
 * canonical och en plats i sitemapen, och den är precis den tunna sida bibeln
 * §6 säger drar ner hela domänen: kvalitetsgrinden mäter verksamheter och
 * kategorier, men ingen mätte vad sidindelningen lämnade efter sig.
 *
 * Tio är valt för att det är den punkt där en sida slutar vara ett utsnitt och
 * blir en lista. Priset är att den näst sista sidan kan bära upp till 109
 * rader i stället för 100, vilket är omärkligt.
 */
export const MIN_LAST_PAGE = 10;

/**
 * Antal sidor i en serie, med den sista sidans svans inräknad i den näst
 * sista när svansen är för kort.
 *
 * `slicePage` och `tailPages` MÅSTE räkna likadant. Gör de inte det bygger
 * routen sidor som mallen inte tror finns, eller tvärtom.
 */
export function pageCount(total: number, perPage = PER_PAGE): number {
  const naive = Math.max(1, Math.ceil(total / perPage));
  if (naive < 2) return naive;
  const tail = total - (naive - 1) * perPage;
  return tail < MIN_LAST_PAGE ? naive - 1 : naive;
}

export interface PageSlice<T> {
  items: T[];
  currentPage: number;
  lastPage: number;
  /** Ordningsnummer för sidans första rad, 1-baserat. */
  start: number;
  /** Antal i hela serien. */
  total: number;
}

/**
 * Skär ut en sida ur en lista.
 *
 * Astro har en inbyggd `paginate()` i getStaticPaths, men den lägger sida 1
 * på seriens rotparameter och kan inte generera sida 1 från en route och
 * sida 2+ från en annan. Vi delar serien över två routefiler (/[kommun] och
 * /[kommun]/sida/[page]) just för att slippa /[kommun]/sida/1, och då måste
 * uträkningen vara densamma på båda ställena. Därför den här.
 */
export function slicePage<T>(all: T[], n: number, perPage = PER_PAGE): PageSlice<T> {
  const lastPage = pageCount(all.length, perPage);
  const currentPage = Math.min(Math.max(1, n), lastPage);
  const from = (currentPage - 1) * perPage;
  // Sista sidan tar allt som är kvar. Är svansen kortare än MIN_LAST_PAGE
  // finns ingen sida efter den här, och raderna måste hamna någonstans.
  const to = currentPage === lastPage ? all.length : from + perPage;
  return {
    items: all.slice(from, to),
    currentPage,
    lastPage,
    start: from + 1,
    total: all.length,
  };
}

/** Sidnummer 2..sista. Sida 1 hör till seriens rot och genereras inte här. */
export function tailPages(total: number, perPage = PER_PAGE): number[] {
  const last = pageCount(total, perPage);
  return Array.from({ length: Math.max(0, last - 1) }, (_, i) => i + 2);
}

/**
 * Sökväg till en sida i en serie. Sida 1 = seriens rot, utan suffix.
 *
 * Snedstrecket på slutet är inte kosmetik, och det är därför formen byggs i
 * lib/urls.ts och inte här: canonical byggs ur `Astro.url.pathname`, som med
 * `build.format: 'directory'` alltid slutar med ett. Den här funktionen
 * saknade tidigare snedstrecket medan `pageUrl` hade det, så sidnavigeringens
 * `<a href>` och sidans eget `rel=next` pekade på olika URL:er och serien gick
 * att läsa som två.
 */
export function pageHref(base: string, n: number): string {
  return n <= 1 ? path(base) : path(base, 'sida', n);
}

/** Absolut URL till en sida, i exakt den form Base sätter canonical. */
export function pageUrl(base: string, n: number, origin: string): string {
  return new URL(pageHref(base, n), origin).href;
}

/**
 * Var tionde sida får en egen ankarpunkt i långa serier.
 *
 * Stockholm har 86 sidor. Med bara ett fönster på plus minus två plus sista
 * sidan låg mitten av serien ungefär tjugo klick från hubben, och crawldjup
 * är den knappa resursen på en ny domän: sidor på djup 15 och neråt crawlas
 * sällan och indexeras ofta inte alls. Med ankarpunkter var tionde sida når
 * varje sida i serien på högst tre klick från hubben.
 *
 * Gränsen finns för att en serie på tolv sidor inte behöver hjälp. Under
 * tröskeln beter sig funktionen exakt som förut.
 */
const ANCHOR_EVERY = 10;
const ANCHOR_FROM = 20;

/**
 * Sidnummer att visa i navigeringen, med utelämnanden.
 *
 * `null` betyder "hopp" och renderas som ett ellipstecken. Alltid första och
 * sista sidan, plus ett fönster runt den aktuella, plus ankarpunkterna ovan i
 * långa serier.
 */
export function pageNumbers(current: number, last: number, window = 2): Array<number | null> {
  if (last <= 1) return [1];

  const wanted = new Set<number>([1, last]);
  for (let n = current - window; n <= current + window; n++) {
    if (n >= 1 && n <= last) wanted.add(n);
  }

  if (last >= ANCHOR_FROM) {
    for (let n = ANCHOR_EVERY; n < last; n += ANCHOR_EVERY) wanted.add(n);
  }

  const out: Array<number | null> = [];
  let previous = 0;
  for (const n of [...wanted].sort((a, b) => a - b)) {
    if (previous && n - previous > 1) out.push(null);
    out.push(n);
    previous = n;
  }
  return out;
}
