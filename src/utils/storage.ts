import { state } from '../state';
import { DROPIMALS } from '../data/dropimals';
import type { Profile } from '../types';

const KEY = 'dropimals_profile_v2';
const LEGACY_SCORE_KEY = 'dropimals_high_score';

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
    const raw = localStorage.getItem(KEY);
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
      if (Array.isArray(saved.discovered)) {
        for (let i = 0; i < DROPIMALS.length; i++) p.discovered[i] = Boolean(saved.discovered[i]);
      }
    } else {
      // Migrate the old prototype's high score if present.
      p.highScore = Number(localStorage.getItem(LEGACY_SCORE_KEY) || 0);
    }
  } catch {
    // storage unavailable — play with defaults
  }
}

export function saveProfile(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state.profile));
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
