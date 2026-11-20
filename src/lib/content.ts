import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { locales } from '../../config/route-policy.mjs';

export type Locale = (typeof locales)[number];
export type PublicPage = CollectionEntry<'pages'>;

export async function publicContent() {
  const [company, vehicle, claims, specifications, paints, options, media, press, sources] =
    await Promise.all([
      getEntry('company', 'keraboss'),
      getEntry('vehicles', 'super-k'),
      getCollection('claims'),
      getCollection('specifications'),
      getCollection('paints'),
      getCollection('options'),
      getCollection('media'),
      getCollection('press'),
      getCollection('sources'),
    ]);
  if (!company || !vehicle) throw new Error('Required public company / model data is missing.');
  return {
    company: company.data,
    vehicle: vehicle.data,
    claims,
    specifications,
    paints,
    options,
    media,
    press,
    sources,
  };
}

export function localizedValue(
  value: string | number | string[] | { el: string; en: string },
  locale: Locale,
): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return value[locale];
  return typeof value === 'number'
    ? new Intl.NumberFormat(locale === 'el' ? 'el-GR' : 'en-GB').format(value)
    : value;
}
