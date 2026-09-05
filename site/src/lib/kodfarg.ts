/**
 * Färgläggning av kodrutor, gjord VID BYGGET.
 *
 * ---------------------------------------------------------------------------
 * VARFÖR EN EGEN OCH INTE SHIKI
 * ---------------------------------------------------------------------------
 * Shiki finns redan i node_modules, som beroende till astro, och `astro:components`
 * exporterar en färdig `<Code />` som kör Shiki vid bygget utan en rad JavaScript
 * i webbläsaren. Det var alternativet, och det valdes bort av tre skäl.
 *
 *   1. VÅR JSON ÄR INTE GILTIG JSON. Rutorna på /api/ är KLIPPTA, och klippet
 *      skrivs ut: `"licence": { … },` och `… 1 061 till …`. En TextMate-grammatik
 *      för JSON läser ett `…` som ett fel och ger det ingen färg alls, eller
 *      rödmarkerar det. Här får klippet i stället en EGEN nivå, dämpad och
 *      kursiv, vilket är precis vad det ska säga: det här är inte data, det är
 *      en upplysning om att data saknas i rutan.
 *   2. SHIKI SKRIVER FÄRGERNA SOM INLINE-HEX i `style`-attribut. Sex rutor på
 *      sidan plus hjältens ruta ger då sju kopior av paletten i HTML:en, och
 *      paletten går inte längre att ändra på ett ställe. Klasserna nedan låter
 *      färgen bo i CSS bredvid sajtens övriga tokens, där den hör hemma.
 *   3. Vi färglägger två språk och sex rutor. Grammatiken nedan är 90 rader.
 *      En full TextMate-motor för det är att betala ett paketberoende för
 *      hundra gånger mer maskin än uppgiften kräver.
 *
 * Skulle sidan en dag behöva TypeScript, Python eller en tredje dialekt är
 * `<Code />` rätt svar och den här filen ska strykas. Gränsen går vid att det
 * fortfarande är JSON och en curl-rad.
 *
 * ---------------------------------------------------------------------------
 * KLASSERNA, OCH VAD DE BETYDER
 * ---------------------------------------------------------------------------
 * Färgvärdena står INTE här utan i `.kodkort` i api/index.astro, tillsammans
 * med härledningen ur tokens och det uppmätta kontrastvärdet mot den mörka
 * ytan. Här står bara vilken roll varje klass bär:
 *
 *   t-nyckel   ett fältnamn, alltså något som går att slå upp i fälttabellen
 *   t-strang   ett strängvärde
 *   t-tal      ett tal
 *   t-tom      null, true och false, alltså frånvaro och ja/nej
 *   t-skilje   klammer, hakparentes, kolon och komma
 *   t-klipp    `…`, alltså det vi tagit bort ur rutan
 *   t-kommando terminalens kommando
 *   t-flagga   en flagga till kommandot
 *
 * `set:html` i Astro skriver ut resultatet oescapat, alltså MÅSTE varje
 * textbit gå genom `escape()` innan den läggs in. Det görs på ett enda ställe,
 * i `bit()`, och ingen sträng får läggas till utanför den.
 */

export type Sprak = 'json' | 'bash' | 'text';

const escape = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const bit = (text: string, klass?: string): string =>
  klass ? `<span class="${klass}">${escape(text)}</span>` : escape(text);

/**
 * JSON, tecken för tecken.
 *
 * En sträng blir en NYCKEL om nästa tecken som inte är blanksteg är ett kolon.
 * Det är hela skillnaden mellan de två, och det är därför avgörandet sker
 * efter att strängen lästs klart och inte före.
 */
function json(kod: string): string {
  let ut = '';
  let i = 0;

  while (i < kod.length) {
    const c = kod[i];

    /* Klippet. `…` letar efter ett andra `…` PÅ SAMMA RAD och sväljer allt
       däremellan, eftersom våra klipp skrivs på båda formerna:
       `[ … 13 kommuner … ]` har två och `{ … }` har ett. Utan radgränsen hade
       ett ensamt `…` ätit upp resten av dokumentet fram till nästa. */
    if (c === '…') {
      const radslut = kod.indexOf('\n', i);
      const slutPa = radslut === -1 ? kod.length : radslut;
      const nasta = kod.indexOf('…', i + 1);
      const slut = nasta !== -1 && nasta < slutPa ? nasta + 1 : i + 1;
      ut += bit(kod.slice(i, slut), 't-klipp');
      i = slut;
      continue;
    }

    if (c === '"') {
      let j = i + 1;
      while (j < kod.length && kod[j] !== '"') {
        j += kod[j] === '\\' ? 2 : 1;
      }
      j = Math.min(j + 1, kod.length);
      const strang = kod.slice(i, j);

      let k = j;
      while (k < kod.length && /\s/.test(kod[k])) k += 1;

      ut += bit(strang, kod[k] === ':' ? 't-nyckel' : 't-strang');
      i = j;
      continue;
    }

    /* En siffra är alltid ett tal. Ett minus är det bara om en siffra följer,
       annars är det en bindestreckad text som råkat hamna utanför en sträng.
       Villkoret stod först som "siffra OCH nästa är siffra", och det missade
       varje ENSIFFRIGT tal: `"assessment": 0` fick ingen färg alls, och just
       de fälten är noll, ett eller två i varje svar sidan visar. */
    if (/\d/.test(c) || (c === '-' && /\d/.test(kod[i + 1] ?? ''))) {
      let j = i + 1;
      while (j < kod.length && /[\d.eE+-]/.test(kod[j])) j += 1;
      ut += bit(kod.slice(i, j), 't-tal');
      i = j;
      continue;
    }

    const ord = kod.slice(i, i + 5);
    if (ord.startsWith('null') || ord.startsWith('true')) {
      ut += bit(kod.slice(i, i + 4), 't-tom');
      i += 4;
      continue;
    }
    if (ord === 'false') {
      ut += bit(ord, 't-tom');
      i += 5;
      continue;
    }

    if ('{}[]:,'.includes(c)) {
      ut += bit(c, 't-skilje');
      i += 1;
      continue;
    }

    ut += bit(c);
    i += 1;
  }

  return ut;
}

/**
 * Terminalraden. Den enda formen sidan visar är `curl -s <adress>`, alltså
 * räcker en uppdelning på blanksteg. Adressen får ingen egen klass: den är
 * radens innehåll och ska läsa som det ljusaste på raden, precis som ett
 * strängvärde gör i JSON-rutan.
 */
function bash(kod: string): string {
  return kod
    .split('\n')
    .map((rad) =>
      rad
        .split(/(\s+)/)
        .map((del, n) => {
          if (/^\s+$/.test(del) || del === '') return escape(del);
          if (n === 0) return bit(del, 't-kommando');
          if (del.startsWith('-')) return bit(del, 't-flagga');
          return escape(del);
        })
        .join(''),
    )
    .join('\n');
}

export function farglagg(kod: string, sprak: Sprak = 'text'): string {
  if (sprak === 'json') return json(kod);
  if (sprak === 'bash') return bash(kod);
  return escape(kod);
}
