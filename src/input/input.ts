import { state } from '../state';
import { DROPIMALS } from '../data/dropimals';
import { BTN, LEFT, RIGHT } from '../constants';
import { clamp } from '../utils/math';
import { dropCurrent, useNudge, startRun, swapNext } from '../game/bodies';
import { sfxClick, toggleMute, toggleMusic, startMusic } from '../audio/audio';
import { commitScore } from '../utils/storage';
import { cgGameplayStart, cgGameplayStop } from '../platform/crazygames';
import type { ButtonRect } from '../types';

let aiming = false;
let downOnButton = false;

function toGame(clientX: number, clientY: number): { x: number; y: number } {
  return {
    x: (clientX - state.ox) / state.scale,
    y: (clientY - state.oy) / state.scale,
  };
}

function hit(p: { x: number; y: number }, r: ButtonRect): boolean {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

function updateAim(x: number): void {
  if (state.gameOver || !state.canDrop) return;
  const d = DROPIMALS[state.currentTier];
  state.dropX = clamp(x, LEFT + d.r + 2, RIGHT - d.r - 2);
}

export function pauseGame(): void {
  if (state.screen !== 'play') return;
  state.screen = 'paused';
  cgGameplayStop();
}

function resumeGame(): void {
  state.screen = 'play';
  state.last = performance.now();
  cgGameplayStart();
}

function quitToMenu(): void {
  commitScore();
  state.screen = 'menu';
  cgGameplayStop();
}

function onPointerDown(e: PointerEvent): void {
  const p = toGame(e.clientX, e.clientY);
  startMusic(); // needs a user gesture; no-op afterwards
  downOnButton = false;

  // Any press on a non-play screen must not leak into the play screen as a
  // drop when the pointer is released (e.g. tapping PLAY).
  switch (state.screen) {
    case 'menu':
      downOnButton = true;
      if (hit(p, BTN.play)) { sfxClick(); startRun(); }
      else if (hit(p, BTN.dex)) { sfxClick(); state.screen = 'dex'; }
      else if (hit(p, BTN.soundMenu)) { sfxClick(); toggleMute(); }
      else if (hit(p, BTN.musicMenu)) { sfxClick(); toggleMusic(); }
      return;

    case 'dex':
      downOnButton = true;
      if (hit(p, BTN.dexBack)) { sfxClick(); state.screen = 'menu'; }
      return;

    case 'paused':
      downOnButton = true;
      if (hit(p, BTN.resume)) { sfxClick(); resumeGame(); }
      else if (hit(p, BTN.restart)) { sfxClick(); startRun(); }
      else if (hit(p, BTN.toMenu)) { sfxClick(); quitToMenu(); }
      else if (hit(p, BTN.soundPause)) { sfxClick(); toggleMute(); }
      else if (hit(p, BTN.musicPause)) { sfxClick(); toggleMusic(); }
      return;

    case 'over':
      downOnButton = true;
      if (!state.overPanelReady) return;
      if (hit(p, BTN.again)) { sfxClick(); startRun(); }
      else if (hit(p, BTN.overMenu)) { sfxClick(); quitToMenu(); }
      return;

    case 'play':
      if (state.gameOver) return;
      if (hit(p, BTN.pause)) { sfxClick(); pauseGame(); downOnButton = true; return; }
      if (hit(p, BTN.nudge)) { useNudge(); downOnButton = true; return; }
      if (hit(p, BTN.nextPanel)) { sfxClick(); swapNext(); downOnButton = true; return; }
      aiming = true;
      updateAim(p.x);
      return;
  }
}

function onPointerMove(e: PointerEvent): void {
  if (state.screen !== 'play') return;
  const p = toGame(e.clientX, e.clientY);
  // Mouse users aim by hovering; touch users by dragging
  if (aiming || e.pointerType === 'mouse') updateAim(p.x);
}

function onPointerUp(e: PointerEvent): void {
  if (state.screen !== 'play' || state.gameOver) { aiming = false; return; }
  if (downOnButton) { downOnButton = false; aiming = false; return; }

  const p = toGame(e.clientX, e.clientY);
  if (hit(p, BTN.nudge) || hit(p, BTN.pause) || hit(p, BTN.nextPanel)) { aiming = false; return; }

  updateAim(p.x);
  dropCurrent();
  aiming = false;
}

function onKeyDown(e: KeyboardEvent): void {
  if (state.screen === 'play' && !state.gameOver) {
    const step = e.repeat ? 14 : 22;
    if (e.key === 'ArrowLeft' || e.key === 'a') updateAim(state.dropX - step);
    else if (e.key === 'ArrowRight' || e.key === 'd') updateAim(state.dropX + step);
    else if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); dropCurrent(); }
    else if (e.key === 'w' || e.key === 'ArrowUp') swapNext();
    else if (e.key === 'n') useNudge();
    else if (e.key === 'Escape' || e.key === 'p') pauseGame();
  } else if (state.screen === 'paused' && (e.key === 'Escape' || e.key === 'p')) {
    resumeGame();
  } else if (state.screen === 'menu' && (e.key === ' ' || e.key === 'Enter')) {
    startMusic();
    startRun();
  } else if (state.screen === 'over' && state.overPanelReady && (e.key === ' ' || e.key === 'Enter')) {
    startRun();
  }
}

export function initInput(canvas: HTMLCanvasElement): void {
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', () => { aiming = false; });
  window.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  // Auto-pause when the tab loses focus (required platform etiquette)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseGame();
  });
}
