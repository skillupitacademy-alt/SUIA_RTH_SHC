import { Page, Response, APIResponse } from '@playwright/test';

const ADMIN_UI_URL = process.env.ADMIN_UI_URL || 'https://admin.realtutorialhub.com';
const API_URL = process.env.API_URL || 'https://api.realtutorialhub.com';

const defaultAdminEmail = process.env.TEST_ADMIN_EMAIL;
const defaultAdminPassword = process.env.TEST_ADMIN_PASSWORD;

async function setCookiesFromResponse(page: Page, resp: Response | APIResponse) {
  const rawSetCookie = resp.headers()['set-cookie'];
  if (!rawSetCookie) return;
  const cookies = rawSetCookie.split(',').map((c: string) => c.trim());
  await page.context().addCookies(
    cookies
      .map((cookieStr: string) => {
        const [nameValue, ...attrs] = cookieStr.split(';').map((p) => p.trim());
        const [name, value] = nameValue.split('=');
        const domainAttr = attrs.find((a) => a.toLowerCase().startsWith('domain='));
        const pathAttr = attrs.find((a) => a.toLowerCase().startsWith('path='));
        return {
          name,
          value,
          domain: domainAttr ? domainAttr.split('=')[1] : new URL(ADMIN_UI_URL).hostname,
          path: pathAttr ? pathAttr.split('=')[1] : '/',
          httpOnly: attrs.some((a) => a.toLowerCase() === 'httponly'),
          secure: attrs.some((a) => a.toLowerCase() === 'secure'),
          sameSite: (attrs.some((a) => a.toLowerCase() === 'samesite=none') ? 'None' : 'Lax') as
            | 'None'
            | 'Lax'
            | 'Strict'
            | undefined,
        };
      })
      .filter(Boolean)
  );
}

async function loginAdmin(
  page: Page,
  creds: { email?: string; password?: string } = {}
): Promise<void> {
  const email = creds.email || defaultAdminEmail;
  const password = creds.password || defaultAdminPassword;
  if (!email || !password) {
    throw new Error('TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD env vars are required for admin login');
  }

  const resp = await page.request.post(`${API_URL}/api/admin/auth/login`, {
    data: { email, password },
  });
  if (!resp.ok()) {
    throw new Error(`Admin login failed: ${resp.status()} ${await resp.text()}`);
  }
  await setCookiesFromResponse(page, resp);
}

async function clearState(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.removeItem('quiz-platform-admin-auth');
  });
}

async function hasAuth(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  const hasCookies = cookies.some(
    (c) => c.name === 'admin_accessToken' || c.name === 'admin_refreshToken'
  );
  const hasStore = await page.evaluate(
    () => localStorage.getItem('quiz-platform-admin-auth') !== null
  );
  return hasCookies || hasStore;
}

async function forceRefreshFail(page: Page) {
  await page.route('**/api/auth/refresh', (route) => {
    route.fulfill({ status: 401, body: 'forced refresh fail' });
  });
  await page.route('**/api/admin/auth/refresh', (route) => {
    route.fulfill({ status: 401, body: 'forced refresh fail' });
  });
}

async function shortenSession(page: Page) {
  const soon = new Date(Date.now() + 2 * 60 * 1000).toISOString();
  await page.route('**/api/admin/auth/me', (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ user: { isAdmin: true }, expiresAt: soon }),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

export const adminAuthFixtures = {
  ADMIN_UI_URL,
  API_URL,
  loginAdmin,
  clearState,
  hasAuth,
  forceRefreshFail,
  shortenSession,
};
