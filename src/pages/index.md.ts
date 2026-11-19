import { homeMarkdown } from '@/content/company';
import { textResponse } from '@/lib/http';
export function GET(): Response {
  return textResponse(homeMarkdown, 'text/markdown');
}
