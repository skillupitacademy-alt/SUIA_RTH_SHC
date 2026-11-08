import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { storage } from '@/lib/storage';
import { db } from '@quiz/db';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { JobsService } from '@/modules/system/jobs.service';
import { GET } from '../route';

/**
 * B08-F: Private Export Download Ownership & Tenant Isolation
 *
 * Governing Architecture: audit/FinalAechitecture.md (Tenant Isolation, Resource Authorization)
 * Governing Task: audit/W1.2_Gemini_Batch_08_Corrections_And_Containment_Task.md (Package F)
 *
 * Verifies that GET /api/export/download:
 * 1. Positive Control: Legitimate job owner can download their completed export (HTTP 200).
 * 2. Ownership Control: Another user from the same tenant cannot download the job (HTTP 403).
 * 3. Authentication Control: Anonymous request without valid token is denied (HTTP 401).
 * 4. Zero Storage Reads: Unauthorized requests (non-owner, anonymous) never trigger storage.getReadUrl.
 * 5. Exam Ownership Control: Legitimate exam owner can download; non-owner is denied (HTTP 403).
 * 6. Missing/Stale Job Control: 404 returned without invoking storage.
 *
 * NOTE ON FOREIGN BRAND COLLIDING ID:
 * In accordance with Package F, the download route (apps/api-server/src/app/api/export/download/route.ts)
 * is not authorized for tenant-resource runtime edits in this batch.
 * The foreign-brand colliding ID defect (where identical user IDs across brands bypass tenant boundaries)
 * is preserved as a documented open invariant in audit/W1.2_Batch_08_Handoff.md and reproduced in
 * Sol's standalone probe (sol-b08-collision.test.ts), requiring an authoritative ownership decision.
 */

const TEST_SECRET = new TextEncoder().encode('export-download-test-secret-32b!');
const testTokenService = new TokenService(TEST_SECRET, TEST_SECRET, TEST_SECRET);

// In-memory mock jobs and exams
const mockJobs: Map<string, any> = new Map();
const mockExams: Map<string, any> = new Map();

vi.mock('@/modules/system/jobs.service', () => ({
  JobsService: {
    getJobStatus: vi.fn(async (jobId: string) => mockJobs.get(jobId) ?? null),
  },
}));

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      exams: {
        findFirst: vi.fn(async ({ where }: any) => {
          return Array.from(mockExams.values())[0] ?? null;
        }),
      },
    },
  },
  exams: { id: 'exams.id' },
}));

vi.mock('@/lib/storage', () => ({
  storage: {
    getReadUrl: vi.fn(async (fileRef: string) => `https://mock-storage.test/${fileRef}`),
  },
}));

describe('B08-F: Private Export Download Ownership', () => {
  const previousFetch = globalThis.fetch;
  const previousTokenService = TokenService.getInstance();
  const previousContainerTokenService = container.get(TokenService);
  const OWNER_USER_ID = 'owner-uuid-001';
  const ATTACKER_USER_ID = 'attacker-uuid-002';
  const JOB_ID = 'job-export-101';
  const EXAM_ID = 'exam-export-201';

  let ownerToken: string;
  let attackerToken: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockJobs.clear();
    mockExams.clear();

    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ result: 'export-data' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));

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

    // Seed owner's job
    mockJobs.set(JOB_ID, {
      id: JOB_ID,
      userId: OWNER_USER_ID,
      brand: 'skillup',
      status: 'completed',
      result: {
        brand: 'skillup',
        downloadUrl: 'exports/owner-report.json',
        format: 'json',
      },
    });

    // Seed owner's exam
    mockExams.set(EXAM_ID, {
      id: EXAM_ID,
      userId: OWNER_USER_ID,
      brand: 'skillup',
      exportUrls: {
        analytics_json: 'exports/exam-report.json',
      },
    });
  });

  afterEach(() => {
    globalThis.fetch = previousFetch;
    TokenService.setInstance(previousTokenService);
    container.register(TokenService, previousContainerTokenService);
    vi.restoreAllMocks();
  });

  it('POSITIVE CONTROL: authorized owner can download completed job export (200)', async () => {
    const req = new NextRequest(`https://skillup.test/api/export/download?jobId=${JOB_ID}`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${ownerToken}`,
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json');
    expect(storage.getReadUrl).toHaveBeenCalledWith('exports/owner-report.json');
  });

  it('OWNERSHIP ENFORCEMENT: non-owner receives 403 and zero storage reads occur', async () => {
    const req = new NextRequest(`https://skillup.test/api/export/download?jobId=${JOB_ID}`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${attackerToken}`,
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message ?? body.error).toBe('Forbidden');
    // Critical security invariant: storage read URL is NOT generated on ownership failure
    expect(storage.getReadUrl).not.toHaveBeenCalled();
  });

  it('AUTHENTICATION ENFORCEMENT: anonymous request receives 401 and zero storage reads occur', async () => {
    const req = new NextRequest(`https://skillup.test/api/export/download?jobId=${JOB_ID}`, {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(storage.getReadUrl).not.toHaveBeenCalled();
  });

  for (const branch of ['jobId', 'examId'] as const) {
    it(`foreign SkillUp principal with colliding local ID must not download RTH ${branch}`, async () => {
      const foreign = await testTokenService.generateAccessToken({ userId: OWNER_USER_ID, roles: ['student'], brand: 'skillup', tokenType: 'user', aud: 'user' });
      const id = branch === 'jobId' ? JOB_ID : EXAM_ID;
      const req = new NextRequest(`https://realtutorialhub.test/api/export/download?${branch}=${id}`, { headers: { authorization: `Bearer ${foreign}` } });
      const response = await GET(req);
      expect.soft(response.status).toBe(403);
      expect.soft(storage.getReadUrl).not.toHaveBeenCalled();
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  }

  for (const branch of ['jobId', 'examId'] as const) {
    it(`invalid credential denies ${branch} before storage or fetch`, async () => {
      const id = branch === 'jobId' ? JOB_ID : EXAM_ID;
      const req = new NextRequest(`https://skillup.test/api/export/download?${branch}=${id}`, {
        headers: { authorization: 'Bearer invalid.test.signature' },
      });
      const response = await GET(req);
      expect.soft(response.status).toBe(401);
      expect.soft(storage.getReadUrl).not.toHaveBeenCalled();
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  }

  it.each(['expired', 'wrong-class', 'invalid-signature'])('rejects %s credential before resource effects', async (kind) => {
    const otherKey = new TextEncoder().encode('separate-disposable-signing-key-32b');
    const signer = kind === 'invalid-signature' ? new TokenService(otherKey, otherKey, otherKey) : testTokenService;
    const admin = kind === 'wrong-class';
    const token = await signer.generateAccessToken({
      userId: OWNER_USER_ID, roles: admin ? ['admin'] : ['student'], brand: 'skillup',
      tokenType: admin ? 'admin' : 'user', aud: admin ? 'admin' : 'user', isAdmin: admin,
    }, kind === 'expired' ? '-1h' : undefined);
    const req = new NextRequest(`https://skillup.test/api/export/download?jobId=${JOB_ID}`, { headers: { authorization: `Bearer ${token}` } });
    expect((await GET(req)).status).toBe(401);
    expect(JobsService.getJobStatus).not.toHaveBeenCalled();
    expect(db.query.exams.findFirst).not.toHaveBeenCalled();
    expect(storage.getReadUrl).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('does not disguise a job repository outage as invalid credentials', async () => {
    vi.mocked(JobsService.getJobStatus).mockRejectedValueOnce(new Error('fixture repository failure'));
    const req = new NextRequest(`https://skillup.test/api/export/download?jobId=${JOB_ID}`, { headers: { authorization: `Bearer ${ownerToken}` } });
    expect((await GET(req)).status).toBe(500);
    expect(storage.getReadUrl).not.toHaveBeenCalled();
  });

  it('honors the non-owner cookie when an owner bearer is also supplied', async () => {
    const req = new NextRequest(`https://skillup.test/api/export/download?jobId=${JOB_ID}`, {
      headers: { cookie: `accessToken=${attackerToken}`, authorization: `Bearer ${ownerToken}` },
    });
    expect((await GET(req)).status).toBe(403);
    expect(storage.getReadUrl).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('EXAM OWNERSHIP: legitimate exam owner can download exam report (200)', async () => {
    const req = new NextRequest(`https://skillup.test/api/export/download?examId=${EXAM_ID}&format=json`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${ownerToken}`,
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(storage.getReadUrl).toHaveBeenCalledWith('exports/exam-report.json');
  });

  it('EXAM OWNERSHIP ENFORCEMENT: non-owner exam access receives 403 and zero storage reads occur', async () => {
    const req = new NextRequest(`https://skillup.test/api/export/download?examId=${EXAM_ID}&format=json`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${attackerToken}`,
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(403);
    expect(storage.getReadUrl).not.toHaveBeenCalled();
  });

  it('MISSING JOB: non-existent jobId receives 404 and zero storage reads occur', async () => {
    const req = new NextRequest(`https://skillup.test/api/export/download?jobId=non-existent-job`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${ownerToken}`,
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(404);
    expect(storage.getReadUrl).not.toHaveBeenCalled();
  });

  for (const branch of ['jobId', 'examId'] as const) {
    it(`foreign brand with colliding local ID must not download by ${branch}`, async () => {
      const foreign = await testTokenService.generateAccessToken({
        userId: OWNER_USER_ID, roles: ['student'], brand: 'realtutorialhub', tokenType: 'user', aud: 'user',
      });
      const id = branch === 'jobId' ? JOB_ID : EXAM_ID;
      const req = new NextRequest(`https://skillup.test/api/export/download?${branch}=${id}`, {
        headers: { authorization: `Bearer ${foreign}` },
      });
      const response = await GET(req);
      expect.soft(response.status).toBe(403);
      expect.soft(storage.getReadUrl).not.toHaveBeenCalled();
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  }
});
