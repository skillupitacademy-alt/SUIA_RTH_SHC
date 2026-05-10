/**
 * 🔥 LIGHTWEIGHT AUTH VALIDATION - SSR-SAFE
 * 
 * Simple, fast auth check using /api/auth/me endpoint.
 * No heavy profile data - just authentication status.
 * 
 * Pattern: Dashboard → validateAuthState() → /api/auth/me ✅
 * 
 * 🚨 CRITICAL: SSR-safe with proper cookie forwarding
 */

export interface AuthValidationState {
  id: string;
  email: string;
  onboardingCompleted?: boolean;
  roles: string[]; // ["user"] for now
}

/**
 * 🔥 SSR-SAFE: Build base URL using incoming request headers
 * SSR MUST go through gateway (NOT localhost)
 */
async function buildBaseUrl(): Promise<string> {
  const isServer = typeof window === 'undefined';
  
  if (!isServer) {
    // Client-side: use current origin
    return '';
  }

  // Server-side: use headers to build URL
  try {
    const { headers } = await import('next/headers');
    const headerList = await headers();
    
    const protocol =
      headerList.get('x-forwarded-proto') ||
      (process.env.NODE_ENV === 'development' ? 'http' : 'https');
    
    const host =
      headerList.get('x-forwarded-host') ||
      headerList.get('host');
    
    if (!host) {
      throw new Error('[AUTH_VALIDATE] No host header found');
    }
    
    return `${protocol}://${host}`;
  } catch (error) {
    // Fallback for edge cases
    if (process.env.NODE_ENV === 'development') {
      console.warn('[AUTH_VALIDATE] Header access failed, using fallback');
    }
    return '';
  }
}

/**
 * 🔥 SSR-SAFE: Build cookie header from Next.js cookies()
 */
async function buildCookieHeader(): Promise<string> {
  const isServer = typeof window === 'undefined';
  
  if (!isServer) {
    // Client-side: cookies sent automatically
    return '';
  }

  // Server-side: manually forward cookies
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    
    return cookieStore
      .getAll()
      .map(({ name, value }: { name: string; value: string }) => `${name}=${value}`)
      .join('; ');
  } catch (error) {
    // Fallback for edge cases
    if (process.env.NODE_ENV === 'development') {
      console.warn('[AUTH_VALIDATE] Cookie access failed');
    }
    return '';
  }
}

/**
 * Lightweight auth validation - checks if user is logged in
 * Uses /api/auth/me endpoint for fast validation
 * 
 * 🚨 CRITICAL: SSR-safe with proper cookie forwarding
 */
export async function validateAuthState(): Promise<AuthValidationState | null> {
  const MAX_RETRIES = 2;
  const TIMEOUT_MS = 3000;
  
  let lastError: any = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AUTH_VALIDATE] Attempt ${attempt + 1}/${MAX_RETRIES + 1}`);
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      // 🔥 SSR-SAFE: Build URL and headers
      const baseUrl = await buildBaseUrl();
      const cookieHeader = await buildCookieHeader();
      const finalUrl = baseUrl ? `${baseUrl}/api/auth/me` : '/api/auth/me';

      // 🔥 SSR-SAFE: Prepare headers
      const headers: Record<string, string> = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Accept': 'application/json',
      };

      // Add cookies for SSR
      if (cookieHeader) {
        headers['cookie'] = cookieHeader;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH_VALIDATE] Request details:', {
          url: finalUrl,
          hasCookies: !!cookieHeader,
          cookieLength: cookieHeader.length,
        });
      }

      const res = await fetch(finalUrl, {
        method: 'GET',
        headers,
        cache: 'no-store',
        credentials: 'include', // Still include for client-side
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH_VALIDATE] Response received:', {
          status: res.status,
          ok: res.ok,
          headers: {
            contentType: res.headers.get('content-type'),
            cacheControl: res.headers.get('cache-control'),
          },
        });
      }

      // ✅ CRITICAL: 401 = not authenticated (expected)
      if (res.status === 401) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AUTH_VALIDATE] Not authenticated (401)');
        }
        return null;
      }

      // ⚠️ Server errors or network issues = retry (don't logout on transient failures)
      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unable to read error');
        
        // 🚨 CRITICAL: Only logout on real auth failure (401)
        // For other errors (5xx, network), retry instead of logging out
        console.warn(`[AUTH_VALIDATE] Server error (attempt ${attempt + 1}):`, res.status, errorText);
        lastError = new Error(`Auth validation failed: HTTP ${res.status}`);
        
        // Wait before retry (exponential backoff)
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
        }
        continue; // retry
      }

      const data = await res.json();
      
      console.log('[AUTH_VALIDATE] ✅ Success - Raw response data:', {
        userId: data.user?.id?.slice(0, 8),
        email: data.user?.email,
        onboardingCompleted: data.user?.onboardingCompleted,
        role: data.user?.role,
        roles: data.user?.roles,
        isAdmin: data.user?.isAdmin,
        brand: data.user?.brand,
      });

      // ✅ STANDARDIZED RESPONSE
      const result = {
        id: data.user.id,
        email: data.user.email,
        onboardingCompleted: data.user.onboardingCompleted,
        roles: data.user.roles || (data.user.role ? [data.user.role] : ['user']), // Handle both formats
      };
      
      console.log('[AUTH_VALIDATE] 🎯 Returning standardized auth state:', {
        userId: result.id.slice(0, 8),
        email: result.email,
        onboardingCompleted: result.onboardingCompleted,
        roles: result.roles,
      });
      
      return result;
    } catch (err) {
      lastError = err;

      if (err instanceof Error && err.name === 'AbortError') {
        console.warn(`[AUTH_VALIDATE] Request timeout (attempt ${attempt + 1})`);
      } else {
        console.warn(`[AUTH_VALIDATE] Request failed (attempt ${attempt + 1}):`, err instanceof Error ? err.message : 'Unknown error');
      }

      // Wait before retry
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
      }
    }
  }

  // 🚨 FINAL FALLBACK: All retries exhausted
  // This should be RARE - only happens when API is completely down
  console.error('[AUTH_VALIDATE] All retries exhausted:', lastError);
  console.error('[AUTH_VALIDATE] CRITICAL: Returning null after all retries failed');
  console.error('[AUTH_VALIDATE] This will cause logout - ensure this is correct behavior');
  
  // 🧠 IMPORTANT: Only return null here if you're CERTAIN the user should be logged out
  // In most cases, transient failures should NOT log users out
  // Consider: Should we return a "degraded auth state" instead?
  return null;
}

/**
 * Check if user has completed onboarding
 * Convenience function for common use case
 */
export function hasCompletedOnboarding(auth: AuthValidationState | null): boolean {
  return auth?.onboardingCompleted === true;
}

/**
 * Get user role (always "user" for now)
 * Future-proof for RBAC expansion
 */
export function getUserRole(auth: AuthValidationState | null): string {
  return auth?.roles?.[0] || 'user';
}