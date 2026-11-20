import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';
import { resolveSiteSettings } from './config/site-settings.mjs';
import { securityHeadersIntegration } from './config/security-headers.mjs';
import { isIndexablePath, routes } from './config/route-policy.mjs';

const settings = resolveSiteSettings({
  ...loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), ''),
  ...process.env,
});
// Propagate fail-closed deployment context to Astro's statically generated pages.
process.env.PUBLIC_INDEXABLE = String(settings.indexable);

export default defineConfig({
  site: settings.origin,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'never' },
  integrations: [
    securityHeadersIntegration(settings.indexable, settings.origin),
    ...(settings.indexable
      ? [
          sitemap({
            filter: (page) => isIndexablePath(page),
            serialize: (item) => {
              const route = routes.find(
                (entry) => entry.path === decodeURI(new URL(item.url).pathname),
              );
              return { ...item, ...(route ? { lastmod: route.updatedAt } : {}) };
            },
          }),
        ]
      : []),
  ],
  markdown: { syntaxHighlight: 'prism' },
  security: {
    checkOrigin: true,
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "media-src 'self'",
        "frame-src 'none'",
        "form-action 'self'",
      ],
    },
  },
});
