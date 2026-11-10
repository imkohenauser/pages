import assert from 'node:assert/strict';
import test from 'node:test';
import { writingMarkdownPath } from './writing-markdown-path.ts';

test('Markdown alternates skip external and noindex writing', () => {
  assert.equal(writingMarkdownPath({ id: 'local', data: {} }), '/local.md');
  assert.equal(
    writingMarkdownPath({ id: 'indexed', data: { noindex: false } }),
    '/indexed.md',
  );
  assert.equal(
    writingMarkdownPath({
      id: 'external',
      data: { externalUrl: 'https://example.com/post' },
    }),
    undefined,
  );
  assert.equal(
    writingMarkdownPath({ id: 'hidden', data: { noindex: true } }),
    undefined,
  );
  assert.equal(
    writingMarkdownPath({
      id: 'hidden-external',
      data: { externalUrl: 'https://example.com/post', noindex: true },
    }),
    undefined,
  );
});
