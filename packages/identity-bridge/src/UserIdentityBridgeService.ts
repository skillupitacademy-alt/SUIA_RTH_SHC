import { randomUUID } from 'node:crypto';
import { and, eq, isNull, or } from 'drizzle-orm';
import type { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core';

import { db, normalizeEmail, platformAccess, users, type DbClient } from '@quiz/db-people';

import { logger } from './logger';
import type { SyncUserInput, SyncUserResult } from './types';

type SupportedPlatform = SyncUserInput['platform'];
type PeopleTransaction = Parameters<Parameters<DbClient['transaction']>[0]>[0];
type SourceIdentity = Pick<SyncUserInput, 'externalId' | 'externalBrand'>;
type BrandIdentityTable = AnyPgTable & {
  id: AnyPgColumn;
  shadowUserId: AnyPgColumn;
  deletedAt: AnyPgColumn;
};

export class IdentityBridgeError extends Error {
  constructor(readonly code: 'IDENTITY_CONFLICT' | 'PROJECTION_UNAVAILABLE' | 'ACCESS_REVOKED' | 'SHADOW_LINK_CONFLICT') {
    super('Identity reconciliation could not be completed');
    this.name = 'IdentityBridgeError';
  }
}

export class UserIdentityBridgeService {
  constructor(private readonly database = db) {}

  async syncUser(input: SyncUserInput): Promise<SyncUserResult> {
    if (input.externalBrand !== input.platform) {
      throw new IdentityBridgeError('IDENTITY_CONFLICT');
    }

    try {
      const email = normalizeEmail(input.email);
      const candidateId = randomUUID();
      const result = await this.database.transaction(async (tx) => {
        const [inserted] = await tx.insert(users).values({
          id: candidateId,
          externalId: input.externalId,
          externalBrand: input.externalBrand,
          email,
          platform: input.platform,
          role: input.role ?? 'student',
          passwordHash: '',
        }).onConflictDoNothing().returning({ id: users.id });

        // A conflict can involve the legacy email key or the external identity key.
        // Resolve only the authoritative identity, including after a concurrent insert.
        const [existing] = inserted === undefined
          ? await tx.select({ id: users.id }).from(users).where(and(
            eq(users.externalId, input.externalId), eq(users.platform, input.platform),
            eq(users.isActive, true), isNull(users.deletedAt),
          )).limit(1).for('update')
          : [];
        const person = inserted ?? existing;

        if (person === undefined) {
          throw new IdentityBridgeError('PROJECTION_UNAVAILABLE');
        }
        if (input.expectedShadowUserId !== undefined && person.id !== input.expectedShadowUserId) {
          throw new IdentityBridgeError('SHADOW_LINK_CONFLICT');
        }

        if (inserted === undefined) {
          await tx.update(users).set({ email, updatedAt: new Date() }).where(eq(users.id, person.id));
        }

        // Only the canonical, authenticated brand account may request its own grant.
        await this.ensurePlatformAccess(tx, person.id, input.platform);
        return { shadowUserId: person.id, created: person.id === candidateId };
      }, { isolationLevel: 'read committed' });
      logger.info({ platform: input.platform, created: result.created, action: 'identity.bridge.reconciled' }, 'Identity projection reconciled');
      return result;
    } catch (error) {
      throw this.safeError(error);
    }
  }

  async getShadowUserId(externalId: string, platform: SupportedPlatform): Promise<string | null> {
    const [person] = await this.database.select({ id: users.id }).from(users).where(and(
      eq(users.externalId, externalId), eq(users.platform, platform),
      eq(users.isActive, true), isNull(users.deletedAt),
    )).limit(1);
    return person?.id ?? null;
  }

  async updateShadowUserId(
    brandDb: Pick<DbClient, 'update'>,
    brandUsersTable: BrandIdentityTable,
    brandUserId: string,
    shadowUserId: string,
    platform: SupportedPlatform,
  ): Promise<void> {
    try {
      const mappedId = await this.getShadowUserId(brandUserId, platform);
      if (mappedId !== shadowUserId) {
        throw new IdentityBridgeError('SHADOW_LINK_CONFLICT');
      }
      const linked = await brandDb.update(brandUsersTable).set({ shadowUserId }).where(and(
        eq(brandUsersTable.id, brandUserId),
        isNull(brandUsersTable.deletedAt),
        or(isNull(brandUsersTable.shadowUserId), eq(brandUsersTable.shadowUserId, shadowUserId)),
      )).returning({ id: brandUsersTable.id });
      if (linked.length !== 1) {
        throw new IdentityBridgeError('SHADOW_LINK_CONFLICT');
      }
    } catch (error) {
      throw this.safeError(error);
    }
  }

  async grantPlatformAccess(shadowUserId: string, platform: SupportedPlatform, source: SourceIdentity): Promise<void> {
    if (source === undefined || source.externalBrand !== platform) {
      throw new IdentityBridgeError('IDENTITY_CONFLICT');
    }
    try {
      await this.database.transaction(async (tx) => {
        const [person] = await tx.select({ id: users.id }).from(users).where(and(
          eq(users.id, shadowUserId), eq(users.externalId, source.externalId),
          eq(users.platform, platform), eq(users.isActive, true), isNull(users.deletedAt),
        )).limit(1).for('update');
        if (person === undefined) {
          throw new IdentityBridgeError('IDENTITY_CONFLICT');
        }
        await this.ensurePlatformAccess(tx, shadowUserId, platform);
      });
    } catch (error) {
      throw this.safeError(error);
    }
  }

  private async ensurePlatformAccess(tx: PeopleTransaction, shadowUserId: string, platform: SupportedPlatform): Promise<void> {
    await tx.insert(platformAccess).values({ userId: shadowUserId, platform }).onConflictDoNothing({
      target: [platformAccess.userId, platformAccess.platform],
    });
    const [grant] = await tx.select({ deletedAt: platformAccess.deletedAt }).from(platformAccess).where(and(
      eq(platformAccess.userId, shadowUserId), eq(platformAccess.platform, platform),
    )).limit(1).for('update');
    if (grant === undefined || grant.deletedAt !== null) {
      throw new IdentityBridgeError('ACCESS_REVOKED');
    }
  }

  private safeError(error: unknown): IdentityBridgeError {
    if (error instanceof IdentityBridgeError) return error;
    const cause = error instanceof Error && 'cause' in error ? error.cause : error;
    const uniqueConflict = typeof cause === 'object' && cause !== null && 'code' in cause && cause.code === '23505';
    const safe = new IdentityBridgeError(uniqueConflict ? 'IDENTITY_CONFLICT' : 'PROJECTION_UNAVAILABLE');
    logger.warn({ code: safe.code, action: 'identity.bridge.failed' }, 'Identity reconciliation failed');
    return safe;
  }
}
