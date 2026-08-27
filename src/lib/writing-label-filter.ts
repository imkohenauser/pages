class WritingLabelFilter extends HTMLElement {
  private abortController?: AbortController;

  connectedCallback() {
    if (this.abortController) return;

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.addEventListener('change', this.handleChange, { signal });
    this.sync();
  }

  disconnectedCallback() {
    this.abortController?.abort();
    this.abortController = undefined;
  }

  private handleChange = (event: Event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type !== 'checkbox') {
      return;
    }
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

  private sync() {
    const selected = this.selectedLabels();
    const showAll = selected.length === 0;
    let visibleCount = 0;

    for (const item of this.querySelectorAll('[data-writing-label]')) {
      if (!(item instanceof HTMLElement)) continue;
      const label = item.getAttribute('data-writing-label');
      const visible = showAll || (label !== null && selected.includes(label));
      item.toggleAttribute('hidden', !visible);
      if (visible) visibleCount += 1;
    }

    const empty = this.querySelector('[data-writing-filter-empty]');
    if (empty instanceof HTMLElement) {
      empty.toggleAttribute('hidden', visibleCount > 0);
    }
  }
}

export function defineWritingLabelFilter() {
  if (!customElements.get('writing-label-filter')) {
    customElements.define('writing-label-filter', WritingLabelFilter);
  }
}
