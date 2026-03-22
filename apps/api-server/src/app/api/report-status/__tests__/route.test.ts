import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const findExamFirst = vi.fn();
const reportGetByAttempt = vi.fn();
const reportUpdateStatus = vi.fn();
const storageExists = vi.fn();
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

vi.mock('@/modules/report-engine/report-repository', () => ({
  ReportRepository: {
    getReportByAttempt: reportGetByAttempt,
    updateReportStatus: reportUpdateStatus,
  },
}));

vi.mock('@/lib/withLogging', () => ({
  withLogging: vi.fn((handler) => handler),
}));

vi.mock('@/modules/core/container', () => ({
  container: {
    get: vi.fn((service) => {
      if (service && (service.name === 'TokenService' || service.name === 'default' || typeof service === 'function')) {
        return {
          getAccessToken: getAccessTokenMock,
          verifyUserAccessToken: verifyUserAccessTokenMock,
        };
      }
      return {};
    }),
  },
}));

vi.mock('@/modules/auth/token.service', () => ({
  TokenService: class TokenService {},
}));

describe('GET /api/report-status', () => {
  const originalInternalKey = process.env.INTERNAL_API_KEY;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.INTERNAL_API_KEY = 'internal-key';
    reportUpdateStatus.mockResolvedValue({});
    getAccessTokenMock.mockReturnValue(null);
  });

  afterEach(() => {
    process.env.INTERNAL_API_KEY = originalInternalKey;
  });

  it('rejects when attemptId is missing', async () => {
     const { GET } = await import('../route');
     const req = new NextRequest('http://localhost/api/report-status');
     // @ts-ignore
     const res = await GET(req, { params: Promise.resolve({}) });
     expect(res.status).toBe(400); 
  });

  it('rejects external request without token', async () => {
     getAccessTokenMock.mockReturnValue(null);
     const { GET } = await import('../route');
     const req = new NextRequest('http://localhost/api/report-status?attemptId=att-1');
     // @ts-ignore
     const res = await GET(req, { params: Promise.resolve({}) });
     expect(res.status).toBe(401);
  });

  it('allows external request with valid token', async () => {
     getAccessTokenMock.mockReturnValue('valid');
     verifyUserAccessTokenMock.mockResolvedValue({ userId: 'user-1' });
     reportGetByAttempt.mockResolvedValueOnce({
        attemptId: 'att-1',
        userId: 'user-1',
        status: 'generating',
        errorStage: 'fetching',
        updatedAt: new Date().toISOString(), // Recent to avoid auto-fail
     });

     const { GET } = await import('../route');
     const req = new NextRequest('http://localhost/api/report-status?attemptId=att-1');
     // @ts-ignore
     const res = await GET(req, { params: Promise.resolve({}) });
     expect(res.status).toBe(200);
     const body = await res.json();
     expect(body.status).toBe('generating');
     expect(body.stage).toBe('fetching');
  });

  it('rejects external request for mismatched userId', async () => {
     getAccessTokenMock.mockReturnValue('valid');
     verifyUserAccessTokenMock.mockResolvedValue({ userId: 'user-2' }); // Mismatch
     reportGetByAttempt.mockResolvedValueOnce({
        attemptId: 'att-1',
        userId: 'user-1',
        status: 'generating',
        updatedAt: new Date().toISOString(),
     });

     const { GET } = await import('../route');
     const req = new NextRequest('http://localhost/api/report-status?attemptId=att-1');
     // @ts-ignore
     const res = await GET(req, { params: Promise.resolve({}) });
     expect(res.status).toBe(403);
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

    // @ts-ignore
    const res = await GET(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ready');
    expect(body.url).toContain('/api/reports/download?attemptId=attempt-1');
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

    // @ts-ignore
    const res = await GET(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('failed');
    expect(body.error).toBe('Generation stalled. Please retry.');
  });

  it('falls back to exams query when report is missing, returning pseudo status', async () => {
     reportGetByAttempt.mockResolvedValueOnce(undefined);
     findExamFirst.mockResolvedValueOnce({
        userId: 'user-1',
        status: 'processing',
        exportUrls: {},
     });

     const { GET } = await import('../route');
     const req = new NextRequest('http://localhost/api/report-status?attemptId=att-1', { headers: { 'x-internal-key': 'internal-key' }});
     // @ts-ignore
     const res = await GET(req, { params: Promise.resolve({}) });
     expect(res.status).toBe(200);
     const body = await res.json();
     expect(body.status).toBe('generating'); 
     expect(body.isLegacyFallback).toBe(true);
  });

  it('returns 404 when report and exam are both missing', async () => {
     reportGetByAttempt.mockResolvedValueOnce(null);
     findExamFirst.mockResolvedValueOnce(null);

     const { GET } = await import('../route');
     const req = new NextRequest('http://localhost/api/report-status?attemptId=att-1', { headers: { 'x-internal-key': 'internal-key' }});
     // @ts-ignore
     const res = await GET(req, { params: Promise.resolve({}) });
     expect(res.status).toBe(404);
  });

  it('sanitizes qstash errors into generic messages', async () => {
     reportGetByAttempt.mockResolvedValueOnce({
        attemptId: 'att-fail',
        userId: 'user-1',
        status: 'failed',
        errorStage: 'Upstash workflow error occurred',
        updatedAt: new Date().toISOString(),
     });

     const { GET } = await import('../route');
     const req = new NextRequest('http://localhost/api/report-status?attemptId=att-fail', { headers: { 'x-internal-key': 'internal-key' }});
     // @ts-ignore
     const res = await GET(req, { params: Promise.resolve({}) });
     expect(res.status).toBe(200);
     const body = await res.json();
     expect(body.status).toBe('failed');
     expect(body.error).toBe('PDF generation failed. Please retry.');
  });
  
  it('returns ready from legacy fallback if report is missing and analytics_pdf exists in storage', async () => {
    reportGetByAttempt.mockResolvedValueOnce(undefined);
    findExamFirst.mockResolvedValueOnce({
      userId: 'user-1',
      status: 'completed',
      exportUrls: { analytics_pdf: 'pdf/url' },
    });
    storageExists.mockResolvedValue(true);

    const { GET } = await import('../route');
    const req = new NextRequest('http://localhost/api/report-status?attemptId=att-1', { headers: { 'x-internal-key': 'internal-key' }});
    // @ts-ignore
    const res = await GET(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ready');
    expect(body.url).toContain('/api/reports/download?attemptId=att-1');
  });
});
