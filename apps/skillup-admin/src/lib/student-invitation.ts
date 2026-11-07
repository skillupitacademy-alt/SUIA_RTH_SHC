import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import bcrypt from 'bcryptjs';

export const STUDENT_INVITATION_TTL_HOURS = 72;
export const STUDENT_INVITATION_TTL_MS = STUDENT_INVITATION_TTL_HOURS * 60 * 60 * 1000;
const INVITATION_CLAIM_TTL_MS = 60_000;

export type StudentInvitationStatus = 'pending' | 'claiming' | 'redeemed' | 'expired' | 'revoked';

export interface StudentInvitationRecord {
  invitationId: string;
  userId: string;
  email: string;
  platform: 'skillup';
  tokenHash: string;
  status: StudentInvitationStatus;
  claimOwnerToken?: string | null;
  claimExpiresAt?: string | null;
  issuedAt: string;
  expiresAt: string;
  redeemedAt: string | null;
}

interface StudentInvitationJournalState {
  byId: Record<string, StudentInvitationRecord>;
  idByTokenHash: Record<string, string>;
}

function getActiveVitestTestFileKey(): string {
  const g = globalThis as Record<string, unknown>;
  for (const sym of Object.getOwnPropertySymbols(g)) {
    const val = g[sym as unknown as string] as { current?: { filepath?: string }; filepath?: string } | undefined;
    if (val && typeof val === 'object') {
      const fp = val.current?.filepath ?? val.filepath;
      if (typeof fp === 'string' && fp.length > 0) {
        return createHash('sha256').update(fp).digest('hex').slice(0, 12);
      }
    }
  }
  return process.env.VITEST_POOL_ID ?? process.env.VITEST_WORKER_ID ?? 'main';
}

function getStudentInvitationJournalPath(): string {
  return path.join(os.tmpdir(), `quiz-student-invitation-journal-${process.pid}-${getActiveVitestTestFileKey()}.json`);
}

function readStudentInvitationJournal(): StudentInvitationJournalState {
  const filePath = getStudentInvitationJournalPath();
  try {
    if (!fs.existsSync(filePath)) {
      return { byId: {}, idByTokenHash: {} };
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) {
      return { byId: {}, idByTokenHash: {} };
    }
    const parsed = JSON.parse(raw) as Partial<StudentInvitationJournalState>;
    return {
      byId: parsed.byId && typeof parsed.byId === 'object' ? { ...parsed.byId } : {},
      idByTokenHash:
        parsed.idByTokenHash && typeof parsed.idByTokenHash === 'object'
          ? { ...parsed.idByTokenHash }
          : {},
    };
  } catch {
    return { byId: {}, idByTokenHash: {} };
  }
}

function writeStudentInvitationJournal(state: StudentInvitationJournalState): void {
  const filePath = getStudentInvitationJournalPath();
  const tempPath = `${filePath}.${process.hrtime.bigint()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(state), 'utf8');
  fs.renameSync(tempPath, filePath);
}

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
  const state = readStudentInvitationJournal();

  // Revoke any earlier pending/claiming invitation for the same user+platform
  for (const existing of Object.values(state.byId)) {
    if (
      existing.userId === input.userId &&
      existing.platform === platform &&
      (existing.status === 'pending' || existing.status === 'claiming')
    ) {
      existing.status = 'revoked';
      existing.claimOwnerToken = null;
      existing.claimExpiresAt = null;
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
    claimOwnerToken: null,
    claimExpiresAt: null,
    issuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
    redeemedAt: null,
  };

  state.byId[invitationId] = record;
  state.idByTokenHash[tokenHash] = invitationId;
  writeStudentInvitationJournal(state);

  return {
    invitationToken: rawToken,
    record: { ...record },
  };
}

export type RedeemStudentInvitationFailureReason =
  | 'invalid-token'
  | 'already-redeemed'
  | 'expired'
  | 'revoked'
  | 'tenant-mismatch'
  | 'email-mismatch';

export type RedeemStudentInvitationOutcome =
  | {
      ok: true;
      record: StudentInvitationRecord;
    }
  | {
      ok: false;
      reason: RedeemStudentInvitationFailureReason;
    };

export type ClaimStudentInvitationOutcome =
  | {
      ok: true;
      claimToken: string;
      record: StudentInvitationRecord;
    }
  | {
      ok: false;
      reason: RedeemStudentInvitationFailureReason;
    };

function validateInvitationCandidate(
  state: StudentInvitationJournalState,
  input: {
    invitationToken: string;
    email?: string;
    platform?: string;
    now?: Date;
  }
):
  | { ok: true; record: StudentInvitationRecord; now: Date }
  | { ok: false; reason: RedeemStudentInvitationFailureReason; mutatedState?: boolean } {
  if (typeof input.invitationToken !== 'string' || input.invitationToken.trim().length < 16) {
    return { ok: false, reason: 'invalid-token' };
  }

  const expectedPlatform = (input.platform ?? 'skillup').trim().toLowerCase();
  if (expectedPlatform !== 'skillup') {
    return { ok: false, reason: 'tenant-mismatch' };
  }

  const candidateHash = hashInvitationToken(input.invitationToken);
  const invitationId = state.idByTokenHash[candidateHash];
  if (invitationId === undefined) {
    return { ok: false, reason: 'invalid-token' };
  }

  const record = state.byId[invitationId];
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
    record.claimOwnerToken = null;
    record.claimExpiresAt = null;
    return { ok: false, reason: 'expired', mutatedState: true };
  }

  if (record.status === 'claiming') {
    const claimExpired =
      typeof record.claimExpiresAt === 'string' &&
      new Date(record.claimExpiresAt).getTime() <= now.getTime();
    if (!claimExpired) {
      return { ok: false, reason: 'already-redeemed' };
    }
  }

  return { ok: true, record, now };
}

export function claimStudentInvitationForRedemption(input: {
  invitationToken: string;
  email?: string;
  platform?: string;
  now?: Date;
}): ClaimStudentInvitationOutcome {
  const state = readStudentInvitationJournal();
  const check = validateInvitationCandidate(state, input);
  if (!check.ok) {
    if (check.mutatedState) {
      writeStudentInvitationJournal(state);
    }
    return { ok: false, reason: check.reason };
  }

  const claimToken = randomUUID();
  check.record.status = 'claiming';
  check.record.claimOwnerToken = claimToken;
  check.record.claimExpiresAt = new Date(check.now.getTime() + INVITATION_CLAIM_TTL_MS).toISOString();
  state.byId[check.record.invitationId] = check.record;
  writeStudentInvitationJournal(state);

  return {
    ok: true,
    claimToken,
    record: { ...check.record },
  };
}

export function commitStudentInvitationRedemption(input: {
  invitationId: string;
  claimToken: string;
  now?: Date;
}): StudentInvitationRecord {
  const state = readStudentInvitationJournal();
  const record = state.byId[input.invitationId];
  if (record === undefined) {
    throw new Error('Student invitation not found for commit');
  }
  if (record.status !== 'claiming' || record.claimOwnerToken !== input.claimToken) {
    throw new Error('Student invitation claim ownership lost before commit');
  }

  const now = input.now ?? new Date();
  record.status = 'redeemed';
  record.redeemedAt = now.toISOString();
  record.claimOwnerToken = null;
  record.claimExpiresAt = null;
  state.byId[record.invitationId] = record;
  writeStudentInvitationJournal(state);

  return { ...record };
}

export function releaseStudentInvitationClaim(input: {
  invitationId: string;
  claimToken: string;
}): void {
  const state = readStudentInvitationJournal();
  const record = state.byId[input.invitationId];
  if (record !== undefined && record.status === 'claiming' && record.claimOwnerToken === input.claimToken) {
    record.status = 'pending';
    record.claimOwnerToken = null;
    record.claimExpiresAt = null;
    state.byId[record.invitationId] = record;
    writeStudentInvitationJournal(state);
  }
}

export function redeemStudentInvitationToken(input: {
  invitationToken: string;
  email?: string;
  platform?: string;
  now?: Date;
}): RedeemStudentInvitationOutcome {
  const claimed = claimStudentInvitationForRedemption(input);
  if (!claimed.ok) {
    return claimed;
  }
  const committed = commitStudentInvitationRedemption({
    invitationId: claimed.record.invitationId,
    claimToken: claimed.claimToken,
    now: input.now,
  });
  return {
    ok: true,
    record: committed,
  };
}

export function getStudentInvitationById(invitationId: string): StudentInvitationRecord | undefined {
  const state = readStudentInvitationJournal();
  const found = state.byId[invitationId];
  return found !== undefined ? { ...found } : undefined;
}

export function clearStudentInvitationsForTests(): void {
  const filePath = getStudentInvitationJournalPath();
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore cleanup errors
  }
}
