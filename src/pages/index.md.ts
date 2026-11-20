import { pageMarkdown } from '@/lib/exports';
import { getEntry } from 'astro:content';
import { textResponse } from '@/lib/http';
export async function GET(): Promise<Response> {
  const page = await getEntry('pages', 'home-el');
  if (!page) throw new Error('Missing home content.');
  return textResponse(await pageMarkdown(page), 'text/markdown');
}
