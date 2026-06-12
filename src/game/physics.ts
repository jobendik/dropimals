import { state } from '../state';
import { LEFT, RIGHT, FLOOR, WALL_BOUNCE, FLOOR_FRICTION, COLLISION_BOUNCE } from '../constants';
import type { Body } from '../types';

export function collideWalls(b: Body): void {
  if (b.x - b.r < LEFT) {
    b.x = LEFT + b.r;
    b.vx = Math.abs(b.vx) * WALL_BOUNCE;
    b.av *= 0.85;
  }

  if (b.x + b.r > RIGHT) {
    b.x = RIGHT - b.r;
    b.vx = -Math.abs(b.vx) * WALL_BOUNCE;
    b.av *= 0.85;
  }

  if (b.y + b.r > FLOOR) {
    b.y = FLOOR - b.r;
    if (Math.abs(b.vy) < 65) {
      b.vy = 0;
    } else {
      // Hard landing: squash for the spring-back animation.
      b.squash = Math.min(b.squash, Math.max(0.68, 1 - Math.abs(b.vy) / 2200));
      b.vy = -Math.abs(b.vy) * 0.10;
    }
    b.vx *= FLOOR_FRICTION;
    b.av *= 0.82;
  }
}

export function solveCircleCollisions(): void {
  const { bodies } = state;

  for (let i = 0; i < bodies.length; i++) {
    const a = bodies[i];
    for (let j = i + 1; j < bodies.length; j++) {
      const b = bodies[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let distSq = dx * dx + dy * dy;
      const minDist = a.r + b.r;

      if (distSq <= 0.0001) { dx = 0.1; dy = 0; distSq = 0.01; }
      if (distSq >= minDist * minDist) continue;

      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = minDist - dist;

      const invA = 1 / a.mass;
      const invB = 1 / b.mass;
      const invSum = invA + invB;

      const correction = overlap / invSum;
      a.x -= nx * correction * invA;
      a.y -= ny * correction * invA;
      b.x += nx * correction * invB;
      b.y += ny * correction * invB;

      const rvx = b.vx - a.vx;
      const rvy = b.vy - a.vy;
      const velAlongNormal = rvx * nx + rvy * ny;

      if (velAlongNormal < 0) {
        const impulse = -(1 + COLLISION_BOUNCE) * velAlongNormal / invSum;
        a.vx -= impulse * invA * nx;
        a.vy -= impulse * invA * ny;
        b.vx += impulse * invB * nx;
        b.vy += impulse * invB * ny;

        const tx = -ny;
        const ty = nx;
        const tangentVel = rvx * tx + rvy * ty;
        const frictionImpulse = -tangentVel * 0.035 / invSum;
        a.vx -= frictionImpulse * invA * tx;
        a.vy -= frictionImpulse * invA * ty;
        b.vx += frictionImpulse * invB * tx;
        b.vy += frictionImpulse * invB * ty;

        a.av -= tangentVel * 0.0008;
        b.av += tangentVel * 0.0008;
      }
    }
  }
}

/**
 * Predict where the currently aimed Dropimal would come to rest.
 * Approximation: rest on the highest body whose x-range overlaps the
 * drop column, otherwise on the floor. Good enough for an aim ghost.
 */
export function predictLandingY(x: number, r: number): number {
  let y = FLOOR - r;
  for (const b of state.bodies) {
    const dx = Math.abs(b.x - x);
    if (dx >= b.r + r) continue;
    // Circle-on-circle resting position for this horizontal offset
    const dy = Math.sqrt(Math.max(0, (b.r + r) * (b.r + r) - dx * dx));
    y = Math.min(y, b.y - dy);
  }
  return y;
}
