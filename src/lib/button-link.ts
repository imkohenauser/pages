// Cooldown before a re-entry may blink again. This is interaction pacing, not animation timing.
const BLINK_RESET_DELAY_MS = 400;

class ButtonLinkInteraction extends HTMLElement {
  private abortController?: AbortController;
  private blinkResetTimer?: number;
  private blinkReady = true;
  private link?: HTMLAnchorElement;

  connectedCallback() {
    if (this.abortController) return;

    const link = this.querySelector('a');
    if (!(link instanceof HTMLAnchorElement)) return;

    this.link = link;
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
    link.addEventListener('animationend', this.handleAnimationEnd, { signal });
  }

  disconnectedCallback() {
    this.abortController?.abort();
    this.abortController = undefined;
    this.link = undefined;
    window.clearTimeout(this.blinkResetTimer);
  }

  // Both blink states end with their animation, so they must not be entered when it cannot run.
  private get motionAllowed() {
    return window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
  }

  private handlePointerEnter = () => {
    window.clearTimeout(this.blinkResetTimer);

    if (
      !this.blinkReady ||
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches ||
      !this.motionAllowed
    ) {
      return;
    }

    this.blinkReady = false;
    this.toggleAttribute('data-button-link-blinking', true);
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

  // The blink and the afterglow never overlap, so one end event can clear either state.
  private handleAnimationEnd = (event: AnimationEvent) => {
    if (event.target !== this.link || event.pseudoElement) return;

    this.removeAttribute('data-button-link-blinking');
    this.removeAttribute('data-button-link-afterglow');
  };

  private finishPress(showAfterglow: boolean) {
    if (!this.hasAttribute('data-button-link-pressed')) return;

    this.removeAttribute('data-button-link-pressed');
    if (!showAfterglow || !this.motionAllowed) return;

    this.toggleAttribute('data-button-link-afterglow', true);
  }
}

export function defineButtonLinkInteraction() {
  if (!customElements.get('button-link-interaction')) {
    customElements.define('button-link-interaction', ButtonLinkInteraction);
  }
}
