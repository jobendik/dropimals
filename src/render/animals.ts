import { ctx } from './canvas';
import { state } from '../state';
import { DROPIMALS } from '../data/dropimals';
import { lighten, darken, clamp } from '../utils/math';

// Animal bodies are pre-rendered once per tier into offscreen canvases
// (re-rendered on resize for sharpness). Per-frame we only blit the sprite
// and draw the pupils on top — no gradients or shadowBlur in the hot path.

const PAD = 1.75;

interface Sprite {
  canvas: HTMLCanvasElement;
  q: number;
}

const cache = new Map<number, Sprite>();

export function clearSpriteCache(): void {
  cache.clear();
}

function quality(): number {
  return clamp(state.scale * state.DPR, 0.5, 3);
}

function getSprite(tier: number): Sprite {
  const q = quality();
  const hit = cache.get(tier);
  if (hit && Math.abs(hit.q - q) < 0.01) return hit;

  const sprite = { canvas: renderSprite(tier, q), q };
  cache.set(tier, sprite);
  return sprite;
}

function renderSprite(tier: number, q: number): HTMLCanvasElement {
  const d = DROPIMALS[tier];
  const r = d.r;
  const size = Math.ceil(r * 2 * PAD * q);
  const cv = document.createElement('canvas');
  cv.width = size;
  cv.height = size;
  const s = cv.getContext('2d') as CanvasRenderingContext2D;

  s.translate(size / 2, size / 2);
  s.scale(q, q);

  // Soft glow halo (replaces per-frame shadowBlur)
  const halo = s.createRadialGradient(0, 0, r * 0.7, 0, 0, r * 1.45);
  halo.addColorStop(0, hexA(d.c1, 0.32));
  halo.addColorStop(1, hexA(d.c1, 0));
  s.fillStyle = halo;
  s.beginPath();
  s.arc(0, 0, r * 1.45, 0, Math.PI * 2);
  s.fill();

  drawBehind(s, d.skin, r, d);

  // Main body ball
  const grad = s.createRadialGradient(-r * 0.32, -r * 0.38, r * 0.05, 0, 0, r);
  grad.addColorStop(0, lighten(d.c1, 30));
  grad.addColorStop(0.55, d.c1);
  grad.addColorStop(1, d.c2);
  s.fillStyle = grad;
  s.beginPath();
  s.arc(0, 0, r, 0, Math.PI * 2);
  s.fill();

  // Rim light + outline
  s.lineWidth = Math.max(2, r * 0.05);
  s.strokeStyle = 'rgba(255,255,255,.30)';
  s.beginPath();
  s.arc(0, 0, r - s.lineWidth / 2, 0, Math.PI * 2);
  s.stroke();

  s.lineWidth = Math.max(1.5, r * 0.035);
  s.strokeStyle = hexA(darken(d.c2, 30), 0.55);
  s.beginPath();
  s.arc(0, 0, r, 0, Math.PI * 2);
  s.stroke();

  // Gloss highlight
  s.globalAlpha = 0.30;
  s.fillStyle = '#fff';
  s.beginPath();
  s.ellipse(-r * 0.30, -r * 0.42, r * 0.28, r * 0.15, -0.55, 0, Math.PI * 2);
  s.fill();
  s.globalAlpha = 1;

  drawFront(s, d.skin, r, d);
  drawFaceBase(s, d.skin, r, d);

  return cv;
}

function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// ── Shape helpers (sprite-local context) ─────────────────────────────────────

function cir(s: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  s.beginPath();
  s.arc(x, y, r, 0, Math.PI * 2);
  s.fill();
}

function ell(s: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot: number): void {
  s.beginPath();
  s.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  s.fill();
}

function tri(s: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void {
  s.beginPath();
  s.moveTo(x1, y1);
  s.lineTo(x2, y2);
  s.lineTo(x3, y3);
  s.closePath();
  s.fill();
}

function star(s: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  s.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) s.moveTo(px, py);
    else s.lineTo(px, py);
  }
  s.closePath();
  s.fill();
}

// ── Per-skin details ─────────────────────────────────────────────────────────

function drawBehind(s: CanvasRenderingContext2D, skin: string, r: number, d: { c1: string; c2: string }): void {
  if (skin === 'chick') {
    // Head tuft feathers
    s.fillStyle = d.c2;
    ell(s, -r * 0.12, -r * 0.98, r * 0.07, r * 0.20, -0.4);
    ell(s, 0.0,       -r * 1.04, r * 0.07, r * 0.22,  0.0);
    ell(s, r * 0.12,  -r * 0.98, r * 0.07, r * 0.20,  0.4);
  }

  if (skin === 'mouse') {
    s.fillStyle = '#ff9fe1';
    cir(s, -r * 0.62, -r * 0.62, r * 0.32);
    cir(s,  r * 0.62, -r * 0.62, r * 0.32);
    s.fillStyle = '#ffd2ef';
    cir(s, -r * 0.62, -r * 0.62, r * 0.18);
    cir(s,  r * 0.62, -r * 0.62, r * 0.18);
  }

  if (skin === 'bunny') {
    s.fillStyle = '#dcb8ff';
    ell(s, -r * 0.34, -r * 0.96, r * 0.18, r * 0.50, -0.28);
    ell(s,  r * 0.34, -r * 0.96, r * 0.18, r * 0.50,  0.28);
    s.fillStyle = '#ffd2ef';
    ell(s, -r * 0.34, -r * 0.94, r * 0.09, r * 0.32, -0.28);
    ell(s,  r * 0.34, -r * 0.94, r * 0.09, r * 0.32,  0.28);
  }

  if (skin === 'fox') {
    s.fillStyle = '#ff9a3d';
    tri(s, -r * 0.55, -r * 0.38, -r * 0.92, -r * 1.04, -r * 0.20, -r * 0.70);
    tri(s,  r * 0.55, -r * 0.38,  r * 0.92, -r * 1.04,  r * 0.20, -r * 0.70);
    s.fillStyle = '#ffe6c8';
    tri(s, -r * 0.53, -r * 0.55, -r * 0.70, -r * 0.85, -r * 0.36, -r * 0.68);
    tri(s,  r * 0.53, -r * 0.55,  r * 0.70, -r * 0.85,  r * 0.36, -r * 0.68);
  }

  if (skin === 'panda') {
    s.fillStyle = '#303244';
    cir(s, -r * 0.55, -r * 0.66, r * 0.27);
    cir(s,  r * 0.55, -r * 0.66, r * 0.27);
  }

  if (skin === 'frog') {
    s.fillStyle = lighten(d.c1, 8);
    cir(s, -r * 0.42, -r * 0.66, r * 0.26);
    cir(s,  r * 0.42, -r * 0.66, r * 0.26);
  }

  if (skin === 'owl') {
    s.fillStyle = d.c2;
    tri(s, -r * 0.40, -r * 0.74, -r * 0.66, -r * 1.10, -r * 0.12, -r * 0.92);
    tri(s,  r * 0.40, -r * 0.74,  r * 0.66, -r * 1.10,  r * 0.12, -r * 0.92);
  }

  if (skin === 'dragon') {
    s.fillStyle = '#ffd36e';
    tri(s, -r * 0.50, -r * 0.48, -r * 0.72, -r * 1.04, -r * 0.26, -r * 0.63);
    tri(s,  r * 0.50, -r * 0.48,  r * 0.72, -r * 1.04,  r * 0.26, -r * 0.63);
    s.fillStyle = '#79f7ff';
    for (let i = -2; i <= 2; i++) {
      tri(s, i * r * 0.17, -r * 0.86, i * r * 0.17 - r * 0.10, -r * 1.16, i * r * 0.17 + r * 0.10, -r * 1.16);
    }
  }

  if (skin === 'lion') {
    s.fillStyle = '#ff9f2e';
    const spikes = 18;
    s.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const a  = i / (spikes * 2) * Math.PI * 2;
      const rr = i % 2 === 0 ? r * 1.18 : r * 0.95;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) s.moveTo(px, py);
      else s.lineTo(px, py);
    }
    s.closePath();
    s.fill();
    s.fillStyle = '#e07b12';
    cir(s, -r * 0.62, -r * 0.62, r * 0.16);
    cir(s,  r * 0.62, -r * 0.62, r * 0.16);
  }

  if (skin === 'whale') {
    // Water spout
    s.strokeStyle = '#aef3ff';
    s.lineWidth = r * 0.06;
    s.lineCap = 'round';
    s.beginPath();
    s.moveTo(0, -r * 0.92);
    s.quadraticCurveTo(-r * 0.16, -r * 1.18, -r * 0.30, -r * 1.24);
    s.moveTo(0, -r * 0.92);
    s.quadraticCurveTo(r * 0.16, -r * 1.18, r * 0.30, -r * 1.24);
    s.moveTo(0, -r * 0.92);
    s.lineTo(0, -r * 1.28);
    s.stroke();
    s.fillStyle = '#aef3ff';
    cir(s, -r * 0.30, -r * 1.26, r * 0.05);
    cir(s,  r * 0.30, -r * 1.26, r * 0.05);
    cir(s,  0,        -r * 1.32, r * 0.055);
    // Side fins
    s.fillStyle = d.c2;
    ell(s, -r * 0.92, r * 0.28, r * 0.30, r * 0.16, -0.5);
    ell(s,  r * 0.92, r * 0.28, r * 0.30, r * 0.16,  0.5);
  }
}

function drawFront(s: CanvasRenderingContext2D, skin: string, r: number, d: { c1: string; c2: string }): void {
  if (skin === 'chick') {
    // Wing nubs
    s.fillStyle = darken(d.c1, 18);
    ell(s, -r * 0.82, r * 0.10, r * 0.22, r * 0.34, 0.35);
    ell(s,  r * 0.82, r * 0.10, r * 0.22, r * 0.34, -0.35);
    // Beak
    s.fillStyle = '#ff9430';
    tri(s, -r * 0.13, r * 0.07, r * 0.13, r * 0.07, 0, r * 0.26);
  }

  if (skin === 'mouse') {
    // Whiskers
    s.strokeStyle = 'rgba(255,255,255,.45)';
    s.lineWidth = Math.max(1, r * 0.03);
    s.lineCap = 'round';
    s.beginPath();
    for (const side of [-1, 1]) {
      for (const dy of [-0.02, 0.08]) {
        s.moveTo(side * r * 0.30, r * (0.18 + dy));
        s.lineTo(side * r * 0.78, r * (0.10 + dy * 2));
      }
    }
    s.stroke();
    // Nose
    s.fillStyle = '#c82a86';
    ell(s, 0, r * 0.16, r * 0.08, r * 0.06, 0);
  }

  if (skin === 'bunny') {
    // Buck teeth
    s.fillStyle = '#ffffff';
    const tw = r * 0.075;
    s.fillRect(-tw, r * 0.30, tw * 0.94, r * 0.13);
    s.fillRect(tw * 0.06, r * 0.30, tw * 0.94, r * 0.13);
    // Nose
    s.fillStyle = '#ff8fd6';
    tri(s, -r * 0.07, r * 0.16, r * 0.07, r * 0.16, 0, r * 0.26);
  }

  if (skin === 'fox') {
    s.fillStyle = '#fff0d4';
    s.beginPath();
    s.moveTo(-r * 0.44, r * 0.05);
    s.quadraticCurveTo(0, r * 0.36, r * 0.44, r * 0.05);
    s.quadraticCurveTo(0, r * 0.70, -r * 0.44, r * 0.05);
    s.fill();
    s.fillStyle = '#46332a';
    ell(s, 0, r * 0.18, r * 0.09, r * 0.07, 0);
  }

  if (skin === 'panda') {
    s.fillStyle = '#303244';
    ell(s, -r * 0.32, -r * 0.08, r * 0.22, r * 0.31, -0.25);
    ell(s,  r * 0.32, -r * 0.08, r * 0.22, r * 0.31,  0.25);
    ell(s, 0, r * 0.22, r * 0.10, r * 0.075, 0);
  }

  if (skin === 'frog') {
    s.fillStyle = 'rgba(255,255,255,.26)';
    ell(s, 0, r * 0.34, r * 0.50, r * 0.26, 0);
  }

  if (skin === 'owl') {
    // Facial disc
    s.fillStyle = 'rgba(255,255,255,.30)';
    ell(s, -r * 0.26, -r * 0.13, r * 0.30, r * 0.34, -0.25);
    ell(s,  r * 0.26, -r * 0.13, r * 0.30, r * 0.34,  0.25);
    // Belly feather chevrons
    s.strokeStyle = hexA(d.c2, 0.5);
    s.lineWidth = r * 0.035;
    s.lineCap = 'round';
    s.beginPath();
    for (let row = 0; row < 3; row++) {
      const y = r * (0.40 + row * 0.17);
      const w = r * (0.34 - row * 0.07);
      for (let i = -1; i <= 1; i++) {
        s.moveTo(i * w - r * 0.07, y);
        s.lineTo(i * w, y + r * 0.08);
        s.lineTo(i * w + r * 0.07, y);
      }
    }
    s.stroke();
    // Beak
    s.fillStyle = '#ff9f2e';
    tri(s, 0, r * 0.04, -r * 0.10, r * 0.22, r * 0.10, r * 0.22);
  }

  if (skin === 'dragon') {
    s.fillStyle = 'rgba(255,255,255,.18)';
    ell(s, 0, r * 0.42, r * 0.52, r * 0.34, 0);
    s.strokeStyle = 'rgba(255,255,255,.25)';
    s.lineWidth = r * 0.035;
    s.beginPath();
    for (let row = 0; row < 3; row++) {
      const y = r * (0.28 + row * 0.18);
      s.moveTo(-r * 0.34, y);
      s.quadraticCurveTo(0, y + r * 0.10, r * 0.34, y);
    }
    s.stroke();
    // Nostrils
    s.fillStyle = darken(d.c2, 10);
    cir(s, -r * 0.10, r * 0.14, r * 0.045);
    cir(s,  r * 0.10, r * 0.14, r * 0.045);
  }

  if (skin === 'lion') {
    // Muzzle
    s.fillStyle = lighten(d.c1, 18);
    ell(s, 0, r * 0.24, r * 0.30, r * 0.22, 0);
    s.fillStyle = '#a3590f';
    ell(s, 0, r * 0.13, r * 0.09, r * 0.07, 0);
    // Forehead star
    s.fillStyle = '#ffffff';
    star(s, 0, -r * 0.52, r * 0.13);
  }

  if (skin === 'whale') {
    // Belly ridges
    s.strokeStyle = 'rgba(255,255,255,.22)';
    s.lineWidth = r * 0.035;
    s.beginPath();
    for (let row = 0; row < 4; row++) {
      const y = r * (0.34 + row * 0.14);
      const w = r * (0.62 - row * 0.10);
      s.moveTo(-w, y);
      s.quadraticCurveTo(0, y + r * 0.08, w, y);
    }
    s.stroke();
    // Star spots + crescent — it's the Luna Whale
    s.fillStyle = 'rgba(255,255,255,.75)';
    star(s, -r * 0.52, -r * 0.40, r * 0.075);
    star(s,  r * 0.56, -r * 0.30, r * 0.06);
    star(s,  r * 0.30, -r * 0.62, r * 0.05);
    s.beginPath();
    s.arc(-r * 0.05, -r * 0.58, r * 0.11, 0, Math.PI * 2);
    s.arc(-r * 0.01, -r * 0.61, r * 0.095, 0, Math.PI * 2, true);
    s.fill('evenodd');
  }
}

/** Mouth, blush, eye sockets — everything facial except the animated pupils. */
function drawFaceBase(s: CanvasRenderingContext2D, skin: string, r: number, d: { ex: number; ey: number; er: number }): void {
  const eyeY = d.ey * r;
  const eyeDist = d.ex * r;
  const eyeR = Math.max(2.2, d.er * r);

  // Eye whites / sockets
  if (skin === 'panda' || skin === 'frog' || skin === 'owl') {
    s.fillStyle = '#fff';
    cir(s, -eyeDist, eyeY, eyeR * (skin === 'owl' ? 1.7 : 1.35));
    cir(s,  eyeDist, eyeY, eyeR * (skin === 'owl' ? 1.7 : 1.35));
  }

  // Blush
  s.fillStyle = 'rgba(255,115,165,.40)';
  cir(s, -eyeDist - eyeR * 1.5, eyeY + eyeR * 2.2, eyeR * 1.0);
  cir(s,  eyeDist + eyeR * 1.5, eyeY + eyeR * 2.2, eyeR * 1.0);

  // Mouth
  s.strokeStyle = '#1d2030';
  s.lineWidth = Math.max(1.5, r * 0.045);
  s.lineCap = 'round';
  s.beginPath();
  if (skin === 'frog') {
    s.arc(0, -r * 0.02, r * 0.30, 0.25, Math.PI - 0.25);
  } else if (skin === 'chick' || skin === 'owl') {
    // beak covers the mouth area — tiny smile under it
    s.arc(0, r * 0.26, r * 0.10, 0.3, Math.PI - 0.3);
  } else {
    s.arc(0, eyeY + r * 0.22, r * 0.13, 0.08, Math.PI - 0.08);
  }
  s.stroke();
}

// ── Per-frame drawing ────────────────────────────────────────────────────────

export interface DrawOpts {
  squash?: number;
  blink?: boolean;
  lookX?: number;
  lookY?: number;
  alpha?: number;
  shadow?: boolean;
}

export function drawDropimal(x: number, y: number, tier: number, angle: number, opts: DrawOpts = {}): void {
  const d = DROPIMALS[tier];
  const r = d.r;
  const sprite = getSprite(tier);
  const squash = opts.squash ?? 1;
  const sx = 1 + (1 - squash) * 0.55;
  const sy = squash;

  // Ground-contact shadow (world-aligned, not rotated)
  if (opts.shadow) {
    ctx.save();
    ctx.globalAlpha = 0.20 * (opts.alpha ?? 1);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.78, r * 0.78 * sx, r * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(sx, sy);
  if (opts.alpha != null) ctx.globalAlpha = opts.alpha;

  const drawSize = r * 2 * PAD;
  ctx.drawImage(sprite.canvas, -drawSize / 2, -drawSize / 2, drawSize, drawSize);

  // Animated pupils
  const eyeY = d.ey * r;
  const eyeDist = d.ex * r;
  const eyeR = Math.max(2.2, d.er * r);
  const lx = clamp(opts.lookX ?? 0, -1, 1) * eyeR * 0.45;
  const ly = clamp(opts.lookY ?? 0, -1, 1) * eyeR * 0.45;

  ctx.fillStyle = '#1d2030';
  if (opts.blink) {
    const lidW = eyeR * 1.1;
    const lidH = Math.max(1.2, eyeR * 0.22);
    ctx.fillRect(-eyeDist - lidW / 2, eyeY - lidH / 2, lidW, lidH);
    ctx.fillRect(eyeDist - lidW / 2, eyeY - lidH / 2, lidW, lidH);
  } else {
    ctx.beginPath();
    ctx.arc(-eyeDist + lx, eyeY + ly, eyeR, 0, Math.PI * 2);
    ctx.arc(eyeDist + lx, eyeY + ly, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-eyeDist + lx - eyeR * 0.25, eyeY + ly - eyeR * 0.28, eyeR * 0.34, 0, Math.PI * 2);
    ctx.arc(eyeDist + lx - eyeR * 0.25, eyeY + ly - eyeR * 0.28, eyeR * 0.34, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/** Draw a Dropimal scaled to fit inside a UI slot of the given radius. */
export function drawDropimalIcon(x: number, y: number, tier: number, slotR: number, silhouette = false): void {
  if (silhouette) {
    // Mystery silhouette — keep undiscovered animals a surprise
    ctx.save();
    ctx.fillStyle = 'rgba(10,14,32,.85)';
    ctx.beginPath();
    ctx.arc(x, y, slotR * 0.82, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.14)';
    ctx.lineWidth = Math.max(1, slotR * 0.06);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.font = `900 ${Math.round(slotR * 0.9)}px ui-rounded, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', x, y + slotR * 0.05);
    ctx.restore();
    return;
  }

  const d = DROPIMALS[tier];
  const k = slotR / (d.r * 1.25);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  drawDropimal(0, 0, tier, 0, {});
  ctx.restore();
}
