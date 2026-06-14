import { ctx, roundRect } from './canvas';
import { state } from '../state';
import { GW, GH } from '../constants';

export function drawShockwaves(): void {
  ctx.save();
  for (const s of state.shockwaves) {
    const t = 1 - s.age / s.life;
    ctx.globalAlpha = Math.max(0, t) * 0.9;
    ctx.strokeStyle = s.color;
    ctx.lineWidth   = Math.max(1, 7 * t);
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawParticles(): void {
  ctx.save();
  for (const p of state.particles) {
    const t = 1 - p.age / p.life;
    ctx.globalAlpha = Math.max(0, t);
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * (0.45 + t * 0.75), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawConfetti(): void {
  ctx.save();
  for (const c of state.confetti) {
    const t = 1 - c.age / c.life;
    ctx.globalAlpha = Math.max(0, t);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.fillStyle = c.color;
    roundRect(-c.w / 2, -c.h / 2, c.w, c.h, 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

export function drawFloaters(): void {
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  for (const f of state.floaters) {
    const t = 1 - f.age / f.life;
    ctx.globalAlpha = Math.max(0, t);
    ctx.font        = '900 ' + f.size + 'px ui-rounded, system-ui, sans-serif';
    ctx.lineWidth   = 5;
    ctx.strokeStyle = 'rgba(0,0,0,.38)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle   = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }

  ctx.restore();
}

/** Full-screen white flash, decays in state.flash. */
export function drawFlash(): void {
  if (state.flash <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(0.55, state.flash) * (state.profile.reducedMotion ? 0.4 : 1);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, GW, GH);
  ctx.restore();
}
