/** Libraries download only when the current page opts into motion. */
export function mountMotion(): () => void {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let dispose: (() => void)[] = [];
  let revision = 0;
  const cleanup = () => {
    revision += 1;
    dispose.forEach((stop) => stop());
    dispose = [];
  };
  const start = async () => {
    cleanup();
    if (preference.matches) return;
    const currentRevision = revision;
    const hasReveals = Boolean(document.querySelector('[data-reveal]'));
    const smooth = document.body.hasAttribute('data-smooth-scroll');
    if (!hasReveals && !smooth) return;
    const animations = await import('./gsap');
    if (currentRevision !== revision) return;
    if (hasReveals) dispose.push(animations.mountSectionAnimations(document.body));
    if (smooth) {
      const { mountSmoothScroll } = await import('./lenis');
      if (currentRevision !== revision) return;
      dispose.push(mountSmoothScroll());
    }
  };
  const refresh = () => {
    void start().catch((error: unknown) => console.error('Motion setup failed:', error));
  };
  preference.addEventListener('change', refresh);
  window.addEventListener('pagehide', cleanup);
  const restore = (event: PageTransitionEvent) => {
    if (event.persisted) refresh();
  };
  window.addEventListener('pageshow', restore);
  refresh();
  return () => {
    cleanup();
    preference.removeEventListener('change', refresh);
    window.removeEventListener('pagehide', cleanup);
    window.removeEventListener('pageshow', restore);
  };
}
