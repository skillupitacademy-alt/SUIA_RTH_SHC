import 'dotenv/config';
import { test, expect, type Cookie } from '@playwright/test';

const API_BASE = 'https://api.realtutorialhub.com';

type Role = 'admin' | 'user';

const cfg: Record<Role, { base: string; email?: string; password?: string; access: string; refresh: string }> = {
  admin: {
    base: 'https://admin.realtutorialhub.com',
    email: process.env.TEST_ADMIN_EMAIL,
    password: process.env.TEST_ADMIN_PASSWORD,
    access: 'admin_accessToken',
    refresh: 'admin_refreshToken',
  },
  user: {
    base: 'https://quiz.realtutorialhub.com',
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD,
    access: 'accessToken',
    refresh: 'refreshToken',
  },
};

for (const role of Object.keys(cfg) as Role[]) {
  test(`${role} login -> dashboard -> logout roundtrip`, async ({ page, request, context }) => {
    const creds = cfg[role];
    test.skip(!creds.email || !creds.password, `${role} creds not set`);

    if (role === 'admin') {
      // Use direct API login to avoid UI differences
      const res = await request.post(`${API_BASE}/api/admin/auth/login`, {
        data: { email: creds.email, password: creds.password },
        headers: { origin: creds.base },
      });
      expect(res.ok()).toBeTruthy();

      const setCookies =
        res
          .headersArray()
          .filter((h) => h.name.toLowerCase() === 'set-cookie')
          .map((h) => h.value) ||
        (res.headers()['set-cookie'] ? [res.headers()['set-cookie'] as string] : []);

      // Minimal cookie parser for Set-Cookie lines
      const parsed: Cookie[] = setCookies.map((line) => {
        const parts = line.split(';').map((p) => p.trim());
        const [name, value] = parts[0].split('=');
        const domain = parts.find((p) => p.toLowerCase().startsWith('domain='))?.split('=')[1] ?? '.realtutorialhub.com';
        const path = parts.find((p) => p.toLowerCase().startsWith('path='))?.split('=')[1] ?? '/';
        const secure = parts.some((p) => p.toLowerCase() === 'secure');
        const sameSitePart = parts.find((p) => p.toLowerCase().startsWith('samesite='))?.split('=')[1]?.toLowerCase();
        const sameSite: Cookie['sameSite'] =
          sameSitePart === 'none' ? 'None' : sameSitePart === 'lax' ? 'Lax' : 'Strict';
        const httpOnly = parts.some((p) => p.toLowerCase() === 'httponly');
        // If no Expires provided, give it a short lifetime so Playwright accepts the cookie shape
        const expiresPart = parts.find((p) => p.toLowerCase().startsWith('expires='));
        const expires = expiresPart
          ? Math.floor(new Date(expiresPart.split('=')[1]).getTime() / 1000)
          : Math.floor(Date.now() / 1000) + 3600; // 1 hour default

        return { name, value, domain, path, secure, sameSite, httpOnly, expires };
      });

      await context.addCookies(parsed);
    } else {
      // UI login for user flow
      await page.goto(`${creds.base}/login`);
      const emailInput = page.locator('input[name="email"], input[type="email"]').first();
      const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      await emailInput.fill(creds.email!);
      await passwordInput.fill(creds.password!);
      const loginButton = page.getByRole('button', { name: /log in|login|sign in/i }).first();
      await loginButton.click({ timeout: 10000 });

      const meResponse = await page.waitForResponse(
        (resp) => resp.url().includes('/api/auth/me') && resp.status() === 200,
        { timeout: 20000 }
      );
      expect(meResponse.ok()).toBeTruthy();
    }

    // 4) Assert cookies are present and properly scoped
    const cookies = await context.cookies(creds.base);
    const access = cookies.find((c) => c.name === creds.access);
    const refresh = cookies.find((c) => c.name === creds.refresh);
    expect(access).toBeTruthy();
    expect(refresh).toBeTruthy();
    expect(access?.secure).toBe(true);
    expect(refresh?.secure).toBe(true);
    expect(access?.sameSite).toBe('None');
    expect(refresh?.sameSite).toBe('None');

    // 5) Navigate to dashboard and ensure we stay there
    await page.goto(`${creds.base}/dashboard`);
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/dashboard/);

    // 6) Logout via API and confirm session is gone
    const logoutRes = await request.post(`${API_BASE}/api/auth/logout`, {
      headers: { origin: creds.base },
      data: {},
    });
    expect(logoutRes.status()).toBe(200);

    // 7) /auth/me should now be 401
    const meAfter = await request.get(`${API_BASE}/api/auth/me`, { headers: { origin: creds.base } });
    expect(meAfter.status()).toBe(401);
  });
}
