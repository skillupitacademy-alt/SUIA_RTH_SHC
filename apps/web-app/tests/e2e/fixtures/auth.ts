import { Page } from '@playwright/test';

export const UI_URL = process.env.NEXT_PUBLIC_WEB_APP_URL;
export const API_URL = process.env.NEXT_PUBLIC_API_URL;

const defaultEmail = process.env.TEST_USER_EMAIL;
const defaultPassword = process.env.TEST_USER_PASSWORD;

async function loginUser(
  page: Page,
  creds: { email?: string; password?: string } = {}
): Promise<void> {
  const email = creds.email || defaultEmail;
  const password = creds.password || defaultPassword;
  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL/TEST_USER_PASSWORD env vars are required for user login');
  }

  // UI login to mirror real flow (no networkidle to avoid production pings)
  await page.goto(`${UI_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel(/email/i, { exact: false }).fill(email);
  await page.getByLabel(/password/i, { exact: false }).fill(password);
  await page.getByRole('button', { name: /login|sign in|authenticate|continue/i }).click();
  await page.waitForURL('**/dashboard*', { timeout: 30000 });

  // Optional: clear admin cookies to prevent cross-role collisions
  const cookies = await page.context().cookies();
  const filtered = cookies.filter(
    (c) => c.name !== 'admin_accessToken' && c.name !== 'admin_refreshToken'
  );
  await page.context().clearCookies();
  if (filtered.length) await page.context().addCookies(filtered);
}

async function clearState(page: Page) {
  // Move to a same-origin page so localStorage is accessible before clearing.
  await page.goto(`${UI_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.removeItem('quiz-platform-auth');
    sessionStorage.clear();
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
