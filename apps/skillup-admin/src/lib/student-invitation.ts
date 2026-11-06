import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';

export const STUDENT_INVITATION_TTL_HOURS = 72;
export const STUDENT_INVITATION_TTL_MS = STUDENT_INVITATION_TTL_HOURS * 60 * 60 * 1000;

export type StudentInvitationStatus = 'pending' | 'redeemed' | 'expired' | 'revoked';

export interface StudentInvitationRecord {
  invitationId: string;
  userId: string;
  email: string;
  platform: 'skillup';
  tokenHash: string;
  status: StudentInvitationStatus;
  issuedAt: string;
  expiresAt: string;
  redeemedAt: string | null;
}

const studentInvitationRegistryById = new Map<string, StudentInvitationRecord>();
const studentInvitationIdByTokenHash = new Map<string, string>();

export function normalizeStudentEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashInvitationToken(rawToken: string): string {
  return createHash('sha256').update(rawToken.trim()).digest('hex');
}

export async function generateRandomBootstrapPasswordHash(): Promise<string> {
  const randomSecret = randomBytes(32).toString('base64url');
  return bcrypt.hash(`bootstrap:${randomSecret}:${randomUUID()}`, 10);
}

export function issueStudentInvitation(input: {
  userId: string;
  email: string;
  platform?: 'skillup';
  now?: Date;
  ttlMs?: number;
}): {
  invitationToken: string;
  record: StudentInvitationRecord;
} {
  const now = input.now ?? new Date();
  const ttlMs = input.ttlMs ?? STUDENT_INVITATION_TTL_MS;
  if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
    throw new Error('Invitation TTL must be positive');
  }

  const normalizedEmail = normalizeStudentEmail(input.email);
  const platform = input.platform ?? 'skillup';

  // Revoke any earlier pending invitation for the same user+platform
  for (const existing of studentInvitationRegistryById.values()) {
    if (existing.userId === input.userId && existing.platform === platform && existing.status === 'pending') {
      existing.status = 'revoked';
    }
  }

  const rawToken = `sku_inv_${randomBytes(32).toString('base64url')}`;
  const tokenHash = hashInvitationToken(rawToken);
  const invitationId = randomUUID();
  const record: StudentInvitationRecord = {
    invitationId,
    userId: input.userId,
    email: normalizedEmail,
    platform,
    tokenHash,
    status: 'pending',
    issuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
    redeemedAt: null,
  };

  studentInvitationRegistryById.set(invitationId, record);
  studentInvitationIdByTokenHash.set(tokenHash, invitationId);

  return {
    invitationToken: rawToken,
    record,
  };
}

export type RedeemStudentInvitationOutcome =
  | {
      ok: true;
      record: StudentInvitationRecord;
    }
  | {
      ok: false;
      reason: 'invalid-token' | 'already-redeemed' | 'expired' | 'revoked' | 'tenant-mismatch' | 'email-mismatch';
    };

export function redeemStudentInvitationToken(input: {
  invitationToken: string;
  email?: string;
  platform?: string;
  now?: Date;
}): RedeemStudentInvitationOutcome {
  if (typeof input.invitationToken !== 'string' || input.invitationToken.trim().length < 16) {
    return { ok: false, reason: 'invalid-token' };
  }

  const expectedPlatform = (input.platform ?? 'skillup').trim().toLowerCase();
  if (expectedPlatform !== 'skillup') {
    return { ok: false, reason: 'tenant-mismatch' };
  }

  const candidateHash = hashInvitationToken(input.invitationToken);
  const invitationId = studentInvitationIdByTokenHash.get(candidateHash);
  if (invitationId === undefined) {
    return { ok: false, reason: 'invalid-token' };
  }

  const record = studentInvitationRegistryById.get(invitationId);
  if (record === undefined) {
    return { ok: false, reason: 'invalid-token' };
  }

  const storedHashBuf = Buffer.from(record.tokenHash, 'hex');
  const candidateHashBuf = Buffer.from(candidateHash, 'hex');
  if (storedHashBuf.length !== candidateHashBuf.length || !timingSafeEqual(storedHashBuf, candidateHashBuf)) {
    return { ok: false, reason: 'invalid-token' };
  }

  if (record.platform !== expectedPlatform) {
    return { ok: false, reason: 'tenant-mismatch' };
  }

  if (typeof input.email === 'string' && input.email.trim().length > 0) {
    if (normalizeStudentEmail(input.email) !== record.email) {
      return { ok: false, reason: 'email-mismatch' };
    }
  }

  if (record.status === 'redeemed') {
    return { ok: false, reason: 'already-redeemed' };
  }
  if (record.status === 'revoked') {
    return { ok: false, reason: 'revoked' };
  }

  const now = input.now ?? new Date();
  if (now.getTime() > new Date(record.expiresAt).getTime()) {
    record.status = 'expired';
    return { ok: false, reason: 'expired' };
  }

  record.status = 'redeemed';
  record.redeemedAt = now.toISOString();

  return {
    ok: true,
    record,
  };
}

export function getStudentInvitationById(invitationId: string): StudentInvitationRecord | undefined {
  return studentInvitationRegistryById.get(invitationId);
}

export function clearStudentInvitationsForTests(): void {
  studentInvitationRegistryById.clear();
  studentInvitationIdByTokenHash.clear();
}
