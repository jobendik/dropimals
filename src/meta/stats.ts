import { state } from '../state';

// Flat lifetime counters keyed by name. Achievements read these; the pipeline
// and various systems write them. Kept dependency-free to avoid import cycles.

export function addStat(key: string, n = 1): void {
  state.profile.stats[key] = (state.profile.stats[key] || 0) + n;
}

export function getStat(key: string): number {
  return state.profile.stats[key] || 0;
}

export function bumpStatMax(key: string, v: number): void {
  state.profile.stats[key] = Math.max(getStat(key), v);
}
