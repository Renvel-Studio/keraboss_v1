import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, CustomEase);

/** Opt-in sections only; content is always visible before JavaScript runs. */
export function mountSectionAnimations(scope: HTMLElement): () => void {
  const tokens = getComputedStyle(document.documentElement);
  const duration = Number.parseFloat(tokens.getPropertyValue('--motion-duration-reveal'));
  const distance = tokens.getPropertyValue('--motion-distance-reveal').trim();
  const bezier = tokens.getPropertyValue('--motion-ease-reveal').trim();
  const curve = bezier.match(/cubic-bezier\(([^)]+)\)/)?.[1];
  const ease = curve ? CustomEase.create('keraboss-reveal', curve) : 'none';
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]', scope).forEach((element) => {
        gsap.from(element, {
          y: distance,
          duration,
          ease,
          clearProps: 'transform',
          scrollTrigger: { trigger: element, start: 'top 92%', once: true },
        });
      });
    }, scope);
    return () => context.revert();
  });
  return () => media.revert();
}
