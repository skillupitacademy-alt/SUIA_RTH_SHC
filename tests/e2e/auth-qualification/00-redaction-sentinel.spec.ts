import { test, expect } from '@playwright/test';
import { validateOriginSafety } from './helpers/readiness';
import { sanitizeString, assertCookieAbsent, assertCookieExists } from './helpers/sanitized-evidence';
import { sanitizeErrorText } from './helpers/safe-reporter';

test.describe('Task D Sentinel & Redaction Harness Verification', () => {
  test('SENTINEL-01: validateOriginSafety rejects production domains fail-closed', () => {
    const forbidden = [
      'https://user.skillupitacademy.com',
      'https://admin.realtutorialhub.com',
      'https://skillhubcore.in',
      'http://production.realtutorialhub.com',
    ];

    for (const url of forbidden) {
      expect(
        () => validateOriginSafety(url),
        `Expected origin ${url} to be rejected`
      ).toThrow(/\[BROWSER-01 SAFETY VIOLATION\]/);
    }

    // Allowed local patterns must not throw
    expect(() => validateOriginSafety('http://skillup.localhost:3009')).not.toThrow();
    expect(() => validateOriginSafety('http://localhost:3000')).not.toThrow();
  });

  test('SENTINEL-02: sanitizeString and sanitizeErrorText redact sensitive sentinels', () => {
    const fakeJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const fakePassword = 'password=SuperSecretPassword123!';
    const rawError = `Failed request with token ${fakeJwt} and credentials ${fakePassword}`;

    const sanitized = sanitizeString(rawError);
    expect(sanitized).not.toContain(fakeJwt);
    expect(sanitized).not.toContain('SuperSecretPassword123!');
    expect(sanitized).toContain('[REDACTED_JWT]');
    expect(sanitized).toContain('password=[REDACTED]');

    const reporterSanitized = sanitizeErrorText(rawError);
    expect(reporterSanitized).not.toContain(fakeJwt);
    expect(reporterSanitized).not.toContain('SuperSecretPassword123!');
  });

  test('SENTINEL-03: assertCookieAbsent and assertCookieExists use boolean assertions without serializing secrets', () => {
    const cookies = [
      { name: 'accessToken', value: 'secret-token-value-xyz', httpOnly: true, secure: true },
    ];

    // Absent cookie check passes cleanly
    assertCookieAbsent(cookies, 'refreshToken');

    // Present cookie check passes cleanly
    assertCookieExists(cookies, 'accessToken', { httpOnly: true, secure: true });

    // Verify boolean failure behavior without value serialization
    expect(() => assertCookieAbsent(cookies, 'accessToken')).toThrow(/Cookie 'accessToken' must be absent/);
  });
});
