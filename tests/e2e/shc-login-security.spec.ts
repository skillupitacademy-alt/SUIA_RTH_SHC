import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.SHC_ADMIN_URL;
if (!baseUrl) throw new Error('SHC_ADMIN_URL is required for the isolated Q08 browser checks');
const screenshots = path.join(process.cwd(), '.evidence', 'screenshots', 'critical-v4-20261111');
const canaryEmail = 'q08-fixture@example.invalid';
const canaryPassword = 'q08-never-valid-canary';

test.use({ viewport: { width: 1440, height: 900 } });
test.setTimeout(180000);

function observeCredentialExposure(page: Page) {
  const failures: string[] = [];
  const hasCredential = (value: string) => [canaryEmail, canaryPassword].some(canary =>
    [canary, encodeURIComponent(canary)].some(candidate => value.includes(candidate)));
  page.on('request', request => {
    const url = new URL(request.url());
    const referrer = request.headers().referer ?? '';
    if (url.searchParams.has('password') || url.searchParams.has('email')) failures.push('credential query parameter');
    if ([url.href, referrer].some(hasCredential)) {
      failures.push('credential in URL or referrer');
    }
  });
  page.on('console', message => {
    if (hasCredential(message.text())) failures.push('credential in browser console');
  });
  page.on('pageerror', error => {
    if (hasCredential(error.message)) failures.push('credential in browser exception');
  });
  page.on('framenavigated', frame => {
    if (hasCredential(frame.url())) failures.push('credential in navigation history');
  });
  return failures;
}

test('Q08 blocks login without JavaScript and declares a safe native POST', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const exposure = observeCredentialExposure(page);
  try {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('form')).toHaveAttribute('method', /post/i);
    await expect(page.locator('form')).toHaveAttribute('action', '/login');
    await expect(page.locator('#email')).toBeDisabled();
    await expect(page.locator('#password')).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Sign In to Console' })).toBeDisabled();
    await page.keyboard.press('Enter');
    fs.mkdirSync(screenshots, { recursive: true });
    await page.screenshot({ path: path.join(screenshots, 'q08-no-javascript.png'), fullPage: true });
    expect(exposure).toEqual([]);
  } finally {
    await context.close();
  }
});

test('Q08 keeps the form disabled while hydration scripts are delayed', async ({ page }) => {
  const exposure = observeCredentialExposure(page);
  let releaseScripts!: () => void;
  const scriptsReady = new Promise<void>(resolve => { releaseScripts = resolve; });
  let delayedScripts = 0;
  await page.route('**/*', async route => {
    if (route.request().resourceType() === 'script') {
      delayedScripts += 1;
      await scriptsReady;
    }
    await route.continue();
  });
  try {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'commit' });
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('#email')).toBeDisabled();
    await expect(page.locator('#password')).toBeDisabled();
    await expect(page.locator('button[type=submit]')).toBeDisabled();
    await expect.poll(() => delayedScripts).toBeGreaterThan(0);
    await page.keyboard.press('Enter');
    expect(new URL(page.url()).pathname).toBe('/login');
    fs.mkdirSync(screenshots, { recursive: true });
    await page.screenshot({ path: path.join(screenshots, 'q08-before-hydration.png'), fullPage: true });
  } finally {
    releaseScripts();
  }
  await expect(page.locator('#email')).toBeEnabled({ timeout: 60000 });
  await expect(page.locator('#password')).toBeEnabled();
  expect(exposure).toEqual([]);
});

test('Q08 native submission remains a body-only POST when controls are forcibly enabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const exposure = observeCredentialExposure(page);
  let nativeSubmissions = 0;
  await page.route('**/login', async route => {
    if (route.request().method() === 'GET') return route.continue();
    nativeSubmissions += 1;
    expect(route.request().method()).toBe('POST');
    expect(new URL(route.request().url()).search).toBe('');
    const body = new URLSearchParams(route.request().postData() ?? '');
    expect(body.get('email')).toBe(canaryEmail);
    expect(body.get('password')).toBe(canaryPassword);
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<p>Intercepted synthetic native POST</p>' });
  });
  try {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#password')).toBeDisabled();
    const posted = page.waitForRequest(request => request.method() === 'POST' && new URL(request.url()).pathname === '/login');
    await page.evaluate(({ email, password }) => {
      const emailInput = document.querySelector<HTMLInputElement>('#email')!;
      const passwordInput = document.querySelector<HTMLInputElement>('#password')!;
      emailInput.disabled = false;
      passwordInput.disabled = false;
      emailInput.value = email;
      passwordInput.value = password;
      document.querySelector<HTMLFormElement>('form')!.requestSubmit();
    }, { email: canaryEmail, password: canaryPassword });
    await posted;
    await expect(page.getByText('Intercepted synthetic native POST')).toBeVisible();
    expect(nativeSubmissions).toBe(1);
    expect(exposure).toEqual([]);
  } finally {
    await context.close();
  }
});

for (const submission of ['click', 'Enter'] as const) {
test(`Q08 hydrated ${submission} uses one JSON POST and the sanitized redirect`, async ({ page }) => {
  const exposure = observeCredentialExposure(page);
  let submissions = 0;
  await page.route('**/api/auth/login', async route => {
    submissions += 1;
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toEqual({ email: canaryEmail, password: canaryPassword, platform: 'skillhubcore' });
    await route.fulfill({ json: { user: { id: 'synthetic-admin', email: canaryEmail, role: 'admin', isAdmin: true } } });
  });
  await page.goto(`${baseUrl}/login?redirect=%2Fquestions`, { waitUntil: 'networkidle', timeout: 180000 });
  await expect(page.locator('#email')).toBeEnabled();
  await page.locator('#email').fill(canaryEmail);
  await page.locator('#password').fill(canaryPassword);
  const redirectRequest = page.waitForRequest(request => new URL(request.url()).pathname === '/questions');
  if (submission === 'click') await page.getByRole('button', { name: 'Sign In to Console' }).click();
  else await page.locator('#password').press('Enter');
  await redirectRequest;
  expect(submissions).toBe(1);
  expect(exposure).toEqual([]);
});
}

test('Q08 hides upstream diagnostics after hydrated submission', async ({ page }) => {
  const exposure = observeCredentialExposure(page);
  await page.route('**/api/auth/login', route => route.fulfill({ status: 500, json: { message: 'private-diagnostic-canary' } }));
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle', timeout: 180000 });
  await expect(page.locator('#email')).toBeEnabled();
  await page.locator('#email').fill(canaryEmail);
  await page.locator('#password').fill(canaryPassword);
  await page.getByRole('button', { name: 'Sign In to Console' }).click();
  await expect(page.getByText('Authentication service is unavailable. Try again.')).toBeVisible();
  await expect(page.getByText('private-diagnostic-canary')).toHaveCount(0);
  await page.locator('#email').clear();
  await page.locator('#password').clear();
  fs.mkdirSync(screenshots, { recursive: true });
  await page.screenshot({ path: path.join(screenshots, 'q08-safe-login-error.png'), fullPage: true });
  expect(exposure).toEqual([]);
});
