type EventName = 'cta_click' | 'inquiry_confirmed';
const confirmed = new Set<string>();

/** No external collector is configured. No PII is included in these integration events. */
export function track(name: EventName, detail: { cta?: string; requestId?: string }): void {
  if (name === 'inquiry_confirmed') {
    if (!detail.requestId || confirmed.has(detail.requestId)) return;
    confirmed.add(detail.requestId);
  }
  window.dispatchEvent(
    new CustomEvent('keraboss:analytics', {
      detail: {
        name,
        path: location.pathname,
        ...(detail.cta ? { cta: detail.cta } : {}),
        ...(detail.requestId ? { requestId: detail.requestId } : {}),
      },
    }),
  );
}

export function mountCtaTracking(): void {
  document.addEventListener('click', (event) => {
    const target =
      event.target instanceof Element ? event.target.closest<HTMLElement>('[data-cta]') : null;
    if (target?.dataset['cta']) track('cta_click', { cta: target.dataset['cta'] });
  });
}
