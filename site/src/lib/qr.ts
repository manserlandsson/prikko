/**
 * QR-kodare. Egen kod, noll beroenden, noll nätanrop.
 *
 * ============================================================================
 * Varför den här filen finns i stället för ett npm-paket eller en bild-URL
 * ============================================================================
 *
 * QR-koden sitter i ett märke som lämnar sajten och hamnar i ett fönster, på
 * en meny och i ett tryckoriginal. Det ställer två krav som de vanliga vägarna
 * inte klarar.
 *
 * INGEN TREDJEPARTSTJÄNST. En bild från api.qrserver.com eller Googles gamla
 * chart-API betyder att adressen till en enskild verksamhet skickas till någon
 * annan varje gång ett märke skapas, och att märket slutar gå att skapa den
 * dagen tjänsten läggs ned. Det andra har hänt: Google Infographics stängdes.
 *
 * INGET ANROP ALLS, varken vid bygget eller vid visningen. Samma resonemang
 * som lib/emblem.ts avsnitt 2 för på om spårpixlar: ett märke ska inte kosta
 * någon en uppslagning hos en tredje part.
 *
 * Ett npm-paket hade klarat båda kraven. Skälet att ändå skriva den här är
 * mängden: kodaren är 320 rader och används på ett ställe, medan de vanliga
 * paketen drar in en canvas-renderare, en PNG-skrivare och en Node-beroende
 * filskrivare som ingen av dem går att köra i en Cloudflare-funktion. Vi vill
 * ha modulmatrisen och ingenting annat.
 *
 * ============================================================================
 * Vad som är implementerat, och vad som inte är det
 * ============================================================================
 *
 * ISO/IEC 18004, byte-läge (mode 0100), version 1 till 10, alla fyra
 * felkorrigeringsnivåer, alla åtta masker med den fullständiga
 * straffuträkningen.
 *
 * Version 10 är taket och det är ett mätt tak, inte ett godtyckligt. Den
 * längsta adressen i beståndet är 149 tecken:
 *
 *   https://prikko.se/oskarshamn/skuro-gardsmejeri-butik-pa-samma-satt-men-
 *   med-arrendator-och-nytt-organisationsnummer-gick-inte-att-fylla-pa-annat-
 *   satt/
 *
 * mätt över 17 066 verksamheter 2026-08-31. Medianen är 46 tecken och 692
 * adresser är längre än 62. Version 10 på nivå M rymmer 213 byte, alltså med
 * 64 byte marginal till den längsta adress vi har. Skulle en ännu längre dyka
 * upp kastar kodaren ett fel med talen i, den ritar aldrig en kod som saknar
 * plats för sitt innehåll.
 *
 * ALFANUMERISKT LÄGE ÄR MEDVETET BORTVALT. Det hade packat 5,5 bitar per
 * tecken i stället för 8, men dess teckenuppsättning är versaler och våra
 * adresser är gemener. Att versalisera en URL är inte gratis: sökvägen efter
 * domänen är skiftlägeskänslig och /STOCKHOLM/AG/ är en annan sida än
 * /stockholm/ag/. Vinsten hade alltså varit noll och risken en trasig länk.
 *
 * KANJI OCH ECI ÄR BORTVALDA. Adresserna är ren ASCII, mätt: noll av 17 066
 * innehåller ett tecken utanför ASCII, eftersom slugarna translittereras i
 * pipelinen.
 */

/** Felkorrigeringsnivåerna, i den ordning specen numrerar dem. */
export type EcLevel = 'L' | 'M' | 'Q' | 'H';

export interface QrCode {
  /** Sidan i moduler, alltså 21 för version 1 och 57 för version 10. */
  size: number;
  /** `true` är en mörk modul. Rad, sedan kolumn. */
  modules: boolean[][];
  version: number;
  level: EcLevel;
  /** Vilken av de åtta maskerna som vann straffuträkningen. */
  mask: number;
}

/**
 * Den tysta zonen runt koden, i moduler.
 *
 * Fyra är specens krav och inte en smaksak. En kod utan tyst zon hittas inte
 * av läsaren när den ligger direkt mot en ram eller mot text, och båda
 * händer i ett märke där koden sitter i en ruta.
 */
export const QR_QUIET_ZONE = 4;

/* -------------------------------------------------------------------------- */
/* Tabeller ur ISO/IEC 18004                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Totalt antal kodord per version, alltså data plus felkorrigering.
 *
 * Talen används bara som kontroll: blocktabellen nedan måste summera till
 * exakt de här talen, och gör den inte det är tabellen felskriven. Kontrollen
 * körs vid modulens laddning, se längst ned.
 */
const TOTAL_CODEWORDS = [26, 44, 70, 100, 134, 172, 196, 242, 292, 346];

/**
 * Blockstrukturen per version och nivå.
 *
 * Formen är [felkorrigeringskodord per block, antal block i grupp 1,
 * datakodord per block i grupp 1, antal block i grupp 2, datakodord per block
 * i grupp 2]. Grupp 2 är noll när versionen bara har en gruppstorlek.
 */
const BLOCKS: Record<EcLevel, number[][]> = {
  L: [
    [7, 1, 19, 0, 0],
    [10, 1, 34, 0, 0],
    [15, 1, 55, 0, 0],
    [20, 1, 80, 0, 0],
    [26, 1, 108, 0, 0],
    [18, 2, 68, 0, 0],
    [20, 2, 78, 0, 0],
    [24, 2, 97, 0, 0],
    [30, 2, 116, 0, 0],
    [18, 2, 68, 2, 69],
  ],
  M: [
    [10, 1, 16, 0, 0],
    [16, 1, 28, 0, 0],
    [26, 1, 44, 0, 0],
    [18, 2, 32, 0, 0],
    [24, 2, 43, 0, 0],
    [16, 4, 27, 0, 0],
    [18, 4, 31, 0, 0],
    [22, 2, 38, 2, 39],
    [22, 3, 36, 2, 37],
    [26, 4, 43, 1, 44],
  ],
  Q: [
    [13, 1, 13, 0, 0],
    [22, 1, 22, 0, 0],
    [18, 2, 17, 0, 0],
    [26, 2, 24, 0, 0],
    [18, 2, 15, 2, 16],
    [24, 4, 19, 0, 0],
    [18, 2, 14, 4, 15],
    [22, 4, 18, 2, 19],
    [20, 4, 16, 4, 17],
    [24, 6, 19, 2, 20],
  ],
  H: [
    [17, 1, 9, 0, 0],
    [28, 1, 16, 0, 0],
    [22, 2, 13, 0, 0],
    [16, 4, 9, 0, 0],
    [22, 2, 11, 2, 12],
    [28, 4, 15, 0, 0],
    [26, 4, 13, 1, 14],
    [26, 4, 14, 2, 15],
    [24, 4, 12, 4, 13],
    [28, 6, 15, 2, 16],
  ],
};

/**
 * Positionerna för justeringsmönstren, per version.
 *
 * Mönstren ritas i varje kombination av två koordinater ur listan, utom de tre
 * hörn där sökmönstren redan står.
 */
const ALIGNMENT = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

/**
 * Restbitar efter det interfolierade kodordsflödet, per version.
 *
 * Version 1 går jämnt ut, version 2 till 6 har sju bitar över, och version 7
 * till 13 går jämnt ut igen. De bitarna skrivs som nollor och är inte
 * valfria: utan dem hamnar formatinformationen rätt men datamodulerna slutar
 * en modul för tidigt.
 */
const REMAINDER_BITS = [0, 7, 7, 7, 7, 7, 0, 0, 0, 0];

/** Nivåernas två bitar i formatinformationen. Inte samma ordning som L M Q H. */
const LEVEL_BITS: Record<EcLevel, number> = { L: 1, M: 0, Q: 3, H: 2 };

/* -------------------------------------------------------------------------- */
/* Galoiskropp GF(256)                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Logaritm- och exponenttabeller för GF(256) med primitivpolynomet 0x11D.
 *
 * Tabellerna byggs en gång när modulen laddas. Multiplikation blir då en
 * addition av logaritmer, vilket är hela skälet att de finns: Reed-Solomon
 * multiplicerar i inre loopen och en polynomdivision per multiplikation hade
 * gjort kodningen mätbart långsammare utan att bli mer begriplig.
 */
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

/**
 * Generatorpolynomet för `degree` felkorrigeringskodord.
 *
 * Produkten av (x - α^i) för i från 0 till degree. Räknas om per anrop, vilket
 * är billigt: högsta graden vi använder är 30 och en kod har som mest åtta
 * block.
 */
function generatorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

/** Felkorrigeringskodorden för ett datablock. Rest vid polynomdivision. */
function ecCodewords(data: Uint8Array, count: number): Uint8Array {
  const gen = generatorPoly(count);
  const rest = new Uint8Array(count);

  for (const byte of data) {
    const factor = byte ^ rest[0];
    rest.copyWithin(0, 1);
    rest[count - 1] = 0;
    for (let i = 0; i < count; i++) rest[i] ^= gfMul(gen[i + 1], factor);
  }

  return rest;
}

/* -------------------------------------------------------------------------- */
/* BCH-koderna för format- och versionsinformation                             */
/* -------------------------------------------------------------------------- */

/**
 * Formatinformationens 15 bitar: fem databitar, tio BCH-bitar, och en fast
 * mask ovanpå.
 *
 * Masken 0b101010000010010 finns för att ett format med bara nollor annars
 * hade blivit femton mörka moduler i rad, vilket läsaren tar för ett
 * sökmönster.
 */
function formatBits(level: EcLevel, mask: number): number {
  const data = (LEVEL_BITS[level] << 3) | mask;
  let rest = data << 10;
  for (let i = 14; i >= 10; i--) {
    if (rest & (1 << i)) rest ^= 0b10100110111 << (i - 10);
  }
  return ((data << 10) | rest) ^ 0b101010000010010;
}

/**
 * Versionsinformationens 18 bitar. Ritas bara från version 7 och uppåt.
 *
 * Under version 7 finns fältet inte alls i koden, och att skriva dit det hade
 * skrivit över datamoduler.
 */
function versionBits(version: number): number {
  let rest = version << 12;
  for (let i = 17; i >= 12; i--) {
    if (rest & (1 << i)) rest ^= 0b1111100100101 << (i - 12);
  }
  return (version << 12) | rest;
}

/* -------------------------------------------------------------------------- */
/* Kodning                                                                     */
/* -------------------------------------------------------------------------- */

/** Datakodord som ryms i en version på en nivå. */
function dataCapacity(version: number, level: EcLevel): number {
  const [ec, n1, d1, n2, d2] = BLOCKS[level][version - 1];
  void ec;
  return n1 * d1 + n2 * d2;
}

/**
 * Minsta version som rymmer strängen.
 *
 * Teckenräknaren är åtta bitar till och med version 9 och sexton från version
 * 10, alltså kostar version 10 en byte mer i huvudet än version 9. Det är
 * inbakat i jämförelsen nedan och inte ett avrundningsfel: en sträng som är
 * exakt på gränsen hamnar annars i en version där den inte får plats.
 */
function pickVersion(byteLength: number, level: EcLevel): number {
  for (let version = 1; version <= 10; version++) {
    const header = version >= 10 ? 3 : 2; // 4 bitar läge + 8 eller 16 bitar längd
    if (byteLength + header <= dataCapacity(version, level)) return version;
  }
  throw new Error(
    `QR: ${byteLength} byte ryms inte i version 10 på nivå ${level} ` +
      `(taket är ${dataCapacity(10, level) - 3} byte). ` +
      'Höj taket i lib/qr.ts eller korta adressen.',
  );
}

/** Bitströmmen, alltså läge, längd, data, terminator och utfyllnad. */
function bitStream(bytes: Uint8Array, version: number, level: EcLevel): Uint8Array {
  const capacity = dataCapacity(version, level);
  const bits: number[] = [];
  const push = (value: number, width: number) => {
    for (let i = width - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };

  push(0b0100, 4); // byte-läge
  push(bytes.length, version >= 10 ? 16 : 8);
  for (const b of bytes) push(b, 8);

  /* Terminatorn är fyra nollor, men bara så många som får plats. */
  const capacityBits = capacity * 8;
  for (let i = 0; i < 4 && bits.length < capacityBits; i++) bits.push(0);

  /* Fyll ut till hel byte. */
  while (bits.length % 8 !== 0) bits.push(0);

  const out = new Uint8Array(capacity);
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    out[i / 8] = byte;
  }

  /*
   * Utfyllnadskodorden är 0xEC och 0x11 om vartannat, och de två talen står i
   * specen. Vilket värde som helst hade kodats lika säkert, men just de två
   * är valda för att de ger en jämn fördelning av mörkt och ljust och därmed
   * ett lägre maskstraff.
   */
  const PAD = [0xec, 0x11];
  for (let i = bits.length / 8, p = 0; i < capacity; i++, p++) out[i] = PAD[p % 2];

  return out;
}

/**
 * Data- och felkorrigeringskodorden interfolierade i sändningsordning.
 *
 * Blocken läses kolumnvis: första kodordet ur varje block, sedan andra ur
 * varje block, och så vidare. Det är hela poängen med blockindelningen. En
 * fläck på märket förstör då en handfull kodord ur VARJE block i stället för
 * alla i ett, och varje block har sin egen felkorrigering.
 */
function interleave(data: Uint8Array, version: number, level: EcLevel): Uint8Array {
  const [ecCount, n1, d1, n2, d2] = BLOCKS[level][version - 1];

  const blocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  let offset = 0;
  for (let i = 0; i < n1 + n2; i++) {
    const size = i < n1 ? d1 : d2;
    const block = data.subarray(offset, offset + size);
    offset += size;
    blocks.push(block);
    ecBlocks.push(ecCodewords(block, ecCount));
  }

  const out: number[] = [];
  const longest = Math.max(d1, d2);
  for (let i = 0; i < longest; i++) {
    for (const block of blocks) if (i < block.length) out.push(block[i]);
  }
  for (let i = 0; i < ecCount; i++) {
    for (const block of ecBlocks) out.push(block[i]);
  }

  return new Uint8Array(out);
}

/* -------------------------------------------------------------------------- */
/* Matrisen                                                                    */
/* -------------------------------------------------------------------------- */

/** -1 är oskriven, 0 ljus, 1 mörk. Funktionsmoduler markeras i `reserved`. */
interface Canvas {
  size: number;
  cells: Int8Array;
  reserved: Uint8Array;
}

function makeCanvas(version: number): Canvas {
  const size = version * 4 + 17;
  const canvas: Canvas = {
    size,
    cells: new Int8Array(size * size).fill(-1),
    reserved: new Uint8Array(size * size),
  };

  const set = (x: number, y: number, dark: boolean) => {
    canvas.cells[y * size + x] = dark ? 1 : 0;
    canvas.reserved[y * size + x] = 1;
  };

  /* Sökmönstren i tre hörn, med sin separator av ljusa moduler. */
  for (const [ox, oy] of [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ]) {
    for (let dy = -1; dy <= 7; dy++) {
      for (let dx = -1; dx <= 7; dx++) {
        const x = ox + dx;
        const y = oy + dy;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
        set(x, y, ring !== 2 && ring <= 3);
      }
    }
  }

  /* Tidsmönstren, alltså raden och kolumnen som växlar mörkt och ljust. */
  for (let i = 8; i < size - 8; i++) {
    set(i, 6, i % 2 === 0);
    set(6, i, i % 2 === 0);
  }

  /* Justeringsmönstren, utom där sökmönstren redan står. */
  const centers = ALIGNMENT[version - 1];
  for (const cy of centers) {
    for (const cx of centers) {
      const nearFinder =
        (cx <= 8 && cy <= 8) ||
        (cx >= size - 9 && cy <= 8) ||
        (cx <= 8 && cy >= size - 9);
      if (nearFinder) continue;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const ring = Math.max(Math.abs(dx), Math.abs(dy));
          set(cx + dx, cy + dy, ring !== 1);
        }
      }
    }
  }

  /*
   * Den mörka modulen. Den står alltid på (8, 4*version+9) och är den enda
   * modulen i hela koden vars värde varken är data eller mönster. Utan den
   * läses formatinformationen fel.
   */
  set(8, size - 8, true);

  /* Formatfälten reserveras nu och fylls när masken är vald. */
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      canvas.reserved[8 * size + i] = 1;
      canvas.reserved[i * size + 8] = 1;
    }
  }
  for (let i = 0; i < 8; i++) {
    canvas.reserved[8 * size + (size - 1 - i)] = 1;
    canvas.reserved[(size - 1 - i) * size + 8] = 1;
  }

  /* Versionsfälten, bara från version 7. */
  if (version >= 7) {
    const bits = versionBits(version);
    for (let i = 0; i < 18; i++) {
      const dark = ((bits >> i) & 1) === 1;
      const a = Math.floor(i / 3);
      const b = (i % 3) + size - 11;
      set(a, b, dark);
      set(b, a, dark);
    }
  }

  return canvas;
}

/**
 * Kodorden läggs i sicksack, två kolumner i taget, nedifrån och upp och sedan
 * uppifrån och ned, med kolumn 6 överhoppad eftersom tidsmönstret står där.
 */
function placeData(canvas: Canvas, codewords: Uint8Array, remainder: number): void {
  const { size, cells, reserved } = canvas;
  let bit = 0;
  const total = codewords.length * 8 + remainder;

  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // hoppa över tidsmönstrets kolumn
    for (let step = 0; step < size; step++) {
      const y = upward ? size - 1 - step : step;
      for (const x of [right, right - 1]) {
        const i = y * size + x;
        if (reserved[i]) continue;
        let dark = false;
        if (bit < total) {
          const byte = bit >> 3;
          dark = byte < codewords.length && ((codewords[byte] >> (7 - (bit & 7))) & 1) === 1;
        }
        cells[i] = dark ? 1 : 0;
        bit++;
      }
    }
    upward = !upward;
  }
}

/** Maskformlerna, i specens nummerordning. `true` betyder invertera modulen. */
const MASKS: Array<(x: number, y: number) => boolean> = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

/**
 * Straffet för en maskad matris, alltså de fyra reglerna i specen.
 *
 * Regel 1 straffar långa rader av samma färg, regel 2 jämnstora block, regel 3
 * mönster som liknar ett sökmönster, och regel 4 sned fördelning mellan mörkt
 * och ljust. Den lägsta summan vinner.
 *
 * Att välja mask alls är inte nödvändigt för att koden ska gå att läsa, men
 * det är nödvändigt för att den ska gå att läsa BRA. Regel 3 är den som
 * betyder mest för oss: ett falskt sökmönster i datan får läsaren att leta
 * hörn på fel ställe, och en kod på ett fönster läses ofta snett och långt
 * ifrån där den marginalen behövs.
 */
function penalty(cells: Int8Array, size: number): number {
  let score = 0;
  const at = (x: number, y: number) => cells[y * size + x] === 1;

  /* Regel 1: fem eller fler lika i rad ger 3, plus 1 per extra. */
  for (let i = 0; i < size; i++) {
    for (const horizontal of [true, false]) {
      let run = 1;
      let previous = horizontal ? at(0, i) : at(i, 0);
      for (let j = 1; j < size; j++) {
        const value = horizontal ? at(j, i) : at(i, j);
        if (value === previous) {
          run++;
        } else {
          if (run >= 5) score += run - 2;
          previous = value;
          run = 1;
        }
      }
      if (run >= 5) score += run - 2;
    }
  }

  /* Regel 2: varje 2x2-ruta i en färg ger 3. */
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const v = at(x, y);
      if (v === at(x + 1, y) && v === at(x, y + 1) && v === at(x + 1, y + 1)) score += 3;
    }
  }

  /* Regel 3: mönstret 1:1:3:1:1 med fyra ljusa på någon sida ger 40. */
  const A = [true, false, true, true, true, false, true, false, false, false, false];
  const B = [false, false, false, false, true, false, true, true, true, false, true];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x <= size - 11; x++) {
      let matchA = true;
      let matchB = true;
      let matchAv = true;
      let matchBv = true;
      for (let k = 0; k < 11; k++) {
        if (at(x + k, y) !== A[k]) matchA = false;
        if (at(x + k, y) !== B[k]) matchB = false;
        if (at(y, x + k) !== A[k]) matchAv = false;
        if (at(y, x + k) !== B[k]) matchBv = false;
      }
      if (matchA) score += 40;
      if (matchB) score += 40;
      if (matchAv) score += 40;
      if (matchBv) score += 40;
    }
  }

  /* Regel 4: avvikelsen från femtio procent mörkt, i steg om fem procent. */
  let dark = 0;
  for (let i = 0; i < cells.length; i++) if (cells[i] === 1) dark++;
  const percent = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;

  return score;
}

/**
 * Skriver formatinformationen på sina två platser.
 *
 * Koordinaterna sätts genom en `put(x, y)` och inte genom att räkna index för
 * hand. Det är inte pedanteri: den första versionen av den här funktionen
 * skrev `cells[8 * size + i]` där det skulle stå `cells[i * size + 8]`, alltså
 * hela formatfältet transponerat. Koden såg ut som en QR-kod, ritade sina
 * sökmönster och sin data rätt, och gick inte att läsa av en enda gång av 865
 * försök. Med en namngiven x och y kan felet inte skrivas.
 *
 * Bit 0 är den minst signifikanta av de femton, och ordningen nedan är specens.
 * Kopia ett ligger som ett L runt sökmönstret uppe till vänster, kopia två
 * delad mellan de två andra sökmönstren, så att en skada i ett hörn aldrig tar
 * båda kopiorna.
 */
function writeFormat(canvas: Canvas, level: EcLevel, mask: number): void {
  const { size, cells } = canvas;
  const bits = formatBits(level, mask);
  const put = (x: number, y: number, i: number) => {
    cells[y * size + x] = ((bits >> i) & 1) === 1 ? 1 : 0;
  };

  /* Kopia ett, runt sökmönstret uppe till vänster. */
  for (let i = 0; i <= 5; i++) put(8, i, i);
  put(8, 7, 6);
  put(8, 8, 7);
  put(7, 8, 8);
  for (let i = 9; i <= 14; i++) put(14 - i, 8, i);

  /* Kopia två, delad mellan de två andra sökmönstren. */
  for (let i = 0; i <= 7; i++) put(size - 1 - i, 8, i);
  for (let i = 8; i <= 14; i++) put(8, size - 15 + i, i);
}

/* -------------------------------------------------------------------------- */
/* Ingången                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Kodar en sträng och väljer version och mask åt anroparen.
 *
 * Nivån är M om ingen anges. Skälet står i lib/dekal.ts: M rättar 15 procent
 * skadade kodord, vilket är branschens normalval för tryck, och varje steg
 * uppåt gör koden tätare och därmed modulerna mindre vid en given fysisk
 * storlek. Det är fel väg för något som ska läsas genom ett skyltfönster.
 */
export function encodeQr(text: string, level: EcLevel = 'M'): QrCode {
  const bytes = new TextEncoder().encode(text);
  const version = pickVersion(bytes.length, level);
  const codewords = interleave(bitStream(bytes, version, level), version, level);

  const canvas = makeCanvas(version);
  placeData(canvas, codewords, REMAINDER_BITS[version - 1]);

  /*
   * Alla åtta masker provas på var sin kopia och den med lägst straff vinner.
   * Åtta kopior av som mest 57 gånger 57 celler är 26 000 byte, alltså
   * ointressant, och alternativet hade varit att maska fram och tillbaka i
   * samma matris med de avrundningsfel det bjuder in till.
   */
  let best = -1;
  let bestScore = Infinity;
  let bestCells: Int8Array = canvas.cells;

  for (let mask = 0; mask < 8; mask++) {
    const trial: Canvas = {
      size: canvas.size,
      cells: canvas.cells.slice(),
      reserved: canvas.reserved,
    };
    for (let y = 0; y < canvas.size; y++) {
      for (let x = 0; x < canvas.size; x++) {
        const i = y * canvas.size + x;
        if (canvas.reserved[i]) continue;
        if (MASKS[mask](x, y)) trial.cells[i] ^= 1;
      }
    }
    writeFormat(trial, level, mask);

    const score = penalty(trial.cells, canvas.size);
    if (score < bestScore) {
      bestScore = score;
      best = mask;
      bestCells = trial.cells;
    }
  }

  const modules: boolean[][] = [];
  for (let y = 0; y < canvas.size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < canvas.size; x++) row.push(bestCells[y * canvas.size + x] === 1);
    modules.push(row);
  }

  return { size: canvas.size, modules, version, level, mask: best };
}

/**
 * Koden som ett enda `d`-attribut, i modulkoordinater med origo i övre
 * vänstra hörnet av själva koden, alltså utan den tysta zonen.
 *
 * Sammanhängande mörka moduler på en rad slås ihop till EN rektangel. Det är
 * inte en mikrooptimering: en version 10-kod har omkring 1 600 mörka moduler,
 * och som var sin rektangel blir attributet 40 kB medan sammanslaget landar
 * på ungefär en tredjedel. Filen ska mejlas och laddas upp till ett tryckeri.
 *
 * Rektanglar och inte punkter av ett skäl som syns i tryck: två rektanglar som
 * gränsar till varandra ritas utan söm av varje renderare, medan två separata
 * fyrkanter kan lämna en hårfin ljus linje mellan sig när de rastreras.
 */
export function qrPath(code: QrCode): string {
  const parts: string[] = [];
  for (let y = 0; y < code.size; y++) {
    let x = 0;
    while (x < code.size) {
      if (!code.modules[y][x]) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < code.size && code.modules[y][x + run]) run++;
      parts.push(`M${x} ${y}h${run}v1h-${run}z`);
      x += run;
    }
  }
  return parts.join('');
}

/* -------------------------------------------------------------------------- */
/* Självkontroll                                                               */
/* -------------------------------------------------------------------------- */

/*
 * Blocktabellen måste summera till versionens totala kodordsantal.
 *
 * Kontrollen körs när modulen laddas, alltså vid varje bygge och vid varje
 * kallstart av funktionen. Skälet är att en felskriven siffra i BLOCKS inte
 * ger ett undantag utan en kod som ser ut som en QR-kod och inte går att
 * läsa, och det felet upptäcks först av någon som står med telefonen framför
 * ett tryckt fönstermärke.
 */
for (const level of ['L', 'M', 'Q', 'H'] as const) {
  BLOCKS[level].forEach(([ec, n1, d1, n2, d2], i) => {
    const sum = n1 * (d1 + ec) + n2 * (d2 + ec);
    if (sum !== TOTAL_CODEWORDS[i]) {
      throw new Error(
        `lib/qr.ts: version ${i + 1} nivå ${level} summerar till ${sum} kodord, ` +
          `tabellen kräver ${TOTAL_CODEWORDS[i]}.`,
      );
    }
  });
}
