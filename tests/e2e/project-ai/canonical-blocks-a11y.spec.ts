import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Developer regression spec for Canonical Block Accessibility & Modality Verification.
 *
 * NOTE: This is a developer regression test suite. The sole authoritative certification
 * gate is the isolated git worktree runner (composer_worktree_verifier.py).
 *
 * Covers:
 * - Canonical blocks: Introduction (I1), Definition (D1), Code (C1), Summary (S1), Objective (O1, O2, O3)
 * - Axe-core rules: WCAG 2.0 A/AA, WCAG 2.1 A/AA with explicit 'color-contrast' rule
 * - Modalities: Keyboard focus ring, prefers-reduced-motion, forced-colors, and responsive viewports
 */

const CANONICAL_BLOCKS = [
  { family: 'introduction', version: 'I1', title: 'Introduction' },
  { family: 'definition', version: 'D1', title: 'Definition' },
  { family: 'code', version: 'C1', title: 'Code' },
  { family: 'summary', version: 'S1', title: 'Summary' },
  { family: 'objective', version: 'O1', title: 'Objective O1' },
  { family: 'objective', version: 'O2', title: 'Objective O2' },
  { family: 'objective', version: 'O3', title: 'Objective O3' },
];

test.describe('Canonical Blocks — Browser Accessibility & Modality Regression', () => {
  for (const block of CANONICAL_BLOCKS) {
    test.describe(`${block.title} (${block.family.toUpperCase()} ${block.version})`, () => {
      test('WCAG 2.1 AA accessibility audit & contrast compliance', async ({ page }) => {
        const baseURL = process.env.PROJECT_AI_BASE_URL || 'http://localhost:3000';
        const targetUrl = `${baseURL}/tools/tutorial-page-content`;

        // Navigate to Composer
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // If redirected to login, authenticate
        if (page.url().includes('/login')) {
          const emailInput = (await page.$('input#email')) || (await page.$('input[type="email"]'));
          if (emailInput) {
            await emailInput.fill('admin@skillhubcore.in');
            const pwdInput = (await page.$('input#password')) || (await page.$('input[type="password"]'));
            if (pwdInput) await pwdInput.fill('testing');
            const submitBtn = (await page.$('button[type="submit"]')) || (await page.$('button:has-text("Sign In")'));
            if (submitBtn) await submitBtn.click();
            await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 }).catch(() => {});
          }
          if (!page.url().includes('/tools/tutorial-page-content')) {
            await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
          }
        }

        // Wait for block selector
        const select = page.locator('#select-block, select').first();
        await expect(select).toBeVisible({ timeout: 20000 });

        // Select family
        await select.selectOption({ label: block.family });

        // Select version if selector is present
        const versionSelect = page.locator('#select-version').first();
        if (await versionSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
          await versionSelect.selectOption({ value: block.version }).catch(() => {});
        }

        // Switch to Active Block preview mode if present
        const activeBlockBtn = page.locator('button:has-text("Active Block")').first();
        if (await activeBlockBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await activeBlockBtn.click();
        }

        // Target rendered container
        const blockContainer = page.locator(`[data-block-type="${block.family}"]`).first();
        await expect(blockContainer).toBeVisible({ timeout: 10000 });

        // 1. Run Axe-core with WCAG tags and explicit color-contrast rule
        const axeResults = await new AxeBuilder({ page })
          .include(`[data-block-type="${block.family}"]`)
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .withRules(['color-contrast'])
          .analyze();

        expect(
          axeResults.violations,
          `Axe WCAG violations detected on ${block.family} ${block.version}: ${JSON.stringify(
            axeResults.violations.map((v) => ({ id: v.id, impact: v.impact, description: v.description })),
            null,
            2
          )}`
        ).toEqual([]);

        // 2. Keyboard Navigation Check
        const focusables = blockContainer.locator(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"], [role="button"]'
        );
        const focusableCount = await focusables.count();
        if (focusableCount > 0) {
          await focusables.first().focus();
          const hasVisibleFocus = await page.evaluate((selector) => {
            const active = document.activeElement;
            if (!active) return false;
            const style = window.getComputedStyle(active);
            const outline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
            const shadow = style.boxShadow && style.boxShadow !== 'none';
            return Boolean(outline || shadow);
          }, `[data-block-type="${block.family}"]`);
          expect(hasVisibleFocus, 'Interactive element in block must display visible focus ring').toBe(true);
        }

        // 3. Reduced Motion Check
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const unsuppressedAnimations = await page.evaluate((selector) => {
          const el = document.querySelector(selector);
          if (!el) return 0;
          let count = 0;
          for (const node of [el, ...el.querySelectorAll('*')]) {
            const style = window.getComputedStyle(node);
            if (style.animationName && style.animationName !== 'none') {
              if (parseFloat(style.animationDuration) > 0.05) count++;
            }
          }
          return count;
        }, `[data-block-type="${block.family}"]`);
        expect(unsuppressedAnimations, 'All animations must be suppressed under prefers-reduced-motion').toBe(0);
        await page.emulateMedia({ reducedMotion: 'no-preference' });

        // 4. Forced Colors Check
        await page.emulateMedia({ forcedColors: 'active' });
        const hasBorder = await page.evaluate((selector) => {
          const el = document.querySelector(selector);
          if (!el) return true;
          const style = window.getComputedStyle(el);
          return style.borderStyle !== 'none' || style.outlineStyle !== 'none';
        }, `[data-block-type="${block.family}"]`);
        expect(hasBorder, 'Container must maintain high-contrast boundaries in forced-colors mode').toBe(true);
        await page.emulateMedia({ forcedColors: 'none' });

        // 5. Responsive Viewport Check
        for (const width of [375, 768, 1280]) {
          await page.setViewportSize({ width, height: 800 });
          await page.waitForTimeout(100);
          const overflow = await page.evaluate((selector) => {
            const el = document.querySelector(selector);
            return el ? el.scrollWidth > window.innerWidth + 2 : false;
          }, `[data-block-type="${block.family}"]`);
          expect(overflow, `Block should not horizontally overflow at ${width}px viewport`).toBe(false);
        }
      });
    });
  }
});
