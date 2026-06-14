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

export type Screen =
  | 'menu' | 'play' | 'paused' | 'over' | 'dex' | 'continue' | 'rewards';

/** Computed at run end, drives the result screen's progress stack. */
export interface RunReward {
  xp: number;
  coins: number;
  seasonXp: number;
  baseXp: number;
  chargeBonus: number;
  firstWinBonus: number;
  eventBonus: number;
  levelsGained: number;
  newLevel: number;
  medals: MedalDef[];
  ordersCompleted: number;
  /** Human "do this next" line for the result screen. */
  nextAction: string;
}

/** A blocking celebration overlay (level-up, chest reveal), shown one at a time. */
export interface Overlay {
  kind: 'levelup' | 'chest';
  // level-up
  level?: number;
  title?: string;
  newTitle?: boolean;
  // chest
  chestKind?: ChestKind;
  reward?: ChestReward;
  /** Reveal animation clock. */
  age: number;
}

// ── Retention / meta-progression ─────────────────────────────────────────────

export type OrderKind =
  | 'merges' | 'score' | 'combo' | 'tier' | 'discover' | 'games' | 'fever' | 'nudge';

/** A live daily/weekly objective with its own progress. */
export interface OrderState {
  id: string;
  kind: OrderKind;
  text: string;
  goal: number;
  progress: number;
  /** Target tier for 'tier' orders. */
  arg?: number;
  coins: number;
  xp: number;
  done: boolean;
  claimed: boolean;
}

export type CosmeticType = 'bg' | 'trail' | 'palette' | 'victory' | 'frame' | 'title';
export type Rarity = 'common' | 'rare' | 'epic' | 'mythic';

export interface CosmeticDef {
  id: string;
  type: CosmeticType;
  name: string;
  rarity: Rarity;
  /** How it's obtained, shown in the album. */
  source: string;
  /** Shards required to unlock (0 = unlocked by owning directly). */
  shardCost: number;
  /** Primary tint, used for previews and for palette/trail/victory effects. */
  color?: string;
  /** Secondary tint for gradients (backgrounds, frames). */
  color2?: string;
}

export type ChestKind = 'daily' | 'weekly' | 'level' | 'season' | 'event' | 'challenge';

export interface ChestReward {
  coins: number;
  shards: number;
  /** Cosmetic id granted, if any. */
  cosmetic?: string;
  rarity: Rarity;
}

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  goal: number;
  /** Which lifetime stat drives progress. */
  stat: string;
  coins: number;
  shards: number;
  /** Title id awarded on completion, if any. */
  title?: string;
}

/** Earned during a single run; surfaced on the result screen. */
export interface MedalDef {
  id: string;
  name: string;
  desc: string;
  coins: number;
  xp: number;
}

/** A non-blocking notification shown briefly at the top of the screen. */
export interface Toast {
  text: string;
  sub?: string;
  color: string;
  icon?: 'coin' | 'shard' | 'chest' | 'star' | 'check';
  age: number;
  life: number;
}

export interface SeasonTier {
  free: ChestReward | { coins?: number; shards?: number; cosmetic?: string };
  elite?: { coins?: number; shards?: number; cosmetic?: string };
}

/** Persistent player profile (localStorage / CrazyGames cloud). */
export interface Profile {
  // ── identity / legacy ──
  highScore: number;
  discovered: boolean[];
  streak: number;
  lastDay: string;
  games: number;
  totalMerges: number;
  biggestTier: number;
  muted: boolean;
  musicMuted: boolean;
  /** SFX channel volume, 0..1. */
  sfxVolume: number;
  /** Music channel volume, 0..1. */
  musicVolume: number;
  /** Honor reduced-motion: dampens shake/confetti/flash. */
  reducedMotion: boolean;

  // ── progression ──
  level: number;
  /** XP accumulated toward the next level. */
  xp: number;
  coins: number;
  shards: number;

  // ── bonus charge (energy-as-bonus; never blocks play) ──
  charge: number;
  chargeDay: string;

  // ── daily login ──
  loginIndex: number;
  loginLast: string;

  // ── daily orders / chest ──
  dailyOrders: OrderState[];
  dailyDay: string;
  dailyRerolls: number;
  dailyChest: number;
  dailyChestClaimed: boolean;

  // ── weekly orders / activity ──
  weeklyOrders: OrderState[];
  weeklyId: string;
  activityDays: string[];
  activityClaimed: boolean;

  // ── season ──
  seasonId: string;
  seasonXp: number;
  seasonFreeClaimed: number[];
  seasonEliteClaimed: number[];
  seasonWeeklyDone: number;

  // ── collection / cosmetics ──
  owned: string[];
  cosShards: Record<string, number>;
  equipped: Record<CosmeticType, string>;

  // ── shop ──
  shopDay: string;
  shopOffer: string[];
  shopBought: string[];

  // ── chests / pity ──
  chestsOpened: number;
  pityEpic: number;
  pityMythic: number;

  // ── achievements / medals ──
  achProgressClaimed: string[];
  medals: Record<string, number>;

  // ── per-animal mastery (usage count per tier) ──
  mastery: Record<number, number>;

  // ── lifetime stats ──
  stats: Record<string, number>;

  // ── daily challenge ──
  challengeDay: string;
  challengeScore: number;
  challengePlayed: boolean;
  challengeRewardDay: string;
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
