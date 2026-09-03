import { attachPressState } from './press-state';

const feedbackDuration = 2000;

class ArticleActions extends HTMLElement {
  private abortController?: AbortController;
  private feedbackTimeout?: number;

  connectedCallback() {
    this.addEventListener('click', this.handleClick);

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    for (const button of this.querySelectorAll('[data-article-actions-copy]')) {
      if (button instanceof HTMLButtonElement) {
        attachPressState(button, button, 'data-article-actions-pressed', signal);
      }
    }
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick);
    this.abortController?.abort();
    this.abortController = undefined;

    if (this.feedbackTimeout !== undefined) {
      window.clearTimeout(this.feedbackTimeout);
    }
  }

  private readonly handleClick = async (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const button = target.closest('[data-article-actions-copy]');
    if (!(button instanceof HTMLButtonElement) || !this.contains(button)) {
      return;
    }

    const kind = button.dataset.articleActionsCopy;
    const value = kind === 'markdown' ? this.markdown() : this.dataset.articleActionsUrl;
    if (!value) {
      this.setFeedback(button, 'Copy failed', false);
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      this.setFeedback(button, 'Copied', true);
    } catch {
      this.setFeedback(button, 'Copy failed', false);
    }
  };

  private markdown() {
    const source = this.querySelector('[data-article-actions-markdown]');
    return source instanceof HTMLTextAreaElement ? source.value : undefined;
  }

  private setFeedback(button: HTMLButtonElement, message: string, copied: boolean) {
    const status = this.querySelector('[data-article-actions-status]');
    if (!(status instanceof HTMLElement)) {
      return;
    }

    status.textContent = message;
    button.toggleAttribute('data-article-actions-copied', copied);

    if (this.feedbackTimeout !== undefined) {
      window.clearTimeout(this.feedbackTimeout);
    }

    if (!copied) {
      return;
    }

    this.feedbackTimeout = window.setTimeout(() => {
      button.removeAttribute('data-article-actions-copied');
      status.textContent = '';
      this.feedbackTimeout = undefined;
    }, feedbackDuration);
  }
}

export function defineArticleActions() {
  if (!customElements.get('article-actions')) {
    customElements.define('article-actions', ArticleActions);
  }
}
