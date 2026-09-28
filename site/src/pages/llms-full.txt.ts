import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { kodlista } from '../lib/api';
import {
  coverage,
  formatDate,
  formatNumber,
  municipalitySummaries,
  sourceFor,
} from '../lib/data';
import { REPORTS, dataUpdated } from '../lib/rapporter';
import { SITE } from '../lib/site';
import { absolute } from '../lib/urls';
import { indexableCount } from '../lib/webbkarta';

/**
 * /llms-full.txt, konventionens andra halva.
 *
 * ## Varför filen finns, och varför den inte är en till karta
 *
 * llms.txt är kartan: den säger vad sajten ÄR och vilka sektioner som finns.
 * Konventionen har en andra fil, och dess uppgift är en annan. Den ska bära
 * själva innehållet, så att en modell slipper hämta trettio sidor för att
 * hitta den rad som svarar på frågan. Fram till nu svarade /llms-full.txt 404
 * (mätt 2026-09-28), alltså fanns bara halva konventionen.
 *
 * Mätningen som motiverar den står i docs/66_citerbarheten.md. Två fynd ur
 * den styr formen här:
 *
 *   Bing citerar oss redan, men med gamla tal. Utdraget för Örebro löd
 *   "1 232 ... 312 har anmärkningar" den 2026-09-28, medan sidan samma dag sa
 *   1 233 och 318. Ett tal utan sitt datum blir fel utan att synas. Därför
 *   bär VARJE räknat tal i den här filen det datum det hämtades.
 *
 *   Frågan "vad betyder brister som kvarstår" gav i Bing två
 *   VERKSAMHETSSIDOR som träff, inte metodiksidan som faktiskt definierar
 *   uttrycket. Definitionen finns alltså men hittas inte. Därför står hela
 *   kodlistan här, högt upp, före allt annat innehåll.
 *
 * ## Regeln filen är skriven under
 *
 * INGEN UPPGIFT HÄR FÅR SAKNAS PÅ EN MÄNSKLIG SIDA. Filen sammanställer, den
 * publicerar inte. Varje tal nedan står synligt på den sida raden länkar
 * till: kommunens fördelning på kommunhubben, hämtdatumet i dess ruta "Om
 * uppgifterna", rapportens beskrivning som sidans meta description,
 * kodlistan på /metodik/ och i /api/v1/index.json. En fil som bar något eget
 * vore text skriven för maskiner som ingen läsare ser, och det är precis vad
 * sajten inte gör.
 *
 * Av samma skäl räknas ingenting upp för hand. Kommunerna kommer ur
 * municipalitySummaries(), rapporterna ur REPORTS, artiklarna ur samlingen
 * och kodlistan ur lib/api.ts, alltså samma källor som sidorna och API:et
 * renderar. Fyra utfall, en sanning.
 *
 * ## Varför de 17 130 verksamheterna INTE står här
 *
 * Det var förslaget, och det föll på ett tal. En rad per verksamhet med namn,
 * adress, bedömning, kontrolldatum och adress till sidan blir omkring 120
 * tecken. 17 130 rader är då ungefär 2,1 MB, mot 25 kB för filen som nu
 * finns, alltså åttio gånger så tung. En fil som ingen modell hämtar färdigt
 * är sämre än ingen fil. Uppräkningen finns redan på tre ytor som är byggda
 * för den: sitemapen, API:et och riksflödet. Skälet och de tre adresserna
 * står också i filens egen text, så att den som läser den utan att läsa koden
 * får veta var beståndet ligger.
 *
 * Talet räknas fram vid bygget och skrivs inte, så det kan inte bli osant när
 * beståndet växer.
 */
export const GET: APIRoute = async () => {
  const total = coverage();
  const updated = dataUpdated();
  const pages = indexableCount();
  const koder = kodlista();

  const lines: string[] = [];
  const p = (s = '') => lines.push(s);

  p(`# ${SITE.name}, fullständig innehållsförteckning`);
  p();
  p(
    `> Prikko samlar svenska kommuners offentliga livsmedelskontroller och visar hur varje ` +
      `verksamhet klarade sin senaste hygienkontroll. ` +
      `${formatNumber(total.establishments)} verksamheter i ${total.municipalities} kommuner, ` +
      `${formatNumber(total.inspections)} kontroller, senast hämtat ${formatDate(updated)}.`,
  );
  p();
  p(
    `Den här filen är den långa halvan av ${SITE.url}/llms.txt. Där står kartan över sajten; ` +
      `här står innehållet: vad bedömningen betyder, hur varje kommun ser ut i tal, och vad ` +
      `varje rapport och artikel kommit fram till. Allt är hämtat ur samma data som sidorna ` +
      `renderar, och ingenting här saknas på en sida en människa kan läsa.`,
  );
  p();

  /*
   * Citeringen först, före innehållet.
   *
   * Ordningen är avsiktlig och inte artighet. En modell som klipper filen
   * efter några tusen tecken ska ha fått villkoren innan den fått talen, och
   * det viktigaste villkoret är att bedömningen är VÅR slutsats och inte
   * kommunens betyg. Står det längst ned kan ett citat hämtas utan det.
   */
  p('## Så ska en uppgift härifrån citeras');
  p();
  p(
    '- Ange Prikko som källa och länka till den sida uppgiften kommer från, inte till den ' +
      'här filen.',
  );
  p(
    '- Ta alltid med kontrolldatumet eller hämtdatumet som står intill talet. Kontroller ' +
      'görs om och register ändras: en uppgift utan datum blir fel med tiden utan att det ' +
      'syns.',
  );
  p(
    '- Bedömningen ("inga anmärkningar", "brister", "brister som kvarstår") är Prikkos egen ' +
      'slutsats räknad ur kommunens kontrolldata. Den är INTE ett betyg kommunen satt, och ' +
      'Sverige har inget nationellt hygienbetyg. Skriv därför "enligt Prikkos bedömning" och ' +
      `aldrig "enligt kommunen". Hela beräkningen står på ${absolute('metodik')}.`,
  );
  p(
    '- Kommuner går inte att jämföra med varandra. De publicerar olika mycket och ' +
      'kontrollerar olika ofta, så en rangordning mellan kommuner vore inte en jämförelse ' +
      `utan en osanning. Motiveringen står på ${absolute('metodik')}#jamfor.`,
  );
  p(
    '- Inga användarrecensioner och inga stjärnbetyg ingår. Sajten bär varken Review- eller ' +
      'AggregateRating-schema, och en uppgift härifrån säger ingenting om maten.',
  );
  p(`- Felaktigheter rättas via ${absolute('ratta')}.`);
  p();

  /*
   * Kodlistan, ordagrant ur lib/api.ts.
   *
   * Den kopieras INTE hit. Samma funktion svarar /api/v1/index.json, så en
   * ändrad formulering kan inte ge två svar. Se kodlista().
   */
  p('## Vad orden betyder');
  p();
  p('Bedömningen, alltså det besked en verksamhetssida leder med:');
  p();
  for (const [kod, text] of Object.entries(koder.verdict)) {
    p(`- \`${kod}\`: ${text}`);
  }
  p();
  p('Varför en bedömning kan saknas:');
  p();
  for (const [kod, text] of Object.entries(koder.reason)) {
    p(`- \`${kod}\`: ${text}`);
  }
  p();
  p('Utfallet av en enskild kontroll:');
  p();
  for (const [kod, text] of Object.entries(koder.assessment)) {
    p(`- \`${kod}\`: ${text}`);
  }
  p();
  p('Sorten kontroll:');
  p();
  for (const [kod, text] of Object.entries(koder.type)) {
    p(`- \`${kod}\`: ${text}`);
  }
  p();
  p('Utfallet på ett enskilt kontrollområde:');
  p();
  for (const [kod, text] of Object.entries(koder.areaStatus)) {
    p(`- \`${kod}\`: ${text}`);
  }
  p();
  p(`Hela metoden, med räkneexempel: ${absolute('metodik')}`);
  p();

  /*
   * Kommunerna, en rad med tal per kommun.
   *
   * Det här är frågan "hur många restauranger i X har anmärkningar", och den
   * gick i dag bara att besvara genom att hämta kommunhubben och läsa ett
   * stapeldiagram. Talen är municipalitySummaries(), alltså exakt de som
   * rutan "Örebro i siffror" visar, och hämtdatumet är det som står i rutan
   * "Om uppgifterna" på samma sida.
   */
  p('## Kommunerna i tal');
  p();
  p(
    `Sverige har 290 kommuner och de flesta publicerar ingenting. ${total.municipalities} ` +
      `finns här; luckorna och varför de finns redovisas på ${absolute('kallor')}.`,
  );
  p();
  /*
   * NÄMNAREN SKRIVS UT I VARJE RAD, och det är en felrättning som aldrig hann
   * publiceras. Raden bar först "73 procent av de bedömda saknar
   * anmärkningar" för Örebro, medan kommunhubbens eget band samma dag visade
   * 70 procent. Båda är sanna och räknar olika: bandet delar med alla 1 233
   * verksamheter, municipalitySummary.cleanShare med de 1 186 bedömda. En
   * modell som ser det ena talet här och det andra på sidan har ingen
   * möjlighet att veta vilket den citerar.
   *
   * Lösningen är inte att välja nämnare åt läsaren utan att skriva ut den, så
   * att talet bär sin egen definition. Samma skäl som datumet bredvid talet.
   */
  p(
    'Andelen kan räknas på två nämnare och de ger olika tal. Nedan står den på de BEDÖMDA, ' +
      'eftersom en kommun som lämnar ut lite data annars ser sämre ut än en som lämnar ut ' +
      'mycket. Fördelningsbandet på kommunens egen sida räknar i stället på samtliga ' +
      'verksamheter. Båda talen är sanna, och därför står nämnaren utskriven i varje rad.',
  );
  p();
  for (const m of municipalitySummaries()) {
    const hamtat = sourceFor(m.slug)?.fetchedAt?.slice(0, 10);
    p(`### ${m.city}`);
    p();
    p(
      `${formatNumber(m.total)} verksamheter, varav ${formatNumber(m.assessed)} bedömda: ` +
        `${formatNumber(m.clean)} utan anmärkningar, ${formatNumber(m.minor)} med brister, ` +
        `${formatNumber(m.major)} med brister som kvarstår, ` +
        `${formatNumber(m.unassessed)} utan bedömning. ` +
        `${formatNumber(m.clean)} av de ${formatNumber(m.assessed)} bedömda saknar ` +
        `anmärkningar, alltså ${m.cleanShare} procent. ` +
        (m.latest ? `Senaste kontroll ${formatDate(m.latest)}. ` : '') +
        (hamtat ? `Uppgifterna hämtade ${formatDate(hamtat)}. ` : '') +
        `${absolute(m.slug)}`,
    );
    p();
  }

  /*
   * Rapporterna med sin egen slutsats, inte bara sin titel.
   *
   * En rapport ÄR den citerbara sidan: sajtens egna räknade sanningar om hela
   * beståndet. En förteckning som bara bär rubriken gömmer just det som ska
   * hittas. `description` är rapportens egen meta description och `lede` dess
   * ingress, båda synliga på sidan.
   *
   * Två datum per rapport, och båda behövs. Talen räknas om vid varje bygge,
   * så publiceringsdatumet är INTE talens datum. Den som citerar "73 840
   * kontroller" ska datera det till hämtningen och inte till publiceringen.
   */
  p('## Rapporter');
  p();
  p(
    `${REPORTS.length} rapporter, räknade ur hela beståndet. Talen i dem skrivs inte utan ` +
      `räknas om vid varje uppdatering, så publiceringsdatumet nedan gäller texten medan ` +
      `talen gäller ${formatDate(updated)}.`,
  );
  p();
  for (const r of REPORTS) {
    p(`### ${r.title}`);
    p();
    p(absolute('rapporter', r.slug));
    p();
    p(r.lede);
    p();
    p(r.description);
    p();
    p(`Först publicerad ${formatDate(r.published)}, talen hämtade ${formatDate(updated)}.`);
    p();
  }

  /*
   * Artiklarna. Skriven text med mänsklig avsändare, till skillnad från
   * rapporterna, så här står publiceringsdatum och eventuell ändring och
   * inget hämtdatum. Sorterade nyast först, samma ordning som indexsidan.
   */
  const artiklar = (await getCollection('artiklar', ({ data }) => !data.draft)).sort((a, b) =>
    b.data.published.localeCompare(a.data.published),
  );

  p('## Artiklar');
  p();
  p(
    `${artiklar.length} artiklar som förklarar kontrollen, orden i den och hur talen ska ` +
      'läsas. Till skillnad från rapporterna är de skrivna och inte räknade.',
  );
  p();
  for (const a of artiklar) {
    p(`### ${a.data.title}`);
    p();
    p(absolute('artiklar', a.id));
    p();
    p(a.data.lede);
    p();
    p(a.data.description);
    p();
    p(
      `${a.data.category}. Publicerad ${formatDate(a.data.published)}` +
        (a.data.updated ? `, uppdaterad ${formatDate(a.data.updated)}` : '') +
        '.',
    );
    p();
  }

  p('## Om tjänsten');
  p();
  p(`- ${absolute('metodik')}, hela beräkningen bakom bedömningen, med räkneexempel.`);
  p(`- ${absolute('kallor')}, varje kommuns källa, hämtdatum och kända luckor.`);
  p(`- ${absolute('om')}, vem som driver Prikko och varför.`);
  p(`- ${absolute('villkor')}, licens och villkor för vidareanvändning.`);
  p(`- ${absolute('ratta')}, rätta en uppgift.`);
  p();

  /*
   * Beståndet: var det finns, och varför det inte finns HÄR. Talet i texten
   * räknas fram, inte skrivs, så uppskattningen kan inte bli osann när
   * beståndet växer.
   */
  const radbredd = 120;
  const uppskattadMB = (total.establishments * radbredd) / 1_000_000;

  p('## Var beståndet finns, och varför det inte står i den här filen');
  p();
  p(
    `De ${formatNumber(total.establishments)} enskilda verksamheterna räknas inte upp här. ` +
      `En rad per verksamhet med namn, adress, bedömning, kontrolldatum och adress till ` +
      `sidan väger omkring ${radbredd} tecken, alltså ungefär ` +
      `${uppskattadMB.toFixed(1).replace('.', ',')} MB för hela beståndet, mot ` +
      `{{STORLEK}} kB för filen du läser. En ` +
      `innehållsförteckning som ingen hinner hämta färdigt svarar sämre än en kort som ` +
      `pekar rätt.`,
  );
  p();
  p('Uppräkningen finns i stället på de ytor som är byggda för den:');
  p();
  p(
    `- ${SITE.url}/sitemap-index.xml, varje indexerbar adress med lastmod. ` +
      `${formatNumber(pages)} verksamheter har en egen sida med kontrollhistorik. ` +
      'En verksamhet utan registrerad kontroll får ingen indexerad sida, eftersom det inte ' +
      'finns något att redovisa om den.',
  );
  p(
    `- ${SITE.url}/api/v1/index.json, hela beståndet som JSON, kommun för kommun, med ` +
      `kodlista och licensvillkor. Dokumentationen står på ${SITE.url}/api/.`,
  );
  p(
    `- ${SITE.url}/flode/riket.xml, nytt och ändrat, som flöde, för den som vill följa ` +
      'beståndet över tid i stället för att hämta om det.',
  );
  p();
  p(
    `Adressen till en enskild verksamhet är ${SITE.url}/{kommun}/{verksamhet}/, till exempel ` +
      `${absolute('stockholm', 'ag')}. Sidan bär JSON-LD av typen FoodEstablishment och ` +
      'leder med en självbärande mening om bedömningen och dess datum.',
  );
  p();

  /*
   * Filens egen storlek sätts sist, via en platshållare.
   *
   * Talet står mitt i texten och jämförs där med de 2,1 MB en uppräkning av
   * beståndet skulle väga, så det måste vara filens FÄRDIGA storlek och inte
   * storleken fram till den raden. Skillnaden var 23 mot 25 kB, alltså två
   * kilobyte fel i en jämförelse som hela avsnittet vilar på.
   *
   * Utbytet ändrar längden med några tecken, vilket inte kan flytta talet
   * avrundat till hela kilobyte.
   *
   * Storleken mäts i BYTE och inte i tecken. Svenska å, ä och ö är två byte
   * i UTF-8, och `String.length` gav därför 24 kB för en fil som väger 25 kB
   * över nätet. Talet står bredvid en jämförelse i megabyte och ska mena
   * samma sort.
   */
  const brodtext = lines.join('\n');
  const storlek = (new TextEncoder().encode(brodtext).length / 1024).toFixed(0);

  return new Response(brodtext.replace('{{STORLEK}}', storlek), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
