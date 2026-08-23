import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

// Short pages settle faster; the cap keeps long articles from traveling too long.
const SCROLL_DURATION_MIN_MS = 400;
const SCROLL_DURATION_MAX_MS = 800;
const SCROLL_MS_PER_PX = 0.5;

gsap.registerPlugin(ScrollToPlugin);

class PageTopLink extends HTMLElement {
  private abortController?: AbortController;
  private scrollTween?: gsap.core.Tween;

  connectedCallback() {
    if (this.abortController) return;

    const link = this.querySelector('a');
    if (!(link instanceof HTMLAnchorElement)) return;

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    link.addEventListener('click', this.handleClick, { signal });
    link.addEventListener('pointerdown', this.handlePointerDown, { signal });
    link.addEventListener('pointerup', this.handlePointerUp, { signal });
    link.addEventListener('pointercancel', this.handlePointerCancel, { signal });
    link.addEventListener('pointerleave', this.handlePointerLeave, { signal });
    link.addEventListener('keydown', this.handleKeyDown, { signal });
    link.addEventListener('keyup', this.handleKeyUp, { signal });
    link.addEventListener('blur', this.handleBlur, { signal });
  }

  disconnectedCallback() {
    this.abortController?.abort();
    this.abortController = undefined;
    this.cancelScroll();
    this.removeAttribute('data-page-top-pressed');
  }

  private handleClick = (event: MouseEvent) => {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    this.scrollToTop();
  };

  private handlePointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    this.toggleAttribute('data-page-top-pressed', true);
  };

  private handlePointerUp = () => {
    this.removeAttribute('data-page-top-pressed');
  };

  private handlePointerCancel = () => {
    this.removeAttribute('data-page-top-pressed');
  };

  private handlePointerLeave = () => {
    this.removeAttribute('data-page-top-pressed');
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || event.repeat) return;
    this.toggleAttribute('data-page-top-pressed', true);
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    if (event.key !== 'Enter') return;
    this.removeAttribute('data-page-top-pressed');
  };

  private handleBlur = () => {
    this.removeAttribute('data-page-top-pressed');
  };

  private scrollToTop() {
    this.cancelScroll();

    const distance = window.scrollY;
    if (distance <= 0) {
      this.focusMain();
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(window, { scrollTo: { y: 0 } });
      this.focusMain();
      return;
    }

    this.scrollTween = gsap.to(window, {
      duration: scrollDuration(distance) / 1000,
      ease: 'power3.out',
      scrollTo: {
        y: 0,
        autoKill: true,
        onAutoKill: this.handleScrollAutoKill,
      },
      onComplete: this.handleScrollComplete,
      overwrite: 'auto',
    });
  }

  private cancelScroll() {
    this.scrollTween?.kill();
    this.scrollTween = undefined;
  }

  private handleScrollAutoKill = () => {
    this.scrollTween = undefined;
  };

  private handleScrollComplete = () => {
    this.scrollTween = undefined;
    this.focusMain();
  };

  private focusMain() {
    const main = document.getElementById('main-content');
    if (!(main instanceof HTMLElement)) return;
    main.focus({ preventScroll: true });
  }
}

function scrollDuration(distance: number) {
  return Math.min(
    SCROLL_DURATION_MAX_MS,
    Math.max(SCROLL_DURATION_MIN_MS, distance * SCROLL_MS_PER_PX),
  );
}

export function definePageTopLink() {
  if (!customElements.get('page-top-link')) {
    customElements.define('page-top-link', PageTopLink);
  }
}
