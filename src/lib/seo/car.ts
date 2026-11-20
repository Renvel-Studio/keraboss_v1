import { canonicalUrl, site } from '@/config/site';
import type { Locale } from '@/lib/content';
import { localizedValue, publicContent } from '@/lib/content';
import type { JsonLd } from './schema';
import { pageRoute } from '../../../config/route-policy.mjs';

export async function carSchema(locale: Locale, includeAllSpecifications = false): Promise<JsonLd> {
  const data = await publicContent();
  return {
    '@type': 'Car',
    '@id': `${canonicalUrl()}#super-k`,
    name: `${site.name} ${data.vehicle.name}`,
    model: data.vehicle.name,
    brand: { '@type': 'Brand', name: data.vehicle.brand },
    manufacturer: { '@id': `${canonicalUrl()}#organization` },
    url: canonicalUrl(pageRoute('model', locale).path),
    image: canonicalUrl(site.defaultImage.src),
    description: data.claims.find(({ id }) => id === 'identity')!.data.text[locale],
    additionalProperty: data.specifications
      .filter(
        ({ id }) =>
          includeAllSpecifications ||
          ['seats', 'engine-displacement', 'engine-power', 'transmission'].includes(id),
      )
      .map(({ data: specification }) => ({
        '@type': 'PropertyValue',
        name: specification.label[locale],
        value: localizedValue(specification.value, locale),
        ...(specification.unit ? { unitText: specification.unit } : {}),
      })),
  };
}
