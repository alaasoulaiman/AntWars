// Copyright (c) 2026 Alaa Soulaiman and KovaTech Industries Inc. MIT License, see LICENSE.
// Table tests for the HUD's card stacks: a waiting pick never hides the shop in the break (VG3 note 6).
import { describe, expect, it } from 'vitest';
import {
  HP_BAR,
  NEST_BACK_H,
  NEST_PLAY_H,
  SHOP_CARD_W,
  STATS_PANEL_W,
  TOP_STRIP_H,
  bossBar,
  boxesOverlap,
  levelBar,
  lowHealth,
  muteButton,
  nectarReadout,
  nestLayout,
  overlaps,
  pickLayout,
  pickPlace,
  shopCell,
  shopLayout,
  statsHit,
  statsLayout,
  statsShown,
  titleLayout,
  type Band,
  type Box,
} from './layout';

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

// Lane N1, M2 (design note, 2026-10-29): the stats tab at the top left. 44 points on a 390 point phone are
// 44 x 720 / 390 = 81.2 units, the least a tap target may be.
const W = 720;
const TAP_UNITS = (44 * W) / 390;
const across = (b: Band): Box => ({ x: 0, y: b.top, w: W, h: b.bottom - b.top });

describe('the stats tab (lane N1, M2)', () => {
  it.each(HEIGHTS)('at height %i the button and the open panel stay clear of the health bar, the level bar, the sound switch, the nectar and the boss bar', (H) => {
    const L = statsLayout(H);
    for (const b of [HP_BAR, levelBar(W), muteButton(W), nectarReadout(W), bossBar(W)]) {
      expect(boxesOverlap(L.button, b)).toBe(false);
      expect(boxesOverlap(L.panel, b)).toBe(false);
    }
    // Under the top strip, on the left, the panel no wider than 70 percent of the screen, all inside the screen.
    expect(L.button.y).toBeGreaterThanOrEqual(TOP_STRIP_H);
    expect(L.panel.y).toBeGreaterThan(L.button.y + L.button.h);
    expect(L.button.x).toBeLessThan(W / 4);
    expect(L.panel.x).toBeGreaterThanOrEqual(0);
    expect(L.panel.x + L.panel.w).toBeLessThanOrEqual(0.7 * W);
    expect(L.panel.y + L.panel.h).toBeLessThanOrEqual(H);
  });

  it.each(HEIGHTS)('at height %i the panel never covers a round\'s pick cards or the shop\'s, and the button no cards at all', (H) => {
    const L = statsLayout(H);
    const low = across(pickLayout('low', H).band);
    const high = across(pickLayout('high', H).band);
    const shop = across(shopLayout(H).band);
    expect(boxesOverlap(L.panel, low)).toBe(false);
    expect(boxesOverlap(L.panel, shop)).toBe(false);
    for (const b of [low, high, shop]) expect(boxesOverlap(L.button, b)).toBe(false);
    // In the break a pick's cards sit high, where the panel would lie over them, so the panel steps aside while they are up.
    expect(boxesOverlap(L.panel, high)).toBe(true);
    expect(statsShown(true, 'break', true).panel).toBe(false);
  });

  it.each(HEIGHTS)('at height %i the button and the close x are thumb sized, and the panel starts under the countdown and the nest line', (H) => {
    const L = statsLayout(H);
    for (const b of [L.button, L.close]) {
      expect(b.w).toBeGreaterThanOrEqual(TAP_UNITS);
      expect(b.h).toBeGreaterThanOrEqual(TAP_UNITS);
    }
    // The close x sits inside the panel, in its top right corner.
    expect(L.close.x + L.close.w).toBe(L.panel.x + L.panel.w);
    expect(L.close.y).toBe(L.panel.y);
    // NEXT ROUND IN sits at H x 0.2 (42 tall type), "Walk to the nest to shop" 50 under it (28 tall type).
    expect(L.panel.y).toBeGreaterThan(H * 0.2 + 50 + 17);
    // Room for the six stat rows and a few upgrade lines at full size on the smallest screen.
    expect(L.panel.h).toBeGreaterThanOrEqual(400);
  });

  it('pins the 390 by 844 phone (1558 tall): the button at 12, 294 (88 square), the panel 480 by 626 from 12, 390', () => {
    const L = statsLayout(1558);
    expect(L.button).toEqual({ x: 12, y: 294, w: 88, h: 88 });
    expect(L.panel).toEqual({ x: 12, y: 390, w: STATS_PANEL_W, h: 626 });
    expect(L.close).toEqual({ x: 404, y: 390, w: 88, h: 88 });
  });

  // [phase, open, a pick's cards up, the button shows, the panel shows]
  it.each([
    ['title', true, false, false, false],
    ['dead', true, false, false, false],
    ['intro', true, false, true, true],
    ['active', false, false, true, false],
    ['active', true, false, true, true],
    ['active', true, true, true, true],
    ['break', true, false, true, true],
    ['break', true, true, true, false],
    ['break', false, true, true, false],
  ] as const)('in the %s phase, open %s, cards up %s: the button %s, the panel %s', (phase, open, cards, button, panel) => {
    expect(statsShown(open, phase, cards)).toEqual({ button, panel });
    // A round's cards sit low and a break's sit high (layout.ts pickPlace), which is why the two differ.
    if (cards && open && (phase === 'active' || phase === 'break')) expect(pickPlace(phase)).toBe(phase === 'break' ? 'high' : 'low');
  });

  it('a press on the button or the open panel belongs to the tab; anywhere else it is the stick\'s', () => {
    const L = statsLayout(1558);
    const open = { button: true, panel: true };
    const shut = { button: true, panel: false };
    const drawn = 500;
    const mid = (b: Box) => [b.x + b.w / 2, b.y + b.h / 2] as const;
    expect(statsHit(...mid(L.button), L, drawn, open)).toBe('button');
    expect(statsHit(...mid(L.button), L, drawn, shut)).toBe('button');
    expect(statsHit(...mid(L.close), L, drawn, open)).toBe('close');
    expect(statsHit(L.panel.x + 100, L.panel.y + 300, L, drawn, open)).toBe('panel');
    // Below the drawn panel, inside its largest box: the stick's.
    expect(statsHit(L.panel.x + 100, L.panel.y + drawn + 10, L, drawn, open)).toBeNull();
    // The panel shut: the same point is the stick's, and so is the close x's.
    expect(statsHit(L.panel.x + 100, L.panel.y + 300, L, drawn, shut)).toBeNull();
    expect(statsHit(...mid(L.close), L, drawn, shut)).toBeNull();
    // On the title or the death screen nothing of the tab answers.
    expect(statsHit(...mid(L.button), L, drawn, { button: false, panel: false })).toBeNull();
    // The thumb's usual place, low on the left, and the screen's middle are always the stick's.
    expect(statsHit(180, 1215, L, drawn, open)).toBeNull();
    expect(statsHit(W / 2 + 200, 700, L, drawn, open)).toBeNull();
  });
});
