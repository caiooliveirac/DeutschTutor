/** Base path prefix for all client-side fetch calls. */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Prepend basePath to an API route, e.g. apiUrl("/api/chat") → "/tutor/api/chat" */
export function apiUrl(path: string): string {
  return `${BASE}${path}`;
}
