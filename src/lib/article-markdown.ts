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

// Strip executable MDX while retaining Markdown and static HTML, including image captions.
function transformMdx(body: string, filePath: string | undefined, options: TransformOptions) {
  if (!filePath?.endsWith('.mdx')) return body;
  const tree = parser.parse(body);
  const edits: Edit[] = [];
  type Node = typeof tree | (typeof tree.children)[number];

  function replace(node: Node, replacement = '') {
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (start !== undefined && end !== undefined) edits.push({ start, end, replacement });
  }

  function collect(node: Node) {
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
  let result = body;
  for (const { start, end, replacement } of edits.sort((a, b) => b.start - a.start)) {
    result = result.slice(0, start) + replacement + result.slice(end);
  }
  return result.trim();
}
