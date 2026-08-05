/**
 * Sajtens egna sidor, kartor och artiklar, som förslagsrader.
 *
 * Listan låg tidigare i kommandopalettens frontmatter och var därmed bara
 * nåbar för den som tryckte cmd+K. Panelerna är numera en enda, och samma
 * rader ska nås både ur sökfältet och ur /sok — alltså kan listan inte bo i
 * en komponent längre.
 *
 * Modulen är SERVERSIDA. Den läser innehållssamlingen och kartdatan och
 * skickas till webbläsaren som JSON i sidans HTML, aldrig som en hämtning:
 * det är ett trettiotal rader, och en panel som ska vara ifylld i samma
 * ögonblick som fältet fokuseras kan inte vänta på nätverket. Rankningen mot
 * en fråga sker i lib/sokforslag, som är den enda modul som rankar något.
 *
 * Resultatet räknas EN gång per byggprocess. Sökfältet ligger i sidhuvudet
 * på 14 711 sidor, och att gå igenom tolv kartdataset och hela
 * artikelsamlingen per sida vore orimligt. Samma skäl och samma mönster som
 * lib/search-index.
 */
import { getCollection } from 'astro:content';
import { sectionReady } from './artiklar';
import { formatNumber, municipalities } from './data';
import { mapDataset } from './map-data';
import type { Suggestion } from './sokforslag';
import { path } from './urls';

export interface CommandSection {
  name: string;
  items: Suggestion[];
}

/**
 * Sidorna. Handskriven lista, inte en genomsökning av pages/: kontosidorna,
 * cookiesidan och villkoren är nåbara via sidfoten och hör inte hemma i en
 * lista som ska föreslå nästa steg, inte rabbla sajtkartan.
 */
const PAGES: Suggestion[] = [
  { label: 'Sök', meta: 'Alla verksamheter och kommuner', href: path('sok'), kind: 'page', kw: 'hitta' },
  { label: 'Metodik', meta: 'Så räknas bedömningen fram', href: path('metodik'), kind: 'page', kw: 'metod bedömning betyg modell' },
  { label: 'Källor', meta: 'Varifrån uppgifterna kommer', href: path('kallor'), kind: 'page', kw: 'data öppna data' },
  { label: 'Rapporter', meta: 'Räknat ur hela beståndet', href: path('rapporter'), kind: 'page', kw: 'statistik siffror' },
  { label: 'Utmärkelser', meta: 'Ställen som klarat kontrollerna över tid', href: path('utmarkelser'), kind: 'page', kw: 'utmärkelse' },
  { label: 'Om Prikko', meta: 'Vad sajten är och vem som gör den', href: path('om'), kind: 'page', kw: 'om oss kontakt' },
  { label: 'Rätta en uppgift', meta: 'Anmäl något som står fel', href: path('ratta'), kind: 'page', kw: 'fel rättelse felanmälan' },
];

let cache: CommandSection[] | null = null;

/**
 * Grupperna i den ordning de visas i tomt läge: sidorna, kartorna,
 * artiklarna. Tomma grupper faller bort — fyra av tolv kommuner saknar
 * koordinater och har ingen kartsida, och en rad som leder till 404 är värre
 * än ingen rad alls.
 */
export async function siteCommands(): Promise<CommandSection[]> {
  if (cache) return cache;

  const maps: Suggestion[] = municipalities()
    .map((m) => ({ m, data: mapDataset(m.slug) }))
    .filter((x) => x.data !== undefined)
    /* Störst först, inte i bokstavsordning. Åtta kommuner har karta och
       listan visar bara några åt gången: i bokstavsordning slutade "karta"
       på Jönköping, Karlstad och Kristinehamn, medan Stockholm med sina
       8 511 nålar aldrig kom med. Samma räkning som styr populära
       sökningar, och av samma skäl. */
    .sort((a, b) => b.data!.count - a.data!.count || a.m.city.localeCompare(b.m.city, 'sv'))
    .map(({ m, data }) => ({
      label: `Karta över ${m.city}`,
      meta: `${formatNumber(data!.count)} ställen med nål`,
      href: path(m.slug, 'karta'),
      kind: 'map' as const,
      kw: `kartor ${m.city}`,
    }));

  /* Artiklarna bakom samma kvalitetsgrind som sektionen själv. Under
     MIN_ARTICLES är sektionen noindexad och under granskning, och då ska
     sökningen inte skylta med den heller. */
  const articles: Suggestion[] = sectionReady()
    ? [
        { label: 'Artiklar', meta: 'Guider och förklaringar', href: path('artiklar'), kind: 'page' as const, kw: 'guide' },
        ...(await getCollection('artiklar'))
          .filter((a) => !a.data.draft)
          .sort((a, b) => b.data.published.localeCompare(a.data.published))
          .map((a) => ({
            label: a.data.title,
            meta: a.data.category,
            href: path('artiklar', a.id),
            kind: 'article' as const,
            kw: a.data.category,
          })),
      ]
    : [];

  cache = [
    { name: 'Sidor', items: PAGES },
    { name: 'Kartor', items: maps },
    { name: 'Artiklar', items: articles },
  ].filter((g) => g.items.length > 0);

  return cache;
}

/** Alla rader i en följd, för rankningen mot en fråga. */
export async function siteCommandList(): Promise<Suggestion[]> {
  return (await siteCommands()).flatMap((g) => g.items);
}
