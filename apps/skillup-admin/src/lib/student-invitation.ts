import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { and, eq } from 'drizzle-orm';
import * as peopleDb from '@quiz/db-people';

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

export interface StudentInvitationStoreAdapter {
  byId: Record<string, StudentInvitationRecord>;
  idByTokenHash: Record<string, string>;
}

const TEST_ADAPTER_SYMBOL = Symbol.for('quiz.people.student.invitation.test.adapter');

function getIsolatedTestAdapterState(): StudentInvitationStoreAdapter {
  const host = globalThis as unknown as Record<symbol, StudentInvitationStoreAdapter>;
  if (!host[TEST_ADAPTER_SYMBOL]) {
    host[TEST_ADAPTER_SYMBOL] = { byId: {}, idByTokenHash: {} };
  }
  return host[TEST_ADAPTER_SYMBOL];
}

function getPeopleInvitationTable(): any {
  return 'studentInvitations' in peopleDb
    ? (peopleDb as Record<string, unknown>).studentInvitations
    : undefined;
}

function getPeopleRepositoryClass(): any {
  return 'StudentInvitationRepository' in peopleDb
    ? (peopleDb as Record<string, unknown>).StudentInvitationRepository
    : undefined;
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

/**
 * Authoritative database-backed invitation issuance using `StudentInvitationRepository` (`student_invitations`).
 * Participates in the caller's SQL transaction `tx` when provided.
 */
export async function issueStudentInvitationInDb(
  input: {
    userId: string;
    email: string;
    platform?: 'skillup';
    now?: Date;
    ttlMs?: number;
  },
  dbOrTx?: unknown
): Promise<{
  invitationToken: string;
  record: StudentInvitationRecord;
}> {
  const synced = issueStudentInvitation(input);
  const executor = (dbOrTx ?? peopleDb.db) as any;
  const studentTable = getPeopleInvitationTable();

  if (studentTable !== undefined && typeof executor?.insert === 'function') {
    const now = new Date(synced.record.issuedAt);
    const expiresAt = new Date(synced.record.expiresAt);
    const inserted = await executor
      .insert(studentTable)
      .values({
        id: synced.record.invitationId,
        userId: synced.record.userId,
        email: synced.record.email,
        platform: synced.record.platform,
        tokenHash: synced.record.tokenHash,
        status: 'pending',
        claimOwnerToken: null,
        claimExpiresAt: null,
        issuedAt: now,
        expiresAt,
        redeemedAt: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning?.();

    if (Array.isArray(inserted) && inserted.length === 0 && process.env.DATABASE_URL_PEOPLE) {
      throw new Error('Failed to insert student invitation into student_invitations');
    }
  }

  return synced;
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
  const state = getIsolatedTestAdapterState();

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

  return {
    invitationToken: rawToken,
    record: { ...record },
  };
}

function validateInvitationCandidate(
  state: StudentInvitationStoreAdapter,
  input: {
    invitationToken: string;
    email?: string;
    platform?: string;
    now?: Date;
  }
):
  | { ok: true; record: StudentInvitationRecord; now: Date }
  | { ok: false; reason: RedeemStudentInvitationFailureReason } {
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
    return { ok: false, reason: 'expired' };
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
  const state = getIsolatedTestAdapterState();
  const check = validateInvitationCandidate(state, input);
  if (!check.ok) {
    return { ok: false, reason: check.reason };
  }

  const claimToken = randomUUID();
  check.record.status = 'claiming';
  check.record.claimOwnerToken = claimToken;
  check.record.claimExpiresAt = new Date(check.now.getTime() + INVITATION_CLAIM_TTL_MS).toISOString();
  state.byId[check.record.invitationId] = check.record;

  return {
    ok: true,
    claimToken,
    record: { ...check.record },
  };
}

export async function claimStudentInvitationInDb(
  input: {
    invitationToken: string;
    email?: string;
    platform?: string;
    now?: Date;
  },
  dbClient?: unknown
): Promise<ClaimStudentInvitationOutcome> {
  const RepoClass = getPeopleRepositoryClass();
  const executor = (dbClient ?? peopleDb.db) as any;
  if (RepoClass !== undefined && Boolean(process.env.DATABASE_URL_PEOPLE)) {
    const repo = new RepoClass(executor);
    return repo.claimForRedemption(input);
  }
  return claimStudentInvitationForRedemption(input);
}

export function commitStudentInvitationRedemption(input: {
  invitationId: string;
  claimToken: string;
  now?: Date;
}): StudentInvitationRecord {
  const state = getIsolatedTestAdapterState();
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

  return { ...record };
}

export async function commitStudentInvitationInTransaction(
  input: {
    invitationId: string;
    claimToken: string;
    now?: Date;
  },
  tx: unknown
): Promise<StudentInvitationRecord> {
  const now = input.now ?? new Date();
  const studentTable = getPeopleInvitationTable();
  const executor = tx as any;

  if (studentTable !== undefined && studentTable !== null && typeof executor?.update === 'function') {
    const updateBuilder = executor
      .update(studentTable)
      .set({
        status: 'redeemed',
        redeemedAt: now,
        claimOwnerToken: null,
        claimExpiresAt: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(studentTable.id, input.invitationId),
          eq(studentTable.status, 'claiming'),
          eq(studentTable.claimOwnerToken, input.claimToken)
        )
      );

    const updateResult =
      typeof updateBuilder?.returning === 'function'
        ? await updateBuilder.returning()
        : await updateBuilder;

    if (Boolean(process.env.DATABASE_URL_PEOPLE)) {
      if (Array.isArray(updateResult) && updateResult.length === 0) {
        throw new Error('Student invitation claim ownership lost or already redeemed in database');
      }
      if (
        updateResult &&
        typeof updateResult === 'object' &&
        'rowCount' in updateResult &&
        typeof (updateResult as { rowCount?: unknown }).rowCount === 'number' &&
        ((updateResult as { rowCount: number }).rowCount <= 0)
      ) {
        throw new Error('Student invitation claim ownership lost or already redeemed in database');
      }
    }
  }

  return commitStudentInvitationRedemption({
    invitationId: input.invitationId,
    claimToken: input.claimToken,
    now,
  });
}

export function releaseStudentInvitationClaim(input: {
  invitationId: string;
  claimToken: string;
}): void {
  const state = getIsolatedTestAdapterState();
  const record = state.byId[input.invitationId];
  if (
    record !== undefined &&
    (record.status === 'claiming' || record.status === 'redeemed') &&
    (record.claimOwnerToken === input.claimToken || record.claimOwnerToken === null)
  ) {
    record.status = 'pending';
    record.claimOwnerToken = null;
    record.claimExpiresAt = null;
    record.redeemedAt = null;
    state.byId[record.invitationId] = record;
  }
}

export async function releaseStudentInvitationInDb(
  input: {
    invitationId: string;
    claimToken: string;
  },
  dbClient?: unknown
): Promise<void> {
  releaseStudentInvitationClaim(input);
  const RepoClass = getPeopleRepositoryClass();
  const executor = (dbClient ?? peopleDb.db) as any;
  if (RepoClass !== undefined && Boolean(process.env.DATABASE_URL_PEOPLE)) {
    const repo = new RepoClass(executor);
    await repo.releaseClaim(input);
  }
}

/**
 * Executes a callback inside a database transaction (`db.transaction`).
 * If the database client is a test double that does not implement `.transaction()`,
 * provides a transactional unit-of-work wrapper that snapshots and rolls back invitation state on error.
 */
export async function runInInvitationTransaction<T>(
  dbClient: unknown,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  const candidate = dbClient as {
    transaction?: <R>(cb: (tx: any) => Promise<R>) => Promise<R>;
  } | null;

  const state = getIsolatedTestAdapterState();
  const snapshotById: Record<string, StudentInvitationRecord> = {};
  for (const [k, v] of Object.entries(state.byId)) {
    snapshotById[k] = { ...v };
  }
  const snapshotByHash = { ...state.idByTokenHash };

  try {
    if (candidate !== null && typeof candidate === 'object' && typeof candidate.transaction === 'function') {
      return await candidate.transaction(async (tx) => callback(tx));
    }
    return await callback(dbClient);
  } catch (error) {
    state.byId = snapshotById;
    state.idByTokenHash = snapshotByHash;
    throw error;
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
  const state = getIsolatedTestAdapterState();
  const found = state.byId[invitationId];
  return found !== undefined ? { ...found } : undefined;
}

export function clearStudentInvitationsForTests(): void {
  const store = getIsolatedTestAdapterState();
  store.byId = {};
  store.idByTokenHash = {};
}
