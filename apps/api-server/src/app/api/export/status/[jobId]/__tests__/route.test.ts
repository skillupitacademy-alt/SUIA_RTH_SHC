import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const findExamFirst = vi.fn();
const storageExists = vi.fn();
const redisGet = vi.fn();
const updateJobStatus = vi.fn();
const getJobStatus = vi.fn();

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

describe('GET /api/export/status/[jobId]', () => {
  const originalInternalKey = process.env.INTERNAL_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INTERNAL_API_KEY = 'internal-key';
    redisGet.mockResolvedValue(null);
    updateJobStatus.mockResolvedValue({});
  });

  afterEach(() => {
    process.env.INTERNAL_API_KEY = originalInternalKey;
    vi.clearAllMocks();
  });

  it('returns completed when a stale job is recoverable from storage', async () => {
    getJobStatus.mockResolvedValueOnce({
      id: 'job-1',
      userId: 'user-1',
      status: 'processing',
      updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      payload: { format: 'json' },
      result: { downloadUrl: 'reports/user-1/stale.json' },
    });
    findExamFirst.mockResolvedValueOnce({
      userId: 'user-1',
      exportUrls: {
        analytics_json: 'reports/user-1/final.json',
      },
    });
    storageExists.mockImplementation(async (ref: string) => ref === 'reports/user-1/final.json');

    const { GET } = await import('../route');
    const req = new NextRequest('http://localhost/api/export/status/job-1?examId=exam-1&format=json', {
      headers: {
        'x-internal-key': 'internal-key',
      },
    });
    const res = await GET(req, { params: Promise.resolve({ jobId: 'job-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('completed');
    expect(body.downloadUrl).toContain('/api/export/download?examId=exam-1&format=json');
    expect(updateJobStatus).toHaveBeenCalledWith(
      'job-1',
      expect.anything(),
      expect.objectContaining({
        result: expect.objectContaining({
          downloadUrl: expect.any(String),
          format: 'json',
        }),
      })
    );
  });

  it('returns completed when the job is missing but the exam artifact exists', async () => {
    getJobStatus.mockResolvedValueOnce(undefined);
    findExamFirst.mockResolvedValueOnce({
      userId: 'user-1',
      exportUrls: {
        analytics_json: 'reports/user-1/final.json',
      },
    });
    storageExists.mockResolvedValue(true);

    const { GET } = await import('../route');
    const req = new NextRequest('http://localhost/api/export/status/job-2?examId=exam-2&format=json', {
      headers: {
        'x-internal-key': 'internal-key',
      },
    });
    const res = await GET(req, { params: Promise.resolve({ jobId: 'job-2' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('completed');
    expect(body.downloadUrl).toContain('/api/export/download?examId=exam-2&format=json');
  });

  it('returns failed when neither the job nor the artifact can be recovered', async () => {
    getJobStatus.mockResolvedValueOnce(undefined);
    findExamFirst.mockResolvedValueOnce(null);

    const { GET } = await import('../route');
    const req = new NextRequest('http://localhost/api/export/status/job-3?examId=exam-3&format=json', {
      headers: {
        'x-internal-key': 'internal-key',
      },
    });
    const res = await GET(req, { params: Promise.resolve({ jobId: 'job-3' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('failed');
    expect(body.error).toBe('Export job not found');
  });
});
