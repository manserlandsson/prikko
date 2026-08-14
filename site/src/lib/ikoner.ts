import type { TopCategoryId } from './categories';

/**
 * Nycklarna till Kategoriikon.astro.
 *
 * Typen bor i en egen modul och inte i komponenten, eftersom en .astro-fil
 * bara exporterar sin komponent. Kategorival.astro behöver samma typ för att
 * kunna ta emot en ikonnyckel i sina props, och två handskrivna unioner som
 * ska hållas i takt är precis den sorts sak som glider isär.
 *
 * `alla` är rutnätets hemläge, alltså "ingen filtrering", och inte en
 * kategori.
 */
export type IkonNyckel = TopCategoryId | 'alla';
