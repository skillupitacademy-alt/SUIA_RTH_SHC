import { db } from '@quiz/db';
import { NextRequest } from 'next/server';
import { PgDialect } from 'drizzle-orm/pg-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { ExportSaga } from '@/lib/export/export.saga';
import { JobsService } from '@/modules/system/jobs.service';
import { queueService } from '@/modules/core/queue.service';
import { ExportEngine } from '@/lib/export/exportEngine';
import { POST } from '../route';

vi.mock('@quiz/db', async (original) => ({ ...await original<typeof import('@quiz/db')>(), db: { query: { exams: { findFirst: vi.fn() } } } }));
vi.mock('@/lib/export/export.saga', () => ({ ExportSaga: { start: vi.fn(async () => 'job-test'), execute: vi.fn() } }));
vi.mock('@/modules/system/jobs.service', () => ({ JobsService: { createJob: vi.fn(async () => ({ id: 'job-test' })) } }));
vi.mock('@/modules/core/queue.service', () => ({ queueService: { enqueue: vi.fn(async () => ({ success: true })) } }));
vi.mock('@/lib/export/exportEngine', () => ({ ExportEngine: { getInstance: () => ({ processExport: generation }) } }));
const generation = vi.hoisted(() => vi.fn(async () => 'private-ref'));
const secret = new TextEncoder().encode('isolated-trigger-test-key-32bytes!');
const tokens = new TokenService(secret, secret, secret);
const previous = container.get(TokenService);
const env = { queue: process.env.QUEUE_ENABLED, qstash: process.env.QSTASH_TOKEN, node: process.env.NODE_ENV };
const exams = new Map<string, { userId: string }>();
async function request(userId: string, brand: 'skillup' | 'realtutorialhub', examId = 'private-exam', format = 'json') {
  const token = await tokens.generateAccessToken({ userId, originalUserId: userId, shadowUserId: userId,
    email: 'learner@example.test', roles: ['student'], brand, tokenType: 'user', aud: 'user' });
  return new NextRequest('http://localhost/api/export/trigger', { method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', 'x-user-id': 'forged' },
    body: JSON.stringify({ examId, format, userId: 'forged' }) });
}
function noDispatch() {
  expect(ExportSaga.start).not.toHaveBeenCalled(); expect(ExportSaga.execute).not.toHaveBeenCalled();
  expect(JobsService.createJob).not.toHaveBeenCalled(); expect(queueService.enqueue).not.toHaveBeenCalled(); expect(generation).not.toHaveBeenCalled();
}
describe('export trigger resource authority', () => {
  beforeEach(() => {
    vi.clearAllMocks(); container.register(TokenService, tokens); exams.clear(); exams.set('private-exam', { userId: 'owner' });
    process.env.QUEUE_ENABLED = 'true'; delete process.env.QSTASH_TOKEN; process.env.NODE_ENV = 'test';
    vi.mocked(db.query.exams.findFirst).mockImplementation(async ({ where }: any) => {
      const query = new PgDialect().sqlToQuery(where); return exams.get(String(query.params[0])) as never;
    });
  });
  afterEach(() => {
    container.register(TokenService, previous);
    for (const [name, value] of Object.entries({ QUEUE_ENABLED: env.queue, QSTASH_TOKEN: env.qstash, NODE_ENV: env.node })) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  });
  it.each(['queue', 'qstash', 'qstash-fallback', 'development', 'production'])('controls all effects in %s dispatch branch', async branch => {
    process.env.QUEUE_ENABLED = branch === 'queue' ? 'true' : 'false';
    if (branch.startsWith('qstash')) process.env.QSTASH_TOKEN = 'disposable';
    if (branch === 'production') process.env.NODE_ENV = 'production';
    if (branch === 'qstash-fallback') vi.mocked(queueService.enqueue).mockResolvedValueOnce({ success: false } as never);
    const owner = await POST(await request('owner', 'skillup'));
    expect(owner.status).toBe(200);
    expect(db.query.exams.findFirst).toHaveBeenCalledTimes(1);
    if (branch === 'queue' || branch === 'production') expect(ExportSaga.start).toHaveBeenCalledExactlyOnceWith('private-exam', 'owner', 'json');
    if (branch.startsWith('qstash')) expect(queueService.enqueue).toHaveBeenCalledTimes(1);
    if (branch === 'qstash-fallback') expect(ExportSaga.execute).toHaveBeenCalledTimes(1);
    if (branch === 'development') expect(generation).toHaveBeenCalledTimes(1);
    vi.clearAllMocks();
    expect((await POST(await request('other', 'skillup'))).status).toBe(403); noDispatch();
    expect((await POST(await request('owner', 'skillup', 'absent'))).status).toBe(404); noDispatch();
  });
  it('retains foreign tenant equal-ID denial requirement', async () => {
    const response = await POST(await request('owner', 'realtutorialhub'));
    expect.soft(response.status).toBe(403); noDispatch();
  });
  it.each(['pdf', 'json', 'csv', 'student-insight-pdf'])('accepts supported %s format for owner', async format => {
    expect((await POST(await request('owner', 'skillup', 'private-exam', format))).status).toBe(200);
    expect(ExportSaga.start).toHaveBeenCalledExactlyOnceWith('private-exam', 'owner', format);
  });
  it('rejects malformed body before exam lookup', async () => {
    expect((await POST(await request('owner', 'skillup', 'private-exam', 'invalid'))).status).toBe(400);
    expect(db.query.exams.findFirst).not.toHaveBeenCalled(); noDispatch();
  });
  it('rejects invalid and missing credentials without resource lookup', async () => {
    for (const authorization of ['', 'Bearer malformed']) {
      const req = new NextRequest('http://localhost/api/export/trigger', { method: 'POST', headers: { authorization }, body: '{}' });
      const response = await POST(req); expect(response.status).toBe(401); expect(await response.json()).toEqual({ error: 'Unauthorized' });
    }
    expect(db.query.exams.findFirst).not.toHaveBeenCalled(); noDispatch();
  });
  it.each(['expired', 'wrong-class', 'invalid-signature'])('rejects %s token before resource lookup', async kind => {
    const otherKey = new TextEncoder().encode('separate-disposable-signing-key-32b');
    const signer = kind === 'invalid-signature' ? new TokenService(otherKey, otherKey, otherKey) : tokens;
    const admin = kind === 'wrong-class';
    const token = await signer.generateAccessToken({ userId: 'owner', roles: admin ? ['admin'] : ['student'], brand: 'skillup',
      tokenType: admin ? 'admin' : 'user', aud: admin ? 'admin' : 'user', isAdmin: admin }, kind === 'expired' ? '-1h' : undefined);
    const req = new NextRequest('http://localhost/api/export/trigger', { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: '{}' });
    const response = await POST(req); expect(response.status).toBe(401); expect(await response.json()).toEqual({ error: 'Unauthorized' });
    expect(db.query.exams.findFirst).not.toHaveBeenCalled(); noDispatch();
  });
  it('preserves user-cookie precedence over bearer credentials', async () => {
    const valid = await tokens.generateAccessToken({ userId: 'owner', roles: ['student'], brand: 'skillup', tokenType: 'user', aud: 'user' });
    const make = (cookie: string, bearer: string) => new NextRequest('http://localhost/api/export/trigger', { method: 'POST',
      headers: { cookie: `accessToken=${cookie}`, authorization: `Bearer ${bearer}`, 'content-type': 'application/json' },
      body: JSON.stringify({ examId: 'private-exam', format: 'json' }) });
    expect((await POST(make(valid, 'invalid'))).status).toBe(200);
    vi.clearAllMocks();
    expect((await POST(make('invalid', valid))).status).toBe(401);
    expect(db.query.exams.findFirst).not.toHaveBeenCalled(); noDispatch();
  });
  it('keeps dispatch errors separate and sanitized', async () => {
    vi.mocked(ExportSaga.start).mockRejectedValueOnce(new Error('sensitive dispatch detail'));
    const response = await POST(await request('owner', 'skillup'));
    expect(response.status).toBe(500); expect(await response.json()).toEqual({ error: 'Internal Server Error' });
  });
  it('keeps operational lookup errors separate and sanitized', async () => {
    vi.mocked(db.query.exams.findFirst).mockRejectedValueOnce(new Error('sensitive detail'));
    const response = await POST(await request('owner', 'skillup'));
    expect(response.status).toBe(500); expect(await response.json()).toEqual({ error: 'Internal Server Error' }); noDispatch();
  });
});
