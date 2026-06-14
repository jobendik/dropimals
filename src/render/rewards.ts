import { ctx, roundRect } from './canvas';
import { state } from '../state';
import { GW } from '../constants';
import { clamp, formatScore } from '../utils/math';
import { drawTopBar, drawCoin, drawBadge } from './meta';
import {
  claimOrder, rerollDaily, claimDailyChest, claimWeeklyActivity,
  ACTIVITY_GOAL, totalClaimable,
} from '../meta/orders';
import {
  seasonLevel, seasonProgressFrac, eliteUnlocked, claimFree, claimElite,
  claimableSeason, freeReward, eliteReward, SEASON_TIERS, ELITE_UNLOCK,
} from '../meta/season';
import {
  byType, isOwned, equip, craftWithShards, cosmeticById,
  RARITY_COLOR, ownedCount, totalCosmetics,
} from '../meta/collection';
import { shopEntries, buyShop } from '../meta/shop';
import { currentEvent, challengeMod } from '../meta/events';
import {
  ACHIEVEMENTS, achievementValue, isComplete, isClaimed,
  claimAchievement, claimableAchievements,
} from '../meta/achievements';
import { getStat } from '../meta/stats';
import { startRun } from '../game/bodies';
import { saveProfile } from '../utils/storage';
import { sfxClick } from '../audio/audio';
import { MAX_TIER } from '../data/dropimals';
import type { CosmeticType, OrderState } from '../types';

interface Hit { x: number; y: number; w: number; h: number; fn: () => void; }
let hits: Hit[] = [];
let albumType: CosmeticType = 'bg';
let seasonPage = 0;

function reg(x: number, y: number, w: number, h: number, fn: () => void): void {
  hits.push({ x, y, w, h, fn });
}

function pill(x: number, y: number, w: number, h: number, label: string, fn: () => void, on = true, col = '#66f7ff'): void {
  ctx.save();
  ctx.globalAlpha = on ? 1 : 0.4;
  ctx.fillStyle = on ? col : 'rgba(255,255,255,.1)';
  roundRect(x, y, w, h, h / 2); ctx.fill();
  ctx.fillStyle = on ? '#06121f' : 'rgba(255,255,255,.5)';
  ctx.font = '1000 ' + Math.min(13, h - 9) + 'px ui-rounded, system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 0.5);
  ctx.restore();
  if (on) reg(x, y, w, h, fn);
}

const TABS: Array<['orders' | 'season' | 'collection' | 'shop' | 'stats', string]> = [
  ['orders', 'Orders'], ['season', 'Season'], ['collection', 'Album'], ['shop', 'Shop'], ['stats', 'Stats'],
];

export function drawRewards(): void {
  hits = [];
  drawTopBar();

  // Tab row
  const tw = (GW - 16) / TABS.length;
  for (let i = 0; i < TABS.length; i++) {
    const [id, label] = TABS[i];
    const x = 8 + i * tw;
    const active = state.hubTab === id;
    ctx.fillStyle = active ? 'rgba(102,247,255,.2)' : 'rgba(255,255,255,.06)';
    roundRect(x + 2, 58, tw - 4, 30, 9); ctx.fill();
    if (active) { ctx.strokeStyle = 'rgba(102,247,255,.6)'; ctx.lineWidth = 1.5; roundRect(x + 2, 58, tw - 4, 30, 9); ctx.stroke(); }
    ctx.fillStyle = active ? '#bdfdff' : 'rgba(255,255,255,.6)';
    ctx.font = '1000 12px ui-rounded, system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x + tw / 2, 73);
    const badge = id === 'orders' ? totalClaimable() : id === 'season' ? claimableSeason() : id === 'stats' ? claimableAchievements() : 0;
    drawBadge(x + tw - 10, 60, badge);
    reg(x + 2, 58, tw - 4, 30, () => { sfxClick(); state.hubTab = id; });
  }

  ctx.textBaseline = 'alphabetic';
  if (state.hubTab === 'orders') drawOrders();
  else if (state.hubTab === 'season') drawSeason();
  else if (state.hubTab === 'collection') drawAlbum();
  else if (state.hubTab === 'shop') drawShop();
  else drawStats();

  // Back button
  pill(GW / 2 - 60, 678, 120, 32, 'BACK', () => { sfxClick(); state.screen = 'menu'; });
}

// ── Orders tab ───────────────────────────────────────────────────────────────

function orderRow(o: OrderState, idx: number, scope: 'daily' | 'weekly', x: number, y: number, w: number): void {
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  roundRect(x, y, w, 36, 10); ctx.fill();

  ctx.fillStyle = o.claimed ? 'rgba(255,255,255,.4)' : '#fff';
  ctx.font = '800 11.5px ui-rounded, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(o.text, x + 10, y + 15);

  const frac = clamp(o.progress / o.goal, 0, 1);
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  roundRect(x + 10, y + 22, w - 150, 6, 3); ctx.fill();
  const g = ctx.createLinearGradient(x + 10, 0, x + w - 140, 0);
  g.addColorStop(0, '#66f7ff'); g.addColorStop(1, '#9dff74');
  ctx.fillStyle = o.done ? '#9dff74' : g;
  roundRect(x + 10, y + 22, (w - 150) * frac, 6, 3); ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,.6)';
  ctx.font = '800 10px ui-rounded, system-ui, sans-serif';
  ctx.fillText(Math.min(o.progress, o.goal) + '/' + o.goal, x + w - 134, y + 27);

  if (o.claimed) {
    ctx.fillStyle = '#9dff74'; ctx.font = '1000 12px ui-rounded, system-ui, sans-serif';
    ctx.textAlign = 'right'; ctx.fillText('CLAIMED', x + w - 12, y + 22);
  } else if (o.done) {
    pill(x + w - 66, y + 7, 58, 22, '+' + o.coins, () => { sfxClick(); claimOrder(scope, o.id); }, true, '#9dff74');
  } else if (scope === 'daily' && state.profile.dailyRerolls > 0) {
    pill(x + w - 40, y + 7, 32, 22, '↻', () => { sfxClick(); rerollDaily(idx); }, true, '#8d7aff');
  }
}

function drawOrders(): void {
  const p = state.profile;
  const ev = currentEvent();
  let y = 96;

  // Event banner
  ctx.fillStyle = 'rgba(0,0,0,.3)'; roundRect(12, y, GW - 24, 34, 10); ctx.fill();
  ctx.strokeStyle = ev.color; ctx.lineWidth = 1.2; roundRect(12, y, GW - 24, 34, 10); ctx.stroke();
  ctx.fillStyle = ev.color; ctx.font = '1000 11px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('TODAY · ' + ev.name, 22, y + 15);
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '800 10px ui-rounded, system-ui, sans-serif';
  ctx.fillText(ev.desc, 22, y + 28);
  y += 44;

  ctx.fillStyle = '#8ffbff'; ctx.font = '1000 12px ui-rounded, system-ui, sans-serif';
  ctx.fillText('DAILY ORDERS', 14, y + 2);
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = '800 10px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'right';
  ctx.fillText(p.dailyRerolls + ' reroll' + (p.dailyRerolls === 1 ? '' : 's'), GW - 14, y + 2);
  y += 10;
  p.dailyOrders.forEach((o, i) => { orderRow(o, i, 'daily', 12, y, GW - 24); y += 42; });

  // Daily chest meter
  ctx.fillStyle = 'rgba(255,255,255,.06)'; roundRect(12, y, GW - 24, 34, 10); ctx.fill();
  ctx.fillStyle = '#fff6a8'; ctx.font = '900 11px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Daily Chest', 22, y + 15);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; roundRect(22, y + 22, GW - 150, 7, 3.5); ctx.fill();
  ctx.fillStyle = '#fff6a8'; roundRect(22, y + 22, (GW - 150) * clamp(p.dailyChest / 100, 0, 1), 7, 3.5); ctx.fill();
  if (p.dailyChestClaimed) { ctx.fillStyle = '#9dff74'; ctx.font = '1000 11px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.fillText('CLAIMED', GW - 22, y + 20); }
  else if (p.dailyChest >= 100) pill(GW - 78, y + 7, 60, 22, 'OPEN', () => { sfxClick(); claimDailyChest(); }, true, '#fff6a8');
  else { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = '800 10px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.fillText(Math.floor(p.dailyChest) + '%', GW - 22, y + 20); }
  y += 44;

  ctx.fillStyle = '#8ffbff'; ctx.font = '1000 12px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('WEEKLY ORDERS', 14, y + 2);
  y += 10;
  p.weeklyOrders.forEach((o, i) => { orderRow(o, i, 'weekly', 12, y, GW - 24); y += 42; });

  // Weekly activity
  ctx.fillStyle = 'rgba(255,255,255,.06)'; roundRect(12, y, GW - 24, 36, 10); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '900 11px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Weekly Activity · play ' + ACTIVITY_GOAL + ' days', 22, y + 15);
  const days = p.activityDays.length;
  for (let i = 0; i < ACTIVITY_GOAL; i++) {
    ctx.fillStyle = i < days ? '#9dff74' : 'rgba(255,255,255,.18)';
    ctx.beginPath(); ctx.arc(28 + i * 18, y + 27, 6, 0, Math.PI * 2); ctx.fill();
  }
  if (p.activityClaimed) { ctx.fillStyle = '#9dff74'; ctx.font = '1000 11px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.fillText('CLAIMED', GW - 22, y + 22); }
  else if (days >= ACTIVITY_GOAL) pill(GW - 84, y + 8, 66, 22, 'CHEST', () => { sfxClick(); claimWeeklyActivity(); }, true, '#9dff74');
}

// ── Season tab ───────────────────────────────────────────────────────────────

function drawSeason(): void {
  const p = state.profile;
  const lvl = seasonLevel();
  let y = 100;

  ctx.fillStyle = '#fff'; ctx.font = '1000 18px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Season ' + (p.seasonId || '01'), 16, y);
  ctx.fillStyle = '#8ffbff'; ctx.font = '1000 14px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'right';
  ctx.fillText('Tier ' + lvl + '/' + SEASON_TIERS, GW - 16, y);
  y += 12;
  ctx.fillStyle = 'rgba(255,255,255,.12)'; roundRect(16, y, GW - 32, 8, 4); ctx.fill();
  const g = ctx.createLinearGradient(16, 0, GW - 16, 0); g.addColorStop(0, '#66f7ff'); g.addColorStop(1, '#ff8fd6');
  ctx.fillStyle = g; roundRect(16, y, (GW - 32) * seasonProgressFrac(), 8, 4); ctx.fill();
  y += 22;

  // Elite status
  const elite = eliteUnlocked();
  ctx.fillStyle = elite ? '#ffd86a' : 'rgba(255,255,255,.6)';
  ctx.font = '800 11px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(elite ? '★ Elite Track unlocked — claim all rewards!' : `Elite Track: complete ${ELITE_UNLOCK} weekly orders (${Math.min(p.seasonWeeklyDone, ELITE_UNLOCK)}/${ELITE_UNLOCK})`, 16, y);
  y += 16;

  // Tier columns (paged, 5 at a time)
  const perPage = 5;
  const maxPage = Math.max(0, Math.ceil(SEASON_TIERS / perPage) - 1);
  seasonPage = clamp(seasonPage, 0, maxPage);
  const start = seasonPage * perPage;
  const cw = (GW - 32) / perPage;

  for (let i = 0; i < perPage; i++) {
    const tier = start + i;
    if (tier >= SEASON_TIERS) break;
    const x = 16 + i * cw;
    const passed = tier < lvl;

    // tier number
    ctx.fillStyle = passed ? '#9dff74' : 'rgba(255,255,255,.5)';
    ctx.font = '1000 11px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('T' + (tier + 1), x + cw / 2, y + 12);

    // free reward cell
    const fr = freeReward(tier);
    const freeClaimed = p.seasonFreeClaimed.includes(tier);
    drawTierCell(x + 4, y + 18, cw - 8, 52, fr, passed && !freeClaimed, freeClaimed, '#8ffbff',
      () => { sfxClick(); claimFree(tier); });

    // elite reward cell
    const er = eliteReward(tier);
    const eliteClaimed = p.seasonEliteClaimed.includes(tier);
    drawTierCell(x + 4, y + 76, cw - 8, 52, er, elite && passed && !eliteClaimed, eliteClaimed, '#ffd86a',
      () => { sfxClick(); claimElite(tier); });
  }
  ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.font = '800 9px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('FREE', 16, y + 44); ctx.fillText('ELITE', 16, y + 102);

  // paging
  pill(GW / 2 - 92, y + 140, 80, 28, '‹ Prev', () => { sfxClick(); seasonPage = Math.max(0, seasonPage - 1); }, seasonPage > 0);
  pill(GW / 2 + 12, y + 140, 80, 28, 'Next ›', () => { sfxClick(); seasonPage = Math.min(maxPage, seasonPage + 1); }, seasonPage < maxPage);

  // claim all
  pill(GW / 2 - 70, y + 178, 140, 30, 'CLAIM ALL', () => {
    sfxClick();
    for (let t = 0; t < lvl; t++) { claimFree(t); if (elite) claimElite(t); }
  }, claimableSeason() > 0, '#9dff74');
}

function drawTierCell(x: number, y: number, w: number, h: number, r: { coins?: number; shards?: number; cosmetic?: string }, claimable: boolean, claimed: boolean, col: string, fn: () => void): void {
  ctx.fillStyle = claimable ? 'rgba(157,255,116,.16)' : 'rgba(255,255,255,.05)';
  roundRect(x, y, w, h, 8); ctx.fill();
  if (claimable) { ctx.strokeStyle = '#9dff74'; ctx.lineWidth = 1.5; roundRect(x, y, w, h, 8); ctx.stroke(); }

  ctx.textAlign = 'center';
  if (r.cosmetic) {
    const c = cosmeticById(r.cosmetic);
    ctx.fillStyle = c ? RARITY_COLOR[c.rarity] : col;
    ctx.beginPath(); ctx.arc(x + w / 2, y + 18, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 7.5px ui-rounded, system-ui, sans-serif';
    ctx.fillText((c?.name ?? '').slice(0, 9), x + w / 2, y + 36);
  } else {
    ctx.fillStyle = '#ffe9a8'; ctx.font = '1000 12px ui-rounded, system-ui, sans-serif';
    ctx.fillText('' + (r.coins ?? 0), x + w / 2, y + 22);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = '700 8px ui-rounded, system-ui, sans-serif';
    ctx.fillText('coins', x + w / 2, y + 33);
    if (r.shards) { ctx.fillStyle = '#bfeaff'; ctx.font = '800 9px ui-rounded, system-ui, sans-serif'; ctx.fillText('+' + r.shards + ' shard', x + w / 2, y + 45); }
  }
  if (claimed) { ctx.fillStyle = '#9dff74'; ctx.font = '1000 14px ui-rounded, system-ui, sans-serif'; ctx.fillText('✓', x + w / 2, y + h - 6); }
  if (claimable) reg(x, y, w, h, fn);
}

// ── Album (collection) tab ───────────────────────────────────────────────────

const ALBUM_TABS: Array<[CosmeticType, string]> = [
  ['bg', 'BG'], ['trail', 'Trail'], ['palette', 'Burst'], ['victory', 'Win'], ['frame', 'Frame'], ['title', 'Title'],
];

function drawAlbum(): void {
  let y = 98;
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = '800 10px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(ownedCount() + ' / ' + totalCosmetics() + ' collected', GW / 2, y);
  y += 8;

  const tw = (GW - 16) / ALBUM_TABS.length;
  for (let i = 0; i < ALBUM_TABS.length; i++) {
    const [t, label] = ALBUM_TABS[i];
    const x = 8 + i * tw;
    const active = albumType === t;
    ctx.fillStyle = active ? 'rgba(143,122,255,.3)' : 'rgba(255,255,255,.06)';
    roundRect(x + 2, y, tw - 4, 26, 8); ctx.fill();
    ctx.fillStyle = active ? '#dcd2ff' : 'rgba(255,255,255,.6)'; ctx.font = '900 10px ui-rounded, system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x + tw / 2, y + 13);
    reg(x + 2, y, tw - 4, 26, () => { sfxClick(); albumType = t; });
  }
  ctx.textBaseline = 'alphabetic';
  y += 36;

  const items = byType(albumType);
  const cols = 2, cellW = (GW - 24) / cols, cellH = 78;
  items.forEach((c, i) => {
    const cx = 12 + (i % cols) * cellW;
    const cy = y + Math.floor(i / cols) * (cellH + 8);
    const owned = isOwned(c.id);
    const isEq = state.profile.equipped[c.type] === c.id;
    const col = RARITY_COLOR[c.rarity];

    ctx.fillStyle = isEq ? 'rgba(102,247,255,.14)' : 'rgba(255,255,255,.05)';
    roundRect(cx, cy, cellW - 8, cellH, 12); ctx.fill();
    ctx.strokeStyle = isEq ? '#66f7ff' : col + '55'; ctx.lineWidth = isEq ? 2 : 1;
    roundRect(cx, cy, cellW - 8, cellH, 12); ctx.stroke();

    // swatch
    ctx.fillStyle = owned ? (c.color ?? col) : 'rgba(255,255,255,.12)';
    ctx.beginPath(); ctx.arc(cx + 26, cy + 28, 16, 0, Math.PI * 2); ctx.fill();

    ctx.textAlign = 'left';
    ctx.fillStyle = owned ? '#fff' : 'rgba(255,255,255,.4)';
    ctx.font = '1000 12px ui-rounded, system-ui, sans-serif';
    ctx.fillText(owned ? c.name : '???', cx + 50, cy + 22);
    ctx.fillStyle = col; ctx.font = '800 9px ui-rounded, system-ui, sans-serif';
    ctx.fillText(c.rarity.toUpperCase(), cx + 50, cy + 36);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.font = '700 8.5px ui-rounded, system-ui, sans-serif';
    ctx.fillText(c.source, cx + 50, cy + 50);

    if (isEq) {
      ctx.fillStyle = '#66f7ff'; ctx.font = '1000 10px ui-rounded, system-ui, sans-serif';
      ctx.fillText('EQUIPPED', cx + 12, cy + cellH - 10);
    } else if (owned) {
      pill(cx + 12, cy + cellH - 24, 70, 18, 'EQUIP', () => { sfxClick(); equip(c.type, c.id); }, true, '#66f7ff');
    } else if (c.shardCost > 0) {
      const can = state.profile.shards >= c.shardCost;
      pill(cx + 12, cy + cellH - 24, 88, 18, c.shardCost + ' shards', () => { sfxClick(); craftWithShards(c.id); }, can, '#7fdcff');
    } else {
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = '700 8.5px ui-rounded, system-ui, sans-serif';
      ctx.fillText('Find in chests / shop', cx + 12, cy + cellH - 12);
    }
  });
}

// ── Shop tab ─────────────────────────────────────────────────────────────────

function drawShop(): void {
  let y = 100;
  ctx.fillStyle = '#fff'; ctx.font = '1000 15px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Daily Shop', 16, y);
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = '800 9px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'right';
  ctx.fillText('Rotates daily · items can return', GW - 16, y);
  y += 12;

  const entries = shopEntries();
  entries.forEach((e) => {
    const c = cosmeticById(e.id)!;
    const col = RARITY_COLOR[e.rarity];
    ctx.fillStyle = 'rgba(255,255,255,.05)'; roundRect(16, y, GW - 32, 56, 12); ctx.fill();
    ctx.strokeStyle = col + '55'; ctx.lineWidth = 1; roundRect(16, y, GW - 32, 56, 12); ctx.stroke();

    ctx.fillStyle = c.color ?? col; ctx.beginPath(); ctx.arc(44, y + 28, 16, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff'; ctx.font = '1000 13px ui-rounded, system-ui, sans-serif';
    ctx.fillText(c.name, 70, y + 24);
    ctx.fillStyle = col; ctx.font = '800 9px ui-rounded, system-ui, sans-serif';
    ctx.fillText(e.rarity.toUpperCase() + ' ' + c.type, 70, y + 40);

    if (e.owned || e.sold) {
      ctx.fillStyle = '#9dff74'; ctx.font = '1000 12px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(e.owned ? 'OWNED' : 'SOLD', GW - 28, y + 32);
    } else {
      const can = state.profile.coins >= e.price;
      drawCoin(GW - 150, y + 28, 7);
      ctx.fillStyle = '#ffe9a8'; ctx.font = '1000 13px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(formatScore(e.price), GW - 138, y + 33);
      pill(GW - 86, y + 17, 60, 24, 'BUY', () => { sfxClick(); buyShop(e.id); }, can, '#ffce4d');
    }
    y += 64;
  });

  // Daily Challenge card
  const m = challengeMod();
  const p = state.profile;
  y += 4;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; roundRect(16, y, GW - 32, 76, 14); ctx.fill();
  ctx.strokeStyle = m.color; ctx.lineWidth = 1.5; roundRect(16, y, GW - 32, 76, 14); ctx.stroke();
  ctx.fillStyle = m.color; ctx.font = '1000 13px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('DAILY CHALLENGE · ' + m.name, 28, y + 22);
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '800 10px ui-rounded, system-ui, sans-serif';
  ctx.fillText(m.desc + ' · one life', 28, y + 38);
  ctx.fillStyle = '#fff6a8'; ctx.font = '900 11px ui-rounded, system-ui, sans-serif';
  ctx.fillText("Today's best: " + formatScore(p.challengeScore), 28, y + 56);
  pill(GW - 116, y + 26, 92, 30, 'PLAY', () => { sfxClick(); startRun(true); }, true, m.color);
}

// ── Stats tab ────────────────────────────────────────────────────────────────

function drawStats(): void {
  let y = 92;
  // Reduced-motion accessibility toggle (doc §28 guardrail).
  const rm = state.profile.reducedMotion;
  pill(GW / 2 - 92, y, 184, 24, 'Reduced motion: ' + (rm ? 'ON' : 'OFF'),
    () => { sfxClick(); state.profile.reducedMotion = !rm; saveProfile(); }, true, rm ? '#9dff74' : '#8d7aff');
  y += 32;
  const rows: Array<[string, string]> = [
    ['Games played', formatScore(getStat('games'))],
    ['Total merges', formatScore(getStat('merges'))],
    ['Best score', formatScore(Math.max(getStat('bestScore'), state.profile.highScore))],
    ['Biggest tier', String(Math.min(MAX_TIER + 1, getStat('bestTier') + 1))],
    ['Fevers', formatScore(getStat('fevers'))],
    ['Chests opened', formatScore(getStat('chestsOpened'))],
  ];
  ctx.fillStyle = 'rgba(255,255,255,.06)'; roundRect(12, y, GW - 24, 88, 12); ctx.fill();
  rows.forEach(([k, v], i) => {
    const cx = 24 + (i % 2) * ((GW - 48) / 2);
    const cy = y + 24 + Math.floor(i / 2) * 26;
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = '800 10px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(k, cx, cy);
    ctx.fillStyle = '#8ffbff'; ctx.font = '1000 12px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(v, cx + (GW - 48) / 2 - 16, cy);
  });
  y += 100;

  ctx.fillStyle = '#fff6a8'; ctx.font = '1000 12px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('ACHIEVEMENTS', 14, y);
  y += 8;

  ACHIEVEMENTS.forEach((a) => {
    const val = achievementValue(a);
    const done = isComplete(a);
    const claimed = isClaimed(a);
    ctx.fillStyle = 'rgba(255,255,255,.05)'; roundRect(12, y, GW - 24, 30, 9); ctx.fill();
    ctx.fillStyle = claimed ? 'rgba(255,255,255,.45)' : '#fff'; ctx.font = '900 10.5px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(a.name, 22, y + 13);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = '700 8.5px ui-rounded, system-ui, sans-serif';
    ctx.fillText(a.desc, 22, y + 25);

    ctx.textAlign = 'right';
    if (claimed) { ctx.fillStyle = '#9dff74'; ctx.font = '1000 10px ui-rounded, system-ui, sans-serif'; ctx.fillText('DONE', GW - 22, y + 19); }
    else if (done) pill(GW - 78, y + 5, 60, 20, 'CLAIM', () => { sfxClick(); claimAchievement(a.id); }, true, '#ffd86a');
    else { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = '800 9px ui-rounded, system-ui, sans-serif'; ctx.fillText(formatScore(Math.min(val, a.goal)) + '/' + formatScore(a.goal), GW - 22, y + 19); }
    y += 34;
  });
}

/** Route a tap inside the Rewards hub. Returns true if it hit something. */
export function handleRewardsClick(p: { x: number; y: number }): boolean {
  for (let i = hits.length - 1; i >= 0; i--) {
    const h = hits[i];
    if (p.x >= h.x && p.x <= h.x + h.w && p.y >= h.y && p.y <= h.y + h.h) { h.fn(); return true; }
  }
  return false;
}
