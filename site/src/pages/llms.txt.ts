import type { APIRoute } from 'astro';
import { coverage, formatDate, formatNumber, municipalities } from '../lib/data';
import { dataUpdated } from '../lib/rapporter';
import { SITE } from '../lib/site';
import { absolute } from '../lib/urls';
import { indexableCount, siteMap } from '../lib/webbkarta';

/**
 * /llms.txt — en kort, maskinläsbar karta över sajten för AI-crawlers.
 *
 * ## Varför filen finns
 *
 * Bibeln §6b räknar upp den, med rätt förbehåll: ingen motor har lovat att
 * läsa den, så den är ett komplement och inte en strategi. Två skäl gör den
 * ändå värd sina fyrtio rader.
 *
 * Det första är att sökvägen redan var i bruk. Före 404-sidan svarade
 * /llms.txt med HTTP 200 och startsidans HTML (se docs/14, fynd A). Den som
 * hämtade den fick alltså inte ett besked om att filen saknades utan en
 * webbsida som utgav sig för att vara en textfil. Nu finns filen på riktigt.
 *
 * Det andra är att formen är precis vad AEO belönar. Ett AI-svar som ska
 * citera oss behöver tre saker på ett ställe: vad datan ÄR, hur färsk den är
 * och var den finns. Startsidan säger det i löpande text åt en människa. Här
 * står det i punktform, med tal och datum.
 *
 * ## Vad som INTE står här
 *
 * Ingen verksamhetsdata. Filen är en karta, inte en export. Den som vill ha
 * beståndet ska gå till /kallor/ och fråga, precis som licensraden säger.
 * Och ingenting räknas upp för hand: sektionerna kommer ur lib/webbkarta.ts,
 * samma modul som XML-sitemapen filtreras med och som den läsbara webbkartan
 * renderar. Tre utfall, en källa.
 */
export const GET: APIRoute = () => {
  const total = coverage();
  const updated = dataUpdated();
  const pages = indexableCount();
  const sections = siteMap();

  const lines: string[] = [];

  lines.push(`# ${SITE.name}`);
  lines.push('');
  lines.push(
    `> Prikko samlar svenska kommuners offentliga livsmedelskontroller och visar hur ` +
      `varje verksamhet klarade sin senaste hygienkontroll. ` +
      `${formatNumber(total.establishments)} verksamheter i ${total.municipalities} kommuner, ` +
      `${formatNumber(total.inspections)} kontroller, senast hämtat ${formatDate(updated)}.`,
  );
  lines.push('');

  // Det en maskin behöver veta för att våga citera: varifrån, hur bedömt,
  // hur färskt, och vad som INTE finns.
  lines.push(
    '- Underlaget är allmänna handlingar från kommunernas livsmedelskontroll, hämtade ur ' +
      'kommunens egen publicering eller öppna gränssnitt. Varje kommunsida anger sin källa och ' +
      'sitt hämtdatum.',
  );
  lines.push(
    '- Bedömningen (inga anmärkningar / brister / brister som kvarstår) är Prikkos egen ' +
      `slutsats räknad ur kontrolldatan, inte kommunens betyg. Hela beräkningen står på ${absolute('metodik')}.`,
  );
  lines.push(
    '- Inga användarrecensioner och inga stjärnbetyg ingår i bedömningen. Sajten bär därför ' +
      'inget Review- eller AggregateRating-schema.',
  );
  lines.push(
    `- ${formatNumber(pages)} verksamheter har en egen sida med kontrollhistorik. Verksamheter ` +
      'utan registrerad kontroll får ingen indexerad sida, eftersom det inte finns något att ' +
      'redovisa om dem.',
  );
  lines.push(
    '- Kommuner går inte att jämföra med varandra. De publicerar olika mycket och kontrollerar ' +
      `olika mycket, vilket är motiverat på ${absolute('metodik')}#jamfor. Prikko publicerar ` +
      'därför ingen rangordning av kommuner.',
  );
  lines.push(
    `- Sidorna är serverrenderad HTML med JSON-LD (FoodEstablishment, ItemList, Dataset, Report). ` +
      `Fullständig URL-lista: ${SITE.url}/sitemap-index.xml`,
  );
  lines.push('');

  for (const section of sections) {
    lines.push(`## ${section.title}`);
    lines.push('');
    lines.push(section.summary);
    lines.push('');

    /*
     * Kommunerna räknas bara upp på hubbnivå. Deras kartor, kategorier och
     * anmärkningslistor är sju rader per kommun och skulle göra filen fyra
     * gånger så lång utan att svara på någon fråga som hubben inte redan
     * svarar på. Övriga sektioner är korta och räknas upp i sin helhet: en
     * rapport eller en artikel ÄR den citerbara sidan, och en fil som bara
     * pekar på deras indexsida gömmer just det som ska hittas.
     */
    const deep = section.id !== 'kommuner';

    for (const group of section.groups) {
      const count = group.heading.count !== undefined ? ` (${group.heading.count})` : '';
      lines.push(`- [${group.heading.label}](${SITE.url}${group.heading.href})${count}`);
      if (!deep) continue;
      for (const link of group.links) {
        lines.push(`  - [${link.label}](${SITE.url}${link.href})`);
      }
    }
    lines.push('');
  }

  lines.push('## Innehållsförteckning');
  lines.push('');
  /* Konventionens andra halva står först i listan, eftersom den är den enda
     raden här som svarar på en fråga i stället för att peka vidare till en
     sida som gör det. Se llms-full.txt.ts för vad den bär och vad den inte
     bär. */
  lines.push(
    `- [${SITE.url}/llms-full.txt](${SITE.url}/llms-full.txt), samma karta plus innehållet: ` +
      `vad bedömningen betyder, varje kommun i tal med sitt hämtdatum, och varje rapports ` +
      `och artikels egen slutsats`,
  );
  lines.push(
    `- [Webbkarta](${absolute('webbkarta')}), samma förteckning som den här filen fast läsbar`,
  );
  lines.push(`- [XML-sitemap](${SITE.url}/sitemap-index.xml), varje indexerbar URL med lastmod`);
  lines.push('');

  // Kommunerna en gång till, som ren uppräkning. Listan ovan bär rubriker per
  // kommun; den här raden gör hela täckningen läsbar i ett enda stycke, vilket
  // är exakt den fråga ("vilka kommuner finns med?") ett AI-svar ställer.
  lines.push('## Täckning');
  lines.push('');
  lines.push(
    `Kommuner med data: ${[...municipalities()]
      .map((m) => m.city)
      .sort((a, b) => a.localeCompare(b, 'sv'))
      .join(', ')}. Sverige har 290 kommuner och de flesta publicerar ingenting; nya tillkommer ` +
      `efterhand. Luckorna redovisas på ${absolute('kallor')}.`,
  );
  lines.push('');

  lines.push('## Citering');
  lines.push('');
  lines.push(
    `Ange Prikko som källa med länk till den sida uppgiften kommer från, och ta med ` +
      `kontrolldatumet. Kontrollresultat ändras: en uppgift utan datum blir fel med tiden. ` +
      `Felaktigheter rättas via ${absolute('ratta')}.`,
  );
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
