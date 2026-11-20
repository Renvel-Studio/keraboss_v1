import { createInquiryHandler } from '../../src/lib/inquiries/handler.mjs';

const handleInquiry = createInquiryHandler();

/** Netlify's standard web-request API passes a Request and accepts a Response. */
export default async function inquiries(request) {
  if (['deploy-preview', 'branch-deploy'].includes(process.env.CONTEXT)) {
    return new Response('Enquiries are unavailable on previews.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  return handleInquiry(request);
}
