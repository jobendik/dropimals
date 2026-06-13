import { ctx, roundRect } from './canvas';
import { state } from '../state';
import { DROPIMALS, MAX_TIER } from '../data/dropimals';
import { BTN, GW, COMBO_WINDOW, FEVER_TIME } from '../constants';
import { format, clamp } from '../utils/math';
import { drawDropimalIcon } from './animals';
import { getMissionProgress } from '../game/missions';
import type { ButtonRect } from '../types';

export function drawButton(b: ButtonRect, label: string, opts: { primary?: boolean; fontSize?: number; dim?: boolean } = {}): void {
  ctx.save();

  const g = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
  if (opts.primary) {
    g.addColorStop(0,   '#66f7ff');
    g.addColorStop(0.5, '#8d7aff');
    g.addColorStop(1,   '#ff8fd6');
  } else {
    g.addColorStop(0, '#323b66');
    g.addColorStop(1, '#222948');
  }

  ctx.globalAlpha = opts.dim ? 0.55 : 1;
  ctx.fillStyle = g;
  roundRect(b.x, b.y, b.w, b.h, Math.min(20, b.h / 2));
  ctx.fill();

  ctx.strokeStyle = opts.primary ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.20)';
  ctx.lineWidth = 1.5;
  roundRect(b.x, b.y, b.w, b.h, Math.min(20, b.h / 2));
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `1000 ${opts.fontSize ?? 18}px ui-rounded, system-ui, sans-serif`;
  ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 1);

  ctx.restore();
}

/** Small round toggle with a strike line when off. */
export function drawToggle(b: ButtonRect, label: string, on: boolean): void {
  ctx.save();
  ctx.fillStyle = on ? 'rgba(102,247,255,.22)' : 'rgba(255,255,255,.08)';
  roundRect(b.x, b.y, b.w, b.h, b.h / 2);
  ctx.fill();
  ctx.strokeStyle = on ? 'rgba(102,247,255,.6)' : 'rgba(255,255,255,.18)';
  ctx.lineWidth = 1.5;
  roundRect(b.x, b.y, b.w, b.h, b.h / 2);
  ctx.stroke();

  ctx.fillStyle = on ? '#bdfdff' : 'rgba(255,255,255,.4)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '1000 14px ui-rounded, system-ui, sans-serif';
  ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 1);

  if (!on) {
    ctx.strokeStyle = 'rgba(255,120,150,.8)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(b.x + 10, b.y + b.h - 10);
    ctx.lineTo(b.x + b.w - 10, b.y + 10);
    ctx.stroke();
  }
  ctx.restore();
}

/** Horizontal volume slider. `value` is 0..1; dimmed when the channel is off. */
export function drawSlider(b: ButtonRect, value: number, on: boolean): void {
  ctx.save();
  const cy = b.y + b.h / 2;
  const trackH = 6;
  const v = on ? clamp(value, 0, 1) : 0;

  // Track
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  roundRect(b.x, cy - trackH / 2, b.w, trackH, trackH / 2);
  ctx.fill();

  // Filled portion
  if (v > 0) {
    const g = ctx.createLinearGradient(b.x, cy, b.x + b.w, cy);
    g.addColorStop(0, '#66f7ff');
    g.addColorStop(1, '#ff8fd6');
    ctx.fillStyle = g;
    roundRect(b.x, cy - trackH / 2, b.w * v, trackH, trackH / 2);
    ctx.fill();
  }

  // Knob
  const kx = b.x + b.w * v;
  ctx.beginPath();
  ctx.arc(kx, cy, 8, 0, Math.PI * 2);
  ctx.fillStyle = on ? '#ffffff' : 'rgba(255,255,255,.4)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.28)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

export function drawHUD(): void {
  ctx.save();

  // Pause button
  const pb = BTN.pause;
  ctx.fillStyle = 'rgba(255,255,255,.10)';
  roundRect(pb.x, pb.y, pb.w, pb.h, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.20)';
  ctx.lineWidth = 1.5;
  roundRect(pb.x, pb.y, pb.w, pb.h, 14);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.fillRect(pb.x + 15, pb.y + 13, 5, 18);
  ctx.fillRect(pb.x + 25, pb.y + 13, 5, 18);

  // Score
  const pulse = 1 + state.scorePulse * 0.18;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.font = '800 10px ui-rounded, system-ui, sans-serif';
  ctx.fillText('SCORE', 72, 30);
  ctx.fillText('BEST', 212, 30);

  ctx.save();
  ctx.translate(72, 62);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = state.fever > 0 ? '#ff8fd6' : '#fff6a8';
  ctx.font = '1000 30px ui-rounded, system-ui, sans-serif';
  ctx.fillText(format(Math.floor(state.displayScore)), 0, 0);
  ctx.restore();

  ctx.fillStyle = '#8ffbff';
  ctx.font = '1000 19px ui-rounded, system-ui, sans-serif';
  ctx.fillText(format(Math.max(state.profile.highScore, state.score)), 212, 56);

  // Nudge meter mini-bar under best
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  roundRect(212, 68, 84, 6, 3);
  ctx.fill();
  ctx.fillStyle = state.nudgeCharge >= 1 ? '#8ffbff' : 'rgba(143,251,255,.55)';
  roundRect(212, 68, 84 * clamp(state.nudgeCharge, 0, 1), 6, 3);
  ctx.fill();

  // Next panel (tap to swap)
  const np = BTN.nextPanel;
  ctx.fillStyle = 'rgba(255,255,255,.10)';
  roundRect(np.x, np.y, np.w, np.h, 18);
  ctx.fill();
  ctx.strokeStyle = state.swapUsed ? 'rgba(255,255,255,.14)' : 'rgba(143,251,255,.40)';
  ctx.lineWidth = 1.5;
  roundRect(np.x, np.y, np.w, np.h, 18);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,.65)';
  ctx.font = '900 10px ui-rounded, system-ui, sans-serif';
  ctx.fillText('NEXT', np.x + np.w / 2, np.y + 16);

  drawDropimalIcon(np.x + np.w / 2, np.y + 50, state.nextTier, 26);

  ctx.fillStyle = state.swapUsed ? 'rgba(255,255,255,.25)' : 'rgba(143,251,255,.75)';
  ctx.font = '800 8.5px ui-rounded, system-ui, sans-serif';
  ctx.fillText(state.swapUsed ? '' : 'TAP TO SWAP', np.x + np.w / 2, np.y + np.h - 9);

  // Mission chip
  ctx.fillStyle = 'rgba(0,0,0,.38)';
  roundRect(16, 112, 288, 30, 15);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.12)';
  ctx.lineWidth = 1;
  roundRect(16, 112, 288, 30, 15);
  ctx.stroke();

  ctx.fillStyle = '#8ffbff';
  ctx.textAlign = 'left';
  ctx.font = '900 10px ui-rounded, system-ui, sans-serif';
  ctx.fillText('MISSION', 30, 131);

  const progress = getMissionProgress();
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  roundRect(86, 122, 70, 8, 4);
  ctx.fill();
  const pg = ctx.createLinearGradient(86, 122, 156, 122);
  pg.addColorStop(0, '#66f7ff');
  pg.addColorStop(1, '#ff8fd6');
  ctx.fillStyle = pg;
  roundRect(86, 122, 70 * progress, 8, 4);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.font = '800 11px ui-rounded, system-ui, sans-serif';
  ctx.fillText(state.mission ? state.mission.text : '', 166, 131);

  // Combo + fever
  if (state.fever > 0) {
    const t = state.fever / FEVER_TIME;
    ctx.textAlign = 'center';
    const hue = (state.time * 240) % 360;
    ctx.fillStyle = `hsl(${hue}, 95%, 72%)`;
    ctx.font = '1000 24px ui-rounded, system-ui, sans-serif';
    ctx.fillText('FEVER x2', GW / 2, 188);
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    roundRect(GW / 2 - 70, 196, 140, 6, 3);
    ctx.fill();
    ctx.fillStyle = `hsl(${hue}, 95%, 72%)`;
    roundRect(GW / 2 - 70, 196, 140 * t, 6, 3);
    ctx.fill();
  } else if (state.combo >= 2 && state.comboTimer > 0) {
    const alpha = clamp(state.comboTimer / COMBO_WINDOW, 0, 1);
    ctx.globalAlpha = 0.4 + alpha * 0.6;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff6a8';
    ctx.font = '1000 22px ui-rounded, system-ui, sans-serif';
    ctx.fillText('COMBO x' + state.combo, GW / 2, 188);
    ctx.fillStyle = 'rgba(255,246,168,.5)';
    roundRect(GW / 2 - 55, 196, 110 * alpha, 5, 2.5);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawEvolutionChain();
  drawNudgeButton();
  ctx.restore();
}

/** Bottom bar: the full evolution chain with progress highlighting. */
function drawEvolutionChain(): void {
  const y = 690;
  const x0 = 26;
  const spacing = (300 - x0) / (MAX_TIER);

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,.10)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x0 + spacing * MAX_TIER, y);
  ctx.stroke();

  for (let i = 0; i <= MAX_TIER; i++) {
    const x = x0 + i * spacing;
    const d = DROPIMALS[i];
    const reached = i <= state.bestTier;
    const discovered = state.profile.discovered[i];
    const rr = 6 + i * 0.7;

    if (reached) {
      ctx.fillStyle = d.c1;
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.fill();
      if (i === state.bestTier) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, rr + 2.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = discovered ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.09)';
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawNudgeButton(): void {
  const b = BTN.nudge;
  const ready = state.nudgeCharge >= 1;

  ctx.save();

  const g = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
  if (ready) {
    const wob = Math.sin(state.time * 7) * 2;
    ctx.translate(0, wob * 0.4);
    g.addColorStop(0, '#66f7ff');
    g.addColorStop(1, '#ff8fd6');
  } else {
    g.addColorStop(0, '#2d365b');
    g.addColorStop(1, '#1b2240');
  }

  ctx.fillStyle = g;
  roundRect(b.x, b.y, b.w, b.h, 18);
  ctx.fill();

  ctx.strokeStyle = ready ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.20)';
  ctx.lineWidth = 1.4;
  roundRect(b.x, b.y, b.w, b.h, 18);
  ctx.stroke();

  if (!ready) {
    ctx.fillStyle = 'rgba(255,255,255,.16)';
    roundRect(b.x + 7, b.y + b.h - 11, b.w - 14, 4, 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(143,251,255,.70)';
    roundRect(b.x + 7, b.y + b.h - 11, (b.w - 14) * state.nudgeCharge, 4, 2);
    ctx.fill();
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = ready ? '#ffffff' : 'rgba(255,255,255,.55)';
  ctx.font = '1000 14px ui-rounded, system-ui, sans-serif';
  ctx.fillText('NUDGE', b.x + b.w / 2, b.y + (ready ? 28 : 24));

  ctx.restore();
}
