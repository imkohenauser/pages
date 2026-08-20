import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function extractFrontmatter(text: string) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  return match?.[1];
}

function parseYamlLineValue(raw: string) {
  const value = raw.trim();
  if (value === '' || value.startsWith('#')) {
    return null;
  }

  const quote = value[0];
  if (quote === '"' || quote === "'") {
    const end = value.indexOf(quote, 1);
    return end === -1 ? value.slice(1) : value.slice(1, end);
  }

  const unquoted = value.split(/\s+#/, 2)[0].trim();
  if (unquoted === '' || /^null$/i.test(unquoted) || unquoted === '~') {
    return null;
  }

  return unquoted;
}

function fieldValue(frontmatter: string, key: string) {
  const match = frontmatter.match(new RegExp(`^${key}:[ \\t]*(.*)$`, 'm'));
  if (!match) {
    return undefined;
  }
  return parseYamlLineValue(match[1]);
}

function writingFrontmatter(writingDir = './src/content/writing') {
  return readdirSync(writingDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      try {
        const text = readFileSync(join(writingDir, entry.name, 'index.md'), 'utf8');
        const frontmatter = extractFrontmatter(text);
        return frontmatter === undefined ? [] : [{ slug: entry.name, frontmatter }];
      } catch {
        return [];
      }
    });
}

function hasNoindex(frontmatter: string) {
  return fieldValue(frontmatter, 'noindex') === 'true';
}

function hasCanonicalUrl(frontmatter: string) {
  const value = fieldValue(frontmatter, 'canonicalUrl');
  return value !== undefined && value !== null && value !== '';
}

const excludedSlugs = writingFrontmatter()
  .filter(({ frontmatter }) => hasNoindex(frontmatter) || hasCanonicalUrl(frontmatter))
  .map(({ slug }) => slug);

export function includeInSitemap(page: string) {
  const { pathname } = new URL(page);

  if (pathname.includes('/posts/') || /\/posts$/.test(pathname)) {
    return false;
  }

  if (pathname.endsWith('rss.xml') || pathname.endsWith('robots.txt')) {
    return false;
  }

  return !excludedSlugs.some(
    (slug) => pathname.endsWith(`/${slug}/`) || pathname.endsWith(`/${slug}`),
  );
}
