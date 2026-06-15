import { ctx, roundRect } from './canvas';
import { state } from '../state';
import { DROPIMALS, MAX_TIER } from '../data/dropimals';
import { BTN, GW, GH, LEFT, RIGHT, DROP_Y, CONTINUE_OFFER } from '../constants';
import { formatScore, clamp, easeOutBack } from '../utils/math';
import { drawDropimal, drawDropimalIcon } from './animals';
import { drawButton, drawToggle, drawSlider } from './hud';
import { drawTopBar, drawBadge, drawCoin } from './meta';
import { predictLandingY } from '../game/physics';
import { totalClaimable } from '../meta/orders';
import { claimableSeason } from '../meta/season';
import { claimableAchievements } from '../meta/achievements';
import { MAX_CHARGE, xpForLevel } from '../meta/profile';
import { masteryLevel, masteryFrac, masteryNext, MASTERY_MAX } from '../meta/mastery';

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

  const p = state.profile;
  // First-time players (never started a run) get a deliberately minimal menu —
  // logo, tagline and the PLAY hero. The progression dashboard (level/XP,
  // currencies, best, Dropidex, rewards, bonus charge) only appears once they've
  // played a game, so a brand-new CrazyGames visitor isn't met with a wall of
  // zeroes. Input gating in input.ts mirrors this so hidden buttons aren't
  // phantom-clickable.
  const firstTime = p.games === 0;

  if (!firstTime) drawTopBar();

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

  // Personalised greeting for signed-in CrazyGames players.
  if (state.cgUsername) {
    ctx.fillStyle = '#8ffbff';
    ctx.font = '900 13px ui-rounded, system-ui, sans-serif';
    ctx.fillText((firstTime ? 'Welcome, ' : 'Welcome back, ') + state.cgUsername + '!', GW / 2, 130);
  }

  // Returning players see their best + streak; first-timers get a one-line nudge
  // about the core mechanic instead of a meaningless "BEST 0" plate.
  ctx.textAlign = 'center';
  if (!firstTime) {
    let chips = 'BEST  ' + formatScore(p.highScore);
    if (p.streak >= 2) chips += '      DAY ' + p.streak + ' STREAK';
    ctx.fillStyle = 'rgba(0,0,0,.30)';
    roundRect(GW / 2 - 130, 308, 260, 36, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.14)';
    ctx.stroke();
    ctx.fillStyle = '#fff6a8';
    ctx.font = '900 14px ui-rounded, system-ui, sans-serif';
    ctx.fillText(chips, GW / 2, 331);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,.62)';
    ctx.font = '800 14px ui-rounded, system-ui, sans-serif';
    ctx.fillText('Match two of the same to evolve!', GW / 2, 331);
  }

  // ── PLAY: the hero CTA ──
  // The ONE glowing, pulsing, primary-coloured action on the screen, with a ▶
  // icon so it reads as "start" in any language. Everything else here is calmer
  // (secondary styling, no glow) so a first-time CrazyGames player can't miss it.
  const pb = BTN.play;
  const cx = pb.x + pb.w / 2;
  const cy = pb.y + pb.h / 2;
  const calm = state.profile.reducedMotion;
  const beat = calm ? 0 : Math.sin(state.time * 3.4);
  const pulse = 1 + beat * 0.025;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pulse, pulse);
  ctx.translate(-cx, -cy);

  const pg = ctx.createLinearGradient(pb.x, pb.y, pb.x + pb.w, pb.y + pb.h);
  pg.addColorStop(0, '#66f7ff');
  pg.addColorStop(0.5, '#8d7aff');
  pg.addColorStop(1, '#ff8fd6');
  if (!calm) {
    ctx.shadowColor = 'rgba(125,225,255,.75)';
    ctx.shadowBlur = 26 + (beat + 1) * 7;
  }
  ctx.fillStyle = pg;
  roundRect(pb.x, pb.y, pb.w, pb.h, 24);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.lineWidth = 2;
  roundRect(pb.x, pb.y, pb.w, pb.h, 24);
  ctx.stroke();

  // ▶ glyph + label, centred together as one group.
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '1000 32px ui-rounded, system-ui, sans-serif';
  const label = 'PLAY';
  const tw = ctx.measureText(label).width;
  const iconW = 24, gap = 16;
  const startX = cx - (iconW + gap + tw) / 2;
  ctx.beginPath();
  ctx.moveTo(startX, cy - 13);
  ctx.lineTo(startX, cy + 13);
  ctx.lineTo(startX + iconW, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillText(label, startX + iconW + gap, cy + 1);
  ctx.restore();
  ctx.textBaseline = 'alphabetic';

  // ── Secondary row + bonus charge: returning players only ──
  if (!firstTime) {
    const found = p.discovered.filter(Boolean).length;
    drawButton(BTN.dex, `DEX ${found}/${MAX_TIER + 1}`, { fontSize: 14 });
    drawButton(BTN.rewards, 'REWARDS', { fontSize: 14 });
    drawBadge(BTN.rewards.x + BTN.rewards.w - 8, BTN.rewards.y + 6,
      totalClaimable() + claimableSeason() + claimableAchievements());

    // Bonus-charge pips: full at day start, each charged run gives bonus XP.
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.font = '800 10px ui-rounded, system-ui, sans-serif';
    ctx.fillText('BONUS CHARGE', GW / 2 - 30, 552);
    for (let i = 0; i < MAX_CHARGE; i++) {
      ctx.fillStyle = i < p.charge ? '#fff6a8' : 'rgba(255,255,255,.18)';
      ctx.beginPath(); ctx.arc(GW / 2 + 26 + i * 16, 548, 5, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawToggle(BTN.soundMenu, 'SFX', !p.muted);
  drawSlider(BTN.sfxSliderMenu, p.sfxVolume, !p.muted);
  drawToggle(BTN.musicMenu, '♪', !p.musicMuted);
  drawSlider(BTN.musicSliderMenu, p.musicVolume, !p.musicMuted);

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
  drawSlider(BTN.sfxSliderPause, state.profile.sfxVolume, !state.profile.muted);
  drawToggle(BTN.musicPause, '♪', !state.profile.musicMuted);
  drawSlider(BTN.musicSliderPause, state.profile.musicVolume, !state.profile.musicMuted);

  ctx.restore();
}

// ── Second chance (rewarded-ad revive offer) ─────────────────────────────────

export function drawContinueOffer(): void {
  ctx.save();
  ctx.fillStyle = 'rgba(8,10,26,.80)';
  ctx.fillRect(0, 0, GW, GH);

  // Panel
  ctx.fillStyle = 'rgba(255,255,255,.10)';
  roundRect(40, 168, 340, 408, 30);
  ctx.fill();
  ctx.strokeStyle = '#8ffbff';
  ctx.lineWidth = 2;
  roundRect(40, 168, 340, 408, 30);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff8fd6';
  ctx.font = '1000 34px ui-rounded, system-ui, sans-serif';
  ctx.fillText('BOX FULL!', GW / 2, 224);

  ctx.fillStyle = '#ffffff';
  ctx.font = '1000 22px ui-rounded, system-ui, sans-serif';
  ctx.fillText('One more chance?', GW / 2, 258);

  ctx.fillStyle = 'rgba(255,255,255,.66)';
  ctx.font = '800 13px ui-rounded, system-ui, sans-serif';
  ctx.fillText('Watch a short ad to clear some space', GW / 2, 286);
  ctx.fillText('and keep your run going.', GW / 2, 304);

  // Score reminder
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.font = '900 11px ui-rounded, system-ui, sans-serif';
  ctx.fillText('CURRENT SCORE', GW / 2, 342);
  ctx.fillStyle = '#fff6a8';
  ctx.font = '1000 34px ui-rounded, system-ui, sans-serif';
  ctx.fillText(formatScore(state.displayScore), GW / 2, 380);

  if (state.continuePending) {
    // Ad is loading/playing — replace the controls with a status line.
    const dots = '.'.repeat(1 + (Math.floor(state.time * 2) % 3));
    ctx.fillStyle = '#8ffbff';
    ctx.font = '1000 18px ui-rounded, system-ui, sans-serif';
    ctx.fillText('Loading ad' + dots, GW / 2, 470);
    ctx.restore();
    return;
  }

  // Countdown bar
  const t = clamp(state.continueTimer / CONTINUE_OFFER, 0, 1);
  ctx.fillStyle = 'rgba(255,255,255,.14)';
  roundRect(90, 398, 240, 7, 3.5);
  ctx.fill();
  ctx.fillStyle = t > 0.34 ? '#8ffbff' : '#ff8f8f';
  roundRect(90, 398, 240 * t, 7, 3.5);
  ctx.fill();

  drawButton(BTN.continueWatch, 'WATCH AD  &  CONTINUE', { primary: true, fontSize: 17 });
  drawButton(BTN.continueDecline, 'NO THANKS  (' + Math.ceil(state.continueTimer) + ')', { fontSize: 14 });

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
  const finalText = formatScore(state.displayScore);
  ctx.save();
  ctx.translate(GW / 2, 304);
  ctx.font = '1000 42px ui-rounded, system-ui, sans-serif';
  ctx.scale(Math.min(1, 248 / Math.max(1, ctx.measureText(finalText).width)), 1);
  ctx.fillStyle = '#fff6a8';
  ctx.fillText(finalText, 0, 0);
  ctx.restore();

  // Compact run stats
  const stats: Array<[string, string]> = [
    ['MERGES', String(state.merges)],
    ['MAX COMBO', 'x' + Math.max(1, state.maxCombo)],
    ['BIGGEST', DROPIMALS[state.bestTier].name],
  ];
  stats.forEach(([label, value], i) => {
    const x = 110 + i * 100;
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.font = '900 9px ui-rounded, system-ui, sans-serif';
    ctx.fillText(label, x, 346);
    ctx.fillStyle = '#8ffbff';
    ctx.font = '1000 14px ui-rounded, system-ui, sans-serif';
    ctx.fillText(value, x, 366);
  });

  // ── Reward stack (the retention payoff, doc §4) ──
  const rr = state.runReward;
  if (rr) {
    const p = state.profile;
    // XP + level bar
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.font = '900 10px ui-rounded, system-ui, sans-serif';
    ctx.fillText('LEVEL ' + p.level, 60, 392);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#9dff74';
    ctx.font = '1000 12px ui-rounded, system-ui, sans-serif';
    ctx.fillText('+' + rr.xp + ' XP' + (rr.levelsGained ? '  ·  +' + rr.levelsGained + ' LV!' : ''), 360, 392);

    ctx.fillStyle = 'rgba(255,255,255,.14)';
    roundRect(60, 398, 300, 7, 3.5); ctx.fill();
    const g = ctx.createLinearGradient(60, 0, 360, 0);
    g.addColorStop(0, '#66f7ff'); g.addColorStop(1, '#ff8fd6');
    ctx.fillStyle = g;
    roundRect(60, 398, 300 * clamp(p.xp / xpForLevel(p.level), 0, 1), 7, 3.5); ctx.fill();

    // Coins + season chips
    drawCoin(72, 424, 7);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '1000 13px ui-rounded, system-ui, sans-serif';
    ctx.fillText('+' + rr.coins, 84, 429);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#b28cff';
    ctx.font = '1000 12px ui-rounded, system-ui, sans-serif';
    ctx.fillText('+' + rr.seasonXp + ' Season XP', 360, 429);

    // Medals
    if (rr.medals.length) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff6a8';
      ctx.font = '900 10px ui-rounded, system-ui, sans-serif';
      const names = rr.medals.slice(0, 3).map(m => m.name).join('  ·  ');
      ctx.fillText('🏅 ' + names, GW / 2, 452);
    }

    // Next best action
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    roundRect(60, 460, 300, 26, 13); ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8ffbff';
    ctx.font = '800 11px ui-rounded, system-ui, sans-serif';
    ctx.fillText(rr.nextAction, GW / 2, 477);
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
      ctx.fillText(d.name, x + 86, y + 30);
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      ctx.font = '800 10px ui-rounded, system-ui, sans-serif';
      ctx.fillText(formatScore(d.points) + ' pts', x + 86, y + 46);

      // Mastery — usage level, progress bar, and next reward.
      const mlvl = masteryLevel(i);
      const maxed = mlvl >= MASTERY_MAX;
      ctx.fillStyle = '#7fdcff';
      ctx.font = '900 9px ui-rounded, system-ui, sans-serif';
      ctx.fillText('MASTERY ' + (maxed ? 'MAX' : 'Lv ' + mlvl), x + 86, y + 64);
      ctx.fillStyle = 'rgba(255,255,255,.12)';
      roundRect(x + 86, y + 70, 82, 6, 3); ctx.fill();
      ctx.fillStyle = maxed ? '#9dff74' : '#7fdcff';
      roundRect(x + 86, y + 70, 82 * masteryFrac(i), 6, 3); ctx.fill();
      if (!maxed) {
        ctx.fillStyle = 'rgba(255,255,255,.4)';
        ctx.font = '700 8px ui-rounded, system-ui, sans-serif';
        ctx.fillText('Next +' + (3 + mlvl) + ' shards · ' + masteryNext(i) + ' uses', x + 86, y + 86);
      }
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
