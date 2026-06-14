import { state } from '../state';
import { saveProfile } from '../utils/storage';
import { addCoins, addXp, addSeasonXp } from './economy';
import { CHARGE_XP_MULT } from './profile';
import { addStat, bumpStatMax } from './stats';
import { progressOrders, claimableOrders } from './orders';
import { currentEvent } from './events';
import { detectMedals } from './medals';
import { pushToast } from './notify';
import { ACHIEVEMENTS, isComplete, isClaimed } from './achievements';
import { claimableSeason } from './season';
import type { RunReward, MedalDef } from '../types';

/** Fill the daily-chest meter from a finished run (doc §5.3). */
function fillDailyChest(amount: number): void {
  const p = state.profile;
  if (p.dailyChestClaimed) return;
  p.dailyChest = Math.min(100, p.dailyChest + amount);
}

/** Snapshot which achievements are already complete, to detect *new* ones. */
function completeSet(): Set<string> {
  const s = new Set<string>();
  for (const a of ACHIEVEMENTS) if (isComplete(a)) s.add(a.id);
  return s;
}

function pickNextAction(): string {
  if (claimableOrders() > 0) return 'Claim your finished orders!';
  if (claimableSeason() > 0) return 'Season rewards are waiting!';
  const p = state.profile;
  // Nearest unfinished order.
  let best: { text: string; frac: number } | null = null;
  for (const o of [...p.dailyOrders, ...p.weeklyOrders]) {
    if (o.done) continue;
    const frac = o.progress / o.goal;
    if (!best || frac > best.frac) best = { text: o.text, frac };
  }
  if (best && best.frac > 0.4) return 'Almost there: ' + best.text;
  if (!p.dailyChestClaimed && p.dailyChest >= 60) return `Daily chest ${Math.floor(p.dailyChest)}% — one more run!`;
  return 'One more run?';
}

/**
 * The full match-reward pipeline (doc §25.2). Runs once when a run's cascade
 * settles: updates stats, orders, season, currencies, XP/levels, medals, the
 * daily chest, and builds the result-screen summary.
 */
export function finalizeRun(): RunReward {
  const s = state;
  const p = s.profile;
  const ev = currentEvent();

  const preAch = completeSet();

  // ── Lifetime stats ──
  addStat('games', 1);
  addStat('score', s.score);
  bumpStatMax('bestScore', s.score);
  bumpStatMax('comboMax', s.maxCombo);
  bumpStatMax('bestTier', s.bestTier);

  // ── Orders that resolve at run end ──
  progressOrders('games', 1);
  progressOrders('score', s.score, true);
  progressOrders('combo', s.maxCombo, true);

  // ── Base rewards (scale with how the run actually went) ──
  const baseXp =
    Math.round(s.score / 120) + s.merges * 8 +
    s.runDiscoveries.length * 60 + s.bestTier * 20 + 40;
  const charged = (s.runStats.charged || 0) > 0;
  const chargeBonus = charged ? Math.round(baseXp * (CHARGE_XP_MULT - 1)) : 0;
  const firstWinBonus = (s.runStats.firstOfDay || 0) > 0 ? Math.round(baseXp * 0.5) : 0;

  const preEventXp = baseXp + chargeBonus + firstWinBonus;
  const xp = Math.round(preEventXp * ev.xpMult);
  const eventBonus = xp - preEventXp;

  const coins = Math.round(
    (50 + s.merges * 3 + s.bestTier * 15 + Math.floor(s.score / 400)) * ev.coinMult);
  const seasonXp = Math.round(
    (Math.round(s.score / 100) + s.merges * 6 + 30) * ev.seasonMult);

  // ── Daily chest fill ──
  fillDailyChest((25 + Math.min(50, s.merges * 2) + s.runDiscoveries.length * 8) * ev.chestMult);

  // ── Medals (in-run feats) ──
  const medals: MedalDef[] = detectMedals();
  let medalXp = 0, medalCoins = 0;
  for (const m of medals) {
    medalXp += m.xp;
    medalCoins += m.coins;
    p.medals[m.id] = (p.medals[m.id] || 0) + 1;
  }

  // ── Apply ──
  addCoins(coins + medalCoins);
  addStat('coinsEarned', coins + medalCoins);
  addSeasonXp(seasonXp);
  const newLevelBefore = p.level;
  const levelsGained = addXp(xp + medalXp);

  // ── New-achievement toasts (only those that flipped this run) ──
  for (const a of ACHIEVEMENTS) {
    if (isComplete(a) && !preAch.has(a.id) && !isClaimed(a)) {
      pushToast('Achievement ready: ' + a.name, { icon: 'star', color: '#ffd86a' });
    }
  }

  const reward: RunReward = {
    xp, coins: coins + medalCoins, seasonXp,
    baseXp, chargeBonus, firstWinBonus, eventBonus,
    levelsGained, newLevel: p.level,
    medals, ordersCompleted: 0,
    nextAction: pickNextAction(),
  };
  void newLevelBefore;
  s.runReward = reward;
  saveProfile();
  return reward;
}
