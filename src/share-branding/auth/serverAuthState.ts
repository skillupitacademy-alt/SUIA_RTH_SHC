import { cookies, headers } from 'next/headers';

export interface BackendAuthUserState {
  id: string;
  email: string;
  name?: string | null;
  onboarded?: boolean;
  onboardingCompleted?: boolean;
  fullName?: string | null;
  status?: string | null;
  educationLevel?: string | null;
  primaryGoal?: string | null;
  domain?: string | null;
  subDomain?: string | null;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | null;
  timeCommitment?: string | null;
  journeyStatus?: string | null;
  roles?: string[];
}

/**
 * 🔥 Build base URL using incoming request headers
 * SSR MUST go through gateway, not direct API shortcuts.
 */
async function buildBaseUrl(): Promise<string> {
  const headerList = await headers();
  
  const protocol =
    headerList.get('x-forwarded-proto') ||
    (process.env.NODE_ENV === 'development' ? 'http' : 'https');
  
  const host =
    headerList.get('x-forwarded-host') ||
    headerList.get('host');
  
  if (!host) {
    throw new Error('[AUTH_STATE] No host header found');
  }
  
  return `${protocol}://${host}`;
}

/**
 * 🔥 Build cookie header from Next.js cookies()
 */
async function buildCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  
  return cookieStore
    .getAll()
    .map(({ name, value }: { name: string; value: string }) => `${name}=${value}`)
    .join('; ');
}

export async function fetchBackendAuthState(): Promise<BackendAuthUserState | null> {
  const MAX_RETRIES = 2;
  // The gateway/profile route may compile on its first request in Next.js dev mode.
  const timeoutMs = process.env.NODE_ENV === 'development' ? 15_000 : 3_000;
  let lastFailure = 'unavailable';

  let baseUrl: string;
  let cookieHeader: string;
  try {
    baseUrl = await buildBaseUrl();
    cookieHeader = await buildCookieHeader();
  } catch {
    console.warn('[AUTH_STATE] Request context unavailable; returning no profile');
    return null;
  }
  if (!cookieHeader) return null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/api/profile`, {
        headers: {
          cookie: cookieHeader,
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      // Invalid credentials must never be retried or replaced with a local user.
      if (response.status === 401) return null;

      if (!response.ok) {
        // Do not log private response bodies or credentials.
        lastFailure = `HTTP ${response.status}`;
        await response.body?.cancel();
      } else {
        const user = (await response.json()) as BackendAuthUserState | null;
        if (user) return user;
        lastFailure = 'empty profile response';
      }
    } catch (error: unknown) {
      const isAbort = controller.signal.aborted ||
        (error instanceof Error && error.name === 'AbortError');
      lastFailure = isAbort ? 'profile request timed out' : 'profile request failed';
    } finally {
      // Clear the deadline on success, denial, body failure and network failure.
      clearTimeout(timeout);
    }

    console.warn('[AUTH_STATE] Profile unavailable', {
      reason: lastFailure,
      attempt: attempt + 1,
    });
    if (attempt < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }

  // This helper supplies optional profile data. Existing callers own auth guards
  // and fallback behavior; transport failure must not manufacture an auth user.
  console.warn('[AUTH_STATE] Profile retries exhausted; returning no profile', {
    reason: lastFailure,
  });
  return null;
}
