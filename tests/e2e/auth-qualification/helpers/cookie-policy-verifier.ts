import { expect } from '@playwright/test';

export interface CookiePolicyRule {
  name: string;
  httpOnly: boolean;
  secure?: boolean;
  sameSite?: 'None' | 'Lax' | 'Strict';
  exactDomain?: string;
  exactPath?: string;
}

export interface ContextCookie {
  name: string;
  domain?: string;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: string;
}

/**
 * Task-local cookie policy verifier for authentication qualification.
 *
 * Enforces:
 * 1. Exactly one matching cookie per required name (rejects duplicate same-name scope ambiguity).
 * 2. Exact match on HttpOnly, Secure, and SameSite.
 * 3. Exact match on Domain and Path.
 * 4. Zero secret/token serialization in logs or error assertions.
 */
export function verifyCookiePolicySafely(
  cookies: ContextCookie[],
  rules: CookiePolicyRule[]
): void {
  for (const rule of rules) {
    const matching = cookies.filter((c) => c.name === rule.name);

    // Enforce presence
    const isPresent = matching.length > 0;
    expect(isPresent, `Cookie '${rule.name}' must be present in context`).toBe(true);

    // Enforce uniqueness (no duplicate same-name cookies across different domains/scopes)
    const isUnique = matching.length === 1;
    expect(isUnique, `Cookie '${rule.name}' must have exactly 1 instance in context (no duplicate scope ambiguity)`).toBe(true);

    const cookie = matching[0];

    // Assert HttpOnly
    const httpOnlyMatches = cookie.httpOnly === rule.httpOnly;
    expect(httpOnlyMatches, `Cookie '${rule.name}' HttpOnly match`).toBe(true);

    // Assert Secure
    if (rule.secure !== undefined) {
      const secureMatches = cookie.secure === rule.secure;
      expect(secureMatches, `Cookie '${rule.name}' Secure match`).toBe(true);
    }

    // Assert SameSite
    if (rule.sameSite !== undefined) {
      const actualSameSite = typeof cookie.sameSite === 'string' ? cookie.sameSite.toLowerCase() : '';
      const expectedSameSite = rule.sameSite.toLowerCase();
      const sameSiteMatches = actualSameSite === expectedSameSite;
      expect(sameSiteMatches, `Cookie '${rule.name}' SameSite match`).toBe(true);
    }

    // Assert Path
    if (rule.exactPath !== undefined) {
      const pathMatches = cookie.path === rule.exactPath;
      expect(pathMatches, `Cookie '${rule.name}' Path match`).toBe(true);
    }

    // Assert Domain
    if (rule.exactDomain !== undefined) {
      // Normalize leading dot for browser cookie comparison
      const actualDomain = (cookie.domain ?? '').replace(/^\./, '').toLowerCase();
      const expectedDomain = rule.exactDomain.replace(/^\./, '').toLowerCase();
      const domainMatches = actualDomain === expectedDomain;
      expect(domainMatches, `Cookie '${rule.name}' Domain match`).toBe(true);
    }
  }
}

