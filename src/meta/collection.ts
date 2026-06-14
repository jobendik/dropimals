import { state } from '../state';
import { saveProfile } from '../utils/storage';
import { pushToast } from './notify';
import { TITLE_BANDS } from './profile';
import type { CosmeticDef, CosmeticType, Rarity } from '../types';

// The full cosmetic catalog. Everything here is earnable through play — chests,
// the rotating shop, the season track, achievements, or shard crafting. Each
// cosmetic actually changes how the game looks (see render/cosmetics.ts).

export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#9fb3c8',
  rare:   '#6fd0ff',
  epic:   '#c08bff',
  mythic: '#ffd86a',
};

export const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'mythic'];

export const COSMETICS: CosmeticDef[] = [
  // ── Backgrounds (jar / scene gradient) ──
  { id: 'bg_default', type: 'bg', name: 'Midnight', rarity: 'common', source: 'Starter', shardCost: 0, color: '#2b2566', color2: '#0a1025' },
  { id: 'bg_sunset',  type: 'bg', name: 'Sunset Bay', rarity: 'rare', source: 'Chest / Shop', shardCost: 0, color: '#5a2a6e', color2: '#2a0e2e' },
  { id: 'bg_forest',  type: 'bg', name: 'Deep Forest', rarity: 'rare', source: 'Chest / Shop', shardCost: 0, color: '#1d4a3a', color2: '#06140f' },
  { id: 'bg_candy',   type: 'bg', name: 'Cotton Candy', rarity: 'epic', source: 'Chest / Season', shardCost: 0, color: '#7a3a8e', color2: '#2a1640' },
  { id: 'bg_aurora',  type: 'bg', name: 'Aurora', rarity: 'epic', source: 'Chest / Season', shardCost: 0, color: '#114a5a', color2: '#06122a' },
  { id: 'bg_galaxy',  type: 'bg', name: 'Galaxy Core', rarity: 'mythic', source: 'Shard craft (40)', shardCost: 40, color: '#3a1a6e', color2: '#08001a' },

  // ── Drop trails (streak behind the held/falling Dropimal) ──
  { id: 'trail_none',    type: 'trail', name: 'No Trail', rarity: 'common', source: 'Starter', shardCost: 0 },
  { id: 'trail_sparkle', type: 'trail', name: 'Sparkle', rarity: 'rare', source: 'Chest / Shop', shardCost: 0, color: '#fff6a8' },
  { id: 'trail_bubble',  type: 'trail', name: 'Bubbles', rarity: 'rare', source: 'Chest / Shop', shardCost: 0, color: '#8ffbff' },
  { id: 'trail_comet',   type: 'trail', name: 'Comet', rarity: 'epic', source: 'Chest / Season', shardCost: 0, color: '#ff8fd6' },
  { id: 'trail_rainbow', type: 'trail', name: 'Rainbow', rarity: 'mythic', source: 'Shard craft (40)', shardCost: 40, color: '#ffffff' },

  // ── Merge-burst palettes (particle colours on every merge) ──
  { id: 'palette_default', type: 'palette', name: 'Classic', rarity: 'common', source: 'Starter', shardCost: 0 },
  { id: 'palette_neon',    type: 'palette', name: 'Neon', rarity: 'rare', source: 'Chest / Shop', shardCost: 0, color: '#39ff14' },
  { id: 'palette_pastel',  type: 'palette', name: 'Pastel', rarity: 'rare', source: 'Chest / Shop', shardCost: 0, color: '#ffc8dd' },
  { id: 'palette_fire',    type: 'palette', name: 'Ember', rarity: 'epic', source: 'Chest / Season', shardCost: 0, color: '#ff7a3a' },
  { id: 'palette_gold',    type: 'palette', name: 'Goldburst', rarity: 'mythic', source: 'Shard craft (40)', shardCost: 40, color: '#ffd700' },

  // ── Victory effects (end-of-run / new-best flourish) ──
  { id: 'victory_default',   type: 'victory', name: 'Confetti Pop', rarity: 'common', source: 'Starter', shardCost: 0 },
  { id: 'victory_fireworks', type: 'victory', name: 'Fireworks', rarity: 'rare', source: 'Chest / Shop', shardCost: 0, color: '#ff8fd6' },
  { id: 'victory_stars',     type: 'victory', name: 'Star Rain', rarity: 'epic', source: 'Chest / Season', shardCost: 0, color: '#fff06a' },
  { id: 'victory_galaxy',    type: 'victory', name: 'Supernova', rarity: 'mythic', source: 'Shard craft (60)', shardCost: 60, color: '#b28cff' },

  // ── Score frames (HUD score plate accent) ──
  { id: 'frame_none',  type: 'frame', name: 'Plain', rarity: 'common', source: 'Starter', shardCost: 0 },
  { id: 'frame_gold',  type: 'frame', name: 'Gold Trim', rarity: 'rare', source: 'Chest / Shop', shardCost: 0, color: '#ffd86a' },
  { id: 'frame_neon',  type: 'frame', name: 'Neon Edge', rarity: 'epic', source: 'Chest / Season', shardCost: 0, color: '#66f7ff' },
  { id: 'frame_royal', type: 'frame', name: 'Royal', rarity: 'mythic', source: 'Shard craft (60)', shardCost: 60, color: '#c08bff' },
];

// Titles from the level bands plus a few earned through completion / achievements.
const EXTRA_TITLES: CosmeticDef[] = [
  { id: 'title_collector', type: 'title', name: 'Collector', rarity: 'epic', source: 'Own 12 cosmetics', shardCost: 0, color: '#c08bff' },
  { id: 'title_completionist', type: 'title', name: 'Completionist', rarity: 'mythic', source: 'Own every cosmetic', shardCost: 0, color: '#ffd86a' },
  { id: 'title_centurion', type: 'title', name: 'Centurion', rarity: 'epic', source: 'Play 100 games', shardCost: 0, color: '#6fd0ff' },
  { id: 'title_zookeeper', type: 'title', name: 'Zookeeper', rarity: 'rare', source: 'Complete the Dropidex', shardCost: 0, color: '#9dff74' },
  { id: 'title_grandmaster', type: 'title', name: 'Grandmaster', rarity: 'mythic', source: 'Max every Mastery', shardCost: 0, color: '#ffd86a' },
];

for (const b of TITLE_BANDS) {
  COSMETICS.push({ id: b.id, type: 'title', name: b.name, rarity: 'common', source: 'Reach level ' + b.min, shardCost: 0 });
}
COSMETICS.push(...EXTRA_TITLES);

const BY_ID = new Map(COSMETICS.map(c => [c.id, c]));
export function cosmeticById(id: string): CosmeticDef | undefined { return BY_ID.get(id); }

export function byType(type: CosmeticType): CosmeticDef[] {
  return COSMETICS.filter(c => c.type === type);
}

export function isOwned(id: string): boolean {
  return state.profile.owned.includes(id);
}

/** Grant a cosmetic; returns true if newly owned. */
export function ownCosmetic(id: string): boolean {
  if (isOwned(id)) return false;
  state.profile.owned.push(id);
  checkCompletionTitles();
  return true;
}

export function equip(type: CosmeticType, id: string): void {
  if (!isOwned(id)) return;
  state.profile.equipped[type] = id;
  saveProfile();
}

export function equipped(type: CosmeticType): CosmeticDef {
  const id = state.profile.equipped[type];
  return cosmeticById(id) ?? COSMETICS.find(c => c.type === type)!;
}

/** Cosmetics a chest can hand out directly (no shard-craft-only items). */
export function droppablePool(rarity: Rarity): CosmeticDef[] {
  return COSMETICS.filter(c =>
    c.rarity === rarity && c.shardCost === 0 && c.type !== 'title' && !isOwned(c.id));
}

/** Spend accumulated shards to craft a chase cosmetic. */
export function craftWithShards(id: string): boolean {
  const c = cosmeticById(id);
  if (!c || c.shardCost <= 0 || isOwned(id)) return false;
  if (state.profile.shards < c.shardCost) return false;
  state.profile.shards -= c.shardCost;
  ownCosmetic(id);
  pushToast('Crafted ' + c.name + '!', { icon: 'star', color: RARITY_COLOR[c.rarity] });
  saveProfile();
  return true;
}

/** Award completion-based titles (called whenever ownership changes). */
export function checkCompletionTitles(): void {
  const p = state.profile;
  const ownedCount = p.owned.filter(id => cosmeticById(id)?.type !== 'title').length;
  if (ownedCount >= 12 && !p.owned.includes('title_collector')) {
    p.owned.push('title_collector');
    pushToast('Title unlocked: Collector', { icon: 'star', color: '#c08bff' });
  }
  const allNonTitle = COSMETICS.filter(c => c.type !== 'title');
  if (allNonTitle.every(c => p.owned.includes(c.id)) && !p.owned.includes('title_completionist')) {
    p.owned.push('title_completionist');
    pushToast('Title unlocked: Completionist!', { icon: 'star', color: '#ffd86a' });
  }
}

export function ownedCount(): number {
  return state.profile.owned.filter(id => cosmeticById(id)).length;
}

export function totalCosmetics(): number {
  return COSMETICS.length;
}
