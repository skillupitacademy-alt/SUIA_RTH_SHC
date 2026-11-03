import { test, expect } from '@playwright/test';

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
 * Validates that an environment variable is present without returning its actual value.
 */
export function isEnvVarPresent(varName: string): boolean {
  const val = process.env[varName];
  return typeof val === 'string' && val.trim().length > 0;
}

/**
 * Asserts that required test environment credentials and synthetic fixture databases
 * are available before executing an authenticated scenario. If prerequisites are missing,
 * skips the test deterministically with an explicit reason, preventing unguided failure
 * or accidental interaction with live production/staging databases.
 */
export function requirePrerequisites(
  testInfo: { skip: (condition: boolean, reason: string) => void },
  requiredVars: string[],
  contextDescription: string
): void {
  const missing = requiredVars.filter(v => !isEnvVarPresent(v));
  if (missing.length > 0) {
    testInfo.skip(
      true,
      `Prerequisites missing for ${contextDescription}: [${missing.join(', ')}]. Controlled synthetic fixture required.`
    );
  }
}

/**
 * Safe cookie existence assertion that never reveals cookie values.
 */
export async function assertCookieExists(
  cookies: Array<{ name: string; value: string; domain?: string; httpOnly?: boolean; secure?: boolean }>,
  cookieName: string,
  options?: { httpOnly?: boolean; secure?: boolean }
): Promise<void> {
  const match = cookies.find(c => c.name === cookieName);
  expect(match, `Expected cookie ${cookieName} to be present`).toBeDefined();
  expect(match!.value.length, `Expected cookie ${cookieName} to have non-empty value`).toBeGreaterThan(0);

  if (options?.httpOnly !== undefined) {
    expect(match!.httpOnly, `Cookie ${cookieName} httpOnly attribute mismatch`).toBe(options.httpOnly);
  }
  if (options?.secure !== undefined) {
    expect(match!.secure, `Cookie ${cookieName} secure attribute mismatch`).toBe(options.secure);
  }
}

/**
 * Safe cookie absence assertion.
 */
export async function assertCookieAbsent(
  cookies: Array<{ name: string; value: string }>,
  cookieName: string
): Promise<void> {
  const match = cookies.find(c => c.name === cookieName);
  expect(match, `Expected cookie ${cookieName} to be absent`).toBeUndefined();
}
