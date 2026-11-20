import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInquiryHandler } from '../../src/lib/inquiries/handler.mjs';

const directory = resolve(fileURLToPath(new URL('../../dist/', import.meta.url)));
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};
const glob = (pattern, path) =>
  new RegExp(
    `^${pattern
      .split('*')
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*')}$`,
  ).test(path);

/** Local contract adapter for generated static host files; it is not a Netlify runtime emulator. */
export async function createStaticHandler() {
  const redirectLines = (await readFile(resolve(directory, '_redirects'), 'utf8'))
    .trim()
    .split('\n');
  const rules = redirectLines.map((line) => {
    const [from, to, status] = line.split(' ');
    return { from: decodeURI(from), to, status: Number(status.replace('!', '')) };
  });
  const headerBlocks = [];
  let current;
  for (const line of (await readFile(resolve(directory, '_headers'), 'utf8')).split('\n')) {
    if (!line.trim()) continue;
    if (!line.startsWith(' ')) {
      current = { pattern: line, headers: [] };
      headerBlocks.push(current);
    } else {
      const entry = line.trim();
      const colon = entry.indexOf(':');
      current.headers.push([entry.slice(0, colon), entry.slice(colon + 1).trim()]);
    }
  }
  const inquiry = createInquiryHandler({
    environment: { PUBLIC_SITE_URL: 'https://keraboss.com' },
  });
  return async (request) => {
    const url = new URL(request.url);
    let path;
    try {
      path = decodeURI(url.pathname);
    } catch {
      return new Response('Bad request', { status: 400 });
    }
    if (path === '/api/inquiries') return inquiry(request);
    const rule = rules.find(({ from }) => from === path || from === `${url.origin}${path}`);
    if (rule) return new Response(null, { status: rule.status, headers: { Location: rule.to } });
    if (!['GET', 'HEAD'].includes(request.method))
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    let file = resolve(directory, `.${path.endsWith('/') ? `${path}index.html` : path}`);
    if (!file.startsWith(directory + sep)) return new Response('Not found', { status: 404 });
    let status = 200;
    let bytes;
    try {
      bytes = await readFile(file);
    } catch {
      status = 404;
      file = resolve(directory, '404.html');
      bytes = await readFile(file);
    }
    const headers = new Headers({
      'Content-Type': mime[extname(file)] ?? 'application/octet-stream',
    });
    for (const block of headerBlocks)
      if (glob(block.pattern, path))
        for (const [name, value] of block.headers) headers.set(name, value);
    return new Response(request.method === 'HEAD' ? null : bytes, { status, headers });
  };
}
