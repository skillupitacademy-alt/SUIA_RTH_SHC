import { test, expect } from '@playwright/test';

test.describe('Quiz selection BFF flow', () => {
    test.skip(!process.env.E2E_BASE_URL, 'E2E_BASE_URL not set');

    test('loads quiz selection page and shows domains', async ({ page }) => {
        await page.goto(`${process.env.E2E_BASE_URL}/quiz/selection`);
        await expect(page.getByText('Select Domain_')).toBeVisible();
    });
});
