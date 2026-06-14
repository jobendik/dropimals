import type { Profile, CosmeticType } from '../types';
import { DROPIMALS } from '../data/dropimals';

// Bonus charge: a non-blocking "energy" that only ever *adds* reward. Full at the
// start of each day; each run while charged grants bonus XP/coins, then it ticks
// down. Empty just means normal play — never a block.
export const MAX_CHARGE = 3;
export const CHARGE_XP_MULT = 1.25;

/** A fresh profile with every retention field defaulted. */
export function defaultProfile(): Profile {
  const equipped: Record<CosmeticType, string> = {
    bg: 'bg_default',
    trail: 'trail_none',
    palette: 'palette_default',
    victory: 'victory_default',
    frame: 'frame_none',
    title: 'title_hatchling',
  };
  return {
    highScore: 0,
    discovered: new Array(DROPIMALS.length).fill(false),
    streak: 0,
    lastDay: '',
    games: 0,
    totalMerges: 0,
    biggestTier: 0,
    muted: false,
    musicMuted: false,
    sfxVolume: 1,
    musicVolume: 0.3,
    reducedMotion: false,

    level: 1,
    xp: 0,
    coins: 0,
    shards: 0,

    charge: MAX_CHARGE,
    chargeDay: '',

    loginIndex: 0,
    loginLast: '',

    dailyOrders: [],
    dailyDay: '',
    dailyRerolls: 1,
    dailyChest: 0,
    dailyChestClaimed: false,

    weeklyOrders: [],
    weeklyId: '',
    activityDays: [],
    activityClaimed: false,

    seasonId: '',
    seasonXp: 0,
    seasonFreeClaimed: [],
    seasonEliteClaimed: [],
    seasonWeeklyDone: 0,

    owned: [
      'bg_default', 'trail_none', 'palette_default',
      'victory_default', 'frame_none', 'title_hatchling',
    ],
    cosShards: {},
    equipped,

    shopDay: '',
    shopOffer: [],
    shopBought: [],

    chestsOpened: 0,
    pityEpic: 0,
    pityMythic: 0,

    achProgressClaimed: [],
    medals: {},

    mastery: {},

    stats: {},

    challengeDay: '',
    challengeScore: 0,
    challengePlayed: false,
    challengeRewardDay: '',
  };
}

/** Deep-merge a parsed save over fresh defaults so old/partial saves upgrade cleanly. */
export function mergeProfile(saved: Partial<Profile> | null): Profile {
  const p = defaultProfile();
  if (!saved || typeof saved !== 'object') return p;

  // Scalars & strings — copy when present and the right shape.
  const keys = Object.keys(p) as (keyof Profile)[];
  for (const k of keys) {
    const v = (saved as Record<string, unknown>)[k as string];
    if (v === undefined || v === null) continue;
    const def = p[k];
    if (Array.isArray(def)) {
      if (Array.isArray(v)) (p[k] as unknown) = v;
    } else if (typeof def === 'object') {
      if (typeof v === 'object') (p[k] as unknown) = { ...(def as object), ...(v as object) };
    } else if (typeof def === typeof v) {
      (p[k] as unknown) = v;
    }
  }

  // Keep the discovered array sized to the current roster.
  const disc = new Array(DROPIMALS.length).fill(false);
  for (let i = 0; i < disc.length; i++) disc[i] = Boolean(p.discovered[i]);
  p.discovered = disc;

  // Always own the base cosmetics, even on upgraded saves.
  for (const base of defaultProfile().owned) {
    if (!p.owned.includes(base)) p.owned.push(base);
  }
  // Backfill any missing equip slot.
  const eq = defaultProfile().equipped;
  for (const slot of Object.keys(eq) as CosmeticType[]) {
    if (!p.equipped[slot]) p.equipped[slot] = eq[slot];
  }
  return p;
}

// ── Player level curve & titles ──────────────────────────────────────────────
// Fast early levels, then a gentle ramp (doc §3.1). XP per run is on the order of
// a few hundred, so early levels pop in one or two runs.

/** Total XP needed to advance FROM `level` to the next. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 300;
  if (level <= 5) return 300 + (level - 1) * 250;     // 550..1300
  if (level <= 15) return 1300 + (level - 5) * 500;   // up to ~6300
  if (level <= 30) return 6300 + (level - 15) * 900;
  return 19800 + (level - 30) * 1500;                 // long prestige tail
}

export interface TitleBand { min: number; id: string; name: string; }

// Account titles by level band — themed for a critter-collecting game.
export const TITLE_BANDS: TitleBand[] = [
  { min: 1,  id: 'title_hatchling',   name: 'Hatchling' },
  { min: 3,  id: 'title_cub',         name: 'Cub' },
  { min: 6,  id: 'title_critter',     name: 'Critter Keeper' },
  { min: 10, id: 'title_forager',     name: 'Forager' },
  { min: 15, id: 'title_tracker',     name: 'Tracker' },
  { min: 20, id: 'title_ranger',      name: 'Ranger' },
  { min: 26, id: 'title_guardian',    name: 'Guardian' },
  { min: 33, id: 'title_beastmaster', name: 'Beastmaster' },
  { min: 42, id: 'title_mythic',      name: 'Mythic Tamer' },
  { min: 55, id: 'title_legend',      name: 'Legend' },
];

export function titleForLevel(level: number): TitleBand {
  let band = TITLE_BANDS[0];
  for (const b of TITLE_BANDS) if (level >= b.min) band = b;
  return band;
}
