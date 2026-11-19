import { canonicalUrl, site } from '@/config/site';
import { textResponse } from '@/lib/http';

export function securityResponse(): Response {
  // RFC 9116: renew with each build; redeploy before this expiry.
  const expires = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
  return textResponse(`Contact: mailto:${site.email}
Expires: ${expires}
Preferred-Languages: el, en
Canonical: ${canonicalUrl('/.well-known/security.txt')}
`);
}
