import { test, expect } from '@playwright/test';
import {
  validateOriginSafety,
  checkReadinessPrerequisites,
  isChromiumExecutableAvailable,
  installNetworkOriginGuard,
} from './helpers/readiness';
import { sanitizeString, assertCookieAbsent, assertCookieExists } from './helpers/sanitized-evidence';
import {
  sanitizeText,
  isSafelyContainedInOwnedDir,
  getAllowlistedScenarioId,
  getAllowlistedProject,
  default as SafeQualificationReporter,
} from './helpers/safe-reporter';
import { guardedApiFetch } from './fixtures/auth.fixtures';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

test.describe('Task D Sentinel, Readiness & Redaction Harness Verification', () => {
  test('SENTINEL-01: validateOriginSafety rejects production domains, userinfo, and malformed URLs fail-closed', () => {
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

    // Userinfo credentials (user:pass@host) must fail closed
    expect(() => validateOriginSafety('http://user:secret@localhost:3000')).toThrow(/Userinfo credentials not permitted/);
    expect(() => validateOriginSafety('http://admin:pass123@skillup.localhost:3009')).toThrow(/Userinfo credentials not permitted/);

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

    // Scenario and project allowlist Derivation
    expect(getAllowlistedScenarioId('AQ-01: Valid user login')).toBe('AQ-01');
    expect(getAllowlistedScenarioId('AQ-04-SHC: Admin refresh')).toBe('AQ-04-SHC');
    expect(getAllowlistedScenarioId('SENTINEL-02: Redaction check')).toBe('SENTINEL-02');
    expect(getAllowlistedScenarioId('Dynamic arbitrary title with secret_pass')).toBe('[UNLISTED_SCENARIO]');
    expect(getAllowlistedScenarioId('')).toBe('[UNLISTED_SCENARIO]');

    expect(getAllowlistedProject('suia-chromium')).toBe('suia-chromium');
    expect(getAllowlistedProject('foreign-project')).toBe('[UNKNOWN_PROJECT]');
    expect(getAllowlistedProject(undefined)).toBe('[UNKNOWN_PROJECT]');
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

  test('SENTINEL-04: child-process deliberate failure suppresses bare errors, split stdout/stderr, fake titles, and cleans owned artifacts', () => {
    // 1. Set up dedicated temporary run root separate from workspace test-results
    const childOutputDir = path.resolve(__dirname, '.tmp-sentinel-child-artifacts');
    if (!fs.existsSync(childOutputDir)) {
      fs.mkdirSync(childOutputDir, { recursive: true });
    }

    // 2. Set up a foreign canary file OUTSIDE the child output root to verify it survives
    const canaryOutside = path.resolve(__dirname, '.canary-outside-sentinel-test.txt');
    fs.writeFileSync(canaryOutside, 'CANARY_OUTSIDE_MUST_SURVIVE', 'utf-8');

    // 3. Synthesize a temporary test file designed to deliberately throw an error containing bare, unlabelled fake credentials,
    // a fake secret in the dynamic test title, split stdout/stderr chunks, JSON payloads, and an owned artifact file
    const tmpTestPath = path.resolve(__dirname, '00-tmp-deliberate-fail.spec.ts');
    const relativeTestFile = '00-tmp-deliberate-fail.spec.ts';

    const secretInTitle = 'secret_title_token_abc999';
    const bareFakeSecret = 'bare_opaque_fake_credential_xyz999';
    const splitChunk1 = 'split_chunk_secret_part1_';
    const splitChunk2 = 'split_chunk_secret_part2_';
    const jsonFakeSecret = 'json_fake_secret_888';
    const cookieFakeSecret = 'cookie_fake_secret_777';
    const ownedArtifactSecret = 'owned_artifact_secret_payload_555';

    const testContent = `
import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('unlisted_title_containing_${secretInTitle}', async ({}, testInfo) => {
  // Write a synthetic artifact inside the owned run directory
  const ownedArtifactPath = path.join(testInfo.outputDir, 'synthetic-artifact.txt');
  fs.writeFileSync(ownedArtifactPath, '${ownedArtifactSecret}', 'utf-8');
  testInfo.attachments.push({
    name: 'synthetic-artifact',
    contentType: 'text/plain',
    path: ownedArtifactPath,
  });

  // Test stdout and stderr emitting split chunks
  process.stdout.write('${splitChunk1}');
  process.stdout.write('chunk_continuation\\n');
  process.stderr.write('${splitChunk2}');
  process.stderr.write('chunk_continuation\\n');

  // Throw bare opaque error containing unlabelled secrets, JSON, and cookies
  throw new Error('Test deliberate failure: ${bareFakeSecret} and {"secret":"${jsonFakeSecret}"} and Cookie: session=${cookieFakeSecret}');
});
`;
    fs.writeFileSync(tmpTestPath, testContent, 'utf-8');

    try {
      // 4. Invoke Playwright runner as a child process using the safe reporter config and childOutputDir
      const configPath = path.resolve(__dirname, 'playwright.auth-qualification.config.ts');
      const cliPath = path.resolve(process.cwd(), 'node_modules', '@playwright/test', 'cli.js');

      const result = spawnSync(
        process.execPath,
        [cliPath, 'test', relativeTestFile, `--config=${configPath}`, '--project=sentinel-checks'],
        {
          encoding: 'utf-8',
          env: {
            ...process.env,
            AUTH_QUALIFICATION_OUTPUT_DIR: childOutputDir,
            AUTH_QUALIFICATION_READY: 'false',
          },
        }
      );

      // 5. Deliberate failure must result in exit code 1 (intended test failure)
      expect(result.status, 'Deliberate test failure must exit with code 1').toBe(1);

      const combinedOutput = `${result.stdout || ''}\n${result.stderr || ''}`;

      // 6. Assert zero leakage of secret in title, bare secrets, split chunks, JSON keys, or cookies
      expect(combinedOutput.includes(secretInTitle), 'Output must NOT contain fake secret in test title').toBe(false);
      expect(combinedOutput.includes(bareFakeSecret), 'Output must NOT contain bare fake secret string').toBe(false);
      expect(combinedOutput.includes(splitChunk1), 'Output must NOT contain split stdout chunk 1').toBe(false);
      expect(combinedOutput.includes(splitChunk2), 'Output must NOT contain split stderr chunk 2').toBe(false);
      expect(combinedOutput.includes(jsonFakeSecret), 'Output must NOT contain JSON fake secret').toBe(false);
      expect(combinedOutput.includes(cookieFakeSecret), 'Output must NOT contain cookie fake secret').toBe(false);

      // 7. Assert output uses allowlisted scenario ID fallback ([UNLISTED_SCENARIO])
      expect(combinedOutput.includes('[UNLISTED_SCENARIO]'), 'Output must display allowlisted scenario ID placeholder').toBe(true);

      // 8. Assert output contains only safe fixed reason code
      expect(combinedOutput.includes('Reason: [INTENDED_OR_ASSERTION_FAILURE]'), 'Output must contain safe fixed reason code').toBe(true);

      // 9. Assert foreign canary OUTSIDE the run directory was strictly preserved
      expect(fs.existsSync(canaryOutside), 'Canary file outside owned directory must NOT be deleted').toBe(true);
      expect(fs.readFileSync(canaryOutside, 'utf-8')).toBe('CANARY_OUTSIDE_MUST_SURVIVE');

      // 10. Assert synthetic secret artifacts created by that run were NOT retained
      if (fs.existsSync(childOutputDir)) {
        const remainingFiles = fs.readdirSync(childOutputDir, { recursive: true }) as string[];
        const hasSecretArtifact = remainingFiles.some(
          f => f.includes('synthetic-artifact') || f.includes('error-context')
        );
        expect(hasSecretArtifact, 'Synthetic secret artifacts must not be retained').toBe(false);
      }
    } finally {
      // Clean up temporary files
      if (fs.existsSync(tmpTestPath)) {
        fs.unlinkSync(tmpTestPath);
      }
      if (fs.existsSync(canaryOutside)) {
        fs.unlinkSync(canaryOutside);
      }
      if (fs.existsSync(childOutputDir)) {
        fs.rmSync(childOutputDir, { recursive: true, force: true });
      }
    }
  });

  test('SENTINEL-05: canary preservation and path containment prevents deletion of foreign files outside owned directory', () => {
    const ownedDir = path.resolve(__dirname, '.tmp-containment-owned');
    const foreignDir = path.resolve(__dirname, '.tmp-containment-foreign');

    if (!fs.existsSync(ownedDir)) fs.mkdirSync(ownedDir, { recursive: true });
    if (!fs.existsSync(foreignDir)) fs.mkdirSync(foreignDir, { recursive: true });

    const ownedFile = path.resolve(ownedDir, 'owned-artifact.txt');
    const foreignCanary = path.resolve(foreignDir, 'foreign-canary.txt');
    const traversalPath = path.resolve(ownedDir, '..', '.tmp-containment-foreign', 'foreign-canary.txt');

    fs.writeFileSync(ownedFile, 'OWNED_ARTIFACT', 'utf-8');
    fs.writeFileSync(foreignCanary, 'FOREIGN_CANARY_DO_NOT_TOUCH', 'utf-8');

    try {
      // 1. isSafelyContainedInOwnedDir accurately distinguishes containment
      expect(isSafelyContainedInOwnedDir(ownedFile, ownedDir)).toBe(true);
      expect(isSafelyContainedInOwnedDir(foreignCanary, ownedDir)).toBe(false);
      expect(isSafelyContainedInOwnedDir(traversalPath, ownedDir)).toBe(false);
      expect(isSafelyContainedInOwnedDir(ownedDir, ownedDir)).toBe(false); // Directory itself is not an uninkable file
      expect(isSafelyContainedInOwnedDir('', ownedDir)).toBe(false);

      // 2. Reporter attachment cleanup in onTestEnd strictly protects foreign canary
      const reporter = new SafeQualificationReporter({ outputDir: ownedDir });
      const mockResult: any = {
        status: 'failed',
        duration: 10,
        attachments: [
          { name: 'foreign-canary', path: foreignCanary },
          { name: 'owned-artifact', path: ownedFile },
        ],
      };
      const mockTestCase: any = {
        title: 'SENTINEL-05: containment check',
        parent: { project: () => ({ name: 'sentinel-checks' }) },
      };

      reporter.onTestEnd(mockTestCase, mockResult);

      // Foreign canary must survive untouched
      expect(fs.existsSync(foreignCanary), 'Foreign canary must survive onTestEnd').toBe(true);
      expect(fs.readFileSync(foreignCanary, 'utf-8')).toBe('FOREIGN_CANARY_DO_NOT_TOUCH');

      // Owned file strictly inside ownedDir must be unlinked
      expect(fs.existsSync(ownedFile), 'Owned artifact must be unlinked onTestEnd').toBe(false);

      // 3. onEnd() cleans ownedDir but NEVER touches workspace test-results or foreign dirs
      reporter.onEnd();
      expect(fs.existsSync(ownedDir), 'ownedDir should be cleaned up by onEnd').toBe(false);
      expect(fs.existsSync(foreignCanary), 'Foreign directory must survive onEnd').toBe(true);
    } finally {
      if (fs.existsSync(ownedDir)) fs.rmSync(ownedDir, { recursive: true, force: true });
      if (fs.existsSync(foreignDir)) fs.rmSync(foreignDir, { recursive: true, force: true });
    }
  });

  test('SENTINEL-06: installNetworkOriginGuard rejects unapproved local hosts/ports and userinfo in browser routing', async () => {
    let capturedRouteHandler: ((route: any) => Promise<void>) | null = null;

    const mockBrowserContext: any = {
      route: async (_glob: string, handler: (route: any) => Promise<void>) => {
        capturedRouteHandler = handler;
      },
    };

    // Install guard with explicit project allowed origin set
    const allowedOrigins = ['http://skillup.localhost:3009'];
    await installNetworkOriginGuard(mockBrowserContext, allowedOrigins);
    expect(capturedRouteHandler).not.toBeNull();

    // Helper to evaluate a URL against the captured route guard
    const testRoutingUrl = async (url: string): Promise<'continued' | 'aborted'> => {
      let outcome: 'continued' | 'aborted' = 'aborted';
      const mockRoute: any = {
        request: () => ({ url: () => url }),
        abort: async (reason?: string) => {
          expect(reason).toBe('blockedbyclient');
          outcome = 'aborted';
        },
        continue: async () => {
          outcome = 'continued';
        },
      };
      await capturedRouteHandler!(mockRoute);
      return outcome;
    };

    // 1. Unapproved local port/host (the exact Sol probe scenario) must be ABORTED
    const unapprovedLocal = await testRoutingUrl('http://unapproved.localhost:61999/receive');
    expect(unapprovedLocal).toBe('aborted');

    // 2. Userinfo credentials in local URL must be ABORTED
    const userinfoLocal = await testRoutingUrl('http://user:pass@skillup.localhost:3009/dashboard');
    expect(userinfoLocal).toBe('aborted');

    // 3. Foreign localhost port must be ABORTED
    const foreignPort = await testRoutingUrl('http://skillup.localhost:3000/api/auth/me');
    expect(foreignPort).toBe('aborted');

    // 4. Unrelated external domain must be ABORTED
    const externalDomain = await testRoutingUrl('https://malicious.example.com/steal');
    expect(externalDomain).toBe('aborted');

    // 5. Production tenant domain must be ABORTED
    const prodDomain = await testRoutingUrl('https://user.skillupitacademy.com/login');
    expect(prodDomain).toBe('aborted');

    // 6. Explicitly approved project origin must be CONTINUED
    const approvedRequest = await testRoutingUrl('http://skillup.localhost:3009/dashboard');
    expect(approvedRequest).toBe('continued');

    const approvedApiRequest = await testRoutingUrl('http://skillup.localhost:3009/api/auth/me');
    expect(approvedApiRequest).toBe('continued');
  });

  test('SENTINEL-07: guardedApiFetch validates exact project origin, blocks foreign hosts, and checks redirects offline', async () => {
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

  test('SENTINEL-08: pre-fixture readiness evaluates project-to-account prerequisites before browser launch, asserting zero launches', () => {
    let fakeBrowserLaunchCount = 0;
    const fakeLaunchBrowser = () => {
      fakeBrowserLaunchCount++;
      return { fake: 'browser_instance' };
    };

    // Helper simulating the fixture's pre-launch guard pattern
    const attemptBrowserLaunch = (req: {
      projectName: string;
      projectOrigin?: string;
      requiredAccountVars?: string[];
    }): { launched: boolean; reason?: string } => {
      const readiness = checkReadinessPrerequisites(req);
      if (!readiness.ready) {
        return { launched: false, reason: readiness.reason };
      }
      fakeLaunchBrowser();
      return { launched: true };
    };

    const origReady = process.env.AUTH_QUALIFICATION_READY;
    const origBuild = process.env.TEST_BUILD_REVISION;
    const origIso = process.env.TEST_ISOLATED_ENVIRONMENT;
    const origSuiaEmail = process.env.TEST_SUIA_LEARNER_EMAIL;
    const origSuiaPass = process.env.TEST_SUIA_LEARNER_PASSWORD;

    try {
      // Case 1: Account credentials missing when other fields are ready -> ASSERT ZERO LAUNCHES
      process.env.AUTH_QUALIFICATION_READY = 'true';
      process.env.TEST_BUILD_REVISION = 'provenance-test-rev-123';
      process.env.TEST_ISOLATED_ENVIRONMENT = 'true';
      delete process.env.TEST_SUIA_LEARNER_EMAIL;
      delete process.env.TEST_SUIA_LEARNER_PASSWORD;

      const outcome1 = attemptBrowserLaunch({
        projectName: 'suia-chromium',
        projectOrigin: 'http://skillup.localhost:3009',
      });
      expect(outcome1.launched, 'Browser must NOT launch when project account variables are missing').toBe(false);
      expect(outcome1.reason).toContain('Approved synthetic account credentials missing');
      expect(fakeBrowserLaunchCount, 'Launch counter must remain 0').toBe(0);

      // Case 2: Unknown project name -> ASSERT ZERO LAUNCHES
      const outcome2 = attemptBrowserLaunch({
        projectName: 'unknown-rogue-project',
        projectOrigin: 'http://skillup.localhost:3009',
      });
      expect(outcome2.launched, 'Browser must NOT launch for unknown project').toBe(false);
      expect(outcome2.reason).toContain('Unknown project name not recognized');
      expect(fakeBrowserLaunchCount, 'Launch counter must remain 0').toBe(0);

      // Case 3: Missing build revision -> ASSERT ZERO LAUNCHES
      delete process.env.TEST_BUILD_REVISION;
      const outcome3 = attemptBrowserLaunch({
        projectName: 'suia-chromium',
        projectOrigin: 'http://skillup.localhost:3009',
        requiredAccountVars: [], // Explicitly empty account requirements
      });
      expect(outcome3.launched, 'Browser must NOT launch without build revision').toBe(false);
      expect(outcome3.reason).toContain('TEST_BUILD_REVISION');
      expect(fakeBrowserLaunchCount, 'Launch counter must remain 0').toBe(0);

      // Case 4: Missing or invalid origin -> ASSERT ZERO LAUNCHES
      process.env.TEST_BUILD_REVISION = 'provenance-test-rev-123';
      const outcome4 = attemptBrowserLaunch({
        projectName: 'suia-chromium',
        projectOrigin: '', // Empty origin
        requiredAccountVars: [],
      });
      expect(outcome4.launched, 'Browser must NOT launch with empty origin').toBe(false);
      expect(outcome4.reason).toContain('Explicit project base URL unset');
      expect(fakeBrowserLaunchCount, 'Launch counter must remain 0').toBe(0);

      // Case 5: Negative test (explicit requiredAccountVars: []) with valid isolated environment -> LAUNCH ALLOWED
      if (isChromiumExecutableAvailable()) {
        const outcome5 = attemptBrowserLaunch({
          projectName: 'suia-chromium',
          projectOrigin: 'http://skillup.localhost:3009',
          requiredAccountVars: [], // Negative test explicit no-credential requirement
        });
        expect(outcome5.launched, 'Negative test with certified environment must be permitted to launch').toBe(true);
        expect(fakeBrowserLaunchCount, 'Launch counter must increment to 1').toBe(1);

        // Case 6: Full isolated fake prerequisites + fake synthetic account credentials -> LAUNCH ALLOWED
        process.env.TEST_SUIA_LEARNER_EMAIL = 'synthetic.learner@skillup.test';
        process.env.TEST_SUIA_LEARNER_PASSWORD = 'SyntheticPassword123!';

        const outcome6 = attemptBrowserLaunch({
          projectName: 'suia-chromium',
          projectOrigin: 'http://skillup.localhost:3009',
        });
        expect(outcome6.launched, 'Certified project with accounts must be permitted to launch').toBe(true);
        expect(fakeBrowserLaunchCount, 'Launch counter must increment to 2').toBe(2);
      }
    } finally {
      // Restore previous environment variables
      if (origReady !== undefined) process.env.AUTH_QUALIFICATION_READY = origReady;
      else delete process.env.AUTH_QUALIFICATION_READY;

      if (origBuild !== undefined) process.env.TEST_BUILD_REVISION = origBuild;
      else delete process.env.TEST_BUILD_REVISION;

      if (origIso !== undefined) process.env.TEST_ISOLATED_ENVIRONMENT = origIso;
      else delete process.env.TEST_ISOLATED_ENVIRONMENT;

      if (origSuiaEmail !== undefined) process.env.TEST_SUIA_LEARNER_EMAIL = origSuiaEmail;
      else delete process.env.TEST_SUIA_LEARNER_EMAIL;

      if (origSuiaPass !== undefined) process.env.TEST_SUIA_LEARNER_PASSWORD = origSuiaPass;
      else delete process.env.TEST_SUIA_LEARNER_PASSWORD;
    }
  });
});
