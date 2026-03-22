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

  // 1. Navigate to login
  await page.goto(`${UI_URL}/login`, { waitUntil: 'domcontentloaded' });
  
  // 2. Fill and submit
  await page.getByLabel(/email/i, { exact: false }).fill(email);
  // The password field has an adjacent "show password" button; pick the input explicitly.
  await page.locator('input[type="password"], input[name="password"]').first().fill(password);
  await page.getByRole('button', { name: /login|sign in|authenticate|continue/i }).click();
  
  // 3. Wait for redirect
  await page.waitForURL('**/dashboard*', { timeout: 30000 });
  
  // 4. CRITICAL: Inject state into localStorage to persist across reloads/navs during tests
  // This prevents the "flash of unauthenticated state" during async zustand rehydration
  await page.evaluate((userData) => {
    const authState = {
      state: {
        user: userData,
        isAuthenticated: true,
        initialized: true,
        isSessionExpired: false,
        expiresAt: null
      },
      version: 0
    };
    localStorage.setItem('quiz-platform-auth', JSON.stringify(authState));
  }, { id: 'e2e-user', email, name: 'E2E Test User', role: 'user', onboarded: true, isAdmin: false });
}

async function clearState(page: Page) {
  await page.goto(`${UI_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.removeItem('quiz-platform-auth');
    sessionStorage.clear();
  });
}

export interface AuthCheckResult {
  isAuthenticated: boolean;
  reason: string;
}

async function getAuthDetail(page: Page): Promise<AuthCheckResult> {
  // 1. Try global diagnostic if available on current window
  const globalResult = await page.evaluate(() => {
    const diagnostic = (window as { __E2E_IS_AUTHENTICATED__?: () => boolean }).__E2E_IS_AUTHENTICATED__;
    if (typeof diagnostic === 'function') {
      return diagnostic();
    }
    return null;
  });
  
  if (globalResult === true) return { isAuthenticated: true, reason: 'Global Diagnostic returned true' };
  if (globalResult === false) return { isAuthenticated: false, reason: 'Global Diagnostic returned false' };

  // 2. Fallback to localStorage + cookies check
  const cookies = await page.context().cookies();
  const foundCookies = cookies.filter((c) => 
    c.name === 'accessToken' || 
    c.name === 'refreshToken' || 
    c.name === 'admin_accessToken' || 
    c.name === 'admin_refreshToken'
  );
  
  if (foundCookies.length > 0) {
    return { 
      isAuthenticated: true, 
      reason: `Found cookies: ${foundCookies.length}` 
    };
  }

  const storeResult = await page.evaluate(() => {
    try {
      const raw = localStorage.getItem('quiz-platform-auth');
      if (!raw) {
        return { ok: false, msg: 'No such key in localStorage' };
      }
      const auth = JSON.parse(raw);
      const isAuthed = auth?.state?.isAuthenticated === true;
      if (isAuthed) {
        return { ok: true, msg: 'Store isAuthenticated is true' };
      }
      return { ok: false, msg: `Store isAuthenticated is ${auth?.state?.isAuthenticated}` };
    } catch (e) {
      return { ok: false, msg: `Storage parse error: ${e}` };
    }
  });

  if (storeResult.ok) {
    return { isAuthenticated: true, reason: storeResult.msg };
  }

  return { isAuthenticated: false, reason: `Final check failed: ${storeResult.msg}` };
}

async function hasAuth(page: Page): Promise<boolean> {
  const result = await getAuthDetail(page);
  return result.isAuthenticated;
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
      body: JSON.stringify({ 
        user: { id: 'mock', email: 'test@test.com', name: 'Test User', role: 'user', onboarded: true, isAdmin: false }, 
        expiresAt: soon 
      }),
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
  getAuthDetail,
  forceRefreshFail,
  shortenSession,
};
