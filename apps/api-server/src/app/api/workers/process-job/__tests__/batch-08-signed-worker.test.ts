import { createHash } from 'node:crypto';
import { SignJWT } from 'jose';
import { NextRequest } from 'next/server';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { JobType } from '@quiz/types';
import { ExportSaga } from '@/lib/export/export.saga';
import { JobsService } from '@/modules/system/jobs.service';
import { POST } from '../route';

vi.mock('@/lib/job-lock', () => ({ acquireJobLock: vi.fn(async () => true), releaseJobLock: vi.fn() }));
vi.mock('@/modules/core/resilience.manager', () => ({ resilienceManager: { isHighLoad: () => false } }));
vi.mock('@/lib/export/export.saga', () => ({ ExportSaga: { execute: vi.fn() } }));
vi.mock('@/modules/system/jobs.service', () => ({ JobsService: { getJob: vi.fn(async (_job: string, user: string) => user === 'owner' ? { status: 'pending', type: JobType.EXPORT_SAGA, payload: { examId: 'exam', format: 'json' } } : undefined), updateJobStatus: vi.fn() } }));
const key = 'disposable-qstash-signing-key-32bytes';
const previous = { current: process.env.QSTASH_CURRENT_SIGNING_KEY, next: process.env.QSTASH_NEXT_SIGNING_KEY };
async function request(userId: string, valid: boolean) {
  const body = JSON.stringify({ jobId: 'job-1', userId });
  const signature = await new SignJWT({ body: createHash('sha256').update(body).digest('base64url') }).setProtectedHeader({ alg: 'HS256' }).setIssuer('Upstash').setExpirationTime('5m').sign(new TextEncoder().encode(valid ? key : 'wrong-disposable-signing-key-32b'));
  return new NextRequest('http://localhost/api/workers/process-job', { method: 'POST', headers: { 'upstash-signature': signature }, body });
}
describe('signed worker and orchestrator boundary', () => {
  beforeAll(() => { process.env.QSTASH_CURRENT_SIGNING_KEY = key; process.env.QSTASH_NEXT_SIGNING_KEY = key; });
  beforeEach(() => vi.clearAllMocks());
  afterAll(() => { for (const [name, value] of Object.entries({ QSTASH_CURRENT_SIGNING_KEY: previous.current, QSTASH_NEXT_SIGNING_KEY: previous.next })) { if (value === undefined) delete process.env[name]; else process.env[name] = value; } vi.resetModules(); });
  it('dispatches a valid signed owner job', async () => {
    expect((await POST(await request('owner', true), undefined)).status).toBe(200);
    expect(JobsService.getJob).toHaveBeenCalledExactlyOnceWith('job-1', 'owner');
    expect(ExportSaga.execute).toHaveBeenCalledTimes(1);
  });
  it('rejects invalid transport signature before lookup and dispatch', async () => {
    expect((await POST(await request('owner', false), undefined)).status).toBe(401);
    expect(JobsService.getJob).not.toHaveBeenCalled(); expect(ExportSaga.execute).not.toHaveBeenCalled();
  });
  it('does not dispatch a signed payload with a conflicting stored owner', async () => {
    expect((await POST(await request('other', true), undefined)).status).toBe(200);
    expect(JobsService.getJob).toHaveBeenCalledExactlyOnceWith('job-1', 'other');
    expect(ExportSaga.execute).not.toHaveBeenCalled();
  });
});
