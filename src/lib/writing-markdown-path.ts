// External entries have no local HTML page. noindex entries stay out of the
// public Markdown file and the rel=alternate link that reads this path.
export function writingMarkdownPath(entry: {
  id: string;
  data: {
    externalUrl?: string;
    noindex?: boolean;
  };
}) {
  if (entry.data.externalUrl || entry.data.noindex) {
    return undefined;
  }
  return `/${entry.id}.md`;
}
