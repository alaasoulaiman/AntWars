// Copyright (c) 2026 Alaa Soulaiman and KovaTech Industries Inc. MIT License, see LICENSE.
// Table tests for the HUD's card stacks: a waiting pick never hides the shop in the break (VG3 note 6).
import { describe, expect, it } from 'vitest';
import { NEST_BACK_H, NEST_PLAY_H, SHOP_CARD_W, lowHealth, nestLayout, overlaps, pickLayout, pickPlace, shopCell, shopLayout, titleLayout } from './layout';

// Every phone sees 720 units across; the height runs from 1280 (a 16:9 screen) to 1800 (the tallest shape allowed).
const HEIGHTS = [1280, 1558, 1800];

describe('the pick sheet and the shop', () => {
  it.each([['break', 'high'], ['active', 'low'], ['intro', 'low'], ['title', 'low'], ['dead', 'low']])('in the %s phase the sheet sits %s', (phase, place) => {
    expect(pickPlace(phase)).toBe(place);
  });

  it.each(HEIGHTS)('at height %i the sheet in the break and the shop never overlap, both on screen', (H) => {
    const sheet = pickLayout('high', H).band;
    const shop = shopLayout(H).band;
    expect(overlaps(sheet, shop)).toBe(false);
    expect(sheet.bottom).toBeLessThan(shop.top);
    // Under the countdown (H x 0.2) and the nest line 50 below it, and inside the screen.
    expect(sheet.top).toBeGreaterThan(H * 0.2 + 64);
    expect(shop.bottom).toBeLessThanOrEqual(H);
  });

  it.each(HEIGHTS)('at height %i the sheet in a round sits low under the thumb, as slice 2 shipped', (H) => {
    expect(pickLayout('low', H).cardsTop).toBe(H - 388);
    expect(shopLayout(H).cardsTop).toBe(H - 376);
  });

  it.each(HEIGHTS)('at height %i the slice 4 grid keeps the perks in their cells and adds one row above them', (H) => {
    const L = shopLayout(H);
    expect(L.gridTop).toBe(H - 492);
    // The right column's rows 1 to 3 are the three perk cells of slices 1 to 3.
    for (let row = 1; row <= 3; row++) expect(shopCell(1, row, 720, H)).toEqual({ x: 368, y: L.cardsTop + (row - 1) * 116 });
    expect(shopCell(0, 0, 720, H)).toEqual({ x: 12, y: H - 492 });
    // The two columns never touch: 12 to 352 and 368 to 708.
    expect(shopCell(0, 0, 720, H).x + SHOP_CARD_W).toBeLessThan(shopCell(1, 0, 720, H).x);
    expect(L.band.top).toBeLessThan(L.titleY);
  });
});

describe('the nest screen between runs', () => {
  it.each(HEIGHTS)('at height %i the six cards end above PLAY, and Back sits under PLAY inside the screen', (H) => {
    const L = nestLayout(H);
    const cardsBottom = L.cardsTop + 6 * L.cardH + 5 * L.gap;
    expect(cardsBottom).toBeLessThanOrEqual(L.playY - NEST_PLAY_H / 2 - 20);
    expect(L.playY + NEST_PLAY_H / 2).toBeLessThan(L.backY - NEST_BACK_H / 2);
    expect(L.backY + NEST_BACK_H / 2).toBeLessThanOrEqual(H);
    expect(L.cardH).toBeGreaterThanOrEqual(100);
  });
});

describe('the low health vignette', () => {
  it.each([
    ['active', 180, 600, true], ['active', 181, 600, false], ['break', 90, 600, true], ['active', 600, 600, false],
    ['dead', 0, 600, false], ['active', 0, 600, false], ['title', 100, 600, false], ['intro', 100, 600, false],
  ])('in the %s phase at %i of %i health it shows: %s', (phase, hp, max, shows) => {
    expect(lowHealth(phase as string, hp as number, max as number)).toBe(shows);
  });
});

describe('the title (lane G7, M2)', () => {
  it.each(HEIGHTS.flatMap((H) => [[H, false], [H, true]] as Array<[number, boolean]>))(
    'at height %i (saved run: %s) the buttons stack under the best rounds, never touch, and stay above the New version line',
    (H, saved) => {
      const L = titleLayout(H, saved);
      expect(L.rows.map((r) => r.row)).toEqual(saved ? ['cont', 'play', 'daily', 'ladder', 'nest'] : ['play', 'daily', 'ladder', 'nest']);
      expect(L.nameY).toBeLessThan(L.tagY);
      expect(L.tagY).toBeLessThan(L.artY);
      expect(L.artY).toBeLessThan(L.bestY);
      expect(L.rows[0].y - L.rows[0].h / 2).toBeGreaterThan(L.bestY + 40);
      for (let i = 0; i + 1 < L.rows.length; i++) {
        const a = L.rows[i];
        const b = L.rows[i + 1];
        // The small line under a button (about 22 tall) ends before the next button starts.
        expect(a.subY + 14).toBeLessThan(b.y - b.h / 2);
      }
      const last = L.rows[L.rows.length - 1];
      // The New version line sits 52 above the bottom, 64 tall.
      expect(last.subY + 14).toBeLessThan(H - 52 - 32);
      // Every button stays a thumb sized target: 80 units is 43 points across a 390 point phone.
      for (const r of L.rows) expect(r.h).toBeGreaterThanOrEqual(80);
    },
  );

  it('pins the 390 by 844 phone (1558 tall): Play, the Daily challenge, the ladder and the nest without a save', () => {
    const L = titleLayout(1558, false);
    expect(L.rows.map((r) => [r.row, r.y, r.h])).toEqual([
      ['play', 650, 116],
      ['daily', 861, 104],
      ['ladder', 1071, 96],
      ['nest', 1281, 88],
    ]);
  });
});
