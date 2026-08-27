import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { contentEntryId } from './content-id';
import { writingSitemapSchema } from './content-schema';

const writingDir = fileURLToPath(new URL('../content/writing', import.meta.url));

function extractFrontmatter(text: string, filePath: string) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    throw new Error(`Missing YAML frontmatter in ${filePath}`);
  }
  return match[1];
}

function writingSitemapFields(filePath: string) {
  const text = readFileSync(filePath, 'utf8');
  const parsed = writingSitemapSchema.safeParse(
    parseYaml(extractFrontmatter(text, filePath)) ?? {},
  );
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'frontmatter'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid writing frontmatter in ${filePath}: ${details}`);
  }
  return parsed.data;
}

function excludedWritingSlugs() {
  return globSync('**/*.md', { cwd: writingDir }).flatMap((entry) => {
    const data = writingSitemapFields(join(writingDir, entry));
    return data.noindex || data.canonicalUrl ? [contentEntryId(entry)] : [];
  });
}

const excludedSlugs = excludedWritingSlugs();

export function includeInSitemap(page: string) {
  const { pathname } = new URL(page);

  if (pathname.includes('/posts/') || /\/posts$/.test(pathname)) {
    return false;
  }

  // Former writing pagination URLs now redirect to /writing/.
  if (/\/writing\/\d+\/?$/.test(pathname)) {
    return false;
  }

  if (pathname.endsWith('rss.xml') || pathname.endsWith('robots.txt')) {
    return false;
  }

  return !excludedSlugs.some(
    (slug) => pathname.endsWith(`/${slug}/`) || pathname.endsWith(`/${slug}`),
  );
}
