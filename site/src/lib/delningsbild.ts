/**
 * Delningsbilden: ritverket, kortet och PNG-skrivaren.
 *
 * ============================================================================
 * 1. VAD DEN LÖSER
 * ============================================================================
 *
 * Mätt i `site/dist` 2026-09-05: 16 742 av 16 767 byggda sidor bar samma
 * `og-default.png`. Titel och beskrivning var unika per sida, bilden var det
 * inte, alltså såg en länk till ett kök i Vasastan likadan ut som en länk till
 * startsidan i varje chatt, varje Slack-kanal och varje iMessage. De 25 som
 * hade en egen bild var artiklarna, som bär sin egen illustration.
 *
 * ============================================================================
 * 2. VARFÖR BILDEN RITAS HÄR OCH INTE VID BYGGET
 * ============================================================================
 *
 * Filbudgeten avgör formen, inte smaken. Cloudflare Pages gratisplan tar
 * 20 000 filer per utgåva, se `FILTAK_GRATIS` i astro.config.mjs. Ett bygge
 * 2026-09-05 gav 18 171 filer, alltså 1 829 kvar, och beståndet växer med
 * varje kommun.
 *
 * En bild per verksamhet vid bygget är 17 146 nya filer och landar på 35 317,
 * alltså 177 procent av taket. En bild per SIDA är 17 868 nya filer och landar
 * på 36 039. Det spelar ingen roll om filen är PNG eller SVG: taket räknar
 * FILER, inte byte. Ägaren har sagt att uppgraderingen till den betalda planen
 * väntar tills Cloudflare själv klagar, så gränsen är hård.
 *
 * Vad rutten faktiskt kostade: EN fil, `public/delningsbild/underlag.json`,
 * 92 kB. Bygget gick från 18 171 till 18 172.
 *
 * Bilderna ritas i stället när någon ber om dem, i
 * `functions/dela/[[vag]].ts`. Samma resonemang och samma apparat som
 * `functions/api/marke.ts` redan använder för dekalen, där 34 386 filer var
 * skälet.
 *
 * SVG DUGER INTE, och det är inte en smaksak. Ingen av de sex ytor sajten
 * faktiskt delas på ritar SVG i en förhandsvisning: Facebook, X, LinkedIn,
 * Slack, iMessage och WhatsApp vill alla ha en rasterbild. Slacks egen
 * formatlista är png, jpg, jpeg, gif. Alltså måste kanten skriva en PNG, och
 * därför står det en PNG-skrivare längre ned i filen.
 *
 * ============================================================================
 * 3. MÅTTEN
 * ============================================================================
 *
 * 1 200 x 630. Det klarar varje dokumenterad gräns med marginal, hämtat
 * 2026-09-05:
 *
 *   Meta        rek. minst 1200 x 630, minst 600 x 315 för stort kort, max 8 MB
 *   LinkedIn    minst 1200 x 627, 1,91:1, max 5 MB
 *   iMessage    minst 900 px bred, huvudresursen max 1 MB
 *   WhatsApp    minst 300 px bred, högst 4:1, "under 600 kB"
 *   X           2:1 och under 5 MB enligt andrahandskällor; developer.x.com
 *               svarar 402 och kravet gick inte att belägga vid källan
 *
 * Uppmätt över hundra slumpade sidor ur bygget väger utfallet 13,7 till
 * 32,9 kB med 19,9 kB i medel, alltså under varenda gräns med en tiopotens
 * eller mer. Talet är lågt av en enda anledning: bilden är indexerad med 256
 * färger i stället för fullfärg, se PNG-skrivaren.
 *
 * ============================================================================
 * 4. VARFÖR BEDÖMNINGSMÄRKET INTE ÄR MED
 * ============================================================================
 *
 * Detta är kortets svåraste beslut och det är fattat åt ett håll.
 *
 * Kortet bär verksamhetens NAMN, ADRESS och DATUMET för senaste kontrollen.
 * Det bär INTE bedömningen, varken som märke, som färg eller som ord.
 *
 * Skäl ett, och det räcker ensamt: bilden lämnar sidan. På verksamhetssidan
 * står märket bland kontrollhistoriken, avvikelsernas ordalydelse, kommunens
 * eget besked och verksamhetens svar. I en chatt står det ensamt. "Brister"
 * i ett rött märke, utan en enda av de raderna intill, är ett negativt
 * påstående om ett namngivet företag publicerat av oss på en yta där ingen
 * kan läsa vidare. Det är inte samma sak som samma märke på sidan, och
 * skillnaden är hela poängen.
 *
 * Skäl två är att sajten redan har erkänt problemet på en annan yta. Märkets
 * färger klarar inte WCAG 1.4.11 ensamma, och docs/24 § 2 skriver rakt ut att
 * undantaget håller därför att bedömningens TEXT står intill märket på 19 av
 * 21 ritställen. En delningsbild vore det tjugoandra stället, och det värsta:
 * bilden skalas ner till några hundra pixlar i en förhandsvisning.
 *
 * Skäl tre är maskotgränsen i docs/24 § 2, "maskoten får aldrig stå bredvid en
 * bedömning av en namngiven verksamhet". Kortet bär ordmärket, alltså
 * avsändaren. Med en bedömning på samma yta hade avsändaren stått bredvid en
 * bedömning av ett namngivet företag, vilket är precis det förbudet beskriver.
 * Utan bedömning finns frågan inte.
 *
 * Skäl fyra är att frånvaron annars börjar betyda något. Ett kort med grönt
 * märke som delas och ett kort utan märke som inte delas är en rangordning
 * byggd av delningsstatistik. Samma fälla som `lib/emblem.ts` avsnitt 2
 * beskriver för det dynamiska emblemet.
 *
 * Vad kortet TAPPAR på det: det säger inte hur det gick. Det är avsiktligt.
 * Kortet ska få någon att klicka på en länk om ett bestämt ställe, inte
 * ersätta sidan. Namn, adress och kontrolldatum är sanna oavsett bedömning och
 * gör kortet unikt per verksamhet, vilket var hela bristen.
 *
 * ============================================================================
 * 5. VARFÖR INGEN TEXT KOMMER FRÅN ANROPET
 * ============================================================================
 *
 * Samma regel som `functions/api/marke.ts` skriver ut: funktionen ritar aldrig
 * text som anroparen skickat. Varje ord på kortet läses ur verksamhetens EGEN
 * byggda sida, ur dess JSON-LD och dess metataggar. Utan den regeln hade vem
 * som helst kunnat beställa ett Prikkokort med vilket företagsnamn och vilket
 * påstående som helst på, och den bilden hade burit vårt ordmärke.
 */

/* -------------------------------------------------------------------------- */
/* Underlaget                                                                  */
/* -------------------------------------------------------------------------- */

/** En glyf: `a` är stegbredden i typsnittsenheter, `d` är konturen. */
export interface Glyf {
  a: number;
  d?: number[];
}

/**
 * Innehållet i `public/delningsbild/underlag.json`.
 * Skrivs av `scripts/bygg-delningsbild-underlag.mjs`.
 */
export interface Underlag {
  /** Enheter per fyrkant. 1 000 för Instrument Sans. */
  upm: number;
  /**
   * Två vikter, nycklade på tal. 400 är brödtext och 600 är rubrik, alltså
   * exakt de två tokens.css tillåter: "använd endast 400 och 600
   * (Apple-disciplin, aldrig 700)".
   */
  vikter: Record<string, Record<string, Glyf>>;
  /** Ordmärket som täckningsmask, base64-kodade alfavärden. */
  ordmarke: { b: number; h: number; px: string };
}

export type Vikt = 400 | 600;

/* -------------------------------------------------------------------------- */
/* Paletten                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Fyra färgfamiljer med 64 steg var, alltså 256 poster.
 *
 * Varför indexerad och inte fullfärg: en fullfärgsbild om 1 200 x 630 är
 * 2,27 MB rådata som ska komprimeras i kanten, och kanten har 10 ms processor
 * per anrop på gratisplanen. En indexerad bild är 756 kB och komprimeras på
 * 3 till 5 ms, uppmätt över tolv körningar av det längsta namn beståndet har.
 * Ritningen kostar 1 till 4 ms till, alltså ligger hela kortet under taket
 * med marginal, men inte med så mycket att fullfärg hade rymts.
 *
 * Fyra familjer räcker eftersom ingenting på kortet ligger ovanpå något
 * annat: varje bokstav och varje yta möter bara bottnen.
 *
 * Färgerna är sajtens egna, ur tokens.css.
 */
const BOTTEN: [number, number, number] = [255, 255, 255]; // --card
const FAMILJER: [number, number, number][] = [
  [29, 29, 31], // 0  bläck, sajtens brödtext
  [110, 110, 115], // 1  --ink-quiet #6E6E73
  [0, 123, 224], // 2  --brand #007BE0
  [222, 222, 226], // 3  hårlinje, --hairline mot vitt
];

export const BREDD = 1200;
export const HOJD = 630;

/** Bygger de 256 posterna: familj 0 ligger på 0..63, familj 1 på 64..127. */
function palett(): Uint8Array {
  const p = new Uint8Array(768);
  for (let f = 0; f < 4; f++) {
    const [r, g, b] = FAMILJER[f];
    for (let i = 0; i < 64; i++) {
      const t = i / 63;
      const o = (f * 64 + i) * 3;
      p[o] = Math.round(BOTTEN[0] + (r - BOTTEN[0]) * t);
      p[o + 1] = Math.round(BOTTEN[1] + (g - BOTTEN[1]) * t);
      p[o + 2] = Math.round(BOTTEN[2] + (b - BOTTEN[2]) * t);
    }
  }
  return p;
}

/* -------------------------------------------------------------------------- */
/* Duken                                                                       */
/* -------------------------------------------------------------------------- */

/** Bildens pixlar som palettindex. 0 är ren botten. */
export type Duk = Uint8Array;

export function duk(): Duk {
  return new Uint8Array(BREDD * HOJD);
}

/**
 * Lägger en täckning på duken.
 *
 * Möter täckningen en pixel som redan bär samma familj tas det högre värdet,
 * så att två bokstäver som nuddar varandra inte river hål i varandra. Möter
 * den en annan familj vinner den nya, vilket bara kan hända om layouten är fel
 * och därför får synas.
 */
function lagg(d: Duk, i: number, tackning: number, familj: number): void {
  if (tackning <= 0.002) return;
  const niva = tackning >= 1 ? 63 : Math.round(tackning * 63);
  if (niva === 0) return;
  const ny = familj * 64 + niva;
  const gammal = d[i];
  if (gammal !== 0 && (gammal >> 6) === familj) {
    if (ny > gammal) d[i] = ny;
  } else {
    d[i] = ny;
  }
}

/** En fylld rektangel. Halva pixlar kantutjämnas inte, alla mått är heltal. */
export function rektangel(
  d: Duk,
  x: number,
  y: number,
  b: number,
  h: number,
  familj: number,
  tackning = 1,
): void {
  const x0 = Math.max(0, Math.round(x));
  const y0 = Math.max(0, Math.round(y));
  const x1 = Math.min(BREDD, Math.round(x + b));
  const y1 = Math.min(HOJD, Math.round(y + h));
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) lagg(d, py * BREDD + px, tackning, familj);
  }
}

/** Ordmärket, ur underlagets täckningsmask. */
export function ordmarke(d: Duk, u: Underlag, x: number, y: number, familj: number): void {
  const { b, h, px } = u.ordmarke;
  const bin = atob(px);
  for (let iy = 0; iy < h; iy++) {
    const dy = y + iy;
    if (dy < 0 || dy >= HOJD) continue;
    for (let ix = 0; ix < b; ix++) {
      const dx = x + ix;
      if (dx < 0 || dx >= BREDD) continue;
      lagg(d, dy * BREDD + dx, bin.charCodeAt(iy * b + ix) / 255, familj);
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Rasteraren                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Täckningsytan: signerad area per pixel, summerad radvis till slut.
 *
 * Algoritmen är den Raph Levien beskrev i font-rs. Varje linjesegment lägger
 * sin signerade area i de pixlar det passerar, och en löpande summa längs
 * raden ger täckningen. Kostnaden följer konturens LÄNGD och inte bokstavens
 * yta, vilket är skälet att den får plats i 10 ms: ett namn på trettio tecken
 * i 74 px har omkring 30 000 kantpixlar, inte 200 000 yta.
 *
 * Alternativet var att provta varje pixel fyra gånger fyra, alltså sexton
 * gånger ytan. Det hade blivit 3,2 miljoner provtagningar för samma rad.
 */
class Yta {
  readonly x0: number;
  readonly y0: number;
  readonly b: number;
  readonly h: number;
  /** Radlängd med två pixlar marginal: sista segmentet kan skriva förbi kanten. */
  private readonly steg: number;
  private readonly a: Float32Array;

  constructor(x0: number, y0: number, b: number, h: number) {
    this.x0 = x0;
    this.y0 = y0;
    this.b = b;
    this.h = h;
    this.steg = b + 2;
    this.a = new Float32Array(this.steg * h);
  }

  linje(ax: number, ay: number, bx: number, by: number): void {
    if (ay === by) return;
    let dir = 1;
    let p0x = ax;
    let p0y = ay;
    let p1x = bx;
    let p1y = by;
    if (p0y > p1y) {
      dir = -1;
      p0x = bx;
      p0y = by;
      p1x = ax;
      p1y = ay;
    }
    const dxdy = (p1x - p0x) / (p1y - p0y);
    let x = p0x;
    if (p0y < 0) x -= p0y * dxdy;
    const yStart = Math.max(0, Math.floor(p0y));
    const yStop = Math.min(this.h, Math.ceil(p1y));

    for (let y = yStart; y < yStop; y++) {
      const rad = y * this.steg;
      const dy = Math.min(y + 1, p1y) - Math.max(y, p0y);
      const xnext = x + dxdy * dy;
      const d = dy * dir;
      const xlo = x < xnext ? x : xnext;
      const xhi = x < xnext ? xnext : x;
      const xloGolv = Math.floor(xlo);
      const xhiTak = Math.ceil(xhi);
      const i0 = xloGolv | 0;
      const i1 = xhiTak | 0;

      if (i1 <= i0 + 1) {
        const xmf = 0.5 * (x + xnext) - xloGolv;
        if (i0 >= 0 && i0 < this.steg - 1) {
          this.a[rad + i0] += d - d * xmf;
          this.a[rad + i0 + 1] += d * xmf;
        }
      } else if (i0 >= 0 && i1 < this.steg) {
        const s = 1 / (xhi - xlo);
        const x0f = xlo - xloGolv;
        const a0 = 0.5 * s * (1 - x0f) * (1 - x0f);
        const x1f = xhi - xhiTak + 1;
        const am = 0.5 * s * x1f * x1f;
        this.a[rad + i0] += d * a0;
        if (i1 === i0 + 2) {
          this.a[rad + i0 + 1] += d * (1 - a0 - am);
        } else {
          const a1 = s * (1.5 - x0f);
          this.a[rad + i0 + 1] += d * (a1 - a0);
          for (let xi = i0 + 2; xi < i1 - 1; xi++) this.a[rad + xi] += d * s;
          const a2 = a1 + (i1 - i0 - 3) * s;
          this.a[rad + i1 - 1] += d * (1 - a2 - am);
        }
        this.a[rad + i1] += d * am;
      }
      x = xnext;
    }
  }

  /** Summerar radvis och lägger täckningen på duken. */
  toning(d: Duk, familj: number): void {
    for (let y = 0; y < this.h; y++) {
      const dy = this.y0 + y;
      if (dy < 0 || dy >= HOJD) continue;
      let summa = 0;
      const rad = y * this.steg;
      for (let x = 0; x < this.b; x++) {
        summa += this.a[rad + x];
        const t = summa < 0 ? -summa : summa;
        if (t <= 0.002) continue;
        const dx = this.x0 + x;
        if (dx < 0 || dx >= BREDD) continue;
        lagg(d, dy * BREDD + dx, t > 1 ? 1 : t, familj);
      }
    }
  }
}

/**
 * Hur fint en kurva delas i räta linjer.
 *
 * Antalet följer kontrollpunktens avstånd från kordan, alltså kurvans faktiska
 * krökning i pixlar, inte en fast siffra. Toleransen 0,1 px ligger under vad
 * kantutjämningens 64 steg kan visa. Taket på 24 finns för att en enda
 * trasig koordinat annars kan äta hela processorbudgeten.
 */
function delar(avvikelse: number): number {
  const n = Math.ceil(Math.sqrt(avvikelse / 0.1));
  return n < 1 ? 1 : n > 24 ? 24 : n;
}

/* -------------------------------------------------------------------------- */
/* Text                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Städar en sträng innan den ritas.
 *
 * Tre namn i källdatan bär radbrytningar och ett bär en tabb, och mallarna kan
 * skriva mjuka bindestreck. Ingen av dem har någon kontur i underlaget, alltså
 * städas de här och inte i rasteraren.
 */
export function stada(text: string): string {
  return text
    .replace(/­/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Textens bredd i pixlar. `sparr` är extra luft per tecken, i pixlar. */
export function bredd(
  u: Underlag,
  text: string,
  storlek: number,
  vikt: Vikt = 400,
  sparr = 0,
): number {
  const glyfer = u.vikter[vikt];
  const skala = storlek / u.upm;
  let b = 0;
  for (const ch of text) {
    const g = glyfer[ch];
    if (!g) continue;
    b += g.a * skala + sparr;
  }
  return b > 0 ? b - sparr : 0;
}

/**
 * Ritar en textrad med vänsterkant i `x` och baslinje i `y`.
 *
 * Kerning finns inte. Underlaget bär stegbredder och konturer, inget mer, och
 * `fontkitten` har ingen layoutmotor. Följden är mätbar: par som "Va" och "To"
 * blir någon procent lösare än på sajten. Det syns inte i en förhandsvisning
 * på 360 px bredd, och alternativet var en GPOS-tolk i kanten.
 */
export function text(
  d: Duk,
  u: Underlag,
  s: string,
  x: number,
  y: number,
  storlek: number,
  familj: number,
  vikt: Vikt = 400,
  sparr = 0,
): void {
  const glyfer = u.vikter[vikt];
  const skala = storlek / u.upm;
  let penna = x;

  for (const ch of s) {
    const g = glyfer[ch];
    if (!g) continue;
    if (g.d) glyf(d, g.d, penna, y, skala, familj);
    penna += g.a * skala + sparr;
  }
}

/** En glyf: konturen skalas, vänds rättvänd och rastreras i sin egen ruta. */
function glyf(
  d: Duk,
  cmd: number[],
  x: number,
  baslinje: number,
  skala: number,
  familj: number,
): void {
  /* Rutan räknas ur konturens egna ytterpunkter i stället för ur en fast
     marginal: ett gement "a" behöver en fjärdedel av ett versalt "Å", och ytan
     är den enda kostnad som växer med kvadraten. */
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < cmd.length; ) {
    const op = cmd[i++];
    const n = op === 0 || op === 1 ? 2 : op === 2 ? 4 : op === 3 ? 6 : 0;
    for (let k = 0; k < n; k += 2) {
      const px = cmd[i + k];
      const py = cmd[i + k + 1];
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }
    i += n;
  }
  if (minX === Infinity) return;

  const x0 = Math.floor(x + minX * skala) - 1;
  const y0 = Math.floor(baslinje - maxY * skala) - 1;
  const b = Math.ceil(x + maxX * skala) - x0 + 2;
  const h = Math.ceil(baslinje - minY * skala) - y0 + 2;
  if (b <= 0 || h <= 0 || x0 > BREDD || y0 > HOJD || x0 + b < 0 || y0 + h < 0) return;

  const yta = new Yta(x0, y0, b, h);
  /* Typsnittets y pekar uppåt, bildens nedåt. */
  const tx = (v: number) => x + v * skala - x0;
  const ty = (v: number) => baslinje - v * skala - y0;

  let px = 0;
  let py = 0;
  let sx = 0;
  let sy = 0;

  for (let i = 0; i < cmd.length; ) {
    const op = cmd[i++];
    if (op === 0) {
      px = tx(cmd[i++]);
      py = ty(cmd[i++]);
      sx = px;
      sy = py;
    } else if (op === 1) {
      const nx = tx(cmd[i++]);
      const ny = ty(cmd[i++]);
      yta.linje(px, py, nx, ny);
      px = nx;
      py = ny;
    } else if (op === 2) {
      const cx = tx(cmd[i++]);
      const cy = ty(cmd[i++]);
      const nx = tx(cmd[i++]);
      const ny = ty(cmd[i++]);
      const n = delar(Math.hypot(cx - (px + nx) / 2, cy - (py + ny) / 2));
      let lx = px;
      let ly = py;
      for (let k = 1; k <= n; k++) {
        const t = k / n;
        const m = 1 - t;
        const qx = m * m * px + 2 * m * t * cx + t * t * nx;
        const qy = m * m * py + 2 * m * t * cy + t * t * ny;
        yta.linje(lx, ly, qx, qy);
        lx = qx;
        ly = qy;
      }
      px = nx;
      py = ny;
    } else if (op === 3) {
      const c1x = tx(cmd[i++]);
      const c1y = ty(cmd[i++]);
      const c2x = tx(cmd[i++]);
      const c2y = ty(cmd[i++]);
      const nx = tx(cmd[i++]);
      const ny = ty(cmd[i++]);
      const n = delar(
        Math.max(
          Math.hypot(c1x - px, c1y - py),
          Math.hypot(c2x - nx, c2y - ny),
        ),
      );
      let lx = px;
      let ly = py;
      for (let k = 1; k <= n; k++) {
        const t = k / n;
        const m = 1 - t;
        const qx = m * m * m * px + 3 * m * m * t * c1x + 3 * m * t * t * c2x + t * t * t * nx;
        const qy = m * m * m * py + 3 * m * m * t * c1y + 3 * m * t * t * c2y + t * t * t * ny;
        yta.linje(lx, ly, qx, qy);
        lx = qx;
        ly = qy;
      }
      px = nx;
      py = ny;
    } else {
      yta.linje(px, py, sx, sy);
      px = sx;
      py = sy;
    }
  }
  yta.linje(px, py, sx, sy);
  yta.toning(d, familj);
}

/* -------------------------------------------------------------------------- */
/* Radbrytning                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Bryter en text på ordmellanrum, högst `rader` rader, med hängande punkter
 * på den sista om resten inte får plats.
 */
export function bryt(
  u: Underlag,
  s: string,
  storlek: number,
  maxBredd: number,
  rader: number,
  vikt: Vikt = 400,
): string[] {
  const ord = stada(s).split(' ');
  const ut: string[] = [];
  let rad = '';

  for (let i = 0; i < ord.length; i++) {
    const prov = rad ? `${rad} ${ord[i]}` : ord[i];
    if (bredd(u, prov, storlek, vikt) <= maxBredd || !rad) {
      rad = prov;
      continue;
    }
    ut.push(rad);
    if (ut.length === rader - 1) {
      /* Sista raden: ta med så mycket som får plats av det som är kvar. */
      ut.push(korta(u, ord.slice(i).join(' '), storlek, maxBredd, vikt));
      return ut;
    }
    rad = ord[i];
  }
  if (rad) ut.push(korta(u, rad, storlek, maxBredd, vikt));
  return ut;
}

/** Kortar en rad med hängande punkter tills den ryms. */
export function korta(
  u: Underlag,
  s: string,
  storlek: number,
  maxBredd: number,
  vikt: Vikt = 400,
): string {
  if (bredd(u, s, storlek, vikt) <= maxBredd) return s;
  let kvar = s;
  while (kvar.length > 1 && bredd(u, `${kvar}…`, storlek, vikt) > maxBredd) {
    kvar = kvar.slice(0, -1);
  }
  return `${kvar.trimEnd()}…`;
}

/* -------------------------------------------------------------------------- */
/* Kortet                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Det kortet säger. Fylls ur sidans egen HTML, aldrig ur anropet.
 *
 * `etikett` och `varde` är det nedre faktaparet, alltså sajtens egen form
 * "liten etikett över stort tal" som verksamhetssidan hämtade från Booli.
 */
export interface Kort {
  /** Liten rad över rubriken. Verksamhetskortet skriver "Hygienkontroll". */
  ogonbryn?: string;
  rubrik: string;
  underrad?: string;
  /** Faktaparet nere till vänster: liten etikett över ett värde. */
  etikett?: string;
  varde?: string;
  /** Ersätter faktaparet på sidor som inte har en enskild uppgift att visa. */
  fot?: string;
}

const MARGINAL = 80;
const INNE = BREDD - MARGINAL * 2;

const BLACK = 0;
const TYST = 1;
const BLA = 2;
const HARLINJE = 3;

/* Faktaraden ligger stilla. Se resonemanget vid `rita()`. */
const HARLINJE_Y = 468;
const ETIKETT_Y = 516;
const VARDE_Y = 562;

/** Textblockets fria fält: under ordmärket, ovanför hårlinjen. */
const FALT_TOPP = 152;
const FALT_BOTTEN = HARLINJE_Y - 46;

/** En rad i mitten: text, storlek, vikt, färg, och avstånd från raden ovanför. */
interface Rad {
  s: string;
  storlek: number;
  vikt: Vikt;
  familj: number;
  sparr: number;
  /** Baslinjens avstånd från föregående rads baslinje. Noll på första raden. */
  fore: number;
}

/**
 * Rubrikens storlek: största som ryms utan att kortas.
 *
 * Uppmätt över 17 146 verksamheter är namnet 17 tecken i median, 29 tecken hos
 * var tionde, 41 hos var hundrade och 124 som längst. Vid 74 px ryms omkring
 * 24 tecken på en rad, alltså skulle var tionde namn kortas om storleken låg
 * fast. Trappan slutar på 44 px, där två rader rymmer ungefär 80 tecken och
 * bara den yttersta svansen får hängande punkter.
 */
function rubrikRader(u: Underlag, s: string, maxRader: number): { storlek: number; rader: string[] } {
  let sista = { storlek: 44, rader: [] as string[] };
  for (const storlek of [74, 62, 52, 44]) {
    const rader = bryt(u, s, storlek, INNE, maxRader, 600);
    sista = { storlek, rader };
    if (!rader.some((r) => r.endsWith('…'))) break;
  }
  return sista;
}

/** Ritar hela kortet och returnerar duken. */
export function rita(u: Underlag, kort: Kort): Duk {
  const d = duk();

  /* Ordmärket uppe till vänster, alltså avsändaren först. Det står i
     märkesblått och aldrig i bedömningsfärg, se § 4 i huvudet. */
  ordmarke(d, u, MARGINAL, 64, BLA);

  /* ---------------------------------------------------------------------- */
  /* Raderna i mitten                                                        */
  /* ---------------------------------------------------------------------- */

  const rader: Rad[] = [];

  if (kort.ogonbryn) {
    /* Versaler med spärr. Sajten sätter aldrig versaler i brödtext, men den
       lilla etiketten över ett värde är samma grepp som FactGrid använder, och
       versalerna gör att raden inte konkurrerar med namnet. */
    rader.push({
      s: kort.ogonbryn.toUpperCase(),
      storlek: 24,
      vikt: 600,
      familj: BLA,
      sparr: 2.2,
      fore: 0,
    });
  }

  const harOgonbryn = rader.length > 0;
  const { storlek, rader: rubrik } = rubrikRader(u, kort.rubrik, kort.underrad ? 2 : 3);
  rubrik.forEach((s, i) => {
    rader.push({
      s,
      storlek,
      vikt: 600,
      familj: BLACK,
      sparr: 0,
      /* Avståndet räknas baslinje till baslinje, alltså måste rubrikens egen
         versalhöjd ingå. Utan den la sig namnets överkant ovanpå ögonbrynet. */
      fore: i > 0
        ? Math.round(storlek * 1.16)
        : harOgonbryn
          ? Math.round(storlek * 0.72) + 30
          : 0,
    });
  });

  if (kort.underrad) {
    bryt(u, kort.underrad, 32, INNE, 2).forEach((s, i) => {
      rader.push({
        s,
        storlek: 32,
        vikt: 400,
        familj: TYST,
        sparr: 0,
        fore: i === 0 ? Math.round(storlek * 0.8) : 44,
      });
    });
  }

  /*
   * Blocket centreras i fältet i stället för att börja på en fast rad.
   *
   * Det första utkastet lade blocket vid en fast överkant och faktaraden vid
   * en fast underkant, och då la sig adressen på hårlinjen så fort namnet
   * behövde två rader. Var tionde verksamhet har ett namn på 29 tecken eller
   * mer, alltså var det inte ett kantfall. Centrering löser båda: ett kort
   * namn får luft omkring sig, ett långt växer åt båda håll, och avståndet
   * ner till hårlinjen kan aldrig bli noll.
   *
   * Höjden räknas från versalhöjden på första raden till underlängden på den
   * sista, alltså den optiska höjden och inte radrutorna. 0,72 och 0,26 av
   * storleken är Instrument Sans egna mått avrundade.
   */
  const mellan = rader.reduce((n, r) => n + r.fore, 0);
  const hojd = rader.length
    ? rader[0].storlek * 0.72 + mellan + rader[rader.length - 1].storlek * 0.26
    : 0;
  let y = FALT_TOPP + (FALT_BOTTEN - FALT_TOPP - hojd) / 2 + rader[0].storlek * 0.72;

  for (const r of rader) {
    y += r.fore;
    text(d, u, r.s, MARGINAL, Math.round(y), r.storlek, r.familj, r.vikt, r.sparr);
  }

  /* ---------------------------------------------------------------------- */
  /* Faktaraden                                                              */
  /* ---------------------------------------------------------------------- */

  /*
   * Faktaraden sitter fast vid nederkanten och inte efter texten ovanför.
   * Namn på en, två eller tre rader skulle annars flytta den upp och ner, och
   * ett kort som ser olika ut beroende på hur långt namnet råkar vara läses
   * som slarv i en tråd där flera länkar ligger under varandra.
   */
  rektangel(d, MARGINAL, HARLINJE_Y, INNE, 1, HARLINJE);

  const hoger = 'prikko.se';
  const hogerBredd = bredd(u, hoger, 30);

  if (kort.etikett && kort.varde) {
    text(d, u, kort.etikett.toUpperCase(), MARGINAL, ETIKETT_Y, 22, TYST, 400, 1.8);
    text(
      d,
      u,
      korta(u, kort.varde, 36, INNE - hogerBredd - 60, 600),
      MARGINAL,
      VARDE_Y,
      36,
      BLACK,
      600,
    );
  } else if (kort.fot) {
    text(d, u, korta(u, kort.fot, 30, INNE - hogerBredd - 60), MARGINAL, VARDE_Y, 30, TYST);
  }

  /* Adressen till höger på värdets baslinje. Den finns för den som ser bilden
     utan att se länken, alltså i en skärmdump eller i ett bildsvar. */
  text(d, u, hoger, BREDD - MARGINAL - hogerBredd, VARDE_Y, 30, TYST);

  /* Listen längst ned är samma tolv pixlar som og-default.png bär, så att de
     två bilderna läses som samma avsändare. */
  rektangel(d, 0, HOJD - 12, BREDD, 12, BLA);

  return d;
}

/* -------------------------------------------------------------------------- */
/* PNG                                                                         */
/* -------------------------------------------------------------------------- */

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(typ: string, data: Uint8Array): Uint8Array {
  const ut = new Uint8Array(12 + data.length);
  const dv = new DataView(ut.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) ut[4 + i] = typ.charCodeAt(i);
  ut.set(data, 8);
  dv.setUint32(8 + data.length, crc32(ut.subarray(4, 8 + data.length)));
  return ut;
}

/**
 * Skriver duken som en indexerad PNG.
 *
 * `CompressionStream('deflate')` ger en färdig zlib-ström med huvud och
 * adler32, alltså exakt det en IDAT ska innehålla. Radfiltret är 0 på varje
 * rad: kortet är stora enfärgade ytor, där filtrering inte tjänar något och
 * kostar en genomgång till av 756 000 byte.
 */
export async function png(d: Duk): Promise<Uint8Array> {
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, BREDD);
  dv.setUint32(4, HOJD);
  ihdr[8] = 8; // bitdjup
  ihdr[9] = 3; // indexerad
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rader = new Uint8Array(HOJD * (BREDD + 1));
  for (let y = 0; y < HOJD; y++) {
    rader.set(d.subarray(y * BREDD, (y + 1) * BREDD), y * (BREDD + 1) + 1);
  }

  const cs = new CompressionStream('deflate');
  const skrivare = cs.writable.getWriter();
  void skrivare.write(rader);
  void skrivare.close();
  const idat = new Uint8Array(await new Response(cs.readable).arrayBuffer());

  const delar_ = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('PLTE', palett()),
    chunk('IDAT', idat),
    chunk('IEND', new Uint8Array(0)),
  ];
  const total = delar_.reduce((n, p) => n + p.length, 0);
  const ut = new Uint8Array(total);
  let o = 0;
  for (const p of delar_) {
    ut.set(p, o);
    o += p.length;
  }
  return ut;
}

/* -------------------------------------------------------------------------- */
/* Kortet ur sidans egen HTML                                                  */
/* -------------------------------------------------------------------------- */

function taggInnehall(html: string, attr: string, namn: string): string | null {
  const m = html.match(
    new RegExp(`<meta[^>]*${attr}=["']${namn}["'][^>]*content=["']([^"']*)["']`, 'i'),
  );
  if (m) return avkoda(m[1]);
  const m2 = html.match(
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${namn}["']`, 'i'),
  );
  return m2 ? avkoda(m2[1]) : null;
}

/** De fem entiteter Astro skriver i attribut. Ingen HTML-tolk behövs. */
function avkoda(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

interface Foretag {
  namn: string;
  gata?: string;
  ort?: string;
}

/** Plockar FoodEstablishment ur sidans JSON-LD. Sidan är sanningen. */
function foretag(html: string): Foretag | null {
  const skript = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const m of skript) {
    let data: unknown;
    try {
      data = JSON.parse(m[1]);
    } catch {
      continue;
    }
    const noder = Array.isArray(data) ? data : [data];
    for (const nod of noder) {
      const n = nod as Record<string, unknown>;
      if (n['@type'] !== 'FoodEstablishment' || typeof n.name !== 'string') continue;
      const adr = (n.address ?? {}) as Record<string, unknown>;
      return {
        namn: n.name,
        gata: typeof adr.streetAddress === 'string' ? adr.streetAddress : undefined,
        ort: typeof adr.addressLocality === 'string' ? adr.addressLocality : undefined,
      };
    }
  }
  return null;
}

const MANADER = [
  'januari',
  'februari',
  'mars',
  'april',
  'maj',
  'juni',
  'juli',
  'augusti',
  'september',
  'oktober',
  'november',
  'december',
];

/** 2025-06-17 blir "17 juni 2025". Samma form som sidan skriver. */
export function datum(iso: string): string | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const man = MANADER[Number(m[2]) - 1];
  if (!man) return null;
  return `${Number(m[3])} ${man} ${m[1]}`;
}

/**
 * Bygger kortet ur en sida ur vårt eget bygge.
 *
 * Verksamhetssidor får namn, adress och kontrolldatum. Alla andra sidor får
 * sin egen titel och beskrivning, alltså kommunhubbar, kategorier, områden,
 * kedjor, rapporter och startsidan. Det är samma kod och samma kostnad: en
 * enda funktion täcker alla 16 742 sidor som i dag bär standardbilden.
 */
export function kortFranHtml(html: string): Kort | null {
  const huvud = html.slice(0, html.indexOf('</head>') + 1 || 200_000);
  const titel = taggInnehall(huvud, 'property', 'og:title');
  const beskrivning = taggInnehall(huvud, 'name', 'description');
  const uppdaterat = taggInnehall(huvud, 'name', 'last-modified');
  const f = foretag(huvud);

  if (f && stada(f.namn)) {
    const plats = [f.gata, f.ort].filter(Boolean).join(', ');
    const d = uppdaterat ? datum(uppdaterat) : null;
    return {
      ogonbryn: 'Hygienkontroll',
      rubrik: stada(f.namn),
      underrad: plats ? stada(plats) : undefined,
      etikett: 'Senaste kontrollen',
      /* Ingen registrerad kontroll är ett besked om kommunens REGISTER och
         inte om verksamheten, exakt som MISSING i lib/site.ts skriver: det är
         aldrig detsamma som en dålig bedömning. */
      varde: d ?? 'Ingen registrerad hos kommunen',
    };
  }

  /* En rubrik är kortets enda obligatoriska rad, och `rita()` läser rader[0]
     rakt av. En tom titel ska därför ge tillbaka standardbilden och inte ett
     undantag i kanten. */
  const rubrik = stada((titel ?? '').replace(/\s*\|\s*Prikko\s*$/, ''));
  if (!rubrik) return null;
  return {
    rubrik,
    underrad: beskrivning ? stada(beskrivning) : undefined,
    /* Ingen etikett och inget värde: en kommunsida eller en rapport har ingen
       enskild uppgift som hör hemma i faktaraden, och ett påhittat par bara
       för symmetrins skull hade varit dekor. Kvar står sajtens egen mening,
       samma som og-default.png bär. */
    fot: 'Kommunernas hygienkontroller, samlade',
  };
}
