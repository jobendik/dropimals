import { state } from '../state';
import { saveProfile } from '../utils/storage';
import { addCoins, addXp } from './economy';
import { openChest } from './chests';
import { pushToast } from './notify';
import { dayId, weekId, hashStr, seededRng, pickDistinct } from './time';
import { DROPIMALS, MAX_TIER } from '../data/dropimals';
import { formatScore } from '../utils/math';
import type { OrderState, OrderKind } from '../types';

interface Template {
  kind: OrderKind;
  /** [min,max] goal range; rounded for score. */
  range: [number, number];
  text: (goal: number, arg?: number) => string;
  coins: number;
  xp: number;
  /** Only for 'tier': the [min,max] target tier range. */
  tierRange?: [number, number];
  /** Score/combo orders track the best single run, not a sum. */
  max?: boolean;
}

const DAILY: Template[] = [
  { kind: 'merges',   range: [12, 24], text: g => `Merge ${g} pairs`, coins: 60, xp: 120 },
  { kind: 'score',    range: [6000, 16000], text: g => `Score ${formatScore(g)} in one run`, coins: 70, xp: 140, max: true },
  { kind: 'combo',    range: [4, 6], text: g => `Hit a x${g} combo`, coins: 80, xp: 150, max: true },
  { kind: 'tier',     range: [1, 1], text: (_g, a) => `Create a ${DROPIMALS[a ?? 4].name}`, coins: 75, xp: 145, tierRange: [4, 6] },
  { kind: 'discover', range: [1, 2], text: g => `Discover ${g} new Dropimal${g > 1 ? 's' : ''}`, coins: 90, xp: 180 },
  { kind: 'games',    range: [2, 3], text: g => `Play ${g} games`, coins: 50, xp: 100 },
  { kind: 'fever',    range: [1, 2], text: g => `Trigger Fever ${g}x`, coins: 70, xp: 130 },
  { kind: 'nudge',    range: [1, 1], text: () => `Use a Nudge`, coins: 40, xp: 80 },
];

const WEEKLY: Template[] = [
  { kind: 'merges',   range: [120, 220], text: g => `Merge ${g} pairs this week`, coins: 250, xp: 600 },
  { kind: 'score',    range: [30000, 90000], text: g => `Score ${formatScore(g)} in one run`, coins: 320, xp: 720, max: true },
  { kind: 'games',    range: [12, 22], text: g => `Play ${g} games`, coins: 240, xp: 580 },
  { kind: 'discover', range: [3, 5], text: g => `Discover ${g} new Dropimals`, coins: 300, xp: 680 },
  { kind: 'combo',    range: [7, 9], text: g => `Hit a x${g} combo`, coins: 320, xp: 740, max: true },
  { kind: 'tier',     range: [1, 1], text: (_g, a) => `Create a ${DROPIMALS[a ?? 7].name}`, coins: 330, xp: 760, tierRange: [7, 8] },
  { kind: 'fever',    range: [6, 10], text: g => `Trigger Fever ${g}x`, coins: 260, xp: 620 },
];

function makeOrder(t: Template, rng: () => number, idx: number, salt: string): OrderState {
  let goal = Math.round(t.range[0] + rng() * (t.range[1] - t.range[0]));
  if (t.kind === 'score') goal = Math.round(goal / 1000) * 1000;
  let arg: number | undefined;
  if (t.tierRange) {
    arg = Math.min(MAX_TIER, Math.round(t.tierRange[0] + rng() * (t.tierRange[1] - t.tierRange[0])));
    goal = 1;
  }
  return {
    id: salt + '_' + idx,
    kind: t.kind,
    text: t.text(goal, arg),
    goal,
    progress: 0,
    arg,
    coins: t.coins,
    xp: t.xp,
    done: false,
    claimed: false,
  };
}

function genOrders(templates: Template[], n: number, salt: string, reroll = 0): OrderState[] {
  const rng = seededRng(hashStr(salt + ':' + reroll));
  const picks = pickDistinct(templates, n, rng);
  return picks.map((t, i) => makeOrder(t, rng, i, salt));
}

/** (Re)generate daily/weekly orders when the day or ISO-week rolls over. */
export function ensureOrders(): void {
  const p = state.profile;
  const today = dayId();
  const week = weekId();

  if (p.dailyDay !== today) {
    p.dailyDay = today;
    p.dailyRerolls = 1;
    p.dailyChest = 0;
    p.dailyChestClaimed = false;
    p.dailyOrders = genOrders(DAILY, 3, 'd' + today);
  }
  if (p.weeklyId !== week) {
    p.weeklyId = week;
    p.weeklyOrders = genOrders(WEEKLY, 3, 'w' + week);
    p.activityDays = [];
    p.activityClaimed = false;
  }
  saveProfile();
}

/** Reroll a single daily order (once per day, doc §13.3). */
export function rerollDaily(index: number): boolean {
  const p = state.profile;
  if (p.dailyRerolls <= 0 || !p.dailyOrders[index] || p.dailyOrders[index].claimed) return false;
  p.dailyRerolls--;
  const rng = seededRng(hashStr('reroll' + p.dailyDay + index + p.dailyRerolls));
  const used = new Set(p.dailyOrders.map(o => o.kind));
  const choices = DAILY.filter(t => !used.has(t.kind));
  const t = (choices.length ? choices : DAILY)[Math.floor(rng() * (choices.length || DAILY.length))];
  p.dailyOrders[index] = makeOrder(t, rng, index, 'd' + p.dailyDay + 'r');
  saveProfile();
  return true;
}

function bump(orders: OrderState[], kind: OrderKind, value: number, max: boolean, arg?: number): boolean {
  let newlyDone = false;
  for (const o of orders) {
    if (o.kind !== kind || o.done) continue;
    if (kind === 'tier' && o.arg !== arg) continue;
    o.progress = max ? Math.max(o.progress, value) : o.progress + value;
    if (o.progress >= o.goal) { o.done = true; o.progress = o.goal; newlyDone = true; }
  }
  return newlyDone;
}

/** Feed an objective metric into both daily and weekly orders. */
export function progressOrders(kind: OrderKind, value: number, max = false, arg?: number): void {
  const p = state.profile;
  bump(p.dailyOrders, kind, value, max, arg);
  if (bump(p.weeklyOrders, kind, value, max, arg)) {
    // A freshly-completed weekly order counts toward the season Elite unlock.
    p.seasonWeeklyDone++;
  }
}

export function claimOrder(scope: 'daily' | 'weekly', id: string): boolean {
  const p = state.profile;
  const list = scope === 'daily' ? p.dailyOrders : p.weeklyOrders;
  const o = list.find(x => x.id === id);
  if (!o || !o.done || o.claimed) return false;
  o.claimed = true;
  addCoins(o.coins);
  addXp(o.xp);
  pushToast('Order complete!', { sub: `+${o.coins} coins · +${o.xp} XP`, icon: 'check', color: '#9dff74' });
  saveProfile();
  return true;
}

export function claimableOrders(): number {
  const p = state.profile;
  return [...p.dailyOrders, ...p.weeklyOrders].filter(o => o.done && !o.claimed).length;
}

export const ACTIVITY_GOAL = 3;

/** Claim the daily-chest meter once full (doc §5.3). */
export function claimDailyChest(): boolean {
  const p = state.profile;
  if (p.dailyChest < 100 || p.dailyChestClaimed) return false;
  p.dailyChestClaimed = true;
  openChest('daily');
  saveProfile();
  return true;
}

/** Claim the weekly-activity bonus once enough days are played (doc §12.1). */
export function claimWeeklyActivity(): boolean {
  const p = state.profile;
  if (p.activityDays.length < ACTIVITY_GOAL || p.activityClaimed) return false;
  p.activityClaimed = true;
  openChest('weekly');
  saveProfile();
  return true;
}

/** Total claimables across orders, chest, and activity — for the menu badge. */
export function totalClaimable(): number {
  const p = state.profile;
  let n = claimableOrders();
  if (p.dailyChest >= 100 && !p.dailyChestClaimed) n++;
  if (p.activityDays.length >= ACTIVITY_GOAL && !p.activityClaimed) n++;
  return n;
}
