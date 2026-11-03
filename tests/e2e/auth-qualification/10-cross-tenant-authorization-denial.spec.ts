import { test, expect } from './fixtures/auth.fixtures';
import { enforceReadinessBoundary } from './helpers/readiness';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

test.describe('Cross-Tenant Authorization Denial Qualification', () => {
  test('AQ-10: Learner token denied on admin endpoints and foreign tenant contexts', async ({ auth }, testInfo) => {
    enforceReadinessBoundary(testInfo, 'AQ-10', [
      SYNTHETIC_ACCOUNTS.SUIA_LEARNER.emailEnvVar,
      SYNTHETIC_ACCOUNTS.SUIA_LEARNER.passwordEnvVar,
    ]);

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.SUIA_LEARNER);
    await auth.loginViaUI('/login', creds.email, creds.password);

    // 1. Authorized Control Check: Verify session is active against a real endpoint
    const controlCheck = await auth.page.request.get('/api/auth/me');
    expect(controlCheck.status(), 'Control endpoint /api/auth/me must return 200 for active session').toBe(200);

    // 2. Attempt access to admin-only endpoint: Must be strictly denied with 401 or 403 (NOT 404)
    const adminCheck = await auth.page.request.get('/api/admin/overview');
    const isDenied = adminCheck.status() === 401 || adminCheck.status() === 403;
    expect(isDenied, 'Learner token on admin endpoint must receive HTTP 401 or 403').toBe(true);

    // 3. Cross-Tenant Context Manipulation: Send foreign x-brand header on refresh
    const crossTenantRefresh = await auth.page.request.post('/api/auth/refresh', {
      headers: {
        'x-brand': 'realtutorialhub',
      },
    });
    const isForeignRejected = [400, 401, 403].includes(crossTenantRefresh.status());
    expect(isForeignRejected, 'Foreign brand context on refresh must be rejected').toBe(true);
  });
});
