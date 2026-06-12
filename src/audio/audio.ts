import { state } from '../state';
import { saveProfile } from '../utils/storage';

let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicTimer: number | null = null;
let musicStep = 0;

function getCtx(): AudioContext | null {
  try {
    if (!state.audioCtx) {
      const AC = window.AudioContext
        || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      state.audioCtx = new AC();
      master = state.audioCtx.createGain();
      master.gain.value = state.profile.muted ? 0 : 1;
      master.connect(state.audioCtx.destination);

      musicGain = state.audioCtx.createGain();
      musicGain.gain.value = state.profile.musicMuted ? 0 : 1;
      musicGain.connect(master);
    }
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume();
    return state.audioCtx;
  } catch {
    return null;
  }
}

export function toggleMute(): void {
  state.profile.muted = !state.profile.muted;
  if (master) master.gain.value = state.profile.muted ? 0 : 1;
  saveProfile();
}

export function toggleMusic(): void {
  state.profile.musicMuted = !state.profile.musicMuted;
  if (musicGain) musicGain.gain.value = state.profile.musicMuted ? 0 : 1;
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
  if (!ctx || !master) return;
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
  gain.connect(o.out ?? master);
  osc.start(now);
  osc.stop(now + o.dur + 0.02);
}

/** Short filtered-noise thump for landings and drops. */
function thump(vol: number, delay = 0): void {
  const ctx = getCtx();
  if (!ctx || !master) return;
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
  gain.connect(master);
  src.start(now);
}

// C major pentatonic — everything sounds friendly together.
const PENTA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 784.0, 880.0];

export function sfxDrop(tier: number): void {
  tone({ freq: 380 + tier * 26, dur: 0.09, type: 'triangle', vol: 0.05, endFreq: 150 + tier * 10 });
  thump(0.10);
}

export function sfxMerge(tier: number, combo: number): void {
  const idx = Math.min(PENTA.length - 1, tier);
  const comboShift = Math.min(4, Math.max(0, combo - 1)) * 0.5; // each combo step pushes pitch up
  const base = PENTA[idx] * Math.pow(2, comboShift / 12 * 2);
  // Bubbly pop: fast pitch slide up + harmonic sparkle
  tone({ freq: base * 0.6, dur: 0.10, type: 'sine', vol: 0.07, endFreq: base });
  tone({ freq: base * 1.5, dur: 0.14, type: 'triangle', vol: 0.045, delay: 0.03 });
  if (tier >= 4) tone({ freq: base * 2, dur: 0.22, type: 'sine', vol: 0.035, delay: 0.06 });
  if (tier >= 6) thump(0.14);
}

export function sfxDiscovery(): void {
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
  tone({ freq: 660, dur: 0.05, type: 'triangle', vol: 0.04, endFreq: 520 });
}

export function sfxCascadePop(step: number): void {
  const f = 330 * Math.pow(2, Math.min(24, step) / 12);
  tone({ freq: f, dur: 0.08, type: 'triangle', vol: 0.045 });
}

export function sfxGameOver(): void {
  tone({ freq: 320, dur: 0.6, type: 'sawtooth', vol: 0.04, endFreq: 90 });
  tone({ freq: 160, dur: 0.7, type: 'sine', vol: 0.045, endFreq: 60, delay: 0.1 });
}

export function sfxWarning(): void {
  tone({ freq: 740, dur: 0.09, type: 'square', vol: 0.022 });
}

// ── Generative background music ─────────────────────────────────────────────
// A soft pad + sparse pentatonic plucks. Cheap, loopless, never repeats
// exactly. Runs through its own gain node so it can be muted separately.

const CHORDS = [
  [130.81, 196.0, 261.63, 329.63],  // C
  [110.0, 164.81, 220.0, 261.63],   // Am
  [87.31, 174.61, 261.63, 349.23],  // F
  [98.0, 196.0, 246.94, 293.66],    // G
];

function musicTick(): void {
  const ctx = getCtx();
  if (!ctx || !musicGain || state.profile.musicMuted) return;

  const chord = CHORDS[musicStep % CHORDS.length];
  for (const f of chord) {
    tone({ freq: f, dur: 3.6, type: 'sine', vol: 0.016, attack: 1.2, out: musicGain });
    tone({ freq: f * 2.003, dur: 3.6, type: 'sine', vol: 0.006, attack: 1.4, out: musicGain });
  }

  // Sparse melody plucks on top, denser during fever
  const plucks = state.fever > 0 ? 4 : 2;
  for (let i = 0; i < plucks; i++) {
    if (Math.random() < 0.65) {
      const n = PENTA[Math.floor(Math.random() * 5) + (state.fever > 0 ? 4 : 2)];
      tone({ freq: n, dur: 0.5, type: 'triangle', vol: 0.014, delay: 0.4 + i * 0.9, out: musicGain });
    }
  }
  musicStep++;
}

/** Start the music scheduler. Safe to call repeatedly; needs a user gesture first. */
export function startMusic(): void {
  if (musicTimer !== null) return;
  if (!getCtx()) return;
  musicTick();
  musicTimer = window.setInterval(musicTick, 3800);
}
