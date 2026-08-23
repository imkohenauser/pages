import { motionDuration } from './motion-tokens';

const BLINK_RESET_DELAY_MS = 400;

class ButtonLinkInteraction extends HTMLElement {
  private abortController?: AbortController;
  private blinkTimer?: number;
  private blinkResetTimer?: number;
  private afterglowTimer?: number;
  private blinkReady = true;

  connectedCallback() {
    if (this.abortController) return;

    const link = this.querySelector('a');
    if (!(link instanceof HTMLAnchorElement)) return;

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    link.addEventListener('pointerenter', this.handlePointerEnter, { signal });
    link.addEventListener('pointerleave', this.handlePointerLeave, { signal });
    link.addEventListener('pointerdown', this.handlePointerDown, { signal });
    link.addEventListener('pointerup', this.handlePointerUp, { signal });
    link.addEventListener('pointercancel', this.handlePointerCancel, { signal });
    link.addEventListener('keydown', this.handleKeyDown, { signal });
    link.addEventListener('keyup', this.handleKeyUp, { signal });
    link.addEventListener('blur', this.handleBlur, { signal });
  }

  disconnectedCallback() {
    this.abortController?.abort();
    this.abortController = undefined;
    this.clearTimers();
  }

  private handlePointerEnter = () => {
    window.clearTimeout(this.blinkResetTimer);

    if (
      !this.blinkReady ||
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches ||
      !window.matchMedia('(prefers-reduced-motion: no-preference)').matches
    ) {
      return;
    }

    this.blinkReady = false;
    this.toggleAttribute('data-button-link-blinking', true);
    window.clearTimeout(this.blinkTimer);
    this.blinkTimer = window.setTimeout(() => {
      this.removeAttribute('data-button-link-blinking');
    }, motionDuration.electronicCycle);
  };

  private handlePointerLeave = () => {
    window.clearTimeout(this.blinkResetTimer);
    this.blinkResetTimer = window.setTimeout(() => {
      this.blinkReady = true;
    }, BLINK_RESET_DELAY_MS);
    this.finishPress(false);
  };

  private handlePointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    window.clearTimeout(this.blinkTimer);
    this.removeAttribute('data-button-link-blinking');
    this.removeAttribute('data-button-link-afterglow');
    this.toggleAttribute('data-button-link-pressed', true);
  };

  private handlePointerUp = () => {
    this.finishPress(true);
  };

  private handlePointerCancel = () => {
    this.finishPress(false);
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || event.repeat) return;
    this.removeAttribute('data-button-link-afterglow');
    this.toggleAttribute('data-button-link-pressed', true);
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    if (event.key !== 'Enter') return;
    this.finishPress(true);
  };

  private handleBlur = () => {
    this.finishPress(false);
  };

  private finishPress(showAfterglow: boolean) {
    if (!this.hasAttribute('data-button-link-pressed')) return;

    this.removeAttribute('data-button-link-pressed');
    if (!showAfterglow) return;

    this.toggleAttribute('data-button-link-afterglow', true);
    window.clearTimeout(this.afterglowTimer);
    this.afterglowTimer = window.setTimeout(() => {
      this.removeAttribute('data-button-link-afterglow');
    }, motionDuration.materialAfterglow);
  }

  private clearTimers() {
    window.clearTimeout(this.blinkTimer);
    window.clearTimeout(this.blinkResetTimer);
    window.clearTimeout(this.afterglowTimer);
  }
}

export function defineButtonLinkInteraction() {
  if (!customElements.get('button-link-interaction')) {
    customElements.define('button-link-interaction', ButtonLinkInteraction);
  }
}
