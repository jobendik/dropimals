import { state } from '../state';
import { DROPIMALS } from '../data/dropimals';
import { cgData } from '../platform/crazygames';
import type { Profile } from '../types';

const KEY = 'dropimals_profile_v2';
const LEGACY_SCORE_KEY = 'dropimals_high_score';

// Persist through the CrazyGames data module (cloud-synced to the player's
// account when signed in) AND localStorage. Reads prefer the data module and
// fall back to localStorage, so cloud saves win while older localStorage-only
// progress (e.g. on the GitHub Pages build) is never stranded.
function kvGet(key: string): string | null {
  const d = cgData();
  if (d) {
    try {
      const v = d.getItem(key);
      if (v !== null) return v;
    } catch { /* fall through to localStorage */ }
  }
  try { return localStorage.getItem(key); } catch { return null; }
}

function kvSet(key: string, value: string): void {
  const d = cgData();
  if (d) { try { d.setItem(key, value); } catch { /* keep going */ } }
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

/** Parse a saved 0..1 volume, falling back to `def` when missing/invalid. */
function vol(raw: unknown, def: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : def;
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function yesterdayString(): string {
  const d = new Date(Date.now() - 86_400_000);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function loadProfile(): void {
  const p = state.profile;
  try {
    const raw = kvGet(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Profile>;
      p.highScore   = Number(saved.highScore) || 0;
      p.streak      = Number(saved.streak) || 0;
      p.lastDay     = String(saved.lastDay || '');
      p.games       = Number(saved.games) || 0;
      p.totalMerges = Number(saved.totalMerges) || 0;
      p.biggestTier = Number(saved.biggestTier) || 0;
      p.muted       = Boolean(saved.muted);
      p.musicMuted  = Boolean(saved.musicMuted);
      p.sfxVolume   = vol(saved.sfxVolume, 1);
      p.musicVolume = vol(saved.musicVolume, 0.3);
      if (Array.isArray(saved.discovered)) {
        for (let i = 0; i < DROPIMALS.length; i++) p.discovered[i] = Boolean(saved.discovered[i]);
      }
    } else {
      // Migrate the old prototype's high score if present.
      p.highScore = Number(kvGet(LEGACY_SCORE_KEY) || 0);
    }
  } catch {
    // storage unavailable — play with defaults
  }
}

export function saveProfile(): void {
  try {
    kvSet(KEY, JSON.stringify(state.profile));
  } catch {
    // storage unavailable — ignore
  }
}

/**
 * Called when a run starts. Advances the daily streak and returns true
 * if this is the first game of a new day (streak day earned).
 */
export function touchDailyStreak(): boolean {
  const p = state.profile;
  const today = todayString();
  if (p.lastDay === today) return false;

  p.streak = p.lastDay === yesterdayString() ? p.streak + 1 : 1;
  p.lastDay = today;
  saveProfile();
  return true;
}

export function commitScore(): void {
  const p = state.profile;
  if (state.score > p.highScore) p.highScore = state.score;
  if (state.bestTier > p.biggestTier) p.biggestTier = state.bestTier;
  saveProfile();
}
