import { type Cookie,expect, test } from '@playwright/test';
import { setupCSPAudit } from '@tests/utils/csp-audit-collector';

import { adminAuthFixtures } from './fixtures/auth';

const ADMIN_UI_URL = adminAuthFixtures.ADMIN_UI_URL ?? 'https://admin.realtutorialhub.com';
const API_URL = adminAuthFixtures.API_URL ?? 'https://api.realtutorialhub.com';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN ?? '.realtutorialhub.com';

test.describe('Admin dashboard navigation keeps session', () => {
  test.beforeEach(({ page }) => {
    void setupCSPAudit(page);
  });

  test('navigating key dashboard areas does not trigger forced logout', async ({ page, request }) => {
    test.skip(ADMIN_UI_URL === undefined || ADMIN_UI_URL === null, 'NEXT_PUBLIC_ADMIN_URL not configured');
    test.skip(API_URL === undefined || API_URL === null, 'NEXT_PUBLIC_API_URL not configured');

    // Collect any circuit-breaker console messages
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.toLowerCase().includes('circuit breaker') || text.includes('Global 401')) {
        consoleMessages.push(text);
      }
    });

    // Login via API and inject cookies to avoid CF/UI variation
    const loginRes = await request.post(`${API_URL}/api/admin/auth/login`, {
      data: {
        email: process.env.TEST_ADMIN_EMAIL ?? 'superadmin@test.com',
        password: process.env.TEST_ADMIN_PASSWORD ?? 'super123',
      },
      headers: { origin: ADMIN_UI_URL },
    });
    expect(loginRes.ok(), `admin API login failed: ${loginRes.status()} ${await loginRes.text()}`).toBeTruthy();

    const rawCookies = loginRes
      .headersArray()
      .filter((h) => h.name.toLowerCase() === 'set-cookie')
      .map((h) => h.value);

    const setCookies = rawCookies.length > 0
      ? rawCookies
      : (loginRes.headers()['set-cookie'] !== undefined ? [loginRes.headers()['set-cookie'] as string] : []);

    const parsed: Cookie[] = setCookies.map((line) => {
      const parts = line.split(';').map((p) => p.trim());
      const [name, value] = parts[0].split('=');
      const domain = parts.find((p) => p.toLowerCase().startsWith('domain='))?.split('=')[1] ?? COOKIE_DOMAIN;
      const path = parts.find((p) => p.toLowerCase().startsWith('path='))?.split('=')[1] ?? '/';
      const secure = parts.some((p) => p.toLowerCase() === 'secure');
      const sameSitePart = parts.find((p) => p.toLowerCase().startsWith('samesite='))?.split('=')[1]?.toLowerCase();
      const sameSite: Cookie['sameSite'] =
        sameSitePart === 'none' ? 'None' : sameSitePart === 'lax' ? 'Lax' : 'Strict';
      const httpOnly = parts.some((p) => p.toLowerCase() === 'httponly');
      const expiresPart = parts.find((p) => p.toLowerCase().startsWith('expires='));
      const expires = expiresPart !== undefined
        ? Math.floor(new Date(expiresPart.split('=')[1]).getTime() / 1000)
        : Math.floor(Date.now() / 1000) + 3600;

      return { name, value, domain, path, secure, sameSite, httpOnly, expires };
    });
    await page.context().addCookies(parsed);

    // Core dashboard routes to exercise API calls
    const routes = [
      '/dashboard/performance',
      '/dashboard/control-center',
      '/dashboard/security',
      '/dashboard/users',
      '/questions',
      '/factory/question-generator',
    ];

    for (const path of routes) {
      await page.goto(`${ADMIN_UI_URL}${path}`, { waitUntil: 'domcontentloaded' });
      await expect(page).not.toHaveURL(/login/);

      // If the session expired banner shows up, fail fast
      const expired = page.getByText(/Session Expired/i);
      expect(await expired.isVisible()).toBeFalsy();

      // Still have admin cookies
      const cookies = await page.context().cookies();
      const hasAdminCookie = cookies.some((c) => c.name === 'admin_accessToken');
      expect(hasAdminCookie).toBeTruthy();
    }

    expect(consoleMessages, 'Circuit breaker triggered during navigation').toHaveLength(0);
  });
});
