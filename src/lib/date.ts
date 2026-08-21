export function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
