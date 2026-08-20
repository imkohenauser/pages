export function path(value = '/') {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const route = value.startsWith('/') ? value : `/${value}`;
  return `${base}${route}`;
}
