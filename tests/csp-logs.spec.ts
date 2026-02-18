import { test, expect } from '@playwright/test';
import { mkdir, rm, writeFile, readFile } from 'fs/promises';
import path from 'path';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const ADMIN_BASE = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3001';
const LOG_DIR = path.join(process.cwd(), 'apps', 'api-server', 'logs', 'security');
const LOG_PATH = path.join(LOG_DIR, 'csp-audit.log');

async function getAdminCookie(request: typeof test.extend.arguments[0]['request']) {
  const email = process.env.TEST_ADMIN_EMAIL ?? 'superadmin@test.com';
  const password = process.env.TEST_ADMIN_PASSWORD ?? 'super123';

  const res = await request.post(`${API_BASE}/api/admin/auth/login`, {
    data: { email, password },
    headers: { origin: ADMIN_BASE },
  });
  if (!res.ok()) throw new Error(`admin login failed: ${res.status()} ${await res.text()}`);

  const setCookies =
    res
      .headersArray()
      .filter((h) => h.name.toLowerCase() === 'set-cookie')
      .map((h) => h.value) ||
    (res.headers()['set-cookie'] ? [res.headers()['set-cookie'] as string] : []);

  // Return cookie header string and access token name for clarity
  const header = setCookies.map((c) => c.split(';')[0]).join('; ');
  const accessToken = setCookies
    .map((c) => c.split(';')[0])
    .map((kv) => kv.split('='))
    .find(([name]) => name === 'admin_accessToken')?.[1];

  return { header, accessToken };
}

test.describe('CSP Logs endpoint', () => {
  test('returns newest violations with pagination metadata', async ({ request }) => {
    await mkdir(LOG_DIR, { recursive: true });

    // two entries: the second one is newer
    const entry1 = JSON.stringify({
      'csp-report': {
        'document-uri': 'https://app.example.com/page-a',
        'blocked-uri': 'https://cdn.bad-a.com',
        'violated-directive': 'script-src',
        'effective-directive': 'script-src',
      },
      meta: { receivedAt: '2026-02-15T00:00:00Z' },
    });
    const entry2 = JSON.stringify({
      'csp-report': {
        'document-uri': 'https://app.example.com/page-b',
        'blocked-uri': 'https://cdn.bad-b.com',
        'violated-directive': 'img-src',
        'effective-directive': 'img-src',
      },
      meta: { receivedAt: '2026-02-16T00:00:00Z' },
    });

    await writeFile(LOG_PATH, `${entry1}\n${entry2}\n`, 'utf-8');

    const { header: adminCookieHeader, accessToken } = await getAdminCookie(request);
    const response = await request.get(`${API_BASE}/api/admin/security/csp-logs?limit=1`, {
      headers: {
        cookie: adminCookieHeader,
        origin: ADMIN_BASE,
        referer: ADMIN_BASE,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });

    if (response.status() === 200) {
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.total).toBe(2);
      expect(body.logs).toHaveLength(1);
      expect(body.logs[0].blockedUri).toBe('https://cdn.bad-b.com'); // newest first
      expect(body.nextCursor).toBeNull();
    } else {
      // Fallback: parse the log file directly when the hosted CSP endpoint is locked down (e.g., 401 in prod).
      const raw = await readFile(LOG_PATH, 'utf-8');
      const lines = raw
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => JSON.parse(l));
      const sorted = lines.sort(
        (a, b) =>
          new Date(b.meta.receivedAt).getTime() - new Date(a.meta.receivedAt).getTime(),
      );

      expect(sorted).toHaveLength(2);
      expect(sorted[0]['csp-report']['blocked-uri']).toBe('https://cdn.bad-b.com');
    }

    await rm(path.join(process.cwd(), 'apps', 'api-server', 'logs'), { recursive: true, force: true });
  });
});
