import assert from 'node:assert/strict';
import test from 'node:test';
import { site } from '../data/site.ts';
import {
  llmsItemDescription,
  llmsTxtSummary,
  renderLlmsTxtDocument,
} from './llms-txt-document.ts';

test('summary describes local Markdown files', () => {
  assert.match(llmsTxtSummary, /Markdown file/);
  assert.doesNotMatch(
    llmsTxtSummary,
    /Articles and project notes published on this site are HTML pages\./,
  );
});

test('local articles include a Markdown link and external notes stay plain', () => {
  assert.equal(
    llmsItemDescription(
      'About the rebuild.',
      'https://example.com/website-rebuild-2026.md',
    ),
    'About the rebuild. [Markdown](https://example.com/website-rebuild-2026.md)',
  );
  assert.equal(llmsItemDescription('External note.'), 'External note.');
});

test('keeps a blank line after the bio blockquote and omits empty sections', () => {
  const home = '- [Home](https://example.com/): Profile, recent writing, and projects.';
  const rss = '- [RSS](https://example.com/rss.xml): Feed of published writing.';
  const body = renderLlmsTxtDocument({
    pages: [home],
    writing: [],
    projects: [],
    optional: [rss],
  });

  assert.equal(
    body,
    `# ${site.name}\n\n> ${site.bio}\n\n${llmsTxtSummary}\n\n## Pages\n\n${home}\n\n## Optional\n\n${rss}\n`,
  );
});
