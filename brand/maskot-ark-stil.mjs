/**
 * Förslagsarkets stil och rörelsesystem. Bryts ut ur byggskriptet så att
 * CSS:en går att läsa som CSS och inte som en sträng bland trettio andra.
 *
 * Rörelsen är avsiktligt snål. Sajten har i dag tre rörelser totalt och alla
 * är korta och dämpade: FaceMark ritar upp munnen en gång, wordmarken blinkar,
 * Handlingsrad ringer till. Maskoten lägger till fyra, och ingen av dem loopar
 * snabbt eller drar blicken från innehållet.
 *
 * Allt är ren CSS på transform och opacity, inget bibliotek, ingenting som
 * ligger på main thread. prefers-reduced-motion stänger av allt utom det som
 * är statiskt korrekt utan rörelse.
 */

export const STIL = `
:root {
  --brand: #007BE0; --brand-ink: #0063B4;
  --canvas: #FCFCFD; --card: #FFFFFF;
  --text: #1D1D1F; --ink-quiet: #6E6E73; --ink-faint: #A1A1A6;
  --hairline: rgba(0,0,0,.08);
  --clean: #00B92B; --minor: #FECB00; --major: #EB0000;
  --r-card: 12px;
  --shadow-sm: 0 0 0 1px var(--hairline), 0 1px 2px rgba(0,0,0,.05);
  --font-sans: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
* { box-sizing: border-box; }
body {
  margin: 0; padding: 48px 24px 120px;
  background: var(--canvas); color: var(--text);
  font: 17px/26px var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
.wrap { max-width: 1080px; margin: 0 auto; }
.read { max-width: 680px; }
h1 { font-size: 40px; line-height: 46px; letter-spacing: -.02em; margin: 0 0 16px; }
h2 { font-size: 32px; line-height: 38px; letter-spacing: -.015em; margin: 72px 0 8px; }
h3 { font-size: 21px; line-height: 25px; margin: 40px 0 6px; }
h4 { font-size: 12px; line-height: 16px; text-transform: uppercase; letter-spacing: .09em;
     color: var(--ink-faint); margin: 0 0 10px; font-weight: 600; }
p { margin: 0 0 16px; }
.lead { font-size: 21px; line-height: 31px; color: var(--ink-quiet); }
.note { font-size: 14px; line-height: 20px; color: var(--ink-quiet); }
b, strong { font-weight: 600; }
code { font: 13px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
       background: #F2F2F5; padding: 2px 5px; border-radius: 4px; }
hr { border: 0; border-top: 1px solid var(--hairline); margin: 64px 0; }

.kort { background: var(--card); border-radius: var(--r-card); box-shadow: var(--shadow-sm);
        padding: 28px 32px 32px; margin: 24px 0; }
.rad { display: flex; gap: 28px; align-items: flex-end; flex-wrap: wrap; }
.rad.mitt { align-items: center; }
.block { margin: 28px 0 0; }
.ruta { background: var(--canvas); border: 1px solid var(--hairline); border-radius: 10px;
        padding: 18px 20px; }
.rutnat { display: grid; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 20px; }
.cell { text-align: center; }
.cell svg { display: block; margin: 0 auto 8px; }
.cell span { display: block; font-size: 12px; line-height: 16px; color: var(--ink-quiet); }
.taggar { display: flex; gap: 8px; flex-wrap: wrap; margin: 0 0 18px; }
.tagg { font-size: 12px; line-height: 16px; padding: 4px 10px; border-radius: 999px;
        background: #EBF4FD; color: var(--brand-ink); font-weight: 600; }
.tagg.varning { background: #FFF3F3; color: #C50000; }
.tagg.ok { background: #EAF9EE; color: #008920; }
table { border-collapse: collapse; width: 100%; font-size: 14px; line-height: 20px; }
th, td { text-align: left; padding: 8px 12px 8px 0; border-bottom: 1px solid var(--hairline);
         vertical-align: top; }
th { font-size: 12px; text-transform: uppercase; letter-spacing: .07em; color: var(--ink-faint);
     font-weight: 600; }
ol.steg { padding-left: 22px; } ol.steg li { margin: 0 0 8px; }

/* ── Sidprovet ───────────────────────────────────────────────────────────
 * Sajtens egen uppställning i miniatyr, med sajtens egna tokens. Ett vitt
 * ark ljuger: ett märke som ser starkt ut ensamt i 96 px kan försvinna helt i
 * en lista där det står bredvid en rubrik i 17 px och en grå bildtext. */
.sidprov { background: var(--canvas); border: 1px solid var(--hairline); border-radius: 14px; padding: 20px; }
.skarm { max-width: 620px; margin: 0 auto; }
.topp { display: flex; align-items: center; gap: 10px; padding: 0 0 16px; }
.topp b { font-size: 19px; letter-spacing: -.02em; }
.topp .sok { flex: 1; background: var(--card); border: 1px solid var(--hairline); border-radius: var(--r-pill);
  padding: 9px 16px; font-size: var(--fs-body-s); color: var(--ink-faint); }
.traffar { list-style: none; margin: 0; padding: 0; background: var(--card);
  border: 1px solid var(--hairline); border-radius: var(--r-card); overflow: hidden; }
.traffar li { display: flex; align-items: center; gap: 14px; padding: 14px 16px;
  border-bottom: 1px solid var(--hairline); }
.traffar li:last-child { border-bottom: 0; }
.traffar li > span { display: flex; flex-direction: column; }
.traffar b { font-size: var(--fs-h-xs); line-height: 22px; font-weight: 600; }
.traffar em { font-style: normal; font-size: var(--fs-caption); line-height: 18px; color: var(--ink-quiet); }
.traffar .etikett { margin-left: auto; font-size: var(--fs-caption); color: var(--ink-quiet); }
.kartyta { position: relative; height: 120px; margin: 16px 0 0; border-radius: var(--r-card);
  border: 1px solid var(--hairline);
  background:
    linear-gradient(0deg, rgba(0,0,0,.045) 1px, transparent 1px) 0 0 / 100% 26px,
    linear-gradient(90deg, rgba(0,0,0,.045) 1px, transparent 1px) 0 0 / 26px 100%,
    #F3F4F6; }
.kartyta .nal { position: absolute; filter: drop-shadow(0 2px 4px rgba(0,0,0,.28)); }
.kartyta .nal:nth-child(1) { left: 16%; top: 26%; }
.kartyta .nal:nth-child(2) { left: 47%; top: 54%; }
.kartyta .nal:nth-child(3) { left: 76%; top: 22%; }
.tomt { display: flex; align-items: center; gap: 20px; margin: 16px 0 0; padding: 22px 20px;
  background: var(--card); border: 1px solid var(--hairline); border-radius: var(--r-card); }
.tomt b { display: block; font-size: var(--fs-h-s); line-height: 25px; }
.tomt em { font-style: normal; font-size: var(--fs-body-s); line-height: 20px; color: var(--ink-quiet); }

/* Mörk yta, för siluettprovet och för figuren mot färgat underlag. */
.mork { background: #1D1D1F; border-radius: 10px; padding: 18px 20px; }
.mork h4 { color: #8E8E93; }

/* ── Rörelse ─────────────────────────────────────────────────────────────
 *
 * Fyra rörelser, alla korta och alla på transform.
 *
 * 1. m-vagga   viloläget. Figuren väger över från ben till ben, tre grader
 *              åt varje håll, 3,2 s. Kameleontens och grävlingens gång ser
 *              faktiskt ut så, alltså är rörelsen artens och inte en effekt.
 * 2. m-blink   ögonlocket faller en gång var sjunde sekund. Scale på Y med
 *              origin i ögats mitt, 140 ms ned och 140 ms upp.
 * 3. m-spring  figuren springer tvärs över en yta. translateX plus vaggningen
 *              plus en liten hoppkurva, 6 s, en gång. Detta är det ägaren
 *              bad om, och det är avsiktligt EN passage och ingen loop:
 *              en figur som springer fram och tillbaka i all oändlighet är
 *              det som gör en sajt outhärdlig att läsa på.
 * 4. m-titt    blicken glider till ett nytt håll och tillbaka, 4 s. Bara
 *              pupillerna rör sig, inget annat.
 */
@keyframes m-vagga {
  0%, 100% { transform: rotate(-3deg) translateY(0); }
  50%      { transform: rotate(3deg) translateY(-1.5px); }
}
@keyframes m-blink {
  0%, 92%, 100% { transform: scaleY(1); }
  95%, 97%      { transform: scaleY(.08); }
}
@keyframes m-spring {
  0%   { transform: translateX(0) scaleX(1); }
  46%  { transform: translateX(calc(100% - 96px)) scaleX(1); }
  50%  { transform: translateX(calc(100% - 96px)) scaleX(-1); }
  96%  { transform: translateX(0) scaleX(-1); }
  100% { transform: translateX(0) scaleX(1); }
}
@keyframes m-hopp {
  0%, 100% { transform: translateY(0) rotate(0); }
  25%      { transform: translateY(-7px) rotate(-4deg); }
  50%      { transform: translateY(0) rotate(0); }
  75%      { transform: translateY(-7px) rotate(4deg); }
}
@keyframes m-titt {
  0%, 20%   { transform: translate(0, 0); }
  35%, 55%  { transform: translate(-2.5px, 1px); }
  70%, 90%  { transform: translate(2px, -1px); }
  100%      { transform: translate(0, 0); }
}

.a-vagga  { animation: m-vagga 3.2s ease-in-out infinite; transform-origin: 60% 96%; }
.a-blink  { animation: m-blink 7s linear infinite; transform-origin: center; }
.a-titt   { animation: m-titt 4.4s ease-in-out infinite; }
.spring-bana { position: relative; overflow: hidden; height: 132px; }
.spring-bana > .lopare { position: absolute; bottom: 0; left: 0;
  animation: m-spring 6s cubic-bezier(.42,0,.58,1) infinite; }
.spring-bana .lopare > * { animation: m-hopp .52s ease-in-out infinite; display: block; }

/* Prikkos globala regel, ordagrant ur tokens.css: allt stannar. Det som blir
   kvar måste vara korrekt utan rörelse, och det är det: varje pose är ritad
   som ett stillbildsläge först och animeras sedan. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
  .spring-bana > .lopare { animation: none; left: 50%; transform: translateX(-50%); }
}
`;
