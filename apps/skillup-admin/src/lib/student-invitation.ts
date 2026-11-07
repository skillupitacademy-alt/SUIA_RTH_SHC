import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
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
 * Participates in the caller's SQL transaction `tx` when provided and fails closed when repository/SQL capabilities are absent.
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
  const RepoClass = getPeopleRepositoryClass();
  const executor = (dbOrTx ?? peopleDb.db) as any;

  if (executor !== null && executor !== undefined && typeof executor === 'object') {
    if (typeof executor.createInvitation === 'function') {
      const created = await executor.createInvitation(input);
      return {
        invitationToken: created.invitationToken,
        record: created.record,
      };
    }

    if (
      RepoClass !== undefined &&
      typeof executor.insert === 'function' &&
      typeof executor.update === 'function'
    ) {
      const repo = new RepoClass(executor);
      const created = await repo.createInvitation(input);
      return {
        invitationToken: created.invitationToken,
        record: created.record,
      };
    }
  }

  throw new Error(
    'Unsupported database dependency for student invitation issuance: requires createInvitation or full SQL executor (insert, update) with StudentInvitationRepository'
  );
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

  if (executor !== null && executor !== undefined && typeof executor === 'object') {
    if (typeof executor.claimForRedemption === 'function') {
      return executor.claimForRedemption(input);
    }

    if (RepoClass !== undefined) {
      const repo = new RepoClass(executor);
      return repo.claimForRedemption(input);
    }
  }

  throw new Error(
    'Unsupported database dependency for student invitation claim: requires claimForRedemption or StudentInvitationRepository'
  );
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

function hydrateSqlInvitationRow(
  row: Record<string, unknown>,
  fallbackNow: Date
): StudentInvitationRecord | undefined {
  const invitationId =
    typeof row.invitationId === 'string'
      ? row.invitationId
      : typeof row.id === 'string'
        ? row.id
        : undefined;
  const userId = typeof row.userId === 'string' ? row.userId : undefined;
  const email = typeof row.email === 'string' ? normalizeStudentEmail(row.email) : undefined;
  const tokenHash = typeof row.tokenHash === 'string' ? row.tokenHash : undefined;

  if (!invitationId || !userId || !email || !tokenHash) {
    return undefined;
  }

  const toIsoOrNull = (val: unknown): string | null => {
    if (val instanceof Date) return val.toISOString();
    if (typeof val === 'string' && val.trim().length > 0) return val;
    return null;
  };

  return {
    invitationId,
    userId,
    email,
    platform: 'skillup',
    tokenHash,
    status: (typeof row.status === 'string' ? (row.status as StudentInvitationStatus) : 'redeemed'),
    claimOwnerToken: null,
    claimExpiresAt: null,
    issuedAt: toIsoOrNull(row.issuedAt) ?? fallbackNow.toISOString(),
    expiresAt: toIsoOrNull(row.expiresAt) ?? fallbackNow.toISOString(),
    redeemedAt: toIsoOrNull(row.redeemedAt) ?? fallbackNow.toISOString(),
  };
}

export async function commitStudentInvitationInTransaction(
  input: {
    invitationId: string;
    claimToken: string;
    now?: Date;
  },
  tx: unknown
): Promise<StudentInvitationRecord> {
  if (tx === null || tx === undefined || typeof tx !== 'object') {
    throw new Error('Valid transaction handle is required to commit student invitation redemption');
  }

  const normalizedId = input.invitationId?.trim();
  const normalizedClaim = input.claimToken?.trim();
  if (!normalizedId || !normalizedClaim) {
    throw new Error('invitationId and claimToken are required for atomic invitation redemption');
  }

  const now = input.now ?? new Date();
  const executor = tx as {
    redeemAtomic?: (arg: { invitationId: string; claimToken: string; now: Date }) => Promise<unknown>;
    update?: (...args: any[]) => any;
  };
  const redemption = { invitationId: normalizedId, claimToken: normalizedClaim, now };

  let committed: unknown;
  if (typeof executor.redeemAtomic === 'function') {
    // Existing transaction-bound repository port. Its expiry/ownership contract
    // must be enforced by the port implementation and is independently tested.
    committed = await executor.redeemAtomic(redemption);
  } else {
    // Delegate to the canonical SQL-backed repository bound to the SAME transaction,
    // so the mutation enforces: claiming AND owner matches AND claim unexpired AND
    // invitation unexpired. No duplicate application-side SQL policy; no global DB client.
    const RepoClass = getPeopleRepositoryClass();
    if (RepoClass === undefined || typeof executor.update !== 'function') {
      throw new Error(
        'Transaction executor does not support required SQL update capability or StudentInvitationRepository redemption capability'
      );
    }
    const repository = new RepoClass(executor);
    if (typeof repository.redeemAtomic !== 'function') {
      throw new Error('StudentInvitationRepository.redeemAtomic is unavailable');
    }
    committed = await repository.redeemAtomic(redemption);
  }

  const hydrated =
    committed !== null && committed !== undefined && typeof committed === 'object'
      ? hydrateSqlInvitationRow(committed as Record<string, unknown>, now)
      : undefined;
  if (!hydrated || hydrated.status !== 'redeemed') {
    throw new Error('Failed to confirm redeemed student invitation row from transaction repository');
  }
  return hydrated;
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
  const RepoClass = getPeopleRepositoryClass();
  const executor = (dbClient ?? peopleDb.db) as any;
  if (
    executor !== null &&
    executor !== undefined &&
    typeof executor === 'object' &&
    typeof executor.releaseClaim === 'function'
  ) {
    await executor.releaseClaim(input);
    return;
  }
  if (
    RepoClass !== undefined &&
    executor !== null &&
    executor !== undefined &&
    typeof executor === 'object' &&
    typeof executor.update === 'function'
  ) {
    const repo = new RepoClass(executor);
    await repo.releaseClaim(input);
    return;
  }
  throw new Error(
    'Unsupported database dependency for releasing student invitation claim: requires releaseClaim or StudentInvitationRepository'
  );
}

/**
 * Executes a callback inside a mandatory database transaction (`db.transaction`).
 * Rejects any executor that does not provide a real `.transaction()` function (never accepts bare `insert()` or `update()`).
 */
export async function runInInvitationTransaction<T>(
  dbClient: unknown,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  if (dbClient === null || dbClient === undefined || typeof dbClient !== 'object') {
    throw new Error('Database client is required for transactional invitation execution');
  }

  const candidate = dbClient as {
    transaction?: <R>(cb: (tx: any) => Promise<R>) => Promise<R>;
  };

  if (typeof candidate.transaction !== 'function') {
    throw new Error('Database executor does not support required transactional execution (db.transaction)');
  }

  return candidate.transaction(async (tx) => {
    if (tx === null || tx === undefined || typeof tx !== 'object') {
      throw new Error('Transaction callback received an invalid transaction handle');
    }
    return callback(tx);
  });
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

export interface IsolatedTestInvitationRepositoryPort {
  createInvitation(input: {
    userId: string;
    email: string;
    platform?: 'skillup';
    now?: Date;
    ttlMs?: number;
  }): Promise<{
    invitationToken: string;
    record: StudentInvitationRecord;
  }>;
  claimForRedemption(input: {
    invitationToken: string;
    email?: string;
    platform?: string;
    now?: Date;
  }): Promise<ClaimStudentInvitationOutcome>;
  redeemAtomic(input: {
    invitationId: string;
    claimToken: string;
    now?: Date;
  }): Promise<StudentInvitationRecord>;
  releaseClaim(input: {
    invitationId: string;
    claimToken: string;
  }): Promise<void>;
}

/**
 * Explicitly injected test adapter for student invitations.
 * Must only be passed explicitly by tests into `dbClient` / `tx` — never selected implicitly by production code.
 */
export function createIsolatedTestInvitationRepository(): IsolatedTestInvitationRepositoryPort {
  return {
    async createInvitation(input) {
      return issueStudentInvitation(input);
    },
    async claimForRedemption(input) {
      return claimStudentInvitationForRedemption(input);
    },
    async redeemAtomic(input) {
      return commitStudentInvitationRedemption(input);
    },
    async releaseClaim(input) {
      releaseStudentInvitationClaim(input);
    },
  };
}

export function clearStudentInvitationsForTests(): void {
  const store = getIsolatedTestAdapterState();
  store.byId = {};
  store.idByTokenHash = {};
}
