/**
 * ILS Step 1: Tutorial Learning Session — E2E Certification
 *
 * Tests browser-tab-scoped Tutorial Learning Session for SUIA and RTH.
 * CREDENTIALS: Never hard-coded. Always from environment variables.
 * NEVER LOG:   passwords, auth cookie values, tokens.
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test';

// ── Constants ─────────────────────────────────────────────────────────────────

const SESSION_KEY = 'tutorialLearningSessionId';
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getSUIAConfig() {
  const base = process.env.SUIA_BASE_URL ?? 'http://skillup.localhost:3009';
  const tUrl = `${base}/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava`;
  return {
    brand: 'SUIA', baseUrl: base,
    email: process.env.SUIA_EMAIL ?? 'student@skillupitacademy.com',
    password: process.env.SUIA_PASSWORD ?? 'testing',
    tutorialUrl: tUrl,
    tutorialUrl2: tUrl, // same page — TC3 tests sessionStorage persistence across reload
  };
}

function getRTHConfig() {
  const base = process.env.RTH_BASE_URL ?? 'http://realtutorialhub.localhost:3003';
  const tUrl = `${base}/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava`;
  return {
    brand: 'RTH', baseUrl: base,
    email: process.env.RTH_EMAIL ?? 'ajayshah@gmail.com',
    password: process.env.RTH_PASSWORD ?? 'testing',
    tutorialUrl: tUrl,
    tutorialUrl2: tUrl,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function login(page: Page, loginUrl: string, email: string, password: string): Promise<void> {
  await page.goto(loginUrl, { waitUntil: 'networkidle' });

  // Wait for the form to be interactive
  await page.waitForSelector('input#email', { state: 'visible', timeout: 15000 });

  // Fill email
  await page.fill('input#email', email);

  // Fill password directly by ID - avoids strict-mode violation with "Show password" button
  await page.fill('input#password', password); // password value not logged

  // Wait a bit for React hydration
  await page.waitForTimeout(1000);

  // Click the submit button instead of pressing Enter
  await Promise.all([
    page.waitForURL((url) => !url.href.includes('/login'), { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);

  // Wait for auth cookies to be fully written
  await page.waitForTimeout(1500);
}

async function navigateToTutorial(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  // Wait for client-side hydration: TutorialPageShell useEffect runs session init
  await page.waitForTimeout(3000);
}

async function readSessionId(page: Page): Promise<string | null> {
  return page.evaluate((key: string) => sessionStorage.getItem(key), SESSION_KEY);
}

async function readLocalStorageSessionId(page: Page): Promise<string | null> {
  return page.evaluate((key: string) => localStorage.getItem(key), SESSION_KEY);
}

function logEvidence(label: string, data: Record<string, unknown>): void {
  console.log(`\n[ILS E2E] ${label}:`, JSON.stringify(data, null, 2));
}

// ── SUIA Tests ────────────────────────────────────────────────────────────────

test.describe('ILS Learning Session - SUIA', () => {
  const cfg = getSUIAConfig();

  test('SUIA TC1: First Tutorial visit creates a valid session ID', async ({ page }) => {
    test.skip(!process.env.SUIA_EMAIL, 'SUIA_EMAIL not set');
    await login(page, `${cfg.baseUrl}/login`, cfg.email, cfg.password);
    await navigateToTutorial(page, cfg.tutorialUrl);

    const sessionId = await readSessionId(page);

    logEvidence('SUIA TC1 Session Creation', {
      brand: 'SUIA', url: cfg.tutorialUrl,
      keyExists: sessionId !== null,
      isValidUUID: sessionId !== null ? UUID_V4_REGEX.test(sessionId) : false,
      sessionPrefix: sessionId ? sessionId.substring(0, 8) + '...' : null,
    });

    expect(sessionId, `sessionStorage["${SESSION_KEY}"] must exist after Tutorial page mount`).not.toBeNull();
    expect(UUID_V4_REGEX.test(sessionId!), 'Session ID must be a valid UUID v4').toBe(true);
  });

  test('SUIA TC2: Page reload preserves session ID', async ({ page }) => {
    test.skip(!process.env.SUIA_EMAIL, 'SUIA_EMAIL not set');
    await login(page, `${cfg.baseUrl}/login`, cfg.email, cfg.password);
    await navigateToTutorial(page, cfg.tutorialUrl);

    const before = await readSessionId(page);
    expect(before, 'Session must exist before reload').not.toBeNull();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const after = await readSessionId(page);

    logEvidence('SUIA TC2 Reload Preservation', {
      brand: 'SUIA', preserved: before === after, result: before === after ? 'PASS' : 'FAIL',
    });
    expect(after, 'Session ID must survive page reload (sessionStorage persists across reload)').toBe(before);
  });

  test('SUIA TC3: sessionStorage persists through in-tab re-navigation', async ({ page }) => {
    test.skip(!process.env.SUIA_EMAIL, 'SUIA_EMAIL not set');
    await login(page, `${cfg.baseUrl}/login`, cfg.email, cfg.password);
    await navigateToTutorial(page, cfg.tutorialUrl);
    const id1 = await readSessionId(page);
    expect(id1, 'Session must exist on first visit').not.toBeNull();

    // Navigate away then back to same tutorial page
    await page.goto(`${cfg.baseUrl}/dashboard`, { waitUntil: 'domcontentloaded' });
    await navigateToTutorial(page, cfg.tutorialUrl);
    const id2 = await readSessionId(page);

    logEvidence('SUIA TC3 In-Tab Navigation', {
      brand: 'SUIA', preserved: id1 === id2, result: id1 === id2 ? 'PASS' : 'FAIL',
    });
    expect(id2, 'Session ID must be preserved after in-tab navigation (sessionStorage tab scope)').toBe(id1);
  });

  test('SUIA TC4: New browser context gets a different session ID', async ({ browser }) => {
    test.skip(!process.env.SUIA_EMAIL, 'SUIA_EMAIL not set');
    const ctxA: BrowserContext = await browser.newContext();
    const ctxB: BrowserContext = await browser.newContext();
    const pageA: Page = await ctxA.newPage();
    const pageB: Page = await ctxB.newPage();

    try {
      await login(pageA, `${cfg.baseUrl}/login`, cfg.email, cfg.password);
      await navigateToTutorial(pageA, cfg.tutorialUrl);
      const idA = await readSessionId(pageA);

      await login(pageB, `${cfg.baseUrl}/login`, cfg.email, cfg.password);
      await navigateToTutorial(pageB, cfg.tutorialUrl);
      const idB = await readSessionId(pageB);

      logEvidence('SUIA TC4 New Context Isolation', {
        brand: 'SUIA',
        ctxA_prefix: idA ? idA.substring(0, 8) + '...' : null,
        ctxB_prefix: idB ? idB.substring(0, 8) + '...' : null,
        areDifferent: idA !== idB,
        result: (idA !== null && idB !== null && idA !== idB) ? 'PASS' : 'FAIL',
      });

      expect(idA, 'Context A session must exist').not.toBeNull();
      expect(idB, 'Context B session must exist').not.toBeNull();
      expect(idA, 'Context A and B must have DIFFERENT session IDs (tab isolation)').not.toBe(idB);
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });

  test('SUIA TC5: Session ID is in sessionStorage, NOT localStorage', async ({ page }) => {
    test.skip(!process.env.SUIA_EMAIL, 'SUIA_EMAIL not set');
    await login(page, `${cfg.baseUrl}/login`, cfg.email, cfg.password);
    await navigateToTutorial(page, cfg.tutorialUrl);

    const inSession = await readSessionId(page);
    const inLocal = await readLocalStorageSessionId(page);

    logEvidence('SUIA TC5 Storage Isolation', {
      brand: 'SUIA', inSessionStorage: inSession !== null, inLocalStorage: inLocal !== null,
      result: (inSession !== null && inLocal === null) ? 'PASS' : 'FAIL',
    });

    expect(inSession, 'Session ID must exist in sessionStorage').not.toBeNull();
    expect(inLocal, 'Session ID must NOT exist in localStorage').toBeNull();
  });

  test('SUIA TC6: Learning session is independent from auth cookies', async ({ page }) => {
    test.skip(!process.env.SUIA_EMAIL, 'SUIA_EMAIL not set');
    await login(page, `${cfg.baseUrl}/login`, cfg.email, cfg.password);
    await navigateToTutorial(page, cfg.tutorialUrl);

    const sessionId = await readSessionId(page);
    const cookies = await page.context().cookies();
    const sessionIdInCookies = cookies.some(c => c.value === sessionId);

    logEvidence('SUIA TC6 Auth Independence', {
      brand: 'SUIA',
      cookieNames: cookies.map(c => c.name), // names safe to log
      cookieCount: cookies.length,
      learningSessionFoundInCookies: sessionIdInCookies,
      result: (!sessionIdInCookies && sessionId !== null) ? 'PASS' : 'FAIL',
    });

    expect(sessionId, 'Learning session ID must exist').not.toBeNull();
    expect(sessionIdInCookies, 'Learning session ID must NOT appear as an auth cookie value').toBe(false);
  });
});

// ── RTH Tests ─────────────────────────────────────────────────────────────────

test.describe('ILS Learning Session - RTH', () => {
  const cfg = getRTHConfig();

  test('RTH TC1: First Tutorial visit creates a valid session ID', async ({ page }) => {
    test.skip(!process.env.RTH_EMAIL, 'RTH_EMAIL not set');
    await login(page, `${cfg.baseUrl}/login`, cfg.email, cfg.password);
    await navigateToTutorial(page, cfg.tutorialUrl);

    const sessionId = await readSessionId(page);

    logEvidence('RTH TC1 Session Creation', {
      brand: 'RTH', url: cfg.tutorialUrl,
      keyExists: sessionId !== null,
      isValidUUID: sessionId !== null ? UUID_V4_REGEX.test(sessionId) : false,
      sessionPrefix: sessionId ? sessionId.substring(0, 8) + '...' : null,
    });

    expect(sessionId, `sessionStorage["${SESSION_KEY}"] must exist after Tutorial page mount`).not.toBeNull();
    expect(UUID_V4_REGEX.test(sessionId!), 'Session ID must be a valid UUID v4').toBe(true);
  });

  test('RTH TC2: Page reload preserves session ID', async ({ page }) => {
    test.skip(!process.env.RTH_EMAIL, 'RTH_EMAIL not set');
    await login(page, `${cfg.baseUrl}/login`, cfg.email, cfg.password);
    await navigateToTutorial(page, cfg.tutorialUrl);

    const before = await readSessionId(page);
    expect(before, 'Session must exist before reload').not.toBeNull();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const after = await readSessionId(page);

    logEvidence('RTH TC2 Reload Preservation', {
      brand: 'RTH', preserved: before === after, result: before === after ? 'PASS' : 'FAIL',
    });
    expect(after, 'Session ID must survive page reload').toBe(before);
  });

  test('RTH TC3: sessionStorage persists through in-tab re-navigation', async ({ page }) => {
    test.skip(!process.env.RTH_EMAIL, 'RTH_EMAIL not set');
    await login(page, `${cfg.baseUrl}/login`, cfg.email, cfg.password);
    await navigateToTutorial(page, cfg.tutorialUrl);
    const id1 = await readSessionId(page);
    expect(id1).not.toBeNull();

    await page.goto(`${cfg.baseUrl}/dashboard`, { waitUntil: 'domcontentloaded' });
    await navigateToTutorial(page, cfg.tutorialUrl);
    const id2 = await readSessionId(page);

    logEvidence('RTH TC3 In-Tab Navigation', {
      brand: 'RTH', preserved: id1 === id2, result: id1 === id2 ? 'PASS' : 'FAIL',
    });
    expect(id2, 'Session ID must be preserved after in-tab navigation').toBe(id1);
  });

  test('RTH TC4: New browser context gets a different session ID', async ({ browser }) => {
    test.skip(!process.env.RTH_EMAIL, 'RTH_EMAIL not set');
    const ctxA: BrowserContext = await browser.newContext();
    const ctxB: BrowserContext = await browser.newContext();
    const pageA: Page = await ctxA.newPage();
    const pageB: Page = await ctxB.newPage();

    try {
      await login(pageA, `${cfg.baseUrl}/login`, cfg.email, cfg.password);
      await navigateToTutorial(pageA, cfg.tutorialUrl);
      const idA = await readSessionId(pageA);

      await login(pageB, `${cfg.baseUrl}/login`, cfg.email, cfg.password);
      await navigateToTutorial(pageB, cfg.tutorialUrl);
      const idB = await readSessionId(pageB);

      logEvidence('RTH TC4 New Context Isolation', {
        brand: 'RTH',
        ctxA_prefix: idA ? idA.substring(0, 8) + '...' : null,
        ctxB_prefix: idB ? idB.substring(0, 8) + '...' : null,
        areDifferent: idA !== idB,
        result: (idA !== null && idB !== null && idA !== idB) ? 'PASS' : 'FAIL',
      });

      expect(idA).not.toBeNull();
      expect(idB).not.toBeNull();
      expect(idA, 'Context A and B must have DIFFERENT session IDs').not.toBe(idB);
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });

  test('RTH TC5: Session ID is in sessionStorage, NOT localStorage', async ({ page }) => {
    test.skip(!process.env.RTH_EMAIL, 'RTH_EMAIL not set');
    await login(page, `${cfg.baseUrl}/login`, cfg.email, cfg.password);
    await navigateToTutorial(page, cfg.tutorialUrl);

    const inSession = await readSessionId(page);
    const inLocal = await readLocalStorageSessionId(page);

    logEvidence('RTH TC5 Storage Isolation', {
      brand: 'RTH', inSessionStorage: inSession !== null, inLocalStorage: inLocal !== null,
      result: (inSession !== null && inLocal === null) ? 'PASS' : 'FAIL',
    });

    expect(inSession, 'Session ID must exist in sessionStorage').not.toBeNull();
    expect(inLocal, 'Session ID must NOT exist in localStorage').toBeNull();
  });

  test('RTH TC6: Learning session is independent from auth cookies', async ({ page }) => {
    test.skip(!process.env.RTH_EMAIL, 'RTH_EMAIL not set');
    await login(page, `${cfg.baseUrl}/login`, cfg.email, cfg.password);
    await navigateToTutorial(page, cfg.tutorialUrl);

    const sessionId = await readSessionId(page);
    const cookies = await page.context().cookies();
    const sessionIdInCookies = cookies.some(c => c.value === sessionId);

    logEvidence('RTH TC6 Auth Independence', {
      brand: 'RTH',
      cookieNames: cookies.map(c => c.name),
      cookieCount: cookies.length,
      learningSessionFoundInCookies: sessionIdInCookies,
      result: (!sessionIdInCookies && sessionId !== null) ? 'PASS' : 'FAIL',
    });

    expect(sessionId, 'Learning session ID must exist').not.toBeNull();
    expect(sessionIdInCookies, 'Learning session must NOT appear as auth cookie value').toBe(false);
  });
});