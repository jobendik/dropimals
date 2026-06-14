import type { DropimalDef } from '../types';

// The evolution chain. Radii are tuned so the final tier (284px diameter)
// still fits the 372px-wide box with room to merge.
export const DROPIMALS: DropimalDef[] = [
  { name: 'Pip',        r: 15,  c1: '#ffe066', c2: '#e8a013', skin: 'chick',  points: 20,    ex: 0.36, ey: -0.14, er: 0.105 },
  { name: 'Momo',       r: 22,  c1: '#ff8fd6', c2: '#c82a86', skin: 'mouse',  points: 50,    ex: 0.34, ey: -0.10, er: 0.095 },
  { name: 'Bunbun',     r: 30,  c1: '#dcb8ff', c2: '#7f52d9', skin: 'bunny',  points: 110,   ex: 0.32, ey: -0.12, er: 0.092 },
  { name: 'Foxo',       r: 40,  c1: '#ffb04d', c2: '#d85b19', skin: 'fox',    points: 240,   ex: 0.33, ey: -0.12, er: 0.088 },
  { name: 'Panda Pop',  r: 52,  c1: '#fff5e8', c2: '#bfc9db', skin: 'panda',  points: 500,   ex: 0.32, ey: -0.08, er: 0.085 },
  { name: 'Froggle',    r: 65,  c1: '#9dff74', c2: '#2aa950', skin: 'frog',   points: 1050,  ex: 0.42, ey: -0.64, er: 0.080 },
  { name: 'Owlo',       r: 80,  c1: '#ffd36e', c2: '#9d5b24', skin: 'owl',    points: 2200,  ex: 0.27, ey: -0.14, er: 0.090 },
  { name: 'Dracopup',   r: 98,  c1: '#b28cff', c2: '#4d35b5', skin: 'dragon', points: 4500,  ex: 0.30, ey: -0.14, er: 0.080 },
  { name: 'Star Lion',  r: 118, c1: '#fff06a', c2: '#d98d19', skin: 'lion',   points: 9500,  ex: 0.28, ey: -0.12, er: 0.075 },
  { name: 'Luna Whale', r: 142, c1: '#7fb6ff', c2: '#2b3fb0', skin: 'whale',  points: 20000, ex: 0.30, ey: -0.16, er: 0.070 },
];

export const MAX_TIER = DROPIMALS.length - 1;

// Highest tier that can appear in the drop queue (like Suika's 5-of-11 rule).
export const MAX_DROP_TIER = 4;
