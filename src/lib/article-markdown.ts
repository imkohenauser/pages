import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';

const parser = unified().use(remarkParse).use(remarkMdx);

// Preserve Markdown source, including code examples, while omitting executable MDX nodes.
export function articleMarkdown(body: string, filePath?: string) {
  if (!filePath?.endsWith('.mdx')) return body;
  const tree = parser.parse(body);
  const ranges: { start: number; end: number }[] = [];
  function collect(node: typeof tree | (typeof tree.children)[number]) {
    if (node.type === 'mdxjsEsm' || node.type === 'mdxFlowExpression' ||
        node.type === 'mdxTextExpression' || node.type === 'mdxJsxFlowElement' ||
        node.type === 'mdxJsxTextElement') {
      const start = node.position?.start.offset;
      const end = node.position?.end.offset;
      if (start !== undefined && end !== undefined) ranges.push({ start, end });
      return;
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
