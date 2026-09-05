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

/* The sheet is not a regular grid: these rectangles follow the Figma clip markers and leave the
   frame numbers outside every rect. */
const maleClips: FishClip[] = [
  { x: 0, y: 100, width: 402, height: 330, anchorX: 278, anchorY: 206, headX: 374, headY: 206 },
  { x: 402, y: 100, width: 376, height: 330, anchorX: 255, anchorY: 206, headX: 351, headY: 206 },
  { x: 778, y: 100, width: 384, height: 330, anchorX: 258, anchorY: 212, headX: 354, headY: 212 },
  { x: 1162, y: 100, width: 370, height: 330, anchorX: 240, anchorY: 208, headX: 336, headY: 207 },
  { x: 0, y: 530, width: 392, height: 340, anchorX: 264, anchorY: 222, headX: 360, headY: 222 },
  { x: 392, y: 530, width: 392, height: 340, anchorX: 268, anchorY: 225, headX: 364, headY: 225 },
  { x: 784, y: 530, width: 354, height: 340, anchorX: 227, anchorY: 226, headX: 323, headY: 226 },
  { x: 1138, y: 530, width: 394, height: 340, anchorX: 269, anchorY: 222, headX: 365, headY: 222 },
];

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

/* How far the drawn fish reaches from its head, so the tail stays on the canvas. */
export const extent = [...maleClips, ...femaleClips].reduce(
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
