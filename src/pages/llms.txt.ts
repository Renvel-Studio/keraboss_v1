import { llmsIndex } from '@/lib/exports';
import { textResponse } from '@/lib/http';
export async function GET(): Promise<Response> {
  return textResponse(await llmsIndex(), 'text/markdown');
}
