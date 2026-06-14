import { state } from '../state';
import { weekdayIndex, dayId, hashStr } from './time';
import { FEVER_COMBO } from '../constants';

// A rotating daily event (doc §6.2 / §11). Each one applies a real, readable
// modifier to rewards or gameplay so the game feels alive day to day.
export interface GameEvent {
  id: string;
  name: string;
  desc: string;
  color: string;
  xpMult: number;
  coinMult: number;
  seasonMult: number;
  /** Combo needed to trigger Fever (default FEVER_COMBO). */
  feverCombo: number;
  /** Fever duration multiplier. */
  feverTimeMult: number;
  /** Combo window multiplier. */
  comboWindowMult: number;
  /** Extra weight toward higher drop tiers (0 = off). */
  dropBoost: number;
  /** Daily-chest fill multiplier. */
  chestMult: number;
  /** Drop-cooldown multiplier (challenge modes only; <1 = faster). */
  cooldownMult: number;
}

function base(): GameEvent {
  return {
    id: '', name: '', desc: '', color: '#8ffbff',
    xpMult: 1, coinMult: 1, seasonMult: 1,
    feverCombo: FEVER_COMBO, feverTimeMult: 1, comboWindowMult: 1,
    dropBoost: 0, chestMult: 1, cooldownMult: 1,
  };
}

// Indexed by JS weekday (0=Sun .. 6=Sat).
const SCHEDULE: GameEvent[] = [
  { ...base(), id: 'chest_day',     name: 'Chest Day',     desc: 'Daily chest fills 2× as fast', color: '#fff6a8', chestMult: 2 },
  { ...base(), id: 'double_xp',     name: 'Double XP',     desc: 'Earn 2× account XP today',     color: '#66f7ff', xpMult: 2 },
  { ...base(), id: 'coin_rush',     name: 'Coin Rush',     desc: '2× coins from every run',       color: '#ffd86a', coinMult: 2 },
  { ...base(), id: 'fever_frenzy',  name: 'Fever Frenzy',  desc: 'Fever starts sooner & lasts longer', color: '#ff8fd6', feverCombo: 4, feverTimeMult: 1.5 },
  { ...base(), id: 'combo_party',   name: 'Combo Party',   desc: 'Longer combo window',           color: '#9dff74', comboWindowMult: 1.6 },
  { ...base(), id: 'lucky_drops',   name: 'Lucky Drops',   desc: 'Bigger Dropimals appear more often', color: '#dcb8ff', dropBoost: 1 },
  { ...base(), id: 'season_surge',  name: 'Season Surge',  desc: '2× Season XP',                  color: '#b28cff', seasonMult: 2 },
];

export function currentEvent(): GameEvent {
  return SCHEDULE[weekdayIndex() % 7];
}

/** Upcoming-week preview for the events panel. */
export function weekEvents(): GameEvent[] {
  const today = weekdayIndex();
  return Array.from({ length: 7 }, (_, i) => SCHEDULE[(today + i) % 7]);
}

// ── Daily Challenge modifiers (doc §15) ──────────────────────────────────────
// One-life runs with a twist that rotates daily, deterministically seeded so
// everyone faces the same challenge on a given day.
const CHALLENGE_MODS: GameEvent[] = [
  { ...base(), id: 'chal_fast',  name: 'Rapid Drops', desc: 'Faster drops — keep up!', color: '#ff8fd6', cooldownMult: 0.55 },
  { ...base(), id: 'chal_lucky', name: 'Giant Rain',  desc: 'Bigger Dropimals fall',   color: '#dcb8ff', dropBoost: 2 },
  { ...base(), id: 'chal_combo', name: 'Chain Gang',  desc: 'Long combo window, early Fever', color: '#9dff74', comboWindowMult: 1.8, feverCombo: 4 },
  { ...base(), id: 'chal_blitz', name: 'Blitz',       desc: 'Fast drops & early Fever', color: '#66f7ff', cooldownMult: 0.7, feverCombo: 4, feverTimeMult: 1.3 },
];

/** The deterministic challenge modifier for today. */
export function challengeMod(): GameEvent {
  return CHALLENGE_MODS[hashStr('chal' + dayId()) % CHALLENGE_MODS.length];
}

/** The modifier that should affect gameplay right now (challenge or daily event). */
export function activeModifier(): GameEvent {
  return state.challengeRun ? challengeMod() : currentEvent();
}
