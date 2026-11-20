import { resolveSiteSettings } from '../../config/site-settings.mjs';
import { normalizedPath } from '../../config/route-policy.mjs';
import evidence from '@/data/catalog-evidence.json';

const settings = resolveSiteSettings(import.meta.env);

export const site = {
  ...settings,
  name: evidence.company.brand,
  organizationName: evidence.company.name,
  title: 'KERABOSS Cars Manufacturing | Ελληνικά χειροποίητα αυτοκίνητα',
  description:
    'Γνωρίστε την Keraboss Cars Manufacturing στην Αθήνα και το SUPER K, το ελληνικό χειροποίητο αυτοκίνητο με ξεχωριστό χαρακτήρα.',
  language: 'el',
  locale: 'el_GR',
  email: evidence.company.email,
  phone: evidence.company.telephone,
  phoneDisplay: evidence.company.telephone.replace(/^\+30/, '').replace(/^(\d{3})(\d+)/, '$1 $2'),
  address: {
    streetAddress: evidence.company.streetAddress.el,
    addressLocality: evidence.company.addressLocality.el,
    postalCode: evidence.company.postalCode,
    addressCountry: evidence.company.addressCountry,
  },
  social: evidence.company.social,
  defaultImage: {
    src: evidence.mediaAssets[0]!.src,
    alt: evidence.mediaAssets[0]!.alt.el,
    width: evidence.mediaAssets[0]!.width,
    height: evidence.mediaAssets[0]!.height,
    type: evidence.mediaAssets[0]!.type,
  },
} as const;

/** Canonicals never inherit localhost, preview hosts, queries, or fragments. */
export function canonicalUrl(path = '/'): string {
  const url = new URL(path, site.origin);
  if (url.origin !== site.origin) throw new Error('Canonical URLs must belong to this website.');
  url.pathname = normalizedPath(url.pathname);
  url.search = '';
  url.hash = '';
  return url.href;
}

export const allowIndexing = site.indexable && !import.meta.env.DEV;
