export interface Body {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  tier: number;
  mass: number;
  age: number;
  mergeLock: number;
  wobble: number;
  angle: number;
  av: number;
  /** 1 = round. Springs back after landings/merges for squash & stretch. */
  squash: number;
  squashV: number;
  /** Countdown to the next eye blink. */
  blink: number;
  remove: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  age: number;
  life: number;
  gravity: number;
}

export interface Floater {
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  vy: number;
  age: number;
  life: number;
}

export interface Shockwave {
  x: number;
  y: number;
  r: number;
  life: number;
  age: number;
  color: string;
}

export interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  rot: number;
  vr: number;
  age: number;
  life: number;
}

export interface Bubble {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
  alpha: number;
}

export interface DropimalDef {
  name: string;
  r: number;
  c1: string;
  c2: string;
  skin: string;
  points: number;
  /** Eye placement, as fractions of the radius. */
  ex: number;
  ey: number;
  er: number;
}

export type MissionType = 'tier' | 'merges' | 'score' | 'combo';

export interface Mission {
  type: MissionType;
  text: string;
  targetTier?: number;
  goal: number;
  progress: number;
  reward: number;
}

export interface ButtonRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Screen = 'menu' | 'play' | 'paused' | 'over' | 'dex';

/** Persistent player profile (localStorage). */
export interface Profile {
  highScore: number;
  discovered: boolean[];
  streak: number;
  lastDay: string;
  games: number;
  totalMerges: number;
  biggestTier: number;
  muted: boolean;
  musicMuted: boolean;
}

/** A big announcement banner (discovery, new best, fever...). */
export interface Banner {
  title: string;
  subtitle: string;
  color: string;
  age: number;
  life: number;
  tier?: number;
}
