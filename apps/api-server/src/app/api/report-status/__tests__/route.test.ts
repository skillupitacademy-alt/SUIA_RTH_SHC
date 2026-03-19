import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const findExamFirst = vi.fn();
const reportGetByAttempt = vi.fn();
const reportUpdateStatus = vi.fn();
const storageExists = vi.fn();

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

vi.mock('@/modules/report-engine/report-repository', () => ({
  ReportRepository: {
    getReportByAttempt: reportGetByAttempt,
    updateReportStatus: reportUpdateStatus,
  },
}));

vi.mock('@/modules/core/container', () => ({
  container: {
    get: vi.fn(),
  },
}));

describe('GET /api/report-status', () => {
  const originalInternalKey = process.env.INTERNAL_API_KEY;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.INTERNAL_API_KEY = 'internal-key';
    reportUpdateStatus.mockResolvedValue({});
    const mod = await import('../route');
    void mod;
  });

  afterEach(() => {
    process.env.INTERNAL_API_KEY = originalInternalKey;
  });

  it('returns ready when the report is stale but the artifact exists in exam export urls', async () => {
    reportGetByAttempt.mockResolvedValueOnce({
      attemptId: 'attempt-1',
      userId: 'user-1',
      status: 'generating',
      fileRef: 'reports/user-1/stale.pdf',
      errorStage: 'rendering',
      updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    });
    findExamFirst.mockResolvedValueOnce({
      userId: 'user-1',
      status: 'completed',
      exportUrls: {
        analytics_pdf: 'reports/user-1/final.pdf',
      },
    });
    storageExists.mockImplementation(async (ref: string) => ref === 'reports/user-1/final.pdf');

    const { GET } = await import('../route');
    const req = new NextRequest('http://localhost/api/report-status?attemptId=attempt-1', {
      headers: {
        'x-internal-key': 'internal-key',
      },
    });

    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ready');
    expect(body.url).toContain('/api/reports/download?attemptId=attempt-1');
    expect(reportUpdateStatus).toHaveBeenCalledWith('attempt-1', 'ready', undefined);
  });

  it('returns failed when the report is stale and no artifact exists', async () => {
    reportGetByAttempt.mockResolvedValueOnce({
      attemptId: 'attempt-2',
      userId: 'user-1',
      status: 'pending',
      fileRef: 'reports/user-1/stale.pdf',
      errorStage: 'rendering',
      updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    });
    findExamFirst.mockResolvedValueOnce({
      userId: 'user-1',
      status: 'processing',
      exportUrls: {
        analytics_pdf: 'reports/user-1/missing.pdf',
      },
    });
    storageExists.mockResolvedValue(false);

    const { GET } = await import('../route');
    const req = new NextRequest('http://localhost/api/report-status?attemptId=attempt-2', {
      headers: {
        'x-internal-key': 'internal-key',
      },
    });

    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('failed');
    expect(body.error).toBe('Generation stalled. Please retry.');
  });
});
