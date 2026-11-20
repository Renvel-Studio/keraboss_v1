import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/scripts/analytics.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const observed = [];
globalThis.window = { dispatchEvent: (event) => observed.push(event) };
globalThis.location = { pathname: '/super-k/' };
const { track } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
);
track('cta_click', { cta: 'model-to-contact' });
track('inquiry_confirmed', {});
track('inquiry_confirmed', { requestId: 'test-id' });
track('inquiry_confirmed', { requestId: 'test-id' });
track('cta_click', { cta: 'email', email: 'must-not-appear@example.test' });
assert.equal(observed.filter((event) => event.detail.name === 'inquiry_confirmed').length, 1);
assert.equal(observed.filter((event) => event.detail.name === 'cta_click').length, 2);
assert.ok(!JSON.stringify(observed.map(({ detail }) => detail)).includes('must-not-appear'));
assert.ok(observed.every((event) => event.type === 'keraboss:analytics'));
delete globalThis.window;
delete globalThis.location;
console.log(
  'Conversion event unit checks passed: CTA separate from confirmed receipt; duplicate confirmation suppressed; extra PII excluded. No collector or browser integration was tested.',
);
