# Inquiry adapter and delivery contract

The application contains a dependency-free standard `Request → Response` handler at
`src/lib/inquiries/handler.mjs`, with a Netlify default-function adapter at
`netlify/functions/inquiries.mjs`. Routing `/api/inquiries` to that function is configured by
the hosting configuration. The adapter follows Netlify’s documented
[web-request signature](https://docs.netlify.com/build/functions/api/#web-requests): a standard
Request enters and a Response returns. The module does not send email directly or provision
a third-party account.

## Configuration required before real delivery

- `PUBLIC_SITE_URL`: canonical HTTPS origin; default `https://keraboss.com`.
- `INQUIRY_WEBHOOK_URL`: authorized HTTPS receiving-system endpoint, without URL credentials or a fragment.
- `INQUIRY_WEBHOOK_TOKEN`: server-only bearer token. Never put it in a `PUBLIC_` variable or client bundle.

An absent/invalid webhook URL or token produces **503**. It never produces a fake success.
The current repository has no real receiving-system credentials and does not establish a
live delivery, durable lead record, owner notification or successful production conversion.
Preview origins are not automatically trusted by the production-origin CSRF policy.

## Incoming request

Only `POST`, `application/json` and `application/x-www-form-urlencoded` are accepted. JSON
requests or requests accepting JSON receive JSON responses. Native form submissions receive
accessible Greek/English HTML, with a main heading and home link, without echoed personal data.
The HTML contains no external dependencies, is not cacheable and is marked noindex.

| Field       | Contract                                                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `requestId` | UUID. A blank value receives a server-generated UUID for native/no-JavaScript forms. Supplied UUIDs are normalized to lowercase.  |
| `locale`    | `el` or `en`, default `el`.                                                                                                       |
| `name`      | Trimmed string, 2–120 characters; no control characters.                                                                          |
| `email`     | Trimmed plausible email address, at most 254 characters; no control characters.                                                   |
| `intent`    | `quote`, `viewing` or `rental`.                                                                                                   |
| `color`     | Blank/`unsure`, `timeless-black`, `highway-yellow`, `desert-storm`, `olympic-white`. No automotive color hex values are inferred. |
| `roof`      | Blank/`unsure`, `hard-top` or `soft-top`. This is an enquiry preference, not confirmation of availability or compatibility.       |
| `message`   | Optional, at most 3000 characters. Ordinary line breaks are accepted; unsafe control characters are rejected.                     |
| `consent`   | Exact value `yes`.                                                                                                                |
| `website`   | Honeypot; must remain blank. A filled honeypot is rejected, not counted as success.                                               |

Unknown keys, non-string values and repeated form-urlencoded fields are rejected. Both the
announced Content-Length and actual streamed body are capped at 16,384 bytes. Requests need
an exact same-origin HTTPS Origin, or a same-origin HTTPS Referer when Origin is missing.
Missing both is rejected. No permissive CORS headers are returned. Same-origin checks and the
honeypot do not replace receiving-system/hosting abuse controls.

## Authorized receiving-system contract

The server forwards normalized input plus `source: "keraboss-web"` as JSON to the configured
HTTPS endpoint with:

- `Authorization: Bearer <server token>`
- `Idempotency-Key: <requestId>`
- `Content-Type: application/json`
- `Accept: application/json`

Redirect following is disabled so the bearer token cannot be forwarded to a redirect target.
A fetch AbortController limits the operation to eight seconds. Upstream errors and response
bodies are not exposed to the client, and the adapter logs no request body, personal data or secrets.

The receiving system must reply with HTTP success and this receipt shape **only after durable storage**:

```json
{
  "acknowledged": true,
  "requestId": "c9c3aadf-d065-47ea-a30c-6c5dc6b0b802",
  "receiptId": "receipt-001",
  "recordedAt": "2026-11-19T12:00:00Z"
}
```

`requestId` must match the supplied idempotency key, `receiptId` must be a nonempty safe identifier
and `recordedAt` must be an ISO date-time with a timezone. Missing or mismatched acknowledgement,
non-success HTTP response, malformed response, network failure or timeout produces **502**.
Only a confirmed receipt yields HTTP **200** with:

```json
{
  "ok": true,
  "requestId": "c9c3aadf-d065-47ea-a30c-6c5dc6b0b802",
  "receiptId": "receipt-001",
  "recordedAt": "2026-11-19T12:00:00Z"
}
```

The receiving system **must durably deduplicate by Idempotency-Key**, returning the original
receipt for retries, and reject conflicting business payloads using the same identifier.
This adapter has no persistent database and makes no independent durable-deduplication claim.
It forwards the same supplied key on every retry. Do not implement production deduplication
using a function-instance memory map: instances restart and run concurrently.

A native form with a blank requestId receives a fresh identifier on each POST. Therefore repeated
no-JavaScript submissions without a retained key cannot be claimed to be the same enquiry. A
future server-rendered one-time form token or receiving-system duplicate review is needed if
that exact no-JavaScript retry behaviour must be deduplicated too.

## Result statuses

| HTTP | Meaning                                                        |
| ---- | -------------------------------------------------------------- |
| 200  | Receiving system returned a matching confirmed receipt.        |
| 400  | Invalid fields, malformed body, duplicates or filled honeypot. |
| 403  | Missing/untrusted submission origin.                           |
| 405  | Method other than POST; `Allow: POST`.                         |
| 413  | Body exceeds the cap.                                          |
| 415  | Unsupported content type.                                      |
| 502  | Receiving-system response/delivery was not confirmed.          |
| 503  | Receiving system is not configured.                            |

CTA clicks remain intermediate events. The frontend may emit a conversion only after this
confirmed 200 receipt and must deduplicate conversion emission by its stable request/receipt
identifier. A mailto click, form validation, network dispatch, honeypot rejection or 503 is not
a confirmed enquiry.

## Verification performed

`node scripts/verify-inquiries.mjs` runs **42 status/receipt scenarios** using an injected transport.
It checks success, invalid input, missing configuration, upstream errors/invalid receipts,
CSRF, method, content type, malformed/oversized bodies, honeypot, localized native-form output,
blank no-JavaScript request IDs, timeout and repeated idempotency keys.

The injected receiving-system mock records the same key once across two calls and returns the
same receipt. This is a test of the contract, not evidence that a real external system currently
implements durable deduplication. Tests make no network calls and send no real enquiries.

Before launch the owner must authorize/configure the endpoint and token, verify actual durable
recording and retry behaviour, configure appropriate hosting/receiving-system abuse controls,
and perform live success/failure delivery and conversion checks. Actual deployed function
routing, production headers, user consent wording and privacy/retention arrangements require
validation in the target hosting environment. No production deploy was performed by this task.
