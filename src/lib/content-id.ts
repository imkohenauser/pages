export const reservedSlugs = ['writing', 'posts', 'projects'] as const;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const kindLabel = {
  writing: 'Writing',
  project: 'Project',
} as const;

export function assertContentSlug(id: string, kind: keyof typeof kindLabel) {
  const label = kindLabel[kind];

  if (!slugPattern.test(id)) {
    throw new Error(
      `${label} slug "${id}" must be a single lowercase ASCII kebab-case segment.`,
    );
  }

  if ((reservedSlugs as readonly string[]).includes(id)) {
    throw new Error(`${label} slug "${id}" conflicts with a reserved route.`);
  }
}
