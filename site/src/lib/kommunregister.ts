/**
 * Kommunens register i webbläsaren: det kommunsidans filter läser.
 *
 * ══ VARFÖR MODULEN FINNS ════════════════════════════════════════════════
 *
 * Kommunsidan är sidindelad i bokstavsordning, 100 rader per sida, och den
 * indelningen är SEO och står kvar. Men ett filter som bara når de hundra
 * raderna man råkar stå på är inget filter: på /stockholm/ är det 100 av
 * 8 555, alltså 1,2 procent av kommunen. Den som landar från Google och vill
 * ha pizza ska få kommunens pizzerior, inte de som börjar på A.
 *
 * Ett filter över hela kommunen på en statiskt byggd sida kräver att raderna
 * finns i webbläsaren. Den här modulen bygger dem, en fil per kommun, och
 * pages/kommunregister/[kommun].json.ts lämnar ut dem.
 *
 * ══ VARFÖR INTE /kartlista/<kommun>.json, SOM REDAN FINNS ═══════════════
 *
 * Den prövades först, och den räcker inte av ett skäl som inte går att
 * komma runt: kartlistan bär bara verksamheter MED koordinat, eftersom den
 * binder en rad till en nål. Räknat i src/data 2026-09-14:
 *
 *   kommun        rader   med koordinat
 *   stockholm     8 555      8 555
 *   orebro        1 231        639
 *   uppsala       1 854        940
 *   norrkoping    1 022        622
 *   svenljunga      100          0
 *   borgholm        406          0
 *   lomma           153          0
 *
 * Ett filter ovanpå kartlistan hade alltså tappat 592 av Örebros 1 231 utan
 * att säga det, och i Svenljunga, Borgholm och Lomma hade det inte funnits
 * någon fil att hämta alls. Kartlistan bär dessutom varken adress eller
 * område. Den står orörd; den här filen är listans och inte kartans.
 *
 * ══ INGEN ANDRA SANNING ═════════════════════════════════════════════════
 *
 * Felet som beskrivs i huvudet på KartaPuff.astro var en andra datakälla
 * bredvid kartan som kunde glida isär från den. Här räknas ingenting om.
 * Varje fält kommer ur exakt den funktion som redan ritar samma uppgift på
 * sajten:
 *
 *   ordningen      municipalityListing   samma som sidindelningen
 *   typ, bitmask   categoriesOf + kategoriBitar   samma bitar som kartnålen
 *   matkategori    matkategorierFor      samma som kartans söktext
 *   område         areaOf                samma polygon som områdessidorna
 *   datum          latestInspectionDate  samma som listraden
 *   slug           slugify, bara avvikelsen   samma regel som kartrutorna
 *
 * ══ VAD SOM MEDVETET INTE FINNS I FILEN ═════════════════════════════════
 *
 * Inget att sortera på som är ett omdöme. Bedömningen följer med, därför att
 * raden visar ansiktet och ordet, men klienten får aldrig ordna eller
 * filtrera på den. Se Registerfilter.astro för spärren och skälet.
 */
import {
  categoriesOf,
  isIndexable,
  latestInspectionDate,
  municipalityListing,
  TOP_CATEGORIES,
} from './data';
import { kategoriBitar } from './kartrutor';
import { MATKATEGORI_ORDNING, matkategori, matkategorierFor } from './matkategori';
import { areaOf, municipalityAreas } from './omraden';
import { avregistrerad } from './registrering';
import { slugify } from './slug';

/** Epoken för dagtalet. Samma som kartrutornas MAP_EPOCH, se kartrutor.ts. */
export const REGISTER_EPOCH = '2020-01-01';

const DAY = 86_400_000;

/** Bedömningen som ett tal, i samma ordning som kartrutornas `v`. */
const V = { clean: 0, minor: 1, major: 2 } as const;

/** Bitar i radens flaggfält. */
export const FLAGGA = {
  /** Kommunen har inte längre stället registrerat. */
  avregistrerad: 1,
  /** Sidan är noindex, alltså ska länken bära rel=nofollow. */
  nofollow: 2,
} as const;

/**
 * En rad, som en array och inte ett objekt. Nycklarna hade upprepats 8 555
 * gånger i Stockholms fil.
 *
 *   0  namn
 *   1  slug, eller 0 när den är slugify(namn)
 *   2  adress, eller tom sträng
 *   3  bedömning: 0 ren, 1 brister, 2 kvarstår, 3 ingen
 *   4  dagar sedan REGISTER_EPOCH för senaste kontrollen, 0 = ingen
 *   5  toppkategorier som bitmask, samma bitar som kartnålens `c`
 *   6  matkategorier som bitmask i MATKATEGORI_ORDNING
 *   7  index i `omraden`, eller -1
 *   8  kommunens egen typ som index i `typer`, eller -1
 *   9  flaggor, se FLAGGA
 */
export type Registerrad = [string, string | 0, string, number, number, number, number, number, number, number];

export interface Register {
  kommun: string;
  epok: string;
  /** Toppkategorierna i bitordning. */
  kategorier: Array<{ slug: string; namn: string }>;
  /** Matkategoriernas namn i bitordning. */
  mat: string[];
  /** Stadsdelarna, i bokstavsordning. Tom där kommunen saknar gränser. */
  omraden: string[];
  /** Kommunens egna typvärden som förekommer, för fritexten. */
  typer: string[];
  rader: Registerrad[];
}

const cache = new Map<string, Register>();

/**
 * Cachat per kommun. Rutan på kommunsidan läser registret för sina tal, och
 * den står på varje sida i serien: utan cachen hade Stockholms 86 sidor räknat
 * om 8 555 rader 86 gånger, plus en gång för filen.
 */
export function kommunregister(slug: string): Register {
  const hit = cache.get(slug);
  if (hit) return hit;
  const built = bygg(slug);
  cache.set(slug, built);
  return built;
}

function bygg(slug: string): Register {
  const bitar = kategoriBitar();
  const omraden = municipalityAreas(slug).map((s) => s.area);
  const omradeIndex = new Map(omraden.map((a, i) => [a.slug, i]));
  const matIndex = new Map(MATKATEGORI_ORDNING.map((id, i) => [id, i]));
  const epok = Date.parse(REGISTER_EPOCH);

  const typer: string[] = [];
  const typIndex = new Map<string, number>();

  const rader: Registerrad[] = municipalityListing(slug).map((e) => {
    const namn = e.name.replace(/\s+/g, ' ').trim();

    let c = 0;
    for (const id of categoriesOf(e).categories) {
      const top = TOP_CATEGORIES.find((t) => t.id === id);
      if (top) c |= bitar[top.slug] ?? 0;
    }

    let mk = 0;
    for (const id of matkategorierFor(e)) mk |= 1 << (matIndex.get(id) ?? 0);

    const area = areaOf(e);

    let ty = -1;
    const typ = e.types[0];
    if (typ) {
      if (!typIndex.has(typ)) {
        typIndex.set(typ, typer.length);
        typer.push(typ);
      }
      ty = typIndex.get(typ)!;
    }

    const date = latestInspectionDate(e);
    let flaggor = 0;
    if (avregistrerad(e)) flaggor |= FLAGGA.avregistrerad;
    if (!isIndexable(e)) flaggor |= FLAGGA.nofollow;

    return [
      namn,
      slugify(namn) === e.slug ? 0 : e.slug,
      e.address ?? '',
      e.verdict ? V[e.verdict] : 3,
      date ? Math.round((Date.parse(date) - epok) / DAY) : 0,
      c,
      mk,
      area ? (omradeIndex.get(area.slug) ?? -1) : -1,
      ty,
      flaggor,
    ];
  });

  return {
    kommun: slug,
    epok: REGISTER_EPOCH,
    kategorier: TOP_CATEGORIES.map((t) => ({ slug: t.slug, namn: t.name })),
    mat: MATKATEGORI_ORDNING.map((id) => matkategori(id).namn),
    omraden: omraden.map((a) => a.name),
    typer,
    rader,
  };
}
