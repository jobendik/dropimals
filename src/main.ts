import { state } from './state';
import { GRAVITY, AIR_DRAG, PHYSICS_STEPS } from './constants';
import { initCanvas, canvas, resize } from './render/canvas';
import { draw } from './render/renderer';
import { initInput } from './input/input';
import { loadProfile } from './utils/storage';
import { spawnNext, checkOverflow, processMerges, updateCascade } from './game/bodies';
import { collideWalls, solveCircleCollisions } from './game/physics';
import { updateFX } from './game/fx';
import { updateMissionForScore } from './game/missions';
import { updateBubbles } from './render/background';
import { sfxWarning } from './audio/audio';
import { cgInit } from './platform/crazygames';

let warnBeep = 0;

function step(dt: number): void {
  state.time += dt;

  // Always-on cosmetic systems
  updateBubbles(dt);
  updateFX(dt);
  if (state.shake > 0) state.shake = Math.max(0, state.shake - 55 * dt);
  if (state.flash > 0) state.flash = Math.max(0, state.flash - 2.2 * dt);
  if (state.scorePulse > 0) state.scorePulse = Math.max(0, state.scorePulse - 4 * dt);

  // Animated score chases the real score
  const diff = state.score - state.displayScore;
  state.displayScore += diff * Math.min(1, dt * 9);
  if (Math.abs(diff) < 1) state.displayScore = state.score;

  if (state.screen === 'menu' || state.screen === 'dex' || state.screen === 'paused') return;

  if (state.gameOver) {
    updateCascade(dt);
    return;
  }

  // Hitstop: freeze the simulation for a few frames on big merges
  if (state.hitstop > 0) {
    state.hitstop -= dt;
    return;
  }

  if (state.fever > 0) state.fever = Math.max(0, state.fever - dt);

  if (state.dropCooldown > 0) {
    state.dropCooldown -= dt;
    if (state.dropCooldown <= 0) spawnNext();
  }

  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.combo = 0;
  }

  // Warning beeps while the box is overflowing
  if (state.dangerTime > 0) {
    warnBeep -= dt;
    if (warnBeep <= 0) {
      sfxWarning();
      warnBeep = Math.max(0.18, 0.5 - state.dangerTime * 0.18);
    }
  }

  for (const b of state.bodies) {
    b.age       += dt;
    b.mergeLock  = Math.max(0, b.mergeLock - dt);

    b.vy += GRAVITY * dt;
    b.vx *= Math.pow(AIR_DRAG, dt * 60);
    b.vy *= Math.pow(AIR_DRAG, dt * 60);

    b.x += b.vx * dt;
    b.y += b.vy * dt;

    b.angle += b.av * dt;
    b.av    *= Math.pow(0.988, dt * 60);

    // Squash & stretch spring back to round
    b.squashV += (1 - b.squash) * 240 * dt;
    b.squashV *= Math.pow(0.0001, dt); // heavy damping
    b.squash  += b.squashV * dt;
    b.squash   = Math.min(1.25, Math.max(0.5, b.squash));

    // Blink: negative window means eyes closed
    b.blink -= dt;
    if (b.blink < -0.12) b.blink = 1.5 + Math.random() * 5;

    collideWalls(b);
  }

  for (let i = 0; i < PHYSICS_STEPS; i++) {
    solveCircleCollisions();
    for (const b of state.bodies) collideWalls(b);
  }

  processMerges();
  checkOverflow(dt);
  updateMissionForScore();
}

function frame(now: number): void {
  const rawDt = Math.min(0.05, (now - state.last) / 1000);
  state.last       = now;
  state.accumulator += rawDt;

  const fixed = 1 / 60;
  let guard = 0;

  while (state.accumulator >= fixed && guard < 4) {
    step(fixed);
    state.accumulator -= fixed;
    guard++;
  }

  draw();
  requestAnimationFrame(frame);
}

// ── Bootstrap ────────────────────────────────────────────────────────────────

initCanvas();
loadProfile();
resize();
initInput(canvas);
window.addEventListener('resize', resize);
cgInit();
requestAnimationFrame(frame);
