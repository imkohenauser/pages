const feedbackDuration = 4000;

class ArticleActions extends HTMLElement {
  private feedbackTimeout?: number;

  connectedCallback() {
    this.addEventListener('click', this.handleClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick);
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
      this.setFeedback(button, 'Copy failed');
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      this.setFeedback(button, 'Copied');
    } catch {
      this.setFeedback(button, 'Copy failed');
    }
  };

  private markdown() {
    const source = this.querySelector('[data-article-actions-markdown]');
    return source instanceof HTMLTextAreaElement ? source.value : undefined;
  }

  private setFeedback(button: HTMLButtonElement, message: string) {
    const label = button.querySelector('[data-article-actions-label]');
    const status = this.querySelector('[data-article-actions-status]');
    if (!(label instanceof HTMLElement) || !(status instanceof HTMLElement)) {
      return;
    }

    const original = button.dataset.articleActionsOriginalLabel ?? label.textContent ?? '';
    button.dataset.articleActionsOriginalLabel = original;
    label.textContent = message;
    status.textContent = message;

    if (this.feedbackTimeout !== undefined) {
      window.clearTimeout(this.feedbackTimeout);
    }

    this.feedbackTimeout = window.setTimeout(() => {
      label.textContent = original;
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
