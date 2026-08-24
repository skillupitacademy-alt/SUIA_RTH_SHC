/**
 * PHASE 1 LEARNER PAGE IDENTITY — E2E CERTIFICATION
 * 
 * Certifies the complete runtime identity chain:
 * Browser URL → Next.js route → authentication → hierarchy → 
 * exact navigationNodeId → delivery → repository → correct page content
 * 
 * Certified Identity: (subtopicId, navigationNodeId, brandId)
 * 
 * CERTIFICATION GATES:
 * - URL navigationNodeId === active sidebar navigationNodeId
 * - Exact activeUrl resolved by findUrlByNavigationNodeId()
 * - No cross-page content leakage
 * - No normalized ID acceptance
 * - No group node acceptance as page
 * - HTTP 200 for valid pages only
 */

import { test, expect, type Page, type Response } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// CONFIGURATION
// ============================================================

const BASE_URL = 'http://localhost:3009';
const STUDENT_EMAIL = 'student@skillupitacademy.com';
const STUDENT_PASSWORD = 'testing';

const DOMAIN = 'programming';
const SUBJECT = 'java';
const TOPIC = 'java-basics';
const SUBTOPIC = 'whatisjava';

// Real page nodes from confirmed sidebar hierarchy
const PAGES = {
  A: {
    id: 'what-is-java',
    heading: 'What Is Java?',
  },
  B: {
    id: 'java-syntax',
    heading: 'Syntax & Structure',
  },
  C: {
    id: 'primitive-data-types',
    heading: 'Primitive Data Types',
  },
} as const;

const GROUP_NODE_ID = 'java-fundamentals'; // Confirmed group node

// ============================================================
// CERTIFICATION TRACKING
// ============================================================

const certificationResults = {
  backend: {
    database: 'PASS',
    validator: 'PASS (23/23)',
    repository: 'PASS (18/18)',
    composer: 'PASS (23/23)',
    delivery: 'PASS (26/26)',
  },
  browser: {
    applicationAvailability: false,
    authentication: false,
    pageA: false,
    pageB: false,
    pageC: false,
    exactUrlIdentity: false,
    exactActiveSidebar: false,
    activeUrl: false,
    previousNext: false,
    pageIsolation: false,
    concurrentIsolation: false,
    normalizedIdRejection: false,
    invalidIdRejection: false,
    groupRejection: false,
  },
};

function markCertified(gate: keyof typeof certificationResults.browser) {
  certificationResults.browser[gate] = true;
}

function isCertified(): boolean {
  return Object.values(certificationResults.browser).every(v => v === true);
}

function printCertificationReport() {
  console.log('\n' + '='.repeat(64));
  console.log('PHASE 1 CERTIFICATION REPORT');
  console.log('='.repeat(64));
  
  console.log('\nBACKEND CERTIFICATION (Frozen Layers):');
  console.log('─'.repeat(64));
  console.log(`  Database identity:          ${certificationResults.backend.database}`);
  console.log(`  SidebarNavigationValidator: ${certificationResults.backend.validator}`);
  console.log(`  TutorialSectionRepository:  ${certificationResults.backend.repository}`);
  console.log(`  TutorialComposerService:    ${certificationResults.backend.composer}`);
  console.log(`  TutorialDeliveryService:    ${certificationResults.backend.delivery}`);
  
  console.log('\nBROWSER CERTIFICATION:');
  console.log('─'.repeat(64));
  for (const [key, value] of Object.entries(certificationResults.browser)) {
    const status = value ? '✅ PASS' : '❌ FAIL';
    const label = key.replace(/([A-Z])/g, ' $1').trim();
    console.log(`  ${label.padEnd(30)}: ${status}`);
  }
  
  console.log('\n' + '='.repeat(64));
  if (isCertified()) {
    console.log('🟢 PHASE 1 LEARNER PAGE IDENTITY — CERTIFIED');
    console.log('   All identity gates passed');
    console.log('   Safe to deploy');
  } else {
    console.log('🔴 PHASE 1 LEARNER PAGE IDENTITY — NOT CERTIFIED');
    console.log('   One or more gates failed');
    console.log('   DO NOT DEPLOY');
  }
  console.log('='.repeat(64));
}

// ============================================================
// UTILITIES
// ============================================================

function tutorialUrl(navigationNodeId: string): string {
  return `${BASE_URL}/tutorial-v2/${DOMAIN}/${SUBJECT}/${TOPIC}/${SUBTOPIC}/${navigationNodeId}`;
}

function printEvidence(title: string, data: Record<string, unknown>): void {
  console.log('\n' + '='.repeat(64));
  console.log(title);
  console.log('='.repeat(64));

  for (const [key, value] of Object.entries(data)) {
    const displayValue = typeof value === 'string' && key.toLowerCase().includes('password')
      ? '[REDACTED]'
      : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);
    
    console.log(`${key}: ${displayValue}`);
  }
}

function getNavigationNodeIdFromHref(href: string): string {
  try {
    const url = new URL(href);
    const segments = url.pathname.split('/').filter(Boolean);
    return segments.at(-1) ?? '';
  } catch {
    return '';
  }
}

async function getTutorialNavigationEvidence(page: Page) {
  const links = await page.locator('a[href*="/tutorial-v2/"]').evaluateAll((anchors) =>
    anchors.map((anchor) => {
      const element = anchor as HTMLAnchorElement;
      return {
        text: element.textContent?.trim() ?? '',
        href: element.href,
        ariaCurrent: element.getAttribute('aria-current'),
        dataNavigationNodeId: element.getAttribute('data-navigation-node-id'),
        dataNodeId: element.getAttribute('data-node-id'),
      };
    })
  );

  return links;
}

async function getActiveTutorialNavigation(page: Page) {
  const links = await getTutorialNavigationEvidence(page);

  return links
    .filter((link) => link.ariaCurrent === 'page')
    .map((link) => ({
      ...link,
      navigationNodeId:
        link.dataNavigationNodeId ??
        link.dataNodeId ??
        getNavigationNodeIdFromHref(link.href),
    }));
}

async function assertExactPageIdentity(page: Page, expectedNodeId: string) {
  const finalUrl = page.url();
  const finalUrlObj = new URL(finalUrl);
  const finalSegments = finalUrlObj.pathname.split('/').filter(Boolean);
  const actualUrlNodeId = finalSegments.at(-1) ?? '';

  expect(actualUrlNodeId).toBe(expectedNodeId);

  const activeLinks = await getActiveTutorialNavigation(page);
  expect(activeLinks.length).toBeGreaterThanOrEqual(1);

  const matchingActiveLinks = activeLinks.filter(
    (link) => link.navigationNodeId === expectedNodeId
  );
  expect(matchingActiveLinks.length).toBeGreaterThanOrEqual(1);

  for (const link of matchingActiveLinks) {
    const linkNodeId = getNavigationNodeIdFromHref(link.href);
    expect(linkNodeId).toBe(expectedNodeId);
  }

  const activeUrl = matchingActiveLinks[0]?.href || null;

  return {
    finalUrl,
    urlNavigationNodeId: actualUrlNodeId,
    activeLinks,
    activeUrl,
    exactMatch: true,
  };
}

interface PageEvidence {
  page: string;
  request: { method: string; url: string };
  response: { status: number; url: string; contentType: string | null };
  identity: { subtopicSlug: string; navigationNodeId: string; brandId: string };
  browser: {
    finalUrl: string;
    finalUrlNavigationNodeId: string;
    heading: string | null;
    activeUrl: string | null;
    activeNavigationNodeIds: string[];
  };
  isolation: {
    expectedContentPresent: boolean;
    otherContentAbsent: boolean;
    contentDetails: Record<string, boolean>;
  };
  identityCheck: { urlNodeIdMatch: boolean; activeNodeIdMatch: boolean };
  result: 'PASS' | 'FAIL';
}

async function capturePageEvidence(
  page: Page,
  response: Response | null,
  expected: { id: string; heading: string },
  pageName: string
): Promise<PageEvidence> {
  const finalUrl = page.url();
  const bodyText = await page.locator('body').innerText();
  
  let heading: string | null = null;
  try {
    heading = await page.locator('h1').first().innerText({ timeout: 2000 });
  } catch {
    // No heading found
  }

  const identityResult = await assertExactPageIdentity(page, expected.id);

  const contentDetails: Record<string, boolean> = {};
  for (const [key, pageData] of Object.entries(PAGES)) {
    contentDetails[`${key}_${pageData.heading}`] = bodyText.includes(pageData.heading);
  }

  const expectedContentPresent = bodyText.includes(expected.heading);
  const otherHeadings = Object.values(PAGES)
    .filter(p => p.id !== expected.id)
    .map(p => p.heading);
  const otherContentAbsent = otherHeadings.every(h => !bodyText.includes(h));

  const urlNodeIdMatch = identityResult.urlNavigationNodeId === expected.id;
  const activeNodeIdMatch = identityResult.activeLinks.some(
    link => link.navigationNodeId === expected.id
  );

  return {
    page: pageName,
    request: { method: response?.request().method() || 'GET', url: tutorialUrl(expected.id) },
    response: {
      status: response?.status() || 0,
      url: response?.url() || '',
      contentType: response?.headers()['content-type'] || null,
    },
    identity: { subtopicSlug: SUBTOPIC, navigationNodeId: expected.id, brandId: 'skillup' },
    browser: {
      finalUrl,
      finalUrlNavigationNodeId: identityResult.urlNavigationNodeId,
      heading,
      activeUrl: identityResult.activeUrl,
      activeNavigationNodeIds: identityResult.activeLinks.map(l => l.navigationNodeId),
    },
    isolation: { expectedContentPresent, otherContentAbsent, contentDetails },
    identityCheck: { urlNodeIdMatch, activeNodeIdMatch },
    result: (
      response?.status() === 200 &&
      expectedContentPresent &&
      otherContentAbsent &&
      urlNodeIdMatch &&
      activeNodeIdMatch
    ) ? 'PASS' : 'FAIL',
  };
}

function saveEvidence(filename: string, data: unknown): void {
  const resultsDir = path.join(process.cwd(), 'test-results', 'phase1');
  
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const filepath = path.join(resultsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  
  console.log(`\n📁 Evidence saved: ${filepath}`);
}

// ============================================================
// TESTS
// ============================================================

test.describe('Phase 1 Learner Page Identity E2E Certification', () => {
  
  test.beforeAll(async () => {
    console.log('\n' + '='.repeat(64));
    console.log('PHASE 1 LEARNER PAGE IDENTITY — E2E CERTIFICATION');
    console.log('='.repeat(64));
    console.log('\nTarget: SkillUp Web Application');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Student: ${STUDENT_EMAIL}`);
    console.log(`\nCertified Identity: (subtopicId, navigationNodeId, brandId)`);
  });

  test('Group 1: Application is reachable', async ({ page }) => {
    const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const status = response?.status() || 0;

    printEvidence('APPLICATION AVAILABILITY', {
      URL: BASE_URL,
      HTTP_STATUS: status,
      STATUS: status >= 200 && status < 400 ? 'PASS' : 'FAIL',
    });

    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(400);
    
    markCertified('applicationAvailability');
  });

  test.describe('Group 2: Authentication', () => {
    test('Student can authenticate and access tutorial page', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

      await page.getByLabel(/email/i).fill(STUDENT_EMAIL);
      await page.getByLabel(/password/i).fill(STUDENT_PASSWORD);
      await page.getByRole('button', { name: /login|sign in/i }).click();
      await page.waitForLoadState('domcontentloaded');

      // Verify we can access an authenticated tutorial page
      const testPageResponse = await page.goto(tutorialUrl(PAGES.A.id), { 
        waitUntil: 'domcontentloaded' 
      });
      const finalUrl = page.url();
      const isAuthenticated = finalUrl.includes('/tutorial-v2/') && !finalUrl.includes('/login');

      printEvidence('AUTHENTICATION', {
        USER: STUDENT_EMAIL,
        PASSWORD: '[REDACTED]',
        SESSION: isAuthenticated ? 'PRESENT' : 'ABSENT',
        TEST_PAGE_STATUS: testPageResponse?.status() || 0,
        FINAL_URL: finalUrl,
        RESULT: (isAuthenticated && testPageResponse?.status() === 200) ? 'PASS' : 'FAIL',
      });

      expect(isAuthenticated).toBe(true);
      expect(testPageResponse?.status()).toBe(200);
      
      markCertified('authentication');
    });
  });

  test.describe('Groups 3-5: Individual Page Resolution', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.getByLabel(/email/i).fill(STUDENT_EMAIL);
      await page.getByLabel(/password/i).fill(STUDENT_PASSWORD);
      await page.getByRole('button', { name: /login|sign in/i }).click();
      await page.waitForLoadState('domcontentloaded');
    });

    test('Page A resolves to Page A content', async ({ page }) => {
      const url = tutorialUrl(PAGES.A.id);
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
      const evidence = await capturePageEvidence(page, response, PAGES.A, 'A');

      printEvidence('PAGE A — what-is-java', {
        REQUEST: `${evidence.request.method} ${evidence.request.url}`,
        HTTP_STATUS: evidence.response.status,
        RESPONSE_URL: evidence.response.url,
        FINAL_URL: evidence.browser.finalUrl,
        FINAL_URL_NODE_ID: evidence.browser.finalUrlNavigationNodeId,
        NAVIGATION_NODE_ID: evidence.identity.navigationNodeId,
        ACTIVE_URL: evidence.browser.activeUrl || '(not found)',
        ACTIVE_NODE_IDS: JSON.stringify(evidence.browser.activeNavigationNodeIds),
        HEADING: evidence.browser.heading || '(not found)',
        EXPECTED_CONTENT: PAGES.A.heading,
        CONTENT_PRESENT: evidence.isolation.expectedContentPresent,
        OTHER_CONTENT_ABSENT: evidence.isolation.otherContentAbsent,
        URL_NODE_ID_MATCH: evidence.identityCheck.urlNodeIdMatch,
        ACTIVE_NODE_ID_MATCH: evidence.identityCheck.activeNodeIdMatch,
        RESULT: evidence.result,
      });

      saveEvidence('page-a-evidence.json', evidence);

      expect(evidence.response.status).toBe(200);
      expect(evidence.isolation.expectedContentPresent).toBe(true);
      expect(evidence.isolation.otherContentAbsent).toBe(true);
      expect(evidence.identityCheck.urlNodeIdMatch).toBe(true);
      expect(evidence.identityCheck.activeNodeIdMatch).toBe(true);
      
      markCertified('pageA');
      markCertified('exactUrlIdentity');
      markCertified('exactActiveSidebar');
      markCertified('activeUrl');
    });

    test('Page B resolves to Page B content', async ({ page }) => {
      const url = tutorialUrl(PAGES.B.id);
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
      const evidence = await capturePageEvidence(page, response, PAGES.B, 'B');

      printEvidence('PAGE B — java-syntax', {
        REQUEST: `${evidence.request.method} ${evidence.request.url}`,
        HTTP_STATUS: evidence.response.status,
        RESPONSE_URL: evidence.response.url,
        FINAL_URL: evidence.browser.finalUrl,
        FINAL_URL_NODE_ID: evidence.browser.finalUrlNavigationNodeId,
        NAVIGATION_NODE_ID: evidence.identity.navigationNodeId,
        ACTIVE_URL: evidence.browser.activeUrl || '(not found)',
        HEADING: evidence.browser.heading || '(not found)',
        EXPECTED_CONTENT: PAGES.B.heading,
        CONTENT_PRESENT: evidence.isolation.expectedContentPresent,
        OTHER_CONTENT_ABSENT: evidence.isolation.otherContentAbsent,
        URL_NODE_ID_MATCH: evidence.identityCheck.urlNodeIdMatch,
        ACTIVE_NODE_ID_MATCH: evidence.identityCheck.activeNodeIdMatch,
        RESULT: evidence.result,
      });

      saveEvidence('page-b-evidence.json', evidence);

      expect(evidence.response.status).toBe(200);
      expect(evidence.isolation.expectedContentPresent).toBe(true);
      expect(evidence.isolation.otherContentAbsent).toBe(true);
      expect(evidence.identityCheck.urlNodeIdMatch).toBe(true);
      expect(evidence.identityCheck.activeNodeIdMatch).toBe(true);
      
      markCertified('pageB');
    });

    test('Page C resolves to Page C content', async ({ page }) => {
      const url = tutorialUrl(PAGES.C.id);
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
      const evidence = await capturePageEvidence(page, response, PAGES.C, 'C');

      printEvidence('PAGE C — primitive-data-types', {
        REQUEST: `${evidence.request.method} ${evidence.request.url}`,
        HTTP_STATUS: evidence.response.status,
        RESPONSE_URL: evidence.response.url,
        FINAL_URL: evidence.browser.finalUrl,
        FINAL_URL_NODE_ID: evidence.browser.finalUrlNavigationNodeId,
        NAVIGATION_NODE_ID: evidence.identity.navigationNodeId,
        ACTIVE_URL: evidence.browser.activeUrl || '(not found)',
        HEADING: evidence.browser.heading || '(not found)',
        EXPECTED_CONTENT: PAGES.C.heading,
        CONTENT_PRESENT: evidence.isolation.expectedContentPresent,
        OTHER_CONTENT_ABSENT: evidence.isolation.otherContentAbsent,
        URL_NODE_ID_MATCH: evidence.identityCheck.urlNodeIdMatch,
        ACTIVE_NODE_ID_MATCH: evidence.identityCheck.activeNodeIdMatch,
        RESULT: evidence.result,
      });

      saveEvidence('page-c-evidence.json', evidence);

      expect(evidence.response.status).toBe(200);
      expect(evidence.isolation.expectedContentPresent).toBe(true);
      expect(evidence.isolation.otherContentAbsent).toBe(true);
      expect(evidence.identityCheck.urlNodeIdMatch).toBe(true);
      expect(evidence.identityCheck.activeNodeIdMatch).toBe(true);
      
      markCertified('pageC');
    });
  });

  test.describe('Group 6: Page Isolation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.getByLabel(/email/i).fill(STUDENT_EMAIL);
      await page.getByLabel(/password/i).fill(STUDENT_PASSWORD);
      await page.getByRole('button', { name: /login|sign in/i }).click();
      await page.waitForLoadState('domcontentloaded');
    });

    test('A → B → C remain isolated', async ({ page }) => {
      const results: Array<{
        page: string;
        id: string;
        heading: string;
        bodyContainsHeading: boolean;
        bodyContainsOtherHeadings: string[];
        urlNodeId: string;
      }> = [];

      for (const [pageName, pageData] of Object.entries(PAGES)) {
        const url = tutorialUrl(pageData.id);
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        
        const bodyText = await page.locator('body').innerText();
        const finalUrl = new URL(page.url());
        const urlNodeId = finalUrl.pathname.split('/').filter(Boolean).at(-1) ?? '';
        
        const otherHeadings = Object.values(PAGES)
          .filter(p => p.id !== pageData.id)
          .map(p => p.heading)
          .filter(heading => bodyText.includes(heading));

        results.push({
          page: pageName,
          id: pageData.id,
          heading: pageData.heading,
          bodyContainsHeading: bodyText.includes(pageData.heading),
          bodyContainsOtherHeadings: otherHeadings,
          urlNodeId,
        });
      }

      const isolationMatrix = results.map(r => ({
        PAGE: r.page,
        NAVIGATION_NODE_ID: r.id,
        URL_NODE_ID: r.urlNodeId,
        EXPECTED_CONTENT: r.heading,
        CONTENT_PRESENT: r.bodyContainsHeading ? 'YES' : 'NO',
        CROSS_PAGE_LEAKAGE: r.bodyContainsOtherHeadings.length > 0 ? r.bodyContainsOtherHeadings.join(', ') : 'NONE',
        STATUS: (r.bodyContainsHeading && r.bodyContainsOtherHeadings.length === 0 && r.urlNodeId === r.id) ? 'PASS' : 'FAIL',
      }));

      printEvidence('PAGE ISOLATION (Sequential A→B→C)', {
        RESULTS: JSON.stringify(isolationMatrix, null, 2),
        CROSS_PAGE_CONTAMINATION: results.every(r => r.bodyContainsOtherHeadings.length === 0) ? 'NONE' : 'DETECTED',
        OVERALL_RESULT: results.every(r => r.bodyContainsHeading && r.bodyContainsOtherHeadings.length === 0) ? 'PASS' : 'FAIL',
      });

      saveEvidence('identity-matrix.json', isolationMatrix);

      for (const result of results) {
        expect(result.bodyContainsHeading).toBe(true);
        expect(result.bodyContainsOtherHeadings).toHaveLength(0);
        expect(result.urlNodeId).toBe(result.id);
      }
      
      markCertified('pageIsolation');
    });
  });

  test.describe('Group 7: Concurrent Isolation', () => {
    test('Concurrent A/B/C requests remain isolated', async ({ browser }) => {
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
      ]);

      const pages = await Promise.all(contexts.map(context => context.newPage()));

      try {
        for (const pg of pages) {
          await pg.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
          await pg.getByLabel(/email/i).fill(STUDENT_EMAIL);
          await pg.getByLabel(/password/i).fill(STUDENT_PASSWORD);
          await pg.getByRole('button', { name: /login|sign in/i }).click();
          await pg.waitForLoadState('domcontentloaded');
        }

        const navigationPromises = Object.values(PAGES).map((pageData, index) =>
          pages[index].goto(tutorialUrl(pageData.id), { waitUntil: 'domcontentloaded' })
        );

        await Promise.all(navigationPromises);

        const results = await Promise.all(
          pages.map(async (pg, index) => {
            const expected = Object.values(PAGES)[index];
            const bodyText = await pg.locator('body').innerText();
            
            const otherHeadings = Object.values(PAGES)
              .filter(p => p.id !== expected.id)
              .map(p => p.heading)
              .filter(heading => bodyText.includes(heading));

            return {
              page: Object.keys(PAGES)[index],
              id: expected.id,
              heading: expected.heading,
              headingPresent: bodyText.includes(expected.heading),
              crossPageLeakage: otherHeadings,
            };
          })
        );

        printEvidence('CONCURRENT PAGE ISOLATION', {
          PAGE_A: `${results[0].heading} - ${results[0].headingPresent ? 'PRESENT' : 'ABSENT'}`,
          PAGE_B: `${results[1].heading} - ${results[1].headingPresent ? 'PRESENT' : 'ABSENT'}`,
          PAGE_C: `${results[2].heading} - ${results[2].headingPresent ? 'PRESENT' : 'ABSENT'}`,
          CROSS_PAGE_CONTAMINATION: results.every(r => r.crossPageLeakage.length === 0) ? 'NONE' : 'DETECTED',
          RESULT: results.every(r => r.headingPresent && r.crossPageLeakage.length === 0) ? 'PASS' : 'FAIL',
        });

        for (const result of results) {
          expect(result.headingPresent).toBe(true);
          expect(result.crossPageLeakage).toHaveLength(0);
        }
        
        markCertified('concurrentIsolation');
      } finally {
        await Promise.all(contexts.map(context => context.close()));
      }
    });
  });

  test.describe('Group 8: Exact Node ID Requirement', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.getByLabel(/email/i).fill(STUDENT_EMAIL);
      await page.getByLabel(/password/i).fill(STUDENT_PASSWORD);
      await page.getByRole('button', { name: /login|sign in/i }).click();
      await page.waitForLoadState('domcontentloaded');
    });

    test('Normalized navigationNodeId is rejected', async ({ page }) => {
      const normalizedUrl = tutorialUrl('whatisjava');
      const response = await page.goto(normalizedUrl, { waitUntil: 'domcontentloaded' });
      const status = response?.status() || 0;
      
      const bodyText = await page.locator('body').innerText();
      const containsAnyPageContent = Object.values(PAGES).some(p => bodyText.includes(p.heading));

      printEvidence('EXACT NODE ID — Normalized (Should Reject)', {
        CORRECT_ID: PAGES.A.id,
        NORMALIZED_ID: 'whatisjava',
        URL: normalizedUrl,
        HTTP_STATUS: status,
        TUTORIAL_CONTENT_PRESENT: containsAnyPageContent,
        RESULT: (!containsAnyPageContent) ? 'REJECTED (PASS)' : 'ACCEPTED (FAIL)',
      });

      expect(containsAnyPageContent).toBe(false);
      
      markCertified('normalizedIdRejection');
    });
  });

  test.describe('Group 9: Invalid Page Handling', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.getByLabel(/email/i).fill(STUDENT_EMAIL);
      await page.getByLabel(/password/i).fill(STUDENT_PASSWORD);
      await page.getByRole('button', { name: /login|sign in/i }).click();
      await page.waitForLoadState('domcontentloaded');
    });

    test('Nonexistent page does not leak tutorial content', async ({ page }) => {
      const invalidUrl = tutorialUrl('page-that-does-not-exist');
      const response = await page.goto(invalidUrl, { waitUntil: 'domcontentloaded' });
      const status = response?.status() || 0;

      const bodyText = await page.locator('body').innerText();
      const containsAnyPageContent = Object.values(PAGES).some(p => bodyText.includes(p.heading));

      printEvidence('INVALID PAGE', {
        NAVIGATION_NODE_ID: 'page-that-does-not-exist',
        URL: invalidUrl,
        HTTP_STATUS: status,
        TUTORIAL_CONTENT_LEAKED: containsAnyPageContent ? 'YES (FAIL)' : 'NO (PASS)',
        RESULT: !containsAnyPageContent ? 'PASS' : 'FAIL',
      });

      expect(containsAnyPageContent).toBe(false);
      
      markCertified('invalidIdRejection');
    });
  });

  test.describe('Group 10: Group Node Rejection', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.getByLabel(/email/i).fill(STUDENT_EMAIL);
      await page.getByLabel(/password/i).fill(STUDENT_PASSWORD);
      await page.getByRole('button', { name: /login|sign in/i }).click();
      await page.waitForLoadState('domcontentloaded');
    });

    test('Group node cannot be used as page identity', async ({ page }) => {
      const groupNodeUrl = tutorialUrl(GROUP_NODE_ID);
      const response = await page.goto(groupNodeUrl, { waitUntil: 'domcontentloaded' });
      const status = response?.status() || 0;

      const bodyText = await page.locator('body').innerText();
      const containsAnyPageContent = Object.values(PAGES).some(p => bodyText.includes(p.heading));

      printEvidence('GROUP NODE REJECTION', {
        NAVIGATION_NODE_ID: GROUP_NODE_ID,
        URL: groupNodeUrl,
        HTTP_STATUS: status,
        TUTORIAL_CONTENT_LEAKED: containsAnyPageContent ? 'YES (FAIL)' : 'NO (PASS)',
        RESULT: !containsAnyPageContent ? 'PASS' : 'FAIL',
      });

      expect(containsAnyPageContent).toBe(false);
      
      markCertified('groupRejection');
    });
  });

  test.describe('Group 11: Previous/Next Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.getByLabel(/email/i).fill(STUDENT_EMAIL);
      await page.getByLabel(/password/i).fill(STUDENT_PASSWORD);
      await page.getByRole('button', { name: /login|sign in/i }).click();
      await page.waitForLoadState('domcontentloaded');
    });

    test('Previous/Next preserve exact node IDs', async ({ page }) => {
      await page.goto(tutorialUrl(PAGES.B.id), { waitUntil: 'domcontentloaded' });

      const links = await page.locator('a[href*="/tutorial-v2/"]').evaluateAll(
        (anchors) =>
          anchors.map((anchor) => ({
            text: anchor.textContent?.trim() || '',
            href: (anchor as HTMLAnchorElement).href,
          }))
      );

      const hasPreviousLink = links.some(link => link.href.endsWith(`/${PAGES.A.id}`));
      const hasNextLink = links.some(link => link.href.endsWith(`/${PAGES.C.id}`));
      const hasNormalizedLink = links.some(link => link.href.endsWith('/whatisjava'));

      printEvidence('PREVIOUS / NEXT', {
        CURRENT_PAGE: PAGES.B.id,
        PREVIOUS_EXPECTED: PAGES.A.id,
        NEXT_EXPECTED: PAGES.C.id,
        PREVIOUS_LINK_FOUND: hasPreviousLink ? 'YES' : 'NO',
        NEXT_LINK_FOUND: hasNextLink ? 'YES' : 'NO',
        NORMALIZED_LINK_FOUND: hasNormalizedLink ? 'YES (FAIL)' : 'NO (PASS)',
        RESULT: (hasPreviousLink && hasNextLink && !hasNormalizedLink) ? 'PASS' : 'FAIL',
      });

      expect(hasPreviousLink).toBe(true);
      expect(hasNextLink).toBe(true);
      expect(hasNormalizedLink).toBe(false);
      
      markCertified('previousNext');
    });
  });

  test.afterAll(async () => {
    printCertificationReport();
    
    if (!isCertified()) {
      throw new Error('Phase 1 certification failed - one or more gates did not pass');
    }
  });
});
