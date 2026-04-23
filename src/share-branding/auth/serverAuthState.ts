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
    
    // 🔥 CRITICAL FIX: Use the current BFF service URL for server-side rendering
    // We need to call our own BFF /api/profile endpoint, not the API server directly
    let bffUrl = 'http://localhost:3000'; // fallback for local dev
    
    // In production, determine the current service URL
    if (process.env.NODE_ENV === 'production') {
      // For Cloud Run, we can use the service name pattern
      const serviceName = process.env.K_SERVICE;
      if (serviceName) {
        bffUrl = `https://${serviceName}-plldp3atca-as.a.run.app`;
      } else {
        // Fallback: extract from INTERNAL_API_URL if available
        const apiUrl = process.env.INTERNAL_API_URL;
        if (apiUrl) {
          bffUrl = apiUrl.replace('quiz-api-server', serviceName || 'realtutorialhub-web').replace('/api', '');
        }
      }
    }
    
    const profileUrl = `${bffUrl}/api/profile?_t=${timestamp}`;
    
    console.log('[AUTH_STATE] Environment check:', {
      nodeEnv: process.env.NODE_ENV,
      serviceName: process.env.K_SERVICE,
      bffUrl
    });
    console.log('[AUTH_STATE] Fetching from BFF:', profileUrl);
    console.log('[AUTH_STATE] Cookie header length:', cookieHeader.length);
    
    const response = await fetch(profileUrl, {
      headers: {
        Cookie: cookieHeader,
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
      credentials: 'include',
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
