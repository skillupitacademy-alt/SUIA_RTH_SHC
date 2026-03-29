import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { resolve } from 'path';
import { and, eq, isNull } from 'drizzle-orm';
import { db, schema } from '@quiz/db-people';
import { scriptLogger } from './logger';

const root = resolve(process.cwd());
dotenv.config({ path: resolve(root, '.env.local') });
dotenv.config({ path: resolve(root, '.env') });

const SALT_ROUNDS = 12;

const TEST_USERS = [
  {
    email: 'ajayshah@gmail.com',
    password: 'testing',
    role: 'student' as const,
    platform: 'realtutorialhub' as const,
  },
  {
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin' as const,
    platform: 'realtutorialhub' as const,
  },
];

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function checkAndSeedTestUsers() {
  for (const testUser of TEST_USERS) {
    scriptLogger.info(`Checking user: ${testUser.email}`);

    const existingUsers = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, testUser.email))
      .limit(1);

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      scriptLogger.info(`User exists: ${testUser.email}`, {
        id: existingUser.id,
        role: existingUser.role,
        platform: existingUser.platform,
        isActive: existingUser.isActive,
      });

      // Check platform access
      const platformAccessRows = await db
        .select()
        .from(schema.platformAccess)
        .where(
          and(
            eq(schema.platformAccess.userId, existingUser.id),
            eq(schema.platformAccess.platform, testUser.platform),
            isNull(schema.platformAccess.deletedAt)
          )
        );

      if (platformAccessRows.length === 0) {
        scriptLogger.info(`Granting platform access: ${testUser.platform}`);
        await db.insert(schema.platformAccess).values({
          userId: existingUser.id,
          platform: testUser.platform,
        });
      } else {
        scriptLogger.info(`Platform access already exists: ${testUser.platform}`);
      }

      // Update password and ensure active
      const passwordHash = await hashPassword(testUser.password);
      await db
        .update(schema.users)
        .set({
          passwordHash,
          role: testUser.role,
          platform: testUser.platform,
          isActive: true,
          deletedAt: null,
        })
        .where(eq(schema.users.id, existingUser.id));

      scriptLogger.info(`Updated user: ${testUser.email}`);
    } else {
      scriptLogger.info(`Creating user: ${testUser.email}`);
      const passwordHash = await hashPassword(testUser.password);

      const [createdUser] = await db
        .insert(schema.users)
        .values({
          email: testUser.email,
          passwordHash,
          role: testUser.role,
          platform: testUser.platform,
          isActive: true,
        })
        .returning({ id: schema.users.id });

      // Grant platform access
      await db.insert(schema.platformAccess).values({
        userId: createdUser.id,
        platform: testUser.platform,
      });

      scriptLogger.info(`Created user: ${testUser.email}`, { id: createdUser.id });
    }
  }
}

async function main() {
  if (typeof process.env.DATABASE_URL_PEOPLE !== 'string' || process.env.DATABASE_URL_PEOPLE.trim().length === 0) {
    throw new Error('DATABASE_URL_PEOPLE environment variable is required');
  }

  await checkAndSeedTestUsers();
  scriptLogger.info('Test users check complete');
}

main().catch((error: unknown) => {
  scriptLogger.error('Test users check failed', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
