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

/**
 * 🔥 UNIFIED: Use standard cookie header creation
 * This replaces manual cookie parsing with a cleaner approach
 * // @auth-audit-ignore - Using Next.js cookies() API properly
 */
function getCookieHeader(): string {
  const cookieStore = cookies();
  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');
}

export async function fetchBackendAuthState(): Promise<BackendAuthUserState | null> {
  const cookieHeader = getCookieHeader();
  
  console.log('[AUTH_STATE] Cookie check:', {
    hasCookies: cookieHeader.length > 0,
    cookieLength: cookieHeader.length,
    cookiePreview: cookieHeader.substring(0, 100),
  });
  
  if (cookieHeader.length === 0) {
    console.log('[AUTH_STATE] No cookies found, returning null');
    return null;
  }

  try {
    // ✅ Add timestamp to prevent any caching (defense in depth)
    const timestamp = Date.now();
    
    // 🔥 SSR OPTIMIZATION: Call localhost (same service)
    // In SSR context, we're calling our own BFF endpoint
    const profileUrl = `http://localhost:3000/api/profile?_t=${timestamp}`;
    
    console.log('[AUTH_STATE] Fetching profile from local BFF');
    console.log('[AUTH_STATE] Cookie header length:', cookieHeader.length);
    
    const response = await fetch(profileUrl, {
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

    const payload = (await response.json().catch(() => null)) as BackendAuthUserState | null;
    const user = payload;
    
    // 🔥 CRITICAL: The BFF /api/profile returns the profile with onboardingCompleted field
    // No need to map from onboarded since the field is already correct
    if (user) {
      console.log('[AUTH_STATE] Success:', {
        userId: user.id,
        email: user.email,
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
