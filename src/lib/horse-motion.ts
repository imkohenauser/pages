export const HORSE_SPRITE = 'sprite-sheet/white-horse_v1.webp';

export const HORSE_ATLAS_WIDTH = 1448;
export const HORSE_ATLAS_HEIGHT = 1086;

export type HorseClip = {
  atlasX: number;
  atlasY: number;
  atlasWidth: number;
  atlasHeight: number;
  // Exit decay is applied before the echo decay.
  exitOpacity?: number;
  exitMosaicPx?: number;
  exitDissolve?: number;
  y: number;
  width: number;
  height: number;
  masked: boolean;
} & (
  // Approach positions are fixed; exits use the space remaining to the right of the gate.
  { x: number; exitProgress?: never } | { x?: never; exitProgress: number }
);

// Positions include the source artwork’s (-220, 390) offset within the arch.
export const approachClips = [
  { atlasX: 0, atlasY: 0, atlasWidth: 362, atlasHeight: 340, x: -89, y: 613, width: 59, height: 57, masked: true },
  { atlasX: 362, atlasY: 0, atlasWidth: 362, atlasHeight: 340, x: -55, y: 603, width: 60, height: 57, masked: true },
  { atlasX: 724, atlasY: 0, atlasWidth: 362, atlasHeight: 340, x: -27, y: 587, width: 77, height: 74, masked: true },
  { atlasX: 1086, atlasY: 0, atlasWidth: 362, atlasHeight: 340, x: 7, y: 582, width: 91, height: 87, masked: true },
  { atlasX: 0, atlasY: 340, atlasWidth: 362, atlasHeight: 332, x: 41, y: 577, width: 118, height: 110, masked: false },
  { atlasX: 362, atlasY: 340, atlasWidth: 362, atlasHeight: 332, x: 60, y: 566, width: 155, height: 142, masked: false },
  { atlasX: 724, atlasY: 340, atlasWidth: 362, atlasHeight: 332, x: 81, y: 549, width: 211, height: 195, masked: false },
  { atlasX: 1086, atlasY: 340, atlasWidth: 362, atlasHeight: 332, x: 111, y: 550, width: 272, height: 251, masked: false },
  { atlasX: 0, atlasY: 672, atlasWidth: 362, atlasHeight: 414, x: 161, y: 563, width: 333, height: 382, masked: false },
  { atlasX: 362, atlasY: 672, atlasWidth: 362, atlasHeight: 414, x: 190, y: 573, width: 423, height: 482, masked: false },
  { atlasX: 724, atlasY: 672, atlasWidth: 362, atlasHeight: 414, x: 231, y: 583, width: 539, height: 618, masked: false },
  { atlasX: 1086, atlasY: 672, atlasWidth: 362, atlasHeight: 414, x: 381, y: 593, width: 597, height: 684, masked: false },
] satisfies HorseClip[];

/* Fixed uneven step durations, so the run reads as sampled frames rather than a smooth trajectory.
   Never randomise these at runtime. The exit shortens as the horse accelerates past the viewer. */
export const stepDurationsMs = [330, 259, 259, 373, 216, 216, 330, 201, 201, 373, 273, 316, 244, 208, 179, 158];

export const runCycle = approachClips.slice(8, 12).map((clip, index) => ({
  ...clip,
  durationMs: stepDurationsMs[index + 8],
}));
