import { getCollection, type CollectionEntry } from 'astro:content';
import { assertContentSlug } from './content-id';

export type Project = CollectionEntry<'projects'>;

export function assertProjectSlug(id: string) {
  assertContentSlug(id, 'project');
}

export async function getProjects() {
  const projects = await getCollection('projects', ({ data }) => !data.draft);
  for (const project of projects) {
    assertProjectSlug(project.id);
  }
  return projects.sort(
    (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf(),
  );
}
