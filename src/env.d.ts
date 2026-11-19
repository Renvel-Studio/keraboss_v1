/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_INDEXABLE?: 'true' | 'false';
  readonly PUBLIC_GOOGLE_SITE_VERIFICATION?: string;
}
