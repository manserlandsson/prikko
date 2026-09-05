/**
 * Sökregistrets innehåll och dess innehållsbaserade adress.
 *
 * Registret serverades tidigare från /sok-index.json med max-age=3600. Det gav
 * ett fel som en besökare faktiskt drabbades av: pipelinen körde på natten och
 * la in en ny kommun, men en webbläsare med en timme gammal kopia sökte vidare
 * i det gamla registret och hittade inte verksamheten. Filen såg färsk ut, den
 * var det inte.
 *
 * Ett innehållsbaserat namn löser båda halvorna av problemet på en gång. Så
 * länge datan är oförändrad är adressen oförändrad och kopian i cachen är per
 * definition rätt. Ändras datan ändras adressen, och webbläsaren har ingen
 * kopia att återanvända. Filen kan därmed cachas för alltid i stället för i en
 * timme, och en rättelse syns vid nästa sidladdning i stället för nästa timme.
 *
 * Hashen räknas på exakt den byte-sekvens som skickas ut, inte på datan
 * bakom. Två byggen av samma data ger samma sträng, samma adress och därmed
 * samma cacheträff.
 *
 * Modulen importeras av tre ställen: rutten som skriver filen och de två
 * konsumenterna (sökfältet i sidhuvudet och /sok). Alla tre läser samma
 * `SEARCH_INDEX_URL`, så en ny hash kan inte hamna på ett ställe men inte på
 * de andra.
 */
import { createHash } from 'node:crypto';
import { establishments, municipalities } from './data';
import { matkategori, matkategorierFor, type MatkategoriId } from './matkategori';
import { areaOf, linkedAreas } from './omraden';
import { avregistrerad } from './registrering';
import { utsnitt } from './kartrutor';

/** Ordningen speglar VERDICTS. -1 = ingen bedömning. */
const VERDICTS = ['clean', 'minor', 'major'];

/**
 * VARDAGSORDEN FÖR EN MATKATEGORI, bara som söktext.
 *
 * Kategorinamnet ensamt räcker inte, och skälet är vikningen: "Pizza" viks till
 * "pisa" och "pizzeria" till "piseria", alltså är det ena inte ett prefix av
 * det andra och den som skriver kedjans eller sortens vardagsord får noll. Det
 * är samma sak för Burgare och "hamburgare", som är HELA hål ett: 34 MAX i
 * registret, ordet "hamburgare" i två av namnen.
 *
 * Orden är AVSIKTLIGT bara böjningar och vardagsformer av kategorins eget namn.
 * Ingen underkategori står här: en `cuisine=japanese` är Asiatiskt och ska inte
 * bli sökbar på "kinesiskt", för det vore ett påstående om maten som datan inte
 * bär. Samma gräns som kartan drar mellan sökord och filter, se props.mk i
 * lib/kartrutor.ts.
 *
 * Tabellen bor här och inte i lib/matkategori.ts därför att den bara har en
 * konsument. Kategorin VET vad den heter; att den också går att söka på med
 * ett annat ord är sökningens sak.
 */
const MATKATEGORI_SOKORD: Partial<Record<MatkategoriId, string>> = {
  livsmedel: 'livsmedelsbutik matbutik mataffär',
  snabbmat: 'gatukök',
  'cafe-fik': 'kafé fik kaffe',
  pizza: 'pizzeria pizzor',
  asiatiskt: 'asiatisk asiatiska',
  bar: 'barer',
  burgare: 'hamburgare burger burgers',
  italienskt: 'italiensk italienska',
  bageri: 'bagare bageriet',
  medelhav: 'medelhavsmat',
  sallad: 'salladsbar',
  thai: 'thailändskt thailändsk',
  indiskt: 'indisk indiska',
  konditori: 'konditoriet',
  grill: 'grillbar',
  mellanostern: 'mellanösterns',
  glass: 'gelato glassbar',
};

/**
 * Registret som en enda JSON-sträng.
 *
 * Formatet är arrayer, inte objekt. Med 14 500 poster kostar nyckelnamnen i
 * ett objektformat mer än datan de beskriver.
 *
 * Den normaliserade söksträngen skickas INTE med. Den var en kopia av namn,
 * adress och ort i gemener och stod för ungefär halva filen. Klienten bygger
 * den själv en gång när registret laddats.
 *
 * Byggs en gång per byggprocess. Modulen importeras av sidhuvudet, som ligger
 * på 14 711 sidor, och att serialisera om registret per sida vore orimligt.
 */
function build(): string {
  const kommuner = municipalities();
  const kommunIndex = new Map(kommuner.map((m, i) => [m.slug, i]));
  const verdictIndex = new Map(VERDICTS.map((v, i) => [v, i]));

  const alla = establishments();

  /*
   * OMRÅDENA byggs FÖRE raderna, eftersom raderna pekar in i listan.
   *
   * Formen är oförändrad, se noten vid `o` längre ner. Det nya är `omradeNr`:
   * kommun och områdesslug till platsen i listan, plus ett, så att noll kan
   * betyda "inget område".
   */
  const omraden = kommuner.flatMap((m, i) =>
    linkedAreas(m.slug).map(
      (a) => [i, a.area.slug, a.area.name, a.count] as [number, string, string, number],
    ),
  );
  const omradeNr = new Map<string, number>();
  omraden.forEach(([k, slug], i) => omradeNr.set(`${kommuner[k].slug}/${slug}`, i + 1));

  /*
   * MATKATEGORIERNA SOM KOMBINATIONER, inte som en bitmask per rad.
   *
   * Klienten vill ha TEXT att söka i, inte bitar att tolka, och en verksamhet
   * bär nästan alltid samma uppsättning kategorier som tusen andra. Tabellen
   * blir därför en rad per FÖREKOMMANDE kombination, och raden bär ett litet
   * heltal in i den. Mätt på beståndet 2026-09-05: 17 146 rader men bara 138
   * skilda kombinationer, alltså som mest tre siffror per rad i stället för en
   * bitmask på upp till sju. Tabellen själv är 7 277 byte.
   *
   * Plats noll är tom med flit: noll betyder "ingen kategori", vilket 12 328 av
   * de 17 146 raderna är.
   */
  const mkText: string[] = [''];
  const mkNr = new Map<string, number>();
  const kombination = (ids: MatkategoriId[]): number => {
    if (ids.length === 0) return 0;
    const nyckel = ids.join(',');
    const funnen = mkNr.get(nyckel);
    if (funnen !== undefined) return funnen;
    const nr = mkText.length;
    mkText.push(
      ids
        .map((id) => `${matkategori(id).namn} ${MATKATEGORI_SOKORD[id] ?? ''}`.trim())
        .join(' '),
    );
    mkNr.set(nyckel, nr);
    return nr;
  };

  /*
   * RADEN ÄR OLIKA LÅNG, och det är ett budgetbeslut och inte slarv.
   *
   * De två sista platserna är kategorikombinationen och området, alltså det
   * som gör "pizzeria odenplan" och "kebab östermalm" sökbara. Ingen av dem
   * finns på alla rader: 4 818 av 17 146 har en kategori och 7 336 ligger i ett
   * område med egen sida, 9 347 har minst det ena. Att alltid skriva båda
   * platserna, alltså `,0,0` på de övriga, mättes till 35 218 byte mer rått och
   * 2 544 byte mer gzippat. Platserna utelämnas därför när de är tomma, och
   * klienten läser dem med `?? 0`. Hela tilläggets kostnad står i docs/63.
   */
  const rows = alla.map((e) => {
    const rad: Array<string | number> = [
      e.name,
      e.address ?? '',
      e.slug,
      kommunIndex.get(e.municipality.slug) ?? 0,
      e.verdict ? (verdictIndex.get(e.verdict) ?? -1) : -1,
    ];
    const mk = kombination(matkategorierFor(e));
    const omrade = omradeNr.get(`${e.municipality.slug}/${areaOf(e)?.slug}`) ?? 0;
    if (mk || omrade) rad.push(mk);
    if (omrade) rad.push(omrade);
    return rad;
  });

  /*
   * DE AVREGISTRERADE SOM EN LISTA RADNUMMER, inte som ett sjätte fält.
   *
   * Sökträffen måste bära samma märke som listorna och kartan, annars är
   * noten på sidan "en fälla man bara ser om man klickar in", se docs/35 §5.1.
   * Frågan är bara vad det kostar i en fil som ligger på varje sidvisning.
   *
   * Mätt på beståndet 2026-08-31: 30 rader av 17 066 är avregistrerade, alltså
   * 0,18 procent. Ett sjätte fält per rad hade skrivit `,0` sjuttontusen
   * gånger, ungefär 34 kB, för att bära trettio ettor. Den här listan är 30 tal
   * och under 200 byte.
   *
   * Formen är radnummer mot `e` ovan, av samma skäl som kommunen är ett index:
   * slugarna finns redan i registret och behöver inte upprepas. Klienten gör
   * listan till en Set en gång, se `loadIndex` i lib/sokforslag.ts.
   */
  const avreg = alla.flatMap((e, i) => (avregistrerad(e) ? [i] : []));

  return JSON.stringify({
    /*
     * Slug, ort och en etta för de kommuner som har en kartsida.
     *
     * Trean finns för att ägaren bad om det: "söker man på en kommun tex i sök
     * ska man komma till split screen på karta och lista". Kommunraden i
     * panelen pekar därför på `/<kommun>/karta/` när den finns, och på hubben
     * för de fyra som inte lämnar en enda koordinat. Villkoret är samma anrop
     * som kartsidans getStaticPaths gör, alltså inte en andra bedömning av
     * samma sak.
     *
     * En etta och inte ett booleskt värde: `true` är fyra tecken per rad i
     * JSON och `1` är ett, och registret ligger på varje sidvisning.
     */
    k: kommuner.map((m) =>
      utsnitt(m.slug) ? [m.slug, m.city, 1] : [m.slug, m.city],
    ),
    /*
     * OMRÅDENA, alltså Östermalm, Kungsholmen och de 146 andra.
     * ────────────────────────────────────────────────────────────────────
     * Ägaren 2026-08-25: "varför kan jag ej söka på områden som t.ex.
     * Östermalm eller Kungsholmen i sök?"
     *
     * Därför att de aldrig låg i registret. Det bar kommuner och verksamheter
     * och ingenting annat, så en sökning på Östermalm kunde bara ge träff om
     * ordet råkade stå i en ADRESS. Områdessidorna fanns hela tiden, 148 av
     * dem, men bara nåbara genom kommunsidans rullrad.
     *
     * Bara `linkedAreas`, alltså de som har en egen sida. Ett område med tre
     * verksamheter har ingen sida att peka på, och ett sökförslag som leder
     * till en 404 är sämre än inget förslag.
     *
     * Formen är [kommunindex, slug, namn, antal]. Kommunen som index och inte
     * som sträng, av samma skäl som verksamhetsraderna: registret ligger på
     * varje sidvisning och tolv slugar upprepade 148 gånger är ren vikt.
     * Antalet följer med så att panelen kan skriva "Östermalm, 412
     * verksamheter" utan ett andra anrop.
     */
    o: omraden,
    /*
     * KATEGORITEXTERNA, en per förekommande kombination.
     *
     * Klienten fogar strängen till radens söktext när registret landar, se
     * `extraText` i lib/sokforslag.ts. Att den skickas som text och inte som
     * bitar är hela poängen: sökningen ska kunna hitta ordet utan att veta att
     * det är en kategori, precis som den hittar ett gatunamn.
     */
    mk: mkText,
    v: VERDICTS,
    e: rows,
    /* Radnummer mot `e`, se `avreg` ovan. Nyckeln får inte heta `n`: den är
       tagen i kartans rutor för antalet på samma adress, och två register som
       använder samma bokstav för olika saker blandas ihop förr eller senare. */
    a: avreg,
  });
}

export const SEARCH_INDEX_BODY = build();

/**
 * 12 hexadecimala tecken ur SHA-256. Kortare än så och slumpen börjar spela
 * roll, längre och det är bara brus i URL:en. Filnamn, inte kryptografi.
 */
export const SEARCH_INDEX_HASH = createHash('sha256')
  .update(SEARCH_INDEX_BODY)
  .digest('hex')
  .slice(0, 12);

/** Adressen konsumenterna ska hämta. Byts i samma stund datan byts. */
export const SEARCH_INDEX_URL = `/sok-index/${SEARCH_INDEX_HASH}.json`;

/**
 * Den gamla adressen, som ligger kvar avsiktligt.
 *
 * Ett dokument i besökarens cache kan peka på en hash som inte längre finns
 * på servern. Utan reserv blir sökningen då helt död i stället för bara
 * inaktuell, alltså ett värre fel än det vi rättar. Konsumenterna faller
 * tillbaka hit när den hashade hämtningen misslyckas. Den här filen får
 * däremot INTE cachas länge, eftersom den är just den föränderliga adress vi
 * gick ifrån.
 */
export const SEARCH_INDEX_FALLBACK_URL = '/sok-index.json';

/**
 * Ett år, oföränderligt. Rimligt först nu: adressen är innehållet, så en fil
 * på den här adressen kan aldrig bli inaktuell.
 */
export const SEARCH_INDEX_CACHE_CONTROL = 'public, max-age=31536000, immutable';

/**
 * Reservens cachetid. Fem minuter räcker för att fånga en handfull hämtningar
 * från samma trasiga sidladdning utan att någon fastnar i gammal data.
 */
export const SEARCH_INDEX_FALLBACK_CACHE_CONTROL = 'public, max-age=300';
