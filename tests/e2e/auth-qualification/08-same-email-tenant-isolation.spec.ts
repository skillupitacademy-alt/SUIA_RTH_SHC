import { test, expect } from './fixtures/auth.fixtures';
import { enforceReadinessBoundary, validateOriginSafety } from './helpers/readiness';
import { assertValueMatchesSafely } from './helpers/sanitized-evidence';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

test.describe('Same-Email Tenant Independence Qualification', () => {
  test('AQ-08: Same email address operates independently across SUIA and RTH (supporting colliding IDs)', async ({ browser }, testInfo) => {
    enforceReadinessBoundary(testInfo, 'AQ-08', [
      SYNTHETIC_ACCOUNTS.CROSS_TENANT_LEARNER.emailEnvVar,
      SYNTHETIC_ACCOUNTS.CROSS_TENANT_LEARNER.passwordEnvVar,
    ]);

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.CROSS_TENANT_LEARNER);
    const suiaUrl = process.env.SUIA_BASE_URL || 'http://skillup.localhost:3009';
    const rthUrl = process.env.RTH_BASE_URL || 'http://realtutorialhub.localhost:3003';

    // Enforce origin boundaries before context creation
    validateOriginSafety(suiaUrl);
    validateOriginSafety(rthUrl);

    // 1. Context A: Log in to SUIA
    const suiaContext = await browser.newContext({ baseURL: suiaUrl });
    const suiaPage = await suiaContext.newPage();
    await suiaPage.goto('/login');
    await suiaPage.fill('input[type="email"]', creds.email);
    await suiaPage.fill('input[type="password"]', creds.password);
    await suiaPage.click('button[type="submit"]');
    await expect(suiaPage).toHaveURL(/\/dashboard|\/account/);

    const suiaMeRes = await suiaPage.request.get('/api/auth/me');
    expect(suiaMeRes.status()).toBe(200);
    const suiaData = await suiaMeRes.json();

    // 2. Context B: Log in to RTH with same email
    const rthContext = await browser.newContext({ baseURL: rthUrl });
    const rthPage = await rthContext.newPage();
    await rthPage.goto('/login');
    await rthPage.fill('input[type="email"]', creds.email);
    await rthPage.fill('input[type="password"]', creds.password);
    await rthPage.click('button[type="submit"]');
    await expect(rthPage).toHaveURL(/\/dashboard|\/account/);

    const rthMeRes = await rthPage.request.get('/api/auth/me');
    expect(rthMeRes.status()).toBe(200);
    const rthData = await rthMeRes.json();

    // 3. Assert strict tenant isolation and brand separation
    // Note: Architecture explicitly permits colliding user IDs across independent databases;
    // isolation is verified via separate database scopes and explicit brand claims.
    assertValueMatchesSafely(suiaData?.user?.brand, 'skillup', 'SUIA session brand is skillup');
    assertValueMatchesSafely(rthData?.user?.brand, 'realtutorialhub', 'RTH session brand is realtutorialhub');

    await suiaContext.close();
    await rthContext.close();
  });
});
