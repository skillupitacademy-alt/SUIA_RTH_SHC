import { expect, test } from '@playwright/test';

const API_BASE_URL = process.env.ADMIN_E2E_API_URL ?? '';
const ADMIN_TOKEN = process.env.ADMIN_E2E_TOKEN ?? '';

test.describe('Admin field selection', () => {
  test('should ignore disallowed fields in admin questions list', async ({ request }) => {
    if (API_BASE_URL === '' || ADMIN_TOKEN === '') {
      test.skip(true, 'ADMIN_E2E_API_URL or ADMIN_E2E_TOKEN not set');
    }

    const res = await request.get(`${API_BASE_URL}/admin/questions?limit=1&fields=id,questionText,passwordHash`, {
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        'x-portal-identity': 'admin',
      },
    });

    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    const first = Array.isArray(json?.data) ? json.data[0] : undefined;
    expect(first).toBeDefined();
    expect(first?.passwordHash).toBeUndefined();
  });
});
