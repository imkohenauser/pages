import {
  SITE_LOADER_COMPLETE_HOLD_MS,
  SITE_LOADER_COUNTER_MAX,
  SITE_LOADER_DURATION_MS,
  SITE_LOADER_SESSION_KEY,
} from './site-loader-data';

interface CounterDigits {
  hundreds: HTMLElement;
  tens: HTMLElement;
  ones: HTMLElement;
}

function digitGlyphUrl(digit: number) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `url("${base}/glyph/${digit}.svg")`;
}

class SiteLoader extends HTMLElement {
  private abortController?: AbortController;
  private animationFrame?: number;
  private completionTimer?: number;

  connectedCallback() {
    if (this.abortController) return;

    if (this.shouldSkip()) {
      this.toggleAttribute('hidden', true);
      return;
    }

    this.abortController = new AbortController();
    const { signal } = this.abortController;
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const digits = this.getCounterDigits();

    if (!digits) {
      this.hide();
      return;
    }

    void this.run(digits, reducedMotion, signal);
  }

  disconnectedCallback() {
    this.abortController?.abort();
    this.abortController = undefined;
    if (this.animationFrame !== undefined) {
      window.cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
    if (this.completionTimer !== undefined) {
      window.clearTimeout(this.completionTimer);
      this.completionTimer = undefined;
    }
  }

  private shouldSkip() {
    if (document.documentElement.dataset.siteLoader === 'skip') {
      return true;
    }

    try {
      return sessionStorage.getItem(SITE_LOADER_SESSION_KEY) === '1';
    } catch {
      return false;
    }
  }

  private getCounterDigits(): CounterDigits | undefined {
    const hundreds = this.querySelector('[data-site-loader-digit="hundreds"]');
    const tens = this.querySelector('[data-site-loader-digit="tens"]');
    const ones = this.querySelector('[data-site-loader-digit="ones"]');
    if (
      !(hundreds instanceof HTMLElement) ||
      !(tens instanceof HTMLElement) ||
      !(ones instanceof HTMLElement)
    ) {
      return undefined;
    }

    return { hundreds, tens, ones };
  }

  private async run(
    digits: CounterDigits,
    reducedMotion: boolean,
    signal: AbortSignal,
  ) {
    const tasks: Promise<void>[] = [this.waitForPageReady(signal)];

    if (!reducedMotion) {
      tasks.push(this.runCounter(digits, signal));
    }

    await Promise.all(tasks);
    if (signal.aborted) return;

    this.showComplete(digits, signal);
  }

  private runCounter(digits: CounterDigits, signal: AbortSignal) {
    return new Promise<void>((resolve) => {
      const startedAt = performance.now();
      let previousValue = -1;
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        this.animationFrame = undefined;
        resolve();
      };

      const update = (now: number) => {
        if (signal.aborted) {
          finish();
          return;
        }

        const elapsed = now - startedAt;
        const progress = Math.min(elapsed / SITE_LOADER_DURATION_MS, 1);
        const value = Math.min(
          SITE_LOADER_COUNTER_MAX - 1,
          Math.floor(progress * SITE_LOADER_COUNTER_MAX),
        );

        if (value !== previousValue) {
          previousValue = value;
          this.setCounterDigits(digits, value);
        }

        if (progress >= 1) {
          finish();
          return;
        }

        this.animationFrame = window.requestAnimationFrame(update);
      };

      signal.addEventListener(
        'abort',
        () => {
          if (this.animationFrame !== undefined) {
            window.cancelAnimationFrame(this.animationFrame);
          }
          finish();
        },
        { once: true },
      );

      this.animationFrame = window.requestAnimationFrame(update);
    });
  }

  private async waitForPageReady(signal: AbortSignal) {
    const pageReady = new Promise<void>((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
        return;
      }

      window.addEventListener('load', () => resolve(), {
        once: true,
        signal,
      });
    });

    const fontsReady = document.fonts.ready.then(() => undefined);
    const aborted = new Promise<void>((resolve) => {
      signal.addEventListener('abort', () => resolve(), { once: true });
    });

    await Promise.race([Promise.all([pageReady, fontsReady]), aborted]);
  }

  private showComplete(digits: CounterDigits, signal: AbortSignal) {
    this.setCounterDigits(digits, SITE_LOADER_COUNTER_MAX);

    this.animationFrame = window.requestAnimationFrame(() => {
      this.animationFrame = undefined;
      if (signal.aborted) return;

      this.completionTimer = window.setTimeout(() => {
        this.completionTimer = undefined;
        if (signal.aborted) return;

        try {
          sessionStorage.setItem(SITE_LOADER_SESSION_KEY, '1');
        } catch {
          // Continue when storage is unavailable.
        }

        this.hide();
      }, SITE_LOADER_COMPLETE_HOLD_MS);
    });
  }

  private setCounterDigits(digits: CounterDigits, value: number) {
    const padded = String(value).padStart(3, '0');
    digits.hundreds.style.setProperty(
      '--site-loader-glyph',
      digitGlyphUrl(Number(padded[0])),
    );
    digits.tens.style.setProperty(
      '--site-loader-glyph',
      digitGlyphUrl(Number(padded[1])),
    );
    digits.ones.style.setProperty(
      '--site-loader-glyph',
      digitGlyphUrl(Number(padded[2])),
    );
  }

  private hide() {
    this.toggleAttribute('hidden', true);
    document.documentElement.removeAttribute('data-site-loader');
  }
}

export function defineSiteLoader() {
  if (!customElements.get('site-loader')) {
    customElements.define('site-loader', SiteLoader);
  }
}
