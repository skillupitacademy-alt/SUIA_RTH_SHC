import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { db } from '@quiz/db';
import { storage } from '@/lib/storage';
import { redis } from '@/lib/redis';
import { JobsService } from '@/modules/system/jobs.service';
import { GET } from '../route';

/**
 * B08-F: Private Export Job Status Ownership Qualification
 *
 * Governing Architecture: audit/FinalAechitecture.md (Tenant Learner Identity, Resource Guard)
 * Governing Task: audit/W1.2_Gemini_Controlled_Batch_08_Task.md (B08-F)
 *
 * Verifies that GET /api/export/status/[jobId]:
 * 1. Positive Control: Legitimate job owner can retrieve job status (HTTP 200).
 * 2. Authentication Control: Anonymous caller without token is denied (HTTP 401).
 * 3. Existing-job same-user ownership containment rejects non-owners.
 * 4. Equal local IDs across brands require an authoritative tenant binding, still absent
 *    from this isolated resource fixture and retained as a failing security invariant.
 */

const TEST_SECRET = new TextEncoder().encode('export-status-test-secret-32b!');
const testTokenService = new TokenService(TEST_SECRET, TEST_SECRET, TEST_SECRET);

const mockJobs: Map<string, any> = new Map();

vi.mock('@/modules/system/jobs.service', () => ({
  JobsService: {
    getJobStatus: vi.fn(async (jobId: string) => mockJobs.get(jobId) ?? null),
    updateJobStatus: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      exams: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
  },
  exams: { id: 'exams.id' },
}));

vi.mock('@/lib/redis', () => ({
  redis: {
    get: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('@/lib/storage', () => ({
  storage: {
    exists: vi.fn(async () => true),
    getReadUrl: vi.fn(async (fileRef: string) => `https://mock-storage.test/${fileRef}`),
  },
}));

describe('B08-F: Private Export Status Ownership', () => {
  const previousTokenService = TokenService.getInstance();
  const previousContainerTokenService = container.get(TokenService);
  const OWNER_USER_ID = 'owner-uuid-101';
  const ATTACKER_USER_ID = 'attacker-uuid-102';
  const JOB_ID = 'job-export-status-101';

  let ownerToken: string;
  let attackerToken: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockJobs.clear();

    container.register(TokenService, testTokenService);
    TokenService.setInstance(testTokenService);

    ownerToken = await testTokenService.generateAccessToken({
      userId: OWNER_USER_ID,
      originalUserId: OWNER_USER_ID,
      shadowUserId: OWNER_USER_ID,
      email: 'owner@example.test',
      roles: ['student'],
      brand: 'skillup',
      tokenType: 'user',
      aud: 'user',
    });

    attackerToken = await testTokenService.generateAccessToken({
      userId: ATTACKER_USER_ID,
      originalUserId: ATTACKER_USER_ID,
      shadowUserId: ATTACKER_USER_ID,
      email: 'attacker@example.test',
      roles: ['student'],
      brand: 'skillup',
      tokenType: 'user',
      aud: 'user',
    });

    // Seed owner's export job in completed status with sensitive downloadUrl
    mockJobs.set(JOB_ID, {
      id: JOB_ID,
      userId: OWNER_USER_ID,
      brand: 'skillup',
      status: 'completed',
      payload: { format: 'json', brand: 'skillup' },
      result: {
        format: 'json',
        brand: 'skillup',
        downloadUrl: '/api/export/download?jobId=job-export-status-101',
      },
      updatedAt: new Date(),
    });
  });

  afterEach(() => {
    TokenService.setInstance(previousTokenService);
    container.register(TokenService, previousContainerTokenService);
    vi.restoreAllMocks();
  });

  it('POSITIVE CONTROL: authorized owner can retrieve export job status (200)', async () => {
    const req = new NextRequest(`https://skillup.test/api/export/status/${JOB_ID}`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${ownerToken}`,
      },
    });

    const res = await GET(req, { params: Promise.resolve({ jobId: JOB_ID }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('completed');
  });

  it('AUTHENTICATION CONTROL: anonymous request without token receives 401 Unauthorized', async () => {
    const req = new NextRequest(`https://skillup.test/api/export/status/${JOB_ID}`, {
      method: 'GET',
      // No authorization header
    });

    const res = await GET(req, { params: Promise.resolve({ jobId: JOB_ID }) });
    expect(res.status).toBe(401);
    expect(JobsService.getJobStatus).not.toHaveBeenCalled();
    expect(redis.get).not.toHaveBeenCalled();
  });

  it.each(['malformed', 'expired', 'wrong-class', 'invalid-signature'])('rejects %s before resource effects', async (kind) => {
    const otherKey = new TextEncoder().encode('separate-disposable-signing-key-32b');
    const signer = kind === 'invalid-signature' ? new TokenService(otherKey, otherKey, otherKey) : testTokenService;
    const admin = kind === 'wrong-class';
    const token = kind === 'malformed' ? 'invalid.test.signature' : await signer.generateAccessToken({
      userId: OWNER_USER_ID, roles: admin ? ['admin'] : ['student'], brand: 'skillup',
      tokenType: admin ? 'admin' : 'user', aud: admin ? 'admin' : 'user', isAdmin: admin,
    }, kind === 'expired' ? '-1h' : undefined);
    const req = new NextRequest(`https://skillup.test/api/export/status/${JOB_ID}`, { headers: { authorization: `Bearer ${token}` } });
    expect((await GET(req, { params: Promise.resolve({ jobId: JOB_ID }) })).status).toBe(401);
    expect(JobsService.getJobStatus).not.toHaveBeenCalled();
    expect(db.query.exams.findFirst).not.toHaveBeenCalled();
    expect(redis.get).not.toHaveBeenCalled();
    expect(storage.exists).not.toHaveBeenCalled();
    expect(JobsService.updateJobStatus).not.toHaveBeenCalled();
  });

  it('preserves a job repository failure as an operational error', async () => {
    vi.mocked(JobsService.getJobStatus).mockRejectedValueOnce(new Error('fixture repository failure'));
    const req = new NextRequest(`https://skillup.test/api/export/status/${JOB_ID}`, { headers: { authorization: `Bearer ${ownerToken}` } });
    expect((await GET(req, { params: Promise.resolve({ jobId: JOB_ID }) })).status).toBe(500);
    expect(redis.get).not.toHaveBeenCalled();
    expect(storage.exists).not.toHaveBeenCalled();
  });

  it('preserves an exam repository failure as an operational error', async () => {
    vi.mocked(db.query.exams.findFirst).mockRejectedValueOnce(new Error('fixture exam failure'));
    const req = new NextRequest('https://skillup.test/api/export/status/missing?examId=exam-1', { headers: { authorization: `Bearer ${ownerToken}` } });
    expect((await GET(req, { params: Promise.resolve({ jobId: 'missing' }) })).status).toBe(500);
    expect(redis.get).not.toHaveBeenCalled();
    expect(storage.exists).not.toHaveBeenCalled();
  });

  it('does not replace a non-owner cookie with an owner bearer token', async () => {
    const req = new NextRequest(`https://skillup.test/api/export/status/${JOB_ID}`, {
      headers: { cookie: `accessToken=${attackerToken}`, authorization: `Bearer ${ownerToken}` },
    });
    expect((await GET(req, { params: Promise.resolve({ jobId: JOB_ID }) })).status).toBe(403);
    expect(redis.get).not.toHaveBeenCalled();
    expect(storage.exists).not.toHaveBeenCalled();
  });

  /**
   * Existing containment requires a non-owner to receive 403 Forbidden.
   */
  it('SECURITY INVARIANT (DEFECT EXPOSED): non-owner caller must be denied with 403 Forbidden', async () => {
    const req = new NextRequest(`https://skillup.test/api/export/status/${JOB_ID}`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${attackerToken}`, // Attacker token querying owner's job!
      },
    });

    const res = await GET(req, { params: Promise.resolve({ jobId: JOB_ID }) });

    // Invariant: Non-owner must NOT receive job status or downloadUrl
    expect(res.status).toBe(403);
  });

  it('forged owner headers cannot elevate a non-owner credential', async () => {
    const req = new NextRequest(`https://skillup.test/api/export/status/${JOB_ID}`, {
      headers: { authorization: `Bearer ${attackerToken}`, 'x-user-id': OWNER_USER_ID, 'x-brand': 'skillup' },
    });
    expect((await GET(req, { params: Promise.resolve({ jobId: JOB_ID }) })).status).toBe(403);
  });

  it('foreign tenant with equal local subject must not read status', async () => {
    const token = await testTokenService.generateAccessToken({
      userId: OWNER_USER_ID, roles: ['student'], brand: 'realtutorialhub', tokenType: 'user', aud: 'user',
    });
    const req = new NextRequest(`https://skillup.test/api/export/status/${JOB_ID}`, { headers: { authorization: `Bearer ${token}` } });
    expect((await GET(req, { params: Promise.resolve({ jobId: JOB_ID }) })).status).toBe(403);
  });

  it('recovers missing-job status from an authorized owner exam', async () => {
    vi.mocked(db.query.exams.findFirst).mockResolvedValueOnce({ userId: OWNER_USER_ID, brand: 'skillup', exportUrls: { analytics_json: 'private-ref' } } as never);
    const req = new NextRequest('https://skillup.test/api/export/status/missing?examId=exam-1', { headers: { authorization: `Bearer ${ownerToken}` } });
    const response = await GET(req, { params: Promise.resolve({ jobId: 'missing' }) });
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe('completed');
    expect(storage.exists).toHaveBeenCalledOnce();
    expect(db.query.exams.findFirst).toHaveBeenCalledOnce();
    expect(redis.get).not.toHaveBeenCalled();
  });

  it.each([['json', 'analytics_json'], ['csv', 'analytics_csv'], ['student-insight-pdf', 'student_insight_pdf']] as const)(
    'recovers owned missing-job %s without workflow state', async (format, key) => {
      vi.mocked(db.query.exams.findFirst).mockResolvedValueOnce({ userId: OWNER_USER_ID, brand: 'skillup', exportUrls: { [key]: 'private-ref' } } as never);
      const req = new NextRequest(`https://skillup.test/api/export/status/missing?examId=exam-1&format=${format}`, { headers: { authorization: `Bearer ${ownerToken}` } });
      const response = await GET(req, { params: Promise.resolve({ jobId: 'missing' }) });
      expect(response.status).toBe(200);
      expect((await response.json()).status).toBe('completed');
      expect(db.query.exams.findFirst).toHaveBeenCalledOnce();
      expect(redis.get).not.toHaveBeenCalled();
      expect(JobsService.updateJobStatus).not.toHaveBeenCalled();
    },
  );

  it('returns 404 for missing job without an exam or with an absent exam', async () => {
    const call = (query: string) => GET(new NextRequest(`https://skillup.test/api/export/status/missing${query}`, { headers: { authorization: `Bearer ${ownerToken}` } }), { params: Promise.resolve({ jobId: 'missing' }) });
    expect((await call('')).status).toBe(404);
    expect((await call('?examId=absent')).status).toBe(404);
    expect(redis.get).not.toHaveBeenCalled();
    expect(storage.exists).not.toHaveBeenCalled();
  });

  it('keeps an owned exam without an artifact in the failed/not-ready state', async () => {
    vi.mocked(db.query.exams.findFirst).mockResolvedValueOnce({ userId: OWNER_USER_ID, brand: 'skillup', exportUrls: {} } as never);
    const req = new NextRequest('https://skillup.test/api/export/status/missing?examId=exam-1', { headers: { authorization: `Bearer ${ownerToken}` } });
    const response = await GET(req, { params: Promise.resolve({ jobId: 'missing' }) });
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe('failed');
    expect(redis.get).not.toHaveBeenCalled();
    expect(storage.exists).not.toHaveBeenCalled();
  });

  it('preserves trusted internal missing-job exam recovery', async () => {
    const previous = process.env.INTERNAL_API_KEY;
    process.env.INTERNAL_API_KEY = 'disposable-status-internal';
    try {
      vi.mocked(db.query.exams.findFirst).mockResolvedValueOnce({ userId: OWNER_USER_ID, exportUrls: { analytics_json: 'private-ref' } } as never);
      const req = new NextRequest('https://skillup.test/api/export/status/missing?examId=exam-1', { headers: { 'x-internal-key': 'disposable-status-internal' } });
      expect((await GET(req, { params: Promise.resolve({ jobId: 'missing' }) })).status).toBe(200);
      expect(redis.get).not.toHaveBeenCalled();
      expect(storage.exists).toHaveBeenCalledOnce();
    } finally {
      if (previous === undefined) delete process.env.INTERNAL_API_KEY;
      else process.env.INTERNAL_API_KEY = previous;
    }
  });

  it('missing-job fallback denies a foreign tenant with a colliding owner before storage', async () => {
    vi.mocked(db.query.exams.findFirst).mockResolvedValueOnce({ userId: OWNER_USER_ID, exportUrls: { analytics_json: 'private-ref' } } as never);
    const token = await testTokenService.generateAccessToken({ userId: OWNER_USER_ID, roles: ['student'], brand: 'realtutorialhub', tokenType: 'user', aud: 'user' });
    const req = new NextRequest('https://skillup.test/api/export/status/missing?examId=exam-1', { headers: { authorization: `Bearer ${token}` } });
    const response = await GET(req, { params: Promise.resolve({ jobId: 'missing' }) });
    expect.soft(response.status).toBe(403);
    expect(storage.exists).not.toHaveBeenCalled();
  });

  it('missing-job non-owner is denied before recovery side effects', async () => {
    vi.mocked(db.query.exams.findFirst).mockResolvedValueOnce({ userId: OWNER_USER_ID, exportUrls: { analytics_json: 'private-ref' } } as never);
    const req = new NextRequest('https://skillup.test/api/export/status/missing?examId=exam-1', { headers: { authorization: `Bearer ${attackerToken}` } });
    const response = await GET(req, { params: Promise.resolve({ jobId: 'missing' }) });
    expect.soft(response.status).toBe(403);
    expect.soft(redis.get).not.toHaveBeenCalled();
    expect(storage.exists).not.toHaveBeenCalled();
  });
});
