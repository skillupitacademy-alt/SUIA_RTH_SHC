/**
 * 🔐 SHARED COOKIE MIDDLEWARE
 * 
 * Single source of truth for cookie management across all brands.
 * Prevents cookie domain mismatches and ensures consistent behavior.
 * 
 * CRITICAL: This is the ONLY place where auth cookies should be created.
 * Never use response.cookies.set() directly for auth cookies.
 */

export type Brand = 'realtutorialhub' | 'skillup';

/**
 * Brand-specific configuration
 * Maps each brand to its canonical hostnames.
 */
const BRAND_CONFIG = {
  realtutorialhub: {
    hostnames: ['user.realtutorialhub.com', 'admin.realtutorialhub.com', 'api.realtutorialhub.com'],
  },
  skillup: {
    hostnames: ['user.skillupitacademy.com', 'admin.skillupitacademy.com', 'api.skillupitacademy.com', 'faculty.skillupitacademy.com'],
  },
} as const;

function getRuntimeEnv(): Record<string, string | undefined> | undefined {
  if (typeof process !== 'undefined' && process.env !== undefined) {
    return process.env as Record<string, string | undefined>;
  }

  return undefined;
}

function getCookieDomainFallback(brand: Brand): string {
  return brand === 'skillup' ? '.skillupitacademy.com' : '.realtutorialhub.com';
}

/**
 * Get the cookie domain for a brand
 * 
 * @param brand - The brand identifier
 * @returns The cookie domain (e.g., '.realtutorialhub.com')
 */
export function getCookieDomain(brand: Brand): string {
  if (brand !== 'realtutorialhub' && brand !== 'skillup') {
    throw new Error(`Invalid brand: ${brand}`);
  }

  const env = getRuntimeEnv();
  const domain =
    env?.[brand === 'realtutorialhub' ? 'COOKIE_DOMAIN_RTH' : 'COOKIE_DOMAIN_SKILLUP'] ??
    env?.COOKIE_DOMAIN ??
    getCookieDomainFallback(brand);

  return domain;
}

/**
 * Resolve brand from hostname
 * 
 * @param hostname - The request hostname
 * @returns The brand identifier
 */
export function resolveBrandFromHostname(hostname: string): Brand {
  const normalized = hostname.toLowerCase();
  
  if (normalized.includes('skillup')) {
    return 'skillup';
  }
  
  return 'realtutorialhub';
}

/**
 * Cookie options for auth cookies
 */
export interface AuthCookieOptions {
  /** Cookie max age in seconds */
  maxAge?: number;
  /** Whether this is an admin cookie */
  isAdmin?: boolean;
}

/**
 * Build an auth cookie with correct domain for the brand
 * 
 * @param name - Cookie name (e.g., 'accessToken')
 * @param value - Cookie value (the JWT token)
 * @param brand - The brand identifier
 * @param options - Additional cookie options
 * @returns Cookie configuration object
 */
export function buildAuthCookie(
  name: string,
  value: string,
  brand: Brand,
  options: AuthCookieOptions = {}
) {
  const domain = getCookieDomain(brand);
  
  return {
    name,
    value,
    options: {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
      path: '/',
      domain,
      maxAge: options.maxAge ?? 60 * 60 * 24 * 7, // Default: 7 days
    },
  };
}

/**
 * Build access token cookie
 * 
 * @param token - The access token JWT
 * @param brand - The brand identifier
 * @param isAdmin - Whether this is an admin token
 * @returns Cookie configuration
 */
export function buildAccessTokenCookie(token: string, brand: Brand, isAdmin = false) {
  const name = isAdmin ? 'admin_accessToken' : 'accessToken';
  return buildAuthCookie(name, token, brand, {
    maxAge: 15 * 60, // 15 minutes
    isAdmin,
  });
}

/**
 * Build refresh token cookie
 * 
 * @param token - The refresh token JWT
 * @param brand - The brand identifier
 * @param isAdmin - Whether this is an admin token
 * @returns Cookie configuration
 */
export function buildRefreshTokenCookie(token: string, brand: Brand, isAdmin = false) {
  const name = isAdmin ? 'admin_refreshToken' : 'refreshToken';
  const maxAge = isAdmin ? 24 * 60 * 60 : 7 * 24 * 60 * 60; // Admin: 1 day, User: 7 days
  
  return buildAuthCookie(name, token, brand, {
    maxAge,
    isAdmin,
  });
}

/**
 * Validate that the cookie domain matches the request hostname
 * 
 * @param hostname - The request hostname
 * @param brand - The brand identifier
 * @throws Error if domain mismatch detected
 */
export function validateCookieDomain(hostname: string, brand: Brand): void {
  const config = BRAND_CONFIG[brand];
  const normalized = hostname.toLowerCase();
  const expectedDomain = getCookieDomain(brand);
  
  // Check if hostname matches any of the expected hostnames for this brand
  const isValidHostname = config.hostnames.some(h => normalized.includes(h.toLowerCase()));
  
  if (!isValidHostname) {
    console.error('COOKIE DOMAIN MISMATCH', {
      hostname,
      brand,
      expectedDomain,
      expectedHostnames: config.hostnames,
    });
    
    throw new Error(`Cookie domain mismatch: hostname "${hostname}" does not match brand "${brand}"`);
  }
}

/**
 * Set auth cookies for a brand (SINGLE SOURCE OF TRUTH)
 * 
 * This is the ONLY way auth cookies should be set.
 * Never use response.cookies.set() directly for auth cookies.
 * 
 * @param response - The response object
 * @param accessToken - The access token JWT
 * @param refreshToken - The refresh token JWT
 * @param brand - The brand identifier
 * @param isAdmin - Whether these are admin tokens
 */
export function setAuthCookies(
  response: { cookies: { set: (name: string, value: string, options: any) => void } },
  accessToken: string,
  refreshToken: string,
  brand: Brand,
  isAdmin = false
) {
  const accessCookie = buildAccessTokenCookie(accessToken, brand, isAdmin);
  const refreshCookie = buildRefreshTokenCookie(refreshToken, brand, isAdmin);
  
  response.cookies.set(accessCookie.name, accessCookie.value, accessCookie.options);
  response.cookies.set(refreshCookie.name, refreshCookie.value, refreshCookie.options);
}

/**
 * Clear auth cookies for a brand
 * 
 * @param response - The response object
 * @param brand - The brand identifier
 * @param isAdmin - Whether to clear admin cookies
 */
export function clearAuthCookies(
  response: { cookies: { set: (name: string, value: string, options: any) => void } },
  brand: Brand,
  isAdmin = false
) {
  const domain = getCookieDomain(brand);
  const accessTokenName = isAdmin ? 'admin_accessToken' : 'accessToken';
  const refreshTokenName = isAdmin ? 'admin_refreshToken' : 'refreshToken';
  
  response.cookies.set(accessTokenName, '', {
    domain,
    path: '/',
    expires: new Date(0),
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
  });
  
  response.cookies.set(refreshTokenName, '', {
    domain,
    path: '/',
    expires: new Date(0),
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
  });
}

/**
 * Clear cookies from ALL brands (useful for cross-brand cleanup)
 * 
 * @param response - The response object
 * @param isAdmin - Whether to clear admin cookies
 */
export function clearAllBrandCookies(
  response: { cookies: { set: (name: string, value: string, options: any) => void } },
  isAdmin = false
) {
  const brands: Brand[] = ['realtutorialhub', 'skillup'];
  
  brands.forEach(brand => {
    clearAuthCookies(response, brand, isAdmin);
  });
}
