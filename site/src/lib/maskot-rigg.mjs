/**
 * RIGGEN. Figuren blir en docka med namngivna leder.
 *
 * ── Varför den här filen finns ──────────────────────────────────────────
 *
 * `figur()` i gravling.mjs ritar en färdig SVG. Den är vacker och den är helt
 * anonym: fjorton paths i rad, två ellipser, två cirklar, och ingenting säger
 * vilken av dem som är ett öra. Det går inte att animera det som inte går att
 * peka på.
 *
 * En rigg är just det pekandet. Den läser figurens markup, känner igen varje
 * del på sin FORM och inte på sin ordning, och sätter ett namn på den. Efter
 * det kan en stilmall säga `.r-ora-v { rotate: 8deg }` och en trettio rader
 * lång CSS-fil gör det en riggad figur i ett animationsprogram gör.
 *
 * ── Varför den WRAPPAR i stället för att sätta klass på delen ────────────
 *
 * Det här är filens enda icke uppenbara beslut, och det är avgörande.
 *
 * Delarna bär redan `transform` som ATTRIBUT: huvudet står i
 * `transform="translate(57 34)rotate(27)scale(0.62)translate(-51 -52)"`, öronen
 * i var sin `rotate(-22 …)`. CSS-egenskapen `transform` ERSÄTTER attributet,
 * den lägger sig inte ovanpå. En animation som skriver `transform` på huvudet
 * slår alltså ut hela huvudets placering och figuren faller isär i samma
 * bildruta som rörelsen börjar. Det är precis den sortens fel som ser ut som
 * "animering är sämst, den ser konstigt ut".
 *
 * Riggen lägger därför en TOM `<g>` runt varje del. Den yttre gruppen äger
 * rörelsen, den inre äger placeringen, och de kan aldrig skriva över varandra.
 * Samma konstruktion som en riktig rigg: ett ben har en led och en form, och
 * leden är inte formen.
 *
 * ── Varför transform-box: fill-box ──────────────────────────────────────
 *
 * Ett öra ska rotera kring sin egen fästpunkt, inte kring rutans övre vänstra
 * hörn, som är SVG:ns förval. Origo måste alltså uttryckas lokalt.
 *
 * `transform-box: view-box` löser det inte, eftersom "view-box" är närmaste
 * SVG-viewport, alltså rotens 120 x 120, medan örat sitter inne i en grupp som
 * är skalad 0,62. Ett origo i rotens enheter hade landat fel med samma faktor.
 *
 * `transform-box: fill-box` räknar i stället origo mot elementets EGEN
 * omslutande låda, så `transform-origin: 50% 100%` betyder underkanten av just
 * den delen, oavsett hur många skalade grupper den ligger inuti. Det gör riggen
 * oberoende av figurens placering, och det gör att samma stilmall fungerar både
 * på helfiguren i 120-rutan och på det beskurna märket i 100-rutan.
 *
 * ── Varför delarna känns igen på form och inte på ordning ───────────────
 *
 * Figuren ritas om. Den ritas om nu, medan det här skrivs. En rigg som säger
 * "sjunde path:en är högerbenet" är trasig i samma sekund som någon lägger till
 * en skugga, och det värsta är att den inte KRASCHAR utan bara animerar fel del.
 *
 * Därför letar riggen efter signaturer: pupillerna är den enda gruppen med
 * exakt två `<circle>`, ögonlocken är den enda med två `<ellipse>` inuti
 * ögonbeskärningen, munnen bär redan sin egen klass. Och när en signatur inte
 * hittas RAPPORTERAS det, se `rigga().saknas`, så att bygget kan säga ifrån
 * i stället för att tyst leverera en figur där bara halva ansiktet lever.
 *
 * ── Varför filen bor här och inte i brand/ ──────────────────────────────
 *
 * Allt annat om figuren bor i brand/ och GENERERAS in i site/. Riggen går åt
 * andra hållet: den bor här och läses av brand/maskot-ark-rorelse.mjs när
 * förslagsarket byggs.
 *
 * Skälet är att arket ska bevisa något. Ett ark som visar sin EGEN kopia av
 * rörelsen bevisar bara att kopian fungerar, och det är precis så en
 * designfil och en produkt glider isär. Läser arket sajtens riktiga rigg och
 * sajtens riktiga stilmall är det ägaren ser i arket per definition det som
 * ligger på sajten. Därav också att filen är .mjs och inte .ts: den ska kunna
 * köras av `node` utan byggsteg.
 */

/* ══ 1. EN LITEN TRÄDLÄSARE ═══════════════════════════════════════════════
 *
 * Ingen DOM och inget beroende. Markupen kommer ur vår egen generator, alltså
 * är den maskinskriven: inga textnoder, inga attribut utan citattecken, inga
 * kommentarer. En full XML-parser vore fel verktyg och en regex vore för lite.
 */

/**
 * @typedef {{ tag: string, attr: string, barn: Nod[], self: boolean,
 *             start: number, slut: number }} Nod
 */

/** Läser markupen till ett träd av noder med positioner i originalsträngen. */
function las(svg) {
  const rot = { tag: '#rot', attr: '', barn: [], self: false, start: 0, slut: svg.length };
  const stack = [rot];
  const taggar = /<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|[^>"])*?)(\/?)>/g;
  let m;
  while ((m = taggar.exec(svg))) {
    const [hel, slash, tag, attr, tom] = m;
    if (slash) {
      const nod = stack.pop();
      if (nod) nod.slut = m.index + hel.length;
      continue;
    }
    const nod = {
      tag,
      attr,
      barn: [],
      self: tom === '/',
      start: m.index,
      slut: m.index + hel.length,
    };
    stack[stack.length - 1].barn.push(nod);
    if (!nod.self) stack.push(nod);
  }
  return rot;
}

/** Attributvärde ur en nods attributsträng. */
const attr = (nod, namn) => {
  const m = new RegExp(`\\b${namn}="([^"]*)"`).exec(nod.attr);
  return m ? m[1] : null;
};

/** Barn med en viss tagg. */
const barnAv = (nod, tag) => nod.barn.filter((b) => b.tag === tag);

/** Sant om noden är en grupp med exakt n barn av en enda taggtyp. */
function gruppAv(nod, tag, n) {
  return nod.tag === 'g' && nod.barn.length === n && nod.barn.every((b) => b.tag === tag);
}

/** Djupsökning. Ordningen är dokumentordning, alltså ritordning. */
function alla(nod, ut = []) {
  for (const b of nod.barn) {
    ut.push(b);
    alla(b, ut);
  }
  return ut;
}

/**
 * Var i sidled en form ligger. Används för att skilja vänster från höger.
 *
 * ── Varför paren INTE namnges på ritordning ─────────────────────────────
 *
 * Det var första försöket och det var fel. I lägena `clean` och `hittat` ritas
 * bara ETT ögonlock, eftersom det andra står helt öppet och ett öppet lock är
 * en osynlig ellips som figuren hoppar över. Ritordningen "först vänster, sedan
 * höger" gäller alltså bara när båda finns, och i clean fick höger lock namnet
 * `r-lock-v`. Riggen hade då animerat fel öga, och ingenting hade kraschat.
 *
 * Sidan läses därför ur formens egen x, som är ett faktum och inte en ordning.
 */
function xLage(nod) {
  const cx = attr(nod, 'cx');
  if (cx !== null) return parseFloat(cx);
  const d = attr(nod, 'd');
  if (d) {
    const tal = d.match(/-?\d*\.?\d+/g);
    if (tal && tal.length >= 2) {
      /* Banans tyngdpunkt i x, alltså medelvärdet av varannat tal. En banas
         första punkt kan ligga var som helst på konturen; medelvärdet kan det
         inte. */
      let sum = 0;
      let n = 0;
      for (let i = 0; i < tal.length; i += 2) { sum += parseFloat(tal[i]); n++; }
      return sum / n;
    }
  }
  const t = attr(nod, 'transform');
  const m = t && /(?:translate|rotate)\(\s*(-?\d*\.?\d+)/.exec(t);
  return m ? parseFloat(m[1]) : 0;
}

/** Namnger ett par efter sida i stället för efter ritordning. */
function par(noder, mark, vanster, hoger) {
  const s = [...noder].sort((a, b) => xLage(a) - xLage(b));
  if (s.length === 1) {
    /* Ensamt lock. Vilken sida det är avgörs mot ansiktets mittlinje, som
       riggen inte känner, så anroparen skickar in den. Se lasAnsikte. */
    return s;
  }
  if (s[0]) mark(s[0], vanster);
  if (s[1]) mark(s[1], hoger);
  return s;
}

/* ══ 2. IGENKÄNNINGEN ════════════════════════════════════════════════════ */

/**
 * Ansiktets delar, sökta på signatur inuti den grupp som håller ansiktet.
 *
 * Ansiktet ser likadant ut i båda lägena, alltså i helfiguren och i det
 * beskurna märket, eftersom märket ÄR figurens ansikte beskuret. Därför finns
 * det bara en avläsning här och inte två.
 */
function lasAnsikte(rot, mark) {
  const noder = alla(rot);

  /* MUNNEN bär redan sin egen klass sedan uppritningsanimationen, som behöver
     kunna peka på den. Vi lånar den i stället för att gissa. */
  const mun = noder.find((n) => (attr(n, 'class') || '').split(/\s+/).includes('mun'));
  if (mun) mark(mun, 'r-mun');

  /* ÖGONLOCKEN. Den ena bär klassen `lock-hoger` sedan blinkningen i
     FaceMark. Locken sitter i par i en egen fyllningsgrupp, så gruppen hittas
     genom att gå upp från den märkta ellipsen. Att leta efter "en grupp med
     två ellipser" räcker inte: öronen är också det. */
  const lockH = noder.find((n) => (attr(n, 'class') || '').split(/\s+/).includes('lock-hoger'));
  let lockGrupp = null;
  if (lockH) {
    lockGrupp = noder.find((n) => n.barn.includes(lockH));
    if (lockGrupp) par(barnAv(lockGrupp, 'ellipse'), mark, 'r-lock-v', 'r-lock-h');
  }

  /* BRYNEN. Två paths i en egen fyllningsgrupp, syskon till ögonlocken inuti
     ögonbeskärningen. Att söka syskonskapet i stället för "andra gruppen med
     två paths" gör att en tillagd detalj någon annanstans i ansiktet inte
     flyttar träffen. */
  let brynGrupp = null;
  if (lockGrupp) {
    const foralder = noder.find((n) => n.barn.includes(lockGrupp));
    brynGrupp = foralder?.barn.find((b) => b !== lockGrupp && gruppAv(b, 'path', 2)) ?? null;
    if (brynGrupp) {
      par(brynGrupp.barn, mark, 'r-bryn-v', 'r-bryn-h');
      mark(brynGrupp, 'r-bryn');
    }
    if (lockGrupp) mark(lockGrupp, 'r-lock');
  }

  /* PUPILLERNA. Enda gruppen med exakt två cirklar i hela figuren.
     Ägaren: "ögonen rullar". Det är de här två som rullar. */
  const pupillGrupp = noder.find((n) => gruppAv(n, 'circle', 2));
  if (pupillGrupp) {
    par(pupillGrupp.barn, mark, 'r-pupill-v', 'r-pupill-h');
    mark(pupillGrupp, 'r-pupiller');
  }

  /* ÖGONVITORNA. De vita formerna. Vitt är unikt i figuren: paletten har
     ingen annan ren vit yta, så färgen ensam räcker som signatur. */
  const vita = noder.filter(
    (n) => (n.tag === 'path' || n.tag === 'ellipse') && /^#f{3,6}$/i.test(attr(n, 'fill') || ''),
  );
  par(vita, mark, 'r-vita-v', 'r-vita-h');

  /* ARTTECKNET. Banden och nosen, tre paths i en gemensam mörk fyllning. Det
     är figurens bärande drag och det enda som aldrig får röra sig fritt: banden
     ÄR ögonen, se figurens META. De namnges ändå, eftersom en nos som rycker
     till är den billigaste livstecknet som finns. */
  const bandGrupp = noder.find((n) => gruppAv(n, 'path', 3));
  if (bandGrupp) {
    /* Sorterade i sidled: band, nos, band. Nosen ligger på mittlinjen och
       hamnar därmed alltid i mitten, oavsett ritordning. */
    const tre = [...bandGrupp.barn].sort((a, b) => xLage(a) - xLage(b));
    mark(tre[0], 'r-band-v');
    mark(tre[1], 'r-nos');
    mark(tre[2], 'r-band-h');
  }

  /* ÖRONEN. Gruppen med två ellipser som INTE är ögonlocken. */
  const oronGrupp = noder.find(
    (n) => n !== lockGrupp && gruppAv(n, 'ellipse', 2),
  );
  if (oronGrupp) {
    par(oronGrupp.barn, mark, 'r-ora-v', 'r-ora-h');
    mark(oronGrupp, 'r-oron');
  }

  return {
    mun: !!mun,
    lock: !!lockGrupp,
    bryn: !!brynGrupp,
    pupiller: !!pupillGrupp,
    vita: vita.length >= 2,
    band: !!bandGrupp,
    oron: !!oronGrupp,
  };
}

/**
 * Kroppen. Bara i det fria läget; märket har ingen kropp.
 *
 * Kroppens delar har inga signaturer att gå på, eftersom allt utom skuggan är
 * paths i samma mörka färg. De räknas därför BAKIFRÅN, från huvudet och nedåt,
 * och skälet är att ritordningen slutar likadant oavsett vad som läggs till:
 * huvudet ritas sist, högerarmen näst sist. Lägger någon till en detalj hamnar
 * den före huvudet men efter allt annat, alltså skulle en framifrånräkning
 * flytta varenda del medan en bakifrånräkning flyttar noll.
 *
 * Räkningen kontrolleras dessutom mot en väntad längd, och stämmer den inte
 * riggas kroppen inte alls. Hellre en figur där bara ansiktet lever än en där
 * ett ben roterar som om det vore en arm.
 */
function lasKropp(kroppG, mark) {
  const b = kroppG.barn;
  /* Väntad ritordning, se figur() i gravling.mjs:
     skugga, ben x2, fötter x2, vänsterarm x2, kropp, pälsgrupp, högerarm x2,
     huvudgrupp. Alltså tolv barn. */
  const huvudG = b[b.length - 1];
  if (!huvudG || huvudG.tag !== 'g' || !/scale\(/.test(attr(huvudG, 'transform') || '')) {
    return { kropp: false, huvud: false };
  }
  mark(huvudG, 'r-huvud');

  if (b.length !== 12) return { kropp: false, huvud: true };

  const [skugga, benV, benH, fotV, fotH, armVlem, armVtass, bal, pals, armHlem, armHtass] = b;
  mark(skugga, 'r-skugga');
  mark(benV, 'r-ben-v');
  mark(benH, 'r-ben-h');
  mark(fotV, 'r-fot-v');
  mark(fotH, 'r-fot-h');
  mark(armVlem, 'r-arm-v');
  mark(armVtass, 'r-tass-v');
  mark(bal, 'r-bal');
  mark(pals, 'r-pals');
  mark(armHlem, 'r-arm-h');
  mark(armHtass, 'r-tass-h');
  return { kropp: true, huvud: true };
}

/* ══ 3. FÖRARBETET: LOCKET SOM INTE RITADES ══════════════════════════════
 *
 * I `clean` och `hittat` står ena ögat HELT öppet, och ett helt öppet lock är
 * en ellips med ry 0,4 som ingen kan se. Figuren hoppar därför över den, vilket
 * är rätt beslut för en stillbild och fel förutsättning för en rigg: en blinkning
 * behöver två lock, och det ena finns inte.
 *
 * Riggen ritar därför tillbaka det som ett SPEGELVÄNT syskon i sitt öppna läge.
 * Bilden ändras inte med en pixel, eftersom formen är osynlig, men riggen får
 * det par den behöver.
 *
 * Spegelaxeln räknas ur ÖRONEN, som sitter fast i huvudet och inte flyttar sig
 * med humöret. Ögon och pupiller vore fel axel: blicken går åt sidan i flera
 * lägen, och axeln skulle då vandra med blicken.
 */
function kompletteraLock(svg) {
  const rot = las(svg);
  const noder = alla(rot);
  const lockH = noder.find((n) => (attr(n, 'class') || '').split(/\s+/).includes('lock-hoger'));
  if (!lockH) return svg;
  const grupp = noder.find((n) => n.barn.includes(lockH));
  if (!grupp || barnAv(grupp, 'ellipse').length !== 1) return svg;

  const oron = noder.find((n) => n !== grupp && gruppAv(n, 'ellipse', 2));
  const vita = noder.filter(
    (n) => (n.tag === 'path' || n.tag === 'ellipse') && /^#f{3,6}$/i.test(attr(n, 'fill') || ''),
  );
  const referens = oron ? oron.barn : vita;
  if (referens.length < 2) return svg;
  const axel = (xLage(referens[0]) + xLage(referens[1])) / 2;

  const cx = parseFloat(attr(lockH, 'cx'));
  const spegel = (2 * axel - cx).toFixed(2);
  let tvilling = lockH.self ? svg.slice(lockH.start, lockH.slut) : '';
  if (!tvilling) return svg;
  tvilling = tvilling
    .replace(/ class="[^"]*"/, '')
    .replace(/\bcx="[^"]*"/, `cx="${spegel}"`)
    /* Lutningen speglas med, annars lutar locken åt samma håll och ansiktet
       läser som snett. Rotationens egen x-punkt speglas på samma axel. */
    .replace(/\btransform="rotate\((-?[\d.]+) (-?[\d.]+) (-?[\d.]+)\)"/, (_, v, rx, ry) =>
      `transform="rotate(${-parseFloat(v)} ${(2 * axel - parseFloat(rx)).toFixed(2)} ${ry})"`);

  return svg.slice(0, lockH.start) + tvilling + svg.slice(lockH.start);
}

/* ══ 4. UTFÖRANDET ═══════════════════════════════════════════════════════ */

/**
 * Riggar en figur.
 *
 * @param {string} svg    utdata ur figur()
 * @param {object} [opt]
 * @param {string} [opt.klass]  extra klass på rot-svg:n, till exempel rörelsens namn
 * @returns {{ svg: string, delar: string[], saknas: string[] }}
 */
export function rigga(indata, { klass = '' } = {}) {
  const svg = kompletteraLock(indata);
  const rot = las(svg);
  const svgNod = rot.barn.find((n) => n.tag === 'svg');
  if (!svgNod) return { svg, delar: [], saknas: ['svg'] };

  /* Insättningarna samlas och appliceras BAKIFRÅN, så att en tidigare
     insättning aldrig flyttar en senare nods index. Att skriva om strängen
     framifrån är den klassiska buggen i den här sortens kod. */
  const jobb = [];
  const delar = [];
  const mark = (nod, namn) => {
    delar.push(namn);
    jobb.push({ nod, namn });
  };

  /* Kroppen först, så att huvudgruppen är känd innan ansiktet läses. Det
     beskurna märket har ingen kroppsgrupp och hoppar rakt till ansiktet. */
  const kroppG = svgNod.barn.find(
    (n) => n.tag === 'g' && n.barn.length > 3 && !attr(n, 'clip-path'),
  );
  let hittat = { kropp: false, huvud: false };
  if (kroppG && kroppG.barn.length >= 8) hittat = lasKropp(kroppG, mark);
  if (hittat.kropp || hittat.huvud) mark(kroppG, 'r-kropp');

  const ansikte = lasAnsikte(svgNod, mark);

  /* Insättningen. Varje märkt nod får en tom omslutande grupp; se
     modulkommentaren för varför det inte räcker att sätta en klass.
     ────────────────────────────────────────────────────────────────────────
     Varje insättning är en EGEN punkt, och punkterna sorteras tillsammans.
     Att i stället sortera per NOD och skriva parets båda taggar i en följd är
     rätt så länge noderna är syskon och fel så snart en förälder är märkt
     tillsammans med sina barn: föräldern har lägst start och behandlas därför
     sist, medan barnens insättningar redan har flyttat föräldrans slutindex
     framåt. Föräldrans `</g>` landade då mitt inne i ett attributvärde, till
     exempel `ry="4</g>.2"` på höger öra, och `</g>` klipptes in i höger
     ögonbryns `d`. Ingenting kastade fel: taggarna gick jämnt ut, `saknas` var
     tom, och ändå saknade varje riggad figur ett öra och ett ögonbryn.

     Vid samma position skrivs öppningen före stängningen, eftersom den som
     skrivs sist hamnar först i strängen. Två angränsande syskon ska bli
     `</g><g class="...">` och inte tvärtom. */
  const punkter = [];
  for (const { nod, namn } of jobb) {
    punkter.push({ pos: nod.start, text: `<g class="${namn}">`, oppning: true });
    punkter.push({ pos: nod.slut, text: '</g>', oppning: false });
  }
  punkter.sort((a, b) => b.pos - a.pos || Number(b.oppning) - Number(a.oppning));

  let ut = svg;
  for (const { pos, text } of punkter) {
    ut = ut.slice(0, pos) + text + ut.slice(pos);
  }

  /* Rotens egen klass. Hela figuren ska kunna komma in, hoppa och tona. */
  const rotKlass = ['r-figur', klass].filter(Boolean).join(' ');
  const fanns = /<svg([^>]*)\bclass="([^"]*)"/.exec(ut);
  ut = fanns
    ? ut.replace(/(<svg[^>]*\bclass=")([^"]*)"/, `$1$2 ${rotKlass}"`)
    : ut.replace(/<svg\b/, `<svg class="${rotKlass}"`);

  const saknas = Object.entries(ansikte)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (!hittat.huvud && kroppG) saknas.push('huvud');
  if (kroppG && kroppG.barn.length >= 8 && !hittat.kropp) saknas.push('kropp');

  return { svg: ut, delar, saknas };
}

/**
 * Alla namn riggen kan sätta, i den ordning en stilmall rimligen läser dem.
 * Används av byggskripten för att skriva ut vad som hittades och vad som inte
 * gjorde det.
 */
export const RIGGDELAR = [
  'r-figur',
  'r-kropp', 'r-skugga', 'r-bal', 'r-pals',
  'r-ben-v', 'r-ben-h', 'r-fot-v', 'r-fot-h',
  'r-arm-v', 'r-arm-h', 'r-tass-v', 'r-tass-h',
  'r-huvud', 'r-oron', 'r-ora-v', 'r-ora-h',
  'r-band-v', 'r-band-h', 'r-nos',
  'r-vita-v', 'r-vita-h',
  'r-pupiller', 'r-pupill-v', 'r-pupill-h',
  'r-lock', 'r-lock-v', 'r-lock-h',
  'r-bryn', 'r-bryn-v', 'r-bryn-h',
  'r-mun',
];
