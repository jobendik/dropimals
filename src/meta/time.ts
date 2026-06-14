// Date + deterministic-RNG helpers shared by the retention systems. All "what
// resets when" logic keys off these stable string ids so saves compare cleanly.

/** Local YYYY-M-D, e.g. "2026-6-14". */
export function dayId(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** ISO-week id "YYYY-Www" so a week rolls over Monday. */
export function weekId(d = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;        // Mon=1..Sun=7
  t.setUTCDate(t.getUTCDate() + 4 - day); // nearest Thursday
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Short weekday key, Mon..Sun. */
export function weekdayKey(d = new Date()): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
}

/** Day-of-week index 0..6 (Sun..Sat). */
export function weekdayIndex(d = new Date()): number {
  return d.getDay();
}

/** A 2–6 week season id that advances every 4 weeks from a fixed epoch. */
export function seasonId(d = new Date()): string {
  const epoch = Date.UTC(2026, 0, 5); // a Monday
  const weeks = Math.floor((d.getTime() - epoch) / (7 * 86400000));
  return `S${String(Math.floor(weeks / 4) + 1).padStart(2, '0')}`;
}

/** Stable 32-bit hash of a string → seed. */
export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG — deterministic given a seed (for daily challenges/orders). */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick `n` distinct items from `arr` using the given rng. */
export function pickDistinct<T>(arr: T[], n: number, rng: () => number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  while (out.length < n && pool.length) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}
