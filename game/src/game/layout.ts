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

/** Lane N1: a box in HUD units, its top left corner and its size. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function boxesOverlap(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

export function inBox(x: number, y: number, b: Box): boolean {
  return x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;
}

/** The top strip and its readouts, and the boss bar under it, where HudScene draws them (lane N1: the stats tab keeps clear). */
export const TOP_STRIP_H = 152;
export const HP_BAR: Box = { x: 22, y: 112, w: 324, h: 28 };
export function levelBar(W: number): Box {
  return { x: W - 346, y: 112, w: 324, h: 28 };
}
/** The sound switch: a 64 unit square icon, its middle 20 right of the screen's middle and 44 down. */
export function muteButton(W: number): Box {
  return { x: W / 2 + 20 - 32, y: 12, w: 64, h: 64 };
}
/** The nectar count (right aligned 58 in from the edge, 44 tall type) and its bead, with room for 9,999,999 drops. */
export function nectarReadout(W: number): Box {
  return { x: W - 330, y: 14, w: 318, h: 60 };
}
export const BOSS_BAR_Y = 202;
export const BOSS_BAR_H = 30;
export function bossBar(W: number): Box {
  return { x: 24, y: BOSS_BAR_Y, w: W - 48, h: BOSS_BAR_H };
}

/**
 * Lane N1, M2: the stats tab. The button sits on the left under the top strip and the boss bar, 88
 * units square (48 points on a 390 point phone, over a 44 point tap target). The panel opens under it, two thirds of the
 * screen wide, from under the break's countdown and nest line (H x 0.2, the line 50 below it) down to above the shop's
 * grid and the pick sheet's low place, so it never covers the shop's cards or a round's level up cards. The close x is a
 * tap target as big as the button, in the panel's top right corner.
 */
export const STATS_BTN = 88;
export const STATS_PANEL_W = 480;
const STATS_X = 12;
const STATS_GAP = 8;
export interface StatsPlace {
  button: Box;
  /** The panel's largest box; the HUD draws it as tall as its rows need, never taller. */
  panel: Box;
  close: Box;
}

export function statsLayout(H: number): StatsPlace {
  const panelTop = Math.max(BOSS_BAR_Y + BOSS_BAR_H + STATS_GAP + STATS_BTN + STATS_GAP, Math.round(H * 0.2) + 78);
  const bottom = Math.min(shopLayout(H).band.top, pickLayout('low', H).band.top) - 12;
  const panel: Box = { x: STATS_X, y: panelTop, w: STATS_PANEL_W, h: bottom - panelTop };
  return {
    button: { x: STATS_X, y: panelTop - STATS_GAP - STATS_BTN, w: STATS_BTN, h: STATS_BTN },
    panel,
    close: { x: panel.x + panel.w - STATS_BTN, y: panel.y, w: STATS_BTN, h: STATS_BTN },
  };
}

/**
 * Lane N1: the tab shows only in a run (never on the title or the death screen); the panel when it is open, except
 * while the cards of a pick sit high in the break, where it would cover them (it comes back after the tap).
 */
export function statsShown(open: boolean, phase: string, sheetUp: boolean): { button: boolean; panel: boolean } {
  const run = phase === 'intro' || phase === 'active' || phase === 'break';
  return { button: run, panel: run && open && !(sheetUp && pickPlace(phase) === 'high') };
}

export type StatsHit = 'button' | 'close' | 'panel' | null;

/**
 * Lane N1: what a press at (x, y) lands on: the button, the close x, the rest of the open panel, or nothing of the tab.
 * panelH is the panel's drawn height. The HUD gives any of the three to the tab alone: the stick never takes it.
 */
export function statsHit(x: number, y: number, place: StatsPlace, panelH: number, shown: { button: boolean; panel: boolean }): StatsHit {
  if (shown.button && inBox(x, y, place.button)) return 'button';
  if (!shown.panel || !inBox(x, y, { ...place.panel, h: Math.min(place.panel.h, panelH) })) return null;
  return inBox(x, y, place.close) ? 'close' : 'panel';
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
