export function textResponse(body: string, type = 'text/plain'): Response {
  return new Response(body.trim() + '\n', {
    headers: { 'Content-Type': `${type}; charset=utf-8` },
  });
}
