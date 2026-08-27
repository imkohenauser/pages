class HeaderLinkInteraction extends HTMLElement {
  private abortController?: AbortController;

  connectedCallback() {
    if (this.abortController) return;

    const link = this.querySelector('a');
    if (!(link instanceof HTMLAnchorElement)) return;

    this.abortController = new AbortController();
    const { signal } = this.abortController;

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
    this.removeAttribute('data-header-link-pressed');
  }

  private handlePointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    this.toggleAttribute('data-header-link-pressed', true);
  };

  private handlePointerUp = () => {
    this.removeAttribute('data-header-link-pressed');
  };

  private handlePointerCancel = () => {
    this.removeAttribute('data-header-link-pressed');
  };

  private handlePointerLeave = () => {
    this.removeAttribute('data-header-link-pressed');
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || event.repeat) return;
    this.toggleAttribute('data-header-link-pressed', true);
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    if (event.key !== 'Enter') return;
    this.removeAttribute('data-header-link-pressed');
  };

  private handleBlur = () => {
    this.removeAttribute('data-header-link-pressed');
  };
}

export function defineHeaderLinkInteraction() {
  if (!customElements.get('header-link-interaction')) {
    customElements.define('header-link-interaction', HeaderLinkInteraction);
  }
}
