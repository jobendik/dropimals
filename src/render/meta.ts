import { ctx, roundRect } from './canvas';
import { state } from '../state';
import { GW, GH } from '../constants';
import { clamp, formatScore } from '../utils/math';
import { xpForLevel, titleForLevel } from '../meta/profile';
import { RARITY_COLOR, cosmeticById } from '../meta/collection';
import { CHEST_TABLE } from '../meta/chests';
import type { Rarity } from '../types';

// ── Small shared widgets ─────────────────────────────────────────────────────

export function drawCoin(x: number, y: number, r = 8): void {
  ctx.save();
  ctx.fillStyle = '#ffce4d';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8a013';
  ctx.beginPath(); ctx.arc(x, y, r * 0.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawShard(x: number, y: number, r = 8): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#7fdcff';
  ctx.beginPath();
  ctx.moveTo(0, -r); ctx.lineTo(r * 0.7, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.7, 0);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath();
  ctx.moveTo(0, -r); ctx.lineTo(r * 0.7, 0); ctx.lineTo(0, 0);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

/** Red notification dot with a count. */
export function drawBadge(x: number, y: number, count: number): void {
  if (count <= 0) return;
  ctx.save();
  ctx.fillStyle = '#ff4d6d';
  ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '1000 11px ui-rounded, system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(Math.min(99, count)), x, y + 0.5);
  ctx.restore();
}

/** Top bar: account level + title + XP bar, coins, shards. Used on menu/hub. */
export function drawTopBar(): void {
  const p = state.profile;
  ctx.save();
  ctx.textBaseline = 'alphabetic';

  // Level badge
  const band = titleForLevel(p.level);
  ctx.fillStyle = 'rgba(0,0,0,.34)';
  roundRect(12, 12, 168, 38, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(143,251,255,.35)'; ctx.lineWidth = 1; roundRect(12, 12, 168, 38, 12); ctx.stroke();

  ctx.fillStyle = '#8ffbff';
  ctx.font = '1000 16px ui-rounded, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Lv ' + p.level, 22, 32);
  ctx.fillStyle = 'rgba(255,255,255,.8)';
  ctx.font = '800 10px ui-rounded, system-ui, sans-serif';
  ctx.fillText(band.name, 60, 31);

  // XP bar
  const frac = clamp(p.xp / xpForLevel(p.level), 0, 1);
  ctx.fillStyle = 'rgba(255,255,255,.14)';
  roundRect(60, 38, 110, 6, 3); ctx.fill();
  const g = ctx.createLinearGradient(60, 0, 170, 0);
  g.addColorStop(0, '#66f7ff'); g.addColorStop(1, '#ff8fd6');
  ctx.fillStyle = g;
  roundRect(60, 38, 110 * frac, 6, 3); ctx.fill();

  // Currencies (right side): shards then coins.
  ctx.textAlign = 'left';
  drawShard(GW - 200, 30, 8);
  ctx.fillStyle = '#bfeaff';
  ctx.font = '1000 15px ui-rounded, system-ui, sans-serif';
  ctx.fillText(formatScore(p.shards), GW - 188, 35);

  drawCoin(GW - 116, 30, 8);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = '1000 15px ui-rounded, system-ui, sans-serif';
  ctx.fillText(formatScore(p.coins), GW - 104, 35);
  ctx.restore();
}

// ── Toasts ───────────────────────────────────────────────────────────────────

export function drawToasts(): void {
  if (!state.toasts.length) return;
  ctx.save();
  ctx.textAlign = 'center';
  let y = 60;
  for (const t of state.toasts) {
    const inT = clamp(t.age / 0.25, 0, 1);
    const outT = clamp((t.life - t.age) / 0.4, 0, 1);
    const a = Math.min(inT, outT);
    if (a <= 0) continue;
    ctx.globalAlpha = a;
    const w = 260, h = t.sub ? 46 : 34, x = GW / 2 - w / 2;
    ctx.fillStyle = 'rgba(10,14,34,.92)';
    roundRect(x, y, w, h, 14); ctx.fill();
    ctx.strokeStyle = t.color; ctx.lineWidth = 1.5; roundRect(x, y, w, h, 14); ctx.stroke();

    ctx.fillStyle = t.color;
    ctx.font = '1000 14px ui-rounded, system-ui, sans-serif';
    ctx.fillText(t.text, GW / 2, y + (t.sub ? 20 : 22));
    if (t.sub) {
      ctx.fillStyle = 'rgba(255,255,255,.82)';
      ctx.font = '800 11px ui-rounded, system-ui, sans-serif';
      ctx.fillText(t.sub, GW / 2, y + 37);
    }
    y += h + 8;
  }
  ctx.restore();
}

// ── Celebration overlays (level-up, chest reveal) ────────────────────────────

const RARITY_NAME: Record<Rarity, string> = {
  common: 'COMMON', rare: 'RARE', epic: 'EPIC', mythic: 'MYTHIC',
};

export function drawOverlay(): void {
  const o = state.overlay;
  if (!o) return;
  ctx.save();
  ctx.fillStyle = 'rgba(6,8,22,.82)';
  ctx.fillRect(0, 0, GW, GH);

  const pop = clamp(o.age / 0.3, 0, 1);
  const scale = 0.6 + pop * 0.4 + Math.sin(Math.min(o.age, 0.3) * 10) * 0.02 * (1 - pop);
  ctx.translate(GW / 2, GH / 2 - 30);
  ctx.scale(scale, scale);
  ctx.textAlign = 'center';

  if (o.kind === 'levelup') {
    ctx.fillStyle = 'rgba(20,26,54,.96)';
    roundRect(-150, -120, 300, 240, 26); ctx.fill();
    const g = ctx.createLinearGradient(-150, 0, 150, 0);
    g.addColorStop(0, '#66f7ff'); g.addColorStop(1, '#ff8fd6');
    ctx.strokeStyle = '#66f7ff'; ctx.lineWidth = 2.5; roundRect(-150, -120, 300, 240, 26); ctx.stroke();

    ctx.fillStyle = '#fff6a8';
    ctx.font = '1000 30px ui-rounded, system-ui, sans-serif';
    ctx.fillText('LEVEL UP!', 0, -64);
    ctx.fillStyle = '#fff';
    ctx.font = '1000 64px ui-rounded, system-ui, sans-serif';
    ctx.fillText(String(o.level ?? 1), 0, 14);
    ctx.fillStyle = '#8ffbff';
    ctx.font = '900 16px ui-rounded, system-ui, sans-serif';
    ctx.fillText(o.title ?? '', 0, 48);
    if (o.newTitle) {
      ctx.fillStyle = '#9dff74';
      ctx.font = '800 12px ui-rounded, system-ui, sans-serif';
      ctx.fillText('New title unlocked!', 0, 70);
    }
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.font = '800 11px ui-rounded, system-ui, sans-serif';
    ctx.fillText('Tap to continue', 0, 102);
  } else if (o.kind === 'chest' && o.reward) {
    const r = o.reward;
    const col = RARITY_COLOR[r.rarity];
    ctx.fillStyle = 'rgba(20,26,54,.96)';
    roundRect(-150, -140, 300, 280, 26); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 2.5; roundRect(-150, -140, 300, 280, 26); ctx.stroke();

    ctx.fillStyle = col;
    ctx.font = '1000 14px ui-rounded, system-ui, sans-serif';
    ctx.fillText(RARITY_NAME[r.rarity] + ' CHEST', 0, -104);

    // Chest lid lifts as it opens.
    const lift = clamp((o.age - 0.2) * 3, 0, 1);
    ctx.save();
    ctx.translate(0, -40);
    ctx.fillStyle = '#caa24a';
    roundRect(-46, -8, 92, 46, 8); ctx.fill();
    ctx.save();
    ctx.translate(0, -lift * 26);
    ctx.rotate(-lift * 0.25);
    ctx.fillStyle = col;
    roundRect(-50, -26, 100, 22, 7); ctx.fill();
    ctx.restore();
    ctx.restore();

    let yy = 24;
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '1000 18px ui-rounded, system-ui, sans-serif';
    ctx.fillText('+' + r.coins + ' coins', 0, yy); yy += 26;
    if (r.shards) { ctx.fillStyle = '#bfeaff'; ctx.fillText('+' + r.shards + ' shards', 0, yy); yy += 26; }
    if (r.cosmetic) {
      const c = cosmeticById(r.cosmetic);
      ctx.fillStyle = col;
      ctx.font = '1000 16px ui-rounded, system-ui, sans-serif';
      ctx.fillText('New: ' + (c?.name ?? 'cosmetic'), 0, yy); yy += 24;
    }
    // Transparent odds (doc §9.2).
    if (o.chestKind) {
      ctx.fillStyle = 'rgba(255,255,255,.4)';
      ctx.font = '700 8.5px ui-rounded, system-ui, sans-serif';
      ctx.fillText(oddsLine(o.chestKind), 0, 100);
    }
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.font = '800 11px ui-rounded, system-ui, sans-serif';
    ctx.fillText('Tap to continue', 0, 118);
  }
  ctx.restore();
}

/** Odds string for a chest kind, for the chest UI. */
export function oddsLine(kind: keyof typeof CHEST_TABLE): string {
  const o = CHEST_TABLE[kind].rarity;
  return `C ${Math.round(o.common * 100)}% · R ${Math.round(o.rare * 100)}% · E ${Math.round(o.epic * 100)}% · M ${Math.round(o.mythic * 100)}%`;
}
