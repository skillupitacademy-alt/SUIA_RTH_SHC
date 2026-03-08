/**
 * Derive the API base URL for fetches.
 * - Prefers NEXT_PUBLIC_API_URL when provided (can be with or without trailing /api).
 * - On client: Falls back to absolute production URL if on production domain, otherwise relative "/api".
 * - On server: Falls back to absolute production URL to prevent node fetch errors.
 */
export function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  
  if (!raw) {
    const defaultProdApi = "https://api.realtutorialhub.com/api";
    
    // If we are on the server (no window object), we MUST use an absolute URL
    if (typeof window === 'undefined') {
      return defaultProdApi;
    }
    
    // On the client, if we are on the production domain but env var is missing (e.g. build time issue),
    // we should still try to hit the absolute API to avoid 404s on non-existent /api route.
    if (window.location.hostname === 'quiz.realtutorialhub.com') {
      return defaultProdApi;
    }
    
    return "/api";
  }

  const withoutTrailingSlash = raw.replace(/\/+$/, "");
  return withoutTrailingSlash.toLowerCase().endsWith("/api")
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api`;
}
