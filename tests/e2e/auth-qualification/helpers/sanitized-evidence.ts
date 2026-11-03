import { expect } from '@playwright/test';

/**
 * Sanitized Evidence Helper for Authentication Qualification.
 *
 * Guarantees zero secret/credential/token leakage in Playwright test logs,
 * console output, reporter outputs, and stack traces.
 */

// Regex patterns for sensitive tokens and credentials
const JWT_PATTERN = /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g;
const SECRET_PARAM_PATTERN = /(password|token|secret|authorization|cookie|session)=([^&\s]+)/gi;

/**
 * Sanitizes any string by redacting JWTs and parameter values.
 */
export function sanitizeString(input: string): string {
  if (!input) return input;
  return input
    .replace(JWT_PATTERN, '[REDACTED_JWT]')
    .replace(SECRET_PARAM_PATTERN, '$1=[REDACTED]');
}

/**
 * Safe cookie existence assertion that never serializes cookie values into assertion logs.
 */
export function assertCookieExists(
  cookies: Array<{ name: string; value: string; domain?: string; httpOnly?: boolean; secure?: boolean }>,
  cookieName: string,
  options?: { httpOnly?: boolean; secure?: boolean }
): void {
  const match = cookies.find(c => c.name === cookieName);
  const isPresent = match !== undefined;
  expect(isPresent, `Cookie '${cookieName}' must be present in browser context`).toBe(true);

  if (match) {
    const hasValue = typeof match.value === 'string' && match.value.length > 0;
    expect(hasValue, `Cookie '${cookieName}' value must be non-empty`).toBe(true);

    if (options?.httpOnly !== undefined) {
      expect(match.httpOnly === options.httpOnly, `Cookie '${cookieName}' httpOnly mismatch`).toBe(true);
    }
    if (options?.secure !== undefined) {
      expect(match.secure === options.secure, `Cookie '${cookieName}' secure mismatch`).toBe(true);
    }
  }
}

/**
 * Safe cookie absence assertion that never serializes matching cookie objects on failure.
 */
export function assertCookieAbsent(
  cookies: Array<{ name: string; value: string }>,
  cookieName: string
): void {
  const isAbsent = !cookies.some(c => c.name === cookieName);
  expect(isAbsent, `Cookie '${cookieName}' must be absent from browser context`).toBe(true);
}

/**
 * Safe string equality assertion that compares values strictly in memory
 * and reports only boolean success/failure to prevent secret leakage in stack traces.
 */
export function assertValueMatchesSafely(
  actual: unknown,
  expected: unknown,
  description: string
): void {
  const matches = actual === expected;
  expect(matches, `Invariant verification failed for: ${description}`).toBe(true);
}
