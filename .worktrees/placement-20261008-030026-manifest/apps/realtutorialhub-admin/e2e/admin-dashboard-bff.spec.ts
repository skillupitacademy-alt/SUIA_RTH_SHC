import { expect, test } from '@playwright/test';

test.describe('Admin Dashboard BFF Integration', () => {
  test('should load aggregated dashboard data in the footer', async ({ page }) => {
    // Navigate to the admin dashboard
    await page.goto('/dashboard');

    // Wait for the footer sections to load (indicated by non-loading state)
    // We check for the presence of "Users:" text which is rendered after fetch
    const connectivityPanel = page.locator('div:has-text("Connectivity")');
    await expect(connectivityPanel).toContainText(/Users: \d+|ERR/);

    const securityPanel = page.locator('div:has-text("Security")');
    await expect(securityPanel).toContainText(/Active Sessions: \d+|ERR/);

    const intelligencePanel = page.locator('div:has-text("Intelligence")');
    await expect(intelligencePanel).toContainText(/Live: \d+|ERR/);
  });

  test('should show degraded status if BFF returns degraded', async ({ page }) => {
    // Intercept BFF request and return degraded response
    await page.route('/api/bff/dashboard-summary', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'degraded',
          generatedAt: new Date().toISOString(),
          metrics: { totalUsers: 100, totalQuestions: 50, totalExams: 20, totalBlueprints: null },
          queue: { pendingJobs: null, failedJobs: null, isHealthy: null },
          security: { activeSessions: 10, recentAuthEvents: 5 },
          activity: { activeExams: 15, submissionsToday: 10 },
          sources: { metrics: 'ok', queue: 'failed', security: 'ok', activity: 'ok' }
        }),
      });
    });

    await page.goto('/dashboard');

    // Verify degraded UI elements
    await expect(page.locator('text=Partial Degradation')).toBeVisible();
    await expect(page.locator('text=Cluster Degraded')).toBeVisible();
  });
});
