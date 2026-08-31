import type { APIRoute } from 'astro';
import { renderLlmsTxt } from '../lib/llms-txt';

export const GET: APIRoute = async () => {
  const body = await renderLlmsTxt();

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
