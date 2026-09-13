import { BRAKE_SECONDS, RECOVERY_SECONDS, TURN_SECONDS, type FishTurnState } from './fish-turn';

export type FishKind = 'male' | 'female';
export const REFERENCE_BODY_WIDTH = 256;
export const spriteScale: Record<FishKind, number> = { male: 256 / 94, female: 256 / 94 };

// Bounds include fins around the body anchor, without counting atlas padding as fish.
export const extent = { left: 256, right: 256, top: 300, bottom: 210 };

export function fishPose(fish: FishTurnState) {
  const left = fish.heading < 0;
  let row = left ? 6 : 1;
  let phase = fish.swimPhase;
  let flip = false;
  switch (fish.turnMode) {
    case 'idle': row = left ? 5 : 0; break;
    case 'braking':
      row = left ? 8 : 3;
      phase = Math.min(fish.motionAge / BRAKE_SECONDS, 0.999999);
      break;
    case 'recovering':
      row = left ? 7 : 2;
      phase = Math.min(fish.motionAge / RECOVERY_SECONDS, 0.999999);
      break;
    case 'turning':
      // Row ten has invalid direction ordering. Mirror row five spatially, never in time.
      row = 4;
      flip = left;
      phase = Math.min(fish.motionAge / TURN_SECONDS, 0.999999);
      break;
  }
  const column = Math.min(7, Math.max(0, Math.floor(phase * 8)));
  return { x: column * 256, y: row * 320, width: 256, height: 320, anchorX: 128, anchorY: 128, flip };
}
