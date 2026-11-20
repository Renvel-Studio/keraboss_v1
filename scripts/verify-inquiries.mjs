import assert from 'node:assert/strict';
import { createInquiryHandler, MAX_INQUIRY_BYTES } from '../src/lib/inquiries/handler.mjs';
import netlifyInquiry from '../netlify/functions/inquiries.mjs';

const origin = 'https://keraboss.com';
const endpoint = 'https://intake.example.test/keraboss';
const requestId = 'c9c3aadf-d065-47ea-a30c-6c5dc6b0b802';
const receipt = {
  acknowledged: true,
  requestId,
  receiptId: 'receipt-test-001',
  recordedAt: '2026-11-19T12:00:00Z',
};
const configuration = {
  PUBLIC_SITE_URL: origin,
  INQUIRY_WEBHOOK_URL: endpoint,
  INQUIRY_WEBHOOK_TOKEN: 'test-token-only',
};
const valid = {
  requestId,
  locale: 'en',
  name: 'Test Person',
  email: 'person@example.test',
  intent: 'quote',
  color: 'highway-yellow',
  roof: 'soft-top',
  message: 'A test enquiry only.',
  consent: 'yes',
  website: '',
};
const observed = [];
const transport = async (url, options) => {
  observed.push({ url, options, payload: JSON.parse(options.body) });
  return Response.json(receipt);
};
const handler = createInquiryHandler({ environment: configuration, transport });
const jsonRequest = (data = valid, headers = {}, method = 'POST') =>
  new Request(`${origin}/api/inquiries`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Origin: origin,
      ...headers,
    },
    ...(method === 'POST' ? { body: JSON.stringify(data) } : {}),
  });
const formRequest = (data = valid, headers = {}) =>
  new Request(`${origin}/api/inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: origin, ...headers },
    body: new URLSearchParams(data).toString(),
  });
let checks = 0;
const expectStatus = async (response, expected) => {
  assert.equal(response.status, expected);
  checks += 1;
  return response;
};

let response = await expectStatus(await handler(jsonRequest()), 200);
assert.deepEqual(await response.json(), {
  ok: true,
  requestId,
  receiptId: receipt.receiptId,
  recordedAt: receipt.recordedAt,
});
assert.equal(observed.length, 1);
assert.equal(observed[0].url, endpoint);
assert.equal(observed[0].options.headers['Idempotency-Key'], requestId);
assert.equal(observed[0].options.headers.Authorization, 'Bearer test-token-only');
assert.equal(observed[0].options.redirect, 'error');
assert.ok(observed[0].options.signal instanceof AbortSignal);
assert.equal(observed[0].payload.source, 'keraboss-web');
assert.ok(!Object.hasOwn(observed[0].payload, 'website'));
assert.equal(response.headers.get('Cache-Control'), 'no-store');

for (const patch of [
  { email: 'invalid' },
  { name: '' },
  { consent: '' },
  { intent: 'other' },
  { color: 'unverified-paint' },
  { roof: 'unverified-roof' },
  { website: 'bot.example.test' },
  { requestId: 'not-a-uuid' },
  { extra: 'not-allowed' },
  { name: 'Test\nInjected' },
  { message: 'x'.repeat(3001) },
  { locale: 'fr' },
  { name: ['unexpected', 'array'] },
]) {
  response = await expectStatus(await handler(jsonRequest({ ...valid, ...patch })), 400);
  assert.equal((await response.json()).ok, false);
}
assert.equal(observed.length, 1, 'Invalid enquiries must never reach the transport.');

for (const environment of [
  { PUBLIC_SITE_URL: origin },
  { ...configuration, INQUIRY_WEBHOOK_TOKEN: '' },
  { ...configuration, INQUIRY_WEBHOOK_URL: 'http://intake.example.test/' },
  { ...configuration, INQUIRY_WEBHOOK_URL: 'https://user:password@intake.example.test/' },
]) {
  response = await expectStatus(
    await createInquiryHandler({ environment, transport })(jsonRequest()),
    503,
  );
  assert.equal((await response.json()).ok, false);
}
assert.equal(observed.length, 1, 'Unconfigured transport must not run or produce success.');

for (const transportFailure of [
  async () => {
    throw new Error('Private upstream error must not be exposed.');
  },
  async () => new Response('Server error', { status: 500 }),
  async () => Response.json({ ...receipt, acknowledged: false }),
  async () => Response.json({ ...receipt, requestId: 'd9c3aadf-d065-47ea-a30c-6c5dc6b0b802' }),
  async () => Response.json({ ...receipt, receiptId: '' }),
  async () => Response.json({ ...receipt, recordedAt: 'not-a-date' }),
  async () => new Response('not-json'),
]) {
  response = await expectStatus(
    await createInquiryHandler({ environment: configuration, transport: transportFailure })(
      jsonRequest(),
    ),
    502,
  );
  const body = await response.text();
  assert.ok(!body.includes('Private upstream error'));
  assert.equal(JSON.parse(body).ok, false);
}

for (const headers of [
  { Origin: 'https://evil.example.test' },
  { Origin: 'null' },
  { Origin: '', Referer: '' },
]) {
  await expectStatus(await handler(jsonRequest(valid, headers)), 403);
}
await expectStatus(
  await handler(
    jsonRequest(valid, { Origin: '', Referer: `${origin}/${encodeURIComponent('επικοινωνία')}/` }),
  ),
  200,
);
await expectStatus(await handler(jsonRequest(valid, {}, 'GET')), 405);
response = await handler(jsonRequest(valid, {}, 'GET'));
assert.equal(response.headers.get('Allow'), 'POST');
await expectStatus(
  await netlifyInquiry(new Request(`${origin}/api/inquiries`, { method: 'GET' })),
  405,
);
await expectStatus(
  await handler(
    new Request(`${origin}/api/inquiries`, {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'text/plain', Accept: 'application/json' },
      body: 'test',
    }),
  ),
  415,
);
await expectStatus(
  await handler(
    new Request(`${origin}/api/inquiries`, {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: '{',
    }),
  ),
  400,
);
await expectStatus(
  await handler(
    new Request(`${origin}/api/inquiries`, {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: 'x'.repeat(MAX_INQUIRY_BYTES + 1),
    }),
  ),
  413,
);
await expectStatus(
  await handler(jsonRequest(valid, { 'Content-Length': String(MAX_INQUIRY_BYTES + 1) })),
  413,
);

response = await expectStatus(await handler(formRequest()), 200);
let html = await response.text();
assert.match(html, /<html lang="en">/);
assert.ok(html.includes(receipt.receiptId));
assert.ok(
  !html.includes(valid.name) && !html.includes(valid.email) && !html.includes(valid.message),
);
assert.ok(response.headers.get('Content-Security-Policy').includes("default-src 'none'"));
response = await expectStatus(
  await createInquiryHandler({ environment: {} })(formRequest({ ...valid, locale: 'el' })),
  503,
);
html = await response.text();
assert.match(html, /<html lang="el">/);
assert.ok(!html.includes(valid.email));
await expectStatus(
  await handler(
    new Request(`${origin}/api/inquiries`, {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `${new URLSearchParams(valid)}&email=duplicate%40example.test`,
    }),
  ),
  400,
);

let serverGeneratedId;
const noJs = createInquiryHandler({
  environment: configuration,
  generateId: () => requestId,
  transport: async (_url, options) => {
    serverGeneratedId = JSON.parse(options.body).requestId;
    return Response.json(receipt);
  },
});
await expectStatus(await noJs(formRequest({ ...valid, requestId: '' })), 200);
assert.equal(serverGeneratedId, requestId);

let backendRecords = 0;
const recorded = new Map();
const keys = [];
const durableMock = async (_url, options) => {
  const key = options.headers['Idempotency-Key'];
  keys.push(key);
  if (!recorded.has(key)) {
    recorded.set(key, receipt);
    backendRecords += 1;
  }
  return Response.json(recorded.get(key));
};
const idempotentHandler = createInquiryHandler({
  environment: configuration,
  transport: durableMock,
});
const first = await idempotentHandler(jsonRequest());
const second = await idempotentHandler(jsonRequest());
assert.equal(first.status, 200);
assert.equal(second.status, 200);
assert.deepEqual(await first.json(), await second.json());
assert.deepEqual(keys, [requestId, requestId]);
assert.equal(
  backendRecords,
  1,
  'The mock receiving system durably records a key once; the adapter does not claim durable storage.',
);
checks += 2;

const timeoutHandler = createInquiryHandler({
  environment: configuration,
  timeoutMs: 1,
  transport: async (_url, options) =>
    new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    }),
});
await expectStatus(await timeoutHandler(jsonRequest()), 502);

console.log(
  `Inquiry adapter verification passed: ${checks} status/receipt scenarios; no network calls or real messages sent. Durable deduplication is verified only in the injected receiving-system mock.`,
);
