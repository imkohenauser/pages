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
  ShapeGeometry,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  WebGLRenderer,
} from 'three';

const DESIGN_WIDTH = 500;
const DESIGN_SCENE_HEIGHT = 1277;
const ATLAS_WIDTH = 1448;
const ATLAS_HEIGHT = 1086;
const START_DELAY_MS = 100;
const FRAME_DURATION_MS = 84;
const TOP_ENTER_PX = 1;
const TOP_REARM_PX = 48;
const MAX_PIXEL_RATIO = 2;
const MAX_DRAWING_BUFFER_SIZE = 4096;

interface HorseClip {
  atlasX: number;
  atlasY: number;
  atlasWidth: number;
  atlasHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
  masked: boolean;
}

/* Positions include hourse_v4's -220px, 390px offset in frame_v8--break. */
const clips: HorseClip[] = [
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

class ArchScene extends HTMLElement {
  private abortController?: AbortController;
  private resizeObserver?: ResizeObserver;
  private reducedMotionQuery?: MediaQueryList;
  private canvas?: HTMLCanvasElement;
  private renderer?: WebGLRenderer;
  private scene?: Scene;
  private camera?: OrthographicCamera;
  private texture?: Texture;
  private maskedMaterial?: MeshBasicMaterial;
  private unmaskedMaterial?: MeshBasicMaterial;
  private maskMaterial?: MeshBasicMaterial;
  private maskGeometry?: ShapeGeometry;
  private maskMesh?: Mesh<ShapeGeometry, MeshBasicMaterial>;
  private horseMeshes: Mesh<PlaneGeometry, MeshBasicMaterial>[] = [];
  private animationFrame?: number;
  private resizeFrame?: number;
  private runStartedAt?: number;
  private visibleFrame?: number;
  private topArmed = true;
  private connectionId = 0;
  private canvasWidth = 0;
  private canvasHeight = 0;
  private designScale = 1;

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

      this.createMaterials(texture);
      this.createMask();
      this.createHorseMeshes();
      this.resize();
      this.setVisibleFrame(undefined);
      this.toggleAttribute('data-arch-scene-ready', true);
      this.handleScroll();
    } catch {
      this.toggleAttribute('data-arch-scene-fallback', true);
    }
  }

  private createMaterials(texture: Texture) {
    this.maskedMaterial = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: DoubleSide,
      depthTest: false,
      depthWrite: false,
      stencilWrite: true,
      stencilRef: 1,
      stencilFunc: EqualStencilFunc,
      stencilFail: KeepStencilOp,
      stencilZFail: KeepStencilOp,
      stencilZPass: KeepStencilOp,
    });
    this.unmaskedMaterial = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: DoubleSide,
      depthTest: false,
      depthWrite: false,
    });
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

  private createHorseMeshes() {
    if (!this.scene || !this.maskedMaterial || !this.unmaskedMaterial) return;

    this.horseMeshes = clips.map((clip) => {
      const geometry = createClipGeometry(clip);
      const material = clip.masked ? this.maskedMaterial : this.unmaskedMaterial;
      const mesh = new Mesh(geometry, material);
      mesh.renderOrder = 1;
      mesh.visible = false;
      this.scene?.add(mesh);
      return mesh;
    });
  }

  private handleScroll = () => {
    const scrollTop = Math.max(window.scrollY, 0);
    if (scrollTop > TOP_REARM_PX) {
      this.topArmed = true;
      return;
    }

    if (scrollTop <= TOP_ENTER_PX && this.topArmed && this.renderer) {
      this.topArmed = false;
      if (this.reducedMotionQuery?.matches) {
        this.stopRun();
        this.setVisibleFrame(undefined);
      } else {
        this.play();
      }
    }
  };

  private handleVisibility = () => {
    if (document.hidden) {
      this.stopRun();
      this.setVisibleFrame(undefined);
      return;
    }

    if (window.scrollY <= TOP_ENTER_PX) {
      this.topArmed = false;
      if (!this.reducedMotionQuery?.matches) this.play();
    }
  };

  private handleMotionPreference = () => {
    this.stopRun();
    this.setVisibleFrame(undefined);
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
    this.canvasHeight = Math.max(rootRect.height, DESIGN_SCENE_HEIGHT * this.designScale);
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
    this.horseMeshes.forEach((mesh, index) => {
      const clip = clips[index];
      if (!clip) return;
      mesh.position.set(
        (clip.x + clip.width / 2) * this.designScale,
        (clip.y + clip.height / 2) * this.designScale,
        0,
      );
      mesh.scale.set(
        clip.width * this.designScale,
        -clip.height * this.designScale,
        1,
      );
    });
    this.render();
  }

  private play() {
    if (!this.renderer || document.hidden || this.reducedMotionQuery?.matches) return;

    this.stopRun();
    this.setVisibleFrame(undefined);
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

    const frame = Math.floor(elapsed / FRAME_DURATION_MS);
    if (frame >= clips.length) {
      this.stopRun();
      this.setVisibleFrame(undefined);
      return;
    }

    if (frame !== this.visibleFrame) this.setVisibleFrame(frame);
    this.animationFrame = requestAnimationFrame(this.tick);
  };

  private setVisibleFrame(frame: number | undefined) {
    this.visibleFrame = frame;
    if (frame === undefined) {
      this.removeAttribute('data-arch-scene-frame');
    } else {
      this.dataset.archSceneFrame = String(frame + 1);
    }
    this.horseMeshes.forEach((mesh, index) => {
      mesh.visible = index === frame;
    });
    if (this.maskMesh) {
      this.maskMesh.visible = frame !== undefined && Boolean(clips[frame]?.masked);
    }
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
    this.horseMeshes.forEach((mesh) => mesh.geometry.dispose());
    this.horseMeshes = [];
    this.maskGeometry?.dispose();
    this.maskGeometry = undefined;
    this.maskedMaterial?.dispose();
    this.maskedMaterial = undefined;
    this.unmaskedMaterial?.dispose();
    this.unmaskedMaterial = undefined;
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

function createClipGeometry(clip: HorseClip) {
  const geometry = new PlaneGeometry(1, 1);
  const uv = geometry.getAttribute('uv');
  const left = clip.atlasX / ATLAS_WIDTH;
  const right = (clip.atlasX + clip.atlasWidth) / ATLAS_WIDTH;
  const top = 1 - clip.atlasY / ATLAS_HEIGHT;
  const bottom = 1 - (clip.atlasY + clip.atlasHeight) / ATLAS_HEIGHT;

  uv.setXY(0, left, top);
  uv.setXY(1, right, top);
  uv.setXY(2, left, bottom);
  uv.setXY(3, right, bottom);
  uv.needsUpdate = true;
  return geometry;
}

export function defineArchScene() {
  if (!customElements.get('arch-scene')) {
    customElements.define('arch-scene', ArchScene);
  }
}
