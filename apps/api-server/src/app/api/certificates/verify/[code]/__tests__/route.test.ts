import { NextRequest } from 'next/server';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  loadCertificateVerification: vi.fn(),
}));

vi.mock('@/lib/certificate-verification', () => ({
  loadCertificateVerification: mocks.loadCertificateVerification,
}));

import { GET } from '../route';

describe('GET /api/certificates/verify/[code]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a verified certificate payload', async () => {
    mocks.loadCertificateVerification.mockResolvedValueOnce({
      code: 'ABC123',
      status: 'verified',
      certificate: {
        id: 'cert-1',
        scope: 'topic',
        parentName: 'React Fundamentals',
        verificationCode: 'ABC123',
        pdfUrl: 'https://example.com/cert.pdf',
        issuedAt: '2026-03-01T10:00:00.000Z',
        expiresAt: null,
        version: 1,
      },
    });

    const req = new NextRequest('http://localhost/api/certificates/verify/ABC123');
    const res = await GET(req, { params: Promise.resolve({ code: 'ABC123' }) });

    expect(res.status).toBe(200);
    expect(mocks.loadCertificateVerification).toHaveBeenCalledWith('ABC123');

    const body = await res.json();
    expect(body).toMatchObject({
      data: {
        code: 'ABC123',
        status: 'verified',
      },
    });
  });

  it('returns 404 for missing codes', async () => {
    mocks.loadCertificateVerification.mockResolvedValueOnce({
      code: 'MISSING',
      status: 'not_found',
      certificate: null,
    });

    const req = new NextRequest('http://localhost/api/certificates/verify/MISSING');
    const res = await GET(req, { params: Promise.resolve({ code: 'MISSING' }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toMatchObject({
      data: {
        code: 'MISSING',
        status: 'not_found',
      },
    });
  });
});
