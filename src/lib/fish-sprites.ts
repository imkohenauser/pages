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

// Female v2 uses the same reading order, with independently aligned eyes.
const femaleClips: FishClip[] = [
  { x: 0, y: 60, width: 444, height: 350, anchorX: 302, anchorY: 174, headX: 398, headY: 174 },
  { x: 444, y: 60, width: 443, height: 350, anchorX: 298, anchorY: 175, headX: 394, headY: 175 },
  { x: 887, y: 60, width: 444, height: 350, anchorX: 295, anchorY: 175, headX: 391, headY: 175 },
  { x: 1331, y: 60, width: 443, height: 350, anchorX: 290, anchorY: 174, headX: 386, headY: 174 },
  { x: 0, y: 480, width: 444, height: 350, anchorX: 302, anchorY: 179, headX: 398, headY: 179 },
  { x: 444, y: 480, width: 443, height: 350, anchorX: 299, anchorY: 177, headX: 395, headY: 177 },
  { x: 887, y: 480, width: 444, height: 350, anchorX: 298, anchorY: 178, headX: 394, headY: 178 },
  { x: 1331, y: 480, width: 443, height: 350, anchorX: 296, anchorY: 180, headX: 392, headY: 180 },
];

export const clipSets: Record<FishKind, FishClip[]> = {
  male: maleClips,
  female: femaleClips,
};

// Normalize source body widths to the simulation's original 256px reference.
export const spriteScale: Record<FishKind, number> = { male: 256 / 210, female: 256 / 290 };

/* How far the drawn fish reaches from its head, so the tail stays on the canvas. */
export const extent = [
  ...maleClips.map((clip) => ({ ...clip, headX: clip.headX * spriteScale.male,
    headY: clip.headY * spriteScale.male, width: clip.width * spriteScale.male,
    height: clip.height * spriteScale.male })),
  ...femaleClips.map((clip) => ({ ...clip, headX: clip.headX * spriteScale.female,
    headY: clip.headY * spriteScale.female, width: clip.width * spriteScale.female,
    height: clip.height * spriteScale.female })),
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
