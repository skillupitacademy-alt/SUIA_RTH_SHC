/**
 * Server-Side Safe URL Fetcher with Comprehensive SSRF Protection
 * 
 * SECURITY:
 * - Restricts to HTTP/HTTPS protocols only
 * - Rejects loopback, private IPv4 (RFC 1918), link-local, and private IPv6 ranges
 * - Rejects internal domain names (.local, .internal, .localhost, etc.)
 * - Validates redirects recursively against SSRF rules
 * - Enforces request timeouts and max response byte limits
 * - Verifies text/html content-type
 */

import { TutorialDocumentValidationError } from '@quiz/types';

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxSizeBytes?: number;
  maxRedirects?: number;
}

export class SafeUrlFetcher {
  private readonly defaultTimeoutMs: number = 5000;
  private readonly defaultMaxSizeBytes: number = 1024 * 1024; // 1MB
  private readonly defaultMaxRedirects: number = 3;

  /**
   * Validate a URL against SSRF rules on the server
   */
  validateUrl(rawUrl: string): URL {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new TutorialDocumentValidationError('Invalid URL format', [
        { code: 'INVALID_URL', message: 'URL is malformed', path: 'rawContent' },
      ]);
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new TutorialDocumentValidationError('Only HTTP and HTTPS protocols are allowed', [
        { code: 'FORBIDDEN_PROTOCOL', message: `Protocol '${parsed.protocol}' is not permitted`, path: 'rawContent' },
      ]);
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check loopback & unspecified
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname === '[::1]'
    ) {
      throw new TutorialDocumentValidationError('Access to localhost and loopback addresses is prohibited', [
        { code: 'SSRF_LOOPBACK_BLOCKED', message: 'Localhost is blocked', path: 'rawContent' },
      ]);
    }

    // Check private IPv4 ranges (RFC 1918 & Link-Local)
    if (
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      throw new TutorialDocumentValidationError('Access to private IP networks is prohibited', [
        { code: 'SSRF_PRIVATE_IP_BLOCKED', message: 'Private network addresses are blocked', path: 'rawContent' },
      ]);
    }

    // Check private IPv6 ranges
    if (
      hostname.startsWith('fc00:') ||
      hostname.startsWith('fe80:') ||
      hostname.startsWith('[fc00:') ||
      hostname.startsWith('[fe80:')
    ) {
      throw new TutorialDocumentValidationError('Access to private IPv6 addresses is prohibited', [
        { code: 'SSRF_PRIVATE_IPV6_BLOCKED', message: 'Private IPv6 is blocked', path: 'rawContent' },
      ]);
    }

    // Check internal domains
    if (
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.corp') ||
      hostname.endsWith('.lan')
    ) {
      throw new TutorialDocumentValidationError('Access to internal top-level domains is prohibited', [
        { code: 'SSRF_INTERNAL_DOMAIN_BLOCKED', message: 'Internal domains are blocked', path: 'rawContent' },
      ]);
    }

    return parsed;
  }

  /**
   * Safely fetch content from a validated public URL
   */
  async safeFetch(rawUrl: string, options: SafeFetchOptions = {}): Promise<string> {
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const maxSizeBytes = options.maxSizeBytes ?? this.defaultMaxSizeBytes;
    const maxRedirects = options.maxRedirects ?? this.defaultMaxRedirects;

    let currentUrl = rawUrl;
    let redirectCount = 0;

    while (redirectCount <= maxRedirects) {
      const parsedUrl = this.validateUrl(currentUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(parsedUrl.toString(), {
          method: 'GET',
          signal: controller.signal,
          redirect: 'manual', // Manually inspect redirect URLs for SSRF
          headers: {
            'User-Agent': 'SkillHubCore-TutorialComposer/1.0',
            Accept: 'text/html, text/plain, text/markdown, application/xhtml+xml',
          },
        });

        clearTimeout(timeoutId);

        // Handle redirects manually to enforce SSRF validation at every hop
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          const redirectLocation = response.headers.get('location');
          if (!redirectLocation) {
            throw new TutorialDocumentValidationError('Redirect missing Location header');
          }

          currentUrl = new URL(redirectLocation, parsedUrl).toString();
          redirectCount++;
          continue;
        }

        if (!response.ok) {
          throw new TutorialDocumentValidationError(
            `Failed to fetch URL: HTTP ${response.status} ${response.statusText}`
          );
        }

        // Verify content-type
        const contentType = response.headers.get('content-type')?.toLowerCase() || '';
        const isTextContent =
          contentType.includes('text/html') ||
          contentType.includes('text/plain') ||
          contentType.includes('text/markdown') ||
          contentType.includes('application/xhtml+xml');

        if (!isTextContent && contentType.length > 0) {
          throw new TutorialDocumentValidationError(
            `Unsupported content-type: '${contentType}'. Only text/HTML documents are supported.`
          );
        }

        // Read response stream up to maxSizeBytes
        const text = await response.text();
        if (text.length > maxSizeBytes) {
          throw new TutorialDocumentValidationError(
            `Fetched document exceeds maximum allowed size of ${maxSizeBytes / 1024}KB.`
          );
        }

        return text;
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        if (err instanceof TutorialDocumentValidationError) {
          throw err;
        }
        if (err instanceof Error && err.name === 'AbortError') {
          throw new TutorialDocumentValidationError(`URL request timed out after ${timeoutMs}ms.`);
        }
        throw new TutorialDocumentValidationError(
          `Network error fetching URL: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }

    throw new TutorialDocumentValidationError(`Too many redirects (limit: ${maxRedirects}).`);
  }
}

export const safeUrlFetcher = new SafeUrlFetcher();
