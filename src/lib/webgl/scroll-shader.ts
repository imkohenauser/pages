import { Mesh, Program, Renderer, Triangle, Vec2, Vec3 } from 'ogl';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FRAGMENT, VERTEX } from '@/lib/webgl/shaders';

export type ScrollShaderOptions = {
  /** Element whose scroll range maps to `uProgress` (defaults to the canvas parent). */
  trigger?: Element | null;
  /** `#rrggbb`, or an `[r, g, b]` tuple already normalized to 0–1. */
  colorA?: string | [number, number, number];
  colorB?: string | [number, number, number];
  /** Global alpha multiplier. Anything above ~0.5 starts fighting body text. */
  intensity?: number;
  /** Upper bound on devicePixelRatio. Retina at full dpr quadruples fragment cost. */
  maxDpr?: number;
};

export type ScrollShaderHandle = { dispose: () => void };

const toRgb = (
  color: string | [number, number, number],
  fallback: [number, number, number],
): [number, number, number] => {
  if (Array.isArray(color)) return color;
  const hex = color.trim().replace(/^#/, '');
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) return fallback;
  const value = Number.parseInt(full, 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
};

const hasWebGl = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

/**
 * Mounts a full-bleed fragment shader on `canvas` and drives `uProgress` from the
 * scroll position of `trigger`.
 *
 * The render loop only runs while the canvas is on screen and the tab is
 * visible, and it stops entirely under `prefers-reduced-motion` after drawing a
 * single frame — a static gradient rather than nothing, so the layout is
 * unchanged either way.
 */
export function mountScrollShader(
  canvas: HTMLCanvasElement,
  options: ScrollShaderOptions = {},
): ScrollShaderHandle | null {
  if (!hasWebGl()) return null;

  const {
    trigger = canvas.parentElement,
    colorA = '#0f172a',
    colorB = '#6d5ce7',
    intensity = 0.32,
    maxDpr = 1.75,
  } = options;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new Renderer({
    canvas,
    alpha: true,
    antialias: false,
    dpr: Math.min(window.devicePixelRatio || 1, maxDpr),
    powerPreference: 'low-power',
  });
  const { gl } = renderer;
  gl.clearColor(0, 0, 0, 0);

  const program = new Program(gl, {
    vertex: VERTEX,
    fragment: FRAGMENT,
    transparent: true,
    depthTest: false,
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uResolution: { value: new Vec2(1, 1) },
      uColorA: { value: new Vec3(...toRgb(colorA, [0.06, 0.09, 0.16])) },
      uColorB: { value: new Vec3(...toRgb(colorB, [0.43, 0.36, 0.91])) },
      uIntensity: { value: intensity },
    },
  });

  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

  const resize = () => {
    const { clientWidth, clientHeight } = canvas;
    if (clientWidth === 0 || clientHeight === 0) return;
    renderer.setSize(clientWidth, clientHeight);
    program.uniforms.uResolution.value.set(renderer.width, renderer.height);
  };

  const draw = () => renderer.render({ scene: mesh });

  let targetProgress = 0;
  let frame = 0;
  let onScreen = false;
  let startedAt = performance.now();

  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    const current = program.uniforms.uProgress.value as number;
    // Ease toward the scroll value so fast flicks do not snap the field.
    program.uniforms.uProgress.value = current + (targetProgress - current) * 0.08;
    program.uniforms.uTime.value = (now - startedAt) / 1000;
    draw();
  };

  const start = () => {
    if (frame !== 0 || reduceMotion) return;
    startedAt = performance.now() - (program.uniforms.uTime.value as number) * 1000;
    frame = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (frame === 0) return;
    cancelAnimationFrame(frame);
    frame = 0;
  };

  const scrollTrigger = ScrollTrigger.create({
    trigger: trigger ?? canvas,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => {
      targetProgress = self.progress;
      if (reduceMotion) {
        program.uniforms.uProgress.value = self.progress;
        draw();
      }
    },
  });

  const resizeObserver = new ResizeObserver(() => {
    resize();
    draw();
  });
  resizeObserver.observe(canvas);

  const intersectionObserver = new IntersectionObserver(([entry]) => {
    onScreen = entry?.isIntersecting ?? false;
    if (onScreen && !document.hidden) start();
    else stop();
  });
  intersectionObserver.observe(canvas);

  const onVisibilityChange = () => {
    if (document.hidden) stop();
    else if (onScreen) start();
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  resize();
  draw();

  return {
    dispose() {
      stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      scrollTrigger.kill();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
