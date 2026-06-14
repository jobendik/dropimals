import { state } from '../state';
import { saveProfile } from '../utils/storage';
import { addCoins, addShards } from './economy';
import { ownCosmetic } from './collection';
import { pushToast } from './notify';
import { getStat } from './stats';
import { MAX_TIER } from '../data/dropimals';
import type { AchievementDef } from '../types';

// Long-term goals driven by lifetime stats (doc §14.2). Always show partial
// progress; completing one is a strong return hook.
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'ach_merge100',  name: 'Getting Merged In', desc: 'Merge 100 pairs',      stat: 'merges',       goal: 100,    coins: 200, shards: 5 },
  { id: 'ach_merge1000', name: 'Merge Machine',     desc: 'Merge 1,000 pairs',    stat: 'merges',       goal: 1000,   coins: 600, shards: 15 },
  { id: 'ach_games50',   name: 'Regular',           desc: 'Play 50 games',        stat: 'games',        goal: 50,     coins: 300, shards: 6 },
  { id: 'ach_games100',  name: 'Centurion',         desc: 'Play 100 games',       stat: 'games',        goal: 100,    coins: 500, shards: 10, title: 'title_centurion' },
  { id: 'ach_dex',       name: 'Zookeeper',         desc: 'Complete the Dropidex', stat: 'discovered',  goal: MAX_TIER + 1, coins: 500, shards: 20, title: 'title_zookeeper' },
  { id: 'ach_whale',     name: 'Whale Watcher',     desc: 'Create a Luna Whale',  stat: 'bestTier',     goal: MAX_TIER, coins: 400, shards: 10 },
  { id: 'ach_score100k', name: 'Six Figures',       desc: 'Score 100,000 in a run', stat: 'bestScore',  goal: 100000, coins: 400, shards: 8 },
  { id: 'ach_score500k', name: 'High Roller',       desc: 'Score 500,000 in a run', stat: 'bestScore',  goal: 500000, coins: 800, shards: 20 },
  { id: 'ach_fever50',   name: 'Hot Streak',        desc: 'Trigger Fever 50 times', stat: 'fevers',     goal: 50,     coins: 300, shards: 6 },
  { id: 'ach_combo12',   name: 'Chain Reaction',    desc: 'Hit a x12 combo',      stat: 'comboMax',     goal: 12,     coins: 350, shards: 8 },
  { id: 'ach_chests25',  name: 'Treasure Hunter',   desc: 'Open 25 chests',       stat: 'chestsOpened', goal: 25,     coins: 250, shards: 5 },
  { id: 'ach_level15',   name: 'Seasoned',          desc: 'Reach account level 15', stat: 'level',      goal: 15,     coins: 600, shards: 14 },
];

const BY_ID = new Map(ACHIEVEMENTS.map(a => [a.id, a]));

export function achievementValue(a: AchievementDef): number {
  switch (a.stat) {
    case 'discovered': return state.profile.discovered.filter(Boolean).length;
    case 'level':      return state.profile.level;
    default:           return getStat(a.stat);
  }
}

export function isComplete(a: AchievementDef): boolean {
  return achievementValue(a) >= a.goal;
}

export function isClaimed(a: AchievementDef): boolean {
  return state.profile.achProgressClaimed.includes(a.id);
}

export function claimAchievement(id: string): boolean {
  const a = BY_ID.get(id);
  if (!a || !isComplete(a) || isClaimed(a)) return false;
  state.profile.achProgressClaimed.push(id);
  addCoins(a.coins);
  addShards(a.shards);
  if (a.title) ownCosmetic(a.title);
  pushToast('Achievement: ' + a.name, { sub: `+${a.coins} coins · +${a.shards} shards`, icon: 'star', color: '#ffd86a' });
  saveProfile();
  return true;
}

export function claimableAchievements(): number {
  return ACHIEVEMENTS.filter(a => isComplete(a) && !isClaimed(a)).length;
}
