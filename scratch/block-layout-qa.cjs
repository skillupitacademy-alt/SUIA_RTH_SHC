#!/usr/bin/env node
/* Temporary browser QA runner. It is intentionally outside production code. */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const baseUrl = process.env.QA_BASE_URL || 'http://skillup.localhost:3009';
const targetPath = process.env.QA_TARGET_PATH;
const email = process.env.QA_EMAIL;
const password = process.env.QA_PASSWORD;
const localGatewaySecret = process.env.QA_INTERNAL_GATEWAY_SECRET;
const outputDir = path.resolve(process.env.QA_OUTPUT_DIR || '.evidence/screenshots/block-layout-qa');
const widths = [375, 640, 768, 1024, 1280, 1536];

if (!targetPath || !email || !password) {
  throw new Error('QA_TARGET_PATH, QA_EMAIL, and QA_PASSWORD are required.');
}

function rectOf(element) {
  const rect = element.getBoundingClientRect();
  return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
}

function cookieFromSetCookie(serialized) {
  const [pair, ...attributes] = serialized.split(';').map(part => part.trim());
  const separator = pair.indexOf('=');
  if (separator < 1) return null;
  const cookie = { name: pair.slice(0, separator), value: pair.slice(separator + 1), domain: 'skillup.localhost', path: '/', secure: false };
  for (const attribute of attributes) {
    const [rawKey, ...rawValue] = attribute.split('=');
    const key = rawKey.toLowerCase();
    const value = rawValue.join('=');
    if (key === 'httponly') cookie.httpOnly = true;
    if (key === 'path' && value) cookie.path = value;
    if (key === 'expires' && value) {
      const expires = Date.parse(value);
      if (!Number.isNaN(expires)) cookie.expires = Math.floor(expires / 1000);
    }
  }
  return cookie;
}

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: widths[0], height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));

  const target = `${baseUrl}${targetPath}`;
  const login = `${baseUrl}/login?redirect=${encodeURIComponent(targetPath)}`;
  await page.goto(login, { waitUntil: 'domcontentloaded', timeout: 45000 });
  if (page.url().includes('/login')) {
    const emailInput = page.locator('input[type="email"], input[name="email"], #email').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], #password').first();
    await emailInput.fill(email);
    await passwordInput.fill(password);
    await page.locator('button[type="submit"], button:has-text("Sign In")').first().click();
    const loggedIn = await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 12000 }).then(() => true).catch(() => false);
    if (!loggedIn) {
      if (!localGatewaySecret) throw new Error('Local UI login failed and QA_INTERNAL_GATEWAY_SECRET was not supplied for the scratchpad session fallback.');
      const response = await fetch('http://127.0.0.1:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-original-host': 'skillup.localhost',
          'x-forwarded-host': '127.0.0.1',
          'x-forwarded-proto': 'http',
          'x-internal-secret': localGatewaySecret,
          'x-brand': 'skillup',
          'x-platform': 'skillup',
          'x-portal-identity': 'user',
        },
        body: JSON.stringify({ email, password, platform: 'skillup' }),
      });
      if (!response.ok) throw new Error(`Scratchpad session setup failed: ${response.status}`);
      const cookies = response.headers.getSetCookie().map(cookieFromSetCookie).filter(Boolean);
      await context.addCookies(cookies);
      await page.goto(target, { waitUntil: 'networkidle', timeout: 45000 });
    }
  }
  if (!page.url().includes(targetPath)) {
    await page.goto(target, { waitUntil: 'networkidle', timeout: 45000 });
  }
  let rendered = await page.waitForSelector('[data-block-type]', { timeout: 60000 }).then(() => true).catch(() => false);
  if (!rendered) {
    await page.waitForTimeout(5000);
    rendered = await page.locator('[data-block-type]').count().then(count => count > 0);
  }
  if (!rendered) {
    const screenshot = path.join(outputDir, 'tutorial-not-rendered.png');
    await page.screenshot({ path: screenshot, fullPage: true });
    const visibleText = await page.locator('body').innerText().catch(() => '');
    const semanticContainers = await page.evaluate(() => [...document.querySelectorAll('article, main, aside, nav')].map(el => ({
      tag: el.tagName.toLowerCase(),
      blockType: el.getAttribute('data-block-type'),
      version: el.getAttribute('data-block-version'),
      className: typeof el.className === 'string' ? el.className : '',
      text: (el.textContent || '').trim().slice(0, 120),
    })));
    await browser.close();
    process.stdout.write(`${JSON.stringify({
      target,
      finalUrl: page.url(),
      rendered: false,
      screenshot,
      visibleText: visibleText.slice(0, 3000),
      semanticContainers,
      consoleErrors,
      pageErrors,
    }, null, 2)}\n`);
    return;
  }

  const report = { target, finalUrl: page.url(), viewports: [], consoleErrors, pageErrors };
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(350);
    const metrics = await page.evaluate(() => {
      const tolerance = 1;
      const bodyOverflow = document.documentElement.scrollWidth > window.innerWidth + tolerance;
      const blocks = [...document.querySelectorAll('[data-block-type]')].map(block => {
        const parent = block.parentElement;
        const rect = block.getBoundingClientRect();
        const parentRect = parent ? parent.getBoundingClientRect() : null;
        const scrollOverflow = block.scrollWidth > block.clientWidth + tolerance;
        const exceedsParent = parentRect && (rect.left < parentRect.left - tolerance || rect.right > parentRect.right + tolerance);
        return {
          type: block.getAttribute('data-block-type'), version: block.getAttribute('data-block-version'),
          width: rect.width, scrollOverflow, exceedsParent,
        };
      });
      const regions = [...document.querySelectorAll('aside, nav, main, [role="navigation"]')].map(region => {
        const rect = region.getBoundingClientRect();
        return {
          tag: region.tagName.toLowerCase(), label: region.getAttribute('aria-label'),
          width: rect.width, offscreen: rect.right < -tolerance || rect.left > window.innerWidth + tolerance,
          overflow: region.scrollWidth > region.clientWidth + tolerance,
        };
      });
      return { bodyOverflow, blocks, regions };
    });
    const screenshot = path.join(outputDir, `tutorial-${width}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    report.viewports.push({ width, ...metrics, screenshot });
  }
  await browser.close();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
})().catch(error => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
