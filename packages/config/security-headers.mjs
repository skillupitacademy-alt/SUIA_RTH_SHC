/**
 * Standard security headers for all Quiz Platform apps.
 * JS build-friendly version of security-headers.ts (keeps values in sync manually).
 */
export const baseSecurityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '0' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=()' },
];

export const standardSecurityHeaders = [
  ...baseSecurityHeaders,
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
];

/**
 * Generates a Content Security Policy string.
 * @param {{ apiUrls: string[]; webAppUrl?: string; adminUrl?: string; reportUri?: string; isDev?: boolean }} options
 */
export function getCSPHeader(options) {
  const { apiUrls, webAppUrl, adminUrl, reportUri, isDev } = options;

  const connectSrc = ([
    "'self'",
    ...(apiUrls || []),
    webAppUrl,
    adminUrl,
    "https://*.sentry.io",
    "https://*.upstash.io",
    "https://cloudflareinsights.com",
    "https://api.realtutorialhub.com",
  ].filter(Boolean));

  const scriptSrc = ([
    "'self'",
    // Next.js injects small inline bootstrap scripts; allow them with an inline allowance.
    "'unsafe-inline'",
    isDev ? "'unsafe-eval'" : "",
    "https://static.cloudflareinsights.com",
  ].filter(Boolean));

  const styleSrc = ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"];
  const imgSrc = ["'self'", "data:", "blob:", "https://images.unsplash.com"];
  const fontSrc = ["'self'", "https://fonts.gstatic.com"];

  const cspDirectives = {
    "default-src": ["'self'"],
    "script-src": scriptSrc,
    "style-src": styleSrc,
    "img-src": imgSrc,
    "font-src": fontSrc,
    "connect-src": connectSrc,
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
    "manifest-src": ["'self'"],
  };

  if (reportUri) {
    cspDirectives["report-uri"] = [reportUri];
  }

  return Object.entries(cspDirectives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}
