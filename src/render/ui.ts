import { ctx, roundRect } from './canvas';
import { state } from '../state';
import { DROPIMALS, MAX_TIER } from '../data/dropimals';
import { BTN, GW, GH, LEFT, RIGHT, DROP_Y } from '../constants';
import { format, clamp, easeOutBack } from '../utils/math';
import { drawDropimal, drawDropimalIcon } from './animals';
import { drawButton, drawToggle } from './hud';
import { predictLandingY } from '../game/physics';

export function drawDropPreview(): void {
  if (state.gameOver || !state.canDrop) return;

  const d = DROPIMALS[state.currentTier];
  const clampedX = clamp(state.dropX, LEFT + d.r + 2, RIGHT - d.r - 2);
  state.dropX = clampedX;

  const landY = predictLandingY(clampedX, d.r);

  ctx.save();

  // Guide beam down to the predicted landing spot
  const beam = ctx.createLinearGradient(clampedX, DROP_Y, clampedX, landY);
  beam.addColorStop(0, 'rgba(255,255,255,.20)');
  beam.addColorStop(1, 'rgba(255,255,255,.04)');
  ctx.strokeStyle = beam;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  ctx.moveTo(clampedX, DROP_Y + d.r + 7);
  ctx.lineTo(clampedX, landY - d.r);
  ctx.stroke();
  ctx.setLineDash([]);

  // Ghost of where it will rest
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = d.c1;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.arc(clampedX, landY, d.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // The held Dropimal, gently bobbing
  const bob = Math.sin(state.time * 3.2) * 3;
  ctx.globalAlpha = 0.95;
  drawDropimal(clampedX, DROP_Y + bob, state.currentTier, 0, { lookY: 0.6 });
  ctx.globalAlpha = 1;

  ctx.restore();
}

export function drawStartHint(): void {
  if (state.drops > 0) return;
  ctx.save();
  const pulse = 0.75 + Math.sin(state.time * 6) * 0.12;

  ctx.globalAlpha = pulse;
  ctx.fillStyle = 'rgba(0,0,0,.45)';
  roundRect(68, 280, 284, 76, 26);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.18)';
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '1000 18px ui-rounded, system-ui, sans-serif';
  ctx.fillText('Drag to aim, release to drop', GW / 2, 310);

  ctx.fillStyle = 'rgba(255,255,255,.72)';
  ctx.font = '800 12px ui-rounded, system-ui, sans-serif';
  ctx.fillText('Match two of the same Dropimal to evolve', GW / 2, 335);

  ctx.restore();
}

/** Big celebration banner (discovery / fever / new best / streak). */
export function drawBanner(): void {
  const b = state.banner;
  if (!b) return;

  const inT = clamp(b.age / 0.3, 0, 1);
  const outT = clamp((b.life - b.age) / 0.4, 0, 1);
  const scale = easeOutBack(inT);
  const alpha = Math.min(inT * 2, outT);

  ctx.save();
  ctx.translate(GW / 2, 250);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  const hasIcon = b.tier != null;
  const h = hasIcon ? 132 : 86;

  ctx.fillStyle = 'rgba(10,14,34,.88)';
  roundRect(-160, -h / 2, 320, h, 24);
  ctx.fill();
  ctx.strokeStyle = b.color;
  ctx.lineWidth = 2.5;
  roundRect(-160, -h / 2, 320, h, 24);
  ctx.stroke();

  let textY = hasIcon ? 14 : -6;
  if (hasIcon && b.tier != null) {
    drawDropimalIcon(0, -h / 2 + 36, b.tier, 30);
    textY = 28;
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = b.color;
  ctx.font = '1000 26px ui-rounded, system-ui, sans-serif';
  ctx.fillText(b.title, 0, textY);

  ctx.fillStyle = 'rgba(255,255,255,.78)';
  ctx.font = '800 13px ui-rounded, system-ui, sans-serif';
  ctx.fillText(b.subtitle, 0, textY + 24);

  ctx.restore();
}

// ── Menu ─────────────────────────────────────────────────────────────────────

export function drawMenu(): void {
  ctx.save();

  // Decorative floating animals
  const decor: Array<[number, number, number, number]> = [
    [70, 180, 2, 0.0], [350, 160, 4, 1.5], [60, 560, 5, 3.0],
    [355, 540, 3, 4.2], [212, 714, 6, 2.1],
  ];
  for (const [x, y, tier, phase] of decor) {
    const bob = Math.sin(state.time * 1.6 + phase) * 8;
    const k = 0.55;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(k, k);
    ctx.globalAlpha = 0.9;
    drawDropimal(0, 0, tier, Math.sin(state.time * 0.9 + phase) * 0.12, {});
    ctx.restore();
  }

  // Logo
  ctx.textAlign = 'center';
  const wob = Math.sin(state.time * 2.2) * 3;
  ctx.save();
  ctx.translate(GW / 2, 235 + wob);
  ctx.rotate(Math.sin(state.time * 1.1) * 0.02);
  const lg = ctx.createLinearGradient(-150, -30, 150, 30);
  lg.addColorStop(0, '#66f7ff');
  lg.addColorStop(0.5, '#bda8ff');
  lg.addColorStop(1, '#ff8fd6');
  ctx.lineWidth = 10;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(8,10,28,.9)';
  ctx.font = '1000 52px ui-rounded, system-ui, sans-serif';
  ctx.strokeText('DROPIMALS', 0, 0);
  ctx.fillStyle = lg;
  ctx.fillText('DROPIMALS', 0, 0);
  ctx.restore();

  ctx.fillStyle = 'rgba(255,255,255,.75)';
  ctx.font = '900 15px ui-rounded, system-ui, sans-serif';
  ctx.fillText('Drop · Merge · Evolve', GW / 2, 272);

  // Best + streak chips
  const p = state.profile;
  let chips = 'BEST  ' + format(p.highScore);
  if (p.streak >= 2) chips += '      DAY ' + p.streak + ' STREAK';
  ctx.fillStyle = 'rgba(0,0,0,.30)';
  roundRect(GW / 2 - 130, 308, 260, 36, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.14)';
  ctx.stroke();
  ctx.fillStyle = '#fff6a8';
  ctx.font = '900 14px ui-rounded, system-ui, sans-serif';
  ctx.fillText(chips, GW / 2, 331);

  // Buttons
  const playPulse = 1 + Math.sin(state.time * 4) * 0.02;
  const pb = BTN.play;
  ctx.save();
  ctx.translate(pb.x + pb.w / 2, pb.y + pb.h / 2);
  ctx.scale(playPulse, playPulse);
  ctx.translate(-(pb.x + pb.w / 2), -(pb.y + pb.h / 2));
  drawButton(pb, 'PLAY', { primary: true, fontSize: 24 });
  ctx.restore();

  const found = p.discovered.filter(Boolean).length;
  drawButton(BTN.dex, `DROPIDEX  ${found}/${MAX_TIER + 1}`, { fontSize: 16 });

  drawToggle(BTN.soundMenu, 'SFX', !p.muted);
  drawToggle(BTN.musicMenu, '♪', !p.musicMuted);

  ctx.restore();
}

// ── Pause ────────────────────────────────────────────────────────────────────

export function drawPauseOverlay(): void {
  ctx.save();
  ctx.fillStyle = 'rgba(8,10,26,.78)';
  ctx.fillRect(0, 0, GW, GH);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '1000 38px ui-rounded, system-ui, sans-serif';
  ctx.fillText('PAUSED', GW / 2, 215);

  drawButton(BTN.resume, 'RESUME', { primary: true, fontSize: 20 });
  drawButton(BTN.restart, 'RESTART');
  drawButton(BTN.toMenu, 'MAIN MENU');
  drawToggle(BTN.soundPause, 'SFX', !state.profile.muted);
  drawToggle(BTN.musicPause, '♪', !state.profile.musicMuted);

  ctx.restore();
}

// ── Game over ────────────────────────────────────────────────────────────────

export function drawGameOver(): void {
  if (!state.overPanelReady) return;

  ctx.save();
  ctx.fillStyle = 'rgba(8,10,26,.78)';
  ctx.fillRect(0, 0, GW, GH);

  const isRecord = state.score > state.prevBest && state.score > 0;

  ctx.fillStyle = 'rgba(255,255,255,.10)';
  roundRect(36, 128, 348, 494, 30);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.18)';
  ctx.lineWidth = 1.5;
  roundRect(36, 128, 348, 494, 30);
  ctx.stroke();

  ctx.textAlign = 'center';
  if (isRecord) {
    const hue = (state.time * 120) % 360;
    ctx.fillStyle = `hsl(${hue}, 90%, 72%)`;
    ctx.font = '1000 38px ui-rounded, system-ui, sans-serif';
    ctx.fillText('NEW BEST!', GW / 2, 184);
  } else {
    ctx.fillStyle = '#ff8fd6';
    ctx.font = '1000 38px ui-rounded, system-ui, sans-serif';
    ctx.fillText('BOX FULL!', GW / 2, 184);
  }

  ctx.fillStyle = 'rgba(255,255,255,.6)';
  ctx.font = '800 13px ui-rounded, system-ui, sans-serif';
  ctx.fillText(isRecord ? 'A score for the history books.' : 'So close — one more try?', GW / 2, 210);

  // Score panel
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  roundRect(76, 232, 268, 96, 22);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.font = '900 11px ui-rounded, system-ui, sans-serif';
  ctx.fillText('FINAL SCORE', GW / 2, 258);
  ctx.fillStyle = '#fff6a8';
  ctx.font = '1000 42px ui-rounded, system-ui, sans-serif';
  ctx.fillText(format(Math.floor(state.displayScore)), GW / 2, 304);

  // Stats row
  const stats: Array<[string, string]> = [
    ['MERGES', String(state.merges)],
    ['MAX COMBO', 'x' + Math.max(1, state.maxCombo)],
    ['MISSIONS', String(state.missionsDone)],
  ];
  stats.forEach(([label, value], i) => {
    const x = 110 + i * 100;
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.font = '900 9px ui-rounded, system-ui, sans-serif';
    ctx.fillText(label, x, 352);
    ctx.fillStyle = '#8ffbff';
    ctx.font = '1000 19px ui-rounded, system-ui, sans-serif';
    ctx.fillText(value, x, 374);
  });

  // Biggest animal + run discoveries
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.font = '900 10px ui-rounded, system-ui, sans-serif';
  ctx.fillText('BIGGEST DROPIMAL', GW / 2, 402);
  drawDropimalIcon(GW / 2 - (state.runDiscoveries.length ? 50 : 0), 432, state.bestTier, 22);

  if (state.runDiscoveries.length) {
    ctx.fillStyle = '#9dff74';
    ctx.font = '900 10px ui-rounded, system-ui, sans-serif';
    ctx.fillText('+' + state.runDiscoveries.length + ' NEW', GW / 2 + 50, 412);
    state.runDiscoveries.slice(0, 3).forEach((t, i) => {
      drawDropimalIcon(GW / 2 + 25 + i * 26, 436, t, 12);
    });
  }

  drawButton(BTN.again, 'PLAY AGAIN', { primary: true, fontSize: 21 });
  drawButton(BTN.overMenu, 'MAIN MENU', { fontSize: 15 });

  ctx.restore();
}

// ── Dropidex ─────────────────────────────────────────────────────────────────

export function drawDex(): void {
  ctx.save();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '1000 30px ui-rounded, system-ui, sans-serif';
  ctx.fillText('DROPIDEX', GW / 2, 64);

  const p = state.profile;
  const found = p.discovered.filter(Boolean).length;
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  ctx.font = '800 13px ui-rounded, system-ui, sans-serif';
  ctx.fillText(found + ' of ' + (MAX_TIER + 1) + ' discovered', GW / 2, 90);

  for (let i = 0; i <= MAX_TIER; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 22 + col * 192;
    const y = 112 + row * 102;
    const d = DROPIMALS[i];
    const isFound = p.discovered[i];

    ctx.fillStyle = isFound ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.04)';
    roundRect(x, y, 184, 94, 18);
    ctx.fill();
    ctx.strokeStyle = isFound ? d.c1 + '55' : 'rgba(255,255,255,.08)';
    ctx.lineWidth = 1.5;
    roundRect(x, y, 184, 94, 18);
    ctx.stroke();

    drawDropimalIcon(x + 44, y + 47, i, 30, !isFound);

    ctx.textAlign = 'left';
    if (isFound) {
      ctx.fillStyle = d.c1;
      ctx.font = '1000 15px ui-rounded, system-ui, sans-serif';
      ctx.fillText(d.name, x + 86, y + 40);
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      ctx.font = '800 11px ui-rounded, system-ui, sans-serif';
      ctx.fillText(d.points + ' pts', x + 86, y + 60);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.font = '1000 15px ui-rounded, system-ui, sans-serif';
      ctx.fillText('???', x + 86, y + 40);
      ctx.fillStyle = 'rgba(255,255,255,.22)';
      ctx.font = '800 10px ui-rounded, system-ui, sans-serif';
      ctx.fillText('Merge to discover', x + 86, y + 60);
    }
    ctx.textAlign = 'center';
  }

  drawButton(BTN.dexBack, 'BACK', { fontSize: 17 });

  ctx.restore();
}
