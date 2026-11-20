import { canonicalUrl, site } from '@/config/site';
import evidence from '@/data/catalog-evidence.json';
import type { Locale } from '@/lib/content';

export type JsonLd = {
  [key: string]: string | number | boolean | null | JsonLd | readonly (string | number | JsonLd)[];
};

export interface Breadcrumb {
  name: string;
  path: string;
}

export function websiteSchema(
  path: string,
  title: string,
  description: string,
  locale: Locale = 'el',
): JsonLd[] {
  const home = canonicalUrl();
  const page = canonicalUrl(path);
  return [
    {
      '@type': 'Organization',
      '@id': `${home}#organization`,
      name: site.organizationName,
      alternateName: site.name,
      url: home,
      email: site.email,
      telephone: site.phone,
      address: {
        '@type': 'PostalAddress',
        ...site.address,
        streetAddress: evidence.company.streetAddress[locale],
        addressLocality: evidence.company.addressLocality[locale],
      },
      sameAs: site.social.map(({ url }) => url),
    },
    {
      '@type': 'WebSite',
      '@id': `${home}#website`,
      url: home,
      name: site.organizationName,
      inLanguage: ['el', 'en'],
      publisher: { '@id': `${home}#organization` },
    },
    {
      '@type': 'WebPage',
      '@id': `${page}#webpage`,
      url: page,
      name: title,
      description,
      inLanguage: locale,
      isPartOf: { '@id': `${home}#website` },
      about: { '@id': `${home}#organization` },
    },
  ];
}

export function breadcrumbSchema(items: readonly Breadcrumb[]): JsonLd {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${canonicalUrl(items[items.length - 1]!.path)}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}

/** Use only where the actual video is displayed with matching factual metadata. */
export function videoSchema(video: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  contentUrl?: string;
  embedUrl?: string;
  duration?: string;
  transcript?: string;
}): JsonLd {
  if (!video.contentUrl && !video.embedUrl)
    throw new Error('A video needs a contentUrl or embedUrl.');
  if (!/^\d{4}-\d{2}-\d{2}T/.test(video.uploadDate) || Number.isNaN(Date.parse(video.uploadDate))) {
    throw new Error('Video uploadDate must be a verified ISO 8601 datetime.');
  }
  return { '@type': 'VideoObject', ...video };
}
