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
 * SSR MUST go through gateway (NOT localhost)
 */
function buildBaseUrl(
  headerList: Awaited<ReturnType<typeof headers>>
): string {
  const host =
    headerList.get('x-forwarded-host') ||
    headerList.get('host');

  if (!host) {
    throw new Error('[AUTH_STATE] No host header found');
  }

  // 🔒 Force https in production (important for secure cookies)
  const protocol =
    process.env.NODE_ENV === 'development'
      ? 'http'
      : 'https';

  return `${protocol}://${host}`;
}

/**
 * 🔥 Build cookie header from Next.js cookies()
 */
async function buildCookieHeader(): Promise<string> {
  const cookieStore = await cookies();

  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');
}

/**
 * 🔐 SSR AUTH STATE FETCH (FINAL)
 */
export async function fetchBackendAuthState(): Promise<BackendAuthUserState | null> {
  try {
    // ✅ Single headers source (no duplication)
    const headerList = await headers();

    const baseUrl = buildBaseUrl(headerList);
    const cookieHeader = await buildCookieHeader();

    console.log('[AUTH_STATE_DEBUG]', {
      baseUrl,
      hasCookie: !!cookieHeader,
      cookieLength: cookieHeader.length,
    });

    if (!cookieHeader) {
      console.log('[AUTH_STATE] No cookies → returning null');
      return null;
    }

    const profileUrl = `${baseUrl}/api/profile`;

    console.log('[AUTH_STATE] Fetching profile via gateway:', profileUrl);

    const response = await fetch(profileUrl, {
      headers: {
        cookie: cookieHeader,

        // 🔥 REQUIRED for your gateway routing (DO NOT REMOVE)
        host: headerList.get('host') || '',
        'x-forwarded-host': headerList.get('host') || '',

        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    });

    console.log('[AUTH_STATE] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error');
      console.error('[AUTH_STATE] API error:', response.status, errorText);
      return null;
    }

    const user = (await response.json().catch(() => null)) as BackendAuthUserState | null;

    if (!user) {
      console.error('[AUTH_STATE] No user in response');
      return null;
    }

    console.log('[AUTH_STATE] Success:', {
      userId: user.id,
      email: user.email,
      onboardingCompleted: user.onboardingCompleted,
    });

    return user;
  } catch (error) {
    console.error('[AUTH_STATE] Exception:', error);
    return null;
  }
}