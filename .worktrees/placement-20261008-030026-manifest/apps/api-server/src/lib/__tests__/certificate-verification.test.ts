import { beforeEach, describe, expect, it, vi } from 'vitest';

const chain = vi.hoisted(() => ({
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  and: vi.fn(),
  eq: vi.fn(),
  isNull: vi.fn(),
}));

vi.mock('drizzle-orm', () => ({
  and: chain.and,
  eq: chain.eq,
  isNull: chain.isNull,
}));

vi.mock('@quiz/db-tutorial', () => ({
  certificates: {
    id: 'id',
    scope: 'scope',
    parentName: 'parentName',
    verificationCode: 'verificationCode',
    pdfUrl: 'pdfUrl',
    issuedAt: 'issuedAt',
    expiresAt: 'expiresAt',
    version: 'version',
    deletedAt: 'deletedAt',
  },
  db: {
    select: chain.select,
  },
}));

import { loadCertificateVerification } from '../certificate-verification';

describe('loadCertificateVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    chain.select.mockReturnValue({ from: chain.from });
    chain.from.mockReturnValue({ where: chain.where });
    chain.where.mockReturnValue({ limit: chain.limit });
  });

  it('returns a verified certificate record', async () => {
    chain.limit.mockResolvedValueOnce([
      {
        id: 'cert-1',
        scope: 'topic',
        parentName: 'React Fundamentals',
        verificationCode: 'ABC123',
        pdfUrl: 'https://example.com/cert.pdf',
        issuedAt: new Date('2026-03-01T10:00:00.000Z'),
        expiresAt: null,
        version: 1,
      },
    ]);

    const result = await loadCertificateVerification('ABC123');

    expect(result).toMatchObject({
      code: 'ABC123',
      status: 'verified',
      certificate: {
        id: 'cert-1',
        parentName: 'React Fundamentals',
        verificationCode: 'ABC123',
      },
    });
  });

  it('returns not_found for missing certificates', async () => {
    chain.limit.mockResolvedValueOnce([]);

    const result = await loadCertificateVerification('MISSING');

    expect(result).toEqual({
      code: 'MISSING',
      status: 'not_found',
      certificate: null,
    });
  });
});
