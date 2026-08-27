export function normalizeWritingQuery(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase().trim();
}

export function writingQueryText(
  title: string,
  description?: string,
  label?: string,
) {
  return normalizeWritingQuery(
    [title, description, label].filter(Boolean).join(' '),
  );
}
