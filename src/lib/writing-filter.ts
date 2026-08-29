import { attachPressState } from './press-state';
import { normalizeWritingQuery } from './writing-query';

class WritingFilter extends HTMLElement {
  private abortController?: AbortController;
  private queryInput?: HTMLInputElement;
  private clearButton?: HTMLButtonElement;
  private searchField?: HTMLElement;

  connectedCallback() {
    if (this.abortController) return;

    const queryInput = this.querySelector('[data-writing-filter-query]');
    if (!(queryInput instanceof HTMLInputElement)) return;

    this.queryInput = queryInput;

    const clearButton = this.querySelector('[data-writing-filter-clear]');
    this.clearButton =
      clearButton instanceof HTMLButtonElement ? clearButton : undefined;

    const searchField = this.querySelector('[data-writing-filter-field]');
    this.searchField =
      searchField instanceof HTMLElement ? searchField : undefined;

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.addEventListener('input', this.handleInput, { signal });
    this.addEventListener('click', this.handleClick, { signal });

    for (const chip of this.querySelectorAll('[data-writing-filter-chip]')) {
      if (!(chip instanceof HTMLLabelElement)) continue;
      attachPressState(chip, chip, 'data-writing-filter-chip-pressed', signal);
    }

    this.sync();
  }

  disconnectedCallback() {
    this.abortController?.abort();
    this.abortController = undefined;
    this.queryInput = undefined;
    this.clearButton = undefined;
    this.searchField = undefined;
  }

  private handleInput = (event: Event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.type !== 'checkbox' && target.type !== 'search') return;
    this.sync();
  };

  private handleClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest('[data-writing-filter-clear]')) return;

    const input = this.queryInput;
    if (!input) return;

    input.value = '';
    input.focus();
    this.sync();
  };

  private syncSearchField() {
    const hasValue = Boolean(this.queryInput?.value.length);

    this.clearButton?.toggleAttribute('hidden', !hasValue);
    this.searchField?.toggleAttribute('data-writing-filter-filled', hasValue);
  }

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
    const input = this.queryInput;
    if (!input) return [];
    return normalizeWritingQuery(input.value).split(/\s+/).filter(Boolean);
  }

  private sync() {
    this.syncSearchField();
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
