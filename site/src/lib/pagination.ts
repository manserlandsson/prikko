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
  const lastPage = Math.max(1, Math.ceil(all.length / perPage));
  const currentPage = Math.min(Math.max(1, n), lastPage);
  const from = (currentPage - 1) * perPage;
  return {
    items: all.slice(from, from + perPage),
    currentPage,
    lastPage,
    start: from + 1,
    total: all.length,
  };
}

/** Sidnummer 2..sista. Sida 1 hör till seriens rot och genereras inte här. */
export function tailPages(total: number, perPage = PER_PAGE): number[] {
  const last = Math.max(1, Math.ceil(total / perPage));
  return Array.from({ length: Math.max(0, last - 1) }, (_, i) => i + 2);
}

/** URL till en sida i en serie. Sida 1 = seriens rot, utan suffix. */
export function pageHref(base: string, n: number): string {
  return n <= 1 ? base : `${base}/sida/${n}`;
}

/**
 * Absolut URL till en sida, i exakt den form Base sätter canonical.
 *
 * Snedstrecket på slutet är inte kosmetik: canonical byggs ur
 * `Astro.url.pathname`, som med `build.format: 'directory'` alltid slutar med
 * ett. Skulle rel=prev/next peka på formen utan snedstreck vore det enligt
 * sökmotorerna en annan URL än den kanoniska, och hela seriens ordning
 * skulle läsas fel.
 */
export function pageUrl(base: string, n: number, origin: string): string {
  const path = pageHref(base, n);
  return new URL(path.endsWith('/') ? path : `${path}/`, origin).href;
}

/**
 * Sidnummer att visa i navigeringen, med utelämnanden.
 *
 * `null` betyder "hopp" och renderas som ett ellipstecken. Alltid första och
 * sista sidan, plus ett fönster runt den aktuella — samma mönster som
 * Googles egen resultatnavigering.
 */
export function pageNumbers(current: number, last: number, window = 2): Array<number | null> {
  if (last <= 1) return [1];

  const wanted = new Set<number>([1, last]);
  for (let n = current - window; n <= current + window; n++) {
    if (n >= 1 && n <= last) wanted.add(n);
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
