/**
 * Jämförelseregistret: talen två verksamheter ställs bredvid varandra med.
 *
 * ## Varför en fil per kommun, och inte en sida per par
 *
 * 15 916 verksamheter ger 126 miljoner par. Även det snävaste urvalet, varje
 * verksamhet mot sin närmaste granne, blir tiotusen sidor. Cloudflare Pages
 * tar 20 000 filer och bygget ligger redan på 16 517, så en sida per par är
 * inte ett designval utan en omöjlighet. Jämförelsen är därför EN sida som
 * hämtar sina tal, precis som /sok gör.
 *
 * ## Varför en fil per kommun och inte en enda
 *
 * Inte för att spara plats, utan för att kommungränsen är en regel och inte
 * en indelning. Två verksamheter i olika kommuner får inte ställas bredvid
 * varandra som om talen betydde samma sak: andelen med kvarstående brister
 * ligger på 0,3 procent i Jönköping och 23,7 i Oskarshamn, och den skillnaden
 * speglar hur kommunen publicerar, inte hur rent det är i köken. Inom en
 * kommun är jämförelsen ren.
 *
 * Regeln är byggd in i formen i stället för skriven som en varningstext.
 * Adressen bär EN kommun (`?k=`), registret ligger i en fil per kommun, och
 * väljaren för det andra stället söker bara i den kommun det första ligger i.
 * En jämförelse över kommungränsen går alltså inte att uttrycka, varken i
 * gränssnittet eller i URL:en. Sajten har en stående regel mot förklarande
 * brödtext, och det här är vad den regeln kräver: att formen bär förbehållet.
 *
 * ## Vad som INTE ligger här
 *
 * Namn, adress och bedömningsnivå. De finns redan i sökregistret, som varje
 * sida i huset laddar, och som därmed är hämtat och cachat innan besökaren
 * ens når hit. Se lib/search-index.ts. Att skicka dem en gång till hade varit
 * ett halvt megabyte för ingenting.
 */
import { createHash } from 'node:crypto';
import {
  categoriesOf,
  categoryListing,
  establishments,
  isRemark,
  latestInspectionDate,
  municipalities,
  municipalityListing,
  statistics,
  type Establishment,
} from './data';

/**
 * Hur många kontroller historikremsan bär.
 *
 * Sex är valt mot modellen och inte mot utrymmet: HISTORY_DEPTH är tre, och
 * en remsa som visar dubbelt så långt tillbaka som modellen väger in räcker
 * för att se om en verksamhet är på väg åt något håll. Fler kontroller gör
 * filen tyngre utan att svara på en ny fråga.
 */
export const HISTORY_SHOWN = 6;

/** En rad i registret. Arrayer, inte objekt: nyckelnamnen kostar mer än datan. */
type Row = [
  /** Antal kontroller. */
  number,
  /** Antal utan anmärkning. */
  number,
  /** Antal återbesök. */
  number,
  /** Ren historik, 0 eller 1. */
  number,
  /** Senaste kontrollens datum, eller tom sträng. */
  string,
  /** Äldsta kontrollens år, eller tom sträng. */
  string,
  /** Avvikelser vid senaste kontrollen. */
  number,
  /** [datum, bedömning] för de senaste kontrollerna, nyast först. */
  Array<[string, number]>,
];

function row(e: Establishment): Row {
  const stats = statistics(e);
  return [
    stats.total,
    stats.clean,
    stats.followUps,
    e.distinction ? 1 : 0,
    latestInspectionDate(e) ?? '',
    stats.oldestYear ?? '',
    e.inspections[0]?.areas.filter(isRemark).length ?? 0,
    e.inspections
      .slice(0, HISTORY_SHOWN)
      .map((i) => [i.date, i.assessment] as [string, number]),
  ];
}

/**
 * Registret för en kommun, som JSON-sträng.
 *
 * Bara verksamheter med en bedömning kommer med. En verksamhet utan
 * kontroller har ingenting att jämföra med, och en jämförelse där ena sidan
 * är tom läser som ett underbetyg i stället för som en lucka i underlaget.
 * Kvalitetsgrinden i data.ts drar samma gräns för vad som får indexeras.
 */
function build(slug: string): { body: string; count: number } {
  const rows: Record<string, Row> = {};
  let count = 0;
  for (const e of establishments(slug)) {
    if (e.verdict === null || e.inspections.length === 0) continue;
    rows[e.slug] = row(e);
    count += 1;
  }
  return { body: JSON.stringify(rows), count };
}

export interface JamforShard {
  slug: string;
  body: string;
  hash: string;
  /** Filnamnet rutten skriver, utan katalog. */
  file: string;
  url: string;
  count: number;
}

/**
 * Ett skärv per kommun, byggt en gång per byggprocess.
 *
 * Hashen räknas på exakt den byte-sekvens som skickas ut, samma grepp som
 * sökregistret: så länge datan är oförändrad är adressen oförändrad och en
 * kopia i cachen är per definition rätt. Filen kan då cachas för alltid, och
 * en rättelse syns vid nästa sidladdning i stället för nästa timme.
 */
function shards(): JamforShard[] {
  return municipalities().map((m) => {
    const { body, count } = build(m.slug);
    const hash = createHash('sha256').update(body).digest('hex').slice(0, 12);
    const file = `${m.slug}-${hash}`;
    return { slug: m.slug, body, hash, file, url: `/jamfor-index/${file}.json`, count };
  });
}

export const JAMFOR_SHARDS = shards();

/** slug till adress. Sidan skickar hela tabellen till klienten. */
export const JAMFOR_URLS: Record<string, string> = Object.fromEntries(
  JAMFOR_SHARDS.map((s) => [s.slug, s.url]),
);

export function jamforShard(file: string): JamforShard | undefined {
  return JAMFOR_SHARDS.find((s) => s.file === file);
}

/** Ett år, oföränderligt. Adressen är innehållet, se lib/search-index.ts. */
export const JAMFOR_CACHE_CONTROL = 'public, max-age=31536000, immutable';

/**
 * Kommuner där en jämförelse alls är möjlig.
 *
 * Två bedömda verksamheter krävs, annars finns inget att ställa mot något.
 * Villkoret upprepas i webbkarta.ts och måste hållas i takt med det.
 */
export function comparableMunicipalities() {
  const comparable = new Set(JAMFOR_SHARDS.filter((s) => s.count >= 2).map((s) => s.slug));
  return municipalities().filter((m) => comparable.has(m.slug));
}

/**
 * Adressen till en färdig jämförelse.
 *
 * En kommun, två slugar. Frågesträngen hör inte hemma i path(), se lib/urls.ts,
 * men den byggs på ETT ställe så att sidan, verksamhetssidan och sökningen inte
 * kan skriva den olika.
 */
export function compareHref(kommun: string, a: string, b?: string): string {
  const params = new URLSearchParams({ k: kommun, a });
  if (b) params.set('b', b);
  return `/jamfor/?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Introduktionen
// ---------------------------------------------------------------------------

/**
 * Sista dagen jämförelsen presenteras som ny.
 *
 * ## Varför den har ett slutdatum och inte en knapp
 *
 * En "Nytt"-etikett som står kvar i ett år är en lögn, och den lögnen kostar
 * mer än notisen är värd: en besökare som sett samma nyhet i nio månader
 * slutar tro på nästa. Notisen dör därför av sig själv. Datat byggs om varje
 * natt, så dagen efter det här datumet är den borta ur varje sida utan att
 * någon behöver komma ihåg något.
 *
 * Ett kryss per besökare vore det uppenbara alternativet och är uteslutet:
 * det kräver att valet sparas i webbläsaren, och /cookies räknar upp exakt
 * två nycklar och påstår att listan är uttömmande. En tredje nyckel för en
 * notis vore att göra det påståendet falskt för att slippa en rad text.
 *
 * ## Att ta bort den helt
 *
 * Sätt konstanten till null. Då renderar JamforNyhet.astro ingenting och
 * knappen står kvar ensam, precis som den gjorde innan. Komponenten och den
 * här konstanten kan sedan tas bort när som helst utan att röra något annat.
 */
export const JAMFOR_NYHET_TILL: string | null = '2026-11-07';

/**
 * Ska jämförelsen presenteras som ny vid det här bygget?
 *
 * Klockan skickas in i stället för att läsas internt, av samma skäl som i
 * pipeline/prikko/grading.py: det som styr vad en sida visar ska gå att testa
 * utan att flytta systemtiden.
 */
export function showCompareNews(today: Date = new Date()): boolean {
  if (!JAMFOR_NYHET_TILL) return false;
  return today.toISOString().slice(0, 10) <= JAMFOR_NYHET_TILL;
}

/**
 * Svaret för det HÄR bygget, räknat en gång.
 *
 * Verksamhetssidan finns i 15 916 exemplar och dess frontmatter körs en gång
 * per sida. Ett `new Date()` per sida hade gett samma svar 15 916 gånger, och
 * dessutom kunnat ge OLIKA svar inom ett och samma bygge om det pågick över
 * midnatt natten notisen slocknar. En modulnivåkonstant kan inte glida.
 */
export const JAMFOR_NYHET_SYNS = showCompareNews();

/**
 * Kan de här två alls jämföras?
 *
 * Bara verksamheter med en bedömning och minst en kontroll ligger i registret,
 * så en jämförelse mot något annat hade fått en tom spalt. En tom spalt läser
 * som ett underbetyg och inte som en lucka i underlaget.
 */
function comparable(e: Establishment): boolean {
  return e.verdict !== null && e.inspections.length > 0;
}

/**
 * Vad sidan föreslår att man jämför med.
 *
 * Ett tomt sökfält är en fråga tillbaka till besökaren. Den som står på ett
 * ställe och undrar hur det står sig undrar det mot något i närheten, oftast
 * av samma sort, och det vet sidan redan: grannarna är uträknade för
 * sidopanelen och kategorin står i rubrikraden.
 *
 * Ordningen är därför närmaste granne i SAMMA kategori först, sedan närmaste
 * granne oavsett kategori, och först därefter kommunens egen lista. Sista
 * steget finns för de 968 verksamheter vars kommun inte lämnar koordinater:
 * utan det hade förslagen varit tomma i Borgholm, Höganäs, Lomma och
 * Svenljunga, alltså exakt i de kommuner där sökfältet är minst till hjälp.
 *
 * `neighbours` skickas in i stället för att räknas här. Sidmallen har redan
 * anropat nearby() för sin panel, och ett andra svep över Stockholms 8 499
 * kandidater per sida hade kostat mer än hela resten av funktionen.
 */
export function compareSuggestions(
  e: Establishment,
  neighbours: readonly Establishment[],
  limit = 6,
): Establishment[] {
  const own = new Set(categoriesOf(e).categories);
  const seen = new Set<string>([e.slug]);
  const found: Establishment[] = [];

  const add = (candidate: Establishment) => {
    if (found.length >= limit) return;
    if (seen.has(candidate.slug) || !comparable(candidate)) return;
    seen.add(candidate.slug);
    found.push(candidate);
  };

  const sameCategory = (candidate: Establishment) =>
    own.size > 0 && categoriesOf(candidate).categories.some((id) => own.has(id));

  for (const candidate of neighbours) if (sameCategory(candidate)) add(candidate);
  for (const candidate of neighbours) add(candidate);

  if (found.length < limit) {
    for (const id of own) {
      for (const candidate of categoryListing(e.municipality.slug, id)) add(candidate);
    }
  }

  if (found.length < limit) {
    for (const candidate of municipalityListing(e.municipality.slug)) add(candidate);
  }

  return found;
}
