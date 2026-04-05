/**
 * Derive the API base URL for client-side fetches.
 * - Prefers NEXT_PUBLIC_API_URL when provided (can be with or without trailing /api).
 * - Falls back to relative "/api" so local dev keeps working.
 */
export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname === 'quiz.skillhubcore.in') {
      return '/api';
    }
  }

  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) return "/api";

  const withoutTrailingSlash = raw.replace(/\/+$/, "");
  return withoutTrailingSlash.toLowerCase().endsWith("/api")
    ? withoutTrailingSlash.slice(0, -4)
    : withoutTrailingSlash;
}
