import routes from './routes.json' with { type: 'json' };

export const locales = /** @type {const} */ (['el', 'en']);
export const defaultLocale = 'el';
export { routes };

export function pageRoute(key, locale = defaultLocale) {
  const route = routes.find((entry) => entry.key === key && entry.locale === locale);
  if (!route) throw new Error(`No public route for ${key}/${locale}`);
  return route;
}

export function normalizedPath(path) {
  const decoded = decodeURI(new URL(path, 'https://routes.invalid').pathname);
  if (decoded === '/' || /\.[a-z\d]+$/i.test(decoded)) return decoded;
  return `${decoded.replace(/\/+$/, '')}/`;
}

export function isIndexablePath(path) {
  return routes.some((route) => route.indexable && route.path === normalizedPath(path));
}

export function markdownPath(path) {
  return `${normalizedPath(path)}index.md`;
}

export function translatedRoutes(key) {
  return routes.filter((route) => route.key === key && route.indexable);
}
