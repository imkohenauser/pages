import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extent,
  motionProgress,
  fishPose,
  sheetColumn,
  spriteScale,
  turnFrontness,
} from './fish-sprites.ts';
import { initialTurnClock, type FishMotion, type FishTurnState } from './fish-turn.ts';

const ATLAS_WIDTH = 672;
const ATLAS_HEIGHT = 756;
const COLUMNS = 4;

function state(turnMode: FishMotion, overrides: Partial<FishTurnState> = {}) {
  const base: FishTurnState = {
    ...initialTurnClock(0),
    heading: 1,
    desiredHeading: 1,
    headingRequestAge: 1,
    turnMode,
    motionAge: 0,
    vx: 0,
    swimPhase: 0,
  };
  return Object.assign(base, overrides);
}

function frameIndex(pose: ReturnType<typeof fishPose>) {
  return (pose.y / pose.height) * COLUMNS + pose.x / pose.width;
}

function sweepPhase(turnMode: FishMotion, steps = 400) {
  return Array.from({ length: steps }, (_, step) =>
    frameIndex(fishPose(state(turnMode, { swimPhase: step / steps }))),
  );
}

function sweepTurn(steps = 400) {
  const turnSeconds = initialTurnClock(0).turnSeconds;
  return Array.from({ length: steps }, (_, step) =>
    frameIndex(fishPose(state('turning', { motionAge: (step / steps) * turnSeconds }))),
  );
}

test('every pose stays inside the atlas', () => {
  const modes: FishMotion[] = ['idle', 'swimming', 'braking', 'turning', 'recovering'];
  for (const mode of modes) {
    for (let step = 0; step < 64; step += 1) {
      const pose = fishPose(
        state(mode, { swimPhase: step / 64, motionAge: (step / 64) * 0.85 }),
      );
      assert.ok(pose.x >= 0 && pose.x + pose.width <= ATLAS_WIDTH, `${mode} x out of range`);
      assert.ok(pose.y >= 0 && pose.y + pose.height <= ATLAS_HEIGHT, `${mode} y out of range`);
      assert.ok(Number.isInteger(pose.x) && Number.isInteger(pose.y));
    }
  }
});

test('swimming and recovering walk the eight swim frames in order', () => {
  for (const mode of ['swimming', 'recovering'] as const) {
    const frames = sweepPhase(mode);
    assert.deepEqual([...new Set(frames)], [0, 1, 2, 3, 4, 5, 6, 7], `${mode} frame coverage`);
    assert.deepEqual(frames, [...frames].sort((a, b) => a - b), `${mode} frame order`);
  }
});

test('idle and braking share the four hover frames', () => {
  for (const mode of ['idle', 'braking'] as const) {
    assert.deepEqual([...new Set(sweepPhase(mode))], [8, 9, 10, 11], `${mode} frame coverage`);
  }
});

test('a turn plays all twelve frames once, in order', () => {
  const frames = sweepTurn();
  assert.deepEqual([...new Set(frames)], [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]);
  assert.deepEqual(frames, [...frames].sort((a, b) => a - b));
});

test('a left heading mirrors every clip instead of selecting a second row', () => {
  for (const mode of ['idle', 'swimming', 'turning'] as const) {
    assert.equal(fishPose(state(mode)).flip, false);
    assert.equal(fishPose(state(mode, { heading: -1 })).flip, true);
    assert.equal(
      frameIndex(fishPose(state(mode))),
      frameIndex(fishPose(state(mode, { heading: -1 }))),
      `${mode} uses one clip for both directions`,
    );
  }
});

test('frontness peaks only while the turn faces the viewer', () => {
  assert.equal(turnFrontness(state('swimming')), 0);
  assert.equal(turnFrontness(state('idle')), 0);

  const turnSeconds = initialTurnClock(0).turnSeconds;
  const samples = Array.from({ length: 200 }, (_, step) =>
    turnFrontness(state('turning', { motionAge: (step / 200) * turnSeconds })),
  );
  assert.equal(Math.max(...samples), 1);
  assert.equal(Math.min(...samples), 0);
  assert.equal(samples[0], 0, 'the turn starts as a profile');
  assert.equal(samples[samples.length - 1], 0, 'the turn ends as a profile');
});

test('sheetColumn clamps outside the unit range and splits by weight', () => {
  const weights = [0.5, 0.25, 0.25];
  assert.equal(sheetColumn(weights, -1), 0);
  assert.equal(sheetColumn(weights, 0), 0);
  assert.equal(sheetColumn(weights, 0.49), 0);
  assert.equal(sheetColumn(weights, 0.51), 1);
  assert.equal(sheetColumn(weights, 0.8), 2);
  assert.equal(sheetColumn(weights, 2), 2);
});

test('motionProgress never reaches one, so the last frame stays addressable', () => {
  assert.equal(motionProgress(0, 0.85), 0);
  assert.equal(motionProgress(-1, 0.85), 0);
  assert.ok(motionProgress(10, 0.85) < 1);
  assert.equal(motionProgress(1, 0), 1);
});

test('the sprite scale draws the body at the width the simulation asks for', () => {
  const pose = fishPose(state('swimming'));
  const bodyWidth = 58;
  const scale = (bodyWidth / 256) * spriteScale;
  assert.ok(Math.abs(pose.width * scale * 0.7 - bodyWidth) < 0.001);
  assert.ok(extent.left > extent.right, 'the tail fin reaches further than the snout');
});
