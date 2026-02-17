import { test, expect } from '@playwright/test';
let AxeBuilder: typeof import('@axe-core/playwright').default | null = null;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  try {
    // Lazy load to avoid hard dependency when package isn't installed
    AxeBuilder = (await import('@axe-core/playwright')).default;
  } catch {
    AxeBuilder = null;
  }
});

// Global accessibility smoke: runs axe-core on key entry points.
test.describe('Accessibility (a11y)', () => {
  const urls = [
    { name: 'Home', path: '/' },
    { name: 'Login', path: '/login' },
    { name: 'Sign Up', path: '/signup' },
  ];

  for (const { name, path } of urls) {
    test(`Audit: ${name}`, async ({ page }) => {
      test.skip(!AxeBuilder, '@axe-core/playwright not installed');
      const baseUrl = process.env.NEXT_PUBLIC_WEB_APP_URL || 'http://localhost:3000';
      await page.goto(`${baseUrl}${path}`);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder!({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
});
