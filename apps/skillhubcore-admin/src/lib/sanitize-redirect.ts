/**
 * Validates and sanitizes a post-login redirect URL.
 * Ensures the destination is strictly an internal, same-origin relative path.
 * Does not destructively decode query strings, preserving legitimate encoded parameters.
 */
export function sanitizeRedirectUrl(
  raw: string | null | undefined,
  fallback = '/dashboard'
): string {
  if (!raw || typeof raw !== 'string') return fallback;

  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  // 1. Explicitly reject protocol schemes and pseudo-protocols (e.g. javascript:, data:, https:)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return fallback;
  }

  // 2. Reject protocol-relative and backslash bypasses (e.g. //evil.com, /\evil.com, /path\evil.com)
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.includes('\\')) {
    return fallback;
  }

  // 3. Must be a relative path beginning with a single '/'
  if (!trimmed.startsWith('/')) {
    return fallback;
  }

  // 4. Safe URL parsing with localhost base to ensure origin does not mutate
  try {
    const parsed = new URL(trimmed, 'http://localhost');
    if (parsed.origin !== 'http://localhost') {
      return fallback;
    }

    if (!parsed.pathname.startsWith('/') || parsed.pathname.startsWith('//')) {
      return fallback;
    }

    // Return pathname + search + hash, preserving legitimate encoded query parameters
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return fallback;
  }
}
