import { state } from '../state';
import { cosmeticById } from './collection';

// Pure accessors that turn the player's equipped cosmetics into concrete colours
// the renderer and gameplay use. No rendering here, so both layers can import it.

export function equippedBg(): { c1: string; c2: string } {
  const c = cosmeticById(state.profile.equipped.bg);
  return { c1: c?.color ?? '#2b2566', c2: c?.color2 ?? '#0a1025' };
}

const PALETTES: Record<string, string[]> = {
  palette_neon:   ['#39ff14', '#00e5ff', '#ff00e5', '#faff00'],
  palette_pastel: ['#ffc8dd', '#bde0fe', '#caffbf', '#fdffb6'],
  palette_fire:   ['#ff7a3a', '#ff3a3a', '#ffd000', '#ff9e00'],
  palette_gold:   ['#ffd700', '#fff3a0', '#ffaa00', '#ffffff'],
};

/** Merge-burst colours, or null to use the merged Dropimal's own colour. */
export function mergePalette(): string[] | null {
  return PALETTES[state.profile.equipped.palette] ?? null;
}

const VICTORY: Record<string, string[]> = {
  victory_fireworks: ['#ff8fd6', '#66f7ff', '#fff06a'],
  victory_stars:     ['#fff06a', '#ffffff', '#ffd86a'],
  victory_galaxy:    ['#b28cff', '#66f7ff', '#ffffff'],
};

export function victoryPalette(): string[] | null {
  return VICTORY[state.profile.equipped.victory] ?? null;
}

export function trailColor(): string | null {
  if (state.profile.equipped.trail === 'trail_none') return null;
  return cosmeticById(state.profile.equipped.trail)?.color ?? null;
}

export function frameColor(): string | null {
  if (state.profile.equipped.frame === 'frame_none') return null;
  return cosmeticById(state.profile.equipped.frame)?.color ?? null;
}
