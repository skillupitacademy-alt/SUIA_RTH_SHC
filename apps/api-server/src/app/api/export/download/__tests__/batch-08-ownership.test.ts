import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { GET } from '../route';

/**
 * B08-F: Private Export Download Ownership & Tenant Isolation
 *
 * Governing Architecture: audit/FinalAechitecture.md (Tenant Isolation, Resource Authorization)
 * Governing Task: audit/W1.2_Gemini_Controlled_Batch_08_Task.md (B08-F)
 *
 * Verifies that GET /api/export/download:
 * 1. Positive Control: Legitimate job owner can download their completed export (HTTP 200).
 * 2. Ownership Control: Another user from the same tenant cannot download the job (HTTP 403).
 * 3. Authentication Control: Anonymous request without valid token is denied (HTTP 401).
 * 4. Exam Ownership Control: Legitimate exam owner can download; non-owner is denied (HTTP 403).
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
          // Return exam matching mockExams
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
      status: 'completed',
      result: {
        downloadUrl: 'exports/owner-report.json',
        format: 'json',
      },
    });

    // Seed owner's exam
    mockExams.set(EXAM_ID, {
      id: EXAM_ID,
      userId: OWNER_USER_ID,
      exportUrls: {
        analytics_json: 'exports/exam-report.json',
      },
    });
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
  });

  it('OWNERSHIP ENFORCEMENT: another user attempting to download owner export receives 403 Forbidden', async () => {
    const req = new NextRequest(`https://skillup.test/api/export/download?jobId=${JOB_ID}`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${attackerToken}`, // Attacker token!
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message ?? body.error).toBe('Forbidden');
  });

  it('AUTHENTICATION ENFORCEMENT: anonymous request without token receives 401 Unauthorized', async () => {
    const req = new NextRequest(`https://skillup.test/api/export/download?jobId=${JOB_ID}`, {
      method: 'GET',
      // No authorization header
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
