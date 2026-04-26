/**
 * 🔐 UNIFIED FETCH — Single Source of Truth
 * 
 * Handles ALL fetch calls across:
 * - Browser → BFF
 * - BFF → API
 * - Internal service calls
 * 
 * Automatically manages:
 * - Cookie forwarding (server-side)
 * - Internal auth headers
 * - Brand propagation
 * - Credentials
 * 
 * CRITICAL: This is the ONLY way to make HTTP calls in this codebase.
 * Raw fetch() is blocked by ESLint.
 */

// Dynamic import for server-only next/headers
// This prevents build errors when used in client components
let getCookies: (() => any) | null = null;

if (typeof window === 'undefined') {
  try {
    // Only import on server-side
    getCookies = require('next/headers').cookies;
  } catch {
    // Ignore if next/headers is not available
  }
}

export type UnifiedFetchOptions = RequestInit & {
  /** Internal auth context (BFF → API calls) */
  auth?: {
    userId: string;
    roles?: string[];
  };
  /** Brand identifier */
  brand?: string;
  /** Whether this is an internal service-to-service call */
  internal?: boolean;
  /** Request ID for correlation across services */
  requestId?: string;
};

/**
 * Unified fetch wrapper
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options with auth/brand context
 * @returns Fetch response
 */
export async function unifiedFetch(
  url: string,
  options: UnifiedFetchOptions = {}
): Promise<Response> {
  const isServer = typeof window === 'undefined';
  const startTime = Date.now();
  
  // ----------------------------------
  // 🔥 CRITICAL: PRESERVE ALL CUSTOM HEADERS
  // ----------------------------------
  // Start with custom headers from options (e.g., createForwardHeaders)
  // This ensures BFF header forwarding logic is preserved
  let headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  
  // Only add Content-Type if not already set
  if (!headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  // ----------------------------------
  // 🍪 COOKIE FORWARDING (SERVER-SIDE)
  // ----------------------------------
  // When BFF calls API, forward cookies from browser
  // Only add if not already present (respect custom Cookie header)
  if (isServer && !headers['Cookie'] && !headers['cookie'] && getCookies) {
    try {
      const cookieStore = getCookies();
      
      // 🔥 CRITICAL FIX: Properly extract cookies from Next.js cookie store
      // cookieStore.toString() doesn't work - we need to manually build the cookie string
      const allCookies = cookieStore.getAll();
      const cookieHeader = allCookies
        .map((cookie: any) => `${cookie.name}=${cookie.value}`)
        .join('; ');
      
      if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
        
        // 🔍 DEBUG: Log cookie forwarding
        console.log('[unifiedFetch] Forwarding cookies to API', {
          cookieCount: allCookies.length,
          cookieLength: cookieHeader.length,
          url: url.substring(0, 100),
        });
      }
    } catch (error) {
      // cookies() throws outside request context (e.g., build time)
      // This is expected and safe to ignore
      console.log('[unifiedFetch] Could not access cookies (expected during build)');
    }
  }

  // ----------------------------------
  // 🔐 INTERNAL AUTH (BFF → API)
  // ----------------------------------
  // For internal calls, add auth headers
  if (options.internal) {
    if (!options.auth?.userId) {
      throw new Error('[unifiedFetch] Missing auth.userId for internal call');
    }

    headers['x-user-id'] = options.auth.userId;
    
    if (options.auth.roles) {
      headers['x-user-roles'] = options.auth.roles.join(',');
    }
    
    if (options.brand) {
      headers['x-brand'] = options.brand;
    }
    
    // 🔥 Propagate request ID for correlation
    if (options.requestId) {
      headers['x-request-id'] = options.requestId;
    }
    
    const internalSecret = process.env.INTERNAL_SECRET || process.env.INTERNAL_API_SECRET;
    if (!internalSecret) {
      console.error('[unifiedFetch] INTERNAL_SECRET not configured');
    } else {
      headers['x-internal-secret'] = internalSecret;
    }
  }

  // ----------------------------------
  // 🌐 FINAL REQUEST
  // ----------------------------------
  const finalOptions: RequestInit = {
    ...options, // 🔥 Preserve ALL options (redirect, cache, etc.)
    headers,
    credentials: 'include', // 🔥 CRITICAL: Always include cookies
  };

  // Remove custom properties before passing to fetch
  delete (finalOptions as any).auth;
  delete (finalOptions as any).brand;
  delete (finalOptions as any).internal;
  delete (finalOptions as any).requestId;

  // 🔍 OBSERVABILITY: Log internal fetches
  if (isServer && options.internal) {
    const duration = Date.now() - startTime;
    console.log(JSON.stringify({
      tag: 'INTERNAL_FETCH',
      timestamp: new Date().toISOString(),
      requestId: options.requestId, // 🔥 Request correlation
      url,
      method: finalOptions.method || 'GET',
      internal: true,
      duration,
      userId: options.auth?.userId,
      brand: options.brand,
    }));
  }

  return fetch(url, finalOptions);
}

/**
 * Convenience wrapper for GET requests
 */
export async function unifiedGet(
  url: string,
  options?: Omit<UnifiedFetchOptions, 'method' | 'body'>
): Promise<Response> {
  return unifiedFetch(url, {
    ...options,
    method: 'GET',
  });
}

/**
 * Convenience wrapper for POST requests
 */
export async function unifiedPost(
  url: string,
  body?: any,
  options?: Omit<UnifiedFetchOptions, 'method' | 'body'>
): Promise<Response> {
  return unifiedFetch(url, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience wrapper for PUT requests
 */
export async function unifiedPut(
  url: string,
  body?: any,
  options?: Omit<UnifiedFetchOptions, 'method' | 'body'>
): Promise<Response> {
  return unifiedFetch(url, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience wrapper for DELETE requests
 */
export async function unifiedDelete(
  url: string,
  options?: Omit<UnifiedFetchOptions, 'method' | 'body'>
): Promise<Response> {
  return unifiedFetch(url, {
    ...options,
    method: 'DELETE',
  });
}
