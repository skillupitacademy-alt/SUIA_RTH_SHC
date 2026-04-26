/**
 * 🔐 CENTRALIZED API CLIENT
 * 
 * Single source of truth for all API calls.
 * Ensures cookies are ALWAYS sent with every request.
 * 
 * CRITICAL: This prevents auth redirect loops by ensuring
 * the browser sends the accessToken cookie in all API calls.
 */

export interface ApiClientOptions extends RequestInit {
  skipAuthRedirect?: boolean;
}

/**
 * Make an API request with automatic cookie handling
 * 
 * @param url - API endpoint (e.g., '/api/auth/me')
 * @param options - Fetch options
 * @returns Response data as JSON
 */
export async function apiFetch<T = any>(
  url: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { skipAuthRedirect, ...fetchOptions } = options;

  try {
    const response = await fetch(url, {
      credentials: 'include', // 🔥 CRITICAL: Always send cookies
      headers: {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers || {}),
      },
      ...fetchOptions,
    });

    // Handle 401 Unauthorized - session expired
    if (response.status === 401 && !skipAuthRedirect) {
      console.warn('[API_CLIENT] Session expired, redirecting to login');
      
      // Only redirect if we're in a browser environment
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      
      throw new Error('Session expired');
    }

    // Handle other errors
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API Error ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    // Return JSON response
    return await response.json();
  } catch (error) {
    console.error('[API_CLIENT] Request failed:', {
      url,
      method: fetchOptions.method || 'GET',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * GET request helper
 */
export async function apiGet<T = any>(url: string, options?: ApiClientOptions): Promise<T> {
  return apiFetch<T>(url, { ...options, method: 'GET' });
}

/**
 * POST request helper
 */
export async function apiPost<T = any>(
  url: string,
  data?: any,
  options?: ApiClientOptions
): Promise<T> {
  return apiFetch<T>(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PATCH request helper
 */
export async function apiPatch<T = any>(
  url: string,
  data?: any,
  options?: ApiClientOptions
): Promise<T> {
  return apiFetch<T>(url, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = any>(url: string, options?: ApiClientOptions): Promise<T> {
  return apiFetch<T>(url, { ...options, method: 'DELETE' });
}

/**
 * PUT request helper
 */
export async function apiPut<T = any>(
  url: string,
  data?: any,
  options?: ApiClientOptions
): Promise<T> {
  return apiFetch<T>(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}
