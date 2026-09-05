/**
 * Grunden bakom "Brister som kvarstår", och den mening som får stå om den.
 *
 * ## Felet modulen finns för att laga
 *
 * Fram till 2026-09-05 gav `VERDICT.major.sentence` i site.ts EN fast mening
 * till alla sidor med bedömningen: "har brister som inte åtgärdats vid
 * kommunens uppföljning". Meningen påstod alltså ett återbesök, på varenda
 * sida med vårt hårdaste omdöme, med verksamheten namngiven.
 *
 * `_is_persisting()` i pipeline/prikko/grading.py har två grenar, och bara
 * den ena handlar om ett återbesök. Den andra är ren upprepning: föregående
 * kontroll hade också avvikelser. Där finns ingen uppföljning alls.
 *
 * Uppmätt över site/src/data 2026-09-05, med femårsfönstret och
 * HISTORY_DEPTH = 3 ur grading.py, 403 verksamheter med `major`:
 *
 *     återbesök      268 (66,5 %)   senaste kontrollen är märkt som återbesök
 *     kommunens tvåa   5 ( 1,2 %)   kommunens egen högsta nivå, ej återbesök
 *     upprepning     130 (32,3 %)   ingen uppföljning i datan över huvud taget
 *
 * Upprepningarna ligger i Stockholm 90, Svenljunga 16, Örebro 13,
 * Norrköping 6, Linköping 4 och Höganäs 1. Riche i Stockholm var det fall
 * som avslöjade felet: sidan sade "brister som inte åtgärdats vid kommunens
 * uppföljning den 17 februari 2026", medan den enda uppföljningen i
 * historiken skedde 2019-11-28 och gav inga anmärkningar, och 17 februari
 * 2026 står i historiken som planerad kontroll.
 *
 * ETIKETTEN "Brister som kvarstår" ÄR OFÖRÄNDRAD och ska förbli det. Den är
 * sann i alla tre fallen och sitter i märket, kartan, listorna, API:t och
 * delningsbilderna. Det är bara den förklarande meningen som varierar.
 *
 * ## Varför ordningen är återbesök först
 *
 * lib/matsnusk.ts har samma tredelning men prövar kommunens tvåa först, och
 * det är rätt DÄR: den skriver ut ett eget referat per gren, och båda
 * referaten är sanna om en kontroll som är både ett återbesök och en tvåa.
 * Här väljs EN mening, och då måste den starkaste bevisade grenen gå först.
 *
 * Det talet är mätt, inte antaget. Av de 75 sidor där kommunens egen
 * bedömning på senaste kontrollen är en tvåa är 70 dessutom återbesök
 * (Örebro 52, Uppsala 11, Linköping 7). Kvar i grenen `stated` blir exakt
 * fem sidor, och de fem är genomgångna en och en:
 *
 *   Linköping 3   "Ej godtagbar", kommunens eget ord för underkänd. Ingen
 *                 kontrollpunkt är märkt "Kvarstår", alltså ingen uppföljning.
 *   Lomma 2       röd prick, som kommunens läsanvisning definierar som
 *                 avvikelser med myndighetsåtgärd, föreläggande eller förbud.
 *                 Lomma redovisar ingen kontrollorsak alls, allt är typ 0.
 *
 * Båda är kommunens EGEN högsta nivå, satt vid en kontroll som inte är ett
 * återbesök. Meningen för `stated` säger precis det och ingenting mer.
 *
 * FÄLLAN ATT KÄNNA TILL: Örebro publicerar inget helhetsomdöme per kontroll.
 * Deras tvåa räknas fram av oss ur kontrollpunkter märkta "Kvarstår", se
 * `assessment_from_areas()` i sources/orebro.py. Skulle en sådan punkt dyka
 * upp på en PLANERAD kontroll hamnar sidan i `stated` och meningen skulle
 * tillskriva Örebro ett omdöme kommunen inte gett. Uppmätt 2026-09-05 är det
 * noll sidor, eftersom alla 52 är återbesök. Blir talet större än noll ska
 * grenen delas, inte formuleringen tänjas.
 *
 * ## Varför härlett här och inte buret från pipelinen
 *
 * Grunden går att läsa exakt ur `inspections`, som redan följer med i
 * datafilerna, alltså behövs varken ett nytt fält i `Assessment`, en ny
 * kolumn i databasen eller en ny nattlig körning. Kontrollerat: för samtliga
 * 403 sidor är `inspections[0]` samma kontroll som `recent[0]` i grading.py,
 * eftersom en bedömning per definition kräver en kontroll inom
 * femårsfönstret och exporten sorterar nyast först.
 *
 * Fällan med FILFALT och KONTROLLFALT i pipeline/export_supabase.py är alltså
 * inte aktuell här, och det är själva vinsten: ett fält som byggs ur grunden
 * i pipelinen får inte stå i de listorna, annars vinner gårdagens fil över
 * databasen.
 */
import type { Establishment } from './db';

/**
 * Vad vår skärpning till "Brister som kvarstår" faktiskt vilar på.
 *
 * Samma tre ord som `MatsnuskRow['ground']` i lib/matsnusk.ts, med avsikt:
 * två namn på samma tredelning hade garanterat glidit isär. Ordningen de
 * prövas i skiljer sig däremot, se modulhuvudet.
 */
export type MajorGround = 'followup' | 'stated' | 'repeat';

/**
 * Grunden för en sida med `major`, eller null när bedömningen är en annan.
 *
 * De två första grenarna prövas mot fakta i datan; 'repeat' är resten. Det
 * är rätt riktning att fela åt, eftersom 'repeat' är det mildaste av de tre
 * påståendena: skulle sajtens datafil och pipelinens bedömning någon gång gå
 * isär säger vi hellre för lite än ett återbesök som inte skett.
 *
 * Att resten verkligen ÄR en upprepning är kontrollerat 2026-09-05. Av de
 * 130 sidorna bär 129 avvikelser redan vid kontrollen närmast före. Den
 * enda som inte gör det, Lilla Pralinen i Linköping, har två kontrollrader
 * på samma datum 2023-04-14 där den ena bär en tvåa och den andra en nolla;
 * upprepningen finns alltså men ligger ett steg längre in i historiken,
 * inom grading.py:s fönster om HISTORY_DEPTH = 3.
 */
export function majorGround(e: Establishment): MajorGround | null {
  if (e.verdict !== 'major') return null;

  const latest = e.inspections[0];
  if (!latest) return null;

  if (latest.type === 1) return 'followup';
  if (latest.assessment === 2) return 'stated';
  return 'repeat';
}

/**
 * Meningen som leder verksamhetssidan, en per grund.
 *
 * Varje mening tar ett datumled efter sig, `den ${datum}`, precis som de
 * andra i VERDICT i site.ts, och datumet är den senaste kontrollens.
 *
 * Tre saker ingen av dem får göra, och som den gamla fasta meningen gjorde:
 * påstå ett besök som inte finns i datan, tillskriva kommunen en bedömning
 * den inte gjort, och låta hårdare än vad grunden bär.
 *
 *   followup   "Återbesök" är kommunens egen uppmärkning på kontrollen, samma
 *              ord som INSPECTION_TYPE_LABEL[1] i data.ts och samma ord som
 *              står på raden i kontrollhistoriken längre ned på sidan.
 *              Meningen säger inget om kontrollen FÖRE, eftersom den inte
 *              alltid finns hos oss: Karlstads 219 återbesök är den äldsta
 *              raden i registret, se followUp() i data.ts.
 *   stated     Kommunens egen högsta nivå, inget om något återbesök.
 *   repeat     "igen" är hela påståendet, och det är precis vad gren 2 i
 *              `_is_persisting()` bevisar: avvikelser också vid kontrollen
 *              före. Ingen uppföljning nämns, för ingen har skett.
 */
export const MAJOR_SENTENCE: Record<MajorGround, string> = {
  followup: 'fick anmärkningar vid kommunens återbesök',
  stated: 'fick kommunens allvarligaste omdöme vid hygienkontrollen',
  repeat: 'fick anmärkningar igen vid hygienkontrollen',
};

/**
 * Meningen för en verksamhet, eller null när bedömningen inte är `major`.
 *
 * Sidmallen ska aldrig behöva känna till grenarna, bara be om meningen.
 */
export function majorSentence(e: Establishment): string | null {
  const ground = majorGround(e);
  return ground === null ? null : MAJOR_SENTENCE[ground];
}
