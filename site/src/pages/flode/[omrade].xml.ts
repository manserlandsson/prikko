import type { APIRoute } from 'astro';
import {
  FLODE_POSTER,
  FLODE_POSTER_RIKET,
  LICENCE,
  RIKET,
  flodeHemsida,
  flodeId,
  flodeLank,
  flodeRubrik,
  flodeSammanfattning,
  flodeTitel,
  flodePath,
  rfc3339,
  senasteKontroller,
  xmlEscape,
} from '../../lib/api';
import { municipalities } from '../../lib/data';
import { dataUpdated } from '../../lib/rapporter';
import { SITE } from '../../lib/site';

/**
 * `/flode/<kommun>.xml` och `/flode/riket.xml`, alltså nya kontroller som Atom.
 *
 * ===========================================================================
 * 1. VARFÖR ATOM OCH INTE RSS
 * ===========================================================================
 *
 * Tre skäl, i fallande ordning efter vad de är värda för oss.
 *
 * **Google tar emot ett flöde SOM SITEMAP.** RSS 2.0 och Atom 1.0 är båda
 * dokumenterade sitemapformat hos Google, och det är den enda anledningen
 * flödet står högt just nu: `docs/49` mätte att omkring tio procent av
 * sajtens 14 260 sidor är indexerade. Ett flöde per kommun som anmäls vid
 * sidan av XML-sitemapen är en andra väg in för precis de sidor som ändrats,
 * och den vägen kostar tretton filer.
 *
 * **Atom kräver en beständig identitet per post, RSS gör det inte.** `<id>`
 * är obligatorisk i Atom och `<guid>` är valfri i RSS. Vår kontroll-id är
 * redan stabil, se `Inspection.id` i db.ts, så kravet kostar oss ingenting
 * och ger läsaren garantin att en post inte dyker upp som ny igen när en
 * verksamhet byter slug. Se `flodeId()`.
 *
 * **Atom daterar i RFC 3339, RSS i RFC 822.** Färskheten är sajtens skarpaste
 * kant och den AEO-signal bibeln §6b prissätter högst. Att skriva den i
 * samma form som `lastmod` i sitemapen redan använder är en glidning mindre.
 *
 * RSS hade varit rätt om läsarna var gamla, men Atom är RFC 4287 och läses av
 * allt som läser RSS.
 *
 * ===========================================================================
 * 2. VARFÖR FLÖDENA LIGGER UTANFÖR /api/
 * ===========================================================================
 *
 * Ett flöde är en prenumeration och inte ett anrop. Adressen hamnar i någons
 * läsare och ska överleva att API:et en dag får en `v2`, alltså får den inte
 * bära ett versionsnummer den skulle tvingas byta. Atom är dessutom
 * bakåtkompatibelt av konstruktion: nya element går att lägga till utan att en
 * gammal läsare tar skada.
 *
 * ===========================================================================
 * 3. VARFÖR XML:EN SKRIVS FÖR HAND
 * ===========================================================================
 *
 * `@astrojs/rss` finns inte i package.json och läggs inte till. Ett paket för
 * att sätta ihop tolv rader XML är en beroendekedja att underhålla för något
 * `xmlEscape()` löser på fem rader, och paketet skriver dessutom RSS medan vi
 * vill ha Atom.
 *
 * ===========================================================================
 * 4. HUVUDENA SÄTTS I public/_headers
 * ===========================================================================
 *
 * `application/atom+xml` är det som gör att en webbläsare erbjuder
 * prenumeration i stället för att visa trädet. Cloudflare Pages gissar
 * `application/xml` på ändelsen, alltså MÅSTE regeln stå i `_headers`, och
 * `Response`-huvudet nedan kastas i ett statiskt bygge precis som i våra
 * andra JSON-rutter. Se filens huvud i `public/_headers`.
 */
export const prerender = true;

export function getStaticPaths() {
  /* Riket är ett område bland de övriga och inte en egen rutt. Två filer hade
     betytt att en kommun som någon gång får slugen `riket` fällt bygget på en
     dubblerad rutt, och `new Set` gör den kollisionen omöjlig i stället för
     osannolik. */
  const omraden = new Set([RIKET, ...municipalities().map((m) => m.slug)]);
  return [...omraden].map((omrade) => ({ params: { omrade } }));
}

export const GET: APIRoute = ({ params }) => {
  const omrade = params.omrade!;
  const riket = omrade === RIKET;

  const poster = senasteKontroller(
    riket ? undefined : omrade,
    riket ? FLODE_POSTER_RIKET : FLODE_POSTER,
  );

  /* Flödets egen tidsstämpel är den färskaste POSTENS och aldrig byggtiden.
     Skälet står i lastmodIndex() i astro.config.mjs och gäller ordagrant här:
     en tidsstämpel som ändras vid varje bygge är per definition inte
     trovärdig, och den ignoreras då i sin helhet. Utan poster faller den
     tillbaka på hämtdatumet, vilket är sant om dokumentet men inte ett
     påstående om något innehåll. */
  const updated = rfc3339(poster[0]?.date ?? dataUpdated());

  const rader: string[] = [];
  rader.push('<?xml version="1.0" encoding="utf-8"?>');
  rader.push('<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="sv">');
  rader.push(`  <title>${xmlEscape(flodeTitel(omrade))}</title>`);
  rader.push(
    `  <subtitle>${xmlEscape(
      riket
        ? 'De senaste kontrollerna i samtliga kommuner Prikko täcker.'
        : 'De senaste kontrollerna i kommunen, nyast först.',
    )}</subtitle>`,
  );
  /* Flödets id är en tag-URI av samma skäl som postens, se flodeId(): en URL
     säger var något ligger och inte vad det är. */
  rader.push(`  <id>tag:prikko.se,2026:flode/${xmlEscape(omrade)}</id>`);
  rader.push(
    `  <link rel="self" type="application/atom+xml" href="${SITE.url}${flodePath(omrade)}"/>`,
  );
  rader.push(`  <link rel="alternate" type="text/html" href="${flodeHemsida(omrade)}"/>`);
  rader.push(`  <updated>${updated}</updated>`);
  rader.push(`  <author><name>${SITE.name}</name><uri>${SITE.url}</uri></author>`);
  rader.push(`  <icon>${SITE.url}/favicon.svg</icon>`);
  /* Licensen står i flödet av samma skäl som i varje JSON-svar: ett dokument
     som hamnar i en läsare har tappat sin kontext, och attributionen är hela
     villkoret. Se LICENCE i lib/api.ts. */
  rader.push(
    `  <rights>${xmlEscape(
      `${LICENCE.name}. Attribution: ${LICENCE.attribution}. ${LICENCE.notice}`,
    )}</rights>`,
  );
  rader.push(`  <generator uri="${SITE.url}">${SITE.name}</generator>`);

  for (const post of poster) {
    const tid = rfc3339(post.date);
    rader.push('  <entry>');
    rader.push(`    <title>${xmlEscape(flodeRubrik(post))}</title>`);
    rader.push(`    <id>${flodeId(post.inspectionId)}</id>`);
    rader.push(`    <link rel="alternate" type="text/html" href="${flodeLank(post)}"/>`);
    /* `published` och `updated` är samma datum, och det är sant: en kontroll
       har ett datum och ändras inte i efterhand. Båda står med eftersom Atom
       låter läsaren välja vilken den sorterar på. */
    rader.push(`    <published>${tid}</published>`);
    rader.push(`    <updated>${tid}</updated>`);
    rader.push(`    <summary type="text">${xmlEscape(flodeSammanfattning(post))}</summary>`);
    /* Kommunen som kategori. Riksflödet blandar tretton kommuner, och en
       läsare som bara vill ha en av dem kan då filtrera själv. */
    rader.push(
      `    <category term="${xmlEscape(post.establishment.municipality.slug)}" ` +
        `label="${xmlEscape(post.establishment.municipality.city)}"/>`,
    );
    rader.push('  </entry>');
  }

  rader.push('</feed>');

  return new Response(`${rader.join('\n')}\n`, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
