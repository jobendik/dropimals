import { state } from '../state';
import { DROPIMALS, MAX_TIER } from '../data/dropimals';
import { addFloater, burstConfetti } from './fx';
import { sfxMission } from '../audio/audio';
import { clamp, formatScore } from '../utils/math';
import type { Mission } from '../types';

export function makeMission(): Mission {
  const { bestTier, missionIndex, score } = state;
  const tierLimit = Math.max(2, Math.min(MAX_TIER - 1, bestTier + 2));
  const tier = Math.min(tierLimit, 2 + Math.floor(missionIndex * 0.65) % (tierLimit + 1));
  const typeRoll = missionIndex % 4;

  if (typeRoll === 0) {
    return {
      type: 'tier',
      text: 'Make a ' + DROPIMALS[tier].name,
      targetTier: tier,
      goal: 1,
      progress: 0,
      reward: 400 + tier * 300,
    };
  }

  if (typeRoll === 1) {
    const goal = 4 + Math.min(8, missionIndex);
    return {
      type: 'merges',
      text: 'Merge ' + goal + ' pairs',
      goal,
      progress: 0,
      reward: 600 + goal * 80,
    };
  }

  if (typeRoll === 2) {
    const goal = Math.min(4, 2 + Math.floor(missionIndex / 4));
    return {
      type: 'combo',
      text: 'Hit a x' + goal + ' combo',
      goal,
      progress: 0,
      reward: 700 + goal * 250,
    };
  }

  const goal = Math.max(1500, Math.floor((score + 2200 + missionIndex * 1100) / 500) * 500);
  return {
    type: 'score',
    text: 'Reach ' + formatScore(goal) + ' points',
    goal,
    progress: score,
    reward: 850 + missionIndex * 180,
  };
}

function completeMission(): void {
  if (!state.mission) return;
  state.score += state.mission.reward;
  state.missionsDone++;
  state.nudgeCharge = Math.min(1, state.nudgeCharge + 0.4);
  addFloater('MISSION +' + formatScore(state.mission.reward), 210, 200, '#fff6a8', 1.2, 28);
  burstConfetti(210, 160, 50);
  sfxMission();
  state.missionIndex++;
  state.mission = makeMission();
}

export function updateMissionForMerge(tier: number): void {
  const { mission } = state;
  if (!mission) return;

  if (mission.type === 'tier' && tier === mission.targetTier) {
    mission.progress++;
  } else if (mission.type === 'merges') {
    mission.progress++;
  } else if (mission.type === 'combo') {
    mission.progress = Math.max(mission.progress, state.combo);
  }

  if (mission.progress >= mission.goal) completeMission();
}

export function updateMissionForScore(): void {
  const { mission } = state;
  if (!mission || mission.type !== 'score') return;
  mission.progress = Math.min(state.score, mission.goal);
  if (state.score >= mission.goal) completeMission();
}

export function getMissionProgress(): number {
  const { mission } = state;
  if (!mission) return 0;
  return clamp(mission.progress / mission.goal, 0, 1);
}
