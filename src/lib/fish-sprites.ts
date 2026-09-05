export interface FishClip {
  x: number;
  y: number;
  width: number;
  height: number;
  /* Frame-alignment point, 96px toward the tail from the eye on the right-facing sheet. */
  anchorX: number;
  anchorY: number;
  /* Eye. Travel and flips use this so the head leads and does not teleport. */
  headX: number;
  headY: number;
}

export type FishKind = 'male' | 'female';

// The male v2 sheet uses four columns and two rows; eyes are aligned within each cell.
const maleClips: FishClip[] = [
  { x: 0, y: 150, width: 362, height: 320, anchorX: 232, anchorY: 194, headX: 328, headY: 194 },
  { x: 362, y: 150, width: 362, height: 320, anchorX: 232, anchorY: 194, headX: 328, headY: 194 },
  { x: 724, y: 150, width: 362, height: 320, anchorX: 233, anchorY: 194, headX: 329, headY: 194 },
  { x: 1086, y: 150, width: 362, height: 320, anchorX: 233, anchorY: 194, headX: 329, headY: 194 },
  { x: 0, y: 600, width: 362, height: 320, anchorX: 232, anchorY: 199, headX: 328, headY: 199 },
  { x: 362, y: 600, width: 362, height: 320, anchorX: 232, anchorY: 199, headX: 328, headY: 199 },
  { x: 724, y: 600, width: 362, height: 320, anchorX: 233, anchorY: 199, headX: 329, headY: 199 },
  { x: 1086, y: 600, width: 362, height: 320, anchorX: 233, anchorY: 199, headX: 329, headY: 199 },
];

// The female sheet retains its irregular Figma clip rectangles, excluding frame numbers.
const femaleClips: FishClip[] = [
  { x: 0, y: 130, width: 402, height: 330, anchorX: 253, anchorY: 173, headX: 349, headY: 172 },
  { x: 402, y: 130, width: 376, height: 330, anchorX: 245, anchorY: 171, headX: 341, headY: 171 },
  { x: 778, y: 130, width: 384, height: 330, anchorX: 245, anchorY: 172, headX: 341, headY: 172 },
  { x: 1162, y: 130, width: 370, height: 330, anchorX: 230, anchorY: 173, headX: 326, headY: 173 },
  { x: 0, y: 560, width: 392, height: 340, anchorX: 254, anchorY: 182, headX: 350, headY: 182 },
  { x: 392, y: 560, width: 392, height: 340, anchorX: 251, anchorY: 187, headX: 347, headY: 187 },
  { x: 784, y: 560, width: 354, height: 340, anchorX: 231, anchorY: 180, headX: 327, headY: 180 },
  { x: 1138, y: 560, width: 394, height: 340, anchorX: 252, anchorY: 182, headX: 348, headY: 182 },
];

export const clipSets: Record<FishKind, FishClip[]> = {
  male: maleClips,
  female: femaleClips,
};

// Normalize source body widths to the simulation's original 256px reference.
export const spriteScale: Record<FishKind, number> = { male: 256 / 210, female: 1 };

/* How far the drawn fish reaches from its head, so the tail stays on the canvas. */
export const extent = [
  ...maleClips.map((clip) => ({ ...clip, headX: clip.headX * spriteScale.male,
    headY: clip.headY * spriteScale.male, width: clip.width * spriteScale.male,
    height: clip.height * spriteScale.male })),
  ...femaleClips,
].reduce(
  (current, clip) => ({
    left: Math.max(current.left, clip.headX),
    right: Math.max(current.right, clip.width - clip.headX),
    top: Math.max(current.top, clip.headY),
    bottom: Math.max(current.bottom, clip.height - clip.headY),
  }),
  { left: 0, right: 0, top: 0, bottom: 0 },
);

/* Width of the solid body in the first frame, used to size every frame from one number. */
export const REFERENCE_BODY_WIDTH = 256;

// Keep the sheet order and equal exposure; these poses do not justify invented in-between timing.
const swimClipOrder = [0, 1, 2, 3, 4, 5, 6, 7] as const;

/** Samples a normalized cycle without making its duration or thrust depend on the frame count. */
export function swimClipIndex(swimPhase: number, order: readonly number[] = swimClipOrder) {
  const phase = swimPhase - Math.floor(swimPhase);
  return order[Math.floor(phase * order.length)] ?? 0;
}
