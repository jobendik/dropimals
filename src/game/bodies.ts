import { state } from '../state';
import { DROPIMALS, MAX_TIER, MAX_DROP_TIER } from '../data/dropimals';
import {
  LEFT, RIGHT, DROP_Y, DANGER_Y, DROP_COOLDOWN, COMBO_WINDOW,
  FEVER_COMBO, FEVER_TIME, OVERFLOW_GRACE, NUDGE_PER_MERGE, CONTINUE_OFFER,
} from '../constants';
import { clamp } from '../utils/math';
import { addParticles, addFloater, burstConfetti, showBanner, haptic } from './fx';
import {
  sfxDrop, sfxMerge, sfxNudge, sfxDiscovery, sfxFever, sfxNewBest,
  sfxGameOver, sfxCascadePop, sfxWarning, startMusic,
} from '../audio/audio';
import { updateMissionForMerge, makeMission } from './missions';
import { touchDailyStreak, commitScore, saveProfile } from '../utils/storage';
import {
  cgGameplayStart, cgGameplayStop, cgHappyTime, cgMidgameAd, cgSubmitScore,
  cgRewardedAd, cgRewardedAvailable,
} from '../platform/crazygames';
import type { Body } from '../types';

export function randomDropTier(): number {
  const { bestTier } = state;

  // Pool grows with progress so early game stays simple.
  const weights: number[] = [10, 7, 4];
  if (bestTier >= 4) weights.push(2.5);
  if (bestTier >= 6) weights.push(1.5);

  const pick = (): number => {
    let total = 0;
    for (const w of weights) total += w;
    let roll = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return Math.min(i, MAX_DROP_TIER);
    }
    return 0;
  };

  // Anti-streak: reroll once if the same tier came up three times in a row.
  let tier = pick();
  const recent = state.lastDropTiers;
  if (recent.length >= 2 && recent[recent.length - 1] === tier && recent[recent.length - 2] === tier) {
    tier = pick();
  }
  recent.push(tier);
  if (recent.length > 4) recent.shift();
  return tier;
}

let sessionRuns = 0;
let runStarting = false;

export async function startRun(): Promise<void> {
  if (runStarting) return; // guard against double-taps while an ad loads
  runStarting = true;
  try {
    // Show an interstitial between runs — but never before the first game of a
    // session (first impressions matter, and the platform disables ads during a
    // Basic Launch anyway). The previous screen stays visible during the ad.
    if (sessionRuns > 0) await cgMidgameAd();
    sessionRuns++;

    resetGame();
    state.screen = 'play';
    state.profile.games++;
    const newDay = touchDailyStreak();
    saveProfile();
    cgGameplayStart();
    startMusic('game');

    if (newDay && state.profile.streak >= 2) {
      // Daily comeback reward: head start on the nudge meter.
      state.nudgeCharge = Math.min(1, 0.25 + state.profile.streak * 0.15);
      showBanner('DAY ' + state.profile.streak + ' STREAK!', 'Nudge meter head start', '#8ffbff', 2.4);
    }
  } finally {
    runStarting = false;
  }
}

export function resetGame(): void {
  state.bodies     = [];
  state.particles  = [];
  state.floaters   = [];
  state.shockwaves = [];
  state.confetti   = [];
  state.banner     = null;

  state.score          = 0;
  state.displayScore   = 0;
  state.scorePulse     = 0;
  state.bestTier       = 0;
  state.merges         = 0;
  state.drops          = 0;
  state.lastDropTiers  = [];
  state.currentTier    = randomDropTier();
  state.nextTier       = randomDropTier();
  state.swapUsed       = false;
  state.dropX          = 210;
  state.canDrop        = true;
  state.dropCooldown   = 0;
  state.dangerTime     = 0;
  state.gameOver       = false;
  state.cascadeTimer   = -1;
  state.cascadeBonus   = 0;
  state.overPanelReady = false;
  state.reviveUsed     = false;
  state.continueTimer  = 0;
  state.continuePending = false;
  state.combo          = 0;
  state.comboTimer     = 0;
  state.maxCombo       = 0;
  state.fever          = 0;
  state.nudgeCharge    = 0;
  state.newBestShown   = false;
  state.prevBest       = state.profile.highScore;
  state.missionIndex   = 0;
  state.missionsDone   = 0;
  state.mission        = makeMission();
  state.idCounter      = 1;
  state.shake          = 0;
  state.flash          = 0;
  state.hitstop        = 0;
  state.runDiscoveries = [];
}

export function createBody(x: number, y: number, tier: number): Body {
  const r = DROPIMALS[tier].r;
  return {
    id: state.idCounter++,
    x, y,
    vx: (Math.random() - 0.5) * 12,
    vy: 0,
    r,
    tier,
    mass: Math.max(1, r * r * 0.001),
    age: 0,
    mergeLock: 0,
    wobble: Math.random() * Math.PI * 2,
    angle: Math.random() * Math.PI * 2,
    av: (Math.random() - 0.5) * 0.8,
    squash: 1,
    squashV: 0,
    blink: 1 + Math.random() * 5,
    remove: false,
  };
}

export function dropCurrent(): void {
  if (state.gameOver || !state.canDrop) return;
  const d = DROPIMALS[state.currentTier];
  const x = clamp(state.dropX, LEFT + d.r + 2, RIGHT - d.r - 2);
  const body = createBody(x, DROP_Y, state.currentTier);
  body.vy = 20;
  body.angle = 0;
  body.av = (Math.random() - 0.5) * 0.4;
  state.bodies.push(body);

  state.drops++;
  state.canDrop      = false;
  state.dropCooldown = DROP_COOLDOWN;
  state.swapUsed     = false;

  sfxDrop(state.currentTier);
  addParticles(x, DROP_Y, d.c1, 10, 0.5);
}

export function spawnNext(): void {
  state.currentTier = state.nextTier;
  state.nextTier    = randomDropTier();
  state.canDrop     = true;
}

/** Swap the held Dropimal with the next one. One free swap per drop. */
export function swapNext(): void {
  if (state.gameOver || !state.canDrop || state.swapUsed) return;
  const t = state.currentTier;
  state.currentTier = state.nextTier;
  state.nextTier = t;
  state.swapUsed = true;
  addFloater('SWAP', state.dropX, DROP_Y - 36, '#8ffbff', 0.5, 15);
}

export function useNudge(): void {
  if (state.gameOver || state.nudgeCharge < 1) return;
  state.nudgeCharge = 0;
  state.shake = 10;

  for (const b of state.bodies) {
    b.vx += (Math.random() - 0.5) * 220;
    b.vy -= 95 + Math.random() * 60;
    b.av += (Math.random() - 0.5) * 2.5;
    b.mergeLock = Math.max(b.mergeLock, 0.05);
    b.squash = 0.8;
  }

  addFloater('NUDGE!', 210, 380, '#8ffbff', 0.8, 36);
  state.shockwaves.push({ x: 210, y: 420, r: 0, life: 0.65, age: 0, color: '#8ffbff' });
  sfxNudge();
  haptic(25);
}

export function processMerges(): void {
  const used = new Set<number>();
  const mergesToDo: Array<{ a: Body; b: Body; x: number; y: number; tier: number }> = [];

  for (let i = 0; i < state.bodies.length; i++) {
    const a = state.bodies[i];
    if (used.has(a.id) || a.mergeLock > 0 || a.age < 0.08) continue;

    for (let j = i + 1; j < state.bodies.length; j++) {
      const b = state.bodies[j];
      if (used.has(b.id) || b.mergeLock > 0 || b.age < 0.08) continue;
      if (a.tier !== b.tier) continue;

      // Accept "touching or nearly touching" — solver leaves circles almost exactly at contact
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      if (dist <= a.r + b.r + 4) {
        used.add(a.id);
        used.add(b.id);
        mergesToDo.push({ a, b, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, tier: a.tier });
        break;
      }
    }
  }

  if (!mergesToDo.length) return;

  for (const m of mergesToDo) { m.a.remove = true; m.b.remove = true; }
  state.bodies = state.bodies.filter(b => !b.remove);
  for (const m of mergesToDo) doMerge(m);
}

function discover(tier: number): void {
  if (state.profile.discovered[tier]) return;
  state.profile.discovered[tier] = true;
  state.runDiscoveries.push(tier);
  saveProfile();
  showBanner('NEW DROPIMAL!', DROPIMALS[tier].name + ' joined your Dropidex', DROPIMALS[tier].c1, 2.6, tier);
  burstConfetti(210, 250, 70);
  sfxDiscovery();
  cgHappyTime();
  state.flash = Math.max(state.flash, 0.35);
}

function doMerge(m: { x: number; y: number; tier: number }): void {
  state.merges++;
  state.profile.totalMerges++;
  state.combo      = state.comboTimer > 0 ? state.combo + 1 : 1;
  state.comboTimer = COMBO_WINDOW;
  state.maxCombo   = Math.max(state.maxCombo, state.combo);
  state.nudgeCharge = Math.min(1, state.nudgeCharge + NUDGE_PER_MERGE);

  // Fever mode: chain enough merges and everything is worth double.
  if (state.combo >= FEVER_COMBO && state.fever <= 0) {
    state.fever = FEVER_TIME;
    showBanner('FEVER!', 'Double points — keep the chain alive!', '#ff8fd6', 2.0);
    sfxFever();
    cgHappyTime();
    state.flash = Math.max(state.flash, 0.3);
  }

  const feverMult = state.fever > 0 ? 2 : 1;

  if (m.tier >= MAX_TIER) {
    // Two Luna Whales merge into pure points — the legendary pop.
    const bonus = Math.floor(3000 * (1 + Math.min(8, state.combo - 1) * 0.22)) * feverMult;
    state.score += bonus;
    addFloater('LEGENDARY POP +' + bonus, m.x, m.y - 18, '#fff6a8', 1.3, 26);
    addParticles(m.x, m.y, '#ffffff', 90, 2.0);
    burstConfetti(m.x, m.y, 90);
    state.shockwaves.push({ x: m.x, y: m.y, r: 0, life: 0.8, age: 0, color: '#fff6a8' });
    sfxMerge(MAX_TIER, state.combo);
    sfxDiscovery();
    cgHappyTime();
    state.shake = 14;
    state.hitstop = Math.max(state.hitstop, 0.1);
    haptic(40);
    return;
  }

  const next = m.tier + 1;
  state.bestTier = Math.max(state.bestTier, next);
  const nd = DROPIMALS[next];

  const multiplier = (1 + Math.min(7, state.combo - 1) * 0.25) * feverMult;
  const earned = Math.floor(nd.points * multiplier);
  state.score += earned;
  state.scorePulse = 1;

  const nb = createBody(m.x, m.y, next);
  nb.mergeLock = 0.10;
  nb.vy = -80;
  nb.vx = (Math.random() - 0.5) * 70;
  nb.av = (Math.random() - 0.5) * 1.6;
  nb.squash = 0.55; // pop-in overshoot
  state.bodies.push(nb);

  addParticles(m.x, m.y, nd.c1, 22 + next * 4, 1 + next * 0.08);
  state.shockwaves.push({ x: m.x, y: m.y, r: 0, life: 0.48 + next * 0.025, age: 0, color: nd.c1 });

  const comboText = state.combo >= 2 ? '  x' + state.combo : '';
  addFloater('+' + earned + comboText, m.x, m.y - nd.r * 0.45, state.fever > 0 ? '#ff8fd6' : '#ffffff', 0.8, 22);
  if (next >= 4) addFloater(nd.name + '!', m.x, m.y + nd.r * 0.15, nd.c1, 0.9, 18);

  if (next >= 5) {
    state.shake = Math.max(state.shake, 4 + next * 0.7);
    state.hitstop = Math.max(state.hitstop, 0.03 + next * 0.007);
    haptic(15 + next * 3);
  } else {
    haptic(8);
  }

  // Crossing your all-time best mid-run deserves a moment.
  if (!state.newBestShown && state.prevBest > 0 && state.score > state.prevBest) {
    state.newBestShown = true;
    showBanner('NEW BEST!', 'You beat ' + state.prevBest + ' points', '#fff6a8', 2.2);
    burstConfetti(210, 220, 60);
    sfxNewBest();
    cgHappyTime();
  }

  discover(next);
  updateMissionForMerge(next);
  sfxMerge(next, state.combo);
}

export function checkOverflow(dt: number): void {
  let overflowing = false;

  for (const b of state.bodies) {
    // A body counts as overflow if its top is above the line and it is NOT the
    // piece currently dropping in from above. Everything else above the line is
    // genuinely stuck there — and "stuck" includes jostling: on a live, packed
    // board the top pieces are constantly shoved by new drops and merges, so
    // their vy swings around. Earlier, tight "is it settled" gates
    // (`speed < 42`, or a narrow vy window) flickered on/off every frame, and
    // because dangerTime decays at 1.8x it never reached the grace — the box
    // could be visibly overflowing yet the run never ended.
    //
    // So exclude only the two transient, legitimate above-line cases:
    //   • the in-flight drop free-falling through the zone → large +vy (~380)
    //   • a piece just spawned this instant (drop / merge)  → age < 0.35
    // A fast collapse momentarily reads >200 and is skipped that frame, but a
    // truly stuck piece slows below 200 and accumulates. Result: any piece that
    // lingers above the line for the grace ends the run, jitter and all.
    if (b.y - b.r < DANGER_Y && b.age > 0.35 && b.vy < 200) {
      overflowing = true;
      break;
    }
  }

  if (overflowing) {
    state.dangerTime += dt;
    if (state.dangerTime > OVERFLOW_GRACE) triggerGameOver();
  } else {
    state.dangerTime = Math.max(0, state.dangerTime - dt * 1.8);
  }
}

let cascadeStep = 0;

function triggerGameOver(): void {
  if (state.gameOver) return;
  state.gameOver = true;
  state.canDrop  = false;
  state.shake    = 15;

  // Offer a one-time second chance before ending the run. The board freezes
  // under the offer; declining or letting it expire starts the cascade.
  if (!state.reviveUsed && cgRewardedAvailable()) {
    state.screen          = 'continue';
    state.continueTimer   = CONTINUE_OFFER;
    state.continuePending = false;
    state.cascadeTimer    = -1;
    cgGameplayStop(); // gameplay pauses for the decision / rewarded ad
    sfxWarning();
    haptic(30);
    return;
  }

  beginCascade();
}

function beginCascade(): void {
  state.cascadeTimer = 0.65; // pause for impact, then start popping
  state.cascadeBonus = 0;
  cascadeStep = 0;
  sfxGameOver();
  haptic(60);
}

/** Tick the second-chance countdown; end the run if it runs out. */
export function updateContinueOffer(dt: number): void {
  if (state.continuePending) return; // ad in flight — keep the offer up
  state.continueTimer -= dt;
  if (state.continueTimer <= 0) declineContinue();
}

/** Player took the second chance: watch a rewarded ad, then revive if earned. */
export async function acceptContinue(): Promise<void> {
  if (state.screen !== 'continue' || state.continuePending) return;
  state.continuePending = true;
  const rewarded = await cgRewardedAd();
  state.continuePending = false;
  if (state.screen !== 'continue') return; // state moved on while we waited
  if (rewarded) doRevive();
  else declineContinue(); // unfilled / skipped — no free revive
}

/** Player passed on the second chance (or it timed out): end the run. */
export function declineContinue(): void {
  if (state.screen !== 'continue') return;
  state.continuePending = false;
  state.screen = 'play';
  beginCascade();
}

function doRevive(): void {
  state.reviveUsed  = true;
  state.gameOver    = false;
  state.screen      = 'play';
  state.dangerTime  = 0;
  state.canDrop     = true;
  state.combo       = 0;
  state.comboTimer  = 0;

  reliefCleanup();
  cgGameplayStart(); // gameplay resumes after the rewarded ad

  state.shake = 12;
  state.flash = Math.max(state.flash, 0.3);
  showBanner('SECOND CHANCE!', 'Cleared some space — keep going!', '#8ffbff', 2.2);
  burstConfetti(210, 250, 60);
  state.shockwaves.push({ x: 210, y: 420, r: 0, life: 0.7, age: 0, color: '#8ffbff' });
  sfxNewBest();
  cgHappyTime();
  haptic(40);
}

/**
 * Make room after a revive: shove the whole pile to unstick it, then clear up
 * to six of the smallest, highest pieces (the clutter that fills the top),
 * awarding their points so the rescue feels generous rather than punishing.
 */
function reliefCleanup(): void {
  for (const b of state.bodies) {
    b.vx += (Math.random() - 0.5) * 200;
    b.vy -= 110 + Math.random() * 70;
    b.av += (Math.random() - 0.5) * 2.5;
    b.mergeLock = Math.max(b.mergeLock, 0.06);
    b.squash = 0.8;
  }

  const keepMin = 3;
  const removable = [...state.bodies]
    .sort((a, b) => a.tier - b.tier || a.y - b.y)
    .slice(0, Math.max(0, Math.min(6, state.bodies.length - keepMin)));

  if (!removable.length) return;
  const ids = new Set(removable.map(b => b.id));
  let gained = 0;
  for (const b of removable) {
    gained += DROPIMALS[b.tier].points;
    addParticles(b.x, b.y, DROPIMALS[b.tier].c1, 12, 0.8);
  }
  state.bodies = state.bodies.filter(b => !ids.has(b.id));
  state.score += gained;
}

/**
 * End-of-run pop cascade: every animal left in the box pops smallest-first,
 * each adding its points to a final bonus. Turns the loss into a payoff.
 */
export function updateCascade(dt: number): void {
  if (!state.gameOver || state.cascadeTimer < 0) return;

  state.cascadeTimer -= dt;
  if (state.cascadeTimer > 0) return;

  if (state.bodies.length === 0) {
    // Cascade finished — settle up and show the panel.
    state.cascadeTimer = -1;
    state.overPanelReady = true;
    state.screen = 'over';
    if (state.cascadeBonus > 0) {
      addFloater('CLEAR BONUS +' + state.cascadeBonus, 210, 320, '#fff6a8', 1.4, 24);
    }
    commitScore();
    cgGameplayStop();
    cgSubmitScore(state.score); // final score, including the cascade bonus
    return;
  }

  // Pop the smallest body next so the pitch rises as values grow.
  let idx = 0;
  for (let i = 1; i < state.bodies.length; i++) {
    if (state.bodies[i].tier < state.bodies[idx].tier) idx = i;
  }
  const b = state.bodies.splice(idx, 1)[0];
  const pts = DROPIMALS[b.tier].points;
  state.cascadeBonus += pts;
  state.score += pts;
  addParticles(b.x, b.y, DROPIMALS[b.tier].c1, 10 + b.tier * 3, 0.7 + b.tier * 0.1);
  addFloater('+' + pts, b.x, b.y, '#ffffff', 0.55, 15);
  sfxCascadePop(cascadeStep++);

  state.cascadeTimer = clamp(0.5 / Math.max(6, state.bodies.length), 0.045, 0.09);
}
