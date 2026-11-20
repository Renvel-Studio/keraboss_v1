import { randomUUID } from 'node:crypto';

export const MAX_INQUIRY_BYTES = 16_384;
export const INQUIRY_TIMEOUT_MS = 8_000;

const fields = new Set([
  'requestId',
  'locale',
  'name',
  'email',
  'intent',
  'color',
  'roof',
  'message',
  'consent',
  'website',
]);
const intents = new Set(['quote', 'viewing', 'rental']);
const colors = new Set([
  'unsure',
  'timeless-black',
  'highway-yellow',
  'desert-storm',
  'olympic-white',
]);
const roofs = new Set(['hard-top', 'soft-top', 'unsure']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const controlCharacters = /[\u0000-\u001f\u007f]/;
const copy = {
  el: {
    success: 'Το αίτημά σας καταγράφηκε.',
    successBody:
      'Η καταχώριση επιβεβαιώθηκε από το σύστημα παραλαβής. Κρατήστε τον αριθμό αναφοράς.',
    receipt: 'Αριθμός αναφοράς',
    invalid: 'Ελέγξτε τα υποχρεωτικά πεδία και τη συγκατάθεση και δοκιμάστε ξανά.',
    unavailable:
      'Η ηλεκτρονική φόρμα δεν είναι προσωρινά διαθέσιμη. Επικοινωνήστε στο info@keraboss.com ή στο +30 210 6420962.',
    upstream:
      'Δεν επιβεβαιώθηκε η καταχώριση του αιτήματος. Δοκιμάστε ξανά με τον ίδιο αριθμό αιτήματος ή επικοινωνήστε απευθείας με την Keraboss.',
    origin: 'Η προέλευση της υποβολής δεν επιτρέπεται.',
    method: 'Η υποβολή απαιτεί τη μέθοδο POST.',
    size: 'Το αίτημα είναι μεγαλύτερο από το επιτρεπόμενο όριο.',
    media: 'Η μορφή του αιτήματος δεν υποστηρίζεται.',
    title: 'Αίτημα επικοινωνίας | KERABOSS',
    back: 'Επιστροφή στο Keraboss',
  },
  en: {
    success: 'Your enquiry has been recorded.',
    successBody: 'The receiving system confirmed your enquiry. Keep the reference number.',
    receipt: 'Reference number',
    invalid: 'Check the required fields and consent, then try again.',
    unavailable:
      'The online form is temporarily unavailable. Contact info@keraboss.com or +30 210 6420962.',
    upstream:
      'Your enquiry could not be confirmed. Retry with the same request identifier or contact Keraboss directly.',
    origin: 'This submission origin is not permitted.',
    method: 'Submission requires the POST method.',
    size: 'The enquiry exceeds the permitted size.',
    media: 'This request format is not supported.',
    title: 'Contact enquiry | KERABOSS',
    back: 'Return to Keraboss',
  },
};

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character],
  );
}

function reply(status, code, locale, json, receipt, invalidFields = []) {
  const language = locale === 'en' ? 'en' : 'el';
  const text = copy[language];
  const headers = {
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  };
  if (status === 405) headers['Allow'] = 'POST';
  if (status === 503) headers['Retry-After'] = '300';
  if (json) {
    headers['Content-Type'] = 'application/json; charset=utf-8';
    return new Response(
      JSON.stringify(
        receipt
          ? { ok: true, ...receipt }
          : {
              ok: false,
              error: code,
              message: text[code],
              ...(invalidFields.length ? { fields: invalidFields } : {}),
            },
      ),
      { status, headers },
    );
  }
  headers['Content-Type'] = 'text/html; charset=utf-8';
  headers['Content-Security-Policy'] =
    "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";
  const summary = receipt ? text.success : text[code];
  const body = receipt
    ? `<p>${text.successBody}</p><p>${text.receipt}: <strong>${escapeHtml(receipt.receiptId)}</strong></p>`
    : '';
  return new Response(
    `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>${text.title}</title></head><body><main><h1>${summary}</h1>${body}<p><a href="${language === 'en' ? '/en/' : '/'}">${text.back}</a></p></main></body></html>`,
    { status, headers },
  );
}

async function readLimited(message, maximum) {
  const length = message.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > maximum)) {
    throw new Error('body-limit');
  }
  if (!message.body) return '';
  const reader = message.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximum) {
        await reader.cancel();
        throw new Error('body-limit');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

function trustedOrigin(request, origin) {
  const source = request.headers.get('origin') || request.headers.get('referer');
  if (!source || source === 'null') return false;
  try {
    const url = new URL(source);
    return url.protocol === 'https:' && url.origin === origin && !url.username && !url.password;
  } catch {
    return false;
  }
}

function validate(input, generateId) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { errors: ['request'] };
  const entries = Object.entries(input);
  if (entries.some(([key, value]) => !fields.has(key) || typeof value !== 'string'))
    return { errors: ['request'] };
  const value = Object.fromEntries(entries.map(([key, item]) => [key, item.trim()]));
  const errors = [];
  const locale = value.locale || 'el';
  if (!['el', 'en'].includes(locale)) errors.push('locale');
  if (
    !value.name ||
    value.name.length < 2 ||
    value.name.length > 120 ||
    controlCharacters.test(value.name)
  )
    errors.push('name');
  if (
    !value.email ||
    value.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) ||
    controlCharacters.test(value.email)
  )
    errors.push('email');
  if (!intents.has(value.intent)) errors.push('intent');
  if (!colors.has(value.color || 'unsure')) errors.push('color');
  if (!roofs.has(value.roof || 'unsure')) errors.push('roof');
  if (
    (value.message || '').length > 3000 ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value.message || '')
  )
    errors.push('message');
  if (value.consent !== 'yes') errors.push('consent');
  if (value.website) errors.push('website');
  if (value.requestId && !uuid.test(value.requestId)) errors.push('requestId');
  if (errors.length) return { errors, locale };
  const requestId = (value.requestId || generateId()).toLowerCase();
  if (!uuid.test(requestId)) throw new Error('Invalid generated request identifier.');
  return {
    errors,
    locale,
    value: {
      requestId,
      locale,
      name: value.name,
      email: value.email,
      intent: value.intent,
      color: value.color || 'unsure',
      roof: value.roof || 'unsure',
      message: value.message || '',
      consent: 'yes',
    },
  };
}

/** Standard Request → Response; durable storage and deduplication belong to the receiving system. */
export function createInquiryHandler({
  environment = process.env,
  transport = globalThis.fetch,
  generateId = randomUUID,
  timeoutMs = INQUIRY_TIMEOUT_MS,
} = {}) {
  return async function handleInquiry(request) {
    const type = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
    const json =
      type === 'application/json' ||
      (request.headers.get('accept') || '').includes('application/json');
    let locale = 'el';
    if (request.method !== 'POST') return reply(405, 'method', locale, json);
    let origin;
    try {
      const configured = new URL(environment.PUBLIC_SITE_URL || 'https://keraboss.com');
      if (configured.protocol !== 'https:' || configured.username || configured.password)
        throw new Error();
      origin = configured.origin;
    } catch {
      return reply(503, 'unavailable', locale, json);
    }
    if (!trustedOrigin(request, origin)) return reply(403, 'origin', locale, json);
    if (!['application/json', 'application/x-www-form-urlencoded'].includes(type))
      return reply(415, 'media', locale, json);
    let input;
    try {
      const body = await readLimited(request, MAX_INQUIRY_BYTES);
      if (type === 'application/json') input = JSON.parse(body);
      else {
        const parameters = new URLSearchParams(body);
        if ([...parameters.keys()].some((key) => parameters.getAll(key).length !== 1))
          return reply(400, 'invalid', locale, json, undefined, ['request']);
        input = Object.fromEntries(parameters);
      }
    } catch (error) {
      return reply(
        error.message === 'body-limit' ? 413 : 400,
        error.message === 'body-limit' ? 'size' : 'invalid',
        locale,
        json,
      );
    }
    const result = validate(input, generateId);
    locale = result.locale === 'en' ? 'en' : 'el';
    if (result.errors.length) return reply(400, 'invalid', locale, json, undefined, result.errors);
    const token = environment.INQUIRY_WEBHOOK_TOKEN?.trim();
    let endpoint;
    try {
      endpoint = new URL(environment.INQUIRY_WEBHOOK_URL || '');
      if (
        endpoint.protocol !== 'https:' ||
        endpoint.username ||
        endpoint.password ||
        endpoint.hash ||
        !token
      )
        throw new Error();
    } catch {
      return reply(503, 'unavailable', locale, json);
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await transport(endpoint.href, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': result.value.requestId,
        },
        redirect: 'error',
        signal: controller.signal,
        body: JSON.stringify({ ...result.value, source: 'keraboss-web' }),
      });
      if (!response.ok) throw new Error('Upstream request failed.');
      const acknowledgement = JSON.parse(await readLimited(response, MAX_INQUIRY_BYTES));
      if (
        acknowledgement.acknowledged !== true ||
        acknowledgement.requestId !== result.value.requestId ||
        typeof acknowledgement.receiptId !== 'string' ||
        !/^[a-zA-Z0-9._:-]{1,160}$/.test(acknowledgement.receiptId) ||
        typeof acknowledgement.recordedAt !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(acknowledgement.recordedAt) ||
        Number.isNaN(Date.parse(acknowledgement.recordedAt))
      )
        throw new Error('Unconfirmed receipt.');
      return reply(200, 'success', locale, json, {
        requestId: result.value.requestId,
        receiptId: acknowledgement.receiptId,
        recordedAt: acknowledgement.recordedAt,
      });
    } catch {
      return reply(502, 'upstream', locale, json);
    } finally {
      clearTimeout(timeout);
    }
  };
}
