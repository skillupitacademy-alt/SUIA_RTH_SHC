// Module-level lock for deduplicating refresh calls across parallel requests
let globalRefreshPromise: Promise<unknown> | null = null;

export class FetchClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }

  public async request<TResponse>(endpoint: string, options: RequestInit & { _isRetry?: boolean } = {}): Promise<TResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const isServer = typeof document === 'undefined';

    // Server-side (Next.js) cookie forwarding: include the incoming request cookies
    if (isServer && headers.cookie === undefined) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { cookies } = require('next/headers');
        const cookieHeader = cookies().toString();
        if (cookieHeader) {
          headers.cookie = cookieHeader;
        } else {
        // silent
        }
      } catch {
        // If next/headers is not available, skip; client-side will handle cookies via browser
        // silent
      }
    }

    // Client-side: log if auth cookies look missing
    if (!isServer) {
      // quiet client-side cookie checks
    }

    // Add CSRF token for mutation requests
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET');
    if (isMutation) {
      const csrfToken = this.getCookie('csrfToken');
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      // PATIENT CLIENT: Handle 401/403 with Auto-Refresh & Single-Flight Retry
      if ((response.status === 401 || response.status === 403) && !options._isRetry && endpoint !== '/auth/refresh') {
        try {
          // 1. DEDUPLICATION: If a refresh is already in flight, wait for it
          if (!globalRefreshPromise) {
            globalRefreshPromise = this.request('/auth/refresh', { method: 'POST', _isRetry: true });
          }
          
          await globalRefreshPromise;
          globalRefreshPromise = null; // Clear lock after success

          // 2. RETRY: Fire the original request again
          // silent retry
          return this.request<TResponse>(endpoint, { ...options, _isRetry: true });

        } catch (refreshErr) {
          globalRefreshPromise = null; // Clear lock on failure
          // silent refresh failure
          // Fall through to existing error/redirect logic below
        }
      }

      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          // Dispatch cancelable event to allow Apps to show Modal instead of hard redirect
          const event = new CustomEvent('auth:unauthorized', { cancelable: true });
          const shouldRedirect = window.dispatchEvent(event);

          // 2. Redirect Fallback with "Redirect Once" guard
          // Only redirect if the event wasn't prevented (i.e., no Modal handling it)
          const currentPath = window.location.pathname;
          const search = window.location.search;
          const isLoginPage = currentPath === '/login';
          const isAlreadyRedirecting = (window as any).__authRedirecting;

          if (shouldRedirect && !isLoginPage && !isAlreadyRedirecting) {
            (window as any).__authRedirecting = true;
            // silent redirect log
            
            const redirectUrl = encodeURIComponent(currentPath + search);
            const reason = response.status === 401 ? 'session_expired' : 'unauthorized';
            window.location.href = `/login?redirect=${redirectUrl}&reason=${reason}`;
          }
        }
      }
      // Clone response to read body twice if needed (though we only read once here)
      const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
      
      // Extraction Priority: 1. Explicit message, 2. Global _error, 3. First issue message, 4. Status code fallback
      const errorMessage = errorBody.message || 
                          errorBody.error || 
                          errorBody._error || 
                          (errorBody.issues && errorBody.issues.length > 0 ? errorBody.issues[0].message : null) || 
                          `API Error: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json() as Promise<TResponse>;
  }

  get<TResponse>(endpoint: string, options?: RequestInit) {
    return this.request<TResponse>(endpoint, { ...options, method: 'GET' });
  }

  post<TResponse, TBody = unknown>(endpoint: string, body: TBody, options?: RequestInit) {
    return this.request<TResponse>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put<TResponse, TBody = unknown>(endpoint: string, body: TBody, options?: RequestInit) {
    return this.request<TResponse>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  patch<TResponse, TBody = unknown>(endpoint: string, body: TBody, options?: RequestInit) {
    return this.request<TResponse>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete<TResponse>(endpoint: string, options?: RequestInit) {
    return this.request<TResponse>(endpoint, { ...options, method: 'DELETE' });
  }
}

