import { isSwimGliding } from './fish-swim-cycle';

export type FishHeading = -1 | 1;

export interface FishTurnState {
  heading: FishHeading;
  desiredHeading: FishHeading;
  headingRequestAge: number;
  turnMode: 'swimming' | 'braking' | 'recovering';
  recoveryAge: number;
  vx: number;
  swimPhase: number;
}

const REQUEST_HOLD_SECONDS = 0.18;
const RECOVERY_SECONDS = 0.65;
const TURN_SPEED = 2;
const BRAKING_DRAG = 8;

/** Returns the propulsion gain; the swim clock continues through braking and recovery. */
export function updateFishTurn(fish: FishTurnState, requested: FishHeading, delta: number) {
  if (requested !== fish.desiredHeading) {
    fish.desiredHeading = requested;
    fish.headingRequestAge = 0;
  } else {
    fish.headingRequestAge += delta;
  }

  if (fish.turnMode === 'recovering') {
    fish.recoveryAge = Math.min(RECOVERY_SECONDS, fish.recoveryAge + delta);
    if (fish.recoveryAge < RECOVERY_SECONDS) return fish.recoveryAge / RECOVERY_SECONDS;
    fish.turnMode = 'swimming';
  }

  if (fish.headingRequestAge >= REQUEST_HOLD_SECONDS) {
    if (fish.desiredHeading === fish.heading) fish.turnMode = 'swimming';
    else fish.turnMode = 'braking';
  }

  if (fish.turnMode !== 'braking') return 1;
  if (
    fish.desiredHeading !== fish.heading &&
    fish.headingRequestAge >= REQUEST_HOLD_SECONDS &&
    Math.abs(fish.vx) <= TURN_SPEED &&
    isSwimGliding(fish.swimPhase)
  ) {
    fish.heading = fish.desiredHeading;
    fish.vx = 0;
    fish.turnMode = 'recovering';
    fish.recoveryAge = 0;
  }
  return 0;
}

export function brakeFishTurn(fish: FishTurnState, delta: number) {
  if (fish.turnMode !== 'braking') return;
  // External avoidance may stop the fish, but must not pull it backwards before the flip.
  fish.vx = fish.heading * Math.max(0, fish.vx * fish.heading) * Math.exp(-BRAKING_DRAG * delta);
}
