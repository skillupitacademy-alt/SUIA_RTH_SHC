import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { db, users, roles } from '@quiz/db';
import { scriptLogger } from './logger';

const root = resolve(process.cwd());
dotenv.config({ path: resolve(root, '.env.local') });
dotenv.config({ path: resolve(root, '.env') });

async function checkDatabase() {
  try {
    scriptLogger.info('Checking database connection...');
    
    // Try to list all roles
    scriptLogger.info('Fetching roles...');
    const allRoles = await db.select().from(roles);
    scriptLogger.info(`Found ${allRoles.length} roles:`, { roles: allRoles.map(r => r.name) });

    // Try to list all users
    scriptLogger.info('Fetching users...');
    const allUsers = await db.select({ id: users.id, email: users.email }).from(users).limit(10);
    scriptLogger.info(`Found ${allUsers.length} users (showing first 10):`, { users: allUsers.map(u => u.email) });

  } catch (error) {
    scriptLogger.error('Database check failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

async function main() {
  if (typeof process.env.DATABASE_URL !== 'string' || process.env.DATABASE_URL.trim().length === 0) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  scriptLogger.info('DATABASE_URL is set');
  await checkDatabase();
  scriptLogger.info('Database check complete');
}

main().catch((error: unknown) => {
  scriptLogger.error('Script failed', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
