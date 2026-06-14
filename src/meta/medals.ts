import { state } from '../state';
import { MAX_TIER } from '../data/dropimals';
import type { MedalDef } from '../types';

// In-run medals (doc §14.1): feats detected at run end, surfaced on the result
// screen with a small XP/coin kicker. Short-term dopamine on top of the score.
interface MedalRule extends MedalDef {
  test: () => boolean;
}

function rs(key: string): number { return state.runStats[key] || 0; }

const MEDALS: MedalRule[] = [
  { id: 'record',   name: 'Record Breaker', desc: 'Beat your best score', coins: 100, xp: 200, test: () => state.score > state.prevBest && state.prevBest > 0 },
  { id: 'whale',    name: 'Whale Watcher',  desc: 'Made a Luna Whale',    coins: 120, xp: 250, test: () => state.bestTier >= MAX_TIER },
  { id: 'apex',     name: 'Apex Tamer',     desc: 'Reached a Star Lion',  coins: 70,  xp: 140, test: () => state.bestTier >= MAX_TIER - 1 },
  { id: 'combo',    name: 'Combo Master',   desc: 'Hit a x8 combo',       coins: 60,  xp: 130, test: () => state.maxCombo >= 8 },
  { id: 'fever',    name: 'Fever Fanatic',  desc: '3 Fevers in one run',  coins: 60,  xp: 130, test: () => rs('fevers') >= 3 },
  { id: 'merger',   name: 'Merge Machine',  desc: '30 merges in a run',   coins: 50,  xp: 110, test: () => state.merges >= 30 },
  { id: 'explorer', name: 'Explorer',       desc: 'Discovered a new Dropimal', coins: 50, xp: 100, test: () => state.runDiscoveries.length > 0 },
  { id: 'comeback', name: 'Comeback Kid',   desc: 'Beat your best after a revive', coins: 150, xp: 300, test: () => state.reviveUsed && state.score > state.prevBest && state.prevBest > 0 },
  { id: 'marathon', name: 'Marathoner',     desc: 'Dropped 50 Dropimals', coins: 50,  xp: 110, test: () => state.drops >= 50 },
];

/** All medals earned by the just-finished run. */
export function detectMedals(): MedalDef[] {
  return MEDALS.filter(m => {
    try { return m.test(); } catch { return false; }
  }).map(({ test: _t, ...d }) => d);
}
