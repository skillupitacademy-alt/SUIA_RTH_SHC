import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { and, eq, gt, lte, or } from 'drizzle-orm';
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
    claimExpiresAt:
      row.claimExpiresAt instanceof Date
        ? row.claimExpiresAt.toISOString()
        : typeof row.claimExpiresAt === 'string'
          ? row.claimExpiresAt
          : null,
    issuedAt:
      row.issuedAt instanceof Date
        ? row.issuedAt.toISOString()
        : String(row.issuedAt),
    expiresAt:
      row.expiresAt instanceof Date
        ? row.expiresAt.toISOString()
        : String(row.expiresAt),
    redeemedAt:
      row.redeemedAt instanceof Date
        ? row.redeemedAt.toISOString()
        : typeof row.redeemedAt === 'string'
          ? row.redeemedAt
          : null,
  };
}

/**
 * Authoritative SQL repository for student invitation persistence (`student_invitations`).
 * All runtime operations execute directly against `this.dbInstance` (database or transaction handle `tx`)
 * and fail closed on any SQL error or zero-row mutation.
 */
export class StudentInvitationRepository {
  private readonly dbInstance: DbClient;

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
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
      throw new Error('Invitation TTL must be positive');
    }
    const expiresAt = new Date(now.getTime() + ttlMs);
    const invitationToken = `sku_inv_${randomBytes(32).toString('base64url')}`;
    const tokenHash = hashInvitationToken(invitationToken);
    const invitationId = randomUUID();

    // Revoke any earlier pending/claiming invitations for the same user+platform
    await this.dbInstance
      .update(studentInvitations)
      .set({
        status: 'revoked',
        claimOwnerToken: null,
        claimExpiresAt: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(studentInvitations.userId, input.userId),
          eq(studentInvitations.platform, 'skillup'),
          or(
            eq(studentInvitations.status, 'pending'),
            eq(studentInvitations.status, 'claiming')
          )
        )
      );

    const rows = await this.dbInstance
      .insert(studentInvitations)
      .values({
        id: invitationId,
        userId: input.userId,
        email: normalizedEmail,
        platform: 'skillup',
        tokenHash,
        status: 'pending',
        claimOwnerToken: null,
        claimExpiresAt: null,
        issuedAt: now,
        expiresAt,
        redeemedAt: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!Array.isArray(rows) || rows.length === 0 || !rows[0]?.id) {
      throw new Error('Failed to persist student invitation: zero affected rows');
    }

    return {
      invitationToken,
      tokenHash,
      record: mapRowToRecord(rows[0] as StudentInvitationRow),
    };
  }

  async findByTokenHash(tokenHash: string): Promise<StudentInvitationRecord | undefined> {
    const rows = await this.dbInstance
      .select()
      .from(studentInvitations)
      .where(eq(studentInvitations.tokenHash, tokenHash.trim()));

    if (Array.isArray(rows) && rows.length > 0 && rows[0]?.id) {
      return mapRowToRecord(rows[0] as StudentInvitationRow);
    }
    return undefined;
  }

  async findById(invitationId: string): Promise<StudentInvitationRecord | undefined> {
    const rows = await this.dbInstance
      .select()
      .from(studentInvitations)
      .where(eq(studentInvitations.id, invitationId.trim()));

    if (Array.isArray(rows) && rows.length > 0 && rows[0]?.id) {
      return mapRowToRecord(rows[0] as StudentInvitationRow);
    }
    return undefined;
  }

  async revokeById(invitationId: string, now = new Date()): Promise<StudentInvitationRecord> {
    const rows = await this.dbInstance
      .update(studentInvitations)
      .set({
        status: 'revoked',
        claimOwnerToken: null,
        claimExpiresAt: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(studentInvitations.id, invitationId.trim()),
          or(
            eq(studentInvitations.status, 'pending'),
            eq(studentInvitations.status, 'claiming')
          )
        )
      )
      .returning();

    if (!Array.isArray(rows) || rows.length === 0 || !rows[0]?.id) {
      throw new Error('Failed to revoke student invitation: not found or already finalized');
    }
    return mapRowToRecord(rows[0] as StudentInvitationRow);
  }

  async claimForRedemption(input: {
    invitationToken: string;
    email?: string;
    platform?: string;
    now?: Date;
    claimTtlMs?: number;
  }): Promise<ClaimStudentInvitationOutcome> {
    if (typeof input.invitationToken !== 'string' || input.invitationToken.trim().length < 16) {
      return { ok: false, reason: 'invalid-token' };
    }

    const expectedPlatform = (input.platform ?? 'skillup').trim().toLowerCase();
    if (expectedPlatform !== 'skillup') {
      return { ok: false, reason: 'tenant-mismatch' };
    }

    const tokenHash = hashInvitationToken(input.invitationToken);
    const existing = await this.findByTokenHash(tokenHash);
    if (!existing) {
      return { ok: false, reason: 'invalid-token' };
    }

    const storedHashBuf = Buffer.from(existing.tokenHash, 'hex');
    const candidateHashBuf = Buffer.from(tokenHash, 'hex');
    if (
      storedHashBuf.length !== candidateHashBuf.length ||
      !timingSafeEqual(storedHashBuf, candidateHashBuf)
    ) {
      return { ok: false, reason: 'invalid-token' };
    }

    if (existing.platform !== expectedPlatform) {
      return { ok: false, reason: 'tenant-mismatch', record: existing };
    }

    if (
      typeof input.email === 'string' &&
      input.email.trim().length > 0 &&
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
    if (now.getTime() >= new Date(existing.expiresAt).getTime()) {
      await this.dbInstance
        .update(studentInvitations)
        .set({
          status: 'expired',
          claimOwnerToken: null,
          claimExpiresAt: null,
          updatedAt: now,
        })
        .where(and(
          eq(studentInvitations.id, existing.invitationId),
          lte(studentInvitations.expiresAt, now),
          or(eq(studentInvitations.status, 'pending'), eq(studentInvitations.status, 'claiming'))
        ));
      return { ok: false, reason: 'expired', record: { ...existing, status: 'expired' } };
    }

    const claimTtlMs = input.claimTtlMs ?? INVITATION_CLAIM_TTL_MS;
    if (!Number.isFinite(claimTtlMs) || claimTtlMs <= 0) {
      throw new Error('Invitation claim TTL must be positive');
    }
    const claimToken = randomUUID();
    const claimExpiresAt = new Date(now.getTime() + claimTtlMs);

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
          gt(studentInvitations.expiresAt, now),
          or(
            eq(studentInvitations.status, 'pending'),
            and(
              eq(studentInvitations.status, 'claiming'),
              lte(studentInvitations.claimExpiresAt, now)
            )
          )
        )
      )
      .returning();

    if (!Array.isArray(rows) || rows.length === 0 || !rows[0]?.id) {
      return { ok: false, reason: 'already-redeemed', record: existing };
    }

    return {
      ok: true,
      claimToken,
      record: mapRowToRecord(rows[0] as StudentInvitationRow),
    };
  }

  async redeemAtomic(input: {
    invitationId: string;
    claimToken: string;
    now?: Date;
  }): Promise<StudentInvitationRecord> {
    const normalizedId = input.invitationId.trim();
    const normalizedClaim = input.claimToken.trim();
    if (!normalizedId || !normalizedClaim) {
      throw new Error('invitationId and claimToken are required for atomic invitation redemption');
    }

    const now = input.now ?? new Date();
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
          eq(studentInvitations.id, normalizedId),
          eq(studentInvitations.status, 'claiming'),
          eq(studentInvitations.claimOwnerToken, normalizedClaim),
          gt(studentInvitations.claimExpiresAt, now),
          gt(studentInvitations.expiresAt, now)
        )
      )
      .returning();

    if (!Array.isArray(rows) || rows.length === 0 || !rows[0]?.id) {
      throw new Error('Student invitation claim ownership lost or already redeemed before commit');
    }

    return mapRowToRecord(rows[0] as StudentInvitationRow);
  }

  async releaseClaim(input: {
    invitationId: string;
    claimToken: string;
  }): Promise<StudentInvitationRecord | undefined> {
    const normalizedId = input.invitationId.trim();
    const normalizedClaim = input.claimToken.trim();
    if (!normalizedId || !normalizedClaim) {
      return undefined;
    }

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
          eq(studentInvitations.id, normalizedId),
          eq(studentInvitations.status, 'claiming'),
          eq(studentInvitations.claimOwnerToken, normalizedClaim)
        )
      )
      .returning();

    if (Array.isArray(rows) && rows.length > 0 && rows[0]?.id) {
      return mapRowToRecord(rows[0] as StudentInvitationRow);
    }
    return undefined;
  }
}
