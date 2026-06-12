import type {
  Body, Particle, Floater, Shockwave, ConfettiPiece, Bubble,
  Mission, Screen, Profile, Banner,
} from './types';

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

  mission: null,
  missionIndex: 0,
  missionsDone: 0,

  idCounter: 1,
  shake: 0,
  flash: 0,
  hitstop: 0,
  time: 0,

  profile: {
    highScore: 0,
    discovered: new Array(10).fill(false),
    streak: 0,
    lastDay: '',
    games: 0,
    totalMerges: 0,
    biggestTier: 0,
    muted: false,
    musicMuted: false,
  },
  runDiscoveries: [],

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
