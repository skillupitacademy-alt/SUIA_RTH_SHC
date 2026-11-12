const BLOCKED_EXACT_PATHS = new Set([
  '/login',
  '/signup',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/verify-success',
  '/api',
  '/learn',
  '/student/learn',
  '/remediation',
  '/tutorial/assignments',
]);

const BLOCKED_PATH_PREFIXES = [
  '/login/',
  '/signup/',
  '/register/',
  '/forgot-password/',
  '/reset-password/',
  '/verify-email/',
  '/verify-success/',
  '/api/',
  '/learn/',
  '/student/learn/',
  '/remediation/',
  '/tutorial/assignments/',
];

function hasControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 0x1f || code === 0x7f) {
      return true;
    }
  }
  return false;
}

function isBlockedPathname(pathname: string): boolean {
  const normalized = (pathname.replace(/\/+$/, '') || '/').toLowerCase();
  if (BLOCKED_EXACT_PATHS.has(normalized)) {
    return true;
  }
  const withTrailingSlash = normalized === '/' ? '/' : `${normalized}/`;
  return BLOCKED_PATH_PREFIXES.some((prefix) => withTrailingSlash.startsWith(prefix));
}

export function sanitizeLearnerRedirect(
  raw: string | null | undefined,
  fallback = '/dashboard',
): string {
  if (typeof raw !== 'string') return fallback;

  const candidate = raw.trim();
  if (
    candidate.length === 0 ||
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    hasControlCharacter(candidate)
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, 'https://learner.internal');
    if (parsed.origin !== 'https://learner.internal') {
      return fallback;
    }
    const rawPathPart = candidate.split(/[?#]/, 1)[0] ?? '';
    if (/(?:%2f|%5c|%00|%0a|%0d)/i.test(rawPathPart)) {
      return fallback;
    }
    const decodedPathname = decodeURIComponent(parsed.pathname);
    if (
      decodedPathname.startsWith('//') ||
      decodedPathname.includes('\\') ||
      hasControlCharacter(decodedPathname) ||
      isBlockedPathname( parsed.pathname) ||
      isBlockedPathname(decodedPathname)
    ) {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

