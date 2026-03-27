import { and, eq, isNull } from 'drizzle-orm';

import { withTimeout, STANDARD_QUERY_TIMEOUT } from '@quiz/db';
import type { PeopleDbClientLike, PeoplePlatform, PeopleSubscriptionRecord, PeopleUserRecord, PeopleUserRole, IUserRepository } from '@quiz/types';

import { db, schema } from '@/lib/db';

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  role: PeopleUserRole;
  platform: PeoplePlatform;
}

export interface CreateSubscriptionInput {
  userId: string;
  planType: 'free' | 'pro' | 'enterprise';
  features: string[];
}

export interface CreateSessionInput {
  userId: string;
  jwtFamily: string;
  platform: PeoplePlatform;
  refreshTokenHash: string;
}

type PeopleDb = typeof db;

export class DrizzleUserRepository implements IUserRepository {
  constructor(private readonly dbClient: PeopleDb = db) {}

  withDb(dbClient: PeopleDbClientLike): this {
    return new DrizzleUserRepository(dbClient as PeopleDb) as this;
  }

  async transaction<T>(callback: (repo: IUserRepository) => Promise<T>): Promise<T> {
    return this.dbClient.transaction(async (tx) => callback(new DrizzleUserRepository(tx as unknown as PeopleDb)));
  }

  async findByEmail(email: string): Promise<PeopleUserRecord | undefined> {
    const rows = await withTimeout(
      this.dbClient
        .select()
        .from(schema.users)
        .where(and(eq(schema.users.email, email), isNull(schema.users.deletedAt)))
        .limit(1),
      STANDARD_QUERY_TIMEOUT,
      'people.users.findByEmail'
    );
    return rows[0] as PeopleUserRecord | undefined;
  }

  async findById(userId: string): Promise<PeopleUserRecord | undefined> {
    const rows = await withTimeout(
      this.dbClient
        .select()
        .from(schema.users)
        .where(and(eq(schema.users.id, userId), isNull(schema.users.deletedAt)))
        .limit(1),
      STANDARD_QUERY_TIMEOUT,
      'people.users.findById'
    );
    return rows[0] as PeopleUserRecord | undefined;
  }

  async createUser(input: CreateUserInput): Promise<PeopleUserRecord> {
    const [row] = await withTimeout(
      this.dbClient
        .insert(schema.users)
        .values({
          email: input.email,
          passwordHash: input.passwordHash,
          role: input.role,
          platform: input.platform,
        })
        .returning(),
      STANDARD_QUERY_TIMEOUT,
      'people.users.create'
    );
    return row as PeopleUserRecord;
  }

  async createSubscription(input: CreateSubscriptionInput): Promise<PeopleSubscriptionRecord> {
    const [row] = await withTimeout(
      this.dbClient
        .insert(schema.subscriptions)
        .values({
          userId: input.userId,
          planType: input.planType,
          features: input.features,
        })
        .returning(),
      STANDARD_QUERY_TIMEOUT,
      'people.subscriptions.create'
    );
    return row as PeopleSubscriptionRecord;
  }

  async grantPlatformAccess(userId: string, platform: PeoplePlatform): Promise<unknown> {
    const existing = await withTimeout(
      this.dbClient
        .select()
        .from(schema.platformAccess)
        .where(and(eq(schema.platformAccess.userId, userId), eq(schema.platformAccess.platform, platform)))
        .limit(1),
      STANDARD_QUERY_TIMEOUT,
      'people.platform_access.find'
    );

    if (existing.length > 0) {
      const [row] = await withTimeout(
        this.dbClient
          .update(schema.platformAccess)
          .set({
            deletedAt: null,
            grantedAt: new Date(),
          })
          .where(and(eq(schema.platformAccess.userId, userId), eq(schema.platformAccess.platform, platform)))
          .returning(),
        STANDARD_QUERY_TIMEOUT,
        'people.platform_access.restore'
      );
      return row ?? existing[0];
    }

    const [row] = await withTimeout(
      this.dbClient
        .insert(schema.platformAccess)
        .values({
          userId,
          platform,
        })
        .returning(),
      STANDARD_QUERY_TIMEOUT,
      'people.platform_access.create'
    );
    return row;
  }

  async revokePlatformAccess(userId: string, platform: PeoplePlatform): Promise<unknown> {
    const [row] = await withTimeout(
      this.dbClient
        .update(schema.platformAccess)
        .set({ deletedAt: new Date() })
        .where(and(eq(schema.platformAccess.userId, userId), eq(schema.platformAccess.platform, platform), isNull(schema.platformAccess.deletedAt)))
        .returning(),
      STANDARD_QUERY_TIMEOUT,
      'people.platform_access.revoke'
    );
    return row;
  }

  async listPlatforms(userId: string): Promise<PeoplePlatform[]> {
    const rows = await withTimeout(
      this.dbClient
        .select({ platform: schema.platformAccess.platform })
        .from(schema.platformAccess)
        .where(and(eq(schema.platformAccess.userId, userId), isNull(schema.platformAccess.deletedAt))),
      STANDARD_QUERY_TIMEOUT,
      'people.platform_access.list'
    );
    return rows.map((row) => row.platform as PeoplePlatform);
  }

  async getActiveSubscription(userId: string): Promise<PeopleSubscriptionRecord | undefined> {
    const rows = await withTimeout(
      this.dbClient
        .select()
        .from(schema.subscriptions)
        .where(and(eq(schema.subscriptions.userId, userId), eq(schema.subscriptions.status, 'active'), isNull(schema.subscriptions.deletedAt)))
        .limit(1),
      STANDARD_QUERY_TIMEOUT,
      'people.subscriptions.findActive'
    );
    return rows[0] as PeopleSubscriptionRecord | undefined;
  }

  async createSession(input: CreateSessionInput): Promise<unknown> {
    const [row] = await withTimeout(
      this.dbClient
        .insert(schema.ssoSessions)
        .values({
          userId: input.userId,
          jwtFamily: input.jwtFamily,
          platform: input.platform,
        })
        .returning(),
      STANDARD_QUERY_TIMEOUT,
      'people.sso_sessions.create'
    );
    return row;
  }

  async findSessionByFamily(userId: string, familyId: string): Promise<unknown> {
    const rows = await withTimeout(
      this.dbClient
        .select()
        .from(schema.ssoSessions)
        .where(and(eq(schema.ssoSessions.userId, userId), eq(schema.ssoSessions.jwtFamily, familyId), isNull(schema.ssoSessions.deletedAt)))
        .limit(1),
      STANDARD_QUERY_TIMEOUT,
      'people.sso_sessions.findByFamily'
    );
    return rows[0];
  }

  async revokeSessionByFamily(userId: string, familyId: string, reason: string): Promise<unknown> {
    const [row] = await withTimeout(
      this.dbClient
        .update(schema.ssoSessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(schema.ssoSessions.userId, userId), eq(schema.ssoSessions.jwtFamily, familyId), isNull(schema.ssoSessions.deletedAt)))
        .returning(),
      STANDARD_QUERY_TIMEOUT,
      'people.sso_sessions.revoke'
    );
    return { ...row, reason };
  }

  async revokeAllSessions(userId: string, reason: string): Promise<unknown> {
    return withTimeout(
      this.dbClient
        .update(schema.ssoSessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(schema.ssoSessions.userId, userId), isNull(schema.ssoSessions.deletedAt), isNull(schema.ssoSessions.revokedAt))),
      STANDARD_QUERY_TIMEOUT,
      `people.sso_sessions.revokeAll:${reason}`
    );
  }

  async createTokenFamily(input: { userId: string; familyId: string }): Promise<unknown> {
    const [row] = await withTimeout(
      this.dbClient
        .insert(schema.refreshTokenFamilies)
        .values({
          userId: input.userId,
          familyId: input.familyId,
        })
        .returning(),
      STANDARD_QUERY_TIMEOUT,
      'people.token_families.create'
    );
    return row;
  }

  async findTokenFamilyByFamilyId(familyId: string): Promise<unknown> {
    const rows = await withTimeout(
      this.dbClient
        .select()
        .from(schema.refreshTokenFamilies)
        .where(and(eq(schema.refreshTokenFamilies.familyId, familyId), isNull(schema.refreshTokenFamilies.deletedAt)))
        .limit(1),
      STANDARD_QUERY_TIMEOUT,
      'people.token_families.findByFamilyId'
    );
    return rows[0];
  }

  async markTokenFamilyCompromised(familyId: string): Promise<unknown> {
    const [row] = await withTimeout(
      this.dbClient
        .update(schema.refreshTokenFamilies)
        .set({ isCompromised: true })
        .where(and(eq(schema.refreshTokenFamilies.familyId, familyId), isNull(schema.refreshTokenFamilies.deletedAt)))
        .returning(),
      STANDARD_QUERY_TIMEOUT,
      'people.token_families.markCompromised'
    );
    return row;
  }

  async updateTokenFamilyUsage(familyId: string): Promise<unknown> {
    const [row] = await withTimeout(
      this.dbClient
        .update(schema.refreshTokenFamilies)
        .set({ lastUsedAt: new Date() })
        .where(and(eq(schema.refreshTokenFamilies.familyId, familyId), isNull(schema.refreshTokenFamilies.deletedAt)))
        .returning(),
      STANDARD_QUERY_TIMEOUT,
      'people.token_families.updateLastUsed'
    );
    return row;
  }

  async createAuditLog(input: {
    actorId?: string | null;
    action: string;
    platform?: string | null;
    ip?: string | null;
    success?: boolean | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<unknown> {
    const [row] = await withTimeout(
      this.dbClient
        .insert(schema.authAuditLog)
        .values({
          actorId: input.actorId ?? null,
          action: input.action,
          platform: input.platform ?? null,
          ip: input.ip ?? null,
          success: input.success ?? null,
          metadata: input.metadata ?? null,
        })
        .returning(),
      STANDARD_QUERY_TIMEOUT,
      'people.auth_audit_log.create'
    );
    return row;
  }
}
