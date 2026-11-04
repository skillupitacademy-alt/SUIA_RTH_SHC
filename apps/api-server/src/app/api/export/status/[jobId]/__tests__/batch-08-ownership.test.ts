import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
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
 * 3. SECURITY INVARIANT (FAILING - REAL SOURCE DEFECT REPRODUCTION):
 *    Export status endpoint MUST enforce that caller owns the job (job.userId === caller.userId),
 *    and MUST reject unauthorized cross-user access with HTTP 403 Forbidden.
 *
 *    REAL SOURCE DEFECT EXPOSED:
 *    apps/api-server/src/app/api/export/status/[jobId]/route.ts authenticates that caller has a valid
 *    access token, but NEVER checks `job.userId === payload.userId`.
 *    Consequently, any authenticated tenant user can query status, progress, and downloadUrl of
 *    another user's export job (IDOR).
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
      status: 'completed',
      payload: { format: 'json' },
      result: {
        format: 'json',
        downloadUrl: '/api/export/download?jobId=job-export-status-101',
      },
      updatedAt: new Date(),
    });
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
  });

  /**
   * SECURITY INVARIANT (REAL SOURCE DEFECT EXPOSED):
   * An authenticated caller who does NOT own the job MUST receive 403 Forbidden.
   * Under current route.ts, it returns 200 with victim's job status and downloadUrl.
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
});
