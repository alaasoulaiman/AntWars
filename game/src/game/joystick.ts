// Copyright (c) 2026 Alaa Soulaiman and KovaTech Industries Inc. MIT License, see LICENSE.
// The floating thumb stick as plain math: which finger holds it, where the knob sits and which way the ant runs.

export const STICK_RADIUS = 92;

/**
 * One press slop for the whole HUD, in screen points (CSS pixels, one physical size on every phone). A press that
 * strays less than this from where it landed never moves the ant and, lifted inside TAP_MAX_MS, is a tap on a card;
 * a press that strays this far moves the ant and is never a tap. The stick's dead zone and the tap slop are this one
 * number (VG2: a 9 point dead zone beside a 12 point tap slop let a 9 to 12 point press both nudge the ant and buy).
 */
export const PRESS_SLOP_PX = 10;

export interface StickReading {
  baseX: number;
  baseY: number;
  knobX: number;
  knobY: number;
  /** Unit direction, or 0, 0 inside the dead zone. */
  x: number;
  y: number;
  moving: boolean;
}

/**
 * The knob follows the finger; past the radius the base trails the finger so the stick never runs out of room. The
 * dead zone is a distance in the same units as the points (the HUD passes PRESS_SLOP_PX converted to HUD units).
 */
export function readStick(
  baseX: number,
  baseY: number,
  fingerX: number,
  fingerY: number,
  radius = STICK_RADIUS,
  deadzone = PRESS_SLOP_PX,
): StickReading {
  let bx = baseX;
  let by = baseY;
  let dx = fingerX - bx;
  let dy = fingerY - by;
  let d = Math.hypot(dx, dy);
  if (d > radius) {
    const k = (d - radius) / d;
    bx += dx * k;
    by += dy * k;
    dx = fingerX - bx;
    dy = fingerY - by;
    d = Math.hypot(dx, dy);
  }
  if (d === 0 || d < deadzone) {
    return { baseX: bx, baseY: by, knobX: fingerX, knobY: fingerY, x: 0, y: 0, moving: false };
  }
  return { baseX: bx, baseY: by, knobX: fingerX, knobY: fingerY, x: dx / d, y: dy / d, moving: true };
}

/** No finger holds the stick. Phaser's pointer ids start at 0 (the mouse), so -1 is never a real pointer. */
export const NO_POINTER = -1;

/**
 * Which finger drives the stick and where its base sits, in screen units. There is no zone: the first pointer
 * that goes down anywhere on the screen takes the stick with its base under the thumb, on a shop card too (a drag
 * from a card moves the ant; only a tap on a card buys, see TapTracker). Extra fingers are ignored until it lifts.
 */
export class ThumbStick {
  pointerId = NO_POINTER;
  baseX = 0;
  baseY = 0;
  /** This press's dead zone in screen units: PRESS_SLOP_PX through the canvas scale, the same slop as a tap. */
  deadzone = PRESS_SLOP_PX;

  /** A pointer went down at (x, y): true when it takes the stick. deadzone is the press slop in the units of x and y. */
  down(pointerId: number, x: number, y: number, deadzone = PRESS_SLOP_PX): boolean {
    if (this.pointerId !== NO_POINTER) return false;
    this.pointerId = pointerId;
    this.baseX = x;
    this.baseY = y;
    this.deadzone = deadzone;
    return true;
  }

  /** A pointer moved: the reading when it is the stick's finger, null for any other pointer. */
  move(pointerId: number, x: number, y: number): StickReading | null {
    if (this.pointerId === NO_POINTER || pointerId !== this.pointerId) return null;
    const r = readStick(this.baseX, this.baseY, x, y, STICK_RADIUS, this.deadzone);
    this.baseX = r.baseX;
    this.baseY = r.baseY;
    return r;
  }

  /** A pointer lifted: true when it was the stick's finger, which frees the stick. */
  up(pointerId: number): boolean {
    if (this.pointerId === NO_POINTER || pointerId !== this.pointerId) return false;
    this.pointerId = NO_POINTER;
    return true;
  }

  /** Frees the stick whoever holds it (the page lost focus, the ant fell). */
  release(): void {
    this.pointerId = NO_POINTER;
  }
}

/** A press on a card is a tap only when the finger lifts within this many milliseconds and strays under PRESS_SLOP_PX. */
export const TAP_MAX_MS = 300;

interface Press<T> {
  x: number;
  y: number;
  at: number;
  target: T;
  strayed: number;
}

/**
 * Presses on buttons (the shop and pick cards, the title), one per finger. A press acts only as a tap: it lifts within
 * TAP_MAX_MS and never moved PRESS_SLOP_PX from where it landed. A drag or a thumb resting on a card does nothing here.
 */
export class TapTracker<T> {
  private readonly presses = new Map<number, Press<T>>();

  /** A finger went down on a button at time now (ms). */
  down(pointerId: number, x: number, y: number, now: number, target: T): void {
    this.presses.set(pointerId, { x, y, at: now, target, strayed: 0 });
  }

  /** A finger moved: only the farthest it got from where it landed counts. */
  move(pointerId: number, x: number, y: number): void {
    const p = this.presses.get(pointerId);
    if (p) p.strayed = Math.max(p.strayed, Math.hypot(x - p.x, y - p.y));
  }

  /**
   * A finger lifted at (x, y): the button it pressed when the press was a tap, otherwise null. maxMove is the slop in
   * the units of x and y (the HUD converts PRESS_SLOP_PX through the canvas scale, as it does for the stick).
   */
  up(pointerId: number, x: number, y: number, now: number, maxMove: number): T | null {
    const p = this.presses.get(pointerId);
    if (!p) return null;
    this.presses.delete(pointerId);
    const strayed = Math.max(p.strayed, Math.hypot(x - p.x, y - p.y));
    return now - p.at <= TAP_MAX_MS && strayed < maxMove ? p.target : null;
  }

  /** Forgets every press (the page lost focus, the ant fell). */
  clear(): void {
    this.presses.clear();
  }
}
