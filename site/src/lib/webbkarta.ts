/**
 * Sajtens innehållsförteckning, i EN källa.
 *
 * Två filer läser den här modulen och de får aldrig komma fram till olika
 * svar:
 *
 *   astro.config.mjs   filtrerar XML-sitemapen med `noindexPaths()`.
 *   pages/webbkarta    renderar `siteMap()` som en läsbar sida.
 *
 * `noindexPaths()` bodde tidigare i astro.config.mjs. Den flyttade hit när
 * webbkartan tillkom, av samma skäl som den en gång slutade vara en handskriven
 * lista: två ställen som beskriver vilka sidor som ska indexeras kommer att
 * glida isär, och när de gör det märks det inte förrän i Search Console.
 *
 * Skillnaden mellan de två utfallen är avsiktlig och bara en:
 *
 *   XML-sitemapen räknar upp VARJE indexerbar URL, 16 000 stycken. Den läses
 *   av maskiner som orkar.
 *
 *   Webbkartan räknar upp INGÅNGARNA och länkar vidare. Sexton tusen länkar i
 *   ett dokument är varken läsbart för en människa eller nyttigt för en
 *   sökmotor: länkvärdet späds ut, dokumentet väger megabyte, och sidan blir
 *   precis den länkvägg bibeln §6 varnar för. Varje verksamhet nås i stället i
 *   två klick, via kommunen och dess register.
 *
 * Att de ändå inte kan säga emot varandra garanteras inte av den här filen
 * utan av `sitemapGuard` i astro.config.mjs, som efter bygget läser den
 * FÄRDIGA webbkartan och kräver att varje länk i den finns i XML-sitemapen.
 * Filen påstår, grinden mäter.
 */
import {
  establishments,
  isIndexable,
  municipalities,
  municipalityCategories,
  municipalityRemarks,
  type Municipality,
} from './data';
import { articleFiles, sectionReady } from './artiklar';
import { mapDataset } from './map-data';
import { hasMatsnuskPage } from './matsnusk';
import { linkedAreas } from './omraden';
import { hasMovementPage, hasNationalPage, movement } from './rorelse';
import { REPORTS } from './rapporter';
import { barRange, editions, numeral, standings } from './utmarkelser';
import { path } from './urls';

// ---------------------------------------------------------------------------
// Kvalitetsgrinden: vilka sökvägar som aldrig får bjudas ut till index
// ---------------------------------------------------------------------------

/**
 * Kontosidorna har inget innehåll att indexera: HTML-filen är ett tomt
 * formulär som fylls i webbläsaren av den som är inloggad. En inloggningssida
 * i sökresultatet är tunt innehåll i bibelns mening, och kvalitetsgrinden
 * gäller våra egna sidor lika mycket som datans.
 *
 * /sluta-bevaka hör till samma sort trots att den ligger utanför /konto. Den
 * nås bara från en länk i ett notismejl, den bär en engångsnyckel i adressen,
 * och en avregistreringssida i ett sökresultat är meningslös för alla utom
 * den som just fått mejlet.
 */
const ACCOUNT_PAGES = [
  'konto',
  'konto/granska',
  'konto/inloggad',
  'konto/notiser',
  'konto/verksamhet',
  'sluta-bevaka',
];

/**
 * Sökvägar som bär `noindex` och därför varken får ligga i sitemapen eller
 * länkas från webbkartan.
 *
 * En sitemap är ett påstående om vilka sidor som ska indexeras. Att be Google
 * indexera sidor som samtidigt säger noindex är en direkt motsägelse: Search
 * Console rapporterar "Skickad URL markerad som noindex", de riktiga felen
 * dränks, och Google lär sig att sitemapen inte är tillförlitlig. På en ny
 * domän är den signalen dyr.
 *
 * Listan räknas INTE upp för hand. Den härleds ur exakt samma predikat som
 * sidmallen använder, `isIndexable()` i data.ts, så kvalitetsgrinden och
 * sitemapen inte kan glida isär när kravet ändras.
 *
 * Undantaget är /ratta, som sätter `noindex` i sin egen mall av juridiska skäl
 * och inte ur någon datamängd.
 */
export function noindexPaths(): Set<string> {
  const paths = new Set<string>();

  for (const e of establishments()) {
    if (!isIndexable(e)) paths.add(path(e.municipality.slug, e.slug));
  }

  paths.add(path('ratta'));
  for (const page of ACCOUNT_PAGES) paths.add(path(page));

  /*
   * Jämförelsesidan. Sidor byggs för SEO, aldrig för funktioner (ägaren,
   * 2026-08-07), och den här sidan har ingenting att ranka på: den bär inget
   * eget innehåll och svarar inte på någon sökning. Jämförelsen sker i rutan
   * på verksamhetssidan, som är sidan som faktiskt rankar. /jamfor/ finns
   * kvar enbart för att en delad länk måste leda någonstans.
   *
   * Raden här gör två saker på en gång: håller sidan ur XML-sitemapen och
   * lyfter bort den ur webbkartan, eftersom siteMap() filtrerar mot den här
   * mängden. Utan den hade byggrinden fällt bygget på att webbkartan länkar
   * en sida som säger noindex.
   */
  paths.add(path('jamfor'));

  // Artikelsektionens kvalitetsgrind: under MIN_ARTICLES publicerade artiklar
  // bär hela sektionen noindex (satt i sidmallarna via samma funktion) och ska
  // då varken ligga i sitemapen eller stå i webbkartan.
  if (!sectionReady()) {
    paths.add(path('artiklar'));
    for (const a of articleFiles()) paths.add(path('artiklar', a.slug));
  }

  return paths;
}

// ---------------------------------------------------------------------------
// Den läsbara innehållsförteckningen
// ---------------------------------------------------------------------------

export interface MapLink {
  href: string;
  label: string;
  /** Antalet sidan leder till, när det finns ett. Aldrig påhittat. */
  count?: number;
}

export interface MapGroup {
  /** Gruppens egen ingång, till exempel kommunhubben. */
  heading: MapLink;
  links: MapLink[];
}

export interface MapSection {
  /** Ankarnamn, används av innehållsförteckningen högst upp på sidan. */
  id: string;
  title: string;
  /** En rad som säger vad sektionen leder till. Räknad, inte skriven. */
  summary: string;
  groups: MapGroup[];
}

/**
 * Hela webbkartan, sektion för sektion.
 *
 * Ordningen är trafikens, inte alfabetets: kommunerna bär sajten och står
 * först. Varje länk som byggs här filtreras till sist mot `noindexPaths()`,
 * så en sidtyp som faller under sin kvalitetsgrind försvinner härifrån utan
 * att någon behöver komma ihåg det.
 */
export function siteMap(): MapSection[] {
  const excluded = noindexPaths();
  const sections = [kommunSection(), rapportSection(), artikelSection(), utmarkelseSection(), omSection()];

  for (const section of sections) {
    for (const group of section.groups) {
      group.links = group.links.filter((l) => !excluded.has(l.href));
    }
    section.groups = section.groups.filter(
      (g) => !excluded.has(g.heading.href) && g.links.length > 0,
    );
  }

  return sections.filter((s) => s.groups.length > 0);
}

/**
 * Kommunerna, i bokstavsordning.
 *
 * Sidfoten sorterar på storlek eftersom den bara rymmer tolv rader och då ska
 * visa de största. Webbkartan rymmer alla, och den som letar efter en kommun
 * letar på namn.
 */
function kommunSection(): MapSection {
  const all = [...municipalities()].sort((a, b) => a.city.localeCompare(b.city, 'sv'));

  const groups = all.map((m) => ({
    heading: { href: path(m.slug), label: m.city, count: establishments(m.slug).length },
    links: kommunLinks(m),
  }));

  const total = all.reduce((n, m) => n + establishments(m.slug).length, 0);

  return {
    id: 'kommuner',
    title: 'Kommuner',
    summary:
      `${all.length} kommuner och ${total.toLocaleString('sv-SE')} verksamheter. ` +
      'Varje verksamhet nås via sin kommuns register.',
    groups,
  };
}

function kommunLinks(m: Municipality): MapLink[] {
  // Kommunhubben står redan som gruppens rubrik och räknas inte upp igen här.
  const links: MapLink[] = [];

  // Kartsidan finns bara för kommuner som lämnar koordinater. Fyra av tolv
  // gör inte det, och en karta utan nålar är den tunna sidan kvalitetsgrinden
  // ska hålla borta. Villkoret är samma anrop som getStaticPaths i
  // pages/[kommun]/karta.astro gör, inte en egen bedömning av samma sak.
  if (mapDataset(m.slug) !== undefined) {
    links.push({ href: path(m.slug, 'karta'), label: 'Karta' });
  }

  // Bara kommuner som faktiskt HAR anmärkningar får en länk hit. En sida utan
  // rader är precis den tunna sida kvalitetsgrinden finns för att hålla borta,
  // och samma villkor står i Footer.astro.
  const remarks = municipalityRemarks(m.slug).length;
  if (remarks > 0) {
    links.push({ href: path(m.slug, 'anmarkningar'), label: 'Anmärkningar', count: remarks });
  }

  if (hasMatsnuskPage(m.slug)) {
    links.push({ href: path(m.slug, 'matsnusk'), label: 'Matsnusk' });
  }

  // Rörelsen i beståndet. Loggen börjar tom och byggs på natt för natt, så
  // sidan finns inte i någon kommun förrän det finns något att visa. Villkoret
  // är samma anrop som getStaticPaths i pages/[kommun]/nytt-och-borta gör.
  if (hasMovementPage(m.slug)) {
    links.push({
      href: path(m.slug, 'nytt-och-borta'),
      label: 'Nytt och borta',
      count: movement(m.slug)!.events.length,
    });
  }

  // Kategorisidorna, men bara de som byggts. `linked` är samma flagga som
  // getStaticPaths i pages/[kommun]/kategori/[...path].astro läser, alltså
  // exakt de kategorier som har en URL. Underkategorierna räknas inte upp
  // här: de står på sin toppkategoris sida, som är ett klick bort.
  const { slices } = municipalityCategories(m.slug);
  for (const slice of slices) {
    if (!slice.linked) continue;
    links.push({
      href: path(m.slug, 'kategori', slice.category.slug),
      label: slice.category.name,
      count: slice.count,
    });
  }

  // Områdessidorna, med samma villkor: `linkedAreas` är exakt den lista
  // getStaticPaths i pages/[kommun]/omrade/[...path].astro bygger sidor ur.
  // Kommuner utan gränsdata i OSM har ingen lista och lägger alltså inget här.
  for (const slice of linkedAreas(m.slug)) {
    links.push({
      href: path(m.slug, 'omrade', slice.area.slug),
      label: slice.area.name,
      count: slice.count,
    });
  }

  return links;
}

function rapportSection(): MapSection {
  return {
    id: 'rapporter',
    title: 'Rapporter',
    summary: 'Räknade ur hela beståndet vid varje bygge, inte skrivna.',
    groups: [
      {
        heading: { href: path('rapporter'), label: 'Alla rapporter', count: REPORTS.length },
        links: REPORTS.map((r) => ({ href: path('rapporter', r.slug), label: r.title })),
      },
    ],
  };
}

function artikelSection(): MapSection {
  const files = [...articleFiles()].sort((a, b) =>
    (b.published ?? '').localeCompare(a.published ?? ''),
  );

  return {
    id: 'artiklar',
    title: 'Artiklar',
    summary: 'Skriven och redigerad text, till skillnad från rapporterna.',
    groups: [
      {
        heading: { href: path('artiklar'), label: 'Alla artiklar', count: files.length },
        links: files.map((a) => ({ href: path('artiklar', a.slug), label: a.title })),
      },
    ],
  };
}

/**
 * Utmärkelserna, en grupp per årsutgåva.
 *
 * Bara kommuner med egen sida i utgåvan länkas. `ownPage` är samma flagga som
 * getStaticPaths i pages/utmarkelser/[year]/[kommun].astro läser, så en kommun
 * som ligger under MIN_OWN_PAGE inte kan hamna här utan sida att peka på.
 */
function utmarkelseSection(): MapSection {
  const all = editions();
  /* Nyaste utgåvans ribba. Stod som "tre" medan utgåvan krävde fem. Sedan
     modell 3 är ribban olika i olika kommuner, så här står spannet. */
  const range = all[0] ? barRange(all[0].year) : null;
  const bars = !range
    ? 'flera'
    : range.min === range.max
      ? numeral(range.min)
      : `${numeral(range.min)} till ${numeral(range.max)}`;

  return {
    id: 'utmarkelser',
    title: 'Utmärkelser',
    summary: `Verksamheter med ${bars} kontroller i rad utan anmärkning, fryst per utgåva.`,
    groups: [
      // Först översikten och varje utgåva, sedan en grupp per utgåva med de
      // kommuner som är stora nog att ha en egen lista.
      {
        heading: { href: path('utmarkelser'), label: 'Alla utgåvor', count: all.length },
        links: all.map((e) => ({
          href: path('utmarkelser', String(e.year)),
          label: `Utmärkelsen ${e.year}`,
          count: e.totals.qualified,
        })),
      },
      ...all.map((e) => ({
        heading: {
          href: path('utmarkelser', String(e.year)),
          label: `Utmärkelsen ${e.year}, kommun för kommun`,
        },
        links: standings(e.year)
          .filter((m) => m.ownPage)
          .map((m) => ({
            href: path('utmarkelser', String(e.year), m.slug),
            label: m.city,
            count: m.qualified.length,
          })),
      })),
    ],
  };
}

/**
 * Sidorna om Prikko självt.
 *
 * Listan är handskriven, och det är rätt här: det är sju sidor med skriven
 * text som inte härleds ur någon datamängd. Faller någon av dem bort fångas
 * det av byggrinden, som kräver att varje länk på webbkartan finns i
 * XML-sitemapen.
 */
function omSection(): MapSection {
  return {
    id: 'om-prikko',
    title: 'Om Prikko',
    summary: 'Metodiken, källorna och villkoren.',
    groups: [
      {
        heading: { href: path('om'), label: 'Om Prikko' },
        links: [
          { href: path('metodik'), label: 'Så räknas bedömningen fram' },
          { href: path('kallor'), label: 'Källor och uppdatering' },
          { href: path('sok'), label: 'Sök verksamhet' },
          // Riksvyn byggs bara när loggen bär tillräckligt. Utan villkoret
          // hade byggrinden fällt bygget på en länk till en sida som inte finns.
          ...(hasNationalPage()
            ? [{ href: path('nytt-och-borta'), label: 'Nytt och borta' }]
            : []),
          { href: path('ratta'), label: 'Rätta en uppgift' },
          { href: path('integritetspolicy'), label: 'Integritetspolicy' },
          { href: path('villkor'), label: 'Användarvillkor' },
          { href: path('cookies'), label: 'Kakor' },
        ],
      },
    ],
  };
}

/**
 * Antalet URL:er webbkartan leder till, direkt eller i ett klick.
 *
 * Används av sidans egen ingress, som annars hade fått ett handskrivet tal
 * att glömma uppdatera. Räknar samma mängd som XML-sitemapen: allt utom det
 * `noindexPaths()` utesluter.
 */
export function indexableCount(): number {
  const excluded = noindexPaths();
  let n = 0;
  for (const e of establishments()) {
    if (!excluded.has(path(e.municipality.slug, e.slug))) n += 1;
  }
  return n;
}
