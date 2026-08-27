export const writingLabels = [
  'essay',
  'journal',
  'note',
  'blog',
  'zenn',
  'medium',
] as const;

export type WritingLabel = (typeof writingLabels)[number];

export const localWritingLabels = [
  'essay',
  'journal',
  'note',
  'blog',
] as const;

export type LocalWritingLabel = (typeof localWritingLabels)[number];

export const externalWritingLabels = ['zenn', 'medium'] as const;

export type ExternalWritingLabel = (typeof externalWritingLabels)[number];

export function isLocalWritingLabel(
  label: WritingLabel,
): label is LocalWritingLabel {
  return (localWritingLabels as readonly string[]).includes(label);
}

export function isExternalWritingLabel(
  label: WritingLabel,
): label is ExternalWritingLabel {
  return (externalWritingLabels as readonly string[]).includes(label);
}

export function readActionLabel(label: LocalWritingLabel) {
  return `Read ${label}`;
}

export function writingLabelCounts(
  entries: { data: { label: WritingLabel } }[],
) {
  const counts = Object.fromEntries(
    writingLabels.map((label) => [label, 0]),
  ) as Record<WritingLabel, number>;

  for (const entry of entries) {
    counts[entry.data.label] += 1;
  }

  return writingLabels
    .map((label) => ({ label, count: counts[label] }))
    .filter(({ count }) => count > 0);
}
