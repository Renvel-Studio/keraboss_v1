import { llmsIndex } from '@/content/company';
import { textResponse } from '@/lib/http';
export function GET(): Response {
  return textResponse(llmsIndex, 'text/markdown');
}
