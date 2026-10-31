#!/usr/bin/env node
// Diagnostic only: credentials remain in process environment, never in reports.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

async function signIn(page, origin, email, password) {
  if (process.env.LEARNER_SMOKE_API_LOGIN === 'true') {
    const response = await page.request.post(`${origin}/api/auth/login`, {
      data: { email, password }, timeout: 60000,
    });
    if (response.status() !== 200) throw new Error(`Learner login HTTP ${response.status()}`);
    return;
  }
  await page.goto(`${origin}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 30000, waitUntil: 'domcontentloaded' });
}

(async () => {
  const origin = process.env.LEARNER_SMOKE_ORIGIN || 'http://skillup.localhost:3009';
  const route = process.env.LEARNER_SMOKE_ROUTE;
  const email = process.env.LEARNER_SMOKE_EMAIL;
  const password = process.env.LEARNER_SMOKE_PASSWORD;
  if (!email || !password || !route) throw new Error('Learner smoke credentials and route must be supplied through environment');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const result = { authenticated: false, loginStatus: null, documentStatus: null, blockIdentities: [],
    navigation: [], visit: [], requestFailures: [], pageErrors: [], consoleErrors: [],
    lsnb: false, rssb: false, screenshot: null, passed: false };
  try {
    page.on('response', response => {
      if (new URL(response.url()).pathname === '/api/auth/login' && response.request().method() === 'POST')
        result.loginStatus = response.status();
    });
    await signIn(page, origin, email, password);
    result.authenticated = true;
    page.on('response', response => {
      const pathname = new URL(response.url()).pathname;
      if (pathname.startsWith('/api/tutorial/ils/navigation/')) result.navigation.push(response.status());
      if (pathname === '/api/tutorial/ils/visit') result.visit.push(response.status());
      if (pathname.startsWith('/api/') && response.status() >= 400)
        result.requestFailures.push({ pathname, status: response.status() });
    });
    page.on('pageerror', error => result.pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') result.consoleErrors.push(message.text());
    });
    const response = await page.goto(`${origin}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    result.documentStatus = response?.status() ?? null;
    await page.locator('[data-block-type]').first().waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForResponse(response =>
      new URL(response.url()).pathname.startsWith('/api/tutorial/ils/navigation/'),
      { timeout: 60000 }).catch(() => null);
    result.blockIdentities = await page.locator('[data-block-type]').evaluateAll(nodes => nodes.map(node => ({
      family: node.getAttribute('data-block-type'), version: node.getAttribute('data-block-version'),
    })));
    const navigationSidebar = page.locator('aside[aria-label="Tutorial navigation"]');
    if (!await navigationSidebar.isVisible()) {
      const menu = page.getByRole('button', { name: 'Toggle tutorial sidebar', exact: true });
      if (await menu.count()) await menu.click();
    }
    result.lsnb = await navigationSidebar.isVisible();
    const progressToggle = page.getByRole('button', { name: 'Learning progress', exact: true });
    if (await progressToggle.count()) await progressToggle.click();
    result.rssb = await page.locator('aside[aria-label="Your Progress"]').isVisible();
    await page.waitForTimeout(4000);
    const directory = path.resolve('.evidence/screenshots');
    fs.mkdirSync(directory, { recursive: true });
    result.screenshot = path.join(directory, `learner-runtime-smoke-${Date.now()}.png`);
    await page.screenshot({ path: result.screenshot, fullPage: false });
    result.passed = result.authenticated && result.documentStatus === 200 && result.blockIdentities.length > 0 &&
      result.lsnb && result.rssb && result.navigation.includes(200) && result.visit.includes(200) &&
      result.requestFailures.length === 0 && result.pageErrors.length === 0 && result.consoleErrors.length === 0;
  } catch (error) {
    result.error = error.message;
    result.visibleAlerts = await page.locator('[role="alert"]').allTextContents().catch(() => []);
    if (!result.authenticated) {
      result.loginFeedback = await page.locator('p').allTextContents().then(lines =>
        lines.filter(line => /invalid|incorrect|failed|unavailable|try again|locked/i.test(line))).catch(() => []);
    }
  } finally {
    await context.close();
    await browser.close();
    console.log(JSON.stringify(result, null, 2));
    if (!result.passed) process.exitCode = 1;
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
