import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { resolve } from 'path';
import { eq } from 'drizzle-orm';
import { db, users, userProfiles, roles, userRoles } from '@quiz/db';
import { scriptLogger } from './logger';

const root = resolve(process.cwd());
dotenv.config({ path: resolve(root, '.env.local') });
dotenv.config({ path: resolve(root, '.env') });

const SALT_ROUNDS = 12;

const TEST_USERS = [
  {
    email: 'ajayshah@gmail.com',
    password: 'testing',
    name: 'Ajay Shah',
    roleName: 'USER',
  },
  {
    email: 'admin@test.com',
    password: 'admin123',
    name: 'Admin User',
    roleName: 'ADMIN',
  },
];

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function ensureRolesExist() {
  const roleNames = ['USER', 'ADMIN', 'SUPER_ADMIN'];
  
  for (const roleName of roleNames) {
    try {
      const existingRoles = await db.select().from(roles).where(eq(roles.name, roleName)).limit(1);

      if (existingRoles.length === 0) {
        scriptLogger.info(`Creating role: ${roleName}`);
        await db.insert(roles).values({ name: roleName });
      } else {
        scriptLogger.info(`Role exists: ${roleName}`);
      }
    } catch (error) {
      scriptLogger.error(`Error checking role ${roleName}`, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}

async function seedQuizTestUsers() {
  await ensureRolesExist();

  for (const testUser of TEST_USERS) {
    scriptLogger.info(`Checking user: ${testUser.email}`);

    const existingUsers = await db.select().from(users).where(eq(users.email, testUser.email)).limit(1);

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      scriptLogger.info(`User exists: ${testUser.email}`, {
        id: existingUser.id,
        emailVerified: existingUser.emailVerified,
        isBlocked: existingUser.isBlocked,
      });

      // Update password and ensure not blocked
      const passwordHash = await hashPassword(testUser.password);
      await db
        .update(users)
        .set({
          passwordHash,
          isBlocked: false,
          emailVerified: true,
          deletedAt: null,
        })
        .where(eq(users.id, existingUser.id));

      // Check if profile exists
      const existingProfiles = await db.select().from(userProfiles).where(eq(userProfiles.userId, existingUser.id)).limit(1);
      
      if (existingProfiles.length > 0) {
        await db
          .update(userProfiles)
          .set({ name: testUser.name })
          .where(eq(userProfiles.userId, existingUser.id));
      } else {
        await db.insert(userProfiles).values({
          userId: existingUser.id,
          name: testUser.name,
        });
      }

      // Ensure correct role
      const roleRecords = await db.select().from(roles).where(eq(roles.name, testUser.roleName)).limit(1);

      if (roleRecords.length > 0) {
        const role = roleRecords[0];
        const existingUserRoles = await db.select().from(userRoles).where(eq(userRoles.userId, existingUser.id));
        const hasRole = existingUserRoles.some(ur => ur.roleId === role.id);
        
        if (!hasRole) {
          scriptLogger.info(`Assigning role ${testUser.roleName} to ${testUser.email}`);
          await db.insert(userRoles).values({
            userId: existingUser.id,
            roleId: role.id,
          }).onConflictDoNothing();
        }
      }

      scriptLogger.info(`Updated user: ${testUser.email}`);
    } else {
      scriptLogger.info(`Creating user: ${testUser.email}`);
      const passwordHash = await hashPassword(testUser.password);

      const [createdUser] = await db
        .insert(users)
        .values({
          email: testUser.email,
          passwordHash,
          emailVerified: true,
          isBlocked: false,
        })
        .returning({ id: users.id });

      // Create profile
      await db.insert(userProfiles).values({
        userId: createdUser.id,
        name: testUser.name,
      });

      // Assign role
      const roleRecords = await db.select().from(roles).where(eq(roles.name, testUser.roleName)).limit(1);

      if (roleRecords.length > 0) {
        await db.insert(userRoles).values({
          userId: createdUser.id,
          roleId: roleRecords[0].id,
        });
      }

      scriptLogger.info(`Created user: ${testUser.email}`, { id: createdUser.id });
    }
  }
}

async function main() {
  if (typeof process.env.DATABASE_URL !== 'string' || process.env.DATABASE_URL.trim().length === 0) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  await seedQuizTestUsers();
  scriptLogger.info('Quiz test users seed complete');
}

main().catch((error: unknown) => {
  scriptLogger.error('Quiz test users seed failed', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
