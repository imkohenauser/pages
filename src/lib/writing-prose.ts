class WritingProse extends HTMLElement {
  connectedCallback() {
    for (const heading of this.querySelectorAll('h2[id], h3[id]')) {
      if (!(heading instanceof HTMLHeadingElement)) {
        continue;
      }
      if (heading.querySelector('[data-writing-prose-heading-link]')) {
        continue;
      }

      const link = document.createElement('a');
      link.href = `#${heading.id}`;
      link.textContent = '#';
      link.dataset.writingProseHeadingLink = '';
      link.setAttribute('aria-label', `Link to ${heading.textContent?.trim() ?? 'section'}`);
      heading.append(link);
    }
  }
}

export function defineWritingProse() {
  if (!customElements.get('writing-prose')) {
    customElements.define('writing-prose', WritingProse);
  }
}
