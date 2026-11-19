import { site } from '@/config/site';
export function GET(): Response {
  return new Response(
    JSON.stringify({
      id: '/',
      name: site.organizationName,
      short_name: site.name,
      description: site.description,
      lang: site.language,
      dir: 'ltr',
      start_url: '/',
      scope: '/',
      display: 'browser',
      icons: [
        { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      ],
    }),
    { headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' } },
  );
}
