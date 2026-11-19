import { canonicalUrl, site } from '@/config/site';

/** Keep public machine-readable content aligned with the visible website. */
export const companySummary =
  'Η Keraboss Cars Manufacturing κατασκευάζει στην Αθήνα το SUPER K, ένα ελληνικό χειροποίητο αυτοκίνητο με ξεχωριστό χαρακτήρα.';

export const homeMarkdown = `# KERABOSS

${companySummary}

## Επικοινωνία

- Διεύθυνση: ${site.address.streetAddress}, ${site.address.postalCode}, ${site.address.addressLocality}, Ελλάδα.
- Τηλέφωνο: ${site.phone}
- Email: ${site.email}

## Επίσημα κοινωνικά δίκτυα

${site.social.map((profile) => `- [${profile.name} — ${profile.handle}](${profile.url})`).join('\n')}

Canonical: ${canonicalUrl()}
`;

export const llmsIndex = `# ${site.organizationName}

> ${companySummary}

Primary language: Greek (el). Canonical website: ${site.origin}/.
This file indexes the public content currently available on this website.

## Website content

- [Home](${canonicalUrl()}): Company, SUPER K, contact details and official social profiles.
- [Home in Markdown](${canonicalUrl('/index.md')}): Text equivalent of the home page.
- [Full company context](${canonicalUrl('/llms-full.txt')}): Consolidated public company information.

## Official social profiles

${site.social.map((profile) => `- [${profile.name}](${profile.url}): ${profile.handle}.`).join('\n')}
`;

export const llmsFull = `${homeMarkdown}
## About this document

This is the consolidated text of this website's current public company information.
KERABOSS is the brand; Keraboss Cars Manufacturing is the company name used on the website; SUPER K is the vehicle model.
For current specifications, pricing, delivery times and availability, contact the company directly.
The social links identify official profiles. Individual video transcripts and publication dates are not included here.
`;
