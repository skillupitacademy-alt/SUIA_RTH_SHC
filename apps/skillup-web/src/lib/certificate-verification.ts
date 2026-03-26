export type SkillupCertificateStatus = 'verified' | 'expired' | 'not_found' | 'unavailable';

export type SkillupCertificateVerification = {
  code: string;
  status: SkillupCertificateStatus;
  certificate: {
    id: string;
    scope: string;
    parentName: string;
    verificationCode: string;
    pdfUrl: string | null;
    issuedAt: string;
    expiresAt: string | null;
    version: number;
  } | null;
};

const API_BASE = (
  process.env.SKILLUP_API_URL?.trim() ??
  process.env.NEXT_PUBLIC_API_URL?.trim() ??
  'http://localhost:3000/api'
).replace(/\/+$/, '');

export async function fetchSkillupCertificateVerification(code: string): Promise<SkillupCertificateVerification> {
  const normalizedCode = code.trim();

  if (normalizedCode.length === 0) {
    return {
      code: normalizedCode,
      status: 'not_found',
      certificate: null,
    };
  }

  try {
    const response = await fetch(`${API_BASE}/certificates/verify/${encodeURIComponent(normalizedCode)}`, {
      cache: 'no-store',
    });

    if (response.status === 404) {
      return {
        code: normalizedCode,
        status: 'not_found',
        certificate: null,
      };
    }

    if (!response.ok) {
      return {
        code: normalizedCode,
        status: 'unavailable',
        certificate: null,
      };
    }

    const payload = (await response.json()) as { data?: SkillupCertificateVerification };
    return (
      payload.data ?? {
        code: normalizedCode,
        status: 'unavailable',
        certificate: null,
      }
    );
  } catch {
    return {
      code: normalizedCode,
      status: 'unavailable',
      certificate: null,
    };
  }
}
