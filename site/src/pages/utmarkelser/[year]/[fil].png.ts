/**
 * Märket som PNG, två storlekar per utgåva.
 *
 * Samma resonemang som marke.svg.ts intill: filen lever utanför sajten, den
 * bär sitt årtal i själva bilden, och den nämner ingen verksamhet. Skillnaden
 * är vad den är till för. SVG:n sätts på en webbsida där bakgrunden är känd
 * och storleken fri. PNG:n hamnar i ett inlägg eller på ett papper, alltså på
 * en yta vi inte ser, och där måste både bottnen och måtten vara bestämda.
 *
 * Bredderna och luften runt ritningen står i lib/emblem.ts, eftersom
 * emblemsidan räknar upp samma mått i sin nedladdningslista och de två aldrig
 * får säga olika. Rasteriseringen står i lib/marke-raster.ts.
 *
 * En egen rutt och inte en fil i public/: en incheckad PNG är en kopia som
 * inte vet om när ritningen ändras. Här faller båda formaten ut ur samma
 * källa vid samma bygge.
 */
import type { APIRoute } from 'astro';
import { RASTER, pngName } from '../../../lib/emblem';
import { markPng } from '../../../lib/marke-raster';
import { editions } from '../../../lib/utmarkelser';
import { absolute } from '../../../lib/urls';

export function getStaticPaths() {
  return editions().flatMap((e) =>
    RASTER.map((r) => ({
      params: { year: String(e.year), fil: pngName(r.width).replace(/\.png$/, '') },
      props: { width: r.width },
    })),
  );
}

export const GET: APIRoute = async ({ params, props }) => {
  const year = Number(params.year);
  const width = (props as { width: number }).width;

  return new Response(await markPng(year, width, absolute('utmarkelser', year)), {
    headers: {
      'Content-Type': 'image/png',
      /* Samma huvud som marke.svg sätter, av samma skäl. Observera att
         Cloudflare Pages tar sina cachehuvuden ur public/_headers och inte
         härifrån: ett statiskt bygge skriver bara kroppen till fil. Raden står
         kvar för den dag rutten körs på en server. */
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
