import { certificates, db as tutorialDb } from '@quiz/db-tutorial';
import { and, eq, isNull } from 'drizzle-orm';

export type CertificateVerificationStatus = 'verified' | 'expired' | 'not_found';

export type CertificateVerificationRecord = {
  id: string;
  scope: string;
  parentName: string;
  verificationCode: string;
  pdfUrl: string | null;
  issuedAt: string;
  expiresAt: string | null;
  version: number;
};

export type CertificateVerificationResult = {
  code: string;
  status: CertificateVerificationStatus;
  certificate: CertificateVerificationRecord | null;
};

export async function loadCertificateVerification(code: string): Promise<CertificateVerificationResult> {
  const normalizedCode = code.trim();
  if (normalizedCode.length === 0) {
    return {
      code: normalizedCode,
      status: 'not_found',
      certificate: null,
    };
  }

  const [row] = await tutorialDb
    .select({
      id: certificates.id,
      scope: certificates.scope,
      parentName: certificates.parentName,
      verificationCode: certificates.verificationCode,
      pdfUrl: certificates.pdfUrl,
      issuedAt: certificates.issuedAt,
      expiresAt: certificates.expiresAt,
      version: certificates.version,
    })
    .from(certificates)
    .where(and(eq(certificates.verificationCode, normalizedCode), isNull(certificates.deletedAt)))
    .limit(1);

  if (row === undefined) {
    return {
      code: normalizedCode,
      status: 'not_found',
      certificate: null,
    };
  }

  const expiresAt = row.expiresAt?.toISOString() ?? null;
  const isExpired = row.expiresAt instanceof Date ? row.expiresAt.getTime() < Date.now() : false;

  return {
    code: normalizedCode,
    status: isExpired ? 'expired' : 'verified',
    certificate: {
      id: row.id,
      scope: row.scope,
      parentName: row.parentName,
      verificationCode: row.verificationCode,
      pdfUrl: row.pdfUrl,
      issuedAt: row.issuedAt.toISOString(),
      expiresAt,
      version: row.version,
    },
  };
}
