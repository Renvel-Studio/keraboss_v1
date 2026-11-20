import assert from 'node:assert/strict';
import { readFile, readdir, writeFile, access, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { loadEnv } from 'vite';
import sharp from 'sharp';
import { routes, pageRoute, normalizedPath, markdownPath } from '../config/route-policy.mjs';
import { resolveSiteSettings } from '../config/site-settings.mjs';
import aliases from '../config/redirects.json' with { type: 'json' };
import evidence from '../src/data/catalog-evidence.json' with { type: 'json' };
import { inspectHtml, decode } from './lib/html.mjs';

const root = new URL('../', import.meta.url);
const settings = resolveSiteSettings({
  ...loadEnv('production', process.cwd(), ''),
  ...process.env,
});
const read = (path) => readFile(new URL(`dist/${path}`, root), 'utf8');
const pathFile = (path) => {
  const pathname = decodeURI(new URL(path, settings.origin).pathname);
  return pathname.endsWith('/') ? `${pathname.slice(1)}index.html` : pathname.slice(1);
};
const exists = (path) => access(new URL(`dist/${pathFile(path)}`, root));
const href = (path) => new URL(path, settings.origin).href;
const pages = new Map();
const titles = new Set();
const descriptions = new Set();
let references = 0;
const summaries = [];
for (const route of routes) {
  const source = await read(pathFile(route.path));
  const html = inspectHtml(source);
  pages.set(route.path, { source, html, route });
  const title = decode(html.text(html.elements('title')[0]));
  const description = html.meta('description');
  assert.equal(html.elements('title').length, 1, `${route.path}: title count`);
  assert.ok(!titles.has(title), `Duplicate title: ${title}`);
  titles.add(title);
  assert.ok(!descriptions.has(description), `Duplicate description: ${description}`);
  descriptions.add(description);
  assert.ok(description.length >= 50);
  assert.equal(html.elements('html')[0].attributes.lang, route.locale);
  assert.equal(html.elements('h1').length, 1, `${route.path}: H1 count`);
  assert.equal(html.link('canonical').length, 1);
  assert.equal(decode(html.link('canonical')[0].attributes.href), href(route.path));
  assert.equal(html.meta('og:url'), href(route.path));
  assert.equal(html.meta('og:title'), title);
  assert.equal(html.meta('og:description'), description);
  assert.equal(html.meta('og:locale'), route.locale === 'el' ? 'el_GR' : 'en_GB');
  assert.equal(html.meta('twitter:card'), 'summary_large_image');
  assert.match(
    html.meta('robots'),
    settings.indexable ? /^index, follow, max-image-preview:large/ : /^noindex/,
  );
  assert.equal(new URL(html.meta('og:image')).origin, settings.origin);
  await exists(html.meta('og:image'));
  const image = await sharp(
    new URL(`dist/${pathFile(html.meta('og:image'))}`, root).pathname,
  ).metadata();
  assert.equal(image.width, Number(html.meta('og:image:width')));
  assert.equal(image.height, Number(html.meta('og:image:height')));
  assert.ok(image.width >= 1200);
  const alternates = html.link('alternate').filter((node) => node.attributes.hreflang);
  assert.equal(alternates.length, 3);
  for (const locale of ['el', 'en', 'x-default']) {
    const target = pageRoute(route.key, locale === 'x-default' ? 'el' : locale).path;
    assert.equal(
      decode(alternates.find((node) => node.attributes.hreflang === locale)?.attributes.href),
      href(target),
    );
  }
  const graphNode = html
    .elements('script')
    .find((node) => node.attributes.type === 'application/ld+json');
  const json = html.text(graphNode);
  const graph = JSON.parse(json);
  assert.equal(graph['@context'], 'https://schema.org');
  assert.ok(Array.isArray(graph['@graph']));
  const nodes = graph['@graph'];
  const nodeIds = nodes.filter((node) => node['@id']).map((node) => node['@id']);
  assert.equal(new Set(nodeIds).size, nodeIds.length);
  for (const type of ['Organization', 'WebSite', 'WebPage'])
    assert.ok(nodes.some((node) => node['@type'] === type));
  const organization = nodes.find((node) => node['@type'] === 'Organization');
  assert.equal(organization['@id'], `${settings.origin}/#organization`);
  assert.deepEqual(
    organization.sameAs,
    evidence.company.social.map((profile) => profile.url),
  );
  assert.ok(
    !/"(?:Offer|AggregateOffer|ProductGroup|VideoObject|Review|AggregateRating)"/.test(json),
  );
  if (route.key !== 'home') assert.ok(nodes.some((node) => node['@type'] === 'BreadcrumbList'));
  if (['model', 'specs'].includes(route.key)) {
    const car = nodes.find((node) => node['@type'] === 'Car');
    assert.equal(car['@id'], `${settings.origin}/#super-k`);
    assert.equal(car.additionalProperty.length, route.key === 'model' ? 4 : 15);
    for (const property of car.additionalProperty) {
      assert.ok(
        decode(source).includes(property.name),
        `${route.path}: schema property not visibly labelled`,
      );
      assert.ok(decode(source).includes(property.value), `${route.path}: schema value not visible`);
    }
    assert.equal(nodes.find((node) => node['@type'] === 'WebPage').mainEntity['@id'], car['@id']);
  }
  const csp = html
    .elements('meta')
    .find((node) => node.attributes['http-equiv']?.toLowerCase() === 'content-security-policy');
  const policy = decode(csp?.attributes.content);
  assert.ok(policy.includes("font-src 'self'"));
  assert.ok(!policy.includes("'unsafe-eval'") && !policy.includes("'unsafe-inline'"));
  for (const script of html.elements('script').filter((node) => !node.attributes.src)) {
    assert.ok(
      policy.includes(`sha256-${createHash('sha256').update(html.text(script)).digest('base64')}`),
      `${route.path}: inline script hash missing`,
    );
  }
  const firstImage = html.elements('img')[0];
  assert.equal(firstImage.attributes.loading, 'eager');
  assert.equal(firstImage.attributes.fetchpriority, 'high');
  assert.ok(Number(firstImage.attributes.width) > 0 && Number(firstImage.attributes.height) > 0);
  assert.ok(firstImage.attributes.sizes && firstImage.attributes.srcset.includes('480w'));
  assert.ok(!/<[^>]+style="[^"]*\dpx\b/.test(source));
  const initialScripts = html.elements('script').filter((node) => node.attributes.src);
  let initialJsBytes = html
    .elements('script')
    .filter((node) => node.attributes.type === 'module' && !node.attributes.src)
    .reduce((bytes, node) => bytes + Buffer.byteLength(html.text(node)), 0);
  const moduleQueue = initialScripts.map(
    (script) => new URL(script.attributes.src, settings.origin),
  );
  const loadedModules = new Set();
  while (moduleQueue.length) {
    const module = moduleQueue.shift();
    if (loadedModules.has(module.href)) continue;
    loadedModules.add(module.href);
    await exists(module.href);
    const content = await read(pathFile(module.href));
    initialJsBytes += Buffer.byteLength(content);
    for (const match of content.matchAll(/\b(?:from\s*|import\s*)["']([^"']+\.js)["']/g))
      moduleQueue.push(new URL(match[1], module));
    assert.ok(
      !content.includes('ScrollTrigger') && !content.includes('new Lenis'),
      'Motion must not be in baseline public JS.',
    );
  }
  assert.ok(initialJsBytes < 12000, `${route.path}: initial JavaScript budget exceeded`);
  const md = await read(pathFile(markdownPath(route.path)));
  assert.ok(md.includes(`# ${decode(html.text(html.elements('h1')[0]))}`));
  assert.ok(md.includes(`Canonical: ${href(route.path)}`));
  assert.ok(!/requires-owner-confirmation|stableManufacturerId|republishingRights/.test(md));
  summaries.push({
    path: route.path,
    locale: route.locale,
    title,
    canonical: href(route.path),
    indexable: settings.indexable,
    translationPair: pageRoute(route.key, route.locale === 'el' ? 'en' : 'el').path,
    initialJsBytes,
    htmlGzipBytes: gzipSync(source).length,
    markdown: true,
    jsonLd: 'structurally checked; online Schema.org/Rich Results validation not run',
    lcpCandidate: 'eager image with dimensions and responsive sources',
  });
}
// Link / fragment validation uses only generated local resources, not speculative live HTTP.
const edges = new Map(routes.map((route) => [route.path, new Set()]));
for (const [path, { html }] of pages) {
  for (const node of html.all) {
    const raw = node.attributes.href ?? node.attributes.src;
    if (!raw || /^(mailto:|tel:|data:)/.test(raw)) continue;
    const target = new URL(decode(raw), href(path));
    if (target.origin !== settings.origin) continue;
    if (target.pathname === '/api/inquiries') continue;
    await exists(target.href);
    references++;
    const targetPath = normalizedPath(target.pathname);
    if (pages.has(targetPath) && node.name === 'a') edges.get(path).add(targetPath);
    if (target.hash) {
      if (target.pathname.endsWith('.svg')) {
        assert.ok(
          (await read(pathFile(target.href))).includes(
            `id="${decodeURIComponent(target.hash.slice(1))}"`,
          ),
        );
      } else if (pages.has(targetPath)) {
        assert.ok(
          pages
            .get(targetPath)
            .html.all.some(
              (node) => node.attributes.id === decodeURIComponent(target.hash.slice(1)),
            ),
          `Missing fragment ${target.href}`,
        );
      }
    }
  }
}
const visited = new Set();
const queue = ['/'];
while (queue.length) {
  const path = queue.shift();
  if (visited.has(path)) continue;
  visited.add(path);
  queue.push(...edges.get(path));
}
assert.equal(visited.size, routes.length, 'Orphan public routes exist.');
for (const page of ['design-system/index.html', '404.html'])
  assert.match(inspectHtml(await read(page)).meta('robots'), /^noindex/);
const sitemapExists = await access(new URL('dist/sitemap-index.xml', root)).then(
  () => true,
  () => false,
);
assert.equal(sitemapExists, settings.indexable);
if (settings.indexable) {
  const sitemap = await read('sitemap-0.xml');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => decode(match[1]))
    .sort();
  assert.deepEqual(
    urls,
    routes
      .filter(({ indexable }) => indexable)
      .map(({ path }) => href(path))
      .sort(),
  );
  assert.equal((sitemap.match(/<lastmod>/g) || []).length, routes.length);
}
const robots = await read('robots.txt');
if (settings.indexable) {
  assert.match(robots, /User-agent: \*\nAllow: \//);
  assert.ok(
    robots.includes(`User-agent: GPTBot\n${settings.gptBotAllowed ? 'Allow' : 'Disallow'}: /`),
  );
  assert.ok(robots.includes(`Sitemap: ${settings.origin}/sitemap-index.xml`));
} else assert.match(robots, /User-agent: \*\nDisallow: \//);
const headers = await read('_headers');
assert.equal(headers.includes('X-Robots-Tag: noindex, nofollow'), !settings.indexable);
assert.ok(headers.includes("Content-Security-Policy: frame-ancestors 'none'"));
const redirects = (await read('_redirects'))
  .trim()
  .split('\n')
  .map((line) => {
    const [from, to, status] = line.split(' ');
    return { from: decodeURI(from), to: decodeURI(to), status };
  });
for (const redirect of redirects) {
  assert.equal(redirect.status, '301!');
  const destination = new URL(redirect.to, settings.origin);
  assert.equal(destination.origin, settings.origin);
  assert.ok(pages.has(decodeURI(destination.pathname)));
  assert.ok(!redirects.some(({ from }) => from === redirect.to));
  assert.ok(!redirect.from.includes('*'));
}
for (const alias of aliases)
  assert.ok(redirects.some(({ from, to }) => from === alias.from && to === alias.to));
for (const file of ['llms.txt', 'llms-full.txt']) {
  const content = await read(file);
  for (const route of routes)
    assert.ok(content.includes(href(route.path)), `${file}: missing canonical`);
  assert.ok(!content.includes('requires-owner-confirmation'));
}
const security = await read('.well-known/security.txt');
assert.match(security, /Contact: mailto:info@keraboss.com/);
assert.ok(Date.parse(security.match(/Expires: (.+)/)[1]) > Date.now());
const manifest = JSON.parse(await read('site.webmanifest'));
for (const icon of manifest.icons) await exists(icon.src);
await exists('/favicon.svg');
await exists('/humans.txt');
const legacy = JSON.parse(await readFile(new URL('docs/legacy-url-inventory.json', root), 'utf8'));
const migration = legacy.urls.map((entry) => ({
  ...entry,
  newBuildStatus: pages.has(entry.decodedPath)
    ? 'preserved-static-content'
    : 'unresolved-before-cutover',
  newDestination: pages.has(entry.decodedPath) ? entry.decodedPath : null,
}));
const unresolved = migration.filter((entry) => entry.newBuildStatus.startsWith('unresolved'));
await writeFile(
  new URL('docs/migration-status.json', root),
  JSON.stringify(
    { scope: legacy.scope, items: migration, unresolvedCount: unresolved.length },
    null,
    2,
  ) + '\n',
);
const report = {
  scope: 'Generated build and files only. No production/live HTTP/browser/RUM claims.',
  mode: settings.indexable ? 'production' : 'preview',
  origin: settings.origin,
  publicRoutes: routes.length,
  routeChecks: summaries,
  localReferencesChecked: references,
  brokenLocalReferences: 0,
  orphanPublicPages: 0,
  duplicateTitles: 0,
  duplicateDescriptions: 0,
  redirectRules: redirects.length,
  redirectChains: 0,
  legacyDiscovered: legacy.urls.length,
  legacyPreserved: migration.length - unresolved.length,
  legacyUnresolved: unresolved.length,
  googleProductRichResults:
    'Not eligible: no verified Offer/review/aggregateRating is published; no fake data added.',
  schemaOrgValidation:
    'JSON parsing, expected types/IDs and visible-data consistency checked locally; external vocabulary validator not run.',
  productionChecks:
    'Requires deployment, access to CDN/WAF, Search Console and Bing Webmaster Tools.',
  performance:
    'Initial JS and compressed HTML size budgets only; no measured lab CWV or p75 field data.',
};
await writeFile(new URL('docs/build-audit.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(
  `Build audit passed: ${routes.length} public pages, ${references} local references, reciprocal hreflang, zero broken/orphan/duplicate routes. ${unresolved.length} legacy URLs remain cutover blockers. Mode: ${report.mode}.`,
);
