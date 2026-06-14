import { state } from '../state';
import { saveProfile } from '../utils/storage';
import { queueOverlay } from './notify';
import { openChest } from './chests';
import { ownCosmetic, equip } from './collection';
import {
  xpForLevel, titleForLevel, MAX_CHARGE,
} from './profile';
import { dayId } from './time';

// ── Currencies ───────────────────────────────────────────────────────────────

export function addCoins(n: number): void {
  state.profile.coins = Math.max(0, state.profile.coins + n);
}

export function addShards(n: number): void {
  state.profile.shards = Math.max(0, state.profile.shards + n);
}

export function addSeasonXp(n: number): void {
  state.profile.seasonXp += n;
}

// ── Player XP & levels ───────────────────────────────────────────────────────

/** Add account XP; rolls levels and queues level-up celebrations. Returns levels gained. */
export function addXp(n: number): number {
  const p = state.profile;
  p.xp += n;
  let gained = 0;
  while (p.xp >= xpForLevel(p.level)) {
    p.xp -= xpForLevel(p.level);
    p.level++;
    gained++;
    onLevelUp(p.level);
  }
  return gained;
}

function onLevelUp(level: number): void {
  const p = state.profile;
  // Cross a title band → unlock & auto-equip the new title.
  const band = titleForLevel(level);
  let newTitle = false;
  if (!p.owned.includes(band.id)) {
    ownCosmetic(band.id);
    equip('title', band.id);
    newTitle = true;
  }
  queueOverlay({ kind: 'levelup', level, title: band.name, newTitle, age: 0 });
  // Every level-up drops a chest (doc §9.1).
  openChest('level');
}

// ── Bonus charge (energy-as-bonus; never blocks play, doc §19) ────────────────

/** Refill charge to full once per calendar day. */
export function refreshCharge(): void {
  const p = state.profile;
  const today = dayId();
  if (p.chargeDay !== today) {
    p.charge = MAX_CHARGE;
    p.chargeDay = today;
    saveProfile();
  }
}

/** Consume one bonus charge if available; returns whether this run is charged. */
export function consumeCharge(): boolean {
  refreshCharge();
  const p = state.profile;
  if (p.charge > 0) { p.charge--; saveProfile(); return true; }
  return false;
}
