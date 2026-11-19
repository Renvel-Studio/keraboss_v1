import { writeFile } from 'node:fs/promises';

/** Netlify / Cloudflare Pages syntax; other hosts need equivalent configuration. */
export function securityHeaders(indexable) {
  return `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: frame-ancestors 'none'
  Link: </llms.txt>; rel="describedby"; type="text/markdown"
${indexable ? '' : '  X-Robots-Tag: noindex, nofollow\n'}
/*.txt
  X-Robots-Tag: noindex, follow

/*.md
  X-Robots-Tag: noindex, follow
  Content-Type: text/markdown; charset=utf-8

/site.webmanifest
  Content-Type: application/manifest+json; charset=utf-8

/_astro/*
  Cache-Control: public, max-age=31536000, immutable
`;
}

export function securityHeadersIntegration(indexable) {
  return {
    name: 'keraboss-security-headers',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        await writeFile(new URL('_headers', dir), securityHeaders(indexable));
      },
    },
  };
}
