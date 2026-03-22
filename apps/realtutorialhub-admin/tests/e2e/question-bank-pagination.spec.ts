import { expect, type Page,test } from '@playwright/test';

import { adminAuthFixtures } from './fixtures/auth';

const ADMIN_UI_URL = adminAuthFixtures.ADMIN_UI_URL;

type TabConfig = {
  tabName: 'Domains' | 'Subjects' | 'Topics' | 'Subtopics' | 'Questions' | 'Skills';
  endpoint: '/domains' | '/subjects' | '/topics' | '/subtopics' | '/questions' | '/skills';
  firstMarker: string;
  secondMarker: string;
};

const TAB_CONFIGS: TabConfig[] = [
  { tabName: 'Domains', endpoint: '/domains', firstMarker: 'Domain 01', secondMarker: 'Domain 21' },
  { tabName: 'Subjects', endpoint: '/subjects', firstMarker: 'Subject 01', secondMarker: 'Subject 21' },
  { tabName: 'Topics', endpoint: '/topics', firstMarker: 'Topic 01', secondMarker: 'Topic 21' },
  { tabName: 'Subtopics', endpoint: '/subtopics', firstMarker: 'Subtopic 01', secondMarker: 'Subtopic 21' },
  { tabName: 'Questions', endpoint: '/questions', firstMarker: 'Question 01: Cursor pagination smoke prompt', secondMarker: 'Question 21: Cursor pagination smoke prompt' },
  { tabName: 'Skills', endpoint: '/skills', firstMarker: 'Skill 01', secondMarker: 'Skill 21' },
];

function makeItems(endpoint: TabConfig['endpoint'], start: number): Record<string, unknown>[] {
  if (endpoint === '/questions') {
    return Array.from({ length: 20 }, (_, i) => {
      const idx = start + i;
      const id = `q-${idx.toString().padStart(2, '0')}`;
      return {
        id,
        questionText: `Question ${idx.toString().padStart(2, '0')}: Cursor pagination smoke prompt`,
        type: 'single',
        difficulty: 'intermediate',
        status: 'draft',
        createdAt: '2026-01-01T00:00:00.000Z',
        topic: {
          name: `Topic ${idx.toString().padStart(2, '0')}`,
          subject: {
            name: 'Subject Alpha',
            domain: { name: 'Domain Alpha' }
          }
        },
        questionSkills: []
      };
    });
  }

  return Array.from({ length: 20 }, (_, i) => {
    const idx = start + i;
    const suffix = idx.toString().padStart(2, '0');

    if (endpoint === '/domains') return { id: `d-${suffix}`, name: `Domain ${suffix}`, description: `Domain ${suffix} description` };
    if (endpoint === '/subjects') return { id: `s-${suffix}`, name: `Subject ${suffix}`, domainId: 'd-01', description: `Subject ${suffix} description` };
    if (endpoint === '/topics') return { id: `t-${suffix}`, name: `Topic ${suffix}`, subjectId: 's-01', description: `Topic ${suffix} description` };
    if (endpoint === '/subtopics') return { id: `st-${suffix}`, name: `Subtopic ${suffix}`, topicId: 't-01', description: `Subtopic ${suffix} description` };
    return { id: `sk-${suffix}`, name: `Skill ${suffix}`, category: 'technical', description: `Skill ${suffix} description` };
  });
}

async function registerCursorPaginationMock(page: Page, config: TabConfig, seenCursors: Map<string, string[]>) {
  const cursorToken = `${config.tabName.toLowerCase()}-cursor-1`;
  const pathPattern = `**/api/**/admin${config.endpoint}**`;

  await page.route(pathPattern, async (route) => {
    const url = new URL(route.request().url());
    const cursor = url.searchParams.get('cursor');
    const key = config.tabName.toLowerCase();
    const previous = seenCursors.get(key) ?? [];
    previous.push(cursor ?? '');
    seenCursors.set(key, previous);

    const isFirstPage = cursor === null || cursor === '';
    const isSecondPage = cursor === cursorToken;

    if (!isFirstPage && !isSecondPage) {
      await route.fulfill({
        status: 400,
        body: JSON.stringify({ message: `unexpected cursor for ${config.tabName}: ${cursor}` }),
        headers: { 'Content-Type': 'application/json' },
      });
      return;
    }

    const start = isFirstPage ? 1 : 21;
    const data = makeItems(config.endpoint, start);
    const responseBody = {
      data,
      total: 40,
      limit: 20,
      nextCursor: isFirstPage ? cursorToken : null,
      hasMore: isFirstPage,
      questions: config.endpoint === '/questions' ? data : undefined,
    };

    await route.fulfill({
      status: 200,
      body: JSON.stringify(responseBody),
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

test.describe('Question Bank Keyset Pagination', () => {
  test('smoke: each hierarchy tab loads and paginates with cursor next/previous', async ({ page }) => {
    test.skip(
      ADMIN_UI_URL === undefined ||
      ADMIN_UI_URL === null ||
      process.env.TEST_ADMIN_EMAIL === undefined ||
      process.env.TEST_ADMIN_PASSWORD === undefined,
      'Admin URL and test credentials are required for this E2E suite'
    );

    await adminAuthFixtures.loginAdmin(page);

    const seenCursors = new Map<string, string[]>();
    for (const tab of TAB_CONFIGS) {
      await registerCursorPaginationMock(page, tab, seenCursors);
    }

    await page.goto(`${ADMIN_UI_URL}/questions`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Question Bank')).toBeVisible();

    for (const tab of TAB_CONFIGS) {
      await page.getByRole('button', { name: new RegExp(tab.tabName, 'i') }).click();
      await expect(page.getByText(tab.firstMarker)).toBeVisible({ timeout: 20000 });

      await page.getByRole('button', { name: 'Next Page' }).click();
      await expect(page.getByText(tab.secondMarker)).toBeVisible({ timeout: 20000 });

      await page.getByRole('button', { name: 'Previous Page' }).click();
      await expect(page.getByText(tab.firstMarker)).toBeVisible({ timeout: 20000 });
    }

    for (const tab of TAB_CONFIGS) {
      const key = tab.tabName.toLowerCase();
      const cursors = seenCursors.get(key) ?? [];
      expect(cursors.length).toBeGreaterThanOrEqual(2);
      expect(cursors).toContain(`${key}-cursor-1`);
    }
  });
});

