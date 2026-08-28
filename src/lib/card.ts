import { defineImageMosaic, ImageMosaic } from './image-mosaic';
import { attachPressState } from './press-state';

/* Temporarily disabled. Set to true to restore card image mosaic on hover. */
const CARD_IMAGE_MOSAIC_ENABLED = false;

class CardInteraction extends HTMLElement {
  private abortController?: AbortController;

  connectedCallback() {
    if (this.abortController) return;

    const link = this.querySelector('a');
    if (!(link instanceof HTMLAnchorElement)) return;

    const mosaic = this.querySelector('image-mosaic');
    const imageMosaic = mosaic instanceof ImageMosaic ? mosaic : undefined;

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    attachPressState(this, link, 'data-card-pressed', signal);

    if (!CARD_IMAGE_MOSAIC_ENABLED || !imageMosaic) return;

    link.addEventListener('pointerenter', () => imageMosaic.play(), { signal });
    link.addEventListener('pointerleave', () => imageMosaic.onTriggerLeave(), { signal });
  }

  disconnectedCallback() {
    this.abortController?.abort();
    this.abortController = undefined;
  }
}

export function defineCardInteraction() {
  defineImageMosaic();
  if (!customElements.get('card-interaction')) {
    customElements.define('card-interaction', CardInteraction);
  }
}
