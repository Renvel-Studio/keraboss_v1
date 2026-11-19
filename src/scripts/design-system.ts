export function mountDesignSystem(): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finish = document.querySelector<HTMLElement>('#finish-status');
  document.querySelectorAll<HTMLInputElement>('input[name="finish"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.checked && finish) finish.textContent = `Επιλεγμένο χρώμα: ${radio.value} ✓`;
    });
  });

  const form = document.querySelector<HTMLFormElement>('#demo-form');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = Array.from(form.querySelectorAll<HTMLInputElement>('input'));
    let valid = true;
    fields.forEach((input) => {
      const passes = input.checkValidity();
      const message = document.getElementById(`${input.id}-message`);
      input.setAttribute('aria-invalid', String(!passes));
      input.toggleAttribute('data-validated', passes);
      if (message) {
        message.classList.toggle('field-message--error', !passes);
        message.classList.toggle('field-message--success', passes);
        message.textContent = passes
          ? '✓ Επιτυχία: το πεδίο είναι σωστό.'
          : input.type === 'email'
            ? '! Σφάλμα: συμπλήρωσε μια έγκυρη διεύθυνση email.'
            : '! Σφάλμα: συμπλήρωσε το υποχρεωτικό πεδίο.';
      }
      if (!passes) valid = false;
    });
    const status = document.querySelector('#form-status');
    if (status)
      status.textContent = valid
        ? '✓ Ο έλεγχος ολοκληρώθηκε. Δεν αποστάλθηκαν στοιχεία.'
        : '! Έλεγξε τα πεδία με την ένδειξη «Σφάλμα».';
    if (!valid) fields.find((input) => !input.validity.valid)?.focus();
  });

  document.querySelectorAll<HTMLElement>('[data-motion-demo]').forEach((demo) => {
    const button = demo.querySelector<HTMLButtonElement>('[data-motion-play]');
    const runner = demo.querySelector<HTMLElement>('.motion-runner');
    const status = demo.querySelector<HTMLElement>('[data-motion-status]');
    const preset = demo.dataset['motionDemo'];
    if (!button || !runner || !status || !preset) return;
    let generation = 0;
    const rest = () => {
      generation += 1;
      delete demo.dataset['motionPlaying'];
      delete demo.dataset['motionSettled'];
      button.disabled = false;
      status.textContent = reduced.matches
        ? 'Ολοκληρώθηκε χωρίς μετακίνηση · reduced motion.'
        : 'Σε ηρεμία.';
    };
    button.addEventListener('click', () => {
      if (reduced.matches) {
        rest();
        return;
      }
      button.disabled = true;
      status.textContent = 'Κίνηση σε εξέλιξη.';
      demo.dataset['motionPlaying'] = preset;
    });
    runner.addEventListener('animationend', () => {
      if (reduced.matches) {
        rest();
        return;
      }
      demo.dataset['motionSettled'] = preset;
      delete demo.dataset['motionPlaying'];
      status.textContent = 'Επιστροφή σε ηρεμία.';
      const current = generation;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (current !== generation) return;
          delete demo.dataset['motionSettled'];
          if (preset === 'reveal') rest();
        }),
      );
    });
    runner.addEventListener('transitionend', (event) => {
      if (
        event.propertyName === 'transform' &&
        !demo.dataset['motionPlaying'] &&
        !demo.dataset['motionSettled']
      )
        rest();
    });
    runner.addEventListener('animationcancel', () => {
      if (reduced.matches) rest();
    });
    reduced.addEventListener('change', rest);
  });
}
