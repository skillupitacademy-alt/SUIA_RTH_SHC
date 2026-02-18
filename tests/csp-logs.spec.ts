import { test, expect } from '@playwright/test';
import { SignJWT } from 'jose';
import { mkdir, rm, writeFile } from 'fs/promises';
import path from 'path';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const LOG_DIR = path.join(process.cwd(), 'apps', 'api-server', 'logs', 'security');
const LOG_PATH = path.join(LOG_DIR, 'csp-audit.log');

async function createAdminToken(): Promise<string> {
  const secret = process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET ?? 'test-secret';
  return await new SignJWT({
    userId: 'super-admin-1',
    email: 'super@quizplatform.com',
    roles: ['super_admin'],
    isAdmin: true,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(new TextEncoder().encode(secret));
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

    const token = await createAdminToken();
    const response = await request.get(`${API_BASE}/api/admin/security/csp-logs?limit=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.total).toBe(2);
    expect(body.logs).toHaveLength(1);
    expect(body.logs[0].blockedUri).toBe('https://cdn.bad-b.com'); // newest first
    expect(body.nextCursor).toBeNull();

    await rm(path.join(process.cwd(), 'apps', 'api-server', 'logs'), { recursive: true, force: true });
  });
});
