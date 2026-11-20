import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { file } from 'astro/loaders';
import evidence from './data/catalog-evidence.json';
import { routes, locales } from '../config/route-policy.mjs';

const localized = z.object({ el: z.string().min(1), en: z.string().min(1) });
const sourceIds = new Set(evidence.sources.map(({ id }) => id));
const refs = z
  .array(z.string().refine((id) => sourceIds.has(id), 'Unknown evidence source'))
  .min(1);
const fromEvidence = (key: string) =>
  file('src/data/catalog-evidence.json', {
    parser: (text) => JSON.parse(text)[key],
  });

const sources = defineCollection({
  loader: fromEvidence('sources'),
  schema: z.object({
    url: z.url(),
    locale: z.enum(locales),
    observation: z.string(),
    httpStatus: z.number().int().nullable(),
    checkedAt: z.iso.date(),
  }),
});
const company = defineCollection({
  loader: file('src/data/catalog-evidence.json', {
    parser: (text) => [{ id: 'keraboss', ...JSON.parse(text).company }],
  }),
  schema: z.object({
    name: z.string(),
    brand: z.string(),
    model: z.string(),
    streetAddress: localized,
    addressLocality: localized,
    postalCode: z.string(),
    addressCountry: z.literal('GR'),
    telephone: z.string().regex(/^\+\d+$/),
    email: z.email(),
    sourceRefs: refs,
    social: z.array(
      z.object({ name: z.string(), handle: z.string(), url: z.url(), sourceRefs: refs }),
    ),
  }),
});
const claims = defineCollection({
  loader: fromEvidence('claims'),
  schema: z.object({
    text: localized,
    sourceRefs: refs,
    status: z.literal('verified-public-source'),
    publiclyUsable: z.literal(true),
  }),
});
const specifications = defineCollection({
  loader: fromEvidence('specifications'),
  schema: z.object({
    label: localized,
    value: z.union([z.string(), z.number(), localized, z.array(z.string())]),
    unit: z.string().nullable(),
    sourceRefs: refs,
    status: z.literal('verified-public-source'),
    currentTechnicalSheetApproval: z.literal('pending'),
    publicationQualifier: localized,
  }),
});
const vehicles = defineCollection({
  loader: file('src/data/catalog-evidence.json', {
    parser: (text) => {
      const data = JSON.parse(text);
      return [
        {
          id: 'super-k',
          name: data.company.model,
          brand: data.company.brand,
          manufacturerId: 'keraboss',
          countryOfManufacture: 'GR',
          sourceRefs: ['model-el', 'model-en', 'faq-en'],
        },
      ];
    },
  }),
  schema: z.object({
    name: z.string(),
    brand: z.string(),
    manufacturerId: z.literal('keraboss'),
    countryOfManufacture: z.literal('GR'),
    sourceRefs: refs,
  }),
});
const editions = defineCollection({
  loader: fromEvidence('editions'),
  schema: z.object({
    name: z.string(),
    sourceRefs: refs,
    status: z.literal('verified-public-source'),
    stableManufacturerId: z.string().nullable(),
  }),
});
const paints = defineCollection({
  loader: fromEvidence('paintNames'),
  schema: z.object({
    label: localized,
    hex: z.null(),
    sourceRefs: refs,
    status: z.literal('verified-public-source'),
    availability: z.literal('confirm-with-company'),
  }),
});
const options = defineCollection({
  loader: fromEvidence('options'),
  schema: z.object({
    label: localized,
    values: z.union([
      z.array(z.string()),
      z.object({ el: z.array(z.string()), en: z.array(z.string()) }),
    ]),
    sourceRefs: refs,
    status: z.literal('verified-public-source'),
    compatibilityApproval: z.string(),
  }),
});
const media = defineCollection({
  loader: fromEvidence('mediaAssets'),
  schema: z.object({
    src: z.string().startsWith('/'),
    width: z.number().positive(),
    height: z.number().positive(),
    type: z.string(),
    alt: localized,
    sourceUrl: z.url(),
    publicationStatus: z.literal('existing-project-asset'),
    pressRedistributionApproved: z.literal(false),
  }),
});
const press = defineCollection({
  loader: fromEvidence('press'),
  schema: z.object({
    title: z.string(),
    url: z.url(),
    publisher: z.string(),
    publishedDate: z.iso.date(),
    author: z.string(),
    sourceRefs: refs,
    status: z.literal('original-publication-read'),
    republishingRights: z.literal('not-granted-by-linking'),
    reviewRating: z.null(),
  }),
});
const pages = defineCollection({
  loader: file('src/data/pages.json'),
  schema: z.object({
    key: z.string().refine((key) => routes.some((route) => route.key === key)),
    locale: z.enum(locales),
    title: z.string().min(15),
    description: z.string().min(50),
    heading: z.string(),
    intro: z.string(),
    sections: z.array(
      z.object({
        heading: z.string(),
        paragraphs: z.array(z.string()),
        claimIds: z.array(
          z.string().refine((id) => evidence.claims.some((claim) => claim.id === id)),
        ),
        links: z.array(z.string().refine((key) => routes.some((route) => route.key === key))),
      }),
    ),
    reviewedAt: z.iso.date(),
    contentStatus: z.literal('verified-public-source'),
  }),
});

export const collections = {
  sources,
  company,
  vehicles,
  specifications,
  claims,
  editions,
  paints,
  options,
  media,
  press,
  pages,
};
