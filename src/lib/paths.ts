/**
 * Every internal href has to survive being served from a subdirectory, because
 * project-page deployments live at `/<repo>/`. Hardcoded `/posts/foo` links work
 * locally and 404 in production, so all internal links go through `withBase()`.
 */
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '');

const isAbsolute = (path: string) => /^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('//');

export function withBase(path: string): string {
  if (isAbsolute(path) || path.startsWith('#')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${BASE}${normalized}` || '/';
}

/** Fully qualified URL, for canonical links, OG tags, and feeds. */
export function absoluteUrl(path: string, site: URL | undefined): string {
  const relative = withBase(path);
  if (isAbsolute(relative)) return relative;
  return new URL(relative, site ?? 'http://localhost:4321').href;
}

export function postPath(id: string): string {
  return withBase(`/posts/${id}`);
}

export function tagPath(tag: string): string {
  return withBase(`/tags/${encodeURIComponent(tagSlug(tag))}`);
}

/**
 * Kept deliberately naive: lowercase and collapse whitespace, but leave
 * non-ASCII alone. Transliterating would erase Japanese tags entirely, and a
 * percent-encoded path segment is a fair price for keeping them readable.
 */
export function tagSlug(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, '-');
}
