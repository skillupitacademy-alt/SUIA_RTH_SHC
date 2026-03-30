// Module-level lock for deduplicating refresh calls across parallel requests
let globalRefreshPromise: Promise<unknown> | null = null;

export const TIMEOUTS = {
  QUICK: 5000,
  STANDARD: 15000,
  LONG: 30000,
  UPLOAD: 60000,
} as const;

export class TimeoutError extends Error {
  constructor(message: string = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

class RetryableStatusError extends Error {
  status: number;
  retryAfterMs?: number;

  constructor(status: number, message: string, retryAfterMs?: number) {
    super(message);
    this.name = 'RetryableStatusError';
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

export interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: number;
  jitter?: boolean;
}

export type FetchOptions = RequestInit & {
  _isRetry?: boolean;
  timeout?: number;
  retry?: RetryOptions;
};

const DEFAULT_RETRY: Required<RetryOptions> = {
  maxRetries: 3,
  delay: 1000,
  backoff: 2,
  jitter: true,
};

const RETRYABLE_STATUSES = [408, 429, 500, 502, 503, 504];
const IDEMPOTENT_METHODS = ['GET', 'HEAD', 'OPTIONS'];
const AUTH_REFRESH_BYPASS_ENDPOINTS = new Set([
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/admin/auth/login',
  '/admin/auth/me',
  '/admin/auth/heartbeat',
]);

// In-memory ETag cache for Task 104
const ETAG_CACHE = new Map<string, { etag: string; data: any }>();

export class FetchClient {
  private baseUrl: string;
  private apiVersion: string;
  private portalIdentity: string | null = null;

  constructor(baseUrl: string, apiVersion: string = 'v1') {
    this.baseUrl = baseUrl;
    this.apiVersion = apiVersion;
  }

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }

  public setPortalIdentity(identity: 'infrastructure' | 'admin' | 'user' | null) {
    this.portalIdentity = identity;
  }

  public async request<TResponse>(
    endpoint: string, 
    options: FetchOptions = {}
  ): Promise<TResponse> {
    const retryOptions = { ...DEFAULT_RETRY, ...options.retry };
    let attempt = 0;

    while (true) {
      try {
        return await this.performRequest<TResponse>(endpoint, options);
      } catch (err: unknown) {
        attempt++;
        
        const isRetryableError =
          err instanceof TimeoutError ||
          err instanceof RetryableStatusError ||
          (err instanceof Error && err.message === 'Network error');
        const canRetry = attempt <= retryOptions.maxRetries && 
                         (options.method === undefined || IDEMPOTENT_METHODS.includes(options.method));

        if (!canRetry || !isRetryableError) throw err;
        
        // Final attempt failed
        if (attempt > retryOptions.maxRetries) throw err;

        // Calculate backoff
        const delay = retryOptions.delay * Math.pow(retryOptions.backoff, attempt - 1);
        const jitter = retryOptions.jitter ? Math.random() * 0.3 * delay : 0;
        const retryAfterMs = err instanceof RetryableStatusError ? err.retryAfterMs : undefined;
        const totalDelay = (retryAfterMs ?? delay) + jitter;

        await new Promise(resolve => setTimeout(resolve, totalDelay));
      }
    }
  }

  private async performRequest<TResponse>(
    endpoint: string, 
    options: FetchOptions = {}
  ): Promise<TResponse> {
    const timeout = options.timeout ?? TIMEOUTS.STANDARD;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const apiPrefix = `/api/${this.apiVersion}`;
    const normalizedEndpoint = endpoint.startsWith('/api/') && !endpoint.startsWith(apiPrefix)
      ? endpoint.replace('/api/', `${apiPrefix}/`)
      : endpoint;
      
    const url = `${this.baseUrl}${normalizedEndpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept-Version': this.apiVersion,
      ...(this.portalIdentity ? { 'x-portal-identity': this.portalIdentity } : {}),
      ...(options.headers as Record<string, string>),
    };

    // 104: Send ETag for conditional GET
    const isGet = (options.method || 'GET') === 'GET';
    const cached = isGet ? ETAG_CACHE.get(url) : null;
    if (cached) {
      headers['If-None-Match'] = cached.etag;
    }

    const isServer = typeof document === 'undefined';

    // Server-side (Next.js) cookie forwarding
    if (isServer && headers.cookie === undefined) {
      try {
        const { cookies } = await import('next/headers');
        const cookieHeader = cookies().toString();
        if (cookieHeader) {
          headers.cookie = cookieHeader;
        }
      } catch {
        // Fallback
      }
    }

    // Add CSRF token
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET');
    if (isMutation) {
      const csrfToken = this.getCookie('csrfToken');
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
        signal: controller.signal,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new TimeoutError(`Request to ${endpoint} timed out after ${timeout}ms`);
      }
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        throw new Error('Network/Security Error: Request blocked by browser (CORS).');
      }
      throw err instanceof Error ? err : new Error('Network error');
    } finally {
      clearTimeout(id);
    }

    if (response.status === 304 && cached) {
      return cached.data as TResponse;
    }

    if (!response.ok) {
      // Capture request id for correlation even on error
      if (typeof window !== 'undefined') {
        const rid = response.headers.get('x-request-id');
        if (rid) sessionStorage.setItem('last_request_id', rid);
      }

      const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
      const errorMessage = errorBody.message || 
                          errorBody.error || 
                          errorBody._error || 
                          (errorBody.issues && errorBody.issues.length > 0 ? errorBody.issues[0].message : null) || 
                          `API Error: ${response.status}`;

      // Retry only for safe/idempotent requests, but keep the backend message.
      if (RETRYABLE_STATUSES.includes(response.status) && !options._isRetry) {
        const method = (options.method || 'GET').toUpperCase();
        const canRetryMethod = IDEMPOTENT_METHODS.includes(method);
        if (canRetryMethod) {
          const retryAfter = response.status === 429 ? response.headers.get('Retry-After') : null;
          const retryAfterMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : undefined;
          throw new RetryableStatusError(response.status, errorMessage, retryAfterMs);
        }
      }

      // 401 Auto-Refresh
      const shouldBypassAutoRefresh = AUTH_REFRESH_BYPASS_ENDPOINTS.has(endpoint.split('?')[0]);

      if (response.status === 401 && !options._isRetry && endpoint !== '/auth/refresh' && !shouldBypassAutoRefresh) {
        try {
          if (!globalRefreshPromise) {
            globalRefreshPromise = this.performRequest('/auth/refresh', { method: 'POST', _isRetry: true });
          }
          await globalRefreshPromise;
          globalRefreshPromise = null;
          return this.performRequest<TResponse>(endpoint, { ...options, _isRetry: true });
        } catch {
          globalRefreshPromise = null;
        }
      }

      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('auth:unauthorized', { cancelable: true });
          const shouldRedirect = window.dispatchEvent(event);

          const currentPath = window.location.pathname;
          const search = window.location.search;
          const isLoginPage = currentPath === '/login';
          const isAlreadyRedirecting = (window as any).__authRedirecting;

          if (shouldRedirect && !isLoginPage && !isAlreadyRedirecting) {
            (window as any).__authRedirecting = true;
            const redirectUrl = encodeURIComponent(currentPath + search);
            window.location.href = `/login?redirect=${redirectUrl}&reason=session_expired`;
          }
        }
      } else if (response.status === 403 && typeof window !== 'undefined') {
        const event = new CustomEvent('auth:forbidden', { cancelable: true });
        window.dispatchEvent(event);
      }
      throw new Error(errorMessage);
    }

    // Capture request id and performance metrics for correlation
    if (typeof window !== 'undefined') {
      const rid = response.headers.get('x-request-id');
      if (rid) sessionStorage.setItem('last_request_id', rid);

      const duration = response.headers.get('x-duration-ms');
      if (duration) {
        const url_path = new URL(url, window.location.origin).pathname;
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[Perf] ${options.method || 'GET'} ${url_path} - ${duration}ms`);
        }
      }
    }

    const result = await response.json();

    // 104: Store ETag and data for GET requests
    if (isGet) {
      const etag = response.headers.get('ETag');
      if (etag) {
        ETAG_CACHE.set(url, { etag, data: result });
      }
    }

    return result as TResponse;
  }

  get<TResponse>(endpoint: string, options?: FetchOptions) {
    return this.request<TResponse>(endpoint, { ...options, method: 'GET' });
  }

  post<TResponse, TBody = unknown>(endpoint: string, body: TBody, options?: FetchOptions) {
    return this.request<TResponse>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put<TResponse, TBody = unknown>(endpoint: string, body: TBody, options?: FetchOptions) {
    return this.request<TResponse>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  patch<TResponse, TBody = unknown>(endpoint: string, body: TBody, options?: FetchOptions) {
    return this.request<TResponse>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete<TResponse>(endpoint: string, options?: FetchOptions) {
    return this.request<TResponse>(endpoint, { ...options, method: 'DELETE' });
  }
}
