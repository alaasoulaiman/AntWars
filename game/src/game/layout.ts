// Copyright (c) 2026 Alaa Soulaiman and KovaTech Industries Inc. MIT License, see LICENSE.
// Where the HUD's two card stacks sit, as plain numbers in HUD units (720 wide, H tall). The shop's three cards sit low
// on the right. The pick sheet sits low under the thumb during a round and, in the break, high under the countdown,
// so a waiting pick never hides the shop (VG3 note 6).

export const SHOP_CARD_H = 104;
export const SHOP_GAP = 12;
export const SHOP_BOTTOM = 28;
export const PICK_CARD_H = 112;
export const PICK_GAP = 12;
export const PICK_BOTTOM = 28;

export interface Band {
  top: number;
  bottom: number;
}

/** Slice 4: the shop is two columns of four rows (the repeatable lines on the left, the extra dart over the perks on the right). */
export const SHOP_ROWS = 4;
export const SHOP_CARD_W = 340;

/**
 * The shop's cards: cardsTop is the first perk's top, where slices 1 to 3 put it (the perks keep their cells), gridTop the
 * top row of the grid, titleY the shop title's centre, and the band the title and the cards cover.
 */
export function shopLayout(H: number): { cardsTop: number; gridTop: number; titleY: number; band: Band } {
  const cardsTop = H - 3 * (SHOP_CARD_H + SHOP_GAP) - SHOP_BOTTOM;
  const gridTop = H - SHOP_ROWS * (SHOP_CARD_H + SHOP_GAP) - SHOP_BOTTOM;
  return { cardsTop, gridTop, titleY: gridTop - 22, band: { top: gridTop - 38, bottom: cardsTop + 3 * SHOP_CARD_H + 2 * SHOP_GAP } };
}

/** The top left corner of the shop cell in column col (0 left, 1 right) and row row (0 top), on a screen W wide. */
export function shopCell(col: number, row: number, W: number, H: number): { x: number; y: number } {
  const x = col === 0 ? 12 : W - SHOP_CARD_W - 12;
  return { x, y: shopLayout(H).gridTop + row * (SHOP_CARD_H + SHOP_GAP) };
}

export type SheetPlace = 'low' | 'high';

/** In the break the sheet goes high so the shop below it stays in reach; in a round (no shop then) it sits low. */
export function pickPlace(phase: string): SheetPlace {
  return phase === 'break' ? 'high' : 'low';
}

/** The sheet's title centre, its first card top and the band it covers. High sits under the countdown and nest line. */
export function pickLayout(place: SheetPlace, H: number): { titleY: number; cardsTop: number; band: Band } {
  const height = 3 * PICK_CARD_H + 2 * PICK_GAP;
  const cardsTop = place === 'low' ? H - PICK_BOTTOM - height : Math.round(H * 0.2) + 132;
  const titleY = cardsTop - 32;
  return { titleY, cardsTop, band: { top: titleY - 18, bottom: cardsTop + height } };
}

export function overlaps(a: Band, b: Band): boolean {
  return a.top < b.bottom && b.top < a.bottom;
}

/** The nest screen between runs: six upgrade cards under the header, PLAY and Back below them, fitted to the height. */
export const NEST_CARDS_TOP = 300;
export const NEST_GAP = 10;
export const NEST_PLAY_H = 110;
export const NEST_BACK_H = 76;
export function nestLayout(H: number): { cardsTop: number; cardH: number; gap: number; playY: number; backY: number } {
  const playY = H - 210;
  const backY = H - 84;
  const room = playY - NEST_PLAY_H / 2 - 20 - NEST_CARDS_TOP;
  const cardH = Math.max(72, Math.min(124, Math.floor((room - 5 * NEST_GAP) / 6)));
  return { cardsTop: NEST_CARDS_TOP, cardH, gap: NEST_GAP, playY, backY };
}

/** The low health vignette shows in a run (the round or the break) once health is down to this share or less. */
export const LOW_HEALTH_SHARE = 0.3;
export function lowHealth(phase: string, hp: number, maxHp: number): boolean {
  return (phase === 'active' || phase === 'break') && hp > 0 && maxHp > 0 && hp / maxHp <= LOW_HEALTH_SHARE;
}

/** Lane G7, M2 and M3: the title's buttons, top to bottom. Continue shows only with a saved run. */
export type TitleRow = 'cont' | 'play' | 'daily' | 'ladder' | 'nest';
export interface TitleRowPlace {
  row: TitleRow;
  /** The button's middle, its height and the middle of the small line under it. */
  y: number;
  h: number;
  subY: number;
}

/**
 * The title: the name, a short line under it, the ant and two predators (the art), the best rounds, then the buttons
 * spread down the screen between 35 and 89 percent of the height, each with its small line under it (M3: the Daily
 * challenge under Play). The How to play button sits in the top strip beside the sound switch, and the New version
 * line stays below the last button.
 */
export function titleLayout(H: number, saved: boolean): { nameY: number; tagY: number; artY: number; bestY: number; rows: TitleRowPlace[] } {
  const nameY = Math.round(H * 0.115);
  const tagY = nameY + 74;
  const artY = Math.round(H * 0.232);
  const bestY = Math.round(H * 0.3);
  const order: TitleRow[] = saved ? ['cont', 'play', 'daily', 'ladder', 'nest'] : ['play', 'daily', 'ladder', 'nest'];
  const top = H * 0.35;
  const step = (H * 0.89 - top) / order.length;
  const tall: Record<TitleRow, number> = { cont: 110, play: 116, daily: 104, ladder: 96, nest: 88 };
  const rows = order.map((row, i) => {
    const y = Math.round(top + step * (i + 0.5));
    const h = Math.min(tall[row], Math.round(step - 48));
    return { row, y, h, subY: y + Math.round(h / 2) + 22 };
  });
  return { nameY, tagY, artY, bestY, rows };
}
