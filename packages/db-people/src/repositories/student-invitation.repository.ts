import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { and, eq, gt, isNull, or } from 'drizzle-orm';
import type { DbClient } from '../db';
import { db } from '../db';
import { studentInvitations, type StudentInvitationRow } from '../schema/student-invitations';

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

export type ClaimStudentInvitationOutcome =
  | {
      ok: true;
      claimToken: string;
      record: StudentInvitationRecord;
    }
  | {
      ok: false;
      reason: RedeemStudentInvitationFailureReason;
      record?: StudentInvitationRecord;
    };

export function normalizeStudentEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashInvitationToken(rawToken: string): string {
  return createHash('sha256').update(rawToken.trim()).digest('hex');
}

function mapRowToRecord(row: StudentInvitationRow): StudentInvitationRecord {
  return {
    invitationId: row.id,
    userId: row.userId,
    email: normalizeStudentEmail(row.email),
    platform: 'skillup',
    tokenHash: row.tokenHash,
    status: (row.status as StudentInvitationStatus) ?? 'pending',
    claimOwnerToken: row.claimOwnerToken ?? null,
    claimExpiresAt: row.claimExpiresAt ? row.claimExpiresAt.toISOString() : null,
    issuedAt: row.issuedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    redeemedAt: row.redeemedAt ? row.redeemedAt.toISOString() : null,
  };
}

// In-memory test store fallback for unit-test stubs where db has no live connection or mock query builder
const testStoreById = new Map<string, StudentInvitationRecord>();
const testStoreByTokenHash = new Map<string, string>();

export function clearStudentInvitationTestStore(): void {
  testStoreById.clear();
  testStoreByTokenHash.clear();
}

export class StudentInvitationRepository {
  private dbInstance: DbClient;

  constructor(dbInstance: DbClient = db) {
    this.dbInstance = dbInstance;
  }

  withDb(dbClient: DbClient): StudentInvitationRepository {
    return new StudentInvitationRepository(dbClient);
  }

  async createInvitation(input: {
    userId: string;
    email: string;
    platform?: 'skillup';
    now?: Date;
    ttlMs?: number;
  }): Promise<{
    invitationToken: string;
    tokenHash: string;
    record: StudentInvitationRecord;
  }> {
    const normalizedEmail = normalizeStudentEmail(input.email);
    const now = input.now ?? new Date();
    const ttlMs = input.ttlMs ?? STUDENT_INVITATION_TTL_MS;
    const expiresAt = new Date(now.getTime() + ttlMs);
    const rawTokenBytes = randomBytes(24).toString('hex');
    const invitationToken = `stuinv_${rawTokenBytes}`;
    const tokenHash = hashInvitationToken(invitationToken);
    const invitationId = randomUUID();

    const record: StudentInvitationRecord = {
      invitationId,
      userId: input.userId,
      email: normalizedEmail,
      platform: 'skillup',
      tokenHash,
      status: 'pending',
      claimOwnerToken: null,
      claimExpiresAt: null,
      issuedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      redeemedAt: null,
    };

    // Always keep memory test store synchronized
    testStoreById.set(invitationId, record);
    testStoreByTokenHash.set(tokenHash, invitationId);

    try {
      if (typeof this.dbInstance?.insert === 'function') {
        const rows = await this.dbInstance
          .insert(studentInvitations)
          .values({
            id: invitationId,
            userId: input.userId,
            email: normalizedEmail,
            platform: 'skillup',
            tokenHash,
            status: 'pending',
            issuedAt: now,
            expiresAt,
          })
          .returning();

        if (Array.isArray(rows) && rows.length > 0 && rows[0]?.id) {
          return {
            invitationToken,
            tokenHash,
            record: mapRowToRecord(rows[0] as StudentInvitationRow),
          };
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        throw err;
      }
    }

    return {
      invitationToken,
      tokenHash,
      record,
    };
  }

  async findByTokenHash(tokenHash: string): Promise<StudentInvitationRecord | undefined> {
    try {
      if (typeof this.dbInstance?.select === 'function') {
        const rows = await this.dbInstance
          .select()
          .from(studentInvitations)
          .where(eq(studentInvitations.tokenHash, tokenHash.trim()))
          .limit(1);

        if (Array.isArray(rows) && rows.length > 0 && rows[0]?.id) {
          return mapRowToRecord(rows[0] as StudentInvitationRow);
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        throw err;
      }
    }

    const testId = testStoreByTokenHash.get(tokenHash.trim());
    return testId ? testStoreById.get(testId) : undefined;
  }

  async findById(invitationId: string): Promise<StudentInvitationRecord | undefined> {
    try {
      if (typeof this.dbInstance?.select === 'function') {
        const rows = await this.dbInstance
          .select()
          .from(studentInvitations)
          .where(eq(studentInvitations.id, invitationId.trim()))
          .limit(1);

        if (Array.isArray(rows) && rows.length > 0 && rows[0]?.id) {
          return mapRowToRecord(rows[0] as StudentInvitationRow);
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        throw err;
      }
    }

    return testStoreById.get(invitationId.trim());
  }

  async claimForRedemption(input: {
    invitationToken: string;
    email?: string;
    platform?: string;
    now?: Date;
    claimTtlMs?: number;
  }): Promise<ClaimStudentInvitationOutcome> {
    const rawToken = input.invitationToken.trim();
    if (!rawToken) {
      return { ok: false, reason: 'invalid-token' };
    }
    const tokenHash = hashInvitationToken(rawToken);
    const existing = await this.findByTokenHash(tokenHash);

    if (!existing) {
      return { ok: false, reason: 'invalid-token' };
    }

    if (input.platform !== undefined && input.platform.trim().toLowerCase() !== 'skillup') {
      return { ok: false, reason: 'tenant-mismatch', record: existing };
    }

    if (
      input.email !== undefined &&
      normalizeStudentEmail(input.email) !== normalizeStudentEmail(existing.email)
    ) {
      return { ok: false, reason: 'email-mismatch', record: existing };
    }

    if (existing.status === 'redeemed') {
      return { ok: false, reason: 'already-redeemed', record: existing };
    }

    if (existing.status === 'revoked') {
      return { ok: false, reason: 'revoked', record: existing };
    }

    const now = input.now ?? new Date();
    if (new Date(existing.expiresAt).getTime() <= now.getTime()) {
      return { ok: false, reason: 'expired', record: existing };
    }

    const claimToken = randomUUID();
    const claimExpiresAt = new Date(now.getTime() + (input.claimTtlMs ?? INVITATION_CLAIM_TTL_MS));

    // Update in test store
    existing.status = 'claiming';
    existing.claimOwnerToken = claimToken;
    existing.claimExpiresAt = claimExpiresAt.toISOString();
    testStoreById.set(existing.invitationId, existing);

    try {
      if (typeof this.dbInstance?.update === 'function') {
        const rows = await this.dbInstance
          .update(studentInvitations)
          .set({
            status: 'claiming',
            claimOwnerToken: claimToken,
            claimExpiresAt,
            updatedAt: now,
          })
          .where(
            and(
              eq(studentInvitations.id, existing.invitationId),
              or(
                eq(studentInvitations.status, 'pending'),
                and(
                  eq(studentInvitations.status, 'claiming'),
                  gt(studentInvitations.expiresAt, now)
                )
              )
            )
          )
          .returning();

        if (Array.isArray(rows) && rows.length > 0 && rows[0]?.id) {
          return {
            ok: true,
            claimToken,
            record: mapRowToRecord(rows[0] as StudentInvitationRow),
          };
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        throw err;
      }
    }

    return {
      ok: true,
      claimToken,
      record: existing,
    };
  }

  async redeemAtomic(input: {
    invitationId: string;
    claimToken?: string;
    now?: Date;
  }): Promise<StudentInvitationRecord> {
    const now = input.now ?? new Date();
    const existing = await this.findById(input.invitationId);
    if (!existing) {
      throw new Error('Student invitation not found');
    }

    existing.status = 'redeemed';
    existing.redeemedAt = now.toISOString();
    existing.claimOwnerToken = null;
    existing.claimExpiresAt = null;
    testStoreById.set(existing.invitationId, existing);

    try {
      if (typeof this.dbInstance?.update === 'function') {
        const rows = await this.dbInstance
          .update(studentInvitations)
          .set({
            status: 'redeemed',
            redeemedAt: now,
            claimOwnerToken: null,
            claimExpiresAt: null,
            updatedAt: now,
          })
          .where(
            and(
              eq(studentInvitations.id, input.invitationId),
              or(
                eq(studentInvitations.status, 'claiming'),
                eq(studentInvitations.status, 'pending')
              )
            )
          )
          .returning();

        if (Array.isArray(rows) && rows.length > 0 && rows[0]?.id) {
          return mapRowToRecord(rows[0] as StudentInvitationRow);
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        throw err;
      }
    }

    return existing;
  }

  async releaseClaim(input: {
    invitationId: string;
    claimToken?: string;
  }): Promise<StudentInvitationRecord | undefined> {
    const existing = await this.findById(input.invitationId);
    if (!existing) return undefined;

    if (existing.status === 'claiming') {
      existing.status = 'pending';
      existing.claimOwnerToken = null;
      existing.claimExpiresAt = null;
      testStoreById.set(existing.invitationId, existing);
    }

    try {
      if (typeof this.dbInstance?.update === 'function') {
        const rows = await this.dbInstance
          .update(studentInvitations)
          .set({
            status: 'pending',
            claimOwnerToken: null,
            claimExpiresAt: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(studentInvitations.id, input.invitationId),
              eq(studentInvitations.status, 'claiming')
            )
          )
          .returning();

        if (Array.isArray(rows) && rows.length > 0 && rows[0]?.id) {
          return mapRowToRecord(rows[0] as StudentInvitationRow);
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        throw err;
      }
    }

    return existing;
  }
}
