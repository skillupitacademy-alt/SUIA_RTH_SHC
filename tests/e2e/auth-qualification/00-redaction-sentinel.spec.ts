import { test, expect } from '@playwright/test';
import { validateOriginSafety, checkReadinessPrerequisites, isChromiumExecutableAvailable } from './helpers/readiness';
import { sanitizeString, assertCookieAbsent, assertCookieExists } from './helpers/sanitized-evidence';
import { sanitizeText } from './helpers/safe-reporter';
import { guardedApiFetch } from './fixtures/auth.fixtures';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

test.describe('Task D Sentinel, Readiness & Redaction Harness Verification', () => {
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

  test('SENTINEL-02: sanitizeString and sanitizeText utility functions redact sensitive patterns', () => {
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

  test('SENTINEL-04: child-process deliberate test failure suppresses bare errors, split stdout/stderr, and retained artifacts', () => {
    // 1. Synthesize a temporary test file designed to deliberately throw an error containing bare, unlabelled fake credentials,
    // split stdout/stderr chunks, JSON payloads, and cookies
    const tmpTestPath = path.resolve(__dirname, '00-tmp-deliberate-fail.spec.ts');
    const relativeTestPath = 'tests/e2e/auth-qualification/00-tmp-deliberate-fail.spec.ts';

    const bareFakeSecret = 'bare_opaque_fake_credential_xyz999';
    const splitChunk1 = 'split_chunk_secret_part1_';
    const splitChunk2 = 'split_chunk_secret_part2_';
    const jsonFakeSecret = 'json_fake_secret_888';
    const cookieFakeSecret = 'cookie_fake_secret_777';

    const testContent = `
import { test } from '@playwright/test';

test('deliberate failure with bare and split fake payloads', () => {
  // Test stdout and stderr emitting split chunks
  console.log('${splitChunk1}' + 'alpha');
  console.error('${splitChunk2}' + 'beta');

  // Throw bare opaque error containing unlabelled secrets, JSON, and cookies
  throw new Error('Test deliberate failure: ${bareFakeSecret} and {"secret":"${jsonFakeSecret}"} and Cookie: session=${cookieFakeSecret}');
});
`;
    fs.writeFileSync(tmpTestPath, testContent, 'utf-8');

    try {
      // 2. Invoke Playwright runner as a child process using the safe reporter config
      const configPath = path.resolve(__dirname, 'playwright.auth-qualification.config.ts');
      const cliPath = path.resolve(process.cwd(), 'node_modules', '@playwright/test', 'cli.js');

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

      // 4. Assert zero leakage of bare secrets, split chunks, JSON keys, or cookies in runner stdout and stderr
      expect(combinedOutput.includes(bareFakeSecret), 'Output must NOT contain bare fake secret string').toBe(false);
      expect(combinedOutput.includes(splitChunk1), 'Output must NOT contain split stdout chunk 1').toBe(false);
      expect(combinedOutput.includes(splitChunk2), 'Output must NOT contain split stderr chunk 2').toBe(false);
      expect(combinedOutput.includes(jsonFakeSecret), 'Output must NOT contain JSON fake secret').toBe(false);
      expect(combinedOutput.includes(cookieFakeSecret), 'Output must NOT contain cookie fake secret').toBe(false);

      // 5. Assert output contains only allowlisted reason code
      expect(combinedOutput.includes('Reason: [INTENDED_OR_ASSERTION_FAILURE]'), 'Output must contain safe fixed reason code').toBe(true);

      // 6. Assert no test artifact residue (traces, videos, screenshots)
      const testResultsDir = path.resolve(process.cwd(), 'test-results');
      if (fs.existsSync(testResultsDir)) {
        const artifacts = fs.readdirSync(testResultsDir);
        const hasLeakedArtifacts = artifacts.some(a => a.includes('00-tmp-deliberate-fail'));
        expect(hasLeakedArtifacts, 'No trace or video artifacts should be created for failure test').toBe(false);
      }
    } finally {
      // 7. Always clean up temporary test file
      if (fs.existsSync(tmpTestPath)) {
        fs.unlinkSync(tmpTestPath);
      }
    }
  });

  test('SENTINEL-05: guardedApiFetch validates exact project origin, blocks foreign hosts, and checks redirects offline', async () => {
    const allowedOrigin = 'http://skillup.localhost:3009';

    // Mock APIRequestContext to test offline transport guarding without network activity
    const mockRequestContext: any = {
      fetch: async (url: string) => {
        if (url.includes('/redirect-to-forbidden')) {
          return {
            status: () => 302,
            headers: () => ({ location: 'https://user.skillupitacademy.com/login' }),
          };
        }
        if (url.includes('/redirect-to-foreign-port')) {
          return {
            status: () => 302,
            headers: () => ({ location: 'http://localhost:9999/unexpected' }),
          };
        }
        return {
          status: () => 200,
          headers: () => ({}),
        };
      },
    };

    // 1. Direct call to forbidden production URL fails closed before fetch
    await expect(
      guardedApiFetch(mockRequestContext, allowedOrigin, 'GET', 'https://user.skillupitacademy.com/api/test')
    ).rejects.toThrow(/\[GUARDED_API SAFETY VIOLATION\]/);

    // 2. Direct call to non-matching origin fails closed before fetch
    await expect(
      guardedApiFetch(mockRequestContext, allowedOrigin, 'GET', 'http://realtutorialhub.localhost:3003/api/test')
    ).rejects.toThrow(/\[GUARDED_API SAFETY VIOLATION\]/);

    // 3. 302 Redirect to forbidden production origin is intercepted and rejected
    await expect(
      guardedApiFetch(mockRequestContext, allowedOrigin, 'GET', '/redirect-to-forbidden')
    ).rejects.toThrow(/\[GUARDED_API SAFETY VIOLATION\].*Redirect to non-allowed origin/);

    // 4. 302 Redirect to foreign port is intercepted and rejected
    await expect(
      guardedApiFetch(mockRequestContext, allowedOrigin, 'GET', '/redirect-to-foreign-port')
    ).rejects.toThrow(/\[GUARDED_API SAFETY VIOLATION\].*Redirect to non-allowed origin/);

    // 5. Valid call to matching origin passes validation
    const validRes = await guardedApiFetch(mockRequestContext, allowedOrigin, 'GET', '/api/auth/me');
    expect(validRes.status()).toBe(200);
  });

  test('SENTINEL-06: checkReadinessPrerequisites enforces all required provenance, build, and origin fields', () => {
    // 1. Missing master manifest flag returns unready
    const res1 = checkReadinessPrerequisites({
      projectName: 'test-project',
      projectOrigin: 'http://localhost:3000',
    });
    expect(res1.ready).toBe(false);
    expect(res1.reason).toContain('Master readiness manifest');

    // 2. Missing build revision returns unready
    const origReady = process.env.AUTH_QUALIFICATION_READY;
    try {
      process.env.AUTH_QUALIFICATION_READY = 'true';
      const res2 = checkReadinessPrerequisites({
        projectName: 'test-project',
        projectOrigin: 'http://localhost:3000',
      });
      expect(res2.ready).toBe(false);
      expect(res2.reason).toContain('TEST_BUILD_REVISION');
    } finally {
      process.env.AUTH_QUALIFICATION_READY = origReady;
    }

    // 3. Executable availability check returns boolean without throwing
    const isChromiumAvail = isChromiumExecutableAvailable();
    expect(typeof isChromiumAvail).toBe('boolean');
  });
});
