import { parse, walkSync } from 'ultrahtml';
export const decode = (value = '') =>
  value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, (entity) => {
    const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' };
    if (named[entity]) return named[entity];
    if (entity.startsWith('&#x')) return String.fromCodePoint(parseInt(entity.slice(3, -1), 16));
    return String.fromCodePoint(parseInt(entity.slice(2, -1), 10));
  });
export function inspectHtml(source) {
  const document = parse(source);
  const all = [];
  walkSync(document, (node) => {
    if (node.type === 1) all.push(node);
  });
  const elements = (name) => all.filter((node) => node.name === name);
  const text = (node) =>
    node?.type === 2 ? node.value : (node?.children ?? []).map(text).join('');
  const meta = (name) =>
    decode(
      elements('meta').find(
        (node) => node.attributes.name === name || node.attributes.property === name,
      )?.attributes.content,
    );
  const link = (rel) => elements('link').filter((node) => node.attributes.rel === rel);
  return { all, elements, text, meta, link };
}
