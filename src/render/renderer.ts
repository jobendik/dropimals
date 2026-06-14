import { ctx } from './canvas';
import { state } from '../state';
import { drawOuterBackground, drawGameBackground, drawPlayfield, drawDangerVignette } from './background';
import { drawDropimal } from './animals';
import { drawShockwaves, drawParticles, drawConfetti, drawFloaters, drawFlash } from './effects';
import { drawHUD } from './hud';
import {
  drawDropPreview, drawStartHint, drawGameOver, drawMenu,
  drawPauseOverlay, drawDex, drawBanner, drawContinueOffer,
} from './ui';
import { drawRewards } from './rewards';
import { drawToasts, drawOverlay } from './meta';
import { clamp } from '../utils/math';
import { trailColor } from '../meta/cosmetics';

function drawBodies(): void {
  const sorted = [...state.bodies].sort((a, b) => a.r - b.r);
  const trail = trailColor();
  for (const b of sorted) {
    const speed2 = Math.abs(b.vx) + Math.abs(b.vy);
    // Drop-trail cosmetic: a soft colour streak behind fast-moving Dropimals.
    if (trail && speed2 > 220) {
      ctx.save();
      ctx.globalAlpha = clamp((speed2 - 220) / 900, 0, 0.5);
      ctx.fillStyle = trail;
      for (let i = 1; i <= 3; i++) {
        ctx.globalAlpha *= 0.6;
        ctx.beginPath();
        ctx.arc(b.x - b.vx * 0.006 * i, b.y - b.vy * 0.006 * i, b.r * (1 - i * 0.18), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    drawDropimal(b.x, b.y, b.tier, b.angle, {
      squash: b.squash,
      blink: b.blink < 0,
      lookX: clamp(b.vx / 260, -1, 1),
      lookY: clamp(b.vy / 320, -0.6, 1),
      shadow: speed2 < 600,
    });
  }
}

export function draw(): void {
  const { DPR, ox, oy, scale, shake, screen } = state;

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawOuterBackground();

  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);

  if (shake > 0 && !state.profile.reducedMotion) {
    ctx.translate(
      (Math.random() - 0.5) * shake,
      (Math.random() - 0.5) * shake,
    );
  }

  drawGameBackground();

  if (screen === 'rewards') {
    drawRewards();
  } else if (screen === 'menu' || screen === 'dex') {
    if (screen === 'menu') drawMenu();
    else drawDex();
    drawConfetti();
  } else {
    // play / paused / over all render the field underneath
    drawPlayfield();
    drawDropPreview();
    drawBodies();
    drawShockwaves();
    drawParticles();
    drawConfetti();
    drawFloaters();
    drawDangerVignette();
    drawHUD();

    if (screen === 'play' && !state.gameOver) drawStartHint();
    if (screen !== 'paused') drawBanner();
    drawFlash();

    if (screen === 'paused') drawPauseOverlay();
    if (screen === 'over') drawGameOver();
    if (screen === 'continue') drawContinueOffer();
  }

  // Notifications and celebration overlays sit above everything.
  drawToasts();
  drawOverlay();

  ctx.restore();
}
