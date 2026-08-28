import { MOTION_ELECTRONIC_CYCLE_MS } from './motion-tokens';
import type { GlitchStep } from './mosaic-glitch';

const CYCLE_S = MOTION_ELECTRONIC_CYCLE_MS / 1000;

/* The image falters with the card ignition, then stabilizes before the surface finishes settling. */
export const CARD_IMAGE_GLITCH_SEQUENCE: readonly GlitchStep[] = [
  {
    until: CYCLE_S * 0.04,
    mosaicPx: 14,
    dissolve: 0.04,
    scatter: 0.1,
    chromaPx: 1.8,
  },
  {
    until: CYCLE_S * 0.2,
    mosaicPx: 10,
    dissolve: 0.06,
    scatter: 0.1,
    chromaPx: 1.2,
  },
  {
    until: CYCLE_S * 0.42,
    mosaicPx: 8,
    dissolve: 0.18,
    scatter: 0.2,
    chromaPx: 0.6,
  },
  {
    until: CYCLE_S * 0.64,
    mosaicPx: 10,
    dissolve: 0.03,
    scatter: 0.08,
    chromaPx: 1,
  },
  {
    until: CYCLE_S * 0.78,
    mosaicPx: 5,
    dissolve: 0,
    scatter: 0.03,
    chromaPx: 0.4,
  },
];

export const CARD_IMAGE_GLITCH_DURATION_S = CYCLE_S;
