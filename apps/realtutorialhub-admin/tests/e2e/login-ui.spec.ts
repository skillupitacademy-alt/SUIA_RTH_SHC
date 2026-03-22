import { expect, test } from '@playwright/test';

const ADMIN_UI_URL = 'http://localhost:3002';

test.describe('Admin Login UI Consistency', () => {
    test.beforeEach(async ({ page }) => {
        console.log(`Navigating to ${ADMIN_UI_URL}/login`);
        await page.goto(`${ADMIN_UI_URL}/login`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('form', { timeout: 30000 });
        await page.screenshot({ path: 'tests/e2e/screenshots/login-initial.png' });
    });

    test('should have consistent label styling for Email and Password fields', async ({ page }) => {
        const emailLabel = page.locator('label[for="admin-login-email"]');
        const passwordLabel = page.locator('label[for="admin-login-password"]');

        // Verify Email Label
        await expect(emailLabel).toBeVisible({ timeout: 15000 });
        const emailClasses = await emailLabel.getAttribute('class');
        console.log(`Email label classes: ${emailClasses}`);
        
        await expect(emailLabel).toHaveClass(/text-\[10px\]/);
        await expect(emailLabel).toHaveClass(/font-black/);
        await expect(emailLabel).toHaveClass(/uppercase/);
        await expect(emailLabel).toHaveClass(/tracking-widest/);

        // Verify Password Label
        await expect(passwordLabel).toBeVisible({ timeout: 15000 });
        const passwordClasses = await passwordLabel.getAttribute('class');
        console.log(`Password label classes: ${passwordClasses}`);

        await expect(passwordLabel).toHaveClass(/text-\[10px\]/);
        await expect(passwordLabel).toHaveClass(/font-black/);
        await expect(passwordLabel).toHaveClass(/uppercase/);
        await expect(passwordLabel).toHaveClass(/tracking-widest/);
    });

    test('should have correctly aligned icons within input fields', async ({ page }) => {
        const emailFieldWrapper = page.locator('div.space-y-2:has(label[for="admin-login-email"]) .relative');
        const passwordFieldWrapper = page.locator('div.space-y-2:has(label[for="admin-login-password"]) .relative');

        // Verify Email Icon
        const emailIcon = emailFieldWrapper.locator('svg.lucide-mail');
        await expect(emailIcon).toBeVisible({ timeout: 15000 });
        await expect(emailIcon).toHaveClass(/absolute/);
        await expect(emailIcon).toHaveClass(/left-4/);
        await expect(emailIcon).toHaveClass(/top-4/);

        // Verify Password Icon
        const passwordIcon = passwordFieldWrapper.locator('svg.lucide-lock');
        await expect(passwordIcon).toBeVisible({ timeout: 15000 });
        await expect(passwordIcon).toHaveClass(/absolute/);
        await expect(passwordIcon).toHaveClass(/left-4/);
        await expect(passwordIcon).toHaveClass(/top-4/);
    });

    test('should not have label inside the relative icon wrappers of login fields', async ({ page }) => {
        const loginFields = [
            'div.space-y-2:has(label[for="admin-login-email"]) .relative',
            'div.space-y-2:has(label[for="admin-login-password"]) .relative'
        ];

        for (const selector of loginFields) {
            const wrapper = page.locator(selector);
            await expect(wrapper).toBeVisible({ timeout: 15000 });
            const labelCount = await wrapper.locator('label').count();
            if (labelCount > 0) {
                console.log(`Error: Label found inside relative wrapper: ${selector}`);
            }
            expect(labelCount).toBe(0);
        }
    });
});
