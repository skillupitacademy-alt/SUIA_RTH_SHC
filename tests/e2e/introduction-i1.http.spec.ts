/**
 * Phase 3: Introduction Block I1 — HTTP Validation
 *
 * Tests HTTP-level contract for tutorial pages containing I1 blocks.
 * Validates route availability, status codes, and basic response integrity.
 *
 * SCOPE:
 * - HTTP 200 responses
 * - HTML content-type
 * - No 500/404 errors
 * - Auth redirect behavior
 * - Multi-brand validation (RTH + SUIA)
 *
 * OUT OF SCOPE:
 * - Browser rendering (see introduction-i1.browser.spec.ts)
 * - JavaScript execution
 * - I1 content validation
 */

import { expect, test } from '@playwright/test';

// Brand configurations
interface BrandConfig {
  name: 'RTH' | 'SUIA';
  baseUrl: string;
  email?: string;
  password?: string;
  tutorialPath: string;
}

function getRTHConfig(): BrandConfig {
  const base = process.env.RTH_BASE_URL ?? 'http://realtutorialhub.localhost:3003';
  return {
    name: 'RTH',
    baseUrl: base,
    email: process.env.RTH_EMAIL,
    password: process.env.RTH_PASSWORD,
    tutorialPath: '/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava',
  };
}

function getSUIAConfig(): BrandConfig {
  const base = process.env.SUIA_BASE_URL ?? 'http://skillup.localhost:3009';
  return {
    name: 'SUIA',
    baseUrl: base,
    email: process.env.SUIA_EMAIL,
    password: process.env.SUIA_PASSWORD,
    tutorialPath: '/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava',
  };
}

function validateBrandConfig(brand: BrandConfig): void {
  const missing: string[] = [];
  
  if (!brand.email) {
    missing.push(`${brand.name}_EMAIL`);
  }
  if (!brand.password) {
    missing.push(`${brand.name}_PASSWORD`);
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables for ${brand.name}: ${missing.join(', ')}\n` +
      `These variables must be set in .env.local or the test environment.`
    );
  }
}

const brands = [getRTHConfig(), getSUIAConfig()];

// Run tests for both brands
for (const brand of brands) {
  test.describe(`Introduction Block I1 — HTTP Contract [${brand.name}]`, () => {
    const tutorialUrl = `${brand.baseUrl}${brand.tutorialPath}`;

    test.beforeEach(() => {
      validateBrandConfig(brand);
    });

    test(`HTTP-1 [${brand.name}]: Unauthenticated request redirects to login`, async ({ request }) => {
      const response = await request.get(tutorialUrl, {
        maxRedirects: 0,
      });

      // Tutorial pages require authentication
      expect(
        [301, 302, 303, 307, 308],
        `Expected redirect status for unauthenticated request to ${brand.tutorialPath}`,
      ).toContain(response.status());

      const location = response.headers()['location'];
      expect(location, 'Redirect location header must be present').toBeTruthy();
      expect(
        location,
        'Unauthenticated users should be redirected to login',
      ).toContain('/login');
    });

    test(`HTTP-2 [${brand.name}]: Authenticated request returns 200 OK`, async ({ page }) => {
      // Login via browser to establish full authentication context
      await page.goto(`${brand.baseUrl}/login`, { waitUntil: 'networkidle' });
      await page.waitForSelector('input#email', { state: 'visible', timeout: 15000 });
      await page.fill('input#email', brand.email!);
      await page.fill('input#password', brand.password!);
      await page.waitForTimeout(1000); // React hydration
      
      // Wait for login response
      const loginResponsePromise = page.waitForResponse(
        (response) => {
          const url = response.url();
          return response.request().method() === 'POST' && url.includes('/api/auth/login');
        },
        { timeout: 35000 },
      );
      
      await page.click('button[type="submit"]');
      const loginResponse = await loginResponsePromise;
      
      expect(loginResponse.status(), `[${brand.name}] Login should succeed`).toBe(200);
      
      // Wait for navigation away from login
      await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 10000 });
      
      // Navigate to tutorial URL via browser (goes through middleware)
      const response = await page.goto(tutorialUrl, { waitUntil: 'domcontentloaded' });
      
      expect(
        response?.status(),
        `[${brand.name}] Tutorial page should return 200 OK for authenticated user`,
      ).toBe(200);

      const contentType = response?.headers()['content-type'] ?? '';
      expect(
        contentType,
        `[${brand.name}] Tutorial page should return HTML content`,
      ).toContain('text/html');
    });

    test(`HTTP-3 [${brand.name}]: Tutorial route does not return server error`, async ({ page }) => {
      // Login via browser
      await page.goto(`${brand.baseUrl}/login`, { waitUntil: 'networkidle' });
      await page.waitForSelector('input#email', { state: 'visible', timeout: 15000 });
      await page.fill('input#email', brand.email!);
      await page.fill('input#password', brand.password!);
      await page.waitForTimeout(1000);
      
      const loginResponsePromise = page.waitForResponse(
        (response) => response.request().method() === 'POST' && response.url().includes('/api/auth/login'),
        { timeout: 35000 },
      );
      
      await page.click('button[type="submit"]');
      await loginResponsePromise;
      await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 10000 });
      
      // Navigate to tutorial
      const response = await page.goto(tutorialUrl, { waitUntil: 'domcontentloaded' });

      expect(
        response?.status(),
        `[${brand.name}] Tutorial page should not return 5xx server error`,
      ).toBeLessThan(500);
    });

    test(`HTTP-4 [${brand.name}]: Tutorial route does not redirect to error pages`, async ({ page }) => {
      // Login via browser
      await page.goto(`${brand.baseUrl}/login`, { waitUntil: 'networkidle' });
      await page.waitForSelector('input#email', { state: 'visible', timeout: 15000 });
      await page.fill('input#email', brand.email!);
      await page.fill('input#password', brand.password!);
      await page.waitForTimeout(1000);
      
      const loginResponsePromise = page.waitForResponse(
        (response) => response.request().method() === 'POST' && response.url().includes('/api/auth/login'),
        { timeout: 35000 },
      );
      
      await page.click('button[type="submit"]');
      await loginResponsePromise;
      await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 10000 });
      
      // Navigate to tutorial
      await page.goto(tutorialUrl, { waitUntil: 'domcontentloaded' });
      const finalUrl = page.url();

      expect(
        finalUrl,
        `[${brand.name}] Tutorial page should not redirect to 500 error page`,
      ).not.toContain('/500');
      
      expect(
        finalUrl,
        `[${brand.name}] Tutorial page should not redirect to 404 error page`,
      ).not.toContain('/404');
    });
  });
}
