export type FishHeading = -1 | 1;
export type FishMotion = 'idle' | 'swimming' | 'braking' | 'turning' | 'recovering';

export interface FishTurnState {
  heading: FishHeading;
  desiredHeading: FishHeading;
  headingRequestAge: number;
  turnMode: FishMotion;
  motionAge: number;
  vx: number;
  swimPhase: number;
}

export const BRAKE_SECONDS = 0.48;
export const TURN_SECONDS = 1.05;
export const RECOVERY_SECONDS = 0.8;
const REQUEST_HOLD_SECONDS = 0.18;
const TURN_SPEED = 2;
const BRAKING_DRAG = 8;

function enterMotion(fish: FishTurnState, mode: FishMotion) {
  fish.turnMode = mode;
  fish.motionAge = 0;
  fish.swimPhase = 0;
}

/** Locks a committed turn until its final pose, while retaining the latest steering request. */
export function updateFishTurn(fish: FishTurnState, requested: FishHeading, delta: number, drive = true) {
  fish.motionAge += delta;
  if (requested !== fish.desiredHeading) {
    fish.desiredHeading = requested;
    fish.headingRequestAge = 0;
  } else {
    fish.headingRequestAge += delta;
  }
  if (fish.turnMode === 'turning') {
    if (fish.motionAge < TURN_SECONDS) return 0;
    // Finish the committed direction even if the target changes during the turn.
    fish.heading = fish.heading === 1 ? -1 : 1;
    enterMotion(fish, drive ? 'recovering' : 'idle');
  }
  if (fish.turnMode === 'braking') {
    if (fish.motionAge < BRAKE_SECONDS || Math.abs(fish.vx) > TURN_SPEED) return 0;
    if (fish.desiredHeading !== fish.heading && fish.headingRequestAge >= REQUEST_HOLD_SECONDS) {
      enterMotion(fish, 'turning');
      return 0;
    }
    enterMotion(fish, drive ? 'recovering' : 'idle');
  }
  if (fish.turnMode === 'recovering') {
    const progress = Math.min(1, fish.motionAge / RECOVERY_SECONDS);
    if (progress < 1) return 0.25 + 0.75 * progress * progress * (3 - 2 * progress);
    enterMotion(fish, 'swimming');
  }
  if (fish.desiredHeading !== fish.heading && fish.headingRequestAge >= REQUEST_HOLD_SECONDS) {
    enterMotion(fish, 'braking');
    return 0;
  }
  if (!drive && fish.turnMode === 'swimming') enterMotion(fish, 'braking');
  if (drive && fish.turnMode === 'idle') enterMotion(fish, 'recovering');
  return fish.turnMode === 'swimming' ? 1 : fish.turnMode === 'recovering' ? 0.25 : 0;
}

export function brakeFishTurn(fish: FishTurnState, delta: number) {
  if (fish.turnMode === 'braking') {
    fish.vx = fish.heading * Math.max(0, fish.vx * fish.heading) * Math.exp(-BRAKING_DRAG * delta);
  } else if (fish.turnMode === 'turning' || fish.turnMode === 'idle') {
    // Keep residual drift without letting avoidance propel a sideways pose.
    fish.vx *= Math.exp(-BRAKING_DRAG * delta);
  }
}
