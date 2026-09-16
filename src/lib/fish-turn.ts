export type FishHeading = -1 | 1;
export type FishMotion = 'idle' | 'swimming' | 'braking' | 'turning' | 'recovering';

export interface FishMotionTempo {
  brakeSeconds: number;
  turnSeconds: number;
  recoverySeconds: number;
  turnCooldownSeconds: number;
}

export interface FishTurnState extends FishMotionTempo {
  heading: FishHeading;
  desiredHeading: FishHeading;
  headingRequestAge: number;
  turnMode: FishMotion;
  motionAge: number;
  vx: number;
  swimPhase: number;
  /* Blocks an immediate reverse after a committed flip. */
  turnCooldown: number;
}

export const BRAKE_SECONDS = 0.28;
// Twelve turn frames need a longer window than the eight-frame sheet did to clear 60ms per frame.
export const TURN_SECONDS = 0.85;
export const RECOVERY_SECONDS = 0.7;
const REQUEST_HOLD_SECONDS = 0.18;
const MIN_BRAKE_SECONDS = 0.1;
const SWIM_SETTLE_SECONDS = 0.22;
const TURN_COOLDOWN_SECONDS = 0.85;
const TURN_SPEED = 2;
const BRAKING_DRAG = 8;
/* The last progress at which the fish still reads as a profile, so an abort stays legible. */
export const TURN_COMMIT_PROGRESS = 0.32;
const POST_TURN_HOLD_SECONDS = 0.18;
const RECOVERY_EXIT_GAIN = 0.7;

export function motionTempo(phase: number): FishMotionTempo {
  // Each individual keeps its own tempo so duplicated fish do not beat in unison.
  const scale = 1 + 0.08 * Math.sin(phase * 1.7);
  return {
    brakeSeconds: BRAKE_SECONDS * scale,
    turnSeconds: TURN_SECONDS * scale,
    recoverySeconds: RECOVERY_SECONDS * scale,
    turnCooldownSeconds: TURN_COOLDOWN_SECONDS * scale,
  };
}

export function initialTurnClock(phase: number) {
  return {
    ...motionTempo(phase),
    turnCooldown: 0,
    motionAge: 0,
  };
}

function enterMotion(fish: FishTurnState, mode: FishMotion) {
  fish.turnMode = mode;
  fish.motionAge = 0;
  if (mode === 'braking' || mode === 'turning' || mode === 'recovering') {
    fish.swimPhase = 0;
  }
}

function recoveryGain(progress: number) {
  if (progress < 0.42) return 0;
  if (progress < 0.85) {
    const dart = (progress - 0.42) / 0.43;
    return 0.85 * dart * dart;
  }
  return 0.85 + (RECOVERY_EXIT_GAIN - 0.85) * ((progress - 0.85) / 0.15);
}

function swimmingGain(fish: FishTurnState) {
  if (fish.motionAge >= SWIM_SETTLE_SECONDS) return 1;
  return RECOVERY_EXIT_GAIN + (1 - RECOVERY_EXIT_GAIN) * (fish.motionAge / SWIM_SETTLE_SECONDS);
}

/** Locks only the committed flip, while retaining the latest steering request. */
export function updateFishTurn(
  fish: FishTurnState,
  requested: FishHeading,
  delta: number,
  drive = true,
) {
  fish.motionAge += delta;
  if (fish.turnCooldown > 0) {
    fish.turnCooldown = Math.max(0, fish.turnCooldown - delta);
  }
  if (requested !== fish.desiredHeading) {
    fish.desiredHeading = requested;
    fish.headingRequestAge = 0;
  } else {
    fish.headingRequestAge += delta;
  }
  if (fish.turnMode === 'turning') {
    if (
      fish.motionAge / fish.turnSeconds < TURN_COMMIT_PROGRESS &&
      fish.desiredHeading === fish.heading &&
      fish.headingRequestAge >= REQUEST_HOLD_SECONDS
    ) {
      enterMotion(fish, 'idle');
      return 0;
    }
    if (fish.motionAge < fish.turnSeconds) return 0;
    // Finish the committed direction even if the target changes during the turn.
    fish.heading = fish.heading === 1 ? -1 : 1;
    fish.turnCooldown = fish.turnCooldownSeconds;
    enterMotion(fish, 'idle');
    return 0;
  }
  if (fish.turnMode === 'braking') {
    if (Math.abs(fish.vx) > TURN_SPEED) return 0;
    if (fish.motionAge < Math.min(MIN_BRAKE_SECONDS, fish.brakeSeconds)) return 0;
    if (
      fish.desiredHeading !== fish.heading &&
      fish.headingRequestAge >= REQUEST_HOLD_SECONDS &&
      fish.turnCooldown <= 0
    ) {
      enterMotion(fish, 'turning');
      return 0;
    }
    enterMotion(fish, drive && fish.desiredHeading === fish.heading ? 'recovering' : 'idle');
  }
  if (fish.turnMode === 'recovering') {
    const progress = Math.min(1, fish.motionAge / fish.recoverySeconds);
    if (progress < 1) return recoveryGain(progress);
    enterMotion(fish, 'swimming');
  }
  if (
    fish.desiredHeading !== fish.heading &&
    fish.headingRequestAge >= REQUEST_HOLD_SECONDS &&
    fish.turnCooldown <= 0
  ) {
    enterMotion(fish, 'braking');
    return 0;
  }
  if (!drive && fish.turnMode === 'swimming') {
    enterMotion(fish, Math.abs(fish.vx) <= TURN_SPEED ? 'idle' : 'braking');
  }
  if (
    drive && fish.turnMode === 'idle' && fish.desiredHeading === fish.heading &&
    (fish.turnCooldown <= 0 || fish.motionAge >= POST_TURN_HOLD_SECONDS)
  ) {
    enterMotion(fish, 'recovering');
  }
  if (fish.turnMode === 'swimming') return swimmingGain(fish);
  return fish.turnMode === 'recovering'
    ? recoveryGain(Math.min(1, fish.motionAge / fish.recoverySeconds))
    : 0;
}

export function brakeFishTurn(fish: FishTurnState, delta: number) {
  if (fish.turnMode === 'braking') {
    fish.vx = fish.heading * Math.max(0, fish.vx * fish.heading) * Math.exp(-BRAKING_DRAG * delta);
  } else if (fish.turnMode === 'turning' || fish.turnMode === 'idle') {
    // Keep residual drift without letting avoidance propel a sideways pose.
    fish.vx *= Math.exp(-BRAKING_DRAG * delta);
  }
}
