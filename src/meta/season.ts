import { state } from '../state';
import { saveProfile } from '../utils/storage';
import { addCoins, addShards } from './economy';
import { ownCosmetic, isOwned, cosmeticById } from './collection';
import { pushToast } from './notify';
import { seasonId } from './time';

export const SEASON_TIERS = 30;
export const XP_PER_TIER = 1200;
/** Weekly orders to complete (this season) to unlock the Elite track. */
export const ELITE_UNLOCK = 5;

export interface TierReward { coins?: number; shards?: number; cosmetic?: string; }

// Milestone cosmetics seeded across the track; non-milestone tiers pay currency.
const FREE_COSMETICS: Record<number, string> = {
  5: 'bg_sunset', 10: 'trail_sparkle', 15: 'palette_pastel',
  20: 'victory_fireworks', 25: 'frame_gold', 30: 'bg_aurora',
};
const ELITE_COSMETICS: Record<number, string> = {
  5: 'palette_fire', 10: 'trail_comet', 15: 'bg_candy',
  20: 'victory_stars', 25: 'frame_neon', 30: 'bg_galaxy',
};

export function freeReward(tier: number): TierReward {
  const cos = FREE_COSMETICS[tier + 1];
  if (cos) return { cosmetic: cos };
  return { coins: 60 + tier * 6, shards: (tier % 3 === 0) ? 2 : 0 };
}

export function eliteReward(tier: number): TierReward {
  const cos = ELITE_COSMETICS[tier + 1];
  if (cos) return { cosmetic: cos };
  return { coins: 120 + tier * 10, shards: (tier % 2 === 0) ? 3 : 1 };
}

/** Reset season progress when a new season begins. */
export function ensureSeason(): void {
  const p = state.profile;
  const id = seasonId();
  if (p.seasonId !== id) {
    p.seasonId = id;
    p.seasonXp = 0;
    p.seasonFreeClaimed = [];
    p.seasonEliteClaimed = [];
    p.seasonWeeklyDone = 0;
    saveProfile();
  }
}

/** Current season level 0..SEASON_TIERS (number of tiers passed). */
export function seasonLevel(): number {
  return Math.min(SEASON_TIERS, Math.floor(state.profile.seasonXp / XP_PER_TIER));
}

export function seasonProgressFrac(): number {
  const lvl = seasonLevel();
  if (lvl >= SEASON_TIERS) return 1;
  return (state.profile.seasonXp - lvl * XP_PER_TIER) / XP_PER_TIER;
}

export function eliteUnlocked(): boolean {
  return state.profile.seasonWeeklyDone >= ELITE_UNLOCK;
}

function grant(r: TierReward): string {
  if (r.cosmetic) {
    if (isOwned(r.cosmetic)) { addShards(8); return '+8 shards (owned)'; }
    ownCosmetic(r.cosmetic);
    return 'New: ' + (cosmeticById(r.cosmetic)?.name ?? 'cosmetic');
  }
  if (r.coins) addCoins(r.coins);
  if (r.shards) addShards(r.shards);
  return `+${r.coins ?? 0} coins` + (r.shards ? ` · +${r.shards} shards` : '');
}

/** Claim one free tier reward (must be passed and unclaimed). */
export function claimFree(tier: number): boolean {
  const p = state.profile;
  if (tier >= seasonLevel() || p.seasonFreeClaimed.includes(tier)) return false;
  p.seasonFreeClaimed.push(tier);
  pushToast('Season reward!', { sub: grant(freeReward(tier)), icon: 'star', color: '#8ffbff' });
  saveProfile();
  return true;
}

export function claimElite(tier: number): boolean {
  const p = state.profile;
  if (!eliteUnlocked() || tier >= seasonLevel() || p.seasonEliteClaimed.includes(tier)) return false;
  p.seasonEliteClaimed.push(tier);
  pushToast('Elite reward!', { sub: grant(eliteReward(tier)), icon: 'star', color: '#ffd86a' });
  saveProfile();
  return true;
}

/** Number of season rewards ready to claim (free + elite if unlocked). */
export function claimableSeason(): number {
  const p = state.profile;
  const lvl = seasonLevel();
  let n = 0;
  for (let i = 0; i < lvl; i++) {
    if (!p.seasonFreeClaimed.includes(i)) n++;
    if (eliteUnlocked() && !p.seasonEliteClaimed.includes(i)) n++;
  }
  return n;
}
