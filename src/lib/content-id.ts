export const reservedSlugs = ['writing', 'posts', 'projects'] as const;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function assertContentSlug(id: string, kind: 'post' | 'project') {
  if (!slugPattern.test(id)) {
    throw new Error(
      `${kind === 'post' ? 'Post' : 'Project'} slug "${id}" must be a single lowercase ASCII kebab-case segment.`,
    );
  }

  if ((reservedSlugs as readonly string[]).includes(id)) {
    throw new Error(
      `${kind === 'post' ? 'Post' : 'Project'} slug "${id}" conflicts with a reserved route.`,
    );
  }
}
