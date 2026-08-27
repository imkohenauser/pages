import {
  CanvasTexture,
  DataTexture,
  Mesh,
  NearestFilter,
  NoBlending,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  ShaderMaterial,
  UnsignedByteType,
  Vector2,
  WebGLRenderer,
} from 'three';

const CELL_WIDTH = 8;
const CELL_HEIGHT = 10;
const GLYPH_COUNT = 2;
const MUTATION_INTERVAL_MS = 125;
const MUTATION_RATIO = 0.045;
const MAX_PIXEL_RATIO = 2;
const MAX_RENDER_WIDTH = 3840;
const GLYPH_ASSET_VERSION = 'white-v1';

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform sampler2D uGlyphAtlas;
  uniform sampler2D uCellState;
  uniform vec2 uGridSize;
  varying vec2 vUv;

  void main() {
    vec2 gridPosition = vUv * uGridSize;
    vec2 cell = floor(gridPosition);
    vec2 cellUv = fract(gridPosition);
    vec2 stateUv = (cell + 0.5) / uGridSize;
    vec4 state = texture2D(uCellState, stateUv);

    float glyphIndex = floor(state.r * float(${GLYPH_COUNT - 1}) + 0.5);
    vec2 atlasUv = vec2(
      (glyphIndex + cellUv.x) / float(${GLYPH_COUNT}),
      cellUv.y
    );
    float glyphAlpha = texture2D(uGlyphAtlas, atlasUv).a;

    float distanceFromTop = 1.0 - vUv.y;
    float fadeMask = 1.0 - smoothstep(0.36, 0.82, distanceFromTop);
    float localOpacity = mix(0.09, 0.17, state.g);
    float alpha = glyphAlpha * localOpacity * fadeMask;

    gl_FragColor = vec4(vec3(alpha), alpha);
  }
`;

class BinaryBackground extends HTMLElement {
  private abortController?: AbortController;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private reducedMotionQuery?: MediaQueryList;
  private canvas?: HTMLCanvasElement;
  private renderer?: WebGLRenderer;
  private scene?: Mesh;
  private camera?: OrthographicCamera;
  private geometry?: PlaneGeometry;
  private material?: ShaderMaterial;
  private glyphAtlas?: CanvasTexture;
  private cellState?: DataTexture;
  private cellData?: Uint8Array;
  private gridColumns = 0;
  private gridRows = 0;
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
    canvas.addEventListener('webglcontextlost', this.handleContextLost, {
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
      if (connectionId !== this.connectionId || !this.canvas) {
        glyphAtlas.dispose();
        return;
      }

      this.glyphAtlas = glyphAtlas;
      this.renderer = new WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: false,
        depth: false,
      });
      this.renderer.setClearColor(0x000000, 0);

      this.geometry = new PlaneGeometry(2, 2);
      this.material = new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uGlyphAtlas: { value: glyphAtlas },
          uCellState: { value: null },
          uGridSize: { value: new Vector2(1, 1) },
        },
        transparent: true,
        blending: NoBlending,
        depthTest: false,
        depthWrite: false,
      });

      const scene = new Mesh(this.geometry, this.material);
      const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
      this.renderer.setAnimationLoop(null);
      this.scene = scene;
      this.camera = camera;

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
    if (!this.canvas || !this.renderer || !this.material) return;

    const { width, height } = this.canvas.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;

    // Keep the backing buffer within 4K so lower GPU limits do not reject it.
    const pixelRatio = Math.min(
      window.devicePixelRatio,
      MAX_PIXEL_RATIO,
      MAX_RENDER_WIDTH / width,
    );
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);

    const columns = Math.max(1, Math.ceil(width / CELL_WIDTH));
    const rows = Math.max(1, Math.ceil(height / CELL_HEIGHT));
    if (columns !== this.gridColumns || rows !== this.gridRows) {
      this.createCellState(columns, rows);
    }

    this.render();
  }

  private createCellState(columns: number, rows: number) {
    this.cellState?.dispose();
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

    const cellState = new DataTexture(
      cellData,
      columns,
      rows,
      RGBAFormat,
      UnsignedByteType,
    );
    cellState.minFilter = NearestFilter;
    cellState.magFilter = NearestFilter;
    cellState.generateMipmaps = false;
    cellState.needsUpdate = true;

    this.cellData = cellData;
    this.cellState = cellState;
    if (this.material) {
      this.material.uniforms.uCellState.value = cellState;
      this.material.uniforms.uGridSize.value.set(columns, rows);
    }
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
      Boolean(this.renderer && this.cellData);

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
    if (!this.cellData || !this.cellState) return;

    const cellCount = this.gridColumns * this.gridRows;
    const mutationCount = Math.max(1, Math.round(cellCount * MUTATION_RATIO));
    for (let index = 0; index < mutationCount; index += 1) {
      const cell = Math.floor(this.nextRandom() * cellCount);
      const offset = cell * 4;
      this.cellData[offset] = 255 - this.cellData[offset];
    }

    this.cellState.needsUpdate = true;
    this.render();
  };

  private nextRandom() {
    let state = this.randomState;
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    this.randomState = state >>> 0;
    return this.randomState / 0x100000000;
  }

  private render() {
    if (!this.renderer || !this.cellState || !this.scene || !this.camera) return;
    this.renderer.render(this.scene, this.camera);
  }

  private handleContextLost = () => {
    this.stopMutation();
    this.toggleAttribute('data-binary-background-fallback', true);
  };

  private disposeScene() {
    this.cellState?.dispose();
    this.cellState = undefined;
    this.cellData = undefined;
    this.glyphAtlas?.dispose();
    this.glyphAtlas = undefined;
    this.material?.dispose();
    this.material = undefined;
    this.geometry?.dispose();
    this.geometry = undefined;
    this.renderer?.dispose();
    this.renderer?.forceContextLoss();
    this.renderer = undefined;
    this.scene = undefined;
    this.camera = undefined;
    this.gridColumns = 0;
    this.gridRows = 0;
  }
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

  const texture = new CanvasTexture(atlas);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
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
