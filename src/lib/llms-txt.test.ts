import assert from 'node:assert/strict';
import test from 'node:test';
import { site } from '../data/site.ts';
import { renderLlmsTxtDocument } from './llms-txt-document.ts';

const summary =
  'Articles and project notes published on this site are HTML pages. Most writing is in Japanese; some posts are in English. Original article text is licensed under CC BY 4.0 unless noted otherwise.';

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
    `# ${site.name}\n\n> ${site.bio}\n\n${summary}\n\n## Pages\n\n${home}\n\n## Optional\n\n${rss}\n`,
  );
});
