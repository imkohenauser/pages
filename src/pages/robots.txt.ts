import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/seo';

export const GET: APIRoute = () => {
  // ai-train is omitted. A missing category neither grants nor restricts that use.
  const body = [
    'User-agent: *',
    'Allow: /',
    'Content-Signal: search=yes, ai-input=yes',
    '',
    `Sitemap: ${absoluteUrl('/sitemap-index.xml')}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
