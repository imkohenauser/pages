import { attachPressState } from './press-state';

class HeaderLinkInteraction extends HTMLElement {
  private abortController?: AbortController;

  connectedCallback() {
    if (this.abortController) return;

    const link = this.querySelector('a');
    if (!(link instanceof HTMLAnchorElement)) return;

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    attachPressState(this, link, 'data-header-link-pressed', signal);
  }

  disconnectedCallback() {
    this.abortController?.abort();
    this.abortController = undefined;
  }
}

export function defineHeaderLinkInteraction() {
  if (!customElements.get('header-link-interaction')) {
    customElements.define('header-link-interaction', HeaderLinkInteraction);
  }
}
