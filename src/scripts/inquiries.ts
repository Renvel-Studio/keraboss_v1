import { track } from './analytics';

export function mountInquiryForms(): void {
  document.querySelectorAll<HTMLFormElement>('[data-inquiry-form]').forEach((form) => {
    const requestId = form.elements.namedItem('requestId') as HTMLInputElement;
    requestId.value = crypto.randomUUID();
    const params = new URLSearchParams(location.search);
    for (const name of ['color', 'roof', 'intent']) {
      const field = form.elements.namedItem(name);
      const value = params.get(name);
      if (value && (field instanceof HTMLInputElement || field instanceof HTMLSelectElement))
        field.value = value;
    }
    let pending = false;
    let confirmed = false;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (pending || confirmed || !form.reportValidity()) return;
      const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
      const status = form.querySelector<HTMLElement>('[data-inquiry-status]')!;
      const en = document.documentElement.lang === 'en';
      pending = true;
      button.disabled = true;
      status.textContent = en ? 'Sending your enquiry…' : 'Αποστολή αιτήματος…';
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
          signal: AbortSignal.timeout(15000),
        });
        const result: unknown = await response.json();
        if (
          !response.ok ||
          typeof result !== 'object' ||
          !result ||
          !('ok' in result) ||
          result.ok !== true ||
          !('requestId' in result) ||
          result.requestId !== requestId.value ||
          !('receiptId' in result) ||
          typeof result.receiptId !== 'string' ||
          !result.receiptId ||
          !('recordedAt' in result) ||
          typeof result.recordedAt !== 'string' ||
          Number.isNaN(Date.parse(result.recordedAt))
        )
          throw new Error('No confirmed receipt.');
        confirmed = true;
        status.textContent = en
          ? `Your enquiry was recorded. Reference: ${result.receiptId}`
          : `Το αίτημά σου καταγράφηκε. Κωδικός: ${result.receiptId}`;
        track('inquiry_confirmed', { requestId: requestId.value });
      } catch {
        status.textContent = en
          ? 'Your enquiry was not confirmed. Please retry or contact Keraboss by phone or email.'
          : 'Το αίτημα δεν επιβεβαιώθηκε. Δοκίμασε ξανά ή επικοινώνησε με τηλέφωνο ή email.';
      } finally {
        pending = false;
        button.disabled = confirmed;
      }
    });
  });
}
