interface FishClip {
  x: number;
  y: number;
  width: number;
  height: number;
  /* Point inside the clip that stays put between frames, found by aligning the frame masks. */
  anchorX: number;
  anchorY: number;
}

interface Obstacle {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface Glitch {
  mosaicPx: number;
  dissolve: number;
  scatter: number;
  chromaPx: number;
}

interface Attraction {
  x: number;
  y: number;
  until: number;
}

interface Fish {
  sizeFactor: number;
  /* Place in the loose formation, as a fraction of the band. */
  slotX: number;
  slotY: number;
  /* Tiny offset from the shared stroke, so the pair beat almost together. */
  phase: number;
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
const clips: FishClip[] = [
  { x: 0, y: 100, width: 402, height: 330, anchorX: 278, anchorY: 206 },
  { x: 402, y: 100, width: 376, height: 330, anchorX: 255, anchorY: 206 },
  { x: 778, y: 100, width: 384, height: 330, anchorX: 258, anchorY: 212 },
  { x: 1162, y: 100, width: 370, height: 330, anchorX: 240, anchorY: 208 },
  { x: 0, y: 530, width: 392, height: 340, anchorX: 264, anchorY: 222 },
  { x: 392, y: 530, width: 392, height: 340, anchorX: 268, anchorY: 225 },
  { x: 784, y: 530, width: 354, height: 340, anchorX: 227, anchorY: 226 },
  { x: 1138, y: 530, width: 394, height: 340, anchorX: 269, anchorY: 222 },
];

/* Slots sit close enough that the pair cross now and then, and the phases are near enough to beat
   as one. */
const formation: readonly Pick<Fish, 'sizeFactor' | 'slotX' | 'slotY' | 'phase' | 'clip'>[] = [
  { sizeFactor: 1, slotX: 0, slotY: 0, phase: 0, clip: 0 },
  { sizeFactor: 0.85, slotX: 0.082, slotY: -0.042, phase: 0.08, clip: 2 },
];

/* How far the drawn fish reaches from its anchor, so it can be kept inside the canvas. */
const extent = clips.reduce(
  (current, clip) => ({
    left: Math.max(current.left, clip.anchorX),
    right: Math.max(current.right, clip.width - clip.anchorX),
    top: Math.max(current.top, clip.anchorY),
    bottom: Math.max(current.bottom, clip.height - clip.anchorY),
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
const STROKE_INTERVAL_S = 1.5;
const STROKE_IMPULSE = 62;
const GLIDE_DRAG = 1.7;
const COHESION = 1.1;
const ATTRACTION_DURATION_S = 1.8;
const ATTRACTION_RELEASE_S = 0.6;
const ATTRACTION_MAX_OFFSET_PX = 160;
/* Weak enough that the pair can pass through each other instead of bouncing apart. */
const SEPARATION_PUSH = 10;
const BODY_HEIGHT_RATIO = 0.48;
const MIN_MOSAIC_CELLS = 3;
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
  private mosaic?: HTMLCanvasElement;
  private mosaicContext?: CanvasRenderingContext2D;
  private sheet?: HTMLImageElement;
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
  private pointerClientX?: number;
  private pointerClientY?: number;
  private attraction?: Attraction;
  /* The fish the fine pointer is over, so a stay does not retrigger the sequence. */
  private hoveredFish?: Fish;
  private obstacles: Obstacle[] = [];
  private school: Fish[] = formation.map((member) => ({
    ...member,
    scale: 1,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    heading: -1,
    strokeTimer: member.phase * STROKE_INTERVAL_S,
    glitchArmed: true,
    glitchAt: -1,
  }));

  connectedCallback() {
    if (this.abortController) return;

    const canvas = this.querySelector('[data-fish-scene-canvas]');
    if (!(canvas instanceof HTMLCanvasElement)) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const mosaic = document.createElement('canvas');
    const mosaicContext = mosaic.getContext('2d');
    if (!mosaicContext) return;

    this.canvas = canvas;
    this.context = context;
    this.mosaic = mosaic;
    this.mosaicContext = mosaicContext;
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
    this.mosaic = undefined;
    this.mosaicContext = undefined;
    this.sheet = undefined;
    this.reducedMotionQuery = undefined;
    this.hoverFineQuery = undefined;
    this.hoveredFish = undefined;
    this.attraction = undefined;
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
    if (this.sheet) return;

    const connectionId = this.connectionId;
    const sheet = new Image();
    sheet.decoding = 'async';
    sheet.src = `${import.meta.env.BASE_URL}sprite-sheet/sacura-margaritacea_v1.png`;

    try {
      await sheet.decode();
    } catch {
      return;
    }

    if (connectionId !== this.connectionId) return;

    this.sheet = sheet;
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
    if (!this.canvas || !this.context) return;

    const rootRect = this.getBoundingClientRect();
    if (rootRect.width <= 0) return;

    /* The band starts above the end of the page content and reaches through the footer, which lives
       outside this component, so its lower edge is measured rather than duplicated as a length. */
    const footer = document.querySelector('.site-footer');
    const footerRect = footer?.getBoundingClientRect();
    const bandTop = rootRect.top - BAND_RISE_PX;
    this.width = rootRect.width;
    this.height = BAND_RISE_PX + Math.max(
      FALLBACK_BAND_PX,
      footerRect ? footerRect.bottom - rootRect.top : FALLBACK_BAND_PX,
    );

    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.canvas.style.insetBlockStart = `${-BAND_RISE_PX}px`;
    this.canvas.style.height = `${this.height}px`;
    this.canvas.width = Math.round(this.width * pixelRatio);
    this.canvas.height = Math.round(this.height * pixelRatio);
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const bodyWidth = this.width < NARROW_WIDTH_PX ? NARROW_BODY_WIDTH_PX : BODY_WIDTH_PX;
    this.scale = bodyWidth / REFERENCE_BODY_WIDTH;
    for (const fish of this.school) {
      fish.scale = this.scale * fish.sizeFactor;
    }

    /* Footer controls and cards inside the raised band stay clear of the school. */
    const cardElements = this.previousElementSibling?.querySelectorAll('article') ?? [];
    const footerElements = footer?.querySelectorAll('small, a') ?? [];
    this.obstacles = [...cardElements, ...footerElements]
      .map((element) => element.getBoundingClientRect())
      .map((rect) => ({
        left: rect.left - rootRect.left - OBSTACLE_PADDING,
        top: rect.top - bandTop - OBSTACLE_PADDING,
        right: rect.right - rootRect.left + OBSTACLE_PADDING,
        bottom: rect.bottom - bandTop + OBSTACLE_PADDING,
      }));

    if (this.attraction) {
      this.attraction.x = clamp(this.attraction.x, 0, this.width);
      this.attraction.y = clamp(this.attraction.y, 0, this.height);
    }

    if (!this.placed) {
      this.placed = true;
      for (const fish of this.school) {
        fish.x = this.width * (0.66 + fish.slotX);
        /* The resting reduced-motion frame remains below the preceding cards. */
        fish.y = BAND_RISE_PX + (this.height - BAND_RISE_PX) * (0.34 + fish.slotY);
      }
    }

    this.draw();
  }

  private start() {
    if (this.animationFrame !== undefined) return;
    if (!this.sheet || document.hidden || this.reducedMotionQuery?.matches) return;

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

    const rootRect = this.getBoundingClientRect();
    const x = event.clientX - rootRect.left;
    const y = event.clientY - (rootRect.top - BAND_RISE_PX);
    if (x < 0 || x > this.width || y < 0 || y > this.height) return;

    this.attraction = { x, y, until: this.elapsed + ATTRACTION_DURATION_S };
    for (const fish of this.school) fish.strokeTimer = 0;
  };

  private tick = (time: number) => {
    const previous = this.lastFrameAt ?? time;
    this.lastFrameAt = time;

    const delta = Math.min((time - previous) / 1000, MAX_DELTA_S);
    if (delta > 0) this.step(delta);
    this.draw();

    this.animationFrame = requestAnimationFrame(this.tick);
  };

  private step(delta: number) {
    this.elapsed += delta;

    const rootRect = this.getBoundingClientRect();
    const pointerX =
      this.pointerClientX === undefined ? undefined : this.pointerClientX - rootRect.left;
    const pointerY =
      this.pointerClientY === undefined
        ? undefined
        : this.pointerClientY - (rootRect.top - BAND_RISE_PX);

    /* One drifting point the whole group hangs off, which is what makes them read as a group. */
    let schoolX = this.width * (0.5 + 0.24 * Math.sin(this.elapsed * 0.17));
    let schoolY = this.height * (0.56 + 0.22 * Math.sin(this.elapsed * 0.27 + 1.1));

    if (this.attraction) {
      const remaining = this.attraction.until - this.elapsed;
      if (remaining <= 0) {
        this.attraction = undefined;
      } else {
        const towardX = this.attraction.x - schoolX;
        const towardY = this.attraction.y - schoolY;
        const distance = Math.hypot(towardX, towardY);
        if (distance > 0.001) {
          const release = Math.min(remaining / ATTRACTION_RELEASE_S, 1);
          const offset = Math.min(distance, ATTRACTION_MAX_OFFSET_PX) * release;
          schoolX += (towardX / distance) * offset;
          schoolY += (towardY / distance) * offset;
        }
      }
    }

    /* The lead fish supplies one shared direction so the pair always face the same way. */
    const lead = this.school[0];
    const towardPointerX =
      pointerX === undefined || !lead ? undefined : pointerX - lead.x;

    for (const fish of this.school) {
      const minX = extent.left * fish.scale + EDGE_MARGIN;
      const maxX = Math.max(minX, this.width - extent.right * fish.scale - EDGE_MARGIN);
      const minY = extent.top * fish.scale + EDGE_MARGIN;
      const maxY = Math.max(minY, this.height - extent.bottom * fish.scale - EDGE_MARGIN);

      const targetX = clamp(schoolX + this.width * fish.slotX, minX, maxX);
      const targetY = clamp(schoolY + this.height * fish.slotY, minY, maxY);

      fish.strokeTimer -= delta;
      if (fish.strokeTimer <= 0) {
        this.beginStroke(fish, targetX, targetY);
      }

      let accelerationX = 0;
      let accelerationY = 0;
      accelerationX += (targetX - fish.x) * COHESION;
      accelerationY += (targetY - fish.y) * COHESION;

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

      /* Obstacles are grown by how far this fish is drawn, so the whole body stays off the text. */
      const reachX = Math.max(extent.left, extent.right) * fish.scale;
      const reachY = Math.max(extent.top, extent.bottom) * fish.scale;
      for (const obstacle of this.obstacles) {
        const exit = findExit(fish.x, fish.y, obstacle, reachX, reachY);
        if (!exit) continue;

        const strength = Math.min(exit.depth / Math.max(exit.span, 1), 1);
        accelerationX += exit.x * OBSTACLE_PUSH * strength;
        accelerationY += exit.y * OBSTACLE_PUSH * strength;
      }

      fish.vx += accelerationX * delta;
      fish.vy += accelerationY * delta;

      /* Water takes the push back, so a stroke becomes a glide instead of a constant speed. */
      const damping = Math.exp(-GLIDE_DRAG * delta);
      fish.vx *= damping;
      fish.vy *= damping;

      fish.x = clamp(fish.x + fish.vx * delta, minX, maxX);
      fish.y = clamp(fish.y + fish.vy * delta, minY, maxY);

      /* A stroke can still carry a fish into the text, so the text keeps the last word. */
      for (const obstacle of this.obstacles) {
        const exit = findExit(fish.x, fish.y, obstacle, reachX, reachY);
        if (!exit) continue;

        fish.x = clamp(fish.x + exit.x * exit.depth, minX, maxX);
        fish.y = clamp(fish.y + exit.y * exit.depth, minY, maxY);
        if (exit.x === 0) fish.vy = 0;
        else fish.vx = 0;
      }
    }

    let heading: number | undefined;
    if (lead && Math.abs(lead.vx) > MOVEMENT_FACING_THRESHOLD) {
      heading = lead.vx > 0 ? 1 : -1;
    } else if (towardPointerX !== undefined && Math.abs(towardPointerX) > POINTER_TURN_HYSTERESIS) {
      /* Looking at the cursor is reserved for a near-stop so it cannot oppose visible travel. */
      heading = towardPointerX > 0 ? 1 : -1;
    }
    if (heading !== undefined) {
      for (const fish of this.school) fish.heading = heading;
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
    fish.clip = (fish.clip + 1) % clips.length;

    const towardX = targetX - fish.x;
    const towardY = targetY - fish.y;
    const distance = Math.hypot(towardX, towardY);
    if (distance > 0.001) {
      /* Long way to go means a harder push, but only up to a full stroke. */
      const reach = Math.min(distance / (REFERENCE_BODY_WIDTH * fish.scale), 1);
      fish.vx += (towardX / distance) * STROKE_IMPULSE * reach;
      fish.vy += (towardY / distance) * STROKE_IMPULSE * reach * 0.6;
    }

    const variation = 0.97 + 0.05 * Math.sin(this.elapsed * 0.9 + fish.phase * 7);
    fish.strokeTimer = STROKE_INTERVAL_S * variation;
  }

  private draw() {
    const context = this.context;
    const sheet = this.sheet;
    if (!context || !sheet) return;

    context.clearRect(0, 0, this.width, this.height);

    const glitches = this.school.map((fish) => glitchFromAge(this.elapsed - fish.glitchAt));

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
    const sheet = this.sheet;
    const clip = clips[fish.clip];
    if (!context || !sheet || !clip) return;

    const drawnWidth = clip.width * fish.scale;
    const drawnHeight = clip.height * fish.scale;
    const drawX = -clip.anchorX * fish.scale;
    const drawY = -clip.anchorY * fish.scale;

    context.save();
    context.translate(fish.x, fish.y);
    /* The sheet faces right, so swimming or looking left is the mirrored draw. */
    if (fish.heading < 0) context.scale(-1, 1);

    if (glitch.mosaicPx <= 0) {
      context.drawImage(
        sheet,
        clip.x,
        clip.y,
        clip.width,
        clip.height,
        drawX,
        drawY,
        drawnWidth,
        drawnHeight,
      );
      context.restore();
      return;
    }

    const mosaic = this.mosaic;
    const mosaicContext = this.mosaicContext;
    if (!mosaic || !mosaicContext) {
      context.restore();
      return;
    }

    const cellsX = mosaicCells(drawnWidth, glitch.mosaicPx);
    const cellsY = mosaicCells(drawnHeight, glitch.mosaicPx);
    mosaic.width = cellsX;
    mosaic.height = cellsY;
    mosaicContext.imageSmoothingEnabled = true;
    mosaicContext.clearRect(0, 0, cellsX, cellsY);
    mosaicContext.drawImage(
      sheet,
      clip.x,
      clip.y,
      clip.width,
      clip.height,
      0,
      0,
      cellsX,
      cellsY,
    );
    ditherMosaic(mosaicContext, cellsX, cellsY, glitch.dissolve, glitch.scatter);

    context.imageSmoothingEnabled = false;
    if (glitch.chromaPx > 0) {
      context.globalAlpha = 0.45;
      context.drawImage(mosaic, drawX + glitch.chromaPx, drawY, drawnWidth, drawnHeight);
      context.drawImage(mosaic, drawX - glitch.chromaPx, drawY, drawnWidth, drawnHeight);
      context.globalAlpha = 1;
    }
    context.drawImage(mosaic, drawX, drawY, drawnWidth, drawnHeight);
    context.imageSmoothingEnabled = true;
    context.restore();
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function bodyRect(fish: Fish) {
  const width = REFERENCE_BODY_WIDTH * fish.scale;
  const height = width * BODY_HEIGHT_RATIO;
  return {
    left: fish.x - width / 2,
    right: fish.x + width / 2,
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

function glitchFromAge(age: number): Glitch {
  const rest: Glitch = { mosaicPx: 0, dissolve: 0, scatter: 0, chromaPx: 0 };
  if (age < 0) return rest;
  for (const step of GLITCH_SEQUENCE) {
    if (age < step.until) return step;
  }
  return rest;
}

function mosaicCells(drawnPx: number, mosaicPx: number) {
  if (mosaicPx <= 0) return 1;
  return Math.max(MIN_MOSAIC_CELLS, Math.round(drawnPx / mosaicPx));
}

function fract(value: number) {
  return value - Math.floor(value);
}

function bayer2(x: number, y: number) {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  return fract(cellX * 0.5 + cellY * cellY * 0.75);
}

function bayer4(x: number, y: number) {
  return (bayer2(x * 0.5, y * 0.5) * 0.25 + bayer2(x, y)) * (16 / 15);
}

/* Ordered dither on the mosaic cells themselves, matching the gate's cell dropout. */
function ditherMosaic(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  dissolve: number,
  scatter: number,
) {
  if (dissolve <= 0 && scatter <= 0) return;

  const image = context.getImageData(0, 0, width, height);
  const { data } = image;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];
      if (alpha === undefined || alpha === 0) continue;

      if (dissolve > 0 && bayer4(x, y) < dissolve) {
        data[index + 3] = 0;
        continue;
      }

      const grade = bayer4(y + 1, x + 3);
      data[index + 3] = Math.round(alpha * (1 - scatter + scatter * grade));
    }
  }
  context.putImageData(image, 0, 0);
}

/* Nearest way out of an obstacle that has been grown by how far the fish is drawn. */
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
