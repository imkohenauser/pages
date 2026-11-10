import { site } from '../data/site.ts';

function section(title: string, items: readonly string[]) {
  if (items.length === 0) {
    return undefined;
  }
  return [`## ${title}`, '', ...items, ''].join('\n');
}

const summary =
  'Articles and project notes published on this site are HTML pages. Most writing is in Japanese; some posts are in English. Original article text is licensed under CC BY 4.0 unless noted otherwise.';

export function renderLlmsTxtDocument(sections: {
  pages: readonly string[];
  writing: readonly string[];
  projects: readonly string[];
  optional: readonly string[];
}) {
  const lines = [
    `# ${site.name}`,
    '',
    `> ${site.bio}`,
    '',
    summary,
    '',
    section('Pages', sections.pages),
    section('Writing', sections.writing),
    section('Projects', sections.projects),
    section('Optional', sections.optional),
  ];

  // '' is a blank line between Markdown blocks. undefined is a missing optional section.
  return `${lines.filter((line) => line !== undefined).join('\n').trim()}\n`;
}
