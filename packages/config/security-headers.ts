
/**
 * Standard security headers for all Quiz Platform apps.
 * Follows Task 42 and security best practices.
 */
export const standardSecurityHeaders = [
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
    { key: 'X-XSS-Protection', value: '0' },
];

export interface CSPOptions {
    apiUrls: string[];
    webAppUrl?: string;
    adminUrl?: string;
    reportUri?: string;
    isDev?: boolean;
}

/**
 * Generates a Content Security Policy string.
 */
export function getCSPHeader(options: CSPOptions): string {
    const { apiUrls, webAppUrl, adminUrl, reportUri, isDev } = options;

    const connectSrc = ([
        "'self'",
        ...apiUrls,
        webAppUrl,
        adminUrl,
        "https://*.sentry.io",
        "https://*.upstash.io",
        "https://cloudflareinsights.com",
        "https://api.realtutorialhub.com",
    ].filter((v): v is string => !!v));

    const scriptSrc = ([
        "'self'",
        isDev ? "'unsafe-inline' 'unsafe-eval'" : "",
        "'wasm-unsafe-eval'", // Required for Cloudflare/Wasm performance
        "https://static.cloudflareinsights.com",
    ].filter((v): v is string => !!v));

    const styleSrc = ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"];
    const imgSrc = ["'self'", "data:", "blob:", "https://images.unsplash.com"];
    const fontSrc = ["'self'", "https://fonts.gstatic.com"];

    const cspDirectives: Record<string, string[]> = {
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
        "script-src-elem": [...scriptSrc, "'inline-speculation-rules'"], // For browser speculation rules
    };

    if (reportUri) {
        cspDirectives["report-uri"] = [reportUri];
    }

    return Object.entries(cspDirectives)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ');
}
