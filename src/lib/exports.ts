import { getCollection } from 'astro:content';
import { canonicalUrl } from '@/config/site';
import { publicContent, localizedValue, type PublicPage } from './content';
import { pageRoute, markdownPath } from '../../config/route-policy.mjs';

export async function pageMarkdown(page: PublicPage): Promise<string> {
  const { locale, key } = page.data;
  const data = await publicContent();
  const pages = await getCollection('pages');
  const paragraphs = [`# ${page.data.heading}`, page.data.intro];
  for (const section of page.data.sections) {
    paragraphs.push(`## ${section.heading}`);
    paragraphs.push(
      ...section.claimIds.map(
        (id) => data.claims.find((claim) => claim.id === id)!.data.text[locale],
      ),
    );
    paragraphs.push(...section.paragraphs);
    for (const link of section.links) {
      const target = pages.find(({ data }) => data.key === link && data.locale === locale)!;
      paragraphs.push(`- [${target.data.heading}](${canonicalUrl(pageRoute(link, locale).path)})`);
    }
  }
  if (key === 'specs' || key === 'model') {
    const specs =
      key === 'specs'
        ? data.specifications
        : data.specifications.filter(({ id }) =>
            ['seats', 'engine-displacement', 'engine-power', 'transmission'].includes(id),
          );
    paragraphs.push(
      ...specs.map(
        ({ data: spec }) =>
          `- ${spec.label[locale]}: ${localizedValue(spec.value, locale)}${spec.unit ? ` ${spec.unit}` : ''}`,
      ),
    );
    paragraphs.push(
      locale === 'el'
        ? 'Δημοσιευμένα εταιρικά στοιχεία. Επιβεβαίωσε την τελική διαμόρφωση με την Keraboss.'
        : 'Published company specifications. Confirm the final configuration with Keraboss.',
    );
  }
  if (key === 'configurator') {
    paragraphs.push(...data.paints.map(({ data: paint }) => `- ${paint.label[locale]}`));
    paragraphs.push('Hard Top / Soft Top');
  }
  if (key === 'press')
    paragraphs.push(
      ...data.press.map(
        ({ data: item }) =>
          `- [${item.title}](${item.url}) — ${item.publisher}, ${item.publishedDate}, ${item.author}`,
      ),
    );
  paragraphs.push(`## ${locale === 'el' ? 'Επικοινωνία' : 'Contact'}`);
  paragraphs.push(
    `${data.company.name}\n${data.company.streetAddress[locale]}, ${data.company.postalCode} ${data.company.addressLocality[locale]}\n${data.company.telephone}\n${data.company.email}`,
  );
  paragraphs.push(
    ...data.company.social.map(
      (profile) => `- [${profile.name} — ${profile.handle}](${profile.url})`,
    ),
  );
  paragraphs.push(`Canonical: ${canonicalUrl(pageRoute(key, locale).path)}`);
  return paragraphs.join('\n\n') + '\n';
}

export async function llmsIndex(): Promise<string> {
  const pages = await getCollection('pages');
  return `# KERABOSS SUPER K\n\n> Hand-built Greek passenger car by Keraboss Cars Manufacturing.\n\nPublic content is available in Greek and English.\n\n## Canonical pages\n\n${pages.map((page) => `- [${page.data.title}](${canonicalUrl(pageRoute(page.data.key, page.data.locale).path)}): ${page.data.description}\n  Markdown: ${canonicalUrl(markdownPath(pageRoute(page.data.key, page.data.locale).path))}`).join('\n')}\n\n## Consolidated content\n\n- [Full public content](${canonicalUrl('/llms-full.txt')})\n`;
}

export async function llmsFull(): Promise<string> {
  return (await Promise.all((await getCollection('pages')).map(pageMarkdown))).join('\n---\n\n');
}
