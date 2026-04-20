import { cookies } from 'next/headers';

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

function getInternalApiBase(): string {
  const internal = process.env.INTERNAL_API_URL?.trim();
  const fallback = process.env.NEXT_PUBLIC_API_URL?.trim();
  const candidate = internal && internal.length > 0 ? internal : fallback;

  if (!candidate) {
    throw new Error('INTERNAL_API_URL or NEXT_PUBLIC_API_URL must be configured');
  }

  const normalized = candidate.replace(/\/+$/, '');
  return normalized.toLowerCase().endsWith('/api') ? normalized : `${normalized}/api`;
}

async function getCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');
}

export async function fetchBackendAuthState(): Promise<BackendAuthUserState | null> {
  const cookieHeader = await getCookieHeader();
  if (cookieHeader.length === 0) {
    return null;
  }

  try {
    // ✅ Add timestamp to prevent any caching (defense in depth)
    const timestamp = Date.now();
    const apiBase = getInternalApiBase();
    
    console.log('[AUTH_STATE] Fetching from:', apiBase);
    console.log('[AUTH_STATE] Cookie header length:', cookieHeader.length);
    
    const response = await fetch(`${apiBase}/auth/me?_t=${timestamp}`, {
      headers: {
        Cookie: cookieHeader,
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    });

    console.log('[AUTH_STATE] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error');
      console.error('[AUTH_STATE] API returned error:', response.status, errorText);
      return null;
    }

    const payload = (await response.json().catch(() => null)) as { user?: BackendAuthUserState } | null;
    const user = payload?.user ?? null;
    
    // 🔥 CRITICAL: Normalize onboardingCompleted from onboarded field
    if (user) {
      user.onboardingCompleted = user.onboarded === true;
      console.log('[AUTH_STATE] Success:', {
        userId: user.id,
        email: user.email,
        onboarded: user.onboarded,
        onboardingCompleted: user.onboardingCompleted
      });
    } else {
      console.error('[AUTH_STATE] No user in response payload');
    }
    
    return user;
  } catch (error) {
    console.error('[AUTH_STATE] Exception:', error);
    return null;
  }
}
