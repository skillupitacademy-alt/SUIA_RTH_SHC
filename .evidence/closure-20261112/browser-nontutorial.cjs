const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('@playwright/test');
const { default: AxeBuilder } = require('@axe-core/playwright');
const screenshots = path.resolve('.evidence/screenshots/closure-20261112');
fs.mkdirSync(screenshots, { recursive: true });
const results = [];
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [brand, port] of [['skillhubcore', 3007], ['skillup', 3009], ['realtutorialhub', 3003]]) {
      for (const [size, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
        const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
        const page = await context.newPage();
        const entry = { brand, size, pass: false, viewport };
        try {
          const response = await page.goto(`http://${brand}.localhost:${port}/login`, { waitUntil: 'domcontentloaded', timeout: 180000 });
          assert.equal(response.status(), 200);
          const email = page.locator('input[name=email]');
          await email.waitFor({ state: 'visible', timeout: 90000 });
          await page.locator('input[name=password]').waitFor({ state: 'visible' });
          await email.focus();
          await page.keyboard.press('Tab');
          entry.keyboardFocus = await page.evaluate(() => ({ tag: document.activeElement?.tagName, type: document.activeElement?.getAttribute('type') }));
          assert.notEqual(entry.keyboardFocus.tag, 'BODY');
          entry.layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
          assert.ok(entry.layout.scrollWidth <= entry.layout.width + 1, 'Horizontal page overflow');
          entry.formMethod = await email.evaluate(e => e.form.method);
          assert.equal(entry.formMethod, 'post');
          const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
          entry.violations = axe.violations.map(v => ({ id: v.id, impact: v.impact, targets: v.nodes.map(n => n.target) }));
          await page.screenshot({ path: path.join(screenshots, `${brand}-login-${size}.png`), fullPage: true });
          assert.equal(entry.violations.filter(v => ['serious', 'critical'].includes(v.impact)).length, 0, 'Serious/critical automated accessibility violations');
          entry.pass = true;
        } catch (error) {
          entry.error = error instanceof assert.AssertionError ? error.message : error.name;
          await page.screenshot({ path: path.join(screenshots, `${brand}-login-${size}-failure.png`), fullPage: true }).catch(() => {});
        } finally {
          await context.close(); results.push(entry);
          fs.writeFileSync('.evidence/closure-20261112/browser-nontutorial-results.json', JSON.stringify({ boundary: 'Real headless Chromium; public login pages only, automated axe/keyboard/mobile probes. No tutorial journeys, authenticated mutations or full WCAG certification.', results }, null, 2));
          console.log(JSON.stringify(entry));
        }
      }
    }
  } finally { await browser.close(); }
  if (results.some(r => !r.pass)) process.exitCode = 1;
})().catch(e => { console.error(e.name); process.exitCode = 1; });
