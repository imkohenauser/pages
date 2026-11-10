import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';

const parser = unified().use(remarkParse).use(remarkMdx);

interface TransformOptions {
  baseUrl?: string;
  includeFallbacks: boolean;
}

interface Edit {
  start: number;
  end: number;
  replacement: string;
}

export function articleReadingSource(body: string, filePath?: string) {
  return transformMdx(body, filePath, { includeFallbacks: false });
}

export function articleCopyMarkdown(body: string, filePath?: string, baseUrl?: string) {
  return transformMdx(body, filePath, { baseUrl, includeFallbacks: true });
}

export function articleMarkdownDocument(
  title: string,
  description: string,
  body: string,
  filePath?: string,
  baseUrl?: string,
) {
  const markdownBody = articleCopyMarkdown(body, filePath, baseUrl);
  return `# ${title}\n\n${description}\n\n${markdownBody}`;
}

// Root-relative links only resolve on the site. Static Markdown and Copy Markdown share this transform.
function absoluteRootUrl(url: string, baseUrl: string) {
  if (!url.startsWith('/') || url.startsWith('//')) return undefined;
  return new URL(url, baseUrl).href;
}

function linkDestinationRange(source: string, url: string) {
  const markerAt = source.lastIndexOf('](');
  if (markerAt === -1) return undefined;
  let index = markerAt + 2;
  while (source[index] === ' ' || source[index] === '\t' || source[index] === '\n' || source[index] === '\r') {
    index += 1;
  }
  if (source[index] === '<') index += 1;
  if (!source.startsWith(url, index)) return undefined;
  return { start: index, end: index + url.length };
}

function recordRootRelativeLink(
  edits: Edit[],
  body: string,
  node: { url: string; position?: { start: { offset?: number | null }; end: { offset?: number | null } } },
  baseUrl: string,
) {
  const absolute = absoluteRootUrl(node.url, baseUrl);
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (!absolute || start == null || end == null) return;
  const relative = linkDestinationRange(body.slice(start, end), node.url);
  if (!relative) return;
  edits.push({
    start: start + relative.start,
    end: start + relative.end,
    replacement: absolute,
  });
}

// Strip executable MDX while retaining Markdown and static HTML, including image captions.
function transformMdx(body: string, filePath: string | undefined, options: TransformOptions) {
  const isMdx = filePath?.endsWith('.mdx') ?? false;
  if (!isMdx && !options.baseUrl) return body;
  const tree = parser.parse(body);
  const edits: Edit[] = [];
  type Node = typeof tree | (typeof tree.children)[number];

  function replace(node: Node, replacement = '') {
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (start !== undefined && end !== undefined) edits.push({ start, end, replacement });
  }

  function collect(node: Node) {
    if (options.baseUrl && node.type === 'link') {
      recordRootRelativeLink(edits, body, node, options.baseUrl);
    }
    if (node.type === 'mdxjsEsm' || node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression') {
      replace(node);
      return;
    }
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      if (node.name === 'RenderedOnly') {
        if (options.includeFallbacks) {
          replace(node);
          return;
        }
        const start = node.position?.start.offset;
        const end = node.position?.end.offset;
        const contentStart = node.children[0]?.position?.start.offset;
        const contentEnd = node.children.at(-1)?.position?.end.offset;
        if (start === undefined || end === undefined) return;
        if (contentStart === undefined || contentEnd === undefined) {
          replace(node);
          return;
        }
        edits.push(
          { start, end: contentStart, replacement: '' },
          { start: contentEnd, end, replacement: '' },
        );
      }
      if (node.name === 'MarkdownFallback') {
        if (!options.includeFallbacks) {
          replace(node);
          return;
        }
        const start = node.position?.start.offset;
        const end = node.position?.end.offset;
        const contentStart = node.children[0]?.position?.start.offset;
        const contentEnd = node.children.at(-1)?.position?.end.offset;
        if (start === undefined || end === undefined) return;
        if (contentStart === undefined || contentEnd === undefined) {
          replace(node);
          return;
        }
        edits.push(
          { start, end: contentStart, replacement: '' },
          { start: contentEnd, end, replacement: '' },
        );
      }
      const staticHtml = node.name !== null && /^[a-z][a-z0-9-]*$/.test(node.name) &&
        node.attributes.every((attribute) => attribute.type === 'mdxJsxAttribute' &&
          (attribute.value === null || typeof attribute.value === 'string'));
      if (!staticHtml && node.name !== 'MarkdownFallback' && node.name !== 'RenderedOnly') {
        const start = node.position?.start.offset;
        const end = node.position?.end.offset;
        const contentStart = node.children[0]?.position?.start.offset;
        const contentEnd = node.children.at(-1)?.position?.end.offset;
        if (start === undefined || end === undefined) return;
        if (contentStart === undefined || contentEnd === undefined) {
          replace(node);
          return;
        }
        // Component wrappers are omitted, but their authored content still belongs to the article.
        edits.push(
          { start, end: contentStart, replacement: '' },
          { start: contentEnd, end, replacement: '' },
        );
      }
      if (staticHtml && options.baseUrl) {
        for (const attribute of node.attributes) {
          if (attribute.type !== 'mdxJsxAttribute' ||
              (attribute.name !== 'src' && attribute.name !== 'href') ||
              typeof attribute.value !== 'string' || !attribute.value.startsWith('/')) continue;
          const start = attribute.position?.start.offset;
          const end = attribute.position?.end.offset;
          if (start === undefined || end === undefined) continue;
          edits.push({
            start,
            end,
            replacement: `${attribute.name}="${new URL(attribute.value, options.baseUrl).href}"`,
          });
        }
      }
    }
    if ('children' in node) {
      for (const child of node.children) collect(child);
    }
  }

  collect(tree);
  if (!isMdx && edits.length === 0) return body;
  let result = body;
  for (const { start, end, replacement } of edits.sort((a, b) => b.start - a.start)) {
    result = result.slice(0, start) + replacement + result.slice(end);
  }
  // MDX stripping trims the reduced body. Plain Markdown keeps its original whitespace.
  return isMdx ? result.trim() : result;
}
