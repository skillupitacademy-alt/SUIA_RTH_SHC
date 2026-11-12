/**
 * Lightweight auth validation for dashboard SSR and client-side checks.
 *
 * Browser-side validation can use the relative BFF path. Server-side dashboard
 * rendering must call the configured API gateway because retained-Worker VPS
 * origins do not own `/api/auth/me`; they are frontend origins only.
 */

export interface AuthValidationState {
  id: string;
  email: string;
  onboardingCompleted?: boolean;
  roles: string[];
}

interface AuthRequestContext {
  publicHost?: string;
  gatewayUrl?: string;
}

/**
 * Get the shared gateway URL.
 * 
 * The gateway is now shared across all brands (SkillUp, RTH, SkillHubCore).
 * Brand resolution happens at the gateway based on X-Original-Host.
 */
function getGatewayUrlForHost(): string | undefined {
  const configured = process.env.GATEWAY_URL;
  return configured?.trim().replace(/\/+$/, '') || undefined;
}

/**
 * SECURITY BOUNDARY
 *
 * Only the Next.js `host` header is used as the public hostname.
 *
 * NEVER use:
 *   - x-original-host
 *   - x-forwarded-host
 *
 * from the incoming browser request, as these can be attacker-controlled.
 *
 * Example:
 *   skillup.localhost:3009 -> skillup.localhost
 */
function getPublicHostFromHeaders(headerList: Headers): string | undefined {
  const host = headerList.get('host');

  if (!host) {
    return undefined;
  }

  const trimmed = host.trim();

  if (!trimmed) {
    return undefined;
  }

  /*
   * Host is expected to be:
   *
   *   hostname
   *   hostname:port
   *
   * We only need the hostname for brand resolution.
   */
  try {
    const parsed = new URL(`http://${trimmed}`);

    return (
      parsed.hostname
        .trim()
        .toLowerCase()
        .replace(/\.$/, '') || undefined
    );
  } catch {
    return undefined;
  }
}

async function buildAuthRequestContext(): Promise<AuthRequestContext> {
  const isServer = typeof window === 'undefined';

  if (!isServer) {
    return {};
  }

  try {
    const { headers } = await import('next/headers');
    const headerList = await headers();
    const publicHost = getPublicHostFromHeaders(headerList);

    if (!publicHost) {
      throw new Error('[AUTH_VALIDATE] No valid host header found');
    }

    const gatewayUrl = getGatewayUrlForHost();

    if (!gatewayUrl) {
      throw new Error('[AUTH_VALIDATE] No gateway URL configured');
    }

    return {
      publicHost,
      gatewayUrl,
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[AUTH_VALIDATE] Unable to build SSR auth request context',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
    return {};
  }
}

async function buildCookieHeader(): Promise<string> {
  const isServer = typeof window === 'undefined';

  if (!isServer) {
    return '';
  }

  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();

    return cookieStore
      .getAll()
      .map(({ name, value }: { name: string; value: string }) => `${name}=${value}`)
      .join('; ');
  } catch {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[AUTH_VALIDATE] Cookie access failed');
    }
    return '';
  }
}

function parseAuthValidationState(raw: unknown): AuthValidationState | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const root = raw as Record<string, unknown>;
  const dataObj =
    root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>) : undefined;
  const candidate =
    (root.user && typeof root.user === 'object' ? (root.user as Record<string, unknown>) : undefined) ??
    (dataObj?.user && typeof dataObj.user === 'object'
      ? (dataObj.user as Record<string, unknown>)
      : undefined) ??
    dataObj ??
    root;

  const id =
    typeof candidate.id === 'string' && candidate.id.trim().length > 0
      ? candidate.id.trim()
      : typeof candidate.userId === 'string' && candidate.userId.trim().length > 0
        ? candidate.userId.trim()
        : null;
  const email =
    typeof candidate.email === 'string' && candidate.email.trim().length > 0
      ? candidate.email.trim()
      : null;

  if (!id || !email) {
    return null;
  }

  const rawRoles = Array.isArray(candidate.roles)
    ? candidate.roles.filter((role): role is string => typeof role === 'string' && role.trim().length > 0)
    : [];
  const fallbackRole =
    typeof candidate.role === 'string' && candidate.role.trim().length > 0
      ? [candidate.role.trim()]
      : ['user'];

  const onboardingCompleted =
    candidate.onboardingCompleted === true || candidate.onboarded === true;

  return {
    id,
    email,
    onboardingCompleted,
    roles: rawRoles.length > 0 ? rawRoles : fallbackRole,
  };
}

async function validateBrowserAuthState(): Promise<AuthValidationState | null> {
  try {
    const res = await fetch('/api/profile', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

    if (!res.ok) {
      return null;
    }

    const data: unknown = await res.json().catch(() => null);
    return parseAuthValidationState(data);
  } catch {
    return null;
  }
}

export async function validateAuthState(): Promise<AuthValidationState | null> {
  if (typeof window !== 'undefined') {
    return validateBrowserAuthState();
  }

  const MAX_RETRIES = 2;
  const TIMEOUT_MS = 3000;

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AUTH_VALIDATE] Attempt ${attempt + 1}/${MAX_RETRIES + 1}`);
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const authRequestContext = await buildAuthRequestContext();
      const cookieHeader = await buildCookieHeader();
      
      // Fail closed if SSR gateway unavailable
      const gatewayUrl = authRequestContext.gatewayUrl;

      if (!gatewayUrl) {
        clearTimeout(timeout);
        console.error('[AUTH_VALIDATE] Gateway URL unavailable for SSR auth validation');
        return null;
      }

      const finalUrl = `${gatewayUrl}/auth/me`;

      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      };

      if (cookieHeader) {
        headers.cookie = cookieHeader;
      }

      /*
       * SECURITY:
       *
       * These headers are generated by the Next.js server.
       *
       * X-Original-Host comes from the actual Next.js Host header.
       *
       * X-Internal-Secret proves that this request originated
       * from a trusted application server.
       */
      if (authRequestContext.publicHost) {
        headers['x-original-host'] = authRequestContext.publicHost;
      }

      const internalGatewaySecret = process.env.INTERNAL_GATEWAY_SECRET;

      if (
        typeof internalGatewaySecret !== 'string' ||
        internalGatewaySecret.trim().length === 0
      ) {
        clearTimeout(timeout);
        console.error('[AUTH_VALIDATE] INTERNAL_GATEWAY_SECRET is not configured');
        return null;
      }

      headers['x-internal-secret'] = internalGatewaySecret;

      if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH_VALIDATE] Request details:', {
          url: finalUrl,
          publicHost: authRequestContext.publicHost,
          gatewayUrl: authRequestContext.gatewayUrl,
          hasCookies: !!cookieHeader,
          cookieLength: cookieHeader.length,
        });
      }

      const res = await fetch(finalUrl, {
        method: 'GET',
        headers,
        cache: 'no-store',
        credentials: 'include',
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

      if (res.status === 401) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AUTH_VALIDATE] Not authenticated (401)');
        }
        return null;
      }

      if (!res.ok) {
        await res.body?.cancel().catch(() => undefined);
        console.warn(`[AUTH_VALIDATE] Server error (attempt ${attempt + 1}):`, res.status);
        lastError = new Error(`Auth validation failed: HTTP ${res.status}`);

        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
        }
        continue;
      }

      const data: unknown = await res.json();
      const result = parseAuthValidationState(data);

      if (!result) {
        lastError = new Error('Auth validation returned an invalid user payload');

        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
        }
        continue;
      }

      return result;
    } catch (err) {
      lastError = err;

      if (err instanceof Error && err.name === 'AbortError') {
        console.warn(`[AUTH_VALIDATE] Request timeout (attempt ${attempt + 1})`);
      } else {
        console.warn(
          `[AUTH_VALIDATE] Request failed (attempt ${attempt + 1}):`,
          err instanceof Error ? err.message : 'Unknown error',
        );
      }

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
      }
    }
  }

  console.error('[AUTH_VALIDATE] All retries exhausted:', lastError);
  console.error('[AUTH_VALIDATE] CRITICAL: Returning null after all retries failed');

  return null;
}

export function hasCompletedOnboarding(auth: AuthValidationState | null): boolean {
  return auth?.onboardingCompleted === true;
}

export function getUserRole(auth: AuthValidationState | null): string {
  return auth?.roles?.[0] || 'user';
}
