import { and, eq, isNull } from 'drizzle-orm';

import { db, platformAccess, users } from '@quiz/db-people';

import { logger } from './logger';
import type { SyncUserInput, SyncUserResult } from './types';

type SupportedPlatform = 'realtutorialhub' | 'skillup' | 'skillhubcore';

export class UserIdentityBridgeService {
  constructor(private readonly database = db) {}

  async syncUser(input: SyncUserInput): Promise<SyncUserResult> {
    if (input.externalBrand !== input.platform) {
      throw new Error(
        `Identity bridge mismatch: externalBrand "${input.externalBrand}" does not match platform "${input.platform}"`
      );
    }

    const existing = await this.database
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(
        and(
          eq(users.externalId, input.externalId),
          eq(users.platform, input.platform),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      const shadowUser = existing[0];

      await this.database
        .update(users)
        .set({ email: input.email, updatedAt: new Date() })
        .where(eq(users.id, shadowUser.id));

      logger.info(
        {
          shadowUserId: shadowUser.id,
          externalId: input.externalId,
          externalBrand: input.externalBrand,
          action: 'identity.bridge.updated',
        },
        'Shadow user updated',
      );

      return { shadowUserId: shadowUser.id, created: false };
    }

    const newUser = await this.database
      .insert(users)
      .values({
        externalId: input.externalId,
        externalBrand: input.externalBrand,
        email: input.email,
        platform: input.platform,
        role: input.role ?? 'student',
        passwordHash: '',
      })
      .returning({ id: users.id });

    const shadowUserId = newUser[0].id;

    await this.database.insert(platformAccess).values({
      userId: shadowUserId,
      platform: input.platform,
    });

    logger.info(
      {
        shadowUserId,
        externalId: input.externalId,
        externalBrand: input.externalBrand,
        platform: input.platform,
        action: 'identity.bridge.created',
      },
      'Shadow user created',
    );

    return { shadowUserId, created: true };
  }

  async getShadowUserId(
    externalId: string,
    platform: SupportedPlatform,
  ): Promise<string | null> {
    const result = await this.database
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.externalId, externalId),
          eq(users.platform, platform),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    if (result.length === 0) return null;
    return result[0].id;
  }

  async updateShadowUserId(
    brandDb: any,
    brandUsersTable: any,
    brandUserId: string,
    shadowUserId: string,
  ): Promise<void> {
    await brandDb
      .update(brandUsersTable)
      .set({ shadowUserId })
      .where(eq(brandUsersTable.id, brandUserId));

    logger.info(
      {
        brandUserId,
        shadowUserId,
        action: 'identity.bridge.linked',
      },
      'Shadow user linked to brand user',
    );
  }

  async grantPlatformAccess(
    shadowUserId: string,
    platform: SupportedPlatform,
  ): Promise<void> {
    const existing = await this.database
      .select()
      .from(platformAccess)
      .where(
        and(
          eq(platformAccess.userId, shadowUserId),
          eq(platformAccess.platform, platform),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      logger.info(
        {
          shadowUserId,
          platform,
          action: 'identity.bridge.access_already_granted',
        },
        'Platform access already granted',
      );
      return;
    }

    await this.database.insert(platformAccess).values({ userId: shadowUserId, platform });

    logger.info(
      {
        shadowUserId,
        platform,
        action: 'identity.bridge.access_granted',
      },
      'Platform access granted',
    );
  }
}
