// Thin wrapper around the CrazyGames SDK v3.
// Every call is a safe no-op outside the CrazyGames platform (e.g. GitHub
// Pages or local dev), so the same build runs everywhere.
//
// Docs: https://docs.crazygames.com/sdk/intro/

interface CrazySDK {
  init(): Promise<void>;
  game: {
    loadingStart(): void;
    loadingStop(): void;
    gameplayStart(): void;
    gameplayStop(): void;
    happytime(): void;
  };
  ad?: {
    requestAd(
      type: 'midgame' | 'rewarded',
      callbacks: {
        adStarted?: () => void;
        adFinished?: () => void;
        adError?: (e: unknown) => void;
      },
    ): void;
  };
  user?: {
    submitScore?(payload: { encryptedScore: string }): Promise<unknown> | unknown;
  };
  data?: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
  };
}

function sdk(): CrazySDK | null {
  const w = window as unknown as { CrazyGames?: { SDK?: CrazySDK } };
  return w.CrazyGames?.SDK ?? null;
}

let ready = false;

// ── Init / loading lifecycle ─────────────────────────────────────────────────

export async function cgInit(): Promise<void> {
  const s = sdk();
  if (!s) return;
  try {
    // The SDK is unusable until init() resolves, and every other game.* call
    // errors before that — so init first. Never let a hung SDK brick the game.
    await Promise.race([
      s.init(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('CrazyGames init timeout')), 4000)),
    ]);
    ready = true;
    // Now report our (near-instant) asset-prep window; cgLoadingStop() closes it
    // once the game is ready to render.
    s.game.loadingStart();
  } catch {
    ready = false;
  }
}

/** Close the loading bracket opened in cgInit, once the game can render. */
export function cgLoadingStop(): void {
  if (!ready) return;
  try { sdk()?.game.loadingStop(); } catch { /* ignore */ }
}

// ── Gameplay lifecycle ───────────────────────────────────────────────────────

export function cgGameplayStart(): void {
  if (!ready) return;
  try { sdk()?.game.gameplayStart(); } catch { /* ignore */ }
}

export function cgGameplayStop(): void {
  if (!ready) return;
  try { sdk()?.game.gameplayStop(); } catch { /* ignore */ }
}

/** Signal a celebration-worthy moment (new best, discovery, max merge). */
export function cgHappyTime(): void {
  if (!ready) return;
  try { sdk()?.game.happytime(); } catch { /* ignore */ }
}

// ── Ads ──────────────────────────────────────────────────────────────────────
// The platform requires audio to be paused while an ad plays. We don't import
// the audio module here (to avoid a dependency cycle); main.ts registers the
// pause/resume hooks at boot instead.

let onAdStart: (() => void) | null = null;
let onAdEnd: (() => void) | null = null;

export function setAdAudioHooks(start: () => void, end: () => void): void {
  onAdStart = start;
  onAdEnd = end;
}

function runAd(type: 'midgame' | 'rewarded'): Promise<boolean> {
  const s = sdk();
  if (!ready || !s?.ad?.requestAd) return Promise.resolve(false);

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const settle = (ok: boolean): void => {
      if (settled) return;
      settled = true;
      try { onAdEnd?.(); } catch { /* ignore */ }
      resolve(ok);
    };

    try {
      s.ad!.requestAd(type, {
        adStarted: () => { try { onAdStart?.(); } catch { /* ignore */ } },
        adFinished: () => settle(true),
        adError: () => settle(false),
      });
    } catch {
      settle(false);
    }

    // Safety net: if the SDK never calls back, don't trap the player forever.
    setTimeout(() => settle(false), 30_000);
  });
}

/**
 * Show a midgame (interstitial) ad. Resolves once the ad finishes, errors, or
 * goes unfilled — the caller can always proceed. The SDK rate-limits these, so
 * it is safe to request one between every run; it simply no-ops when too soon.
 */
export function cgMidgameAd(): Promise<void> {
  return runAd('midgame').then(() => undefined);
}

/**
 * Show a rewarded ad. Resolves `true` only if the player watched it to the end,
 * so callers can grant the reward (e.g. the "second chance" revive).
 */
export function cgRewardedAd(): Promise<boolean> {
  return runAd('rewarded');
}

/** Whether a rewarded ad could plausibly be shown (SDK live with an ad module). */
export function cgRewardedAvailable(): boolean {
  return ready && !!sdk()?.ad?.requestAd;
}

// ── Leaderboards ─────────────────────────────────────────────────────────────
// Scores must be AES-GCM encrypted with a developer-chosen 32-byte key before
// submission. The SAME key must be entered for this game in the CrazyGames
// developer portal, otherwise scores are rejected. The submit call gives no
// success feedback by design (anti-cheat), so we just fire it safely.

const LEADERBOARD_KEY = 'WVZ0QQ/sXPp3djR+Cs4NaifM0+Gd2bMq0jpGiiFTt9M=';

async function encryptScore(score: number): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyBytes = Uint8Array.from(atob(LEADERBOARD_KEY), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt'],
  );
  const data = new TextEncoder().encode(String(score));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, data);

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  let binary = '';
  for (const b of combined) binary += String.fromCharCode(b);
  return btoa(binary);
}

export async function cgSubmitScore(score: number): Promise<void> {
  const s = sdk();
  if (!ready || !s?.user?.submitScore || score <= 0) return;
  try {
    const encryptedScore = await encryptScore(score);
    await s.user.submitScore({ encryptedScore });
  } catch { /* ignore */ }
}

// ── Cloud-synced storage ─────────────────────────────────────────────────────
// The data module mirrors the localStorage API but persists to the player's
// CrazyGames account when they are signed in (and falls back to localStorage
// otherwise). Returns null off-platform so callers use localStorage directly.

export function cgData(): CrazySDK['data'] | null {
  if (!ready) return null;
  return sdk()?.data ?? null;
}
