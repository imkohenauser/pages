import { advanceSwimPhase } from './fish-swim-cycle';
import { extent, REFERENCE_BODY_WIDTH, type FishKind } from './fish-sprites';

export interface Obstacle {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface Avoidance {
  x: number;
  y: number;
  strength: number;
}

interface Attraction {
  x: number;
  y: number;
  until: number;
}

export interface FishConfig {
  readonly kind: FishKind;
  readonly sizeFactor: number;
  readonly startX: number;
  readonly startY: number;
  readonly entryX: number;
  readonly entryY: number;
  readonly pathCenterX: number;
  readonly pathRangeX: number;
  readonly pathRateX: number;
  readonly pathCenterY: number;
  readonly pathRangeY: number;
  readonly pathRateY: number;
  readonly phase: number;
  readonly swimCycleSeconds: number;
  readonly swimCycleImpulse: number;
  readonly initialSwimPhase: number;
}

export interface Fish {
  readonly config: FishConfig;
  swimPhase: number;
  scale: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  /* Rearms once the fish has cleared its neighbours, so a crossing can spark another glitch. */
  glitchArmed: boolean;
  glitchAt: number;
}

/* Each fish follows its own deterministic current. Their ranges overlap so they still meet, but
   their different periods keep either fish from becoming the other's shadow. */
// Cycle duration and impulse preserve the mean rate of two former strokes.
const swimmers: readonly FishConfig[] = [
  {
    kind: 'male',
    sizeFactor: 1,
    startX: 0.68,
    startY: 0.8,
    entryX: 0.56,
    entryY: 0.8,
    pathCenterX: 0.5,
    pathRangeX: 0.42,
    pathRateX: 0.13,
    pathCenterY: 0.72,
    pathRangeY: 0.22,
    pathRateY: 0.19,
    phase: 0.2,
    swimCycleSeconds: 2.7,
    swimCycleImpulse: 110,
    initialSwimPhase: 0,
  },
  {
    kind: 'female',
    sizeFactor: 0.8,
    startX: 0.71,
    startY: 0.77,
    entryX: 0.61,
    entryY: 0.77,
    pathCenterX: 0.5,
    pathRangeX: 0.4,
    pathRateX: 0.095,
    pathCenterY: 0.68,
    pathRangeY: 0.2,
    pathRateY: 0.145,
    phase: 2.25,
    swimCycleSeconds: 3.42,
    swimCycleImpulse: 110,
    initialSwimPhase: 0.25,
  },
];

const BODY_WIDTH_PX = 58;
const NARROW_BODY_WIDTH_PX = 46;
const NARROW_WIDTH_PX = 520;
const HORIZONTAL_GLIDE_DRAG = 1.85;
const VERTICAL_GLIDE_DRAG = 3;
const HORIZONTAL_COHESION = 0.95;
const VERTICAL_COHESION = 0.13;
const VERTICAL_STROKE_LIFT = 0.06;
export const ATTRACTION_DURATION_S = 1.8;
const ATTRACTION_RELEASE_S = 0.6;
const ATTRACTION_MAX_OFFSET_PX = 160;
const ENTRY_DURATION_S = 10;
/* Weak enough that the pair can pass through each other instead of bouncing apart. */
const SEPARATION_PUSH = 10;
const BODY_HEIGHT_RATIO = 0.48;
const GLITCH_TRIGGER = 0.16;
const GLITCH_CLEAR = 0.08;
/* Encounter sequence for a crossing, stepped like the gate echoes rather than interpolated. */
export const GLITCH_SEQUENCE = [
  { until: 0.07, mosaicPx: 10, dissolve: 0.5, scatter: 0.48, chromaPx: 2.5 },
  { until: 0.16, mosaicPx: 9, dissolve: 0.32, scatter: 0.36, chromaPx: 2 },
  { until: 0.28, mosaicPx: 8, dissolve: 0.18, scatter: 0.24, chromaPx: 1.5 },
] as const;
const GLITCH_DURATION_S = GLITCH_SEQUENCE[GLITCH_SEQUENCE.length - 1].until;
const MOVEMENT_FACING_THRESHOLD = 2;
const POINTER_TURN_HYSTERESIS = 10;
const SOFT_AVOIDANCE_RANGE = 80;
const SOFT_AVOIDANCE_PUSH = 90;
const SOFT_INWARD_VELOCITY_RETAIN = 0.45;
const EDGE_AVOIDANCE_RANGE = 56;
const AVOIDANCE_TURN_STRENGTH = 0.28;
const AVOIDANCE_IMPULSE_DAMP = 0.72;
const EDGE_MARGIN = 6;

export interface FishInput {
  pointerX?: number;
  pointerY?: number;
  hoverEnabled: boolean;
}

export class FishSimulation {
  elapsed = 0;
  width = 0;
  height = 0;
  scale = 1;
  placed = false;
  attraction?: Attraction;
  /* The fish the fine pointer is over, so a stay does not retrigger the sequence. */
  hoveredFish?: Fish;
  obstacles: Obstacle[] = [];
  school: Fish[] = swimmers.map((member) => ({
    config: member,
    swimPhase: member.initialSwimPhase,
    scale: 1,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    heading: -1,
    glitchArmed: true,
    glitchAt: -1,
  }));

  resize(width: number, height: number) {
    const previousWidth = this.width;
    const previousHeight = this.height;
    this.width = width;
    this.height = height;
    const bodyWidth = this.width < NARROW_WIDTH_PX ? NARROW_BODY_WIDTH_PX : BODY_WIDTH_PX;
    this.scale = bodyWidth / REFERENCE_BODY_WIDTH;
    for (const fish of this.school) {
      fish.scale = this.scale * fish.config.sizeFactor;
    }

    if (this.attraction) {
      this.attraction.x = clamp(this.attraction.x, 0, this.width);
      this.attraction.y = clamp(this.attraction.y, 0, this.height);
    }

    if (!this.placed) {
      this.placed = true;
      for (const fish of this.school) {
        fish.x = this.width * fish.config.startX;
        fish.y = this.entryLaneY(fish, fish.config.startY);
      }
    } else if (previousWidth > 0 && previousHeight > 0) {
      for (const fish of this.school) {
        fish.x = (fish.x / previousWidth) * this.width;
        fish.y = (fish.y / previousHeight) * this.height;
        if (this.elapsed < ENTRY_DURATION_S) {
          fish.y = this.entryLaneY(fish, fish.config.startY);
        }
      }
    }
  }

  /** Input coordinates are local to the swim area; missing input advances only the clock. */
  step(delta: number, input?: FishInput) {
    this.elapsed += delta;

    if (!input) return;
    const { pointerX, pointerY, hoverEnabled } = input;

    const attractionRemaining = this.attraction
      ? this.attraction.until - this.elapsed
      : 0;
    if (this.attraction && attractionRemaining <= 0) this.attraction = undefined;
    const entryRatio = clamp(this.elapsed / ENTRY_DURATION_S, 0, 1);
    const entryProgress = entryRatio * entryRatio * (3 - 2 * entryRatio);

    // Later fish observe earlier fish after movement, so update order is significant.
    for (const fish of this.school) {
      const minX = extent.left * fish.scale + EDGE_MARGIN;
      const maxX = Math.max(minX, this.width - extent.right * fish.scale - EDGE_MARGIN);
      const minY = extent.top * fish.scale + EDGE_MARGIN;
      const maxY = Math.max(minY, this.height - extent.bottom * fish.scale - EDGE_MARGIN);
      const bodyWidth = REFERENCE_BODY_WIDTH * fish.scale;
      const reachX = bodyWidth / 2;
      const reachY = (bodyWidth * BODY_HEIGHT_RATIO) / 2;

      const currentX =
        fish.config.pathCenterX +
        fish.config.pathRangeX *
          (0.76 * Math.sin(this.elapsed * fish.config.pathRateX + fish.config.phase) +
            0.24 * Math.sin(this.elapsed * fish.config.pathRateX * 0.43 + fish.config.phase * 1.7));
      const currentY =
        fish.config.pathCenterY +
        fish.config.pathRangeY *
          (0.68 * Math.sin(this.elapsed * fish.config.pathRateY + fish.config.phase * 1.3) +
            0.32 * Math.sin(this.elapsed * fish.config.pathRateY * 0.57 + fish.config.phase * 2.1));
      let targetX = this.width * currentX;
      let targetY = this.height * currentY;

      /* Enter as a close pair, then release each fish into its own current without a jump. */
      const entryTargetX = this.width * fish.config.entryX;
      const entryTargetY = this.entryLaneY(fish, fish.config.entryY);
      targetX = entryTargetX + (targetX - entryTargetX) * entryProgress;
      targetY = entryTargetY + (targetY - entryTargetY) * entryProgress;

      if (this.attraction && attractionRemaining > 0) {
        const towardAttractionX = this.attraction.x - targetX;
        const towardAttractionY = this.attraction.y - targetY;
        const distance = Math.hypot(towardAttractionX, towardAttractionY);
        if (distance > 0.001) {
          const release = Math.min(attractionRemaining / ATTRACTION_RELEASE_S, 1);
          const offset = Math.min(distance, ATTRACTION_MAX_OFFSET_PX) * release;
          targetX += (towardAttractionX / distance) * offset;
          targetY += (towardAttractionY / distance) * offset;
        }
      }

      targetX = clamp(targetX, minX, maxX);
      targetY = clamp(targetY, minY, maxY);

      let softAvoidance: Avoidance | undefined;
      for (const obstacle of this.obstacles) {
        softAvoidance = mergeAvoidance(
          softAvoidance,
          findAvoidance(fish.x, fish.y, obstacle, reachX, reachY, SOFT_AVOIDANCE_RANGE),
        );
      }
      softAvoidance = mergeAvoidance(
        softAvoidance,
        findEdgeAvoidance(fish.x, fish.y, minX, maxX, minY, maxY, EDGE_AVOIDANCE_RANGE),
      );

      const towardPointerX = pointerX === undefined ? undefined : pointerX - fish.x;
      const headingIntoAvoidance =
        softAvoidance !== undefined &&
        softAvoidance.x !== 0 &&
        fish.heading * softAvoidance.x < 0 &&
        softAvoidance.strength >= AVOIDANCE_TURN_STRENGTH;
      let heading: number | undefined;
      if (headingIntoAvoidance && softAvoidance) {
        heading = softAvoidance.x > 0 ? 1 : -1;
      } else if (Math.abs(targetX - fish.x) > POINTER_TURN_HYSTERESIS) {
        heading = targetX > fish.x ? 1 : -1;
      } else if (Math.abs(fish.vx) > MOVEMENT_FACING_THRESHOLD) {
        heading = fish.vx > 0 ? 1 : -1;
      } else if (
        towardPointerX !== undefined &&
        Math.abs(towardPointerX) > POINTER_TURN_HYSTERESIS
      ) {
        heading = towardPointerX > 0 ? 1 : -1;
      }
      if (heading !== undefined) fish.heading = heading;

      const cycle = advanceSwimPhase(fish.swimPhase, delta, fish.config.swimCycleSeconds);
      fish.swimPhase = cycle.swimPhase;
      this.applySwimImpulse(fish, targetX, targetY, cycle.impulseFraction, softAvoidance);

      let accelerationX = 0;
      let accelerationY = 0;
      const towardX = targetX - fish.x;
      const towardY = targetY - fish.y;
      /* Cohesion may trim speed; it must not drag the fish tail-first. */
      accelerationX +=
        (towardX * fish.heading > 0 ? towardX : towardX * 0.15) * HORIZONTAL_COHESION;
      accelerationY += towardY * VERTICAL_COHESION;

      for (const other of this.school) {
        if (other === fish) continue;
        const awayX = fish.x - other.x;
        const awayY = fish.y - other.y;
        const distance = Math.hypot(awayX, awayY);
        const gap = (REFERENCE_BODY_WIDTH * (fish.scale + other.scale)) / 2;
        if (distance >= gap || distance < 0.001) continue;

        const strength = 1 - distance / gap;
        accelerationX += (awayX / distance) * SEPARATION_PUSH * strength;
        accelerationY += (awayY / distance) * SEPARATION_PUSH * strength;
      }

      /* Grow obstacles by the solid body, not the sprite clip, so transparent padding
         does not close the remaining corridor. */
      if (softAvoidance) {
        const inwardAcceleration =
          accelerationX * softAvoidance.x + accelerationY * softAvoidance.y;
        if (inwardAcceleration < 0) {
          accelerationX -= softAvoidance.x * inwardAcceleration;
          accelerationY -= softAvoidance.y * inwardAcceleration;
        }
        accelerationX += softAvoidance.x * SOFT_AVOIDANCE_PUSH * softAvoidance.strength;
        accelerationY += softAvoidance.y * SOFT_AVOIDANCE_PUSH * softAvoidance.strength;
      }

      fish.vx += accelerationX * delta;
      fish.vy += accelerationY * delta;

      /* Vertical movement meets more drag, so depth changes lag behind forward travel. */
      fish.vx *= Math.exp(-HORIZONTAL_GLIDE_DRAG * delta);
      fish.vy *= Math.exp(-VERTICAL_GLIDE_DRAG * delta);

      if (softAvoidance) {
        const inwardVelocity = fish.vx * softAvoidance.x + fish.vy * softAvoidance.y;
        if (inwardVelocity < 0) {
          const reduction = inwardVelocity * (1 - SOFT_INWARD_VELOCITY_RETAIN);
          fish.vx -= softAvoidance.x * reduction;
          fish.vy -= softAvoidance.y * reduction;
        }
      }

      const integratedX = integrateAxis(fish.x, fish.vx, delta, minX, maxX);
      const integratedY = integrateAxis(fish.y, fish.vy, delta, minY, maxY);
      fish.x = integratedX.position;
      fish.y = integratedY.position;
      fish.vx = integratedX.velocity;
      fish.vy = integratedY.velocity;

      /* A stroke can still carry a fish into a card, so the card keeps the last word. */
      resolveObstaclePenetration(
        fish,
        this.obstacles,
        reachX,
        reachY,
        minX,
        maxX,
        minY,
        maxY,
      );
    }

    /* Only the farther fish mosaics, so the nearer one stays intact through the crossing. */
    for (const fish of this.school) {
      let overlap = 0;
      for (const other of this.school) {
        if (other === fish || fish.config.sizeFactor >= other.config.sizeFactor) continue;
        overlap = Math.max(overlap, bodyOverlap(fish, other));
      }
      if (overlap >= GLITCH_TRIGGER && fish.glitchArmed) {
        fish.glitchArmed = false;
        this.sparkGlitch(fish);
      }
      if (overlap < GLITCH_CLEAR) fish.glitchArmed = true;
    }

    this.sparkHoverGlitch(pointerX, pointerY, hoverEnabled);
  }

  private entryLaneY(fish: Fish, fallbackRatio: number) {
    const minY = extent.top * fish.scale + EDGE_MARGIN;
    const maxY = Math.max(minY, this.height - extent.bottom * fish.scale - EDGE_MARGIN);
    return clamp(this.height * fallbackRatio, minY, maxY);
  }

  /* The canvas keeps pointer-events none so footer links stay clickable; hit-testing uses the page pointer. */
  private sparkHoverGlitch(
    pointerX: number | undefined,
    pointerY: number | undefined,
    hoverEnabled: boolean,
  ) {
    if (
      !hoverEnabled ||
      pointerX === undefined ||
      pointerY === undefined
    ) {
      this.hoveredFish = undefined;
      return;
    }

    const hit = this.fishUnderPointer(pointerX, pointerY);
    if (hit === this.hoveredFish) return;

    this.hoveredFish = hit;
    if (hit) this.sparkGlitch(hit);
  }

  private fishUnderPointer(x: number, y: number) {
    /* Frontmost first: the larger fish is drawn last. */
    for (const fish of this.school) {
      const rect = bodyRect(fish);
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return fish;
    }
    return undefined;
  }

  /* Play the encounter once and settle; a second spark waits until the sequence has finished. */
  private sparkGlitch(fish: Fish) {
    const age = this.elapsed - fish.glitchAt;
    if (age >= 0 && age < GLITCH_DURATION_S) return;
    fish.glitchAt = this.elapsed;
  }

  private applySwimImpulse(
    fish: Fish,
    targetX: number,
    targetY: number,
    fraction: number,
    softAvoidance?: Avoidance,
  ) {
    // Integrating the phase profile avoids losing a beat when a frame crosses its boundary.
    const impulse = fish.config.swimCycleImpulse * fraction;
    const ahead = Math.max(0, (targetX - fish.x) * fish.heading);
    let reach = Math.min(ahead / (REFERENCE_BODY_WIDTH * fish.scale), 1);
    if (
      softAvoidance &&
      softAvoidance.x !== 0 &&
      fish.heading * softAvoidance.x < 0
    ) {
      reach *= 1 - softAvoidance.strength * AVOIDANCE_IMPULSE_DAMP;
    }
    fish.vx += fish.heading * impulse * (0.4 + 0.6 * reach);
    const lift = clamp(targetY - fish.y, -40, 40);
    fish.vy += (lift / 40) * impulse * VERTICAL_STROKE_LIFT;
  }

}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function mergeAvoidance(
  current: Avoidance | undefined,
  candidate: Avoidance | undefined,
): Avoidance | undefined {
  if (!candidate) return current;
  if (!current || candidate.strength > current.strength) return candidate;
  return current;
}

function integrateAxis(
  position: number,
  velocity: number,
  delta: number,
  min: number,
  max: number,
) {
  const next = position + velocity * delta;
  if (next < min) {
    return { position: min, velocity: Math.max(velocity, 0) };
  }
  if (next > max) {
    return { position: max, velocity: Math.min(velocity, 0) };
  }
  return { position: next, velocity };
}

function resolveObstaclePenetration(
  fish: Fish,
  obstacles: Obstacle[],
  reachX: number,
  reachY: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
) {
  for (const obstacle of obstacles) {
    const exit = findExit(fish.x, fish.y, obstacle, reachX, reachY);
    if (!exit) continue;

    fish.x = clamp(fish.x + exit.x * exit.depth, minX, maxX);
    fish.y = clamp(fish.y + exit.y * exit.depth, minY, maxY);
    if (exit.x !== 0) {
      fish.vx = exit.x > 0 ? Math.max(fish.vx, 0) : Math.min(fish.vx, 0);
    }
    if (exit.y !== 0) {
      fish.vy = exit.y > 0 ? Math.max(fish.vy, 0) : Math.min(fish.vy, 0);
    }
  }
}

function findEdgeAvoidance(
  x: number,
  y: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  range: number,
): Avoidance | undefined {
  const edges = [
    { x: 1, y: 0, distance: x - minX },
    { x: -1, y: 0, distance: maxX - x },
    { x: 0, y: 1, distance: y - minY },
    { x: 0, y: -1, distance: maxY - y },
  ];

  let strongest: Avoidance | undefined;
  for (const edge of edges) {
    if (edge.distance >= range) continue;
    const strength = 1 - edge.distance / range;
    if (!strongest || strength > strongest.strength) {
      strongest = { x: edge.x, y: edge.y, strength };
    }
  }
  return strongest;
}

function bodyRect(fish: Fish) {
  const width = REFERENCE_BODY_WIDTH * fish.scale;
  const height = width * BODY_HEIGHT_RATIO;
  /* The solid body hangs behind the eye. */
  const left = fish.heading < 0 ? fish.x : fish.x - width;
  const right = fish.heading < 0 ? fish.x + width : fish.x;
  return {
    left,
    right,
    top: fish.y - height / 2,
    bottom: fish.y + height / 2,
    area: width * height,
  };
}

function bodyOverlap(a: Fish, b: Fish) {
  const ra = bodyRect(a);
  const rb = bodyRect(b);
  const width = Math.max(0, Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left));
  const height = Math.max(0, Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top));
  const smaller = Math.min(ra.area, rb.area);
  if (smaller <= 0) return 0;
  return (width * height) / smaller;
}

/* Start turning before contact. Inside the field, keep pushing toward the nearest open water
   without snapping the fish back to the boundary. */
function findAvoidance(
  x: number,
  y: number,
  obstacle: Obstacle,
  reachX: number,
  reachY: number,
  range: number,
): Avoidance | undefined {
  const left = obstacle.left - reachX;
  const right = obstacle.right + reachX;
  const top = obstacle.top - reachY;
  const bottom = obstacle.bottom + reachY;
  const inside = x > left && x < right && y > top && y < bottom;

  if (inside) {
    const exits = [
      { x: -1, y: 0, distance: x - left },
      { x: 1, y: 0, distance: right - x },
      { x: 0, y: -1, distance: y - top },
      { x: 0, y: 1, distance: bottom - y },
    ];
    const nearest = exits.reduce((current, candidate) =>
      candidate.distance < current.distance ? candidate : current,
    );
    return {
      x: nearest.x,
      y: nearest.y,
      strength: 1 + Math.min(nearest.distance / range, 1),
    };
  }

  const nearestX = clamp(x, left, right);
  const nearestY = clamp(y, top, bottom);
  const awayX = x - nearestX;
  const awayY = y - nearestY;
  const distance = Math.hypot(awayX, awayY);
  if (distance >= range) return undefined;

  if (distance > 0.001) {
    return {
      x: awayX / distance,
      y: awayY / distance,
      strength: 1 - distance / range,
    };
  }

  if (x <= left) return { x: -1, y: 0, strength: 1 };
  if (x >= right) return { x: 1, y: 0, strength: 1 };
  if (y <= top) return { x: 0, y: -1, strength: 1 };
  return { x: 0, y: 1, strength: 1 };
}

/* Nearest way out of an obstacle that has been grown by the solid body. */
function findExit(x: number, y: number, obstacle: Obstacle, reachX: number, reachY: number) {
  const left = obstacle.left - reachX;
  const right = obstacle.right + reachX;
  const top = obstacle.top - reachY;
  const bottom = obstacle.bottom + reachY;
  if (x <= left || x >= right || y <= top || y >= bottom) return undefined;

  const toLeft = x - left;
  const toRight = right - x;
  const toTop = y - top;
  const toBottom = bottom - y;
  const shortest = Math.min(toLeft, toRight, toTop, toBottom);

  if (shortest === toLeft) return { x: -1, y: 0, depth: toLeft, span: reachX };
  if (shortest === toRight) return { x: 1, y: 0, depth: toRight, span: reachX };
  if (shortest === toTop) return { x: 0, y: -1, depth: toTop, span: reachY };
  return { x: 0, y: 1, depth: toBottom, span: reachY };
}

