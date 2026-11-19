import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Opt-in sections only; content is always visible before JavaScript runs. */
export function mountSectionAnimations(scope: HTMLElement): () => void {
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]', scope).forEach((element) => {
        gsap.from(element, {
          y: 24,
          duration: 0.6,
          ease: 'power2.out',
          clearProps: 'transform',
          scrollTrigger: { trigger: element, start: 'top 92%', once: true },
        });
      });
    }, scope);
    return () => context.revert();
  });
  return () => media.revert();
}
