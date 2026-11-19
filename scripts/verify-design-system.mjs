import assert from 'node:assert/strict';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { create as readFont } from 'fontkitten';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const filesUnder = async (path) =>
  (await readdir(new URL(path, root), { recursive: true })).filter((path) => path.endsWith('.css'));
const authoredPaths = (await filesUnder('src/styles/'))
  .map((path) => `src/styles/${path}`)
  .concat('src/fonts/index.css');
const authored = await Promise.all(authoredPaths.map(async (path) => [path, await read(path)]));
for (const [path, source] of authored) {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/[\d.]px\b/i.test(css), `Physical pixel unit in ${path}`);
  assert.ok(
    !/(?:^|[;{}])\s*(?:width|height|min-width|max-width|min-height|max-height|top|right|bottom|left|padding|margin|border|border-color|border-radius|padding-(?:top|right|bottom|left)|margin-(?:top|right|bottom|left)|border-(?:top|right|bottom|left)(?:-width|-color|-style)?):/m.test(
      css,
    ),
    `Non-logical box declaration in ${path}`,
  );
  if (!path.includes('primitives.css'))
    assert.ok(!/#[a-f\d]{3,8}\b/i.test(css), `Raw color outside primitive layer: ${path}`);
  assert.ok(
    !/transition:\s*all|transition-property:\s*all/.test(css),
    `Unbounded transition in ${path}`,
  );
}

const primitives = await read('src/styles/tokens/primitives.css');
const expected = {
  white: '#FFFFFF',
  yellow: '#FFCC00',
  'yellow-hover': '#E6B800',
  'desert-sand': '#E9DFCD',
  'light-sand': '#F7F4ED',
  carbon: '#141414',
  stone: '#5C584F',
  'sand-border': '#D8CEBD',
  'control-border': '#746D60',
  'success-text': '#1D633E',
  'success-surface': '#E7F3EA',
  'error-text': '#A22B30',
  'error-surface': '#FBEAEC',
};
for (const [name, value] of Object.entries(expected))
  assert.ok(new RegExp(`--primitive-${name}:\\s*${value};`, 'i').test(primitives));
const semantic = await read('src/styles/tokens/semantic.css');
for (const [name, value] of [
  ['subtle', '0.0625'],
  ['default', '0.0625'],
  ['strong', '0.125'],
]) {
  assert.ok(semantic.includes(`--border-width-${name}: ${value}rem;`));
}
const components = await read('src/styles/primary/components.css');
assert.ok(
  components.includes('var(--control-state-inset)'),
  'State strengthening must preserve control box metrics.',
);
assert.ok(components.includes('input:checked') && components.includes('choice-check'));
assert.ok(
  (await read('src/styles/primary/layout.css')).includes(
    '--focus-outline: var(--focus-width) solid var(--focus-color)',
  ),
);

const luminance = (hex) => {
  const channels = hex
    .slice(1)
    .match(/../g)
    .map((value) => parseInt(value, 16) / 255)
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};
const contrast = (front, back) => {
  const [a, b] = [luminance(expected[front]), luminance(expected[back])];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
const contrastChecks = [];
for (const background of ['white', 'light-sand', 'desert-sand']) {
  for (const foreground of ['carbon', 'stone', 'error-text', 'success-text'])
    contrastChecks.push([foreground, background, 4.5, 'text']);
  contrastChecks.push(['control-border', background, 3, 'control boundary']);
  contrastChecks.push(['carbon', background, 3, 'focus / selection']);
}
contrastChecks.push(
  ['carbon', 'yellow', 4.5, 'primary label'],
  ['carbon', 'yellow-hover', 4.5, 'primary hover label'],
  ['white', 'carbon', 4.5, 'inverse text'],
  ['white', 'stone', 4.5, 'secondary action hover label'],
  ['desert-sand', 'carbon', 4.5, 'inverse secondary'],
  ['yellow', 'carbon', 3, 'inverse focus'],
  ['success-text', 'success-surface', 4.5, 'success'],
  ['error-text', 'error-surface', 4.5, 'error'],
);
const contrasts = contrastChecks.map(([foreground, background, minimum, usage]) => {
  const actual = contrast(foreground, background);
  assert.ok(actual >= minimum, `${foreground} on ${background}: ${actual} fails ${minimum}`);
  return { foreground, background, usage, ratio: Number(actual.toFixed(4)), minimum, pass: true };
});
assert.ok(
  contrast('sand-border', 'white') < 3,
  'Subtle borders are decorative and must not be used as control boundaries.',
);

const typeSource = await read('src/styles/tokens/typography.css');
const roles = [
  'display-hero',
  'display',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'lead',
  'body',
  'label',
  'caption',
  'micro',
];
const clampSizes = [
  ...typeSource.matchAll(
    /--type-([\w-]+)-size:\s*clamp\(([\d.]+)rem,\s*calc\(([\d.]+)rem \+ ([\d.]+)vw\),\s*([\d.]+)rem\)/g,
  ),
];
for (const role of roles) {
  for (const property of ['family', 'weight', 'size', 'tracking', 'leading'])
    assert.ok(typeSource.includes(`--type-${role}-${property}:`));
  assert.ok(
    clampSizes.some((match) => match[1] === role),
    `Role ${role} needs a rem/vw clamp.`,
  );
}
const viewportRems = [20, 30, 48, 64, 90, 120, 160, 200];
const scales = [];
for (const match of clampSizes) {
  const [, role, minimum, base, coefficient, maximum] = match;
  assert.ok(Number(minimum) < Number(maximum));
  for (const rootSize of [16, 20, 32]) {
    let previous = 0;
    for (const viewport of viewportRems) {
      const size = Math.min(
        Number(maximum) * rootSize,
        Math.max(
          Number(minimum) * rootSize,
          Number(base) * rootSize + (Number(coefficient) * viewport * rootSize) / 100,
        ),
      );
      assert.ok(size >= previous);
      previous = size;
      scales.push({
        role,
        rootSize,
        viewportRem: viewport,
        sizeRem: Number((size / rootSize).toFixed(4)),
      });
    }
  }
}

const manifest = JSON.parse(await read('src/fonts/manifest.json'));
assert.equal(manifest.families.length, 2);
for (const family of manifest.families) {
  assert.equal(family.version, '5.3.0');
  assert.deepEqual(family.files.map((file) => file.subset).sort(), [
    'greek',
    'greek-ext',
    'latin',
    'latin-ext',
  ]);
  const characters = new Set();
  for (const file of family.files) {
    const bytes = await readFile(
      new URL(`public/fonts/${family.package.split('/')[1]}/${file.filename}`, root),
    );
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
    const font = readFont(bytes);
    assert.equal(font.variationAxes.wght.min, 100);
    assert.equal(font.variationAxes.wght.max, 900);
    if (family.family === 'Inter Variable') assert.ok(font.variationAxes.opsz);
    font.characterSet.forEach((point) => characters.add(point));
  }
  for (const sample of [
    'Διαμόρφωσε το δικό σου Super K',
    'Μαΐου, προϊόν, ΐ, ΰ, Ἑλλάς',
    '1.250,50 €',
  ]) {
    for (const character of sample)
      assert.ok(characters.has(character.codePointAt(0)), `${family.family}: missing ${character}`);
  }
  await access(new URL(`public/fonts/${family.package.split('/')[1]}/OFL.txt`, root));
}
const faces = await read('src/fonts/index.css');
assert.equal((faces.match(/@font-face/g) || []).length, 8);
assert.equal((faces.match(/font-display: swap/g) || []).length, 8);
const html = await read('dist/design-system/index.html');
assert.match(html, /name="robots" content="noindex, follow"/);
assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert.ok(!/<[^>]*style="[^"]*\dpx/i.test(html));
assert.ok(
  !/<link[^>]*rel="preload"[^>]*as="font"/.test(html),
  'No preload without first-viewport browser evidence.',
);
assert.ok(html.includes('aria-current="location"') && html.includes('aria-invalid="true"'));
assert.equal((html.match(/type="radio"/g) || []).length, 3);
for (const preset of ['reveal', 'shift', 'exit', 'bounce'])
  assert.ok(html.includes(`data-motion-demo="${preset}"`));
for (const [, source] of authored)
  assert.ok(
    !/overflow-x:\s*hidden/.test(source),
    'Do not hide layout overflow to conceal failures.',
  );
const motion = await read('src/styles/primary/motion.css');
assert.ok(motion.includes('(hover: hover) and (pointer: fine)'));
assert.ok(motion.includes('(prefers-reduced-motion: reduce)'));
assert.ok(!motion.includes('infinite'));

const result = {
  scope:
    'Static, asset and mathematical verification only. This does not certify browser layout, actual rendered fonts, zoom, touch or hover.',
  cssFilesChecked: authoredPaths,
  forbiddenPixels: 0,
  physicalBoxDeclarations: 0,
  contrastResults: contrasts,
  fluidProbeResults: scales,
  fontFamilies: manifest.families.map((family) => ({
    name: family.family,
    version: family.version,
    files: family.files.length,
    requiredSamplesCovered: true,
  })),
  browserVerification:
    'Not run: Vite preview failed with local EPERM, static HTTP server bind was denied with Operation not permitted, and browser automation host was unavailable.',
};
await writeFile(
  new URL('docs/design-system-checks.json', root),
  JSON.stringify(result, null, 2) + '\n',
);
console.log(
  `Design system checks passed: ${authored.length} CSS files, ${contrasts.length} contrast pairs, ${scales.length} fluid probes, eight verified WOFF2 assets. Browser checks remain unverified.`,
);
