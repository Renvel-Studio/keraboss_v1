import { resolveSiteSettings } from '../../config/site-settings.mjs';

const settings = resolveSiteSettings(import.meta.env);

export const site = {
  ...settings,
  name: 'KERABOSS',
  organizationName: 'Keraboss Cars Manufacturing',
  title: 'KERABOSS Cars Manufacturing | Ελληνικά χειροποίητα αυτοκίνητα',
  description:
    'Γνωρίστε την Keraboss Cars Manufacturing στην Αθήνα και το SUPER K, το ελληνικό χειροποίητο αυτοκίνητο με ξεχωριστό χαρακτήρα.',
  language: 'el',
  locale: 'el_GR',
  email: 'info@keraboss.com',
  phone: '+302106420962',
  phoneDisplay: '210 6420962',
  address: {
    streetAddress: 'Βριλησσού 19',
    addressLocality: 'Αθήνα',
    postalCode: '11476',
    addressCountry: 'GR',
  },
  social: [
    { name: 'Instagram', handle: '@kerabosscars', url: 'https://www.instagram.com/kerabosscars/' },
    { name: 'TikTok', handle: '@keraboss.cars', url: 'https://www.tiktok.com/@keraboss.cars' },
    {
      name: 'Facebook',
      handle: 'Keraboss Super K',
      url: 'https://www.facebook.com/superKeraboss/',
    },
  ],
  // Populate only after an approved, representative raster image exists.
  defaultImage: undefined as
    { src: string; alt: string; width: number; height: number; type: string } | undefined,
} as const;

/** Canonicals never inherit localhost, preview hosts, queries, or fragments. */
export function canonicalUrl(path = '/'): string {
  const url = new URL(path, site.origin);
  if (url.origin !== site.origin) throw new Error('Canonical URLs must belong to this website.');
  url.search = '';
  url.hash = '';
  if (!url.pathname.endsWith('/') && !/\.[a-z0-9]+$/i.test(url.pathname)) url.pathname += '/';
  return url.href;
}

export const allowIndexing = site.indexable && !import.meta.env.DEV;
