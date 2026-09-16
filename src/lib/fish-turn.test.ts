import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TURN_COMMIT_PROGRESS,
  initialTurnClock,
  updateFishTurn,
  type FishHeading,
  type FishTurnState,
} from './fish-turn.ts';

const STEP_S = 1 / 60;

function swimmer(overrides: Partial<FishTurnState> = {}) {
  const base: FishTurnState = {
    ...initialTurnClock(0),
    heading: 1,
    desiredHeading: 1,
    headingRequestAge: 1,
    turnMode: 'swimming',
    motionAge: 1,
    vx: 0,
    swimPhase: 0,
  };
  return Object.assign(base, overrides);
}

function run(fish: FishTurnState, requested: FishHeading, seconds: number, drive = true) {
  const modes = new Set([fish.turnMode]);
  for (let elapsed = 0; elapsed < seconds; elapsed += STEP_S) {
    updateFishTurn(fish, requested, STEP_S, drive);
    modes.add(fish.turnMode);
  }
  return modes;
}

function runUntilTurning(fish: FishTurnState) {
  for (let step = 0; step < 600; step += 1) {
    updateFishTurn(fish, -1, STEP_S);
    if (fish.turnMode === 'turning') return true;
  }
  return false;
}

test('a sustained opposite request brakes, turns, then flips the heading', () => {
  const fish = swimmer();
  const modes = run(fish, -1, 2.5);

  assert.ok(modes.has('braking'), 'the fish slows before turning');
  assert.ok(modes.has('turning'), 'the fish plays the turn');
  assert.equal(fish.heading, -1);
  assert.notEqual(fish.turnMode, 'turning');
});

test('a brief request does not start a turn', () => {
  const fish = swimmer();
  run(fish, -1, 0.15);

  assert.equal(fish.heading, 1);
  assert.equal(fish.turnMode, 'swimming');
});

test('reversing before the commit point aborts the turn without flipping', () => {
  const fish = swimmer();
  assert.ok(runUntilTurning(fish));

  const modes = run(fish, 1, 0.2);

  assert.ok(modes.has('idle'), 'the abort drops the turn before it commits');
  assert.notEqual(fish.turnMode, 'turning');
  assert.equal(fish.heading, 1, 'an aborted turn keeps the original heading');
});

test('reversing after the commit point still completes the flip', () => {
  const fish = swimmer();
  assert.ok(runUntilTurning(fish));

  const pastCommit = TURN_COMMIT_PROGRESS * fish.turnSeconds + 2 * STEP_S;
  run(fish, -1, pastCommit);
  assert.equal(fish.turnMode, 'turning', 'the turn is still running at the commit point');

  run(fish, 1, fish.turnSeconds);
  assert.equal(fish.heading, -1);
});

test('the cooldown blocks a second turn immediately after a flip', () => {
  const fish = swimmer();
  assert.ok(runUntilTurning(fish));
  run(fish, -1, fish.turnSeconds + STEP_S);
  assert.equal(fish.heading, -1);
  assert.ok(fish.turnCooldown > 0);

  const modes = run(fish, 1, fish.turnCooldown - STEP_S);

  assert.ok(!modes.has('turning'), 'the fish does not reverse inside its cooldown');
  assert.equal(fish.heading, -1);
});

test('losing drive settles a swimming fish into hover', () => {
  const fish = swimmer();
  run(fish, 1, 0.5, false);

  assert.equal(fish.turnMode, 'idle');
  assert.equal(fish.heading, 1);
});

test('each individual keeps its own tempo', () => {
  const first = initialTurnClock(0);
  const second = initialTurnClock(1.4);

  assert.notEqual(first.turnSeconds, second.turnSeconds);
  assert.ok(second.turnSeconds > 0 && second.recoverySeconds > 0);
});
