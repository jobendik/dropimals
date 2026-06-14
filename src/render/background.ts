import { ctx, roundRect } from './canvas';
import { state } from '../state';
import { GW, GH, LEFT, RIGHT, FLOOR, DANGER_Y, OVERFLOW_GRACE } from '../constants';
import { clamp, darken } from '../utils/math';
import { equippedBg } from '../meta/cosmetics';

// The static parts of the scene (outer vignette, panel gradient, jar walls,
// floor plate) are cached to an offscreen canvas and re-rendered on resize.
// Per-frame we draw the cached image plus the cheap animated layers.

let bgCanvas: HTMLCanvasElement | null = null;
let builtBg = '';

export function clearBackgroundCache(): void {
  bgCanvas = null;
}

function buildBackground(): HTMLCanvasElement {
  const q = clamp(state.scale * state.DPR, 0.5, 2.5);
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(GW * q);
  cv.height = Math.ceil(GH * q);
  const s = cv.getContext('2d') as CanvasRenderingContext2D;
  s.scale(q, q);

  // Panel gradient — themed by the equipped background cosmetic.
  const { c1, c2 } = equippedBg();
  builtBg = state.profile.equipped.bg;
  const bg = s.createLinearGradient(0, 0, 0, GH);
  bg.addColorStop(0,    c1);
  bg.addColorStop(0.55, c2);
  bg.addColorStop(1,    darken(c2, 14));
  s.fillStyle = bg;
  s.fillRect(0, 0, GW, GH);

  // Distant stars
  for (let i = 0; i < 60; i++) {
    const x = (i * 137.5) % GW;
    const y = ((i * 89.7) % GH);
    const r = 0.6 + (i % 3) * 0.5;
    s.globalAlpha = 0.10 + (i % 5) * 0.04;
    s.fillStyle = i % 4 === 0 ? '#8bf2ff' : '#ffffff';
    s.beginPath();
    s.arc(x, y, r, 0, Math.PI * 2);
    s.fill();
  }
  s.globalAlpha = 1;

  // Top spotlight glow
  const glow = s.createRadialGradient(GW * 0.5, 200, 20, GW * 0.5, 260, 380);
  glow.addColorStop(0, 'rgba(112,243,255,.16)');
  glow.addColorStop(1, 'rgba(112,243,255,0)');
  s.fillStyle = glow;
  s.fillRect(0, 0, GW, GH);

  return cv;
}

export function drawOuterBackground(): void {
  const { viewW, viewH } = state;
  const g = ctx.createRadialGradient(
    viewW * 0.5, viewH * 0.22, 10,
    viewW * 0.5, viewH * 0.45, Math.max(viewW, viewH),
  );
  g.addColorStop(0,    '#2f2a70');
  g.addColorStop(0.52, '#101731');
  g.addColorStop(1,    '#060814');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, viewW, viewH);
}

export function drawGameBackground(): void {
  // Rebuild the cached panel when the equipped background changes.
  if (!bgCanvas || builtBg !== state.profile.equipped.bg) bgCanvas = buildBackground();
  ctx.drawImage(bgCanvas, 0, 0, GW, GH);

  // Fever tint
  if (state.fever > 0) {
    const pulse = 0.06 + Math.sin(state.time * 9) * 0.03;
    const hue = (state.time * 90) % 360;
    ctx.fillStyle = `hsla(${hue}, 90%, 65%, ${pulse})`;
    ctx.fillRect(0, 0, GW, GH);
  }

  // Rising bubbles
  ctx.save();
  for (const b of state.bubbles) {
    ctx.globalAlpha = b.alpha;
    ctx.strokeStyle = '#9be9ff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(b.x + Math.sin(state.time * b.drift + b.r) * 8, b.y, b.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function updateBubbles(dt: number): void {
  if (state.bubbles.length < 14 && Math.random() < dt * 2.2) {
    state.bubbles.push({
      x: 30 + Math.random() * (GW - 60),
      y: GH + 14,
      r: 2.5 + Math.random() * 6,
      speed: 18 + Math.random() * 30,
      drift: 0.6 + Math.random() * 1.4,
      alpha: 0.06 + Math.random() * 0.12,
    });
  }
  for (const b of state.bubbles) b.y -= b.speed * dt;
  state.bubbles = state.bubbles.filter(b => b.y > -20);
}

export function drawPlayfield(): void {
  const { dangerTime } = state;

  ctx.save();

  // Glass jar walls
  const wallG = ctx.createLinearGradient(0, DANGER_Y, 0, FLOOR);
  wallG.addColorStop(0, 'rgba(155,245,255,.06)');
  wallG.addColorStop(1, 'rgba(155,245,255,.16)');
  ctx.fillStyle = wallG;
  roundRect(LEFT - 11, DANGER_Y - 12, 11, FLOOR - DANGER_Y + 26, 8);
  ctx.fill();
  roundRect(RIGHT, DANGER_Y - 12, 11, FLOOR - DANGER_Y + 26, 8);
  ctx.fill();

  ctx.strokeStyle = 'rgba(155,245,255,.38)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(LEFT,  DANGER_Y);
  ctx.lineTo(LEFT,  FLOOR);
  ctx.lineTo(RIGHT, FLOOR);
  ctx.lineTo(RIGHT, DANGER_Y);
  ctx.stroke();

  // Wall caps
  ctx.fillStyle = 'rgba(155,245,255,.5)';
  circle(LEFT - 5, DANGER_Y - 12);
  circle(RIGHT + 5, DANGER_Y - 12);

  // Floor plate
  const floorG = ctx.createLinearGradient(0, FLOOR - 8, 0, FLOOR + 38);
  floorG.addColorStop(0,    '#72f1ff');
  floorG.addColorStop(0.16, '#405ddf');
  floorG.addColorStop(1,    '#111633');
  ctx.fillStyle = floorG;
  roundRect(LEFT - 10, FLOOR - 6, RIGHT - LEFT + 20, 22, 11);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.30)';
  ctx.lineWidth = 1.5;
  roundRect(LEFT - 10, FLOOR - 6, RIGHT - LEFT + 20, 22, 11);
  ctx.stroke();

  // Danger line
  const dangerAlpha = dangerTime > 0
    ? 0.45 + Math.sin(performance.now() * 0.02) * 0.22
    : 0.16;

  ctx.setLineDash([9, 7]);
  ctx.strokeStyle = dangerTime > 0
    ? `rgba(255,95,135,${dangerAlpha + 0.25})`
    : `rgba(255,255,255,${dangerAlpha})`;
  ctx.lineWidth = dangerTime > 0 ? 4 : 2;
  ctx.beginPath();
  ctx.moveTo(LEFT,  DANGER_Y);
  ctx.lineTo(RIGHT, DANGER_Y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign  = 'right';
  ctx.font       = '800 10px ui-rounded, system-ui, sans-serif';
  ctx.fillStyle  = dangerTime > 0 ? '#ff9fbe' : 'rgba(255,255,255,.30)';
  ctx.fillText('DANGER', RIGHT - 6, DANGER_Y - 9);

  // Overflow countdown bar
  if (dangerTime > 0) {
    const pct = clamp(dangerTime / OVERFLOW_GRACE, 0, 1);
    ctx.fillStyle = 'rgba(255,95,135,.30)';
    roundRect(LEFT, DANGER_Y - 29, (RIGHT - LEFT) * pct, 5, 3);
    ctx.fill();
  }

  ctx.restore();
}

/** Red edges closing in while the box is overflowing. */
export function drawDangerVignette(): void {
  if (state.dangerTime <= 0 || state.gameOver) return;
  const pct = clamp(state.dangerTime / OVERFLOW_GRACE, 0, 1);
  const pulse = 0.5 + Math.sin(state.time * 12) * 0.5;
  const a = pct * (0.18 + pulse * 0.14);

  const g = ctx.createRadialGradient(GW / 2, GH / 2, GH * 0.30, GW / 2, GH / 2, GH * 0.62);
  g.addColorStop(0, 'rgba(255,40,90,0)');
  g.addColorStop(1, `rgba(255,40,90,${a})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GW, GH);
}

function circle(x: number, y: number): void {
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
}
