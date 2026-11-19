import { llmsFull } from '@/content/company';
import { textResponse } from '@/lib/http';
export function GET(): Response {
  return textResponse(llmsFull, 'text/markdown');
}
