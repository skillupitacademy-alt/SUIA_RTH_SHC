import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { resolve } from 'path';

import { and, eq, isNull } from 'drizzle-orm';

import { db, schema } from '@quiz/db-people';

import { scriptLogger } from './logger';

const root = resolve(process.cwd());
dotenv.config({ path: resolve(root, '.env.local') });
dotenv.config({ path: resolve(root, '.env') });

const SUPER_ADMIN_EMAIL = 'admin@realtutorialhub.com';
const SUPER_ADMIN_PASSWORD = 'YourSecurePassword123!';
const SALT_ROUNDS = 12;

type SeedSuperAdminResult = {
  userId: string;
  created: boolean;
  platformAccessCreated: number;
};

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function seedSuperAdmin(): Promise<SeedSuperAdminResult> {
  const passwordHash = await hashPassword(SUPER_ADMIN_PASSWORD);

  return db.transaction(async (tx) => {
    const existingUsers = await tx
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, SUPER_ADMIN_EMAIL))
      .limit(1);

    const desiredPlatform = 'both' as const;
    const desiredRole = 'super_admin' as const;

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];

      const [updatedUser] = await tx
        .update(schema.users)
        .set({
          passwordHash,
          role: desiredRole,
          platform: desiredPlatform,
          isActive: true,
          deletedAt: null,
        })
        .where(eq(schema.users.id, existingUser.id))
        .returning({ id: schema.users.id });

      const platformAccessRows = await Promise.all(
        (['realtutorialhub', 'skillup'] as const).map(async (platform) => {
          const existingAccess = await tx
            .select({ id: schema.platformAccess.id })
            .from(schema.platformAccess)
            .where(and(
              eq(schema.platformAccess.userId, existingUser.id),
              eq(schema.platformAccess.platform, platform),
              isNull(schema.platformAccess.deletedAt),
            ))
            .limit(1);

          if (existingAccess.length > 0) {
            return false;
          }

          await tx.insert(schema.platformAccess).values({
            userId: existingUser.id,
            platform,
          });
          return true;
        }),
      );

      return {
        userId: updatedUser.id,
        created: false,
        platformAccessCreated: platformAccessRows.filter(Boolean).length,
      };
    }

    const [createdUser] = await tx
      .insert(schema.users)
      .values({
        email: SUPER_ADMIN_EMAIL,
        passwordHash,
        role: desiredRole,
        platform: desiredPlatform,
        isActive: true,
      })
      .returning({ id: schema.users.id });

    await tx.insert(schema.platformAccess).values([
      {
        userId: createdUser.id,
        platform: 'realtutorialhub',
      },
      {
        userId: createdUser.id,
        platform: 'skillup',
      },
    ]);

    return {
      userId: createdUser.id,
      created: true,
      platformAccessCreated: 2,
    };
  });
}

async function main() {
  if (typeof process.env.DATABASE_URL_PEOPLE !== 'string' || process.env.DATABASE_URL_PEOPLE.trim().length === 0) {
    throw new Error('DATABASE_URL_PEOPLE environment variable is required');
  }

  const result = await seedSuperAdmin();
  scriptLogger.info('super admin bootstrap complete', {
    event: 'super_admin.seed_complete',
    ...result,
    email: SUPER_ADMIN_EMAIL,
  });
}

main().catch((error: unknown) => {
  scriptLogger.error('super admin bootstrap failed', {
    event: 'super_admin.seed_failed',
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
