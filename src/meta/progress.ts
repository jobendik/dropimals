import { state } from '../state';
import { addStat } from './stats';
import { progressOrders } from './orders';
import { masteryAdd } from './mastery';

// In-run tracking hooks called from gameplay. They keep daily/weekly orders and
// lifetime stats moving as the player actually does things. Saving is deferred
// to run end / claims to avoid hammering storage mid-run.

function rs(key: string, n = 1): void {
  state.runStats[key] = (state.runStats[key] || 0) + n;
}

export function trackMerge(newTier: number): void {
  addStat('merges', 1);
  progressOrders('merges', 1);
  progressOrders('tier', 1, false, newTier);
  masteryAdd(newTier);
}

/** A Dropimal was dropped — counts toward its mastery (usage). */
export function trackDrop(tier: number): void {
  masteryAdd(tier);
}

export function trackFever(): void {
  rs('fevers');
  addStat('fevers', 1);
  progressOrders('fever', 1);
}

export function trackNudge(): void {
  rs('nudges');
  progressOrders('nudge', 1);
}

export function trackDiscovery(): void {
  addStat('discoveries', 1);
  progressOrders('discover', 1);
}
