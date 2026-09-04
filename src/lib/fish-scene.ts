interface FishClip {
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

type FishKind = 'male' | 'female';

interface Obstacle {
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

import { drawMosaicImage, glitchFromAge, type Glitch } from './mosaic-glitch';

interface Attraction {
  x: number;
  y: number;
  until: number;
}

interface Fish {
  kind: FishKind;
  sizeFactor: number;
  startX: number;
  startY: number;
  entryX: number;
  entryY: number;
  pathCenterX: number;
  pathRangeX: number;
  pathRateX: number;
  pathCenterY: number;
  pathRangeY: number;
  pathRateY: number;
  phase: number;
  strokeInterval: number;
  clip: number;
  scale: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  strokeTimer: number;
  /* Rearms once the fish has cleared its neighbours, so a crossing can spark another glitch. */
  glitchArmed: boolean;
  glitchAt: number;
}

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

const clipSets: Record<FishKind, FishClip[]> = {
  male: maleClips,
  female: femaleClips,
};

/* Each fish follows its own deterministic current. Their ranges overlap so they still meet, but
   their different periods keep either fish from becoming the other's shadow. */
const swimmers: readonly Pick<
  Fish,
  | 'kind'
  | 'sizeFactor'
  | 'startX'
  | 'startY'
  | 'entryX'
  | 'entryY'
  | 'pathCenterX'
  | 'pathRangeX'
  | 'pathRateX'
  | 'pathCenterY'
  | 'pathRangeY'
  | 'pathRateY'
  | 'phase'
  | 'strokeInterval'
  | 'clip'
>[] = [
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
    pathCenterY: 0.54,
    pathRangeY: 0.32,
    pathRateY: 0.19,
    phase: 0.2,
    strokeInterval: 1.5,
    clip: 0,
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
    pathCenterY: 0.48,
    pathRangeY: 0.3,
    pathRateY: 0.145,
    phase: 2.25,
    strokeInterval: 1.9,
    clip: 2,
  },
];

/* How far the drawn fish reaches from its head, so the tail stays on the canvas. */
const extent = [...maleClips, ...femaleClips].reduce(
  (current, clip) => ({
    left: Math.max(current.left, clip.headX),
    right: Math.max(current.right, clip.width - clip.headX),
    top: Math.max(current.top, clip.headY),
    bottom: Math.max(current.bottom, clip.height - clip.headY),
  }),
  { left: 0, right: 0, top: 0, bottom: 0 },
);

/* Width of the solid body in the first frame, used to size every frame from one number. */
const REFERENCE_BODY_WIDTH = 256;
const BODY_WIDTH_PX = 58;
const NARROW_BODY_WIDTH_PX = 46;
const NARROW_WIDTH_PX = 520;
const MAX_DELTA_S = 0.05;
const FALLBACK_BAND_PX = 148;
const BAND_RISE_PX = 200;
/* Each stroke is one push followed by a glide, and the glide is what damps the push out. */
const STROKE_IMPULSE = 55;
const HORIZONTAL_GLIDE_DRAG = 1.85;
const VERTICAL_GLIDE_DRAG = 3;
const HORIZONTAL_COHESION = 0.95;
const VERTICAL_COHESION = 0.13;
const VERTICAL_STROKE_LIFT = 0.06;
const ATTRACTION_DURATION_S = 1.8;
const ATTRACTION_RELEASE_S = 0.6;
const ATTRACTION_MAX_OFFSET_PX = 160;
const ENTRY_DURATION_S = 10;
/* Weak enough that the pair can pass through each other instead of bouncing apart. */
const SEPARATION_PUSH = 10;
const BODY_HEIGHT_RATIO = 0.48;
const GLITCH_TRIGGER = 0.16;
const GLITCH_CLEAR = 0.08;
/* Encounter sequence for a crossing, stepped like the gate echoes rather than interpolated. */
const GLITCH_SEQUENCE = [
  { until: 0.07, mosaicPx: 10, dissolve: 0.5, scatter: 0.48, chromaPx: 2.5 },
  { until: 0.16, mosaicPx: 9, dissolve: 0.32, scatter: 0.36, chromaPx: 2 },
  { until: 0.28, mosaicPx: 8, dissolve: 0.18, scatter: 0.24, chromaPx: 1.5 },
] as const;
const GLITCH_DURATION_S = GLITCH_SEQUENCE[GLITCH_SEQUENCE.length - 1].until;
const MOVEMENT_FACING_THRESHOLD = 2;
const POINTER_TURN_HYSTERESIS = 10;
const OBSTACLE_PUSH = 900;
const OBSTACLE_PADDING = 20;
const DESKTOP_OBSTACLE_INSET = 18;
const SOFT_AVOIDANCE_RANGE = 72;
const SOFT_AVOIDANCE_PUSH = 90;
const SOFT_INWARD_VELOCITY_RETAIN = 0.45;
const EDGE_MARGIN = 6;
const LOAD_MARGIN_PX = 400;
const INTERACTIVE_SELECTOR = [
  'a',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  'label',
  '[role="button"]',
  '[role="link"]',
  '[contenteditable]:not([contenteditable="false"])',
].join(',');

class FishScene extends HTMLElement {
  private abortController?: AbortController;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private reducedMotionQuery?: MediaQueryList;
  private hoverFineQuery?: MediaQueryList;
  private canvas?: HTMLCanvasElement;
  private context?: CanvasRenderingContext2D;
  private boundary?: HTMLElement;
  private obstacleRoot?: HTMLElement;
  private swimStart?: HTMLElement;
  private footer?: HTMLElement;
  private mosaic?: HTMLCanvasElement;
  private sheets?: Record<FishKind, HTMLImageElement>;
  private animationFrame?: number;
  private resizeFrame?: number;
  private lastFrameAt?: number;
  private connectionId = 0;
  private inView = false;
  private elapsed = 0;
  private width = 0;
  private height = 0;
  private scale = 1;
  private placed = false;
  private usesSoftContentAvoidance = false;
  private desktopContentBottom?: number;
  private pointerClientX?: number;
  private pointerClientY?: number;
  private attraction?: Attraction;
  /* The fish the fine pointer is over, so a stay does not retrigger the sequence. */
  private hoveredFish?: Fish;
  private obstacles: Obstacle[] = [];
  private school: Fish[] = swimmers.map((member) => ({
    ...member,
    scale: 1,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    heading: -1,
    strokeTimer: (member.phase % 1) * member.strokeInterval,
    glitchArmed: true,
    glitchAt: -1,
  }));

  connectedCallback() {
    if (this.abortController) return;

    const canvas = this.querySelector('[data-fish-scene-canvas]');
    if (!(canvas instanceof HTMLCanvasElement)) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const obstacleRootId = this.getAttribute('data-fish-scene-obstacle-root');
    const swimStartId = this.getAttribute('data-fish-scene-swim-start');
    const footerId = this.getAttribute('data-fish-scene-footer');
    const boundary = this.closest('[data-fish-scene-boundary]');
    const obstacleRoot = obstacleRootId
      ? document.getElementById(obstacleRootId)
      : undefined;
    const swimStart = swimStartId ? document.getElementById(swimStartId) : undefined;
    const footer = footerId ? document.getElementById(footerId) : undefined;
    if (
      !(boundary instanceof HTMLElement) ||
      !(obstacleRoot instanceof HTMLElement) ||
      !(swimStart instanceof HTMLElement) ||
      !(footer instanceof HTMLElement)
    ) {
      return;
    }

    const mosaic = document.createElement('canvas');

    this.canvas = canvas;
    this.context = context;
    this.boundary = boundary;
    this.obstacleRoot = obstacleRoot;
    this.swimStart = swimStart;
    this.footer = footer;
    this.mosaic = mosaic;
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    window.addEventListener('resize', this.scheduleResize, { signal });
    window.addEventListener('pointermove', this.handlePointerMove, { passive: true, signal });
    window.addEventListener('pointerdown', this.handlePointerMove, { passive: true, signal });
    window.addEventListener('pointerup', this.handlePointerEnd, { passive: true, signal });
    window.addEventListener('pointercancel', this.handlePointerEnd, { passive: true, signal });
    window.addEventListener('click', this.handleAttraction, { passive: true, signal });
    document.addEventListener('pointerleave', this.handlePointerLeave, { signal });
    document.addEventListener('visibilitychange', this.handleVisibility, { signal });

    this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotionQuery.addEventListener('change', this.handleMotionPreference, { signal });
    this.hoverFineQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

    this.resizeObserver = new ResizeObserver(this.scheduleResize);
    this.resizeObserver.observe(this);
    this.resizeObserver.observe(boundary);
    this.resizeObserver.observe(obstacleRoot);
    this.resizeObserver.observe(swimStart);
    this.resizeObserver.observe(footer);

    /* Size the expanded desktop band before intersection testing decides when to load the sheets. */
    this.resize();

    this.intersectionObserver = new IntersectionObserver(this.handleIntersect, {
      rootMargin: `${LOAD_MARGIN_PX}px 0px`,
    });
    /* The host has no height of its own, so the canvas is what can be observed for intersection. */
    this.intersectionObserver.observe(canvas);
  }

  disconnectedCallback() {
    this.connectionId += 1;
    this.abortController?.abort();
    this.abortController = undefined;
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = undefined;
    if (this.resizeFrame !== undefined) {
      cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = undefined;
    }
    this.stop();
    this.canvas = undefined;
    this.context = undefined;
    this.boundary = undefined;
    this.obstacleRoot = undefined;
    this.swimStart = undefined;
    this.footer = undefined;
    this.mosaic = undefined;
    this.sheets = undefined;
    this.reducedMotionQuery = undefined;
    this.hoverFineQuery = undefined;
    this.hoveredFish = undefined;
    this.attraction = undefined;
    this.usesSoftContentAvoidance = false;
    this.desktopContentBottom = undefined;
    this.removeAttribute('data-fish-scene-ready');
  }

  private handleIntersect = (entries: IntersectionObserverEntry[]) => {
    const entry = entries[entries.length - 1];
    if (!entry) return;

    this.inView = entry.isIntersecting;
    if (this.inView) {
      void this.load();
      this.start();
    } else {
      this.stop();
    }
  };

  private async load() {
    if (this.sheets) return;

    const connectionId = this.connectionId;
    const male = new Image();
    const female = new Image();
    male.decoding = 'async';
    female.decoding = 'async';
    male.src = `${import.meta.env.BASE_URL}sprite-sheet/sacura-margaritacea_male_v1.webp`;
    female.src = `${import.meta.env.BASE_URL}sprite-sheet/sacura-margaritacea_female_v1.webp`;

    try {
      await Promise.all([male.decode(), female.decode()]);
    } catch {
      return;
    }

    if (connectionId !== this.connectionId) return;

    this.sheets = { male, female };
    this.resize();
    this.toggleAttribute('data-fish-scene-ready', true);

    if (this.inView) this.start();
  }

  private scheduleResize = () => {
    if (this.resizeFrame !== undefined) return;
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = undefined;
      this.resize();
    });
  };

  private resize() {
    if (
      !this.canvas ||
      !this.context ||
      !this.boundary ||
      !this.obstacleRoot ||
      !this.swimStart ||
      !this.footer
    ) {
      return;
    }

    const rootRect = this.getBoundingClientRect();
    if (rootRect.width <= 0) return;

    const previousWidth = this.width;
    const previousHeight = this.height;
    const boundaryRect = this.boundary.getBoundingClientRect();
    const obstacleRootRect = this.obstacleRoot.getBoundingClientRect();
    const swimStartRect = this.swimStart.getBoundingClientRect();
    const footerRect = this.footer.getBoundingClientRect();
    const usesDesktopBoundary = boundaryRect.width > rootRect.width + 1;
    this.usesSoftContentAvoidance = usesDesktopBoundary;
    const bandLeft = usesDesktopBoundary ? 0 : rootRect.left;
    const bandTop = usesDesktopBoundary
      ? swimStartRect.top
      : rootRect.top - BAND_RISE_PX;
    this.width = usesDesktopBoundary
      ? document.documentElement.clientWidth
      : rootRect.width;
    this.height = Math.max(FALLBACK_BAND_PX, footerRect.bottom - bandTop);
    this.desktopContentBottom = usesDesktopBoundary
      ? obstacleRootRect.bottom - bandTop + OBSTACLE_PADDING
      : undefined;

    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.canvas.style.insetInlineStart = `${bandLeft - rootRect.left}px`;
    this.canvas.style.insetBlockStart = `${bandTop - rootRect.top}px`;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.canvas.width = Math.round(this.width * pixelRatio);
    this.canvas.height = Math.round(this.height * pixelRatio);
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const bodyWidth = this.width < NARROW_WIDTH_PX ? NARROW_BODY_WIDTH_PX : BODY_WIDTH_PX;
    this.scale = bodyWidth / REFERENCE_BODY_WIDTH;
    for (const fish of this.school) {
      fish.scale = this.scale * fish.sizeFactor;
    }

    /* Desktop treats the content column as one barrier; mobile keeps the existing card barriers. */
    const contentObstacles = usesDesktopBoundary
      ? [this.obstacleRoot]
      : [...this.obstacleRoot.querySelectorAll('[data-fish-scene-obstacle]')];
    const obstaclePadding = usesDesktopBoundary
      ? -DESKTOP_OBSTACLE_INSET
      : OBSTACLE_PADDING;
    this.obstacles = contentObstacles
      .map((element) => element.getBoundingClientRect())
      .map((rect) => ({
        left: rect.left - bandLeft - obstaclePadding,
        top: rect.top - bandTop - obstaclePadding,
        right: rect.right - bandLeft + obstaclePadding,
        bottom: rect.bottom - bandTop + obstaclePadding,
      }));

    if (this.attraction) {
      this.attraction.x = clamp(this.attraction.x, 0, this.width);
      this.attraction.y = clamp(this.attraction.y, 0, this.height);
    }

    if (!this.placed) {
      this.placed = true;
      for (const fish of this.school) {
        fish.x = this.width * fish.startX;
        fish.y = this.entryLaneY(fish, fish.startY);
      }
    } else if (previousWidth > 0 && previousHeight > 0) {
      for (const fish of this.school) {
        fish.x = (fish.x / previousWidth) * this.width;
        fish.y = (fish.y / previousHeight) * this.height;
        if (this.elapsed < ENTRY_DURATION_S) {
          fish.y = this.entryLaneY(fish, fish.startY);
        }
      }
    }

    this.draw();
  }

  private start() {
    if (this.animationFrame !== undefined) return;
    if (!this.sheets || document.hidden || this.reducedMotionQuery?.matches) return;

    this.lastFrameAt = undefined;
    this.animationFrame = requestAnimationFrame(this.tick);
  }

  private stop() {
    if (this.animationFrame === undefined) return;
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = undefined;
  }

  private handleVisibility = () => {
    if (document.hidden) {
      this.stop();
    } else if (this.inView) {
      this.start();
    }
  };

  private handleMotionPreference = () => {
    if (this.reducedMotionQuery?.matches) {
      this.attraction = undefined;
      this.stop();
      this.draw();
    } else if (this.inView) {
      this.start();
    }
  };

  private handlePointerMove = (event: PointerEvent) => {
    this.pointerClientX = event.clientX;
    this.pointerClientY = event.clientY;
  };

  /* A finger stops existing when it lifts, unlike a cursor, so it must not keep facing that point. */
  private handlePointerEnd = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') return;
    this.handlePointerLeave();
  };

  private handlePointerLeave = () => {
    this.pointerClientX = undefined;
    this.pointerClientY = undefined;
  };

  private handleAttraction = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || this.reducedMotionQuery?.matches) return;

    const target = event.target;
    if (target instanceof Element && target.closest(INTERACTIVE_SELECTOR)) return;

    const canvasRect = this.canvas?.getBoundingClientRect();
    if (!canvasRect) return;

    const x = event.clientX - canvasRect.left;
    const y = event.clientY - canvasRect.top;
    if (x < 0 || x > this.width || y < 0 || y > this.height) return;

    this.attraction = { x, y, until: this.elapsed + ATTRACTION_DURATION_S };
  };

  private tick = (time: number) => {
    if (document.documentElement.dataset.siteLoader === 'active') {
      this.lastFrameAt = time;
      this.draw();
      this.animationFrame = requestAnimationFrame(this.tick);
      return;
    }

    const previous = this.lastFrameAt ?? time;
    this.lastFrameAt = time;

    const delta = Math.min((time - previous) / 1000, MAX_DELTA_S);
    if (delta > 0) this.step(delta);
    this.draw();

    this.animationFrame = requestAnimationFrame(this.tick);
  };

  private step(delta: number) {
    this.elapsed += delta;

    const canvasRect = this.canvas?.getBoundingClientRect();
    if (!canvasRect) return;

    const pointerX =
      this.pointerClientX === undefined ? undefined : this.pointerClientX - canvasRect.left;
    const pointerY =
      this.pointerClientY === undefined
        ? undefined
        : this.pointerClientY - canvasRect.top;

    const attractionRemaining = this.attraction
      ? this.attraction.until - this.elapsed
      : 0;
    if (this.attraction && attractionRemaining <= 0) this.attraction = undefined;
    const entryRatio = clamp(this.elapsed / ENTRY_DURATION_S, 0, 1);
    const entryProgress = entryRatio * entryRatio * (3 - 2 * entryRatio);

    for (const fish of this.school) {
      const minX = extent.left * fish.scale + EDGE_MARGIN;
      const maxX = Math.max(minX, this.width - extent.right * fish.scale - EDGE_MARGIN);
      const minY = extent.top * fish.scale + EDGE_MARGIN;
      const maxY = Math.max(minY, this.height - extent.bottom * fish.scale - EDGE_MARGIN);
      const bodyWidth = REFERENCE_BODY_WIDTH * fish.scale;
      const reachX = bodyWidth / 2;
      const reachY = (bodyWidth * BODY_HEIGHT_RATIO) / 2;

      const currentX =
        fish.pathCenterX +
        fish.pathRangeX *
          (0.76 * Math.sin(this.elapsed * fish.pathRateX + fish.phase) +
            0.24 * Math.sin(this.elapsed * fish.pathRateX * 0.43 + fish.phase * 1.7));
      const currentY =
        fish.pathCenterY +
        fish.pathRangeY *
          (0.68 * Math.sin(this.elapsed * fish.pathRateY + fish.phase * 1.3) +
            0.32 * Math.sin(this.elapsed * fish.pathRateY * 0.57 + fish.phase * 2.1));
      let targetX = this.width * currentX;
      let targetY = this.height * currentY;

      /* Enter as a close pair, then release each fish into its own current without a jump. */
      const entryTargetX = this.width * fish.entryX;
      const entryTargetY = this.entryLaneY(fish, fish.entryY);
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

      const towardPointerX = pointerX === undefined ? undefined : pointerX - fish.x;
      let heading: number | undefined;
      if (Math.abs(targetX - fish.x) > POINTER_TURN_HYSTERESIS) {
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

      fish.strokeTimer -= delta;
      if (fish.strokeTimer <= 0) {
        this.beginStroke(fish, targetX, targetY);
      }

      let accelerationX = 0;
      let accelerationY = 0;
      let softAvoidance: Avoidance | undefined;
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
      for (const obstacle of this.obstacles) {
        if (this.usesSoftContentAvoidance) {
          const avoidance = findAvoidance(
            fish.x,
            fish.y,
            obstacle,
            reachX,
            reachY,
            SOFT_AVOIDANCE_RANGE,
          );
          if (
            avoidance &&
            (!softAvoidance || avoidance.strength > softAvoidance.strength)
          ) {
            softAvoidance = avoidance;
          }
          continue;
        }

        const exit = findExit(fish.x, fish.y, obstacle, reachX, reachY);
        if (!exit) continue;

        const strength = Math.min(exit.depth / Math.max(exit.span, 1), 1);
        accelerationX += exit.x * OBSTACLE_PUSH * strength;
        accelerationY += exit.y * OBSTACLE_PUSH * strength;
      }

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

      fish.x = clamp(fish.x + fish.vx * delta, minX, maxX);
      fish.y = clamp(fish.y + fish.vy * delta, minY, maxY);

      /* A stroke can still carry a fish into the text, so the text keeps the last word. */
      if (!this.usesSoftContentAvoidance) {
        for (const obstacle of this.obstacles) {
          const exit = findExit(fish.x, fish.y, obstacle, reachX, reachY);
          if (!exit) continue;

          fish.x = clamp(fish.x + exit.x * exit.depth, minX, maxX);
          fish.y = clamp(fish.y + exit.y * exit.depth, minY, maxY);
          if (exit.x === 0) fish.vy = 0;
          else fish.vx = 0;
        }
      }
    }

    /* Only the farther fish mosaics, so the nearer one stays intact through the crossing. */
    for (const fish of this.school) {
      let overlap = 0;
      for (const other of this.school) {
        if (other === fish || fish.sizeFactor >= other.sizeFactor) continue;
        overlap = Math.max(overlap, bodyOverlap(fish, other));
      }
      if (overlap >= GLITCH_TRIGGER && fish.glitchArmed) {
        fish.glitchArmed = false;
        this.sparkGlitch(fish);
      }
      if (overlap < GLITCH_CLEAR) fish.glitchArmed = true;
    }

    this.sparkHoverGlitch(pointerX, pointerY);
  }

  private entryLaneY(fish: Fish, fallbackRatio: number) {
    if (this.desktopContentBottom === undefined) {
      return this.height * fallbackRatio;
    }

    const minY = extent.top * fish.scale + EDGE_MARGIN;
    const maxY = Math.max(minY, this.height - extent.bottom * fish.scale - EDGE_MARGIN);
    const bodyHeight = REFERENCE_BODY_WIDTH * fish.scale * BODY_HEIGHT_RATIO;
    return clamp(
      this.desktopContentBottom + bodyHeight / 2 + EDGE_MARGIN,
      minY,
      maxY,
    );
  }

  /* The canvas keeps pointer-events none so footer links stay clickable; hit-testing uses the page pointer. */
  private sparkHoverGlitch(pointerX: number | undefined, pointerY: number | undefined) {
    if (
      this.reducedMotionQuery?.matches ||
      !this.hoverFineQuery?.matches ||
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

  /* A stroke is the only thing that changes the clip, so the pose holds for the whole glide. */
  private beginStroke(fish: Fish, targetX: number, targetY: number) {
    fish.clip = (fish.clip + 1) % clipSets[fish.kind].length;

    /* Thrust leaves through the head. Distance only scales how hard the beat is. */
    const ahead = Math.max(0, (targetX - fish.x) * fish.heading);
    const reach = Math.min(ahead / (REFERENCE_BODY_WIDTH * fish.scale), 1);
    fish.vx += fish.heading * STROKE_IMPULSE * (0.4 + 0.6 * reach);
    const lift = clamp(targetY - fish.y, -40, 40);
    fish.vy += (lift / 40) * STROKE_IMPULSE * VERTICAL_STROKE_LIFT;

    const variation = 0.9 + 0.12 * Math.sin(this.elapsed * 0.72 + fish.phase * 3.7);
    fish.strokeTimer = fish.strokeInterval * variation;
  }

  private draw() {
    const context = this.context;
    if (!context || !this.sheets) return;

    context.clearRect(0, 0, this.width, this.height);

    const glitches = this.school.map((fish) =>
      glitchFromAge(this.elapsed - fish.glitchAt, GLITCH_SEQUENCE),
    );

    /* Smallest first, so the nearer fish pass in front. */
    for (let index = this.school.length - 1; index >= 0; index -= 1) {
      const fish = this.school[index];
      const glitch = glitches[index];
      if (!fish || !glitch) continue;
      this.drawFish(fish, glitch);
    }
  }

  private drawFish(fish: Fish, glitch: Glitch) {
    const context = this.context;
    const sheet = this.sheets?.[fish.kind];
    const clip = clipSets[fish.kind][fish.clip];
    if (!context || !sheet || !clip) return;

    const drawnWidth = clip.width * fish.scale;
    const drawnHeight = clip.height * fish.scale;
    const drawX = -clip.headX * fish.scale;
    const drawY = -clip.headY * fish.scale;

    context.save();
    context.translate(fish.x, fish.y);
    /* The sheet faces right, so swimming left is a flip around the eye. */
    if (fish.heading < 0) context.scale(-1, 1);

    const mosaic = this.mosaic;
    if (!mosaic) {
      context.restore();
      return;
    }

    drawMosaicImage(
      context,
      mosaic,
      sheet,
      clip.x,
      clip.y,
      clip.width,
      clip.height,
      drawX,
      drawY,
      drawnWidth,
      drawnHeight,
      glitch,
    );
    context.restore();
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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

export function defineFishScene() {
  if (!customElements.get('fish-scene')) {
    customElements.define('fish-scene', FishScene);
  }
}
