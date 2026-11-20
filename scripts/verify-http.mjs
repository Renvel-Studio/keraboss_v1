import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { createStaticHandler } from './lib/static-site.mjs';
import { routes } from '../config/route-policy.mjs';
const root = new URL('../', import.meta.url);
const handler = await createStaticHandler();
const observations = [];
async function verify(request, response, transport) {
  const path = decodeURI(new URL(request.url).pathname);
  const route = routes.find((route) => route.path === path);
  if (route) {
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^text\/html/);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  }
  if (path === '/missing-audit-page/') assert.equal(response.status, 404);
  if (path === '/en/') {
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), encodeURI('/en/αρχική-σελίδα-english/'));
  }
  if (path === '/api/inquiries') assert.equal(response.status, 405);
  observations.push({ path, status: response.status, transport });
}
const paths = [
  ...routes.map(({ path }) => path),
  '/missing-audit-page/',
  '/en/',
  '/.well-known/security.txt',
  '/site.webmanifest',
  '/robots.txt',
  '/api/inquiries',
];
for (const path of paths) {
  const request = new Request(`https://keraboss.com${path}`);
  await verify(
    request,
    await handler(request),
    'in-process Request/Response contract; not an HTTP socket',
  );
}
const redirectRules = (await readFile(new URL('dist/_redirects', root), 'utf8')).trim().split('\n');
for (const line of redirectRules) {
  const [from, to] = line.split(' ');
  const request = new Request(new URL(from, 'https://keraboss.com'));
  const redirected = await handler(request);
  assert.equal(redirected.status, 301);
  assert.equal(redirected.headers.get('location'), to);
  const destination = new Request(new URL(to, request.url));
  assert.equal(
    (await handler(destination)).status,
    200,
    'Redirect must reach a final page in one hop.',
  );
}
// Actual HTTP is attempted separately so unavailable sockets never become a passing measurement.
const server = createServer(async (request, response) => {
  try {
    const result = await handler(
      new Request(`http://127.0.0.1${request.url}`, {
        method: request.method,
        headers: request.headers,
      }),
    );
    response.writeHead(result.status, Object.fromEntries(result.headers));
    response.end(Buffer.from(await result.arrayBuffer()));
  } catch {
    response.writeHead(500);
    response.end('Internal error');
  }
});
try {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  for (const path of paths) {
    const request = new Request(`http://127.0.0.1:${address.port}${path}`);
    await verify(
      request,
      await fetch(request, { redirect: 'manual' }),
      'actual local HTTP; generated-files adapter',
    );
  }
  for (const agent of ['Googlebot', 'Bingbot', 'OAI-SearchBot']) {
    const response = await fetch(`http://127.0.0.1:${address.port}/super-k/`, {
      headers: { 'User-Agent': agent },
    });
    assert.equal(response.status, 200);
  }
  await writeFile(
    new URL('docs/http-audit.json', root),
    JSON.stringify(
      {
        status: 'verified-local-http-adapter',
        observations,
        redirectContracts: redirectRules.length,
        scope:
          'Local generated-files adapter only. Production CDN, hosting redirects, WAF and bot IP access are not tested.',
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    `Local HTTP adapter checks passed: ${observations.length} observations. Production hosting remains unverified.`,
  );
} catch (error) {
  await writeFile(
    new URL('docs/http-audit.json', root),
    JSON.stringify(
      {
        status: 'requires-external-access',
        reason: error.code ?? error.message,
        observations,
        redirectContracts: redirectRules.length,
        scope:
          'In-process Request/Response contracts passed; actual HTTP binding was unavailable. No production or browser verification.',
      },
      null,
      2,
    ) + '\n',
  );
  console.error(
    `Actual local HTTP verification unavailable: ${error.code ?? error.message}. ${observations.length} in-process contracts passed.`,
  );
  process.exitCode = 2;
} finally {
  if (server.listening) await new Promise((resolve) => server.close(resolve));
}
