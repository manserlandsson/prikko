/**
 * Det publika API:et: ETT ställe som bestämmer vad som lämnar sajten.
 *
 * ===========================================================================
 * 1. VARFÖR YTAN FINNS
 * ===========================================================================
 *
 * Sajten var en återvändsgränd. Allt pekade in och ingenting pekade ut, och
 * `docs/45` punkt B1 säger varför det är dyrt: Storbritanniens FHRS,
 * Frankrikes Alim'confiance, Torontos DineSafe och Montreal publicerar alla
 * sina bestånd, och det är därför andra bygger på dem och citerar dem. Vi
 * publicerade ingenting, alltså fanns ingen anledning för någon att länka hit.
 *
 * ===========================================================================
 * 2. REGELN SOM AVGÖR VAD SOM FÅR STÅ I ETT SVAR
 * ===========================================================================
 *
 * **API:et säger om en verksamhet exakt det verksamhetens egen sida säger,
 * varken mer eller mindre.** Hela gränsdragningen i avsnitt 3 följer ur den
 * enda meningen, och den är värd att förstå innan något fält läggs till.
 *
 * Ett API som säger MINDRE än HTML:en på samma adress skyddar ingenting. Den
 * som vill ha uppgiften läser sidan i stället, och vi har då bara gjort
 * gränssnittet sämre för den ärlige. Ett API som säger MER än sidan är
 * däremot en ny publicering som ingen granskat: fälten `compliance` och
 * `frequency` i `Registration` visas med flit inte på sajten, se
 * Foretagsregister.astro, och de får därför inte heller stå här.
 *
 * ===========================================================================
 * 3. VAD SOM MEDVETET INTE PUBLICERAS
 * ===========================================================================
 *
 * **Ingen massnedladdning.** Det finns ingen fil som bär hela beståndet, och
 * ingen kommunfil som bär historiken. Skälet är inte blygsamhet utan
 * `docs/11` avsnitt 10 och `docs/45` pelare C4: det normaliserade nationella
 * materialet är en räknad intäktsström, och en dumpfil är hela produkten i en
 * begäran. Kommunfilen bär därför NULÄGET, alltså exakt vad kommunens egen
 * listsida visar, och historiken finns bara per verksamhet.
 *
 * Var ärlig om vad gränsen är värd: den som vill bygga en spegel kan hämta
 * 15 000 filer och sätta ihop en. Friktionen är 15 000 förfrågningar mot en,
 * och det är en tröskel och inte ett lås. Det som faktiskt inte går att få
 * gratis är tidsserien över hela riket i ett svep, och det är också den enda
 * delen C4 säljer.
 *
 * **Inga bilder.** Deras villkor är tredje mans och gäller PER BILD:
 * Mapillary kräver logotyp och länk, Wikimedia Commons kräver fotografens
 * namn, licensnamnet och en länk till filsidan. Se `StreetImage` i db.ts. Ett
 * JSON-fält kan bära en URL men inte tvinga mottagaren att rita
 * attributionen, och en bild som visas utan sin attribution är ett brutet
 * licensvillkor hos oss och inte hos mottagaren.
 *
 * **Inga öppettider och ingen kontaktuppgift.** Båda kommer ur
 * OpenStreetMap, alltså ODbL 1.0, som är en share-alike-licens. Att lägga dem
 * i ett svar vi märker CC BY vore att påstå villkor vi inte får sätta.
 *
 * **Ingen närhetsuppgift.** `stop` och `parking` är härledda ur samma
 * OSM-uttag och faller på samma grund.
 *
 * ===========================================================================
 * 4. LICENSEN, OCH VARFÖR DEN INTE ÄR CC0
 * ===========================================================================
 *
 * Två lager, och de får aldrig skrivas ihop till ett.
 *
 * UNDERLAGET är kommunernas kontrollresultat. Det bär varken upphovsrätt
 * eller katalogskydd: 9 § upphovsrättslagen (1960:729) undantar beslut och
 * yttranden av svenska myndigheter, och 49 § tredje stycket räknar upp 9 §
 * bland de bestämmelser som gäller även för en sammanställning. Kedjan är två
 * paragrafer lång och står utskriven i `docs/20` avsnitt 9.3. Vi äger alltså
 * ingenting av det och kan inte licensiera det. Ingen behöver vårt tillstånd.
 *
 * VÅRT EGET ARBETE är normaliseringen, identifierarna och bedömningen. Det
 * erbjuds under CC BY 4.0. Attribution är villkoret, och `LICENCE.attribution`
 * nedan är den enda text som räknas som uppfylld.
 *
 * Fältet får INTE märkas CC0. kallor.astro bar en gång CC0 i sitt
 * Dataset-schema medan den synliga texten sa något annat, och en CC0-märkning
 * är oåterkallelig för den som hunnit förlita sig på den.
 */
import {
  coverage,
  establishments,
  isIndexable,
  municipalities,
  sourceFor,
  type Establishment,
  type Municipality,
} from './data';
import { dataUpdated } from './rapporter';
import { SITE } from './site';
import { absolute } from './urls';

/**
 * Versionen står i ADRESSEN och ingen annanstans.
 *
 * Ett API är ett löfte, och löftet är att `/api/v1/...` alltid svarar med den
 * form som beskrivs på /api/. Ska ett fält tas bort eller byta betydelse
 * tillkommer `/api/v2/` bredvid, och v1 står kvar. Att lägga TILL ett fält är
 * däremot bakåtkompatibelt och kräver ingen ny version.
 */
export const API_VERSION = 'v1';

/** Sökväg under API:et, alltid med versionen inbakad. Slutar aldrig med snedstreck. */
export function apiPath(...segments: string[]): string {
  return `/api/${API_VERSION}/${segments.join('/')}`;
}

/**
 * AVSTÄNGD I DAG. Rutten /api/v1/verksamhet/{kommun}/{slug}.json byggs inte.
 *
 * ===========================================================================
 * KODEN ÄR FÄRDIG OCH VERIFIERAD. DET SOM SAKNAS ÄR ETT KONTO.
 * ===========================================================================
 *
 * Rutten är skriven, byggd och mätt: bygget 2026-08-31 producerade samtliga
 * dokument, och `verksamhetDokument()` nedan är oförändrad sedan dess. Flaggan
 * står på `false` av ett enda skäl, och det är inte tekniskt.
 *
 * **Den kostar 17 066 filer**, en per verksamhet. Utgåvan låg på 18 055 filer
 * före det här arbetet och hamnar på 35 150 med rutten på. Cloudflare Pages
 * tar 100 000 på Workers Paid, alltså ryms det, men **kontot ligger kvar på
 * gratisplanen vars tak är 20 000**.
 *
 * Och det felet är TYST. `filtaksgrind()` i astro.config.mjs varnar mellan
 * 19 000 och 90 000 men fäller först vid 98 000, alltså hade bygget varit
 * grönt hos oss medan Cloudflare avvisade utgåvan och sajten stod kvar på
 * gårdagens. Det är precis det läge grinden finns för att förhindra.
 *
 * **VILLKORET FÖR ATT SLÅ PÅ DEN:** kontot uppgraderat till Workers Paid,
 * alltså steg ett i `docs/46_filtaket.md` §6. Fem dollar i månaden och ett
 * klick, och det är ägarens beslut och inte vårt. Samma dag det är gjort
 * sätts flaggan till `true` och ingenting annat behöver röras: rutten,
 * dokumentet, adressen i indexet, raden i kommunfilen och raden på /api/
 * läser alla den här konstanten.
 *
 * **ADRESSEN ÄR BESTÄMD OCH FÅR INTE ÄNDRAS.** Ett API är ett löfte, och
 * löftet gäller från den dag adressen publiceras i `docs/55_publikt_api.md`
 * och inte från den dag den svarar. Formen är sidans adress med ett prefix
 * och en ändelse:
 *
 *     /stockholm/vesuvio/
 *     /api/v1/verksamhet/stockholm/vesuvio.json
 *
 * **INGENTING DOKUMENTERAS SOM SVARAR 404.** Så länge flaggan är falsk
 * utelämnas raden ur `endpoints` i indexet, fältet `api` ur kommunfilens
 * rader och hela avsnittet ur /api/. Ett API som beskriver en adress som inte
 * finns är sämre än ett som beskriver mindre.
 */
/* Typad som `boolean` och inte som literalen `false`, med flit. Utan
   annoteringen smalnar TypeScript av konstanten till `false`, och då blir
   den påslagna grenen i varje `PER_VERKSAMHET ? ... : ...` en gren
   typkontrollen anser onåbar. Koden som väntar på uppgraderingen ska
   granskas av kompilatorn hela tiden, inte först den dag flaggan vänds. */
export const PER_VERKSAMHET: boolean = false;

/** Adressen till en verksamhets dokument, härledd ur sidans egen adress. */
export function verksamhetApiPath(kommun: string, slug: string): string {
  return apiPath('verksamhet', kommun, `${slug}.json`);
}

export function kommunApiPath(kommun: string): string {
  return apiPath('kommun', `${kommun}.json`);
}

/** Flödets adress. Ligger utanför /api/, se kommentaren i flode/[omrade].xml.ts. */
export function flodePath(omrade: string): string {
  return `/flode/${omrade}.xml`;
}

/** Nyckeln som gör riksflödet till ett område bland de övriga. */
export const RIKET = 'riket';

/**
 * Licensblocket, ordagrant i varje svar.
 *
 * Det står i VARJE dokument och inte bara i indexet, med flit. Ett svar som
 * kopieras vidare, cachas eller klistras in i ett AI-sammanhang tappar sin
 * kontext, och då är licensen och attributionen det första som försvinner.
 * Blocket är fyra rader och beståndet är ändå tusen gånger större.
 */
export const LICENCE = {
  /** Vad som licensieras: vårt arbete, inte kommunernas handlingar. */
  covers:
    'Prikkos normalisering, identifierare och bedömning. Kommunernas underlag ' +
    'bär varken upphovsrätt eller katalogskydd (9 § och 49 § tredje stycket ' +
    'upphovsrättslagen) och licensieras inte av oss.',
  name: 'CC BY 4.0',
  url: 'https://creativecommons.org/licenses/by/4.0/deed.sv',
  /** Den enda text som uppfyller villkoret. Skriv av den som den står. */
  attribution: `${SITE.name}, ${SITE.url}`,
  documentation: `${SITE.url}/api/`,
  /* Kontrollresultat ändras. En uppgift utan datum blir fel med tiden, och
     det är samma reservation som /llms.txt redan ställer på citeringar. */
  notice:
    'Ange alltid kontrolldatumet tillsammans med uppgiften. Bedömningen är ' +
    'Prikkos slutsats räknad ur kontrolldatan, inte kommunens betyg.',
} as const;

/**
 * Kommunens källa, som den ska stå i ett svar.
 *
 * `licence: "unstated"` gäller TRETTON av tretton kommuner: ingen har skrivit
 * ett villkor för vidareutnyttjande, varken en licensmärkning eller ett
 * förbud. Rätten att publicera vilar därför på lagtexten i avsnitt 4 ovan och
 * inte på ett tillstånd. Fältet finns för att den som bygger vidare ska kunna
 * se det själv i stället för att lita på ett medelvärde vi räknat åt dem.
 *
 * VÄRDET ÄR I DAG DETSAMMA FÖR ALLA TRETTON, och det är det svagaste med
 * fältet. `docs/20` §9.3 prövade Norrköping ordagrant och `docs/42` svepte
 * dataportal.se, men de elva kommuner vi läser genom deras egna gränssnitt
 * är inte omlästa villkor för villkor. Fältet är alltså en avläsning för två
 * av tretton och vår källposts tystnad för resten, se `docs/55` §7.2. Skulle
 * en kommun visa sig ha ett villkor är det HÄR det ska stå, per kommun, och
 * inte i en text som gäller alla.
 *
 * `modifiedAt` står bara där källan själv svarar på frågan. Norrköping är
 * skälet till att fältet finns: deras Ecos-utdrag hämtas i dag och skrevs
 * 2024-03-17, alltså är `fetchedAt` där en uppgift om oss och inte om datan.
 */
export interface ApiSource {
  type: string;
  url: string;
  fetchedAt: string;
  modifiedAt?: string;
  licence: 'unstated';
}

function apiSource(m: Municipality): ApiSource | null {
  const s = sourceFor(m.slug);
  if (!s) return null;
  return {
    type: m.sourceType ?? 'unknown',
    url: s.url,
    fetchedAt: s.fetchedAt,
    ...(s.modifiedAt ? { modifiedAt: s.modifiedAt } : {}),
    licence: 'unstated' as const,
  };
}

/** Kommunen som identitet: SCB-koden är det som gör vår "Stockholm" till någon annans. */
function apiMunicipality(m: Municipality) {
  return { code: m.code, slug: m.slug, name: m.name, city: m.city };
}

/**
 * En verksamhet i NULÄGE, alltså raden i en kommunfil.
 *
 * Verksamheter UTAN bedömning står med, och det är ett medvetet val. De
 * finns på kommunens egen listsida, och att tysta bort dem hade fått
 * täckningen att se bättre ut än den är. `verdict: null` med `reason` säger
 * vilket av de två fallen det är: ingen registrerad kontroll alls, eller
 * ingen kontroll de senaste fem åren.
 */
function nulage(e: Establishment) {
  const senaste = e.inspections[0];
  return {
    id: e.id,
    slug: e.slug,
    name: e.name,
    address: e.address,
    types: e.types,
    lat: e.lat,
    lng: e.lng,
    verdict: e.verdict,
    reason: e.reason,
    uncertain: e.uncertain,
    distinction: e.distinction,
    inspections: e.inspections.length,
    latest: senaste
      ? { date: senaste.date, assessment: senaste.assessment, type: senaste.type }
      : null,
    url: absolute(e.municipality.slug, e.slug),
    /* Länken till verksamhetens eget dokument står bara när rutten faktiskt
       byggs. En `api`-länk på 17 066 rader som alla svarar 404 vore värre än
       ingen länk alls: en klient som ser fältet antar att det går att följa.
       Se PER_VERKSAMHET ovan. */
    ...(PER_VERKSAMHET
      ? { api: `${SITE.url}${verksamhetApiPath(e.municipality.slug, e.slug)}` }
      : {}),
  };
}

/**
 * Kommunens dokument: nuläget för varje verksamhet, aldrig historiken.
 *
 * Så länge `PER_VERKSAMHET` är falsk publiceras historiken INTE ALLS, och det
 * är en skärpning av gränsen i avsnitt 3 och inte ett avsteg från den: den
 * strängare hållningen står kvar tills den lösare går att bygga.
 */
export function kommunDokument(m: Municipality) {
  const rader = establishments(m.slug);
  return {
    version: API_VERSION,
    municipality: apiMunicipality(m),
    source: apiSource(m),
    generated: dataUpdated(),
    count: rader.length,
    assessed: rader.filter((e) => e.verdict !== null).length,
    /* Ordningen är bokstavsordning på slug och inte filens egen. Filen skrivs
       om av pipelinen vid varje hämtning, och en ordning som glider gör varje
       diff oläsbar för den som jämför två uttag. */
    establishments: [...rader].sort((a, b) => a.slug.localeCompare(b.slug, 'sv')).map(nulage),
    licence: LICENCE,
    documentation: `${SITE.url}/api/`,
    feed: `${SITE.url}${flodePath(m.slug)}`,
    page: absolute(m.slug),
  };
}

/**
 * En verksamhets dokument: samma sak som verksamhetens sida, i JSON.
 *
 * Historiken står HÄR och bara här. Kontrollområdena följer med, eftersom
 * sidan visar dem, och `ownerComment` följer med av samma skäl: fältet är
 * verksamhetens egen replik och den publiceras ordagrant eller inte alls, se
 * `Inspection` i db.ts.
 *
 * `registration` tas med i sina publika delar. Organisationsnumret är det
 * enskilt värdefullaste fältet för någon som bygger vidare, `docs/45` H3:
 * Frankrikes Alim'confiance identifierar med SIRET, och det är hela
 * skillnaden mot att para ihop på namn och adress. Numret är dessutom säkert
 * att lämna ut: pipelinen håller inne det på varje enskild firma, eftersom
 * kommunens fält bär innehavarens PERSONNUMMER när ingen juridisk person
 * finns. Se `ar_personnummer` i pipeline/prikko/stockholmsintyg.py.
 *
 * `compliance` och `frequency` står INTE med. De visas inte på sajten
 * heller, se Foretagsregister.astro, och regeln i avsnitt 2 gäller åt båda
 * hållen.
 */
export function verksamhetDokument(e: Establishment) {
  const r = e.registration;
  return {
    version: API_VERSION,
    id: e.id,
    slug: e.slug,
    name: e.name,
    address: e.address,
    types: e.types,
    municipality: apiMunicipality(e.municipality),
    location: {
      lat: e.lat,
      lng: e.lng,
      /* Saknas fältet i datan kommer punkten från kommunen. Uppsala och
         Örebro lämnar inga koordinater alls och geokodas mot OSM, och den
         som bygger vidare har rätt att veta vilket av de två det är. */
      source: e.geoSource ?? 'municipality',
      precision: e.geoPrecision ?? 'address',
    },
    verdict: e.verdict,
    reason: e.reason,
    uncertain: e.uncertain,
    distinction: e.distinction,
    modelVersion: e.modelVersion,
    method: absolute('metodik'),
    ...(r
      ? {
          registration: {
            orgnr: r.orgnr ?? null,
            companyForm: r.companyForm ?? null,
            operator: r.operator ?? null,
            postalCode: r.postalCode ?? null,
            city: r.city ?? null,
            active: r.active ?? null,
            registeredAt: r.registeredAt ?? null,
            businessTypes: r.businessTypes ?? [],
            activities: r.activities ?? [],
            scope: r.scope ?? null,
            checkedAt: r.checkedAt ?? null,
          },
        }
      : {}),
    inspections: e.inspections.map((i) => ({
      id: i.id,
      date: i.date,
      assessment: i.assessment,
      type: i.type,
      prenotified: i.prenotified,
      audit: i.audit,
      onSite: i.onSite,
      areas: i.areas.map((a) => ({
        code: a.code,
        group: a.group,
        description: a.description,
        status: a.status,
      })),
      ...(i.ownerComment ? { ownerComment: i.ownerComment } : {}),
    })),
    source: apiSource(e.municipality),
    licence: LICENCE,
    documentation: `${SITE.url}/api/`,
    url: absolute(e.municipality.slug, e.slug),
    feed: `${SITE.url}${flodePath(e.municipality.slug)}`,
  };
}

/**
 * Kodlistan, i klartext.
 *
 * Ett tal utan sin betydelse är oanvändbart, och den som läser
 * `assessment: 2` ska slippa gissa. Etiketterna kopieras INTE hit utan hämtas
 * ur samma konstanter som sidorna renderar, så att en ändrad formulering inte
 * kan ge två svar. Se ASSESSMENT_LABEL och VERDICT.
 */
export function kodlista() {
  return {
    verdict: {
      clean: 'Inga anmärkningar vid den senaste kontrollen.',
      minor: 'Anmärkningar vid den senaste kontrollen.',
      /*
       * Tre grunder, inte en. Här stod "Brister som inte åtgärdats vid
       * kommunens uppföljning", vilket beskrev en av dem: 130 av 403
       * verksamheter har ingen uppföljning alls i datan, bara avvikelser
       * också vid kontrollen före. Kodlistan är API:ets enda förklaring av
       * vad tvåan betyder och måste räkna upp alla tre. Se lib/omdome.ts.
       */
      major:
        'Brister som stod kvar. Antingen fann kommunen dem vid ett återbesök, ' +
        'eller gav sitt allvarligaste omdöme, eller så fanns avvikelser redan ' +
        'vid kontrollen före. Vilket av de tre går att läsa ur inspections.',
      null: 'Otillräckligt underlag. Se `reason`. Aldrig detsamma som en dålig bedömning.',
    },
    reason: {
      assessed: 'Bedömd ur kontrolldatan.',
      no_inspections: 'Ingen registrerad kontroll hos kommunen.',
      stale_inspections: 'Ingen kontroll de senaste fem åren.',
    },
    assessment: {
      0: 'Inga anmärkningar',
      1: 'Avvikelse',
      2: 'Kvarstående avvikelse',
    },
    type: {
      0: 'Planerad kontroll',
      1: 'Återbesök',
      2: 'Händelsestyrd kontroll',
    },
    areaStatus: {
      ok: 'Utan avvikelse',
      fixed: 'Åtgärdad',
      deviation: 'Avvikelse',
      persisting: 'Kvarstår',
    },
    sourceType: {
      open_data: 'Kommunen publicerar en öppen datamängd.',
      reverse_engineered: 'Vi anropar samma gränssnitt som kommunens egen tjänst.',
      scrape: 'Läst ur kommunens publicerade sidor.',
      foi_request: 'Utlämnad efter begäran om allmän handling.',
    },
  };
}

/** Indexet: en enda hämtning som svarar på vad som finns och var. */
export function apiIndex() {
  const total = coverage();
  return {
    api: 'prikko-livsmedelskontroller',
    version: API_VERSION,
    documentation: `${SITE.url}/api/`,
    generated: dataUpdated(),
    licence: LICENCE,
    coverage: {
      municipalities: total.municipalities,
      establishments: total.establishments,
      assessed: total.assessed,
      inspections: total.inspections,
      /* Sverige har 290 kommuner och de flesta publicerar ingenting. Talet
         står med för att ingen ska läsa täckningen som riksdata. */
      swedishMunicipalities: 290,
    },
    /* Bara adresser som svarar. Adressmallen för en verksamhet är bestämd och
       står i docs/55, men den räknas inte upp här förrän rutten byggs, av
       samma skäl som fältet `api` utelämnas i kommunfilens rader. */
    endpoints: {
      municipality: `${SITE.url}${apiPath('kommun', '{kommun}.json')}`,
      ...(PER_VERKSAMHET
        ? { establishment: `${SITE.url}${apiPath('verksamhet', '{kommun}', '{slug}.json')}` }
        : {}),
      feed: `${SITE.url}${flodePath('{kommun}')}`,
      nationalFeed: `${SITE.url}${flodePath(RIKET)}`,
    },
    codes: kodlista(),
    municipalities: municipalities().map((m) => {
      const rader = establishments(m.slug);
      return {
        ...apiMunicipality(m),
        establishments: rader.length,
        assessed: rader.filter((e) => e.verdict !== null).length,
        source: apiSource(m),
        api: `${SITE.url}${kommunApiPath(m.slug)}`,
        feed: `${SITE.url}${flodePath(m.slug)}`,
        page: absolute(m.slug),
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Flödena
// ---------------------------------------------------------------------------

/** Så många kontroller ett kommunflöde bär. Se kommentaren i rutten. */
export const FLODE_POSTER = 50;

/** Riksflödet spänner tretton kommuner och behöver fler poster för samma räckvidd. */
export const FLODE_POSTER_RIKET = 150;

export interface FlodePost {
  establishment: Establishment;
  inspectionId: string;
  date: string;
  assessment: 0 | 1 | 2;
  type: 0 | 1 | 2;
}

/**
 * De färskaste kontrollerna, nyast först.
 *
 * Bara verksamheter som `isIndexable()` släpper igenom kommer med. Ett flöde
 * som länkar till en sida som bär `noindex` ber en läsare gå till en sida vi
 * själva har sagt inte ska hittas.
 *
 * ORDNINGEN MÅSTE VARA TOTAL. Källdatan har dagsupplösning och ingenting
 * finare, alltså har ett femtiotal kontroller samma datum. Utan ett andra och
 * tredje sorteringsled hade två byggen på samma data kunnat ge olika flöden,
 * och varje läsare hade sett gamla poster som nya. Verksamhetens id och
 * kontrollens id är båda stabila och avgör resten.
 */
export function senasteKontroller(slug: string | undefined, limit: number): FlodePost[] {
  const poster: FlodePost[] = [];

  for (const e of establishments(slug)) {
    if (!isIndexable(e)) continue;
    for (const i of e.inspections) {
      poster.push({
        establishment: e,
        inspectionId: i.id,
        date: i.date,
        assessment: i.assessment,
        type: i.type,
      });
    }
  }

  poster.sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      a.establishment.id.localeCompare(b.establishment.id) ||
      a.inspectionId.localeCompare(b.inspectionId),
  );

  return poster.slice(0, limit);
}

/**
 * XML-escaping för de fem tecken som betyder något i en Atom-text.
 *
 * Skrivs för hand eftersom flödet gör det. `@astrojs/rss` finns inte i
 * package.json, och ett paket som drar in en beroendekedja för att sätta ihop
 * tolv rader XML är dyrare än raderna. Se rutten för resten av det skälet.
 */
export function xmlEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * ISO-datum till RFC 3339, som Atom kräver.
 *
 * Klockslaget är midnatt UTC och är INTE ett påstående. Källorna redovisar
 * kontrolldatum och ingenting finare, så en tid hade varit påhittad. Datumet
 * är sant, timmen är en formalitet formatet kräver.
 */
export function rfc3339(isoDate: string): string {
  return `${isoDate}T00:00:00Z`;
}

/**
 * Postens beständiga identitet i flödet.
 *
 * En `tag:`-URI enligt RFC 4151 och inte sidans URL. Atom kräver att `<id>`
 * är globalt unik och ALDRIG ändras, och en URL är ett löfte om var något
 * ligger. Vår kontroll-id är redan stabil, se `Inspection.id`, så taggen är
 * bara den i rätt form. Byter en verksamhet slug, vilket ADR 0003 tillåter
 * med omdirigering, ändras länken men inte identiteten, och läsaren visar
 * inte om posten som ny.
 */
export function flodeId(inspectionId: string): string {
  return `tag:prikko.se,2026:kontroll/${inspectionId}`;
}

/** Rubriken på en post: verksamheten och utfallet, självbärande utan sidan. */
export function flodeRubrik(post: FlodePost): string {
  const utfall = ['inga anmärkningar', 'anmärkningar', 'kvarstående anmärkningar'][post.assessment];
  const sort = ['kontroll', 'återbesök', 'händelsestyrd kontroll'][post.type];
  return `${post.establishment.name}: ${utfall} vid ${sort} ${post.date}`;
}

/** Vad posten säger i klartext, med kommunen utsatt eftersom riksflödet blandar dem. */
export function flodeSammanfattning(post: FlodePost): string {
  const e = post.establishment;
  const plats = e.address ? `${e.address}, ${e.municipality.city}` : e.municipality.city;
  const utfall = ['Inga anmärkningar', 'Avvikelse', 'Kvarstående avvikelse'][post.assessment];
  const sort = ['Planerad kontroll', 'Återbesök', 'Händelsestyrd kontroll'][post.type];
  return (
    `${sort} ${post.date} hos ${e.name}, ${plats}. Utfall: ${utfall}. ` +
    `Bedömningen är Prikkos slutsats räknad ur kontrolldatan, inte kommunens betyg.`
  );
}

/** Verksamhetssidans adress, alltså dit posten länkar. */
export function flodeLank(post: FlodePost): string {
  return absolute(post.establishment.municipality.slug, post.establishment.slug);
}

/** Områdets namn i flödets titel. `riket` är inte en kommun och har ingen slug. */
export function flodeTitel(omrade: string): string {
  if (omrade === RIKET) return `${SITE.name}: nya livsmedelskontroller i Sverige`;
  const m = municipalities().find((k) => k.slug === omrade);
  return `${SITE.name}: nya livsmedelskontroller i ${m?.city ?? omrade}`;
}

/** Sidan flödet hör till, alltså den som en läsare ska landa på. */
export function flodeHemsida(omrade: string): string {
  return omrade === RIKET ? absolute() : absolute(omrade);
}
