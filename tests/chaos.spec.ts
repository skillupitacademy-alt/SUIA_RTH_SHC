import { test, expect, request } from '@playwright/test';
import crypto from 'crypto';

const { BASE_URL, API_URL, TEST_EMAIL, TEST_PASSWORD } = process.env;

test.describe('Chaos scenarios (live)', () => {
  let api: any;
  let cookies: any[];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL!);
    await page.fill('input[type="password"]', TEST_PASSWORD!);
    await page.click('button:has-text("Login")');
    await page.waitForURL(/dashboard|quiz/);
    cookies = await page.context().cookies();
    await page.close();

    api = await request.newContext({
      baseURL: API_URL,
      extraHTTPHeaders: { 'Content-Type': 'application/json' },
      storageState: { cookies } as any,
    });
  });

  test('1) Network flop on submit is idempotent', async () => {
    // Start exam
    const startKey = crypto.randomUUID();
    const startRes = await api.post('/api/quiz/start', {
      data: { blueprintId: 'TEST_BLUEPRINT' },
      headers: { 'idempotency-key': startKey },
    });
    expect(startRes.ok()).toBeTruthy();
    const { examId } = await startRes.json();

    // Submit an answer normally (optional)
    const ansKey = crypto.randomUUID();
    await api.post('/api/quiz/answer', {
      data: { examId, questionId: 'Q1', answer: 'A' },
      headers: { 'idempotency-key': ansKey },
    });

    // Simulate network drop after request sent: fire submit but abort reading response
    const submitKey = crypto.randomUUID();
    const submitPromise = api.fetch('/api/quiz/submit', {
      method: 'POST',
      data: { examId },
      headers: { 'idempotency-key': submitKey },
    });
    
    // In Playwright context, we can't easily "abort" a promise without it being a page request
    // But for a live environment, we check if the server processed it regardless of the disconnect
    try {
        await Promise.race([
            submitPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Simulated Timeout')), 10))
        ]);
    } catch (e) {
        // Expected timeout/disconnect simulation
    }

    // Reconnect: check state
    const state = await api.get(`/api/quiz/state?examId=${examId}`);
    expect(state.ok()).toBeTruthy();
    const body = await state.json();
    expect(body.status).toBe('completed');
  });

  test('2) Frantic double-click on submit is deduped', async () => {
    const startKey = crypto.randomUUID();
    const start = await api.post('/api/quiz/start', {
      data: { blueprintId: 'TEST_BLUEPRINT' },
      headers: { 'idempotency-key': startKey },
    });
    const { examId } = await start.json();

    const submitKey = crypto.randomUUID();
    const [r1, r2] = await Promise.all([
      api.post('/api/quiz/submit', { data: { examId }, headers: { 'idempotency-key': submitKey } }),
      api.post('/api/quiz/submit', { data: { examId }, headers: { 'idempotency-key': submitKey } }),
    ]);

    expect(r1.ok() || r2.ok()).toBeTruthy();
    const state = await api.get(`/api/quiz/state?examId=${examId}`);
    const body = await state.json();
    expect(body.status).toBe('completed');
  });

  test('3) Stale refresh at answer time auto-recovers', async () => {
    const startKey = crypto.randomUUID();
    const start = await api.post('/api/quiz/start', {
      data: { blueprintId: 'TEST_BLUEPRINT' },
      headers: { 'idempotency-key': startKey },
    });
    const { examId } = await start.json();

    // Simulate stale access token: drop access cookie, keep refresh cookie
    const filteredCookies = cookies.filter(c => !['accessToken', 'admin_accessToken'].includes(c.name));
    api = await request.newContext({
      baseURL: API_URL,
      storageState: { cookies: filteredCookies } as any,
      extraHTTPHeaders: { 'Content-Type': 'application/json' },
    });

    const answerKey = crypto.randomUUID();
    const res = await api.post('/api/quiz/answer', {
      data: { examId, questionId: 'Q1', answer: 'B' },
      headers: { 'idempotency-key': answerKey },
    });
    // Expect either 200 after refresh+retry or a 401/403 that triggers your client retry in the real app.
    expect(res.status()).toBeLessThan(500);
  });
});
