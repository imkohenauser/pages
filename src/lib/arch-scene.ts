import type { ArchRenderer } from './arch-renderer';

/* Long enough that the run starts after the page has settled instead of during the first paint. */
const START_DELAY_MS = 600;
/* Ignore only implausibly rapid input; an intentional second activation adds another run. */
const REPLAY_COOLDOWN_MS = 150;
const INITIAL_PLAY_MAX_SCROLL_PX = 48;
/* Fractional scroll positions can stop just above zero, so use a small tolerance. */
const PAGE_TOP_MAX_SCROLL_PX = 1;
const HORSE_SPRITE = 'sprite-sheet/white-horse_v1.webp';

type PendingPlay = 'initial' | 'replay';

class ArchScene extends HTMLElement {
  private abortController?: AbortController;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private reducedMotionQuery?: MediaQueryList;
  private canvas?: HTMLCanvasElement;
  private renderer?: ArchRenderer;
  private loadPromise?: Promise<void>;
  private pendingPlay?: PendingPlay;
  private waitingForPaint = false;
  private isIntersecting = false;
  private connectedAt = 0;
  private lastReplayAt = -Infinity;
  private connectionId = 0;
  private resizeFrame?: number;
  private wasAtTop = false;
  private replayAtTopWhenIntersecting = false;

  connectedCallback() {
    if (this.abortController) return;

    const canvas = this.querySelector('[data-arch-scene-canvas]');
    const trigger = this.querySelector('[data-arch-scene-trigger]');
    if (!(canvas instanceof HTMLCanvasElement) || !(trigger instanceof HTMLButtonElement)) {
      return;
    }

    this.canvas = canvas;
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    this.connectionId += 1;
    this.connectedAt = performance.now();

    this.wasAtTop = this.isAtPageTop();

    window.addEventListener('resize', this.scheduleResize, { signal });
    window.addEventListener('scroll', this.handleScroll, { passive: true, signal });
    document.addEventListener('visibilitychange', this.handleVisibility, { signal });
    trigger.addEventListener('click', this.handleReplay, { signal });

    this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotionQuery.addEventListener('change', this.handleMotionPreference, {
      signal,
    });

    this.resizeObserver = new ResizeObserver(this.scheduleResize);
    this.resizeObserver.observe(this);

    this.isIntersecting = isInViewport(this);
    this.intersectionObserver = new IntersectionObserver(this.handleIntersection);
    this.intersectionObserver.observe(this);

    if (this.isIntersecting && !this.reducedMotionQuery.matches) {
      this.scheduleLoadAfterPaint();
    }
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
    this.renderer?.dispose();
    this.renderer = undefined;
    this.loadPromise = undefined;
    this.pendingPlay = undefined;
    this.waitingForPaint = false;
    this.canvas = undefined;
    this.reducedMotionQuery = undefined;
    this.isIntersecting = false;
    this.wasAtTop = false;
    this.replayAtTopWhenIntersecting = false;
    this.removeAttribute('data-arch-scene-ready');
    this.removeAttribute('data-arch-scene-fallback');
    this.removeAttribute('data-arch-scene-running');
    this.removeAttribute('data-arch-scene-frame');
  }

  private scheduleLoadAfterPaint() {
    if (this.waitingForPaint) return;

    const connectionId = this.connectionId;
    this.waitingForPaint = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (connectionId !== this.connectionId) return;
        this.waitingForPaint = false;
        if (!this.isIntersecting || this.reducedMotionQuery?.matches) return;
        void this.ensureRenderer(this.canAutoPlay() ? 'initial' : undefined);
      });
    });
  }

  private handleIntersection = (entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    this.isIntersecting = entry?.isIntersecting ?? false;
    if (!this.isIntersecting) return;
    if (this.reducedMotionQuery?.matches) return;

    if (this.replayAtTopWhenIntersecting) {
      this.replayAtTopWhenIntersecting = false;
      if (this.isAtPageTop() && !document.hidden) {
        this.requestReplay();
        return;
      }
    }

    if (this.waitingForPaint) return;
    void this.ensureRenderer();
  };

  private handleReplay = () => {
    this.requestReplay();
  };

  private handleScroll = () => {
    const isAtTop = this.isAtPageTop();
    const reachedTop = isAtTop && !this.wasAtTop;
    this.wasAtTop = isAtTop;

    if (!isAtTop) this.replayAtTopWhenIntersecting = false;

    if (
      !reachedTop ||
      document.hidden ||
      this.reducedMotionQuery?.matches
    ) {
      return;
    }

    if (!this.isIntersecting) {
      this.replayAtTopWhenIntersecting = true;
      return;
    }

    this.requestReplay();
  };

  private requestReplay() {
    const now = performance.now();
    if (now - this.lastReplayAt < REPLAY_COOLDOWN_MS) return;

    this.lastReplayAt = now;
    if (this.reducedMotionQuery?.matches) return;
    void this.ensureRenderer('replay');
  }

  private handleVisibility = () => {
    if (!document.hidden) return;
    this.replayAtTopWhenIntersecting = false;
    this.renderer?.stop();
  };

  private handleMotionPreference = () => {
    this.renderer?.stop();
    if (this.reducedMotionQuery?.matches) {
      this.pendingPlay = undefined;
      this.replayAtTopWhenIntersecting = false;
      return;
    }
    if (this.isIntersecting) void this.ensureRenderer();
  };

  private canAutoPlay() {
    return window.scrollY <= INITIAL_PLAY_MAX_SCROLL_PX;
  }

  private isAtPageTop() {
    return window.scrollY <= PAGE_TOP_MAX_SCROLL_PX;
  }

  private async ensureRenderer(play?: PendingPlay) {
    if (play === 'replay') this.pendingPlay = 'replay';
    else if (play === 'initial' && this.pendingPlay !== 'replay') {
      this.pendingPlay ??= 'initial';
    }

    if (this.renderer) {
      this.flushPendingPlay();
      return;
    }

    if (this.loadPromise) {
      await this.loadPromise;
      this.flushPendingPlay();
      return;
    }

    const connectionId = this.connectionId;
    this.loadPromise = this.loadRenderer(connectionId);
    await this.loadPromise;
  }

  private async loadRenderer(connectionId: number) {
    if (!this.canvas) return;

    try {
      const [rendererModule, horseImage] = await Promise.all([
        import('./arch-renderer'),
        loadHorseImage(),
      ]);
      if (connectionId !== this.connectionId || !this.canvas) return;

      this.renderer = new rendererModule.ArchRenderer(this.canvas, this, horseImage);
      this.toggleAttribute('data-arch-scene-ready', true);
      this.flushPendingPlay();
    } catch {
      if (connectionId !== this.connectionId) return;
      this.toggleAttribute('data-arch-scene-fallback', true);
    }
  }

  private flushPendingPlay() {
    const play = this.pendingPlay;
    this.pendingPlay = undefined;
    if (!this.renderer || play === undefined) return;
    if (document.hidden || this.reducedMotionQuery?.matches) return;

    if (play === 'replay') {
      this.renderer.play(0);
      return;
    }

    const remainingDelay = Math.max(
      0,
      START_DELAY_MS - (performance.now() - this.connectedAt),
    );
    this.renderer.play(remainingDelay);
  }

  private scheduleResize = () => {
    if (this.resizeFrame !== undefined) return;
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = undefined;
      this.renderer?.resize();
    });
  };
}

async function loadHorseImage() {
  const source = `${import.meta.env.BASE_URL}${HORSE_SPRITE}`;
  const image = new Image();
  image.decoding = 'async';
  image.src = source;
  await image.decode();
  return image;
}

function isInViewport(element: HTMLElement) {
  const bounds = element.getBoundingClientRect();
  return (
    bounds.bottom > 0 &&
    bounds.right > 0 &&
    bounds.top < window.innerHeight &&
    bounds.left < window.innerWidth
  );
}

export function defineArchScene() {
  if (!customElements.get('arch-scene')) {
    customElements.define('arch-scene', ArchScene);
  }
}
