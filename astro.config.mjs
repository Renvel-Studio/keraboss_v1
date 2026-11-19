import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';
import { resolveSiteSettings } from './config/site-settings.mjs';
import { securityHeadersIntegration } from './config/security-headers.mjs';

const settings = resolveSiteSettings({
  ...loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), ''),
  ...process.env,
});

export default defineConfig({
  site: settings.origin,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'never' },
  integrations: [
    securityHeadersIntegration(settings.indexable),
    ...(settings.indexable
      ? [sitemap({ filter: (page) => !new URL(page).pathname.startsWith('/404') })]
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
