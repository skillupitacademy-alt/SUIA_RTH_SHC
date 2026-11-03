import { test, expect } from '@playwright/test';
import { validateOriginSafety } from './helpers/readiness';
import { sanitizeString, assertCookieAbsent, assertCookieExists } from './helpers/sanitized-evidence';
import { sanitizeText } from './helpers/safe-reporter';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

test.describe('Task D Sentinel & Redaction Harness Verification', () => {
  test('SENTINEL-01: validateOriginSafety rejects production domains and paths fail-closed', () => {
    const forbidden = [
      'https://user.skillupitacademy.com',
      'https://user.skillupitacademy.com/login',
      'https://admin.realtutorialhub.com',
      'https://skillhubcore.in',
      'https://skillhubcore.in/admin',
      'http://production.realtutorialhub.com',
      'http://staging.skillupitacademy.com',
    ];

    for (const url of forbidden) {
      expect(
        () => validateOriginSafety(url),
        `Expected origin ${url} to be rejected fail-closed`
      ).toThrow(/\[BROWSER-01 SAFETY VIOLATION\]/);
    }

    // Empty or missing origins must fail closed
    expect(() => validateOriginSafety('')).toThrow(/missing or empty/);
    expect(() => validateOriginSafety(undefined)).toThrow(/missing or empty/);

    // Allowed local patterns must not throw, even with pathnames
    expect(() => validateOriginSafety('http://skillup.localhost:3009')).not.toThrow();
    expect(() => validateOriginSafety('http://skillup.localhost:3009/login')).not.toThrow();
    expect(() => validateOriginSafety('http://localhost:3000')).not.toThrow();
    expect(() => validateOriginSafety('http://127.0.0.1:3000/api/auth/me')).not.toThrow();
  });

  test('SENTINEL-02: sanitizeString and sanitizeText redact sensitive sentinels', () => {
    const fakeJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const fakePassword = 'password=SuperSecretPassword123!';
    const rawError = `Failed request with token ${fakeJwt} and credentials ${fakePassword} and <fake sentinel> and SENTINEL_RAW_TOKEN_999`;

    const sanitized = sanitizeString(rawError);
    expect(sanitized).not.toContain(fakeJwt);
    expect(sanitized).not.toContain('SuperSecretPassword123!');
    expect(sanitized).toContain('[REDACTED_JWT]');
    expect(sanitized).toContain('password=[REDACTED]');

    const reporterSanitized = sanitizeText(rawError);
    expect(reporterSanitized).not.toContain(fakeJwt);
    expect(reporterSanitized).not.toContain('SuperSecretPassword123!');
    expect(reporterSanitized).not.toContain('<fake sentinel>');
    expect(reporterSanitized).not.toContain('SENTINEL_RAW_TOKEN_999');
    expect(reporterSanitized).toContain('[REDACTED]');
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

  test('SENTINEL-04: child-process deliberate test failure under SafeQualificationReporter leaks no fake secrets', () => {
    // 1. Synthesize a temporary test file designed to deliberately throw an error containing fake secrets
    const tmpTestPath = path.resolve(__dirname, '00-tmp-deliberate-fail.spec.ts');
    const fakeSecret = 'SENTINEL_CHILD_PROCESS_SECRET_777';
    const fakePasswordErr = 'password=<fake sentinel>';

    const testContent = `
import { test } from '@playwright/test';

test('deliberate failure with fake secret payload', () => {
  throw new Error('Test deliberate failure: ${fakePasswordErr} and ${fakeSecret}');
});
`;
    fs.writeFileSync(tmpTestPath, testContent, 'utf-8');

    try {
      // 2. Invoke Playwright runner as a child process using the safe reporter config
      const configPath = path.resolve(__dirname, 'playwright.auth-qualification.config.ts');
      const cliPath = path.resolve(process.cwd(), 'node_modules', '@playwright/test', 'cli.js');

      const relativeTestPath = 'tests/e2e/auth-qualification/00-tmp-deliberate-fail.spec.ts';
      const result = spawnSync(
        process.execPath,
        [cliPath, 'test', relativeTestPath, `--config=${configPath}`, '--project=sentinel-checks'],
        {
          encoding: 'utf-8',
          env: {
            ...process.env,
            AUTH_QUALIFICATION_READY: 'false',
          },
        }
      );

      // 3. Deliberate failure must result in exit code 1 (intended test failure)
      expect(result.status, 'Deliberate test failure must exit with code 1').toBe(1);

      const combinedOutput = `${result.stdout || ''}\n${result.stderr || ''}`;

      // 4. Assert zero leakage of fake secrets in runner stdout and stderr
      expect(combinedOutput.includes(fakeSecret), 'Output must NOT contain fake secret string').toBe(false);
      expect(combinedOutput.includes('<fake sentinel>'), 'Output must NOT contain <fake sentinel>').toBe(false);
      expect(combinedOutput.includes('SENTINEL_CHILD_PROCESS_SECRET_777'), 'Output must NOT contain sentinel token').toBe(false);

      // 5. Assert output contains sanitized redaction indicator
      expect(combinedOutput.includes('[REDACTED]'), 'Output must contain [REDACTED]').toBe(true);

      // 6. Assert no test artifact residue (traces, videos, screenshots)
      const testResultsDir = path.resolve(process.cwd(), 'test-results');
      if (fs.existsSync(testResultsDir)) {
        const artifacts = fs.readdirSync(testResultsDir);
        const hasLeakedArtifacts = artifacts.some(a => a.includes('deliberate-fail-sentinel'));
        expect(hasLeakedArtifacts, 'No trace or video artifacts should be created for failure test').toBe(false);
      }
    } finally {
      // 7. Always clean up temporary test file
      if (fs.existsSync(tmpTestPath)) {
        fs.unlinkSync(tmpTestPath);
      }
    }
  });
});
