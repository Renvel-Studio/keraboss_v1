import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, access } from 'node:fs/promises';
import { loadEnv } from 'vite';
import sharp from 'sharp';
import { resolveSiteSettings } from '../config/site-settings.mjs';

const settings = resolveSiteSettings({
  ...loadEnv('production', process.cwd(), ''),
  ...process.env,
});
const read = (file) => readFile(new URL(`../dist/${file}`, import.meta.url), 'utf8');
const exists = async (file) => access(new URL(`../dist/${file}`, import.meta.url));
const decode = (value) =>
  value.replace(
    /&(?:amp|quot|apos|lt|gt|#39|#x27);/g,
    (entity) =>
      ({
        '&amp;': '&',
        '&quot;': '"',
        '&apos;': "'",
        '&#39;': "'",
        '&#x27;': "'",
        '&lt;': '<',
        '&gt;': '>',
      })[entity],
  );
const attrs = (tag) =>
  Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((match) => [match[1], decode(match[2])]),
  );
const tags = (html, name) =>
  [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map(([tag]) => attrs(tag));
const html = await read('index.html');
const meta = tags(html, 'meta');
const links = tags(html, 'link');
const value = (key) => meta.find((tag) => tag.name === key || tag.property === key)?.content;
assert.match(html, /<html lang="el">/);
assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert.equal((html.match(/<title>/g) || []).length, 1);
assert.ok(value('description')?.length > 30);
assert.equal(links.filter((tag) => tag.rel === 'canonical').length, 1);
assert.equal(links.find((tag) => tag.rel === 'canonical')?.href, `${settings.origin}/`);
assert.equal(value('og:url'), `${settings.origin}/`);
assert.equal(value('og:locale'), 'el_GR');
assert.equal(value('twitter:card'), value('og:image') ? 'summary_large_image' : 'summary');
assert.match(
  value('robots'),
  settings.indexable ? /index, follow, max-image-preview:large/ : /^noindex/,
);
assert.equal(links.find((tag) => tag.rel === 'describedby')?.href, '/llms.txt');
assert.equal(
  links.find((tag) => tag.type === 'text/markdown' && tag.rel === 'alternate')?.href,
  `${settings.origin}/index.md`,
);

const jsonLd = html.match(
  /<script\b(?=[^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/,
)?.[1];
assert.ok(jsonLd, 'JSON-LD must be present in static HTML.');
const graph = JSON.parse(jsonLd);
assert.equal(graph['@context'], 'https://schema.org');
for (const type of ['Organization', 'WebSite', 'WebPage'])
  assert.ok(graph['@graph'].some((node) => node['@type'] === type));
const company = graph['@graph'].find((node) => node['@type'] === 'Organization');
assert.equal(company.telephone, '+302106420962');
assert.equal(company.sameAs.length, 3);
assert.ok(company.sameAs.includes('https://www.facebook.com/superKeraboss/'));
for (const profile of company.sameAs)
  assert.ok(html.includes(profile), 'Social entities must also be visibly linked.');
const csp = meta.find(
  (tag) => tag['http-equiv']?.toLowerCase() === 'content-security-policy',
)?.content;
assert.ok(csp?.includes("object-src 'none'"));
assert.ok(
  csp.includes(`sha256-${createHash('sha256').update(jsonLd).digest('base64')}`),
  'JSON-LD must be allowed by CSP.',
);
assert.ok(!csp.includes("'unsafe-eval'"));
assert.ok(!csp.includes("'unsafe-inline'"));
for (const tag of [...tags(html, 'link'), ...tags(html, 'script'), ...tags(html, 'use')]) {
  const path = tag.href || tag.src;
  if (path?.startsWith('/') && !path.startsWith('//')) await exists(path.slice(1).split('#')[0]);
}
const errorPage = await read('404.html');
assert.match(tags(errorPage, 'meta').find((tag) => tag.name === 'robots')?.content, /^noindex/);
const designPage = await read('design-system/index.html');
assert.match(tags(designPage, 'meta').find((tag) => tag.name === 'robots')?.content, /^noindex/);

const robots = await read('robots.txt');
assert.match(robots, /User-agent: \*/);
if (settings.indexable) {
  assert.match(robots, /Allow: \/\n/);
  assert.ok(!robots.includes('Disallow: /'));
  assert.ok(robots.includes(`Sitemap: ${settings.origin}/sitemap-index.xml`));
  assert.ok((await read('sitemap-index.xml')).includes(`${settings.origin}/sitemap-0.xml`));
  const sitemap = await read('sitemap-0.xml');
  assert.ok(sitemap.includes(`<loc>${settings.origin}/</loc>`));
  assert.ok(!/404|llms|security\.txt|index\.md|design-system/.test(sitemap));
} else {
  assert.match(robots, /Disallow: \/\n/);
  assert.ok(!robots.includes('Sitemap:'));
  await assert.rejects(exists('sitemap-index.xml'));
}
for (const file of ['llms.txt', 'llms-full.txt', 'index.md', 'humans.txt']) {
  const body = await read(file);
  assert.ok(body.includes('KERABOSS') || body.includes('Keraboss'));
  assert.ok(!/localhost|example\.com|TODO/.test(body));
}
assert.ok((await read('llms-full.txt')).includes('info@keraboss.com'));
const security = await read('.well-known/security.txt');
assert.ok(security.includes('Contact: mailto:info@keraboss.com'));
assert.ok(security.includes(`Canonical: ${settings.origin}/.well-known/security.txt`));
const expires = Date.parse(security.match(/Expires: (.+)/)[1]);
assert.ok(expires > Date.now() && expires < Date.now() + 366 * 86400000);
assert.ok((await read('security.txt')).includes('Contact: mailto:info@keraboss.com'));
const manifest = JSON.parse(await read('site.webmanifest'));
assert.equal(manifest.lang, 'el');
assert.equal(manifest.start_url, '/');
for (const icon of manifest.icons) await exists(icon.src.slice(1));
for (const size of [192, 512]) {
  const image = await sharp(
    new URL(`../dist/icons/icon-${size}.png`, import.meta.url).pathname,
  ).metadata();
  assert.equal(image.width, size);
  assert.equal(image.height, size);
}
const sprite = await read('icons/sprite.svg');
for (const use of tags(html, 'use')) assert.ok(sprite.includes(`id="${use.href.split('#')[1]}"`));
const headers = await read('_headers');
assert.ok(headers.includes('X-Content-Type-Options: nosniff'));
assert.ok(headers.includes("Content-Security-Policy: frame-ancestors 'none'"));
assert.equal(headers.includes('X-Robots-Tag: noindex, nofollow'), !settings.indexable);
// Invalid domains / indexability flags should fail clearly rather than generating bad metadata.
assert.throws(() => resolveSiteSettings({ PUBLIC_SITE_URL: 'https://example.com/subpath' }));
assert.throws(() => resolveSiteSettings({ PUBLIC_INDEXABLE: 'yes' }));
console.log(
  `SEO verification passed: ${settings.indexable ? 'production / open crawling' : 'preview / noindex'}, ${settings.origin}`,
);
