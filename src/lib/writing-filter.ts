import { normalizeWritingQuery } from './writing-query';

class WritingFilter extends HTMLElement {
  private abortController?: AbortController;

  connectedCallback() {
    if (this.abortController) return;

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.addEventListener('input', this.handleInput, { signal });
    this.sync();
  }

  disconnectedCallback() {
    this.abortController?.abort();
    this.abortController = undefined;
  }

  private handleInput = (event: Event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.type !== 'checkbox' && target.type !== 'search') return;
    this.sync();
  };

  private selectedLabels() {
    const selected: string[] = [];
    for (const input of this.querySelectorAll(
      'input[type="checkbox"][name="writing-label"]',
    )) {
      if (input instanceof HTMLInputElement && input.checked) {
        selected.push(input.value);
      }
    }
    return selected;
  }

  private queryTokens() {
    const input = this.querySelector(
      'input[type="search"][name="writing-query"]',
    );
    if (!(input instanceof HTMLInputElement)) return [];
    return normalizeWritingQuery(input.value).split(/\s+/).filter(Boolean);
  }

  private sync() {
    const selected = this.selectedLabels();
    const tokens = this.queryTokens();
    const showAllLabels = selected.length === 0;
    let visibleCount = 0;

    for (const item of this.querySelectorAll('[data-writing-label]')) {
      if (!(item instanceof HTMLElement)) continue;
      const label = item.getAttribute('data-writing-label');
      const haystack = item.getAttribute('data-writing-query') ?? '';
      const matchesLabel =
        showAllLabels || (label !== null && selected.includes(label));
      const matchesQuery = tokens.every((token) => haystack.includes(token));
      const visible = matchesLabel && matchesQuery;
      item.toggleAttribute('hidden', !visible);
      if (visible) visibleCount += 1;
    }

    const empty = this.querySelector('[data-writing-filter-empty]');
    if (empty instanceof HTMLElement) {
      empty.toggleAttribute('hidden', visibleCount > 0);
    }
  }
}

export function defineWritingFilter() {
  if (!customElements.get('writing-filter')) {
    customElements.define('writing-filter', WritingFilter);
  }
}
