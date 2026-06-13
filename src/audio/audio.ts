/// <reference types="vite/client" />
import { state } from '../state';
import { saveProfile } from '../utils/storage';
import { MAX_TIER } from '../data/dropimals';

// Routing: every voice → its channel bus → master → destination.
//   master   — global bus, also ducked to 0 while an ad plays.
//   sfxBus   — all sound effects; gain = muted ? 0 : profile.sfxVolume.
//   musicGain — background music;  gain = musicMuted ? 0 : profile.musicVolume.
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let musicGain: GainNode | null = null;

function sfxLevel(): number { return state.profile.muted ? 0 : state.profile.sfxVolume; }
function musicLevel(): number { return state.profile.musicMuted ? 0 : state.profile.musicVolume; }

function getCtx(): AudioContext | null {
  try {
    if (!state.audioCtx) {
      const AC = window.AudioContext
        || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      state.audioCtx = new AC();
      master = state.audioCtx.createGain();
      master.gain.value = 1;
      master.connect(state.audioCtx.destination);

      sfxBus = state.audioCtx.createGain();
      sfxBus.gain.value = sfxLevel();
      sfxBus.connect(master);

      musicGain = state.audioCtx.createGain();
      musicGain.gain.value = musicLevel();
      musicGain.connect(master);

      loadSamples(state.audioCtx);
    }
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume();
    return state.audioCtx;
  } catch {
    return null;
  }
}

export function toggleMute(): void {
  state.profile.muted = !state.profile.muted;
  if (sfxBus) sfxBus.gain.value = sfxLevel();
  saveProfile();
}

export function toggleMusic(): void {
  state.profile.musicMuted = !state.profile.musicMuted;
  if (musicGain) musicGain.gain.value = musicLevel();
  saveProfile();
}

/** Set SFX volume (0..1). Dragging above zero also un-mutes the channel. */
export function setSfxVolume(v: number): void {
  state.profile.sfxVolume = Math.max(0, Math.min(1, v));
  if (state.profile.sfxVolume > 0) state.profile.muted = false;
  if (sfxBus) sfxBus.gain.value = sfxLevel();
  saveProfile();
}

/** Set music volume (0..1). Dragging above zero also un-mutes the channel. */
export function setMusicVolume(v: number): void {
  state.profile.musicVolume = Math.max(0, Math.min(1, v));
  if (state.profile.musicVolume > 0) state.profile.musicMuted = false;
  if (musicGain) musicGain.gain.value = musicLevel();
  saveProfile();
}

interface ToneOpts {
  freq: number;
  dur: number;
  type?: OscillatorType;
  vol?: number;
  delay?: number;
  endFreq?: number;
  attack?: number;
  out?: GainNode | null;
}

function tone(o: ToneOpts): void {
  const ctx = getCtx();
  if (!ctx || !sfxBus) return;
  const now = ctx.currentTime + (o.delay ?? 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const vol = o.vol ?? 0.05;
  const attack = o.attack ?? 0.004;

  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, now);
  if (o.endFreq != null) osc.frequency.exponentialRampToValueAtTime(o.endFreq, now + o.dur);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(vol, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + o.dur);

  osc.connect(gain);
  gain.connect(o.out ?? sfxBus);
  osc.start(now);
  osc.stop(now + o.dur + 0.02);
}

/** Short filtered-noise thump for landings and drops. */
function thump(vol: number, delay = 0): void {
  const ctx = getCtx();
  if (!ctx || !sfxBus) return;
  const now = ctx.currentTime + delay;
  const len = Math.floor(ctx.sampleRate * 0.08);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);

  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 320;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(sfxBus);
  src.start(now);
}

// ── Sampled SFX (real foley) ────────────────────────────────────────────────
// Tactile events (drop / merge / discovery / clicks / game over) use short,
// trimmed, normalised foley clips. They are pitched at playback time so the
// same handful of pops covers every tier and combo step. If a clip ever fails
// to load/decode, the synthesised fallback below keeps the event audible.

const SFX = {
  drop:     'drop.mp3',     // soft springy "bounce" on release
  pop1:     'pop1.mp3',     // squishy merge pops — pitched per tier/combo
  pop2:     'pop2.mp3',
  pop3:     'pop3.mp3',
  ding:     'ding.mp3',     // bright glass ding for discoveries
  gameover: 'gameover.mp3', // balloon deflate
  warn:     'warn.mp3',     // overflow beep
  click:    'click.mp3',    // UI button
} as const;
type SfxName = keyof typeof SFX;
const POPS: SfxName[] = ['pop1', 'pop2', 'pop3'];

const buffers: Partial<Record<SfxName, AudioBuffer>> = {};
let samplesRequested = false;

function loadSamples(ctx: AudioContext): void {
  if (samplesRequested) return;
  samplesRequested = true;
  (Object.keys(SFX) as SfxName[]).forEach((name) => {
    fetch(import.meta.env.BASE_URL + 'audio/sfx/' + SFX[name])
      .then(r => r.arrayBuffer())
      // Callback form of decodeAudioData for older Safari compatibility.
      .then(ab => new Promise<AudioBuffer>((res, rej) => ctx.decodeAudioData(ab, res, rej)))
      .then(buf => { buffers[name] = buf; })
      .catch(() => { /* leave undefined — event will use its synth fallback */ });
  });
}

interface PlayOpts { rate?: number; vol?: number; delay?: number; }

/** Play a decoded sample. Returns false (and runs `fallback`) if it isn't ready. */
function playBuf(name: SfxName, o: PlayOpts, fallback?: () => void): boolean {
  const ctx = getCtx();
  const buf = buffers[name];
  if (!ctx || !sfxBus || !buf) { fallback?.(); return false; }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = o.rate ?? 1;
  const gain = ctx.createGain();
  gain.gain.value = o.vol ?? 0.4;
  src.connect(gain);
  gain.connect(sfxBus);
  src.start(ctx.currentTime + (o.delay ?? 0));
  return true;
}

// C major pentatonic — everything sounds friendly together.
const PENTA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 784.0, 880.0];

export function sfxDrop(tier: number): void {
  // Higher tiers (bigger animals) land a touch lower; keep it light.
  const rate = Math.max(0.85, Math.min(1.25, 1.14 - tier * 0.02));
  playBuf('drop', { rate, vol: 0.3 }, () => synthDrop(tier));
}

export function sfxMerge(tier: number, combo: number): void {
  // Bigger animals pop lower & fuller; each combo step nudges the pitch up.
  const tierRate  = 1.18 - Math.min(tier, MAX_TIER) * 0.042;
  const comboMul  = Math.pow(1.045, Math.min(Math.max(combo - 1, 0), 8));
  const rate = Math.max(0.7, Math.min(1.9, tierRate * comboMul));
  const vol  = 0.42 + Math.min(tier, 9) * 0.012;
  const variant = POPS[(tier + combo) % POPS.length];
  const played = playBuf(variant, { rate, vol }, () => synthMerge(tier, combo));
  // Add low-end weight to heavy merges (the synth fallback bakes in its own).
  if (played && tier >= 6) thump(tier >= MAX_TIER ? 0.18 : 0.12);
}

export function sfxDiscovery(): void {
  // A quick rising glass-bell arpeggio built from one ding sample.
  const played = playBuf('ding', { rate: 1.0, vol: 0.4 }, () => synthDiscovery());
  if (played) {
    playBuf('ding', { rate: 1.26, vol: 0.34, delay: 0.10 });
    playBuf('ding', { rate: 1.5,  vol: 0.26, delay: 0.20 });
  }
}

// ── Synthesised fallbacks (used only if a sample isn't loaded) ───────────────

function synthDrop(tier: number): void {
  tone({ freq: 380 + tier * 26, dur: 0.09, type: 'triangle', vol: 0.05, endFreq: 150 + tier * 10 });
  thump(0.10);
}

function synthMerge(tier: number, combo: number): void {
  const idx = Math.min(PENTA.length - 1, tier);
  const comboShift = Math.min(4, Math.max(0, combo - 1)) * 0.5; // each combo step pushes pitch up
  const base = PENTA[idx] * Math.pow(2, comboShift / 12 * 2);
  // Bubbly pop: fast pitch slide up + harmonic sparkle
  tone({ freq: base * 0.6, dur: 0.10, type: 'sine', vol: 0.07, endFreq: base });
  tone({ freq: base * 1.5, dur: 0.14, type: 'triangle', vol: 0.045, delay: 0.03 });
  if (tier >= 4) tone({ freq: base * 2, dur: 0.22, type: 'sine', vol: 0.035, delay: 0.06 });
  if (tier >= 6) thump(0.14);
}

function synthDiscovery(): void {
  const notes = [523.25, 659.25, 784.0, 1046.5];
  notes.forEach((f, i) => tone({ freq: f, dur: 0.34, type: 'triangle', vol: 0.055, delay: i * 0.09 }));
  notes.forEach((f, i) => tone({ freq: f * 2, dur: 0.26, type: 'sine', vol: 0.025, delay: 0.05 + i * 0.09 }));
}

export function sfxFever(): void {
  tone({ freq: 220, dur: 0.5, type: 'sawtooth', vol: 0.04, endFreq: 880 });
  tone({ freq: 440, dur: 0.5, type: 'triangle', vol: 0.04, endFreq: 1760, delay: 0.08 });
}

export function sfxNewBest(): void {
  [659.25, 784.0, 987.77, 1318.5].forEach((f, i) =>
    tone({ freq: f, dur: 0.3, type: 'triangle', vol: 0.05, delay: i * 0.07 }));
}

export function sfxNudge(): void {
  tone({ freq: 140, dur: 0.16, type: 'sawtooth', vol: 0.045, endFreq: 90 });
  tone({ freq: 220, dur: 0.12, type: 'triangle', vol: 0.04, delay: 0.02 });
  thump(0.16);
}

export function sfxMission(): void {
  [660, 880, 990].forEach((f, i) => tone({ freq: f, dur: 0.16, type: 'triangle', vol: 0.045, delay: i * 0.05 }));
}

export function sfxClick(): void {
  playBuf('click', { rate: 1.0, vol: 0.4 }, () =>
    tone({ freq: 660, dur: 0.05, type: 'triangle', vol: 0.04, endFreq: 520 }));
}

export function sfxCascadePop(step: number): void {
  // End-of-run pop rain: same merge pops, ratcheting up in pitch per step.
  const rate = Math.min(2.3, Math.pow(1.05, Math.min(step, 22)));
  const variant = POPS[step % POPS.length];
  playBuf(variant, { rate, vol: 0.34 }, () => {
    const f = 330 * Math.pow(2, Math.min(24, step) / 12);
    tone({ freq: f, dur: 0.08, type: 'triangle', vol: 0.045 });
  });
}

export function sfxGameOver(): void {
  playBuf('gameover', { rate: 1.0, vol: 0.5 }, () => {
    tone({ freq: 320, dur: 0.6, type: 'sawtooth', vol: 0.04, endFreq: 90 });
    tone({ freq: 160, dur: 0.7, type: 'sine', vol: 0.045, endFreq: 60, delay: 0.1 });
  });
}

export function sfxWarning(): void {
  playBuf('warn', { rate: 1.0, vol: 0.22 }, () =>
    tone({ freq: 740, dur: 0.09, type: 'square', vol: 0.022 }));
}

// ── Background music (real audio files) ─────────────────────────────────────
// HTMLAudioElements routed through musicGain so the mute toggle still works.
// Each element is connected to the AudioContext only once (createMediaElementSource
// can only be called once per element).

let currentTrack: 'menu' | 'game' | null = null;
let menuEl: HTMLAudioElement | null = null;
let gameEl: HTMLAudioElement | null = null;
let menuSrc: MediaElementAudioSourceNode | null = null;
let gameSrc: MediaElementAudioSourceNode | null = null;

function getTrackEl(track: 'menu' | 'game'): HTMLAudioElement {
  if (track === 'menu') {
    if (!menuEl) {
      menuEl = new Audio(import.meta.env.BASE_URL + 'audio/main_menu.mp3');
      menuEl.loop = true;
    }
    return menuEl;
  }
  if (!gameEl) {
    gameEl = new Audio(import.meta.env.BASE_URL + 'audio/gameplay.mp3');
    gameEl.loop = true;
  }
  return gameEl;
}

function connectTrack(track: 'menu' | 'game', ctx: AudioContext): void {
  if (track === 'menu' && !menuSrc && menuEl) {
    menuSrc = ctx.createMediaElementSource(menuEl);
    menuSrc.connect(musicGain!);
  } else if (track === 'game' && !gameSrc && gameEl) {
    gameSrc = ctx.createMediaElementSource(gameEl);
    gameSrc.connect(musicGain!);
  }
}

export function startMusic(track: 'menu' | 'game'): void {
  if (currentTrack === track) return;
  const ctx = getCtx();
  if (!ctx || !musicGain) return;

  // Stop the other track
  menuEl?.pause();
  gameEl?.pause();
  currentTrack = track;

  const el = getTrackEl(track);
  connectTrack(track, ctx);
  el.play().catch(() => { /* autoplay blocked — will retry on next gesture */ });
}

export function stopMusic(): void {
  menuEl?.pause();
  gameEl?.pause();
  currentTrack = null;
}

// ── Ad audio handling ───────────────────────────────────────────────────────
// CrazyGames requires the game to be silent while an ad plays. We duck the
// master gain to zero (covers all SFX) and pause the music element, then
// restore both — respecting the player's existing mute preference.

let adMusicTrack: 'menu' | 'game' | null = null;

export function muteForAd(): void {
  adMusicTrack = currentTrack;
  menuEl?.pause();
  gameEl?.pause();
  if (master && state.audioCtx) master.gain.setValueAtTime(0, state.audioCtx.currentTime);
}

export function unmuteAfterAd(): void {
  // Master is just the ad-duck bus now; per-channel mute lives on sfxBus/musicGain.
  if (master && state.audioCtx) {
    master.gain.setValueAtTime(1, state.audioCtx.currentTime);
  }
  // Resume whichever track was playing when the ad interrupted.
  const el = adMusicTrack === 'menu' ? menuEl : adMusicTrack === 'game' ? gameEl : null;
  el?.play().catch(() => { /* will retry on next gesture */ });
  adMusicTrack = null;
}
