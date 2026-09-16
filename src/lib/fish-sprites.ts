import type { FishTurnState } from './fish-turn.ts';

const CELL_WIDTH = 168;
const CELL_HEIGHT = 126;
const ATLAS_COLUMNS = 4;
/* The pivot the atlas was packed around: mid-body, one eye-length behind the eye. */
const ANCHOR_X = 85.58;
const ANCHOR_Y = 61.43;
/* Measured on the export: snout to caudal peduncle spans 0.7 of the cell width. */
const BODY_WIDTH_IN_CELL = 0.7 * CELL_WIDTH;

const SWIM_FIRST_FRAME = 0;
const SWIM_FRAMES = 8;
const HOVER_FIRST_FRAME = 8;
const HOVER_FRAMES = 4;
const TURN_FIRST_FRAME = 12;

export const REFERENCE_BODY_WIDTH = 256;
export const spriteScale = REFERENCE_BODY_WIDTH / BODY_WIDTH_IN_CELL;

// Fin reach around the body anchor, in the same units as REFERENCE_BODY_WIDTH.
export const extent = { left: 186, right: 177, top: 133, bottom: 130 };

/* The first three frames still read as a profile, the rotation lands over frames four to eight,
   and the rest settles into the opposite profile. */
const TURN_FRAME_WEIGHTS = [
  0.1, 0.08, 0.07, 0.07, 0.07, 0.08, 0.07, 0.07, 0.11, 0.1, 0.1, 0.08,
] as const;
const TURN_FRONTNESS = [0, 0, 0, 0.15, 0.6, 1, 0.6, 0.2, 0, 0, 0, 0] as const;

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

export function turnFrontness(fish: FishTurnState) {
  if (fish.turnMode !== 'turning') return 0;
  const frame = sheetColumn(TURN_FRAME_WEIGHTS, motionProgress(fish.motionAge, fish.turnSeconds));
  return TURN_FRONTNESS[frame] ?? 0;
}

function loopFrame(first: number, count: number, phase: number) {
  return first + Math.min(count - 1, Math.max(0, Math.floor(phase * count)));
}

export function fishPose(fish: FishTurnState) {
  let frame: number;
  switch (fish.turnMode) {
    // Hover reads as a fish holding station, which is also what a braking fish is doing.
    case 'idle':
    case 'braking':
      frame = loopFrame(HOVER_FIRST_FRAME, HOVER_FRAMES, fish.swimPhase);
      break;
    case 'turning':
      frame =
        TURN_FIRST_FRAME +
        sheetColumn(TURN_FRAME_WEIGHTS, motionProgress(fish.motionAge, fish.turnSeconds));
      break;
    // Recovery resets the phase and runs one stroke over its own clock, so the swim loop fits it.
    default:
      frame = loopFrame(SWIM_FIRST_FRAME, SWIM_FRAMES, fish.swimPhase);
      break;
  }

  return {
    x: (frame % ATLAS_COLUMNS) * CELL_WIDTH,
    y: Math.floor(frame / ATLAS_COLUMNS) * CELL_HEIGHT,
    width: CELL_WIDTH,
    height: CELL_HEIGHT,
    anchorX: ANCHOR_X,
    anchorY: ANCHOR_Y,
    // The art faces right, and the turn clip runs right to left, so one mirror serves both.
    flip: fish.heading < 0,
  };
}
