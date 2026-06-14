import { state } from '../state';
import { saveProfile } from '../utils/storage';
import { addCoins } from './economy';
import { ownCosmetic, isOwned, cosmeticById, COSMETICS } from './collection';
import { pushToast } from './notify';
import { dayId, hashStr, seededRng, pickDistinct } from './time';
import type { Rarity } from '../types';

// A rotating storefront of cosmetics bought with earned coins (doc §10.3 / §18.3).
// Rotates daily; items can return later; no fake stock.
export const SHOP_PRICE: Record<Rarity, number> = {
  common: 350, rare: 900, epic: 2200, mythic: 5000,
};

/** Cosmetics the shop can sell: priced, non-title, non-shard-craft. */
function eligible() {
  return COSMETICS.filter(c => c.shardCost === 0 && c.type !== 'title');
}

export function ensureShop(): void {
  const p = state.profile;
  const today = dayId();
  if (p.shopDay === today && p.shopOffer.length) return;
  p.shopDay = today;
  p.shopBought = [];
  const rng = seededRng(hashStr('shop' + today));
  // Prefer items the player doesn't own yet, but keep the slots full either way.
  const pool = eligible();
  const unowned = pool.filter(c => !isOwned(c.id));
  const picks = pickDistinct(unowned.length >= 4 ? unowned : pool, 4, rng);
  p.shopOffer = picks.map(c => c.id);
  saveProfile();
}

export interface ShopEntry { id: string; price: number; rarity: Rarity; name: string; sold: boolean; owned: boolean; }

export function shopEntries(): ShopEntry[] {
  return state.profile.shopOffer.map(id => {
    const c = cosmeticById(id)!;
    return {
      id,
      price: SHOP_PRICE[c.rarity],
      rarity: c.rarity,
      name: c.name,
      sold: state.profile.shopBought.includes(id),
      owned: isOwned(id),
    };
  });
}

export function buyShop(id: string): boolean {
  const p = state.profile;
  const c = cosmeticById(id);
  if (!c || isOwned(id) || p.shopBought.includes(id)) return false;
  const price = SHOP_PRICE[c.rarity];
  if (p.coins < price) return false;
  addCoins(-price);
  ownCosmetic(id);
  p.shopBought.push(id);
  pushToast('Purchased ' + c.name + '!', { icon: 'check', color: '#9dff74' });
  saveProfile();
  return true;
}
