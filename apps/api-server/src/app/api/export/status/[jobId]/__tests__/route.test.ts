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

  it('handles authorization and not found', async () => {
    const { GET } = await import('../route');
    
    // Unauthorized
    getAccessTokenMock.mockReturnValue(null);
    verifyUserAccessTokenMock.mockResolvedValue(null);
    let req = new NextRequest('http://localhost/api/export/status/j1');
    let res = await GET(req, { params: Promise.resolve({ jobId: 'j1' }) });
    expect(res.status).toBe(401);

    // Not Found
    getJobStatus.mockResolvedValue(null);
    req = new NextRequest('http://localhost/api/export/status/j2', { headers: { 'x-internal-key': 'internal-key' } });
    res = await GET(req, { params: Promise.resolve({ jobId: 'j2' }) });
    expect(res.status).toBe(404);
  });

  it('reports completed status when file exists', async () => {
    getJobStatus.mockResolvedValue({
      status: JobStatus.COMPLETED,
      result: { downloadUrl: 'path/file.json' },
    });
    storageExists.mockResolvedValue(true);
    const { GET } = await import('../route');
    const req = new NextRequest('http://localhost/api/export/status/j3', { headers: { 'x-internal-key': 'internal-key' } });
    const res = await GET(req, { params: Promise.resolve({ jobId: 'j3' }) });
    const body = await res.json();
    expect(body.status).toBe('completed');
  });

  it('handles stage mapping correctly for JSON and CSV', async () => {
    const { GET } = await import('../route');
    redisGet.mockResolvedValue(JSON.stringify({ step: 'aggregate-data' }));
    
    // JSON -> processing
    getJobStatus.mockResolvedValueOnce({ status: JobStatus.PROCESSING, payload: { format: 'json' } });
    let req = new NextRequest('http://localhost/api/export/status/j4', { headers: { 'x-internal-key': 'internal-key' } });
    let res = await GET(req, { params: Promise.resolve({ jobId: 'j4' }) });
    expect((await res.json()).stage).toBe('processing');

    // CSV -> aggregating
    getJobStatus.mockResolvedValueOnce({ status: JobStatus.PROCESSING, payload: { format: 'csv' } });
    req = new NextRequest('http://localhost/api/export/status/j5?format=csv', { headers: { 'x-internal-key': 'internal-key' } });
    res = await GET(req, { params: Promise.resolve({ jobId: 'j5' }) });
    expect((await res.json()).stage).toBe('aggregating');
  });

  it('covers stale job recovery from storage', async () => {
    getJobStatus.mockResolvedValue({
      id: 'j-stale',
      status: 'processing',
      updatedAt: new Date(Date.now() - 600000).toISOString(),
      payload: { format: 'json' }
    });
    findExamFirst.mockResolvedValue({ exportUrls: { analytics_json: 'path/rec.json' } });
    storageExists.mockResolvedValue(true);

    const { GET } = await import('../route');
    const req = new NextRequest('http://localhost/api/export/status/j-stale?examId=e1', { headers: { 'x-internal-key': 'internal-key' } });
    const res = await GET(req, { params: Promise.resolve({ jobId: 'j-stale' }) });
    expect((await res.json()).status).toBe('completed');
  });

  it('auto-fails stale job if not recoverable', async () => {
    getJobStatus.mockResolvedValue({
      id: 'j-fail',
      status: 'processing',
      updatedAt: new Date(Date.now() - 600000).toISOString(),
    });
    storageExists.mockResolvedValue(false);

    const { GET } = await import('../route');
    const req = new NextRequest('http://localhost/api/export/status/j-fail', { headers: { 'x-internal-key': 'internal-key' } });
    const res = await GET(req, { params: Promise.resolve({ jobId: 'j-fail' }) });
    expect((await res.json()).status).toBe('failed');
    expect(updateJobStatus).toHaveBeenCalledWith('j-fail', JobStatus.FAILED, expect.any(Object));
  });
});
