import { attachPressState } from './press-state';

class CardInteraction extends HTMLElement {
  private abortController?: AbortController;

  connectedCallback() {
    if (this.abortController) return;

    const link = this.querySelector('a');
    if (!(link instanceof HTMLAnchorElement)) return;

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    attachPressState(this, link, 'data-card-pressed', signal);
  }

  disconnectedCallback() {
    this.abortController?.abort();
    this.abortController = undefined;
  }
}

export function defineCardInteraction() {
  if (!customElements.get('card-interaction')) {
    customElements.define('card-interaction', CardInteraction);
  }
}
