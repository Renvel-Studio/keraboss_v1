import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function mountSmoothScroll(): () => void {
  const lenis = new Lenis({ autoRaf: false, anchors: true });
  const update = () => ScrollTrigger.update();
  const tick = (seconds: number) => lenis.raf(seconds * 1000);
  lenis.on('scroll', update);
  gsap.ticker.add(tick);
  return () => {
    gsap.ticker.remove(tick);
    lenis.off('scroll', update);
    lenis.destroy();
  };
}
