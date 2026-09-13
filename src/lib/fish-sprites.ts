import { TURN_COMMIT_PROGRESS, type FishTurnState } from './fish-turn';

export type FishKind = 'male' | 'female';
export const REFERENCE_BODY_WIDTH = 256;
export const spriteScale: Record<FishKind, number> = { male: 256 / 94, female: 256 / 94 };

// Bounds include fins around the body anchor, without counting atlas padding as fish.
export const extent = { left: 256, right: 256, top: 300, bottom: 210 };

const SHEET_COLUMNS = 8;

// Hold the side pose, spend time on the side-to-front gap, and leave the last frame short.
const TURN_COLUMN_WEIGHTS = [0.2, TURN_COMMIT_PROGRESS - 0.2, 0.18, 0.16, 0.12, 0.1, 0.08, 0.04] as const;
const BRAKE_COLUMN_WEIGHTS = [0.18, 0.12, 0.1, 0.1, 0.1, 0.1, 0.12, 0.18] as const;
const RECOVERY_COLUMN_WEIGHTS = [0.06, 0.1, 0.12, 0.14, 0.16, 0.16, 0.14, 0.12] as const;
const TURN_FRONTNESS: Record<FishKind, readonly number[]> = {
  male: [0, 0.05, 0.25, 1, 0.95, 0.45, 0.15, 0],
  female: [0, 0.05, 0.25, 0.45, 1, 0.45, 0.15, 0],
};

export function sheetColumn(weights: readonly number[], progress: number) {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const sample = Math.min(Math.max(progress, 0), 0.999999) * total;
  let acc = 0;
  for (let index = 0; index < weights.length; index += 1) {
    acc += weights[index] ?? 0;
    if (sample < acc) return index;
  }
  return Math.max(0, weights.length - 1);
}

export function motionProgress(age: number, duration: number) {
  if (duration <= 0) return 1;
  return Math.min(Math.max(0, age / duration), 0.999999);
}

export function turnFrontness(fish: FishTurnState, kind: FishKind) {
  if (fish.turnMode !== 'turning') return 0;
  const column = sheetColumn(TURN_COLUMN_WEIGHTS, motionProgress(fish.motionAge, fish.turnSeconds));
  return TURN_FRONTNESS[kind][column] ?? 0;
}

export function fishPose(fish: FishTurnState) {
  const left = fish.heading < 0;
  let row = left ? 6 : 1;
  let column = Math.min(SHEET_COLUMNS - 1, Math.max(0, Math.floor(fish.swimPhase * SHEET_COLUMNS)));
  let flip = false;
  switch (fish.turnMode) {
    case 'idle':
      row = left ? 5 : 0;
      break;
    case 'braking':
      row = left ? 8 : 3;
      column = sheetColumn(BRAKE_COLUMN_WEIGHTS, motionProgress(fish.motionAge, fish.brakeSeconds));
      break;
    case 'recovering':
      row = left ? 7 : 2;
      column = sheetColumn(RECOVERY_COLUMN_WEIGHTS, motionProgress(fish.motionAge, fish.recoverySeconds));
      break;
    case 'turning':
      // Row ten has invalid direction ordering. Mirror row five spatially, never in time.
      row = 4;
      flip = left;
      column = sheetColumn(TURN_COLUMN_WEIGHTS, motionProgress(fish.motionAge, fish.turnSeconds));
      break;
  }
  return { x: column * 256, y: row * 320, width: 256, height: 320, anchorX: 128, anchorY: 128, flip };
}
