/** Shared by Astro's build config and the application. */
export function resolveSiteSettings(environment) {
  const url = new URL(environment.PUBLIC_SITE_URL || 'https://keraboss.com');
  if (
    url.protocol !== 'https:' ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  ) {
    throw new Error(
      'PUBLIC_SITE_URL must be an HTTPS origin, without a path, query, or credentials.',
    );
  }
  const indexable = environment.PUBLIC_INDEXABLE ?? 'true';
  if (!['true', 'false'].includes(indexable))
    throw new Error('PUBLIC_INDEXABLE must be true or false.');
  return { origin: url.origin, indexable: indexable === 'true' };
}
