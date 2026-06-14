import type {
  Body, Particle, Floater, Shockwave, ConfettiPiece, Bubble,
  Mission, Screen, Profile, Banner, Toast, RunReward, Overlay,
} from './types';
import { defaultProfile } from './meta/profile';

export interface GameState {
  screen: Screen;

  bodies: Body[];
  particles: Particle[];
  floaters: Floater[];
  shockwaves: Shockwave[];
  confetti: ConfettiPiece[];
  bubbles: Bubble[];
  banner: Banner | null;

  score: number;
  /** Animated score shown in the HUD; chases `score`. */
  displayScore: number;
  scorePulse: number;
  /** Highest milestone (multiple of MILESTONE_STEP) already celebrated this run. */
  scoreMilestone: number;
  bestTier: number;
  merges: number;
  drops: number;

  currentTier: number;
  nextTier: number;
  lastDropTiers: number[];
  swapUsed: boolean;

  dropX: number;
  canDrop: boolean;
  dropCooldown: number;
  dangerTime: number;
  gameOver: boolean;
  /** Index into the end-of-run pop cascade; -1 when not running. */
  cascadeTimer: number;
  cascadeBonus: number;
  overPanelReady: boolean;

  combo: number;
  comboTimer: number;
  maxCombo: number;
  fever: number;
  nudgeCharge: number;
  newBestShown: boolean;
  /** High score before this run started, for end-screen record detection. */
  prevBest: number;

  /** One-time rewarded-ad "second chance" per run. */
  reviveUsed: boolean;
  /** Countdown (s) while the continue offer is shown; auto-declines at 0. */
  continueTimer: number;
  /** True while the rewarded ad is loading/playing, so the offer won't expire. */
  continuePending: boolean;

  mission: Mission | null;
  missionIndex: number;
  missionsDone: number;

  idCounter: number;
  shake: number;
  flash: number;
  hitstop: number;
  time: number;

  profile: Profile;
  /** Tiers discovered during the current run (for end screen). */
  runDiscoveries: number[];

  /** CrazyGames signed-in player name, for a personalised greeting. null = guest. */
  cgUsername: string | null;

  // ── Retention / meta runtime (transient) ──
  /** Non-blocking notifications queued at the top of the screen. */
  toasts: Toast[];
  /** Per-run counters that feed medals & objectives. */
  runStats: Record<string, number>;
  /** Summary of what the just-finished run earned; null until a run ends. */
  runReward: RunReward | null;
  /** Active celebration overlay (level-up / chest), shown one at a time. */
  overlay: Overlay | null;
  /** Overlays waiting their turn behind `overlay`. */
  overlayQueue: Overlay[];
  /** Which tab the Rewards hub is showing. */
  hubTab: 'orders' | 'season' | 'collection' | 'shop' | 'stats';
  /** Scroll offset within the active hub tab. */
  hubScroll: number;
  /** Today's rotating event id (gameplay modifier). */
  eventId: string;
  /** True while the current run is the seeded Daily Challenge. */
  challengeRun: boolean;

  DPR: number;
  viewW: number;
  viewH: number;
  scale: number;
  ox: number;
  oy: number;

  last: number;
  accumulator: number;

  audioCtx: AudioContext | null;
}

export const state: GameState = {
  screen: 'menu',

  bodies: [],
  particles: [],
  floaters: [],
  shockwaves: [],
  confetti: [],
  bubbles: [],
  banner: null,

  score: 0,
  displayScore: 0,
  scorePulse: 0,
  scoreMilestone: 0,
  bestTier: 0,
  merges: 0,
  drops: 0,

  currentTier: 0,
  nextTier: 1,
  lastDropTiers: [],
  swapUsed: false,

  dropX: 210,
  canDrop: true,
  dropCooldown: 0,
  dangerTime: 0,
  gameOver: false,
  cascadeTimer: -1,
  cascadeBonus: 0,
  overPanelReady: false,

  combo: 0,
  comboTimer: 0,
  maxCombo: 0,
  fever: 0,
  nudgeCharge: 0,
  newBestShown: false,
  prevBest: 0,

  reviveUsed: false,
  continueTimer: 0,
  continuePending: false,

  mission: null,
  missionIndex: 0,
  missionsDone: 0,

  idCounter: 1,
  shake: 0,
  flash: 0,
  hitstop: 0,
  time: 0,

  profile: defaultProfile(),
  runDiscoveries: [],

  cgUsername: null,

  toasts: [],
  runStats: {},
  runReward: null,
  overlay: null,
  overlayQueue: [],
  hubTab: 'orders',
  hubScroll: 0,
  eventId: '',
  challengeRun: false,

  DPR: 1,
  viewW: 0,
  viewH: 0,
  scale: 1,
  ox: 0,
  oy: 0,

  last: performance.now(),
  accumulator: 0,

  audioCtx: null,
};
