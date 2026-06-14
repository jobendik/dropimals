import { state } from '../state';
import { saveProfile } from '../utils/storage';
import { queueOverlay, pushToast } from './notify';
import { droppablePool, ownCosmetic, cosmeticById } from './collection';
import { addStat } from './stats';
import type { ChestKind, ChestReward, Rarity } from '../types';

interface ChestOdds {
  rarity: Record<Rarity, number>;
  coins: number;
  shards: number;
}

// Transparent odds (doc §9.2) — surfaced in the chest UI. The rarity weights are
// the chance the chest's cosmetic slot rolls at each tier.
export const CHEST_TABLE: Record<ChestKind, ChestOdds> = {
  daily:     { rarity: { common: 0.62, rare: 0.28, epic: 0.09, mythic: 0.01 }, coins: 80,  shards: 2 },
  weekly:    { rarity: { common: 0.40, rare: 0.40, epic: 0.17, mythic: 0.03 }, coins: 220, shards: 6 },
  level:     { rarity: { common: 0.58, rare: 0.31, epic: 0.10, mythic: 0.01 }, coins: 60,  shards: 1 },
  season:    { rarity: { common: 0.35, rare: 0.42, epic: 0.19, mythic: 0.04 }, coins: 140, shards: 4 },
  event:     { rarity: { common: 0.50, rare: 0.35, epic: 0.13, mythic: 0.02 }, coins: 100, shards: 3 },
  challenge: { rarity: { common: 0.45, rare: 0.38, epic: 0.15, mythic: 0.02 }, coins: 120, shards: 4 },
};

export const PITY_EPIC = 10;
export const PITY_MYTHIC = 50;

const RANK: Rarity[] = ['common', 'rare', 'epic', 'mythic'];

function rollRarity(odds: ChestOdds): Rarity {
  const p = state.profile;
  // Pity: a guaranteed floor stops long droughts (doc §9.3).
  if (p.pityMythic + 1 >= PITY_MYTHIC) return 'mythic';
  if (p.pityEpic + 1 >= PITY_EPIC) return 'epic';

  let roll = Math.random();
  for (const r of RANK) {
    roll -= odds.rarity[r];
    if (roll <= 0) return r;
  }
  return 'common';
}

/** Roll a chest, apply its rewards to the profile, and queue the reveal overlay. */
export function openChest(kind: ChestKind): ChestReward {
  const p = state.profile;
  const odds = CHEST_TABLE[kind];
  const rarity = rollRarity(odds);

  // Update pity counters.
  p.pityEpic = RANK.indexOf(rarity) >= 2 ? 0 : p.pityEpic + 1;
  p.pityMythic = rarity === 'mythic' ? 0 : p.pityMythic + 1;
  p.chestsOpened++;

  let coins = odds.coins + Math.round(odds.coins * 0.5 * Math.random());
  let shards = odds.shards;
  let cosmetic: string | undefined;

  // Try to grant an unowned cosmetic of the rolled rarity; a duplicate (none
  // left) converts to bonus shards so a chest is never a dud (doc §8.2).
  const pool = droppablePool(rarity);
  if (pool.length) {
    cosmetic = pool[Math.floor(Math.random() * pool.length)].id;
    ownCosmetic(cosmetic);
  } else {
    shards += rarity === 'mythic' ? 20 : rarity === 'epic' ? 8 : rarity === 'rare' ? 4 : 2;
  }

  p.coins += coins;
  p.shards += shards;
  addStat('chestsOpened', 1);
  addStat('coinsEarned', coins);

  const reward: ChestReward = { coins, shards, cosmetic, rarity };
  queueOverlay({ kind: 'chest', chestKind: kind, reward, age: 0 });
  saveProfile();
  return reward;
}

/** Open a chest silently (no overlay) — for batch claims; toasts instead. */
export function grantChest(kind: ChestKind): void {
  const r = openChest(kind);
  const c = r.cosmetic ? cosmeticById(r.cosmetic) : undefined;
  if (c) pushToast('New ' + c.name + '!', { icon: 'chest', color: '#fff6a8' });
}
