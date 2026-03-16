import { expect, test } from '@playwright/test';

test.describe('Admin Feature Flags API', () => {
  test('returns 401 without admin auth', async ({ request }) => {
    const response = await request.get('/api/admin/feature-flags');
    expect(response.status()).toBe(401);
  });
});
