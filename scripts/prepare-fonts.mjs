import { parseArgs } from 'node:util';
import { createHash } from 'node:crypto';
import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { create as readFont } from 'fontkitten';

const root = fileURLToPath(new URL('../', import.meta.url));
const { values } = parseArgs({
  options: {
    'inter-source': { type: 'string' },
    'noto-source': { type: 'string' },
  },
});
const families = [
  {
    id: 'inter',
    package: '@fontsource-variable/inter',
    version: '5.3.0',
    family: 'Inter Variable',
    css: 'opsz.css',
    suffix: 'opsz-normal',
    integrity:
      'sha512-OupL48va4JNofb97w6NYeF9S7W/kHNKM0Er8Dem5nqi4jeOLrVJDoE8tZEpnMJmtkvNbB1EIPPwHcdkF6b1oUA==',
    axes: ['opsz', 'wght'],
    source: values['inter-source'],
  },
  {
    id: 'noto-sans',
    package: '@fontsource-variable/noto-sans',
    version: '5.3.0',
    family: 'Noto Sans Variable',
    css: 'wght.css',
    suffix: 'wght-normal',
    integrity:
      'sha512-e3ZuxzY9AL2psXPZlhwhnYrHUHv6PMoyK9MQ7croF0CUgURLqu9EMjW7q2FgVLwij1tjLsIHQrnwQ8aUcg4BiA==',
    axes: ['wght'],
    source: values['noto-source'],
  },
];
const subsets = ['greek-ext', 'greek', 'latin-ext', 'latin'];
const samples = ['Διαμόρφωσε το δικό σου Super K', 'Μαΐου, προϊόν, ΐ, ΰ, Ἑλλάς', '1.250,50 €'];
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const sources = [];
const faces = [];
await mkdir(resolve(root, 'src/fonts/sources'), { recursive: true });

for (const definition of families) {
  const source = definition.source
    ? resolve(definition.source)
    : resolve(root, 'node_modules', definition.package);
  await access(resolve(source, 'package.json'));
  const packageJson = JSON.parse(await readFile(resolve(source, 'package.json'), 'utf8'));
  if (packageJson.name !== definition.package || packageJson.version !== definition.version) {
    throw new Error(
      `Expected ${definition.package}@${definition.version}, got ${packageJson.name}@${packageJson.version}.`,
    );
  }
  const upstreamCss = await readFile(resolve(source, definition.css), 'utf8');
  const license = await readFile(resolve(source, 'LICENSE'));
  const destination = resolve(root, 'public/fonts', definition.id);
  await mkdir(destination, { recursive: true });
  await writeFile(resolve(destination, 'OFL.txt'), license);
  await writeFile(
    resolve(root, `src/fonts/sources/${definition.id}-${definition.version}.css`),
    upstreamCss,
  );
  const familyManifest = {
    package: definition.package,
    version: definition.version,
    family: definition.family,
    sourceCss: definition.css,
    sourceCssSha256: sha256(upstreamCss),
    archiveIntegrity: definition.integrity,
    source: `https://registry.npmjs.org/${definition.package}/-/${definition.id}-${definition.version}.tgz`,
    license: 'OFL-1.1',
    licenseSha256: sha256(license),
    files: [],
    coverage: [],
  };
  const combinedCharacters = new Set();
  for (const subset of subsets) {
    const filename = `${definition.id}-${subset}-${definition.suffix}.woff2`;
    const sourcePath = resolve(source, 'files', filename);
    const face = [...upstreamCss.matchAll(/@font-face\s*\{([^}]+)\}/g)]
      .map((match) => match[1])
      .find((body) => body.includes(`/${filename}`));
    if (!face) throw new Error(`Cannot find source @font-face for ${filename}.`);
    const unicodeRange = face.match(/unicode-range:\s*([^;]+);/)?.[1];
    const weight = face.match(/font-weight:\s*([^;]+);/)?.[1];
    if (!unicodeRange || weight !== '100 900')
      throw new Error(`Unexpected font-face metadata in ${filename}.`);
    const buffer = await readFile(sourcePath);
    if (buffer.subarray(0, 4).toString() !== 'wOF2') throw new Error(`Not WOFF2: ${filename}.`);
    const font = readFont(buffer);
    const axes = font.variationAxes;
    for (const axis of definition.axes) {
      if (!axes[axis]) throw new Error(`Missing ${axis} axis in ${filename}.`);
    }
    if (axes.wght.min !== 100 || axes.wght.max !== 900)
      throw new Error(`Unexpected weight range: ${filename}.`);
    if (definition.id === 'inter' && (axes.opsz.min !== 14 || axes.opsz.max !== 32))
      throw new Error(`Unexpected optical size range: ${filename}.`);
    const characters = font.characterSet;
    characters.forEach((character) => combinedCharacters.add(character));
    await copyFile(sourcePath, resolve(destination, filename));
    familyManifest.files.push({
      filename,
      subset,
      bytes: buffer.length,
      sha256: sha256(buffer),
      unicodeRange,
      axes,
      characterCount: characters.length,
    });
    faces.push(
      `/* ${definition.package}@${definition.version} — ${subset}; ${definition.css} */\n@font-face {\n  font-family: '${definition.family}';\n  font-style: normal;\n  font-weight: ${weight};\n  font-display: swap;\n  src: url('/fonts/${definition.id}/${filename}') format('woff2');\n  unicode-range: ${unicodeRange};\n}`,
    );
  }
  for (const text of samples) {
    const missing = [...new Set([...text].map((character) => character.codePointAt(0)))].filter(
      (point) => !combinedCharacters.has(point),
    );
    if (missing.length)
      throw new Error(
        `${definition.family}: missing sample code points ${missing.map((point) => `U+${point.toString(16).toUpperCase()}`).join(', ')}.`,
      );
    familyManifest.coverage.push({ text, allCodePointsPresent: true });
  }
  sources.push(familyManifest);
}

await writeFile(
  resolve(root, 'src/fonts/index.css'),
  `/* Generated from pinned Fontsource CSS by scripts/prepare-fonts.mjs.\n   Files and OFL licenses are served locally from public/fonts/.\n   No preload: critical first-viewport subsets have not been measured yet. */\n\n${faces.join('\n\n')}\n`,
);
await writeFile(
  resolve(root, 'src/fonts/manifest.json'),
  JSON.stringify({ families: sources }, null, 2) + '\n',
);
console.log(
  'Prepared and verified 8 self-hosted WOFF2 files, their variable axes and required Greek / Latin sample coverage.',
);
