import type { ButtonRect } from './types';

// Logical game space (portrait). Letterboxed into the real viewport.
export const GW = 420;
export const GH = 720;

// Playfield box
export const LEFT = 24;
export const RIGHT = 396;
export const FLOOR = 650;
export const DANGER_Y = 152;
export const DROP_Y = 118;

// Physics
export const GRAVITY = 1450;
export const AIR_DRAG = 0.999;
export const FLOOR_FRICTION = 0.90;
export const WALL_BOUNCE = 0.18;
export const COLLISION_BOUNCE = 0.04;
export const PHYSICS_STEPS = 5;

// Tuning
export const DROP_COOLDOWN = 0.45;
export const COMBO_WINDOW = 2.0;
export const FEVER_COMBO = 5;
export const FEVER_TIME = 8;
export const OVERFLOW_GRACE = 1.8;
export const NUDGE_PER_MERGE = 0.09;
// Seconds the one-time "second chance" rewarded-ad offer stays up before it
// auto-declines and the run ends.
export const CONTINUE_OFFER = 6;

// Buttons, grouped by the screen that owns them.
export const BTN: Record<string, ButtonRect> = {
  // play
  pause:     { x: 14,  y: 14,  w: 44,  h: 44 },
  nudge:     { x: 312, y: 666, w: 84,  h: 46 },
  nextPanel: { x: 314, y: 12,  w: 92,  h: 92 },

  // menu
  play:      { x: 110, y: 392, w: 200, h: 66 },
  dex:       { x: 110, y: 478, w: 200, h: 52 },
  soundMenu:      { x: 84,  y: 566, w: 48,  h: 48 },
  sfxSliderMenu:  { x: 146, y: 579, w: 170, h: 22 },
  musicMenu:      { x: 84,  y: 624, w: 48,  h: 48 },
  musicSliderMenu:{ x: 146, y: 637, w: 170, h: 22 },

  // pause overlay
  resume:    { x: 110, y: 268, w: 200, h: 60 },
  restart:   { x: 110, y: 348, w: 200, h: 52 },
  toMenu:    { x: 110, y: 420, w: 200, h: 52 },
  soundPause:      { x: 84,  y: 496, w: 48,  h: 48 },
  sfxSliderPause:  { x: 146, y: 509, w: 170, h: 22 },
  musicPause:      { x: 84,  y: 554, w: 48,  h: 48 },
  musicSliderPause:{ x: 146, y: 567, w: 170, h: 22 },

  // game over
  again:     { x: 90,  y: 482, w: 240, h: 62 },
  overMenu:  { x: 90,  y: 558, w: 240, h: 46 },

  // continue (second chance) overlay
  continueWatch:   { x: 60,  y: 424, w: 300, h: 64 },
  continueDecline: { x: 110, y: 502, w: 200, h: 44 },

  // dex
  dexBack:   { x: 140, y: 642, w: 140, h: 50 },
};
