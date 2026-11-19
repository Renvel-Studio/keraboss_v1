import { site } from '@/config/site';
import { textResponse } from '@/lib/http';
export function GET(): Response {
  return textResponse(`/* COMPANY */
Name: ${site.organizationName}
Location: Athens, Greece
Contact: ${site.email}

/* SITE */
Language: Greek
Standards: HTML, CSS, SVG, JSON-LD
Stack: Astro, TypeScript, GSAP, Lenis
Icons: Lucide (ISC / Feather MIT)
Fonts: Self-hosted Inter Variable and Noto Sans Variable (OFL-1.1)
`);
}
