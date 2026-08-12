import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOTION_PRESETS, isMotionPreset, type MotionPreset } from '@/lib/motion/presets';

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll animations are declared in markup and read back here, so templates stay
 * plain Tailwind and no `.astro` file needs its own <script>:
 *
 *   <div data-anim="fade-up" data-anim-delay="0.1">…</div>
 *   <ul data-anim="fade-up" data-anim-children="li" data-anim-stagger="0.06">…</ul>
 *   <img data-parallax="0.2" />
 *
 * Supported attributes:
 *   data-anim            preset name from MOTION_PRESETS (required)
 *   data-anim-children   selector; animates matching descendants instead of self
 *   data-anim-stagger    seconds between children
 *   data-anim-delay      seconds
 *   data-anim-duration   seconds
 *   data-anim-ease       any GSAP ease string
 *   data-anim-start      ScrollTrigger `start`, e.g. "top 60%"
 *   data-anim-replay     present: also reverses when scrolled back out of view
 *   data-parallax        signed strength; 0.2 is a subtle drift, 1 is extreme
 */

const DEFAULTS = {
  duration: 0.7,
  ease: 'power2.out',
  start: 'top 85%',
} as const;

let media: gsap.MatchMedia | null = null;

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) ? parsed : fallback;
};

function buildEntrance(element: HTMLElement): void {
  const name = element.dataset.anim;
  if (!isMotionPreset(name)) {
    if (import.meta.env.DEV) console.warn(`[motion] unknown data-anim="${name}"`, element);
    return;
  }

  const selector = element.dataset.animChildren;
  const targets: HTMLElement[] = selector
    ? [...element.querySelectorAll<HTMLElement>(selector)]
    : [element];
  if (targets.length === 0) return;

  const preset: gsap.TweenVars = MOTION_PRESETS[name as MotionPreset];
  const replay = element.dataset.animReplay !== undefined;

  gsap.from(targets, {
    ...preset,
    duration: toNumber(element.dataset.animDuration, DEFAULTS.duration),
    delay: toNumber(element.dataset.animDelay, 0),
    ease: element.dataset.animEase ?? DEFAULTS.ease,
    stagger: toNumber(element.dataset.animStagger, 0),
    scrollTrigger: {
      trigger: element,
      start: element.dataset.animStart ?? DEFAULTS.start,
      toggleActions: replay ? 'play reverse play reverse' : 'play none none none',
    },
  });
}

function buildParallax(element: HTMLElement): void {
  const strength = toNumber(element.dataset.parallax, 0.15);
  const shift = strength * 50;

  // `yPercent` keeps this on the compositor. The trigger is the parent so the
  // element can overflow it (the usual `scale-110` + `overflow-hidden` frame).
  gsap.fromTo(
    element,
    { yPercent: -shift },
    {
      yPercent: shift,
      ease: 'none',
      scrollTrigger: {
        trigger: element.parentElement ?? element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    },
  );
}

export function initMotion(root: ParentNode = document): void {
  teardownMotion();

  const entrances = [...root.querySelectorAll<HTMLElement>('[data-anim]')];
  const parallaxes = [...root.querySelectorAll<HTMLElement>('[data-parallax]')];
  if (entrances.length === 0 && parallaxes.length === 0) return;

  media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    // Created in document order so ScrollTrigger refreshes top-to-bottom.
    entrances.forEach(buildEntrance);
    parallaxes.forEach(buildParallax);
  });

  // Trigger positions are measured from layout, and layout moves once the
  // Japanese webfont swaps in — without this, every start/end below the fold is
  // computed against the fallback metrics.
  void document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

/** Reverts every tween and ScrollTrigger created by `initMotion()`. */
export function teardownMotion(): void {
  media?.revert();
  media = null;
}
