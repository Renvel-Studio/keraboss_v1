import { allowIndexing, canonicalUrl, site } from '@/config/site';
import { textResponse } from '@/lib/http';

export function GET(): Response {
  // A wildcard group opens access to all compliant search, retrieval and training bots.
  return textResponse(
    allowIndexing
      ? `User-agent: *\nAllow: /\n\nUser-agent: GPTBot\n${site.gptBotAllowed ? 'Allow' : 'Disallow'}: /\n\nSitemap: ${canonicalUrl('/sitemap-index.xml')}`
      : 'User-agent: *\nDisallow: /',
  );
}
