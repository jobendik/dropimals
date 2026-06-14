import { state } from '../state';
import { addShards } from './economy';
import { ownCosmetic } from './collection';
import { pushToast } from './notify';
import { DROPIMALS } from '../data/dropimals';

// Per-animal mastery (doc §3.3): every Dropimal levels up the more you *use* it —
// dropping it and creating it through merges both count. Each mastery level pays
// out shards, so favouring rarer animals (which level slowly) stays rewarding.
export const MASTERY_THRESHOLDS = [5, 15, 30, 55, 90, 140, 210, 300];
export const MASTERY_MAX = MASTERY_THRESHOLDS.length;

export function masteryCount(tier: number): number {
  return state.profile.mastery[tier] || 0;
}

export function masteryLevel(tier: number): number {
  const c = masteryCount(tier);
  let lvl = 0;
  for (const t of MASTERY_THRESHOLDS) { if (c >= t) lvl++; else break; }
  return lvl;
}

/** Usage needed for the next level, or null if maxed. */
export function masteryNext(tier: number): number | null {
  const lvl = masteryLevel(tier);
  return lvl >= MASTERY_MAX ? null : MASTERY_THRESHOLDS[lvl];
}

/** Progress 0..1 toward the next mastery level. */
export function masteryFrac(tier: number): number {
  const lvl = masteryLevel(tier);
  if (lvl >= MASTERY_MAX) return 1;
  const prev = lvl === 0 ? 0 : MASTERY_THRESHOLDS[lvl - 1];
  const next = MASTERY_THRESHOLDS[lvl];
  return (masteryCount(tier) - prev) / (next - prev);
}

/** Shards granted for reaching mastery level `level`. */
export function masteryReward(level: number): number {
  return 2 + level;
}

/** Count one use of `tier`; rolls mastery levels and pays out shards. */
export function masteryAdd(tier: number, n = 1): void {
  const p = state.profile;
  const before = masteryLevel(tier);
  p.mastery[tier] = (p.mastery[tier] || 0) + n;
  const after = masteryLevel(tier);
  if (after <= before) return;

  let shards = 0;
  for (let l = before + 1; l <= after; l++) shards += masteryReward(l);
  addShards(shards);
  pushToast(DROPIMALS[tier].name + ' Mastery ' + after, { sub: '+' + shards + ' shards', icon: 'shard', color: '#7fdcff' });
  checkGrandmaster();
}

function checkGrandmaster(): void {
  for (let i = 0; i < DROPIMALS.length; i++) if (masteryLevel(i) < MASTERY_MAX) return;
  if (!state.profile.owned.includes('title_grandmaster')) {
    ownCosmetic('title_grandmaster');
    pushToast('Title unlocked: Grandmaster!', { icon: 'star', color: '#ffd86a' });
  }
}

/** Total mastery levels earned across all animals (for stats). */
export function totalMasteryLevels(): number {
  let sum = 0;
  for (let i = 0; i < DROPIMALS.length; i++) sum += masteryLevel(i);
  return sum;
}
