import { FishSimulation, ATTRACTION_DURATION_S } from './fish-simulation';
import { drawFishSchool } from './fish-renderer';
import type { FishKind } from './fish-sprites';

const MAX_DELTA_S = 0.05;
const SWIM_BAND_HEIGHT_PX = 320;
const OBSTACLE_PADDING = 20;
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
  private simulation = new FishSimulation();
  private pointerClientX?: number;
  private pointerClientY?: number;

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
    this.simulation.hoveredFish = undefined;
    this.simulation.attraction = undefined;
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
    male.src = `${import.meta.env.BASE_URL}sprite-sheet/sacura-margaritacea_male_v2.webp`;
    female.src = `${import.meta.env.BASE_URL}sprite-sheet/sacura-margaritacea_female_v2.webp`;

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

    const boundaryRect = this.boundary.getBoundingClientRect();
    const footerRect = this.footer.getBoundingClientRect();
    const usesDesktopBoundary = boundaryRect.width > rootRect.width + 1;
    const bandLeft = usesDesktopBoundary ? 0 : rootRect.left;
    const bandTop = footerRect.bottom - SWIM_BAND_HEIGHT_PX;
    const width = usesDesktopBoundary
      ? document.documentElement.clientWidth
      : rootRect.width;
    const height = SWIM_BAND_HEIGHT_PX;

    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.canvas.style.insetInlineStart = `${bandLeft - rootRect.left}px`;
    this.canvas.style.insetBlockStart = `${bandTop - rootRect.top}px`;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.width = Math.round(width * pixelRatio);
    this.canvas.height = Math.round(height * pixelRatio);
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    /* Cards stay clickable; fish may swim over the column but steer around each card. */
    const contentObstacles = [
      ...this.obstacleRoot.querySelectorAll('[data-fish-scene-obstacle]'),
    ];
    this.simulation.obstacles = contentObstacles
      .map((element) => element.getBoundingClientRect())
      .map((rect) => ({
        left: rect.left - bandLeft - OBSTACLE_PADDING,
        top: rect.top - bandTop - OBSTACLE_PADDING,
        right: rect.right - bandLeft + OBSTACLE_PADDING,
        bottom: rect.bottom - bandTop + OBSTACLE_PADDING,
      }));

    this.simulation.resize(width, height);

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
      this.simulation.attraction = undefined;
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
    if (x < 0 || x > this.simulation.width || y < 0 || y > this.simulation.height) return;

    this.simulation.attraction = {
      x,
      y,
      until: this.simulation.elapsed + ATTRACTION_DURATION_S,
    };
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
    const canvasRect = this.canvas?.getBoundingClientRect();
    this.simulation.step(
      delta,
      canvasRect
        ? {
            pointerX: this.pointerClientX === undefined
              ? undefined
              : this.pointerClientX - canvasRect.left,
            pointerY: this.pointerClientY === undefined
              ? undefined
              : this.pointerClientY - canvasRect.top,
            hoverEnabled: !this.reducedMotionQuery?.matches && !!this.hoverFineQuery?.matches,
          }
        : undefined,
    );
  }

  private draw() {
    if (!this.context || !this.sheets) return;
    drawFishSchool(this.context, this.mosaic, this.sheets, this.simulation);
  }
}

export function defineFishScene() {
  if (!customElements.get('fish-scene')) {
    customElements.define('fish-scene', FishScene);
  }
}
