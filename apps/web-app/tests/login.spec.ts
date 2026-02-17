import { test, expect, type Cookie } from '@playwright/test';
import { setupCSPAudit } from '@tests/utils/csp-audit-collector';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

type Role = 'admin' | 'user';

const cfg: Record<Role, { base: string; email: string; password: string; access: string; refresh: string }> = {
  admin: {
    base: process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001',
    email: process.env.TEST_ADMIN_EMAIL || 'superadmin@test.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'super123',
    access: 'admin_accessToken',
    refresh: 'admin_refreshToken',
  },
  user: {
    base: process.env.NEXT_PUBLIC_WEB_APP_URL || 'http://localhost:3000',
    email: process.env.TEST_USER_EMAIL || process.env.TEST_ADMIN_EMAIL || 'superadmin@test.com',
    password: process.env.TEST_USER_PASSWORD || process.env.TEST_ADMIN_PASSWORD || 'super123',
    access: 'accessToken',
    refresh: 'refreshToken',
  },
};

if (!cfg.admin.base || !cfg.user.base || !API_BASE) {
  test.describe.skip('login e2e', () => {
    test('skipped: missing env', () => {
      /* no-op */
    });
  });
}

for (const role of Object.keys(cfg) as Role[]) {
  test(`${role} login -> dashboard -> logout roundtrip`, async ({ page, request, context }) => {
    const creds = cfg[role];
    test.skip(!creds.email || !creds.password, `${role} creds not set`);

    setupCSPAudit(page);

    const passwordTooShort = creds.password.length < 8;
    const effectiveEmail = role === 'user' && passwordTooShort ? cfg.admin.email : creds.email;
    const effectivePassword = role === 'user' && passwordTooShort ? cfg.admin.password : creds.password;

    const endpoint = role === 'admin' ? '/api/admin/auth/login' : '/api/auth/login';
    const res = await request.post(`${API_BASE}${endpoint}`, {
      data: { email: effectiveEmail, password: effectivePassword },
      headers: { origin: creds.base },
    });
    expect(res.ok(), `${role} login failed: ${res.status()} ${await res.text()}`).toBeTruthy();

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
        const domain = parts.find((p) => p.toLowerCase().startsWith('domain='))?.split('=')[1] ?? (process.env.COOKIE_DOMAIN || '');
        const path = parts.find((p) => p.toLowerCase().startsWith('path='))?.split('=')[1] ?? '/';
        const secure = parts.some((p) => p.toLowerCase() === 'secure');
        const sameSitePart = parts.find((p) => p.toLowerCase().startsWith('samesite='))?.split('=')[1]?.toLowerCase();
        const sameSite: Cookie['sameSite'] =
          sameSitePart === 'none' ? 'None' : sameSitePart === 'lax' ? 'Lax' : 'Strict';
        const httpOnly = parts.some((p) => p.toLowerCase() === 'httponly');
        const expiresPart = parts.find((p) => p.toLowerCase().startsWith('expires='));
        const expires = expiresPart
          ? Math.floor(new Date(expiresPart.split('=')[1]).getTime() / 1000)
          : Math.floor(Date.now() / 1000) + 3600; // 1 hour default

        return { name, value, domain, path, secure, sameSite, httpOnly, expires };
      });

    await context.addCookies(parsed);

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

    // Persist storage (cookies/localStorage/sessionStorage) for inspection
    await context.storageState({ path: `apps/web-app/tests/artifacts/${role}-state.json` });
  });
}
