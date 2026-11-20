import { writeFile } from 'node:fs/promises';
import aliases from './redirects.json' with { type: 'json' };
import { routes } from './route-policy.mjs';

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

/design-system/*
  X-Robots-Tag: noindex, follow

/_astro/*
  Cache-Control: public, max-age=31536000, immutable
`;
}

export function securityHeadersIntegration(indexable, origin) {
  return {
    name: 'keraboss-security-headers',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        await writeFile(new URL('_headers', dir), securityHeaders(indexable));
        const redirects = [
          ...aliases,
          ...routes
            .filter((route) => route.path !== '/')
            .map((route) => ({
              from: route.path.replace(/\/$/, ''),
              to: route.path,
              status: 301,
            })),
        ];
        if (new Set(redirects.map(({ from }) => from)).size !== redirects.length)
          throw new Error('Duplicate redirect source.');
        for (const redirect of redirects) {
          if (!routes.some(({ path }) => path === redirect.to))
            throw new Error('Redirect target is not a canonical public page.');
          if (redirects.some(({ from }) => from === redirect.to))
            throw new Error('Redirect chain detected.');
        }
        const canonical = new URL(origin);
        const bareHost = canonical.host.replace(/^www\./, '');
        const otherHost = canonical.host.startsWith('www.') ? bareHost : `www.${bareHost}`;
        const aliasOrigins = [
          `http://${canonical.host}`,
          `http://${otherHost}`,
          `https://${otherHost}`,
        ];
        const paths = [...routes.map(({ path }) => ({ from: path, to: path })), ...redirects];
        const domainRules = aliasOrigins.flatMap((host) =>
          paths.map(({ from, to }) => ({
            from: `${host}${from}`,
            to: `${origin}${to}`,
            status: 301,
          })),
        );
        await writeFile(
          new URL('_redirects', dir),
          [...domainRules, ...redirects]
            .map(({ from, to, status }) => `${encodeURI(from)} ${encodeURI(to)} ${status}!`)
            .join('\n') + '\n',
        );
      },
    },
  };
}
