import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { JobStatus } from '@quiz/types';

const findExamFirst = vi.fn();
const storageExists = vi.fn();
const redisGet = vi.fn();
const updateJobStatus = vi.fn();
const getJobStatus = vi.fn();
const getAccessTokenMock = vi.fn();
const verifyUserAccessTokenMock = vi.fn();

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      exams: {
        findFirst: findExamFirst,
      },
    },
  },
  exams: {
    id: 'exams.id',
  },
}));

vi.mock('@/lib/storage', () => ({
  storage: {
    exists: storageExists,
  },
}));

vi.mock('@/lib/redis', () => ({
  redis: {
    get: redisGet,
  },
}));

vi.mock('@/modules/system/jobs.service', () => ({
  JobsService: {
    getJobStatus,
    updateJobStatus,
  },
}));

vi.mock('@/modules/core/container', () => ({
  container: {
    get: vi.fn((service) => ({
      getAccessToken: getAccessTokenMock,
      verifyUserAccessToken: verifyUserAccessTokenMock,
    })),
  },
}));

vi.mock('@/modules/auth/token.service', () => ({
  TokenService: class TokenService {},
}));

describe('GET /api/export/status/[jobId]', () => {
  const originalInternalKey = process.env.INTERNAL_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INTERNAL_API_KEY = 'internal-key';
    redisGet.mockResolvedValue(null);
    updateJobStatus.mockResolvedValue({});
    getAccessTokenMock.mockReturnValue(null);
    storageExists.mockResolvedValue(true);
  });

  afterEach(() => {
    process.env.INTERNAL_API_KEY = originalInternalKey;
  });

  it('returns 401 if unauthorized', async () => {
    getAccessTokenMock.mockReturnValue(null);
    verifyUserAccessTokenMock.mockResolvedValue(null);
    const { GET } = await import('../route');
    const req = new NextRequest('http://localhost/api/export/status/job-1');
    const res = await GET(req, { params: Promise.resolve({ jobId: 'job-1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 404 if job not found', async () => {
    getJobStatus.mockResolvedValue(null);
    const { GET } = await import('../route');
    const req = new NextRequest('http://localhost/api/export/status/job-1', {
      headers: { 'x-internal-key': 'internal-key' },
    });
    const res = await GET(req, { params: Promise.resolve({ jobId: 'job-1' }) });
    expect(res.status).toBe(404);
  });

  it('returns completed when job is finished and file exists', async () => {
    getJobStatus.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.COMPLETED,
      result: { downloadUrl: 'path/to/file.json' },
    });
    storageExists.mockResolvedValue(true);
    const { GET } = await import('../route');
    const req = new NextRequest('http://localhost/api/export/status/job-1', {
      headers: { 'x-internal-key': 'internal-key' },
    });
    const res = await GET(req, { params: Promise.resolve({ jobId: 'job-1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('completed');
  });

  it('auto-fails stale job and reports failure', async () => {
    getJobStatus.mockResolvedValue({
      id: 'job-stale',
      status: JobStatus.PROCESSING,
      updatedAt: new Date(Date.now() - 600000).toISOString(),
    });
    storageExists.mockResolvedValue(false);
    const { GET } = await import('../route');
    const req = new NextRequest('http://localhost/api/export/status/job-stale', {
      headers: { 'x-internal-key': 'internal-key' },
    });
    const res = await GET(req, { params: Promise.resolve({ jobId: 'job-stale' }) });
    const body = await res.json();
    expect(body.status).toBe('failed');
    expect(updateJobStatus).toHaveBeenCalledWith('job-stale', JobStatus.FAILED, expect.any(Object));
  });

  it('infers stage for complex workflows (student-insight-pdf)', async () => {
    getJobStatus.mockResolvedValue({ status: JobStatus.PROCESSING, payload: { format: 'student-insight-pdf' } });
    redisGet.mockResolvedValue(JSON.stringify({ step: 'render-pdf' }));
    const { GET } = await import('../route');
    const req = new NextRequest('http://localhost/api/export/status/job-pdf', {
      headers: { 'x-internal-key': 'internal-key' },
    });
    const res = await GET(req, { params: Promise.resolve({ jobId: 'job-pdf' }) });
    const body = await res.json();
    expect(body.stage).toBe('rendering');
  });

  it('handles csv and JSON formats in stage mapping', async () => {
    const { GET } = await import('../route');
    redisGet.mockResolvedValue(JSON.stringify({ step: 'aggregate-data' }));
    
    // Test JSON
    getJobStatus.mockResolvedValueOnce({ status: JobStatus.PROCESSING, payload: { format: 'json' } });
    let req = new NextRequest('http://localhost/api/export/status/j1', { headers: { 'x-internal-key': 'internal-key' } });
    let res = await GET(req, { params: Promise.resolve({ jobId: 'j1' }) });
    expect((await res.json()).stage).toBe('aggregating');

    // Test CSV
    getJobStatus.mockResolvedValueOnce({ status: JobStatus.PROCESSING, payload: { format: 'csv' } });
    req = new NextRequest('http://localhost/api/export/status/j2', { headers: { 'x-internal-key': 'internal-key' } });
    res = await GET(req, { params: Promise.resolve({ jobId: 'j2' }) });
    expect((await res.json()).stage).toBe('aggregating');
  });

  it('handles failed status with error message from Redis/JobsService', async () => {
    getJobStatus.mockResolvedValue({ status: JobStatus.FAILED, error: 'User aborted' });
    const { GET } = await import('../route');
    const req = new NextRequest('http://localhost/api/export/status/j-fail', { headers: { 'x-internal-key': 'internal-key' } });
    const res = await GET(req, { params: Promise.resolve({ jobId: 'j-fail' }) });
    const body = await res.json();
    expect(body.status).toBe('failed');
    expect(body.error).toBe('User aborted');
  });
  
  it('covers storage lookup fallback for stale jobs', async () => {
    getJobStatus.mockResolvedValue({
      id: 'j-stale-rec',
      status: 'processing',
      updatedAt: new Date(Date.now() - 600000).toISOString(),
      payload: { format: 'json' }
    });
    findExamFirst.mockResolvedValue({
      exportUrls: { analytics_json: 'path/rec.json' }
    });
    storageExists.mockResolvedValue(true);

    const { GET } = await import('../route');
    const req = new NextRequest('http://localhost/api/export/status/j-stale-rec?examId=e1', {
      headers: { 'x-internal-key': 'internal-key' }
    });
    const res = await GET(req, { params: Promise.resolve({ jobId: 'j-stale-rec' }) });
    const body = await res.json();
    expect(body.status).toBe('completed');
  });
});
