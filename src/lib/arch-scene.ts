import {
  AlwaysStencilFunc,
  DoubleSide,
  EqualStencilFunc,
  KeepStencilOp,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  ReplaceStencilOp,
  Scene,
  Shape,
  ShaderMaterial,
  ShapeGeometry,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from 'three';

const DESIGN_WIDTH = 500;
const APPROACH_SCENE_HEIGHT = 1277;
/* The exit clips reach further down; the rest of them is cut at the canvas edge while dissolving. */
const EXIT_SCENE_HEIGHT = 1600;
/* Below this much room to the right of the gate the exit would have nowhere to go, so it is dropped. */
const EXIT_MIN_DESIGN_WIDTH = 1000;
/* How much of the last exit clip stays inside the canvas once the horse has left. */
const EXIT_EDGE_MARGIN = 100;
const ATLAS_WIDTH = 1448;
const ATLAS_HEIGHT = 1086;
/* Long enough that the run starts after the page has settled instead of during the first paint. */
const START_DELAY_MS = 600;
const TAIL_STEP_MS = 120;
const MIN_MOSAIC_CELLS = 3;
const TOP_ENTER_PX = 1;
const TOP_REARM_PX = 48;
const MAX_PIXEL_RATIO = 2;
const MAX_DRAWING_BUFFER_SIZE = 4096;

interface HorseClip {
  atlasX: number;
  atlasY: number;
  atlasWidth: number;
  atlasHeight: number;
  /* Approach clips stand at a fixed design x. Exit clips leave it out and derive x from the room
     available to the right of the gate, so the horse always leaves the viewport in the same beats. */
  x?: number;
  exitProgress?: number;
  /* Decay the exit clips carry on their own, before the echo decay is applied on top. */
  exitOpacity?: number;
  exitMosaicPx?: number;
  exitDissolve?: number;
  y: number;
  width: number;
  height: number;
  masked: boolean;
}

interface EchoStep {
  opacity: number;
  /* Mosaic cell and chroma split sizes in rendered pixels, so they stay constant across viewports. */
  mosaicPx: number;
  chromaPx: number;
  /* Share of mosaic cells dropped by the ordered dither, which breaks the ghost apart as it ages. */
  dissolve: number;
}

/* Positions include hourse_v4's -220px, 390px offset in frame_v8--break. */
const approachClips: HorseClip[] = [
  { atlasX: 0, atlasY: 0, atlasWidth: 362, atlasHeight: 340, x: -89, y: 613, width: 59, height: 57, masked: true },
  { atlasX: 362, atlasY: 0, atlasWidth: 362, atlasHeight: 340, x: -55, y: 603, width: 60, height: 57, masked: true },
  { atlasX: 724, atlasY: 0, atlasWidth: 362, atlasHeight: 340, x: -27, y: 587, width: 77, height: 74, masked: true },
  { atlasX: 1086, atlasY: 0, atlasWidth: 362, atlasHeight: 340, x: 7, y: 582, width: 91, height: 87, masked: true },
  { atlasX: 0, atlasY: 340, atlasWidth: 362, atlasHeight: 332, x: 41, y: 577, width: 118, height: 110, masked: false },
  { atlasX: 362, atlasY: 340, atlasWidth: 362, atlasHeight: 332, x: 60, y: 566, width: 155, height: 142, masked: false },
  { atlasX: 724, atlasY: 340, atlasWidth: 362, atlasHeight: 332, x: 81, y: 549, width: 211, height: 195, masked: false },
  { atlasX: 1086, atlasY: 340, atlasWidth: 362, atlasHeight: 332, x: 111, y: 550, width: 272, height: 251, masked: false },
  { atlasX: 0, atlasY: 672, atlasWidth: 362, atlasHeight: 414, x: 161, y: 563, width: 333, height: 382, masked: false },
  { atlasX: 362, atlasY: 672, atlasWidth: 362, atlasHeight: 414, x: 190, y: 573, width: 423, height: 482, masked: false },
  { atlasX: 724, atlasY: 672, atlasWidth: 362, atlasHeight: 414, x: 231, y: 583, width: 539, height: 618, masked: false },
  { atlasX: 1086, atlasY: 672, atlasWidth: 362, atlasHeight: 414, x: 381, y: 593, width: 597, height: 684, masked: false },
];

/* One more pose cycle, at 1.9x the previous one. The approach grows by about 2.2x per cycle, so the
   horse now gains less depth and more lateral speed, which reads as a pass rather than a zoom.
   Sizes follow the approach's perspective, where x and y derive from the drawn width. */
const exitClips: HorseClip[] = [
  { atlasX: 0, atlasY: 672, atlasWidth: 362, atlasHeight: 414, exitProgress: 0.22, y: 590, width: 633, height: 725, masked: false },
  { atlasX: 362, atlasY: 672, atlasWidth: 362, atlasHeight: 414, exitProgress: 0.5, y: 576, width: 804, height: 921, masked: false, exitMosaicPx: 8, exitDissolve: 0.1 },
  { atlasX: 724, atlasY: 672, atlasWidth: 362, atlasHeight: 414, exitProgress: 0.78, y: 558, width: 1024, height: 1173, masked: false, exitOpacity: 0.92, exitMosaicPx: 10, exitDissolve: 0.28 },
  { atlasX: 1086, atlasY: 672, atlasWidth: 362, atlasHeight: 414, exitProgress: 1, y: 549, width: 1134, height: 1299, masked: false, exitOpacity: 0.8, exitMosaicPx: 12, exitDissolve: 0.45 },
];

const clips = [...approachClips, ...exitClips];

/* Fixed uneven step durations, so the run reads as sampled frames rather than a smooth trajectory.
   Never randomise these at runtime. The exit shortens as the horse accelerates past the viewer. */
const stepDurationsMs = [230, 180, 180, 260, 150, 150, 230, 140, 140, 260, 190, 220, 170, 145, 125, 110];

/* Indexed by age in steps: 0 is the live frame, later entries are echoes left behind it. */
const echoSteps: EchoStep[] = [
  { opacity: 1, mosaicPx: 0, chromaPx: 0, dissolve: 0 },
  { opacity: 0.68, mosaicPx: 8, chromaPx: 1.5, dissolve: 0.22 },
  { opacity: 0.48, mosaicPx: 10, chromaPx: 2.5, dissolve: 0.42 },
  { opacity: 0.32, mosaicPx: 12, chromaPx: 3.5, dissolve: 0.6 },
  { opacity: 0.2, mosaicPx: 14, chromaPx: 4.5, dissolve: 0.76 },
  { opacity: 0.11, mosaicPx: 16, chromaPx: 5.5, dissolve: 0.88 },
];

/* Each run continues past its last clip so the trail can decay after the horse has left. */
const approachTimeline = buildTimeline(approachClips.length);
const fullTimeline = buildTimeline(clips.length);

const horseVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const horseFragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2 uClipMin;
  uniform vec2 uClipSize;
  uniform vec2 uMosaicCells;
  uniform float uMosaic;
  uniform float uChroma;
  uniform float uOpacity;
  uniform float uDissolve;
  varying vec2 vUv;

  vec4 sampleClip(vec2 local) {
    /* Clamping keeps an offset sample inside this clip instead of bleeding into the next atlas cell. */
    return texture2D(uMap, uClipMin + clamp(local, 0.0, 1.0) * uClipSize);
  }

  float bayer2(vec2 cell) {
    cell = floor(cell);
    return fract(cell.x * 0.5 + cell.y * cell.y * 0.75);
  }

  /* Ordered 4x4 dither, so which cells drop out is fixed by position rather than generated at runtime. */
  float bayer4(vec2 cell) {
    return (bayer2(cell * 0.5) * 0.25 + bayer2(cell)) * (16.0 / 15.0);
  }

  void main() {
    vec2 cell = floor(vUv * uMosaicCells);
    if (uDissolve > 0.0 && bayer4(cell) < uDissolve) discard;

    vec2 quantised = (cell + 0.5) / uMosaicCells;
    vec2 local = mix(vUv, quantised, uMosaic);

    vec4 base = sampleClip(local);
    float alpha = base.a * uOpacity;
    if (alpha <= 0.0) discard;

    /* The silhouette comes from the unshifted sample, so the split stays inside the horse. */
    vec2 offset = vec2(uChroma, 0.0);
    vec3 color = vec3(sampleClip(local + offset).r, base.g, sampleClip(local - offset).b);

    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

class ArchScene extends HTMLElement {
  private abortController?: AbortController;
  private resizeObserver?: ResizeObserver;
  private reducedMotionQuery?: MediaQueryList;
  private canvas?: HTMLCanvasElement;
  private renderer?: WebGLRenderer;
  private scene?: Scene;
  private camera?: OrthographicCamera;
  private texture?: Texture;
  private maskMaterial?: MeshBasicMaterial;
  private maskGeometry?: ShapeGeometry;
  private maskMesh?: Mesh<ShapeGeometry, MeshBasicMaterial>;
  private horseGeometry?: PlaneGeometry;
  private horseMeshes: Mesh<PlaneGeometry, ShaderMaterial>[] = [];
  private animationFrame?: number;
  private resizeFrame?: number;
  private runStartedAt?: number;
  private visibleStep?: number;
  private topArmed = true;
  private connectionId = 0;
  private canvasWidth = 0;
  private canvasHeight = 0;
  private designScale = 1;
  private extended = false;

  connectedCallback() {
    if (this.abortController) return;

    const canvas = this.querySelector('[data-arch-scene-canvas]');
    if (!(canvas instanceof HTMLCanvasElement)) return;

    this.canvas = canvas;
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    const connectionId = ++this.connectionId;

    window.addEventListener('scroll', this.handleScroll, { passive: true, signal });
    window.addEventListener('resize', this.scheduleResize, { signal });
    document.addEventListener('visibilitychange', this.handleVisibility, { signal });
    canvas.addEventListener('webglcontextlost', this.handleContextLost, { signal });

    this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotionQuery.addEventListener('change', this.handleMotionPreference, { signal });

    this.resizeObserver = new ResizeObserver(this.scheduleResize);
    this.resizeObserver.observe(this);

    void this.initialize(connectionId);
  }

  disconnectedCallback() {
    this.connectionId += 1;
    this.abortController?.abort();
    this.abortController = undefined;
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    if (this.resizeFrame !== undefined) {
      cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = undefined;
    }
    this.stopRun();
    this.disposeScene();
    this.canvas = undefined;
    this.reducedMotionQuery = undefined;
    this.removeAttribute('data-arch-scene-ready');
    this.removeAttribute('data-arch-scene-fallback');
  }

  private async initialize(connectionId: number) {
    if (!this.canvas) return;

    try {
      const texture = await new TextureLoader().loadAsync(
        `${import.meta.env.BASE_URL}sprite-sheet/white-horse_v1.png`,
      );
      if (connectionId !== this.connectionId || !this.canvas) {
        texture.dispose();
        return;
      }

      texture.colorSpace = SRGBColorSpace;
      texture.magFilter = LinearFilter;
      texture.minFilter = LinearFilter;
      this.texture = texture;

      this.renderer = new WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: true,
        depth: false,
        stencil: true,
      });
      this.renderer.outputColorSpace = SRGBColorSpace;
      this.renderer.setClearColor(0x000000, 0);

      this.scene = new Scene();
      this.camera = new OrthographicCamera(0, 1, 0, 1, 0.1, 100);
      this.camera.position.z = 10;

      this.createMask();
      this.createHorseMeshes(texture);
      this.resize();
      this.setVisibleStep(undefined);
      this.toggleAttribute('data-arch-scene-ready', true);
      /* Play once on arrival, and let a return to the top of the page re-arm the run. */
      if (window.scrollY <= TOP_REARM_PX) {
        this.enterTop();
      } else {
        this.topArmed = true;
      }
    } catch {
      this.toggleAttribute('data-arch-scene-fallback', true);
    }
  }

  private createMask() {
    if (!this.scene) return;

    const arch = new Shape();
    arch.moveTo(30, 940);
    arch.lineTo(30, 260);
    arch.absarc(250, 260, 220, Math.PI, 0, true);
    arch.lineTo(470, 940);
    arch.closePath();

    this.maskGeometry = new ShapeGeometry(arch);
    this.maskMaterial = new MeshBasicMaterial({
      colorWrite: false,
      depthTest: false,
      depthWrite: false,
      stencilWrite: true,
      stencilRef: 1,
      stencilFunc: AlwaysStencilFunc,
      stencilFail: KeepStencilOp,
      stencilZFail: KeepStencilOp,
      stencilZPass: ReplaceStencilOp,
    });
    this.maskMesh = new Mesh(this.maskGeometry, this.maskMaterial);
    this.maskMesh.renderOrder = 0;
    this.maskMesh.visible = false;
    this.scene.add(this.maskMesh);
  }

  private createHorseMeshes(texture: Texture) {
    if (!this.scene) return;

    const geometry = new PlaneGeometry(1, 1);
    this.horseGeometry = geometry;
    this.horseMeshes = clips.map((clip, index) => {
      const mesh = new Mesh(geometry, createHorseMaterial(texture, clip));
      /* Later clips stand closer to the viewer, so painting in clip order keeps the trail behind. */
      mesh.renderOrder = 1 + index;
      mesh.visible = false;
      this.scene?.add(mesh);
      return mesh;
    });
  }

  private enterTop() {
    this.topArmed = false;
    if (this.reducedMotionQuery?.matches) {
      this.stopRun();
      this.setVisibleStep(undefined);
      return;
    }
    this.play();
  }

  private handleScroll = () => {
    const scrollTop = Math.max(window.scrollY, 0);
    if (scrollTop > TOP_REARM_PX) {
      this.topArmed = true;
      return;
    }

    if (scrollTop <= TOP_ENTER_PX && this.topArmed && this.renderer) {
      this.enterTop();
    }
  };

  private handleVisibility = () => {
    if (document.hidden) {
      this.stopRun();
      this.setVisibleStep(undefined);
      return;
    }

    if (window.scrollY <= TOP_ENTER_PX) {
      this.topArmed = false;
      if (!this.reducedMotionQuery?.matches) this.play();
    }
  };

  private handleMotionPreference = () => {
    this.stopRun();
    this.setVisibleStep(undefined);
    if (!this.reducedMotionQuery?.matches && window.scrollY <= TOP_ENTER_PX) {
      this.play();
    }
  };

  private scheduleResize = () => {
    if (this.resizeFrame !== undefined) return;
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = undefined;
      this.resize();
    });
  };

  private resize() {
    if (!this.canvas || !this.renderer || !this.camera) return;

    const rootRect = this.getBoundingClientRect();
    if (rootRect.width <= 0 || rootRect.height <= 0) return;

    this.designScale = rootRect.width / DESIGN_WIDTH;
    this.canvasWidth = Math.max(rootRect.width, document.documentElement.clientWidth - rootRect.left);
    const designWidth = this.canvasWidth / this.designScale;
    this.extended = designWidth >= EXIT_MIN_DESIGN_WIDTH;
    const sceneHeight = this.extended ? EXIT_SCENE_HEIGHT : APPROACH_SCENE_HEIGHT;
    this.canvasHeight = Math.max(rootRect.height, sceneHeight * this.designScale);
    this.canvas.style.width = `${this.canvasWidth}px`;
    this.canvas.style.height = `${this.canvasHeight}px`;

    const drawingBufferRatio =
      MAX_DRAWING_BUFFER_SIZE / Math.max(this.canvasWidth, this.canvasHeight);
    const pixelRatio = Math.min(
      window.devicePixelRatio,
      MAX_PIXEL_RATIO,
      drawingBufferRatio,
    );
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(this.canvasWidth, this.canvasHeight, false);

    this.camera.left = 0;
    this.camera.right = this.canvasWidth;
    this.camera.top = 0;
    this.camera.bottom = this.canvasHeight;
    this.camera.updateProjectionMatrix();

    this.maskMesh?.scale.set(this.designScale, this.designScale, 1);
    const exitStartX = approachClips[approachClips.length - 1]?.x ?? 0;
    const exitEndX = designWidth - EXIT_EDGE_MARGIN;
    this.horseMeshes.forEach((mesh, index) => {
      const clip = clips[index];
      if (!clip) return;
      const x = clip.x ?? exitStartX + (exitEndX - exitStartX) * (clip.exitProgress ?? 1);
      mesh.position.set(
        (x + clip.width / 2) * this.designScale,
        (clip.y + clip.height / 2) * this.designScale,
        0,
      );
      mesh.scale.set(
        clip.width * this.designScale,
        -clip.height * this.designScale,
        1,
      );
    });
    this.applyStep();
  }

  private play() {
    if (!this.renderer || document.hidden || this.reducedMotionQuery?.matches) return;

    this.stopRun();
    this.setVisibleStep(undefined);
    this.runStartedAt = performance.now();
    this.toggleAttribute('data-arch-scene-running', true);
    this.animationFrame = requestAnimationFrame(this.tick);
  }

  private tick = (time: number) => {
    if (this.runStartedAt === undefined) return;

    const elapsed = time - this.runStartedAt - START_DELAY_MS;
    if (elapsed < 0) {
      this.animationFrame = requestAnimationFrame(this.tick);
      return;
    }

    const timeline = this.extended ? fullTimeline : approachTimeline;
    if (elapsed >= timeline.durationMs) {
      this.stopRun();
      this.setVisibleStep(undefined);
      return;
    }

    const step = timeline.stepEndTimesMs.findIndex((end) => elapsed < end);
    if (step !== this.visibleStep) this.setVisibleStep(step);
    this.animationFrame = requestAnimationFrame(this.tick);
  };

  private setVisibleStep(step: number | undefined) {
    this.visibleStep = step;
    if (step === undefined) {
      this.removeAttribute('data-arch-scene-frame');
    } else {
      this.dataset.archSceneFrame = String(step + 1);
    }
    this.applyStep();
  }

  private applyStep() {
    const { visibleStep } = this;
    let masked = false;

    this.horseMeshes.forEach((mesh, index) => {
      const clip = clips[index];
      const echo = visibleStep === undefined ? undefined : echoSteps[visibleStep - index];
      mesh.visible = Boolean(clip && echo);
      if (!clip || !echo) return;

      /* Mosaic and chroma are sized against the drawn width so they stay the same on screen
         whatever the clip's distance, while the exit adds its own decay to the echo's. */
      const drawnWidth = clip.width * this.designScale;
      const drawnHeight = clip.height * this.designScale;
      const mosaicPx = Math.max(echo.mosaicPx, clip.exitMosaicPx ?? 0);

      const { uniforms } = mesh.material;
      uniforms.uOpacity.value = echo.opacity * (clip.exitOpacity ?? 1);
      uniforms.uMosaic.value = mosaicPx > 0 ? 1 : 0;
      uniforms.uChroma.value = echo.chromaPx / drawnWidth;
      uniforms.uDissolve.value = Math.max(echo.dissolve, clip.exitDissolve ?? 0);
      uniforms.uMosaicCells.value.set(
        mosaicCells(drawnWidth, mosaicPx),
        mosaicCells(drawnHeight, mosaicPx),
      );
      masked ||= clip.masked;
    });

    if (this.maskMesh) this.maskMesh.visible = masked;
    this.render();
  }

  private stopRun() {
    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
    this.runStartedAt = undefined;
    this.removeAttribute('data-arch-scene-running');
  }

  private render() {
    if (!this.renderer || !this.scene || !this.camera) return;
    this.renderer.clear(true, true, true);
    this.renderer.render(this.scene, this.camera);
  }

  private handleContextLost = (event: Event) => {
    event.preventDefault();
    this.stopRun();
    this.toggleAttribute('data-arch-scene-fallback', true);
  };

  private disposeScene() {
    this.horseMeshes.forEach((mesh) => mesh.material.dispose());
    this.horseMeshes = [];
    this.horseGeometry?.dispose();
    this.horseGeometry = undefined;
    this.maskGeometry?.dispose();
    this.maskGeometry = undefined;
    this.maskMaterial?.dispose();
    this.maskMaterial = undefined;
    this.texture?.dispose();
    this.texture = undefined;
    this.renderer?.dispose();
    this.renderer?.forceContextLoss();
    this.renderer = undefined;
    this.scene = undefined;
    this.camera = undefined;
    this.maskMesh = undefined;
  }
}

function buildTimeline(clipCount: number) {
  let total = 0;
  const stepEndTimesMs = Array.from(
    { length: clipCount + echoSteps.length - 1 },
    (_, index) => {
      total += index < clipCount ? (stepDurationsMs[index] ?? TAIL_STEP_MS) : TAIL_STEP_MS;
      return total;
    },
  );
  return { stepEndTimesMs, durationMs: total };
}

function mosaicCells(drawnPx: number, mosaicPx: number) {
  if (mosaicPx <= 0) return 1;
  return Math.max(MIN_MOSAIC_CELLS, Math.round(drawnPx / mosaicPx));
}

function createHorseMaterial(texture: Texture, clip: HorseClip) {
  const left = clip.atlasX / ATLAS_WIDTH;
  const right = (clip.atlasX + clip.atlasWidth) / ATLAS_WIDTH;
  const top = 1 - clip.atlasY / ATLAS_HEIGHT;
  const bottom = 1 - (clip.atlasY + clip.atlasHeight) / ATLAS_HEIGHT;

  const material = new ShaderMaterial({
    uniforms: {
      uMap: { value: texture },
      uClipMin: { value: new Vector2(left, bottom) },
      uClipSize: { value: new Vector2(right - left, top - bottom) },
      uMosaicCells: { value: new Vector2(1, 1) },
      uMosaic: { value: 0 },
      uChroma: { value: 0 },
      uOpacity: { value: 1 },
      uDissolve: { value: 0 },
    },
    vertexShader: horseVertexShader,
    fragmentShader: horseFragmentShader,
    transparent: true,
    side: DoubleSide,
    depthTest: false,
    depthWrite: false,
  });

  if (clip.masked) {
    material.stencilWrite = true;
    material.stencilRef = 1;
    material.stencilFunc = EqualStencilFunc;
    material.stencilFail = KeepStencilOp;
    material.stencilZFail = KeepStencilOp;
    material.stencilZPass = KeepStencilOp;
  }

  return material;
}

export function defineArchScene() {
  if (!customElements.get('arch-scene')) {
    customElements.define('arch-scene', ArchScene);
  }
}
