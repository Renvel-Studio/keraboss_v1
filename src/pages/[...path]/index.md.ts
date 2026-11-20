import { getCollection, type CollectionEntry } from 'astro:content';
import { pageRoute } from '../../../config/route-policy.mjs';
import { pageMarkdown } from '@/lib/exports';
import { textResponse } from '@/lib/http';

export async function getStaticPaths() {
  return (await getCollection('pages'))
    .filter(({ data }) => data.key !== 'home' || data.locale !== 'el')
    .map((page) => ({
      params: { path: pageRoute(page.data.key, page.data.locale).path.replace(/^\/|\/$/g, '') },
      props: { page },
    }));
}
export async function GET({
  props,
}: {
  props: { page: CollectionEntry<'pages'> };
}): Promise<Response> {
  return textResponse(await pageMarkdown(props.page), 'text/markdown');
}
