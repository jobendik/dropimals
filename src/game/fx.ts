import { state } from '../state';
import type { Banner } from '../types';

export function updateFX(dt: number): void {
  for (const p of state.particles) {
    p.age += dt;
    p.x   += p.vx * dt;
    p.y   += p.vy * dt;
    p.vy  += p.gravity * dt;
    p.vx  *= Math.pow(0.985, dt * 60);
  }

  for (const f of state.floaters) {
    f.age += dt;
    f.y   += f.vy * dt;
    f.vy  += 18 * dt;
  }

  for (const s of state.shockwaves) {
    s.age += dt;
    s.r   += (360 + s.r * 0.8) * dt;
  }

  for (const c of state.confetti) {
    c.age += dt;
    c.x   += c.vx * dt;
    c.y   += c.vy * dt;
    c.vy  += 420 * dt;
    c.rot += c.vr * dt;
  }

  if (state.banner) {
    state.banner.age += dt;
    if (state.banner.age >= state.banner.life) state.banner = null;
  }

  state.particles  = state.particles.filter(p => p.age < p.life);
  state.floaters   = state.floaters.filter(f => f.age < f.life);
  state.shockwaves = state.shockwaves.filter(s => s.age < s.life);
  state.confetti   = state.confetti.filter(c => c.age < c.life);
}

export function addParticles(x: number, y: number, color: string, count: number, power: number): void {
  for (let i = 0; i < count; i++) {
    const a  = Math.random() * Math.PI * 2;
    const sp = (80 + Math.random() * 230) * power;
    state.particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 30,
      r: 2 + Math.random() * 5,
      color,
      age: 0,
      life: 0.35 + Math.random() * 0.55,
      gravity: 650,
    });
  }
}

export function addFloater(text: string, x: number, y: number, color: string, life = 0.9, size = 20): void {
  state.floaters.push({ text, x, y, color, size, vy: -46, age: 0, life });
}

export function burstConfetti(x: number, y: number, count: number): void {
  const colors = ['#66f7ff', '#ff8fd6', '#fff06a', '#9dff74', '#b28cff', '#ffffff'];
  for (let i = 0; i < count; i++) {
    const a  = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5;
    const sp = 90 + Math.random() * 320;
    state.confetti.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      w: 5 + Math.random() * 8,
      h: 3 + Math.random() * 7,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 9,
      age: 0,
      life: 0.9 + Math.random() * 0.8,
    });
  }
}

export function showBanner(title: string, subtitle: string, color: string, life = 2.2, tier?: number): void {
  const banner: Banner = { title, subtitle, color, age: 0, life, tier };
  state.banner = banner;
}

/** Light haptic tap on supported mobile devices. */
export function haptic(ms: number): void {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch {
    // unsupported — ignore
  }
}
