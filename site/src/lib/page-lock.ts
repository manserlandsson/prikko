/**
 * Skrollåset bakom sajtens ark, och tangentbordets höjd som CSS-variabel.
 *
 * ---------------------------------------------------------------------------
 * VARFÖR DET INTE RÄCKER MED overflow: hidden
 * ---------------------------------------------------------------------------
 * Både inloggningsrutan och omdömesrutan hade var sin egen kopia av
 * `document.body.style.overflow = 'hidden'`. Den raden stoppar besökarens
 * eget svep, men inte webbläsarens egen rullning, och det är webbläsarens
 * egen rullning som är problemet: när ett fält får fokus och tangentbordet
 * fälls upp rullar webbläsaren själv sidan för att få fram fältet.
 *
 * Mätt på startsidan, i den gamla varianten, med rutan öppen och låset på:
 * sidan stod på 400 px, `scrollTo(0, 1200)` flyttade den till 1200, och där
 * låg den kvar när rutan stängdes. Man loggade alltså in och hamnade åtta
 * hundra pixlar från där man var. Det är hälften av "sidan buggar ut lite".
 *
 * Det som faktiskt håller är att ta bort sidans rullning helt: `position:
 * fixed` på body med `top` satt till minus den rullning som gällde. Sidan
 * står stilla för att den inte längre KAN rulla, inte för att vi bett den.
 * Vid upplåsning läggs rullningen tillbaka exakt, i samma bildruta som
 * body återgår, så ingenting hinner målas i mellanläget.
 *
 * ---------------------------------------------------------------------------
 * ETT LÅS, INTE TVÅ
 * ---------------------------------------------------------------------------
 * Modulen räknar hur många ark som håller låset. Skälet är kedjan på
 * verksamhetssidan: "Skriv ett omdöme" utloggad öppnar inloggningsrutan, och
 * när den stänger öppnas omdömesrutan i samma klick. Med två egna lås blev
 * det lås av, lås på, alltså en återställd rullning och en ny fixering inom
 * samma ögonblick. Det syns som ett hopp.
 *
 * Upplåsningen skjuts därför ett ögonblick framåt, förbi de mikrotasker som
 * lämnar över från den ena rutan till den andra. Tar någon över låset innan
 * dess händer ingenting alls: sidan står stilla hela vägen genom kedjan, och
 * ingen behöver veta om någon annan yta också är öppen.
 *
 * ---------------------------------------------------------------------------
 * TANGENTBORDET
 * ---------------------------------------------------------------------------
 * iOS krymper INTE layoutviewporten när tangentbordet fälls upp, bara den
 * visuella. Ett ark som ligger mot `bottom: 0` ligger alltså mot underkanten
 * på något som just blev delvis dolt, och webbläsaren panorerar för att få
 * fram fältet. `dvh` hjälper inte, den räknar heller inte tangentbordet.
 *
 * Enda källan som vet är `visualViewport`. Skillnaden mellan layoutviewporten
 * och den synliga skrivs ut som `--keyboard-inset` på html-elementet, och
 * arken lyfter sig själva den biten i CSS. Variabeln finns bara medan låset
 * hålls, alltså bara medan ett ark är uppe.
 */

/** Egenskaper vi skriver på body och måste kunna lägga tillbaka exakt. */
const TOUCHED = ['position', 'top', 'left', 'right', 'width', 'overflow', 'paddingRight'] as const;

type Touched = (typeof TOUCHED)[number];

let holders = 0;
let applied = false;
let pendingRelease: ReturnType<typeof setTimeout> | 0 = 0;
let scrollTop = 0;
let saved: Partial<Record<Touched, string>> = {};

/**
 * Skriver tangentbordets höjd till `--keyboard-inset`.
 *
 * `innerHeight` är layoutviewporten och ändras inte av tangentbordet.
 * `visualViewport.height` är det som faktiskt syns. Mellanskillnaden, minus
 * det som redan panorerats bort upptill, är tangentbordet.
 *
 * Vid nypzoom betyder skillnaden något helt annat, alltså nollställs den då.
 * Ett ark ska inte lyfta sig en halv skärm för att någon zoomat in.
 */
function measureKeyboard(): void {
  const vv = window.visualViewport;
  let inset = 0;
  if (vv && vv.scale <= 1.01) {
    inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
  }
  document.documentElement.style.setProperty('--keyboard-inset', `${inset}px`);
}

/**
 * Mätningen utan låset, räknad för sig.
 *
 * Skrollåset behöver tangentbordets höjd, men det är inte det enda som gör
 * det. Sökpanelen räknar sin egen höjd mot utrymmet under fältet, och det
 * utrymmet krymper när tangentbordet fälls upp — men panelen är en popup och
 * får absolut INTE låsa sidan bakom sig. Utan den här uppdelningen hade
 * panelen fått en andra kopia av `visualViewport`-mätningen, alltså två
 * ställen som skriver samma variabel.
 *
 * Räknas för sig från låsets räknare: en öppen panel och ett öppet ark kan
 * hålla mätningen samtidigt, och variabeln får inte försvinna för att det
 * ena stängde.
 */
let keyboardWatchers = 0;

export function trackKeyboard(): void {
  keyboardWatchers += 1;
  if (keyboardWatchers > 1) return;
  measureKeyboard();
  window.visualViewport?.addEventListener('resize', measureKeyboard);
  window.visualViewport?.addEventListener('scroll', measureKeyboard);
}

export function untrackKeyboard(): void {
  if (keyboardWatchers === 0) return;
  keyboardWatchers -= 1;
  if (keyboardWatchers > 0) return;
  window.visualViewport?.removeEventListener('resize', measureKeyboard);
  window.visualViewport?.removeEventListener('scroll', measureKeyboard);
  document.documentElement.style.removeProperty('--keyboard-inset');
}

function apply(): void {
  const body = document.body;

  /* Rullningslistens bredd, mätt INNAN den försvinner. På telefon är den
     noll och kompensationen nedan gör ingenting. */
  const gap = window.innerWidth - document.documentElement.clientWidth;

  /**
   * Samma tal, men som CSS-variabel, för allt som ligger FAST i vyporten.
   *
   * Paddingen längre ned räddar bara sidans eget flöde. Ett ark med
   * `position: fixed` eller en <dialog> mäter mot vyporten i stället, och
   * vyporten växer med listens bredd i samma ögonblick som låset tar bort
   * listen. Mätt vid 1440 px med klassisk list, menyns panel:
   *
   *   före låset   panelen 1425 px bred, kortens vänsterkant på 181,0
   *   efter låset  panelen 1440 px bred, kortens vänsterkant på 188,5
   *
   * Alltså 7,5 px åt höger, kvar så länge menyn står öppen. Det är hoppet
   * ägaren beskrev: "när jag fäller ut hamburgaremenyn så hoppar den till
   * lite till höger". Att panelen hinner ritas en gång innan låset läggs på
   * beror på att <details> skickar sitt toggle-event asynkront.
   *
   * Variabeln finns bara medan låset hålls och är noll på telefon. Den som
   * ligger fast i vyporten läser den och drar av lika mycket, se .panel i
   * PlacePicker.astro.
   */
  document.documentElement.style.setProperty('--lock-gutter', `${gap}px`);

  scrollTop = window.scrollY;
  saved = {};
  for (const key of TOUCHED) saved[key] = body.style[key];

  body.style.position = 'fixed';
  body.style.top = `-${scrollTop}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.width = '100%';
  body.style.overflow = 'hidden';
  if (gap > 0) body.style.paddingRight = `${gap}px`;

  trackKeyboard();
}

function release(): void {
  const body = document.body;

  untrackKeyboard();

  document.documentElement.style.removeProperty('--lock-gutter');

  for (const key of TOUCHED) body.style[key] = saved[key] ?? '';

  /* Samma bildruta som återgången. `scrollTo` och inte `scrollTo({behavior})`:
     en mjuk rullning hit hade animerat tillbaka till utgångsläget, alltså
     precis det hopp låset finns för att slippa. */
  window.scrollTo(0, scrollTop);
}

/** Låser sidan bakom ett ark. Får kallas flera gånger; räknas. */
export function lockPage(): void {
  if (pendingRelease) {
    clearTimeout(pendingRelease);
    pendingRelease = 0;
  }
  holders += 1;
  if (!applied) {
    apply();
    applied = true;
  }
}

/**
 * Släpper låset. Sidan återgår först när sista arket släppt det.
 *
 * `setTimeout` och inte `requestAnimationFrame`. Båda kommer efter
 * mikrotaskerna, alltså efter det `await openSignIn(...)` som lämnar över
 * till nästa ruta, och det är vad uppskjutningen finns för. Men rAF står
 * still i en bortvald flik, och en flik kan bli bortvald just när rutan
 * stängs. Då hade sidan legat fixerad tills fliken visades igen.
 */
export function unlockPage(): void {
  if (holders === 0) return;
  holders -= 1;
  if (holders > 0 || !applied || pendingRelease) return;

  pendingRelease = setTimeout(() => {
    pendingRelease = 0;
    if (holders > 0) return;
    applied = false;
    release();
  }, 0);
}
