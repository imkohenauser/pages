import assert from 'node:assert/strict';
import test from 'node:test';
import { articleCopyMarkdown, articleReadingSource } from './article-markdown.ts';

const mdx = `import Demo from './Demo.astro';
import MarkdownFallback from './MarkdownFallback.astro';
import RenderedOnly from './RenderedOnly.astro';

Visible introduction.

<Demo />

<MarkdownFallback>
| Frame | Duration |
| --- | ---: |
| 1 | 201ms |
</MarkdownFallback>

<RenderedOnly>
  <figure>
    <DynamicImage src={image} />
    <figcaption>Rendered figure caption.</figcaption>
  </figure>
</RenderedOnly>

<PhotoComparison>
  <figure>
    <img src="/images/example.webp" alt="Example" />
    <figcaption>Example caption.</figcaption>
  </figure>
</PhotoComparison>`;

test('copy Markdown retains explicit fallbacks and portable static HTML', () => {
  const result = articleCopyMarkdown(mdx, 'index.mdx', 'https://example.com/article/');

  assert.match(result, /\| 1 \| 201ms \|/);
  assert.match(result, /src="https:\/\/example\.com\/images\/example\.webp"/);
  assert.match(result, /Example caption\./);
  assert.doesNotMatch(result, /Rendered figure caption|import Demo|<Demo|<MarkdownFallback|<RenderedOnly|<PhotoComparison/);
});

test('reading source excludes copy-only fallbacks', () => {
  const result = articleReadingSource(mdx, 'index.mdx');

  assert.match(result, /Visible introduction\./);
  assert.match(result, /Rendered figure caption\./);
  assert.match(result, /Example caption\./);
  assert.doesNotMatch(result, /201ms|<MarkdownFallback/);
});
