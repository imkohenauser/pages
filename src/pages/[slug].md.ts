import type { APIRoute, GetStaticPaths } from 'astro';
import { articleMarkdownDocument } from '../lib/article-markdown';
import { writingCanonicalUrl } from '../lib/seo';
import { getWriting, writingMarkdownPath, type Writing } from '../lib/writing';

export const getStaticPaths = (async () => {
  const writing = (await getWriting()).filter((entry) => writingMarkdownPath(entry));
  return writing.map((entry) => ({
    params: { slug: entry.id },
    props: { writing: entry },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ writing: Writing }> = ({ props }) => {
  const { writing } = props;
  const markdown = articleMarkdownDocument(
    writing.data.title,
    writing.data.description,
    writing.body ?? '',
    writing.filePath,
    writingCanonicalUrl(writing),
  );
  const body = markdown.endsWith('\n') ? markdown : `${markdown}\n`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
