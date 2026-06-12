import { state } from '../state';
import { GW, GH } from '../constants';
import { clearSpriteCache } from './animals';
import { clearBackgroundCache } from './background';

export let canvas: HTMLCanvasElement;
export let ctx: CanvasRenderingContext2D;

export function initCanvas(): void {
  canvas = document.getElementById('game') as HTMLCanvasElement;
  ctx = canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
}

export function resize(): void {
  state.DPR = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  state.viewW = Math.floor(window.innerWidth);
  state.viewH = Math.floor(window.innerHeight);

  canvas.width  = Math.floor(state.viewW * state.DPR);
  canvas.height = Math.floor(state.viewH * state.DPR);
  canvas.style.width  = state.viewW + 'px';
  canvas.style.height = state.viewH + 'px';

  ctx.setTransform(state.DPR, 0, 0, state.DPR, 0, 0);

  state.scale = Math.min(state.viewW / GW, state.viewH / GH);
  state.ox = (state.viewW - GW * state.scale) / 2;
  state.oy = (state.viewH - GH * state.scale) / 2;

  clearSpriteCache();
  clearBackgroundCache();
}

// ── Canvas drawing primitives ────────────────────────────────────────────────

export function circle(x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function roundRect(x: number, y: number, w: number, h: number, r: number): void {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + r, y,     r);
  ctx.closePath();
}
