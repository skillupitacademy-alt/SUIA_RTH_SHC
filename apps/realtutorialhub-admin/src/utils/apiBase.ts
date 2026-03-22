/**
 * Derive the API base URL for client-side fetches in the admin app.
 * - Prefers NEXT_PUBLIC_API_URL when provided.
 * - Falls back to relative "/api" for local dev.
 */
export function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (raw === undefined || raw === null || raw === '') return "/api";

  const withoutTrailingSlash = raw.replace(/\/+$/, "");
  return withoutTrailingSlash.toLowerCase().endsWith("/api")
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api`;
}
