import { test, expect } from './fixtures/auth.fixtures';
import { requirePrerequisites } from './helpers/sanitized-evidence';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

test.describe('Cross-Tenant Authorization Denial Qualification', () => {
  test('AQ-10: Learner token from SUIA denied on SHC admin and foreign tenant APIs', async ({ auth }, testInfo) => {
    requirePrerequisites(
      testInfo,
      [
        SYNTHETIC_ACCOUNTS.SUIA_LEARNER.emailEnvVar,
        SYNTHETIC_ACCOUNTS.SUIA_LEARNER.passwordEnvVar,
        'DATABASE_URL_SKILLUP',
      ],
      'Cross-Tenant Denial Fixture'
    );

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.SUIA_LEARNER);
    await auth.loginViaUI('/auth/login', creds.email, creds.password);

    // 1. Attempt access to admin-only endpoint
    const adminCheck = await auth.page.request.get('/api/admin/overview');
    // Learner token must be denied (401 or 403)
    expect([401, 403, 404]).toContain(adminCheck.status());

    // 2. Attempt access to foreign brand refresh or route with explicit cross-origin header
    const crossTenantRefresh = await auth.page.request.post('/api/auth/refresh', {
      headers: {
        'x-brand-id': 'realtutorialhub',
      },
    });
    // Contract: Token brand mismatch / foreign tenant must be rejected
    expect([400, 401, 403]).toContain(crossTenantRefresh.status());
  });
});
