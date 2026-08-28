const CELL_WIDTH = 8;
const CELL_HEIGHT = 10;
const GLYPH_COUNT = 2;
const MUTATION_INTERVAL_MS = 125;
const MUTATION_RATIO = 0.045;
const MAX_PIXEL_RATIO = 2;
const MAX_RENDER_WIDTH = 3840;
const GLYPH_ASSET_VERSION = 'white-v1';
const GLYPH_OPACITY_MIN = 0.09;
const GLYPH_OPACITY_RANGE = 0.08;
const FADE_START = 0.36;
const FADE_END = 0.82;

class BinaryBackground extends HTMLElement {
  private abortController?: AbortController;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private reducedMotionQuery?: MediaQueryList;
  private canvas?: HTMLCanvasElement;
  private context?: CanvasRenderingContext2D;
  private glyphAtlas?: HTMLCanvasElement;
  private cellData?: Uint8Array;
  private gridColumns = 0;
  private gridRows = 0;
  private cssWidth = 0;
  private cssHeight = 0;
  private mutationTimer?: number;
  private randomState = 0;
  private isIntersecting = false;
  private connectionId = 0;

  connectedCallback() {
    if (this.abortController) return;

    const canvas = this.querySelector('[data-binary-background-canvas]');
    if (!(canvas instanceof HTMLCanvasElement)) return;

    this.canvas = canvas;
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    const connectionId = ++this.connectionId;

    document.addEventListener('visibilitychange', this.updateActivity, {
      signal,
    });

    this.reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );
    this.reducedMotionQuery.addEventListener('change', this.updateActivity, {
      signal,
    });

    this.resizeObserver = new ResizeObserver(this.handleResize);
    this.resizeObserver.observe(canvas);

    this.isIntersecting = isInViewport(this);
    this.intersectionObserver = new IntersectionObserver(
      this.handleIntersection,
    );
    this.intersectionObserver.observe(this);

    void this.initialize(connectionId);
  }

  disconnectedCallback() {
    this.connectionId += 1;
    this.abortController?.abort();
    this.abortController = undefined;
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = undefined;
    this.stopMutation();
    this.disposeScene();
    this.canvas = undefined;
    this.reducedMotionQuery = undefined;
    this.isIntersecting = false;
    this.removeAttribute('data-binary-background-ready');
  }

  private async initialize(connectionId: number) {
    if (!this.canvas) return;

    try {
      const glyphAtlas = await createGlyphAtlas();
      const context = this.canvas.getContext('2d', { alpha: true });
      if (connectionId !== this.connectionId || !this.canvas) return;
      if (!context) throw new Error('Unable to create the binary canvas.');

      this.glyphAtlas = glyphAtlas;
      this.context = context;

      this.resize();
      this.toggleAttribute('data-binary-background-ready', true);
      this.updateActivity();
    } catch {
      this.toggleAttribute('data-binary-background-fallback', true);
    }
  }

  private handleResize = () => {
    this.resize();
  };

  private resize() {
    if (!this.canvas || !this.context) return;

    const { width, height } = this.canvas.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;

    const pixelRatio = Math.min(
      window.devicePixelRatio,
      MAX_PIXEL_RATIO,
      MAX_RENDER_WIDTH / width,
    );
    const backingWidth = Math.max(1, Math.round(width * pixelRatio));
    const backingHeight = Math.max(1, Math.round(height * pixelRatio));
    if (
      this.canvas.width !== backingWidth ||
      this.canvas.height !== backingHeight
    ) {
      this.canvas.width = backingWidth;
      this.canvas.height = backingHeight;
    }
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    this.cssWidth = width;
    this.cssHeight = height;

    const columns = Math.max(1, Math.ceil(width / CELL_WIDTH));
    const rows = Math.max(1, Math.ceil(height / CELL_HEIGHT));
    if (columns !== this.gridColumns || rows !== this.gridRows) {
      this.createCellState(columns, rows);
    }

    this.redrawAll();
  }

  private createCellState(columns: number, rows: number) {
    this.gridColumns = columns;
    this.gridRows = rows;
    this.randomState = (0x6d2b79f5 ^ (columns << 16) ^ rows) >>> 0;

    const cellData = new Uint8Array(columns * rows * 4);
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const offset = (row * columns + column) * 4;
        cellData[offset] = (row + column) % 2 === 0 ? 0 : 255;
        cellData[offset + 1] = Math.round(96 + this.nextRandom() * 159);
        cellData[offset + 2] = 0;
        cellData[offset + 3] = 255;
      }
    }

    this.cellData = cellData;
  }

  private handleIntersection = (entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    this.isIntersecting = entry?.isIntersecting ?? false;
    this.updateActivity();
  };

  private updateActivity = () => {
    const shouldMutate =
      this.isIntersecting &&
      !document.hidden &&
      !this.reducedMotionQuery?.matches &&
      Boolean(this.context && this.cellData);

    if (shouldMutate) {
      this.startMutation();
    } else {
      this.stopMutation();
    }
  };

  private startMutation() {
    if (this.mutationTimer !== undefined) return;
    this.mutationTimer = window.setInterval(
      this.mutateCells,
      MUTATION_INTERVAL_MS,
    );
  }

  private stopMutation() {
    if (this.mutationTimer === undefined) return;
    window.clearInterval(this.mutationTimer);
    this.mutationTimer = undefined;
  }

  private mutateCells = () => {
    if (!this.cellData) return;

    const cellCount = this.gridColumns * this.gridRows;
    const mutationCount = Math.max(1, Math.round(cellCount * MUTATION_RATIO));
    for (let index = 0; index < mutationCount; index += 1) {
      const cell = Math.floor(this.nextRandom() * cellCount);
      const offset = cell * 4;
      this.cellData[offset] = 255 - this.cellData[offset];
      const row = Math.floor(cell / this.gridColumns);
      const column = cell - row * this.gridColumns;
      this.drawCell(column, row);
    }
  };

  private nextRandom() {
    let state = this.randomState;
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    this.randomState = state >>> 0;
    return this.randomState / 0x100000000;
  }

  private redrawAll() {
    if (!this.context) return;

    this.context.clearRect(0, 0, this.cssWidth, this.cssHeight);
    for (let row = 0; row < this.gridRows; row += 1) {
      for (let column = 0; column < this.gridColumns; column += 1) {
        this.drawCell(column, row);
      }
    }
  }

  private drawCell(column: number, row: number) {
    if (!this.context || !this.glyphAtlas || !this.cellData) return;

    const cellWidth = this.cssWidth / this.gridColumns;
    const cellHeight = this.cssHeight / this.gridRows;
    /* Row 0 is the bottom edge, matching the previous WebGL texture layout. */
    const x = column * cellWidth;
    const y = (this.gridRows - 1 - row) * cellHeight;
    const offset = (row * this.gridColumns + column) * 4;
    const glyphIndex = this.cellData[offset] > 127 ? 1 : 0;
    const localOpacity =
      GLYPH_OPACITY_MIN +
      GLYPH_OPACITY_RANGE * (this.cellData[offset + 1] / 255);
    const fadeMask = cellFade(row, this.gridRows);

    this.context.clearRect(x, y, cellWidth, cellHeight);
    this.context.globalAlpha = localOpacity * fadeMask;
    this.context.drawImage(
      this.glyphAtlas,
      glyphIndex * CELL_WIDTH,
      0,
      CELL_WIDTH,
      CELL_HEIGHT,
      x,
      y,
      cellWidth,
      cellHeight,
    );
    this.context.globalAlpha = 1;
  }

  private disposeScene() {
    this.cellData = undefined;
    this.glyphAtlas = undefined;
    this.context = undefined;
    this.gridColumns = 0;
    this.gridRows = 0;
    this.cssWidth = 0;
    this.cssHeight = 0;
  }
}

function cellFade(row: number, rows: number) {
  const distanceFromTop = 1 - (row + 0.5) / rows;
  return 1 - smoothstep(FADE_START, FADE_END, distanceFromTop);
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

async function createGlyphAtlas() {
  const baseUrl = import.meta.env.BASE_URL;
  const glyphs = await Promise.all([
    loadImage(`${baseUrl}glyph/0.svg?v=${GLYPH_ASSET_VERSION}`),
    loadImage(`${baseUrl}glyph/1.svg?v=${GLYPH_ASSET_VERSION}`),
  ]);
  const atlas = document.createElement('canvas');
  atlas.width = CELL_WIDTH * GLYPH_COUNT;
  atlas.height = CELL_HEIGHT;

  const context = atlas.getContext('2d');
  if (!context) throw new Error('Unable to create the binary glyph atlas.');

  context.clearRect(0, 0, atlas.width, atlas.height);
  glyphs.forEach((glyph, index) => {
    context.drawImage(
      glyph,
      index * CELL_WIDTH,
      0,
      CELL_WIDTH,
      CELL_HEIGHT,
    );
  });
  context.globalCompositeOperation = 'source-in';
  context.fillStyle = '#fff';
  context.fillRect(0, 0, atlas.width, atlas.height);

  return atlas;
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.addEventListener('load', () => resolve(image), { once: true });
    image.addEventListener(
      'error',
      () => reject(new Error(`Unable to load ${source}.`)),
      { once: true },
    );
    image.src = source;
  });
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

export function defineBinaryBackground() {
  if (!customElements.get('binary-background')) {
    customElements.define('binary-background', BinaryBackground);
  }
}
