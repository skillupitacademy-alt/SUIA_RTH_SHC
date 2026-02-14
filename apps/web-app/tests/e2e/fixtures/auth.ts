import { Page, Response, APIResponse } from '@playwright/test';

export const UI_URL = process.env.USER_UI_URL || 'https://quiz.realtutorialhub.com';
export const API_URL = process.env.API_URL || 'https://api.realtutorialhub.com';

const defaultEmail = process.env.TEST_USER_EMAIL;
const defaultPassword = process.env.TEST_USER_PASSWORD;

async function setCookiesFromResponse(page: Page, resp: Response | APIResponse) {
  const setCookieHeader = resp.headers()['set-cookie'];
  if (!setCookieHeader) return;
  const cookies = setCookieHeader.split(',').map((c: string) => c.trim());
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
          domain: domainAttr ? domainAttr.split('=')[1] : new URL(UI_URL).hostname,
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

async function loginUser(
  page: Page,
  creds: { email?: string; password?: string } = {}
): Promise<void> {
  const email = creds.email || defaultEmail;
  const password = creds.password || defaultPassword;
  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL/TEST_USER_PASSWORD env vars are required for user login');
  }

  const resp = await page.request.post(`${API_URL}/api/auth/login`, {
    data: { email, password },
  });
  if (!resp.ok()) {
    throw new Error(`User login failed: ${resp.status()} ${await resp.text()}`);
  }
  await setCookiesFromResponse(page, resp);
}

async function clearState(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.removeItem('quiz-platform-auth');
  });
}

async function hasAuth(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  const hasCookies = cookies.some((c) => c.name === 'accessToken' || c.name === 'refreshToken');
  const hasStore = await page.evaluate(() => localStorage.getItem('quiz-platform-auth') !== null);
  return hasCookies || hasStore;
}

async function forceRefreshFail(page: Page) {
  await page.route('**/api/auth/refresh', (route) => {
    route.fulfill({ status: 401, body: 'forced refresh fail' });
  });
}

async function shortenSession(page: Page) {
  const soon = new Date(Date.now() + 2 * 60 * 1000).toISOString();
  await page.route('**/api/auth/me', (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ session: { user: { id: 'mock' } }, expiresAt: soon }),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

export const authFixtures = {
  UI_URL,
  API_URL,
  loginUser,
  clearState,
  hasAuth,
  forceRefreshFail,
  shortenSession,
};
