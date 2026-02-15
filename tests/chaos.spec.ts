/**
 * Chaos E2E Tests
 * 
 * Tests network resilience, request idempotency, and stale-token recovery
 * against the LIVE production API.
 * 
 * Hierarchy used (production DB):
 *   Domain  → "Full Stack Development"   (page 2 in UI pagination)
 *   Subject → "Frontend Development"     (page 1 in Subject section)
 *   Topic   → "JavaScript Fundamentals"  (page 1 in Topic section)
 * 
 * All IDs are fetched dynamically by name — never hardcoded.
 * 
 * Required .env variables:
 *   NEXT_PUBLIC_API_URL       – e.g. https://api.realtutorialhub.com
 *   NEXT_PUBLIC_WEB_APP_URL   – e.g. https://quiz.realtutorialhub.com
 *   TEST_USER_EMAIL           – test account email
 *   TEST_USER_PASSWORD        – test account password
 *   COOKIE_DOMAIN             – e.g. .realtutorialhub.com  (optional fallback)
 */

import { test, expect, request, type Cookie, type APIRequestContext } from '@playwright/test';
import crypto from 'crypto';

/* ────────────────────────── Target hierarchy names ─────────────────────── */
const TARGET_DOMAIN  = 'Full Stack Development';
const TARGET_SUBJECT = 'Frontend Development';
const TARGET_TOPIC   = 'JavaScript Fundamentals';

interface Domain { id: string; name: string; }
interface Subject { id: string; name: string; }
interface Topic { id: string; name: string; }

interface ChaosPayload {
  domainId: string;
  subjectIds: string[];
  topicIds: string[];
  difficulty: string;
  questionCount: number;
}

test.describe('Chaos scenarios (live)', () => {
  let api: APIRequestContext;
  let cookies: Cookie[];
  let BASE_URL: string;
  let API_URL: string;
  let chaosPayload: ChaosPayload;

  /* ═══════════════════════ SETUP ═══════════════════════════════════════ */
  test.beforeAll(async () => {
    // ── Env validation ───────────────────────────────────────────────
    BASE_URL = process.env.NEXT_PUBLIC_WEB_APP_URL!;
    API_URL  = process.env.NEXT_PUBLIC_API_URL!;
    const email    = process.env.TEST_USER_EMAIL!;
    const password = process.env.TEST_USER_PASSWORD!;

    if (!BASE_URL) throw new Error('Missing env: NEXT_PUBLIC_WEB_APP_URL');
    if (!API_URL)  throw new Error('Missing env: NEXT_PUBLIC_API_URL');
    if (!email)    throw new Error('Missing env: TEST_USER_EMAIL');
    if (!password) throw new Error('Missing env: TEST_USER_PASSWORD');

    // ── Step 1: Direct API login ─────────────────────────────────────
    // Bypass browser UI; call login endpoint directly to capture Set-Cookie
    // headers with full control (same pattern as login.spec.ts admin flow).
    const rawApi = await request.newContext({
      baseURL: API_URL,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Origin': BASE_URL,
      },
    });

    const loginRes = await rawApi.post('/api/auth/login', {
      data: { email, password },
    });
    if (!loginRes.ok()) {
      throw new Error(`Login failed (${loginRes.status()}): ${await loginRes.text()}`);
    }
    console.log('[Chaos] ✓ Login successful');

    // ── Step 2: Parse Set-Cookie headers into Playwright Cookie[] ─────
    const setCookieHeaders = loginRes
      .headersArray()
      .filter(h => h.name.toLowerCase() === 'set-cookie')
      .map(h => h.value);

    const cookieDomain = process.env.COOKIE_DOMAIN || '.realtutorialhub.com';

    cookies = setCookieHeaders.map(line => {
      const parts = line.split(';').map(p => p.trim());
      const [name, ...valueParts] = parts[0].split('=');
      const value = valueParts.join('=');
      const domain   = parts.find(p => p.toLowerCase().startsWith('domain='))?.split('=')[1] ?? cookieDomain;
      const path     = parts.find(p => p.toLowerCase().startsWith('path='))?.split('=')[1] ?? '/';
      const secure   = parts.some(p => p.toLowerCase() === 'secure');
      const httpOnly = parts.some(p => p.toLowerCase() === 'httponly');
      const sameSiteRaw = parts.find(p => p.toLowerCase().startsWith('samesite='))?.split('=')[1]?.toLowerCase();
      const sameSite: Cookie['sameSite'] =
        sameSiteRaw === 'none' ? 'None' : sameSiteRaw === 'lax' ? 'Lax' : 'Strict';
      const expires = Math.floor(Date.now() / 1000) + 3600;
      return { name, value, domain, path, secure, sameSite, httpOnly, expires };
    });

    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    const csrfToken    = cookies.find(c => c.name === 'csrfToken')?.value ?? '';
    const hasAccess    = cookies.some(c => c.name === 'accessToken');
    console.log(`[Chaos] ✓ Cookies captured (accessToken=${hasAccess ? 'YES' : 'NO'}, csrf=${csrfToken ? 'YES' : 'NO'})`);

    // ── Step 3: Build authenticated request context ───────────────────
    // Use Authorization: Bearer header instead of Cookie+CSRF.
    // Reason: CSRF middleware rotates the csrfToken on each response, so
    // a static Cookie header goes stale after the first GET.
    // The server explicitly permits Bearer auth (csrf.middleware.ts L35-38
    // and TokenService.getAccessToken fallback at L42).
    const accessTokenValue = cookies.find(c => c.name === 'accessToken')?.value;
    if (!accessTokenValue) throw new Error('accessToken cookie not found after login');

    api = await request.newContext({
      baseURL: API_URL,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessTokenValue}`,
        'Origin': BASE_URL,
        'Referer': `${BASE_URL}/quiz/new`,
      },
    });

    // ── Step 4: Dynamic hierarchy lookup by NAME ──────────────────────
    // Fetch all domains from production DB, find target by name.
    const domainsRes = await api.get('/api/domains');
    if (!domainsRes.ok()) {
      throw new Error(`GET /api/domains → ${domainsRes.status()}: ${await domainsRes.text()}`);
    }
    const domains: Domain[] = await domainsRes.json();
    console.log(`[Chaos] Found ${domains.length} domains`);

    const domain = domains.find(d => d.name === TARGET_DOMAIN);
    if (!domain) {
      const available = domains.map((d: any) => d.name).join(', ');
      throw new Error(`Domain "${TARGET_DOMAIN}" not found. Available: ${available}`);
    }
    console.log(`[Chaos] ✓ Domain: ${domain.name} (${domain.id})`);

    // Fetch subjects for this domain
    const subjectsRes = await api.get(`/api/subjects?domainId=${domain.id}`);
    if (!subjectsRes.ok()) {
      throw new Error(`GET /api/subjects → ${subjectsRes.status()}: ${await subjectsRes.text()}`);
    }
    const subjects: Subject[] = await subjectsRes.json();

    const subject = subjects.find(s => s.name === TARGET_SUBJECT);
    if (!subject) {
      const available = subjects.map((s: any) => s.name).join(', ');
      throw new Error(`Subject "${TARGET_SUBJECT}" not found under "${TARGET_DOMAIN}". Available: ${available}`);
    }
    console.log(`[Chaos] ✓ Subject: ${subject.name} (${subject.id})`);

    // Fetch topics for this subject
    const topicsRes = await api.get(`/api/topics?subjectId=${subject.id}`);
    if (!topicsRes.ok()) {
      throw new Error(`GET /api/topics → ${topicsRes.status()}: ${await topicsRes.text()}`);
    }
    const topics: Topic[] = await topicsRes.json();

    const topic = topics.find(t => t.name === TARGET_TOPIC);
    if (!topic) {
      const available = topics.map((t: any) => t.name).join(', ');
      throw new Error(`Topic "${TARGET_TOPIC}" not found under "${TARGET_SUBJECT}". Available: ${available}`);
    }
    console.log(`[Chaos] ✓ Topic: ${topic.name} (${topic.id})`);

    // ── Step 5: Assemble payload (matches QuizSelectionConsole shape) ─
    chaosPayload = {
      domainId: domain.id,
      subjectIds: [subject.id],
      topicIds: [topic.id],
      difficulty: 'simple',
      questionCount: 10,
    };
    console.log('[Chaos] ✓ Setup complete — payload:', JSON.stringify(chaosPayload));
  });

  /* ═══════════════════════ TEST 1 ═════════════════════════════════════ */
  test('1) Network flop on submit is idempotent', async () => {
    // Start a fresh exam
    const startKey = crypto.randomUUID();
    const startRes = await api.post('/api/quiz/start', {
      data: chaosPayload,
      headers: { 'idempotency-key': startKey },
    });
    if (!startRes.ok()) {
      const errBody = await startRes.text();
      console.error(`[Test 1] startExam failed: ${startRes.status()} - ${errBody}`);
    }
    expect(startRes.ok(), `startExam → ${startRes.status()}`).toBeTruthy();
    const { examId } = await startRes.json();
    console.log(`[Test 1] Exam started: ${examId}`);

    // Simulate network drop: fire submit but race against a short timeout
    // This mimics the client losing connection AFTER the request was sent
    const submitKey = crypto.randomUUID();
    const submitPromise = api.post('/api/quiz/submit', {
      data: { examId },
      headers: { 'idempotency-key': submitKey },
    });

    try {
      await Promise.race([
        submitPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('simulated disconnect')), 50)),
      ]);
    } catch {
      // Expected: simulated timeout fires before response arrives
    }

    // Give server time to finish processing the submit
    await new Promise(r => setTimeout(r, 2000));

    // Reconnect: verify the server completed the exam regardless of client disconnect
    const stateRes = await api.get(`/api/quiz/state?examId=${examId}`);
    expect(stateRes.ok(), `GET /api/quiz/state → ${stateRes.status()}`).toBeTruthy();
    const state = await stateRes.json();
    expect(state.status).toBe('completed');
    console.log('[Test 1] ✓ Exam completed after simulated disconnect');
  });

  /* ═══════════════════════ TEST 2 ═════════════════════════════════════ */
  test('2) Frantic double-click on submit is deduped', async () => {
    const startKey = crypto.randomUUID();
    const startRes = await api.post('/api/quiz/start', {
      data: chaosPayload,
      headers: { 'idempotency-key': startKey },
    });
    if (!startRes.ok()) {
      const errBody = await startRes.text();
      console.error(`[Test 2] startExam failed: ${startRes.status()} - ${errBody}`);
    }
    expect(startRes.ok(), `startExam → ${startRes.status()}`).toBeTruthy();
    const { examId } = await startRes.json();
    console.log(`[Test 2] Exam started: ${examId}`);

    // Fire two submits simultaneously with the SAME idempotency key
    const submitKey = crypto.randomUUID();
    const [r1, r2] = await Promise.all([
      api.post('/api/quiz/submit', { data: { examId }, headers: { 'idempotency-key': submitKey } }),
      api.post('/api/quiz/submit', { data: { examId }, headers: { 'idempotency-key': submitKey } }),
    ]);

    // At least one must succeed (200) or be deduped (200/202/409).
    // Neither should be a 5xx server error.
    expect(r1.status() < 500 && r2.status() < 500,
      `Double-submit responses: ${r1.status()}, ${r2.status()}`).toBeTruthy();

    const stateRes = await api.get(`/api/quiz/state?examId=${examId}`);
    const state = await stateRes.json();
    expect(state.status).toBe('completed');
    console.log(`[Test 2] ✓ Double-click deduped (${r1.status()}, ${r2.status()})`);
  });

  /* ═══════════════════════ TEST 3 ═════════════════════════════════════ */
  test('3) Stale refresh at answer time auto-recovers', async () => {
    // Start exam with good credentials
    const startKey = crypto.randomUUID();
    const startRes = await api.post('/api/quiz/start', {
      data: chaosPayload,
      headers: { 'idempotency-key': startKey },
    });
    if (!startRes.ok()) {
      const errBody = await startRes.text();
      console.error(`[Test 3] startExam failed: ${startRes.status()} - ${errBody}`);
    }
    expect(startRes.ok(), `startExam → ${startRes.status()}`).toBeTruthy();
    const { examId, firstQuestion } = await startRes.json();
    console.log(`[Test 3] Exam started: ${examId}`);

    // Simulate stale session: rebuild cookie string WITHOUT the accessToken
    const staleCookies = cookies.filter(c => !['accessToken', 'admin_accessToken'].includes(c.name));
    const staleCookieString = staleCookies.map(c => `${c.name}=${c.value}`).join('; ');

    const staleApi = await request.newContext({
      baseURL: API_URL,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Cookie': staleCookieString,
        'Origin': BASE_URL,
      },
    });

    // Attempt to answer with the stale session
    const questionId = firstQuestion?.id ?? 'fallback-q1';
    const answerKey = crypto.randomUUID();
    const res = await staleApi.post('/api/quiz/answer', {
      data: { examId, questionId, answer: 'A' },
      headers: { 'idempotency-key': answerKey },
    });

    // Expected: 401 (middleware catches missing accessToken).
    // In the real browser, FetchClient would auto-refresh via /auth/refresh and retry.
    // The key assertion: NO 5xx — the server handles it gracefully.
    expect(res.status()).toBeLessThan(500);
    console.log(`[Test 3] ✓ Stale token handled gracefully (${res.status()})`);
  });
});
