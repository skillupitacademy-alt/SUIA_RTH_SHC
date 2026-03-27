import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  acquireJobLock: vi.fn(),
  releaseJobLock: vi.fn(),
  storageExists: vi.fn(),
  storageUploadObject: vi.fn(),
  tutorialSelectRows: [] as Array<Record<string, unknown>>,
  tutorialUpdateWhere: vi.fn(),
  peopleSelectRows: [] as Array<Record<string, unknown>>,
}));

const makeSelectChain = (rows: Array<Record<string, unknown>>) => ({
  from: vi.fn(() => ({
    where: vi.fn(() => ({
      limit: vi.fn(async () => rows),
    })),
  })),
});

vi.mock('@/lib/job-lock', () => ({
  acquireJobLock: mocks.acquireJobLock,
  releaseJobLock: mocks.releaseJobLock,
}));

vi.mock('@/lib/storage', () => ({
  storage: {
    exists: mocks.storageExists,
    uploadObject: mocks.storageUploadObject,
  },
}));

vi.mock('@quiz/db-tutorial', () => ({
  certificates: {
    id: 'certificates.id',
    userId: 'certificates.userId',
    scope: 'certificates.scope',
    parentId: 'certificates.parentId',
    parentName: 'certificates.parentName',
    verificationCode: 'certificates.verificationCode',
    pdfUrl: 'certificates.pdfUrl',
    issuedAt: 'certificates.issuedAt',
    version: 'certificates.version',
    deletedAt: 'certificates.deletedAt',
  },
  db: {
    select: vi.fn(() => makeSelectChain(mocks.tutorialSelectRows)),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: mocks.tutorialUpdateWhere,
      })),
    })),
  },
  STANDARD_QUERY_TIMEOUT: 30_000,
  withTimeout: vi.fn((promise: Promise<unknown>) => promise),
}));

vi.mock('@quiz/db-people', () => ({
  userProfiles: {
    name: 'userProfiles.name',
    userId: 'userProfiles.userId',
  },
  db: {
    select: vi.fn(() => makeSelectChain(mocks.peopleSelectRows)),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
    })),
  },
}));

import { CertificateDeliveryService } from '../certificate-delivery.service';

describe('CertificateDeliveryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tutorialSelectRows = [];
    mocks.peopleSelectRows = [];
    mocks.acquireJobLock.mockResolvedValue(true);
    mocks.releaseJobLock.mockResolvedValue(undefined);
    mocks.storageExists.mockResolvedValue(false);
    mocks.storageUploadObject.mockResolvedValue('certificates/user-1/certificate-1.pdf');
    mocks.tutorialUpdateWhere.mockResolvedValue(undefined);
  });

  it('generates and stores a certificate pdf', async () => {
    mocks.tutorialSelectRows = [
      {
        id: 'certificate-1',
        userId: 'user-1',
        scope: 'topic',
        parentId: 'parent-1',
        parentName: 'Topic One',
        verificationCode: 'verify-1',
        pdfUrl: null,
        issuedAt: new Date('2026-01-01T00:00:00.000Z'),
        version: 1,
      },
    ];
    mocks.peopleSelectRows = [
      {
        name: 'Asha Verma',
      },
    ];

    const service = new CertificateDeliveryService();
    const result = await service.deliverIssuedCertificate({
      certificateId: 'certificate-1',
      userId: 'user-1',
      issuedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    });

    expect(result.status).toBe('completed');
    expect(result.fileRef).toBe('certificates/user-1/certificate-1.pdf');
    expect(mocks.storageUploadObject).toHaveBeenCalledTimes(1);
    expect(mocks.tutorialUpdateWhere).toHaveBeenCalledTimes(1);
    expect(mocks.releaseJobLock).toHaveBeenCalledWith('certificate-issued:certificate-1');
  });

  it('returns the stored file when the pdf already exists', async () => {
    mocks.tutorialSelectRows = [
      {
        id: 'certificate-1',
        userId: 'user-1',
        scope: 'topic',
        parentId: 'parent-1',
        parentName: 'Topic One',
        verificationCode: 'verify-1',
        pdfUrl: 'certificates/user-1/certificate-1.pdf',
        issuedAt: new Date('2026-01-01T00:00:00.000Z'),
        version: 1,
      },
    ];
    mocks.storageExists.mockResolvedValueOnce(true);

    const service = new CertificateDeliveryService();
    const result = await service.deliverIssuedCertificate({
      certificateId: 'certificate-1',
      userId: 'user-1',
      issuedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    });

    expect(result.status).toBe('already-processed');
    expect(mocks.storageUploadObject).not.toHaveBeenCalled();
    expect(mocks.tutorialUpdateWhere).not.toHaveBeenCalled();
  });

  it('short-circuits duplicate deliveries before processing', async () => {
    mocks.acquireJobLock.mockResolvedValueOnce(false);

    const service = new CertificateDeliveryService();
    const result = await service.deliverIssuedCertificate({
      certificateId: 'certificate-1',
      userId: 'user-1',
      issuedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    });

    expect(result.status).toBe('duplicate');
    expect(mocks.storageUploadObject).not.toHaveBeenCalled();
    expect(mocks.releaseJobLock).not.toHaveBeenCalled();
  });
});
