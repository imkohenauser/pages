import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';

const parser = unified().use(remarkParse).use(remarkMdx);

// Strip executable MDX while retaining Markdown and static HTML, including image captions.
export function articleMarkdown(body: string, filePath?: string) {
  if (!filePath?.endsWith('.mdx')) return body;
  const tree = parser.parse(body);
  const ranges: { start: number; end: number }[] = [];
  type Node = typeof tree | (typeof tree.children)[number];

  function omit(node: Node) {
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (start !== undefined && end !== undefined) ranges.push({ start, end });
  }

  function collect(node: Node) {
    if (node.type === 'mdxjsEsm' || node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression') {
      omit(node);
      return;
    }
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      const staticHtml = node.name !== null && /^[a-z][a-z0-9-]*$/.test(node.name) &&
        node.attributes.every((attribute) => attribute.type === 'mdxJsxAttribute' &&
          (attribute.value === null || typeof attribute.value === 'string'));
      if (!staticHtml) {
        const start = node.position?.start.offset;
        const end = node.position?.end.offset;
        const contentStart = node.children[0]?.position?.start.offset;
        const contentEnd = node.children.at(-1)?.position?.end.offset;
        if (start === undefined || end === undefined) return;
        if (contentStart === undefined || contentEnd === undefined) {
          omit(node);
          return;
        }
        // Component wrappers are omitted, but their authored content still belongs to the article.
        ranges.push({ start, end: contentStart }, { start: contentEnd, end });
      }
    }
    if ('children' in node) {
      for (const child of node.children) collect(child);
    }
  }

  collect(tree);
  let result = body;
  for (const { start, end } of ranges.sort((a, b) => b.start - a.start)) {
    result = result.slice(0, start) + result.slice(end);
  }
  return result.trim();
}
