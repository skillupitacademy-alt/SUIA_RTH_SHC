import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mode: 'ok' as 'ok' | 'signature',
  handler: vi.fn(),
  deliverIssuedCertificate: vi.fn(),
}));

vi.mock('@quiz/events', () => ({
  PlatformEventTypes: {
    CERTIFICATE_ISSUED: 'certificate.issued',
  },
  createQStashHandler: (_type: unknown, callback: (envelope: unknown) => Promise<unknown>) => {
    return async (req: Request) => {
      if (mocks.mode === 'signature') {
        return new Response('Unauthorized', { status: 401 });
      }
      const result = await callback(await req.json());
      return result instanceof Response ? result : new Response('OK', { status: 200 });
    };
  },
}));

vi.mock('@/modules/certificates/certificate-delivery.service', () => ({
  CertificateDeliveryService: {
    getInstance: () => ({
      deliverIssuedCertificate: mocks.deliverIssuedCertificate,
    }),
  },
}));

import { POST } from '../route';

const makeRequest = (body: unknown) =>
  new Request('http://localhost/api/workers/certificate-issued', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('certificate issued worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mode = 'ok';
    mocks.deliverIssuedCertificate.mockResolvedValue({ status: 'completed', fileRef: 'certificates/user-1/certificate-1.pdf' });
  });

  it('delivers the certificate', async () => {
    const response = await POST(makeRequest({
      id: crypto.randomUUID(),
      type: 'certificate.issued',
      correlationId: crypto.randomUUID(),
      source: 'quiz-platform',
      occurredAt: new Date().toISOString(),
      version: 1,
      data: {
        certificateId: 'certificate-1',
        userId: 'user-1',
        issuedAt: new Date().toISOString(),
      },
    }));

    expect(response.status).toBe(200);
    expect(mocks.deliverIssuedCertificate).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when signature validation fails', async () => {
    mocks.mode = 'signature';

    const response = await POST(makeRequest({
      id: crypto.randomUUID(),
      type: 'certificate.issued',
      correlationId: crypto.randomUUID(),
      source: 'quiz-platform',
      occurredAt: new Date().toISOString(),
      version: 1,
      data: {
        certificateId: 'certificate-1',
        userId: 'user-1',
        issuedAt: new Date().toISOString(),
      },
    }));

    expect(response.status).toBe(401);
  });
});
