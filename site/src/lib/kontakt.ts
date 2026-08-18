/**
 * Kontaktuppgifter och egenskaper ur OpenStreetMap.
 *
 * Uppgiften kommer ur samma Overpass-uttag som öppettiderna och paras ihop av
 * pipeline/oppettider.py. Den här modulen vet vad koderna BETYDER och
 * ingenting om var de kommer ifrån.
 *
 * Åtskild från lib/oppettider.ts med flit, av samma skäl som den modulen är
 * åtskild från lib/foretag.ts: de ser lika ut på skärmen och är olika data med
 * olika villkor. Öppettiden är ett veckoschema som ska utvärderas mot en
 * klocka; det här är påståenden som bara ska skrivas ut.
 *
 * ---------------------------------------------------------------------------
 * INGEN TÄCKNINGSGRÄNS STYR VAD SOM VISAS
 * ---------------------------------------------------------------------------
 * Ägaren, ordagrant: "har vi datan bara på få så är det fortfarande bättre?
 * kan vi visa telefonnummer på 10 av 10000 så är det värt det."
 *
 * Han har rätt, och skälet är att en VISNING inte har någon nedsida. Den som
 * får ett telefonnummer blir hjälpt. Den som inte får ett ser ingenting alls
 * och är precis lika illa ute som innan.
 *
 * Tröskeln i docs/33 §7, som fällde öppettidsfiltret vid 65 av 712, gäller
 * fortfarande men bara tre saker, och inget av dem finns i den här modulen:
 *
 *   FILTER OCH SORTERING, där låg täckning DÖLJER. Besökaren kan inte skilja
 *   "har ingen uteservering" från "vi vet inte", och nio av tio försvinner ur
 *   listan utan att någon ser att de försvann.
 *
 *   TAL SOM PÅSTÅR FULLSTÄNDIGHET. "12 av 190 har uteservering" är falskt när
 *   vi känner till uppgiften för 20 av de 190. Nämnaren måste vara sann.
 *
 *   LISTOR OCH TOPPAR. "Bäst i närheten" över ett fält vi känner till för fem
 *   procent rangordnar vår datalucka och inte verkligheten.
 *
 * Nämnaren per kommun står mätt i docs/37_osm_taggar.md. Läs den innan någon
 * bygger något av de tre sakerna ovan.
 *
 * ---------------------------------------------------------------------------
 * SAKNAS UPPGIFTEN VISAS INGENTING
 * ---------------------------------------------------------------------------
 * Aldrig en rad som säger att vi inte vet. Samma dom som öppettiderna redan
 * lyder under: en tom ruta med "Telefonnummer saknas" är en rad som ser ut som
 * ett besked, och den hade stått på nästan sju tusen sidor.
 */

/**
 * Vad pipelinen skriver i `contact`. Allt utom `checkedAt` kan saknas, och
 * gör det på de flesta verksamheter.
 *
 * Formen är platt och inte nästlad, av samma skäl som veckoschemat är en rad:
 * datafilerna skrivs med indent=1 och varje nivå kostar en rad per verksamhet
 * och fält.
 */
export interface Contact {
  phone?: string;
  website?: string;
  email?: string;
  /** Ett till tre kök, komma emellan: "kebab,pizza". */
  cuisine?: string;
  outdoor?: string;
  takeaway?: string;
  delivery?: string;
  wheelchair?: string;
  toilets?: string;
  smoking?: string;
  reservation?: string;
  wifi?: string;
  /** Det som ERBJUDS, komma emellan: "vegetarian,vegan". */
  diet?: string;
  /** "cards", "cash" eller "nocash", komma emellan. */
  payment?: string;
  /** OSM-objektet uppgiften kommer ur, t.ex. "node/1234". */
  osm: string;
  /** ISO-datum då vi hämtade uppgiften ur OSM. */
  checkedAt: string;
}

/** En rad att skriva ut: vad det handlar om, och vad som gäller. */
export interface Rad {
  /** Etiketten till vänster. */
  label: string;
  /** Beskedet till höger. */
  value: string;
}

/**
 * Köken, översatta.
 *
 * Listan täcker de värden som faktiskt står i vårt uttag, mätt 2026-08-18:
 * pizza 213, sushi 131, burger 118, italian 98 och så vidare ned till enstaka.
 * Ett kök vi inte har en svensk term för skrivs ut med versal begynnelse i
 * stället för att kastas: "Poké" säger mer än ingenting, och listan skulle
 * annars behöva växa varje gång någon kartlägger ett nytt kök.
 */
const KOK: Record<string, string> = {
  pizza: 'pizza',
  sushi: 'sushi',
  burger: 'hamburgare',
  italian: 'italienskt',
  coffee_shop: 'kaffe',
  asian: 'asiatiskt',
  indian: 'indiskt',
  regional: 'husmanskost',
  thai: 'thailändskt',
  japanese: 'japanskt',
  sandwich: 'smörgåsar',
  chinese: 'kinesiskt',
  kebab: 'kebab',
  greek: 'grekiskt',
  tapas: 'tapas',
  lebanese: 'libanesiskt',
  grill: 'grill',
  ramen: 'ramen',
  french: 'franskt',
  mexican: 'mexikanskt',
  salad: 'sallad',
  vietnamese: 'vietnamesiskt',
  swedish: 'svenskt',
  fish: 'fisk',
  seafood: 'skaldjur',
  turkish: 'turkiskt',
  american: 'amerikanskt',
  spanish: 'spanskt',
  persian: 'persiskt',
  ethiopian: 'etiopiskt',
  korean: 'koreanskt',
  international: 'internationellt',
  bubble_tea: 'bubbelte',
  ice_cream: 'glass',
  chicken: 'kyckling',
  barbecue: 'barbecue',
  steak_house: 'stekhus',
  breakfast: 'frukost',
  bakery: 'bageri',
  cake: 'bakverk',
  dessert: 'efterrätter',
  falafel: 'falafel',
  poke: 'poké',
  noodle: 'nudlar',
  pasta: 'pasta',
  soup: 'soppa',
  vegan: 'veganskt',
  vegetarian: 'vegetariskt',
  juice: 'juice',
  tea: 'te',
  wine_bar: 'vinbar',
  pub: 'pub',
};

/** Kosthållningen, översatt. */
const KOST: Record<string, string> = {
  vegetarian: 'vegetariskt',
  vegan: 'veganskt',
  gluten_free: 'glutenfritt',
  halal: 'halal',
  kosher: 'kosher',
  lactose_free: 'laktosfritt',
};

/**
 * Betalsätten, som en mening och inte som en uppräkning.
 *
 * Kort PLUS uttryckligt nej till kontanter betyder "endast kort", och det är
 * det beskedet läsaren behöver: det avgör om man behöver gå till en
 * bankomat först. En rak uppräkning hade gett "kort och inga kontanter",
 * vilket är samma uppgift skriven så att den låter som ett fel.
 */
function betalning(raw: string | undefined): string | null {
  if (!raw) return null;
  const delar = new Set(raw.split(',').map((d) => d.trim()));
  const kort = delar.has('cards');
  if (kort && delar.has('nocash')) return 'Endast kort';
  if (kort && delar.has('cash')) return 'Kort och kontant';
  if (kort) return 'Kort';
  if (delar.has('cash')) return 'Kontant';
  if (delar.has('nocash')) return 'Inga kontanter';
  return null;
}

function versal(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Slå upp varje del i en kommalista, och skriv ut det som en mening. */
function lista(raw: string | undefined, ordbok: Record<string, string>): string | null {
  if (!raw) return null;
  const delar = raw
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => ordbok[d] ?? d.replace(/_/g, ' '));
  if (delar.length === 0) return null;
  /* "pizza och sushi", inte "pizza, sushi". Två eller tre korta ord med ett
     "och" läses som en mening; med kommatecken läses de som en tabellcell. */
  if (delar.length === 1) return delar[0];
  return `${delar.slice(0, -1).join(', ')} och ${delar[delar.length - 1]}`;
}

/**
 * Ett ja-eller-nej-fält, med de besked som INTE är ja eller nej utskrivna för
 * sig.
 *
 * `limited` och `only` avrundas aldrig. "Delvis tillgänglig" är inte samma sak
 * som tillgänglig, och den som sitter i rullstol är just den läsare som inte
 * ska behöva gissa vilket av dem vi menade. `only` på avhämtning betyder att
 * det inte GÅR att sitta ner.
 */
function besked(
  value: string | undefined,
  texter: Partial<Record<string, string>>,
): string | null {
  if (!value) return null;
  return texter[value] ?? null;
}

/**
 * Kontaktraderna: telefon, webbplats och e-post.
 *
 * Skilda från egenskaperna nedan eftersom de är HANDLINGAR. Läsaren ringer,
 * klickar eller skriver, och de tre är därför länkar och står överst. Resten
 * är påståenden om stället.
 */
export interface KontaktLank {
  label: string;
  /** Vad som står på skärmen. */
  text: string;
  href: string;
  /** Vilken ikon Kontaktuppgifter.astro ska rita. */
  kind: 'phone' | 'globe' | 'mail';
}

/**
 * Telefonnumret grupperat som en svensk läser det.
 *
 * Lagrat är det bara siffror, "+46855122812", för att `tel:`-länken ska bli
 * densamma oavsett hur någon skrivit mellanslagen i OSM. På skärmen är den
 * formen oläsbar, och den ska dessutom gå att jämföra med numret på dörren.
 *
 * Riktnumret i Sverige är två till fyra siffror och det finns ingen regel som
 * går att härleda ur numret självt. Stockholm är 08 och det är den överlägset
 * vanligaste förekomsten i vårt bestånd, mobilnumren börjar på 07, och för
 * resten faller vi tillbaka på en gruppering som är läsbar utan att påstå var
 * riktnumret slutar.
 */
export function formatPhone(raw: string): string {
  if (!raw.startsWith('+46')) return raw;
  const digits = raw.slice(3);
  /* Nationell form: OSM skriver +46 följt av numret utan den inledande nollan,
     och en svensk läsare känner igen 08 och 070 men inte 8 och 70. */
  const national = `0${digits}`;
  const rest = (from: number) =>
    national
      .slice(from)
      .replace(/(\d{2,3})(?=(\d{2})+$)/g, '$1 ')
      .trim();

  if (national.startsWith('07')) return `${national.slice(0, 3)}-${rest(3)}`;
  if (national.startsWith('08')) return `${national.slice(0, 2)}-${rest(2)}`;
  /* Övriga riktnummer är tre eller fyra siffror. Tre är vanligast utanför
     storstäderna, och skulle det vara fyra står bindestrecket en siffra fel
     i ett nummer som ändå går att ringa och läsa. */
  return `${national.slice(0, 3)}-${rest(3)}`;
}

/**
 * Värdnamnet, utan schema, utan www och utan avslutande snedstreck.
 *
 * Samma grepp som Foretagsuppgifter.astro använder för verksamhetens egen
 * webbplats. En full URL i en faktarad bryter raden och säger inget mer än
 * värdnamnet gör.
 */
export function formatHost(raw: string): string {
  try {
    return new URL(raw).hostname.replace(/^www\./, '');
  } catch {
    return raw;
  }
}

export function kontaktLankar(contact: Contact): KontaktLank[] {
  const out: KontaktLank[] = [];
  if (contact.phone) {
    out.push({
      label: 'Telefon',
      text: formatPhone(contact.phone),
      /* `tel:` med bara siffror, så att mobilen ringer numret och inte
         försöker tolka mellanslagen vi satte dit för läsbarheten. */
      href: `tel:${contact.phone}`,
      kind: 'phone',
    });
  }
  if (contact.website) {
    out.push({
      label: 'Webbplats',
      text: formatHost(contact.website),
      href: contact.website,
      kind: 'globe',
    });
  }
  if (contact.email) {
    out.push({
      label: 'E-post',
      text: contact.email,
      href: `mailto:${contact.email}`,
      kind: 'mail',
    });
  }
  return out;
}

/**
 * Egenskaperna som utskrivna rader, i den ordning de ska stå.
 *
 * Ordningen är efter hur ofta någon frågar efter uppgiften och inte efter hur
 * ofta vi har den: köket först eftersom det säger vad stället ÄR, sedan det
 * man planerar sitt besök efter.
 */
export function egenskaper(contact: Contact): Rad[] {
  const rader: Rad[] = [];
  const lagg = (label: string, value: string | null) => {
    if (value) rader.push({ label, value });
  };
  /** En kommalista, uppslagen och med versal begynnelse. */
  const uppraikning = (raw: string | undefined, ordbok: Record<string, string>) => {
    const text = lista(raw, ordbok);
    return text === null ? null : versal(text);
  };

  lagg('Kök', uppraikning(contact.cuisine, KOK));
  lagg(
    'Uteservering',
    besked(contact.outdoor, { yes: 'Ja', no: 'Nej' }),
  );
  lagg(
    'Avhämtning',
    besked(contact.takeaway, { yes: 'Ja', no: 'Nej', only: 'Endast avhämtning' }),
  );
  lagg('Hemleverans', besked(contact.delivery, { yes: 'Ja', no: 'Nej' }));
  lagg(
    'Rullstol',
    besked(contact.wheelchair, {
      yes: 'Tillgängligt',
      limited: 'Delvis tillgängligt',
      no: 'Inte tillgängligt',
    }),
  );
  lagg('Toalett', besked(contact.toilets, { yes: 'Ja', no: 'Nej' }));
  lagg('Kosthållning', uppraikning(contact.diet, KOST));
  lagg('Betalning', betalning(contact.payment));
  lagg(
    'Wi-Fi',
    besked(contact.wifi, { wlan: 'Ja', yes: 'Ja', no: 'Nej', terminal: 'Dator finns' }),
  );
  lagg(
    'Rökning',
    besked(contact.smoking, { no: 'Inte tillåtet', outside: 'Tillåtet utomhus', isolated: 'Avskilt rum' }),
  );
  lagg(
    'Bordsbokning',
    besked(contact.reservation, {
      yes: 'Går att boka',
      no: 'Går inte att boka',
      required: 'Krävs',
      recommended: 'Rekommenderas',
    }),
  );
  return rader;
}

/** Har vi något alls att skriva ut? Styr om kortet finns på sidan. */
export function harNagot(contact: Contact | null | undefined): boolean {
  if (!contact) return false;
  return kontaktLankar(contact).length > 0 || egenskaper(contact).length > 0;
}

/**
 * Rubriken över kontaktlänkarna, härledd ur vad vi FAKTISKT har.
 *
 * En rubrik får aldrig lova mer än raderna under den håller. "Kontakt" över
 * en ensam webbplatsrad antyder att det finns ett telefonnummer att ringa,
 * och läsaren som kom hit för att ringa hittar det inte och tror att hen
 * missat något.
 *
 * Alltså: står bara ett fält där heter rubriken det fältet. Står två eller
 * tre är "Kontakt" det enda ord som täcker dem utan att räkna upp dem, och då
 * lovar det inte heller något särskilt.
 *
 * Talen bakom, mätt ur de skrivna datafilerna: 705 av de 3 274 korten bär
 * exakt EN länk, och de fördelar sig 495 webbplats, 206 telefon och 4 e-post.
 * Fallet med enbart webbplats är alltså inget hörnfall utan femhundra sidor
 * där rubriken "Kontakt" hade lovat ett telefonnummer vi inte har.
 */
export function kontaktRubrik(lankar: KontaktLank[]): string | null {
  if (lankar.length === 0) return null;
  if (lankar.length === 1) return lankar[0].label;
  return 'Kontakt';
}
