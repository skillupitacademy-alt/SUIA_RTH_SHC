#!/usr/bin/env node
/**
 * Versioned Composer Worktree Browser & Accessibility Runner.
 *
 * M2.9 R4 ARCHITECTURAL INVARIANT:
 * - Executed from inside the detached verification worktree against the ephemeral preview server.
 * - Runs Playwright and @axe-core/playwright against the isolated placement commit.
 * - Emits one structured JSON result on stdout containing:
 *   1. Dropdown registration and DOM identity verification
 *   2. Axe-core accessibility audit (WCAG tags + withRules(['color-contrast']))
 *   3. Modality checks: keyboard navigation, reduced motion, forced colors, responsive viewports
 *   4. Console, page, and network error tracking
 *   5. Browser metadata and visual screenshot capture
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    previewUrl: process.env.COMPOSER_PREVIEW_URL || 'http://localhost:3000',
    blockFamily: process.env.COMPOSER_BLOCK_FAMILY || 'introduction',
    blockVersion: process.env.COMPOSER_BLOCK_VERSION || 'I1',
    screenshotPath: process.env.COMPOSER_SCREENSHOT_PATH || 'screenshot.png',
  };

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--preview-url' || args[i] === '--url') && args[i + 1]) {
      params.previewUrl = args[++i];
    } else if ((args[i] === '--block-family' || args[i] === '--family') && args[i + 1]) {
      params.blockFamily = args[++i];
    } else if ((args[i] === '--block-version' || args[i] === '--version') && args[i + 1]) {
      params.blockVersion = args[++i];
    } else if ((args[i] === '--screenshot' || args[i] === '--screenshot-path') && args[i + 1]) {
      params.screenshotPath = args[++i];
    }
  }

  return params;
}

(async () => {
  const { previewUrl, blockFamily, blockVersion, screenshotPath } = parseArgs();
  const targetFamilyLower = blockFamily.toLowerCase();
  const targetVersionUpper = blockVersion.toUpperCase();

  const result = {
    passed: false,
    dropdown_registered: false,
    rendered_dom: false,
    target_family: targetFamilyLower,
    target_version: targetVersionUpper,
    dom_block_type: null,
    dom_block_version: null,
    console_errors: [],
    page_errors: [],
    network_errors: [],
    screenshot: screenshotPath,
    error_message: null,
    browser_metadata: {
      browser_name: 'chromium',
      browser_version: null,
      user_agent: null,
      viewport: { width: 1440, height: 900 },
    },
    accessibility: {
      passed: false,
      violations_count: 0,
      violations: [],
      incomplete_count: 0,
      incomplete: [],
      passes_count: 0,
    },
    modality_checks: {
      keyboard_navigation: {
        status: 'NOT_APPLICABLE',
        details: 'No interactive controls detected',
        focusable_count: 0,
        active_element_role: null,
      },
      reduced_motion: {
        status: 'NOT_APPLICABLE',
        details: 'No motion detected',
        suppressed_animations: true,
      },
      forced_colors: {
        status: 'NOT_APPLICABLE',
        details: 'Forced colors not evaluated',
        high_contrast_outline_or_border: true,
      },
      responsive_viewports: {
        status: 'PASS',
        viewports_tested: [],
      },
    },
  };

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    result.browser_metadata.browser_version = browser.version();
    result.browser_metadata.user_agent = await page.evaluate(() => navigator.userAgent);

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('404') && !text.includes('favicon')) {
          result.console_errors.push(text);
        }
      }
    });

    page.on('pageerror', (err) => {
      result.page_errors.push(err.message || String(err));
    });

    page.on('response', (response) => {
      const url = response.url();
      if (url.startsWith(previewUrl) && response.status() >= 400) {
        if (url.includes('/api/') && !url.endsWith('.ico') && !url.endsWith('.map')) {
          result.network_errors.push(`${response.status()} ${url}`);
        }
      }
    });

    const targetUrl = `${previewUrl}/tools/tutorial-page-content`;
    const loginUrl = `${previewUrl}/login?redirect=${encodeURIComponent('/tools/tutorial-page-content')}`;

    // Step A: Perform login if authentication is required
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);

    const emailInput =
      (await page.$('input#email')) ||
      (await page.$('input[name="email"]')) ||
      (await page.$('input[type="email"]'));

    if (emailInput) {
      await emailInput.fill('admin@skillhubcore.in');
      const pwdInput =
        (await page.$('input#password')) ||
        (await page.$('input[name="password"]')) ||
        (await page.$('input[type="password"]'));
      if (pwdInput) {
        await pwdInput.fill('testing');
      }
      const submitBtn =
        (await page.$('button[type="submit"]')) ||
        (await page.$('button:has-text("Sign In")'));
      if (submitBtn) {
        await submitBtn.click();
      }
      try {
        await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 });
      } catch (e) {
        await page.waitForTimeout(3000);
      }
    }

    // Step B: Navigate to Composer if not already there
    if (!page.url().includes('/tools/tutorial-page-content')) {
      const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (!response || !response.ok()) {
        throw new Error(`Failed to load ${targetUrl} (status: ${response ? response.status() : 'no response'})`);
      }
    }

    // Reset errors captured during initial authentication transition
    result.console_errors = [];
    result.page_errors = [];
    result.network_errors = [];

    // Step C: Wait for Tutorial Composer elements
    await page.waitForSelector('#select-block, select', { timeout: 25000 });

    // 1. Verify family is registered in dropdown
    const blockSelect = (await page.$('#select-block')) || (await page.$('select'));
    const options = await blockSelect.$$eval('option', (opts) =>
      opts.map((o) => ({ value: o.value, text: o.textContent.trim() }))
    );
    const foundOption = options.find(
      (o) =>
        o.value.toLowerCase() === targetFamilyLower ||
        o.text.toLowerCase().includes(targetFamilyLower)
    );

    if (foundOption) {
      result.dropdown_registered = true;
      await blockSelect.selectOption({ value: foundOption.value });
    } else {
      result.error_message = `Block family '${targetFamilyLower}' not found in Composer block selector dropdown options: ${JSON.stringify(options)}`;
      console.log(JSON.stringify(result));
      await browser.close();
      process.exit(0);
    }

    // Select the requested version from the Composer version selector
    let versionSelected = false;
    let versionSelectionError = '';
    const versionSelect = await page.$('#select-version');
    if (versionSelect) {
      const val = await versionSelect.$$eval(
        'option',
        (opts, version) => {
          const option = opts.find(
            (o) =>
              o.value.toUpperCase() === version ||
              (o.textContent || '').toUpperCase().includes(version)
          );
          return option ? option.value : null;
        },
        targetVersionUpper
      );
      if (val) {
        await versionSelect.selectOption({ value: val });
        versionSelected = true;
      } else {
        versionSelectionError = `Unable to select block version '${targetVersionUpper}'`;
      }
    } else {
      const selects = await page.$$('select');
      for (const sel of selects) {
        const hasVersion = await sel.$$eval(
          'option',
          (opts, version) =>
            opts.some(
              (o) =>
                o.value.toUpperCase() === version ||
                (o.textContent || '').toUpperCase().includes(version)
            ),
          targetVersionUpper
        );
        if (hasVersion) {
          const value = await sel.$$eval(
            'option',
            (opts, version) => {
              const option = opts.find(
                (o) =>
                  o.value.toUpperCase() === version ||
                  (o.textContent || '').toUpperCase().includes(version)
              );
              return option ? option.value : null;
            },
            targetVersionUpper
          );
          if (value) {
            await sel.selectOption({ value });
            versionSelected = true;
            break;
          }
        }
      }
    }

    if (versionSelectionError) {
      result.error_message = versionSelectionError;
      console.log(JSON.stringify(result));
      await browser.close();
      process.exit(0);
    }

    // Wait for preview pane update
    await page.waitForTimeout(1000);

    // Switch preview mode to 'Active Block' if button exists
    const activeBlockBtn = await page.$('button:has-text("Active Block")');
    if (activeBlockBtn) {
      await activeBlockBtn.click();
      await page.waitForTimeout(800);
    }

    // 2. Check rendered DOM attributes
    const blockArticle = await page.$(`[data-block-type="${targetFamilyLower}"]`);
    if (blockArticle) {
      result.rendered_dom = true;
      result.dom_block_type = targetFamilyLower;
      result.dom_block_version = await blockArticle.getAttribute('data-block-version');
    } else {
      const anyBlock = await page.$('[data-block-type]');
      if (anyBlock) {
        result.dom_block_type = await anyBlock.getAttribute('data-block-type');
        result.dom_block_version = await anyBlock.getAttribute('data-block-version');
        if (result.dom_block_type && result.dom_block_type.toLowerCase() === targetFamilyLower) {
          result.rendered_dom = true;
        }
      }
    }

    const blockSelector = `[data-block-type="${targetFamilyLower}"]`;

    // 3. Axe-core Accessibility Audit (Rule: only against selected rendered block preview container)
    let AxeBuilder = null;
    try {
      AxeBuilder = require('@axe-core/playwright').default || require('@axe-core/playwright');
    } catch (_) {
      try {
        AxeBuilder = require(path.join(process.cwd(), 'apps', 'skillhubcore-admin', 'node_modules', '@axe-core', 'playwright')).default;
      } catch (err) {
        AxeBuilder = null;
      }
    }

    if (!AxeBuilder) {
      result.accessibility.passed = false;
      result.accessibility.violations_count = 1;
      result.accessibility.violations = [
        {
          id: 'axe-runner-missing',
          impact: 'critical',
          description: '@axe-core/playwright is not accessible in worktree execution environment',
          help: 'Ensure @axe-core/playwright is installed in admin devDependencies',
          helpUrl: '',
          nodes_count: 1,
        },
      ];
    } else if (result.rendered_dom) {
      try {
        // Run full WCAG 2.0 and 2.1 A and AA standards (including color-contrast)
        const axeResults = await new AxeBuilder({ page })
          .include(blockSelector)
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        result.accessibility.violations_count = axeResults.violations.length;
        result.accessibility.violations = axeResults.violations.map((v) => ({
          id: v.id,
          impact: v.impact || 'moderate',
          description: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          nodes_count: v.nodes ? v.nodes.length : 0,
          nodes: (v.nodes || []).map((n) => ({
            target: n.target,
            html: (n.html || '').slice(0, 300),
            failureSummary: n.failureSummary,
          })),
        }));
        result.accessibility.incomplete_count = axeResults.incomplete ? axeResults.incomplete.length : 0;
        result.accessibility.incomplete = (axeResults.incomplete || []).map((inc) => ({
          id: inc.id,
          description: inc.description,
          nodes_count: inc.nodes ? inc.nodes.length : 0,
        }));
        result.accessibility.passes_count = axeResults.passes ? axeResults.passes.length : 0;
        result.accessibility.passed = axeResults.violations.length === 0;
      } catch (axeErr) {
        result.accessibility.passed = false;
        result.accessibility.violations_count = 1;
        result.accessibility.violations = [
          {
            id: 'axe-analysis-error',
            impact: 'serious',
            description: axeErr.message || String(axeErr),
            help: 'Axe analysis encountered an unexpected exception',
            helpUrl: '',
            nodes_count: 1,
          },
        ];
      }
    }

    // 4. Modality Checks
    if (result.rendered_dom) {
      // Modality A: Keyboard Navigation & Focus Ring
      try {
        const blockEl = await page.$(blockSelector);
        if (blockEl) {
          const focusables = await blockEl.$$(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"], [role="button"]'
          );

          if (focusables.length === 0) {
            result.modality_checks.keyboard_navigation = {
              status: 'NOT_APPLICABLE',
              details: 'No interactive controls present in block preview',
              focusable_count: 0,
              active_element_role: null,
            };
          } else {
            await focusables[0].focus();
            const focusInfo = await page.evaluate((selector) => {
              const active = document.activeElement;
              const block = document.querySelector(selector);
              if (!active || !block || !block.contains(active)) {
                return { isFocused: false, role: null, hasVisibleFocus: false };
              }
              const style = window.getComputedStyle(active);
              const outlineWidth = parseFloat(style.outlineWidth) || 0;
              const hasOutline = style.outlineStyle !== 'none' && outlineWidth > 0;
              const hasBoxShadow = style.boxShadow && style.boxShadow !== 'none';
              return {
                isFocused: true,
                role: active.getAttribute('role') || active.tagName.toLowerCase(),
                hasVisibleFocus: Boolean(hasOutline || hasBoxShadow),
              };
            }, blockSelector);

            if (focusInfo.isFocused && focusInfo.hasVisibleFocus) {
              result.modality_checks.keyboard_navigation = {
                status: 'PASS',
                details: `Focused control "${focusInfo.role}" with verified visible focus outline or box-shadow`,
                focusable_count: focusables.length,
                active_element_role: focusInfo.role,
              };
            } else if (focusInfo.isFocused && !focusInfo.hasVisibleFocus) {
              result.modality_checks.keyboard_navigation = {
                status: 'FAIL',
                details: `Focused control "${focusInfo.role}" lacks visible focus outline or box-shadow (fails WCAG 2.4.7 Focus Visible)`,
                focusable_count: focusables.length,
                active_element_role: focusInfo.role,
              };
            } else {
              result.modality_checks.keyboard_navigation = {
                status: 'FAIL',
                details: 'Interactive control failed to retain focus inside block container',
                focusable_count: focusables.length,
                active_element_role: null,
              };
            }
          }
        }
      } catch (kbErr) {
        result.modality_checks.keyboard_navigation = {
          status: 'FAIL',
          details: `Keyboard focus check error: ${kbErr.message}`,
          focusable_count: 0,
          active_element_role: null,
        };
      }

      // Modality B: Reduced Motion
      try {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const motionCheck = await page.evaluate((selector) => {
          const block = document.querySelector(selector);
          if (!block) return { animatedCount: 0, unguardedCount: 0 };
          const elements = [block, ...block.querySelectorAll('*')];
          let animatedCount = 0;
          let unguardedCount = 0;
          for (const el of elements) {
            const style = window.getComputedStyle(el);
            const animName = style.animationName;
            if (animName && animName !== 'none') {
              animatedCount++;
              const durSec = parseFloat(style.animationDuration) || 0;
              if (durSec > 0.05) unguardedCount++;
            }
          }
          return { animatedCount, unguardedCount };
        }, blockSelector);
        await page.emulateMedia({ reducedMotion: 'no-preference' });

        if (motionCheck.animatedCount === 0) {
          result.modality_checks.reduced_motion = {
            status: 'NOT_APPLICABLE',
            details: 'No continuous animations declared in rendered block',
            suppressed_animations: true,
          };
        } else if (motionCheck.unguardedCount === 0) {
          result.modality_checks.reduced_motion = {
            status: 'PASS',
            details: 'prefers-reduced-motion active: all continuous animations suppressed',
            suppressed_animations: true,
          };
        } else {
          result.modality_checks.reduced_motion = {
            status: 'FAIL',
            details: `${motionCheck.unguardedCount} animation(s) not suppressed under prefers-reduced-motion`,
            suppressed_animations: false,
          };
        }
      } catch (motionErr) {
        result.modality_checks.reduced_motion = {
          status: 'FAIL',
          details: `Reduced motion check error: ${motionErr.message}`,
          suppressed_animations: false,
        };
      }

      // Modality C: Forced Colors (Windows High Contrast Mode)
      try {
        await page.emulateMedia({ forcedColors: 'active' });
        const forcedColorsCheck = await page.evaluate((selector) => {
          const block = document.querySelector(selector);
          if (!block) return { hasBorder: false };
          const elementsToCheck = [block, ...block.querySelectorAll('*')];
          const hasPreservedBorder = elementsToCheck.some((el) => {
            const s = window.getComputedStyle(el);
            const bWidth = parseFloat(s.borderWidth) || parseFloat(s.borderTopWidth) || 0;
            const bStyle = s.borderStyle || s.borderTopStyle;
            const oWidth = parseFloat(s.outlineWidth) || 0;
            const oStyle = s.outlineStyle;
            return (bStyle !== 'none' && bWidth > 0) || (oStyle !== 'none' && oWidth > 0);
          });
          return { hasBorder: hasPreservedBorder };
        }, blockSelector);
        await page.emulateMedia({ forcedColors: 'none' });

        const forcedColorsStatus = forcedColorsCheck.hasBorder ? 'PASS' : 'FAIL';
        result.modality_checks.forced_colors = {
          status: forcedColorsStatus,
          details: forcedColorsCheck.hasBorder
            ? 'forced-colors: active evaluated; high contrast outline or border preserved'
            : 'forced-colors: active evaluated; block container lacks high contrast outline or border (fails forced-colors preservation)',
          high_contrast_outline_or_border: forcedColorsCheck.hasBorder,
        };
      } catch (fcErr) {
        result.modality_checks.forced_colors = {
          status: 'FAIL',
          details: `Forced colors check error: ${fcErr.message}`,
          high_contrast_outline_or_border: false,
        };
      }

      // Modality D: Responsive Viewports (375px mobile, 768px tablet, 1280px desktop)
      try {
        const viewportsToTest = [
          { name: 'mobile-375', width: 375, height: 667 },
          { name: 'tablet-768', width: 768, height: 1024 },
          { name: 'desktop-1280', width: 1280, height: 900 },
        ];
        let allViewportsPassed = true;
        result.modality_checks.responsive_viewports.viewports_tested = [];

        for (const vp of viewportsToTest) {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.waitForTimeout(250);

          const overflow = await page.evaluate((selector) => {
            const block = document.querySelector(selector);
            if (!block) return false;
            return block.scrollWidth > window.innerWidth + 2;
          }, blockSelector);

          const passed = !overflow;
          if (!passed) allViewportsPassed = false;
          result.modality_checks.responsive_viewports.viewports_tested.push({
            name: vp.name,
            width: vp.width,
            height: vp.height,
            passed,
            overflow_x: overflow,
          });
        }

        result.modality_checks.responsive_viewports.status = allViewportsPassed ? 'PASS' : 'FAIL';
        await page.setViewportSize({ width: 1440, height: 900 });
      } catch (respErr) {
        result.modality_checks.responsive_viewports.status = 'FAIL';
      }
    }

    // Step E: Capture screenshot evidence
    try {
      const parentDir = path.dirname(screenshotPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      await page.screenshot({ path: screenshotPath, fullPage: false });
    } catch (_) {}

    // Step F: Overall Pass Determination
    const versionMatches = result.dom_block_version === targetVersionUpper;
    const a11yPassed = result.accessibility.passed;
    const failedModalities = Object.entries(result.modality_checks)
      .filter(([_, check]) => check && check.status === 'FAIL')
      .map(([name]) => name);

    const noErrors =
      result.console_errors.length === 0 &&
      result.page_errors.length === 0 &&
      result.network_errors.length === 0;

    if (
      result.dropdown_registered &&
      result.rendered_dom &&
      versionMatches &&
      noErrors &&
      a11yPassed &&
      failedModalities.length === 0
    ) {
      result.passed = true;
    } else {
      result.passed = false;
      const issues = [];
      if (!result.dropdown_registered) issues.push(`Family '${targetFamilyLower}' missing from dropdown`);
      if (!result.rendered_dom) issues.push(`Block container [data-block-type="${targetFamilyLower}"] not rendered`);
      if (!versionMatches) issues.push(`Version mismatch: expected '${targetVersionUpper}', got '${result.dom_block_version}'`);
      if (!a11yPassed) issues.push(`${result.accessibility.violations_count} accessibility violation(s)`);
      if (failedModalities.length > 0) issues.push(`Modality failures: ${failedModalities.join(', ')}`);
      if (result.console_errors.length > 0) issues.push(`Console errors (${result.console_errors.length})`);
      result.error_message = issues.join('; ');
    }

    console.log(JSON.stringify(result));
  } catch (err) {
    result.error_message = err.message || String(err);
    console.log(JSON.stringify(result));
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
