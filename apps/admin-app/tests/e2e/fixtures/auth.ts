import { Page } from '@playwright/test';

const ADMIN_UI_URL = process.env.NEXT_PUBLIC_ADMIN_URL;
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const defaultAdminEmail = process.env.TEST_ADMIN_EMAIL;
const defaultAdminPassword = process.env.TEST_ADMIN_PASSWORD;

async function loginAdmin(
  page: Page,
  creds: { email?: string; password?: string } = {}
): Promise<void> {
  const email = creds.email || defaultAdminEmail;
  const password = creds.password || defaultAdminPassword;
  if (!email || !password) {
    throw new Error('TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD env vars are required for admin login');
  }

  // Use the real UI flow to avoid domain/cookie parsing issues and mirror production.
  await page.goto(`${ADMIN_UI_URL}/login`, { waitUntil: 'domcontentloaded' });

  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ state: 'visible', timeout: 30000 });
  await emailInput.fill(email);

  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.waitFor({ state: 'visible', timeout: 30000 });
  await passwordInput.fill(password);

  // Button text is "AUTHENTICATE" on the admin login page.
  await page.getByRole('button', { name: /authenticate/i }).click();

  // Wait for the dashboard shell to appear (no networkidle on prod due to background pings).
  await page.waitForURL('**/', { timeout: 30000 });
  await page.getByText(/Sign Out|Logout/i).first().waitFor({ state: 'visible', timeout: 30000 });
}

async function clearState(page: Page) {
  // Move to a same-origin page so localStorage is accessible before clearing.
  await page.goto(`${ADMIN_UI_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.removeItem('quiz-platform-admin-auth');
    sessionStorage.clear();
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
  const soon = new Date(Date.now() + 90 * 1000).toISOString();
  await page.route('**/api/admin/auth/me', (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ user: { isAdmin: true }, expiresAt: soon }),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

async function mockRenewSession(page: Page) {
  const later = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  // Mock the refresh call that happens when "Stay Logged In" is clicked
  await page.route('**/api/admin/auth/refresh', (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ success: true, user: { isAdmin: true }, expiresAt: later }),
      headers: { 'Content-Type': 'application/json' },
    });
  });
  // Update the 'me' mock to also reflect the extension
  await page.route('**/api/admin/auth/me', (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ user: { isAdmin: true }, expiresAt: later }),
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
  mockRenewSession,
};
