import assert from 'node:assert/strict';
import test from 'node:test';
import {
  articleCopyMarkdown,
  articleMarkdownDocument,
  articleReadingSource,
} from './article-markdown.ts';

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

test('static Markdown and Copy Markdown share absolute root-relative links', () => {
  const body = 'See [the rebuild](/website-rebuild-2026/) and [GitHub](https://github.com/imkohenauser/pages).';
  const baseUrl = 'https://imkohenauser.com/white-horse-motion/';
  const absolute = 'See [the rebuild](https://imkohenauser.com/website-rebuild-2026/) and [GitHub](https://github.com/imkohenauser/pages).';

  assert.equal(articleCopyMarkdown(body, 'index.mdx', baseUrl), absolute);
  assert.equal(
    articleMarkdownDocument('Title', 'Description', body, 'index.mdx', baseUrl),
    `# Title\n\nDescription\n\n${absolute}`,
  );
  assert.equal(articleReadingSource(body, 'index.mdx'), body);
  assert.equal(
    articleCopyMarkdown(`\n${body}\n`, 'index.md', baseUrl),
    `\n${absolute}\n`,
  );
});

test('reading source excludes copy-only fallbacks', () => {
  const result = articleReadingSource(mdx, 'index.mdx');

  assert.match(result, /Visible introduction\./);
  assert.match(result, /Rendered figure caption\./);
  assert.match(result, /Example caption\./);
  assert.doesNotMatch(result, /201ms|<MarkdownFallback/);
});
