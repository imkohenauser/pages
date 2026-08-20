export type ExternalSource = 'github' | 'medium' | 'zenn' | 'site';

const sources: {
  id: Exclude<ExternalSource, 'site'>;
  label: string;
  host: string;
}[] = [
  { id: 'medium', label: 'Medium', host: 'medium.com' },
  { id: 'zenn', label: 'Zenn', host: 'zenn.dev' },
  { id: 'github', label: 'GitHub', host: 'github.com' },
];

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function matchesHost(hostname: string, host: string) {
  return hostname === host || hostname.endsWith(`.${host}`);
}

export function externalSource(url: string): {
  id: ExternalSource;
  label: string;
} {
  const hostname = hostnameOf(url);
  const source = sources.find(({ host }) => matchesHost(hostname, host));
  return source
    ? { id: source.id, label: source.label }
    : { id: 'site', label: 'Official site' };
}
