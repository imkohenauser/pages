const PUSH_START = 0.125;
const PUSH_END = 0.375;

export function isSwimGliding(swimPhase: number) {
  const beatPhase = swimPhase - Math.floor(swimPhase * 2) / 2;
  return beatPhase < PUSH_START || beatPhase >= PUSH_END;
}

// Two equal beats share one cycle's impulse, regardless of sprite sampling.
function cumulativeImpulse(phase: number) {
  const cycles = Math.floor(phase);
  const local = phase - cycles;
  let impulse = cycles;
  for (const offset of [0, 0.5]) {
    const progress = Math.min(
      Math.max((local - offset - PUSH_START) / (PUSH_END - PUSH_START), 0),
      1,
    );
    impulse += 0.5 * (progress - Math.sin(2 * Math.PI * progress) / (2 * Math.PI));
  }
  return impulse;
}

/** Integrates a nonnegative delta over a positive cycle duration, including complete cycles. */
export function advanceSwimPhase(swimPhase: number, delta: number, cycleSeconds: number) {
  const next = swimPhase + delta / cycleSeconds;
  return {
    swimPhase: next - Math.floor(next),
    impulseFraction: cumulativeImpulse(next) - cumulativeImpulse(swimPhase),
  };
}
