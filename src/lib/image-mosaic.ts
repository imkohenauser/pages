import {
  CARD_IMAGE_GLITCH_DURATION_S,
  CARD_IMAGE_GLITCH_SEQUENCE,
} from './card-image-glitch';
import {
  coverSourceRect,
  drawMosaicImage,
  glitchFromAge,
} from './mosaic-glitch';
import { MOTION_IGNITE_DWELL_MS } from './motion-tokens';

let activeMosaic: ImageMosaic | undefined;

export class ImageMosaic extends HTMLElement {
  private image?: HTMLImageElement;
  private displayCanvas?: HTMLCanvasElement;
  private displayContext?: CanvasRenderingContext2D;
  private scratchCanvas?: HTMLCanvasElement;
  private resizeObserver?: ResizeObserver;
  private animationFrame?: number;
  private dwellTimer?: number;
  private glitchStartedAt?: number;
  private firedThisHover = false;
  private animating = false;

  connectedCallback() {
    const image = this.querySelector('img');
    if (!(image instanceof HTMLImageElement)) return;

    this.image = image;

    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.hidden = true;
    Object.assign(canvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
    });
    this.append(canvas);
    this.displayCanvas = canvas;
    this.displayContext = canvas.getContext('2d') ?? undefined;

    this.resizeObserver = new ResizeObserver(() => {
      if (this.animating) this.drawFrame(this.elapsedGlitchAge());
    });
    this.resizeObserver.observe(this);
  }

  disconnectedCallback() {
    this.settle();
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.image = undefined;
    this.displayCanvas = undefined;
    this.displayContext = undefined;
    this.scratchCanvas = undefined;
  }

  play() {
    if (!this.motionAllowed || !this.hoverFine) return;
    if (this.firedThisHover && !this.animating) return;

    if (activeMosaic && activeMosaic !== this) {
      activeMosaic.settle();
    }

    window.clearTimeout(this.dwellTimer);

    if (this.animating) {
      this.settle();
    }

    this.dwellTimer = window.setTimeout(() => {
      this.dwellTimer = undefined;
      this.beginGlitch();
    }, MOTION_IGNITE_DWELL_MS);
  }

  onTriggerLeave() {
    window.clearTimeout(this.dwellTimer);
    this.dwellTimer = undefined;
    this.firedThisHover = false;
  }

  settle() {
    window.clearTimeout(this.dwellTimer);
    this.dwellTimer = undefined;
    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
    this.glitchStartedAt = undefined;
    this.animating = false;
    if (activeMosaic === this) activeMosaic = undefined;
    this.toggleAttribute('data-image-mosaic-active', false);
    if (this.displayCanvas) this.displayCanvas.hidden = true;
  }

  private get motionAllowed() {
    return window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
  }

  private get hoverFine() {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  private elapsedGlitchAge() {
    if (this.glitchStartedAt === undefined) return -1;
    return (performance.now() - this.glitchStartedAt) / 1000;
  }

  private beginGlitch() {
    const image = this.image;
    const context = this.displayContext;
    if (!image || !context || this.firedThisHover || this.animating) return;

    const start = () => {
      if (image.naturalWidth <= 0 || image.naturalHeight <= 0) return;

      if (activeMosaic && activeMosaic !== this) {
        activeMosaic.settle();
      }

      this.firedThisHover = true;
      this.animating = true;
      activeMosaic = this;
      this.glitchStartedAt = performance.now();
      this.toggleAttribute('data-image-mosaic-active', true);
      if (this.displayCanvas) this.displayCanvas.hidden = false;
      this.drawFrame(0);
      this.animationFrame = requestAnimationFrame(this.tick);
    };

    if (image.complete) {
      start();
      return;
    }

    image.addEventListener('load', start, { once: true });
  }

  private tick = () => {
    const age = this.elapsedGlitchAge();
    if (age < 0) return;

    this.drawFrame(age);

    if (age >= CARD_IMAGE_GLITCH_DURATION_S) {
      this.settle();
      return;
    }

    this.animationFrame = requestAnimationFrame(this.tick);
  };

  private drawFrame(age: number) {
    const image = this.image;
    const canvas = this.displayCanvas;
    const context = this.displayContext;
    if (!image || !canvas || !context) return;

    const layoutWidth = this.clientWidth;
    const layoutHeight = this.clientHeight;
    if (layoutWidth <= 0 || layoutHeight <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    const pixelWidth = Math.round(layoutWidth * dpr);
    const pixelHeight = Math.round(layoutHeight * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, layoutWidth, layoutHeight);

    const source = coverSourceRect(
      image.naturalWidth,
      image.naturalHeight,
      layoutWidth,
      layoutHeight,
    );
    const glitch = glitchFromAge(age, CARD_IMAGE_GLITCH_SEQUENCE);
    const scratch = this.scratchCanvas ?? this.createScratchCanvas();

    drawMosaicImage(
      context,
      scratch,
      image,
      source.sx,
      source.sy,
      source.sw,
      source.sh,
      0,
      0,
      layoutWidth,
      layoutHeight,
      glitch,
    );
  }

  private createScratchCanvas() {
    const scratch = document.createElement('canvas');
    this.scratchCanvas = scratch;
    return scratch;
  }
}

export function defineImageMosaic() {
  if (!customElements.get('image-mosaic')) {
    customElements.define('image-mosaic', ImageMosaic);
  }
}
