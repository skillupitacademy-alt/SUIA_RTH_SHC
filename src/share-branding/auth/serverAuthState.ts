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
  const TIMEOUT_MS = 3000;
  
  let lastError: any = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const baseUrl = await buildBaseUrl();
      const cookieHeader = await buildCookieHeader();

      if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH_STATE_DEBUG]', {
          baseUrl,
          hasCookie: !!cookieHeader,
          cookieLength: cookieHeader.length,
          attempt: attempt + 1,
        });
      }

      if (!cookieHeader) {
        console.log('[AUTH_STATE] No cookies → returning null');
        clearTimeout(timeout);
        return null;
      }

      const profileUrl = `${baseUrl}/api/profile`;

      if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH_STATE] Fetching profile via gateway:', profileUrl);
      }

      const response = await fetch(profileUrl, {
        headers: {
          cookie: cookieHeader,
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      console.log('[AUTH_STATE] Response status:', response.status);

      // ✅ CASE 1: REAL AUTH FAILURE (401 = invalid/expired token)
      if (response.status === 401) {
        console.warn('[AUTH_STATE] Auth invalid (401) → logout');
        return null;
      }

      // ⚠️ CASE 2: SERVER ERROR (DO NOT LOGOUT - retry)
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error');
        console.warn('[AUTH_STATE] API error (will retry):', response.status, errorText);
        lastError = new Error(`HTTP ${response.status}`);
        
        // Wait before retry (exponential backoff)
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
        }
        continue; // retry
      }

      const user = (await response.json().catch(() => null)) as BackendAuthUserState | null;

      if (!user) {
        console.error('[AUTH_STATE] No user in response');
        lastError = new Error('Empty response');
        
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
        }
        continue; // retry
      }

      console.log('[AUTH_STATE] Success:', {
        userId: user.id,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
      });

      return user;
    } catch (error: any) {
      lastError = error;

      if (error.name === 'AbortError') {
        console.warn('[AUTH_STATE] Request timeout (attempt', attempt + 1, ')');
      } else {
        console.warn('[AUTH_STATE] Request failed (attempt', attempt + 1, '):', error.message);
      }

      // Wait before retry
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
      }
    }
  }

  // 🚨 FINAL FALLBACK: All retries exhausted
  console.error('[AUTH_STATE] All retries exhausted:', lastError);
  
  // ⚠️ IMPORTANT: Return null only after all retries failed
  // This prevents random logout on temporary issues
  return null;
}