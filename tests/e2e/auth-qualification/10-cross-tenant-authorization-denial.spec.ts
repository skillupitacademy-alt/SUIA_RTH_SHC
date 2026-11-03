import { test } from './fixtures/auth.fixtures';

test.describe('Cross-Tenant Authorization Denial Qualification', () => {
  test('AQ-10: Learner token denied on admin endpoints and foreign tenant contexts', async ({}, testInfo) => {
    // Authorized admin control fixture for /api/admin/overview and verified cross-tenant mutation probe are not established
    testInfo.skip(
      true,
      '[NOT EXECUTED] AQ-10: Authorized admin control fixture for /api/admin/overview and verified cross-tenant mutation probe are not established. Cannot infer foreign-store isolation without positive control and non-disclosure probe.'
    );
  });
});
