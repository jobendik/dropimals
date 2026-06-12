// Thin wrapper around the CrazyGames SDK v3.
// Every call is a safe no-op outside the CrazyGames platform (e.g. GitHub
// Pages or local dev), so the same build runs everywhere.

interface CrazySDK {
  init(): Promise<void>;
  game: {
    gameplayStart(): void;
    gameplayStop(): void;
    happytime(): void;
    loadingStart(): void;
    loadingStop(): void;
  };
}

function sdk(): CrazySDK | null {
  const w = window as unknown as { CrazyGames?: { SDK?: CrazySDK } };
  return w.CrazyGames?.SDK ?? null;
}

let ready = false;

export async function cgInit(): Promise<void> {
  const s = sdk();
  if (!s) return;
  try {
    await s.init();
    ready = true;
    s.game.loadingStop();
  } catch {
    ready = false;
  }
}

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
