/**
 * Entrance presets, expressed as the *starting* state for `gsap.from()`.
 *
 * Using `from()` rather than `to()` is deliberate: the resting state stays in
 * the markup, so anything that stops the script from running — no JS, a bundle
 * error, or `prefers-reduced-motion` — leaves the page fully readable instead of
 * stuck at `opacity: 0`. Nothing here should ever be mirrored in CSS.
 */
export const MOTION_PRESETS = {
  fade: { autoAlpha: 0 },
  'fade-up': { autoAlpha: 0, y: 28 },
  'fade-down': { autoAlpha: 0, y: -28 },
  'fade-left': { autoAlpha: 0, x: 28 },
  'fade-right': { autoAlpha: 0, x: -28 },
  'scale-in': { autoAlpha: 0, scale: 0.94 },
  'blur-in': { autoAlpha: 0, filter: 'blur(12px)' },
  /** Reveals from the bottom edge; pair with `overflow-hidden` on a wrapper. */
  'clip-up': { clipPath: 'inset(100% 0 0 0)', y: 12 },
} satisfies Record<string, gsap.TweenVars>;

export type MotionPreset = keyof typeof MOTION_PRESETS;

export const isMotionPreset = (value: string | undefined): value is MotionPreset =>
  value !== undefined && value in MOTION_PRESETS;
