import { state } from '../state';
import type { Toast, Overlay } from '../types';

// ── Toasts (non-blocking) ────────────────────────────────────────────────────

export function pushToast(text: string, opts: Partial<Toast> = {}): void {
  state.toasts.push({
    text,
    sub: opts.sub,
    color: opts.color ?? '#8ffbff',
    icon: opts.icon,
    age: 0,
    life: opts.life ?? 3.2,
  });
  // Keep the stack short so it never walls off the screen.
  if (state.toasts.length > 4) state.toasts.shift();
}

export function updateToasts(dt: number): void {
  for (const t of state.toasts) t.age += dt;
  state.toasts = state.toasts.filter(t => t.age < t.life);
}

// ── Blocking celebration overlays (one at a time) ────────────────────────────

export function queueOverlay(o: Overlay): void {
  if (state.overlay) state.overlayQueue.push(o);
  else state.overlay = o;
}

/** Dismiss the current overlay and surface the next queued one (if any). */
export function advanceOverlay(): void {
  state.overlay = state.overlayQueue.shift() ?? null;
}

export function hasPendingOverlays(): boolean {
  return state.overlay != null || state.overlayQueue.length > 0;
}
