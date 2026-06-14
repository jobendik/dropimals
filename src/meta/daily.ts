import { state } from '../state';
import { saveProfile } from '../utils/storage';
import { ensureOrders } from './orders';
import { ensureSeason } from './season';
import { ensureShop } from './shop';
import { refreshCharge, addCoins, addShards } from './economy';
import { currentEvent } from './events';
import { grantChest } from './chests';
import { pushToast } from './notify';
import { dayId, weekdayKey } from './time';
import type { ChestKind } from '../types';

// Forgiving 7-day login cycle (doc §5.1): missing a day does not wipe progress;
// the cycle simply advances on the next day you play.
type LoginReward =
  | { coins: number } | { shards: number } | { chest: ChestKind };

const LOGIN_CYCLE: LoginReward[] = [
  { coins: 100 },
  { coins: 150 },
  { chest: 'daily' },
  { shards: 5 },
  { coins: 250 },
  { chest: 'daily' },
  { chest: 'weekly' },
];

function claimLogin(): void {
  const p = state.profile;
  const today = dayId();
  if (p.loginLast === today) return;
  p.loginLast = today;

  const reward = LOGIN_CYCLE[p.loginIndex % LOGIN_CYCLE.length];
  const dayNum = (p.loginIndex % LOGIN_CYCLE.length) + 1;
  p.loginIndex = (p.loginIndex + 1) % LOGIN_CYCLE.length;

  if ('coins' in reward) {
    addCoins(reward.coins);
    pushToast('Daily Bonus — Day ' + dayNum, { sub: `+${reward.coins} coins`, icon: 'coin', color: '#ffd86a' });
  } else if ('shards' in reward) {
    addShards(reward.shards);
    pushToast('Daily Bonus — Day ' + dayNum, { sub: `+${reward.shards} shards`, icon: 'shard', color: '#6fd0ff' });
  } else {
    pushToast('Daily Bonus — Day ' + dayNum, { sub: 'A free chest!', icon: 'chest', color: '#fff6a8' });
    grantChest(reward.chest);
  }
  saveProfile();
}

/** Run all per-day / per-week rollovers once at boot, then grant the login bonus. */
export function runDailyMaintenance(): void {
  ensureSeason();
  ensureOrders();
  ensureShop();
  refreshCharge();

  const today = dayId();
  if (state.profile.challengeDay !== today) {
    state.profile.challengeDay = today;
    state.profile.challengeScore = 0;
    state.profile.challengePlayed = false;
  }

  const ev = currentEvent();
  state.eventId = ev.id;

  claimLogin();
  pushToast("Today: " + ev.name, { sub: ev.desc, icon: 'star', color: ev.color, life: 4 });
  saveProfile();
}

export function weekdayShort(): string { return weekdayKey(); }
