// Copyright (c) 2026 Alaa Soulaiman and KovaTech Industries Inc. MIT License, see LICENSE.
// Table tests for the boss escort: the termites that follow a boss keep coming through the fight (curve.ts bossEscort).
import { describe, expect, it } from 'vitest';
import {
  BOSS_ESCORT,
  BOSS_ESCORT_SECONDS,
  BOSS_ESCORT_SECONDS_STEP,
  BOSS_SPAWN_GAP,
  HEALTH_CAP_ROUND,
  MAX_ALIVE,
  SPAWN_GAP_FLOOR,
  bossEscort,
  bossEscortSeconds,
  isBossRound,
  roundPlan,
} from './curve';

// Design note, 2026-10-31: the escort was 30 termites in every boss round; at the horde gap of the pace rule they were
// all out about 10 s into the round 10 fight (30 x 0.3151 s) and the boss fought alone after it. Now the escort is sized
// by time: enough termites at the round's escort gap to keep coming for 45 s at round 10 (the old 30 x 1.5 s trickle),
// half a second more a round, frozen from round 40 with the health; never fewer than the 30 of before.
describe('the boss escort grows with the round, so termites keep coming through the boss fight', () => {
  // [round, boss, the escort's gap in s (unchanged), termites in the escort, seconds of termites at that gap]
  it.each([
    [10, 'mantis', 0.315124704862, 143, 45],
    [20, 'hornet', 0.188676801268, 266, 50],
    [25, 'anteater', 0.145994512169, 360, 52.5],
    [30, 'mantis', 0.112967770496, 487, 55],
    [40, 'hornet', 0.1, 600, 60],
    [50, 'anteater', 0.1, 600, 60],
    [60, 'hornet', 0.1, 600, 60],
    [100, 'anteater', 0.1, 600, 60],
  ] as const)('round %i (%s): one termite every %f s, %i of them, %f s of termites', (round, boss, gap, count, seconds) => {
    const p = roundPlan(round);
    expect(p.kind).toBe('boss');
    expect(p.boss).toBe(boss);
    // The plan is the source of truth: the boss, then its escort (it was 31 in every boss round).
    expect(p.total).toBe(count + 1);
    expect(bossEscort(round)).toBe(count);
    expect(bossEscortSeconds(round)).toBe(seconds);
    // The gap and the alive cap do not move.
    expect(p.spawnGap).toBeCloseTo(gap, 11);
    expect(p.aliveCap).toBe(MAX_ALIVE);
    // The escort covers its seconds at its gap, and one termite fewer would not.
    expect(count * p.spawnGap).toBeGreaterThanOrEqual(seconds - 1e-9);
    expect((count - 1) * p.spawnGap).toBeLessThan(seconds);
  });

  // [round, kind, the total of 0842809]
  it.each([
    [1, 'horde', 6],
    [5, 'breather', 40],
    [9, 'horde', 29],
    [11, 'horde', 34],
    [15, 'breather', 48],
    [26, 'horde', 84],
    [35, 'breather', 56],
  ] as const)('round %i (%s, no boss) has no escort and keeps its %i', (round, kind, total) => {
    expect(isBossRound(round)).toBe(false);
    expect(bossEscort(round)).toBe(0);
    expect(roundPlan(round).kind).toBe(kind);
    expect(roundPlan(round).total).toBe(total);
  });

  it('the numbers behind it: 45 s is the old trickle (30 x 1.5 s), half a second a round, frozen at the health cap', () => {
    expect(BOSS_ESCORT).toBe(30);
    expect(BOSS_SPAWN_GAP).toBe(1.5);
    expect(BOSS_ESCORT_SECONDS).toBe(45);
    expect(BOSS_ESCORT * BOSS_SPAWN_GAP).toBe(BOSS_ESCORT_SECONDS);
    expect(BOSS_ESCORT_SECONDS_STEP).toBe(0.5);
    expect(HEALTH_CAP_ROUND).toBe(40);
    expect(bossEscortSeconds(39)).toBe(59.5);
    expect(bossEscortSeconds(40)).toBe(60);
    expect(bossEscortSeconds(41)).toBe(60);
    expect(bossEscortSeconds(500)).toBe(60);
  });

  it('every boss round from 10 to 300: at least 30, covers its seconds, one fewer would not, never shrinks, at most 600', () => {
    let lastCount = 0;
    let lastSeconds = 0;
    let bossRounds = 0;
    for (let r = 1; r <= 300; r++) {
      if (!isBossRound(r)) continue;
      bossRounds += 1;
      const p = roundPlan(r);
      const n = bossEscort(r);
      const s = bossEscortSeconds(r);
      expect(p.total).toBe(n + 1);
      expect(n).toBeGreaterThanOrEqual(BOSS_ESCORT);
      expect(Number.isInteger(n)).toBe(true);
      expect(n * p.spawnGap).toBeGreaterThanOrEqual(s - 1e-9);
      if (n > BOSS_ESCORT) expect((n - 1) * p.spawnGap).toBeLessThan(s);
      expect(n).toBeGreaterThanOrEqual(lastCount);
      expect(s).toBeGreaterThanOrEqual(lastSeconds);
      // The gap floor and the frozen seconds bound it: 60 s at 0.1 s.
      expect(n).toBeLessThanOrEqual(Math.round(bossEscortSeconds(HEALTH_CAP_ROUND) / SPAWN_GAP_FLOOR));
      lastCount = n;
      lastSeconds = s;
    }
    expect(bossRounds).toBe(36);
    expect(lastCount).toBe(600);
  });

  it.each([0, -1, 1.5, Number.NaN])('round %s is refused', (bad) => {
    expect(() => bossEscort(bad)).toThrow(RangeError);
    expect(() => bossEscortSeconds(bad)).toThrow(RangeError);
  });
});

/**
 * The plan of every round that has no boss is the plan from before the change, field by field (printed from curve.ts at
 * commit 0842809): [round, kind, total, aliveCap, spawnGap, health, termiteBite, termiteHits, breakSeconds, boss].
 * Rounds 1 to 49 and every termite rush to round 115.
 */
const PLAN_BEFORE = [
  [1, 'horde', 6, 6, 1, 150, 1, 1, 15, null],
  [2, 'horde', 8, 8, 0.95, 250, 1, 1, 15, null],
  [3, 'horde', 13, 13, 0.9025, 350, 1, 1, 15, null],
  [4, 'horde', 18, 18, 0.857375, 450, 1, 1, 15, null],
  [5, 'breather', 40, 20, 0.3, 550, 1, 1, 15, null],
  [6, 'horde', 27, 20, 0.38689046875, 650, 1, 1, 15, null],
  [7, 'horde', 28, 20, 0.367545945312, 750, 1, 1, 15, null],
  [8, 'horde', 28, 20, 0.349168648047, 850, 1, 1, 15, null],
  [9, 'horde', 29, 20, 0.331710215645, 950, 1, 1, 15, null],
  [11, 'horde', 34, 20, 0.299368469619, 1150, 1, 1, 15, null],
  [12, 'horde', 36, 20, 0.284400046138, 1264, 1, 1, 15, null],
  [13, 'horde', 39, 20, 0.270180043831, 1391, 1, 1, 15, null],
  [14, 'horde', 41, 20, 0.25667104164, 1530, 1, 1, 15, null],
  [15, 'breather', 48, 20, 0.243837489558, 1683, 1.15, 1, 15, null],
  [16, 'horde', 47, 20, 0.23164561508, 1851, 1, 1, 15, null],
  [17, 'horde', 50, 20, 0.220063334326, 2036, 1, 1, 15, null],
  [18, 'horde', 53, 20, 0.20906016761, 2240, 1, 1, 15, null],
  [19, 'horde', 56, 20, 0.198607159229, 2464, 1, 1, 15, null],
  [21, 'horde', 63, 20, 0.179242961204, 2982, 1, 1, 15, null],
  [22, 'horde', 67, 20, 0.170280813144, 3280, 1, 1, 15, null],
  [23, 'horde', 71, 20, 0.161766772487, 3608, 1, 1, 15, null],
  [24, 'horde', 75, 20, 0.153678433863, 3968, 1, 1, 15, null],
  [26, 'horde', 84, 20, 0.138694786561, 4802, 1, 1, 15, null],
  [27, 'horde', 89, 20, 0.131760047233, 5282, 1, 1, 15, null],
  [28, 'horde', 94, 20, 0.125172044871, 5810, 1, 1, 15, null],
  [29, 'horde', 99, 20, 0.118913442628, 6391, 1, 1, 15, null],
  [31, 'horde', 110, 20, 0.107319381971, 7733, 1, 1, 15, null],
  [32, 'horde', 116, 20, 0.101953412873, 8507, 1, 1, 15, null],
  [33, 'horde', 122, 20, 0.1, 9357, 1, 1, 15, null],
  [34, 'horde', 128, 20, 0.1, 10293, 1, 1, 15, null],
  [35, 'breather', 56, 20, 0.1, 11322, 1.3, 2, 15, null],
  [36, 'horde', 140, 20, 0.1, 12454, 1, 1, 15, null],
  [37, 'horde', 147, 20, 0.1, 13700, 1, 1, 15, null],
  [38, 'horde', 153, 20, 0.1, 15070, 1, 1, 15, null],
  [39, 'horde', 160, 20, 0.1, 16577, 1, 1, 15, null],
  [41, 'horde', 175, 20, 0.1, 18235, 1, 1, 15, null],
  [42, 'horde', 182, 20, 0.1, 18235, 1, 1, 15, null],
  [43, 'horde', 190, 20, 0.1, 18235, 1, 1, 15, null],
  [44, 'horde', 198, 20, 0.1, 18235, 1, 1, 15, null],
  [45, 'breather', 64, 20, 0.1, 18235, 1.45, 2, 15, null],
  [46, 'horde', 214, 20, 0.1, 18235, 1, 1, 15, null],
  [47, 'horde', 222, 20, 0.1, 18235, 1, 1, 15, null],
  [48, 'horde', 231, 20, 0.1, 18235, 1, 1, 15, null],
  [49, 'horde', 240, 20, 0.1, 18235, 1, 1, 15, null],
  [55, 'breather', 72, 20, 0.1, 18235, 1.6, 2, 15, null],
  [65, 'breather', 80, 20, 0.1, 18235, 1.75, 3, 15, null],
  [85, 'breather', 88, 20, 0.1, 18235, 1.9, 3, 15, null],
  [95, 'breather', 96, 20, 0.1, 18235, 2, 3, 15, null],
  [105, 'breather', 100, 20, 0.1, 18235, 2, 3, 15, null],
  [115, 'breather', 100, 20, 0.1, 18235, 2, 3, 15, null],
] as const;

/** The boss rounds from before the change in the same shape; only the total (31 there) moves. */
const BOSS_PLAN_BEFORE = [
  [10, 'boss', 31, 20, 0.315124704862, 1045, 1, 1, 15, 'mantis'],
  [20, 'boss', 31, 20, 0.188676801268, 2710, 1, 1, 15, 'hornet'],
  [25, 'boss', 31, 20, 0.145994512169, 4365, 1, 1, 15, 'anteater'],
  [30, 'boss', 31, 20, 0.112967770496, 7030, 1, 1, 15, 'mantis'],
  [40, 'boss', 31, 20, 0.1, 18235, 1, 1, 15, 'hornet'],
  [50, 'boss', 31, 20, 0.1, 18235, 1, 1, 15, 'anteater'],
  [60, 'boss', 31, 20, 0.1, 18235, 1, 1, 15, 'hornet'],
  [70, 'boss', 31, 20, 0.1, 18235, 1, 1, 15, 'mantis'],
  [75, 'boss', 31, 20, 0.1, 18235, 1, 1, 15, 'anteater'],
  [80, 'boss', 31, 20, 0.1, 18235, 1, 1, 15, 'hornet'],
  [90, 'boss', 31, 20, 0.1, 18235, 1, 1, 15, 'mantis'],
  [100, 'boss', 31, 20, 0.1, 18235, 1, 1, 15, 'anteater'],
  [110, 'boss', 31, 20, 0.1, 18235, 1, 1, 15, 'mantis'],
  [120, 'boss', 31, 20, 0.1, 18235, 1, 1, 15, 'hornet'],
] as const;

describe('no other round moves: the plans from before the change, field by field', () => {
  it.each(PLAN_BEFORE)('round %i (%s) is as it was: %i predators', (round, kind, total, cap, gap, health, bite, hits, rest, boss) => {
    const p = roundPlan(round);
    expect({ kind: p.kind, total: p.total, aliveCap: p.aliveCap, health: p.health, termiteBite: p.termiteBite, termiteHits: p.termiteHits, breakSeconds: p.breakSeconds, boss: p.boss }).toEqual({
      kind, total, aliveCap: cap, health, termiteBite: bite, termiteHits: hits, breakSeconds: rest, boss,
    });
    expect(p.spawnGap).toBeCloseTo(gap, 11);
  });

  it('the table holds every round from 1 to 49 that has no boss, and every rush to round 115', () => {
    const want: number[] = [];
    for (let r = 1; r <= 115; r++) if (!isBossRound(r) && (r <= 49 || roundPlan(r).kind === 'breather')) want.push(r);
    expect(PLAN_BEFORE.map((x) => x[0])).toEqual(want);
  });

  it.each(BOSS_PLAN_BEFORE)('boss round %i keeps all but its total: the gap, the cap, the health, the boss', (round, kind, total, cap, gap, health, bite, hits, rest, boss) => {
    const p = roundPlan(round);
    expect({ kind: p.kind, aliveCap: p.aliveCap, health: p.health, termiteBite: p.termiteBite, termiteHits: p.termiteHits, breakSeconds: p.breakSeconds, boss: p.boss }).toEqual({
      kind, aliveCap: cap, health, termiteBite: bite, termiteHits: hits, breakSeconds: rest, boss,
    });
    expect(p.spawnGap).toBeCloseTo(gap, 11);
    // The total is the only field that moves, and only up.
    expect(p.total).toBeGreaterThan(total);
  });
});
